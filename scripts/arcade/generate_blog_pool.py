# -*- coding: utf-8 -*-
"""
Pool de capas do Blog IA Hoje — 20/07/2026.
50 imagens novas, ~4-6 por editoria, no estilo §12.1 (IDENTIDADE_VISUAL.md):
mascote vetorial fofo fundido em cena fotorrealista cinematografica (Qwen 2512 +
Lightning, ~14s/img). Adaptado de generate_abundance.py (14/07/2026, 9.5/10) --
mesmo pipeline, mesmo sufixo FUSION, mesmo workflow ComfyUI.

Motivo: BLOG_COVERS em ai-news.ts retornava sempre a MESMA imagem por editoria
(Ricardo notou repeticao) -- este pool alimenta um sorteio por editoria em vez
de uma unica capa fixa.
"""
import json, time, urllib.request

API = "http://localhost:8000"
DATE = "20260720"
BASE_SEED = 5500

FUSION = (", an adorable glossy flat-vector robot mascot with big cute eyes naturally interacting inside a "
          "breathtaking cinematic photorealistic scene, seamless style fusion, dramatic film lighting, shallow "
          "depth of field, bokeh, deep dark navy blue atmosphere, rich cinematic color grading, professional "
          "photography, high detail, no text, no letters, no logos, no watermark")

