import Link from "next/link";
import { formatPrice } from "@/lib/data";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const discounted = product.salePrice < product.price;
  const rate = discounted
    ? Math.round((1 - product.salePrice / product.price) * 100)
    : 0;

  return (
    <Link
      href={`/products/${product.id}`}
      className="block rounded-[10px] border-[1.5px] border-kurly-purple overflow-hidden bg-white active:bg-kurly-purple-soft/30"
    >
      <div className="flex gap-3 p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt=""
          className="w-[92px] h-[92px] rounded-[6px] object-cover bg-[#EDEDED] flex-shrink-0"
        />
        <div className="min-w-0 flex-1 py-0.5 flex flex-col justify-center">
          <p className="text-[14px] font-semibold text-kurly-ink line-clamp-2 leading-[1.35]">
            {product.name}
          </p>
          <div className="mt-2 flex items-baseline gap-1.5">
            {discounted && (
              <span className="text-[15px] font-bold text-kurly-danger">
                {rate}%
              </span>
            )}
            <span className="text-[16px] font-bold text-kurly-ink">
              {formatPrice(product.salePrice)}
            </span>
          </div>
          {discounted && (
            <p className="text-[12px] text-kurly-faint line-through mt-0.5">
              {formatPrice(product.price)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
