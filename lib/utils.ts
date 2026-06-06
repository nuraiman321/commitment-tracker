// ─────────────────────────────────────────────────────────────────────────────
// HELPERS & SHARED STYLES
// ─────────────────────────────────────────────────────────────────────────────
import { CSSProperties, useRef, useCallback } from "react";
import { Commitment } from "../types";

// ── Data helpers ──────────────────────────────────────────────────────────────
export const monthsLeft = (c: Commitment) =>
  Math.max((c.months || 0) - (c.paid || 0), 0);

export const totalLeft = (c: Commitment) =>
  (c.amount || 0) * monthsLeft(c);

export const fmt = (n: number) =>
  "RM " +
  (n || 0).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function endDate(c: Commitment) {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsLeft(c));
  return d.toLocaleString("en-MY", { month: "short", year: "numeric" });
}

export const errMsg = (e: unknown) =>
  e instanceof Error ? e.message : String(e);

// ── Debounce hook ─────────────────────────────────────────────────────────────
export function useDebounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    (...args: Parameters<T>) => {
      if (t.current) clearTimeout(t.current);
      t.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
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

// ── Global CSS string (inject once in layout/root) ────────────────────────────
export const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Sora:wght@300;400;600&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#0a0a0a; color:#f0ede8; }
  input::-webkit-inner-spin-button,
  input::-webkit-outer-spin-button { -webkit-appearance:none; }
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
