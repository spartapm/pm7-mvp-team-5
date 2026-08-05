import { getSupabase } from "./supabase";
import { isValidEmail, isValidPassword, PASSWORD_ERROR } from "./validation";

const LOCAL_USERS_KEY = "kurly-local-users-v1";
const SESSION_KEY = "kurly-auth-session-v1";
const SESSION_DAYS = 7;

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type AuthSession = {
  user: AuthUser;
  expiresAt: number;
  accessToken?: string;
};

type LocalUser = {
  id: string;
  email: string;
  name: string;
  password: string;
};

function readLocalUsers(): LocalUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? (JSON.parse(raw) as LocalUser[]) : [];
  } catch {
    return [];
  }
}

function writeLocalUsers(users: LocalUser[]) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

export function isLocalEmailTaken(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return readLocalUsers().some((u) => u.email.toLowerCase() === normalized);
}

export function readSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    if (!session?.user?.email || !session.expiresAt) return null;
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function writeSession(session: AuthSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function makeSession(user: AuthUser, accessToken?: string): AuthSession {
  return {
    user,
    accessToken,
    expiresAt: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
}

export type AuthResult =
  | { ok: true; session: AuthSession }
  | { ok: false; error: string; field?: "email" | "password" | "form" };

export async function loginWithPassword(
  emailOrId: string,
  password: string
): Promise<AuthResult> {
  const email = emailOrId.trim();
  if (!email || !password) {
    return { ok: false, error: "아이디/비밀번호를 입력해주세요", field: "form" };
  }

  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error && data.user) {
      const name =
        (data.user.user_metadata?.name as string | undefined) ||
        email.split("@")[0];
      const session = makeSession(
        { id: data.user.id, email: data.user.email ?? email, name },
        data.session?.access_token
      );
      writeSession(session);
      return { ok: true, session };
    }
  }

  const local = readLocalUsers().find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  if (!local || local.password !== password) {
    return {
      ok: false,
      error: "아이디/비밀번호를 정확하게 입력해주세요",
      field: "form",
    };
  }

  const session = makeSession({
    id: local.id,
    email: local.email,
    name: local.name,
  });
  writeSession(session);
  return { ok: true, session };
}

export type SignupInput = {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  ageChecked: boolean;
};

export type SignupValidation = {
  emailError: string | null;
  passwordError: string | null;
  passwordConfirmError: string | null;
  nameError: string | null;
  canSubmit: boolean;
};

export function validateSignup(input: SignupInput): SignupValidation {
  const email = input.email.trim();
  const name = input.name.trim();

  let emailError: string | null = null;
  if (email && !isValidEmail(email)) {
    emailError = "이메일이 올바르지 않습니다";
  } else if (email) {
    const localDup = readLocalUsers().some(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (localDup) emailError = "이미 가입된 이메일입니다";
  }

  let passwordError: string | null = null;
  if (input.password && !isValidPassword(input.password)) {
    passwordError = PASSWORD_ERROR;
  }

  let passwordConfirmError: string | null = null;
  if (
    input.passwordConfirm &&
    input.password &&
    input.passwordConfirm !== input.password
  ) {
    passwordConfirmError = "비밀번호가 일치하지 않습니다. 다시 확인해주세요";
  }

  const nameError = null;

  const canSubmit =
    !!email &&
    !!input.password &&
    !!input.passwordConfirm &&
    !!name &&
    input.ageChecked &&
    !emailError &&
    !passwordError &&
    !passwordConfirmError &&
    isValidEmail(email) &&
    isValidPassword(input.password);

  return {
    emailError,
    passwordError,
    passwordConfirmError,
    nameError,
    canSubmit,
  };
}

export async function signup(input: SignupInput): Promise<AuthResult> {
  const email = input.email.trim();
  const name = input.name.trim();
  const validation = validateSignup(input);
  if (!validation.canSubmit) {
    return {
      ok: false,
      error: validation.emailError || validation.passwordError || "입력값을 확인해주세요",
      field: validation.emailError
        ? "email"
        : validation.passwordError
          ? "password"
          : "form",
    };
  }

  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: { data: { name } },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (
        msg.includes("already") ||
        msg.includes("registered") ||
        msg.includes("exists")
      ) {
        return { ok: false, error: "이미 가입된 이메일입니다", field: "email" };
      }
      // fall through to local for demo resilience
    } else if (data.user) {
      // keep local mirror for duplicate checks / offline login
      const users = readLocalUsers();
      if (!users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        users.push({
          id: data.user.id,
          email,
          name,
          password: input.password,
        });
        writeLocalUsers(users);
      }

      const session = makeSession(
        { id: data.user.id, email, name },
        data.session?.access_token
      );
      writeSession(session);
      return { ok: true, session };
    }
  }

  const users = readLocalUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, error: "이미 가입된 이메일입니다", field: "email" };
  }

  const user: LocalUser = {
    id: `local-${Date.now()}`,
    email,
    name,
    password: input.password,
  };
  writeLocalUsers([...users, user]);
  const session = makeSession({ id: user.id, email, name });
  writeSession(session);
  return { ok: true, session };
}

export async function logout() {
  clearSession();
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
  }
}
