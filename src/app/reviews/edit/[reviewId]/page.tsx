"use client";

import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { MobileShell } from "@/components/MobileShell";
import { ReviewForm } from "@/components/ReviewForm";
import { getProduct } from "@/lib/data";
import { useApp } from "@/lib/store";

export default function EditReviewPage() {
  const params = useParams<{ reviewId: string }>();
  const router = useRouter();
  const { reviews, hydrated } = useApp();
  const review = reviews.find((r) => r.id === params.reviewId);
  const product = review ? getProduct(review.productId) : undefined;

  if (!hydrated) {
    return (
      <MobileShell>
        <Header title="후기 수정" showBack />
        <div className="p-4 space-y-3">
          <div className="skeleton h-16 rounded-lg" />
          <div className="skeleton h-48 rounded-xl" />
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
