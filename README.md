# Ruáingga

Built in partnership with the Welcome Centre, to better connect Rohingya newcomers with the support and services they need.

English ⇄ Rohingya lookup for a settlement desk. Typed text, English speech, and photos all go through **one** function: `translate({ text, source, target })`. Multi-line notices are split first; dates and times are kept as written.

There is no Google Translate API. Rohingya is a low-resource language.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:43147](http://localhost:43147).

If you see `EADDRINUSE`, something is already bound to 43147. Stop that process, then run `npm run dev` again.

## What you can do

- Swap English ⇄ Rohingya
- Type or paste a notice; each line is looked up separately
- Speak **English** (browser speech recognition → `translate()`)
- Photograph a notice: OCR runs **on this device**, then the same `translate()`
- Save lines, show a match large across the desk
- Phrasebook browse
- After an **English** appointment notice is translated, an Action Summary card lists date, time, location, and what to bring — extracted with regex from the original English, never from the Rohingya lines, and never guessed. Fields are editable. Add to Calendar is disabled for now.

Photos never leave the phone. Tesseract.js reads them in the browser.

Rohingya speech recognition is not offered. There is no Listen/TTS in v1 — Rohingya has no reliable public voice.

## Architecture

```
Typed text ──┐
English STT ─┼──► segmentText() ──► translate({ text, source, target })
Photo OCR  ──┘
```

- `src/lib/translate.ts` — the only translation implementation
- `src/lib/segment.ts` — line/sentence split + date/time/place passthrough
- `src/lib/document.ts` — `translateDocument()` maps segments through `translate()`
- `src/lib/ocr.ts` — on-device English OCR
- `src/lib/speech.ts` — English STT only
- `src/lib/appointment.ts` — deterministic Action Summary extraction (English only; not translation)

```bash
npm test
```

Extractor tests live in `src/lib/appointment.test.ts`. They cover labelled dates, Canadian numeric dates, 12- and 24-hour times, prose and bullet bring-lists, and notices with missing fields. The extractor copies the matched text; it does not rewrite it.

## Phrase sources

Published Rohingyalish sentences from RohingyaLanguage.org, plus dictionary-draft lines labelled in the UI. Drafts need native-speaker review before they are official Centre copy. A phrasebook is not a substitute for an interpreter.
