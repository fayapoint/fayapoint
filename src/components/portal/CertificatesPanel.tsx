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
          <Card className="bg-white/[0.02] border-white/[0.06] p-3 md:p-4 overflow-hidden">
            <div className="flex items-center gap-1.5 md:gap-2 mb-1">
              <Trophy className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400 shrink-0" />
              <span className="text-[10px] md:text-xs text-white/40 truncate">Certificados</span>
            </div>
            <p className="text-lg md:text-xl font-bold text-white">{certificates.length}</p>
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
        <div className="grid gap-3 md:gap-4">
          <AnimatePresence>
            {certificates.map((cert, idx) => (
              <motion.div
                key={cert._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-white/[0.02] border-white/[0.06] overflow-hidden group hover:border-amber-500/20 transition-all duration-300">
                  {/* Gold top accent */}
                  <div className="h-1 bg-gradient-to-r from-amber-500/60 via-yellow-400/40 to-amber-500/60" />

                  <div className="p-4 sm:p-6">
                    <div className="mb-5">
                      <CertificateArtwork
                        courseSlug={cert.courseSlug}
                        courseTitle={cert.courseTitle}
                        studentName={cert.userName}
                        certificateNumber={cert.certificateNumber}
                        issuedAt={cert.issuedAt}
                        compact
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                      {/* Certificate Icon */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-amber-500/15 to-yellow-600/10 border border-amber-500/20 flex items-center justify-center relative">
                          <Award className="w-6 h-6 md:w-8 md:h-8 text-amber-400" />
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-gray-950">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      </div>

                      {/* Certificate Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
                          <h3 className="text-sm md:text-base font-bold text-white leading-tight line-clamp-2 min-w-0">
                            {cert.courseTitle}
                          </h3>
                          <Badge className={cn("text-[9px] md:text-[10px] px-1.5 md:px-2 py-0.5 border flex-shrink-0", getLevelColor(cert.courseLevel))}>
                            {cert.courseLevel}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 md:gap-x-4 gap-y-1 text-[10px] md:text-xs text-white/35 mb-2 md:mb-3">
                          <span className="flex items-center gap-1 shrink-0">
                            <Shield className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[100px] sm:max-w-none">{cert.certificateNumber}</span>
                          </span>
                          <span className="flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3 shrink-0" />
                            {formatDate(cert.issuedAt)}
                          </span>
                          <span className="flex items-center gap-1 shrink-0">
                            <Star className="w-3 h-3 shrink-0" />
                            Quiz: {cert.quizScore}%
                          </span>
                          {cert.totalStudyHours > 0 && (
                            <span className="flex items-center gap-1 shrink-0">
                              <BookOpen className="w-3 h-3 shrink-0" />
                              {cert.totalStudyHours}h de estudo
                            </span>
                          )}
                        </div>

                        {/* Verification Code */}
                        <div className="flex items-center gap-2 mb-3 md:mb-4 min-w-0 flex-wrap">
                          <span className="text-[10px] text-white/25 uppercase tracking-wider shrink-0">Verificação:</span>
                          <code className="text-[10px] md:text-xs font-mono text-amber-400/70 bg-amber-500/5 px-2 py-0.5 rounded truncate max-w-[160px] sm:max-w-none">
                            {cert.verificationCode}
                          </code>
                          <button
                            onClick={() => copyVerificationCode(cert.verificationCode)}
                            className="p-1 hover:bg-secondary rounded transition-colors"
                          >
                            {copiedCode === cert.verificationCode ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-white/25 hover:text-white/50" />
                            )}
                          </button>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleDownload(cert)}
                            disabled={downloading === cert.verificationCode}
                            className="h-7 md:h-8 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-[10px] md:text-xs rounded-lg shadow-lg shadow-amber-600/20 px-2 md:px-3"
                          >
                            {downloading === cert.verificationCode ? (
                              <Loader2 className="w-3 h-3 mr-1 md:mr-1.5 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3 mr-1 md:mr-1.5" />
                            )}
                            Baixar PDF
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(cert.verificationUrl)}`, "_blank", "noopener,noreferrer")}
                            className="h-7 md:h-8 border-[#0a66c2]/40 bg-[#0a66c2]/10 hover:bg-[#0a66c2]/20 text-[#70b7ff] text-[10px] md:text-xs rounded-lg px-2 md:px-3"
                          >
                            <Linkedin className="w-3 h-3 mr-1 md:mr-1.5" />
                            LinkedIn
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(cert.verificationUrl, "_blank")}
                            className="h-7 md:h-8 border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-white/50 text-[10px] md:text-xs rounded-lg px-2 md:px-3"
                          >
                            <ExternalLink className="w-3 h-3 mr-1 md:mr-1.5" />
                            <span className="hidden sm:inline">Verificar Online</span>
                            <span className="sm:hidden">Verificar</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
