"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CURRENT_USER_ID,
  getProduct,
  initialReviews,
  initialWritable,
} from "./data";
import { buildOrderedTags, countTags } from "./tags";
import type { Review, SituationTags, WritableItem } from "./types";

const STORAGE_KEY = "kurly-situation-tag-mvp-v1";

type Toast = {
  id: number;
  message: string;
  variant?: "default" | "error";
};

type AppState = {
  cartCount: number;
  reviews: Review[];
  writable: WritableItem[];
  toasts: Toast[];
  hydrated: boolean;
  addToCart: () => void;
  showToast: (message: string, variant?: Toast["variant"]) => void;
  createReview: (input: {
    productId: string;
    content: string;
    tags: SituationTags;
  }) => { ok: true } | { ok: false; error: string };
  updateReview: (input: {
    reviewId: string;
    content: string;
    tags: SituationTags;
  }) => { ok: true } | { ok: false; error: string };
  getMyReviews: () => Review[];
  getProductReviews: (productId: string) => Review[];
  getWritable: () => WritableItem[];
};

const AppContext = createContext<AppState | null>(null);

type Persisted = {
  cartCount: number;
  reviews: Review[];
  writable: WritableItem[];
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [cartCount, setCartCount] = useState(0);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [writable, setWritable] = useState<WritableItem[]>(initialWritable);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Persisted;
        if (parsed.reviews?.length) setReviews(parsed.reviews);
        if (parsed.writable) setWritable(parsed.writable);
        if (typeof parsed.cartCount === "number") setCartCount(parsed.cartCount);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload: Persisted = { cartCount, reviews, writable };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [cartCount, reviews, writable, hydrated]);

  const showToast = useCallback(
    (message: string, variant: Toast["variant"] = "default") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, variant }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const addToCart = useCallback(() => {
    setCartCount((c) => c + 1);
    showToast("장바구니에 상품을 담았어요");
  }, [showToast]);

  const createReview = useCallback(
    (input: { productId: string; content: string; tags: SituationTags }) => {
      const product = getProduct(input.productId);
      if (!product) return { ok: false as const, error: "상품을 찾을 수 없어요" };
      if (input.content.trim().length < 10) {
        return { ok: false as const, error: "후기를 10자 이상 작성해주세요" };
      }

      const ordered = buildOrderedTags(input.tags);
      const review: Review = {
        id: `R-NEW-${product.id}-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        userId: CURRENT_USER_ID,
        rating: 5,
        createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        content: input.content.trim(),
        charCount: input.content.trim().length,
        situationTags: input.tags,
        orderedTags: ordered,
        tagCount: countTags(input.tags),
        showBadge: ordered.length > 0,
        hasPhoto: false,
        photos: [],
        helpful: 0,
        isMine: true,
      };

      setReviews((prev) => [review, ...prev]);
      setWritable((prev) => prev.filter((w) => w.productId !== product.id));
      return { ok: true as const };
    },
    []
  );

  const updateReview = useCallback(
    (input: { reviewId: string; content: string; tags: SituationTags }) => {
      if (input.content.trim().length < 10) {
        return { ok: false as const, error: "후기를 10자 이상 작성해주세요" };
      }
      const ordered = buildOrderedTags(input.tags);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === input.reviewId
            ? {
                ...r,
                content: input.content.trim(),
                charCount: input.content.trim().length,
                situationTags: input.tags,
                orderedTags: ordered,
                tagCount: countTags(input.tags),
                showBadge: ordered.length > 0,
              }
            : r
        )
      );
      return { ok: true as const };
    },
    []
  );

  const getMyReviews = useCallback(
    () => reviews.filter((r) => r.userId === CURRENT_USER_ID || r.isMine),
    [reviews]
  );

  const getProductReviews = useCallback(
    (productId: string) => reviews.filter((r) => r.productId === productId),
    [reviews]
  );

  const getWritable = useCallback(() => writable, [writable]);

  const value = useMemo(
    () => ({
      cartCount,
      reviews,
      writable,
      toasts,
      hydrated,
      addToCart,
      showToast,
      createReview,
      updateReview,
      getMyReviews,
      getProductReviews,
      getWritable,
    }),
    [
      cartCount,
      reviews,
      writable,
      toasts,
      hydrated,
      addToCart,
      showToast,
      createReview,
      updateReview,
      getMyReviews,
      getProductReviews,
      getWritable,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
