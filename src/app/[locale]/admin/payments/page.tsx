"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCcw,
  Download,
  Filter,
  Search,
  ExternalLink,
  Eye,
  MoreVertical,
  Calendar,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PiggyBank,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  user: {
    name: string;
    email: string;
  };
  amount: number;
  status: "completed" | "pending" | "failed" | "refunded";
  method: "pix" | "credit_card" | "boleto";
  description: string;
  createdAt: string;
}

const SAMPLE_PAYMENTS: Payment[] = [
  {
    id: "pay_001",
    user: { name: "João Silva", email: "joao@email.com" },
    amount: 97.00,
    status: "completed",
    method: "pix",
    description: "Plano Pro - Mensal",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "pay_002",
    user: { name: "Maria Santos", email: "maria@email.com" },
    amount: 297.00,
    status: "completed",
    method: "credit_card",
    description: "Plano Business - Mensal",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "pay_003",
    user: { name: "Pedro Costa", email: "pedro@email.com" },
    amount: 47.00,
    status: "pending",
    method: "boleto",
    description: "Plano Starter - Mensal",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "pay_004",
    user: { name: "Ana Lima", email: "ana@email.com" },
    amount: 97.00,
    status: "failed",
    method: "credit_card",
    description: "Plano Pro - Mensal",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: "pay_005",
    user: { name: "Carlos Souza", email: "carlos@email.com" },
    amount: 47.00,
    status: "refunded",
    method: "pix",
    description: "Plano Starter - Mensal",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

function PaymentCard({ payment }: { payment: Payment }) {
  const [showMenu, setShowMenu] = useState(false);

  const statusConfig = {
    completed: { color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30", icon: CheckCircle, label: "Aprovado" },
    pending: { color: "text-amber-400 bg-amber-500/20 border-amber-500/30", icon: Clock, label: "Pendente" },
    failed: { color: "text-red-400 bg-red-500/20 border-red-500/30", icon: XCircle, label: "Falhou" },
    refunded: { color: "text-gray-400 bg-gray-500/20 border-gray-500/30", icon: ArrowDownRight, label: "Reembolsado" },
  };

  const methodLabels = {
    pix: "PIX",
    credit_card: "Cartão",
    boleto: "Boleto",
  };

  const status = statusConfig[payment.status];
  const StatusIcon = status.icon;

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-white/20 transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={cn("p-2 rounded-lg shrink-0", status.color.split(" ")[1])}>
            <StatusIcon size={16} className={status.color.split(" ")[0]} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white text-sm truncate">{payment.user.name}</p>
            <p className="text-xs text-gray-500 truncate">{payment.user.email}</p>
          </div>
        </div>
        
        <div className="text-right">
          <p className={cn(
            "font-bold text-base",
            payment.status === "refunded" ? "text-gray-400 line-through" : "text-white"
          )}>
            R$ {payment.amount.toFixed(2)}
          </p>
          <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium border", status.color)}>
            {status.label}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="text-gray-500">{payment.description}</span>
          <span className="px-2 py-0.5 rounded bg-white/5 text-gray-400">
            {methodLabels[payment.method]}
          </span>
        </div>
        <span className="text-gray-500">
          {new Date(payment.createdAt).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

export default function AdminPaymentsPage() {
  const [payments] = useState<Payment[]>(SAMPLE_PAYMENTS);
  const [filter, setFilter] = useState<"all" | "completed" | "pending" | "failed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPayments = payments.filter(p => {
    if (filter !== "all" && p.status !== filter) return false;
    if (searchQuery && !p.user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.user.email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = {
    totalRevenue: payments.filter(p => p.status === "completed").reduce((acc, p) => acc + p.amount, 0),
    pendingAmount: payments.filter(p => p.status === "pending").reduce((acc, p) => acc + p.amount, 0),
    completedCount: payments.filter(p => p.status === "completed").length,
    failedCount: payments.filter(p => p.status === "failed").length,
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-400" />
            Pagamentos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie transações e recebimentos
          </p>
        </div>
        
        <a
          href="https://www.asaas.com/login"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition"
        >
          <ExternalLink size={16} />
          Asaas Dashboard
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-600/10 border border-emerald-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={16} className="text-emerald-400" />
            <span className="text-xs text-gray-400">Recebido</span>
          </div>
          <p className="text-xl lg:text-2xl font-bold text-white">R$ {stats.totalRevenue.toFixed(2)}</p>
          <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
            <TrendingUp size={10} /> +12% este mês
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border border-amber-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-amber-400" />
            <span className="text-xs text-gray-400">Pendente</span>
          </div>
          <p className="text-xl lg:text-2xl font-bold text-white">R$ {stats.pendingAmount.toFixed(2)}</p>
          <p className="text-[10px] text-gray-500">aguardando</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/10 border border-violet-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-violet-400" />
            <span className="text-xs text-gray-400">Aprovados</span>
          </div>
          <p className="text-xl lg:text-2xl font-bold text-white">{stats.completedCount}</p>
          <p className="text-[10px] text-gray-500">transações</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-4 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-600/10 border border-red-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <XCircle size={16} className="text-red-400" />
            <span className="text-xs text-gray-400">Falhas</span>
          </div>
          <p className="text-xl lg:text-2xl font-bold text-white">{stats.failedCount}</p>
          <p className="text-[10px] text-gray-500">transações</p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          {[
            { value: "all", label: "Todos" },
            { value: "completed", label: "Aprovados" },
            { value: "pending", label: "Pendentes" },
            { value: "failed", label: "Falhas" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value as typeof filter)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                filter === tab.value
                  ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                  : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Payments List */}
      <div className="space-y-3">
        {filteredPayments.map((payment, i) => (
          <motion.div
            key={payment.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <PaymentCard payment={payment} />
          </motion.div>
        ))}
      </div>

      {filteredPayments.length === 0 && (
        <div className="text-center py-12">
          <Receipt className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Nenhum pagamento encontrado</h3>
          <p className="text-sm text-gray-500">
            {searchQuery || filter !== "all"
              ? "Tente ajustar os filtros"
              : "Os pagamentos aparecerão aqui"}
          </p>
        </div>
      )}

      {/* Gateway Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 rounded-xl bg-white/[0.03] border border-white/5"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
            <PiggyBank size={18} />
          </div>
          <div>
            <h4 className="font-medium text-white text-sm">Gateway de Pagamento: Asaas</h4>
            <p className="text-xs text-gray-500 mt-1">
              Todos os pagamentos são processados pelo Asaas. PIX, cartão de crédito e boleto 
              são aceitos. Os valores são transferidos automaticamente para sua conta.
            </p>
            <a 
              href="https://www.asaas.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-emerald-400 hover:text-emerald-300"
            >
              Acessar Asaas <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
