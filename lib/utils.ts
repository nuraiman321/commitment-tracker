// ─────────────────────────────────────────────────────────────────────────────
// HELPERS & SHARED STYLES
// ─────────────────────────────────────────────────────────────────────────────
import { CSSProperties, useRef, useCallback } from "react";
import { Commitment } from "../types";

// ── Date-based commitment helpers ─────────────────────────────────────────────

/** Parse last_date string into a Date at start of that month */
export function parseLastDate(last_date: string): Date {
  const [y, m, d] = last_date.split("-").map(Number);
  return new Date(y, m - 1, d || 1);
}

/** Months remaining from today until last_date (inclusive). 0 if reached/passed. */
export function monthsLeft(c: Commitment): number {
  if (!c.last_date) return 0;
  const end   = parseLastDate(c.last_date);
  const now   = new Date();
  // compare year+month only
  const diff  =
    (end.getFullYear() - now.getFullYear()) * 12 +
    (end.getMonth() - now.getMonth());
  return Math.max(diff, 0);
}

/** Total months from today to last_date (can be negative if past) */
export function totalMonths(c: Commitment): number {
  if (!c.last_date) return 0;
  const end  = parseLastDate(c.last_date);
  const now  = new Date();
  return (
    (end.getFullYear() - now.getFullYear()) * 12 +
    (end.getMonth() - now.getMonth())
  );
}

/** Whether the commitment has reached or passed its last payment month */
export function isCompleted(c: Commitment): boolean {
  if (!c.last_date) return false;
  const end = parseLastDate(c.last_date);
  const now = new Date();
  return (
    now.getFullYear() > end.getFullYear() ||
    (now.getFullYear() === end.getFullYear() && now.getMonth() >= end.getMonth())
  );
}

/** Remaining balance = amount × months left */
export const totalLeft = (c: Commitment) => (c.amount || 0) * monthsLeft(c);

/** Format a date string as "Jan 2027" */
export function formatLastDate(last_date: string): string {
  if (!last_date) return "—";
  const d = parseLastDate(last_date);
  return d.toLocaleString("en-MY", { month: "short", year: "numeric" });
}

/** Today as YYYY-MM-DD for date input min */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export const fmt = (n: number) =>
  "RM " +
  (n || 0).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const errMsg = (e: unknown) =>
  e instanceof Error ? e.message : String(e);

// ── Debounce hook ─────────────────────────────────────────────────────────────
// Uses a ref for the callback so it always calls the latest version of `fn`
// without needing it in the dependency array — prevents stale closure NaN bugs.
export function useDebounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
) {
  const fnRef = useRef<T>(fn);
  const t     = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the ref current on every render
  fnRef.current = fn;

  return useCallback(
    (...args: Parameters<T>) => {
      if (t.current) clearTimeout(t.current);
      t.current = setTimeout(() => fnRef.current(...args), delay);
    },
    [delay] // only delay matters — fn is always fresh via ref
  );
}

// ── Shared style helpers ──────────────────────────────────────────────────────
export const mono = "'DM Mono', monospace";
export const sans = "'Sora', sans-serif";

export const labelStyle: CSSProperties = {
  fontSize: 10,
  letterSpacing: 3,
  color: "#444",
  textTransform: "uppercase",
  marginBottom: 4,
  fontFamily: mono,
};

export const btn = (
  bg: string,
  col: string,
  extra: CSSProperties = {}
): CSSProperties => ({
  background: bg,
  color: col,
  border: "none",
  borderRadius: 6,
  padding: "7px 14px",
  cursor: "pointer",
  fontSize: 11,
  fontFamily: mono,
  fontWeight: 500,
  letterSpacing: 0.5,
  transition: "opacity .15s",
  ...extra,
});

export const fieldStyle = (hasErr: boolean): CSSProperties => ({
  width: "100%",
  background: "#0a0a0a",
  border: `1px solid ${hasErr ? "#e76f51" : "#1e1e1e"}`,
  borderRadius: 8,
  color: "#f0ede8",
  fontSize: 13,
  padding: "11px 14px",
  boxSizing: "border-box",
  fontFamily: mono,
  outline: "none",
  transition: "border-color .2s",
});

// ── Global CSS ────────────────────────────────────────────────────────────────
export const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Sora:wght@300;400;600&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#0a0a0a; color:#f0ede8; }
  input::-webkit-inner-spin-button,
  input::-webkit-outer-spin-button { -webkit-appearance:none; }
  input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:#0a0a0a; }
  ::-webkit-scrollbar-thumb { background:#222; border-radius:4px; }
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(12px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes slideUp {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes pulse { 0%,100% { opacity:.4; } 50% { opacity:.8; } }
`;

// ── Accent palette for module cards ──────────────────────────────────────────
export const ACCENTS = [
  "#e76f51","#f4a261","#2a9d8f","#e9c46a",
  "#a8dadc","#c77dff","#48cae4","#264653",
];

// ── Commitment color swatches ─────────────────────────────────────────────────
export const CMT_COLORS = [
  "#e76f51","#f4a261","#e9c46a","#2a9d8f",
  "#264653","#a8dadc","#c77dff","#48cae4",
];