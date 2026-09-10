/**
 * GUIAS — as páginas escritas para a pergunta que alguém digita.
 *
 * ── Por que este arquivo existe (10/09/2026) ────────────────────────────────
 *
 * O site tinha 442 URLs e colhia 0,8 impressão por página por mês. Não é
 * problema de ranquear — quando o site casa com a busca, ele aparece em
 * posição 4,9. É problema de alvo: as páginas foram escritas por assunto, e
 * ninguém busca por assunto. As buscas destas páginas saíram do mapa de
 * demanda (`cursos/relatorios/mapa_demanda_2026-09-10.md`), colhido do
 * autocompletar do Google: 8.274 buscas reais, agrupadas em 1.112 páginas
 * possíveis. Cada guia abaixo é uma das primeiras dessa fila, com o número de
 * buscas do grupo registrado em `demanda`.
 *
 * ── E por que ele foi urgente ───────────────────────────────────────────────
 *
 * `/recursos/guias` já existia como VITRINE e anunciava seis guias com
 * contagem de downloads — "12.500", "8.300", "9.100" — que vinham escritos à
 * mão no dicionário de tradução. Nenhum dos seis existia: não havia rota de
 * guia, os cartões não eram links e não havia uma linha de conteúdo. Era
 * número inventado numa página pública. Os seis cartões falsos foram
 * substituídos pelos guias reais desta lista, e a contagem de downloads saiu:
 * não se mede o que não se entrega.
 *
 * ── Regras para acrescentar um guia ─────────────────────────────────────────
 *
 * 1. O `titulo` responde a `alvo`, que é a busca literal. Não invente um
 *    título bonito que ninguém digita.
 * 2. `faq` responde às VARIANTES reais do grupo no mapa — mas leia o corpo do
 *    grupo antes: o agrupamento é assimétrico e mistura tema (a seção "O que
 *    este mapa ainda erra" do relatório explica). "gemini como desativar"
 *    entrou no grupo do Gemini e não pertence à mesma página.
 * 3. Nada de número sem fonte. Preço de ferramenta de terceiro muda sozinho e
 *    envelhece a página: descreva o modelo de cobrança, não o valor.
 * 4. `curso` é UM curso — o que a página realmente vende. O mapa lista até 17
 *    cursos por busca porque o casamento dele é por ficha; isso é sugestão de
 *    leitura, não recomendação.
 */

export type SecaoGuia =
  | { tipo: "paragrafo"; texto: string }
  | { tipo: "titulo"; texto: string }
  | { tipo: "lista"; itens: string[] }
  | { tipo: "passos"; itens: string[] }
  | { tipo: "citacao"; texto: string };

export interface Guia {
  slug: string;
  /** A busca literal que esta página responde. */
  alvo: string;
  titulo: string;
  descricao: string;
  categoria: "O que é" | "Guia prático" | "Comparativo";
  /** Minutos de leitura, medidos pelo corpo do texto — não estimados no olho. */
  leitura: number;
  /** Buscas no grupo do mapa de demanda. Largura do assunto, não volume mensal. */
  demanda: number;
  /** Slug do curso que esta página vende. */
  curso: string;
  secoes: SecaoGuia[];
  faq: Array<{ pergunta: string; resposta: string }>;
  atualizadoEm: string;
}

