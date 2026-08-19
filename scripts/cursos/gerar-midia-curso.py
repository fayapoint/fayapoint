# -*- coding: utf-8 -*-
"""
O GERADOR UNICO de midia inline de curso — parametrizado por slug.

## Por que ele existe

16/08/2026. Havia DEZ geradores quase identicos (2.282 linhas somadas), um fork
por curso, cada um com a constante `FUSION` copiada literalmente e o slug
cravado no caminho de saida. Fazer os 16 cursos que faltam por esse caminho
criaria mais 16 forks e espalharia a identidade visual por 30 arquivos.

Aqui o curso e um ARGUMENTO. O que muda por curso — capitulos, legendas,
prompts — vem do plano em `cursos/planos/<slug>.json`, produzido por
`cursos/plano-midia-curso.mjs`, que por sua vez le o `courseContent` do Mongo.

    node --env-file=fayapoint-ai/.env.local cursos/plano-midia-curso.mjs <slug> --gravar
    python fayapoint-ai/scripts/cursos/gerar-midia-curso.py <slug>

## Paralelismo — como dois terminais nao brigam

A GPU e uma so, mas os dois estagios usam modelos diferentes e o gargalo e o
VIDEO (serial, ~90s cada) enquanto IMAGEM e rapida e enfileiravel em lote.
Entao a divisao que funciona e por ESTAGIO, nao por curso:

    terminal 1:  ... gerar-midia-curso.py <slug> --so-imagens
    terminal 2:  ... gerar-midia-curso.py <slug> --so-videos     (comeca depois)

E entre cursos, por FAIXA DE CAPITULOS:

    ... gerar-midia-curso.py <slug> --caps 1-15
    ... gerar-midia-curso.py <slug> --caps 16-30

⚠️ Tudo e RETOMAVEL: o que ja existe no disco e pulado. Matar e reabrir nao
perde trabalho, e rodar duas vezes nao duplica.

## Escolha de modelo — e por que NAO troquei o de imagem

IMAGEM: `qwen_image_2512` + LoRA Lightning 4 passos. Ha modelos mais novos
instalados (`z_image_turbo`, `flux-2-klein-9b`, `ernie-image-turbo`), mas as
~1.080 imagens ja publicadas dos 6 cursos verdes sairam do Qwen 2512. Trocar
agora faria os 16 cursos novos nao casarem com os 6 antigos — e consistencia
visual entre cursos e exatamente o que a identidade do mascote existe para
garantir. Novidade aqui seria regressao.

VIDEO: **LTX 2.5** (`ltx-2.5-22b-distilled-transformer-comfy-int8-convrot`),
via o grafo pronto em `~/.claude/skills/comfy-video/scripts/ltx25_i2v.mjs`.
Esse SIM foi atualizado: a biblioteca antiga e LTX 2.3. Um clipe de 5s nao
carrega identidade de estilo do jeito que uma imagem parada carrega, entao o
ganho de qualidade vale o degrau. ⚠️ O LTX 2.5 mora em `diffusion_models`
(`UNETLoader`), nao em checkpoints — por isso "some" de `CheckpointLoaderSimple`.
"""
import json, shutil, subprocess, sys, time, urllib.request, urllib.error
from pathlib import Path

API = "http://127.0.0.1:8000"
RAIZ = Path(__file__).resolve().parents[3]          # .../autoresearch
PLANOS = RAIZ / "cursos" / "planos"
LTX25 = Path.home() / ".claude" / "skills" / "comfy-video" / "scripts" / "ltx25_i2v.mjs"
SAIDA_COMFY = Path("C:/WORKS/ComfyUI/output")
# O `LoadImage` so enxerga o que esta aqui dentro.
ENTRADA_COMFY = Path("C:/WORKS/ComfyUI/input")

NEGATIVO = ("blurry, low quality, still frame, watermark, text, letters, numbers, signage, "
            "deformed, glitch, jitter, extra limbs, duplicated character")

# ── argumentos ──────────────────────────────────────────────────────────────
args = sys.argv[1:]
if not args:
    print(__doc__)
    sys.exit(1)
SLUG = args[0]
SO_IMAGENS = "--so-imagens" in args
SO_VIDEOS = "--so-videos" in args


def opcao(nome, padrao=None):
    if nome in args:
        i = args.index(nome)
        if i + 1 < len(args):
            return args[i + 1]
    return padrao


faixa = opcao("--caps")
CAP_INI, CAP_FIM = (1, 9999)
if faixa:
    partes = faixa.split("-")
    CAP_INI = int(partes[0])
    CAP_FIM = int(partes[1]) if len(partes) > 1 else CAP_INI

plano_arq = PLANOS / f"{SLUG}.json"
if not plano_arq.exists():
    print(f"Falta o plano: {plano_arq}\n"
          f"Rode antes:  node --env-file=fayapoint-ai/.env.local cursos/plano-midia-curso.mjs {SLUG} --gravar")
    sys.exit(1)

plano = [p for p in json.loads(plano_arq.read_text(encoding="utf-8"))
         if CAP_INI <= p["capitulo"] <= CAP_FIM]
DESTINO = SAIDA_COMFY / "course_media" / SLUG / "inline"
DESTINO.mkdir(parents=True, exist_ok=True)


def post(rota, corpo):
    req = urllib.request.Request(API + rota, data=json.dumps(corpo).encode(),
                                 headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read())


def livre_vram():
    try:
        post("/free", {"unload_models": True, "free_memory": True})
    except Exception:
        pass


def ja_tem_imagem(nome):
    return bool(list(DESTINO.glob(f"{nome}_*.png")) or list(DESTINO.glob(f"{nome}.png")))


