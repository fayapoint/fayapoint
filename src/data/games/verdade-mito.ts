import type { GameTerm } from "@/data/games/types";

export interface TruthCard {
  id: string;
  statement: string;
  isTrue: boolean;
  explanation: string;
  term: GameTerm;
  art?: string;
}

const terms = {
  alucinacao: { slug: "alucinacao", label: "alucinação", definition: "Quando a IA inventa uma informação plausível, mas falsa, em vez de admitir que não sabe." },
  prompt: { slug: "prompt", label: "prompt", definition: "A instrução, pergunta ou conjunto de informações que você entrega para a IA executar uma tarefa." },
  multimodal: { slug: "multimodal", label: "multimodal", definition: "Modelo que entende mais de um tipo de conteúdo, como texto, imagem, áudio ou vídeo." },
  contexto: { slug: "contexto", label: "contexto", definition: "As informações de cenário, objetivo e público que ajudam a IA a responder de forma adequada." },
  token: { slug: "token", label: "token", definition: "Pequena unidade de texto que a IA lê e gera; pode ser uma palavra, parte dela ou um sinal." },
  rag: { slug: "rag", label: "RAG", definition: "Técnica que busca informações em fontes selecionadas antes de a IA produzir a resposta." },
  agente: { slug: "agente", label: "agente de IA", definition: "Sistema que usa IA para planejar e executar várias etapas ou ferramentas em direção a um objetivo." },
  fineTuning: { slug: "fine-tuning", label: "fine-tuning", definition: "Treinamento adicional que especializa um modelo com exemplos de uma tarefa ou estilo." },
  modelo: { slug: "modelo", label: "modelo", definition: "O sistema matemático treinado com muitos exemplos para reconhecer padrões e gerar respostas." },
  privacidade: { slug: "privacidade", label: "privacidade", definition: "Cuidado com dados pessoais, sigilosos ou estratégicos enviados a uma ferramenta de IA." },
  automacao: { slug: "automacao", label: "automação", definition: "Uso de regras e ferramentas para executar tarefas repetitivas com pouca intervenção manual." },
  vies: { slug: "vies", label: "viés", definition: "Tendência sistemática que pode favorecer ou prejudicar grupos, ideias ou resultados." },
  temperatura: { slug: "temperatura", label: "temperatura", definition: "Controle que costuma alterar o grau de variedade e imprevisibilidade da resposta de um modelo." },
  janela: { slug: "janela-de-contexto", label: "janela de contexto", definition: "Quantidade de informação que o modelo consegue considerar de uma vez durante a conversa." },
  inferencia: { slug: "inferencia", label: "inferência", definition: "Momento em que um modelo já treinado recebe uma entrada e calcula uma resposta." },
} satisfies Record<string, GameTerm>;

