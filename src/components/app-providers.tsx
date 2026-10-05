"use client";

import { LocaleProvider } from "@/components/locale-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <LocaleProvider>{children}</LocaleProvider>
    </TooltipProvider>
  );
}
