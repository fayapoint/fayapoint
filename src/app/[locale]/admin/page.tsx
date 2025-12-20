"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  ArrowRight,
  RefreshCcw,
  Database,
  AlertCircle,
  CheckCircle,
  Zap,
  Eye,
  MoreHorizontal,
  Sparkles,
  Palette,
  BookOpen,
  Workflow,
  Globe,
  Bot,
  CreditCard,
  BarChart3,
  PieChart,
  Calendar,
  Target,
  Award,
  Bell,
  Settings,
  ChevronRight,
  Plus,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import { cn } from "@/lib/utils";

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

// Compact stat card for mobile-first design
function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeLabel,
  color = "violet",
  href 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  change?: number;
  changeLabel?: string;
  color?: "violet" | "emerald" | "amber" | "cyan" | "pink" | "orange";
  href?: string;
}) {
  const colors = {
    violet: { bg: "from-violet-500/20 to-violet-600/10", icon: "text-violet-400", border: "border-violet-500/20" },
    emerald: { bg: "from-emerald-500/20 to-green-600/10", icon: "text-emerald-400", border: "border-emerald-500/20" },
    amber: { bg: "from-amber-500/20 to-yellow-600/10", icon: "text-amber-400", border: "border-amber-500/20" },
    cyan: { bg: "from-cyan-500/20 to-blue-600/10", icon: "text-cyan-400", border: "border-cyan-500/20" },
    pink: { bg: "from-pink-500/20 to-rose-600/10", icon: "text-pink-400", border: "border-pink-500/20" },
    orange: { bg: "from-orange-500/20 to-red-600/10", icon: "text-orange-400", border: "border-orange-500/20" },
  };

  const colorSet = colors[color];
  
  const Content = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative p-4 lg:p-5 rounded-2xl bg-gradient-to-br border backdrop-blur-sm overflow-hidden group transition-all",
        colorSet.bg,
        colorSet.border,
        href && "hover:scale-[1.02] cursor-pointer"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-gray-400 text-xs lg:text-sm mb-0.5 truncate">{title}</p>
          <p className="text-2xl lg:text-3xl font-bold text-white">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-1.5">
              {change >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-red-400" />
              )}
              <span className={cn(
                "text-xs font-medium",
                change >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {change >= 0 ? "+" : ""}{change}%
              </span>
              {changeLabel && <span className="text-gray-500 text-[10px] ml-0.5">{changeLabel}</span>}
            </div>
          )}
        </div>
        <div className={cn(
          "p-2.5 lg:p-3 rounded-xl bg-white/5 shrink-0",
          colorSet.icon
        )}>
          <Icon size={20} className="lg:w-6 lg:h-6" />
        </div>
      </div>
      {href && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight size={16} className="text-gray-500" />
        </div>
      )}
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{Content}</Link>;
  }
  return Content;
}

// Quick Action Button
function QuickAction({ 
  icon: Icon, 
  label, 
  href, 
  color = "violet",
  badge
}: { 
  icon: React.ElementType; 
  label: string; 
  href: string;
  color?: string;
  badge?: string;
}) {
  const colorClasses: Record<string, string> = {
    violet: "from-violet-500/20 to-purple-600/10 border-violet-500/20 hover:border-violet-500/40 text-violet-400",
    emerald: "from-emerald-500/20 to-green-600/10 border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400",
    amber: "from-amber-500/20 to-yellow-600/10 border-amber-500/20 hover:border-amber-500/40 text-amber-400",
    cyan: "from-cyan-500/20 to-blue-600/10 border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400",
    pink: "from-pink-500/20 to-rose-600/10 border-pink-500/20 hover:border-pink-500/40 text-pink-400",
  };

  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br border transition-all cursor-pointer group",
          colorClasses[color] || colorClasses.violet
        )}
      >
        <Icon size={24} className="mb-2 group-hover:scale-110 transition-transform" />
        <span className="text-xs font-medium text-white text-center">{label}</span>
        {badge && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white">
            {badge}
          </span>
        )}
      </motion.div>
    </Link>
  );
}

