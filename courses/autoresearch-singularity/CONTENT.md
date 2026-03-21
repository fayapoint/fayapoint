# O Conceito Autoresearch: Quando a IA Começou a Melhorar a Si Mesma

Em janeiro de 2025, Andrej Karpathy publicou um repositório chamado autoresearch no GitHub. A ideia era simples o suficiente para caber numa frase: dar a um modelo de linguagem acesso a um único arquivo de código, deixá-lo modificar esse arquivo, medir o resultado, e repetir. Se melhorou, mantém. Se piorou, descarta. Loop infinito.

O repositório treinava um pequeno modelo de linguagem (GPT) usando uma única GPU. O arquivo alvo era `train.py` — a arquitetura do modelo, o otimizador, os hiperparâmetros, tudo junto. A métrica era `val_bpb` (bits por byte na validação). Menor é melhor. O orçamento era fixo: cinco minutos de treino por experimento. A IA propunha uma mudança, rodava o treino, media o resultado, e decidia sozinha se a mudança valeu a pena.

O resultado foi surpreendente. Rodando durante a noite enquanto o pesquisador dormia, o sistema completou dezenas de experimentos autônomos. Algumas mudanças eram óbvias — ajustar learning rate, aumentar batch size. Outras eram inesperadas — mudanças arquiteturais que um pesquisador humano talvez demorasse semanas para testar. A cada doze experimentos por hora, o sistema explorava o espaço de possibilidades numa velocidade que nenhum humano consegue igualar.

## A simplicidade radical

O que tornou autoresearch revolucionário não foi a sofisticação técnica. Foi a simplicidade. O sistema inteiro cabia em poucos arquivos. Não havia framework complexo, nem orquestração distribuída, nem banco de dados de metadados. O "estado" do sistema era o próprio git: cada experimento era um commit. Se funcionou, o commit ficava. Se falhou, `git reset`. O histórico completo vivia num arquivo TSV de cinco colunas: hash do commit, métrica, memória usada, status (keep/discard/crash) e uma descrição curta.

Essa simplicidade não era acidental. Era o ponto inteiro. O princípio operacional do autoresearch dizia explicitamente: entre duas soluções com desempenho igual, a mais simples vence. Uma melhoria de 0.001 que adiciona vinte linhas de código feio provavelmente não vale. Uma melhoria de 0.001 que vem de deletar código? Definitivamente vale.

## Por que isso importa

Autoresearch não é apenas um truque de engenharia. É uma demonstração concreta de algo que filósofos e futuristas discutem há décadas: auto-aperfeiçoamento recursivo. Uma inteligência artificial que pode melhorar a si mesma, iterativamente, sem intervenção humana. Não estamos falando de AGI consciente — estamos falando de um loop de feedback onde a saída de um sistema alimenta a entrada do próximo ciclo, e a qualidade sobe.

Quando Karpathy deixou o sistema rodando durante a noite e acordou com resultados melhores do que tinha antes de dormir, ele demonstrou algo profundo: o gargalo da pesquisa em IA não precisa ser a velocidade do pesquisador humano. O gargalo pode ser o custo computacional, a qualidade da métrica, a definição do espaço de busca — mas não precisa ser a velocidade com que um ser humano pensa, analisa e decide.

Esse curso existe porque o padrão autoresearch é generalizável. Não se aplica apenas a treinar modelos de linguagem. Aplica-se a melhorar textos, código, prompts, agentes, conteúdo, e-mails, campanhas de marketing — qualquer domínio onde você consiga definir uma métrica de qualidade e propor variações.

---

**O que levar deste capítulo:**

- Autoresearch é um loop autônomo onde IA propõe mudanças, mede resultados e decide sozinha o que manter
- O repositório original de Karpathy usava git como sistema de estado: commit se melhorou, reset se piorou
- A simplicidade radical do sistema é intencional — complexidade é custo, não virtude
- O padrão é generalizável para qualquer domínio onde exista uma métrica mensurável de qualidade

# O Loop Básico: Gerar, Avaliar, Mutar, Repetir

Quatro verbos definem o autoresearch. Gerar: produzir um output. Avaliar: medir a qualidade desse output. Mutar: propor uma variação nos parâmetros que geraram o output. Repetir: voltar ao início com os novos parâmetros. Se a avaliação melhorou, os parâmetros mutados se tornam o novo ponto de partida. Se piorou, volta-se ao estado anterior. É tudo que existe. O resto é implementação.

## Anatomia de uma iteração

Uma iteração completa do loop autoresearch tem cinco fases concretas:

**Fase 1 — Estado atual.** O sistema lê o conjunto atual de parâmetros. No autoresearch original, isso era o conteúdo do arquivo `train.py`. Numa generalização para conteúdo, pode ser um conjunto de instruções de geração: tom de voz, estrutura do texto, exemplos de referência, restrições de formato.

**Fase 2 — Geração.** Com os parâmetros atuais, o sistema produz um output. No caso original, era treinar um modelo de linguagem e medir a loss na validação. Numa versão para conteúdo, seria gerar um artigo, um capítulo, um e-mail. O importante é que a geração é determinística o suficiente para ser comparável — mesma entrada, mesmo contexto, variação apenas nos parâmetros.

**Fase 3 — Avaliação.** O output é medido contra uma métrica definida previamente. No caso original, a métrica era `val_bpb`. Para conteúdo, pode ser um score de 0 a 10 dado por um LLM avaliador usando uma rubric detalhada. Para código, pode ser a taxa de testes passando. Para marketing, pode ser uma previsão de CTR. A avaliação precisa ser automatizada e consistente.

**Fase 4 — Decisão.** O sistema compara o score atual com o melhor score até agora. Se melhorou: mantém os novos parâmetros (keep). Se piorou ou empatou: descarta e volta ao estado anterior (discard). Se crashou: registra o crash e volta ao estado anterior. Não existe meio-termo — é binário.

**Fase 5 — Mutação.** Independente do resultado, o sistema propõe a próxima mutação. Se manteve, muta a partir do novo melhor estado. Se descartou, muta a partir do estado anterior, tentando uma direção diferente. A mutação é onde a criatividade do sistema aparece: trocar uma técnica por outra, ajustar um parâmetro, reorganizar uma estrutura.

## O poder do loop

O que torna esse loop poderoso não é nenhuma fase individual. É a composição temporal. Uma única iteração pode parecer insignificante — uma melhoria de 0.3 pontos num score de 10. Mas cem iterações acumuladas podem transformar um texto genérico num texto excepcional, um código funcional num código elegante, um prompt básico num prompt otimizado.

Dados reais de um sistema autoresearch para escrita criativa mostram exatamente isso. O score inicial (baseline) era 6.78 numa escala de 10. Após 17 iterações com Keep, o score subiu para 8.02. A maioria das iterações intermediárias foi descartada — foram explorações que não funcionaram. Mas as que funcionaram se acumularam, e cada uma elevou o patamar um pouco mais.

## O papel do histórico

O arquivo `results.tsv` não é apenas um log — é memória institucional. Cada linha registra o que foi tentado, o que funcionou e o que falhou. Quando o sistema de mutação precisa propor a próxima mudança, ele pode consultar esse histórico para evitar repetir experimentos que já falharam e para identificar direções promissoras.

Na implementação original, o TSV tinha cinco colunas: commit, métrica, memória, status e descrição. Simples, legível por humanos, sem banco de dados. Em generalizações para conteúdo, o TSV pode ser expandido para incluir o modelo usado, os parâmetros específicos que mudaram, e um breakdown do score por dimensão. Mas o princípio permanece: cada experimento é uma linha, e a história completa é um arquivo texto.

## Stop conditions

Todo loop infinito precisa de condições de parada. No autoresearch, existem três:

Primeira: interrupção manual. O operador humano cria um arquivo `loop_stop.flag` e o loop para graciosamente no final da iteração atual. Segundo: limite de iterações. Você pode configurar `--max-exp 50` para rodar exatamente cinquenta experimentos. Terceiro: convergência. Se as últimas N iterações foram todas "discard", o sistema pode concluir que atingiu um ponto de saturação e parar.

A terceira condição é a mais interessante porque levanta uma questão fundamental: quando "bom o suficiente" é realmente bom o suficiente? Voltaremos a isso quando discutirmos limites e riscos.

---

**O que levar deste capítulo:**

- O loop autoresearch tem cinco fases: estado atual, geração, avaliação, decisão binária (keep/discard), mutação
- O poder está na composição temporal — dezenas de pequenas melhorias acumuladas superam uma grande tentativa
- O histórico (results.tsv) funciona como memória institucional que guia futuras mutações
- Condições de parada incluem interrupção manual, limite de iterações e detecção de convergência

# Por Que Funciona: A Matemática Por Trás do Loop

Um alpinista vendado, num terreno montanhoso, com uma única regra: dê um passo, meça se está mais alto que antes, se sim continue nessa direção, se não volte e tente outra. Com tempo suficiente, ele encontra o topo de alguma montanha. Talvez não a mais alta do terreno inteiro — mas certamente mais alto do que onde começou. Essa é a essência do hill climbing estocástico, e é exatamente o que o autoresearch faz.

## Hill climbing com mutações

O autoresearch é, matematicamente, uma forma de busca local estocástica. O "terreno" é o espaço de todos os possíveis conjuntos de parâmetros. A "altitude" é a métrica de qualidade (invertida no caso de val_bpb, onde menor é melhor). Cada mutação é um "passo" numa direção aleatória nesse espaço. A decisão keep/discard é o mecanismo de seleção: só aceitamos passos que sobem.

A diferença entre o autoresearch e um hill climbing clássico é quem propõe os passos. No hill climbing tradicional, as mutações são perturbações numéricas pequenas — somar 0.01 ao learning rate, subtrair 0.001 do dropout. No autoresearch, quem propõe as mutações é um LLM. Isso significa que os passos não são perturbações cegas — são mudanças semânticas informadas. O LLM pode propor "trocar a ativação de ReLU para SiLU porque papers recentes mostram ganho em modelos pequenos." Isso é um salto informado, não um passo cego.

## Exploração vs. explotação

Todo algoritmo de busca enfrenta o dilema exploração versus explotação. Explorar significa tentar coisas radicalmente novas — mudar a arquitetura inteira, reescrever o texto do zero com um tom diferente. Explotar significa refinar o que já funciona — ajustar um hiperparâmetro em 5%, polir um parágrafo específico.

No autoresearch, esse equilíbrio é controlado pela temperatura da mutação. Mutações de alta temperatura são mais radicais: "mude o estilo narrativo inteiro de primeira pessoa para terceira pessoa." Mutações de baixa temperatura são incrementais: "adicione mais detalhes sensoriais no segundo parágrafo." O operador pode ajustar esse dial, ou deixar o próprio sistema adaptar a temperatura com base no histórico — se muitas iterações recentes falharam, talvez seja hora de tentar algo mais radical.

