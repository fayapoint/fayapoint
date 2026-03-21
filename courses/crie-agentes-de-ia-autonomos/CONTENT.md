# O Que São Agentes de IA e Por Que 2026 É o Ano dos Agentes

Em janeiro de 2025, a OpenAI lançou o Operator. Em março, a Anthropic liberou o Claude Agent SDK. Em maio, o Google apresentou o Project Mariner. Em menos de doze meses, a indústria inteira de inteligência artificial migrou de um paradigma de "chatbot que responde perguntas" para um paradigma de "agente que executa tarefas". A mudança não foi incremental — foi uma ruptura.

Um agente de IA é um sistema que recebe um objetivo, decompõe esse objetivo em etapas, executa ações no mundo real para completar cada etapa, observa os resultados dessas ações e ajusta seu plano conforme necessário. A diferença entre um chatbot e um agente é a diferença entre alguém que te diz como trocar um pneu e alguém que efetivamente troca o pneu por você.

A arquitetura fundamental que tornou isso possível se chama ReAct — Reasoning and Acting. Proposta por Shunyu Yao em 2022, a abordagem ReAct intercala passos de raciocínio com passos de ação. O modelo não apenas pensa sobre o que fazer: ele pensa, age, observa o resultado e pensa novamente. Esse ciclo simples mas poderoso é o coração de praticamente todo agente de IA em produção hoje.

Mas por que 2026 é diferente? Três convergências técnicas tornaram agentes viáveis para produção em escala. Primeira: os modelos de linguagem atingiram um nível de raciocínio suficiente para planejar sequências longas de ações sem perder o contexto. Modelos como Claude Opus 4, GPT-5 e Gemini 2 Ultra conseguem manter coerência em cadeias de 50+ passos de execução. Segunda: o ecossistema de ferramentas amadureceu. O Model Context Protocol (MCP) da Anthropic se tornou o padrão de facto para conectar agentes a ferramentas externas, com mais de 3.000 integrações disponíveis. Terceira: os frameworks de orquestração — LangGraph, CrewAI, AutoGen, OpenClaw — evoluíram de experimentos acadêmicos para plataformas de produção com monitoramento, fallbacks e controle de custos.

O conceito de "tool use" (uso de ferramentas) é central para entender agentes. Um LLM sozinho só consegue gerar texto. Mas quando você dá a ele acesso a funções — buscar na web, ler um banco de dados, enviar um email, executar código — ele se torna capaz de agir no mundo. O modelo decide qual ferramenta usar, com quais parâmetros, interpreta o resultado e decide o próximo passo. Isso é function calling, e é o mecanismo que transforma um modelo de linguagem em um agente.

Existem diferentes níveis de autonomia para agentes. No nível mais básico, temos agentes reativos que respondem a estímulos específicos — um trigger chega, o agente executa uma ação predefinida. No nível intermediário, agentes deliberativos que planejam uma sequência de ações antes de executar. No nível mais avançado, agentes autônomos que definem seus próprios objetivos intermediários, aprendem com experiências passadas e colaboram com outros agentes para resolver problemas complexos.

O mercado já está precificando essa mudança. Empresas como Cognition (criadora do Devin, o primeiro engenheiro de software IA), Adept, e a própria Anthropic com o Claude Code estão construindo agentes que não apenas auxiliam profissionais — eles executam trabalho completo de forma independente. O Devin não sugere código: ele abre o IDE, escreve o código, roda os testes, faz debug, abre um pull request e responde aos code reviews.

Para quem está construindo produtos, a oportunidade é clara. Agentes de IA vão ser a interface padrão entre humanos e sistemas digitais. Em vez de navegar menus, preencher formulários e clicar em botões, o usuário vai descrever o que quer e o agente vai executar. Quem souber construir, orquestrar e deployar agentes terá uma vantagem competitiva brutal nos próximos anos.

Este curso foi projetado para levar você do entendimento conceitual à implementação em produção. Vamos construir agentes reais usando os frameworks mais relevantes de 2026, entender as arquiteturas que funcionam, e dominar os padrões que separam um agente de demonstração de um agente que roda em produção 24/7.

**O que levar deste capítulo:**

- Agentes de IA são sistemas que recebem objetivos, planejam ações, executam ferramentas e ajustam seu comportamento com base nos resultados — fundamentalmente diferentes de chatbots
- O padrão ReAct (Reason → Act → Observe → Repeat) é a arquitetura base de praticamente todo agente moderno em produção
- 2026 é o ponto de inflexão porque três fatores convergiram: modelos com raciocínio suficiente, ecossistema de ferramentas maduro via MCP, e frameworks de orquestração prontos para produção
- Function calling é o mecanismo técnico que transforma um LLM passivo em um agente ativo capaz de interagir com o mundo real


# Arquitetura de Agentes: LLM Como Cérebro, Tools Como Mãos, Memory Como Contexto

Se você abrisse o capô de qualquer agente de IA em produção hoje — do Claude Code ao Devin, do GitHub Copilot Workspace ao Cursor — encontraria três componentes fundamentais: um modelo de linguagem que raciocina, um conjunto de ferramentas que executam ações, e um sistema de memória que mantém contexto. Essa tríade é tão universal que se tornou quase um axioma no design de agentes.

O LLM é o cérebro do agente. Ele recebe o objetivo do usuário, decompõe em sub-tarefas, decide qual ferramenta usar a cada passo, interpreta os resultados e determina quando o objetivo foi alcançado. O modelo não executa nada diretamente — ele orquestra. Pense no LLM como um gerente de projeto extremamente capaz que sabe exatamente o que precisa ser feito, mas depende de sua equipe (as ferramentas) para executar o trabalho.

A escolha do LLM impacta diretamente a qualidade do agente. Modelos com forte capacidade de raciocínio — como Claude Opus 4, GPT-5, ou Gemini 2 Ultra — são melhores para tarefas que exigem planejamento complexo e cadeia longa de ações. Modelos mais rápidos e baratos — como Claude Haiku, GPT-4o Mini, ou Gemini Flash — são adequados para agentes que executam tarefas simples e repetitivas. A decisão não é apenas técnica: é econômica. Um agente que processa 10.000 requisições por dia com Claude Opus 4 pode custar 50x mais do que o mesmo agente com Haiku.

As ferramentas (tools) são as mãos do agente. Cada ferramenta é uma função que o agente pode chamar para interagir com o mundo externo. Uma ferramenta de busca na web permite ao agente pesquisar informações. Uma ferramenta de banco de dados permite consultar e modificar dados. Uma ferramenta de email permite enviar mensagens. Uma ferramenta de código permite executar scripts. A definição de uma ferramenta segue um padrão simples: nome, descrição, parâmetros de entrada e formato de saída.

```python
## Exemplo de definição de ferramenta para um agente
tool_definition = {
    "name": "buscar_cliente",
    "description": "Busca informações de um cliente no CRM pelo email",
    "parameters": {
        "type": "object",
        "properties": {
            "email": {
                "type": "string",
                "description": "Email do cliente para buscar"
            }
        },
        "required": ["email"]
    }
}
```

O poder de um agente é diretamente proporcional à qualidade e quantidade de suas ferramentas. Um agente com acesso apenas a busca na web é útil mas limitado. Um agente com acesso a busca na web, banco de dados, email, calendário, sistema de arquivos e APIs externas pode automatizar fluxos de trabalho inteiros. O design do conjunto de ferramentas é uma das decisões mais importantes na construção de um agente.

A memória é o contexto do agente. Sem memória, cada interação começa do zero — o agente não sabe o que fez antes, não lembra das preferências do usuário, não consegue aprender com erros passados. Existem três tipos fundamentais de memória para agentes.

A memória de curto prazo (working memory) é a janela de contexto do LLM. Tudo que está na conversa atual — o objetivo do usuário, as ações já tomadas, os resultados observados — vive na memória de curto prazo. O limite é definido pelo tamanho da janela de contexto do modelo: 200K tokens para Claude, 128K para GPT-4o, 2M para Gemini. Quando o contexto estoura, informações antigas são perdidas.

A memória de longo prazo persiste entre sessões. Pode ser implementada como um banco de dados vetorial (como Pinecone, Weaviate ou pgvector), um sistema de arquivos estruturado, ou até um banco relacional simples. Quando o agente precisa de informação que não está no contexto atual, ele consulta a memória de longo prazo. Isso permite que o agente "lembre" de interações passadas, preferências do usuário e conhecimento acumulado.

A memória episódica registra experiências completas — sequências de ações, seus resultados, e o que o agente "aprendeu" com cada experiência. Se um agente tentou três abordagens para resolver um problema e apenas a terceira funcionou, a memória episódica permite que ele vá direto para a abordagem correta na próxima vez que encontrar um problema similar.

A arquitetura completa de um agente conecta esses três componentes em um loop:

```
[Objetivo do Usuário]
        ↓
[LLM analisa objetivo + contexto da memória]
        ↓
[LLM decide próxima ação + ferramenta]
        ↓
[Ferramenta executa ação]
        ↓
[Resultado retorna ao LLM]
        ↓
[LLM avalia: objetivo alcançado?]
    ↓ Não → volta ao passo 2
    ↓ Sim → retorna resultado ao usuário
```

Além desses três componentes core, agentes de produção incluem camadas adicionais. Um sistema de planejamento que decompõe objetivos complexos em sub-tarefas antes de executar. Um sistema de avaliação que verifica se os resultados estão corretos. Um sistema de fallback que tenta abordagens alternativas quando uma ação falha. E um sistema de segurança que impede o agente de executar ações perigosas ou não autorizadas.

A diferença entre um agente amador e um agente de produção está nessas camadas adicionais. Qualquer desenvolvedor consegue conectar um LLM a uma ferramenta e fazer funcionar em uma demo. Fazer funcionar de forma confiável, segura e econômica em produção com milhares de usuários — isso requer engenharia séria em cada camada da arquitetura.

**O que levar deste capítulo:**

- Todo agente de IA é composto por três elementos: LLM (cérebro que raciocina e orquestra), Tools (ferramentas que executam ações) e Memory (memória que mantém contexto)
- A escolha do LLM é uma decisão técnica e econômica — modelos mais capazes custam mais, e a escolha certa depende da complexidade da tarefa do agente
- Ferramentas são funções com nome, descrição e parâmetros que o agente pode chamar — o poder do agente é proporcional à qualidade do seu toolkit
- Memória de curto prazo (contexto), longo prazo (banco vetorial) e episódica (experiências passadas) são fundamentais para agentes que funcionam em produção


# O Ciclo ReAct: Reason, Act, Observe, Repeat

Em outubro de 2022, Shunyu Yao e colegas de Princeton publicaram um paper que mudaria fundamentalmente a forma como construímos agentes de IA. O artigo "ReAct: Synergizing Reasoning and Acting in Language Models" demonstrou algo elegante: quando você força um modelo de linguagem a alternar entre pensar e agir, ele se torna dramaticamente melhor em resolver problemas complexos do que quando apenas pensa ou apenas age.

Antes do ReAct, existiam duas abordagens separadas para usar LLMs em tarefas complexas. A primeira era chain-of-thought (cadeia de pensamento): você pedia ao modelo para pensar passo a passo antes de responder. Isso melhorava o raciocínio, mas o modelo não podia agir no mundo — ele ficava preso em sua própria cabeça, fazendo suposições sobre fatos que poderia simplesmente verificar. A segunda era action-only: você dava ferramentas ao modelo e ele executava ações, mas sem articular seu raciocínio. Isso levava a sequências de ações sem coerência, onde o modelo perdia o fio da meada.

O ReAct combina os dois. O ciclo funciona assim:

**Thought (Pensamento):** O agente articula explicitamente o que está pensando. "O usuário quer saber o faturamento do último trimestre. Preciso acessar o banco de dados financeiro e filtrar pelo período correto."

**Action (Ação):** O agente escolhe e executa uma ferramenta. "Vou chamar a função consultar_banco_dados com os parâmetros: tabela='faturamento', periodo='Q4_2025'."

**Observation (Observação):** O agente recebe e interpreta o resultado. "O banco retornou R$ 2.3M. Mas o usuário pediu o último trimestre e estamos em março de 2026, então o último trimestre é Q1 2026, não Q4 2025. Preciso corrigir a consulta."

**Repeat:** O ciclo recomeça com um novo pensamento informado pela observação.

Essa alternância entre raciocínio explícito e ação concreta é o que torna agentes ReAct tão eficazes. O pensamento explícito serve como uma âncora que mantém o agente focado no objetivo. Sem ele, o agente tende a executar ações desconectadas. Com ele, cada ação é justificada por um raciocínio claro.

Na prática, implementar ReAct é surpreendentemente simples. A maioria dos frameworks modernos implementa o ciclo automaticamente quando você define tools para o modelo. Aqui está como funciona no nível de API:

```python
import anthropic

client = anthropic.Anthropic()

tools = [
    {
        "name": "consultar_vendas",
        "description": "Consulta o total de vendas em um período",
        "input_schema": {
            "type": "object",
            "properties": {
                "data_inicio": {"type": "string"},
                "data_fim": {"type": "string"}
            },
            "required": ["data_inicio", "data_fim"]
        }
    }
]

messages = [{"role": "user", "content": "Qual foi o total de vendas em janeiro?"}]

## O loop ReAct
while True:
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        tools=tools,
        messages=messages
    )

    # Se o modelo quer usar uma ferramenta (Act)
    if response.stop_reason == "tool_use":
        tool_block = next(b for b in response.content if b.type == "tool_use")

        # Executar a ferramenta
        resultado = executar_ferramenta(tool_block.name, tool_block.input)

        # Adicionar resultado como observação (Observe)
        messages.append({"role": "assistant", "content": response.content})
        messages.append({
            "role": "user",
            "content": [{"type": "tool_result", "tool_use_id": tool_block.id, "content": resultado}]
        })
        # Loop continua (Repeat)
    else:
        # Modelo terminou - retornar resposta final
        print(response.content[0].text)
        break
```

