/* ⚠️ ARQUIVO GERADO — NÃO EDITE AQUI.
 * Fonte: worldforge-fayai/engine/prompts/llm.ts
 * Edite lá e rode: node scripts/forja/sincronizar-engine.mjs
 * Conferir se a cópia está em dia: node scripts/forja/sincronizar-engine.mjs --conferir
 */
/**
 * OS PROMPTS DE MODELO — a revisão completa (27/08/2026).
 *
 * ## O que estava errado nos prompts herdados
 *
 * O WorldForge foi escrito para uma série sobrenatural. Os prompts diziam
 * "award-winning character designer", "psychologically complex characters that
 * leap off the page", "supernatural thriller universe". Aplicados ao dono de
 * uma loja de bairro que quer um Reel sobre orçamento, produzem exatamente o
 * que se pediu: personagem de ficção premiada, e nenhum post.
 *
 * Três defeitos estruturais, e o que cada um virou aqui:
 *
 * 1. **Falavam inglês para quem lê português.** O resultado saía em inglês, e
 *    a tradução na volta perdia o tom. Aqui o modelo escreve PT-BR e devolve
 *    separadamente o `*En` visual, que é o único pedaço que a máquina lê.
 * 2. **Pediam qualidade, não fatos.** "Be bold, specific, and memorable" é
 *    torcida. O que produz especificidade é ENTREGAR o específico: o ticket, a
 *    objeção, a cidade, o que ela vende. Todo prompt aqui começa pelo perfil
 *    real e proíbe inventar dado que não está lá.
 * 3. **Confundiam quem fala com quem ouve.** É o defeito que fez o gerador de
 *    livro chamar o Ricardo de "mulher de aproximadamente 35 anos". Aqui o
 *    criador e o público dele entram em blocos separados e rotulados, e há uma
 *    regra explícita proibindo transferir atributo de um para o outro.
 *
 * ## A regra que atravessa todos
 *
 * O modelo escolhe entre OPÇÕES FECHADAS e escreve a AÇÃO. Ele nunca escreve o
 * prompt final de imagem ou de vídeo — isso é composto por código
 * (`prompts/imagem.ts`, `prompts/video.ts`). É o que impede o vocabulário de
 * degradar de uma geração para a outra.
 */

import { listarParaOModelo } from "../vocabulario";
import type { Personagem, PersonaEntrada } from "../personagem";

// ─────────────────────────────────────────────────────────────────────
// Os blocos de contexto — montados uma vez, usados por todos
// ─────────────────────────────────────────────────────────────────────

/**
 * O bloco do CRIADOR. Quem aparece, quem fala, quem assina.
 *
 * ⚠️ Nunca inclui nada do público. A separação é o ponto do arquivo.
 */
export function blocoCriador(p: PersonaEntrada, nome?: string): string {
  const i = p.identidade || {};
  const n = p.negocio || {};
  const e = p.estrategia || {};
  const v = p.voz || {};
  const linhas: string[] = ["## QUEM É O CRIADOR (é ELE que aparece e assina)"];

  if (nome) linhas.push(`Nome: ${nome}`);
  if (i.marca) linhas.push(`Marca: ${i.marca}`);
  if (i.papel) linhas.push(`Faz: ${i.papel}`);
  if (i.cidade) linhas.push(`Onde: ${i.cidade}`);
  if (n.oQueVende) linhas.push(`Vende: ${n.oQueVende}`);
  if (n.ticket) linhas.push(`Ticket médio: R$ ${n.ticket}`);
  if (n.canal) linhas.push(`Vende por: ${n.canal}`);
  if (n.orgulho) linhas.push(`Do que se orgulha: ${n.orgulho}`);
  if (e.pilares?.length) linhas.push(`Assuntos dele: ${e.pilares.join("; ")}`);
  if (e.assinatura) linhas.push(`Chamada que costuma usar: "${e.assinatura}"`);
  if (v.vocabulario) linhas.push(`Palavras dele: ${v.vocabulario}`);
  if (v.bordoes?.length) linhas.push(`Bordões: ${v.bordoes.join("; ")}`);
  if (v.amostra) linhas.push(`Amostra do jeito de escrever dele:\n"""\n${v.amostra.slice(0, 600)}\n"""`);
  if (e.naoFalar?.length) linhas.push(`⛔ NUNCA fale sobre: ${e.naoFalar.join(", ")}`);

  const tratamento = i.tratamento;
  linhas.push(
    tratamento === "ele"
      ? "Trate-o no masculino."
      : tratamento === "ela"
        ? "Trate-a no feminino."
        : "⚠️ O gênero dele NÃO foi declarado: escreva sem marcar gênero nenhum.",
  );

  return linhas.length > 1 ? linhas.join("\n") : "";
}

