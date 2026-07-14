import type { GameTerm } from "@/data/games/types";

export interface PromptPiece { id: string; label: string; text: string }
export interface PromptHuntRound {
  id: string;
  image: string;
  mission: string;
  slots: readonly string[];
  pieces: readonly PromptPiece[];
  answer: readonly string[];
  explanation: string;
  term: GameTerm;
}

export const PROMPT_HUNTS: readonly PromptHuntRound[] = [
  { id: "cupcake", image: "/landing/scenes/imagem-sem-designer.webp", mission: "Reconstrua a receita visual na ordem certa.", slots: ["Assunto", "Estilo", "Luz"], answer: ["cake", "vector", "soft"], pieces: [
    { id: "cake", label: "Assunto", text: "mascote de confeitaria segurando um cupcake" }, { id: "vector", label: "Estilo", text: "vetor mágico com formas arredondadas" }, { id: "soft", label: "Luz", text: "brilho suave de estúdio" }, { id: "court", label: "Intruso", text: "tribunal realista" }, { id: "neon", label: "Intruso", text: "neon cyberpunk agressivo" },
  ], explanation: "Assunto vem primeiro, estilo define a linguagem e luz finaliza a atmosfera.", term: { slug: "anatomia-do-prompt", label: "anatomia do prompt", definition: "A divisão do pedido em partes como assunto, contexto, estilo, composição e luz." } },
  { id: "meeting", image: "/landing/scenes/reuniao-resumida.webp", mission: "Monte a transformação que a imagem precisa encenar.", slots: ["Palco", "Conteúdo", "Resultado"], answer: ["phone", "wave", "checklist"], pieces: [
    { id: "phone", label: "Palco", text: "smartphone em primeiro plano" }, { id: "wave", label: "Conteúdo", text: "gravador com onda de áudio" }, { id: "checklist", label: "Resultado", text: "onda virando checklist organizado" }, { id: "beach", label: "Intruso", text: "praia vazia ao entardecer" }, { id: "camera", label: "Intruso", text: "câmera fotográfica antiga" },
  ], explanation: "A regra do espelho usa um objeto-palco, mostra o conteúdo dentro dele e revela a mágica.", term: { slug: "multimodal", label: "multimodal", definition: "Uso combinado de áudio, texto, imagem ou vídeo no mesmo fluxo." } },
  { id: "meal", image: "/landing/scenes/cardapio-semana.webp", mission: "Escolha as três peças que contam a história completa.", slots: ["Cenário", "Elementos", "Solução"], answer: ["fridge", "food", "calendar"], pieces: [
    { id: "fridge", label: "Cenário", text: "geladeira aberta numa cozinha de casa" }, { id: "food", label: "Elementos", text: "ingredientes disponíveis com expressão amigável" }, { id: "calendar", label: "Solução", text: "calendário de refeições surgindo em brilho" }, { id: "rocket", label: "Intruso", text: "foguete atravessando o espaço" }, { id: "office", label: "Intruso", text: "reunião corporativa formal" },
  ], explanation: "Cenário cotidiano + elementos reais + resultado visível tornam a utilidade instantânea.", term: { slug: "contexto", label: "contexto", definition: "Detalhes que situam a tarefa e impedem interpretações genéricas." } },
  { id: "study", image: "/landing/scenes/flashcards.webp", mission: "Ordene a instrução que mostra aprendizado em ação.", slots: ["Origem", "Ação", "Saída"], answer: ["book", "transform", "cards"], pieces: [
    { id: "book", label: "Origem", text: "livro aberto em uma mesa" }, { id: "transform", label: "Ação", text: "páginas se transformando com sparkles" }, { id: "cards", label: "Saída", text: "cartões de estudo organizados" }, { id: "car", label: "Intruso", text: "carro esportivo em movimento" }, { id: "rain", label: "Intruso", text: "tempestade sobre montanhas" },
  ], explanation: "Verbos visuais como transformar ligam claramente o antes ao depois.", term: { slug: "transformacao", label: "transformação visual", definition: "Mudança explícita de um estado inicial para um resultado dentro da cena." } },
  { id: "contract", image: "/landing/scenes/conta-explicada.webp", mission: "Monte uma cena que traduz complexidade em clareza.", slots: ["Objeto", "Ferramenta", "Insight"], answer: ["document", "magnifier", "idea"], pieces: [
    { id: "document", label: "Objeto", text: "documento com barras pequenas, sem texto legível" }, { id: "magnifier", label: "Ferramenta", text: "robô usando uma lupa" }, { id: "idea", label: "Insight", text: "lâmpada clara surgindo acima" }, { id: "guitar", label: "Intruso", text: "guitarra num palco" }, { id: "train", label: "Intruso", text: "trem numa estação" },
  ], explanation: "Documento, lupa e lâmpada formam uma metáfora visual simples para explicar.", term: { slug: "metafora-visual", label: "metáfora visual", definition: "Símbolo que torna uma ideia abstrata compreensível sem depender de texto." } },
  { id: "streak", image: "/portal/trail/sequencia-3-dias.webp", mission: "Reconstrua o prompt de progresso sem usar texto na arte.", slots: ["Quantidade", "Caminho", "Recompensa"], answer: ["three", "trail", "flame"], pieces: [
    { id: "three", label: "Quantidade", text: "três marcos visuais distintos" }, { id: "trail", label: "Caminho", text: "trilha curta conectando os marcos" }, { id: "flame", label: "Recompensa", text: "chama amigável brilhando no final" }, { id: "number", label: "Intruso", text: "número 3 escrito em letras grandes" }, { id: "barcode", label: "Intruso", text: "código de barras realista" },
  ], explanation: "A quantidade aparece por repetição de objetos; texto dentro da imagem não é necessário.", term: { slug: "composicao", label: "composição", definition: "Organização espacial que guia o olhar e comunica hierarquia ou sequência." } },
  { id: "certificate", image: "/portal/trail/certificado.webp", mission: "Crie uma conquista pronta para receber texto em HTML depois.", slots: ["Moldura", "Área útil", "Atmosfera"], answer: ["frame", "blank", "gold"], pieces: [
    { id: "frame", label: "Moldura", text: "moldura premium inspirada na identidade do curso" }, { id: "blank", label: "Área útil", text: "centro limpo para aplicar nome real depois" }, { id: "gold", label: "Atmosfera", text: "brilho dourado discreto de conquista" }, { id: "letters", label: "Intruso", text: "nome completo gerado dentro da imagem" }, { id: "mud", label: "Intruso", text: "fundo marrom dominante" },
  ], explanation: "A arte gera moldura e atmosfera; dados reais entram por HTML ou canvas.", term: { slug: "composicao-em-camadas", label: "camadas", definition: "Separação de arte, dados e efeitos para manter qualidade e permitir animação." } },
  { id: "course", image: "/portal/trail/primeiro-curso.webp", mission: "Monte a metáfora de início de jornada.", slots: ["Convite", "Conhecimento", "Movimento"], answer: ["robot", "book", "path"], pieces: [
    { id: "robot", label: "Convite", text: "robô amigável apontando adiante" }, { id: "book", label: "Conhecimento", text: "livro aberto como primeiro marco" }, { id: "path", label: "Movimento", text: "caminho luminoso começando no livro" }, { id: "wall", label: "Intruso", text: "parede bloqueando toda a cena" }, { id: "invoice", label: "Intruso", text: "boleto bancário em destaque" },
  ], explanation: "Personagem convida, objeto explica o tema e caminho comunica continuidade.", term: { slug: "narrativa-visual", label: "narrativa visual", definition: "Uso de personagens e objetos para mostrar começo, ação e direção numa única cena." } },
  { id: "post", image: "/landing/scenes/post-30s.webp", mission: "Reconstrua uma cena de criação rápida.", slots: ["Dispositivo", "Processo", "Tempo"], answer: ["screen", "blocks", "timer"], pieces: [
    { id: "screen", label: "Dispositivo", text: "tela de celular em primeiro plano" }, { id: "blocks", label: "Processo", text: "blocos visuais se organizando num post" }, { id: "timer", label: "Tempo", text: "cronômetro simples ao lado" }, { id: "essay", label: "Intruso", text: "parágrafo longo e legível na tela" }, { id: "factory", label: "Intruso", text: "fábrica industrial pesada" },
  ], explanation: "O cronômetro comunica rapidez; blocos abstratos evitam texto quebrado na imagem.", term: { slug: "objeto-palco", label: "objeto-palco", definition: "Objeto principal, como celular ou caderno, que dá contexto imediato à ação." } },
  { id: "magic", image: "/portal/trail/magica.webp", mission: "Mostre que uma IA pode trabalhar com várias mídias.", slots: ["Centro", "Modalidades", "Unidade"], answer: ["portal", "media", "palette"], pieces: [
    { id: "portal", label: "Centro", text: "robô abrindo um portal luminoso" }, { id: "media", label: "Modalidades", text: "ícones abstratos de texto, imagem e áudio saindo" }, { id: "palette", label: "Unidade", text: "paleta ciano, violeta e rosa sobre navy" }, { id: "single", label: "Intruso", text: "somente uma folha de papel vazia" }, { id: "logo", label: "Intruso", text: "logotipos reais de várias empresas" },
  ], explanation: "Elementos diferentes compartilham uma composição e uma paleta, comunicando multimodalidade.", term: { slug: "multimodal", label: "multimodal", definition: "Modelo ou fluxo que combina texto, imagem, som e outras formas de informação." } },
];

