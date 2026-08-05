"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IconCamera } from "@/components/Icons";
import { SituationTagPicker } from "@/components/SituationTagPicker";
import { COMING_SOON_MESSAGE } from "@/lib/placeholders";
import { EMPTY_TAGS } from "@/lib/tags";
import type { Product, SituationTags } from "@/lib/types";
import { useApp } from "@/lib/store";

type Mode = "create" | "edit";

type Props = {
  mode: Mode;
  product: Product;
  reviewId?: string;
  initialContent?: string;
  initialTags?: SituationTags;
};

export function ReviewForm({
  mode,
  product,
  reviewId,
  initialContent = "",
  initialTags = EMPTY_TAGS,
}: Props) {
  const router = useRouter();
  const { createReview, updateReview, showToast } = useApp();
  const [content, setContent] = useState(initialContent);
  const [tags, setTags] = useState<SituationTags>(initialTags);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = content.trim().length >= 10;

  const guideCards = useMemo(
    () => [
      "상품을 활용한 나만의 레시피 사진",
      "박스 안에 숨겨진 리얼 상품 사진",
      "분위기를 느낄 수 있는 플레이팅",
    ],
    []
  );

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      const msg =
        mode === "create"
          ? "리뷰 등록에 실패했어요. 다시 시도해주세요"
          : "리뷰 수정에 실패했어요. 다시 시도해주세요";
      setError(msg);
      showToast(msg, "error");
      setSubmitting(false);
      return;
    }

    const result =
      mode === "create"
        ? await createReview({ productId: product.id, content, tags })
        : await updateReview({ reviewId: reviewId!, content, tags });

    if (!result.ok) {
      const msg =
        mode === "create"
          ? "리뷰 등록에 실패했어요. 다시 시도해주세요"
          : "리뷰 수정에 실패했어요. 다시 시도해주세요";
      setError(msg);
      showToast(msg, "error");
      setSubmitting(false);
      return;
    }

    if (mode === "create") {
      // 5-1 복귀 후 작성한 후기 탭 + 완료 토스트
      router.replace("/reviews?tab=written");
      window.setTimeout(() => {
        showToast("후기가 정상적으로 등록되었습니다.");
      }, 80);
    } else {
      router.replace("/reviews?tab=written");
      window.setTimeout(() => {
        showToast("후기가 정상적으로 수정되었습니다.");
      }, 80);
    }
  };

  return (
    <div className="pb-[88px] bg-white">
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-kurly-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt=""
          className="w-12 h-12 rounded-[4px] object-cover bg-[#EDEDED]"
        />
        <p className="text-[14px] font-medium text-kurly-ink line-clamp-2 leading-[1.35]">
          {product.name}
        </p>
      </div>

      <section className="px-4 py-5 border-b border-kurly-line">
        <h2 className="text-[15px] font-bold text-kurly-ink mb-1.5">
          후기는 이렇게 작성해보세요
        </h2>
        <p className="text-[13px] text-kurly-muted mb-3.5 leading-relaxed">
          상품의 맛, 향, 크기, 사용감 등을 설명해주세요. 좋았던 점과 아쉬운 점도
          솔직하게 들려주세요.
        </p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {guideCards.map((label) => (
            <div key={label} className="w-[112px] flex-shrink-0">
              <div className="w-full aspect-square rounded-[6px] bg-[#EDEDED] mb-1.5" />
              <p className="text-[11px] text-kurly-sub leading-snug">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="px-4 py-5">
        <SituationTagPicker value={tags} onChange={setTags} />
      </div>

      <section className="px-4 pb-5">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[14px] font-bold text-kurly-ink">
            자세한 후기를 들려주세요
            <span className="text-kurly-danger ml-0.5">*</span>
          </p>
          <span className="text-[12px] text-kurly-muted inline-flex items-center gap-1">
            <span className="inline-flex w-3.5 h-3.5 rounded-full border border-kurly-muted text-[9px] items-center justify-center">
              i
            </span>
            유의사항
          </span>
        </div>
        <div className="rounded-[8px] border border-kurly-line-strong overflow-hidden">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 5000))}
            placeholder="상품을 경험하며 느낀 점을 10자 이상으로 남겨주세요."
            className="w-full min-h-[148px] p-3.5 text-[14px] outline-none resize-none placeholder:text-kurly-faint leading-relaxed"
          />
          <div className="px-3.5 pb-2.5 text-right text-[12px] text-kurly-faint">
            {content.length.toLocaleString()}/5,000
          </div>
        </div>
        <button
          type="button"
          onClick={() => showToast(COMING_SOON_MESSAGE)}
          className="mt-3 w-[56px] h-[56px] rounded-[8px] border border-kurly-line-strong flex items-center justify-center text-kurly-muted bg-white"
          aria-label="사진 추가"
        >
          <IconCamera className="w-6 h-6" />
        </button>
      </section>

      <section className="mx-4 mb-4 rounded-[8px] bg-kurly-purple-soft px-3.5 py-3.5">
        <p className="text-[13px] font-bold text-kurly-purple">
          베스트 후기로 선정되면 적립금 5,000원 받아요!
        </p>
        <p className="text-[12px] text-kurly-sub mt-1">
          텍스트 300자, 이미지 2장 이상 등록해보세요
        </p>
      </section>

      <ul className="px-4 text-[11px] text-kurly-muted space-y-1 mb-5">
        <li>· 사진은 최대 30MB, 최대 8장까지 등록할 수 있어요.</li>
        <li>· 취소/반품/교환 시 후기가 삭제되고 적립금이 회수됩니다.</li>
      </ul>

      {error && (
        <div className="mx-4 mb-3 rounded-[8px] border border-[#FFA39E] bg-[#FFF1F0] px-3.5 py-3 text-[13px] text-[#D4380D]">
          ⚠️ {error}
        </div>
      )}

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile bg-white border-t border-kurly-line-strong px-4 py-3">
        <button
          type="button"
          disabled={!canSubmit || submitting}
          onClick={handleSubmit}
          className={`w-full h-[48px] rounded-[6px] text-[16px] font-bold text-white transition-colors ${
            canSubmit
              ? "bg-kurly-purple active:bg-kurly-purple-dark"
              : "bg-[#CCCCCC] cursor-not-allowed"
          }`}
        >
          {mode === "create" ? "후기 등록" : "수정 완료"}
        </button>
      </div>
    </div>
  );
}
