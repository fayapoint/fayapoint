"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Linkedin,
  Loader2,
  ShieldCheck,
  Sparkles,
  Star,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { CertificateArtwork } from "@/components/certificates/CertificateArtwork";

interface VerifiedCertificate {
  studentName: string;
  courseTitle: string;
  courseSlug: string;
  courseLevel: string;
  courseDuration: string;
  courseCategory: string;
  certificateNumber: string;
  verificationCode: string;
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
  const [status, setStatus] = useState("");
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (!code) return;
    const verifyCertificate = async () => {
      try {
        const res = await fetch(`/api/certificates/verify/${code}`);
        const data = await res.json();
        if (data.valid) {
          setValid(true);
          setCertificate(data.certificate);
        } else {
          setStatus(data.status || "");
          setErrorMsg(data.message || data.error || "Certificado não encontrado.");
        }
      } catch {
        setErrorMsg("Erro de conexão. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };
    verifyCertificate();
  }, [code]);

  const formatDate = (dateStr: string) => new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link de verificação copiado!");
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080a15] text-white">
      <div className="pointer-events-none absolute left-[-12rem] top-[-10rem] h-[36rem] w-[36rem] rounded-full bg-violet-600/10 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-[-14rem] right-[-10rem] h-[38rem] w-[38rem] rounded-full bg-amber-400/10 blur-[120px]" />

      <header className="relative z-10 border-b border-white/[0.06] bg-[#080a15]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href={`/${locale}`} className="flex items-center gap-2 text-white/50 transition-colors hover:text-white">
            <ArrowLeft size={16} />
            <span className="text-sm font-black tracking-[.22em]">FAYAI</span>
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-[.14em] text-emerald-200/80">Registro público</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        {loading ? (
          <div className="py-28 text-center">
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-violet-400" />
            <p className="text-sm text-white/40">Validando o registro FayAi...</p>
          </div>
        ) : valid && certificate ? (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 180, damping: 14 }}
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 shadow-[0_0_50px_rgba(52,211,153,.18)]"
              >
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </motion.div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[.24em] text-emerald-300">Autenticidade confirmada</p>
              <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Uma conquista que pode ser verificada.</h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/45 sm:text-base">
                A FayAi confirma que este certificado é autêntico, único e corresponde à conclusão registrada abaixo.
              </p>
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[1.35fr_.65fr]">
              <CertificateArtwork
                courseSlug={certificate.courseSlug}
                courseTitle={certificate.courseTitle}
                studentName={certificate.studentName}
                certificateNumber={certificate.certificateNumber}
                issuedAt={certificate.issuedAt}
              />

              <aside className="overflow-hidden rounded-[1.4rem] border border-white/[0.08] bg-white/[0.035] backdrop-blur-xl">
                <div className="border-b border-white/[0.06] p-5">
                  <p className="text-[9px] font-bold uppercase tracking-[.2em] text-white/30">Titular</p>
                  <h2 className="mt-1 text-xl font-black text-white">{certificate.studentName}</h2>
                  <p className="mt-1 text-sm font-semibold text-amber-300">{certificate.courseTitle}</p>
                </div>

                <div className="grid grid-cols-2 gap-px bg-white/[0.06]">
                  {[
                    { icon: Star, label: "Avaliação", value: `${certificate.quizScore}%`, color: "text-amber-300" },
                    { icon: BookOpen, label: "Capítulos", value: `${certificate.chaptersCompleted}/${certificate.totalChapters}`, color: "text-violet-300" },
                    { icon: Clock, label: "Emissão", value: formatDate(certificate.issuedAt), color: "text-sky-300" },
                    { icon: ShieldCheck, label: "Registro", value: certificate.certificateNumber, color: "text-emerald-300" },
                  ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="min-w-0 bg-[#0d0f1d] p-4">
                      <Icon className={`mb-2 h-4 w-4 ${color}`} />
                      <p className="text-[9px] uppercase tracking-[.15em] text-white/25">{label}</p>
                      <p className="mt-1 break-words text-xs font-semibold text-white/70">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 p-5">
                  <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <Button className="h-11 w-full rounded-xl bg-[#0a66c2] font-bold text-white hover:bg-[#1877d2]">
                      <Linkedin className="mr-2 h-4 w-4" /> Compartilhar no LinkedIn
                    </Button>
                  </a>
                  <Button onClick={copyLink} variant="outline" className="h-11 w-full rounded-xl border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.07] hover:text-white">
                    {copied ? <Check className="mr-2 h-4 w-4 text-emerald-400" /> : <Copy className="mr-2 h-4 w-4" />}
                    {copied ? "Link copiado" : "Copiar link público"}
                  </Button>
                </div>
              </aside>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] uppercase tracking-[.13em] text-white/25">
              {certificate.courseLevel && <span>{certificate.courseLevel}</span>}
              {certificate.courseDuration && <span>{certificate.courseDuration}</span>}
              {certificate.courseCategory && <span>{certificate.courseCategory}</span>}
              {certificate.totalStudyHours > 0 && <span>{certificate.totalStudyHours}h de estudo</span>}
              <span className="flex items-center gap-1 text-emerald-300/60"><ShieldCheck className="h-3 w-3" /> Código {certificate.verificationCode}</span>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-xl py-14 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-red-400/20 bg-red-400/10">
              {status === "revoked" ? <AlertTriangle className="h-10 w-10 text-red-400" /> : <XCircle className="h-10 w-10 text-red-400" />}
            </div>
            <h1 className="text-3xl font-black">{status === "revoked" ? "Certificado revogado" : "Registro não encontrado"}</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/45">{errorMsg}</p>
            <Link href={`/${locale}`}><Button variant="outline" className="mt-6 border-white/10 bg-white/[0.03] text-white/60">Voltar à FayAi</Button></Link>
          </motion.div>
        )}

        <div className="mx-auto mt-12 max-w-md text-center">
          <div className="mb-3 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[.16em] text-white/25">
            <Sparkles className="h-3 w-3" /> Verificar outro certificado
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = (e.currentTarget.elements.namedItem("verifyCode") as HTMLInputElement).value.trim();
              if (input) window.location.href = `/${locale}/verificar-certificado/${input.toUpperCase()}`;
            }}
            className="flex gap-2"
          >
            <input name="verifyCode" placeholder="Código de verificação" className="min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/20 focus:border-amber-400/30" />
            <Button type="submit" className="rounded-xl bg-amber-400 px-5 font-bold text-[#17120a] hover:bg-amber-300">Verificar</Button>
          </form>
        </div>
      </main>
    </div>
  );
}
