"use client";

import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { MobileShell } from "@/components/MobileShell";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/lib/data";
import { COMING_SOON_MESSAGE, randomImage } from "@/lib/placeholders";
import { useApp } from "@/lib/store";

const shortcuts = [
  { label: "자주산 상품", seed: "home-shortcut-1" },
  { label: "단독특가", seed: "home-shortcut-2" },
  { label: "멤버스특가", seed: "home-shortcut-3" },
  { label: "특가", seed: "home-shortcut-4" },
];

export default function HomePage() {
  const { showToast } = useApp();
  const soon = () => showToast(COMING_SOON_MESSAGE);

  return (
    <MobileShell>
      <Header showLogo showBell border={false} />
      <main className="pb-[72px]">
        <button
          type="button"
          onClick={soon}
          className="mx-4 mt-2 block w-[calc(100%-2rem)] h-[148px] rounded-[8px] overflow-hidden relative"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={randomImage("kurly-promo-banner", 860, 400)}
            alt=""
            className="w-full h-full object-cover"
          />
          <span className="absolute inset-0 bg-black/25 flex items-end p-3">
            <span className="text-white text-[14px] font-semibold drop-shadow">
              이주의 특가 프로모션
            </span>
          </span>
        </button>

        <div className="grid grid-cols-4 gap-1 px-4 py-5">
          {shortcuts.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={soon}
              className="flex flex-col items-center gap-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={randomImage(item.seed, 120, 120)}
                alt=""
                className="w-[52px] h-[52px] rounded-full object-cover bg-[#EDEDED]"
              />
              <span className="text-[11px] text-kurly-sub text-center leading-tight">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        <section className="px-4 pb-4">
          <h2 className="text-[17px] font-bold text-kurly-ink mb-3 tracking-tight">
            지금 가장 많이 담는 특가
          </h2>
          <div className="space-y-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      </main>
      <BottomNav />
    </MobileShell>
  );
}
