/**
 * TUTORIAL DO PRO CLUBS NO FC 27 — o conteúdo de `/game/tutorial`.
 *
 * Fontes (conferidas em 21/09/2026): Pitch Notes "The Grounds & Clubs Deep
 * Dive" e "Launch Update" da EA, guias de lançamento (PremierLeagueNow,
 * Skycoach) e as NOSSAS medições da API pública de Clubs no primeiro dia do
 * acesso antecipado (ver `ea-api.ts` e `edicao.ts`). Onde a EA não publicou um
 * número (teto de nível, por exemplo), o texto diz que não publicou — nada de
 * número inventado para parecer completo.
 *
 * Os blocos `visual` são desenhados na página em código (SVG/React), não em
 * imagem: formação, régua de divisões e arquétipos têm de ser EXATOS, e imagem
 * gerada inventa letra.
 */

export type Visual = "portas" | "arquetipos" | "divisoes" | "formacoes" | "amps" | "mapa" | "valor" | "negociacao" | "glossario" | "posicoes";

export type Bloco =
  | { t: "p"; texto: string }
  | { t: "passos"; titulo?: string; itens: string[] }
  | { t: "lista"; titulo?: string; itens: string[] }
  | { t: "dica"; texto: string }
  | { t: "alerta"; texto: string }
  | { t: "exemplo"; titulo: string; linhas: string[] }
  | { t: "tabela"; cab: string[]; linhas: string[][] }
  | { t: "visual"; v: Visual };

export interface Secao {
  id: string;
  grupo: string;
  titulo: string;
  resumo: string;
  /** Foto da seção. Sem foto quando o conteúdo é o próprio visual (glossário, portas). */
  img?: string;
  alt?: string;
  blocos: Bloco[];
}

export interface Tutorial {
  titulo: string;
  subtitulo: string;
  selo: string;
  indice: string;
  voltar: string;
  fontes: string;
  atualizado: string;
  secoes: Secao[];
  glossario: Array<[string, string]>;
  rotulos: {
    exemplo: string; dica: string; alerta: string; passo: string;
    divisao: string; sobe: string; fica: string; titulo: string; entrada: string;
    maestria: string; posicao: string; arquetipo: string; setor: string;
    padrao: string; assinatura: string; slot: string;
    parcela: string; fichas: string; faixa: string; confianca: string;
  };
}

/* ------------------------------------------------------------------ */
/* Dados exatos usados pelos visuais                                   */
/* ------------------------------------------------------------------ */

/** Os 13 arquétipos do FC 27, setor e o que a Maestria de cada um dá a TODAS as builds. */
export const ARQUETIPOS: Array<{ nome: string; setor: "GOL" | "DEF" | "MEI" | "ATA"; posicoes: string; maestria: [string, string] }> = [
  { nome: "Shot Stopper", setor: "GOL", posicoes: "GOL", maestria: ["Posicionamento (GK)", "Reflexos (GK)"] },
  { nome: "Sweeper Keeper", setor: "GOL", posicoes: "GOL", maestria: ["Manejo (GK)", "Mergulho (GK)"] },
  { nome: "Progressor", setor: "DEF", posicoes: "ZAG · LAT", maestria: ["Passe longo", "Desarme em pé"] },
  { nome: "Boss", setor: "DEF", posicoes: "ZAG", maestria: ["Agressividade", "Força"] },
  { nome: "Marauder", setor: "DEF", posicoes: "LAT", maestria: ["Carrinho", "Pique"] },
  { nome: "Disruptor", setor: "MEI", posicoes: "VOL", maestria: ["Fôlego", "Interceptação"] },
  { nome: "Recycler", setor: "MEI", posicoes: "VOL · MC", maestria: ["Consciência defensiva", "Passe curto"] },
  { nome: "Maestro", setor: "MEI", posicoes: "MC", maestria: ["Reação", "Controle de bola"] },
  { nome: "Creator", setor: "MEI", posicoes: "MEI (MEIA)", maestria: ["Cobrança de falta", "Visão"] },
  { nome: "Spark", setor: "MEI", posicoes: "PON", maestria: ["Cruzamento", "Drible"] },
  { nome: "Magician", setor: "ATA", posicoes: "PON · ATA · MEI", maestria: ["Curva", "Aceleração"] },
  { nome: "Finisher", setor: "ATA", posicoes: "ATA", maestria: ["Compostura", "Finalização"] },
  { nome: "Target", setor: "ATA", posicoes: "ATA (pivô)", maestria: ["Equilíbrio", "Impulsão"] },
];

/** Formações recomendadas nos guias de lançamento, em coordenadas 0–100 (x = largura, y = do nosso gol ao deles). */
export const FORMACOES: Array<{ nome: string; uso: string; uso_en: string; pontos: Array<[number, number, string]> }> = [
  { nome: "4-1-2-1-2 (2)", uso: "Grupo pequeno, dois atacantes", uso_en: "Small group, two strikers", pontos: [[50, 6, "GOL"], [15, 24, "LAT"], [38, 20, "ZAG"], [62, 20, "ZAG"], [85, 24, "LAT"], [50, 36, "VOL"], [32, 50, "MC"], [68, 50, "MC"], [50, 64, "MEI"], [38, 82, "ATA"], [62, 82, "ATA"]] },
  { nome: "4-2-3-1 aberto", uso: "Time equilibrado", uso_en: "Balanced team", pontos: [[50, 6, "GOL"], [15, 24, "LAT"], [38, 20, "ZAG"], [62, 20, "ZAG"], [85, 24, "LAT"], [38, 38, "VOL"], [62, 38, "VOL"], [15, 62, "PON"], [50, 60, "MEI"], [85, 62, "PON"], [50, 84, "ATA"]] },
  { nome: "4-1-4-1", uso: "Estabilidade e meio-campo cheio", uso_en: "Stability, crowded midfield", pontos: [[50, 6, "GOL"], [15, 24, "LAT"], [38, 20, "ZAG"], [62, 20, "ZAG"], [85, 24, "LAT"], [50, 36, "VOL"], [15, 58, "PON"], [38, 54, "MC"], [62, 54, "MC"], [85, 58, "PON"], [50, 82, "ATA"]] },
  { nome: "3-5-2", uso: "Controle do meio-campo", uso_en: "Midfield control", pontos: [[50, 6, "GOL"], [28, 20, "ZAG"], [50, 18, "ZAG"], [72, 20, "ZAG"], [10, 48, "ALA"], [36, 40, "VOL"], [64, 40, "VOL"], [90, 48, "ALA"], [50, 58, "MEI"], [38, 82, "ATA"], [62, 82, "ATA"]] },
];

