/**
 * O número de aulas e a duração passam a ser MEDIDOS no conteúdo.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Achado em 26/08/2026, puxando o fio do item 30 do laudo ("30 aulas" e
 * "31 capítulos" na mesma página do ChatGPT do Zero). O fio inteiro:
 *
 *   metrics.lessons  |  capítulos de verdade  |  curso
 *   ─────────────────┼────────────────────────┼──────────────────────────
 *        180         |          16            |  openclaw-ia-open-source
 *        180         |          17            |  gemini-ia-google
 *        170         |          16            |  claude-ia-segura
 *        160         |          15            |  leonardo-ai-criacao-visual
 *        160         |          20            |  claude-cowork-colaboracao
 *        150         |          15            |  make-integracao-total
 *
 * A vitrine somava **1.525 aulas**. O catálogo tem **517 capítulos escritos**.
 * `metrics.lessons` estava errado em 18 dos 22 cursos, e `contentChapters` em
 * 11 — os dois campos guardados à mão, nenhum medido.
 *
 * ## Por que isso é mais grave do que parece
 *
 * O laudo mandou o preço passar a cobrar pelo TAMANHO do curso (item 4), e a
 * tabela de faixas leu `metrics.lessons`. Como o campo estava inflado
 * justamente nos cursos MENORES, a escada saiu invertida: os seis cursos de
 * R$ 79 são os seis com menos texto do catálogo, e os maiores custam R$ 29.
 *
 *   perplexity ....... 305k caracteres ... R$ 29
 *   make-integracao .. 145k caracteres ... R$ 79
 *
 * ⚠️ **Este script NÃO mexe em preço.** Corrigir o número é aplicar a regra que
 * já existe; refazer a escada é decisão do Ricardo, e está no handoff com a
 * medida pronta. Só não rode `precos-e-metricas-honestas.mjs --gravar` depois
 * deste sem ler aquele aviso: com os números certos, a faixa de R$ 79 fica
 * vazia e tudo desaba para R$ 29.
 *
 * ## De onde vem cada número
 *
 * **Capítulo** é a unidade que o aluno navega. Quem decide isso é
 * `splitIntoChapters` em `CourseReaderPage.tsx`: com 3 ou mais `h1`, ele corta
 * por `h1`. Então:
 *
 *   - formato novo (`# Capítulo N: …`) → conta os marcadores, e o `h1` do
 *     título do curso fica de fora;
 *   - formato antigo (cada `h1` é um capítulo) → conta os `h1`.
 *
 * **Duração** é `estimateReadingMinutes` do próprio leitor — 200 palavras por
 * minuto, marcador de mídia (`<!-- … -->`) descontado. A mesma fórmula nos dois
 * lugares, para a página de venda e o leitor contarem a mesma história. É tempo
 * de LEITURA, e o rótulo passa a dizer isso: as "30+ horas" de antes não vinham
 * de lugar nenhum.
 *
 * Os módulos do currículo também são refeitos — as aulas por módulo somavam o
 * número inflado, e a duração de cada um era redonda ("3 horas", "5 horas").
 * Cada módulo fica com sua fatia proporcional, pelo método do maior resto.
 *
 * Uso:
 *   node scripts/aulas-e-tempo-honestos.mjs            (simula, não grava)
 *   node scripts/aulas-e-tempo-honestos.mjs --gravar   (grava, com backup)
 *
 * É idempotente: rodar duas vezes dá o mesmo resultado.
 */
import { MongoClient } from 'mongodb';
import fs from 'fs';

const GRAVAR = process.argv.includes('--gravar');

const uri = fs.readFileSync('.env.local', 'utf8').match(/MONGODB_URI=(.+)/)[1].trim();

/** Tira os marcadores de mídia — eles não são texto que alguém lê. */
const semMarcadores = (texto) =>
  (texto || '').replace(new RegExp('<' + '!--[\\s\\S]*?--' + '>', 'g'), '');

/** A mesma conta de `estimateReadingMinutes` no leitor do aluno. */
const minutosDeLeitura = (texto) => {
  const palavras = semMarcadores(texto).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(palavras / 200));
};

