"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { MobileShell } from "@/components/MobileShell";
import { ReviewForm } from "@/components/ReviewForm";
import { getProduct } from "@/lib/data";
import { useApp } from "@/lib/store";

export default function EditReviewPage() {
  const params = useParams<{ reviewId: string }>();
  const router = useRouter();
  const { reviews, hydrated, isLoggedIn } = useApp();
  const review = reviews.find((r) => r.id === params.reviewId);
  const product = review ? getProduct(review.productId) : undefined;

  useEffect(() => {
    if (hydrated && !isLoggedIn) {
      router.replace(
        `/login?redirect=${encodeURIComponent(`/reviews/edit/${params.reviewId}`)}`
      );
    }
  }, [hydrated, isLoggedIn, router, params.reviewId]);

  if (!hydrated || !isLoggedIn) {
    return (
      <MobileShell>
        <div className="py-24 text-center text-kurly-muted text-[14px]">
          로그인 확인 중…
        </div>
      </MobileShell>
    );
  }

  if (!review || !product) {
    return (
      <MobileShell>
        <Header title="후기 수정" showBack />
        <p className="p-6 text-center text-kurly-muted">후기를 찾을 수 없어요.</p>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <Header
        title="후기 수정"
        showBack
        onBack={() => router.push("/reviews?tab=written")}
      />
      <ReviewForm
        mode="edit"
        product={product}
        reviewId={review.id}
        initialContent={review.content}
        initialTags={review.situationTags}
      />
    </MobileShell>
  );
}
