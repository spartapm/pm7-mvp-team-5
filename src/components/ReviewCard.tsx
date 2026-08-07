"use client";

import { useRouter } from "next/navigation";
import { getAccount, getReviewAuthorLabel } from "@/lib/data";
import type { Review } from "@/lib/types";
import { useApp } from "@/lib/store";
import { SituationTagBadges } from "./SituationTagBadges";

export function ReviewCard({ review }: { review: Review }) {
  const router = useRouter();
  const { helpfulVotes, toggleHelpful, isLoggedIn } = useApp();
  const account = getAccount(review.userId);
  const displayName = getReviewAuthorLabel(review);
  const voted = !!helpfulVotes[review.id];

  const onHelpful = () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    toggleHelpful(review.id);
  };

  return (
    <article className="px-4 py-5 border-b-8 border-[#F5F5F5] animate-fade-in-up last:border-b-0">
      <div className="flex items-center gap-1.5 mb-1">
        {account.grade && (
          <span className="text-[10px] font-bold px-1.5 py-[2px] rounded-[3px] bg-kurly-purple text-white leading-none">
            {account.grade}
          </span>
        )}
        <span className="text-[14px] font-semibold text-kurly-ink">
          {displayName}
        </span>
      </div>

      <p className="text-[12px] text-kurly-muted truncate mb-0.5">
        {review.productName}
      </p>

      <SituationTagBadges tags={review.orderedTags} />

      {review.photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mt-1 mb-3">
          {review.photos.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${review.id}-photo-${i}`}
              src={src}
              alt=""
              className="w-[96px] h-[96px] rounded-[6px] object-cover flex-shrink-0 bg-[#EDEDED]"
            />
          ))}
        </div>
      )}

      <p className="text-[14px] text-kurly-ink leading-[1.55] whitespace-pre-wrap">
        {review.content}
      </p>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={onHelpful}
          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-[12px] bg-white ${
            voted
              ? "border-kurly-purple text-kurly-purple font-semibold"
              : "border-kurly-line-strong text-kurly-sub"
          }`}
        >
          <span aria-hidden>👍</span>
          도움돼요 {review.helpful}
        </button>
      </div>
    </article>
  );
}

export function ReviewCardSkeleton() {
  return (
    <div className="px-4 py-5 border-b-8 border-[#F5F5F5]">
      <div className="flex items-center gap-2 mb-3">
        <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
        <div className="skeleton w-16 h-4 rounded" />
      </div>
      <div className="skeleton w-48 h-3 rounded mb-3" />
      <div className="flex gap-1.5 mb-3">
        <div className="skeleton w-14 h-7 rounded-full" />
        <div className="skeleton w-14 h-7 rounded-full" />
        <div className="skeleton w-16 h-7 rounded-full" />
      </div>
      <div className="flex gap-2 mb-3">
        <div className="skeleton w-24 h-24 rounded-[6px]" />
        <div className="skeleton w-24 h-24 rounded-[6px]" />
        <div className="skeleton w-24 h-24 rounded-[6px]" />
      </div>
      <div className="skeleton w-full h-3 rounded mb-2" />
      <div className="skeleton w-[90%] h-3 rounded mb-2" />
      <div className="skeleton w-[70%] h-3 rounded" />
    </div>
  );
}
