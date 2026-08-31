import { ImageResponse } from "next/og";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import GameVaga, { type IGameVaga } from "@/models/GameVaga";
import { POSICOES } from "@/lib/game/posicoes";

/**
 * GET /api/game/mercado/[id]/cartaz  → PNG 1080×1350
 *
 * O CARTAZ DA VAGA — a peça que fecha o laço com os grupos do Facebook.
 *
 * A pesquisa na comunidade achou o mesmo padrão em todo grupo: para recrutar,
 * a pessoa FOTOGRAFA A TV com o menu do jogo, ou monta na pressa um cartaz
 * torto. É feio, ilegível no celular, e não diz o essencial (posição,
 * plataforma, horário) de forma que dê para bater o olho.
 *
 * Aqui, a mesma vaga que já é dado consultável no mercado vira, num clique, um
 * pôster limpo com a marca Winners 22 — pronto para colar no grupo. O clube
 * ganha um cartaz decente de graça; a FayAI ganha a marca circulando em toda
 * postagem de recrutamento da modalidade. É o "grafismo" que o Ricardo pediu,
 * gerado sozinho a partir do dado.
 *
 * A arte é SEMEADA pelo id da vaga: o mesmo anúncio gera sempre o mesmo cartaz
 * (o link colado no grupo não muda de cara), e `?v=<n>` reroda a paleta.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Paleta {
  fundo: string;
  acento: string;
  acento2: string;
  tinta: string;
  suave: string;
}

const PALETAS: Paleta[] = [
  { fundo: "#0c0e1d", acento: "#a3e635", acento2: "#f5c04e", tinta: "#f3f1ff", suave: "rgba(243,241,255,.6)" },
  { fundo: "#06131d", acento: "#38bdf8", acento2: "#a3e635", tinta: "#eaf6ff", suave: "rgba(234,246,255,.6)" },
  { fundo: "#120a20", acento: "#a78bfa", acento2: "#f472b6", tinta: "#f5efff", suave: "rgba(245,239,255,.6)" },
  { fundo: "#1a0a10", acento: "#fb7185", acento2: "#f5c04e", tinta: "#fff0f3", suave: "rgba(255,240,243,.6)" },
  { fundo: "#1b0f04", acento: "#fb923c", acento2: "#f5c04e", tinta: "#fff3e6", suave: "rgba(255,243,230,.6)" },
  { fundo: "#04150f", acento: "#34d399", acento2: "#a3e635", tinta: "#eafff6", suave: "rgba(234,255,246,.6)" },
];

const FUNDOS = [
  (p: Paleta) => `radial-gradient(circle at 20% 8%, ${p.acento}30, transparent 55%), radial-gradient(circle at 85% 92%, ${p.acento2}22, transparent 52%)`,
  (p: Paleta) => `radial-gradient(circle at 50% -8%, ${p.acento}33, transparent 62%)`,
  (p: Paleta) => `linear-gradient(160deg, ${p.acento}1c 0%, transparent 46%), linear-gradient(320deg, ${p.acento2}16 0%, transparent 42%)`,
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const SIGLA = new Map(POSICOES.map((p) => [p.code, p]));
const PLAT: Record<string, string> = {
  "common-gen5": "PS5 · SERIES · PC",
  "common-gen4": "PS4 · XBOX ONE",
  mista: "CROSS-GEN",
};
const DIA_SIGLA: Record<string, string> = {
  seg: "SEG", ter: "TER", qua: "QUA", qui: "QUI", sex: "SEX", sab: "SÁB", dom: "DOM",
};

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return new Response("id inválido", { status: 400 });

  await dbConnect();
  const v = (await GameVaga.findById(id).lean()) as unknown as (IGameVaga & { _id: unknown }) | null;
  if (!v) return new Response("vaga não encontrada", { status: 404 });

  const url = new URL(req.url);
  const en = url.searchParams.get("lang") === "en";
  const variacao = Number(url.searchParams.get("v") ?? 0) || 0;

  const semente = hash(String(v._id)) + variacao * 7919;
  const paleta = PALETAS[semente % PALETAS.length];
  const fundo = FUNDOS[(semente >> 5) % FUNDOS.length](paleta);

  const ehClube = v.tipo === "clube";
  const status = ehClube
    ? en ? "RECRUITING" : "RECRUTANDO"
    : en ? "FREE AGENT" : "LIVRE NO MERCADO";
  const nome = (ehClube ? v.clubeNome : v.proName || v.gamertag) || "—";
  const posicoes = (v.posicoes ?? []).map((c) => SIGLA.get(c)?.sigla ?? c);
  const rotuloPos = ehClube
    ? en ? "NEEDS" : "PRECISA DE"
    : en ? "PLAYS" : "JOGA";
  const div = v.clubeSnapshot?.currentDivision;
  const verificado = v.sourceGrade === "B";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1080px",
          height: "1350px",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          background: paleta.fundo,
          fontFamily: "sans-serif",
          color: paleta.tinta,
          padding: "72px 72px 60px",
        }}
      >
        <div style={{ position: "absolute", inset: 0, display: "flex", background: fundo }} />

        {/* Cabeçalho: marca + status */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", width: "14px", height: "56px", background: paleta.acento, borderRadius: "3px" }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: "30px", fontWeight: 900, letterSpacing: "3px" }}>WINNERS 22</div>
              <div style={{ display: "flex", fontSize: "18px", fontWeight: 800, color: paleta.suave, letterSpacing: "4px" }}>
                {en ? "TRANSFER MARKET" : "MERCADO DA BOLA"}
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "22px",
              fontWeight: 900,
              letterSpacing: "3px",
              color: paleta.fundo,
              background: paleta.acento,
              padding: "12px 22px",
              borderRadius: "12px",
            }}
          >
            {status}
          </div>
        </div>

        {/* Nome */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: "96px", zIndex: 1 }}>
          <div style={{ display: "flex", fontSize: "26px", fontWeight: 800, letterSpacing: "5px", color: paleta.acento2 }}>
            {ehClube ? (en ? "CLUB" : "CLUBE") : (en ? "PLAYER" : "JOGADOR")}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: nome.length > 16 ? "104px" : "132px",
              fontWeight: 900,
              lineHeight: 1,
              marginTop: "8px",
              textTransform: "uppercase",
            }}
          >
            {nome}
          </div>
          {!ehClube && v.estilo ? (
            <div style={{ display: "flex", fontSize: "34px", fontWeight: 800, color: paleta.suave, marginTop: "14px", letterSpacing: "2px" }}>
              “{v.estilo.toUpperCase()}”
            </div>
          ) : null}
        </div>

        {/* Bloco central: divisão/overall + posições */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: "72px", gap: "44px", zIndex: 1, flex: 1 }}>
          {/* linha de destaque */}
          <div style={{ display: "flex", gap: "24px" }}>
            {ehClube && div != null ? (
              <Destaque
                paleta={paleta}
                rotulo={en ? "DIVISION" : "DIVISÃO"}
                valor={String(div)}
                nota={verificado ? (en ? "verified · EA" : "medido · EA") : (en ? "declared" : "declarado")}
                notaCor={verificado ? paleta.acento : paleta.suave}
              />
            ) : null}
            {!ehClube && v.overall != null ? (
              <Destaque paleta={paleta} rotulo="OVERALL" valor={String(v.overall)} nota="OVR" notaCor={paleta.acento} />
            ) : null}
            {ehClube && v.clubeSnapshot?.gamesPlayed ? (
              <Destaque
                paleta={paleta}
                rotulo={en ? "RECORD" : "CAMPANHA"}
                valor={`${v.clubeSnapshot.wins ?? 0}-${v.clubeSnapshot.ties ?? 0}-${v.clubeSnapshot.losses ?? 0}`}
                nota={en ? "W-D-L" : "V-E-D"}
                notaCor={paleta.suave}
              />
            ) : null}
            {!ehClube && v.minOverall == null && v.gamertag ? (
              <Destaque paleta={paleta} rotulo="GAMERTAG" valor={v.gamertag} nota="" notaCor={paleta.suave} />
            ) : null}
          </div>

          {/* posições */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ display: "flex", fontSize: "26px", fontWeight: 900, letterSpacing: "4px", color: paleta.suave }}>
              {rotuloPos}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
              {posicoes.length === 0 ? (
                <Chip paleta={paleta}>{en ? "ANY POSITION" : "TODAS AS POSIÇÕES"}</Chip>
              ) : (
                posicoes.map((p, i) => (
                  <Chip key={i} paleta={paleta}>
                    {p}
                  </Chip>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Rodapé: plataforma + horário + site */}
        <div style={{ display: "flex", flexDirection: "column", gap: "28px", zIndex: 1 }}>
          <div style={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
            <Linha paleta={paleta} rotulo={en ? "PLATFORM" : "PLATAFORMA"} valor={PLAT[v.plataforma] ?? v.plataforma} />
            {v.horario ? <Linha paleta={paleta} rotulo={en ? "SCHEDULE" : "HORÁRIO"} valor={v.horario.toUpperCase()} /> : null}
            {v.dias && v.dias.length ? (
              <Linha paleta={paleta} rotulo={en ? "DAYS" : "DIAS"} valor={v.dias.map((d) => DIA_SIGLA[d] ?? d).join(" ")} />
            ) : null}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `2px solid ${paleta.acento}44`, paddingTop: "26px" }}>
            <div style={{ display: "flex", fontSize: "30px", fontWeight: 900, color: paleta.acento, letterSpacing: "1px" }}>
              fayai.com.br/game
            </div>
            <div style={{ display: "flex", fontSize: "18px", fontWeight: 700, color: paleta.suave }}>
              {en ? "Post & apply on the site" : "Anuncie e candidate-se no site"}
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1350 }
  );
}

