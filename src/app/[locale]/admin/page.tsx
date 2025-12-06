"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  ArrowUpRight,
  RefreshCcw,
  Database,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";

interface Stats {
  users: {
    total: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    growth: number;
    active: number;
    byPlan: Record<string, number>;
  };
  orders: {
    total: number;
    thisMonth: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
  };
  products: {
    total: number;
  };
  recentActivity: {
    id: string;
    action: string;
    category: string;
    adminEmail: string;
    createdAt: string;
    details?: Record<string, unknown>;
  }[];
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeLabel,
  color = "violet" 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  change?: number;
  changeLabel?: string;
  color?: "violet" | "emerald" | "amber" | "cyan" | "pink";
}) {
  const colors = {
    violet: { bg: "from-violet-500/20 to-violet-500/5", icon: "text-violet-400", border: "border-violet-500/30" },
    emerald: { bg: "from-emerald-500/20 to-emerald-500/5", icon: "text-emerald-400", border: "border-emerald-500/30" },
    amber: { bg: "from-amber-500/20 to-amber-500/5", icon: "text-amber-400", border: "border-amber-500/30" },
    cyan: { bg: "from-cyan-500/20 to-cyan-500/5", icon: "text-cyan-400", border: "border-cyan-500/30" },
    pink: { bg: "from-pink-500/20 to-pink-500/5", icon: "text-pink-400", border: "border-pink-500/30" },
  };

  const colorSet = colors[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative p-6 rounded-2xl bg-gradient-to-br ${colorSet.bg} border ${colorSet.border} backdrop-blur-sm overflow-hidden`}
      style={{ boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)" }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {change >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <span className={change >= 0 ? "text-emerald-400 text-sm" : "text-red-400 text-sm"}>
                {change >= 0 ? "+" : ""}{change}%
              </span>
              {changeLabel && <span className="text-gray-500 text-xs ml-1">{changeLabel}</span>}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-white/5 ${colorSet.icon}`}>
          <Icon size={24} />
        </div>
      </div>

      {/* Decorative glow */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br from-white/5 to-transparent blur-2xl" />
    </motion.div>
  );
}

function ActivityItem({ activity }: { activity: Stats["recentActivity"][0] }) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "auth": return "text-violet-400 bg-violet-500/20";
      case "user": return "text-cyan-400 bg-cyan-500/20";
      case "product": return "text-amber-400 bg-amber-500/20";
      case "order": return "text-emerald-400 bg-emerald-500/20";
      case "database": return "text-pink-400 bg-pink-500/20";
      default: return "text-gray-400 bg-gray-500/20";
    }
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
      <div className={`p-2 rounded-lg ${getCategoryColor(activity.category)}`}>
        <Activity size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{activity.action}</p>
        <p className="text-xs text-gray-500 truncate">{activity.adminEmail}</p>
      </div>
      <div className="text-xs text-gray-500">
        {new Date(activity.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; latency?: number } | null>(null);
  const { token, admin } = useAdmin();

  const fetchStats = useCallback(async () => {
    if (!token) return;
    
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.error);
      }
    } catch (e) {
      setError("Erro ao carregar estatísticas");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const testDbConnection = useCallback(async () => {
    if (!token) return;
    
    try {
      const res = await fetch("/api/admin/database?action=test", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDbStatus({ connected: data.success, latency: data.latency });
    } catch {
      setDbStatus({ connected: false });
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
    testDbConnection();
  }, [fetchStats, testDbConnection]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-gray-400">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400">{error}</p>
          <button 
            onClick={fetchStats}
            className="mt-4 px-4 py-2 rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Bem-vindo de volta, {admin?.name?.split(" ")[0]}!
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* DB Status */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            dbStatus?.connected 
              ? "bg-emerald-500/10 border border-emerald-500/30" 
              : "bg-red-500/10 border border-red-500/30"
          }`}>
            {dbStatus?.connected ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-sm">DB Online</span>
                {dbStatus.latency && (
                  <span className="text-emerald-400/60 text-xs">({dbStatus.latency}ms)</span>
                )}
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm">DB Offline</span>
              </>
            )}
          </div>
          
          <button
            onClick={() => { fetchStats(); testDbConnection(); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition"
          >
            <RefreshCcw size={16} />
            <span className="text-sm">Atualizar</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Usuários"
          value={stats?.users.total || 0}
          icon={Users}
          change={stats?.users.growth}
          changeLabel="este mês"
          color="violet"
        />
        <StatCard
          title="Usuários Ativos"
          value={stats?.users.active || 0}
          icon={Activity}
          color="emerald"
        />
        <StatCard
          title="Total de Pedidos"
          value={stats?.orders.total || 0}
          icon={ShoppingCart}
          color="cyan"
        />
        <StatCard
          title="Produtos"
          value={stats?.products.total || 0}
          icon={Package}
          color="amber"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Novos Hoje"
          value={stats?.users.newToday || 0}
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Esta Semana"
          value={stats?.users.newThisWeek || 0}
          icon={Clock}
          color="cyan"
        />
        <StatCard
          title="Este Mês"
          value={stats?.users.newThisMonth || 0}
          icon={ArrowUpRight}
          color="pink"
        />
      </div>

      {/* Users by Plan & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-sm"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-400" />
            Usuários por Plano
          </h3>
          <div className="space-y-4">
            {Object.entries(stats?.users.byPlan || {}).map(([plan, count]) => {
              const total = stats?.users.total || 1;
              const percentage = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                free: "from-gray-500 to-gray-600",
                starter: "from-cyan-500 to-blue-500",
                pro: "from-violet-500 to-purple-500",
                business: "from-amber-500 to-orange-500",
              };
              
              return (
                <div key={plan}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400 capitalize">{plan}</span>
                    <span className="text-white">{count} ({percentage}%)</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${colors[plan] || colors.free} rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-sm"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Atividade Recente
          </h3>
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {stats?.recentActivity.length ? (
              stats.recentActivity.map((activity) => (
                <ActivityItem key={String(activity.id)} activity={activity} />
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">
                Nenhuma atividade recente
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/users"
            className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
          >
            <Users className="w-6 h-6 text-violet-400 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-white">Gerenciar Usuários</p>
          </Link>
          <Link
            href="/admin/products"
            className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
          >
            <Package className="w-6 h-6 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-white">Gerenciar Produtos</p>
          </Link>
          <Link
            href="/admin/database"
            className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
          >
            <Database className="w-6 h-6 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-white">Banco de Dados</p>
          </Link>
          <Link
            href="/admin/logs"
            className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
          >
            <Activity className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-white">Ver Logs</p>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
