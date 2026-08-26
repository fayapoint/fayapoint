/**
 * Todo o texto da seção /game, pt-BR e en, num módulo só.
 *
 * De propósito FORA do dicionário de 7.7k chaves: rota nova no dicionário
 * exige fatia, tradução e o risco silencioso da chave que falta (frase em
 * português numa página inglesa, sem erro). Aqui o copy viaja com a rota,
 * tipado — quando a seção estabilizar, migra-se para o dicionário se valer.
 *
 * A marca é **Winners 22 Championship** (Ricardo, 23/08/2026 — substituiu o
 * nome de trabalho anterior). Ela vive em três campos porque não cabe inteira
 * em todo lugar: `brand` no texto corrido e no aviso legal, `brandShort` +
 * `brandLine2` no letreiro de duas linhas e nos espaços apertados.
 */

export interface GameCopy {
  /** Nome completo da marca. Usado em texto corrido e no aviso legal. */
  brand: string;
  /**
   * A primeira linha do letreiro, e a forma que vai onde não cabe o nome
   * inteiro: menu, escudo, aba. "Winners 22 Championship" tem 24 caracteres —
   * em Bebas a 7rem isso vira três linhas e some do celular.
   */
  brandShort: string;
  /** A segunda linha do letreiro, sob a curta. */
  brandLine2: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaSearch: string;
  heroCtaJoin: string;
  disclaimer: string;
  search: {
    title: string;
    subtitle: string;
    placeholder: string;
    button: string;
    searching: string;
    empty: string;
    open: string;
    membersLabel: string;
    /** Seletor de piscina: as duas gerações de console não se enxergam na EA. */
    platformLabel: string;
    platformAll: string;
    platformGen5: string;
    platformGen4: string;
    /** O painel de ajuda — a queixa nº 1 da seção é "não acho meu clube". */
    helpTitle: string;
    helpItems: string[];
    idHint: string;
    /** `{n}` vira o número de clubes varridos na consulta. */
    scanned: string;
    approxTitle: string;
    divisionShort: string;
    /** Como cada linha foi encontrada — a interface diz, não esconde. */
    foundBy: { id: string; exato: string; prefixo: string; contem: string; aproximado: string };
  };
  how: {
    title: string;
    /** `art` é o nome do arquivo em `/public/game/`; `alt` descreve a cena. */
    steps: Array<{ title: string; text: string; art: string; alt: string }>;
  };
  pillars: {
    title: string;
    items: Array<{ title: string; text: string; art: string; alt: string }>;
  };
  roadmap: {
    title: string;
    subtitle: string;
    /** Rótulos do calendário de temporada. */
    kickoff: { label: string; date: string; note: string };
    statusLabel: { done: string; now: string; next: string };
    monthsLabel: string;
    phases: Array<{
      period: string;
      title: string;
      text: string;
      status: 'done' | 'now' | 'next';
      /** Faixa de meses que a fase ocupa no calendário (índice em `months`). */
      from: number;
      to: number;
      /** Marcos que viram pontos no calendário. */
      marks?: Array<{ day: string; label: string }>;
    }>;
    /** Cabeçalho de mês do calendário, na ordem. */
    months: string[];
  };
  /** Tabela de classificação — prévia do formato da liga piloto. */
  standings: {
    title: string;
    subtitle: string;
    previewBadge: string;
    empty: string;
    /** Nome da vaga na tabela. `{n}` vira o número da posição. */
    slotLabel: string;
    cols: { pos: string; club: string; played: string; won: string; drawn: string; lost: string; gf: string; ga: string; gd: string; points: string; form: string };
    legend: { promotion: string; playoff: string; relegation: string };
  };
  /**
   * RANKING GLOBAL — a tabela CHEIA que a página não tinha.
   * A classificação da piloto só existe em outubro; enquanto isso a EA publica
   * o ranking de todos os tempos do modo Clubs, com número em toda célula.
   */
  ranking: {
    title: string;
    subtitle: string;
    badge: string;
    platformLabel: string;
    platformGen5: string;
    platformGen4: string;
    cols: {
      rank: string;
      club: string;
      division: string;
      played: string;
      won: string;
      drawn: string;
      lost: string;
      gf: string;
      ga: string;
      gd: string;
      cleanSheets: string;
      skill: string;
    };
    loading: string;
    error: string;
    note: string;
    more: string;
    less: string;
  };
  /** A escada de divisões do modo Clubs, com os pontos que promovem e seguram. */
  divisions: {
    title: string;
    subtitle: string;
    cols: { division: string; promotion: string; hold: string; title: string };
    note: string;
  };
  /**
   * PROCEDÊNCIA DO DADO — de onde veio o que está na tela.
   *
   * Existe porque a EA recusa leitura de servidor (403 para IP de datacenter),
   * então em produção o dado vem do NOSSO espelho, com a idade que tiver. Dado
   * espelhado sem a data é afirmação sem procedência.
   */
  fonte: {
    live: string;
    /** `{quando}` vira a idade do espelho ("há 2 horas"). */
    mirror: string;
    mirrorWhy: string;
    empty: string;
    justNow: string;
    /** `{n}` vira o número. */
    minutes: string;
    hours: string;
    days: string;
  };
  /** Bloco do /game na home do site. */
  showcase: {
    title: string;
    highlight: string;
    badge: string;
    body: string;
    cta: string;
    stats: Array<{ value: string; label: string }>;
    /** O que a central do clube entrega — o painel da direita da vitrine. */
    deliversTitle: string;
    delivers: string[];
  };
  join: {
    title: string;
    subtitle: string;
    email: string;
    role: string;
    roles: Array<{ value: string; label: string }>;
    clubName: string;
    gamertag: string;
    message: string;
    submit: string;
    sending: string;
    success: string;
    error: string;
  };
  club: {
    record: string;
    wins: string;
    draws: string;
    losses: string;
    goals: string;
    goalsAgainst: string;
    skillRating: string;
    squad: string;
    squadCols: { player: string; pos: string; games: string; goals: string; assists: string; rating: string; motm: string; passes: string; shots: string; tackles: string; contribution: string };
    squadNote: string;
    squadEmpty: string;
    sectors: { GOL: string; DEF: string; MEI: string; ATA: string };
    sortHint: string;
    form: string;
    formEmpty: string;
    matchesEmpty: string;
    momBadge: string;
    topScorer: string;
    perGame: string;
    matches: string;
    matchTypes: { leagueMatch: string; playoffMatch: string; friendlyMatch: string };
    sourceBadge: string;
    sourceNote: string;
    link: string;
    linking: string;
    linked: string;
    loginToLink: string;
    notFound: string;
    loading: string;
    backToSearch: string;
    /** ---- Painel de divisão (endpoint `settings` + campanha) ---- */
    divisionTitle: string;
    divisionNow: string;
    divisionBest: string;
    pointsToPromote: string;
    pointsToHold: string;
    pointsToTitle: string;
    reputation: string;
    winStreak: string;
    unbeaten: string;
    playoffGames: string;
    promotions: string;
    relegations: string;
    divisionUnknown: string;
    /** As três faixas da régua de divisão — o que cada pontuação significa. */
    divisionZoneDrop: string;
    divisionZoneHold: string;
    divisionZoneUp: string;
    /** ---- Calendário de partidas ---- */
    calendarTitle: string;
    calendarSubtitle: string;
    calendarAll: string;
    detail: string;
    hideDetail: string;
    /** `{club}` vira o nome de quem largou a partida — nunca "o adversário". */
    dnfBy: string;
    todayLabel: string;
    yesterdayLabel: string;
    /** ---- Elenco: temporada × carreira ---- */
    tabSeason: string;
    tabCareer: string;
    careerNote: string;
    /** ---- Ficha do Pro e reivindicação de jogador ---- */
    claimTitle: string;
    claimSubtitle: string;
    claimButton: string;
    claiming: string;
    claimed: string;
    claimLogin: string;
    claimPick: string;
    /** ---- Colunas e rótulos novos ---- */
    colWinRate: string;
    colOverall: string;
    colRed: string;
    colSaves: string;
    minutesLabel: string;
    idleLabel: string;
    /** Explica a cor da coluna de minutos na súmula — sem ela, lê como erro. */
    idleLegend: string;
    matchPlayers: string;
    platformLabel: string;
    /** Elenco vazio porque o acervo só tem a linha de índice deste clube. */
    mirrorShallow: string;
  };
}

