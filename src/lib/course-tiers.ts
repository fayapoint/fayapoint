/**
 * FayAI Course Access & Credit System
 *
 * ═══════════════════════════════════════════════════════════
 * SUBSCRIPTION TIERS
 * ═══════════════════════════════════════════════════════════
 *
 * Free:        R$0        — 3 chapter preview per course, no full access
 * Explorador:  R$57/mês   — 3 beginner courses/month, 100 credits
 * Profissional: R$97/mês  — 5 beginner + 2 intermediate + 1 advanced, 300 credits
 * Expert:      R$167/mês  — 7 beginner + 4 intermediate + 3 advanced, 800 credits
 *
 * ═══════════════════════════════════════════════════════════
 * INDIVIDUAL COURSE PURCHASES
 * ═══════════════════════════════════════════════════════════
 *
 * Every course has its own price in fayapointProdutos.products.
 * Checkout resolves that catalog price on the server; course level is never
 * used as a substitute for the product price.
 * Tier discounts apply: Explorador 10%, Profissional 20%, Expert 50%
 *
 * ═══════════════════════════════════════════════════════════
 * MONTHLY ROTATING POOL
 * ═══════════════════════════════════════════════════════════
 *
 * 10 beginner courses available per month
 * 8 intermediate courses available per month
 * 3 advanced courses available per month
 * (rotation managed via admin/mission-control)
 *
 * ═══════════════════════════════════════════════════════════
 * CREDIT SYSTEM (Higgsfield-style)
 * ═══════════════════════════════════════════════════════════
 *
 * Monthly allocation (resets each billing cycle, no rollover):
 *   Free: 0 | Explorador: 100 | Profissional: 300 | Expert: 800
 *
 * Credit costs:
 *   Quiz attempt: 10 | Certificate generation: 20
 *   AI Chat message: 1 | Image generation: 5
 *   Custom course generation: 50
 *
 * Credit packs (one-time purchase, expire in 90 days):
 *   50 credits: R$15 | 150 credits: R$35
 *   500 credits: R$99 | 1000 credits: R$179
 *
 * ═══════════════════════════════════════════════════════════
 * QUIZ & CERTIFICATE PRICING
 * ═══════════════════════════════════════════════════════════
 *
 * Base price: Beginner R$29, Intermediate R$79, Advanced R$199
 * Tier discounts: Explorador 10%, Profissional 20%, Expert 50%
 * Certificate is verifiable online at /certificado/[code]
 */

// ─── Types ───────────────────────────────────────────────

export type CourseLevel = 'free' | 'beginner' | 'intermediate' | 'advanced';
export type SubscriptionPlan = 'free' | 'explorador' | 'profissional' | 'expert';

// Backwards compatibility alias for existing code referencing old plan names
export type LegacyPlan = 'starter' | 'pro' | 'business';

/** Map legacy plan slugs → new plan slugs (for migration) */
export const LEGACY_PLAN_MAP: Record<string, SubscriptionPlan> = {
  free: 'free',
  starter: 'explorador',
  pro: 'profissional',
  business: 'expert',
};

/** Resolve a plan slug that could be legacy or current */
export function resolvePlan(planSlug: string): SubscriptionPlan {
  const resolved = LEGACY_PLAN_MAP[planSlug] ?? planSlug;
  return ['free', 'explorador', 'profissional', 'expert'].includes(resolved)
    ? resolved as SubscriptionPlan
    : 'free';
}

// ─── Tier Limits ─────────────────────────────────────────

export interface TierLimits {
  beginner: number;
  intermediate: number;
  advanced: number;
  unlimited: boolean;
}

export interface TierConfig {
  name: string;
  displayName: string;
  slug: SubscriptionPlan;
  monthlyPrice: number;
  yearlyPrice: number;
  limits: TierLimits;
  monthlyCredits: number;
  /**
   * ── A FRANQUIA DO ASSISTENTE (11/08/2026) ──────────────────────────────────
   *
   * Ricardo: *"conversar com o assistente, depende do plano"*.
   *
   * A conversa não custa crédito e não vai custar: R$1 por mensagem é absurdo,
   * e fração quebraria a paridade que torna todo o resto legível. Mas
   * "ilimitado para todo mundo, inclusive quem não paga" também não é verdade —
   * cada mensagem é uma chamada de modelo, e o gratuito conversando à vontade
   * é o único item da casa que escala com o uso e não com a receita.
   *
   * Então o assistente vira aquilo que o PLANO compra: uma franquia mensal,
   * que zera junto com o ciclo. `Infinity` = sem franquia (o Expert).
   */
  chatMensagensMes: number;
  purchaseDiscount: number;   // 0–1 discount on individual course purchases
  quizDiscount: number;       // 0–1 discount on quiz + certificate
  canAccessLevel: (level: CourseLevel) => boolean;
  features: string[];
}

