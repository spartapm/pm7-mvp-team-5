"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { IconBack, IconBell, IconCart, IconHome } from "./Icons";

type Props = {
  title?: string;
  titleAlign?: "center" | "left";
  showBack?: boolean;
  showHome?: boolean;
  showLogo?: boolean;
  showBell?: boolean;
  onBack?: () => void;
  border?: boolean;
};

export function Header({
  title,
  titleAlign = "center",
  showBack = false,
  showHome = false,
  showLogo = false,
  showBell = true,
  onBack,
  border = true,
}: Props) {
  const router = useRouter();
  const { cartCount } = useApp();

  return (
    <header
      className={`sticky top-0 z-40 bg-white ${
        border ? "border-b border-kurly-line-strong" : ""
      }`}
    >
      <div className="h-[52px] px-3.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-0.5 min-w-[76px]">
          {showBack && (
            <button
              type="button"
              aria-label="뒤로가기"
              className="p-1 -ml-1 text-kurly-ink"
              onClick={() => (onBack ? onBack() : router.back())}
            >
              <IconBack className="w-[22px] h-[22px]" />
            </button>
          )}
          {showLogo && <span className="kurly-logo ml-0.5">Kurly</span>}
          {title && titleAlign === "left" && !showLogo && (
            <h1 className="text-[18px] font-bold text-[#555] tracking-tight ml-0.5">
              {title}
            </h1>
          )}
        </div>

        <div className="flex-1 min-w-0 text-center">
          {title && titleAlign === "center" && (
            <h1 className="text-[16px] font-semibold text-kurly-ink truncate px-1">
              {title}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-0.5 min-w-[76px] justify-end text-kurly-ink">
          {showHome && (
            <Link href="/" aria-label="홈" className="p-1.5">
              <IconHome className="w-[22px] h-[22px]" />
            </Link>
          )}
          {showBell && (
            <button type="button" aria-label="알림" className="p-1.5">
              <IconBell className="w-[22px] h-[22px] text-kurly-gold" />
            </button>
          )}
          <div className="relative p-1.5" aria-label="장바구니">
            <IconCart className="w-[22px] h-[22px]" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 min-w-[16px] h-4 px-1 rounded-full bg-kurly-cart text-white text-[10px] font-bold leading-4 text-center">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