export const TRUTH_CARDS: readonly TruthCard[] = [
  { id: "meeting-summary", statement: "Você pode gravar uma reunião e pedir para a IA transcrever e resumir.", isTrue: true, explanation: "Áudio pode virar transcrição, decisões e lista de pendências — desde que todos saibam da gravação.", term: terms.multimodal, art: "/portal/arcade/vom/meeting-summary.webp" },
  { id: "always-truth", statement: "A IA sempre diz a verdade quando responde com confiança.", isTrue: false, explanation: "Confiança no texto não é prova. Modelos podem inventar nomes, números e fontes.", term: terms.alucinacao, art: "/portal/arcade/vom/always-truth.webp" },
  { id: "must-code", statement: "Para usar IA no trabalho você precisa saber programar.", isTrue: false, explanation: "Muitas tarefas começam com uma boa conversa: objetivo, contexto, exemplos e formato de saída.", term: terms.prompt, art: "/portal/arcade/vom/must-code.webp" },
  { id: "contract-help", statement: "Uma IA pode ajudar você a entender uma cláusula difícil de contrato.", isTrue: true, explanation: "Ela pode traduzir juridiquês e sugerir perguntas, mas não substitui orientação jurídica em decisões importantes.", term: terms.contexto, art: "/portal/arcade/vom/contract-help.webp" },
  { id: "image-analysis", statement: "Algumas IAs conseguem analisar uma foto que você envia.", isTrue: true, explanation: "Modelos multimodais podem interpretar prints, plantas, objetos e documentos visuais.", term: terms.multimodal, art: "/portal/arcade/vom/image-analysis.webp" },
  { id: "real-time", statement: "Toda IA sabe automaticamente o que aconteceu no mundo hoje.", isTrue: false, explanation: "Sem busca ou fonte conectada, o modelo pode não conhecer acontecimentos recentes.", term: terms.rag, art: "/portal/arcade/vom/real-time.webp" },
  { id: "music", statement: "Já é possível criar música com arranjo e voz a partir de uma descrição.", isTrue: true, explanation: "Geradores de áudio conseguem produzir faixas completas, inclusive em português, mas direitos e autoria ainda exigem atenção.", term: terms.multimodal, art: "/portal/arcade/vom/music.webp" },
  { id: "longer-prompt", statement: "Quanto maior o prompt, melhor será a resposta.", isTrue: false, explanation: "Clareza e informação relevante valem mais do que comprimento. Um prompt longo também pode confundir.", term: terms.prompt, art: "/portal/arcade/vom/longer-prompt.webp" },
  { id: "meal-plan", statement: "A IA pode sugerir refeições usando os ingredientes que você já tem.", isTrue: true, explanation: "Informe ingredientes, restrições, número de pessoas e tempo disponível para receber algo mais útil.", term: terms.contexto, art: "/portal/arcade/vom/meal-plan.webp" },
  { id: "always-paid", statement: "Usar IA é sempre caro e exige assinatura.", isTrue: false, explanation: "Há opções gratuitas para conversar, pesquisar, transcrever e criar. O limite varia por ferramenta.", term: terms.modelo, art: "/portal/arcade/vom/always-paid.webp" },
  { id: "remember-forever", statement: "Uma IA de conversa sempre lembra tudo que você disse meses atrás.", isTrue: false, explanation: "Memória depende do produto e das configurações. A conversa também tem um limite de contexto.", term: terms.janela, art: "/portal/arcade/vom/remember-forever.webp" },
  { id: "upload-secret", statement: "É seguro enviar qualquer segredo da empresa para qualquer chatbot.", isTrue: false, explanation: "Políticas variam. Dados de clientes, senhas e estratégia exigem ferramenta aprovada e configuração de privacidade.", term: terms.privacidade, art: "/portal/arcade/vom/upload-secret.webp" },
  { id: "examples-help", statement: "Mostrar um exemplo do resultado desejado costuma melhorar a resposta.", isTrue: true, explanation: "Exemplos reduzem ambiguidade e ensinam formato, tom e nível de detalhe dentro do próprio prompt.", term: terms.contexto, art: "/portal/arcade/vom/examples-help.webp" },
  { id: "calculator", statement: "Modelos de linguagem são calculadoras perfeitas por natureza.", isTrue: false, explanation: "Eles geram padrões de texto. Para conta exata, prefira calculadora ou ferramenta de código conectada.", term: terms.agente, art: "/portal/arcade/vom/calculator.webp" },
  { id: "tokens-words", statement: "Um token corresponde sempre a uma palavra inteira.", isTrue: false, explanation: "Uma palavra pode virar vários tokens, e sinais ou pedaços de palavra também podem contar.", term: terms.token, art: "/portal/arcade/vom/tokens-words.webp" },
  { id: "rag-trains", statement: "RAG treina novamente o modelo toda vez que você adiciona um documento.", isTrue: false, explanation: "RAG normalmente busca trechos relevantes e os inclui como contexto; isso não é novo treinamento do modelo.", term: terms.rag, art: "/portal/arcade/vom/rag-trains.webp" },
  { id: "agent-actions", statement: "Um agente de IA pode usar ferramentas e executar várias etapas.", isTrue: true, explanation: "Ele pode planejar, consultar dados e chamar ações, mas precisa de limites, permissões e supervisão.", term: terms.agente, art: "/portal/arcade/vom/agent-actions.webp" },
  { id: "fine-tuning-current-news", statement: "Fine-tuning é a melhor forma de manter uma IA atualizada com notícias diárias.", isTrue: false, explanation: "Para informação que muda sempre, busca conectada ou RAG costuma ser mais apropriado.", term: terms.fineTuning, art: "/portal/arcade/vom/fine-tuning-current-news.webp" },
  { id: "bias", statement: "Uma IA pode reproduzir preconceitos presentes nos dados e nas instruções.", isTrue: true, explanation: "Modelos aprendem padrões humanos. Avaliação, diversidade de exemplos e revisão continuam necessárias.", term: terms.vies, art: "/portal/arcade/vom/bias.webp" },
  { id: "automation-judgment", statement: "Se uma tarefa foi automatizada com IA, ela nunca mais precisa de revisão.", isTrue: false, explanation: "Automação reduz trabalho repetitivo, mas exceções e decisões de alto impacto pedem supervisão.", term: terms.automacao, art: "/portal/arcade/vom/automation-judgment.webp" },
  { id: "temperature-facts", statement: "Aumentar a temperatura torna uma resposta mais verdadeira.", isTrue: false, explanation: "Temperatura maior costuma aumentar variedade, não precisão factual.", term: terms.temperatura, art: "/portal/arcade/vom/temperature-facts.webp" },
  { id: "translate", statement: "A IA pode adaptar um texto técnico para diferentes níveis de leitura.", isTrue: true, explanation: "Peça versões para iniciante, especialista ou criança e informe o que não pode ser perdido.", term: terms.prompt, art: "/portal/arcade/vom/translate.webp" },
  { id: "model-same", statement: "Todos os modelos de IA têm exatamente as mesmas capacidades.", isTrue: false, explanation: "Eles variam em qualidade, velocidade, custo, privacidade e modalidades aceitas.", term: terms.modelo, art: "/portal/arcade/vom/model-same.webp" },
  { id: "image-text", statement: "Geradores de imagem nunca erram texto dentro da cena.", isTrue: false, explanation: "Texto legível ainda é um ponto frágil. Para design profissional, aplique a tipografia depois em HTML ou editor.", term: terms.multimodal, art: "/portal/arcade/vom/image-text.webp" },
  { id: "summarize-check", statement: "Um resumo de IA pode omitir uma condição importante do documento original.", isTrue: true, explanation: "Resumo é redução. Em saúde, finanças e contratos, confira o trecho-fonte antes de decidir.", term: terms.alucinacao, art: "/portal/arcade/vom/summarize-check.webp" },
  { id: "context-window-infinite", statement: "A janela de contexto de uma IA é infinita.", isTrue: false, explanation: "Todo modelo tem um limite. Conversas e documentos extensos podem exigir divisão ou recuperação de trechos.", term: terms.janela, art: "/portal/arcade/vom/context-window-infinite.webp" },
  { id: "workflow", statement: "Uma automação pode ligar formulário, IA, planilha e e-mail.", isTrue: true, explanation: "Ferramentas de workflow conectam etapas e deixam a IA responsável apenas pela parte que exige interpretação.", term: terms.automacao, art: "/portal/arcade/vom/workflow.webp" },
  { id: "inference", statement: "Quando você envia uma pergunta e recebe uma resposta, o modelo está fazendo inferência.", isTrue: true, explanation: "O treinamento aconteceu antes; agora o modelo usa o que aprendeu para calcular uma saída.", term: terms.inferencia, art: "/portal/arcade/vom/inference.webp" },
  { id: "human-tone", statement: "Você pode pedir para a IA manter seu tom usando amostras de escrita.", isTrue: true, explanation: "Exemplos reais ajudam muito, mas revise para evitar frases genéricas ou afirmações que você não faria.", term: terms.contexto, art: "/portal/arcade/vom/human-tone.webp" },
  { id: "source-links", statement: "Uma lista de links produzida pela IA prova que todas as fontes existem.", isTrue: false, explanation: "Links também podem ser inventados ou apontar para páginas que não sustentam a afirmação. Abra e confira.", term: terms.alucinacao, art: "/portal/arcade/vom/source-links.webp" },
];