function ActivityItem({ activity }: { activity: Stats["recentActivity"][0] }) {
  const getCategoryConfig = (category: string) => {
    switch (category) {
      case "auth": return { color: "text-violet-400 bg-violet-500/20", icon: Users };
      case "user": return { color: "text-cyan-400 bg-cyan-500/20", icon: Users };
      case "product": return { color: "text-amber-400 bg-amber-500/20", icon: Package };
      case "order": return { color: "text-emerald-400 bg-emerald-500/20", icon: ShoppingCart };
      case "database": return { color: "text-pink-400 bg-pink-500/20", icon: Database };
      default: return { color: "text-gray-400 bg-gray-500/20", icon: Activity };
    }
  };

  const config = getCategoryConfig(activity.category);
  const IconComponent = config.icon;

  return (
    <div className="flex items-center gap-3 p-2.5 lg:p-3 rounded-xl hover:bg-white/5 transition-colors">
      <div className={cn("p-2 rounded-lg shrink-0", config.color)}>
        <IconComponent size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs lg:text-sm text-white truncate">{activity.action}</p>
        <p className="text-[10px] lg:text-xs text-gray-500 truncate">{activity.adminEmail}</p>
      </div>
      <div className="text-[10px] lg:text-xs text-gray-500 shrink-0">
        {new Date(activity.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}

// Mini chart visualization (placeholder - can be replaced with real charts)
function MiniChart({ data, color = "violet" }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const colorClasses: Record<string, string> = {
    violet: "bg-violet-500",
    emerald: "bg-emerald-500",
    cyan: "bg-cyan-500",
    amber: "bg-amber-500",
  };

  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((value, i) => (
        <div
          key={i}
          className={cn("w-1.5 rounded-t transition-all", colorClasses[color] || colorClasses.violet)}
          style={{ height: `${(value / max) * 100}%`, opacity: 0.4 + (i / data.length) * 0.6 }}
        />
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "pt-BR";
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
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center p-6">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button 
            onClick={fetchStats}
            className="px-4 py-2 rounded-xl bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition text-sm"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Sample chart data (would come from API in production)
  const weeklyData = [12, 19, 15, 25, 22, 30, 28];

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Welcome Banner - Mobile optimized */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-4 lg:p-6 rounded-2xl bg-gradient-to-br from-violet-600/30 via-purple-600/20 to-pink-600/20 border border-violet-500/20 overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-white mb-1">
                Olá, {admin?.name?.split(" ")[0]}! 👋
              </h1>
              <p className="text-gray-400 text-sm">
                Aqui está um resumo do seu negócio hoje
              </p>
            </div>
            
            <div className="flex items-center gap-2 lg:gap-3">
              {/* DB Status - Compact on mobile */}
              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs",
                dbStatus?.connected 
                  ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400" 
                  : "bg-red-500/20 border border-red-500/30 text-red-400"
              )}>
                {dbStatus?.connected ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Online</span>
                    {dbStatus.latency && (
                      <span className="text-emerald-400/60 hidden lg:inline">({dbStatus.latency}ms)</span>
                    )}
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Offline</span>
                  </>
                )}
              </div>
              
              <button
                onClick={() => { fetchStats(); testDbConnection(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-gray-300 hover:bg-white/15 transition text-xs"
              >
                <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Atualizar</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl" />
      </motion.div>

      {/* Main Stats Grid - 2x2 on mobile, 4 cols on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          title="Usuários"
          value={stats?.users.total || 0}
          icon={Users}
          change={stats?.users.growth}
          changeLabel="mês"
          color="violet"
          href={`/${locale}/admin/users`}
        />
        <StatCard
          title="Ativos"
          value={stats?.users.active || 0}
          icon={Activity}
          color="emerald"
        />
        <StatCard
          title="Pedidos"
          value={stats?.orders.total || 0}
          icon={ShoppingCart}
          color="cyan"
          href={`/${locale}/admin/orders`}
        />
        <StatCard
          title="Produtos"
          value={stats?.products.total || 0}
          icon={Package}
          color="amber"
          href={`/${locale}/admin/products`}
        />
      </div>

      {/* Quick Actions - Scrollable on mobile */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm lg:text-base font-semibold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Ações Rápidas
          </h2>
          <Link href={`/${locale}/admin/settings`} className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
            Ver todas <ArrowRight size={12} />
          </Link>
        </div>
        
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 lg:gap-3">
          <QuickAction icon={Users} label="Usuários" href={`/${locale}/admin/users`} color="violet" />
          <QuickAction icon={Package} label="Produtos" href={`/${locale}/admin/products`} color="amber" />
          <QuickAction icon={ShoppingCart} label="Pedidos" href={`/${locale}/admin/orders`} color="cyan" />
          <QuickAction icon={Workflow} label="Automações" href={`/${locale}/admin/automations`} color="pink" badge="NOVO" />
          <QuickAction icon={Globe} label="Dropship" href={`/${locale}/admin/dropshipping`} color="emerald" />
          <QuickAction icon={Bot} label="Config IA" href={`/${locale}/admin/ai-settings`} color="violet" />
          <QuickAction icon={Database} label="Database" href={`/${locale}/admin/database`} color="cyan" />
          <QuickAction icon={Settings} label="Config" href={`/${locale}/admin/settings`} color="amber" />
        </div>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-3 lg:p-4 rounded-xl bg-gradient-to-br from-emerald-500/15 to-green-600/10 border border-emerald-500/20"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] lg:text-xs text-gray-400">Hoje</span>
            <TrendingUp size={12} className="text-emerald-400" />
          </div>
          <p className="text-lg lg:text-xl font-bold text-white">{stats?.users.newToday || 0}</p>
          <p className="text-[10px] text-emerald-400">novos usuários</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-3 lg:p-4 rounded-xl bg-gradient-to-br from-cyan-500/15 to-blue-600/10 border border-cyan-500/20"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] lg:text-xs text-gray-400">Semana</span>
            <Clock size={12} className="text-cyan-400" />
          </div>
          <p className="text-lg lg:text-xl font-bold text-white">{stats?.users.newThisWeek || 0}</p>
          <p className="text-[10px] text-cyan-400">cadastros</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-3 lg:p-4 rounded-xl bg-gradient-to-br from-pink-500/15 to-rose-600/10 border border-pink-500/20"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] lg:text-xs text-gray-400">Mês</span>
            <Calendar size={12} className="text-pink-400" />
          </div>
          <p className="text-lg lg:text-xl font-bold text-white">{stats?.users.newThisMonth || 0}</p>
          <p className="text-[10px] text-pink-400">total</p>
        </motion.div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Users by Plan */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 lg:p-5 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm lg:text-base font-semibold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-violet-400" />
              Usuários por Plano
            </h3>
            <Link href={`/${locale}/admin/users`} className="text-[10px] text-gray-400 hover:text-white">
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {Object.entries(stats?.users.byPlan || {}).map(([plan, count]) => {
              const total = stats?.users.total || 1;
              const percentage = Math.round((count / total) * 100);
              const colors: Record<string, { bar: string; text: string }> = {
                free: { bar: "from-gray-500 to-gray-600", text: "text-gray-400" },
                starter: { bar: "from-cyan-500 to-blue-500", text: "text-cyan-400" },
                pro: { bar: "from-violet-500 to-purple-500", text: "text-violet-400" },
                business: { bar: "from-amber-500 to-orange-500", text: "text-amber-400" },
              };
              const colorSet = colors[plan] || colors.free;
              
              return (
                <div key={plan}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={cn("capitalize font-medium", colorSet.text)}>{plan}</span>
                    <span className="text-white">{count} <span className="text-gray-500">({percentage}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className={cn("h-full bg-gradient-to-r rounded-full", colorSet.bar)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="p-4 lg:p-5 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm lg:text-base font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Atividade Recente
            </h3>
            <Link href={`/${locale}/admin/logs`} className="text-[10px] text-gray-400 hover:text-white">
              Ver logs
            </Link>
          </div>
          <div className="space-y-0.5 max-h-[200px] lg:max-h-[220px] overflow-y-auto scrollbar-thin">
            {stats?.recentActivity.length ? (
              stats.recentActivity.slice(0, 6).map((activity) => (
                <ActivityItem key={String(activity.id)} activity={activity} />
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-xs">Nenhuma atividade recente</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Growth Chart Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 lg:p-5 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-600/5 border border-violet-500/20"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm lg:text-base font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-400" />
            Crescimento Semanal
          </h3>
          <div className="flex items-center gap-2">
            <MiniChart data={weeklyData} color="violet" />
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <TrendingUp size={12} />
              +23%
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 lg:gap-2">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, i) => (
            <div key={day} className="text-center">
              <div className="h-16 lg:h-24 bg-white/5 rounded-lg flex items-end justify-center p-1 mb-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(weeklyData[i] / Math.max(...weeklyData)) * 100}%` }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.05 }}
                  className="w-full bg-gradient-to-t from-violet-500 to-purple-400 rounded"
                />
              </div>
              <span className="text-[9px] lg:text-[10px] text-gray-500">{day}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* System Health */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <div className="p-3 lg:p-4 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Database size={14} className="text-emerald-400" />
            <span className="text-[10px] lg:text-xs text-gray-400">Database</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-emerald-400">99.9%</span>
            <span className="text-[10px] text-gray-500">uptime</span>
          </div>
        </div>
        
        <div className="p-3 lg:p-4 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-amber-400" />
            <span className="text-[10px] lg:text-xs text-gray-400">API</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-amber-400">~45ms</span>
            <span className="text-[10px] text-gray-500">latência</span>
          </div>
        </div>
        
        <div className="p-3 lg:p-4 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Bot size={14} className="text-violet-400" />
            <span className="text-[10px] lg:text-xs text-gray-400">AI Models</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-violet-400">5</span>
            <span className="text-[10px] text-gray-500">ativos</span>
          </div>
        </div>
        
        <div className="p-3 lg:p-4 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Workflow size={14} className="text-cyan-400" />
            <span className="text-[10px] lg:text-xs text-gray-400">Automações</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-cyan-400">3</span>
            <span className="text-[10px] text-gray-500">rodando</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
