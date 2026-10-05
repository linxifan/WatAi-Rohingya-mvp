import type { AppointmentSummary } from "./appointment";

export type CalendarDateTime = {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
};

const MONTH_NUMBER: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sept: 9,
  sep: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

const MONTH_NAMES = Object.keys(MONTH_NUMBER).sort((a, b) => b.length - a.length).join("|");

const AMPM = "a\\.m\\.|p\\.m\\.|a\\.m|p\\.m|am|pm";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function monthNumber(name: string): number | null {
  const n = MONTH_NUMBER[name.toLowerCase().replace(/\./g, "")];
  return n ?? null;
}

function validYmd(year: number, month: number, day: number): boolean {
  if (year < 1000 || year > 9999) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > daysInMonth(year, month)) return false;
  return true;
}

/** Parse a user-confirmed date. Returns null instead of guessing year, weekday, or D/M vs M/D. */
export function parseAppointmentDate(value: string | null): { year: number; month: number; day: number } | null {
  if (!value) return null;
  const text = value.trim();
  if (!text) return null;

  const iso = text.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    return validYmd(year, month, day) ? { year, month, day } : null;
  }

  const monthFirst = text.match(
    new RegExp(
      `^(${MONTH_NAMES})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))$`,
      "i",
    ),
  );
  if (monthFirst) {
    const month = monthNumber(monthFirst[1]);
    const day = Number(monthFirst[2]);
    const year = Number(monthFirst[3]);
    if (!month) return null;
    return validYmd(year, month, day) ? { year, month, day } : null;
  }

  const dayFirst = text.match(
    new RegExp(
      `^(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+of)?[\\s.\\-/]+(${MONTH_NAMES})\\.?(?:[\\s,\\-/]+(\\d{4}))$`,
      "i",
    ),
  );
  if (dayFirst) {
    const day = Number(dayFirst[1]);
    const month = monthNumber(dayFirst[2]);
    const year = Number(dayFirst[3]);
    if (!month) return null;
    return validYmd(year, month, day) ? { year, month, day } : null;
  }

  const numeric = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (numeric) {
    const first = Number(numeric[1]);
    const second = Number(numeric[2]);
    const year = Number(numeric[3]);
    if (first > 12 && second <= 12) {
      return validYmd(year, second, first) ? { year, month: second, day: first } : null;
    }
    if (first <= 12 && second > 12) {
      return validYmd(year, first, second) ? { year, month: first, day: second } : null;
    }
    return null;
  }

  return null;
}

/** Parse a user-confirmed time. Returns null instead of guessing AM/PM or an incomplete clock. */
export function parseAppointmentTime(value: string | null): { hours: number; minutes: number } | null {
  if (!value) return null;
  const text = value.trim();
  if (!text) return null;

  const hms = text.match(/^(\d{1,2})\s*h\s*(\d{2})$/i);
  if (hms) return clock(Number(hms[1]), Number(hms[2]));

  const withMeridiem = text.match(
    new RegExp(`^(\\d{1,2})(?::(\\d{2})(?::\\d{2})?)?\\s*(${AMPM})$`, "i"),
  );
  if (withMeridiem) {
    const hour12 = Number(withMeridiem[1]);
    const minutes = withMeridiem[2] ? Number(withMeridiem[2]) : 0;
    if (hour12 < 1 || hour12 > 12 || minutes > 59) return null;
    const pm = /^p/i.test(withMeridiem[3]);
    let hours = hour12 % 12;
    if (pm) hours += 12;
    return { hours, minutes };
  }

  const twentyFour = text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (twentyFour) return clock(Number(twentyFour[1]), Number(twentyFour[2]));

  return null;
}

function clock(hours: number, minutes: number): { hours: number; minutes: number } | null {
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

export function parseAppointmentDateTime(summary: AppointmentSummary): CalendarDateTime | null {
  const date = parseAppointmentDate(summary.date);
  const time = parseAppointmentTime(summary.time);
  if (!date || !time) return null;
  return { ...date, ...time };
}

export function canAddToCalendar(summary: AppointmentSummary): boolean {
  return parseAppointmentDateTime(summary) !== null;
}

export function escapeIcsText(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n")
    .replaceAll("\n", "\\n")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,");
}

function utf8Length(value: string): number {
  return new TextEncoder().encode(value).length;
}

/** RFC 5545 line folding at 75 octets. */
export function foldIcsLine(line: string): string {
  if (utf8Length(line) <= 75) return line;
  const bytes = new TextEncoder().encode(line);
  const decoder = new TextDecoder();
  const parts: string[] = [];
  let start = 0;
  let budget = 75;
  while (start < bytes.length) {
    let end = Math.min(start + budget, bytes.length);
    while (end > start && end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--;
    if (end === start) end = Math.min(start + budget, bytes.length);
    parts.push(decoder.decode(bytes.slice(start, end)));
    start = end;
    budget = 74;
  }
  return parts.map((part, index) => (index === 0 ? part : ` ${part}`)).join("\r\n");
}

function formatStampUtc(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}` +
    `T${pad2(date.getUTCHours())}${pad2(date.getUTCMinutes())}${pad2(date.getUTCSeconds())}Z`
  );
}

function formatLocal(parts: CalendarDateTime): string {
  return `${parts.year}${pad2(parts.month)}${pad2(parts.day)}T${pad2(parts.hours)}${pad2(parts.minutes)}00`;
}

function addOneHour(parts: CalendarDateTime): CalendarDateTime {
  const next = new Date(parts.year, parts.month - 1, parts.day, parts.hours + 1, parts.minutes, 0);
  return {
    year: next.getFullYear(),
    month: next.getMonth() + 1,
    day: next.getDate(),
    hours: next.getHours(),
    minutes: next.getMinutes(),
  };
}

function descriptionFor(summary: AppointmentSummary): string | null {
  const items = summary.actionItems.map((item) => item.trim()).filter(Boolean);
  if (!items.length) return null;
  return ["What to bring:", ...items.map((item) => `- ${item}`)].join("\n");
}

export function icsFilename(summary: AppointmentSummary): string {
  const when = parseAppointmentDateTime(summary);
  if (!when) return "appointment.ics";
  return `appointment-${when.year}-${pad2(when.month)}-${pad2(when.day)}.ics`;
}

/**
 * Build a VCALENDAR document from the user-confirmed summary.
 * Uses floating local time (no time zone guessed). Returns null if date or time is incomplete.
 */
export function buildAppointmentIcs(
  summary: AppointmentSummary,
  options?: { now?: Date; uid?: string },
): string | null {
  const start = parseAppointmentDateTime(summary);
  if (!start) return null;

  const now = options?.now ?? new Date();
  const uid = options?.uid ?? `ruaingga-${now.getTime()}@welcome-centre`;
  const title = summary.title.trim() || "Appointment";
  const location = summary.location?.trim() || "";
  const description = descriptionFor(summary);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Welcome Centre//Ruáingga//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatStampUtc(now)}`,
    `DTSTART:${formatLocal(start)}`,
    `DTEND:${formatLocal(addOneHour(start))}`,
    `SUMMARY:${escapeIcsText(title)}`,
  ];
  if (location) lines.push(`LOCATION:${escapeIcsText(location)}`);
  if (description) lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}
