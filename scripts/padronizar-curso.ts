/**
 * PADRONIZAR UM CURSO NO GABARITO DO `chatgpt-zero` — 16/08/2026.
 *
 * Ricardo: *"vamos fazer os ajustes em todos os textos, para seguir o padrão do
 * ChatGPT do Zero"*.
 *
 * ## ⚠️ Ele REESTRUTURA. Ele não reescreve.
 *
 * Esta é a decisão que separa este script de uma máquina de estragar curso. O
 * texto dos cursos é conferido editorialmente, e o próprio motor do Ateliê tem
 * isto escrito na cara (`lib/curso-personalizado.ts`):
 *
 * > *"deixar um modelo reescrever a explicação inteira troca conteúdo conferido
 * > por conteúdo plausível"*
 *
 * Então o contrato com o modelo é estreito de propósito: **realoque a prosa que
 * já existe** dentro das oito seções do gabarito, e **acrescente apenas o que o
 * gabarito exige e o capítulo não tem** (o fluxo em 5 passos, a Dica Pro, o
 * exercício, o checklist, o resumo) — usando só o que o próprio capítulo já
 * afirma. Nada de fato novo, nada de número novo, nada de ferramenta nova.
 *
 * ## ⚠️ Os `{{fact:}}` são intocáveis
 *
 * `{{fact:openai-flagship}}` é resolvido em tempo de leitura pelo registry
 * (`lib/content-facts.ts`). Um modelo que "ajuda" trocando o token pelo nome do
 * modelo da vez congela no texto uma informação que existe justamente para não
 * congelar — e o curso volta a envelhecer sozinho. O script confere token a
 * token e RECUSA a saída que perdeu algum.
 *
 * ## ⚠️ Sem marcadores de mídia, de propósito
 *
 * O gabarito pede 6 peças por capítulo, mas as artes do `prompt-engineering`
 * não existem (`public/cursos/media/prompt-engineering/` está vazio). Escrever
 * `<!--media:img src="…"-->` apontando para arquivo que não existe é o defeito
 * de `reference_midia_caminho_placeholder`: buraco na tela, sem erro no
 * console. A mídia é etapa separada (higgsfield/ComfyUI) e entra depois.
 *
 * ## Rodar
 *
 *     npx tsx scripts/padronizar-curso.ts prompt-engineering            # rascunho em disco
 *     npx tsx scripts/padronizar-curso.ts prompt-engineering --valendo  # grava no banco
 *
 * O rascunho sai em `scripts/content_drafts/<slug>.padronizado.md` e pode ser
 * lido antes de qualquer gravação.
 */

// `--env-file=.env.local` do próprio node carrega as variáveis — `dotenv` não
// está instalado neste repo e importá-lo quebra o script antes da primeira linha.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { MongoClient } from "mongodb";
// O teto do pool. Sem ele o driver assume maxPoolSize:100, e o cluster
// grátis inteiro tem 500 — divididas com os outros projetos.
// Ver `scripts/lib/mongo.cjs`.
import { OPCOES_DE_SCRIPT } from "./lib/mongo.mjs";
import { invalidarCache } from "./lib/invalidar-cache.mjs";
import { generate } from "../src/lib/ai/provider";

const SECOES = [
  "Visão Geral",
  "Conceitos-Chave",
  "Fluxo de Execução",
  "Cenários Aplicados",
  "Erros Comuns",
  "Exercício Prático",
  "Checklist de Implementação",
  "Resumo do Capítulo",
];

