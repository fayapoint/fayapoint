# -*- coding: utf-8 -*-
"""Midia inline do curso ia-para-criar-videos (02/08/2026).

Mesma mecanica do ia-producao: o CENARIO vem do tema do MODULO e a ACAO vem do
SLOT (secao do texto), temperada pela posicao do capitulo dentro do modulo
(0..4). Por capitulo: 4 imagens inline + 2 imagens-base que viram video.

⚠️ Este e um curso SOBRE producao de video. Os cenarios sao de set, estudio e
ilha de edicao — e o slot `fluxo`/`dica` virando video de verdade nao e enfeite:
o aluno esta lendo sobre gerar video e vendo video gerado na propria pagina.

Saida: C:/WORKS/ComfyUI/output/course_media/ia-para-criar-videos/inline/capNN-*
"""
import json, sys, time, urllib.request
from pathlib import Path

API = "http://127.0.0.1:8000"
CURSO = "ia-para-criar-videos"
OUT_DIR = Path(f"C:/WORKS/ComfyUI/output/course_media/{CURSO}/inline")
NEGATIVE = "blurry, low quality, still frame, watermark, text, deformed, glitch, jitter"
BASE_SEED = 9400

# Mesma identidade visual dos outros cursos do catalogo: mascote robo achatado
# dentro de cena fotorrealista. Trocar isso quebraria a unidade do catalogo.
FUSION = (", an adorable glossy flat-vector robot mascot with big cute eyes naturally interacting inside a "
          "breathtaking cinematic photorealistic scene, seamless style fusion, dramatic film lighting, shallow "
          "depth of field, bokeh, deep dark navy blue atmosphere, rich cinematic color grading, professional "
          "photography, high detail, no text, no letters, no logos, no watermark")

# 6 modulos -> cenario + brilho
THEMES = [
    ("real film set corner at night with a wooden clapperboard, storyboard cards pinned to a board and a camera on a tripod", "cyan"),
    ("real screenwriter's desk with a printed script, a cinema lens standing upright and a small reference monitor showing frames", "gold"),
    ("real photo studio bench with printed portrait photos spread out, a microphone on a boom arm and headphones resting", "lime"),
    ("real editing suite with a long timeline monitor, a colour grading panel with wheels and a jog wheel controller", "violet"),
    ("real vertical content studio with a phone on a rig, a ring light and a wall of empty aspect ratio frames", "rose"),
    ("real small agency desk with a signed contract, printed invoices and a portable delivery drive under warm light", "amber"),
]

