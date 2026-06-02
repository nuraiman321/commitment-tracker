"use client";

import { useState, useEffect, useRef, useMemo, ChangeEvent } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
type Commitment = {
  id: number;
  name: string;
  amount: number;
  months: number;
  paid: number;
  color: string;
};

type Data = {
  salary: number;
  commitments: Commitment[];
};

type CommitmentForm = {
  id?: number;
  name: string;
  amount: string | number;
  months: string | number;
  paid: string | number;
  color: string;
};

type ModalState = Commitment | "add" | null;

// ── Default JSON data ──────────────────────────────────────────────────────────
const DEFAULT_DATA: Data = {
  salary: 5500,
  commitments: [
    { id: 1, name: "Home Loan",        amount: 1200, months: 240, paid: 36,  color: "#e76f51" },
    { id: 2, name: "Car Loan",         amount: 650,  months: 60,  paid: 18,  color: "#f4a261" },
    { id: 3, name: "Personal Loan",    amount: 300,  months: 24,  paid: 6,   color: "#e9c46a" },
    { id: 4, name: "Insurance",        amount: 180,  months: 120, paid: 24,  color: "#2a9d8f" },
    { id: 5, name: "Phone Installment",amount: 95,   months: 12,  paid: 4,   color: "#264653" },
  ]
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const monthsLeft = (c: Commitment) => Math.max(c.months - c.paid, 0);
const totalLeft  = (c: Commitment) => c.amount * monthsLeft(c);

const formatMYR = (n: number) =>
  "RM " + n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function endDate(c: Commitment) {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsLeft(c));
  return d.toLocaleString("en-MY", { month: "short", year: "numeric" });
}

// ── Mini Pie Chart ─────────────────────────────────────────────────────────────
function PieChart({ salary, totalCommit }: { salary: number; totalCommit: number }) {
  const pct   = Math.min(totalCommit / salary, 1);
  const r     = 52;
  const cx    = 70; const cy = 70;
  const circ  = 2 * Math.PI * r;
  const dash  = pct * circ;

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e1e1e" strokeWidth="18"/>
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="#e76f51" strokeWidth="18"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray .6s cubic-bezier(.4,0,.2,1)" }}
      />
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#f0ede8" fontSize="13" fontFamily="'DM Mono', monospace" fontWeight="600">
        {Math.round(pct * 100)}%
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#888" fontSize="9" fontFamily="'DM Mono', monospace">
        commit
      </text>
    </svg>
  );
}