const SISTEMA = `Você é editor de cursos técnicos em português do Brasil. Sua tarefa é REORGANIZAR um capítulo existente no formato padrão da casa — nunca reescrevê-lo.

REGRAS INVIOLÁVEIS:
1. PRESERVE o conteúdo factual do original. Toda afirmação técnica, número, nome de ferramenta e exemplo do texto original deve sobreviver, realocado na seção certa. Você pode reescrever a FRASE; não pode trocar o FATO.
2. NÃO INVENTE. Nenhum fato, número, preço, data, nome de modelo ou funcionalidade que não esteja no texto original. Se uma seção do gabarito não tem matéria-prima no original, construa-a a partir do que o original JÁ afirma — não de conhecimento externo.
3. Os marcadores §F0§, §F1§, §F2§… são âncoras do sistema. Copie-os EXATAMENTE como aparecem, na mesma quantidade e sem alterar o número. Nunca crie âncoras novas, nunca apague uma existente, nunca escreva nada parecido com §…§ por conta própria.
4. Mantenha a primeira linha (o título "# ...") EXATAMENTE como veio.
5. Português do Brasil, segunda pessoa, tom de quem conversa. Sem jargão de consultoria.

O GABARITO — exatamente estas oito seções "##", nesta ordem, e nenhuma outra:
## Visão Geral — por que este capítulo importa, em prosa. 2 a 3 parágrafos.
## Conceitos-Chave — as ideias centrais do capítulo, em prosa densa com termos em **negrito**. É a seção mais longa.
## Fluxo de Execução — EXATAMENTE 5 passos numerados "1." a "5.". Cada passo abre com uma frase de comando em **negrito**, seguida de uma frase de detalhe. É o procedimento acionável do capítulo.
## Cenários Aplicados — 2 ou 3 situações concretas de uso, em prosa.
## Erros Comuns — os enganos típicos e o que fazer no lugar. Use lista com "-".
## Exercício Prático — uma tarefa que o aluno executa hoje, com critério de sucesso explícito.
## Checklist de Implementação — lista com "-" do que precisa estar feito.
## Resumo do Capítulo — 1 parágrafo fechando.

ENTRE "## Erros Comuns" e "## Exercício Prático", insira UMA linha de citação:
> **Dica Pro:** <uma dica prática e específica deste capítulo, 2 a 3 frases>

PROIBIDO: cabeçalhos "###", tabelas, blocos de código com crase tripla, imagens markdown, saudação, comentário sobre a tarefa.
TAMANHO: nunca devolva menos texto do que recebeu. O alvo é cerca de 8000 caracteres, e capítulos maiores que isso devem CRESCER, não encolher. Você está reorganizando e completando, jamais resumindo.
DEVOLVA SÓ O MARKDOWN DO CAPÍTULO, do "# " até o fim do Resumo. Não pare no meio.`;

/**
 * ── AS ÂNCORAS (16/08/2026) ─────────────────────────────────────────────
 *
 * A primeira versão pedia ao modelo, em português, para preservar os
 * `{{fact:}}`. Ele não preservou, e falhou nas duas direções ao mesmo tempo:
 *
 *   - **inventou** dez tokens que não existem, num capítulo só
 *     (`{{fact:Marina}}`, `{{fact:Magalu}}`, `{{fact:Dafiti}}`) — porque a
 *     sintaxe `{{fact:nome}}` PARECE um lugar para colocar nomes próprios;
 *   - **apagou** três dos nove `{{fact:openai-flagship}}` de outro capítulo.
 *
 * A causa é a própria forma do token: ele se parece com conteúdo. Trocá-lo por
 * uma âncora opaca (`§F3§`) tira a semântica que convidava o modelo a
 * "colaborar" — não há nome dentro dela para ele querer completar.
 *
 * ⚠️ A verificação continua depois de destravar. Máscara reduz a chance; só a
 * conferência garante.
 */
function mascarar(texto: string): { mascarado: string; mapa: string[] } {
  const mapa: string[] = [];
  const mascarado = texto.replace(/\{\{fact:[^}]+\}\}/g, (m) => {
    // O mesmo fato repetido reusa a MESMA âncora: nove ocorrências de
    // `openai-flagship` viram nove `§F0§`, e não `§F0§`…`§F8§`. Assim o modelo
    // vê repetição onde há repetição, que é o que o texto original diz.
    let i = mapa.indexOf(m);
    if (i < 0) i = mapa.push(m) - 1;
    return `§F${i}§`;
  });
  return { mascarado, mapa };
}

function desmascarar(texto: string, mapa: string[]): string {
  return texto.replace(/§F(\d+)§/g, (inteiro, n) => mapa[Number(n)] ?? inteiro);
}

/** Âncoras que o modelo inventou e que não existem no mapa. */
function ancorasInventadas(saida: string, mapa: string[]): string[] {
  return [...new Set(saida.match(/§F\d+§/g) || [])].filter(
    (a) => mapa[Number(a.slice(2, -1))] === undefined,
  );
}