export const TIER_CONFIGS: Record<SubscriptionPlan, TierConfig> = {
  free: {
    name: 'free',
    displayName: 'Gratuito',
    slug: 'free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      unlimited: false,
    },
    /**
     * ── A ESCADA DE CRÉDITOS (03/08/2026) ─────────────────────────────────
     *
     * A regra, em uma frase que cabe na página de preços: **cada real da sua
     * assinatura vira crédito com bônus — e quanto maior o plano, maior o
     * bônus.**
     *
     * | plano | paga/mês | recebe | multiplicador | dá para personalizar |
     * |---|---|---|---|---|
     * | Gratuito | R$0 | **50** (uma vez) | boas-vindas | 1 curso de entrada inteiro (25 capítulos) |
     * | Explorador | R$57 | **100** | **1,75×** | ~3 cursos medianos |
     * | Profissional | R$97 | **200** | **2,06×** | ~6 cursos medianos |
     * | Expert | R$167 | **400** | **2,40×** | ~12 cursos medianos |
     *
     * ⚠️ O teto do Expert é decisão do Ricardo e tem faixa: *"no plano expert o
     * valor deve ser algo em torno de 2 a 3× o valor da assinatura"*. 400 sobre
     * 167 dá 2,40× — dentro da faixa, com folga dos dois lados. **Se mexer no
     * preço do plano, mexa aqui junto**, senão o multiplicador escorrega sem
     * ninguém perceber.
     *
     * O gratuito recebe **50, uma vez** (não por mês). É a promessa que o
     * Ricardo pediu — *"no plano gratuito, o usuário ganha o equivalente para
     * criar um curso"* — e a R$2 o capítulo isso é um curso de até 25
     * capítulos, que cobre a maior parte do catálogo. Vale só depois que o
     * curso está no acervo dele: o `POST /api/user/curso-personalizado` recusa
     * personalizar curso que a pessoa não pode abrir, para o crédito de
     * boas-vindas não virar dinheiro queimado em capítulo trancado.
     */
    monthlyCredits: 50,
    /** 20 mensagens para experimentar. Suficiente para ver que serve, curto para não virar o produto. */
    chatMensagensMes: 20,
    purchaseDiscount: 0,
    quizDiscount: 0,
    canAccessLevel: (level) => level === 'free',
    features: [
      '50 créditos de boas-vindas (= R$50)',
      'Dá para personalizar um curso inteiro',
      '20 mensagens com o assistente por mês',
      '3 capítulos grátis por curso',
      '1 curso aberto por vez',
    ],
  },
  explorador: {
    name: 'explorador',
    displayName: 'Explorador',
    slug: 'explorador',
    monthlyPrice: 57,
    yearlyPrice: 570,      // ~R$47.50/mês (2 meses grátis)
    limits: {
      beginner: 3,
      intermediate: 0,
      advanced: 0,
      unlimited: false,
    },
    /** R$57 viram 57 + 43 de bônus (75%). ~6 cursos medianos personalizados. */
    monthlyCredits: 100,
    chatMensagensMes: 300,
    purchaseDiscount: 0.10,
    quizDiscount: 0.10,
    canAccessLevel: (level) => level === 'free' || level === 'beginner',
    features: [
      '2 cursos abertos ao mesmo tempo',
      '3 cursos iniciantes por mês',
      '100 créditos/mês (= R$100, com 75% de bônus)',
      '300 mensagens com o assistente por mês',
      '10% de desconto em certificações',
      '10% de desconto na compra de cursos avulsos',
      'Certificados verificáveis online',
      'Acesso à comunidade',
    ],
  },
  profissional: {
    name: 'profissional',
    displayName: 'Profissional',
    slug: 'profissional',
    monthlyPrice: 97,
    yearlyPrice: 970,      // ~R$80.83/mês (2 meses grátis)
    limits: {
      beginner: 5,
      intermediate: 2,
      advanced: 1,
      unlimited: false,
    },
    /** R$97 viram 97 + 103 de bônus (106%). ~12 cursos medianos. */
    monthlyCredits: 200,
    chatMensagensMes: 1000,
    purchaseDiscount: 0.20,
    quizDiscount: 0.20,
    canAccessLevel: () => true,
    features: [
      'Assistente sem limite prático (1.000 mensagens/mês)',
      '3 cursos abertos ao mesmo tempo',
      '5 cursos iniciantes por mês',
      '2 cursos intermediários por mês',
      '1 curso avançado por mês',
      '200 créditos/mês (= R$200, com 106% de bônus)',
      '20% de desconto em certificações',
      '20% de desconto na compra de cursos avulsos',
      'Suporte prioritário',
      'Conteúdo exclusivo e antecipado',
    ],
  },
  expert: {
    name: 'expert',
    displayName: 'Expert',
    slug: 'expert',
    monthlyPrice: 167,
    yearlyPrice: 1670,     // ~R$139.17/mês (2 meses grátis)
    /**
     * ── O Expert lê o acervo INTEIRO (03/08/2026) ─────────────────────────
     *
     * Ricardo, assinante do plano máximo, batendo em "Exige upgrade":
     * *"eu estar com o plano melhor do site, o expert, e não conseguir ver os
     * cursos novos... fica sendo muito frustrante"* — e upgrade para ONDE, se
     * não existe degrau acima do Expert? O rótulo apontava para uma porta que
     * não existe.
     *
     * A escassez não foi removida, foi MOVIDA. A decisão original (assinar não
     * é ler tudo) continua valendo para Explorador e Profissional, e o que o
     * Expert paga passa a comprar duas coisas melhores que um cadeado de
     * leitura:
     *
     *   1. o CERTIFICADO, que nenhum plano dá de graça — exige concluir as
     *      aulas, passar no quiz e pagar a taxa (aqui com 50% de desconto).
     *      Certificado que vem junto com a assinatura não vale nada na parede;
     *   2. a PERSONALIZAÇÃO, que se paga em créditos — e é o que faz os 800
     *      créditos/mês deixarem de ser número morto.
     *
     * `CURSOS_SIMULTANEOS` continua valendo e não é afrouxado por isto: o teto
     * de 4 cursos abertos ao mesmo tempo é outra conversa ("termine um"), não
     * um pedido de dinheiro. Ler tudo, sim; ler tudo AO MESMO TEMPO, não.
     */
    limits: {
      beginner: Infinity,
      intermediate: Infinity,
      advanced: Infinity,
      unlimited: true,
    },
    /** R$167 viram 167 + 233 de bônus (140%). ~25 cursos medianos — o catálogo tem 22. */
    monthlyCredits: 400,
    /** Sem franquia. É o único plano em que o assistente é de fato ilimitado. */
    chatMensagensMes: Infinity,
    purchaseDiscount: 0.50,
    quizDiscount: 0.50,
    canAccessLevel: () => true,
    features: [
      'Assistente ilimitado',
      'Acervo completo — todos os cursos, sem cadeado',
      '4 cursos abertos ao mesmo tempo',
      '400 créditos/mês (= R$400, com 140% de bônus)',
      '50% de desconto em certificações',
      '50% de desconto na compra de cursos avulsos',
      'Suporte VIP + conteúdo exclusivo',
      'Consultoria mensal com especialista',
    ],
  },
};

