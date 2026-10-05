import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractAppointment,
  hasActionSummary,
} from "./appointment.ts";
import { SAMPLE_APPOINTMENT_NOTICE } from "./segment.ts";

describe("extractAppointment", () => {
  it("1. extracts the sample notice with a bullet bring-list", () => {
    const summary = extractAppointment(SAMPLE_APPOINTMENT_NOTICE);
    assert.equal(summary.title, "Appointment");
    assert.equal(summary.date, "October 15, 2026");
    assert.equal(summary.time, "10:30 AM");
    assert.equal(summary.location, "Welcome Centre");
    assert.deepEqual(summary.actionItems, ["Passport", "Proof of address"]);
    assert.equal(hasActionSummary(summary, SAMPLE_APPOINTMENT_NOTICE), true);
  });

  it("2. reads a one-line sentence without rewriting it", () => {
    const text = "Your appointment is October 15 at 10:30 AM.";
    const summary = extractAppointment(text);
    assert.equal(summary.date, "October 15");
    assert.equal(summary.time, "10:30 AM");
    assert.equal(summary.location, null);
    assert.deepEqual(summary.actionItems, []);
  });

  it("3. preserves Appointment Date: October 15, 2026", () => {
    const text = "Appointment Date: October 15, 2026";
    const summary = extractAppointment(text);
    assert.equal(summary.date, "October 15, 2026");
    assert.equal(summary.time, null);
    assert.equal(summary.location, null);
  });

  it("4. preserves Date: 10/15/2026 and Time: 10:30 AM", () => {
    const text = "Appointment\nDate: 10/15/2026\nTime: 10:30 AM";
    const summary = extractAppointment(text);
    assert.equal(summary.date, "10/15/2026");
    assert.equal(summary.time, "10:30 AM");
  });

  it("5. preserves Canadian numeric dates and 24-hour times", () => {
    const text = "Appointment\nDate: 15/10/2026\nTime: 14:00\nLocation: Welcome Centre";
    const summary = extractAppointment(text);
    assert.equal(summary.date, "15/10/2026");
    assert.equal(summary.time, "14:00");
    assert.equal(summary.location, "Welcome Centre");
  });

  it("6. reads Please bring your passport and proof of address", () => {
    const text =
      "Your appointment is October 15 at 10:30 AM.\nPlease bring your passport and proof of address.";
    const summary = extractAppointment(text);
    assert.equal(summary.date, "October 15");
    assert.equal(summary.time, "10:30 AM");
    assert.deepEqual(summary.actionItems, ["passport", "proof of address"]);
  });

  it("7. reads Please bring: followed by bullets and a Location label", () => {
    const text = `Appointment
Please bring:
- Passport
- Proof of address
Location: Welcome Centre`;
    const summary = extractAppointment(text);
    assert.deepEqual(summary.actionItems, ["Passport", "Proof of address"]);
    assert.equal(summary.location, "Welcome Centre");
    assert.equal(summary.date, null);
    assert.equal(summary.time, null);
  });

  it("8. leaves missing information unknown instead of guessing", () => {
    const text = "APPOINTMENT NOTICE\nPlease arrive early.";
    const summary = extractAppointment(text);
    assert.equal(summary.date, null);
    assert.equal(summary.time, null);
    assert.equal(summary.location, null);
    assert.deepEqual(summary.actionItems, []);
    assert.equal(hasActionSummary(summary, text), true);
  });

  it("9. prefers a labeled appointment date over a print date", () => {
    const text = `Printed 01/01/2026
Appointment Date: October 15, 2026
Time: 10:30 a.m.`;
    const summary = extractAppointment(text);
    assert.equal(summary.date, "October 15, 2026");
    assert.equal(summary.time, "10:30 a.m.");
  });

  it("10. reads 15-Oct-2026 and a 12-hour time without minutes", () => {
    const text = "Appointment on 15-Oct-2026 at 3pm.";
    const summary = extractAppointment(text);
    assert.equal(summary.date, "15-Oct-2026");
    assert.equal(summary.time, "3pm");
  });

  it("11. does not invent a weekday, a bare ordinal, or an unlabeled street", () => {
    const text = "Appointment on Tuesday the 15th.\nPlease go to 123 King Street West.";
    const summary = extractAppointment(text);
    assert.equal(summary.date, null);
    assert.equal(summary.time, null);
    assert.equal(summary.location, null);
  });

  it("12. does not treat a greeting as an appointment notice", () => {
    const text = "I need a doctor";
    assert.equal(hasActionSummary(extractAppointment(text), text), false);
  });
});
