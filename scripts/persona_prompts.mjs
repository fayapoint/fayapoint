/**
 * Monta a fila de prompts da arte dos presets da persona.
 *
 * ## O que esta arte é — e o que ela NÃO é
 *
 * NÃO é o estilo dos cursos. A biblioteca de curso é render 3D com o mascote
 * robô (ver o skill `higgsfield-midia` §2) e existe para ensinar um conceito.
 * Aqui o trabalho é outro: a pessoa está numa tela de cadastro decidindo se
 * vale a pena responder. Ricardo, 11/08: *"uma imagem photorealista
 * descrevendo o que perguntamos... fácil e engajador para que o usuário queira
 * colocar suas informações"*. Foto de gente real fazendo a coisa real é o que
 * faz alguém se reconhecer numa opção — mascote nenhum faz isso.
 *
 * ## As três regras que valem para as 250
 *
 * 1. **Brasil.** Gente brasileira, luz de Brasil, comércio de rua brasileiro.
 *    Sem isso o modelo devolve escritório americano de banco de imagem e a
 *    pessoa não se vê ali.
 * 2. **Zero caractere escrito.** A regra imperativa do §3 do skill, sempre. O
 *    rótulo já está DESENHADO por baixo do ladrilho em HTML — texto queimado
 *    no pixel só pode brigar com ele, e ainda quebra a árvore `/en`.
 * 3. **Recorte 4:3 com o sujeito no meio.** O ladrilho é `aspect-[4/3]` com
 *    `object-cover`; assunto na borda vira assunto cortado.
 *
 *   node scripts/persona_prompts.mjs          # imprime o resumo
 *   node scripts/persona_prompts.mjs --json   # escreve fila_persona.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

// ── O mesmo slug do TypeScript. Duplicado de propósito: um .mjs não importa
// .ts sem transpilar, e uma divergência aqui produz arquivo que o site nunca
// pede. Se mudar lá, mude aqui. ────────────────────────────────────────────
const campoSlug = (c) => c.replace(/\./g, '-');
const valorSlug = (v) =>
  String(v)
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

/** Lê o catálogo do próprio TypeScript — fonte única, sem segunda cópia. */
function lerPresets() {
  const fonte = readFileSync(join(raiz, 'src', 'lib', 'persona-presets.ts'), 'utf8');
  const corpo = fonte.slice(fonte.indexOf('export const PRESETS'));
  const saida = {};
  let campo = null;
  for (const linha of corpo.split('\n')) {
    const abre = linha.match(/^\s*'([a-zA-Z.]+)':\s*\[/);
    if (abre) {
      campo = abre[1];
      saida[campo] = [];
      continue;
    }
    if (!campo) continue;
    // p('🧑‍🏫', 'Ensino o que aprendi…')  ou  p('☕', 'Até R$ 50', 50)
    const item = linha.match(/^\s*p\('([^']*)',\s*'(.+?)'(?:,\s*(\d+))?\),?\s*$/);
    if (item) saida[campo].push({ emoji: item[1], rotulo: item[2], valor: item[3] ? Number(item[3]) : item[2] });
  }
  return saida;
}

/**
 * O enquadramento por grupo de campo.
 *
 * O rótulo sozinho não basta para o modelo: "Tá caro" vira uma placa de preço
 * se ninguém disser que é a CARA de quem ouviu o preço. Cada grupo carrega o
 * que a foto tem de mostrar — pessoa, objeto, lugar ou gesto.
 */
const ENQUADRAMENTO = {
  'identidade.papel': 'a Brazilian professional at work, mid-action, shot candidly in their real workplace',
  'identidade.marca': 'a close, warm still life that stands for how someone signs their own work',
  'identidade.cidade': 'a recognisable, sunlit street-level view of this Brazilian city, no landmarks-postcard cliché, everyday life in frame',
  'identidade.missao': 'a quiet, emotional portrait moment of a Brazilian person that embodies this conviction',
  'identidade.valores': 'an intimate detail shot — hands, objects, a gesture — that stands for this value being practised',
  'voz.bordoes': 'a Brazilian creator mid-sentence to camera, caught in the exact expression this phrase carries',
  'voz.vocabulario': 'a Brazilian person explaining something to another, framed to show how plain or technical the talk is',
  'publico.quemE': 'a candid environmental portrait of exactly this Brazilian person in their own setting',
  'publico.dores': 'a Brazilian small-business person in the middle of this frustration, body language doing the telling',
  'publico.desejos': 'a Brazilian person living this relief, warm and calm, the moment it finally happens',
  'publico.lugares': 'a Brazilian person using this channel in real life — the device and the hands, not a logo',
  'estrategia.pilares': 'a behind-the-scenes photograph of this kind of content being made in Brazil',
  'estrategia.naoFalar': 'a restrained, tasteful still life that stands for this subject without depicting anyone taking a side',
  'estrategia.assinatura': 'a Brazilian creator making this exact invitation gesture to camera',
  'estrategia.porSemana': 'a workspace scene whose density and calendar rhythm shows this publishing pace',
  'aprendizado.objetivo': 'a Brazilian entrepreneur at the moment this goal lands, celebratory but real',
  'aprendizado.ferramentas': 'hands using this kind of software on a real screen, abstract glowing interface only',
  'aprendizado.travando': 'a Brazilian person visibly stuck at this exact obstacle, in front of a screen',
  'negocio.oQueVende': 'this Brazilian trade being practised, the work itself in the frame',
  'negocio.canal': 'a real Brazilian sale happening through this channel',
  'negocio.objecao': 'the face and posture of a Brazilian customer at the instant of this hesitation',
  'negocio.ticket': 'a tasteful still life whose objects imply this price bracket without any figures shown',
  'negocio.clientesPorMes': 'a Brazilian business at exactly this level of movement and footfall',
};

const ACABAMENTO = [
  'Editorial documentary photography, full-frame 35mm, natural available light,',
  'shallow depth of field, warm golden key light against cool background,',
  'rich colour, filmic grain, sharp on the subject, 4:3 crop with the subject centred.',
].join(' ');

/**
 * ⚠️ `no text` sozinho é ignorado — medido, e já voltou legenda em inglês
 * carimbada em curso português. A regra imperativa é o §3 do skill.
 */
const SEM_TEXTO = [
  'ABSOLUTE RULE: zero written characters anywhere — no labels, no captions,',
  'no titles, no letters, no numbers, no signage, no brand marks,',
  'no readable screen copy. Screens show only abstract glowing shapes.',
].join(' ');

function prompt(campo, op) {
  const cena = ENQUADRAMENTO[campo] || 'a candid Brazilian everyday scene';
  return `Photorealistic photograph: ${cena}. The scene must read, at a glance and with no words, as: "${op.rotulo}". ${ACABAMENTO} ${SEM_TEXTO}`;
}

const presets = lerPresets();
const fila = [];
for (const [campo, opcoes] of Object.entries(presets)) {
  for (const op of opcoes) {
    fila.push({
      campo,
      rotulo: op.rotulo,
      arquivo: `${campoSlug(campo)}-${valorSlug(op.valor)}.webp`,
      destino: `portal/persona/opts/${campoSlug(campo)}-${valorSlug(op.valor)}.webp`,
      prompt: prompt(campo, op),
    });
  }
}

if (process.argv.includes('--json')) {
  writeFileSync(join(raiz, 'scripts', 'fila_persona.json'), JSON.stringify(fila, null, 2));
  console.log(`fila_persona.json: ${fila.length} prompts`);
} else {
  console.log(`${Object.keys(presets).length} campos, ${fila.length} opções`);
  for (const [campo, ops] of Object.entries(presets)) console.log(`  ${campo.padEnd(28)} ${ops.length}`);
}
