/**
 * A mídia da PÁGINA DE VENDA de cada curso — as cenas e o vídeo de abertura.
 *
 * ── Por que este arquivo existe ────────────────────────────────────────────
 *
 * Ricardo, 04/08/2026: *"eu havia pedido mais imagens dentro que se
 * relacionassem com o conteúdo do curso, e não temos nada"*, e antes disso o
 * diagnóstico dele mesmo: *"a diferença dos cursos que têm imagens e vídeos em
 * suas páginas é brutal"*.
 *
 * Até aqui a página de venda tinha a capa e mais nada que falasse do assunto.
 * Quem chegava lendo sobre RAG via um livro bonito e oito blocos de texto —
 * nenhuma imagem do que o curso ENSINA.
 *
 * ── Por que não reaproveitamos a arte por capítulo ─────────────────────────
 *
 * Existem 1.474 arquivos em `public/cursos/media/`, e seria de graça apontar
 * para eles. Mas são de OUTRA língua visual: um robô mascote de olhos verdes
 * numa cozinha quente. Na página de venda ele apareceria a dois palmos da capa
 * — cristal sobre navy, luz dourada rasante — e as duas direções brigariam na
 * mesma tela. O mascote continua onde funciona: dentro do leitor, na aula.
 * A vitrine fala a língua da capa.
 *
 * ── A regra de uma cena ────────────────────────────────────────────────────
 *
 * Uma cena não é enfeite: ela mostra UMA ideia que o curso ensina, e a legenda
 * diz qual. Se a legenda pudesse ser trocada entre dois cursos sem ninguém
 * notar, a cena não deveria existir.
 *
 * ── O vídeo de abertura ────────────────────────────────────────────────────
 *
 * ⚠️ NÃO é o loop de capa. O loop de capa é imóvel de propósito — o livro não
 * se mexe para o Seedance não derreter o título gravado (ACERVO §8). O vídeo de
 * abertura é o oposto: câmera em movimento, sem uma letra no quadro. São duas
 * receitas, e confundi-las estraga as duas.
 *
 * Cada vídeo nasce da PRÓPRIA cena 1 do curso, animada por imagem→vídeo. Assim
 * ele é específico daquele curso em vez de um genérico de estoque, e a página
 * inteira continua sendo o mesmo mundo.
 */

export interface CenaDoCurso {
  /** Caminho a partir de `public/`. */
  src: string;
  /** O que esta cena diz sobre o curso. Aparece sob a imagem e é o `alt`. */
  legenda: string;
}

export interface MidiaDoCurso {
  /** O vídeo cinematográfico do topo. Mudo, em laço, 16:9. */
  intro?: { video: string; poster: string };
  /**
   * As cenas, em ordem de aparição na página: transformação, o que você
   * aprende, e a jornada do currículo. Três é o mínimo pedido.
   */
  cenas?: CenaDoCurso[];
}

/** Atalho: as cenas moram todas em `public/cursos/cena/`. */
const c = (arquivo: string, legenda: string): CenaDoCurso => ({
  src: `/cursos/cena/${arquivo}.webp`,
  legenda,
});

