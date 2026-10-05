import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractAppointment,
  hasActionSummary,
} from "./appointment.ts";
import { SAMPLE_APPOINTMENT_NOTICE } from "./segment.ts";

describe("extractAppointment", () => {
  it("extracts the sample appointment notice without guessing", () => {
    const summary = extractAppointment(SAMPLE_APPOINTMENT_NOTICE);
    assert.equal(summary.title, "Appointment");
    assert.equal(summary.date, "October 15");
    assert.equal(summary.time, "10:30 AM");
    assert.equal(summary.location, "Welcome Centre");
    assert.deepEqual(summary.actionItems, ["Passport", "Proof of address"]);
  });

  it("leaves unknown fields empty instead of inventing them", () => {
    const summary = extractAppointment("APPOINTMENT NOTICE\nPlease arrive early.");
    assert.equal(summary.date, null);
    assert.equal(summary.time, null);
    assert.equal(summary.location, null);
    assert.deepEqual(summary.actionItems, []);
  });

  it("does not treat a greeting as an appointment", () => {
    const text = "I need a doctor";
    const summary = extractAppointment(text);
    assert.equal(hasActionSummary(summary, text), false);
  });

  it("reads numeric dates and 24-hour times", () => {
    const summary = extractAppointment(
      "Appointment\nDate: 15/10/2026\nTime: 14:00\nLocation: Welcome Center",
    );
    assert.equal(summary.date, "15/10/2026");
    assert.equal(summary.time, "14:00");
    assert.equal(summary.location, "Welcome Center");
  });

  it("reads Please bring items on the same line", () => {
    const summary = extractAppointment(
      "Your appointment is on May 2.\nPlease bring: health card and passport",
    );
    assert.equal(summary.date, "May 2");
    assert.deepEqual(summary.actionItems, ["health card", "passport"]);
  });

  it("stops collecting bring items when a location line starts", () => {
    const summary = extractAppointment(
      "Please bring:\n- Photo ID\nWelcome Centre",
    );
    assert.deepEqual(summary.actionItems, ["Photo ID"]);
    assert.equal(summary.location, "Welcome Centre");
  });

  it("uses the first date and time only", () => {
    const summary = extractAppointment(
      "Appointment on June 1 at 9:00 am. Reschedule option: July 4 at 2:00 pm.",
    );
    assert.equal(summary.date, "June 1");
    assert.equal(summary.time, "9:00 am");
  });

  it("does not invent a street address without a location label", () => {
    const summary = extractAppointment(
      "Appointment notice\nPlease go to 123 King Street West.",
    );
    assert.equal(summary.location, null);
  });

  it("reads a clock time with AM/PM and no minutes", () => {
    const summary = extractAppointment("Appointment at 3pm on April 4.");
    assert.equal(summary.time, "3pm");
    assert.equal(summary.date, "April 4");
  });

  it("does not treat a weekday or a bare ordinal as a date", () => {
    const summary = extractAppointment("Appointment on Tuesday the 15th. Please arrive early.");
    assert.equal(summary.date, null);
    assert.equal(summary.time, null);
  });

  it("shows an action summary for the sample notice", () => {
    assert.equal(hasActionSummary(extractAppointment(SAMPLE_APPOINTMENT_NOTICE), SAMPLE_APPOINTMENT_NOTICE), true);
  });
});
