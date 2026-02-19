# Apresentação

Bem-vindo ao curso **OpenClaw: IA Open Source na Prática** — o guia definitivo para dominar ferramentas de inteligência artificial open source e construir seus próprios sistemas de IA sem depender de APIs pagas.

O ecossistema open source de IA explodiu nos últimos anos. Modelos como Llama, Mistral, Phi e Gemma rivalizam com GPT-4 em muitas tarefas — e você pode rodá-los gratuitamente no seu próprio computador. Ferramentas como Ollama, Hugging Face, LangChain e Open WebUI tornam tudo acessível. Neste curso, você dominará todo este ecossistema.

**O que você vai conquistar:**
- Rodar LLMs poderosos localmente sem custo mensal
- Dominar Ollama, Hugging Face, LangChain e Open WebUI
- Fazer fine-tuning de modelos para suas necessidades
- Construir sistemas RAG completos (Retrieval-Augmented Generation)
- Fazer deploy de modelos em produção com Docker

---

# ESTRUTURA DO CURSO: OpenClaw IA Open Source

**Duração Total:** 30+ horas | **Aulas:** 180 lições em 6 módulos | **Certificado:** Sim

| Módulo | Título | Duração |
|--------|--------|---------|
| 1 | Fundamentos de IA Open Source | 5 horas |
| 2 | Ollama e Modelos Locais | 6 horas |
| 3 | Hugging Face Masterclass | 6 horas |
| 4 | LangChain e RAG | 5 horas |
| 5 | Fine-Tuning e Customização | 5 horas |
| 6 | Deploy e Produção | 3 horas |

---

# MÓDULO 1: FUNDAMENTOS — O Ecossistema Open Source

**MÓDULO 1: FUNDAMENTOS DE IA OPEN SOURCE**
**AULA 1: O ECOSSISTEMA E POR QUE IMPORTA**

**Carga Horária:** 3 horas
**Indicadores Trabalhados:** 1. Entender o ecossistema open source de IA; 2. Escolher entre open source e proprietário.

---

**CONTEÚDO PARA O ALUNO**

**1. A Revolução Open Source em IA**

Em 2023, o documento interno do Google vazado dizia: "Não temos moat, e a OpenAI também não. O open source está nos alcançando." Essa previsão se confirmou. Modelos open source como Llama 3 (Meta), Mistral (Mistral AI), Phi (Microsoft), Gemma (Google) e Qwen (Alibaba) estão atingindo performance comparável a GPT-4 em muitas tarefas — e são gratuitos.

**2. Vantagens do Open Source**

- **Custo zero:** Sem mensalidade, sem custo por token, sem limites de uso
- **Privacidade total:** Seus dados nunca saem do seu computador/servidor
- **Customização:** Modifique, fine-tune, combine modelos livremente
- **Independência:** Sem vendor lock-in, sem mudanças de preço/política
- **Transparência:** Código e pesos abertos, auditáveis
- **Compliance:** Processamento local facilita LGPD/GDPR

**3. Quando Usar Open Source vs Proprietário**

| Cenário | Open Source | Proprietário |
|---------|-----------|-------------|
| Dados sensíveis | ✅ Melhor | ⚠️ Risco |
| Budget limitado | ✅ Gratuito | ❌ Custo |
| Melhor qualidade possível | ⚠️ Próximo | ✅ GPT-4/Claude |
| Customização profunda | ✅ Total | ❌ Limitado |
| Setup rápido | ❌ Mais trabalho | ✅ Imediato |
| Escalabilidade | ⚠️ Seu infra | ✅ Gerenciado |

**4. Hardware Necessário**

- **Mínimo:** 16GB RAM, CPU moderna (para modelos pequenos quantizados)
- **Recomendado:** 32GB RAM + GPU 8GB VRAM (para modelos médios)
- **Ideal:** 64GB RAM + GPU 24GB VRAM (para modelos grandes)
- **Produção:** Servidor com GPU A100/H100 ou cloud GPU

---

# MÓDULO 1: FUNDAMENTOS — Modelos e Arquiteturas

**MÓDULO 1: FUNDAMENTOS DE IA OPEN SOURCE**
**AULA 2: MODELOS DISPONÍVEIS E COMO ESCOLHER**

**Carga Horária:** 2 horas
**Indicadores Trabalhados:** 1. Conhecer os principais modelos open source; 2. Selecionar modelo por tarefa.

---

**CONTEÚDO PARA O ALUNO**

