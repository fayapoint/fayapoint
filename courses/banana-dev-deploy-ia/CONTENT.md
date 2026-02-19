# Apresentação

Bem-vindo ao curso **Banana Dev: Deploy de IA em Produção** — o guia completo para fazer deploy de modelos de inteligência artificial em infraestrutura serverless otimizada para GPU.

O Banana Dev (agora parte do ecossistema de serverless GPU) revolucionou a forma como desenvolvedores fazem deploy de modelos de machine learning. Neste curso, você aprenderá a transformar modelos treinados em APIs escaláveis, usando infraestrutura serverless que cobra apenas pelo uso real.

**O que você vai conquistar:**
- Fazer deploy de modelos de IA em produção
- Criar APIs serverless para inferência com GPU
- Otimizar modelos para latência e custo
- Escalar automaticamente baseado em demanda
- Monetizar modelos de IA como serviço

---

# ESTRUTURA DO CURSO: Banana Dev Deploy IA

**Duração Total:** 25+ horas | **Aulas:** 140 lições em 6 módulos | **Certificado:** Sim

| Módulo | Título | Duração |
|--------|--------|---------|
| 1 | Fundamentos de Deploy de IA | 4 horas |
| 2 | Serverless GPU e Infraestrutura | 5 horas |
| 3 | Deploy de Modelos Populares | 5 horas |
| 4 | Otimização e Performance | 4 horas |
| 5 | APIs e Integrações | 4 horas |
| 6 | Produção e Escalabilidade | 3 horas |

---

# MÓDULO 1: FUNDAMENTOS — Deploy de IA

**MÓDULO 1: FUNDAMENTOS DE DEPLOY DE IA**
**AULA 1: DO MODELO AO PRODUTO**

**Carga Horária:** 2 horas
**Indicadores Trabalhados:** 1. Entender o ciclo de vida de um modelo de IA; 2. Escolher a estratégia de deploy adequada.

---

**CONTEÚDO PARA O ALUNO**

**1. O Gap Entre Treino e Produção**

A maioria dos modelos de IA nunca chega à produção. O motivo: o gap entre "funciona no notebook" e "funciona como produto" é enorme. Desafios: infraestrutura de GPU cara, latência inaceitável, escalabilidade limitada, cold starts longos, custos imprevisíveis. O Banana Dev e plataformas similares resolvem esses problemas com serverless GPU.

**2. Estratégias de Deploy**

- **Self-hosted (GPU dedicada):** Controle total, custo fixo alto, ideal para uso constante
- **Cloud GPU (AWS/GCP/Azure):** Flexível, pay-per-use, complexidade de gestão
- **Serverless GPU (Banana/Replicate/Modal):** Zero gestão, pay-per-inference, escala automática
- **Edge (on-device):** Latência mínima, modelos menores, sem custo de server

**3. Serverless GPU — A Revolução**

Serverless GPU elimina a complexidade: você faz upload do modelo, define o handler, e a plataforma cuida de tudo — provisionamento, scaling, cold starts, failover. Paga apenas por inferência real (por segundo de GPU).

**4. Containerização com Docker**

Todo deploy moderno de IA usa containers Docker: ambiente reproduzível, dependências isoladas, portabilidade entre plataformas. Estrutura básica: Dockerfile com CUDA/PyTorch, código do handler, modelo pré-carregado ou download on-init.

---

# MÓDULO 1: FUNDAMENTOS — Ambiente de Desenvolvimento

**MÓDULO 1: FUNDAMENTOS DE DEPLOY DE IA**
**AULA 2: CONFIGURANDO O AMBIENTE**

**Carga Horária:** 2 horas
**Indicadores Trabalhados:** 1. Configurar ambiente de desenvolvimento; 2. Testar modelos localmente.

---

**CONTEÚDO PARA O ALUNO**

**1. Setup Local**

Ferramentas necessárias: Python 3.10+, Docker Desktop, NVIDIA Container Toolkit (para GPU local), Git, conta na plataforma de deploy (Banana/Replicate/Modal).

