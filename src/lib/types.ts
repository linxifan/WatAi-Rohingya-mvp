export const CATEGORIES = [
  { id: "greetings", label: "Greetings", rhg: "Sólam" },
  { id: "centre", label: "Welcome Centre", rhg: "Welcome Centre" },
  { id: "health", label: "Health", rhg: "Sehét" },
  { id: "housing", label: "Housing", rhg: "Gór" },
  { id: "family", label: "Family", rhg: "Górguccí" },
  { id: "school", label: "School", rhg: "Eskul" },
  { id: "food", label: "Food", rhg: "Hána" },
  { id: "documents", label: "Documents", rhg: "Kaádh" },
  { id: "work", label: "Work", rhg: "Ham" },
  { id: "emergency", label: "Emergency", rhg: "Emarjensi" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export type Lang = "en" | "rhg";

export type PhraseSource = "phrasebook" | "composed";

export type Phrase = {
  id: string;
  en: string;
  rhg: string;
  category: CategoryId;
  aliases: string[];
  source: PhraseSource;
  notes?: string;
};

export type MatchKind = "exact" | "close" | "related" | "words";

export type PhraseMatch = {
  phrase: Phrase;
  score: number;
  kind: MatchKind;
};

export type WordGloss = {
  en: string;
  rhg: string;
};

export type TranslateQuery = {
  text: string;
  source: Lang;
  target: Lang;
};

export type TranslateResult = {
  query: string;
  source: Lang;
  target: Lang;
  matches: PhraseMatch[];
  gloss: WordGloss[];
  unmatched: string[];
};

export type SegmentKind = "text" | "passthrough";

export type TextSegment = {
  kind: SegmentKind;
  text: string;
};

export type DocumentRowMode = "passthrough" | "match" | "unmatched";

export type DocumentRow = {
  sourceText: string;
  outputText: string;
  mode: DocumentRowMode;
  result: TranslateResult | null;
  phrase: Phrase | null;
  matchKind: MatchKind | null;
};

export const MATCH_THRESHOLD = 0.62;
