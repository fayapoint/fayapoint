/**
 * Gera o snapshot do Radar da IA usado como primeira pintura da home.
 *
 * Por que existe: a home não pode depender de 18 chamadas HTTP ao autocomplete
 * para renderizar (IDENTIDADE_VISUAL.md §5 — conteúdo crítico nunca depende de
 * animação nem, por extensão, de rede). O snapshot entra instantâneo e o
 * componente atualiza ao vivo por cima, quando e se a medição responder.
 *
 * Rodar quando quiser atualizar a linha de base:
 *     npm run radar:seed
 *
 * A saída é medição real, não invenção: sai do mesmo código que a API usa.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { NICHOS, medirNicho, type TermoRadar } from "../src/lib/radar";

// Quantos termos do topo entram no snapshot. A lista mostra 8; a folga cobre o
// caso de o visitante desligar um canal e alguns termos saírem. O resto só
// interessa ao relatório noturno do radar.py — e o snapshot viaja no bundle,
// então cada termo a mais é peso na home de todo mundo.
const TOPO = 10;

async function main() {
  const snapshot: Record<string, { geradoEm: string; termos: TermoRadar[] }> = {};

  for (const nicho of NICHOS) {
    process.stderr.write(`  medindo ${nicho.id}...`);
    const r = await medirNicho(nicho);
    snapshot[nicho.id] = { geradoEm: r.geradoEm, termos: r.termos.slice(0, TOPO) };
    process.stderr.write(` ${r.termos.length} termos\n`);
  }

  const destino = join(process.cwd(), "src/data/landing/radar-seed.json");
  writeFileSync(destino, JSON.stringify(snapshot, null, 1), "utf-8");
  process.stderr.write(`\n-> ${destino}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
