import { ImageResponse } from "next/og";
import {
  carregarCompeticao,
  melhoresPorSetor,
  montarArtilharia,
} from "@/lib/game/competicao-servidor";

/**
 * GET /api/game/campeonato/[slug]/premio  → PNG 1200×630
 *
 * O PÔSTER DO CAMPEÃO. Ricardo: *"entrega de prêmio (uma imagem com o nome dos
 * integrantes, tudo bem legal e com um banco enorme para sempre gerar algo
 * aleatório legal…) tudo isso rodando automático do nosso site"*.
 *
 * ## O banco
 *
 * Oito paletas × cinco fundos × seis manchetes = 240 combinações, e a variação
 * de ângulo, brilho e disposição multiplica isso. A escolha é **semeada** pela
 * `arte.semente` da competição: o mesmo campeonato gera sempre o mesmo pôster
 * (o link colado no grupo não muda de cara a cada carregamento), e `?v=<n>`
 * reroda para quem quiser outro.
 *
 * ## O que entra
 *
 * O elenco campeão inteiro — é o pedido, e é o que faz a imagem valer para
 * quem ganhou: cada um quer ver o próprio nome. Mais os quatro destaques:
 * artilheiro, garçom, melhor meio e melhor defesa. Os dois primeiros saem da
 * artilharia da competição; os dois últimos, da média de nota por setor, com
 * piso de dois jogos (ver `melhoresPorSetor`).
 *
 * ## Por que 1200×630
 *
 * É a proporção que o WhatsApp, o X e o LinkedIn recortam sem cortar — e o
 * pôster serve como cartão de compartilhamento do próprio campeonato.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* O banco                                                             */
/* ------------------------------------------------------------------ */

interface Paleta {
  nome: string;
  fundo: string;
  acento: string;
  acento2: string;
  tinta: string;
  suave: string;
}

const PALETAS: Paleta[] = [
  { nome: "lima", fundo: "#0c0e1d", acento: "#a3e635", acento2: "#f5c04e", tinta: "#f3f1ff", suave: "rgba(243,241,255,.6)" },
  { nome: "ouro", fundo: "#140f06", acento: "#f5c04e", acento2: "#ffe9a8", tinta: "#fff8e8", suave: "rgba(255,248,232,.6)" },
  { nome: "ciano", fundo: "#06131d", acento: "#38bdf8", acento2: "#a3e635", tinta: "#eaf6ff", suave: "rgba(234,246,255,.6)" },
  { nome: "violeta", fundo: "#120a20", acento: "#a78bfa", acento2: "#f472b6", tinta: "#f5efff", suave: "rgba(245,239,255,.6)" },
  { nome: "rubro", fundo: "#1a0a10", acento: "#fb7185", acento2: "#f5c04e", tinta: "#fff0f3", suave: "rgba(255,240,243,.6)" },
  { nome: "esmeralda", fundo: "#04150f", acento: "#34d399", acento2: "#a3e635", tinta: "#eafff6", suave: "rgba(234,255,246,.6)" },
  { nome: "brasa", fundo: "#1b0f04", acento: "#fb923c", acento2: "#f5c04e", tinta: "#fff3e6", suave: "rgba(255,243,230,.6)" },
  { nome: "gelo", fundo: "#0a1016", acento: "#e2e8f0", acento2: "#38bdf8", tinta: "#f8fafc", suave: "rgba(248,250,252,.6)" },
];

