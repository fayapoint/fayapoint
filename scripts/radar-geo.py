#!/usr/bin/env python3
"""Prepara os dados geograficos do Radar FayAI.

Baixa, poda e simplifica:
  - paises do mundo (Natural Earth 110m, dominio publico)
  - estados do Brasil (malhas do IBGE, dado publico)
  - regioes do Brasil (idem)

Por que simplificar: os arquivos crus somam ~845 KB. Eles viajam para o
navegador de todo visitante da home, e a diferenca entre 845 KB e 200 KB e a
diferenca entre a secao abrir junto com a pagina ou depois dela.

Saida: fayapoint-ai/src/data/geo/*.json  (importados no chunk do globo)

Rodar:  python scripts/radar-geo.py
"""
import gzip
import json
import math
import os
import urllib.request

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126", "Accept-Encoding": "gzip"}

PAISES_URL = ("https://raw.githubusercontent.com/vasturiano/globe.gl/master/"
              "example/datasets/ne_110m_admin_0_countries.geojson")
IBGE = "https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/vnd.geo+json"

# codigo IBGE -> (sigla, nome, codigo da regiao)
UFS = {
    "11": ("RO", "Rondonia", 1), "12": ("AC", "Acre", 1), "13": ("AM", "Amazonas", 1),
    "14": ("RR", "Roraima", 1), "15": ("PA", "Para", 1), "16": ("AP", "Amapa", 1),
    "17": ("TO", "Tocantins", 1),
    "21": ("MA", "Maranhao", 2), "22": ("PI", "Piaui", 2), "23": ("CE", "Ceara", 2),
    "24": ("RN", "Rio Grande do Norte", 2), "25": ("PB", "Paraiba", 2),
    "26": ("PE", "Pernambuco", 2), "27": ("AL", "Alagoas", 2), "28": ("SE", "Sergipe", 2),
    "29": ("BA", "Bahia", 2),
    "31": ("MG", "Minas Gerais", 3), "32": ("ES", "Espirito Santo", 3),
    "33": ("RJ", "Rio de Janeiro", 3), "35": ("SP", "Sao Paulo", 3),
    "41": ("PR", "Parana", 4), "42": ("SC", "Santa Catarina", 4),
    "43": ("RS", "Rio Grande do Sul", 4),
    "50": ("MS", "Mato Grosso do Sul", 5), "51": ("MT", "Mato Grosso", 5),
    "52": ("GO", "Goias", 5), "53": ("DF", "Distrito Federal", 5),
}

REGIOES = {
    "1": ("N", "Norte"), "2": ("NE", "Nordeste"), "3": ("SE", "Sudeste"),
    "4": ("S", "Sul"), "5": ("CO", "Centro-Oeste"),
}


def baixar(url):
    req = urllib.request.Request(url, headers=UA)
    raw = urllib.request.urlopen(req, timeout=90).read()
    if raw[:2] == b"\x1f\x8b":
        raw = gzip.decompress(raw)
    return json.loads(raw)


# --------------------------------------------------------------------------
# Simplificacao Douglas-Peucker. Escrita a mao para nao arrastar shapely/gdal
# so por causa de tres arquivos gerados uma vez.
# --------------------------------------------------------------------------

def _dist_perp(p, a, b):
    (px, py), (ax, ay), (bx, by) = p, a, b
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def simplificar(pontos, tol):
    if len(pontos) < 3:
        return pontos
    dmax, idx = 0.0, 0
    for i in range(1, len(pontos) - 1):
        d = _dist_perp(pontos[i], pontos[0], pontos[-1])
        if d > dmax:
            dmax, idx = d, i
    if dmax > tol:
        esq = simplificar(pontos[:idx + 1], tol)
        dir_ = simplificar(pontos[idx:], tol)
        return esq[:-1] + dir_
    return [pontos[0], pontos[-1]]


def arredondar(pontos, casas=3):
    """3 casas decimais = ~110 m no equador. Mais que suficiente num globo."""
    return [[round(x, casas), round(y, casas)] for x, y in pontos]


