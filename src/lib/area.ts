/**
 * A ÁREA de uma tela — o rótulo que responde "onde a pessoa esteve".
 *
 * ## Por que rota crua não serve
 *
 * Ricardo, 10/08/2026: *"onde ele foi e quanto tempo passou em cada área"*.
 *
 * A rota sozinha não responde isso, por dois motivos opostos:
 *
 * 1. **Rota demais.** `/curso/ia-no-whatsapp`, `/curso/chatgpt-zero` e outras
 *    22 são a mesma área ("Página de curso"). Agrupar por rota daria 22 linhas
 *    de 1 minuto cada em vez de uma linha de 22 minutos.
 * 2. **Rota de menos.** ⚠️ O portal — que é o produto — troca de aba **em
 *    estado do React, sem mexer na URL**. `/pt-BR/portal` é a mesma string
 *    para o Dashboard, a Biblioteca, o Ateliê, os Certificados e mais 14
 *    telas. Sem o `tab`, toda a sessão de portal vira um ponto só e as 18
 *    áreas onde a pessoa realmente esteve ficam invisíveis.
 *
 * Por isso a área é derivada de **rota + aba**, e por isso o portal passou a
 * publicar a aba na URL (`?tab=`) — o que também conserta o compartilhamento de
 * link, que já era a intenção do deep-link existente.
 */

/** Ordem importa: a primeira regra que casar vence. */
const REGRAS: Array<{ teste: RegExp; area: string }> = [
  { teste: /^\/portal\/learn\//, area: 'Aula (leitor)' },
  { teste: /^\/portal\/conta/, area: 'Minha conta' },
  { teste: /^\/portal/, area: 'Portal' }, // refinado pela aba, abaixo
  { teste: /^\/curso\/[^/]+\/meu/, area: 'Ateliê (curso sob medida)' },
  { teste: /^\/curso\//, area: 'Página de curso' },
  { teste: /^\/checkout/, area: 'Checkout' },
  { teste: /^\/precos/, area: 'Preços' },
  { teste: /^\/(login|registro|recuperar)/, area: 'Entrar / cadastrar' },
  { teste: /^\/blog|^\/noticias/, area: 'Blog e notícias' },
  { teste: /^\/descobrir|^\/cursos|^\/biblioteca/, area: 'Catálogo' },
  { teste: /^\/inventando/, area: 'Inventando' },
  { teste: /^\/ferramentaria/, area: 'Ferramentaria' },
  { teste: /^\/radar/, area: 'Radar' },
  { teste: /^\/$/, area: 'Home' },
];

/** As abas do portal, com nome de gente. */
const ABAS: Record<string, string> = {
  dashboard: 'Portal · Painel',
  courses: 'Portal · Biblioteca',
  certificates: 'Portal · Certificados',
  studio: 'Portal · Estúdio de imagem',
  assistant: 'Portal · Assistente',
  achievements: 'Portal · Conquistas',
  leaderboard: 'Portal · Ranking',
  challenges: 'Portal · Desafios',
  games: 'Portal · Arcade',
  galeria: 'Portal · Galeria',
  resources: 'Portal · Recursos',
  history: 'Portal · Histórico',
  rewards: 'Portal · Recompensas',
  profile: 'Portal · Perfil',
  social: 'Portal · Social',
  store: 'Portal · Loja',
  'pod-store': 'Portal · Loja POD',
  cart: 'Portal · Carrinho',
};

/**
 * ⚠️ Tira o prefixo de idioma ANTES de casar as regras.
 *
 * A URL real é `/pt-BR/portal`, não `/portal` — foi exatamente esse detalhe que
 * fez `Disallow: /login` não casar nada no robots.txt (ver
 * [[reference_seo_armadilhas_locale]]). O mesmo erro aqui jogaria 100% do
 * tráfego em "Outras".
 */
export function semIdioma(caminho: string): string {
  return caminho.replace(/^\/(pt-BR|en)(?=\/|$)/, '') || '/';
}

export function areaDe(caminho: string, aba?: string | null): string {
  const p = semIdioma(caminho.split('?')[0]);

  for (const { teste, area } of REGRAS) {
    if (teste.test(p)) {
      // O portal só sabe quem é depois de olhar a aba.
      if (area === 'Portal') return (aba && ABAS[aba]) || 'Portal · Painel';
      return area;
    }
  }
  return 'Outras';
}