**2. Estrutura de Projeto**

```
my-model/
├── Dockerfile          # Container definition
├── app.py             # Handler principal
├── requirements.txt   # Dependências Python
├── download_model.py  # Script de download do modelo
├── test_handler.py    # Testes locais
└── README.md          # Documentação
```

**3. O Handler Pattern**

Todo deploy serverless segue o mesmo padrão:

```python
def init():
    """Carrega modelo na memória (executado uma vez)"""
    global model, tokenizer
    model = load_model("model_path")
    tokenizer = load_tokenizer("model_path")

def handler(event):
    """Processa cada request (executado por inferência)"""
    prompt = event.get("prompt", "")
    result = model.generate(tokenizer.encode(prompt))
    return {"output": tokenizer.decode(result)}
```

**4. Teste Local com Docker**

```bash
docker build -t my-model .
docker run --gpus all -p 8000:8000 my-model
curl -X POST http://localhost:8000 -d '{"prompt": "Hello"}'
```

---

# MÓDULO 2: INFRAESTRUTURA — Serverless GPU

**MÓDULO 2: SERVERLESS GPU E INFRAESTRUTURA**
**AULA 1: PLATAFORMAS DE DEPLOY**

**Carga Horária:** 3 horas
**Indicadores Trabalhados:** 1. Comparar plataformas de deploy; 2. Configurar deploy em cada uma.

---

**CONTEÚDO PARA O ALUNO**

**1. Banana Dev / Potassium**

Framework Potassium do Banana Dev: define init() para carregar modelo, handler() para processar requests. Deploy via CLI: `banana deploy`. Dashboard com métricas, logs e configurações.

**2. Replicate**

Plataforma popular para modelos open source: define Cog (container format), push para registry, API automática. Comunidade com milhares de modelos prontos. Preços transparentes por segundo de GPU.

**3. Modal**

Developer-friendly: define funções Python com decorators, deploy automático, GPU selecionável (T4, A10G, A100, H100). Excelente para batch processing e pipelines.

```python
import modal
app = modal.App()

@app.function(gpu="A10G")
def generate(prompt: str):
    model = load_model()
    return model(prompt)
```

**4. RunPod**

Serverless e pods dedicados: flexibilidade entre serverless e GPU reservada. Bom para workloads variáveis. Templates prontos para modelos populares.

**5. Comparativo**

| Plataforma | GPU | Preço/hora | Cold Start | DX |
|-----------|-----|-----------|------------|-----|
| Banana | T4-A100 | $0.50-3.00 | Médio | Bom |
| Replicate | T4-A100 | $0.55-2.50 | Baixo | Excelente |
| Modal | T4-H100 | $0.60-4.00 | Baixo | Excelente |
| RunPod | T4-H100 | $0.40-3.50 | Médio | Bom |

---

# MÓDULO 2: INFRAESTRUTURA — Docker e CUDA

**MÓDULO 2: SERVERLESS GPU E INFRAESTRUTURA**
**AULA 2: DOCKER, CUDA E OTIMIZAÇÃO DE CONTAINERS**

**Carga Horária:** 2 horas
**Indicadores Trabalhados:** 1. Criar Dockerfiles otimizados para IA; 2. Configurar CUDA corretamente.

---

**CONTEÚDO PARA O ALUNO**

**1. Dockerfile para IA**

```dockerfile
FROM nvidia/cuda:12.1-runtime-ubuntu22.04
RUN apt-get update && apt-get install -y python3 python3-pip
COPY requirements.txt .
RUN pip3 install -r requirements.txt
COPY . /app
WORKDIR /app
RUN python3 download_model.py
CMD ["python3", "app.py"]
```

**2. Otimização de Imagem**

Reduza tamanho: multi-stage builds, .dockerignore para excluir desnecessários, cache de layers para dependências, imagens base slim/minimal. Imagem menor = deploy mais rápido = cold start menor.

**3. CUDA e Compatibilidade**