/** Fundos. Só gradiente e listra — Satori não desenha SVG arbitrário. */
const FUNDOS = [
  (p: Paleta) => `radial-gradient(circle at 18% 12%, ${p.acento}2e, transparent 55%), radial-gradient(circle at 88% 82%, ${p.acento2}22, transparent 50%)`,
  (p: Paleta) => `repeating-linear-gradient(115deg, ${p.acento}0f 0px, ${p.acento}0f 3px, transparent 3px, transparent 26px)`,
  (p: Paleta) => `radial-gradient(circle at 50% -10%, ${p.acento}33, transparent 60%)`,
  (p: Paleta) => `linear-gradient(135deg, ${p.acento}1c 0%, transparent 42%), linear-gradient(315deg, ${p.acento2}18 0%, transparent 40%)`,
  (p: Paleta) => `repeating-linear-gradient(90deg, ${p.acento}0d 0px, ${p.acento}0d 1px, transparent 1px, transparent 60px)`,
];

const MANCHETES_PT = [
  "É CAMPEÃO",
  "LEVANTOU A TAÇA",
  "NINGUÉM SEGUROU",
  "O TÍTULO É NOSSO",
  "PASSOU POR TODOS",
  "ESCREVEU O NOME",
];
const MANCHETES_EN = [
  "CHAMPIONS",
  "LIFTED THE CUP",
  "NOBODY STOPPED THEM",
  "THE TITLE IS OURS",
  "BEAT THEM ALL",
  "NAME IN THE BOOK",
];

