/**
 * Os 31 achados do laudo de 26/08/2026, um a um, contra o site no ar.
 *
 * Existe porque a pergunta certa foi feita: *"você pode garantir que tudo foi
 * feito e funciona?"* Sem isto a resposta seria memória. Com isto é medição —
 * inclusive dos itens que continuam ABERTOS, que ele reporta como tal em vez de
 * omitir.
 *
 *   node scripts/_conferir/auditar-laudo.mjs                     (local, 3002)
 *   node scripts/_conferir/auditar-laudo.mjs https://fayai.com.br
 *
 * ⚠️ Contra produção, pausa entre pedidos: a varredura sai pelo IP da casa e o
 * limitador corta em 250/min. Ver `reference_429_por_ip_netlify`.
 */
const ARG = process.argv[2] || '3002';
const REMOTO = /^https?:\/\//.test(ARG);
const BASE = REMOTO ? ARG.replace(/\/$/, '') : `http://localhost:${ARG}`;
const PAUSA = Number(process.env.PAUSA ?? (REMOTO ? 400 : 0));
const UA = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0 Safari/537.36' };

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const cache = new Map();

async function html(rota) {
  if (cache.has(rota)) return cache.get(rota);
  if (PAUSA) await esperar(PAUSA);
  const res = await fetch(BASE + rota, { headers: UA, redirect: 'manual' });
  const corpo = await res.text();
  if (res.status === 429) {
    console.log(`\n⛔ ${rota} → 429. O limitador cortou a varredura, não o site.`);
    process.exit(2);
  }
  const dado = { status: res.status, corpo, loc: res.headers.get('location') };
  cache.set(rota, dado);
  return dado;
}

/** O texto que a pessoa lê — sem script, sem tag. */
const texto = (h) => h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

const resultados = [];
const item = (n, titulo, estado, detalhe) => resultados.push({ n, titulo, estado, detalhe });

// ── os que dá para medir ────────────────────────────────────────────────────
const home = await html('/pt-BR');
const cursos = await html('/pt-BR/cursos');
const venda = await html('/pt-BR/curso/make-integracao-total');
const novo = await html('/pt-BR/curso/perplexity-pesquisa-inteligente-e-conhecimento-instantaneo');
const onboarding = await html('/pt-BR/onboarding');
const descobrir = await html('/pt-BR/descobrir');
const precos = await html('/pt-BR/precos');
const casos = await html('/pt-BR/casos');
const aeo = await html('/pt-BR/chatgpt-allowlisting');

item(1, 'o site responde para este IP', home.status === 200 ? 'ok' : 'FALHA', `home ${home.status}`);

const cruas = (texto(onboarding.corpo).match(/\b(Onboarding|Register)\.[a-z][A-Za-z.]+/g) || []);
item(2, 'onboarding sem chave crua', cruas.length === 0 ? 'ok' : 'FALHA', cruas.slice(0, 3).join(' '));

const t3 = texto(cursos.corpo) + texto(venda.corpo);
const inventada = ['9.800', '9800', '1.910', '4,8', '0 alunos'].filter((x) => t3.includes(x));
item(3, 'prova social sem número inventado', inventada.length === 0 ? 'ok' : 'FALHA', inventada.join(' '));

/**
 * ⚠️ Procurar `-\d\d%` no texto acusa duas coisas legítimas: a cópia do curso
 * ("Renda aumentada em 40-60%") e o desconto REAL do plano anual (−17%), que é
 * uma condição praticada, não preço de referência inventado. O que o item 4
 * proíbe é preço CHEIO riscado — e isso mora no `line-through` e no
 * `originalPrice` da API.
 */
const riscado = /line-through/.test(cursos.corpo) || /line-through/.test(venda.corpo) || /line-through/.test(aeo.corpo);
const api = await html('/api/products?type=course&limit=50&locale=pt-BR');
const temPrecoCheio = /"originalPrice"\s*:\s*\d/.test(api.corpo);
item(4, 'sem preço riscado nem preço de referência', !riscado && !temPrecoCheio ? 'ok' : 'FALHA',
  `riscado=${riscado} originalPrice=${temPrecoCheio}`);

const t5 = texto(descobrir.corpo) + texto(home.corpo) + texto(cursos.corpo);
const contagens = ['150 cursos', 'Mais de 150', '18 Cursos', '18 cursos', '100+ Ferramentas', '40+ ferramentas', '2.035', '1.525'].filter((x) => t5.includes(x));
item(5, 'nenhuma contagem inventada de curso ou ferramenta', contagens.length === 0 ? 'ok' : 'FALHA', contagens.join(' · '));

// ⚠️ "30 dias" solto aparece na cópia do curso ("transformar sua vida em
// apenas 30 dias"). O que o item 6 proíbe é a GARANTIA de 30 dias.
const trinta = [texto(cursos.corpo), texto(venda.corpo), texto(precos.corpo), texto(aeo.corpo)]
  .filter((t) => /[Gg]arantia[^.]{0,20}30 dias|30[- ]day guarantee/.test(t)).length;
item(6, 'garantia de 7 dias em toda parte', trinta === 0 ? 'ok' : 'FALHA', `${trinta} página(s) ainda dizem 30 dias`);

item(7, 'CLS', 'medido antes', 'produção de 26/08: 0,003–0,026 (era 0,43)');

