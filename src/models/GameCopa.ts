import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * COPA DE TERCEIRO — um campeonato que NÃO é nosso, coberto por nós.
 * 08/09/2026, nascido para a Super Copa dos Streamers (EA FC 26 Pro Clubs).
 *
 * ## Por que não é `GameCompeticao`
 *
 * `GameCompeticao` é campeonato que a gente ORGANIZA: nós definimos regra,
 * geramos tabela, homologamos resultado. Aqui é o contrário — a competição é de
 * outra gente, nós só observamos. Guardar as duas no mesmo documento faria a
 * cobertura herdar poderes que ela não tem (gerar confronto, mudar regra) e
 * perderia o único campo que importa nesta: **a procedência do vínculo**.
 *
 * ## O campo que é o produto: `vinculo` + `evidencia`
 *
 * Dizer "o time Narizes FC é o clube 240581 da EA" é uma AFIRMAÇÃO NOSSA, e
 * pode estar errada — os nomes que a organização publica não são os nomes de
 * dentro do jogo ("Osempic do Marcelo" no site é `OsempicDMarcelo` na EA;
 * "Ice Nuggets" é `ICE NUGETS OFC`, com um G a menos). Uma associação errada
 * faria a gente publicar o placar de um clube aleatório como se fosse da copa.
 *
 * Por isso o vínculo tem grau e tem prova escrita. `evidencia` guarda POR QUE
 * a gente acredita: "elenco tem AD0LFZ_", "jogou 3 vezes contra BOTAFOFO 77 em
 * 40 minutos", "gamertags com prefixo Kick-". A tela mostra isso. Quem discorda
 * consegue conferir.
 *
 * ## A classificação vem em DUAS versões, de propósito
 *
 * `classificacaoOficial` é o que a organização publica. O que a EA mostra é
 * calculado das partidas espelhadas, na hora. Guardar as duas separadas é o que
 * permite o selo de divergência — o único produto aqui que ninguém mais tem,
 * porque ninguém mais junta os dois lados.
 *
 * ⚠️ Divergência **não é acusação**. A causa mais provável é o nosso de-para
 * estar errado, ou a EA ter registrado um amistoso que não era da copa.
 */

export type GrauVinculo = 'confirmado' | 'provavel' | 'nao-encontrado';

export interface TimeDaCopa {
  /** Nome como a ORGANIZAÇÃO publica. É por ele que a pessoa procura. */
  nome: string;
  /** Streamer que preside o time. */
  presidente?: string;
  grupo?: string;
  /** Canal da live, quando conhecido. */
  canal?: { plataforma: 'kick' | 'twitch' | 'youtube'; url: string };

  /** O de-para. Afirmação nossa — ver o cabeçalho. */
  eaClubId?: string;
  eaClubName?: string;
  eaPlatform?: 'common-gen5' | 'common-gen4';
  vinculo: GrauVinculo;
  /** Por que acreditamos. Vai a tela, em texto humano. */
  evidencia: string[];
  /** Quando o vínculo foi feito ou revisto. */
  vinculadoEm?: Date;

  /**
   * A SITUAÇÃO DO TIME NA COMPETIÇÃO — declarada pela organização.
   *
   * ⚠️ Isto NÃO é medida nossa. É o que a organização publicou, e por isso vem
   * com data: uma eliminação anunciada em 31/08 continua sendo a eliminação de
   * 31/08 quando alguém ler a página em novembro.
   *
   * `indefinido` não é "ainda está no torneio": é "a organização não declarou
   * nada sobre este time no que a gente leu". A diferença importa — dizer que
   * um time segue vivo quando ninguém disse isso é inventar.
   */
  situacao?: 'classificado' | 'eliminado' | 'indefinido';
  situacaoEm?: Date;

  /**
   * A BUSCA QUE NÃO ACHOU — o resultado negativo, guardado.
   *
   * Sem isto, o coletor refazia a mesma varredura de hora em hora: para os 7
   * times sem vínculo da Super Copa são ~34 clubes candidatos, cada um com uma
   * chamada de partidas — dezenas de chamadas por rodada para reencontrar o
   * mesmo nada. E a tela só sabia dizer "sem vínculo", que não distingue "nunca
   * procuramos" de "procuramos e não é nenhum destes".
   *
   * `buscaNota` é escrita para uma pessoa ler: quantos clubes têm o nome e por
   * que nenhum serve. É a diferença entre um vazio que parece defeito e um
   * vazio que se explica.
   */
  buscadoEm?: Date;
  buscaNota?: string;
}

/** Uma linha da tabela que a organização publica. */
export interface LinhaOficial {
  time: string;
  grupo?: string;
  pontos?: number;
  jogos?: number;
  vitorias?: number;
  empates?: number;
  derrotas?: number;
  golsPro?: number;
  golsContra?: number;
  posicao?: number;
}

