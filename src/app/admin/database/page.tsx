"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  HardDrive,
  Table,
  RefreshCcw,
  Check,
  X,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Zap,
  Plus,
  Trash2,
  FileJson,
  Activity,
  Clock,
} from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";

interface CollectionInfo {
  name: string;
  type: string;
  count: number;
  error?: string;
}

interface DatabaseInfo {
  name: string;
  sizeOnDisk: number;
  empty: boolean;
  collections: CollectionInfo[];
  error?: string;
}

interface ConnectionStatus {
  connected: boolean;
  latency?: number;
  connectionString?: string;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function DatabaseCard({ 
  db, 
  onRefresh,
  token 
}: { 
  db: DatabaseInfo; 
  onRefresh: () => void;
  token: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loadingStats, setLoadingStats] = useState<string | null>(null);

  const fetchCollectionStats = async (collectionName: string) => {
    if (!token) return;
    setLoadingStats(collectionName);
    
    try {
      const res = await fetch("/api/admin/database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "collectionStats",
          database: db.name,
          collection: collectionName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (e) {
      console.error("Error fetching stats:", e);
    } finally {
      setLoadingStats(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30">
            <Database size={18} className="text-cyan-400" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-white">{db.name}</h3>
            <p className="text-xs text-gray-500">
              {db.collections.length} coleções • {formatBytes(db.sizeOnDisk)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
            db.empty 
              ? "bg-gray-500/20 text-gray-400 border border-gray-500/30"
              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
          }`}>
            {db.empty ? "Vazio" : "Ativo"}
          </span>
          {expanded ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
        </div>
      </button>

      {/* Collections */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10"
          >
            <div className="p-4 space-y-2">
              {db.collections.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Nenhuma coleção encontrada</p>
              ) : (
                db.collections.map((col) => (
                  <div
                    key={col.name}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Table size={16} className="text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-white">{col.name}</p>
                        <p className="text-xs text-gray-500">
                          {col.count.toLocaleString()} documentos
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => fetchCollectionStats(col.name)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-gray-300 hover:bg-white/10 transition flex items-center gap-1"
                    >
                      {loadingStats === col.name ? (
                        <RefreshCcw size={12} className="animate-spin" />
                      ) : (
                        <Activity size={12} />
                      )}
                      Stats
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AdminDatabasePage() {
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const { token } = useAdmin();

  const fetchDatabases = useCallback(async () => {
    if (!token) return;
    setLoading(true);

    try {
      const res = await fetch("/api/admin/database", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setDatabases(data.databases);
      }
    } catch (e) {
      console.error("Error fetching databases:", e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const testConnection = useCallback(async () => {
    if (!token) return;
    setTesting(true);

    try {
      const res = await fetch("/api/admin/database?action=test", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setConnectionStatus({
        connected: data.success,
        latency: data.latency,
        connectionString: data.connectionString,
      });
    } catch (e) {
      setConnectionStatus({ connected: false });
    } finally {
      setTesting(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDatabases();
    testConnection();
  }, [fetchDatabases, testConnection]);

  const totalSize = databases.reduce((acc, db) => acc + (db.sizeOnDisk || 0), 0);
  const totalCollections = databases.reduce((acc, db) => acc + db.collections.length, 0);
  const totalDocuments = databases.reduce(
    (acc, db) => acc + db.collections.reduce((a, c) => a + c.count, 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Banco de Dados
          </h1>
          <p className="text-gray-500 mt-1">
            Monitore e gerencie suas conexões MongoDB
          </p>
        </div>
        
        <button
          onClick={() => { fetchDatabases(); testConnection(); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition"
        >
          <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {/* Connection Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-2xl border ${
          connectionStatus?.connected
            ? "bg-gradient-to-br from-emerald-500/10 to-green-500/5 border-emerald-500/30"
            : "bg-gradient-to-br from-red-500/10 to-orange-500/5 border-red-500/30"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              connectionStatus?.connected
                ? "bg-emerald-500/20"
                : "bg-red-500/20"
            }`}>
              {testing ? (
                <RefreshCcw size={24} className="text-gray-400 animate-spin" />
              ) : connectionStatus?.connected ? (
                <Check size={24} className="text-emerald-400" />
              ) : (
                <X size={24} className="text-red-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Status da Conexão
              </h3>
              <p className={`text-sm ${
                connectionStatus?.connected ? "text-emerald-400" : "text-red-400"
              }`}>
                {testing 
                  ? "Testando conexão..." 
                  : connectionStatus?.connected 
                    ? "Conectado ao MongoDB Atlas" 
                    : "Conexão falhou"
                }
              </p>
              {connectionStatus?.connectionString && (
                <p className="text-xs text-gray-500 mt-1 font-mono">
                  {connectionStatus.connectionString}
                </p>
              )}
            </div>
          </div>
          
          {connectionStatus?.latency && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
              <Zap size={14} className="text-amber-400" />
              <span className="text-sm text-white">{connectionStatus.latency}ms</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/30"
        >
          <div className="flex items-center gap-2 text-violet-400 mb-2">
            <Database size={18} />
            <span className="text-sm">Databases</span>
          </div>
          <p className="text-2xl font-bold text-white">{databases.length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30"
        >
          <div className="flex items-center gap-2 text-cyan-400 mb-2">
            <Table size={18} />
            <span className="text-sm">Coleções</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalCollections}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30"
        >
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <FileJson size={18} />
            <span className="text-sm">Documentos</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalDocuments.toLocaleString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-500/30"
        >
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <HardDrive size={18} />
            <span className="text-sm">Tamanho Total</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatBytes(totalSize)}</p>
        </motion.div>
      </div>

      {/* Databases List */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Database size={20} className="text-cyan-400" />
          Databases Disponíveis
        </h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : databases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Database size={48} className="mb-4 opacity-50" />
            <p>Nenhum database encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {databases.map((db) => (
              <DatabaseCard 
                key={db.name} 
                db={db} 
                onRefresh={fetchDatabases}
                token={token}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Informações Úteis</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
              <AlertCircle size={16} className="text-violet-400" />
            </div>
            <div>
              <p className="font-medium text-white">Banco Principal</p>
              <p className="text-gray-400">O banco <code className="text-violet-400">fayapoint</code> contém usuários, progresso de cursos e pedidos.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
              <HardDrive size={16} className="text-cyan-400" />
            </div>
            <div>
              <p className="font-medium text-white">Banco de Produtos</p>
              <p className="text-gray-400">O banco <code className="text-cyan-400">fayapointProdutos</code> contém produtos, preços e conteúdo de cursos.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
