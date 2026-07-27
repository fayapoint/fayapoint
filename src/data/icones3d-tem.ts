import { ICONES_3D } from "@/data/icones3d";
import { ICONES_PERSONA_3D } from "@/data/icones3d-persona";

/**
 * "Existe peça 3D para isto?" — sem arrastar o three.js junto.
 *
 * As perguntas moravam dentro de `IconeMenu3D`/`IconePersona3D`, que importam
 * `@react-three/fiber` no topo do módulo. Quem só queria saber se deve ligar o
 * `onMouseEnter` — a barra lateral e o construtor de persona — importava a
 * função e **puxava a biblioteca inteira para o pacote do portal**, anulando o
 * `next/dynamic` que existe justamente para não baixá-la.
 *
 * Aqui só entram os catálogos, que são JSON. O WebGL continua chegando apenas
 * quando o cursor pede.
 */

const MENU = new Set(ICONES_3D.filter((i) => !!i.opcoes[0]?.arquivo).map((i) => i.slug));
const PERSONA = new Set(ICONES_PERSONA_3D.map((i) => i.slug));

/** Existe peça 3D para este item de menu? */
export function temIcone3D(slug: string) {
  return MENU.has(slug);
}

/** Existe peça 3D para esta opção do construtor? `grupo` é "area" ou "meta". */
export function temPersona3D(grupo: string, id: string) {
  return PERSONA.has(`${grupo}-${id}`);
}
