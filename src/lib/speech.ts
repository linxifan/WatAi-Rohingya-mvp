/**
 * Approximate English phonetics for Rohingyalish so the browser's English
 * voice can read a rough pronunciation. This is a stopgap, not a Rohingya TTS.
 */
const DIGRAPHS: [RegExp, string][] = [
  [/ñg/gi, "ng"],
  [/ñy/gi, "ny"],
  [/ch/gi, "sh"],
  [/kh/gi, "kh"],
  [/th/gi, "t"],
  [/dh/gi, "d"],
  [/ts/gi, "t"],
];

export function pronunciationGuide(rhg: string): string {
  return rhg
    .split(/\s+/)
    .map((word) => syllableHint(word))
    .join(" · ");
}

function syllableHint(word: string): string {
  const stripped = word.replace(/[.,!?…]/g, "");
  if (!stripped) return word;
  const stressed = /[áéíóúÁÉÍÓÚ]/.test(stripped);
  const core = stripped
    .replace(/ç/gi, "r")
    .replace(/c/gi, "sh")
    .replace(/ñ/gi, "n")
    .replace(/á/gi, "á")
    .replace(/í/gi, "í")
    .replace(/ú/gi, "ú");
  return stressed ? core : core;
}

export function speakable(rhg: string): string {
  let text = rhg.normalize("NFC");
  for (const [pattern, replacement] of DIGRAPHS) {
    text = text.replace(pattern, replacement);
  }
  text = text
    .replace(/ç/g, "r")
    .replace(/Ç/g, "R")
    .replace(/c/g, "sh")
    .replace(/C/g, "Sh")
    .replace(/ñ/g, "n")
    .replace(/Ñ/g, "N")
    .replace(/á/g, "ah")
    .replace(/é/g, "eh")
    .replace(/í/g, "ee")
    .replace(/ó/g, "oh")
    .replace(/ú/g, "oo")
    .replace(/aa/g, "ah")
    .replace(/ii/g, "ee")
    .replace(/uu/g, "oo")
    .replace(/ai/g, "eye")
    .replace(/oi/g, "oy");
  return text;
}

export function speakRohingya(rhg: string): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(speakable(rhg));
  utterance.rate = 0.78;
  utterance.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  const english =
    voices.find((voice) => voice.lang.startsWith("en") && /female|natural|google/i.test(voice.name)) ??
    voices.find((voice) => voice.lang.startsWith("en"));
  if (english) utterance.voice = english;
  window.speechSynthesis.speak(utterance);
}

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function createEnglishListener(
  onText: (text: string) => void,
  onError: (message: string) => void,
  onEnd?: () => void,
): { start: () => void; stop: () => void } | null {
  const SpeechRecognition =
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
      .webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  const recognition = new SpeechRecognition();
  recognition.lang = "en-CA";
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.onresult = (event) => {
    const transcript = event.results[0]?.[0]?.transcript ?? "";
    if (transcript) onText(transcript);
  };
  recognition.onerror = (event) => {
    if (event.error === "not-allowed") onError("Microphone permission was blocked.");
    else if (event.error !== "no-speech") onError("Could not hear that. Try again.");
  };
  recognition.onend = () => onEnd?.();
  return {
    start: () => recognition.start(),
    stop: () => recognition.stop(),
  };
}
