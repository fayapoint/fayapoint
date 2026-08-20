/**
 * As três leituras do logo em 3D, para o Ricardo escolher.
 *
 * O que NÃO muda entre elas: a forma. Os contornos saem dos glifos da própria
 * fonte (`scripts/logo-svg.py` + fontTools), então a marca é exatamente a que
 * o navegador desenha em 2D. Nenhuma delas reinterpreta a letra — imagem
 * generativa erra letra, e logo com letra errada não é logo.
 *
 * O que muda é MATÉRIA: do que a peça parece ser feita, e como a luz responde.
 * São três materiais diferentes, não três ajustes do mesmo.
 */

export type VarianteLogo = "macico" | "vidro" | "contorno";

export interface ReceitaLogo {
  id: VarianteLogo;
  nome: string;
  /** O que esta leitura afirma sobre a marca — a razão de existir. */
  tese: string;
  /** Custo relativo de GPU, para a decisão de espalhar pelo site. */
  custo: "baixo" | "médio" | "alto";
  extrusao: {
    depth: number;
    bevelThickness: number;
    bevelSize: number;
    bevelSegments: number;
  };
}

export const RECEITAS: Record<VarianteLogo, ReceitaLogo> = {
  macico: {
    id: "macico",
    nome: "Maciço",
    tese:
      "Letreiro físico: azul polido e off-white acetinado, chanfro largo. É a leitura mais próxima do que já está no ar — peso e permanência, sem chamar atenção para o efeito.",
    custo: "baixo",
    extrusao: { depth: 180, bevelThickness: 26, bevelSize: 18, bevelSegments: 3 },
  },
  vidro: {
    id: "vidro",
    nome: "Vidro",
    tese:
      "O “Fay” vira vidro fumê e o “Ai” fica azul maciço por dentro: o acento aparece ATRAVÉS da peça. Sofisticado, mas o vidro só funciona sobre fundo escuro — e é a mais cara das três.",
    custo: "alto",
    // Vidro fino não lê como vidro: sem espessura não há refração para ver.
    extrusao: { depth: 260, bevelThickness: 34, bevelSize: 24, bevelSegments: 4 },
  },
  contorno: {
    id: "contorno",
    nome: "Contorno",
    tese:
      "Corpo escuro com a aresta acesa — o volume aparece pela luz que corre na borda, não pelo preenchimento. É a linguagem do HUD do Radar, e a que melhor sobrevive em tamanho pequeno.",
    custo: "médio",
    // Aresta definida pede chanfro curto: chanfro largo dissolve a linha.
    extrusao: { depth: 120, bevelThickness: 10, bevelSize: 7, bevelSegments: 2 },
  },
};

export const ORDEM: VarianteLogo[] = ["macico", "vidro", "contorno"];

/** A que está no ar hoje — a régua contra a qual as outras são julgadas. */
export const VARIANTE_ATUAL: VarianteLogo = "macico";
