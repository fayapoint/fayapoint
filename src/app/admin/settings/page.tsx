"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Key,
  Globe,
  Bell,
  Shield,
  Database,
  Mail,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Lock,
  Cloud,
  Zap,
} from "lucide-react";

interface EnvVariable {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  required: boolean;
  sensitive: boolean;
}

const ENV_VARIABLES: EnvVariable[] = [
  {
    key: "MONGODB_URI",
    label: "MongoDB Connection String",
    description: "URI de conexão com o MongoDB Atlas",
    icon: Database,
    required: true,
    sensitive: true,
  },
  {
    key: "JWT_SECRET",
    label: "JWT Secret",
    description: "Chave secreta para assinatura de tokens JWT",
    icon: Key,
    required: true,
    sensitive: true,
  },
  {
    key: "OPENROUTER_API_KEY",
    label: "OpenRouter API Key",
    description: "Chave de API para geração de imagens via OpenRouter",
    icon: Zap,
    required: false,
    sensitive: true,
  },
  {
    key: "CLOUDINARY_CLOUD_NAME",
    label: "Cloudinary Cloud Name",
    description: "Nome do cloud no Cloudinary",
    icon: Cloud,
    required: false,
    sensitive: false,
  },
  {
    key: "CLOUDINARY_API_KEY",
    label: "Cloudinary API Key",
    description: "Chave de API do Cloudinary",
    icon: Cloud,
    required: false,
    sensitive: true,
  },
  {
    key: "CLOUDINARY_API_SECRET",
    label: "Cloudinary API Secret",
    description: "Secret da API do Cloudinary",
    icon: Cloud,
    required: false,
    sensitive: true,
  },
  {
    key: "NEXT_PUBLIC_APP_URL",
    label: "App URL",
    description: "URL pública da aplicação",
    icon: Globe,
    required: true,
    sensitive: false,
  },
];

function EnvCard({ env }: { env: EnvVariable }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(env.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
            <env.icon size={18} className="text-violet-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-white">{env.label}</p>
              {env.required && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 border border-red-500/30">
                  REQUIRED
                </span>
              )}
              {env.sensitive && (
                <Lock size={12} className="text-amber-400" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{env.description}</p>
            <code className="text-xs text-violet-400 mt-2 block">{env.key}</code>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Configurações
        </h1>
        <p className="text-gray-500 mt-1">
          Configurações do sistema e variáveis de ambiente
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.a
          href="https://cloud.mongodb.com"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-500/30 hover:from-emerald-500/30 hover:to-green-500/20 transition-colors group"
        >
          <div className="flex items-center justify-between mb-3">
            <Database size={24} className="text-emerald-400" />
            <ExternalLink size={16} className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h3 className="font-semibold text-white">MongoDB Atlas</h3>
          <p className="text-sm text-gray-400 mt-1">Gerenciar database</p>
        </motion.a>

        <motion.a
          href="https://console.cloudinary.com"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 hover:from-cyan-500/30 hover:to-blue-500/20 transition-colors group"
        >
          <div className="flex items-center justify-between mb-3">
            <Cloud size={24} className="text-cyan-400" />
            <ExternalLink size={16} className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h3 className="font-semibold text-white">Cloudinary</h3>
          <p className="text-sm text-gray-400 mt-1">Gerenciar mídia</p>
        </motion.a>

        <motion.a
          href="https://openrouter.ai"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/30 hover:from-violet-500/30 hover:to-purple-500/20 transition-colors group"
        >
          <div className="flex items-center justify-between mb-3">
            <Zap size={24} className="text-violet-400" />
            <ExternalLink size={16} className="text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h3 className="font-semibold text-white">OpenRouter</h3>
          <p className="text-sm text-gray-400 mt-1">Gerenciar AI API</p>
        </motion.a>
      </div>

      {/* Environment Variables */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <Key className="text-violet-400" size={20} />
          <h2 className="text-lg font-semibold text-white">Variáveis de Ambiente</h2>
        </div>
        
        <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-300">Atenção</p>
            <p className="text-amber-400/80">
              As variáveis de ambiente devem ser configuradas no arquivo <code className="text-amber-300">.env.local</code> ou nas configurações de deploy (Netlify/Vercel).
              Variáveis sensíveis não são expostas por segurança.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {ENV_VARIABLES.map((env) => (
            <EnvCard key={env.key} env={env} />
          ))}
        </div>
      </motion.div>

      {/* System Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <Settings className="text-cyan-400" size={20} />
          <h2 className="text-lg font-semibold text-white">Informações do Sistema</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/5">
            <p className="text-xs text-gray-500 mb-1">Framework</p>
            <p className="text-white font-medium">Next.js 15</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <p className="text-xs text-gray-500 mb-1">Database</p>
            <p className="text-white font-medium">MongoDB Atlas</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <p className="text-xs text-gray-500 mb-1">Auth</p>
            <p className="text-white font-medium">JWT + bcryptjs</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <p className="text-xs text-gray-500 mb-1">Storage</p>
            <p className="text-white font-medium">Cloudinary</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <p className="text-xs text-gray-500 mb-1">AI Provider</p>
            <p className="text-white font-medium">OpenRouter</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <p className="text-xs text-gray-500 mb-1">Styling</p>
            <p className="text-white font-medium">Tailwind CSS + Framer Motion</p>
          </div>
        </div>
      </motion.div>

      {/* Admin Access Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20"
      >
        <div className="flex items-center gap-2 mb-4">
          <Shield className="text-violet-400" size={20} />
          <h2 className="text-lg font-semibold text-white">Acesso Admin</h2>
        </div>
        
        <div className="space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
              <Lock size={14} className="text-violet-400" />
            </div>
            <div>
              <p className="font-medium text-white">Criação de Admins</p>
              <p className="text-gray-400">
                Para criar um novo admin, execute o script <code className="text-violet-400">npm run seed:admin</code> ou defina o campo <code className="text-violet-400">role: &quot;admin&quot;</code> diretamente no MongoDB.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Shield size={14} className="text-emerald-400" />
            </div>
            <div>
              <p className="font-medium text-white">Tokens de Admin</p>
              <p className="text-gray-400">
                Tokens de admin expiram em 24 horas por segurança. Faça login novamente se necessário.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
