export type HeadcountTag = "1~2인" | "2~3인" | "4인 이상";
export type PurposeTag = "일상" | "술안주" | "선물" | "홈파티" | "식단";
export type CompanionTag = "혼자" | "아이와" | "부모님과" | "친구와" | "연인과";
export type TasteTag =
  | "담백해요"
  | "매콤해요"
  | "짭짤해요"
  | "달콤해요"
  | "새콤해요";

export type SituationTags = {
  headcount: HeadcountTag | null;
  purpose: PurposeTag | null;
  companion: CompanionTag | null;
  taste: TasteTag[];
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  salePrice: number;
  unit: string;
  reviewCount: number;
  image: string;
  pdpImage: string;
};

export type Account = {
  id: string;
  nickname: string;
  grade: string | null;
};

export type Review = {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  authorLabel?: string;
  rating: number;
  createdAt: string;
  content: string;
  charCount: number;
  situationTags: SituationTags;
  orderedTags: string[];
  tagCount: number;
  showBadge: boolean;
  hasPhoto: boolean;
  photos: string[];
  helpful: number;
  qaNote?: string | null;
  isMine?: boolean;
};

export type WritableItem = {
  /** 주문 라인 고유 키 (같은 상품 재주문 구분) */
  id: string;
  productId: string;
  /** yyyy-MM-dd HH:mm:ss */
  orderedAt: string;
};

export type CartItem = {
  productId: string;
  quantity: number;
  selected: boolean;
};
