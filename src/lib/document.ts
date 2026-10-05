import { segmentText } from "./segment";
import { outputFor, translate } from "./translate";
import type { DocumentRow, TranslateQuery } from "./types";

/**
 * Translate a notice or any multi-line block.
 * Audio transcripts and OCR output must go through here (or translate()).
 */
export function translateDocument({ text, source, target }: TranslateQuery): DocumentRow[] {
  return segmentText(text).map((segment) => {
    if (segment.kind === "passthrough" || source === target) {
      return {
        sourceText: segment.text,
        outputText: segment.text,
        mode: "passthrough" as const,
        result: null,
        phrase: null,
        matchKind: null,
      };
    }

    const result = translate({ text: segment.text, source, target });
    const output = outputFor(result);
    const top = result.matches[0];
    if (output && top) {
      return {
        sourceText: segment.text,
        outputText: output,
        mode: "match" as const,
        result,
        phrase: top.phrase,
        matchKind: top.kind,
      };
    }

    return {
      sourceText: segment.text,
      outputText: "",
      mode: "unmatched" as const,
      result,
      phrase: null,
      matchKind: null,
    };
  });
}
