export type UtmData = Record<string, string | undefined>;

export type AttributionState = {
  firstTouch: UtmData;
  lastTouch: UtmData;
  firstLandingUrl?: string;
  lastLandingUrl?: string;
  referrer?: string;
  updatedAt?: string;
  /**
   * O código de fundador que trouxe esta pessoa — programa Fundadores,
   * 06/09/2026. Ver `autoresearch/PLANO_FUNDADORES_2026-09-05.md`.
   *
   * Mora aqui, e não num cookie próprio, porque a janela de atribuição que o
   * programa precisa (90 dias) é EXATAMENTE a que este arquivo já mantinha,
   * com o mesmo triplo de armazenamento (localStorage, sessionStorage e
   * cookie). Cookie novo seria uma segunda janela para envelhecer sozinha.
   *
   * ⚠️ **Só o PRIMEIRO código fica.** Quem chegou pelo link de alguém e depois
   * clicou no link de outro não troca de indicador no meio do caminho — a
   * comissão é de quem trouxe. É a mesma regra do índice único em
   * `Indicacao.indicadoUserId`, aqui na ponta do navegador.
   */
  ref?: string;
  refEm?: string;
};

const STORAGE_KEY = "fayai_attribution_v1";
const COOKIE_KEY = "fayai_attribution_v1";
const COOKIE_MAX_AGE_DAYS = 90;

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

function safeJsonParse(raw: string | null): AttributionState | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AttributionState;
  } catch {
    return null;
  }
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";");
  for (const part of parts) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) {
      return rest.join("=") || "";
    }
  }
  return null;
}

function setCookie(name: string, value: string, maxAgeDays: number) {
  if (typeof document === "undefined") return;
  const maxAgeSeconds = Math.floor(maxAgeDays * 24 * 60 * 60);
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  const cookie = [
    `${name}=${value}`,
    `Path=/`,
    `Max-Age=${maxAgeSeconds}`,
    `SameSite=Lax`,
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");

  document.cookie = cookie;
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
    const parsed = safeJsonParse(raw);
    if (parsed) return parsed;
  } catch {
    // ignore
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = safeJsonParse(raw);
    if (parsed) {
      writeAttribution(parsed);
      return parsed;
    }
  } catch {
    // ignore
  }

  try {
    const raw = getCookie(COOKIE_KEY);
    const decoded = raw ? decodeURIComponent(raw) : null;
    const parsed = safeJsonParse(decoded);
    if (parsed) {
      writeAttribution(parsed);
      return parsed;
    }
  } catch {
    // ignore
  }

  return null;
}

export function writeAttribution(state: AttributionState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }

  try {
    setCookie(COOKIE_KEY, encodeURIComponent(JSON.stringify(state)), COOKIE_MAX_AGE_DAYS);
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

  // O código de indicação: `?ref=` na URL, ou a própria rota `/f/<codigo>`.
  // Grava só se ainda não houver um — ver o comentário em `AttributionState`.
  if (!next.ref) {
    const codigo = lerCodigoDeIndicacao(href);
    if (codigo) {
      next.ref = codigo;
      next.refEm = now;
    }
  }

  next.updatedAt = now;
  writeAttribution(next);
}

/**
 * Acha o código de indicação numa URL: `?ref=ricardo` ou `/f/ricardo`.
 *
 * A normalização é a MESMA de `lib/fundadores.ts` (minúsculo, sem acento, só
 * letra/número/hífen) — o código que o navegador guarda tem de ser byte a byte
 * o que está no banco, senão o vínculo não casa e ninguém entende por quê.
 */
export function lerCodigoDeIndicacao(urlString: string): string | undefined {
  try {
    const u = new URL(urlString);
    const bruto = u.searchParams.get("ref") || u.pathname.match(/\/f\/([^/?#]+)/)?.[1] || "";
    const limpo = decodeURIComponent(bruto)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 24);
    return limpo.length >= 3 ? limpo : undefined;
  } catch {
    return undefined;
  }
}

/** O código guardado, para o cadastro mandar junto. */
export function lerRefGuardado(): string | undefined {
  return readAttribution()?.ref;
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
