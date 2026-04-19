import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import type { Product } from "@/data/mockData";

const conditionStyles = {
  new: "bg-success/15 text-success",
  used: "bg-accent/15 text-accent",
  used_as_new: "bg-primary/15 text-primary",
};

const conditionLabels = {
  new: "New",
  used: "Used",
  used_as_new: "Used as New",
};

const pricingBadge = {
  fixed: null,
  negotiable: "Negotiable",
  auction: "Auction",
};

const ProductCard = ({ product }: { product: Product }) => {
  return (
    <Link
      to={`/product/${product.id}`}
      className="group block rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.images[0]}
          alt={product.name_en}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Condition badge */}
        <span className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-semibold ${conditionStyles[product.condition]}`}>
          {conditionLabels[product.condition]}
        </span>
        {/* Pricing model badge */}
        {pricingBadge[product.pricing_model] && (
          <span className="absolute top-3 right-3 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
            {pricingBadge[product.pricing_model]}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <Link
          to={`/store/${product.store_id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-muted-foreground font-medium hover:text-primary inline-block"
        >
          {product.store_name}
        </Link>
        <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {product.name_en}
        </h3>
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
          <span className="text-xs font-medium text-foreground">{product.rating}</span>
          <span className="text-xs text-muted-foreground">({product.reviews_count})</span>
        </div>
        <p className="text-lg font-bold text-primary">
          EGP {product.price.toLocaleString()}
        </p>
        {product.condition === "used" && (
          <span className="inline-block mt-1 text-xs font-semibold text-accent bg-accent/10 rounded-full px-2.5 py-0.5">
            Offer Price
          </span>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