# Acao por slot x posicao do capitulo no modulo (0..4)
SLOT_ACTIONS = {
    "sistema": [
        "the mascot holding two glowing film strips side by side, one already filmed and one still blank, comparing them carefully",
        "the mascot sorting four glowing storyboard cards into two labelled trays, one card clearly out of place",
        "the mascot stacking translucent glowing frames into a short strip while a second tiny mascot checks the order",
        "the mascot pulling one dim glowing frame out of an otherwise bright strip to inspect it up close",
        "the mascot laying the final glowing frame at the end of a complete strip beside a small wrapped deliverable",
    ],
    "intencao": [
        "on one side the mascot writing on a small glowing script card, on the other a camera already rolling, a clear gap of soft light between deciding and shooting",
        "two glowing storyboard paths splitting from a single card, the mascot at the fork holding a small lantern over one",
        "the mascot weighing two glowing lenses of different sizes on a balance scale",
        "the mascot separating a pile of glowing clips into two clearly different bins, one large one small",
        "the mascot drawing a bright line across the bench that separates rough takes from chosen ones",
    ],
    "fluxo": [
        "a winding path of five glowing stepping stones crossing the surface from a blank script page to a finished glowing film reel, the tiny mascot walking on the stones mid-journey",
        "a winding path of five glowing stepping stones from a typed prompt card to a moving frame on a monitor, the tiny mascot mid-journey",
        "a winding path of five glowing stepping stones from a printed photo to a glowing animated frame, the tiny mascot stepping between them",
        "a winding path of five glowing stepping stones from scattered raw clips to a single assembled timeline, the tiny mascot mid-journey",
        "a winding path of five glowing stepping stones toward a beautifully wrapped glowing published video, the tiny mascot stepping onto the final stone",
    ],
    "cenario": [
        "a swirl of misty crumpled script pages rising and condensing into one crisp glowing storyboard that the mascot proudly holds up",
        "a chaotic scatter of loose glowing frames lifting and settling into one neat ordered strip, the mascot guiding the motion",
        "a tangled knot of glowing audio waveforms unwinding into a single clean orderly wave the mascot watches with relief",
        "a wall of noisy flickering rough takes resolving into three calm bright finished shots, the mascot lowering its hands",
        "a scattered heap of glowing clips organizing itself into a single sealed labelled delivery case beside the mascot",
    ],
    "validacao": [
        "the mascot examining a single glowing frame through a large magnifying glass against a reference storyboard, a kind amber warning light above",
        "the mascot checking each glowing frame in a strip against a checklist, one frame glowing amber and set aside",
        "the mascot holding a glowing frame up to a bright inspection lamp, a kind amber warning light above the bench",
        "the mascot comparing two glowing waveform gauges side by side through a magnifying glass, one noticeably lower",
        "the mascot inspecting a sealed glowing delivery case at a checkpoint, a small round blank wax stamp resting unused beside it",
    ],
    "dica": [
        "the mascot writing a glowing checklist card with soft check marks, behind it a large friendly render button waiting dimmed until the list is complete",
        "the mascot holding up a single glowing frame and comparing it against a storyboard card, nodding",
        "the mascot placing one small glowing marker on a busy timeline, and the whole timeline becoming calmer and clearer",
        "the mascot pinning one glowing gauge to the centre of a monitor wall while the other panels dim respectfully",
        "the mascot pressing a small glowing seal onto a finished labelled delivery case with satisfaction",
    ],
}

VIDEO_MOTION = {
    "fluxo": ("The five glowing stepping stones pulse softly in sequence one after another, the tiny mascot walks "
              "steadily forward along them, warm light travelling across the scene, gentle camera push in, "
              "cinematic, smooth motion"),
    "dica": ("The glowing element brightens gently and a soft pulse of warm light spreads outward across the scene, "
             "the mascot moves slightly with satisfaction, gentle camera push in, cinematic, smooth motion"),
}

IMG_SLOTS = ["sistema", "intencao", "cenario", "validacao"]
VID_SLOTS = ["fluxo", "dica"]


def post(payload):
    req = urllib.request.Request(f"{API}/prompt", data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=120).read())


