"""R9 passo 3 — animar o quadro-fonte com LTX 2.3 (receita provada da skill).

Movimento DELIBERADAMENTE sutil. Dois motivos:
  1. o video fica ao lado do cabecalho de uma pagina que se le — movimento
     grande ali disputa com o texto e cansa;
  2. quanto menor o deslocamento, menos o modelo redesenha o rosto, e o ponto
     inteiro deste plano e o rosto ser o dele de verdade.
"""
import json, urllib.request, time, sys, os

COMFY = "http://127.0.0.1:8000"
CKPT = "ltx-2.3-22b-dev-fp8.safetensors"
FRAMES = 121          # ~4,8 s a 25 fps
FPS = 25

# 2a versao. A 1a pedia "radar sweep line turning" e "camera push in": o modelo
# leu a linha fina de varredura como rastro de luz e, do frame 60 em diante, o
# fundo virou um emaranhado de fitas douradas que dominava o quadro. Numa pagina
# cujo argumento e precisao de medicao, fundo caotico contradiz o texto.
# Agora: camera TRAVADA, globo parado no lugar, e a unica animacao pedida e o
# pulsar dos alfinetes.
POS = (
    "cinematic medium shot, locked-off static camera, a calm bearded man on the left "
    "looking straight at camera, breathing gently, subtle eye blink, otherwise still; "
    "behind him on the right a clean holographic wireframe globe holding its position, "
    "thin steady blue grid lines, small coloured pins glowing and pulsing gently on its "
    "surface; dark navy studio background, soft golden rim light, clean and precise, "
    "premium tech brand film, no camera movement"
)
NEG = (
    "light trails, streaks, swirling ribbons, glowing filaments, motion blur trails, "
    "sparks, particles flying, chaotic background, fast motion, jump cut, warping face, "
    "distorted features, changing identity, morphing, text, watermark, logo, subtitles, "
    "flicker, strobing, camera shake, zoom in, zoom out, cartoon, plastic skin"
)


def enfileirar(g):
    req = urllib.request.Request(
        f"{COMFY}/prompt", data=json.dumps({"prompt": g}).encode(),
        headers={"Content-Type": "application/json"})
    try:
        return json.loads(urllib.request.urlopen(req, timeout=60).read())["prompt_id"]
    except urllib.error.HTTPError as e:
        # O 400 do ComfyUI carrega o motivo no corpo; sem imprimir isto a
        # depuracao vira adivinhacao.
        print(json.dumps(json.loads(e.read()), indent=1, ensure_ascii=False)[:3000])
        raise


def esperar(pid, limite=2400):
    t0 = time.time()
    ultimo = ""
    while time.time() - t0 < limite:
        h = json.loads(urllib.request.urlopen(f"{COMFY}/history/{pid}", timeout=30).read())
        if pid in h:
            st = h[pid]["status"]
            if st.get("status_str") == "error":
                for m in st.get("messages", []):
                    if m[0] == "execution_error":
                        print("ERRO:", json.dumps(m[1], indent=1)[:2000])
                return None
            if st.get("completed"):
                return h[pid]["outputs"]
        try:
            q = json.loads(urllib.request.urlopen(f"{COMFY}/prompt", timeout=15).read())
            msg = f"  {int(time.time()-t0)}s  fila={q.get('exec_info',{}).get('queue_remaining','?')}"
            if msg != ultimo:
                print(msg, flush=True); ultimo = msg
        except Exception:
            pass
        time.sleep(10)
    print("timeout")
    return None


