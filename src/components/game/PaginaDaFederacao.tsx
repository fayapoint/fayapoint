import { Link } from "@/i18n/navigation";
import { Scale, ShieldCheck, Coins, Gavel, Users, Eye, Lock, FileText } from "lucide-react";
import { LIMA, OURO, CIANO, VIOLETA, RUBRO, FUNDO, bebas, superficie } from "@/lib/game/tema";

/**
 * A FEDERAÇÃO, COM ROSTO — 08/09/2026.
 *
 * ## O que estava errado antes
 *
 * `/game/federacao` era o PAINEL de operação: aprovar clube, revisar
 * integridade, auditar copa. Só que o nome da página é o nome da instituição, e
 * quem entrava ali sem ser da casa não encontrava a instituição — encontrava
 * uma ferramenta interna pedindo login. "Nós somos a federação", e a página não
 * dizia nada sobre quem somos.
 *
 * Agora a página é a instituição. O painel continua existindo, embaixo, e só
 * aparece para quem é da federação.
 *
 * ## O que entra aqui, e o que nunca entra
 *
 * Entra o art. 41 do estatuto — a lista fechada do que é público. Não entra
 * estrutura de órgãos, critério de reconhecimento de competição, mecânica de
 * apuração nem método de medida: junto, isso é a fórmula de montar uma
 * federação igual a esta (art. 20).
 *
 * ⚠️ O art. 7º é obrigatório nesta tela. Uma página que se apresenta como
 * "Federação" sem dizer o que NÃO é convida a supor filiação oficial,
 * reconhecimento público e relação com a EA — nenhum dos três existe.
 */

const REGRAS = [
  {
    icone: Coins,
    cor: LIMA,
    titulo: "A ficha não é dinheiro",
    texto:
      "Não se compra, não se converte, não se saca e não vale fora do Winners 22. Não é detalhe de produto: é a razão pela qual esta mesa pode existir sem ser casa de aposta.",
  },
  {
    icone: Users,
    cor: CIANO,
    titulo: "Como se recebe ficha",
    texto:
      "100 fichas de boas-vindas, uma vez por conta, e recarga periódica em quantidade fixa. Nenhuma outra forma de obter, por nenhum valor.",
  },
  {
    icone: Scale,
    cor: VIOLETA,
    titulo: "Só se aposta no que é nosso",
    texto:
      "Mercado com cupom existe apenas em partida simulada pela Federação. Campeonato real — inclusive os que cobrimos — aparece como prévia: a cotação fica à mostra, a aposta não abre.",
  },
  {
    icone: Eye,
    cor: OURO,
    titulo: "O resultado é conferível por qualquer pessoa",
    texto:
      "Antes de aceitar a primeira aposta, cada evento publica um selo criptográfico. Depois da liquidação, a semente é revelada e qualquer um recalcula o resultado por conta própria.",
  },
  {
    icone: ShieldCheck,
    cor: LIMA,
    titulo: "A medida é nossa, e é auditada",
    texto:
      "Força de clube, desempenho de atleta e cotação saem dos sistemas proprietários da FayAI, com data e grau de confiança em cada número. O método não é publicado; o que ele afirma, sim.",
  },
  {
    icone: Gavel,
    cor: RUBRO,
    titulo: "Quem decide é gente, e diz por quê",
    texto:
      "Combinar resultado, perder de propósito, usar identidade de terceiro ou apostar contra si mesmo levam de advertência a banimento. Nenhum sinal automático aplica sanção sozinho: toda decisão tem responsável e motivo escrito, e cabe recurso.",
  },
];