def build_image(prompt_text, prefix, seed):
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "qwen_image_2512_fp8_e4m3fn.safetensors", "weight_dtype": "default"}},
        "1b": {"class_type": "LoraLoaderModelOnly", "inputs": {"lora_name": "Qwen-Image-2512-Lightning-4steps-V1.0-fp32.safetensors", "strength_model": 1.0, "model": ["1", 0]}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_2.5_vl_7b_fp8_scaled.safetensors", "type": "qwen_image", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_vae.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt_text, "clip": ["2", 0]}},
        "5": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["4", 0]}},
        "6": {"class_type": "EmptySD3LatentImage", "inputs": {"width": 1152, "height": 640, "batch_size": 1}},
        "7": {"class_type": "KSampler", "inputs": {"seed": seed, "control_after_generate": "fixed", "steps": 4, "cfg": 1.0,
                                                    "sampler_name": "euler", "scheduler": "simple", "denoise": 1,
                                                    "model": ["1b", 0], "positive": ["4", 0], "negative": ["5", 0], "latent_image": ["6", 0]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["7", 0], "vae": ["3", 0]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": f"course_media/{CURSO}/inline/{prefix}", "images": ["8", 0]}},
    }


CKPT_VIDEO = "ltx-2.3-22b-dev-fp8.safetensors"


def build_video(input_image, motion, prefix, seed):
    """LTX 2.3 pelo caminho AUDIOVISUAL — obrigatório desde o ComfyUI 0.29.2.

    ⚠️ O grafo antigo (só vídeo, com `LTXVImgToVideoInplace` + upscaler em duas
    passagens) funcionou até a 0.28.3 e passou a morrer em 0.29.2 com:

        cannot reshape tensor of 0 elements into shape [1, 0, 32, -1]

    O 2.3 virou modelo **audiovisual**: o sampler espera um latente que carrega
    vídeo E áudio concatenados. Entregando só o latente de vídeo, a metade de
    áudio chega com tamanho zero e o reshape estoura. Acontecia igual com
    `LTXVImgToVideo` e com `Inplace`, com sigmas válidos e dimensões casadas —
    por isso não era o grafo, era o formato do latente.

    A correção são três nós:
      LTXVAudioVAELoader   -> VAE de áudio (do MESMO checkpoint)
      LTXVEmptyLatentAudio -> latente de áudio silencioso do tamanho do clipe
      LTXVConcatAVLatent   -> junta os dois antes do sampler
      LTXVSeparateAVLatent -> separa depois, para decodificar só o vídeo

    O upscaler de duas passagens saiu: gerando direto em 768x448 o resultado é
    melhor que 640x360 upscalado, com metade dos nós e menos modo de falha.
    """
    return {
        "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": CKPT_VIDEO}},
        "2": {"class_type": "LoraLoaderModelOnly", "inputs": {"model": ["1", 0], "lora_name": "ltx-2.3-22b-distilled-lora-384.safetensors", "strength_model": 0.5}},
        "3": {"class_type": "LTXAVTextEncoderLoader", "inputs": {"text_encoder": "gemma_3_12B_it_fp4_mixed.safetensors", "ckpt_name": CKPT_VIDEO, "device": "default"}},
        "4": {"class_type": "LTXVAudioVAELoader", "inputs": {"ckpt_name": CKPT_VIDEO}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"text": motion, "clip": ["3", 0]}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"text": NEGATIVE, "clip": ["3", 0]}},
        "10": {"class_type": "LoadImage", "inputs": {"image": input_image}},
        "12": {"class_type": "LTXVPreprocess", "inputs": {"image": ["10", 0], "img_compression": 18}},
        "21": {"class_type": "LTXVImgToVideo", "inputs": {"positive": ["5", 0], "negative": ["6", 0], "vae": ["1", 2], "image": ["12", 0], "width": 768, "height": 448, "length": 97, "batch_size": 1, "strength": 1.0}},
        "19": {"class_type": "LTXVEmptyLatentAudio", "inputs": {"frames_number": 97, "frame_rate": 25.0, "batch_size": 1, "audio_vae": ["4", 0]}},
        "20": {"class_type": "LTXVConcatAVLatent", "inputs": {"video_latent": ["21", 2], "audio_latent": ["19", 0]}},
        "15": {"class_type": "LTXVConditioning", "inputs": {"positive": ["21", 0], "negative": ["21", 1], "frame_rate": 25}},
        "22": {"class_type": "RandomNoise", "inputs": {"noise_seed": seed}},
        "23": {"class_type": "CFGGuider", "inputs": {"model": ["2", 0], "positive": ["15", 0], "negative": ["15", 1], "cfg": 1.0}},
        "24": {"class_type": "KSamplerSelect", "inputs": {"sampler_name": "euler"}},
        "25": {"class_type": "ManualSigmas", "inputs": {"sigmas": "1.0, 0.9875, 0.975, 0.909375, 0.725, 0.421875, 0.0"}},
        "26": {"class_type": "SamplerCustomAdvanced", "inputs": {"noise": ["22", 0], "guider": ["23", 0], "sampler": ["24", 0], "sigmas": ["25", 0], "latent_image": ["20", 0]}},
        "27": {"class_type": "LTXVSeparateAVLatent", "inputs": {"av_latent": ["26", 0]}},
        "40": {"class_type": "VAEDecodeTiled", "inputs": {"samples": ["27", 0], "vae": ["1", 2], "tile_size": 768, "overlap": 64, "temporal_size": 4096, "temporal_overlap": 4}},
        "44": {"class_type": "CreateVideo", "inputs": {"images": ["40", 0], "fps": 25}},
        "45": {"class_type": "SaveVideo", "inputs": {"video": ["44", 0], "filename_prefix": f"course_media/{CURSO}/inline/{prefix}-video", "format": "mp4", "codec": "h264"}},
    }