const pt: GameCopy = {
  brand: 'Winners 22 Championship',
  brandShort: 'WINNERS 22',
  brandLine2: 'CHAMPIONSHIP',
  tagline: 'A liga e a central de estatísticas do futebol virtual — por FayAI',
  heroTitle: 'O sistema operacional do futebol virtual',
  heroSubtitle:
    'Campeonatos organizados de verdade, estatística verificada com procedência, história de carreira, scouting e mercado de transferências — começando pelo modo Clubs do EA SPORTS FC™. Conecte seu clube em 30 segundos, sem senha e sem instalação.',
  heroCtaSearch: 'Buscar meu clube',
  heroCtaJoin: 'Entrar na liga piloto',
  disclaimer:
    'Winners 22 Championship é um projeto independente da FayAI, não afiliado, endossado ou patrocinado pela Electronic Arts Inc. EA SPORTS FC é marca da Electronic Arts Inc., usada aqui apenas de forma descritiva. Sem apostas com dinheiro real: a fase atual oferece somente palpites gratuitos por pontos.',
  search: {
    title: 'Encontre seu clube agora',
    subtitle:
      'Digite o nome do seu clube no modo Clubs. Os dados vêm da mesma fonte pública que o site oficial usa — elenco, campanha e últimas partidas, jogador por jogador.',
    placeholder: 'Nome do clube no Clubs…',
    button: 'Buscar',
    searching: 'Buscando…',
    empty: 'Nenhum clube encontrado — nem varrendo as duas gerações de console. Veja as dicas abaixo: quase sempre é espaço duplo no nome ou a plataforma errada.',
    open: 'Ver central do clube',
    membersLabel: 'região',
    platformLabel: 'Plataforma',
    platformAll: 'Todas',
    platformGen5: 'PS5 · Series · PC',
    platformGen4: 'PS4 · Xbox One',
    helpTitle: 'Não achou seu clube? Leia isto — o problema quase nunca é você',
    helpItems: [
      'A busca da EA casa só o COMEÇO do nome. "Sul" não acha "Leões do Sul"; "Leões" acha. Comece pela primeira palavra.',
      'O jogo guarda espaços duplos. "Flamengo     00" tem cinco espaços entre as palavras — por isso a busca daqui compara palavra por palavra, ignorando espaço, acento e maiúscula.',
      'PS4 e Xbox One vivem numa piscina separada de PS5, Xbox Series e PC. Deixe "Todas" marcado se não tiver certeza.',
      'Se souber o número do clube, digite só o número: a busca vai direto pela ficha, sem depender do nome.',
      'Clube recém-criado, que ainda não terminou uma temporada, pode não estar no índice público da EA. Nesse caso só o número resolve.',
    ],
    idHint: 'Dica: digitar só números busca pelo ID do clube.',
    scanned: '{n} clubes varridos na fonte da EA',
    approxTitle: 'Nenhum casou exatamente. Os mais próximos que apareceram:',
    divisionShort: 'Div',
    foundBy: {
      id: 'por ID',
      exato: 'nome exato',
      prefixo: 'começa assim',
      contem: 'contém as palavras',
      aproximado: 'aproximado',
    },
  },
  how: {
    title: 'Como funciona',
    steps: [
      {
        title: '1 · Conecte o clube',
        text: 'Busque pelo nome, confirme o clube e pronto: importamos campanha, elenco e histórico direto da fonte pública da EA. Nunca pedimos senha da EA ou da PSN.',
        art: 'passo-conectar',
        alt: 'Mão segurando um celular com a lista do elenco na tela, a partida na TV ao fundo',
      },
      {
        title: '2 · Dispute a liga',
        text: 'Inscreva o clube nos nossos campeonatos: tabela, chaveamento, check-in de capitães e resultado confirmado pelos dois lados — divergência vai para árbitro humano.',
        art: 'passo-disputar',
        alt: 'Dois amigos no sofá comemorando um gol, controle nas mãos',
      },
      {
        title: '3 · Construa sua carreira',
        text: 'Cada jogador ganha uma página de carreira com estatísticas verificadas, forma recente e histórico de clubes — a base do scouting e do mercado de transferências.',
        art: 'passo-carreira',
        alt: 'Jogadora estudando gráficos de desempenho no notebook, controle ao lado',
      },
    ],
  },
  pillars: {
    title: 'O que estamos construindo',
    items: [
      {
        title: 'Campeonatos e ligas',
        text: 'Pontos corridos, grupos, mata-mata, acesso e rebaixamento — administração completa, sem planilha.',
        art: 'pilar-campeonatos',
        alt: 'Troféu dourado sobre a mesa ao lado de um controle',
      },
      {
        title: 'Estatística com procedência',
        text: 'Todo número carrega a nota da fonte (A–E), o horário e a evidência. Dado sem lastro não vira recorde.',
        art: 'pilar-estatistica',
        alt: 'Notebook exibindo uma tabela de linhas com barras de desempenho luminosas',
      },
      {
        title: 'Análise de partida com IA',
        text: 'Leitura tática das suas partidas: padrões de jogo, desempenho individual e evolução ao longo da temporada.',
        art: 'pilar-analise',
        alt: 'Monitor exibindo um campo visto de cima com setas de movimentação',
      },
      {
        title: 'Scouting e transferências',
        text: 'Jogadores se listam, clubes publicam vagas, contratos digitais com consentimento explícito e janelas de transferência.',
        art: 'pilar-scouting',
        alt: 'Camisa dobrada na mesa da cozinha ao lado do notebook com a lista de jogadores',
      },
      {
        title: 'Palpites gratuitos',
        text: 'Bolões por pontos nas partidas monitoradas: placar, artilheiro, craque do jogo. Sem dinheiro real nesta fase.',
        art: 'pilar-palpites',
        alt: 'Grupo de amigos comemorando no sofá com o celular na mão',
      },
      {
        title: 'Integridade',
        text: 'Identidade única por jogador, consenso de resultado, trilha de auditoria pública e monitoramento antifraude.',
        art: 'pilar-integridade',
        alt: 'Polegar confirmando a identidade no leitor biométrico do celular',
      },
    ],
  },
  roadmap: {
    title: 'Calendário da temporada',
    subtitle: 'FC 27 chega em 25 de setembro de 2026, com o Clubs dentro do The Grounds. A plataforma nasce junto.',
    kickoff: { label: 'Pontapé inicial', date: '25 SET', note: 'Lançamento do EA SPORTS FC™ 27' },
    statusLabel: { done: 'Concluído', now: 'Em andamento', next: 'Programado' },
    monthsLabel: '2026 → 2027',
    months: ['AGO', 'SET', 'OUT', 'NOV', 'DEZ', '2027'],
    phases: [
      {
        period: 'Agora',
        title: 'Fundação',
        text: 'Portal no ar, conexão de clube pela fonte pública da EA, fila da liga piloto e pedido formal de parceria à EA.',
        status: 'now',
        from: 0,
        to: 0,
        marks: [{ day: '23 AGO', label: 'Portal no ar' }],
      },
      {
        period: 'Set/2026',
        title: 'Motor de campeonato',
        text: 'Criação de competições, check-in, consenso de resultado, ingestão automática de partidas e ledger de estatísticas.',
        status: 'next',
        from: 1,
        to: 1,
        marks: [{ day: '25 SET', label: 'FC 27 lança' }],
      },
      {
        period: 'Out/2026',
        title: 'Liga piloto no FC 27',
        text: '8–16 clubes convidados, online, sem custo. Dupla evidência (API + captura pós-jogo) e páginas públicas de partida.',
        status: 'next',
        from: 2,
        to: 2,
        marks: [{ day: 'OUT', label: 'Primeira rodada' }],
      },
      {
        period: 'Nov–Dez/2026',
        title: 'Primeira temporada',
        text: '32–64 clubes, divisões e playoffs, janela de transferências, perfis de scouting e recordes.',
        status: 'next',
        from: 3,
        to: 4,
        marks: [{ day: 'DEZ', label: 'Playoffs' }],
      },
      {
        period: '2027',
        title: 'Plataforma licenciada',
        text: 'Parceria de dados com a EA, competições internacionais, feed certificado e — só então, com licença — parceiros regulados de apostas.',
        status: 'next',
        from: 5,
        to: 5,
      },
    ],
  },
  standings: {
    title: 'A tabela que vem aí',
    subtitle:
      'É assim que a classificação da liga piloto vai ficar: pontos corridos, saldo, e a forma das últimas cinco rodadas. Nenhum clube está listado ainda porque nenhuma partida foi disputada — a primeira rodada é em outubro.',
    previewBadge: 'Prévia do formato',
    empty: 'A liga piloto começa em outubro de 2026. Os clubes da fila entram aqui na primeira rodada.',
    slotLabel: 'Vaga {n} — aberta',
    cols: {
      pos: '#',
      club: 'Clube',
      played: 'J',
      won: 'V',
      drawn: 'E',
      lost: 'D',
      gf: 'GP',
      ga: 'GC',
      gd: 'SG',
      points: 'PTS',
      form: 'Forma',
    },
    legend: {
      promotion: 'Zona de acesso',
      playoff: 'Playoff',
      relegation: 'Rebaixamento',
    },
  },
  ranking: {
    title: 'Ranking global do Clubs',
    subtitle:
      'Os melhores clubes do modo Clubs de todos os tempos, lidos ao vivo da fonte pública da EA. Toda célula é número medido — nada aqui é exemplo.',
    badge: 'Dado ao vivo',
    platformLabel: 'Geração',
    platformGen5: 'PS5 · Series · PC',
    platformGen4: 'PS4 · Xbox One',
    cols: {
      rank: '#',
      club: 'Clube',
      division: 'Div',
      played: 'J',
      won: 'V',
      drawn: 'E',
      lost: 'D',
      gf: 'GP',
      ga: 'GC',
      gd: 'SG',
      cleanSheets: 'CS',
      skill: 'Skill',
    },
    loading: 'Lendo o ranking na fonte da EA…',
    error: 'A fonte da EA não respondeu agora. O ranking volta assim que ela voltar.',
    note: 'CS = jogos sem sofrer gol. Skill = pontuação de habilidade do clube, o critério de ordenação da própria EA.',
    more: 'Ver os 100 primeiros',
    less: 'Mostrar menos',
  },
  divisions: {
    title: 'A escada das divisões',
    subtitle:
      'As regras que a EA aplica em cada divisão do modo Clubs: quantos pontos promovem, quantos seguram a divisão e quantos dão o título. Lidas do mesmo endpoint que o jogo consulta.',
    cols: {
      division: 'Divisão',
      promotion: 'Sobe com',
      hold: 'Fica com',
      title: 'Título com',
    },
    note: 'Pontos por temporada de divisão. Abaixo do "fica com", o clube cai.',
  },
  fonte: {
    live: 'Ao vivo da fonte da EA',
    mirror: 'Do nosso acervo · {quando}',
    mirrorWhy:
      'A EA recusa leitura vinda de servidor (só IP residencial passa), então quem lê a fonte é uma máquina nossa, que grava aqui. O número é o que a EA publicava na hora da leitura.',
    empty: 'Este clube ainda não está no nosso acervo. Use a busca por nome para trazê-lo.',
    justNow: 'agora há pouco',
    minutes: 'há {n} min',
    hours: 'há {n} h',
    days: 'há {n} d',
  },
  showcase: {
    title: 'Winners 22 — o futebol virtual',
    highlight: 'com estatística de verdade',
    badge: 'Novo',
    body:
      'Conecte seu clube do modo Clubs do EA SPORTS FC™ em 30 segundos — sem senha, sem instalação — e veja elenco, campanha e partidas com nota por jogador. A liga piloto abre em outubro.',
    cta: 'Buscar meu clube',
    stats: [
      { value: '30s', label: 'para conectar' },
      { value: '0', label: 'senha pedida' },
      { value: 'OUT', label: 'liga piloto' },
    ],
    deliversTitle: 'Na central do seu clube',
    delivers: [
      'Elenco com nota média por jogador',
      'Campanha: vitórias, saldo e aproveitamento',
      'Últimas partidas com artilheiro e craque',
      'Forma das últimas seis rodadas',
    ],
  },
  join: {
    title: 'Liga piloto — outubro de 2026',
    subtitle:
      '8 a 16 clubes convidados para a primeira competição verificada. Sem taxa. Capitães têm prioridade; jogadores sem clube entram no radar do scouting.',
    email: 'Seu e-mail',
    role: 'Você é…',
    roles: [
      { value: 'captain', label: 'Capitão de clube' },
      { value: 'player', label: 'Jogador' },
      { value: 'organizer', label: 'Organizador' },
      { value: 'fan', label: 'Torcedor / curioso' },
    ],
    clubName: 'Nome do clube (como está no jogo)',
    gamertag: 'PSN ID / Gamertag / EA ID',
    message: 'Algo mais? (opcional)',
    submit: 'Entrar na fila do piloto',
    sending: 'Enviando…',
    success: 'Inscrição recebida! Vamos te chamar quando a liga piloto abrir.',
    error: 'Não deu para enviar. Confira o e-mail e tente de novo.',
  },
  club: {
    record: 'Campanha',
    wins: 'V',
    draws: 'E',
    losses: 'D',
    goals: 'Gols pró',
    goalsAgainst: 'Gols contra',
    skillRating: 'Skill Rating',
    squad: 'Elenco e estatísticas da temporada',
    squadCols: {
      player: 'Jogador',
      pos: 'Pos',
      games: 'J',
      goals: 'G',
      assists: 'A',
      rating: 'Nota',
      motm: 'Craque',
      passes: 'Passe %',
      shots: 'Fin. %',
      tackles: 'Desarme %',
      contribution: 'G+A',
    },
    squadNote: 'Clique no cabeçalho para reordenar. Barras comparam cada jogador com o melhor do elenco.',
    squadEmpty: 'A EA não devolveu elenco para este clube.',
    sectors: { GOL: 'Goleiro', DEF: 'Defesa', MEI: 'Meio', ATA: 'Ataque' },
    sortHint: 'Ordenar por',
    form: 'Forma',
    formEmpty: 'Sem partidas registradas nesta modalidade.',
    matchesEmpty: 'Nenhuma partida deste tipo nos registros públicos da EA.',
    momBadge: 'Craque do jogo',
    topScorer: 'Artilheiro',
    perGame: 'por jogo',
    matches: 'Últimas partidas',
    matchTypes: { leagueMatch: 'Liga', playoffMatch: 'Playoff', friendlyMatch: 'Amistoso' },
    sourceBadge: 'Fonte: API pública da EA · grau B',
    sourceNote:
      'Dados lidos ao vivo da fonte pública do modo Clubs. A estatística das competições do Winners 22 terá verificação adicional por consenso de capitães.',
    link: 'Este clube é meu — vincular à minha conta',
    linking: 'Vinculando…',
    linked: 'Clube vinculado à sua conta ✓',
    loginToLink: 'Entre na sua conta FayAI para vincular o clube',
    notFound: 'Clube não encontrado — a fonte da EA pode estar fora do ar. Tente de novo em instantes.',
    loading: 'Lendo dados do clube…',
    backToSearch: '← Voltar para a busca',
    divisionTitle: 'Divisão e temporada',
    divisionNow: 'Divisão atual',
    divisionBest: 'Melhor divisão',
    pointsToPromote: 'Sobe com',
    pointsToHold: 'Fica com',
    pointsToTitle: 'Título com',
    reputation: 'Reputação',
    winStreak: 'Sequência de vitórias',
    unbeaten: 'Invencibilidade',
    playoffGames: 'Jogos de playoff',
    promotions: 'Acessos',
    relegations: 'Quedas',
    divisionUnknown: 'A EA não publica a divisão atual neste endpoint — só a melhor já alcançada.',
    divisionZoneDrop: 'Cai',
    divisionZoneHold: 'Permanece',
    divisionZoneUp: 'Sobe',
    calendarTitle: 'Calendário de partidas',
    calendarSubtitle:
      'Liga, playoff e amistoso numa linha do tempo só, do jogo mais recente para trás. Abra qualquer partida para ver a súmula: quem marcou, quem deu assistência, nota, defesas e cartões — jogador por jogador, dos dois lados.',
    calendarAll: 'Todas',
    detail: 'Ver súmula',
    hideDetail: 'Fechar súmula',
    dnfBy: '{club} abandonou',
    todayLabel: 'Hoje',
    yesterdayLabel: 'Ontem',
    tabSeason: 'Temporada',
    tabCareer: 'Carreira',
    careerNote: 'Carreira soma todas as temporadas do jogador neste clube.',
    claimTitle: 'Qual desses é você?',
    claimSubtitle:
      'Escolha seu Pro no elenco para ligar a gamertag à sua conta FayAI. É assim que sua estatística individual passa a te seguir — sem senha da EA, sem instalação.',
    claimButton: 'Sou eu',
    claiming: 'Ligando…',
    claimed: 'Jogador ligado à sua conta',
    claimLogin: 'Entre na sua conta FayAI para reivindicar seu jogador',
    claimPick: 'Selecione um jogador do elenco',
    colWinRate: 'Vit %',
    colOverall: 'OVR',
    colRed: 'CV',
    colSaves: 'Def',
    minutesLabel: 'min',
    idleLabel: 'parado',
    idleLegend:
      'Minutos em vermelho: a EA registrou o jogador parado em mais de um terço do tempo em campo. Passe o cursor para ver quanto.',
    matchPlayers: 'Súmula da partida',
    platformLabel: 'Plataforma',
    mirrorShallow:
      'Este clube está no nosso acervo só pela ficha — identidade, divisão e campanha. Elenco e partidas entram na próxima coleta.',
  },
};