# (categoria, slug-descritivo, cena) -- a cena segue a regra do espelho (§9):
# encena uma acao concreta plausivel de materia dessa editoria, nao generica.
POOL = [
    # TENDENCIA (4)
    ("tendencia", "radar-tempestade", "real weather radar screen glowing in a control room, the mascot pointing at a swirling storm-shaped icon representing a rising AI trend, cyan glow"),
    ("tendencia", "prancha-onda", "real surfboard on a real beach at dawn, a glowing wave pattern rising higher and higher behind the mascot riding it, violet glow"),
    ("tendencia", "jornal-seta", "real financial newspaper front page on a cafe table, a glowing upward arrow breaking through the print, mascot pointing excitedly, gold glow"),
    ("tendencia", "estufa-muda", "real greenhouse with young real seedlings, one pot glowing and growing impossibly fast into a bright sapling, mascot watering it, lime glow"),
    # FERRAMENTAS (4)
    ("ferramentas", "caixa-ferramentas", "real toolbox open on a real workbench, tools rearranging themselves into a glowing new gadget, mascot tinkering, cyan glow"),
    ("ferramentas", "batedeira-magica", "real kitchen counter with real utensils, one whisk glowing and stirring a bowl on its own, mascot chef hat, rose glow"),
    ("ferramentas", "oficina-bike", "real bicycle repair shop, a wrench glowing and tightening a bolt by itself, mascot mechanic overalls, cyan glow"),
    ("ferramentas", "prateleira-loja", "real hardware store aisle, one shelf item glowing brighter than the rest calling attention, mascot recommending it, violet glow"),
    # NEGOCIOS (4)
    ("negocios", "sala-reuniao", "real boardroom table with real coffee cups, a glowing presentation hologram rising from a laptop, mascot presenting confidently, gold glow"),
    ("negocios", "planilha-grafico", "real accountant desk with real ledger books, numbers turning into a glowing rising bar chart, mascot accountant visor, cyan glow"),
    ("negocios", "aperto-mao-contrato", "real handshake between two real business people blurred in foreground, a glowing deal contract sealing behind them, tiny mascot cheering, gold glow"),
    ("negocios", "vitrine-esgotado", "real small shop storefront window at night, a glowing sold-out sign appearing, mascot shopkeeper proud, lime glow"),
    # PESQUISA (4)
    ("pesquisa", "laboratorio-proveta", "real laboratory bench with real beakers, one beaker glowing with swirling data instead of liquid, mascot researcher goggles, violet glow"),
    ("pesquisa", "observatorio-constelacao", "real observatory dome open to a real night sky, a glowing constellation forming a lightbulb shape, mascot astronomer, cyan glow"),
    ("pesquisa", "arquivo-gaveta", "real dusty archive room with real filing cabinets, one drawer glowing and revealing a golden discovery scroll, mascot archivist, gold glow"),
    ("pesquisa", "microscopio-padrao", "real microscope on a real lab table, the lens revealing a glowing intricate pattern instead of cells, mascot scientist, violet glow"),
    # MERCADO (4)
    ("mercado", "feira-etiqueta", "real open-air Brazilian street market stalls, one stall's price tag glowing and updating in real time, mascot vendor, lime glow"),
    ("mercado", "leilao-martelo", "real auction house podium with a real gavel, a glowing bidding number rising fast, mascot auctioneer, gold glow"),
    ("mercado", "porto-contentor", "real shipping port with real containers, one container glowing and opening to reveal a bright new market map, mascot dockworker, cyan glow"),
    ("mercado", "tablet-cafe", "real tablet propped on a real cafe table showing a glowing marketplace app interface, mascot shopping happily, rose glow"),
    # FUTURO (4)
    ("futuro", "portal-campo", "real vintage doorway standing alone in a real field, a glowing futuristic city visible through it, mascot stepping through curiously, violet glow"),
    ("futuro", "relogio-bolso", "real antique pocket watch on a real wooden table, its gears glowing and spinning impossibly fast, mascot peeking inside, cyan glow"),
    ("futuro", "rampa-lancamento", "real launch pad at dawn, a small toy-like rocket glowing with anticipation before liftoff, mascot waving goodbye, gold glow"),
    ("futuro", "arvore-fruto", "real ancient tree in a real park, its branches glowing and sprouting tiny futuristic gadget-fruits, mascot climbing, lime glow"),
    # EDUCACAO (4)
    ("educacao", "quadro-negro", "real classroom chalkboard, chalk equations turning into glowing friendly diagrams, mascot teacher pointer, violet glow"),
    ("educacao", "mochila-saberes", "real school backpack open on a real desk, glowing knowledge sparkles floating out of it, mascot student excited, cyan glow"),
    ("educacao", "formatura-gramado", "real graduation cap and diploma on a real lawn, glowing confetti of tiny lightbulbs, mascot proud graduate, gold glow"),
    ("educacao", "cantinho-leitura", "real children's reading corner with real bean bags, an open book glowing with floating story characters, mascot reading aloud, rose glow"),
    # SAUDE (4)
    ("saude", "consultorio-batimento", "real doctor's office with a real stethoscope on the desk, a glowing friendly heartbeat line on a screen, mascot doctor coat, cyan glow"),
    ("saude", "farmacia-lembrete", "real pharmacy shelf with real medicine boxes, one box glowing with a helpful reminder icon, mascot pharmacist, lime glow"),
    ("saude", "corrida-parque", "real park jogging path at sunrise, a glowing pace tracker trail following a runner, mascot jogging alongside, lime glow"),
    ("saude", "quarto-sono", "real cozy bedroom at night, a glowing gentle sleep-wave graphic above the bed, mascot tucking in a nightlight, violet glow"),
    # ETICA (4)
    ("etica", "espelho-antigo", "real antique mirror in a real room, the reflection showing a glowing fair-and-balanced version of the mascot, gold glow"),
    ("etica", "cofre-dados", "real bank safe deposit box room, one box glowing protectively around a tiny data symbol, mascot guardian, cyan glow"),
    ("etica", "banco-decisao", "real park bench under a real tree, glowing branching decision paths drawn in light above it, mascot thinking, violet glow"),
    ("etica", "farol-bussola", "real lighthouse on a real cliff at dusk, its beam glowing as a guiding ethical compass light, mascot keeper, gold glow"),
    # BRASIL (4)
    ("brasil", "feira-bandeirinha", "real colorful Brazilian street feira with real fruit stalls, glowing circuit-pattern bunting flags overhead, mascot samba hat, lime glow"),
    ("brasil", "onibus-app", "real Brazilian city bus interior in golden hour light, a glowing phone screen showing a helpful app, mascot commuter, cyan glow"),
    ("brasil", "praia-futebol", "real beach football game at sunset in Brazil, the ball glowing with a trailing light arc, mascot playing along, gold glow"),
    ("brasil", "cozinha-receita", "real Brazilian home kitchen with real pao de queijo on the counter, a glowing recipe card floating, mascot chef, rose glow"),
    # CRIATIVIDADE (6 -- tambem cobre a rota "voce sabia?")
    ("criatividade", "estudio-musica", "real home music studio with a real guitar, glowing musical notes swirling into a new melody, mascot composing, rose glow"),
    ("criatividade", "mesa-costura", "real sewing table with real fabric, thread glowing and stitching a bright new pattern on its own, mascot tailor, violet glow"),
    ("criatividade", "mural-grafite", "real urban wall with real spray cans, colors glowing and forming a mural mid-creation, mascot street artist, gold glow"),
    ("criatividade", "claquete-cinema", "real film reel and clapperboard on a real director's chair, a glowing storyboard floating above, mascot filmmaker, cyan glow"),
    ("criatividade", "abajur-curiosidade", "real antique desk lamp switching on by itself with a glowing surprised spark, mascot amazed reading a book, gold glow"),
    ("criatividade", "caixa-surpresa", "real gift box slightly open on a real table, a glowing curious fact symbol popping out like a jack-in-the-box, mascot delighted, violet glow"),
    # ROBOTICA (4)
    ("robotica", "oficina-carro", "real car repair garage, a small robotic arm glowing gently helping a real mechanic, lime glow"),
    ("robotica", "jardim-drone", "real backyard at dusk, a small glowing drone hovering and mapping a garden, mascot controlling it, cyan glow"),
    ("robotica", "fazenda-rover", "real farm field at sunrise, a small glowing robot rover tending real crops, mascot farmer hat, lime glow"),
    ("robotica", "sala-aspirador", "real living room with real furniture, a small vacuum robot glowing happily as it cleans, mascot relaxing on the couch, violet glow"),
]