const MIDIA_POR_CURSO: Record<string, MidiaDoCurso> = {
  "chatgpt-masterclass": {
    cenas: [
      c("chatgpt-masterclass-1", "O mesmo dia de trabalho, entregue em três peças limpas — e o monte de rascunho que sobrava deixa de existir."),
      c("chatgpt-masterclass-2", "Um pedido vago entra; quatro ajustes depois, sai a resposta que você queria. O curso é sobre esses quatro ajustes."),
      c("chatgpt-masterclass-3", "Do primeiro prompt ao fluxo que roda sozinho, um degrau por capítulo."),
    ],
  },
  "n8n-automacao-avancada": {
    cenas: [
      c("n8n-avancada-1", "O processo continua rodando depois que você fecha o computador. A cadeira ao lado fica vazia de propósito."),
      c("n8n-avancada-2", "Ramificar, tratar o erro e reunir de novo: é o que separa um fluxo de brinquedo de um fluxo de produção."),
      c("n8n-avancada-3", "Cada módulo acrescenta uma peça ao mesmo fluxo, do gatilho até a entrega."),
    ],
  },
  "make-integracao-total": {
    cenas: [
      c("make-1", "Centenas de aplicativos, e um fio só passando por todos eles."),
      c("make-2", "O dado sai de um formato e entra em outro sem ninguém digitar nada no meio."),
      c("make-3", "Cenário por cenário, até a operação inteira acender sozinha."),
    ],
  },
  "leonardo-ai-criacao-visual": {
    cenas: [
      c("leonardo-1", "Do rascunho bruto à peça pronta para o cliente, sem passar por um estúdio."),
      c("leonardo-2", "O mesmo pedido, quatro acabamentos. Controle de estilo é isto, e é aprendível."),
      c("leonardo-3", "Da primeira imagem ao acervo com identidade própria."),
    ],
  },
  "gemini-ia-google": {
    cenas: [
      c("gemini-1", "Texto, imagem, vídeo e código entrando na mesma conversa — e saindo como uma resposta só."),
      c("gemini-2", "Ele não lê uma coisa de cada vez: olha tudo junto. É o que multimodal nativo quer dizer."),
      c("gemini-3", "Da primeira pergunta ao contexto gigante que ele aguenta segurar sem perder o fio."),
    ],
  },
  "midjourney-arte-profissional": {
    cenas: [
      c("midjourney-1", "Um acervo com assinatura visual, não um punhado de imagens soltas."),
      c("midjourney-2", "Um parâmetro muda e a imagem inteira muda de temperamento. Saber qual é o curso."),
      c("midjourney-3", "Do prompt simples ao projeto autoral, quadro a quadro."),
    ],
  },
  "claude-ia-segura": {
    cenas: [
      c("claude-segura-1", "Documentos longos lidos por inteiro, com a passagem exata devolvida — não um resumo do meio."),
      c("claude-segura-2", "Ele ajuda até onde deve e para onde não deve. Saber onde fica essa linha é metade do curso."),
      c("claude-segura-3", "De pergunta avulsa a projeto inteiro conduzido com ele, uma tarefa completa por vez."),
    ],
  },
  "aprenda-a-usar-inteligencia-artificial-no-seu-dia-a-dia": {
    cenas: [
      c("dia-a-dia-1", "Três tarefas do seu dia resolvidas antes de o café esfriar."),
      c("dia-a-dia-2", "Você pede em português comum; ela devolve o passo a passo. Não tem truque escondido."),
      c("dia-a-dia-3", "Começa do zero absoluto e não pula degrau — a rampa é longa de propósito."),
    ],
  },
  "prompt-engineering": {
    cenas: [
      c("prompt-eng-1", "Mesmo modelo, mesmo dia, mesma pergunta: o que muda o resultado é o pedido."),
      c("prompt-eng-2", "Papel, contexto, exemplo e limite — o esqueleto que faz um prompt parar de falhar."),
      c("prompt-eng-3", "Do prompt único à cadeia em que a saída de um alimenta o próximo."),
    ],
  },
  "chatgpt-zero": {
    cenas: [
      c("chatgpt-zero-1", "O primeiro dia sem a sensação de estar fazendo errado."),
      c("chatgpt-zero-2", "Pedir bem é uma habilidade curta de aprender — e é a que mais rende."),
      c("chatgpt-zero-3", "Trinta e um capítulos curtos. Um por dia, e no fim do mês acabou."),
    ],
  },
  "primeiras-automacoes": {
    cenas: [
      c("primeiras-automacoes-1", "A tarefa que você repetia toda semana passa a acontecer sem você."),
      c("primeiras-automacoes-2", "Gatilho, condição e ação. Automação é isto, e a primeira cabe numa tarde."),
      c("primeiras-automacoes-3", "Da automação de dez minutos ao fluxo que segura a semana inteira."),
    ],
  },
  "rag-knowledge": {
    cenas: [
      c("rag-1", "A resposta não vem da memória do modelo: vem dos três documentos seus que ela foi buscar."),
      c("rag-2", "Cada trecho vira um ponto num espaço, e a pergunta cai perto dos vizinhos certos. É o que um índice vetorial faz."),
      c("rag-3", "Do documento cru à resposta com fonte: ingestão, corte, embedding, busca e geração."),
    ],
  },
  "crie-agentes-de-ia-autonomos": {
    cenas: [
      c("agentes-1", "Ele escolhe o próximo passo sozinho — e quem desenha os limites da escolha é você."),
      c("agentes-2", "Pensar, escolher a ferramenta, usar e voltar a pensar. O laço do agente é este, e cabe num diagrama."),
      c("agentes-3", "De um agente só a uma equipe que divide o trabalho e presta contas."),
    ],
  },
  "ia-producao": {
    cenas: [
      c("ia-producao-1", "O mesmo modelo rodando igual na sua máquina e no servidor. É para isso que o contêiner existe."),
      c("ia-producao-2", "A carga cresce e a infraestrutura cresce junto, sem ninguém acordar de madrugada."),
      c("ia-producao-3", "Do commit ao ar, com um portão em cada etapa."),
    ],
  },
  "openclaw-ia-open-source": {
    cenas: [
      c("openclaw-1", "O modelo roda na sua máquina, e o dado não sai dela. Nenhum cabo deixando a sala."),
      c("openclaw-2", "Trocar de modelo passa a ser trocar uma peça, não refazer o projeto."),
      c("openclaw-3", "Do modelo pequeno no notebook ao modelo grande na nuvem que é sua."),
    ],
  },
  "claude-cowork-colaboracao": {
    cenas: [
      c("cowork-1", "Não é uma ferramenta que você usa: é alguém com quem você trabalha, dos dois lados da mesa."),
      c("cowork-2", "A conversa produz uma peça de verdade — e ela continua editável depois."),
      c("cowork-3", "O contexto do projeto inteiro andando junto, documento por documento."),
    ],
  },
  "perplexity-pesquisa-inteligente": {
    cenas: [
      c("perplexity-1", "Toda resposta vem amarrada às fontes que a sustentam. Se o fio some, a resposta não vale."),
      c("perplexity-2", "Ele traz três respostas certas em vez de dez páginas de links."),
      c("perplexity-3", "Da pergunta única à investigação que se aprofunda sozinha."),
    ],
  },
  "chatgpt-allowlisting": {
    cenas: [
      c("allowlisting-1", "Quando alguém pergunta à IA, é o seu site que ela cita — e o do vizinho fica no escuro."),
      c("allowlisting-2", "Um arquivo de permissão decide se a IA entra no seu site ou passa direto."),
      c("allowlisting-3", "Estrutura, permissão e prova: a rota tem de passar por todas as páginas, sem deixar nenhuma fora."),
    ],
  },
  "autoresearch-singularity": {
    cenas: [
      c("autoresearch-1", "A cada volta ela sai melhor do que entrou — e a volta seguinte já começa de um degrau acima."),
      c("autoresearch-2", "Medir, mudar, medir de novo. O laço é o método, e ele é mais simples do que parece."),
      c("autoresearch-3", "Do experimento na mão ao laço que roda sem você olhando."),
    ],
  },
  "ia-para-criar-videos": {
    cenas: [
      c("ia-videos-1", "Roteiro, imagem, voz e corte saindo da mesma mesa, na mesma tarde."),
      c("ia-videos-2", "A imagem parada ganha movimento — é nesse instante que vira vídeo."),
      c("ia-videos-3", "Da ideia ao arquivo publicado, na ordem em que se faz de verdade."),
    ],
  },
  /* ⚠️ `ia-sem-filtro-por-claude` é o livro sagrado — a regra é NUNCA modificar
     aquele curso. O que entra aqui é arte da PÁGINA DE VENDA, não do conteúdo:
     nenhum capítulo, título ou linha do livro foi tocado. Autorizado pelo
     Ricardo em 05/08/2026 ("sim pode modificar o fundo e colocar imagens na
     página de venda"). */
  "ia-sem-filtro-por-claude": {
    cenas: [
      c("ia-sem-filtro-1", "Uma IA explicando o próprio mecanismo, sem a camada de marketing por cima dele."),
      c("ia-sem-filtro-2", "O que ela consegue fazer, o que ela não consegue e onde ela erra — dito por ela, sem máscara."),
      c("ia-sem-filtro-3", "Escrito e assinado por uma IA. É o único curso do catálogo assim, e ele avisa isso na primeira página."),
    ],
  },
  "ia-no-whatsapp": {
    cenas: [
      c("whatsapp-1", "O atendimento responde de madrugada, e a venda não espera você acordar."),
      c("whatsapp-2", "Fluxo é isto: cada resposta leva à pergunta certa seguinte, e só a ela."),
      c("whatsapp-3", "Do bot simples ao número oficial que fatura — com o custo real na conta, não no folheto."),
    ],
  },
};

