"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Workflow,
  Plus,
  Play,
  Pause,
  Settings,
  Trash2,
  Clock,
  Zap,
  Mail,
  MessageSquare,
  Users,
  ShoppingCart,
  Calendar,
  Bell,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  ChevronRight,
  Activity,
  Eye,
  Edit2,
  Copy,
  ExternalLink,
  Bot,
  Webhook,
  Database,
  RefreshCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: "schedule" | "webhook" | "event" | "manual";
    config: string;
  };
  actions: string[];
  status: "active" | "paused" | "error";
  lastRun?: string;
  runCount: number;
  createdAt: string;
}

const SAMPLE_AUTOMATIONS: Automation[] = [
  {
    id: "1",
    name: "Email de Boas-vindas",
    description: "Envia email automático para novos usuários após cadastro",
    trigger: { type: "event", config: "user.created" },
    actions: ["send_email", "add_to_list"],
    status: "active",
    lastRun: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    runCount: 156,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Lembrete de Carrinho",
    description: "Notifica usuários que abandonaram carrinho há 24h",
    trigger: { type: "schedule", config: "0 10 * * *" },
    actions: ["check_carts", "send_notification"],
    status: "active",
    lastRun: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    runCount: 89,
    createdAt: "2024-02-01",
  },
  {
    id: "3",
    name: "Sync Produtos Dropshipping",
    description: "Sincroniza estoque e preços com fornecedores",
    trigger: { type: "schedule", config: "0 */6 * * *" },
    actions: ["fetch_inventory", "update_prices", "notify_low_stock"],
    status: "paused",
    lastRun: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    runCount: 45,
    createdAt: "2024-02-10",
  },
  {
    id: "4",
    name: "Webhook de Pagamento",
    description: "Processa confirmações de pagamento do Asaas",
    trigger: { type: "webhook", config: "/api/webhooks/asaas" },
    actions: ["verify_payment", "fulfill_order", "send_receipt"],
    status: "active",
    lastRun: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    runCount: 234,
    createdAt: "2024-01-20",
  },
  {
    id: "5",
    name: "Relatório Semanal",
    description: "Gera e envia relatório de vendas toda segunda",
    trigger: { type: "schedule", config: "0 9 * * 1" },
    actions: ["generate_report", "send_to_admin"],
    status: "error",
    lastRun: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    runCount: 12,
    createdAt: "2024-02-15",
  },
];

const TRIGGER_TEMPLATES = [
  { type: "event", icon: Zap, label: "Evento", description: "Dispara quando algo acontece", color: "violet" },
  { type: "schedule", icon: Clock, label: "Agendado", description: "Roda em horários específicos", color: "cyan" },
  { type: "webhook", icon: Webhook, label: "Webhook", description: "Recebe dados externos", color: "amber" },
  { type: "manual", icon: Play, label: "Manual", description: "Executado manualmente", color: "emerald" },
];

const ACTION_TEMPLATES = [
  { id: "send_email", icon: Mail, label: "Enviar Email" },
  { id: "send_notification", icon: Bell, label: "Notificação Push" },
  { id: "update_database", icon: Database, label: "Atualizar DB" },
  { id: "call_api", icon: ExternalLink, label: "Chamar API" },
  { id: "ai_process", icon: Bot, label: "Processar com IA" },
  { id: "sync_data", icon: RefreshCcw, label: "Sincronizar Dados" },
];