const en: GameCopy = {
  brand: 'Winners 22 Championship',
  brandShort: 'WINNERS 22',
  brandLine2: 'CHAMPIONSHIP',
  tagline: 'The virtual football league & stats hub — by FayAI',
  heroTitle: 'The operating system of virtual football',
  heroSubtitle:
    'Properly organized championships, verified statistics with provenance, career history, scouting and a transfer market — starting with EA SPORTS FC™ Clubs. Connect your club in 30 seconds, no password, no install.',
  heroCtaSearch: 'Find my club',
  heroCtaJoin: 'Join the pilot league',
  disclaimer:
    'Winners 22 Championship is an independent FayAI project, not affiliated with, endorsed or sponsored by Electronic Arts Inc. EA SPORTS FC is a trademark of Electronic Arts Inc., used here descriptively only. No real-money betting: the current phase offers free, points-based predictions only.',
  search: {
    title: 'Find your club now',
    subtitle:
      'Type your Clubs team name. Data comes from the same public source the official site uses — squad, record and recent matches, player by player.',
    placeholder: 'Your Clubs team name…',
    button: 'Search',
    searching: 'Searching…',
    empty: 'No club found — not even sweeping both console generations. Read the tips below: it is almost always a double space in the name or the wrong platform.',
    open: 'Open club hub',
    membersLabel: 'region',
    platformLabel: 'Platform',
    platformAll: 'All',
    platformGen5: 'PS5 · Series · PC',
    platformGen4: 'PS4 · Xbox One',
    helpTitle: "Can't find your club? Read this — it is almost never your fault",
    helpItems: [
      'EA only matches the START of the name. "Sul" will not find "Leões do Sul"; "Leões" will. Start with the first word.',
      'The game stores double spaces. "Flamengo     00" has five spaces between the words — which is why this search compares word by word, ignoring spacing, accents and case.',
      'PS4 and Xbox One live in a pool separate from PS5, Xbox Series and PC. Leave "All" selected if you are unsure.',
      'If you know the club number, type only the number: the search goes straight to the record, no name involved.',
      "A brand-new club that hasn't finished a season yet may be missing from EA's public index. Only the number finds it then.",
    ],
    idHint: 'Tip: typing digits only searches by club ID.',
    scanned: '{n} clubs swept in the EA source',
    approxTitle: 'None matched exactly. The closest ones that came up:',
    divisionShort: 'Div',
    foundBy: {
      id: 'by ID',
      exato: 'exact name',
      prefixo: 'starts with',
      contem: 'contains the words',
      aproximado: 'approximate',
    },
  },
  how: {
    title: 'How it works',
    steps: [
      {
        title: '1 · Connect your club',
        text: "Search by name, confirm your club, done: we import record, squad and history straight from EA's public source. We never ask for EA or PSN passwords.",
        art: 'passo-conectar',
        alt: 'A hand holding a phone showing the squad list, the match on the TV behind',
      },
      {
        title: '2 · Compete',
        text: 'Enter our championships: tables, brackets, captain check-in and results confirmed by both sides — disputes go to a human referee.',
        art: 'passo-disputar',
        alt: 'Two friends on a couch celebrating a goal, controllers in hand',
      },
      {
        title: '3 · Build your career',
        text: 'Every player gets a career page with verified stats, current form and club history — the foundation of scouting and the transfer market.',
        art: 'passo-carreira',
        alt: 'A player studying performance charts on a laptop, controller beside her',
      },
    ],
  },
  pillars: {
    title: 'What we are building',
    items: [
      { title: 'Championships & leagues', text: 'Round-robin, groups, knockouts, promotion and relegation — full administration, no spreadsheets.', art: 'pilar-campeonatos', alt: 'A golden trophy on a desk beside a game controller' },
      { title: 'Stats with provenance', text: 'Every number carries a source grade (A–E), timestamp and evidence. Unverified data never becomes a record.', art: 'pilar-estatistica', alt: 'A laptop showing a table of rows with glowing performance bars' },
      { title: 'AI match analysis', text: 'Tactical reading of your matches: play patterns, individual performance and season-long development.', art: 'pilar-analise', alt: 'A monitor showing a top-down pitch with movement arrows' },
      { title: 'Scouting & transfers', text: 'Players list themselves, clubs publish openings, digital contracts with explicit consent and transfer windows.', art: 'pilar-scouting', alt: 'A folded shirt on a kitchen table beside a laptop showing a player list' },
      { title: 'Free predictions', text: 'Points-based prediction games on monitored matches: score, top scorer, man of the match. No real money in this phase.', art: 'pilar-palpites', alt: 'A group of friends celebrating on the couch, phones in hand' },
      { title: 'Integrity', text: 'One identity per player, result consensus, public audit trail and anti-fraud monitoring.', art: 'pilar-integridade', alt: 'A thumb confirming identity on a phone fingerprint reader' },
    ],
  },
  roadmap: {
    title: 'Season calendar',
    subtitle: 'FC 27 launches September 25, 2026, with Clubs inside The Grounds. The platform launches with it.',
    kickoff: { label: 'Kick-off', date: 'SEP 25', note: 'EA SPORTS FC™ 27 launch' },
    statusLabel: { done: 'Done', now: 'In progress', next: 'Scheduled' },
    monthsLabel: '2026 → 2027',
    months: ['AUG', 'SEP', 'OCT', 'NOV', 'DEC', '2027'],
    phases: [
      { period: 'Now', title: 'Foundation', text: "Portal live, club connection via EA's public source, pilot-league queue and formal partnership request to EA.", status: 'now', from: 0, to: 0, marks: [{ day: 'AUG 23', label: 'Portal live' }] },
      { period: 'Sep 2026', title: 'Championship engine', text: 'Competition creation, check-in, result consensus, automatic match ingestion and the statistics ledger.', status: 'next', from: 1, to: 1, marks: [{ day: 'SEP 25', label: 'FC 27 launch' }] },
      { period: 'Oct 2026', title: 'Pilot league on FC 27', text: '8–16 invited clubs, online, free. Dual evidence (API + post-match capture) and public match pages.', status: 'next', from: 2, to: 2, marks: [{ day: 'OCT', label: 'Matchday 1' }] },
      { period: 'Nov–Dec 2026', title: 'First season', text: '32–64 clubs, divisions and playoffs, a transfer window, scouting profiles and records.', status: 'next', from: 3, to: 4, marks: [{ day: 'DEC', label: 'Playoffs' }] },
      { period: '2027', title: 'Licensed platform', text: 'EA data partnership, international competitions, certified feed and — only then, licensed — regulated betting partners.', status: 'next', from: 5, to: 5 },
    ],
  },
  standings: {
    title: 'The table ahead',
    subtitle:
      "This is how the pilot-league table will look: points, goal difference and the last five results. No club is listed yet because no match has been played — matchday one is in October.",
    previewBadge: 'Format preview',
    empty: 'The pilot league starts in October 2026. Clubs in the queue appear here on matchday one.',
    slotLabel: 'Slot {n} — open',
    cols: { pos: '#', club: 'Club', played: 'P', won: 'W', drawn: 'D', lost: 'L', gf: 'GF', ga: 'GA', gd: 'GD', points: 'PTS', form: 'Form' },
    legend: { promotion: 'Promotion', playoff: 'Playoff', relegation: 'Relegation' },
  },
  ranking: {
    title: 'Global Clubs ranking',
    subtitle:
      "The best Clubs sides of all time, read live from EA's public source. Every cell is a measured number — nothing here is a sample.",
    badge: 'Live data',
    platformLabel: 'Generation',
    platformGen5: 'PS5 · Series · PC',
    platformGen4: 'PS4 · Xbox One',
    cols: {
      rank: '#',
      club: 'Club',
      division: 'Div',
      played: 'P',
      won: 'W',
      drawn: 'D',
      lost: 'L',
      gf: 'GF',
      ga: 'GA',
      gd: 'GD',
      cleanSheets: 'CS',
      skill: 'Skill',
    },
    loading: "Reading the ranking from EA's source…",
    error: "EA's source did not answer just now. The ranking returns when it does.",
    note: "CS = clean sheets. Skill = the club's skill rating, EA's own sorting criterion.",
    more: 'Show the top 100',
    less: 'Show less',
  },
  divisions: {
    title: 'The division ladder',
    subtitle:
      'The rules EA applies to every Clubs division: how many points promote you, how many hold your division and how many win the title. Read from the same endpoint the game queries.',
    cols: {
      division: 'Division',
      promotion: 'Promoted at',
      hold: 'Safe at',
      title: 'Title at',
    },
    note: 'Points per divisional season. Below the "safe at" mark, the club goes down.',
  },
  fonte: {
    live: "Live from EA's source",
    mirror: 'From our archive · {quando}',
    mirrorWhy:
      "EA refuses reads coming from a server (only residential IPs get through), so a machine of ours reads the source and writes it here. The numbers are what EA published at read time.",
    empty: 'This club is not in our archive yet. Use the name search to bring it in.',
    justNow: 'just now',
    minutes: '{n} min ago',
    hours: '{n} h ago',
    days: '{n} d ago',
  },
  showcase: {
    title: 'Winners 22 — virtual football',
    highlight: 'with real statistics',
    badge: 'New',
    body:
      'Connect your EA SPORTS FC™ Clubs team in 30 seconds — no password, no install — and see squad, record and matches with a rating per player. The pilot league opens in October.',
    cta: 'Find my club',
    stats: [
      { value: '30s', label: 'to connect' },
      { value: '0', label: 'passwords asked' },
      { value: 'OCT', label: 'pilot league' },
    ],
    deliversTitle: 'In your club hub',
    delivers: [
      'Squad with an average rating per player',
      'Record: wins, goal difference and points won',
      'Recent matches with scorer and man of the match',
      'Form across the last six rounds',
    ],
  },
  join: {
    title: 'Pilot league — October 2026',
    subtitle:
      '8 to 16 clubs invited to the first verified competition. Free entry. Captains get priority; clubless players join the scouting radar.',
    email: 'Your email',
    role: 'You are…',
    roles: [
      { value: 'captain', label: 'Club captain' },
      { value: 'player', label: 'Player' },
      { value: 'organizer', label: 'Organizer' },
      { value: 'fan', label: 'Supporter / curious' },
    ],
    clubName: 'Club name (as in the game)',
    gamertag: 'PSN ID / Gamertag / EA ID',
    message: 'Anything else? (optional)',
    submit: 'Join the pilot queue',
    sending: 'Sending…',
    success: "You're in! We'll reach out when the pilot league opens.",
    error: "Couldn't send. Check the email and try again.",
  },
  club: {
    record: 'Record',
    wins: 'W',
    draws: 'D',
    losses: 'L',
    goals: 'Goals for',
    goalsAgainst: 'Goals against',
    skillRating: 'Skill Rating',
    squad: 'Squad & season stats',
    squadCols: { player: 'Player', pos: 'Pos', games: 'GP', goals: 'G', assists: 'A', rating: 'Rating', motm: 'MOTM', passes: 'Pass %', shots: 'Shot %', tackles: 'Tackle %', contribution: 'G+A' },
    squadNote: 'Click a header to re-sort. Bars compare each player against the best in the squad.',
    squadEmpty: 'EA returned no squad for this club.',
    sectors: { GOL: 'Goalkeeper', DEF: 'Defence', MEI: 'Midfield', ATA: 'Attack' },
    sortHint: 'Sort by',
    form: 'Form',
    formEmpty: 'No matches recorded in this mode.',
    matchesEmpty: "No matches of this type in EA's public records.",
    momBadge: 'Man of the match',
    topScorer: 'Top scorer',
    perGame: 'per game',
    matches: 'Recent matches',
    matchTypes: { leagueMatch: 'League', playoffMatch: 'Playoff', friendlyMatch: 'Friendly' },
    sourceBadge: 'Source: EA public API · grade B',
    sourceNote:
      "Data read live from the Clubs public source. Winners 22 competition statistics get additional verification via captain consensus.",
    link: 'This is my club — link to my account',
    linking: 'Linking…',
    linked: 'Club linked to your account ✓',
    loginToLink: 'Sign in to your FayAI account to link this club',
    notFound: "Club not found — EA's source may be down. Try again shortly.",
    loading: 'Reading club data…',
    backToSearch: '← Back to search',
    divisionTitle: 'Division & season',
    divisionNow: 'Current division',
    divisionBest: 'Best division',
    pointsToPromote: 'Promoted at',
    pointsToHold: 'Safe at',
    pointsToTitle: 'Title at',
    reputation: 'Reputation',
    winStreak: 'Win streak',
    unbeaten: 'Unbeaten run',
    playoffGames: 'Playoff games',
    promotions: 'Promotions',
    relegations: 'Relegations',
    divisionUnknown: 'EA does not publish the current division on this endpoint — only the best ever reached.',
    divisionZoneDrop: 'Relegated',
    divisionZoneHold: 'Safe',
    divisionZoneUp: 'Promoted',
    calendarTitle: 'Match calendar',
    calendarSubtitle:
      'League, playoff and friendly on a single timeline, newest first. Open any match for the full sheet: scorers, assists, rating, saves and cards — player by player, both sides.',
    calendarAll: 'All',
    detail: 'Open match sheet',
    hideDetail: 'Close match sheet',
    dnfBy: '{club} quit',
    todayLabel: 'Today',
    yesterdayLabel: 'Yesterday',
    tabSeason: 'Season',
    tabCareer: 'Career',
    careerNote: 'Career totals every season the player has had at this club.',
    claimTitle: 'Which one is you?',
    claimSubtitle:
      'Pick your Pro from the squad to tie the gamertag to your FayAI account. That is how your individual stats start following you — no EA password, no install.',
    claimButton: "That's me",
    claiming: 'Linking…',
    claimed: 'Player linked to your account',
    claimLogin: 'Sign in to your FayAI account to claim your player',
    claimPick: 'Select a player from the squad',
    colWinRate: 'Win %',
    colOverall: 'OVR',
    colRed: 'RC',
    colSaves: 'Saves',
    minutesLabel: 'min',
    idleLabel: 'idle',
    idleLegend:
      'Minutes in red: EA recorded the player idle for more than a third of their time on the pitch. Hover to see how much.',
    matchPlayers: 'Match sheet',
    platformLabel: 'Platform',
    mirrorShallow:
      'This club is in our archive by record only — identity, division and campaign. Squad and matches arrive on the next collection run.',
  },
};

export function getGameCopy(locale: string): GameCopy {
  return locale === 'en' ? en : pt;
}
