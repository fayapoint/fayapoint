import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectDetailPage } from "@/components/landing/ProjectDetailPage";
import { FAY_PROJECTS } from "@/data/landing/projects";
import { PROJECT_DETAILS } from "@/data/landing/project-details";

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

export function generateStaticParams() {
  return FAY_PROJECTS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = FAY_PROJECTS.find((p) => p.id === id);
  if (!project) return {};
  return {
    title: `${project.name} — Projetos FayAI`,
    description: `${project.tagline}. ${project.description}`,
  };
}

export default async function ProjetoDetalhe({ params }: Props) {
  const { id } = await params;
  const project = FAY_PROJECTS.find((p) => p.id === id);
  const detail = PROJECT_DETAILS[id];
  if (!project || !detail) notFound();
  return <ProjectDetailPage project={project} detail={detail} />;
}