g = {
  "ck":  {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": CKPT}},
  "lo":  {"class_type": "LoraLoaderModelOnly", "inputs": {
            "model": ["ck", 0], "lora_name": "ltx-2.3-22b-distilled-lora-384.safetensors",
            "strength_model": 0.5}},
  "te":  {"class_type": "LTXAVTextEncoderLoader", "inputs": {
            "text_encoder": "gemma_3_12B_it_fp4_mixed.safetensors", "ckpt_name": CKPT,
            "device": "default"}},
  "av":  {"class_type": "LTXVAudioVAELoader", "inputs": {"ckpt_name": CKPT}},
  "up":  {"class_type": "LatentUpscaleModelLoader", "inputs": {
            "model_name": "ltx-2.3-spatial-upscaler-x2-1.1.safetensors"}},

  "img": {"class_type": "LoadImage", "inputs": {"image": "r9_cena.png"}},
  "rz":  {"class_type": "ResizeImagesByLongerEdge", "inputs": {"images": ["img", 0], "longer_edge": 1536}},
  "pp":  {"class_type": "LTXVPreprocess", "inputs": {"image": ["rz", 0], "img_compression": 18}},

  "p":   {"class_type": "CLIPTextEncode", "inputs": {"clip": ["te", 0], "text": POS}},
  "n":   {"class_type": "CLIPTextEncode", "inputs": {"clip": ["te", 0], "text": NEG}},
  "cp":  {"class_type": "LTXVConditioning", "inputs": {
            "positive": ["p", 0], "negative": ["n", 0], "frame_rate": FPS}},

  "lat": {"class_type": "EmptyLTXVLatentVideo", "inputs": {
            "width": 640, "height": 360, "length": FRAMES, "batch_size": 1}},
  "aud": {"class_type": "LTXVEmptyLatentAudio", "inputs": {
            "frames_number": FRAMES, "frame_rate": FPS, "batch_size": 1, "audio_vae": ["av", 0]}},
  "i2v": {"class_type": "LTXVImgToVideoInplace", "inputs": {
            "vae": ["ck", 2], "image": ["pp", 0], "latent": ["lat", 0],
            "strength": 0.82, "bypass": False}},
  "cat": {"class_type": "LTXVConcatAVLatent", "inputs": {
            "video_latent": ["i2v", 0], "audio_latent": ["aud", 0]}},

  "gd":  {"class_type": "CFGGuider", "inputs": {
            "model": ["lo", 0], "positive": ["cp", 0], "negative": ["cp", 1], "cfg": 1.0}},
  "sm":  {"class_type": "KSamplerSelect", "inputs": {"sampler_name": "euler_ancestral_cfg_pp"}},
  "sg":  {"class_type": "ManualSigmas", "inputs": {
            "sigmas": "1.0, 0.99375, 0.9875, 0.98125, 0.975, 0.909375, 0.725, 0.421875, 0.0"}},
  "ns":  {"class_type": "RandomNoise", "inputs": {"noise_seed": 770220}},
  "s1":  {"class_type": "SamplerCustomAdvanced", "inputs": {
            "noise": ["ns", 0], "guider": ["gd", 0], "sampler": ["sm", 0],
            "sigmas": ["sg", 0], "latent_image": ["cat", 0]}},
  "sp1": {"class_type": "LTXVSeparateAVLatent", "inputs": {"av_latent": ["s1", 0]}},

  "us":  {"class_type": "LTXVLatentUpsampler", "inputs": {
            "samples": ["sp1", 0], "upscale_model": ["up", 0], "vae": ["ck", 2]}},

  "i2b": {"class_type": "LTXVImgToVideoInplace", "inputs": {
            "vae": ["ck", 2], "image": ["pp", 0], "latent": ["us", 0],
            "strength": 1.0, "bypass": False}},
  "cg":  {"class_type": "LTXVCropGuides", "inputs": {
            "positive": ["cp", 0], "negative": ["cp", 1], "latent": ["i2b", 0]}},
  "ct2": {"class_type": "LTXVConcatAVLatent", "inputs": {
            "video_latent": ["cg", 2], "audio_latent": ["sp1", 1]}},
  "gd2": {"class_type": "CFGGuider", "inputs": {
            "model": ["lo", 0], "positive": ["cg", 0], "negative": ["cg", 1], "cfg": 1.0}},
  "sm2": {"class_type": "KSamplerSelect", "inputs": {"sampler_name": "euler_cfg_pp"}},
  "sg2": {"class_type": "ManualSigmas", "inputs": {"sigmas": "0.85, 0.7250, 0.4219, 0.0"}},
  "ns2": {"class_type": "RandomNoise", "inputs": {"noise_seed": 770221}},
  "s2":  {"class_type": "SamplerCustomAdvanced", "inputs": {
            "noise": ["ns2", 0], "guider": ["gd2", 0], "sampler": ["sm2", 0],
            "sigmas": ["sg2", 0], "latent_image": ["ct2", 0]}},
  "sp2": {"class_type": "LTXVSeparateAVLatent", "inputs": {"av_latent": ["s2", 0]}},

  "dec": {"class_type": "VAEDecodeTiled", "inputs": {
            "samples": ["sp2", 0], "vae": ["ck", 2],
            "tile_size": 768, "overlap": 64, "temporal_size": 4096, "temporal_overlap": 64}},
  "sv":  {"class_type": "SaveImage", "inputs": {
            "images": ["dec", 0], "filename_prefix": "r9_frames_v2/r9"}},
}

print("enfileirando LTX 2.3 i2v...", flush=True)
pid = enfileirar(g)
print("job", pid, flush=True)
out = esperar(pid)
if not out:
    sys.exit(1)
n = sum(len(o.get("images", [])) for o in out.values())
print(f"PRONTO — {n} frames em C:\\WORKS\\ComfyUI\\output\\r9_frames")
