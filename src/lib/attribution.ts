export type UtmData = Record<string, string | undefined>;

export type AttributionState = {
  firstTouch: UtmData;
  lastTouch: UtmData;
  firstLandingUrl?: string;
  lastLandingUrl?: string;
  referrer?: string;
  updatedAt?: string;
};

const STORAGE_KEY = "fayai_attribution_v1";

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

function hasAnyUtm(utm: UtmData) {
  return UTM_KEYS.some((k) => Boolean(utm[k]));
}

export function parseUtmFromUrl(urlString: string): UtmData {
  try {
    const u = new URL(urlString);
    const utm: UtmData = {};
    for (const k of UTM_KEYS) {
      utm[k] = u.searchParams.get(k) ?? undefined;
    }
    return utm;
  } catch {
    return {};
  }
}

export function readAttribution(): AttributionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AttributionState;
  } catch {
    return null;
  }
}

export function writeAttribution(state: AttributionState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function updateAttributionFromLocation(params?: {
  href?: string;
  referrer?: string;
}) {
  if (typeof window === "undefined") return;

  const href = params?.href ?? window.location.href;
  const referrer = params?.referrer ?? document.referrer;

  const existing = readAttribution();
  const utm = parseUtmFromUrl(href);

  const now = new Date().toISOString();

  const next: AttributionState = existing ?? {
    firstTouch: {},
    lastTouch: {},
  };

  if (!next.firstLandingUrl) {
    next.firstLandingUrl = href;
  }

  next.lastLandingUrl = href;

  if (referrer && !next.referrer) {
    next.referrer = referrer;
  }

  if (hasAnyUtm(utm)) {
    if (!hasAnyUtm(next.firstTouch)) {
      next.firstTouch = utm;
    }
    next.lastTouch = utm;
  }

  next.updatedAt = now;
  writeAttribution(next);
}

export function getAttributionUtmPayload(): UtmData {
  const state = readAttribution();
  const first = state?.firstTouch ?? {};
  const last = state?.lastTouch ?? {};

  const payload: UtmData = {
    utm_source: last.utm_source ?? undefined,
    utm_medium: last.utm_medium ?? undefined,
    utm_campaign: last.utm_campaign ?? undefined,
    utm_content: last.utm_content ?? undefined,
    utm_term: last.utm_term ?? undefined,

    ft_utm_source: first.utm_source ?? undefined,
    ft_utm_medium: first.utm_medium ?? undefined,
    ft_utm_campaign: first.utm_campaign ?? undefined,
    ft_utm_content: first.utm_content ?? undefined,
    ft_utm_term: first.utm_term ?? undefined,

    first_landing_url: state?.firstLandingUrl,
    last_landing_url: state?.lastLandingUrl,
    initial_referrer: state?.referrer,
  };

  return payload;
}
