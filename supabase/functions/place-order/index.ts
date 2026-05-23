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
  // Guest-only fields (ignored if authenticated)
  guest_name?: string | null;
  guest_phone?: string | null;
  guest_email?: string | null;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Optional auth — guests are allowed
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData } = await userClient.auth.getUser();
      if (userData?.user) userId = userData.user.id;
    }

    const body = (await req.json()) as OrderRequest;

    // Basic validation
    if (!body.building || typeof body.building !== "string" || body.building.trim().length === 0) {
      return json({ error: "Building is required" }, 400);
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return json({ error: "Cart is empty" }, 400);
    }
    if (!["cod", "online"].includes(body.payment_method)) {
      return json({ error: "Invalid payment method" }, 400);
    }
    for (const it of body.items) {
      if (!it.product_id || typeof it.product_id !== "string") {
        return json({ error: "Invalid product id" }, 400);
      }
      if (!Number.isInteger(it.quantity) || it.quantity < 1 || it.quantity > 999) {
        return json({ error: "Invalid quantity" }, 400);
      }
    }

    // Guest validation (only required when not authenticated)
    let guestName: string | null = null;
    let guestPhone: string | null = null;
    let guestEmail: string | null = null;
    if (!userId) {
      const name = (body.guest_name ?? "").trim();
      const phoneDigits = (body.guest_phone ?? "").replace(/[^0-9]/g, "");
      if (name.length < 2 || name.length > 100) {
        return json({ error: "Full name is required" }, 400);
      }
      if (phoneDigits.length < 8 || phoneDigits.length > 20) {
        return json({ error: "Valid phone number is required" }, 400);
      }
      guestName = name;
      guestPhone = phoneDigits;
      const email = (body.guest_email ?? "").trim();
      if (email) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
          return json({ error: "Invalid email" }, 400);
        }
        guestEmail = email;
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
      return json({ error: "One or more products not found" }, 400);
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const it of body.items) {
      const p = productMap.get(it.product_id)!;
      if (!p.is_active) return json({ error: "Product unavailable" }, 400);
      if (p.stock < it.quantity) return json({ error: "Insufficient stock" }, 400);
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
          guest_name: userId ? null : guestName,
          guest_phone: userId ? null : guestPhone,
          guest_email: userId ? null : guestEmail,
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

      for (const it of group.items) {
        const p = productMap.get(it.product_id)!;
        const remaining = Math.max(0, Number(p.stock) - it.quantity);
        const { error: stockErr } = await admin
          .from("products")
          .update({ stock: remaining })
          .eq("id", it.product_id);
        if (stockErr) console.error("stock decrement failed for", it.product_id, stockErr);
        productMap.set(it.product_id, { ...p, stock: remaining });
      }

      createdOrderNumbers.push(orderNum);
    }

    return json({
      order_number: baseOrderNum,
      orders: createdOrderNumbers,
      guest: !userId,
      guest_phone: guestPhone,
    });
  } catch (err) {
    console.error("place-order error:", err);
    return json({ error: "An unexpected error occurred. Please try again." }, 500);
  }
});
