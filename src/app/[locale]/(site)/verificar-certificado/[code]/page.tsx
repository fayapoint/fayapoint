"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Loader2,
  Award,
  Clock,
  BookOpen,
  Star,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

interface VerifiedCertificate {
  studentName: string;
  courseTitle: string;
  courseLevel: string;
  courseDuration: string;
  courseCategory: string;
  certificateNumber: string;
  issuedAt: string;
  quizScore: number;
  totalStudyHours: number;
  chaptersCompleted: number;
  totalChapters: number;
}

export default function VerifyCertificatePage() {
  const params = useParams();
  const code = params.code as string;
  const locale = (params.locale as string) || "pt-BR";

  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [certificate, setCertificate] = useState<VerifiedCertificate | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    if (!code) return;
    verifyCertificate();
  }, [code]);

  const verifyCertificate = async () => {
    try {
      const res = await fetch(`/api/certificates/verify/${code}`);
      const data = await res.json();

      if (data.valid) {
        setValid(true);
        setCertificate(data.certificate);
      } else {
        setValid(false);
        setStatus(data.status || "");
        setErrorMsg(data.message || data.error || "Certificado não encontrado.");
      }
    } catch {
      setErrorMsg("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(dateStr));
  };

  return (
    <div className="min-h-screen bg-[#0b0c13] text-white">
      {/* Header */}
      <header className="border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors">
            <ArrowLeft size={16} />
            <span className="text-sm">FayAi</span>
          </Link>
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-amber-400" />
            <span className="text-sm text-white/50">Verificação de Certificado</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-16">
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-violet-400 mx-auto mb-4" />
            <p className="text-sm text-white/40">Verificando certificado...</p>
          </div>
        ) : valid && certificate ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Valid Certificate */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="w-20 h-20 mx-auto mb-5 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center"
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </motion.div>
              <h1 className="text-2xl font-bold text-white mb-2">Certificado Válido</h1>
              <p className="text-sm text-white/40">Este certificado é autêntico e foi emitido pela FayAi Academy.</p>
            </div>

            <Card className="bg-white/[0.02] border-white/[0.08] overflow-hidden">
              {/* Gold accent */}
              <div className="h-1.5 bg-gradient-to-r from-amber-500/60 via-yellow-400/40 to-amber-500/60" />

              <div className="p-8">
                {/* Certificate Icon */}
                <div className="flex items-center justify-center mb-6">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/15 to-yellow-600/10 border border-amber-500/20 flex items-center justify-center">
                    <Award className="w-7 h-7 text-amber-400" />
                  </div>
                </div>

                {/* Student Name */}
                <div className="text-center mb-6">
                  <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Certificado conferido a</p>
                  <h2 className="text-2xl font-bold text-white">{certificate.studentName}</h2>
                </div>

                {/* Course Title */}
                <div className="text-center mb-6">
                  <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Curso concluído</p>
                  <h3 className="text-lg font-semibold text-amber-400">{certificate.courseTitle}</h3>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
                    <Shield className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                    <p className="text-xs text-white/30">Número</p>
                    <p className="text-xs font-mono text-white/70 mt-0.5">{certificate.certificateNumber}</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
                    <Clock className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                    <p className="text-xs text-white/30">Emitido em</p>
                    <p className="text-xs text-white/70 mt-0.5">{formatDate(certificate.issuedAt)}</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
                    <Star className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                    <p className="text-xs text-white/30">Avaliação</p>
                    <p className="text-xs text-white/70 mt-0.5">{certificate.quizScore}%</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
                    <BookOpen className="w-4 h-4 text-violet-400 mx-auto mb-1" />
                    <p className="text-xs text-white/30">Capítulos</p>
                    <p className="text-xs text-white/70 mt-0.5">{certificate.chaptersCompleted}/{certificate.totalChapters}</p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-white/30">
                  {certificate.courseLevel && <span>Nível: {certificate.courseLevel}</span>}
                  {certificate.courseDuration && <span>Duração: {certificate.courseDuration}</span>}
                  {certificate.courseCategory && <span>Categoria: {certificate.courseCategory}</span>}
                  {certificate.totalStudyHours > 0 && <span>{certificate.totalStudyHours}h de estudo</span>}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-white/[0.06] px-8 py-4 bg-white/[0.01]">
                <div className="flex items-center justify-center gap-2 text-xs text-white/25">
                  <Shield className="w-3 h-3" />
                  <span>Verificado digitalmente pela FayAi Academy</span>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Invalid Certificate */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center">
                {status === "revoked" ? (
                  <AlertTriangle className="w-10 h-10 text-red-400" />
                ) : (
                  <XCircle className="w-10 h-10 text-red-400" />
                )}
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {status === "revoked" ? "Certificado Revogado" : "Certificado Não Encontrado"}
              </h1>
              <p className="text-sm text-white/40 max-w-md mx-auto">{errorMsg}</p>
            </div>

            <div className="text-center">
              <Link href={`/${locale}`}>
                <Button variant="outline" className="border-white/[0.08] text-white/40">
                  Voltar à Página Inicial
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Search Box */}
        <div className="mt-12 text-center">
          <p className="text-xs text-white/20 mb-3">Verificar outro certificado</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = (e.target as HTMLFormElement).elements.namedItem("verifyCode") as HTMLInputElement;
              if (input.value.trim()) {
                window.location.href = `/${locale}/verificar-certificado/${input.value.trim().toUpperCase()}`;
              }
            }}
            className="flex gap-2 max-w-sm mx-auto"
          >
            <input
              name="verifyCode"
              placeholder="Código de verificação"
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/30"
            />
            <Button type="submit" size="sm" className="bg-violet-600 hover:bg-violet-500 rounded-xl px-4">
              Verificar
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
