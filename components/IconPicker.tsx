"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ICON PICKER
// Searchable grid for selecting a commitment icon.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useMemo } from "react";
import { COMMITMENT_ICONS, CommitmentIcon, CommitmentIconKey } from "./commitmentIcons";
import { mono } from "../lib/utils";

interface IconPickerProps {
  value?: string;
  onChange: (key: CommitmentIconKey) => void;
}

export default function IconPicker({ value, onChange }: IconPickerProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return COMMITMENT_ICONS;
    const q = query.toLowerCase();
    return COMMITMENT_ICONS.filter((d) => d.label.toLowerCase().includes(q));
  }, [query]);

  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{
        fontSize: 10, color: "#444", marginBottom: 8,
        letterSpacing: 1, textTransform: "uppercase",
      }}>
        Icon
      </p>

      {/* Search box — only really needed once list grows, but always available */}
      <input
        type="text"
        placeholder="Search icon… e.g. bank, grab, education"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%", background: "#0a0a0a", border: "1px solid #1e1e1e",
          borderRadius: 6, color: "#f0ede8", fontSize: 12,
          padding: "8px 10px", boxSizing: "border-box",
          fontFamily: mono, outline: "none", marginBottom: 10,
        }}
      />

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8,
        maxHeight: 200, overflowY: "auto", paddingRight: 2,
      }}>
        {filtered.length === 0 && (
          <p style={{ fontSize: 10, color: "#333", gridColumn: "span 5", textAlign: "center", padding: "12px 0" }}>
            No icon matches "{query}"
          </p>
        )}
        {filtered.map((def) => {
          const selected = value === def.key;
          return (
            <button
              key={def.key}
              type="button"
              onClick={() => onChange(def.key)}
              title={def.label}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                padding: "10px 4px", borderRadius: 8,
                background: selected ? "#1a0a08" : "#0a0a0a",
                border: `1px solid ${selected ? "#e76f51" : "#1a1a1a"}`,
                cursor: "pointer", transition: "all .15s",
              }}
            >
              <CommitmentIcon iconKey={def.key} size={18} color={selected ? "#e76f51" : undefined} />
              <span style={{
                fontSize: 7, color: selected ? "#e76f51" : "#444",
                fontFamily: mono, textAlign: "center", lineHeight: 1.2,
                overflow: "hidden", textOverflow: "ellipsis",
                whiteSpace: "nowrap", width: "100%",
              }}>
                {def.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
