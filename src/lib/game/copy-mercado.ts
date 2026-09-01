/**
 * O texto do MERCADO de transferências, pt-BR e en.
 *
 * Em módulo próprio pelo mesmo motivo de `copy-campeonato.ts`: o Mercado é uma
 * área inteira (vitrine, filtros, publicação, candidatura, cartaz) e não deve
 * dividir arquivo com a landing. E fora do dicionário de 7.7k chaves, porque
 * chave faltando lá não dá erro — dá frase em português numa página inglesa,
 * calada.
 *
 * O tom herda a pesquisa nos grupos: a comunidade fala em "vaga", "recrutando",
 * "livre no mercado", "horário fixo". O copy usa a gíria deles, não o
 * economês de "listing"/"posting".
 */

export interface CopyMercado {
  hub: {
    title: string;
    subtitle: string;
    /** Selo honesto sob o título. */
    badge: string;
    back: string;
    loading: string;
    error: string;
  };
  stats: {
    clubesRecrutando: string;
    jogadoresLivres: string;
    posicaoMaisPedida: string;
    novasNaSemana: string;
  };
  abas: {
    clubes: string;
    jogadores: string;
  };
  filtros: {
    posicao: string;
    plataforma: string;
    todas: string;
    todasPlat: string;
    gen5: string;
    gen4: string;
    mista: string;
    ordenar: string;
    ordRecentes: string;
    ordDivisao: string;
    ordOverall: string;
    limpar: string;
    busca: string;
    buscaPlaceholder: string;
  };
  vazio: {
    clubes: string;
    jogadores: string;
    filtro: string;
  };
  card: {
    recrutando: string;
    livre: string;
    precisa: string;
    joga: string;
    divisao: string;
    semDivisao: string;
    overall: string;
    horarioLivre: string;
    candidatar: string;
    candidatando: string;
    candidatou: string;
    verContato: string;
    candidatos: string;
    cartaz: string;
    demo: string;
    ownerBadge: string;
    fechar: string;
    reabrir: string;
    preenchida: string;
    naoInformado: string;
    reputacao: string;
    semAvaliacao: string;
    avaliar: string;
    avaliacoesLabel: string;
  };
  /** A área principal da comunidade — o coração do Winners 22. */
  comunidade: {
    title: string;
    subtitle: string;
    onlineAgora: string;
    jogadores: string;
    visitantes: string;
    procurandoJogo: string;
    naComunidade: string;
    ninguemOnline: string;
    /** Painel do próprio usuário. */
    voceEsta: string;
    entrarParaAparecer: string;
    login: string;
    definaPosicao: string;
    semPosicao: string;
    statusRotulo: { online: string; procurando: string; jogando: string };
    verMercado: string;
    criarCampeonato: string;
    stats: {
      online: string;
      campeonatos: string;
      vagas: string;
      jogadores: string;
      avaliacoes: string;
    };
  };
  /** O voto num jogador. */
  avaliacao: {
    titulo: string;
    subtitulo: string;
    media: string;
    de: string;
    semNota: string;
    comentario: string;
    comentarioPlaceholder: string;
    enviar: string;
    enviando: string;
    ok: string;
    login: string;
    fechar: string;
    /** Rótulo das notas 1..5, para a dica sob as estrelas. */
    escala: string[];
  };
  publicar: {
    abrir: string;
    tituloClube: string;
    tituloJogador: string;
    tipoPergunta: string;
    souClube: string;
    souJogador: string;
    nomeClube: string;
    nomeClubePlaceholder: string;
    ligarClube: string;
    ligarClubeDica: string;
    gamertag: string;
    gamertagPlaceholder: string;
    estilo: string;
    estiloPlaceholder: string;
    overall: string;
    minOverall: string;
    posicoesClube: string;
    posicoesJogador: string;
    plataforma: string;
    dias: string;
    horario: string;
    horarioPlaceholder: string;
    regiao: string;
    regiaoPlaceholder: string;
    descricao: string;
    descricaoClubePlaceholder: string;
    descricaoJogadorPlaceholder: string;
    contato: string;
    contatoTipo: { plataforma: string; discord: string; whatsapp: string };
    contatoPlaceholder: string;
    contatoDica: string;
    enviar: string;
    enviando: string;
    cancelar: string;
    login: string;
    sucesso: string;
    erroPosicao: string;
  };
  candidatura: {
    titulo: string;
    mensagem: string;
    mensagemPlaceholder: string;
    contato: string;
    contatoPlaceholder: string;
    enviar: string;
    enviando: string;
    ok: string;
    contatoDeles: string;
  };
  /** Dias da semana, curtos, na ordem seg→dom. */
  dias: string[];
  /** A página de perfil do jogador. */
  perfil: {
    back: string;
    verificado: string;
    naoVerificado: string;
    clube: string;
    divisao: string;
    plataforma: string;
    semClube: string;
    reputacaoTitulo: string;
    semReputacao: string;
    temporada: string;
    carreira: string;
    semStats: string;
    cols: { jogos: string; gols: string; assist: string; nota: string; craques: string; aproveitamento: string };
    comentarios: string;
    semComentarios: string;
    noMercado: string;
    noMercadoSub: string;
    verVaga: string;
    avaliar: string;
    naoEncontrado: string;
    naoEncontradoSub: string;
    procurando: string;
  };
}

