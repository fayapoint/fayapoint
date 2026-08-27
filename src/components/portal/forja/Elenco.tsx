"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  Users,
  Wand2,
  X,
} from "lucide-react";
import { useT } from "@/i18n/dicionario";
import { getClientAuthHeaders } from "@/lib/client-auth";

/**
 * ⚠️ `<img>` e não `next/image`, e a razão é do repositório inteiro.
 *
 * As referências e as artes moram no Cloudinary, e o `next.config.ts` **não
 * declara `images.remotePatterns`**. `next/image` recusa host não declarado — e
 * aqui o sintoma nem foi o buraco silencioso que a Vitrine do Ateliê levou: foi
 * "Application error: a client-side exception", a tela inteira branca, na
 * primeira vez que um personagem tinha foto. Ver o cabeçalho de
 * `AtelieVitrine.tsx`.
 */

/**
 * O ELENCO — as fichas de personagem.
 *
 * ## Por que uma ficha, e não "manda a foto e pronto"
 *
 * O gerador não guarda memória entre chamadas. Se o quadro 1 diz "homem de
 * barba" e o quadro 4 diz "o criador", saem duas pessoas diferentes e o Reel
 * inteiro se perde. A ficha é o que transforma "o criador" numa frase que o
 * gerador entende do mesmo jeito toda vez — e a foto é o que ancora o rosto que
 * a frase descreve.
 *
 * ## A direção que importa: do personagem PARA a persona
 *
 * O construtor de persona pergunta "quem é o seu público?" e recebe um
 * parágrafo genérico, porque a pergunta é abstrata. Desenhar o cliente — que
 * idade, o que veste, o que ele diz quando não vai comprar — é a mesma pergunta
 * em forma concreta. Por isso o botão "mandar para o meu perfil" existe, e por
 * isso ele é explícito: o modelo propõe, a pessoa confirma.
 */

interface Opcao {
  valor: string;
  rotulo: string;
}

export interface Personagem {
  _id: string;
  origem: "criador" | "publico" | "elenco";
  nome: string;
  papel?: string;
  resumo?: string;
  aparencia: Record<string, unknown>;
  figurinos: Array<{ id: string; nome: string; descricao: string; en?: string; padrao?: boolean }>;
  psicologia?: Record<string, string>;
  referencias?: string[];
  caderno?: { imagens?: string[]; status?: string };
  prontidao?: { percentual: number; faltando: Array<{ campo: string; pergunta: string; destrava: string }> };
}

type Opcoes = Record<string, Opcao[]>;

const CAMPOS: Array<{ chave: string; rotulo: string; lista: string }> = [
  { chave: "genero", rotulo: "Como retratar", lista: "GENERO_APARENTE" },
  { chave: "pele", rotulo: "Pele", lista: "PELE" },
  { chave: "cabeloEstilo", rotulo: "Cabelo", lista: "CABELO_ESTILO" },
  { chave: "cabeloCor", rotulo: "Cor do cabelo", lista: "CABELO_COR" },
  { chave: "barba", rotulo: "Barba", lista: "BARBA" },
  { chave: "olhos", rotulo: "Olhos", lista: "OLHOS" },
  { chave: "corpo", rotulo: "Corpo", lista: "CORPO" },
];

const ROTULO_ORIGEM: Record<string, string> = {
  criador: "Você",
  publico: "Cliente típico",
  elenco: "Elenco",
};

