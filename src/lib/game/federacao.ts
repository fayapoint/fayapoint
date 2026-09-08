import { motivoDecisao } from "./gestao";

export interface ApuracaoClube {
  id: string;
  estado: "aguardando-defesa" | "em-revisao" | "decidida";
  motivo: string;
  evidencia: string;
  cautelar: boolean;
  abertaEm: Date;
  abertaPor: string;
  defesa?: { texto: string; quando: Date; autor: string };
  decisao?: { resultado: "arquivar" | "advertir" | "suspender"; motivo: string; quando: Date; autor: string };
}

export function registrarDefesa(caso: ApuracaoClube, texto: string, autor: string, agora: Date): ApuracaoClube {
  if (caso.estado !== "aguardando-defesa") throw new Error("Esta apuração não está aguardando defesa.");
  return { ...caso, estado: "em-revisao", defesa: { texto: motivoDecisao(texto), autor, quando: agora } };
}

export function decidirApuracao(caso: ApuracaoClube, resultado: "arquivar" | "advertir" | "suspender", motivo: string, autor: string, agora: Date): ApuracaoClube {
  if (caso.estado === "decidida") throw new Error("A apuração já foi decidida.");
  // Arquivar favorece o clube e pode ocorrer sem defesa; sanção nunca.
  if (resultado !== "arquivar" && (!caso.defesa || caso.estado !== "em-revisao")) throw new Error("Ouça a defesa antes de aplicar uma sanção definitiva.");
  if (caso.defesa?.autor === autor) throw new Error("O responsável que apresentou defesa não pode julgar o próprio caso.");
  return { ...caso, estado: "decidida", decisao: { resultado, motivo: motivoDecisao(motivo), autor, quando: agora } };
}
