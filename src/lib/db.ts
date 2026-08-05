import { getSupabase } from "./supabase";
import { buildOrderedTags, countTags, EMPTY_TAGS } from "./tags";
import type { CartItem, Review, SituationTags, WritableItem } from "./types";
import { getProduct, products } from "./data";

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

function makeDeadline(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}.${dd}까지 작성 가능`;
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

  const [{ data: items, error: e1 }, { data: myReviews, error: e2 }] =
    await Promise.all([
      sb
        .from("order_items")
        .select("product_id, orders!inner(user_id, created_at)")
        .eq("orders.user_id", userId),
      sb.from("reviews").select("product_id").eq("user_id", userId),
    ]);
  if (e1) throw e1;
  if (e2) throw e2;

  const reviewed = new Set((myReviews ?? []).map((r) => r.product_id as string));
  const seen = new Set<string>();
  const writable: WritableItem[] = [];
  for (const row of items ?? []) {
    const pid = row.product_id as string;
    if (reviewed.has(pid) || seen.has(pid)) continue;
    seen.add(pid);
    writable.push({ productId: pid, deadline: makeDeadline(14) });
  }
  return writable;
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
  const row = {
    id,
    product_id: input.productId,
    user_id: input.userId,
    author_label: input.userName,
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

/** 첫 로그인 시연용: 작성가능 3개 + 수정용 후기 3개 시드 */
export async function ensureUserBootstrap(userId: string, userName: string) {
  const sb = getSupabase();
  if (!sb) return;

  const { count: orderCount } = await sb
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const { count: myReviewCount } = await sb
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const writableProducts = products.filter((p) => p.writableForMaster).slice(0, 3);
  const editProducts = products.filter((p) => !p.writableForMaster).slice(0, 3);

  if (!orderCount) {
    const { data: order, error } = await sb
      .from("orders")
      .insert({
        user_id: userId,
        total_sale: writableProducts.reduce((s, p) => s + p.salePrice, 0),
        total_original: writableProducts.reduce((s, p) => s + p.price, 0),
        status: "paid",
      })
      .select("id")
      .single();
    if (!error && order) {
      await sb.from("order_items").insert(
        writableProducts.map((p) => ({
          order_id: order.id,
          product_id: p.id,
          quantity: 1,
          unit_sale_price: p.salePrice,
          unit_original_price: p.price,
        }))
      );
    }
  }

  if (!myReviewCount) {
    const demos = [
      {
        tags: {
          headcount: "2~3인",
          purpose: "일상",
          companion: "혼자",
          taste: ["담백해요"],
        } as SituationTags,
        content:
          "차돌박이가 두툼하고 육즙이 가득해서 구워 먹으니 정말 맛있어요. 재구매 의사 있습니다.",
      },
      {
        tags: {
          headcount: "1~2인",
          purpose: "술안주",
          companion: "연인과",
          taste: ["매콤해요", "짭짤해요"],
        } as SituationTags,
        content:
          "간이 세지 않고 담백해서 밥반찬으로 좋아요. 에어프라이어에 데워 먹으니 더 맛있었습니다.",
      },
      {
        tags: { ...EMPTY_TAGS },
        content:
          "전체적으로 무난한 맛이었어요. 특별한 건 없지만 간편식으로 쓰기 좋습니다.",
      },
    ];

    const rows = editProducts.map((p, idx) => ({
      id: `R-BOOT-${userId.slice(0, 8)}-${p.id}`,
      product_id: p.id,
      user_id: userId,
      author_label: userName,
      author_grade: null,
      rating: 5,
      content: demos[idx].content,
      situation_tags: demos[idx].tags,
      photos: [],
      helpful: 0,
      qa_note: "bootstrap-edit-demo",
    }));

    await sb.from("reviews").upsert(rows, { onConflict: "id" });
  }
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
