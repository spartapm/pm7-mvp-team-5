import type {
  CompanionTag,
  HeadcountTag,
  PurposeTag,
  SituationTags,
  TasteTag,
} from "./types";

export const HEADCOUNT_OPTIONS: HeadcountTag[] = [
  "1~2인",
  "2~3인",
  "4인 이상",
];

export const PURPOSE_OPTIONS: PurposeTag[] = [
  "일상",
  "술안주",
  "선물",
  "홈파티",
  "식단",
];

export const COMPANION_OPTIONS: CompanionTag[] = [
  "혼자",
  "아이와",
  "부모님과",
  "친구와",
  "연인과",
];

export const TASTE_OPTIONS: TasteTag[] = [
  "담백해요",
  "매콤해요",
  "짭짤해요",
  "달콤해요",
  "새콤해요",
];

export const EMPTY_TAGS: SituationTags = {
  headcount: null,
  purpose: null,
  companion: null,
  taste: [],
};

/** 작성/조회 공통 노출 정렬: 인원수 → 목적 → 동반자 → 맛 */
export function buildOrderedTags(tags: SituationTags): string[] {
  const ordered: string[] = [];
  if (tags.headcount) ordered.push(tags.headcount);
  if (tags.purpose) ordered.push(tags.purpose);
  if (tags.companion) ordered.push(tags.companion);
  ordered.push(...tags.taste);
  return ordered;
}

export function countTags(tags: SituationTags): number {
  return buildOrderedTags(tags).length;
}

export function hasAnyTag(tags: SituationTags): boolean {
  return countTags(tags) > 0;
}