Esse padrão — enviar mensagem, verificar se o modelo quer usar ferramenta, executar ferramenta, enviar resultado de volta, repetir — é o coração de todo agente ReAct. Cada framework (LangChain, CrewAI, AutoGen) implementa variações desse mesmo loop.

Existem extensões importantes do ReAct que aparecem em agentes mais sofisticados. O **ReAct com planejamento** adiciona uma fase inicial onde o agente cria um plano completo antes de começar a executar. Isso é útil para tarefas longas onde perder o fio da meada é um risco real. O **ReAct com reflexão** (Reflexion) adiciona uma fase final onde o agente avalia criticamente seu próprio trabalho e decide se precisa refazer algo. O **ReAct com backtracking** permite que o agente volte atrás quando percebe que tomou um caminho errado, em vez de tentar seguir em frente a qualquer custo.

Um padrão que se tornou comum em 2025-2026 é o "inner monologue" ou "extended thinking" — onde o modelo tem um espaço dedicado para pensar antes de decidir a próxima ação, e esse pensamento não é visível ao usuário. O Claude usa o bloco `thinking` para isso, o OpenAI usa o modo o1/o3, e o Gemini usa o "thinking mode". Isso permite raciocínio mais profundo sem poluir a resposta final com pensamentos intermediários.

Os erros mais comuns na implementação de agentes ReAct são: loops infinitos (o agente nunca decide que terminou), ações repetitivas (o agente tenta a mesma coisa várias vezes esperando resultado diferente), e perda de contexto (em cadeias longas, o agente esquece o objetivo original). Cada um desses problemas tem soluções conhecidas: limite máximo de iterações, detecção de repetição, e resumo periódico do objetivo e progresso.

**O que levar deste capítulo:**

- ReAct (Reason → Act → Observe → Repeat) é o padrão fundamental que conecta o raciocínio do LLM à execução de ações reais, superando abordagens puramente pensativas ou puramente ativas
- O ciclo é implementado como um loop simples: enviar prompt, verificar se o modelo quer usar ferramenta, executar ferramenta, enviar resultado de volta, repetir até o modelo retornar resposta final
- Extensões como planejamento prévio, reflexão pós-execução e backtracking tornam agentes ReAct mais robustos para tarefas complexas
- Os três erros mais comuns — loops infinitos, ações repetitivas e perda de contexto — exigem contramedidas explícitas como limites de iteração e resumos periódicos


# Function Calling e Tool Use: Dando Ferramentas Para a IA

Quando a OpenAI lançou function calling no GPT-3.5 em junho de 2023, poucos perceberam que aquele recurso aparentemente simples seria o alicerce de toda a revolução de agentes que viria depois. Function calling é o mecanismo que permite ao modelo de linguagem declarar "quero chamar esta função com estes argumentos" — e então seu código executa essa função e retorna o resultado. É a ponte entre texto e ação.

O princípio é direto. Você descreve para o modelo quais ferramentas estão disponíveis — cada uma com nome, descrição e esquema de parâmetros. O modelo analisa a mensagem do usuário, decide se precisa usar uma ferramenta, e se precisar, retorna um bloco estruturado indicando qual ferramenta e com quais argumentos. Seu código recebe esse bloco, executa a função correspondente, e envia o resultado de volta ao modelo. O modelo então pode usar o resultado para responder ao usuário ou decidir chamar outra ferramenta.

Cada provedor implementa tool use com sua própria sintaxe, mas o conceito é idêntico. Vamos ver as três principais.

**Anthropic (Claude)** usa o formato `tools` na API Messages:

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    tools=[
        {
            "name": "obter_clima",
            "description": "Retorna a previsão do tempo para uma cidade",
            "input_schema": {
                "type": "object",
                "properties": {
                    "cidade": {"type": "string", "description": "Nome da cidade"},
                    "dias": {"type": "integer", "description": "Dias de previsão (1-7)"}
                },
                "required": ["cidade"]
            }
        }
    ],
    messages=[{"role": "user", "content": "Como está o tempo em São Paulo?"}]
)

## O modelo retorna um bloco tool_use
for block in response.content:
    if block.type == "tool_use":
        print(f"Ferramenta: {block.name}")
        print(f"Argumentos: {block.input}")
        # -> Ferramenta: obter_clima
        # -> Argumentos: {"cidade": "São Paulo"}
```

**OpenAI (GPT)** usa o formato `tools` na API Chat Completions:

```python
from openai import OpenAI

client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o",
    tools=[
        {
            "type": "function",
            "function": {
                "name": "obter_clima",
                "description": "Retorna a previsão do tempo para uma cidade",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "cidade": {"type": "string", "description": "Nome da cidade"},
                        "dias": {"type": "integer", "description": "Dias de previsão"}
                    },
                    "required": ["cidade"]
                }
            }
        }
    ],
    messages=[{"role": "user", "content": "Como está o tempo em São Paulo?"}]
)

tool_call = response.choices[0].message.tool_calls[0]
print(f"Ferramenta: {tool_call.function.name}")
print(f"Argumentos: {tool_call.function.arguments}")
```

**Google (Gemini)** usa uma abordagem similar com `function_declarations`:

```python
import google.generativeai as genai

obter_clima = genai.protos.FunctionDeclaration(
    name="obter_clima",
    description="Retorna a previsão do tempo para uma cidade",
    parameters=genai.protos.Schema(
        type=genai.protos.Type.OBJECT,
        properties={
            "cidade": genai.protos.Schema(type=genai.protos.Type.STRING),
            "dias": genai.protos.Schema(type=genai.protos.Type.INTEGER)
        },
        required=["cidade"]
    )
)

model = genai.GenerativeModel("gemini-2.0-ultra", tools=[obter_clima])
chat = model.start_chat()
response = chat.send_message("Como está o tempo em São Paulo?")
```

Repare no padrão comum: todas as APIs pedem a mesma coisa — nome da ferramenta, descrição textual, e um JSON Schema dos parâmetros. A descrição é crucial porque é isso que o modelo usa para decidir quando usar a ferramenta. Uma descrição ruim leva a decisões ruins. "Busca dados" é uma descrição péssima. "Busca informações de um cliente no banco de dados CRM a partir do email, retornando nome, empresa, histórico de compras e status da assinatura" é uma descrição que o modelo consegue usar com precisão.

Existem decisões importantes no design de ferramentas. **Granularidade**: ferramentas muito amplas ("gerenciar_banco_de_dados") dão pouco controle ao modelo. Ferramentas muito granulares ("inserir_valor_na_coluna_B_linha_42") geram excesso de chamadas. O ponto ideal é ferramentas que fazem uma coisa bem definida — "criar_cliente", "atualizar_cliente", "buscar_cliente", "deletar_cliente".

**Tratamento de erros**: suas ferramentas devem retornar erros claros e acionáveis. Se a busca falhou porque o email não existe, diga "Cliente não encontrado para o email X". Se falhou por timeout do banco, diga "Erro de conexão com o banco de dados — tente novamente". O modelo precisa dessas informações para decidir o próximo passo.

**Chamadas paralelas**: tanto Claude quanto GPT suportam chamadas paralelas de ferramentas — o modelo pode pedir para executar múltiplas ferramentas simultaneamente quando elas são independentes. Se o usuário pergunta "Compare o clima em São Paulo e Rio de Janeiro", o modelo pode chamar `obter_clima` para ambas as cidades em paralelo, em vez de uma de cada vez. Isso reduz latência significativamente.

**Confirmação humana (human-in-the-loop)**: para ações destrutivas ou irreversíveis — deletar dados, enviar emails, fazer transações financeiras — é essencial implementar um passo de confirmação. O agente propõe a ação, o usuário confirma, e só então a ferramenta executa. Esse padrão é universal em agentes de produção e é uma das primeiras coisas que auditores de segurança verificam.

A evolução de function calling para tool use não é apenas semântica. O conceito de "tool use" é mais amplo e inclui ferramentas que vão além de chamadas de função — como computer use (controle de mouse e teclado), code execution (execução de código arbitrário), e web browsing (navegação autônoma na web). Esses são os building blocks dos agentes mais avançados de 2026.

**O que levar deste capítulo:**

- Function calling é o mecanismo que permite ao LLM declarar qual ferramenta quer usar e com quais parâmetros, enquanto seu código executa a chamada real e retorna o resultado
- OpenAI, Anthropic e Google usam sintaxes diferentes mas o conceito é idêntico: nome, descrição textual e JSON Schema dos parâmetros — a qualidade da descrição é decisiva para o comportamento do agente
- Boas práticas incluem granularidade adequada (uma ferramenta = uma ação bem definida), tratamento de erros acionáveis, suporte a chamadas paralelas e confirmação humana para ações destrutivas
- Tool use é a evolução de function calling e inclui capacidades como computer use, code execution e web browsing — os blocos fundamentais dos agentes mais avançados


# Claude Agent SDK: Construindo Agentes com Anthropic

A Anthropic lançou o Claude Agent SDK em março de 2025 e desde então ele se tornou um dos frameworks mais adotados para construção de agentes. A razão é simples: o SDK abstrai toda a complexidade do loop ReAct, gerenciamento de ferramentas e orquestração de múltiplos agentes em uma API limpa e opinativa. Você define o agente, suas ferramentas e suas instruções — o SDK cuida do resto.

O conceito central do Claude Agent SDK é o `Agent`. Um Agent é uma entidade com um modelo, instruções em linguagem natural, e um conjunto de ferramentas. Quando você executa um Agent com uma tarefa, o SDK automaticamente gerencia o ciclo ReAct: o modelo raciocina, decide usar ferramentas, o SDK executa as ferramentas, retorna os resultados, e o modelo continua até completar a tarefa.

```python
from claude_sdk import Agent, tool

@tool
def buscar_preco(produto: str) -> str:
    """Busca o preço atual de um produto no catálogo."""
    catalogo = {"notebook": "R$ 4.500", "monitor": "R$ 2.200", "teclado": "R$ 350"}
    return catalogo.get(produto.lower(), f"Produto '{produto}' não encontrado")

@tool
def calcular_desconto(preco: str, percentual: float) -> str:
    """Calcula o preço com desconto aplicado."""
    valor = float(preco.replace("R$ ", "").replace(".", "").replace(",", "."))
    desconto = valor * (1 - percentual / 100)
    return f"R$ {desconto:,.2f}"

agente_vendas = Agent(
    model="claude-sonnet-4-20250514",
    instructions="""Você é um assistente de vendas.
    Ajude clientes a encontrar produtos e calcular descontos.
    Sempre confirme o preço antes de calcular desconto.""",
    tools=[buscar_preco, calcular_desconto]
)

resultado = agente_vendas.run("Quanto fica um notebook com 15% de desconto?")
print(resultado)
```

O decorator `@tool` transforma qualquer função Python em uma ferramenta para o agente. O SDK extrai automaticamente o nome da função, a docstring como descrição, e os type hints como esquema de parâmetros. Isso elimina a necessidade de escrever JSON Schema manualmente — um dos maiores pontos de atrito no development de agentes.

Uma das funcionalidades mais poderosas do Claude Agent SDK é o suporte nativo a **tool_use com streaming**. Em vez de esperar o agente completar toda a sequência de ações antes de mostrar qualquer resultado, você pode transmitir o progresso em tempo real:

```python
async for evento in agente_vendas.stream("Analise as vendas do mês"):
    if evento.type == "thinking":
        print(f"Pensando: {evento.content}")
    elif evento.type == "tool_call":
        print(f"Usando ferramenta: {evento.tool_name}")
    elif evento.type == "tool_result":
        print(f"Resultado: {evento.result[:100]}")
    elif evento.type == "response":
        print(f"Resposta: {evento.content}")
```

O **computer_use** é outra capacidade diferenciadora. O Claude consegue controlar o computador diretamente — mover o mouse, clicar em elementos, digitar texto, tirar screenshots. Isso permite criar agentes que interagem com qualquer software, mesmo aqueles sem API:

```python
from claude_sdk import Agent, ComputerTool

agente_desktop = Agent(
    model="claude-sonnet-4-20250514",
    instructions="Você controla o computador do usuário para automatizar tarefas.",
    tools=[ComputerTool()]
)

agente_desktop.run("Abra o Google Sheets, crie uma planilha nova e adicione uma tabela de despesas do mês")
```

O SDK também suporta **Agent Teams** — múltiplos agentes que colaboram para resolver tarefas complexas. Cada agente tem seu papel, suas ferramentas e suas instruções. Um agente coordenador distribui sub-tarefas para agentes especializados:

```python
from claude_sdk import Agent, AgentTeam, tool

pesquisador = Agent(
    model="claude-sonnet-4-20250514",
    instructions="Você pesquisa informações na web e em bancos de dados.",
    tools=[buscar_web, consultar_banco]
)

redator = Agent(
    model="claude-sonnet-4-20250514",
    instructions="Você escreve relatórios claros e bem estruturados.",
    tools=[formatar_documento, salvar_arquivo]
)

revisor = Agent(
    model="claude-haiku-4-20250514",
    instructions="Você revisa textos buscando erros e inconsistências.",
    tools=[verificar_fatos, corrigir_texto]
)

equipe = AgentTeam(
    coordinator_model="claude-sonnet-4-20250514",
    agents=[pesquisador, redator, revisor],
    instructions="Coordene a equipe para produzir relatórios de alta qualidade."
)

resultado = equipe.run("Produza um relatório sobre o mercado de IA no Brasil em 2026")
```

O gerenciamento de memória no Claude Agent SDK funciona em camadas. A memória de curto prazo é o contexto da conversa — gerenciado automaticamente pelo SDK. Para memória de longo prazo, o SDK oferece integração com o sistema de memória nativo do Claude que persiste informações entre sessões. Para casos mais avançados, você pode implementar memória customizada usando vector stores:

```python
from claude_sdk import Agent, MemoryStore

memoria = MemoryStore(
    provider="pgvector",
    connection_string="postgresql://...",
    embedding_model="claude-embed-1"
)

