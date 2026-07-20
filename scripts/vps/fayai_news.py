#!/usr/bin/env python3
"""FayAI News Agent — coleta noticias de IA (RSS), resume em pt-BR via
proxy Kirmes (LMStudio/OpenRouter), gera 1 capa especifica por materia via
ComfyUI (regra do espelho, IDENTIDADE_VISUAL.md §9) e publica na secao IA
HOJE do fayai.com.br. Roda diariamente via cron. Logs em
/root/kirmes/logs/fayai_news_*.log"""
import hashlib, json, os, re, time, urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime

PROXY = "http://127.0.0.1:7860/v1/chat/completions"
PUBLISH = "https://fayai.com.br/api/ainews/publish"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36 FayAINewsAgent"

# FIX 19/07/2026: o proxy kirmes (LMStudio -> OpenRouter free) ficou 3 dias
# quebrado (16/07 ok, 17-19/07 falhando) porque o LMStudio do PC do Ricardo
# ficou inacessivel (confirmado: http://100.84.253.67:1234 nao responde) e o
# fallback gratis do OpenRouter (nvidia/nemotron-3-super-120b-a12b:free) e um
# modelo de raciocinio que vaza o "pensamento" direto no campo content, sem
# nunca terminar com o JSON pedido — o proxy so repassa a resposta, sem
# tratar isso. Ultimo recurso deste script (alem do proprio failover do
# proxy, que agora tenta Kimi K3 -> Gemini 3 Flash Preview): chamada DIRETA
# a Gemini 3 Flash Preview, caso o proxy inteiro fique fora do ar.
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
FALLBACK_MODEL = "google/gemini-3-flash-preview"

FEEDS = [
    ("The Verge", "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml"),
    ("TechCrunch", "https://techcrunch.com/category/artificial-intelligence/feed/"),
    ("VentureBeat", "https://venturebeat.com/category/ai/feed/"),
]

# Estilo §12.1 do IDENTIDADE_VISUAL.md — mesmo pipeline/sufixo usado em
# generate_abundance.py e generate_blog_pool.py (9.5/10 aprovado).
FUSION_SUFFIX = (", an adorable glossy flat-vector robot mascot with big cute eyes naturally interacting inside a "
                  "breathtaking cinematic photorealistic scene, seamless style fusion, dramatic film lighting, "
                  "shallow depth of field, bokeh, deep dark navy blue atmosphere, rich cinematic color grading, "
                  "professional photography, high detail, no text, no letters, no logos, no watermark")
VALID_GLOWS = {"cyan", "violet", "rose", "lime", "gold"}

def load_env():
    values = {}
    with open("/root/kirmes/.env.fayai") as f:
        for line in f:
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                values[k.strip()] = v.strip()
    return values

def fetch(url, timeout=20):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    return urllib.request.urlopen(req, timeout=timeout).read()

def parse_feed(source, raw):
    items = []
    try:
        root = ET.fromstring(raw)
    except ET.ParseError:
        return items
    # RSS 2.0
    for it in root.iter("item"):
        t, l = it.findtext("title"), it.findtext("link")
        if t and l:
            items.append({"source": source, "title": t.strip(), "url": l.strip()})
    # Atom
    ns = "{http://www.w3.org/2005/Atom}"
    for it in root.iter(f"{ns}entry"):
        t = it.findtext(f"{ns}title")
        link = it.find(f"{ns}link")
        l = link.get("href") if link is not None else None
        if t and l:
            items.append({"source": source, "title": t.strip(), "url": l.strip()})
    return items[:6]