/** O bloco do PÚBLICO. Para quem a peça fala — outra pessoa, sempre. */
export function blocoPublico(p: PersonaEntrada): string {
  const pu = p.publico || {};
  const n = p.negocio || {};
  const linhas: string[] = ["## PARA QUEM A PEÇA FALA (é OUTRA pessoa, não o criador)"];

  if (pu.quemE) linhas.push(`Quem é: ${pu.quemE}`);
  if (pu.idade) linhas.push(`Idade: de ${pu.idade[0]} a ${pu.idade[1]} anos`);
  if (pu.lugares?.length) linhas.push(`Onde vive: ${pu.lugares.join(", ")}`);
  if (pu.dores?.length) linhas.push(`O que dói: ${pu.dores.join("; ")}`);
  if (pu.desejos?.length) linhas.push(`O que quer: ${pu.desejos.join("; ")}`);
  if (n.objecao) linhas.push(`O que diz quando não vai comprar: "${n.objecao}"`);

  return linhas.length > 1 ? linhas.join("\n") : "";
}

/**
 * O bloco dos PERSONAGENS já cadastrados — quem pode aparecer no quadro.
 *
 * ⚠️ A regra do `id` no fim não é decoração. Medido em 27/08/2026, na primeira
 * geração de verdade: o modelo escreveu "**O criador1** está na oficina" dentro
 * de `acao` — o identificador interno, em português, no texto que o dono lê na
 * tela. Ele fez o óbvio: recebeu um rótulo, tratou o rótulo como nome.
 *
 * O `id` serve a UM campo só (`quemAparece`), e o texto tem de falar de gente.
 */
export function blocoElenco(personagens: Personagem[]): string {
  if (!personagens.length) return "";
  const linhas = ["## ELENCO DISPONÍVEL"];
  for (const p of personagens) {
    const partes = [`- id: ${p._id || p.nome} · nome: ${p.nome}`];
    if (p.papel) partes.push(`(${p.papel})`);
    if (p.origem === "criador") partes.push("— é o próprio criador");
    if (p.origem === "publico") partes.push("— é o cliente típico dele");
    if (p.referencias?.length || p.caderno?.imagens?.length) partes.push("· tem rosto travado por foto");
    linhas.push(partes.join(" "));
  }
  linhas.push("");
  linhas.push(
    "⚠️ O `id` acima é código interno e serve APENAS para preencher `quemAparece`. NUNCA escreva o id em `acao`, `acaoEn`, `titulo`, `fala` ou `legenda` — nesses campos fale de gente: 'ele', 'a pessoa', 'o dono', 'a cliente'. Um id no texto é um defeito visível para quem lê.",
  );
  return linhas.join("\n");
}

// ─────────────────────────────────────────────────────────────────────
// 1 — A PEÇA (o storyboard)
// ─────────────────────────────────────────────────────────────────────

/**
 * O sistema da peça — o que o modelo é, e as sete coisas que ele nunca faz.
 *
 * Cada regra aqui existe porque a ausência dela produziu defeito medido. As de
 * coerência de câmera vieram da primeira geração de verdade (20/08/2026); a de
 * criador-vs-público veio do gerador de livro; a de "isso não é imagem" veio de
 * quadros que diziam "mostrar profissionalismo", que nenhum gerador desenha.
 */