Garanta compatibilidade: versão CUDA da imagem base deve combinar com drivers da plataforma, PyTorch/TensorFlow deve ser compilado para a mesma versão CUDA, teste localmente com `nvidia-smi`.

**4. Model Caching**

Estratégias para carregar modelos rapidamente: bake model na imagem (maior, mais rápido), download on-init de S3/HuggingFace (menor, mais lento), volume compartilhado (equilibrado).

---

# MÓDULO 3: DEPLOY — LLMs e Text Generation

**MÓDULO 3: DEPLOY DE MODELOS POPULARES**
**AULA 1: LARGE LANGUAGE MODELS**

**Carga Horária:** 3 horas
**Indicadores Trabalhados:** 1. Fazer deploy de LLMs; 2. Otimizar inferência de texto.

---

**CONTEÚDO PARA O ALUNO**

**1. Deploy de Llama 3**

Faça deploy do Llama 3 (Meta) como API: download do modelo (quantizado para economia de VRAM), configure vLLM ou text-generation-inference como runtime, defina handler para chat completion, deploy na plataforma.

**2. Deploy com vLLM**

vLLM é o runtime mais eficiente para LLMs: PagedAttention para uso otimizado de memória, continuous batching para alta throughput, suporte a quantização AWQ/GPTQ, API compatível com OpenAI.

**3. Deploy com TGI (Text Generation Inference)**

Framework da Hugging Face: otimizado para inferência, suporte a flash attention, quantização, streaming. Ideal para deploy rápido de qualquer modelo do Hub.

**4. Quantização para Deploy**

Reduzir tamanho sem perder qualidade: FP16 (metade da VRAM, qualidade quase igual), INT8 (1/4 da VRAM, leve perda), INT4/GPTQ/AWQ (1/8 da VRAM, perda aceitável). Modelos 70B que precisam de 140GB VRAM em FP32 rodam em 35GB com INT4.

---

# MÓDULO 3: DEPLOY — Imagens e Áudio

**MÓDULO 3: DEPLOY DE MODELOS POPULARES**
**AULA 2: MODELOS DE IMAGEM E ÁUDIO**

**Carga Horária:** 2 horas
**Indicadores Trabalhados:** 1. Deploy de modelos de imagem; 2. Deploy de modelos de áudio.

---

**CONTEÚDO PARA O ALUNO**

**1. Deploy de Stable Diffusion**

Stable Diffusion como API: SDXL para qualidade máxima, LoRA para estilos customizados, ControlNet para controle fino, pipeline completo (txt2img, img2img, inpainting).

**2. Deploy de Whisper**

OpenAI Whisper para transcrição: suporte a 100+ idiomas, modelo large-v3 para máxima qualidade, streaming para transcrição em tempo real, diarização (identificar quem fala).

**3. Deploy de TTS (Text-to-Speech)**

Modelos como Bark, XTTS, Tortoise-TTS: voz natural em múltiplos idiomas, clonagem de voz com poucos segundos de sample, emoção e estilo configuráveis.

**4. Deploy de Embedding Models**

Modelos de embedding para RAG e busca semântica: sentence-transformers, e5, bge. Otimize para throughput com batching. Essencial para sistemas de busca inteligente.

---

# MÓDULO 4: OTIMIZAÇÃO — Performance

**MÓDULO 4: OTIMIZAÇÃO E PERFORMANCE**
**AULA 1: REDUZINDO LATÊNCIA E CUSTOS**

**Carga Horária:** 2 horas
**Indicadores Trabalhados:** 1. Otimizar latência de inferência; 2. Reduzir custos de GPU.

---

**CONTEÚDO PARA O ALUNO**

**1. Cold Start Optimization**

Cold start é o maior inimigo: tempo para provisionar GPU + carregar modelo. Estratégias: keep-warm (manter instâncias ativas), model caching (pré-carregar), menor imagem Docker, modelo baked na imagem.

**2. Batching Inteligente**

Processar múltiplos requests simultaneamente: dynamic batching (agrupa requests em janela de tempo), continuous batching (libera items conforme terminam). Throughput aumenta 3-5x com batching eficiente.

