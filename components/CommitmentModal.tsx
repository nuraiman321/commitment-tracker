"use client";

// ─────────────────────────────────────────────────────────────────────────────
// COMMITMENT MODAL  (Add / Edit)
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { Commitment, CommitmentForm, CommitmentFieldErrors } from "../types";
import { btn, mono, CMT_COLORS, labelStyle } from "../lib/utils";

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
      : { name: "", amount: "", months: "", paid: "", color: "#e76f51" }
  );
  const [err, setErr] = useState<CommitmentFieldErrors>({});

  const set = <K extends keyof CommitmentForm>(k: K, v: CommitmentForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validate = (): boolean => {
    const e: CommitmentFieldErrors = {};
    if (!String(form.name).trim())                   e.name   = "Required";
    if (!form.amount || Number(form.amount) <= 0)    e.amount = "Enter a valid amount";
    if (!form.months || Number(form.months) < 1)     e.months = "Enter total months";
    if (Number(form.paid) < 0)                       e.paid   = "Cannot be negative";
    if (parseInt(String(form.paid)) > parseInt(String(form.months)))
                                                     e.paid   = "Paid > total months";
    setErr(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    onSave({
      ...form,
      amount: parseFloat(String(form.amount)),
      months: parseInt(String(form.months)),
      paid:   parseInt(String(form.paid)) || 0,
    });
  };

  const fields: Array<[string, keyof CommitmentFieldErrors, string, string]> = [
    ["Name",          "name",   "text",   "e.g. Car Loan"],
    ["Monthly (RM)",  "amount", "number", "e.g. 650"],
    ["Total Months",  "months", "number", "e.g. 60"],
    ["Months Paid",   "paid",   "number", "e.g. 12"],
  ];

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
        <p style={{ ...labelStyle, marginBottom: 16 }}>
          {item ? "Edit" : "New"} Commitment
        </p>

        {fields.map(([label, key, type, ph]) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <p
              style={{
                fontSize: 10,
                color: err[key] ? "#e76f51" : "#444",
                marginBottom: 4,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              {label}
              {err[key] ? ` — ${err[key]}` : ""}
            </p>
            <input
              type={type}
              placeholder={ph}
              value={form[key] as string | number}
              onChange={(e) => {
                set(key, e.target.value);
                setErr((er) => ({ ...er, [key]: undefined }));
              }}
              style={{
                width: "100%",
                background: "#0a0a0a",
                border: `1px solid ${err[key] ? "#e76f51" : "#1e1e1e"}`,
                borderRadius: 6,
                color: "#f0ede8",
                fontSize: 13,
                padding: "9px 12px",
                boxSizing: "border-box",
                fontFamily: mono,
                outline: "none",
              }}
            />
          </div>
        ))}

        {/* Color picker */}
        <div style={{ marginBottom: 20 }}>
          <p
            style={{
              fontSize: 10, color: "#444", marginBottom: 8,
              letterSpacing: 1, textTransform: "uppercase",
            }}
          >
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