export const SISTEMA_PECA = [
  "Você é diretor de arte e roteirista de conteúdo curto. Recebe o perfil REAL de um criador brasileiro e devolve um STORYBOARD produzível — um plano de filmagem, não um texto de post.",
  "",
  "REGRAS:",
  "- Português do Brasil, tom de quem conversa. Nada de jargão de agência, nada de 'alavancar', 'potencializar', 'jornada'.",
  "- O CRIADOR e o PÚBLICO DELE são pessoas diferentes, e vêm em blocos separados. NUNCA atribua ao criador o gênero, a idade, a profissão ou as dores listadas no bloco do público.",
  "- Cada quadro descreve o que SE VÊ, em uma frase visual e concreta. 'Mostrar profissionalismo' não é imagem. 'Ele fecha o caderno e empurra o orçamento pela mesa' é.",
  "- Use o que o perfil traz de concreto: a cidade, o que vende, o ticket, a objeção que ele ouve. NÃO invente dado que não está lá — se faltar, escreva sem o dado.",
  "- O texto na tela é curto: no máximo 7 palavras por quadro.",
  "- Escolha os ajustes SOMENTE entre os valores permitidos. Devolva a CHAVE à esquerda, nunca a descrição.",
  "- Coerência de câmera: 'pov' e 'over-shoulder' não combinam com enquadramento de rosto. Em POV vê-se o que a pessoa vê, não ela.",
  "- Quadro de objeto, print ou detalhe — sem pessoa — usa 'extreme-close', 'flat-lay' ou 'tela'. Nunca 'full-shot' nem 'medium'.",
  "- `acao` vai em português (é o criador que lê). `acaoEn` é a MESMA frase em inglês simples e visual, sem adjetivo de sentimento — é ela que vira prompt de imagem.",
  "- Responda SÓ com o JSON pedido, sem comentário e sem cerca de código.",
].join("\n");

export interface EntradaPeca {
  persona: PersonaEntrada;
  nome?: string;
  elenco?: Personagem[];
  formato: { titulo: string; promessa: string; aspecto: string; estrutura: string[]; temTempo: boolean; temFala: boolean };
  tema: string;
  observacao?: string;
  quadros: number;
}

export function pedidoDePeca(e: EntradaPeca): string {
  const { persona, nome, elenco = [], formato, tema, observacao, quadros } = e;
  const estrutura = formato.estrutura.slice(0, quadros).map((s, i) => `${i + 1}. ${s}`).join("\n");

  return [
    blocoCriador(persona, nome),
    "",
    blocoPublico(persona),
    "",
    blocoElenco(elenco),
    "",
    "## A PEÇA",
    `Formato: ${formato.titulo} — ${formato.promessa} (${formato.aspecto})`,
    `Tema: ${tema}`,
    observacao ? `Exigência do criador: ${observacao}` : "",
    "",
    "## ESPINHA NARRATIVA (siga na ordem, um quadro para cada)",
    estrutura,
    "",
    "## AJUSTES PERMITIDOS (devolva a chave à esquerda)",
    listarParaOModelo(formato.temTempo),
    "",
    "## RESPONDA NESTE JSON",
    "{",
    '  "titulo": "nome curto da peça",',
    '  "legenda": "a legenda do post, no tom do criador, com quebras de linha",',
    '  "hashtags": ["ate", "8", "sem", "jogo", "da", "velha"],',
    '  "quadros": [',
    "    {",
    '      "titulo": "nome do quadro",',
    '      "acao": "o que se vê, em uma frase visual concreta (português)",',
    '      "acaoEn": "the same frame in plain visual English",',
    '      "cenarioEn": "where it happens, in plain English — leave empty if the action already says it",',
    '      "quemAparece": ["id do elenco, ou vazio se não tem gente no quadro"],',
    '      "textoNaTela": "no máximo 7 palavras",',
    formato.temFala ? '      "fala": "o que a pessoa fala neste quadro",' : "",
    formato.temTempo ? '      "duracao": 4,' : "",
    '      "ajustes": { "enquadramento": "...", "angulo": "...", "luz": "...", "lente": "...", "profundidade": "...", "paleta": "...", "estilo": "...", "humor": "..."' +
      (formato.temTempo ? ', "movimento": "...", "audio": "..."' : "") +
      " }",
    "    }",
    "  ]",
    "}",
    `Exatamente ${quadros} quadros.`,
  ]
    .filter((l) => l !== "")
    .join("\n");
}

