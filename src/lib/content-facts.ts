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

/** Substitui `{{fact:chave}}` pelos valores do registry. Token desconhecido fica visível para diagnóstico. */
export function applyContentFacts(text: string, facts: Map<string, string>): string {
  if (!text || !text.includes('{{fact:')) return text;
  return text.replace(/\{\{fact:([a-z0-9-]+)\}\}/g, (raw, key) => facts.get(key) ?? raw);
}

/** Conveniência: busca o registry e aplica. */
export async function resolveContentFacts(text: string): Promise<string> {
  if (!text || !text.includes('{{fact:')) return text;
  return applyContentFacts(text, await getContentFacts());
}
