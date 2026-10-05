/**
 * Interface-language messages (not content translation).
 *
 * Rohingya interface translations require native-speaker review before production use.
 * Missing strings intentionally fall back to English rather than being generated.
 */
import { en, type Messages } from "./en";
import { rhg, type OverlayMessages } from "./rhg";

export type LocaleId = "en" | "rhg";

export const DEFAULT_LOCALE: LocaleId = "en";
export const INTERFACE_LOCALE_KEY = "ruaingga-interface-locale";

export type { Messages };

export const LOCALES: { id: LocaleId; preview: boolean }[] = [
  { id: "en", preview: false },
  { id: "rhg", preview: true },
];

export function isLocaleId(value: string | null | undefined): value is LocaleId {
  return value === "en" || value === "rhg";
}

export function parseInterfaceLocale(raw: string | null | undefined): LocaleId {
  return isLocaleId(raw) ? raw : DEFAULT_LOCALE;
}

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

function defaultStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadInterfaceLocale(storage?: StorageLike | null): LocaleId {
  try {
    const store = storage === undefined ? defaultStorage() : storage;
    if (!store) return DEFAULT_LOCALE;
    return parseInterfaceLocale(store.getItem(INTERFACE_LOCALE_KEY));
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function saveInterfaceLocale(locale: LocaleId, storage?: StorageLike | null): void {
  try {
    const store = storage === undefined ? defaultStorage() : storage;
    if (!store) return;
    store.setItem(INTERFACE_LOCALE_KEY, locale);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("ruaingga-interface-locale"));
    }
  } catch {
    // localStorage may be blocked; keep the in-memory selection only.
  }
}

type OverlayNode = { [key: string]: string | null | OverlayNode };

export function mergeLocale(base: Messages, overlay: OverlayMessages): Messages {
  return mergeLayer(base, overlay as OverlayNode) as Messages;
}

function mergeLayer(base: unknown, overlay: OverlayNode): unknown {
  if (typeof base !== "object" || base === null) return base;
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const key of Object.keys(overlay)) {
    const next = overlay[key];
    const current = result[key];
    if (next && typeof next === "object" && !Array.isArray(next)) {
      result[key] = mergeLayer(current, next);
    } else if (typeof next === "string" && next.length > 0) {
      result[key] = next;
    }
  }
  return result;
}

/** Resolve UI copy for a locale. Null Rohingya values become English here — not in components. */
export function getMessages(locale: LocaleId): Messages {
  if (locale === "en") return en;
  return mergeLocale(en, rhg);
}

export function formatMessage(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] === undefined ? `{${name}}` : String(vars[name]),
  );
}

/** Map English STT errors from speech.ts into the active locale without changing speech.ts. */
const SPEECH_ERROR_KEYS: Record<string, keyof Messages["translation"]> = {
  "Microphone permission was blocked.": "micBlocked",
  "Could not hear that. Try again.": "micMissed",
};

export function localizeSpeechError(raw: string, messages: Messages): string {
  const key = SPEECH_ERROR_KEYS[raw];
  return key ? messages.translation[key] : raw;
}

export { en, rhg };
