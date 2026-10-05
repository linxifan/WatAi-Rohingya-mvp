import { SAMPLE_APPOINTMENT_NOTICE } from "./segment";

export type AppointmentSummary = {
  title: "Appointment";
  date: string | null;
  time: string | null;
  location: string | null;
  actionItems: string[];
};

/** Longer month names first so "Sept" does not lose to "Sep". */
const MONTHS =
  "january|february|march|april|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sept|sep|oct|nov|dec";

const DATE_RE = new RegExp(
  String.raw`\b(?:` +
    String.raw`(?:${MONTHS})\.?(?:[\s\-]+\d{1,2}(?:st|nd|rd|th)?(?:[,\s]+\d{4})?|[\s\-/]+\d{1,2}(?:st|nd|rd|th)?(?:[\s\-/]+\d{4})?)` +
    String.raw`|\d{1,2}(?:st|nd|rd|th)?(?:\s+of)?[\s.\-/]+(?:${MONTHS})\.?(?:[,\s\-/]+\d{4})?` +
    String.raw`|\d{4}[/-]\d{1,2}[/-]\d{1,2}` +
    String.raw`|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}` +
    String.raw`)\b`,
  "i",
);

const AMPM = "a\\.m\\.|p\\.m\\.|a\\.m|p\\.m|am|pm";

const TIME_RE = new RegExp(
  String.raw`\b(?:` +
    String.raw`\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:${AMPM}))?` +
    String.raw`|\d{1,2}\s*(?:${AMPM})` +
    String.raw`|\d{1,2}\s*h\s*\d{2}` +
    String.raw`)(?!\w)`,
  "i",
);

const DATE_LABEL =
  "appointment\\s+date|date(?:\\s+of(?:\\s+the)?\\s+appointment)?";
const TIME_LABEL =
  "appointment\\s+time|time(?:\\s+of(?:\\s+the)?\\s+appointment)?";
const LOCATION_LABEL = "location|venue|place|where";

const LOCATION_LINE_RE = new RegExp(
  String.raw`^(?:${LOCATION_LABEL})\s*[:\-]\s*(.+)$`,
  "i",
);
const WELCOME_CENTRE_RE = /\bwelcome\s+centr[e]?\b/i;
const BULLET_RE = /^\s*(?:[\-•●▪*]|\d+[.)])\s+(.+)$/;
const BRING_HEADER_RE =
  /please\s+bring(?:\s+(?:the\s+following(?:\s+items)?|with\s+you))?\s*:?\s*|what\s+to\s+bring\s*:?\s*/i;

function preserve(value: string): string {
  return value.replace(/[ \t\f\v]+/g, " ").trim();
}

function stripTrailingPunctuation(value: string): string {
  return preserve(value).replace(/[.,;:]+$/g, "").trim();
}

function firstMatch(text: string, pattern: RegExp): string | null {
  const match = text.match(pattern);
  const value = match?.[0] ? preserve(match[0]) : "";
  return value || null;
}

function labeledMatch(text: string, labelSource: string, valuePattern: RegExp): string | null {
  const labelRe = new RegExp(
    String.raw`(^|[\n.;])[ \t]*(?:${labelSource})[ \t]*[:\-][ \t]*`,
    "ig",
  );
  let hit: RegExpExecArray | null;
  while ((hit = labelRe.exec(text))) {
    const rest = text.slice(hit.index + hit[0].length).replace(/^[ \t]+/, "");
    const valueRe = new RegExp(valuePattern.source, "i");
    const value = valueRe.exec(rest.replace(/^\s+/, ""));
    if (value && value.index === 0) return preserve(value[0]);
  }
  return null;
}

function dateNearAppointment(text: string): string | null {
  const windowRe = /appointment[\s\S]{0,160}/gi;
  let hit: RegExpExecArray | null;
  while ((hit = windowRe.exec(text))) {
    const slice = text.slice(hit.index, hit.index + hit[0].length);
    const found = firstMatch(slice, DATE_RE);
    if (found) return found;
  }
  return null;
}

function timeNearAppointment(text: string): string | null {
  const windowRe = /appointment[\s\S]{0,160}/gi;
  let hit: RegExpExecArray | null;
  while ((hit = windowRe.exec(text))) {
    const slice = text.slice(hit.index, hit.index + hit[0].length);
    const found = firstMatch(slice, TIME_RE);
    if (found) return found;
  }
  return null;
}

