/**
 * O dossiê dos trabalhos reais de Ricardo Faya — a fonte da página /casos.
 *
 * ⚠️ ARQUIVO GERADO. Não edite à mão.
 *   fonte:  autoresearch/cases/trabalhos.py  (texto, contexto de época)
 *           autoresearch/cases/acervo_classificado.json  (os 360 vídeos do canal)
 *   gerar:  python cases/trabalhos.py && python cases/exportar_para_site.py
 *
 * Antes de 21/08/2026 esta página mostrava sete cases INVENTADOS — "Atlas
 * Seguros", "Aurora Educação", "Flux Orchestrator" — com métricas inventadas
 * junto ("68+ projetos", "42 dias para ROI"). Nada daquilo existiu. O que está
 * aqui saiu de sete currículos e de 360 vídeos do canal dele, e cada trabalho
 * carrega o campo `prova` dizendo de onde veio.
 */

export type Video = {
  id: string;
  titulo: string;
  dur: string;
  data: string;
  vis: string;
  views: string;
};

export type Trabalho = {
  slug: string;
  ato: number;
  ordem: number;
  titulo: string;
  org: string;
  papel: string;
  inicio: string;
  fim: string | null;
  rotulo: string;
  cidade: string;
  /** chave do objeto 3D/ícone que representa a peça */
  objeto: string;
  cor: string;
  corSec: string;
  /** o gancho de uma linha */
  linha: string;
  resumo: string;
  /** o contexto de época: o que existia, o que ele já sabia */
  contexto: string;
  feitos: string[];
  ferramentas: string[];
  hardware: string[];
  /** de onde saiu a informação — currículo, acervo, ou os dois */
  prova: string;
  videos: Video[];
  playlist: string | null;
  /** id da playlist no canal, quando ela existe */
  playlistId: string | null;
  /** fotografias REAIS, para distinguir do que é arte gerada */
  fotos: { src: string; legenda: string }[];
  destaque: boolean;
  arte: string;
};

export type Ato = {
  ato: number;
  numero: string;
  titulo: string;
  periodo: string;
  linha: string;
  trilha: string;
};

export const ATOS: Ato[] = [
  {
    numero: "I",
    titulo: "A Oficina",
    periodo: "1992 — 1995",
    linha: "Antes de existir a palavra \"criador\", já era isso: hardware de manhã, imagem à tarde.",
    ato: 1,
    trilha: "/casos/trilha/ato1-a-oficina.mp3"
  },
  {
    numero: "II",
    titulo: "A Ilha",
    periodo: "1995 — 2002",
    linha: "Sete anos de MultiRio, um manual em inglês e uma ilha inteira em alemão.",
    ato: 2,
    trilha: "/casos/trilha/ato2-a-ilha.mp3"
  },
  {
    numero: "III",
    titulo: "O Chefe de Corte",
    periodo: "2002 — 2013",
    linha: "Hollywood, FGV, Jockey Club — e uma lista de freelas que termina em \"entre muitos outros\".",
    ato: 3,
    trilha: "/casos/trilha/ato3-chefe-de-corte.mp3"
  },
  {
    numero: "IV",
    titulo: "O Ar",
    periodo: "2013 — 2016",
    linha: "Comprou um drone no ano em que o drone foi inventado.",
    ato: 4,
    trilha: "/casos/trilha/ato4-o-ar.mp3"
  },
  {
    numero: "V",
    titulo: "A Rede Global",
    periodo: "2014 — 2018",
    linha: "Copa, Olimpíada e cinema, para 20 milhões de pessoas por dia.",
    ato: 5,
    trilha: "/casos/trilha/ato5-rede-global.mp3"
  },
  {
    numero: "VI",
    titulo: "O Renascimento",
    periodo: "2018 — hoje",
    linha: "Perdeu o emprego numa reestruturação global e virou o próprio estúdio.",
    ato: 6,
    trilha: "/casos/trilha/ato6-renascimento.mp3"
  }
];

