"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  Trophy,
  CalendarRange,
  Swords,
  Globe,
  Zap,
  Loader2,
  Plus,
  Users,
  ChevronRight,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import type { CopyCampeonato } from "@/lib/game/copy-campeonato";
import { PRESETS, type PresetCompeticao } from "@/lib/game/campeonato";
import { LIMA, OURO, CIANO, VIOLETA, ROSA, FUNDO, bebas, superficie } from "@/lib/game/tema";

/**
 * A VITRINE DE CAMPEONATOS — a porta da área de competição.
 *
 * A criação é o ponto onde a maioria das ferramentas de campeonato perde
 * gente: elas abrem um formulário com quinze campos (formato, turnos, pontos
 * por vitória, critérios de desempate, número de grupos…) e quem só queria
 * marcar uma copa entre amigos desiste ali.
 *
 * Aqui a criação é **um cartão e um nome**. Os presets carregam todas as
 * quinze decisões; "Ajustar detalhes" abre os campos para quem quiser. O
 * preset não é uma cerca — é o ponto de partida.
 */

const ICONES: Record<string, LucideIcon> = {
  Trophy,
  CalendarRange,
  Swords,
  Globe,
  Zap,
};

/** Uma cor por preset, na ordem. Cor de categoria (§2), nunca ouro decorativo. */
const CORES = [LIMA, CIANO, VIOLETA, ROSA, OURO];

interface CompeticaoResumo {
  _id: string;
  slug: string;
  nome: string;
  descricao?: string;
  formato: string;
  status: string;
  vagas: number;
  inscritos: number;
}

export function VitrineCampeonatos({ copy }: { copy: CopyCampeonato }) {
  const [lista, setLista] = useState<CompeticaoResumo[] | null | "erro">(null);
  const [criando, setCriando] = useState<PresetCompeticao | null>(null);

  useEffect(() => {
    fetch("/api/game/campeonato")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => setLista(Array.isArray(d.competicoes) ? d.competicoes : []))
      .catch(() => setLista("erro"));
  }, []);

  const c = copy.hub;

  return (
    <section id="campeonatos" className="scroll-mt-24">
      <h2 className="text-2xl sm:text-3xl" style={bebas}>
        {c.title.toUpperCase()}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/60">{c.subtitle}</p>

      {/* ---------------- Presets ---------------- */}
      <p className="mt-8 text-[10px] font-extrabold uppercase tracking-widest text-white/45">
        {copy.novo.pickPreset}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PRESETS.map((p, i) => {
          const Icone = ICONES[p.icone] ?? Trophy;
          const cor = CORES[i % CORES.length];
          const texto = copy.presets[p.id];
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setCriando(p)}
              className="group flex gap-3.5 rounded-2xl border p-4 text-left transition-transform hover:-translate-y-0.5"
              style={superficie(cor)}
            >
              <span
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${cor}1a`, border: `1px solid ${cor}44` }}
              >
                <Icone className="h-5 w-5" style={{ color: cor }} />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="truncate font-bold text-white">{texto?.nome ?? p.id}</span>
                  <span
                    className="shrink-0 rounded px-1.5 py-px text-[10px] font-black"
                    style={{ background: `${cor}1f`, color: cor }}
                  >
                    {p.vagas}
                  </span>
                </span>
                <span className="mt-1 block text-[12.5px] leading-relaxed text-white/60">
                  {texto?.texto ?? ""}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {criando && (
        <FormularioCampeonato
          preset={criando}
          copy={copy}
          aoFechar={() => setCriando(null)}
        />
      )}

      {/* ---------------- Campeonatos existentes ---------------- */}
      <div className="mt-10">
        {lista === null && (
          <p className="flex items-center gap-2 py-8 text-sm text-white/50">
            <Loader2 size={15} className="animate-spin" />
            {c.loading}
          </p>
        )}
        {lista === "erro" && <p className="py-8 text-sm text-white/55">{c.error}</p>}
        {Array.isArray(lista) && lista.length === 0 && (
          <p className="rounded-2xl border border-dashed border-white/12 px-5 py-10 text-center text-sm text-white/55">
            {c.empty}
          </p>
        )}
        {Array.isArray(lista) && lista.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {lista.map((comp) => (
              <Link
                key={comp._id}
                href={`/game/campeonato/${comp.slug}`}
                className="group flex items-center gap-4 rounded-2xl border px-4 py-3.5 transition-transform hover:-translate-y-0.5"
                style={superficie(LIMA)}
              >
                <span
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${LIMA}1a`, border: `1px solid ${LIMA}3a` }}
                >
                  <Trophy className="h-5 w-5" style={{ color: LIMA }} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="truncate font-bold text-white">{comp.nome}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-white/45">
                    <span
                      className="rounded px-1.5 py-px"
                      style={{
                        background: comp.status === "encerrada" ? `${OURO}1f` : `${LIMA}1a`,
                        color: comp.status === "encerrada" ? OURO : LIMA,
                      }}
                    >
                      {copy.status[comp.status] ?? comp.status}
                    </span>
                    <span aria-hidden>·</span>
                    <span>{copy.novo.formats[comp.formato] ?? comp.formato}</span>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Users size={11} />
                      {comp.inscritos}/{comp.vagas}
                    </span>
                  </span>
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                  style={{ color: LIMA }}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * O formulário. Ele nasce com o preset já respondido — só o NOME é obrigatório.
 * Os detalhes ficam atrás de um botão porque, na primeira vez, ninguém quer
 * decidir critério de desempate; na décima, quem organiza quer.
 */
