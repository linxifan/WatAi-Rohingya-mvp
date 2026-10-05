"use client";

import { Mic, X } from "lucide-react";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { PhraseActions, PhraseBody, SourceBadge } from "@/components/phrase-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES } from "@/lib/types";
import { PHRASE_BY_ID, PHRASES } from "@/lib/phrasebook";
import { createEnglishListener } from "@/lib/speech";
import { addRequest, loadRequests, loadSavedIds, toggleSaved, type PhraseRequest } from "@/lib/storage";
import { phrasesInCategory, translate } from "@/lib/translate";
import type { CategoryId, Phrase } from "@/lib/types";

const SUGGESTIONS = [
  "I need a doctor",
  "Thank you",
  "I need an interpreter",
  "Where is the washroom?",
  "I don't understand",
];

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
  const [listening, setListening] = useState(false);
  const saved = useSyncExternalStore(subscribeLocal, loadSavedIds, () => emptyIds);
  const requests = useSyncExternalStore(subscribeLocal, loadRequests, () => emptyRequests);
  const [browse, setBrowse] = useState<CategoryId | "all">("greetings");
  const [large, setLarge] = useState<Phrase | null>(null);
  const [tab, setTab] = useState("translate");
  const listenerRef = useRef<ReturnType<typeof createEnglishListener>>(null);

  const result = useMemo(() => translate(query), [query]);
  const top = result.matches[0];
  const rest = result.matches.slice(1, 5);
  const hasQuery = query.trim().length > 0;

  const onSave = (id: string) => {
    toggleSaved(id);
  };

  const startMic = () => {
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
              <label htmlFor="english" className="text-sm font-medium">
                English
              </label>
              <div className="relative">
                <Textarea
                  id="english"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Type what you need to say… I need a doctor"
                  className="min-h-28 resize-y pr-12 text-base leading-relaxed"
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
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="lg"
                  variant={listening ? "default" : "outline"}
                  onClick={startMic}
                >
                  <Mic />
                  {listening ? "Listening…" : "Speak English"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Matching happens on this device. Nothing is sent to a translation API.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setQuery(item)}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground hover:border-primary/40 hover:bg-primary/5"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {!hasQuery ? (
            <EmptyTranslate />
          ) : top && top.score >= 0.45 ? (
            <div className="space-y-4">
              <ResultPanel
                phrase={top.phrase}
                kind={top.kind}
                saved={saved.includes(top.phrase.id)}
                onSave={() => onSave(top.phrase.id)}
                onShowLarge={() => setLarge(top.phrase)}
              />
              {top.kind !== "exact" ? (
                <p className="text-sm text-muted-foreground">
                  Closest match — check that this is what you meant. Related lines are below.
                </p>
              ) : null}
              {rest.length ? (
                <div className="space-y-2">
                  <h2 className="text-sm font-medium">Related</h2>
                  {rest.map((row) => (
                    <button
                      key={row.phrase.id}
                      type="button"
                      onClick={() => setQuery(row.phrase.en)}
                      className="flex w-full flex-col rounded-xl border border-border bg-card px-4 py-3 text-left hover:border-primary/30"
                    >
                      <span className="font-[family-name:var(--font-display)] text-lg">{row.phrase.rhg}</span>
                      <span className="text-sm text-muted-foreground">{row.phrase.en}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <NoFullMatch
              resultGloss={result.gloss}
              unmatched={result.unmatched}
              query={query}
              related={result.matches}
              onPick={(en) => setQuery(en)}
              onRequest={() => {
                addRequest(query);
                toast.success("Saved for the Welcome Centre phrase list");
              }}
            />
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
          <p className="text-sm text-muted-foreground">
            {CATEGORIES.find((item) => item.id === browse)?.rhg} · tap a line to translate it, or show it large
            across the desk.
          </p>
          <div className="space-y-2">
            {phrasesInCategory(browse === "all" ? "greetings" : browse).map((phrase) => (
              <Card key={phrase.id} size="sm" className="py-3">
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button type="button" className="text-left" onClick={() => { setQuery(phrase.en); setTab("translate"); }}>
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
                  Save the phrases you use at every appointment — housing intake, school enrolment, the health desk.
                  They stay on this phone.
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
                    <PhraseBody phrase={phrase} />
                    <PhraseActions
                      phrase={phrase}
                      saved
                      onSave={() => onSave(phrase.id)}
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
            <PhraseBody phrase={large} large />
          </div>
          <p className="mt-10 text-sm text-muted-foreground">Tap anywhere to close</p>
        </button>
      ) : null}
    </>
  );
}

function ResultPanel({
  phrase,
  kind,
  saved,
  onSave,
  onShowLarge,
}: {
  phrase: Phrase;
  kind: string;
  saved: boolean;
  onSave: () => void;
  onShowLarge: () => void;
}) {
  return (
    <Card className="border-primary/20 bg-card py-5 shadow-sm">
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Rohingya · Ruáingga</Badge>
          <SourceBadge source={phrase.source} />
          {kind === "exact" ? <Badge variant="outline">Exact match</Badge> : null}
        </div>
        <PhraseBody phrase={phrase} />
        {phrase.notes ? <p className="text-sm text-muted-foreground">{phrase.notes}</p> : null}
        <PhraseActions phrase={phrase} saved={saved} onSave={onSave} onShowLarge={onShowLarge} />
      </CardContent>
    </Card>
  );
}

function EmptyTranslate() {
  return (
    <div className="space-y-4">
      <Card size="sm" className="border-dashed">
        <CardContent>
          <p className="font-medium">For the desk, and for the person across it</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Type or speak English. We look up a curated Rohingya line — not a machine guess.
            Turn the phone around with Show large. For medical, legal, or protection conversations,
            book a qualified interpreter.
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

function NoFullMatch({
  resultGloss,
  unmatched,
  query,
  related,
  onPick,
  onRequest,
}: {
  resultGloss: { en: string; rhg: string }[];
  unmatched: string[];
  query: string;
  related: { phrase: Phrase }[];
  onPick: (en: string) => void;
  onRequest: () => void;
}) {
  return (
    <Card className="py-5">
      <CardContent className="space-y-4">
        <div>
          <p className="font-medium">No full sentence for that yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Rohingya is a low-resource language. We will not invent a sentence. Word meanings
            we do know are below — ask an interpreter for the rest.
          </p>
        </div>
        {resultGloss.length ? (
          <ul className="space-y-1.5">
            {resultGloss.map((item) => (
              <li key={item.en} className="flex justify-between gap-4 rounded-lg bg-muted/60 px-3 py-2 text-sm">
                <span>{item.en}</span>
                <span className="font-[family-name:var(--font-display)] text-base">{item.rhg}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {unmatched.length ? (
          <p className="text-xs text-muted-foreground">No dictionary line yet for: {unmatched.join(", ")}</p>
        ) : null}
        <Button type="button" size="lg" onClick={onRequest}>
          Save “{query.trim().slice(0, 42)}
          {query.trim().length > 42 ? "…" : ""}” for review
        </Button>
        {related.length ? (
          <div className="space-y-2">
            <h2 className="text-sm font-medium">Nearby phrases</h2>
            {related.map((row) => (
              <button
                key={row.phrase.id}
                type="button"
                onClick={() => onPick(row.phrase.en)}
                className="block w-full rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted/40"
              >
                {row.phrase.en}
              </button>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