export const TRABALHOS: Trabalho[] = [
  {
    slug: "tales-of-the-vale",
    ato: 1,
    ordem: 10,
    titulo: "Tales of the Vale",
    org: "Tales of the Vale",
    papel: "Dono, marca e método",
    inicio: "1992-06",
    fim: "1994-05",
    rotulo: "1992 — 1994",
    cidade: "São José dos Campos, SP",
    objeto: "crt",
    cor: "#7c4dff",
    corSec: "#00e5c0",
    linha: "Aos 16 anos, uma loja de RPG onde a computação gráfica virou material didático.",
    resumo: "A primeira empresa foi dele. Loja de RPG no interior paulista, com a logomarca desenhada por ele e — a parte que ninguém fazia — um método próprio de ensinar o jogo, todo visual, ilustrado com imagens que ele mesmo renderizava.",
    contexto: "Explicar RPG em 1992 era ler regra em livro de capa dura, em inglês, para gente que nunca tinha jogado. Ele resolveu por imagem. O que existia para isso: **3D Studio R1**, rodando em DOS, renderizando um frame por vários minutos numa máquina 386, e o **Photoshop 2.0/2.5**, que tinha acabado de aparecer e ainda nem tinha camadas. Cada peça de material era um cálculo de horas. Numa cidade onde quase ninguém tinha visto uma imagem renderizada, isso não era decoração: era o argumento de venda.",
    feitos: [
      "Criou a logomarca e toda a identidade da loja",
      "Inventou um método visual de aprendizado de RPG, com computação gráfica no lugar do texto",
      "Cuidou de marketing, atendimento e produção — sozinho"
    ],
    ferramentas: [
      "3D Studio R1 (DOS)",
      "Photoshop 2.0",
      "Autodesk Animator",
      "MS-DOS"
    ],
    hardware: [
      "386 / 486",
      "Monitor CRT VGA",
      "Impressão matricial"
    ],
    prova: "Currículo (versão longa, 14/04/2021) — \"Proprietário. Responsável por toda a parte de marketing, tendo criado a logomarca da loja e um novo método de aprendizado do RPG.\"",
    videos: [],
    playlist: null,
    playlistId: null,
    fotos: [],
    destaque: false,
    arte: "/casos/arte/tales-of-the-vale.webp"
  },
  {
    slug: "igres",
    ato: 1,
    ordem: 20,
    titulo: "IGRES Tecnologia e Design",
    org: "IGRES",
    papel: "Técnico de informática e designer gráfico",
    inicio: "1994-06",
    fim: "1995-01",
    rotulo: "1994 — 1995",
    cidade: "São José dos Campos, SP",
    objeto: "motherboard",
    cor: "#00b8d4",
    corSec: "#ff8f00",
    linha: "Montava o computador de manhã e desenhava o anúncio de jornal à tarde.",
    resumo: "A IGRES era responsável pela maioria dos computadores pessoais e corporativos do Vale do Paraíba. Ele \"afinava e configurava\" as máquinas que a empresa distribuía — e, no mesmo expediente, fazia os anúncios do jornal Vale Paraibano e as animações que as empresas da região encomendavam.",
    contexto: "A base instalada ia do **386DX ao Pentium**, que era novidade. Afinar uma máquina nessa época queria dizer resolver conflito de IRQ na unha, mexer em jumper de placa-mãe, e escrever CONFIG.SYS e AUTOEXEC.BAT para caber o driver do CD-ROM nos 640 KB de memória baixa. Do outro lado da mesa, a parte gráfica: anúncio de jornal e animação em **FLI, FLC e AVI** — o AVI tinha nascido fazia um ano com o Video for Windows. Ter as duas mãos, a do hardware e a da imagem, é o que explica os trinta anos seguintes.",
    feitos: [
      "Configuração e manutenção de hardware e software da base instalada da região",
      "Anúncios para o jornal Vale Paraibano",
      "Animações em FLI, FLC e AVI para empresas de São José dos Campos"
    ],
    ferramentas: [
      "Autodesk Animator Pro",
      "3D Studio",
      "Photoshop",
      "MS-DOS / Windows 3.1"
    ],
    hardware: [
      "386DX até Pentium",
      "Placas ISA",
      "Video for Windows"
    ],
    prova: "Currículo — \"Encarregado de afinar e configurar os microcomputadores... a empresa era a responsável por anúncios no Jornal Vale Paraibano e animações em FLI, FLC, AVI.\"",
    videos: [],
    playlist: null,
    playlistId: null,
    fotos: [],
    destaque: false,
    arte: "/casos/arte/igres.webp"
  },
  {
    slug: "cna",
    ato: 1,
    ordem: 30,
    titulo: "CNA — Ensino de Línguas",
    org: "CNA",
    papel: "Professor de inglês (básico, médio e avançado)",
    inicio: "1994-08",
    fim: "1996-09",
    rotulo: "1994 — 1996",
    cidade: "São José dos Campos, SP",
    objeto: "chalkboard",
    cor: "#ef5350",
    corSec: "#ffd54f",
    linha: "Voltou dos Estados Unidos falando inglês e levou o computador para dentro da sala de aula.",
    resumo: "Dois anos dando aula nos três níveis. O diferencial não era o inglês — que ele tinha de morar fora, entre Wisconsin e Nova Iorque — era usar tecnologia na sala para segurar a atenção de quem estava ali por obrigação.",
    contexto: "Sala de aula de idioma em 1994 era toca-fitas, VHS e retroprojetor. Levar um PC para a aula não era procedimento de ninguém. Ele fez porque tinha o repertório dos dois lados: a fluência vinha do ensino médio nos Estados Unidos, e a máquina vinha da IGRES, no mesmo período. É a primeira vez que aparece o padrão que se repete a vida inteira — **pegar a ferramenta nova e usá-la para explicar melhor**.",
    feitos: [
      "Aulas nos níveis básico, médio e avançado",
      "Uso de tecnologia em sala para aumentar o engajamento — antes de isso ter nome"
    ],
    ferramentas: [
      "VHS",
      "Áudio em fita",
      "PC em sala"
    ],
    hardware: [
      "Long Island City High School, NY",
      "Goodrich High School, Wisconsin"
    ],
    prova: "Currículo em inglês — \"Used technology in the classroom to improve student engagement and learning outcomes.\" Histórico do CTI confirma a 1ª série do 2º grau cursada nos EUA.",
    videos: [],
    playlist: null,
    playlistId: null,
    fotos: [],
    destaque: false,
    arte: "/casos/arte/cna.webp"
  },
  {
    slug: "multirio",
    ato: 2,
    ordem: 40,
    titulo: "MultiRio",
    org: "MultiRio — Empresa Municipal de Multimeios",
    papel: "Editor de Video Machine",
    inicio: "1995-03",
    fim: "2002-05",
    rotulo: "1995 — 2002 · 7 anos",
    cidade: "Rio de Janeiro, RJ",
    objeto: "videomachine",
    cor: "#26a69a",
    corSec: "#ffca28",
    linha: "Sete anos aprendendo edição não-linear em manual técnico escrito em inglês.",
    resumo: "Produtora de programas socioeducativos exibidos em TV aberta (TVE, Bandeirantes) e por assinatura (NET). Ele entrou como editor de **Video Machine** e saiu operando **Discreet Flint** — o degrau mais alto de finalização que existia.",
    contexto: "A Video Machine, da Fast Electronic, foi uma das primeiras ilhas não-lineares a caber num PC: placa de captura com codec JPEG em hardware, e a edição saindo do corte fita-a-fita para a linha do tempo. Não havia tutorial, não havia fórum, não havia YouTube. O que havia era o **manual do fabricante, em inglês** — e é literalmente assim que ele conta no currículo. O inglês do CNA virou ferramenta de trabalho. Depois veio o **Discreet Flint**, que rodava em estação **SGI** e custava o preço de um apartamento: compositing e finalização de nível broadcast. Tudo em SD 4:3, Betacam SP, timecode, e a disciplina de quem não pode desfazer.",
    feitos: [
      "Edição de programas socioeducativos para TVE, Bandeirantes e NET",
      "Domínio da edição off-line não-linear quando ela ainda era exceção no Brasil",
      "Operação de Discreet Flint (finalização e compositing em estação SGI)",
      "Aprendizado técnico direto de manual em inglês e de técnicos da casa"
    ],
    ferramentas: [
      "Fast Video Machine",
      "Discreet Flint",
      "Betacam SP"
    ],
    hardware: [
      "PC com placa de captura JPEG",
      "Estação SGI",
      "Ilha SD 4:3"
    ],
    prova: "Currículo — \"Atuando como Editor de Video Machine... o aprendizado da filosofia da edição não linear (off line) foi muito intuitivo. Conhecimento e orientação técnica adquirida nos manuais técnicos dos fabricantes (manuais escritos em inglês).\" Cursos: Video Machine — MultiRio; Discreet Flint — MultiRio.",
    videos: [],
    playlist: null,
    playlistId: null,
    fotos: [],
    destaque: true,
    arte: "/casos/arte/multirio.webp"
  },
  {
    slug: "virtual-mdb",
    ato: 2,
    ordem: 50,
    titulo: "VIRTUAL · MDB Entretenimento",
    org: "medeibem.com.br",
    papel: "Divisão de vídeo — captação, ilha, edição, som e pós",
    inicio: "2000-11",
    fim: "2001-04",
    rotulo: "2000 — 2001",
    cidade: "Rio de Janeiro, RJ",
    objeto: "modem",
    cor: "#5c6bc0",
    corSec: "#00e676",
    linha: "Vídeo para internet quando internet era 56k — e a ilha de edição ele montou do zero.",
    resumo: "A divisão de vídeo de um site, no auge da bolha ponto-com brasileira. Ele fez tudo: captou imagem em evento, **montou a ilha de edição**, editou, sonorizou e finalizou.",
    contexto: "Em 2000, colocar vídeo na web queria dizer RealVideo ou Windows Media a 30 kbps, para quem entrava por modem discado. O quadro era do tamanho de um selo e cada segundo era negociado byte a byte. Montar a ilha significava escolher placa de captura, disco rápido o suficiente para vídeo (que na época era coisa rara e cara) e resolver o gargalo do IDE. É a primeira vez que ele **monta a operação inteira**, e não só opera a dos outros.",
    feitos: [
      "Captação de imagem em eventos",
      "Montagem da ilha de edição do zero",
      "Edição, sonorização e pós-produção"
    ],
    ferramentas: [
      "RealVideo / Windows Media",
      "Premiere",
      "DV"
    ],
    hardware: [
      "Ilha PC montada por ele",
      "Placa de captura",
      "Internet discada"
    ],
    prova: "Currículo — \"Divisão de vídeo do site. Desde a captação das imagens em eventos, assim como a montagem da ilha de edição, a edição, sonorização e pós-produção.\"",
    videos: [],
    playlist: null,
    playlistId: null,
    fotos: [],
    destaque: false,
    arte: "/casos/arte/virtual-mdb.webp"
  },
  {
    slug: "zdf",
    ato: 2,
    ordem: 60,
    titulo: "ZDF Television — sucursal Brasil",
    org: "ZDF (Alemanha)",
    papel: "Editor freelance — substituindo a editora-chefe no Brasil",
    inicio: "2000-05",
    fim: "2010-11",
    rotulo: "2000 — 2010",
    cidade: "Rio de Janeiro, RJ",
    objeto: "globe",
    cor: "#ff7043",
    corSec: "#42a5f5",
    linha: "Editou para a TV alemã numa ilha em que o sistema operacional inteiro estava em alemão.",
    resumo: "Chamado para substituir a editora-chefe da ZDF no Brasil. O detalhe que define o trabalho está no currículo: **os equipamentos e o sistema operacional do computador eram todos em alemão**. Ele não fala alemão.",
    contexto: "Editar sem entender o rótulo dos botões é possível por um motivo só: quem conhece a *lógica* de uma ilha reconhece o lugar da função antes de ler o nome dela. É o mesmo músculo que ele treinou na MultiRio lendo manual em inglês, agora sem nem o manual. A ZDF é a segunda maior emissora pública da Europa; o material saía do Rio para Mainz por satélite, com prazo de telejornal. As matérias que ele lista dão o tamanho: a vida do **Comandante Rolim** (fundador da TAM, morto em 2001), **o Rio de corpo e alma**, **o carnaval carioca** e a **cobertura das eleições presidenciais na Argentina**.",
    feitos: [
      "Vida e obra do Comandante Rolim (TAM)",
      "\"Rio, uma cidade de corpo e alma\"",
      "O carnaval do Rio",
      "Cobertura das eleições presidenciais na Argentina"
    ],
    ferramentas: [
      "Ilha da ZDF (interface em alemão)",
      "Betacam / DV",
      "Feed por satélite"
    ],
    hardware: [
      "Sucursal ZDF no Rio"
    ],
    prova: "Currículo — \"Editor contratado temporariamente para substituir a editora chefa da ZDF no Brasil. Os equipamentos e o sistema operacional do computador era todo em alemão.\"",
    videos: [],
    playlist: null,
    playlistId: null,
    fotos: [],
    destaque: true,
    arte: "/casos/arte/zdf.webp"
  },
  {
    slug: "dvplus-hollywood",
    ato: 3,
    ordem: 70,
    titulo: "DVPlus · Emmanuelle in Rio",
    org: "DVPlus / produção norte-americana",
    papel: "Editor chefe — e coautor de roteiro",
    inicio: "2002-05",
    fim: "2003-01",
    rotulo: "2002 — 2003",
    cidade: "Rio de Janeiro, RJ",
    objeto: "filmreel",
    cor: "#d81b60",
    corSec: "#ffd54f",
    linha: "Um longa de Hollywood rodado no Rio, montado em Avid — e ele mexeu no roteiro.",
    resumo: "Editor chefe da DVPlus, responsável por campanhas políticas e programas internacionais. No meio disso, **Emmanuelle in Rio**, longa-metragem em inglês de produção norte-americana: ele editou e **participou da elaboração do roteiro**.",
    contexto: "2002 é o ano em que a eleição presidencial brasileira mais mobilizou televisão — e campanha política é o regime mais duro que existe para uma ilha: material chegando até a última hora, prazo legal inegociável, e nenhuma chance de \"amanhã a gente ajeita\". Do outro lado da mesma sala, um longa em inglês. Montar ficção em **Avid Media Composer** em 2002 era trabalhar com mídia off-line em baixa resolução e conformar depois — o que obriga a decidir o filme na cabeça antes de ver o filme bonito. Ser chamado para o roteiro, sendo o editor, diz o que o diretor achava do olho dele.",
    feitos: [
      "Montagem do longa Emmanuelle in Rio (produção norte-americana, falado em inglês)",
      "Participação na elaboração do roteiro",
      "Campanhas políticas e programas internacionais"
    ],
    ferramentas: [
      "Avid Media Composer",
      "Betacam",
      "Off-line + conformação"
    ],
    hardware: [
      "Ilha Avid",
      "Storage SCSI"
    ],
    prova: "Currículo — \"Editor Chefe. Responsável por campanhas políticas e programas internacionais. Entre os quais, o filme Emanuelle in Rio, onde além de editar, participei na elaboração do roteiro.\" Perfil LinkedIn traz a experiência sob o rótulo \"Hollywood\".",
    videos: [],
    playlist: null,
    playlistId: null,
    fotos: [],
    destaque: true,
    arte: "/casos/arte/dvplus-hollywood.webp"
  },
  {
    slug: "fgv",
    ato: 3,
    ordem: 80,
    titulo: "FGV — Fundação Getulio Vargas",
    org: "FGV",
    papel: "Editor chefe — todo o audiovisual do curso Executivo Jr",
    inicio: "2003-02",
    fim: "2006-01",
    rotulo: "2003 — 2006 · 3 anos",
    cidade: "Rio de Janeiro, RJ",
    objeto: "cdrom",
    cor: "#1e88e5",
    corSec: "#26c6da",
    linha: "Responsável por todo o audiovisual de um curso da FGV — na virada do CD-ROM para o online.",
    resumo: "Editor chefe: **todo** o conteúdo audiovisual do curso Executivo Jr no Brasil passava por ele. Anos depois voltaria como freelancer para os institucionais, agora respondendo também pelas artes gráficas.",
    contexto: "Ensino a distância em 2003 no Brasil era CD-ROM e DVD na caixa, com streaming ainda engatinhando — a banda larga estava chegando, mas não dava para contar com ela. Isso muda tudo na edição: o vídeo tem de caber num orçamento fixo de megabytes, o áudio precisa ser inteligível em caixinha de PC, e a aula tem de funcionar sem professor do lado. Editor chefe de curso é meio editor, meio designer instrucional — e é a semente direta do que ele faz hoje na FayAI, vinte anos depois.",
    feitos: [
      "Todo o conteúdo audiovisual do curso Executivo Jr",
      "Institucionais da FGV (edição e artes gráficas)",
      "Peça \"Vida de Estudante\""
    ],
    ferramentas: [
      "Premiere",
      "After Effects",
      "Autoria de CD-ROM/DVD"
    ],
    hardware: [
      "Ilha PC",
      "Compressão MPEG-1/2"
    ],
    prova: "Currículo — \"Editor Chefe. Responsável por todo o conteúdo audiovisual do curso Executivo Jr no Brasil.\" Acervo: institucional FGV com a descrição \"Responsável pela edição e artes gráficas\".",
    videos: [
      {
        id: "DHeWQfyG9mo",
        titulo: "institucional fgv 2-Desktop.f4v",
        dur: "2:31",
        data: "2010-02-11",
        vis: "Público",
        views: "21"
      },
      {
        id: "ZLC9BPo5jsw",
        titulo: "Institucional Vida de Estudante pre Release sem creditos.f4v",
        dur: "4:51",
        data: "2010-02-11",
        vis: "Público",
        views: "10"
      }
    ],
    playlist: "FGV — institucionais",
    playlistId: "PLEqDh-msn2k0",
    fotos: [],
    destaque: true,
    arte: "/casos/arte/fgv.webp"
  },
  {
    slug: "jockey-club",
    ato: 3,
    ordem: 90,
    titulo: "Jockey Club Brasileiro · TV Turfe",
    org: "Jockey Club Brasileiro",
    papel: "Coordenador de edição — e o homem da transição SD→HD",
    inicio: "2006-03",
    fim: "2013-02",
    rotulo: "2006 — 2013 · 7 anos",
    cidade: "Rio de Janeiro, RJ",
    objeto: "horseshoe",
    cor: "#43a047",
    corSec: "#ffd54f",
    linha: "Implantou o sistema DV na emissora, treinou a equipe e conduziu a virada para HD — material e gente.",
    resumo: "Sete anos coordenando a edição da emissora do Jockey. Fez três coisas que raramente aparecem no mesmo currículo: **implantou** o sistema DV, **capacitou** os funcionários e **conduziu a transição para HD** — adaptando tanto o acervo quanto as pessoas. De quebra, assinou a nova programação visual e o logo.",
    contexto: "A migração SD→HD, entre 2006 e 2013, quebrou emissora grande no mundo inteiro. Não é trocar de câmera: é 4:3 virando 16:9 com acervo antigo que precisa continuar no ar, é fita virando arquivo, é codec, é storage, é gente que trabalhava de um jeito havia vinte anos. O trabalho difícil não é técnico, é **o pessoal**. Ele treinou a equipe da TV Turfe em edição não-linear e implantou o sistema VT4 — e isso está listado à parte, como freelance, o que sugere que fez a mesma travessia duas vezes. No fim do período, 2010, o material sai em `.f4v` — Flash — que era como vídeo chegava ao navegador antes do HTML5.",
    feitos: [
      "Implantação do sistema DV na emissora",
      "Capacitação dos funcionários em edição não-linear",
      "Transição completa de SD para HD — material e pessoal",
      "Nova programação visual, logo e vinhetas do JCB",
      "Abertura diária, coberturas de páreo e vinhetas de leilão",
      "Implantação do sistema VT4 na TV Turfe e treinamento da equipe técnica"
    ],
    ferramentas: [
      "DV / HDV",
      "Premiere",
      "After Effects",
      "VT4",
      "Flash Video (.f4v)"
    ],
    hardware: [
      "Ilhas da emissora do JCB",
      "Hipódromo da Gávea"
    ],
    prova: "Currículo — \"Coordenador de Edição, Implementação do sistema DV na emissora, capacitação dos funcionários e a transição para o HD, toda a adaptação de material e de pessoal do SD para o HD foi feita neste período.\" Acervo: \"Abertura feita para o JCB onde além das vinhetas, fui responsável pela nova programação visual e logo.\"",
    videos: [
      {
        id: "2o46nUKfRWQ",
        titulo: "Vinheta Leilão Zura-iPhone.m4v",
        dur: "0:08",
        data: "2010-02-11",
        vis: "Público",
        views: "268"
      },
      {
        id: "6l9Y9HlmJnk",
        titulo: "Abertura Jockey EVERY DAY.f4v",
        dur: "0:24",
        data: "2010-02-11",
        vis: "Público",
        views: "69"
      },
      {
        id: "ubSRi4x4Z1E",
        titulo: "APRESENTACAO Copy 01",
        dur: "0:40",
        data: "2011-10-20",
        vis: "Privado",
        views: "3"
      },
      {
        id: "_sPd2rQWCp0",
        titulo: "APRESENTACAO SD 16X9.mov",
        dur: "0:40",
        data: "2011-10-20",
        vis: "Privado",
        views: "1"
      },
      {
        id: "dueOPm60ee0",
        titulo: "boni1 Desktop",
        dur: "2:26",
        data: "2011-12-01",
        vis: "Público",
        views: "14"
      },
      {
        id: "2VxNOiMD7X0",
        titulo: "boni2 Desktop",
        dur: "0:54",
        data: "2011-12-01",
        vis: "Público",
        views: "23"
      },
      {
        id: "03wK5iHG3mQ",
        titulo: "Faya Boni",
        dur: "2:22",
        data: "2012-08-12",
        vis: "Público",
        views: "408"
      },
      {
        id: "RnZw0DSSoFI",
        titulo: "best takesJockey",
        dur: "2:12",
        data: "2013-11-13",
        vis: "Público",
        views: "18"
      }
    ],
    playlist: "Jockey Club · TV Turfe",
    playlistId: "PLW8yStjZ5Hjg",
    fotos: [],
    destaque: true,
    arte: "/casos/arte/jockey-club.webp"
  },
  {
    slug: "freelas-nao-linear",
    ato: 3,
    ordem: 100,
    titulo: "A lista dos freelas",
    org: "Vários — ARD, Globo, Record, Telefônica, Disa Vídeo",
    papel: "Editor não-linear e direção de vídeo",
    inicio: "1998-01",
    fim: "2013-12",
    rotulo: "fim dos 90 — 2013",
    cidade: "Rio de Janeiro, RJ",
    objeto: "rolodex",
    cor: "#8e24aa",
    corSec: "#26c6da",
    linha: "O currículo termina com uma lista e um \"entre muitos outros\". Ela merece uma sala inteira.",
    resumo: "Debaixo do título \"Outras Atividades\" existe uma lista que, sozinha, seria o currículo de alguém. Emissora alemã, Globo, Record, campanha política em 3D, direção de vídeo de evento, longa-metragem. Cada linha é uma ilha diferente, um software diferente e um cliente que não tinha tempo para explicar duas vezes.",
    contexto: "Ler a lista pelo *software* conta a história da indústria: **LIQUID** (a ilha da Pinnacle que a ARD usava), **Avid na Studio Line**, **Premiere** para programa de TV, **3D Studio Max** para computação gráfica de campanha. Ninguém era especialista em quatro sistemas por gosto — era assim que se sobrevivia de freela quando cada casa tinha o seu. O que se repete em todas: ele chega, entende a ilha, e entrega no prazo de quem já estava lá.",
    feitos: [
      "Edição para a TV alemã ARD em LIQUID",
      "Implantação do sistema VT4 na TV Turfe e capacitação da equipe técnica",
      "Pós-produção do Sabbá Show, rede nacional, em Premiere",
      "Comerciais do Disque Paquera na Studio Line, em Avid",
      "3 capítulos do Globo Ecologia na Studio Line, em Avid",
      "Edição do programa Giro na Noite, em Premiere",
      "Institucionais da Secretaria de Meio Ambiente na Disa Vídeo, em Avid",
      "Direção de vídeo do evento Telefônica Open Air",
      "Episódios de simulação esotérica para a TV Record, em Premiere",
      "Institucional sobre a fusão do Estaleiro Mauá, em Premiere",
      "Computação gráfica para campanha política, em 3D Studio Max"
    ],
    ferramentas: [
      "Pinnacle LIQUID",
      "Avid (Studio Line)",
      "Adobe Premiere",
      "3D Studio Max"
    ],
    hardware: [
      "A ilha de cada cliente"
    ],
    prova: "Currículo (versão longa) — seção \"Outras Atividades / Trabalhos como freelancer de Edição Não Linear\", encerrada com \"entre muitos outros...\".",
    videos: [],
    playlist: null,
    playlistId: null,
    fotos: [],
    destaque: true,
    arte: "/casos/arte/freelas-nao-linear.webp"
  },
  {
    slug: "programa-zero",
    ato: 3,
    ordem: 110,
    titulo: "Programa Zero — o piloto",
    org: "Produção independente",
    papel: "Edição e backstage",
    inicio: "2010-05",
    fim: "2010-06",
    rotulo: "2010",
    cidade: "Rio de Janeiro, RJ",
    objeto: "clapper",
    cor: "#546e7a",
    corSec: "#ff7043",
    linha: "O piloto que não estreou, gravado em HDV, com o backstage inteiro guardado.",
    resumo: "Um piloto de programa em três blocos, mais o making-of. Está no acervo em HDV, em versões alfa, com teaser separado — o retrato de como se testava um formato antes de existir plataforma para publicá-lo direto.",
    contexto: "Em 2010, HDV era a porta de entrada barata do HD: gravava 1440×1080 comprimido em fita MiniDV, e por isso um cartão de crédito conseguia comprar o que antes exigia orçamento de emissora. Piloto de programa se fazia e se levava debaixo do braço. O acervo guarda o bloco zero, o um e o três, mais o backstage — inclusive um arquivo chamado `backstage piloto 00alpha`, que é como se nomeia o que ainda vai mudar.",
    feitos: [
      "Edição dos blocos do piloto",
      "Backstage e teaser",
      "Masterização HDV"
    ],
    ferramentas: [
      "HDV",
      "Premiere",
      "H.264"
    ],
    hardware: [
      "Câmera HDV",
      "Ilha PC"
    ],
    prova: "Acervo do canal: 6 peças entre blocos, teaser e backstage, maio/2010.",
    videos: [
      {
        id: "kCiqgrp5K4I",
        titulo: "backstage piloto 00alpha FAYA HDV YOUTUBE.mp4",
        dur: "9:49",
        data: "2010-05-22",
        vis: "Público",
        views: "40"
      },
      {
        id: "tKmoi_AQeVw",
        titulo: "Backstage_Teaser-m4v",
        dur: "2:29",
        data: "2010-06-08",
        vis: "Privado",
        views: "7"
      },
      {
        id: "sF823FD3q8w",
        titulo: "BSNOMB_3_1AMASTRE.mov",
        dur: "0:11",
        data: "2010-06-10",
        vis: "Público",
        views: "14"
      },
      {
        id: "Q579YdXpR20",
        titulo: "BACKSTAGE PGM ZERO bloco 01 720p H264 (2)-Desktop.m4v",
        dur: "7:58",
        data: "2010-06-13",
        vis: "Privado",
        views: "5"
      },
      {
        id: "V3i6YlcyFaA",
        titulo: "BACKSTAGE PGM ZERO bloco 00 h264-Desktop.m4v",
        dur: "2:03",
        data: "2023-10-12",
        vis: "Público",
        views: "13"
      },
      {
        id: "xqk5ii1aLZ0",
        titulo: "BACKSTAGE PGM ZERO bloco 03 2 h264 720p",
        dur: "3:46",
        data: "2023-10-12",
        vis: "Público",
        views: "3"
      }
    ],
    playlist: "Programa Zero — piloto e backstage",
    playlistId: "PLAOB1zAiQcuE",
    fotos: [],
    destaque: false,
    arte: "/casos/arte/programa-zero.webp"
  },
  {
    slug: "lixo-luanda",
    ato: 3,
    ordem: 120,
    titulo: "Lixo em Luanda",
    org: "Campanha de saúde pública — Angola",
    papel: "Vinhetas e tratamento gráfico",
    inicio: "2010-03",
    fim: "2010-03",
    rotulo: "2010",
    cidade: "Luanda, Angola",
    objeto: "globe",
    cor: "#c0ca33",
    corSec: "#e53935",
    linha: "Uma campanha de saneamento para Angola, resolvida com grafismo em cima de imagem real.",
    resumo: "Vinhetas para uma campanha sobre lixo urbano em Luanda. A descrição que ele deixou no arquivo é de quem pensou o problema: *\"vinheta com alterações gráficas e destaque para os bichos peçonhentos com saturação do início\"*.",
    contexto: "Campanha de saúde pública tem um problema de comunicação difícil: mostrar o risco sem que a pessoa desvie o olho. A solução dele foi de editor — **saturar o início** para prender, e usar grafismo (o símbolo de proibido sobre os ratos) para nomear o perigo sem depender de legenda, o que importa quando o público tem alfabetização desigual. Três versões no acervo mostram que a peça foi ajustada mais de uma vez.",
    feitos: [
      "Vinheta principal e variações",
      "Tratamento gráfico e realce dos vetores de doença"
    ],
    ferramentas: [
      "After Effects",
      "Premiere"
    ],
    hardware: [
      "Ilha PC"
    ],
    prova: "Acervo: 3 peças, março/2010, com descrição do próprio autor.",
    videos: [
      {
        id: "mG6Turjfwog",
        titulo: "lixo luanda_7.mov",
        dur: "0:18",
        data: "2010-03-10",
        vis: "Público",
        views: "11"
      },
      {
        id: "Cc0zskudK3M",
        titulo: "lixo luanda_5-Desktop.m4v",
        dur: "0:18",
        data: "2010-03-10",
        vis: "Público",
        views: "40"
      },
      {
        id: "3dJPQOISvj4",
        titulo: "Vinheta lixo em luanda V2",
        dur: "0:18",
        data: "2010-03-15",
        vis: "Público",
        views: "126"
      }
    ],
    playlist: "Lixo em Luanda — campanha",
    playlistId: "PLJtBn6pcfeVE",
    fotos: [],
    destaque: false,
    arte: "/casos/arte/lixo-luanda.webp"
  },
  {
    slug: "tjrj",
    ato: 3,
    ordem: 130,
    titulo: "Tribunal de Justiça do Rio de Janeiro",
    org: "TJRJ",
    papel: "Abertura e finalização",
    inicio: "2010-03",
    fim: "2010-03",
    rotulo: "2010",
    cidade: "Rio de Janeiro, RJ",
    objeto: "scales",
    cor: "#3949ab",
    corSec: "#cfd8dc",
    linha: "A abertura do vídeo institucional do Judiciário fluminense.",
    resumo: "Abertura do vídeo do TJRJ de 2010, com locução e masterização de áudio próprias.",
    contexto: "Institucional de órgão público tem uma exigência que produção comercial não tem: sobriedade que não vire tédio. O arquivo se chama `AUDIO BERTO NO AR 3 master2` — ou seja, a terceira versão da locução, no segundo master. É o tipo de detalhe que só aparece em quem entrega peça institucional: **a aprovação vem em camadas**.",
    feitos: [
      "Abertura do institucional",
      "Mixagem e masterização com locução"
    ],
    ferramentas: [
      "After Effects",
      "Premiere"
    ],
    hardware: [
      "Ilha PC"
    ],
    prova: "Acervo: \"Abertura do vídeo para o TJRJ 2010.\"",
    videos: [
      {
        id: "RLtpIX05ecw",
        titulo: "AUDIO BERTO NO AR 3 master2 tjrj2010-Desktop.m4v",
        dur: "1:51",
        data: "2010-03-10",
        vis: "Público",
        views: "16"
      }
    ],
    playlist: null,
    playlistId: null,
    fotos: [],
    destaque: false,
    arte: "/casos/arte/tjrj.webp"
  },
  {
    slug: "band-otogrupo",
    ato: 3,
    ordem: 140,
    titulo: "Comerciais e vinhetas",
    org: "Band, Otogrupo, Atmos 3, Zura",
    papel: "Edição, motion e finalização",
    inicio: "2009-12",
    fim: "2010-02",
    rotulo: "2009 — 2010",
    cidade: "Rio de Janeiro, RJ",
    objeto: "tvset",
    cor: "#fb8c00",
    corSec: "#8e24aa",
    linha: "Comercial de TV aberta, logo animado e vinheta de site — o cardápio de quem vive de encomenda.",
    resumo: "Um punhado de peças curtas do mesmo período: comercial para a **Band** com canal alpha entregue separado, logo animado do **Otogrupo**, vinheta da **Atmos 3** e a vinheta do comercial do site **zura.com.br**.",
    contexto: "Entregar \"com alpha\" é o detalhe que denuncia o profissional: significa que a emissora vai poder sobrepor a peça a qualquer fundo, e que o trabalho foi feito pensando no próximo elo da cadeia, não só na visualização bonita. Peça de 4 a 8 segundos é o exercício mais duro de motion: não sobra um quadro para hesitar.",
    feitos: [
      "Comercial Band (entrega com canal alpha)",
      "Logo animado Otogrupo",
      "Vinheta Atmos 3",
      "Vinheta do comercial do zura.com.br"
    ],
    ferramentas: [
      "After Effects",
      "Premiere"
    ],
    hardware: [
      "Ilha PC"
    ],
    prova: "Acervo: 5 peças com descrição, entre dez/2009 e fev/2010.",
    videos: [
      {
        id: "hKyZo93It-k",
        titulo: "master_low4-Desktop.m4v",
        dur: "0:19",
        data: "2009-12-11",
        vis: "Público",
        views: "19"
      },
      {
        id: "ENC4UmzJx6E",
        titulo: "master_low4.mov",
        dur: "0:19",
        data: "2009-12-11",
        vis: "Público",
        views: "9"
      },
      {
        id: "sw3MZo05bCQ",
        titulo: "sounds good com alpha p COMERCIAL BAND.f4v",
        dur: "0:05",
        data: "2010-02-11",
        vis: "Público",
        views: "16"
      },
      {
        id: "oHb1TerlwfA",
        titulo: "logo otogrupo-iPhone.m4v",
        dur: "0:04",
        data: "2010-02-11",
        vis: "Público",
        views: "12"
      },
      {
        id: "EhPD3GHeZfk",
        titulo: "garrafas.wmv",
        dur: "1:43",
        data: "2010-03-29",
        vis: "Público",
        views: "20"
      }
    ],
    playlist: "Comerciais e vinhetas",
    playlistId: "PLeozMLbKfizc",
    fotos: [],
    destaque: false,
    arte: "/casos/arte/band-otogrupo.webp"
  },
  {
    slug: "obras-corregos",
    ato: 3,
    ordem: 150,
    titulo: "Córregos, Rua Picão e a Tapera",
    org: "Documentário comunitário",
    papel: "Captação e montagem",
    inicio: "2011-08",
    fim: "2011-11",
    rotulo: "2011",
    cidade: "Interior / periferia — RJ",
    objeto: "riverstone",
    cor: "#00897b",
    corSec: "#a1887f",
    linha: "Vinte peças de campo: reunião de moradores, entrevista na sala de casa, o córrego, a van da escola.",
    resumo: "O maior bloco temático de 2011 no acervo. Dois filmes longos — *01 Córregos* e *02 Rua Picão*, de mais de vinte minutos cada — cercados de material de campo: assembleias comunitárias, entrevistas em casa, crianças na van, o rio, a pedra.",
    contexto: "É o oposto exato do trabalho de vinheta. Aqui não há prazo de emissora nem cliente aprovando versão: há gente falando na própria sala, com o áudio que a sala tem, e uma câmera que precisa ser esquecida para a conversa acontecer. Editar isso é escolher quem fala e por quanto tempo — a decisão mais política que um editor toma. O material tem a marca do documentário direto: plano longo, sem locução por cima.",
    feitos: [
      "Dois documentários de mais de 20 minutos",
      "Cobertura de assembleias comunitárias",
      "Entrevistas domiciliares",
      "Registro do córrego, da Tapera e do transporte escolar"
    ],
    ferramentas: [
      "DSLR / HDV",
      "Premiere"
    ],
    hardware: [
      "Captação em campo, som direto"
    ],
    prova: "Acervo: 20 peças entre agosto e novembro de 2011, verificadas por miniatura.",
    videos: [
      {
        id: "0uR9EFDcBnA",
        titulo: "TEASER",
        dur: "1:53",
        data: "2011-07-19",
        vis: "Público",
        views: "7"
      },
      {
        id: "amZRTvP03TQ",
        titulo: "TAPERA VAN X Desktop",
        dur: "6:29",
        data: "2011-08-18",
        vis: "Público",
        views: "8"
      },
      {
        id: "t-koMpCVP4g",
        titulo: "02 RUA PICAO FULL Desktop",
        dur: "21:10",
        data: "2011-08-24",
        vis: "Público",
        views: "9"
      },
      {
        id: "f-0LHu6K_JE",
        titulo: "01 CORREGOS H2642 Desktop",
        dur: "21:41",
        data: "2011-08-24",
        vis: "Público",
        views: "1"
      },
      {
        id: "Jx-Rj0oHYJE",
        titulo: "Tijolo",
        dur: "4:02",
        data: "2011-11-16",
        vis: "Público",
        views: "74"
      },
      {
        id: "YKzkV2lpgik",
        titulo: "Coco",
        dur: "3:21",
        data: "2011-11-16",
        vis: "Público",
        views: "23"
      },
      {
        id: "OwDgpWMbKWo",
        titulo: "20111112 220809",
        dur: "1:31",
        data: "2011-11-16",
        vis: "Público",
        views: "26"
      },
      {
        id: "L0LKHMHe1qs",
        titulo: "20111112 192712",
        dur: "0:31",
        data: "2011-11-16",
        vis: "Público",
        views: "7"
      },
      {
        id: "ng_zobXgodo",
        titulo: "20111112 192431",
        dur: "0:15",
        data: "2011-11-16",
        vis: "Público",
        views: "8"
      },
      {
        id: "pnyuUOD40z0",
        titulo: "20111112 164831",
        dur: "0:49",
        data: "2011-11-16",
        vis: "Público",
        views: "6"
      },
      {
        id: "n_iHVl3AQm4",
        titulo: "20111112 192547",
        dur: "0:10",
        data: "2011-11-16",
        vis: "Público",
        views: "9"
      },
      {
        id: "WvKRXVaAsnY",
        titulo: "20111112 192558",
        dur: "0:38",
        data: "2011-11-16",
        vis: "Privado",
        views: "3"
      },
      {
        id: "E0gJMRyjj04",
        titulo: "20111112 192502",
        dur: "0:09",
        data: "2011-11-16",
        vis: "Público",
        views: "7"
      },
      {
        id: "xFHK_gDOlus",
        titulo: "20111112 164806",
        dur: "0:23",
        data: "2011-11-16",
        vis: "Público",
        views: "4"
      },
      {
        id: "4KU0qVd0jCU",
        titulo: "20111112 164422",
        dur: "3:05",
        data: "2011-11-16",
        vis: "Público",
        views: "0"
      },
      {
        id: "eVvqELFCqtc",
        titulo: "20111112 164023",
        dur: "3:56",
        data: "2011-11-16",
        vis: "Público",
        views: "1"
      },
      {
        id: "srrIeSxbaCw",
        titulo: "20111112 163121",
        dur: "1:19",
        data: "2011-11-16",
        vis: "Público",
        views: "2"
      },
      {
        id: "GrNuktABNsw",
        titulo: "20111112 163911",
        dur: "0:17",
        data: "2011-11-16",
        vis: "Público",
        views: "3"
      },
      {
        id: "Cp01ffeibXg",
        titulo: "20111112 162853",
        dur: "1:44",
        data: "2011-11-16",
        vis: "Público",
        views: "2"
      },
      {
        id: "ok1oUsys0mU",
        titulo: "20111112 162023",
        dur: "0:36",
        data: "2011-11-16",
        vis: "Público",
        views: "1"
      }
    ],
    playlist: "Córregos e Rua Picão — documentário",
    playlistId: "PLSbuo7jG0wfM",
    fotos: [],
    destaque: false,
    arte: "/casos/arte/obras-corregos.webp"
  },
  {
    slug: "moda-publicidade",
    ato: 3,
    ordem: 160,
    titulo: "Moda e publicidade",
    org: "Opalocka, Werner, WDF, Bazar Fashion, Zero Zen, Duas Rodas",
    papel: "Montagem e finalização de campanha",
    inicio: "2011-01",
    fim: "2012-12",
    rotulo: "2011 — 2012",
    cidade: "Rio de Janeiro, RJ",
    objeto: "lens",
    cor: "#ec407a",
    corSec: "#ffd54f",
    linha: "Vinte peças de campanha de moda — coleção de verão, editorial de beleza, catálogo e calendário.",
    resumo: "Um corpo de trabalho publicitário consistente: filmes de coleção para **Werner** e **Opalocka**, editoriais de beleza, **Bazar Fashion**, a série *girl*, **WDF** e o vídeo-catálogo **Duas Rodas**. Peças de dois a três minutos, cada uma com master, versão baixa e variação.",
    contexto: "Moda é o gênero em que o corte é música. Não há diálogo para segurar a estrutura: o que segura é ritmo, respiração e cor. O acervo mostra o processo inteiro — `MASTER`, `MASTERXX`, `MASTERXXX`, `low`, `h264`, `Desktop` — que é o vocabulário de quem entrega para agência e recebe pedido de alteração. E mostra outra coisa: em 2011 ele já dominava correção de cor como linguagem, não como conserto.",
    feitos: [
      "Filmes de coleção (Werner verão, Opalocka)",
      "Editoriais de beleza e série girl",
      "Bazar Fashion",
      "WDF",
      "Vídeo-catálogo Duas Rodas"
    ],
    ferramentas: [
      "Premiere",
      "After Effects",
      "Correção de cor"
    ],
    hardware: [
      "DSLR HD",
      "Ilha PC"
    ],
    prova: "Acervo: 20 peças entre 2011 e 2012, conteúdo confirmado por miniatura.",
    videos: [
      {
        id: "AqeoYewtTtc",
        titulo: "girlIII Desktop",
        dur: "0:31",
        data: "2011-02-03",
        vis: "Público",
        views: "15"
      },
      {
        id: "phvrkdyomyY",
        titulo: "girl3 Desktop",
        dur: "0:26",
        data: "2011-02-03",
        vis: "Público",
        views: "14"
      },
      {
        id: "IV9zBnYi5v8",
        titulo: "girlVFinal Desktop",
        dur: "0:31",
        data: "2011-03-02",
        vis: "Público",
        views: "18"
      },
      {
        id: "ZK_XjrYj840",
        titulo: "Bazar Fashion Desktop",
        dur: "1:29",
        data: "2011-05-17",
        vis: "Público",
        views: "89"
      },
      {
        id: "m06CpNZv75Y",
        titulo: "girlX",
        dur: "0:31",
        data: "2011-05-18",
        vis: "Público",
        views: "232"
      },
      {
        id: "8f3ZQSXztsM",
        titulo: "Bazar FashionHD MASTER",
        dur: "2:04",
        data: "2011-05-18",
        vis: "Público",
        views: "291"
      },
      {
        id: "-0pzvcXyx_8",
        titulo: "WDF MASTERXXX Desktop",
        dur: "2:32",
        data: "2011-05-20",
        vis: "Público",
        views: "5.377"
      },
      {
        id: "6BJuIPBiZRU",
        titulo: "WDF MASTERXX Desktop",
        dur: "2:32",
        data: "2011-05-20",
        vis: "Público",
        views: "313"
      },
      {
        id: "GTdJaf8wRlE",
        titulo: "wdfH264",
        dur: "2:32",
        data: "2011-05-24",
        vis: "Público",
        views: "9"
      },
      {
        id: "3etwFgfaAgw",
        titulo: "tacoproposta01-iPhone.m4v",
        dur: "0:17",
        data: "2011-06-12",
        vis: "Público",
        views: "7"
      },
      {
        id: "RK-y7xJya20",
        titulo: "zero zen",
        dur: "2:36",
        data: "2011-07-20",
        vis: "Público",
        views: "200"
      },
      {
        id: "aqKmiWlGXPQ",
        titulo: "Zero Zen MASTER SD",
        dur: "3:06",
        data: "2011-08-02",
        vis: "Público",
        views: "103"
      },
      {
        id: "42CgbSAZisg",
        titulo: "Werner 01 VERAO MASTER H264sdF",
        dur: "2:46",
        data: "2011-08-31",
        vis: "Público",
        views: "19"
      },
      {
        id: "wjsaqoweNsg",
        titulo: "werner h264pb Desktop",
        dur: "2:32",
        data: "2011-08-31",
        vis: "Público",
        views: "3"
      },
      {
        id: "G6yw3h0jxLI",
        titulo: "werner h264 Desktop",
        dur: "2:32",
        data: "2011-08-31",
        vis: "Público",
        views: "13"
      },
      {
        id: "GO2miNP06Oc",
        titulo: "Opalocka goldh264 Desktop",
        dur: "1:00",
        data: "2011-09-10",
        vis: "Público",
        views: "13"
      },
      {
        id: "IZhhLKXLtgQ",
        titulo: "Opalocka gold low",
        dur: "2:18",
        data: "2011-10-12",
        vis: "Público",
        views: "157"
      },
      {
        id: "Ta2TrGE99Xc",
        titulo: "calendario MASTERH264.mov",
        dur: "4:38",
        data: "2011-11-08",
        vis: "Público",
        views: "458"
      },
      {
        id: "oMzeLspVo-M",
        titulo: "calendario MASTER Copy 01",
        dur: "6:03",
        data: "2011-11-22",
        vis: "Privado",
        views: "216"
      },
      {
        id: "KWLlAtve_ng",
        titulo: "dropskate",
        dur: "3:57",
        data: "2012-10-13",
        vis: "Público",
        views: "15"
      }
    ],
    playlist: "Moda e publicidade",
    playlistId: "PLc1NHiti-wyY",
    fotos: [],
    destaque: true,
    arte: "/casos/arte/moda-publicidade.webp"
  },
  {
    slug: "eventos",
    ato: 3,
    ordem: 170,
    titulo: "Eventos e festas",
    org: "Clientes particulares",
    papel: "Captação multicâmera e montagem",
    inicio: "2011-01",
    fim: "2011-12",
    rotulo: "2011",
    cidade: "Rio de Janeiro, RJ",
    objeto: "disco",
    cor: "#ab47bc",
    corSec: "#ffca28",
    linha: "Bodas de prata, festa com banda ao vivo, salão cheio — o trabalho que paga o mês.",
    resumo: "Cobertura de eventos particulares: as **bodas de prata de Beto e Andrea** em versão longa e resumida, e uma noite inteira registrada em treze arquivos, com banda tocando ao vivo.",
    contexto: "Evento é o teste mais honesto de um editor. A luz é a que tem, o áudio é o do salão, e não existe segunda tomada de um brinde. O material de 2011 vem com nome de câmera — `20111016 020144` — que é o arquivo cru, do jeito que saiu do cartão, às duas da manhã. Da mesma noite saem duas entregas: a de dez minutos e a de seis, porque o cliente sempre quer as duas.",
    feitos: [
      "Bodas de prata — versão longa e resumo",
      "Cobertura noturna multicâmera com banda ao vivo"
    ],
    ferramentas: [
      "Premiere"
    ],
    hardware: [
      "Câmeras HD, som ambiente"
    ],
    prova: "Acervo: 13 peças de 2011.",
    videos: [
      {
        id: "6rEwVuM71UU",
        titulo: "Bodas de prata Beto Andrea iPhone",
        dur: "4:48",
        data: "2011-04-21",
        vis: "Público",
        views: "13"
      },
      {
        id: "TfO0U_-RYVo",
        titulo: "Ouro parado iPhone",
        dur: "6:26",
        data: "2011-05-02",
        vis: "Público",
        views: "7"
      },
      {
        id: "aC9Xj4xNGq4",
        titulo: "BODAS DE PRATA Beto & Andrea",
        dur: "10:18",
        data: "2011-05-16",
        vis: "Público",
        views: "34"
      },
      {
        id: "EHDjT35qOBY",
        titulo: "20111016 020144",
        dur: "0:13",
        data: "2011-10-16",
        vis: "Público",
        views: "16"
      },
      {
        id: "MBlnKEGWGUo",
        titulo: "20111016 011006",
        dur: "1:00",
        data: "2011-10-16",
        vis: "Público",
        views: "20"
      },
      {
        id: "7R3JtSGvsxU",
        titulo: "20111016 011256",
        dur: "0:08",
        data: "2011-10-16",
        vis: "Público",
        views: "22"
      },
      {
        id: "VZrCJBacTDo",
        titulo: "20111016 010501",
        dur: "0:54",
        data: "2011-10-16",
        vis: "Público",
        views: "21"
      },
      {
        id: "fF-PCbPkwK0",
        titulo: "20111016 000018",
        dur: "0:21",
        data: "2011-10-16",
        vis: "Público",
        views: "16"
      },
      {
        id: "G9EZdx8fZQE",
        titulo: "20111016 021551",
        dur: "2:09",
        data: "2011-10-16",
        vis: "Público",
        views: "19"
      },
      {
        id: "PBoQpZCOf7I",
        titulo: "20111016 021307",
        dur: "2:10",
        data: "2011-10-16",
        vis: "Público",
        views: "17"
      },
      {
        id: "v5FYp9EbwMs",
        titulo: "20111016 021145",
        dur: "0:50",
        data: "2011-10-16",
        vis: "Público",
        views: "19"
      },
      {
        id: "OcXRHU1Brrc",
        titulo: "20111016 020931",
        dur: "2:11",
        data: "2011-10-16",
        vis: "Público",
        views: "12"
      },
      {
        id: "TjhQSpfndkI",
        titulo: "20111016 020600",
        dur: "3:29",
        data: "2011-10-16",
        vis: "Público",
        views: "14"
      }
    ],
    playlist: "Eventos",
    playlistId: "PLXJbd_-1qf4c",
    fotos: [],
    destaque: false,
    arte: "/casos/arte/eventos.webp"
  },
  {
    slug: "fermoplast",
    ato: 3,
    ordem: 180,
    titulo: "Fermoplast",
    org: "Fermoplast",
    papel: "Institucional industrial",
    inicio: "2012-05",
    fim: "2012-05",
    rotulo: "2012",
    cidade: "Rio de Janeiro, RJ",
    objeto: "gear",
    cor: "#607d8b",
    corSec: "#ffb300",
    linha: "Institucional de indústria — o gênero em que o desafio é fazer processo parecer interessante.",
    resumo: "Vídeo institucional em duas versões master, entregue para aprovação do cliente.",
    contexto: "Institucional de indústria é o exercício de transformar linha de produção em narrativa. Quem contrata quer ver a máquina; quem assiste precisa de um motivo para continuar. A saída de sempre é ritmo e escala — macro do detalhe, depois o plano que mostra o tamanho da coisa. Ele deixou o arquivo marcado como *\"vídeo para ser aprovado\"*, que é o estado em que 90% do trabalho institucional vive.",
    feitos: [
      "Institucional em duas versões master"
    ],
    ferramentas: [
      "Premiere",
      "After Effects"
    ],
    hardware: [
      "Ilha PC"
    ],
    prova: "Acervo: 2 peças, maio/2012.",
    videos: [
      {
        id: "RUKmmJfyK9w",
        titulo: "MASTER ONE-Desktop.m4v",
        dur: "3:02",
        data: "2012-05-04",
        vis: "Privado",
        views: "57"
      },
      {
        id: "8bRnxvlndn8",
        titulo: "Fermoplast master",
        dur: "3:03",
        data: "2012-05-08",
        vis: "Privado",
        views: "47"
      }
    ],
    playlist: null,
    playlistId: null,
    fotos: [],
    destaque: false,
    arte: "/casos/arte/fermoplast.webp"
  },
  {
    slug: "maua-2017",
    ato: 3,
    ordem: 190,
    titulo: "Mauá 2017",
    org: "Registro autoral",
    papel: "Captação e finalização",
    inicio: "2017-01",
    fim: "2017-12",
    rotulo: "2017",
    cidade: "Rio de Janeiro, RJ",
    objeto: "clapper",
    cor: "#00acc1",
    corSec: "#f4511e",
    linha: "Sete minutos de 2017 com tratamento de cor autoral.",
    resumo: "Peça de 2017 com correção de cor forte, guardada no acervo público.",
    contexto: "Fica no meio do período Fox, quando o dia inteiro era trabalhar dentro do padrão de uma emissora global. Peça autoral nesse contexto tem função de válvula: é onde o editor testa o que a grade não deixa. O tratamento de cor é o oposto do broadcast — saturado, quente, com blooming.",
    feitos: [
      "Captação e montagem",
      "Tratamento de cor autoral"
    ],
    ferramentas: [
      "Premiere",
      "Correção de cor"
    ],
    hardware: [
      "Câmera própria"
    ],
    prova: "Acervo: 1 peça, 2017. ⚠️ Cliente não identificado — ver HANDOFF.",
    videos: [
      {
        id: "jzBv12-B-IU",
        titulo: "MAUA 2017",
        dur: "6:54",
        data: "2017-04-23",
        vis: "Público",
        views: "18"
      }
    ],
    playlist: null,
    playlistId: null,
    fotos: [],
    destaque: false,
    arte: "/casos/arte/maua-2017.webp"
  },
  {
    slug: "drone-pioneiro",
    ato: 4,
    ordem: 200,
    titulo: "O Ar — piloto de drone desde 2013",
    org: "Operação própria",
    papel: "Piloto, operador de câmera aérea e instrutor",
    inicio: "2013-10",
    fim: "2016-12",
    rotulo: "2013 — 2016 · 71 voos no acervo",
    cidade: "Rio de Janeiro, RJ",
    objeto: "drone",
    cor: "#039be5",
    corSec: "#ffee58",
    linha: "Comprou um DJI Phantom no ano em que ele foi lançado, e treinou até poder aceitar qualquer trabalho.",
    resumo: "O Phantom 1 chegou ao mercado em janeiro de 2013. Em outubro de 2013 ele já estava publicando a primeira tentativa de voo — e em novembro, quatro dias de treino depois, escreveu: *\"agora me sinto confiante para aceitar qualquer trabalho que apareça\"*. São **71 peças aéreas** no acervo, de Grumari à Pedra de Itaúna, da ponte estaiada ao campo do Santa Mônica.",
    contexto: "Vale insistir no que era um drone em 2013, porque hoje não parece nada: **sem sensor de obstáculo, sem retorno de vídeo decente, sem seguir-me, sem tela**. Você voava olhando para o céu, com uma GoPro pendurada num gimbal que mal segurava, dez minutos de bateria, e o vento decidindo o resto. Ele treinou o *failsafe* de retorno por GPS de propósito, saiu do campo de visão de propósito, e voou à noite sabendo o risco — o texto dele sobre o voo noturno diz *\"quase bati no telhado subindo... a aterrissagem levou meio segundo, eu estava tremendo\"*. E o título mais orgulhoso do acervo inteiro é uma declaração técnica: **\"NO SOFTWARE OR YOUTUBE STABILIZATION WHATSOEVER\"** — a imagem está estável porque a mão estava, não porque o software consertou. Em 2015 ele já estava com o **Phantom 3 em 4K**, filmando às cinco da manhã. E já estava **formando outros pilotos** para atender um mercado maior.",
    feitos: [
      "Primeiros voos documentados em outubro de 2013 — o Phantom 1 tinha 9 meses de mercado",
      "Treino deliberado de failsafe GPS e voo fora do campo de visão",
      "Voo noturno com vento forte, documentado sem edulcorar o risco",
      "Séries aéreas: Pedra de Itaúna (5 partes), Grumari (10), ponte estaiada, Santa Mônica F.C.",
      "Migração para Phantom 3 4K em 2015",
      "Formação de novos pilotos para ampliar a operação",
      "Imagem estabilizada por pilotagem, sem estabilização de software"
    ],
    ferramentas: [
      "DJI Phantom 1 + GoPro",
      "DJI Phantom 3 4K",
      "Lens correction",
      "Premiere"
    ],
    hardware: [
      "Gimbal Zenmuse",
      "Sem FPV, sem sensor de obstáculo",
      "10 min de bateria"
    ],
    prova: "Acervo: 71 peças entre 2013 e 2016, com relatos escritos pelo próprio piloto em cada etapa do treino.",
    videos: [
      {
        id: "4E21h8ZTToc",
        titulo: "FIrst Attempt on flying a DJI Phantom",
        dur: "2:24",
        data: "2013-10-28",
        vis: "Público",
        views: "66"
      },
      {
        id: "wO1-kFvcdZo",
        titulo: "Second Attempt on flying the Phantom",
        dur: "5:17",
        data: "2013-10-30",
        vis: "Público",
        views: "26"
      },
      {
        id: "DZH6bLgMZ2E",
        titulo: "Third training morning",
        dur: "3:16",
        data: "2013-11-06",
        vis: "Público",
        views: "36"
      },
      {
        id: "CSKDb-i22j0",
        titulo: "Night Flight Phantom",
        dur: "2:31",
        data: "2013-11-07",
        vis: "Público",
        views: "14"
      },
      {
        id: "wO2fG_h2yqw",
        titulo: "Segundo voo santa monica",
        dur: "3:04",
        data: "2015-09-18",
        vis: "Público",
        views: "13"
      },
      {
        id: "O3Vs-o9sqV4",
        titulo: "Primeiro flight Santa Monica F.C.",
        dur: "2:00",
        data: "2015-09-18",
        vis: "Público",
        views: "10"
      },
      {
        id: "HiYr33C2gxs",
        titulo: "Voo Rasante Santa Monica 4k",
        dur: "1:06",
        data: "2015-09-18",
        vis: "Público",
        views: "12"
      },
      {
        id: "EFv_nGxW8BQ",
        titulo: "Sobrevoando arredores Santa Monica",
        dur: "2:32",
        data: "2015-09-18",
        vis: "Público",
        views: "25"
      },
      {
        id: "B3GNZ_EBrKg",
        titulo: "DJI 0013",
        dur: "0:20",
        data: "2015-09-18",
        vis: "Público",
        views: "2"
      },
      {
        id: "16mbWqqsx8M",
        titulo: "Paquito voando SM",
        dur: "3:47",
        data: "2015-09-18",
        vis: "Público",
        views: "14"
      },
      {
        id: "yzodrivmwcY",
        titulo: "Cópia de Voo Rasante Santa Monica",
        dur: "1:06",
        data: "2015-09-19",
        vis: "Público",
        views: "15"
      },
      {
        id: "HAHuvxqkJTQ",
        titulo: "First Flight maideen",
        dur: "3:07",
        data: "2015-09-19",
        vis: "Público",
        views: "20"
      },
      {
        id: "8tFKTRuq44E",
        titulo: "1 Voo P3 as 5 da manhã 4k",
        dur: "4:02",
        data: "2015-09-19",
        vis: "Público",
        views: "13"
      },
      {
        id: "j7Ryh0dUKmc",
        titulo: "Drone no Pedra de Itauna parte 3",
        dur: "6:06",
        data: "2015-10-13",
        vis: "Público",
        views: "395"
      },
      {
        id: "2slD8jBOVwQ",
        titulo: "Drone no Pedra de Itauna parte 2",
        dur: "7:07",
        data: "2015-10-13",
        vis: "Público",
        views: "1.661"
      },
      {
        id: "lBCAjowdvzc",
        titulo: "Drone no Pedra de Itauna parte 1",
        dur: "9:30",
        data: "2015-10-13",
        vis: "Público",
        views: "1.513"
      },
      {
        id: "M06W8L3g3jA",
        titulo: "Drone no Pedra de Itauna parte 5 final",
        dur: "3:54",
        data: "2015-10-13",
        vis: "Público",
        views: "164"
      },
      {
        id: "orAiMj-hqtw",
        titulo: "Drone no Pedra de Itauna 4 mega close na bandeira.",
        dur: "14:02",
        data: "2015-10-13",
        vis: "Público",
        views: "300"
      },
      {
        id: "rDdG8hVJOxc",
        titulo: "DJI 0005",
        dur: "2:27",
        data: "2015-10-14",
        vis: "Público",
        views: "8"
      },
      {
        id: "oDZsyHpZP6w",
        titulo: "DJI 0003",
        dur: "0:21",
        data: "2015-10-14",
        vis: "Público",
        views: "5"
      },
      {
        id: "RkJ23q5fg_Y",
        titulo: "DJI 0002",
        dur: "1:33",
        data: "2015-10-14",
        vis: "Público",
        views: "8"
      },
      {
        id: "R7Nzq_Bhrzs",
        titulo: "DJI 0007",
        dur: "4:49",
        data: "2015-10-14",
        vis: "Público",
        views: "5"
      },
      {
        id: "FfUaJsBe4Zg",
        titulo: "DJI 0001",
        dur: "4:04",
        data: "2015-10-14",
        vis: "Público",
        views: "12"
      },
      {
        id: "w_fHkoWzUJo",
        titulo: "Drone grumari 1",
        dur: "4:06",
        data: "2015-11-25",
        vis: "Público",
        views: "21"
      },
      {
        id: "dlSKwKw921M",
        titulo: "Drone grumari 2",
        dur: "1:56",
        data: "2015-11-25",
        vis: "Público",
        views: "6"
      },
      {
        id: "UNKyUCfFIbs",
        titulo: "Drone grumari 4",
        dur: "2:03",
        data: "2015-11-25",
        vis: "Público",
        views: "9"
      },
      {
        id: "Tgm0Kje-87Y",
        titulo: "Drone grumari 3",
        dur: "1:51",
        data: "2015-11-25",
        vis: "Público",
        views: "51"
      },
      {
        id: "8LCtWo9MW1E",
        titulo: "Drone grumari5",
        dur: "0:57",
        data: "2015-11-25",
        vis: "Público",
        views: "1"
      },
      {
        id: "8CFK97-9dV4",
        titulo: "Drone grumari 6",
        dur: "1:29",
        data: "2015-11-25",
        vis: "Público",
        views: "13"
      },
      {
        id: "vhSKgI2Mues",
        titulo: "Drone ponte estaiada 2",
        dur: "6:10",
        data: "2015-11-26",
        vis: "Público",
        views: "44"
      },
      {
        id: "p3Yh0GnGfzU",
        titulo: "Grumari 10",
        dur: "4:30",
        data: "2015-11-26",
        vis: "Público",
        views: "23"
      },
      {
        id: "WVLxLU-JpuU",
        titulo: "Drone grumari 9",
        dur: "1:47",
        data: "2015-11-26",
        vis: "Público",
        views: "19"
      },
      {
        id: "IvNxzmALG74",
        titulo: "Drone ponte estaiada 1",
        dur: "0:21",
        data: "2015-11-26",
        vis: "Público",
        views: "17"
      },
      {
        id: "shiXAk1GP2A",
        titulo: "DJI 0001",
        dur: "14:01",
        data: "2015-12-09",
        vis: "Público",
        views: "15"
      },
      {
        id: "E-IA4LqV7pM",
        titulo: "DJI 0002",
        dur: "7:54",
        data: "2016-01-08",
        vis: "Público",
        views: "2"
      },
      {
        id: "Dw_GIS5Oros",
        titulo: "DJI 0001",
        dur: "3:50",
        data: "2016-01-08",
        vis: "Público",
        views: "5"
      },
      {
        id: "oJ9PD-nctCU",
        titulo: "DJI 0029",
        dur: "3:30",
        data: "2016-09-09",
        vis: "Público",
        views: "12"
      },
      {
        id: "2a2e1b7mxzQ",
        titulo: "DJI 0030",
        dur: "3:15",
        data: "2016-09-09",
        vis: "Público",
        views: "13"
      }
    ],
    playlist: "O Ar — voos 2013—2016",
    playlistId: "PLPJU1y7YoeIc",
    fotos: [],
    destaque: true,
    arte: "/casos/arte/drone-pioneiro.webp"
  },
  {
    slug: "trailer-recuts",
    ato: 4,
    ordem: 210,
    titulo: "Estudos de montagem",
    org: "Estudo próprio",
    papel: "Remontagem de clássicos",
    inicio: "2013-05",
    fim: "2013-08",
    rotulo: "2013",
    cidade: "Rio de Janeiro, RJ",
    objeto: "filmreel",
    cor: "#795548",
    corSec: "#ffd54f",
    linha: "Remontou 2001, Gatsby, Dirty Dancing e Romeu e Julieta em 1080p — de propósito, para treinar.",
    resumo: "Sete exercícios de remontagem de cenas de filmes conhecidos, todos em 1080p, feitos no ano anterior à entrada na Fox. Não é portfólio de cliente: é escala de músico.",
    contexto: "Remontar uma cena que já foi montada por um grande editor é o exercício mais duro e mais útil que existe: você tem o mesmo material bruto e uma referência para comparar, então não dá para se enganar. Ele escolheu casos difíceis de propósito — **2001** (ritmo lento e geométrico), **O Grande Gatsby** (excesso), **Dirty Dancing** (música como estrutura) e **Romeu e Julieta**. Um ano depois estava na Fox International Channels.",
    feitos: [
      "Remontagem de 2001",
      "O Grande Gatsby",
      "Dirty Dancing",
      "Romeu e Julieta",
      "Change-Up (com e sem áudio, para comparar o efeito do som na montagem)"
    ],
    ferramentas: [
      "Avid / Premiere",
      "1080p"
    ],
    hardware: [
      "Estação própria"
    ],
    prova: "Acervo: 7 peças privadas de 2013 — inclusive a mesma cena em duas versões, com e sem áudio.",
    videos: [
      {
        id: "ChrDHv-Glsw",
        titulo: "change up baby scene w audio",
        dur: "1:13",
        data: "2013-12-19",
        vis: "Privado",
        views: "5"
      },
      {
        id: "Eu9BP6F9vv8",
        titulo: "change up baby scene",
        dur: "0:52",
        data: "2013-12-19",
        vis: "Privado",
        views: "2"
      },
      {
        id: "mTKDn2pX5hc",
        titulo: "change up edit 4 1080P",
        dur: "0:40",
        data: "2013-12-30",
        vis: "Privado",
        views: "5"
      },
      {
        id: "FVLrCth8PUk",
        titulo: "Dirty Dancing edit 2 1080p",
        dur: "1:00",
        data: "2013-12-30",
        vis: "Privado",
        views: "2"
      },
      {
        id: "q11lE6NYvtw",
        titulo: "the great gatsby edit 21080p",
        dur: "0:38",
        data: "2013-12-30",
        vis: "Privado",
        views: "8"
      },
      {
        id: "_T_VtNarQPM",
        titulo: "romeo e julieta 1080P",
        dur: "0:38",
        data: "2013-12-30",
        vis: "Privado",
        views: "1"
      },
      {
        id: "P6ZrdGXQc3w",
        titulo: "Edit 2 2001 1080p",
        dur: "0:42",
        data: "2013-12-30",
        vis: "Privado",
        views: "5"
      }
    ],
    playlist: "Estudos de montagem",
    playlistId: null,
    fotos: [],
    destaque: false,
    arte: "/casos/arte/trailer-recuts.webp"
  },
  {
    slug: "set-palestra",
    ato: 4,
    ordem: 220,
    titulo: "SET 2013 — Dr. Adilson Pontes Malta",
    org: "SET — Sociedade Brasileira de Engenharia de Televisão",
    papel: "Registro e edição",
    inicio: "2013-08",
    fim: "2013-08",
    rotulo: "2013",
    cidade: "São Paulo, SP",
    objeto: "mic",
    cor: "#455a64",
    corSec: "#4fc3f7",
    linha: "Registro da palestra na maior convenção de engenharia de TV do país.",
    resumo: "Oito minutos da palestra do Dr. Adilson Pontes Malta no congresso da SET de 2013.",
    contexto: "O congresso da SET é onde a indústria brasileira de televisão discute padrão, codec e transmissão. Estar lá gravando em 2013 — no meio da consolidação do HD e do começo da conversa sobre 4K — é estar na sala onde as regras do ofício estavam sendo escritas.",
    feitos: [
      "Captação e edição da palestra"
    ],
    ferramentas: [
      "HD",
      "Premiere"
    ],
    hardware: [
      "Câmera própria"
    ],
    prova: "Acervo: 1 peça, 2013.",
    videos: [
      {
        id: "1rEsrrY4fJI",
        titulo: "Palestra do Dr. Adilson Pontes Malta na SET 2013",
        dur: "8:25",
        data: "2013-08-29",
        vis: "Público",
        views: "91"
      }
    ],
    playlist: null,
    playlistId: null,
    fotos: [],
    destaque: false,
    arte: "/casos/arte/set-palestra.webp"
  },
  {
    slug: "fox-sports",
    ato: 5,
    ordem: 230,
    titulo: "Fox International Channels · Fox Sports",
    org: "Fox International Channels (20th Century Fox)",
    papel: "Editor Avid sênior",
    inicio: "2014-09",
    fim: "2018-12",
    rotulo: "2014 — 2018 · 4 anos e 4 meses",
    cidade: "Rio de Janeiro, RJ",
    objeto: "avid",
    cor: "#1565c0",
    corSec: "#ffd600",
    linha: "Copa do Mundo, Olimpíadas e filmes de Hollywood, para mais de 20 milhões de espectadores por dia.",
    resumo: "Quatro anos e quatro meses como editor sênior nos canais internacionais da 20th Century Fox. Editou de Copa do Mundo a filme de Hollywood. O número que ele usa no próprio resumo é **mais de 20 milhões de espectadores diariamente**.",
    contexto: "Editar esporte numa emissora global é o regime mais exigente da profissão: o material chega enquanto o jogo acontece, a peça vai ao ar no intervalo, e o erro é ao vivo. O fluxo era **Avid Media Composer sobre storage compartilhado** — vários editores no mesmo projeto, mídia gerenciada centralmente, e a ordem sagrada de nunca quebrar o que o colega ao lado está usando. O acervo tem a assinatura dessa rotina no nome dos arquivos: `BDF 241018 EURICO`, `HFS 130718 ZUKERMAN`, `EVE 310718`, `VCP 251219 JASON ... BASE XAVC` — sigla do programa, data e pauta, que é como se nomeia quando são dezenas de peças por semana. E tem os testes de GC (`TESTE CG AMOROSO RB`, com a anotação *\"impact, caixa maior, clubes = título\"*), que é o editor discutindo tipografia de arte gráfica no ar. No currículo em inglês está a outra metade do trabalho, a que não aparece na tela: *\"trabalhei com gerentes de projeto para desenvolver e implementar estratégias de redução de custo e otimização de recursos\"*.",
    feitos: [
      "Copas do Mundo (2014 e 2018) e Jogos Olímpicos do Rio (2016)",
      "Edição de filmes de Hollywood para os canais do grupo",
      "Programas diários: pautas, VTs e clipes com sigla, data e prazo de intervalo",
      "Vinhetas, bumpers, pacotes de 8 e 20 minutos e loops de vinhetas",
      "Testes e padronização de arte gráfica no ar (GC)",
      "Trabalho com gerentes de projeto em redução de custo e otimização de recursos",
      "Copa interna da Fox e Copa ACERJ — cobertura completa com visão tática",
      "Fox Flight — imagem aérea para o canal"
    ],
    ferramentas: [
      "Avid Media Composer",
      "Storage compartilhado",
      "XAVC / Sony XDCAM",
      "After Effects"
    ],
    hardware: [
      "Ilhas Avid em rede",
      "1080i broadcast",
      "Prazo de intervalo"
    ],
    prova: "Currículo e LinkedIn — \"Avid Editor, September 2014 – December 2018\". Resumo em português: \"Trabalhei na Copa do Mundo, nos Jogos Olímpicos e na maioria das principais redes de TV no Brasil, com mais de 20 milhões de espectadores DIARIAMENTE.\" Acervo: 31 peças com nomenclatura de operação diária.",
    videos: [
      {
        id: "vz9ujJQsWUI",
        titulo: "Futebol no aterro Fox na esquerda FX na direita parte 3 de 3",
        dur: "1:59",
        data: "2015-09-22",
        vis: "Público",
        views: "18"
      },
      {
        id: "5r4aN70CxCM",
        titulo: "Futebol no aterro Fox na esquerda FX na direita parte 2 de 3",
        dur: "11:29",
        data: "2015-09-22",
        vis: "Público",
        views: "26"
      },
      {
        id: "G7QQcO1AL_Q",
        titulo: "Gol Ricardo Lay copa ACERJ",
        dur: "1:18",
        data: "2015-09-22",
        vis: "Público",
        views: "127"
      },
      {
        id: "mS0t3p2f1gw",
        titulo: "Futebol no aterro Fox na esquerda FX na direita parte 1 de 3",
        dur: "9:15",
        data: "2015-09-22",
        vis: "Público",
        views: "56"
      },
      {
        id: "wi8oQBNeOXE",
        titulo: "Fox Flight",
        dur: "12:00",
        data: "2015-10-14",
        vis: "Público",
        views: "14"
      },
      {
        id: "afmzPOBi8Zw",
        titulo: "Segundo jogo copa Fox entrada e primeiro tempo",
        dur: "11:40",
        data: "2015-11-25",
        vis: "Público",
        views: "36"
      },
      {
        id: "R7Engu8tywU",
        titulo: "Copa interna Fox Jogo 1 / segundo tempo",
        dur: "7:18",
        data: "2015-11-25",
        vis: "Público",
        views: "5"
      },
      {
        id: "oEtdR9w9qOE",
        titulo: "FUT FOX 3 PARTE5",
        dur: "14:02",
        data: "2015-12-02",
        vis: "Público",
        views: "20"
      },
      {
        id: "k8xgkts7Pa8",
        titulo: "FUT FOX 3 PARTE6",
        dur: "3:09",
        data: "2015-12-02",
        vis: "Público",
        views: "10"
      },
      {
        id: "-VJ_e5QaIOk",
        titulo: "FUT FOX 3 PARTE4",
        dur: "3:41",
        data: "2015-12-02",
        vis: "Público",
        views: "27"
      },
      {
        id: "oHq5xbqUSB0",
        titulo: "FUTFOX3 1TEMPO",
        dur: "22:21",
        data: "2015-12-02",
        vis: "Público",
        views: "69"
      },
      {
        id: "PhYFJF8ApbQ",
        titulo: "FUT FOX 3 PARTE2",
        dur: "9:04",
        data: "2015-12-02",
        vis: "Público",
        views: "18"
      },
      {
        id: "srkz4CsdIak",
        titulo: "FUT FOX 3 - PARTE1",
        dur: "0:02",
        data: "2015-12-02",
        vis: "Público",
        views: "8"
      },
      {
        id: "MtZNUuJ6ZZ8",
        titulo: "INTRO FUT FOX3",
        dur: "4:30",
        data: "2015-12-02",
        vis: "Público",
        views: "9"
      },
      {
        id: "L2cRC70nFGg",
        titulo: "FOX FUT 4 Segunda parte",
        dur: "4:26",
        data: "2015-12-09",
        vis: "Público",
        views: "12"
      },
      {
        id: "O3DH-kno0kM",
        titulo: "FUTFOX4 1e2TEMPO",
        dur: "21:59",
        data: "2015-12-10",
        vis: "Público",
        views: "62"
      },
      {
        id: "_l5Z6vsTbVU",
        titulo: "FUTFOX1",
        dur: "1:04:13",
        data: "2015-12-21",
        vis: "Público",
        views: "220"
      },
      {
        id: "qAczUjoulKA",
        titulo: "BDF 241018 EURICO",
        dur: "5:21",
        data: "2018-01-24",
        vis: "Público",
        views: "5"
      },
      {
        id: "gQo_MXIVcrg",
        titulo: "HFS 160618 VTDANIEL",
        dur: "4:27",
        data: "2018-07-15",
        vis: "Público",
        views: "4"
      },
      {
        id: "WqAOqQuH8Fw",
        titulo: "EVE 310718 CLIPENACXDEF md",
        dur: "0:31",
        data: "2018-08-02",
        vis: "Público",
        views: "6"
      },
      {
        id: "EOBOMcUHeDY",
        titulo: "VCP 251219 JASON two tales BASE XAVC",
        dur: "5:45",
        data: "2018-12-26",
        vis: "Público",
        views: "11"
      },
      {
        id: "Bx9ja1I5eHU",
        titulo: "Central Fox Eduardo Elias e Marina Ferrari agradecendo pela bela edição",
        dur: "0:38",
        data: "2023-02-22",
        vis: "Público",
        views: "343"
      }
    ],
    playlist: "Fox Sports — operação diária",
    playlistId: "PLI-Lpn32wmgo",
    fotos: [
      {
        src: "/casos/foto/faya-fox-set.webp",
        legenda: "O estúdio da Fox Sports no Rio, com a equipe em pé no cenário. Foto dele, 2020."
      }
    ],
    destaque: true,
    arte: "/casos/arte/fox-sports.webp"
  },
  {
    slug: "petrobras-ibama",
    ato: 5,
    ordem: 240,
    titulo: "Petrobras · IBAMA",
    org: "Petrobras / IBAMA",
    papel: "Edição e autoria de DVD",
    inicio: "2014-01",
    fim: "2014-12",
    rotulo: "2014",
    cidade: "Rio de Janeiro, RJ",
    objeto: "cdrom",
    cor: "#2e7d32",
    corSec: "#fdd835",
    linha: "DVD de seminário para a maior empresa do país e o órgão ambiental federal.",
    resumo: "Duas amostras no acervo: o exemplo de DVD para seminário da Petrobras e a peça Petrobras/IBAMA.",
    contexto: "Trabalho para Petrobras e IBAMA no mesmo pacote significa material com dupla revisão — a técnica e a ambiental — e entrega em mídia física, que em 2014 ainda era o padrão para seminário corporativo porque garantia que o vídeo tocasse em qualquer sala, sem depender da rede do auditório.",
    feitos: [
      "Edição do conteúdo do seminário",
      "Autoria e amostra de DVD"
    ],
    ferramentas: [
      "Premiere",
      "Autoria DVD"
    ],
    hardware: [
      "Ilha PC"
    ],
    prova: "Acervo: 2 peças de 2014.",
    videos: [
      {
        id: "MXukhKHxygU",
        titulo: "Exemplo de DVD para seminário da Petrobras",
        dur: "2:55",
        data: "2014-03-07",
        vis: "Público",
        views: "60"
      },
      {
        id: "gxEDVJ36Dak",
        titulo: "Petrobras IBAMA sample",
        dur: "2:54",
        data: "2014-03-10",
        vis: "Público",
        views: "6"
      }
    ],
    playlist: null,
    playlistId: null,
    fotos: [],
    destaque: false,
    arte: "/casos/arte/petrobras-ibama.webp"
  },
  {
    slug: "apple-legendagem",
    ato: 5,
    ordem: 250,
    titulo: "Apple — painel legendado",
    org: "Apple",
    papel: "Edição, correção e legendagem PT/EN",
    inicio: "2014-01",
    fim: "2014-12",
    rotulo: "2014 · retomado em 2023",
    cidade: "Rio de Janeiro, RJ",
    objeto: "ipad",
    cor: "#37474f",
    corSec: "#e0e0e0",
    linha: "Um painel de quase meia hora, editado, corrigido e legendado — em sete versões.",
    resumo: "Um painel de 28 minutos sobre cinema, com a marca da Apple no cenário, editado e legendado. O acervo guarda a cadeia inteira de versões: *editado, falta tratar áudio* → *editado finalizado corrigido* → *corrigido legpt1* → *legpt2* → *legpt123*.",
    contexto: "A sequência de nomes é o próprio fluxo de pós contado sem querer: primeiro fecha a montagem, depois trata o áudio, depois corrige, e só então legenda — em blocos, porque legendar 28 minutos de fala espontânea em duas línguas é o trabalho mais lento da cadeia. Legenda de painel tem uma dificuldade a mais: as pessoas se atropelam, e a legenda precisa escolher. Em 2023 a peça foi republicada em versão pública, nove anos depois.",
    feitos: [
      "Montagem do painel completo",
      "Tratamento de áudio",
      "Correção de cor",
      "Legendagem em português sobre fala em inglês, em três blocos"
    ],
    ferramentas: [
      "Premiere",
      "Legendagem",
      "Tratamento de áudio"
    ],
    hardware: [
      "Ilha PC"
    ],
    prova: "Acervo: 7 versões, de 2014 a 2023.",
    videos: [
      {
        id: "IJDWQcvmCd8",
        titulo: "Apple EDITADO falta tratar audio",
        dur: "28:55",
        data: "2014-05-23",
        vis: "Privado",
        views: "5"
      },
      {
        id: "oOgsVM5P6vs",
        titulo: "Apple EDITADO finalizado corrigido",
        dur: "28:41",
        data: "2014-05-31",
        vis: "Privado",
        views: "1"
      },
      {
        id: "ulxAK_7YtEY",
        titulo: "Apple EDITADO CORRIGIDO",
        dur: "28:41",
        data: "2014-06-02",
        vis: "Privado",
        views: "19"
      },
      {
        id: "IJfUD_1qr20",
        titulo: "Apple EDITADO CORRIGIDO legpt123",
        dur: "28:41",
        data: "2014-07-25",
        vis: "Privado",
        views: "1"
      },
      {
        id: "hHGw2pd0L6A",
        titulo: "Apple EDITADO CORRIGIDO legpt2",
        dur: "9:05",
        data: "2014-07-25",
        vis: "Privado",
        views: "1"
      },
      {
        id: "UY2AcaHwPGA",
        titulo: "Apple EDITADO CORRIGIDO legpt1",
        dur: "11:13",
        data: "2014-07-25",
        vis: "Privado",
        views: "2"
      },
      {
        id: "SQ5vUQS4Biw",
        titulo: "Apple EDITADO CORRIGIDO legpt123X",
        dur: "28:41",
        data: "2023-10-10",
        vis: "Público",
        views: "5"
      }
    ],
    playlist: "Apple — painel",
    playlistId: null,
    fotos: [],
    destaque: false,
    arte: "/casos/arte/apple-legendagem.webp"
  },
  {
    slug: "vinhetas-cg",
    ato: 5,
    ordem: 260,
    titulo: "Vinhetas e testes de GC",
    org: "Interno",
    papel: "Motion e arte gráfica de TV",
    inicio: "2014-01",
    fim: "2018-12",
    rotulo: "2014 — 2018",
    cidade: "Rio de Janeiro, RJ",
    objeto: "tvset",
    cor: "#f4511e",
    corSec: "#26c6da",
    linha: "As peças de 6 e 10 segundos que ninguém credita e sem as quais nenhum canal existe.",
    resumo: "Loops, bumpers, aberturas e testes de gerador de caracteres do período de emissora.",
    contexto: "Vinheta é a assinatura de um canal e a coisa mais reescrita da grade. Uma peça de seis segundos passa por dezenas de versões porque muda a cor da temporada, muda o patrocinador, muda a fonte. O acervo tem `MAIN`, `MAIN2`, `monstrov3`, `monstrov4` — a numeração é a história do trabalho.",
    feitos: [
      "Aberturas e bumpers",
      "Loops de intervalo",
      "Testes de gerador de caracteres"
    ],
    ferramentas: [
      "After Effects",
      "Avid"
    ],
    hardware: [
      "Ilha de arte"
    ],
    prova: "Acervo: 6 peças curtas.",
    videos: [
      {
        id: "QYQeNyJ8buY",
        titulo: "MAIN2",
        dur: "0:10",
        data: "2014-11-01",
        vis: "Público",
        views: "14"
      },
      {
        id: "TcVfU3DTb7s",
        titulo: "MAIN",
        dur: "0:10",
        data: "2014-11-01",
        vis: "Público",
        views: "9"
      },
      {
        id: "fLUWsgn3b5c",
        titulo: "monstrov3",
        dur: "0:06",
        data: "2014-11-05",
        vis: "Público",
        views: "9"
      },
      {
        id: "eP52ruuPEq0",
        titulo: "monstrov4",
        dur: "0:06",
        data: "2014-11-06",
        vis: "Público",
        views: "18"
      },
      {
        id: "N5_lNfsSLms",
        titulo: "SPOOMING",
        dur: "0:33",
        data: "2014-12-20",
        vis: "Público",
        views: "32"
      },
      {
        id: "PdJqa5hTj-8",
        titulo: "bg",
        dur: "0:15",
        data: "2018-06-26",
        vis: "Público",
        views: "14"
      }
    ],
    playlist: null,
    playlistId: null,
    fotos: [],
    destaque: false,
    arte: "/casos/arte/vinhetas-cg.webp"
  },
  {
    slug: "proclubs-bugados",
    ato: 6,
    ordem: 270,
    titulo: "Bugados FC · Pro Clubs",
    org: "Bugados FC / GameXtv",
    papel: "Jogador titular, produtor e editor da transmissão",
    inicio: "2018-07",
    fim: "2019-06",
    rotulo: "2018 — 2019 · 39 partidas",
    cidade: "Rio de Janeiro, RJ",
    objeto: "gamepad",
    cor: "#7e57c2",
    corSec: "#00e676",
    linha: "Saiu da Fox em dezembro e em maio já estava titular num time de liga, produzindo a própria transmissão.",
    resumo: "A Fox Sports acabou em dezembro de 2018. Ele não parou: virou **volante titular do Bugados FC** na segunda divisão de uma liga de Pro Clubs, e passou a produzir e publicar as partidas — 39 peças, várias de mais de 30 minutos, algumas de 41.",
    contexto: "É a mesma competência de sempre em outro suporte. Transmitir partida de Pro Clubs exige exatamente o que ele fazia na emissora: enquadrar a jogada, cortar no momento certo, dar contexto para quem chegou no meio, e publicar antes de a conversa esfriar. A diferença é que agora ele é o time, a produção e o canal ao mesmo tempo. Uma descrição dá o tom de quem entende narrativa esportiva: *\"um vídeo que marca o início da carreira de Jason O monstro. Deste vídeo em diante, nosso volante Monstro, que pode demorar, mas quando chega, resolve!\"* — ele está construindo personagem para um jogador de videogame.",
    feitos: [
      "Titular do Bugados FC na 2ª divisão de liga de Pro Clubs",
      "39 partidas publicadas — inclusive jogos completos de 30 a 41 minutos",
      "Narrativa e construção de personagem dos companheiros de time",
      "Cobertura da série contra Vírus da Bola, Estudiantes DLP, Damolé e Generaly FA"
    ],
    ferramentas: [
      "PS4 share",
      "Captura de gameplay",
      "Edição e publicação"
    ],
    hardware: [
      "PlayStation 4",
      "FIFA 18 / 19",
      "NBA 2K19"
    ],
    prova: "Acervo: 39 peças entre julho/2018 e junho/2019, com descrições autorais.",
    videos: [
      {
        id: "LnKOee4kA6o",
        titulo: "FIFA 18_20180821100454",
        dur: "6:43",
        data: "2018-08-21",
        vis: "Público",
        views: "1"
      },
      {
        id: "UQUYsAmrtho",
        titulo: "PROCLUBS FIFA 19 SERIE A BRASILEIRO E MAIS GAMEPLAYS",
        dur: "5:45",
        data: "2018-12-26",
        vis: "Público",
        views: "22"
      },
      {
        id: "pij8IjiRTlE",
        titulo: "PROClubs GameXtv Jason na Serie A do Brasilerio",
        dur: "2:31",
        data: "2018-12-26",
        vis: "Público",
        views: "4"
      },
      {
        id: "ABj4VihSJJ8",
        titulo: "FIFA 19_20190513210221",
        dur: "0:10",
        data: "2019-05-13",
        vis: "Público",
        views: "4"
      },
      {
        id: "ZDyZFSuFP1s",
        titulo: "FIFA 19_20190514014214",
        dur: "31:41",
        data: "2019-05-14",
        vis: "Público",
        views: "3"
      },
      {
        id: "zbwIVbBIRwM",
        titulo: "FIFA 19_20190514001436",
        dur: "15:43",
        data: "2019-05-14",
        vis: "Público",
        views: "5"
      },
      {
        id: "cNbkwCizCl8",
        titulo: "FIFA 19_20190513204219",
        dur: "23:33",
        data: "2019-05-14",
        vis: "Público",
        views: "4"
      },
      {
        id: "xY2KVNB1eU8",
        titulo: "BUGADOS FC X OFFLINE FOREVER",
        dur: "17:36",
        data: "2019-05-14",
        vis: "Público",
        views: "5"
      },
      {
        id: "tKU5_jdtKsg",
        titulo: "BUGADOS FC X VIRUS DA BOLA JOGO 1 PRIMEIRO TEMPO",
        dur: "8:25",
        data: "2019-05-14",
        vis: "Público",
        views: "5"
      },
      {
        id: "g-95I9v0X7s",
        titulo: "BUGADOS FC X VIRUS DA BOLA JOGO 1 SEGUNDO TEMPO",
        dur: "8:13",
        data: "2019-05-14",
        vis: "Público",
        views: "6"
      },
      {
        id: "O_CyZPcYYBE",
        titulo: "BUGADOS FC X VIRUS DA BOLA JOGO 2 PRIMEIRO TEMPO",
        dur: "9:03",
        data: "2019-05-14",
        vis: "Público",
        views: "2"
      },
      {
        id: "NKL_62hljJI",
        titulo: "BUGADOS FC X VIRUS DA BOLA JOGO 2 SEGUNDO TEMPO",
        dur: "9:35",
        data: "2019-05-14",
        vis: "Público",
        views: "2"
      }
    ],
    playlist: "Bugados FC — Pro Clubs",
    playlistId: "PLFeQH_CgaXf4",
    fotos: [],
    destaque: true,
    arte: "/casos/arte/proclubs-bugados.webp"
  },
  {
    slug: "games-machinima",
    ato: 6,
    ordem: 280,
    titulo: "Machinima — o portfólio dentro do jogo",
    org: "Autoral",
    papel: "Direção, captura e montagem em motor de jogo",
    inicio: "2020-11",
    fim: "2025-05",
    rotulo: "2020 — 2025",
    cidade: "Rio de Janeiro, RJ",
    objeto: "cube",
    cor: "#00e5ff",
    corSec: "#ff4081",
    linha: "Em 2020 ele refez o próprio portfólio dentro de um videogame — e escreveu por quê.",
    resumo: "A peça **Video Portfolio made with game** é uma declaração: o portfólio de um editor de trinta anos, apresentado com a tecnologia que ele estava estudando naquele momento. A descrição termina em agradecimento: *\"créditos de imagens a todos da FOX SPORTS, a melhor empresa que trabalhei e nunca deixarei de sentir saudade\"*.",
    contexto: "Fim de 2020: pandemia, e produção virtual saindo do laboratório para o set. Usar motor de jogo como estúdio — câmera virtual, cenário, iluminação — era exatamente o que a indústria começava a chamar de *virtual production*. Ele chegou lá pela porta do jogador, não pela do fornecedor. No mesmo período: um ensaio de banda de rock em Cobra Kai, uma conversa sobre os segredos de RPG em Cyberpunk 2077 na semana do lançamento, e depois MIR4 e Last War — este último publicado cru, de propósito: *\"o vídeo não está editado, você vai ver exatamente o quanto eu sou ruim\"*, porque a intenção era informar, não impressionar.",
    feitos: [
      "Video Portfolio made with game — o currículo montado dentro do jogo",
      "Cyberpunk 2077: leitura do RPG de mesa por quem jogou o original",
      "Ensaio de banda de rock encenado em Cobra Kai",
      "MIR4 e Last War — registro analítico, publicado sem edição de propósito"
    ],
    ferramentas: [
      "Motor de jogo como estúdio",
      "Captura",
      "Premiere"
    ],
    hardware: [
      "PC gamer",
      "Placa de captura"
    ],
    prova: "Acervo: 8 peças entre 2020 e 2025, com descrições autorais.",
    videos: [
      {
        id: "BxgGn9hWNRA",
        titulo: "Vi Top de Luxo Pentakill",
        dur: "2:24",
        data: "2013-03-11",
        vis: "Público",
        views: "430"
      },
      {
        id: "0i3cQko3fe0",
        titulo: "Jao Monstro",
        dur: "0:32",
        data: "2020-05-15",
        vis: "Público",
        views: "8"
      },
      {
        id: "8ffAm5SfeHY",
        titulo: "ENSAIO1 COBRA KAI",
        dur: "0:48",
        data: "2020-11-26",
        vis: "Público",
        views: "52"
      },
      {
        id: "kGax5WEAGDk",
        titulo: "Video Portfolio made with game",
        dur: "3:35",
        data: "2020-12-04",
        vis: "Público",
        views: "19"
      },
      {
        id: "bLrYgp9NFis",
        titulo: "Cyberpunk 2077 segredos do RPG",
        dur: "5:27",
        data: "2020-12-08",
        vis: "Público",
        views: "27"
      },
      {
        id: "kH4RnJBVvlg",
        titulo: "MAD SA 22 MIR4",
        dur: "4:46",
        data: "2022-09-25",
        vis: "Público",
        views: "21"
      }
    ],
    playlist: "Machinima e produção virtual",
    playlistId: "PLOFLJmVx0w6s",
    fotos: [],
    destaque: false,
    arte: "/casos/arte/games-machinima.webp"
  },
  {
    slug: "castelos-sao-jorge",
    ato: 6,
    ordem: 290,
    titulo: "Castelos de São Jorge",
    org: "Autoral",
    papel: "Direção, captação e montagem",
    inicio: "2021-01",
    fim: "2024-06",
    rotulo: "2021 — 2024 · 8 versões",
    cidade: "Lisboa, Portugal",
    objeto: "castle",
    cor: "#c62828",
    corSec: "#ffd54f",
    linha: "Três anos e oito versões para fechar um filme de 14 minutos.",
    resumo: "O trabalho mais teimoso do acervo. Começa em 2021 com a *versão 1*, passa por *versão 5*, por três cortes chamados *YouTube*, por um *master*, por uma abertura beta — e só em junho de 2024 vira **Castelo de São Jorge**, público, 14 minutos e 26 segundos.",
    contexto: "Oito versões em três anos não é indecisão: é o que acontece quando o filme é seu e não existe cliente para dizer \"está bom\". Cada corte tem um alvo diferente — a versão longa, a versão de festival, a versão que cabe no YouTube. Editar o próprio filme é o exercício de matar as cenas de que você gosta, e o acervo mostra o processo inteiro em vez de esconder atrás do resultado.",
    feitos: [
      "Direção e captação em Lisboa",
      "8 cortes ao longo de 3 anos",
      "Abertura própria",
      "Versão final pública de 14min26"
    ],
    ferramentas: [
      "Premiere",
      "Correção de cor",
      "Sound design"
    ],
    hardware: [
      "Câmera própria em viagem"
    ],
    prova: "Acervo: 8 peças entre 2021 e 2024.",
    videos: [
      {
        id: "4MW1910GPTQ",
        titulo: "CASTELOS DE SAO JORGE VERSAO 1",
        dur: "12:12",
        data: "2021-07-08",
        vis: "Não listado",
        views: "3"
      },
      {
        id: "EMuf9TRD_Ig",
        titulo: "CASTELOS DE SAO JORGE VERSAO 5",
        dur: "14:05",
        data: "2021-07-12",
        vis: "Não listado",
        views: "5"
      },
      {
        id: "uRz1ewCRBqM",
        titulo: "CASTELOS DE SAO JORGE YOUTUBE",
        dur: "11:14",
        data: "2021-07-13",
        vis: "Não listado",
        views: "1"
      },
      {
        id: "BbYxjK0FrRY",
        titulo: "CASTELOS DE SAO JORGE YOUTUBE 2",
        dur: "11:02",
        data: "2021-07-14",
        vis: "Não listado",
        views: "12"
      },
      {
        id: "SBZGadRAekQ",
        titulo: "CASTELOS DE SAO JORGE YOUTUBE 1",
        dur: "11:03",
        data: "2021-07-14",
        vis: "Não listado",
        views: "0"
      },
      {
        id: "75dfIXl0C3A",
        titulo: "CASTELOS DE SAO JORGE MASTER 1",
        dur: "14:26",
        data: "2021-07-15",
        vis: "Não listado",
        views: "8"
      },
      {
        id: "ptAg_lUANJA",
        titulo: "CASTELOS DE SAO JORGE VERSAO BETA00 ABERTURA",
        dur: "0:24",
        data: "2023-10-12",
        vis: "Público",
        views: "16"
      },
      {
        id: "jKTfO2LLUbw",
        titulo: "CASTELO DE SAO JORGE",
        dur: "14:26",
        data: "2024-07-03",
        vis: "Público",
        views: "30"
      }
    ],
    playlist: "Castelos de São Jorge",
    playlistId: "PLXGmCSUPHKOE",
    fotos: [],
    destaque: true,
    arte: "/casos/arte/castelos-sao-jorge.webp"
  },
  {
    slug: "fayacuts",
    ato: 6,
    ordem: 300,
    titulo: "Fayacuts — a marca própria",
    org: "Fayacuts",
    papel: "Dono, editor e diretor",
    inicio: "2023-01",
    fim: "2024-12",
    rotulo: "2023 — 2024",
    cidade: "Rio de Janeiro, RJ",
    objeto: "scissors",
    cor: "#f9a825",
    corSec: "#26c6da",
    linha: "Depois de trinta anos editando para os outros, o próprio nome na porta.",
    resumo: "Fayacuts é o estúdio dele. Em dois anos passam por ali a **CopanemaTV** (com peça de iFood), o **Bugs n Bus**, o **Make TV**, a **Feiticeira Secreta**, o treino da **Marina**, a abertura de um **e-book**, o **Rafa & Luiz Breakfast**, a cobertura do **Girs** em dois dias — um deles com quase três horas — e o **DropD Full Show**, de uma hora e meia.",
    contexto: "É a fase em que ele deixa de ser contratado e passa a ser fornecedor: prospecta, orça, entrega e assina. O portfólio é deliberadamente misto — publicidade, TV, evento, conteúdo e institucional — porque estúdio pequeno não escolhe nicho no primeiro ano. A CopanemaTV é o caso mais completo: existe o master, existem cortes de trinta segundos e existe um arquivo chamado `Copiao TRILHA FALTA LOCUCAO`, que é a peça montada com trilha, esperando o locutor — o retrato exato de como um estúdio trabalha por dentro. E existe uma carta de recomendação em vídeo: **Eduardo Elias e Marina Ferrari, da Central Fox, agradecendo pela bela edição**.",
    feitos: [
      "CopanemaTV — master, cortes e peça publicitária",
      "Bugs n Bus — abertura",
      "Make TV — making of",
      "Maria Clara, a Feiticeira Secreta",
      "Marina — treino em 1 minuto, com correção de cor",
      "Abertura de e-book em três versões",
      "Rafa & Luiz Breakfast",
      "Girs — cobertura de dois dias (quase 3h de material no dia 1)",
      "DropD — Full Show, 1h30"
    ],
    ferramentas: [
      "Premiere",
      "After Effects",
      "Correção de cor",
      "Sound design"
    ],
    hardware: [
      "Estúdio próprio"
    ],
    prova: "Acervo: 19 peças entre 2023 e 2024. Depoimento em vídeo de Eduardo Elias e Marina Ferrari (Central Fox).",
    videos: [
      {
        id: "mMsnLzUEBcM",
        titulo: "CopanemaTV 1 1",
        dur: "3:05",
        data: "2023-03-10",
        vis: "Público",
        views: "46"
      },
      {
        id: "-doR9tmIu3s",
        titulo: "CopanemaTV MASTER",
        dur: "4:41",
        data: "2023-03-14",
        vis: "Público",
        views: "9"
      },
      {
        id: "N3lUxOijs4k",
        titulo: "CopanemaTV MARCO2",
        dur: "4:01",
        data: "2023-03-30",
        vis: "Público",
        views: "3"
      },
      {
        id: "nR9d_YIJDno",
        titulo: "CopanemaTV2",
        dur: "0:44",
        data: "2023-05-16",
        vis: "Público",
        views: "10"
      },
      {
        id: "BId0dyw5n4Y",
        titulo: "HDBancaCopanemaTVDistort VIDEO 2",
        dur: "0:14",
        data: "2023-05-19",
        vis: "Não listado",
        views: "0"
      },
      {
        id: "jrqUfE47Jt0",
        titulo: "Copanema TV Copiao TRILHA FALTA LOCUCAO",
        dur: "1:01",
        data: "2023-05-19",
        vis: "Não listado",
        views: "0"
      },
      {
        id: "4ak3O65M-jw",
        titulo: "Bugs n Bus intro",
        dur: "1:36",
        data: "2023-01-04",
        vis: "Público",
        views: "5.572"
      },
      {
        id: "PGoOoP9w6BM",
        titulo: "make tv making of after",
        dur: "1:15",
        data: "2023-10-12",
        vis: "Público",
        views: "30"
      },
      {
        id: "cwiuS7kQD2w",
        titulo: "FEITICEIRA SECRETA",
        dur: "1:41",
        data: "2023-10-22",
        vis: "Não listado",
        views: "15"
      },
      {
        id: "gGz1_W8VMAU",
        titulo: "Maria Clara a Feiticeira Secreta",
        dur: "1:41",
        data: "2023-10-22",
        vis: "Privado",
        views: "4"
      },
      {
        id: "15CzJwHcw9w",
        titulo: "MARINA TREINO 1 MINUTO Color Correct MIxdown Export",
        dur: "1:36",
        data: "2023-02-22",
        vis: "Público",
        views: "27"
      },
      {
        id: "ryRGXIZ_Kcs",
        titulo: "INTRO EBOOK V3",
        dur: "3:04",
        data: "2023-04-29",
        vis: "Não listado",
        views: "2"
      },
      {
        id: "LyJ9hbEv6Q4",
        titulo: "Ebook 720p",
        dur: "3:04",
        data: "2023-05-19",
        vis: "Não listado",
        views: "0"
      },
      {
        id: "QplSmMbmQ4k",
        titulo: "Lets do it CC",
        dur: "0:02",
        data: "2024-01-18",
        vis: "Privado",
        views: "9"
      },
      {
        id: "lErQI5RyMV4",
        titulo: "Lets do it",
        dur: "0:02",
        data: "2024-01-18",
        vis: "Privado",
        views: "7"
      },
      {
        id: "7zNTNTK7a6g",
        titulo: "Rafa&Luiz Breakfast FINAL",
        dur: "2:52",
        data: "2024-08-23",
        vis: "Não listado",
        views: "7"
      },
      {
        id: "CBbzPnyBDfM",
        titulo: "Girs dia02",
        dur: "55:38",
        data: "2024-08-29",
        vis: "Não listado",
        views: "0"
      },
      {
        id: "nyZvToQ9AnA",
        titulo: "Girs dia01",
        dur: "2:59:48",
        data: "2024-08-29",
        vis: "Não listado",
        views: "0"
      },
      {
        id: "ytWOHwQvSmw",
        titulo: "Full Show DropD",
        dur: "1:30:14",
        data: "2024-12-02",
        vis: "Não listado",
        views: "49"
      },
      {
        id: "3reMZDfw8d4",
        titulo: "Full Xhow",
        dur: "1:30:14",
        data: "2024-12-02",
        vis: "Não listado",
        views: "1"
      }
    ],
    playlist: "Fayacuts — estúdio",
    playlistId: "PLe_65Gz8N5YE",
    fotos: [
      {
        src: "/casos/foto/faya-camera.webp",
        legenda: "Em campo, câmera na mão, gravando com a Marina. 29/09/2016 — o timecode está na tela."
      },
      {
        src: "/casos/foto/faya-make-tv.webp",
        legenda: "Trabalhando com a Make TV."
      }
    ],
    destaque: true,
    arte: "/casos/arte/fayacuts.webp"
  },
  {
    slug: "fayai",
    ato: 6,
    ordem: 310,
    titulo: "FayAI — a inteligência artificial como ilha de edição",
    org: "FayAI · fayai.com.br",
    papel: "Fundador, arquiteto de produto e produtor de conteúdo",
    inicio: "2024-08",
    fim: null,
    rotulo: "2024 — hoje",
    cidade: "Rio de Janeiro, RJ",
    objeto: "neuralcore",
    cor: "#2979ff",
    corSec: "#ffc400",
    linha: "O mesmo movimento de 1992: pegar a ferramenta que acabou de nascer e usá-la para explicar melhor.",
    resumo: "A FayAI é a plataforma dele — cursos, ferramentas e conteúdo sobre inteligência artificial. No canal, a virada aparece em agosto de 2024, quando ele publica uma análise técnica da série Terminator Zero **feita em conversa com o ChatGPT**, e segue em 2025 com uma sequência sobre o DeepSeek e a dependência tecnológica entre China e Estados Unidos.",
    contexto: "Vale reparar no que ele escolhe discutir: não é \"as 10 melhores ferramentas de IA\". É **FP8, GPU da NVIDIA, PyTorch da Meta, o paralelo com os ASICs do bitcoin e o \"momento Sputnik\"** — quer dizer, a camada de infraestrutura, que é a que ele sempre entendeu, desde os jumpers da IGRES em 1994. Em 2026 o canal já traz clipes de **avatar próprio gerado por IA** (a série `clip id01 … RicardoFaya`) e o manifesto **FayAi — Helping others defeat ignorance**. É a mesma pessoa da sala do CNA em 1994, com outra ferramenta na mão.",
    feitos: [
      "fayai.com.br — plataforma de cursos e ferramentas de IA",
      "Série sobre DeepSeek e a corrida tecnológica China × EUA",
      "Análise técnica de Terminator Zero em coprodução com o ChatGPT",
      "Avatares próprios gerados por IA (série clip id01)",
      "Manifesto FayAi — Helping others defeat ignorance"
    ],
    ferramentas: [
      "Modelos de linguagem",
      "Geração de imagem e vídeo",
      "Next.js",
      "ComfyUI"
    ],
    hardware: [
      "GPU local",
      "VPS",
      "Pipeline próprio"
    ],
    prova: "Acervo: 23 peças entre agosto/2024 e agosto/2026. Site: fayai.com.br.",
    videos: [
      {
        id: "HKNK9tGzX44",
        titulo: "A Verdadeira Tecnologia por Trás do T-800: Desvendando os Erros da Série Terminator Zero",
        dur: "18:26",
        data: "2024-08-30",
        vis: "Público",
        views: "67"
      },
      {
        id: "wngU7D4HwJ4",
        titulo: "Deepseek v1 1",
        dur: "4:26",
        data: "2025-01-30",
        vis: "Não listado",
        views: "14"
      },
      {
        id: "xf5SqjaSnVA",
        titulo: "Corrida Tecnológica: China vs EUA em IA Avançada",
        dur: "4:28",
        data: "2025-01-31",
        vis: "Público",
        views: "79"
      },
      {
        id: "yV3NWxgJiPw",
        titulo: "A Revolução da IA com DeepSeek e a Independência Tecnológica",
        dur: "2:09",
        data: "2025-02-04",
        vis: "Público",
        views: "7"
      },
      {
        id: "b0xFaDthkpo",
        titulo: "Deepxeek v1 3",
        dur: "13:12",
        data: "2025-02-05",
        vis: "Não listado",
        views: "2"
      },
      {
        id: "2yomKh2AUms",
        titulo: "fayacuts 1 3",
        dur: "0:42",
        data: "2024-04-13",
        vis: "Privado",
        views: "0"
      },
      {
        id: "5XLnwNPc9XQ",
        titulo: "Livro apo8 prob4 apo8 prob4",
        dur: "0:09",
        data: "2024-07-15",
        vis: "Não listado",
        views: "3"
      },
      {
        id: "24nOVQklNHM",
        titulo: "VIDEO FACILITA",
        dur: "1:13",
        data: "2024-08-24",
        vis: "Não listado",
        views: "1"
      },
      {
        id: "pwQPAvzgm1E",
        titulo: "clip id01 02 RicardoFaya2",
        dur: "0:16",
        data: "2026-03-25",
        vis: "Público",
        views: "3"
      },
      {
        id: "nb7wuqtpE1o",
        titulo: "clip id01 01 RicardoFaya1",
        dur: "0:16",
        data: "2026-03-25",
        vis: "Público",
        views: "6"
      },
      {
        id: "z15GPc3d7Qo",
        titulo: "clip id01 01 RicardoFaya2",
        dur: "0:16",
        data: "2026-03-25",
        vis: "Público",
        views: "3"
      },
      {
        id: "ZmcF7rCIqnE",
        titulo: "clip id01 01 RicardoFaya3",
        dur: "0:16",
        data: "2026-03-25",
        vis: "Público",
        views: "3"
      }
    ],
    playlist: "FayAI — inteligência artificial",
    playlistId: "PLDY1n-iMTnXE",
    fotos: [],
    destaque: true,
    arte: "/casos/arte/fayai.webp"
  },
  {
    slug: "acervo-pessoal",
    ato: 6,
    ordem: 320,
    titulo: "O arquivo pessoal",
    org: "Arquivo",
    papel: "Trinta anos de fitas",
    inicio: "2008-01",
    fim: "2026-12",
    rotulo: "2008 — 2026",
    cidade: "Rio de Janeiro, RJ",
    objeto: "tapebox",
    cor: "#8d6e63",
    corSec: "#ffd54f",
    linha: "Homenagem ao pai, os gols do filho, o rally, a banda, os primeiros testes de plugin em 2008.",
    resumo: "O que sobra quando se tira o trabalho: a homenagem ao pai, a missa, os jogos do João no sub-15 e no sub-17, o beach tennis em Ipanema, o rally, o skate, os ensaios da banda de rock, os primeiros experimentos com plugin de toon em 2008, e seis fitas HDV inteiras digitalizadas em 2020.",
    contexto: "Está aqui porque é onde a técnica foi treinada de graça. O teste de plugin *toonized* em cima de um solo de War Pigs, em 2008, é a mesma curiosidade que vinte anos antes fez o rapaz de dezesseis anos renderizar dragão em 3D Studio para vender RPG — e que hoje faz o mesmo homem gerar avatar com IA. **A ferramenta muda; a curiosidade é a mesma.**",
    feitos: [
      "Homenagem ao pai e registro da missa",
      "Os gols do João",
      "Rally, skate e beach tennis",
      "Ensaios de banda de rock",
      "Testes de plugin em 2008",
      "Digitalização de fitas HDV"
    ],
    ferramentas: [
      "O que estava à mão"
    ],
    hardware: [
      "HDV, GoPro, celular"
    ],
    prova: "Acervo: 41 peças pessoais + 6 fitas HDV + material bruto.",
    videos: [
      {
        id: "HLIbOLvTMAA",
        titulo: "FINAL GOL BOLA CHEIA iPhone",
        dur: "0:28",
        data: "2009-05-28",
        vis: "Público",
        views: "142"
      },
      {
        id: "hm7GnV5AvAA",
        titulo: "SEGUNDO jogo joao video",
        dur: "1:57",
        data: "2009-05-28",
        vis: "Público",
        views: "44"
      },
      {
        id: "3hFoZYdXGk0",
        titulo: "Fut joao 2",
        dur: "2:59",
        data: "2014-09-04",
        vis: "Público",
        views: "16"
      },
      {
        id: "X2swQuB_EbM",
        titulo: "Fut Joao1",
        dur: "1:45",
        data: "2014-09-04",
        vis: "Público",
        views: "8"
      },
      {
        id: "ePcKWLj0-9o",
        titulo: "IMG 0148",
        dur: "13:38",
        data: "2014-09-15",
        vis: "Público",
        views: "47"
      },
      {
        id: "h98eyiGXq3I",
        titulo: "Jogo sub 17 5x1",
        dur: "2:40",
        data: "2014-09-21",
        vis: "Público",
        views: "36"
      },
      {
        id: "7rE0pMqbTZ8",
        titulo: "Sub 15 20/09 Segundo tempo outro gol do Enzo",
        dur: "2:09",
        data: "2014-09-21",
        vis: "Público",
        views: "33"
      },
      {
        id: "UzcSX4N4_p4",
        titulo: "Sub 15 20/09 Segundo tempo gol do Enzo",
        dur: "2:18",
        data: "2014-09-21",
        vis: "Público",
        views: "22"
      },
      {
        id: "EezjHjmG2d8",
        titulo: "Sub 15 20/09 primeiro tempo gol do Joao",
        dur: "1:28",
        data: "2014-09-21",
        vis: "Público",
        views: "31"
      },
      {
        id: "bKDI5P2TBJs",
        titulo: "Primeiro tempo 20/09",
        dur: "10:11",
        data: "2014-09-21",
        vis: "Público",
        views: "27"
      },
      {
        id: "YJWj66eTyUc",
        titulo: "ming bola",
        dur: "0:28",
        data: "2008-12-26",
        vis: "Público",
        views: "79"
      },
      {
        id: "KaDcFpbK0js",
        titulo: "solo warpigs toonized carne",
        dur: "0:59",
        data: "2008-12-26",
        vis: "Público",
        views: "83"
      },
      {
        id: "uZXpz-eT0Zw",
        titulo: "Super Melbourne Shuffle by JimmyF.",
        dur: "1:43",
        data: "2009-08-01",
        vis: "Público",
        views: "59"
      }
    ],
    playlist: "Arquivo pessoal",
    playlistId: "PLCQp7XLoARhQ",
    fotos: [],
    destaque: false,
    arte: "/casos/arte/acervo-pessoal.webp"
  }
];

export const POR_ATO = (n: number) => TRABALHOS.filter((t) => t.ato === n);
export const DESTAQUES = TRABALHOS.filter((t) => t.destaque);
export const TOTAL_VIDEOS = TRABALHOS.reduce((s, t) => s + t.videos.length, 0);
/** Só os que EMBEDAM. Vídeo privado devolve miniatura cinza e o player recusa. */
export const TOTAL_TOCAVEIS = TRABALHOS.reduce(
  (s, t) => s + t.videos.filter((v) => v.vis !== "Privado").length,
  0
);
