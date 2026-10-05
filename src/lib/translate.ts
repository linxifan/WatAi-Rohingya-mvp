import { LEXICON } from "./lexicon";
import { PHRASES } from "./phrasebook";
import type {
  CategoryId,
  Lang,
  MatchKind,
  Phrase,
  PhraseMatch,
  TranslateQuery,
  TranslateResult,
  WordGloss,
} from "./types";
import { MATCH_THRESHOLD } from "./types";

export { MATCH_THRESHOLD };

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "to",
  "for",
  "of",
  "in",
  "on",
  "at",
  "and",
  "or",
  "is",
  "are",
  "am",
  "be",
  "do",
  "does",
  "did",
  "can",
  "could",
  "would",
  "will",
  "with",
  "this",
  "that",
  "please",
  "me",
  "my",
  "your",
  "you",
  "i",
  "we",
  "it",
]);

const SYNONYMS: Record<string, string[]> = {
  hello: ["hi", "salaam", "salam", "greeting"],
  hi: ["hello"],
  thanks: ["thank"],
  thank: ["thanks"],
  bathroom: ["toilet", "washroom", "restroom"],
  washroom: ["toilet", "bathroom"],
  restroom: ["toilet"],
  sick: ["ill", "unwell"],
  ill: ["sick"],
  house: ["home", "housing", "apartment"],
  home: ["house", "housing"],
  housing: ["house", "home"],
  doctor: ["physician"],
  medicine: ["medication", "pills"],
  interpreter: ["translator"],
  translator: ["interpreter"],
  job: ["work", "employment"],
  work: ["job", "employment"],
  kids: ["children", "child"],
  children: ["kids", "child"],
  child: ["children", "kids", "son"],
  yeah: ["yes"],
  yep: ["yes"],
  nope: ["no"],
  bye: ["goodbye"],
  goodbye: ["bye"],
  clinic: ["hospital"],
  id: ["card"],
  dob: ["birth"],
  passport: ["passports"],
};

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((token) => token.length > 0);
}

function expand(token: string): Set<string> {
  const set = new Set<string>([token]);
  for (const extra of SYNONYMS[token] ?? []) set.add(extra);
  return set;
}

function contentTokens(text: string): string[] {
  return tokens(text).filter((token) => !STOPWORDS.has(token) || token.length > 4);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = temp;
    }
  }
  return row[b.length];
}

function ratio(a: string, b: string): number {
  const max = Math.max(a.length, b.length);
  if (!max) return 1;
  return 1 - levenshtein(a, b) / max;
}

function kindFor(score: number, exact: boolean): MatchKind {
  if (exact) return "exact";
  if (score >= 0.72) return "close";
  return "related";
}

function lookupCandidates(phrase: Phrase, source: Lang): string[] {
  if (source === "en") return [phrase.en, ...phrase.aliases];
  return phrase.rhg.split("/").map((part) => part.trim());
}

function scorePhrase(query: string, phrase: Phrase, source: Lang): { score: number; exact: boolean } {
  const q = normalize(query);
  if (!q) return { score: 0, exact: false };

  const candidates = lookupCandidates(phrase, source).map(normalize);
  if (candidates.includes(q)) return { score: 1, exact: true };

  let best = 0;
  for (const candidate of candidates) {
    if (candidate.includes(q) || q.includes(candidate)) {
      const overlap =
        Math.min(q.length, candidate.length) / Math.max(q.length, candidate.length);
      if (overlap >= 0.62) {
        best = Math.max(best, 0.84 + overlap * 0.14);
      } else if (overlap >= 0.4) {
        best = Math.max(best, 0.5 + overlap * 0.25);
      }
    }
    best = Math.max(best, ratio(q, candidate) * 0.94);
  }

  const qTokens = contentTokens(query);
  const pTokens = new Set(
    candidates.flatMap((candidate) => contentTokens(candidate).flatMap((t) => [...expand(t)])),
  );
  if (qTokens.length && pTokens.size) {
    let hit = 0;
    for (const token of qTokens) {
      const expanded = expand(token);
      for (const item of expanded) {
        if (pTokens.has(item)) {
          hit += 1;
          break;
        }
      }
    }
    best = Math.max(best, (hit / qTokens.length) * 0.9);
  }

  return { score: best, exact: false };
}

/**
 * The only translation entry point. Audio and photo must call this
 * (or translateDocument, which calls this per segment). No other module
 * may implement translation logic.
 */
export function translate({ text, source, target }: TranslateQuery): TranslateResult {
  const trimmed = text.trim();
  const empty: TranslateResult = {
    query: trimmed,
    source,
    target,
    matches: [],
    gloss: [],
    unmatched: [],
  };
  if (!trimmed || source === target) return empty;

  const scored: PhraseMatch[] = PHRASES.map((phrase) => {
    const { score, exact } = scorePhrase(trimmed, phrase, source);
    return { phrase, score, kind: kindFor(score, exact) };
  })
    .filter((row) => row.score >= 0.38)
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const matches: PhraseMatch[] = [];
  for (const row of scored) {
    if (seen.has(row.phrase.id)) continue;
    seen.add(row.phrase.id);
    matches.push(row);
    if (matches.length >= 8) break;
  }

  return {
    query: trimmed,
    source,
    target,
    matches,
    ...glossQuery(trimmed, source),
  };
}

export function outputFor(result: TranslateResult): string | null {
  const top = result.matches[0];
  if (!top || top.score < MATCH_THRESHOLD) return null;
  return result.target === "rhg" ? top.phrase.rhg : top.phrase.en;
}

export function glossQuery(query: string, source: Lang = "en"): { gloss: WordGloss[]; unmatched: string[] } {
  const gloss: WordGloss[] = [];
  const unmatched: string[] = [];
  const used = new Set<number>();
  const words = tokens(query);

  for (let i = 0; i < words.length; i++) {
    if (used.has(i)) continue;
    const bigram = `${words[i]} ${words[i + 1] ?? ""}`.trim();
    const hit = lookupLexeme(bigram, source) ?? lookupLexeme(words[i], source);
    if (hit) {
      if (hit.en.includes(" ") || hit.rhg.includes(" ")) used.add(i + 1);
      gloss.push(hit);
    } else if (!STOPWORDS.has(words[i])) {
      unmatched.push(words[i]);
    }
  }
  return { gloss, unmatched };
}

function lookupLexeme(raw: string, source: Lang): WordGloss | null {
  const q = normalize(raw);
  if (!q) return null;
  for (const row of LEXICON) {
    const keys =
      source === "en"
        ? [row.en, ...(row.aliases ?? [])].map(normalize)
        : [row.rhg].map(normalize);
    if (keys.includes(q)) return { en: row.en, rhg: row.rhg };
  }
  return null;
}

export function phrasesInCategory(category: CategoryId): Phrase[] {
  return PHRASES.filter((phrase) => phrase.category === category);
}