/** Gerador determinístico — mesma semente, mesmo pôster, sempre. */
function aleatorio(semente: number) {
  let s = semente >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const url = new URL(req.url);
  const en = url.searchParams.get("lang") === "en";

  const dados = await carregarCompeticao(slug);
  if (!dados) {
    return new Response("campeonato não encontrado", { status: 404 });
  }
  const { competicao } = dados;
  const campeao = competicao.campeaoTimeId
    ? dados.times.find((t) => String(t._id) === String(competicao.campeaoTimeId))
    : null;

  if (!campeao) {
    return new Response(
      en ? "this championship has no champion yet" : "este campeonato ainda não tem campeão",
      { status: 409 }
    );
  }

  // `?v=` reroda a arte sem tocar no banco.
  const variacao = Number(url.searchParams.get("v") ?? 0) || 0;
  const rnd = aleatorio((competicao.arte?.semente ?? 1) + variacao * 7919);
  const paleta = PALETAS[Math.floor(rnd() * PALETAS.length)];
  const fundo = FUNDOS[Math.floor(rnd() * FUNDOS.length)];
  const manchete = (en ? MANCHETES_EN : MANCHETES_PT)[
    Math.floor(rnd() * MANCHETES_PT.length)
  ];

  /**
   * A CAMPANHA DO CAMPEÃO e o placar da final.
   *
   * Existem porque a primeira versão do pôster deixava um vão morto no meio
   * sempre que o elenco era pequeno: o bloco do elenco tinha `flex: 1` e
   * empurrava os destaques para o rodapé, sobrando 200px de nada. Preencher
   * aquilo com enfeite seria decoração; preencher com a campanha é o número
   * que a pessoa quer ver — quantos jogos, quantas vitórias, quantos gols.
   */
  const idCampeao = String(campeao._id);
  const jogosDoCampeao = dados.confrontos.filter(
    (c) =>
      (c.status === "confirmado" || c.status === "wo") &&
      c.golsMandante != null &&
      c.golsVisitante != null &&
      (String(c.mandanteId) === idCampeao || String(c.visitanteId) === idCampeao)
  );
  const campanha = jogosDoCampeao.reduce(
    (a, c) => {
      const casa = String(c.mandanteId) === idCampeao;
      const pro = (casa ? c.golsMandante : c.golsVisitante) ?? 0;
      const contra = (casa ? c.golsVisitante : c.golsMandante) ?? 0;
      return {
        jogos: a.jogos + 1,
        vitorias: a.vitorias + (pro > contra ? 1 : 0),
        golsPro: a.golsPro + pro,
        golsContra: a.golsContra + contra,
      };
    },
    { jogos: 0, vitorias: 0, golsPro: 0, golsContra: 0 }
  );

  const vice = competicao.viceTimeId
    ? dados.times.find((t) => String(t._id) === String(competicao.viceTimeId))
    : null;
  const decisao = dados.confrontos.find(
    (c) => c.fase === "final" && c.golsMandante != null && c.golsVisitante != null
  );
  const placarFinal = decisao
    ? String(decisao.mandanteId) === idCampeao
      ? `${decisao.golsMandante} × ${decisao.golsVisitante}`
      : `${decisao.golsVisitante} × ${decisao.golsMandante}`
    : null;

  const artilharia = montarArtilharia(dados);
  const setores = melhoresPorSetor(dados);
  const doCampeao = (g: string) => campeao.elenco.some((j) => j.gamertag === g);

  const artilheiro = artilharia.find((a) => a.gols > 0);
  const garcom = [...artilharia].sort((a, b) => b.assistencias - a.assistencias)[0];
  const melhorMeio = setores.find((s) => s.setor === "MEI");
  const melhorDefesa = setores.find((s) => s.setor === "DEF") ?? setores.find((s) => s.setor === "GOL");

  const destaques = [
    { rotulo: en ? "TOP SCORER" : "ARTILHEIRO", nome: artilheiro?.gamertag, valor: artilheiro ? `${artilheiro.gols}` : null },
    { rotulo: en ? "ASSISTS" : "GARÇOM", nome: garcom?.assistencias ? garcom.gamertag : undefined, valor: garcom?.assistencias ? `${garcom.assistencias}` : null },
    { rotulo: en ? "BEST MID" : "MELHOR MEIO", nome: melhorMeio?.gamertag, valor: melhorMeio ? melhorMeio.notaMedia.toFixed(1) : null },
    { rotulo: en ? "BEST DEF" : "MELHOR DEFESA", nome: melhorDefesa?.gamertag, valor: melhorDefesa ? melhorDefesa.notaMedia.toFixed(1) : null },
  ].filter((d) => d.nome);

  // O elenco inteiro é o pedido — mas 30 nomes em 630px de altura viram uma
  // parede ilegível. 18 cabem em três colunas com respiro; o resto vira "+N".
  const elenco = campeao.elenco.slice(0, 18);
  const sobra = Math.max(0, campeao.elenco.length - elenco.length);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          background: paleta.fundo,
          backgroundImage: fundo(paleta),
          color: paleta.tinta,
          fontFamily: "sans-serif",
          padding: "44px 52px",
          position: "relative",
        }}
      >
        {/* A faixa de acento na borda esquerda — a assinatura visual do pôster. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "12px",
            background: `linear-gradient(180deg, ${paleta.acento}, ${paleta.acento2})`,
            display: "flex",
          }}
        />

        {/* -------- Cabeçalho -------- */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              display: "flex",
              fontSize: "15px",
              fontWeight: 800,
              letterSpacing: "3px",
              color: paleta.acento,
            }}
          >
            WINNERS 22 CHAMPIONSHIP
          </div>
          <div style={{ display: "flex", flex: 1, height: "1px", background: `${paleta.acento}44` }} />
          <div style={{ display: "flex", fontSize: "15px", color: paleta.suave, letterSpacing: "1px" }}>
            {competicao.nome}
          </div>
        </div>

        {/* -------- Corpo: campeão à esquerda, campanha à direita -------- */}
        <div style={{ display: "flex", flex: 1, gap: "28px", marginTop: "22px" }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                fontSize: "22px",
                fontWeight: 800,
                letterSpacing: "8px",
                color: paleta.acento2,
              }}
            >
              {manchete}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: campeao.nome.length > 18 ? "62px" : "80px",
                fontWeight: 900,
                lineHeight: 1,
                marginTop: "4px",
                letterSpacing: "-1px",
              }}
            >
              {campeao.nome.toUpperCase()}
            </div>

            {/* A decisão. É a frase que conta a história do título em uma linha. */}
            {placarFinal && vice && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "10px",
                  fontSize: "20px",
                  color: paleta.suave,
                }}
              >
                <div style={{ display: "flex", fontWeight: 900, color: paleta.acento }}>
                  {placarFinal}
                </div>
                <div style={{ display: "flex" }}>
                  {en ? "in the final over" : "na final sobre"} {vice.nome}
                </div>
              </div>
            )}

            <div
              style={{
                display: "flex",
                fontSize: "13px",
                fontWeight: 800,
                letterSpacing: "4px",
                color: paleta.suave,
                marginTop: "22px",
                marginBottom: "10px",
              }}
            >
              {en ? "SQUAD" : "ELENCO"}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {elenco.map((j) => (
                <div
                  key={j.gamertag}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "6px 14px",
                    borderRadius: "999px",
                    border: `1px solid ${paleta.acento}3a`,
                    background: `${paleta.acento}12`,
                    fontSize: "18px",
                    fontWeight: 700,
                  }}
                >
                  {j.gamertag}
                </div>
              ))}
              {sobra > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "6px 14px",
                    fontSize: "18px",
                    color: paleta.suave,
                  }}
                >
                  +{sobra}
                </div>
              )}
            </div>
          </div>

          {/* O escudo com a sigla e a campanha — o que enchia de ar agora
              carrega os quatro números da caminhada até o título. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "270px",
              borderRadius: "22px",
              border: `1px solid ${paleta.acento}2e`,
              background: `${paleta.acento}0d`,
              padding: "18px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "104px",
                height: "104px",
                borderRadius: "999px",
                border: `3px solid ${paleta.acento}`,
                fontSize: "40px",
                fontWeight: 900,
                color: paleta.acento,
              }}
            >
              {campeao.sigla || campeao.nome.slice(0, 3).toUpperCase()}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px", marginTop: "16px" }}>
              {(
                [
                  [en ? "PLAYED" : "JOGOS", campanha.jogos],
                  [en ? "WON" : "VITÓRIAS", campanha.vitorias],
                  [en ? "SCORED" : "GOLS", campanha.golsPro],
                  [en ? "CONCEDED" : "SOFRIDOS", campanha.golsContra],
                ] as const
              ).map(([rotulo, valor]) => (
                <div
                  key={rotulo}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "110px",
                    padding: "8px 4px",
                  }}
                >
                  <div style={{ display: "flex", fontSize: "28px", fontWeight: 900 }}>{valor}</div>
                  <div
                    style={{
                      display: "flex",
                      fontSize: "10px",
                      fontWeight: 800,
                      letterSpacing: "2px",
                      color: paleta.suave,
                    }}
                  >
                    {rotulo}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* -------- Destaques -------- */}
        {destaques.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "18px",
              borderTop: `1px solid ${paleta.acento}2e`,
              paddingTop: "16px",
            }}
          >
            {destaques.map((d) => (
              <div
                key={d.rotulo}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: "14px",
                  background: `${paleta.acento}0f`,
                  border: `1px solid ${paleta.acento}26`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "2px",
                    color: paleta.suave,
                  }}
                >
                  {d.rotulo}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "4px" }}>
                  <div style={{ display: "flex", fontSize: "22px", fontWeight: 800 }}>{d.nome}</div>
                  {d.valor && (
                    <div style={{ display: "flex", fontSize: "20px", fontWeight: 900, color: paleta.acento2 }}>
                      {d.valor}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            display: "flex",
            marginTop: "14px",
            fontSize: "12px",
            color: paleta.suave,
            letterSpacing: "1px",
          }}
        >
          fayai.com.br/game — {en ? "independent project, not affiliated with EA" : "projeto independente, sem afiliação com a EA"}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        // O pôster de um campeonato encerrado não muda mais: cache longo.
        "Cache-Control":
          competicao.status === "encerrada"
            ? "public, max-age=3600, s-maxage=86400"
            : "no-store",
      },
    }
  );
}
