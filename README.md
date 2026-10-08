# Ruáingga

Welcome Centre desk tool for **English ⇄ Rohingya**. Built so staff and newcomers can look up trusted lines at the counter — not a generic translate box.

Rohingya has no safe public machine-translation API. This app **retrieves published phrases**. It does not call an LLM, Google Translate, or any cloud translation service.

## Features

- **Type or paste** English or Rohingyalish. Each line is looked up as you type (no extra Translate button).
- **Swap direction:** English ⇄ Rohingya. The globe (interface language) is separate and does not change this.
- **Speak English** (browser speech recognition). Rohingya speech input is not offered.
- **Take / upload a photo** of an English notice. OCR runs **on this device**; the photo is not uploaded.
- **Phrasebook browse** and **save** lines on this phone.
- **Action Summary** for English appointment notices: date, time, location, what to bring. Fields are editable. Missing details stay blank on purpose.
- **Add to Calendar** downloads a `.ics` file when a full date (with year) and a time are present. No Google/Apple login.
- Sample appointment notice included for demos.

A phrasebook is first contact. It is not a substitute for a qualified Rohingya interpreter, especially for health, legal, or protection conversations.

## Run locally

Needs **Node.js 20.9+** (Next.js will refuse Node 16).

```bash
git clone https://github.com/linxifan/WatAi-Rohingya-mvp.git
cd WatAi-Rohingya-mvp
npm install
npm run dev
```

```bash
npm test
npm run build && npm start
```

## Technology

| Piece | What we use |
|---|---|
| App | Next.js (App Router), TypeScript, React, Tailwind, shadcn/ui |
| Translation | One function: `translate({ text, source, target })`. Phrasebook retrieval, not generation |
| Matching | Normalize text → exact / alias match → synonym expansion → token overlap → Levenshtein distance. Show a sentence only if score ≥ 0.62; otherwise “no sentence yet” |
| Word leftovers | Small lexicon gloss (e.g. doctor → `daktor`), never a made-up full sentence |
| Photo | Tesseract.js in the browser, English model only |
| Speech | Web Speech API, `en-CA` only |
| Notices | Split lines; keep dates, times, and “Welcome Centre” as written |
| Appointments | Deterministic regex on the **original English** (Canadian date/time formats). No LLM |
| Calendar | RFC 5545 `.ics` from the confirmed Action Summary |
| Data | `localStorage` only. No accounts, no database, no backend |
| Phrase sources | Published Rohingyalish (RohingyaLanguage.org / Rohingya Language Foundation Book 2 bilingual lines). Dictionary-draft rows are labelled in the UI and need native-speaker review |

The High PDF of Book 2 is a scanned pictorial textbook and is **not** stored in git (size + copyright). Lesson pages are Rohingya-only image drills and are not OCR’d into the matcher. To keep a local copy for human reference:

```bash
bash scripts/fetch-book2-reference.sh
```