def ja_tem_video(nome):
    return bool(list(DESTINO.glob(f"{nome}-video*.mp4")))


def grafo_imagem(prompt_txt, prefixo, seed):
    """Qwen 2512 + Lightning 4 passos. cfg 1.0 porque o LoRA distilado dispensa guidance."""
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "qwen_image_2512_fp8_e4m3fn.safetensors", "weight_dtype": "default"}},
        "1b": {"class_type": "LoraLoaderModelOnly", "inputs": {"lora_name": "Qwen-Image-2512-Lightning-4steps-V1.0-fp32.safetensors", "strength_model": 1.0, "model": ["1", 0]}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_2.5_vl_7b_fp8_scaled.safetensors", "type": "qwen_image", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_vae.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt_txt, "clip": ["2", 0]}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"text": NEGATIVO, "clip": ["2", 0]}},
        "6": {"class_type": "EmptySD3LatentImage", "inputs": {"width": 1152, "height": 640, "batch_size": 1}},
        "7": {"class_type": "KSampler", "inputs": {"seed": seed, "control_after_generate": "fixed", "steps": 4, "cfg": 1.0,
                                                    "sampler_name": "euler", "scheduler": "simple", "denoise": 1,
                                                    "model": ["1b", 0], "positive": ["4", 0], "negative": ["5", 0], "latent_image": ["6", 0]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["7", 0], "vae": ["3", 0]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": f"course_media/{SLUG}/inline/{prefixo}", "images": ["8", 0]}},
    }


def concluido(pid):
    try:
        h = json.loads(urllib.request.urlopen(f"{API}/history/{pid}").read())
        return pid in h and bool(h[pid].get("status", {}).get("completed"))
    except Exception:
        return False


# ── Fase A: imagens (enfileira tudo, colhe no fim) ──────────────────────────
if not SO_VIDEOS:
    livre_vram()
    fila = []
    for p in plano:
        nome = p["arquivo"]
        if ja_tem_imagem(nome):
            continue
        seed = 7400 + p["capitulo"] * 10 + ["sistema", "intencao", "fluxo", "cenario", "validacao", "dica"].index(p["slot"])
        pid = post("/prompt", {"prompt": grafo_imagem(p["imagePrompt"], nome, seed)})["prompt_id"]
        fila.append((pid, nome))
    print(f"IMAGENS: {len(fila)} na fila ({len(plano) - len(fila)} ja no disco)", flush=True)

    prontas, t0 = set(), time.time()
    while len(prontas) < len(fila) and time.time() - t0 < 10800:
        for pid, nome in fila:
            if pid not in prontas and concluido(pid):
                prontas.add(pid)
                if len(prontas) % 10 == 0 or len(prontas) == len(fila):
                    print(f"  img {len(prontas)}/{len(fila)} — {int(time.time()-t0)}s", flush=True)
        if len(prontas) < len(fila):
            time.sleep(6)
    print(f"IMAGENS OK {len(prontas)}/{len(fila)}", flush=True)

# ── Fase B: videos (serial — 5 min de GPU cada, um por vez) ─────────────────
if not SO_IMAGENS:
    livre_vram()
    videos = [p for p in plano if p["tipo"] == "video"]
    feitos = 0
    for p in videos:
        nome = p["arquivo"]
        if ja_tem_video(nome):
            feitos += 1
            continue
        bases = sorted(DESTINO.glob(f"{nome}_*.png"), key=lambda x: x.stat().st_mtime)
        if not bases:
            print(f"  [{nome}] SEM quadro base — gere a imagem primeiro", flush=True)
            continue
        # ⚠️ VIDEO E IMAGEM->VIDEO: sem quadro inicial o LTX nao tem de onde partir,
        # e o resultado perde a identidade do mascote que a imagem ja fixou.
        #
        # ⚠️⚠️ O `LoadImage` do ComfyUI resolve o nome DENTRO da pasta `input/`,
        # nao aceita caminho absoluto. Passando o caminho do arquivo em
        # `output/`, os 60 videos do curso de pesquisa foram REJEITADOS de uma
        # vez, todos com `prompt_outputs_failed_validation` no no 10 — e a fase
        # terminou em segundos, parecendo sucesso. Por isso o quadro base e
        # copiado para `input/course_media/<slug>/` e o que vai no grafo e o
        # caminho RELATIVO.
        entrada_rel = f"course_media/{SLUG}/{nome}.png"
        entrada_abs = ENTRADA_COMFY / entrada_rel
        entrada_abs.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(bases[-1], entrada_abs)
        cmd = ["node", str(LTX25),
               "--imagem", entrada_rel,
               "--prompt", p["videoPrompt"],
               "--neg", NEGATIVO,
               "--segundos", "5",
               "--saida", f"course_media/{SLUG}/inline/{nome}-video"]
        t = time.time()
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode != 0:
            print(f"  [{nome}] REJEITADO: {r.stderr[:200]}", flush=True)
            continue
        pid = None
        for pedaco in r.stdout.split():
            if pedaco.startswith("id="):
                pid = pedaco[3:]
        if not pid:
            print(f"  [{nome}] sem prompt_id: {r.stdout[:160]}", flush=True)
            continue
        while not concluido(pid) and time.time() - t < 1800:
            time.sleep(5)
        feitos += 1
        print(f"  [{nome}] pronto em {int(time.time()-t)}s ({feitos}/{len(videos)})", flush=True)

print(f"\n{SLUG}: fase concluida. Proximo:")
print(f"  node fayapoint-ai/scripts/cursos/publicar-midia-curso.mjs {SLUG} --apply")
