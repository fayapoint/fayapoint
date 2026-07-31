# MASTERPLAN — O caminho completo até "o site bom"
**Criado em 16/07/2026 (noite), a pedido do Ricardo. Este documento SUPERSEDE o PLANO_RICARDO_2026-07-16.md e é a fonte única de verdade. Nada sai daqui sem estar PRONTO-DE-VERDADE (§1).**

---

## 🚦 PRÓXIMA SESSÃO COMEÇA AQUI — estado em 29/07/2026

> ⛔ **A sessão de 29/07 está PRONTA E VERIFICADA, mas NÃO DEPLOYADA.** 41 arquivos,
> build limpo, 25/25 verificações passando no servidor de produção local. Esperando
> o sim do Ricardo ([[feedback_pedir_autorizacao_deploy]]).
>
> Tudo de 28/07 e antes está **NO AR** (`3bf1659`, `2063579`, `aa2533d`, `b6fd74d`).

### O que fazer primeiro, na ordem

| # | Tarefa | Por quê |
|---|---|---|
| **1** | **Pedir autorização e deployar o SEO de 29/07.** | Está tudo pronto e medido. Enquanto não sobe, o Google segue sem saber que 81 páginas existem. |
| **2** | **Depois do deploy: reenviar o sitemap no Search Console** e pedir indexação de `/pt-BR/servicos`, `/pt-BR/ferramentas` e `/pt-BR/chatgpt-allowlisting`. | O sitemap dobrou (67 → 148). O Google só descobre o novo lote quando relê. |
| **3** | **Conferir se a rotina das 10:55 disparou.** Ler `%LOCALAPPDATA%\FayAI\janela-capas.log` e olhar o blog do dia: a matéria de hoje tem capa própria ou genérica? | A rotina foi criada e testada **à mão** em 28/07, mas **nunca rodou pelo agendador**. Horário movido de 06:55 para 10:55 em 31/07 (às 7h o Ricardo dormia). Continua sem validação. |
| **4** | **Conferir se o cron do Radar rodou às 09:00 UTC.** `ssh root@76.13.234.38 'cat /root/kirmes/logs/radar_historico_$(date +%Y%m%d).log'` — esperado "10 gravados, 0 falharam". | Mesma coisa: rodou manualmente em 28/07, mas nunca pelo cron. |
| **5** | **Guardar o `image_prompt` no `ainews`**. | Única melhoria pendente das capas, e é pequena. |
| **6** | Escrever conteúdo a partir do Radar. | ⚠️ Continua sendo **o gargalo real do tráfego** — nada disso cria demanda (herdado de 27/07). |

---

## 🔴 SESSÃO 29/07 (parte 2) — O `/admin` ESTAVA ABERTO, E O `?_geo=BR` ERA UMA PORTA

> Pedido do Ricardo, em cinco partes, olhando o site: *"quero garantir que nenhuma
> página de admin será acessível por ninguém"* · *"se puder especificamente incluir no
> geoblock, ásia e áfrica"* · *"o primeiro lugar mudou… isso vai contra o propósito"* ·
> *"temos 2 notícias quase idênticas"* · *"imagens tão genéricas que colocam em questão
> a veracidade de todo o blog"*.

### ⛔ As duas falhas de segurança

**O painel era servido a qualquer visitante.** Medido: `/pt-BR/admin`,
`/pt-BR/admin/users`, `/pt-BR/admin/payments` respondiam **200** sem sessão nenhuma. As
APIs devolviam 401, então o *dado* estava salvo — mas a interface inteira ia pro
navegador. A proteção era o `AdminContext` lendo `localStorage` **depois** de a página
já ter sido entregue e renderizada. Client-side não é proteção, é decoração.

Conserto: portão no `proxy.ts` (bloco 6.0), no servidor, antes de renderizar. Duas
diferenças deliberadas em relação ao portão do `/portal`: **falha fechado** (o do portal
deixa passar em caso de dúvida, para não deslogar aluno por deriva de segredo — aqui o
certo é o oposto) e **confere `role`, não só assinatura** (JWT de aluno é válido; só não
é de administrador). O login passou a gravar cookie `httpOnly`, porque o servidor não
enxerga `localStorage`, e ganhou `/api/admin/logout` — `localStorage.removeItem` não
apaga cookie `httpOnly`, então "sair" deixava a sessão viva por 24h.

**`?_geo=BR` abria o site inteiro de qualquer país.** No edge function o teste `_geo`
era avaliado ANTES do país real e dava `return context.next()` para país permitido.
Qualquer pessoa, em qualquer lugar, entrava digitando `fayai.com.br/?_geo=BR`. Sem
segredo, sem ferramenta. Agora o override só BLOQUEIA em produção; liberar, só fora do
site publicado. Junto: `GEOBLOCK_BYPASS_SECRET` deixou de cair no padrão fixo
`"fayapoint-bypass-2024"` escrito no código — sem variável, o bypass não existe.

⚠️ **Ásia e África já estavam bloqueadas.** O geoblock é BR-only: IN, CN, JP, KR, EG
todos em 403, confirmado em produção. Não havia lista a estender — o pedido partia de
uma premissa errada, e o acesso da Índia tinha a outra origem, acima.

### O Radar: três defeitos, e o Ricardo acertou o diagnóstico do produto

**O #1 mudava entre a home e a `/radar`.** O cache era um `Map` em memória **por
instância**; no Netlify as duas páginas caíam em instâncias diferentes e cada uma media
do zero. Não era ordenação — eram duas medições distintas exibidas como a mesma leitura.
Conserto: instantâneo compartilhado no Mongo (`radar-instantaneo.ts`).

**"Semaglutida" e "Semaglutide" eram duas linhas.** A deduplicação casava título
normalizado inteiro. Agora casa por radical (corte no 6º caractere).

**O gráfico flat e o `0 + 0 = 10`.** O histórico devolvia `36,7 / 36,7 / 36,7` em três
dias, em todos os termos — porque o score mede **posição no autocomplete**, que muda em
escala de semanas. O gráfico estava certo; errada era a legenda prometendo *"o que
interessa é a inclinação"* numa métrica que não tem como inclinar.

⚠️ **Google Trends foi testado e NÃO serve.** `/api/explore` responde 200 com cookie,
mas `/api/widgetdata/multiline` devolve **429** de forma consistente — cookie novo, 9s
entre chamadas, IP residencial. De datacenter (que é de onde a função roda) tende a ser
pior. Substituto: **API de pageviews da Wikimedia**, oficial, sem chave, medida antes de
virar código — "Inteligência artificial" oscilou 199→2.360 em 30 dias, 29 valores
distintos. A seção passou a responder *"o que o Brasil LÊ sobre IA"* em vez de *"o que
busca"* — mudança de sentido aprovada pelo Ricardo.

**A `/radar` nunca chamava `/api/radar`.** Todo o painel de IA Trend lia
`radar-seed.json` congelado, enquanto o rodapé afirmava *"Dados reais, medidos agora"*.
Agora mede, com o seed só de primeiro quadro, e uma etiqueta diz qual dos dois está na
tela. Os mostradores de canal zerados sumiram: zero legítimo com o peso visual de um
número que importa vira ruído, e ruído em painel de dado vira dúvida sobre o dado todo.

### Blog: a duplicata e o mascote

As duas matérias do Opus 5 (TechCrunch 25/07 e The Verge 27/07) eram o mesmo lançamento.
**Fundidas** num texto único sob `claude-opus-5`, com 308 permanente da URL aposentada —
não 404, que jogaria fora o sinal já rastreado. Backup do documento removido antes de
apagar. 31 → 30 matérias.

**As capas eram todas o mesmo robô porque isso está no código.** `backfill_news_covers.py`
cola em TODA capa o `FUSION_SUFFIX`: *"an adorable glossy flat-vector robot mascot with
big cute eyes"*. A cena muda por matéria, o mascote não. Novo script
`gerar_capas_editoriais.py`: sem mascote, identidade vinda da **luz** (mesma gradação
azul-marinho, foco raso) e não de um personagem. 6 capas geradas, subidas e trocadas no
banco; prompts do Higgsfield em `_capas_novas/PROMPTS_HIGGSFIELD.md`, com os nomes de
arquivo casados.

⚠️ **Prompt negativo não funciona neste workflow.** O `ConditioningZeroOut` + CFG 1.0
(exigido pela LoRA Lightning de 4 passos) significa que negativo é ignorado. Por isso
"no text" não impede texto rabiscado na tela — a saída é escrever cenas que não
dependam de texto legível. As 24 capas restantes seguem com o mascote.

⚠️⚠️ **E o conserto quase se desfez sozinho.** Os dois scripts que rodam por cron na
VPS — `fayai_news.py` (1-3 matérias/dia, 10:00 UTC) e `fayai_capas_backfill.py` (a cada
3h) — carregavam o **mesmo** `FUSION_SUFFIX`. Sem mexer neles, toda matéria nova nasceria
com o robozinho de volta e o preenchedor colocaria mascote nas que ficaram sem capa,
misturando dois registros visuais na mesma listagem. Os dois foram trocados, copiados
para `/root/kirmes/` com backup `.bak-20260729`, e verificados **na VPS avaliando a
constante por AST, não por grep** (`mascote no prompt ativo: False`). Commit `789c8a9`.
**Lição: trocar o prompt de um one-off não basta — o que repõe conteúdo é o cron.**

### Verificado

Build limpo (410 páginas), `tsc` limpo, **duas suítes passando** contra `next start`:
a de SEO (25 checagens) e a desta leva (16) — portão do admin com cookie forjado
rejeitado, 308 da duplicata, sitemap em 147 sem a matéria fundida, e as 5 séries do
gráfico com 21 a 30 valores distintos cada (antes: 1).

---

## 🔵 SESSÃO 29/07 (parte 1) — AS 81 PÁGINAS QUE O GOOGLE NUNCA SOUBE QUE EXISTIAM

> **Estado: PRONTO, VERIFICADO, NÃO DEPLOYADO.** 41 arquivos tocados.
> Pedido do Ricardo, com a tela do Search Console: *"precisamos resolver os problemas
> do google search console"*.

### O ponto de partida: a tela era anterior às correções de 27–28/07

149 não indexadas contra 20 indexadas, em 7 motivos. Antes de tocar em qualquer
coisa, medi as 67 URLs do sitemap em produção com UA de navegador: **67/67 em 200,
todas com canônica própria, `h1` e JSON-LD, texto mediano de 3.492 caracteres**. O
soft 404 das páginas de curso, que era o assunto de 28/07, está resolvido de fato.

⚠️ **O 403 que aparece ao forjar o UA do Googlebot é o verificador de bot falso
funcionando** (`b750be0`, verificação por faixa de IP oficial), não uma falha —
mas custa lembrar: **toda medição de SEO neste site precisa de UA de navegador**,
senão o que se mede é a proteção, não a página ([[feedback_verificar_em_producao]]).

### O que realmente restou — e não era erro técnico

**139 das 149 estavam em dois baldes**: "Detectada, mas não indexada" (89) e
"Rastreada, mas não indexada" (50). Nenhum dos dois é defeito de servidor. É o
Google dizendo *"achei e não achei que valia a pena"* e *"li e não achei que
valia a pena"*. As causas foram quatro, todas medidas:

**1. O sitemap declarava 67 URLs e o Google conhecia 169.** A diferença tem nome:
**56 páginas de ferramenta** (`/ferramentas/chatgpt`, `/n8n`, `/midjourney`…, 2–3 mil
caracteres de ficha real cada, com `generateStaticParams` e título próprio desde
sempre) e ~25 páginas públicas — `/descobrir` (8.180 chars), `/chatgpt-allowlisting`
(5.365, a página de venda do curso de AEO), `/recursos/glossario` (5.513), `/casos`
(4.980). **56 + 25 ≈ os 89 "Detectada"**: existiam há meses, eram alcançáveis pelo
link interno, e nunca foram anunciadas.

**2. 25 páginas serviam o título da home, letra por letra.** Amostrei 20 em produção:
**18 respondiam `Cursos de Inteligência Artificial do Zero | FayAI`**. A causa é a
cascata de metadata do Next — o layout de `[locale]` declara `title`, e todo filho
que não sobrescreve herda. O conserto de 28/07 deu canônica própria a cada rota mas
deixou título e descrição de fora *de propósito* (o comentário no código dizia
"seguem vindo de quem já os definia" — só que ninguém os definia). É a fábrica dos
50 "Rastreada, mas não indexada": 25 páginas distintas pedindo para serem tratadas
como a mesma coisa.

**3. `/pt-BR/servicos` respondia 404 — e está no menu da home.** A pasta tinha
`layout.tsx` (com canônica própria e entrada de intenção no sitemap) e **nenhuma
`page.tsx`**. `CubeHomepage.tsx:259` e `:283` linkam `/servicos` no menu do topo e no
mobile, então toda visita à home oferecia um link quebrado e o Googlebot o seguia a
cada rastreamento. Origem mais provável do "Não encontrado (404)".

**4. O robots.txt nunca alcançou o que achava que bloqueava.** `Disallow: /login` não
casa com `/pt-BR/login` — a URL real. Medido: `/pt-BR/login` e `/pt-BR/registro`
respondiam **200, `index, follow`, com o título da home**. O mesmo vale para
`/admin/` e `/portal/`.

### O que foi feito

| Frente | O quê |
|---|---|
| **Título e descrição** | `ROUTE_SEO` em `src/lib/metadata.ts`: 25 rotas × 2 idiomas, texto escrito a partir do HTML **servido**, não do nome da rota. Os 25 `layout.tsx` passaram a chamar `routeMetadata`. `/en` traduz de verdade (`/en/casos` → "Projects That Deliver Real Results"), então o par bilíngue não é decorativo. |
| **Sitemap 67 → 148** | Entram `/servicos`, 24 páginas públicas e as **56 ferramentas**. Usa `toolsData`, **não** o `toolsMap` da página — este soma apelidos legados (`dalle` ≙ `dall-e`) que serviriam a mesma ficha em duas URLs. |
| **Hub `/servicos`** | `page.tsx` novo, índice dos 5 serviços com `ItemList` em JSON-LD. O texto de cada cartão é o mesmo `description` que a página filha declara, para não haver duas promessas do mesmo serviço. |
| **Fora do índice** | 9 `layout.tsx` com `noindex` nas rotas de conta (login, registro, recuperar-senha, onboarding, configuracoes, checkout, portal, receipt, verificar-certificado) + 3 no `ROUTE_SEO`: `/status` (transitório), `/waiting-list` (confirmação pós-cadastro), `/certificacoes` (placeholder "em breve"). |
| **robots.txt** | Entram `/pt-BR/admin/` e `/en/admin/`. **Saem** as páginas de conta — e essa inversão é o ponto: URL bloqueada no robots.txt pode seguir indexada só pela URL, porque o Google nunca chega a LER a tag que manda removê-la. Para tirar do índice é preciso **deixar rastrear e dizer noindex**. |
| **Menu** | `/blog` → `/noticias` em `Header.tsx` (×2) e `CubeHomepage.tsx`. `/blog` respondia 308 para `/pt-BR/blog`, que respondia 308 para `/pt-BR/noticias` — dois saltos, em link presente em toda página. |

### Verificado (não "deve funcionar")

`npm run build` limpo, `tsc --noEmit` limpo, e **25/25 checagens passando** contra o
servidor de produção local (`next start`, porta 3002) — script em
`scratchpad/verify_local.mjs`. Cobre: título próprio nas 9 amostradas, título inglês
em `/en`, `/servicos` em 200, `noindex` nas 6 rotas de conta e nos 3 placeholders,
sitemap com 148 URLs, as 56 ferramentas presentes, nenhuma URL `noindex` anunciada e
zero duplicatas.

### O que NÃO foi feito, e por quê

- **Páginas magras mantidas indexáveis**: `/recursos` (718 chars), `/contato/vendas`
  (719), `/recursos/calculadora-roi` (771), `/instrutores` (1.135), `/ajuda` (1.286).
  Ganharam título próprio, mas podem cair em "Rastreada, mas não indexada" mesmo
  assim. **Precisam de conteúdo real** — e inventar corpo docente ou artigo de
  suporte é decisão do Ricardo, não minha.
- **O 308 do prefixo de locale continua em todo link de menu.** Os componentes usam
  `next/link` cru com `href="/cursos"`, e o middleware redireciona para `/pt-BR/cursos`.
  É um salto por link em toda página. Consertar exige trocar o `Link` em todo o
  código — refatoração grande, risco desproporcional dentro de uma tarefa de SEO.
  **Fica registrado como dívida.**
- **`/en` segue rastreável.** É `noindex, follow` desde 27/07 e há páginas dela
  indexadas ([[reference_seo_duplicata_indice]]). Bloquear no robots.txt agora
  **impediria** o Google de ver o `noindex` e elas ficariam presas no índice. A ordem
  certa é: deixar rastrear até sair do índice, *depois* considerar bloquear.

---

### As três frentes que fecharam na sessão de 28/07

**SEO — as páginas de curso serviam 624 caracteres.** O Google mandou 4 avisos (404, soft 404, redirecionamento, cópia com/sem canônica). A causa não era lentidão: `CourseSalesPage` era `"use client"` e buscava `/api/products/<slug>`, e **`/api/` é `Disallow` no robots.txt** — o Googlebot nunca completava o fetch e caía no ramo que renderiza *"Curso não encontrado"*. Soft 404 permanente por construção, idêntico nas 20 URLs. Medido: texto servido no sitemap **164.409 → 261.733 caracteres**, páginas com menos de 1000 chars **21 → 0**, `/cursos` **873 → 11.907**, sitemap 65/65 sem regressão.

**Radar — o D6 caiu.** O Radar media e esquecia (`Map` em memória, TTL 6h). Agora grava 1 documento por (nicho, dia), tem `/api/radar/historico`, a seção **"A LINHA DO TEMPO"** na `/radar` e **cron na VPS às 6h BRT** nos 10 nichos.

**VPS — o erro que o Ricardo recebeu** era o `hermes-dashboard` em **46.904 reinícios**. Junto: journal 289→102MB e o acervo do blog em **29/29 com capa própria** (estava 0).

---

## 🔴 SESSÃO 28/07 (madrugada) — POR QUE O GOOGLE NÃO INDEXAVA, O RADAR COM MEMÓRIA E A VPS EM LAÇO

> **Estado: NO AR.** Commits `3bf1659` (SEO + radar + persona), `2063579` (defeito achado
> depois do deploy), `aa2533d` (scripts da VPS) e `b6fd74d` (rotina do Windows).
> Os dois últimos não disparam deploy — `scripts/*` está na regra de ignore do `netlify.toml`.

Pedido dele, em três partes: *"recebi notificações do Google Search Console dizendo que
motivos impedem a indexação, você poderia verificar e resolver?"* · *"queria gráficos na
página do radar… temporal dos trends baseados no que capturamos ao longo do tempo"* +
*"no modal o que eu sei de você, quero uma opção de aumentar ele e deixar reto… um
botãozinho de maximizar e minimizar"* · *"vamos fazer pelo VPS, peço pra aproveitar e ver
se tem alguma coisa errada ou faltando pois recebi uma mensagem dele que tinha algum erro"*.

### ⛔ Parte 1 — O achado: a página de curso servia 624 caracteres idênticos

Os 4 e-mails do Search Console (27–28/07) listavam: **404, soft 404, página com
redirecionamento, cópia com canônica diferente, cópia sem canônica**.

O corpo servido de **toda** página de curso eram **624 caracteres**: menu,
*"Carregando curso…"* e rodapé. Cabeçalho impecável — canonical certo, JSON-LD certo desde
27/07 — e corpo vazio, **idêntico nas 20 URLs**. Duas falhas de uma vez: página sem
conteúdo (soft 404) e 20 cópias entre si.

⚠️ **E não adiantaria esperar o Googlebot rodar o JS.** O componente era `"use client"` e
buscava `fetch('/api/products/<slug>')`; **`/api/` é `Disallow` no `robots.txt`**, então o
fetch nunca completa para ele e o componente cai no ramo `!product`, que renderiza
literalmente *"Curso não encontrado"*. **Não é lentidão de renderização — é soft 404
permanente por construção.** A vitrine `/cursos` (que está no sitemap) tinha o mesmo
defeito: 873 caracteres, contadores em `"..."`, zero cards.

**Conserto:** `page.tsx` (server) busca no banco e passa `initialProduct` /
`initialProducts`; o cliente só busca se a prop vier vazia.

⚠️ **O `catch` separa "não existe" de "banco não respondeu" de propósito.**
`getProductBySlug(slug).catch(() => null)` seguido de `notFound()` transformaria uma queda
do Mongo em **404 nas 20 páginas de uma vez** — e 404 é o que o Google usa para **remover**
URL do índice. Agora marca `bancoRespondeu = false` e degrada para a busca no cliente.

### A segunda causa, independente: 28 rotas declaravam ser a home

`[locale]/layout.tsx` tinha `alternates.canonical = ${SITE_URL}/${locale}`. Metadata de
layout **desce para todo filho que não a sobrescreve** — então `/recursos`, `/casos`,
`/instrutores`, `/termos`, `/privacidade` e mais 23 diziam ao Google *"descarte esta
página, a boa é a home"*. É a origem direta do "Cópia, o Google e o usuário selecionaram
uma página canônica diferente".

⚠️ **Não reintroduzir `alternates` no layout.** Página sem canônica própria simplesmente
não emite a tag, e o Google se auto-canonicaliza pela URL rastreada — que é o correto.
O `languages` saiu junto e pelo mesmo motivo (hreflang também descia).

⚠️ **Grep em `page.tsx` engana:** as 65 URLs do sitemap já tinham canônica porque ela mora
num **`layout.tsx` irmão**, não no `page.tsx`. Procurar só em `page.tsx` faz parecer que 58
rotas estão quebradas quando não estão.

### Os outros quatro defeitos

| | O que estava errado | Conserto |
|---|---|---|
| 1 | `/curso/<slug-inexistente>` respondia **200** com canonical apontando para si mesmo | `notFound()` — era fábrica infinita de soft 404 |
| 2 | `/blog/<slug>` (client) herdava canonical `/pt-BR/blog`, **que responde 308**. Canônica apontando para redirecionamento é descartada pelo Google | Virou server component com canônica própria |
| 3 | `/blog/<slug>` devolvia **200** dizendo *"Artigo não encontrado"*, e 6 posts sem corpo davam 200 com *"Conteúdo completo em breve"* | `notFound()` — página que anuncia a própria ausência com 200 é a definição de soft 404 |
| 4 | `/cursos/<slug>` e `/nova` usavam `redirect()`, que responde **307 (temporário)** — e ainda perdiam o locale, virando cadeia de 2 saltos | `permanentRedirect()` com locale. Temporário manda o Google **guardar** a URL antiga |

**Medido em produção depois do deploy:** menor página do sitemap **1217 chars** (era 624),
`/cursos` **11.907**, 27/27 canônicas corretas, redirects em 308, 404 reais em 404.

### 📈 Parte 2 — Radar: a linha do tempo (o D6 caiu)

O Radar **media e esquecia**: `Map` em memória com TTL de 6h + um `radar-seed.json`
congelado. Dava para dizer "o que o Brasil procura hoje" e era impossível dizer "o que
subiu esta semana" — que é a pergunta que decide pauta.

- `src/lib/radar-historico.ts` — coleção `radar_historico`, **1 documento por (nicho, dia)**
  com `upsert` e índice único. ⚠️ **Dia em `America/Sao_Paulo`, não UTC** — medição das 22h
  cairia no dia seguinte e a série ganharia buracos que não aconteceram.
- `POST /api/radar/medir?nicho=X` — **medição forçada** para o cron. ⚠️ Chamar `/api/radar`
  **não serve**: num processo quente ela devolve o cache e **retorna antes de gravar**,
  deixando o dia sem ponto de forma silenciosa e intermitente.
- VPS: `/root/kirmes/radar_historico_daily.sh`, cron **`0 9 * * *`**. Um nicho por chamada
  (~1,5s cada, 52s no total) — os dez numa requisição estouram o teto da função. A lista de
  nichos vem da própria API, então nicho novo entra sem editar o script.
- Backfill do snapshot de 26/07: `npm run radar:historico` (idempotente).

**Estado do dado:** 2 dias × 10 nichos. Primeira execução real do script: **10 gravados,
0 falharam**.

⚠️ **Defeito achado NA VERIFICAÇÃO PÓS-DEPLOY** (commit `2063579`): `atual` caía na última
nota conhecida quando o termo sumia do dia. Em produção, "ia juridico" liderava `advogados`
com a nota de 26/07 tendo sumido em 28/07, e o **delta saía 0** — "não mudou nada" sobre um
termo que saiu da lista. Agora `atual` é o score do último dia **ou 0**.

### Parte 3 — Persona: maximizar/minimizar

Botão no cabeçalho do dossiê. Medido nos três estados: repouso **inclinado**
(`matrix3d`, cos 12° = 0,978 — a perspectiva que ele gosta continua), ampliado
**336 → 672px e reto**, Esc devolve ao repouso. Fecha por Esc, clique no fundo e botão;
trava a rolagem atrás e o lugar na coluna não colapsa, então a página não pula.

Para testar sem login criei **`/pt-BR/lab/dossie`** — bancada `noindex`, no molde do
`/lab/3d`, montando o componente real com `montarDossie`. ⚠️ **Não digito senha, nem de
conta de teste** — por isso a bancada existe. Se incomodar, apagar.

### 🖥️ Parte 4 — VPS: o erro que ele recebeu

**`hermes-dashboard` em laço desde 21/07 — 46.904 reinícios**, um a cada 13s, com
`address already in use`. **O painel funcionava o tempo todo**, servido por um processo
**órfão** (PID 168, de 21/07) que ninguém gerenciava.

⚠️ **A causa é o padrão `docker exec` em systemd:** parar a unit mata o `docker exec` **no
host**, mas o processo **dentro do container sobrevive** segurando a porta. Conserto:
`ExecStartPre=-docker exec kirmes pkill -f "hermes dashboard"` (limpa órfão ao subir) e
`ExecStopPost=` igual (não deixa órfão ao sair). ⚠️ **Sem `sh -c`** — com wrapper o shell
teria o padrão na própria linha de comando e se mataria antes de agir. Depois: `active`,
**0 reinícios, 0 linhas de journal**.

Junto: **journal 289MB → 102MB** (`--vacuum-size=120M`; `--vacuum-time=30d` liberou 0B
porque os logs tinham menos de 30 dias).

**Os 8 crons rodando diariamente** (7 arquivos de log em 7 dias cada): `*/5` health-check ·
`*/5` USS publish-due · **`0 9` radar (novo)** · `0 14` notícias · `0 12` e-mails D+2/D+7 ·
`0 13` TCH · `0 14` auditoria de curso · **`15 */3` capas (novo)** · seg `0 11` semanal.

⚠️ **31/07: o bloco do ComfyUI saiu das 7h para as 11h BRT.** Notícias `0 10` → **`0 14`**
e briefing do Buzz `30 11` → **`45 14`**; a janela do PC foi de 06:55/07:20 para
**10:55/11:20**. Motivo: às 7h o Ricardo dorme, o PC fica fora do ar e o pedido de capa
morre — a matéria saía com imagem genérica todo dia.

### 🎨 As capas do blog — o diagnóstico que mudou o problema

A capa de cada matéria sai do **ComfyUI no PC do Ricardo**, alcançado pela VPS via Tailscale
(`comfy-bridge` 8088 → `127.0.0.1:8000`). O cron publica **11h BRT** (era 7h até 31/07); se a máquina estiver
desligada ou o ComfyUI fechado naquele minuto, sai a imagem genérica do pool — e o cron
**termina em exit 0**, então nada alerta.

