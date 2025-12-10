"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "react-hot-toast";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  QrCode,
  FileText,
  Users,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Link as LinkIcon,
  Receipt,
  Loader2,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface FinancialData {
  period: string;
  startDate: string;
  summary: {
    totalRevenue: number;
    pendingRevenue: number;
    failedRevenue: number;
    totalPayments: number;
    paidPayments: number;
    pendingPayments: number;
    failedPayments: number;
    activeSubscriptions: number;
    totalSubscriptions: number;
    averageTicket: number;
  };
  byMethod: {
    pix: { count: number; total: number };
    boleto: { count: number; total: number };
    credit_card: { count: number; total: number };
  };
  asaas: {
    income: number;
    incomeCount: number;
    pending: number;
    pendingCount: number;
    overdue: number;
    overdueCount: number;
    balance: number;
    blockedBalance: number;
    fees: unknown;
  } | null;
  charts: {
    dailyRevenue: { date: string; revenue: number }[];
  };
  recentTransactions: {
    orderNumber: string;
    status: string;
    method: string;
    total: number;
    createdAt: string;
    paidAt: string | null;
    userName: string;
  }[];
}

export function PaymentsManagement() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FinancialData | null>(null);
  const [period, setPeriod] = useState("month");
  const [showPaymentLinks, setShowPaymentLinks] = useState(false);
  const [creatingLink, setCreatingLink] = useState(false);

  // New payment link form
  const [linkForm, setLinkForm] = useState({
    name: "",
    description: "",
    value: "",
    chargeType: "DETACHED",
    billingType: "UNDEFINED",
    maxInstallments: "12",
  });

  useEffect(() => {
    fetchFinancialData();
  }, [period]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("fayapoint_token");
      const response = await fetch(`/api/admin/financial?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Erro ao carregar dados");

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching financial data:", error);
      toast.error("Erro ao carregar dados financeiros");
    } finally {
      setLoading(false);
    }
  };

  const createPaymentLink = async () => {
    if (!linkForm.name) {
      toast.error("Nome do link é obrigatório");
      return;
    }

    setCreatingLink(true);
    try {
      const token = localStorage.getItem("fayapoint_token");
      const response = await fetch("/api/payment-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: linkForm.name,
          description: linkForm.description,
          value: linkForm.value ? parseFloat(linkForm.value) : undefined,
          chargeType: linkForm.chargeType,
          billingType: linkForm.billingType,
          maxInstallmentCount: parseInt(linkForm.maxInstallments),
        }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      toast.success("Link criado com sucesso!");
      
      // Copy URL to clipboard
      if (result.paymentLink?.url) {
        navigator.clipboard.writeText(result.paymentLink.url);
        toast.success("URL copiada para o clipboard!");
      }

      // Reset form
      setLinkForm({
        name: "",
        description: "",
        value: "",
        chargeType: "DETACHED",
        billingType: "UNDEFINED",
        maxInstallments: "12",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar link");
    } finally {
      setCreatingLink(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
      case "confirmed":
        return "text-green-400";
      case "pending":
        return "text-yellow-400";
      case "failed":
      case "expired":
      case "refunded":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
      case "confirmed":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case "failed":
      case "expired":
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "pix":
        return <QrCode className="w-4 h-4 text-green-400" />;
      case "boleto":
        return <FileText className="w-4 h-4 text-blue-400" />;
      case "credit_card":
        return <CreditCard className="w-4 h-4 text-purple-400" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestão de Pagamentos</h2>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
          >
            <option value="day">Hoje</option>
            <option value="week">Última Semana</option>
            <option value="month">Este Mês</option>
            <option value="year">Este Ano</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFinancialData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <Card className="p-4 bg-gray-900/50 border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-green-500/20 rounded">
                <DollarSign className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-sm text-gray-400">Receita Total</span>
            </div>
            <p className="text-2xl font-bold text-green-400">
              {formatCurrency(data.summary.totalRevenue)}
            </p>
            <p className="text-xs text-gray-500">
              {data.summary.paidPayments} pagamentos
            </p>
          </Card>

          {/* Pending */}
          <Card className="p-4 bg-gray-900/50 border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-yellow-500/20 rounded">
                <Clock className="w-4 h-4 text-yellow-400" />
              </div>
              <span className="text-sm text-gray-400">Pendente</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">
              {formatCurrency(data.summary.pendingRevenue)}
            </p>
            <p className="text-xs text-gray-500">
              {data.summary.pendingPayments} pagamentos
            </p>
          </Card>

          {/* Subscriptions */}
          <Card className="p-4 bg-gray-900/50 border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-purple-500/20 rounded">
                <RefreshCw className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-sm text-gray-400">Assinaturas</span>
            </div>
            <p className="text-2xl font-bold">
              {data.summary.activeSubscriptions}
            </p>
            <p className="text-xs text-gray-500">
              de {data.summary.totalSubscriptions} total
            </p>
          </Card>

          {/* Average Ticket */}
          <Card className="p-4 bg-gray-900/50 border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-blue-500/20 rounded">
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm text-gray-400">Ticket Médio</span>
            </div>
            <p className="text-2xl font-bold">
              {formatCurrency(data.summary.averageTicket)}
            </p>
            <p className="text-xs text-gray-500">por transação</p>
          </Card>
        </div>
      )}

      {/* Asaas Balance */}
      {data?.asaas && (
        <Card className="p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Saldo Asaas Disponível</p>
              <p className="text-3xl font-bold text-white">
                {formatCurrency(data.asaas.balance)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400 mb-1">Saldo Bloqueado</p>
              <p className="text-xl font-semibold text-yellow-400">
                {formatCurrency(data.asaas.blockedBalance)}
              </p>
            </div>
          </div>
          {data.asaas.overdue > 0 && (
            <div className="mt-4 p-3 bg-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                {data.asaas.overdueCount} cobranças atrasadas: {formatCurrency(data.asaas.overdue)}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* By Method Stats */}
      {data && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 bg-gray-900/50 border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <QrCode className="w-5 h-5 text-green-400" />
              <span className="font-medium">PIX</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(data.byMethod.pix.total)}</p>
            <p className="text-xs text-gray-500">{data.byMethod.pix.count} transações</p>
          </Card>

          <Card className="p-4 bg-gray-900/50 border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <span className="font-medium">Boleto</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(data.byMethod.boleto.total)}</p>
            <p className="text-xs text-gray-500">{data.byMethod.boleto.count} transações</p>
          </Card>

          <Card className="p-4 bg-gray-900/50 border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-purple-400" />
              <span className="font-medium">Cartão</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(data.byMethod.credit_card.total)}</p>
            <p className="text-xs text-gray-500">{data.byMethod.credit_card.count} transações</p>
          </Card>
        </div>
      )}

      <Separator className="bg-gray-800" />

      {/* Payment Links Section */}
      <div>
        <button
          onClick={() => setShowPaymentLinks(!showPaymentLinks)}
          className="flex items-center gap-2 text-lg font-semibold mb-4 hover:text-purple-400 transition"
        >
          <LinkIcon className="w-5 h-5" />
          Links de Pagamento
          {showPaymentLinks ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {showPaymentLinks && (
          <Card className="p-4 bg-gray-900/50 border-gray-800">
            <h4 className="text-sm font-medium text-gray-400 mb-4">Criar Novo Link</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nome *</label>
                <input
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                  value={linkForm.name}
                  onChange={(e) => setLinkForm({ ...linkForm, name: e.target.value })}
                  placeholder="Ex: Curso Completo de IA"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Valor (opcional)</label>
                <input
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                  value={linkForm.value}
                  onChange={(e) => setLinkForm({ ...linkForm, value: e.target.value })}
                  placeholder="Deixe vazio para valor livre"
                  type="number"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tipo de Cobrança</label>
                <select
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                  value={linkForm.chargeType}
                  onChange={(e) => setLinkForm({ ...linkForm, chargeType: e.target.value })}
                >
                  <option value="DETACHED">Avulso</option>
                  <option value="RECURRENT">Recorrente</option>
                  <option value="INSTALLMENT">Parcelado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Método de Pagamento</label>
                <select
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                  value={linkForm.billingType}
                  onChange={(e) => setLinkForm({ ...linkForm, billingType: e.target.value })}
                >
                  <option value="UNDEFINED">Todos</option>
                  <option value="BOLETO">Boleto</option>
                  <option value="CREDIT_CARD">Cartão</option>
                  <option value="PIX">PIX</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Descrição</label>
                <input
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                  value={linkForm.description}
                  onChange={(e) => setLinkForm({ ...linkForm, description: e.target.value })}
                  placeholder="Descrição opcional do produto/serviço"
                />
              </div>
            </div>
            <Button
              className="mt-4"
              onClick={createPaymentLink}
              disabled={creatingLink}
            >
              {creatingLink ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Criar Link de Pagamento
                </>
              )}
            </Button>
          </Card>
        )}
      </div>

      <Separator className="bg-gray-800" />

      {/* Recent Transactions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Transações Recentes</h3>
        <Card className="bg-gray-900/50 border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Pedido</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Método</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Status</th>
                  <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">Valor</th>
                  <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {data?.recentTransactions.map((tx) => (
                  <tr key={tx.orderNumber} className="hover:bg-gray-800/30 transition">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm">{tx.orderNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">{tx.userName || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getMethodIcon(tx.method)}
                        <span className="text-sm capitalize">{tx.method.replace("_", " ")}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(tx.status)}
                        <span className={`text-sm capitalize ${getStatusColor(tx.status)}`}>
                          {tx.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(tx.total)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-400">
                      {new Date(tx.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default PaymentsManagement;