function Destaque({
  paleta,
  rotulo,
  valor,
  nota,
  notaCor,
}: {
  paleta: Paleta;
  rotulo: string;
  valor: string;
  nota: string;
  notaCor: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        padding: "24px 30px",
        borderRadius: "20px",
        background: "rgba(255,255,255,.05)",
        border: `2px solid ${paleta.acento}33`,
        minWidth: "200px",
      }}
    >
      <div style={{ display: "flex", fontSize: "20px", fontWeight: 800, letterSpacing: "3px", color: paleta.suave }}>{rotulo}</div>
      <div style={{ display: "flex", fontSize: valor.length > 6 ? "48px" : "68px", fontWeight: 900, lineHeight: 1 }}>{valor}</div>
      {nota ? <div style={{ display: "flex", fontSize: "18px", fontWeight: 800, color: notaCor, letterSpacing: "2px" }}>{nota}</div> : null}
    </div>
  );
}

function Chip({ paleta, children }: { paleta: Paleta; children: string }) {
  return (
    <div
      style={{
        display: "flex",
        fontSize: "46px",
        fontWeight: 900,
        letterSpacing: "2px",
        color: paleta.fundo,
        background: paleta.acento,
        padding: "14px 30px",
        borderRadius: "16px",
      }}
    >
      {children}
    </div>
  );
}

function Linha({ paleta, rotulo, valor }: { paleta: Paleta; rotulo: string; valor: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ display: "flex", fontSize: "18px", fontWeight: 800, letterSpacing: "3px", color: paleta.suave }}>{rotulo}</div>
      <div style={{ display: "flex", fontSize: "30px", fontWeight: 900, letterSpacing: "1px" }}>{valor}</div>
    </div>
  );
}
