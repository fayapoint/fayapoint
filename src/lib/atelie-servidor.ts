import { createHash } from "node:crypto";
import { blocoDePersona, type PersonaProfunda } from "@/lib/persona";
import { generate } from "@/lib/ai/provider";
import type { CapituloDoCurso } from "@/lib/curso-personalizado";
import { instrucoesDeAjuste, type Ajustes } from "@/lib/atelie";

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
  /**
   * ── A REGRA 3B, DE 16/08/2026 ────────────────────────────────────────────
   *
   * Ricardo: *"num momento ele me chamou de mulher de aproximadamente 35 anos"*.
   *
   * O conserto principal é estrutural e mora em `gruposDePrompt`: o público
   * deixou de morar dentro do bloco do aluno. Esta regra é o cinto de segunda
   * volta — porque a estrutura organiza o que o modelo LÊ, e a regra diz o que
   * ele NÃO PODE ESCREVER. Custa 40 tokens e evita a única falha deste produto
   * que faz alguém fechar a página e não voltar.
   *
   * ⚠️ Ela nomeia os quatro traços concretos (gênero, idade, profissão, dores).
   * "Não confunda o aluno com o público" é abstrato demais para um modelo
   * pequeno; "não escreva que ele é uma mulher de 35 anos" não é.
   */
  "(3b) IDENTIDADE — o aluno e o público do aluno são pessoas DIFERENTES. " +
  "Nunca atribua ao aluno o gênero, a idade, a profissão ou as dores que estiverem descritos no bloco do PÚBLICO. " +
  "Se o gênero ou a idade do aluno não estiverem declarados no bloco do ALUNO, escreva sem citar nenhum dos dois — jamais suponha; " +
  // ⚠️ **O TAMANHO NÃO MORA AQUI.** Ele vem da escada `TAMANHOS` de
  // `lib/atelie.ts`, que entra como "ajustes deste aluno" e vence qualquer
  // número escrito antes. Repetir a medida nas duas pontas garante que um dia
  // a tela prometa um tamanho e o texto saia outro — foi assim que o "padrão
  // da casa" ficou em dez frases por capítulo sem ninguém decidir isso.
  "(4) siga à risca o tamanho e a estrutura pedidos nos ajustes do aluno; " +
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
  nomeDoAluno,
  nomeDoCurso,
  numero,
  titulo,
  trecho,
  ajustes,
}: {
  persona: PersonaProfunda;
  /**
   * O nome de conta do aluno. Vai como primeira linha do bloco ALUNO.
   *
   * ⚠️ Não é enfeite: sem nome, a descrição mais concreta de uma pessoa em todo
   * o prompt era a do público — e o modelo escreve sobre quem ele consegue
   * enxergar. Um nome próprio no topo do bloco certo ancora o "você".
   */
  nomeDoAluno?: string;
  nomeDoCurso: string;
  numero: number;
  titulo: string;
  /** Já resolvido pelos `{{fact:}}` — o modelo nunca deve ver token. */
  trecho: string;
  /**
   * O que o aluno escolheu para ESTE curso (10/08/2026): tom, profundidade,
   * tamanho e foco. Vem de `AtelieConfig`.
   *
   * ⚠️ Entra DEPOIS das regras invioláveis e como "ajustes deste aluno" — se
   * entrasse antes, um ajuste do usuário poderia contradizer a regra do
   * português ou a proibição de inventar número, que são do produto e não dele.
   * Ausente, o comportamento é exatamente o de antes.
   */
  ajustes?: Ajustes;
}): Promise<CamadaEscrita> {
  const contexto = blocoDePersona(persona, "curso", { nome: nomeDoAluno });
  const comoEscrever = ajustes ? instrucoesDeAjuste(ajustes, persona.voz?.emoji) : "";
  /**
   * O modelo que ESTE aluno escolheu para ESTE curso, se escolheu.
   *
   * `generate` trata `model` como preferência, não como ordem: ele entra na
   * frente da corrente e o resto continua atrás como rede. É a semântica certa
   * — a escolha do aluno é respeitada, e uma indisponibilidade da OpenRouter
   * não vira um livro que não escreve.
   */
  const preferido = ajustes?.modelo && ajustes.modelo !== "auto" ? ajustes.modelo : undefined;

  const pedir = async (reforco: boolean): Promise<CamadaEscrita> => {
    const res = await generate({
      model: reforco ? undefined : preferido,
      // ⚠️ `free` = Gemini 3 Flash desde 12/08, e a troca vale por três razões
      // medidas no mesmo dia: o budget é o DeepSeek, que levou **52s** contra
      // 2,4s do Gemini na mesma chamada; que devolvia JSON com chave vazia em
      // ~13% dos capítulos; e que gastava metade do orçamento de tokens
      // raciocinando — era ele quem apertava o texto que o Ricardo achou
      // pequeno. Um livro de 16 capítulos deixa de levar doze minutos.
      tier: reforco ? "premium" : "free",
      json: true,
      // 4000 (era 3000) porque o texto cresceu: exemplo de 10 a 14 frases e
      // tarefa em passos não cabem no orçamento antigo sem sair truncados.
      maxTokens: 4000,
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
            (comoEscrever ? `AJUSTES QUE ESTE ALUNO PEDIU PARA ESTE CURSO:\n${comoEscrever}\n\n` : "") +
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
