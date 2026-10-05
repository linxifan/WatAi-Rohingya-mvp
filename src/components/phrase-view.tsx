"use client";

import { Bookmark, Copy, Maximize2, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pronunciationGuide, speakRohingya } from "@/lib/speech";
import type { Phrase } from "@/lib/types";

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
  const copy = async () => {
    await navigator.clipboard.writeText(`${phrase.rhg}\n${phrase.en}`);
    toast.success("Copied English and Rohingya");
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="lg" onClick={() => speakRohingya(phrase.rhg)}>
        <Volume2 />
        Hear (approx.)
      </Button>
      <Button type="button" variant="outline" size="lg" onClick={copy}>
        <Copy />
        Copy
      </Button>
      <Button type="button" variant={saved ? "default" : "outline"} size="lg" onClick={onSave}>
        <Bookmark />
        {saved ? "Saved" : "Save"}
      </Button>
      {onShowLarge ? (
        <Button type="button" variant="secondary" size="lg" onClick={onShowLarge}>
          <Maximize2 />
          Show large
        </Button>
      ) : null}
    </div>
  );
}

export function SourceBadge({ source }: { source: Phrase["source"] }) {
  if (source === "phrasebook") {
    return (
      <Badge className="bg-primary/15 text-primary border-0">Verified sentence</Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-amber-700/30 bg-amber-50 text-amber-950">
      Dictionary draft
    </Badge>
  );
}

export function PhraseBody({ phrase, large = false }: { phrase: Phrase; large?: boolean }) {
  return (
    <div className="space-y-3">
      <p
        lang="rhg"
        className={
          large
            ? "font-[family-name:var(--font-display)] text-5xl leading-tight text-foreground sm:text-6xl"
            : "font-[family-name:var(--font-display)] text-3xl leading-snug text-foreground sm:text-4xl"
        }
      >
        {phrase.rhg}
      </p>
      <p className="text-base text-muted-foreground">{phrase.en}</p>
      <p className="text-xs tracking-wide text-muted-foreground uppercase">
        How it sounds · {pronunciationGuide(phrase.rhg)}
      </p>
    </div>
  );
}
