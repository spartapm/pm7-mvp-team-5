import type { Metadata, Viewport } from "next";
import { AppProvider } from "@/lib/store";
import { ToastHost } from "@/components/ToastHost";
import "./globals.css";

export const metadata: Metadata = {
  title: "컬리 · 리뷰 상황 태그 MVP",
  description:
    "pm7-mvp-team-5 — 리뷰 작성 시 상황 태그 선택 + 조회 시 배지 노출 프로토타입",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#5F0080",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body>
        <AppProvider>
          {children}
          <ToastHost />
        </AppProvider>
      </body>
    </html>
  );
}
