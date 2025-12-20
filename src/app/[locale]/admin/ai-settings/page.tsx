"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  Zap,
  Settings,
  Sparkles,
  Brain,
  Image as ImageIcon,
  MessageSquare,
  Code,
  ExternalLink,
  Check,
  AlertCircle,
  RefreshCcw,
  DollarSign,
  Activity,
  Key,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AIModel {
  id: string;
  name: string;
  provider: string;
  type: "image" | "chat" | "code";
  status: "active" | "inactive" | "error";
  usage: number;
  limit: number;
  cost: string;
}

const AI_MODELS: AIModel[] = [
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    type: "image",
    status: "active",
    usage: 1234,
    limit: 5000,
    cost: "Free",
  },
  {
    id: "flux-schnell",
    name: "Flux Schnell",
    provider: "Black Forest Labs",
    type: "image",
    status: "active",
    usage: 567,
    limit: 2000,
    cost: "$0.003/img",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    type: "chat",
    status: "active",
    usage: 2341,
    limit: 10000,
    cost: "$0.01/1K tokens",
  },
  {
    id: "claude-3.5",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    type: "chat",
    status: "inactive",
    usage: 0,
    limit: 5000,
    cost: "$0.003/1K tokens",
  },
  {
    id: "deepseek-coder",
    name: "DeepSeek Coder",
    provider: "DeepSeek",
    type: "code",
    status: "active",
    usage: 156,
    limit: 1000,
    cost: "$0.001/1K tokens",
  },
];

function ModelCard({ model }: { model: AIModel }) {
  const typeIcons = {
    image: ImageIcon,
    chat: MessageSquare,
    code: Code,
  };
  
  const TypeIcon = typeIcons[model.type];
  const usagePercent = (model.usage / model.limit) * 100;

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-white/20 transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-xl",
            model.type === "image" ? "bg-violet-500/20 text-violet-400" :
            model.type === "chat" ? "bg-cyan-500/20 text-cyan-400" :
            "bg-amber-500/20 text-amber-400"
          )}>
            <TypeIcon size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm">{model.name}</h4>
            <p className="text-xs text-gray-500">{model.provider}</p>
          </div>
        </div>
        
        <span className={cn(
          "px-2 py-1 rounded-full text-[10px] font-medium border",
          model.status === "active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
          model.status === "error" ? "bg-red-500/20 text-red-400 border-red-500/30" :
          "bg-gray-500/20 text-gray-400 border-gray-500/30"
        )}>
          {model.status === "active" ? "Ativo" : model.status === "error" ? "Erro" : "Inativo"}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Uso</span>
          <span className="text-white">{model.usage.toLocaleString()} / {model.limit.toLocaleString()}</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all",
              usagePercent > 80 ? "bg-red-500" :
              usagePercent > 50 ? "bg-amber-500" :
              "bg-emerald-500"
            )}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Custo</span>
          <span className={model.cost === "Free" ? "text-emerald-400" : "text-gray-400"}>{model.cost}</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminAISettingsPage() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("sk-or-v1-****************************");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalUsage = AI_MODELS.reduce((acc, m) => acc + m.usage, 0);
  const activeModels = AI_MODELS.filter(m => m.status === "active").length;

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-violet-400" />
            Configurações de IA
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie modelos e APIs de inteligência artificial
          </p>
        </div>
        
        <a
          href="https://openrouter.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm hover:bg-white/10 transition"
        >
          <ExternalLink size={16} />
          OpenRouter Dashboard
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/10 border border-violet-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Bot size={16} className="text-violet-400" />
            <span className="text-xs text-gray-400">Modelos</span>
          </div>
          <p className="text-2xl font-bold text-white">{AI_MODELS.length}</p>
          <p className="text-[10px] text-gray-500">{activeModels} ativos</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/10 border border-cyan-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-cyan-400" />
            <span className="text-xs text-gray-400">Requisições</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalUsage.toLocaleString()}</p>
          <p className="text-[10px] text-gray-500">este mês</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-600/10 border border-emerald-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon size={16} className="text-emerald-400" />
            <span className="text-xs text-gray-400">Imagens</span>
          </div>
          <p className="text-2xl font-bold text-white">1,801</p>
          <p className="text-[10px] text-gray-500">geradas</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border border-amber-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-amber-400" />
            <span className="text-xs text-gray-400">Custo</span>
          </div>
          <p className="text-2xl font-bold text-white">$12.45</p>
          <p className="text-[10px] text-gray-500">este mês</p>
        </motion.div>
      </div>

      {/* API Key Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-4 lg:p-5 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-600/5 border border-violet-500/20"
      >
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-violet-400" />
          <h3 className="text-base font-semibold text-white">API Key OpenRouter</h3>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type={showApiKey ? "text" : "password"}
              value="sk-or-v1-****************************"
              readOnly
              className="w-full px-4 py-2.5 pr-20 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400"
              >
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
          <button className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition whitespace-nowrap">
            Atualizar Key
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
          <Shield size={12} className="text-emerald-400" />
          A API key é armazenada de forma segura e nunca é exposta publicamente
        </p>
      </motion.div>

      {/* Models Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Modelos Disponíveis
          </h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AI_MODELS.map((model, i) => (
            <motion.div
              key={model.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.05 }}
            >
              <ModelCard model={model} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tier Limits */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-4 lg:p-5 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
      >
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          Limites por Plano
        </h3>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { plan: "Free", images: 1, color: "gray" },
            { plan: "Starter", images: 50, color: "cyan" },
            { plan: "Pro", images: "∞", color: "violet" },
            { plan: "Business", images: "∞", color: "amber" },
          ].map((tier) => (
            <div key={tier.plan} className={cn(
              "p-3 rounded-xl border",
              tier.color === "gray" ? "bg-gray-500/10 border-gray-500/20" :
              tier.color === "cyan" ? "bg-cyan-500/10 border-cyan-500/20" :
              tier.color === "violet" ? "bg-violet-500/10 border-violet-500/20" :
              "bg-amber-500/10 border-amber-500/20"
            )}>
              <p className={cn(
                "text-xs font-medium mb-1",
                tier.color === "gray" ? "text-gray-400" :
                tier.color === "cyan" ? "text-cyan-400" :
                tier.color === "violet" ? "text-violet-400" :
                "text-amber-400"
              )}>{tier.plan}</p>
              <p className="text-lg font-bold text-white">{tier.images}</p>
              <p className="text-[10px] text-gray-500">imagens/mês</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Provider Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="p-4 rounded-xl bg-white/[0.03] border border-white/5"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400 shrink-0">
            <Brain size={18} />
          </div>
          <div>
            <h4 className="font-medium text-white text-sm">Sobre o OpenRouter</h4>
            <p className="text-xs text-gray-500 mt-1">
              Usamos o OpenRouter como gateway para múltiplos provedores de IA. 
              Isso permite acesso a diversos modelos com uma única API key, incluindo 
              GPT-4, Claude, Gemini, Flux, e muitos outros.
            </p>
            <a 
              href="https://openrouter.ai/docs" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-violet-400 hover:text-violet-300"
            >
              Ver documentação <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
