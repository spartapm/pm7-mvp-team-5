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
  formatOrderedAt,
  getProduct,
  initialReviews,
  initialWritable,
  maskNickname,
} from "./data";
import { getSupabase } from "./supabase";
import { buildOrderedTags, countTags } from "./tags";
import type { CartItem, Review, SituationTags, WritableItem } from "./types";

const STORAGE_KEY = "kurly-situation-tag-mvp-v5";
const HELPFUL_KEY = "kurly-helpful-votes-v1";

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
  helpfulVotes: Record<string, boolean>;
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
    writableId?: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  updateReview: (input: {
    reviewId: string;
    content: string;
    tags: SituationTags;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  toggleHelpful: (reviewId: string) => void;
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
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, boolean>>({});

  const showToast = useCallback(
    (message: string, variant: Toast["variant"] = "default") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, variant }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 2000);
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
          // 후기/작성가능은 시드·DB 기준으로 — 로컬 더미 덮어쓰기 방지
          if (parsed.writable?.length) setWritable(parsed.writable);
        }
        try {
          const votes = localStorage.getItem(HELPFUL_KEY);
          if (votes) setHelpfulVotes(JSON.parse(votes) as Record<string, boolean>);
        } catch {
          /* ignore */
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
            // 로컬 로그인: 내 후기만 isMine 표시 (더미 이관 없음)
            setReviews((prev) =>
              prev.map((r) => ({ ...r, isMine: r.userId === session.user.id }))
            );
          }
        } else {
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
    const payload: Persisted = {
      cartItems: user ? [] : cartItems,
      writable: user ? writable : [],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [cartItems, writable, hydrated, user]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(HELPFUL_KEY, JSON.stringify(helpfulVotes));
  }, [helpfulVotes, hydrated]);

  const setUser = useCallback(
    async (next: AuthUser | null) => {
      setUserState(next);
      if (!next) return;
      const online = await hasSupabaseSession();
      if (!online) {
        setReviews((prev) =>
          prev.map((r) => ({ ...r, isMine: r.userId === next.id }))
        );
        setWritable([]);
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
        const orderedAt = formatOrderedAt();
        setWritable((prev) => {
          const next = [...prev];
          // 작성한 후기 여부와 무관하게 추가. 주문 1건당 상품 카드 1개.
          selected.forEach((item) => {
            next.push({
              id: `local-${item.productId}-${Date.now()}-${Math.random()}`,
              productId: item.productId,
              orderedAt,
            });
          });
          next.sort((a, b) => (a.orderedAt < b.orderedAt ? 1 : -1));
          return next;
        });
        setCartItems((prev) => prev.filter((i) => !i.selected));
      }
      return { ok: true as const, count: selected.length };
    } catch (e) {
      console.error(e);
      return { ok: false as const, error: "결제(주문) 처리에 실패했어요" };
    }
  }, [cartItems, user]);

  const createReview = useCallback(
    async (input: {
      productId: string;
      content: string;
      tags: SituationTags;
      writableId?: string;
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

      const removeWritable = () => {
        setWritable((prev) => {
          if (input.writableId) {
            return prev.filter((w) => w.id !== input.writableId);
          }
          const idx = prev.findIndex((w) => w.productId === product.id);
          if (idx < 0) return prev;
          return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
        });
      };

      try {
        if (await hasSupabaseSession()) {
          try {
            const review = await createReviewDb({
              userId: user.id,
              userName: user.name,
              productId: input.productId,
              content: input.content,
              tags: input.tags,
            });
            setReviews((prev) => [review, ...prev]);
            removeWritable();
            return { ok: true as const };
          } catch (dbErr) {
            console.error("createReviewDb failed, local fallback", dbErr);
            // fall through to local so UX doesn't break
          }
        }

        const ordered = buildOrderedTags(input.tags);
        const review: Review = {
          id: `R-NEW-${product.id}-${Date.now()}`,
          productId: product.id,
          productName: product.name,
          userId: user.id,
          authorLabel: maskNickname(user.name || "회원"),
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
        removeWritable();
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
      const target = reviews.find((r) => r.id === input.reviewId);
      if (!target) return { ok: false as const, error: "후기를 찾을 수 없어요" };
      if (user && target.userId !== user.id && !target.isMine) {
        return { ok: false as const, error: "본인 후기만 수정할 수 있어요" };
      }

      try {
        if (user && (await hasSupabaseSession()) && target.userId === user.id) {
          try {
            await updateReviewDb({
              userId: user.id,
              reviewId: input.reviewId,
              content: input.content,
              tags: input.tags,
            });
          } catch (dbErr) {
            console.error("updateReviewDb failed, local update", dbErr);
          }
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
    [reviews, user]
  );

  const toggleHelpful = useCallback((reviewId: string) => {
    setHelpfulVotes((prev) => {
      const voted = !!prev[reviewId];
      setReviews((list) =>
        list.map((r) =>
          r.id === reviewId
            ? { ...r, helpful: Math.max(0, r.helpful + (voted ? -1 : 1)) }
            : r
        )
      );
      return { ...prev, [reviewId]: !voted };
    });
  }, []);

  const getMyReviews = useCallback(() => {
    if (!user) return [];
    return reviews.filter((r) => r.userId === user.id || r.isMine);
  }, [reviews, user]);

  const getProductReviews = useCallback(
    (productId: string) => reviews.filter((r) => r.productId === productId),
    [reviews]
  );

  const getWritable = useCallback(() => {
    return [...writable].sort((a, b) => (a.orderedAt < b.orderedAt ? 1 : -1));
  }, [writable]);

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
      helpfulVotes,
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
      toggleHelpful,
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
      helpfulVotes,
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
      toggleHelpful,
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
