"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Search,
  RefreshCcw,
  Eye,
  Package,
  User,
  DollarSign,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  X,
  AlertCircle,
} from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";

interface Order {
  _id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  items?: { name: string; quantity: number; price: number }[];
  totalAmount?: number;
  status?: string;
  paymentMethod?: string;
  createdAt?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

function getStatusBadge(status?: string) {
  switch (status) {
    case "completed":
    case "paid":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "pending":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "processing":
      return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
    case "cancelled":
    case "failed":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
}

function getStatusIcon(status?: string) {
  switch (status) {
    case "completed":
    case "paid":
      return Check;
    case "pending":
    case "processing":
      return Clock;
    case "cancelled":
    case "failed":
      return X;
    default:
      return AlertCircle;
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { token } = useAdmin();

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        database: "fayapoint",
        collection: "orders",
        ...(search && { search }),
      });

      const res = await fetch(`/api/admin/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setOrders(data.products);
        setPagination(data.pagination);
      }
    } catch (e) {
      console.error("Error fetching orders:", e);
    } finally {
      setLoading(false);
    }
  }, [token, pagination.page, pagination.limit, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = statusFilter 
    ? orders.filter(o => o.status === statusFilter)
    : orders;

  const totalRevenue = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const completedOrders = orders.filter(o => o.status === "completed" || o.status === "paid").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Pedidos
          </h1>
          <p className="text-gray-500 mt-1">
            Visualize e gerencie todos os pedidos
          </p>
        </div>
        
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition"
        >
          <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-500/30"
        >
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <DollarSign size={18} />
            <span className="text-sm">Receita Total</span>
          </div>
          <p className="text-2xl font-bold text-white">
            R$ {totalRevenue.toFixed(2)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/30"
        >
          <div className="flex items-center gap-2 text-violet-400 mb-2">
            <ShoppingCart size={18} />
            <span className="text-sm">Total de Pedidos</span>
          </div>
          <p className="text-2xl font-bold text-white">{pagination.total}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30"
        >
          <div className="flex items-center gap-2 text-cyan-400 mb-2">
            <Check size={18} />
            <span className="text-sm">Concluídos</span>
          </div>
          <p className="text-2xl font-bold text-white">{completedOrders}</p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por email ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500/50"
        >
          <option value="">Todos os Status</option>
          <option value="pending">Pendente</option>
          <option value="processing">Processando</option>
          <option value="completed">Concluído</option>
          <option value="paid">Pago</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      {/* Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <ShoppingCart size={48} className="mb-4 opacity-50" />
            <p>Nenhum pedido encontrado</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Pedido</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Cliente</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Valor</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Status</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Data</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const StatusIcon = getStatusIcon(order.status);
                    return (
                      <tr key={order._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center border border-emerald-500/30">
                              <Package size={18} className="text-emerald-400" />
                            </div>
                            <div>
                              <p className="font-mono text-sm text-white">#{order._id.slice(-8)}</p>
                              <p className="text-xs text-gray-500">
                                {order.items?.length || 0} item(s)
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-white">{order.userName || "N/A"}</p>
                          <p className="text-xs text-gray-500">{order.userEmail || "N/A"}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-semibold text-white">
                            R$ {(order.totalAmount || 0).toFixed(2)}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusBadge(order.status)}`}>
                            <StatusIcon size={12} />
                            {order.status || "N/A"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-400 text-sm">
                          {order.createdAt 
                            ? new Date(order.createdAt).toLocaleDateString("pt-BR")
                            : "N/A"
                          }
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-4 border-t border-white/10">
              <p className="text-sm text-gray-500">
                Mostrando {filteredOrders.length} de {pagination.total} pedidos
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

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedOrder(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-lg rounded-2xl bg-gray-900 border border-white/10 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                Pedido #{selectedOrder._id.slice(-8)}
              </h3>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5">
                <p className="text-xs text-gray-500 mb-1">Cliente</p>
                <p className="text-white font-medium">{selectedOrder.userName || "N/A"}</p>
                <p className="text-sm text-gray-400">{selectedOrder.userEmail || "N/A"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-xs text-gray-500 mb-1">Valor Total</p>
                  <p className="text-xl font-bold text-emerald-400">
                    R$ {(selectedOrder.totalAmount || 0).toFixed(2)}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusBadge(selectedOrder.status)}`}>
                    {selectedOrder.status || "N/A"}
                  </span>
                </div>
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-xs text-gray-500 mb-2">Itens</p>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-white">{item.name} x{item.quantity}</span>
                        <span className="text-gray-400">R$ {item.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-white/5">
                <p className="text-xs text-gray-500 mb-1">ID Completo</p>
                <p className="text-sm text-white font-mono break-all">{selectedOrder._id}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