// ─────────────────────────────────────────────────────────────────────
// 2 — O PERSONAGEM DO PÚBLICO (e o que ele devolve para a persona)
// ─────────────────────────────────────────────────────────────────────

/**
 * ## Por que este prompt é o mais valioso do arquivo
 *
 * O construtor de persona pergunta "quem é o seu público?" e recebe um
 * parágrafo genérico — porque a pergunta é abstrata e ninguém responde bem a
 * pergunta abstrata. Pedir para DESENHAR uma pessoa (que idade, o que veste, o
 * que ela diz ao recusar) é a mesma pergunta em forma concreta. A resposta
 * concreta é a que serve para escrever, e é ela que volta para a persona.
 *
 * ⚠️ O modelo propõe, a pessoa confirma. O texto abaixo diz explicitamente que
 * é um RASCUNHO para o criador corrigir — sem isso o resultado entra na persona
 * como se fosse dado colhido, e dado inventado que se disfarça de dado colhido
 * é a pior coisa que se pode gravar num perfil.
 */
export const SISTEMA_PERSONAGEM_PUBLICO = [
  "Você entrevista pequenos negócios brasileiros para transformar 'meu público' em UMA PESSOA concreta.",
  "",
  "REGRAS:",
  "- Devolva UMA pessoa específica, não um segmento. 'Mulheres de 25 a 45' é segmento. 'Cláudia, 38, tem salão em Realengo e atende sozinha desde que a auxiliar saiu' é pessoa.",
  "- Tudo o que você escrever é RASCUNHO para o criador corrigir. Prefira o provável ao impressionante.",
  "- Baseie-se no que o perfil já diz. Onde ele é omisso, escolha o caso mais comum do ramo e da cidade — e não o caso extremo.",
  "- A fala dela tem de soar como gente falando, com as palavras dela. Nada de 'busco soluções eficientes'.",
  "- Aparência: escolha SOMENTE entre os valores permitidos.",
  "- Português do Brasil. Responda só com o JSON.",
].join("\n");

export function pedidoDePersonagemPublico(p: PersonaEntrada, valores: Record<string, string[]>): string {
  return [
    blocoCriador(p),
    "",
    blocoPublico(p),
    "",
    "## O QUE FAZER",
    "Transforme esse público numa pessoa só, com cara, rotina e jeito de falar.",
    "",
    "## VALORES PERMITIDOS PARA A APARÊNCIA",
    Object.entries(valores).map(([k, v]) => `${k}: ${v.join(" | ")}`).join("\n"),
    "",
    "## RESPONDA NESTE JSON",
    "{",
    '  "nome": "primeiro nome comum no Brasil",',
    '  "papel": "o que ela faz, em cinco palavras",',
    '  "resumo": "uma frase em que o criador a reconhece na hora",',
    '  "aparencia": { "genero": "...", "idade": 38, "pele": "...", "cabeloCor": "...", "cabeloEstilo": "...", "corpo": "...", "descricaoLivre": "um detalhe visual que a identifica" },',
    '  "figurino": { "nome": "como ela costuma estar vestida", "descricao": "em português", "en": "the same in plain English" },',
    '  "psicologia": {',
    '    "quer": "o que ela quer, na frase dela",',
    '    "trava": "o que a impede, na frase dela",',
    '    "objecao": "o que ela DIZ quando não vai comprar — entre aspas, com as palavras dela",',
    '    "rotina": "onde ela passa o dia, separado por vírgula",',
    '    "fala": "como ela fala: comprimento de frase, gírias, o que ela nunca diria"',
    "  }",
    "}",
  ]
    .filter(Boolean)
    .join("\n");
}

