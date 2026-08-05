"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/MobileShell";
import { formatPrice, getProduct } from "@/lib/data";
import { useApp } from "@/lib/store";

export default function CartPage() {
  const router = useRouter();
  const {
    cartItems,
    isLoggedIn,
    toggleCartItem,
    toggleSelectAll,
    removeCartItems,
    removeCartItem,
    setCartQuantity,
    completeOrder,
    showToast,
  } = useApp();

  const selected = cartItems.filter((i) => i.selected);
  const allSelected = cartItems.length > 0 && selected.length === cartItems.length;

  const totals = useMemo(() => {
    let original = 0;
    let sale = 0;
    for (const item of selected) {
      const p = getProduct(item.productId);
      if (!p) continue;
      original += p.price * item.quantity;
      sale += p.salePrice * item.quantity;
    }
    return {
      original,
      sale,
      discount: original - sale,
    };
  }, [selected]);

  const handleOrder = () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent("/cart")}`);
      return;
    }
    const result = completeOrder();
    if (!result.ok) {
      showToast(result.error, "error");
      return;
    }
    showToast("주문이 완료되었습니다");
    router.push("/reviews?tab=writable");
  };

  return (
    <MobileShell>
      <header className="sticky top-0 z-40 bg-white border-b border-kurly-line-strong">
        <div className="h-[52px] px-3.5 flex items-center relative">
          <button
            type="button"
            aria-label="닫기"
            className="p-1 -ml-1 text-kurly-ink"
            onClick={() => router.back()}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-[16px] font-semibold text-kurly-ink">
            장바구니
          </h1>
        </div>
      </header>

      <main className="pb-[88px] bg-[#F7F7F7] min-h-[calc(100vh-52px)]">
        {cartItems.length === 0 ? (
          <div className="py-28 text-center text-kurly-muted text-[14px]">
            장바구니에 담긴 상품이 없어요.
          </div>
        ) : (
          <>
            <div className="bg-white px-4 py-3 flex items-center justify-between">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-[14px] text-kurly-ink"
              >
                <CheckBox checked={allSelected} />
                전체선택 {selected.length}/{cartItems.length}
              </button>
              <button
                type="button"
                onClick={() =>
                  removeCartItems(selected.map((i) => i.productId))
                }
                disabled={!selected.length}
                className="h-8 px-3 rounded-[4px] border border-kurly-line-strong text-[13px] text-kurly-sub disabled:opacity-40"
              >
                선택삭제
              </button>
            </div>

            <div className="mx-4 mt-3 rounded-[10px] border border-kurly-line-strong bg-white overflow-hidden">
              {cartItems.map((item, idx) => {
                const product = getProduct(item.productId);
                if (!product) return null;
                return (
                  <div
                    key={item.productId}
                    className={`px-3.5 py-4 ${
                      idx > 0 ? "border-t border-kurly-line" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => toggleCartItem(item.productId)}
                        className="mt-0.5"
                        aria-label="선택"
                      >
                        <CheckBox checked={item.selected} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[14px] font-bold text-kurly-ink leading-snug">
                              {product.name}
                            </p>
                            <p className="text-[12px] text-kurly-muted mt-0.5 truncate">
                              {product.brand} · {product.unit}
                            </p>
                          </div>
                          <button
                            type="button"
                            aria-label="삭제"
                            onClick={() => removeCartItem(item.productId)}
                            className="text-kurly-faint p-0.5"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M6 6l12 12M18 6 6 18"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        </div>

                        <div className="mt-3 flex gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product.image}
                            alt=""
                            className="w-[72px] h-[72px] rounded-[6px] object-cover bg-[#EDEDED] flex-shrink-0"
                          />
                          <div className="flex-1">
                            <p className="text-[16px] font-bold text-kurly-ink">
                              {formatPrice(product.salePrice * item.quantity)}
                            </p>
                            {product.salePrice < product.price && (
                              <p className="text-[13px] text-kurly-faint line-through mt-0.5">
                                {formatPrice(product.price * item.quantity)}
                              </p>
                            )}
                            <div className="mt-2.5 inline-flex items-center h-8 rounded-[4px] border border-kurly-line-strong bg-[#FAFAFA]">
                              <button
                                type="button"
                                className="w-8 h-8 text-kurly-sub text-[16px]"
                                onClick={() =>
                                  setCartQuantity(
                                    item.productId,
                                    Math.max(1, item.quantity - 1)
                                  )
                                }
                              >
                                −
                              </button>
                              <span className="w-8 text-center text-[13px] font-medium">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                className="w-8 h-8 text-kurly-sub text-[16px]"
                                onClick={() =>
                                  setCartQuantity(
                                    item.productId,
                                    item.quantity + 1
                                  )
                                }
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="bg-[#F5F5F5] px-4 py-3.5 text-right">
                <span className="text-[16px] font-bold text-kurly-ink">
                  {formatPrice(totals.sale)}
                </span>
              </div>
            </div>

            <div className="mx-4 mt-4 bg-white rounded-[10px] px-4 py-4 space-y-2.5">
              <div className="flex justify-between text-[14px]">
                <span className="text-kurly-sub">상품 금액</span>
                <span className="text-kurly-ink font-medium">
                  {formatPrice(totals.original)}
                </span>
              </div>
              <div className="flex justify-between text-[14px]">
                <span className="text-kurly-sub">상품 할인 금액</span>
                <span className="text-kurly-danger font-medium">
                  -{formatPrice(totals.discount)}
                </span>
              </div>
            </div>
          </>
        )}
      </main>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile bg-white border-t border-kurly-line-strong px-4 py-3">
        <button
          type="button"
          onClick={handleOrder}
          disabled={cartItems.length === 0 || (isLoggedIn && selected.length === 0)}
          className={`w-full h-[52px] rounded-[6px] text-[16px] font-bold text-white ${
            cartItems.length === 0 || (isLoggedIn && selected.length === 0)
              ? "bg-[#CCCCCC] cursor-not-allowed"
              : "bg-kurly-purple active:bg-kurly-purple-dark"
          }`}
        >
          {isLoggedIn
            ? `${formatPrice(totals.sale)} 주문하기`
            : "로그인"}
        </button>
      </div>
    </MobileShell>
  );
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`w-5 h-5 rounded-[3px] border flex items-center justify-center ${
        checked
          ? "bg-kurly-ink border-kurly-ink"
          : "bg-white border-kurly-line-strong"
      }`}
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M2.5 6.2 4.8 8.5 9.5 3.5"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}
