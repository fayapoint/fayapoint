import type { GameTerm } from "@/data/games/types";

export interface PromptIngredient {
  id: string;
  label: string;
  color: string;
  options: readonly { chip: string; excerpt: string }[];
  term: GameTerm;
}

export const PROMPT_INGREDIENTS: readonly PromptIngredient[] = [
  { id: "subject", label: "Assunto", color: "#38bdf8", term: { slug: "assunto", label: "assunto", definition: "O objeto, personagem ou cena principal que precisa aparecer no resultado." }, options: [
    { chip: "🧁 Confeitaria", excerpt: "identidade visual para uma confeitaria artesanal acolhedora" },
    { chip: "🐶 Petshop", excerpt: "mascote fofo para um petshop, um cachorrinho sorridente" },
    { chip: "🚀 Podcast tech", excerpt: "capa para um podcast de tecnologia e futuro" },
    { chip: "☕ Café brasileiro", excerpt: "embalagem premium para café brasileiro de pequenos produtores" },
    { chip: "🎮 Jogo indie", excerpt: "cena principal de um jogo indie sobre exploração espacial" },
    { chip: "🌱 Horta urbana", excerpt: "campanha visual para uma horta comunitária urbana" },
  ] },
  { id: "style", label: "Estilo", color: "#a78bfa", term: { slug: "estilo-visual", label: "estilo visual", definition: "A linguagem estética do resultado: fotografia, vetor, aquarela, 3D e outras." }, options: [
    { chip: "Minimalista flat", excerpt: "estilo minimalista flat com formas geométricas" },
    { chip: "Aquarela", excerpt: "aquarela artesanal com textura de papel" },
    { chip: "3D fofinho", excerpt: "3D fofinho com formas arredondadas e acabamento premium" },
    { chip: "Foto cinematográfica", excerpt: "fotografia cinematográfica natural e brasileira" },
    { chip: "Colagem editorial", excerpt: "colagem editorial contemporânea com recortes em camadas" },
    { chip: "Vetor mágico", excerpt: "ilustração vetorial mágica, amigável e sofisticada" },
  ] },
  { id: "color", label: "Cores", color: "#f472b6", term: { slug: "paleta", label: "paleta", definition: "O conjunto de cores que cria unidade, contraste e emoção na imagem." }, options: [
    { chip: "Pastel suave", excerpt: "paleta pastel suave e acolhedora" },
    { chip: "Quente vibrante", excerpt: "cores vibrantes e quentes" },
    { chip: "Azul e dourado", excerpt: "azul profundo com detalhes dourados" },
    { chip: "Tropical BR", excerpt: "verde, amarelo e coral em combinação tropical elegante" },
    { chip: "Monocromático", excerpt: "paleta monocromática com contraste de luz" },
    { chip: "Ciano e violeta", excerpt: "ciano e violeta com pequenos acentos rosa" },
  ] },
  { id: "background", label: "Fundo", color: "#a3e635", term: { slug: "composicao", label: "composição", definition: "A organização do assunto, fundo e espaços vazios dentro do quadro." }, options: [
    { chip: "Liso e limpo", excerpt: "fundo liso e limpo com espaço negativo" },
    { chip: "Gradiente sutil", excerpt: "fundo em gradiente sutil" },
    { chip: "Cena desfocada", excerpt: "ambiente real levemente desfocado ao fundo" },
    { chip: "Navy profundo", excerpt: "fundo navy profundo com brilhos discretos" },
    { chip: "Mesa de trabalho", excerpt: "mesa de trabalho brasileira organizada ao fundo" },
    { chip: "Natureza", excerpt: "paisagem natural suave criando profundidade" },
  ] },
  { id: "light", label: "Luz", color: "#f5c04e", term: { slug: "iluminacao", label: "iluminação", definition: "A direção e a qualidade da luz, responsáveis por volume, foco e atmosfera." }, options: [
    { chip: "Estúdio suave", excerpt: "iluminação suave de estúdio" },
    { chip: "Golden hour", excerpt: "luz quente de fim de tarde" },
    { chip: "Neon dramático", excerpt: "iluminação neon dramática" },
    { chip: "Janela natural", excerpt: "luz natural entrando por uma janela lateral" },
    { chip: "Contraluz", excerpt: "contraluz delicado recortando o assunto" },
    { chip: "Dia nublado", excerpt: "luz difusa de dia nublado, sem sombras duras" },
  ] },
];

