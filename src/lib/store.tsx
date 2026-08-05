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
  clearSession,
  logout as authLogout,
  readSession,
  type AuthUser,
} from "./auth";
import {
  CURRENT_USER_ID,
  DEMO_WRITTEN_MARKER,
  getProduct,
  initialReviews,
  initialWritable,
} from "./data";
import { buildOrderedTags, countTags } from "./tags";
import type { CartItem, Review, SituationTags, WritableItem } from "./types";

const STORAGE_KEY = "kurly-situation-tag-mvp-v3";

type Toast = {
  id: number;
  message: string;
  variant?: "default" | "error";
};

type AppState = {
  cartItems: CartItem[];
  cartCount: number;
  displayCartCount: number;
  reviews: Review[];
  writable: WritableItem[];
  toasts: Toast[];
  hydrated: boolean;
  user: AuthUser | null;
  isLoggedIn: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
  addToCart: (productId: string) => void;
  setCartQuantity: (productId: string, quantity: number) => void;
  toggleCartItem: (productId: string) => void;
  toggleSelectAll: () => void;
  removeCartItems: (productIds: string[]) => void;
  removeCartItem: (productId: string) => void;
  completeOrder: () => { ok: true; count: number } | { ok: false; error: string };
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
  cartItems?: CartItem[];
  cartCount?: number;
  reviews: Review[];
  writable: WritableItem[];
};