export interface IGameCopa extends Document {
  slug: string;
  nome: string;
  edicao?: string;
  jogo: string;
  descricao?: string;
  /** Quem manda na copa. Não somos nós — e a tela diz isso. */
  organizacao?: { nome?: string; presidentes: string[]; sites: string[] };
  formato: {
    times: number;
    grupos: number;
    timesPorGrupo: number;
    /** Jogos por confronto na fase de grupos (MD5 = 5). */
    jogosPorConfrontoGrupo: number;
    jogosPorConfrontoMataMata: number;
  };
  status: 'anunciada' | 'em-andamento' | 'encerrada';
  comecouEm?: Date;
  times: TimeDaCopa[];
  classificacaoOficial: LinhaOficial[];
  /**
   * O QUE CADA FONTE AFIRMA — e onde elas se contradizem.
   *
   * Não é redundância com `organizacao.sites`: ali fica a URL, aqui fica o
   * CONTEÚDO que cada uma declara. A diferença existe porque as fontes
   * DISCORDAM entre si, e a divergência é informação.
   *
   * Medido em 08/09: umas publicam 20 times em 4 grupos de 5; outras, 16 times
   * em 4 grupos de 4. As duas falam da mesma copa. Escolher uma e apresentar
   * como fato seria inventar uma autoridade que não temos — mostrar as duas,
   * lado a lado e com a data da leitura, é o produto.
   */
  declaracoes: Array<{
    fonte: string;
    url?: string;
    afirma: Record<string, string | number>;
    lidoEm: Date;
  }>;
  /** Notícias sobre a copa, com fonte e data. Nunca sem as duas. */
  noticias: Array<{
    titulo: string;
    fonte: string;
    url: string;
    em?: Date;
    resumo?: string;
    /**
     * A imagem da notícia. Opcional, e quase sempre desnecessária.
     *
     * Quando a URL é de vídeo do YouTube, a capa é derivada do próprio
     * endereço na leitura — é a representação que o YouTube publica para o
     * vídeo e a que qualquer pessoa vê ao compartilhar o link. Guardar uma
     * cópia nossa seria duplicar sem motivo, e envelheceria quando o canal
     * trocasse a capa.
     *
     * Este campo existe para o outro caso: arte NOSSA, ou foto que a gente
     * tenha direito de usar. Nunca para hospedar imagem de terceiro.
     */
    imagem?: string;
  }>;
  /** Quando a tabela oficial foi lida do site. Tabela sem data não vale. */
  oficialCapturadaEm?: Date;

  /**
   * EM QUE FASE A COMPETIÇÃO ESTÁ, segundo a organização.
   *
   * Sem este campo, a página mostrava as tabelas de grupo como se fosse o
   * estado atual — e a Super Copa saiu da fase de grupos em 03/09. Tabela de
   * grupo continua sendo informação boa; apresentá-la como "onde a copa está"
   * depois que ela virou mata-mata é dizer algo falso sem escrever uma frase
   * falsa.
   *
   * Vem com a data da leitura pela mesma razão de sempre: fase sem data é
   * afirmação sobre o presente que envelhece calada.
   */
  faseAtual?: string;
  faseDeclaradaEm?: Date;
  /** A janela de horário observada das séries, para prever a próxima. */
  janelaObservada?: { horaInicio: number; horaFim: number; amostras: number };
  destaque: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GameCopaSchema = new Schema<IGameCopa>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    nome: { type: String, required: true },
    edicao: { type: String },
    jogo: { type: String, default: 'EA SPORTS FC 26' },
    descricao: { type: String },
    organizacao: {
      nome: { type: String },
      presidentes: { type: [String], default: [] },
      sites: { type: [String], default: [] },
    },
    formato: {
      times: { type: Number, default: 20 },
      grupos: { type: Number, default: 4 },
      timesPorGrupo: { type: Number, default: 5 },
      jogosPorConfrontoGrupo: { type: Number, default: 5 },
      jogosPorConfrontoMataMata: { type: Number, default: 3 },
    },
    status: {
      type: String,
      enum: ['anunciada', 'em-andamento', 'encerrada'],
      default: 'em-andamento',
    },
    comecouEm: { type: Date },
    times: [
      {
        _id: false,
        nome: { type: String, required: true },
        presidente: { type: String },
        grupo: { type: String },
        canal: {
          plataforma: { type: String, enum: ['kick', 'twitch', 'youtube'] },
          url: { type: String },
        },
        eaClubId: { type: String },
        eaClubName: { type: String },
        eaPlatform: { type: String, enum: ['common-gen5', 'common-gen4'] },
        vinculo: {
          type: String,
          enum: ['confirmado', 'provavel', 'nao-encontrado'],
          default: 'nao-encontrado',
        },
        evidencia: { type: [String], default: [] },
        buscadoEm: { type: Date },
        buscaNota: { type: String },
        situacao: { type: String, enum: ['classificado', 'eliminado', 'indefinido'] },
        situacaoEm: { type: Date },
        vinculadoEm: { type: Date },
      },
    ],
    classificacaoOficial: [
      {
        _id: false,
        time: { type: String, required: true },
        grupo: String,
        pontos: Number,
        jogos: Number,
        vitorias: Number,
        empates: Number,
        derrotas: Number,
        golsPro: Number,
        golsContra: Number,
        posicao: Number,
      },
    ],
    declaracoes: [
      {
        _id: false,
        fonte: { type: String, required: true },
        url: { type: String },
        afirma: { type: Schema.Types.Mixed, default: {} },
        lidoEm: { type: Date, default: Date.now },
      },
    ],
    noticias: [
      {
        _id: false,
        titulo: { type: String, required: true },
        fonte: { type: String, required: true },
        url: { type: String, required: true },
        em: { type: Date },
        resumo: { type: String },
        imagem: { type: String },
      },
    ],
    oficialCapturadaEm: { type: Date },
    faseAtual: { type: String },
    faseDeclaradaEm: { type: Date },
    janelaObservada: {
      horaInicio: Number,
      horaFim: Number,
      amostras: Number,
    },
    destaque: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'game_copas' }
);

/** A vitrine mostra as copas em destaque primeiro. */
GameCopaSchema.index({ destaque: -1, status: 1 });
/** Achar a copa pelo clube da EA — usado quando uma partida chega ao espelho. */
GameCopaSchema.index({ 'times.eaClubId': 1 });

const GameCopa: Model<IGameCopa> =
  mongoose.models.GameCopa || mongoose.model<IGameCopa>('GameCopa', GameCopaSchema);

export default GameCopa;
