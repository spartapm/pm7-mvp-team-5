"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { MobileShell } from "@/components/MobileShell";
import { ReviewForm } from "@/components/ReviewForm";
import { getProduct } from "@/lib/data";
import { EMPTY_TAGS } from "@/lib/tags";
import { useApp } from "@/lib/store";

export default function WriteReviewPage() {
  const params = useParams<{ productId: string }>();
  const router = useRouter();
  const { hydrated, isLoggedIn } = useApp();
  const product = getProduct(params.productId);

  useEffect(() => {
    if (hydrated && !isLoggedIn) {
      router.replace(
        `/login?redirect=${encodeURIComponent(`/reviews/write/${params.productId}`)}`
      );
    }
  }, [hydrated, isLoggedIn, router, params.productId]);

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
        initialContent=""
        initialTags={EMPTY_TAGS}
      />
    </MobileShell>
  );
}