function totalQty(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

function makeDeadline(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}.${dd}까지 작성 가능`;
}

/** 수정 플로우 데모용 시드를 로그인 유저에게 이관 (작성가능 T 상품과 겹치지 않음) */
function claimDemoWrittenReviews(list: Review[], userId: string): Review[] {
  const alreadyHasMine = list.some(
    (r) => r.userId === userId && r.qaNote?.includes(DEMO_WRITTEN_MARKER)
  );
  if (alreadyHasMine) {
    return list.map((r) =>
      r.userId === userId
        ? { ...r, isMine: true }
        : r
    );
  }

  const hasAnyMine = list.some((r) => r.userId === userId);
  if (hasAnyMine) {
    return list.map((r) =>
      r.userId === userId ? { ...r, isMine: true } : { ...r, isMine: false }
    );
  }

  return list.map((r) => {
    if (r.qaNote?.includes(DEMO_WRITTEN_MARKER) && r.userId === CURRENT_USER_ID) {
      return { ...r, userId, isMine: true };
    }
    return { ...r, isMine: r.userId === userId };
  });
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [writable, setWritable] = useState<WritableItem[]>(initialWritable);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [user, setUserState] = useState<AuthUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      let nextReviews = initialReviews;
      let nextWritable = initialWritable;
      if (raw) {
        const parsed = JSON.parse(raw) as Persisted;
        if (parsed.reviews?.length) nextReviews = parsed.reviews;
        if (parsed.writable) nextWritable = parsed.writable;
        if (parsed.cartItems?.length) {
          setCartItems(parsed.cartItems);
        }
      }
      const session = readSession();
      if (session) {
        nextReviews = claimDemoWrittenReviews(nextReviews, session.user.id);
        setUserState(session.user);
        // 이미 작성한 상품은 작성 가능 목록에서 제외
        const mineIds = new Set(
          nextReviews.filter((r) => r.userId === session.user.id).map((r) => r.productId)
        );
        nextWritable = nextWritable.filter((w) => !mineIds.has(w.productId));
      }
      setReviews(nextReviews);
      setWritable(nextWritable);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload: Persisted = { cartItems, reviews, writable };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [cartItems, reviews, writable, hydrated]);

  const setUser = useCallback((next: AuthUser | null) => {
    setUserState(next);
    if (next) {
      setReviews((prev) => {
        const claimed = claimDemoWrittenReviews(prev, next.id);
        const mineIds = new Set(
          claimed.filter((r) => r.userId === next.id).map((r) => r.productId)
        );
        setWritable((w) => w.filter((item) => !mineIds.has(item.productId)));
        return claimed;
      });
    }
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    clearSession();
    setUserState(null);
  }, []);

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

  const addToCart = useCallback(
    (productId: string) => {
      if (!getProduct(productId)) {
        showToast("상품을 찾을 수 없어요", "error");
        return;
      }
      setCartItems((prev) => {
        const existing = prev.find((i) => i.productId === productId);
        if (existing) {
          return prev.map((i) =>
            i.productId === productId
              ? { ...i, quantity: i.quantity + 1, selected: true }
              : i
          );
        }
        return [...prev, { productId, quantity: 1, selected: true }];
      });
      showToast("장바구니에 상품을 담았어요");
    },
    [showToast]
  );

  const setCartQuantity = useCallback((productId: string, quantity: number) => {
    setCartItems((prev) =>
      prev
        .map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.max(1, quantity) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const toggleCartItem = useCallback((productId: string) => {
    setCartItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, selected: !i.selected } : i
      )
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    setCartItems((prev) => {
      if (!prev.length) return prev;
      const allSelected = prev.every((i) => i.selected);
      return prev.map((i) => ({ ...i, selected: !allSelected }));
    });
  }, []);

  const removeCartItems = useCallback((productIds: string[]) => {
    const set = new Set(productIds);
    setCartItems((prev) => prev.filter((i) => !set.has(i.productId)));
  }, []);

  const removeCartItem = useCallback((productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const completeOrder = useCallback(() => {
    const selected = cartItems.filter((i) => i.selected);
    if (!selected.length) {
      return { ok: false as const, error: "주문할 상품을 선택해주세요" };
    }

    setWritable((prev) => {
      const existing = new Set(prev.map((w) => w.productId));
      const next = [...prev];
      selected.forEach((item, idx) => {
        if (existing.has(item.productId)) return;
        // already reviewed → skip writable
        const alreadyReviewed = reviews.some(
          (r) => r.productId === item.productId && user && r.userId === user.id
        );
        if (alreadyReviewed) return;
        next.push({
          productId: item.productId,
          deadline: makeDeadline(14 + idx),
        });
        existing.add(item.productId);
      });
      return next;
    });

    setCartItems((prev) => prev.filter((i) => !i.selected));
    return { ok: true as const, count: selected.length };
  }, [cartItems, reviews, user]);

  const createReview = useCallback(
    (input: { productId: string; content: string; tags: SituationTags }) => {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        return { ok: false as const, error: "NETWORK" };
      }
      const product = getProduct(input.productId);
      if (!product) return { ok: false as const, error: "상품을 찾을 수 없어요" };
      if (input.content.trim().length < 10) {
        return { ok: false as const, error: "후기를 10자 이상 작성해주세요" };
      }

      const userId = user?.id;
      if (!userId) return { ok: false as const, error: "NETWORK" };

      const ordered = buildOrderedTags(input.tags);
      const review: Review = {
        id: `R-NEW-${product.id}-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        userId,
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
    [user]
  );

  const updateReview = useCallback(
    (input: { reviewId: string; content: string; tags: SituationTags }) => {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        return { ok: false as const, error: "NETWORK" };
      }
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

  const getMyReviews = useCallback(() => {
    if (!user) return [];
    return reviews.filter((r) => r.userId === user.id);
  }, [reviews, user]);

  const getProductReviews = useCallback(
    (productId: string) => reviews.filter((r) => r.productId === productId),
    [reviews]
  );

  const getWritable = useCallback(() => {
    if (!user) return writable;
    const mine = new Set(
      reviews.filter((r) => r.userId === user.id).map((r) => r.productId)
    );
    return writable.filter((w) => !mine.has(w.productId));
  }, [writable, reviews, user]);

  const cartCount = totalQty(cartItems);
  const isLoggedIn = !!user;
  const displayCartCount = isLoggedIn ? cartCount : 0;

  const value = useMemo(
    () => ({
      cartItems,
      cartCount,
      displayCartCount,
      reviews,
      writable,
      toasts,
      hydrated,
      user,
      isLoggedIn,
      setUser,
      logout,
      addToCart,
      setCartQuantity,
      toggleCartItem,
      toggleSelectAll,
      removeCartItems,
      removeCartItem,
      completeOrder,
      showToast,
      createReview,
      updateReview,
      getMyReviews,
      getProductReviews,
      getWritable,
    }),
    [
      cartItems,
      cartCount,
      displayCartCount,
      reviews,
      writable,
      toasts,
      hydrated,
      user,
      isLoggedIn,
      setUser,
      logout,
      addToCart,
      setCartQuantity,
      toggleCartItem,
      toggleSelectAll,
      removeCartItems,
      removeCartItem,
      completeOrder,
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