print(f"total prompts: {len(POOL)}")


def build(prompt_text, prefix, seed):
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


def submit(wf):
    payload = json.dumps({"prompt": wf}).encode("utf-8")
    req = urllib.request.Request(API + "/prompt", data=payload, headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read())["prompt_id"]


jobs = []
manifest = []
counters = {}
for categoria, slug, cena in POOL:
    counters[categoria] = counters.get(categoria, 0) + 1
    nn = f"{counters[categoria]:02d}"
    file_slug = f"{categoria}-{nn}-{slug}"
    prompt_text = cena + FUSION
    prefix = f"blogpool/{DATE}_{file_slug}"
    seed = BASE_SEED + len(jobs)
    pid = submit(build(prompt_text, prefix, seed))
    jobs.append((pid, file_slug))
    manifest.append({"categoria": categoria, "file_slug": file_slug, "prefix": prefix, "seed": seed, "prompt": prompt_text})
    time.sleep(0.05)

with open("scripts/arcade/blogpool-manifest.json", "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=1)

print(f"submitted {len(jobs)} jobs")

done = set()
t0 = time.time()
while len(done) < len(jobs):
    for pid, slug in jobs:
        if pid in done:
            continue
        try:
            h = json.loads(urllib.request.urlopen(f"{API}/history/{pid}").read())
            if pid in h and h[pid].get("status", {}).get("completed"):
                done.add(pid)
                print(f"{len(done)}/{len(jobs)} done ({slug}) — {int(time.time()-t0)}s")
        except Exception:
            pass
    time.sleep(3)

print(f"ALL {len(done)} DONE in {int(time.time()-t0)}s")
