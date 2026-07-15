# -*- coding: utf-8 -*-
"""
Batch ABUNDÂNCIA 14/07/2026 — ~100 imagens no estilo §12:
mascote vetorial fofo FUNDIDO em fotorealismo cinematográfico (Qwen 2512 + Lightning, ~14s/img).
Grupos: VoM 30 · Blog 13 · Dashboard 8 · QualPrompt 10 · Akinator 7 · Conta 4 · Batalha/Caça 10 · Categorias 8 · Celebração 10
"""
import json, time, urllib.request

API = "http://localhost:8000"
DATE = "20260714"
BASE_SEED = 4200

FUSION = (", an adorable glossy flat-vector robot mascot with big cute eyes naturally interacting inside a "
          "breathtaking cinematic photorealistic scene, seamless style fusion, dramatic film lighting, shallow "
          "depth of field, bokeh, deep dark navy blue atmosphere, rich cinematic color grading, professional "
          "photography, high detail, no text, no letters, no logos, no watermark")

# (slug, prompt-core, accent) — accent injected as lighting color
P = []

# ── Verdade ou Mito (30) — regra do espelho: a imagem encena a carta ──
VOM = [
    ("meeting-summary", "smartphone on a real meeting table recording audio, sound waves flowing into a neat holographic checklist the mascot organizes, cyan glow"),
    ("always-truth", "mascot with skeptical face holding a magnifying glass over a glowing speech bubble full of fake glitter, violet glow"),
    ("must-code", "ordinary person chatting with the mascot over coffee at a real kitchen table, no computers code anywhere, warm lime glow"),
    ("contract-help", "photorealistic dense paper contract, the mascot highlighting one clause that turns into simple glowing icons, cyan glow"),
    ("image-analysis", "real photo print held by a hand, the mascot scanning it with a soft beam revealing labeled details, violet glow"),
    ("real-time", "mascot reading yesterday's real newspaper looking confused while a glowing live feed streams outside a window, rose glow"),
    ("music", "real recording studio with microphone and mixing desk, the mascot conducting glowing musical notes, rose glow"),
    ("longer-prompt", "mascot buried under an endless real paper scroll, while a tiny neat glowing card floats perfectly, violet glow"),
    ("meal-plan", "real rustic kitchen counter with fresh vegetables, the mascot arranging them into a glowing weekly menu grid, lime glow"),
    ("always-paid", "mascot happily opening a real wallet with a friendly zero-cost glowing sparkle, no money needed, lime glow"),
    ("remember-forever", "mascot looking at real polaroid photos fading at the edges of a long table, one bright recent photo, violet glow"),
    ("upload-secret", "real office safe slightly open, the mascot blocking documents from flying into a glowing portal, rose alert glow"),
    ("examples-help", "real desk with one beautiful finished sample document, the mascot cloning its glowing style onto a blank page, cyan glow"),
    ("calculator", "mascot juggling real wooden numbers clumsily while a real calculator sits solid and precise nearby, violet glow"),
    ("tokens-words", "real scrabble-like word tiles being sliced into smaller glowing fragments by the mascot, violet glow"),
    ("rag-trains", "real library shelves, the mascot fetching one glowing book excerpt and carrying it to a reading desk, cyan glow"),
    ("agent-actions", "the mascot as tiny conductor orchestrating real tools: wrench keyboard calendar phone, connected by glowing threads, cyan glow"),
    ("fine-tuning-current-news", "mascot watering a real bonsai tree shaped like a brain while fresh newspapers pile untouched, violet glow"),
    ("bias", "real balance scale slightly tilted, the mascot adding a glowing counterweight to level it, rose glow"),
    ("automation-judgment", "real factory conveyor belt running smoothly, the mascot inspecting one item with a glowing magnifier, lime glow"),
    ("temperature-facts", "real thermometer glowing hot with wild colorful sparks versus cool precise blue crystals, mascot observing, rose glow"),
    ("translate", "one real thick technical book splitting into three glowing versions: child simple expert, mascot presenting them, cyan glow"),
    ("model-same", "three different real robot toys on a shelf, different sizes and shapes, mascot comparing them with a glowing chart, violet glow"),
    ("image-text", "real art gallery frame with gorgeous painting but scrambled gibberish sign below, mascot covering it amused, rose glow"),
    ("summarize-check", "real long document folded into a tiny glowing note, one important clause slipping out, mascot catching it, cyan glow"),
    ("context-window-infinite", "real window frame in a cozy room showing only part of a vast starry landscape, mascot measuring the frame, violet glow"),
    ("workflow", "real desk items connected by glowing pipes: paper form, brain spark, spreadsheet, envelope, mascot welding the joints, lime glow"),
    ("inference", "mascot as fortune teller with a real crystal ball showing a glowing answer emerging from gears, violet glow"),
    ("human-tone", "real handwritten letters on a desk, the mascot studying them and writing with matching glowing handwriting, rose glow"),
    ("source-links", "real chain links where one link is a hologram that flickers, mascot testing each link with a lamp, cyan glow"),
]
for slug, core in [(s, c) for s, c, *r in [(*v, None) for v in VOM]]:
    P.append((f"vom/{slug}", core))

