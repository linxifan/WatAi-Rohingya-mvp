import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AppointmentSummary } from "./appointment.ts";
import { extractAppointment } from "./appointment.ts";
import {
  buildAppointmentIcs,
  canAddToCalendar,
  escapeIcsText,
  foldIcsLine,
  icsFilename,
  parseAppointmentDate,
  parseAppointmentTime,
} from "./ics.ts";

const NOW = new Date("2026-01-02T03:04:05Z");
const UID = "test-uid@welcome-centre";

function summary(partial: Partial<AppointmentSummary>): AppointmentSummary {
  return {
    title: "Appointment",
    date: null,
    time: null,
    location: null,
    actionItems: [],
    ...partial,
  };
}

describe("parseAppointmentDate", () => {
  it("reads month-name dates only when a year is present", () => {
    assert.deepEqual(parseAppointmentDate("October 15, 2026"), {
      year: 2026,
      month: 10,
      day: 15,
    });
    assert.equal(parseAppointmentDate("October 15"), null);
  });

  it("reads unambiguous numeric dates and rejects D/M vs M/D ties", () => {
    assert.deepEqual(parseAppointmentDate("15/10/2026"), {
      year: 2026,
      month: 10,
      day: 15,
    });
    assert.deepEqual(parseAppointmentDate("10/15/2026"), {
      year: 2026,
      month: 10,
      day: 15,
    });
    assert.deepEqual(parseAppointmentDate("2026-10-15"), {
      year: 2026,
      month: 10,
      day: 15,
    });
    assert.equal(parseAppointmentDate("05/06/2026"), null);
    assert.equal(parseAppointmentDate("15-Oct-2026")?.day, 15);
  });
});

describe("parseAppointmentTime", () => {
  it("reads 12-hour and 24-hour clocks without inventing AM/PM", () => {
    assert.deepEqual(parseAppointmentTime("10:30 AM"), { hours: 10, minutes: 30 });
    assert.deepEqual(parseAppointmentTime("10:30 a.m."), { hours: 10, minutes: 30 });
    assert.deepEqual(parseAppointmentTime("3pm"), { hours: 15, minutes: 0 });
    assert.deepEqual(parseAppointmentTime("12:00 AM"), { hours: 0, minutes: 0 });
    assert.deepEqual(parseAppointmentTime("12 PM"), { hours: 12, minutes: 0 });
    assert.deepEqual(parseAppointmentTime("14:00"), { hours: 14, minutes: 0 });
    assert.deepEqual(parseAppointmentTime("14 h 30"), { hours: 14, minutes: 30 });
    assert.equal(parseAppointmentTime("3"), null);
    assert.equal(parseAppointmentTime(""), null);
  });
});

describe("buildAppointmentIcs", () => {
  it("builds a VEVENT from user-confirmed fields including bring-list", () => {
    const ics = buildAppointmentIcs(
      summary({
        date: "October 15, 2026",
        time: "10:30 AM",
        location: "Welcome Centre",
        actionItems: ["Passport", "Proof of address"],
      }),
      { now: NOW, uid: UID },
    );
    assert.ok(ics);
    assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
    assert.match(ics, /\r\nEND:VCALENDAR\r\n$/);
    assert.match(ics, /\r\nUID:test-uid@welcome-centre\r\n/);
    assert.match(ics, /\r\nDTSTAMP:20260102T030405Z\r\n/);
    assert.match(ics, /\r\nDTSTART:20261015T103000\r\n/);
    assert.match(ics, /\r\nDTEND:20261015T113000\r\n/);
    assert.match(ics, /\r\nSUMMARY:Appointment\r\n/);
    assert.match(ics, /\r\nLOCATION:Welcome Centre\r\n/);
    assert.match(ics, /DESCRIPTION:What to bring:\\n- Passport\\n- Proof of address/);
    assert.equal(ics.includes("\n") && !ics.includes("\r\n") ? "bare-lf" : "crlf", "crlf");
  });

  it("uses the edited summary, not the originally extracted text", () => {
    const extracted = extractAppointment(
      "Your appointment is October 15 at 10:30 AM.\nLocation: Welcome Centre",
    );
    assert.equal(extracted.date, "October 15");
    assert.equal(canAddToCalendar(extracted), false);

    const edited = { ...extracted, date: "October 15, 2026", time: "11:00 AM" };
    assert.equal(canAddToCalendar(edited), true);
    const ics = buildAppointmentIcs(edited, { now: NOW, uid: UID });
    assert.match(ics ?? "", /\r\nDTSTART:20261015T110000\r\n/);
    assert.doesNotMatch(ics ?? "", /103000/);
  });

  it("returns null when date or time is missing or ambiguous", () => {
    assert.equal(
      buildAppointmentIcs(summary({ date: "October 15, 2026", time: null })),
      null,
    );
    assert.equal(
      buildAppointmentIcs(summary({ date: null, time: "10:30 AM" })),
      null,
    );
    assert.equal(
      buildAppointmentIcs(summary({ date: "October 15", time: "10:30 AM" })),
      null,
    );
    assert.equal(
      buildAppointmentIcs(summary({ date: "05/06/2026", time: "10:30 AM" })),
      null,
    );
    assert.equal(
      buildAppointmentIcs(summary({ date: "Tuesday", time: "10:30 AM" })),
      null,
    );
  });

  it("escapes commas, semicolons, and backslashes in ICS text", () => {
    assert.equal(escapeIcsText("Room 1, Hall; A\\B"), "Room 1\\, Hall\\; A\\\\B");
    const ics = buildAppointmentIcs(
      summary({
        date: "15/10/2026",
        time: "14:00",
        location: "Room 1, Welcome Centre",
        actionItems: ["Passport; original"],
      }),
      { now: NOW, uid: UID },
    );
    assert.match(ics ?? "", /LOCATION:Room 1\\, Welcome Centre/);
    assert.match(ics ?? "", /Passport\\; original/);
  });

  it("omits location and description when those fields are empty", () => {
    const ics = buildAppointmentIcs(
      summary({ date: "2026-10-15", time: "10:30 AM", actionItems: ["  "] }),
      { now: NOW, uid: UID },
    );
    assert.ok(ics);
    assert.doesNotMatch(ics, /LOCATION:/);
    assert.doesNotMatch(ics, /DESCRIPTION:/);
  });

  it("folds long lines and names the file from the parsed date", () => {
    const longPlace = "Welcome Centre " + "North Hall ".repeat(12);
    const ics = buildAppointmentIcs(
      summary({ date: "10/15/2026", time: "10:30 AM", location: longPlace }),
      { now: NOW, uid: UID },
    );
    assert.ok(ics?.includes("\r\n "));
    assert.equal(foldIcsLine("SHORT"), "SHORT");
    assert.equal(icsFilename(summary({ date: "October 15, 2026", time: "10:30 AM" })), "appointment-2026-10-15.ics");
    assert.equal(icsFilename(summary({ date: "October 15" })), "appointment.ics");
  });
});