**1. Principais Famílias de Modelos**

- **Llama 3 (Meta):** 8B e 70B params. Excelente qualidade geral, ótimo para chat e instrução.
- **Mistral/Mixtral (Mistral AI):** 7B e 8x7B MoE. Eficiente, bom em raciocínio e código.
- **Phi-3 (Microsoft):** 3.8B e 14B. Surpreendentemente capaz para o tamanho. Ideal para edge.
- **Gemma 2 (Google):** 2B, 9B, 27B. Boa qualidade, otimizado para hardware Google.
- **Qwen 2.5 (Alibaba):** 7B a 72B. Excelente em multilingual incluindo português.
- **Code Llama / DeepSeek Coder:** Especializados em código.
- **Stable Diffusion / FLUX:** Para geração de imagens.

**2. Tamanhos e Quantização**

Modelos vêm em tamanhos (parâmetros): 3B (rápido, básico), 7-8B (bom equilíbrio), 13-14B (melhor qualidade), 30-34B (muito bom), 70B+ (quase GPT-4). Quantização reduz VRAM necessária: FP16 (original), Q8 (boa qualidade), Q4 (compacto, qualidade aceitável).

**3. Benchmarks Que Importam**

Não confie em um único benchmark. Avalie: MMLU (conhecimento geral), HumanEval (código), MT-Bench (conversação), HellaSwag (raciocínio). Mais importante: teste no SEU caso de uso específico.

**4. Licenças Open Source**

Nem todo "open source" é igual: Apache 2.0 (livre total), MIT (livre total), Llama License (uso comercial com restrições), CC-BY-NC (não comercial). Sempre verifique antes de usar em produção.

---

# MÓDULO 2: OLLAMA — Instalação e Uso

**MÓDULO 2: OLLAMA E MODELOS LOCAIS**
**AULA 1: INSTALAÇÃO E PRIMEIROS PASSOS**

**Carga Horária:** 3 horas
**Indicadores Trabalhados:** 1. Instalar e configurar Ollama; 2. Rodar modelos localmente.

---

**CONTEÚDO PARA O ALUNO**

**1. O que é o Ollama**

Ollama é a forma mais fácil de rodar LLMs localmente. Com um único comando, você baixa e roda modelos de última geração no seu computador. Suporta Windows, Mac e Linux. Interface CLI simples + API REST local.

**2. Instalação**

**Windows/Mac:** Baixe o instalador em ollama.com. Um clique.

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Docker:**
```bash
docker run -d --gpus all -p 11434:11434 ollama/ollama
```

**3. Primeiros Comandos**

```bash
# Baixar e rodar Llama 3
ollama run llama3

# Listar modelos instalados
ollama list

# Baixar modelo sem rodar
ollama pull mistral

# Rodar com prompt direto
ollama run llama3 "Explique quantum computing em 3 frases"

# Remover modelo
ollama rm llama3
```

**4. Modelos Populares no Ollama**

| Modelo | Tamanho | VRAM | Uso |
|--------|---------|------|-----|
| llama3:8b | 4.7GB | 6GB | Chat geral |
| mistral:7b | 4.1GB | 6GB | Raciocínio |
| codellama:7b | 3.8GB | 6GB | Código |
| phi3:mini | 2.3GB | 4GB | Edge/mobile |
| llama3:70b | 40GB | 48GB | Alta qualidade |
| mixtral:8x7b | 26GB | 32GB | MoE eficiente |

**5. API REST Local**

Ollama expõe API compatível com OpenAI na porta 11434:

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3",
  "prompt": "Explique IA em uma frase"
}'
```

Isso permite integrar modelos locais em qualquer aplicação que suporte a API da OpenAI!

---

# MÓDULO 2: OLLAMA — Customização e Modelfile

**MÓDULO 2: OLLAMA E MODELOS LOCAIS**
**AULA 2: CUSTOMIZAÇÃO COM MODELFILE**

**Carga Horária:** 3 horas
**Indicadores Trabalhados:** 1. Criar modelos customizados; 2. Configurar parâmetros avançados.

---

**CONTEÚDO PARA O ALUNO**

**1. Modelfile — Seu Modelo Personalizado**

O Modelfile permite criar versões customizadas de modelos:

```
FROM llama3

PARAMETER temperature 0.7
PARAMETER num_ctx 4096
PARAMETER top_p 0.9