# ── Blog IA Hoje (13): hero + capas de editorias ──
BLOG = [
    ("hero", "grand real newsroom at night with glowing holographic headlines floating above real desks, the mascot as excited news anchor, golden hour light"),
    ("tendencia", "real telescope on a rooftop at dusk pointed at a glowing rising constellation shaped like a brain, mascot looking through it"),
    ("ferramentas", "real workshop pegboard with beautiful real tools, some tools glowing magically, mascot picking one, cyan glow"),
    ("pesquisa", "real magnifying glass over real old maps and documents, glowing discovery trails, mascot explorer hat, violet glow"),
    ("negocios", "real modern office window city skyline, glowing growth chart floating, mascot in tiny tie presenting, gold glow"),
    ("educacao", "real cozy classroom with wooden desks, glowing knowledge orbs floating above open real books, mascot teacher, violet glow"),
    ("criatividade", "real artist atelier with real paint brushes and canvas, paint strokes turning into glowing pixels, mascot painting, rose glow"),
    ("etica", "real courthouse marble columns, a warm glowing heart balanced on real scales, mascot guardian, gold glow"),
    ("mercado", "real stock exchange screens reflecting on glass, one glowing friendly robot ticker, mascot analyst, cyan glow"),
    ("robotica", "real industrial robot arm gently high-fiving the tiny vector mascot, sparks of friendship, lime glow"),
    ("saude", "real hospital corridor softly lit, glowing caring pulse line held by the mascot as nurse, cyan glow"),
    ("brasil", "real Rio de Janeiro coastline at golden hour, glowing circuit patterns in the sky like constellations, mascot with tiny flag, lime glow"),
    ("futuro", "real highway at night long exposure light trails becoming glowing neural pathways to a bright horizon, mascot on a real skateboard, violet glow"),
]
for slug, core in BLOG:
    P.append((f"blog/{slug}", core))

# ── Dashboard widgets (8) ──
DASH = [
    ("studio-promo", "real photography studio with softbox lights illuminating a canvas where glowing vector art materializes, mascot director chair, rose glow"),
    ("ranking", "real stadium podium at night, spotlights, the mascot celebrating on first place with glowing confetti, gold glow"),
    ("desafio-diario", "real gym locker room bench with a glowing daily quest scroll and real water bottle, mascot stretching, orange glow"),
    ("streak", "real fireplace with beautiful controlled flames, calendar pages floating protected by the mascot, orange glow"),
    ("recompensas", "real treasure chest slightly open on real velvet, warm glowing gifts inside, mascot guardian, gold glow"),
    ("assistente", "real cozy library reading nook, the mascot as wise tutor with tiny real glasses and a glowing open book, cyan glow"),
    ("jornada", "real mountain trail at dawn with glowing path markers leading to a bright summit, mascot hiker with tiny backpack, violet glow"),
    ("boas-vindas", "real front door opening to warm light, welcome mat, the mascot greeting with open arms, confetti, gold glow"),
]
for slug, core in DASH:
    P.append((f"dash/{slug}", core))

