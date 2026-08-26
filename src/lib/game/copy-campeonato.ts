/**
 * O texto da área de CAMPEONATOS, pt-BR e en.
 *
 * Em módulo próprio, e não dentro de `copy.ts`: aquele arquivo já passa de 900
 * linhas cobrindo a landing e a central do clube, e campeonato é uma área
 * inteira com vida própria — criação, tabela, chaveamento, súmula, pôster.
 * Misturar os dois faria toda edição de um texto de tabela rolar por cima do
 * texto do herói.
 *
 * Mesma decisão de `copy.ts` e pelo mesmo motivo: fora do dicionário de 7.7k
 * chaves, porque chave que falta no dicionário não dá erro — dá frase em
 * português numa página inglesa, calada.
 */

export interface CopyCampeonato {
  hub: {
    title: string;
    subtitle: string;
    empty: string;
    create: string;
    creating: string;
    loginToCreate: string;
    mine: string;
    slots: string;
    joined: string;
    open: string;
    loading: string;
    error: string;
  };
  /** Os presets. A chave casa com `PresetCompeticao.id` do motor. */
  presets: Record<string, { nome: string; texto: string }>;
  novo: {
    title: string;
    subtitle: string;
    pickPreset: string;
    name: string;
    namePlaceholder: string;
    description: string;
    descriptionPlaceholder: string;
    platform: string;
    slots: string;
    turns: string;
    turnsSingle: string;
    turnsDouble: string;
    submit: string;
    cancel: string;
    customize: string;
    format: string;
    formats: Record<string, string>;
  };
  status: Record<string, string>;
  fases: Record<string, string>;
  painel: {
    organizer: string;
    teams: string;
    teamsEmpty: string;
    addTeam: string;
    addByEa: string;
    addByHand: string;
    eaIdOrName: string;
    teamName: string;
    teamShort: string;
    squad: string;
    squadPlaceholder: string;
    squadHelp: string;
    save: string;
    saving: string;
    remove: string;
    generate: string;
    generating: string;
    regenerate: string;
    generateHelp: string;
    dropTable: string;
    standings: string;
    standingsEmpty: string;
    calendar: string;
    calendarEmpty: string;
    bracket: string;
    scorers: string;
    scorersEmpty: string;
    round: string;
    setScore: string;
    scoreSaved: string;
    scoreHelp: string;
    awaiting: string;
    bye: string;
    champion: string;
    runnerUp: string;
    poster: string;
    posterHelp: string;
    declared: string;
    measured: string;
    declaredWhy: string;
    cols: {
      pos: string;
      team: string;
      played: string;
      won: string;
      drawn: string;
      lost: string;
      gf: string;
      ga: string;
      gd: string;
      points: string;
      form: string;
      pct: string;
      player: string;
      goals: string;
      assists: string;
      contrib: string;
      rating: string;
    };
    zones: { promotion: string; relegation: string };
  };
  carta: {
    positions: Record<string, string>;
    tiers: Record<string, string>;
  };
}