SYSTEM """
Você é um assistente especialista em marketing digital 
para o mercado brasileiro. Responda sempre em português 
brasileiro com tom profissional e prático.
"""
```

```bash
ollama create meu-assistente -f Modelfile
ollama run meu-assistente
```

**2. Parâmetros Configuráveis**

- **temperature:** Criatividade (0.0-2.0)
- **num_ctx:** Tamanho do contexto (tokens)
- **top_p:** Nucleus sampling (0.0-1.0)
- **top_k:** Top-K sampling
- **repeat_penalty:** Penalidade por repetição
- **num_predict:** Máximo de tokens na resposta
- **stop:** Tokens de parada customizados

**3. Open WebUI — Interface Visual**

Open WebUI (anteriormente Ollama Web UI) é uma interface web completa para Ollama:

```bash
docker run -d -p 3000:8080 \
  --add-host=host.docker.internal:host-gateway \
  -v open-webui:/app/backend/data \
  ghcr.io/open-webui/open-webui:main
```

Features: interface tipo ChatGPT, múltiplas conversas, upload de documentos (RAG local), modelos múltiplos, compartilhamento de chats, temas e customização.

**4. Continue — IA no IDE**

Continue é uma extensão VS Code/JetBrains que conecta ao Ollama: autocomplete de código com modelos locais, chat integrado no IDE, explicação de código, geração de testes, refatoração. Tudo local e privado.

---

# MÓDULO 3: HUGGING FACE — Hub e Transformers

**MÓDULO 3: HUGGING FACE MASTERCLASS**
**AULA 1: HUB DE MODELOS E TRANSFORMERS**

**Carga Horária:** 3 horas
**Indicadores Trabalhados:** 1. Navegar e usar o Hugging Face Hub; 2. Usar a biblioteca Transformers.

---

**CONTEÚDO PARA O ALUNO**

**1. O Hugging Face Hub**

O Hugging Face é o "GitHub dos modelos de IA": 500.000+ modelos disponíveis, 100.000+ datasets, Spaces (demos interativos), Inference API (testes rápidos), comunidade ativa.

**2. Encontrando Modelos**

Navegue por: task (text-generation, translation, summarization, image-classification), library (transformers, diffusers, sentence-transformers), language (pt, en, multi), license (apache-2.0, mit), trending, most downloaded.

**3. Usando Modelos com Transformers**

```python
from transformers import pipeline

# Análise de sentimento
classifier = pipeline("sentiment-analysis", 
                      model="neuralmind/bert-base-portuguese-cased")
result = classifier("Este produto é excelente!")
print(result)  # [{'label': 'POSITIVE', 'score': 0.98}]

# Geração de texto
generator = pipeline("text-generation", model="meta-llama/Llama-3-8b")
result = generator("O futuro da IA é", max_length=100)
print(result[0]['generated_text'])
```

**4. Tasks Populares**

- **text-generation:** Gerar texto (chatbots, conteúdo)
- **text-classification:** Classificar texto (sentimento, categorias)
- **token-classification:** NER (nomes, locais, organizações)
- **summarization:** Resumir textos longos
- **translation:** Traduzir entre idiomas
- **question-answering:** Responder perguntas sobre contexto
- **image-classification:** Classificar imagens
- **object-detection:** Detectar objetos em imagens

---

# MÓDULO 3: HUGGING FACE — Datasets e Spaces

**MÓDULO 3: HUGGING FACE MASTERCLASS**
**AULA 2: DATASETS, SPACES E INFERENCE API**

**Carga Horária:** 3 horas
**Indicadores Trabalhados:** 1. Usar datasets do Hub; 2. Criar Spaces e usar Inference API.

---

**CONTEÚDO PARA O ALUNO**

**1. Datasets Hub**

100.000+ datasets prontos para uso: datasets para NLP (texto), computer vision (imagens), áudio (speech), multimodal, tabulares. Carregue com uma linha:

```python
from datasets import load_dataset
dataset = load_dataset("squad_v2")
```

**2. Criando Datasets Custom**

Para fine-tuning, crie datasets no formato correto: CSV/JSON/Parquet, upload via Hub, versioning automático, dataset cards com documentação.

**3. Hugging Face Spaces**

Crie demos interativos: Gradio (interface Python simples), Streamlit (dashboards), Docker (qualquer app). Deploy gratuito com GPU disponível. Ideal para: demonstrar modelos, prototipar, compartilhar com equipe.

**4. Inference API**

Teste qualquer modelo do Hub via API sem instalar nada:

```python
import requests
response = requests.post(
    "https://api-inference.huggingface.co/models/meta-llama/Llama-3-8b",
    headers={"Authorization": "Bearer hf_xxx"},
    json={"inputs": "Translate to English: Bom dia"}
)
```

**5. AutoTrain**

Fine-tuning sem código: faça upload do dataset, selecione modelo base, configure hiperparâmetros, treine com um clique. AutoTrain escolhe automaticamente os melhores parâmetros.

---

# MÓDULO 4: LANGCHAIN — Fundamentos

**MÓDULO 4: LANGCHAIN E RAG**
**AULA 1: FUNDAMENTOS DO LANGCHAIN**

**Carga Horária:** 3 horas
**Indicadores Trabalhados:** 1. Entender arquitetura do LangChain; 2. Criar chains e agentes básicos.

---

**CONTEÚDO PARA O ALUNO**

**1. O que é LangChain**

LangChain é o framework mais popular para construir aplicações com LLMs. Componentes principais: Models (abstração para LLMs), Prompts (templates reutilizáveis), Chains (sequências de operações), Agents (LLMs que tomam decisões), Memory (persistência de contexto), Retrieval (busca em documentos).

**2. Instalação e Setup**

```python
pip install langchain langchain-community langchain-ollama

