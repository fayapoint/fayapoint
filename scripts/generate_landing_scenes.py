# -*- coding: utf-8 -*-
# Cenas contextuais (regra do espelho, IDENTIDADE_VISUAL §9) para os 8 exemplos
# do minigame da home fayai. Z-Image Turbo, 2 seeds por cena, 1152x768 (3:2).
import json, time, urllib.request

API = "http://localhost:8000"
DATE = "20260713"
SUFFIX = (", Playful premium flat vector illustration, rounded friendly shapes, soft glow, "
          "glossy highlights, centered composition, deep dark navy background, "
          "high quality, no text, no letters, no words")

SCENES = [
    ("email-dificil",
     "a cute smiling laptop showing an email app interface on its screen with message bubbles, "
     "a tense red scribble message transforming into a calm glowing tidy reply with golden sparkles, "
     "small friendly round robot typing on the keyboard, cyan blue color palette"),
    ("reuniao-resumida",
     "a smartphone in the foreground with a voice recorder app on its screen, big round red record button "
     "and audio waveform, the waveform flowing out of the phone and condensing into a neat glowing checklist "
     "note with golden sparkles, cyan blue color palette"),
    ("professor-24h",
     "a friendly round robot teacher with glasses pointing at a small chalkboard showing a soccer ball and "
     "a rising coins chart, a cute smiling coffee mug student watching attentively, warm golden sparkles, "
     "violet purple color palette"),
    ("flashcards",
     "an open book with pages magically transforming into flying study cards with question marks and "
     "check marks, golden sparkles trail between book and cards, violet purple color palette"),
    ("post-30s",
     "a smartphone showing a social media post composer on its screen with a delicious chocolate cake photo, "
     "hearts and hashtag symbols and sparkles flying out of the screen, small friendly robot holding the phone, "
     "pink color palette"),
    ("imagem-sem-designer",
     "a magic wand painting a picture inside an ornate frame, the image assembling from five glowing "
     "ingredient orbs floating around it, artist palette nearby, golden sparkles, pink color palette"),
    ("cardapio-semana",
     "an open refrigerator with cute smiling ingredients inside, chicken egg tomato cheese with happy faces, "
     "a glowing weekly calendar of meals materializing beside it with golden sparkles, lime green color palette"),
    ("conta-explicada",
     "a friendly round robot holding a large magnifying glass over a confusing document with tiny fine print "
     "squiggles, a clear bright speech bubble with a lightbulb coming out, golden sparkles, "
     "lime green color palette"),
]

def wf(prompt, seed, prefix):
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "z_image_turbo_bf16.safetensors", "weight_dtype": "default"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_3_4b.safetensors", "type": "lumina2", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "ae.safetensors"}},
        "4": {"class_type": "ModelSamplingAuraFlow", "inputs": {"shift": 3, "model": ["1", 0]}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["2", 0]}},
        "6": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["5", 0]}},
        "7": {"class_type": "EmptySD3LatentImage", "inputs": {"width": 1152, "height": 768, "batch_size": 1}},
        "8": {"class_type": "KSampler", "inputs": {"seed": seed, "control_after_generate": "fixed", "steps": 8, "cfg": 1,
              "sampler_name": "res_multistep", "scheduler": "simple", "denoise": 1,
              "model": ["4", 0], "positive": ["5", 0], "negative": ["6", 0], "latent_image": ["7", 0]}},
        "9": {"class_type": "VAEDecode", "inputs": {"samples": ["8", 0], "vae": ["3", 0]}},
        "10": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["9", 0]}},
    }

jobs = []
for i, (slug, desc) in enumerate(SCENES):
    for v in (1, 2):
        seed = 1300 + i * 10 + v
        prefix = f"{DATE}_scene-{slug}-v{v}"
        payload = json.dumps({"prompt": wf(desc + SUFFIX, seed, prefix)}).encode()
        req = urllib.request.Request(API + "/prompt", data=payload, headers={"Content-Type": "application/json"})
        r = json.loads(urllib.request.urlopen(req).read())
        jobs.append((r["prompt_id"], prefix))
print(f"{len(jobs)} jobs na fila")

done = set()
t0 = time.time()
while len(done) < len(jobs) and time.time() - t0 < 600:
    for pid, prefix in jobs:
        if pid in done:
            continue
        try:
            h = json.loads(urllib.request.urlopen(f"{API}/history/{pid}").read())
            if pid in h and h[pid].get("status", {}).get("completed"):
                done.add(pid)
        except Exception:
            pass
    time.sleep(3)
print(f"completos: {len(done)}/{len(jobs)} em {time.time()-t0:.0f}s")
