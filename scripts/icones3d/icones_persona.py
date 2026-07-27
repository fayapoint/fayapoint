"""Catálogo dos ícones do PERFIL SOCIAL (persona) em 3D.

Os 17 ícones da barra lateral já existem (`icones.py`). Estes são os do
construtor de persona — as áreas e os objetivos, que aparecem em cartão
grande e são o primeiro contato do usuário com o USS.

Só a família **sólida**: foi a escolhida pelo Ricardo em 27/07, e num
conjunto o que importa é as peças combinarem entre si.

Tom de voz e tipos de conteúdo ficaram de fora de propósito: são pílulas
pequenas, onde volume não se vê — e cada malha custa GPU.
"""

from icones import COMUM, FAMILIAS

# id da opção no SocialProfilePanel -> objeto concreto que a malha precisa ser.
# O emoji não serve como prompt: "💻" não é um objeto que o Hunyuan3D reconstrói.
AREAS = [
    ("tech",           "a laptop computer with the lid open at an angle"),
    ("health",         "a medical first aid kit case with a raised cross on the lid"),
    ("education",      "a stack of three thick books with a graduation cap resting on top"),
    # Sem a etiqueta pendurada: superfície fina que o simplificador não colapsa
    # (a primeira versão saiu com 834 KB, sete vezes o teto).
    ("ecommerce",      "a shopping bag with two thick rounded handles, closed top"),
    ("finance",        "a round money bag tied at the neck with a thick cord"),
    ("marketing",      "a megaphone cone with a handle and a small trigger"),
    ("food",           "a chef hat above a round plate with a fork and knife"),
    ("fitness",        "a dumbbell with two thick round weights and a knurled bar"),
    # Um objeto só, e sólido: o espelho compacto ao lado somava um disco fino
    # e a peça saiu com 211 KB.
    ("beauty",         "a lipstick tube with the cap removed and the color stick raised"),
    ("travel",         "a rolling suitcase with a raised handle and two wheels"),
    ("real-estate",    "a small house with a pitched roof, a door and one window"),
    ("law",            "a balance scale with two hanging pans on a central column"),
    ("art",            "an artist paint palette with a brush and three thick paint blobs"),
    ("entertainment",  "a film clapperboard with the top arm raised open"),
    ("sustainability", "a young plant sprout with two leaves growing out of a round pot"),
    ("consulting",     "a light bulb with a thick round glass and a screw base"),
    ("retail",         "a small storefront building with a striped awning"),
    ("other",          "a crystal ball resting on a small ornate stand"),
]

OBJETIVOS = [
    ("engagement",     "a bar chart of three rising blocks with an arrow climbing above them"),
    ("leads",          "an archery target with concentric rings and a dart in the bullseye"),
    ("authority",      "a five-point crown with rounded tips and a jewel at the center"),
    ("sales",          "a stack of three coins next to an upright banknote roll"),
    ("awareness",      "a radio broadcast tower with three signal arcs coming off the top"),
    ("community",      "two rounded figures side by side with their arms joined"),
    ("education",      "an open book with visibly thick stacked pages"),
    ("traffic",        "two interlocking chain links, thick and rounded"),
    ("retention",      "a cut diamond gem with faceted top and pointed bottom"),
    ("networking",     "a sphere wrapped in raised meridian and equator bands, a globe"),
    ("personal-brand", "a five-point star with thick rounded volume"),
    ("conversion",     "a funnel with a wide mouth and a narrow spout, a drop below it"),
    ("content-scale",  "a small factory building with three chimneys of different heights"),
    ("automate",       "a friendly rounded robot head with two eyes and a short antenna"),
]

# Prefixo no nome do arquivo: mantém as duas listas separadas no mesmo diretório
# e permite publicar uma sem tocar na outra.
GRUPOS = {"area": AREAS, "meta": OBJETIVOS}

FAMILIA = "solido"


def todos():
    """(slug, familia, prompt, seed) para as áreas e os objetivos."""
    i = 0
    for grupo, itens in GRUPOS.items():
        for nome, objeto in itens:
            i += 1
            slug = f"{grupo}-{nome}"
            prompt = f"{objeto}, {FAMILIAS[FAMILIA]}, {COMUM}"
            # seed fixa por peça: regerar uma não muda as outras
            yield slug, FAMILIA, prompt, 7000 + i * 13
