// ─────────────────────────────────────────────────────────────────────────────
// DIRECTUS API LAYER
// ─────────────────────────────────────────────────────────────────────────────
import { Commitment } from "../types";

export const DEFAULT_BASE_URL = "https://ai-enterpise.up.railway.app";

export interface MakeApiOptions {
  onUnauthorized?: () => void;
}

// Endpoints whose 401/403 should NOT trigger the unauthorized callback.
// (Login: wrong credentials are expected; Logout: we're already tearing down.)
const SKIP_UNAUTH_PATHS = ["/auth/login", "/auth/logout"];

export function makeApi(
  baseUrl: string,
  token: string | null,
  opts: MakeApiOptions = {}
) {
  const headers = (extra: Record<string, string> = {}): Record<string, string> => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  });

  const req = async <T = any>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> => {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });

  // 204 No Content (e.g. DELETE) — no body to parse
  if (res.status === 204) return undefined as T;

  const json = await res.json();
  if (!res.ok)
    throw new Error(
      json?.errors?.[0]?.message || json?.message || "Request failed"
    );
  return json;
};

  return {
    // ── Auth ──────────────────────────────────────────────────────────────
    login: (email: string, password: string) =>
      req("POST", "/auth/login", { email, password }),

    logout: (refreshToken: string | null) =>
      req("POST", "/auth/logout", { refresh_token: refreshToken }),

    me: () => req("GET", "/users/me"),

    // ── Modules ───────────────────────────────────────────────────────────
    getModules: () =>
      req(
        "GET",
        "/items/modules_ai?filter[status][_eq]=published&sort=sort,name"
      ),

    // ── Commitments ───────────────────────────────────────────────────────
    getCommitments: () =>
      req(
        "GET",
        "/items/commitments_ai?filter[user_created][_eq]=$CURRENT_USER&sort=-date_created"
      ),

    createCommitment: (data: Partial<Commitment>) =>
      req("POST", "/items/commitments_ai", data),

    updateCommitment: (id: number | string, data: Partial<Commitment>) =>
      req("PATCH", `/items/commitments_ai/${id}`, data),

    deleteCommitment: (id: number | string) =>
      req("DELETE", `/items/commitments_ai/${id}`, null),

    // ── User Profiles (salary) ─────────────────────────────────────────────
    getProfile: (userId: number | string) =>
      req(
        "GET",
        `/items/user_profiles_ai?filter[user][_eq]=${userId}&limit=1`,
        undefined
      ),

    createProfile: (userId: number | string, salary: number) =>
      req("POST", "/items/user_profiles_ai", { user: userId, salary }),

    updateProfile: (id: number | string, salary: number) =>
      req("PATCH", `/items/user_profiles_ai/${id}`, { salary }),
  };
}

export type ApiClient = ReturnType<typeof makeApi>;
