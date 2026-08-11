/**
 * As entradas prontas da persona — o catálogo de escolhas (10/08/2026).
 *
 * ## Por que este arquivo existe
 *
 * O dossiê perguntava tudo em caixa de texto vazia. Caixa vazia é o formato mais
 * caro que existe para quem responde: exige que a pessoa formule do zero, em
 * ordem, com as palavras certas — e o resultado é campo em branco, que é
 * exatamente o que fazia a personalização sair morna. Ricardo, em 10/08:
 * *"é fundamental que esta parte seja muito mais visível, acessível, com imagens
 * em todos os campos, escolha de entradas preset com muitas opções"*.
 *
 * Um preset resolve três coisas de uma vez: mostra o FORMATO esperado da
 * resposta ("uma frase concreta, não um adjetivo"), reduz a resposta a um
 * toque, e — o que mais importa — ensina o que ainda pode ser dito. Ninguém
 * escreve "o que dói no meu cliente" numa página em branco; todo mundo
 * reconhece a própria dor numa lista de catorze.
 *
 * ## O preset NÃO substitui o texto livre
 *
 * Toda lacuna continua aceitando texto escrito à mão, e o preset entra COMO
 * texto — ele preenche o campo, não o tranca. Quem toca em "perde 3h por dia
 * respondendo a mesma pergunta" pode emendar "…principalmente no sábado".
 * Persona virada em enum seria persona de todo mundo igual, e o produto inteiro
 * existe para o contrário disso.
 *
 * ## As imagens
 *
 * Convenção única: `/portal/persona/opts/<campo>-<valor>.webp`, a mesma que a
 * `PersonaSection` já usava para as cinco dimensões visuais. Arte que ainda não
 * existe cai no ladrilho de gradiente + emoji — que é visual, não buraco. Ver
 * `artePreset()`.
 */

export interface Preset {
  /** O que vai para o banco. Número quando o editor é numérico. */
  valor: string | number;
  /** O que a pessoa lê no ladrilho. Igual ao valor quando é frase. */
  rotulo: string;
  emoji: string;
}

/** `identidade.papel` → `identidade-papel`, para casar com o nome do arquivo. */
export function campoSlug(campo: string): string {
  return campo.replace(/\./g, '-');
}

/**
 * ⚠️ Sem acento, sem espaço, minúsculo — nome de arquivo servido pela CDN.
 * Duas opções diferentes nunca podem colidir aqui, então o corte é longo (48).
 */
