"use client";

// ─────────────────────────────────────────────────────────────────────────────
// COMMITMENT TRACKER PAGE
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from "react";
import { Commitment, CommitmentForm, ModalState, ToastState } from "../types";
import { ApiClient } from "../API/api";
import {
  monthsLeft, totalLeft, fmt, errMsg,
  useDebounce, btn, mono, sans, labelStyle,
  formatLastDate, isCompleted,
} from "../lib/utils";
import { Toast, PieChart, ProgressBar, Spinner } from "./ui";
import CommitmentModal from "./CommitmentModal";

// ── Projection Table ──────────────────────────────────────────────────────────
function Projection({
  commitments,
  salary,
}: {
  commitments: Commitment[];
  salary: number;
}) {
  return (
    <div style={{ marginTop: 28 }}>
      <p style={labelStyle}>12-Month Projection</p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: mono }}>
          <thead>
            <tr>
              {["Month", "Commitments", "Remaining"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: h === "Month" ? "left" : "right",
                    color: "#444", fontWeight: 500,
                    paddingBottom: 8, borderBottom: "1px solid #1a1a1a",
                    paddingRight: h === "Remaining" ? 0 : 8,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 12 }, (_, m) => {
              const d = new Date();
              d.setMonth(d.getMonth() + m);
              const projYear = d.getFullYear();
              const projMonth = d.getMonth();

              const label = d.toLocaleString("en-MY", { month: "short", year: "2-digit" });

              const total = commitments.reduce((s: number, c: Commitment) => {
                if (!c.last_date) return s;
                const end = new Date(c.last_date);
                const endYear = end.getFullYear();
                const endMonth = end.getMonth();
                const isActive =
                  endYear > projYear ||
                  (endYear === projYear && endMonth >= projMonth);
                return isActive ? s + c.amount : s;
              }, 0);

              const left = salary - total;

              return (
                <tr key={m} style={{ borderBottom: "1px solid #111" }}>
                  <td style={{ padding: "7px 8px 7px 0", color: "#777" }}>{label}</td>
                  <td style={{ textAlign: "right", padding: "7px 8px", color: "#e76f51" }}>
                    {fmt(total)}
                  </td>
                  <td style={{ textAlign: "right", padding: "7px 0 7px 8px", color: left < 0 ? "#e76f51" : "#2a9d8f" }}>
                    {fmt(left)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Commitment Page ───────────────────────────────────────────────────────────
interface CommitmentPageProps {
  api: ApiClient;
  onBack: () => void;
}

export default function CommitmentPage({ api, onBack }: CommitmentPageProps) {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [salary, setSalary] = useState<number>(0);
  const [profileId, setProfileId] = useState<number | string | null>(null);
  const [userId, setUserId] = useState<number | string | null>(null);
  const [dataLoad, setDataLoad] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [saving, setSaving] = useState(false);
  const [delId, setDelId] = useState<number | string | null>(null);
  const [showProj, setShowProj] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const notify = (msg: string, type: "ok" | "err" = "ok") => setToast({ msg, type });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setDataLoad(true);
    try {
      const me = await api.me();
      setUserId(me.data.id);

      const [cmtRes, profRes] = await Promise.all([
        api.getCommitments(),
        api.getProfile(me.data.id),
      ]);

      setCommitments(
        (cmtRes.data || []).map((c: any) => ({
          ...c,
          amount: Number(c.amount) || 0,
        })) as Commitment[]
      );

      const prof = profRes.data?.[0];
      console.log("profile loaded:", prof);        // ← add this temporarily
      console.log("salary value:", prof?.salary);  // ← and this

      if (prof) {
        setSalary(Number(prof.salary) || 0);       // ← force Number() cast
        setProfileId(prof.id);
      }
    } catch (e) {
      notify(errMsg(e), "err");
    } finally {
      setDataLoad(false);
    }
  };

  // ── Salary sync ───────────────────────────────────────────────────────────
  const syncSalary = async (val: number) => {
    if (!userId) return;
    try {
      if (profileId) {
        await api.updateProfile(profileId, val);
      } else {
        const res = await api.createProfile(userId, val);
        setProfileId(res.data.id);
      }
    } catch (e) {
      notify("Salary sync failed: " + errMsg(e), "err");
    }
  };

  const debouncedSync = useDebounce(syncSalary, 900);
  const onSalaryChange = (val: number) => { setSalary(val); debouncedSync(val); };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleSave = async (form: CommitmentForm) => {
    setSaving(true);
    try {
      const payload: Partial<Commitment> = {
        name: String(form.name),
        amount: Number(form.amount),
        last_date: form.last_date,
        color: form.color,
      };
      if (form.id) {
        const res = await api.updateCommitment(form.id, payload);
        setCommitments((cs) => cs.map((c) => c.id === form.id ? (res.data as Commitment) : c));
        notify("Updated ✓");
      } else {
        const res = await api.createCommitment(payload);
        setCommitments((cs) => [res.data as Commitment, ...cs]);
        notify("Commitment added ✓");
      }
      setModal(null);
    } catch (e) {
      notify(errMsg(e), "err");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number | string) => {
    setDelId(id);
    try {
      await api.deleteCommitment(id);
      setCommitments((cs) => cs.filter((c) => c.id !== id));
      notify("Removed");
    } catch (e) {
      notify(errMsg(e), "err");
    } finally {
      setDelId(null);
    }
  };

  // ── Derived values ────────────────────────────────────────────────────────
const totalCommit = useMemo(
  () => commitments
    .filter((c) => !isCompleted(c))
    .reduce((s, c) => s + (Number(c.amount) || 0), 0),
  [commitments]
);

  const safeSalary = Number.isFinite(salary) && salary > 0 ? salary : 0;
  const remaining = safeSalary - totalCommit;
  const pct = safeSalary > 0 ? Math.round((totalCommit / safeSalary) * 100) : 0;

  const summaryStats: Array<[string, string, string]> = [
    ["Commit", fmt(totalCommit), "#e76f51"],
    ["Left", fmt(remaining), remaining >= 0 ? "#2a9d8f" : "#e76f51"],
    ["Ratio", safeSalary > 0 ? `${pct}%` : "—", pct > 70 ? "#e76f51" : "#e9c46a"],
    [
      "Health",
      safeSalary === 0 ? "Set salary"
        : pct <= 50 ? "✓ Healthy"
          : pct <= 70 ? "⚠ Watch"
            : "✗ Critical",
      safeSalary === 0 ? "#444"
        : pct <= 50 ? "#2a9d8f"
          : pct <= 70 ? "#e9c46a"
            : "#e76f51",
    ],
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", fontFamily: sans, color: "#f0ede8" }}>

      {/* ── Header ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(10,10,10,.92)", backdropFilter: "blur(14px)",
        borderBottom: "1px solid #0f0f0f", padding: "14px 20px",
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", color: "#333", cursor: "pointer", fontSize: 18, lineHeight: "1", padding: "2px 6px", fontFamily: mono }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#f0ede8")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#333")}
        >←</button>
        <div>
          <p style={{ fontSize: 9, letterSpacing: 4, color: "#333", textTransform: "uppercase", fontFamily: mono }}>
            Financial Tracker
          </p>
          <h1 style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.4 }}>Commitment</h1>
        </div>
      </div>

      {dataLoad ? <Spinner /> : (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px 80px" }}>

          {/* ── Summary card ── */}
          <div style={{
            background: "#0e0e0e", border: "1px solid #141414", borderRadius: 14,
            padding: "20px 22px", display: "flex", gap: 20, alignItems: "center",
            animation: "fadeUp .35s ease",
          }}>
            <PieChart salary={safeSalary} totalCommit={totalCommit} />
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Salary input */}
              <div style={{ marginBottom: 14 }}>
                <p style={labelStyle}>Monthly Salary</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, borderBottom: "1px solid #1a1a1a", paddingBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "#333", fontFamily: mono }}>RM</span>
                  <input
                    type="number"
                    value={salary || ""}
                    placeholder="Enter salary"
                    onChange={(e) => onSalaryChange(parseFloat(e.target.value) || 0)}
                    style={{ background: "transparent", border: "none", color: "#f0ede8", fontSize: 18, fontFamily: mono, width: "100%", outline: "none", fontWeight: 500 }}
                  />
                </div>
                <p style={{ fontSize: 9, color: "#2a2a2a", fontFamily: mono, marginTop: 3 }}>
                  auto-synced to Directus
                </p>
              </div>

              {/* Stats grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {summaryStats.map(([k, v, c]) => (
                  <div key={k}>
                    <p style={{ fontSize: 9, letterSpacing: 2, color: "#333", textTransform: "uppercase", marginBottom: 2, fontFamily: mono }}>{k}</p>
                    <p style={{ fontSize: 13, fontFamily: mono, color: c, fontWeight: 500 }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── List header ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28, marginBottom: 14 }}>
            <div>
              <p style={labelStyle}>Commitments · {commitments.length}</p>
              {commitments.some(isCompleted) && (
                <p style={{ fontSize: 9, color: "#2a9d8f", fontFamily: mono, marginTop: 2 }}>
                  {commitments.filter(isCompleted).length} completed
                </p>
              )}
            </div>
            <button onClick={() => setModal("add")} style={btn("#e76f51", "#fff")}>+ Add</button>
          </div>

          {/* ── Empty state ── */}
          {commitments.length === 0 && (
            <div style={{
              border: "1px dashed #1a1a1a", borderRadius: 12, padding: "40px 20px",
              textAlign: "center", color: "#333", fontFamily: mono, fontSize: 12,
            }}>
              No commitments yet.<br />
              <span style={{ color: "#e76f51", cursor: "pointer" }} onClick={() => setModal("add")}>
                Add your first →
              </span>
            </div>
          )}

          {/* ── Commitment cards ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {commitments.map((c, i) => {
              const done = isCompleted(c);
              const rem = monthsLeft(c);
              const isDel = delId === c.id;
              const accentColor = done ? "#2a9d8f" : (c.color || "#e76f51");

              // Progress bar: how far through the commitment.
              // We only have last_date, not start date, so we show months-left
              // as a countdown — 0 left = bar full.
              const paidPct = done
                ? 100
                : (() => {
                  // total months from today to last_date
                  const end = new Date(c.last_date);
                  const now = new Date();
                  const full = Math.max(
                    (end.getFullYear() - now.getFullYear()) * 12 +
                    (end.getMonth() - now.getMonth()),
                    1
                  );
                  // bar fills as months pass — starts near 0, reaches 100 at last month
                  // We invert: show (full - rem) / full * 100
                  return Math.max(0, Math.min(100, ((full - rem) / full) * 100));
                })();

              return (
                <div
                  key={c.id}
                  style={{
                    background: done ? "#081a13" : "#0e0e0e",
                    border: `1px solid ${done ? "#0f2a1e" : "#141414"}`,
                    borderLeft: `3px solid ${accentColor}`,
                    borderRadius: 10, padding: "14px 16px",
                    opacity: isDel ? 0.4 : 1,
                    transition: "opacity .2s, border-color .4s, background .4s",
                    animation: `fadeUp .3s ease ${i * 40}ms both`,
                  }}
                >
                  {/* Top row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, color: done ? "#2a9d8f" : "#f0ede8" }}>
                          {c.name}
                        </p>
                        {done && (
                          <span style={{
                            fontSize: 9, color: "#2a9d8f", background: "#0f2a1e",
                            border: "1px solid #2a9d8f33", borderRadius: 4,
                            padding: "1px 6px", fontFamily: mono, letterSpacing: 1,
                          }}>
                            DONE
                          </span>
                        )}
                      </div>
                      {/* Until date taken from last_date */}
                      <p style={{ fontSize: 10, color: done ? "#2a9d8f88" : "#444", fontFamily: mono }}>
                        {done
                          ? `Completed ${formatLastDate(c.last_date)}`
                          : `Until ${formatLastDate(c.last_date)} · ${rem} mo left`}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 16, fontFamily: mono, fontWeight: 500, color: accentColor }}>
                        {fmt(c.amount)}
                      </p>
                      <p style={{ fontSize: 9, color: done ? "#2a9d8f66" : "#333", fontFamily: mono }}>/mo</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <ProgressBar paid={paidPct} months={100} color={accentColor} />

                  {/* Bottom row */}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7, fontSize: 10, fontFamily: mono, color: done ? "#2a9d8f66" : "#333" }}>
                    <span>{done ? "All payments complete" : `${rem} mo remaining`}</span>
                    <span>{done ? "—" : `Balance ${fmt(totalLeft(c))}`}</span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button
                      onClick={() => setModal(c)}
                      disabled={isDel}
                      style={{ ...btn("#141414", done ? "#2a9d8f" : "#777"), fontSize: 10, padding: "4px 12px" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={isDel}
                      style={{ ...btn("#141414", "#e76f51"), fontSize: 10, padding: "4px 12px" }}
                    >
                      {isDel ? "…" : "Remove"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Projection toggle ── */}
          {/* {commitments.length > 0 && (
            <>
              <button
                onClick={() => setShowProj((v) => !v)}
                style={{ ...btn("#0e0e0e", "#444"), marginTop: 24, width: "100%", padding: "11px 0", border: "1px solid #141414", borderRadius: 8, fontSize: 11 }}
              >
                {showProj ? "▲ Hide" : "▼ Show"} 12-Month Projection
              </button>
              {showProj && <Projection commitments={commitments} salary={safeSalary} />}
            </>
          )} */}

          {/* ── Directus setup guide ── */}
          {/* <div style={{ marginTop: 36, background: "#0e0e0e", border: "1px solid #141414", borderRadius: 12, padding: 18, fontFamily: mono }}>
            <p style={{ ...labelStyle, marginBottom: 10 }}>Directus Setup Guide</p>
            {[
              ["commitments collection", "Fields: name (string), amount (decimal), last_date (date), color (string). Enable user_created auto-field."],
              ["user_profiles collection", "Fields: user (M2O → directus_users), salary (decimal, nullable)."],
              ["Permissions", "commitments: filter user_created = $CURRENT_USER for all CRUD. user_profiles: filter user = $CURRENT_USER."],
            ].map(([title, desc]) => (
              <div key={title} style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 10, color: "#e76f51", marginBottom: 3 }}>{title}</p>
                <p style={{ fontSize: 10, color: "#444", lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div> */}

        </div>
      )}

      {/* ── Modal ── */}
      {modal && (
        <CommitmentModal
          item={modal === "add" ? null : (modal as Commitment)}
          onSave={handleSave}
          onClose={() => { if (!saving) setModal(null); }}
          loading={saving}
        />
      )}

      {/* ── Toast ── */}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}