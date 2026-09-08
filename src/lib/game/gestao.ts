/** Política pura. Uma reivindicação de GameClub não concede nenhuma permissão. */
export type EstadoClube = "pendente" | "aprovado" | "recusado" | "suspenso";
export type FuncaoClube = "capitao" | "vice" | "recrutador";
export type AcaoGestao = "identidade" | "elenco" | "vaga" | "inscricao" | "partida" | "delegar";

export interface PerfilPermissoes {
  estado: EstadoClube;
  donoUserId: string | null;
  membros: ReadonlyArray<{ userId: string; funcao: FuncaoClube }>;
}

const permissoes: Record<FuncaoClube, readonly AcaoGestao[]> = {
  capitao: ["identidade", "elenco", "vaga", "inscricao", "partida"],
  vice: ["elenco", "vaga", "partida"],
  recrutador: ["vaga"],
};

export function podeGerir(perfil: PerfilPermissoes, userId: string | null, acao: AcaoGestao): boolean {
  if (!userId || perfil.estado !== "aprovado") return false;
  if (perfil.donoUserId === userId) return true;
  return perfil.membros.some((m) => m.userId === userId && permissoes[m.funcao]?.includes(acao));
}

/** O papel deve vir da conta consultada no banco, nunca do corpo da requisição. */
export function ehFederacao(role: string | null | undefined): boolean {
  return role === "admin";
}

export function chaveClube(clubId: unknown, plataforma: unknown): { eaClubId: string; plataforma: "common-gen5" | "common-gen4" } {
  if (typeof clubId !== "string" || !/^\d{1,12}$/.test(clubId)) throw new Error("Clube inválido.");
  if (plataforma !== "common-gen5" && plataforma !== "common-gen4") throw new Error("Plataforma inválida.");
  return { eaClubId: clubId.replace(/^0+(?=\d)/, ""), plataforma };
}

export function motivoDecisao(valor: unknown): string {
  if (typeof valor !== "string" || valor.trim().length < 10 || valor.trim().length > 2000) {
    throw new Error("Explique a decisão em 10 a 2000 caracteres.");
  }
  return valor.trim();
}

export interface DesafioClube {
  gamertag: string;
  codigo: string;
  criadoEm: Date;
  expiraEm: Date;
  verificadoEm?: Date;
}

/** Um snapshot anterior ao desafio nunca serve de prova, mesmo contendo o código. */
export function conferirDesafio(desafio: DesafioClube, membros: ReadonlyArray<{ name?: unknown; proName?: unknown }>, capturadoEm: Date | null, agora: Date): boolean {
  if (!capturadoEm || !Number.isFinite(capturadoEm.getTime()) || capturadoEm < desafio.criadoEm || capturadoEm > agora || agora >= desafio.expiraEm) return false;
  if (!/^W22[A-F0-9]{10}$/.test(desafio.codigo)) return false;
  return membros.some((m) => typeof m.name === "string" && m.name.trim().toLowerCase() === desafio.gamertag.trim().toLowerCase()
    && typeof m.proName === "string" && m.proName.toUpperCase().split(/[^A-Z0-9]+/).includes(desafio.codigo));
}
