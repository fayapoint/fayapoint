import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  FileText,
  Quote,
  ShieldCheck,
  Timer,
} from "lucide-react";
import {
  HOTMART_CHECKOUT,
  PRECO_EBOOK,
} from "@/lib/pasta-viva/config";
import { SEMENTES } from "@/data/pasta-viva/sementes";
import { TIER_CONFIGS } from "@/lib/course-tiers";

/**
 * A PÁGINA DE VENDAS DO EBOOK + PASTA VIVA — 10/09/2026
 *
 * ## Todo número desta página sai de código
 *
 * Páginas e capítulos vêm das constantes abaixo, que foram MEDIDAS no PDF em
 * 09/09 (`autoresearch/FATOS_HOTMART_2026-09-09.md`); o tamanho do acervo vem
 * de `SEMENTES.length`; o preço do Expert vem de `TIER_CONFIGS`. Nada digitado
 * à mão. Foi número digitado à mão que manteve "31 capítulos" no ar em seis
 * lugares para um livro de 30.
 *
 * ## O que esta página NÃO faz
 *
 * Não promete renda, valor nem prazo — nem como número, nem como insinuação
 * ("em poucas semanas", "resultados rápidos"). Além de ser regra da marca, é
 * política da Hotmart: o e-mail de aprovação avisa que produtos aprovados são
 * reverificados e que conteúdo fora da política ganha prazo para ajuste.
 *
 * A prova que a página usa é a que existe: o trabalho publicado do autor e a
 * apuração do acervo. Não há depoimento porque não há comprador para depor —
 * inventar um seria o caminho mais curto para o reembolso e para a queda da
 * conta.
 */

/** Medidos no PDF em 09/09/2026 — ver FATOS_HOTMART_2026-09-09.md. */
const PAGINAS = 120;
const CAPITULOS = 30;
const MODULOS = 6;

export const metadata: Metadata = {
  title: "Ganhar dinheiro com IA: preste serviços e seja pago | FayAI",
  description: `Ebook de ${PAGINAS} páginas e ${CAPITULOS} capítulos sobre prestar serviço com IA — escolher o serviço, achar o primeiro cliente, orçar, entregar e cobrar. Vem com a Pasta Viva, o acervo que se atualiza.`,
};

const MODULOS_LISTA = [
  "O terreno: o que a IA faz e onde ela mente",
  "Escolher o serviço e o cliente",
  "Orçar e vender",
  "Entregar com padrão",
  "Cobrar e repetir",
  "Escalar para renda previsível",
];