## Busca em espaços de alta dimensão

O espaço de parâmetros de um texto não é um terreno bidimensional. É um espaço de altíssima dimensão. Tom de voz, estrutura, vocabulário, ritmo, profundidade técnica, exemplos usados, ordem dos argumentos, presença de metáforas, tamanho dos parágrafos — cada um desses é uma "dimensão." O espaço total de combinações é exponencialmente grande.

Busca exaustiva é impossível. Mesmo busca aleatória pura é ineficiente. O que torna o autoresearch viável é que as mutações são propostas por um agente inteligente (o LLM) que entende a estrutura do espaço. O LLM não testa combinações aleatórias — ele propõe mudanças que fazem sentido dado o contexto. É como ter um guia experiente no terreno montanhoso, ao invés de um alpinista vendado.

## Convergência e ótimos locais

O problema clássico do hill climbing é ficar preso em ótimos locais — topos de montanhas pequenas enquanto montanhas maiores existem por perto. O autoresearch mitiga isso de três formas.

Primeira: as mutações propostas por LLM podem ser grandes o suficiente para escapar de ótimos locais. Um salto semântico como "reescreva usando a perspectiva de um narrador onisciente" pode mover o estado para uma região completamente diferente do espaço.

Segunda: a diversidade de mutações possíveis é enorme. Ao contrário de otimizadores numéricos que só podem ajustar valores contínuos, o LLM pode propor mudanças estruturais, estilísticas, conceituais — dimensões que um otimizador tradicional nem consegue acessar.

Terceira: o histórico acumulado no TSV permite ao sistema aprender com tentativas anteriores. Se "aumentar a profundidade técnica" falhou nas últimas três vezes, o sistema pode inferir que precisa explorar outra dimensão.

## A analogia com evolução

Autoresearch compartilha DNA conceitual com algoritmos evolutivos. A geração é a reprodução. A avaliação é a seleção natural. A mutação é a mutação genética. O loop é a passagem de gerações. A diferença crucial é que a mutação no autoresearch é dirigida, não aleatória. É como se a evolução biológica tivesse um mecanismo de mutação que "entende" o que o organismo precisa para sobreviver melhor, ao invés de mutar genes aleatoriamente.

Essa analogia não é perfeita — a evolução biológica opera sobre populações inteiras em paralelo, enquanto o autoresearch básico opera sobre um único candidato por vez. Mas a intuição central se mantém: variação + seleção + tempo = melhoria inevitável.

---

**O que levar deste capítulo:**

- Autoresearch é matematicamente uma forma de hill climbing estocástico com mutações semânticas propostas por LLM
- O equilíbrio entre exploração (mudanças radicais) e explotação (refinamento) é controlado pela temperatura da mutação
- Mutações dirigidas por LLM são mais eficientes que perturbações cegas porque entendem a estrutura do espaço
- O risco de ótimos locais é mitigado pela diversidade semântica das mutações e pelo histórico acumulado

# O Papel do Juiz: Quando um LLM Avalia Outro

Existe um paradoxo aparente no coração do autoresearch: se a IA não é boa o suficiente para produzir o output perfeito diretamente, como pode ser boa o suficiente para julgar se um output é bom? A resposta está na assimetria fundamental entre geração e avaliação. Reconhecer um bom restaurante é mais fácil do que cozinhar um prato excelente. Identificar um código limpo é mais fácil do que escrever código limpo do zero. Julgar qualidade é cognitivamente mais simples do que produzir qualidade.

## LLM-as-Judge

O paradigma LLM-as-Judge se consolidou como prática padrão na indústria entre 2024 e 2026. A ideia é usar um modelo de linguagem como avaliador automatizado de outputs de outros modelos (ou do mesmo modelo). Em vez de contratar avaliadores humanos — caro, lento, inconsistente — você define uma rubric e pede ao LLM que avalie segundo essa rubric.

A rubric é o documento mais importante do sistema autoresearch. Ela define exatamente o que "bom" significa. Sem uma rubric explícita, o LLM avaliador vai usar seus próprios critérios implícitos — que podem não alinhar com o que você quer. Com uma rubric, você controla exatamente quais dimensões são avaliadas e quanto cada uma pesa.

## Anatomia de uma rubric

Uma rubric eficaz para autoresearch tem quatro componentes:

**Dimensões.** São os eixos independentes de avaliação. Para um texto, podem ser: clareza, profundidade técnica, engajamento, originalidade, precisão factual. Para código: correção, legibilidade, performance, cobertura de testes, manutenibilidade. Para um prompt: especificidade, completude, ausência de ambiguidade, alinhamento com o objetivo.

**Escalas.** Cada dimensão é avaliada numa escala numérica. A escala de 1 a 10 é a mais comum. Escalas menores (1-5) perdem resolução. Escalas maiores (1-100) adicionam ruído sem ganho real de informação. A escala de 1-10 com descrições ancoradas para cada nível é o ponto ideal.

**Âncoras.** Para cada nível da escala, uma descrição concreta do que aquele nível significa. "7 em clareza" não significa nada isoladamente. "7 em clareza: o texto é facilmente compreensível na primeira leitura, com raras ambiguidades, mas poderia se beneficiar de exemplos adicionais em pontos técnicos" — isso significa algo.

**Pesos.** Nem todas as dimensões importam igualmente. Para um e-mail de vendas, engajamento pode ter peso 3x maior que profundidade técnica. Para documentação de API, precisão tem peso 5x maior que originalidade. Os pesos devem refletir o objetivo real do output.

## O sistema de cinco personas

Uma abordagem que se mostrou eficaz em implementações reais de autoresearch é o sistema de múltiplas personas avaliadoras. Em vez de um único prompt de avaliação, o sistema usa cinco personas diferentes, cada uma avaliando de uma perspectiva diferente.

Para escrita criativa, por exemplo: o Editor (foco em estrutura e ritmo), o Leitor Crítico (foco em engajamento e originalidade), o Revisor Técnico (foco em precisão e consistência), o Estilista (foco em voz e tom), e o Leitor Comum (foco em compreensibilidade e prazer de leitura). O score final é a média ponderada das cinco avaliações.

Essa abordagem reduz o viés de um único avaliador e captura dimensões de qualidade que um avaliador único poderia negligenciar. Na prática, ela produz scores mais estáveis e menos suscetíveis a flutuações aleatórias entre chamadas.

## Calibração e consistência

Um problema real com LLM-as-Judge é a inconsistência entre chamadas. O mesmo texto pode receber 7.5 numa avaliação e 8.2 na próxima, com o mesmo prompt e o mesmo modelo. Essa variância é ruído que pode fazer o loop autoresearch manter mudanças ruins ou descartar mudanças boas.

Três técnicas mitigam esse problema. Primeira: temperatura baixa no avaliador (0.1 a 0.3). Isso reduz a variabilidade das respostas sem eliminar a capacidade de raciocínio nuançado. Segunda: avaliação múltipla. Avaliar o mesmo output três vezes e usar a mediana elimina outliers. Terceira: comparação relativa ao invés de absoluta. Em vez de perguntar "qual é a nota deste texto?", perguntar "este texto é melhor que o anterior?" pode ser mais consistente, embora perca a informação de magnitude.

## Separação entre gerador e avaliador

Uma decisão arquitetural importante é se o gerador e o avaliador devem ser o mesmo modelo ou modelos diferentes. Usar o mesmo modelo é mais barato e simples, mas cria um risco: o modelo pode desenvolver preferência por seus próprios padrões de escrita, criando um viés circular. Usar modelos diferentes é mais caro, mas reduz esse viés.

Na prática, a melhor abordagem depende do orçamento e do domínio. Para iteração rápida com custo baixo, o mesmo modelo com prompts diferentes funciona bem. Para produção de alta qualidade onde o viés é uma preocupação real, modelos diferentes são preferíveis. Uma heurística útil: se o score converge rapidamente para um valor alto mas o output parece medíocre para humanos, o avaliador provavelmente está enviesado e precisa ser trocado.

---

**O que levar deste capítulo:**

- Julgar qualidade é cognitivamente mais simples do que produzir qualidade — por isso LLM-as-Judge funciona
- A rubric (dimensões + escalas + âncoras + pesos) é o documento mais importante do sistema autoresearch
- Múltiplas personas avaliadoras reduzem viés e capturam dimensões que um avaliador único negligenciaria
- Temperatura baixa no avaliador e avaliações múltiplas mitigam a inconsistência entre chamadas

# Mutação Inteligente: A Arte de Propor Mudanças

A mutação é onde o autoresearch se separa de algoritmos de otimização genéricos. Em gradient descent, a direção da mudança é determinada pelo gradiente — uma fórmula matemática. Em algoritmos evolutivos clássicos, a mutação é aleatória — trocar um bit, perturbar um número. No autoresearch, a mutação é proposta por um LLM que entende o contexto semântico do que está sendo otimizado. Isso muda tudo.

## O espaço de mutação

Para entender o que pode ser mutado, considere um sistema autoresearch para geração de conteúdo. Os parâmetros de geração incluem:

**Parâmetros do modelo.** Temperatura (criatividade vs. previsibilidade), max_tokens (comprimento), top_p (diversidade do vocabulário), frequency_penalty (repetição). Esses são os dials mais básicos.

**Parâmetros do prompt.** Tom de voz ("formal e técnico" vs. "conversacional e acessível"), perspectiva (primeira pessoa, terceira pessoa, impessoal), nível de detalhe ("overview de alto nível" vs. "explicação passo a passo"), público-alvo ("iniciante" vs. "especialista"), exemplos de referência, restrições de formato.

**Parâmetros estruturais.** Número de seções, ordem dos argumentos, presença ou ausência de exemplos, inclusão de analogias, uso de listas vs. prosa contínua, tamanho dos parágrafos, proporção entre teoria e prática.

**Parâmetros de contexto.** Informações de background fornecidas ao gerador, referências externas, dados específicos do domínio, histórico de outputs anteriores.

Cada um desses parâmetros é uma dimensão do espaço de busca. Uma mutação pode tocar uma única dimensão ("aumente a temperatura de 0.7 para 0.9") ou múltiplas dimensões simultaneamente ("mude para tom conversacional, adicione exemplos práticos, e reduza a profundidade técnica").

## Estratégias de mutação

Existem três estratégias principais para propor mutações:

**Mutação paramétrica.** A mais simples. Pega um parâmetro específico e ajusta seu valor. "Temperatura: 0.7 → 0.85." "Max tokens: 3000 → 4000." "Tom: formal → semiformal." É segura, previsível, e eficaz para refinamento fino. Mas raramente produz saltos qualitativos grandes.

**Mutação estrutural.** Reorganiza a forma do output sem necessariamente mudar o conteúdo. "Inverta a ordem: comece pelo exemplo prático e depois explique a teoria." "Divida o capítulo longo em três capítulos curtos." "Substitua a lista de bullet points por um fluxograma narrativo." Mutações estruturais podem desbloquear melhorias que mutações paramétricas nunca alcançariam.

