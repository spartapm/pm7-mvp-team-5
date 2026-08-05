"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { MobileShell } from "@/components/MobileShell";
import { useApp } from "@/lib/store";

export default function MyPage() {
  const router = useRouter();
  const { getWritable, user, isLoggedIn, hydrated } = useApp();
  const writableCount = getWritable().length;

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

        <div className="mx-4 h-[96px] rounded-[10px] bg-[#EDEDED] flex items-center justify-center text-center px-4">
          <p className="text-[13px] text-kurly-muted leading-relaxed">
            혜택 · 적립금 영역
            <br />
            <span className="text-[12px] text-kurly-faint">
              (비활성 · MVP 범위 아님)
            </span>
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2 px-4 py-7">
          {[
            { label: "주문내역", active: false },
            { label: "쿠폰", active: false },
            { label: "찜", active: false },
            { label: "후기", active: true, badge: writableCount },
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
              <div
                key={item.label}
                className="flex flex-col items-center gap-2.5 pointer-events-none"
              >
                <div className="w-[58px] h-[58px] rounded-full bg-[#EDEDED]" />
                <span className="text-[13px] text-kurly-muted">{item.label}</span>
              </div>
            )
          )}
        </div>

        <section className="px-4">
          <h2 className="text-[15px] font-bold text-kurly-ink mb-2.5">
            자주 산 상품
          </h2>
          <div className="h-[140px] rounded-[10px] bg-[#EDEDED] flex items-center justify-center text-center px-4">
            <p className="text-[13px] text-kurly-muted leading-relaxed">
              상품 리스트 영역
              <br />
              <span className="text-[12px] text-kurly-faint">
                (비활성 · MVP 범위 아님)
              </span>
            </p>
          </div>
        </section>
      </main>
      <BottomNav />
    </MobileShell>
  );
}
