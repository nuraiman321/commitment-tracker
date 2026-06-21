"use client";

// ─────────────────────────────────────────────────────────────────────────────
// COMMITMENT ICONS
// ─────────────────────────────────────────────────────────────────────────────
// Real brand glyphs (Grab, Shopee, TikTok) come from react-icons' Simple Icons
// set (SiGrab, SiShopee, SiTiktok) — an openly distributed icon library, not
// hand-traced logos. Rendered in grey/monochrome rather than brand color to
// stay clearly in "service identifier" territory rather than brand replication.
//
// Where no open icon exists (Atome, Malaysian banks specifically), we use a
// generic category icon instead — "Bank" covers Maybank/CIMB/RHB/etc, "BNPL"
// covers Atome/PayLater-style services. The actual brand name still goes in
// the commitment's Name field; the icon just indicates the category.
// ─────────────────────────────────────────────────────────────────────────────

import { SiGrab, SiShopee, SiTiktok } from "react-icons/si";
import {
  PiBank, PiCreditCard, PiGraduationCap, PiCarProfile, PiHouseLine,
  PiDeviceMobileCamera, PiWifiHigh, PiLightning, PiHeartbeat,
  PiShoppingBagOpen, PiTelevisionSimple, PiPiggyBank, PiTag,
} from "react-icons/pi";

export type CommitmentIconKey =
  | "grab" | "shopee" | "tiktok"
  | "bank" | "bnpl" | "education"
  | "car" | "home" | "phone" | "wifi" | "electricity"
  | "insurance" | "shopping" | "streaming" | "savings" | "generic";

interface IconDef {
  key: CommitmentIconKey;
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  /** true = real brand glyph (render grey/monochrome only) */
  isBrand: boolean;
}

export const COMMITMENT_ICONS: IconDef[] = [
  // ── Real brand glyphs (rendered grey, never brand color) ──────────────────
  { key: "grab",   label: "Grab",   Icon: SiGrab,   isBrand: true },
  { key: "shopee", label: "Shopee", Icon: SiShopee, isBrand: true },
  { key: "tiktok", label: "TikTok", Icon: SiTiktok, isBrand: true },

  // ── Generic category icons ─────────────────────────────────────────────────
  { key: "bank",        label: "Bank / Loan",   Icon: PiBank,                 isBrand: false },
  { key: "bnpl",        label: "Buy Now Pay Later", Icon: PiCreditCard,       isBrand: false },
  { key: "education",   label: "Education",     Icon: PiGraduationCap,       isBrand: false },
  { key: "car",         label: "Car / Vehicle",  Icon: PiCarProfile,         isBrand: false },
  { key: "home",        label: "Home / Mortgage",Icon: PiHouseLine,          isBrand: false },
  { key: "phone",       label: "Phone / Telco",  Icon: PiDeviceMobileCamera, isBrand: false },
  { key: "wifi",        label: "Internet / WiFi",Icon: PiWifiHigh,           isBrand: false },
  { key: "electricity", label: "Utilities",      Icon: PiLightning,          isBrand: false },
  { key: "insurance",   label: "Insurance",      Icon: PiHeartbeat,          isBrand: false },
  { key: "shopping",    label: "Shopping",       Icon: PiShoppingBagOpen,    isBrand: false },
  { key: "streaming",   label: "Streaming",      Icon: PiTelevisionSimple,  isBrand: false },
  { key: "savings",     label: "Savings",        Icon: PiPiggyBank,         isBrand: false },
  { key: "generic",     label: "Other",          Icon: PiTag,               isBrand: false },
];

export const ICON_MAP: Record<string, IconDef> = COMMITMENT_ICONS.reduce(
  (acc, def) => ({ ...acc, [def.key]: def }),
  {}
);

/** Render a commitment icon by key. Brand glyphs are forced to a grey tone. */
export function CommitmentIcon({
  iconKey,
  size = 18,
  color,
}: {
  iconKey?: string;
  size?: number;
  color?: string;
}) {
  const def = ICON_MAP[iconKey || "generic"] || ICON_MAP.generic;
  const { Icon, isBrand } = def;
  // Brand glyphs: always grey, ignore any accent color passed in
  const renderColor = isBrand ? "#9a9a9a" : (color || "#9a9a9a");
  return <Icon size={size} color={renderColor} />;
}
