"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { MobileShell } from "@/components/MobileShell";
import { getProduct } from "@/lib/data";
import { useApp } from "@/lib/store";

export default function ReviewsClient() {
  const router = useRouter();
  const params = useSearchParams();
  const tab = params.get("tab") === "written" ? "written" : "writable";
  const { getWritable, getMyReviews, hydrated } = useApp();

  const writable = getWritable();
  const myReviews = useMemo(() => getMyReviews(), [getMyReviews]);

  return (
    <MobileShell bg="bg-white">
      <Header
        title="상품 후기"
        showBack
        showBell
        onBack={() => router.push("/mypage")}
      />

      <div className="sticky top-[52px] z-30 bg-white border-b border-kurly-line-strong">
        <div className="grid grid-cols-2">
          <TabButton
            active={tab === "writable"}
            label="작성 가능 후기"
            onClick={() => router.replace("/reviews?tab=writable")}
          />
          <TabButton
            active={tab === "written"}
            label="작성한 후기"
            onClick={() => router.replace("/reviews?tab=written")}
          />
        </div>
      </div>

      <main className="pb-10 min-h-[70vh] bg-white">
        {!hydrated ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-[120px] rounded-[10px]" />
            ))}
          </div>
        ) : tab === "writable" ? (
          <section className="p-4 space-y-3">
            <p className="text-[13px] text-kurly-muted mb-1">작성 가능 후기</p>
            {writable.length === 0 ? (
              <EmptyState text="작성 가능한 후기가 없어요." />
            ) : (
              writable.map((item) => {
                const product = getProduct(item.productId);
                if (!product) return null;
                return (
                  <div
                    key={item.productId}
                    className="rounded-[10px] border-[1.5px] border-kurly-purple bg-white p-3.5"
                  >
                    <div className="flex gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.image}
                        alt=""
                        className="w-[68px] h-[68px] rounded-[6px] object-cover bg-[#EDEDED] flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="text-[14px] font-semibold text-kurly-ink line-clamp-2 leading-[1.35]">
                          {product.name}
                        </p>
                        <p className="text-[12px] text-kurly-muted mt-1.5">
                          {item.deadline}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Link
                        href={`/reviews/write/${product.id}`}
                        className="h-9 min-w-[88px] px-4 rounded-[6px] bg-kurly-purple text-white text-[13px] font-semibold inline-flex items-center justify-center"
                      >
                        후기 작성
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        ) : (
          <section className="p-4 space-y-3">
            <p className="text-[13px] text-kurly-muted mb-1">작성한 후기</p>
            {myReviews.length === 0 ? (
              <EmptyState text="작성한 후기가 없어요." />
            ) : (
              myReviews.map((review) => {
                const product = getProduct(review.productId);
                return (
                  <div
                    key={review.id}
                    className="rounded-[10px] border-[1.5px] border-kurly-purple bg-white p-3.5"
                  >
                    <div className="flex gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product?.image ?? ""}
                        alt=""
                        className="w-[68px] h-[68px] rounded-[6px] object-cover bg-[#EDEDED] flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="text-[14px] font-semibold text-kurly-ink line-clamp-2 leading-[1.35]">
                          {review.productName}
                        </p>
                        <p className="text-[12px] text-kurly-muted mt-1.5 line-clamp-1">
                          {review.content}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Link
                        href={`/reviews/edit/${review.id}`}
                        className="h-9 min-w-[72px] px-4 rounded-[6px] border-[1.5px] border-kurly-purple text-kurly-purple text-[13px] font-semibold inline-flex items-center justify-center bg-white"
                      >
                        수정
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        )}
      </main>
    </MobileShell>
  );
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 text-[14px] ${
        active
          ? "text-kurly-purple font-bold border-b-2 border-kurly-purple"
          : "text-kurly-muted font-medium"
      }`}
    >
      {label}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[10px] border border-kurly-line-strong py-16 text-center text-[14px] text-kurly-muted">
      {text}
    </div>
  );
}
