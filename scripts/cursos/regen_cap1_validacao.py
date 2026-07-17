# -*- coding: utf-8 -*-
"""Regen da cap01-validacao (17/07): o 'approval seal' da v1 virou badge com
texto embaralhado. Troca por carimbo de cera em branco (conceito sem texto)."""
import json, time, urllib.request

API = "http://localhost:8000"

FUSION = (", an adorable glossy flat-vector robot mascot with big cute eyes naturally interacting inside a "
          "breathtaking cinematic photorealistic scene, seamless style fusion, dramatic film lighting, shallow "
          "depth of field, bokeh, deep dark navy blue atmosphere, rich cinematic color grading, professional "
          "photography, high detail, no text, no letters, no logos, no watermark")

CORE = ("real cozy kitchen table with a laptop and fresh coffee, the mascot examining a glowing paper scroll "
        "through a large magnifying glass, a kind amber warning light above, a small round blank wax stamp "
        "resting on the table still unused, lime glow")

def post(path, payload):
    req = urllib.request.Request(API + path, json.dumps(payload).encode(),
                                 {"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read())

wf = {
    "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "qwen_image_2512_fp8_e4m3fn.safetensors", "weight_dtype": "default"}},
    "1b": {"class_type": "LoraLoaderModelOnly", "inputs": {"lora_name": "Qwen-Image-2512-Lightning-4steps-V1.0-fp32.safetensors", "strength_model": 1.0, "model": ["1", 0]}},
    "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_2.5_vl_7b_fp8_scaled.safetensors", "type": "qwen_image", "device": "default"}},
    "3": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_vae.safetensors"}},
    "4": {"class_type": "CLIPTextEncode", "inputs": {"text": CORE + FUSION, "clip": ["2", 0]}},
    "5": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["4", 0]}},
    "6": {"class_type": "EmptySD3LatentImage", "inputs": {"width": 1152, "height": 640, "batch_size": 1}},
    "7": {"class_type": "KSampler", "inputs": {"seed": 7304, "control_after_generate": "fixed", "steps": 4, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": 1, "model": ["1b", 0], "positive": ["4", 0], "negative": ["5", 0], "latent_image": ["6", 0]}},
    "8": {"class_type": "VAEDecode", "inputs": {"samples": ["7", 0], "vae": ["3", 0]}},
    "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": "course_media/chatgpt-zero/inline/cap01-validacao-v2", "images": ["8", 0]}},
}

pid = post("/prompt", {"prompt": wf})["prompt_id"]
print("submitted", pid, flush=True)
t0 = time.time()
while time.time() - t0 < 600:
    try:
        h = json.loads(urllib.request.urlopen(f"{API}/history/{pid}").read())
        if pid in h and h[pid].get("status", {}).get("completed"):
            print(f"OK in {int(time.time()-t0)}s", flush=True)
            break
    except Exception:
        pass
    time.sleep(4)