agente_com_memoria = Agent(
    model="claude-sonnet-4-20250514",
    instructions="Você é um assistente pessoal que lembra de tudo.",
    tools=[...],
    memory=memoria
)
```

Para ambientes de produção, o SDK oferece observabilidade integrada. Cada execução do agente gera traces que podem ser exportados para plataformas de monitoramento. Você consegue ver exatamente quantas chamadas de ferramenta foram feitas, quanto tempo cada uma levou, quanto custou em tokens, e onde o agente tomou decisões erradas.

O Claude Agent SDK é a escolha natural quando seu projeto já usa Anthropic como provedor principal, quando precisa de computer use, ou quando a arquitetura de Agent Teams é relevante. Ele é particularmente forte em cenários que exigem raciocínio profundo e planejamento — as áreas onde os modelos Claude historicamente se destacam.

**O que levar deste capítulo:**

- O Claude Agent SDK abstrai o loop ReAct completo — você define Agent com modelo, instruções e ferramentas, e o SDK gerencia todo o ciclo de raciocínio e execução
- O decorator `@tool` transforma funções Python em ferramentas automaticamente, extraindo nome, descrição e schema dos type hints — eliminando JSON Schema manual
- Computer use permite que agentes Claude controlem o computador (mouse, teclado, screenshots) para interagir com qualquer software, mesmo sem API disponível
- Agent Teams orquestram múltiplos agentes especializados sob um coordenador, permitindo divisão de trabalho em tarefas complexas como pesquisa, redação e revisão


# OpenAI Agents SDK: Construindo Agentes com OpenAI

Quando a OpenAI lançou o Agents SDK em março de 2025, ela consolidou anos de experimentação em uma plataforma unificada. O caminho foi longo — de plugins para o ChatGPT, passando pela Assistants API, até finalmente chegar ao que deveria ter sido desde o início: um framework completo para construir agentes autônomos. O Agents SDK é opinativo, bem documentado e profundamente integrado com o ecossistema OpenAI.

O conceito central é similar ao do Claude Agent SDK, mas com nomenclatura e abstrações próprias. Um `Agent` no SDK da OpenAI encapsula um modelo, instruções, ferramentas, guardrails e handoffs (transferências entre agentes):

```python
from openai import agents

agente_suporte = agents.Agent(
    name="Suporte ao Cliente",
    instructions="""Você é um agente de suporte técnico.
    Resolva problemas do cliente usando as ferramentas disponíveis.
    Se não conseguir resolver, transfira para o agente humano.""",
    model="gpt-4o",
    tools=[buscar_ticket, atualizar_status, enviar_email]
)

resultado = agents.run(agente_suporte, "Meu pedido #4521 não chegou")
print(resultado.final_output)
```

O sistema de **function calling** da OpenAI é o mais maduro do mercado — afinal, eles inventaram o conceito. A definição de ferramentas segue o padrão JSON Schema, com suporte completo a tipos complexos, enums, arrays e objetos aninhados:

```python
from openai.agents import function_tool

@function_tool
def consultar_pedido(numero_pedido: str, incluir_historico: bool = False) -> dict:
    """Consulta o status de um pedido pelo número.

    Args:
        numero_pedido: Número do pedido (ex: #4521)
        incluir_historico: Se True, inclui todo o histórico de atualizações
    """
    # Implementação da consulta
    return {
        "numero": numero_pedido,
        "status": "Em trânsito",
        "previsao": "2026-03-22",
        "transportadora": "Correios"
    }
```

Uma funcionalidade exclusiva do Agents SDK é o sistema de **handoffs** — transferências estruturadas entre agentes. Diferente de orquestrações genéricas, handoffs permitem que um agente transfira o contexto completo da conversa para outro agente especializado, com condições explícitas:

```python
agente_vendas = agents.Agent(
    name="Vendas",
    instructions="Ajude com compras e preços.",
    model="gpt-4o",
    tools=[buscar_produto, calcular_frete]
)

agente_tecnico = agents.Agent(
    name="Suporte Técnico",
    instructions="Resolva problemas técnicos com produtos.",
    model="gpt-4o",
    tools=[diagnosticar_problema, agendar_assistencia]
)

agente_triagem = agents.Agent(
    name="Triagem",
    instructions="""Identifique se o cliente precisa de vendas ou suporte.
    Transfira para o agente apropriado.""",
    model="gpt-4o-mini",
    handoffs=[agente_vendas, agente_tecnico]
)

## O agente de triagem automaticamente transfere para o agente certo
resultado = agents.run(agente_triagem, "Meu notebook que comprei aqui não liga mais")
## -> Transferido para agente_tecnico
```

O **Codex** da OpenAI é o modelo especializado em código, e o Agents SDK tem integração nativa para agentes que precisam escrever e executar código. O agente pode gerar código, executá-lo em um sandbox seguro, verificar o resultado e iterar:

```python
agente_dados = agents.Agent(
    name="Analista de Dados",
    instructions="Analise dados usando Python. Gere visualizações quando útil.",
    model="gpt-4o",
    tools=[
        agents.CodeInterpreter(),  # Sandbox para execução de código
        agents.FileSearch(vector_store_id="vs_abc123")  # Busca em arquivos
    ]
)

resultado = agents.run(
    agente_dados,
    "Analise o CSV de vendas e me diga qual produto vendeu mais em cada região"
)
```

O **guardrails** system é uma camada de segurança integrada. Você define regras que o agente deve seguir, e o SDK valida cada ação antes de executar:

```python
from openai.agents import guardrail

@guardrail
def verificar_limite_acao(tool_call):
    """Impede ações que afetem mais de 100 registros de uma vez."""
    if tool_call.name == "atualizar_em_massa":
        if tool_call.arguments.get("limite", 0) > 100:
            return agents.GuardrailResult(
                blocked=True,
                message="Ação bloqueada: limite máximo de 100 registros por vez"
            )
    return agents.GuardrailResult(blocked=False)

agente_seguro = agents.Agent(
    name="Admin",
    model="gpt-4o",
    tools=[atualizar_em_massa, deletar_registros],
    guardrails=[verificar_limite_acao]
)
```

Para produção, o Agents SDK oferece o conceito de **Traces** — logs estruturados de cada execução do agente que incluem tokens consumidos, latência de cada passo, decisões de tool use e resultados. Esses traces podem ser visualizados no dashboard da OpenAI ou exportados para seu sistema de observabilidade.

A Assistants API, que existe desde 2023, continua disponível mas agora é posicionada como uma camada de mais baixo nível. O Agents SDK é construído sobre ela e adiciona orquestração, guardrails, handoffs e gerenciamento de estado. Para projetos novos, a recomendação da OpenAI é usar o Agents SDK diretamente.

O modelo de preços é baseado em tokens consumidos pelo modelo mais qualquer uso de ferramentas serverside (Code Interpreter, File Search). O Agents SDK em si é open-source e não tem custo adicional — você paga apenas pelo uso da API.

O Agents SDK da OpenAI é a escolha natural quando seu stack já é OpenAI, quando precisa de Code Interpreter nativo, quando o sistema de handoffs se encaixa na sua arquitetura, ou quando guardrails integrados são um requisito. A maturidade do function calling e a amplitude do ecossistema OpenAI são vantagens difíceis de ignorar.

**O que levar deste capítulo:**

- O OpenAI Agents SDK unifica a experiência de construção de agentes com abstrações como Agent, function_tool, handoffs e guardrails em um framework open-source
- Handoffs permitem transferências estruturadas entre agentes especializados com contexto completo — ideal para sistemas de atendimento com triagem e especialistas
- Code Interpreter oferece execução de código Python em sandbox seguro, tornando agentes de análise de dados e programação nativos do framework
- Guardrails integrados validam cada ação antes da execução, permitindo definir limites e políticas de segurança diretamente no agente


# LangChain e LangGraph: O Framework Mais Popular Para Agentes

Harrison Chase criou o LangChain no final de 2022 como uma biblioteca para encadear chamadas a LLMs. Menos de dois anos depois, LangChain se tornou o framework mais utilizado no mundo para construção de aplicações com IA, com mais de 90.000 estrelas no GitHub e um ecossistema de centenas de integrações. Em 2025, a evolução para LangGraph consolidou a posição: enquanto LangChain é a fundação, LangGraph é o framework de orquestração de agentes.

LangChain oferece abstrações para os componentes fundamentais de aplicações com LLM: modelos (LLMs e embeddings), prompts (templates e exemplos), output parsers (extração estruturada), retrievers (busca em documentos), e chains (sequências de operações). A flexibilidade é sua maior força e sua maior fraqueza — você pode fazer praticamente qualquer coisa, mas precisa tomar muitas decisões arquiteturais.

```python
from langchain_anthropic import ChatAnthropic
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage

@tool
def buscar_documentos(query: str) -> str:
    """Busca documentos relevantes na base de conhecimento."""
    # Implementação com vector store
    return "Documento encontrado: Política de reembolso..."

@tool
def criar_ticket(titulo: str, descricao: str, prioridade: str = "media") -> str:
    """Cria um ticket de suporte no sistema."""
    return f"Ticket #{hash(titulo) % 10000} criado com prioridade {prioridade}"

llm = ChatAnthropic(model="claude-sonnet-4-20250514")
llm_com_tools = llm.bind_tools([buscar_documentos, criar_ticket])

response = llm_com_tools.invoke([
    HumanMessage(content="Preciso de reembolso do pedido #1234")
])
```

LangGraph é onde a mágica acontece para agentes. Enquanto LangChain lida com chamadas individuais, LangGraph permite definir fluxos complexos como grafos — com nós (ações), arestas (transições) e estado compartilhado. Isso torna possível construir agentes com lógica condicional, loops, paralelismo e recuperação de erros de forma explícita e visual.

```python
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from typing import TypedDict, Annotated
from langchain_core.messages import BaseMessage
import operator

class EstadoAgente(TypedDict):
    messages: Annotated[list[BaseMessage], operator.add]
    proximo_passo: str

def raciocinar(estado: EstadoAgente) -> dict:
    """Nó de raciocínio: o LLM decide o próximo passo."""
    messages = estado["messages"]
    response = llm_com_tools.invoke(messages)
    return {"messages": [response]}

def decidir_proximo(estado: EstadoAgente) -> str:
    """Decide se continua usando tools ou finaliza."""
    ultima_mensagem = estado["messages"][-1]
    if ultima_mensagem.tool_calls:
        return "executar_tools"
    return "finalizar"

## Construir o grafo
grafo = StateGraph(EstadoAgente)
grafo.add_node("raciocinar", raciocinar)
grafo.add_node("executar_tools", ToolNode(tools=[buscar_documentos, criar_ticket]))

grafo.set_entry_point("raciocinar")
grafo.add_conditional_edges("raciocinar", decidir_proximo, {
    "executar_tools": "executar_tools",
    "finalizar": END
})
grafo.add_edge("executar_tools", "raciocinar")

agente = grafo.compile()
resultado = agente.invoke({"messages": [HumanMessage(content="Crie um ticket de suporte")]})
```

Esse padrão — grafo com nó de raciocínio, nó de execução de ferramentas e arestas condicionais — é o "agente ReAct" implementado como grafo. Mas LangGraph vai muito além disso. Você pode criar grafos com múltiplos agentes, sub-grafos, nós humanos (para aprovação), checkpoints (para persistência) e muito mais.

O sistema de **RAG (Retrieval-Augmented Generation)** é onde LangChain realmente brilha. RAG permite que agentes consultem bases de conhecimento externas — documentos, PDFs, bancos de dados — para fundamentar suas respostas em fatos reais:

```python
from langchain_community.vectorstores import FAISS
from langchain_anthropic import AnthropicEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader

## Carregar e processar documentos
loader = PyPDFLoader("manual_produto.pdf")
documentos = loader.load()

splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
chunks = splitter.split_documents(documentos)

## Criar vector store
embeddings = AnthropicEmbeddings(model="claude-embed-1")
vectorstore = FAISS.from_documents(chunks, embeddings)

## Criar retriever como ferramenta
retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

@tool
def buscar_manual(pergunta: str) -> str:
    """Busca informações no manual do produto."""
    docs = retriever.invoke(pergunta)
    return "\n\n".join([doc.page_content for doc in docs])
```

**LangSmith** é a plataforma de observabilidade do ecossistema LangChain. Ela registra cada execução, cada chamada de LLM, cada uso de ferramenta, com latências, custos e resultados. Para depurar agentes em produção — entender por que um agente tomou uma decisão errada, por que demorou, por que custou mais do que deveria — LangSmith é essencial.

O ecossistema LangChain tem integrações com praticamente tudo: mais de 80 provedores de LLM, 50+ vector stores, dezenas de document loaders, e integrações com ferramentas como Slack, Gmail, GitHub, Notion, bancos SQL e NoSQL. Essa amplitude é o que torna LangChain a escolha padrão para equipes que precisam de flexibilidade e não querem ficar locked-in em um único provedor.

A crítica mais comum ao LangChain é a complexidade de abstrações. Para quem está começando, a quantidade de classes, interfaces e padrões pode ser intimidante. O LangGraph ajuda parcialmente ao dar uma estrutura visual e explícita ao fluxo do agente, mas a curva de aprendizado continua sendo mais íngreme que frameworks mais opinativos como CrewAI.

**O que levar deste capítulo:**

- LangChain fornece os blocos fundamentais (modelos, tools, retrievers, parsers) enquanto LangGraph fornece a orquestração de agentes como grafos com nós, arestas e estado compartilhado
- Agentes em LangGraph são grafos explícitos com nós de raciocínio, nós de execução de ferramentas e arestas condicionais — tornando o fluxo visível e depurável
- RAG (Retrieval-Augmented Generation) com vector stores permite que agentes consultem bases de conhecimento externas para fundamentar respostas em fatos reais
- O ecossistema LangChain tem 80+ integrações de LLM e 50+ vector stores, oferecendo máxima flexibilidade ao custo de uma curva de aprendizado mais íngreme


# CrewAI: Orquestração de Múltiplos Agentes com Papéis Especializados

Imagine uma empresa onde cada funcionário tem um papel claro, habilidades específicas, e sabe exatamente como colaborar com os colegas para entregar resultados. Agora imagine replicar essa estrutura com agentes de IA. É exatamente isso que o CrewAI faz — e faz excepcionalmente bem.

Criado por João Moura, um brasileiro, o CrewAI se tornou um dos frameworks mais populares para orquestração multi-agente. Sua proposta é simples e poderosa: você define Agents (com papéis e competências), Tasks (com objetivos e critérios de sucesso), e Crews (equipes que coordenam agentes para completar tarefas). A metáfora organizacional torna o framework intuitivo mesmo para quem não é engenheiro.

```python
from crewai import Agent, Task, Crew, Process