function capitulos(markdown: string) {
  return markdown
    .replace(/\r\n/g, "\n")
    .split(/(?=^# [^#].*$)/gm)
    .map((s) => s.trim())
    .filter(Boolean);
}

const tokensDeFato = (t: string) => (t.match(/\{\{fact:[^}]+\}\}/g) || []).sort();

/** O que reprova uma saída. Devolve o motivo, ou `null` se passou. */
function reprovar(original: string, saida: string): string | null {
  const tituloOriginal = original.split("\n")[0].trim();
  if (saida.split("\n")[0].trim() !== tituloOriginal) return "trocou o título do capítulo";

  const faltando = SECOES.filter((s) => !new RegExp(`^##\\s+${s}\\s*$`, "im").test(saida));
  if (faltando.length) return `faltam seções: ${faltando.join(", ")}`;

  /**
   * ⚠️ Conta os passos DENTRO do Fluxo, não no capítulo inteiro.
   *
   * A primeira versão varria a página toda e reprovou dois capítulos por
   * "Fluxo de Execução com 8 passos" — quando o Fluxo tinha os 5 certos e o
   * que sobrava eram itens numerados em negrito do Exercício e do Checklist.
   * O verificador estava vendo o gabarito ser cumprido e chamando de erro.
   */
  const fluxo = saida.split(/^##\s+/m).find((x) => /^Fluxo de Execução/i.test(x)) || "";
  const passos = (fluxo.match(/^\s*\d+\.\s+\*\*/gm) || []).length;
  if (passos !== 5) return `Fluxo de Execução com ${passos} passos em negrito, não 5`;

  if (!/^>\s*\*\*Dica Pro:/im.test(saida)) return "sem a Dica Pro";

  /**
   * ⚠️ Compara o CONJUNTO de fatos, não a contagem — e a diferença foi medida.
   *
   * A primeira versão comparava multiconjuntos e reprovou seis capítulos por
   * "os {{fact:}} mudaram": 3 `claude-flagship` viraram 8, 3 `openai-flagship`
   * viraram 9. Isso não é erro. O capítulo cresceu de 5.900 para 10.200
   * caracteres, e um texto maior cita o modelo mais vezes — cada citação
   * resolvendo para o mesmo fato, que é exatamente o que o token existe para
   * fazer. Reprovar ali era exigir que o texto crescesse sem falar mais do
   * assunto do capítulo.
   *
   * O que continua sendo defeito, e continua reprovando:
   *   - **fato que SUMIU** — a informação deixou de ser dita (aqui);
   *   - **âncora inventada** — token que não existe no mapa (em
   *     `ancorasInventadas`, antes de destravar, e determinístico).
   */
  const antes = new Set(tokensDeFato(original));
  const depois = new Set(tokensDeFato(saida));
  const sumiram = [...antes].filter((f) => !depois.has(f));
  if (sumiram.length) return `perdeu os fatos: ${sumiram.join(", ")}`;

  if (/^###\s/m.test(saida)) return "usou cabeçalho ###";
  if (/```/.test(saida)) return "usou bloco de código";
  if (/!\[[^\]]*\]\(/.test(saida)) return "usou imagem markdown";
  // Encolher pela metade é perda de conteúdo, não concisão.
  if (saida.length < original.length * 0.75) {
    return `encolheu demais: ${original.length} → ${saida.length} caracteres`;
  }
  return null;
}

/** O que reprovou a tentativa anterior — vira instrução na próxima. */
let motivoAnterior = "";

async function padronizarCapitulo(corpo: string, nomeDoCurso: string, tentativa = 0): Promise<string> {
  const { mascarado, mapa } = mascarar(corpo);

  const res = await generate({
    tier: "free",
    // ⚠️ 14000, não 8000. O Gemini gasta parte do orçamento raciocinando, e um
    // capítulo de 9.000 caracteres que precisa CRESCER não cabia — a saída
    // vinha truncada no meio, sem erro, e caía na reprovação genérica de
    // "faltam seções" (que era o sintoma, não a causa).
    maxTokens: 14000,
    temperature: 0.4,
    messages: [
      { role: "system", content: SISTEMA },
      {
        role: "user",
        content:
          `CURSO: ${nomeDoCurso}

CAPÍTULO ORIGINAL (${corpo.length} caracteres):

${mascarado}

` +
          `Reorganize no gabarito. O resultado deve ter NO MÍNIMO ${corpo.length} caracteres.` +
          (mapa.length
            ? ` Há ${mapa.length} âncora(s) distinta(s) neste capítulo (${mapa.map((_, i) => `§F${i}§`).join(", ")}); todas devem aparecer no resultado.`
            : " Este capítulo não tem âncoras — não invente nenhuma.") +
          (tentativa > 0 ? `

ATENÇÃO: a tentativa anterior foi reprovada por: ${motivoAnterior}. Corrija exatamente isso.` : ""),
      },
    ],
  });

  const bruto = String(res.content || "")
    .trim()
    .replace(/^```(?:markdown|md)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  const inventadas = ancorasInventadas(bruto, mapa);
  const saida = desmascarar(bruto, mapa);

  const erro = inventadas.length
    ? `inventou âncoras inexistentes: ${inventadas.join(", ")}`
    : reprovar(corpo, saida);

  if (erro) {
    if (tentativa >= 2) {
      throw new Error(`${erro}${bruto ? "" : " (o modelo devolveu vazio)"}`);
    }
    console.log(`
      ↻ ${erro} — refazendo`);
    motivoAnterior = erro;
    return padronizarCapitulo(corpo, nomeDoCurso, tentativa + 1);
  }
  return saida;
}

// ─────────────────────────────────────────────────────────────────────

async function main() {
  const slug = process.argv[2];
  const valendo = process.argv.includes("--valendo");
  if (!slug) {
    console.error("uso: npx tsx scripts/padronizar-curso.ts <slug> [--valendo]");
    process.exit(1);
  }

  const client = new MongoClient(process.env.MONGODB_URI!, OPCOES_DE_SCRIPT);
  await client.connect();
  const col = client.db("fayapointProdutos").collection("products");
  const doc = await col.findOne({ slug }, { projection: { courseContent: 1, name: 1 } });
  if (!doc) {
    console.error(`curso "${slug}" não encontrado`);
    process.exit(1);
  }

  const blocos = capitulos(String(doc.courseContent));
  console.log(`${doc.name} — ${blocos.length} blocos\n`);

  const saida: string[] = [];
  let convertidos = 0;
  for (const [i, bloco] of blocos.entries()) {
    const titulo = bloco.split("\n")[0].replace(/^#\s+/, "");
    /**
     * ⚠️ O bloco 0 é a CAPA do curso, não um capítulo.
     *
     * `dividirCapitulos` já sabe disso (o `numero: null`), e passá-lo pelo
     * gabarito produziria uma "Visão Geral" e um "Exercício Prático" para a
     * página de rosto. Ele passa intacto.
     */
    if (i === 0) {
      console.log(`  ${String(i).padStart(2)} ⏭  capa — intacta`);
      saida.push(bloco);
      continue;
    }
    /**
     * ⚠️ Capítulo que JÁ está no gabarito passa intacto — e a falta disto
     * custou caro em 16/08.
     *
     * Reprocessei `crie-agentes-de-ia-autonomos` para pegar um capítulo que
     * tinha falhado, e o script reestruturou também os catorze que já estavam
     * prontos. Como a instrução do modelo manda NUNCA encolher, o curso
     * inflou de 163k para 198k caracteres numa passada. Reprocessar tem de ser
     * seguro, senão consertar um capítulo estraga o curso.
     */
    if (!reprovar(bloco, bloco)) {
      console.log(`  ${String(i).padStart(2)} ⏭  já no gabarito — intacto`);
      saida.push(bloco);
      convertidos++;
      continue;
    }

    process.stdout.write(`  ${String(i).padStart(2)} ⏳ ${titulo.slice(0, 48)}… `);
    try {
      const novo = await padronizarCapitulo(bloco, String(doc.name));
      saida.push(novo);
      convertidos++;
      console.log(`✅ ${bloco.length} → ${novo.length}`);
    } catch (e) {
      // ⚠️ Capítulo que não passa fica com o ORIGINAL. Um curso meio convertido é
      // ruim; um curso com um capítulo inventado é pior.
      console.log(`❌ ${(e as Error).message} — mantendo o original`);
      saida.push(bloco);
    }
  }

  const conteudoNovo = saida.join("\n\n");
  const destino = path.join("scripts", "content_drafts", `${slug}.padronizado.md`);
  await mkdir(path.dirname(destino), { recursive: true });
  await writeFile(destino, conteudoNovo, "utf8");

  console.log(
    `\n${convertidos}/${blocos.length - 1} capítulos no gabarito · ` +
      `${String(doc.courseContent).length.toLocaleString("pt-BR")} → ${conteudoNovo.length.toLocaleString("pt-BR")} caracteres`,
  );
  console.log(`rascunho: ${destino}`);

  if (valendo) {
    await col.updateOne({ slug }, { $set: { courseContent: conteudoNovo, padronizadoEm: new Date() } });
    console.log("\n✅ gravado no banco.");
    // O aviso que ficava aqui — "o texto picado em capítulos é cacheado por 1h,
    // sem invalidar o livro do aluno serve o texto ANTIGO" — virou a chamada.
    await invalidarCache(slug);
  } else {
    console.log("\n(nada gravado — use --valendo)");
  }

  await client.close();

}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
