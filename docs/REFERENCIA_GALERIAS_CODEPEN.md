# Referências de galeria — CodePen (guardado em 03/08/2026)

Três pens que o Ricardo escolheu como direção visual. O código foi lido direto
do `window.__item` do editor do CodePen (o endpoint `/pen/ID.js` devolve 403).
Aqui fica **a técnica**, que é o que sobrevive — não o código colado.

---

## 1. `codepen.io/ol-ivier/pen/QwKZVGK` — "Infinite Drift – 8 Horizontal Bands"

**Para:** a página de galeria dedicada, com todas as nossas imagens.

**Stack:** Three.js r128, `OrthographicCamera`, um `PlaneMesh` por faixa.

**A técnica, em uma frase:** cada faixa é um `<canvas>` onde as imagens são
desenhadas lado a lado e repetidas `CLONE_COUNT` vezes; esse canvas vira uma
textura, e a deriva infinita é só deslocar o UV da textura.

```
BAND_HEIGHT = 120 · IMAGE_HEIGHT = 100 · IMAGE_GAP = 20
CLONE_COUNT = 3 · MAX_IMAGE_WIDTH = 300
IMAGES_PER_BAND = [8, 12, 9, 13, 14, 10, 9, 13]   // faixas de tamanhos diferentes
```

Controles: `wheel`, drag, setas ← →. As faixas andam em velocidades diferentes,
o que dá a sensação de profundidade.

### ⚠️ Por que NÃO copiamos isto como está

A imagem vira **pixel dentro de uma textura WebGL**. Isso custa três coisas que
nós não podemos pagar nesta seção:

1. **Texto não existe.** O título do curso viraria pixel — o Google não lê, o
   leitor de tela não lê, e volta o defeito das capas com texto assado.
2. **Clique exige raycast** e recalcular qual imagem está sob o cursor. O
   Ricardo pediu cards **clicáveis**; com `<a>` de verdade isso é grátis.
3. **Sem HTML, sem link interno** — e link interno é a única autoridade que
   temos para distribuir ([[reference_seo_prioridade_links_internos]]).

O que aproveitamos: as faixas de alturas diferentes, o `CLONE_COUNT = 3` para o
laço infinito, e a deriva contínua. Feito em DOM + `transform`, com `<a>` reais.

---

## 2. `codepen.io/ol-ivier/pen/myrKavB` — "Infinite Horizontal Parallax Scroll"

**Para:** a biblioteca da home e do dashboard. **É esta que manda no projeto** —
DOM puro, sem biblioteca nenhuma, 9 KB de JS.

**A técnica:**

- Contêiner `display:flex; overflow-x:hidden`, itens `flex: 0 0 600px; height:400px`.
- A `<img>` tem **130% de largura** e é centrada por `translate(-50%,-50%)`: a
  folga de 30% é o que permite o parallax sem borda vazia.
- `cloneCount = 3`. Quando o scroll passa de um limiar, salta uma largura de
  conjunto inteira — o laço é invisível porque o conteúdo se repete.
- Inércia e suavização por `lerp`, não por `scroll-behavior`.

```
SNAP_ENABLED = true · SNAP_DELAY = 300ms · SNAP_STRENGTH = 0.08
INERTIA_DAMPING = 0.92 · PARALLAX_STRENGTH = 0.15 · SCROLL_SMOOTHING = 0.15
```

**O parallax, que é o coração:**

```js
let offset = (centroDoContainer - centroDoItem) / 6;
offset = Math.max(-80, Math.min(80, offset));      // trava em ±80px
offsets[i] = lerp(offsets[i], offset, 0.12);       // suaviza o próprio offset
img.style.transform = `translate(calc(-50% + ${offsets[i]}px), -50%)`;
```

A imagem anda **contra** o card conforme ele cruza a tela. O duplo `lerp` (um no
scroll, outro no offset) é o que dá a fluidez — sem o segundo, o parallax fica
travado no ritmo do dedo.

**Snap:** 300 ms depois que a velocidade cai abaixo de 0,5, empurra o item mais
próximo do centro somando `(alvo - atual) * 0.08` à velocidade — não é
`scroll-snap`, é força aplicada à inércia, e por isso não briga com o arrasto.

---

## 3. `codepen.io/zerdebek/pen/019f8d6a-…` — a direção para `/projetos`

URL de editor (privada). Ver `PENDÊNCIA` no MASTERPLAN.

---

## Como o código foi obtido

`https://codepen.io/<user>/pen/<id>.js` responde **403** (Cloudflare). O editor
guarda o pen inteiro em `window.__item`:

```js
const d = window.__item;   // { html, css, js, resources, title, ... }
```

Abrir a página do pen no navegador e ler essa variável é o caminho que funciona.