**Estado encontrado: 15 matérias recentes genéricas, 14 anteriores com capa** → quebrou por
volta de **22/07**.

⚠️ **Duas falhas distintas, distinguíveis pela resposta:** `timeout` = bridge fora (o
processo dele morre com a sessão); **502** = bridge de pé e **ComfyUI fechado**.

**Conserto em duas camadas:**

1. `fayai_capas_backfill.py` na VPS (cron `15 */3`) **desacopla capa de publicação** —
   preenche o que faltou assim que a máquina estiver disponível, e sai em silêncio se não
   estiver. ⚠️ **Escreve no Mongo direto de propósito:** `/api/ainews/publish` faz `$set` do
   item inteiro com `publishedAt=agora`, e usá-la para corrigir só a imagem jogaria matéria
   velha para o topo do feed. **Fila zerada: 14 capas, 0 falhas, acervo em 29/29.**
2. `scripts/windows/janela-capas.ps1` + duas tarefas agendadas **neste PC**:
   **10:55 abrir** (ComfyUI + bridge + janela SSH) e **11:20 fechar**.

⚠️ **As duas guardas da rotina, ambas testadas:** (a) **só fecha o que ela abriu** — se o
ComfyUI já estava de pé às 10:55 ela não inicia nada e **não grava marcador**, e às 11:20
não encosta na sessão; o marcador em `%LOCALAPPDATA%\FayAI` é a única autorização de
fechamento que existe. (b) **só fecha com a fila vazia** — consulta `127.0.0.1:8000/queue`,
espera até 20 min, e se não esvaziar **desiste e apaga o marcador**: GPU ocupada é melhor
que geração morta pela metade. O bridge **sobrevive** ao fechamento de propósito.

### 📉 Armadilhas de gráfico SVG que só a medição no navegador pega

Build limpo e typecheck limpo **não pegam nenhuma** das três:

1. **`viewBox` fora da largura renderizada põe TODO o texto em escala.** Medi viewBox 1118
   dentro de caixa de 690px — fonte 10 virou 6 na tela. Checagem:
   `Math.abs(svg.viewBox.baseVal.width - svg.getBoundingClientRect().width) < 2`.
   Corolário: **nada de piso** tipo `Math.max(largura, 320)` — o piso é exatamente uma
   largura que não é a real.
2. **`ResizeObserver` no nó que você troca = laço.** O padrão
   `if (!largura) return <div ref={ref}/>` observa o placeholder; quando a medida chega o nó
   é substituído, o RO dispara com **width 0** na desmontagem e o placeholder volta —
   pisca em laço. O nó observado tem que ser **estável**, e **medida 0 nunca vira estado**.
3. **Rótulo direto na ponta colide quando as séries convergem.** O topo do Radar é um
   pelotão (36,7 · 36,7 · 35,1 · 31,6) — **6 colisões medidas**. Empurrar o texto desgruda
   o rótulo da linha; a saída é **recuar** e deixar legenda e balão carregarem a identidade.

⚠️ **A paleta do HUD reprova em daltonismo** como cinco linhas sobrepostas (violeta × ciano
= ΔE 5,2 em deuteranopia). Rodar `scripts/validate_palette.js` da skill `dataviz` contra a
**superfície real do card** (`#181a28` = white/5 sobre `#0c0e1d`). Ordem aprovada:
`#3987e5, #d95926, #199e70, #c98500, #d55181`. O dourado continua sendo a cor da seção —
só não carrega dado.

### 💳 Dívidas e pendências que saem desta sessão

| | Pendência | Tamanho |
|---|---|---|
| 1 | **Validar que a rotina 10:55/11:20 disparou pelo agendador** (só rodou à mão; horário movido em 31/07) | 5 min |
| 2 | **Validar que o cron do Radar rodou às 09:00 UTC** (só rodou à mão) | 5 min |
| 3 | **Guardar `image_prompt` no `ainews` na publicação.** Hoje o backfill usa o **título** como prompt: sai imagem única e no estilo certo, mas menos ligada ao assunto que a cena que o LLM descrevia | pequeno |
| 4 | **ComfyUI não tem autostart e fecha sozinho** (verificado 3× nesta sessão). A rotina das 10:55 cobre a janela do blog; fora dela, nenhuma capa é gerada | decisão dele |
| 5 | `header` estoura a largura no mobile (451px × 375) em **todas as páginas**. ⚠️ `window.innerWidth` também reportava 451 — **pode ser artefato da emulação**; confirmar em celular real antes de mexer no layout compartilhado | investigar |
| 6 | **TTFB da home: 2,5s** contra 0,5s da `/cursos` — herdado de 27/07, **não corrigido** | aberto |
| 7 | OG do venturebeat volta **HTTP 429** no `fayai_news` (degradação menor) | aberto |
| 8 | Decidir se `/pt-BR/lab/dossie` fica ou sai | 1 min |

⚠️ **E a ressalva que não muda:** nada disso **cria demanda**. O Radar mede as perguntas
todo dia por profissão — é uma lista de pautas com demanda comprovada e **ninguém escreveu
nada a partir dela**. Continua sendo o gargalo real do tráfego.

---

## 🧠 SESSÃO 27/07 (dia) — O USS DE VERDADE: PERSONA PROFUNDA, DOSSIÊ E CURSO PERSONALIZADO

