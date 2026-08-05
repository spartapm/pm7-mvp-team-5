"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { MobileShell } from "@/components/MobileShell";
import { loginWithPassword } from "@/lib/auth";
import { useApp } from "@/lib/store";

function LoginInner() {
  const router = useRouter();
  const search = useSearchParams();
  const redirect = search.get("redirect") || "/mypage";
  const { setUser, showToast, hydrated, isLoggedIn } = useApp();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hydrated && isLoggedIn) {
      router.replace(redirect);
    }
  }, [hydrated, isLoggedIn, redirect, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const result = await loginWithPassword(id, password);
    setLoading(false);
    if (!result.ok) {
      showToast(result.error, "error");
      return;
    }
    setUser(result.session.user);
    router.replace(redirect);
  };

  return (
    <MobileShell>
      <Header title="로그인" titleAlign="left" showBack showBell={false} />
      <main className="px-4 pt-8">
        <form onSubmit={onSubmit}>
          <div className="rounded-[6px] border border-kurly-line-strong overflow-hidden bg-white">
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="아이디 입력"
              autoComplete="username"
              className="w-full h-[52px] px-4 text-[15px] outline-none placeholder:text-kurly-faint"
            />
            <div className="h-px bg-kurly-line-strong" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              autoComplete="current-password"
              className="w-full h-[52px] px-4 text-[15px] outline-none placeholder:text-kurly-faint"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full h-[52px] rounded-[6px] bg-kurly-purple text-white text-[16px] font-bold active:bg-kurly-purple-dark disabled:opacity-70"
          >
            로그인
          </button>
        </form>

        <button
          type="button"
          onClick={() =>
            router.push(
              `/signup?redirect=${encodeURIComponent(redirect)}`
            )
          }
          className="mt-3 w-full h-[52px] rounded-[6px] border border-kurly-purple text-kurly-purple text-[16px] font-bold bg-white"
        >
          회원가입
        </button>
      </main>
    </MobileShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-kurly-muted">
          로딩 중…
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
