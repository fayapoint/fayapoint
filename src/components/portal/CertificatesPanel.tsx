"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Download,
  ExternalLink,
  Loader2,
  BookOpen,
  Clock,
  CheckCircle2,
  Shield,
  Star,
  Trophy,
  Copy,
  Check,
  ArrowRight,
  Linkedin,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { getClientAuthHeaders } from "@/lib/client-auth";
import { CertificateArtwork } from "@/components/certificates/CertificateArtwork";

interface CertificateItem {
  _id: string;
  userName: string;
  courseTitle: string;
  courseSlug: string;
  courseLevel: string;
  courseDuration: string;
  courseCategory: string;
  certificateNumber: string;
  verificationCode: string;
  verificationUrl: string;
  issuedAt: string;
  quizScore: number;
  totalStudyHours: number;
  chaptersCompleted: number;
  totalChapters: number;
}

export function CertificatesPanel({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  // 5.1: cards compactos — só o certificado clicado expande
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const res = await fetch("/api/certificates", {
        headers: getClientAuthHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setCertificates(data.certificates || []);
      }
    } catch (e) {
      console.error("Error fetching certificates:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (cert: CertificateItem) => {
    setDownloading(cert.verificationCode);
    try {
      const res = await fetch(`/api/certificates/${cert.verificationCode}/download`, {
        headers: getClientAuthHeaders(),
        credentials: "include",
      });

      if (!res.ok) {
        toast.error("Erro ao baixar certificado");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Certificado_FayAi_${cert.courseSlug}_${cert.certificateNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Certificado baixado com sucesso!");
    } catch (e) {
      console.error("Download error:", e);
      toast.error("Erro ao baixar certificado");
    } finally {
      setDownloading(null);
    }
  };

  const copyVerificationCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Código copiado!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(dateStr));
  };

  const getLevelColor = (level: string) => {
    const l = level.toLowerCase();
    if (l.includes("avançado") || l.includes("advanced")) return "text-red-400 bg-red-500/10 border-red-500/20";
    if (l.includes("intermediário") || l.includes("intermediate")) return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
    return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- carregando §12 */}
          <img src="/fx/carregando.webp" alt="" aria-hidden className="h-20 w-32 rounded-xl object-cover opacity-90" />
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
          <p className="text-sm text-white/40">Carregando certificados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between min-w-0">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base md:text-lg font-bold text-white truncate">Meus Certificados</h2>
            <p className="text-[10px] md:text-xs text-white/40">
              {certificates.length} certificado{certificates.length !== 1 ? "s" : ""} emitido{certificates.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      {certificates.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
          <Card className="relative bg-white/[0.02] border-white/[0.06] p-3 md:p-4 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element -- arte contextual §12 */}
            <img src="/fx/certificado-fx.webp" alt="" aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-20 object-cover opacity-40" style={{ WebkitMaskImage: "linear-gradient(to left, black 40%, transparent)", maskImage: "linear-gradient(to left, black 40%, transparent)" }} />
            <div className="relative flex items-center gap-1.5 md:gap-2 mb-1">
              <Trophy className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400 shrink-0" />
              <span className="text-[10px] md:text-xs text-white/40 truncate">Certificados</span>
            </div>
            <p className="relative text-lg md:text-xl font-bold text-white">{certificates.length}</p>
          </Card>
          <Card className="bg-white/[0.02] border-white/[0.06] p-3 md:p-4 overflow-hidden">
            <div className="flex items-center gap-1.5 md:gap-2 mb-1">
              <Star className="w-3.5 h-3.5 md:w-4 md:h-4 text-violet-400 shrink-0" />
              <span className="text-[10px] md:text-xs text-white/40 truncate">Média Quiz</span>
            </div>
            <p className="text-lg md:text-xl font-bold text-white">
              {Math.round(certificates.reduce((acc, c) => acc + c.quizScore, 0) / certificates.length)}%
            </p>
          </Card>
          <Card className="bg-white/[0.02] border-white/[0.06] p-3 md:p-4 overflow-hidden">
            <div className="flex items-center gap-1.5 md:gap-2 mb-1">
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400 shrink-0" />
              <span className="text-[10px] md:text-xs text-white/40 truncate">Horas de Estudo</span>
            </div>
            <p className="text-lg md:text-xl font-bold text-white">
              {certificates.reduce((acc, c) => acc + (c.totalStudyHours || 0), 0)}h
            </p>
          </Card>
          <Card className="bg-white/[0.02] border-white/[0.06] p-3 md:p-4 overflow-hidden">
            <div className="flex items-center gap-1.5 md:gap-2 mb-1">
              <BookOpen className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400 shrink-0" />
              <span className="text-[10px] md:text-xs text-white/40 truncate">Capítulos</span>
            </div>
            <p className="text-lg md:text-xl font-bold text-white">
              {certificates.reduce((acc, c) => acc + (c.chaptersCompleted || 0), 0)}
            </p>
          </Card>
        </div>
      )}

      {/* Certificates Grid */}
      {certificates.length === 0 ? (
        <Card className="relative overflow-hidden border-amber-400/15 bg-[#101221] p-5 md:p-8">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="relative grid items-center gap-7 lg:grid-cols-[1fr_.92fr]">
            <div>
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[.18em] text-amber-300">
                <Sparkles className="h-3 w-3" /> Sua próxima conquista
              </span>
              <h3 className="max-w-xl text-2xl font-black leading-tight text-white md:text-4xl">
                Seu primeiro certificado está a <span className="text-amber-300">1 curso</span> de distância.
              </h3>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/50">
                Conclua um curso, passe na avaliação e ganhe uma peça verificável com seu nome — pronta para currículo e LinkedIn.
              </p>
              <Button
                onClick={() => onTabChange?.("courses")}
                className="mt-5 h-10 rounded-xl bg-amber-400 px-5 font-bold text-[#17120a] hover:bg-amber-300"
              >
                Continuar minha trilha <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="mx-auto w-full max-w-lg rotate-[-1.5deg] transition-transform duration-500 hover:rotate-0">
              <CertificateArtwork
                courseSlug="primeiro-certificado"
                courseTitle="Sua primeira conquista com Inteligência Artificial"
                studentName="SEU NOME AQUI"
                certificateNumber="FAYAI • VERIFICADO"
                compact
              />
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* 5.1: grid compacto — thumb do certificado, expande sob demanda */}
          <div className="grid gap-3 md:gap-4 sm:grid-cols-2">
            <AnimatePresence>
              {certificates.map((cert, idx) => {
                const isExpanded = expandedId === cert._id;
                return (
                  <motion.div
                    key={cert._id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.06, 0.4), layout: { duration: 0.3 } }}
                    className={cn(isExpanded && "sm:col-span-2")}
                  >
                    <Card
                      className={cn(
                        "bg-white/[0.02] border-white/[0.06] overflow-hidden group transition-all duration-300",
                        isExpanded
                          ? "border-amber-500/30 shadow-xl shadow-amber-900/10"
                          : "hover:border-amber-500/20 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-900/10 cursor-pointer"
                      )}
                      onClick={() => !isExpanded && setExpandedId(cert._id)}
                    >
                      <div className="h-1 bg-gradient-to-r from-amber-500/60 via-yellow-400/40 to-amber-500/60" />

                      {!isExpanded ? (
                        /* ── Card compacto ── */
                        <div className="p-3 md:p-4">
                          <div className="relative mb-3 overflow-hidden rounded-lg">
                            <div className="pointer-events-none origin-top-left">
                              <CertificateArtwork
                                courseSlug={cert.courseSlug}
                                courseTitle={cert.courseTitle}
                                studentName={cert.userName}
                                certificateNumber={cert.certificateNumber}
                                issuedAt={cert.issuedAt}
                                compact
                              />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                              Ver certificado
                            </span>
                          </div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-xs md:text-sm font-bold text-white leading-tight line-clamp-2 min-w-0">
                              {cert.courseTitle}
                            </h3>
                            <Badge className={cn("text-[9px] px-1.5 py-0.5 border flex-shrink-0", getLevelColor(cert.courseLevel))}>
                              {cert.courseLevel}
                            </Badge>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/35">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(cert.issuedAt)}</span>
                            <span className="flex items-center gap-1"><Star className="w-3 h-3" />Quiz {cert.quizScore}%</span>
                          </div>
                        </div>
                      ) : (
                        /* ── Card expandido ── */
                        <div className="p-4 sm:p-6">
                          <div className="mb-4 flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="text-sm md:text-base font-bold text-white leading-tight">{cert.courseTitle}</h3>
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] md:text-xs text-white/35">
                                <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{cert.certificateNumber}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(cert.issuedAt)}</span>
                                <span className="flex items-center gap-1"><Star className="w-3 h-3" />Quiz: {cert.quizScore}%</span>
                                {cert.totalStudyHours > 0 && (
                                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{cert.totalStudyHours}h de estudo</span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); setExpandedId(null); }}
                              className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold text-white/50 hover:text-white hover:border-white/30 transition-colors shrink-0 cursor-pointer"
                            >
                              Fechar
                            </button>
                          </div>

                          <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.35 }}
                            className="mb-5"
                          >
                            <CertificateArtwork
                              courseSlug={cert.courseSlug}
                              courseTitle={cert.courseTitle}
                              studentName={cert.userName}
                              certificateNumber={cert.certificateNumber}
                              issuedAt={cert.issuedAt}
                            />
                          </motion.div>

                          <div className="flex items-center gap-2 mb-4 min-w-0 flex-wrap">
                            <span className="text-[10px] text-white/25 uppercase tracking-wider shrink-0">Verificação:</span>
                            <code className="text-[10px] md:text-xs font-mono text-amber-400/70 bg-amber-500/5 px-2 py-0.5 rounded truncate max-w-[200px] sm:max-w-none">
                              {cert.verificationCode}
                            </code>
                            <button
                              onClick={(e) => { e.stopPropagation(); copyVerificationCode(cert.verificationCode); }}
                              className="p-1 hover:bg-secondary rounded transition-colors cursor-pointer"
                            >
                              {copiedCode === cert.verificationCode ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3 text-white/25 hover:text-white/50" />
                              )}
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleDownload(cert); }}
                              disabled={downloading === cert.verificationCode}
                              className="h-8 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-xs rounded-lg shadow-lg shadow-amber-600/20 px-3"
                            >
                              {downloading === cert.verificationCode ? (
                                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                              ) : (
                                <Download className="w-3 h-3 mr-1.5" />
                              )}
                              Baixar PDF
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                const year = new Date(cert.issuedAt).getFullYear();
                                window.open(
                                  `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(cert.courseTitle)}&organizationName=FayAI&issueYear=${year}&certUrl=${encodeURIComponent(cert.verificationUrl)}&certId=${encodeURIComponent(cert.certificateNumber)}`,
                                  "_blank",
                                  "noopener,noreferrer"
                                );
                              }}
                              className="h-8 border-[#0a66c2]/40 bg-[#0a66c2]/10 hover:bg-[#0a66c2]/20 text-[#70b7ff] text-xs rounded-lg px-3"
                            >
                              <Linkedin className="w-3 h-3 mr-1.5" />
                              Adicionar ao perfil
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(cert.verificationUrl)}`, "_blank", "noopener,noreferrer"); }}
                              className="h-8 border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-white/50 text-xs rounded-lg px-3"
                            >
                              <ExternalLink className="w-3 h-3 mr-1.5" />
                              Compartilhar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); window.open(cert.verificationUrl, "_blank"); }}
                              className="h-8 border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-white/50 text-xs rounded-lg px-3"
                            >
                              <Shield className="w-3 h-3 mr-1.5" />
                              Verificar Online
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* 5.2: Onde usar seu certificado */}
          <Card className="bg-white/[0.02] border-white/[0.06] p-4 md:p-6 overflow-hidden">
            <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Onde usar seu certificado
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[#0a66c2]/25 bg-[#0a66c2]/[0.06] p-4">
                <Linkedin className="w-5 h-5 text-[#70b7ff] mb-2" />
                <p className="text-xs font-bold text-white mb-1">Perfil do LinkedIn</p>
                <p className="text-[11px] leading-relaxed text-white/45">
                  Use &quot;Adicionar ao perfil&quot; no certificado expandido — ele entra na seção
                  Licenças e certificados com link de verificação.
                </p>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
                <BookOpen className="w-5 h-5 text-emerald-400 mb-2" />
                <p className="text-xs font-bold text-white mb-1">Currículo</p>
                <p className="text-[11px] leading-relaxed text-white/45">
                  Baixe o PDF e cite o número do certificado na seção de formação —
                  recrutadores podem conferir a autenticidade online.
                </p>
              </div>
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.05] p-4">
                <Shield className="w-5 h-5 text-violet-400 mb-2" />
                <p className="text-xs font-bold text-white mb-1">Verificação pública</p>
                <p className="text-[11px] leading-relaxed text-white/45">
                  Cada certificado tem uma página pública de verificação — mande o link
                  para qualquer pessoa confirmar que é seu.
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