> **Estado: NO AR desde 27/07 (commit `89be084`).** Escrito enquanto o Ricardo dormia
> depois de dois dias acordado; deployado depois, a pedido explícito dele ("faça o deploy
> se nada estiver errado ou não funcionando") — a regra de pedir autorização
> ([[feedback_pedir_autorizacao_deploy]]) foi cumprida, não contornada.
>
> **Verificado em produção**, não só no build: as 6 páginas públicas em 200 (radar em
> 0,45 s), os 49 `.glb` servidos (32 da persona + 17 do menu, nenhum 404), as 4 rotas
> novas devolvendo 401 sem sessão, `/pt-BR/portal` redirecionando para o login, canonical
> da home intacto, globo do Radar com 1 canvas e 0 contextos perdidos, zero erro de
> console. No build logado com a conta QA expert: dossiê em 66 % com dado real, hover do
> menu com 1 canvas e buffer 42×42 batendo com o CSS, 8 pautas cruzadas com a área.

Ordem dele, resumida: *"quero que o dashboard ofereça ao usuário tudo que ele acredita
que terá… foco no USS, a parte social deve extrair muito mais informação… ícones em 3D
no hover… um modal ao lado angulado como o do radar… leia os documentos do USS e entenda
a profundidade que precisamos… não apenas criar posts com a voz do usuário, devemos criar
o conteúdo do curso personalizado… fotos… a conta do Google que usei para entrar não
aparece conectada… pesquise ferramentas como o mLabs."*

### ⛔ O achado que explica tudo: a persona NUNCA foi salva

Antes de qualquer coisa nova, três defeitos que se somavam em um só sintoma —
"ficamos muito longe de conseguir determinar sua persona":

| | Defeito | Consequência |
|---|---|---|
| 1 | O painel fazia **POST** em `/api/user/social-persona`, que só tinha `GET` e `PUT` | **405 em toda tentativa de salvar.** O construtor de 5 passos nunca gravou nada |
| 2 | O painel lia `p.industries` de uma resposta `{ socialPersona: { industry } }` | Mesmo que salvasse, **não voltava para a tela** |
| 3 | O XP só era pago se `personaVersion === 0` | Quem respondesse qualquer coisa antes do construtor **perdia o XP dos 5 passos para sempre** |

A persona não parecia rasa por ser curta. Ela estava **vazia**.

Os três estão corrigidos e **medidos no navegador** com a conta QA `expert`
([[reference_test_accounts]]): salvar uma resposta leva a dimensão "Como você fala" de
**0% → 31%**, e o fato aparece no dossiê na mesma hora.

⚠️ **Armadilha de XP evitada, e ela é a mesma de 16/07 (check-in dando +15 por
carregamento).** Trocar "pague na primeira versão" por "pague quando estiver preenchido"
transformaria desmarcar-e-remarcar numa fazenda de XP. A conta agora guarda quantos
passos e blocos **já foram pagos** e só rende o que passa desse teto. Medido:
`195 → 0 → 0 → 0` repetindo, limpando e repondo.

### A profundidade que faltava (e que o USS de 2024 já tinha)

`Uss/src/lib/persona/single-source-of-truth.ts` trabalhava com oito blocos. O
`socialPersona` daqui tinha **cinco listas de rótulos e três strings soltas**. A diferença
não é acadêmica, é o prompt: `["tech","formal"]` produz post de agência.

`src/lib/persona.ts` (novo) é o domínio compartilhado — vocabulário, dossiê e o bloco que
vai para os modelos. O schema ganhou `identidade`, `voz`, `publico`, `estrategia`,
`aprendizado` e `fotos`.

**O campo que mais muda o resultado é `voz.amostra`** — um trecho que a própria pessoa
escreveu. Vale mais no prompt do que todos os adjetivos de tom somados, e é exatamente o
que as ferramentas boas de 2026 fazem (o Jasper chama isso de *brand voice training*).

### O dossiê — a placa angulada, e por que ela se endireita

`components/portal/PersonaDossie.tsx`. Linguagem do painel do Radar: `perspective` curta,
`rotateY`, canto chanfrado, trilhos de varredura.

**Mas o do Radar nunca é preenchido e este é FORMULÁRIO.** Texto em perspectiva é bonito
de olhar e ruim de digitar — a linha de base inclina e o cursor cai fora de onde o olho
espera. Então a perspectiva é o **estado de repouso**: a placa se endireita quando uma
dimensão abre para edição. Você olha uma peça inclinada; você escreve numa peça reta.

Sete dimensões, cada uma com confiança medida **no servidor** (nunca no cliente — duas
telas da mesma pessoa têm que dizer o mesmo número), o que já sabemos, e **cada lacuna
com a pergunta que a fecha e o que ela destrava**. Pedir dado sem dizer para quê é
formulário; o painel só ganha o direito de perguntar porque responde "para quê" antes.

### O curso personalizado — motor Expert v2

O motor v1 (`lib/course-examples.ts`) troca slots `<!--exemplo-->` marcados à mão. Funciona
— e só em curso que tem slot, que é a minoria do catálogo.

O v2 (`lib/curso-personalizado.ts` + `/api/user/curso-personalizado`) trabalha sobre o
**capítulo**, que todo curso tem. Por capítulo: uma abertura ("por que isto muda o seu
jogo"), um exemplo no ramo dele e uma tarefa executável hoje.

**A aula original não é reescrita, e isso é decisão.** O texto do curso é verificado
editorialmente; deixar um modelo reescrever a explicação troca conteúdo conferido por
conteúdo plausível. A camada **envolve** a aula.

**A recusa faz parte do produto:** abaixo de 35% de confiança a rota devolve 422 com as
perguntas que faltam. Personalizar com persona rasa produz um texto que AFIRMA falar do
negócio da pessoa e fala de um negócio genérico — pior do que não personalizar.

### A conta do Google que já estava conectada

O login social criava o usuário e **nunca criava o vínculo**. A aba Contas pedia para ele
entrar de novo com a conta que ele tinha acabado de usar.

Agora o login vincula (`lib/social-identity.ts`). Com uma honestidade que a tela mostra:
o login pede `openid email profile`, o que identifica e **não** dá permissão de publicar.
O vínculo entra como **"Conectada"** e ao lado aparece **"Liberar"** — um clique de
permissão extra, com `login_hint` e `include_granted_scopes`, sem novo login. Marcar como
pronta seria mais bonito na tela e mentira no produto: o botão publicar apareceria e
morreria com 403 do Google na frente dele.

### Fotos por FUNÇÃO, não galeria

Quatro vagas (`perfil`, `profissional`, `casual`, `pessoal`), cada uma com o uso
declarado. **A vaga `perfil` já vem preenchida com o avatar do Google** — mostrá-la é a
diferença entre "envie 4 fotos" e "já tenho a sua, faltam 3".

### Pauta do dia — o que o mLabs não tem

Pesquisa feita: mLabs, Etus e os globais (Buffer, Sprout, Jasper) resolvem agendar, medir,
aprovar e treinar voz de marca. Nenhum responde **"sobre o que eu publico hoje?"** — a
resposta deles é calendário de datas comemorativas, igual para todo mundo, decidido meses
antes.

Nós medimos todo dia o que o brasileiro pergunta sobre IA **por profissão** (o Radar).
`/api/social/pautas` cruza isso com a área da persona e entrega no publicador. Um advogado
recebe a pauta de advogado. Sem área na persona, cai no recorte geral **e a tela diz isso**.

### Ícones 3D no construtor de persona

Mesma regra do menu: **2D primeiro, 3D no hover**, e **uma tela WebGL na grade inteira** —
quem decide qual peça desenha é a grade, não o cartão (o navegador para de criar contexto
por volta de dezesseis). A malha, o material e o balanço saíram para `Peca3D`,
compartilhado com o menu.

32 peças novas (18 áreas + 14 objetivos), família sólida, **1,9 MB no total, nenhuma acima
do teto de 120 KB**. Pipeline `scripts/icones3d/gerar_persona.py` — Qwen 2512 + Lightning →
Hunyuan3D-2mv → gltf-transform, tudo local, custo zero.

⚠️ **Duas peças estouraram o teto na primeira passada, e a culpa era do PROMPT, não do
simplificador.** `area-ecommerce` ("sacola com etiqueta pendurada") saiu com **834 KB** e
`area-beauty` ("batom ao lado de um espelho compacto") com **211 KB**: superfícies finas e
objetos soltos que o decimador não consegue colapsar. Tirar a etiqueta e o espelho —
**um objeto, sólido** — levou para **56 KB** e **19 KB**. Vale como regra para qualquer
ícone novo: peça sólida e única, sem apêndice fino.

⚠️ **Uma armadilha de React que só aparece com WebGL.** A grade estava dentro de uma função
declarada no render do painel. Definido ali, o cartão vira **um tipo de componente novo a
cada mudança de estado** — e o estado que muda é justamente o `hover3d`. React desmontava e
remontava a árvore inteira a cada passada de cursor, criando e destruindo um contexto WebGL
por vez, que é exatamente como se chega ao limite de dezesseis do navegador. O cartão foi
para o escopo do módulo e os blocos internos passaram a ser **chamados** (`{PersonaBuilder()}`)
em vez de montados (`<PersonaBuilder />`).

⚠️ **A peça desenhava em 300x150 — e isso já estava NO AR desde a madrugada.** O `<Canvas>`
do r3f monta no tamanho padrão do HTML e só se remede quando o medidor dele acorda. Medido
no build de produção: contêiner **89x80**, buffer **300x150** — proporção errada e peça
transbordando o ícone. Passou despercebido na sessão anterior porque a verificação foi por
**contagem de contextos**, não por **medida de tamanho**, e o menu fica atrás de login.

Duas correções que **não** funcionaram, anotadas para ninguém repetir:
1. `setSize` de dentro da cena — o r3f reconcilia o tamanho da própria medição e sobrescreve.
2. Um componente com `useThree` dentro do `<Canvas>` — **o efeito nem roda** (instrumentado
   com marca global: nunca apareceu). Filho de `<Canvas>` vive no reconciliador do three.

O que funciona é um `resize` de janela disparado de fora, em React comum, algumas dezenas de
ms depois da montagem — mais a classe `[&_canvas]:!w-full [&_canvas]:!h-full`, porque o r3f
estica o DIV e deixa o `<canvas>` no padrão. Medido depois: **buffer 89x80 em todos os
cartões, no máximo 1 contexto varrendo oito, zero perdidos, zero ao sair.**

⚠️ **`temIcone3D`/`temPersona3D` moravam dentro dos componentes 3D**, que importam
`@react-three/fiber` no topo. Quem só queria saber se deve ligar o `onMouseEnter` — a barra
lateral e o construtor — **puxava o three.js inteiro para o pacote do portal**, anulando o
`next/dynamic`. As duas perguntas foram para `src/data/icones3d-tem.ts`, que só lê catálogo.
Isso conserta também o menu, onde o problema já existia desde 27/07 de madrugada.

### Como ver

```
cd fayapoint-ai && npm run build
```
Depois `/pt-BR/portal?tab=social` logado. A placa do dossiê fica à direita; passe o cursor
pelos cartões de área para ver o volume.

### O que ficou aberto

- **Calendário editorial** (visão de mês do que está agendado) — é o que o mLabs faz de
  melhor e nós temos só a lista. Não é conserto, é fase.
- **A camada do curso ainda não tem botão na página de leitura** — ela é gerada e injetada
  pelo `/api/courses/[slug]/content`, e o gatilho mora no Perfil Social. O lugar natural é
  o topo do capítulo, dentro do leitor (2.900 linhas — merece sessão própria).
- ~~Duas malhas acima do teto de 120 KB~~ — **não é mais pendência, era a lista que
  estava desatualizada.** O corpo desta seção já descreve o conserto (tirar a etiqueta
  da sacola e o espelho do batom), e a medição de 27/07 confirma: as 32 malhas somam
  1,8 MB, média 58 KB, **nenhuma acima de 120 KB**.

---

## ✅ SESSÃO 27/07 (madrugada) — OS 8 DEFEITOS + 3D PARA ESCOLHER (Opus 5)

Ordem do Ricardo: *"vamos começar a corrigir os erros e deixar o site limpo de erros, e ao mesmo tempo quero que gere mais 3 opções do logo FayaAi em 3d… depois também quero que gere os ícones em 3d… 3 opções para cada ícone estático que temos, isso deve acontecer em paralelo."* Foi feito nessa ordem, com a GPU rodando o tempo todo em segundo plano.

**DEPLOYADO a pedido dele**, depois de escolher a família de ícones e de eu somar a regra que impede build por documentação. Verificado no build antes de subir; verificação em produção logo abaixo.

### Os defeitos: 7 dos 8 fechados

| # | O que era | Estado |
|---|---|---|
| D1 | `.fx-orb` declarado dentro do `<style>` do `NovaLanding`: fora da home virava bloco no fluxo e empurrava a `/radar` 449 px | ✅ a família `fx-*` inteira (orb, shine, magic, float, conf, quiz + keyframes) mudou para `globals.css`. Medido na `/radar`: `position: absolute`, título logo abaixo do menu |
| D2 | `itens[0].volume` como divisor dava barras de 1000% | ✅ `radar-barra.ts`. **Não foi só trocar por `Math.max`:** busca e leitura convivem na mesma lista com réguas diferentes, então cada fonte tem seu próprio topo. Medido: 4/10/20/37/100%, dois 100% (um por fonte), nenhum acima |
| D3 | O painel vazava do mapa no celular | ✅ abaixo de 640 px vira folha ancorada no rodapé da janela. **Trocar para `fixed` não bastava** — `backdrop-filter` no `.glass` do cartão faz dele o bloco contêiner, e o painel resolvia contra 341 px em vez da janela. Resolvido com portal para o `body` |
| D4 | Linhas do IA Trend eram `<div>` sem interação | ✅ viraram botão e abrem o mesmo painel do World Trend, com nota, canais (posição no Google e no YouTube), amplitude e a ponte do nicho. **A parte do mapa continua aberta** — ver abaixo |
| D5 | `/radar` tinha `<a href="#ia-trend">`: só rolava a página | ✅ vira troca de camada como na home, e a página ganhou o ranking de IA que só existia lá. Medido: `scrollY` fica em 0, o título vira "IA TREND" e a coluna troca |
| D6 | Nada do que medimos é guardado | ❌ **não fiz — é fase, não conserto.** Ver abaixo |
| D7 | Metodologia detalhada demais | ✅ virou uma linha com link para as fontes. A ressalva do volume **não sumiu**: mudou para junto dos números que a exigem, na comparação por região |
| D8 | O WhatsApp subia ao ver o rodapé, em vez de acoplar | ✅ acopla **entre o rodapé e a grade de botões**, exatamente onde ele pediu, via encaixe nomeado (`#wpp-acoplado`) com retorno seguro para páginas sem o encaixe. O X no canto superior esquerdo acopla (não fecha) e a escolha fica no `localStorage` |

**Dois defeitos que apareceram durante a verificação e entraram no conserto:**
- O `<h1>` da `/radar` ficava **por baixo do cabeçalho fixo**. Estava escondido pelo próprio D1: com 449 px de vazio ninguém via. Corrigido nas duas páginas novas.
- O painel de IA mostrava **"GOOGLE · 0º"** e **"1 PERGUNTA DISTINTAS"**. A posição do autocomplete é 0-indexada e "0º" lê como erro; a concordância estava quebrada.

### O que ficou aberto, e por quê

- **D6 (memória do que medimos)** — o Ricardo tem razão de que é o que mais vale, e é justamente por isso que não entra como patch: precisa de coleção nova (`radar_snapshots`), decisão de cron e desenho do gráfico. Continua descrito no bloco de handoff anterior, que segue válido como especificação.
- **D4, segunda metade (hover do IA Trend acendendo o mapa)** — não é interface, é **dado**: o IA Trend é medido com `gl=br`, nacional, sem recorte geográfico. Não existe "onde" para acender. Destravar isso exige medir por região, o que multiplica as consultas e pede cache próprio.
- **O vídeo da `/radar`** — ele disse que quer o plano ocupando o vazio do topo. Consertado o vazio, não há mais vazio: o vídeo continua ao lado do título. **Decisão de composição dele.**

### Logo em 3D — 3 opções (`/pt-BR/lab/3d`)

Não são três ajustes da mesma peça: são três MATÉRIAS. A forma não muda em nenhuma — os contornos continuam saindo dos glifos da fonte (`scripts/logo-svg.py`), porque imagem generativa erra letra.

| | O que afirma | GPU |
|---|---|---|
| **Maciço** | letreiro físico, ouro polido, chanfro largo — é o que está no ar | baixo |
| **Vidro** | o "Fay" vira vidro fumê e o "Ai" fica ouro maciço por dentro; o dourado aparece através | alto |
| **Contorno** | corpo escuro com a aresta acesa (casca `BackSide`), a linguagem do HUD do Radar | médio |

A bancada tem alternador de fundo claro/escuro — o vidro é a única que depende do fundo para existir, e escolher sem isso seria escolher no escuro. Verificado: as três montam WebGL no hover, zero erro de console.

### Ícones do dashboard — 3 opções para cada um dos 17

Pipeline: **Qwen 2512 + Lightning** desenha a imagem-fonte (clay render isolado, sem texto) → **Hunyuan3D-2mv** reconstrói a malha → **gltf-transform** decima. Tudo local, custo zero. Scripts em `scripts/icones3d/`.

As três opções são três **linguagens de forma** aplicadas aos 17 ícones: `sólido` (volume cheio), `facetado` (planos e arestas) e `emblema` (o objeto em relevo dentro de um disco — a linguagem do pino do Radar). Escolher é escolher um CONJUNTO: num menu, o que importa é as dezessete peças combinarem entre si.

⚠️ **Duas armadilhas medidas, para não repetir:**
1. **`--simplify-error` é orçamento de ERRO, não alvo de tamanho.** Quando a malha é ruidosa o simplificador para antes da meta e devolve o arquivo quase inteiro: o robô facetado saiu com **4.436 KB**. A decimação agora sobe o erro até caber num teto de 120 KB — num ícone de 40 px, 8% de erro de forma não se vê; 4 MB se sente. O mesmo arquivo passou a sair com **62 KB**.
2. **`npx` não existe no PATH de um subprocesso do Python** (o node é gerenciado por fnm), e achar o `npx.cmd` não basta — ele chama `node`, que também precisa estar no PATH. O sintoma é código 1 sem mensagem, que manda depurar a ferramenta errada.

**Resultado: 51 malhas, 3,0 MB no total** (média 60 KB; três teimosas entre 136 e 344 KB — `courses_facetado` é um livro aberto, e páginas finas são muitas superfícies separadas que o simplificador não consegue colapsar). Os 17 ícones × 3 famílias estão reconhecíveis.

**A pendência de arquitetura do 3D ficou respondida na prática:** a bancada usa **uma tela WebGL por ícone, não por opção**, montada só quando entra em cena. Uma por opção seriam 51 contextos — e o navegador para de criar por volta de dezesseis. É esse o padrão que o dashboard vai precisar.

**Terceira armadilha, e essa era MINHA, não do pipeline.** A primeira versão da bancada girava as peças 360° em Y sobre fundo navy escuro: os emblemas — que são discos — passavam a maior parte do tempo de perfil, e as peças liam como manchas marrons. Parecia malha ruim e não era. Duas correções e as formas apareceram: **balanço de ±40° em vez de rotação completa** (a peça nunca some) e **corpo claro com luz de trás dourada** em vez de navy chapado (o contorno separa do fundo). Vale para qualquer lugar do site que exiba estas peças em miniatura.

**As malhas NÃO estão versionadas** (`/public/3d/icones/` no `.gitignore`): 51 arquivos no repositório para uma decisão que descarta dois terços deles não se justifica. Depois da escolha, as 17 da família vencedora passam a ser versionadas.

### A escolha dele, e o que saiu dela

**Logo: fica como está** (Maciço). As outras duas continuam na bancada para quando ele quiser rever.

**Ícones: família SÓLIDA**, escolhida pelo critério que ele deu — "não sendo os que ficaram grande demais". Medido:

| família | total | maior peça | acima de 120 KB |
|---|---|---|---|
| **sólido** | **943 KB** | **116 KB** | **nenhuma** |
| facetado | 1.099 KB | 340 KB (`courses`) | 1 |
| emblema | 1.081 KB | 207 KB (`history`) | 2 |

As 34 peças descartadas saíram do `public/`; as 17 escolhidas passaram a ser versionadas.

**No portal elas aparecem no hover** (`IconeMenu3D` + `DashboardSidebar`), seguindo a regra dele de 2D primeiro. Quem decide qual peça desenha é a **barra lateral**, não cada item: o cursor está sobre um só, então existe no máximo **um contexto WebGL** no menu inteiro. Sem esse controle, uma varrida de cursor empilharia canvases.

⚠️ **A verificação da barra lateral não pôde ser visual** — o portal fica atrás de login e eu não entro na conta de ninguém. O que foi verificado: os 17 ids do menu batem 1-a-1 com o catálogo, os `.glb` são servidos com `model/gltf-binary`, e **o mesmo componente, com a mesma regra de um-por-vez, foi montado na bancada** e medido (antes do cursor: 0 canvas e o vetorial visível; com o cursor: 1 canvas e o vetorial em opacidade 0; varrendo os cinco itens: continua 1). O teste de 30 s dele: abrir o portal e passar o cursor pelo menu.

### O limite do WebGL deixou de ser teoria e virou medição

A primeira bancada montava **um canvas por cartão** — e quebrou: medidos **5 de 11 contextos com `isContextLost() === true`**, cartões vazios na tela. É o despejo do navegador por volta de dezesseis contextos, exatamente o risco anotado como pendência de arquitetura.

A grade agora usa **uma única tela WebGL**, fixa na janela, com as 17 peças posicionadas em pixels sobre os cartões (câmera ortográfica com zoom 1 → unidade de mundo = pixel; cartão fora da janela não desenha). Depois: **5 canvases na página inteira, zero perdidos**. É este o padrão para qualquer lugar do site que queira 3D em quantidade.

### Netlify: documentação não gasta mais build

`netlify.toml` ganhou um `ignore`. A convenção é invertida em relação ao que parece: **sair com 0 CANCELA** o build. Como `git diff --quiet` devolve 0 quando não há diferença, "nada mudou fora dos caminhos excluídos" cancela.

Excluídos: `*.md`, `scripts/*` e `.gitignore`. Tudo o mais continua construindo. A comparação é contra `CACHED_COMMIT_REF` (último deploy com **sucesso**), então um build que falhou não some do diff; e sem a variável sai com 1 — na dúvida, constrói.

Testado contra commits reais deste repositório antes de subir: `fdb2ee0` (só MASTERPLAN) → **pula**; `d8aed89` (só `.tsx`) → **constrói**.

### Como ver

```
cd fayapoint-ai && npm run build
```
Depois `/pt-BR/lab/3d` (as opções), `/pt-BR/radar` (D1, D2, D5, D7) e `/pt-BR` (D4, D8). No celular, abrir um assunto na `/radar` prova o D3 e rolar até o fim da home prova o D8.

---

## 🔎 SEO — O DIAGNÓSTICO DE 27/07 (por que estamos estagnados)

O Ricardo pediu para atacar o tráfego. O Search Console de 11/07 a 24/07:
**2 cliques, 87 impressões, posição média 11,6** — e as **12 consultas são
todas variações do nome** ("fayai", "fayz ai", "fazer ai", "fai ia",
"uaifai"). Nenhuma consulta de conteúdo. Ou seja: quem já conhece a marca
acha; quem procura o assunto, não.

Descoberta não é o gargalo: o sitemap está enviado desde 21/07, foi lido em
26/07 e processado com 128 URLs. O gargalo é o que essas URLs dizem ao Google.

### O que o `site:fayai.com.br` revelou

O índice tinha **as mesmas páginas duas vezes**, e as cópias sem prefixo de
idioma vinham com **título antigo em inglês**:

- `fayai.com.br` → "FayAi - Master AI from Beginner to Pro"
- `fayai.com.br/cursos` → "AI Courses - FayAi… Explore 50+ hands-on courses"
- `fayai.com.br/blog` → "AI Blog - Articles & Tutorials"
- e ao lado, `fayai.com.br/pt-BR/cursos`, `/pt-BR/noticias`, `/pt-BR/radar`

Com o próprio Google avisando no rodapé que **omitiu resultados "bastante
semelhantes"**. Ele estava filtrando nossa duplicata.

### As cinco causas, todas corrigidas

| | O que estava errado | Conserto |
|---|---|---|
| 1 | **307 no redirecionamento de idioma.** Temporário = "mantenha a URL antiga no índice", e foi o que ele fez. | 308 quando não há cookie. ⚠️ **E o destino teve que virar determinístico**: um dos três caminhos partia de `en` e só virava `pt-BR` com cabeçalho de país ou `Accept-Language` — tornar isso permanente gravaria `/cursos → /en/cursos` para sempre. Medido depois: com `Accept-Language: en-US`, o destino é `/pt-BR/cursos`. |
| 2 | **`/en/` serve português.** `/en/noticias` respondia com `<title>Blog IA Hoje…`. Eram **64 das 128 URLs do sitemap** — metade do rastreamento gasto em cópia, num domínio sem autoridade. | Fora do sitemap (128 → 64), `noindex, follow` na árvore `/en/`, e o `hreflang="en"` removido. A rota continua funcionando; ela só deixa de competir consigo mesma. Quando houver tradução de verdade, tudo volta junto com ela. |
| 3 | **Cadeia de 4 respostas no `/blog`**: `/blog → /pt-BR/blog → /noticias → /pt-BR/noticias`, tudo temporário. | `permanentRedirect` com o idioma no destino: 2 saltos, ambos 308. |
| 4 | **Zero dado estruturado nos 20 cursos e nas 29 matérias** — as páginas que competem por busca eram as únicas sem schema. | `Course` + `CourseInstance` + `Offer` + `BreadcrumbList` nos cursos; `Article` + `BreadcrumbList` nas matérias. ⚠️ **Sem `aggregateRating`**: as notas do banco são dado de teste (auditoria de 18/07), e estrela inventada é ação manual do Google além de mentira. |
| 5 | **Os motores de resposta de IA estavam bloqueados na borda.** O robots.txt os liberou em 21/07 com o argumento certo, mas eles rastreiam de IPs fora do Brasil e caíam no geoblock: o robots dizia "entre" e a borda respondia 403. A decisão era letra morta. | `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Perplexity-User` e `ClaudeBot` passam por UA (nenhum publica faixa de IP oficial, ao contrário de Google e Bing). |

### O que a Inspeção de URL revelou — e que muda a leitura de tudo

Inspecionando `https://fayai.com.br/pt-BR` no Search Console, o Google
respondeu com todas as letras:

- **"O URL não está no Google"** — a home canônica **não está indexada**.
- Motivo: **"Cópia sem página canônica selecionada pelo usuário"**.
- **"URL canônico declarado pelo usuário: Nenhum"**.
- **"URL canônico selecionado pelo Google: `https://fayai.com.br/`"** — ele
  escolheu a raiz sem prefixo no lugar dela.
- **"Último rastreamento: 20 de abril de 2026"**.

Ou seja: **o Google trabalha com uma foto de três meses atrás.** Naquele
rastreamento não havia canonical por página (o bug que só foi corrigido em
21/07), então ele dobrou tudo na raiz. Nada do que consertamos desde então —
nem o canonical de 21/07, nem os títulos, nem o de hoje — chegou até ele.

E `/pt-BR/arcade` apareceu como **"Detectada, mas não indexada no momento"**,
com "Último rastreamento: N/D": descoberta pelo sitemap, **nunca rastreada**.
É o sintoma clássico de orçamento de rastreamento gasto em outro lugar — no
caso, nas 64 duplicatas.

**Ação tomada (27/07):** rastreamento prioritário solicitado para as 7 URLs
que carregam o negócio — `/pt-BR`, `/pt-BR/cursos`, `/pt-BR/noticias`,
`/pt-BR/radar`, `/pt-BR/arcade`, `/pt-BR/curso/chatgpt-zero` e
`/pt-BR/curso/rag-knowledge`. Sem isso, os consertos ficariam esperando o
Google voltar sozinho — o que, pelo histórico, leva meses.

⚠️ **Esperar as impressões CAÍREM antes de subir.** As 71 impressões da raiz e
as 8 de `/en/cursos` somem por construção. A aposta é que consolidem em
`/pt-BR/`. Se em duas semanas a soma não voltar, a hipótese estava errada e o
caminho é outro.

**Também verificado:** nenhuma ação manual, sitemap enviado e processado.
Nenhum bloqueio pesa contra o site — o que pesava era a duplicata.

### O que isto NÃO resolve — e é onde está o trabalho real

Nada acima cria demanda. Some a duplicata, consolida os sinais nas URLs certas
e torna as páginas elegíveis a resultado rico — mas **o site continua sem
conteúdo que responda a uma pergunta que brasileiro digita**. As 12 consultas
do Search Console provam isso: só marca, nenhum tema.

O próximo passo de tráfego é conteúdo de cauda longa informacional ("o que é
RAG", "agentes de IA o que são", "como usar ChatGPT"), que já está apontado no
§8.5 e na Fase 9.4. E a matéria-prima existe: o Radar mede todo dia o que o
Brasil pergunta sobre IA, por profissão — é literalmente uma lista de pautas
com demanda comprovada, e ninguém escreveu uma linha a partir dela ainda.

---

## 🤝 HANDOFF — RADAR FAYAI + 3D NA INTERFACE (fechado 26/07/2026)

**Para quem abrir uma sessão nova: leia este bloco inteiro antes de tocar em qualquer coisa.** Sessão de ~24h com o Ricardo, evolução contínua.

> ⚡ **ATUALIZAÇÃO 26/07 (noite) — ISTO ESTÁ NO AR.** O Ricardo mandou deployar e depois seguir com as pendências. Foram 4 commits (`503589d`, `aeb9683`, `b4f6533`, `12fe51c`), todos verificados **em produção**, não só no build. A diretriz "sem deploy até o masterplan fechar" ([[feedback_local_ate_masterplan]]) foi **suspensa por decisão dele**, não esquecida.
>
> O que a verificação em produção mudou de fato:
> - **O maior risco caiu por medição, não por torcida**: o Google **não** bloqueia os IPs da Netlify. `/api/radar/mundo?lugar=BR` responde `live` em **742 ms** (são 28 pedidos em paralelo lá dentro), o mundo em 1,3 s e `/api/radar` em ~2 s — folgado abaixo do limite de 10 s da função.
> - **Dois defeitos de SEO achados só porque olhei produção**, ambos da família que deixou o site invisível até 21/07: `/radar` tinha canonical relativo (apontava para uma URL que responde 307) e **`/arcade` estava sem canonical nenhum desde 19/07**, se declarando cópia da home. Nenhuma das duas estava no sitemap.
> - **R6 não era "contraintuitivo", era inválido** — ver a linha R6 na tabela. A barra de volume por região saiu do ar.
>
> Antes de mexer no Radar, leia R6: **o `approx_traffic` do Google não é comparável entre lugares.** Qualquer coisa nova que some ou ranqueie lugares por esse número está errada por construção — inclusive a altura dos marcadores 3D, que ainda usa isso e é a decisão que ficou aberta para o Ricardo.

### Como rodar e validar

```
cd fayapoint-ai
npm run build          # fonte da verdade; NUNCA valide só no dev
```
Depois suba o preview `fayapoint-build` (porta 3002, config em `.claude/launch.json`). Telas: `/pt-BR` (home) e `/pt-BR/radar` (página dedicada).

🔴 **Três regras que custaram horas nesta sessão. Não repita:**
1. **Turbopack dev serve build ANTIGO** mesmo após reiniciar. Edição por script não acorda o watcher no Windows. Sintomas enganosos: hydration mismatch, `useEffect` que "não roda", estado que não chega ao DOM. → `rm -rf .next` **e** reiniciar; validar no build.
2. **O matcher do `src/proxy.ts` precisa listar cada extensão de asset nova.** Já derrubou `.json` (GeoJSON) e `.glb` (ícone) com 404 sem explicação. Hoje inclui `json|glb|gltf|hdr|ktx2|bin`.
3. **Rota nova em `[locale]/(site)/` pode ser redirecionada para a home** pelo proxy — perdi tempo depurando a home achando que era outra página.

### O que existe hoje

**Radar FayAI** — duas leituras do mesmo planeta, na home (`components/landing/RadarSection.tsx`) e na página `/radar` (`components/radar/RadarPagina.tsx`).
- **World Trend**: Google Trends RSS (27 estados + 16 países, verificado) e Wikipedia most-read. Cada assunto leva à fonte.
- **IA Trend**: autocomplete Google/YouTube por profissão, 3 fontes combináveis que mudam a **nota**, não só o filtro.
- **Globo** (`components/3d/RadarGlobo.tsx`): Terra com mapa político, contexto esmaecido, extrude no foco, siglas projetadas, marcadores 3D, voo com bezier e arco, malha de meridianos no IA Trend.
- **Painel HUD** (`components/radar/ModalAssunto.tsx` + `usePainelAssunto.ts`): hover espia, clique/alfinete fixa, 5 gestos de entrada/saída sorteados, câmera desloca o mundo por `setViewOffset`.

**3D na interface** — `components/marca/LogoFayai.tsx` + `LogoFayai3D.tsx`. Logo 2D vira WebGL no hover e se demonstra sozinho em intervalos irregulares. Nos três headers do site (`Header`, `ExperienceNav`, `NovaLanding` — **são três, não um**).

### Scripts que regeram os dados

```
npm run radar:seed            # snapshot do IA Trend (src/data/landing/radar-seed.json)
python scripts/radar-geo.py   # GeoJSON mundo/regiões/estados (src/data/geo/)
python scripts/logo-svg.py    # contornos do logo a partir da fonte (public/3d/)
```

### ⏩ Sessão 26/07 (noite) — deploy + pendências (Opus 5)

Ordem do Ricardo: *"vamos deploy e então ter certeza que tudo roda perfeito, e depois continue com as pendências."* Feito nessa ordem.

**Antes de subir** (o build passava, mas isto não estava certo para produção):
- `three-globe` continuava no `package.json` sem **nenhum import** — a dependência de uma biblioteca que provou não funcionar aqui. Removida; o `package-lock` voltou sozinho ao estado anterior, o que confirma que ela era a única mudança de lock.
- `RadarGlobe.tsx` (o globo v1 que você reprovou) seguia no repo sem ser importado por ninguém. Removido — código morto que subiria junto.
- **Preposição de lugar**: a home mostrava "#1 em Brasil" e a página "EM ALTA EM BRASIL". Português não tem regra para isso ("no Acre" mas "em Alagoas"), então virou tabela em `radar-lugares.ts` com a função `noLugar()`. Verificado nos quatro casos: **no** Brasil · **no** Nordeste · **na** Bahia · **em** Goiás.
- **Teto de 6 s** por consulta externa (era 9 s). Medir o Brasil dispara 28 pedidos em paralelo e o relógio da função serverless é o do mais lento — com 9 s, uma fonte travada levaria a função inteira junto e o visitante receberia erro em vez de dado parcial.
- Ruído fora do versionamento: logs de geração, `__pycache__` e manifests de lote entraram no `.gitignore`. A fonte de Inter usada pelo `logo-svg.py` ficou versionada de propósito (OFL, 318 KB) — sem ela o script não é reproduzível.

**Depois de subir**, a verificação achou o que só produção mostra — os dois defeitos de SEO e a confirmação de que o Google não bloqueia a Netlify (detalhes no aviso do topo, linhas R8 e R12 da tabela).

**Pendências fechadas nesta rodada:** R6 (a barra de volume por região media contagem de estados), R7 (`radar.py` ranqueava a própria pergunta), R9 (o vídeo de abertura), R11 (o filtro de português engolia "ia jurídica gratuita", o sinal do nicho advogados) e R12 (`/arcade` sem canonical desde 19/07).

**Decisões que você tomou no meio da sessão, e o que saiu delas:**
- *Marcador 3D → altura constante.* A prop deixou de ser `intensidade: Record<string, number>` e virou `comSinal: Set<string>`. O tipo agora diz o que o dado é, então não dá para voltar a codificar quantidade sem perceber.
- *Vídeo → você apresentando o radar.* Virou o R9, já no ar.

**O que sobrou da tabela R1–R12:** R3 (imagens de categoria com seu rosto, esperando crédito Higgsfield — mas note que o R9 mostrou um caminho local que não precisa de crédito: partir de foto em vez de gerar), R4 (matcap para os marcadores, ideia solta), R5 (nicho padrão da `/radar`, decisão sua) e R10 (limitação do dado do Google, não é bug).

### O que fazer a seguir, na ordem combinada com o Ricardo

1. ~~R9 — vídeo na página `/radar`~~ **FEITO 26/07 (noite)** — ver a linha R9 na tabela.
2. **Levar o 3D para o resto do site**, na ordem que ele indicou: **gestor de identidade de persona** (maior ganho — é onde o usuário decide algo sobre ele mesmo), depois certificados, criador de imagens, dashboard. ⚠️ **Decisão de arquitetura pendente:** um canvas WebGL por ícone não escala. Antes de espalhar, resolver entre canvas compartilhado, sprites pré-renderizados ou extrusão CSS por caso.
3. **R5, R6, R7, R10** — ver a tabela de pendências logo abaixo.

### Convenções deste código

- Comentários e nomes **em português**, explicando *por quê* e não *o quê*.
- Nada de número estimado na tela: se não foi medido, não entra.
- Nunca prometer curso que não existe (a ponte por nicho em `radar-nichos.ts` é escrita à mão).
- `prefers-reduced-motion` desliga toda animação nova.
- **Regra do PRONTO (§1):** só o Ricardo promove para ✅.

---

## ✨ 3D NA INTERFACE — A TÉCNICA E ONDE ELA CABE (26/07)

O Ricardo viu o ícone do radar e pediu para levar a técnica ao site: logo, dashboard, certificados, criador de imagens e **gestor de identidade de persona** — com a regra certa de que a primeira visualização fica no estilo atual e o 3D entra **no hover ou no clique**, sem virar comum.

**Piloto entregue: o logo** (`components/marca/LogoFayai.tsx`), já no header das páginas-experiência.

**A decisão técnica que vale para tudo que vier depois — são DUAS técnicas, não uma:**

| | Malha gerada (Hunyuan3D) | Extrusão de texto (CSS 3D) |
|---|---|---|
| Serve para | **objetos** — pino, troféu, medalha, ferramenta | **tipografia** — logo, números, siglas |
| Por quê | dá forma orgânica que ninguém modela à mão | imagem generativa **erra letra** (IDENTIDADE §8 proíbe texto em arte gerada); um logo com letra errada não é o logo |
| Custo | ~30 KB por peça + WebGL na tela | alguns nós de DOM, **zero WebGL** |
| Escala | limitado — vinte canvases disputando GPU | ilimitado, é só CSS |

**Por isso o logo não virou malha.** As camadas são o **texto real** da marca: tipografia exata em qualquer tamanho, continua selecionável e legível por leitor de tela, e o efeito pode se repetir pelo site sem custo de GPU — que é exatamente o que viabiliza levar a ideia para o dashboard e o gestor de persona.

**Como funciona:** oito camadas do mesmo texto deslocadas em Z formam a lateral extrudada, escurecendo com a profundidade (bloco sólido, não sombra empilhada); a face nunca é substituída — é o logo de sempre. A inclinação **segue o cursor**, então o volume parece real em vez de uma animação que roda igual toda vez, e um brilho especular atravessa a face na chegada. `prefers-reduced-motion` desliga tudo.

**Atualização 26/07 — o Ricardo pediu 3D de verdade no logo, mesmo custando mais, para medirmos.** Feito: `LogoFayai3D.tsx`, WebGL, montado **só no hover** e desmontado ao sair (quem nunca passa o cursor não paga nada — e o header existe em toda página).

A tipografia continua exata porque a geometria **não é gerada por IA**: `scripts/logo-svg.py` extrai os contornos dos glifos da própria fonte com fontTools → SVG → `SVGLoader` → `ExtrudeGeometry` com chanfro. O "Fay" claro e o "Ai" dourado viram materiais distintos (o ouro com `metalness` .85 para ler como metal, não como amarelo chapado). A rotação segue o cursor e a entrada gira para o lugar.

⚠️ **Armadilha que custou um ciclo:** usei `size` (pixels) onde three quer `viewport` (unidades de mundo) para calcular a escala. O logo foi para uma escala dezenas de vezes maior e o que aparecia era o interior de uma letra.

**Ajustes 26/07 (3ª rodada do logo), todos a pedido do Ricardo:**
- **A saída pulava.** A versão anterior desmontava o canvas no `mouseleave`, então o logo sumia girado para um lado e reaparecia chapado. Agora existe uma fase de **recolhimento**: o volume volta ao neutro, encolhe e desvanece pela mesma curva da entrada, e só então o canvas é descartado. O 2D reaparece no mesmo ritmo. Verificado: aos 200 ms o canvas ainda está lá; aos 700 ms saiu.
- **A home não tinha mudado nada** porque ela usa um terceiro header — o do `NovaLanding`, não o `Header` nem o `ExperienceNav`. Os três agora usam o mesmo componente.
- **Demonstração automática ("o flex").** A cada 10 s o logo se desembrulha sozinho por ~2,6 s, gira devagar mostrando o volume e recolhe. Só roda quando está **na tela**, **sem cursor em cima**, com a **aba visível** e sem `prefers-reduced-motion` — mostrar o que foi construído não pode virar movimento que incomoda quem só quer ler. Verificado: disparou sozinho e recolheu dentro da janela observada.

**Ajuste final 26/07 — a demonstração ficou irregular.** Intervalo fixo vira relógio: em duas voltas o olho já sabe quando vem, e o que era surpresa vira ruído previsível. Agora a primeira aparição é aos 10 s e, dali em diante, **espera sorteada entre 10 e 20 s, exibição entre 5 e 9 s, e o giro começa de um ângulo diferente a cada vez** (uma semente desloca a fase dos senos). `setTimeout` encadeado em vez de `setInterval`, que é o que permite cada espera ter duração própria.

**Próximo passo antes de espalhar:** medir com o logo no ar. Se o custo for o esperado (é), levar para certificados e o gestor de persona, que é onde o Ricardo apontou o maior ganho — o momento em que o usuário decide algo sobre ele mesmo.

---

## 📌 RADAR FAYAI — PENDÊNCIAS ABERTAS (a pedido do Ricardo, 26/07)

Lista viva. O que está feito saiu daqui e está descrito nos blocos de sessão abaixo.

| # | Pendência | Estado | Quem |
|---|---|---|---|
| R1 | ~~Baixar o modelo de geração 3D~~ **FEITO 26/07** — **Hunyuan3D-2mv fp16 (4,9 GB)** baixado em `D:\ComfyUI-Models\checkpoints\hunyuan3d`, ligado ao ComfyUI por **junction** em `C:\WORKS\ComfyUI\models\checkpoints\hunyuan3d` (não editei o `shared_model_paths.yaml`, que o Comfy Desktop regenera). Escolhido por ter **suporte nativo** no ComfyUI e pedir ~6 GB de VRAM para geometria — folgado nos 16 GB da 5060 Ti. ⚠️ Textura/PBR ainda **não** é suportado nativamente: sai geometria, a cor é nossa. | ✅ baixado, não testado | eu |
| R2 | ~~Ícone 3D próprio~~ **FEITO 26/07.** Feito em 26/07: imagem-fonte gerada no HiDream O1 local (pino navy com borda dourada e tela de radar dentro, identidade certa) → **Hunyuan3D-2mv** gerou a malha → `gltf-transform` decimou de **236.688 para 2.840 triângulos (8,52 MB → 30,7 KB)**, sem Draco para não depender de decoder externo → servido em `/3d/pino-radar.glb` → **carregado no three.js e confirmado** (1.432 vértices, normalizado para altura 1). **A causa de o ícone não aparecer** (achada instrumentando o `Marcadores`, não a página): eu escalava o **grupo** do marcador, e escalar um grupo escala também a **posição** dos filhos — com fator 0,7, um ícone ancorado no raio 103 ia parar no raio 72, ou seja, **dentro do planeta**. Nada de escala, material ou luz. Corrigido separando as responsabilidades: grupo externo ancora e orienta (nunca escala), grupo interno cresce a partir da superfície. | ✅ | eu |
| R3 | **Imagens de categoria com o rosto do Ricardo** (Soul atual) — parada por crédito Higgsfield não resetado. Reavaliar se ainda faz sentido depois de R2, já que a decisão foi ícone em vez de imagem. | esperando crédito | Ricardo libera |
| R4 | **Matcap/textura para os marcadores** via ComfyUI local (grátis) — dá acabamento "cartoon premium" da marca sem depender de R1. | ideia, não iniciada | eu |
| R5 | **Nicho padrão da página `/radar`**: em "Todo mundo" os cartões "só YouTube" e "só Google" marcam **zero** (o dado é esse). Talvez abrir num nicho profissional, onde a leitura de canal é forte. | decisão do Ricardo | Ricardo |
| R6 | ~~Sudeste abaixo do Norte em volume somado~~ **INVESTIGADO E CORRIGIDO 26/07.** Não era contraintuitivo, era inválido. Medi o feed cru nos 27 estados: ele devolve **no máximo 10 assuntos por geo**, então a soma da região acompanha o **número de estados**, não a procura (NE 9 estados/197.600 · S 3 estados/44.400 — mas **por estado** é 21.956 contra 14.800, mesma faixa). E o `approx_traffic` é **relativo à linha de base de cada lugar**: SP (44 mi hab) reportou 19.500 no mesmo dia em que MS (2,8 mi hab) reportou 50.100. Somar ou ranquear lugares com esse número não mede nada. **A barra saiu**; no lugar entrou o alcance dentro da própria região ("aparece em 3 estados de 3"), que é contagem e não estimativa. Medido: Sul unânime (3/3), Sudeste disperso (1/4) — leitura que a barra escondia. ⚠️ **Consequência ainda aberta:** a altura dos marcadores 3D (`intensidade`) usa o mesmo volume somado e portanto tem o mesmo defeito — no nível Brasil o Nordeste sempre sobressai por ter 9 estados. Não mexi porque muda a cara do globo, que você vinha ajustando a olho: **decisão sua** entre altura constante (marcador só diz "há sinal aqui") ou outra medida. | ✅ corrigido; sobra a decisão do marcador | eu → Ricardo |
| R7 | ~~`radar.py` ainda ranqueia a própria pergunta~~ **FEITO 26/07.** As consultas próprias saem do ranking (mesma regra do site) e o script ganhou o filtro de português que só existia no site. Verificado: rodando com semente `ia juridica`, a semente sumiu do topo e o #1 virou `ia juridico`, que é demanda medida. Também corrigido o stdout para UTF-8 — o console do Windows abre em cp1252 e devolvia "intelig?ncia artificial", o que viraria dado corrompido quando o Hermes capturar essa saída. ⚠️ `PRODUCAO/` fica **fora** do repo `fayapoint-ai`, então esta correção não está em nenhum commit. | ✅ | eu |
| R11 | **Filtro de português estava engolindo demanda real** (achado ao fazer R7). A regra sempre foi "só entra palavra que NÃO existe em português" e tinha sido quebrada: `aprender` barrava "ia gratis para aprender ingles" e `gratuita` barrava **"ia jurídica gratuita"** — justo o sinal do nicho advogados que a própria seção exibe. Medido sobre 291 termos reais: 6 descartes, 2 deles legítimos. Saíram também `make` (a ferramenta Make, que tem curso no catálogo), `top` e `for`. Corrigido no site e no `radar.py`. | ✅ | eu |
| R9 | ~~Vídeo na página `/radar`~~ **FEITO 26/07, REPROVADO E REFEITO 27/07.** ⚠️ **A primeira entrega estava parada e o Ricardo reprovou com razão** — medido: 0,65 de diferença média entre quadros vizinhos (escala 0-255), ou 0,25%. Era uma foto com ruído. A causa foi pedir ao LTX que animasse a cena inteira: com movimento no globo ele vira rastro de luz, e ao travar isso o plano congela junto. **Refeito com as camadas separadas** — a pessoa vai para o LTX (que é bom em movimento humano: vira a cabeça, sorri, respira; `strength` de 0,82 para 0,62 era o freio), o fundo é desenhado quadro a quadro (rotação e varredura viram conta, e o ciclo fecha), BiRefNet recorta os 121 quadros num job só e as duas se compõem. Medido depois: **2,44** quadro a quadro e **10,99** do primeiro ao último. **Achado que vale para qualquer globo:** uma malha lat/lng uniforme NÃO consegue mostrar rotação — com meridianos a cada 20° o desenho cai sobre si mesmo a cada 20° de giro. Precisa de forma assimétrica; entraram as costas reais do **mesmo GeoJSON que a página usa**. 269 KB. Pipeline versionado em `scripts/video/`. | ✅ no ar (v2) | eu |
| ~~R9-v1~~ | *(histórico da primeira versão, mantido pelo que ensina)* **26/07 (noite).** Plano de 4,8 s ao lado do cabeçalho, com o Ricardo. **Destravou sem depender do crédito Higgsfield**: o rosto é uma FOTOGRAFIA real animada, não uma pessoa gerada — em 25/07 ficou medido que geração local acerta o tipo físico e erra a pessoa, e partindo de foto o rosto é ele por construção. Pipeline todo local, custo zero: `foto → BiRefNet (recorte) → cena da marca desenhada em PIL → LTX 2.3 i2v → WebM 960 px`. O fundo é **desenhado, não gerado** — a paleta tem que ser exatamente a da página e geração nunca acerta cor de marca na mosca. ⚠️ Duas armadilhas novas: (a) a MASK do BiRefNet marca o **fundo**, sem `InvertMask` o recorte sai ao contrário; (b) pedir "radar sweep line turning" + "camera push in" fez o LTX ler a linha fina como rastro de luz e o fundo virou um emaranhado de fitas douradas do frame 60 em diante — câmera travada e "light trails/streaks/ribbons" no negativo resolveram. Verificado: rosto idêntico do frame 0 ao 120, **101 KB** (teto é 400 KB), toca só quando entra na tela, `prefers-reduced-motion` deixa parado. | ✅ no ar | eu |
| R10 | **Cruzamento assunto ↔ região no nível Brasil casa pouco** (7 de 22). Não é bug: o feed nacional do Google traz assuntos que simplesmente não aparecem nos feeds regionais. Casar por palavra já melhorou de 4 para 7. Ideia futura: cruzar também pela manchete, não só pelo título. | aberta, limitação de dado | eu |
| R8 | ~~Nada disso foi deployado~~ **DEPLOYADO 26/07**, a seu pedido — três commits: `503589d` (Radar + logo 3D), `aeb9683` (canonical de /radar e /arcade + sitemap), `b4f6533` (filtro de português), `12fe51c` (R6). Verificado **em produção**, não só local: globo desenha, navegação por região voa e troca os dados, logo 3D monta no hover e recolhe ao sair, assets `.glb`/`.svg` servidos, zero erro de console. **Google não bloqueia os IPs da Netlify** — era o maior risco e caiu por medição: `/api/radar/mundo` responde `live` em 742 ms no Brasil, 1,3 s no mundo, e `/api/radar` em ~2 s, todos muito abaixo do limite de 10 s da função. | ✅ no ar | eu |
| R12 | **Achado durante a verificação do deploy:** `/arcade` estava **sem canonical próprio desde 19/07**, herdando `/${locale}` do layout — ou seja, se declarando cópia da home, o mesmo defeito que manteve as 19 matérias fora do índice até 21/07. Varredura das rotas públicas: era a única ainda assim. Corrigido junto com `/radar`, as duas agora passam por `generatePageMetadata` (que emite também os `hreflang`) e entraram no sitemap. | ✅ | eu |

---

## ⏩ SESSÃO 26/07 (parte 2) — RADAR FAYAI: O GLOBO DE VERDADE (Opus 5)

Ricardo reprovou o globo da v1 ("não ficou bom… uma única rotação para um eixo, deixa bem monótono") e pediu a reconstrução. **Está no ar localmente e funcionando ponta a ponta** — verificado no build de produção.

**O que mudou:**
- **Nome:** RADAR DA IA → **RADAR FAYAI** (licença poética para dar a informação mais precisa que conseguirmos).
- **Duas abas** abaixo do nome: **World Trend** (o que está em alta de verdade, qualquer assunto) e **IA Trend** (o recorte de IA, que era a v1 inteira). A ordem é essa de propósito: quem chega vê o mundo real primeiro, e o recorte de IA é o passo natural de quem já está num site de IA.
- **O globo é a Terra**, com mapa político: no mundo, países; no Brasil, as 5 regiões do IBGE em cores da paleta; dentro de uma região, os estados dela. Clicar voa até lá com **easing bezier e arco** — a câmera sobe no meio do caminho, e quanto mais longe o destino, mais alto o arco.
- **A deriva parada não é rotação em um eixo:** dois senos de períodos que não fecham entre si mais uma respiração de altitude, então o movimento nunca repete o mesmo quadro. Controles **+/−** e arrastar para girar.
- **`showGraticules` + casca wireframe** entram ao trocar para IA Trend, crescendo de dentro para fora.
- **"Temos curso" saiu.** Era falso — não existe curso de IA para advogados — e frustração custa mais que a visita. No lugar, uma **ponte escrita à mão por nicho** dizendo o que temos, o que **não** temos e por que ainda ajuda. Ex.: advogados → "não existe curso de IA jurídica no catálogo, e não vamos fingir que existe; o que existe é o domínio do ChatGPT e da escrita de prompt". Criadores → Banana Dev tem mais conteúdo de criador do que o nome entrega, e falta cobrir mais ferramentas ("limitação nossa, não sua").
- **Filtro de português:** termos que voltam em espanhol/inglês (`automatizar con ia gratis`) são descartados por lista de palavras que não existem em português — nunca por acento, porque brasileiro digita sem acento.

**Fontes novas do World Trend (gratuitas, com link para a origem):**
- **Google Trends RSS** — verificado nos **27 estados** (`BR-SP`, `BR-BA`…) e em 16 países. Traz volume aproximado, a manchete que explica o assunto e o veículo. Região do Brasil não tem geo própria: é medida **agregando os estados** que a compõem.
- **Wikipedia most-read** — o que o idioma inteiro está lendo, com contagem real de visitas, no degrau de país.
- Isto reabre o veredito do FLUXO_02, que tinha descartado o Google Trends por ser "dominado por futebol e celebridade": para o **World Trend** é exatamente isso que se quer.

**Dados geográficos:** `scripts/radar-geo.py` baixa Natural Earth (domínio público) + malhas do IBGE, poda propriedades e simplifica por Douglas-Peucker escrito à mão. **845 KB → 121 KB**, contorno conferido visualmente antes de usar.

**⚠️ As três armadilhas que custaram a maior parte da sessão — leia antes de mexer no Radar:**
1. **`r3f-globe` e `three-globe` não renderizam neste projeto.** Montam sem erro nenhum, com props mínimas, por `<primitive>` e por `scene.add`, com cor berrante — e não desenham nada, numa cena onde uma esfera comum aparece normalmente. **O globo hoje é geometria própria:** esfera + fronteiras do GeoJSON viradas em `lineLoop`. Hover e clique por **raycast na esfera → lat/lng → ponto-em-polígono**, que é mais estável do que tentar acertar uma linha de 1px.
2. **O `src/proxy.ts` não excluía `.json`** do matcher, então qualquer JSON estático em `public/` voltava 404. Corrigido (rotas de API não terminam em `.json`, então não desprotege nada).
3. **O Turbopack em dev serviu build antigo por horas**, inclusive depois de reiniciar o servidor — o cache em `.next` sobrevive ao restart, e edição por script não acorda o watcher no Windows. O sintoma é *hydration mismatch* e efeitos que parecem não rodar. **Regra: depois de editar por script, `rm -rf .next` + reiniciar; e valide no build (`npm run build` + porta 3002), não no dev.**

**Correção depois do seu olho (26/07):** você disse que "tudo está invertido… para onde quer que mexa, ele vai pro lado oposto" — e estava certo. Eu usei `theta = 90 + lng` na conversão de coordenadas; a convenção de globo é `90 − lng`. Isso **espelhava o planeta inteiro** no eixo leste-oeste e fazia o arrasto responder ao contrário. Corrigido nos três lugares que precisam concordar (pontos, câmera e a inversa do raycast). Verificado: Norte à esquerda, Nordeste à direita, Sul embaixo, e arrastar para a direita move o globo para a direita.

**Também nesta rodada:** as regiões deixaram de ser só contorno e ganharam **preenchimento** (`ShapeUtils.triangulateShape` + uma subdivisão antes de projetar, senão o triângulo vira corda reta e afunda no planeta). Agora é mapa político de verdade.

**Estado:** `tsc --noEmit` limpo, `npm run build` passando, testado no build — globo desenha na orientação certa, regiões preenchidas, hover identifica a região, clique voa e o painel troca para o trending daquele lugar (medido "45.000+ buscas" no Norte). **Nada é ✅ até você ver.**

**Terceira rodada, também a pedido seu:**
- **Associação mapa ↔ palavra, nos dois sentidos.** O hover subiu do globo para a seção: passar o mouse numa região acende o nome na **faixa de lugares** (novo), e passar o mouse no nome acende a região no globo. A faixa também dá navegação por teclado e serve a quem não consegue mirar um estado com o mouse.
- **Siglas dos estados** projetadas em HTML por cima do canvas (`useFrame` só escreve `transform`/`opacity` em nós que já existem). Discretas — 42% de opacidade, 100% no destaque — e somem quando estão do outro lado do planeta. Só aparecem dentro de uma região: 173 rótulos no mundo inteiro viram sujeira.
- **Página dedicada `/radar`** (`src/components/radar/RadarPagina.tsx`), com o globo grande, ranking completo com contexto e veículo, **comparação das 5 regiões** por volume somado (medido: Nordeste 147.000, Norte 98.200, CO 79.900, SE 31.100, S 6.800), a **leitura de canal do IA Trend** (Google+YouTube / só YouTube / só Google) e uma seção de **metodologia** dizendo o que medimos e o que não fazemos. A home ganhou o link "abrir o radar completo" e **não perdeu nada**.

**Quarta rodada — travamento e ícones:**

- **O travamento que você sentiu era real, e a culpa era minha.** Duas causas: (a) o globo refazia raycast + ponto-em-polígono contra **todos** os polígonos a cada quadro — no degrau do mundo são 173 países percorridos ponto a ponto, 160 vezes por segundo; (b) ele continuava renderizando depois que você rolava para longe. Corrigido com **caixa envolvente por anel** (descarta quase tudo com quatro comparações), **raycast só quando o ponteiro se move**, e **pausa fora da viewport** via IntersectionObserver. Medido depois: scroll a 160 fps de média, pior quadro 143 fps, e a troca de região com pior quadro de **17 ms** — sem engasgo perceptível.
- **Ícones 3D, não imagens.** Você repensou e pediu ícone 3D acima do que existe, em vez de mais arte competindo com o mapa — e é a decisão certa. Cada lugar com sinal ganhou um **marcador de geometria própria**: haste + anel girando (a varredura, que é o que dá cara de radar) + núcleo que pulsa no destaque. A **altura é o volume medido**, então dá para ver de relance onde está acontecendo sem clicar em nada. Custo: zero crédito, zero download, alguns kilobytes.

**Sobre gerar os ícones no ComfyUI — a resposta honesta:** o ComfyUI gera **imagem 2D**. Ícone 3D de verdade (malha) precisaria de Hunyuan3D/TripoSG, que **não estão instalados** e o disco está a 94%. O `generate_3d` do Higgsfield (imagem → GLB) faria, mas depende de crédito. Por isso a escolha foi geometria nativa: é 3D real, gira, pega luz e reage ao hover. O ComfyUI continua útil aqui se quisermos depois um acabamento mais "cartoon premium" — gerar *matcaps*/texturas para os marcadores, o que é barato e local.

**Quinta rodada — as arestas que você apontou no print:**
- **Os marcadores 3D estavam gigantes no zoom** (o print do Maranhão mostrava anéis cobrindo o mapa). Causa: tamanho fixo em unidades do mundo. Agora têm **tamanho angular constante** — ocupam o mesmo espaço na tela de longe e de perto — e ficaram bem menores: discretos por padrão, presentes só no destaque. O anel também só varre quando aceso; movimento perpétuo em 27 estados cansa a vista.
- **"Não fica onde largamos" era bug de verdade.** A deriva usava o valor absoluto do seno, então ao soltar o globo pulava até 8° de uma vez. Agora a deriva é medida como **diferença desde o instante do release** — no momento em que você solta, o deslocamento é zero e cresce suavemente a partir dali.
- **A associação que faltava — trend ↔ lugar, nos dois sentidos.** Era o motivo do mapa existir, e você tinha razão que faltava. O servidor passou a registrar, para cada assunto agregado numa região, **em quais estados ele apareceu**. Agora passar o mouse num assunto acende exatamente esses estados no mapa (verificado: "Athletico-PR × Internacional" acende PB, PI e SE), e passar o mouse num estado apaga os assuntos que não são de lá. Cada linha também mostra as siglas.
- **Cores com variação sutil por estado** — desvio determinístico de ±13% de luminosidade sobre a cor da região. Dá textura e tira o chapado sem a região perder unidade.

**Sexta rodada — o mapa deixou de esconder o país:**
- **O contexto não some mais.** Ao focar numa região, o Brasil inteiro continua desenhado, só que apagado (7% de opacidade na face, 22% no contorno), e a região em foco **sobe** — extrude animado de verdade, com o destaque subindo ainda mais. Era o ponto do seu pedido: dá para ver que um assunto também acontece no Sul sem precisar navegar até lá.
- **Cor com variação mais perceptível**: o desvio de luminosidade dobrou (±26%) e ganhou um giro pequeno de matiz. Dois estados podem ter a mesma luz e ainda assim se distinguir, sem a região perder unidade.
- **A malha do IA Trend virou meridianos e paralelos.** O icosaedro dava triângulos grandes atravessando o planeta e lia como "poliedro flutuando". Agora é uma grade que segue a geometria do globo, com um pulso suave percorrendo as linhas — a metáfora certa de camada de dados sobre a Terra.
- **A relação assunto ↔ mapa agora também existe na página `/radar`**, que só tinha na home.

**Sétima rodada — os bugs que o Ricardo caçou usando:**
- **"Mundo" dizia "Sem sinal".** Bug real: a raiz não tem geo própria no Google Trends e eu nunca tratei o caso. Agora o mundo é a **soma dos países medidos**, ordenado por *em quantos países o assunto aparece* — o que é uma leitura melhor que volume nesse degrau ("em 2 países · CA AU").
- **O extrude ia se afastando a cada ida e volta.** A elevação vivia em `userData` do grupo e a chave do React era o índice — ao trocar de degrau, um grupo reaproveitado herdava a altura do anterior e ia somando. Chave estável por identidade da feição + reset do estado quando o conjunto muda.
- **Enquadramento**: as regiões estavam quase saindo da tela. Centros e altitudes recalibrados, mais perto e mais centrado.
- **Bullet time**: a viagem ficou deliberadamente mais lenta (1,5 s + distância, teto de 3,4 s) e com arco mais alto. O que se ganha não é tempo, é a leitura do caminho.
- **Malha do IA Trend menor e mais fina** — raio de 1,035 para 1,012 do globo, linhas a cada 10° e opacidade quase pela metade.
- **Página `/radar` ganhou os rótulos** "World Trend" e "IA Trend" — sem eles a página parecia não ter as duas leituras, só seções soltas.
- **Hover no nível Brasil**: agora o servidor cruza os assuntos nacionais com as cinco regiões. ⚠️ Casa 7 de 22 — ver R10, é limitação do dado, não do código.

**Oitava rodada — imersão:**
- **As siglas "descolavam" dos estados** porque `useFrame` executa na ordem de montagem e a câmera era o **último** componente: os rótulos projetavam com a câmera do quadro anterior. A câmera passou a ser o primeiro. Bug de uma linha, sintoma que parecia erro de posicionamento.
- **Viagem em três fases.** Ir de uma região para a irmã era um zoom lateral — a nova chegava grande demais e fora de centro. Agora o alvo carrega um `pico`: trocar de região passa por uma vista do Brasil, trocar de estado passa por uma da região. Sobe, atravessa, desce.
- **Drift reduzido a um terço** — com o modal aberto, quadro que vagueia atrapalha a leitura.
- **Siglas também no nível Brasil** (N/NE/SE/S/CO), sumindo ao entrar numa região, onde as siglas dos estados assumem.
- **Modal do assunto dentro do mapa** (`components/radar/ModalAssunto.tsx`), nas duas telas. Clicar num assunto **não joga mais o visitante direto para fora**: primeiro mostramos o que medimos — o volume em corpo grande, **a janela que faltava** ("últimas 24h" para busca, "ontem, dia fechado" para leitura), a manchete e onde foi medido — e a fonte vira uma escolha clara. Quem quer o atalho continua tendo a setinha na linha. O mapa aproxima enquanto o modal está aberto.

**Nona rodada — o painel virou HUD de transmissão.** O Ricardo pediu que o detalhe não fosse um modal por cima, e sim uma peça inserida no mapa, estilo transmissão de F1: a região se desloca e o painel entra no espaço que sobrou.

- **O deslocamento é feito no FRUSTUM da câmera** (`setViewOffset`), não movendo ou encolhendo objeto nenhum. A região sai do centro para cima e para a esquerda sem ser escalada, distorcida ou recortada — é o que mantém o mapa "em foco" enquanto o painel ocupa o canto inferior direito. Animado, e desfeito ao fechar.
- **Nada de cortina escura.** Um véu por cima mataria a ideia. O escurecimento é um gradiente **diagonal** que só existe atrás do painel; o mapa continua legível do outro lado.
- **Perspectiva de verdade, sutil**: `rotateY(-9°) rotateX(3°) translateZ(24px)` com origem no canto — o painel pertence ao espaço 3D em vez de parecer cartão colado. Canto chanfrado por `clip-path`, borda-guia na cor do lugar, trilhos de varredura a 13% e um brilho que percorre a placa a cada 3,2 s.
- **O número é o herói**: 34px, tabular, com halo na cor do lugar e a janela logo abaixo.
- `prefers-reduced-motion` desliga entrada, véu e varredura.

**Décima rodada — o painel ganhou vida própria** (`components/radar/usePainelAssunto.ts`). O Ricardo notou que o painel anterior ficava preso até alguém fechar. Agora ele responde ao hover, mas com três freios que resolvem problemas diferentes:

| Tempo | Para quê |
|---|---|
| **250 ms** para abrir | filtra o mouse que só está de passagem pela lista |
| **2 s de aviso** antes de trocar | o painel atual **pisca** quando outro pede a vez: quem passou sem querer volta a tempo, quem quis trocar vê que foi entendido |
| **9 s de permanência** | tempo de leitura sem precisar fechar nada — com um fio fino correndo no topo, que mostra o prazo |

**Duas formas de dizer "quero manter":** clicar no assunto (intenção explícita) ou o **alfinete** no painel. Fixado, nenhum tempo corre e o fio some — o retorno visual de que funcionou. A saída usa o caminho inverso da entrada, com a mesma curva.

**Mais perspectiva**, também a pedido: `perspective` encurtada para 760px com origem deslocada e `rotateY(-17°) rotateX(6°) translateZ(36px)`. A borda esquerda recua de verdade em vez de sugerir profundidade.

Verificado no build, estado por estado: nada antes dos 250 ms → ativo → **piscando** ao pedir a vez, ainda mostrando o anterior → troca aos 2 s. Com o alfinete, o hover em outro item não troca nada.

**Décima primeira rodada — cada assunto virou uma peça própria.** O Ricardo notou que trocar entre cards fixados mudava o conteúdo dentro da mesma placa, sem saída nem entrada: "tira o senso de unicidade de cada um".

- **A troca agora passa pela desmontagem.** O painel atual sai pelo seu próprio gesto e só então o novo se monta — vale tanto para clique quanto para a troca por hover.
- **Cinco gestos, sorteados sem repetir o anterior:** (0) **desmonta** — as peças internas saem em cascata invertida e entram em cascata direta; (1) **desliza** de baixo com profundidade; (2) **desvanece** com desfoque; (3) **dobra** no eixo X, como placa física; (4) **corta** — a placa se revela e se recolhe por uma fresta (`clip-path`). Cinco porque, com um só, a interface vira "lista com efeito"; variando, mexer no radar vira algo que se faz por gosto.
- **O flicker deixou de parecer glitch.** Virou **interferência de sinal**: a placa recua no eixo Z, ganha saturação e um `skew` mínimo por dois pulsos. Lê como HUD perdendo sintonia — intencional —, não como falha de render.
- `prefers-reduced-motion` desliga todos os cinco.

Verificado no build: cinco cliques seguidos passaram pela saída antes de montar o novo, com três variantes distintas e nenhuma repetida em sequência.

**O que ficou de fora do seu pedido e continua na fila:** ver a tabela de **pendências abertas** no topo deste documento (R1 a R10). Ordem combinada com o Ricardo: **terminar o polimento → ícones 3D (R2) → vídeos (R9)**.

---

## ⏩ SESSÃO 26/07 — RADAR DA IA NA HOME (Opus 5)

Ricardo escolheu esta frente sabendo da ressalva: **é escopo novo, fora da ordem das fases.** Fica registrado assim — não foi descuido da regra, foi decisão dele.

**O que é:** a home passou a mostrar, entre o Arcade e os cursos, o que o Brasil está realmente procurando sobre IA — medido, não opinado. Fonte: autocomplete do Google e do YouTube, que devolve o que as pessoas digitaram, ordenado por frequência e recência. Zero API key, zero custo por consulta.

**Por que isto é o diferencial e não mais uma seção:** é o único bloco da home que mostra **dado medido em vez de promessa**, e é dado que ninguém publica de graça. Ele também ataca a lacuna achada no FLUXO_02 — o catálogo é organizado por **ferramenta** (ChatGPT, n8n, Midjourney) e a busca brasileira é organizada por **profissão** ("para advogados", "para concurso"). Os 10 nichos da seção são profissões, e cada termo aponta para o curso que já existe.

**As três fontes são combináveis e mudam a NOTA, não só o filtro** — é a regra de três sinais virando controle na mão do visitante. Desligar o YouTube tira o peso 1,2× e o bônus de 1,6× da confirmação em dois canais, exatamente como o `radar.py` faria se tivesse consultado um canal só. A terceira fonte cruza com as manchetes do dia (as mesmas do IA Hoje) e vale 1,35×.

**Achado que a própria seção expõe, medido hoje:** nos nichos profissionais (advogados, médicos, professores) a demanda é quase toda **só do YouTube** — gente procurando VÍDEO sobre isso, onde um canal ganha antes de o site ranquear. Com o Google desligado, o topo de "Automação" vira `agentes de ia n8n`, que é demanda de vídeo explícita por um curso que já existe aqui (R$199) e que não tem um vídeo nosso.

**Correção de honestidade feita no caminho:** a primeira medição colocava o termo-semente em 1º com nota máxima nos 10 nichos — mas isso é artefato de termos digitado a pergunta, não demanda medida. As consultas próprias agora saem do ranking, nos dois lados (site e `radar.py` continuam com a mesma fórmula no resto). Um radar que devolve a própria pergunta não está medindo nada.

**Arquivos:**
- `src/lib/radar.ts` — coleta e pontuação (porte fiel do `PRODUCAO/scripts/radar.py`, que segue sendo a fonte de verdade da fórmula)
- `src/data/landing/radar-nichos.ts` — os 10 nichos + tipos (fora do `lib/` para não arrastar o código de servidor para o bundle do cliente)
- `src/data/landing/radar-seed.json` — snapshot real de 26/07, 10 nichos × 10 termos (26 KB). Regerar com `npm run radar:seed`
- `src/app/api/radar/route.ts` — medição ao vivo, cache 6h em memória, degrada para o snapshot
- `src/components/landing/RadarSection.tsx` + `src/components/3d/RadarGlobe.tsx`

**Robustez (§5 do IDENTIDADE_VISUAL):** o snapshot pinta primeiro e a medição ao vivo entra por cima — a lista nunca depende da rede. O globo é decoração: só monta quando a seção entra na tela, e `prefers-reduced-motion` para a rotação sem esconder nada.

**Ressalva honesta (§1):** verificado no navegador com dado real — troca de nicho, as três fontes combinando, globo montando, sem erro de console, sem estouro horizontal no mobile, `tsc --noEmit` limpo. **Nada disso é ✅ até você ver e dizer.** Duas coisas que só você decide: (a) o termo `automatizar con ia gratis` aparece com "con" espanholado — é o que o autocomplete devolve de verdade, mantive por honestidade, mas numa página brasileira parece erro nosso; (b) a seção fica antes dos cursos, apostando que estabelecer a demanda antes de oferecer a resposta converte melhor — é hipótese, não medição.

---

## ⏩ SESSÃO 25/07 — STACK DE MÍDIA LOCAL REARMADO (Opus 5)

Ricardo pediu para atualizar a skill do ComfyUI usando o que há de melhor na atualização que saiu, e para termos à mão áudio/música, edição de vídeo e consistência de personagem — servindo tanto o fayai.com.br quanto a worldforge. Pesquisa profunda feita: instalação local auditada nó a nó (812 tipos), changelog oficial v0.20→v0.28 destrinchado, templates oficiais extraídos, comparativos independentes de modelos lidos.

**O achado que muda o jogo: o problema nunca foi falta de ferramenta — era falta de mapa.** A máquina tem, **instalados e funcionais**, cinco coisas que nenhuma documentação nossa mencionava e que portanto nunca foram usadas:

| Instalado, nunca usado | O que faz |
|---|---|
| **ACE-Step 1.5 XL Turbo** | música completa com letra em pt-BR, 8 passos (estava na pasta legada `unet/`, por isso invisível nas listagens) |
| **Stable Audio 3 Medium** | SFX, foley, ambiência, one-shots |
| **SAM 3.1** | segmentação promptável por texto + **rastreamento de objetos em vídeo** |
| **HiDream O1** | imagem 2048² com texto legível (o ponto fraco histórico de todos os outros — a armadilha do "seal/badge" de 17/07) |
| **IC-LoRA Ingredients (LTX 2.3)** | **consistência de personagem/adereço/cenário dentro de um vídeo gerado** |

Ou seja: **trilha própria, sound design de verdade e consistência de personagem em vídeo estão a zero download de distância.** Hoje o `compose_reel_v7.py` sintetiza SFX com ondas senoidais no FFmpeg.

**Além disso, o ComfyUI 0.28 trouxe uma categoria inteira que não existia: pós-produção nativa.** SeedVR2 (restauração/upscale com consistência temporal), RIFE/FILM (interpolação de frames), BiRefNet (remoção de fundo), VOID (inpainting de vídeo), Depth Anything 3, `LTXVContextWindows` (vídeo longo e loop fechado) e — o mais estratégico — **treinador de LoRA nativo**, que aposenta o plano antigo de instalar AI-Toolkit/Kohya.

**Entregue nesta sessão (documentação e ferramental, sem tocar no site):**
- **`PESQUISA_COMFYUI_2026-07-25.md`** (raiz do autoresearch) — dossiê completo; supersede o de 12/07, que ficou marcado como histórico.
- **3 skills novas:** `comfy-audio` (música/SFX/TTS), `comfy-video` (geração + pós-produção), `comfy-character` (consistência em 4 níveis + treino de LoRA).
- **`comfy-local` atualizada** — versão certa (0.28.3), inventário real de modelos (o antigo estava errado: listava Flux 2 Klein no lugar errado e omitia 10 modelos), os dois diretórios-raiz de modelos, e duas descobertas que economizam tempo: os **templates oficiais são servidos localmente** em `http://localhost:8000/templates/` com as URLs de download embutidas em cada um, e a **armadilha dos subgraphs** (templates de 2026 embrulham o grafo real num nó com `class_type` UUID — o JSON não é mais submissível direto como formato de API; o grafo verdadeiro está em `definitions.subgraphs`).
- **`comfy-fayai` atualizada** com a tabela de quatro gambiarras do pipeline de reels que agora têm substituto nativo — com a instrução explícita de trocar **uma de cada vez**, comparando a saída.

**⚠️ Restrição real que limita tudo:** o disco `C:` está a **94% (≈200 GB livres)**, com 434 GB só em modelos. Nada foi baixado — a decisão é sua. Os 4 downloads de melhor retorno somam **~6 GB**: RIFE+FILM (~100 MB, o melhor custo-benefício da lista inteira — elimina a gambiarra de ping-pong dos reels e dobra a duração útil dos clipes LTX), BiRefNet (~1 GB, destrava as camadas transparentes da Liga A sem rembg manual), SeedVR2 3B int8 (~4 GB, qualidade final), Depth Anything 3 small (~1 GB).

**Honestidade sobre o que isto é (§1):** tudo marcado como instalado foi **verificado** via `/object_info` e listagem em disco. Mas **nenhum dos fluxos novos foi executado** — as cadeias de nós vêm dos templates oficiais, não de uma geração real nesta máquina. Nada disso é ✅ até rodar e você ver.

**Piloto proposto (não iniciado, custo zero, nenhum download):** uma trilha ACE-Step de 30 s + três SFX do Stable Audio 3 (acerto / erro / fim de tempo do Arcade). É o teste mais barato e mais audível do que foi destravado. Encaixa direto na pendência aberta em 24/07 de regerar as artes do Arcade refletindo os verbos novos.

### FASE 11 — STACK DE MÍDIA (nova, planejada 25/07; ordem por retorno, não por vontade)
- [~] 11.1 **Piloto de áudio — EXECUTADO 25/07.** Trilha de 30 s do Arcade (ACE-Step 1.5 XL Turbo, 8 passos/cfg 1/euler) em ~35 s; 4 SFX (acerto/erro/fim-de-tempo/combo, Stable Audio 3) em **11 s no total**. Verificados com `volumedetect` (conteúdo real, não silêncio). ⚠️ A trilha tem `max_volume 0.0 dB` — normalizar antes de usar no mix. **Aceite: Ricardo ouve e diz se substitui as senoides do `compose_reel_v7.py`.**
  - Armadilha: o checkpoint do Stable Audio 3 **não traz CLIP embutido** — precisa de `CLIPLoader("t5gemma_b_b_ul2", type="stable_audio")` à parte, senão dá "clip input is invalid: None". E o nosso `stable_audio_3_medium` é o **destilado**: 8 passos/cfg 1/lcm (o template `_base` usa 50/7 e é outro arquivo).
- [x] 11.2 **Kit baixado 25/07 (4,8 GB):** RIFE 4.26 + FILM (88 MB), BiRefNet (424 MB), SeedVR2 3B int8 + VAE (3,8 GB), Depth Anything 3 base (517 MB). Ricardo autorizou e vai liberar ~1 TB depois.
- [ ] 11.3 **RIFE no pipeline de reels**: substituir ping-pong por interpolação 2× em UM reel, comparar lado a lado com o v7 atual. Aceite: você aponta qual dos dois é melhor.
- [ ] 11.4 **BiRefNet → camadas Liga A**: gerar 1 arte do site em camadas com alpha e animar com Framer Motion (piloto de 1 seção).
- [ ] 11.5 **Artes do Arcade regeradas** com os verbos novos (pendência aberta em 24/07) + SFX do 11.1.
- [ ] 11.6 **worldforge — consistência de personagem**: retrato mestre → folha de 360° → folha de referência IC-LoRA → 1 clipe. Executável hoje, sem download e sem treino. Aceite: o mesmo personagem reconhecível em 3 clipes diferentes.
- [~] 11.7 **LoRA do Ricardo — EM ANDAMENTO 25/07** (ele pediu, para usar no site). Dataset dele: 40 fotos reais em `LORA/Ricardo_Faya` (as mesmas do LoRA que ele fez no Higgsfield).
  - **Veredito medido sobre consistência SEM treino:** Qwen Edit 2511 com referência acerta o *tipo* (barba, cavanhaque, estrutura) mas **não a pessoa** — rosto sai mais jovem e magro, grisalho some. Em 40 passos sem Lightning (8,5 min/imagem, 15× mais caro) melhora a luz e recupera o grisalho, mas ainda não é ele. **Confirma que LoRA é necessário para pessoa real.**
  - **Preparo do dataset (armadilhas achadas):** **29 das 40 fotos estavam com rotação EXIF não aplicada** (treinariam rostos deitados). Curadoria 42→22: fora fotos com outras pessoas, óculos escuros, rostos minúsculos, 1 imagem gerada por IA, e as de 2018 (visual muito diferente = deriva). Recorte de cabeça com **SAM 3.1** — 22/22 detecções em 48 s, promptável por texto.
  - **3 armadilhas de VRAM no treinador nativo (16 GB), todas gravadas na skill `comfy-character`:** (a) o text encoder de 7,5 GB fica **residente** após `MakeTrainingDataset` → separar em 2 estágios com `SaveTrainingDataset`/`LoadTrainingDataset`; (b) **só `bypass_mode=True` faz o treino rodar** — testei a matriz (offloading on/off, com/sem gradient checkpointing): tudo estourava, inclusive com 4 imagens de 256px e rank 8 com 15,8 GB livres; (c) `checkpoint_depth` **1 é o mais agressivo**, não 5.
  - **Armadilha de processo (custou 81 min):** treino de 500 passos rodou 81 minutos e estourou perto do fim (fragmentação), e como `SaveLoRA` fica **depois** do `TrainLoraNode`, perdeu tudo. Agora treina em **blocos curtos com retomada via `existing_lora`**, salvando a cada bloco.
  - **Base escolhida: Z-Image bf16 carregado em fp8.** Qwen Image 2512 fp8 tem 20 GB e **não cabe** para treino em 16 GB.
  - **[✗] VEREDITO 25/07: treino de LoRA de rosto NÃO é viável nesta máquina.** Medições reais:

    | Configuração (22 imgs, rank 24) | Resultado |
    |---|---|
    | 512px, offloading ON | rodou 81 min → OOM (perdeu tudo) |
    | 512px, offloading OFF | OOM imediato |
    | 384px, offloading ON | ✅ **47 s/passagem** |
    | 384px, offloading OFF | ✅ **31 s/passagem** |
    | 384px, bf16 sem offloading | **travou o ComfyUI** (Ricardo teve que reiniciar) |

    Melhor caso viável: 384px a 31 s/passagem = **4h20 para 500 passagens, 13h para 1500**. E 384px é justamente a resolução que perde pele/barba — o detalhe que faria parecer ele. **Decisão: o rosto do Ricardo vem do LoRA que ele já tem no Higgsfield.** Não vale queimar uma noite de GPU, com risco de travar de novo, para um resultado provavelmente pior.
  - **O que ficou aproveitável:** dataset curado, EXIF corrigido, recortado em 1024² e legendado, em `LORA/Ricardo_Faya/_dataset/crops` (22 imagens) — serve para retreinar no Higgsfield ou aqui quando houver hardware. Cache codificado em `output/ds_lora_ricardo`, dataset de treino em `input/lora_ricardo`.
  - **Onde o treino local AINDA faz sentido:** personagem estilizado/fictício da worldforge em resolução menor, onde 384px não é penalidade e o rosto não precisa passar no teste de "é uma pessoa que eu conheço".
- [ ] 11.7b Comparar com os vídeos/LoRA que o Ricardo já fez no Higgsfield (ele vai indicar o caminho) — régua de qualidade + frames de perfil, que faltam no dataset atual (as 22 fotos são quase todas frontais).
- [ ] 11.8 (opcional) Avaliar TTS local (`Qwen3-TTS` ou `TTS-Audio-Suite`) **só para vozes de personagem da worldforge** — a narração comercial continua na ElevenLabs, já calibrada em pt-BR. Custom node + pesos + disputa de VRAM: perguntar antes de instalar.
- Regra: 11.1 antes de 11.2 (provar valor antes de gastar disco). Nenhum item toca produção sem piloto aprovado.

---

## ⏩ SESSÃO 24/07 — ARCADE REDESENHADO (Opus 5)

Ricardo deu 3 dias de espaço e pediu o trabalho mais difícil: repensar o design da home e **principalmente** os minigames, "tornando-os mais parecidos com um game do que um quiz, e que haja maior diferenciação entre eles".

**Diagnóstico (o problema era estrutural, não cosmético):** os 5 jogos eram **o mesmo jogo com pele diferente**. Todos rodavam `useRotatingDeck → mostra card → clica opção → lê explicação → "Próxima" → placar N/10 + confete`. Nenhum tinha tempo, risco, gesto, combo ou progressão — os quatro ingredientes que separam um jogo de um formulário. Pior: a descrição do Caça ao Prompt **prometia "escolha e arraste peças"** enquanto o código era uma fileira de `<button onClick={toggle}>` — nada arrastava.

**A solução: cada jogo ganhou um VERBO motor próprio.** O verbo é a diferenciação — é o que a mão faz, e é o que faz lembrar de um jogo e não do outro.

| Jogo | Verbo | O que mudou |
|---|---|---|
| Verdade ou Mito | **DESLIZAR** | Pilha de cartas com swipe (arrasta pra direita = verdade). 60s no relógio em vez de 10 cartas fixas — a pergunta virou "quantas dá pra fazer". Combo multiplica pontos (×2 aos 3 acertos, ×4 aos 9); acerto devolve 1s, erro custa 3s. As explicações dos **erros** são reunidas na tela final: revisar erro ensina mais e não quebra o ritmo da corrida. |
| Batalha de Prompts | **APOSTAR** | Banca de 500 fichas. Antes de apontar o vencedor você decide quanto arriscar (25%/50%/tudo). Dobra ou perde; zerar encerra. Troca a pergunta "qual é o melhor?" por "**o quanto eu confio na minha leitura?**" — que é a que de fato ensina a avaliar prompt. |
| Qual Prompt Gerou Isto? | **DEDUZIR** | A imagem entra borrada (34px) e vai focando em 14s. Os pontos caem junto: 240 no escuro, 40 com tudo nítido. A dica só aparece na **metade** do tempo — mostrá-la antes entregaria a resposta e mataria a decisão de arriscar cedo. |
| Caça ao Prompt | **MONTAR** | Drag & drop de verdade — cumpre a promessa que o texto fazia há meses. Clique e teclado seguem funcionando (acessibilidade e `prefers-reduced-motion`). Cronômetro aqui **não pune**, vira bônus de velocidade: punir tempo num jogo de leitura cuidadosa empurraria para o chute. |
| Palpite 30s | (inalterado) | Continua sendo o funil de conversão logado. |

**Engine compartilhada** (`src/lib/arcade/engine.ts`): relógio medido por timestamp real (`setInterval` atrasa quando a aba perde prioridade — mediria errado), **pausa quando a aba fica oculta** (senão o jogador volta e já perdeu), combo, recorde local por jogo (`localStorage` — o Arcade é sem cadastro, então o "melhor de todos os tempos" mora no navegador e é o que dá motivo pra jogar de novo), haptics no celular. HUD comum em `games/fx/ArcadeHud.tsx`, tudo respeitando `prefers-reduced-motion`.

**Home:** o Arcade — o ativo mais incomum do site — era um **link de 11px no rodapé**, espremido entre "Ferramentas" e "Projetos". Agora tem vitrine própria (`ArcadeShowcase.tsx`) **antes dos cursos**, porque jogar é o degrau de menor compromisso do funil (zero cadastro, zero real). Cada card anuncia o VERBO em destaque e faz deep-link `?jogo=<id>` caindo direto na partida, sem segunda tela de escolha.

**Verificado no build de produção** (não no dev — ver armadilha abaixo): cronômetro correndo 60→58; acerto dá +100 e +1s; erro tira 3s e zera o combo; aposta all-in levou a banca de 500→1000; desfoque foi de 31,7px→15,0px→3,5px; encaixe de peça atualiza o `aria-label`; os 5 deep-links respondem.

⚠️ **Bug encontrado e corrigido durante o teste:** o desfoque do Qual Prompt usava `animate` do framer-motion e **travava em ~22px** — como o valor muda a cada frame, a transição de 0.15s reiniciava sem nunca alcançar o alvo. Trocado por `style` CSS direto, animado pelo próprio clock em `requestAnimationFrame`. **Só apareceu porque testei de verdade** — typecheck e lint passavam.

⚠️ **Armadilha do Turbopack confirmada de novo** (já documentada em 19/07): o dev server serviu **o código antigo** mesmo após salvar o arquivo — o teste do blur no dev mostrava o bug já corrigido. `npx next build && npx next start` numa porta separada é a fonte da verdade. Nota extra: no browser headless, `.click()` nativo **não dispara** o onClick do React; chamar `props.onClick({})` via `__reactProps` funciona.

**Commit:** `d3c0e24`. **[~] Aguardando validação do Ricardo** (§1 — só ele promove a ✅). Teste de 30s: abrir a home, ver a faixa "JOGUE AGORA" com os verbos, clicar em DESLIZE e jogar 60 segundos.

**Pendente nesta frente:** as artes do Arcade (`ArcadeVisual`) ainda são as antigas, feitas para os jogos-quiz — vale regerar no ComfyUI refletindo os verbos novos (mão deslizando carta, fichas de aposta, imagem focando, peças encaixando). Não fiz para não misturar com a validação da mecânica.

---

## 🔴 LEIA ANTES DE ABRIR QUALQUER SESSÃO — §8 (política de modelo e esforço)
**Cartão de bolso em §8.6.** Escolher o modelo certo ANTES de começar é a diferença entre queimar 20% da cota semanal numa terça e chegar no domingo com folga. Resumo: **Fable decide · Opus constrói · Sonnet mantém · Haiku faz o trivial · sessão nova a cada mudança de assunto.**

---

## ⏩ SESSÃO 20/07 (noite) — COMEÇAR POR AQUI

**Contexto:** Ricardo trouxe 6 frentes: (1) custo do Hermes ($6 num dia após a troca pro Kimi K3), (2) usar a API da assinatura ChatGPT dele, (3) prioridade continua estabilidade do site antes de conteúdo de curso, (4) anúncio do chatgpt-zero na home (R$29 vs. grátis do mês, sem menção) + decisão: cobrar valor simbólico ~R$5, (5) tráfego + delegar Instagram da fayai pra agentes, (6) bug: imagem no Studio cobrada no OpenRouter mas com erro.

**✅ FEITO 20/07:**

1. **Custo do Hermes ESTANCADO** — causa: a troca de 19/07 pôs Kimi K3 (**$3/M in, $15/M out** — preço de modelo topo!) em TUDO que passa pelo kirmes-proxy, inclusive os crons agênticos pesados (TCH worldbuilding 13h, auditoria de cursos 14h — 41 chamadas desde 19/07, quase todas dos crons). Solução deployada e testada na VPS: **proxy com 2 rotas** — `kirmes-proxy` (padrão) agora usa Gemini 3 Flash Preview ($0.50/$3, 5-6x mais barato) com fallback Gemini 2.5 Flash; `kirmes-premium` usa Kimi K3 (fallback na cadeia barata) e SÓ o blog diário (`fayai_news.py`) pede essa rota. Ambas as rotas verificadas com chamadas reais. Estimativa: o mesmo workload de ontem cai de ~$6 pra ~$1/dia. Scripts versionados em `scripts/vps/` (model_proxy.py, fayai_news.py, kirmes-proxy.service com chave redigida). ⚠️ Kimi K3 "pensa" antes de responder — chamadas de teste precisam de max_tokens ≥ 200 ou o content vem vazio.

2. **API da assinatura ChatGPT FUNCIONANDO (custo zero)** — o `~/.codex/auth.json` local estava em `auth_mode: chatgpt` (OAuth da assinatura, de quando Ricardo usava com o OpenClaw). Instalei o Codex CLI (0.144.6) local E na VPS (auth.json copiado — fluxo headless oficial), `codex exec` testado nos dois: responde usando a assinatura, sem tocar em API paga. **Ainda não apontei nenhum cron pra ele** — proposta: migrar a auditoria diária de cursos (o maior consumidor de tokens) de hermes/OpenRouter pra `codex exec`, mas só depois de rodar 1 auditoria comparativa (qualidade do relatório hermes vs codex). ⚠️ Local e VPS compartilham o mesmo refresh token — se um dia a auth quebrar nos dois ao mesmo tempo, refazer `codex login` local e re-copiar o auth.json.

3. **Bug do Studio (cobrado + erro) RESOLVIDO** — causa raiz: **Netlify não tinha NENHUMA env CLOUDINARY_*** — a geração completava no OpenRouter (cobrança real), aí o upload pro Cloudinary explodia → "Erro interno do servidor". Nunca UMA geração de IA tinha sido gravada em produção (imagecreations só tem uploads/mockups até março). Consertado em 2 camadas: (a) as 5 vars CLOUDINARY_* configuradas no Netlify (contexto production), (b) hardening no route: se o upload falhar de novo, o usuário RECEBE a imagem crua (base64) com aviso, em vez de perder a geração paga. Reproduzido antes do fix com a conta QA free (HTTP 500 em prod); pós-deploy verificado — ver bloco de verificação abaixo. Nota: modelo default (Nano Banana) funciona sem `modalities`; teste local direto no OpenRouter gerou imagem ok ($0.039).

4. **Preço honesto do chatgpt-zero** — confirmado o mecanismo: existe **override ativo do Mission Control** (`fayapoint.monthly_offers`, 2026-07) com `freeCourseSlug: chatgpt-zero` — por isso ele é grátis pra qualquer conta, enquanto a home anuncia R$29 (de R$97, -62%). Implementado (código deployado + Atlas): override de julho passou a `freeCourseSlug: null` (agora aceito pelo código como "mês sem curso 100% grátis") **com chatgpt-zero adicionado ao pool beginner** (assinantes explorador+ continuam acessando pelo plano); preço avulso R$5 com `pricing.note` explicando o valor simbólico, exibida no card da home. **Números REAIS do Asaas** (consultados na API da conta): PIX R$1,99 fixo **e os primeiros 100 PIX/mês estão ISENTOS**; boleto R$1,99; cartão 2,99%+R$0,49. Ou seja: o repasse real é ~R$2 (não R$5) — o R$5 se justifica como **valor mínimo de cobrança do Asaas** + custo operacional, e a copy foi escrita assim ("valor simbólico que cobre o processamento"), sem prometer "repasse exato". ⚠️ DECISÃO PENDENTE do Ricardo: validar a copy e o valor (dá pra cobrar R$5 e ser honesto, mas não dá pra cobrar menos que R$5 no Asaas). **Fix adicional (commit ae11db5):** o fallback algorítmico (`computeAlgorithmicOfferSet`) elegia um curso grátis por conta própria enquanto o cache do override aquecia — a página de vendas ainda mostrava "Liberar grátis / R$0" depois do Atlas mudado. Agora o algoritmo NUNCA elege curso 100% grátis (regra de negócio permanente) e a página de vendas mostra "Preço simbólico" + a nota no sidebar (e suprime o ridículo "12x de R$0,42").

5. **Tráfego + Instagram delegado a agentes** — plano registrado como FASE 9 abaixo (não iniciado hoje; bloqueado primeiro em P.1: conectar FB/IG).

**Verificação pós-deploy (commit 05691b4):** ver critérios de aceite no fim do bloco — Studio gerando imagem em prod com conta QA, home mostrando R$5+nota, `/api/courses/monthly-offers` sem freeCourse, página de vendas do chatgpt-zero com CTA de compra (não "Liberar grátis").

## ⏩ SESSÃO 20/07 (parte 2, noite) — 4 vídeos destilados + Hermes no browser + estratégia de modelos

Ricardo trouxe 4 vídeos pra extrair o que serve. Transcripts completos salvos e analisados (yt-dlp, ~108K chars). O que foi FEITO e o que foi REGISTRADO:

**✅ FEITO nesta parte:**

1. **Hermes Dashboard no browser (pedido nº1 do Ricardo)** — o Hermes Agent já traz um dashboard web com aba de CHAT embutida (`hermes dashboard --tui`); estava simplesmente desligado. Criado serviço systemd `hermes-dashboard.service` na VPS: bind APENAS no IP Tailscale (`100.111.28.77:9119`) — inacessível da internet pública, acessível de qualquer aparelho do seu tailnet; sobrevive a reboot (espera o container kirmes subir). **Verificado fim-a-fim do PC do Ricardo: HTTP 200.** → **Acesse: `http://100.111.28.77:9119`** (adicionar aos favoritos). Critério de aceite: abrir no Chrome, ver o dashboard, conversar na aba Chat.

2. **Descoberta importante sobre auth Codex×Hermes**: o código do Hermes mantém sessão OAuth do ChatGPT SEPARADA do Codex CLI de propósito ("prevents refresh token rotation conflicts — one app's refresh invalidates the other's session"). Portanto: (a) NÃO copiar `~/.codex/auth.json` pro auth store do Hermes; (b) o nosso setup local+VPS compartilhando o mesmo auth.json do Codex tem risco teórico do mesmo conflito — se a auth quebrar nos dois, refazer `codex login` local e recopiar.

**✅ CONCLUÍDO 21/07 (madrugada) — Hermes rodando na assinatura ChatGPT:** Ricardo fez o OAuth; Hermes atualizado v0.11.0→v0.19.0 (dashboard ganhou tela de login — user `ricardo`, senha em `/root/hermes_dashboard_senha.txt` na VPS). Depois do OAuth ainda havia um bug: o bloco `model:` custom-endpoint do config.yaml contaminava todos os providers (qualquer chamada saía pro OpenRouter com Bearer VAZIO → "HTTP 401 Missing Authentication header"; flag `--provider` do -z não corrige). Consertado: config.yaml agora declara `provider: openai-codex / model: gpt-5.6-sol` como default (chat Telegram+dashboard = assinatura, custo zero — verificado: "Sou o GPT-5.6-sol"), crons pinados explicitamente no proxy barato via `docker exec -e OPENROUTER_BASE_URL=http://127.0.0.1:7860/v1 -e OPENROUTER_API_KEY=kirmes-local ... -m kirmes-proxy --provider openrouter` (verificado no journal do proxy), e `fallback_providers` aponta pro proxy (se a assinatura der 429, degrada pro Gemini Flash em vez de morrer). Backups: config.yaml.bak_20260720_model, *.sh.bak_20260721, container antigo kirmes_old_0110.

**⏳ PASSO DO RICARDO (histórico — já feito em 21/07):** plugar sua assinatura ChatGPT como cérebro do Hermes (nível 3 do vídeo, "super important"): abrir o dashboard acima → seção de providers/API keys → OpenAI Codex → login; OU na VPS: `docker exec -it kirmes /opt/hermes/.venv/bin/hermes auth add openai-codex --type oauth --no-browser` (imprime URL+código; aprovar no browser). Depois `hermes model` pra tornar GPT-5.x-codex o default do chat. Com isso o CHAT do Hermes (Telegram+dashboard) fica de graça na assinatura; os crons continuam no proxy barato (não mudam sozinhos — envs explícitos).

**📼 Destilado dos 4 vídeos (o que serve pra nós):**
- **Vídeo 1 (Hermes, 5 upgrades):** ✅ browser access (feito acima) · ✅ ChatGPT sub como cérebro (passo seu acima) · Firecrawl p/ pesquisa (60x mais rápido, extrai só texto+brand identity: logo/cores/fontes — tem free tier, candidato p/ Fase 9 research) · morning brief auto-melhorável (Hermes+Gmail/Calendar via Zapier MCP, permissões só-leitura, nunca enviar) · completion contracts (/goal com verify+constraints+boundaries — adotar como PADRÃO nos prompts de cron: pedir PROVA de conclusão; alinha com nossa regra do PRONTO).
- **Vídeo 2 (7 níveis):** estamos ~nível 4-5 (integrações+orquestração). Lições a adotar: modelo-por-tarefa em TODA skill/agent ("não usar astrofísico pra montar Lego") → virou a tabela §8 abaixo · SOUL.md do Hermes na VPS está genérico — enriquecer com o contexto fayai (negócio, métricas, missão) p/ respostas personalizadas · nível 6 = tarefas agendadas assíncronas (já fazemos via cron) · nível 7 = "um OS pra toda IA": nossa versão é o mission-control + memória compartilhada (não perseguir dashboard de terceiros).
- **Vídeo 3 (Higgsfield MCP + Fable 5, site cinematográfico):** técnica-chave REPLICÁVEL COM COMFYUI (sem esperar os 5 dias do Higgsfield): imagem-mestre cinematográfica → animar em clipes curtos → **extrair frames → canvas controlado pelo scroll** (GSAP ScrollTrigger + Lenis) → encadear clipes usando o ÚLTIMO frame de um como imagem-semente do próximo (continuidade perfeita). Pasta de fotos de referência (frente+perfil) p/ consistência de personagem. SEMPRE equilibrar com peso/SEO/mobile (o próprio autor avisa). → virou FASE 10 abaixo.
- **Vídeo 4 (Claude Design):** claude.ai/design incluso na assinatura Claude · **criar DESIGN SYSTEM primeiro** (upload logo/site → extrai voz, cores, tipografia, botões) e gerar TUDO com ele selecionado — senão sai genérico · templates: UI mockup, slides, docs, animação, 3D, HTML email · animações de motion graphics a partir de prompt+transcript com timestamps, export MP4 (ótimo p/ Reels/vídeos de curso!) · fluxo Design (iterar rápido, edição inline) → Claude Code (produção). **Ação barata de alto valor: Ricardo criar o design system "FayAI" no claude.ai/design usando IDENTIDADE_VISUAL.md + logo + site como insumos — vira fábrica de artes IG/slides/certificados on-brand pra Fase 9.**

## 🔎 AUDITORIA SEO NO SEARCH CONSOLE — 21/07 (a resposta para "por que ninguém entra")

Ricardo pediu para entrar no GSC e melhorar o tráfego. O diagnóstico achou uma cadeia de bugs que, juntos, tornavam o site **estruturalmente invisível** — não era falta de divulgação, era o site dizendo ao Google para não indexá-lo.

**Números encontrados (propriedade `sc-domain:fayai.com.br`):**
- Dados existem só de **11/07 a 19/07** (propriedade nova) — 9 dias.
- **1 clique, 59 impressões, posição média 11,6.**
- As 6 consultas são **todas variações da marca** ("fayai", "fayz ai", "fazer ai", "ai fay", "fay ai") + 1 de conteúdo ("seo local com inteligência artificial", 1 impressão). Zero descoberta por tema.
- A **home concentra 51 das 59 impressões**; só 12 páginas do site já apareceram alguma vez.
- Relatório de Páginas indisponível ("dados em processamento", lado do Google).

**Causa raiz nº1 — CANONICAL APONTANDO PARA A HOME (o mais grave).** `src/app/[locale]/layout.tsx` declara `alternates.canonical = ${SITE_URL}/${locale}`. No App Router, **toda página filha herda esse valor se não definir o próprio**. As páginas de curso definem o seu (por isso estão corretas); **as matérias do IA Hoje não definiam** — então cada artigo declarava `<link rel="canonical" href="https://fayai.com.br/pt-BR"/>`, isto é, "sou uma duplicata da home, indexe ela no meu lugar". Prova na Inspeção de URL: *"O URL não está no Google / O Google não reconhece o URL"*. Explica a home concentrar as impressões e nenhum artigo jamais ranquear. **CORRIGIDO** (commit 4dd8ffb): canonical próprio + OpenGraph `article` + twitter card nas matérias e no hub.

**Causa raiz nº2 — SITEMAP CEGO.** `src/app/sitemap.ts` tinha 3 defeitos simultâneos: (a) lia a lista **estática** `@/data/courses` em vez do banco — anunciava curso arquivado (`banana-dev-deploy-ia`) e **omitia 3 ativos, incluindo 2 dos 4 carro-chefe reformados** (`aprenda-a-usar-ia-no-dia-a-dia`, `rag-knowledge`); (b) **nunca incluiu nenhuma matéria** (19 publicadas, todas fora); (c) era função **síncrona** = congelada no build, então matéria nova só entraria no próximo deploy. **CORRIGIDO** (56e272c + 4dd8ffb): async, lê do banco, inclui as matérias em `/noticias/<slug>`, `revalidate = 3600`.

**Causa raiz nº3 — DESCOBERTA INTERNA QUEBRADA.** `/blog` responde **307 → `/noticias`** (e era `/blog` que estava no sitemap). O hub real `/noticias` está OK e linka 21 matérias no HTML servidor. Mas a Inspeção confirmou "Nenhum sitemap de referência" + "Nenhuma página de referência" para os artigos: os dois caminhos de descoberta estavam cortados ao mesmo tempo. **CORRIGIDO**: sitemap aponta para `/noticias` e para cada `/noticias/<slug>`.

**Bônus — visibilidade em agentes de IA (diretriz sua de 19/07).** `public/robots.txt` bloqueava **todos** os bots de IA. Reescrito em duas camadas: **liberados** os motores de resposta que citam e mandam usuário (`OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Perplexity-User`, `ClaudeBot`, `Google-Extended`); **seguem bloqueados** os de treino/scraping em massa (`GPTBot`, `CCBot`, `anthropic-ai`, `Claude-Web`, `cohere-ai`, `Diffbot`, `YouBot`). Reversível em 1 arquivo se você discordar.

### Otimização de títulos para busca — 21/07 (segunda parte, a pedido do Ricardo)

**Bug encontrado antes de otimizar:** `generateMetadata` da página de curso lia a MESMA lista estática defasada do sitemap — então **3 cursos serviam o título genérico `"Curso - FayAi AI Academy"`**: `rag-knowledge`, `ia-producao` e `aprenda-a-usar-ia-no-dia-a-dia` (dois deles carro-chefe reformados). O título é o maior sinal de relevância on-page e eles simplesmente não tinham um. **Corrigido** (fd8e0cc): agora lê `getProductBySlug` e usa `seo.metaTitle`/`seo.metaDescription` do banco — **títulos viraram dado editável no Atlas, sem deploy** — com fallback em cascata (banco → nome → lista estática → genérico).

**Pesquisa de termos:** usei o autocomplete do Google (pt-BR/br) — dado real de busca, não chute. Padrões que dominam no Brasil: **"grátis/gratuito/de graça"** aparece em quase todo tema; **"o que é"** (intenção informacional); **"curso"**; **"na prática"**; **"para iniciantes"**; **"com certificado"**; **"com n8n"** e **"para whatsapp"** como modificadores fortes em automação/agentes.

**19 títulos reescritos e gravados no banco** (backup em `products_seo_backup_20260721`). Regras: termo de busca **no começo**, ≤60 caracteres (senão o Google trunca), sufixo curto `| FayAI` — o antigo `- FayAi AI Academy` comia 20 dos 60 caracteres com uma marca que ninguém procura. Exemplos:
- `rag-knowledge`: genérico → **"O que é RAG em IA: curso prático de Knowledge Base | FayAI"** (busca real: "rag ia", "rag ia significado")
- `aprenda-a-usar-ia-no-dia-a-dia`: genérico → **"Inteligência Artificial no Dia a Dia: curso prático | FayAI"** (busca: "exemplos de inteligência artificial no dia a dia")
- `crie-agentes-de-ia-autonomos`: "Do Conceito à Produção" → **"Agentes de IA: o que são e como criar do zero | FayAI"** (busca: "agentes de ia o que são")
- `chatgpt-allowlisting`: → **"Como Aparecer nas Respostas do ChatGPT (AEO) | FayAI"**
- Home: "FayAi - Aprenda IA do Zero ao Avançado" → **"Cursos de Inteligência Artificial do Zero | FayAI"** (a marca sai da frente: as 6 consultas do GSC eram variações ERRADAS do nome)
- `/cursos`: → **"Cursos de Inteligência Artificial com Certificado | FayAI"**

**Correção de honestidade:** a descrição de `/cursos` prometia **"mais de 50 cursos"** — o catálogo tem **20 ativos**. Número inflado em página de venda queima confiança e não ajuda ranking nenhum. Corrigido para 20.

**`ia-sem-filtro-por-claude` ficou de fora de propósito** — conteúdo sagrado, não toquei nem no título.

**Aviso estratégico honesto:** título otimizado não cria autoridade. Com domínio novo, brigar por "curso de inteligência artificial" (SENAC/USP na 1ª página) é perder tempo; por isso mirei **cauda longa informacional** ("o que é RAG", "agentes de ia o que são", "exemplos de IA no dia a dia") — ganhável com uma página boa. O próximo passo real é **conteúdo que responda essas perguntas**, não mais ajuste de tag.

**Pendência de posicionamento:** `ia-producao` tem título novo, mas o termo "IA em produção" **não tem busca** (o autocomplete devolve produção de música/vídeo). O curso precisa de decisão sua sobre reposicionamento — é o candidato mais fraco do catálogo em demanda.

**Pendências registradas (não feitas):**
- [ ] Rota legada `/blog/[slug]` (client component, dados estáticos `@/data/blog-posts`) responde 200 servindo a listagem genérica para slugs de notícia — duplicata fraca. Ideal: 301 para `/noticias/<slug>`. Não mexi para não quebrar os posts legados.
- [ ] `Crawl-delay: 1` no robots para Googlebot é inócuo (Google ignora), mas pode sair.
- [ ] Sem dados de Core Web Vitals ainda (tráfego insuficiente).
- [ ] **O gargalo real depois disto é conteúdo com demanda de busca**: hoje nada no site responde a uma pergunta que brasileiros digitam. Os 4 cursos reformados + o blog diário são a matéria-prima; falta mirar termos ("como usar chatgpt", "curso de ia gratis", "o que é rag") em títulos/H1. Isso conecta com a Fase 9.4.

### FASE 9 — TRÁFEGO + INSTAGRAM AUTÔNOMO (planejada 20/07, executar após P.1)
A infra já existe quase toda (USS publicador + cron publish-due + OAuth FB/IG pronto + persona + manchetes IA Hoje no prompt). O que falta é ligar as pontas:
- [ ] 9.0 **BLOQUEADOR (Ricardo, ~10 min):** conectar FB/IG da fayai no USS (Perfil Social → Conectar) — o OAuth está pronto desde 14/07.
- [ ] 9.1 Cron diário de conteúdo IG: agente (kirmes/hermes via rota barata, ou codex exec com a assinatura) gera 1-2 posts/dia com o motor USS (persona fayai + manchetes das últimas 48h), agenda via USS; `uss_publish_due` (já roda a cada 5 min) publica sozinho.
- [ ] 9.2 Qualidade visual: imagem de cada post via Studio/ComfyUI (mediaPrompt do gerador → Composer já faz isso manualmente; automatizar a chamada).
- [ ] 9.3 Loop de melhoria: `sync-due` (7.1) já refina a persona pelo engajamento real — revisar semanalmente os top posts e ajustar temas.
- [ ] 9.4 Tráfego orgânico de busca: blog IA Hoje já publica diário; adicionar interlinks curso↔post e sitemap ping (baixo esforço, alto SEO).
- Critério de aceite: 7 dias seguidos de posts no IG da fayai sem intervenção manual, com engajamento medido no sync-due.
- [ ] 9.5 (novo, do vídeo 1) Adotar "completion contracts" nos prompts dos crons: todo job agêntico pede PROVA verificável de conclusão (arquivo gravado, URL 200, contagem exata) + constraints/boundaries explícitos.
- [ ] 9.6 (novo, do vídeo 4) Ricardo cria o design system "FayAI" no claude.ai/design (insumos: IDENTIDADE_VISUAL.md, logo, fayai.com.br) → artes de IG/slides on-brand com 1 prompt; opcional: avaliar Firecrawl free tier pra research de conteúdo.

### FASE 10 — HOME CINEMATOGRÁFICA (scroll-vídeo estilo Higgsfield, via ComfyUI) — planejada 20/07, PILOTO primeiro
Receita provada no vídeo 3, replicável 100% local (RTX 5060 Ti + Qwen image + LTX I2V, receitas que já dominamos da Leitura 2.0):
- [ ] 10.1 PILOTO: UMA seção hero para a home — imagem-mestre cinematográfica do universo fayai (Qwen 2512) → 1 clipe LTX de ~4-6s → script Python extrai frames → canvas com scroll-scrub (GSAP ScrollTrigger + Lenis), fallback estático p/ mobile/reduced-motion. Aprovação do Ricardo ANTES de escalar (§1).
- [ ] 10.2 Se aprovado: narrativa de 3-4 cenas encadeadas (último frame de cada clipe = semente do próximo) contando a jornada do aluno (caos → domínio da IA), respeitando peso (WebP/WebM comprimidos, lazy, LCP) — a home já perdeu banda Netlify antes, não repetir.
- [ ] 10.3 Quando o Higgsfield voltar (5 dias): comparar qualidade dos clipes (Higgsfield MCP direto no Claude) vs LTX local pros planos de câmera que o LTX não segura.
- Regra: NÃO tocar na home em produção antes do piloto aprovado; efeitos nunca podem quebrar SEO/mobile (aviso do próprio autor do vídeo).

## §8. ESTRATÉGIA DE MODELOS E ESFORÇO — como não queimar a cota (v2, 21/07 — PRIORIDADE 0 do Ricardo)

> **Contexto:** terça-feira, 20% da cota semanal já consumida. Esta seção existe para que isso não se repita. Leia §8.0 antes da tabela — o maior desperdício **não** é o nível de esforço, é rodar o modelo mais caro em trabalho que não precisa dele, com contexto gigante, em sessões longas.

### §8.0 — O que realmente consome cota (em ordem de impacto)

Quatro fatores se multiplicam. Mexer no primeiro vale mais que otimizar os outros três:

1. **Tier do modelo** — o fator dominante. Preço de API por milhão de tokens (proxy honesto do peso relativo na cota; a contabilidade exata da assinatura não é pública, mas a *proporção* entre modelos é o modelo mental certo):

   | Modelo | Entrada | Saída | Relativo a Sonnet |
   |---|---|---|---|
   | **Fable 5** (eu, por padrão) | $10 | $50 | **~3,3x** |
   | **Opus 4.8** | $5 | $25 | ~1,7x |
   | **Sonnet 5** | $3 | $15 (intro $2/$10 até 31/08) | 1x |
   | **Haiku 4.5** | $1 | $5 | ~0,3x |

   Ou seja: **a mesma tarefa em Sonnet 5 custa ~1/3 do que custa em Fable 5.** Você já fez a jogada certa nesta sessão ao trocar para Opus 4.8 — mantenha esse reflexo.

2. **Tamanho do contexto × número de turnos.** Cada turno reenvia a conversa inteira. Numa sessão longa com o MASTERPLAN (que já é enorme) relido várias vezes, o custo de *entrada* cresce quadraticamente. **Sessão longa em Fable 5 é o pior cenário possível** — foi o que aconteceu ontem.

3. **Nível de esforço (`effort`)** — controla profundidade de raciocínio e quantos tokens de saída são gastos. Real, mas menor que os dois de cima.

4. **Número de chamadas de ferramenta.** Esforço baixo consolida chamadas; esforço alto explora mais.

### §8.1 — Níveis de esforço: o que são e quando usar

Cinco níveis: `low` · `medium` · `high` (padrão) · `xhigh` · `max`. Esforço mais baixo = menos preâmbulo, menos chamadas de ferramenta, respostas mais diretas.

**A armadilha que quero desfazer:** "sempre usar o máximo para ter qualidade" está errado em duas direções.

- **Para baixo:** em **Fable 5**, `low` e `medium` continuam excelentes — a documentação oficial é explícita: frequentemente **superam o desempenho de modelos anteriores rodando em `xhigh` ou `max`**. Trabalho rotineiro meu não precisa de esforço alto.
- **Para cima:** em trabalho agêntico (várias ferramentas, várias etapas), **esforço alto no começo costuma REDUZIR o custo total**, porque resolve em menos turnos. Baixar tudo para `low` pode sair mais caro por multiplicar idas e vindas.

Recomendações por modelo (da referência oficial):

| Nível | Quando usar | Observação importante |
|---|---|---|
| `max` | Só quando acertar importa mais que o custo | Pode "pensar demais" e dar retorno decrescente. Reserve para o raro. |
| `xhigh` | Codificação e trabalho agêntico difícil | É o padrão do Claude Code. **Em Opus 4.8, NÃO use por reflexo** — 4.8 tem teto de inteligência mais alto; comece em `high`. |
| `high` | **Padrão.** Trabalho sensível a inteligência | O melhor equilíbrio qualidade/tokens na maioria dos casos. |
| `medium` | Economia consciente | Em Fable 5 entrega muito bem; em Sonnet 5 equivale ao Sonnet 4.6 em `high`. |
| `low` | Tarefas curtas e escopadas, subagentes, coisas não sensíveis a inteligência | Risco de raciocínio raso em problema complexo — se acontecer, **suba o esforço em vez de tentar contornar por prompt**. |

**Sinal prático:** se uma tarefa terminou **correta mas demorada demais**, o certo é *baixar* o esforço. Se terminou **rápida mas rasa**, *subir*. Não julgue pelo tempo isolado.

### §8.2 — Matriz: modelo + esforço por tipo de trabalho

Princípio (vídeo 2): "não usar astrofísico pra montar Lego". Sem gastar a mais: a assinatura Claude cobre Fable/Opus/Sonnet/Haiku; a assinatura ChatGPT cobre o Codex e o chat do Hermes; OpenRouter só no que sobrar; a GPU local faz mídia.

| Trabalho | Modelo | Esforço | Por quê |
|---|---|---|---|
| **Decisão de rumo**: arquitetura, incidente em produção, "por que ninguém entra no site", escolher entre caminhos caros, revisar se o plano está certo | **Fable 5** | `high` | Erro aqui custa semanas. É a única categoria que justifica o tier mais caro. **Sessão curta e focada** — entra, decide, sai. |
| **Implementação pesada já especificada**: feature grande planejada, refactor, lote de correções, auditoria técnica de sistema | **Opus 4.8** | `high` (subir p/ `xhigh` só se ficar raso) | ~90% do resultado em código puro por ~metade do custo de Fable. **É o cavalo de batalha.** |
| **Rotina**: scripts, QA, aplicar conteúdo aprovado, correções pequenas, verificações, deploy, mexer em config | **Sonnet 5** | `medium`–`high` | 1/3 do custo. Mais que suficiente. **Deveria ser a maioria das sessões.** |
| **Subagentes de busca/exploração** (varrer repo, achar arquivo, listar) | Sonnet 5 ou Haiku 4.5 | `low` | Esforço baixo é explicitamente recomendado p/ subagente. |
| **Glue trivial**: formatar, listar, converter | Haiku 4.5 | `low` | ~0,3x Sonnet. |
| Chat do Hermes (Telegram + dashboard) | **GPT-5.6 pela SUA assinatura ChatGPT** | — | **Custo zero.** Já configurado e verificado 21/07. |
| Crons da VPS (auditoria, TCH) | Gemini 3 Flash via kirmes-proxy | — | $0,50/$3 por M. Já pinado. |
| Blog diário IA Hoje | Gemini 3.5 Flash Lite (rota `kirmes-premium`) | — | Trocado 29/07: saiu o Kimi K3 ($3/$15) e entrou o Flash Lite ($0,30/$2,50, contexto de 1M). ⚠️ A rota "premium" agora é a mais BARATA das duas — o nome ficou legado. |
| Mídia (imagens/vídeo de curso, home cinematográfica) | ComfyUI local | — | GPU própria, custo zero. |
| Volume/triagem/scoring mecânico offline | **LM Studio local** | — | Ver §8.4 — com ressalvas sérias de velocidade. |

**Regra de bolso:** **Fable decide · Opus constrói · Sonnet mantém · Haiku faz o trivial · as assinaturas absorvem o que puderem · OpenRouter só paga o que nenhuma assinatura cobre · a GPU local faz mídia.**

### §8.3 — Higiene de sessão (o maior ganho que está na SUA mão)

Isto vale mais que qualquer ajuste de esforço:

1. **Uma sessão = um assunto.** Quando o assunto muda (do SEO para o Hermes, do Hermes para a home), **abra sessão nova**. Continuar na mesma arrasta todo o histórico caro a cada turno.
2. **Escolha o modelo ANTES de começar**, pela primeira linha da tabela que descreve a tarefa. Trocar no meio não desfaz o que já foi gasto.
3. **Não use Fable 5 para sessões longas de execução.** Se a sessão vai ter dezenas de turnos e muitas ferramentas, é Opus ou Sonnet. Fable é para decidir, não para executar por horas.
4. **Peça o plano em Fable, execute em Opus/Sonnet.** Padrão que economiza muito: uma sessão curta em Fable produz o plano escrito no MASTERPLAN; uma sessão em Sonnet executa aquele plano.
5. **Trabalho não-interativo vai para cron/assinatura ChatGPT/local**, nunca para uma sessão minha aberta.

### §8.4 — LM Studio: o que ele resolve e o que NÃO resolve (medido em 21/07)

**Medi, não estimei.** Hardware: RTX 5060 Ti, 16 GB VRAM. Servidor acessível via Tailscale em `http://100.84.253.67:1234`, com 16 modelos disponíveis.

**Resultado da medição:** `gpt-oss-20b` respondeu uma classificação em **12,7s (6,2 tokens/s)**; `qwen3.5-9b` gastou 21s e devolveu **conteúdo vazio** (modelo de raciocínio consumindo tudo no "pensamento" — mesmo defeito que vimos no Kimi K3). No momento do teste a GPU estava **livre** (ComfyUI desligado, 2% de utilização), então **6-7 tok/s é a velocidade real desta máquina**, não disputa de recurso.

**O que isso significa na prática:**
- Uma resposta de 1.000 tokens leva **~2,5 minutos**. Uma API de nuvem faz o mesmo em segundos.
- Reescrever um curso de 30 capítulos localmente levaria **dias de máquina ligada**.
- **Conclusão honesta: LM Studio não substitui Claude/ChatGPT para nada interativo nem para geração de conteúdo longo.**

**Restrição de VRAM (importante):** com 16 GB totais e ~12,8 GB já ocupados com um modelo carregado + desktop do Windows, os modelos de 16 GB+ do seu catálogo (Qwen3.6 27B, Gemma 4 26B, GLM 4.7 Flash) **transbordam para a RAM e ficam ainda mais lentos**. A faixa utilizável é a de 6-13 GB. E o mais importante: **ComfyUI e LM Studio disputam a mesma GPU** — enquanto um gera vídeo de curso, o outro não roda modelo grande. É um ou outro, não os dois.

**Onde LM Studio VALE a pena (custo zero, latência irrelevante):**
- **Triagem/classificação em lote, offline**: passar 100 títulos e marcar "tem termo de busca? sim/não". Saída de 5-20 tokens é rápida mesmo a 7 tok/s.
- **Scoring mecânico contra checklist explícito** (não julgamento editorial).
- **Embeddings — MEDIDO E VALIDADO 21/07, é o melhor uso imediato.** `nomic-embed-text-v1.5` levou **768 ms por texto** (os 20 cursos do catálogo sairiam em ~15s, custo zero). E o teste **já achou um problema real**: os títulos que escrevi hoje para `n8n-automacao-avancada` ("Curso de n8n: automação com IA na prática") e `primeiras-automacoes` ("Automação com IA na Prática: curso para iniciantes") têm **similaridade 0,810 — os dois disputam o mesmo termo de busca**, canibalização que eu mesmo introduzi. ⚠️ **PENDENTE:** diferenciar um dos dois (sugestão: `primeiras-automacoes` mirar "automatizar tarefas repetitivas sem programar", deixando "automação com IA na prática" só para o n8n). Isso prova o caso de uso: rodar embeddings sobre todos os títulos + descrições e listar os pares acima de ~0,80 é uma varredura de canibalização de custo zero que dá para repetir sempre que o catálogo mudar.
- **Rascunho descartável** que um modelo bom depois reescreve.

**Onde NÃO vale:** qualquer coisa que o cliente vê, decisão de arquitetura, conteúdo de curso, copy de venda, código de produção.

⚠️ **Armadilha histórica que não pode repetir:** o LM Studio já ficou **inacessível por dias sem ninguém perceber** — foi a causa raiz do "IA HOJE" parado de 17 a 19/07. Qualquer coisa que dependa dele **precisa de health-check e fallback automático**, como o proxy tem hoje. Nunca colocá-lo no caminho crítico sem rede de segurança.

### §8.5 — Autoresearch no Mission Control: resposta honesta

**Está configurado?** Não. Existe o *padrão* de autoresearch documentado (`reference_autoresearch_pattern`) e existem skills (`homepage-autoresearch`, `story-autoresearch`), mas **não há loop de autoresearch rodando dentro do Mission Control** hoje, e o LM Studio não está ligado a nada — o proxy da VPS foi migrado para Gemini/Kimi justamente porque ele caiu.

**Seria bom?** Em partes — e vale ser específico, porque autoresearch é por natureza **caríssimo em tokens** (o loop gera muitas variantes e avalia cada uma). Rodá-lo em Fable 5 seria a maneira mais rápida de zerar a cota semanal.

- ✅ **Faz sentido**: o loop rodar em modelo **barato ou local**, com o Claude entrando **só no veredito final**. Ex.: LM Studio gera 20 variantes de título → um script mecânico filtra → Sonnet 5 escolhe as 3 melhores → você aprova.
- ✅ **Faz muito sentido agora**: usar embeddings locais (nomic) para achar canibalização de conteúdo no catálogo e no blog — custo zero, é exatamente o tipo de trabalho mecânico que a máquina faz bem.
- ❌ **Não faz sentido**: autoresearch de conteúdo editorial rodando em modelo local a 7 tok/s — o loop levaria dias e a qualidade dos modelos de 9-27B não chega perto do necessário para conteúdo que o cliente lê.
- ⚠️ **Pré-requisito que falta**: autoresearch só funciona com **métrica real de sucesso**. Hoje o site tem ~1 clique/semana no Search Console — **não há sinal estatístico para otimizar contra**. Montar o loop antes de ter tráfego é otimizar ruído.

**Recomendação:** **não montar autoresearch agora.** A ordem correta é (1) o SEO que consertamos começar a trazer impressões, (2) Fase 9 trazer tráfego de Instagram, (3) **aí sim** existir dado para um loop otimizar. Enquanto isso, o uso local de melhor retorno é embeddings para higiene de catálogo — barato, útil e não depende de tráfego.

### §8.6 — Cartão de bolso (o resumo de 20 segundos)

> **Vai decidir rumo?** Fable 5, `high`, sessão curta.
> **Vai construir algo grande já planejado?** Opus 4.8, `high`.
> **Vai fazer o resto (a maioria)?** Sonnet 5, `medium`.
> **É repetitivo, offline ou não-interativo?** Cron, assinatura ChatGPT, ou local.
> **Mudou de assunto?** Sessão nova.

---

## ⏩ SESSÃO 19/07 (tarde) — histórico

**Contexto:** os 4 cursos ficaram prontos pra vender (bloco 18/07 abaixo). Ricardo disse "vou revisar o conteúdo dos cursos ao longo da semana, continue o resto do masterplan e cuide do site" — sessão de hoje é toda em cima disso, sem mexer mais em conteúdo de curso.

**✅ FEITO 19/07:**

1. **4 contas de teste, uma por tier** (free/explorador/profissional/expert) — criadas pelo fluxo REAL de cadastro (`/api/auth/register`, não fixture direto no banco), depois upgradadas via Atlas (subscription+credits, espelhando `TIER_CONFIGS`, já que não há pagamento real pra simular). Credenciais salvas em memória (`reference_test_accounts`).

2. **Auditor hermes (P.2) consertado — dois bugs de verdade, não o que o MASTERPLAN antigo supunha:**
   - **Bug raiz:** `course_audit_prepare.js` exportava `fayapoint.courses.modules[].lessons[].content` — **dado morto** pra maioria do catálogo (confirmado nesta sessão: o reader só usa `fayapointProdutos.products.courseContent`). O auditor vinha avaliando conteúdo que nenhum aluno nunca leu. Prova: chatgpt-masterclass tinha 790KB de "250 aulas" fantasma vs. 65KB reais em 16 seções — isso também era a causa do "trava em cursos grandes" (12x mais texto que o necessário), não falta de chunking como se pensava.
   - **Bug secundário, achado ao testar:** hermes (`-z` one-shot) às vezes IMPRIME o relatório completo no stdout mas não grava o arquivo esperado — falha intermitente, reproduzida em make-integracao-total E chatgpt-masterclass antes do fix. Corrigido com fallback no shell script: captura o stdout, extrai a partir de `# Auditoria:` e grava no lugar esperado se o arquivo não existir.
   - **Verificado 3x**: chatgpt-masterclass (o curso que travava) completou em 5-8min (não trava mais), publicou no MC com `lessons: 16` (contagem real) e nota 5 — conferido direto em `mission-control.courseaudits`.
   - Scripts corrigidos versionados em `scripts/vps/` (cópia do que está deployado em `/root/kirmes/` na VPS 76.13.234.38; backups do original ficaram em `.bak_*` lá).
   - **Desbloqueia 1.4/1.5** — agora dá pra confiar no relatório do auditor pra propor patches de conteúdo desatualizado.

3. **0.5 Hardening de animação — feito de verdade** (não só descrito): hook `useTabHiddenAtMount` compartilhado, aplicado em `ArcadeVisual.tsx`/`TrailMap.tsx` (que não tinham NENHUM guard contra aba oculta no mount) + refatorado o guard já existente do reader pra usar o mesmo hook.

4. **Funil PostHog instrumentado** (`trail_node_click`, `lesson_view`, `minigame_start`/`complete`) — com uma ressalva importante: o PalpiteGame já foi da landing pro Arcade (login), então "minigame" hoje é pós-cadastro, não pré. Isso preparou o terreno pro item 5.

5. **Os 5 minigames agora funcionam SEM CADASTRO** (pedido explícito do Ricardo, resposta ao achado do item 4): nova página pública `/arcade` (`src/components/landing/PublicArcade.tsx`) reaproveita os 5 componentes de jogo TAL COMO SÃO no portal (nenhum tem dependência de auth/API — só o Palpite tem, e esse já tinha um fluxo pronto de localStorage→claim-on-signup em `NovaLanding.tsx`/`ClaimLandingXp.tsx` que eu só descobri existir, não precisei construir). Link novo no rodapé da home (`NovaLanding.tsx`). CTA de cadastro no fim da página, com tracking PostHog. **Fecha o funil nó→aula→minigame→cadastro que estava só documentado, nunca instrumentado.**

**⚠️ ARMADILHA NOVA 19/07 (grave, gastou tempo):** Turbopack dev pode manter uma INSTÂNCIA DE MÓDULO em memória mesmo depois de `preview_stop`+`preview_start` — o `.js` servido pelo browser CONTINHA o código novo (confirmado via fetch do chunk), mas o componente React montado continuava executando a versão antiga (array com 4 itens em vez de 5), e nem abrir aba nova resolvia. Só resolveu matando o processo `node .../next/dist/server/lib/start-server.js` DIRETO por PID (não só via `preview_stop`, que não mata processos órfãos) e confirmando com `npx next build` + `npx next start` numa porta separada — **build de produção é a fonte da verdade, sempre verificar por ali quando o dev server parecer ignorar uma mudança, não insistir em reload/restart do preview.**

**✅ Deployado** (commit `fbbeb19`, confirmado no ar) — `/arcade` público, funil PostHog, hardening de animação.

**✅ FEITO 19/07 (final da sessão) — 2 fusões de catálogo, pedido direto do Ricardo:**
- **Cluster ChatGPT investigado** (chatgpt-zero + chatgpt-masterclass + prompt-engineering) — Ricardo pediu avaliação honesta de sobreposição antes de decidir fundir. Achado: overlap real mas ESTREITO — chatgpt-masterclass §3 ("7 Componentes RCTFTRE") ensina essencialmente a mesma lição que chatgpt-zero cap.6 (framework de 4 elementos), só isso (~2 de 16 seções). O resto do masterclass (Code Interpreter, DALL-E, GPTs/API, ética, casos de negócio) e todo o prompt-engineering (CoT, ToT, meta-prompting, por-modelo) são genuinamente novos. **Não é caso de fusão** como n8n/Perplexity — é um trim leve (cross-referenciar em vez de re-ensinar), baixa prioridade, não fiz ainda.
- **Allowlisting**: Ricardo confirmou que continua relevante mas precisa ser repensado — sair do foco só em SEO/search engines e cobrir visibilidade para AGENTES de IA. Anotado, não iniciado.
- **n8n fundido**: `automacao-n8n` (templado, mad-libs confirmado na prosa, R$99, **0 matrículas reais**) arquivado — `n8n-automacao-avancada` (editorial real, comparativo vs Make/Zapier, R$199, 2 matrículas) é agora o único curso de n8n ativo.
- **Perplexity fundido**: `perplexity-pesquisa-inteligente-e-conhecimento-instantaneo` (templado, R$79, **0 matrículas**) arquivado — `perplexity-pesquisa-inteligente` (editorial real, estava ARQUIVADO por engano, R$37, 2 matrículas) foi **revivido** como o único curso de Perplexity ativo.
- Ambas as fusões: **0 clientes reais afetados** (conferido `users.enrolledCourses` + `courseprogresses` + `orders` antes de mexer). Backup em `fayapoint.courses_backup_merge_20260719` e `fayapointProdutos.products_backup_merge_20260719`. Mudança de status é instantânea (Atlas = produção na hora, sem deploy) — já confirmado sumindo/aparecendo em `/api/products?type=course`.
- **Nota pendente**: `perplexity-pesquisa-inteligente` revivido manteve o preço antigo (R$37) — pode valer reprecificar já que virou o curso canônico (padrão dos outros ficou R$79-199). Não mexi, é decisão de preço, não de conteúdo.

---

## ⏩ SESSÃO 18/07 — (histórico, resolvido — os 4 cursos abaixo estão prontos e no ar)

**Deploy do handoff 17/07: CONFIRMADO no ar** — verificado por HTTP em 18/07 (`curl -sI https://fayai.com.br/cursos/media/chatgpt-zero/inline/cap05-fluxo.webm` → 200). Não repetir os passos 1-2 do deploy antigo. Passos 3-5 daquele handoff (thumbs de persona, beta Expert, cron VPS) continuam pendentes — ver lista funde abaixo em P.1/P.2.

**🎬 REPLICAÇÃO chatgpt-zero → outros cursos — status 18/07:**
Só **2 cursos publicados** têm a estrutura idêntica ao chatgpt-zero (30 caps, 6 módulos × 5 aulas, mesmo boilerplate — âncoras conferidas verbatim): `primeiras-automacoes` e `aprenda-a-usar-inteligencia-artificial-no-seu-dia-a-dia`. Rodando os dois agora (scripts `generate_course_inline_media_<slug>.py`, temas próprios, BASE_SEED 8000/8500, ~5h de GPU combinado). **Terceiro curso do mesmo template, `mastering-ai-with-chatgpt`, está ARCHIVED e é duplicata em inglês do chatgpt-zero — candidato a retirada definitiva, não a investimento (ver auditoria abaixo).**
Depois de gerado: `install_course_inline_media.sh` + `insert-course-inline-markers.cjs` (cópias por curso, mesma lógica, âncoras já confirmadas idênticas) — dry-run primeiro, `--apply` só depois do commit+push+deploy dos arquivos de mídia (mesma armadilha do cap.1: nunca marcador no Atlas antes do reader ter o arquivo estático no ar).

**🔍 AUDITORIA DO CATÁLOGO (pedida por Ricardo 18/07, ver §6 abaixo para detalhe completo):** as matrículas vistas anteriormente (487, 412...) eram dado de teste, não reais. Catálogo tem 25 cursos em duas "eras" de geração de conteúdo — editorial manual (H1s distintos, comparativos "X vs Y vs Z") e templado (30 "capítulos" boilerplate, tipo chatgpt-zero) — e pelo menos 3 pares de cursos publicados cobrindo o MESMO tema simultaneamente (n8n, Perplexity, e o cluster de agentes de IA). Nenhum trabalho de ilustração/GPU deve entrar nesses cursos até Ricardo decidir merge/retire. Detalhe completo e recomendação em §6.

**⚠️ ARMADILHAS DESCOBERTAS 17-18/07 (ler antes de mexer no reader/ícones/scripts):**
1. react-markdown v10 renderiza comentários HTML como TEXTO escapado (premissa "invisível" era falsa; doc corrigido no ARQUITETURA_CONTEUDO_DINAMICO).
2. Literal `<!--`/`-->` em fonte TSX mata a rota no Turbopack (404 silencioso, compila `_not-found`); montar via `new RegExp("<"+"!--...")`.
3. Ícone lucide com nome-alias (ex.: TriangleAlert) passa no tsc mas 404a a rota com optimizePackageImports — conferir `node_modules/lucide-react/dist/esm/icons/<kebab>.js` antes de importar.
4. Turbopack dev serve chunk VELHO do cache do browser (nomes sem hash) — verificar com `fetch(chunkSrc, {cache:"reload"})`; prod não afeta.
5. OpenRouter: Flux/SD/Recraft NÃO existem mais em chat-completions (só google/gemini-*-image e openai/gpt-*-image); `openrouter/free` também não é modelo válido.
6. **NOVO 18/07:** rodar um script Python de geração via `run_in_background` que TAMBÉM usa `&` dentro de um subshell bash é redundante e cria processos órfãos não rastreados — o wrapper externo reporta "completed" imediatamente (porque o `&` interno devolve o shell na hora) mas o processo real continua solto, fora do tracking. Rodar o comando python DIRETO com `run_in_background: true` (sem `&`/subshell), sem chaining `;` de múltiplos scripts no mesmo comando.
6b. **NOVO 18/07 (2ª ocorrência):** `until ! tasklist /FI "PID eq $PID" | grep -qi python.exe; do sleep N; done` deu falso-negativo DUAS vezes na mesma sessão — `tasklist` via Git-Bash às vezes reporta "processo não encontrado" com o processo ainda vivo (concorrência/latência do WMI, não confirmado a causa exata). Isso disparou um `git commit && git push` prematuro com o `resume_missing_media.py` ainda rodando (script legítimo, não morreu — só o wait-loop errou). Consequência: primeiro deploy dos vídeos de caps16-30 saiu PARCIAL, precisou de uma segunda passada de instalação+commit depois que o script realmente terminou. Lição: para esperar um processo Python terminar de verdade, checar 2x seguidas com um intervalo (não confiar numa checagem única de `tasklist`), ou preferir `Wait-Process -Id $PID` via PowerShell (bloqueia de verdade até o processo sair, sem essa flakiness).
7. **NOVO 18/07:** `fayapointProdutos.products.courseContent` é a ÚNICA fonte que o reader realmente renderiza (`/api/courses/[slug]/content/route.ts`) — o campo `fayapoint.courses.modules[].lessons[].content` (que tem conteúdo por-aula "Capítulo N") é **dado morto** para cursos fora da família chatgpt-zero: o reader faz split só por `# ` (H1) via `countCourseContentChapters`, então cursos com curriculum de 150-250 "aulas" vendidas mas só 15-20 H1 reais no `courseContent` mostram MUITO menos conteúdo do que o curriculum promete. Sempre checar `courseContent` diretamente, nunca assumir que o curriculum bate com o conteúdo real.

**🛑 PARADO 18/07 — mídia repetitiva, Ricardo mandou parar o fluxo:** ao revisar as imagens/vídeos gerados hoje, Ricardo constatou que dentro do mesmo módulo (5 capítulos) tudo fica quase idêntico — pouca diversidade, "5-6 vídeos iguais, mudando quase nada". Causa raiz: o script `generate_course_inline_media_*.py` usa `SLOT_ACTIONS[slot][tipo % 5]` — só 5 variantes de texto por slot — e `VIDEO_MOTION` é 100% fixo (idêntico nos 30 capítulos); nenhum dos dois lê o conteúdo real do capítulo. **Pior: o mesmo problema existe no TEXTO da própria courseContent, incluindo do chatgpt-zero já no ar** — comparei cap.1 vs cap.6 do chatgpt-zero e a prosa é ~90% idêntica palavra por palavra (só 3-4 frases-substantivo trocadas: tópico do módulo, 2 cenários, 1 entregável), e as LEGENDAS das mídias inline são literalmente idênticas entre capítulos ("Qualidade em IA é um sistema em camadas..." aparece igual no cap01 e no cap06). Ricardo só validou o cap.1 (feito à mão) — os caps 2-30 nunca passaram por revisão de diversidade.
- **Regra nova, permanente:** manter design/quantidade/posicionamento da mídia (6 imagens + 2 vídeos por capítulo, mesmos slots estruturais) — mas o PROMPT de cada imagem/vídeo nunca pode se repetir entre capítulos. Cada prompt deve ser ancorado nas frases ESPECÍFICAS daquele capítulo (tópico do módulo + os 2 cenários únicos + o entregável único, todos extraíveis da prosa "vamos conectar X a entregáveis como Y e a cenários como Z") com objetos/composição concretos que mudam a cada capítulo — o motivo visual (ex.: "empilhar camadas") pode se repetir como linguagem de design, mas o CONTEÚDO da cena (que objetos, que camada está fraca, que cenário está representado) tem que ser sempre novo.
- Conteúdo v1 (genérico) dos 2 cursos-gêmeos ARQUIVADO em `course_media/<slug>_v1_generic_backup_20260718/` — preservado, não apagado, não usar.
- **Decisão do Ricardo 18/07: regenerar os 3 cursos com a MESMA prioridade** (chatgpt-zero incluído, mesmo já em produção) — e escopo expandido: não é só ancorar prompts de imagem nas frases únicas do texto mad-libs, é **reescrever a PROSA em si** para ser genuinamente única e "atualmente relevante" por capítulo. Corrige a causa raiz, não o sintoma visual.
- **Piloto entregue 18/07:** `PILOTO_REESCRITA_CAP1_CAP6_CHATGPT_ZERO.md` (raiz do repo) — reescrita completa dos caps 1 e 6 do chatgpt-zero, mesma estrutura de 9 seções, tamanho comparável, conteúdo substantivo e sem repetição entre si. Usa tokens `{{fact:...}}` para referências a modelos atuais. Aguardando veredito do Ricardo antes de escalar para os 90 capítulos (3 cursos × 30 caps).
- **Implicação técnica — FEITO 18/07:** `insert-course-inline-markers.cjs` reescrito — agora genérico por slug (`node insert-course-inline-markers.cjs <slug> [--apply]`, funciona nos 3 cursos) e 100% âncora ESTRUTURAL (por seção/parágrafo), nenhuma frase literal — robusto a qualquer reescrita futura de prosa.
- **Ricardo aprovou o piloto ("gostei e aprovei") + a mudança de âncora ("concordo com sua sugestão").**
- **TEXTO 100% PRONTO (18/07, verificado por amostragem):** os 3 cursos têm os 30 capítulos completos e revisados, zero repetição mad-libs. Arquivos em `scripts/cursos/content_drafts/`: `chatgpt-zero_caps_2-15.json` + `chatgpt-zero_caps_16-30.json` (+ cap1/cap6 do piloto, já no `PILOTO_REESCRITA_CAP1_CAP6_CHATGPT_ZERO.md`), `primeiras-automacoes_caps_1-15.json` + `primeiras-automacoes_caps_16-30.json`, `ia-dia-a-dia_caps_1-15.json` + `ia-dia-a-dia_caps_16-30.json`.
- **MÍDIA GPU RODANDO EM BACKGROUND (18/07, iniciado ~14h, sessão perto do limite de uso):** 6 agentes concorrentes escrevendo prompts únicos por capítulo (ancorados no texto real de cada capítulo, mesmo motivo composicional por slot mas objetos concretos sempre diferentes) e rodando a geração no ComfyUI até o fim, sem supervisão. Mídia antiga (genérica) de TODOS os 3 cursos arquivada em `course_media/<slug>_v1_generic_backup_20260718/` (preservada). Mídia aprovada do piloto (cap01/cap06 chatgpt-zero) restaurada manualmente no diretório de trabalho antes de soltar os agentes — não foi regerada.
- **✅ FEITO 18/07 (tarde):** texto dos 3 cursos aplicado em produção (com backup automático por curso), imagens 100% instaladas nos 3 cursos, deploy confirmado no ar (`cap02-sistema.webp` 200 em todos os 3). Marcadores aplicados via `insert-course-inline-markers.cjs` — **corrigido bug importante**: a checagem de "capítulo já marcado" era por CAPÍTULO inteiro (`cap.includes('<!--media:')`), o que impediria backfill incremental de slots que faltam (ex.: vídeo ainda não gerado) assim que QUALQUER marcador daquele capítulo já existisse. Trocado para checagem por SLOT individual (`cap.includes('id="${id}"')`) — agora rodar o script de novo só insere o que ainda falta, sem re-processar o resto. `resume_missing_media.py` (rodando desde ~14h) está completando os 89 vídeos que faltavam (caps 16-30, os 3 cursos) reaproveitando os prompts já escritos pelos agentes — ritmo ~130s/vídeo.
- **✅ FEITO 19/07 (madrugada):** os 89 vídeos que faltavam terminaram de gerar (confirmado 2x — check manual + `Wait-Process` bloqueante). chatgpt-zero já tinha ido no commit anterior (deploy prematuro por falso-negativo do `tasklist`, ver armadilha 6b); primeiras-automacoes + IA-dia-a-dia completados e deployados no commit `cf28871`. Os 3 cursos estão com os 240 arquivos de mídia (chatgpt-zero 243, sobra de nomes legados do cap01) 100% instalados em produção.
- **✅ CONFIRMADO 19/07 (madrugada) — os 3 cursos 100% completos em produção:** verificado direto na API ao vivo (`/api/courses/<slug>/content`) — 30 capítulos, 120 marcadores `media:img` + 60 `media:video` cada curso (30×4 e 30×2, exato), cap.20 de primeiras-automacoes conferido renderizando com marcador presente. Markers backfill rodou 2x (uma vez pela cadeia antiga que finalmente destravou, outra vez por mim como conferência) — ambos bateram em `sem mídia ainda: 0`. Nada mais pendente nesses 3 cursos.
- **✅ CONFIRMADO 19/07 (manhã) — rag-knowledge também 100% completo em produção**, o "mais um inteiro" pedido pelo Ricardo. Verificado na API ao vivo: 30 capítulos, 120 `media:img` + 60 `media:video` (exato). Uma interrupção overnight (ComfyUI reiniciou sozinho, PIDs mudaram) deixou 50 vídeos pendentes pela manhã — resolvido com `resume_rag_knowledge_videos.py` (achei e corrigi um bug de schema no meio do caminho: o arquivo de prompts dos caps 1-15 guarda `chapters` como ARRAY indexado por posição, não por número de capítulo — `data.chapters[str(cap)]` falha, precisa de `data.chapters.find(c => c.n === cap)`; caps 16-30 usam um schema diferente, `data[str(cap)][slot]` direto). **4 cursos completos agora**: chatgpt-zero, primeiras-automacoes, aprenda-a-usar-ia-no-dia-a-dia, rag-knowledge — todos com texto único por capítulo, mídia ancorada no conteúdo real, deploy confirmado, marcadores 100%.
- **⚠️ AO RETOMAR:** conferir se os 6 agentes terminaram (podem ter caído por spend-limit como já aconteceu 1x — se a pasta `course_media/<slug>/inline/` tiver poucos arquivos e nenhum manifest, relançar seguindo o mesmo padrão de prompt usado nesta sessão, arquivo por arquivo em `scripts/cursos/content_drafts/*_prompts_*.json` tem os prompts já escritos, não precisa reescrever). Depois: revisar amostra de imagens/vídeos de cada lote → instalar mídia em `public/cursos/media/<slug>/inline/` (adaptar `install_course_inline_media.sh` por slug) → commit+push+deploy → **SÓ DEPOIS** `node scripts/cursos/insert-course-inline-markers.cjs <slug> --apply` nos 3 cursos (script já genérico e 100% estrutural, ver acima) → thumbs/beta Expert/cron pendentes do handoff 17/07 continuam na fila.

**🗓️ 19/07 (tarde) — Ricardo assume revisão de conteúdo dos 4 cursos ao longo da semana; eu sigo com o resto do masterplan + saúde do site.**
- [✅] **0.5 Hardening de animação — FEITO de verdade.** Hook compartilhado `src/hooks/useTabHiddenAtMount.ts` (checa `document.visibilityState` uma vez, via lazy initializer do `useState` — necessário p/ afetar a prop `initial` do framer-motion, que só é lida no mount; `useEffect` chegaria tarde demais). Aplicado em `ArcadeVisual.tsx` e `TrailMap.tsx` (ambos usavam `initial={{opacity:0,...}}` sem nenhum guard — risco real de ficar preso invisível se a aba abrir em segundo plano). `CourseReaderPage.tsx`'s `useRevealOnVisible` refatorado pra usar o mesmo hook (era uma checagem inline duplicada). `tsc --noEmit` e `eslint` limpos (0 erros) nos 4 arquivos. **Limitação da verificação:** ArcadeVisual e TrailMap ficam atrás de login — não consegui testar visualmente sem credencial seguindo as regras de segurança (não faço login no lugar de ninguém). Verificado via tipo/lint + revisão manual do diff; vale um teste seu com Chrome visível quando puder.
- [~] **P.3 Funil PostHog — instrumentado, mas com uma ressalva importante.** PostHog já estava integrado (posthog-js, autocapture ligado) mas só tinha 3 eventos custom no código inteiro (`$pageview` auto, `user_signed_up`, `signup_google_clicked`) — o funil "nó→aula→minigame→cadastro" nunca foi de fato instrumentado, só documentado. Adicionei: `trail_node_click` (TrailMap, clique num nó do "Seu caminho para dominar IA"), `lesson_view` (CourseReaderPage, toda vez que o capítulo ativo muda), `minigame_start`/`minigame_complete` (PalpiteGame, com categoria/acerto/modo-treino).
  - ⚠️ **Achado que muda a leitura do funil**: o PalpiteGame tem um comentário no próprio código dizendo que é "o mesmo jogo da landing, jogável DENTRO do portal" — ou seja, ele já morou na landing (visitante anônimo) e foi movido pra dentro do Arcade (atrás de login) no item 0.1. Isso significa que hoje o "minigame" acontece DEPOIS do cadastro, não antes — o funil como documentado ("nó→aula→minigame→cadastro" terminando em cadastro) não bate mais com a arquitetura atual. Os eventos que instrumentei são de qualquer forma dados úteis (engajamento pós-cadastro: quantos alunos exploram a trilha, leem aulas, jogam minigames), mas não formam o funil de CONVERSÃO pré-cadastro que o documento original descrevia. **Preciso da sua leitura**: quer reviver uma versão leve do minigame na landing (pré-cadastro) pra fechar o funil como concebido, ou redefinir o funil como engajamento pós-cadastro (o que já está instrumentado agora)?
- [ ] **P.2 Auditor hermes — investigado, não é algo que eu resolvo daqui.** É infraestrutura só de VPS (`/root/kirmes/course_quality_audit.sh` + `course_audit_prepare.js` + binário `hermes` em `/opt/hermes/.venv/bin/`), nada disso está espelhado neste repo local — confirmei via busca exaustiva. A única pista sobre o que trava em "cursos grandes" é uma frase solta ("trava o cron diário") sem log ou stack trace. Pra consertar de verdade eu precisaria acessar a VPS via SSH e trabalhar direto nos scripts de lá (ou você trazer os scripts pro repo primeiro). Não tentei nada às cegas dado que é infra de produção. Fica registrado como bloqueado até você decidir a via de acesso.
- [~] **7.5 Analytics do USS — mapeado, backend já existe.** `Uss/docs/ANALYTICS_SYSTEM.md` é doc antigo/aspiracional (nomes não batem 1:1 com o código atual), mas o back-end real já está pronto: `SocialAccount`/`SocialPost`/`SocialAnalytics` (models) + `/api/social/analytics` (GET, agrega por plataforma, funcional, não é stub) + `/api/social/sync-due` (cron). O que falta é só a CAMADA VISUAL pro usuário — hoje só existe uma versão admin-only em `src/app/[locale]/admin/social/page.tsx`. "UI de analytics dedicada" (item 7.5) provavelmente quer dizer portar/adaptar essa view pro portal do usuário (aba "Perfil Social"), não construir back-end do zero. Ainda não construí a UI — próximo item se a fila permitir.

**Segunda-feira com o Ricardo:** roteiro de validação dos itens [~] (cada fase abaixo tem o critério de aceite) · vereditos: piloto cap.1 + Fases 2-7 · veredito da auditoria do catálogo (§6) · veredito do motor de prompts únicos (acima) · depois Fase 8 (motor Expert completo, só após 2+3 validados) · pendentes de código: 7.4 (credenciais dele), 7.5 (analytics UI), 1.4/1.5 (auditor hermes), 1.6 (guia blog, não prioritário), 0.5 hardening (escopo maior que o previsto — ver nota abaixo).

**O que o Ricardo já validou (✅ dele, de verdade):**
- 0.1 Palpite em 30s DENTRO do Arcade — aprovado com elogio à decisão ("usuário completionist não se sente jogado de volta à tela inicial").
- XP honesto (F5 3×) · Thumbs Arcade · Calendário Desafios · Vídeos LTX dos minigames.
- Tabela de modelos da Fase 1 (com correção dele: Gemini 3.5 Pro) → registry aplicado e VERIFICADO em prod (Opus 4.8/Sonnet 5/GPT-5.6 no ar).
- **17/07: Badges top-3+"+N" (0.6) · Banner "Sua Persona" acima do Ecossistema (0.7, deploy c03d087) · Quiz anti-óbvio — os três aprovados.**

**Aguardando validação do Ricardo `[~]`:** nomes novos visíveis nas aulas (1.3) — abrir qualquer curso e ver Opus 4.8/Sonnet 5/GPT-5.6 citados, zero modelos velhos.

**Decisões do Ricardo registradas em 17/07 (item 1.6):**
- Formato: **guia evergreen no blog** (série `guia-*`, com `{{fact:}}` desde o nascimento).
- Lista: Unsloth Studio · LLM Arena · OpenRouter · Ollama/LM Studio · ComfyUI · NotebookLM.
- Expansão pedida por ele: pesquisar **repos de muito sucesso no GitHub**, explicar **agentes** (o que são, como essas ferramentas os afetam), **Higgsfield** e outros que fizerem sentido. **NÃO é prioridade** — entra bem especificado aqui, mas a prioridade é seguir o MASTERPLAN e ter o site perfeito. Fazer quando a fila permitir.

**Ordem imediata:**
1. **FASE 2 — Leitura 2.0**: item 2.1 (mídia inline) + 2.5 (piloto de 1 capítulo do chatgpt-zero para aprovação DELE antes de escalar). Specs completas na Fase 2 abaixo.
2. Paralelo P.2: auditor hermes p/ cursos grandes (chip pendente no painel) — destrava 1.4/1.5.
3. Continuam nas mãos do Ricardo: PIX real · FB/IG · cupom TikTok · Turnstile · Vidente (P.1) · veredito 1.3.

**Regras de ouro (não esquecer):** §1 regra do PRONTO (só Ricardo promove a ✅; reportar "mudou no código, teste assim") · piloto antes de escalar · memória `feedback-regra-do-pronto` · Chrome dele minimizado congela animações (testar com janela visível) · mudanças no Atlas = produção NA HORA.

---

## §1. PROCESSO — a regra do PRONTO (o que mudou depois de 16/07)

O problema: itens foram reportados como "verificados" com checagens técnicas (DOM, typecheck, API 200) que **não equivalem a um usuário real usando**. Com o Chrome minimizado, animações congelam e abas do portal nem trocam — parte das validações reais era impossível e mesmo assim virou "✅". Isso não pode se repetir.

**Novas regras, válidas para toda sessão:**
1. Um item só recebe ✅ quando **o Ricardo confirmar** que funciona (ou quando testado de ponta a ponta em produção com browser visível, dizendo explicitamente COMO foi testado).
2. Todo item deste plano tem um **critério de aceite** = o teste que o Ricardo faz em 30 segundos. Sem critério claro, o item não está bem definido.
3. Status possíveis: `[ ]` a fazer · `[~]` código no ar, AGUARDANDO validação do Ricardo · `[✅]` validado pelo Ricardo · `[✗]` reprovado (volta com nota do que falhou).
4. Relatórios de sessão separam sempre: "mudou no código" ≠ "funciona para o usuário".
5. Trabalho grande (Leitura 2.0, Studio) começa por um **piloto pequeno aprovado pelo Ricardo** antes de escalar.

---

## §2. AUDITORIA HONESTA — o que foi dado como pronto × estado real

| Item | O que existe no código (deploys de 16/07) | Status | Como testamos juntos |
|------|------------------------------------------|--------|---------------------|
| Palpite em 30s abre | Card virou `<a href="/">` nativo; landing renderiza o jogo p/ logados; sem redirect achado; sem service worker | `[✗]` **Ricardo reprovou** — diagnóstico pendente | Fase 0: você clica com DevTools aberto e vemos juntos o que acontece (nada? navega? volta?) |
| Vídeos LTX nos minigames | 24 loops no ar | `[✅]` **Ricardo aprovou** ("funcionando ok!") | — |
| Fix XP infinito / streak | Comparação corrigida; XP estável em reloads (testado em prod via DOM) | `[~]` | Recarregue o portal 3× e veja se o XP não sobe; streak deve crescer amanhã |
| Quiz anti-óbvio (certificado) | Prompt novo + shuffle server-side | `[✅]` **Ricardo aprovou 17/07** | — |
| Badges fora da foto | Prateleira → Badges 2.0 (top-3 + "+N") | `[✅]` **Ricardo aprovou 17/07** (via 0.6) | — |
| Thumbs do Arcade contidas | max-w + 16:9 | `[~]` | Abrir Minigames em tela cheia |
| Calendário dos Desafios | max-w-sm | `[~]` | Abrir Desafios |
| Card "Sua Persona" + col 3 sticky | Acima do Ecossistema FayAI | `[✅]` **Ricardo aprovou 17/07** (via 0.7) | — |
| Deep-link `?tab=` + links cruzados Conta↔Perfil | Implementado | `[~]` | Minha Conta → botão "Meu Perfil" |
| Fatos voláteis (registry) | `{{fact:}}` resolvido na entrega; 95 menções tokenizadas | `[~]` PORÉM **valores continuam os antigos** — ver Fase 1 | Depois da Fase 1: abrir claude-ia-segura e ver modelos ATUAIS citados |
| Ilustrações chatgpt-zero | 31 artes no header/galeria por seção | `[✗]` **Reprovado como solução** — viraram "3 imagens no topo + parede de texto". Vira insumo da Leitura 2.0 (Fase 2) | — |
| Persona no gerador USS | socialPersona injetado no prompt (provado por E2E) | `[~]` | Perfil Social → Publicar → Gerar: o texto deve falar dos SEUS interesses |
| **Studio AI** | **NADA feito** (sempre esteve na fila) | `[ ]` | — |
| **Certificados redesign** | Só arte no card de stats; o certificado gigante segue igual | `[ ]` | — |
| **Persona no Meu Perfil (formulário)** | **NADA feito** (só o card no dashboard) | `[ ]` | — |
| **Ranking redesign / Assistente IA** | Só arte no header do Ranking | `[ ]` | — |
| Conteúdo customizado para o Ricardo (Expert/beta) | **NADA feito** | `[ ]` | — |

---

## §3. A FILA ÚNICA — fases em ordem, uma a uma, juntos

### FASE 0 — Sessão de verificação conjunta + consertos na hora (1 sessão, COM o Ricardo)
> Objetivo: zerar a tabela do §2 — cada `[~]` vira `[✅]` ou `[✗]`+fix imediato.
- [✅] 0.1 **Palpite em 30s** — VALIDADO PELO RICARDO 17/07: PalpiteGame extraído, joga dentro do Arcade, XP direto na conta (idempotente, modo treino). Nota dele: melhor assim, o completionist quer tela dedicada, não ser jogado à home. (deploy c03d087)
  - Nota de diagnóstico da sessão: o estado "congelado/esmaecido" que aparecia nos MEUS testes era a janela do Claude cobrindo o Chrome (occlusion correta do navegador) — não era bug do site para o usuário. Hardening anti-congelamento continua valendo como robustez (item 0.5).
- [ ] 0.5 **Hardening de animação**: quando `visibilityState==='hidden'` no mount ou rAF morto, renderizar conteúdo direto visível (sem entrance) — usuários que abrem a aba em segundo plano nunca veem tela em branco.
- [x] 0.2 Roteiro de validação executado pelo Ricardo em 16/07 (noite). Resultado:
  - ✅ XP honesto (3× F5, idêntico) · ✅ Thumbs Arcade · ✅ Calendário Desafios
  - ✅ Badges fora da foto, MAS: design das badges desatualizado E a prateleira não escala (imagine as dezenas de conquistas futuras sob a foto) → **0.6**
  - ✅ Card Sua Persona existe, MAS escondido → deve ficar ACIMA do "Ecossistema FayAI" → **0.7**
  - ✅ Botão Conta↔Perfil existe, MAS a seção Persona real deve ser VISUAL: thumbnails clicáveis como entrada principal, texto só como fallback → spec da FASE 3 atualizada
  - ⏳ Quiz anti-óbvio: Ricardo valida depois
  - ⏳ Gerador USS: incompleto por definição até a Fase 3 (persona rica)
- [✅] 0.6 **Badges 2.0** — VALIDADO PELO RICARDO 17/07: avatar mostra só top-3 tiers + chip "+N".
- [✅] 0.7 **Card Sua Persona em destaque** — VALIDADO PELO RICARDO 17/07: acima do "Ecossistema FayAI", visível sem rolar (deploy c03d087).
- [ ] 0.4 Registrar resultados (este bloco) — FEITO 16/07.

### FASE 1 — Conteúdo fala do PRESENTE (1 sessão; primeira metade sem depender de você)
> Você apontou: os cursos citam exatamente os modelos velhos. O registry existe mas mantive os valores antigos por segurança. Agora é atualizar de verdade.
- [x] 1.1 Pesquisa feita (16-17/07): GPT-5.6 Sol · Opus 4.8/Fable 5 · Sonnet 5 · Kimi K3 (16/07) · Gemini 3.5 Flash/Pro · GPT Image 2 · Nano Banana Pro · Midjourney v8 · Kling v3 · Veo 3.1 · Runway Gen-4.5.
- [x] 1.2 **Tabela APROVADA pelo Ricardo** (17/07), com correção dele: Gemini 3.5 Pro (não 3.1) + pedido de incluir geradores de imagem/vídeo.
- [x] 1.3 Registry atualizado (14 chaves) e **VERIFICADO em produção**: claude-ia-segura cita Opus 4.8 (19×) e Sonnet 5 (9×), zero menções antigas. Primeira atualização real do motor. `[~]` p/ validação visual do Ricardo em qualquer curso.
- [ ] 1.4 Varredura das menções NÃO tokenizadas (GPT-4o, Claude 3, `sonnet-4-...` em código): auditor decide caso a caso (histórico legítimo × desatualização) e propõe patch por aula com aprovação.
- [ ] 1.5 **Cobertura de labs ausentes**: onde o texto deveria citar players novos (Kimi/Moonshot etc.) e não cita — vira patch proposto pelo pipeline do auditor.
- [ ] 1.6 **Guia evergreen no blog: ferramentas dos profissionais** (DECIDIDO pelo Ricardo 17/07 — formato: série `guia-*` no blog IA Hoje, `{{fact:}}` desde o nascimento). Ferramentas que profissionais usam e o usuário comum desconhece mas se beneficiaria muito:
  - Lista aprovada: **Unsloth Studio · LLM Arena (lmarena) · OpenRouter · Ollama/LM Studio · ComfyUI · NotebookLM**.
  - Expansão pedida por ele (17/07): pesquisar **repos de muito sucesso no GitHub** (curar os que agregam valor real ao usuário comum); explicar **agentes de IA** — o que são e como essas ferramentas os afetam/potencializam; incluir **Higgsfield** e outros que a curadoria julgar convenientes.
  - **Prioridade: BAIXA por ordem explícita dele** — "isso deve entrar no masterplan bem explicado para fazermos, mas não é nossa prioridade; seguir o masterplan e ter o site perfeito é a prioridade". Fazer quando a fila das fases permitir.
  - Aceite: ele lê o primeiro guia publicado no blog e aprova tom + utilidade.
- Dependência: 1.4/1.5 precisam do **auditor hermes consertado p/ cursos grandes** (chip já criado; chunking por módulo + pular quem falha 2×).

### FASE 2 — LEITURA 2.0 (a maior e mais importante; 2-3 sessões; piloto aprovado antes de escalar)
> Spec do Ricardo (16/07): imagens **no trecho a que se referem**, em pontos importantes/difíceis onde ajudam a compreensão; **4-5 imagens + no mínimo 2 vídeos por capítulo**; capítulos **menores**; design bonito e palatável; e o conteúdo refletindo a persona (Expert).
- [~] 2.1 **Arquitetura de mídia inline** — IMPLEMENTADA 17/07 (madrugada): marcadores `media:img`/`media:video` (comentários HTML com id/src/poster/caption) que o reader renderiza NO PONTO via `InlineMediaFigure`/`InlineMediaVideo` (moldura, legenda, reveal suave com hardening anti-aba-oculta; vídeo mudo, loop, `preload="none"`, poster, play/pause por visibilidade). Verificado no dev local por DOM: 6 figuras no ponto certo, zero marcador cru. Aguarda deploy + validação do Ricardo.
- [~] 2.2 **Passe editorial por capítulo**: feito À MÃO para o cap.1 do piloto (6 pontos: sistema-em-camadas, intenção×execução, fluxo 5 passos VÍDEO, ideias→planos, validação, checklist VÍDEO — prompts espelhando O TRECHO). Automatizar via LLM ao escalar. As 31 artes header viram acervo onde couberem.
- [~] 2.3 **Capítulos menores** — FEITO 17/07 (local): `buildReaderSections` agora divide por TEMPO (seções ≤9 min; capítulo longo quebra nos `##` em blocos de ~5-7 min; funde sobras <2 min). chatgpt-zero: 15 "Partes" de 12+ min → **31 seções de ~6 min** (verificado no DOM local). Sem deploy (diretriz 17/07).
- [~] 2.4 **Design da página de leitura** — FEITO 17/07 (local): sistema de seções com ícone+cor consistente nas 8 seções recorrentes (Visão Geral/Conceitos/Fluxo/Cenários/Erros/Exercício/Checklist/Resumo) + callouts novos por prefixo de blockquote ("Erro comum:"/"Atenção:" rosa · "Exemplo:"/"Na prática:" ciano · Dica/Dica Pro âmbar). Passes de iteração visual COM você ficam para a validação final.
- [~] 2.5 **PILOTO cap.1 chatgpt-zero**: mídia GERADA E INSTALADA (4 webp ≤47KB + 2 webm ≤181KB em `public/cursos/media/chatgpt-zero/inline/`; receitas Qwen 2512 + LTX 2.3 I2V comprovadas). Marcadores prontos (`insert-cap1-inline-markers.cjs`) — aplicar no Atlas SÓ DEPOIS do deploy do reader (ver armadilha abaixo). Critério de aceite: abrir cap.1 e ver 4 imagens + 2 vídeos no ponto do texto.
- Aceite da fase: você lê um capítulo e diz "é isso".
- ⚠️ **ARMADILHAS DESCOBERTAS 17/07** (não repetir):
  1. **Comentários HTML NÃO são invisíveis no react-markdown v10** — viram TEXTO ESCAPADO na tela (a premissa do ARQUITETURA_CONTEUDO_DINAMICO estava errada). Marcadores no Atlas só APÓS o reader novo estar em produção. Houve exposição de ~1h de marcadores crus no cap.1 na madrugada de 17/07 (restaurado do backup `products_backup_leitura20_20260717`). Vale também para os slots `exemplo` da Camada 2 (Fase 3)!
  2. **Literal `<!--`/`-->` em fonte TSX mata a rota no Turbopack** — 404 silencioso, sem erro de build. Montar via `new RegExp("<"+"!--...")`.
  3. **Turbopack dev usa nomes de chunk SEM hash** — o browser cacheia chunk velho mesmo após restart do server; verificação local exige refresh do cache HTTP dos chunks (`fetch(src, {cache:"reload"})` + reload). Em produção não afeta (chunks com hash).
  4. Prompt de imagem com "seal/badge/placa" gera TEXTO embaralhado na arte — usar conceitos sem texto (carimbo de cera em branco etc.).

### FASE 3 — PERSONA COMPLETA + conteúdo customizado para VOCÊ (beta tester Expert) (1-2 sessões)
- [~] 3.1 **Meu Perfil → seção "Sua Persona"** — FEITO 17/07 (local): `PersonaSection.tsx` no topo do Meu Perfil com tiles visuais clicáveis para as 5 dimensões (setor 8 · tom 6 · objetivos 7 · tipos de conteúdo 6 · momento com IA 3), texto só como fallback ("Outro? Digite e Enter"), barra de completionPercent, bloco "o que o site já aprendeu" (temas/hashtags/estilo/público do socialPersona). E2E local: selecionar → salvar → 100% persistido (XP na 1ª vez via API existente). Thumbnails §12: prompts prontos em `generate_persona_thumbs.py` (roda pós-batch; tiles caem em gradiente+emoji até lá).
- [~] 3.2 **Slots de exemplo** — script pronto (`insert-cap1-exemplo-slots.cjs`): 2 slots nos parágrafos de Cenários Aplicados do cap.1. ⚠️ Aplicar no Atlas SÓ no deploy final (reader antigo mostraria comentário cru). Reader novo já engole qualquer comentário (guard).
- [~] 3.3 **Gerador de exemplos por persona (motor Expert v1)** — FEITO 17/07 (local): `POST /api/user/course-examples/generate` (Expert/admin; LLM tier budget reescreve o exemplo padrão para o contexto do aluno; grava em `userCourseExamples`) + content API injeta os exemplos no miolo dos slots para Expert. Beta na SUA conta: rodar após deploy final + slots aplicados.
- Aceite: você lê o piloto e os exemplos são sobre você/seus projetos.

### FASE 4 — STUDIO AI revitalização (1 sessão cheia)
> 🚨 DESCOBERTA 17/07: o Studio em produção estava QUEBRADO em 4 dos modelos (Flux/SD/Recraft saíram do OpenRouter — "invalid model ID", incluindo o default flux-1-schnell). Catálogo reconstruído com 7 modelos REAIS, todos verificados com geração de verdade.
- [~] 4.1 Free — FEITO 17/07 (local): 2 modelos grátis (Nano Banana/gemini-2.5-flash-image + Gemini 3.1 Lite) com cota de 2 gerações/DIA (antes: 1 imagem PARA SEMPRE).
- [~] 4.2 Pagos — FEITO 17/07 (local): cota diária por tier (free 2 · explorador 15 · profissional 40 · expert 120) + catálogo único `src/lib/studio-models.ts` compartilhado API↔UI com gating por plano (Gemini 3.1 Flash · Gemini 3 Pro · Nano Banana Pro · GPT Image Mini · GPT Image 2).
- [~] 4.3 Edição/consistência — FEITO 17/07 (local): botão "Usar imagem de referência" (upload → dataURL) roteia para o omni google/gemini-3-pro-image-preview com conteúdo multimodal; mantém personagem/estilo.
- [~] 4.4 UI — FEITO 17/07 (local): Select → grid de cards com THUMBNAIL REAL por modelo (mesmo prompt de referência gerado em cada um — `public/portal/studio/*.webp`, 15-37KB) + explicação de uso + badge de plano + chip de cota "N/M hoje".
- [~] 4.5 Composer — FEITO 17/07 (local): `mediaPrompt` do gerador USS agora aparece no Composer com botão "Criar imagem" → gera no Studio e anexa a URL ao post (IG exige imagem).
- Aceite: você gera imagem no free e no expert e vê a diferença clara de oferta.

### FASE 5 — CERTIFICADOS redesign (½-1 sessão)
- [~] 5.1 FEITO 17/07 (local): fim do "super mega certificado" — grid 2 colunas de cards compactos (thumb da arte + hover "Ver certificado"); clique expande para largura total com a arte completa, verificação e ações; botão Fechar.
- [~] 5.2 FEITO 17/07 (local): seção "Onde usar seu certificado" (LinkedIn/Currículo/Verificação pública) + botão "Adicionar ao perfil" com deep-link oficial do LinkedIn (entra direto em Licenças e certificados com certId e URL de verificação).
- [~] 5.3 FEITO 17/07 (local): entrada em stagger, hover lift, expansão com layout animation e scale-in da arte.
- Aceite: a aba Certificados fica bonita na sua tela sem rolar um metro.

### FASE 6 — RANKING + ASSISTENTE IA (1 sessão, com Chrome visível p/ iterar)
- [~] 6.1 FEITO 17/07 (local): avatares com FOTO real (campo image era ignorado — iniciais só como fallback), linha "Você #N" fixada no fim da lista quando você está fora do top exibido, badges de plano normalizados (PRO/EXPERT/EXPLORADOR). Pódio/arte da casa mantidos. Passe visual fino COM você na validação final.
- [~] 6.2 FEITO 17/07 (local): Assistente virou **Tutor FayAI** — system prompt com persona do aluno (setor/objetivos/nível) + cursos matriculados + próximos passos concretos na plataforma; agora tem MEMÓRIA da conversa (histórico das últimas 8 trocas); trocado o modelo quebrado 'openrouter/free' pelo provider unificado com fallback (free→budget por plano).

### FASE 7 — USS nível 2 (1-2 sessões)
- [~] 7.1 FEITO 17/07 (local): `POST /api/social/sync-due` (cron VPS, header x-social-secret, mesmo padrão do publish-due) — sincroniza métricas das contas ativas de TODOS os usuários (lote 25, lastSync>20h) E refina a persona pelo engajamento real: hashtags dos 10 posts com melhor engagementRate (30d) viram `socialPersona.topHashtags` ponderadas. Falta no deploy: adicionar o cron na VPS (1×/hora, curl -X POST -H "x-social-secret: $SOCIAL_CRON_SECRET" https://fayai.com.br/api/social/sync-due).
- [~] 7.2 FEITO 17/07 (local): manchetes de IA das últimas 48h (hub IA Hoje, coleção ainews) entram no prompt do gerador — post nasce ancorado no assunto do dia (generatePosts e analyzeTrends).
- [~] 7.3 FEITO 17/07 (local): nova action modular `generateMediaPrompt` (prompt de imagem para post JÁ escrito) somando às existentes generatePosts/generateHashtags/analyzeTrends; Composer agora captura o mediaPrompt e cria a imagem com 1 clique (4.5).
- [ ] 7.4 Plataformas: Twitter/Pinterest (apps SEUS — bloqueado nas suas credenciais, P.1) → LinkedIn/TikTok.
- [ ] 7.5 Analytics do USS (ANALYTICS_SYSTEM.md) — próxima sessão (UI de analytics dedicada).

### FASE 8 — MOTOR EXPERT COMPLETO (o diferencial; depois de 2+3 provados)
- [ ] 8.1 Curso inteiro gerado/adaptado pela persona (texto+exemplos+imagens do contexto do aluno).
- [ ] 8.2 Superfície de venda: deixar claro no site que Expert = conteúdo feito para VOCÊ.
- [ ] 8.3 Piloto com a sua conta → depois abrir.

### PARALELO CONTÍNUO (não bloqueia fases)
- [ ] P.1 **Seus 30 min**: PIX real · conectar FB/IG · resgatar cupom TikTok (ler condições) · Turnstile · testar Vidente.
- [ ] P.2 Auditor hermes: chunking p/ cursos grandes (chip pronto) — desbloqueia 1.4/1.5.
- [ ] P.3 QA + funil PostHog (F6 antigo) — instrumentar nó→aula→minigame→cadastro.
- [ ] P.4 Vigias de toda sessão: GSC, logs VPS, banda Netlify, courseaudits.

---

## §4. ESPECIFICAÇÕES DE REFERÊNCIA
- Identidade visual e receitas de geração: `IDENTIDADE_VISUAL.md` (§12 fusão; Liga B §10).
- **Stack de mídia local (ComfyUI): `../PESQUISA_COMFYUI_2026-07-25.md`** — inventário real, o que mudou v0.20→v0.28, downloads prioritários. Skills: `comfy-local` (hub/imagem) · `comfy-video` (vídeo + pós) · `comfy-audio` (música/SFX/TTS) · `comfy-character` (consistência) · `comfy-fayai` (reels).
- Arquitetura de conteúdo (fatos/slots/mídia): `ARQUITETURA_CONTEUDO_DINAMICO.md` (a Camada 3 muda na Fase 2: header → inline).
- Visão USS/motor: `../Uss/docs/engine/` (prompts prontos §10) + memória `project_uss_engine`.
- Infra/comercial herdado: `PENDENCIAS_2026-07-15.md` (continua válido no que não conflita).

## §5. COMO TRABALHAREMOS
Uma fase por vez, na ordem. Dentro da fase, itens um a um: eu implemento → marco `[~]` → **você testa pelo critério de aceite** → `[✅]` ou `[✗]` com nota. Este arquivo é atualizado A CADA sessão (status + datas). Se algo novo surgir, entra AQUI primeiro, nunca só na conversa.

---

## §6. AUDITORIA DO CATÁLOGO — 18/07 (pedida por Ricardo, resultado preliminar)

**Gatilho:** ao planejar replicar o tratamento do chatgpt-zero (Leitura 2.0) para outros cursos, descobri que os "487/412 matrículas" vistos em `fayapoint.courses.enrollments` são dado de teste — Ricardo confirmou que não são reais. Isso invalidou o critério de priorização por popularidade, e ele pediu uma auditoria de conteúdo do catálogo inteiro antes de investir mais GPU em qualquer curso fora dos 2 gêmeos do chatgpt-zero.

**Método:** para os 25 cursos em `fayapoint.courses`, comparei `courseContent` (`fayapointProdutos.products` — a fonte real que o reader renderiza) por curso: contagem de H1 reais, detecção de frases de 15+ palavras repetidas dentro do mesmo curso, e similaridade Jaccard (shingles de 12 palavras) entre pares de cursos.

### Achado 1 — duas eras de geração de conteúdo coexistem no catálogo
- **Templada (boilerplate 30-"capítulos"):** chatgpt-zero, primeiras-automacoes, aprenda-a-usar-ia-no-dia-a-dia, rag-knowledge, ia-producao, automacao-n8n, midjourney-masterclass (archived), mastering-ai-with-chatgpt (archived), perplexity-pesquisa-inteligente-e-conhecimento-instantaneo. Todos têm 900-1000+ trechos de 15+ palavras repetidos dentro do próprio curso — é o esqueleto fixo do gerador (frase conectora igual, palavra-tema trocada), não é um bug por si só: é exatamente o material que a Leitura 2.0 (mídia inline + capítulos menores) transformou em algo ótimo no chatgpt-zero. O problema é quando esse esqueleto NÃO recebeu o mesmo tratamento.
- **Editorial (H1s únicos, comparativos "X vs Y vs Z", conteúdo específico por seção):** chatgpt-masterclass, chatgpt-allowlisting, claude-ia-segura, claude-cowork-colaboracao, gemini-ia-google, leonardo-ai-criacao-visual, make-integracao-total, midjourney-arte-profissional, n8n-automacao-avancada, banana-dev-deploy-ia (archived), openclaw-ia-open-source, perplexity-pesquisa-inteligente (archived), prompt-engineering, crie-agentes-de-ia-autonomos, ia-sem-filtro-por-claude (sagrado), autoresearch-singularity. Zero duplicação interna detectada — qualidade editorial real, mas SEM o tratamento Leitura 2.0 (mídia inline) porque o `courseContent` deles não usa "# Capítulo N:" — usa 13-20 H1 livres, cada um um artigo próprio. Confirma o que já era esperado: âncoras estruturais tipo `insert-course-inline-markers.cjs` não são reaproveitáveis aqui, precisam de âncora manual por seção (como foi o piloto do cap.1 do chatgpt-zero, antes de escalar).

### Achado 2 — pares de cursos publicados cobrindo o MESMO tema ao mesmo tempo
| Tema | Curso A | Curso B | Situação |
|---|---|---|---|
| Perplexity | `perplexity-pesquisa-inteligente` (archived, editorial, R$37, 13 H1) | `perplexity-pesquisa-inteligente-e-conhecimento-instantaneo` (published, templado, R$79, 30 caps) | Mesmo título quase idêntico. O archived tem conteúdo editorial de verdade; o published é o boilerplate genérico. |
| n8n | `automacao-n8n` (published, templado, R$99, "40 aulas") | `n8n-automacao-avancada` (published, editorial com "vs Make vs Zapier", R$199, "180 aulas") | **Os DOIS estão live agora**, mesma ferramenta, preços e profundidade diferentes. |
| Midjourney | `midjourney-arte-profissional` (published, editorial, R$79) | `midjourney-masterclass` (archived, templado) | Já resolvido — o fraco está arquivado. Padrão a repetir nos outros pares. |
| ChatGPT | `chatgpt-zero` (published, templado+Leitura2.0, R$29, vitrine) | `chatgpt-masterclass` (published, editorial "avançado", R$149) · `chatgpt-allowlisting` (published, ângulo enterprise/SEO, bem diferente) · `mastering-ai-with-chatgpt` (archived, templado em inglês) | zero + masterclass parecem complementares (funil iniciante→avançado, não duplicata); allowlisting é claramente distinto; mastering-ai-with-chatgpt é o candidato mais claro a retirada definitiva (duplicata em inglês do zero, já arquivado). |
| Agentes de IA / produção | `openclaw-ia-open-source` (published, editorial, ferramenta específica) · `crie-agentes-de-ia-autonomos` (published, editorial, "como construir": ReAct, Function Calling, Claude/OpenAI Agent SDK) · `ia-producao` (published, templado, genérico) · `banana-dev-deploy-ia` (archived, editorial, deploy/MLOps) | 4 cursos com fronteiras confusas entre "o que é um agente", "como construir um agente" e "como colocar IA em produção". **Este é o cluster que Ricardo pediu para reformular.** |

### Achado 3 — pedido específico do Ricardo: reformular openclaw-ia-open-source
Instrução literal: *"o openclaw open course deve ser reformulado para incluir e contemplar tudo que se trata desse assunto, qual a função de cada um: openclaw, hermes, e o que mais existir que funcione como eles."*

**Confirmado por Ricardo (18/07): "Hermes" = Hermes Agent, da Nous Research (hermes-ai.net).** Pesquisado via Browser pane — é um PEER direto do OpenClaw, não um modelo base: agente autônomo open-source (MIT, 101K+ stars no GitHub), model-agnostic (Claude/GPT/Gemini/Qwen/DeepSeek via API), com ciclo de aprendizado autoaprimorável (memória curada pelo próprio agente, FTS5 + Honcho para modelagem de usuário entre sessões), gateway único para 15+ plataformas de mensagem (Telegram, Discord, Slack, WhatsApp, Signal, Matrix, Mattermost, email, SMS, DingTalk, Feishu, WeCom, BlueBubbles, Home Assistant), sistema de skills compatível com agentskills.io (o agente cria e reutiliza as próprias skills), integração MCP, automações via cron, e roda em local/Docker/SSH/Daytona/Singularity/Modal com hibernação serverless. Instala com `curl | bash` + `hermes setup`.
- **Nota:** existe uma ferramenta interna do ecossistema FayAI também chamada informalmente "Hermes" (o "Hermes×MC auditor" mencionado em sessões de 14-15/07, memória `progress_uss_hermes`) — é uma coincidência de nome, NÃO é o Hermes Agent da Nous Research. Não confundir os dois ao escrever o curso.
- Próximo passo de conteúdo: escrever uma seção "OpenClaw vs Hermes Agent — comparativo sem filtro" seguindo o padrão editorial que o curso já usa (mesmo estilo do H1 existente "OpenClaw vs Claude Cowork vs ChatGPT"), cobrindo também outros agentes self-hosted relevantes do mesmo nicho (candidatos a pesquisar: OpenHands/OpenDevin, AutoGPT, CrewAI, LangGraph agents — validar quais ainda são relevantes em 2026 antes de incluir).
- Pendente de decisão dele também: se esse curso deve absorver o conteúdo de `crie-agentes-de-ia-autonomos` e `ia-producao` (merge) ou só ganhar mais seções mantendo os outros dois separados.

### Recomendação preliminar (aguardando veredito do Ricardo)
- [ ] **Retirar definitivamente** `mastering-ai-with-chatgpt` (archived, duplicata em inglês do chatgpt-zero, sem motivo para reviver).
- [ ] **Decidir merge Perplexity**: manter o editorial (`perplexity-pesquisa-inteligente`, hoje archived) como base e aposentar o templado published, OU aplicar Leitura 2.0 no editorial e então aposentar o templado — evita ter 2 cursos de Perplexity ativos.
- [ ] **Decidir merge/reposicionamento n8n**: os dois estão published simultaneamente — definir se `automacao-n8n` vira "iniciante" com diferenciação real de `n8n-automacao-avancada`, ou se é aposentado/mesclado.
- [ ] **Reformular `openclaw-ia-open-source`** (aguardando esclarecimento sobre "Hermes" + decisão sobre merge com `crie-agentes-de-ia-autonomos`/`ia-producao`).
- [ ] Cursos ChatGPT-based (`chatgpt-masterclass`, `chatgpt-allowlisting`) **ficam por último na fila** de qualquer novo investimento (Leitura 2.0, GPU, etc.) — instrução explícita do Ricardo, chatgpt-zero já cobre bem esse terreno.
- [ ] Sem decisão pendente: `rag-knowledge`, `ia-sem-filtro-por-claude` (sagrado, não mexer), `autoresearch-singularity`, `prompt-engineering`, `claude-ia-segura`, `claude-cowork-colaboracao`, `gemini-ia-google`, `leonardo-ai-criacao-visual`, `make-integracao-total`, `midjourney-arte-profissional` — não apareceram em nenhum par de duplicata, tratamento normal na fila.

**Script da auditoria:** `scripts/cursos/audit_courses.cjs` (rodar de novo se o catálogo mudar; salva raw em `audit_courses_raw.json` no scratchpad da sessão — não commitado).
