"use client";

// ─────────────────────────────────────────────────────────────────────────────
// PAY MODAL
// Lets the user mark/unmark which months are paid for a single commitment.
// - Checkbox per expected month (current month → last_date, or N ahead for subs)
// - Checked = paid row exists in commitment_payments_ai
// - Ticking inserts a row, unticking deletes it (undo)
// - Multi-select supported — user can pay several months in one go
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from "react";
import { Commitment, CommitmentPayment } from "../types";
import { ApiClient } from "../API/api";
import {
  btn, mono, labelStyle, fmt, errMsg,
  expectedMonths, formatMonthKey, PAID_COLOR, SUB_COLOR,
} from "../lib/utils";

interface PayModalProps {
  commitment: Commitment;
  api: ApiClient;
  onClose: () => void;
  onChanged?: () => void; // notify parent so it can refresh "done" / next-month state
}

export default function PayModal({ commitment, api, onClose, onChanged }: PayModalProps) {
  const [payments, setPayments] = useState<CommitmentPayment[]>([]);
  const [loading,   setLoading]  = useState(true);
  const [busyMonth, setBusyMonth] = useState<string | null>(null);
  const [error,     setError]    = useState<string | null>(null);
  const [monthsAheadExtra, setMonthsAheadExtra] = useState(0); // subscriptions: "show more months"

  const isSub = commitment.is_subscription;
  const accent = isSub ? SUB_COLOR : (commitment.color || "#e76f51");

  // Base list of months to show. Subscriptions start with 6 months ahead,
  // user can extend further with "Show more months".
  const months = useMemo(
    () => expectedMonths(commitment, isSub ? 6 + monthsAheadExtra : undefined),
    [commitment, isSub, monthsAheadExtra]
  );

  const paidSet = useMemo(
    () => new Set(payments.map((p) => p.month.slice(0, 10))),
    [payments]
  );

  useEffect(() => { load(); }, [commitment.id]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPayments(commitment.id);
      setPayments((res.data || []) as CommitmentPayment[]);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  const toggleMonth = async (month: string) => {
    setBusyMonth(month);
    setError(null);
    try {
      if (paidSet.has(month)) {
        // Undo — find the payment row and delete it
        const row = payments.find((p) => p.month.slice(0, 10) === month);
        if (row) {
          await api.unmarkPaid(row.id);
          setPayments((ps) => ps.filter((p) => p.id !== row.id));
        }
      } else {
        // Mark paid — insert a row
        const res = await api.markPaid(commitment.id, month);
        setPayments((ps) => [...ps, res.data as CommitmentPayment]);
      }
      onChanged?.();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusyMonth(null);
    }
  };

  const paidCount   = months.filter((m) => paidSet.has(m)).length;
  const totalCount  = months.length;
  const allPaid     = totalCount > 0 && paidCount === totalCount;

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,.82)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 250, backdropFilter: "blur(6px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#0e0e0e", border: "1px solid #222", borderRadius: 14,
          padding: 26, width: 360, fontFamily: mono,
          animation: "slideUp .2s ease",
          maxHeight: "85vh", display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 6 }}>
          <p style={labelStyle}>Mark Payments</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#f0ede8" }}>{commitment.name}</h3>
            <span style={{ fontSize: 13, color: accent, fontWeight: 500 }}>{fmt(commitment.amount)}/mo</span>
          </div>
        </div>

        {/* Progress summary */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 0", borderBottom: "1px solid #1a1a1a", marginBottom: 12,
        }}>
          <p style={{ fontSize: 10, color: "#444" }}>
            {paidCount} / {totalCount} {isSub ? "months shown" : "months"} paid
          </p>
          {allPaid && totalCount > 0 && (
            <span style={{
              fontSize: 9, color: PAID_COLOR, background: "#0f2a1e",
              border: `1px solid ${PAID_COLOR}44`, borderRadius: 4,
              padding: "2px 8px", letterSpacing: 1,
            }}>
              ✓ ALL CAUGHT UP
            </span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#1a0808", border: "1px solid #3d1010", borderRadius: 8,
            padding: "8px 12px", marginBottom: 12, fontSize: 11, color: "#e76f51",
          }}>
            {error}
          </div>
        )}

        {/* Month list */}
        <div style={{ overflowY: "auto", flex: 1, marginBottom: 16, paddingRight: 4 }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "30px 0" }}>
              <div style={{
                width: 20, height: 20, border: "2px solid #222",
                borderTopColor: accent, borderRadius: "50%",
                animation: "spin .8s linear infinite",
              }}/>
            </div>
          ) : totalCount === 0 ? (
            <p style={{ fontSize: 11, color: "#333", textAlign: "center", padding: "20px 0" }}>
              No upcoming months to pay — this commitment may already be completed.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {months.map((month) => {
                const isPaid = paidSet.has(month);
                const isBusy = busyMonth === month;
                return (
                  <button
                    key={month}
                    onClick={() => !isBusy && toggleMonth(month)}
                    disabled={isBusy}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      width: "100%", padding: "10px 12px",
                      background: isPaid ? `${PAID_COLOR}14` : "#0a0a0a",
                      border: `1px solid ${isPaid ? `${PAID_COLOR}44` : "#1a1a1a"}`,
                      borderRadius: 8, cursor: isBusy ? "default" : "pointer",
                      transition: "all .15s", fontFamily: mono,
                      opacity: isBusy ? 0.5 : 1,
                    }}
                  >
                    <span style={{ fontSize: 12, color: isPaid ? PAID_COLOR : "#999" }}>
                      {formatMonthKey(month)}
                    </span>
                    <span
                      style={{
                        width: 18, height: 18, borderRadius: 5,
                        border: `1.5px solid ${isPaid ? PAID_COLOR : "#333"}`,
                        background: isPaid ? PAID_COLOR : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        animation: isPaid ? "checkPop .2s ease" : "none",
                      }}
                    >
                      {isPaid && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth={3}>
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Show more months — subscriptions only */}
          {isSub && !loading && totalCount > 0 && (
            <button
              onClick={() => setMonthsAheadExtra((v) => v + 6)}
              style={{
                width: "100%", marginTop: 10, padding: "8px 0",
                background: "transparent", border: "1px dashed #1e1e1e",
                borderRadius: 8, color: "#444", fontSize: 10,
                fontFamily: mono, cursor: "pointer",
              }}
            >
              + Show 6 more months
            </button>
          )}
        </div>

        {/* Footer */}
        <button onClick={onClose} style={{ ...btn("#141414", "#777"), width: "100%", padding: "10px 0" }}>
          Done
        </button>
      </div>
    </div>
  );
}
