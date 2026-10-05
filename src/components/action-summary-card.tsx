"use client";

import { CalendarPlus, Plus } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AppointmentSummary } from "@/lib/appointment";
import { downloadIcsFile } from "@/lib/download-ics";
import { formatMessage } from "@/lib/i18n";
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
  const { messages } = useLocale();
  const setItem = (index: number, value: string) => {
    const actionItems = summary.actionItems.map((item, i) => (i === index ? value : item));
    onChange({ ...summary, actionItems });
  };

  const calendarReady = canAddToCalendar(summary);

  const addToCalendar = () => {
    const ics = buildAppointmentIcs(summary);
    if (!ics) {
      toast.error(messages.appointment.calendarNeedDateTime);
      return;
    }
    downloadIcsFile(icsFilename(summary), ics);
    toast.success(messages.appointment.calendarSaved);
  };

  return (
    <Card className="border-primary/25 bg-card py-5 shadow-sm">
      <CardContent className="space-y-5">
        <div>
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">
            {messages.appointment.title}
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-2xl">{messages.appointment.heading}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {messages.appointment.intro}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label htmlFor="appointment-date" className="min-w-0 flex-1 text-xs text-muted-foreground">
            {messages.appointment.date}
            <Input
              id="appointment-date"
              value={summary.date ?? ""}
              placeholder={messages.appointment.unknown}
              autoComplete="off"
              className="mt-1 h-11 text-base"
              onChange={(event) => onChange({ ...summary, date: optionalField(event.target.value) })}
            />
          </label>
          <span className="hidden pb-3 text-muted-foreground sm:inline" aria-hidden>
            ·
          </span>
          <label htmlFor="appointment-time" className="min-w-0 flex-1 text-xs text-muted-foreground">
            {messages.appointment.time}
            <Input
              id="appointment-time"
              value={summary.time ?? ""}
              placeholder={messages.appointment.unknown}
              autoComplete="off"
              className="mt-1 h-11 text-base"
              onChange={(event) => onChange({ ...summary, time: optionalField(event.target.value) })}
            />
          </label>
        </div>

        <label htmlFor="appointment-location" className="block text-xs text-muted-foreground">
          {messages.appointment.location}
          <Input
            id="appointment-location"
            value={summary.location ?? ""}
            placeholder={messages.appointment.unknown}
            autoComplete="off"
            className="mt-1 h-11 text-base"
            onChange={(event) =>
              onChange({ ...summary, location: optionalField(event.target.value) })
            }
          />
        </label>

        <div className="space-y-2">
          <p id="what-to-bring-label" className="text-sm font-medium">
            {messages.appointment.bring}
          </p>
          {summary.actionItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">{messages.appointment.unknown}</p>
          ) : (
            <ul className="space-y-2" aria-labelledby="what-to-bring-label">
              {summary.actionItems.map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="text-muted-foreground" aria-hidden>
                    •
                  </span>
                  <Input
                    value={item}
                    aria-label={formatMessage(messages.appointment.itemAria, { n: index + 1 })}
                    className="h-11 min-w-0 flex-1 text-base"
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
            {messages.appointment.addItem}
          </Button>
        </div>

        <div className="space-y-2">
          <Button
            type="button"
            size="lg"
            className="h-12 w-full min-h-12 text-base"
            disabled={!calendarReady}
            aria-describedby={calendarReady ? undefined : "calendar-hint"}
            onClick={addToCalendar}
          >
            <CalendarPlus />
            {messages.appointment.addToCalendar}
          </Button>
          {calendarReady ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {messages.appointment.calendarReadyHint}
            </p>
          ) : (
            <p id="calendar-hint" className="text-xs leading-relaxed text-muted-foreground">
              {messages.appointment.calendarHint}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