**Mutação conceitual.** A mais radical. Muda a abordagem fundamental. "Em vez de explicar o conceito abstratamente, conte a história de como ele foi descoberto." "Substitua o jargão técnico por uma analogia do cotidiano." "Reescreva assumindo que o leitor já tentou e falhou — endereçe as dificuldades comuns primeiro." Mutações conceituais são as mais arriscadas, mas também as que produzem os maiores saltos de qualidade.

## Mutação informada pelo histórico

O sistema de mutação mais eficaz não propõe mudanças no vácuo. Ele consulta o histórico de experimentos anteriores para informar a próxima tentativa.

O prompt de mutação pode incluir: os últimos N experimentos com seus scores e descrições, as dimensões onde o score atual é mais fraco (baseado no breakdown do avaliador), mudanças que já foram tentadas e falharam (para evitar repetição), e uma instrução explícita sobre o tipo de mutação desejada (paramétrica, estrutural ou conceitual).

Um exemplo concreto de prompt de mutação: "O score atual é 7.8/10. O breakdown mostra que 'engajamento' está em 6.5 enquanto 'profundidade' está em 8.9. As últimas três tentativas de melhorar engajamento via humor falharam. Proponha uma mutação diferente focada em engajamento que NÃO use humor."

## JSON como linguagem de mutação

Na implementação prática, mutações são tipicamente representadas como objetos JSON. O LLM de mutação recebe o estado atual (também em JSON) e retorna um JSON com as mudanças propostas. Isso torna as mutações parseáveis, loggáveis e reproduzíveis.

Um exemplo de output de mutação:

```json
{
  "mutation_type": "structural",
  "changes": {
    "opening_style": "start_with_story",
    "paragraph_length": "shorter",
    "examples_per_section": 2
  },
  "reasoning": "O score de engajamento está baixo. Começar com uma história concreta prende atenção melhor que uma definição abstrata."
}
```

O campo "reasoning" é opcional mas valioso — ele permite que o sistema (e o operador humano) entenda por que aquela mutação foi proposta, facilitando debug e análise posterior.

## A temperatura da mutação

Assim como LLMs têm um parâmetro de temperatura que controla a aleatoriedade da geração, o sistema de mutação tem sua própria "temperatura" conceitual. Temperatura baixa produz mutações conservadoras: ajustes finos em parâmetros que já estão bons. Temperatura alta produz mutações agressivas: mudanças radicais na abordagem.

Uma heurística prática: comece com temperatura alta (mais exploração), e reduza conforme o score se aproxima de um patamar satisfatório (mais refinamento). Se o score estagnar por muitas iterações, aumente a temperatura temporariamente para escapar de ótimos locais.

---

**O que levar deste capítulo:**

- Mutações no autoresearch são semânticas e informadas, não perturbações numéricas cegas
- Três tipos de mutação: paramétrica (ajustar valores), estrutural (reorganizar forma) e conceitual (mudar abordagem)
- O histórico de experimentos anteriores deve informar cada nova mutação para evitar repetição e guiar a busca
- A "temperatura da mutação" controla o equilíbrio entre refinamento conservador e exploração radical

# Implementação Prática em Python: Construindo do Zero

Chega de teoria. Vamos construir um sistema autoresearch funcional em Python, usando a API do Claude como modelo gerador e avaliador. O objetivo é criar algo que rode no seu computador, faça iterações autônomas, e produza resultados mensuráveis. O código que segue é uma versão simplificada mas completamente funcional — pronta para adaptar ao seu domínio.

## A estrutura do projeto

O sistema precisa de quatro componentes:

```
autoresearch/
├── loop.py          # O loop principal
├── config.json      # Parâmetros de geração e avaliação
├── results.tsv      # Histórico de experimentos
├── best_output.md   # Melhor output encontrado até agora
└── rubric.md        # Rubric de avaliação
```

O `loop.py` é o orquestrador. Ele lê a config, chama o gerador, chama o avaliador, decide keep/discard, atualiza a config com a mutação, e repete. O `config.json` contém todos os parâmetros de geração. O `results.tsv` é o log de experimentos. O `best_output.md` salva o melhor resultado encontrado. O `rubric.md` define os critérios de avaliação.

## O config.json

O arquivo de configuração começa com valores padrão sensatos:

```json
{
  "model": "claude-sonnet-4-20250514",
  "generation": {
    "temperature": 0.7,
    "max_tokens": 4000,
    "tone": "conversational",
    "depth": "intermediate",
    "examples": true,
    "structure": "intro_theory_practice_conclusion"
  },
  "evaluation": {
    "model": "claude-sonnet-4-20250514",
    "temperature": 0.2,
    "max_tokens": 2000
  },
  "mutation": {
    "model": "claude-sonnet-4-20250514",
    "temperature": 0.8,
    "max_tokens": 1500
  },
  "topic": "Como funciona o garbage collection em Python"
}
```

Repare que o sistema usa três chamadas de modelo por iteração: uma para gerar, uma para avaliar, uma para mutar. Em produção, você pode usar modelos diferentes para cada função — um modelo mais barato para mutação, um mais caro para avaliação, por exemplo.

## O loop principal

A lógica central do `loop.py` segue exatamente o padrão descrito nos capítulos anteriores:

```python
import json
import csv
import anthropic
from pathlib import Path
from datetime import datetime

client = anthropic.Anthropic()
CONFIG = Path("config.json")
RESULTS = Path("results.tsv")
BEST = Path("best_output.md")
RUBRIC = Path("rubric.md").read_text()

def load_config():
    return json.loads(CONFIG.read_text())

def save_config(cfg):
    CONFIG.write_text(json.dumps(cfg, indent=2))

def generate(cfg):
    """Gera output usando os parâmetros atuais."""
    response = client.messages.create(
        model=cfg["model"],
        max_tokens=cfg["generation"]["max_tokens"],
        temperature=cfg["generation"]["temperature"],
        messages=[{
            "role": "user",
            "content": build_generation_prompt(cfg)
        }]
    )
    return response.content[0].text

def evaluate(text, cfg):
    """Avalia o output usando a rubric."""
    response = client.messages.create(
        model=cfg["evaluation"]["model"],
        max_tokens=cfg["evaluation"]["max_tokens"],
        temperature=cfg["evaluation"]["temperature"],
        messages=[{
            "role": "user",
            "content": f"Avalie este texto usando a rubric:\n\n"
                       f"RUBRIC:\n{RUBRIC}\n\n"
                       f"TEXTO:\n{text}\n\n"
                       f"Responda em JSON: score (0-10), "
                       f"breakdown (dict de dimensao:score), "
                       f"reasoning (string curta)."
        }]
    )
    return json.loads(extract_json(response.content[0].text))

def mutate(cfg, history):
    """Propõe mutação nos parâmetros de geração."""
    response = client.messages.create(
        model=cfg["mutation"]["model"],
        max_tokens=cfg["mutation"]["max_tokens"],
        temperature=cfg["mutation"]["temperature"],
        messages=[{
            "role": "user",
            "content": build_mutation_prompt(cfg, history)
        }]
    )
    changes = json.loads(extract_json(response.content[0].text))
    for key, value in changes.get("generation", {}).items():
        cfg["generation"][key] = value
    return cfg
```

## O loop propriamente dito

```python
def run_loop(max_experiments=50):
    cfg = load_config()
    best_score = 0.0
    history = []

    for exp_num in range(1, max_experiments + 1):
        print(f"\n--- Experimento {exp_num} ---")

        # Gerar
        output = generate(cfg)

        # Avaliar
        result = evaluate(output, cfg)
        score = result["score"]

        # Decidir
        if score > best_score:
            status = "keep"
            best_score = score
            BEST.write_text(output)
            save_config(cfg)
            print(f"KEEP: {score:.2f} (novo melhor)")
        else:
            status = "discard"
            cfg = load_config()  # volta ao estado anterior
            print(f"DISCARD: {score:.2f} (melhor: {best_score:.2f})")

        # Registrar
        history.append({
            "exp": exp_num, "score": score,
            "status": status, "breakdown": result["breakdown"]
        })
        log_result(exp_num, score, status, result)

        # Mutar para próxima iteração
        cfg = mutate(cfg, history[-10:])

        # Verificar stop flag
        if Path("stop.flag").exists():
            print("Stop flag detectado. Encerrando.")
            break

    print(f"\nMelhor score final: {best_score:.2f}")
```

## A função de prompt de geração

O prompt de geração traduz os parâmetros do config em instruções naturais:

```python
def build_generation_prompt(cfg):
    gen = cfg["generation"]
    return f"""Escreva um texto sobre: {cfg['topic']}

Parâmetros:
- Tom: {gen['tone']}
- Profundidade: {gen['depth']}
- Incluir exemplos: {gen['examples']}
- Estrutura: {gen['structure']}

Escreva o texto completo, sem metacomentários."""
```

## Custos e otimização

Uma preocupação prática: cada iteração faz três chamadas de API. Com Claude Sonnet a preços de março de 2026, cada iteração custa aproximadamente US$0.02 a US$0.08 dependendo do tamanho dos tokens. Cinquenta iterações custam entre US$1 e US$4. Cem iterações, entre US$2 e US$8. É barato o suficiente para experimentar livremente.

Para reduzir custos ainda mais, você pode usar modelos locais via LM Studio ou Ollama para mutação (que não precisa de alta qualidade), e reservar modelos cloud apenas para geração e avaliação. A implementação de referência do story_autoresearch usa exatamente essa abordagem: Qwen 9B local para geração e avaliação, com fallback para modelos cloud quando necessário.

---

**O que levar deste capítulo:**

- O sistema completo tem quatro arquivos: loop principal, config JSON, results TSV e rubric
- Cada iteração faz três chamadas de LLM: gerar, avaliar, mutar — totalizando ~US$0.02-0.08 por iteração
- O config.json é o "DNA" do sistema — mutações alteram valores nesse arquivo, que persistem quando mantidos
- Modelos locais podem substituir modelos cloud para mutação e reduzir custos significativamente

# Autoresearch para Conteúdo: Texto que se Aperfeiçoa Sozinho

Um escritor humano revisa seu próprio texto cinco, talvez dez vezes antes de considerar pronto. Cada revisão captura erros diferentes — na primeira, problemas estruturais; na terceira, redundâncias; na quinta, nuances de ritmo. O processo é eficaz, mas lento. Uma hora por revisão, cinco horas no total, para um único capítulo. Autoresearch faz o mesmo processo em minutos, e pode fazer cento e quarenta revisões ao invés de cinco.

## O caso TCH: 140 iterações reais

O caso mais documentado de autoresearch aplicado a conteúdo é o projeto TCH (They Can Hear), uma série de ficção que usou o pattern autoresearch para melhorar iterativamente a qualidade da escrita. Os números são concretos:

