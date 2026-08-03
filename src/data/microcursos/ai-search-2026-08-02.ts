import type { Microcurso, Fonte } from "./tipos";

/**
 * Fonte: "New Deepseek, Seedance 2.5, Minimax H3, Gemini Robotics, AMD models:
 * AI NEWS" — canal AI Search, 02/08/2026, 28min10s, 17 capítulos.
 *
 * O capítulo 0 é a abertura do vídeo e não vira microcurso. Os outros 16 são
 * uma ferramenta cada.
 *
 * Sobre os nomes: a legenda automática do YouTube erra pesado em nome próprio
 * — "Aiogram" por Ideogram, "Bite Dance" por ByteDance, "Miniax" por MiniMax,
 * "Fi0" por Phi-Zero, "Hucking Face" por Hugging Face, "Coin 3.5" por Qwen 3.5.
 * Cada nome aqui foi conferido contra a URL oficial que o autor listou na
 * descrição do vídeo, não contra a legenda. Publicar o erro da legenda seria
 * publicar uma página que não casa com busca nenhuma.
 *
 * Os `href` de `proximosPassos` são sem prefixo de idioma de propósito — quem
 * renderiza acrescenta o locale. Link interno sem prefixo custa um 308 antes
 * de abrir a página de destino.
 *
 * Duas armadilhas de URL, as duas medidas em produção e as duas custando o
 * mesmo 308:
 *
 * - A ficha de um curso é `/curso/<slug>`, **no singular**. `/cursos/<slug>`
 *   existe e responde 308 para lá. O plural sozinho (`/cursos`) é o catálogo,
 *   e esse está certo.
 * - `/blog` responde 308 para `/noticias`. Aponte para `/noticias`.
 */

const VIDEO_ID = "OrcBSpADCGk";

const fonteBase: Omit<Fonte, "capitulo" | "inicio" | "fim"> = {
  videoId: VIDEO_ID,
  tituloVideo:
    "New Deepseek, Seedance 2.5, Minimax H3, Gemini Robotics, AMD models: AI NEWS",
  canal: "AI Search",
  canalUrl: "https://www.youtube.com/channel/UCIgnGlGkVRhd4qNFcEwLL4A",
  publicadoEm: "2026-08-02",
};

const fonte = (capitulo: string, inicio: number, fim: number): Fonte => ({
  ...fonteBase,
  capitulo,
  inicio,
  fim,
});

const PUB = "2026-08-02";

