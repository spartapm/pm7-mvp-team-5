"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { MobileShell } from "@/components/MobileShell";
import { isLocalEmailTaken, signup, validateSignup } from "@/lib/auth";
import { isValidEmail } from "@/lib/validation";
import { useApp } from "@/lib/store";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <label className="block text-[14px] font-semibold text-kurly-ink mb-2">
        {label} <span className="text-kurly-danger">*</span>
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-[12px] text-kurly-danger leading-snug">{error}</p>
      )}
    </div>
  );
}

function SignupInner() {
  const router = useRouter();
  const search = useSearchParams();
  const redirect = search.get("redirect") || "/mypage";
  const { setUser, showToast } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [ageChecked, setAgeChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverEmailError, setServerEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (!email.trim() || !isValidEmail(email)) {
      setServerEmailError(null);
      return;
    }
    if (isLocalEmailTaken(email)) {
      setServerEmailError("이미 가입된 이메일입니다");
    } else {
      setServerEmailError(null);
    }
  }, [email]);

  const validation = useMemo(
    () =>
      validateSignup({
        email,
        password,
        passwordConfirm,
        name,
        ageChecked,
      }),
    [email, password, passwordConfirm, name, ageChecked]
  );

  const emailError = serverEmailError || validation.emailError;
  const canSubmit = validation.canSubmit && !serverEmailError && !loading;

  const inputClass = (hasError: boolean) =>
    `w-full h-[48px] px-3.5 rounded-[6px] border text-[14px] outline-none placeholder:text-kurly-faint ${
      hasError
        ? "border-kurly-danger text-kurly-ink"
        : "border-kurly-line-strong focus:border-kurly-purple"
    }`;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setServerEmailError(null);
    const result = await signup({
      email,
      password,
      passwordConfirm,
      name,
      ageChecked,
    });
    setLoading(false);
    if (!result.ok) {
      if (result.field === "email") setServerEmailError(result.error);
      else showToast(result.error, "error");
      return;
    }
    await setUser(result.session.user);
    router.replace(redirect);
  };

  return (
    <MobileShell>
      <Header title="회원가입" titleAlign="left" showBack showBell={false} />
      <main className="px-4 pt-6 pb-10">
        <form onSubmit={onSubmit}>
          <Field label="이메일" error={emailError}>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setServerEmailError(null);
              }}
              placeholder="이메일을 입력해주세요"
              className={inputClass(!!emailError)}
              autoComplete="email"
            />
          </Field>

          <Field label="비밀번호" error={validation.passwordError}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력해주세요"
              className={inputClass(!!validation.passwordError)}
              autoComplete="new-password"
            />
          </Field>

          <Field label="비밀번호 확인" error={validation.passwordConfirmError}>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="비밀번호를 한번 더 입력해주세요"
              className={inputClass(!!validation.passwordConfirmError)}
              autoComplete="new-password"
            />
          </Field>

          <Field label="이름" error={validation.nameError}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력해 주세요"
              className={inputClass(!!validation.nameError)}
              autoComplete="name"
            />
          </Field>

          <button
            type="button"
            onClick={() => setAgeChecked((v) => !v)}
            className="flex items-center gap-2.5 mb-8 text-left"
          >
            <span
              className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                ageChecked
                  ? "bg-kurly-purple border-kurly-purple"
                  : "border-kurly-line-strong bg-white"
              }`}
            >
              {ageChecked && (
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
            <span className="text-[14px] text-kurly-ink">
              본인은 만 14세 이상입니다 (필수)
            </span>
          </button>

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full h-[52px] rounded-[6px] text-[16px] font-bold text-white ${
              canSubmit
                ? "bg-kurly-purple active:bg-kurly-purple-dark"
                : "bg-[#CCCCCC] cursor-not-allowed"
            }`}
          >
            가입하기
          </button>
        </form>
      </main>
    </MobileShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-kurly-muted">
          로딩 중…
        </div>
      }
    >
      <SignupInner />
    </Suspense>
  );
}