def limpar_anel(anel, tol):
    s = simplificar([tuple(p[:2]) for p in anel], tol)
    if len(s) < 4:                      # anel degenerado: devolve o original curto
        s = [tuple(p[:2]) for p in anel]
    s = arredondar([list(p) for p in s])
    if s[0] != s[-1]:
        s.append(s[0])
    return s


def limpar_geometria(geom, tol, area_min):
    """Simplifica e descarta ilhotas irrelevantes na escala de um globo."""
    t = geom["type"]
    if t == "Polygon":
        aneis = [limpar_anel(a, tol) for a in geom["coordinates"]]
        aneis = [a for a in aneis if _area(a) >= area_min or a is aneis[0]]
        return {"type": "Polygon", "coordinates": aneis} if aneis else None
    if t == "MultiPolygon":
        polis = []
        for poli in geom["coordinates"]:
            aneis = [limpar_anel(a, tol) for a in poli]
            if _area(aneis[0]) < area_min:
                continue
            polis.append(aneis)
        if not polis:                    # nao apagar o pais inteiro
            maior = max(geom["coordinates"], key=lambda p: _area(p[0]))
            polis = [[limpar_anel(a, tol) for a in maior]]
        return {"type": "MultiPolygon", "coordinates": polis}
    return None


def _area(anel):
    """Area do shoelace em graus quadrados — serve so para comparar tamanhos."""
    s = 0.0
    for i in range(len(anel) - 1):
        x1, y1 = anel[i][0], anel[i][1]
        x2, y2 = anel[i + 1][0], anel[i + 1][1]
        s += x1 * y2 - x2 * y1
    return abs(s) / 2


def gravar(caminho, dado):
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(dado, f, ensure_ascii=False, separators=(",", ":"))
    return os.path.getsize(caminho) // 1024


def main():
    saida = os.path.join(os.getcwd(), "src", "data", "geo")

    # ---- paises -----------------------------------------------------------
    print("baixando paises...")
    mundo = baixar(PAISES_URL)
    feats = []
    for f in mundo["features"]:
        p = f["properties"]
        iso = (p.get("ISO_A2") or "").upper()
        if iso in ("", "-99"):
            continue
        g = limpar_geometria(f["geometry"], tol=0.35, area_min=1.2)
        if not g:
            continue
        feats.append({"type": "Feature",
                      "properties": {"iso": iso, "nome": p.get("ADMIN") or p.get("SOVEREIGNT")},
                      "geometry": g})
    kb = gravar(os.path.join(saida, "mundo.json"),
                {"type": "FeatureCollection", "features": feats})
    print(f"  mundo.json: {len(feats)} paises, {kb} KB")

    # ---- estados ----------------------------------------------------------
    print("baixando estados do IBGE...")
    uf = baixar(IBGE + "&qualidade=intermediaria&intrarregiao=UF")
    feats = []
    for f in uf["features"]:
        cod = str(f["properties"].get("codarea", "")).strip()
        if cod not in UFS:
            continue
        sigla, nome, reg = UFS[cod]
        g = limpar_geometria(f["geometry"], tol=0.08, area_min=0.05)
        feats.append({"type": "Feature",
                      "properties": {"uf": sigla, "nome": nome, "regiao": REGIOES[str(reg)][0]},
                      "geometry": g})
    kb = gravar(os.path.join(saida, "brasil-uf.json"),
                {"type": "FeatureCollection", "features": feats})
    print(f"  brasil-uf.json: {len(feats)} estados, {kb} KB")

    # ---- regioes ----------------------------------------------------------
    print("baixando regioes do IBGE...")
    reg = baixar(IBGE + "&qualidade=intermediaria&intrarregiao=regiao")
    feats = []
    for f in reg["features"]:
        cod = str(f["properties"].get("codarea", "")).strip()
        if cod not in REGIOES:
            continue
        sigla, nome = REGIOES[cod]
        g = limpar_geometria(f["geometry"], tol=0.12, area_min=0.05)
        feats.append({"type": "Feature",
                      "properties": {"regiao": sigla, "nome": nome},
                      "geometry": g})
    kb = gravar(os.path.join(saida, "brasil-regioes.json"),
                {"type": "FeatureCollection", "features": feats})
    print(f"  brasil-regioes.json: {len(feats)} regioes, {kb} KB")


if __name__ == "__main__":
    main()