export const guias: Guia[] = [
  /* ─────────────────────────────────────────────────────────────────────── */
  {
    slug: "claude-ia-como-funciona",
    alvo: "claude ia como funciona",
    titulo: "Claude: como funciona a IA da Anthropic, e no que ela é diferente",
    descricao:
      "O que o Claude é, como ele responde, onde ele ganha do ChatGPT e do Gemini, e o que fazer no primeiro dia de uso.",
    categoria: "O que é",
    leitura: 9,
    demanda: 990,
    curso: "claude-ia-segura",
    atualizadoEm: "2026-09-10",
    secoes: [
      {
        tipo: "paragrafo",
        texto:
          "Claude é o assistente de IA da Anthropic. Por dentro ele é um modelo de linguagem: recebe o seu texto, mais tudo o que já foi dito na conversa, e devolve a continuação mais provável — palavra a palavra. Isso explica as duas coisas que mais confundem quem começa. Ele não consulta um banco de dados de fatos, então pode errar com confiança; e ele não lembra de você entre conversas, a menos que você conte de novo.",
      },
      {
        tipo: "titulo",
        texto: "O que muda em relação ao ChatGPT e ao Gemini",
      },
      {
        tipo: "paragrafo",
        texto:
          "Os três respondem perguntas. A diferença aparece no trabalho longo. O Claude foi desenhado em torno de uma janela de contexto grande e de um estilo de resposta que prefere dizer 'não sei' a inventar — o que o torna mais previsível quando você cola um documento inteiro e pede análise, e mais chato quando você quer que ele chute. Para texto longo, revisão de contrato, leitura de código e qualquer tarefa em que uma invenção custa caro, essa troca compensa.",
      },
      {
        tipo: "paragrafo",
        texto:
          "O Gemini leva vantagem quando a tarefa encosta no ecossistema do Google — o seu Drive, o seu Gmail, uma planilha que já existe. O ChatGPT leva vantagem em volume de integrações e em geração de imagem dentro da mesma conversa. Não existe um vencedor: existe a tarefa.",
      },
      { tipo: "titulo", texto: "Como ele funciona, em quatro peças" },
      {
        tipo: "lista",
        itens: [
          "A janela de contexto: tudo o que ele consegue ler de uma vez — a sua pergunta, os arquivos que você anexou e a conversa inteira até ali. Quando enche, o começo sai.",
          "O prompt de sistema: instruções fixas que vêm antes de você e definem tom, limites e comportamento. É por isso que o mesmo modelo se comporta diferente em produtos diferentes.",
          "As ferramentas: buscar na web, executar código, ler um arquivo. Sem elas o modelo só escreve; com elas, ele age.",
          "Os Projetos: um lugar onde você deixa contexto guardado — documentos, instruções, decisões — para não recomeçar do zero a cada conversa.",
        ],
      },
      { tipo: "titulo", texto: "O primeiro dia, na prática" },
      {
        tipo: "passos",
        itens: [
          "Escolha uma tarefa que você já sabe fazer. Você precisa conseguir julgar a resposta — é assim que se aprende onde ele erra.",
          "Dê contexto antes de pedir. Quem vai ler, para quê, em que tom, com que limite de tamanho. A maior parte das respostas ruins é pergunta pobre.",
          "Peça o raciocínio junto com a resposta quando a decisão importar. Você não confere uma conclusão; você confere um caminho.",
          "Cole a fonte em vez de confiar na memória dele. Documento colado é verificável; lembrança do modelo, não.",
          "Guarde o que funcionou. O prompt que resolveu hoje resolve de novo na semana que vem.",
        ],
      },
      {
        tipo: "citacao",
        texto:
          "A pergunta útil não é 'qual IA é a melhor'. É 'esta tarefa tolera uma invenção?'. Se não tolera, o seu trabalho é dar a fonte — em qualquer uma das três.",
      },
      { tipo: "titulo", texto: "Onde ele erra, e o que fazer" },
      {
        tipo: "lista",
        itens: [
          "Inventa referência. Pediu artigo, lei ou número? Exija o link e abra o link. Título plausível não é prova de existência.",
          "Perde o fio em conversa muito longa. Quando começar a se repetir ou esquecer o combinado, abra uma conversa nova e cole o resumo do que importa.",
          "Concorda demais. Se você discorda, diga o porquê em vez de só repetir a pergunta — repetir empurra o modelo a mudar de opinião para agradar.",
          "Não sabe o que aconteceu depois do treinamento. Para assunto recente, dê a fonte você mesmo ou ligue a busca.",
        ],
      },
    ],
    faq: [
      {
        pergunta: "Claude é grátis?",
        resposta:
          "Há um plano gratuito com limite de uso por período, e planos pagos que ampliam esse limite e liberam os modelos maiores. O limite gratuito é medido em uso, não em número de mensagens: uma conversa com arquivos grandes consome mais depressa que várias perguntas curtas.",
      },
      {
        pergunta: "Para que serve o Claude, na prática?",
        resposta:
          "Para trabalho com texto longo em que o erro custa: revisar e resumir documento, comparar versões de contrato, transformar anotação bruta em relatório, ler e explicar código, e escrever rascunho a partir de material que você fornece.",
      },
      {
        pergunta: "Como usar o Claude sem limite?",
        resposta:
          "Não existe uso ilimitado. O que existe é uso mais eficiente: comece conversa nova para cada assunto (a conversa antiga inteira é reenviada a cada mensagem e consome cota), anexe só as páginas que importam, e peça a resposta no tamanho que você vai usar.",
      },
      {
        pergunta: "Claude vale a pena se eu já pago ChatGPT?",
        resposta:
          "Se o seu trabalho é texto longo e verificável, vale testar com uma tarefa real antes de decidir. Pagar dois assistentes só se justifica quando você consegue nomear a tarefa em que cada um ganha — se não consegue, é assinatura dobrada.",
      },
      {
        pergunta: "Dá para usar o Claude no VS Code?",
        resposta:
          "Sim, por extensão e por linha de comando. É onde ele fica mais útil para quem programa, porque passa a ler os arquivos do projeto em vez de depender do que você cola na conversa.",
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────────── */
  {
    slug: "como-fazer-prompt-para-ia",
    alvo: "como fazer prompt para ia",
    titulo: "Como fazer prompt para IA: a estrutura que resolve 90% dos casos",
    descricao:
      "As cinco partes de um prompt que funciona, o que fazer quando a resposta vem errada, e como escrever para texto e para imagem.",
    categoria: "Guia prático",
    leitura: 10,
    demanda: 728,
    curso: "prompt-engineering",
    atualizadoEm: "2026-09-10",
    secoes: [
      {
        tipo: "paragrafo",
        texto:
          "Quase toda resposta ruim de IA vem do mesmo lugar: a pergunta não disse quem lê, para quê, em que formato e com que limite. O modelo então escolhe por você — e escolhe o meio termo mais genérico possível, porque é o mais provável. Prompt bom não é palavra mágica. É especificação.",
      },
      { tipo: "titulo", texto: "As cinco partes" },
      {
        tipo: "lista",
        itens: [
          "PAPEL — de que ponto de vista ele escreve. 'Você é um revisor de contratos' muda mais a resposta do que qualquer adjetivo.",
          "TAREFA — o verbo, exato. Resumir, comparar, reescrever, classificar, criticar. 'Me ajuda com isso' não é tarefa.",
          "CONTEXTO — o material e a situação. Quem vai ler, o que já foi tentado, o que não pode aparecer.",
          "FORMATO — tabela, lista, três parágrafos, JSON com estes campos. Se você não disser, vem prosa.",
          "LIMITES — tamanho, tom, o que evitar, e o que ele deve fazer quando não souber (dizer que não sabe é uma instrução válida e pouco usada).",
        ],
      },
      { tipo: "titulo", texto: "Um exemplo, antes e depois" },
      {
        tipo: "paragrafo",
        texto:
          "Antes: 'escreve um e-mail de cobrança'. Depois: 'Você é o financeiro de uma agência pequena. Escreva um e-mail para um cliente de dois anos cuja fatura venceu há 9 dias. Tom cordial e direto, sem ameaça e sem pedido de desculpas. Máximo 120 palavras, com uma única ação clara no fim. Não invente número de fatura — deixe [NÚMERO] onde eu preencho.' A segunda versão não é mais bonita; ela é utilizável sem reescrita.",
      },
      { tipo: "titulo", texto: "Quando a resposta vem errada" },
      {
        tipo: "passos",
        itens: [
          "Não repita o pedido. Diga o que veio errado e por quê — 'ficou genérico, não citou o prazo' ensina; 'de novo' não.",
          "Dê um exemplo do que você quer. Um trecho do formato certo vale mais que três frases descrevendo o formato.",
          "Peça para ele perguntar antes de escrever: 'me faça as perguntas que faltam antes de começar'. Resolve boa parte do retrabalho.",
          "Se travou depois de várias tentativas, recomece em conversa nova. Uma conversa cheia de tentativa ruim empurra a próxima resposta para o mesmo lugar.",
        ],
      },
      { tipo: "titulo", texto: "Prompt para imagem é outro idioma" },
      {
        tipo: "paragrafo",
        texto:
          "Em texto, você descreve a tarefa. Em imagem — Midjourney, Leonardo, o gerador do ChatGPT —, você descreve o resultado, e a ordem das palavras pesa: o que vem primeiro domina. Diga assunto, ação, ambiente, enquadramento, luz e estilo, nessa ordem, e trate a negativa com cuidado, porque nem todo gerador entende 'sem X' — em vários deles, citar X aumenta a chance de X aparecer.",
      },
      {
        tipo: "citacao",
        texto:
          "Se o prompt cabe numa linha e a tarefa não cabe, a culpa da resposta genérica é do prompt.",
      },
    ],
    faq: [
      {
        pergunta: "Existe um prompt pronto que funciona sempre?",
        resposta:
          "Não, mas existe estrutura que se repete: papel, tarefa, contexto, formato e limites. Guarde os seus prompts que deram certo e adapte — uma biblioteca pessoal de dez prompts bons rende mais que qualquer lista de mil.",
      },
      {
        pergunta: "Como fazer prompt para ChatGPT especificamente?",
        resposta:
          "A mesma estrutura. O que muda é o que ele faz melhor: se a tarefa envolve imagem na mesma conversa ou uma integração, o ChatGPT resolve mais direto; se envolve documento longo, dê o documento em vez de descrevê-lo.",
      },
      {
        pergunta: "Preciso escrever em inglês para a resposta ser melhor?",
        resposta:
          "Não para os modelos atuais em português. Escreva em português, com ortografia e acentuação corretas — texto malescrito produz resposta pior, e não por elegância: o modelo lê a grafia.",
      },
      {
        pergunta: "Qual o tamanho ideal de um prompt?",
        resposta:
          "O tamanho que carrega as cinco partes sem repetição. Prompt curto demais deixa o modelo escolher; longo demais com instrução contraditória faz ele obedecer só a última.",
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────────── */
  {
    slug: "ia-no-whatsapp-como-usar",
    alvo: "ia no whatsapp como usar",
    titulo: "IA no WhatsApp: como usar, e como montar um atendimento que responde sozinho",
    descricao:
      "As três formas de ter IA no WhatsApp, a diferença entre número pessoal e API oficial, e o que decidir antes de automatizar.",
    categoria: "Guia prático",
    leitura: 9,
    demanda: 621,
    curso: "ia-no-whatsapp",
    atualizadoEm: "2026-09-10",
    secoes: [
      {
        tipo: "paragrafo",
        texto:
          "'IA no WhatsApp' quer dizer duas coisas bem diferentes, e confundi-las custa dinheiro. Uma é você conversar com um assistente pelo WhatsApp, como quem manda mensagem para um contato. A outra é o seu negócio responder aos clientes sozinho. A primeira se resolve em minutos; a segunda é um sistema.",
      },
      { tipo: "titulo", texto: "As três formas" },
      {
        tipo: "lista",
        itens: [
          "Assistente como contato: você salva o número de um serviço de IA e conversa com ele. Serve para uso pessoal, não atende cliente.",
          "Automação sobre número pessoal: um programa lê e responde pelo seu WhatsApp comum. Funciona, é barato — e é o caminho que corre risco de bloqueio, porque não é o uso previsto pela plataforma.",
          "API oficial (WhatsApp Business Platform): número verificado, envio dentro das regras, cobrança por conversa. É o caminho para quem vai atender de verdade e não pode perder o número.",
        ],
      },
      { tipo: "titulo", texto: "O que decidir antes de automatizar" },
      {
        tipo: "passos",
        itens: [
          "Liste as cinco perguntas que mais chegam. Se você não sabe quais são, ainda não é hora de automatizar — é hora de ler o histórico.",
          "Decida o que o robô NÃO responde. Preço fora de tabela, prazo apertado, reclamação e qualquer coisa com dinheiro no meio devem ir para uma pessoa.",
          "Escreva a saída: como o cliente pede um humano, e o que acontece fora do horário. Atendimento automático sem porta de saída vira reclamação.",
          "Defina o teto de gasto. Cada resposta custa; um laço mal fechado responde a si mesmo a noite inteira.",
          "Teste com você mesmo por uma semana antes de apontar para o cliente.",
        ],
      },
      {
        tipo: "citacao",
        texto:
          "Roteamento não é segurança. Se o robô tem acesso a algo que não pode fazer, uma instrução bem escrita do outro lado vai encontrar esse caminho.",
      },
      { tipo: "titulo", texto: "O erro mais caro" },
      {
        tipo: "paragrafo",
        texto:
          "Ligar o robô em cima de todo o histórico e deixá-lo responder tudo. Ele vai acertar as perguntas fáceis — que já eram fáceis — e vai errar exatamente onde havia margem: negociação, exceção, cliente irritado. O ganho real do atendimento automático está em devolver o tempo das cinco perguntas repetidas, não em substituir a conversa que fecha venda.",
      },
    ],
    faq: [
      {
        pergunta: "Dá para usar IA no WhatsApp de graça?",
        resposta:
          "Para uso pessoal, sim: vários assistentes têm plano gratuito com limite. Para atendimento de negócio, não existe grátis de verdade — ou você paga a API oficial por conversa, ou paga com o risco de perder o número.",
      },
      {
        pergunta: "Qual a diferença entre chatbot e IA no WhatsApp?",
        resposta:
          "Chatbot clássico segue um menu com respostas fixas: previsível e limitado. Com IA, ele entende a pergunta escrita de qualquer jeito — e por isso também pode responder o que você não previu. O bom atendimento junta os dois: menu para o que é regra, IA para o que é conversa.",
      },
      {
        pergunta: "Quanto custa um chatbot de WhatsApp?",
        resposta:
          "Três contas somam: a API oficial cobra por conversa iniciada, o modelo de IA cobra por texto processado, e a hospedagem cobra por estar de pé. Antes de contratar qualquer plataforma, estime as três com o seu volume real de mensagens.",
      },
      {
        pergunta: "Posso usar o ChatGPT no WhatsApp?",
        resposta:
          "Sim, tanto como contato para uso pessoal quanto como o modelo por trás de um atendimento seu, via API. São coisas diferentes: a primeira é um app; a segunda, um sistema que você monta e paga por uso.",
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────────── */
  {
    slug: "como-usar-o-gemini",
    alvo: "como usar o gemini ai",
    titulo: "Como usar o Gemini: do primeiro prompt ao que ele faz melhor que os outros",
    descricao:
      "Onde o Gemini ganha, como usar no celular e dentro do Google, e o que ele resolve que ChatGPT e Claude não resolvem.",
    categoria: "Guia prático",
    leitura: 8,
    demanda: 609,
    curso: "gemini-ia-google",
    atualizadoEm: "2026-09-10",
    secoes: [
      {
        tipo: "paragrafo",
        texto:
          "O Gemini é o assistente de IA do Google, e a razão de escolhê-lo quase nunca é o modelo em si — é onde ele está. Ele já vive dentro do lugar onde o seu material está guardado: Drive, Gmail, Docs, Planilhas, a câmera do celular. Isso muda a pergunta de 'ele é melhor?' para 'quanto do meu trabalho já está no Google?'.",
      },
      { tipo: "titulo", texto: "Comece por aqui" },
      {
        tipo: "passos",
        itens: [
          "Entre com a conta que tem o seu material. Usar a conta errada é o motivo número um de 'ele não acha meu arquivo'.",
          "Faça a primeira tarefa com algo que já existe: peça o resumo de um documento seu do Drive, não uma pergunta genérica.",
          "Anexe imagem quando fizer sentido. Foto de um formulário, print de um erro, quadro branco de reunião — ele lê o que está na imagem.",
          "No celular, use a voz para capturar e o texto para corrigir. Ditar é mais rápido; revisar é mais confiável.",
        ],
      },
      { tipo: "titulo", texto: "Onde ele ganha" },
      {
        tipo: "lista",
        itens: [
          "Material que já está no Google: resumir um documento longo do Drive ou varrer uma caixa de e-mail sem copiar e colar nada.",
          "Imagem como entrada: entender uma foto, um gráfico, uma tabela fotografada, uma tela de erro.",
          "Tarefa cotidiana de escrita dentro do Docs e do Gmail, onde ele está a um clique e não a uma aba de distância.",
        ],
      },
      { tipo: "titulo", texto: "Onde ele não é a melhor escolha" },
      {
        tipo: "paragrafo",
        texto:
          "Em trabalho longo de precisão — contrato, código extenso, análise em que uma invenção estraga tudo — vale comparar com o Claude antes de decidir. E em qualquer assunto recente ou local, confira: assistente nenhum sabe o que aconteceu depois do treinamento, e a resposta segura de aparência é a mais perigosa.",
      },
      {
        tipo: "citacao",
        texto:
          "A vantagem do Gemini não é responder melhor. É já estar onde os seus arquivos estão — e isso vale mais do que qualquer comparação de modelo.",
      },
    ],
    faq: [
      {
        pergunta: "O Gemini é gratuito?",
        resposta:
          "Há uma versão gratuita com limites e planos pagos que ampliam o uso e liberam os modelos maiores, às vezes junto com armazenamento do Google. Compare o pacote inteiro, não só o assistente.",
      },
      {
        pergunta: "Como usar o Gemini no celular?",
        resposta:
          "Pelo aplicativo ou pelo assistente do próprio aparelho, em Android. Vale para capturar rápido — foto, voz, print — e depois refinar no computador, onde revisar é mais fácil.",
      },
      {
        pergunta: "O Gemini cria imagens?",
        resposta:
          "Sim, gera e edita imagem a partir de descrição. Para trabalho visual com controle fino de estilo e enquadramento, ferramentas dedicadas como Midjourney e Leonardo ainda dão mais domínio sobre o resultado.",
      },
      {
        pergunta: "Como usar o Gemini para editar fotos?",
        resposta:
          "Envie a imagem e descreva a alteração em linguagem comum. Funciona bem para ajuste e recomposição simples; para retoque preciso, o caminho continua sendo um editor de imagem.",
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────────── */
  {
    slug: "agente-de-ia-o-que-e",
    alvo: "agente de ia o que é",
    titulo: "Agente de IA: o que é, como funciona e quando vale construir um",
    descricao:
      "A diferença entre assistente e agente, as quatro peças de um agente, e o teste honesto de quando não vale a pena.",
    categoria: "O que é",
    leitura: 10,
    demanda: 367,
    curso: "crie-agentes-de-ia-autonomos",
    atualizadoEm: "2026-09-10",
    secoes: [
      {
        tipo: "paragrafo",
        texto:
          "Um assistente responde. Um agente age. A diferença prática é uma só: o agente tem ferramentas e um objetivo, e continua trabalhando em ciclo — pensa, executa, olha o resultado, decide o próximo passo — até terminar ou desistir. Onde o assistente diz 'aqui está o texto do e-mail', o agente manda o e-mail.",
      },
      { tipo: "titulo", texto: "As quatro peças" },
      {
        tipo: "lista",
        itens: [
          "OBJETIVO — o que conta como terminado. Sem critério de parada, um agente ou para cedo demais ou não para nunca.",
          "FERRAMENTAS — o que ele pode fazer no mundo: ler um banco, chamar uma API, escrever um arquivo, enviar mensagem. Sem ferramenta, não é agente; é conversa.",
          "MEMÓRIA — o que ele carrega entre um passo e outro. Sem isso ele repete o que já fez.",
          "LIMITE — quantos passos, quanto pode gastar, o que exige confirmação humana. É a peça que quase todo tutorial esquece e a única que impede prejuízo.",
        ],
      },
      { tipo: "titulo", texto: "Quando vale, e quando não vale" },
      {
        tipo: "paragrafo",
        texto:
          "Vale quando a tarefa é repetitiva, tem passos claros, acontece muitas vezes por semana e o erro é barato de descobrir e desfazer. Não vale quando é rara — automatizar o que acontece uma vez por mês custa mais do que fazer na mão —, quando o erro só aparece semanas depois, ou quando cada caso é uma exceção. Nesse último, você não vai construir um agente: vai construir uma máquina de exceções.",
      },
      { tipo: "titulo", texto: "O caminho realista para o primeiro" },
      {
        tipo: "passos",
        itens: [
          "Escreva o passo a passo em português, como você faria na mão. Se você não consegue escrever, o agente não vai adivinhar.",
          "Comece sem ferramenta nenhuma: peça ao modelo a decisão e execute você. Serve para descobrir onde ele erra antes de dar poder a ele.",
          "Dê uma ferramenta de cada vez, começando pelas que só leem. Ler é reversível; escrever, não.",
          "Ponha o teto antes de ligar: número de passos, gasto máximo, e confirmação humana para qualquer ação que mande mensagem, gaste dinheiro ou apague algo.",
          "Registre tudo o que ele faz. Agente sem registro é impossível de depurar — e falha em silêncio é o modo mais caro de falhar.",
        ],
      },
      {
        tipo: "citacao",
        texto:
          "O que quebra um agente quase nunca é o modelo. É não ter dito o que conta como terminado, e não ter posto um teto.",
      },
    ],
    faq: [
      {
        pergunta: "Qual a diferença entre agente de IA e chatbot?",
        resposta:
          "O chatbot conversa dentro da conversa. O agente executa fora dela: consulta sistema, escreve em algum lugar, dispara ação. Todo agente costuma ter um chatbot na frente; nem todo chatbot é agente.",
      },
      {
        pergunta: "Preciso saber programar para criar um agente de IA?",
        resposta:
          "Para o primeiro, não: ferramentas visuais como n8n e Make montam o ciclo sem código. Programar passa a valer quando você precisa de controle fino sobre custo, repetição de tentativa e tratamento de erro.",
      },
      {
        pergunta: "Dá para fazer agente de IA com n8n?",
        resposta:
          "Sim, e é um bom primeiro caminho: o fluxo fica visível na tela, o que ajuda muito a entender onde o agente se perde. Ver o comparativo entre n8n e Make ajuda a escolher por onde começar.",
      },
      {
        pergunta: "Existe agente de IA gratuito?",
        resposta:
          "Existem ferramentas com plano gratuito, mas o modelo por trás cobra por uso. Monte a conta antes de ligar: um agente em laço consegue gastar num fim de semana o que você planejou para o mês.",
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────────── */
  {
    slug: "n8n-ou-make",
    alvo: "n8n ou make",
    titulo: "n8n ou Make: qual escolher, e o critério que decide de verdade",
    descricao:
      "A comparação sem torcida — onde cada um ganha, como os dois cobram, e a pergunta que decide antes do preço.",
    categoria: "Comparativo",
    leitura: 8,
    demanda: 97,
    curso: "n8n-automacao-avancada",
    atualizadoEm: "2026-09-10",
    secoes: [
      {
        tipo: "paragrafo",
        texto:
          "As duas ferramentas fazem a mesma coisa: ligam aplicativos em um fluxo que roda sozinho. A escolha entre elas quase nunca se decide por recurso, porque a lista de recursos é parecida. Decide-se por uma pergunta só: você quer hospedar isso você mesmo?",
      },
      { tipo: "titulo", texto: "A pergunta que decide" },
      {
        tipo: "paragrafo",
        texto:
          "O n8n pode rodar na sua própria máquina ou servidor, e o código é aberto. Isso importa quando os dados não podem sair de casa, quando o volume é alto o bastante para o preço por operação doer, ou quando você quer poder olhar dentro. O Make é serviço hospedado: você não administra nada, o que é exatamente o que a maioria das equipes quer.",
      },
      { tipo: "titulo", texto: "Onde cada um ganha" },
      {
        tipo: "lista",
        itens: [
          "n8n ganha em: rodar por sua conta, custo em volume alto, liberdade para escrever código dentro do fluxo, e ficar com o controle do dado.",
          "Make ganha em: começar rápido sem infraestrutura, editor visual mais confortável para quem não programa, e um catálogo grande de integrações prontas.",
          "Empate em: o que dá para automatizar. Nos dois, o limite prático é a sua clareza sobre o processo, não a ferramenta.",
        ],
      },
      { tipo: "titulo", texto: "Como os dois cobram" },
      {
        tipo: "paragrafo",
        texto:
          "Modelos diferentes, e é aqui que a conta engana. O Make cobra por operação — cada passo executado conta —, então um fluxo com muitos passos pequenos fica caro mesmo rodando pouco. O n8n na nuvem cobra por execução de fluxo, e rodando por sua conta o custo é o do servidor. Simule com o seu volume real: a mesma automação pode ser a mais barata ou a mais cara dependendo de quantos passos ela tem.",
      },
      {
        tipo: "citacao",
        texto:
          "Escolher a ferramenta antes de escrever o processo é escolher no escuro. Desenhe o fluxo em papel; aí a escolha se faz sozinha.",
      },
      { tipo: "titulo", texto: "E se eu escolher errado?" },
      {
        tipo: "paragrafo",
        texto:
          "Custa menos do que parece. Os fluxos são parecidos o suficiente para que o conhecimento se transfira; o que não se transfere é o tempo de reconstruir as conexões e as credenciais. Por isso, para a primeira automação, escolha a que você consegue pôr de pé hoje — e migre depois, se o custo ou o dado exigirem.",
      },
    ],
    faq: [
      {
        pergunta: "n8n é gratuito?",
        resposta:
          "Rodando por sua conta, o programa é aberto e você paga só o servidor. Na nuvem oficial deles, é pago por plano. As duas coisas se chamam n8n e têm contas muito diferentes.",
      },
      {
        pergunta: "n8n, Make ou Zapier?",
        resposta:
          "O Zapier é o mais simples e o mais caro em volume; o Make é o meio termo visual; o n8n é o que dá controle e roda por sua conta. Para gatilho simples entre dois aplicativos, o mais simples vence. Para fluxo com condição, repetição e tratamento de erro, os outros dois.",
      },
      {
        pergunta: "Qual é mais fácil para quem está começando?",
        resposta:
          "O Make, por não exigir nenhuma infraestrutura e pelo editor mais guiado. O n8n compensa a curva quando o custo por operação começa a pesar ou o dado não pode sair.",
      },
      {
        pergunta: "Dá para usar IA nos dois?",
        resposta:
          "Sim, os dois chamam modelos de IA dentro do fluxo e montam agentes. A diferença volta a ser a mesma: onde roda e como cobra.",
      },
    ],
  },
  /* ─────────────────────────────────────────────────────────────────────── */
  {
    slug: "como-usar-o-perplexity",
    alvo: "como usar o perplexity ai",
    titulo: "Como usar o Perplexity: pesquisa com IA que mostra de onde tirou",
    descricao:
      "Para que ele serve, como refinar a busca, e por que a fonte no rodapé muda tudo em relação a um chat comum.",
    categoria: "Guia prático",
    leitura: 7,
    demanda: 424,
    curso: "perplexity-pesquisa-inteligente",
    atualizadoEm: "2026-09-10",
    secoes: [
      {
        tipo: "paragrafo",
        texto:
          "O Perplexity é um buscador que responde. Em vez de devolver dez links para você abrir, ele lê as páginas, escreve a resposta e cita de onde tirou cada pedaço. A diferença em relação a um assistente comum não é a inteligência: é que aqui a fonte vem junto, e você pode conferir.",
      },
      { tipo: "titulo", texto: "Por que a fonte muda tudo" },
      {
        tipo: "paragrafo",
        texto:
          "Um assistente sem busca responde com o que ficou do treinamento — e quando não sabe, ele preenche. É a invenção educada, que engana justamente porque soa segura. Com a citação no rodapé, o custo de conferir cai para um clique. Não é que o Perplexity não erre: é que o erro dele fica verificável.",
      },
      { tipo: "titulo", texto: "Como usar, na prática" },
      {
        tipo: "passos",
        itens: [
          "Pergunte como perguntaria a uma pessoa, com contexto: o ano, o país, para que serve a resposta.",
          "Abra pelo menos uma fonte antes de usar qualquer número. A citação existe para ser aberta.",
          "Refine no mesmo fio em vez de recomeçar: ele mantém o assunto e estreita a busca.",
          "Para pesquisa longa, junte o material num espaço próprio e volte a ele — assim você acumula em vez de repetir.",
          "Quando a resposta for a base de uma decisão, peça as fontes contrárias. Concordância fácil quase sempre é busca estreita.",
        ],
      },
      { tipo: "titulo", texto: "Onde ele ganha, e onde não" },
      {
        tipo: "lista",
        itens: [
          "Ganha em: assunto recente, dado que precisa de fonte, comparação entre produtos, levantamento inicial de um tema novo.",
          "Não ganha em: escrever texto longo do zero, revisar documento seu, trabalhar sobre material que não está na web. Para isso, um assistente com o arquivo na mão rende mais.",
          "Empata em: pergunta de conhecimento geral e estável — aí qualquer um resolve, e o que decide é onde você já está.",
        ],
      },
      {
        tipo: "citacao",
        texto:
          "Resposta sem fonte é opinião com cara de fato. O valor do Perplexity é devolver o rodapé à pesquisa.",
      },
    ],
    faq: [
      {
        pergunta: "O Perplexity é grátis?",
        resposta:
          "Tem uso gratuito com limite diário nas buscas mais pesadas, e um plano pago que amplia o limite e dá acesso a modelos maiores. Para uso ocasional, o gratuito costuma bastar.",
      },
      {
        pergunta: "Qual a diferença entre Perplexity e ChatGPT?",
        resposta:
          "O Perplexity nasce buscador: pesquisa primeiro e cita a fonte. O ChatGPT nasce assistente: conversa, escreve e executa tarefa, e busca quando você pede. Para levantar informação com referência, o primeiro; para produzir trabalho, o segundo.",
      },
      {
        pergunta: "Dá para usar o Perplexity no WhatsApp?",
        resposta:
          "Dá, como contato — você manda a pergunta e recebe a resposta na conversa. Serve para consulta rápida no celular; para pesquisa de verdade, o site entrega mais controle e as fontes legíveis.",
      },
      {
        pergunta: "Ele pode inventar resposta?",
        resposta:
          "Pode, como qualquer IA — inclusive citando uma fonte que não diz aquilo. Por isso a regra: se o número vai para algum lugar, abra a fonte.",
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────────── */
  {
    slug: "notebooklm-como-usar",
    alvo: "notebooklm como usar",
    titulo: "NotebookLM: como usar a IA que só responde com o SEU material",
    descricao:
      "O que é, como montar um caderno, e por que ele erra menos que um assistente comum na hora de estudar.",
    categoria: "Guia prático",
    leitura: 8,
    demanda: 352,
    curso: "ia-para-estudar",
    atualizadoEm: "2026-09-10",
    secoes: [
      {
        tipo: "paragrafo",
        texto:
          "O NotebookLM é uma ferramenta do Google que inverte a lógica dos assistentes: em vez de responder com o que sabe do mundo, ele responde com o que você colocou dentro. Você sobe PDFs, textos, links e transcrições; ele responde citando o trecho de onde tirou. Fora desse material, ele diz que não está lá.",
      },
      { tipo: "titulo", texto: "Por que isso importa para estudar" },
      {
        tipo: "paragrafo",
        texto:
          "A invenção é o risco número um de estudar com IA: uma explicação convincente e errada custa semanas, porque você decora com confiança. Quando a resposta só pode vir da apostila que você subiu, o risco cai muito — e cada afirmação vem com a origem, que você confere em dois segundos.",
      },
      { tipo: "titulo", texto: "Montando o primeiro caderno" },
      {
        tipo: "passos",
        itens: [
          "Um caderno por assunto, não um caderno para tudo. Material de matérias diferentes no mesmo lugar produz resposta confusa.",
          "Suba o material bom, não todo o material. Dez páginas certas rendem mais que trezentas de qualidade duvidosa — lixo que entra, lixo que sai, agora com citação.",
          "Comece pedindo um resumo com os pontos principais. Serve para conferir se ele entendeu a estrutura antes de você confiar nas respostas.",
          "Peça perguntas de prova sobre o material, responda sem olhar, e depois peça a correção com a referência. É assim que ele vira estudo ativo em vez de leitura passiva.",
          "Use o resumo em áudio para revisar no deslocamento — ouvir o próprio material explicado é o melhor uso da função.",
        ],
      },
      { tipo: "titulo", texto: "O limite honesto" },
      {
        tipo: "paragrafo",
        texto:
          "Ele não substitui a leitura. O que ele faz é tirar o atrito da revisão: achar onde estava aquilo, refazer a pergunta de outro jeito, transformar capítulo em questionário. Quem sobe a apostila e nunca a lê aprende o resumo do resumo — e a prova cobra o que está embaixo.",
      },
      {
        tipo: "citacao",
        texto:
          "A pergunta certa não é o que a IA sabe sobre isso. É o que o MEU material diz sobre isso, e em que página.",
      },
    ],
    faq: [
      {
        pergunta: "O NotebookLM é gratuito?",
        resposta:
          "Tem uso gratuito com limite de cadernos e de fontes por caderno, e uma versão paga que amplia esses limites. Para uma matéria ou um concurso, o gratuito costuma dar conta.",
      },
      {
        pergunta: "Para que serve o NotebookLM?",
        resposta:
          "Para trabalhar sobre material que você já tem: estudar apostila, revisar documentação, preparar aula, extrair o que importa de um relatório longo. Sempre com a fonte citada.",
      },
      {
        pergunta: "Posso subir PDF?",
        resposta:
          "Sim — PDF, documento do Google, texto colado, link e transcrição de vídeo. PDF que é só imagem escaneada, sem texto reconhecível, é o caso que costuma falhar.",
      },
      {
        pergunta: "Qual a diferença para o Gemini?",
        resposta:
          "O Gemini responde sobre o mundo e sobre os seus arquivos do Google. O NotebookLM responde SÓ sobre o que está no caderno. Essa limitação é a função, não um defeito.",
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────────── */
  {
    slug: "leonardo-ai-como-funciona",
    alvo: "leonardo ai como funciona",
    titulo: "Leonardo AI: como funciona, e quando ele ganha do Midjourney",
    descricao:
      "O que é, como sai a primeira imagem, e a comparação honesta com o Midjourney para trabalho de verdade.",
    categoria: "O que é",
    leitura: 8,
    demanda: 376,
    curso: "leonardo-ai-criacao-visual",
    atualizadoEm: "2026-09-10",
    secoes: [
      {
        tipo: "paragrafo",
        texto:
          "O Leonardo AI é um gerador de imagem por descrição. Você escreve o que quer ver, escolhe um modelo e um estilo, e ele desenha. O que o separa dos concorrentes não é a qualidade bruta — nisso estão todos próximos —, e sim o controle: dá para fixar personagem, treinar um estilo próprio e editar um pedaço da imagem sem refazer tudo.",
      },
      { tipo: "titulo", texto: "Como sai a primeira imagem" },
      {
        tipo: "passos",
        itens: [
          "Descreva na ordem que pesa: assunto, ação, ambiente, enquadramento, luz, estilo. O que vem primeiro domina o resultado.",
          "Escolha a proporção antes de gerar. Reenquadrar depois custa uma geração inteira.",
          "Gere quatro variações e escolha uma para refinar, em vez de reescrever o texto do zero. É mais barato e converge mais rápido.",
          "Use a edição por região para corrigir um detalhe — uma mão, um objeto, o fundo — sem perder o resto.",
          "Guarde o prompt que deu certo junto com o modelo e a semente. Sem isso, você não reproduz o acerto na semana seguinte.",
        ],
      },
      { tipo: "titulo", texto: "Leonardo ou Midjourney" },
      {
        tipo: "lista",
        itens: [
          "Leonardo ganha em: controle fino, edição de região, personagem recorrente, e um plano gratuito que deixa experimentar de verdade.",
          "Midjourney ganha em: acabamento estético logo de saída — a imagem bonita com menos esforço — e coerência de estilo entre imagens da mesma série.",
          "O critério prático: se você precisa da MESMA pessoa ou do MESMO produto em várias cenas, o controle vale mais que o acabamento. Se precisa de uma imagem impactante e única, o acabamento vale mais.",
        ],
      },
      { tipo: "titulo", texto: "O detalhe que estraga trabalho pago" },
      {
        tipo: "paragrafo",
        texto:
          "Gerador de imagem inventa marca sozinho: um escudo no peito da camisa, um logotipo no ombro, um símbolo no cartaz ao fundo. Ninguém pediu e ele aparece — e entregar isso a um cliente é problema de direito de marca, não de estética. Antes de entregar, confira peito, ombro, tela e qualquer papel dentro da cena.",
      },
      {
        tipo: "citacao",
        texto:
          "A imagem certa raramente sai do primeiro prompt. Sai da terceira variação da segunda escolha — e isso é processo, não falta de talento.",
      },
    ],
    faq: [
      {
        pergunta: "O Leonardo AI é grátis?",
        resposta:
          "Há um plano gratuito com uma cota diária de créditos que se renova, e planos pagos com mais créditos e geração mais rápida. Dá para aprender inteiro no gratuito.",
      },
      {
        pergunta: "Leonardo AI ou Midjourney, qual escolher?",
        resposta:
          "Personagem ou produto recorrente e necessidade de editar região: Leonardo. Imagem única com acabamento imediato: Midjourney. Para aprender sem gastar, comece pelo Leonardo, que tem plano gratuito de verdade.",
      },
      {
        pergunta: "Posso usar as imagens comercialmente?",
        resposta:
          "Depende do plano e dos termos vigentes — confira antes de vender. E confira também a imagem: marca de terceiro que apareceu sozinha na cena é problema seu, não da ferramenta.",
      },
      {
        pergunta: "Existe aplicativo de celular?",
        resposta:
          "Sim, e serve bem para gerar e revisar fora do computador. O trabalho fino — edição de região, comparação de variações — continua mais confortável na tela grande.",
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────────── */
  {
    slug: "ia-para-estudar-concurso",
    alvo: "ia para estudar concurso",
    titulo: "IA para estudar para concurso: o que funciona e o que só parece que funciona",
    descricao:
      "Como usar IA em cada fase do estudo, o erro que custa semanas, e qual ferramenta serve para quê.",
    categoria: "Guia prático",
    leitura: 9,
    demanda: 44,
    curso: "ia-para-estudar",
    atualizadoEm: "2026-09-10",
    secoes: [
      {
        tipo: "paragrafo",
        texto:
          "IA ajuda a estudar para concurso — mas quase nunca do jeito que as pessoas usam. O uso mais comum é pedir a explicação de um assunto, ler, achar claro e seguir em frente. Isso é leitura passiva com um passo extra: sensação de aprendizado sem aprendizado. O ganho real está em três usos específicos.",
      },
      { tipo: "titulo", texto: "Os três usos que rendem" },
      {
        tipo: "lista",
        itens: [
          "Fazer PERGUNTA, não dar resposta. Peça questões sobre o material, responda sem olhar, e só depois peça a correção. Recordar é o que fixa; reler, não.",
          "Explicar o que você errou, no seu nível. Cole a questão e a sua resposta errada e peça onde o raciocínio quebrou — isso um gabarito não faz.",
          "Transformar formato: lei em tabela, capítulo em mapa, artigo em pergunta. Reorganizar material é trabalho mecânico que consome as suas horas boas.",
        ],
      },
      { tipo: "titulo", texto: "O erro que custa semanas" },
      {
        tipo: "paragrafo",
        texto:
          "Perguntar direto ao assistente o que diz determinado artigo, e estudar a resposta. Modelo de linguagem sem a fonte na mão produz texto plausível: o artigo existe, o número bate, e o conteúdo está trocado. Em concurso, decorar uma versão errada é pior do que não ter estudado, porque você marca com confiança. A regra não tem exceção: cole a fonte na conversa, ou use uma ferramenta que responda só sobre o material que você subiu.",
      },
      { tipo: "titulo", texto: "Qual ferramenta para quê" },
      {
        tipo: "lista",
        itens: [
          "Estudar sobre a SUA apostila, com citação: uma ferramenta de caderno, como o NotebookLM. É a que menos inventa, porque só pode responder com o que está dentro.",
          "Levantar assunto novo com fonte aberta: um buscador com IA, como o Perplexity — e abra as fontes.",
          "Reescrever, resumir e gerar questão a partir do que você colou: qualquer assistente forte serve. O que decide é você colar o material.",
        ],
      },
      { tipo: "titulo", texto: "Uma semana de estudo com IA" },
      {
        tipo: "passos",
        itens: [
          "Segunda: suba o material da semana num caderno próprio e peça o mapa dos tópicos. Confira contra o edital — o edital manda, não a IA.",
          "Terça a quinta: leia o material de verdade e, ao fim de cada bloco, peça dez questões. Responda antes de ver.",
          "Sexta: leve só os erros. Peça a explicação de cada um e refaça as questões equivalentes.",
          "Sábado: peça um simulado com o material das últimas quatro semanas. Revisão espaçada é o que separa quem passa.",
          "Domingo: descanse. Não é conselho motivacional — é a parte do método em que a memória consolida.",
        ],
      },
      {
        tipo: "citacao",
        texto:
          "A IA não estuda por você. Ela tira de você o trabalho que não ensina nada — e devolve as horas para o trabalho que ensina.",
      },
    ],
    faq: [
      {
        pergunta: "Qual a melhor IA para concurso público?",
        resposta:
          "Não existe uma só, e desconfie de quem promete. Para estudar sobre a sua apostila com citação, uma ferramenta de caderno; para levantar assunto, um buscador com IA; para gerar questão e corrigir erro, um assistente forte. O que decide o resultado é o método, não a marca.",
      },
      {
        pergunta: "Dá para estudar para concurso com IA de graça?",
        resposta:
          "Dá. As três funções que rendem — gerar questão, explicar erro, reorganizar material — cabem nos planos gratuitos. O limite gratuito atrapalha em sessão longa, não em estudo bem dividido.",
      },
      {
        pergunta: "Posso confiar na IA para lei seca?",
        resposta:
          "Não sem a fonte na frente. Modelo de linguagem reproduz o texto legal de memória e troca palavra — e em lei seca a palavra é a matéria. Cole o texto oficial e peça que ele trabalhe sobre aquilo.",
      },
      {
        pergunta: "Como usar o ChatGPT para estudar para concurso?",
        resposta:
          "Cole o material e peça questões sobre ele, não a explicação geral do assunto. Responda antes de ver o gabarito e peça a correção do seu raciocínio. Vale igual para Claude e Gemini — o que muda é a ferramenta, não o método.",
      },
    ],
  },
];

export const guiaPorSlug = (slug: string): Guia | undefined =>
  guias.find((g) => g.slug === slug);

export const slugsDeGuias = (): string[] => guias.map((g) => g.slug);