def build_prompt(headlines):
    lista = "\n".join(f"- [{h['source']}] {h['title']} | {h['url']}" for h in headlines)
    return (
        "Voce e o editor da secao 'IA HOJE' do fayai.com.br, um site brasileiro que ensina "
        "inteligencia artificial para pessoas comuns. Da lista de manchetes de hoje abaixo, "
        "escolha as 3 MAIS relevantes/interessantes para brasileiros aprendendo IA (evite fofoca "
        "corporativa e financas; prefira ferramentas novas, capacidades novas e tendencias praticas).\n\n"
        f"{lista}\n\n"
        "Responda APENAS com JSON valido (sem markdown, sem cercas de codigo): uma lista de 3 objetos "
        "com os campos: slug (kebab-case curto), tag (UMA palavra ou expressao curta em caixa alta, ex: "
        "TENDENCIA, FERRAMENTAS, MODELOS, VOCE SABIA?), title (titulo REESCRITO em portugues do Brasil, "
        "max 70 caracteres, claro e chamativo sem clickbait), summary (resumo didatico em pt-BR, 160 a 220 "
        "caracteres, explicando POR QUE importa para quem esta aprendendo IA), url (a url original da "
        "manchete escolhida), source (o nome do veiculo), body (lista de EXATAMENTE 5 paragrafos em pt-BR, "
        "350 a 550 caracteres cada: 1º o que aconteceu em linguagem simples; 2º o contexto/por que agora; "
        "3º por que importa para quem aprende/usa IA no Brasil; 4º um exemplo pratico de uso ou impacto; "
        "5º conselho pratico e o que observar a seguir), "
        "image_prompt (EM INGLES — uma cena visual CONCRETA e especifica que ENCENE exatamente o que "
        "essa materia diz, nao uma ilustracao generica do tema. Regra: nomeie (1) um objeto-palco real "
        "reconhecivel — tela de celular, laptop, mesa, prateleira, o que fizer sentido — (2) o que "
        "aparece especificamente NELE relacionado a esta noticia, (3) o resultado/acao da materia. "
        "Formato: 'real [objeto-palco] showing [conteudo especifico desta noticia], [acao/resultado "
        "concreto]'. Ex: se a materia e sobre um app de musica treinado com IA, NAO escreva 'a music "
        "studio' generico — escreva algo como 'real laptop screen showing a music waveform app with AI "
        "generating a new track, headphones on the desk'. Nada de texto legivel dentro da cena), "
        "glow (uma destas palavras exatas: cyan, violet, rose, lime, gold — a que combinar com o tom da "
        "materia)."
    )

def message_text(message):
    # FIX 19/07/2026: com o Kimi K3 (modelo de raciocinio "pensa" bastante
    # antes de responder), a resposta as vezes vem com content=None e o
    # texto real dentro de reasoning — se so lermos content cegamente isso
    # quebra com "expected string or bytes-like object, got NoneType" em vez
    # de cair no fallback direito. Aqui tratamos os dois casos.
    content = message.get("content")
    if isinstance(content, str) and content.strip():
        return content
    reasoning = message.get("reasoning")
    if isinstance(reasoning, str) and reasoning.strip():
        return reasoning
    return ""

def extract_json(text):
    # tolera cercas de codigo e reasoning vazado (de modelos R1/Qwen/Nemotron
    # que as vezes nao terminam o <think> ou escrevem o raciocinio direto no
    # content sem tag nenhuma — nesse caso nao ha "]" de lista real e isto
    # simplesmente falha, o que e correto: melhor falhar e cair no fallback
    # do que tentar adivinhar JSON de dentro de um paragrafo de raciocinio).
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.S)
    m = re.search(r"\[.*\]", text, flags=re.S)
    if not m:
        raise ValueError(f"LLM nao retornou JSON: {text[:200]}")
    return json.loads(m.group(0))

def call_proxy(prompt, max_tokens=12000):
    body = json.dumps({
        "model": "kirmes-proxy",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.4,
        "max_tokens": max_tokens,
    }).encode()
    req = urllib.request.Request(PROXY, data=body, headers={"Content-Type": "application/json"})
    # o proxy tenta ate 2 modelos internamente (~150s cada) antes de responder
    resp = json.loads(urllib.request.urlopen(req, timeout=320).read())
    if "choices" not in resp:
        raise ValueError(f"proxy sem choices: {json.dumps(resp)[:250]}")
    return message_text(resp["choices"][0]["message"])

