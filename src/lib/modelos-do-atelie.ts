/**
 * QUEM ESCREVEU O SEU LIVRO — o catálogo dos modelos do Ateliê (13/08/2026).
 *
 * ## Por que este arquivo existe
 *
 * Ricardo, olhando o livro pronto: *"deveria ter inclusive quando clicamos no
 * livro, o controle do que foi feito e o que podemos mudar, exibindo os
 * modelos a serem utilizados suas imagens"*.
 *
 * O dado já existia e nunca aparecia. `usercourselayers.modelUsed` guarda,
 * capítulo a capítulo, qual modelo escreveu — e os 16 capítulos do
 * `chatgpt-masterclass` dele saíram de **três modelos diferentes** na mesma
 * sessão de dez minutos:
 *
 *     ~deepseek/deepseek-v4-flash-latest
 *     deepseek/deepseek-v4-flash-0731
 *     deepseek/deepseek-v4-pro
 *
 * Não foi escolha dele nem defeito: `lib/ai/provider.ts` escalona sozinho
 * quando um modelo falha ou devolve `content` vazio. É a coisa certa a fazer —
 * mas o resultado é que capítulos do MESMO livro têm autores diferentes, e a
 * pessoa que pagou não tinha como saber.
 *
 * ⚠️ Este arquivo NÃO escolhe modelo. Ele só traduz o id técnico para algo que
 * um humano entende. A escolha continua em `lib/ai/provider.ts`, que é a fonte
 * única — e é de lá que vêm os preços repetidos aqui em `custo1M`.
 */

export type FichaDeModelo = {
  /** O id exato que aparece em `modelUsed`. */
  id: string;
  /** Como a pessoa deve chamá-lo. */
  nome: string;
  /** A casa que o fabrica. */
  fabricante: string;
  /** Uma frase: o que ele é. */
  oQueE: string;
  /** Uma frase: no que ele é bom, em português de gente. */
  boaEm: string;
  /** O que muda no texto quando é ele que escreve. */
  jeitoDeEscrever: string;
  velocidade: "muito rápido" | "rápido" | "médio";
  /** Custo em dólares por 1M de tokens de saída — o lado caro. */
  custo1M: number;
  /**
   * As duas cores da identidade visual do modelo. Enquanto não houver arte
   * própria, é isto que desenha o retrato dele na tela — determinístico, então
   * o mesmo modelo tem sempre a mesma cara em todas as telas.
   */
  cores: [string, string];
  /** A arte, quando existir. Ver o handoff: os quatro retratos estão pendentes. */
  imagem?: string;
};

export const MODELOS_DO_ATELIE: FichaDeModelo[] = [
  {
    id: "google/gemini-3-flash-preview",
    nome: "Gemini 3 Flash",
    fabricante: "Google",
    oQueE: "O mais rápido da casa, e o que atende primeiro.",
    boaEm: "Texto corrido que soa natural, sem travar na estrutura.",
    jeitoDeEscrever:
      "Escreve solto e mais longo. Nas suas aberturas ele passou de 500 caracteres em média, contra 216 dos DeepSeek — é dele o texto que parece escrito por alguém com tempo.",
    velocidade: "muito rápido",
    custo1M: 3,
    cores: ["#4285F4", "#9B72CB"],
  },
  {
    id: "~deepseek/deepseek-v4-flash-latest",
    nome: "DeepSeek V4 Flash",
    fabricante: "DeepSeek",
    oQueE: "O econômico, sempre na versão mais nova.",
    boaEm: "Volume: muitos capítulos seguidos sem pesar na conta.",
    jeitoDeEscrever:
      "Direto e curto. Vai ao ponto, e às vezes vai cedo demais — é o que produz o capítulo que termina antes de você esperar.",
    velocidade: "rápido",
    custo1M: 0.18,
    cores: ["#4D6BFE", "#22D3EE"],
  },
  {
    id: "deepseek/deepseek-v4-flash-0731",
    nome: "DeepSeek V4 Flash (build fixado)",
    fabricante: "DeepSeek",
    oQueE: "O mesmo de cima, numa versão congelada que não muda sozinha.",
    boaEm: "Ser a rede de segurança quando a versão mais nova sai do ar.",
    jeitoDeEscrever: "Igual ao irmão — a diferença é de confiabilidade, não de estilo.",
    velocidade: "rápido",
    custo1M: 0.18,
    cores: ["#4D6BFE", "#818CF8"],
  },
  {
    id: "deepseek/deepseek-v4-pro",
    nome: "DeepSeek V4 Pro",
    fabricante: "DeepSeek",
    oQueE: "O caro da fila, chamado quando os outros falham.",
    boaEm: "Capítulos difíceis, onde o assunto exige raciocínio mais longo.",
    jeitoDeEscrever:
      "Mais cuidadoso e mais denso. Custa cinco vezes o Flash e aparece pouco, só quando precisa.",
    velocidade: "médio",
    custo1M: 0.87,
    cores: ["#7C3AED", "#F472B6"],
  },
  {
    id: "local",
    nome: "Modelo local",
    fabricante: "na sua máquina",
    oQueE: "O de emergência, roda sem internet e sem custo.",
    boaEm: "Não deixar a escrita parar quando tudo o mais está fora do ar.",
    jeitoDeEscrever: "Mais simples que os outros. Ele existe para não falhar, não para brilhar.",
    velocidade: "médio",
    custo1M: 0,
    cores: ["#64748B", "#94A3B8"],
  },
];

const PORID = new Map(MODELOS_DO_ATELIE.map((m) => [m.id, m]));

/**
 * A ficha de um `modelUsed`, ou uma ficha honesta de "não sei quem foi".
 *
 * ⚠️ Nunca devolve `null`. Capítulos antigos foram gravados antes de
 * `modelUsed` existir, e um livro com metade das linhas em branco parece
 * quebrado — quando na verdade só é antigo. Dizer "não registrado" é a
 * informação verdadeira, e cabe na mesma caixinha.
 */
export function fichaDoModelo(id: string | null | undefined): FichaDeModelo {
  if (id) {
    const exata = PORID.get(id);
    if (exata) return exata;

    // A OpenRouter troca o sufixo de build sem avisar (`~…-latest` vira
    // `…-0731`). Casar pelo começo evita que uma troca do fornecedor
    // transforme todo o livro em "desconhecido".
    const porFamilia = MODELOS_DO_ATELIE.find(
      (m) => id.startsWith(m.id) || m.id.startsWith(id.replace(/^~/, "")),
    );
    if (porFamilia) return porFamilia;
  }

  return {
    id: id || "desconhecido",
    nome: id ? id.split("/").pop() || id : "Não registrado",
    fabricante: "—",
    oQueE: "Escrito antes de o livro passar a guardar quem escreveu.",
    boaEm: "—",
    jeitoDeEscrever: "Sem registro. Regerar este capítulo passa a guardar.",
    velocidade: "médio",
    custo1M: 0,
    cores: ["#475569", "#64748B"],
  };
}

/** Quantos capítulos cada modelo escreveu, do que mais escreveu para o que menos. */
export function contarPorModelo(
  ids: Array<string | null | undefined>,
): Array<{ ficha: FichaDeModelo; capitulos: number }> {
  const contagem = new Map<string, number>();
  for (const id of ids) {
    const ficha = fichaDoModelo(id);
    contagem.set(ficha.id, (contagem.get(ficha.id) || 0) + 1);
  }
  return [...contagem.entries()]
    .map(([id, capitulos]) => ({ ficha: fichaDoModelo(id), capitulos }))
    .sort((a, b) => b.capitulos - a.capitulos);
}
