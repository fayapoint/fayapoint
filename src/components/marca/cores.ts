/**
 * As cores da marca, num lugar só.
 *
 * ── O que mudou em 20/08/2026 ──────────────────────────────────────────────
 *
 * O acento do logo era OURO (`#f5c04e`) desde sempre. Passou a ser AZUL. O
 * letreiro é o mesmo — "Fay" claro, o acento colorido — e é a segunda metade
 * que carrega a cor da casa.
 *
 * ⚠️ O ouro **não** foi aposentado do site. Ele continua sendo o acento de
 * recompensa (XP, certificado, CTA de curso) em centenas de telas; o que mudou
 * foi o LOGO. Quem for repintar o resto, faça como decisão de design própria,
 * não como efeito colateral desta troca — está registrado em
 * `IDENTIDADE_VISUAL.md` §2.
 *
 * ⚠️ Estes valores existem em DOIS lugares: aqui e em `scripts/logo-svg.py`,
 * que gera os SVG da marca. `LogoFayai3D` compara o `fill` que sai do SVG com
 * `AZUL` para saber qual metade extrudar como acento — se um lado mudar
 * sozinho, o 3D perde a cor e ninguém vê erro no build.
 */

export const BRANCO_DA_MARCA = "#f3f1ff";
export const AZUL = "#1e9bff";
export const AZUL_CLARO = "#5cc8ff";
export const AZUL_FUNDO = "#0a74e6";
export const NAVY = "#0c0e1d";

/** O ouro de recompensa. Continua vivo — só não é mais o logo. */
export const OURO = "#f5c04e";
