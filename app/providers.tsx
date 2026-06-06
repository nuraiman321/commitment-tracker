"use client";

import * as React from "react";

import { AuthProvider } from "../lib/auth";

export interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <AuthProvider>{children}</AuthProvider>;
}