const pt: CopyCampeonato = {
  hub: {
    title: 'Campeonatos',
    subtitle:
      'Monte uma liga ou uma copa em menos de um minuto: escolha o formato, inscreva os times e a tabela sai pronta — com classificação, calendário, chaveamento e artilharia calculados sozinhos.',
    empty: 'Nenhum campeonato público ainda. Crie o primeiro.',
    create: 'Criar campeonato',
    creating: 'Criando…',
    loginToCreate: 'Entre na sua conta FayAI para criar um campeonato',
    mine: 'Meu',
    slots: 'vagas',
    joined: 'inscritos',
    open: 'Abrir',
    loading: 'Carregando campeonatos…',
    error: 'Não deu para carregar os campeonatos agora.',
  },
  presets: {
    'liga-8': {
      nome: 'Liga de 8',
      texto: 'Pontos corridos, turno único. Todos contra todos em 7 rodadas — o formato da roda de amigos.',
    },
    'liga-10-ida-volta': {
      nome: 'Liga de 10, ida e volta',
      texto: 'Dezoito rodadas, mando alternado. O formato de temporada longa, com acesso e rebaixamento.',
    },
    'copa-16': {
      nome: 'Copa de 16',
      texto: 'Mata-mata direto, jogo único. Quatro fases das oitavas à final — acaba numa noite.',
    },
    'mundial-16': {
      nome: 'Mundial de 16',
      texto: 'Quatro grupos de quatro, dois passam de cada. Fase de grupos e depois o mata-mata.',
    },
    'relampago-4': {
      nome: 'Relâmpago de 4',
      texto: 'Quatro times, todos contra todos, três rodadas. Para decidir na hora quem é o melhor.',
    },
  },
  novo: {
    title: 'Novo campeonato',
    subtitle: 'Escolha um formato pronto. Tudo dá para ajustar depois.',
    pickPreset: 'Escolha o formato',
    name: 'Nome do campeonato',
    namePlaceholder: 'Copa dos Amigos, Liga da Quebrada…',
    description: 'Descrição (opcional)',
    descriptionPlaceholder: 'Quem pode entrar, quando joga, prêmio…',
    platform: 'Plataforma',
    slots: 'Vagas',
    turns: 'Turnos',
    turnsSingle: 'Turno único',
    turnsDouble: 'Ida e volta',
    submit: 'Criar campeonato',
    cancel: 'Cancelar',
    customize: 'Ajustar detalhes',
    format: 'Formato',
    formats: {
      'pontos-corridos': 'Pontos corridos',
      'mata-mata': 'Mata-mata',
      'grupos-mata-mata': 'Grupos + mata-mata',
    },
  },
  status: {
    rascunho: 'Rascunho',
    inscricoes: 'Inscrições abertas',
    'em-andamento': 'Em andamento',
    encerrada: 'Encerrado',
  },
  fases: {
    liga: 'Liga',
    grupo: 'Fase de grupos',
    'trigesima-segunda': '32 avos',
    'decima-sexta': '16 avos',
    oitavas: 'Oitavas',
    quartas: 'Quartas',
    semi: 'Semifinal',
    terceiro: 'Disputa do 3º',
    final: 'Final',
  },
  painel: {
    organizer: 'Você organiza este campeonato',
    teams: 'Times',
    teamsEmpty: 'Nenhum time inscrito ainda.',
    addTeam: 'Inscrever time',
    addByEa: 'Pelo clube da EA',
    addByHand: 'Cadastrar na mão',
    eaIdOrName: 'ID do clube no Clubs',
    teamName: 'Nome do time',
    teamShort: 'Sigla (3 letras)',
    squad: 'Elenco',
    squadPlaceholder: 'Uma gamertag por linha',
    squadHelp:
      'Uma gamertag por linha. O elenco é uma fotografia: quem sair do time depois continua aparecendo nas súmulas dos jogos que disputou.',
    save: 'Inscrever',
    saving: 'Inscrevendo…',
    remove: 'Remover',
    generate: 'Gerar tabela',
    generating: 'Gerando…',
    regenerate: 'Gerar de novo',
    generateHelp:
      'A tabela sai pronta com todas as rodadas. Depois de gerada, os times ficam travados — para mexer, apague a tabela.',
    dropTable: 'Apagar tabela',
    standings: 'Classificação',
    standingsEmpty: 'A classificação aparece quando o primeiro resultado for registrado.',
    calendar: 'Calendário',
    calendarEmpty: 'Gere a tabela para o calendário aparecer.',
    bracket: 'Chaveamento',
    scorers: 'Artilharia',
    scorersEmpty: 'Registre os gols na súmula de cada jogo para a artilharia encher.',
    round: 'Rodada',
    setScore: 'Registrar placar',
    scoreSaved: 'Placar registrado',
    scoreHelp: 'Coloque o placar e, se quiser, quem marcou. É isso que enche a artilharia e o pôster.',
    awaiting: 'Aguarda classificado',
    bye: 'Passou direto',
    champion: 'Campeão',
    runnerUp: 'Vice',
    poster: 'Pôster do campeão',
    posterHelp: 'Imagem pronta para postar, com o elenco campeão e os destaques.',
    declared: 'Declarado',
    measured: 'Medido na EA',
    declaredWhy:
      'Placar digitado pelo organizador. Quando a partida for casada com a que a EA publica, ele passa a ser observação e não declaração.',
    cols: {
      pos: '#',
      team: 'Time',
      played: 'J',
      won: 'V',
      drawn: 'E',
      lost: 'D',
      gf: 'GP',
      ga: 'GC',
      gd: 'SG',
      points: 'PTS',
      form: 'Forma',
      pct: '%',
      player: 'Jogador',
      goals: 'G',
      assists: 'A',
      contrib: 'G+A',
      rating: 'Nota',
    },
    zones: { promotion: 'Classificação', relegation: 'Rebaixamento' },
  },
  carta: {
    positions: {
      goalkeeper: 'GOL',
      defender: 'ZAG',
      midfielder: 'MEI',
      forward: 'ATA',
      gk: 'GOL',
      cb: 'ZAG',
      cm: 'MEI',
      st: 'ATA',
    },
    tiers: { bronze: 'Bronze', prata: 'Prata', ouro: 'Ouro', lenda: 'Lenda' },
  },
};