def wait_queue(limite=0):
    """Espera a fila baixar. Enfileirar 180 jobs de uma vez estoura a VRAM."""
    while True:
        try:
            q = json.loads(urllib.request.urlopen(f"{API}/queue", timeout=30).read())
            n = len(q.get("queue_running", [])) + len(q.get("queue_pending", []))
            if n <= limite:
                return
        except Exception:
            pass
        time.sleep(5)


def main():
    so_imagens = "--imagens" in sys.argv
    so_videos = "--videos" in sys.argv
    fazer_img = not so_videos
    fazer_vid = not so_imagens

    if fazer_img:
        total = 0
        for cap in range(1, 31):
            modulo = (cap - 1) // 5
            pos = (cap - 1) % 5
            cenario, _ = THEMES[modulo]
            for i_slot, slot in enumerate(IMG_SLOTS + VID_SLOTS):
                acao = SLOT_ACTIONS[slot][pos]
                prompt = f"{cenario}, {acao}{FUSION}"
                prefix = f"cap{cap:02d}-{slot}"
                # Semente unica por (capitulo, slot). Usar so o capitulo faria os
                # seis slots sairem identicos — a figura pararia de espelhar a secao.
                post({"prompt": build_image(prompt, prefix, BASE_SEED + cap * 10 + i_slot)})
                total += 1
                if total % 6 == 0:
                    wait_queue(limite=8)
                    print(f"[img] {total}/180 enfileiradas", flush=True)
        wait_queue(limite=0)
        print("IMAGENS PRONTAS", flush=True)

    if fazer_vid:
        # A imagem-base precisa estar em input/ para o LoadImage encontrar.
        inp = Path("C:/WORKS/ComfyUI/input")
        feitos = 0
        falhas = []
        for cap in range(1, 31):
            pos = (cap - 1) % 5
            for slot in VID_SLOTS:
                base = OUT_DIR / f"cap{cap:02d}-{slot}_00001_.png"
                if not base.exists():
                    print(f"[vid] pulou cap{cap:02d}-{slot}: base ausente", flush=True)
                    continue
                destino = inp / f"iavid_cap{cap:02d}_{slot}.png"
                if not destino.exists():
                    destino.write_bytes(base.read_bytes())
                t0 = time.time()
                post({"prompt": build_video(destino.name, VIDEO_MOTION[slot], f"cap{cap:02d}-{slot}", BASE_SEED + cap * 7)})
                wait_queue(limite=0)

                # ⚠️ Fila vazia NÃO é sucesso. Quando o LTX quebrou na 0.29.2 os
                # 60 jobs falharam em segundos, a fila esvaziou e este laço
                # imprimiu "OK (60/60)" sem um único arquivo no disco. Confere
                # o arquivo, sempre.
                saiu = list(OUT_DIR.glob(f"cap{cap:02d}-{slot}-video_*.mp4"))
                if saiu:
                    feitos += 1
                    print(f"[vid cap{cap:02d}-{slot}] OK em {int(time.time()-t0)}s ({feitos}/60)", flush=True)
                else:
                    falhas.append(f"cap{cap:02d}-{slot}")
                    print(f"[vid cap{cap:02d}-{slot}] FALHOU (nenhum arquivo gerado)", flush=True)

        print(f"VIDEOS: {feitos} prontos, {len(falhas)} falhas" + (f" -> {', '.join(falhas)}" if falhas else ""), flush=True)


if __name__ == "__main__":
    main()
