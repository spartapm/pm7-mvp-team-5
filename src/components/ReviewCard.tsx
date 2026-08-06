"use client";

import { getAccount, maskNickname } from "@/lib/data";
import type { Review } from "@/lib/types";
import { SituationTagBadges } from "./SituationTagBadges";

export function ReviewCard({ review }: { review: Review }) {
  const account = getAccount(review.userId);
  const displayName = maskNickname(account.nickname);

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
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-kurly-line-strong text-[12px] text-kurly-sub bg-white"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M8 11v9M4 12.5V20a1 1 0 0 0 1 1h6.2a3 3 0 0 0 2.7-1.7l2.4-5.1a1.5 1.5 0 0 0-1.4-2.2H12V5.5A2.5 2.5 0 0 0 9.5 3h-.2a1.3 1.3 0 0 0-1.25 1l-1.4 6.5A2 2 0 0 1 4.7 12H4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          도움돼요 {review.helpful > 0 ? review.helpful : ""}
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
