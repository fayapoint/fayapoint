import { Award, ShieldCheck, Sparkles } from "lucide-react";

type CertificateArtworkProps = {
  courseSlug: string;
  courseTitle: string;
  studentName: string;
  certificateNumber: string;
  issuedAt?: string;
  compact?: boolean;
};

type CertificateTheme = {
  label: string;
  accent: string;
  accentSoft: string;
  glow: string;
};

const THEMES: Array<{ match: RegExp; theme: CertificateTheme }> = [
  { match: /chatgpt|openai/i, theme: { label: "CHATGPT", accent: "#38d9a9", accentSoft: "#0d9488", glow: "56,217,169" } },
  { match: /claude/i, theme: { label: "CLAUDE", accent: "#fb923c", accentSoft: "#c2410c", glow: "251,146,60" } },
  { match: /gemini|google/i, theme: { label: "GEMINI", accent: "#60a5fa", accentSoft: "#7c3aed", glow: "96,165,250" } },
  { match: /midjourney/i, theme: { label: "MIDJOURNEY", accent: "#e879f9", accentSoft: "#9333ea", glow: "232,121,249" } },
  { match: /leonardo/i, theme: { label: "LEONARDO AI", accent: "#f472b6", accentSoft: "#db2777", glow: "244,114,182" } },
  { match: /n8n/i, theme: { label: "N8N", accent: "#fb7185", accentSoft: "#e11d48", glow: "251,113,133" } },
  { match: /make|automa/i, theme: { label: "AUTOMAÇÃO", accent: "#a3e635", accentSoft: "#4d7c0f", glow: "163,230,53" } },
  { match: /perplexity|pesquisa/i, theme: { label: "PESQUISA IA", accent: "#22d3ee", accentSoft: "#0891b2", glow: "34,211,238" } },
  { match: /prompt/i, theme: { label: "PROMPT DESIGN", accent: "#c084fc", accentSoft: "#7e22ce", glow: "192,132,252" } },
  { match: /agente|agent/i, theme: { label: "AGENTES DE IA", accent: "#f0abfc", accentSoft: "#a21caf", glow: "240,171,252" } },
];

function getTheme(courseSlug: string, courseTitle: string): CertificateTheme {
  const source = `${courseSlug} ${courseTitle}`;
  return THEMES.find(({ match }) => match.test(source))?.theme ?? {
    label: "INTELIGÊNCIA ARTIFICIAL",
    accent: "#f5c04e",
    accentSoft: "#b7791f",
    glow: "245,192,78",
  };
}

function shortDate(value?: string) {
  if (!value) return "CONCLUSÃO VERIFICADA";
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" })
    .format(new Date(value))
    .toLocaleUpperCase("pt-BR");
}

export function CertificateArtwork({
  courseSlug,
  courseTitle,
  studentName,
  certificateNumber,
  issuedAt,
  compact = false,
}: CertificateArtworkProps) {
  const theme = getTheme(courseSlug, courseTitle);

  return (
    <div
      className={`relative isolate overflow-hidden rounded-[1.4rem] border bg-[#090b18] ${compact ? "aspect-[16/9]" : "aspect-[16/10]"}`}
      style={{
        borderColor: `rgba(${theme.glow}, .36)`,
        boxShadow: `0 24px 80px rgba(${theme.glow}, .16), inset 0 0 60px rgba(${theme.glow}, .06)`,
      }}
      aria-label={`Certificado de ${studentName} no curso ${courseTitle}`}
    >
      <div
        className="absolute inset-0 -z-30 bg-cover bg-center opacity-30 mix-blend-luminosity"
        style={{ backgroundImage: "url('/portal/trail/certificado.webp')" }}
      />
      <div
        className="absolute inset-0 -z-20"
        style={{
          background: `radial-gradient(circle at 14% 18%, rgba(${theme.glow}, .34), transparent 34%), radial-gradient(circle at 86% 82%, rgba(${theme.glow}, .19), transparent 28%), linear-gradient(125deg, rgba(5,7,18,.66), rgba(9,11,24,.94) 57%, rgba(5,7,18,.82))`,
        }}
      />
      <div className="absolute inset-3 rounded-[1rem] border border-white/10" />
      <div className="absolute inset-5 rounded-[.75rem] border border-white/[0.05]" />

      <div className="absolute -left-16 top-1/2 h-48 w-48 -translate-y-1/2 rotate-45 border border-white/10" />
      <div className="absolute -right-16 top-1/2 h-48 w-48 -translate-y-1/2 rotate-45 border border-white/10" />
      <Sparkles className="absolute left-6 top-6 h-4 w-4 text-white/35" />
      <Sparkles className="absolute bottom-6 right-6 h-4 w-4 text-white/25" />

      <div className={`relative z-10 flex h-full flex-col items-center justify-between text-center ${compact ? "p-5 sm:p-7" : "p-7 sm:p-10"}`}>
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-left">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg border"
              style={{ color: theme.accent, borderColor: `rgba(${theme.glow}, .38)`, backgroundColor: `rgba(${theme.glow}, .12)` }}
            >
              <Award className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[9px] font-black tracking-[.28em] text-white">FAYAI</p>
              <p className="text-[7px] tracking-[.2em] text-white/40">ACADEMY</p>
            </div>
          </div>
          <span
            className="rounded-full border px-2.5 py-1 text-[7px] font-bold tracking-[.18em]"
            style={{ color: theme.accent, borderColor: `rgba(${theme.glow}, .34)`, backgroundColor: `rgba(${theme.glow}, .09)` }}
          >
            {theme.label}
          </span>
        </div>

        <div className="max-w-[88%]">
          <p className="mb-2 text-[7px] font-semibold tracking-[.34em] text-white/40 sm:text-[9px]">CERTIFICADO DE CONCLUSÃO</p>
          <h3 className={`${compact ? "text-xl sm:text-3xl" : "text-2xl sm:text-4xl"} font-black leading-none tracking-tight text-white`}>
            {studentName}
          </h3>
          <div className="mx-auto my-3 h-px w-20" style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)` }} />
          <p className="line-clamp-2 text-[10px] font-semibold leading-snug text-white/75 sm:text-sm">{courseTitle}</p>
        </div>

        <div className="flex w-full items-end justify-between gap-4 text-left">
          <div>
            <p className="text-[6px] tracking-[.18em] text-white/30 sm:text-[7px]">EMITIDO EM</p>
            <p className="mt-1 text-[7px] font-semibold text-white/65 sm:text-[9px]">{shortDate(issuedAt)}</p>
          </div>
          <div className="flex items-center gap-2 text-right">
            <div>
              <p className="text-[6px] tracking-[.18em] text-white/30 sm:text-[7px]">REGISTRO DIGITAL</p>
              <p className="mt-1 font-mono text-[7px] font-semibold sm:text-[9px]" style={{ color: theme.accent }}>{certificateNumber}</p>
            </div>
            <ShieldCheck className="h-5 w-5" style={{ color: theme.accent }} />
          </div>
        </div>
      </div>
    </div>
  );
}

