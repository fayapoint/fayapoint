# Identidade Visual FayAI — Guia Definitivo

*Versão 1.1 — 13/07/2026. Fonte de verdade para todo design do fayai.com.br e materiais da marca. (v1.1 adiciona §9 imagem contextual, §10 animação por camadas, §11 método de produção de páginas.)*

---

## 1. A ideia central

A identidade FayAI vive na **ponte entre dois mundos**:

- **O mundo real** (fotografia cinematográfica): a vida brasileira como ela é — a confeiteira, o estudante no ônibus, a roda de amigos na praia.
- **O mundo da mágica** (ilustração vetorial fofa): robôs simpáticos, objetos sorridentes e brilhos — a IA como companheira encantadora, nunca ameaçadora.

Toda composição da marca pode usar um dos mundos ou **misturar os dois** (colagens do minigame). A mensagem visual é sempre a mesma: *a IA torna a SUA vida real um pouco mais mágica*.

**Tom**: "cartunesco premium" — lúdico sem ser infantil, tecnológico sem ser frio. Nunca corporativo genérico, nunca cyberpunk agressivo, nunca contadores falsos ou dark patterns.

---

## 2. Cor

### Base (o palco)
| Papel | Valor | Uso |
|---|---|---|
| Fundo profundo | `#0c0e1d` (navy quase-preto) | Fundo de todas as páginas novas |
| Superfície | `#141731` | Cards sólidos |
| Vidro | `rgba(22,26,54,.42)` + blur | Painéis glassmorphism |
| Texto | `#f3f1ff` | Principal |
| Texto secundário | `rgba(255,255,255,.65)` / `.55` / `.45` | Hierarquia |

### Glows de fundo (a atmosfera)
Radial-gradients suaves sempre presentes atrás do conteúdo:
violeta `rgba(167,139,250,.22)` · ciano `rgba(56,189,248,.16)` · rosa `rgba(244,114,182,.14)`.
Em seções com vidro, adicionar **orbs** (círculos blur 46px) com drift animado de 11–15s.

### Ouro (a assinatura)
`#f5c04e` → gradiente `linear-gradient(135deg, #f5c04e, #ffd97a)`.
**Uso exclusivo**: logo (FAY**AI**), XP/recompensas, CTAs primários, destaques de título. O ouro é a marca — não usar como cor decorativa genérica.
Texto sobre ouro: `#241a05` (marrom-café escuro), nunca branco.

### Cores de categoria/projeto (o arco-íris funcional)
| Categoria | Cor | Também usada em |
|---|---|---|
| Trabalho | ciano `#38bdf8` | USS, status BETA |
| Estudos | violeta `#a78bfa` | Livros, status PESQUISA |
| Criar | rosa `#f472b6` | WorldForge, Serviços |
| Dia a dia | lima `#a3e635` | Visão de Jogo, status NO AR |
| — | laranja `#fb923c` | Condutor de Games |
| — | ouro `#f5c04e` | Cursos, status CONSTRUINDO |

Cada card/página herda a cor do seu contexto em: borda (`{cor}44`–`66`), chips/tags, títulos de seção e sombras coloridas (`0 10px 30px -8px {cor}44`).

### Gradiente-arco-íris
`linear-gradient(90deg, #38bdf8, #a78bfa, #f472b6)` — para texto-destaque de hero ("30 SEGUNDOS") e a borda cônica dos botões mágicos. Representa "todas as possibilidades da IA".

---

## 3. Tipografia

| Papel | Fonte | Regras |
|---|---|---|
| Display (títulos, logo) | **Bebas Neue** (`var(--font-bebas)`) | SEMPRE caixa alta, `tracking-wide`, `leading` 0.9–0.95. Tamanhos generosos (text-5xl a 8xl em heroes) |
| Corpo | Inter/Plus Jakarta (padrão do site) | Pesos: bold para leads, regular para texto; `leading-relaxed` |
| Micro-rótulos | corpo, 10–11px | `font-extrabold uppercase tracking-widest`, na cor de contexto |

Padrão de título: uma palavra-chave em cor (`PROJETOS <span ouro>FAYAI</span>`, `IA <span ouro>HOJE</span>`).

---

## 4. Os dois mundos de imagem (receitas de prompt)

