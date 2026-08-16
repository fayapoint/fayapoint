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
3. Os marcadores {{fact:alguma-coisa}} são variáveis do sistema. Copie-os EXATAMENTE como aparecem, na mesma quantidade. Jamais substitua por um nome de modelo.
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
TAMANHO ALVO: cerca de 8000 caracteres no total.
DEVOLVA SÓ O MARKDOWN DO CAPÍTULO.`;

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

  const passos = (saida.match(/^\s*[1-5]\.\s+\*\*/gm) || []).length;
  if (passos !== 5) return `Fluxo de Execução com ${passos} passos em negrito, não 5`;

  if (!/^>\s*\*\*Dica Pro:/im.test(saida)) return "sem a Dica Pro";

  // ⚠️ A checagem que mais importa. Um `{{fact:}}` perdido congela no texto uma
  // informação que existe para não congelar.
  const antes = tokensDeFato(original);
  const depois = tokensDeFato(saida);
  if (antes.join("|") !== depois.join("|")) {
    return `os {{fact:}} mudaram — antes [${antes.join(", ")}] depois [${depois.join(", ")}]`;
  }

  if (/^###\s/m.test(saida)) return "usou cabeçalho ###";
  if (/```/.test(saida)) return "usou bloco de código";
  if (/!\[[^\]]*\]\(/.test(saida)) return "usou imagem markdown";
  // Encolher pela metade é perda de conteúdo, não concisão.
  if (saida.length < original.length * 0.75) {
    return `encolheu demais: ${original.length} → ${saida.length} caracteres`;
  }
  return null;
}

async function padronizarCapitulo(corpo: string, nomeDoCurso: string, tentativa = 0): Promise<string> {
  const res = await generate({
    tier: "free",
    maxTokens: 8000,
    temperature: 0.4,
    messages: [
      { role: "system", content: SISTEMA },
      {
        role: "user",
        content:
          `CURSO: ${nomeDoCurso}\n\nCAPÍTULO ORIGINAL:\n\n${corpo}\n\n` +
          `Reorganize este capítulo no gabarito. Preserve todo fato e todo {{fact:}}.` +
          (tentativa > 0 ? `\n\nATENÇÃO: a tentativa anterior foi reprovada. Siga o gabarito à risca.` : ""),
      },
    ],
  });
  const saida = String(res.content || "")
    .trim()
    .replace(/^```(?:markdown|md)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  const erro = reprovar(corpo, saida);
  if (erro) {
    if (tentativa >= 1) throw new Error(erro);
    console.log(`      ↻ reprovado (${erro}) — refazendo`);
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

  const client = new MongoClient(process.env.MONGODB_URI!);
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
    console.log(
      "\n✅ gravado no banco.\n" +
        "⚠️ O texto picado em capítulos é cacheado (`livro:capitulos:*`, `atelie:capitulos:*`, 1h).\n" +
        "   Sem invalidar, o livro do aluno serve o texto ANTIGO por até uma hora.",
    );
  } else {
    console.log("\n(nada gravado — use --valendo)");
  }

  await client.close();

}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