export function PaginaDaFederacao({ locale, ehFederacao }: { locale: string; ehFederacao: boolean }) {
  return (
    <div style={{ background: FUNDO }} className="text-white">
      <div className="mx-auto max-w-5xl px-5 pt-28">
        <Link href="/game" locale={locale} className="text-sm text-white/50 transition hover:text-white">
          ← Winners 22
        </Link>

        <header className="mt-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-[.3em]" style={{ color: LIMA }}>
            Federação FayAI de Esportes Eletrônicos
          </p>
          <h1 style={bebas} className="text-4xl uppercase leading-none sm:text-6xl">
            Uma disputa bem cuidada.
          </h1>
          <p className="mt-5 max-w-2xl leading-relaxed text-white/65">
            Existimos para elevar o nível do jogador brasileiro de Pro Clubs. Organizamos
            competição com regra escrita e calendário, medimos desempenho de clube e de atleta
            com método próprio, guardamos o histórico — para que carreira de jogador seja fato
            consultável, e não memória de grupo de mensagens.
          </p>
        </header>

        {/* ---- Por que existe mesa aqui ---- */}
        <section style={superficie(OURO)} className="mt-8 rounded-2xl border p-6">
          <h2 style={bebas} className="text-2xl uppercase tracking-wide">
            Por que uma federação tem mesa de apostas
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/65">
            Quando o jogo de azar foi proibido no Brasil, em 1946, a aposta em corrida de cavalo
            foi preservada — e não por acaso. Ela se sustentou por uma finalidade declarada e
            verificável: o aprimoramento da raça equina. A aposta não era o fim; era o mecanismo
            que movia o fim.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/65">
            Aqui é a mesma lógica, com ficha sem valor econômico. Precificar uma partida obriga a
            Federação a medir com rigor — errar cotação é errar medida, e isso fica exposto. Clube
            sem público ganha público quando há mesa sobre ele. E onde há mesa, manipular
            resultado passa a ter consequência apurável.
          </p>
        </section>

        {/* ---- As regras principais ---- */}
        <section className="mt-12">
          <h2 style={bebas} className="flex items-center gap-2 text-3xl uppercase tracking-wide">
            <Scale className="h-6 w-6" style={{ color: LIMA }} />
            As regras principais
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-white/50">
            O essencial para quem joga e para quem aposta. O regulamento completo do Winners 22
            detalha cada uma.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {REGRAS.map((r) => (
              <div key={r.titulo} style={superficie(r.cor)} className="rounded-2xl border p-5">
                <h3 className="flex items-center gap-2 text-base font-semibold">
                  <r.icone className="h-4 w-4 shrink-0" style={{ color: r.cor }} />
                  {r.titulo}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/60">{r.texto}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---- O que a Federação NÃO é ---- */}
        <section style={superficie(RUBRO)} className="mt-10 rounded-2xl border p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck className="h-4 w-4" style={{ color: RUBRO }} />
            O que a Federação não é
          </h2>
          <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-white/60">
            <li>
              <strong className="text-white/80">Não é casa de apostas.</strong> Não opera aposta
              com valor e não pleiteia autorização para isso. A ficha não tem valor econômico.
            </li>
            <li>
              <strong className="text-white/80">Não é entidade oficial do desporto.</strong> Não é
              reconhecida pelo poder público nem filiada a confederação ou entidade
              internacional.
            </li>
            <li>
              <strong className="text-white/80">Não tem relação com a EA Sports.</strong> Não
              representamos, não somos patrocinados nem avalizados pela Electronic Arts ou por
              qualquer detentora de direitos sobre os jogos.
            </li>
            <li>
              <strong className="text-white/80">Não organiza o que apenas cobre.</strong>{" "}
              Cobertura de campeonato de terceiro é cobertura — não somos a organização daquela
              competição e não falamos por ela.
            </li>
          </ul>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/game/apostas"
            locale={locale}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold"
            style={{ background: LIMA, color: FUNDO }}
          >
            <Coins className="h-4 w-4" />
            Ir para a mesa
          </Link>
          {ehFederacao && (
            <Link
              href="/game/federacao/estatuto"
              locale={locale}
              className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm"
              style={{ borderColor: `${OURO}55`, color: OURO }}
            >
              <FileText className="h-4 w-4" />
              Estatuto interno
              <Lock className="h-3 w-3 opacity-60" />
            </Link>
          )}
        </div>

        {!ehFederacao && (
          <p className="mt-10 border-t border-white/10 pt-6 text-xs text-white/30">
            A administração da Federação — filiação de clubes, integridade e auditoria — fica em
            área reservada.
          </p>
        )}
      </div>
    </div>
  );
}
