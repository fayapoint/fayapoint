import { AreaDeCarga } from "@/components/marca/LoaderFayai";

/**
 * O que aparece entre uma página e outra.
 *
 * Antes de 20/08/2026 não havia `loading.tsx` em lugar nenhum: a troca de rota
 * ficava com a página velha congelada até a nova chegar, e em rota pesada
 * (catálogo, leitor de curso) isso passa de meio segundo sem um sinal sequer.
 *
 * O logo enchendo é esse sinal — e, por tabela, é o que acende o favicon
 * animado, porque todo loader da marca se registra em `estado-de-carga.ts`.
 *
 * ⚠️ Fica no grupo `(site)`, não em `[locale]`: aqui dentro o `SiteChrome`
 * (cabeçalho, menu, rodapé) já está montado e permanece na tela. Subir este
 * arquivo um nível faria a página inteira piscar a cada clique de menu.
 */
export default function Carregando() {
  return <AreaDeCarga />;
}
