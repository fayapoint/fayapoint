"""R9b passo 3 — recortar a pessoa nos 121 quadros, em lote.

Um job so: o LoadImageDataSetFromFolder devolve a pasta inteira como um batch
de IMAGE, e o BiRefNet aceita batch. Disparar 121 jobs separados carregaria e
descarregaria o modelo 121 vezes.
"""
import json, urllib.request, time, sys, os

COMFY = "http://127.0.0.1:8000"
PASTA = "r9b_pessoa"


def enfileirar(g):
    req = urllib.request.Request(f"{COMFY}/prompt", data=json.dumps({"prompt": g}).encode(),
                                 headers={"Content-Type": "application/json"})
    try:
        return json.loads(urllib.request.urlopen(req, timeout=60).read())["prompt_id"]
    except urllib.error.HTTPError as e:
        print(json.dumps(json.loads(e.read()), indent=1)[:2500]); raise


def esperar(pid, limite=2400):
    t0 = time.time()
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
        print(f"  {int(time.time()-t0)}s", flush=True)
        time.sleep(15)
    return None


g = {
    "1": {"class_type": "LoadImageDataSetFromFolder", "inputs": {"folder": PASTA}},
    "2": {"class_type": "LoadBackgroundRemovalModel",
          "inputs": {"bg_removal_name": "birefnet.safetensors"}},
    "3": {"class_type": "RemoveBackground",
          "inputs": {"bg_removal_model": ["2", 0], "image": ["1", 0]}},
    # a MASK do BiRefNet marca o FUNDO — sem inverter o recorte sai ao contrario
    "4": {"class_type": "InvertMask", "inputs": {"mask": ["3", 0]}},
    "5": {"class_type": "JoinImageWithAlpha", "inputs": {"image": ["1", 0], "alpha": ["4", 0]}},
    "6": {"class_type": "SaveImage", "inputs": {"images": ["5", 0], "filename_prefix": "r9b_alpha/a"}},
}

pid = enfileirar(g)
print("job", pid, flush=True)
out = esperar(pid)
if not out:
    sys.exit(1)
n = sum(len(o.get("images", [])) for o in out.values())
print(f"PRONTO — {n} recortes")