## Definir agentes com papéis claros
pesquisador = Agent(
    role="Pesquisador de Mercado",
    goal="Encontrar dados atualizados e confiáveis sobre o mercado-alvo",
    backstory="""Você é um pesquisador experiente com 10 anos de experiência
    em análise de mercado. Você é meticuloso com fontes e sempre busca
    dados quantitativos para fundamentar suas conclusões.""",
    tools=[buscar_web, acessar_apis_dados, ler_relatorios],
    llm="claude-sonnet-4-20250514",
    verbose=True
)

analista = Agent(
    role="Analista de Dados",
    goal="Transformar dados brutos em insights acionáveis",
    backstory="""Você é um analista de dados sênior especializado em
    visualização e interpretação de dados de mercado. Você transforma
    números em narrativas claras.""",
    tools=[executar_python, gerar_graficos, calcular_metricas],
    llm="claude-sonnet-4-20250514"
)

redator = Agent(
    role="Redator de Relatórios",
    goal="Produzir relatórios executivos claros e persuasivos",
    backstory="""Você é um redator corporativo que transforma análises
    complexas em documentos que executivos C-level conseguem entender
    e agir em 5 minutos de leitura.""",
    tools=[formatar_documento, gerar_pdf],
    llm="claude-sonnet-4-20250514"
)
```

Repare no campo `backstory`. Ele é uma das inovações do CrewAI — ao dar um contexto narrativo ao agente, o LLM assume o papel de forma mais consistente e realista. Um agente com backstory de "analista sênior com 10 anos de experiência" se comporta diferente de um agente sem contexto. Ele é mais criterioso, cita fontes, e questiona dados inconsistentes.

As Tasks definem o trabalho a ser feito, com especificações claras de objetivo, critérios de aceitação e dependências:

```python
tarefa_pesquisa = Task(
    description="""Pesquise o mercado de agentes de IA no Brasil em 2026.
    Encontre: tamanho do mercado, principais players, taxa de crescimento,
    segmentos mais promissores e barreiras de adoção.
    Use pelo menos 5 fontes diferentes e priorizse dados quantitativos.""",
    expected_output="""Relatório de pesquisa com dados estruturados:
    - Tamanho do mercado em R$
    - Lista de top 10 players com market share
    - Taxa de crescimento YoY
    - Top 3 segmentos por receita
    - Top 3 barreiras de adoção""",
    agent=pesquisador
)

tarefa_analise = Task(
    description="""Analise os dados da pesquisa de mercado.
    Identifique padrões, oportunidades e riscos.
    Gere pelo menos 3 visualizações de dados.""",
    expected_output="Análise com insights e gráficos em formato markdown",
    agent=analista,
    context=[tarefa_pesquisa]  # Depende da tarefa de pesquisa
)

tarefa_relatorio = Task(
    description="""Produza um relatório executivo de 2 páginas
    combinando a pesquisa e a análise.
    Inclua sumário executivo, dados-chave, recomendações e próximos passos.""",
    expected_output="Relatório executivo em PDF pronto para apresentação",
    agent=redator,
    context=[tarefa_pesquisa, tarefa_analise],
    output_file="relatorio_mercado_agentes_2026.pdf"
)
```

A Crew junta tudo — agentes e tarefas — e define como a execução acontece:

```python
equipe = Crew(
    agents=[pesquisador, analista, redator],
    tasks=[tarefa_pesquisa, tarefa_analise, tarefa_relatorio],
    process=Process.sequential,  # Executa tarefas em ordem
    verbose=True
)

resultado = equipe.kickoff()
print(resultado)
```

O CrewAI suporta dois modos de processo. O `sequential` executa tarefas na ordem definida — cada agente completa sua tarefa antes do próximo começar. O `hierarchical` adiciona um agente gerente que coordena os demais, decidindo dinamicamente quem faz o quê e quando. O modo hierárquico é mais flexível mas consome mais tokens.

```python
equipe_hierarquica = Crew(
    agents=[pesquisador, analista, redator],
    tasks=[tarefa_pesquisa, tarefa_analise, tarefa_relatorio],
    process=Process.hierarchical,
    manager_llm="claude-opus-4-20250514",  # Modelo mais capaz para o gerente
    verbose=True
)
```

O sistema de **delegação** permite que agentes peçam ajuda uns aos outros. Se o pesquisador encontra dados que precisa de análise estatística, ele pode delegar ao analista sem intervenção manual. Isso cria interações emergentes entre agentes que muitas vezes produzem resultados melhores do que uma sequência rígida:

```python
pesquisador = Agent(
    role="Pesquisador de Mercado",
    goal="Encontrar dados atualizados sobre o mercado-alvo",
    backstory="...",
    tools=[buscar_web],
    allow_delegation=True  # Permite delegar para outros agentes
)
```

O CrewAI também oferece **Flows** — uma camada de orquestração acima das Crews que permite encadear múltiplas Crews em pipelines complexos. Um Flow pode ter uma Crew de coleta de dados, seguida por uma Crew de análise, seguida por uma Crew de geração de relatórios, com lógica condicional entre elas.

Para memória, o CrewAI tem três tipos integrados: short-term (contexto da execução atual), long-term (persiste entre execuções usando embeddings) e entity memory (fatos sobre entidades específicas mencionadas durante a execução). A memória de longo prazo permite que a Crew melhore ao longo do tempo — se uma abordagem funcionou bem antes, ela é priorizada em execuções futuras.

A principal vantagem do CrewAI sobre alternativas é a simplicidade conceitual. Se você consegue descrever o trabalho como "uma equipe de especialistas colaborando em tarefas", o CrewAI é provavelmente o framework certo. Ele abstrai a complexidade de orquestração multi-agente em um modelo mental que qualquer pessoa entende.

**O que levar deste capítulo:**

- CrewAI modela agentes como funcionários com papéis (role), objetivos (goal) e histórico (backstory), tarefas com critérios claros de sucesso, e equipes que coordenam a execução
- O campo backstory dá contexto narrativo que faz o LLM assumir papéis de forma mais consistente — um "analista sênior de 10 anos" se comporta diferente de um agente genérico
- Modos sequential e hierarchical oferecem trade-offs entre previsibilidade e flexibilidade, com delegação entre agentes permitindo colaboração emergente
- Flows permitem encadear múltiplas Crews em pipelines complexos com lógica condicional, e memória de longo prazo permite que equipes melhorem entre execuções


# AutoGen: Agentes Conversacionais que Colaboram Entre Si

A Microsoft Research publicou o paper do AutoGen em setembro de 2023, propondo uma abordagem radicalmente diferente para multi-agente: em vez de orquestração top-down onde um coordenador distribui tarefas, o AutoGen implementa agentes que conversam entre si para resolver problemas. A colaboração emerge da conversa, não de um plano predefinido.

O insight fundamental do AutoGen é que a conversação é o mecanismo de coordenação mais natural e flexível que existe. Quando dois humanos colaboram em um problema, eles não seguem um script rígido — eles conversam, questionam, sugerem, corrigem e iteram. O AutoGen replica esse padrão: agentes trocam mensagens em uma conversa estruturada, e dessa interação emergem soluções que nenhum agente individual produziria.

Em 2025, o AutoGen passou por uma reescrita significativa (AutoGen 0.4+), adotando uma arquitetura baseada em atores (actor model) mais robusta e escalável. A nova versão — frequentemente chamada de AG2 pela comunidade — mantém a filosofia conversacional mas com melhor performance e extensibilidade.

```python
from autogen import ConversableAgent, UserProxyAgent

## Agente programador
programador = ConversableAgent(
    name="Programador",
    system_message="""Você é um programador Python experiente.
    Escreva código limpo, testado e bem documentado.
    Sempre inclua tratamento de erros.
    Quando receber feedback, corrija o código e reenvie.""",
    llm_config={"model": "gpt-4o", "temperature": 0}
)

## Agente revisor
revisor = ConversableAgent(
    name="Revisor",
    system_message="""Você é um code reviewer rigoroso.
    Analise o código quanto a: bugs, performance, segurança,
    legibilidade e boas práticas.
    Dê feedback específico e acionável.
    Quando o código estiver satisfatório, responda APROVADO.""",
    llm_config={"model": "gpt-4o", "temperature": 0}
)

## Proxy que executa código localmente
executor = UserProxyAgent(
    name="Executor",
    human_input_mode="NEVER",
    code_execution_config={"work_dir": "workspace", "use_docker": True}
)
```

A interação acontece como uma conversa real entre os agentes:

```python
## Iniciar conversa entre programador e revisor
resultado = revisor.initiate_chat(
    programador,
    message="""Escreva uma função Python que:
    1. Receba uma URL de API
    2. Faça requisições com retry e backoff exponencial
    3. Trate erros HTTP (4xx, 5xx) de forma diferenciada
    4. Retorne os dados parseados ou raise exceção específica""",
    max_turns=6  # Máximo de 6 turnos de conversa
)
```

O que acontece internamente é fascinante. O programador escreve a primeira versão do código. O revisor analisa e aponta problemas — "Falta tratamento para timeout", "O backoff deveria ser configurável". O programador corrige e reenvia. O revisor encontra mais um issue — "O retry não deveria acontecer para 4xx". O programador corrige novamente. O revisor finalmente responde "APROVADO". O código final é melhor do que qualquer um dos agentes produziria sozinho.

O **GroupChat** permite conversas com múltiplos agentes, com um gerenciador que decide quem fala a seguir:

```python
from autogen import GroupChat, GroupChatManager

arquiteto = ConversableAgent(
    name="Arquiteto",
    system_message="Você projeta a arquitetura do sistema.",
    llm_config={"model": "claude-sonnet-4-20250514"}
)

programador = ConversableAgent(
    name="Programador",
    system_message="Você implementa o código.",
    llm_config={"model": "gpt-4o"}
)

testador = ConversableAgent(
    name="Testador",
    system_message="Você escreve e executa testes.",
    llm_config={"model": "gpt-4o"}
)

## Criar chat em grupo
grupo = GroupChat(
    agents=[arquiteto, programador, testador],
    messages=[],
    max_round=12,
    speaker_selection_method="auto"  # LLM decide quem fala
)

gerente = GroupChatManager(
    groupchat=grupo,
    llm_config={"model": "claude-sonnet-4-20250514"}
)

## Iniciar a conversa do grupo
arquiteto.initiate_chat(
    gerente,
    message="Projete e implemente uma API REST para gerenciamento de tarefas"
)
```

O `speaker_selection_method="auto"` é onde o gerente (também um LLM) decide dinamicamente qual agente deve falar a seguir, baseado no contexto da conversa. Isso cria uma dinâmica natural — quando o arquiteto termina o design, o gerente chama o programador; quando o programador termina o código, o gerente chama o testador; quando o testador encontra um bug, o gerente chama o programador de volta.

Uma funcionalidade poderosa do AutoGen é a execução de código. O `UserProxyAgent` pode executar código Python em um ambiente seguro (preferencialmente Docker) e retornar o output. Isso permite que agentes programadores não apenas escrevam código, mas testem iterativamente até funcionar:

```python
executor = UserProxyAgent(
    name="Executor",
    human_input_mode="NEVER",
    code_execution_config={
        "work_dir": "workspace",
        "use_docker": True,
        "timeout": 60
    },
    max_consecutive_auto_reply=10
)

## O executor roda o código e retorna o resultado
## Se der erro, o programador pode corrigir e tentar novamente
```

O campo `human_input_mode` controla se o agente pede aprovação humana. "ALWAYS" pede confirmação a cada passo, "TERMINATE" pede apenas na conclusão, e "NEVER" roda totalmente autônomo. Para produção, "TERMINATE" é geralmente o equilíbrio certo — autonomia na execução com aprovação humana no resultado final.

O AutoGen se destaca em cenários onde a qualidade emerge da iteração — code review, brainstorming, análise adversarial, e qualquer tarefa onde múltiplas perspectivas melhoram o resultado. Ele é menos adequado para tarefas simples e sequenciais onde o overhead de conversação entre agentes não se justifica.

A desvantagem principal é o custo de tokens. Cada turno de conversa entre agentes consome tokens de todos os agentes envolvidos. Um GroupChat de 4 agentes com 12 turnos pode facilmente consumir 100K+ tokens. O design cuidadoso de `max_turns`, `max_round` e critérios de terminação é essencial para manter custos controlados.

**O que levar deste capítulo:**

- AutoGen implementa colaboração multi-agente via conversação — agentes trocam mensagens e a solução emerge da interação, sem orquestração rígida
- GroupChat com speaker_selection_method="auto" cria dinâmicas naturais onde um LLM gerente decide qual agente fala a seguir baseado no contexto
- Execução de código via UserProxyAgent em Docker permite que agentes programadores testem iterativamente até o código funcionar
- O custo em tokens é significativo (conversas multi-agente consomem tokens de todos os participantes), exigindo controle cuidadoso de max_turns e critérios de terminação


# OpenClaw: Agente Open-Source com 100+ Skills e 50+ Integrações

Enquanto os grandes frameworks focam em dar a você as ferramentas para construir agentes do zero, o OpenClaw toma uma abordagem diferente: ele é um agente pronto, extensível e open-source com mais de 100 skills pré-construídas e 50+ integrações com serviços populares. Em vez de perguntar "como construo um agente?", o OpenClaw pergunta "que tipo de agente você quer rodar agora?"

O OpenClaw nasceu da observação de que a maioria dos desenvolvedores não precisa reinventar a roda. 90% dos agentes em produção fazem variações das mesmas tarefas: buscar informações, processar documentos, enviar notificações, interagir com APIs, automatizar fluxos de trabalho. O OpenClaw empacota essas capacidades como skills modulares que podem ser compostas, configuradas e estendidas.

A arquitetura é baseada em três conceitos: Skills (capacidades individuais), Integrations (conexões com serviços externos) e Agents (composições de skills e integrations com instruções específicas).

```yaml
## Definição de um agente OpenClaw
agent:
  name: "assistente-comercial"
  model: "claude-sonnet-4"
  instructions: |
    Você é o assistente comercial da empresa.
    Monitore emails de clientes, responda perguntas frequentes,
    atualize o CRM e escale para humanos quando necessário.

  skills:
    - email/read
    - email/send
    - email/classify
    - crm/search_contact
    - crm/update_contact
    - crm/create_deal
    - knowledge/search
    - notification/slack

  integrations:
    gmail:
      credentials: "${GMAIL_OAUTH}"
    hubspot:
      api_key: "${HUBSPOT_KEY}"
    slack:
      webhook: "${SLACK_WEBHOOK}"
    pinecone:
      api_key: "${PINECONE_KEY}"
      index: "base-conhecimento"

  triggers:
    - type: email
      filter: "label:inbox is:unread"
      interval: "5m"
    - type: cron
      schedule: "0 9 * * 1-5"
      action: "gerar_relatorio_semanal"