# ── Qual Prompt extra (10) — cenas geradas 'adivinháveis' ──
QUAL = [
    ("astronauta-cafe", "photorealistic astronaut drinking coffee in a tiny real Brazilian padaria, morning light"),
    ("gato-samurai", "photorealistic fluffy cat wearing detailed samurai armor on a real dojo floor, dramatic light"),
    ("biblioteca-nuvens", "real library where bookshelves dissolve into photorealistic clouds near the ceiling, sunbeams"),
    ("robo-jardineiro", "photorealistic vintage rusty robot lovingly watering real sunflowers in a garden, golden hour"),
    ("cidade-aquario", "photorealistic city skyline inside a giant real glass aquarium with real fish swimming between towers"),
    ("vovó-gamer", "photorealistic joyful grandmother with neon gaming headset winning at a real arcade, neon reflections"),
    ("praia-neve", "photorealistic tropical beach with real palm trees covered in fresh snow, surreal soft light"),
    ("food-truck-lua", "photorealistic food truck parked on the moon surface serving glowing pastel de queijo, earth in sky"),
    ("dino-escritorio", "photorealistic friendly t-rex in a tiny real office cubicle typing with tiny arms, fluorescent light"),
    ("balao-livros", "photorealistic hot air balloon made of real open books flying over real green mountains at dawn"),
]
for slug, core in QUAL:
    P.append((f"qualprompt/{slug}", core))

# ── Akinator da persona (7) ──
AKI = [
    ("vidente-hero", "the mascot as mystical fortune teller with tiny turban inside a real velvet circus tent, real crystal ball glowing with question marks, magical dust"),
    ("palpite-trabalho", "real briefcase opening with glowing profession icons floating out, mascot fortune teller squinting, cyan glow"),
    ("palpite-criativo", "real paint palette and camera on a real wooden table, glowing creative aura, mascot fortune teller pointing, rose glow"),
    ("palpite-estudos", "real stack of textbooks with glowing graduation cap hologram, mascot fortune teller nodding, violet glow"),
    ("palpite-negocios", "real storefront miniature with glowing growth arrow, mascot fortune teller impressed, gold glow"),
    ("acertou", "the mascot fortune teller celebrating with real confetti falling in the velvet tent, crystal ball showing a bright check mark, gold glow"),
    ("errou", "the mascot fortune teller laughing embarrassed, crystal ball showing friendly smoke question mark, real tent softly lit, violet glow"),
]
for slug, core in AKI:
    P.append((f"persona/{slug}", core))

# ── Minha Conta / Configurações (4) ──
CONTA = [
    ("perfil-hero", "real artisan desk with leather notebook, real fountain pen writing a glowing personal profile card, mascot assistant, gold glow"),
    ("seguranca", "real bank vault door slightly open with warm safe light, mascot guardian with tiny glowing shield, cyan glow"),
    ("notificacoes", "real vintage brass bell on a real wooden counter with soft glowing gentle rings, mascot listening happily, violet glow"),
    ("privacidade", "real translucent curtain protecting a cozy real reading corner, mascot adjusting the curtain kindly, lime glow"),
]
for slug, core in CONTA:
    P.append((f"conta/{slug}", core))

# ── Batalha de Prompts (5) + Caça ao Prompt (5) ──
ARENA = [
    ("batalha/arena", "real boxing ring under dramatic spotlights where two glowing paper scrolls face off, mascot referee, rose glow"),
    ("batalha/duelo-oeste", "real western desert street at high noon, two glowing prompt cards in a standoff, mascot sheriff, gold glow"),
    ("batalha/esgrima", "real fencing hall, two elegant glowing pens crossed like swords, mascot judge, cyan glow"),
    ("batalha/vitoria", "real stadium confetti rain over one glowing champion scroll on a real podium, mascot lifting it, gold glow"),
    ("batalha/empate", "real chess board with two glowing kings shaking hands, mascot diplomat, violet glow"),
    ("caca/mapa", "real weathered treasure map on real wood table with glowing word-fragments as islands, mascot pirate hat, gold glow"),
    ("caca/lupa", "real detective desk with real brass magnifier revealing hidden glowing letters on paper, mascot detective, cyan glow"),
    ("caca/floresta", "real misty forest trail with glowing word pieces hidden between real ferns, mascot ranger, lime glow"),
    ("caca/museu", "real museum hall where one glowing artifact word floats in a real glass case, mascot curator, violet glow"),
    ("caca/tesouro", "real open treasure chest on a real beach at sunset full of glowing completed sentences, mascot celebrating, gold glow"),
]
for slug, core in ARENA:
    P.append((f"arcade2/{slug}", core))