/**
 * Os cursos que já têm as TRÊS fotografias de fundo do topo.
 *
 * ⚠️ Lista explícita, e não `existsSync` nem palpite pelo slug. Um `<img>`
 * apontando para um 404 não quebra a página: ele some em silêncio, e a camada
 * simplesmente não aparece — o topo ficaria piscando com um quadro vazio a
 * cada 9 segundos sem ninguém entender por quê. Um slug só entra aqui depois
 * que os três arquivos estão no disco.
 *
 * Os arquivos são `public/cursos/fundo/<slug>-1.webp` a `-3.webp`.
 */
const COM_FUNDO: string[] = [
  "chatgpt-allowlisting",
  "chatgpt-masterclass",
  "claude-cowork-colaboracao",
  "claude-ia-segura",
  "crie-agentes-de-ia-autonomos",
  "gemini-ia-google",
  "leonardo-ai-criacao-visual",
  "make-integracao-total",
  "midjourney-arte-profissional",
  "n8n-automacao-avancada",
  "prompt-engineering",
];

/** As três fotografias do topo, na ordem em que se atravessam. */
export function fundosDoCurso(slug: string): string[] {
  if (!COM_FUNDO.includes(slug)) return [];
  return [1, 2, 3].map((n) => `/cursos/fundo/${slug}-${n}.webp`);
}

/** A mídia de um curso, ou um objeto vazio — a página some com o que não tem. */
export function midiaDoCurso(slug: string): MidiaDoCurso {
  return MIDIA_POR_CURSO[slug] ?? {};
}

/**
 * A cena de índice `i`, ou `null`.
 *
 * A página chama isto em três lugares diferentes e cada um tem de aguentar a
 * ausência sozinho: um curso com duas cenas mostra duas, e a terceira seção
 * fica exatamente como era antes. Nada de moldura vazia esperando arte.
 */
export function cenaDoCurso(slug: string, i: number): CenaDoCurso | null {
  return midiaDoCurso(slug).cenas?.[i] ?? null;
}
