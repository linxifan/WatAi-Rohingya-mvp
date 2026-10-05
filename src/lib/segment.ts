import type { TextSegment } from "./types";

const MONTHS =
  "january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec";

const DATE_RE = new RegExp(
  String.raw`\b(?:(?:${MONTHS})\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s*\d{4})?|\d{1,2}(?:st|nd|rd|th)?\s+(?:${MONTHS})\.?(?:,?\s*\d{4})?|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})\b`,
  "gi",
);

const TIME_RE = /\b\d{1,2}[:.]\d{2}\s*(?:a\.?m\.?|p\.?m\.?)?\b/gi;

const PLACE_RE = /\bwelcome\s+centr[e]?s?\b/gi;

type Span = { start: number; end: number };

function collectSpans(line: string): Span[] {
  const spans: Span[] = [];
  for (const pattern of [DATE_RE, TIME_RE, PLACE_RE]) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(line))) {
      spans.push({ start: match.index, end: match.index + match[0].length });
    }
  }
  spans.sort((a, b) => a.start - b.start);
  return mergeNearby(line, spans);
}

function mergeNearby(line: string, spans: Span[]): Span[] {
  if (!spans.length) return [];
  const merged: Span[] = [spans[0]];
  for (let i = 1; i < spans.length; i++) {
    const last = merged[merged.length - 1];
    const gap = line.slice(last.end, spans[i].start);
    if (/^[\s,;·\-–—]*(at|on|from|to)?[\s,;·\-–—]*$/i.test(gap)) {
      last.end = spans[i].end;
    } else {
      merged.push({ ...spans[i] });
    }
  }
  return merged;
}

function peelLine(line: string): TextSegment[] {
  const spans = collectSpans(line);
  if (!spans.length) return sentenceSplit(line);

  const parts: TextSegment[] = [];
  let cursor = 0;
  for (const span of spans) {
    const lead = line.slice(cursor, span.start).trim();
    if (lead) parts.push(...sentenceSplit(lead));
    const kept = line.slice(span.start, span.end).trim();
    if (kept) parts.push({ kind: "passthrough", text: kept });
    cursor = span.end;
  }
  const tail = line.slice(cursor).trim().replace(/^[,;.\-–—·\s]+/, "");
  if (tail) parts.push(...sentenceSplit(tail));
  return parts;
}

function sentenceSplit(text: string): TextSegment[] {
  const cleaned = text.replace(/^[\-•●▪]\s*/, "").trim();
  if (!cleaned) return [];
  if (isPassthroughLine(cleaned)) return [{ kind: "passthrough", text: cleaned }];
  return cleaned
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) =>
      isPassthroughLine(part)
        ? { kind: "passthrough" as const, text: part }
        : { kind: "text" as const, text: part },
    );
}

function isPassthroughLine(text: string): boolean {
  const stripped = text.replace(/[.,;:·\-–—]/g, " ").trim();
  if (!stripped) return true;
  const spans = collectSpans(stripped);
  if (!spans.length) return false;
  const covered = spans.reduce((sum, span) => sum + (span.end - span.start), 0);
  return covered / stripped.length >= 0.7;
}

/** Split a notice or typed block into translateable lines and passthrough values. */
export function segmentText(text: string): TextSegment[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const segments: TextSegment[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    segments.push(...peelLine(line));
  }
  return segments;
}

export const SAMPLE_APPOINTMENT_NOTICE = `APPOINTMENT NOTICE

Your appointment is scheduled for
October 15, 2026 at 10:30 AM.

Please bring:
- Passport
- Proof of address

Welcome Centre`;