def call_openrouter_direct(prompt, api_key, max_tokens=8000):
    body = json.dumps({
        "model": FALLBACK_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.4,
        "max_tokens": max_tokens,
    }).encode()
    req = urllib.request.Request(
        OPENROUTER_URL, data=body,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}",
                 "HTTP-Referer": "https://fayai.com.br", "X-Title": "FayAI News"},
    )
    resp = json.loads(urllib.request.urlopen(req, timeout=120).read())
    if "choices" not in resp:
        raise ValueError(f"openrouter direto sem choices: {json.dumps(resp)[:250]}")
    return message_text(resp["choices"][0]["message"])

def llm(headlines, openrouter_key=None):
    prompt = build_prompt(headlines)

    # FIX 19/07/2026: a versao anterior so re-tentava se a resposta nao
    # tivesse "choices" — se viesse com choices mas o content fosse
    # raciocinio vazado (sem JSON valido), ela desistia na hora, fora do
    # loop de retry. Agora o ciclo completo (chamada + extracao) e
    # re-tentado. O proprio proxy ja tenta 2 modelos internamente (Kimi K3 ->
    # Gemini 3 Flash Preview, ate ~100s cada) — por isso aqui bastam 2
    # tentativas (cobre uma falha transitoria de rede/timeout do proxy
    # inteiro), nao 3, senao o pior caso passa de 10 minutos. Se o proxy
    # falhar mesmo assim, cai para uma chamada direta ao fallback (testado
    # sem vazamento de raciocinio) em vez de so desistir e deixar o Blog IA
    # Hoje parado sem ninguem perceber.
    import time as _t
    last_err = None
    for attempt in range(2):
        try:
            text = call_proxy(prompt)
            return extract_json(text)
        except Exception as e:
            last_err = e
            print(f"[llm] tentativa {attempt+1} via proxy falhou: {e}")
            _t.sleep(10)

    if openrouter_key:
        print(f"[llm] proxy esgotou tentativas, caindo para fallback direto ({FALLBACK_MODEL})")
        try:
            text = call_openrouter_direct(prompt, openrouter_key)
            return extract_json(text)
        except Exception as e:
            last_err = e
            print(f"[llm] fallback direto tambem falhou: {e}")

    raise ValueError(f"LLM falhou apos proxy + fallback: {last_err}")

OG_RE = re.compile(r"<meta[^>]+property=[\"']og:image[\"'][^>]+content=[\"']([^\"']+)[\"']", re.I)
OG_RE2 = re.compile(r"<meta[^>]+content=[\"']([^\"']+)[\"'][^>]+property=[\"']og:image[\"']", re.I)

def og_image(url):
    try:
        html = fetch(url, timeout=15).decode("utf-8", "ignore")[:200000]
        m = OG_RE.search(html) or OG_RE2.search(html)
        if m and m.group(1).startswith("http"):
            return m.group(1)
    except Exception as e:
        print(f"[og] {url[:60]} falhou: {e}")
    return None

