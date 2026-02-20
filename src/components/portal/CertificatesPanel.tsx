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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface CertificateItem {
  _id: string;
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

export function CertificatesPanel() {
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    const token = localStorage.getItem("fayai_token");
    if (!token) return;
    try {
      const res = await fetch("/api/certificates", {
        headers: { Authorization: `Bearer ${token}` },
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
    const token = localStorage.getItem("fayai_token");
    if (!token) return;

    setDownloading(cert.verificationCode);
    try {
      const res = await fetch(`/api/certificates/${cert.verificationCode}/download`, {
        headers: { Authorization: `Bearer ${token}` },
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border border-amber-500/20 flex items-center justify-center">
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Meus Certificados</h2>
            <p className="text-xs text-white/40">
              {certificates.length} certificado{certificates.length !== 1 ? "s" : ""} emitido{certificates.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      {certificates.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-white/[0.02] border-white/[0.06] p-4">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-white/40">Certificados</span>
            </div>
            <p className="text-xl font-bold text-white">{certificates.length}</p>
          </Card>
          <Card className="bg-white/[0.02] border-white/[0.06] p-4">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-violet-400" />
              <span className="text-xs text-white/40">Média Quiz</span>
            </div>
            <p className="text-xl font-bold text-white">
              {Math.round(certificates.reduce((acc, c) => acc + c.quizScore, 0) / certificates.length)}%
            </p>
          </Card>
          <Card className="bg-white/[0.02] border-white/[0.06] p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-white/40">Horas de Estudo</span>
            </div>
            <p className="text-xl font-bold text-white">
              {certificates.reduce((acc, c) => acc + (c.totalStudyHours || 0), 0)}h
            </p>
          </Card>
          <Card className="bg-white/[0.02] border-white/[0.06] p-4">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-white/40">Capítulos</span>
            </div>
            <p className="text-xl font-bold text-white">
              {certificates.reduce((acc, c) => acc + (c.chaptersCompleted || 0), 0)}
            </p>
          </Card>
        </div>
      )}

      {/* Certificates Grid */}
      {certificates.length === 0 ? (
        <Card className="bg-white/[0.02] border-white/[0.06] p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-yellow-600/5 border border-amber-500/15 flex items-center justify-center">
            <Award className="w-10 h-10 text-amber-400/40" />
          </div>
          <h3 className="text-lg font-semibold text-white/70 mb-2">Nenhum certificado ainda</h3>
          <p className="text-sm text-white/30 max-w-md mx-auto">
            Complete a leitura de um curso e passe na avaliação final para receber seu certificado de conclusão.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
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

                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Certificate Icon */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500/15 to-yellow-600/10 border border-amber-500/20 flex items-center justify-center relative">
                          <Award className="w-8 h-8 text-amber-400" />
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-gray-950">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      </div>

                      {/* Certificate Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-base font-bold text-white leading-tight line-clamp-2">
                            {cert.courseTitle}
                          </h3>
                          <Badge className={cn("text-[10px] px-2 py-0.5 border flex-shrink-0", getLevelColor(cert.courseLevel))}>
                            {cert.courseLevel}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/35 mb-3">
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            {cert.certificateNumber}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(cert.issuedAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Quiz: {cert.quizScore}%
                          </span>
                          {cert.totalStudyHours > 0 && (
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {cert.totalStudyHours}h de estudo
                            </span>
                          )}
                        </div>

                        {/* Verification Code */}
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-[10px] text-white/25 uppercase tracking-wider">Verificação:</span>
                          <code className="text-xs font-mono text-amber-400/70 bg-amber-500/5 px-2 py-0.5 rounded">
                            {cert.verificationCode}
                          </code>
                          <button
                            onClick={() => copyVerificationCode(cert.verificationCode)}
                            className="p-1 hover:bg-white/5 rounded transition-colors"
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
                            className="h-8 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-xs rounded-lg shadow-lg shadow-amber-600/20"
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
                            onClick={() => window.open(cert.verificationUrl, "_blank")}
                            className="h-8 border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-white/50 text-xs rounded-lg"
                          >
                            <ExternalLink className="w-3 h-3 mr-1.5" />
                            Verificar Online
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
