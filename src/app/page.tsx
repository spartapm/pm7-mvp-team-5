"use client";

import { useRef } from "react";
import { BottomNav } from "@/components/BottomNav";
import { MobileShell } from "@/components/MobileShell";
import { ProductScrollCard } from "@/components/ProductCard";
import { assets, headerAssets, products } from "@/lib/data";
import { COMING_SOON_MESSAGE } from "@/lib/placeholders";
import { useApp } from "@/lib/store";
import Link from "next/link";

const LNB = ["추천", "베스트", "원더특가", "단독", "세일", "패션", "리빙"] as const;

const shortcuts = [
  { label: "첫구매혜택", icon: assets["03_menuicon_1"] },
  { label: "단독특가", icon: assets["03_menuicon_2"] },
  { label: "최저가도전", icon: assets["03_menuicon_3"] },
  { label: "멤버스특가", icon: assets["03_menuicon_4"] },
  { label: "이벤트", icon: assets["03_menuicon_5"] },
  { label: "컬리큐레이터", icon: assets["03_menuicon_6"] },
];

export default function HomePage() {
  const { displayCartCount, showToast } = useApp();
  const soon = () => showToast(COMING_SOON_MESSAGE);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollByCard = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-product-card]");
    const step = (card?.offsetWidth ?? 148) + 12;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <MobileShell>
      {/* 와이어/피드백: Kurly 퍼플 헤더 + 흰 로고/아이콘 */}
      <header className="sticky top-0 z-40 bg-[#5F0080]">
        <div className="h-[52px] px-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center" aria-label="Kurly 홈">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={headerAssets.logo}
              alt="Kurly"
              className="h-[32px] w-auto object-contain"
            />
          </Link>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              aria-label="배송지"
              className="p-1.5"
              onClick={soon}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={headerAssets.location}
                alt=""
                className="w-[22px] h-[22px] object-contain"
              />
            </button>
            <Link href="/cart" className="relative p-1.5" aria-label="장바구니">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={headerAssets.cart}
                alt=""
                className="w-[22px] h-[22px] object-contain"
              />
              {displayCartCount > 0 && (
                <span className="absolute top-0 right-0 min-w-[16px] h-4 px-1 rounded-full bg-kurly-cart text-white text-[10px] font-bold leading-4 text-center">
                  {displayCartCount > 99 ? "99+" : displayCartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
        <nav className="flex overflow-x-auto scrollbar-hide px-2 bg-[#5F0080]">
          {LNB.map((tab) => {
            const active = tab === "추천";
            return (
              <button
                key={tab}
                type="button"
                onClick={active ? undefined : soon}
                className={`flex-shrink-0 px-3 h-10 text-[14px] whitespace-nowrap ${
                  active
                    ? "text-white font-bold border-b-2 border-white"
                    : "text-white/70"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="pb-[72px] bg-white">
        <button
          type="button"
          onClick={soon}
          className="block w-full overflow-hidden relative"
          style={{ aspectRatio: "390 / 290" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assets["02_carousel_5"]}
            alt=""
            className="w-full h-full object-cover"
          />
        </button>

        <div className="grid grid-cols-6 gap-1 px-3 py-5">
          {shortcuts.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={soon}
              className="flex flex-col items-center gap-1.5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.icon}
                alt=""
                className="w-[44px] h-[44px] rounded-[10px] object-cover bg-[#F5F5F5]"
              />
              <span className="text-[10px] text-kurly-sub text-center leading-tight tracking-tight">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        <section className="pb-4 relative">
          <div className="px-4 mb-3 flex items-end justify-between gap-2">
            <div>
              <h2 className="text-[17px] font-bold text-kurly-ink tracking-tight">
                후기가 좋은 상품 추천
              </h2>
              <p className="text-[13px] text-kurly-muted mt-0.5">
                좋은 리뷰가 달린 상품만 추천드려요!
              </p>
            </div>
            <button
              type="button"
              onClick={soon}
              className="text-[13px] text-kurly-sub flex-shrink-0 pb-0.5"
            >
              전체보기 &gt;
            </button>
          </div>

          <div className="relative">
            <button
              type="button"
              aria-label="이전 상품"
              onClick={() => scrollByCard(-1)}
              className="absolute left-1 top-[70px] z-10 w-8 h-8 rounded-full bg-white/95 border border-kurly-line-strong shadow-sm flex items-center justify-center text-kurly-ink"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="다음 상품"
              onClick={() => scrollByCard(1)}
              className="absolute right-1 top-[70px] z-10 w-8 h-8 rounded-full bg-white/95 border border-kurly-line-strong shadow-sm flex items-center justify-center text-kurly-ink"
            >
              ›
            </button>
            <div
              ref={scrollerRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-1"
            >
              {products.map((p) => (
                <div key={p.id} data-product-card>
                  <ProductScrollCard product={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <BottomNav />
    </MobileShell>
  );
}
