/**
 * Tira os modelos desatualizados do texto dos cursos — §3.5 passo 5 do handoff.
 *
 * ── O defeito ──────────────────────────────────────────────────────────────
 *
 * Auditoria de 03/08/2026 (`auditar-cursos.mjs`): 13 dos 27 cursos citavam
 * GPT-4o, Gemini 2.5, Claude 3, Llama 3 e afins como se fossem o estado atual
 * do mundo. 112 ocorrências. O aluno lê "use o GPT-4o" em agosto de 2026 e
 * conclui, com razão, que o curso parou no tempo.
 *
 * ── Por que não é só um find/replace ───────────────────────────────────────
 *
 * Nem toda menção é defeito. "GPT-4 (2023): multimodal, raciocínio melhor" é
 * uma linha do tempo — trocar isso por um modelo de 2026 seria inventar
 * história. "Em fevereiro de 2024, o Google publicou benchmarks mostrando que
 * o Gemini Ultra superava o GPT-4" é um fato datado. Essas ficam literais.
 *
 * O que muda é a menção que se apresenta como presente: recomendação de qual
 * modelo usar, lista do que o produto oferece hoje, `model="gpt-4o"` num bloco
 * de código que o aluno vai copiar.
 *
 * ── Três destinos, não um ──────────────────────────────────────────────────
 *
 * 1. **Token do registry** (`{{fact:chave}}`) para o que é "o topo de linha
 *    agora". `content-facts.ts` troca na entrega, e quando o mundo muda basta
 *    um documento em `content_facts` — não 27 cursos. É o mecanismo que já
 *    existia e que metade do `prompt-engineering` já usava: lá a OpenAI e a
 *    Anthropic eram tokens e só o Google ficou literal, que é como "Gemini
 *    2.5 Pro" sobreviveu em dez lugares.
 *
 * 2. **Nome sem o dígito de versão**, para exemplo técnico que não depende da
 *    versão. "Um modelo Llama 2 70B em float16 ocupa 140GB" vira "um modelo de
 *    70B parâmetros": a conta é a mesma para qualquer 70B, e a frase deixa de
 *    envelhecer. Preferido ao token sempre que der, porque não precisa de
 *    manutenção nenhuma.
 *
 * 3. **Literal**, para história e para preço. Preço é o ponto delicado:
 *    "Gemini 2.5 Flash a $0.15/M" é verdade sobre o 2.5 Flash. Trocar só o
 *    nome pelo token colaria um preço velho num modelo novo — trocaria uma
 *    desatualização visível por uma mentira invisível. Onde há cifra, ou a
 *    frase inteira é redatada, ou o nome fica.
 *
 *   node --env-file=.env.local scripts/atualizar-canon-cursos.mjs           # ensaio
 *   node --env-file=.env.local scripts/atualizar-canon-cursos.mjs --gravar
 */

import { MongoClient } from "mongodb";

/**
 * Uma regra = um slug, uma string exata, uma troca.
 *
 * Strings exatas de propósito: se o texto do curso mudar debaixo desta tabela,
 * a regra não casa e o script grita, em vez de casar por acidente no lugar
 * errado. `vezes` é a conta esperada — divergiu, é erro.
 */
