// ─────────────────────────────────────────────────────────────────────────────
// DIRECTUS API LAYER
// ─────────────────────────────────────────────────────────────────────────────
import { Commitment } from "../types";

export const DEFAULT_BASE_URL = "https://ai-enterprise.up.railway.app";

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

    // 401/403 → notify the session owner so it can tear down auth state.
    // Skip auth endpoints to avoid loops (bad creds, logout already tearing down).
    if (
      (res.status === 401 || res.status === 403) &&
      !SKIP_UNAUTH_PATHS.some((p) => path.startsWith(p))
    ) {
      opts.onUnauthorized?.();
    }

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

    // ── Commitment Payments ─────────────────────────────────────────────────
    // One row = one paid month. No row = unpaid. Delete = undo.
    getPayments: (commitmentId: number | string) =>
      req(
        "GET",
        `/items/commitment_payments_ai?filter[commitment][_eq]=${commitmentId}&sort=month`
      ),

    getAllPayments: () =>
      req(
        "GET",
        `/items/commitment_payments_ai?filter[commitment][user_created][_eq]=$CURRENT_USER&sort=month`
      ),

    markPaid: (commitmentId: number | string, month: string) =>
      req("POST", "/items/commitment_payments_ai", { commitment: commitmentId, month }),

    unmarkPaid: (paymentId: number | string) =>
      req("DELETE", `/items/commitment_payments_ai/${paymentId}`, null),
  };
}

export type ApiClient = ReturnType<typeof makeApi>;