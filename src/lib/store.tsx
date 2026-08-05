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
  createOrder,
  createReviewDb,
  deleteCartItems,
  ensureUserBootstrap,
  fetchAllReviews,
  fetchCart,
  fetchWritable,
  mergeGuestCartToDb,
  updateReviewDb,
  upsertCartItem,
} from "./db";
import {
  CURRENT_USER_ID,
  DEMO_WRITTEN_MARKER,
  getProduct,
  initialReviews,
  initialWritable,
} from "./data";
import { getSupabase } from "./supabase";
import { buildOrderedTags, countTags } from "./tags";
import type { CartItem, Review, SituationTags, WritableItem } from "./types";

const STORAGE_KEY = "kurly-situation-tag-mvp-v4";

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
  setUser: (user: AuthUser | null) => Promise<void>;
  logout: () => Promise<void>;
  addToCart: (productId: string) => Promise<void>;
  setCartQuantity: (productId: string, quantity: number) => Promise<void>;
  toggleCartItem: (productId: string) => Promise<void>;
  toggleSelectAll: () => Promise<void>;
  removeCartItems: (productIds: string[]) => Promise<void>;
  removeCartItem: (productId: string) => Promise<void>;
  completeOrder: () => Promise<
    { ok: true; count: number } | { ok: false; error: string }
  >;
  showToast: (message: string, variant?: Toast["variant"]) => void;
  createReview: (input: {
    productId: string;
    content: string;
    tags: SituationTags;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  updateReview: (input: {
    reviewId: string;
    content: string;
    tags: SituationTags;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  getMyReviews: () => Review[];
  getProductReviews: (productId: string) => Review[];
  getWritable: () => WritableItem[];
};

const AppContext = createContext<AppState | null>(null);

type Persisted = {
  cartItems?: CartItem[];
  reviews?: Review[];
  writable?: WritableItem[];
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

function claimDemoWrittenReviews(list: Review[], userId: string): Review[] {
  const alreadyHasMine = list.some(
    (r) => r.userId === userId && r.qaNote?.includes(DEMO_WRITTEN_MARKER)
  );
  if (alreadyHasMine) {
    return list.map((r) =>
      r.userId === userId ? { ...r, isMine: true } : r
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

async function hasSupabaseSession() {
  const sb = getSupabase();
  if (!sb) return false;
  const { data } = await sb.auth.getSession();
  return !!data.session;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [writable, setWritable] = useState<WritableItem[]>(initialWritable);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [user, setUserState] = useState<AuthUser | null>(null);

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

  const refreshFromDb = useCallback(async (authUser: AuthUser) => {
    const [allReviews, cart, writables] = await Promise.all([
      fetchAllReviews(),
      fetchCart(authUser.id),
      fetchWritable(authUser.id),
    ]);
    setReviews(
      allReviews.map((r) => ({ ...r, isMine: r.userId === authUser.id }))
    );
    setCartItems(cart);
    setWritable(writables);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        let guestCart: CartItem[] = [];
        if (raw) {
          const parsed = JSON.parse(raw) as Persisted;
          if (parsed.cartItems?.length) {
            guestCart = parsed.cartItems;
            setCartItems(parsed.cartItems);
          }
          if (parsed.reviews?.length) setReviews(parsed.reviews);
          if (parsed.writable) setWritable(parsed.writable);
        }

        const session = readSession();
        if (session) {
          setUserState(session.user);
          const online = await hasSupabaseSession();
          if (online) {
            await ensureUserBootstrap(session.user.id, session.user.name);
            if (guestCart.length) {
              const merged = await mergeGuestCartToDb(
                session.user.id,
                guestCart
              );
              setCartItems(merged);
            }
            await refreshFromDb(session.user);
          } else {
            setReviews((prev) => claimDemoWrittenReviews(prev, session.user.id));
          }
        } else {
          // try load public reviews from supabase even when logged out
          try {
            const all = await fetchAllReviews();
            if (all.length) setReviews(all);
          } catch {
            /* keep seed */
          }
        }
      } catch {
        /* ignore */
      }
      setHydrated(true);
    })();
  }, [refreshFromDb]);

  useEffect(() => {
    if (!hydrated) return;
    // guest cart only persisted locally; logged-in cart lives in DB
    const payload: Persisted = {
      cartItems: user ? [] : cartItems,
      reviews: user ? undefined : reviews,
      writable: user ? undefined : writable,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [cartItems, reviews, writable, hydrated, user]);

  const setUser = useCallback(
    async (next: AuthUser | null) => {
      setUserState(next);
      if (!next) return;
      const online = await hasSupabaseSession();
      if (!online) {
        setReviews((prev) => claimDemoWrittenReviews(prev, next.id));
        return;
      }
      try {
        await ensureUserBootstrap(next.id, next.name);
        const guest = cartItems;
        if (guest.length) {
          const merged = await mergeGuestCartToDb(next.id, guest);
          setCartItems(merged);
        }
        await refreshFromDb(next);
      } catch (e) {
        console.error(e);
        showToast("데이터 동기화에 실패했어요", "error");
      }
    },
    [cartItems, refreshFromDb, showToast]
  );

  const logout = useCallback(async () => {
    await authLogout();
    clearSession();
    setUserState(null);
    setCartItems([]);
    try {
      const all = await fetchAllReviews();
      setReviews(all.length ? all : initialReviews);
    } catch {
      setReviews(initialReviews);
    }
    setWritable(initialWritable);
  }, []);

  const addToCart = useCallback(
    async (productId: string) => {
      if (!getProduct(productId)) {
        showToast("상품을 찾을 수 없어요", "error");
        return;
      }
      let nextItems: CartItem[] = [];
      setCartItems((prev) => {
        const existing = prev.find((i) => i.productId === productId);
        nextItems = existing
          ? prev.map((i) =>
              i.productId === productId
                ? { ...i, quantity: i.quantity + 1, selected: true }
                : i
            )
          : [...prev, { productId, quantity: 1, selected: true }];
        return nextItems;
      });
      showToast("장바구니에 상품을 담았어요");

      if (user && (await hasSupabaseSession())) {
        const item = nextItems.find((i) => i.productId === productId)!;
        try {
          await upsertCartItem(user.id, item);
        } catch (e) {
          console.error(e);
        }
      }
    },
    [showToast, user]
  );

  const setCartQuantity = useCallback(
    async (productId: string, quantity: number) => {
      const q = Math.max(1, quantity);
      setCartItems((prev) =>
        prev.map((i) => (i.productId === productId ? { ...i, quantity: q } : i))
      );
      if (user && (await hasSupabaseSession())) {
        const cur = cartItems.find((i) => i.productId === productId);
        await upsertCartItem(user.id, {
          productId,
          quantity: q,
          selected: cur?.selected ?? true,
        });
      }
    },
    [cartItems, user]
  );

  const toggleCartItem = useCallback(
    async (productId: string) => {
      let next: CartItem | null = null;
      setCartItems((prev) =>
        prev.map((i) => {
          if (i.productId !== productId) return i;
          next = { ...i, selected: !i.selected };
          return next;
        })
      );
      if (user && next && (await hasSupabaseSession())) {
        await upsertCartItem(user.id, next);
      }
    },
    [user]
  );

  const toggleSelectAll = useCallback(async () => {
    setCartItems((prev) => {
      if (!prev.length) return prev;
      const allSelected = prev.every((i) => i.selected);
      return prev.map((i) => ({ ...i, selected: !allSelected }));
    });
    if (user && (await hasSupabaseSession())) {
      const allSelected = cartItems.every((i) => i.selected);
      await Promise.all(
        cartItems.map((i) =>
          upsertCartItem(user.id, { ...i, selected: !allSelected })
        )
      );
    }
  }, [cartItems, user]);

  const removeCartItems = useCallback(
    async (productIds: string[]) => {
      const set = new Set(productIds);
      setCartItems((prev) => prev.filter((i) => !set.has(i.productId)));
      if (user && (await hasSupabaseSession())) {
        await deleteCartItems(user.id, productIds);
      }
    },
    [user]
  );

  const removeCartItem = useCallback(
    async (productId: string) => {
      await removeCartItems([productId]);
    },
    [removeCartItems]
  );

  const completeOrder = useCallback(async () => {
    const selected = cartItems.filter((i) => i.selected);
    if (!selected.length) {
      return { ok: false as const, error: "주문할 상품을 선택해주세요" };
    }
    if (!user) {
      return { ok: false as const, error: "로그인이 필요해요" };
    }

    try {
      if (await hasSupabaseSession()) {
        await createOrder({ userId: user.id, items: cartItems });
        const writables = await fetchWritable(user.id);
        setWritable(writables);
        setCartItems([]);
      } else {
        // local fallback fake payment
        setWritable((prev) => {
          const existing = new Set(prev.map((w) => w.productId));
          const next = [...prev];
          selected.forEach((item, idx) => {
            if (existing.has(item.productId)) return;
            const alreadyReviewed = reviews.some(
              (r) => r.productId === item.productId && r.userId === user.id
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
      }
      return { ok: true as const, count: selected.length };
    } catch (e) {
      console.error(e);
      return { ok: false as const, error: "결제(주문) 처리에 실패했어요" };
    }
  }, [cartItems, reviews, user]);

  const createReview = useCallback(
    async (input: {
      productId: string;
      content: string;
      tags: SituationTags;
    }) => {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        return { ok: false as const, error: "NETWORK" };
      }
      const product = getProduct(input.productId);
      if (!product) return { ok: false as const, error: "상품을 찾을 수 없어요" };
      if (input.content.trim().length < 10) {
        return { ok: false as const, error: "후기를 10자 이상 작성해주세요" };
      }
      if (!user) return { ok: false as const, error: "로그인이 필요해요" };

      try {
        if (await hasSupabaseSession()) {
          const review = await createReviewDb({
            userId: user.id,
            userName: user.name,
            productId: input.productId,
            content: input.content,
            tags: input.tags,
          });
          setReviews((prev) => [review, ...prev]);
          setWritable((prev) => prev.filter((w) => w.productId !== product.id));
          return { ok: true as const };
        }

        const ordered = buildOrderedTags(input.tags);
        const review: Review = {
          id: `R-NEW-${product.id}-${Date.now()}`,
          productId: product.id,
          productName: product.name,
          userId: user.id,
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
      } catch (e) {
        console.error(e);
        return { ok: false as const, error: "NETWORK" };
      }
    },
    [user]
  );

  const updateReview = useCallback(
    async (input: {
      reviewId: string;
      content: string;
      tags: SituationTags;
    }) => {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        return { ok: false as const, error: "NETWORK" };
      }
      if (input.content.trim().length < 10) {
        return { ok: false as const, error: "후기를 10자 이상 작성해주세요" };
      }
      try {
        if (user && (await hasSupabaseSession())) {
          await updateReviewDb({
            userId: user.id,
            reviewId: input.reviewId,
            content: input.content,
            tags: input.tags,
          });
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
      } catch (e) {
        console.error(e);
        return { ok: false as const, error: "NETWORK" };
      }
    },
    [user]
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
  // 비로그인(게스트)도 장바구니 담기 시 헤더 숫자 표기
  const displayCartCount = cartCount;

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