function extractDate(text: string): string | null {
  return (
    labeledMatch(text, DATE_LABEL, DATE_RE) ||
    dateNearAppointment(text) ||
    firstMatch(text, DATE_RE)
  );
}

function extractTime(text: string): string | null {
  return (
    labeledMatch(text, TIME_LABEL, TIME_RE) ||
    timeNearAppointment(text) ||
    firstMatch(text, TIME_RE)
  );
}

function extractLocation(text: string): string | null {
  const labeled = labeledRest(text, LOCATION_LABEL);
  if (labeled) return labeled;

  const welcome = text.match(WELCOME_CENTRE_RE)?.[0];
  return welcome ? preserve(welcome) : null;
}

function labeledRest(text: string, labelSource: string): string | null {
  const labelRe = new RegExp(
    String.raw`(^|[\n.;])[ \t]*(?:${labelSource})[ \t]*[:\-][ \t]*`,
    "ig",
  );
  let hit: RegExpExecArray | null;
  while ((hit = labelRe.exec(text))) {
    const rest = text.slice(hit.index + hit[0].length);
    const line = rest.split(/\r?\n/, 1)[0] ?? "";
    const cut = cutAtNextField(line);
    const value = stripTrailingPunctuation(cut);
    if (value) return value;
  }
  return null;
}

function cutAtNextField(rest: string): string {
  return rest.split(
    new RegExp(
      String.raw`\s*(?:\b(?:${LOCATION_LABEL}|${DATE_LABEL}|${TIME_LABEL})\s*[:\-]|\bwelcome\s+centr[e]?\b|\bplease\s+bring\b)`,
      "i",
    ),
  )[0];
}

function isBringStopLine(line: string): boolean {
  if (LOCATION_LINE_RE.test(line)) return true;
  if (new RegExp(String.raw`^(?:${DATE_LABEL}|${TIME_LABEL})\s*[:\-]`, "i").test(line)) {
    return true;
  }
  if (/^welcome\s+centr[e]?\s*[.]*$/i.test(line)) return true;
  if (/^please\s+arrive\b/i.test(line)) return true;
  if (/^thank\s+you\b/i.test(line)) return true;
  return false;
}

function extractActionItems(text: string): string[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const items: string[] = [];
  let collecting = false;

  for (const raw of lines) {
    const line = raw.trim();
    const header = matchBringHeader(line);
    if (header) {
      collecting = true;
      const rest = cutAtNextField(header.rest).trim();
      if (rest) items.push(...splitList(rest));
      continue;
    }
    if (!collecting) continue;
    if (!line) {
      if (items.length) collecting = false;
      continue;
    }
    if (isBringStopLine(line)) {
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

  return unique(items.map(cleanItem).filter(Boolean));
}

function matchBringHeader(line: string): { rest: string } | null {
  const match = BRING_HEADER_RE.exec(line);
  if (!match) return null;
  return { rest: line.slice(match.index + match[0].length) };
}

function splitList(value: string): string[] {
  return value
    .split(/\s*(?:,|;| and | & )\s*/i)
    .map((part) => part.replace(/^[\-•●▪*]+\s*/, "").trim())
    .filter(Boolean);
}

function cleanItem(value: string): string {
  return stripTrailingPunctuation(value.replace(/^(?:your|a|an|the|this|these)\s+/i, ""));
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
    date: text ? extractDate(text) : null,
    time: text ? extractTime(text) : null,
    location: text ? extractLocation(text) : null,
    actionItems: text ? extractActionItems(text) : [],
  };
}

export function hasActionSummary(_summary: AppointmentSummary, englishText: string): boolean {
  return /appointment/i.test(englishText) || /please\s+bring/i.test(englishText) || /what\s+to\s+bring/i.test(englishText);
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

/** Notices shown in the translator. Extraction does not rewrite these strings. */
export const NOTICE_SAMPLES: { id: string; label: string; text: string }[] = [
  {
    id: "welcome-centre-sample",
    label: "Sample appointment notice",
    text: SAMPLE_APPOINTMENT_NOTICE,
  },
  {
    id: "missing-fields",
    label: "Notice with missing details",
    text: `APPOINTMENT NOTICE
Please arrive early.`,
  },
];
