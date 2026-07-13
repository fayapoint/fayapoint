# PLANO — Reformulação UX: navegação, confiança e humanização

*13/07/2026 — baseado no teste exaustivo do Ricardo + estudo dos 2 vídeos de método (transcrições no scratchpad da sessão) + recon do código com evidências. Fonte de método: IDENTIDADE_VISUAL.md §9–§11.*

## O diagnóstico (com evidência no código)

### D1. Logout fantasma — 3 mecanismos frágeis se combinam
1. `src/contexts/UserContext.tsx:117-122` — se `/api/user/profile` responde 200 com `{user:null}` (o que `getAuthUser()` faz para QUALQUER falha de cookie/JWT, até transitória), o contexto **apaga localStorage e desloga**. Uma falha momentânea vira logout permanente.
2. `src/hooks/useDashboard.ts:84-96` — 401 em `/api/user/dashboard` → apaga `fayai_token` + `fayai_user` e mostra tela de login.
3. `src/app/[locale]/(site)/portal/page.tsx:404,472` — a própria página do portal também apaga token em `dashboardError`.
Não existe rota de recuperação: mesmo com um token válido no localStorage, ninguém tenta re-emitir o cookie. Falhou uma vez → relogar na mão.

### D2. Navegação sem espinha dorsal
- O `Header` é importado **página a página** (não no layout) — `/projetos`, `/noticias` e o portal não têm nav global nenhuma.
- `/projetos` é beco sem saída: só logo→home e link de /login (`ProjetosPage.tsx:89-92`).
- Portal vaza para o site público: sidebar `cubeHref → /${locale}` (home!), trilha linka `/`, `/cursos`, `/certificacoes`, `/projetos`; ações linkam `/precos`, `/carrinho`, `/configuracoes` — todas fora do shell (`DashboardSidebar.tsx:105`, `DashboardHome.tsx:393-396`).
- `BackToCube` flutua em TODAS as páginas do grupo (site), inclusive portal.
- Home pública não reconhece usuário logado — o aluno "volta ao mundo dos visitantes" (perde pertencimento).

### D3. Humanização incompleta
- Minigame: colagem = 4 imagens de pool genérico por categoria em grid (`NovaLanding.tsx:387`), sem relação 1:1 com o exemplo narrado, sem animação.
- Trilha "Seu caminho para dominar IA" = 4 cards de texto estáticos que expulsam o usuário do portal (`DashboardHome.tsx:383-414`).
- Páginas de projeto compartilham o mesmo template cinematográfico — não demonstram alcance de estilos.

## O método (dos vídeos → IDENTIDADE_VISUAL §9–§11)
1. Referências → blueprint de design antes de codar; 2. uma direção de arte POR página de projeto; 3. assets contextuais programáticos (regra do espelho §9); 4. **3 passes de iteração com a página aberta no browser**; 5. dados de conversão acima de gosto; 6. experiência > scroll estático, sem sacrificar performance.

---

## FASE 1 — Confiança: sessão que nunca cai injustamente ⚡ (primeira, bloqueia tudo)
**Objetivo: logado fica logado 7 dias, ponto. Falha transitória se cura sozinha.**

1. **Nova rota `POST /api/auth/refresh`**: aceita Bearer (localStorage) ou cookie; verifica JWT; se válido, re-emite os cookies `token`/`fayai_token` (renovação deslizante 7d) e devolve `{user}` fresco do Mongo.
2. **`UserContext` resiliente**: ao receber `{user:null}`, ANTES de apagar qualquer coisa tenta `refresh` com o Bearer do localStorage; só desloga se o refresh também falhar (401 confirmado). Erro de rede NUNCA desloga (já é assim, manter).
3. **`useDashboard` resiliente**: em 401, tenta `refresh` + 1 retry do dashboard; só então limpa.
4. **Portal page**: remover as limpezas de token locais (linhas 404/472) — única autoridade de logout = UserContext.
5. Aceite: derrubar o cookie manualmente no DevTools com localStorage intacto → navegar → sessão se recupera sem relogar; expirar os dois → login pedido uma única vez.

## FASE 2 — Espinha dorsal de navegação
**Objetivo: nunca existir tela sem "onde estou / para onde vou".**

1. **Header global no layout**: mover `<Header/>`+`<Footer/>` para `[locale]/(site)/layout.tsx` (removendo dos ~30 page.tsx); trazer `/projetos` e `/noticias` para dentro do grupo `(site)` (ou dar-lhes layout próprio com o mesmo Header). Header já é auth-aware (mostra Portal quando logado) — vira onipresente.
2. **Regra do shell**: rotas de aluno (`/portal/*`, `/configuracoes`, `/carrinho`, checkout de aluno) rendem DENTRO do shell do dashboard (sidebar + MobileBottomNav persistentes): converter os painéis para rotas filhas `/portal/(painel)` ou layout de grupo `(portal)`.
3. **Sidebar corrigida**: fora `cubeHref` para home; entra "Início do Portal"; `BackToCube` não renderiza em rotas do shell; link "ver o site" explícito (abre em contexto claro, sem perder sessão).
4. **Home consciente**: logado, a NovaLanding mostra faixa persistente "Bem-vindo de volta, {nome} — continuar sua jornada →/portal" (e o minigame vira "modo convidado" opcional).
5. **Breadcrumbs** em páginas profundas (curso, projeto, notícia) + **404 com bússola** (links para portal/cursos/projetos).
6. Aceite: de QUALQUER página, existe caminho de 1 clique para (a) portal se logado, (b) seção-mãe; teste de tab completo sem beco sem saída.

