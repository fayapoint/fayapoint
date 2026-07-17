/**
 * Slots de exemplo customizado (Camada 2 do conteúdo dinâmico — Fase 3.2/3.3).
 *
 * Convenção no markdown (ARQUITETURA_CONTEUDO_DINAMICO.md):
 *   <!--exemplo id="cgz-cap01-cenario" tema="aplicar o fluxo no seu trabalho"-->
 *   ...exemplo padrão, sempre completo...
 *   <!--/exemplo-->
 *
 * Para usuário Expert com exemplo gerado, o CONTENT API troca o miolo do slot
 * pelo exemplo personalizado (free/pro recebem o padrão). O reader remove os
 * marcadores na renderização — ninguém vê comentário cru.
 *
 * (Sequências de comentário HTML montadas via RegExp/concat — literais no
 * fonte quebram o lexer do Turbopack.)
 */

export type ExampleSlot = {
  id: string;
  tema: string;
  /** corpo padrão do slot (markdown) */
  body: string;
  /** posição do corpo dentro do conteúdo (para substituição) */
  bodyStart: number;
  bodyEnd: number;
};

const OPEN = "<" + "!--exemplo\\s+([^>]*?)--" + ">";
const CLOSE = "<" + "!--/exemplo--" + ">";

function slotRegex(): RegExp {
  return new RegExp(OPEN + "([\\s\\S]*?)" + CLOSE, "g");
}

function parseAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const m of raw.matchAll(/([\w-]+)="([^"]*)"/g)) attrs[m[1]] = m[2];
  return attrs;
}

export function parseExampleSlots(content: string): ExampleSlot[] {
  const slots: ExampleSlot[] = [];
  for (const m of content.matchAll(slotRegex())) {
    const attrs = parseAttrs(m[1]);
    if (!attrs.id) continue;
    const full = m[0];
    const body = m[2];
    const bodyOffset = full.indexOf(body);
    slots.push({
      id: attrs.id,
      tema: attrs.tema || "",
      body: body.trim(),
      bodyStart: (m.index ?? 0) + bodyOffset,
      bodyEnd: (m.index ?? 0) + bodyOffset + body.length,
    });
  }
  return slots;
}

/**
 * Substitui o miolo dos slots pelos exemplos personalizados (quando houver).
 * Mantém os marcadores — o reader os remove na renderização.
 */
export function substituteExamples(
  content: string,
  examplesById: Map<string, string>
): string {
  if (!examplesById.size) return content;
  const slots = parseExampleSlots(content);
  let result = "";
  let cursor = 0;
  for (const slot of slots) {
    const custom = examplesById.get(slot.id);
    if (!custom) continue;
    result += content.slice(cursor, slot.bodyStart);
    result += "\n" + custom.trim() + "\n";
    cursor = slot.bodyEnd;
  }
  result += content.slice(cursor);
  return result;
}