export function valorSlug(valor: string | number): string {
  return String(valor)
    .normalize('NFD')
    // A classe dos diacríticos escrita por código, não com os caracteres
    // combinantes crus: eles são invisíveis no editor e já foram destruídos uma
    // vez por reencode de arquivo.
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

/**
 * O caminho da arte do preset. O componente tenta carregar e, se não existir,
 * desenha o ladrilho de gradiente com o emoji — nunca um quadrado quebrado.
 *
 * ⚠️ Não passe por `next/image`: `next.config.ts` não declara `remotePatterns`
 * e a política do projeto para imagem de origem variável é `<img>` puro
 * (ver `reference_atelie_vitrine_e_cobrancas`).
 */
export function artePreset(campo: string, valor: string | number): string {
  return `/portal/persona/opts/${campoSlug(campo)}-${valorSlug(valor)}.webp`;
}

/**
 * Campos cuja arte JÁ existe em `/portal/persona/opts/`.
 *
 * ⚠️ Sem esta lista o componente pedia a imagem de toda opção e colhia um 404
 * por ladrilho — quarenta requisições perdidas e o console cheio de vermelho a
 * cada dimensão aberta. O `onError` funcionava (caía no gradiente), mas erro
 * esperado no console é como alarme que toca sempre: some com o alarme de
 * verdade.
 *
 * **Ao acrescentar arte, acrescente o campo aqui — é o único passo.** O nome do
 * arquivo sai de `artePreset()`.
 */
export const CAMPOS_COM_ARTE = new Set<string>([
  // As cinco dimensões visuais do construtor já têm arte (industry-*.webp etc.),
  // mas elas são desenhadas pela `PersonaSection`, não por esta prateleira.
]);

const p = (emoji: string, rotulo: string, valor?: string | number): Preset => ({
  emoji,
  rotulo,
  valor: valor ?? rotulo,
});

/**
 * O catálogo.
 *
 * Regra que vale para todos: **a opção é uma frase que a pessoa assinaria**,
 * não um rótulo de categoria. "Autoridade no meu nicho" não ensina nada ao
 * modelo; "ser a primeira pessoa que lembram quando o assunto aparece" vira
 * exemplo no capítulo.
 */
export const PRESETS: Record<string, Preset[]> = {
  // ── Quem você é ────────────────────────────────────────────────────
  'identidade.papel': [
    p('🧑‍🏫', 'Ensino o que aprendi na prática para quem está começando'),
    p('🛠️', 'Presto serviço para pequenos negócios da minha cidade'),
    p('🛍️', 'Vendo produtos próprios pela internet'),
    p('💼', 'Consultoria para empresas do meu setor'),
    p('🎥', 'Crio conteúdo e vivo de audiência e parcerias'),
    p('🏪', 'Tenho loja física e quero vender também no digital'),
    p('💻', 'Trabalho com tecnologia e quero usar IA no meu trabalho'),
    p('🩺', 'Atendo pacientes/clientes e quero preencher a agenda'),
    p('🏗️', 'Sou autônomo e faço tudo sozinho no meu negócio'),
    p('📊', 'Trabalho em empresa e quero me destacar com IA'),
    p('🎓', 'Estudo e quero aprender IA antes de entrar no mercado'),
    p('🤝', 'Ajudo outros negócios a aparecerem na internet'),
  ],
  'identidade.marca': [
    p('👤', 'Uso o meu próprio nome'),
    p('🏢', 'Tenho um nome de empresa'),
    p('🌱', 'Ainda estou escolhendo o nome'),
  ],
  'identidade.cidade': [
    p('🌆', 'São Paulo, SP'),
    p('🏖️', 'Rio de Janeiro, RJ'),
    p('🌳', 'Curitiba, PR'),
    p('⛰️', 'Belo Horizonte, MG'),
    p('🌊', 'Florianópolis, SC'),
    p('🌵', 'Recife, PE'),
    p('☀️', 'Fortaleza, CE'),
    p('🌅', 'Salvador, BA'),
    p('🏛️', 'Brasília, DF'),
    p('🚜', 'Goiânia, GO'),
    p('🌾', 'Porto Alegre, RS'),
    p('🏘️', 'Interior do meu estado'),
  ],
  'identidade.missao': [
    p('🔓', 'Quero que gente comum consiga usar as mesmas ferramentas das grandes empresas'),
    p('⏱️', 'Cansei de ver gente perdendo tempo com o que dá para automatizar'),
    p('💪', 'Passei pela dificuldade que meu cliente passa hoje e sei o caminho de volta'),
    p('👨‍👩‍👧', 'Quero construir algo que sustente a minha família com liberdade'),
    p('🎯', 'Odeio trabalho mal feito no meu ramo e faço questão de mostrar como se faz'),
    p('🌍', 'Quero que o meu ofício sobreviva à mudança em vez de ser atropelado por ela'),
    p('📣', 'Quero ser a pessoa que explica sem enrolar o que os outros complicam'),
    p('🚪', 'Quero abrir a porta que ninguém abriu para mim quando eu comecei'),
  ],
  'identidade.valores': [
    p('💎', 'Honestidade no preço'),
    p('⏰', 'Cumprir prazo'),
    p('🗣️', 'Falar simples'),
    p('🚫', 'Não prometer o que não entrego'),
    p('🤲', 'Atender bem quem paga pouco'),
    p('🔍', 'Mostrar o processo, não só o resultado'),
    p('📚', 'Estudar antes de opinar'),
    p('❤️', 'Tratar cliente como gente, não como número'),
    p('🧾', 'Transparência total nos números'),
    p('🛡️', 'Nunca falar mal de concorrente'),
    p('🧪', 'Testar antes de recomendar'),
    p('🙋', 'Assumir o erro na hora'),
    p('🎨', 'Capricho no acabamento'),
    p('🤐', 'Discrição com o dado do cliente'),
  ],

  // ── Como você fala ─────────────────────────────────────────────────
  'voz.bordoes': [
    p('👊', 'Bora que bora'),
    p('👋', 'Fala, pessoal!'),
    p('🎬', 'Te vejo no próximo'),
    p('🔑', 'Anota essa'),
    p('🎯', 'Simples assim'),
    p('🤔', 'Vem comigo que eu te explico'),
    p('✅', 'É isso'),
    p('🚀', 'Partiu?'),
    p('🧠', 'Guarda essa ideia'),
    p('😉', 'Fica a dica'),
    p('🙌', 'Se fez sentido, me conta'),
    p('📌', 'Resumindo'),
  ],
  'voz.vocabulario': [
    p('🗣️', 'Simples — falo como falaria no balcão'),
    p('⚖️', 'Meio-termo — simples, mas uso os termos do ramo'),
    p('🎓', 'Técnico — meu público conhece o jargão'),
    p('📖', 'Didático — explico cada termo na primeira vez'),
    p('🔥', 'Direto e curto — frase curta, sem rodeio'),
    p('📝', 'Detalhado — prefiro explicar demais a de menos'),
  ],

  // ── Com quem você fala ─────────────────────────────────────────────
  'publico.quemE': [
    p('👩‍💼', 'Dona de pequeno negócio, 30 a 45 anos, faz tudo sozinha e não tem tempo de aprender ferramenta nova'),
    p('👨‍🔧', 'Profissional autônomo que depende de indicação e quer parar de depender'),
    p('🧑‍💻', 'Pessoa empregada que quer usar IA para entregar mais rápido e ser notada'),
    p('🎓', 'Quem está começando do zero e tem medo de ficar para trás'),
    p('🏪', 'Comerciante com loja física que ainda vende pouco pela internet'),
    p('📱', 'Criador de conteúdo travado na produção — tem ideia e não tem tempo'),
    p('👔', 'Gestor de time pequeno que precisa provar resultado com pouca gente'),
    p('🧓', 'Pessoa mais velha que se sente excluída da conversa de tecnologia'),
    p('💰', 'Quem já vende bem e quer escalar sem contratar'),
    p('🤱', 'Mãe/pai empreendedor que trabalha nas brechas do dia'),
  ],
  'publico.dores': [
    p('🔁', 'Perde horas respondendo sempre a mesma pergunta'),
    p('💸', 'Gasta com anúncio e não sabe o que deu retorno'),
    p('🕐', 'Não tem tempo de produzir conteúdo'),
    p('😵', 'Se perde no meio de tanta ferramenta nova'),
    p('📉', 'Vende bem num mês e péssimo no outro'),
    p('🙈', 'Tem vergonha de aparecer'),
    p('🤷', 'Não sabe o que postar'),
    p('⏳', 'Faz orçamento demais e fecha de menos'),
    p('🧾', 'Se enrola na parte burocrática e deixa o principal para depois'),
    p('😤', 'Já tentou IA, achou genérico e desistiu'),
    p('👻', 'Some da internet por semanas e perde o embalo'),
    p('🤝', 'Depende só de indicação e não consegue prever o mês'),
    p('📵', 'Não consegue separar trabalho de vida pessoal no celular'),
    p('🔍', 'Ninguém o encontra quando procuram pelo serviço dele'),
  ],
  'publico.desejos': [
    p('📅', 'Ter agenda cheia sem correr atrás'),
    p('🌙', 'Fechar o celular às 18h sem culpa'),
    p('📈', 'Ter previsibilidade de quanto entra por mês'),
    p('🏆', 'Ser a referência do assunto na cidade dele'),
    p('⚙️', 'Ter o trabalho repetitivo rodando sozinho'),
    p('💵', 'Cobrar mais caro sem perder cliente'),
    p('🎥', 'Aparecer com naturalidade'),
    p('🧭', 'Saber exatamente o que fazer amanhã de manhã'),
    p('🛫', 'Poder viajar sem o negócio parar'),
    p('👥', 'Sair do operacional e cuidar do crescimento'),
    p('😌', 'Trabalhar menos horas ganhando o mesmo'),
    p('🚀', 'Dobrar de tamanho sem dobrar a equipe'),
  ],
  'publico.lugares': [
    p('📸', 'Instagram'),
    p('💬', 'WhatsApp'),
    p('🎵', 'TikTok'),
    p('💼', 'LinkedIn'),
    p('▶️', 'YouTube'),
    p('👥', 'Facebook'),
    p('📍', 'Google (buscando pelo serviço)'),
    p('🏪', 'Na minha cidade, presencialmente'),
    p('🇧🇷', 'Brasil inteiro'),
    p('📨', 'Grupos e comunidades'),
    p('🛒', 'Marketplaces'),
    p('🌎', 'Fora do Brasil'),
  ],

  // ── O que você publica ─────────────────────────────────────────────
  'estrategia.pilares': [
    p('🎬', 'Bastidores do meu trabalho'),
    p('📚', 'Ensinar o básico do meu ramo'),
    p('❌', 'Erros que eu vejo todo dia'),
    p('📊', 'Casos e resultados de clientes'),
    p('🛠️', 'Ferramentas que eu uso'),
    p('💬', 'Respostas às perguntas que mais recebo'),
    p('📰', 'Novidades do setor explicadas'),
    p('🧠', 'Minha opinião sobre o que está acontecendo'),
    p('🏁', 'Antes e depois'),
    p('💰', 'Preço, custo e o que ninguém conta'),
    p('🧭', 'Passo a passo executável'),
    p('👤', 'Minha história e meus tropeços'),
    p('🤝', 'Depoimento de quem já comprou'),
    p('🔮', 'Para onde o meu mercado está indo'),
  ],
  'estrategia.naoFalar': [
    p('🗳️', 'Política'),
    p('⛪', 'Religião'),
    p('💸', 'Preço do concorrente'),
    p('⚽', 'Futebol'),
    p('🍷', 'Bebida'),
    p('🧬', 'Vida pessoal da minha família'),
    p('⚖️', 'Promessa de resultado garantido'),
    p('🏥', 'Conselho médico ou jurídico'),
    p('😡', 'Polêmica de internet'),
    p('🎰', 'Aposta e jogo'),
  ],
  'estrategia.assinatura': [
    p('💬', 'Me chama no direct que eu te mando o passo a passo'),
    p('🔗', 'Link na bio'),
    p('💾', 'Salva esse post para não perder'),
    p('👇', 'Comenta EU que eu te envio'),
    p('📲', 'Chama no WhatsApp e a gente conversa sem compromisso'),
    p('👥', 'Marca alguém que precisa ver isso'),
    p('📩', 'Assina a newsletter — é de graça'),
    p('🗓️', 'Agenda uma conversa de 15 minutos'),
    p('❓', 'Me conta nos comentários: você já passou por isso?'),
    p('🔔', 'Segue que amanhã tem a parte 2'),
  ],
  'estrategia.porSemana': [
    p('🐢', '1 post por semana', 1),
    p('🚶', '3 por semana', 3),
    p('🏃', '5 por semana', 5),
    p('🔥', 'Todo dia', 7),
    p('🚀', 'Mais de um por dia', 14),
  ],

  // ── Onde você quer chegar ──────────────────────────────────────────
  'aprendizado.objetivo': [
    p('💰', 'Fechar 5 clientes novos nos próximos 90 dias'),
    p('⚙️', 'Automatizar o atendimento e parar de responder o mesmo no WhatsApp'),
    p('📅', 'Ter um mês inteiro de conteúdo pronto com antecedência'),
    p('🎥', 'Publicar toda semana sem travar'),
    p('📈', 'Dobrar o faturamento sem contratar ninguém'),
    p('🧰', 'Montar um serviço novo usando IA e vender o primeiro'),
    p('⏱️', 'Ganhar 10 horas por semana de volta'),
    p('🏆', 'Virar referência do assunto no meu nicho'),
    p('💼', 'Usar IA no trabalho e ser promovido'),
    p('🚪', 'Sair do emprego e viver do meu negócio'),
  ],
  'aprendizado.ferramentas': [
    p('🤖', 'ChatGPT'),
    p('🎨', 'Canva'),
    p('💬', 'WhatsApp Business'),
    p('📊', 'Excel / Planilhas'),
    p('✨', 'Gemini'),
    p('🧠', 'Claude'),
    p('📸', 'Instagram/Meta Business'),
    p('🎬', 'CapCut'),
    p('🔗', 'n8n / Make / Zapier'),
    p('📝', 'Notion'),
    p('🖼️', 'Midjourney'),
    p('🎙️', 'ElevenLabs'),
    p('📧', 'E-mail marketing'),
    p('🛒', 'Loja virtual (Shopify, Nuvemshop…)'),
    p('📞', 'CRM'),
    p('🚫', 'Nenhuma ainda — começo agora'),
  ],
  'aprendizado.travando': [
    p('📝', 'Não sei o que escrever no prompt'),
    p('🤖', 'A resposta sai genérica e não parece minha'),
    p('🧩', 'Não sei ligar uma ferramenta na outra'),
    p('⏰', 'Começo e não termino por falta de tempo'),
    p('😵', 'Tem ferramenta demais e eu não sei por onde começar'),
    p('💸', 'Não sei o que vale a pena pagar'),
    p('🔐', 'Tenho medo de colocar dado de cliente na IA'),
    p('📉', 'Testei, não vi resultado e parei'),
  ],

  // ── O que você vende ───────────────────────────────────────────────
  'negocio.oQueVende': [
    p('🧑‍🏫', 'Aulas e mentorias'),
    p('🛠️', 'Serviço feito por mim, sob encomenda'),
    p('📦', 'Produto físico próprio'),
    p('🔁', 'Produto de revenda'),
    p('💻', 'Serviço digital recorrente'),
    p('✂️', 'Serviço de beleza/estética'),
    p('🐾', 'Serviço pet'),
    p('🍽️', 'Comida e bebida'),
    p('🏠', 'Imóveis'),
    p('📷', 'Fotografia e vídeo'),
    p('🧾', 'Consultoria e assessoria'),
    p('🏋️', 'Treinos e acompanhamento'),
    p('🎨', 'Design e criação'),
    p('🔧', 'Manutenção e reparo'),
  ],
  'negocio.canal': [
    p('💬', 'WhatsApp'),
    p('📸', 'Instagram (direct)'),
    p('🏪', 'Loja física'),
    p('🌐', 'Meu site'),
    p('🛒', 'Marketplace (Mercado Livre, Shopee…)'),
    p('📞', 'Telefone'),
    p('🤝', 'Indicação de cliente'),
    p('📍', 'Google Meu Negócio'),
    p('💼', 'LinkedIn'),
    p('🎪', 'Feiras e eventos'),
  ],
  'negocio.objecao': [
    p('💭', 'Vou pensar e te falo'),
    p('💸', 'Tá caro'),
    p('⏳', 'Agora não é um bom momento'),
    p('👥', 'Preciso falar com meu sócio/esposa'),
    p('🤔', 'Vou pesquisar mais um pouco'),
    p('🧊', 'Some sem responder'),
    p('🆚', 'Achei mais barato com outro'),
    p('❓', 'Isso funciona mesmo para o meu caso?'),
    p('🛠️', 'Acho que consigo fazer sozinho'),
    p('📉', 'Já tentei algo parecido e não deu certo'),
  ],
  'negocio.ticket': [
    p('☕', 'Até R$ 50', 50),
    p('🍽️', 'Cerca de R$ 100', 100),
    p('🛍️', 'Cerca de R$ 300', 300),
    p('💼', 'Cerca de R$ 700', 700),
    p('💎', 'Cerca de R$ 1.500', 1500),
    p('🏆', 'R$ 5.000 ou mais', 5000),
  ],
  'negocio.clientesPorMes': [
    p('🌱', 'Uns 5 por mês', 5),
    p('📈', 'Uns 15 por mês', 15),
    p('🔥', 'Uns 40 por mês', 40),
    p('🏭', 'Mais de 100 por mês', 100),
  ],
};

/** Só para o componente saber se desenha a prateleira. */
export function presetsDe(campo: string): Preset[] {
  return PRESETS[campo] || [];
}
