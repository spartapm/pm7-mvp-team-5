import Link from "next/link";
import { formatPrice, formatReviewCount } from "@/lib/data";
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

/** 홈 가로 스크롤용 카드 */
export function ProductScrollCard({ product }: { product: Product }) {
  const discounted = product.salePrice < product.price;
  const rate = discounted
    ? Math.round((1 - product.salePrice / product.price) * 100)
    : 0;

  return (
    <Link
      href={`/products/${product.id}`}
      className="w-[148px] flex-shrink-0 active:opacity-90"
    >
      <div className="relative w-[148px] h-[148px] rounded-[6px] overflow-hidden bg-[#EDEDED]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
      <p className="mt-2 text-[13px] font-medium text-kurly-ink line-clamp-2 leading-snug min-h-[34px]">
        {product.name}
      </p>
      <div className="mt-1 flex items-baseline gap-1">
        {discounted && (
          <span className="text-[14px] font-bold text-kurly-danger">{rate}%</span>
        )}
        <span className="text-[15px] font-bold text-kurly-ink">
          {formatPrice(product.salePrice)}
        </span>
      </div>
      {discounted && (
        <p className="text-[12px] text-kurly-faint line-through">
          {formatPrice(product.price)}
        </p>
      )}
      <p className="mt-1.5 flex items-center gap-1 text-[12px] text-kurly-muted">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M7 3h10a2 2 0 0 1 2 2v16l-7-3-7 3V5a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
        {formatReviewCount(product.reviewCount)}
      </p>
    </Link>
  );
}