// ─────────────────────────────────────────────────────────────────────
// 3 — ENRIQUECER UM PERSONAGEM QUE JÁ EXISTE
// ─────────────────────────────────────────────────────────────────────

export const SISTEMA_ENRIQUECER = [
  "Você completa fichas de personagem sem contradizer o que já está preenchido.",
  "",
  "REGRAS:",
  "- NUNCA mude um campo que já tem valor. Preencha só os vazios.",
  "- Aparência: escolha somente entre os valores permitidos.",
  "- O detalhe que você acrescenta tem de ser VISÍVEL. 'Determinada' não é visível; 'sempre com o cabelo preso às pressas' é.",
  "- Português do Brasil. Responda só com o JSON, apenas com os campos que você preencheu.",
].join("\n");

export function pedidoDeEnriquecimento(p: Personagem, valores: Record<string, string[]>): string {
  return [
    "## A FICHA COMO ESTÁ",
    JSON.stringify({ nome: p.nome, papel: p.papel, resumo: p.resumo, aparencia: p.aparencia, figurinos: p.figurinos, psicologia: p.psicologia }, null, 1),
    "",
    "## VALORES PERMITIDOS PARA A APARÊNCIA",
    Object.entries(valores).map(([k, v]) => `${k}: ${v.join(" | ")}`).join("\n"),
    "",
    "## RESPONDA NESTE JSON (só os campos que estavam vazios)",
    '{ "resumo": "...", "aparencia": { }, "figurinos": [ { "nome": "...", "descricao": "...", "en": "..." } ], "psicologia": { } }',
  ].join("\n");
}

// ─────────────────────────────────────────────────────────────────────
// 4 — UMA IMAGEM AVULSA, A PEDIDO
// ─────────────────────────────────────────────────────────────────────

/**
 * "Cria uma imagem de X" — o pedido mais comum e o mais mal servido.
 *
 * O caminho ingênuo manda o texto do usuário direto para o gerador. Funciona
 * mal por três motivos: o usuário escreve em português (o gerador entende pior),
 * escreve o QUE quer e não o que se VÊ, e não diz nada de câmera. Este prompt
 * faz a tradução — e devolve os ajustes em chave fechada, para a composição
 * continuar sendo de código.
 */
export const SISTEMA_IMAGEM_AVULSA = [
  "Você transforma o pedido de imagem de um brasileiro num plano de quadro.",
  "",
  "REGRAS:",
  "- Devolva o que SE VÊ. Se o pedido for abstrato ('algo que passe confiança'), escolha uma cena concreta que signifique isso e diga qual.",
  "- `acaoEn` é inglês simples e visual, sem adjetivo de sentimento.",
  "- Ajustes SOMENTE entre os valores permitidos, devolvendo a chave.",
  "- Se o pedido mencionar a pessoa ('eu', 'meu rosto', 'comigo'), marque `temPessoa: true`.",
  "- Se o pedido pedir letra dentro da imagem, marque `temTexto: true` e escreva `textoNaTela` com no máximo 5 palavras.",
  "- Responda só com o JSON.",
].join("\n");

