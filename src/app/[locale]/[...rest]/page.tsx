import { notFound } from "next/navigation";

// Catch-all: qualquer rota desconhecida sob /{locale} cai aqui e dispara o
// not-found.tsx com a bússola (sem isso o Next mostra o 404 default, sem
// nenhuma navegação — beco sem saída).
export default function CatchAll() {
  notFound();
}