const pt: CopyMercado = {
  hub: {
    title: 'Mercado da bola',
    subtitle:
      'O quadro de transferências do Winners 22. Clubes recrutando e jogadores livres, com posição, plataforma e horário no lugar do print da TV — e a divisão real do clube puxada da EA, não a que o cartaz jura.',
    badge: 'Substitui o "comenta que te chamo no WhatsApp"',
    back: 'Winners 22',
    loading: 'Carregando o mercado…',
    error: 'Não deu para carregar o mercado agora. Tente de novo em instantes.',
  },
  stats: {
    clubesRecrutando: 'clubes recrutando',
    jogadoresLivres: 'jogadores livres',
    posicaoMaisPedida: 'posição mais pedida',
    novasNaSemana: 'novas nesta semana',
  },
  abas: {
    clubes: 'Clubes recrutando',
    jogadores: 'Jogadores livres',
  },
  filtros: {
    posicao: 'Posição',
    plataforma: 'Plataforma',
    todas: 'Todas',
    todasPlat: 'Todas',
    gen5: 'PS5 · Series · PC',
    gen4: 'PS4 · Xbox One',
    mista: 'Mista',
    ordenar: 'Ordenar',
    ordRecentes: 'Mais recentes',
    ordDivisao: 'Melhor divisão',
    ordOverall: 'Maior overall',
    limpar: 'Limpar filtros',
    busca: 'Buscar',
    buscaPlaceholder: 'Nome do clube, gamertag, estilo…',
  },
  vazio: {
    clubes: 'Nenhum clube recrutando ainda. Seja o primeiro a abrir vaga.',
    jogadores: 'Nenhum jogador livre no momento. Anuncie-se e apareça para os clubes.',
    filtro: 'Nada com esse filtro. Afrouxe a posição ou a plataforma.',
  },
  card: {
    recrutando: 'Recrutando',
    livre: 'Livre no mercado',
    precisa: 'Precisa de',
    joga: 'Joga',
    divisao: 'Divisão',
    semDivisao: 'Divisão não medida',
    overall: 'OVR',
    horarioLivre: 'Horário',
    candidatar: 'Candidatar-se',
    candidatando: 'Enviando…',
    candidatou: 'Candidatura enviada',
    verContato: 'Ver contato',
    candidatos: 'candidato(s)',
    cartaz: 'Gerar cartaz',
    demo: 'Exemplo',
    ownerBadge: 'Sua vaga',
    fechar: 'Marcar preenchida',
    reabrir: 'Reabrir',
    preenchida: 'Preenchida',
    naoInformado: 'a combinar',
    reputacao: 'Reputação',
    semAvaliacao: 'Sem avaliação',
    avaliar: 'Avaliar',
    avaliacoesLabel: 'avaliações',
  },
  comunidade: {
    title: 'A comunidade Winners 22',
    subtitle: 'Quem está em campo agora. Entre e você já aparece aqui — cada bonequinho é um jogador de verdade na plataforma.',
    onlineAgora: 'online agora',
    jogadores: 'jogadores',
    visitantes: 'visitantes',
    procurandoJogo: 'procurando jogo',
    naComunidade: 'Na comunidade',
    ninguemOnline: 'Seja o primeiro a entrar em campo hoje.',
    voceEsta: 'Você está',
    entrarParaAparecer: 'Entre para virar um jogador na comunidade',
    login: 'Entrar',
    definaPosicao: 'Sua posição',
    semPosicao: 'Posição',
    statusRotulo: { online: 'Por aqui', procurando: 'Procurando jogo', jogando: 'Em partida' },
    verMercado: 'Mercado da bola',
    criarCampeonato: 'Criar campeonato',
    stats: {
      online: 'online agora',
      campeonatos: 'campeonatos ativos',
      vagas: 'vagas abertas',
      jogadores: 'jogadores no banco',
      avaliacoes: 'avaliações feitas',
    },
  },
  avaliacao: {
    titulo: 'Avaliar jogador',
    subtitulo: 'Jogou com ele? Dê a nota. É assim que a comunidade filtra os craques de verdade.',
    media: 'Média da comunidade',
    de: 'de',
    semNota: 'Ainda sem avaliação — seja o primeiro.',
    comentario: 'Comentário (opcional)',
    comentarioPlaceholder: 'Como foi jogar com ele…',
    enviar: 'Enviar avaliação',
    enviando: 'Enviando…',
    ok: 'Avaliação registrada. Obrigado por construir o banco.',
    login: 'Entre para avaliar',
    fechar: 'Fechar',
    escala: ['Fraco', 'Regular', 'Bom', 'Muito bom', 'Craque'],
  },
  publicar: {
    abrir: 'Publicar vaga',
    tituloClube: 'Recrutar para o meu clube',
    tituloJogador: 'Me anunciar como livre',
    tipoPergunta: 'O que você quer publicar?',
    souClube: 'Sou clube, quero recrutar',
    souJogador: 'Sou jogador, quero time',
    nomeClube: 'Nome do clube',
    nomeClubePlaceholder: 'Ex.: Fronteira TMFC',
    ligarClube: 'ID do clube na EA (opcional)',
    ligarClubeDica: 'Com o ID, o mercado puxa a divisão e a campanha reais do clube.',
    gamertag: 'Sua gamertag',
    gamertagPlaceholder: 'Como aparece no jogo',
    estilo: 'Apelido de estilo (opcional)',
    estiloPlaceholder: 'Ex.: MURALHA, MAESTRO',
    overall: 'Seu overall',
    minOverall: 'Overall mínimo (opcional)',
    posicoesClube: 'Posições que você precisa',
    posicoesJogador: 'Posições que você joga',
    plataforma: 'Plataforma',
    dias: 'Dias que joga',
    horario: 'Horário',
    horarioPlaceholder: 'Ex.: 20h–23h',
    regiao: 'Região / fuso (opcional)',
    regiaoPlaceholder: 'Ex.: BR, PT, LATAM',
    descricao: 'Descrição',
    descricaoClubePlaceholder: 'Nível do clube, expectativa, o que valoriza (foco, compromisso, evolução)…',
    descricaoJogadorPlaceholder: 'Seu perfil, tempo de jogo, o que procura num time…',
    contato: 'Contato',
    contatoTipo: { plataforma: 'Pela plataforma', discord: 'Discord', whatsapp: 'WhatsApp' },
    contatoPlaceholder: 'Handle do Discord, ou link do grupo/número',
    contatoDica: 'Só aparece para quem se candidatar — o mercado não expõe seu contato na vitrine.',
    enviar: 'Publicar vaga',
    enviando: 'Publicando…',
    cancelar: 'Cancelar',
    login: 'Entre para publicar',
    sucesso: 'Vaga publicada.',
    erroPosicao: 'Escolha ao menos uma posição.',
  },
  candidatura: {
    titulo: 'Candidatar-se a esta vaga',
    mensagem: 'Recado (opcional)',
    mensagemPlaceholder: 'Diga por que você encaixa, seu horário, sua experiência…',
    contato: 'Seu contato',
    contatoPlaceholder: 'Gamertag, Discord ou como querem te chamar',
    enviar: 'Enviar candidatura',
    enviando: 'Enviando…',
    ok: 'Candidatura enviada. O contato do anunciante está abaixo.',
    contatoDeles: 'Contato do anunciante',
  },
  dias: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
  perfil: {
    back: 'Comunidade',
    verificado: 'Reivindicado',
    naoVerificado: 'Não reivindicado',
    clube: 'Clube',
    divisao: 'Divisão',
    plataforma: 'Plataforma',
    semClube: 'Sem clube conhecido',
    reputacaoTitulo: 'Reputação da comunidade',
    semReputacao: 'Ainda sem avaliação. Jogou com ele? Seja o primeiro a avaliar.',
    temporada: 'Temporada',
    carreira: 'Carreira',
    semStats: 'Estatística ainda não disponível para este jogador.',
    cols: { jogos: 'Jogos', gols: 'Gols', assist: 'Assist.', nota: 'Nota', craques: 'Craque', aproveitamento: 'Aproveit.' },
    comentarios: 'O que dizem dele',
    semComentarios: 'Sem comentários ainda.',
    noMercado: 'Livre no mercado',
    noMercadoSub: 'Este jogador está anunciado e procurando clube.',
    verVaga: 'Ver no mercado',
    avaliar: 'Avaliar jogador',
    naoEncontrado: 'Jogador não encontrado',
    naoEncontradoSub: 'Ainda não temos ficha, avaliação ou anúncio para essa gamertag.',
    procurando: 'Procurando jogo',
  },
};

