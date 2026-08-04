"use client";

import { useApp } from "@/lib/store";

export function ToastHost() {
  const { toasts } = useApp();
  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-[88px] left-1/2 -translate-x-1/2 z-50 w-full max-w-mobile px-5">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-toast-in mb-2 rounded-[8px] px-4 py-3.5 text-[13px] text-center shadow-toast ${
            t.variant === "error"
              ? "bg-[#FFF1F0] text-[#D4380D] border border-[#FFA39E]"
              : "bg-[#333333]/92 text-white"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