# ── Categorias landing: 2 novas variantes por categoria (8) ──
CATS = [
    ("trabalho-v6", "real elegant office desk at blue hour, the cyan mascot presenting a glowing productivity dashboard hologram, cyan glow"),
    ("trabalho-v7", "real coworking space with plants, the cyan mascot handing real coffee to a glowing laptop, cyan glow"),
    ("estudos-v6", "real university library aisle, the violet mascot surfing on a real flying open book leaving a glowing trail, violet glow"),
    ("estudos-v7", "real student desk with real lamp at night, the violet mascot projecting glowing flashcards constellation, violet glow"),
    ("criar-v6", "real pottery studio, the rose mascot shaping a glowing swirling galaxy on a real pottery wheel, rose glow"),
    ("criar-v7", "real film set with real clapperboard, the rose mascot directing glowing floating storyboards, rose glow"),
    ("dia-a-dia-v6", "real sunny laundry line in a real backyard, the lime mascot organizing glowing chore cards pinned like clothes, lime glow"),
    ("dia-a-dia-v7", "real farmers market stall with real fruit, the lime mascot weighing glowing shopping list items, lime glow"),
]
for slug, core in CATS:
    P.append((f"cats2/{slug}", core))

# ── Celebrações / estados (10) ──
FX = [
    ("nivel-up", "real fireworks over a real city skyline forming a glowing upward arrow, mascot on a rooftop cheering, gold glow"),
    ("conquista", "real trophy on real marble pedestal in museum light, mascot polishing it proudly, gold glow"),
    ("primeiro-post", "real printing press printing one glowing beautiful page, mascot catching it, cyan glow"),
    ("streak-7", "real seven candles on a real cake perfectly lit, mascot protecting the flames, orange glow"),
    ("certificado-fx", "real wax seal being pressed on real parchment with glowing emblem, mascot notary, gold glow"),
    ("vazio-inspirador", "real empty artist canvas on a real easel by a window with morning light, one glowing brushstroke starting, mascot inviting, violet glow"),
    ("erro-fofo", "real spilled real coffee on desk forming a glowing heart shape, mascot cleaning embarrassed smiling, rose glow"),
    ("carregando", "real hourglass with glowing sand forming tiny stars, mascot hypnotized watching, violet glow"),
    ("xp-chuva", "real umbrella held by the mascot under a rain of glowing golden coins on a real street at night, gold glow"),
    ("meta-semanal", "real dartboard in a real pub with one glowing dart in the bullseye, mascot celebrating, lime glow"),
]
for slug, core in FX:
    P.append((f"fx/{slug}", core))

print(f"total prompts: {len(P)}")

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
for i, (slug, core) in enumerate(P):
    prompt_text = core + FUSION
    prefix = f"abundance/{DATE}_{slug.replace('/', '_')}"
    pid = submit(build(prompt_text, prefix, BASE_SEED + i))
    jobs.append((pid, slug))
    manifest.append({"slug": slug, "prefix": prefix, "seed": BASE_SEED + i, "prompt": prompt_text})

with open("scripts/arcade/abundance-manifest.json", "w", encoding="utf-8") as f:
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
                if len(done) % 20 == 0:
                    print(f"{len(done)}/{len(jobs)} done — {int(time.time()-t0)}s")
        except Exception:
            pass
    time.sleep(4)

print(f"ALL {len(done)} DONE in {int(time.time()-t0)}s")
