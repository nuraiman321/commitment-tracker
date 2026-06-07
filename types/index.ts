import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type Commitment = {
  id: number | string;
  name: string;
  amount: number;
  last_date: string;   // "YYYY-MM-DD" — replaces months + paid
  color?: string;
};
 
export type CommitmentForm = {
  id?: number | string;
  name: string;
  amount: number | string;
  last_date: string;   // date picker value
  color: string;
};

export type Module = {
  id: number | string;
  name: string;
  icon?: string;
  description?: string;
  url?: string;
  sort?: number;
  status?: string;
};

export type UserProfile = {
  id: number | string;
  user: number | string;
  salary: number;
};

export type DirectusUser = {
  id: number | string;
  email?: string;
  first_name?: string;
  last_name?: string;
};

export type ToastState = { msg: string; type: "ok" | "err" } | null;
export type ModalState = Commitment | "add" | null;

export type CommitmentFieldErrors = Partial<
  Record<"name" | "amount" | "last_date", string | undefined>
>;
export type LoginErrors = Partial<{
  email: string;
  password: string;
  server: string;
}>;