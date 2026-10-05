"use client";

import { useLocale } from "@/components/locale-provider";

export function SiteFooter() {
  const { messages } = useLocale();
  return (
    <footer className="border-t border-border/80 px-4 py-5 text-center text-xs leading-relaxed text-muted-foreground sm:px-6">
      {messages.app.footer}
    </footer>
  );
}