function AutomationCard({ automation, onToggle, onEdit, onDelete }: {
  automation: Automation;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const getTriggerIcon = () => {
    switch (automation.trigger.type) {
      case "event": return Zap;
      case "schedule": return Clock;
      case "webhook": return Webhook;
      default: return Play;
    }
  };

  const TriggerIcon = getTriggerIcon();

  const statusConfig = {
    active: { color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30", label: "Ativo" },
    paused: { color: "text-amber-400 bg-amber-500/20 border-amber-500/30", label: "Pausado" },
    error: { color: "text-red-400 bg-red-500/20 border-red-500/30", label: "Erro" },
  };

  const status = statusConfig[automation.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-white/20 transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={cn(
            "p-2.5 rounded-xl shrink-0",
            automation.status === "active" ? "bg-violet-500/20 text-violet-400" :
            automation.status === "error" ? "bg-red-500/20 text-red-400" :
            "bg-gray-500/20 text-gray-400"
          )}>
            <Workflow size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm lg:text-base truncate">{automation.name}</h3>
            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{automation.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={cn("px-2 py-1 rounded-full text-[10px] font-medium border", status.color)}>
            {status.label}
          </span>
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400"
            >
              <MoreVertical size={16} />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-gray-900 border border-white/10 shadow-xl z-50 overflow-hidden"
                  >
                    <button
                      onClick={() => { onToggle(); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5"
                    >
                      {automation.status === "active" ? <Pause size={14} /> : <Play size={14} />}
                      {automation.status === "active" ? "Pausar" : "Ativar"}
                    </button>
                    <button
                      onClick={() => { onEdit(); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5"
                    >
                      <Edit2 size={14} />
                      Editar
                    </button>
                    <button
                      onClick={() => { onDelete(); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 size={14} />
                      Excluir
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Trigger & Stats */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 text-gray-400">
          <TriggerIcon size={12} />
          <span className="capitalize">{automation.trigger.type}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-400">
          <Activity size={12} />
          <span>{automation.runCount} execuções</span>
        </div>
        {automation.lastRun && (
          <div className="flex items-center gap-1.5 text-gray-500 hidden sm:flex">
            <Clock size={12} />
            <span>
              {new Date(automation.lastRun).toLocaleString("pt-BR", { 
                day: "2-digit", 
                month: "2-digit", 
                hour: "2-digit", 
                minute: "2-digit" 
              })}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 mt-3 flex-wrap">
        {automation.actions.slice(0, 3).map((action, i) => (
          <span
            key={i}
            className="px-2 py-1 rounded-lg bg-white/5 text-[10px] text-gray-400"
          >
            {action.replace(/_/g, " ")}
          </span>
        ))}
        {automation.actions.length > 3 && (
          <span className="px-2 py-1 rounded-lg bg-white/5 text-[10px] text-gray-500">
            +{automation.actions.length - 3}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default function AdminAutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>(SAMPLE_AUTOMATIONS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "error">("all");

  const filteredAutomations = filter === "all" 
    ? automations 
    : automations.filter(a => a.status === filter);

  const stats = {
    total: automations.length,
    active: automations.filter(a => a.status === "active").length,
    paused: automations.filter(a => a.status === "paused").length,
    errors: automations.filter(a => a.status === "error").length,
  };

  const handleToggle = (id: string) => {
    setAutomations(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, status: a.status === "active" ? "paused" : "active" };
      }
      return a;
    }));
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
            <Workflow className="w-6 h-6 text-violet-400" />
            Automações
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure fluxos automáticos para seu negócio
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition shadow-lg shadow-violet-500/20"
        >
          <Plus size={18} />
          <span>Nova Automação</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/10 border border-violet-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Workflow size={16} className="text-violet-400" />
            <span className="text-xs text-gray-400">Total</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-600/10 border border-emerald-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-emerald-400" />
            <span className="text-xs text-gray-400">Ativas</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.active}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border border-amber-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Pause size={16} className="text-amber-400" />
            <span className="text-xs text-gray-400">Pausadas</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.paused}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-4 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-600/10 border border-red-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} className="text-red-400" />
            <span className="text-xs text-gray-400">Erros</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.errors}</p>
        </motion.div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { value: "all", label: "Todas" },
          { value: "active", label: "Ativas" },
          { value: "paused", label: "Pausadas" },
          { value: "error", label: "Com Erro" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as typeof filter)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
              filter === tab.value
                ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Automations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredAutomations.map((automation, i) => (
          <motion.div
            key={automation.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <AutomationCard
              automation={automation}
              onToggle={() => handleToggle(automation.id)}
              onEdit={() => console.log("Edit", automation.id)}
              onDelete={() => setAutomations(prev => prev.filter(a => a.id !== automation.id))}
            />
          </motion.div>
        ))}
      </div>

      {filteredAutomations.length === 0 && (
        <div className="text-center py-12">
          <Workflow className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Nenhuma automação encontrada</h3>
          <p className="text-sm text-gray-500 mb-4">
            {filter === "all" 
              ? "Crie sua primeira automação para começar"
              : "Não há automações com este status"}
          </p>
          {filter === "all" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition"
            >
              Criar Automação
            </button>
          )}
        </div>
      )}

      {/* Templates Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-4 lg:p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-600/5 border border-violet-500/20"
      >
        <h3 className="text-base lg:text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-violet-400" />
          Templates Rápidos
        </h3>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {TRIGGER_TEMPLATES.map((template) => (
            <button
              key={template.type}
              className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left group"
            >
              <template.icon size={24} className={cn(
                "mb-2 group-hover:scale-110 transition-transform",
                template.color === "violet" ? "text-violet-400" :
                template.color === "cyan" ? "text-cyan-400" :
                template.color === "amber" ? "text-amber-400" :
                "text-emerald-400"
              )} />
              <p className="text-sm font-medium text-white">{template.label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{template.description}</p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Integration Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="p-4 rounded-xl bg-white/[0.03] border border-white/5"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
            <Bot size={18} />
          </div>
          <div>
            <h4 className="font-medium text-white text-sm">Integração com n8n</h4>
            <p className="text-xs text-gray-500 mt-1">
              Para automações mais complexas, recomendamos usar o n8n. 
              Configure webhooks para conectar suas automações externas.
            </p>
            <a 
              href="https://n8n.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-cyan-400 hover:text-cyan-300"
            >
              Saiba mais <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
