"use client";

import { Globe } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import type { LocaleId } from "@/lib/i18n";

export function InterfaceLanguageSelect() {
  const { locale, setLocale, messages } = useLocale();

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Globe className="size-3.5 shrink-0" aria-hidden />
      <label className="flex min-w-0 items-center gap-1.5">
        <span>{messages.interface.shortLabel}</span>
        <select
          value={locale}
          aria-label={messages.interface.label}
          className="h-8 max-w-[12.5rem] rounded-md border border-border bg-background px-1.5 text-xs text-foreground"
          onChange={(event) => setLocale(event.target.value as LocaleId)}
        >
          <option value="en">{messages.interface.english}</option>
          <option value="rhg">{messages.interface.rohingyaPreview}</option>
        </select>
      </label>
    </div>
  );
}
