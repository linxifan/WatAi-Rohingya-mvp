"use client";

import { Bookmark, Copy, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/components/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Lang, Phrase } from "@/lib/types";

export function PhraseActions({
  phrase,
  saved,
  onSave,
  onShowLarge,
}: {
  phrase: Phrase;
  saved: boolean;
  onSave: () => void;
  onShowLarge?: () => void;
}) {
  const { messages } = useLocale();
  const copy = async () => {
    await navigator.clipboard.writeText(`${phrase.rhg}\n${phrase.en}`);
    toast.success(messages.phrase.copied);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="lg" onClick={copy}>
        <Copy />
        {messages.phrase.copy}
      </Button>
      <Button type="button" variant={saved ? "default" : "outline"} size="lg" onClick={onSave}>
        <Bookmark />
        {saved ? messages.phrase.saved : messages.phrase.save}
      </Button>
      {onShowLarge ? (
        <Button type="button" variant="secondary" size="lg" onClick={onShowLarge}>
          <Maximize2 />
          {messages.phrase.showLarge}
        </Button>
      ) : null}
    </div>
  );
}

export function SourceBadge({ source }: { source: Phrase["source"] }) {
  const { messages } = useLocale();
  if (source === "phrasebook") {
    return <Badge className="bg-primary/15 text-primary border-0">{messages.phrase.published}</Badge>;
  }
  return (
    <Badge variant="outline" className="border-amber-700/30 bg-amber-50 text-amber-950">
      {messages.phrase.draft}
    </Badge>
  );
}

export function PhraseBody({
  phrase,
  large = false,
  face = "rhg",
}: {
  phrase: Phrase;
  large?: boolean;
  face?: Lang;
}) {
  const primary = face === "rhg" ? phrase.rhg : phrase.en;
  const secondary = face === "rhg" ? phrase.en : phrase.rhg;
  return (
    <div className="space-y-2">
      <p
        lang={face === "rhg" ? "rhg" : "en"}
        className={
          large
            ? "font-[family-name:var(--font-display)] text-5xl leading-tight text-foreground sm:text-6xl"
            : "font-[family-name:var(--font-display)] text-3xl leading-snug text-foreground sm:text-4xl"
        }
      >
        {primary}
      </p>
      <p className="text-base text-muted-foreground">{secondary}</p>
    </div>
  );
}
