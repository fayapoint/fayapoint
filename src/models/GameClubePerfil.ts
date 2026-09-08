import mongoose, { Schema, type Model } from "mongoose";
import type { EstadoClube, FuncaoClube, DesafioClube } from "@/lib/game/gestao";
import type { ApuracaoClube } from "@/lib/game/federacao";

export interface IGameClubePerfil {
  eaClubId: string;
  plataforma: "common-gen5" | "common-gen4";
  nome: string;
  estado: EstadoClube;
  donoUserId: mongoose.Types.ObjectId | null;
  solicitantes: Array<{ userId: mongoose.Types.ObjectId; justificativa: string; quando: Date; desafio?: DesafioClube }>;
  membros: Array<{ userId: mongoose.Types.ObjectId; funcao: FuncaoClube }>;
  descricao: string;
  versao: number;
  apuracoes: ApuracaoClube[];
  historico: Array<{
    autorUserId: mongoose.Types.ObjectId;
    acao: string;
    motivo: string;
    quando: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IGameClubePerfil>({
  eaClubId: { type: String, required: true, match: /^\d{1,12}$/ },
  plataforma: { type: String, required: true, enum: ["common-gen5", "common-gen4"] },
  nome: { type: String, required: true, maxlength: 100 },
  estado: { type: String, enum: ["pendente", "aprovado", "recusado", "suspenso"], default: "pendente" },
  donoUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  solicitantes: [{ _id: false, userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, justificativa: { type: String, required: true, maxlength: 2000 }, quando: { type: Date, required: true }, desafio: {
    gamertag: { type: String, maxlength: 40 }, codigo: { type: String }, criadoEm: Date, expiraEm: Date, verificadoEm: Date,
  } }],
  membros: [{ _id: false, userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, funcao: { type: String, required: true, enum: ["capitao", "vice", "recrutador"] } }],
  descricao: { type: String, default: "", maxlength: 1000 },
  versao: { type: Number, default: 0, min: 0 },
  apuracoes: [{ _id: false,
    id: { type: String, required: true }, estado: { type: String, enum: ["aguardando-defesa", "em-revisao", "decidida"], required: true },
    motivo: { type: String, required: true, maxlength: 2000 }, evidencia: { type: String, required: true, maxlength: 2000 },
    cautelar: { type: Boolean, default: false }, abertaEm: { type: Date, required: true }, abertaPor: { type: String, required: true },
    defesa: { texto: { type: String, maxlength: 2000 }, quando: Date, autor: String },
    decisao: { resultado: { type: String, enum: ["arquivar", "advertir", "suspender"] }, motivo: { type: String, maxlength: 2000 }, quando: Date, autor: String },
  }],
  historico: [{ _id: false, autorUserId: { type: Schema.Types.ObjectId, ref: "User", required: true }, acao: { type: String, required: true }, motivo: { type: String, required: true, maxlength: 2000 }, quando: { type: Date, required: true } }],
}, { timestamps: true, collection: "game_clube_perfis" });

// Um clube tem uma gestão canônica, mesmo quando várias contas reivindicam posse.
schema.index({ eaClubId: 1, plataforma: 1 }, { unique: true });
schema.index({ estado: 1, updatedAt: -1 });

const GameClubePerfil: Model<IGameClubePerfil> = mongoose.models.GameClubePerfil || mongoose.model<IGameClubePerfil>("GameClubePerfil", schema);
export default GameClubePerfil;
