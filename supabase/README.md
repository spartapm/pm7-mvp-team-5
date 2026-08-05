# Supabase 설정 가이드 (pm7-mvp-team-5)

## 1. SQL 실행

1. [Supabase Dashboard](https://supabase.com/dashboard/project/defeeiwpbziodzrbilnj) 접속
2. **SQL Editor** → New query
3. 아래 파일 전체를 복사해서 실행

`supabase/schema.sql`

포함 내용:
- `profiles` / `products` / `reviews` / `cart_items` / `orders` / `order_items`
- RLS 정책
- 더미 상품 8개 + 후기 시드 99개
- 회원가입 시 `profiles` 자동 생성 트리거

## 2. Auth 설정 (시연용 필수)

**Authentication → Providers → Email**

- **Confirm email**: **OFF** (끄기)

켜져 있으면 가입 직후 세션이 안 나와 DB 저장이 안 됩니다.

## 3. 환경변수

`.env.local` (이미 있음):

```
NEXT_PUBLIC_SUPABASE_URL=https://defeeiwpbziodzrbilnj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

## 4. 동작 요약

| 기능 | 동작 |
| --- | --- |
| 장바구니 담기 | 로그인 시 `cart_items`에 저장 |
| 주문하기(가짜 결제) | `orders` + `order_items` insert, 상태 `paid`, 장바구니 비움 |
| 작성 가능 후기 | 주문한 상품 중 아직 내가 후기 안 쓴 것 |
| 후기 작성/수정 | `reviews` insert/update (상황 태그 JSON 포함) |
| 첫 로그인 | 시연용으로 작성가능 3상품 + 수정용 후기 3개 자동 시드 |

실제 PG/카드 결제는 붙이지 않습니다. CTA만 “상품 구매가 완료되었습니다”로 처리합니다.