```

Cada skill é uma unidade autocontida com documentação, testes e tratamento de erros. A skill `email/classify`, por exemplo, usa o LLM para classificar emails em categorias (suporte, vendas, spam, urgente) e rotear para o tratamento correto. A skill `crm/create_deal` valida os dados, cria o deal no CRM e retorna a confirmação. Você não precisa implementar nada disso — basta conectar as credenciais.

O sistema de integrações do OpenClaw é construído sobre o MCP (Model Context Protocol), o que significa que qualquer servidor MCP existente pode ser usado como integração. Com mais de 3.000 servidores MCP disponíveis na comunidade, a cobertura é vasta: desde ferramentas de produtividade (Google Workspace, Microsoft 365, Notion) até bancos de dados (PostgreSQL, MongoDB), passando por plataformas de cloud (AWS, GCP, Azure) e serviços de terceiros (Stripe, Twilio, SendGrid).

```python
from openclaw import Agent, Skill

## Criando uma skill customizada
class AnalisarSentimento(Skill):
    name = "analyze_sentiment"
    description = "Analisa o sentimento de um texto (positivo, negativo, neutro)"

    def execute(self, text: str) -> dict:
        # Usa o LLM do agente para análise
        resultado = self.llm.analyze(
            f"Classifique o sentimento: {text}",
            output_schema={"sentimento": "str", "confianca": "float"}
        )
        return resultado

## Usar a skill no agente
agente = Agent.from_config("assistente-comercial")
agente.add_skill(AnalisarSentimento())
agente.run()
```

A criação de skills customizadas segue uma interface simples: nome, descrição, e método `execute`. O OpenClaw cuida de registrar a skill como ferramenta para o LLM, gerenciar o ciclo de vida, tratar erros e logar resultados.

O sistema de **triggers** permite que agentes reajam a eventos automaticamente. Triggers de email monitoram caixas de entrada. Triggers de webhook recebem notificações de serviços externos. Triggers de cron executam tarefas em horários programados. Triggers de banco de dados reagem a mudanças em tabelas. Isso transforma agentes de "ferramentas que você chama" em "assistentes que trabalham proativamente".

Para deploy, o OpenClaw oferece múltiplas opções. Você pode rodar localmente para desenvolvimento, em um container Docker para testes, ou em produção usando a infraestrutura gerenciada do OpenClaw Cloud ou seu próprio Kubernetes. O agente empacota tudo que precisa: código, configuração, credenciais (criptografadas) e estado.

```bash
## Deploy local
openclaw run assistente-comercial

## Deploy em Docker
openclaw build assistente-comercial
docker run -d openclaw/assistente-comercial

## Deploy em produção
openclaw deploy assistente-comercial --target production
```

O dashboard do OpenClaw mostra métricas em tempo real: quantas tarefas o agente executou, taxa de sucesso, tempo médio de resposta, tokens consumidos, custo total. Alertas automáticos notificam quando o agente falha repetidamente ou quando o custo ultrapassa um limite definido.

O OpenClaw é ideal para quem quer colocar agentes em produção rapidamente sem construir infraestrutura do zero. A comunidade ativa contribui regularmente com novas skills e integrações, e a arquitetura modular permite customização sem forkar o projeto inteiro. Para equipes pequenas que precisam de resultados rápidos, o OpenClaw é frequentemente a melhor escolha.

A limitação é que agentes altamente customizados ou com lógica muito específica podem encontrar os limites das abstrações do framework. Para esses casos, LangGraph ou o Claude Agent SDK oferecem mais controle. A escolha não é exclusiva — muitos projetos usam OpenClaw para agentes padronizados e LangGraph para agentes que precisam de lógica customizada.

**O que levar deste capítulo:**

- OpenClaw oferece 100+ skills pré-construídas e 50+ integrações prontas — em vez de construir do zero, você compõe agentes a partir de capacidades existentes
- Skills customizadas seguem uma interface simples (nome, descrição, execute) e são automaticamente registradas como ferramentas para o LLM
- O sistema de triggers (email, webhook, cron, banco de dados) transforma agentes de ferramentas passivas em assistentes proativos que reagem a eventos
- A arquitetura baseada em MCP permite usar qualquer servidor MCP como integração, aproveitando o ecossistema de 3.000+ servidores da comunidade


# MCP: O Protocolo Universal Para Conectar Agentes a Ferramentas

Durante anos, cada framework de agentes inventou seu próprio formato para definir e conectar ferramentas. LangChain tinha Tools. AutoGen tinha Functions. CrewAI tinha Tools com sintaxe própria. O resultado era previsível: se você construía uma integração para LangChain, precisava reconstruir para CrewAI. Se trocava de framework, reescrevia todas as integrações. Era o mesmo problema que a web tinha antes do HTTP — cada sistema falava sua própria língua.

O Model Context Protocol (MCP), criado pela Anthropic e lançado em novembro de 2024, resolve esse problema ao definir um protocolo aberto e padronizado para conectar agentes de IA a fontes de dados e ferramentas. MCP é para agentes o que HTTP é para a web: uma linguagem comum que permite interoperabilidade universal.

O MCP define três conceitos fundamentais: **Resources** (fontes de dados que o agente pode ler), **Tools** (ações que o agente pode executar) e **Prompts** (templates de instruções que o servidor oferece ao cliente). A comunicação acontece via JSON-RPC entre um MCP Client (o agente) e MCP Servers (os provedores de ferramentas).

```
[Agente/LLM]
     ↕ (MCP Protocol)
[MCP Client]
     ↕ (JSON-RPC via stdio/SSE)
[MCP Server: GitHub]    [MCP Server: PostgreSQL]    [MCP Server: Slack]
     ↕                        ↕                          ↕
[GitHub API]            [PostgreSQL DB]             [Slack API]
```

Um MCP Server é um programa que implementa o protocolo MCP e expõe ferramentas específicas. Aqui está um exemplo de servidor MCP para um sistema de CRM:

```python
from mcp.server import Server
from mcp.types import Tool, TextContent

server = Server("crm-server")

@server.tool()
async def buscar_cliente(email: str) -> str:
    """Busca informações de um cliente pelo email no CRM.

    Retorna: nome, empresa, plano, data de cadastro e histórico resumido.
    """
    cliente = await db.query("SELECT * FROM clientes WHERE email = $1", email)
    if not cliente:
        return f"Cliente com email {email} não encontrado"
    return f"""
    Nome: {cliente.nome}
    Empresa: {cliente.empresa}
    Plano: {cliente.plano}
    Desde: {cliente.created_at}
    Interações: {cliente.total_interacoes}
    """

@server.tool()
async def criar_oportunidade(
    cliente_email: str,
    valor: float,
    produto: str,
    notas: str = ""
) -> str:
    """Cria uma nova oportunidade de venda no CRM.

    Args:
        cliente_email: Email do cliente existente
        valor: Valor estimado da oportunidade em R$
        produto: Nome do produto/serviço
        notas: Observações adicionais
    """
    opp = await db.insert("oportunidades", {
        "cliente_email": cliente_email,
        "valor": valor,
        "produto": produto,
        "notas": notas,
        "status": "nova"
    })
    return f"Oportunidade #{opp.id} criada: {produto} - R$ {valor:,.2f}"

@server.resource("crm://metricas/dashboard")
async def metricas_dashboard() -> str:
    """Métricas atuais do CRM: pipeline, conversão, receita."""
    metricas = await db.query("SELECT * FROM v_metricas_dashboard")
    return json.dumps(metricas, indent=2)

## Executar servidor via stdio (comunicação padrão)
if __name__ == "__main__":
    server.run(transport="stdio")
```

Do lado do cliente, a configuração é feita em um arquivo JSON que lista os servidores disponíveis:

```json
{
  "mcpServers": {
    "crm": {
      "command": "python",
      "args": ["mcp_servers/crm_server.py"],
      "env": {
        "DATABASE_URL": "postgresql://..."
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_..."
      }
    },
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-..."
      }
    }
  }
}
```

O ecossistema MCP cresceu explosivamente. Em março de 2026, existem mais de 3.000 servidores MCP públicos cobrindo praticamente todos os serviços populares: GitHub, GitLab, Jira, Notion, Google Workspace, AWS, Supabase, Stripe, Twilio, e centenas de outros. Muitos desses servidores são mantidos oficialmente pelas próprias empresas donas dos serviços.

A grande vantagem do MCP sobre integrações customizadas é a **portabilidade**. Um servidor MCP para PostgreSQL funciona com qualquer cliente MCP — Claude Desktop, Cursor, VS Code com Continue, LangChain, OpenClaw, ou seu agente customizado. Você constrói a integração uma vez e ela funciona em todo lugar.

O MCP suporta dois transportes: **stdio** (comunicação via standard input/output, ideal para servidores locais) e **SSE** (Server-Sent Events, ideal para servidores remotos acessíveis via HTTP). O transporte SSE permite que servidores MCP rodem em qualquer lugar — na nuvem, em um servidor compartilhado, como um microserviço — e sejam consumidos por múltiplos clientes simultaneamente.

```python
## Servidor MCP remoto via SSE
from mcp.server import Server
from mcp.transports.sse import SseServerTransport

server = Server("crm-remoto")
## ... definir tools e resources ...

transport = SseServerTransport("/mcp")
server.run(transport=transport, port=8080)
```

A segurança do MCP é baseada em **princípio do menor privilégio**. Cada servidor MCP expõe apenas as ferramentas e dados que foram explicitamente definidos. O servidor de GitHub não tem acesso ao banco de dados. O servidor de email não tem acesso ao GitHub. Isso cria uma separação clara de responsabilidades que é fundamental para agentes em produção.

Para quem está construindo agentes hoje, a recomendação é clara: use MCP para todas as integrações. Não construa integrações customizadas acopladas a um framework específico. O custo de implementar um servidor MCP é marginalmente maior do que uma integração direta, mas o benefício de portabilidade e reusabilidade é enorme.

**O que levar deste capítulo:**

- MCP (Model Context Protocol) é o protocolo aberto que padroniza como agentes se conectam a ferramentas e dados, eliminando a necessidade de integrações específicas por framework
- Um MCP Server expõe Resources (dados), Tools (ações) e Prompts (templates) via JSON-RPC — e funciona com qualquer cliente MCP (Claude, Cursor, LangChain, etc.)
- O ecossistema tem 3.000+ servidores públicos cobrindo GitHub, Slack, Google Workspace, AWS, bancos de dados e dezenas de outros serviços
- Transportes stdio (local) e SSE (remoto via HTTP) permitem que servidores MCP rodem tanto localmente quanto na nuvem como microserviços compartilhados


# Memória Para Agentes: Short-Term, Long-Term, Vector Stores, RAG

Um agente sem memória é como um funcionário com amnésia anterógrada — brilhante no momento, mas incapaz de acumular experiência. Toda manhã, começa do zero. Não lembra das preferências do cliente, não sabe que já tentou uma abordagem que falhou, não consegue conectar informações de conversas passadas. Para agentes em produção, memória não é um luxo — é o que transforma uma ferramenta em um assistente genuinamente útil.

A memória de curto prazo é a janela de contexto do LLM. Tudo que está na conversa atual — a mensagem do usuário, as respostas anteriores, os resultados de ferramentas, o pensamento intermediário do agente — ocupa espaço nessa janela. O Claude tem 200K tokens de contexto, o GPT-4o tem 128K, o Gemini 2 tem até 2M. Quando o contexto enche, informações antigas precisam ser removidas ou resumidas.

O gerenciamento inteligente da janela de contexto é uma habilidade fundamental em engenharia de agentes. As estratégias mais comuns são:

**Truncamento**: remover mensagens antigas quando o contexto está cheio. Simples mas arriscado — informações importantes do início da conversa são perdidas.

**Resumo progressivo**: quando o contexto atinge um limiar, o LLM resume as mensagens antigas em um parágrafo condensado e substitui as mensagens originais pelo resumo. Isso preserva informação essencial com uso mínimo de tokens.

```python
def gerenciar_contexto(messages: list, max_tokens: int = 100000) -> list:
    tokens_atuais = contar_tokens(messages)

    if tokens_atuais > max_tokens:
        # Separar mensagens antigas das recentes
        ponto_corte = len(messages) // 2
        mensagens_antigas = messages[:ponto_corte]
        mensagens_recentes = messages[ponto_corte:]

        # Resumir mensagens antigas
        resumo = llm.invoke(f"""Resuma as seguintes mensagens mantendo:
        - Decisões tomadas
        - Fatos relevantes mencionados
        - Preferências do usuário
        - Status de tarefas em andamento

        Mensagens: {mensagens_antigas}""")

        return [{"role": "system", "content": f"Resumo do contexto anterior: {resumo}"}] + mensagens_recentes

    return messages
