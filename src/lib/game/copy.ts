/**
 * Todo o texto da seção /game, pt-BR e en, num módulo só.
 *
 * De propósito FORA do dicionário de 7.7k chaves: rota nova no dicionário
 * exige fatia, tradução e o risco silencioso da chave que falta (frase em
 * português numa página inglesa, sem erro). Aqui o copy viaja com a rota,
 * tipado — quando a seção estabilizar, migra-se para o dicionário se valer.
 *
 * "ONZE" é nome de trabalho (PLANO_GAME_2026-08-23.md §2). Trocar o nome é
 * trocar `brand` aqui.
 */

export interface GameCopy {
  brand: string;
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
  };
  how: {
    title: string;
    steps: Array<{ title: string; text: string }>;
  };
  pillars: {
    title: string;
    items: Array<{ title: string; text: string }>;
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
  };
}

const pt: GameCopy = {
  brand: 'ONZE',
  tagline: 'A liga e a central de estatísticas do futebol virtual — por FayAI',
  heroTitle: 'O sistema operacional do futebol virtual',
  heroSubtitle:
    'Campeonatos organizados de verdade, estatística verificada com procedência, história de carreira, scouting e mercado de transferências — começando pelo modo Clubs do EA SPORTS FC™. Conecte seu clube em 30 segundos, sem senha e sem instalação.',
  heroCtaSearch: 'Buscar meu clube',
  heroCtaJoin: 'Entrar na liga piloto',
  disclaimer:
    'ONZE é um projeto independente da FayAI, não afiliado, endossado ou patrocinado pela Electronic Arts Inc. EA SPORTS FC é marca da Electronic Arts Inc., usada aqui apenas de forma descritiva. Sem apostas com dinheiro real: a fase atual oferece somente palpites gratuitos por pontos.',
  search: {
    title: 'Encontre seu clube agora',
    subtitle:
      'Digite o nome do seu clube no modo Clubs. Os dados vêm da mesma fonte pública que o site oficial usa — elenco, campanha e últimas partidas, jogador por jogador.',
    placeholder: 'Nome do clube no Clubs…',
    button: 'Buscar',
    searching: 'Buscando…',
    empty: 'Nenhum clube com esse nome. Confira a grafia exata usada no jogo.',
    open: 'Ver central do clube',
    membersLabel: 'região',
  },
  how: {
    title: 'Como funciona',
    steps: [
      {
        title: '1 · Conecte o clube',
        text: 'Busque pelo nome, confirme o clube e pronto: importamos campanha, elenco e histórico direto da fonte pública da EA. Nunca pedimos senha da EA ou da PSN.',
      },
      {
        title: '2 · Dispute a liga',
        text: 'Inscreva o clube nos nossos campeonatos: tabela, chaveamento, check-in de capitães e resultado confirmado pelos dois lados — divergência vai para árbitro humano.',
      },
      {
        title: '3 · Construa sua carreira',
        text: 'Cada jogador ganha uma página de carreira com estatísticas verificadas, forma recente e histórico de clubes — a base do scouting e do mercado de transferências.',
      },
    ],
  },
  pillars: {
    title: 'O que estamos construindo',
    items: [
      {
        title: 'Campeonatos e ligas',
        text: 'Pontos corridos, grupos, mata-mata, acesso e rebaixamento — administração completa, sem planilha.',
      },
      {
        title: 'Estatística com procedência',
        text: 'Todo número carrega a nota da fonte (A–E), o horário e a evidência. Dado sem lastro não vira recorde.',
      },
      {
        title: 'Análise de partida com IA',
        text: 'Leitura tática das suas partidas: padrões de jogo, desempenho individual e evolução ao longo da temporada.',
      },
      {
        title: 'Scouting e transferências',
        text: 'Jogadores se listam, clubes publicam vagas, contratos digitais com consentimento explícito e janelas de transferência.',
      },
      {
        title: 'Palpites gratuitos',
        text: 'Bolões por pontos nas partidas monitoradas: placar, artilheiro, craque do jogo. Sem dinheiro real nesta fase.',
      },
      {
        title: 'Integridade',
        text: 'Identidade única por jogador, consenso de resultado, trilha de auditoria pública e monitoramento antifraude.',
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
  showcase: {
    title: 'ONZE — o futebol virtual',
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
      'Dados lidos ao vivo da fonte pública do modo Clubs. Estatística de competição ONZE terá verificação adicional por consenso de capitães.',
    link: 'Este clube é meu — vincular à minha conta',
    linking: 'Vinculando…',
    linked: 'Clube vinculado à sua conta ✓',
    loginToLink: 'Entre na sua conta FayAI para vincular o clube',
    notFound: 'Clube não encontrado — a fonte da EA pode estar fora do ar. Tente de novo em instantes.',
    loading: 'Lendo dados do clube…',
    backToSearch: '← Voltar para a busca',
  },
};

const en: GameCopy = {
  brand: 'ONZE',
  tagline: 'The virtual football league & stats hub — by FayAI',
  heroTitle: 'The operating system of virtual football',
  heroSubtitle:
    'Properly organized championships, verified statistics with provenance, career history, scouting and a transfer market — starting with EA SPORTS FC™ Clubs. Connect your club in 30 seconds, no password, no install.',
  heroCtaSearch: 'Find my club',
  heroCtaJoin: 'Join the pilot league',
  disclaimer:
    'ONZE is an independent FayAI project, not affiliated with, endorsed or sponsored by Electronic Arts Inc. EA SPORTS FC is a trademark of Electronic Arts Inc., used here descriptively only. No real-money betting: the current phase offers free, points-based predictions only.',
  search: {
    title: 'Find your club now',
    subtitle:
      'Type your Clubs team name. Data comes from the same public source the official site uses — squad, record and recent matches, player by player.',
    placeholder: 'Your Clubs team name…',
    button: 'Search',
    searching: 'Searching…',
    empty: 'No club with that name. Check the exact in-game spelling.',
    open: 'Open club hub',
    membersLabel: 'region',
  },
  how: {
    title: 'How it works',
    steps: [
      {
        title: '1 · Connect your club',
        text: "Search by name, confirm your club, done: we import record, squad and history straight from EA's public source. We never ask for EA or PSN passwords.",
      },
      {
        title: '2 · Compete',
        text: 'Enter our championships: tables, brackets, captain check-in and results confirmed by both sides — disputes go to a human referee.',
      },
      {
        title: '3 · Build your career',
        text: 'Every player gets a career page with verified stats, current form and club history — the foundation of scouting and the transfer market.',
      },
    ],
  },
  pillars: {
    title: 'What we are building',
    items: [
      { title: 'Championships & leagues', text: 'Round-robin, groups, knockouts, promotion and relegation — full administration, no spreadsheets.' },
      { title: 'Stats with provenance', text: 'Every number carries a source grade (A–E), timestamp and evidence. Unverified data never becomes a record.' },
      { title: 'AI match analysis', text: 'Tactical reading of your matches: play patterns, individual performance and season-long development.' },
      { title: 'Scouting & transfers', text: 'Players list themselves, clubs publish openings, digital contracts with explicit consent and transfer windows.' },
      { title: 'Free predictions', text: 'Points-based prediction games on monitored matches: score, top scorer, man of the match. No real money in this phase.' },
      { title: 'Integrity', text: 'One identity per player, result consensus, public audit trail and anti-fraud monitoring.' },
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
  showcase: {
    title: 'ONZE — virtual football',
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
      "Data read live from the Clubs public source. ONZE competition statistics get additional verification via captain consensus.",
    link: 'This is my club — link to my account',
    linking: 'Linking…',
    linked: 'Club linked to your account ✓',
    loginToLink: 'Sign in to your FayAI account to link this club',
    notFound: "Club not found — EA's source may be down. Try again shortly.",
    loading: 'Reading club data…',
    backToSearch: '← Back to search',
  },
};

export function getGameCopy(locale: string): GameCopy {
  return locale === 'en' ? en : pt;
}
