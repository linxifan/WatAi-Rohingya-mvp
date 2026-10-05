export type AppointmentSummary = {
  title: "Appointment";
  date: string | null;
  time: string | null;
  location: string | null;
  actionItems: string[];
};

const MONTHS =
  "january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec";

const DATE_RE = new RegExp(
  String.raw`\b(?:(?:${MONTHS})\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s*\d{4})?|\d{1,2}(?:st|nd|rd|th)?\s+(?:${MONTHS})\.?(?:,?\s*\d{4})?|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})\b`,
  "i",
);

const TIME_RE =
  /\b(?:\d{1,2}[:.]\d{2}(?:\s*(?:a\.?m\.?|p\.?m\.?))?|\d{1,2}\s*(?:a\.?m\.?|p\.?m\.?))\b/i;

const LOCATION_LABEL_RE = /^(?:location|venue|place|where)\s*[:\-]\s*(.+)$/i;
const WELCOME_CENTRE_RE = /\bwelcome\s+centr[e]?\b/i;
const BRING_LINE_RE = /^\s*please\s+bring\s*:?\s*(.*)$/i;
const BULLET_RE = /^\s*(?:[\-•●▪*]|\d+[.)])\s+(.+)$/;

function firstMatch(text: string, pattern: RegExp): string | null {
  const match = text.match(pattern);
  const value = match?.[0]?.trim();
  return value ? tidy(value) : null;
}

function tidy(value: string): string {
  return value.replace(/\s+/g, " ").replace(/[.,;]+$/g, "").trim();
}

function extractLocation(text: string): string | null {
  const labelled = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .map((line) => line.match(LOCATION_LABEL_RE)?.[1]?.trim())
    .find(Boolean);
  if (labelled) return tidy(labelled);

  const welcome = text.match(WELCOME_CENTRE_RE)?.[0];
  return welcome ? tidy(welcome.replace(/\s+/g, " ")) : null;
}

function extractActionItems(text: string): string[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const items: string[] = [];
  let collecting = false;

  for (const raw of lines) {
    const line = raw.trim();
    const bring = line.match(BRING_LINE_RE);
    if (bring) {
      collecting = true;
      const rest = bring[1].trim();
      if (rest) items.push(...splitList(rest));
      continue;
    }
    if (!collecting) continue;
    if (!line) {
      collecting = false;
      continue;
    }
    if (WELCOME_CENTRE_RE.test(line) || LOCATION_LABEL_RE.test(line) || DATE_RE.test(line)) {
      collecting = false;
      continue;
    }
    const bullet = line.match(BULLET_RE);
    if (bullet) {
      items.push(...splitList(bullet[1]));
      continue;
    }
    items.push(...splitList(line));
  }

  return unique(items.map(tidy).filter(Boolean));
}

function splitList(value: string): string[] {
  return value
    .split(/\s*(?:,|;| and )\s*/i)
    .map((part) => part.replace(/^[\-•●▪*]+\s*/, "").trim())
    .filter(Boolean);
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(value);
  }
  return next;
}

/** Deterministic extraction from original English. Never guesses missing fields. */
export function extractAppointment(englishText: string): AppointmentSummary {
  const text = englishText.trim();
  return {
    title: "Appointment",
    date: text ? firstMatch(text, DATE_RE) : null,
    time: text ? firstMatch(text, TIME_RE) : null,
    location: text ? extractLocation(text) : null,
    actionItems: text ? extractActionItems(text) : [],
  };
}

export function hasActionSummary(summary: AppointmentSummary, englishText: string): boolean {
  const looksLikeNotice =
    /appointment/i.test(englishText) || /please\s+bring/i.test(englishText);
  if (!looksLikeNotice) return false;
  return Boolean(
    summary.date || summary.time || summary.location || summary.actionItems.length,
  );
}

export function emptyAppointment(): AppointmentSummary {
  return {
    title: "Appointment",
    date: null,
    time: null,
    location: null,
    actionItems: [],
  };
}