// ── Progress Bar ───────────────────────────────────────────────────────────────
function ProgressBar({ paid, months, color }: { paid: number; months: number; color: string }) {
  const pct = months ? Math.min((paid / months) * 100, 100) : 0;
  return (
    <div style={{ height: 4, background: "#1e1e1e", borderRadius: 2, overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${pct}%`, background: color,
        borderRadius: 2, transition: "width .5s ease"
      }}/>
    </div>
  );
}

// ── Month Projection Table ─────────────────────────────────────────────────────
function Projection({ commitments, salary }: { commitments: Commitment[]; salary: number }) {
  const months = 12;
  const rows: { label: string; total: number; left: number }[] = [];
  for (let m = 0; m < months; m++) {
    const d = new Date();
    d.setMonth(d.getMonth() + m);
    const label = d.toLocaleString("en-MY", { month: "short", year: "2-digit" });
    const total = commitments.reduce((sum: number, c: Commitment) => {
      const rem = monthsLeft(c) - m;
      return rem > 0 ? sum + c.amount : sum;
    }, 0);
    rows.push({ label, total, left: salary - total });
  }

  return (
    <div style={{ marginTop: 32 }}>
      <p style={{ fontSize: 11, letterSpacing: 3, color: "#888", textTransform: "uppercase", marginBottom: 12 }}>
        12-Month Projection
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
          <thead>
            <tr>
              {["Month","Commit","Remaining"].map(h => (
                <th key={h} style={{ textAlign: h === "Month" ? "left" : "right", color: "#555", fontWeight: 500, paddingBottom: 8, borderBottom: "1px solid #1e1e1e", paddingRight: 8 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #141414" }}>
                <td style={{ padding: "7px 8px 7px 0", color: "#aaa" }}>{r.label}</td>
                <td style={{ textAlign: "right", padding: "7px 8px", color: "#e76f51" }}>{formatMYR(r.total)}</td>
                <td style={{ textAlign: "right", padding: "7px 0 7px 8px", color: r.left < 0 ? "#e76f51" : "#2a9d8f" }}>
                  {formatMYR(r.left)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Add/Edit Modal ─────────────────────────────────────────────────────────────
function Modal({
  item,
  onSave,
  onClose,
}: {
  item: Commitment | null;
  onSave: (form: CommitmentForm) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<CommitmentForm>(
    item || { name: "", amount: "", months: "", paid: "", color: "#e76f51" }
  );
  const set = <K extends keyof CommitmentForm>(k: K, v: CommitmentForm[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const colors = ["#e76f51","#f4a261","#e9c46a","#2a9d8f","#264653","#a8dadc","#c77dff","#48cae4"];

  const fields: Array<[string, keyof CommitmentForm, string, string]> = [
    ["Name",           "name",   "text",   "e.g. Car Loan"],
    ["Amount (RM/mo)", "amount", "number", "e.g. 500"],
    ["Total Months",   "months", "number", "e.g. 60"],
    ["Months Paid",    "paid",   "number", "e.g. 12"],
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)"
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#111", border: "1px solid #222", borderRadius: 12, padding: 28,
        width: 340, fontFamily: "'DM Mono', monospace"
      }}>
        <p style={{ fontSize: 11, letterSpacing: 3, color: "#555", textTransform: "uppercase", marginBottom: 20 }}>
          {item ? "Edit" : "Add"} Commitment
        </p>

        {fields.map(([label, key, type, ph]) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 10, color: "#555", marginBottom: 5, letterSpacing: 1 }}>{label}</p>
            <input
              type={type} placeholder={ph} value={form[key] as string | number}
              onChange={e => set(key, e.target.value)}
              style={{
                width: "100%", background: "#0a0a0a", border: "1px solid #222", borderRadius: 6,
                color: "#f0ede8", fontSize: 13, padding: "8px 10px", boxSizing: "border-box",
                fontFamily: "'DM Mono', monospace", outline: "none"
              }}
            />
          </div>
        ))}

        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 10, color: "#555", marginBottom: 8, letterSpacing: 1 }}>Color</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {colors.map(c => (
              <div key={c} onClick={() => set("color", c)} style={{
                width: 24, height: 24, borderRadius: "50%", background: c, cursor: "pointer",
                outline: form.color === c ? `2px solid white` : "none", outlineOffset: 2
              }}/>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "9px 0", background: "transparent", border: "1px solid #222",
            color: "#555", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: "'DM Mono', monospace"
          }}>Cancel</button>
          <button onClick={() => onSave(form)} style={{
            flex: 1, padding: "9px 0", background: "#e76f51", border: "none",
            color: "#fff", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: "'DM Mono', monospace"
          }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────
export default function App() {
  const [data,       setData]       = useState<Data>(DEFAULT_DATA);
  const [salary,     setSalary]     = useState<number>(DEFAULT_DATA.salary);
  const [modal,      setModal]      = useState<ModalState>(null);   // null | "add" | item
  const [showProj,   setShowProj]   = useState(false);
  const [jsonText,   setJsonText]   = useState(JSON.stringify(DEFAULT_DATA, null, 2));
  const [jsonErr,    setJsonErr]    = useState("");
  const [jsonOpen,   setJsonOpen]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const commitments = data.commitments;

  const totalCommit = useMemo(() =>
    commitments.reduce((s: number, c: Commitment) => s + c.amount, 0), [commitments]);
  const remaining   = salary - totalCommit;
  const pct         = salary ? Math.round((totalCommit / salary) * 100) : 0;

  // sync salary field with data
  useEffect(() => { setSalary(data.salary); }, [data.salary]);

  const saveModal = (form: CommitmentForm) => {
    const entry: Commitment = {
      id:     form.id || Date.now(),
      name:   form.name,
      amount: parseFloat(String(form.amount)) || 0,
      months: parseInt(String(form.months))   || 1,
      paid:   parseInt(String(form.paid))     || 0,
      color:  form.color || "#e76f51",
    };
    setData(d => ({
      ...d,
      commitments: modal === "add"
        ? [...d.commitments, entry]
        : d.commitments.map(c => c.id === entry.id ? entry : c)
    }));
    setModal(null);
  };

  const deleteItem = (id: number) =>
    setData(d => ({ ...d, commitments: d.commitments.filter(c => c.id !== id) }));

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonText) as Data;
      setData(parsed);
      setSalary(parsed.salary || salary);
      setJsonErr("");
      setJsonOpen(false);
    } catch (e) {
      setJsonErr(e instanceof Error ? e.message : String(e));
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ salary, commitments }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "commitments.json"; a.click();
  };

  const importJson = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") setJsonText(result);
      setJsonOpen(true);
    };
    reader.readAsText(file);
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Sora:wght@300;400;600&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#0a0a0a; color:#f0ede8; }
    input::-webkit-inner-spin-button,input::-webkit-outer-spin-button{-webkit-appearance:none}
    ::-webkit-scrollbar{width:4px;height:4px}
    ::-webkit-scrollbar-track{background:#0a0a0a}
    ::-webkit-scrollbar-thumb{background:#222;border-radius:4px}
  `;

  return (
    <>
      <style>{css}</style>
      <div style={{
        minHeight: "100vh", background: "#0a0a0a",
        fontFamily: "'Sora', sans-serif", color: "#f0ede8",
        paddingBottom: 60
      }}>

        {/* ── Header ── */}
        <div style={{
          borderBottom: "1px solid #141414", padding: "20px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: 4, color: "#444", textTransform: "uppercase" }}>Financial</p>
            <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: -0.5 }}>Commitment</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => fileRef.current?.click()} style={btnStyle("#141414", "#555")}>Import</button>
            <button onClick={exportJson}                    style={btnStyle("#141414", "#555")}>Export</button>
            <button onClick={() => setJsonOpen(v => !v)}   style={btnStyle("#141414", "#e76f51")}>JSON</button>
          </div>
          <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={importJson}/>
        </div>

        <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 20px" }}>

          {/* ── JSON Editor ── */}
          {jsonOpen && (
            <div style={{ marginTop: 20, background: "#0e0e0e", border: "1px solid #1e1e1e", borderRadius: 10, padding: 16 }}>
              <textarea
                value={jsonText} onChange={e => setJsonText(e.target.value)}
                style={{
                  width: "100%", minHeight: 180, background: "transparent", border: "none",
                  color: "#aaa", fontSize: 11, fontFamily: "'DM Mono', monospace",
                  resize: "vertical", outline: "none", lineHeight: 1.7
                }}
              />
              {jsonErr && <p style={{ color: "#e76f51", fontSize: 11, marginTop: 4, fontFamily: "'DM Mono', monospace" }}>{jsonErr}</p>}
              <button onClick={applyJson} style={{ ...btnStyle("#e76f51", "#fff"), marginTop: 10, padding: "7px 16px" }}>
                Apply JSON
              </button>
            </div>
          )}

          {/* ── Summary Card ── */}
          <div style={{
            marginTop: 24,
            background: "#0e0e0e", border: "1px solid #141414", borderRadius: 14,
            padding: "20px 24px", display: "flex", gap: 20, alignItems: "center"
          }}>
            <PieChart salary={salary} totalCommit={totalCommit}/>
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Salary row */}
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 9, letterSpacing: 3, color: "#444", textTransform: "uppercase", marginBottom: 6 }}>Monthly Salary</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: "#444", fontFamily: "'DM Mono', monospace" }}>RM</span>
                  <input
                    type="number" value={salary}
                    onChange={e => setSalary(parseFloat(e.target.value) || 0)}
                    style={{
                      background: "transparent", border: "none", borderBottom: "1px solid #222",
                      color: "#f0ede8", fontSize: 18, fontFamily: "'DM Mono', monospace",
                      width: "100%", outline: "none", fontWeight: 500
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  ["Commit",    formatMYR(totalCommit), "#e76f51"],
                  ["Left",      formatMYR(remaining),   remaining >= 0 ? "#2a9d8f" : "#e76f51"],
                  ["Ratio",     `${pct}%`,              pct > 70 ? "#e76f51" : "#e9c46a"],
                  ["Safe Zone", pct <= 50 ? "✓ OK" : pct <= 70 ? "⚠ Watch" : "✗ High",
                               pct <= 50 ? "#2a9d8f" : pct <= 70 ? "#e9c46a" : "#e76f51"],
                ].map(([k, v, col]) => (
                  <div key={k}>
                    <p style={{ fontSize: 9, letterSpacing: 2, color: "#444", textTransform: "uppercase", marginBottom: 2 }}>{k}</p>
                    <p style={{ fontSize: 14, fontFamily: "'DM Mono', monospace", color: col, fontWeight: 500 }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Commitment List ── */}
          <div style={{ marginTop: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <p style={{ fontSize: 10, letterSpacing: 3, color: "#555", textTransform: "uppercase" }}>
                Commitments · {commitments.length}
              </p>
              <button onClick={() => setModal("add")} style={btnStyle("#e76f51", "#fff")}>+ Add</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {commitments.map(c => {
                const rem = monthsLeft(c);
                const paidPct = c.months ? Math.round((c.paid / c.months) * 100) : 0;
                return (
                  <div key={c.id} style={{
                    background: "#0e0e0e", border: "1px solid #141414",
                    borderLeft: `3px solid ${c.color}`,
                    borderRadius: 10, padding: "14px 16px",
                    transition: "border-color .2s"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{c.name}</p>
                        <p style={{ fontSize: 10, color: "#555", fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>
                          Until {endDate(c)} · {rem} mo left
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 16, fontFamily: "'DM Mono', monospace", fontWeight: 500, color: c.color }}>
                          {formatMYR(c.amount)}
                          <span style={{ fontSize: 9, color: "#444", display: "block", textAlign: "right" }}>/mo</span>
                        </p>
                      </div>
                    </div>

                    <ProgressBar paid={c.paid} months={c.months} color={c.color}/>

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, fontFamily: "'DM Mono', monospace", color: "#444" }}>
                      <span>{c.paid}/{c.months} mo · {paidPct}% done</span>
                      <span>Balance {formatMYR(totalLeft(c))}</span>
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button onClick={() => setModal(c)} style={{ ...btnStyle("#141414","#888"), fontSize: 10, padding: "4px 10px" }}>Edit</button>
                      <button onClick={() => deleteItem(c.id)} style={{ ...btnStyle("#141414","#e76f51"), fontSize: 10, padding: "4px 10px" }}>Remove</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Projection ── */}
          <div style={{ marginTop: 28 }}>
            <button
              onClick={() => setShowProj(v => !v)}
              style={{ ...btnStyle("#0e0e0e", "#555"), width: "100%", padding: "10px 0", border: "1px solid #141414", borderRadius: 8 }}
            >
              {showProj ? "Hide" : "Show"} 12-Month Projection
            </button>
            {showProj && <Projection commitments={commitments} salary={salary}/>}
          </div>

        </div>
      </div>

      {modal && (
        <Modal
          item={modal === "add" ? null : modal}
          onSave={saveModal}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

function btnStyle(bg: string, col: string): React.CSSProperties {
  return {
    background: bg, color: col, border: "none", borderRadius: 6,
    padding: "6px 12px", cursor: "pointer", fontSize: 11,
    fontFamily: "'DM Mono', monospace", letterSpacing: 0.5,
    transition: "opacity .15s", fontWeight: 500
  };
}