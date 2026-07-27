"""R9 passo 1 — recortar o Ricardo da foto real com BiRefNet.

Por que recortar em vez de gerar: em 25/07 ficou medido que geracao local NAO
reproduz o rosto dele (Qwen Edit acerta o tipo, nao a pessoa) e que treinar
LoRA aqui e inviavel. Partindo de uma FOTOGRAFIA, o rosto e ele por construcao.
"""
import json, urllib.request, time, sys, os

COMFY = "http://127.0.0.1:8000"
FOTO = r"C:\Users\ricar\WORKSMAIN\autoresearch\LORA\Ricardo_Faya\_dataset\crops\ric_016.jpg"
ENTRADA = r"C:\WORKS\ComfyUI\input"


def enfileirar(g):
    req = urllib.request.Request(
        f"{COMFY}/prompt",
        data=json.dumps({"prompt": g}).encode(),
        headers={"Content-Type": "application/json"},
    )
    return json.loads(urllib.request.urlopen(req, timeout=60).read())["prompt_id"]


def esperar(pid, limite=600):
    t0 = time.time()
    while time.time() - t0 < limite:
        h = json.loads(urllib.request.urlopen(f"{COMFY}/history/{pid}", timeout=30).read())
        if pid in h:
            st = h[pid]["status"]
            if st.get("status_str") == "error":
                for m in st.get("messages", []):
                    if m[0] == "execution_error":
                        print("ERRO:", json.dumps(m[1], indent=1)[:1500])
                return None
            if st.get("completed"):
                return h[pid]["outputs"]
        time.sleep(3)
    print("timeout")
    return None


nome = "r9_ricardo_fonte.jpg"
import shutil
shutil.copy(FOTO, os.path.join(ENTRADA, nome))

g = {
    "1": {"class_type": "LoadImage", "inputs": {"image": nome}},
    "2": {"class_type": "LoadBackgroundRemovalModel",
          "inputs": {"bg_removal_name": "birefnet.safetensors"}},
    "3": {"class_type": "RemoveBackground",
          "inputs": {"bg_removal_model": ["2", 0], "image": ["1", 0]}},
    # A MASK do RemoveBackground marca o FUNDO, nao o sujeito — sem inverter,
    # o recorte sai ao contrario (verificado: silhueta transparente, fundo opaco).
    "3b": {"class_type": "InvertMask", "inputs": {"mask": ["3", 0]}},
    # JoinImageWithAlpha grava PNG com transparencia de verdade
    "4": {"class_type": "JoinImageWithAlpha",
          "inputs": {"image": ["1", 0], "alpha": ["3b", 0]}},
    "5": {"class_type": "SaveImage",
          "inputs": {"images": ["4", 0], "filename_prefix": "r9_ricardo_recorte"}},
}

pid = enfileirar(g)
print("job", pid)
out = esperar(pid)
if out:
    for n, o in out.items():
        for im in o.get("images", []):
            print("SAIU:", os.path.join(r"C:\WORKS\ComfyUI\output", im.get("subfolder", ""), im["filename"]))
else:
    sys.exit(1)