/** As portas do Winners 22 — o fecho do tutorial. Artes da casa em `public/game/w22/`. */
export const PORTAS: Array<{ href: string; img: string; cor: string; titulo: [string, string]; texto: [string, string]; cta: [string, string] }> = [
  { href: "/game", img: "pitch-aereo", cor: "#a3e635", titulo: ["Busca e central do clube", "Club search & hub"], texto: ["Ache o seu clube do FC 27 e veja elenco, notas, forma das 10 últimas, calendário de partidas e a régua da divisão.", "Find your FC 27 club: squad, ratings, last-10 form, match calendar and the division bar."], cta: ["Procurar meu clube", "Find my club"] },
  { href: "/game/mercado", img: "corredor", cor: "#38bdf8", titulo: ["Mercado da bola", "Transfer board"], texto: ["Clube procurando jogador e jogador procurando clube, com filtro de posição, plataforma e horário — e cartaz pronto para os grupos.", "Clubs recruiting and free agents, filtered by position, platform and schedule — with a ready-made poster."], cta: ["Ver vagas", "See openings"] },
  { href: "/game/mercado/negociacoes", img: "controle", cor: "#f5c04e", titulo: ["Compra e venda", "Buy & sell"], texto: ["Compre a gestão de um clube ou contrate um jogador em fichas, com valor de mercado tirado do dado da EA e custódia até todo mundo dizer sim.", "Buy a club's management or sign a player in chips, valued from EA data and held in escrow until everyone agrees."], cta: ["Negociar", "Negotiate"] },
  { href: "/game/campeonatos", img: "duelo", cor: "#a78bfa", titulo: ["Campeonatos", "Championships"], texto: ["Monte ou entre numa competição: pontos corridos, mata-mata ou grupos, com tabela, chaveamento e placar confirmado pelos dois capitães.", "Create or join a competition — league, knockout or groups — with tables, brackets and scores confirmed by both captains."], cta: ["Ver campeonatos", "See championships"] },
  { href: "/game/copa/super-copa-dos-streamers", img: "trofeu", cor: "#f5c04e", titulo: ["Super Copa dos Streamers", "Streamers Super Cup"], texto: ["A copa com placar conferido na fonte da EA, partida por partida, e a linha do tempo de tudo o que aconteceu.", "The cup with every score checked against EA's source and a timeline of everything that happened."], cta: ["Ver a copa", "See the cup"] },
  { href: "/game/apostas", img: "fichas", cor: "#a3e635", titulo: ["A mesa: palpites em fichas", "The table: chip picks"], texto: ["Palpite em partidas, times e jogadores com um modelo calibrado para Pro Clubs. 100 fichas para começar; ficha não vale dinheiro.", "Picks on matches, teams and players with a Pro Clubs-calibrated model. 100 chips to start; chips have no cash value."], cta: ["Ir à mesa", "Go to the table"] },
  { href: "/game/federacao", img: "selo", cor: "#f472b6", titulo: ["Federação", "Federation"], texto: ["Aprova clubes, cuida da integridade das partidas e decide por escrito, com direito de defesa. Evidência automática, sanção humana.", "Approves clubs, watches match integrity and rules in writing, with a right of defence. Automatic evidence, human sanctions."], cta: ["Conhecer", "Learn more"] },
  { href: "/game", img: "tunel", cor: "#38bdf8", titulo: ["Comunidade e perfil do jogador", "Community & player profile"], texto: ["Quem está online agora, o seu perfil com carreira e reputação em 5 categorias, e as avaliações de quem jogou com você.", "Who's online now, your profile with career stats and a 5-category reputation, and reviews from teammates."], cta: ["Entrar na comunidade", "Join the community"] },
];

/** Exemplo de avaliação de mercado — números de jogador fictício, conta real (`valor-mercado.ts`). */
export const EXEMPLO_JOGADOR = { jogos: 40, gols: 22, assistencias: 14, nota: 7.6, melhorEmCampo: 6, overall: 84, divisaoClube: 3 };

/* ------------------------------------------------------------------ */
/* pt-BR                                                               */
/* ------------------------------------------------------------------ */