Score baseline (iteração 0): 6.78/10. Score após experimento 17 com status keep: 8.02/10. Total de experimentos: mais de 140. Taxa de keep: aproximadamente 12% — ou seja, 88% dos experimentos foram descartados. O sistema usou Qwen 9B rodando localmente via LM Studio, com avaliação por cinco dimensões: voz narrativa, autenticidade, concisão visual, ritmo e coerência interna.

Os dados do `results.tsv` revelam padrões interessantes. Os primeiros keeps foram grandes saltos — de 6.78 para 7.87 no segundo experimento (keep), um ganho de mais de um ponto inteiro ao adicionar detalhes acústicos específicos de um prédio dos anos 1970. Os keeps subsequentes foram incrementais — ganhos de 0.1, 0.2 pontos. E muitos experimentos falharam catastroficamente: scores de 1.15, 0.70, até 0.0 (crashes onde o modelo entrou em loop infinito de "thinking" e não produziu output útil).

## Rubric para conteúdo textual

Uma rubric eficaz para texto precisa capturar tanto dimensões objetivas quanto subjetivas:

**Clareza (peso 2).** O texto é compreensível na primeira leitura? Jargão é explicado? Pronomes têm antecedentes claros? Transições entre parágrafos são suaves?

**Profundidade (peso 2).** O texto vai além do superficial? Apresenta nuances, exceções, contexto? Mostra que o autor entende o assunto em profundidade?

**Engajamento (peso 3).** O leitor quer continuar lendo? Existe tensão, curiosidade, momentum? O texto respeita o tempo do leitor?

**Precisão (peso 2).** As informações são corretas? Números são verificáveis? Não há afirmações exageradas ou enganosas?

**Originalidade (peso 1).** O texto traz uma perspectiva nova? Evita clichês e fórmulas gastas? Surpreende o leitor em algum momento?

Os pesos são opinativos e devem ser ajustados ao objetivo. Para um blog post de marketing, engajamento pode ter peso 5 e profundidade peso 1. Para documentação técnica, precisão tem peso 5 e originalidade peso 0.

## Aplicações práticas

**Artigos de blog.** Gere um artigo com parâmetros padrão. Avalie. Mute os parâmetros (tom mais conversacional? exemplos mais específicos? analogia diferente?). Gere de novo. Avalie. Repita vinte vezes. Publique a melhor versão. Custo total: menos de R$5 em API.

**E-mails de vendas.** A métrica pode ser uma avaliação de "probabilidade de clique" por LLM. Mute o subject line, o primeiro parágrafo, o CTA, o nível de urgência. Cada iteração testa uma variação. Após trinta iterações, o e-mail é significativamente melhor que o original.

**Capítulos de livro.** Este curso inteiro poderia (e foi parcialmente) otimizado via autoresearch. Gere um capítulo, avalie com rubric de cinco dimensões, mute os parâmetros de geração, gere de novo. O resultado após dez iterações é consistentemente melhor que a primeira geração.

**Copy para landing pages.** A métrica é uma avaliação de clareza de proposta de valor + urgência + redução de objeções. Mute a headline, os bullet points, o proof section, o CTA. Cada iteração é rápida porque copy é curta — o custo por iteração é centavos.

## O efeito composto

O aspecto mais contraintuitivo do autoresearch para conteúdo é que as melhorias não parecem impressionantes individualmente. De 7.2 para 7.4 não parece muito. De 7.4 para 7.5, menos ainda. Mas quando você compara o output da iteração 1 com o output da iteração 30, a diferença é visível e substancial. É o efeito composto da melhoria incremental — cada pequeno ajuste se acumula sobre os anteriores.

O perigo é parar cedo demais. As primeiras cinco iterações tipicamente capturam os ganhos mais óbvios. As iterações 6 a 20 capturam refinamentos mais sutis que fazem a diferença entre "bom" e "excelente." E as iterações 20+ são onde o sistema explora variações mais radicais que ocasionalmente produzem breakthroughs inesperados.

---

**O que levar deste capítulo:**

- Dados reais mostram que autoresearch melhora scores de escrita de 6.78 para 8.02 em ~17 iterações com keep (de 140+ testadas)
- A taxa de keep é baixa (~12%) — a maioria dos experimentos é descartada, mas os que funcionam se acumulam
- Rubrics com dimensões ponderadas (clareza, profundidade, engajamento, precisão, originalidade) guiam a melhoria
- O efeito composto de muitas pequenas melhorias produz resultados significativamente superiores ao output inicial

# Autoresearch para Código: Qualidade que Evolui

Código tem uma vantagem sobre texto para autoresearch: métricas objetivas. Um texto pode ser subjetivamente "melhor" ou "pior" — mas código ou funciona ou não funciona. Testes passam ou falham. Performance é mensurável em milissegundos. Cobertura de testes é um número entre 0 e 100%. Essa objetividade torna o autoresearch para código particularmente poderoso.

## O autoresearch original é sobre código

Vale relembrar que o repositório autoresearch de Karpathy era, fundamentalmente, um sistema de melhoria automática de código. O arquivo `train.py` era código Python. As mutações eram mudanças no código. A métrica (val_bpb) era medida executando o código. O loop inteiro era: modificar código → executar → medir → decidir.

A diferença para o autoresearch de conteúdo é que a avaliação não precisa de LLM-as-Judge. A avaliação é a execução do código em si. O compilador, o runtime, os testes unitários — esses são os juízes objetivos. Isso elimina toda a incerteza do julgamento subjetivo.

## Métricas para código

**Correção.** Os testes passam? Se o projeto tem um test suite, a primeira métrica é binária: 100% dos testes passam ou não. Se não passam, a mutação é automaticamente descartada (a menos que o objetivo seja consertar testes quebrados).

**Performance.** Tempo de execução de benchmarks. Consumo de memória. Throughput. Latência. Essas métricas são números concretos que podem ser comparados diretamente entre iterações. Uma mutação que reduz a latência em 5% sem quebrar testes é um keep claro.

**Complexidade.** Métricas como complexidade ciclomática, número de linhas, profundidade de nesting. Conforme o princípio de simplicidade do autoresearch: se duas versões têm performance igual, a mais simples vence.

**Cobertura.** Percentual de código coberto por testes. Uma mutação que adiciona testes e aumenta a cobertura de 72% para 85% pode ser valiosa mesmo sem melhorar performance.

**Qualidade de leitura.** Aqui o LLM-as-Judge entra como métrica complementar. O código é legível? Os nomes de variáveis são descritivos? Os comentários são úteis? Essa dimensão é subjetiva, mas importa para manutenibilidade.

## O loop autoresearch para código

```python
def evaluate_code(code_path, test_command):
    """Avalia código executando testes e medindo performance."""
    # Fase 1: Testes passam?
    result = subprocess.run(
        test_command, shell=True,
        capture_output=True, timeout=120
    )
    if result.returncode != 0:
        return {"score": 0, "status": "crash",
                "error": result.stderr.decode()}

    # Fase 2: Performance benchmark
    bench = subprocess.run(
        "python benchmark.py", shell=True,
        capture_output=True, timeout=300
    )
    metrics = json.loads(bench.stdout.decode())

    # Fase 3: Score composto
    score = (
        metrics["speed_score"] * 0.4 +
        metrics["memory_score"] * 0.2 +
        metrics["coverage"] * 0.2 +
        metrics["readability_score"] * 0.2
    )
    return {"score": score, "metrics": metrics}
```

A mutação para código é diferente da mutação para texto. O LLM recebe o código atual, o resultado da avaliação (incluindo quais testes falharam, onde estão os gargalos de performance, qual a cobertura), e propõe uma mudança concreta: refatorar uma função, trocar um algoritmo, adicionar cache, simplificar uma estrutura condicional.

## Segurança e sandboxing

Executar código gerado por IA automaticamente é inerentemente arriscado. O loop autoresearch para código precisa de sandboxing. Na implementação original, o sandboxing era simples: o código só podia modificar um arquivo (`train.py`) e só podia rodar em um ambiente controlado (uma GPU dedicada). Se algo desse errado, `git reset` restaurava o estado anterior.

Para sistemas mais complexos, containers Docker oferecem isolamento robusto. Cada iteração roda dentro de um container descartável com recursos limitados (CPU, memória, tempo). Se o código tentar fazer algo destrutivo, o container é destruído e a iteração é marcada como crash.

## Exemplos de mutações que funcionam

Dados reais do autoresearch original mostram mutações que pesquisadores humanos consideraram engenhosas:

Aumentar o learning rate de 0.01 para 0.04 — uma mudança que parece trivial mas produziu melhoria consistente. Trocar a ativação de GeLU para SiLU — uma decisão baseada em papers recentes sobre eficiência em modelos pequenos. Adicionar Value Embedding em camadas alternadas — uma otimização arquitetural que exigiu entendimento profundo do modelo.

E mutações que falharam: dobrar a largura do modelo (OOM — out of memory). Comprimir o system prompt (o modelo entrou em loop de thinking por 30+ minutos). Aumentar max_tokens demais (truncação causou loop de filler text). Cada falha ensina algo ao sistema — ou ao operador humano que revisa os logs.

---

**O que levar deste capítulo:**

- Código tem vantagem sobre texto para autoresearch: métricas objetivas (testes, performance, cobertura)
- O loop para código inclui execução real: compilar, rodar testes, medir benchmarks — não apenas avaliação por LLM
- Sandboxing é essencial — containers Docker isolam cada iteração de código gerado por IA
- Mutações de código variam de ajustes de hiperparâmetros a mudanças arquiteturais complexas

# Autoresearch para Prompts: O Meta-Nível da Otimização

Existe algo deliciosamente recursivo em usar IA para otimizar os prompts que controlam a própria IA. É meta-otimização no sentido literal: ao invés de melhorar o output diretamente, você melhora as instruções que produzem o output. O resultado é um prompt que extrai consistentemente melhor performance do modelo — não apenas para um input específico, mas para toda uma classe de inputs.

## O problema com prompts escritos por humanos

Prompts escritos por humanos sofrem de três viéses sistemáticos. Primeiro: subespecificação. Humanos assumem contexto que o modelo não tem. "Escreva um bom resumo" parece claro para nós, mas "bom" é ambíguo para o modelo. Segundo: sobreespecificação irrelevante. Humanos adicionam instruções que não afetam o output mas consomem tokens — como explicar ao modelo por que você precisa do resumo. Terceiro: path dependence. Humanos tendem a iterar sobre seu primeiro rascunho de prompt, fazendo ajustes incrementais, quando às vezes a estrutura inteira precisa mudar.

Autoresearch para prompts resolve os três problemas. Ele testa variações sistematicamente, descarta o que não funciona, e não tem apego emocional ao rascunho original.

## Prompt optimization com autoresearch

O framework é idêntico ao que já vimos, com uma torção: o "output" que está sendo avaliado não é o prompt em si — é o resultado que o prompt produz quando aplicado a um conjunto de test cases.

