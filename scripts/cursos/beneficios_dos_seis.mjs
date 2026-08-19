/**
 * Escreve `copy.benefits` dos seis cursos que nasceram sem ele.
 *
 * ── Por que faltava, e por que não é detalhe de vitrine ───────────────────────
 *
 * `publicar_curso.mjs` grava `copy: c.copy || {}` a partir do `curriculo.json`,
 * e o gerador escreve `shortDescription` e `fullDescription` — não `benefits`.
 * Os seis cursos de 18/08 nasceram assim, e mais o `mastering-ai-with-chatgpt`.
 *
 * A página de venda lia `product.copy.benefits.slice(0, 4)` e
 * `product.copy.benefits.map(...)` sem guarda: **ligar qualquer um dos seis
 * derrubaria a própria página que existe para vendê-lo.** A guarda entrou em
 * `CourseSalesPage.tsx` no mesmo dia, mas guarda é rede — ela mostra uma lista
 * genérica ("conteúdo completo", "certificado digital") que serve para
 * qualquer curso e por isso não vende nenhum.
 *
 * ── De onde saiu cada linha ───────────────────────────────────────────────────
 *
 * Dos MÓDULOS do próprio curso, um benefício por módulo, na ordem em que o
 * aluno os encontra. Não é enfeite: benefício que promete o que o curso não
 * ensina é a forma mais cara de reembolso. Cada linha abaixo tem um módulo
 * atrás dela, e o primeiro é sempre o capítulo do "onde a IA mente", que é a
 * abertura de todos os seis e o que separa estes cursos dos que vendem atalho.
 *
 *   node --env-file=.env.local scripts/cursos/beneficios_dos_seis.mjs
 *   node --env-file=.env.local scripts/cursos/beneficios_dos_seis.mjs --gravar
 */
import { MongoClient } from "mongodb";
import { OPCOES_DE_SCRIPT } from "../lib/mongo.mjs";
import { invalidarCache } from "../lib/invalidar-cache.mjs";

const BENEFICIOS = {
  "ia-para-estudar": [
    "Conferir a resposta da IA antes de decorar — o passo que evita seis meses estudando o errado",
    "Transformar um edital de 300 páginas num plano que cabe na sua semana",
    "Virar PDF, artigo e videoaula em pergunta, e pergunta em flashcard",
    "Montar revisão espaçada no Anki sem passar a noite montando baralho",
    "Corrigir redação por critério de banca, não por elogio",
    "Simular a prova com tempo e corrigir o erro certo na véspera",
  ],
  "ia-para-advogados": [
    "Reconhecer a alucinação que a profissão não perdoa: o precedente que não existe",
    "Pesquisar jurisprudência com IA e conferir o acórdão antes de citar",
    "Rascunhar peça e chegar ao arquivo final sem terceirizar a tese",
    "Resumir, comparar e extrair cláusula de contrato longo",
    "Triar documento em volume sem perder o que importa",
    "Montar o fluxo do escritório do zero, ferramenta por ferramenta",
  ],
  "ia-no-consultorio": [
    "Usar IA na administração sem colocar dado de paciente em risco",
    "Automatizar agenda e confirmação, que é onde a falta dói no caixa",
    "Responder a secretaria no horário em que você está atendendo",
    "Escrever material de orientação em linguagem que o paciente entende",
    "Transcrever, anotar e organizar faturamento sem digitar duas vezes",
    "Fechar o sistema: do consultório de um profissional à clínica pequena",
  ],
  "ia-para-rh": [
    "Saber o limite legal e o viés que a triagem automática esconde",
    "Escrever descrição de vaga que atrai o candidato certo",
    "Triar currículo com revisão humana — sem deixar a máquina decidir sobre gente",
    "Conduzir entrevista com roteiro construído a partir da vaga",
    "Montar onboarding e treinamento interno sem começar do zero",
    "Rodar pesquisa de clima e ler o que ela realmente diz",
  ],
  "ganhar-dinheiro-com-ia": [
    "Escolher o serviço que você consegue entregar já nesta semana",
    "Achar o primeiro cliente sem depender de rede social",
    "Orçar por resultado, e não por hora, sem vender barato demais",
    "Entregar com padrão, que é o que faz o cliente voltar",
    "Cobrar e receber sem enrolação",
    "Sair do bico avulso para a renda que se repete todo mês",
  ],
  "ia-para-professores": [
    "Entender por que detector de IA não funciona — e o que fazer no lugar de acusar",
    "Montar plano de aula alinhado à BNCC em minutos, não em fins de semana",
    "Criar prova e gabarito com critério explícito de correção",
    "Corrigir com critério sem terceirizar o julgamento",
    "Adaptar material para o aluno que ficou para trás",
    "Escrever para a família com clareza e sem tom de acusação",
  ],
};

const GRAVAR = process.argv.includes("--gravar");
const client = new MongoClient(process.env.MONGODB_URI, OPCOES_DE_SCRIPT);
await client.connect();
const col = client.db("fayapointProdutos").collection("products");

let n = 0;
for (const [slug, beneficios] of Object.entries(BENEFICIOS)) {
  const d = await col.findOne({ slug }, { projection: { slug: 1, copy: 1, status: 1 } });
  if (!d) { console.log(`⛔ ${slug}: não existe`); continue; }
  const tem = Array.isArray(d.copy?.benefits) ? d.copy.benefits.length : 0;
  console.log(`\n${slug} · ${d.status} · benefits: ${tem} → ${beneficios.length}`);
  if (tem) { console.log("   já tem — não sobrescrevo"); continue; }
  for (const b of beneficios) console.log(`   · ${b}`);
  if (!GRAVAR) continue;
  await col.updateOne({ slug }, { $set: { "copy.benefits": beneficios, updatedAt: new Date() } });
  await invalidarCache(slug);
  n++;
  console.log("   ✓ gravado");
}
console.log(`\n${n} curso(s) ${GRAVAR ? "gravado(s)" : "a gravar — use --gravar"}.`);
await client.close();
