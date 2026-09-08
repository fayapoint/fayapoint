import GameEaClube from "@/models/GameEaClube";
import GameEaPartida from "@/models/GameEaPartida";
import { evidenciasPartida, resumoElenco } from "./integridade";

export async function painelElenco(clubId: string, plataforma: string) {
  const [clube, partidas] = await Promise.all([
    GameEaClube.findOne({ clubId, platform: plataforma }).select("name members capturedAt profundidade rank currentDivision kitColors").lean(),
    GameEaPartida.find({ clubIds: clubId, platform: plataforma }).sort({ timestamp: -1 }).limit(30).select("dados capturedAt matchId timestamp").lean(),
  ]);
  return {
    fonte: "Espelho da API pública da EA", capturadoEm: clube?.capturedAt?.toISOString() ?? null,
    profundidade: clube?.profundidade ?? null, nome: clube?.name ?? null,
    rank: clube?.rank ?? null, divisao: clube?.currentDivision ?? null,
    cores: (clube?.kitColors ?? []).filter(c => Number.isInteger(c) && c >= 0 && c <= 0xffffff).map(c => `#${c.toString(16).padStart(6, "0")}`),
    limiteAmostra: 30, partidasCapturadas: partidas.length,
    ...resumoElenco(clubId, clube?.members, partidas.map(p => p.dados)),
    partidas: partidas.map(p => ({ ...evidenciasPartida(p.dados), matchId: p.matchId, capturadoEm: p.capturedAt?.toISOString() ?? null })),
  };
}

export async function quadroIntegridade(plataforma: string, pagina: number) {
  const docs = await GameEaPartida.find({ platform: plataforma }).sort({ timestamp: -1, _id: -1 }).skip(pagina * 30).limit(31).select("dados capturedAt matchId").lean();
  return { fonte: "Espelho da API pública da EA", mais: docs.length > 30,
    partidas: docs.slice(0, 30).map(p => ({ ...evidenciasPartida(p.dados), matchId: p.matchId, capturadoEm: p.capturedAt?.toISOString() ?? null })),
  };
}