**3. Streaming Responses**

Para LLMs, streaming melhora experiência: envie tokens assim que gerados (Server-Sent Events), reduz tempo percebido drasticamente, implementação com generators e async.

**4. Seleção de GPU**

| GPU | VRAM | Preço/h | Uso Ideal |
|-----|------|---------|-----------|
| T4 | 16GB | ~$0.50 | Modelos pequenos, embedding |
| A10G | 24GB | ~$1.00 | Modelos médios, SDXL |
| A100 | 40/80GB | ~$2.50 | LLMs grandes, batch |
| H100 | 80GB | ~$4.00 | Performance máxima |

---

# MÓDULO 4: OTIMIZAÇÃO — Monitoramento

**MÓDULO 4: OTIMIZAÇÃO E PERFORMANCE**
**AULA 2: MONITORAMENTO E OBSERVABILIDADE**

**Carga Horária:** 2 horas
**Indicadores Trabalhados:** 1. Monitorar APIs de IA em produção; 2. Alertar sobre problemas.

---

**CONTEÚDO PARA O ALUNO**

**1. Métricas Essenciais**

Monitore: latência P50/P95/P99, throughput (requests/segundo), error rate, GPU utilization, VRAM usage, cold start frequency, custo por request.

**2. Logging Estruturado**

Logue cada inferência: timestamp, input (hash/metadata, não dados sensíveis), output (resumo), latência, tokens processados, modelo/versão. Use JSON structured logging para análise.

**3. Alertas**

Configure alertas para: latência P95 acima do SLA, error rate > 1%, custo diário excedendo budget, GPU utilization < 20% (superprovisionado) ou > 90% (gargalo).

**4. A/B Testing de Modelos**

Compare versões de modelos em produção: roteie % de tráfego para modelo novo, compare métricas (qualidade, latência, custo), rollback automático se métricas degradam.

---

# MÓDULO 5: APIs — Criando Produtos

**MÓDULO 5: APIs E INTEGRAÇÕES**
**AULA 1: CONSTRUINDO PRODUTOS COM IA**

**Carga Horária:** 2 horas
**Indicadores Trabalhados:** 1. Criar API profissional sobre modelo; 2. Implementar autenticação e billing.

---

**CONTEÚDO PARA O ALUNO**

**1. API Gateway**

Coloque um gateway na frente do modelo: autenticação (API keys, OAuth2), rate limiting, request validation, response caching, billing/usage tracking. Use FastAPI, Express ou API Gateway cloud.

**2. Billing e Monetização**

Modelos de cobrança: por request (simples, previsível), por token (justo, complexo de comunicar), por minuto de processamento, subscription com quotas. Integre com Stripe para billing automático.

**3. Documentação e SDKs**

API profissional precisa: documentação OpenAPI/Swagger, SDKs em Python/JavaScript/curl, exemplos de uso, playground interativo, changelogs e versioning.

**4. Arquitetura Completa**

Cliente → API Gateway (auth, rate limit) → Queue (buffer de requests) → Workers (GPU instances) → Response → Cliente. Cache para requests repetidos. CDN para assets estáticos.

---

# MÓDULO 5: APIs — Integrações Práticas

**MÓDULO 5: APIs E INTEGRAÇÕES**
**AULA 2: INTEGRAÇÕES COM FERRAMENTAS**

**Carga Horária:** 2 horas
**Indicadores Trabalhados:** 1. Integrar modelos com ferramentas populares; 2. Criar pipelines end-to-end.

---

**CONTEÚDO PARA O ALUNO**

**1. Integração com n8n/Make**

Conecte seus modelos a automações: webhook trigger → preprocessing → chamada ao modelo → postprocessing → ação (email, Slack, database). Permite IA em qualquer workflow sem código.

**2. Integração com Frontend**

React/Next.js + API de modelo: streaming com SSE para respostas em tempo real, upload de imagens/áudio para processamento, progresso visual durante inferência.

