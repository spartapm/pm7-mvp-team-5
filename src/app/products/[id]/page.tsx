"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { IconHeart } from "@/components/Icons";
import { MobileShell } from "@/components/MobileShell";
import { ReviewCard, ReviewCardSkeleton } from "@/components/ReviewCard";
import { formatPrice, getProduct } from "@/lib/data";
import { useApp } from "@/lib/store";

function ProductDetailInner() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const product = getProduct(params.id);
  const { getProductReviews, addToCart, hydrated } = useApp();
  const initialTab =
    search.get("tab") === "reviews" ? "reviews" : "description";
  const [tab, setTab] = useState<"description" | "reviews">(initialTab);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const reviews = useMemo(
    () => getProductReviews(params.id),
    [getProductReviews, params.id]
  );

  useEffect(() => {
    if (tab !== "reviews") return;
    setLoadingReviews(true);
    const t = window.setTimeout(() => setLoadingReviews(false), 400);
    return () => window.clearTimeout(t);
  }, [tab, params.id]);

  if (!product) {
    return (
      <MobileShell>
        <Header title="상품" showBack showHome showBell={false} />
        <p className="p-6 text-center text-kurly-muted">상품을 찾을 수 없어요.</p>
      </MobileShell>
    );
  }

  const reviewCount = Math.max(product.reviewCount, reviews.length);
  const discounted = product.salePrice < product.price;
  const rate = discounted
    ? Math.round((1 - product.salePrice / product.price) * 100)
    : 0;

  return (
    <MobileShell>
      <Header title={product.name} showBack showHome showBell={false} />

      <div className="sticky top-[52px] z-30 bg-white border-b border-kurly-line-strong">
        <div className="grid grid-cols-4 text-[13px]">
          {(
            [
              ["description", "상품설명"],
              ["detail", "상세정보"],
              ["reviews", `후기 ${reviewCount.toLocaleString()}`],
              ["inquiry", "문의"],
            ] as const
          ).map(([key, label]) => {
            const enabled = key === "description" || key === "reviews";
            const active =
              (key === "description" && tab === "description") ||
              (key === "reviews" && tab === "reviews");
            return (
              <button
                key={key}
                type="button"
                disabled={!enabled}
                onClick={() => {
                  if (key === "description") {
                    setTab("description");
                    router.replace(`/products/${product.id}`);
                  }
                  if (key === "reviews") {
                    setTab("reviews");
                    router.replace(`/products/${product.id}?tab=reviews`);
                  }
                }}
                className={`h-11 truncate px-1 ${
                  !enabled
                    ? "text-kurly-faint"
                    : active
                      ? "text-kurly-purple font-bold border-b-2 border-kurly-purple"
                      : "text-kurly-sub"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="pb-[84px]">
        {tab === "description" ? (
          <section>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image}
              alt=""
              className="w-full aspect-square object-cover bg-[#EDEDED]"
            />
            <div className="p-4">
              <p className="text-[12px] text-kurly-purple font-semibold mb-1">
                {product.brand}
              </p>
              <h2 className="text-[18px] font-bold text-kurly-ink leading-snug tracking-tight">
                {product.name}
              </h2>
              <p className="text-[13px] text-kurly-muted mt-1.5">{product.unit}</p>
              <div className="mt-3 flex items-baseline gap-2">
                {discounted && (
                  <span className="text-[20px] font-bold text-kurly-danger">
                    {rate}%
                  </span>
                )}
                <span className="text-[22px] font-bold text-kurly-ink">
                  {formatPrice(product.salePrice)}
                </span>
              </div>
              {discounted && (
                <p className="text-[13px] text-kurly-faint line-through mt-0.5">
                  {formatPrice(product.price)}
                </p>
              )}
              <div className="mt-6 h-[160px] rounded-[8px] bg-[#EDEDED] flex items-center justify-center text-center px-4">
                <p className="text-[13px] text-kurly-muted">
                  상품 이미지 · 설명 영역
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setTab("reviews");
                router.replace(`/products/${product.id}?tab=reviews`);
              }}
              className="w-full px-4 pb-5 text-right text-[13px] text-kurly-sub"
            >
              후기 {reviewCount.toLocaleString()}건 &gt;
            </button>
          </section>
        ) : (
          <section>
            <div className="px-4 py-3.5 flex items-center justify-between border-b border-kurly-line">
              <p className="text-[14px] font-bold text-kurly-ink">
                총 {reviews.length.toLocaleString()}개
              </p>
              <div className="flex items-center gap-3 text-[13px] text-kurly-sub">
                <button type="button" className="inline-flex items-center gap-0.5">
                  추천순 <span className="text-[10px]">▾</span>
                </button>
                <button type="button" className="inline-flex items-center gap-1">
                  <FilterIcon />
                  필터
                </button>
              </div>
            </div>
            <div className="px-4 pt-3 pb-1">
              <button
                type="button"
                className="h-8 px-3 rounded-full border border-kurly-line-strong text-[12px] text-kurly-sub bg-white"
              >
                상품 옵션 ▾
              </button>
            </div>

            {!hydrated || loadingReviews ? (
              <>
                <ReviewCardSkeleton />
                <ReviewCardSkeleton />
                <ReviewCardSkeleton />
              </>
            ) : reviews.length === 0 ? (
              <p className="py-20 text-center text-kurly-muted">
                아직 후기가 없어요.
              </p>
            ) : (
              reviews.map((r) => <ReviewCard key={r.id} review={r} />)
            )}
          </section>
        )}
      </main>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile bg-white border-t border-kurly-line-strong px-3 py-2.5 flex gap-2">
        <button
          type="button"
          className="w-12 h-12 rounded-[6px] border border-kurly-line-strong flex items-center justify-center text-kurly-ink bg-white flex-shrink-0"
          aria-label="찜"
        >
          <IconHeart className="w-6 h-6" />
        </button>
        <button
          type="button"
          onClick={addToCart}
          className="flex-1 h-12 rounded-[6px] bg-kurly-purple text-white text-[16px] font-bold active:bg-kurly-purple-dark"
        >
          장바구니 담기
        </button>
      </div>
    </MobileShell>
  );
}

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ProductPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-kurly-muted">
          로딩 중…
        </div>
      }
    >
      <ProductDetailInner />
    </Suspense>
  );
}