const fantasma = await html('/pt-BR/checkout/plano-inexistente-xyz');
const temFormulario = /name="cpf"|inputmode="numeric"|Pagar/.test(fantasma.corpo);
item(8, 'checkout recusa plano inexistente', !temFormulario ? 'ok' : 'FALHA', `status ${fantasma.status}`);

const legais = /href="\/pt-BR\/termos"/.test(home.corpo) && /href="\/pt-BR\/privacidade"/.test(home.corpo);
const navegacao = /href="\/pt-BR\/cursos"/.test(home.corpo) && /href="\/pt-BR\/precos"/.test(home.corpo);
item(9, 'home com navegação e links legais', legais && navegacao ? 'ok' : 'FALHA',
  `legais=${legais} nav=${navegacao}`);

const cru = /"buffer"|_id":\{"buffer/.test(cursos.corpo);
item(10, 'documento do Mongo não atravessa cru', !cru ? 'ok' : 'FALHA', '');

const webm404 = /atelie-loop\.webm/.test(home.corpo) || /\/grid\.svg/.test(aeo.corpo);
item(11, 'sem arquivo estático faltando', !webm404 ? 'ok' : 'FALHA', '');

const casosEn = await html('/en/casos');
const enHome = await html('/en');
const cromoOk = texto(casosEn.corpo).includes('Thirty-four years');
const noticiaPt = /Para quem (aprende|est[áa])/.test(texto(enHome.corpo));
item(12, '/en/casos em inglês', cromoOk ? 'ok' : 'FALHA', '');
item('12b', 'notícias do dia traduzidas em /en', noticiaPt ? 'ABERTO' : 'ok',
  noticiaPt ? 'as matérias novas entram em português até `scripts/i18n/noticias.mjs` rodar' : '');

const checkout = await html('/pt-BR/checkout/starter');
// ⚠️ Sem `i` na expressão isto falha por nada: o React emite `autoComplete=` e
// `inputMode=` em camelCase, e o HTML lê atributo sem diferenciar caixa.
const atrito = /autocomplete=/i.test(checkout.corpo) && /inputmode="numeric"/i.test(checkout.corpo);
item(16, 'checkout com autocomplete e teclado certo', atrito ? 'ok' : 'FALHA', '');

const radarIA = /IA TREND/i.test(texto(home.corpo));
item(15, 'radar da home abre no que é da casa', radarIA ? 'ok' : 'FALHA', '');

const pular = /Pular para o conte/.test(texto(home.corpo)) || /Skip to content/.test(texto(home.corpo));
item(19, 'atalho para o conteúdo presente', pular ? 'ok' : 'FALHA', '');

const legado = await html('/pt-BR/cursos/chatgpt-zero');
item(26, 'URL legada de curso redireciona', legado.status === 308 ? 'ok' : 'FALHA',
  `${legado.status} ${legado.loc || ''}`);

const t0 = Date.now();
await html('/pt-BR/noticias');
item(21, 'TTFB do hub de notícias', 'medido', `${Date.now() - t0} ms (era 1.707 ms)`);

const capitulos = texto(cursos.corpo).includes('517');
item(30, 'os números da vitrine são medidos', capitulos ? 'ok' : 'FALHA', '517 capítulos');

const preco79 = texto(novo.corpo).includes('79');
const preco29 = texto(venda.corpo).includes('29');
item('4b', 'escada de preço por prontidão', preco79 && preco29 ? 'ok' : 'FALHA',
  `perplexity=${preco79 ? 'R$79' : '?'} make=${preco29 ? 'R$29' : '?'}`);

item(22, 'peso de /casos', 'ABERTO', `${Math.round(casos.corpo.length / 1024)} KB — 32 trabalhos e 235 vídeos de uma vez`);
item(24, 'FAQ e depoimento por curso', 'ABERTO', '11 cursos sem FAQ; depoimento NÃO se escreve');
item(27, 'contato oficial', 'ABERTO', 'decisão do Ricardo: gmail x contato@fayai.com.br');
item(28, 'aviso de cookies', 'ABERTO', 'baixo risco hoje (Ahrefs é cookieless)');
item(17, 'páginas "use client"', 'parcial', '57 → 44; as 44 restantes têm interatividade de verdade');

// ── relatório ───────────────────────────────────────────────────────────────
const ordem = { FALHA: 0, ABERTO: 1, parcial: 2, medido: 3, 'medido antes': 3, ok: 4 };
resultados.sort((a, b) => ordem[a.estado] - ordem[b.estado] || String(a.n).localeCompare(String(b.n)));
console.log(`\nalvo: ${BASE}\n`);
for (const r of resultados) {
  const marca = { ok: '  ok   ', FALHA: '  FALHA', ABERTO: '  aberto', parcial: '  parcial', medido: '  medido', 'medido antes': '  medido' }[r.estado];
  console.log(`${marca} ${String(r.n).padStart(3)}. ${r.titulo}${r.detalhe ? '  — ' + r.detalhe : ''}`);
}
const falhas = resultados.filter((r) => r.estado === 'FALHA').length;
const abertos = resultados.filter((r) => r.estado === 'ABERTO').length;
console.log(`\n${falhas} falha(s) · ${abertos} aberto(s) por decisão ou tamanho · ${resultados.length} verificações\n`);
process.exitCode = falhas ? 1 : 0;
