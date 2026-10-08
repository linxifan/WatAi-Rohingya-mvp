import type { Phrase } from "../types";

/**
 * Rohingya interface/content strings from this file are copied from the
 * published text layer of Rohingya Language Book 2 (V1.00). They are not
 * OCR'd, composed, or machine-translated.
 *
 * Rohingya Language Book 2 – V1.00-High is a scanned pictorial textbook
 * (© 2003 Rohingya Language Books, All Rights Reserved). Most lesson pages
 * are images with Rohingya-only drills and no English. Those pages are not
 * ingested: OCR would corrupt Rohingyalish, and inventing English glosses
 * is not allowed.
 *
 * Keep the publisher PDF out of git (size + copyright). Fetch it locally
 * with scripts/fetch-book2-reference.sh.
 */
export const BOOK2_REFERENCE = {
  title: "Rohingya Language Book 2",
  version: "V1.00",
  edition: "Fourth Edition: 2018",
  authors: "Eng. Mohammed Siddique Basu",
  publisher: "Rohingya Language Foundation, London, UK",
  iso: "ISO 639-3 rhg (18 July 2007)",
  site: "https://www.rohingyalanguage.com/download",
  highPdf:
    "https://www.rohingyalanguage.com/wp-content/uploads/2018/10/Rohingya-Language-Book-2-V1.00-High.pdf",
  lightPdf:
    "https://www.rohingyalanguage.com/wp-content/uploads/2018/10/Rohingya-Language-Book-2-V1.00-Light.pdf",
} as const;

const NOTE = "Rohingya Language Foundation, Book 2 V1.00 (published text layer, not OCR).";

/** Bilingual lines printed in Book 2. English and Rohingyalish both appear in the source. */
export const BOOK2_PHRASES: Phrase[] = [
  {
    id: "book2-second-book",
    en: "Rohingya Language Book 2",
    rhg: "Ruáingga Zuban or Dusára Kitab",
    category: "centre",
    aliases: ["rohingya book 2", "second book", "dusara kitab"],
    source: "phrasebook",
    notes: `${NOTE} Title page.`,
  },
  {
    id: "book2-foundation",
    en: "Rohingya Language Foundation",
    rhg: "Ruáingga Zuban or Fóndicen",
    category: "centre",
    aliases: ["language foundation", "rohingya language foundation"],
    source: "phrasebook",
    notes: `${NOTE} Title page.`,
  },
  {
    id: "book2-lang-rules",
    en: "Rohingya Language Rules",
    rhg: "Ruáingga Zuban or Kaanun óll",
    category: "centre",
    aliases: ["language rules", "rohingya language rules"],
    source: "phrasebook",
    notes: `${NOTE} p.7.`,
  },
  {
    id: "book2-alphabet",
    en: "Rohingya Alphabet",
    rhg: "Rohingya hórof óll",
    category: "school",
    aliases: ["alphabet", "rohingya alphabet", "horof"],
    source: "phrasebook",
    notes: `${NOTE} p.7.`,
  },
  {
    id: "book2-new-characters",
    en: "New characters",
    rhg: "Noya hórof óll",
    category: "school",
    aliases: ["new characters", "new letters"],
    source: "phrasebook",
    notes: `${NOTE} p.7.`,
  },
  {
    id: "book2-straight-vowels",
    en: "Straight Vowels",
    rhg: "Sówa zerzobor óll",
    category: "school",
    aliases: ["straight vowels", "vowels"],
    source: "phrasebook",
    notes: `${NOTE} p.7.`,
  },
  {
    id: "book2-circular-vowels",
    en: "Circular Vowels",
    rhg: "Sair gwá fakkáraiya",
    category: "school",
    aliases: ["circular vowels"],
    source: "phrasebook",
    notes: `${NOTE} p.7.`,
  },
  {
    id: "book2-proverb-home-cows",
    en: "Home cows do not eat local grass",
    rhg: "Góror gouru yé, gáñçor kér nohá",
    category: "food",
    aliases: ["home cows do not eat local grass"],
    source: "phrasebook",
    notes: `${NOTE} Proverb 48, English gloss printed in the book.`,
  },
  {
    id: "book2-proverb-six-nine",
    en: "Six merits who does the job, but nine merits who guides how to do it",
    rhg: "Goróyár só gun, dahái douyár no gun",
    category: "work",
    aliases: [
      "six merits who does the job",
      "nine merits who guides",
    ],
    source: "phrasebook",
    notes: `${NOTE} Proverb 49, English gloss printed in the book.`,
  },
];