```
Loop:
1. Prompt atual → aplica a 10 test cases → coleta 10 outputs
2. Avalia os 10 outputs com rubric → score médio
3. Se score médio melhorou: keep o novo prompt
4. Muta o prompt → volta ao passo 1
```

A avaliação sobre múltiplos test cases é crucial. Um prompt que funciona para um input específico pode falhar para outros. Ao testar contra uma amostra diversa, o sistema encontra prompts que generalizam bem.

## DSPy e o estado da arte

O framework DSPy (2024-2026) sistematizou a otimização automática de prompts. A abordagem do DSPy é tratar prompts como programas com módulos composáveis, onde cada módulo pode ser otimizado independentemente. O otimizador do DSPy testa variações do prompt, mede a performance em exemplos de treino, e seleciona a melhor versão.

A conexão com autoresearch é direta: DSPy implementa o mesmo loop generate-evaluate-mutate, mas especializado para o domínio de prompts. A diferença é que DSPy usa técnicas de otimização mais sofisticadas do que hill climbing simples — incluindo bootstrapping de demonstrações (gerar exemplos few-shot automaticamente a partir de dados de treino) e otimização multi-estágio.

Na prática, o autoresearch genérico que construímos no capítulo de implementação pode ser adaptado para otimização de prompts sem precisar do DSPy. Mas para projetos de produção com dezenas de prompts interconectados, DSPy oferece abstrações que reduzem o boilerplate significativamente.

## Dimensões de um prompt otimizável

Ao mutar prompts, o sistema pode ajustar:

**Instruções de sistema.** O contexto dado ao modelo antes do input do usuário. Tom, persona, restrições de formato, exemplos de referência. Mudanças aqui afetam todos os outputs uniformemente.

**Template de input.** Como o input do usuário é formatado antes de ser enviado ao modelo. Adicionar contexto estruturado, reformular a pergunta, incluir informações auxiliares.

**Exemplos few-shot.** Quais exemplos são incluídos, em que ordem, e como são formatados. A seleção e ordenação de exemplos few-shot pode afetar drasticamente a qualidade do output.

**Cadeia de raciocínio.** Se e como o modelo é instruído a "pensar em voz alta" antes de responder. Chain-of-thought, step-by-step, think-then-answer — cada abordagem funciona melhor em contextos diferentes.

**Formato de output.** JSON, markdown, texto livre, XML. A especificação do formato afeta tanto a usabilidade do output quanto a qualidade do conteúdo (modelos tendem a ser mais precisos quando o formato é estritamente definido).

## Resultados típicos

Na prática, otimização automática de prompts via autoresearch produz ganhos consistentes de 10-25% na métrica alvo. Um prompt humano típico para classificação de sentimento pode atingir 78% de acurácia; após 30 iterações de autoresearch, a acurácia sobe para 88-92%. Para geração de texto, o score médio de qualidade tipicamente sobe de 6.5-7.0 para 7.5-8.5 em rubrics de 10 pontos.

Os ganhos maiores vêm de mudanças que humanos raramente tentariam: reordenar instruções (a ordem importa mais do que pensamos), remover instruções redundantes (menos é frequentemente mais), e adicionar exemplos negativos ("NÃO faça X" é surpreendentemente eficaz para eliminar padrões indesejados).

---

**O que levar deste capítulo:**

- Otimizar prompts com autoresearch é meta-otimização: melhorar as instruções que controlam a IA, não o output diretamente
- A avaliação deve usar múltiplos test cases para encontrar prompts que generalizam, não que funcionam para um caso só
- DSPy sistematiza a otimização de prompts com módulos composáveis e bootstrapping de demonstrações
- Ganhos típicos de 10-25% na métrica alvo, com as maiores melhorias vindo de mudanças que humanos raramente tentariam

# Autoresearch para Agentes: Sistemas que Evoluem suas Próprias Estratégias

Um agente de IA é mais que um modelo que responde perguntas. É um sistema que observa, decide e age num ambiente. Agentes têm ferramentas, memória, objetivos e estratégias. E quando você aplica autoresearch a um agente, algo fascinante acontece: o agente não apenas melhora seus outputs — ele melhora como opera. Melhora suas próprias estratégias de tomada de decisão, seleção de ferramentas e planejamento.

## O que é mutável num agente

Um agente típico em 2026 tem várias camadas de configuração, cada uma sendo um alvo de mutação:

**System prompt.** As instruções que definem a identidade, capacidades e restrições do agente. Mutar o system prompt muda fundamentalmente como o agente se comporta — seu "caráter."

**Estratégia de planejamento.** Como o agente decompõe tarefas complexas em sub-tarefas. Abordagem top-down vs. bottom-up. Paralelismo vs. sequência. Profundidade de planejamento antes de agir.

**Seleção de ferramentas.** Regras para quando usar qual ferramenta. Um agente com acesso a busca web, calculadora, gerador de código e API de e-mail precisa decidir qual ferramenta usar para cada sub-tarefa. Essas regras podem ser otimizadas.

**Formato de memória.** Como o agente estrutura e acessa informações de contexto anteriores. Resumos condensados vs. transcrições completas. Memória de curto prazo vs. longo prazo. Estratégias de recuperação.

**Critérios de parada.** Quando o agente decide que terminou uma tarefa. Muito cedo e o resultado é incompleto. Muito tarde e o agente desperdiça tokens refinando algo que já está bom.

## O loop autoresearch para agentes

O loop é conceitualmente idêntico ao que já vimos, mas a avaliação é mais complexa porque agentes produzem sequências de ações, não outputs únicos.

A avaliação de um agente precisa considerar: o resultado final foi correto? O caminho até o resultado foi eficiente? O agente usou as ferramentas certas? Ele pediu clarificação quando necessário? Ele respeitou as restrições definidas?

Na prática, a avaliação de agentes tipicamente usa uma combinação de métricas automatizadas (a tarefa foi completada?) e LLM-as-Judge (a execução foi elegante?). O score composto pesa resultado final mais que eficiência, mas penaliza severamente falhas de segurança ou violações de restrições.

## Benchmark-driven evolution

Uma abordagem poderosa é definir um benchmark de tarefas representativas e usar o score agregado como métrica para o autoresearch:

```python
BENCHMARK_TASKS = [
    {"input": "Pesquise o preço atual do Bitcoin",
     "expected": "resposta com preço atualizado e fonte",
     "tools_expected": ["web_search"]},
    {"input": "Calcule 15% de gorjeta sobre R$127.50",
     "expected": "R$19.13",
     "tools_expected": ["calculator"]},
    {"input": "Resuma o último email do João",
     "expected": "resumo preciso do email",
     "tools_expected": ["email_read"]},
    # ... 20+ tarefas diversas
]
```

O agente é avaliado contra todas as tarefas do benchmark. A mutação ajusta o system prompt, as regras de seleção de ferramentas, ou a estratégia de planejamento. Após 30 iterações, o agente tipicamente melhora sua taxa de sucesso no benchmark de 70-75% para 85-92%.

## Skills que se auto-aperfeiçoam

O conceito mais avançado é o de skills autoevolutivas. Um skill é uma capacidade específica do agente — por exemplo, "extrair dados de uma planilha e gerar um relatório." O skill tem seu próprio prompt, seus próprios parâmetros, e seu próprio histórico de performance.

Quando o autoresearch opera no nível de skills individuais, cada skill evolui independentemente. O skill de "gerar relatório" pode estar na iteração 45, enquanto o skill de "agendar reunião" está na iteração 12. Cada um tem seu próprio results.tsv, sua própria rubric, seu próprio melhor estado.

O resultado é um agente cujas capacidades individuais melhoram continuamente, sem que o operador humano precise identificar e corrigir cada fraqueza manualmente. O sistema identifica onde a performance é mais fraca (via breakdown do score por dimensão) e foca a mutação nas áreas com maior potencial de melhoria.

## Riscos específicos de agentes

Autoresearch para agentes traz riscos que não existem em autoresearch para texto. Um texto ruim é apenas um texto ruim. Um agente cujo system prompt foi mutado incorretamente pode tomar ações no mundo real com consequências: enviar e-mails errados, deletar arquivos, fazer compras. Por isso, autoresearch para agentes deve sempre rodar em ambiente sandbox com ações simuladas, nunca em produção direta.

O padrão seguro é: otimize em sandbox → valide com humano → deploy em produção. O loop autoresearch roda no sandbox. O humano revisa o melhor resultado antes de colocar em produção. A automação total (sem revisão humana) é tentadora mas prematura para agentes que interagem com o mundo real.

---

**O que levar deste capítulo:**

- Autoresearch para agentes otimiza estratégias de decisão, seleção de ferramentas e planejamento, não apenas outputs
- Benchmarks de tarefas representativas são a melhor métrica para evolução de agentes
- Skills individuais podem evoluir independentemente, cada um com seu próprio loop autoresearch
- Agentes que agem no mundo real devem ser otimizados em sandbox e validados por humanos antes do deploy

# Limites e Riscos: Onde o Loop Pode Dar Errado

Todo sistema que otimiza uma métrica corre o risco de otimizar a coisa errada. O autoresearch não é exceção. Quando o loop funciona, produz resultados impressionantes. Quando falha, os modos de falha são instrutivos — e às vezes sutis o suficiente para passarem despercebidos até ser tarde demais.

## Mode collapse

O modo de falha mais comum em autoresearch para conteúdo é o mode collapse: o sistema converge para um estilo repetitivo que pontua bem na rubric mas é monótono para leitores humanos. Cada iteração remove um pouco de variação. Parágrafos ficam com o mesmo tamanho. Sentenças seguem o mesmo padrão. Exemplos são todos do mesmo tipo. O score continua subindo (ou estabiliza num patamar alto), mas a qualidade percebida por humanos cai.

Mode collapse acontece quando a rubric não penaliza monotonia explicitamente. A solução é adicionar uma dimensão de "variação" ou "surpresa" na rubric, ou incluir uma persona avaliadora que especificamente procure repetitividade.

## Overfitting ao juiz

Se o gerador e o avaliador são o mesmo modelo (ou modelos muito similares), o sistema pode aprender a explorar os viéses do avaliador. O gerador descobre que certos padrões — como incluir a frase "é importante notar que" — consistentemente recebem scores mais altos do avaliador, mesmo que não adicionem valor real. O resultado é um output que impressiona o avaliador-LLM mas não impressiona leitores humanos.

A analogia é com o ensino para o teste: estudantes que aprendem a acertar questões de múltipla escolha sem entender o conteúdo. O output "passa na prova" (score alto) mas "não sabe a matéria" (qualidade real baixa).

Mitigação: trocar periodicamente o modelo avaliador, usar avaliadores humanos como verificação a cada N iterações, e incluir na rubric critérios que são difíceis de "gamificar" (como verificação factual contra fontes externas).

## Custos descontrolados

