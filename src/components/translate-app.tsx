"use client";

import { Camera, Mic, Repeat, X } from "lucide-react";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { ActionSummaryCard } from "@/components/action-summary-card";
import { PhraseActions, PhraseBody, SourceBadge } from "@/components/phrase-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  NOTICE_SAMPLES,
  extractAppointment,
  hasActionSummary,
  type AppointmentSummary,
} from "@/lib/appointment";
import { translateDocument } from "@/lib/document";
import { recognizeEnglish } from "@/lib/ocr";
import { PHRASE_BY_ID, PHRASES } from "@/lib/phrasebook";
import { createEnglishListener } from "@/lib/speech";
import { addRequest, loadRequests, loadSavedIds, toggleSaved, type PhraseRequest } from "@/lib/storage";
import { phrasesInCategory } from "@/lib/translate";
import { CATEGORIES, type CategoryId, type DocumentRow, type Lang, type Phrase } from "@/lib/types";

const SUGGESTIONS = ["I need a doctor", "Thank you", "I need an interpreter"];

const emptyIds: string[] = [];
const emptyRequests: PhraseRequest[] = [];

function subscribeLocal(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("ruaingga-local", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("ruaingga-local", onChange);
  };
}

export function TranslateApp() {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<Lang>("en");
  const [target, setTarget] = useState<Lang>("rhg");
  const [listening, setListening] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<"idle" | "loading" | "error">("idle");
  const [ocrError, setOcrError] = useState("");
  const saved = useSyncExternalStore(subscribeLocal, loadSavedIds, () => emptyIds);
  const requests = useSyncExternalStore(subscribeLocal, loadRequests, () => emptyRequests);
  const [browse, setBrowse] = useState<CategoryId>("greetings");
  const [large, setLarge] = useState<Phrase | null>(null);
  const [tab, setTab] = useState("translate");
  const listenerRef = useRef<ReturnType<typeof createEnglishListener>>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const rows = useMemo(
    () => (query.trim() ? translateDocument({ text: query, source, target }) : []),
    [query, source, target],
  );
  const extractedAppointment = useMemo(() => {
    if (source !== "en" || !query.trim()) return null;
    return extractAppointment(query);
  }, [query, source]);
  const [appointmentEdits, setAppointmentEdits] = useState<{
    key: string;
    summary: AppointmentSummary;
  } | null>(null);
  const appointmentSummary =
    extractedAppointment && appointmentEdits?.key === query
      ? appointmentEdits.summary
      : extractedAppointment;
  const showActionSummary =
    source === "en" &&
    extractedAppointment !== null &&
    hasActionSummary(extractedAppointment, query);

  const swap = () => {
    const nextSource = target;
    const nextTarget = source;
    const joined = rows
      .map((row) => row.outputText || row.sourceText)
      .join("\n")
      .trim();
    setSource(nextSource);
    setTarget(nextTarget);
    if (joined) setQuery(joined);
  };

  const startMic = () => {
    if (source !== "en") {
      toast.error("Voice input is English only. Swap to English first.");
      return;
    }
    if (!listenerRef.current) {
      listenerRef.current = createEnglishListener(
        (text) => {
          setQuery(text);
          setListening(false);
        },
        (message) => {
          toast.error(message);
          setListening(false);
        },
        () => setListening(false),
      );
    }
    if (!listenerRef.current) {
      toast.error("Voice input is not available in this browser. Type instead.");
      return;
    }
    setListening(true);
    listenerRef.current.start();
  };

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    setOcrStatus("loading");
    setOcrError("");
    try {
      const text = await recognizeEnglish(file);
      if (!text) {
        setOcrStatus("error");
        setOcrError("No English text found in that photo. Try a clearer shot.");
        return;
      }
      setSource("en");
      setTarget("rhg");
      setQuery(text);
      setOcrStatus("idle");
    } catch {
      setOcrStatus("error");
      setOcrError("Could not read the photo on this device.");
    }
  };

  const sourceLabel = source === "en" ? "English" : "Rohingya";
  const targetLabel = target === "en" ? "English" : "Rohingya";

  return (
    <>
      <Tabs value={tab} onValueChange={setTab} className="gap-5">
        <TabsList className="h-11 w-full max-w-full bg-[color-mix(in_oklch,var(--muted),white_40%)] p-1">
          <TabsTrigger value="translate" className="h-9 px-3">
            Translate
          </TabsTrigger>
          <TabsTrigger value="browse" className="h-9 px-3">
            Phrasebook
          </TabsTrigger>
          <TabsTrigger value="saved" className="h-9 px-3">
            Saved
          </TabsTrigger>
        </TabsList>

        <TabsContent value="translate" className="space-y-5">
          <Card className="bg-card/90 py-4 shadow-sm">
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{sourceLabel}</p>
                <Button type="button" variant="outline" size="sm" onClick={swap} aria-label="Swap languages">
                  <Repeat />
                  {sourceLabel} ⇄ {targetLabel}
                </Button>
                <p className="text-sm font-medium text-right">{targetLabel}</p>
              </div>
              <div className="relative">
                <Textarea
                  id="source-text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={
                    source === "en"
                      ? "Type English, or paste a notice…"
                      : "Type Rohingya (Rohingyalish)…"
                  }
                  className="min-h-32 resize-y pr-12 text-base leading-relaxed"
                />
                {query ? (
                  <button
                    type="button"
                    className="absolute top-2.5 right-2.5 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                    onClick={() => setQuery("")}
                    aria-label="Clear"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">{query.length} characters</p>
              <div className="flex flex-wrap items-center gap-2">
                {source === "en" ? (
                  <Button
                    type="button"
                    size="lg"
                    variant={listening ? "default" : "outline"}
                    onClick={startMic}
                  >
                    <Mic />
                    {listening ? "Listening…" : "Speak English"}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  disabled={ocrStatus === "loading"}
                >
                  <Camera />
                  {ocrStatus === "loading" ? "Reading photo…" : "Upload / Take photo"}
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="ghost"
                  disabled={ocrStatus === "loading"}
                  onClick={async () => {
                    const response = await fetch("/sample-appointment-notice.png");
                    const blob = await response.blob();
                    await onPhoto(new File([blob], "sample-appointment-notice.png", { type: "image/png" }));
                  }}
                >
                  Try sample photo
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(event) => {
                    void onPhoto(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Photos are read on this phone with on-device OCR. The image is never uploaded.
                Translation is the same lookup used for typed text — not a translation API.
              </p>
              {ocrStatus === "error" ? (
                <p className="text-sm text-destructive">{ocrError}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setSource("en");
                      setTarget("rhg");
                      setQuery(item);
                    }}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground hover:border-primary/40 hover:bg-primary/5"
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Try a notice</p>
                <div className="flex flex-wrap gap-2">
                  {NOTICE_SAMPLES.map((notice) => (
                    <button
                      key={notice.id}
                      type="button"
                      onClick={() => {
                        setSource("en");
                        setTarget("rhg");
                        setQuery(notice.text);
                      }}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground hover:border-primary/40 hover:bg-primary/5"
                    >
                      {notice.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {!query.trim() ? (
            <EmptyTranslate />
          ) : (
            <div className="space-y-5">
              <DocumentResults
                rows={rows}
                target={target}
                saved={saved}
                onSave={(id) => toggleSaved(id)}
                onShowLarge={setLarge}
                onRequest={(text) => {
                  addRequest(text);
                  toast.success("Saved for the Welcome Centre phrase list");
                }}
              />
              {showActionSummary && appointmentSummary ? (
                <ActionSummaryCard
                  summary={appointmentSummary}
                  onChange={(next) => setAppointmentEdits({ key: query, summary: next })}
                />
              ) : null}
            </div>
          )}
        </TabsContent>

        <TabsContent value="browse" className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setBrowse(category.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
                  browse === category.id
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-foreground"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {phrasesInCategory(browse).map((phrase) => (
              <Card key={phrase.id} size="sm" className="py-3">
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    className="text-left"
                    onClick={() => {
                      setSource("en");
                      setTarget("rhg");
                      setQuery(phrase.en);
                      setTab("translate");
                    }}
                  >
                    <p className="font-[family-name:var(--font-display)] text-xl">{phrase.rhg}</p>
                    <p className="text-sm text-muted-foreground">{phrase.en}</p>
                  </button>
                  <div className="flex items-center gap-2">
                    <SourceBadge source={phrase.source} />
                    <Button type="button" variant="outline" size="sm" onClick={() => setLarge(phrase)}>
                      Show
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          {saved.length === 0 ? (
            <Card>
              <CardContent className="py-2">
                <p className="font-medium">No saved lines yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Save phrases from a match. They stay on this phone.
                </p>
              </CardContent>
            </Card>
          ) : (
            saved.map((id) => {
              const phrase = PHRASE_BY_ID.get(id);
              if (!phrase) return null;
              return (
                <Card key={id} size="sm">
                  <CardContent className="space-y-3">
                    <PhraseBody phrase={phrase} face={target} />
                    <PhraseActions
                      phrase={phrase}
                      saved
                      onSave={() => toggleSaved(phrase.id)}
                      onShowLarge={() => setLarge(phrase)}
                    />
                  </CardContent>
                </Card>
              );
            })
          )}
          {requests.length ? (
            <div className="space-y-2">
              <h2 className="text-sm font-medium">Requested for the phrase list</h2>
              {requests.map((item) => (
                <p key={item.id} className="rounded-lg border border-dashed border-border px-3 py-2 text-sm">
                  {item.english}
                </p>
              ))}
            </div>
          ) : null}
        </TabsContent>
      </Tabs>

      {large ? (
        <button
          type="button"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[color-mix(in_oklch,var(--background),var(--primary)_8%)] p-6 text-center"
          onClick={() => setLarge(null)}
        >
          <SourceBadge source={large.source} />
          <div className="mt-6 max-w-3xl">
            <PhraseBody phrase={large} large face={target} />
          </div>
          <p className="mt-10 text-sm text-muted-foreground">Tap anywhere to close</p>
        </button>
      ) : null}
    </>
  );
}

function DocumentResults({
  rows,
  target,
  saved,
  onSave,
  onShowLarge,
  onRequest,
}: {
  rows: DocumentRow[];
  target: Lang;
  saved: string[];
  onSave: (id: string) => void;
  onShowLarge: (phrase: Phrase) => void;
  onRequest: (text: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {target === "rhg" ? "Rohingya" : "English"} · each line is looked up separately. Dates and
        times stay as written.
      </p>
      {rows.map((row, index) => (
        <Card key={`${row.sourceText}-${index}`} size="sm" className="py-3">
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">{row.sourceText}</p>
            {row.mode === "passthrough" ? (
              <>
                <Badge variant="outline">Kept as written</Badge>
                <p className="font-[family-name:var(--font-display)] text-2xl">{row.outputText}</p>
              </>
            ) : null}
            {row.mode === "match" && row.phrase ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <SourceBadge source={row.phrase.source} />
                  {row.matchKind === "exact" ? <Badge variant="outline">Exact match</Badge> : null}
                </div>
                <p className="font-[family-name:var(--font-display)] text-2xl leading-snug">
                  {row.outputText}
                </p>
                <PhraseActions
                  phrase={row.phrase}
                  saved={saved.includes(row.phrase.id)}
                  onSave={() => onSave(row.phrase!.id)}
                  onShowLarge={() => onShowLarge(row.phrase!)}
                />
              </>
            ) : null}
            {row.mode === "unmatched" ? (
              <>
                <p className="font-medium">No sentence for this line yet</p>
                {row.result?.gloss.length ? (
                  <ul className="space-y-1">
                    {row.result.gloss.map((item) => (
                      <li
                        key={`${item.en}-${item.rhg}`}
                        className="flex justify-between gap-4 rounded-lg bg-muted/60 px-3 py-2 text-sm"
                      >
                        <span>{item.en}</span>
                        <span className="font-[family-name:var(--font-display)]">{item.rhg}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {row.result?.unmatched.length ? (
                  <p className="text-xs text-muted-foreground">
                    No dictionary line yet for: {row.result.unmatched.join(", ")}
                  </p>
                ) : null}
                <Button type="button" variant="outline" size="sm" onClick={() => onRequest(row.sourceText)}>
                  Save this line for review
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyTranslate() {
  return (
    <div className="space-y-4">
      <Card size="sm" className="border-dashed">
        <CardContent>
          <p className="font-medium">Type, speak English, or photograph a notice</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            English ⇄ Rohingya uses one lookup. A photo is OCR’d on this device, then the same
            function translates each line. Dates stay in English. This is not a substitute for an
            interpreter.
          </p>
        </CardContent>
      </Card>
      <div className="grid gap-2 sm:grid-cols-2">
        {PHRASES.filter((phrase) =>
          ["need-interpreter", "need-doctor", "thank-you", "wait-here"].includes(phrase.id),
        ).map((phrase) => (
          <div key={phrase.id} className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="font-[family-name:var(--font-display)] text-lg">{phrase.rhg}</p>
            <p className="text-xs text-muted-foreground">{phrase.en}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
