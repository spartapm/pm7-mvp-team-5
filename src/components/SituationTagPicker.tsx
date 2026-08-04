"use client";

import {
  COMPANION_OPTIONS,
  HEADCOUNT_OPTIONS,
  PURPOSE_OPTIONS,
  TASTE_OPTIONS,
} from "@/lib/tags";
import type {
  CompanionTag,
  HeadcountTag,
  PurposeTag,
  SituationTags,
  TasteTag,
} from "@/lib/types";

type Props = {
  value: SituationTags;
  onChange: (next: SituationTags) => void;
};

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 px-3.5 rounded-full text-[13px] border transition-colors ${
        selected
          ? "border-kurly-purple text-kurly-purple bg-white font-semibold border-[1.5px]"
          : "border-kurly-line-strong text-kurly-ink bg-white border"
      }`}
    >
      {label}
    </button>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5 last:mb-0">
      <p className="text-[13px] font-semibold text-kurly-ink mb-2.5">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function SituationTagPicker({ value, onChange }: Props) {
  const toggleSingle = <T extends string>(
    key: "headcount" | "purpose" | "companion",
    option: T
  ) => {
    onChange({
      ...value,
      [key]: value[key] === option ? null : option,
    });
  };

  const toggleTaste = (option: TasteTag) => {
    const exists = value.taste.includes(option);
    onChange({
      ...value,
      taste: exists
        ? value.taste.filter((t) => t !== option)
        : [...value.taste, option],
    });
  };

  return (
    <section className="rounded-[12px] bg-kurly-purple-soft px-4 py-4">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-[15px] font-bold text-kurly-ink">상황 태그 선택</h3>
        <span className="text-[10px] font-bold px-1.5 py-[2px] rounded-[3px] bg-kurly-purple text-white leading-none">
          BETA
        </span>
      </div>
      <p className="text-[12px] text-kurly-sub mb-5">
        나와 비슷한 상황의 사용자에게 도움이 돼요 (선택 사항)
      </p>

      <Group title="몇 명이 먹기에 적당한가요?">
        {HEADCOUNT_OPTIONS.map((opt) => (
          <Chip
            key={opt}
            label={opt}
            selected={value.headcount === opt}
            onClick={() => toggleSingle<HeadcountTag>("headcount", opt)}
          />
        ))}
      </Group>

      <Group title="어떤 목적으로 구매하셨나요?">
        {PURPOSE_OPTIONS.map((opt) => (
          <Chip
            key={opt}
            label={opt}
            selected={value.purpose === opt}
            onClick={() => toggleSingle<PurposeTag>("purpose", opt)}
          />
        ))}
      </Group>

      <Group title="누구와 함께 드셨나요?">
        {COMPANION_OPTIONS.map((opt) => (
          <Chip
            key={opt}
            label={opt}
            selected={value.companion === opt}
            onClick={() => toggleSingle<CompanionTag>("companion", opt)}
          />
        ))}
      </Group>

      <div>
        <p className="text-[13px] font-semibold text-kurly-ink mb-2.5">
          맛이 어땠나요?{" "}
          <span className="font-normal text-kurly-muted text-[12px]">
            (중복 선택 가능)
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {TASTE_OPTIONS.slice(0, 3).map((opt) => (
            <Chip
              key={opt}
              label={opt}
              selected={value.taste.includes(opt)}
              onClick={() => toggleTaste(opt)}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {TASTE_OPTIONS.slice(3).map((opt) => (
            <Chip
              key={opt}
              label={opt}
              selected={value.taste.includes(opt)}
              onClick={() => toggleTaste(opt)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