**3. Integração com Chatbots**

Telegram Bot, Discord Bot, WhatsApp Business: conecte seu modelo como backend de conversação. User message → preprocessing → model inference → response formatting → send.

**4. Pipeline Multi-Modelo**

Combine modelos em pipelines: áudio → Whisper (transcrição) → LLM (análise) → TTS (resposta em voz). Ou: texto → LLM (prompt) → SDXL (imagem) → upscaler → delivery.

---

# MÓDULO 6: PRODUÇÃO — Escalabilidade

**MÓDULO 6: PRODUÇÃO E ESCALABILIDADE**
**AULA 1: ESCALANDO PARA MILHÕES DE REQUESTS**

**Carga Horária:** 2 horas
**Indicadores Trabalhados:** 1. Escalar inferência para alta demanda; 2. Gerenciar custos em escala.

---

**CONTEÚDO PARA O ALUNO**

**1. Auto-Scaling**

Configure scaling automático: min/max replicas, scaling triggers (queue depth, latência, GPU util), scale-to-zero (sem custo quando ocioso), warm instances para latência garantida.

**2. Multi-Region**

Para latência global baixa: deploy em múltiplas regiões, routing por geolocalização, failover automático, sincronização de versão do modelo.

**3. Gestão de Custos**

Em escala, custos podem explodir. Controle com: spot instances para batch (60-80% economia), reserved capacity para baseline, alertas de budget, auto-shutdown fora de horário, cache agressivo para requests repetidos.

**4. Disaster Recovery**

Plano de contingência: backups do modelo em múltiplos storages, fallback para modelo menor se GPU indisponível, health checks e auto-restart, comunicação de status para clientes.

---

# TEMPLATE: Deploy de LLM como API

**TEMPLATE — Deploy de LLM Serverless**

**Estrutura completa para deploy de Llama 3 8B como API:**

```python
# app.py
from vllm import LLM, SamplingParams

model = None

def init():
    global model
    model = LLM(model="meta-llama/Llama-3-8b-chat-hf", 
                quantization="awq", gpu_memory_utilization=0.9)

def handler(event):
    prompt = event.get("prompt", "")
    params = SamplingParams(temperature=0.7, max_tokens=512)
    output = model.generate([prompt], params)
    return {"text": output[0].outputs[0].text}
```

**Dockerfile, requirements.txt, e instruções de deploy incluídas.**

---

# EXERCÍCIO: Deploy de Stable Diffusion

**EXERCÍCIO PRÁTICO — API de Geração de Imagens**

**Duração:** 90 min | **Objetivo:** Deploy SDXL como API serverless

1. Configure Dockerfile com CUDA + PyTorch + Diffusers
2. Crie handler: recebe prompt → gera imagem → retorna base64
3. Adicione parâmetros: negative prompt, steps, guidance, seed
4. Teste localmente com Docker
5. Deploy na plataforma escolhida
6. Teste API com curl e Python client

---

# PROJETO FINAL: SaaS de IA

**PROJETO FINAL — Construa um SaaS de IA**

**Duração:** 8-10 horas | **Nível:** Avançado

**Entregáveis:**
1. **Modelo em produção** com API documentada
2. **Frontend** simples para demonstração
3. **Autenticação e billing** com Stripe
4. **Monitoramento** com métricas e alertas
5. **Documentação** completa (API, deploy, custos)

---

# Recursos Adicionais e Próximos Passos

Parabéns por completar **Banana Dev: Deploy de IA**!

**Próximos passos:**
1. Faça deploy do seu primeiro modelo
2. Explore novos modelos no Hugging Face
3. Ofereça MLOps como serviço
4. Construa SaaS com IA como diferencial

**Recursos:**
- [Hugging Face Hub](https://huggingface.co)
- [vLLM Documentation](https://docs.vllm.ai)
- [Modal Docs](https://modal.com/docs)
- Comunidade FayaPoint no Discord

**Suporte:** suporte@fayapoint.com | WhatsApp: +5521971908530
