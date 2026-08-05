import seed from "./seed-data.json";
import { buildOrderedTags, EMPTY_TAGS } from "./tags";
import type {
  Account,
  Product,
  Review,
  SituationTags,
  TasteTag,
  WritableItem,
} from "./types";

const REVIEW_PHOTOS = [
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=400&q=80",
];

export const CURRENT_USER_ID = "MASTER01";

export const assets = (seed as { assets?: Record<string, string> }).assets ?? {
  "01_kurlylogo": "/assets/01_kurlylogo.jpg",
  "02_carousel_5": "/assets/02_carousel_5.png",
  "03_menuicon_1": "/assets/03_menuicon_1.png",
  "03_menuicon_2": "/assets/03_menuicon_2.png",
  "03_menuicon_3": "/assets/03_menuicon_3.png",
  "03_menuicon_4": "/assets/03_menuicon_4.png",
  "03_menuicon_5": "/assets/03_menuicon_5.png",
  "03_menuicon_6": "/assets/03_menuicon_6.png",
  "03_headericon_1": "/assets/03_headericon_1.png",
  "03_headericon_2": "/assets/03_headericon_2.png",
};

export const accounts: Record<string, Account> = seed.accounts as Record<
  string,
  Account
>;

export const products: Product[] = (
  seed.products as Array<Product>
).map((p) => ({
  ...p,
  image: p.image || `/assets/product-${p.id}.jpg`,
  pdpImage: p.pdpImage || p.image || `/assets/pdp-${p.id}.jpg`,
}));

function normalizeTags(raw: {
  headcount: string | null;
  purpose: string | null;
  companion: string | null;
  taste: string[];
}): SituationTags {
  return {
    headcount: (raw.headcount as SituationTags["headcount"]) || null,
    purpose: (raw.purpose as SituationTags["purpose"]) || null,
    companion: (raw.companion as SituationTags["companion"]) || null,
    taste: (raw.taste || []) as TasteTag[],
  };
}

const baseReviews: Review[] = (
  seed.reviews as Array<{
    id: string;
    productId: string;
    productName: string;
    userId: string;
    rating: number;
    createdAt: string;
    content: string;
    charCount: number;
    situationTags: {
      headcount: string | null;
      purpose: string | null;
      companion: string | null;
      taste: string[];
    };
    orderedTags: string[];
    tagCount: number;
    showBadge: boolean;
    hasPhoto: boolean;
    helpful: number;
    qaNote?: string | null;
  }>
).map((r, i) => {
  const tags = normalizeTags(r.situationTags);
  const ordered = buildOrderedTags(tags);
  const photoCount = r.hasPhoto ? 2 + (i % 3) : 0;
  return {
    ...r,
    situationTags: tags,
    orderedTags: ordered,
    tagCount: ordered.length,
    showBadge: ordered.length > 0,
    photos: Array.from({ length: photoCount }, (_, pi) =>
      REVIEW_PHOTOS[(i + pi) % REVIEW_PHOTOS.length]
    ),
    isMine: false,
  };
});

export const DEMO_WRITTEN_MARKER = "DEMO_WRITTEN_SEED";

function buildMasterSeedReviews(): Review[] {
  const writtenProducts = products.filter((p) => !p.writableForMaster).slice(0, 3);
  const configs = [
    { withTags: true as const },
    { withTags: true as const },
    { withTags: false as const },
  ];

  return writtenProducts.map((product, idx) => {
    const withTags = configs[idx].withTags;
    const source = baseReviews.find(
      (r) =>
        r.productId === product.id &&
        (withTags
          ? r.qaNote?.includes("QA09") || r.tagCount === 3
          : r.qaNote?.includes("QA01") || r.tagCount === 0)
    );
    const tags = withTags
      ? source?.situationTags ?? {
          headcount: "2~3인" as const,
          purpose: "일상" as const,
          companion: "혼자" as const,
          taste: ["담백해요" as const],
        }
      : { ...EMPTY_TAGS };
    const ordered = buildOrderedTags(tags);
    const content =
      source?.content ??
      "차돌박이가 두툼하고 육즙이 가득해서 구워 먹으니 정말 맛있어요.";
    return {
      id: `R-MASTER-${product.id}`,
      productId: product.id,
      productName: product.name,
      userId: CURRENT_USER_ID,
      rating: 5,
      createdAt: `2025-07-${10 + idx} 12:00`,
      content,
      charCount: content.length,
      situationTags: tags,
      orderedTags: ordered,
      tagCount: ordered.length,
      showBadge: ordered.length > 0,
      hasPhoto: idx !== 2,
      photos:
        idx !== 2 ? [REVIEW_PHOTOS[idx], REVIEW_PHOTOS[idx + 1]] : [],
      helpful: 12 + idx,
      qaNote: withTags
        ? `${DEMO_WRITTEN_MARKER} 태그 있음 - 수정 프리필`
        : `${DEMO_WRITTEN_MARKER} 태그 없음 - 수정 시 미선택 상태`,
      isMine: false,
    } satisfies Review;
  });
}

export const initialReviews: Review[] = [
  ...baseReviews,
  ...buildMasterSeedReviews(),
];

export const initialWritable: WritableItem[] = products
  .filter((p) => p.writableForMaster)
  .map((p, i) => ({
    productId: p.id,
    deadline: `08.${String(10 + i).padStart(2, "0")}까지 작성 가능`,
  }));

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function formatPrice(n: number): string {
  return `${n.toLocaleString("ko-KR")}원`;
}

export function formatReviewCount(n: number): string {
  if (n >= 999) return "999+";
  return String(n);
}

/** 회원이름 첫 글자 제외 ** 마스킹 (이미 마스킹된 닉네임은 그대로) */
export function maskNickname(name: string): string {
  const trimmed = (name || "").trim();
  if (!trimmed) return "회**";
  if (trimmed.includes("*")) return trimmed;
  if (trimmed.length === 1) return `${trimmed}**`;
  return `${trimmed[0]}**`;
}

export function getAccount(userId: string): Account {
  return (
    accounts[userId] ?? {
      id: userId,
      nickname: "회원*",
      grade: null,
    }
  );
}
