"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { MobileShell } from "@/components/MobileShell";
import { products } from "@/lib/data";
import { COMING_SOON_MESSAGE, randomImage } from "@/lib/placeholders";
import { useApp } from "@/lib/store";

export default function MyPage() {
  const router = useRouter();
  const { getWritable, user, isLoggedIn, hydrated, showToast } = useApp();
  const writableCount = getWritable().length;
  const soon = () => showToast(COMING_SOON_MESSAGE);
  const frequent = products.slice(0, 4);

  useEffect(() => {
    if (hydrated && !isLoggedIn) {
      router.replace(`/login?redirect=${encodeURIComponent("/mypage")}`);
    }
  }, [hydrated, isLoggedIn, router]);

  if (!hydrated || !isLoggedIn) {
    return (
      <MobileShell>
        <div className="py-24 text-center text-kurly-muted text-[14px]">
          로그인 확인 중…
        </div>
      </MobileShell>
    );
  }

  const displayName = user?.name || "회원";

  return (
    <MobileShell>
      <Header title="마이컬리" titleAlign="left" showBell border={false} />
      <main className="pb-[72px]">
        <div className="px-4 pt-3 pb-4">
          <p className="text-[20px] font-bold tracking-tight">
            <span className="text-kurly-purple">반가워요!</span>{" "}
            <span className="text-kurly-ink">{displayName}님</span>
          </p>
        </div>

        <button
          type="button"
          onClick={soon}
          className="mx-4 h-[96px] w-[calc(100%-2rem)] rounded-[10px] overflow-hidden relative block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={randomImage("mypage-benefit", 800, 240)}
            alt=""
            className="w-full h-full object-cover"
          />
          <span className="absolute inset-0 bg-kurly-purple/55 flex flex-col justify-center px-4">
            <span className="text-white text-[15px] font-bold">혜택 · 적립금</span>
            <span className="text-white/90 text-[12px] mt-1">지금 확인하기</span>
          </span>
        </button>

        <div className="grid grid-cols-4 gap-2 px-4 py-7">
          {[
            { label: "주문내역", seed: "mypage-order", active: false },
            { label: "쿠폰", seed: "mypage-coupon", active: false },
            { label: "찜", seed: "mypage-wish", active: false },
            { label: "후기", seed: "mypage-review", active: true, badge: writableCount },
          ].map((item) =>
            item.active ? (
              <Link
                key={item.label}
                href="/reviews"
                className="flex flex-col items-center gap-2.5"
              >
                <div className="relative w-[58px] h-[58px] rounded-full bg-kurly-purple flex items-center justify-center">
                  <span className="text-white text-[13px] font-bold">후기</span>
                  {!!item.badge && item.badge > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1.5 rounded-full bg-kurly-purple border-2 border-white text-white text-[11px] font-bold leading-[16px] text-center shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[13px] font-semibold text-kurly-purple">
                  {item.label}
                </span>
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                onClick={soon}
                className="flex flex-col items-center gap-2.5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={randomImage(item.seed, 120, 120)}
                  alt=""
                  className="w-[58px] h-[58px] rounded-full object-cover bg-[#EDEDED]"
                />
                <span className="text-[13px] text-kurly-sub">{item.label}</span>
              </button>
            )
          )}
        </div>

        <section className="px-4">
          <h2 className="text-[15px] font-bold text-kurly-ink mb-2.5">
            자주 산 상품
          </h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {frequent.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={soon}
                className="w-[108px] flex-shrink-0 text-left"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image || randomImage(`freq-${p.id}`, 220, 220)}
                  alt=""
                  className="w-[108px] h-[108px] rounded-[8px] object-cover bg-[#EDEDED]"
                />
                <p className="mt-1.5 text-[12px] text-kurly-ink line-clamp-2 leading-snug">
                  {p.name}
                </p>
              </button>
            ))}
          </div>
        </section>
      </main>
      <BottomNav />
    </MobileShell>
  );
}
