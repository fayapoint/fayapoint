"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Layers,
  Check,
  X,
  ExternalLink,
  Settings,
  Zap,
  Database,
  Cloud,
  Mail,
  CreditCard,
  Bot,
  Globe,
  RefreshCcw,
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: "connected" | "disconnected" | "partial";
  url: string;
  envKeys: string[];
  color: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: "mongodb",
    name: "MongoDB Atlas",
    description: "Banco de dados principal para usuários, pedidos e conteúdo",
    icon: Database,
    status: "connected",
    url: "https://cloud.mongodb.com",
    envKeys: ["MONGODB_URI"],
    color: "emerald",
  },
  {
    id: "cloudinary",
    name: "Cloudinary",
    description: "Armazenamento e otimização de imagens e mídia",
    icon: Cloud,
    status: "connected",
    url: "https://console.cloudinary.com",
    envKeys: ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"],
    color: "cyan",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "Gateway de API para modelos de IA (GPT, Gemini, Claude, etc.)",
    icon: Bot,
    status: "connected",
    url: "https://openrouter.ai",
    envKeys: ["OPENROUTER_API_KEY"],
    color: "violet",
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Processamento de pagamentos e assinaturas",
    icon: CreditCard,
    status: "disconnected",
    url: "https://dashboard.stripe.com",
    envKeys: ["STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET"],
    color: "purple",
  },
  {
    id: "resend",
    name: "Resend / Email",
    description: "Envio de emails transacionais e marketing",
    icon: Mail,
    status: "disconnected",
    url: "https://resend.com",
    envKeys: ["RESEND_API_KEY"],
    color: "pink",
  },
  {
    id: "vercel",
    name: "Vercel Analytics",
    description: "Métricas de performance e analytics da aplicação",
    icon: Globe,
    status: "disconnected",
    url: "https://vercel.com",
    envKeys: ["VERCEL_ANALYTICS_ID"],
    color: "gray",
  },
];

function getStatusBadge(status: Integration["status"]) {
  switch (status) {
    case "connected":
      return { bg: "bg-emerald-500/20 border-emerald-500/30", text: "text-emerald-400", label: "Conectado" };
    case "partial":
      return { bg: "bg-amber-500/20 border-amber-500/30", text: "text-amber-400", label: "Parcial" };
    case "disconnected":
      return { bg: "bg-gray-500/20 border-gray-500/30", text: "text-gray-400", label: "Desconectado" };
  }
}

function IntegrationCard({ integration }: { integration: Integration }) {
  const statusBadge = getStatusBadge(integration.status);
  const colors: Record<string, string> = {
    emerald: "from-emerald-500/20 to-green-500/10 border-emerald-500/30",
    cyan: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30",
    violet: "from-violet-500/20 to-purple-500/10 border-violet-500/30",
    purple: "from-purple-500/20 to-pink-500/10 border-purple-500/30",
    pink: "from-pink-500/20 to-rose-500/10 border-pink-500/30",
    gray: "from-gray-500/20 to-gray-600/10 border-gray-500/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-5 rounded-2xl bg-gradient-to-br ${colors[integration.color]} border hover:brightness-110 transition-all`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center`}>
            <integration.icon size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{integration.name}</h3>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${statusBadge.bg} ${statusBadge.text}`}>
              {integration.status === "connected" ? <Check size={10} /> : <X size={10} />}
              {statusBadge.label}
            </span>
          </div>
        </div>
        <a
          href={integration.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition"
        >
          <ExternalLink size={16} />
        </a>
      </div>
      
      <p className="text-sm text-gray-400 mb-4">{integration.description}</p>
      
      <div className="space-y-1.5">
        <p className="text-xs text-gray-500">Variáveis necessárias:</p>
        <div className="flex flex-wrap gap-1.5">
          {integration.envKeys.map((key) => (
            <code key={key} className="px-2 py-0.5 rounded bg-white/10 text-[10px] text-gray-300">
              {key}
            </code>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminIntegrationsPage() {
  const connectedCount = INTEGRATIONS.filter(i => i.status === "connected").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Integrações
          </h1>
          <p className="text-gray-500 mt-1">
            Gerencie as conexões com serviços externos
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            <span className="text-emerald-400 font-semibold">{connectedCount}</span>/{INTEGRATIONS.length} conectadas
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Zap size={24} className="text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Status das Integrações</h2>
            <p className="text-sm text-gray-400">Visão geral das conexões ativas</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
            <p className="text-2xl font-bold text-emerald-400">{connectedCount}</p>
            <p className="text-xs text-gray-400">Conectadas</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
            <p className="text-2xl font-bold text-amber-400">
              {INTEGRATIONS.filter(i => i.status === "partial").length}
            </p>
            <p className="text-xs text-gray-400">Parciais</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-500/10 border border-gray-500/30 text-center">
            <p className="text-2xl font-bold text-gray-400">
              {INTEGRATIONS.filter(i => i.status === "disconnected").length}
            </p>
            <p className="text-xs text-gray-400">Desconectadas</p>
          </div>
        </div>
      </motion.div>

      {/* Integrations Grid */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Layers className="text-cyan-400" size={20} />
          Todas as Integrações
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {INTEGRATIONS.map((integration, index) => (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <IntegrationCard integration={integration} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Setup Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
      >
        <div className="flex items-center gap-2 mb-4">
          <Settings className="text-gray-400" size={20} />
          <h2 className="text-lg font-semibold text-white">Como Configurar</h2>
        </div>
        
        <div className="space-y-4 text-sm text-gray-400">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
              <span className="text-xs text-violet-400 font-bold">1</span>
            </div>
            <p>Acesse o painel de cada serviço através dos links nas cards acima.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
              <span className="text-xs text-violet-400 font-bold">2</span>
            </div>
            <p>Obtenha as credenciais/API keys necessárias no dashboard do serviço.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
              <span className="text-xs text-violet-400 font-bold">3</span>
            </div>
            <p>Configure as variáveis de ambiente no arquivo <code className="text-violet-400">.env.local</code> ou nas configurações do seu host (Netlify/Vercel).</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
              <span className="text-xs text-violet-400 font-bold">4</span>
            </div>
            <p>Reinicie o servidor de desenvolvimento ou faça um novo deploy para aplicar as mudanças.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
