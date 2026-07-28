/**
 * Semeia o histórico do Radar com as medições que já existiam em arquivo.
 *
 * O histórico (`radar_historico`) nasceu em 28/07/2026 e passa a acumular um
 * documento por nicho por dia. Mas duas medições reais já estavam guardadas em
 * disco — `src/data/landing/radar-seed.json` (26/07) — e jogá-las fora seria
 * começar a série com um ponto só, num gráfico que precisa de dois para
 * desenhar qualquer coisa.
 *
 * Idempotente: escreve com `upsert` na chave (nicho, dia), então rodar de novo
 * não duplica nem inventa dia.
 *
 *     npm run radar:historico
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MongoClient } from "mongodb";
import type { TermoRadar } from "../src/data/landing/radar-nichos";

const DB = "fayapoint";
const COLECAO = "radar_historico";

type Snapshot = Record<string, { geradoEm: string; termos: TermoRadar[] }>;

function diaBrasilia(quando: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(quando));
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI ausente — rode com: node -r dotenv/config …");
    process.exit(1);
  }

  const caminho = join(process.cwd(), "src/data/landing/radar-seed.json");
  const snapshot = JSON.parse(readFileSync(caminho, "utf-8")) as Snapshot;

  const client = new MongoClient(uri);
  await client.connect();
  const col = client.db(DB).collection(COLECAO);

  // A chave do dia é única por nicho — é ela que impede a série de empilhar
  // várias medições do mesmo dia como se fossem dias diferentes.
  await col.createIndex({ nicho: 1, dia: 1 }, { unique: true });
  await col.createIndex({ nicho: 1, dia: -1 });

  let gravados = 0;
  for (const [nicho, dado] of Object.entries(snapshot)) {
    if (!dado?.termos?.length) continue;
    const dia = diaBrasilia(dado.geradoEm);

    await col.updateOne(
      { nicho, dia },
      {
        $set: {
          nicho,
          dia,
          geradoEm: dado.geradoEm,
          consultas: 0, // o snapshot não guardava a contagem de consultas
          termos: dado.termos.slice(0, 40),
        },
      },
      { upsert: true }
    );
    gravados++;
    console.log(`  ${nicho} @ ${dia} — ${dado.termos.length} termos`);
  }

  const total = await col.countDocuments({});
  console.log(`\n${gravados} nichos semeados · ${total} dias no histórico`);
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
