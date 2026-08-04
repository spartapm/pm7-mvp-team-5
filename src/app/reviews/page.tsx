"use client";

import { Suspense } from "react";
import ReviewsPage from "./ReviewsClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-kurly-muted">
          로딩 중…
        </div>
      }
    >
      <ReviewsPage />
    </Suspense>
  );
}