export default function Elenco({ aoMudarFila }: { aoMudarFila: () => void }) {
  const T = useT();
  const [personagens, setPersonagens] = useState<Personagem[]>([]);
  const [opcoes, setOpcoes] = useState<Opcoes>({});
  const [abertoId, setAbertoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState("");
  const [erro, setErro] = useState("");
  const [recado, setRecado] = useState("");

  const carregar = useCallback(async () => {
    try {
      const r = await fetch("/api/forja/personagens", { headers: getClientAuthHeaders() });
      if (!r.ok) return;
      const d = await r.json();
      setPersonagens(d.personagens || []);
      setOpcoes(d.opcoes || {});
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const aberto = personagens.find((p) => p._id === abertoId) || null;

  async function criar(origem: "publico" | "elenco") {
    setOcupado("criar");
    setErro("");
    try {
      const r = await fetch("/api/forja/personagens", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ origem, comIa: origem === "publico" }),
      });
      const d = await r.json();
      if (!r.ok) {
        setErro(d.error || T("Não deu para criar."));
        return;
      }
      await carregar();
      setAbertoId(d.personagem._id);
    } finally {
      setOcupado("");
    }
  }

  async function salvar(id: string, campos: Record<string, unknown>, extra: Record<string, unknown> = {}) {
    const r = await fetch("/api/forja/personagens", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
      body: JSON.stringify({ id, campos, ...extra }),
    });
    const d = await r.json();
    if (r.ok) {
      setPersonagens((antes) => antes.map((p) => (p._id === id ? d.personagem : p)));
      if (Array.isArray(d.foiParaPersona) && d.foiParaPersona.length) {
        setRecado(
          `${T("Fui ao seu perfil e atualizei")}: ${d.foiParaPersona.map((c: string) => c.split(".").pop()).join(", ")}.`,
        );
      }
    }
    return d;
  }

  async function apagar(id: string) {
    const r = await fetch(`/api/forja/personagens?id=${id}`, { method: "DELETE", headers: getClientAuthHeaders() });
    const d = await r.json();
    if (!r.ok) {
      setErro(d.error || T("Não deu para apagar."));
      return;
    }
    setAbertoId(null);
    carregar();
  }

  async function gerarCaderno(id: string) {
    setOcupado(`caderno-${id}`);
    setErro("");
    try {
      const r = await fetch("/api/forja/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ alvo: "caderno", personagemId: id }),
      });
      const d = await r.json();
      if (!r.ok) {
        setErro(d.error || T("Não deu para pedir o caderno."));
        return;
      }
      aoMudarFila();
      carregar();
    } finally {
      setOcupado("");
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> {T("Carregando o elenco…")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-indigo-400" /> {T("Quem aparece nas suas peças")}
            </h2>
            <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-slate-500">
              {T(
                "O gerador esquece entre uma imagem e a outra. A ficha é o que faz o mesmo rosto atravessar os cinco quadros — e a foto é o que faz esse rosto ser o seu.",
              )}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => criar("publico")}
              disabled={!!ocupado}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-[11px] font-medium text-indigo-300 transition hover:bg-indigo-500/20 disabled:opacity-50"
            >
              {ocupado === "criar" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              {T("Cliente típico")}
            </button>
            <button
              onClick={() => criar("elenco")}
              disabled={!!ocupado}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
            >
              <Plus className="h-3 w-3" /> {T("Personagem")}
            </button>
          </div>
        </div>

        {erro && <p className="mt-3 rounded-lg bg-rose-500/10 p-2 text-[11px] text-rose-300">{erro}</p>}
        {recado && (
          <p className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 p-2 text-[11px] text-emerald-300">
            <Check className="h-3 w-3" /> {recado}
          </p>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {personagens.map((p) => (
            <CartaoDePersonagem
              key={p._id}
              p={p}
              aberto={p._id === abertoId}
              aoAbrir={() => setAbertoId(p._id === abertoId ? null : p._id)}
            />
          ))}
        </div>
      </div>

      {aberto && (
        <Ficha
          key={aberto._id}
          p={aberto}
          opcoes={opcoes}
          ocupado={ocupado}
          aoSalvar={salvar}
          aoApagar={apagar}
          aoGerarCaderno={gerarCaderno}
          aoRecarregar={carregar}
          aoFechar={() => setAbertoId(null)}
        />
      )}
    </div>
  );
}

function CartaoDePersonagem({ p, aberto, aoAbrir }: { p: Personagem; aberto: boolean; aoAbrir: () => void }) {
  const T = useT();
  const rosto = p.caderno?.imagens?.[0] || p.referencias?.[0] || "";
  const pronto = p.prontidao?.percentual ?? 0;

  return (
    <button
      onClick={aoAbrir}
      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition ${
        aberto ? "border-indigo-500/50 bg-indigo-500/5" : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
      }`}
    >
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-slate-800">
        {rosto ? (
          <img src={rosto} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <UserRound className="absolute inset-0 m-auto h-5 w-5 text-slate-600" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold">{p.nome}</p>
        <p className="truncate text-[10px] text-slate-500">{p.papel || T(ROTULO_ORIGEM[p.origem])}</p>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-all ${pronto >= 70 ? "bg-emerald-500" : pronto >= 40 ? "bg-amber-500" : "bg-rose-500"}`}
            style={{ width: `${pronto}%` }}
          />
        </div>
      </div>
      <span className="shrink-0 text-[10px] tabular-nums text-slate-600">{pronto}%</span>
    </button>
  );
}

function Ficha({
  p,
  opcoes,
  ocupado,
  aoSalvar,
  aoApagar,
  aoGerarCaderno,
  aoRecarregar,
  aoFechar,
}: {
  p: Personagem;
  opcoes: Opcoes;
  ocupado: string;
  aoSalvar: (id: string, campos: Record<string, unknown>, extra?: Record<string, unknown>) => Promise<unknown>;
  aoApagar: (id: string) => void;
  aoGerarCaderno: (id: string) => void;
  aoRecarregar: () => void;
  aoFechar: () => void;
}) {
  const T = useT();
  const [nome, setNome] = useState(p.nome);
  const [papel, setPapel] = useState(p.papel || "");
  const [livre, setLivre] = useState(String(p.aparencia?.descricaoLivre || ""));
  const [figurino, setFigurino] = useState(p.figurinos?.[0]?.descricao || "");
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const arquivoRef = useRef<HTMLInputElement>(null);

  const semFoto = !(p.referencias || []).length;

  async function gravar(extra: Record<string, unknown> = {}) {
    setSalvando(true);
    try {
      await aoSalvar(
        p._id,
        {
          nome,
          papel,
          aparencia: { ...p.aparencia, descricaoLivre: livre },
          figurinos: figurino
            ? [{ id: p.figurinos?.[0]?.id || "f1", nome: T("Do dia a dia"), descricao: figurino, padrao: true }]
            : [],
        },
        extra,
      );
    } finally {
      setSalvando(false);
    }
  }

  async function enviarFoto(arquivo: File) {
    setEnviando(true);
    try {
      const form = new FormData();
      form.append("arquivo", arquivo);
      form.append("personagemId", p._id);
      await fetch("/api/forja/foto", { method: "POST", headers: getClientAuthHeaders(), body: form });
      aoRecarregar();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-slate-900/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{T("Ficha")}</h3>
          <p className="text-[10px] text-slate-500">{T(ROTULO_ORIGEM[p.origem])}</p>
        </div>
        <button onClick={aoFechar} className="rounded p-1 text-slate-600 hover:bg-slate-800 hover:text-slate-300">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── as fotos: o que ancora o rosto ─────────────────────────── */}
      <div className="mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{T("Fotos de referência")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(p.referencias || []).map((url) => (
            <div key={url} className="group relative h-16 w-16 overflow-hidden rounded-lg border border-slate-800">
              <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <button
                onClick={async () => {
                  await fetch(`/api/forja/foto?personagemId=${p._id}&url=${encodeURIComponent(url)}`, {
                    method: "DELETE",
                    headers: getClientAuthHeaders(),
                  });
                  aoRecarregar();
                }}
                className="absolute inset-0 flex items-center justify-center bg-slate-950/70 opacity-0 transition group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-400" />
              </button>
            </div>
          ))}
          <button
            onClick={() => arquivoRef.current?.click()}
            disabled={enviando}
            className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-700 text-[9px] text-slate-500 transition hover:border-indigo-500/50 hover:text-indigo-400"
          >
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {T("Enviar")}
          </button>
          <input
            ref={arquivoRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) enviarFoto(f);
              e.target.value = "";
            }}
          />
        </div>
        {semFoto && (
          <p className="mt-2 text-[10px] leading-relaxed text-amber-300/80">
            {T(
              "Sem foto, o gerador desenha alguém parecido com a descrição — nunca esta pessoa. Uma foto de rosto resolve para sempre.",
            )}
          </p>
        )}
      </div>

      {/* ── o caderno ──────────────────────────────────────────────── */}
      <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold">
              <Camera className="h-3.5 w-3.5 text-indigo-400" /> {T("Caderno de personagem")}
            </p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">
              {T("Quatro ângulos do mesmo rosto. É o insumo que faz a cara sobreviver a vinte imagens — e não custa crédito.")}
            </p>
          </div>
          <button
            onClick={() => aoGerarCaderno(p._id)}
            disabled={semFoto || ocupado === `caderno-${p._id}`}
            className="shrink-0 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-[11px] font-medium text-indigo-300 transition hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {ocupado === `caderno-${p._id}` ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : p.caderno?.imagens?.length ? (
              T("Refazer")
            ) : (
              T("Montar")
            )}
          </button>
        </div>
        {!!p.caderno?.imagens?.length && (
          <div className="mt-3 flex gap-2">
            {p.caderno.imagens.map((url) => (
              <div key={url} className="relative h-16 w-14 overflow-hidden rounded border border-slate-800">
                <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── os campos ──────────────────────────────────────────────── */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Campo rotulo={T("Nome")} valor={nome} aoMudar={setNome} />
        <Campo rotulo={T("O que faz")} valor={papel} aoMudar={setPapel} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {CAMPOS.map((c) => (
          <Seletor
            key={c.chave}
            rotulo={T(c.rotulo)}
            valor={String(p.aparencia?.[c.chave] || "")}
            opcoes={opcoes[c.lista] || []}
            aoMudar={(v) => aoSalvar(p._id, { aparencia: { ...p.aparencia, [c.chave]: v } })}
          />
        ))}
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{T("Idade")}</label>
          <input
            type="number"
            defaultValue={Number(p.aparencia?.idade) || undefined}
            onBlur={(e) => aoSalvar(p._id, { aparencia: { ...p.aparencia, idade: Number(e.target.value) || undefined } })}
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500/50"
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {T("O detalhe que identifica")}
        </label>
        <input
          value={livre}
          onChange={(e) => setLivre(e.target.value)}
          placeholder={T("Ex.: nunca tira o boné; tem uma falha no sorriso")}
          className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-xs outline-none placeholder:text-slate-600 focus:border-indigo-500/50"
        />
      </div>

      <div className="mt-3">
        <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {T("O que veste quando aparece")}
        </label>
        <input
          value={figurino}
          onChange={(e) => setFigurino(e.target.value)}
          placeholder={T("Ex.: camiseta preta lisa e jaleco branco por cima")}
          className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-xs outline-none placeholder:text-slate-600 focus:border-indigo-500/50"
        />
      </div>

      {p.origem === "publico" && (
        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
          <p className="text-[11px] font-semibold">{T("O que essa pessoa pensa")}</p>
          <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">
            {T("Isto vira exemplo, legenda e fala nas suas peças — e, se você quiser, vai para o seu perfil.")}
          </p>
          <div className="mt-2 space-y-2">
            {[
              ["quer", "O que ela quer"],
              ["trava", "O que a impede"],
              ["objecao", "O que diz quando não vai comprar"],
            ].map(([chave, rotulo]) => (
              <div key={chave}>
                <label className="text-[10px] text-slate-500">{T(rotulo)}</label>
                <input
                  defaultValue={p.psicologia?.[chave] || ""}
                  onBlur={(e) => aoSalvar(p._id, { psicologia: { ...p.psicologia, [chave]: e.target.value } })}
                  className="mt-0.5 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500/50"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {!!p.prontidao?.faltando.length && (
        <ul className="mt-3 space-y-1">
          {p.prontidao.faltando.slice(0, 3).map((f) => (
            <li key={f.campo} className="text-[10px] leading-relaxed text-slate-500">
              <span className="text-slate-400">{f.pergunta}</span> — {f.destrava}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => gravar()}
          disabled={salvando}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {salvando ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          {T("Guardar")}
        </button>

        <button
          onClick={() => gravar({ completar: true })}
          disabled={salvando}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
        >
          <Wand2 className="h-3 w-3" /> {T("Completar o que falta")}
        </button>

        {p.origem !== "elenco" && (
          <button
            onClick={() => gravar({ contribuir: true })}
            disabled={salvando}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
            title={T("Leva o que esta ficha ensinou para o seu perfil — você confirma, nada entra sozinho.")}
          >
            <Sparkles className="h-3 w-3" /> {T("Mandar para o meu perfil")}
          </button>
        )}

        {p.origem !== "criador" && (
          <button
            onClick={() => aoApagar(p._id)}
            className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] text-slate-600 transition hover:bg-rose-500/10 hover:text-rose-400"
          >
            <Trash2 className="h-3 w-3" /> {T("Apagar")}
          </button>
        )}
      </div>
    </div>
  );
}

function Campo({ rotulo, valor, aoMudar }: { rotulo: string; valor: string; aoMudar: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{rotulo}</label>
      <input
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500/50"
      />
    </div>
  );
}

function Seletor({
  rotulo,
  valor,
  opcoes,
  aoMudar,
}: {
  rotulo: string;
  valor: string;
  opcoes: Opcao[];
  aoMudar: (v: string) => void;
}) {
  const T = useT();
  return (
    <div>
      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{rotulo}</label>
      <select
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500/50"
      >
        <option value="">{T("— não definido")}</option>
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {T(o.rotulo)}
          </option>
        ))}
      </select>
    </div>
  );
}