from langchain_ollama import OllamaLLM
llm = OllamaLLM(model="llama3")
response = llm.invoke("Explique IA em uma frase")
```

**3. Prompt Templates**

```python
from langchain.prompts import PromptTemplate

template = PromptTemplate.from_template(
    "Você é expert em {area}. Responda: {pergunta}"
)
chain = template | llm
result = chain.invoke({"area": "marketing", "pergunta": "O que é SEO?"})
```

**4. Chains — Composição de Operações**

```python
from langchain.chains import LLMChain, SequentialChain

# Chain 1: gera ideia
chain1 = LLMChain(llm=llm, prompt=prompt_ideia)
# Chain 2: expande ideia
chain2 = LLMChain(llm=llm, prompt=prompt_expansao)
# Sequencial: chain1 → chain2
pipeline = SequentialChain(chains=[chain1, chain2])
```

**5. Output Parsers**

Force outputs estruturados: JSON parser, lista parser, Pydantic parser. Garanta que o LLM retorne dados no formato que sua aplicação precisa.

---

# MÓDULO 4: LANGCHAIN — RAG Completo

**MÓDULO 4: LANGCHAIN E RAG**
**AULA 2: RETRIEVAL-AUGMENTED GENERATION**

**Carga Horária:** 2 horas
**Indicadores Trabalhados:** 1. Construir sistema RAG completo; 2. Indexar e buscar em documentos.

---

**CONTEÚDO PARA O ALUNO**

**1. O que é RAG**

Retrieval-Augmented Generation: em vez de depender apenas do conhecimento do modelo, busque informações relevantes em SEUS documentos e forneça como contexto. Resultado: respostas precisas e atualizadas baseadas nos seus dados.

**2. Pipeline RAG**

1. **Ingest:** Carregue documentos (PDF, Word, HTML, CSV)
2. **Split:** Divida em chunks menores (500-1000 tokens)
3. **Embed:** Converta chunks em vetores numéricos
4. **Store:** Salve vetores em vector database
5. **Retrieve:** Quando usuario pergunta, busque chunks relevantes
6. **Generate:** Forneça chunks como contexto para o LLM responder

**3. Implementação Completa**

```python
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OllamaEmbeddings

# 1. Carregar documentos
loader = PyPDFLoader("manual_empresa.pdf")
docs = loader.load()

# 2. Dividir em chunks
splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
chunks = splitter.split_documents(docs)

# 3-4. Embeddings + Vector Store
embeddings = OllamaEmbeddings(model="nomic-embed-text")
vectorstore = Chroma.from_documents(chunks, embeddings)

