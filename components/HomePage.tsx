"use client";

// ─────────────────────────────────────────────────────────────────────────────
// HOME PAGE  — module grid from Directus
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { DirectusUser, Module } from "../types";
import { btn, mono, sans, ACCENTS } from "../lib/utils";
import { SkeletonCard } from "./ui";

// ── Icon map ──────────────────────────────────────────────────────────────────
const ICON_PATHS: Record<string, string> = {
  wallet:   "M2 7a2 2 0 012-2h16a2 2 0 012 2v1H2V7zm0 3h20v7a2 2 0 01-2 2H4a2 2 0 01-2-2v-7zm5 3a1 1 0 000 2h2a1 1 0 000-2H7z",
  chart:    "M3 3v18h18M7 16l4-4 4 4 4-8",
  calendar: "M8 2v3M16 2v3M3 8h18M5 4h14a2 2 0 012 2v13a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  list:     "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
  home:     "M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5zM9 21V12h6v9",
  user:     "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  trending: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
  credit:   "M1 4h22v4H1zM1 10h22v10H1M5 15h4",
  grid:     "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  target:   "M12 22a10 10 0 100-20 10 10 0 000 20zM12 18a6 6 0 100-12 6 6 0 000 12zM12 14a2 2 0 100-4 2 2 0 000 4z",
  default:  "M4 6h16M4 12h16M4 18h16",
};

function AppIcon({
  name,
  size = 20,
  color = "currentColor",
}: {
  name?: string;
  size?: number;
  color?: string;
}) {
  const d = ICON_PATHS[name || "default"] || ICON_PATHS.default;
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

// ── Module Card ───────────────────────────────────────────────────────────────
function ModuleCard({
  mod,
  accent,
  index,
  onNavigate,
}: {
  mod: Module;
  accent: string;
  index: number;
  onNavigate: (url: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isExternal = mod.url?.startsWith("http");

  const handleClick = () => {
    if (!mod.url) return;
    if (isExternal) window.open(mod.url, "_blank");
    else onNavigate(mod.url);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#0e0e0e" : "#0b0b0b",
        border: `1px solid ${hovered ? "#1c1c1c" : "#111"}`,
        borderLeft: `3px solid ${hovered ? accent : "#151515"}`,
        borderRadius: 14,
        padding: "18px 20px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 18,
        transition: "all .2s ease",
        transform: hovered ? "translateX(4px)" : "translateX(0)",
        animation: `fadeUp .35s ease ${index * 60}ms both`,
      }}
    >
      {/* Icon bubble */}
      <div
        style={{
          width: 46, height: 46, borderRadius: 12,
          background: hovered ? `${accent}18` : "#111",
          border: `1px solid ${hovered ? `${accent}33` : "#161616"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "all .2s",
        }}
      >
        <AppIcon name={mod.icon} size={20} color={hovered ? accent : "#333"} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 14, fontWeight: 600,
            color: hovered ? "#f0ede8" : "#bbb",
            marginBottom: 4, transition: "color .2s",
          }}
        >
          {mod.name}
        </p>
        {mod.description && (
          <p
            style={{
              fontSize: 11, color: "#2d2d2d", lineHeight: 1.5,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              fontFamily: mono,
            }}
          >
            {mod.description}
          </p>
        )}
      </div>

      {/* Arrow */}
      <div
        style={{
          color: hovered ? accent : "#1e1e1e",
          fontSize: 16, flexShrink: 0,
          transform: hovered ? "translateX(4px)" : "translateX(0)",
          transition: "all .2s",
        }}
      >
        {isExternal ? "↗" : "→"}
      </div>
    </div>
  );
}


// ── Home Page ─────────────────────────────────────────────────────────────────
interface HomePageProps {
  user: DirectusUser | null;
  modules: Module[];
  loading: boolean;
  onNavigate: (url: string) => void;
  onLogout: () => void;
}

export default function HomePage({
  user,
  modules,
  loading,
  onNavigate,
  onLogout,
}: HomePageProps) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName =
    user?.first_name || user?.email?.split("@")[0] || "there";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        fontFamily: sans,
        color: "#f0ede8",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative blob */}
      <div
        style={{
          position: "fixed", top: -200, right: -200, width: 500, height: 500,
          background: "radial-gradient(circle, #e76f510a 0%, transparent 60%)",
          pointerEvents: "none", zIndex: 0,
        }}
      />

      {/* Header */}
      <div
        style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "rgba(10,10,10,.92)", backdropFilter: "blur(14px)",
          borderBottom: "1px solid #0f0f0f", padding: "16px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <div>
          <p
            style={{
              fontSize: 9, letterSpacing: 4, color: "#2e2e2e",
              textTransform: "uppercase", fontFamily: mono,
            }}
          >
            My Suite
          </p>
          <h1 style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.4, marginTop: 2 }}>
            {greeting}, {firstName}
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "#141414", border: "1px solid #1e1e1e",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <AppIcon name="user" size={14} color="#444" />
          </div>
          <button onClick={onLogout} style={btn("#111", "#444")}>
            Sign out
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          maxWidth: 600, margin: "0 auto",
          padding: "32px 20px 80px",
          position: "relative", zIndex: 1,
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <p
            style={{
              fontSize: 9, letterSpacing: 3, color: "#333",
              textTransform: "uppercase", fontFamily: mono, marginBottom: 4,
            }}
          >
            Your Tools
          </p>
          <p style={{ fontSize: 13, color: "#2a2a2a", fontFamily: mono }}>
            {loading
              ? "Loading modules…"
              : `${modules.length} module${modules.length !== 1 ? "s" : ""} available`}
          </p>
        </div>

        {/* Skeleton loaders */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} opacity={1 - i * 0.2} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && modules.length === 0 && (
          <div
            style={{
              border: "1px dashed #161616", borderRadius: 14,
              padding: "60px 24px", textAlign: "center",
            }}
          >
            <AppIcon name="grid" size={32} color="#222" />
            <p
              style={{
                fontSize: 13, color: "#2a2a2a", marginTop: 14,
                lineHeight: 1.7, fontFamily: mono,
              }}
            >
              No modules found.
              <br />
              Add items to the{" "}
              <span style={{ color: "#e76f51" }}>modules</span> collection in
              Directus.
            </p>
          </div>
        )}

        {/* Module cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {modules.map((mod, i) => (
            <ModuleCard
              key={mod.id}
              mod={mod}
              accent={ACCENTS[i % ACCENTS.length]}
              index={i}
              onNavigate={onNavigate}
            />
          ))}
        </div>

        {/* Directus setup tip */}
        {!loading && (
          <div
            style={{
              marginTop: 40, padding: 18,
              background: "#0a0a0a", border: "1px solid #101010",
              borderRadius: 12, fontFamily: mono,
            }}
          >
            <p
              style={{
                fontSize: 9, letterSpacing: 3, color: "#202020",
                textTransform: "uppercase", marginBottom: 10,
              }}
            >
              Directus · modules collection
            </p>
            <p style={{ fontSize: 10, color: "#1e1e1e", lineHeight: 1.9 }}>
              Fields:{" "}
              {["name", "icon", "description", "url", "sort", "status"].map((f) => (
                <span key={f}>
                  <span style={{ color: "#2e2e2e" }}>{f}</span>{" "}
                </span>
              ))}
            </p>
            <p style={{ fontSize: 10, color: "#181818", marginTop: 6, lineHeight: 1.7 }}>
              Available icons:{" "}
              {Object.keys(ICON_PATHS)
                .filter((k) => k !== "default")
                .join(" · ")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
