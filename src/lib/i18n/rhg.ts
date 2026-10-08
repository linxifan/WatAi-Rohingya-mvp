import type { Messages } from "./en";

type NullLeaves<T> = {
  [K in keyof T]: T[K] extends string ? string | null : NullLeaves<T[K]>;
};

/**
 * Rohingya interface translations require native-speaker review before production use.
 * Missing strings intentionally fall back to English rather than being generated.
 *
 * Only a published phrasebook sentence whose meaning unambiguously matches a UI
 * label may be filled in here. Dictionary-draft / composed rows are not used.
 * No published UI-chrome phrases currently match these keys, so every value is null.
 */
export const rhg = {
  app: {
    title: null,
    partnership: null,
    description: null,
    footer: null,
    documentTitle: null,
  },
  interface: {
    label: null,
    shortLabel: null,
    english: null,
    rohingyaPreview: null,
  },
  languages: {
    english: null,
    rohingya: null,
    swap: null,
  },
  tabs: {
    translate: null,
    phrasebook: null,
    saved: null,
  },
  translation: {
    inputPlaceholderEn: null,
    inputPlaceholderRhg: null,
    inputAriaEn: null,
    inputAriaRhg: null,
    clear: null,
    speak: null,
    listening: null,
    listeningStatus: null,
    speakEnglishOnly: null,
    speakUnavailable: null,
    micBlocked: null,
    micMissed: null,
    contentLabel: null,
    resultsHeadingEn: null,
    resultsHeadingRhg: null,
    eachLine: null,
    keptAsWritten: null,
    exactMatch: null,
    noSentence: null,
    noSentenceFor: null,
    saveLine: null,
    savedForReview: null,
    emptyTitle: null,
    emptyBody: null,
  },
  photo: {
    takePhoto: null,
    upload: null,
    reading: null,
    readingStatus: null,
    chooseAria: null,
    privacy: null,
    noText: null,
    failed: null,
    sampleFailed: null,
    trySample: null,
  },
  samples: {
    complete: null,
    missing: null,
  },
  phrase: {
    copy: null,
    copied: null,
    save: null,
    saved: null,
    showLarge: null,
    show: null,
    published: null,
    draft: null,
    closeLarge: null,
    tapToClose: null,
  },
  saved: {
    emptyTitle: null,
    emptyBody: null,
    requested: null,
  },
  appointment: {
    title: null,
    heading: null,
    intro: null,
    date: null,
    time: null,
    location: null,
    bring: null,
    unknown: null,
    addItem: null,
    itemAria: null,
    addToCalendar: null,
    calendarNeedDateTime: null,
    calendarSaved: null,
    calendarReadyHint: null,
    calendarHint: null,
  },
  categories: {
    greetings: null,
    centre: null,
    health: null,
    housing: null,
    family: null,
    school: null,
    food: null,
    documents: null,
    work: null,
    emergency: null,
  },
} as const satisfies NullLeaves<Messages>;

export type OverlayMessages = typeof rhg;
