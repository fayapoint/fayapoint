"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Eye,
  Clock,
  Calendar,
  ArrowUpRight,
  Globe,
  Smartphone,
  Monitor,
  RefreshCcw,
  Download,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Sample data
const TRAFFIC_DATA = [
  { day: "Seg", visitors: 245, pageViews: 892 },
  { day: "Ter", visitors: 312, pageViews: 1024 },
  { day: "Qua", visitors: 287, pageViews: 956 },
  { day: "Qui", visitors: 398, pageViews: 1456 },
  { day: "Sex", visitors: 456, pageViews: 1678 },
  { day: "Sáb", visitors: 234, pageViews: 756 },
  { day: "Dom", visitors: 189, pageViews: 543 },
];

const TOP_PAGES = [
  { path: "/", title: "Home", views: 4523, avgTime: "2:34" },
  { path: "/cursos", title: "Cursos", views: 2341, avgTime: "3:12" },
  { path: "/portal", title: "Portal", views: 1892, avgTime: "5:45" },
  { path: "/loja", title: "Loja", views: 1234, avgTime: "2:18" },
  { path: "/precos", title: "Preços", views: 987, avgTime: "1:56" },
];

const DEVICE_STATS = [
  { device: "Mobile", percentage: 58, icon: Smartphone, color: "violet" },
  { device: "Desktop", percentage: 35, icon: Monitor, color: "cyan" },
  { device: "Tablet", percentage: 7, icon: Monitor, color: "amber" },
];

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState("7d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const maxVisitors = Math.max(...TRAFFIC_DATA.map(d => d.visitors));

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Métricas e insights do seu negócio
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Date Range */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>
          
          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white transition"
          >
            <RefreshCcw size={18} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/10 border border-violet-500/20"
        >
          <div className="flex items-center justify-between mb-2">
            <Eye size={18} className="text-violet-400" />
            <span className="text-xs text-emerald-400 flex items-center gap-0.5">
              <TrendingUp size={12} /> +12%
            </span>
          </div>
          <p className="text-2xl font-bold text-white">8.2K</p>
          <p className="text-xs text-gray-500">Visitantes</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/10 border border-cyan-500/20"
        >
          <div className="flex items-center justify-between mb-2">
            <BarChart3 size={18} className="text-cyan-400" />
            <span className="text-xs text-emerald-400 flex items-center gap-0.5">
              <TrendingUp size={12} /> +8%
            </span>
          </div>
          <p className="text-2xl font-bold text-white">24.5K</p>
          <p className="text-xs text-gray-500">Page Views</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-600/10 border border-emerald-500/20"
        >
          <div className="flex items-center justify-between mb-2">
            <Clock size={18} className="text-emerald-400" />
            <span className="text-xs text-red-400 flex items-center gap-0.5">
              <TrendingDown size={12} /> -3%
            </span>
          </div>
          <p className="text-2xl font-bold text-white">3:24</p>
          <p className="text-xs text-gray-500">Tempo Médio</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border border-amber-500/20"
        >
          <div className="flex items-center justify-between mb-2">
            <ArrowUpRight size={18} className="text-amber-400" />
            <span className="text-xs text-emerald-400 flex items-center gap-0.5">
              <TrendingUp size={12} /> +5%
            </span>
          </div>
          <p className="text-2xl font-bold text-white">4.2%</p>
          <p className="text-xs text-gray-500">Taxa de Conversão</p>
        </motion.div>
      </div>

      {/* Traffic Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-4 lg:p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base lg:text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Tráfego Semanal
          </h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-violet-400">
              <span className="w-2 h-2 rounded-full bg-violet-500" />
              Visitantes
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              Page Views
            </span>
          </div>
        </div>

        <div className="h-48 lg:h-64 flex items-end gap-2 lg:gap-4">
          {TRAFFIC_DATA.map((data, i) => (
            <div key={data.day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-0.5 lg:gap-1 h-full items-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(data.visitors / maxVisitors) * 100}%` }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.05 }}
                  className="flex-1 bg-gradient-to-t from-violet-600 to-violet-400 rounded-t"
                />
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(data.pageViews / (maxVisitors * 4)) * 100}%` }}
                  transition={{ duration: 0.5, delay: 0.35 + i * 0.05 }}
                  className="flex-1 bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t"
                />
              </div>
              <span className="text-[10px] lg:text-xs text-gray-500">{data.day}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Top Pages */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="p-4 lg:p-5 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
        >
          <h3 className="text-sm lg:text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            Páginas Mais Visitadas
          </h3>
          <div className="space-y-3">
            {TOP_PAGES.map((page, i) => (
              <div key={page.path} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-xs text-gray-500 font-medium">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{page.title}</p>
                  <p className="text-[10px] text-gray-500 truncate">{page.path}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{page.views.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500">{page.avgTime}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Device Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 lg:p-5 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
        >
          <h3 className="text-sm lg:text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-violet-400" />
            Dispositivos
          </h3>
          <div className="space-y-4">
            {DEVICE_STATS.map((device) => {
              const colorClasses = {
                violet: "from-violet-500 to-purple-500 text-violet-400",
                cyan: "from-cyan-500 to-blue-500 text-cyan-400",
                amber: "from-amber-500 to-orange-500 text-amber-400",
              };
              const colors = colorClasses[device.color as keyof typeof colorClasses];
              
              return (
                <div key={device.device}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <device.icon size={14} className={colors.split(" ")[2]} />
                      <span className="text-sm text-gray-300">{device.device}</span>
                    </div>
                    <span className="text-sm font-medium text-white">{device.percentage}%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${device.percentage}%` }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className={cn("h-full bg-gradient-to-r rounded-full", colors.split(" ").slice(0, 2).join(" "))}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile First Notice */}
          <div className="mt-4 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <p className="text-xs text-violet-300">
              <strong>58% mobile</strong> - Seu site está otimizado para dispositivos móveis! ✨
            </p>
          </div>
        </motion.div>
      </div>

      {/* Export Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h4 className="font-medium text-white text-sm">Exportar Relatório</h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Baixe um relatório completo em PDF ou CSV
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm hover:bg-white/10 transition">
            <Download size={16} />
            PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm hover:bg-white/10 transition">
            <Download size={16} />
            CSV
          </button>
        </div>
      </motion.div>
    </div>
  );
}
