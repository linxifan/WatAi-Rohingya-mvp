import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { translate } from "../translate.ts";
import { extractAppointment } from "../appointment.ts";
import { SAMPLE_APPOINTMENT_NOTICE } from "../segment.ts";
import {
  DEFAULT_LOCALE,
  INTERFACE_LOCALE_KEY,
  en,
  formatMessage,
  getMessages,
  loadInterfaceLocale,
  localizeSpeechError,
  mergeLocale,
  parseInterfaceLocale,
  rhg,
  saveInterfaceLocale,
} from "./index.ts";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem(key: string) {
      return Object.hasOwn(data, key) ? data[key] : null;
    },
    setItem(key: string, value: string) {
      data[key] = value;
    },
    data,
  };
}

function leafKeys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return prefix ? [prefix] : [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("interface locale", () => {
  it("1. defaults to English", () => {
    assert.equal(DEFAULT_LOCALE, "en");
    assert.equal(parseInterfaceLocale(null), "en");
    assert.equal(parseInterfaceLocale("fr"), "en");
    assert.equal(getMessages("en").tabs.translate, "Translate");
    assert.equal(getMessages("en").appointment.addToCalendar, "Add to Calendar");
    assert.equal(getMessages("en").interface.rohingyaPreview, "Rohingya — Coming soon");
  });

  it("2. switches the resolved message table by locale id", () => {
    const english = getMessages("en");
    const preview = getMessages("rhg");
    assert.notEqual(english, preview);
    assert.equal(preview.interface.rohingyaPreview, english.interface.rohingyaPreview);
  });

  it("3. missing Rohingya strings fall back to English at the locale layer", () => {
    assert.equal(rhg.tabs.translate, null);
    assert.equal(rhg.appointment.unknown, null);
    assert.equal(getMessages("rhg").tabs.translate, en.tabs.translate);
    assert.equal(getMessages("rhg").appointment.unknown, en.appointment.unknown);
    const overlay = {
      ...rhg,
      tabs: { ...rhg.tabs, translate: "X" },
    };
    assert.equal(mergeLocale(en, overlay).tabs.translate, "X");
    assert.equal(mergeLocale(en, overlay).tabs.saved, en.tabs.saved);
    const englishTranslate = en.tabs.translate;
    getMessages("rhg");
    assert.equal(en.tabs.translate, englishTranslate);
  });

  it("4. persists the interface locale in storage and survives a reload read", () => {
    const storage = memoryStorage();
    assert.equal(loadInterfaceLocale(storage), "en");
    saveInterfaceLocale("rhg", storage);
    assert.equal(storage.getItem(INTERFACE_LOCALE_KEY), "rhg");
    assert.equal(loadInterfaceLocale(storage), "rhg");
    const throwing = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    };
    assert.equal(loadInterfaceLocale(throwing), "en");
    saveInterfaceLocale("rhg", throwing);
    assert.equal(loadInterfaceLocale(null), "en");
  });

  it("5. changing interface language does not change translation source or target", () => {
    const direction = { source: "en" as const, target: "rhg" as const };
    const query = { text: "Thank you", ...direction };
    const before = translate(query);
    getMessages("rhg");
    const after = translate({ text: "Thank you", source: direction.source, target: direction.target });
    assert.equal(direction.source, "en");
    assert.equal(direction.target, "rhg");
    assert.equal(after.source, "en");
    assert.equal(after.target, "rhg");
    assert.equal(after.matches[0]?.phrase.id, before.matches[0]?.phrase.id);
    assert.notEqual(INTERFACE_LOCALE_KEY, "source");
  });

  it("6. changing interface language does not erase existing user state", () => {
    const userState = {
      query: SAMPLE_APPOINTMENT_NOTICE,
      source: "en" as const,
      target: "rhg" as const,
      ocrText: "Please wait here",
      appointmentEdits: extractAppointment(SAMPLE_APPOINTMENT_NOTICE),
    };
    const snapshot = structuredClone(userState);
    getMessages("rhg");
    getMessages("en");
    assert.deepEqual(userState, snapshot);
    assert.equal(userState.appointmentEdits.date, "October 15, 2026");
    assert.equal(userState.appointmentEdits.time, "10:30 AM");
    assert.equal(userState.query, SAMPLE_APPOINTMENT_NOTICE);
    const again = extractAppointment(userState.query);
    assert.deepEqual(again, userState.appointmentEdits);
  });

  it("keeps the same message keys in English and Rohingya overlays", () => {
    assert.deepEqual(leafKeys(en), leafKeys(rhg));
  });

  it("does not invent Rohingya UI copy", () => {
    for (const key of leafKeys(rhg)) {
      const value = key.split(".").reduce<unknown>((node, part) => {
        return (node as Record<string, unknown>)[part];
      }, rhg);
      assert.equal(value, null, key);
    }
  });

  it("formats numbered UI strings", () => {
    assert.equal(formatMessage("Item to bring {n}", { n: 2 }), "Item to bring 2");
  });

  it("maps speech errors through the locale table without changing speech.ts", () => {
    assert.equal(
      localizeSpeechError("Microphone permission was blocked.", getMessages("rhg")),
      en.translation.micBlocked,
    );
    assert.equal(localizeSpeechError("unrelated", getMessages("en")), "unrelated");
  });
});
