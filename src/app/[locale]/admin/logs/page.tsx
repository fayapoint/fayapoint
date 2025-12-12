"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Search,
  Filter,
  RefreshCcw,
  Trash2,
  Download,
  Clock,
  User,
  Shield,
  Database,
  Package,
  ShoppingCart,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  AlertCircle,
} from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";

interface LogEntry {
  _id: string;
  adminEmail: string;
  action: string;
  category: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface Summary {
  total: number;
  today: number;
  byCategory: Record<string, number>;
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "auth": return Shield;
    case "user": return User;
    case "product": return Package;
    case "order": return ShoppingCart;
    case "database": return Database;
    case "system": return Settings;
    default: return Activity;
  }
}

const CATEGORY_ICON_MAP: Record<string, typeof Activity> = {
  auth: Shield,
  user: User,
  product: Package,
  order: ShoppingCart,
  database: Database,
  system: Settings,
};

function getCategoryColor(category: string) {
  switch (category) {
    case "auth": return "text-violet-400 bg-violet-500/20 border-violet-500/30";
    case "user": return "text-cyan-400 bg-cyan-500/20 border-cyan-500/30";
    case "product": return "text-amber-400 bg-amber-500/20 border-amber-500/30";
    case "order": return "text-emerald-400 bg-emerald-500/20 border-emerald-500/30";
    case "database": return "text-pink-400 bg-pink-500/20 border-pink-500/30";
    case "system": return "text-blue-400 bg-blue-500/20 border-blue-500/30";
    default: return "text-gray-400 bg-gray-500/20 border-gray-500/30";
  }
}

function LogRow({ log }: { log: LogEntry }) {
  const Icon = CATEGORY_ICON_MAP[log.category] || Activity;
  const colorClass = getCategoryColor(log.category);
  const [expanded, setExpanded] = useState(false);

  return (
    <div 
      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-4 p-4">
        <div className={`p-2 rounded-lg border ${colorClass}`}>
          <Icon size={16} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white truncate">{log.action}</p>
          <p className="text-xs text-gray-500">{log.adminEmail}</p>
        </div>

        <span className={`px-2 py-1 rounded-full text-xs border ${colorClass}`}>
          {log.category}
        </span>

        <div className="text-sm text-gray-400 text-right w-32">
          {new Date(log.createdAt).toLocaleDateString("pt-BR")}
          <br />
          <span className="text-xs text-gray-500">
            {new Date(log.createdAt).toLocaleTimeString("pt-BR")}
          </span>
        </div>
      </div>

      {expanded && log.details && Object.keys(log.details).length > 0 && (
        <div className="px-4 pb-4">
          <div className="p-3 rounded-lg bg-white/5 font-mono text-xs text-gray-400">
            <pre>{JSON.stringify(log.details, null, 2)}</pre>
          </div>
          {log.ip && (
            <p className="text-xs text-gray-500 mt-2">IP: {log.ip}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, pages: 0 });
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const { token } = useAdmin();

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(categoryFilter && { category: categoryFilter }),
        ...(actionFilter && { action: actionFilter }),
      });

      const res = await fetch(`/api/admin/logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setLogs(data.logs);
        setPagination(data.pagination);
        setSummary(data.summary);
      }
    } catch (e) {
      console.error("Error fetching logs:", e);
    } finally {
      setLoading(false);
    }
  }, [token, pagination.page, pagination.limit, categoryFilter, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleClearOldLogs = async (days: number) => {
    if (!token) return;
    if (!confirm(`Tem certeza que deseja excluir logs com mais de ${days} dias?`)) return;

    try {
      const res = await fetch(`/api/admin/logs?days=${days}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        alert(`${data.deletedCount} logs excluídos`);
        fetchLogs();
      }
    } catch (e) {
      console.error("Error clearing logs:", e);
    }
  };

  const handleExportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-logs-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Logs de Atividade
          </h1>
          <p className="text-gray-500 mt-1">
            Histórico de todas as ações administrativas
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportLogs}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition"
          >
            <Download size={16} />
            Exportar
          </button>
          <button
            onClick={() => handleClearOldLogs(30)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition"
          >
            <Trash2 size={16} />
            Limpar +30 dias
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/30"
          >
            <div className="flex items-center gap-2 text-violet-400 mb-1">
              <Activity size={16} />
              <span className="text-xs">Total</span>
            </div>
            <p className="text-2xl font-bold text-white">{summary.total.toLocaleString()}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-500/30"
          >
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <Clock size={16} />
              <span className="text-xs">Hoje</span>
            </div>
            <p className="text-2xl font-bold text-white">{summary.today}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30"
          >
            <div className="flex items-center gap-2 text-cyan-400 mb-1">
              <User size={16} />
              <span className="text-xs">Usuários</span>
            </div>
            <p className="text-2xl font-bold text-white">{summary.byCategory.user || 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30"
          >
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <Shield size={16} />
              <span className="text-xs">Auth</span>
            </div>
            <p className="text-2xl font-bold text-white">{summary.byCategory.auth || 0}</p>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500/50"
        >
          <option value="">Todas as Categorias</option>
          <option value="auth">Autenticação</option>
          <option value="user">Usuários</option>
          <option value="product">Produtos</option>
          <option value="order">Pedidos</option>
          <option value="database">Database</option>
          <option value="system">Sistema</option>
        </select>

        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Filtrar por ação..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
          />
        </div>

        <button
          onClick={fetchLogs}
          className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition"
        >
          <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Logs List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <FileText size={48} className="mb-4 opacity-50" />
            <p>Nenhum log encontrado</p>
          </div>
        ) : (
          <>
            <div className="max-h-[600px] overflow-y-auto">
              {logs.map((log) => (
                <LogRow key={log._id} log={log} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-4 border-t border-white/10">
              <p className="text-sm text-gray-500">
                Mostrando {logs.length} de {pagination.total} logs
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-gray-400">
                  Página {pagination.page} de {pagination.pages || 1}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.pages}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 flex items-start gap-3"
      >
        <AlertCircle size={20} className="text-blue-400 shrink-0 mt-0.5" />
        <div className="text-sm text-gray-400">
          <p className="font-medium text-white mb-1">Sobre os Logs</p>
          <p>Todos os logs são registrados automaticamente quando ações administrativas são realizadas. Clique em qualquer log para ver mais detalhes. Os logs mais antigos que 30 dias podem ser excluídos para economizar espaço.</p>
        </div>
      </motion.div>
    </div>
  );
}