function FormularioCampeonato({
  preset,
  copy,
  aoFechar,
}: {
  preset: PresetCompeticao;
  copy: CopyCampeonato;
  aoFechar: () => void;
}) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [vagas, setVagas] = useState(preset.vagas);
  const [turnos, setTurnos] = useState<1 | 2>(preset.regras.turnos);
  const [plataforma, setPlataforma] = useState("common-gen5");
  const [detalhes, setDetalhes] = useState(false);
  const [estado, setEstado] = useState<"idle" | "enviando" | "login" | "erro">("idle");
  const [erro, setErro] = useState<string | null>(null);

  const texto = copy.presets[preset.id];

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (nome.trim().length < 3 || estado === "enviando") return;
    setEstado("enviando");
    setErro(null);
    const res = await fetch("/api/game/campeonato", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        preset: preset.id,
        formato: preset.formato,
        plataforma,
        vagas,
        regras: { ...preset.regras, turnos },
      }),
    }).catch(() => null);

    if (res?.ok) {
      const d = await res.json();
      // Navegação dura de propósito: a página do campeonato carrega tudo do
      // servidor, e voltar para a vitrine depois de criar não ajuda ninguém.
      window.location.href = `/game/campeonato/${d.slug}`;
      return;
    }
    if (res?.status === 401) return setEstado("login");
    setErro((await res?.json().catch(() => null))?.error ?? null);
    setEstado("erro");
  }

  return (
    <form
      onSubmit={criar}
      className="mt-4 rounded-3xl border p-5 sm:p-6"
      style={superficie(LIMA, "forte")}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-xl sm:text-2xl" style={bebas}>
          {copy.novo.title.toUpperCase()}
        </h3>
        <span className="text-[12px] font-bold" style={{ color: LIMA }}>
          {texto?.nome ?? preset.id}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/45">
            {copy.novo.name}
          </span>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder={copy.novo.namePlaceholder}
            maxLength={80}
            autoFocus
            className="mt-1 w-full rounded-xl border border-white/12 bg-white/[0.06] px-3.5 py-3 text-white outline-none transition-colors placeholder:text-white/40 focus:border-white/30"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/45">
            {copy.novo.description}
          </span>
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder={copy.novo.descriptionPlaceholder}
            maxLength={200}
            className="mt-1 w-full rounded-xl border border-white/12 bg-white/[0.06] px-3.5 py-3 text-white outline-none transition-colors placeholder:text-white/40 focus:border-white/30"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => setDetalhes((v) => !v)}
        className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-bold transition-colors hover:text-white"
        style={{ color: detalhes ? LIMA : "rgba(255,255,255,.55)" }}
      >
        <Settings2 size={13} />
        {copy.novo.customize}
      </button>

      {detalhes && (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/45">
              {copy.novo.slots}
            </span>
            <input
              type="number"
              min={2}
              max={64}
              value={vagas}
              onChange={(e) => setVagas(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-white/12 bg-white/[0.06] px-3.5 py-2.5 tabular-nums text-white outline-none focus:border-white/30"
            />
          </label>
          {preset.formato !== "mata-mata" && (
            <label className="block">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/45">
                {copy.novo.turns}
              </span>
              <select
                value={turnos}
                onChange={(e) => setTurnos(Number(e.target.value) === 2 ? 2 : 1)}
                className="mt-1 w-full rounded-xl border border-white/12 bg-white/[0.06] px-3.5 py-2.5 text-white outline-none focus:border-white/30"
              >
                <option value={1} style={{ color: "#000" }}>
                  {copy.novo.turnsSingle}
                </option>
                <option value={2} style={{ color: "#000" }}>
                  {copy.novo.turnsDouble}
                </option>
              </select>
            </label>
          )}
          <label className="block">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/45">
              {copy.novo.platform}
            </span>
            <select
              value={plataforma}
              onChange={(e) => setPlataforma(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/12 bg-white/[0.06] px-3.5 py-2.5 text-white outline-none focus:border-white/30"
            >
              <option value="common-gen5" style={{ color: "#000" }}>
                PS5 · Series · PC
              </option>
              <option value="common-gen4" style={{ color: "#000" }}>
                PS4 · Xbox One
              </option>
              <option value="mista" style={{ color: "#000" }}>
                Mista
              </option>
            </select>
          </label>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={nome.trim().length < 3 || estado === "enviando"}
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-transform disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:-translate-y-0.5"
          style={{ background: LIMA, color: FUNDO }}
        >
          {estado === "enviando" ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Plus size={15} />
          )}
          {estado === "enviando" ? copy.hub.creating : copy.novo.submit}
        </button>
        <button
          type="button"
          onClick={aoFechar}
          className="text-sm font-semibold text-white/50 transition-colors hover:text-white"
        >
          {copy.novo.cancel}
        </button>
        {estado === "login" && (
          <Link href="/login" className="text-[12.5px] font-bold" style={{ color: OURO }}>
            {copy.hub.loginToCreate}
          </Link>
        )}
        {estado === "erro" && erro && (
          <span className="text-[12.5px] font-semibold text-rose-300">{erro}</span>
        )}
      </div>
    </form>
  );
}
