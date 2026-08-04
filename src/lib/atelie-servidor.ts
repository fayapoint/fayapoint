import { createHash } from "node:crypto";
import { blocoDePersona, type PersonaProfunda } from "@/lib/persona";
import { generate } from "@/lib/ai/provider";
import type { CapituloDoCurso } from "@/lib/curso-personalizado";

/**
 * O motor da camada personalizada, num lugar só (03/08/2026).
 *
 * ## Por que foi extraído
 *
 * O prompt e o laço de reforço nasceram dentro do `POST
 * /api/user/curso-personalizado`. Quando o Ateliê passou a oferecer uma
 * **amostra grátis**, a saída óbvia seria escrever um prompt "de demonstração"
 * ali — e essa saída óbvia é uma armadilha: a amostra existe para mostrar o que
 * o aluno recebe se pagar. Se ela usasse outro prompt, outro modelo ou outro
 * limite de tokens, seria propaganda enganosa por construção, e a decepção
 * chegaria depois do gasto de créditos, que é o pior momento possível.
 *
 * Então a amostra e a geração paga chamam a MESMA função. A única diferença
 * entre elas é quantos capítulos passam por aqui — um, contra todos.
 */

/**
 * Abaixo disto, a camada não é escrita dentro da aula.
 *
 * Personalizar com persona rasa produz o pior resultado possível: um texto que
 * AFIRMA falar do negócio do aluno e fala de um negócio genérico. Isso é pior
 * do que não personalizar, porque quebra a promessa na cara dele.
 *
 * ⚠️ A amostra do Ateliê ignora esta trava de propósito — lá o texto não entra
 * em aula nenhuma e vem rotulado com a confiança que o produziu.
 */
export const MINIMA_CONFIANCA = 35;

const SISTEMA =
  "Você adapta material didático de IA ao contexto REAL de um aluno brasileiro. " +
  "Responda SEMPRE em JSON válido com as chaves abertura, exemplo e tarefa. " +
  "Regras invioláveis: " +
  "(1) português do Brasil, segunda pessoa, falando COM o aluno; " +
  "(2) cite o ramo e a rotina dele de forma concreta — nada de 'sua empresa' genérico; " +
  "(3) não invente fatos sobre ferramentas nem números de mercado; números do exemplo devem ser plausíveis e declarados como exemplo; " +
  "(4) abertura em até 2 frases, exemplo em até 5 frases, tarefa em 1 frase executável hoje; " +
  "(5) nada de saudação, título ou markdown de cabeçalho — só o texto.";

/**
 * Impressão curta do trecho que gerou a camada.
 *
 * Não precisa ser criptográfica — só precisa mudar quando o capítulo muda, e
 * caber num campo indexável.
 */
export function impressao(texto: string): string {
  return createHash("sha1").update(texto).digest("hex").slice(0, 16);
}

/**
 * O capítulo que vira amostra.
 *
 * ⚠️ Não é `capitulos[0]` por acaso — é a mesma escolha nos dois lados (a tela
 * anuncia qual capítulo vai comparar, o servidor escreve sobre ele). Se um dia
 * a regra mudar (pular introduções, preferir o capítulo mais denso), muda aqui
 * e os dois continuam concordando.
 *
 * A preferência é pelo primeiro capítulo com corpo de verdade: um capítulo de
 * três linhas produz amostra fraca e a amostra é a única chance de convencer.
 */
export function primeiroCapituloUtil(capitulos: CapituloDoCurso[]): CapituloDoCurso | null {
  if (!capitulos.length) return null;
  return capitulos.find((c) => c.corpo.length >= 800) ?? capitulos[0];
}

export interface CamadaEscrita {
  abertura: string;
  exemplo: string;
  tarefa: string;
  model: string;
}

/**
 * Escreve as três peças de UM capítulo para UMA pessoa.
 *
 * Lança quando as três não vierem preenchidas depois de duas tentativas —
 * quem chama decide se isso derruba o capítulo (geração paga: pula e não
 * cobra) ou a requisição inteira (amostra: não há o que mostrar).
 */
export async function escreverCamada({
  persona,
  nomeDoCurso,
  numero,
  titulo,
  trecho,
}: {
  persona: PersonaProfunda;
  nomeDoCurso: string;
  numero: number;
  titulo: string;
  /** Já resolvido pelos `{{fact:}}` — o modelo nunca deve ver token. */
  trecho: string;
}): Promise<CamadaEscrita> {
  const contexto = blocoDePersona(persona, "curso");

  const pedir = async (reforco: boolean): Promise<CamadaEscrita> => {
    const res = await generate({
      // Barato primeiro, caro só quando o barato falha — a mesma ordem que o
      // curso ensina. O tier budget entrega JSON com uma chave vazia em ~13%
      // dos capítulos mesmo com o reforço no prompt.
      tier: reforco ? "premium" : "budget",
      json: true,
      // ⚠️ 3000, não 1000: o DeepSeek V4 raciocina antes de responder e o
      // pensamento sai do mesmo orçamento — apertado, ele devolve `content`
      // VAZIO sem erro nenhum.
      maxTokens: 3000,
      temperature: 0.7,
      messages: [
        { role: "system", content: SISTEMA },
        {
          role: "user",
          content:
            `ALUNO:\n${contexto}\n\n` +
            `CURSO: ${nomeDoCurso}\n` +
            `CAPÍTULO ${numero}: ${titulo}\n\n` +
            `TRECHO DO CAPÍTULO:\n${trecho}\n\n` +
            `Escreva as três peças para ESTE aluno neste capítulo.` +
            (reforco
              ? `\n\nATENÇÃO: a tentativa anterior veio com alguma das três chaves vazia. ` +
                `As três — abertura, exemplo e tarefa — precisam vir preenchidas.`
              : ""),
        },
      ],
    });

    // ⚠️ Nem todo modelo honra `response_format: json_object` do mesmo jeito. O
    // tier premium devolve o JSON dentro de ```json … ``` e o `JSON.parse` cru
    // recusa — o que transformou o escalonamento numa regressão: 4 falhas
    // viraram 12. A cerca sai antes de interpretar.
    const cru = String(res.content || "")
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "");
    const d = JSON.parse(cru);
    return {
      abertura: String(d.abertura || "").trim(),
      exemplo: String(d.exemplo || "").trim(),
      tarefa: String(d.tarefa || "").trim(),
      model: res.model,
    };
  };

  let dados = await pedir(false);
  // A checagem antiga só reprovava se as TRÊS viessem vazias, então uma camada
  // sem `exemplo` — a peça mais valiosa — passava direto e era gravada. Medido
  // em 02/08: 8 de 31 capítulos sem exemplo.
  if (!dados.abertura || !dados.exemplo || !dados.tarefa) {
    dados = await pedir(true);
  }
  if (!dados.abertura || !dados.exemplo || !dados.tarefa) {
    throw new Error("camada incompleta após 2 tentativas");
  }
  return dados;
}