/**
 * Capítulos como o leitor os corta: por `h1`, seção a seção.
 *
 * ⚠️ Contar os marcadores `# Capítulo N` em vez dos `h1` erra por um em dez
 * cursos — nesses, o primeiro `h1` abre o livro sem se chamar "Capítulo 1", e o
 * leitor o serve como capítulo do mesmo jeito. A regra de tamanho existe para o
 * caso de aparecer uma folha de rosto: uma seção sem prosa não é capítulo.
 * Medido em 26/08/2026: hoje nenhuma seção fica abaixo de 2.600 caracteres,
 * então esta guarda não descarta nada — está aqui para o dia em que descartar.
 */
const contarCapitulos = (texto) =>
  (texto || '')
    .split(/^(?=#\s[^#])/gm)
    .filter((secao) => /^#\s[^#]/.test(secao.trim()) && semMarcadores(secao).length >= 800).length;

const formatarDuracao = (min) => {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = Math.round((min % 60) / 5) * 5;
  if (m === 0) return `${h}h`;
  if (m === 60) return `${h + 1}h`;
  return `${h}h${String(m).padStart(2, '0')}`;
};

/** Reparte `total` entre `pesos` pelo maior resto, com mínimo de 1 em cada. */
const repartir = (total, pesos) => {
  const soma = pesos.reduce((s, p) => s + p, 0) || pesos.length;
  const base = pesos.map((p) => (total * (soma ? p : 1)) / (soma || pesos.length));
  const inteiros = base.map((v) => Math.max(1, Math.floor(v)));
  let resto = total - inteiros.reduce((s, v) => s + v, 0);
  const ordem = base
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  let k = 0;
  while (resto > 0 && ordem.length) {
    inteiros[ordem[k % ordem.length].i] += 1;
    resto -= 1;
    k += 1;
  }
  // Se sobrou gente demais (mínimo de 1 estourou o total), tira dos maiores.
  while (resto < 0) {
    const maior = inteiros.indexOf(Math.max(...inteiros));
    if (inteiros[maior] <= 1) break;
    inteiros[maior] -= 1;
    resto += 1;
  }
  return inteiros;
};

const cliente = new MongoClient(uri);
await cliente.connect();
const db = cliente.db('fayapointProdutos');
const col = db.collection('products');

const filtro = { type: 'course', status: 'active', aposentado: { $ne: true } };
const cursos = await col
  .find(filtro)
  .project({ slug: 1, courseContent: 1, contentChapters: 1, metrics: 1, curriculum: 1 })
  .toArray();

console.log(`cursos no catálogo: ${cursos.length}\n`);

if (GRAVAR) {
  const nome = `products_backup_aulashonestas_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  const existentes = await db.listCollections({ name: nome }).toArray();
  if (!existentes.length) {
    await col.aggregate([{ $match: filtro }, { $out: nome }]).toArray();
    console.log(`backup: ${nome}\n`);
  } else {
    console.log(`backup já existia: ${nome}\n`);
  }
}

let somaAntes = 0;
let somaDepois = 0;
let mudados = 0;

console.log('aulas antes → depois   duração antes → depois   curso');
console.log('─'.repeat(96));

for (const p of cursos.sort((a, b) => a.slug.localeCompare(b.slug))) {
  const capitulos = contarCapitulos(p.courseContent);
  const minutos = minutosDeLeitura(p.courseContent);
  const duracao = formatarDuracao(minutos);

  const aulasAntes = p.metrics?.lessons ?? 0;
  const duracaoAntes = p.metrics?.duration ?? '—';
  somaAntes += aulasAntes;
  somaDepois += capitulos;

  const modulos = p.curriculum?.modules || [];
  let modulosNovos = modulos;
  /**
   * ⚠️ Só reparte quando a soma ainda está errada.
   *
   * A repartição usa as aulas de cada módulo como PESO. Se ela rodasse de novo
   * sobre a distribuição que ela mesma escreveu, os pesos seriam outros e o
   * corte sairia diferente a cada passagem — o módulo pequeno encolhendo e o
   * grande engordando, sem volta e sem erro. Mesmo gênero de armadilha do
   * `padronizar-curso.ts`: reprocessar sem ponto fixo não é idempotente.
   */
  const somaAtual = modulos.reduce((s, m) => s + (typeof m.lessons === 'number' ? m.lessons : 0), 0);
  if (modulos.length && capitulos && somaAtual !== capitulos) {
    const pesos = modulos.map((m) => (typeof m.lessons === 'number' && m.lessons > 0 ? m.lessons : 1));
    const aulasPorModulo = repartir(capitulos, pesos);
    const minutosPorModulo = repartir(minutos, pesos);
    modulosNovos = modulos.map((m, i) => ({
      ...m,
      lessons: aulasPorModulo[i],
      duration: formatarDuracao(minutosPorModulo[i]),
    }));
  }

  const mudou =
    aulasAntes !== capitulos ||
    duracaoAntes !== duracao ||
    (p.contentChapters ?? 0) !== capitulos ||
    JSON.stringify(modulos) !== JSON.stringify(modulosNovos);
  if (mudou) mudados += 1;

  const seta = aulasAntes === capitulos ? ' ' : '≠';
  console.log(
    `${String(aulasAntes).padStart(5)} → ${String(capitulos).padEnd(4)}${seta}  ` +
      `${String(duracaoAntes).padStart(12)} → ${String(duracao).padEnd(8)}  ${p.slug}`
  );

  if (GRAVAR && mudou) {
    await col.updateOne(
      { _id: p._id },
      {
        $set: {
          contentChapters: capitulos,
          'metrics.lessons': capitulos,
          'metrics.duration': duracao,
          ...(modulos.length ? { 'curriculum.modules': modulosNovos } : {}),
          metricasMedidasEm: new Date(),
        },
        /**
         * ⚠️ O ESPELHO INGLÊS CONGELAVA O NÚMERO VELHO.
         *
         * `i18n.en` guarda a tradução do produto, e `paraIdioma` a serve por
         * cima do português. O tradutor do catálogo levava `metrics.duration`
         * e `curriculum.modules[].duration` junto — então a página inglesa do
         * `make-integracao` dizia **"25+ hours"** enquanto a portuguesa já
         * dizia "1h55", e cada módulo dizia "3 hours" contra "13 min".
         *
         * Duração agora é FORMATO, não frase: "1h55" é igual nos dois idiomas.
         * Apagar o campo do espelho faz o inglês cair no português, que é o
         * número medido. O tradutor também parou de colher os dois campos.
         */
      }
    );
  }

  /**
   * A limpeza do espelho corre FORA do `if (mudou)`.
   *
   * Quando o número já está certo no português, `mudou` é falso — e era
   * exatamente aí que a tradução velha continuava no ar, sozinha, servida só
   * para quem lê em inglês. O critério tem de ser "o espelho ainda carrega
   * duração?", não "o português mudou?".
   */
  if (GRAVAR) {
    const espelho = await col.findOne(
      { _id: p._id },
      { projection: { 'i18n.en.metrics': 1, 'i18n.en.curriculum.modules': 1 } }
    );
    const en = espelho?.i18n?.en;
    if (en?.metrics !== undefined) {
      await col.updateOne({ _id: p._id }, { $unset: { 'i18n.en.metrics': '' } });
      console.log(`      espelho: i18n.en.metrics apagado (dizia ${JSON.stringify(en.metrics)})`);
    }
    const modsEn = en?.curriculum?.modules;
    if (Array.isArray(modsEn) && modsEn.some((m) => m && m.duration !== undefined)) {
      await col.updateOne(
        { _id: p._id },
        {
          $set: {
            'i18n.en.curriculum.modules': modsEn.map((m) => {
              const { duration: _fora, ...resto } = m || {};
              return resto;
            }),
          },
        }
      );
      console.log('      espelho: duração dos módulos apagada');
    }
  }
}

console.log('─'.repeat(96));
console.log(`\nsoma das aulas: ${somaAntes} → ${somaDepois}`);
console.log(`cursos alterados: ${mudados}/${cursos.length}`);
console.log(GRAVAR ? '\nGRAVADO.' : '\n(simulação — use --gravar para gravar)');

await cliente.close();