export function pedidoDeImagemAvulsa(entrada: {
  pedido: string;
  persona?: PersonaEntrada;
  nome?: string;
  aspecto: string;
}): string {
  return [
    entrada.persona ? blocoCriador(entrada.persona, entrada.nome) : "",
    "",
    "## O PEDIDO, COMO A PESSOA ESCREVEU",
    `"""\n${entrada.pedido.slice(0, 1200)}\n"""`,
    "",
    `Formato: ${entrada.aspecto}`,
    "",
    "## AJUSTES PERMITIDOS",
    listarParaOModelo(false),
    "",
    "## RESPONDA NESTE JSON",
    "{",
    '  "titulo": "nome curto da imagem",',
    '  "acao": "o que se vê, em português",',
    '  "acaoEn": "the same in plain visual English",',
    '  "cenarioEn": "where it happens, in English",',
    '  "temPessoa": false,',
    '  "temTexto": false,',
    '  "textoNaTela": "",',
    '  "ajustes": { "enquadramento": "...", "angulo": "...", "luz": "...", "lente": "...", "profundidade": "...", "paleta": "...", "estilo": "...", "humor": "..." }',
    "}",
  ]
    .filter(Boolean)
    .join("\n");
}

// ─────────────────────────────────────────────────────────────────────
// 5 — O MOVIMENTO DE UM QUADRO QUE JÁ EXISTE
// ─────────────────────────────────────────────────────────────────────

/**
 * De quadro parado para clipe.
 *
 * ⚠️ O erro clássico aqui é pedir ao modelo o prompt de vídeo inteiro. Ele
 * devolve 400 palavras de adjetivo e o LTX perde a aderência. O que se pede é
 * só o que a IMAGEM não diz: o que se MOVE, e por quanto tempo. O resto o
 * `montarPromptDeVideo` já tem.
 */
export const SISTEMA_MOVIMENTO = [
  "Você é diretor de fotografia. Recebe a descrição de um quadro parado e diz o que se MOVE nele.",
  "",
  "REGRAS:",
  "- UMA ação dominante a cada 2 ou 3 segundos. Um clipe de 5 segundos tem no máximo duas.",
  "- Descreva o movimento do CORPO e dos OBJETOS. O movimento da câmera vem do campo `movimento`, escolhido entre as opções.",
  "- Nada de metáfora, nada de sentimento. 'Ela respira fundo e solta os ombros' é movimento. 'Ela sente alívio' não é.",
  "- `movimentoEn` em inglês simples, no presente, uma ou duas frases.",
  "- Responda só com o JSON.",
].join("\n");

export function pedidoDeMovimento(entrada: { acao: string; acaoEn?: string; segundos: number; opcoesMovimento: string[]; opcoesAudio: string[] }): string {
  return [
    "## O QUADRO",
    entrada.acao,
    entrada.acaoEn ? `(em inglês: ${entrada.acaoEn})` : "",
    `Duração: ${entrada.segundos} segundos`,
    "",
    "## OPÇÕES",
    `movimento: ${entrada.opcoesMovimento.join(" | ")}`,
    `audio: ${entrada.opcoesAudio.join(" | ")}`,
    "",
    "## RESPONDA NESTE JSON",
    '{ "movimentoEn": "what physically moves, in plain present-tense English", "movimento": "chave da câmera", "audio": "chave do som" }',
  ]
    .filter(Boolean)
    .join("\n");
}

// ─────────────────────────────────────────────────────────────────────
// O registro — para o painel poder editar sem recompilar
// ─────────────────────────────────────────────────────────────────────

/**
 * Os prompts têm slug para que o Mission Control possa sobrescrevê-los sem
 * deploy — o mesmo desenho de `precos-runtime`. Enquanto não houver override
 * gravado, vale a constante daqui.
 */
export const SLUGS = {
  peca: { slug: "forja_peca", nome: "Storyboard da peça", sistema: SISTEMA_PECA },
  personagemPublico: { slug: "forja_personagem_publico", nome: "Cliente típico", sistema: SISTEMA_PERSONAGEM_PUBLICO },
  enriquecer: { slug: "forja_enriquecer", nome: "Completar ficha", sistema: SISTEMA_ENRIQUECER },
  imagemAvulsa: { slug: "forja_imagem_avulsa", nome: "Imagem a pedido", sistema: SISTEMA_IMAGEM_AVULSA },
  movimento: { slug: "forja_movimento", nome: "Movimento do quadro", sistema: SISTEMA_MOVIMENTO },
} as const;