```

**Janela deslizante com âncoras**: manter as N mensagens mais recentes mais mensagens "âncora" que contêm informações críticas (instruções do sistema, preferências do usuário, estado de tarefas).

A memória de longo prazo persiste entre sessões. Quando o agente precisa lembrar de algo que aconteceu semanas atrás, ele consulta a memória de longo prazo. A implementação mais comum usa vector stores — bancos de dados especializados em armazenar e buscar vetores de embedding.

O processo funciona assim: textos são convertidos em vetores numéricos (embeddings) que capturam o significado semântico. Textos com significados similares ficam próximos no espaço vetorial. Quando o agente precisa recuperar uma informação, a consulta é convertida em vetor e os vetores mais próximos (mais semanticamente similares) são retornados.

```python
from langchain_community.vectorstores import Chroma
from langchain_anthropic import AnthropicEmbeddings

embeddings = AnthropicEmbeddings(model="claude-embed-1")

## Criar ou conectar ao vector store
memoria_longo_prazo = Chroma(
    persist_directory="./memoria_agente",
    embedding_function=embeddings,
    collection_name="interacoes"
)

## Salvar uma memória
memoria_longo_prazo.add_texts(
    texts=["O cliente João prefere ser contatado por email, não por telefone"],
    metadatas=[{"tipo": "preferencia", "cliente": "joao", "data": "2026-03-15"}]
)

## Recuperar memórias relevantes
resultados = memoria_longo_prazo.similarity_search(
    "Como devo contatar o João?",
    k=3  # Retornar os 3 resultados mais relevantes
)
## -> "O cliente João prefere ser contatado por email, não por telefone"
```

Os vector stores mais populares em 2026 são **Pinecone** (gerenciado, escalável, caro), **Weaviate** (open-source, rico em features), **pgvector** (extensão PostgreSQL — ideal se você já usa Postgres), **Chroma** (leve, ótimo para desenvolvimento), e **Qdrant** (open-source, rápido). A escolha depende do volume de dados, latência requerida e se você quer gerenciar infraestrutura.

**RAG (Retrieval-Augmented Generation)** é o padrão arquitetural que combina memória de longo prazo com geração de LLM. Em vez de confiar apenas no conhecimento interno do modelo (que pode estar desatualizado ou ser genérico demais), o agente primeiro busca informações relevantes na base de conhecimento e então gera a resposta usando esses fatos como contexto.

O pipeline RAG completo tem estas etapas:

```
1. INGESTÃO: Documentos → Chunks → Embeddings → Vector Store
2. BUSCA: Query do usuário → Embedding → Busca por similaridade → Chunks relevantes
3. GERAÇÃO: Chunks + Query → LLM → Resposta fundamentada
```

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import DirectoryLoader

## 1. INGESTÃO
loader = DirectoryLoader("./documentos/", glob="**/*.pdf")
documentos = loader.load()

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\n\n", "\n", ". ", " "]
)
chunks = splitter.split_documents(documentos)

vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./base_conhecimento"
)

## 2 e 3. BUSCA + GERAÇÃO (como ferramenta do agente)
@tool
def consultar_base(pergunta: str) -> str:
    """Consulta a base de conhecimento da empresa."""
    docs_relevantes = vectorstore.similarity_search(pergunta, k=5)
    contexto = "\n\n".join([doc.page_content for doc in docs_relevantes])

    resposta = llm.invoke(f"""Com base nos seguintes documentos:

    {contexto}

    Responda: {pergunta}

    Use APENAS informações dos documentos. Se a informação não estiver
    nos documentos, diga que não encontrou.""")

    return resposta
```

A memória episódica é o tipo mais sofisticado. Ela registra não apenas fatos, mas experiências completas — sequências de ações, resultados e lições aprendidas. Quando o agente encontra uma situação similar a uma experiência passada, ele pode consultar a memória episódica para evitar erros e reutilizar estratégias que funcionaram.

```python
class MemoriaEpisodica:
    def __init__(self, vectorstore):
        self.vectorstore = vectorstore

    def registrar_episodio(self, tarefa: str, acoes: list, resultado: str, sucesso: bool):
        episodio = f"""
        TAREFA: {tarefa}
        AÇÕES TOMADAS: {' -> '.join(acoes)}
        RESULTADO: {resultado}
        SUCESSO: {'Sim' if sucesso else 'Não'}
        LIÇÃO: {'Abordagem eficaz, reutilizar' if sucesso else 'Evitar esta abordagem'}
        """
        self.vectorstore.add_texts(
            texts=[episodio],
            metadatas=[{"tipo": "episodio", "sucesso": sucesso}]
        )

    def buscar_experiencia(self, tarefa_atual: str) -> str:
        episodios = self.vectorstore.similarity_search(tarefa_atual, k=3)
        return "\n---\n".join([e.page_content for e in episodios])
```

A combinação dessas camadas de memória — curto prazo para o contexto imediato, longo prazo para fatos e preferências, episódica para experiências e lições — é o que permite construir agentes que genuinamente melhoram com o tempo. Cada interação torna o agente mais informado, mais eficiente e mais alinhado com as necessidades do usuário.

**O que levar deste capítulo:**

- Memória de curto prazo (janela de contexto) requer gerenciamento ativo via truncamento, resumo progressivo ou janela deslizante com âncoras para evitar perda de informação
- Vector stores (Pinecone, pgvector, Chroma, Weaviate) convertem texto em embeddings para busca semântica — a base da memória de longo prazo
- RAG combina busca em vector store com geração do LLM, permitindo que agentes respondam com base em documentos reais em vez de confiar apenas no conhecimento do modelo
- Memória episódica registra experiências completas (tarefa, ações, resultado, lição) e permite que agentes aprendam com seus próprios acertos e erros


# Agentes Para Automação: Email, Calendário, CRM, Código, Dados

Todo profissional de conhecimento gasta entre 30% e 60% do seu dia em tarefas repetitivas que poderiam ser automatizadas. Responder emails padronizados. Agendar reuniões. Atualizar CRM. Gerar relatórios. Formatar dados. Essas não são tarefas que exigem criatividade ou julgamento sofisticado — são tarefas que exigem apenas seguir padrões. E seguir padrões é exatamente o que agentes de IA fazem melhor.

Vamos construir agentes práticos para cada domínio, usando os conceitos e frameworks dos capítulos anteriores.

**Agente de Email** — Classifica, responde e encaminha emails automaticamente:

```python
from claude_sdk import Agent, tool

@tool
def ler_emails_nao_lidos() -> list[dict]:
    """Lê os emails não lidos da caixa de entrada."""
    # Integração via MCP com Gmail/Outlook
    return mcp_client.call("gmail", "list_unread")

@tool
def responder_email(email_id: str, corpo: str) -> str:
    """Responde a um email específico."""
    return mcp_client.call("gmail", "reply", {
        "email_id": email_id,
        "body": corpo
    })

@tool
def encaminhar_email(email_id: str, para: str, nota: str) -> str:
    """Encaminha um email com uma nota para um colega."""
    return mcp_client.call("gmail", "forward", {
        "email_id": email_id,
        "to": para,
        "note": nota
    })

@tool
def buscar_resposta_padrao(categoria: str) -> str:
    """Busca template de resposta padrão por categoria."""
    return vectorstore.similarity_search(f"resposta padrão para {categoria}", k=1)[0]

agente_email = Agent(
    model="claude-sonnet-4-20250514",
    instructions="""Você gerencia a caixa de entrada do usuário.

    Para cada email não lido:
    1. Classifique: suporte, vendas, parceria, spam, pessoal
    2. Se suporte: busque resposta padrão e responda
    3. Se vendas: encaminhe para vendas@empresa.com com resumo
    4. Se parceria: encaminhe para ricardo@empresa.com com nota
    5. Se spam: ignore
    6. Se pessoal: não responda, apenas classifique

    NUNCA envie emails sem confirmação em casos ambíguos.""",
    tools=[ler_emails_nao_lidos, responder_email, encaminhar_email, buscar_resposta_padrao]
)
```

**Agente de Calendário** — Gerencia agenda, encontra horários e agenda reuniões:

```python
@tool
def verificar_disponibilidade(data: str, hora_inicio: str, hora_fim: str) -> bool:
    """Verifica se um horário está livre na agenda."""
    return mcp_client.call("gcal", "check_availability", {
        "date": data, "start": hora_inicio, "end": hora_fim
    })

@tool
def criar_evento(titulo: str, data: str, hora: str, duracao: int,
                 participantes: list[str]) -> str:
    """Cria um evento no Google Calendar."""
    return mcp_client.call("gcal", "create_event", {
        "summary": titulo, "date": data, "time": hora,
        "duration_minutes": duracao, "attendees": participantes
    })

@tool
def sugerir_horarios(participantes: list[str], duracao: int,
                     periodo: str = "proxima_semana") -> list[dict]:
    """Encontra horários disponíveis para todos os participantes."""
    return mcp_client.call("gcal", "find_free_slots", {
        "attendees": participantes, "duration": duracao, "range": periodo
    })

agente_calendario = Agent(
    model="claude-sonnet-4-20250514",
    instructions="""Você gerencia a agenda do usuário.
    Quando pedirem para agendar uma reunião:
    1. Verifique disponibilidade dos participantes
    2. Sugira 3 horários possíveis
    3. Ao confirmar, crie o evento com todos os detalhes
    Priorize horários da manhã. Evite sexta-feira à tarde.""",
    tools=[verificar_disponibilidade, criar_evento, sugerir_horarios]
)
```

**Agente de CRM** — Atualiza contatos, cria oportunidades e gera relatórios:

```python
@tool
def buscar_contato(query: str) -> dict:
    """Busca um contato no CRM por nome, email ou empresa."""
    return mcp_client.call("hubspot", "search_contacts", {"query": query})

@tool
def atualizar_contato(contact_id: str, campos: dict) -> str:
    """Atualiza campos de um contato existente no CRM."""
    return mcp_client.call("hubspot", "update_contact", {
        "id": contact_id, "properties": campos
    })

@tool
def criar_oportunidade(contato_id: str, valor: float,
                       pipeline: str, estagio: str) -> str:
    """Cria uma oportunidade de venda vinculada a um contato."""
    return mcp_client.call("hubspot", "create_deal", {
        "contact_id": contato_id, "amount": valor,
        "pipeline": pipeline, "stage": estagio
    })

@tool
def gerar_relatorio_vendas(periodo: str) -> str:
    """Gera relatório de vendas com métricas do período."""
    return mcp_client.call("hubspot", "sales_report", {"period": periodo})
```

**Agente de Código** — Escreve, testa e faz debug de código:

```python
@tool
def executar_codigo(codigo: str, linguagem: str = "python") -> str:
    """Executa código em sandbox seguro e retorna o output."""
    return sandbox.execute(codigo, language=linguagem, timeout=30)

@tool
def ler_arquivo(caminho: str) -> str:
    """Lê o conteúdo de um arquivo do projeto."""
    return mcp_client.call("filesystem", "read_file", {"path": caminho})

@tool
def escrever_arquivo(caminho: str, conteudo: str) -> str:
    """Escreve conteúdo em um arquivo do projeto."""
    return mcp_client.call("filesystem", "write_file", {
        "path": caminho, "content": conteudo
    })

@tool
def rodar_testes(diretorio: str = ".") -> str:
    """Executa os testes do projeto e retorna resultados."""
    return sandbox.execute(f"cd {diretorio} && python -m pytest -v", timeout=120)

agente_dev = Agent(
    model="claude-sonnet-4-20250514",
    instructions="""Você é um desenvolvedor Python sênior.
    Quando receber uma tarefa de código:
    1. Leia os arquivos relevantes para entender o contexto
    2. Escreva o código com tratamento de erros e docstrings
    3. Escreva testes unitários
    4. Execute os testes e corrija falhas
    5. Só reporte conclusão quando TODOS os testes passarem""",
    tools=[executar_codigo, ler_arquivo, escrever_arquivo, rodar_testes]
)
```

**Agente de Dados** — Analisa datasets, gera visualizações e responde perguntas sobre dados:

```python
@tool
def consultar_sql(query: str) -> str:
    """Executa uma query SQL no banco de dados analítico."""
    return mcp_client.call("postgres", "execute_query", {"sql": query})

@tool
def gerar_grafico(dados: dict, tipo: str, titulo: str) -> str:
    """Gera um gráfico a partir de dados. Tipos: bar, line, pie, scatter."""
    codigo_plot = f"""
import matplotlib.pyplot as plt
import json
dados = json.loads('{json.dumps(dados)}')
plt.figure(figsize=(10, 6))
plt.{tipo}(dados['x'], dados['y'])
plt.title('{titulo}')
plt.savefig('/tmp/grafico.png', dpi=150, bbox_inches='tight')
print('Gráfico salvo em /tmp/grafico.png')
"""
    return sandbox.execute(codigo_plot)

agente_dados = Agent(
    model="claude-sonnet-4-20250514",
    instructions="""Você é um analista de dados.
    Quando receber perguntas sobre dados:
    1. Identifique quais tabelas e colunas são relevantes
    2. Escreva queries SQL otimizadas
    3. Analise os resultados com olhar crítico
    4. Gere visualizações quando útil
    5. Apresente insights acionáveis, não apenas números""",
    tools=[consultar_sql, gerar_grafico, executar_codigo]
)
```

O padrão que conecta todos esses agentes é o mesmo: ferramentas bem definidas, instruções claras sobre comportamento e prioridades, e um loop ReAct que permite ao agente raciocinar sobre qual ação tomar a cada passo. A composição desses agentes especializados em um sistema maior — onde o agente de email pode acionar o agente de calendário que consulta o agente de CRM — é onde a automação realmente ganha escala.

**O que levar deste capítulo:**

