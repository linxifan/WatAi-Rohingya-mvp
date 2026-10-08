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
