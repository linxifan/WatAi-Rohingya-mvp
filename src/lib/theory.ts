export type TheoryTopic = {
  id: string;
  title: string;
  question: string;
  now: string;
  production: string[];
  why: string;
};

export const THEORY: TheoryTopic[] = [
  {
    id: "translate",
    title: "English → Rohingya translation",
    question: "How would you implement translation technically?",
    why: "Rohingya is a low-resource language. Public neural machine translation (Google Cloud Translation, Microsoft Translator, LibreTranslate) does not ship a reliable rhg model. Medical, legal, and housing wording cannot be guessed.",
    now: "This app treats translation as retrieval, not generation. English is normalized, expanded with settlement synonyms, then scored against a curated phrasebook using exact match, token overlap, and Levenshtein distance. Dictionary headwords fill gaps as a word gloss — never as a fake full sentence.",
    production: [
      "Keep a bilingual TMX/JSON memory of Welcome Centre utterances, each with a native-speaker review state (draft → reviewed → published).",
      "Add a second stage: if retrieval confidence < 0.72, run a constrained seq2seq model (M2M100 / NLLB fine-tune, or a small LoRA on an LLM) with a forced glossary of Rohingyalish terms. Never show model output without an Unverified badge.",
      "Use embedding retrieval (e5 / MiniLM) over phrase English + aliases when the phrasebank grows past a few thousand rows. BM25 + embeddings as a hybrid ranker.",
      "Route high-stakes domains (health, protection, immigration) to a human interpreter queue instead of the model.",
      "Log only hashed queries and chosen phrase IDs for evaluation — not names, addresses, or health details.",
    ],
  },
  {
    id: "speech-in",
    title: "Speak English into the box",
    question: "How would you implement voice input technically?",
    why: "Staff often have their hands full at the desk. Newcomers may not type English. Voice is faster than a keyboard in a waiting room.",
    now: "The microphone uses the browser Web Speech API (en-CA). The transcript is fed into the same phrase matcher. Nothing is uploaded by this app.",
    production: [
      "For noisy reception areas, stream 16 kHz audio to a self-hosted Whisper.cpp / faster-whisper endpoint with VAD (Silero) so silence does not burn GPU.",
      "Bias the recognizer with a settlement language model: a finite list of expected phrases plus names of local programs, so 'health card' is preferred over 'held card'.",
      "Add barge-in and a push-to-talk control; auto-send only after 800 ms of silence.",
      "Keep STT on-device (Whisper tiny/base via WebGPU or a native wrapper) if the Centre cannot send audio off-site.",
    ],
  },
  {
    id: "speech-out",
    title: "Hearing the Rohingya",
    question: "How would you implement Rohingya text-to-speech?",
    why: "Many clients are more comfortable with spoken Ruáingga than with Latin script. There is no commercial Rohingya voice.",
    now: "A grapheme-to-phoneme sketch maps Rohingyalish (c→sh, ç→r, ñ nasal, acute accents as stress) into an English-voice approximation. It is labelled approximate on purpose.",
    production: [
      "Record 2–4 hours of a community speaker reading the phrasebook plus a phonetically balanced script. Store 48 kHz WAV with consent and a speaker agreement.",
      "Fine-tune a multilingual TTS such as Meta MMS, Coqui XTTS, or StyleTTS 2 on that corpus. Keep a fallback of concatenated phrase-level recordings for the top 200 lines so the desk never depends on a model.",
      "Ship audio as cached Opus files keyed by phrase id so the app works offline.",
      "Do not clone a speaker's voice without documented, revocable consent.",
    ],
  },
  {
    id: "scripts",
    title: "Hanifi, Fonna, and Rohingyalish",
    question: "How would you implement script conversion?",
    why: "Literacy varies. Some readers use Hanifi Rohingya (Unicode), some Arabic-based Fonna, some Latin Rohingyalish. Asking which script someone can read is part of the product, not a footnote.",
    now: "The v1 UI writes Rohingyalish only, with a pronunciation key, because it is what staff can type and what most digital NGO materials use.",
    production: [
      "Maintain one internal orthography (NFC Rohingyalish) as the source of truth.",
      "Apply a deterministic finite-state transducer to emit Hanifi (U+10D00–U+10D3F) and Fonna. Round-trip tests on the dictionary catch missing graphemes.",
      "Let the client pick a script once; store it in localStorage and on a future profile.",
      "When printing appointment letters, generate PDF with Noto Naskh / Noto Sans Hanifi so glyphs do not fall back to tofu.",
    ],
  },
  {
    id: "verify",
    title: "Community verification",
    question: "How would you implement a review workflow?",
    why: "Composed sentences from a dictionary are useful drafts. They are not yet community-owned. A Welcome Centre cannot put an unverified line on a consent form.",
    now: "Every line is tagged phrasebook (published sentence) or composed (grammar + dictionary). Staff can save a missing English request locally.",
    production: [
      "Build a review queue: draft translation → two native reviewers (independent) → adjudicator on disagreement → published with a version number.",
      "Track provenance: speaker, date, source document, licence (CC BY for community phrasebooks).",
      "Show the badge in the client UI. Never silently promote a draft.",
      "When a model or staff member proposes a new rendering, store it as a variant, not a overwrite, so dialect differences (Cox's Bazar vs. diaspora) can coexist.",
    ],
  },
  {
    id: "offline",
    title: "Offline and waiting-room use",
    question: "How would you implement offline support?",
    why: "Phones in a reception area drop Wi-Fi. The phrasebook must still open.",
    now: "The matcher and phrase list ship in the JS bundle. Saved phrases live in localStorage. No network is required after first load.",
    production: [
      "Add a service worker (Workbox) that precaches the app shell, phrase JSON, and top audio clips.",
      "Version the phrasebank (ETag / content hash) so a nightly publish updates the cache without a store release.",
      "If you later add a model, ship a quantized ONNX/WebGPU build optional on Wi-Fi, not required for the desk.",
    ],
  },
  {
    id: "privacy",
    title: "Privacy at the desk",
    question: "How would you implement privacy for health and housing talk?",
    why: "People will type 'I am sick', addresses, and children's names. Third-party translation APIs would become a health-record processor.",
    now: "Matching runs in the browser. There is no account, no analytics SDK, and no outbound translate call.",
    production: [
      "Keep PII on device. If the Centre needs stats, send only aggregate counts: phrase id, language, hour — never the raw query.",
      "If a server is required (interpreter booking), encrypt in transit (TLS) and at rest, with a 30-day retention default.",
      "Do not paste client utterances into a public LLM.",
    ],
  },
  {
    id: "interpreter",
    title: "Escalating to a human interpreter",
    question: "How would you implement interpreter request?",
    why: "A phrasebook is first contact. Protection interviews, medical consent, and legal forms need a qualified interpreter.",
    now: "The UI states that clearly and offers 'show this large' so a worker can turn the phone toward the client. Missing phrases can be parked as local requests.",
    production: [
      "Add a 'Book interpreter' action that posts to the Centre's existing intake (phone, video, in-person) with time, language, and domain tags.",
      "Hold a 2-hour booking SLA for appointments; keep an on-call path for emergencies that never goes through the translator.",
      "Attach the last 3 phrase ids (not free text) so the interpreter arrives with context.",
    ],
  },
  {
    id: "eval",
    title: "Knowing it actually helps",
    question: "How would you evaluate quality?",
    why: "BLEU against English–Rohingya web scrapes will reward fluent nonsense. Settlement work needs adequacy and safety.",
    now: "Quality is the phrase list itself: published sentences first, composed lines labelled, retrieval ranked where staff can see alternatives.",
    production: [
      "Score with MQM-style adequacy/fluency on a 50-item settlement set, judged by two native speakers.",
      "Track desk metrics: time-to-first-useful-phrase, % of queries with exact match, % escalated to interpreter, and 'wrong phrase used' incident reports.",
      "Regression-test the matcher so a new synonym list cannot bury 'I am sick' under 'I am well'.",
    ],
  },
];
