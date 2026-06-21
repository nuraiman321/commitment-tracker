"use client";

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useMemo, KeyboardEvent } from "react";
import { LoginErrors } from "../types";
import { btn, fieldStyle, mono, sans } from "../lib/utils";

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  baseUrl: string;
  setBaseUrl: (u: string) => void;
}

// ── Email domain autocomplete ─────────────────────────────────────────────────
const EMAIL_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"];

export default function LoginPage({ onLogin, baseUrl, setBaseUrl }: LoginPageProps) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [errors,   setErrors]   = useState<LoginErrors>({});
  const [loading,  setLoading]  = useState(false);
  const [showUrl,  setShowUrl]  = useState(false);
  const [urlDraft, setUrlDraft] = useState(baseUrl);
  const [showPass, setShowPass] = useState(false);

  // Email autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIdx,    setHighlightIdx]    = useState(0);

  // Suggestions only appear once user has typed something before "@"
  // and hasn't already typed a domain themselves.
  const suggestions = useMemo(() => {
    if (!email) return [];
    const atIdx = email.indexOf("@");
    if (atIdx === -1) {
      // No "@" yet — suggest full "user@domain.com" completions
      return EMAIL_DOMAINS.map((d) => `${email}@${d}`);
    }
    const typedDomain = email.slice(atIdx + 1);
    if (!typedDomain) {
      // Just typed "@" — show all domain options
      return EMAIL_DOMAINS.map((d) => `${email}${d}`);
    }
    // User is typing a domain — filter matching ones
    const matches = EMAIL_DOMAINS.filter((d) => d.startsWith(typedDomain.toLowerCase()));
    if (matches.length === 0) return []; // user typed their own domain — don't interfere
    return matches.map((d) => `${email.slice(0, atIdx + 1)}${d}`);
  }, [email]);

  const applySuggestion = (value: string) => {
    setEmail(value);
    setShowSuggestions(false);
    setErrors((er) => ({ ...er, email: undefined, server: undefined }));
  };

  const validate = (): boolean => {
    const e: LoginErrors = {};
    if (!email.trim())
      e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = "Invalid email format";
    if (!password)
      e.password = "Password is required";
    else if (password.length < 6)
      e.password = "Min 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      await onLogin(email, password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid credentials. Please try again.";
      setErrors({ server: msg });
    } finally {
      setLoading(false);
    }
  };

  const onEmailKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIdx((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIdx((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        applySuggestion(suggestions[highlightIdx]);
        return;
      }
      if (e.key === "Escape") {
        setShowSuggestions(false);
        return;
      }
    }
    if (e.key === "Enter") submit();
  };

  const onPasswordKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: sans,
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: "absolute", inset: 0, opacity: 0.03,
          backgroundImage:
            "linear-gradient(#f0ede8 1px, transparent 1px), linear-gradient(90deg, #f0ede8 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />
      {/* Accent blob top-right */}
      <div
        style={{
          position: "absolute", top: -120, right: -120,
          width: 360, height: 360,
          background: "radial-gradient(circle, #e76f5118 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* Accent blob bottom-left */}
      <div
        style={{
          position: "absolute", bottom: -100, left: -100,
          width: 300, height: 300,
          background: "radial-gradient(circle, #2a9d8f0d 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 380,
          animation: "fadeUp .4s ease",
        }}
      >
        {/* Brand */}
        <div style={{ marginBottom: 40 }}>
          <p
            style={{
              fontSize: 10, letterSpacing: 5, color: "#333",
              textTransform: "uppercase", marginBottom: 6, fontFamily: mono,
            }}
          >
            Personal Finance
          </p>
          <h1 style={{ fontSize: 30, fontWeight: 600, color: "#f0ede8", letterSpacing: -1 }}>
            My<span style={{ color: "#e76f51" }}>Suite</span>
          </h1>
          <p style={{ fontSize: 12, color: "#444", marginTop: 6 }}>
            Sign in to access your tools
          </p>
        </div>

        {/* Server error banner */}
        {errors.server && (
          <div
            style={{
              background: "#1a0808", border: "1px solid #3d1010",
              borderRadius: 8, padding: "10px 14px", marginBottom: 16,
              fontSize: 12, fontFamily: mono, color: "#e76f51",
            }}
          >
            {errors.server}
          </div>
        )}

        {/* Directus URL config */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 6,
            }}
          >

            <p
              style={{
                fontSize: 10, color: "#333", letterSpacing: 2,
                textTransform: "uppercase", fontFamily: mono,
              }}
            >
              Directus URL
            </p>
            <button
              onClick={() => setShowUrl((v) => !v)}
              style={{
                background: "none", border: "none", color: "#555",
                fontSize: 10, cursor: "pointer", fontFamily: mono,
              }}
            >
              {showUrl ? "hide" : "configure"}
            </button>
          </div>

          {showUrl ? (
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                placeholder="https://your-directus.com"
                style={{
                  flex: 1, background: "#0e0e0e", border: "1px solid #222",
                  borderRadius: 8, color: "#f0ede8", fontSize: 12,
                  padding: "9px 12px", fontFamily: mono, outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={() => {
                  setBaseUrl(urlDraft.replace(/\/$/, ""));
                  setShowUrl(false);
                }}
                style={btn("#2a9d8f", "#0a0a0a")}
              >
                Set
              </button>
            </div>
          ) : (
            <p
              style={{
                fontSize: 11, color: "#333", fontFamily: mono,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
            >
              {baseUrl}
            </p>
          )}
        </div>

        {/* Form fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
          {/* Email — with domain autocomplete */}
          <div style={{ position: "relative" }}>
            <p
              style={{
                fontSize: 10,
                color: errors.email ? "#e76f51" : "#444",
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 6,
                fontFamily: mono,
              }}
            >
              Email{errors.email ? ` — ${errors.email}` : ""}
            </p>
            <input
              type="email"
              value={email}
              placeholder="you@example.com"
              autoComplete="off"
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((er) => ({ ...er, email: undefined, server: undefined }));
                setShowSuggestions(true);
                setHighlightIdx(0);
              }}
              onFocus={() => { if (email) setShowSuggestions(true); }}
              onBlur={() => {
                // slight delay so a click on a suggestion still registers
                setTimeout(() => setShowSuggestions(false), 120);
              }}
              onKeyDown={onEmailKey}
              style={fieldStyle(!!errors.email)}
            />

            {/* Suggestion dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                style={{
                  position: "absolute", top: "100%", left: 0, right: 0,
                  marginTop: 4, background: "#0e0e0e", border: "1px solid #1e1e1e",
                  borderRadius: 8, overflow: "hidden", zIndex: 30,
                  boxShadow: "0 8px 24px rgba(0,0,0,.5)",
                }}
              >
                {suggestions.map((s, i) => (
                  <div
                    key={s}
                    onMouseDown={(e) => { e.preventDefault(); applySuggestion(s); }}
                    onMouseEnter={() => setHighlightIdx(i)}
                    style={{
                      padding: "9px 12px", fontSize: 12, fontFamily: mono,
                      cursor: "pointer",
                      background: i === highlightIdx ? "#1a0a08" : "transparent",
                      color: i === highlightIdx ? "#e76f51" : "#999",
                      borderBottom: i < suggestions.length - 1 ? "1px solid #161616" : "none",
                      transition: "background .1s, color .1s",
                    }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Password */}
          <div>
            <p
              style={{
                fontSize: 10,
                color: errors.password ? "#e76f51" : "#444",
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 6,
                fontFamily: mono,
              }}
            >
              Password{errors.password ? ` — ${errors.password}` : ""}
            </p>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                placeholder="••••••••"
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((er) => ({ ...er, password: undefined, server: undefined }));
                }}
                onKeyDown={onPasswordKey}
                style={{ ...fieldStyle(!!errors.password), paddingRight: 44 }}
              />
              <button
                onClick={() => setShowPass((v) => !v)}
                style={{
                  position: "absolute", right: 12, top: "50%",
                  transform: "translateY(-50%)", background: "none", border: "none",
                  color: "#555", cursor: "pointer", fontSize: 12, fontFamily: mono,
                }}
              >
                {showPass ? "hide" : "show"}
              </button>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={submit}
          disabled={loading}
          style={{
            ...btn("#e76f51", "#fff"),
            width: "100%",
            padding: "13px 0",
            fontSize: 13,
            letterSpacing: 1,
            opacity: loading ? 0.7 : 1,
            transition: "opacity .2s, transform .1s",
            borderRadius: 8,
          }}
        >
          {loading ? "Signing in…" : "Sign in →"}
        </button>

        <p
          style={{
            fontSize: 10, color: "#2a2a2a", textAlign: "center",
            marginTop: 20, fontFamily: mono, lineHeight: 1.8,
          }}
        >
          Powered by Directus · Your data stays yours
        </p>
      </div>
    </div>
  );
}