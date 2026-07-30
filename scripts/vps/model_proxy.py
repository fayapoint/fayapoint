#!/usr/bin/env python3
"""Kirmes Model Proxy — duas rotas por custo (ambas via OpenRouter, direto).

REESTRUTURADO 20/07/2026 a pedido do Ricardo: a troca de 19/07 colocou o
Kimi K3 ($3/M in, $15/M out) como modelo de TUDO — inclusive os crons
agenticos pesados (auditoria de cursos 14h, TCH worldbuilding 13h, com
contextos de 65KB+ multi-turn) — e queimou ~$6 em um dia. Agora:

  - "kirmes-proxy"   (padrao)  -> PRIMARY_MODEL (Gemini 3 Flash Preview,
                                  $0.50/$3 por M — 5-6x mais barato) com
                                  fallback FALLBACK_MODEL (Gemini 2.5 Flash).
  - "kirmes-premium" (blog etc)-> PREMIUM_MODEL com fallback na cadeia barata.
                                  So tarefas explicitamente importantes pedem
                                  esta rota (fayai_news.py).

TROCA 29/07/2026 a pedido do Ricardo: PREMIUM_MODEL saiu do Kimi K3
(moonshotai/kimi-k3, $3/$15 por M, com aviso oficial da OpenRouter de
capacidade limitada) e passou a ser google/gemini-3.5-flash-lite
($0.30/$2.50 por M, contexto de 1M). ATENCAO ao ler este arquivo: a rota
"premium" agora e mais BARATA que a "padrao" — o nome virou legado e
significa apenas "a outra rota", nao "a rota cara". A rota foi mantida
para nao quebrar quem ja a chama pelo nome (fayai_news.py).

Historico: antes de 19/07 era LM Studio (Qwen3.6-27B, PC do Ricardo via
Tailscale) + free tier — o LM Studio ficou inacessivel por dias sem ninguem
perceber (causa raiz de "IA HOJE" parado 17-19/07) e o modelo free vazava
raciocinio no lugar do JSON pedido. Nao voltar para free tier.

O failover aqui e feito pela RESPOSTA real da chamada (status != 200), nao
por um health-check previo (um /v1/models saudavel nao garante que a chamada
de completion nao vai tomar 429 na hora). Isso nasceu do Kimi K3, que tinha
aviso oficial de capacidade limitada, mas vale para qualquer modelo."""
import httpx, os
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, JSONResponse

app = FastAPI(title="Kirmes Proxy")
OPENROUTER_URL = "https://openrouter.ai/api/v1"
OPENROUTER_KEY = os.getenv("OPENROUTER_KEY", "")
PRIMARY_MODEL = os.getenv("PRIMARY_MODEL", "google/gemini-3-flash-preview")
FALLBACK_MODEL = os.getenv("FALLBACK_MODEL", "google/gemini-2.5-flash")
PREMIUM_MODEL = os.getenv("PREMIUM_MODEL", "google/gemini-3.5-flash-lite")


def _headers():
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENROUTER_KEY}",
        "HTTP-Referer": "https://kirmes.fayai.com.br",
        "X-Title": "Kirmes",
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "primary": PRIMARY_MODEL,
        "fallback": FALLBACK_MODEL,
        "premium": PREMIUM_MODEL,
    }


@app.get("/v1/models")
async def models():
    return {
        "object": "list",
        "data": [
            {"id": "kirmes-proxy", "object": "model"},
            {"id": "kirmes-premium", "object": "model"},
            {"id": PRIMARY_MODEL, "object": "model"},
            {"id": FALLBACK_MODEL, "object": "model"},
            {"id": PREMIUM_MODEL, "object": "model"},
        ],
    }


@app.post("/v1/chat/completions")
async def chat(request: Request):
    body = await request.json()
    stream = body.get("stream", False)

    # rota premium (Gemini 3.5 Flash Lite) so quando o consumidor pede explicitamente
    if body.get("model") == "kirmes-premium":
        chain = (PREMIUM_MODEL, PRIMARY_MODEL, FALLBACK_MODEL)
    else:
        chain = (PRIMARY_MODEL, FALLBACK_MODEL)

    for model in chain:
        req_body = dict(body)
        req_body["model"] = model
        print(f"[Proxy] tentando {model} | stream={stream}", flush=True)

        if stream:
            client = httpx.AsyncClient(timeout=150.0)
            req = client.build_request(
                "POST", f"{OPENROUTER_URL}/chat/completions", json=req_body, headers=_headers()
            )
            resp = await client.send(req, stream=True)
            if resp.status_code == 200:
                print(f"[Proxy] -> {model} OK (stream)", flush=True)

                async def gen(c=client, r=resp):
                    try:
                        async for chunk in r.aiter_bytes():
                            yield chunk
                    finally:
                        await r.aclose()
                        await c.aclose()

                return StreamingResponse(gen(), media_type="text/event-stream")
            print(f"[Proxy] {model} falhou (status {resp.status_code})", flush=True)
            await resp.aclose()
            await client.aclose()
        else:
            async with httpx.AsyncClient(timeout=150.0) as client:
                r = await client.post(
                    f"{OPENROUTER_URL}/chat/completions", json=req_body, headers=_headers()
                )
            if r.status_code == 200:
                print(f"[Proxy] -> {model} OK", flush=True)
                return JSONResponse(r.json())
            print(f"[Proxy] {model} falhou (status {r.status_code}): {r.text[:200]}", flush=True)

    return JSONResponse(
        {"error": f"Todos os modelos da cadeia falharam ({', '.join(chain)})"},
        status_code=502,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=int(os.getenv("PROXY_PORT", "7860")), log_level="warning")
