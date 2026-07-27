/**
 * Catálogo dos ícones 3D do dashboard — GERADO por `scripts/icones3d/publicar.py`.
 * Não editar à mão: rode o script de novo.
 *
 * Cada ícone tem três opções de LINGUAGEM DE FORMA (sólido, facetado,
 * emblema). A cor não está aqui: a malha do Hunyuan3D sai sem textura e a
 * cor é material no código, na paleta da marca — que é o certo, porque
 * assim ela acompanha o tema em vez de ficar pintada no arquivo.
 */

export interface OpcaoIcone {
  familia: string;
  arquivo: string;
  kb: number;
}

export interface IconeTresD {
  /** id do item na DashboardSidebar */
  slug: string;
  /** o objeto que a malha representa */
  objeto: string;
  opcoes: OpcaoIcone[];
}

export const ICONES_3D: IconeTresD[] = [
  {
    "slug": "dashboard",
    "objeto": "a control panel plate with three raised rectangular tiles of different heights",
    "opcoes": [
      {
        "familia": "solido",
        "arquivo": "/3d/icones/dashboard_solido.glb",
        "kb": 30
      }
    ]
  },
  {
    "slug": "games",
    "objeto": "a chunky game controller with two thumbsticks and a d-pad",
    "opcoes": [
      {
        "familia": "solido",
        "arquivo": "/3d/icones/games_solido.glb",
        "kb": 39
      }
    ]
  },
  {
    "slug": "pod-store",
    "objeto": "an artist paint palette with three thick paint blobs and a brush resting on it",
    "opcoes": [
      {
        "familia": "solido",
        "arquivo": "/3d/icones/pod-store_solido.glb",
        "kb": 113
      }
    ]
  },
  {
    "slug": "store",
    "objeto": "a small storefront building with an awning and a display window",
    "opcoes": [
      {
        "familia": "solido",
        "arquivo": "/3d/icones/store_solido.glb",
        "kb": 90
      }
    ]
  },
  {
    "slug": "cart",
    "objeto": "a shopping cart with a rounded basket and two wheels",
    "opcoes": [
      {
        "familia": "solido",
        "arquivo": "/3d/icones/cart_solido.glb",
        "kb": 84
      }
    ]
  },
  {
    "slug": "social",
    "objeto": "three connected spheres linked by two thick bars, a share network",
    "opcoes": [
      {
        "familia": "solido",
        "arquivo": "/3d/icones/social_solido.glb",
        "kb": 32
      }
    ]
  },
  {
    "slug": "profile",
    "objeto": "a five-point crown with rounded tips and a jewel at the center",
    "opcoes": [
      {
        "familia": "solido",
        "arquivo": "/3d/icones/profile_solido.glb",
        "kb": 69
      }
    ]
  },
  {
    "slug": "courses",
    "objeto": "an open book with visibly thick stacked pages",
    "opcoes": [
      {
        "familia": "solido",
        "arquivo": "/3d/icones/courses_solido.glb",
        "kb": 34
      }
    ]
  },
  {
    "slug": "certificates",
    "objeto": "an award medal disc with a folded ribbon behind it",
    "opcoes": [
      {
        "familia": "solido",
        "arquivo": "/3d/icones/certificates_solido.glb",
        "kb": 116
      }
    ]
  },
  {
    "slug": "studio",
    "objeto": "a picture frame with a mountain and a sun raised in relief inside it",
    "opcoes": [
      {
        "familia": "solido",
        "arquivo": "/3d/icones/studio_solido.glb",
        "kb": 34
      }
    ]
  },
  {
    "slug": "assistant",
    "objeto": "a friendly rounded robot head with two eyes and a short antenna",
    "opcoes": [
      {
        "familia": "solido",
        "arquivo": "/3d/icones/assistant_solido.glb",
        "kb": 27
      }
    ]
  },
  {
    "slug": "achievements",
    "objeto": "a two-handled trophy cup on a square base",
    "opcoes": [
      {
        "familia": "solido",
        "arquivo": "/3d/icones/achievements_solido.glb",
        "kb": 48
      }
    ]
  },
  {
    "slug": "leaderboard",
    "objeto": "a three-step podium with a rounded figure standing on the tallest step",
    "opcoes": [
      {
        "familia": "solido",
        "arquivo": "/3d/icones/leaderboard_solido.glb",
        "kb": 47
      }
    ]
  },
  {
    "slug": "challenges",
    "objeto": "an archery target with concentric rings and a dart in the bullseye",
    "opcoes": [
      {
        "familia": "solido",
        "arquivo": "/3d/icones/challenges_solido.glb",
        "kb": 56
      }
    ]
  },
  {
    "slug": "resources",
    "objeto": "a downward arrow landing on a horizontal tray",
    "opcoes": [
      {
        "familia": "solido",
        "arquivo": "/3d/icones/resources_solido.glb",
        "kb": 26
      }
    ]
  },
  {
    "slug": "history",
    "objeto": "a shopping bag with two rounded handles",
    "opcoes": [
      {
        "familia": "solido",
        "arquivo": "/3d/icones/history_solido.glb",
        "kb": 41
      }
    ]
  },
  {
    "slug": "rewards",
    "objeto": "a gift box with a raised ribbon cross and a bow on top",
    "opcoes": [
      {
        "familia": "solido",
        "arquivo": "/3d/icones/rewards_solido.glb",
        "kb": 57
      }
    ]
  }
];