/**
 * Quantos cursos podem estar ABERTOS ao mesmo tempo, por plano.
 *
 * ── Por que este limite existe (03/08/2026) ────────────────────────────────
 *
 * Os limites que já existiam em `TierConfig.limits` são de MATRÍCULA POR MÊS —
 * quantos cursos novos o plano libera no período. Eles não impedem que a pessoa
 * abra sete cursos e não termine nenhum, e é exatamente isso que corrói a
 * assinatura: quem tem acesso a tudo de uma vez sente que já levou tudo no
 * primeiro mês e cancela. Um catálogo grande vira argumento contra a
 * recorrência em vez de a favor.
 *
 * O limite simultâneo transforma o catálogo em fila. Terminar um curso é o que
 * abre a vaga do próximo, e isso alinha três coisas que antes brigavam: o aluno
 * conclui mais, o certificado é emitido mais, e a assinatura tem motivo para
 * continuar no mês seguinte.
 *
 * O número do Expert — 4 — é decisão do Ricardo. Os outros degraus descem de um
 * em um a partir dele, para que subir de plano seja sentido na hora.
 *
 * Curso CONCLUÍDO não ocupa vaga: o limite é sobre o que está em andamento, não
 * sobre o que já foi feito. Sem isso o aluno aplicado seria o mais punido.
 */
export const CURSOS_SIMULTANEOS: Record<SubscriptionPlan, number> = {
  free: 1,
  explorador: 2,
  profissional: 3,
  expert: 4,
};

export function limiteSimultaneo(plan: SubscriptionPlan): number {
  return CURSOS_SIMULTANEOS[plan] ?? 1;
}

/** Quiz + Certificate base price */
export const QUIZ_CERTIFICATE_BASE_PRICE: Record<CourseLevel, number> = {
  free: 19,
  beginner: 29,
  intermediate: 79,
  advanced: 199,
};