def _comfy_workflow(prompt_text, prefix, seed):
    # Mesmo workflow/params de generate_abundance.py e generate_blog_pool.py
    # (Qwen 2512 fp8 + Lightning 4-steps, 1152x768, ~14s/img).
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "qwen_image_2512_fp8_e4m3fn.safetensors", "weight_dtype": "default"}},
        "1b": {"class_type": "LoraLoaderModelOnly", "inputs": {"lora_name": "Qwen-Image-2512-Lightning-4steps-V1.0-fp32.safetensors", "strength_model": 1.0, "model": ["1", 0]}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_2.5_vl_7b_fp8_scaled.safetensors", "type": "qwen_image", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_vae.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt_text, "clip": ["2", 0]}},
        "5": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["4", 0]}},
        "6": {"class_type": "EmptySD3LatentImage", "inputs": {"width": 1152, "height": 768, "batch_size": 1}},
        "7": {"class_type": "KSampler", "inputs": {"seed": seed, "control_after_generate": "fixed", "steps": 4, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": 1, "model": ["1b", 0], "positive": ["4", 0], "negative": ["5", 0], "latent_image": ["6", 0]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["7", 0], "vae": ["3", 0]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["8", 0]}},
    }

def generate_cover_png(image_prompt, glow, slug, bridge_url, bridge_secret, timeout=90):
    """Gera 1 imagem via ComfyUI (atraves do comfy-bridge no PC do Ricardo) e
    retorna os bytes do PNG. Lanca excecao se o bridge/ComfyUI nao responder
    a tempo — quem chama deve tratar isso como 'sem capa especifica hoje'."""
    prompt_text = f"{image_prompt}, {glow} glow" + FUSION_SUFFIX
    prefix = f"ainews/{datetime.now():%Y%m%d}_{slug}"
    seed = int(time.time()) % 1_000_000
    wf = _comfy_workflow(prompt_text, prefix, seed)

    def bridge_call(path, data=None, method="GET"):
        req = urllib.request.Request(
            f"{bridge_url}{path}", data=data, method=method,
            headers={"Content-Type": "application/json", "x-comfy-secret": bridge_secret},
        )
        return urllib.request.urlopen(req, timeout=30)

    submit_body = json.dumps({"prompt": wf}).encode()
    prompt_id = json.loads(bridge_call("/prompt", submit_body, "POST").read())["prompt_id"]

    t0 = time.time()
    outfile = None
    while time.time() - t0 < timeout:
        history = json.loads(bridge_call(f"/history/{prompt_id}").read())
        entry = history.get(prompt_id)
        if entry and entry.get("status", {}).get("completed"):
            outputs = entry.get("outputs", {}).get("9", {}).get("images", [])
            if outputs:
                outfile = outputs[0]
            break
        time.sleep(2)

    if not outfile:
        raise TimeoutError(f"ComfyUI nao terminou a imagem de '{slug}' em {timeout}s")

    qs = f"filename={outfile['filename']}&subfolder={outfile.get('subfolder', '')}&type={outfile.get('type', 'output')}"
    return bridge_call(f"/view?{qs}").read()

def upload_to_cloudinary(png_bytes, public_id, cloud_name, api_key, api_secret):
    """Upload assinado direto pra API REST da Cloudinary (sem SDK — o script
    roda fora do Next.js). Retorna a URL final ja com transformacao pro
    padrao do site (768 largura, qualidade 80, webp — IDENTIDADE_VISUAL.md §4)."""
    timestamp = str(int(time.time()))
    folder = "fayapoint/ainews"
    # Cloudinary assina TODOS os parametros enviados (exceto file/cloud_name/
    # api_key/resource_type), em ordem alfabetica de chave. Faltou public_id
    # aqui na primeira versao — por isso todo upload voltava 401.
    to_sign = f"folder={folder}&public_id={public_id}&timestamp={timestamp}{api_secret}"
    signature = hashlib.sha1(to_sign.encode()).hexdigest()

    boundary = "----fayainewsBoundary"
    fields = {"api_key": api_key, "timestamp": timestamp, "signature": signature,
              "folder": folder, "public_id": public_id}
    parts = []
    for k, v in fields.items():
        parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n")
    body = "".join(parts).encode()
    body += (f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{public_id}.png\"\r\n"
              "Content-Type: image/png\r\n\r\n").encode() + png_bytes + f"\r\n--{boundary}--\r\n".encode()

    req = urllib.request.Request(
        f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload",
        data=body, method="POST",
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    result = json.loads(urllib.request.urlopen(req, timeout=60).read())
    return f"https://res.cloudinary.com/{cloud_name}/image/upload/w_768,q_80,f_webp/{result['public_id']}"

def publish(items, secret):
    body = json.dumps({"items": items}).encode()
    req = urllib.request.Request(
        PUBLISH, data=body, method="POST",
        headers={"Content-Type": "application/json", "x-ainews-secret": secret, "User-Agent": UA},
    )
    return json.loads(urllib.request.urlopen(req, timeout=30).read())

def log_activity(status, notes):
    # FIX 19/07/2026: campos errados (agentId/agentName/status/notes) faziam
    # a API /api/activity/log rejeitar TODO POST com 400 (exige agent+action)
    # — ou seja, sucesso e falha ficavam igualmente invisiveis no dashboard.
    # E exatamente por isso que a quebra de 17-19/07 passou 3 dias sem
    # ninguem perceber. Mesmo fix ja aplicado hoje nos scripts do kirmes.
    try:
        ok = status == "success"
        body = json.dumps({
            "agent": "Kirmes", "agentEmoji": "⚡",
            "action": f"IA HOJE — noticias diarias: {notes}" if ok else f"IA HOJE FALHOU: {notes}",
            "type": "task" if ok else "system",
        }).encode()
        req = urllib.request.Request("https://mc-faya-dashboard.netlify.app/api/activity/log",
                                     data=body, headers={"Content-Type": "application/json", "User-Agent": UA})
        urllib.request.urlopen(req, timeout=15).read()
    except Exception:
        pass

def main():
    env = load_env()
    secret = env.get("AINEWS_SECRET")
    if not secret:
        raise SystemExit("AINEWS_SECRET nao encontrado")
    openrouter_key = env.get("OPENROUTER_KEY")
    bridge_url = env.get("COMFY_BRIDGE_URL")
    bridge_secret = env.get("COMFY_BRIDGE_SECRET")
    cloud_name = env.get("CLOUDINARY_CLOUD_NAME")
    cloud_key = env.get("CLOUDINARY_API_KEY")
    cloud_secret = env.get("CLOUDINARY_API_SECRET")
    can_generate_covers = all([bridge_url, bridge_secret, cloud_name, cloud_key, cloud_secret])

    headlines = []
    for source, url in FEEDS:
        try:
            headlines += parse_feed(source, fetch(url))
        except Exception as e:
            print(f"[feed] {source} falhou: {e}")
    if len(headlines) < 3:
        raise SystemExit(f"So {len(headlines)} manchetes coletadas — abortando")
    print(f"[feeds] {len(headlines)} manchetes")
    items = llm(headlines[:15], openrouter_key)
    print(f"[llm] {len(items)} itens: " + ", ".join(i.get("slug", "?") for i in items))

    for it in items[:3]:
        if it.get("url"):
            img = og_image(it["url"])
            if img:
                it["sourceImage"] = img

        # Capa especifica por materia (regra do espelho, §9) — se o bridge/
        # ComfyUI/Cloudinary nao responder, NAO trava o script: a materia
        # publica sem `image` e cai no pool generico por editoria como
        # reserva (ai-news.ts artForTag), em vez de perder a publicacao do
        # dia inteira por causa de uma imagem.
        image_prompt = it.get("image_prompt")
        glow = it.get("glow") if it.get("glow") in VALID_GLOWS else "cyan"
        if can_generate_covers and image_prompt:
            try:
                png = generate_cover_png(image_prompt, glow, it.get("slug", "capa"), bridge_url, bridge_secret)
                url = upload_to_cloudinary(png, it.get("slug", "capa"), cloud_name, cloud_key, cloud_secret)
                it["image"] = url
                print(f"[cover] {it.get('slug')}: {url}")
            except Exception as e:
                print(f"[cover] {it.get('slug')} falhou, usando pool generico: {e}")
        elif not can_generate_covers:
            print("[cover] comfy-bridge/cloudinary nao configurados — usando pool generico")

    result = publish(items[:3], secret)
    print(f"[publish] {result}")
    log_activity("success", f"{datetime.now():%Y-%m-%d} — {result.get('published', 0)} noticias publicadas")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"[ERRO] {e}")
        log_activity("error", str(e)[:150])
        raise
