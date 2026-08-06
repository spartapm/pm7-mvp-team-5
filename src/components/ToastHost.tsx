"use client";

import { useApp } from "@/lib/store";

export function ToastHost() {
  const { toasts } = useApp();
  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[52px] z-[100] flex justify-center px-4">
      <div className="w-full max-w-mobile flex flex-col items-center gap-2 px-5">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-toast-in w-full rounded-[8px] px-4 py-3.5 text-[13px] font-medium shadow-toast flex items-center justify-center gap-2 ${
              t.variant === "error"
                ? "bg-[#FFF1F0] text-[#CF1322] border border-[#FFA39E]"
                : "bg-[#333333] text-white"
            }`}
          >
            {t.variant !== "error" && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden
                className="flex-shrink-0"
              >
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
                <path
                  d="M4.8 8.2 7 10.3 11.2 5.8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            <span className="text-center">{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
