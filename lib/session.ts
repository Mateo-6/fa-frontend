export interface SessionData {
  token: string;
  refreshToken: string;
  user: unknown;
}

const SESSION_KEYS = ["fa_token", "fa_refresh_token", "fa_user"] as const;

export function clearSession(): void {
  for (const key of SESSION_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}

export function saveSession(session: SessionData, persistent: boolean = false): void {
  clearSession();
  const storage = persistent ? localStorage : sessionStorage;
  storage.setItem("fa_token", session.token);
  storage.setItem("fa_refresh_token", session.refreshToken);
  storage.setItem("fa_user", JSON.stringify(session.user));
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("fa_refresh_token") || sessionStorage.getItem("fa_refresh_token");
}

export function updateAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  const storage = localStorage.getItem("fa_refresh_token") !== null ? localStorage : sessionStorage;
  storage.setItem("fa_token", token);
}

export function updateStoredUser(user: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const storage = localStorage.getItem("fa_user") !== null ? localStorage : sessionStorage;
  try {
    const parsed = storage.getItem("fa_user") ? JSON.parse(storage.getItem("fa_user") as string) : {};
    storage.setItem("fa_user", JSON.stringify({ ...parsed, ...user }));
  } catch {
    storage.setItem("fa_user", JSON.stringify(user));
  }
}