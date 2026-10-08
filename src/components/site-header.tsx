"use client";

import Link from "next/link";
import { InterfaceLanguageSelect } from "@/components/interface-language-select";
import { useLocale } from "@/components/locale-provider";

export function SiteHeader() {
  const { messages } = useLocale();

  return (
    <header className="border-b border-border/80 bg-[color-mix(in_oklch,var(--primary),white_88%)]">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-primary uppercase">
            {messages.app.partnership}
          </p>
          <InterfaceLanguageSelect />
        </div>
        <div>
          <Link href="/" className="block">
            <h1 className="font-[family-name:var(--font-display)] text-3xl leading-none text-foreground sm:text-4xl">
              {messages.app.title}
            </h1>
          </Link>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {messages.app.description}
          </p>
        </div>
      </div>
    </header>
  );
}
