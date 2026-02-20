"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Clock,
  AlertTriangle,
  Trophy,
  Download,
  Sparkles,
  Shield,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
}

interface QuestionResult {
  question: string;
  isCorrect: boolean;
  correctAnswer: number;
  userAnswer: number;
  options: string[];
}

interface QuizConfig {
  totalQuestions: number;
  passingScore: number;
  maxAttempts: number;
  currentAttempt: number;
  remainingAttempts: number;
}

interface CertificateInfo {
  certificateNumber: string;
  verificationCode: string;
  verificationUrl: string;
  issuedAt: string;
  courseTitle: string;
  studentName: string;
}

interface CourseQuizModalProps {
  courseSlug: string;
  courseTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onCertificateIssued?: () => void;
}

type QuizPhase = "loading" | "intro" | "quiz" | "submitting" | "results" | "certificate" | "error" | "already_issued" | "max_attempts";

export function CourseQuizModal({
  courseSlug,
  courseTitle,
  isOpen,
  onClose,
  onCertificateIssued,
}: CourseQuizModalProps) {
  const [phase, setPhase] = useState<QuizPhase>("loading");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answersToken, setAnswersToken] = useState("");
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [results, setResults] = useState<{
    status: string;
    score: number;
    correctCount: number;
    totalQuestions: number;
    questionResults: QuestionResult[];
    certificate?: CertificateInfo;
    xpEarned?: number;
    remainingAttempts?: number;
    passingScore?: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [existingCert, setExistingCert] = useState<CertificateInfo | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

  const loadQuiz = useCallback(async () => {
    if (isLoadingQuiz) return;
    setIsLoadingQuiz(true);
    setPhase("loading");
    const token = localStorage.getItem("fayapoint_token");
    if (!token) { setIsLoadingQuiz(false); return; }

    try {
      const res = await fetch(`/api/courses/${courseSlug}/quiz`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          setErrorMsg(data.error || "Você precisa completar o curso primeiro.");
          setPhase("error");
          return;
        }
        setErrorMsg(data.error || "Erro ao carregar avaliação.");
        setPhase("error");
        return;
      }

      if (data.status === "already_issued") {
        setExistingCert(data.certificate);
        setPhase("already_issued");
        return;
      }

      if (data.status === "max_attempts_reached") {
        setErrorMsg(`Você atingiu o limite de ${data.maxAttempts} tentativas. Última nota: ${data.lastScore}%`);
        setPhase("max_attempts");
        return;
      }

      setQuestions(data.questions || []);
      setAnswersToken(data.answersToken || "");
      setConfig(data.config || null);
      setSelectedAnswers({});
      setCurrentQuestion(0);
      setPhase("intro");
    } catch (e) {
      console.error("Quiz load error:", e);
      setErrorMsg("Erro de conexão ao carregar avaliação. Tente novamente.");
      setPhase("error");
    } finally {
      setIsLoadingQuiz(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseSlug, isLoadingQuiz]);

  const submitQuiz = async () => {
    setPhase("submitting");
    const token = localStorage.getItem("fayapoint_token");
    if (!token) return;

    const answersArray = questions.map((_, i) => selectedAnswers[i] ?? -1);

    try {
      const res = await fetch(`/api/courses/${courseSlug}/quiz`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers: answersArray,
          answersToken,
          questions,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Erro ao enviar avaliação.");
        setPhase("error");
        return;
      }

      setResults(data);

      if (data.status === "passed") {
        setPhase("certificate");
        onCertificateIssued?.();
        toast.success(`🎓 Certificado emitido! +${data.xpEarned || 500} XP`);
      } else {
        setPhase("results");
      }
    } catch (e) {
      console.error("Quiz submit error:", e);
      setErrorMsg("Erro de conexão ao enviar avaliação.");
      setPhase("error");
    }
  };

  const handleDownload = async (verificationCode: string) => {
    const token = localStorage.getItem("fayapoint_token");
    if (!token) return;
    try {
      const res = await fetch(`/api/certificates/${verificationCode}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { toast.error("Erro ao baixar"); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Certificado_FayaPoint_${courseSlug}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Certificado baixado!");
    } catch { toast.error("Erro ao baixar certificado"); }
  };

  // Start loading quiz when modal opens
  if (isOpen && phase === "loading" && questions.length === 0 && !isLoadingQuiz) {
    loadQuiz();
  }

  if (!isOpen) return null;

  const answeredCount = Object.keys(selectedAnswers).length;
  const allAnswered = answeredCount === questions.length;
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#12131c] border border-white/[0.08] rounded-2xl shadow-2xl"
      >
        {/* ═══ LOADING ═══ */}
        {phase === "loading" && (
          <div className="p-12 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-violet-400 mx-auto mb-4" />
            <p className="text-sm text-white/40">Gerando avaliação com IA...</p>
            <p className="text-xs text-white/20 mt-1">Analisando conteúdo do curso</p>
          </div>
        )}

        {/* ═══ INTRO ═══ */}
        {phase === "intro" && config && (
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/10 border border-violet-500/20 flex items-center justify-center">
                <Award className="w-8 h-8 text-violet-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Avaliação Final</h2>
              <p className="text-sm text-white/40">{courseTitle}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <Card className="bg-white/[0.03] border-white/[0.06] p-4 text-center">
                <p className="text-2xl font-bold text-violet-400">{config.totalQuestions}</p>
                <p className="text-xs text-white/30">Perguntas</p>
              </Card>
              <Card className="bg-white/[0.03] border-white/[0.06] p-4 text-center">
                <p className="text-2xl font-bold text-emerald-400">{config.passingScore}%</p>
                <p className="text-xs text-white/30">Nota Mínima</p>
              </Card>
              <Card className="bg-white/[0.03] border-white/[0.06] p-4 text-center">
                <p className="text-2xl font-bold text-amber-400">{config.currentAttempt}/{config.maxAttempts}</p>
                <p className="text-xs text-white/30">Tentativa</p>
              </Card>
              <Card className="bg-white/[0.03] border-white/[0.06] p-4 text-center">
                <p className="text-2xl font-bold text-blue-400">∞</p>
                <p className="text-xs text-white/30">Sem Tempo Limite</p>
              </Card>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-white/50">
                  <p className="font-medium text-white/70 mb-1">Importante</p>
                  <ul className="space-y-1 text-xs">
                    <li>• As perguntas são geradas por IA com base no conteúdo do curso</li>
                    <li>• Você precisa acertar pelo menos {config.passingScore}% para receber o certificado</li>
                    <li>• Você tem {config.remainingAttempts} tentativa{config.remainingAttempts !== 1 ? "s" : ""} restante{config.remainingAttempts !== 1 ? "s" : ""}</li>
                    <li>• Ao passar, seu certificado será emitido automaticamente</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1 border-white/[0.08] text-white/40">
                Cancelar
              </Button>
              <Button
                onClick={() => setPhase("quiz")}
                className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
              >
                Iniciar Avaliação
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ═══ QUIZ ═══ */}
        {phase === "quiz" && questions.length > 0 && (
          <div className="p-6 sm:p-8">
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/30">
                  Pergunta {currentQuestion + 1} de {questions.length}
                </span>
                <span className="text-xs text-violet-400">{progress}% respondido</span>
              </div>
              <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Question */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="text-base font-semibold text-white mb-5 leading-relaxed">
                  {questions[currentQuestion].question}
                </h3>

                <div className="space-y-2.5">
                  {questions[currentQuestion].options.map((option, optIdx) => {
                    const isSelected = selectedAnswers[currentQuestion] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => {
                          setSelectedAnswers(prev => ({
                            ...prev,
                            [currentQuestion]: optIdx,
                          }));
                        }}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-start gap-3",
                          isSelected
                            ? "bg-violet-500/10 border-violet-500/30 text-white"
                            : "bg-white/[0.02] border-white/[0.06] text-white/60 hover:bg-white/[0.04] hover:border-white/[0.1]"
                        )}
                      >
                        <span
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5",
                            isSelected
                              ? "bg-violet-500 text-white"
                              : "bg-white/[0.05] text-white/30"
                          )}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="text-sm leading-relaxed">{option}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.06]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
                className="border-white/[0.08] text-white/40"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>

              {/* Question dots */}
              <div className="flex gap-1 flex-wrap justify-center max-w-[200px]">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentQuestion(i)}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-all",
                      i === currentQuestion
                        ? "bg-violet-400 scale-125"
                        : selectedAnswers[i] !== undefined
                        ? "bg-emerald-400/60"
                        : "bg-white/10"
                    )}
                  />
                ))}
              </div>

              {currentQuestion < questions.length - 1 ? (
                <Button
                  size="sm"
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                  className="bg-violet-600 hover:bg-violet-500"
                >
                  Próxima
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={submitQuiz}
                  disabled={!allAnswered}
                  className={cn(
                    allAnswered
                      ? "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500"
                      : "bg-gray-700 text-gray-400"
                  )}
                >
                  Enviar
                  <CheckCircle2 className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ═══ SUBMITTING ═══ */}
        {phase === "submitting" && (
          <div className="p-12 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mx-auto mb-4" />
            <p className="text-sm text-white/40">Corrigindo avaliação...</p>
          </div>
        )}

        {/* ═══ RESULTS (Failed) ═══ */}
        {phase === "results" && results && (
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Não foi dessa vez</h2>
              <p className="text-sm text-white/40">
                Nota: <span className="text-red-400 font-bold">{results.score}%</span> · Mínimo: {results.passingScore}%
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mb-4">
              <p className="text-sm text-white/50 text-center">
                Você acertou <span className="text-white font-bold">{results.correctCount}</span> de{" "}
                <span className="text-white font-bold">{results.totalQuestions}</span> perguntas.
                {results.remainingAttempts && results.remainingAttempts > 0 ? (
                  <span className="block mt-1 text-amber-400/70">
                    Você ainda tem {results.remainingAttempts} tentativa{results.remainingAttempts !== 1 ? "s" : ""}.
                  </span>
                ) : (
                  <span className="block mt-1 text-red-400/70">
                    Você atingiu o limite de tentativas.
                  </span>
                )}
              </p>
            </div>

            {/* Question review */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto mb-6">
              {results.questionResults.map((qr, i) => (
                <div
                  key={i}
                  className={cn(
                    "p-3 rounded-lg border text-sm",
                    qr.isCorrect
                      ? "bg-emerald-500/5 border-emerald-500/15"
                      : "bg-red-500/5 border-red-500/15"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {qr.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-white/70 text-xs leading-relaxed">{qr.question}</p>
                      {!qr.isCorrect && (
                        <p className="text-emerald-400/60 text-[11px] mt-1">
                          Correta: {qr.options[qr.correctAnswer]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1 border-white/[0.08] text-white/40">
                Fechar
              </Button>
              {results.remainingAttempts && results.remainingAttempts > 0 && (
                <Button
                  onClick={loadQuiz}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
                >
                  Tentar Novamente
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ═══ CERTIFICATE ISSUED ═══ */}
        {phase === "certificate" && results?.certificate && (
          <div className="p-8">
            <div className="text-center mb-6">
              {/* Celebration animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="relative inline-block mb-4"
              >
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border border-amber-500/30 flex items-center justify-center">
                  <Trophy className="w-10 h-10 text-amber-400" />
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute -top-2 -right-2"
                >
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                </motion.div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h2 className="text-2xl font-bold text-white mb-1">Parabéns!</h2>
                <p className="text-sm text-white/40">Certificado emitido com sucesso</p>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              {/* Certificate card */}
              <Card className="bg-gradient-to-br from-amber-500/[0.06] to-yellow-600/[0.02] border-amber-500/15 p-5 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Certificado Oficial</span>
                </div>

                <p className="text-base font-bold text-white mb-1">{results.certificate.courseTitle}</p>
                <p className="text-sm text-white/50 mb-3">{results.certificate.studentName}</p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-black/20 rounded-lg p-2">
                    <span className="text-white/30 block">Número</span>
                    <span className="text-white/70 font-mono">{results.certificate.certificateNumber}</span>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2">
                    <span className="text-white/30 block">Nota</span>
                    <span className="text-emerald-400 font-bold">{results.score}%</span>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2">
                    <span className="text-white/30 block">Verificação</span>
                    <span className="text-amber-400/80 font-mono text-[10px]">{results.certificate.verificationCode}</span>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2">
                    <span className="text-white/30 block">XP Ganho</span>
                    <span className="text-violet-400 font-bold">+{results.xpEarned || 500}</span>
                  </div>
                </div>
              </Card>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleDownload(results.certificate!.verificationCode)}
                  className="flex-1 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 shadow-lg shadow-amber-600/20"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Certificado PDF
                </Button>
                <Button variant="outline" onClick={onClose} className="border-white/[0.08] text-white/40">
                  Fechar
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ═══ ALREADY ISSUED ═══ */}
        {phase === "already_issued" && existingCert && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-600/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Certificado Já Emitido</h2>
            <p className="text-sm text-white/40 mb-6">
              Seu certificado para este curso já foi emitido em{" "}
              {new Intl.DateTimeFormat("pt-BR").format(new Date(existingCert.issuedAt))}
            </p>

            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => handleDownload(existingCert.verificationCode)}
                className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar PDF
              </Button>
              <Button variant="outline" onClick={onClose} className="border-white/[0.08] text-white/40">
                Fechar
              </Button>
            </div>
          </div>
        )}

        {/* ═══ MAX ATTEMPTS ═══ */}
        {phase === "max_attempts" && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Tentativas Esgotadas</h2>
            <p className="text-sm text-white/40 mb-6">{errorMsg}</p>
            <Button variant="outline" onClick={onClose} className="border-white/[0.08] text-white/40">
              Fechar
            </Button>
          </div>
        )}

        {/* ═══ ERROR ═══ */}
        {phase === "error" && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Erro</h2>
            <p className="text-sm text-white/40 mb-6">{errorMsg}</p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => { setErrorMsg(""); loadQuiz(); }}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
              >
                Tentar Novamente
              </Button>
              <Button variant="outline" onClick={onClose} className="border-white/[0.08] text-white/40">
                Fechar
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