Cada iteração custa dinheiro. O custo por iteração pode parecer pequeno (centavos), mas loops descontrolados podem acumular custos significativos. Cem iterações com Claude Sonnet custam US$2-8. Mil iterações custam US$20-80. Se o sistema roda continuamente sem supervisão, com retries em caso de erro de API, os custos podem surpreender.

Boas práticas: definir um orçamento máximo por sessão de autoresearch. Implementar circuit breakers que pausam o loop quando o custo acumulado ultrapassa um threshold. Monitorar o custo por ponto de score — se o custo marginal de mais 0.1 de score excede o valor daquela melhoria, é hora de parar.

## Quando parar o loop

A pergunta mais difícil do autoresearch não é técnica — é econômica. Quando o custo de mais uma iteração supera o valor da melhoria esperada, o loop deve parar. Mas medir "valor da melhoria esperada" é subjetivo.

Heurísticas práticas:

**Regra das 10 iterações.** Se as últimas 10 iterações foram todas discard, o sistema provavelmente convergiu. A chance de a próxima iteração produzir uma melhoria significativa é baixa.

**Regra do delta mínimo.** Defina um delta mínimo de melhoria. Se o maior keep das últimas 20 iterações melhorou menos de 0.1 ponto, as melhorias restantes são provavelmente marginais.

**Regra do bom o suficiente.** Se o score atingiu um threshold pré-definido (ex: 8.5/10), pare independente do custo. A diferença entre 8.5 e 9.0 raramente justifica o investimento.

**Regra da revisão humana.** A cada 25 iterações, um humano lê o melhor output e compara com o output da iteração 0. Se a melhoria é visível e significativa, continue. Se é marginal ou imperceptível, pare.

## Degradação de qualidade paradoxal

Um fenômeno contraintuitivo que ocorre em sistemas autoresearch mal configurados: o score sobe consistentemente, mas a qualidade percebida por humanos cai. Isso acontece quando a rubric tem blind spots — dimensões de qualidade que humanos valorizam mas que não estão representadas na rubric.

Exemplo: uma rubric para texto que não inclui "naturalidade" pode levar o sistema a produzir texto cada vez mais "correto" mas progressivamente menos natural — como um estrangeiro que fala gramaticalmente perfeito mas soa estranho. O score sobe porque todas as dimensões medidas melhoram. A qualidade percebida cai porque uma dimensão não medida está piorando.

A solução é iteração na própria rubric. Autoresearch sobre a rubric: periodicamente, compare o "melhor" output com a avaliação de humanos. Se divergem, a rubric precisa de novas dimensões ou pesos ajustados.

---

**O que levar deste capítulo:**

- Mode collapse (convergência para monotonia) é o modo de falha mais comum — mitigado por dimensão de "variação" na rubric
- Overfitting ao juiz acontece quando gerador e avaliador são muito similares — trocar periodicamente o avaliador
- Definir orçamento máximo e circuit breakers evita custos descontrolados em loops não supervisionados
- A rubric em si precisa de iteração — se scores altos não correspondem a qualidade humana, a rubric tem blind spots

# A Conexão com a Singularidade: O Que Tudo Isso Significa

Em 1965, o estatístico I.J. Good descreveu o conceito de "explosão de inteligência": uma máquina ultrainteligente que pode projetar máquinas ainda melhores, gerando um ciclo de auto-aperfeiçoamento que deixaria a inteligência humana para trás. Sessenta anos depois, com o autoresearch rodando em laptops comuns, essa abstração filosófica ganhou uma implementação concreta. Não estamos na singularidade. Mas estamos mais perto do que parecia possível uma década atrás.

## Recursive self-improvement: da teoria à prática

O autoresearch demonstra recursive self-improvement de forma tangível. Um sistema de IA melhora seus próprios outputs iterativamente. Se esses outputs incluem o próprio código do sistema (como no repositório original de Karpathy), a IA está literalmente melhorando a si mesma. Se os outputs são prompts que controlam a IA (como no capítulo sobre otimização de prompts), a IA está melhorando suas próprias instruções. Se os outputs são estratégias de agentes, a IA está melhorando como pensa e decide.

A cadeia é clara: IA → melhora seus parâmetros → produz outputs melhores → que são usados para melhorar mais parâmetros → que produzem outputs ainda melhores. É um loop de feedback positivo. A questão é: esse loop explode (crescimento exponencial sem limites) ou converge (melhorias ficam cada vez menores até parar)?

## Por que não explode (ainda)

Na prática atual, o loop converge. Depois de 50-100 iterações, as melhorias se tornam marginais. O score se aproxima de um teto e estabiliza. Por quê?

**Teto do modelo.** O LLM gerador tem uma capacidade finita. Por mais que você otimize os parâmetros, o modelo não pode produzir outputs melhores do que sua capacidade intrínseca permite. Melhorar o prompt de um modelo com capacidade de "nível 8" pode elevar seu output de 6 para 7.5, mas não para 9.5.

**Teto da rubric.** A rubric define o espaço de busca. Quando todas as dimensões da rubric estão próximas do máximo, não há mais para onde subir — dentro daquela rubric. Mudar a rubric abriria novo espaço, mas isso requer intervenção humana.

**Teto da diversidade.** Depois de muitas iterações, o espaço de mutações viáveis se esgota. O sistema já testou as variações mais promissoras. As restantes são combinações marginais com probabilidade baixa de melhoria.

Esses tetos são o que impede a singularidade via autoresearch atual. Mas cada teto é potencialmente temporário. Modelos melhores elevam o teto do modelo. Rubrics adaptativas elevam o teto da rubric. E se o sistema pudesse propor novas dimensões de qualidade por conta própria...

## O cenário da singularidade

A singularidade tecnológica, no contexto de IA, requer que o loop de auto-aperfeiçoamento escape dos tetos descritos acima. Para isso, seriam necessárias três capacidades que os sistemas atuais não têm:

**Auto-modificação profunda.** Não apenas otimizar parâmetros dentro de uma arquitetura fixa, mas modificar a própria arquitetura. Trocar o modelo por um melhor. Redesenhar o loop. Inventar novas métricas.

**Avaliação meta-recursiva.** Não apenas avaliar outputs, mas avaliar se a avaliação é boa. E avaliar se a avaliação da avaliação é boa. Recursão infinita na metacognição.

**Aquisição autônoma de recursos.** Mais compute, mais dados, mais ferramentas — sem depender de humanos para provisionar esses recursos.

Nenhuma dessas capacidades existe de forma autônoma hoje. Todas dependem de humanos no loop: humanos que escolhem o modelo, definem a rubric, e pagam a conta do compute. O autoresearch de 2026 é recursive self-improvement assistido por humanos — não autônomo.

## Implicações filosóficas

Mesmo sem singularidade plena, o autoresearch levanta questões filosóficas profundas.

Se uma IA melhora iterativamente um texto de ficção até que ele emocione leitores humanos, quem é o autor? A IA que gerou? A rubric que definiu "bom"? O humano que definiu a rubric? A resposta provavelmente é: todos. Autoria se torna distribuída e iterativa, não individual e pontual.

Se uma IA otimiza seu próprio prompt até que ele funcione melhor que qualquer prompt escrito por humanos, isso é "inteligência"? Ou é "apenas" busca num espaço de possibilidades? A distinção parece importante mas pode ser uma distinção sem diferença — a evolução biológica também é "apenas" busca num espaço de possibilidades, e produziu inteligência humana.

Se agentes de IA podem melhorar suas próprias estratégias autonomamente, qual é o papel do humano? O papel muda de operador para arquiteto: definir os objetivos, as restrições, as métricas — e deixar o sistema encontrar o caminho. É uma mudança de paradigma de fazer para definir.

## O horizonte realista

Em 2026, o autoresearch é uma técnica de engenharia poderosa, não uma ameaça existencial. Ele produz textos melhores, código mais limpo, prompts mais eficazes e agentes mais capazes. Ele não produz consciência, não busca recursos por conta própria, e não escapa dos limites que humanos definem para ele.

O horizonte realista para os próximos anos é: sistemas autoresearch cada vez mais sofisticados, operando em domínios cada vez mais amplos, com loops cada vez mais longos — mas sempre dentro de fronteiras definidas por humanos. A singularidade, se vier, virá de algo fundamentalmente diferente do autoresearch como o conhecemos. Mas o autoresearch é, sem dúvida, uma demonstração tangível de que auto-aperfeiçoamento recursivo funciona em domínios restritos. E domínios restritos têm o hábito de se expandir.

---

**O que levar deste capítulo:**

- O autoresearch demonstra recursive self-improvement concreto: IA que melhora iterativamente seus próprios outputs e parâmetros
- Na prática, o loop converge devido a tetos do modelo, da rubric e da diversidade de mutações
- A singularidade requer auto-modificação profunda, avaliação meta-recursiva e aquisição autônoma de recursos — nenhuma existe hoje
- O autoresearch de 2026 é auto-aperfeiçoamento assistido por humanos, poderoso como ferramenta, longe de ameaça existencial

# Casos Reais: Autoresearch em Produção

Teoria sem aplicação é exercício acadêmico. Autoresearch se prova no campo — em sistemas reais, com métricas reais, rodando em servidores reais. Os casos a seguir demonstram que o pattern funciona não apenas em experimentos isolados, mas em fluxos de produção onde qualidade e custo são restrições simultâneas.

## Caso 1: Escrita criativa autônoma (TCH)

O projeto They Can Hear usou autoresearch para melhorar iterativamente roteiros de ficção de áudio. O sistema rodava localmente com Qwen 9B via LM Studio, sem custo de API. A cada iteração: gerar cinco cenas, avaliar com rubric de cinco dimensões (voz, autenticidade, concisão visual, ritmo, coerência), mutar os parâmetros de geração.

Resultados concretos. Baseline: 6.78/10. Melhor score alcançado: 8.02/10 após 17 experimentos mantidos (de 140+ testados). A melhoria mais impactante (salto de 6.78 para 7.87) veio de uma única mudança: adicionar detalhes acústicos específicos do ambiente — concreto dos anos 1970, reverberação de elevador, tubulação de água martelando. Uma mutação que um escritor humano poderia levar semanas para considerar, o sistema propôs e validou em minutos.

As falhas foram tão instrutivas quanto os sucessos. Experimentos que tentaram comprimir o system prompt (exp05) falharam porque o modelo entrou em modo de "pensamento" extenso e nunca produziu output útil. Experimentos com modelos diferentes (GPT-OSS 20B vs. Qwen 9B) mostraram que o modelo importa: GPT-OSS produziu scores erráticos entre 0.0 e 7.25, enquanto Qwen 9B foi mais consistente.

O custo total de 140+ experimentos rodando localmente: zero em API. Apenas eletricidade e desgaste de GPU. Para um projeto com orçamento limitado, rodar autoresearch com modelos locais é a abordagem mais viável.

## Caso 2: Otimização de conteúdo educacional

