/**
 * Quem narra o seu curso (10/08/2026).
 *
 * ## O que já existe no disco, e ninguém ouvia
 *
 * `public/audio/` guarda **172 MB de narração pronta** — o livro sagrado
 * inteiro, capítulo a capítulo, em três vozes profissionais — e nenhuma linha
 * do site apontava para lá. Existiam também as amostras de plataforma
 * (`/audio/platform/test_*.mp3`), geradas justamente para servir de prévia.
 * Este arquivo é o catálogo que liga as duas coisas à tela.
 *
 * ## Por que vozes com nome, e não "famosos"
 *
 * Ricardo pediu "vários que possam narrar seu curso, inclusive você, mas outros
 * famosos de renome". Vozes **profissionais de locução** com nome próprio é o
 * que dá para entregar de verdade: são as que já narraram o livro, estão
 * licenciadas para isto e soam como audiolivro pago. Imitar a voz de uma pessoa
 * pública real é outra coisa — é uso da identidade dela, e não é algo que este
 * produto pode oferecer.
 *
 * ## `disponivel: false` não é enfeite
 *
 * Uma voz só é oferecida quando existe amostra para ouvir. Picker que promete
 * uma voz sem deixar ouvir é o mesmo erro do "Google · Conectado" fixo no HTML:
 * a tela afirma algo que o produto não sustenta.
 */

export interface Narrador {
  id: string;
  nome: string;
  /** Uma linha que descreve o TIMBRE, não a biografia. */
  timbre: string;
  /** Para que tipo de curso esta voz é a melhor escolha. */
  boaPara: string;
  /** Amostra audível de verdade. `null` = ainda não dá para ouvir. */
  amostra: string | null;
  emoji: string;
  cor: string;
  /** Vozes de locução licenciadas x a sua própria x a da IA. */
  tipo: 'locucao' | 'sua' | 'ia';
  disponivel: boolean;
  /** Quando não está disponível, o que falta — dito na tela, sem eufemismo. */
  falta?: string;
}

export const NARRADORES: Narrador[] = [
  {
    id: 'ricardo',
    nome: 'Ricardo Faya',
    timbre: 'A voz de quem escreveu o curso — direta, sem pose de locutor',
    boaPara: 'Quem quer ouvir o autor, e não um narrador contratado',
    amostra: '/audio/platform/test_ricardo.mp3',
    emoji: '👤',
    cor: '#e8913a',
    tipo: 'locucao',
    disponivel: true,
  },
  {
    id: 'fernando_borges',
    nome: 'Fernando Borges',
    timbre: 'Calmo, elegante, ritmo de professor que não tem pressa',
    boaPara: 'Cursos densos, que você vai ouvir por muito tempo',
    amostra: '/audio/platform/test_fernando_borges.mp3',
    emoji: '🎓',
    cor: '#38bdf8',
    tipo: 'locucao',
    disponivel: true,
  },
  {
    id: 'beto',
    nome: 'Beto',
    timbre: 'Amigável e próximo, como alguém explicando na mesa do bar',
    boaPara: 'Assunto novo, quando o medo de não entender é o obstáculo',
    amostra: '/audio/platform/test_beto.mp3',
    emoji: '🤝',
    cor: '#34d399',
    tipo: 'locucao',
    disponivel: true,
  },
  {
    id: 'sergio',
    nome: 'Sérgio',
    timbre: 'Grave, com autoridade — voz de documentário',
    boaPara: 'Conteúdo de estratégia e de decisão',
    amostra: '/audio/platform/test_sergio.mp3',
    emoji: '🎙️',
    cor: '#f5c04e',
    tipo: 'locucao',
    disponivel: true,
  },
  {
    id: 'estive',
    nome: 'Estive',
    timbre: 'Acelerado e vibrante, energia de rede social',
    boaPara: 'Aulas curtas e conteúdo prático de execução rápida',
    amostra: '/audio/platform/test_estive.mp3',
    emoji: '⚡',
    cor: '#fb7185',
    tipo: 'locucao',
    disponivel: true,
  },
  {
    id: 'claude',
    nome: 'A própria IA',
    timbre: 'A voz de quem escreveu a sua camada personalizada',
    boaPara: 'Quem quer ouvir o curso na voz de quem o adaptou para você',
    amostra: null,
    emoji: '🤖',
    cor: '#a78bfa',
    tipo: 'ia',
    disponivel: false,
    falta: 'Estamos gravando o timbre. Assim que houver amostra para ouvir, ela aparece aqui.',
  },
  {
    id: 'sua-voz',
    nome: 'A sua voz',
    timbre: 'O seu curso narrado por você, sem você gravar capítulo por capítulo',
    boaPara: 'Quem vende o próprio conteúdo e quer a marca na voz também',
    amostra: null,
    emoji: '🫵',
    cor: '#f472b6',
    tipo: 'sua',
    disponivel: false,
    falta: 'Precisa de 2 minutos de gravação sua para clonar o timbre — e da sua autorização explícita.',
  },
];

export const NARRADOR_PADRAO = 'fernando_borges';

export function acharNarrador(id: string | undefined | null): Narrador {
  return NARRADORES.find((n) => n.id === id) || NARRADORES.find((n) => n.id === NARRADOR_PADRAO)!;
}

/**
 * Cursos que JÁ têm narração completa gravada, por voz.
 *
 * ## Por que metade vem de arquivo e metade continua à mão
 *
 * A narração do livro sagrado é histórica: 34 arquivos gerados na ElevenLabs
 * até a cota acabar em abril, servidos de `public/audio/`. Aquilo não volta a
 * crescer, então continua escrito aqui.
 *
 * O acervo NOVO é outra coisa. Desde 02/09/2026 a narração sai da voz local
 * (Higgs v3, clonada do Ricardo), é ilimitada e cresce a cada rodada da fila em
 * `autoresearch/cursos/audio/`. Manter isso à mão garantia a lista errada: o
 * áudio subiria e a tela continuaria dizendo "em breve" até alguém lembrar de
 * editar este arquivo. Por isso o manifesto é GERADO por
 * `scripts/publicar-audiobook.mjs` e lido aqui em tempo de build.
 *
 * ⚠️ Em tempo de BUILD, não de requisição — o import de JSON é estático. Depois
 * de publicar áudio novo, é preciso um deploy para a tela enxergar.
 */
import manifestoAudiobook from './audiobook-manifesto.json';

const PRONTAS_HISTORICO: Record<string, string[]> = {
  'ia-sem-filtro-por-claude': ['fernando_borges', 'beto', 'sergio'],
};

function montarProntas(): Record<string, string[]> {
  const saida: Record<string, string[]> = { ...PRONTAS_HISTORICO };
  const cursos = (manifestoAudiobook as { cursos?: Record<string, { narrador?: string }> }).cursos ?? {};
  for (const [slug, dados] of Object.entries(cursos)) {
    const voz = dados?.narrador ?? 'ricardo';
    saida[slug] = Array.from(new Set([...(saida[slug] ?? []), voz]));
  }
  return saida;
}

export const NARRACAO_PRONTA: Record<string, string[]> = montarProntas();

export function temNarracaoPronta(slug: string, narrador: string): boolean {
  return (NARRACAO_PRONTA[slug] || []).includes(narrador);
}

/** Qualquer voz serve — é o que decide se o degrau "Com audiobook" sai de "em breve". */
export function temAlgumaNarracao(slug: string): boolean {
  return (NARRACAO_PRONTA[slug] || []).length > 0;
}
