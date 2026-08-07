import seed from "./seed-data.json";
import { buildOrderedTags } from "./tags";
import type {
  Account,
  Product,
  Review,
  SituationTags,
  TasteTag,
  WritableItem,
} from "./types";

export const assets = (seed as { assets?: Record<string, string> }).assets ?? {
  "01_kurlylogo": "/assets/01_kurlylogo.png",
  "02_carousel_5": "/assets/02_carousel_5.png",
  "03_menuicon_1": "/assets/03_menuicon_1.png",
  "03_menuicon_2": "/assets/03_menuicon_2.png",
  "03_menuicon_3": "/assets/03_menuicon_3.png",
  "03_menuicon_4": "/assets/03_menuicon_4.png",
  "03_menuicon_5": "/assets/03_menuicon_5.png",
  "03_menuicon_6": "/assets/03_menuicon_6.png",
  "03_headericon_1": "/assets/03_headericon_1.png",
  "03_headericon_2": "/assets/03_headericon_2.png",
  "06_mypagebanner1": "/assets/06_mypagebanner1.png",
  "06_mypageicon1": "/assets/06_mypageicon1.jpg",
  "06_mypageicon2": "/assets/06_mypageicon2.jpg",
  "06_mypageicon3": "/assets/06_mypageicon3.jpg",
  "06_mypageicon4": "/assets/06_mypageicon4.jpg",
};

export const headerAssets = {
  logo: "/assets/01_kurlylogo-white.png",
  location: "/assets/03_headericon_1-white.png",
  cart: "/assets/03_headericon_2-white.png",
};

export const accounts: Record<string, Account> = seed.accounts as Record<
  string,
  Account
>;

export const products: Product[] = (seed.products as Array<Product>).map((p) => ({
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

/** 상품 관련 후기 사진 — 해당 상품 이미지 기반 */
function reviewPhotosFor(productId: string, count: number, salt: number): string[] {
  const product = products.find((p) => p.id === productId);
  const base = product?.image || product?.pdpImage;
  if (!base || count <= 0) return [];
  // 동일 상품 이미지를 반복하되 캐시 버스트로 구분
  return Array.from({ length: count }, (_, i) => `${base}?v=review-${salt}-${i}`);
}

export const initialReviews: Review[] = (
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
    hasPhoto: boolean;
    helpful: number;
    qaNote?: string | null;
  }>
).map((r, i) => {
  const tags = normalizeTags(r.situationTags);
  const ordered = buildOrderedTags(tags);
  const account = accounts[r.userId];
  const photoCount = r.hasPhoto ? 2 + (i % 3) : 0;
  return {
    ...r,
    authorLabel: account?.nickname ?? maskNickname("회원"),
    situationTags: tags,
    orderedTags: ordered,
    tagCount: ordered.length,
    showBadge: ordered.length > 0,
    photos: reviewPhotosFor(r.productId, photoCount, i),
    isMine: false,
  };
});

/** 신규 가입 시 빈 상태 — 주문 후에만 작성 가능 후기 추가 */
export const initialWritable: WritableItem[] = [];

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

/** 회원이름 첫 글자 제외 ** 마스킹 */
export function maskNickname(name: string): string {
  const trimmed = (name || "").trim();
  if (!trimmed) return "회**";
  if (trimmed.includes("*")) return trimmed;
  if (trimmed.length === 1) return `${trimmed}**`;
  return `${trimmed[0]}**`;
}

export function formatOrderedAt(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
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

export function getReviewAuthorLabel(review: Review): string {
  if (review.authorLabel) return maskNickname(review.authorLabel);
  const account = getAccount(review.userId);
  return maskNickname(account.nickname);
}