Cursos online são um domínio natural para autoresearch. Cada capítulo pode ser gerado, avaliado contra uma rubric educacional (clareza, profundidade, engajamento, exemplos práticos, progressão didática), e mutado iterativamente. O resultado é conteúdo que passou por dezenas de revisões automáticas antes de qualquer revisão humana.

A rubric educacional difere da rubric literária em pontos importantes. "Engajamento" em educação não é a mesma coisa que em ficção — significa manter o aluno cognitivamente ativo, não apenas entretido. "Profundidade" precisa ser calibrada ao nível do público — profundo demais perde iniciantes, raso demais entedia avançados. "Exemplos práticos" precisam ser não apenas presentes, mas executáveis — o aluno deve conseguir reproduzir o exemplo no seu computador.

Na prática, autoresearch para conteúdo educacional tipicamente roda 15-25 iterações por capítulo, com custo de US$1-3 por capítulo quando usando modelos cloud. O ganho é mais visível em capítulos técnicos (onde precisão e clareza são críticos) do que em capítulos conceituais (onde o ganho é mais subjetivo).

## Caso 3: Code improvement pipeline

Um pipeline de autoresearch para código funciona como code review automatizado e infinito. O sistema recebe um módulo de código, roda os testes, identifica áreas de melhoria (via análise estática, profiling, cobertura), propõe refatorações, e repete.

A diferença para linters e formatters tradicionais é que o autoresearch pode propor mudanças semânticas, não apenas cosméticas. Um linter pode apontar que uma função é longa demais. O autoresearch pode propor como dividí-la, testar se a divisão mantém todos os testes passando, e verificar se a performance não degradou.

Em implementações de produção, o pipeline roda como CI/CD step: a cada push, o autoresearch faz N iterações de melhoria e abre um PR com as mudanças propostas. O humano revisa e aprova (ou rejeita) o PR. Com o tempo, o sistema aprende (via histórico de aprovações e rejeições) quais tipos de mudança o time prefere.

## Caso 4: Conteúdo de marketing iterativo

Marketing digital é particularmente adequado para autoresearch porque a métrica final (conversão) é objetiva e mensurável. O loop:

Gerar variações de copy (headline, subheadline, CTA, proof elements). Avaliar com LLM-as-Judge usando rubric de marketing (clareza de proposta de valor, urgência, redução de objeções, match com público-alvo). Mutar parâmetros. Repetir.

A diferença em relação a A/B testing tradicional: autoresearch pode testar 50 variações antes de publicar qualquer uma, usando apenas avaliação por LLM. O A/B test tradicional precisa de tráfego real (caro e lento). O autoresearch pré-filtra as variações mais promissoras, e apenas as top 3-5 vão para A/B test com tráfego real. O resultado é um pipeline de otimização muito mais eficiente.

## Padrões que emergem

Olhando transversalmente pelos quatro casos, alguns padrões se repetem:

As maiores melhorias acontecem nas primeiras 5-10 iterações. Os ganhos são decrescentes. A taxa de keep é tipicamente 10-15% — a maioria dos experimentos falha, e isso é normal. Modelos locais são viáveis para iteração rápida e barata, com modelos cloud reservados para avaliação de alta qualidade. O histórico de experimentos (results.tsv) é o ativo mais valioso do sistema — é conhecimento acumulado sobre o que funciona e o que não funciona.

---

**O que levar deste capítulo:**

- TCH demonstrou 140+ iterações de escrita criativa, com score subindo de 6.78 para 8.02 usando modelo local gratuito
- Conteúdo educacional se beneficia de 15-25 iterações por capítulo, com rubric adaptada para contexto didático
- Code improvement via autoresearch propõe refatorações semânticas, não apenas cosméticas, como CI/CD step
- Marketing combina autoresearch (pré-filtragem barata) com A/B testing (validação real) para eficiência máxima

# O Modelo Multi-Provedor: Local, Cloud e Híbrido

Rodar autoresearch com um único modelo de API cloud é simples — mas caro. Rodar com um único modelo local é barato — mas potencialmente limitado em qualidade. A abordagem mais pragmática é híbrida: diferentes modelos para diferentes funções do loop, otimizando o trade-off entre custo e qualidade.

## A arquitetura de model registry

O conceito de model registry aparece em implementações maduras de autoresearch. É uma camada de abstração que permite ao loop usar diferentes modelos para diferentes funções sem que a lógica principal precise saber qual modelo específico está sendo usado.

O registry mapeia funções (geração, avaliação, mutação) para modelos específicos (Claude Sonnet, GPT-4.1, Qwen 9B local, Llama 3.3 70B). Cada modelo pode ter parâmetros diferentes (temperatura, max_tokens) e endpoints diferentes (API cloud, LM Studio local, Ollama local).

Exemplo de configuração:

```json
{
  "generation": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-20250514",
    "temperature": 0.7
  },
  "evaluation": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-20250514",
    "temperature": 0.2
  },
  "mutation": {
    "provider": "lmstudio",
    "model": "qwen/qwen3.5-9b",
    "temperature": 0.8
  }
}
```

Nessa configuração, geração e avaliação usam Claude Sonnet (alta qualidade, custo por token) enquanto mutação usa Qwen 9B rodando localmente via LM Studio (custo zero, qualidade suficiente para propor variações).

## Quando usar modelos locais

Modelos locais brilham em três cenários:

**Iteração rápida de desenvolvimento.** Quando você está testando a lógica do loop em si (não o output), modelo local permite rodar centenas de iterações sem custo. A qualidade do output não importa nessa fase — o que importa é que o loop funciona corretamente.

**Mutação.** A tarefa de mutação (propor uma mudança nos parâmetros) é relativamente simples. Não requer o melhor modelo disponível — precisa apenas de criatividade suficiente para sugerir variações razoáveis. Modelos de 7-9B parâmetros são adequados para isso.

**Volume alto.** Se você precisa rodar 500+ iterações (por exemplo, para otimizar 50 prompts diferentes com 10 iterações cada), modelo local torna o custo praticável. A mesma operação com Claude Sonnet custaria US$40-200.

## Quando usar modelos cloud

Modelos cloud são essenciais em dois cenários:

**Avaliação de alta qualidade.** O avaliador é o componente mais crítico do autoresearch. Se o avaliador é fraco, todo o sistema otimiza na direção errada. Modelos cloud de última geração (Claude Opus, GPT-4.1, Gemini 2.5 Pro) produzem avaliações mais consistentes e alinhadas com julgamento humano.

**Geração final.** Após a otimização dos parâmetros via autoresearch, a geração final do output pode usar o melhor modelo disponível. Os parâmetros foram otimizados com modelo mais fraco, mas o output final é gerado com modelo top-tier. Isso combina o melhor dos dois mundos: custo baixo de otimização com qualidade alta de produção.

## LM Studio, Ollama e alternativas locais

Em 2026, rodar modelos locais é surpreendentemente acessível. LM Studio oferece interface gráfica com API OpenAI-compatible, roda modelos quantizados de até 70B parâmetros em GPUs consumer (16-24GB VRAM). Ollama oferece o mesmo via CLI, com foco em simplicidade.

Para autoresearch, a configuração típica é:

GPU de 12-16GB VRAM: modelos de 7-9B parâmetros (Qwen 3.5 9B, Llama 3.3 8B). Suficiente para mutação e avaliação básica.

GPU de 24GB VRAM: modelos de 14-32B parâmetros (Qwen 3.5 32B, Llama 3.3 70B quantizado). Qualidade próxima de modelos cloud para a maioria das tarefas.

GPU de 48GB+ VRAM: modelos de 70B+ parâmetros sem quantização agressiva. Qualidade comparável a modelos cloud, custo apenas de eletricidade.

## Fallback e resiliência

Um sistema autoresearch de produção precisa de fallbacks. Se o LM Studio cai (VRAM contention, crash do processo), o loop precisa continuar. Se a API cloud retorna erro de rate limit, o loop precisa esperar e retry.

A implementação robusta tem três camadas de fallback: modelo primário → modelo secundário → pausa com retry. Se Qwen 9B local falha, tenta Claude Sonnet via API. Se Claude Sonnet retorna 429 (rate limit), espera 60 segundos e tenta de novo. Se todos falharem após 3 tentativas, registra como crash e continua para a próxima iteração.

Os dados reais do projeto TCH mostram exatamente isso em ação: experimentos que falharam por "VRAM contention from other loaded models" foram registrados como crash, o loop continuou automaticamente com a próxima iteração, e o sistema se recuperou sem intervenção humana.

---

**O que levar deste capítulo:**

- A abordagem híbrida (modelo local para mutação, modelo cloud para avaliação/geração final) otimiza o trade-off custo-qualidade
- Model registry é uma abstração que permite trocar modelos sem alterar a lógica do loop
- GPUs consumer de 12-24GB VRAM rodam modelos de 7-32B parâmetros, suficientes para mutação e avaliação básica
- Fallbacks robustos (local → cloud → retry) garantem que o loop continue mesmo com falhas de infraestrutura

# Construindo Seu Próprio Sistema Autoresearch: O Template Completo

Tudo que foi discutido nos capítulos anteriores converge aqui. Vamos montar o template completo de um sistema autoresearch que você pode clonar, configurar para seu domínio, e colocar para rodar. O template cobre os quatro componentes essenciais: geração, avaliação, mutação e orquestração.

## Estrutura de diretórios

```
meu-autoresearch/
├── loop.py              # Orquestrador principal
├── generator.py         # Módulo de geração
├── evaluator.py         # Módulo de avaliação
├── mutator.py           # Módulo de mutação
├── model_registry.py    # Abstração de modelos
├── config.json          # Parâmetros atuais
├── rubric.md            # Critérios de avaliação
├── results.tsv          # Histórico de experimentos
├── best_output.md       # Melhor output encontrado
├── experiments/         # Histórico completo de outputs
│   ├── exp_001.md
│   ├── exp_002.md
│   └── ...
└── dashboard.py         # Dashboard web (opcional)
```

Cada módulo é independente e substituível. Você pode trocar o `evaluator.py` sem tocar no `loop.py`. Pode adicionar um novo provider no `model_registry.py` sem alterar nenhum outro arquivo. Essa modularidade é intencional — permite adaptar o template a qualquer domínio.

## O model_registry.py

```python
from openai import OpenAI
import anthropic
import os

PROVIDERS = {
    "anthropic": {
        "client": lambda: anthropic.Anthropic(),
        "call": lambda client, model, messages, **kw:
            client.messages.create(
                model=model, messages=messages, **kw
            ).content[0].text
    },
    "lmstudio": {
        "client": lambda: OpenAI(
            base_url=os.getenv("LM_STUDIO_URL",
                               "http://localhost:1234/v1"),
            api_key="not-needed"
        ),
        "call": lambda client, model, messages, **kw:
            client.chat.completions.create(
                model=model, messages=messages, **kw
            ).choices[0].message.content
    },
    "openai": {
        "client": lambda: OpenAI(),
        "call": lambda client, model, messages, **kw:
            client.chat.completions.create(
                model=model, messages=messages, **kw
            ).choices[0].message.content
    }
}
```