export const microcursosAiSearch0208: Microcurso[] = [
  // ─────────────────────────────────────────────────────────── 01 · ID-V2V
  {
    slug: "id-v2v-trocar-o-estilo-do-video-sem-trocar-o-ator",
    titulo: "ID-V2V: trocar o estilo do vídeo sem trocar o ator",
    subtitulo:
      "Você edita um quadro. O modelo espalha aquele visual pelo vídeo inteiro — e o rosto continua o mesmo.",
    ferramenta: "ID-V2V",
    fabricante: "Eyeline Labs (Netflix)",
    categoria: "Vídeo",
    nivel: "Avançado",
    acesso: "Open source",
    duracao: "6 min",
    resumo:
      "ID-V2V muda cenário, luz, roupa e estilo de um vídeo mantendo rosto, expressão e movimento. Open source, até 720p, ~80 GB de modelo.",
    publicadoEm: PUB,
    linkOficial: "https://eyeline-labs.github.io/ID-V2V/",
    fonte: fonte("ID V2V", 46, 107),
    oQueE: [
      "ID-V2V é um modelo aberto de vídeo-para-vídeo publicado pelo Eyeline Labs, o laboratório de pesquisa da Netflix. Ele resolve um problema específico: mudar a aparência de um vídeo sem que a pessoa filmada vire outra pessoa no meio do caminho.",
      "O fluxo é diferente do que se espera de um gerador de vídeo. Você não descreve a cena em texto. Você entrega o vídeo original e edita **um único quadro-chave** com o visual que quer. O modelo trata esse quadro como a referência e propaga a mudança para todos os outros — mantendo rosto, expressões e movimento idênticos ao clipe original.",
    ],
    porQueImporta: [
      "É o gargalo real de quem faz vídeo com IA: gerar é fácil, manter a mesma pessoa em todos os quadros é que não é.",
      "Editar um quadro é um trabalho que qualquer pessoa com Photoshop faz — muito mais controlável do que torcer para um prompt acertar.",
      "Sendo aberto, roda na sua máquina: o material não sobe para o servidor de ninguém.",
    ],
    aulas: [
      {
        titulo: "O que ele muda e o que ele preserva",
        duracao: "2 min",
        secoes: [
          {
            tipo: "paragrafo",
            texto:
              "Vale entender a divisão antes de gastar tempo instalando, porque ela define se a ferramenta serve para o seu caso.",
          },
          {
            tipo: "lista",
            itens: [
              "**Muda:** fundo, iluminação, roupa e estilo visual geral da cena.",
              "**Preserva:** identidade do rosto, expressões faciais e o movimento dos personagens.",
            ],
          },
          {
            tipo: "citacao",
            texto:
              "Dá para mudar coisas como o fundo, a iluminação, a roupa ou o estilo geral, mantendo o rosto, as expressões e os movimentos do personagem iguais aos do clipe original.",
            minuto: "01:08",
          },
          {
            tipo: "paragrafo",
            texto:
              "Traduzindo para decisão prática: ID-V2V é ferramenta de **reestilização**, não de reencenação. Se você precisa que a pessoa faça um gesto novo que não está no vídeo original, este não é o modelo — o movimento vem do clipe de entrada e é justamente o que ele foi treinado para não inventar.",
          },
        ],
      },
      {
        titulo: "O caminho até rodar",
        duracao: "2 min",
        secoes: [
          {
            tipo: "passos",
            itens: [
              "Abra a página do projeto e clique no botão do GitHub, no topo.",
              "Role até as instruções de instalação — o repositório traz o passo a passo para rodar localmente.",
              "Separe o vídeo de origem e escolha o quadro que vai virar a referência de estilo.",
              "Edite esse quadro no editor de imagem que você já usa, com o visual final desejado.",
              "Rode o modelo com o par (vídeo original + quadro editado).",
            ],
          },
          {
            tipo: "alerta",
            texto:
              "O modelo principal tem quase 80 GB. Na prática isso significa hardware de ponta — não é algo que roda num notebook comum. Vale acompanhar o repositório: versões comprimidas pela comunidade costumam aparecer poucas semanas depois do lançamento, como já aconteceu com outros modelos abertos.",
          },
        ],
      },
      {
        titulo: "Onde isso encaixa numa produção real",
        duracao: "2 min",
        secoes: [
          {
            tipo: "lista",
            itens: [
              "**Variações de um mesmo anúncio.** Grave uma vez, entregue a mesma cena em três ambientações diferentes para testar qual converte.",
              "**Adequação de marca.** O vídeo existe e está bom, mas a paleta é da campanha passada — troca-se a paleta, não a filmagem.",
              "**Continuidade de figurino.** Corrigir uma peça de roupa errada sem remarcar a diária de gravação.",
            ],
          },
          {
            tipo: "paragrafo",
            texto:
              "O ponto econômico é esse: o custo de uma variação deixa de ser uma nova filmagem e passa a ser uma edição de imagem estática.",
          },
        ],
      },
    ],
    praQuemServe: [
      "Quem já produz vídeo e precisa de variações da mesma cena",
      "Estúdios e editores com placa de vídeo parruda disponível",
      "Quem não pode enviar material bruto para serviços de terceiros",
    ],
    limites: [
      "Resolução máxima de 720p.",
      "Modelo de quase 80 GB — só cabe em hardware de ponta.",
      "Não cria movimento novo: a movimentação vem inteira do vídeo de entrada.",
    ],
    ficha: [
      { rotulo: "Licença", valor: "Open source (código no GitHub)" },
      { rotulo: "Resolução", valor: "Até 720p" },
      { rotulo: "Tamanho do modelo", valor: "~80 GB" },
      { rotulo: "Entrada", valor: "Vídeo + 1 quadro-chave editado" },
      { rotulo: "Execução", valor: "Local" },
    ],
    proximosPassos: [
      {
        texto: "Compare com o Seedance 2.5, que vai pelo caminho oposto",
        href: "/inventando/seedance-2-5-trinta-segundos-de-video-com-o-mesmo-personagem",
      },
      {
        texto: "Veja as ferramentas de vídeo no catálogo",
        href: "/ferramentas/runwayml",
      },
    ],
  },

  // ─────────────────────────────────────────────────── 02 · CrisperWhisper 2
  {
    slug: "crisperwhisper-2-transcricao-com-tempo-por-palavra",
    titulo: "CrisperWhisper 2: transcrição com o tempo de cada palavra",
    subtitulo:
      "Dois modos de saída — o que a pessoa falou de verdade e o que ela quis dizer. Roda até sem placa de vídeo.",
    ferramenta: "CrisperWhisper 2",
    fabricante: "Nyra Labs",
    categoria: "Áudio",
    nivel: "Introdutório",
    acesso: "Open source",
    duracao: "7 min",
    resumo:
      "Transcritor aberto com modo verbatim e modo limpo, marcação de tempo por palavra e modelos de 0,2 B a 2 B — o menor tem menos de 500 MB.",
    publicadoEm: PUB,
    linkOficial: "https://nyra-labs.com/crisperwhisper",
    fonte: fonte("Crisper Whisper", 107, 248),
    oQueE: [
      "CrisperWhisper 2 transforma áudio em texto, como qualquer transcritor. A diferença está em duas escolhas de projeto que resolvem problemas opostos com o mesmo modelo.",
      "A primeira é ter **dois modos de saída**. A segunda é entregar **o tempo de início e fim de cada palavra**, não do bloco inteiro — o que muda completamente o que dá para automatizar depois.",
    ],
    porQueImporta: [
      "Legenda no tempo certo depende de marcação por palavra; sem isso o alinhamento é feito no olho.",
      "O modelo menor tem menos de 500 MB e roda sem GPU — cabe em praticamente qualquer computador.",
      "Em comparação publicada pelos autores, sai à frente de serviços pagos conhecidos, inclusive em erro de marcação de tempo.",
    ],
    aulas: [
      {
        titulo: "Os dois modos — e quando usar cada um",
        duracao: "2 min",
        secoes: [
          {
            tipo: "lista",
            itens: [
              "**Verbatim.** Transcreve tudo: gagueira, hesitação, risada, repetição, marcações de comportamento. É o que você quer para entrevista, pesquisa qualitativa, análise de fala e legenda fiel.",
              "**Intended.** Remove hesitações e ruído de fala e devolve o texto limpo. É o que você quer para ata, artigo, roteiro e qualquer coisa que vá ser lida.",
            ],
          },
          {
            tipo: "paragrafo",
            texto:
              "Repare que a escolha não é sobre qualidade — é sobre destino do texto. O erro comum é rodar tudo no modo limpo e perceber tarde demais que a hesitação era o dado que importava.",
          },
        ],
      },
      {
        titulo: "Testar sem instalar nada",
        duracao: "2 min",
        secoes: [
          {
            tipo: "paragrafo",
            texto:
              "Os autores publicaram um espaço gratuito no Hugging Face. Dá para subir um arquivo e ver a saída antes de decidir se vale montar o ambiente local.",
          },
          {
            tipo: "passos",
            itens: [
              "Abra a página oficial e siga para o espaço de demonstração.",
              "Suba um áudio seu — de preferência um caso difícil de verdade, com sotaque ou ruído.",
              "Rode primeiro em verbatim e leia o que ele capturou de hesitação.",
              "Rode o mesmo arquivo em intended e compare os dois textos lado a lado.",
              "Confira a tabela de tempos: cada palavra aparece com início e fim.",
            ],
          },
          {
            tipo: "paragrafo",
            texto:
              "Se você for legendar em português, use áudio em português no teste. Multi-idioma é suportado, mas desempenho por idioma é coisa que se confere, não se presume.",
          },
        ],
      },
      {
        titulo: "Escolher o tamanho do modelo",
        duracao: "2 min",
        secoes: [
          {
            tipo: "paragrafo",
            texto:
              "São quatro modelos na mesma família. A decisão é entre precisão e o que sua máquina aguenta:",
          },
          {
            tipo: "lista",
            itens: [
              "**0,2 bilhão de parâmetros** — menos de 500 MB. Roda em praticamente qualquer computador, sem GPU.",
              "**2 bilhões de parâmetros** — cerca de 3 GB. Cabe na maioria das placas de vídeo.",
              "Há dois tamanhos intermediários entre os dois extremos.",
            ],
          },
          {
            tipo: "paragrafo",
            texto:
              "Comece pelo menor. Transcrição é uma tarefa em que o modelo pequeno costuma resolver a maior parte dos casos, e você só descobre se precisa do grande comparando as duas saídas no seu próprio áudio.",
          },
          {
            tipo: "alerta",
            texto:
              "A comparação que mostra o modelo à frente de concorrentes pagos foi feita pelos próprios autores. É um indício, não um veredito — vale reproduzir com o seu material antes de trocar um serviço que já funciona.",
          },
        ],
      },
    ],
    praQuemServe: [
      "Quem legenda vídeo e precisa de sincronia por palavra",
      "Pesquisa e jornalismo, onde a hesitação é parte do dado",
      "Quem transcreve material sensível e não pode subir para a nuvem",
    ],
    limites: [
      "A comparação com concorrentes é autodeclarada pelos autores.",
      "Desempenho varia por idioma — confira no seu, não no do exemplo.",
      "Modelo pequeno troca precisão por leveza; em áudio ruim a diferença aparece.",
    ],
    ficha: [
      { rotulo: "Licença", valor: "Open source (modelos no Hugging Face)" },
      { rotulo: "Modelos", valor: "4, de 0,2 B a 2 B de parâmetros" },
      { rotulo: "Menor modelo", valor: "< 500 MB, roda sem GPU" },
      { rotulo: "Marcação de tempo", valor: "Por palavra" },
      { rotulo: "Teste online", valor: "Espaço gratuito no Hugging Face" },
    ],
    proximosPassos: [
      { texto: "Compare com o ElevenLabs no catálogo", href: "/ferramentas/elevenlabs" },
      {
        texto: "Veja o Gemini voice typing, o caminho inverso: fala vira texto já limpo",
        href: "/inventando/gemini-voice-typing-ditado-que-ja-sai-limpo",
      },
    ],
  },

  // ────────────────────────────────────────────── 03 · DeepSeek V4 Flash 0731
  {
    slug: "deepseek-v4-flash-0731-inteligencia-de-fronteira-a-tres-centavos",
    titulo: "DeepSeek V4 Flash 0731: inteligência de fronteira a três centavos",
    subtitulo:
      "Desempenho de topo por cerca de US$ 0,03 por milhão de tokens — e o modelo está publicado para baixar.",
    ferramenta: "DeepSeek V4 Flash 0731",
    fabricante: "DeepSeek",
    categoria: "Modelos",
    nivel: "Intermediário",
    acesso: "Open source",
    duracao: "8 min",
    resumo:
      "Modelo aberto que chega perto de GLM 5.2 e Opus 4.8 custando cerca de 100× menos. 167 GB no original, 82,5 GB na versão comprimida de 1 bit.",
    publicadoEm: PUB,
    linkOficial:
      "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-0731",
    fonte: fonte("Deepseek V4 Flash 0731", 248, 388),
    oQueE: [
      "É a atualização mais recente da linha Flash da DeepSeek — a linha pensada para ser rápida e barata, não para ser a maior. O resultado desta versão é que a distinção deixou de fazer sentido: ela se aproxima dos modelos completos.",
      "Segundo a fonte, fica um ponto abaixo do GLM 5.2, supera a versão V4 Pro anterior e sobe cerca de 10 pontos em relação ao Flash anterior. O ganho vem da arquitetura DSpark, a mesma da versão anterior, voltada a eficiência e vazão.",
    ],
    porQueImporta: [
      "Custa cerca de US$ 0,03 por milhão de tokens — a fonte estima algo como 100× mais barato que o Claude Opus.",
      "É 70% menor que o GLM 5.2 e entrega desempenho comparável.",
      "Está publicado: dá para rodar inteligência desse nível na sua própria máquina.",
    ],
    aulas: [
      {
        titulo: "Onde ele ganha",
        duracao: "3 min",
        secoes: [
          {
            tipo: "paragrafo",
            texto:
              "Os testes citados no vídeo são de três frentes, e são justamente as que interessam a quem constrói coisas:",
          },
          {
            tipo: "lista",
            itens: [
              "**Codificação agêntica** — o modelo operando ferramentas em várias etapas, não só escrevendo função solta.",
              "**Engenharia de software** — tarefas de repositório real.",
              "**Segurança cibernética.**",
            ],
          },
          {
            tipo: "citacao",
            texto:
              "Ele supera com folga a versão V4 Pro anterior. Em alguns casos, chega a bater ou empatar com GLM 5.2 ou Opus 4.8.",
            minuto: "05:12",
          },
          {
            tipo: "paragrafo",
            texto:
              "O gráfico que mais importa é o de desempenho contra custo. DeepSeek V4 Flash fica num canto do gráfico praticamente sozinho; GPT 5.6, Claude Opus e Claude Fable ficam no extremo oposto. É a definição de melhor relação custo-benefício disponível hoje.",
          },
        ],
      },
      {
        titulo: "Rodar por conta própria",
        duracao: "3 min",
        secoes: [
          {
            tipo: "paragrafo",
            texto:
              "O modelo original tem 167 GB — cabe em um único DGX Spark, segundo a fonte. Como é aberto, a comunidade agiu rápido e já existem versões comprimidas no formato GGUF publicadas pela Unsloth.",
          },
          {
            tipo: "lista",
            itens: [
              "**Original:** 167 GB.",
              "**GGUF de 1 bit:** cerca de 82,5 GB — cabe em uma ou duas peças de hardware de ponta.",
            ],
          },
          {
            tipo: "alerta",
            texto:
              "Compressão de 1 bit é uma troca, não um almoço grátis: reduz memória ao custo de alguma precisão. Antes de assumir que a versão comprimida tem o desempenho dos gráficos de lançamento, rode o seu próprio caso de uso nas duas.",
          },
        ],
      },
      {
        titulo: "Quando trocar o modelo pago por este",
        duracao: "2 min",
        secoes: [
          {
            tipo: "paragrafo",
            texto:
              "Diferença de 100× no custo muda o que é economicamente viável. Tarefas que não fechavam a conta com modelo caro passam a fechar:",
          },
          {
            tipo: "lista",
            itens: [
              "Processar catálogos inteiros em vez de amostras.",
              "Laços de revisão automática, em que o mesmo texto passa várias vezes pelo modelo.",
              "Classificação e extração em volume, tarefas que consomem muito token e exigem pouca sofisticação.",
            ],
          },
          {
            tipo: "alerta",
            texto:
              "Modelo de raciocínio tem duas armadilhas que aparecem só na integração: latência bem maior que a de um modelo comum (cuidado com timeout curto) e resposta que pode voltar vazia no campo de conteúdo quando o limite de tokens é apertado demais.",
          },
        ],
      },
    ],
    praQuemServe: [
      "Quem tem conta de API grande e quer cortar custo sem perder qualidade",
      "Quem processa volume: classificação, extração, revisão em laço",
      "Quem quer inteligência de ponta rodando dentro de casa",
    ],
    limites: [
      "167 GB no original; mesmo comprimido exige hardware caro.",
      "Fica um ponto abaixo do GLM 5.2 nas comparações citadas.",
      "Versões de 1 bit trocam precisão por memória — precisam ser testadas.",
    ],
    ficha: [
      { rotulo: "Licença", valor: "Aberto, disponível no Hugging Face" },
      { rotulo: "Custo estimado", valor: "~US$ 0,03 / milhão de tokens" },
      { rotulo: "Tamanho", valor: "167 GB (82,5 GB em GGUF de 1 bit)" },
      { rotulo: "Arquitetura", valor: "DSpark" },
      { rotulo: "Comparável a", valor: "GLM 5.2 e Claude Opus 4.8" },
    ],
    proximosPassos: [
      {
        texto: "Veja o Kimi K3, o extremo oposto na escala de tamanho",
        href: "/inventando/kimi-k3-o-maior-modelo-aberto-e-o-que-fazer-com-ele",
      },
      { texto: "Curso: IA open source na prática", href: "/curso/openclaw-ia-open-source" },
      { texto: "Curso: engenharia de prompt", href: "/curso/prompt-engineering" },
    ],
  },

  // ─────────────────────────────────────────────────────────── 04 · ReDesign
  {
    slug: "redesign-transformar-uma-imagem-plana-em-camadas-editaveis",
    titulo: "ReDesign: transformar uma imagem plana em camadas editáveis",
    subtitulo:
      "Uma captura de tela volta a ser algo parecido com um arquivo do Figma. Menos de 4 GB.",
    ferramenta: "ReDesign",
    fabricante: "Projeto aberto (jintae-00)",
    categoria: "Imagem",
    nivel: "Intermediário",
    acesso: "Open source",
    duracao: "6 min",
    resumo:
      "Converte imagem achatada em camadas separadas para recolorir, mover e redimensionar elementos. Orquestra PaddleOCR, Qwen Image Layered, DINO e SAM 2.",
    publicadoEm: PUB,
    linkOficial: "https://github.com/jintae-00/ReDesign",
    fonte: fonte("Redesign", 388, 463),
    oQueE: [
      "ReDesign pega uma imagem já achatada e a devolve dividida em camadas, com cada elemento separado. A partir daí dá para recolorir, reposicionar e redimensionar peças individualmente.",
      "A comparação que a fonte usa é direta: é como transformar uma captura de tela de volta em algo próximo de um projeto de Figma ou Photoshop.",
    ],
    porQueImporta: [
      "Resolve o caso mais comum e mais chato do design: existe o JPG, não existe o arquivo editável.",
      "É pequeno — menos de 4 GB — e roda localmente.",
      "Nos testes publicados, sai à frente de outros conversores de imagem para camadas.",
    ],
    aulas: [
      {
        titulo: "Não é um modelo — é uma orquestra",
        duracao: "2 min",
        secoes: [
          {
            tipo: "paragrafo",
            texto:
              "Vale saber disto antes de instalar, porque explica tanto a qualidade quanto os pontos de falha. ReDesign não é uma rede treinada do zero: ele coordena ferramentas que já existem, cada uma numa parte do problema.",
          },
          {
            tipo: "lista",
            itens: [
              "**PaddleOCR** — leitura do texto presente na imagem.",
              "**Qwen Image Layered** — geração das camadas.",
              "**DINO e SAM 2** — detecção e segmentação dos elementos.",
            ],
          },
          {
            tipo: "paragrafo",
            texto:
              "A consequência prática: quando a saída vier ruim, o defeito costuma estar em uma etapa específica — texto mal lido, elemento mal segmentado — e não no sistema todo. Dá para diagnosticar olhando qual das quatro errou.",
          },
        ],
      },
      {
        titulo: "Instalar — e a pegadinha da chave de API",
        duracao: "2 min",
        secoes: [
          {
            tipo: "passos",
            itens: [
              "Abra o repositório pelo botão de código no topo da página.",
              "Role até as instruções de instalação local.",
              "Reserve menos de 4 GB de espaço — é um projeto leve.",
              "Antes de rodar, leia a parte de configuração: o código base pede uma chave de API da OpenAI.",
            ],
          },
          {
            tipo: "alerta",
            texto:
              "Essa dependência da OpenAI é ajustável. A própria fonte aponta que dá para alterar o código e trocar por um modelo local, rodando tudo de graça. Se o objetivo é não depender de serviço externo, esse é o ajuste a fazer antes de colocar em produção.",
          },
        ],
      },
      {
        titulo: "O que dá para fazer depois de separar",
        duracao: "2 min",
        secoes: [
          {
            tipo: "lista",
            itens: [
              "**Recolorir** elementos isolados sem mexer no resto da composição.",
              "**Reposicionar** peças — mover um botão, deslocar um bloco de texto.",
              "**Redimensionar** elementos específicos.",
            ],
          },
          {
            tipo: "paragrafo",
            texto:
              "Os usos que mais rendem: recuperar uma peça de campanha antiga cujo arquivo aberto se perdeu, adaptar um banner recebido em JPG para outro formato, e extrair componentes de uma referência visual para reaproveitar.",
          },
        ],
      },
    ],
    praQuemServe: [
      "Designers que recebem material achatado e precisam editar",
      "Quem precisa adaptar peça de campanha sem o arquivo original",
      "Quem quer montar automação de variação de banner",
    ],
    limites: [
      "O código base pede chave da OpenAI — trocar por modelo local exige mexer no código.",
      "A qualidade depende de quatro ferramentas encadeadas; o erro de uma contamina o resultado.",
      "Não recria fontes nem vetores: entrega camadas de imagem, não um arquivo de design de verdade.",
    ],
    ficha: [
      { rotulo: "Licença", valor: "Open source (GitHub)" },
      { rotulo: "Tamanho", valor: "Menos de 4 GB" },
      { rotulo: "Componentes", valor: "PaddleOCR, Qwen Image Layered, DINO, SAM 2" },
      { rotulo: "Dependência externa", valor: "Chave da OpenAI (substituível)" },
      { rotulo: "Execução", valor: "Local" },
    ],
    proximosPassos: [
      {
        texto: "Veja o Ideogram Object Remover, para o caso inverso",
        href: "/inventando/ideogram-object-remover-tirar-o-objeto-a-sombra-e-o-reflexo",
      },
      { texto: "Curso: criação visual com Leonardo AI", href: "/curso/leonardo-ai-criacao-visual" },
    ],
  },

  // ─────────────────────────────────────────────────────────── 05 · Kimi K3
  {
    slug: "kimi-k3-o-maior-modelo-aberto-e-o-que-fazer-com-ele",
    titulo: "Kimi K3: o maior modelo aberto — e o que dá para fazer com ele",
    subtitulo:
      "2,8 trilhões de parâmetros, visão nativa, 1,56 TB de arquivo. Os pesos saíram na data prometida.",
    ferramenta: "Kimi K3",
    fabricante: "Moonshot AI",
    categoria: "Modelos",
    nivel: "Avançado",
    acesso: "Open source",
    duracao: "6 min",
    resumo:
      "Modelo aberto de 2,8 T de parâmetros em mistura de especialistas, com 104 B ativos e visão nativa. Versão comprimida de 1 bit cai para 594 GB.",
    publicadoEm: PUB,
    linkOficial: "https://huggingface.co/moonshotai/Kimi-K3",
    fonte: fonte("Kimi K3 open sourced", 463, 556),
    oQueE: [
      "Kimi K3 é, no momento da publicação, o modelo aberto mais poderoso disponível. A Moonshot AI tinha anunciado que os pesos sairiam em 27 de julho — e saíram na data.",
      "É um modelo de mistura de especialistas: pense num time de especialistas trabalhando junto, em que só uma parte é acionada por vez. São 2,8 trilhões de parâmetros no total, mas apenas 104 bilhões ficam ativos em cada uso.",
    ],
    porQueImporta: [
      "Prazo cumprido em lançamento aberto é sinal de laboratório confiável — e é raro.",
      "Visão vem embutida no modelo, não como acessório colado depois.",
      "Traz duas técnicas próprias de arquitetura: Kimi Delta Attention e resíduos de atenção.",
    ],
    aulas: [
      {
        titulo: "Ler a ficha técnica sem se perder",
        duracao: "2 min",
        secoes: [
          {
            tipo: "lista",
            itens: [
              "**2,8 trilhões de parâmetros no total** — o tamanho do time inteiro.",
              "**104 bilhões ativos** — quantos de fato trabalham em cada chamada. É esse número que governa a velocidade.",
              "**Kimi Delta Attention e resíduos de atenção** — técnicas de arquitetura desenvolvidas pela própria Moonshot.",
              "**MoonViT** — o codificador que dá a capacidade de visão.",
            ],
          },
          {
            tipo: "paragrafo",
            texto:
              "A distinção entre total e ativo é a que mais confunde. Total define de quanta memória você precisa; ativo define quanto custa cada resposta. Um modelo de 2,8 T com 104 B ativos é caro de guardar e relativamente barato de usar.",
          },
        ],
      },
      {
        titulo: "O tamanho do arquivo é o obstáculo",
        duracao: "2 min",
        secoes: [
          {
            tipo: "lista",
            itens: [
              "**Original:** cerca de 1,56 TB. Exige empilhar várias GPUs de nível empresarial.",
              "**GGUF de 1 bit (Unsloth):** cerca de 594 GB. Continua enorme, mas é uma queda de quase dois terços.",
            ],
          },
          {
            tipo: "paragrafo",
            texto:
              "Seja honesto sobre a conclusão: para a esmagadora maioria das pessoas, Kimi K3 não é um modelo para rodar em casa. Ele importa por outra razão — o que existe aberto define o piso do que os modelos fechados podem cobrar.",
          },
        ],
      },
      {
        titulo: "Como isso te afeta mesmo sem rodar",
        duracao: "2 min",
        secoes: [
          {
            tipo: "lista",
            itens: [
              "**Provedores terceiros.** Modelos abertos grandes aparecem rapidamente em serviços de inferência, a preço de mercado competitivo.",
              "**Pressão de preço.** Cada modelo aberto forte no topo empurra os preços fechados para baixo — o DeepSeek V4 Flash é a evidência prática disso.",
              "**Destilação.** Modelos menores treinados a partir dos grandes chegam depois, e esses cabem em hardware normal.",
            ],
          },
        ],
      },
    ],
    praQuemServe: [
      "Quem acompanha o estado da arte em modelos abertos",
      "Infraestrutura com várias GPUs empresariais disponíveis",
      "Quem escolhe fornecedor de inferência e quer saber o que vem por aí",
    ],
    limites: [
      "1,56 TB no original — inviável fora de infraestrutura empresarial.",
      "Mesmo em 1 bit são 594 GB.",
      "Modelo recém-publicado: ferramental e integrações ainda estão amadurecendo.",
    ],
    ficha: [
      { rotulo: "Licença", valor: "Aberto, pesos no Hugging Face" },
      { rotulo: "Parâmetros", valor: "2,8 T totais / 104 B ativos" },
      { rotulo: "Arquitetura", valor: "Mistura de especialistas + Kimi Delta Attention" },
      { rotulo: "Visão", valor: "Nativa, via MoonViT" },
      { rotulo: "Tamanho", valor: "1,56 TB (594 GB em GGUF de 1 bit)" },
    ],
    proximosPassos: [
      {
        texto: "Prefere algo que caiba na sua máquina? Veja o DeepSeek V4 Flash",
        href: "/inventando/deepseek-v4-flash-0731-inteligencia-de-fronteira-a-tres-centavos",
      },
      {
        texto: "E o Instella, treinado inteiro fora da Nvidia",
        href: "/inventando/instella-o-modelo-da-amd-treinado-sem-nvidia",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────── 06 · Instella
  {
    slug: "instella-o-modelo-da-amd-treinado-sem-nvidia",
    titulo: "Instella: o modelo da AMD treinado sem uma Nvidia sequer",
    subtitulo:
      "16 B de parâmetros, 2,8 B ativos, e algo mais raro: os checkpoints e as receitas de treino publicados.",
    ferramenta: "Instella",
    fabricante: "AMD",
    categoria: "Modelos",
    nivel: "Intermediário",
    acesso: "Open source",
    duracao: "7 min",
    resumo:
      "Primeiro modelo em mistura de especialistas treinado do zero em chips AMD Instinct com a pilha ROCm. Publica checkpoints, receitas e código de treino.",
    publicadoEm: PUB,
    linkOficial:
      "https://rocm.blogs.amd.com/artificial-intelligence/instella-moe/README.html",
    fonte: fonte("Instella", 556, 661),
    oQueE: [
      "A AMD lançou seu próprio modelo aberto, o Instella. O detalhe que faz dele notícia não é o desempenho — é onde ele foi treinado.",
      "A Nvidia domina o setor porque quase toda ferramenta de IA é construída sobre a plataforma CUDA, e treinar fora dela é notoriamente difícil. A AMD treinou o Instella do zero em chips AMD Instinct, usando a pilha de software ROCm.",
    ],
    porQueImporta: [
      "É prova prática de que dá para treinar um modelo competitivo fora do ecossistema CUDA.",
      "A AMD publicou os checkpoints de cada etapa e as receitas de treino, não só o modelo final.",
      "Segundo a fonte, supera modelos de tamanho parecido, como o Gemma 4 E4B e uma versão menor do Qwen 3.5.",
    ],
    aulas: [
      {
        titulo: "Por que 'sem CUDA' é a manchete",
        duracao: "2 min",
        secoes: [
          {
            tipo: "citacao",
            texto:
              "A Nvidia basicamente dominou o espaço de IA porque a maioria das ferramentas é construída sobre a plataforma CUDA. É muito difícil treinar e rodar modelos em chips que não são CUDA.",
            minuto: "09:20",
          },
          {
            tipo: "paragrafo",
            texto:
              "Um fornecedor único no ponto mais caro da cadeia é um problema estrutural: define preço, prazo de entrega e quem consegue treinar. Um modelo competitivo treinado inteiramente em hardware AMD é a demonstração de que existe segundo caminho — e isso vale mais do que a posição do Instella em qualquer tabela de desempenho.",
          },
        ],
      },
      {
        titulo: "A ficha e as duas técnicas",
        duracao: "2 min",
        secoes: [
          {
            tipo: "lista",
            itens: [
              "**16 bilhões de parâmetros no total**, em mistura de especialistas.",
              "**2,8 bilhões ativos** por uso — o que o torna eficiente.",
              "**Multi-head latent attention** — atenção e memória mais econômicas.",
              "**Far skip collective** — sobrepõe comunicação e computação entre GPUs, atacando o gargalo de coordenação no treino distribuído.",
            ],
          },
          {
            tipo: "paragrafo",
            texto:
              "A versão final, treinada com aprendizado por reforço, chama-se Think e tem cerca de 32 GB — porte médio, comparável ao Qwen 3.6, e cabe em hardware de ponta doméstico.",
          },
        ],
      },
      {
        titulo: "O que a AMD publicou junto",
        duracao: "3 min",
        secoes: [
          {
            tipo: "paragrafo",
            texto:
              "Esta é a parte que costuma passar batida e é a mais valiosa para quem estuda. A maioria dos lançamentos ditos abertos entrega apenas os pesos finais. A AMD publicou:",
          },
          {
            tipo: "lista",
            itens: [
              "Os **checkpoints** de pré-treino, treino intermediário e etapas seguintes.",
              "As **receitas de treino** de cada estágio.",
              "O **código**, incluindo os scripts de treinamento.",
              "A **documentação** de como cada estágio foi conduzido.",
            ],
          },
          {
            tipo: "paragrafo",
            texto:
              "Com checkpoints intermediários é possível estudar como a capacidade apareceu ao longo do treino, e retomar de um ponto do meio em vez de começar do zero. É material de estudo que quase ninguém abre.",
          },
        ],
      },
    ],
    praQuemServe: [
      "Quem pesquisa treino de modelos e quer receita completa, não só pesos",
      "Infraestrutura montada sobre AMD, ou quem avalia sair do CUDA",
      "Quem precisa de modelo eficiente na faixa dos 32 GB",
    ],
    limites: [
      "16 B totais: não compete com os modelos de fronteira, e não é a proposta.",
      "A pilha ROCm tem ecossistema menor que o CUDA — espere menos ferramenta pronta.",
      "As comparações citadas são da própria AMD.",
    ],
    ficha: [
      { rotulo: "Licença", valor: "Open source (código, pesos e receitas)" },
      { rotulo: "Parâmetros", valor: "16 B totais / 2,8 B ativos" },
      { rotulo: "Treinado em", valor: "AMD Instinct + pilha ROCm" },
      { rotulo: "Versão final", valor: "Think, ~32 GB" },
      { rotulo: "Diferencial", valor: "Checkpoints e receitas de treino publicados" },
    ],
    proximosPassos: [
      {
        texto: "Compare com o DeepSeek V4 Flash, também aberto e muito barato",
        href: "/inventando/deepseek-v4-flash-0731-inteligencia-de-fronteira-a-tres-centavos",
      },
      { texto: "Curso: IA open source na prática", href: "/curso/openclaw-ia-open-source" },
    ],
  },

  // ────────────────────────────────────────────── 07 · Ideogram Object Remover
  {
    slug: "ideogram-object-remover-tirar-o-objeto-a-sombra-e-o-reflexo",
    titulo: "Ideogram Object Remover: tirar o objeto, a sombra e o reflexo",
    subtitulo:
      "Você pinça o que quer remover com o pincel. O que sai junto é o que separa um removedor bom de um ruim.",
    ferramenta: "Ideogram Object Remover",
    fabricante: "Ideogram",
    categoria: "Imagem",
    nivel: "Introdutório",
    acesso: "Freemium",
    duracao: "5 min",
    resumo:
      "Removedor de objetos online e gratuito que apaga também sombra e reflexo, preservando o que estava atrás. Menor taxa de erro na comparação citada.",
    publicadoEm: PUB,
    linkOficial: "https://ideogram.ai/apps/object-remover",
    fonte: fonte("Ideogram obj remover", 661, 724),
    oQueE: [
      "O Ideogram lançou uma ferramenta dedicada a remover objetos de fotos. O uso é o mais simples possível: você passa o pincel por cima do que quer tirar, a ferramenta destaca o objeto sozinha e o remove.",
      "O que distingue esta de dezenas de outras não é a remoção em si — é o que ela entende como parte do objeto.",
    ],
    porQueImporta: [
      "Remove sombra e reflexo junto com o objeto, que é onde a maioria das ferramentas se entrega.",
      "Reconstrói o que estava atrás, mesmo quando havia outros elementos parcialmente encobertos.",
      "É gratuita para começar: a conta grátis dá créditos diários.",
    ],
    aulas: [
      {
        titulo: "O detalhe que separa um removedor bom de um ruim",
        duracao: "2 min",
        secoes: [
          {
            tipo: "paragrafo",
            texto:
              "Objeto removido sem a sombra deixa uma mancha escura flutuando — o olho detecta na hora, mesmo sem saber explicar o que está errado. A fonte mostra três casos que testam exatamente isso:",
          },
          {
            tipo: "lista",
            itens: [
              "**Bicicleta:** sai a bicicleta e sai a sombra dela.",
              "**Planta com lâmpada e livros na frente:** a planta some, a luz permanece, os livros permanecem — e o reflexo da planta no chão também é apagado.",
              "Nos testes de erro citados, a ferramenta aparece com a menor taxa de falha, à frente do Nano Banana 2 e do GPT Image 2 medium.",
            ],
          },
        ],
      },
      {
        titulo: "Usar bem em quatro passos",
        duracao: "2 min",
        secoes: [
          {
            tipo: "passos",
            itens: [
              "Crie uma conta gratuita — vêm créditos diários para testar.",
              "Suba a imagem e passe o pincel por cima do objeto indesejado.",
              "Confira o destaque automático antes de confirmar: é aqui que se corrige uma seleção que pegou de menos ou de mais.",
              "Gere e examine as bordas, a sombra e qualquer superfície reflexiva na cena.",
            ],
          },
          {
            tipo: "alerta",
            texto:
              "Confira a imagem em tamanho real antes de publicar. Removedor de objeto reconstrói o fundo por inferência, e o erro típico aparece em textura repetida — azulejo, tijolo, grade — onde o padrão remendado não fecha.",
          },
        ],
      },
      {
        titulo: "Onde isso rende dinheiro",
        duracao: "1 min",
        secoes: [
          {
            tipo: "lista",
            itens: [
              "**Foto de produto:** tirar suporte, tripé, mão do fotógrafo, etiqueta.",
              "**Anúncio imobiliário:** limpar entulho e objeto pessoal do ambiente.",
              "**Marketplace:** padronizar o fundo de fotos vindas de fornecedores diferentes.",
            ],
          },
        ],
      },
    ],
    praQuemServe: [
      "Quem fotografa produto e precisa de imagem limpa",
      "Corretores e anunciantes de imóveis",
      "Social media que trata imagem de terceiros todo dia",
    ],
    limites: [
      "Créditos diários limitados na conta gratuita.",
      "Roda online — a imagem passa pelo serviço.",
      "Textura repetitiva ao fundo ainda é o ponto fraco de qualquer removedor.",
    ],
    ficha: [
      { rotulo: "Acesso", valor: "Gratuito com créditos diários" },
      { rotulo: "Execução", valor: "Online, sem instalar" },
      { rotulo: "Diferencial", valor: "Remove sombra e reflexo junto" },
      { rotulo: "Comparado a", valor: "Nano Banana 2, GPT Image 2 medium" },
    ],
    proximosPassos: [
      {
        texto: "Precisa editar os elementos em vez de removê-los? Veja o ReDesign",
        href: "/inventando/redesign-transformar-uma-imagem-plana-em-camadas-editaveis",
      },
      { texto: "Curso: Midjourney para arte profissional", href: "/curso/midjourney-arte-profissional" },
    ],
  },

  // ────────────────────────────────────────────────────────── 08 · Higgsfield
  {
    slug: "higgsfield-marketing-studio-e-cinema-studio",
    titulo: "Higgsfield: Marketing Studio e Cinema Studio",
    subtitulo:
      "Vários modelos de vídeo numa assinatura só, com dois fluxos prontos — anúncio e filme.",
    ferramenta: "Higgsfield",
    fabricante: "Higgsfield",
    categoria: "Vídeo",
    nivel: "Introdutório",
    acesso: "Pago",
    duracao: "5 min",
    resumo:
      "Plataforma que reúne Seedance, Kling e outros modelos de vídeo, com Marketing Studio para anúncios e Cinema Studio para produção com controle de cena.",
    publicadoEm: PUB,
    linkOficial: "https://higgsfield.ai/",
    patrocinado: true,
    fonte: fonte("Higgsfield", 724, 819),
    oQueE: [
      "Higgsfield é uma plataforma que junta vários dos principais modelos de vídeo num lugar só — Seedance e Kling entre eles — em vez de obrigar a assinar cada um separadamente.",
      "Duas áreas se destacam: o Marketing Studio, voltado a peça publicitária, e o Cinema Studio, voltado a produção com controle de cena.",
    ],
    porQueImporta: [
      "Acesso a vários modelos de ponta sem manter assinatura em cada fornecedor.",
      "Aceita combinar texto, imagem, vídeo e áudio como entrada no mesmo pedido.",
      "Já gera em 4K com o Seedance 2.0.",
    ],
    aulas: [
      {
        titulo: "Marketing Studio",
        duracao: "2 min",
        secoes: [
          {
            tipo: "paragrafo",
            texto:
              "O fluxo parte de um link de produto ou de uma foto do produto e gera vários formatos de anúncio de uma vez:",
          },
          {
            tipo: "lista",
            itens: [
              "Vídeo em estilo UGC (conteúdo de usuário)",
              "Tutorial",
              "Unboxing",
              "Resenha de produto",
            ],
          },
          {
            tipo: "paragrafo",
            texto:
              "A economia aqui é de tempo de montagem: em vez de roteirizar quatro peças, você recebe quatro variações do mesmo produto para testar qual performa.",
          },
        ],
      },
      {
        titulo: "Cinema Studio",
        duracao: "2 min",
        secoes: [
          {
            tipo: "citacao",
            texto:
              "Em vez de só digitar um prompt e torcer para o vídeo sair bom, o Cinema Studio deixa você planejar cenas, controlar a câmera, adicionar personagens específicos e manter tudo consistente no projeto inteiro.",
            minuto: "13:05",
          },
          {
            tipo: "paragrafo",
            texto:
              "É a diferença entre gerar clipes soltos e conduzir uma produção. Consistência entre cenas é justamente o que quebra quando se usa gerador de vídeo por prompt avulso.",
          },
        ],
      },
      {
        titulo: "O que considerar antes de assinar",
        duracao: "1 min",
        secoes: [
          {
            tipo: "alerta",
            texto:
              "Este segmento era publicidade no vídeo de origem — o próprio autor identifica a Higgsfield como patrocinadora. O conteúdo acima descreve o que foi apresentado; nada aqui é teste independente. Mantivemos o microcurso porque a ferramenta é real e relevante, mas trate os elogios como material promocional.",
          },
          {
            tipo: "lista",
            itens: [
              "Confira quais modelos estão incluídos no plano — a lista muda com frequência.",
              "Seedance 2.5 foi anunciado como \"em breve\" na plataforma, não como já disponível.",
              "Compare o custo por clipe com o de usar o modelo direto na origem.",
            ],
          },
        ],
      },
    ],
    praQuemServe: [
      "Quem produz anúncio em volume e precisa de variação rápida",
      "Criadores que não querem manter cinco assinaturas separadas",
      "Quem precisa de consistência entre cenas de um mesmo projeto",
    ],
    limites: [
      "Plataforma paga, por créditos.",
      "Segmento patrocinado na fonte — sem avaliação independente.",
      "A disponibilidade dos modelos varia; Seedance 2.5 estava anunciado como futuro.",
    ],
    ficha: [
      { rotulo: "Acesso", valor: "Pago" },
      { rotulo: "Modelos", valor: "Seedance, Kling e outros" },
      { rotulo: "Resolução", valor: "Até 4K com Seedance 2.0" },
      { rotulo: "Entradas", valor: "Texto, imagem, vídeo e áudio" },
      { rotulo: "Divulgação", valor: "Patrocinador do vídeo de origem" },
    ],
    proximosPassos: [
      {
        texto: "Veja o Seedance 2.5, o modelo por trás de boa parte disso",
        href: "/inventando/seedance-2-5-trinta-segundos-de-video-com-o-mesmo-personagem",
      },
      {
        texto: "E a alternativa mais barata, MiniMax H3",
        href: "/inventando/minimax-h3-video-em-2k-tres-vezes-mais-barato",
      },
    ],
  },

  // ─────────────────────────────────────────────────────── 09 · Inkling Small
  {
    slug: "inkling-small-o-modelo-aberto-que-escuta",
    titulo: "Inkling Small: o modelo aberto que escuta",
    subtitulo:
      "Não é o mais inteligente da faixa. É o que entende áudio, imagem, vídeo e texto ao mesmo tempo.",
    ferramenta: "Inkling Small",
    fabricante: "Thinking Machines",
    categoria: "Modelos",
    nivel: "Avançado",
    acesso: "Open source",
    duracao: "6 min",
    resumo:
      "Versão reduzida do Inkling: 276 B totais, 12 B ativos, omnimodal. Fica atrás em inteligência pura, mas lidera em áudio entre os abertos.",
    publicadoEm: PUB,
    linkOficial: "https://huggingface.co/thinkingmachines/Inkling-Small",
    fonte: fonte("Inkling Small", 819, 933),
    oQueE: [
      "A Thinking Machines — laboratório fundado pela ex-diretora de tecnologia da OpenAI — publicou o Inkling Small, versão reduzida do Inkling lançado na semana anterior.",
      "É um modelo omnimodal: entende texto, áudio, imagem e vídeo no mesmo modelo. Tem cerca de um quarto do tamanho do original, o que ainda o deixa em 276 bilhões de parâmetros totais, com 12 bilhões ativos por uso.",
    ],
    porQueImporta: [
      "Áudio é a modalidade em que os modelos abertos costumam ir mal — e é justamente onde este se destaca.",
      "Em alguns testes supera o modelo completo usando menos computação.",
      "Fica a um ponto do Inkling completo em avaliação independente, por custo bem menor.",
    ],
    aulas: [
      {
        titulo: "Seja honesto sobre onde ele perde",
        duracao: "2 min",
        secoes: [
          {
            tipo: "paragrafo",
            texto:
              "A fonte não vende o modelo como campeão geral, e vale repetir a ressalva:",
          },
          {
            tipo: "citacao",
            texto:
              "Em termos de inteligência, o Inkling Small não é o melhor, mas eu gosto das capacidades multimodais dele.",
            minuto: "15:05",
          },
          {
            tipo: "paragrafo",
            texto:
              "Nas comparações com DeepSeek V4 Flash, Gemini 3.5 Flash Lite e GPT 5.6 Luna, ele se sustenta — mas fica atrás de outros abertos de porte parecido em inteligência pura. A vantagem aparece quando entra áudio na conta: aí os outros não acompanham.",
          },
        ],
      },
      {
        titulo: "Quando a escolha certa é este modelo",
        duracao: "2 min",
        secoes: [
          {
            tipo: "paragrafo",
            texto:
              "O critério é simples e evita perder tempo: se o seu problema tem áudio dentro dele, este é o candidato. Se não tem, quase certamente existe opção melhor.",
          },
          {
            tipo: "lista",
            itens: [
              "Analisar gravação de reunião ou de atendimento **entendendo o conteúdo**, não só transcrevendo.",
              "Avaliar vídeo em que a trilha e a fala importam tanto quanto a imagem.",
              "Moderar conteúdo que chega em formatos misturados.",
            ],
          },
          {
            tipo: "paragrafo",
            texto:
              "Repare na diferença em relação a um transcritor: o CrisperWhisper converte fala em texto. O Inkling Small raciocina sobre o áudio — tom, sobreposição, o que está sendo dito e como.",
          },
        ],
      },
      {
        titulo: "O custo de rodar",
        duracao: "2 min",
        secoes: [
          {
            tipo: "lista",
            itens: [
              "**276 bilhões de parâmetros totais**, 12 bilhões ativos.",
              "**532 GB** de arquivo — exige empilhar vários DGX Spark, segundo a fonte.",
              "Publicado no Hugging Face, com instruções de download na página.",
            ],
          },
          {
            tipo: "alerta",
            texto:
              "Um quarto do tamanho do original ainda é meio terabyte. \"Small\" aqui é relativo ao irmão maior, não à sua máquina.",
          },
        ],
      },
    ],
    praQuemServe: [
      "Quem precisa de compreensão de áudio, não só transcrição",
      "Times que processam conteúdo em formatos misturados",
      "Quem tem infraestrutura para meio terabyte de modelo",
    ],
    limites: [
      "Perde em inteligência pura para abertos do mesmo porte, como o DeepSeek V4 Flash.",
      "532 GB — fora do alcance de hardware doméstico.",
      "Vantagem concentrada em áudio; sem áudio, há opções melhores.",
    ],
    ficha: [
      { rotulo: "Licença", valor: "Aberto, no Hugging Face" },
      { rotulo: "Parâmetros", valor: "276 B totais / 12 B ativos" },
      { rotulo: "Modalidades", valor: "Texto, áudio, imagem e vídeo" },
      { rotulo: "Tamanho", valor: "532 GB" },
      { rotulo: "Posição", valor: "1 ponto abaixo do Inkling completo" },
    ],
    proximosPassos: [
      {
        texto: "Para só transcrever, o CrisperWhisper 2 é muito mais leve",
        href: "/inventando/crisperwhisper-2-transcricao-com-tempo-por-palavra",
      },
      {
        texto: "Para inteligência pura barata, DeepSeek V4 Flash",
        href: "/inventando/deepseek-v4-flash-0731-inteligencia-de-fronteira-a-tres-centavos",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────── 10 · PRISM
  {
    slug: "prism-robos-que-decidem-com-mais-de-um-sentido",
    titulo: "PRISM: robôs que decidem com mais de um sentido",
    subtitulo:
      "Força, velocidade, contato, atrito, ângulo da junta — combinados, e não um de cada vez.",
    ferramenta: "PRISM",
    fabricante: "Projeto acadêmico aberto",
    categoria: "Robótica",
    nivel: "Avançado",
    acesso: "Open source",
    duracao: "5 min",
    resumo:
      "Sistema de controle que cruza vários sinais físicos para decidir o movimento do robô. Taxa de sucesso maior que a de algoritmos comparáveis em manipulação.",
    publicadoEm: PUB,
    linkOficial: "https://lsh3163.github.io/prism/",
    fonte: fonte("Prism", 933, 1006),
    oQueE: [
      "PRISM é um sistema de controle para robôs, com foco em lidar melhor com contato físico. Ele recebe as leituras dos sensores comuns do robô, imagens e instruções, e devolve as ações de movimento.",
      "A ideia central é uma correção de rota conceitual: a ação de um robô não deveria depender de uma medida isolada.",
    ],
    porQueImporta: [
      "Manipular objeto é onde robô mais falha, e é exatamente o alvo do sistema.",
      "Taxa de sucesso mais alta e taxa de erro mais baixa que algoritmos comparáveis.",
      "O código está publicado, com instruções para reproduzir.",
    ],
    aulas: [
      {
        titulo: "O problema de olhar um sinal só",
        duracao: "2 min",
        secoes: [
          {
            tipo: "citacao",
            texto:
              "As ações que o robô toma não deveriam depender de uma métrica só. Deveriam vir de medições diferentes — força, velocidade, contato, atrito, ângulo da junta, e assim por diante.",
            minuto: "16:05",
          },
          {
            tipo: "paragrafo",
            texto:
              "Pense em pegar um copo de vidro. Só a posição não basta: é preciso saber quanta força está sendo aplicada, se o copo está escorregando, em que ângulo a mão está. Um controlador que otimiza uma medida isolada quebra o copo ou o deixa cair.",
          },
          {
            tipo: "paragrafo",
            texto:
              "PRISM examina as combinações desses sinais para decidir a ação — e é essa combinação, não um sensor novo, que produz o ganho.",
          },
        ],
      },
      {
        titulo: "O que os resultados mostram",
        duracao: "2 min",
        secoes: [
          {
            tipo: "lista",
            itens: [
              "Taxa de sucesso bem maior que a de algoritmos semelhantes.",
              "A diferença é mais acentuada em tarefas de **manipulação de objetos**.",
              "Taxa de erro menor em todas as métricas apresentadas.",
            ],
          },
          {
            tipo: "alerta",
            texto:
              "Resultado de laboratório em robótica costuma cair quando encontra o mundo real — iluminação, desgaste do sensor, objeto fora da distribuição de treino. Trate os números como promissores, não como garantidos.",
          },
        ],
      },
      {
        titulo: "Reproduzir",
        duracao: "1 min",
        secoes: [
          {
            tipo: "passos",
            itens: [
              "Abra a página do projeto — o código está no topo.",
              "Role até as instruções de execução.",
              "Confira quais plataformas de robô e conjuntos de sensores são suportados antes de investir tempo.",
            ],
          },
        ],
      },
    ],
    praQuemServe: [
      "Pesquisa e engenharia de robótica",
      "Quem trabalha com manipulação e preensão",
      "Automação industrial avaliando o estado da arte",
    ],
    limites: [
      "Exige robô com sensoriamento rico — não serve para qualquer plataforma.",
      "Resultados de laboratório, ainda sem validação em produção.",
      "Área altamente especializada: fora dela, o valor é informativo.",
    ],
    ficha: [
      { rotulo: "Licença", valor: "Código publicado" },
      { rotulo: "Entradas", valor: "Sensores, imagens e instruções" },
      { rotulo: "Saída", valor: "Ações de movimento" },
      { rotulo: "Sinais usados", valor: "Força, velocidade, contato, atrito, ângulo" },
      { rotulo: "Foco", valor: "Manipulação de objetos" },
    ],
    proximosPassos: [
      {
        texto: "Compare com o Gemini Robotics 2, do Google DeepMind",
        href: "/inventando/gemini-robotics-2-do-pe-a-ponta-dos-dedos",
      },
      { texto: "Acompanhe o radar de tendências", href: "/radar" },
    ],
  },

  // ─────────────────────────────────────────────────────── 11 · Seedance 2.5
  {
    slug: "seedance-2-5-trinta-segundos-de-video-com-o-mesmo-personagem",
    titulo: "Seedance 2.5: trinta segundos de vídeo com o mesmo personagem",
    subtitulo:
      "O melhor gerador de vídeo disponível, segundo a fonte — e também um dos mais caros.",
    ferramenta: "Seedance 2.5",
    fabricante: "ByteDance",
    categoria: "Vídeo",
    nivel: "Intermediário",
    acesso: "Pago",
    duracao: "8 min",
    resumo:
      "Gera até 30 s em 720p, aceita 50 referências entre áudio, imagem e vídeo, e mantém consistência de personagem em cena de ação. ~US$ 4,60 por 10 s.",
    publicadoEm: PUB,
    linkOficial: "https://seed.bytedance.com/en/seedance2_5",
    fonte: fonte("Seedance 2.5", 1006, 1144),
    oQueE: [
      "A ByteDance lançou o Seedance 2.5, sucessor de um modelo que já era considerado o melhor gerador de vídeo disponível. A fonte é direta ao dizer que nenhum concorrente chegava perto do Seedance 2 — e que o 2.5 é melhor ainda.",
      "Os dois pontos fortes citados são cena de ação intensa e consistência de personagem, que são justamente os dois lugares onde geradores de vídeo costumam falhar de forma visível.",
    ],
    porQueImporta: [
      "Gera até 30 segundos — os concorrentes param entre 15 e 20.",
      "Aceita até 50 entradas de referência, entre áudio, imagem e vídeo.",
      "Aceita fluxos de produção reais: cena 3D bruta, tela verde e storyboard.",
    ],
    aulas: [
      {
        titulo: "As quatro formas de entrada que mudam o jogo",
        duracao: "3 min",
        secoes: [
          {
            tipo: "paragrafo",
            texto:
              "O interessante do 2.5 não é o prompt de texto — é aceitar material que já existe na produção:",
          },
          {
            tipo: "lista",
            itens: [
              "**Cena 3D simples.** Envie um bloco 3D rudimentar e receba um vídeo completo que respeita aquela composição. A câmera e o enquadramento passam a ser decisão sua, não sorte.",
              "**Tela verde.** Envie um vídeo com fundo verde e peça para transformar a cena.",
              "**Storyboard.** Envie o quadro a quadro e receba um vídeo que segue os planos na ordem.",
              "**Até 50 referências** combinando áudio, imagem e vídeo no mesmo pedido.",
            ],
          },
          {
            tipo: "paragrafo",
            texto:
              "É a diferença entre pedir um vídeo e dirigir um vídeo. Quem já tem processo de produção consegue encaixar o modelo no meio dele, em vez de recomeçar do prompt.",
          },
        ],
      },
      {
        titulo: "A conta",
        duracao: "2 min",
        secoes: [
          {
            tipo: "lista",
            itens: [
              "Um clipe de 10 segundos custa cerca de **460 créditos**.",
              "Mil créditos custam cerca de **US$ 10**.",
              "Ou seja: **~US$ 4,60 por 10 segundos** — cerca de três vezes o preço do MiniMax H3.",
            ],
          },
          {
            tipo: "paragrafo",
            texto:
              "Antes de descartar por preço, faça a comparação que a fonte faz: continua sendo muito mais barato do que filmar. A pergunta certa não é se é caro em relação a outro modelo, e sim em relação à diária de produção que ele substitui.",
          },
        ],
      },
      {
        titulo: "O que ainda não dá",
        duracao: "2 min",
        secoes: [
          {
            tipo: "lista",
            itens: [
              "**Resolução:** só 720p por enquanto. 1080p e 4K foram anunciados para breve.",
              "**Região:** disponível em algumas plataformas da ByteDance, como o Dreamina, mas não nos Estados Unidos no momento da publicação.",
              "**API:** ainda não liberada — a previsão citada era a semana seguinte.",
            ],
          },
          {
            tipo: "alerta",
            texto:
              "Sem API, não há automação. Se o seu plano depende de gerar vídeo dentro de um fluxo automatizado, este modelo ainda não entra — confirme a liberação antes de desenhar o processo em cima dele.",
          },
        ],
      },
    ],
    praQuemServe: [
      "Quem produz cena de ação ou vídeo com personagem recorrente",
      "Produção que já trabalha com storyboard ou pré-visualização 3D",
      "Quem precisa de clipe acima de 20 segundos numa tacada",
    ],
    limites: [
      "720p por enquanto.",
      "Sem API na publicação — nada de automação.",
      "Indisponível em vários países, incluindo os EUA.",
      "O mais caro entre os citados: ~US$ 4,60 por 10 s.",
    ],
    ficha: [
      { rotulo: "Acesso", valor: "Pago, por créditos" },
      { rotulo: "Duração", valor: "Até 30 segundos" },
      { rotulo: "Resolução", valor: "720p (1080p e 4K anunciados)" },
      { rotulo: "Referências", valor: "Até 50 (áudio, imagem, vídeo)" },
      { rotulo: "Custo", valor: "~US$ 4,60 por 10 s" },
    ],
    proximosPassos: [
      {
        texto: "A alternativa três vezes mais barata: MiniMax H3",
        href: "/inventando/minimax-h3-video-em-2k-tres-vezes-mais-barato",
      },
      {
        texto: "Para reestilizar vídeo que já existe, ID-V2V",
        href: "/inventando/id-v2v-trocar-o-estilo-do-video-sem-trocar-o-ator",
      },
    ],
  },

  // ──────────────────────────────────────────────────────── 12 · MiniMax H3
  {
    slug: "minimax-h3-video-em-2k-tres-vezes-mais-barato",
    titulo: "MiniMax H3: vídeo em 2K, três vezes mais barato",
    subtitulo:
      "Mesma turma do Hailuo, agora rebatizada — e com promessa de abrir o código.",
    ferramenta: "MiniMax H3",
    fabricante: "MiniMax",
    categoria: "Vídeo",
    nivel: "Intermediário",
    acesso: "Pago",
    duracao: "7 min",
    resumo:
      "Gerador multimodal com saída em 2K e até 15 s, a cerca de US$ 1,20 por 10 s. A MiniMax anunciou que vai publicar o modelo.",
    publicadoEm: PUB,
    linkOficial: "https://www.minimax.io/blog/minimax-h3",
    fonte: fonte("Minimax H3", 1144, 1330),
    oQueE: [
      "MiniMax H3 é o modelo de vídeo mais recente da MiniMax — a empresa por trás do Hailuo, que aparentemente está sendo rebatizado para a série H.",
      "É multimodal: aceita texto, imagem, vídeo e áudio como referência, e gera em resolução de até 2K.",
    ],
    porQueImporta: [
      "2K de saída, contra os 720p do Seedance 2.5.",
      "Cerca de US$ 1,20 por 10 segundos — aproximadamente um terço do preço do concorrente.",
      "A MiniMax anunciou que vai abrir o modelo, o que o colocaria como o melhor gerador de vídeo aberto.",
    ],
    aulas: [
      {
        titulo: "O que ele aceita de entrada",
        duracao: "3 min",
        secoes: [
          {
            tipo: "paragrafo",
            texto:
              "Os exemplos demonstrados cobrem quase todos os fluxos de produção que existem:",
          },
          {
            tipo: "lista",
            itens: [
              "**Duas imagens → trailer.** Duas referências viram um trailer com narrativa.",
              "**Storyboard + logotipo → comercial.** Entrada de storyboard e marca, saída de anúncio completo — o exemplo é uma bolsa de luxo.",
              "**Referência de estilo.** Painéis em vermelho e azul no estilo de história em quadrinhos viram vídeo naquela estética.",
              "**Tela verde + fundo.** Vídeo com fundo verde mais a imagem do cenário desejado.",
              "**Áudio + imagem + tipografia → videoclipe.** Uma faixa musical, uma foto de grupo e painéis de referência tipográfica.",
            ],
          },
          {
            tipo: "paragrafo",
            texto:
              "O exemplo do videoclipe mostra até onde vai o controle: o pedido incluiu efeito de granulação e ruído, estética grunge, edição rápida, apenas cortes secos e cortes a cada três segundos acompanhando a batida. Ou seja — dá para dirigir a montagem, não só a imagem.",
          },
        ],
      },
      {
        titulo: "A conta, lado a lado",
        duracao: "2 min",
        secoes: [
          {
            tipo: "lista",
            itens: [
              "**MiniMax H3:** 120 créditos por 10 s; mil créditos por US$ 10 → **~US$ 1,20**.",
              "**Seedance 2.5:** 460 créditos por 10 s → **~US$ 4,60**.",
            ],
          },
          {
            tipo: "paragrafo",
            texto:
              "Praticamente três vezes mais barato, e com resolução maior. A vantagem que sobra ao Seedance é duração (30 s contra 15 s) e desempenho em cena de ação pesada.",
          },
        ],
      },
      {
        titulo: "A parte que realmente importa: vai ser aberto",
        duracao: "2 min",
        secoes: [
          {
            tipo: "citacao",
            texto:
              "O mais legal é que eles vão de fato abrir o código disso. Provavelmente publicam o modelo na semana que vem. Acho que vai ser o melhor modelo de vídeo aberto que existe.",
            minuto: "21:40",
          },
          {
            tipo: "paragrafo",
            texto:
              "Se a promessa se cumprir, o custo por clipe cai para o preço da sua própria eletricidade, e a geração passa a poder acontecer dentro de casa. É a diferença entre alugar e ter.",
          },
          {
            tipo: "alerta",
            texto:
              "Enquanto não sai, é promessa. Vale acompanhar a página oficial antes de montar processo em cima da versão aberta — a Adobe, no mesmo vídeo, tem histórico de anunciar publicação e não entregar.",
          },
        ],
      },
    ],
    praQuemServe: [
      "Quem precisa de vídeo em volume com custo controlado",
      "Produção que trabalha com storyboard, tela verde ou referência de marca",
      "Quem pretende rodar geração de vídeo localmente quando abrir",
    ],
    limites: [
      "Máximo de 15 segundos por clipe.",
      "Pago por créditos enquanto não for aberto.",
      "Publicação do modelo era promessa, não fato, na data.",
    ],
    ficha: [
      { rotulo: "Acesso", valor: "Pago (abertura anunciada)" },
      { rotulo: "Resolução", valor: "Até 2K" },
      { rotulo: "Duração", valor: "Até 15 segundos" },
      { rotulo: "Custo", valor: "~US$ 1,20 por 10 s" },
      { rotulo: "Entradas", valor: "Texto, imagem, vídeo e áudio" },
    ],
    proximosPassos: [
      {
        texto: "Compare com o Seedance 2.5",
        href: "/inventando/seedance-2-5-trinta-segundos-de-video-com-o-mesmo-personagem",
      },
      { texto: "Curso: engenharia de prompt", href: "/curso/prompt-engineering" },
    ],
  },

  // ─────────────────────────────────────────────── 13 · Gemini Robotics 2
  {
    slug: "gemini-robotics-2-do-pe-a-ponta-dos-dedos",
    titulo: "Gemini Robotics 2: do pé à ponta dos dedos",
    subtitulo:
      "Andar, se equilibrar, alcançar, agarrar e raciocinar — numa sequência contínua, não em módulos separados.",
    ferramenta: "Gemini Robotics 2",
    fabricante: "Google DeepMind",
    categoria: "Robótica",
    nivel: "Intermediário",
    acesso: "Freemium",
    duracao: "6 min",
    resumo:
      "Família de três modelos para controlar robô de corpo inteiro: o principal de visão-linguagem-ação, o ER2 de raciocínio e um que roda no próprio robô, sem internet.",
    publicadoEm: PUB,
    linkOficial:
      "https://deepmind.google/blog/gemini-robotics-2-brings-whole-body-intelligence-to-robots/",
    fonte: fonte("Gemini Robotics 2", 1330, 1444),
    oQueE: [
      "O Google DeepMind lançou o Gemini Robotics 2, uma família de modelos para controlar um robô — nas palavras da fonte — dos pés até a ponta dos dedos.",
      "A versão anterior tratava basicamente da parte superior do corpo e de tarefas sobre a mesa. Esta combina caminhar, equilibrar-se, alcançar, agarrar e raciocinar numa sequência contínua.",
    ],
    porQueImporta: [
      "Sequência contínua: entender a ordem, localizar o objeto, andar até ele, pegar, atravessar a sala e depositar no lugar certo.",
      "São três modelos com papéis distintos, não um só.",
      "Um deles roda no próprio robô, completamente offline.",
      "Dá para experimentar no AI Studio.",
    ],
    aulas: [
      {
        titulo: "Os três modelos e para que serve cada um",
        duracao: "3 min",
        secoes: [
          {
            tipo: "lista",
            itens: [
              "**Gemini Robotics 2** — o modelo de visão-linguagem-ação. Converte sua instrução em linguagem natural, mais o que as câmeras do robô veem, em comandos motores.",
              "**Gemini Robotics ER2** — o raciocínio de alto nível. Entende o ambiente, planeja tarefas, corrige falhas e coordena múltiplos robôs.",
              "**Gemini Robotics On-Device 2** — versão menor que roda no próprio robô, sem conexão com a internet.",
            ],
          },
          {
            tipo: "paragrafo",
            texto:
              "A divisão espelha como uma pessoa opera: um nível decide o que fazer e replaneja quando dá errado, outro executa o movimento. O modelo local resolve o problema prático da conectividade — robô que depende de internet para se mexer trava quando a rede cai.",
          },
        ],
      },
      {
        titulo: "O que mudou nas mãos",
        duracao: "2 min",
        secoes: [
          {
            tipo: "paragrafo",
            texto:
              "O salto mais visível é o controle fino dos dedos. As tarefas demonstradas são deliberadamente difíceis:",
          },
          {
            tipo: "lista",
            itens: [
              "Desenroscar uma lâmpada.",
              "Amarrar um saco de lixo.",
              "Fechar um saquinho tipo Ziploc.",
            ],
          },
          {
            tipo: "paragrafo",
            texto:
              "São tarefas que exigem força variável e ajuste contínuo — o oposto de pegar um cubo. É a mesma fronteira que o PRISM ataca por outro caminho, cruzando sinais físicos.",
          },
        ],
      },
      {
        titulo: "Como colocar a mão",
        duracao: "1 min",
        secoes: [
          {
            tipo: "passos",
            itens: [
              "Abra a página de anúncio e vá até o fim.",
              "Experimente o Gemini Robotics 2 dentro do AI Studio.",
              "Se você trabalha com robótica, inscreva-se no programa de testadores confiáveis.",
            ],
          },
          {
            tipo: "alerta",
            texto:
              "As demonstrações usam um humanoide Apollo 2. Desempenho em outra plataforma é coisa a verificar, não a supor.",
          },
        ],
      },
    ],
    praQuemServe: [
      "Quem desenvolve ou integra robótica",
      "Pesquisa em sistemas incorporados e manipulação",
      "Quem acompanha para onde vai a automação física",
    ],
    limites: [
      "Acesso pleno depende do programa de testadores.",
      "Demonstrações concentradas num humanoide específico.",
      "O modelo local é menor — espere capacidade reduzida em troca do offline.",
    ],
    ficha: [
      { rotulo: "Acesso", valor: "AI Studio + programa de testadores" },
      { rotulo: "Modelos", valor: "3 (VLA, ER2, On-Device 2)" },
      { rotulo: "Escopo", valor: "Corpo inteiro" },
      { rotulo: "Offline", valor: "Sim, na versão On-Device 2" },
      { rotulo: "Demonstrado em", valor: "Humanoide Apollo 2" },
    ],
    proximosPassos: [
      {
        texto: "Veja o PRISM, que ataca o mesmo problema por outro ângulo",
        href: "/inventando/prism-robos-que-decidem-com-mais-de-um-sentido",
      },
      { texto: "Curso: Gemini, a IA do Google", href: "/curso/gemini-ia-google" },
    ],
  },

  // ────────────────────────────────────────────────────────────── 14 · Wonder
  {
    slug: "wonder-da-adobe-um-video-que-vira-cenario-navegavel",
    titulo: "Wonder, da Adobe: um vídeo que vira cenário navegável",
    subtitulo:
      "Você aperta as teclas e caminha dentro da cena. Continua sendo vídeo — e o código ainda não saiu.",
    ferramenta: "Wonder",
    fabricante: "Adobe",
    categoria: "Mundos 3D",
    nivel: "Introdutório",
    acesso: "Em breve",
    duracao: "5 min",
    resumo:
      "Modelo de mundo que gera ambiente interativo explorável em tempo real, a partir de uma imagem ou de um vídeo. Código anunciado, ainda não publicado.",
    publicadoEm: PUB,
    linkOficial: "https://wonder-world-model.github.io/",
    fonte: fonte("Wonder", 1444, 1519),
    oQueE: [
      "Wonder é um modelo de mundo em vídeo: ele gera um ambiente que dá para explorar em tempo real, apertando teclas para navegar. Tecnicamente continua sendo vídeo — não há cenário 3D construído por trás.",
      "O diferencial em relação a outros modelos do tipo é aceitar **um vídeo** como ponto de partida, e não apenas uma imagem inicial.",
    ],
    porQueImporta: [
      "Com vídeo de entrada, ele reproduz o mesmo movimento e ainda permite caminhar pela cena, como se você visse aquele vídeo em três dimensões.",
      "Funciona com estilos variados: anime, arte digital, ilustração e cenas realistas.",
      "Dá para mudar o ponto de vista da câmera dentro de uma cena de ação.",
    ],
    aulas: [
      {
        titulo: "A diferença entre imagem e vídeo de entrada",
        duracao: "2 min",
        secoes: [
          {
            tipo: "paragrafo",
            texto:
              "A maioria dos modelos de mundo parte de uma imagem: você entrega um quadro e ele inventa o resto do espaço. Wonder aceita um vídeo inteiro.",
          },
          {
            tipo: "citacao",
            texto:
              "Isso vai renderizar os mesmos movimentos do vídeo, mas agora permite que você ande pela cena como se estivesse vendo o vídeo em 3D.",
            minuto: "24:40",
          },
          {
            tipo: "paragrafo",
            texto:
              "O movimento original é preservado — a ação continua acontecendo — e a câmera passa a ser sua. Numa cena de luta, isso significa escolher de onde assistir.",
          },
        ],
      },
      {
        titulo: "A qualidade, sem maquiagem",
        duracao: "2 min",
        secoes: [
          {
            tipo: "paragrafo",
            texto:
              "A própria fonte é insistente na ressalva, e ela merece ser repetida por inteiro: a qualidade não é boa. Há ruído e inconsistência nas bordas, e artefatos aparecem em várias das gerações mostradas.",
          },
          {
            tipo: "paragrafo",
            texto:
              "É pesquisa em estágio inicial. O valor está na demonstração da capacidade, não no resultado pronto para publicar.",
          },
        ],
      },
      {
        titulo: "O aviso que vale mais que a demonstração",
        duracao: "1 min",
        secoes: [
          {
            tipo: "alerta",
            texto:
              "A página diz que código e modelos estão \"em breve\". A fonte acrescenta uma observação que vale registrar: isto é da Adobe, que não costuma publicar de fato o que anuncia. Trate como demonstração de pesquisa. Não planeje nada em cima de uma data.",
          },
        ],
      },
    ],
    praQuemServe: [
      "Quem acompanha modelos de mundo e vídeo interativo",
      "Games e experiências imersivas, no nível de prospecção",
      "Curiosidade técnica — hoje não há o que usar",
    ],
    limites: [
      "Código e modelos não foram publicados.",
      "Qualidade visual com ruído e artefatos visíveis.",
      "É vídeo, não cenário 3D de verdade.",
    ],
    ficha: [
      { rotulo: "Status", valor: "Código \"em breve\"" },
      { rotulo: "Entrada", valor: "Imagem ou vídeo" },
      { rotulo: "Interação", valor: "Teclado, em tempo real" },
      { rotulo: "Estilos", valor: "Anime, arte digital, realista" },
    ],
    proximosPassos: [
      {
        texto: "Veja o Phi-Zero, que ataca mundos interativos pela física",
        href: "/inventando/phi-zero-pensar-a-fisica-antes-do-primeiro-quadro",
      },
      { texto: "Acompanhe o radar de tendências", href: "/radar" },
    ],
  },

  // ────────────────────────────────────────────── 15 · Gemini voice typing
  {
    slug: "gemini-voice-typing-ditado-que-ja-sai-limpo",
    titulo: "Gemini voice typing: ditado que já sai limpo",
    subtitulo:
      "Segure a tecla função, fale torto, e o texto chega arrumado no cursor. Por enquanto só no macOS.",
    ferramenta: "Gemini voice typing",
    fabricante: "Google",
    categoria: "Produtividade",
    nivel: "Introdutório",
    acesso: "Gratuito",
    duracao: "4 min",
    resumo:
      "Ditado por IA no app do Gemini: transcreve em qualquer aplicativo do Mac, remove muletas, entende correção no meio da frase e ajusta pontuação.",
    publicadoEm: PUB,
    linkOficial:
      "https://blog.google/innovation-and-ai/products/gemini-app/speak-naturally-gemini-app-mac-os/",
    fonte: fonte("Gemini voice typing", 1519, 1586),
    oQueE: [
      "O Google adicionou ditado por voz ao aplicativo do Gemini. Você segura a tecla função e fala naturalmente dentro de praticamente qualquer aplicativo do Mac; o Gemini transcreve e insere o texto direto onde está o cursor.",
      "O que diferencia de um ditado comum é o tratamento: ele não escreve o que você falou, escreve o que você quis dizer.",
    ],
    porQueImporta: [
      "Remove palavras de preenchimento, erros e repetições automaticamente.",
      "Entende quando você se corrige no meio da frase — e mantém a versão corrigida.",
      "Arruma formatação e pontuação sem que você precise ditá-las.",
    ],
    aulas: [
      {
        titulo: "Como funciona no dia a dia",
        duracao: "2 min",
        secoes: [
          {
            tipo: "passos",
            itens: [
              "Abra qualquer aplicativo no Mac e posicione o cursor onde o texto deve entrar.",
              "Segure a tecla função e fale naturalmente — sem ditar pontuação.",
              "Solte. O texto limpo aparece na posição do cursor.",
            ],
          },
          {
            tipo: "paragrafo",
            texto:
              "O ganho de velocidade vem justamente de não precisar falar de forma artificial. Falar \"vírgula\" e \"ponto final\" em voz alta é o que torna o ditado tradicional mais lento que digitar.",
          },
        ],
      },
      {
        titulo: "O modo raciocínio",
        duracao: "1 min",
        secoes: [
          {
            tipo: "paragrafo",
            texto:
              "Dá para ativar o raciocínio do Gemini, o que autoriza o sistema a executar tarefas mais complexas do que transcrever. O exemplo citado: selecionar documentos e pedir um resumo do conteúdo por voz.",
          },
          {
            tipo: "paragrafo",
            texto:
              "A comparação natural é com Typeless e Wispr Flow, que já ocupam esse espaço. A vantagem do Gemini é vir junto do aplicativo que muita gente já tem instalado.",
          },
        ],
      },
      {
        titulo: "A limitação, e ela é grande",
        duracao: "1 min",
        secoes: [
          {
            tipo: "alerta",
            texto:
              "Só macOS por enquanto. Não há versão para Windows nem para celular na data desta publicação — e nenhuma data anunciada. Se você está no Windows, este é um microcurso de acompanhamento, não de uso.",
          },
        ],
      },
    ],
    praQuemServe: [
      "Quem escreve muito e é mais rápido falando",
      "Usuários de Mac que já têm o aplicativo do Gemini",
      "Quem tem dificuldade ou dor ao digitar por longos períodos",
    ],
    limites: [
      "Exclusivo do macOS.",
      "Sem versão para Windows ou celular anunciada.",
      "Depende do aplicativo do Gemini instalado.",
    ],
    ficha: [
      { rotulo: "Acesso", valor: "No aplicativo do Gemini" },
      { rotulo: "Plataforma", valor: "macOS apenas" },
      { rotulo: "Ativação", valor: "Segurar a tecla função" },
      { rotulo: "Alcance", valor: "Praticamente qualquer aplicativo" },
      { rotulo: "Extra", valor: "Modo raciocínio para tarefas complexas" },
    ],
    proximosPassos: [
      { texto: "Curso: Gemini, a IA do Google", href: "/curso/gemini-ia-google" },
      {
        texto: "Para transcrever arquivo de áudio, veja o CrisperWhisper 2",
        href: "/inventando/crisperwhisper-2-transcricao-com-tempo-por-palavra",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────── 16 · Phi-Zero
  {
    slug: "phi-zero-pensar-a-fisica-antes-do-primeiro-quadro",
    titulo: "Phi-Zero: pensar a física antes do primeiro quadro",
    subtitulo:
      "Em vez de gerar o próximo quadro direto, o modelo primeiro raciocina sobre como as coisas deveriam se mover.",
    ferramenta: "Phi-Zero",
    fabricante: "Projeto acadêmico",
    categoria: "Mundos 3D",
    nivel: "Avançado",
    acesso: "Em breve",
    duracao: "5 min",
    resumo:
      "Modelo de mundo construído sobre uma 'linguagem física': raciocina o movimento antes de renderizar. Aplicações em mundos interativos, direção autônoma e treino de robôs.",
    publicadoEm: PUB,
    linkOficial: "https://phi-zero.github.io/",
    fonte: fonte("Phi Zero", 1586, 1690),
    oQueE: [
      "Phi-Zero é um modelo de mundo em vídeo construído sobre o que os autores chamam de linguagem física. A ideia é inverter a ordem de duas etapas que normalmente acontecem juntas.",
      "Em vez de gerar imediatamente os próximos quadros, o modelo primeiro raciocina sobre como tudo deveria se mover e mudar fisicamente. Só depois esse raciocínio passa pelo gerador de vídeo, que renderiza os quadros.",
    ],
    porQueImporta: [
      "A separação melhora bastante a previsão do que acontece a seguir.",
      "Em coerência física e compreensão, supera em média modelos de mundo comparáveis.",
      "Serve a três frentes distintas: mundos interativos, direção autônoma e treinamento de robôs.",
    ],
    aulas: [
      {
        titulo: "Por que separar raciocínio de renderização",
        duracao: "2 min",
        secoes: [
          {
            tipo: "paragrafo",
            texto:
              "Um gerador de vídeo comum prevê pixels a partir de pixels. Ele aprende que certas imagens costumam vir depois de outras, sem nunca representar por que — e por isso escorrega em física: objeto que atravessa parede, líquido que sobe, sombra que não acompanha.",
          },
          {
            tipo: "paragrafo",
            texto:
              "Phi-Zero insere uma etapa antes: descrever o que deveria acontecer fisicamente. A renderização passa a ser tradução de uma decisão já tomada, não adivinhação. É o mesmo princípio que faz um modelo de raciocínio acertar mais em matemática do que um que responde direto.",
          },
        ],
      },
      {
        titulo: "As três aplicações",
        duracao: "2 min",
        secoes: [
          {
            tipo: "lista",
            itens: [
              "**Mundos interativos.** Prevê como a cena deve se mover quando você aperta uma combinação de teclas.",
              "**Direção autônoma.** Gera vídeo de situações de trânsito para treinar e avaliar sistemas.",
              "**Treinamento de robôs.** Mesma lógica: gerar cenas de treino em vez de coletá-las no mundo real.",
            ],
          },
          {
            tipo: "paragrafo",
            texto:
              "As duas últimas são o negócio de verdade. Coletar dados reais de direção ou de manipulação é caro, lento e perigoso; gerar cena fisicamente coerente reduz as três coisas de uma vez.",
          },
        ],
      },
      {
        titulo: "Estado atual",
        duracao: "1 min",
        secoes: [
          {
            tipo: "alerta",
            texto:
              "O botão de código existe na página, mas diz \"em breve\". Não há nada para baixar hoje. Este microcurso serve para entender a abordagem — que é a parte transferível — e não para sair usando.",
          },
        ],
      },
    ],
    praQuemServe: [
      "Pesquisa em modelos de mundo e vídeo",
      "Quem trabalha com direção autônoma ou dados sintéticos para robótica",
      "Quem quer entender por que raciocínio antes de geração funciona",
    ],
    limites: [
      "Código anunciado, ainda não publicado.",
      "Comparações limitadas a outros modelos de mundo.",
      "Sem aplicação prática imediata para quem não é da área.",
    ],
    ficha: [
      { rotulo: "Status", valor: "Código \"em breve\"" },
      { rotulo: "Abordagem", valor: "Linguagem física antes da renderização" },
      { rotulo: "Aplicações", valor: "Mundos interativos, direção autônoma, robôs" },
      { rotulo: "Destaque", valor: "Coerência física acima da média" },
    ],
    proximosPassos: [
      {
        texto: "Compare com o Wonder, que resolve a interação por outro caminho",
        href: "/inventando/wonder-da-adobe-um-video-que-vira-cenario-navegavel",
      },
      {
        texto: "E com o Gemini Robotics 2, no lado físico de verdade",
        href: "/inventando/gemini-robotics-2-do-pe-a-ponta-dos-dedos",
      },
    ],
  },
];