const PT: Tutorial = {
  titulo: "Tutorial completo do Pro Clubs no FC 27",
  subtitulo:
    "Do primeiro Pro ao título de divisão: The Grounds, os 13 arquétipos, Maestrias, Amps, instalações, liga, táticas, Rush — e como usar o Winners 22 para achar time, provar que o clube é seu, contratar, vender e disputar campeonato.",
  selo: "Atualizado para o EA SPORTS FC™ 27 · acesso antecipado no ar, lançamento em 25/09/2026",
  indice: "Neste tutorial",
  voltar: "Winners 22",
  fontes:
    "Fontes: Pitch Notes oficiais da EA (The Grounds & Clubs Deep Dive; Launch Update), guias de lançamento do FC 27 e medições próprias da API pública de Clubs feitas em 21/09/2026. Onde a EA ainda não publicou um número, este tutorial diz que não publicou.",
  atualizado: "Atualizado em 21/09/2026",
  rotulos: {
    exemplo: "Exemplo prático", dica: "Dica", alerta: "Atenção", passo: "Passo",
    divisao: "Divisão", sobe: "Sobe com", fica: "Fica com", titulo: "Título com", entrada: "entrada",
    maestria: "Maestria (vale para todas as builds)", posicao: "Onde joga", arquetipo: "Arquétipo", setor: "Setor",
    padrao: "Padrão", assinatura: "Assinatura", slot: "Encaixe",
    parcela: "Parcela", fichas: "fichas", faixa: "Faixa aceita", confianca: "Confiança",
  },
  secoes: [
    {
      id: "o-que-mudou", grupo: "Começo", titulo: "O que é o Pro Clubs no FC 27",
      resumo: "Você controla UM jogador (o seu Pro) num time de até 11 pessoas reais. No FC 27, tudo isso mora dentro de um mundo aberto: The Grounds.",
      img: "grounds", alt: "Praça de futebol urbano à noite, com várias quadras cercadas iluminadas e gente circulando entre elas",
      blocos: [
        { t: "p", texto: "No Pro Clubs (o modo que o jogo chama de Clubs) cada pessoa entra com o próprio atleta. O clube junta amigos — ou desconhecidos que viram amigos — para disputar liga, playoffs e torneios 11 contra 11. Quem não aparece é substituído por jogador controlado pelo computador." },
        { t: "p", texto: "A grande mudança do FC 27 é The Grounds: um mundo compartilhado que junta até 100 jogadores na mesma instância. O Clubs deixou de ser um menu e virou um lugar — o Clubhouse — dentro desse mundo." },
        { t: "visual", v: "mapa" },
        { t: "lista", titulo: "O que mudou em relação ao FC 26", itens: [
          "Todos os 13 arquétipos vêm desbloqueados desde o início.",
          "Trocar de arquétipo não custa mais moedas nem item de reset.",
          "Maestrias: subir de nível um arquétipo dá bônus permanente de atributo para TODAS as suas builds.",
          "Amps: itens temporários que reforçam o seu arquétipo por um número limitado de partidas.",
          "Ajuste fino de atributos sem precisar resetar a build inteira.",
          "O modo não existe mais em PS4, Xbox One nem no Switch original.",
        ] },
        { t: "dica", texto: "Se você só quer jogar com a galera hoje à noite: crie o Pro, escolha um arquétipo do setor em que você gosta de jogar, entre no Clubhouse e mande o convite do clube. O resto deste tutorial é para fazer o time render." },
      ],
    },
    {
      id: "plataformas", grupo: "Começo", titulo: "Plataformas, crossplay e as piscinas da EA",
      resumo: "PS5, Xbox Series e PC jogam juntos. O Nintendo Switch 2 tem o modo, mas fica numa piscina separada.",
      img: "plataformas", alt: "Sala com console, PC e portátil lado a lado, com três controles diferentes sobre a mesa",
      blocos: [
        { t: "tabela", cab: ["Plataforma", "Tem Clubs no FC 27?", "Joga com"], linhas: [
          ["PlayStation 5", "Sim", "Xbox Series, PC"],
          ["Xbox Series X|S", "Sim", "PS5, PC"],
          ["PC", "Sim", "PS5, Xbox Series"],
          ["Nintendo Switch 2", "Sim", "Só Switch 2"],
          ["PS4 / Xbox One / Switch 1", "Não", "—"],
        ] },
        { t: "p", texto: "Nos dados públicos da EA isso aparece como duas \"piscinas\": `common-gen5` (PS5, Series e PC) e `nx` (Switch 2). Cada piscina tem ranking e numeração de clube próprios — o clube 4646 de uma não é o 4646 da outra." },
        { t: "alerta", texto: "Medimos no primeiro dia do acesso antecipado: a numeração de clube do FC 27 recomeçou do zero. Um ID que você guardou do FC 26 pode apontar hoje para outro clube. Sempre ache o seu clube de novo pela busca do Winners 22." },
        { t: "exemplo", titulo: "Montando um clube misto", linhas: [
          "Três amigos no PS5, dois no PC e um no Xbox Series: todos no mesmo clube, sem problema.",
          "Um amigo só tem Switch 2: ele precisa de um clube criado no Switch 2 — não consegue entrar no clube de vocês.",
        ] },
      ],
    },
    {
      id: "criar-pro", grupo: "Seu Pro", titulo: "Criando o seu Pro",
      resumo: "Aparência, posição preferida e arquétipo. Só o arquétipo define como o jogador joga — e ele pode ser trocado de graça.",
      img: "criar-pro", alt: "Jogador amarrando a chuteira no banco do vestiário",
      blocos: [
        { t: "passos", itens: [
          "No menu do jogo ou já dentro do The Grounds, abra a criação do Pro.",
          "Defina o visual. No FC 27 há dois looks separados: um para a rua (The Grounds) e outro para o estádio.",
          "Escolha a posição preferida. Posição e função tática são configurações separadas do arquétipo.",
          "Escolha o arquétipo inicial (veja a próxima seção). Não tenha medo: resetar não custa nada.",
          "Distribua os pontos de atributo que o nível do arquétipo libera. Dá para ajustar um atributo sem resetar tudo.",
        ] },
        { t: "dica", texto: "O nome do Pro aparece nos dados públicos da EA. É por ele que o Winners 22 confere que o clube é seu (seção \"Provar que o clube é seu\"). Escolha um nome que você não se importe de mudar por um dia." },
        { t: "alerta", texto: "A EA ainda não publicou o teto de nível dos arquétipos nem uma tabela oficial de altura e peso para o FC 27. Desconfie de guia que crava esses números na primeira semana." },
      ],
    },
    {
      id: "arquetipos", grupo: "Seu Pro", titulo: "Os 13 arquétipos e as Maestrias",
      resumo: "O arquétipo é o molde do jogador. Cada um, ao subir de nível, libera uma Maestria que melhora todas as suas outras builds.",
      img: "arquetipos", alt: "Onze jogadores de uniforme escuro alinhados de costas num campo iluminado, com o goleiro em cor diferente",
      blocos: [
        { t: "visual", v: "arquetipos" },
        { t: "p", texto: "Maestria é o que torna o FC 27 diferente: ao levar um arquétipo a certos marcos de nível, você ganha +1 permanente em dois atributos, e esse bônus vale para QUALQUER arquétipo que você usar depois. Exemplo oficial da EA: Finisher no nível 10 dá +1 Finalização e +1 Compostura a todas as builds." },
        { t: "exemplo", titulo: "Plano de carreira de um volante", linhas: [
          "Build principal: Recycler (VOL/MC) — é o que o time precisa toda noite.",
          "Build secundária: Disruptor — a Maestria dele dá Fôlego e Interceptação, que também servem ao Recycler.",
          "Resultado: jogando as duas, o seu volante fica mais forte do que um jogador que só usou uma.",
        ] },
        { t: "visual", v: "posicoes" },
        { t: "dica", texto: "Comece pela sua posição principal e depois ramifique para UM arquétipo secundário útil. Espalhar AXP por cinco arquétipos ao mesmo tempo atrasa todos." },
      ],
    },
    {
      id: "axp", grupo: "Seu Pro", titulo: "AXP, níveis e consumíveis",
      resumo: "AXP é a experiência de cada arquétipo. Vem de partida, atividade no The Grounds e recompensa — e agora há consumível que injeta AXP direto.",
      img: "axp", alt: "Jogador fazendo exercício de agilidade entre cones no fim de tarde",
      blocos: [
        { t: "lista", titulo: "De onde vem AXP", itens: [
          "Partidas de Clubs (liga, playoffs, torneios) e partidas de estádio Drop-In.",
          "Partidas curtas e Kickabouts no The Grounds.",
          "Objetivos, eventos ao vivo, campanhas e o passe da temporada.",
          "Consumíveis de AXP: há os que servem a qualquer arquétipo, os de um arquétipo só (ex.: Boss) e os de um grupo de posições (ex.: arquétipos de meio-campo). Cada consumível tem o seu teto de nível.",
        ] },
        { t: "lista", titulo: "O que o nível libera", itens: [
          "Pontos de atributo para distribuir.",
          "Melhorias da carta do jogador e Perks de assinatura.",
          "Os marcos de Maestria.",
        ] },
        { t: "exemplo", titulo: "Semana típica de quem sobe rápido", linhas: [
          "Seg a qui: liga com o clube à noite (AXP + progresso de temporada do clube).",
          "Intervalos: um Kickabout ou 3v3 de 3 minutos enquanto a galera chega.",
          "Fim de semana: torneio ao vivo com regra especial (costuma trazer bônus de AXP instantâneo).",
          "Guarde consumível de arquétipo específico para a build secundária — ele acelera a Maestria que falta.",
        ] },
      ],
    },
    {
      id: "amps", grupo: "Seu Pro", titulo: "Amps: o reforço temporário",
      resumo: "Três encaixes: dois Amps Padrão e um de Assinatura. Valem por um número de partidas e depois expiram.",
      img: "amps", alt: "Três cartas translúcidas brilhando sobre as mãos de quem segura um controle",
      blocos: [
        { t: "visual", v: "amps" },
        { t: "tabela", cab: ["Nível", "Tipo", "O que dá"], linhas: [
          ["1", "Padrão", "Bônus de atributo"],
          ["2", "Padrão", "Bônus de atributo maior"],
          ["3", "Assinatura", "Atributos maiores + PlayStyles + Perks"],
          ["4", "Assinatura", "Atributos maiores + PlayStyles+ + Perks"],
        ] },
        { t: "p", texto: "Amps funcionam em todas as partidas de estádio e no Rush dentro do mundo. Chegam por objetivos, eventos, campanhas, progressão de temporada e loja." },
        { t: "dica", texto: "Guarde o Amp de Assinatura de nível 4 para a noite que importa (playoff, final de campeonato no Winners 22). Gastar num amistoso é desperdiçar partidas de validade." },
      ],
    },
    {
      id: "clube", grupo: "Seu clube", titulo: "Criar ou entrar num clube",
      resumo: "O Clubhouse é a sede. De lá você cria o clube, convida, aceita pedidos e entra nas partidas.",
      img: "clube", alt: "Amigos reunidos no sofá de uma sala de clube planejando no tablet",
      blocos: [
        { t: "passos", titulo: "Criando", itens: [
          "Entre no Clubhouse (pelo menu ou andando até ele no The Grounds).",
          "Crie o clube: nome, sigla, escudo, uniforme e estádio. O nome é o que aparece na busca pública.",
          "Convide os amigos pela lista da plataforma ou pela busca de jogadores.",
          "Configure os papéis internos do jogo (quem pode convidar e escalar).",
        ] },
        { t: "passos", titulo: "Entrando num clube que já existe", itens: [
          "Ache o clube (no jogo, ou pelo Mercado do Winners 22, filtrando posição, plataforma e horário).",
          "Peça para entrar ou aceite o convite.",
          "Combine o horário fixo com o time — clube que joga sempre no mesmo horário sobe de divisão.",
        ] },
        { t: "alerta", texto: "O nome do clube na EA guarda espaços do jeito que foi digitado. \"LEÕES  DO  SUL\" (com dois espaços) não é achado por \"LEÕES DO SUL\" na busca oficial. A busca do Winners 22 contorna isso: procure por uma palavra só." },
      ],
    },
    {
      id: "instalacoes", grupo: "Seu clube", titulo: "Reputação, fãs e instalações",
      resumo: "Marcos do clube trazem fãs; fãs sobem a reputação; reputação aumenta o orçamento de instalações — que é reaproveitável.",
      img: "instalacoes", alt: "Centro de treinamento vazio ao amanhecer com pista de corrida em volta do campo",
      blocos: [
        { t: "lista", itens: [
          "Marcos do clube (Club Milestones) geram fãs, que aumentam a reputação.",
          "Quanto maior a reputação, maior o orçamento de instalações.",
          "O orçamento é reciclável: tirar uma instalação devolve o valor para montar outra.",
          "Instalações de jogador reforçam os membros do clube; instalações de IA reforçam os companheiros controlados pelo computador.",
          "Exemplo publicado: a Pista de Corrida dá +2 Pique e +3 Fôlego.",
        ] },
        { t: "tabela", cab: ["Moeda", "Para que serve", "Como ganha"], linhas: [
          ["Grounds Coins", "Amps, consumíveis e visual do avatar", "Objetivos, playoffs, eventos"],
          ["Orçamento de instalações", "Cartas de instalação do clube", "Reputação do clube (não se gasta: se realoca)"],
        ] },
        { t: "exemplo", titulo: "Clube com muitos buracos no time", linhas: [
          "Vocês jogam com 6 pessoas e 5 posições são da IA.",
          "Priorize instalações de IA: elas melhoram os 5 companheiros controlados pelo computador.",
          "Quando o elenco fechar em 10–11 humanos, realoque o orçamento para instalações de jogador.",
        ] },
      ],
    },
    {
      id: "liga", grupo: "Competir", titulo: "Liga de divisões e playoffs",
      resumo: "Dez divisões. Cada temporada tem uma régua de pontos: tantos para subir, tantos para não cair, tantos para o título.",
      img: "divisoes", alt: "Estádio lotado à noite visto do alto das arquibancadas, com fogos",
      blocos: [
        { t: "p", texto: "A régua abaixo é lida da própria EA (o endpoint público de regras das divisões) e atualizada pelo coletor do Winners 22. Divisão 1 é a elite; divisão 10 é a entrada." },
        { t: "visual", v: "divisoes" },
        { t: "lista", titulo: "Como ler", itens: [
          "Vitória vale 3 pontos, empate 1.",
          "\"Sobe com\": pontos para ser promovido.",
          "\"Fica com\": pontos para não ser rebaixado (a divisão 10 não rebaixa).",
          "\"Título com\": pontos para ser campeão da divisão.",
          "Terminar a temporada dá recompensa por faixa: Campeão, Vice, Competitivo, Meio de tabela e Participante.",
          "Playoffs: competição de fim de temporada; a divisão define o nível de entrada. Dão fãs, Grounds Coins, troféus e visual.",
        ] },
        { t: "exemplo", titulo: "Fazendo a conta da temporada", linhas: [
          "Seu clube está na divisão 6 com 3 vitórias e 1 empate: 3×3 + 1 = 10 pontos.",
          "Confira na régua quantos faltam para subir e quantos jogos restam na temporada.",
          "Se a conta não fecha, o objetivo da noite muda: não perder (segurar a divisão) em vez de arriscar.",
        ] },
        { t: "alerta", texto: "Partida abandonada entra na tabela como 3–0. No FC 26 medimos que 26,5% de todas as partidas públicas terminavam exatamente 3–0 — e metade durava menos de dois minutos. Abandonar não \"salva\" nada: é derrota." },
      ],
    },
    {
      id: "taticas", grupo: "Competir", titulo: "Formações e táticas",
      resumo: "As quatro formações que os guias de lançamento mais recomendam, e quando usar cada uma.",
      img: "taticas", alt: "Mão desenhando setas numa prancheta tática com ímãs de jogadores",
      blocos: [
        { t: "visual", v: "formacoes" },
        { t: "lista", titulo: "Regras de bolso", itens: [
          "Poucos humanos? Formação com dois atacantes (4-1-2-1-2) deixa a IA na defesa, onde ela erra menos.",
          "Um volante humano muda o time: no Pro Clubs, quem segura a posição vale mais do que quem corre atrás da bola.",
          "Lateral humano que sobe precisa de volante que cobre — combinem antes do jogo.",
          "Goleiro humano é o maior salto de qualidade de um clube pequeno.",
        ] },
        { t: "exemplo", titulo: "Escalação para 7 humanos no 4-2-3-1", linhas: [
          "Humanos: GOL, 2 VOL, MEI, 2 PON, ATA.",
          "IA: os quatro defensores (ZAG e LAT).",
          "Por quê: com dois volantes humanos na frente, a linha de IA fica protegida e o ataque tem gente real criando.",
        ] },
      ],
    },
    {
      id: "rush", grupo: "Competir", titulo: "Rush, Drop-In, partidas curtas e Kickabouts",
      resumo: "Nem tudo é 11 contra 11. O The Grounds tem partidas de 3 minutos, Rush e minijogos que também dão AXP.",
      img: "rush", alt: "Partida de rua numa quadra de terra cercada, à noite",
      blocos: [
        { t: "tabela", cab: ["Formato", "Como é"], linhas: [
          ["1v1", "Um jogador de linha por time + goleiro da CPU. 3 minutos."],
          ["2v2 e 3v3", "Gols menores, sem goleiro. 3 minutos."],
          ["Rush (no mundo)", "Versão em quadra de terra, dentro do The Grounds."],
          ["Estádio Rush", "Rush com pareamento por habilidade e torneios."],
          ["Drop-In 11v11", "Partida de estádio avulsa, sem clube, com pareamento por habilidade."],
        ] },
        { t: "p", texto: "Regras das partidas curtas: chute com assistência manual, passe totalmente assistido, falta ativada (a cobrança pode ser chute direto do local) e disputa de posse no meio-campo no início." },
        { t: "tabela", cab: ["Kickabout", "Resumo"], linhas: [
          ["Bocce Ball", "3 jogadores, 3 rodadas de 1 min: acertar alvos (100, 500 e 1.250 pontos; mosca dobra)."],
          ["Team Keepaway", "3v3, 3 min: posse vale 5 pontos/s; passe 20, de primeira 40; multiplicadores a 5 e 10 passes."],
          ["The Big Race", "4 jogadores, 3 pistas: conduzir a bola por obstáculos; 9/6/3/1 pontos por posição."],
          ["Attacking Scenarios", "2v2, 4 rodadas de 1 min, cenários bronze (1), prata (2) e ouro (3)."],
          ["Bucket Ball", "2v2, 3 min: marcar na cesta do rival com cavadinha ou cortada."],
          ["Balloon Ball", "4 jogadores, 3 balões cada; o último de pé vence a rodada."],
          ["Goal Control", "1v1, 8 gols no campo; cada gol dominado soma pontos por segundo."],
          ["Drop Kick Targets", "Alvos espalhados pelo mundo, com objetivo semanal."],
        ] },
        { t: "dica", texto: "Kickabout é o aquecimento perfeito enquanto o time não fecha: dá AXP, treina domínio e passe, e ninguém fica parado no lobby." },
      ],
    },
    {
      id: "comunicacao", grupo: "Competir", titulo: "Rotina e comunicação de um time que sobe",
      resumo: "Clube que sobe de divisão é clube que tem horário fixo, voz e alguém organizando.",
      img: "comunicacao", alt: "Jogadora de headset falando no microfone com o controle na mão",
      blocos: [
        { t: "lista", itens: [
          "Horário fixo, todo dia ou em dias certos. É o que os cartazes de recrutamento dos grupos sempre dizem — e é verdade.",
          "Chat de voz aberto durante a partida: \"sobe\", \"fica\", \"homem nas costas\".",
          "Um capitão que escala antes de o jogo começar, para ninguém brigar por posição no lobby.",
          "Revisão de 5 minutos depois da derrota: o Winners 22 mostra a nota, passes e desarmes de cada um, partida por partida.",
          "Quem vai faltar avisa. Presença é a estatística que mais separa clube que sobe de clube que desmancha.",
        ] },
        { t: "exemplo", titulo: "Mensagem fixada no grupo do clube", linhas: [
          "Treino: seg, qua e sex, 21h. Liga: 21h30.",
          "Escalação sai às 21h15 no grupo.",
          "Faltou 3 vezes sem avisar: sai da titularidade.",
        ] },
      ],
    },
    {
      id: "winners22", grupo: "Winners 22", titulo: "Achar o seu clube e o seu jogador no Winners 22",
      resumo: "Sem senha e sem instalar nada: lemos o que a própria EA publica sobre o seu clube.",
      img: "conectar", alt: "Mãos segurando o celular com a lista de clubes, TV com o campo ao fundo",
      blocos: [
        { t: "passos", itens: [
          "Abra fayai.com.br/game e digite o nome do clube na busca (uma palavra basta).",
          "Se não tiver certeza da plataforma, deixe \"Todas\" marcado.",
          "Abra a central do clube: elenco com nota, gols, assistências, a forma das últimas 10 partidas e a régua da divisão.",
          "No elenco, clique em \"Sou eu\" no seu nome para ligar a gamertag à sua conta — é o que leva as suas estatísticas com você quando mudar de clube.",
        ] },
        { t: "alerta", texto: "A EA bloqueia servidores de nuvem, então o Winners 22 lê os dados por um espelho atualizado a cada coleta. A tela sempre diz a idade do dado. Clube recém-criado aparece depois da próxima coleta." },
        { t: "exemplo", titulo: "\"Não acho meu clube\"", linhas: [
          "Busque só a palavra mais rara do nome (\"Leões\" em vez de \"Leões do Sul FC\").",
          "Troque a plataforma: o seu clube pode estar no Switch 2 (`nx`).",
          "Clube do FC 26? Ele não existe no FC 27 — os dados recomeçaram.",
        ] },
      ],
    },
    {
      id: "provar-posse", grupo: "Winners 22", titulo: "Provar que o clube é seu (gestão)",
      resumo: "Qualquer um digita o nome de um clube. Dono é quem prova: um código no nome do Pro, conferido nos dados da EA.",
      img: "provar-posse", alt: "Mãos no controle com um escudo verde de verificação flutuando acima",
      blocos: [
        { t: "passos", itens: [
          "Na central do clube, abra \"Gestão\" e peça a gestão, explicando quem você é no clube.",
          "Gere o código de verificação: ele tem o formato W22 + 10 caracteres (ex.: W22A1B2C3D4E5) e vale 48 horas.",
          "No jogo, coloque o código no NOME DO SEU PRO (ex.: \"R. Faya W22A1B2C3D4E5\").",
          "Jogue ou espere a próxima coleta do espelho e clique em conferir.",
          "A federação aprova. A partir daí você pode nomear capitão, vice e recrutador.",
          "Pode tirar o código do nome depois da aprovação.",
        ] },
        { t: "tabela", cab: ["Papel", "Pode"], linhas: [
          ["Dono", "Tudo: identidade, elenco, vagas, inscrição, partidas, delegar — e vender a gestão"],
          ["Capitão", "Identidade, elenco, vagas, inscrição em campeonato, partidas"],
          ["Vice", "Elenco, vagas, partidas"],
          ["Recrutador", "Vagas no Mercado"],
        ] },
        { t: "alerta", texto: "Código antigo não vale: o espelho capturado ANTES da geração do código nunca serve de prova, mesmo que o nome tenha o código." },
      ],
    },
    {
      id: "mercado", grupo: "Winners 22", titulo: "Mercado da bola: vagas e jogadores livres",
      resumo: "O quadro de transferências dos grupos, organizado: posição, plataforma, horário e a divisão real do clube.",
      img: "mercado", alt: "Duas pessoas apertando as mãos numa mesa de escritório de clube",
      blocos: [
        { t: "passos", titulo: "Clube procurando jogador", itens: [
          "Em /game/mercado, publique uma vaga: posições (GOL, ZAG, LAT, VOL, MEI, PON, ATA), plataforma, dias e horário.",
          "Ligue a vaga ao clube da EA: ela ganha o selo de fonte pública com divisão e campanha reais.",
          "Gere o cartaz 1080×1350 num clique e poste nos grupos.",
          "Leia as candidaturas no próprio site — o contato só é revelado a quem se candidatou.",
        ] },
        { t: "passos", titulo: "Jogador procurando clube", itens: [
          "Publique o seu anúncio de jogador livre com posição, overall, horário e estilo.",
          "Filtre as vagas pela sua posição e plataforma e candidate-se.",
          "Mantenha o perfil com reputação: companheiros avaliam compromisso, comunicação e fair play.",
        ] },
        { t: "visual", v: "glossario" },
      ],
    },
    {
      id: "compra-venda", grupo: "Winners 22", titulo: "Compra e venda de clubes e jogadores",
      resumo: "Negociações em fichas, com custódia, avaliação de mercado a partir de dado real e consentimento de todos os lados.",
      img: "compra-venda", alt: "Contrato assinado sobre a mesa ao lado de fichas verdes, uma bola e chuteiras",
      blocos: [
        { t: "p", texto: "No Winners 22 você pode comprar a GESTÃO de um clube (virar o dono dele na plataforma) ou contratar um jogador para o seu clube. O pagamento é em fichas — a moeda de jogo, que não se compra, não se saca e não vale fora do Winners 22." },
        { t: "visual", v: "negociacao" },
        { t: "p", texto: "Toda proposta precisa caber na faixa do valor de mercado: de metade ao dobro da referência. A referência vem do dado público da EA — nota, gols, assistências, craque da partida, overall, jogos e a divisão do clube. Abaixo, a conta de um jogador de exemplo:" },
        { t: "visual", v: "valor" },
        { t: "lista", titulo: "As regras", itens: [
          "Ao enviar a proposta, as fichas ficam em custódia: saem do seu saldo e só voltam se a proposta for recusada, cancelada ou vencer (7 dias).",
          "Jogador sempre consente. Ninguém é transferido sem aceitar — as luvas vão para ele.",
          "Se o clube de origem tem dono aprovado, você pode oferecer uma compensação a ele; nesse caso ele também precisa aceitar.",
          "Comprar um clube troca o dono no Winners 22 e encerra as delegações antigas (capitão, vice, recrutador).",
          "A federação retém 10% de toda venda concluída: essas fichas saem de circulação.",
          "Máximo de 5 propostas abertas por pessoa.",
          "Todas as transferências concluídas ficam públicas no quadro.",
        ] },
        { t: "exemplo", titulo: "Contratando um atacante", linhas: [
          "O ATA do exemplo acima vale 595 fichas na régua (faixa 300–1.190).",
          "Você oferece 800: 650 de luvas para ele + 150 de compensação ao clube de origem.",
          "As 800 fichas ficam em custódia. O jogador aceita; o dono do clube de origem aceita.",
          "Resultado: o jogador recebe 585 (650 − 10%), o clube de origem recebe 135 (150 − 10%) e 80 fichas saem de circulação.",
          "No jogo, o jogador sai de um clube e entra no seu — isso continua sendo feito dentro do FC 27.",
        ] },
        { t: "alerta", texto: "Pagamento por fora (Pix, dinheiro, item de outro jogo) em troca de negociação é proibido e dá sanção. A ficha não tem valor econômico, e é isso que mantém o Winners 22 fora da lei de apostas com dinheiro." },
      ],
    },
    {
      id: "campeonatos", grupo: "Winners 22", titulo: "Campeonatos, fichas e palpites",
      resumo: "Inscreva o clube, confirme o resultado com o capitão rival, e acompanhe a mesa de palpites em fichas.",
      img: "campeonato", alt: "Troféu prateado sob holofote com confete caindo",
      blocos: [
        { t: "passos", itens: [
          "Em /game/campeonatos, escolha uma competição aberta e inscreva o clube (dono ou capitão).",
          "Jogue a partida no FC 27 no horário marcado.",
          "Lance o placar; o capitão adversário confirma. Divergência vai para a federação decidir.",
          "O coletor casa a partida lançada com a partida publicada pela EA (data, placar e elenco).",
        ] },
        { t: "tabela", cab: ["Fichas", "Regra"], linhas: [
          ["Bônus de entrada", "100 fichas na primeira visita"],
          ["Recarga", "50 por dia para quem ficou com menos de 10"],
          ["Palpite", "de 1 a 500 fichas por cupom"],
          ["Valor econômico", "Nenhum: não se compra, não se converte, não se saca"],
        ] },
        { t: "dica", texto: "Os palpites usam um modelo calibrado para Pro Clubs, não para futebol de verdade: no Pro Clubs saem muito mais gols e quase não há empate." },
      ],
    },
    {
      id: "integridade", grupo: "Winners 22", titulo: "Integridade: abandono, W.O. e fair play",
      resumo: "O que conta como abandono, por que o 3–0 engana, e como a federação decide sem punir inocente.",
      img: "integridade", alt: "Lupa sobre a tela de um notebook com o gráfico da linha do tempo de uma partida",
      blocos: [
        { t: "lista", itens: [
          "Partida completa dura cerca de 5.500 segundos de tempo de jogo nos dados da EA; W.O. dura segundos ou poucos minutos.",
          "O campo que marca abandono indica quem VENCEU por abandono — quem largou é o outro lado.",
          "Tempo parado em campo é registrado por jogador. Número alto aparece em vermelho — como informação, não como acusação.",
          "Evidência é automática; sanção é humana e fundamentada, com direito de defesa antes de valer.",
        ] },
        { t: "exemplo", titulo: "Queda de internet no meio do jogo", linhas: [
          "O sistema marca a partida como suspeita (duração curta, 3–0).",
          "Ninguém é notificado ainda. Um humano junta a evidência.",
          "O clube explica; a federação decide por escrito — arquivar, advertir ou suspender.",
        ] },
      ],
    },
    {
      id: "glossario", grupo: "Fim", titulo: "Glossário",
      resumo: "As palavras do modo e as da comunidade brasileira.",
      blocos: [{ t: "visual", v: "glossario" }],
    },
    {
      id: "winners22-completo", grupo: "Fim", titulo: "Tudo o que o Winners 22 oferece",
      resumo: "O Winners 22 é a liga do Pro Clubs da FayAI: pega o que a EA publica sobre o seu clube e transforma em estatística com procedência, mercado, campeonato, fichas e uma federação que arbitra com direito de defesa. Tudo de graça, sem senha e sem instalar nada.",
      blocos: [
        { t: "visual", v: "portas" },
        { t: "p", texto: "Chegou agora? Procure o seu clube, clique em \"Sou eu\" no seu nome e escolha uma porta: quem quer time vai ao Mercado, quem já tem time vai aos Campeonatos, quem quer torcer vai à Mesa." },
      ],
    },
  ],
  glossario: [
    ["GOL · ZAG · LAT · VOL · MEI · PON · ATA", "As posições na gíria dos grupos: goleiro, zagueiro, lateral, volante, meia, ponta, atacante."],
    ["Pro", "O seu jogador no Clubs."],
    ["Arquétipo", "O molde do Pro (13 no FC 27). Define atributos e estilo; troca de graça."],
    ["AXP", "Experiência de arquétipo. Sobe o nível de cada arquétipo separadamente."],
    ["Maestria", "Bônus permanente de atributo, ganho num arquétipo e válido para todos."],
    ["Amp", "Reforço temporário: 2 Padrão + 1 Assinatura, válidos por algumas partidas."],
    ["The Grounds", "O mundo compartilhado do FC 27, com até 100 jogadores."],
    ["Clubhouse", "A sede do clube dentro do The Grounds."],
    ["Drop-In", "Partida avulsa de estádio, sem clube."],
    ["Rush", "Formato curto; no FC 27 existe no mundo e no Estádio Rush."],
    ["Kickabout", "Minijogos de rua do The Grounds."],
    ["W.O.", "Vitória por abandono do adversário. Nos dados da EA aparece como 3–0."],
    ["Espelho", "A cópia dos dados públicos da EA que o Winners 22 mantém, porque a EA bloqueia servidores de nuvem."],
    ["Ficha", "A moeda de jogo do Winners 22. Sem valor econômico."],
    ["Custódia", "Fichas presas numa proposta de negociação até a resposta."],
    ["Luvas", "A parte da proposta que vai para o jogador contratado."],
  ],
};