const REGRAS = [
  /* ── autoresearch-singularity ─────────────────────────────────────────── */
  {
    slug: "autoresearch-singularity",
    de: "(Claude Sonnet, GPT-4.1, Qwen3 8B local, Llama 3.3 70B)",
    para: "(Claude {{fact:claude-sonnet}}, {{fact:openai-flagship}}, Qwen3 8B local, Llama 70B local)",
  },
  {
    slug: "autoresearch-singularity",
    de: "Modelos cloud de última geração (Claude Opus, GPT-4.1, Gemini 2.5 Pro) produzem",
    para: "Modelos cloud de última geração (Claude {{fact:claude-flagship}}, {{fact:openai-flagship}}, {{fact:google-pro}}) produzem",
  },
  {
    slug: "autoresearch-singularity",
    de: "modelos de 7-9B parâmetros (Qwen3 8B, Llama 3.1 8B)",
    para: "modelos de 7-9B parâmetros (Qwen3 8B, Llama 8B)",
  },
  {
    slug: "autoresearch-singularity",
    de: "modelos de 14-32B parâmetros (Qwen3 32B, Llama 3.3 70B quantizado)",
    para: "modelos de 14-32B parâmetros (Qwen3 32B, Llama 70B quantizado)",
  },
  {
    slug: "autoresearch-singularity",
    de: '"model": "claude-sonnet-4-20250514"',
    para: '"model": "{{fact:claude-sonnet-model-id}}"',
    vezes: 5,
  },

  /* ── banana-dev-deploy-ia ─────────────────────────────────────────────── */
  {
    // A conta (70B × 2 bytes = 140GB) vale para qualquer modelo de 70B. O nome
    // da versão não acrescenta nada e é justamente o que envelhece.
    slug: "banana-dev-deploy-ia",
    de: "Um modelo Llama 2 70B em precisão float16 ocupa",
    para: "Um modelo de 70B parâmetros em precisão float16 ocupa",
  },
  {
    slug: "banana-dev-deploy-ia",
    de: "modelos open-source como Llama 3, Mistral, Qwen e Gemma rivalizam",
    para: "modelos open-source como Llama, Mistral, Qwen e Gemma rivalizam",
  },
  {
    slug: "banana-dev-deploy-ia",
    de: "selecionar o modelo (Llama 3 70B, Mistral 7B, etc.)",
    para: "selecionar o modelo (Llama 70B, Mistral 7B, etc.)",
  },
  {
    slug: "banana-dev-deploy-ia",
    de: "que produz resultados que rivalizam com DALL-E 3 e Midjourney",
    para: "que produz resultados que rivalizam com o {{fact:image-top}} e o {{fact:midjourney-current}}",
  },

  /* ── chatgpt-masterclass ──────────────────────────────────────────────── */
  {
    slug: "chatgpt-masterclass",
    de: "**Free ($0):** Acesso ao GPT-4o e GPT-4o mini.",
    para: "**Free ($0):** Acesso ao {{fact:openai-flagship}} e ao {{fact:openai-mini}}.",
  },
  {
    slug: "chatgpt-masterclass",
    de: "Seletor de modelo (escolha entre GPT-4o, {{fact:openai-flagship}}, etc.)",
    para: "Seletor de modelo (escolha entre {{fact:openai-flagship}}, {{fact:openai-mini}}, etc.)",
  },
  {
    slug: "chatgpt-masterclass",
    de: 'model="gpt-5.4"',
    para: 'model="{{fact:openai-model-id}}"',
    vezes: 2,
  },
  {
    slug: "chatgpt-masterclass",
    de: 'model="gpt-5.4-mini"',
    para: 'model="{{fact:openai-model-id-mini}}"',
  },
  {
    // A linha some inteira: as outras da tabela já são tokens, e esta trazia
    // preço junto. Trocar só o nome colaria o preço do 4o num modelo novo.
    slug: "chatgpt-masterclass",
    de: "\n| GPT-4o | ~$2.50 | ~$10.00 | 128K | Bom equilíbrio custo/qualidade |",
    para: "",
  },

  /* ── claude-cowork-colaboracao ────────────────────────────────────────── */
  {
    slug: "claude-cowork-colaboracao",
    de: "mais Claude Sonnet 4.5 e GPT-OSS da OpenAI",
    para: "mais Claude {{fact:claude-sonnet}} e GPT-OSS da OpenAI",
  },
  {
    slug: "claude-cowork-colaboracao",
    de: "dá acesso ao Claude Sonnet 4.5 — não é um modelo inferior",
    para: "dá acesso ao Claude {{fact:claude-sonnet}} — não é um modelo inferior",
  },
  {
    slug: "claude-cowork-colaboracao",
    de: "**Modelos e capacidades** — Claude Sonnet 4.5 com janela de contexto",
    para: "**Modelos e capacidades** — Claude {{fact:claude-sonnet}} com janela de contexto",
  },

  /* ── claude-ia-segura ─────────────────────────────────────────────────── */
  {
    // "que é a geração anterior" era verdade quando o Sonnet 4.5 não era o
    // atual. Com o token, a frase passaria a chamar o modelo do momento de
    // geração anterior — então a oração sai junto.
    slug: "claude-ia-segura",
    de: "Você tem acesso ao Claude Sonnet 4.5, que é a geração anterior mas ainda extremamente capaz.",
    para: "Você tem acesso ao Claude {{fact:claude-sonnet}}, que é extremamente capaz.",
  },

  /* ── crie-agentes-de-ia-autonomos ─────────────────────────────────────── */
  {
    slug: "crie-agentes-de-ia-autonomos",
    de: "Modelos como Claude Opus 4, {{fact:openai-family}} e Gemini 2 Ultra conseguem",
    para: "Modelos como Claude {{fact:claude-flagship}}, {{fact:openai-family}} e {{fact:google-pro}} conseguem",
  },
  {
    slug: "crie-agentes-de-ia-autonomos",
    de: "como Claude Opus 4, {{fact:openai-family}}, ou Gemini 2 Ultra — são melhores",
    para: "como Claude {{fact:claude-flagship}}, {{fact:openai-family}}, ou {{fact:google-pro}} — são melhores",
  },
  {
    slug: "crie-agentes-de-ia-autonomos",
    de: "como Claude Haiku, GPT-4o Mini, ou Gemini Flash — são adequados",
    para: "como Claude Haiku, {{fact:openai-mini}}, ou Gemini Flash — são adequados",
  },
  {
    slug: "crie-agentes-de-ia-autonomos",
    de: "requisições por dia com Claude Opus 4 pode custar 50x mais",
    para: "requisições por dia com Claude {{fact:claude-flagship}} pode custar 50x mais",
  },
  {
    // Números de janela de contexto amarrados a versão. A família resolve: a
    // ordem de grandeza continua certa sem prender a frase a um modelo.
    slug: "crie-agentes-de-ia-autonomos",
    de: "200K tokens para Claude, 128K para GPT-4o, 2M para Gemini",
    para: "200K tokens para a linha Claude, mais de 128K para a linha GPT, até 2M para a linha Gemini",
  },
  {
    slug: "crie-agentes-de-ia-autonomos",
    de: "O Claude tem 200K tokens de contexto, o GPT-4o tem 128K, o Gemini 2 tem até 2M.",
    para: "A linha Claude tem 200K tokens de contexto, a linha GPT passa de 128K, a linha Gemini chega a 2M.",
  },
  {
    slug: "crie-agentes-de-ia-autonomos",
    de: "use modelos menores (Haiku, GPT-4o Mini) para tarefas simples",
    para: "use modelos menores (Haiku, {{fact:openai-mini}}) para tarefas simples",
  },
  {
    slug: "crie-agentes-de-ia-autonomos",
    de: 'model="gpt-4o"',
    para: 'model="{{fact:openai-model-id}}"',
    vezes: 6,
  },
  {
    slug: "crie-agentes-de-ia-autonomos",
    de: 'model="gpt-4o-mini"',
    para: 'model="{{fact:openai-model-id-mini}}"',
  },
  {
    slug: "crie-agentes-de-ia-autonomos",
    de: '{"model": "gpt-4o", "temperature": 0}',
    para: '{"model": "{{fact:openai-model-id}}", "temperature": 0}',
    vezes: 2,
  },
  {
    slug: "crie-agentes-de-ia-autonomos",
    de: '{"model": "gpt-4o"}',
    para: '{"model": "{{fact:openai-model-id}}"}',
    vezes: 2,
  },
  {
    slug: "crie-agentes-de-ia-autonomos",
    de: '{"model": "claude-sonnet-4-20250514"}',
    para: '{"model": "{{fact:claude-sonnet-model-id}}"}',
    vezes: 2,
  },
  {
    slug: "crie-agentes-de-ia-autonomos",
    de: 'model="claude-sonnet-4-20250514"',
    para: 'model="{{fact:claude-sonnet-model-id}}"',
    vezes: 16,
  },

  /* ── gemini-ia-google ─────────────────────────────────────────────────── */
  /* O mapa da família 2.5 (com preços) fica literal e datado: a cifra é
   * verdadeira sobre aquele modelo. O que muda é toda menção que se apresenta
   * como recomendação de hoje, e as comparações com a concorrência. */
  {
    slug: "gemini-ia-google",
    de: "é dramaticamente mais barato que o GPT-4o ($2.50) ou o Claude Sonnet ($3.00)",
    para: "é dramaticamente mais barato que os equivalentes da OpenAI e da Anthropic",
  },
  {
    slug: "gemini-ia-google",
    de: "Mesmo o Pro a $1.25/M é competitivo contra GPT-4o a $2.50/M e Claude Sonnet a $3.00/M.",
    para: "Mesmo o Pro a $1.25/M é competitivo contra os modelos equivalentes da OpenAI e da Anthropic.",
  },
  {
    slug: "gemini-ia-google",
    de: "O Claude Opus 4 oferece Extended Thinking",
    para: "O Claude {{fact:claude-flagship}} oferece Extended Thinking",
  },
  {
    slug: "gemini-ia-google",
    de: "O ChatGPT usa seu modelo nativo de geração de imagem integrado ao GPT-4o (sucessor da linha DALL-E)",
    para: "O ChatGPT usa seu modelo nativo de geração de imagem, o {{fact:image-top}} (sucessor da linha DALL-E)",
  },
  {
    slug: "gemini-ia-google",
    de: "A mesma operação com GPT-4o custaria centenas de dólares.",
    para: "A mesma operação com um modelo topo de linha custaria centenas de dólares.",
  },

  /* ── leonardo-ai-criacao-visual ───────────────────────────────────────── */
  {
    slug: "leonardo-ai-criacao-visual",
    de: "O DALL-E 3, da OpenAI, entrega resultados impressionantes",
    para: "O {{fact:image-top}}, da OpenAI, entrega resultados impressionantes",
  },

  /* ── make-integracao-total ────────────────────────────────────────────── */
  {
    slug: "make-integracao-total",
    de: "**OpenAI** (ChatGPT, GPT-4, DALL-E, Whisper)",
    para: "**OpenAI** (ChatGPT, {{fact:openai-flagship}}, {{fact:image-top}}, Whisper)",
  },
  {
    slug: "make-integracao-total",
    de: "use modelos menores quando possível (GPT-4o Mini em vez de GPT-4 para tarefas simples)",
    para: "use modelos menores quando possível ({{fact:openai-mini}} em vez do {{fact:openai-flagship}} para tarefas simples)",
  },

  /* ── n8n-automacao-avancada ───────────────────────────────────────────── */
  {
    slug: "n8n-automacao-avancada",
    de: "OpenAI (GPT-4o, GPT-4 Turbo e modelos mais recentes), Anthropic (Claude 3.5 Sonnet, Claude Opus e as versões 2026)",
    para: "OpenAI ({{fact:openai-flagship}}, {{fact:openai-mini}} e variantes), Anthropic (Claude {{fact:claude-flagship}} e Claude {{fact:claude-sonnet}})",
  },
  {
    slug: "n8n-automacao-avancada",
    de: "configurado com Claude ou GPT-4o como modelo",
    para: "configurado com Claude ou {{fact:openai-flagship}} como modelo",
  },

  /* ── openclaw-ia-open-source ──────────────────────────────────────────── */
  {
    slug: "openclaw-ia-open-source",
    de: "O ChatGPT, com sua linha GPT-4o e sucessores, continua sendo referência",
    para: "O ChatGPT, com sua linha {{fact:openai-flagship}} e sucessores, continua sendo referência",
  },
  {
    slug: "openclaw-ia-open-source",
    de: "GPT-4o para geração de conteúdo à tarde e Llama 3 rodando localmente",
    para: "{{fact:openai-flagship}} para geração de conteúdo à tarde e Llama rodando localmente",
  },
  {
    slug: "openclaw-ia-open-source",
    // Ancorado no `api_key` da linha seguinte: sem isso, esta string com dois
    // espaços de recuo também casaria com a do bloco de roteamento, que tem
    // seis — e a regra de baixo ficaria sem nada para trocar.
    de: '  model: "gpt-4o"\n  api_key:',
    para: '  model: "{{fact:openai-model-id}}"\n  api_key:',
  },
  {
    slug: "openclaw-ia-open-source",
    de: '- id: "gpt-4o"',
    para: '- id: "{{fact:openai-model-id}}"',
  },
  {
    slug: "openclaw-ia-open-source",
    de: '- id: "gpt-4o-mini"',
    para: '- id: "{{fact:openai-model-id-mini}}"',
  },
  {
    slug: "openclaw-ia-open-source",
    de: '      model: "gpt-4o"',
    para: '      model: "{{fact:openai-model-id}}"',
  },
  {
    slug: "openclaw-ia-open-source",
    de: '      model: "gpt-4o-mini"',
    para: '      model: "{{fact:openai-model-id-mini}}"',
  },
  {
    slug: "openclaw-ia-open-source",
    de: '--models "gpt-4o,claude-sonnet-latest,gemini-2.0-flash"',
    para: '--models "{{fact:openai-model-id}},claude-sonnet-latest,{{fact:google-model-id}}"',
  },
  {
    slug: "openclaw-ia-open-source",
    de: 'default: "gpt-4o-mini"',
    para: 'default: "{{fact:openai-model-id-mini}}"',
  },
  {
    slug: "openclaw-ia-open-source",
    de: "O GPT-4o-mini gerava respostas corporativas demais",
    para: "O {{fact:openai-mini}} gerava respostas corporativas demais",
  },
  {
    // Aqui o dígito não diz nada: a afirmação é sobre rodar modelo local numa
    // máquina comum, e vale para a família inteira.
    slug: "openclaw-ia-open-source",
    de: "| 8 GB RAM, sem GPU | Phi-3 Mini (3.8B), Llama 3 8B Q4 |",
    para: "| 8 GB RAM, sem GPU | Phi-3 Mini (3.8B), Llama 8B Q4 |",
  },
  {
    slug: "openclaw-ia-open-source",
    de: "| 16 GB RAM, sem GPU | Llama 3 8B, Mistral 7B, CodeLlama 7B |",
    para: "| 16 GB RAM, sem GPU | Llama 8B, Mistral 7B, CodeLlama 7B |",
  },
  {
    slug: "openclaw-ia-open-source",
    de: "| 16 GB RAM + GPU 8GB | Llama 3 8B (GPU acelerado), Mixtral 8x7B Q4 |",
    para: "| 16 GB RAM + GPU 8GB | Llama 8B (GPU acelerado), Mixtral 8x7B Q4 |",
  },
  {
    slug: "openclaw-ia-open-source",
    de: "| 32 GB RAM + GPU 16GB | Llama 3 70B Q4, Mixtral 8x7B |",
    para: "| 32 GB RAM + GPU 16GB | Llama 70B Q4, Mixtral 8x7B |",
  },
  {
    slug: "openclaw-ia-open-source",
    de: "| 64 GB RAM + GPU 24GB | Llama 3 70B, Command R+, modelos de 100B+ |",
    para: "| 64 GB RAM + GPU 24GB | Llama 70B, Command R+, modelos de 100B+ |",
  },
  {
    slug: "openclaw-ia-open-source",
    de: "Para **chat em português**: Llama 3 8B ou Mistral 7B.",
    para: "Para **chat em português**: Llama 8B ou Mistral 7B.",
  },
  {
    slug: "openclaw-ia-open-source",
    de: "Phi-3 Medium (14B) ou Llama 3 70B.",
    para: "Phi-3 Medium (14B) ou Llama 70B.",
  },
  {
    slug: "openclaw-ia-open-source",
    de: "você pega um modelo genérico como Llama 3 8B e o treina",
    para: "você pega um modelo genérico como o Llama 8B e o treina",
  },

  /* ── perplexity-pesquisa-inteligente ──────────────────────────────────── */
  /* Duas listas do que o Perplexity oferece — a mesma frase, em dois
   * capítulos. Era a fotografia do catálogo de 2024. */
  {
    slug: "perplexity-pesquisa-inteligente",
    de: "incluindo GPT‑4 Turbo, GPT‑4o, Claude 3 Opus, Claude 3 Sonnet, Claude 3.5 Sonnet e os modelos próprios do Perplexity",
    para: "incluindo o {{fact:openai-flagship}}, o Claude {{fact:claude-flagship}}, o Claude {{fact:claude-sonnet}} e os modelos próprios do Perplexity",
  },
  {
    slug: "perplexity-pesquisa-inteligente",
    de: "como GPT‑4 Turbo, GPT‑4o, Claude 3 Opus, Claude 3 Sonnet, Claude 3.5 Sonnet e os modelos próprios do Perplexity",
    para: "como o {{fact:openai-flagship}}, o Claude {{fact:claude-flagship}}, o Claude {{fact:claude-sonnet}} e os modelos próprios do Perplexity",
  },

  /* ── prompt-engineering ───────────────────────────────────────────────── */
  /* Este curso já era metade token: OpenAI e Anthropic tinham chave, o Google
   * ficou literal. É assim que "Gemini 2.5 Pro" sobreviveu em dez lugares. */
  {
    slug: "prompt-engineering",
    de: "Gemini 2.5 Pro",
    para: "{{fact:google-pro}}",
    vezes: 10,
  },
];

