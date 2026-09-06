import { Link } from "@/i18n/navigation";
import {
  DESCONTO_FUNDADOR,
  DESCONTO_FUNDADOR_AVULSO,
  DESCONTO_INDICADO,
  MESES_DESCONTO_INDICADO,
  COMISSAO,
  DIAS_DE_RETENCAO,
  DIAS_DE_CARENCIA,
  TETO_INDICACOES_DIA,
  FIM_DO_PROGRAMA,
} from "@/lib/fundadores";
import { LIMITE_DE_VAGAS, MARCOS } from "@/models/Fundador";

/**
 * O REGULAMENTO — 06/09/2026.
 *
 * ## Por que ele é uma página e não um PDF
 *
 * Pelo art. 30 do Código de Defesa do Consumidor, **a oferta veiculada vincula
 * e integra o contrato**. O que está escrito na landing já obriga a casa; o
 * regulamento existe para dizer as mesmas coisas com as condições explícitas,
 * no mesmo lugar, sem download e sem letra miúda.
 *
 * ## As três coisas que ele precisa ter para servir de prova
 *
 * 1. **Versão e data.** Quem entrou sob a versão 1 continua sob a versão 1. Sem
 *    número de versão, "as regras mudaram" vira palavra contra palavra.
 * 2. **Aviso prévio para alteração.** 30 dias, dito aqui dentro. Programa que
 *    se reserva o direito de mudar "a qualquer momento, sem aviso" é
 *    exatamente a cláusula que o CDC considera abusiva.
 * 3. **Números que saem do código.** Todo percentual e todo prazo abaixo vem de
 *    `lib/fundadores.ts`. Se alguém mudar a comissão no código e esquecer o
 *    regulamento, os dois mudam juntos — que é a única forma de o documento não
 *    virar ficção com o tempo.
 *
 * ⚠️ Ao mudar QUALQUER regra material, suba `VERSAO` e acrescente uma linha ao
 * histórico no fim da página. A versão anterior é a prova de qual oferta valia
 * para quem entrou antes.
 */

const VERSAO = "1.0";
const VIGENTE_DESDE = "6 de setembro de 2026";
const DIAS_DE_AVISO = 30;

const pct = (n: number) => `${Math.round(n * 100)}%`;
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const metadata = {
  title: "Regulamento do Programa Fundadores | FayAI",
  robots: { index: true, follow: true },
};

