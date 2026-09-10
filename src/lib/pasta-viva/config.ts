/**
 * Os endereços fixos da Pasta Viva, num lugar só.
 *
 * ## ⚠️ O que a pasta do Drive é, e o que ela NÃO é
 *
 * A pasta do Google Drive é um **espelho de arquivos** — PDFs, planilhas
 * modelo, os infográficos. Ela existe porque arquivo é o formato que a pessoa
 * quer baixar e levar, e porque abrir o Drive não exige explicar login nenhum.
 *
 * Ela **não é o portão**. O link é do tipo "qualquer pessoa com o link",
 * porque nem todo comprador tem conta Google e pedir e-mail um a um mataria a
 * entrega automática. Isso significa, com todas as letras: **quem copiar este
 * link pode repassá-lo**. Não há como impedir, e fingir que há seria pior.
 *
 * É por isso que o acervo — os métodos, as fontes, as medições, a edição
 * diária — vive no SITE, atrás de `getAcessoPastaViva`, e não no Drive. O que
 * se renova todo dia, e portanto o que sustenta o preço, está do lado que tem
 * portão de verdade. O Drive carrega as cópias que já estavam soltas no mundo
 * de qualquer jeito.
 *
 * Se um dia o link vazar em escala, troque a pasta e atualize aqui: o custo é
 * uma edição de arquivo, não uma migração.
 */

export const PASTA_DRIVE_URL =
  "https://drive.google.com/drive/folders/1WXR2h9KunX__PqPTBm-OWH9pFZpnN27e";

export const PASTA_AFILIADOS_DRIVE_URL =
  "https://drive.google.com/drive/folders/19vDtSamnmUyxnGQNddmcPIijGnXEl9M0";

/**
 * Onde o comprador compra o ebook que dá acesso.
 *
 * Estes três saem do painel da Hotmart (Links de divulgação → Links
 * principais), lidos em 10/09/2026. Não são montados à mão a partir do ID do
 * produto: o código do hotlink (`T107425236L`) não é derivável do ID 8436555.
 */
export const HOTMART_CHECKOUT = "https://pay.hotmart.com/T107425236L";
export const HOTMART_PAGINA_VENDAS = "https://go.hotmart.com/T107425236L";
export const HOTMART_RECRUTAMENTO_AFILIADOS =
  "https://affiliate.hotmart.com/affiliate-recruiting/view/9379G107425257";

/** Preço do ebook, em reais. Fonte única para as páginas de venda. */
export const PRECO_EBOOK = 67;
