"use client";

// ─────────────────────────────────────────────────────────────────────────────
// COMMITMENT MODAL  (Add / Edit)
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { Commitment, CommitmentForm, CommitmentFieldErrors } from "../types";
import {
  btn, mono, CMT_COLORS, labelStyle,
  todayISO, formatLastDate, monthsLeft, fmt,
} from "../lib/utils";

interface CommitmentModalProps {
  item: Commitment | null;
  onSave: (form: CommitmentForm) => void;
  onClose: () => void;
  loading: boolean;
}

export default function CommitmentModal({
  item,
  onSave,
  onClose,
  loading,
}: CommitmentModalProps) {
  const [form, setForm] = useState<CommitmentForm>(
    item
      ? { ...item, color: item.color || "#e76f51" }
      : { name: "", amount: "", last_date: "", color: "#e76f51" }
  );
  const [err, setErr] = useState<CommitmentFieldErrors>({});

  const set = <K extends keyof CommitmentForm>(k: K, v: CommitmentForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Preview calculated values from the picked date
  const previewMonths = form.last_date
    ? (() => {
        const end = new Date(form.last_date);
        const now = new Date();
        const diff =
          (end.getFullYear() - now.getFullYear()) * 12 +
          (end.getMonth() - now.getMonth());
        return Math.max(diff, 0);
      })()
    : null;

  const previewTotal =
    previewMonths !== null && form.amount
      ? Number(form.amount) * previewMonths
      : null;

  const validate = (): boolean => {
    const e: CommitmentFieldErrors = {};
    if (!String(form.name).trim())              e.name      = "Required";
    if (!form.amount || Number(form.amount) <= 0) e.amount  = "Enter a valid amount";
    if (!form.last_date)                         e.last_date = "Pick a last payment date";
    else {
      const end = new Date(form.last_date);
      const now = new Date();
      if (
        end.getFullYear() < now.getFullYear() ||
        (end.getFullYear() === now.getFullYear() && end.getMonth() < now.getMonth())
      ) {
        // allow past dates (already completed commitments) — just no error
      }
    }
    setErr(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    onSave({
      ...form,
      amount: parseFloat(String(form.amount)),
    });
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,.82)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 200, backdropFilter: "blur(6px)",
      }}
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div
        style={{
          background: "#0e0e0e", border: "1px solid #222", borderRadius: 14,
          padding: 28, width: 340, fontFamily: mono,
          animation: "slideUp .2s ease",
        }}
      >
        <p style={{ ...labelStyle, marginBottom: 18 }}>
          {item ? "Edit" : "New"} Commitment
        </p>

        {/* Name */}
        <div style={{ marginBottom: 14 }}>
          <p style={{
            fontSize: 10, color: err.name ? "#e76f51" : "#444",
            marginBottom: 4, letterSpacing: 1, textTransform: "uppercase",
          }}>
            Name{err.name ? ` — ${err.name}` : ""}
          </p>
          <input
            type="text"
            placeholder="e.g. Car Loan"
            value={form.name}
            onChange={(e) => { set("name", e.target.value); setErr((er) => ({ ...er, name: undefined })); }}
            style={{
              width: "100%", background: "#0a0a0a",
              border: `1px solid ${err.name ? "#e76f51" : "#1e1e1e"}`,
              borderRadius: 6, color: "#f0ede8", fontSize: 13,
              padding: "9px 12px", boxSizing: "border-box",
              fontFamily: mono, outline: "none",
            }}
          />
        </div>

        {/* Monthly Amount */}
        <div style={{ marginBottom: 14 }}>
          <p style={{
            fontSize: 10, color: err.amount ? "#e76f51" : "#444",
            marginBottom: 4, letterSpacing: 1, textTransform: "uppercase",
          }}>
            Monthly (RM){err.amount ? ` — ${err.amount}` : ""}
          </p>
          <input
            type="number"
            placeholder="e.g. 650"
            value={form.amount}
            onChange={(e) => { set("amount", e.target.value); setErr((er) => ({ ...er, amount: undefined })); }}
            style={{
              width: "100%", background: "#0a0a0a",
              border: `1px solid ${err.amount ? "#e76f51" : "#1e1e1e"}`,
              borderRadius: 6, color: "#f0ede8", fontSize: 13,
              padding: "9px 12px", boxSizing: "border-box",
              fontFamily: mono, outline: "none",
            }}
          />
        </div>

        {/* Last Payment Date */}
        <div style={{ marginBottom: 14 }}>
          <p style={{
            fontSize: 10, color: err.last_date ? "#e76f51" : "#444",
            marginBottom: 4, letterSpacing: 1, textTransform: "uppercase",
          }}>
            Last Payment Date{err.last_date ? ` — ${err.last_date}` : ""}
          </p>
          <input
            type="date"
            value={form.last_date}
            onChange={(e) => { set("last_date", e.target.value); setErr((er) => ({ ...er, last_date: undefined })); }}
            style={{
              width: "100%", background: "#0a0a0a",
              border: `1px solid ${err.last_date ? "#e76f51" : "#1e1e1e"}`,
              borderRadius: 6, color: form.last_date ? "#f0ede8" : "#555",
              fontSize: 13, padding: "9px 12px", boxSizing: "border-box",
              fontFamily: mono, outline: "none", colorScheme: "dark",
            }}
          />
          <p style={{ fontSize: 9, color: "#333", marginTop: 4, letterSpacing: .5 }}>
            Pick the month of your final payment
          </p>
        </div>

        {/* Live preview */}
        {previewMonths !== null && (
          <div style={{
            background: "#0a0a0a", border: "1px solid #1a1a1a",
            borderRadius: 8, padding: "10px 12px", marginBottom: 16,
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
          }}>
            <div>
              <p style={{ fontSize: 9, color: "#333", letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>
                Months Left
              </p>
              <p style={{ fontSize: 13, color: previewMonths === 0 ? "#2a9d8f" : "#e9c46a", fontWeight: 500 }}>
                {previewMonths === 0 ? "Completed" : `${previewMonths} mo`}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 9, color: "#333", letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>
                Total Balance
              </p>
              <p style={{ fontSize: 13, color: "#f0ede8", fontWeight: 500 }}>
                {previewTotal !== null ? fmt(previewTotal) : "—"}
              </p>
            </div>
          </div>
        )}

        {/* Color picker */}
        <div style={{ marginBottom: 20 }}>
          <p style={{
            fontSize: 10, color: "#444", marginBottom: 8,
            letterSpacing: 1, textTransform: "uppercase",
          }}>
            Color
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CMT_COLORS.map((c) => (
              <div
                key={c}
                onClick={() => set("color", c)}
                style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: c, cursor: "pointer",
                  outline: form.color === c ? "2px solid #fff" : "none",
                  outlineOffset: 2,
                  transform: form.color === c ? "scale(1.15)" : "scale(1)",
                  transition: "transform .15s",
                }}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{ ...btn("#141414", "#555"), flex: 1, padding: "10px 0" }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            style={{ ...btn("#e76f51", "#fff"), flex: 1, padding: "10px 0" }}
          >
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}