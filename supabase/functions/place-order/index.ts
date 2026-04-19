import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  product_id: string;
  quantity: number;
}

interface OrderRequest {
  items: CartItem[];
  building: string;
  floor?: string | null;
  apartment?: string | null;
  payment_method: "cod" | "online";
  notes?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate user with their JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = (await req.json()) as OrderRequest;

    // Basic validation
    if (!body.building || typeof body.building !== "string" || body.building.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Building is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return new Response(JSON.stringify({ error: "Cart is empty" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!["cod", "online"].includes(body.payment_method)) {
      return new Response(JSON.stringify({ error: "Invalid payment method" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    for (const it of body.items) {
      if (!it.product_id || typeof it.product_id !== "string") {
        return new Response(JSON.stringify({ error: "Invalid product id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!Number.isInteger(it.quantity) || it.quantity < 1 || it.quantity > 999) {
        return new Response(JSON.stringify({ error: "Invalid quantity" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Service-role client for trusted writes
    const admin = createClient(supabaseUrl, serviceKey);

    // Fetch real prices and store ids server-side
    const productIds = body.items.map((i) => i.product_id);
    const { data: products, error: prodErr } = await admin
      .from("products")
      .select("id, price, store_id, stock, is_active")
      .in("id", productIds);

    if (prodErr || !products || products.length !== productIds.length) {
      return new Response(JSON.stringify({ error: "One or more products not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate stock & active
    for (const it of body.items) {
      const p = productMap.get(it.product_id)!;
      if (!p.is_active) {
        return new Response(JSON.stringify({ error: "Product unavailable" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (p.stock < it.quantity) {
        return new Response(JSON.stringify({ error: "Insufficient stock" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Group by store
    const groups = new Map<string, { items: CartItem[]; total: number }>();
    for (const it of body.items) {
      const p = productMap.get(it.product_id)!;
      const g = groups.get(p.store_id) ?? { items: [], total: 0 };
      g.items.push(it);
      g.total += Number(p.price) * it.quantity;
      groups.set(p.store_id, g);
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.floor(1000 + Math.random() * 9000);
    const baseOrderNum = `GRK-${dateStr}-${rand}`;
    const createdOrderNumbers: string[] = [];

    for (const [storeId, group] of groups) {
      const orderNum = `${baseOrderNum}-${storeId.slice(0, 4)}`;
      const { data: order, error: orderErr } = await admin
        .from("orders")
        .insert({
          customer_id: userId,
          store_id: storeId,
          order_number: orderNum,
          total: group.total,
          building: body.building.trim(),
          floor: body.floor?.trim() || null,
          apartment: body.apartment?.trim() || null,
          payment_method: body.payment_method,
          notes: body.notes?.trim() || null,
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      const items = group.items.map((it) => ({
        order_id: order.id,
        product_id: it.product_id,
        quantity: it.quantity,
        unit_price: Number(productMap.get(it.product_id)!.price),
      }));

      const { error: itemsErr } = await admin.from("order_items").insert(items);
      if (itemsErr) throw itemsErr;

      // Decrement stock for each ordered product (best-effort post-write).
      // The pre-check above + this update keeps stock honest for a community marketplace.
      for (const it of group.items) {
        const p = productMap.get(it.product_id)!;
        const remaining = Math.max(0, Number(p.stock) - it.quantity);
        const { error: stockErr } = await admin
          .from("products")
          .update({ stock: remaining })
          .eq("id", it.product_id);
        if (stockErr) console.error("stock decrement failed for", it.product_id, stockErr);
        // Update in-memory map so concurrent items in the same order don't oversell
        productMap.set(it.product_id, { ...p, stock: remaining });
      }

      createdOrderNumbers.push(orderNum);
    }

    return new Response(
      JSON.stringify({ order_number: baseOrderNum, orders: createdOrderNumbers }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("place-order error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