### 4a. Vetor mágico (mascotes)
Motor: **Z-Image-Turbo** (8 steps, cfg 1, res_multistep/simple), ~4s.
Receita:
```
[personagem/objeto fofo + ação], [paleta da categoria],
Playful premium flat vector illustration, rounded friendly shapes, soft glow,
glossy highlights, centered composition, deep dark navy background,
high quality, no text, no letters, no words
```
Vocabulário do universo: robôs redondos sorridentes, objetos com rostinho (laptop, caneca, geladeira, envelope), sparkles/estrelas douradas, arco-íris, glow suave. O fundo navy é **obrigatório** — faz a arte flutuar no site.

### 4b. Fotografia cinematográfica (vida real)
Motor: **Qwen Image 2512 fp8 + Lightning 4-steps** (steps 4, cfg 1.0, euler/simple), ~14s.
Receita:
```
[cena da vida real brasileira, específica e cândida],
photorealistic, professional photography, cinematic lighting, high detail,
natural colors, no text, no logos, no watermark
```
Diretrizes: pessoas brasileiras, momentos cândidos (nunca stock posado), golden hour e luz quente sempre que possível, profundidade de campo rasa, contexto BR reconhecível (praia, ônibus, cozinha de casa). Heroes em 21:9; galeria em 3:2.

### 4c. A colagem (mix dos mundos)
Micro-galerias que intercalam 2 fotos + 2 vetores do mesmo tema (minigame). Tiles com leve rotação alternada (−2° a +2°), moldura de vidro, ordem embaralhada a cada exibição. É a assinatura visual mais única da marca.

### Pós-processamento (sempre)
`ffmpeg -i in.png -vf scale=[768 ou 1344]:-1 -quality 80–82 out.webp` — nenhuma imagem no site acima de ~40KB.

---

## 5. Superfícies e efeitos (o sistema "liquid glass")

- **.glass**: `backdrop-filter: blur(18px) saturate(1.7)`, borda `rgba(255,255,255,.14)`, realce especular no topo (inset `0 1px 0 rgba(255,255,255,.22)` + radial de sheen no canto). Sempre `rounded-2xl/3xl`.
- **Hover de card**: tilt 3D sutil (`perspective(900px) rotateX(~2deg) translateY(-4px)`) + borda acendendo.
- **Botão mágico** (CTAs de recompensa): fundo ouro + borda cônica animada com o arco-íris (`@property --fx-angle`, 4s) + shine sweep discreto (5.2s, opacidade .28).
- **Imagens em card**: hover scale 1.05–1.06 com transição ~0.5s; legendas sobem em gradiente escuro.
- **Ken Burns** em heroes fotográficos: zoom 1→1.08 em 18s.

### Regras de robustez (inegociáveis)
1. **Conteúdo crítico nunca depende de animação**: nada de `initial` oculto ou exit-animation para troca de estado — animação é enfeite, não portão.
2. `prefers-reduced-motion: reduce` desliga orbs, sweeps, conic e tilts.
3. Imagens decorativas locais: `<img>` simples com `aspect-ratio` inline (não next/image, não classes responsivas do Tailwind para layout crítico — CSS próprio em `<style>` do componente).

---

## 6. Voz e microcopy

- Português brasileiro caloroso e direto; "você"; frases curtas.
- Gamificação honesta: XP, níveis e recompensas REAIS (nunca contadores falsos, urgência fabricada ou escassez mentirosa — isso matou a credibilidade do site antigo).
- Palavras do universo: mágica, receita, jornada, bando, forjar.
- Rodapé-assinatura: *"aprenda IA fazendo, não assistindo."*

## 7. Status de projeto (selos)

`NO AR` lima · `BETA` ciano · `CONSTRUINDO` ouro · `PESQUISA` violeta — pill com texto `#0c0e1d`, `font-extrabold tracking-widest` 10px.

## 8. O que NUNCA fazer

- Marrom como cor dominante (aposentado em 12/07/2026).
- Contadores falsos, countdowns fake, "X pessoas online" simulado.
- Stock photography posada ou clip-art genérico.
- Texto dentro de imagens geradas.
- Ouro em elementos sem significado de recompensa/marca.
- Animação segurando conteúdo (ver §5, regras de robustez).

