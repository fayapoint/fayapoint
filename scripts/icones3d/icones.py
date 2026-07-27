"""Catálogo dos ícones do dashboard e das três linguagens de forma.

Uma linguagem de forma = uma FAMÍLIA coerente para os 17 ícones. Escolher
"opção B" tem que significar escolher um conjunto que combina entre si na
barra lateral — três desenhos bonitos mas de gramáticas diferentes ficariam
piores juntos do que qualquer um deles sozinho.
"""

# id do item na DashboardSidebar -> objeto concreto que a malha precisa ser.
# O nome do ícone lucide não serve como prompt: "Users" não é um objeto.
ICONES = [
    ("dashboard",    "a control panel plate with three raised rectangular tiles of different heights"),
    ("games",        "a chunky game controller with two thumbsticks and a d-pad"),
    ("pod-store",    "an artist paint palette with three thick paint blobs and a brush resting on it"),
    ("store",        "a small storefront building with an awning and a display window"),
    ("cart",         "a shopping cart with a rounded basket and two wheels"),
    ("social",       "three connected spheres linked by two thick bars, a share network"),
    ("profile",      "a five-point crown with rounded tips and a jewel at the center"),
    ("courses",      "an open book with visibly thick stacked pages"),
    ("certificates", "an award medal disc with a folded ribbon behind it"),
    ("studio",       "a picture frame with a mountain and a sun raised in relief inside it"),
    ("assistant",    "a friendly rounded robot head with two eyes and a short antenna"),
    ("achievements", "a two-handled trophy cup on a square base"),
    ("leaderboard",  "a three-step podium with a rounded figure standing on the tallest step"),
    ("challenges",   "an archery target with concentric rings and a dart in the bullseye"),
    ("resources",    "a downward arrow landing on a horizontal tray"),
    ("history",      "a shopping bag with two rounded handles"),
    ("rewards",      "a gift box with a raised ribbon cross and a bow on top"),
]

# As três famílias. O que muda é a GRAMÁTICA DA FORMA — não a cor, que é
# material no código (a malha do Hunyuan3D sai sem textura).
FAMILIAS = {
    "solido": (
        "chunky solid toy object, thick rounded edges, soft inflated volume, "
        "smooth continuous surface, vinyl designer toy sculpture"
    ),
    "facetado": (
        "faceted low-poly sculpture, crisp flat planes meeting at sharp beveled edges, "
        "angular geometric planes, cut-gem construction"
    ),
    "emblema": (
        "the object raised in high relief at the center of a thick circular medallion disc, "
        "the disc has a raised outer rim, badge-pin construction"
    ),
}

# Vale para as três: o que o Hunyuan3D precisa ver para reconstruir a malha.
COMUM = (
    "single centered object, three-quarter view from slightly above, "
    "isolated on a plain flat light grey background, even soft studio lighting, "
    "no cast shadow, no ground plane, no text, no letters, no logo, no watermark, "
    "the entire object fully visible with margin around it, "
    "neutral matte clay material, product render"
)

NEGATIVO = (
    "text, letters, words, watermark, multiple objects, cropped, cut off, "
    "busy background, scenery, hands, people, harsh shadows, reflections"
)


def prompt_de(objeto: str, familia: str) -> str:
    return f"{objeto}, {FAMILIAS[familia]}, {COMUM}"


def todos():
    """(slug, familia, prompt, seed) para os 17 x 3."""
    for i, (slug, objeto) in enumerate(ICONES):
        for j, familia in enumerate(FAMILIAS):
            yield slug, familia, prompt_de(objeto, familia), 7000 + i * 10 + j
