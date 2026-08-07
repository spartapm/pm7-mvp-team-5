"use client";

import { Suspense, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { MobileShell } from "@/components/MobileShell";
import { ReviewForm } from "@/components/ReviewForm";
import { getProduct } from "@/lib/data";
import { EMPTY_TAGS } from "@/lib/tags";
import { useApp } from "@/lib/store";

function WriteInner() {
  const params = useParams<{ productId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const { hydrated, isLoggedIn } = useApp();
  const product = getProduct(params.productId);
  const writableId = search.get("wid") || undefined;

  useEffect(() => {
    if (hydrated && !isLoggedIn) {
      router.replace(
        `/login?redirect=${encodeURIComponent(
          `/reviews/write/${params.productId}${writableId ? `?wid=${writableId}` : ""}`
        )}`
      );
    }
  }, [hydrated, isLoggedIn, router, params.productId, writableId]);

  if (!hydrated || !isLoggedIn) {
    return (
      <MobileShell>
        <div className="py-24 text-center text-kurly-muted text-[14px]">
          로그인 확인 중…
        </div>
      </MobileShell>
    );
  }

  if (!product) {
    return (
      <MobileShell>
        <Header title="후기 작성" showBack />
        <p className="p-6 text-center text-kurly-muted">상품을 찾을 수 없어요.</p>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <Header
        title="후기 작성"
        showBack
        onBack={() => router.push("/reviews?tab=writable")}
      />
      <ReviewForm
        mode="create"
        product={product}
        writableId={writableId}
        initialContent=""
        initialTags={EMPTY_TAGS}
      />
    </MobileShell>
  );
}

export default function WriteReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-kurly-muted">
          로딩 중…
        </div>
      }
    >
      <WriteInner />
    </Suspense>
  );
}
