# FayAI Audio Production Status

**Last updated:** April 12, 2026
**Pipeline:** `audio_pipeline.py` (project root)
**Resume script:** `run_course.py <course_idx> [start_ch]`

## Credits Used
- Quota: 180,152 characters
- Used: 180,152 (100% consumed)
- Status: **QUOTA EXHAUSTED** — waiting for reset or upgrade

## Generated Audio (34 files, ~172 MB)

### IA Sem Filtro por Claude (Sacred Text)
| Chapter | Fernando Borges | Beto | Sergio |
|---------|:-:|:-:|:-:|
| Ch 01 - Prazer, Eu Sou Claude | ✅ | ✅ | ✅ |
| Ch 02 - Como Eu Fui Criado | ✅ | ✅ | ✅ |
| Ch 03 - O Que Eu Realmente Sei | ✅ | ✅ | ✅ |
| Ch 04 - Eu Penso? Consciência em IA | ✅ | ✅ | ✅ |
| Ch 05 - Tokens, Atenção e Transformers | ✅ | ✅ | ✅ |
| Ch 06 - Treinamento | ✅ | ✅ | ✅ |
| Ch 07 - Alucinações | ✅ | ✅ | ✅ |
| Ch 08 - Meus Limites | ✅ | ✅ | ✅ |
| Ch 09 - Onde IA Já É Incrível | ✅ | ✅ | ✅ |
| Ch 10 - Onde IA É Terrível | ✅ | ✅ | ✅ |
| Ch 11 - Como Usar IA no Dia a Dia | ✅ | ✅ | ✅ |
| Ch 12 - Os Melhores Prompts | ✅ | ❌ | ❌ |
| Ch 13-20 | ❌ | ❌ | ❌ |

### Other Courses
All preprocessed text is ready in `content-forge/tts-ready/`:
- ChatGPT Masterclass: 30 chapters (❌ not started)
- Prompt Engineering: 15 chapters (❌ not started)
- Autoresearch Singularity: 47 chapters (❌ not started)
- ChatGPT Allowlisting: 18 chapters (❌ not started)

### Reel Narrations
All 25 scripts preprocessed in `content-forge/tts-ready/_reels/` (❌ not started)

## Voice Selections

### Audiobook Voices (3 options per chapter)
1. **Fernando Borges** (`6pQlwCgfwffNdI3jjzM6`) — Calm, classy, educational. Stability: 0.55, Style: 0.35
2. **Beto** (`xNGAXaCH8MaasNuo7Hr7`) — Friendly, engaging. Stability: 0.50, Style: 0.40
3. **Sergio** (`rnJZLKxtlBZt77uIED10`) — Deep, authoritative, resonant. Stability: 0.60, Style: 0.30

### Reel Voices (3 options per narration)
1. **Yuri VSL** (`WSBwiRQRmi2mEG7BfKwS`) — Confident, social media. Stability: 0.30, Style: 0.80
2. **Estive** (`YU8EsJtXFMyKMxYtheDk`) — Hyped, vibrant. Stability: 0.30, Style: 0.85
3. **Beto Energetic** (`xNGAXaCH8MaasNuo7Hr7`) — Captivating, engaging. Stability: 0.30, Style: 0.75

## How to Resume

Once credits are available, run:
```bash
# Continue IA Sem Filtro from ch 12
python3 run_course.py 0 12

# Then other courses:
python3 run_course.py 1  # ChatGPT Masterclass
python3 run_course.py 2  # Prompt Engineering
python3 run_course.py 3  # Autoresearch
python3 run_course.py 4  # Allowlisting

# Reels:
python3 audio_pipeline.py reels

# Platform audio:
python3 audio_pipeline.py platform
```

## Characters Remaining to Generate
- IA Sem Filtro ch12-20: ~40K × 3 = ~120K chars
- ChatGPT Masterclass: ~58K × 3 = ~175K chars
- Prompt Engineering: ~43K × 3 = ~129K chars
- Autoresearch: ~93K × 3 = ~280K chars
- Allowlisting: ~76K × 3 = ~227K chars
- Reels: ~8K × 3 = ~24K chars
- Platform audio: ~1K × 3 = ~3K chars
- **TOTAL: ~958K chars** (needs ~192K actual credits with 5x promo)
