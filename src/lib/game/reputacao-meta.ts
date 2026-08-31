/**
 * METADADOS de reputação — a parte PURA, segura no cliente.
 *
 * As categorias e os tipos vivem aqui, sem tocar em banco, para que os
 * componentes de UI (`ReputacaoUI`, `ComunidadeAoVivo`, `Mercado`) possam
 * importá-los sem arrastar `@/lib/mongodb` (que usa `global` e quebra no
 * navegador). O agregado que LÊ o banco fica em `reputacao.ts`, só no servidor.
 */

export interface CategoriaMeta {
  key: "ataque" | "defesa" | "passe" | "coletivo" | "fairplay";
  nome: string;
  nomeEn: string;
}

/** As cinco categorias do voto, na ordem em que aparecem na tela. */
export const CATEGORIAS: CategoriaMeta[] = [
  { key: "ataque", nome: "Ataque", nomeEn: "Attack" },
  { key: "defesa", nome: "Defesa", nomeEn: "Defense" },
  { key: "passe", nome: "Passe", nomeEn: "Passing" },
  { key: "coletivo", nome: "Coletivo", nomeEn: "Teamwork" },
  { key: "fairplay", nome: "Fair play", nomeEn: "Fair play" },
];

export interface ResumoReputacao {
  media: number;
  total: number;
  categorias: { ataque: number; defesa: number; passe: number; coletivo: number; fairplay: number };
}