function Clausula({
  n,
  titulo,
  children,
}: {
  n: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border py-7">
      <h2 className="text-xl font-bold">
        <span className="mr-3 font-mono text-sm text-muted-foreground">{n}</span>
        {titulo}
      </h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export default function Regulamento() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto max-w-3xl px-4 pb-24 pt-32">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Versão {VERSAO} · em vigor desde {VIGENTE_DESDE}
        </p>
        <h1 className="mt-4 text-4xl font-bold">Regulamento do Programa Fundadores</h1>
        <p className="mt-5 text-lg text-muted-foreground">
          Este documento é a versão completa da oferta apresentada em{" "}
          <Link href="/fundadores" className="underline underline-offset-4">
            fayai.com.br/fundadores
          </Link>
          . Ele vale para quem aderir enquanto estiver em vigor, e continua valendo para
          quem aderiu sob ele mesmo que uma versão nova apareça depois.
        </p>

        <Clausula n="1" titulo="Quem pode ser fundador">
          <p>
            As <b className="text-foreground">{LIMITE_DE_VAGAS} primeiras contas</b> que,
            nesta ordem: criarem conta na FayAI, informarem um CPF válido e ainda não usado
            na plataforma, confirmarem um celular por código, e tiverem{" "}
            <b className="text-foreground">o primeiro pagamento de assinatura confirmado</b>.
          </p>
          <p>
            O cadastro sozinho não reserva vaga. A vaga é ocupada no momento em que o
            pagamento é confirmado pelo meio de pagamento, e o número de fundador é
            atribuído nesse instante, em ordem de confirmação.
          </p>
          <p>
            Uma pessoa, uma vaga: o CPF é único por conta, e a mesma pessoa não ocupa dois
            lugares.
          </p>
        </Clausula>

        <Clausula n="2" titulo="O desconto, e por quanto tempo ele dura">
          <p>
            O fundador paga <b className="text-foreground">{pct(DESCONTO_FUNDADOR)} a menos</b>{" "}
            no preço de qualquer plano de assinatura, e{" "}
            <b className="text-foreground">{pct(DESCONTO_FUNDADOR_AVULSO)} a menos</b> em
            compras avulsas (cursos, certificados e pacotes de crédito).
          </p>
          <p>
            O desconto vale <b className="text-foreground">enquanto a assinatura estiver
            ativa e sem interrupção</b>. Cancelamento encerra o preço de fundador; uma nova
            assinatura depois do cancelamento é contratada pelo preço de tabela vigente.
          </p>
          <p>
            O preço de fundador é <b className="text-foreground">congelado</b>: reajustes na
            tabela não alcançam quem já está dentro, enquanto a assinatura seguir ativa.
          </p>
          <p>
            O desconto incide sobre o <b className="text-foreground">preço</b>. A quantidade
            de créditos, o acesso e os limites do plano são os mesmos de quem paga o preço
            cheio — nada é reduzido em troca do desconto.
          </p>
        </Clausula>

        <Clausula n="3" titulo="O selo e o número">
          <p>
            Cada fundador recebe um número de #001 a #{LIMITE_DE_VAGAS}, único e
            intransferível, exibido no perfil e nas áreas da plataforma que o mostrem.
          </p>
          <p>
            O número é <b className="text-foreground">permanente</b>: continua sendo da
            pessoa mesmo que ela cancele a assinatura. O que se perde no cancelamento é o
            preço, não o selo.
          </p>
        </Clausula>

        <Clausula n="4" titulo="O código de indicação e a comissão">
          <p>
            Cada fundador escolhe um código, que forma um endereço público
            (`fayai.com.br/f/seucodigo`). O código é escolhido{" "}
            <b className="text-foreground">uma vez e não muda</b>, porque terceiros
            publicam esse endereço e a troca quebraria os links deles.
          </p>
          <p>
            Toda conta que criar cadastro por esse endereço fica vinculada ao fundador de
            forma permanente. Uma conta pertence a um único indicador — o primeiro — e o
            vínculo não é transferido depois.
          </p>
          <p>
            A comissão é de <b className="text-foreground">{pct(COMISSAO.padrao.credito)} em
            crédito</b> ou <b className="text-foreground">{pct(COMISSAO.padrao.dinheiro)} em
            dinheiro</b>, à escolha do fundador, sobre o{" "}
            <b className="text-foreground">valor líquido</b> (já descontadas as taxas do meio
            de pagamento) de cada pagamento feito pela conta indicada: assinatura, pacotes
            de crédito, cursos e certificados.
          </p>
          <p>
            <b className="text-foreground">Não geram comissão</b>: produtos físicos, serviços
            prestados por terceiros e créditos concedidos como bônus ou prêmio.
          </p>
        </Clausula>

        <Clausula n="5" titulo="O que “vitalício” quer dizer">
          <p className="rounded-r-lg border-l-2 border-amber-400 bg-secondary/40 px-5 py-4 text-foreground">
            A comissão dura enquanto a conta indicada estiver pagando <b>e</b> a assinatura
            do fundador estiver ativa. Se o fundador cancela ou a cobrança falha, a comissão{" "}
            <b>pausa</b>: para de gerar lançamentos novos, mantém os já liberados, e volta a
            gerar se a assinatura for retomada em até {DIAS_DE_CARENCIA} dias. Não há prazo
            máximo enquanto essas duas condições forem verdadeiras.
          </p>
        </Clausula>

        <Clausula n="6" titulo="Quando a comissão fica disponível">
          <p>
            Cada comissão nasce <b className="text-foreground">retida</b> e é liberada{" "}
            <b className="text-foreground">{DIAS_DE_RETENCAO} dias</b> depois do pagamento
            que a gerou. A retenção existe porque uma compra pode ser cancelada, estornada
            ou contestada nesse período.
          </p>
          <p>
            Se o pagamento for estornado, a comissão correspondente é desfeita. Se ela já
            tiver sido creditada, o valor é retirado do saldo — inclusive deixando o saldo
            negativo até ser compensado por comissões futuras.
          </p>
          <p>
            O recebimento <b className="text-foreground">em crédito</b> é o padrão e está
            disponível. O recebimento <b className="text-foreground">em dinheiro</b> depende
            de o fundador emitir documento fiscal (MEI ou CNPJ) e observa valor mínimo de
            saque; enquanto essa opção não estiver aberta, o valor continua acumulado e
            visível no extrato.
          </p>
        </Clausula>

        <Clausula n="7" titulo="O benefício de quem entra pelo código">
          <p>
            Quem cria conta por um endereço de fundador paga{" "}
            <b className="text-foreground">{pct(DESCONTO_INDICADO)} a menos</b> nos{" "}
            {MESES_DESCONTO_INDICADO} primeiros meses de assinatura.
          </p>
          <p>
            <b className="text-foreground">Descontos não são cumulativos.</b> Se a mesma
            pessoa tiver direito a mais de um, vale o maior deles.
          </p>
        </Clausula>

        <Clausula n="8" titulo="A escada de marcos">
          <p>Contados por conta indicada que se tornou pagante:</p>
          <ul className="ml-1 space-y-1.5">
            {MARCOS.map((m) => (
              <li key={m.nivel}>
                <b className="capitalize text-foreground">{m.nivel}</b> — {m.indicados}{" "}
                contas: {brl(m.bonusCreditos)} em crédito
                {m.nivel === "lenda" &&
                  `, e a comissão passa a ${pct(COMISSAO.lenda.credito)} em crédito ou ${pct(COMISSAO.lenda.dinheiro)} em dinheiro`}
                .
              </li>
            ))}
          </ul>
          <p>Cada marco é pago uma única vez.</p>
        </Clausula>

        <Clausula n="9" titulo="Um nível só">
          <p>
            O fundador ganha sobre o que <b className="text-foreground">as contas que ele
            trouxe</b> pagam. Não há ganho sobre contas trazidas por terceiros, em nenhum
            nível.
          </p>
          <p>
            Não existe taxa para participar do programa de indicação, não existe compra de
            estoque, e não existe remuneração por recrutar pessoas: o ganho vem
            exclusivamente do consumo de produtos e serviços por clientes reais.
          </p>
        </Clausula>

        <Clausula n="10" titulo="Condutas que cancelam o benefício">
          <p>
            Indicar a si mesmo — com outro e-mail, outro documento, outro aparelho ou
            qualquer combinação disso —, criar contas com dados de terceiros, ou usar
            automação para gerar cadastros.
          </p>
          <p>
            Há um teto de <b className="text-foreground">{TETO_INDICACOES_DIA} vínculos por
            dia</b> por código. Indicações identificadas como fraudulentas são anuladas, e
            as comissões correspondentes são desfeitas.
          </p>
          <p>
            Confirmada a fraude, a FayAI pode encerrar a participação da conta no programa,
            mantendo o histórico do que ocorreu.
          </p>
        </Clausula>

        <Clausula n="11" titulo="Prazo, alterações e encerramento">
          <p>
            O programa encerra quando as {LIMITE_DE_VAGAS} vagas forem preenchidas ou em{" "}
            <b className="text-foreground">
              {FIM_DO_PROGRAMA.toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </b>
            , o que acontecer primeiro.
          </p>
          <p>
            Alterações neste regulamento passam a valer{" "}
            <b className="text-foreground">{DIAS_DE_AVISO} dias</b> após o aviso aos
            participantes, e{" "}
            <b className="text-foreground">
              não retiram direitos já adquiridos por quem aderiu sob a versão anterior
            </b>
            . O encerramento do programa não afeta os benefícios de quem já é fundador.
          </p>
        </Clausula>

        <Clausula n="12" titulo="Dados pessoais">
          <p>
            CPF e celular são coletados para identificar a pessoa de forma única, evitar
            fraude e emitir documento fiscal — e são tratados conforme a Política de
            Privacidade. O código enviado ao celular é guardado apenas como resumo
            criptográfico e apagado após o uso ou o vencimento.
          </p>
          <p>
            Quem indica vê quantas contas converteram e quando, mas não recebe os dados
            pessoais de quem entrou pelo seu código.
          </p>
        </Clausula>

        <section className="border-t border-border pt-7">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Histórico de versões
          </h2>
          <ul className="mt-3 space-y-1.5 text-[15px] text-muted-foreground">
            <li>
              <b className="text-foreground">Versão {VERSAO}</b> — {VIGENTE_DESDE}. Publicação
              inicial.
            </li>
          </ul>
          <p className="mt-6 text-sm text-muted-foreground">
            Dúvidas: <Link href="/contato" className="underline underline-offset-4">fale com a gente</Link>.
          </p>
        </section>
      </main>
    </div>
  );
}