# 5-6. Retrieval + Generation
retriever = vectorstore.as_retriever()
# Combine com LLM para responder perguntas
```

**4. Vector Databases**

Opções populares: ChromaDB (simples, local), FAISS (Facebook, rápido), Pinecone (cloud, escalável), Weaviate (features avançadas), Qdrant (Rust, performante).

---

# MÓDULO 5: FINE-TUNING — LoRA e QLoRA

**MÓDULO 5: FINE-TUNING E CUSTOMIZAÇÃO**
**AULA 1: FINE-TUNING COM LoRA E QLoRA**

**Carga Horária:** 3 horas
**Indicadores Trabalhados:** 1. Fazer fine-tuning de modelos; 2. Criar datasets de treinamento.

---

**CONTEÚDO PARA O ALUNO**

**1. Por que Fine-Tuning**

Fine-tuning adapta um modelo pré-treinado para sua tarefa específica: falar no tom da sua empresa, seguir formato específico, especializar em domínio (jurídico, médico, financeiro), melhorar em idioma específico (português).

**2. LoRA (Low-Rank Adaptation)**

LoRA é a técnica que democratizou fine-tuning: em vez de treinar todos os bilhões de parâmetros, treina apenas pequenas matrizes adicionais. Resultado: 10-100x menos VRAM, treinamento em GPUs consumer, modelo base intacto (adapters removíveis).

**3. QLoRA — LoRA Quantizado**

QLoRA combina quantização com LoRA: modelo base quantizado em 4-bit + LoRA adapters em 16-bit. Resultado: fine-tune modelos 65B em uma única GPU 48GB. Modelos 7B em GPUs com 8GB VRAM.

**4. Preparando Dataset**

Formato instrução (chat):
```json
[
  {"role": "system", "content": "Assistente jurídico especialista em direito trabalhista"},
  {"role": "user", "content": "Qual o prazo para entrar com reclamação trabalhista?"},
  {"role": "assistant", "content": "O prazo prescricional é de 2 anos..."}
]
```

Mínimo recomendado: 100-500 exemplos de alta qualidade. Mais importante que quantidade: qualidade e diversidade dos exemplos.

**5. Treinando com Unsloth**

Unsloth é a biblioteca mais eficiente para fine-tuning:

```python
from unsloth import FastLanguageModel

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/llama-3-8b-bnb-4bit",
    max_seq_length=2048,
    load_in_4bit=True
)

model = FastLanguageModel.get_peft_model(model, r=16, lora_alpha=16)
# Treine com seu dataset...
```

---

# MÓDULO 5: FINE-TUNING — Avaliação e Otimização

**MÓDULO 5: FINE-TUNING E CUSTOMIZAÇÃO**
**AULA 2: AVALIAÇÃO E OTIMIZAÇÃO**

**Carga Horária:** 2 horas
**Indicadores Trabalhados:** 1. Avaliar qualidade do modelo; 2. Otimizar para produção.

---

**CONTEÚDO PARA O ALUNO**

**1. Avaliação de Modelos**

Após fine-tuning, avalie: loss curve (diminuindo? convergiu?), evaluation set (performance em dados não vistos), human evaluation (qualidade subjetiva), task-specific metrics (accuracy, F1, BLEU).

**2. Evitando Overfitting**

Sinais: loss de treino diminui mas validação aumenta, modelo decora exemplos exatos, perde capacidade geral. Soluções: mais dados diversos, menos epochs, regularização, early stopping.

**3. Merging Adapters**

Para produção, merge LoRA adapters no modelo base: modelo unificado sem overhead de adapter, export para GGUF (Ollama), deploy como modelo único.

**4. Quantização para Deploy**

Após fine-tuning, quantize para deploy eficiente: GGUF format (Ollama/llama.cpp), AWQ (vLLM), GPTQ (exllama). Trade-off: menor VRAM = ligeiramente menor qualidade.

---

# MÓDULO 6: DEPLOY — Produção

**MÓDULO 6: DEPLOY E PRODUÇÃO**
**AULA 1: DEPLOY COM DOCKER E APIS**

**Carga Horária:** 2 horas
**Indicadores Trabalhados:** 1. Fazer deploy profissional; 2. Criar APIs de inferência.

---

**CONTEÚDO PARA O ALUNO**

**1. Deploy com Ollama em Produção**

```yaml
# docker-compose.yml
version: "3"
services:
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - capabilities: [gpu]
  
  webui:
    image: ghcr.io/open-webui/open-webui:main
    ports:
      - "3000:8080"
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
```

**2. API com FastAPI**

```python
from fastapi import FastAPI
from ollama import Client

app = FastAPI()
client = Client(host="http://ollama:11434")

@app.post("/chat")
async def chat(prompt: str, model: str = "llama3"):
    response = client.chat(model=model, messages=[
        {"role": "user", "content": prompt}
    ])
    return {"response": response['message']['content']}