export default function VendaGanharDinheiroComIA() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <section className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Ebook + acervo que se atualiza
        </p>
        <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-bold leading-tight text-foreground sm:text-5xl">
          Não é sobre usar IA.
          <br />É sobre ser pago por isso.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground">
          A maioria do material sobre ganhar dinheiro com IA para na parte fácil:
          mostra a ferramenta e some quando chega a hora de cobrar. Este faz o
          caminho inteiro — escolher o serviço, achar o primeiro cliente, orçar
          sem chutar, entregar com padrão e cobrar sem constrangimento.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href={HOTMART_CHECKOUT}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:opacity-90"
          >
            Comprar por R$ {PRECO_EBOOK} <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
          <Link
            href="/pasta-viva"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-base font-semibold text-foreground hover:bg-muted"
          >
            Ver a Pasta Viva
          </Link>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          PDF, entrega imediata, leitura em qualquer aparelho. 7 dias para pedir
          reembolso, sem justificativa.
        </p>
      </section>

      <section className="mt-14 grid gap-3 sm:grid-cols-4">
        <Numero valor={String(PAGINAS)} rotulo="páginas" />
        <Numero valor={String(CAPITULOS)} rotulo="capítulos" />
        <Numero valor={String(MODULOS)} rotulo="módulos" />
        <Numero valor={String(SEMENTES.length)} rotulo="métodos no acervo" />
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-bold text-foreground">
          O que muda quando o livro vem com um acervo vivo
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Um PDF envelhece. Ferramenta muda de preço, sai do ar, muda de regra —
          e o livro continua dizendo o que dizia. A Pasta Viva existe para essa
          parte: é a área no site onde o acervo de métodos é revisado, e onde
          cada método tem página própria.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Cartao
            icone={<CalendarDays className="h-5 w-5" aria-hidden />}
            titulo="Revisado, não reescrito"
            texto="Método que sai de uso é arquivado e continua consultável. O acervo nunca apaga: dá para ver o que valia em cada momento."
          />
          <Cartao
            icone={<Quote className="h-5 w-5" aria-hidden />}
            titulo="Toda linha com fonte"
            texto="Cada método diz de onde saiu — capítulo, canal, publicação — com data. Sem fonte, não entra."
          />
          <Cartao
            icone={<Timer className="h-5 w-5" aria-hidden />}
            titulo="Escolha por tempo, não por promessa"
            texto="Cada método mostra quanto custa começar e quantas horas até a primeira entrega possível. É por aí que se decide o que fazer hoje à noite."
          />
        </div>
      </section>

      <section className="mt-16 rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
          O que este material não faz
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Não promete valor, prazo nem renda — e diz isso na primeira página.
          Ninguém pode prometer isso honestamente, e material que promete está
          vendendo esperança, não método. No acervo, a coluna de retorno fica
          escrita <span className="text-foreground">&quot;ainda não medimos&quot;</span>{" "}
          enquanto for verdade, em vez de exibir um número confortável.
        </p>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Se você quer promessa de dinheiro fácil, não é isto aqui — e é melhor
          saber agora do que depois de pagar.
        </p>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-bold text-foreground">O caminho, na ordem</h2>
        <ol className="mt-6 space-y-3">
          {MODULOS_LISTA.map((m, i) => (
            <li
              key={m}
              className="flex items-center gap-4 rounded-lg border border-border p-4"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {i + 1}
              </span>
              <span className="text-sm font-medium text-foreground">{m}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-bold text-foreground">Quem escreveu</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Ricardo Faya — editor de vídeo profissional desde 1998: rede de
          broadcast sob a 20th Century Fox, Copa do Mundo na Rússia e no Brasil,
          o longa Emanuelle in Rio, o Ziraldo TV Show. Hoje constrói sistemas de
          IA que rodam em máquina própria. Nos últimos 9 meses, sozinho: 778
          capítulos de curso escritos e ilustrados, 2.062 imagens e 629 vídeos
          gerados em GPU local, uma plataforma no ar 24 horas.
        </p>
        <Link
          href="/casos"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          Ver o trabalho <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-bold text-foreground">Perguntas diretas</h2>
        <dl className="mt-6 space-y-5">
          <Pergunta
            p="Serve para quem nunca vendeu nada?"
            r="Serve — o material começa pelo primeiro serviço, não pelo décimo. O primeiro método do acervo custa R$ 0 e leva duas horas."
          />
          <Pergunta
            p="É vídeo ou curso com aula ao vivo?"
            r={`Não. É PDF: ${PAGINAS} páginas, ${CAPITULOS} capítulos, para ler no seu ritmo. Sem live, sem grupo, sem prazo.`}
          />
          <Pergunta
            p="Quanto dá para ganhar?"
            r="Ninguém pode responder isso, e quem responde está inventando. O que o material faz é tirar você do 'não sei o que oferecer' e te dar um preço defensável."
          />
          <Pergunta
            p="A Pasta Viva custa à parte?"
            r={`Não. Ela vem com o ebook. Assinantes do plano ${TIER_CONFIGS.expert.displayName} também entram, sem comprar o ebook.`}
          />
          <Pergunta
            p="Como recebo o acesso à Pasta Viva?"
            r="O código está na primeira página do PDF. Você resgata uma vez em fayai.com.br/pt-BR/pasta-viva/entrar e o acesso fica permanente na sua conta."
          />
        </dl>
      </section>

      <section className="mt-16 rounded-xl border border-border bg-card p-8 text-center">
        <BookOpen className="mx-auto h-8 w-8 text-primary" aria-hidden />
        <h2 className="mt-4 text-2xl font-bold text-foreground">
          {PAGINAS} páginas, {CAPITULOS} capítulos e um acervo que continua
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Entrega imediata. Sete dias para pedir reembolso sem precisar
          justificar.
        </p>
        <a
          href={HOTMART_CHECKOUT}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:opacity-90"
        >
          Comprar por R$ {PRECO_EBOOK} <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
      </section>

      <section className="mt-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <FileText className="h-3.5 w-3.5" aria-hidden />
        Quer divulgar e ganhar comissão?{" "}
        <Link href="/afiliados" className="underline underline-offset-4">
          Veja o programa de afiliados
        </Link>
      </section>
    </main>
  );
}

function Numero({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-center">
      <p className="text-3xl font-bold tabular-nums text-foreground">{valor}</p>
      <p className="mt-1 text-xs text-muted-foreground">{rotulo}</p>
    </div>
  );
}

function Cartao({
  icone,
  titulo,
  texto,
}: {
  icone: React.ReactNode;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <span className="text-primary">{icone}</span>
      <h3 className="mt-3 text-sm font-semibold text-foreground">{titulo}</h3>
      <p className="mt-2 text-xs text-muted-foreground">{texto}</p>
    </div>
  );
}

function Pergunta({ p, r }: { p: string; r: string }) {
  return (
    <div className="border-b border-border pb-5 last:border-0">
      <dt className="text-sm font-semibold text-foreground">{p}</dt>
      <dd className="mt-1.5 text-sm text-muted-foreground">{r}</dd>
    </div>
  );
}
