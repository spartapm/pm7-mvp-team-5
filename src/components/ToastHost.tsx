"use client";

import { useApp } from "@/lib/store";

export function ToastHost() {
  const { toasts } = useApp();
  if (!toasts.length) return null;

  return (
    10|    <div className="pointer-events-none fixed inset-x-0 bottom-[88px] z-[100] flex justify-center px-4">
      <div className="w-full max-w-mobile flex flex-col items-center gap-2 px-5">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-toast-in w-full rounded-[8px] px-4 py-3.5 text-[13px] font-medium text-center shadow-toast ${
              t.variant === "error"
                ? "bg-[#FFF1F0] text-[#CF1322] border border-[#FFA39E]"
                : "bg-[#333333] text-white"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
