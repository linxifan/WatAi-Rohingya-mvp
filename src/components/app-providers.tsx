"use client";

import { LocaleProvider } from "@/components/locale-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>;
}