const en: CopyMercado = {
  hub: {
    title: 'Transfer market',
    subtitle:
      "The Winners 22 transfer board. Clubs recruiting and free agents, with position, platform and schedule instead of a photo of the TV — and the club's real division pulled from EA, not the one the flyer claims.",
    badge: 'Replaces the "comment and I\'ll WhatsApp you" chaos',
    back: 'Winners 22',
    loading: 'Loading the market…',
    error: "Couldn't load the market right now. Try again in a moment.",
  },
  stats: {
    clubesRecrutando: 'clubs recruiting',
    jogadoresLivres: 'free agents',
    posicaoMaisPedida: 'most-wanted position',
    novasNaSemana: 'new this week',
  },
  abas: {
    clubes: 'Clubs recruiting',
    jogadores: 'Free agents',
  },
  filtros: {
    posicao: 'Position',
    plataforma: 'Platform',
    todas: 'All',
    todasPlat: 'All',
    gen5: 'PS5 · Series · PC',
    gen4: 'PS4 · Xbox One',
    mista: 'Cross-gen',
    ordenar: 'Sort',
    ordRecentes: 'Most recent',
    ordDivisao: 'Best division',
    ordOverall: 'Highest overall',
    limpar: 'Clear filters',
    busca: 'Search',
    buscaPlaceholder: 'Club name, gamertag, style…',
  },
  vazio: {
    clubes: 'No clubs recruiting yet. Be the first to open a spot.',
    jogadores: 'No free agents right now. List yourself and get seen by clubs.',
    filtro: 'Nothing matches. Loosen the position or platform.',
  },
  card: {
    recrutando: 'Recruiting',
    livre: 'Free agent',
    precisa: 'Needs',
    joga: 'Plays',
    divisao: 'Division',
    semDivisao: 'Division not measured',
    overall: 'OVR',
    horarioLivre: 'Schedule',
    candidatar: 'Apply',
    candidatando: 'Sending…',
    candidatou: 'Application sent',
    verContato: 'See contact',
    candidatos: 'applicant(s)',
    cartaz: 'Make a poster',
    demo: 'Example',
    ownerBadge: 'Your post',
    fechar: 'Mark as filled',
    reabrir: 'Reopen',
    preenchida: 'Filled',
    naoInformado: 'to arrange',
    reputacao: 'Reputation',
    semAvaliacao: 'No ratings',
    avaliar: 'Rate',
    avaliacoesLabel: 'ratings',
  },
  comunidade: {
    title: 'The Winners 22 community',
    subtitle: "Who's on the pitch right now. Come in and you show up here too — every little avatar is a real player on the platform.",
    onlineAgora: 'online now',
    jogadores: 'players',
    visitantes: 'visitors',
    procurandoJogo: 'looking for a game',
    naComunidade: 'In the community',
    ninguemOnline: 'Be the first on the pitch today.',
    voceEsta: 'You are',
    entrarParaAparecer: 'Sign in to become a player in the community',
    login: 'Sign in',
    definaPosicao: 'Your position',
    semPosicao: 'Position',
    statusRotulo: { online: 'Around', procurando: 'Looking for a game', jogando: 'In a match' },
    verMercado: 'Transfer market',
    criarCampeonato: 'Create a championship',
    stats: {
      online: 'online now',
      campeonatos: 'active championships',
      vagas: 'open listings',
      jogadores: 'players in the database',
      avaliacoes: 'ratings given',
    },
  },
  avaliacao: {
    titulo: 'Rate player',
    subtitulo: 'Played with them? Rate them. This is how the community surfaces the real players.',
    media: 'Community average',
    de: 'of',
    semNota: 'No ratings yet — be the first.',
    comentario: 'Comment (optional)',
    comentarioPlaceholder: 'How was it playing with them…',
    enviar: 'Submit rating',
    enviando: 'Submitting…',
    ok: 'Rating saved. Thanks for building the database.',
    login: 'Sign in to rate',
    fechar: 'Close',
    escala: ['Poor', 'Fair', 'Good', 'Very good', 'World class'],
  },
  publicar: {
    abrir: 'Post a listing',
    tituloClube: 'Recruit for my club',
    tituloJogador: 'List myself as available',
    tipoPergunta: 'What do you want to post?',
    souClube: "I'm a club, recruiting",
    souJogador: "I'm a player, looking for a club",
    nomeClube: 'Club name',
    nomeClubePlaceholder: 'e.g. Fronteira TMFC',
    ligarClube: 'EA club ID (optional)',
    ligarClubeDica: "With the ID, the market pulls the club's real division and record.",
    gamertag: 'Your gamertag',
    gamertagPlaceholder: 'As it shows in game',
    estilo: 'Style nickname (optional)',
    estiloPlaceholder: 'e.g. THE WALL, MAESTRO',
    overall: 'Your overall',
    minOverall: 'Minimum overall (optional)',
    posicoesClube: 'Positions you need',
    posicoesJogador: 'Positions you play',
    plataforma: 'Platform',
    dias: 'Days you play',
    horario: 'Schedule',
    horarioPlaceholder: 'e.g. 8pm–11pm',
    regiao: 'Region / timezone (optional)',
    regiaoPlaceholder: 'e.g. BR, EU, NA',
    descricao: 'Description',
    descricaoClubePlaceholder: 'Club level, expectations, what you value (focus, commitment, growth)…',
    descricaoJogadorPlaceholder: 'Your profile, playtime, what you want from a club…',
    contato: 'Contact',
    contatoTipo: { plataforma: 'Through the platform', discord: 'Discord', whatsapp: 'WhatsApp' },
    contatoPlaceholder: 'Discord handle, or group link/number',
    contatoDica: "Only shown to people who apply — the market doesn't expose your contact on the board.",
    enviar: 'Post listing',
    enviando: 'Posting…',
    cancelar: 'Cancel',
    login: 'Sign in to post',
    sucesso: 'Listing posted.',
    erroPosicao: 'Pick at least one position.',
  },
  candidatura: {
    titulo: 'Apply to this listing',
    mensagem: 'Message (optional)',
    mensagemPlaceholder: 'Say why you fit, your schedule, your experience…',
    contato: 'Your contact',
    contatoPlaceholder: 'Gamertag, Discord or how they should reach you',
    enviar: 'Send application',
    enviando: 'Sending…',
    ok: "Application sent. The poster's contact is below.",
    contatoDeles: 'Advertiser contact',
  },
  dias: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  perfil: {
    back: 'Community',
    verificado: 'Claimed',
    naoVerificado: 'Unclaimed',
    clube: 'Club',
    divisao: 'Division',
    plataforma: 'Platform',
    semClube: 'No known club',
    reputacaoTitulo: 'Community reputation',
    semReputacao: 'No ratings yet. Played with them? Be the first to rate.',
    temporada: 'Season',
    carreira: 'Career',
    semStats: 'No stats available for this player yet.',
    cols: { jogos: 'Games', gols: 'Goals', assist: 'Assists', nota: 'Rating', craques: 'MOTM', aproveitamento: 'Win %' },
    comentarios: 'What people say',
    semComentarios: 'No comments yet.',
    noMercado: 'Free agent',
    noMercadoSub: 'This player is listed and looking for a club.',
    verVaga: 'See on the market',
    avaliar: 'Rate player',
    naoEncontrado: 'Player not found',
    naoEncontradoSub: "We don't have a profile, rating or listing for that gamertag yet.",
    procurando: 'Looking for a game',
  },
};

export function getCopyMercado(locale: string): CopyMercado {
  return locale === 'en' ? en : pt;
}

/** Códigos de dia gravados no banco, na mesma ordem de `copy.dias`. */
export const CODIGOS_DIA = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
