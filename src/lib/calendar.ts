import ical, { ICalEvent } from "ical";
import { addDays, addMinutes, isWeekend, set, startOfDay } from "date-fns";
import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";

const TIME_ZONE = "America/Sao_Paulo";
const SLOT_MINUTES = 30;
const WORK_START_HOUR = 9;
const WORK_END_HOUR = 18;
const MAX_LOOKAHEAD_DAYS = 30;

const DEFAULT_CALENDAR_ID =
  "c0bf22f3a88f970e8f729ddbebcd80a8b00a4ab00bd9bfffa50d3a2e458dc022@group.calendar.google.com";
const DEFAULT_ICS_URL =
  "https://calendar.google.com/calendar/ical/c0bf22f3a88f970e8f729ddbebcd80a8b00a4ab00bd9bfffa50d3a2e458dc022%40group.calendar.google.com/private-a9cc79fb2cc6a500336abd4e0f682227/basic.ics";

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID ?? DEFAULT_CALENDAR_ID;
const CALENDAR_ICS_URL = process.env.GOOGLE_CALENDAR_ICS_URL ?? DEFAULT_ICS_URL;

interface BusySlot {
  startUtc: Date;
  endUtc: Date;
}

interface AvailableSlotResponse {
  startUtc: string;
  endUtc: string;
  startInTimeZone: string;
  bookingUrl: string;
}

function stripSeconds(date: Date) {
  const cloned = new Date(date);
  cloned.setSeconds(0, 0);
  return cloned;
}

function alignToSlot(date: Date) {
  const stripped = stripSeconds(date);
  const minutes = stripped.getMinutes();
  const remainder = minutes % SLOT_MINUTES;
  if (remainder === 0) {
    return stripped;
  }
  return addMinutes(stripped, SLOT_MINUTES - remainder);
}

function moveToNextWorkday(date: Date) {
  let next = addDays(startOfDay(date), 1);
  while (isWeekend(next)) {
    next = addDays(next, 1);
  }
  return set(next, { hours: WORK_START_HOUR, minutes: 0, seconds: 0, milliseconds: 0 });
}

function ensureWithinWorkWindow(date: Date) {
  let candidate = stripSeconds(date);

  if (isWeekend(candidate)) {
    candidate = moveToNextWorkday(candidate);
  }

  const hour = candidate.getHours();
  if (hour >= WORK_END_HOUR) {
    candidate = moveToNextWorkday(candidate);
  } else if (hour < WORK_START_HOUR) {
    candidate = set(candidate, {
      hours: WORK_START_HOUR,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    });
  }

  return alignToSlot(candidate);
}

async function fetchBusySlots(): Promise<BusySlot[]> {
  if (!CALENDAR_ICS_URL) {
    throw new Error("GOOGLE_CALENDAR_ICS_URL is not configured");
  }

  const response = await fetch(CALENDAR_ICS_URL, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Falha ao carregar eventos do Google Calendar");
  }

  const rawCalendar = await response.text();
  const parsed = ical.parseICS(rawCalendar);

  return Object.values(parsed)
    .filter((event): event is ICalEvent & Required<Pick<ICalEvent, "start" | "end">> => {
      return event?.type === "VEVENT" && Boolean(event.start) && Boolean(event.end);
    })
    .map((event) => ({
      startUtc: new Date(event.start!),
      endUtc: new Date(event.end!),
    }))
    .sort((a, b) => a.startUtc.getTime() - b.startUtc.getTime());
}

function overlaps(slot: BusySlot, startUtc: Date, endUtc: Date) {
  return startUtc < slot.endUtc && endUtc > slot.startUtc;
}

function formatForGoogle(date: Date) {
  return formatInTimeZone(date, "UTC", "yyyyMMdd'T'HHmmss'Z'");
}

function buildBookingUrl(startUtc: Date, endUtc: Date) {
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("src", CALENDAR_ID);
  url.searchParams.set("ctz", TIME_ZONE);
  url.searchParams.set("text", "Consulta com FayaPoint");
  url.searchParams.set(
    "details",
    "Agendamento automático enviado pelo site da FayaPoint. Ajuste livremente o horário dentro da agenda.",
  );
  url.searchParams.set("dates", `${formatForGoogle(startUtc)}/${formatForGoogle(endUtc)}`);
  return url.toString();
}

export async function getNextAvailableSlot(): Promise<AvailableSlotResponse> {
  const busySlots = await fetchBusySlots();
  const nowLocal = toZonedTime(new Date(), TIME_ZONE);

  let candidateLocal = ensureWithinWorkWindow(nowLocal);
  const maxIterations = (MAX_LOOKAHEAD_DAYS * (WORK_END_HOUR - WORK_START_HOUR) * 60) / SLOT_MINUTES;

  for (let i = 0; i < maxIterations; i++) {
    const startUtc = fromZonedTime(candidateLocal, TIME_ZONE);
    const endUtc = addMinutes(startUtc, SLOT_MINUTES);

    const hasConflict = busySlots.some((slot) => overlaps(slot, startUtc, endUtc));

    if (!hasConflict) {
      return {
        startUtc: startUtc.toISOString(),
        endUtc: endUtc.toISOString(),
        startInTimeZone: formatInTimeZone(startUtc, TIME_ZONE, "EEEE, dd 'de' MMMM 'às' HH:mm"),
        bookingUrl: buildBookingUrl(startUtc, endUtc),
      };
    }

    candidateLocal = addMinutes(candidateLocal, SLOT_MINUTES);
    candidateLocal = ensureWithinWorkWindow(candidateLocal);
  }

  throw new Error("Não encontramos um horário disponível nas próximas semanas");
}