---

## 9. Imagem contextual — a regra do espelho (v1.1)

**Toda imagem deve MOSTRAR exatamente o que o texto ao lado diz.** Imagem genérica de categoria é proibida onde o conteúdo descreve uma ação concreta.

> Exemplo canônico: se o texto fala "use o gravador do celular e a IA transcreve", a imagem é **um celular em primeiro plano com o app de gravador aberto na telinha**, ondas de áudio virando texto — não "uma pessoa com celular".

### Receita de composição (ComfyUI)
O prompt nomeia **(1) o objeto-palco, (2) o que aparece NELE, (3) o resultado da mágica**:
```
[objeto-palco: smartphone screen / laptop screen / caderno / geladeira...],
showing [interface/conteúdo específico: voice recorder app with red record button
and audio waveform], [resultado: waveform transforming into flowing text lines],
[mundo: vetor mágico §4a OU foto cinematográfica §4b], [cor da categoria]
```
Padrões que funcionam:
- **Telinha de dispositivo**: app desenhado DENTRO da tela do celular/laptop (o palco dá contexto instantâneo).
- **Antes → depois no mesmo quadro**: metade esquerda o problema, metade direita a mágica (seta ou sparkles douradas no meio).
- **Objeto cotidiano + resultado saindo dele**: panela soltando receita escrita, envelope soltando resposta pronta.
- Elementos de UI dentro da imagem podem ser sugeridos com formas (barras, botões, bolhas) — **texto legível continua proibido** (§8); o texto real vai em HTML por cima ou ao lado.

### Onde se aplica
Minigames (cada exemplo = 1 cena espelho), trilha do portal (cada passo/módulo = 1 cena), cards de curso e ferramenta, notícias (og:image da fonte é a exceção documentada). Em TUDO: se o texto descreve uma ação, a arte encena essa ação.

---

## 10. Animação por camadas (v1.1)

Meta: **cada minigame/momento-herói tem a sua animação**. Duas ligas, escolhidas pelo custo de banda (nunca repetir o trauma dos 78GB):

- **Liga A — camadas + Framer Motion (padrão)**: gerar a cena em 2–4 camadas separadas no ComfyUI (fundo / objeto-palco / elemento mágico / sparkles, cada uma WebP ≤40KB com fundo transparente quando camada superior) e animar por código: parallax sutil, float 6–8s, pop-in do resultado, sweep de brilho. Peso ≈ 3 imagens; qualidade de motion design.
- **Liga B — vídeo-loop real (só herói)**: I2V do pipeline comfy-fayai (LTX ping-pong, §comfy-fayai) exportado como WebM/MP4 mudo ≤400KB, `loop muted playsinline`, lazy, 1 por página no máximo. Usar quando a Liga A não conta a história (transformações complexas).

Regras herdadas do §5: `prefers-reduced-motion` desliga tudo; conteúdo nunca depende da animação; autoplay só quando visível (IntersectionObserver).

---

## 11. Método de produção de páginas (v1.1 — destilado dos estudos 13/07)

1. **Referência antes de código**: coletar 3+ referências visuais do estilo-alvo (godly.io, land-book, awwwards, mobbin, 21st.dev) e extrair um **blueprint** (tipografia, paleta, ritmo de espaçamento, regras de motion) — construir a partir do blueprint, nunca copiar.
2. **Uma direção de arte por página de projeto**: cada projeto do ecossistema tem página com estilo FUNDAMENTALMENTE diferente (demonstra alcance do estúdio). O blueprint de cada uma fica documentado no topo do arquivo da página.
3. **Assets contextuais programáticos**: imagens/vídeos gerados sob medida para o conteúdo (§9/§10), nunca placeholder.
4. **3 passes de iteração obrigatórios**: após "pronto", revisar procurando (a) problemas de design, (b) oportunidades de sofisticar, (c) performance/robustez — com a página aberta no browser, não de memória.
5. **Dados acima de gosto**: decisões de conversão (ordem de seções, CTA) seguem evidência dos concorrentes vencedores e das métricas próprias (PostHog), não intuição.
6. **Experiência > scroll estático**: interatividade com propósito (o minigame é o exemplo-mestre) — mas performance e clareza vencem espetáculo.