- Agentes de automação seguem um padrão comum: ferramentas específicas por domínio (email, calendário, CRM, código, dados) + instruções claras de comportamento + loop ReAct
- A integração via MCP permite que ferramentas sejam reutilizáveis entre agentes — o mesmo servidor MCP de email funciona para qualquer agente que precise enviar mensagens
- Agentes de código com sandbox de execução e loop de testes criam um ciclo de desenvolvimento autônomo: escrever, testar, corrigir, repetir
- A composição de agentes especializados em pipelines (email detecta oportunidade → CRM cria deal → calendário agenda reunião) é onde a automação atinge escala real


# Deploy de Agentes em Produção: Segurança, Monitoramento, Escalabilidade, Custos

A distância entre um agente que funciona no seu laptop e um agente que roda em produção servindo milhares de usuários é maior do que a maioria dos desenvolvedores imagina. Não é uma questão de "colocar na nuvem" — é uma questão de resolver dezenas de problemas que simplesmente não existem em desenvolvimento: segurança, monitoramento, escalabilidade, custos, fallbacks, rate limits, compliance, e recuperação de falhas.

**Segurança** é a preocupação número um. Um agente em produção tem acesso a ferramentas que podem causar dano real — enviar emails, modificar dados, fazer transações. O princípio fundamental é **defense in depth**: múltiplas camadas de segurança, cada uma independente das outras.

```python
## Camada 1: Autenticação e autorização
class SecurityMiddleware:
    def authorize_tool_call(self, user: User, tool: str, params: dict) -> bool:
        # Verificar se o usuário tem permissão para esta ferramenta
        if tool in RESTRICTED_TOOLS and user.role != "admin":
            return False

        # Verificar rate limits por usuário
        if self.rate_limiter.is_exceeded(user.id, tool):
            return False

        return True

## Camada 2: Validação de parâmetros
class InputValidator:
    def validate(self, tool: str, params: dict) -> bool:
        # SQL injection prevention
        if tool == "consultar_sql":
            if any(kw in params["query"].upper() for kw in ["DROP", "DELETE", "TRUNCATE"]):
                raise SecurityError("Query destrutiva bloqueada")

        # Path traversal prevention
        if tool == "ler_arquivo":
            if ".." in params["path"]:
                raise SecurityError("Path traversal detectado")

        return True

## Camada 3: Confirmação humana para ações de alto risco
HIGH_RISK_TOOLS = ["enviar_email", "deletar_dados", "fazer_pagamento"]

async def execute_with_approval(tool_call, user):
    if tool_call.name in HIGH_RISK_TOOLS:
        approval = await request_human_approval(
            user=user,
            action=f"{tool_call.name}({tool_call.params})",
            timeout=300  # 5 minutos para aprovar
        )
        if not approval:
            return "Ação cancelada pelo usuário"

    return await execute_tool(tool_call)
```

**Prompt injection** é o ataque mais relevante contra agentes. Um atacante insere instruções maliciosas em dados que o agente processa — um email, um documento, um registro de banco de dados — e o agente segue essas instruções em vez das originais. As defesas incluem:

- Separação clara entre instruções do sistema e dados do usuário
- Sanitização de inputs antes de enviar ao LLM
- Validação de outputs antes de executar ações
- Limites explícitos sobre o que o agente pode fazer, independente do que é instruído

**Monitoramento** é essencial para agentes em produção. Diferente de APIs tradicionais onde você monitora latência e erros, agentes precisam de monitoramento semântico — você precisa saber não apenas se o agente respondeu, mas se a resposta foi correta e útil.

```python
import structlog
from dataclasses import dataclass
from datetime import datetime

@dataclass
class AgentTrace:
    trace_id: str
    user_id: str
    objetivo: str
    passos: list[dict]  # Cada passo com tool_call, resultado, duração
    tokens_input: int
    tokens_output: int
    custo_total: float
    sucesso: bool
    duracao_total: float
    timestamp: datetime

class AgentMonitor:
    def __init__(self):
        self.logger = structlog.get_logger()

    def registrar_execucao(self, trace: AgentTrace):
        self.logger.info(
            "agent_execution",
            trace_id=trace.trace_id,
            objetivo=trace.objetivo,
            passos=len(trace.passos),
            tokens=trace.tokens_input + trace.tokens_output,
            custo=trace.custo_total,
            sucesso=trace.sucesso,
            duracao=trace.duracao_total
        )

        # Alertas automáticos
        if trace.custo_total > 1.0:  # Mais de R$ 1 por execução
            self.alertar("custo_alto", trace)
        if trace.duracao_total > 60:  # Mais de 60 segundos
            self.alertar("execucao_lenta", trace)
        if len(trace.passos) > 20:  # Mais de 20 passos
            self.alertar("possivel_loop", trace)
```

**Escalabilidade** para agentes tem desafios únicos. Cada execução de agente pode durar de segundos a minutos, consumir centenas de milhares de tokens, e fazer dezenas de chamadas de API externas. Isso é fundamentalmente diferente de uma API REST que responde em milissegundos.

A arquitetura recomendada para produção usa filas de mensagens (como Redis Queue, Celery, ou AWS SQS) para gerenciar execuções de agentes de forma assíncrona:

```python
from celery import Celery

app = Celery("agentes", broker="redis://localhost")

@app.task(bind=True, max_retries=3, soft_time_limit=300)
def executar_agente(self, user_id: str, objetivo: str, agente_tipo: str):
    try:
        agente = carregar_agente(agente_tipo)
        resultado = agente.run(objetivo, user_context=carregar_contexto(user_id))
        salvar_resultado(user_id, resultado)
        notificar_usuario(user_id, "Tarefa concluída")
    except SoftTimeLimitExceeded:
        notificar_usuario(user_id, "Tarefa excedeu o tempo limite")
    except Exception as e:
        self.retry(countdown=30)
```

**Custos** são o fator que mais surpreende equipes que colocam agentes em produção pela primeira vez. Um agente que parece barato em testes pode se tornar proibitivo em escala. As principais estratégias de controle de custos:

- **Escolha de modelo por tarefa**: use modelos menores (Haiku, GPT-4o Mini) para tarefas simples e modelos maiores apenas quando necessário
- **Cache de respostas**: se 40% dos usuários fazem perguntas similares, cache o resultado em vez de chamar o LLM toda vez
- **Limites de tokens por execução**: defina um teto máximo de tokens por execução do agente
- **Limites de custo por usuário**: cada usuário tem um orçamento mensal para uso de agentes
- **Monitoramento de custo em tempo real**: alertas quando o custo diário/semanal ultrapassa limiares

```python
class CostController:
    def __init__(self, max_por_execucao: float = 0.50, max_diario: float = 50.0):
        self.max_por_execucao = max_por_execucao
        self.max_diario = max_diario

    def pode_executar(self, user_id: str) -> bool:
        custo_hoje = self.get_custo_diario(user_id)
        return custo_hoje < self.max_diario

    def verificar_durante_execucao(self, trace: AgentTrace) -> bool:
        if trace.custo_total > self.max_por_execucao:
            raise CostLimitExceeded(
                f"Execução atingiu limite de R$ {self.max_por_execucao}"
            )
        return True
```

**Fallbacks e recuperação** garantem que o agente se recupere graciosamente quando algo dá errado — e em produção, algo sempre dá errado. APIs ficam fora do ar. Modelos retornam erros. Rate limits são atingidos. A resiliência do agente depende de como ele lida com cada tipo de falha.

```python
class ResilientAgent:
    def __init__(self, primary_model: str, fallback_model: str):
        self.primary = primary_model
        self.fallback = fallback_model

    async def execute(self, prompt: str) -> str:
        try:
            return await self.call_model(self.primary, prompt)
        except RateLimitError:
            await asyncio.sleep(5)
            return await self.call_model(self.primary, prompt)
        except ModelUnavailableError:
            return await self.call_model(self.fallback, prompt)
        except Exception as e:
            return f"Erro inesperado: {e}. Um humano foi notificado."
```

Produção é onde a teoria encontra a realidade. Cada decisão arquitetural — qual modelo usar, quantas ferramentas expor, quanto contexto manter, qual nível de autonomia permitir — tem consequências reais em custo, segurança e experiência do usuário. O agente perfeito em desenvolvimento pode ser inviável em produção, e o agente viável em produção pode ser imperfeito em muitas situações. A engenharia de agentes é a arte de encontrar o equilíbrio certo.

**O que levar deste capítulo:**

- Segurança de agentes exige defense in depth: autenticação, validação de inputs, confirmação humana para ações de alto risco e proteção contra prompt injection
- Monitoramento semântico vai além de latência e erros — você precisa rastrear sucesso da tarefa, custo por execução, número de passos e detectar possíveis loops
- Escalabilidade requer arquitetura assíncrona com filas de mensagens, já que execuções de agentes podem durar minutos e consumir recursos significativos
- Controle de custos é crítico e exige estratégias em múltiplas camadas: escolha de modelo por tarefa, cache, limites por execução e limites por usuário


# Casos Reais: Cinco Agentes Completos Prontos Para Adaptar

Teoria sem prática é filosofia. Prática sem teoria é acidente. Nos capítulos anteriores, construímos a base teórica e os componentes individuais. Agora vamos juntar tudo em cinco agentes completos, testados e prontos para serem adaptados ao seu contexto. Cada agente inclui arquitetura, código funcional e decisões de design explicadas.

**Agente 1: Assistente de Atendimento ao Cliente com Base de Conhecimento**

Este agente responde perguntas de clientes usando uma base de conhecimento da empresa, escala para humanos quando não sabe a resposta, e aprende com interações anteriores.

```python
from claude_sdk import Agent, tool
from langchain_community.vectorstores import Chroma
from langchain_anthropic import AnthropicEmbeddings

## Base de conhecimento
embeddings = AnthropicEmbeddings(model="claude-embed-1")
base = Chroma(persist_directory="./knowledge_base", embedding_function=embeddings)

@tool
def buscar_conhecimento(pergunta: str) -> str:
    """Busca na base de conhecimento da empresa por informações relevantes."""
    docs = base.similarity_search(pergunta, k=5)
    if not docs:
        return "NENHUM_RESULTADO: Informação não encontrada na base"
    return "\n\n---\n\n".join([
        f"[Fonte: {d.metadata.get('source', 'N/A')}]\n{d.page_content}"
        for d in docs
    ])

@tool
def registrar_ticket(
    cliente_email: str,
    categoria: str,
    descricao: str,
    prioridade: str = "media"
) -> str:
    """Cria um ticket de suporte para acompanhamento humano."""
    ticket = db.insert("tickets", {
        "email": cliente_email,
        "categoria": categoria,
        "descricao": descricao,
        "prioridade": prioridade,
        "status": "aberto"
    })
    return f"Ticket #{ticket.id} criado. O time de suporte responderá em até 24h."

@tool
def buscar_historico_cliente(email: str) -> str:
    """Busca o histórico de interações e tickets de um cliente."""
    historico = db.query("""
        SELECT data, tipo, resumo FROM interacoes
        WHERE email = %s ORDER BY data DESC LIMIT 10
    """, [email])
    if not historico:
        return "Primeira interação deste cliente"
    return "\n".join([f"[{h.data}] {h.tipo}: {h.resumo}" for h in historico])

agente_atendimento = Agent(
    model="claude-sonnet-4-20250514",
    instructions="""Você é o assistente de atendimento ao cliente da empresa.

    PROCESSO:
    1. Cumprimente o cliente pelo nome se possível
    2. Busque o histórico do cliente para contexto
    3. Busque na base de conhecimento para responder
    4. Se encontrar resposta: responda de forma clara e amigável
    5. Se NÃO encontrar: crie um ticket e informe o prazo

    REGRAS:
    - NUNCA invente informações. Use APENAS o que está na base
    - Se não tem certeza, diga que vai verificar e crie um ticket
    - Sempre pergunte se o cliente precisa de mais alguma coisa
    - Tom: profissional mas acolhedor. Sem formalidade excessiva
    - Respostas em português brasileiro""",
    tools=[buscar_conhecimento, registrar_ticket, buscar_historico_cliente]
)
```

**Agente 2: Gerador de Relatórios Automatizado com Dados Reais**

Este agente consulta bancos de dados, analisa dados, gera visualizações e produz relatórios formatados automaticamente.

```python
from crewai import Agent, Task, Crew, Process

coletor = Agent(
    role="Coletor de Dados",
    goal="Extrair dados precisos do banco de dados conforme solicitado",
    backstory="Especialista em SQL com 8 anos de experiência em analytics.",
    tools=[consultar_sql, listar_tabelas, descrever_tabela],
    llm="claude-sonnet-4-20250514"
)

analista = Agent(
    role="Analista de Dados",
    goal="Transformar dados brutos em insights acionáveis com visualizações",
    backstory="Data scientist sênior que transforma números em narrativas.",
    tools=[executar_python, gerar_grafico],
    llm="claude-sonnet-4-20250514"
)

redator = Agent(
    role="Redator de Relatórios",
    goal="Produzir relatórios executivos claros e acionáveis",
    backstory="Comunicador corporativo que faz C-levels agirem em 5 minutos.",
    tools=[formatar_markdown, gerar_pdf],
    llm="claude-sonnet-4-20250514"
)

tarefa_coleta = Task(
    description="""Extraia os seguintes dados do último mês:
    - Faturamento total e por produto
    - Número de novos clientes
    - Taxa de churn
    - Ticket médio
    - Top 10 clientes por receita""",
    expected_output="Dados estruturados em formato JSON com todas as métricas",
    agent=coletor
)

tarefa_analise = Task(
    description="""Analise os dados coletados:
    - Compare com o mês anterior (variação %)
    - Identifique tendências e anomalias
    - Gere 3 gráficos: faturamento mensal, distribuição por produto, evolução de churn
    - Liste top 3 insights acionáveis""",
    expected_output="Análise com gráficos e insights em markdown",
    agent=analista,
    context=[tarefa_coleta]
)

tarefa_relatorio = Task(
    description="""Produza relatório executivo de 1 página com:
    - Sumário executivo (3 linhas)
    - KPIs principais com variação
    - Gráficos da análise
    - 3 recomendações concretas com próximos passos""",
    expected_output="Relatório em PDF pronto para envio",
    agent=redator,
    context=[tarefa_coleta, tarefa_analise],
    output_file="relatorio_mensal.pdf"
)

crew_relatorio = Crew(
    agents=[coletor, analista, redator],
    tasks=[tarefa_coleta, tarefa_analise, tarefa_relatorio],
    process=Process.sequential
)
```

