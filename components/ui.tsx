"use client";

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect } from "react";
import { mono } from "../lib/utils";

// ── Toast ─────────────────────────────────────────────────────────────────────
export function Toast({
  msg,
  type,
  onDone,
}: {
  msg: string;
  type: "ok" | "err";
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  const isErr = type === "err";
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        background: isErr ? "#3d1010" : "#0f2a1e",
        border: `1px solid ${isErr ? "#e76f51" : "#2a9d8f"}`,
        color: isErr ? "#e76f51" : "#2a9d8f",
        padding: "10px 20px",
        borderRadius: 8,
        fontSize: 12,
        fontFamily: mono,
        zIndex: 9999,
        animation: "fadeUp .25s ease",
        whiteSpace: "nowrap",
        boxShadow: "0 4px 24px rgba(0,0,0,.5)",
      }}
    >
      {msg}
    </div>
  );
}

// ── Pie Chart ─────────────────────────────────────────────────────────────────
export function PieChart({
  salary,
  totalCommit,
}: {
  salary: number;
  totalCommit: number;
}) {
  const pct = salary > 0 ? Math.min(totalCommit / salary, 1) : 0;
  const r = 52, cx = 70, cy = 70;
  const circ = 2 * Math.PI * r;

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1a1a1a" strokeWidth="18" />
      <circle
        cx={cx} cy={cy} r={r} fill="none" stroke="#e76f51" strokeWidth="18"
        strokeDasharray={`${pct * circ} ${circ}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray .6s cubic-bezier(.4,0,.2,1)" }}
      />
      <text
        x={cx} y={cy - 6} textAnchor="middle"
        fill="#f0ede8" fontSize="13" fontFamily={mono} fontWeight="600"
      >
        {Math.round(pct * 100)}%
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#555" fontSize="9" fontFamily={mono}>
        commit
      </text>
    </svg>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
export function ProgressBar({
  paid,
  months,
  color,
}: {
  paid: number;
  months: number;
  color: string;
}) {
  const pct = months ? Math.min((paid / months) * 100, 100) : 0;
  return (
    <div style={{ height: 3, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
          borderRadius: 2,
          transition: "width .5s ease",
        }}
      />
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "60vh",
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          border: "2px solid #222",
          borderTopColor: "#e76f51",
          borderRadius: "50%",
          animation: "spin .8s linear infinite",
        }}
      />
    </div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
export function SkeletonCard({ opacity = 1 }: { opacity?: number }) {
  return (
    <div
      style={{
        height: 90,
        background: "#0e0e0e",
        borderRadius: 14,
        border: "1px solid #111",
        animation: "pulse 1.5s ease infinite",
        opacity,
      }}
    />
  );
}
