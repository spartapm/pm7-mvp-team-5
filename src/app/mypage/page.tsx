"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { MobileShell } from "@/components/MobileShell";
import { assets } from "@/lib/data";
import { COMING_SOON_MESSAGE } from "@/lib/placeholders";
import { useApp } from "@/lib/store";

export default function MyPage() {
  const router = useRouter();
  const { user, isLoggedIn, hydrated, showToast, logout } = useApp();
  const soon = () => showToast(COMING_SOON_MESSAGE);

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
          className="mx-4 block w-[calc(100%-2rem)] rounded-[10px] overflow-hidden"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assets["06_mypagebanner1"]}
            alt=""
            className="w-full h-auto object-cover"
          />
        </button>

        <div className="grid grid-cols-4 gap-2 px-4 py-7">
          {[
            {
              label: "주문내역",
              icon: assets["06_mypageicon1"],
              active: false,
            },
            {
              label: "쿠폰",
              icon: assets["06_mypageicon2"],
              active: false,
            },
            {
              label: "찜",
              icon: assets["06_mypageicon3"],
              active: false,
            },
            {
              label: "후기",
              icon: assets["06_mypageicon4"],
              active: true,
            },
          ].map((item) =>
            item.active ? (
              <Link
                key={item.label}
                href="/reviews"
                className="flex flex-col items-center gap-2.5"
              >
                <div className="w-[58px] h-[58px] rounded-full overflow-hidden bg-kurly-purple-soft flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.icon}
                    alt=""
                    className="w-full h-full object-cover"
                  />
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
                <div className="w-[58px] h-[58px] rounded-full overflow-hidden bg-[#EDEDED]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.icon}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[13px] text-kurly-sub">{item.label}</span>
              </button>
            )
          )}
        </div>

        <section className="px-4">
          <h2 className="text-[15px] font-bold text-kurly-ink mb-2.5">
            자주 산 상품
          </h2>
          <button
            type="button"
            onClick={soon}
            className="w-full h-[100px] rounded-[8px] bg-[#F3F3F3] text-[13px] text-kurly-muted"
          >
            상품 리스트 영역 (비활성 · MVP 범위 아님)
          </button>
        </section>

        <div className="px-4 mt-10 mb-4 flex justify-start">
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
            className="text-[14px] text-kurly-sub"
          >
            로그아웃
          </button>
        </div>
      </main>
      <BottomNav />
    </MobileShell>
  );
}