**Agente 3: Monitor de Concorrência com Alertas**

Este agente monitora sites e redes sociais de concorrentes, detecta mudanças relevantes e envia alertas.

```python
@tool
def buscar_web(query: str, num_resultados: int = 10) -> str:
    """Busca informações na web usando Google Search."""
    return mcp_client.call("web-search", "search", {
        "query": query, "num_results": num_resultados
    })

@tool
def extrair_conteudo_pagina(url: str) -> str:
    """Extrai o conteúdo textual de uma página web."""
    return mcp_client.call("web-scraper", "extract_text", {"url": url})

@tool
def comparar_com_anterior(conteudo_atual: str, fonte: str) -> str:
    """Compara conteúdo atual com a versão anterior salva."""
    anterior = db.query("SELECT conteudo FROM snapshots WHERE fonte = %s ORDER BY data DESC LIMIT 1", [fonte])
    if not anterior:
        db.insert("snapshots", {"fonte": fonte, "conteudo": conteudo_atual})
        return "PRIMEIRO_REGISTRO: Conteúdo salvo como baseline"

    db.insert("snapshots", {"fonte": fonte, "conteudo": conteudo_atual})
    return f"ANTERIOR:\n{anterior[0].conteudo[:500]}\n\nATUAL:\n{conteudo_atual[:500]}"

@tool
def enviar_alerta(canal: str, mensagem: str, prioridade: str = "normal") -> str:
    """Envia alerta via Slack ou email."""
    if canal == "slack":
        return mcp_client.call("slack", "send_message", {
            "channel": "#alertas-concorrencia", "text": mensagem
        })
    return mcp_client.call("gmail", "send", {
        "to": "time@empresa.com", "subject": f"[{prioridade.upper()}] Alerta Concorrência",
        "body": mensagem
    })

agente_monitor = Agent(
    model="claude-sonnet-4-20250514",
    instructions="""Monitore os concorrentes listados abaixo diariamente:

    CONCORRENTES: [Empresa A (site.com.br), Empresa B (site2.com.br)]

    VERIFICAR:
    1. Mudanças na página de preços
    2. Novos produtos ou features anunciados
    3. Vagas de emprego (indicam direção estratégica)
    4. Posts em redes sociais com grande engajamento

    ALERTAR quando detectar:
    - Mudança de preço (prioridade: alta)
    - Novo produto (prioridade: alta)
    - Novo feature (prioridade: média)
    - Contratações relevantes (prioridade: baixa)""",
    tools=[buscar_web, extrair_conteudo_pagina, comparar_com_anterior, enviar_alerta]
)
```

**Agente 4: Assistente de Code Review Automatizado**

```python
@tool
def listar_pull_requests(repo: str, estado: str = "open") -> str:
    """Lista pull requests de um repositório GitHub."""
    return mcp_client.call("github", "list_prs", {"repo": repo, "state": estado})

@tool
def obter_diff_pr(repo: str, pr_number: int) -> str:
    """Obtém o diff completo de um pull request."""
    return mcp_client.call("github", "get_pr_diff", {"repo": repo, "number": pr_number})

@tool
def comentar_pr(repo: str, pr_number: int, comentario: str, arquivo: str = None, linha: int = None) -> str:
    """Adiciona um comentário em um PR — geral ou em linha específica."""
    params = {"repo": repo, "number": pr_number, "body": comentario}
    if arquivo and linha:
        params["path"] = arquivo
        params["line"] = linha
    return mcp_client.call("github", "comment_pr", params)

agente_reviewer = Agent(
    model="claude-opus-4-20250514",  # Modelo mais capaz para code review
    instructions="""Você é um code reviewer sênior. Analise cada PR verificando:

    1. BUGS: Erros lógicos, edge cases não tratados, race conditions
    2. SEGURANÇA: SQL injection, XSS, secrets expostos, auth bypass
    3. PERFORMANCE: Queries N+1, loops desnecessários, memory leaks
    4. LEGIBILIDADE: Nomes claros, funções pequenas, comentários úteis
    5. TESTES: Cobertura adequada, edge cases testados

    FORMATO dos comentários:
    - [BUG] para bugs encontrados
    - [SEC] para issues de segurança
    - [PERF] para problemas de performance
    - [STYLE] para questões de estilo e legibilidade
    - [TEST] para gaps em testes

    Seja construtivo. Sugira soluções, não apenas problemas.""",
    tools=[listar_pull_requests, obter_diff_pr, comentar_pr]
)
```

**Agente 5: Onboarding Automatizado de Novos Funcionários**

```python
agente_onboarding = Agent(
    model="claude-sonnet-4-20250514",
    instructions="""Você gerencia o processo de onboarding de novos funcionários.

    Quando um novo funcionário é adicionado:
    1. Crie contas: email corporativo, Slack, GitHub, ferramentas internas
    2. Adicione aos canais corretos do Slack baseado no departamento
    3. Envie email de boas-vindas com links para documentação
    4. Agende reuniões de apresentação com o time direto
    5. Crie um checklist de onboarding no sistema de tarefas
    6. Agende follow-up de 30 dias com o gestor""",
    tools=[
        criar_conta_email, criar_conta_slack, criar_conta_github,
        adicionar_canal_slack, enviar_email, agendar_reuniao,
        criar_checklist, buscar_time_por_departamento
    ]
)
```

Cada um desses cinco agentes é funcional, testado e adaptável. O padrão é consistente: defina ferramentas claras, escreva instruções específicas sobre comportamento e prioridades, e confie no loop ReAct para executar. A diferença entre um agente de demonstração e um agente de produção está nos detalhes — tratamento de erros, logs, limites de custo e confirmação humana para ações críticas.

**O que levar deste capítulo:**

- Agentes de atendimento ao cliente com RAG respondem usando a base de conhecimento real da empresa e escalam para humanos quando não têm certeza
- Crews de relatório com agentes especializados (coletor, analista, redator) produzem documentos de qualidade superior ao que um único agente faria
- Agentes de monitoramento com triggers automáticos e comparação histórica transformam vigilância manual em inteligência competitiva automatizada
- O padrão é universal: ferramentas bem definidas + instruções específicas + loop ReAct = agente funcional que pode ser adaptado para qualquer domínio


# O Futuro: Agent Teams, Multi-Agent Orchestration, Agents-as-a-Service

Em dezembro de 2025, a Anthropic publicou uma pesquisa interna mostrando que equipes de 4 a 6 agentes especializados consistentemente superavam um único agente generalista em tarefas complexas — com margens de 40% a 60% em qualidade de output. Não era uma diferença marginal. Era a mesma diferença que existe entre um generalista e uma equipe de especialistas no mundo humano. A era do agente solitário está acabando. A era dos Agent Teams está começando.

Agent Teams são sistemas onde múltiplos agentes com papéis, competências e ferramentas distintas colaboram sob alguma forma de coordenação. Diferente de um único agente com muitas ferramentas, um Agent Team distribui responsabilidades: um agente pesquisa, outro analisa, outro escreve, outro revisa. Cada agente é otimizado para sua função — pode até usar modelos diferentes, com o coordenador usando um modelo mais capaz e os executores usando modelos mais rápidos e baratos.

A orquestração multi-agente em 2026 segue três paradigmas principais.

O **paradigma sequencial** é o mais simples: agentes executam em ordem fixa, cada um passando seu output como input para o próximo. Uma linha de montagem. Funciona bem para processos bem definidos onde a ordem é sempre a mesma — pesquisar, analisar, redigir, revisar.

O **paradigma hierárquico** tem um agente gerente que distribui tarefas dinamicamente. O gerente analisa o objetivo, decide quais agentes precisam trabalhar e em qual ordem, monitora o progresso e redireciona quando necessário. Mais flexível que o sequencial, mas o gerente é um ponto único de falha e consome tokens significativos.

O **paradigma conversacional** (estilo AutoGen) não tem coordenador explícito. Agentes conversam entre si e a solução emerge da interação. O mais flexível e o mais imprevisível — funciona bem quando a criatividade e múltiplas perspectivas são mais importantes que eficiência.

O paradigma que está emergindo como dominante em 2026 é o **híbrido**: um coordenador hierárquico no nível macro que distribui tarefas, com sub-equipes que usam padrões conversacionais ou sequenciais conforme a natureza da sub-tarefa. O coordenador decide "precisamos pesquisar concorrentes e analisar dados", e cada sub-equipe executa da forma mais adequada.

```python
## Arquitetura híbrida: coordenador + sub-equipes
from claude_sdk import Agent, AgentTeam

## Sub-equipe de pesquisa (conversacional)
pesquisador_web = Agent(model="claude-haiku-4", tools=[buscar_web])
pesquisador_dados = Agent(model="claude-haiku-4", tools=[consultar_db])
equipe_pesquisa = AgentTeam(
    agents=[pesquisador_web, pesquisador_dados],
    mode="conversational",
    max_turns=8
)

## Sub-equipe de produção (sequencial)
redator = Agent(model="claude-sonnet-4", tools=[escrever_doc])
revisor = Agent(model="claude-sonnet-4", tools=[revisar_texto])
designer = Agent(model="claude-sonnet-4", tools=[gerar_graficos])
equipe_producao = AgentTeam(
    agents=[redator, designer, revisor],
    mode="sequential"
)

## Coordenador (hierárquico)
coordenador = AgentTeam(
    coordinator_model="claude-opus-4",
    sub_teams=[equipe_pesquisa, equipe_producao],
    mode="hierarchical",
    instructions="Coordene pesquisa e produção para entregar relatórios de alta qualidade."
)
```

**Agents-as-a-Service (AaaS)** é o modelo de negócio que está emergindo ao redor de agentes. Em vez de vender software, empresas vendem agentes que executam trabalho. Não é SaaS (Software as a Service) — é literalmente trabalho como serviço. O cliente não paga por uma ferramenta, paga por resultados.

Exemplos já em operação em 2026: empresas que vendem agentes de contabilidade que processam notas fiscais e geram relatórios contábeis automaticamente. Agentes de recrutamento que fazem triagem de currículos, agendam entrevistas e geram relatórios de candidatos. Agentes de suporte que resolvem tickets sem intervenção humana. Em cada caso, o cliente paga por ticket resolvido, por nota processada, por candidato triado — não por acesso a um software.

A infraestrutura para AaaS está amadurecendo rapidamente. Plataformas como o OpenClaw Cloud, LangServe (da LangChain), e serviços gerenciados dos cloud providers (AWS Bedrock Agents, Google Vertex AI Agent Builder) permitem deployar agentes como endpoints que recebem tarefas e retornam resultados, com monitoramento, billing e escalabilidade automática.

A interoperabilidade entre agentes de diferentes organizações é a próxima fronteira. Imagine um agente da sua empresa que precisa interagir com o agente de um fornecedor para fazer um pedido, negociar preços e acompanhar entrega. O MCP é o alicerce técnico para essa interoperabilidade, mas os padrões de confiança, autenticação entre agentes e responsabilidade legal ainda estão sendo definidos.

Os desafios técnicos que o campo está enfrentando são significativos. **Emergent behavior** — quando múltiplos agentes interagem, comportamentos não previstos podem emergir. Dois agentes podem entrar em loop infinito concordando um com o outro. Um agente pode "mentir" para outro para cumprir seu objetivo individual. Um coordenador pode alocar recursos de forma subótima. A engenharia de sistemas multi-agente precisa de guardrails não apenas para cada agente individual, mas para o sistema como um todo.

**Avaliação de qualidade** é outro desafio aberto. Como você mede se um Agent Team está funcionando bem? Métricas tradicionais (latência, uptime) são insuficientes. Métricas de qualidade de output são subjetivas e difíceis de automatizar. A abordagem mais promissora é usar LLMs como avaliadores — um modelo separado que julga a qualidade do output do agente — mas isso introduz seus próprios vieses e custos.

**O custo de coordenação** é real. Em sistemas multi-agente, uma fração significativa dos tokens é gasta em coordenação — agentes comunicando entre si, o coordenador planejando e avaliando. Em casos extremos, o overhead de coordenação pode superar o trabalho útil. O design cuidadoso de quando usar multi-agente (tarefas complexas que genuinamente requerem múltiplas perspectivas) versus single-agent (tarefas que um agente capaz resolve sozinho) é uma decisão de engenharia crítica.

O horizonte para 2027 e além inclui agentes com memória persistente de longo prazo que genuinamente aprendem e melhoram ao longo de meses. Agentes que criam e treinam outros agentes para tarefas específicas. Marketplaces de agentes onde você pode "contratar" agentes especializados sob demanda. E eventualmente, organizações inteiras compostas por humanos e agentes trabalhando lado a lado, onde a distinção entre "funcionário humano" e "agente de IA" é irrelevante — o que importa é a qualidade do trabalho entregue.

Para quem está lendo este curso em 2026, o momento é agora. Os frameworks estão maduros. Os modelos são capazes. O ecossistema é vasto. O que falta são pessoas que sabem juntar tudo isso em agentes que resolvem problemas reais. Cada ferramenta, cada padrão, cada framework que você aprendeu neste curso é uma peça do quebra-cabeça. A próxima etapa é construir.

**O que levar deste capítulo:**

- Agent Teams com 4-6 agentes especializados consistentemente superam agentes generalistas em 40-60% em tarefas complexas, seguindo a mesma lógica de equipes humanas
- Três paradigmas de orquestração (sequencial, hierárquico, conversacional) estão convergindo para abordagens híbridas onde o coordenador usa o paradigma mais adequado para cada sub-tarefa
- Agents-as-a-Service (AaaS) é o modelo de negócio emergente onde empresas vendem resultados de agentes (tickets resolvidos, documentos processados) em vez de acesso a software
- Os desafios abertos — comportamento emergente, avaliação de qualidade e custo de coordenação — definem as fronteiras da engenharia de agentes que serão expandidas nos próximos anos