const en: CopyCampeonato = {
  hub: {
    title: 'Championships',
    subtitle:
      'Build a league or a cup in under a minute: pick the format, add the teams, and the table comes out ready — standings, calendar, bracket and top scorers computed for you.',
    empty: 'No public championship yet. Create the first one.',
    create: 'Create championship',
    creating: 'Creating…',
    loginToCreate: 'Sign in to your FayAI account to create a championship',
    mine: 'Mine',
    slots: 'slots',
    joined: 'entered',
    open: 'Open',
    loading: 'Loading championships…',
    error: 'Could not load championships right now.',
  },
  presets: {
    'liga-8': {
      nome: 'League of 8',
      texto: 'Round robin, single turn. Everyone plays everyone across 7 rounds — the friends-group format.',
    },
    'liga-10-ida-volta': {
      nome: 'League of 10, home and away',
      texto: 'Eighteen rounds, alternating home advantage. The long-season format, with promotion and relegation.',
    },
    'copa-16': {
      nome: 'Cup of 16',
      texto: 'Straight knockout, single leg. Four rounds from the last 16 to the final — done in one night.',
    },
    'mundial-16': {
      nome: 'World Cup of 16',
      texto: 'Four groups of four, top two advance. Group stage, then the knockout bracket.',
    },
    'relampago-4': {
      nome: 'Blitz of 4',
      texto: 'Four teams, all against all, three rounds. To settle it on the spot.',
    },
  },
  novo: {
    title: 'New championship',
    subtitle: 'Pick a ready-made format. Everything can be adjusted later.',
    pickPreset: 'Pick the format',
    name: 'Championship name',
    namePlaceholder: 'Friends Cup, Neighbourhood League…',
    description: 'Description (optional)',
    descriptionPlaceholder: 'Who can enter, when you play, the prize…',
    platform: 'Platform',
    slots: 'Slots',
    turns: 'Turns',
    turnsSingle: 'Single turn',
    turnsDouble: 'Home and away',
    submit: 'Create championship',
    cancel: 'Cancel',
    customize: 'Adjust details',
    format: 'Format',
    formats: {
      'pontos-corridos': 'Round robin',
      'mata-mata': 'Knockout',
      'grupos-mata-mata': 'Groups + knockout',
    },
  },
  status: {
    rascunho: 'Draft',
    inscricoes: 'Entries open',
    'em-andamento': 'In progress',
    encerrada: 'Finished',
  },
  fases: {
    liga: 'League',
    grupo: 'Group stage',
    'trigesima-segunda': 'Round of 64',
    'decima-sexta': 'Round of 32',
    oitavas: 'Round of 16',
    quartas: 'Quarter-finals',
    semi: 'Semi-finals',
    terceiro: 'Third place',
    final: 'Final',
  },
  painel: {
    organizer: 'You organize this championship',
    teams: 'Teams',
    teamsEmpty: 'No team entered yet.',
    addTeam: 'Add team',
    addByEa: 'By EA club',
    addByHand: 'Enter by hand',
    eaIdOrName: 'Clubs club ID',
    teamName: 'Team name',
    teamShort: 'Short name (3 letters)',
    squad: 'Squad',
    squadPlaceholder: 'One gamertag per line',
    squadHelp:
      'One gamertag per line. The squad is a snapshot: whoever leaves later still shows in the sheets of the matches they played.',
    save: 'Add',
    saving: 'Adding…',
    remove: 'Remove',
    generate: 'Generate table',
    generating: 'Generating…',
    regenerate: 'Generate again',
    generateHelp:
      'The table comes out with every round. Once generated, teams are locked — to change them, drop the table.',
    dropTable: 'Drop table',
    standings: 'Standings',
    standingsEmpty: 'Standings appear once the first result is recorded.',
    calendar: 'Calendar',
    calendarEmpty: 'Generate the table for the calendar to appear.',
    bracket: 'Bracket',
    scorers: 'Top scorers',
    scorersEmpty: 'Record goals in each match sheet to fill the scorers table.',
    round: 'Round',
    setScore: 'Record score',
    scoreSaved: 'Score recorded',
    scoreHelp: 'Enter the score and, if you like, who scored. That is what fills the scorers table and the poster.',
    awaiting: 'Awaiting qualifier',
    bye: 'Bye',
    champion: 'Champion',
    runnerUp: 'Runner-up',
    poster: 'Champion poster',
    posterHelp: 'A ready-to-post image with the winning squad and the standouts.',
    declared: 'Declared',
    measured: 'Measured on EA',
    declaredWhy:
      "Score typed by the organizer. Once the match is matched against what EA publishes, it becomes observation rather than declaration.",
    cols: {
      pos: '#',
      team: 'Team',
      played: 'P',
      won: 'W',
      drawn: 'D',
      lost: 'L',
      gf: 'GF',
      ga: 'GA',
      gd: 'GD',
      points: 'PTS',
      form: 'Form',
      pct: '%',
      player: 'Player',
      goals: 'G',
      assists: 'A',
      contrib: 'G+A',
      rating: 'Rating',
    },
    zones: { promotion: 'Qualification', relegation: 'Relegation' },
  },
  carta: {
    positions: {
      goalkeeper: 'GK',
      defender: 'DEF',
      midfielder: 'MID',
      forward: 'FWD',
      gk: 'GK',
      cb: 'DEF',
      cm: 'MID',
      st: 'FWD',
    },
    tiers: { bronze: 'Bronze', prata: 'Silver', ouro: 'Gold', lenda: 'Legend' },
  },
};

export function getCopyCampeonato(locale: string): CopyCampeonato {
  return locale === 'en' ? en : pt;
}
