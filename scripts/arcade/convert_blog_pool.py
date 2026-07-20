# -*- coding: utf-8 -*-
"""Converte as PNGs geradas em generate_blog_pool.py para WebP no padrao do
site (768 largura, quality 80, ~40KB) e copia para public/blog/covers/pool/.
Usa o manifest para casar prefix ComfyUI -> nome final identificavel."""
import json, os, glob, subprocess

MANIFEST = "scripts/arcade/blogpool-manifest.json"
COMFY_OUT = "C:/WORKS/ComfyUI/output"
DEST = "public/blog/covers/pool"
FFMPEG = "C:/Users/ricar/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1-full_build/bin/ffmpeg.exe"

os.makedirs(DEST, exist_ok=True)

with open(MANIFEST, encoding="utf-8") as f:
    manifest = json.load(f)

ok, missing = [], []
for entry in manifest:
    prefix = entry["prefix"]  # e.g. blogpool/20260720_tendencia-01-radar-tempestade
    file_slug = entry["file_slug"]
    pattern = os.path.join(COMFY_OUT, prefix + "_*.png")
    matches = sorted(glob.glob(pattern))
    if not matches:
        missing.append(file_slug)
        continue
    src = matches[-1]  # ultima (maior contador) se houver mais de uma
    dst = os.path.join(DEST, f"{file_slug}.webp")
    result = subprocess.run(
        [FFMPEG, "-y", "-i", src, "-vf", "scale=768:-1", "-quality", "80", dst],
        capture_output=True, text=True,
    )
    if result.returncode == 0 and os.path.exists(dst):
        size_kb = os.path.getsize(dst) / 1024
        ok.append((file_slug, size_kb))
    else:
        missing.append(file_slug)
        print(f"FFMPEG FAILED for {file_slug}: {result.stderr[-300:]}")

print(f"\nConverted {len(ok)}/{len(manifest)}")
if missing:
    print("MISSING/FAILED:", missing)
avg_kb = sum(s for _, s in ok) / len(ok) if ok else 0
print(f"avg size: {avg_kb:.1f}KB")
over40 = [s for s, kb in ok if kb > 45]
if over40:
    print(f"{len(over40)} files over 45KB: {over40}")
