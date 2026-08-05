"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/store";
import { IconCategory, IconHome, IconSearch, IconUser } from "./Icons";

export function BottomNav() {
  const pathname = usePathname();
  const { isLoggedIn } = useApp();

  const mypageHref = !isLoggedIn
    ? `/login?redirect=${encodeURIComponent("/mypage")}`
    : "/mypage";

  const items = [
    { href: "/", label: "홈", icon: IconHome, active: true },
    { href: "#", label: "카테고리", icon: IconCategory, active: false },
    { href: "#", label: "검색", icon: IconSearch, active: false },
    { href: mypageHref, label: "마이페이지", icon: IconUser, active: true },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile z-40 border-t border-kurly-line-strong bg-white">
      <ul className="grid grid-cols-4 h-[56px] pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const isCurrent =
            item.label === "홈"
              ? pathname === "/"
              : item.label === "마이페이지"
                ? pathname.startsWith("/mypage") || pathname.startsWith("/login")
                : false;
          const Icon = item.icon;
          const enabled = item.active;

          if (!enabled) {
            return (
              <li key={item.label} className="flex items-center justify-center">
                <div className="flex flex-col items-center gap-1 text-kurly-faint pointer-events-none">
                  <div className="w-6 h-6 rounded-[4px] bg-[#ECECEC] flex items-center justify-center">
                    <Icon className="w-[16px] h-[16px]" />
                  </div>
                  <span className="text-[10px] leading-none">{item.label}</span>
                </div>
              </li>
            );
          }

          return (
            <li key={item.label} className="flex items-center justify-center">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 ${
                  isCurrent ? "text-kurly-purple" : "text-kurly-sub"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-[4px] flex items-center justify-center ${
                    isCurrent ? "bg-kurly-purple-soft" : "bg-transparent"
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                <span className="text-[10px] font-medium leading-none">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
