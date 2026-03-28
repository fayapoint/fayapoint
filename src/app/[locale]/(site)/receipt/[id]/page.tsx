"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Download,
  CheckCircle2,
  Shield,
  Award,
  Clock,
  CreditCard,
  Star,
  Sparkles,
  ArrowLeft,
  Infinity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getClientAuthHeaders } from "@/lib/client-auth";

// ─── Types ────────────────────────────────────────────────────────────────

interface ReceiptItem {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  type: string;
  slug?: string;
  lifetimeAccess?: boolean;
  certificateIncluded?: boolean;
}

interface Receipt {
  _id: string;
  receiptNumber: string;
  userName: string;
  userEmail: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentMethodLabel: string;
  paidAt: string;
  planName?: string;
  planCycle?: string;
  status: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const PAYMENT_ICONS: Record<string, string> = {
  pix: "⚡",
  boleto: "📄",
  credit_card: "💳",
  mercadopago: "🔵",
};

// ─── Component ────────────────────────────────────────────────────────────

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReceipt() {
      try {
        const res = await fetch(`/api/receipts/${params.id}`, {
          headers: getClientAuthHeaders(),
          credentials: "include",
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Recibo não encontrado");
        }
        const data = await res.json();
        setReceipt(data.receipt);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar recibo");
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchReceipt();
  }, [params.id]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando recibo...</div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <p className="text-red-400">{error || "Recibo não encontrado"}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  const isCourseReceipt = receipt.items.some((i) => i.type === "course");
  const isSubscription = receipt.items.some((i) => i.type === "subscription");
  const hasLifetimeAccess = receipt.items.some((i) => i.lifetimeAccess);
  const hasCertificate = receipt.items.some((i) => i.certificateIncluded);

  return (
    <>
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .receipt-container {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            background: white !important;
            color: black !important;
          }
          .receipt-card {
            border: 1px solid #e5e7eb !important;
            background: white !important;
            box-shadow: none !important;
          }
          .receipt-card * { color: #111827 !important; }
          .receipt-gradient { background: linear-gradient(135deg, #059669, #0891b2) !important; }
          .receipt-gradient * { color: white !important; }
        }
      `}</style>

      <div className="min-h-screen bg-black pt-24 pb-16 px-4">
        {/* Action Bar (no-print) */}
        <div className="no-print max-w-3xl mx-auto mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-white"
            onClick={() => router.push("/pt-BR/portal")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Portal
          </Button>
          <Button
            onClick={handlePrint}
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Salvar como PDF
          </Button>
        </div>

        {/* Receipt Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="receipt-container max-w-3xl mx-auto"
        >
          {/* Main Receipt Card */}
          <div className="receipt-card rounded-3xl border border-border bg-gray-950 overflow-hidden shadow-2xl">
            {/* Header Gradient */}
            <div className="receipt-gradient bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">FayAi</h1>
                        <p className="text-sm text-white/70">Academia de Inteligência Artificial</p>
                      </div>
                    </div>
                    <p className="text-white/60 text-sm">fayai.com.br</p>
                  </div>

                  <div className="text-right">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xl rounded-full px-4 py-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span className="text-sm font-bold text-white">PAGO</span>
                    </div>
                    <p className="text-white/60 text-xs">{formatShortDate(receipt.paidAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Receipt Details */}
            <div className="p-8 space-y-8">
              {/* Receipt Number & Date */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-border">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Comprovante</p>
                  <p className="text-xl font-bold text-white">{receipt.receiptNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Data do pagamento</p>
                  <p className="text-sm text-muted-foreground">{formatDate(receipt.paidAt)}</p>
                </div>
              </div>

              {/* Buyer Info */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Adquirido por</p>
                  <p className="text-lg font-semibold text-white">{receipt.userName}</p>
                  <p className="text-sm text-muted-foreground">{receipt.userEmail}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Forma de pagamento</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{PAYMENT_ICONS[receipt.paymentMethod] || "💰"}</span>
                    <p className="text-sm text-muted-foreground">{receipt.paymentMethodLabel}</p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">Itens adquiridos</p>
                <div className="space-y-4">
                  {receipt.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-white/8 bg-white/[0.02] p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-white">{item.name}</h3>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                          )}

                          {/* Badges */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {item.lifetimeAccess && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
                                <Infinity className="w-3 h-3" />
                                Acesso vitalício
                              </span>
                            )}
                            {item.certificateIncluded && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
                                <Award className="w-3 h-3" />
                                Certificado verificável
                              </span>
                            )}
                            {item.type === "subscription" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
                                <Star className="w-3 h-3" />
                                Assinatura {receipt.planCycle === "yearly" ? "anual" : "mensal"}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold text-white">
                            {formatCurrency(item.totalPrice)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-xs text-muted-foreground">
                              {item.quantity}x {formatCurrency(item.unitPrice)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 space-y-3">
                {receipt.discount > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-muted-foreground">{formatCurrency(receipt.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-400">Desconto aplicado</span>
                      <span className="text-emerald-400">- {formatCurrency(receipt.discount)}</span>
                    </div>
                    <div className="border-t border-border pt-3" />
                  </>
                )}
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium text-muted-foreground">Total pago</span>
                  <span className="text-3xl font-black bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                    {formatCurrency(receipt.total)}
                  </span>
                </div>
              </div>

              {/* What you got section */}
              {(hasLifetimeAccess || hasCertificate) && (
                <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] p-6">
                  <h4 className="text-sm font-bold text-emerald-300 uppercase tracking-wider mb-4">
                    O que está incluído na sua aquisição
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {hasLifetimeAccess && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                          <Infinity className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Acesso vitalício</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            O conteúdo é seu para sempre. Sem prazo de expiração.
                          </p>
                        </div>
                      </div>
                    )}
                    {hasCertificate && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
                          <Award className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Certificado verificável</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Ao completar, emita seu certificado com verificação pública.
                          </p>
                        </div>
                      </div>
                    )}
                    {isCourseReceipt && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center shrink-0 mt-0.5">
                          <Clock className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Atualizações incluídas</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Todas as melhorias futuras do curso são suas automaticamente.
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
                        <Shield className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Garantia de 7 dias</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Não ficou satisfeito? Reembolso integral em até 7 dias.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Subscription details */}
              {isSubscription && receipt.planName && (
                <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.04] p-6">
                  <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-3">
                    Detalhes da assinatura
                  </h4>
                  <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Plano</p>
                      <p className="text-white font-semibold mt-1">{receipt.planName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Ciclo</p>
                      <p className="text-white font-semibold mt-1">
                        {receipt.planCycle === "yearly" ? "Anual" : "Mensal"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Valor</p>
                      <p className="text-white font-semibold mt-1">
                        {formatCurrency(receipt.total)}/{receipt.planCycle === "yearly" ? "ano" : "mês"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="pt-6 border-t border-white/8 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Pagamento processado com segurança</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{receipt.paymentMethodLabel}</span>
                  </div>
                </div>

                <p className="text-[10px] text-gray-600 text-center leading-relaxed">
                  Este comprovante de aquisição é emitido pela plataforma FayAi (fayai.com.br) e serve como
                  registro da transação realizada. Este documento não constitui nota fiscal e não possui
                  validade fiscal nos termos da legislação brasileira. CNPJ em processo de regularização.
                  Em caso de dúvidas, entre em contato pelo suporte da plataforma.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