## FASE 3 — Trilha "Seu caminho para dominar IA" (o coração do portal)
**Objetivo: a hora de conquistar o usuário — mapa de jornada gamificado, animado e DENTRO do portal.**

1. **Modelo de dados**: `progress.trail` no User (Mongo): módulos com estado (bloqueado/atual/completo), XP por nó.
2. **Mapa visual**: substitui os 4 cards por um caminho (SVG serpenteante) com nós ilustrados (arte contextual §9 por módulo), estados animados (nó atual pulsa com glow da categoria, completos ganham selo dourado), Framer Motion na revelação.
3. **Conteúdo dos módulos** (ordem de conquista, ferramentas mais usadas primeiro):
   ① Primeiros passos com ChatGPT · ② Prompts que funcionam · ③ IA no celular (gravador→transcrição, foto→resposta) · ④ Imagens com IA · ⑤ IA no trabalho (e-mail, planilha, apresentação) · ⑥ Automação sem código · ⑦ Criar com IA (site, música, vídeo) · ⑧ Projeto final + certificado.
   Cada módulo: **1 aula curta + 1 minigame novo** (padrão Fase 4) + recompensa XP real.
4. **Animação de boas-vindas**: primeira visita ao portal → tour de 4 passos (spotlight nos painéis, imagens §9, skippable, `localStorage.fayai_tour_done`).
5. Aceite: usuário novo entende em 30s o que fazer; cada nó leva a conteúdo real DENTRO do shell; progresso persiste entre sessões/dispositivos.

## FASE 4 — Minigames humanizados (regra do espelho em tudo)
1. **Cena contextual por exemplo**: cada exemplo do minigame da home ganha composição que ENCENA a ação narrada (gravador na telinha do celular etc.) — gerada no ComfyUI (receitas §9), em 2–4 camadas.
2. **Colagem → cena animada**: substituir o grid 4-em-linha por composição em camadas com Framer Motion (parallax, float, pop-in do resultado, sparkles) — Liga A de §10; heróis podem usar vídeo-loop LTX (Liga B, ≤400KB, 1/página).
3. **Minigames da trilha** (novos, mais trabalhados que o da home): interações de montar-prompt, arrastar-e-soltar, adivinhar-o-resultado, simulador de conversa — cada um com suas cenas espelho e animação própria.
4. **Pipeline de assets**: script batch ComfyUI (comfy-local skill) → WebP ≤40KB/camada → `public/images/scenes/{contexto}/`; inventário em `scripts/scenes-manifest.json`.
5. Aceite: nenhum exemplo com imagem genérica; toda cena espelha o texto; page weight da home não cresce >150KB.

## FASE 5 — Páginas de projeto únicas (vitrine de alcance)
1. `/projetos` vira hub com Header global + filtros + destaque.
2. **Cada projeto = uma direção de arte própria** (blueprint documentado no topo do arquivo):
   USS (SaaS dashboard vivo, ciano) · WorldForge (fantasia editorial, rosa) · Visão de Jogo (esporte cinético, lima) · Condutor de Games (arcade retrô, laranja) · Livros (biblioteca noturna, violeta) · Cursos (ateliê dourado) · IA Hoje (jornal do futuro).
3. Estrutura por página: hero na direção própria → o que é (história) → **screenshots reais** (capturar dos sites vivos via browse/gstack; WorldForge já está no ar) → stack/bastidores → CTA duplo "Usar agora" + "Aprender a usar".
4. **3 passes de iteração por página** com browser aberto (método §11.4) — sem exceção.
5. Aceite: duas páginas quaisquer lado a lado parecem de estúdios diferentes, mas ambas FayAI (ouro na assinatura, navy no palco); todas com nav global e breadcrumb.

## FASE 6 — Verificação, dados e guarda
1. QA de rotas completo (crawl interno: nenhum 404, nenhum beco); teste mobile (MobileBottomNav em todo o shell).
2. PostHog: funil trilha (nó→aula→minigame→próximo) + evento de logout involuntário (se `refresh` falhar, logar em `/api/analytics`) para provar que o D1 morreu.
3. Canary pós-deploy + Search Console (impressões ~15–16/07).

## Ordem de execução e dependências
F1 (bloqueia tudo) → F2 → F3 e F4 em paralelo (F4 usa assets que F3 define) → F5 → F6 contínua.
Imagens: gerar por lote no início de F3/F4/F5 (GPU local, custo zero, ComfyUI porta 8000).

## Princípios inegociáveis (Ricardo)
Adaptar, não reconstruir · tudo serve à receita · gamificação honesta · IA Sem Filtro é sagrado · banda sob controle (WebP ≤40KB, vídeo só onde vale) · nunca contadores falsos.
