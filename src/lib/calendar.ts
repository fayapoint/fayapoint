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

export interface BookingDetails {
  userName?: string;
  userEmail?: string;
  company?: string;
  source?: string;
  details?: string;
  cartItems?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  cartTotal?: number;
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

function buildBookingUrl(startUtc: Date, endUtc: Date, details?: BookingDetails) {
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("src", CALENDAR_ID);
  url.searchParams.set("ctz", TIME_ZONE);
  
  // Build event title with user name if available
  const eventTitle = details?.userName 
    ? `Consulta com ${details.userName} - FayAi`
    : "Consulta com FayAi";
  url.searchParams.set("text", eventTitle);
  
  // Build rich description with all available details
  const descriptionParts: string[] = [];
  
  descriptionParts.push("📅 Agendamento automático enviado pelo site da FayAi.");
  descriptionParts.push("");
  
  // User information
  if (details?.userName || details?.userEmail) {
    descriptionParts.push("👤 INFORMAÇÕES DO CLIENTE:");
    if (details.userName) descriptionParts.push(`   Nome: ${details.userName}`);
    if (details.userEmail) descriptionParts.push(`   Email: ${details.userEmail}`);
    if (details.company) descriptionParts.push(`   Empresa: ${details.company}`);
    descriptionParts.push("");
  }
  
  // Source/Origin
  if (details?.source) {
    const sourceLabels: Record<string, string> = {
      'video-editing': 'Página de Edição de Vídeo',
      'ai-automation': 'Página de Automação com IA',
      'web-development': 'Página de Desenvolvimento Web',
      'ai-training': 'Página de Treinamentos em IA',
      'contact-page': 'Página de Contato',
      'agenda-page': 'Página de Agendamento',
      'home-page': 'Página Inicial',
      'pricing-page': 'Página de Preços',
      'services-page': 'Página de Serviços',
    };
    const sourceLabel = sourceLabels[details.source] || details.source;
    descriptionParts.push(`📍 Origem: ${sourceLabel}`);
    descriptionParts.push("");
  }
  
  // Cart items
  if (details?.cartItems && details.cartItems.length > 0) {
    descriptionParts.push("🛒 ITENS NO CARRINHO:");
    details.cartItems.forEach(item => {
      const priceFormatted = new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }).format(item.price * item.quantity);
      descriptionParts.push(`   • ${item.name} (x${item.quantity}) - ${priceFormatted}`);
    });
    if (details.cartTotal) {
      const totalFormatted = new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }).format(details.cartTotal);
      descriptionParts.push(`   💰 Total: ${totalFormatted}`);
    }
    descriptionParts.push("");
  }
  
  // Additional details/message
  if (details?.details) {
    descriptionParts.push("💬 MENSAGEM DO CLIENTE:");
    descriptionParts.push(`   ${details.details}`);
    descriptionParts.push("");
  }
  
  descriptionParts.push("---");
  descriptionParts.push("Ajuste livremente o horário dentro da agenda se necessário.");
  
  url.searchParams.set("details", descriptionParts.join("\n"));
  url.searchParams.set("dates", `${formatForGoogle(startUtc)}/${formatForGoogle(endUtc)}`);
  
  // Add guest email if available
  if (details?.userEmail) {
    url.searchParams.set("add", details.userEmail);
  }
  
  return url.toString();
}

export async function getNextAvailableSlot(bookingDetails?: BookingDetails): Promise<AvailableSlotResponse> {
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
        bookingUrl: buildBookingUrl(startUtc, endUtc, bookingDetails),
      };
    }

    candidateLocal = addMinutes(candidateLocal, SLOT_MINUTES);
    candidateLocal = ensureWithinWorkWindow(candidateLocal);
  }

  throw new Error("Não encontramos um horário disponível nas próximas semanas");
}
