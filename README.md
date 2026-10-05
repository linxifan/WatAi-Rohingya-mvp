# Ruáingga

Built in partnership with the Welcome Centre, to better connect Rohingya newcomers with the support and services they need.

**Ruáingga** is a small English → Rohingya translator for settlement desks. It is a phrasebook first: type or speak English, get a labelled Rohingya line you can show large across the counter.

It is not a wrapper around Google Translate. Rohingya is a low-resource language. Public neural translation APIs do not offer a safe `rhg` model for health, housing, or legal talk. This app retrieves curated Rohingyalish (Latin-script Rohingya) instead of generating a guess.

## What you can do

- Translate common Welcome Centre English into Rohingya
- Browse by topic: greetings, health, housing, school, documents, work, emergency
- Speak English into the box (browser speech recognition)
- Hear an approximate pronunciation (not a native Rohingya voice)
- Save lines on this device
- Show a phrase full-screen so the person across the desk can read it
- Park missing English for later community review
- Read **How it works** — technical theory for each feature (`/theory`)

Every line is tagged:

- **Verified sentence** — published Rohingyalish from NGO / learner phrasebooks
- **Dictionary draft** — assembled from dictionary headwords and documented grammar (`Añáttu X lage`, `X hoçé?`)

A phrasebook is first contact, not a substitute for a qualified interpreter.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:43147](http://localhost:43147).

```bash
npm run build
npm start
```

No API keys. Matching runs in the browser.

## How translation works here

1. Normalize English (case, punctuation, accents).
2. Expand settlement synonyms (`washroom` → `toilet`, `translator` → `interpreter`).
3. Score the phrasebank with exact match, token overlap, and Levenshtein distance.
4. If there is no sentence, show word glosses from the dictionary and refuse to invent the rest.

The `/theory` page walks through how you would implement production versions of translation, speech in/out, Hanifi script conversion, community review, offline cache, privacy, interpreter booking, and evaluation.

## Language notes

Rohingyalish reading: `c` is “sh”, `ç` is a flapped r, `ñ` nasalises the vowel, acute accents mark stress. Ask which script someone can read — Hanifi, Fonna, or Latin — before printing.

Phrase sources include published materials from [RohingyaLanguage.org](https://rohingyalanguage.org/tools/phrasebook/) (phrasebook, NGO phrases, learner lessons) and the English–Rohingya dictionary based on E.M. Siddique Basu. Draft lines should be reviewed by native speakers before they are used as official Centre copy.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui.
