import { getMongoClient } from '@/lib/products';

/**
 * Fatos voláteis do conteúdo — registry central (fayapointProdutos.content_facts).
 *
 * O conteúdo dos cursos referencia fatos que mudam com o tempo (modelos de LLM,
 * versões de ferramentas, preços) via tokens `{{fact:chave}}`. Este módulo troca
 * os tokens pelos valores atuais na ENTREGA do conteúdo. Quando o mundo muda,
 * o motor de autoresearch atualiza UM documento do registry e todos os cursos
 * ficam atuais de uma vez — sem tocar no courseContent.
 *
 * Regra: tokenizar apenas menções a "estado atual do mundo" (ex.: modelo topo
 * de linha). Menções históricas ("o antigo GPT-4o era...") ficam literais.
 */

interface ContentFact {
  key: string;
  value: string;
  label?: string;
  updatedAt?: Date;
}

let cache: { facts: Map<string, string>; at: number } | null = null;
const CACHE_MS = 5 * 60 * 1000;

export async function getContentFacts(): Promise<Map<string, string>> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.facts;
  const client = await getMongoClient();
  const docs = await client
    .db('fayapointProdutos')
    .collection<ContentFact>('content_facts')
    .find({})
    .toArray();
  const facts = new Map(docs.map((d) => [d.key, d.value]));
  cache = { facts, at: Date.now() };
  return facts;
}

/**
 * Substitui `{{fact:chave}}` pelos valores do registry.
 *
 * ## ⚠️ Token desconhecido é APAGADO, não exibido (03/08/2026)
 *
 * Até hoje esta função devolvia o token cru quando a chave não existia, "para
 * diagnóstico". A intenção era boa e o efeito era o contrário: os seis
 * chamadores são o leitor do aluno, a prévia pública e três prompts de modelo.
 * Não há diagnóstico nenhum nessa lista — só gente pagando e o Googlebot. O
 * diagnóstico ia parar na tela de quem comprou o curso.
 *
 * Medido no catálogo em 03/08: 236 tokens, **2 sem chave no registry**
 * (`{{fact:token}}` e `{{fact:meta-precos}}`, os dois no `ia-no-whatsapp`),
 * aparecendo crus no meio de uma frase para o aluno. É pouco e é o suficiente
 * — a mesma classe de vazamento que a prévia teve, e que custou uma sessão.
 *
 * Agora o texto sai limpo e o aviso vai para o log do servidor, que é onde
 * diagnóstico deve morar. Apagar deixa a frase capenga em vez de quebrada, e
 * capenga o leitor perdoa como erro de digitação — chave entre chaves duplas,
 * não.
 *
 * ⚠️ Apagar NÃO conserta o texto: as duas frases do `ia-no-whatsapp` foram
 * escritas contando com um valor que nunca existiu e precisam ser reescritas
 * pelo laço. Esta função só impede que o defeito seja servido.
 */
export function applyContentFacts(text: string, facts: Map<string, string>): string {
  if (!text || !text.includes('{{fact:')) return text;
  const ausentes: string[] = [];
  const saida = text.replace(/\s*\{\{fact:([a-z0-9-]+)\}\}/g, (raw, key: string) => {
    const valor = facts.get(key);
    if (valor !== undefined) return raw.replace(`{{fact:${key}}}`, valor);
    ausentes.push(key);
    return '';
  });
  if (ausentes.length) {
    console.warn(
      `[content-facts] ${ausentes.length} token(s) sem chave no registry, removidos do texto servido: ${[...new Set(ausentes)].join(', ')}`,
    );
  }
  return saida;
}

/** Conveniência: busca o registry e aplica. */
export async function resolveContentFacts(text: string): Promise<string> {
  if (!text || !text.includes('{{fact:')) return text;
  return applyContentFacts(text, await getContentFacts());
}