async function main() {
  const gravar = process.argv.includes("--gravar");

  const cliente = new MongoClient(process.env.MONGODB_URI);
  await cliente.connect();
  const col = cliente.db("fayapointProdutos").collection("products");

  const slugs = [...new Set(REGRAS.map((r) => r.slug))];
  console.log(
    `${REGRAS.length} regras em ${slugs.length} cursos. ` +
      `${gravar ? "VAI GRAVAR." : "ENSAIO — não grava nada."}\n`
  );

  let trocasTotais = 0;
  let problemas = 0;

  for (const slug of slugs) {
    const p = await col.findOne({ slug }, { projection: { courseContent: 1 } });
    if (!p) {
      console.log(`✗ ${slug} — não existe no banco`);
      problemas++;
      continue;
    }

    let texto = p.courseContent || "";
    let trocasNoCurso = 0;
    const linhas = [];

    for (const r of REGRAS.filter((r) => r.slug === slug)) {
      const esperado = r.vezes ?? 1;
      const achados = texto.split(r.de).length - 1;

      if (achados !== esperado) {
        linhas.push(`   ✗ esperava ${esperado}, achou ${achados}: ${JSON.stringify(r.de.slice(0, 70))}`);
        problemas++;
        continue;
      }

      texto = texto.split(r.de).join(r.para);
      trocasNoCurso += achados;
      linhas.push(`   · ${achados}× ${JSON.stringify(r.de.slice(0, 62))}`);
    }

    console.log(`${slug} — ${trocasNoCurso} trocas`);
    for (const l of linhas) console.log(l);
    trocasTotais += trocasNoCurso;

    if (gravar && trocasNoCurso > 0) {
      await col.updateOne(
        { slug },
        { $set: { courseContent: texto, contentUpdatedAt: new Date() } }
      );
    }
  }

  await cliente.close();
  console.log(`\n${trocasTotais} trocas, ${problemas} regra(s) com problema.`);
  if (problemas) {
    console.log("Regra que não casa NÃO é aplicada — o texto do curso mudou desde que a tabela foi escrita.");
    process.exitCode = 1;
  }
  if (!gravar) console.log("Ensaio. Rode com --gravar para aplicar.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