export const COURSE_LEVEL_HIERARCHY: Record<CourseLevel, number> = {
  free: 0,
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

// ─── Credit System ───────────────────────────────────────

/**
 * ═══════════════════════════════════════════════════════════
 * 1 CRÉDITO = R$ 1,00  (decisão do Ricardo, 03/08/2026)
 * ═══════════════════════════════════════════════════════════
 *
 * Antes, os créditos eram um número sem lastro: 800 no Expert, 50 para
 * personalizar um curso, pacotes a R$0,18–0,30 por crédito. Ninguém — nem nós —
 * conseguia dizer se 50 créditos era caro ou barato, porque não havia com o quê
 * comparar. Ricardo: *"ao invés de inventar um número qualquer baseado em nada,
 * quero que seja dinheiro de verdade."*
 *
 * Com a paridade, todo preço deste arquivo vira uma frase em português que o
 * aluno confere sozinho: "personalizar este curso custa 16 créditos" é
 * "custa R$16", e ele sabe na hora se vale.
 *
 * ## Preço de VENDA, nunca preço de custo
 *
 * O custo real de um capítulo personalizado é **R$0,002** (DeepSeek V4 flash a
 * US$0,09/0,18 por milhão, ~1.600 tokens de entrada e ~1.200 de saída, medido
 * em 03/08). Esse número **não** é a base do preço, e a regra é do Ricardo:
 * *"não interessa o quanto custa para nós, até porque todo meu investimento de
 * tempo de 3 anos neste projeto e todos os custos que tenho devem ser
 * embutidos... nossos custos devem ser justos mas não absolutamente a preço de
 * banana."*
 *
 * O que o aluno compra não é uma chamada de API: é um catálogo curado, três
 * anos de trabalho e um curso que passa a falar do negócio dele. O preço reflete
 * isso. A margem alta não é oportunismo — é o que financia o que já existe.
 *
 * ## As contas que sustentam os números abaixo
 *
 * Catálogo medido em 03/08: 22 cursos ativos, 451 capítulos. Menor curso 13
 * capítulos, mediana 16, média 20,5, maior 30. Preço médio de curso: R$91.
 */
export const CREDITO_EM_REAIS = 1;

export const CREDIT_COSTS = {
  /**
   * ZERO — **a tentativa deixou de ser um produto** (11/08/2026).
   *
   * Ricardo: *"tentativa no quiz mudou para emitir certificado"*. Cobrar a
   * tentativa era cobrar o aluno por tentar provar o que aprendeu, e produzia
   * a pior conversa possível: quem errou pagou e não levou nada. Agora existe
   * **um preço só**, o do certificado, e ele é cobrado **quando o documento é
   * emitido** — quem reprova não paga nada.
   *
   * A chave continua exportada (e vale zero) porque o extrato de quem já pagou
   * tentativa cita `quiz_attempt` e a rota `/api/credits` valida a ação contra
   * este objeto. Apagar a chave apagaria o passado do extrato.
   */
  quiz_attempt: 0,
  /**
   * **R$50 — o quiz E o certificado, num preço só** (11/08/2026, Ricardo).
   *
   * Subiu de 15 para 50 e absorveu a tentativa. O que sustenta o número não é
   * o custo de gerar um PDF: é que o certificado é **verificável em endereço
   * público** e exige, nesta ordem, 100% do curso lido, aprovação num quiz que
   * o servidor corrige e nunca revela, e um limite de tentativas. Documento que
   * qualquer um emite não vale nada na parede — o preço é parte da prova.
   *
   * ⚠️ Cobrado **só na aprovação**. Ver `POST /api/courses/[slug]/quiz`.
   */
  certificate_generation: 50,
  /**
   * ZERO em crédito — **o assistente é do PLANO** (revisto em 11/08/2026).
   *
   * Ricardo: *"conversar com o assistente, depende do plano"*. Continua sem
   * custar crédito (cobrar R$1 por mensagem seria absurdo, e fração quebraria
   * a paridade), mas deixou de ser ilimitado para todo mundo: a franquia
   * mensal por plano vive em `TierConfig.chatMensagensMes` e é o que o plano
   * realmente compra. Crédito é para ENTREGA; conversa é para assinatura.
   */
  ai_chat_message: 0,
  /** **R$1 por imagem** gerada no seu contexto (11/08/2026, Ricardo). Era R$3. */
  image_generation: 1,
  /**
   * O storyboard de uma peça — 20/08/2026.
   *
   * Uma chamada de modelo devolve a peça inteira: os quadros, o que se vê em
   * cada um, o texto de tela, a fala e os ajustes de câmera. Custa pouco de
   * rodar e vale muito de ter, então o preço é de entrada — o que a pessoa
   * gasta de verdade vem depois, quando manda gerar as imagens dos quadros
   * (`image_generation`, R$1 cada).
   *
   * Editável na tabela viva (`/precos-creditos` no Mission Control).
   */
  storyboard_gerar: 2,
  /**
   * ⚠️ Preço FIXO, de quando a personalização era um botão só (27/07). Um curso
   * de 5 capítulos e um de 30 custavam o mesmo — e o de 30 dá seis vezes mais
   * trabalho ao modelo. Continua exportado porque rotas antigas o citam, mas o
   * Ateliê cobra por capítulo (abaixo).
   */
  custom_course_generation: 50,
  /**
   * ⚠️ **Aposentado em 11/08/2026** — o preço do capítulo virou preço de CURSO.
   *
   * Ricardo: *"reescrever capítulo deve mudar para curso. E cobraremos 25"*. O
   * preço por capítulo era honesto na conta e ruim na cabeça do aluno: ele
   * escolhia um curso e recebia um número diferente para cada um (R$26, R$41,
   * R$60), sem saber de antemão quanto o "seu curso do seu jeito" custa. Um
   * preço de tabela — 25 — é uma promessa que cabe na vitrine.
   *
   * Continua exportado em **zero** porque o extrato de quem pagou por capítulo
   * cita esta chave, e a rota de crédito valida a ação contra este objeto.
   * A chave está zerada de propósito: se alguma rota antiga ainda cobrar por
   * ela, ela cobra nada em vez de cobrar duas vezes o mesmo curso.
   */
  custom_course_chapter: 0,
  /**
   * **O PRIMEIRO caderno é de graça** (11/08/2026, Ricardo: *"caderno de
   * personagem, 1 – 0"*).
   *
   * O caderno é o insumo sem o qual "curso com o SEU rosto" não passa de
   * promessa — e cobrar R$40 pelo insumo, antes de a pessoa ter visto uma
   * única imagem com a cara dela, era pedir fé adiantada. Grátis na primeira
   * vez, o caderno deixa de ser uma compra e vira parte de conhecer o produto;
   * o dinheiro passa a estar onde há uso repetido.
   */
  character_sheet: 0,
  /**
   * **R$20 do segundo em diante** (11/08/2026, Ricardo: *"demais refaturas ou
   * personagens – 20"*).
   *
   * Vale para refazer o seu caderno (mudou o cabelo, a foto, o enquadramento)
   * e para cadastrar OUTRO personagem — sócio, mascote, cliente. São quatro
   * gerações de imagem com consistência de rosto entre elas; a R$1 a imagem
   * avulsa, os R$20 pagam a consistência, que é a parte cara.
   */
  character_sheet_extra: 20,
  /**
   * **R$1 por capítulo narrado** (10/08/2026).
   *
   * Um capítulo tem ~8 mil caracteres; a narração profissional dele em TTS
   * custa centavos de insumo, mas o que se vende aqui é o audiolivro do SEU
   * curso — com a sua camada personalizada dentro, na voz que você escolheu.
   * Metade do preço do capítulo escrito porque o trabalho pesado (adaptar o
   * texto a você) já foi pago ali; aqui é a locução em cima.
   */
  course_narration_chapter: 1,
  /**
   * ── OS QUATRO PACOTES DO CURSO (11/08/2026) ──────────────────────────────
   *
   * Ricardo: *"reescrever capítulo deve mudar para curso. E cobraremos 25, e
   * devem ter as opções de tier até o com vídeo e áudiobook. Que deverá custar
   * 100"*.
   *
   * As duas pontas são dele — **25** na entrada e **100** no completo. Os dois
   * degraus do meio são a escada entre elas, e existem porque uma escolha entre
   * 25 e 100 não é uma escada, é um abismo: quem quer imagem mas não quer
   * vídeo não tem para onde ir e volta para os 25.
   *
   * Cada degrau ACUMULA o anterior — quem sobe não recompra o que já tem, paga
   * a diferença (ver `diferencaDePacote`). É o que faz o 100 parecer o topo de
   * um caminho e não um segundo produto.
   *
   * ⚠️ **Preço por CURSO, não por capítulo.** Um curso de 13 capítulos e um de
   * 30 custam o mesmo. É pior para a nossa conta no curso grande e muito melhor
   * para a vitrine: o preço vira tabela, e tabela é o que se anuncia.
   */
  /**
   * ⚠️ Regerar um capítulo JÁ ESCRITO custa (16/08/2026).
   *
   * Ricardo: *"ele não pode custar zero para gerar outro nunca, pois assim
   * poderíamos ter um sem fim de requisições só porque é de graça."*
   *
   * "Pagou uma vez, é seu" continua valendo para TERMINAR o curso — capítulo
   * sem camada nenhuma já está comprado no pacote. O que passa a custar é
   * REESCREVER o que já foi entregue, que era o único caminho por onde um laço
   * infinito de chamadas de modelo passava sem atrito.
   *
   * Editável na tabela viva (`/precos-creditos` no Mission Control), como todo
   * preço desta lista.
   */
  curso_regerar_capitulo: 2,
  curso_escrito: 25,
  curso_ilustrado: 45,
  curso_narrado: 70,
  curso_completo: 100,

  // ─── A FORJA (27/08/2026) ────────────────────────────────
  //
  // Ricardo: *"para as gerações 'grátis' que serão feitas com meu computador
  // local, isso tem que ser o padrão, vai ter uma fila."*
  //
  // A consequência dessa frase está em `forja_local: 0`, e ela é a decisão
  // inteira: a GPU da casa não emite fatura, então cobrar por rodar nela seria
  // cobrar por nada. O preço do caminho grátis é o TEMPO.
  //
  // O que sobra para vender é a remoção das três restrições reais — a espera, o
  // teto de uso justo e a máquina estar desligada. Cada uma é uma linha abaixo,
  // e cada uma entrega exatamente o que o nome diz.
  //
  // ⚠️ Toda linha aqui é editável na tabela viva (`/precos-creditos`), e a
  // cobrança acontece na CONCLUSÃO do trabalho, nunca no enfileiramento: quem
  // teve o trabalho falhando na GPU não paga nada.

  /** O padrão. Zero, e é o ponto. */
  forja_local: 0,
  /** Uma imagem num servidor pago — quando a máquina da casa está desligada. Ancorado no `image_generation`. */
  forja_imagem_nuvem: 1,
  /** Um clipe num servidor pago. Um vídeo de 5s custa US$0,20–0,50 de verdade; 12 cobre com folga de câmbio. */
  forja_video_nuvem: 12,
  /**
   * A frente da fila.
   *
   * Barato de propósito: se doer, ninguém compra e a fila continua do mesmo
   * tamanho. O item existe para ser usado, não para ser admirado.
   */
  forja_furar_fila: 2,
  /** Continuar gerando depois do teto diário — mesma GPU, mesma qualidade, só a continuação. */
  forja_extra_do_dia: 1,
  //
  // ⚠️ Não há linha de "personagem extra" na Forja, e a ausência é deliberada.
  // O `character_sheet_extra: 20` acima continua valendo para o caderno da
  // NUVEM (a rota `/api/user/caderno`), que gasta API paga. O caderno da Forja
  // roda na GPU da casa e custa zero — cobrar 20 por um recurso que não custa
  // nada seria inventar escassez, e a ficha de personagem é um formulário:
  // cobrar por preencher formulário faz a pessoa desconfiar do resto da tabela.
  // Quem protege a placa é o teto diário de uso justo, não o preço.
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

// ─── Os pacotes do Ateliê ────────────────────────────────

export type IdPacote = 'escrito' | 'ilustrado' | 'narrado' | 'completo';

export interface PacoteCurso {
  id: IdPacote;
  /** A chave em `CREDIT_COSTS` — é dela que sai o preço, e é ela que vai ao extrato. */
  acao: CreditAction;
  titulo: string;
  promessa: string;
  /** O que ESTE degrau acrescenta ao anterior. A tela lista os de baixo junto. */
  inclui: string[];
  /** Ainda não há produção para entregar — aparece anunciado e não é cobrável. */
  emBreve?: boolean;
  /** Ilustração do degrau (`/precos/…`). Sem ela a tela cai no emoji. */
  imagem?: string;
  emoji: string;
}

/**
 * ⚠️ A ORDEM É A ESCADA. Índice maior = degrau mais alto, e é isso que
 * `diferencaDePacote` usa para saber se o aluno está subindo ou já pagou.
 */
export const PACOTES_CURSO: PacoteCurso[] = [
  {
    id: 'escrito',
    acao: 'curso_escrito',
    titulo: 'O curso escrito para você',
    promessa: 'Cada capítulo ganha abertura, exemplo e tarefa no contexto do seu negócio.',
    inclui: ['Todos os capítulos reescritos no seu contexto', 'Ajustes de tom, profundidade e foco', 'Atualizações quando você aprofundar seu perfil'],
    emoji: '✍️',
    imagem: '/precos/curso-escrito.webp',
  },
  {
    id: 'ilustrado',
    acao: 'curso_ilustrado',
    titulo: 'Escrito e ilustrado',
    promessa: 'Uma imagem por capítulo, gerada do seu ramo e do seu público — não banco de imagens.',
    inclui: ['Uma ilustração por capítulo', 'Com o seu rosto, se você tiver caderno de personagem'],
    emoji: '🖼️',
    imagem: '/precos/curso-ilustrado.webp',
  },
  {
    id: 'narrado',
    acao: 'curso_narrado',
    titulo: 'Com audiobook',
    promessa: 'O curso inteiro em áudio, na voz que você escolher — para estudar dirigindo ou treinando.',
    inclui: ['Audiobook do curso personalizado', 'Narrador à sua escolha'],
    emoji: '🎧',
    imagem: '/precos/curso-narrado.webp',
    // A cota de TTS acabou em abril (`public/audio/PRODUCTION_STATUS.md`).
    // Anunciar o preço é honesto; cobrar sem entregar não é.
    emBreve: true,
  },
  {
    id: 'completo',
    acao: 'curso_completo',
    titulo: 'Completo — com vídeo e audiobook',
    promessa: 'O curso todo seu: escrito, ilustrado, narrado e com vídeo de abertura por módulo.',
    inclui: ['Vídeo de abertura por módulo', 'Tudo dos degraus anteriores'],
    emoji: '🎬',
    imagem: '/precos/curso-completo.webp',
    emBreve: true,
  },
];

export function acharPacote(id: string): PacoteCurso {
  return PACOTES_CURSO.find((p) => p.id === id) || PACOTES_CURSO[0];
}

/**
 * Quanto custa ir do pacote que o aluno JÁ PAGOU para o que ele quer.
 *
 * ⚠️ Nunca devolve negativo: descer de degrau não gera crédito de volta. E
 * pagar de novo o mesmo degrau devolve zero — o pacote é por curso, e uma vez
 * pago cobre também as regerações depois de o perfil mudar.
 */
export function diferencaDePacote(
  jaPago: IdPacote | null,
  desejado: IdPacote,
  precos: Record<string, number> = CREDIT_COSTS,
): number {
  const alvo = precos[acharPacote(desejado).acao] ?? 0;
  if (!jaPago) return alvo;
  const pago = precos[acharPacote(jaPago).acao] ?? 0;
  return Math.max(0, alvo - pago);
}

export interface CreditPack {
  id: string;
  credits: number;
  priceReais: number;
  expiresInDays: number;
  savings: string;       // e.g. "23% economia"
}

/**
 * Os pacotes, na paridade.
 *
 * ⚠️ O desconto mudou de LUGAR e isso é o ponto. Antes o pacote grande baixava
 * o preço do crédito (R$0,18 contra R$0,30), o que só funcionava porque o
 * crédito não valia nada definido — três preços diferentes para a mesma coisa.
 * Com 1 crédito = R$1 fixo, baixar o preço do crédito quebraria a paridade que
 * torna tudo legível. Então o volume passa a dar **crédito de bônus**: você
 * paga R$100 e recebe 115. O desconto existe, e a régua continua de pé.
 */
export const CREDIT_PACKS: CreditPack[] = [
  { id: 'pack-30',  credits: 30,  priceReais: 30,  expiresInDays: 90, savings: '' },
  { id: 'pack-100', credits: 115, priceReais: 100, expiresInDays: 90, savings: '+15 de bônus' },
  { id: 'pack-250', credits: 300, priceReais: 250, expiresInDays: 90, savings: '+50 de bônus' },
  { id: 'pack-500', credits: 650, priceReais: 500, expiresInDays: 90, savings: '+150 de bônus' },
];

// ─── Monthly Rotating Pool ───────────────────────────────

export const MONTHLY_POOL = {
  beginner: 10,       // all beginner courses available per month
  intermediate: 8,    // all intermediate courses available per month
  advanced: 5,        // all advanced courses available per month (Expert sees all)
} as const;

// ─── Price Calculations ──────────────────────────────────

/**
 * Calculate the quiz + certificate price for a user's tier
 */
export function getQuizCertificatePrice(
  plan: SubscriptionPlan,
  courseLevel: CourseLevel
): { basePrice: number; discount: number; finalPrice: number } {
  const basePrice = QUIZ_CERTIFICATE_BASE_PRICE[courseLevel];
  const config = TIER_CONFIGS[plan];
  const discount = config.quizDiscount;
  const finalPrice = Math.round(basePrice * (1 - discount));
  return { basePrice, discount, finalPrice };
}

// ─── Level Normalization ─────────────────────────────────

/**
 * Map Portuguese course level strings to standardized CourseLevel
 */
/**
 * O nível do curso, reduzido às quatro faixas que as cotas conhecem.
 *
 * ## O vocabulário real do banco (medido em 03/08/2026, 22 cursos ativos)
 *
 * `Todos os níveis` (6) · `Intermediário` (4) · `Iniciante a Intermediário` (4)
 * · `Iniciante` (3) · `Avançado` (3) · `Iniciante a Avançado` (1) ·
 * `Intermediário a Avançado` (1). Nos rascunhos aparece ainda `beginner`, em
 * inglês.
 *
 * ⚠️ Correção de registro: o handoff de 03/08 dizia que "Todos os níveis não
 * mapeia em cota nenhuma". Medido, mapeia — cai em `beginner` pela cláusula
 * abaixo. O defeito real era outro, e é o que esta função passou a tratar.
 *
 * ## A regra das FAIXAS: vale o piso, não o teto
 *
 * O defeito: `Iniciante a Avançado` era classificado como `advanced`, porque
 * `includes('avançado')` era testado antes de `includes('iniciante')`. Um curso
 * que anuncia começar do zero ficava fora da cota de quem está começando — e
 * `Iniciante a Intermediário`, que é a mesma ideia, caía em `beginner`. Duas
 * faixas equivalentes, dois destinos opostos.
 *
 * A faixa passa a valer pelo PISO. O que a cota decide é "esta pessoa consegue
 * COMEÇAR este curso", e quem escreveu "Iniciante a Avançado" está dizendo
 * exatamente que dá para começar do zero. Classificar pelo teto transformava a
 * promessa da vitrine em cadeado.
 *
 * ⚠️ Isto MOVE dois cursos de faixa: `leonardo-ai-criacao-visual`
 * (Iniciante a Avançado) e `claude-ia-segura` (Intermediário a Avançado) saem
 * de `advanced` para `beginner` e `intermediate`. É mudança visível de acesso
 * nos planos com cota — está aqui como decisão consciente, não como efeito
 * colateral, e cabe ao Ricardo mantê-la ou reverter.
 *
 * ## A ordem dos testes é a regra
 *
 * Piso primeiro (do mais baixo para o mais alto), depois os valores simples.
 * Inverter a ordem reintroduz o defeito sem que nenhum teste perceba.
 */
export function normalizeCourseLevel(levelString: string): CourseLevel {
  const normalized = String(levelString ?? '').toLowerCase().trim();

  if (normalized.includes('grátis') || normalized.includes('gratuito') || normalized === 'free') {
    return 'free';
  }

  // ── Faixas: o piso manda ────────────────────────────────────────────────
  // "Iniciante a X" começa no iniciante, seja X o que for.
  if (normalized.includes('iniciante a ')) {
    return 'beginner';
  }
  if (normalized.includes('intermediário a ') || normalized.includes('intermediario a ')) {
    return 'intermediate';
  }

  // ── Valores simples ─────────────────────────────────────────────────────
  if (normalized.includes('avançado') || normalized.includes('avancado') || normalized === 'advanced') {
    return 'advanced';
  }
  if (normalized === 'intermediário' || normalized === 'intermediario' || normalized === 'intermediate') {
    return 'intermediate';
  }
  if (
    normalized.includes('iniciante') ||
    normalized.includes('todos os níveis') ||
    normalized.includes('todos os niveis') ||
    normalized === 'beginner' ||
    normalized === 'all'
  ) {
    return 'beginner';
  }

  // Vocabulário novo que ninguém previu cai no mais aberto: um curso invisível
  // por causa de um rótulo desconhecido é pior que um curso aberto demais.
  return 'beginner';
}

/**
 * A matrícula neste curso é gratuita?
 *
 * ⚠️ Existe para que a BIBLIOTECA e o SERVIDOR respondam a mesma coisa.
 *
 * O `POST /api/courses/enroll` já decidia assim (`isFreeEnrollment`) e
 * matriculava sem cobrar nem consumir vaga. A biblioteca decidia por outro
 * caminho — nível + vaga + rotação do mês — e chegava ao contrário: etiquetava
 * **"Exige upgrade"** num curso que o servidor liberaria sem discutir. Regra
 * duplicada é regra que diverge; agora é uma função só, chamada dos dois lados.
 *
 * `price === 0` fica explícito (e não `!price`) para que preço AUSENTE não
 * vire curso grátis por omissão — o erro cairia para o lado de dar de graça o
 * que é pago.
 */
export function matriculaEhGratuita(level: CourseLevel, price?: number): boolean {
  return level === 'free' || price === 0;
}

// ─── Enrollment Slots ────────────────────────────────────

export interface EnrollmentSlots {
  beginner: { used: number; limit: number; available: number };
  intermediate: { used: number; limit: number; available: number };
  advanced: { used: number; limit: number; available: number };
}

export interface EnrolledCourse {
  courseId: string;
  courseSlug?: string;
  level: CourseLevel;
  enrolledAt: Date;
  isActive: boolean;
}

/**
 * Calculate remaining enrollment slots for a user (monthly window)
 */
export function calculateEnrollmentSlots(
  plan: SubscriptionPlan,
  enrolledCourses: EnrolledCourse[]
): EnrollmentSlots {
  const resolved = resolvePlan(plan);
  const config = TIER_CONFIGS[resolved];
  const limits = config.limits;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonthEnrollments = enrolledCourses.filter(
    (c) => c.isActive && new Date(c.enrolledAt) >= monthStart
  );

  const beginnerUsed = thisMonthEnrollments.filter(
    (c) => c.level === 'free' || c.level === 'beginner'
  ).length;
  const intermediateUsed = thisMonthEnrollments.filter(
    (c) => c.level === 'intermediate'
  ).length;
  const advancedUsed = thisMonthEnrollments.filter(
    (c) => c.level === 'advanced'
  ).length;

  return {
    beginner: {
      used: beginnerUsed,
      limit: limits.unlimited ? Infinity : limits.beginner,
      available: limits.unlimited
        ? Infinity
        : Math.max(0, limits.beginner - beginnerUsed),
    },
    intermediate: {
      used: intermediateUsed,
      limit: limits.unlimited ? Infinity : limits.intermediate,
      available: limits.unlimited
        ? Infinity
        : Math.max(0, limits.intermediate - intermediateUsed),
    },
    advanced: {
      used: advancedUsed,
      limit: limits.unlimited ? Infinity : limits.advanced,
      available: limits.unlimited
        ? Infinity
        : Math.max(0, limits.advanced - advancedUsed),
    },
  };
}

// ─── Enrollment Checks ───────────────────────────────────

export function getSlotCategory(level: CourseLevel): 'beginner' | 'intermediate' | 'advanced' {
  if (level === 'free' || level === 'beginner') return 'beginner';
  return level;
}

export function canTierAccessLevel(plan: SubscriptionPlan, level: CourseLevel): boolean {
  const resolved = resolvePlan(plan);
  const config = TIER_CONFIGS[resolved];
  return config ? config.canAccessLevel(level) : false;
}

export function canEnrollInCourse(
  plan: SubscriptionPlan,
  courseLevel: CourseLevel,
  enrolledCourses: EnrolledCourse[],
  targetCourseId: string
): { canEnroll: boolean; reason?: string; upgradeRequired?: boolean; canPurchase?: boolean } {
  const resolved = resolvePlan(plan);
  const config = TIER_CONFIGS[resolved];

  // Free plan — preview only, but they CAN purchase individual courses
  if (resolved === 'free') {
    return {
      canEnroll: false,
      reason: 'Assine um plano para acessar cursos completos, ou compre este curso individualmente.',
      upgradeRequired: true,
      canPurchase: true,
    };
  }

  // Check if tier can access this level
  if (!config.canAccessLevel(courseLevel)) {
    const levelName =
      courseLevel === 'advanced' ? 'avançados'
        : courseLevel === 'intermediate' ? 'intermediários'
          : 'deste nível';
    return {
      canEnroll: false,
      reason: `Seu plano ${config.displayName} não permite acesso a cursos ${levelName}. Faça upgrade ou compre individualmente.`,
      upgradeRequired: true,
      canPurchase: true,
    };
  }

  // Check if already enrolled
  const alreadyEnrolled = enrolledCourses.find(
    (c) => (c.courseId === targetCourseId || c.courseSlug === targetCourseId) && c.isActive
  );
  if (alreadyEnrolled) {
    return { canEnroll: true };
  }

  // Check slot availability
  const slots = calculateEnrollmentSlots(resolved, enrolledCourses);
  const slotCategory = getSlotCategory(courseLevel);

  if (slots[slotCategory].available <= 0) {
    const categoryName =
      slotCategory === 'beginner' ? 'iniciantes'
        : slotCategory === 'intermediate' ? 'intermediários'
          : 'avançados';
    return {
      canEnroll: false,
      reason: `Você atingiu o limite mensal de ${slots[slotCategory].limit} curso(s) ${categoryName}. Aguarde o próximo mês, faça upgrade, ou compre individualmente.`,
      upgradeRequired: true,
      canPurchase: true,
    };
  }

  return { canEnroll: true };
}

// ─── Upgrade Suggestions ─────────────────────────────────

export function getUpgradeSuggestion(
  currentPlan: SubscriptionPlan,
  desiredLevel: CourseLevel
): { suggestedPlan: SubscriptionPlan; benefits: string[] } | null {
  const resolved = resolvePlan(currentPlan);
  const planOrder: SubscriptionPlan[] = ['free', 'explorador', 'profissional', 'expert'];
  const currentIndex = planOrder.indexOf(resolved);

  for (let i = currentIndex + 1; i < planOrder.length; i++) {
    const plan = planOrder[i];
    const config = TIER_CONFIGS[plan];

    if (config.canAccessLevel(desiredLevel)) {
      return { suggestedPlan: plan, benefits: config.features };
    }
  }

  return null;
}

// ─── Credit Helpers ──────────────────────────────────────

/**
 * Check if user has enough credits for an action
 */
export function canAffordCredits(
  availableCredits: number,
  action: CreditAction
): boolean {
  return availableCredits >= CREDIT_COSTS[action];
}

/**
 * Get credit cost for a specific action
 */
export function getCreditCost(action: CreditAction): number {
  return CREDIT_COSTS[action];
}
