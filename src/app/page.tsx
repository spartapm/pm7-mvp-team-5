"use client";

import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { MobileShell } from "@/components/MobileShell";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/lib/data";

const shortcuts = ["자주산 상품", "단독특가", "멤버스특가", "특가"];

export default function HomePage() {
  return (
    <MobileShell>
      <Header showLogo showBell border={false} />
      <main className="pb-[72px]">
        {/* 와이어프레임: 프로모션 배너 플레이스홀더 */}
        <div className="mx-4 mt-2 h-[148px] rounded-[8px] bg-[#EDEDED] flex items-center justify-center px-6 text-center">
          <p className="text-[13px] text-kurly-muted leading-relaxed">
            프로모션 배너 영역
            <br />
            <span className="text-[12px] text-kurly-faint">
              (비활성 · MVP 범위 아님)
            </span>
          </p>
        </div>

        <div className="grid grid-cols-4 gap-1 px-4 py-5">
          {shortcuts.map((label) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 pointer-events-none"
            >
              <div className="w-[52px] h-[52px] rounded-full bg-[#EDEDED]" />
              <span className="text-[11px] text-kurly-sub text-center leading-tight">
                {label}
              </span>
            </div>
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
