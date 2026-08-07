import { getSupabase } from "./supabase";
import { buildOrderedTags, countTags } from "./tags";
import type { CartItem, Review, SituationTags, WritableItem } from "./types";
import { getProduct } from "./data";

export type DbReviewRow = {
  id: string;
  product_id: string;
  user_id: string | null;
  author_label: string;
  author_grade: string | null;
  rating: number;
  content: string;
  situation_tags: SituationTags;
  photos: string[] | null;
  helpful: number;
  qa_note: string | null;
  created_at: string;
};

function mapReview(row: DbReviewRow, myId?: string | null): Review {
  const tags = {
    headcount: row.situation_tags?.headcount ?? null,
    purpose: row.situation_tags?.purpose ?? null,
    companion: row.situation_tags?.companion ?? null,
    taste: row.situation_tags?.taste ?? [],
  } as SituationTags;
  const ordered = buildOrderedTags(tags);
  const product = getProduct(row.product_id);
  const created = row.created_at?.replace("T", " ").slice(0, 16) ?? "";
  return {
    id: row.id,
    productId: row.product_id,
    productName: product?.name ?? row.product_id,
    userId: row.user_id ?? `seed:${row.author_label}`,
    authorLabel: row.author_label,
    rating: row.rating,
    createdAt: created,
    content: row.content,
    charCount: row.content.length,
    situationTags: tags,
    orderedTags: ordered,
    tagCount: countTags(tags),
    showBadge: ordered.length > 0,
    hasPhoto: (row.photos?.length ?? 0) > 0,
    photos: row.photos ?? [],
    helpful: row.helpful ?? 0,
    qaNote: row.qa_note,
    isMine: !!myId && row.user_id === myId,
  };
}

export async function fetchAllReviews(): Promise<Review[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as DbReviewRow[]).map((r) => mapReview(r));
}

export async function fetchCart(userId: string): Promise<CartItem[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("cart_items")
    .select("product_id, quantity, selected")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    productId: r.product_id as string,
    quantity: r.quantity as number,
    selected: r.selected as boolean,
  }));
}

export async function upsertCartItem(
  userId: string,
  item: CartItem
): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase 미설정");
  const { error } = await sb.from("cart_items").upsert(
    {
      user_id: userId,
      product_id: item.productId,
      quantity: item.quantity,
      selected: item.selected,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,product_id" }
  );
  if (error) throw error;
}

export async function deleteCartItems(
  userId: string,
  productIds: string[]
): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase 미설정");
  if (!productIds.length) return;
  const { error } = await sb
    .from("cart_items")
    .delete()
    .eq("user_id", userId)
    .in("product_id", productIds);
  if (error) throw error;
}

export async function clearCart(userId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase 미설정");
  const { error } = await sb.from("cart_items").delete().eq("user_id", userId);
  if (error) throw error;
}

export async function fetchWritable(userId: string): Promise<WritableItem[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data: items, error } = await sb
    .from("order_items")
    .select("id, product_id, quantity, orders!inner(user_id, created_at)")
    .eq("orders.user_id", userId)
    .order("created_at", { ascending: false, foreignTable: "orders" });
  if (error) throw error;

  // 작성한 후기 여부와 무관하게, 주문(주문일시) 기준으로 카드 1개씩
  const writable: WritableItem[] = [];
  for (const row of items ?? []) {
    const order = row.orders as { created_at?: string } | null;
    const created = order?.created_at
      ? order.created_at.replace("T", " ").slice(0, 19)
      : formatNow();
    writable.push({
      id: String(row.id),
      productId: row.product_id as string,
      orderedAt: created,
    });
  }
  // 최신 주문순
  writable.sort((a, b) => (a.orderedAt < b.orderedAt ? 1 : -1));
  return writable;
}

function formatNow() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export async function createOrder(input: {
  userId: string;
  items: CartItem[];
}): Promise<{ orderId: string }> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase 미설정");

  const selected = input.items.filter((i) => i.selected);
  if (!selected.length) throw new Error("주문할 상품을 선택해주세요");

  let totalSale = 0;
  let totalOriginal = 0;
  const lines = selected.map((item) => {
    const p = getProduct(item.productId);
    if (!p) throw new Error("상품을 찾을 수 없어요");
    totalSale += p.salePrice * item.quantity;
    totalOriginal += p.price * item.quantity;
    return {
      product_id: item.productId,
      quantity: item.quantity,
      unit_sale_price: p.salePrice,
      unit_original_price: p.price,
    };
  });

  const { data: order, error: oErr } = await sb
    .from("orders")
    .insert({
      user_id: input.userId,
      total_sale: totalSale,
      total_original: totalOriginal,
      status: "paid",
    })
    .select("id")
    .single();
  if (oErr) throw oErr;

  const { error: iErr } = await sb.from("order_items").insert(
    lines.map((l) => ({ ...l, order_id: order.id }))
  );
  if (iErr) throw iErr;

  await clearCart(input.userId);
  return { orderId: order.id as string };
}

export async function createReviewDb(input: {
  userId: string;
  userName: string;
  productId: string;
  content: string;
  tags: SituationTags;
}): Promise<Review> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase 미설정");
  const product = getProduct(input.productId);
  if (!product) throw new Error("상품을 찾을 수 없어요");
  if (input.content.trim().length < 10) {
    throw new Error("후기를 10자 이상 작성해주세요");
  }

  const id = `R-USER-${input.productId}-${Date.now()}`;
  const maskedName = input.userName.trim()
    ? `${input.userName.trim()[0]}**`
    : "회**";
  const row = {
    id,
    product_id: input.productId,
    user_id: input.userId,
    author_label: maskedName,
    author_grade: null as string | null,
    rating: 5,
    content: input.content.trim(),
    situation_tags: input.tags,
    photos: [] as string[],
    helpful: 0,
    qa_note: null as string | null,
  };

  const { data, error } = await sb.from("reviews").insert(row).select("*").single();
  if (error) throw error;

  // review_count bump (best-effort)
  await sb
    .from("products")
    .update({ review_count: (product.reviewCount || 0) + 1 })
    .eq("id", input.productId);

  return mapReview(data as DbReviewRow, input.userId);
}

export async function updateReviewDb(input: {
  userId: string;
  reviewId: string;
  content: string;
  tags: SituationTags;
}): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase 미설정");
  if (input.content.trim().length < 10) {
    throw new Error("후기를 10자 이상 작성해주세요");
  }
  const { error } = await sb
    .from("reviews")
    .update({
      content: input.content.trim(),
      situation_tags: input.tags,
    })
    .eq("id", input.reviewId)
    .eq("user_id", input.userId);
  if (error) throw error;
}

/** 프로필만 보장 — 더미 주문/후기 자동 시드 하지 않음 */
export async function ensureUserBootstrap(userId: string, userName: string) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("profiles").upsert(
    { id: userId, name: userName },
    { onConflict: "id" }
  );
}

export async function mergeGuestCartToDb(
  userId: string,
  guestItems: CartItem[]
): Promise<CartItem[]> {
  if (!guestItems.length) return fetchCart(userId);
  const existing = await fetchCart(userId);
  const map = new Map(existing.map((i) => [i.productId, i]));
  for (const g of guestItems) {
    const cur = map.get(g.productId);
    if (cur) {
      map.set(g.productId, {
        productId: g.productId,
        quantity: cur.quantity + g.quantity,
        selected: true,
      });
    } else {
      map.set(g.productId, { ...g, selected: true });
    }
  }
  const merged = Array.from(map.values());
  for (const item of merged) {
    await upsertCartItem(userId, item);
  }
  return merged;
}