A abstração é simples: cada provider tem um factory de client e uma função de chamada. O código do loop chama `call(client, model, messages)` sem saber se está falando com Claude, GPT ou Qwen local.

## O evaluator.py

```python
import json
import re
from pathlib import Path

RUBRIC = Path("rubric.md").read_text(encoding="utf-8")

def build_eval_prompt(text):
    return f"""Você é um avaliador rigoroso e consistente.

Avalie o texto abaixo usando esta rubric:

{RUBRIC}

TEXTO PARA AVALIAR:
{text}

Responda APENAS com JSON válido no formato:
{{
  "score": <float 0-10>,
  "breakdown": {{
    "dimensao1": <float 0-10>,
    "dimensao2": <float 0-10>
  }},
  "weakest_dimension": "<nome da dimensão mais fraca>",
  "reasoning": "<1-2 frases explicando o score>"
}}"""

def extract_json(text):
    """Extrai JSON de uma resposta que pode conter texto
    extra antes ou depois do JSON."""
    # Estratégia 1: parse direto
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Estratégia 2: encontrar bloco JSON
    match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}',
                      text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    # Estratégia 3: fallback
    return {"score": 0, "breakdown": {},
            "reasoning": "Failed to parse evaluation"}
```

A robustez do parsing JSON é crítica. LLMs frequentemente adicionam texto antes ou depois do JSON, ou formatam de forma levemente inválida. Múltiplas estratégias de extração com fallback previnem que o loop inteiro trave por causa de um output mal formatado.

## O mutator.py

```python
def build_mutation_prompt(config, history):
    gen = config["generation"]
    recent = history[-5:] if len(history) > 5 else history

    history_text = "\n".join([
        f"Exp {h['exp']}: score={h['score']:.2f} "
        f"({h['status']}) - fraqueza: "
        f"{h.get('weakest', 'N/A')}"
        for h in recent
    ])

    return f"""Você é um especialista em otimização.

PARÂMETROS ATUAIS:
{json.dumps(gen, indent=2, ensure_ascii=False)}

HISTÓRICO RECENTE:
{history_text}

Proponha UMA mutação nos parâmetros de geração para
melhorar a qualidade. Foque na dimensão mais fraca.

Responda APENAS com JSON:
{{
  "mutation_type": "parametric|structural|conceptual",
  "changes": {{ ... pares chave:valor para alterar ... }},
  "reasoning": "por que esta mutação deve melhorar o score"
}}

NÃO repita mutações que já falharam no histórico."""
```

O prompt de mutação inclui o histórico recente para evitar repetição. A instrução para focar na dimensão mais fraca direciona a busca para onde há mais potencial de melhoria.

## O dashboard

O dashboard é opcional mas extremamente útil para monitoramento. Uma implementação simples com Streamlit ou Gradio mostra: o score ao longo do tempo (gráfico), o status da iteração atual, o breakdown por dimensão, e um botão de stop. O dashboard lê o `results.tsv` e o `loop_status.json` para exibir informações em tempo real.

No projeto TCH, o dashboard incluía também a capacidade de trocar o modelo ativo, ajustar parâmetros manualmente, e ver o diff entre o melhor output e o output atual. Essas funcionalidades transformam o autoresearch de um script que roda no terminal em um sistema interativo que operadores podem monitorar e ajustar em tempo real.

## Adaptação para seu domínio

Para adaptar o template ao seu domínio, você precisa definir três coisas:

**O que é gerado.** Texto? Código? Prompts? Configuração de agente? Isso determina o conteúdo do `generator.py` e o formato do output.

**Como é avaliado.** Rubric com dimensões e pesos para seu domínio específico. Isso vai no `rubric.md` e no `evaluator.py`.

**O que é mutável.** Quais parâmetros do `config.json` o sistema pode alterar. Quanto mais dimensões mutáveis, maior o espaço de busca — mas também mais iterações necessárias para convergir.

O template funciona para qualquer domínio onde essas três perguntas tenham respostas claras. Se você consegue definir "bom output" em termos mensuráveis, o autoresearch pode melhorar seus outputs automaticamente.

## Checklist de lançamento

Antes de colocar seu autoresearch para rodar:

Verificar que o loop funciona com `--max-exp 1` (uma iteração completa). Verificar que o results.tsv é escrito corretamente. Verificar que o best_output.md é atualizado apenas em keeps. Verificar que a mutação produz JSON válido e que as mudanças são aplicadas ao config. Definir orçamento máximo e circuit breaker. Fazer uma avaliação humana do baseline para calibrar expectativas.

Depois: rodar 10 iterações. Revisar o output. Se as melhorias são visíveis, rodar mais 20-50. Se não são, revisar a rubric.

---

**O que levar deste capítulo:**

- O template completo tem sete arquivos: loop, generator, evaluator, mutator, model_registry, config e rubric
- Parsing robusto de JSON com múltiplas estratégias de fallback é essencial para que o loop não trave
- Para adaptar ao seu domínio: defina o que é gerado, como é avaliado e o que é mutável
- Comece com uma iteração, valide o pipeline, depois escale para dezenas — sempre com revisão humana periódica

# O Futuro Iterativo: Para Onde o Autoresearch Nos Leva

Estamos em março de 2026 e autoresearch já é uma técnica de engenharia estabelecida, não uma curiosidade de pesquisa. Startups usam para otimizar conteúdo. Equipes de engenharia usam para refinar código. Pesquisadores usam para explorar espaços de hiperparâmetros. Mas o que vem depois? Para onde esse pattern evolui nos próximos anos?

## Autoresearch em tempo real

A primeira evolução natural é autoresearch que não roda em batches, mas continuamente. Um sistema que monitora o desempenho dos outputs em produção e ajusta parâmetros em tempo real. Um e-mail de vendas que monitora sua taxa de abertura e ajusta o subject line automaticamente para o próximo envio. Uma landing page que monitora conversão e ajusta o copy hora a hora. Um agente de suporte que monitora CSAT scores e ajusta seu tom de resposta por turno.

A diferença para A/B testing tradicional é a velocidade de iteração e a inteligência da mutação. A/B testing testa duas variantes fixas. Autoresearch em tempo real testa variantes adaptativas que evoluem com base nos dados mais recentes.

## Autoresearch hierárquico

A segunda evolução é autoresearch operando em múltiplos níveis simultaneamente. No nível mais baixo, otimizando outputs individuais (este e-mail específico). No nível intermediário, otimizando templates (o formato de e-mails para este segmento de cliente). No nível mais alto, otimizando a estratégia (quais tipos de e-mail enviar para quais segmentos em quais momentos).

Cada nível tem seu próprio loop, sua própria rubric, e seu próprio ritmo de iteração. O nível baixo itera rápido (minutos). O intermediário, mais devagar (horas). O alto, mais devagar ainda (dias ou semanas). Os níveis se alimentam mutuamente: insights do nível baixo informam o nível intermediário, e vice-versa.

## Autoresearch colaborativo

A terceira evolução é autoresearch onde múltiplos sistemas compartilham aprendizados. Imagine dez empresas usando autoresearch para otimizar e-mails de vendas. Cada uma tem seu próprio loop, sua própria rubric, seus próprios dados. Mas se pudessem compartilhar (anonimamente) quais tipos de mutação funcionaram, todas se beneficiariam.

É o mesmo princípio do federated learning: cada participante mantém seus dados privados, mas compartilha gradientes (no caso de autoresearch: padrões de mutação bem-sucedidos). A empresa A descobre que "começar com uma pergunta" melhora scores de engajamento. Essa informação é compartilhada como uma "mutação sugerida" para todas as outras empresas. Cada uma testa no seu contexto específico e mantém ou descarta.

## A convergência com reinforcement learning

Autoresearch e reinforcement learning (RL) estão convergindo. Ambos compartilham a estrutura: agente → ação → ambiente → recompensa → atualização → repetição. A diferença é que autoresearch usa LLMs como agente e avaliador, enquanto RL clássico usa redes neurais treinadas por backpropagation.

A convergência é RLHF (Reinforcement Learning from Human Feedback), que já é standard no treinamento de LLMs. E auto-RLHF, onde o feedback vem de outro LLM ao invés de humanos, é exatamente autoresearch aplicado ao treinamento do modelo em si.

O círculo se fecha: autoresearch é RL onde o agente e o ambiente são ambos linguísticos. E RL é autoresearch onde o agente e o ambiente são ambos numéricos. A unificação dessas duas perspectivas é uma das fronteiras mais ativas da pesquisa em IA.

## O papel do humano no mundo autoresearch

Se IAs podem melhorar seus próprios outputs iterativamente, qual é o papel remanescente do humano?

**Arquiteto de métricas.** Definir o que "bom" significa. Criar rubrics que capturam o que realmente importa. Identificar dimensões de qualidade que a IA sozinha não consegue especificar. Este é talvez o papel mais importante — e o mais difícil de automatizar.

**Curador de estética.** Decidir questões de gosto e estilo que métricas não capturam. O output pode ter score 9.5 mas "não sentir certo." Esse julgamento humano intuitivo é o check final que previne a otimização de métricas vazias.

**Guardião ético.** Garantir que o sistema otimiza na direção certa. Um e-mail que maximiza cliques pode ser manipulativo. Um código que maximiza performance pode ter vulnerabilidades de segurança. O humano define as restrições éticas dentro das quais o autoresearch opera.

**Integrador de domínios.** Transferir insights de um domínio para outro. "Essa abordagem que funcionou para otimizar e-mails poderia funcionar para otimizar onboarding?" O autoresearch opera dentro de domínios; humanos conectam entre domínios.

## A aposta fundamental

Autoresearch é uma aposta numa ideia simples: que melhoria incremental automatizada, repetida o suficiente, produz resultados que excedem o que qualquer esforço único — humano ou artificial — consegue alcançar. Não é uma aposta na singularidade. É uma aposta na paciência computacional. Máquinas não se cansam, não se distraem, não desistem depois de cinco tentativas. Elas podem iterar mil vezes no tempo que um humano itera cinco.

O futuro não é IA substituindo humanos. É IA iterando enquanto humanos definem a direção. A qualidade vem do loop. A sabedoria vem do humano que decide o que otimizar — e o que não otimizar.

---

**O que levar deste capítulo:**

- Autoresearch evolui para tempo real (otimização contínua em produção), hierárquico (múltiplos níveis) e colaborativo (compartilhamento de mutações)
- A convergência entre autoresearch e reinforcement learning é uma das fronteiras mais ativas da pesquisa em IA
- O papel humano migra de operador para arquiteto de métricas, curador de estética, guardião ético e integrador de domínios
- A aposta fundamental é que paciência computacional (mil iterações automatizadas) supera qualquer esforço único