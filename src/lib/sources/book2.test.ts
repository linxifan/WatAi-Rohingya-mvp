import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PHRASES } from "../phrasebook.ts";
import { translate } from "../translate.ts";
import { BOOK2_PHRASES, BOOK2_REFERENCE } from "./book2.ts";

describe("Book 2 phrase reference", () => {
  it("cites the published Book 2 V1.00 High/Light files", () => {
    assert.match(BOOK2_REFERENCE.highPdf, /Book-2-V1\.00-High\.pdf$/);
    assert.match(BOOK2_REFERENCE.lightPdf, /Book-2-V1\.00-Light\.pdf$/);
    assert.equal(BOOK2_REFERENCE.version, "V1.00");
  });

  it("only stores bilingual lines printed in the book", () => {
    assert.ok(BOOK2_PHRASES.length >= 1);
    for (const phrase of BOOK2_PHRASES) {
      assert.equal(phrase.source, "phrasebook");
      assert.ok(phrase.en.trim().length > 1, phrase.id);
      assert.ok(phrase.rhg.trim().length > 1, phrase.id);
      assert.match(phrase.notes ?? "", /not OCR/i);
    }
  });

  it("keeps Book 2 ids unique against the rest of the phrasebook", () => {
    const ids = PHRASES.map((phrase) => phrase.id);
    assert.equal(ids.length, new Set(ids).size);
    for (const phrase of BOOK2_PHRASES) {
      assert.ok(ids.includes(phrase.id));
    }
  });

  it("looks up a Book 2 title without changing thank-you retrieval", () => {
    const book = translate({
      text: "Rohingya Alphabet",
      source: "en",
      target: "rhg",
    });
    assert.equal(book.matches[0]?.phrase.id, "book2-alphabet");
    const thanks = translate({ text: "Thank you", source: "en", target: "rhg" });
    assert.equal(thanks.matches[0]?.phrase.id, "thank-you");
  });
});