/* ------------------------------------------------------------------ */
/* en                                                                  */
/* ------------------------------------------------------------------ */

const EN: Tutorial = {
  ...PT,
  titulo: "The complete FC 27 Pro Clubs tutorial",
  subtitulo:
    "From your first Pro to a division title: The Grounds, the 13 archetypes, Masteries, Amps, facilities, leagues, tactics, Rush — and how to use Winners 22 to find a team, prove a club is yours, sign, sell and compete.",
  selo: "Updated for EA SPORTS FC™ 27 · early access live, launch on 25/09/2026",
  indice: "In this tutorial",
  voltar: "Winners 22",
  fontes:
    "Sources: EA's official Pitch Notes (The Grounds & Clubs Deep Dive; Launch Update), FC 27 launch guides and our own measurements of the public Clubs API on 21/09/2026. Where EA has not published a number yet, this tutorial says so.",
  atualizado: "Updated 21/09/2026",
  rotulos: {
    exemplo: "Worked example", dica: "Tip", alerta: "Heads up", passo: "Step",
    divisao: "Division", sobe: "Promotion at", fica: "Hold at", titulo: "Title at", entrada: "entry",
    maestria: "Mastery (applies to every build)", posicao: "Plays at", arquetipo: "Archetype", setor: "Line",
    padrao: "Standard", assinatura: "Signature", slot: "Slot",
    parcela: "Component", fichas: "chips", faixa: "Accepted range", confianca: "Confidence",
  },
  secoes: [
    { id: "o-que-mudou", grupo: "Start", titulo: "What Pro Clubs is in FC 27", resumo: "You control ONE player (your Pro) in a team of up to 11 real people. In FC 27 it all lives inside an open world: The Grounds.", img: "grounds", alt: "Night urban football plaza with several lit caged pitches", blocos: [
      { t: "p", texto: "In Pro Clubs (the game calls it Clubs) everyone brings their own athlete. The club gathers friends to play leagues, playoffs and 11v11 tournaments. Empty spots are filled by CPU players." },
      { t: "p", texto: "FC 27's big change is The Grounds: a shared world that brings up to 100 players into one instance. Clubs is no longer a menu, it is a place — the Clubhouse." },
      { t: "visual", v: "mapa" },
      { t: "lista", titulo: "What changed from FC 26", itens: ["All 13 archetypes unlocked from the start.", "Switching archetype no longer costs coins or a reset item.", "Masteries: levelling an archetype grants permanent attribute boosts to ALL your builds.", "Amps: temporary items that boost your archetype for a limited number of matches.", "Fine-tune single attributes without resetting the whole build.", "The mode no longer exists on PS4, Xbox One or the original Switch."] },
      { t: "dica", texto: "Just want to play tonight? Create the Pro, pick an archetype for your favourite line, walk into the Clubhouse and send the club invite." },
    ] },
    { id: "plataformas", grupo: "Start", titulo: "Platforms, crossplay and EA's pools", resumo: "PS5, Xbox Series and PC play together. Nintendo Switch 2 has the mode but sits in a separate pool.", img: "plataformas", alt: "Living room with a console, a PC and a handheld side by side", blocos: [
      { t: "tabela", cab: ["Platform", "Clubs in FC 27?", "Plays with"], linhas: [["PlayStation 5", "Yes", "Xbox Series, PC"], ["Xbox Series X|S", "Yes", "PS5, PC"], ["PC", "Yes", "PS5, Xbox Series"], ["Nintendo Switch 2", "Yes", "Switch 2 only"], ["PS4 / Xbox One / Switch 1", "No", "—"]] },
      { t: "p", texto: "EA's public data shows two pools: `common-gen5` (PS5, Series, PC) and `nx` (Switch 2). Each pool has its own ranking and club numbering." },
      { t: "alerta", texto: "We measured on early-access day one: FC 27 club numbering restarted from zero. An FC 26 club ID may now point to a different club. Always find your club again with the Winners 22 search." },
    ] },
    { id: "criar-pro", grupo: "Your Pro", titulo: "Creating your Pro", resumo: "Look, preferred position and archetype. Only the archetype defines how you play — and it can be switched for free.", img: "criar-pro", alt: "Player lacing boots on a locker room bench", blocos: [
      { t: "passos", itens: ["Open Pro creation from the menu or inside The Grounds.", "Set your look — FC 27 has separate street and stadium looks.", "Pick your preferred position; position and tactical role are separate from the archetype.", "Pick a starting archetype (next section). Resets are free.", "Spend the attribute points your archetype level unlocks; you can fine-tune one attribute without a full reset."] },
      { t: "dica", texto: "Your Pro's name shows up in EA's public data. Winners 22 uses it to verify club ownership." },
      { t: "alerta", texto: "EA has not yet published the archetype level cap or an official height/weight table for FC 27." },
    ] },
    { id: "arquetipos", grupo: "Your Pro", titulo: "The 13 archetypes and Masteries", resumo: "The archetype is your player's template. Each one unlocks a Mastery that improves all your other builds.", img: "arquetipos", alt: "Eleven players lined up from behind on a lit pitch", blocos: [
      { t: "visual", v: "arquetipos" },
      { t: "p", texto: "Masteries: reaching set level milestones on an archetype grants +1 to two attributes for EVERY archetype you use. EA's example: Finisher level 10 gives +1 Finishing and +1 Composure to all builds." },
      { t: "visual", v: "posicoes" },
      { t: "dica", texto: "Start with your main position, then branch into ONE useful secondary archetype." },
    ] },
    { id: "axp", grupo: "Your Pro", titulo: "AXP, levels and consumables", resumo: "AXP is per-archetype experience from matches, The Grounds activities and rewards.", img: "axp", alt: "Player doing agility drills between cones", blocos: [
      { t: "lista", itens: ["Clubs matches and Drop-In stadium matches.", "Small-sided matches and Kickabouts.", "Objectives, live events, campaigns and the season pass.", "AXP consumables: any archetype, a single archetype, or a position group — each with its own level cap."] },
    ] },
    { id: "amps", grupo: "Your Pro", titulo: "Amps", resumo: "Three slots: two Standard and one Signature. Valid for a number of matches, then they expire.", img: "amps", alt: "Three glowing cards over a controller", blocos: [
      { t: "visual", v: "amps" },
      { t: "tabela", cab: ["Tier", "Type", "Gives"], linhas: [["1", "Standard", "Attribute boosts"], ["2", "Standard", "Greater attribute boosts"], ["3", "Signature", "Greater boosts + PlayStyles + Perks"], ["4", "Signature", "Greater boosts + PlayStyles+ + Perks"]] },
    ] },
    { id: "clube", grupo: "Your club", titulo: "Create or join a club", resumo: "The Clubhouse is your HQ.", img: "clube", alt: "Friends planning on a tablet in a club lounge", blocos: [
      { t: "passos", itens: ["Enter the Clubhouse.", "Create the club: name, crest, kit and stadium.", "Invite friends.", "Agree on a fixed schedule — clubs that play at the same time every night climb divisions."] },
    ] },
    { id: "instalacoes", grupo: "Your club", titulo: "Reputation, fans and facilities", resumo: "Milestones bring fans, fans raise reputation, reputation raises a recyclable facility budget.", img: "instalacoes", alt: "Empty training complex at dawn", blocos: [
      { t: "lista", itens: ["Player Facilities boost members; AI Facilities boost CPU teammates.", "Example: Running Track gives +2 Sprint Speed and +3 Stamina.", "The budget is recyclable, not consumed."] },
    ] },
    { id: "liga", grupo: "Compete", titulo: "Divisions and playoffs", resumo: "Ten divisions, each with a points bar for promotion, holding and the title.", img: "divisoes", alt: "Packed stadium at night", blocos: [
      { t: "visual", v: "divisoes" },
      { t: "alerta", texto: "An abandoned match counts as 3–0. In FC 26, 26.5% of all public matches ended exactly 3–0." },
    ] },
    { id: "taticas", grupo: "Compete", titulo: "Formations and tactics", resumo: "The four formations launch guides recommend most.", img: "taticas", alt: "Hand drawing arrows on a tactics board", blocos: [{ t: "visual", v: "formacoes" }] },
    { id: "rush", grupo: "Compete", titulo: "Rush, Drop-In, small-sided and Kickabouts", resumo: "3-minute matches, Rush and street mini-games that also give AXP.", img: "rush", alt: "Street match on a caged dirt pitch", blocos: [
      { t: "tabela", cab: ["Format", "What it is"], linhas: [["1v1", "One outfield player each + CPU keeper. 3 minutes."], ["2v2 / 3v3", "Small goals, no keepers. 3 minutes."], ["Rush", "In-world dirt pitch, plus Rush Stadium."], ["Drop-In 11v11", "Standalone stadium match, skill-based matchmaking."]] },
    ] },
    { id: "comunicacao", grupo: "Compete", titulo: "Routine and communication", resumo: "Clubs that climb have a fixed time, voice chat and someone organising.", img: "comunicacao", alt: "Gamer with a headset", blocos: [
      { t: "lista", itens: ["Fixed schedule.", "Open voice chat.", "A captain who sets the line-up before kick-off.", "A 5-minute review after losses using Winners 22's per-match stats."] },
    ] },
    { id: "winners22", grupo: "Winners 22", titulo: "Find your club and player on Winners 22", resumo: "No password, no install: we read what EA publishes.", img: "conectar", alt: "Phone with a list of clubs", blocos: [
      { t: "passos", itens: ["Search your club name at fayai.com.br/game (one word is enough).", "Open the club hub.", "Click \"That's me\" on your name to link your gamertag."] },
    ] },
    { id: "provar-posse", grupo: "Winners 22", titulo: "Prove the club is yours", resumo: "A W22 code in your Pro's name, checked against EA data.", img: "provar-posse", alt: "Hands on a controller with a green verification shield above", blocos: [
      { t: "passos", itens: ["Request management on the club hub.", "Generate the code (W22 + 10 characters, valid 48 h).", "Put it in your Pro's name in game.", "Wait for the next mirror capture and verify.", "The federation approves."] },
    ] },
    { id: "mercado", grupo: "Winners 22", titulo: "Transfer board", resumo: "Openings and free agents with position, platform, schedule and the club's real division.", img: "mercado", alt: "Handshake across a desk", blocos: [{ t: "visual", v: "glossario" }] },
    { id: "compra-venda", grupo: "Winners 22", titulo: "Buying and selling clubs and players", resumo: "Chip-based deals with escrow, market value from real data and consent from every side.", img: "compra-venda", alt: "Signed contract on a desk beside green chips, a ball and boots", blocos: [
      { t: "visual", v: "negociacao" },
      { t: "visual", v: "valor" },
      { t: "lista", itens: ["Offers must fall between half and double the market value.", "Chips are held in escrow until the answer; refunded if declined, cancelled or expired (7 days).", "Players always consent.", "The federation keeps 10% of every completed sale.", "Off-platform payment is forbidden — chips have no monetary value."] },
    ] },
    { id: "campeonatos", grupo: "Winners 22", titulo: "Championships, chips and picks", resumo: "Enter, confirm the score with the rival captain, follow the chip pick table.", img: "campeonato", alt: "Silver trophy under a spotlight", blocos: [
      { t: "tabela", cab: ["Chips", "Rule"], linhas: [["Welcome bonus", "100"], ["Top-up", "50/day under 10"], ["Pick", "1–500 per slip"], ["Monetary value", "None"]] },
    ] },
    { id: "integridade", grupo: "Winners 22", titulo: "Integrity", resumo: "Automatic evidence, human and reasoned sanctions.", img: "integridade", alt: "Magnifying glass over a match timeline", blocos: [
      { t: "lista", itens: ["A full match lasts ~5,500 seconds of game time; walkovers last seconds.", "EA's DNF flag marks who WON by abandonment.", "Idle time is shown as information, never as an accusation."] },
    ] },
    { id: "glossario", grupo: "End", titulo: "Glossary", resumo: "Mode and community terms.", blocos: [{ t: "visual", v: "glossario" }] },
    { id: "winners22-completo", grupo: "End", titulo: "Everything Winners 22 offers", resumo: "Winners 22 is FayAI's Pro Clubs league: it turns what EA publishes about your club into sourced stats, a transfer market, championships, chips and a federation that rules with a right of defence. Free, no password, no install.", blocos: [{ t: "visual", v: "portas" }] },
  ],
};

export function getTutorial(locale: string): Tutorial {
  return locale === "en" ? EN : PT;
}
