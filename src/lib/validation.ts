const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_PW = /^[A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

/** 10자 이상 + 영문/숫자/특수문자(공백 제외) 중 2개 이상 조합 */
export function isValidPassword(password: string): boolean {
  if (password.length < 10) return false;
  if (/\s/.test(password)) return false;
  if (!ALLOWED_PW.test(password)) return false;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return [hasLetter, hasNumber, hasSpecial].filter(Boolean).length >= 2;
}

/** 와이어프레임 회원가입 비밀번호 유효성 문구 */
export const PASSWORD_ERROR =
  "10자 이상, 영문/숫자/특수문자(공백 제외) 중 2개 이상 조합";
