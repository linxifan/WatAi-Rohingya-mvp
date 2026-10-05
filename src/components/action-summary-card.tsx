"use client";

import { CalendarPlus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AppointmentSummary } from "@/lib/appointment";
import { downloadIcsFile } from "@/lib/download-ics";
import { buildAppointmentIcs, canAddToCalendar, icsFilename } from "@/lib/ics";

function optionalField(value: string): string | null {
  return value.length ? value : null;
}

export function ActionSummaryCard({
  summary,
  onChange,
}: {
  summary: AppointmentSummary;
  onChange: (next: AppointmentSummary) => void;
}) {
  const setItem = (index: number, value: string) => {
    const actionItems = summary.actionItems.map((item, i) => (i === index ? value : item));
    onChange({ ...summary, actionItems });
  };

  const calendarReady = canAddToCalendar(summary);

  const addToCalendar = () => {
    const ics = buildAppointmentIcs(summary);
    if (!ics) {
      toast.error("Add a full date with a year and a time before saving to the calendar.");
      return;
    }
    downloadIcsFile(icsFilename(summary), ics);
  };

  return (
    <Card className="border-primary/25 bg-card py-5 shadow-sm">
      <CardContent className="space-y-5">
        <div>
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">Action summary</p>
          <h2 className="font-[family-name:var(--font-display)] text-2xl">{summary.title}</h2>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1 text-xs text-muted-foreground">
            Date
            <Input
              value={summary.date ?? ""}
              placeholder="Unknown"
              aria-label="Appointment date"
              className="mt-1 h-11 text-base"
              onChange={(event) => onChange({ ...summary, date: optionalField(event.target.value) })}
            />
          </label>
          <span className="hidden pb-3 text-muted-foreground sm:inline" aria-hidden>
            ·
          </span>
          <label className="min-w-0 flex-1 text-xs text-muted-foreground">
            Time
            <Input
              value={summary.time ?? ""}
              placeholder="Unknown"
              aria-label="Appointment time"
              className="mt-1 h-11 text-base"
              onChange={(event) => onChange({ ...summary, time: optionalField(event.target.value) })}
            />
          </label>
        </div>

        <label className="block text-xs text-muted-foreground">
          Location
          <Input
            value={summary.location ?? ""}
            placeholder="Unknown"
            aria-label="Appointment location"
            className="mt-1 h-11 text-base"
            onChange={(event) =>
              onChange({ ...summary, location: optionalField(event.target.value) })
            }
          />
        </label>

        <div className="space-y-2">
          <p className="text-sm font-medium">What to bring</p>
          {summary.actionItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Unknown</p>
          ) : (
            <ul className="space-y-2">
              {summary.actionItems.map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="text-muted-foreground" aria-hidden>
                    •
                  </span>
                  <Input
                    value={item}
                    aria-label={`Item to bring ${index + 1}`}
                    className="h-11 text-base"
                    onChange={(event) => setItem(index, event.target.value)}
                  />
                </li>
              ))}
            </ul>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({ ...summary, actionItems: [...summary.actionItems, ""] })}
          >
            <Plus />
            Add item
          </Button>
        </div>

        <div className="space-y-2">
          <Button
            type="button"
            size="lg"
            disabled={!calendarReady}
            title={
              calendarReady
                ? "Download a calendar event from these details"
                : "Needs a full date with a year and a time"
            }
            onClick={addToCalendar}
          >
            <CalendarPlus />
            Add to Calendar
          </Button>
          {calendarReady ? null : (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Add a date with a year and a time (for example October 15, 2026 and 10:30 AM) to
              enable this. Ambiguous numbers like 05/06/2026 are left unknown on purpose.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