```

**3. vLLM para Alta Performance**

Para produção de alta escala: vLLM com PagedAttention, continuous batching, suporte a múltiplos modelos, API compatível com OpenAI.

**4. Monitoramento**

Monitore: latência por request, throughput (tokens/segundo), GPU utilization, memory usage, error rate, cost per request.

---

# MÓDULO 6: DEPLOY — Segurança e Escala

**MÓDULO 6: DEPLOY E PRODUÇÃO**
**AULA 2: SEGURANÇA, ESCALA E CUSTOS**

**Carga Horária:** 1 hora
**Indicadores Trabalhados:** 1. Implementar segurança; 2. Otimizar custos.

---

**CONTEÚDO PARA O ALUNO**

**1. Segurança em Produção**

Checklist: API authentication (API keys, OAuth), rate limiting, input validation (sanitize prompts), output filtering (conteúdo impróprio), HTTPS obrigatório, firewall configurado, logging de auditoria.

**2. Escalabilidade**

Para crescer: load balancer na frente de múltiplas instâncias, auto-scaling baseado em demand, cache de respostas frequentes, queue para requests em pico.

**3. Custos: Self-Hosted vs Cloud**

| Item | Self-Hosted | Cloud GPU |
|------|-----------|-----------|
| GPU A100 | ~$10K compra | ~$2.50/hora |
| Energia | ~$100/mês | Incluído |
| Manutenção | Sua responsabilidade | Gerenciado |
| Break-even | ~6 meses uso pesado | Nunca |

**4. Arquitetura Recomendada**

Produção: Nginx (reverse proxy + SSL) → FastAPI (API gateway) → Ollama/vLLM (inference) → PostgreSQL (logs + cache) → Grafana (monitoramento). Tudo em Docker Compose ou Kubernetes.

---

# TEMPLATE: RAG Local com Ollama

**TEMPLATE — Sistema RAG Local Completo**

```python
# Setup completo de RAG com Ollama + LangChain + ChromaDB
# 1. Instale: pip install langchain chromadb ollama pypdf

# 2. Carregue e indexe documentos
# 3. Configure retriever com ChromaDB
# 4. Combine com Ollama para respostas
# 5. API com FastAPI para acesso

# Resultado: ChatGPT-like que responde sobre SEUS documentos
# 100% local, 100% privado, custo zero
```

---

# EXERCÍCIO: Chatbot Local com RAG

**EXERCÍCIO PRÁTICO — Chatbot sobre seus Documentos**

**Duração:** 90 min | **Objetivo:** Chat que responde sobre PDFs locais

1. Instale Ollama + modelo llama3
2. Configure LangChain + ChromaDB
3. Indexe 3-5 PDFs (manuais, documentos, artigos)
4. Crie interface com Streamlit ou Open WebUI
5. Teste com perguntas sobre os documentos
6. Avalie qualidade das respostas

---

# EXERCÍCIO: Fine-Tuning de Modelo

**EXERCÍCIO PRÁTICO — Fine-Tune para Seu Domínio**

**Duração:** 120 min | **Objetivo:** Modelo customizado para sua área

1. Prepare dataset de 100+ exemplos do seu domínio
2. Configure Unsloth com Llama 3 8B
3. Treine com QLoRA (30 min em GPU consumer)
4. Avalie: compare respostas antes/depois do fine-tuning
5. Export para GGUF e use no Ollama
6. Documente melhorias e limitações

---

# PROJETO FINAL: Sistema de IA Completo

**PROJETO FINAL — Sistema Open Source de IA**

**Duração:** 8-10 horas | **Nível:** Avançado

**Entregáveis:**
1. **Modelo customizado** fine-tuned para seu domínio
2. **Sistema RAG** com seus documentos indexados
3. **API REST** com autenticação e rate limiting
4. **Interface web** (Open WebUI ou custom)
5. **Docker Compose** para deploy completo
6. **Documentação** técnica e de uso

---

# Recursos Adicionais e Próximos Passos

Parabéns por completar **OpenClaw: IA Open Source**!

**Próximos passos:**
1. Monte seu servidor de IA local
2. Fine-tune modelo para seu negócio
3. Construa sistema RAG para sua empresa
4. Contribua com a comunidade open source

**Recursos:**
- [Ollama](https://ollama.com)
- [Hugging Face](https://huggingface.co)
- [LangChain Docs](https://docs.langchain.com)
- [Open WebUI](https://openwebui.com)
- Comunidade FayaPoint no Discord

**Suporte:** suporte@fayapoint.com | WhatsApp: +5521971908530
