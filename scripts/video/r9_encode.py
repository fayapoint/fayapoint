"""R9 passo 4 — frames -> WebM + poster, dentro do orcamento de peso do site.

O slot na pagina tem 420-480 px de largura. Codificar em 960 px cobre tela
retina e ja e o dobro do necessario; 1280 seria peso pago por pixel que ninguem
ve. O teto de 400 KB vem do IDENTIDADE_VISUAL — a home ja perdeu banda da
Netlify uma vez, e video de apoio nao pode ser o que derruba a pagina.
"""
import subprocess, glob, os, sys, shutil

FRAMES = sys.argv[1] if len(sys.argv) > 1 else r"C:\WORKS\ComfyUI\output\r9_frames_v2"
DESTINO = r"C:\Users\ricar\WORKSMAIN\autoresearch\fayapoint-ai\public\radar"
LARGURA = 960
TETO_KB = 400

os.makedirs(DESTINO, exist_ok=True)
fs = sorted(glob.glob(os.path.join(FRAMES, "*.png")))
if not fs:
    sys.exit(f"sem frames em {FRAMES}")
print(len(fs), "frames")

# O ComfyUI grava "<prefixo>_00001_.png": 5 digitos + "_.png" = 10 caracteres
# no fim. Contar errado aqui gera um padrao com um zero a mais e o ffmpeg falha
# sem dizer o motivo (exit 4294967294).
import re
m = re.match(r"^(.*?)(\d{5})_\.png$", os.path.basename(fs[0]))
padrao = os.path.join(FRAMES, m.group(1) + "%05d_.png")
inicio = int(m.group(2))

webm = os.path.join(DESTINO, "abertura.webm")
poster = os.path.join(DESTINO, "abertura.webp")

# O poster e o PRIMEIRO frame — o mesmo que o video mostra parado com
# prefers-reduced-motion. Poster diferente do primeiro quadro causa um salto
# visivel quando o video comeca.
subprocess.run(["ffmpeg", "-y", "-i", fs[0], "-vf", f"scale={LARGURA}:-2",
                "-quality", "82", poster], check=True,
               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

for crf in (34, 38, 42, 46, 50):
    subprocess.run([
        "ffmpeg", "-y", "-framerate", "25", "-start_number", str(inicio), "-i", padrao,
        "-vf", f"scale={LARGURA}:-2",
        "-c:v", "libvpx-vp9", "-crf", str(crf), "-b:v", "0",
        "-row-mt", "1", "-cpu-used", "2", "-pix_fmt", "yuv420p",
        "-an", webm,
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    kb = os.path.getsize(webm) / 1024
    print(f"  crf {crf}: {kb:.0f} KB")
    if kb <= TETO_KB:
        break

print("webm  ", webm, f"{os.path.getsize(webm)/1024:.0f} KB")
print("poster", poster, f"{os.path.getsize(poster)/1024:.0f} KB")
