import { translateDocument } from "../src/lib/document.ts";
import { SAMPLE_APPOINTMENT_NOTICE, segmentText } from "../src/lib/segment.ts";
import { translate } from "../src/lib/translate.ts";

const doctor = translate({ text: "I need a doctor", source: "en", target: "rhg" });
if (doctor.matches[0]?.phrase.rhg !== "Añáttu daktor lage") {
  throw new Error("en→rhg doctor failed");
}

const back = translate({
  text: "Añáttu daktor lage",
  source: "rhg",
  target: "en",
});
if (back.matches[0]?.phrase.en !== "I need a doctor") {
  throw new Error("rhg→en doctor failed: " + back.matches[0]?.phrase.en);
}

const segs = segmentText(SAMPLE_APPOINTMENT_NOTICE);
console.log("segments", segs);

const rows = translateDocument({
  text: SAMPLE_APPOINTMENT_NOTICE,
  source: "en",
  target: "rhg",
});
for (const row of rows) {
  console.log(row.mode, "|", JSON.stringify(row.sourceText), "→", row.outputText || "(none)");
}

const passthrough = rows.filter((row) => row.mode === "passthrough");
if (!passthrough.some((row) => /october 15/i.test(row.sourceText))) {
  throw new Error("expected October 15 passthrough");
}
if (!passthrough.some((row) => /welcome centre/i.test(row.sourceText))) {
  throw new Error("expected Welcome Centre passthrough");
}

const matched = rows.filter((row) => row.mode === "match").map((row) => row.sourceText);
if (!matched.some((text) => /appointment notice/i.test(text))) {
  throw new Error("appointment notice should match");
}
if (!matched.some((text) => /your appointment is/i.test(text))) {
  throw new Error("your appointment is should match");
}

console.log("ok");
