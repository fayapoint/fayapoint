import type { Metadata } from "next";
import { ProjetosPage } from "@/components/landing/ProjetosPage";

export const metadata: Metadata = {
  title: "Projetos FayAI — uma vida dedicada à tecnologia",
  description:
    "Do 386 à inteligência artificial: cursos, Ultimate Social Suite, WorldForge Studio, visão computacional de futebol, copiloto de games e o app de música sincronizada Som em Bando. Conheça os projetos e a história de Ricardo Faya.",
};

export default function Projetos() {
  return <ProjetosPage />;
}
