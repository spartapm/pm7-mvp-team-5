"use client";

import { useState } from "react";

type Props = {
  tags: string[];
};

/**
 * 배지 노출 규칙
 * - 태그 0개: 영역 미노출
 * - 4개 이하: 전부 노출
 * - 4개 초과: 앞 4개 + "+N 더보기"
 * - 더보기 탭 시 전체 태그를 5개 단위 줄바꿈으로 펼침 (접기 없음)
 */
export function SituationTagBadges({ tags }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!tags.length) return null;

  const collapsed = tags.length > 4 && !expanded;
  const visible = collapsed ? tags.slice(0, 4) : tags;
  const moreCount = tags.length - 4;

  return (
    <div className="mt-2.5 mb-2.5">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[10px] font-bold px-1.5 py-[2px] rounded-[3px] bg-kurly-purple text-white leading-none">
          BETA
        </span>
        <span className="text-[12px] text-kurly-purple font-medium">
          작성자 상황 태그 배지
        </span>
      </div>

      {expanded ? (
        <div className="flex flex-col gap-1.5">
          {chunk(tags, 5).map((row, i) => (
            <div key={i} className="flex flex-wrap gap-1.5">
              {row.map((tag) => (
                <TagPill key={tag} label={tag} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {visible.map((tag) => (
            <TagPill key={tag} label={tag} />
          ))}
          {collapsed && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="h-7 px-2.5 rounded-full text-[12px] bg-kurly-purple-chip text-kurly-purple font-semibold"
            >
              +{moreCount} 더보기
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function TagPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center h-7 px-2.5 rounded-full text-[12px] bg-kurly-purple-chip text-kurly-purple">
      {label}
    </span>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    rows.push(arr.slice(i, i + size));
  }
  return rows;
}
