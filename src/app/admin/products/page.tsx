"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  MoreVertical,
  RefreshCcw,
  X,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Database,
  Eye,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";

interface Product {
  _id: string;
  name?: string;
  title?: string;
  slug?: string;
  price?: number;
  type?: string;
  status?: string;
  createdAt?: string;
  [key: string]: unknown;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

function ProductRow({ 
  product, 
  onEdit, 
  onDelete, 
  onView 
}: { 
  product: Product; 
  onEdit: () => void; 
  onDelete: () => void;
  onView: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const name = product.name || product.title || "Sem nome";

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
            <Package size={18} className="text-amber-400" />
          </div>
          <div>
            <p className="font-medium text-white truncate max-w-[200px]">{name}</p>
            <p className="text-xs text-gray-500 truncate max-w-[200px]">{product.slug || product._id}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4 text-gray-400 text-sm">
        {product.type || "N/A"}
      </td>
      <td className="py-4 px-4 text-gray-400 text-sm">
        {product.price !== undefined ? `R$ ${product.price.toFixed(2)}` : "N/A"}
      </td>
      <td className="py-4 px-4">
        <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
          product.status === "active" 
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
        }`}>
          {product.status || "N/A"}
        </span>
      </td>
      <td className="py-4 px-4 text-gray-400 text-sm">
        {product.createdAt ? new Date(product.createdAt).toLocaleDateString("pt-BR") : "N/A"}
      </td>
      <td className="py-4 px-4">
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <MoreVertical size={16} />
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowMenu(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1 w-40 rounded-xl bg-gray-900 border border-white/10 shadow-xl z-50 overflow-hidden"
                >
                  <button
                    onClick={() => { onView(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                  >
                    <Eye size={14} />
                    Ver JSON
                  </button>
                  <button
                    onClick={() => { onEdit(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                  >
                    <Edit2 size={14} />
                    Editar
                  </button>
                  <button
                    onClick={() => { onDelete(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={14} />
                    Excluir
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </td>
    </tr>
  );
}

function ProductViewModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const jsonString = JSON.stringify(product, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl max-h-[80vh] rounded-2xl bg-gray-900 border border-white/10 overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Dados do Produto</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition text-sm"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copiado!" : "Copiar"}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="p-4 overflow-auto max-h-[60vh]">
          <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
            {jsonString}
          </pre>
        </div>
      </motion.div>
    </div>
  );
}

function ProductEditModal({ 
  product, 
  database,
  collection,
  onClose, 
  onSave 
}: { 
  product?: Product | null;
  database: string;
  collection: string;
  onClose: () => void; 
  onSave: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [jsonData, setJsonData] = useState(
    product ? JSON.stringify(product, null, 2) : '{\n  "name": "",\n  "type": "",\n  "price": 0,\n  "status": "active"\n}'
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const data = JSON.parse(jsonData);
      await onSave(data);
      onClose();
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError("JSON inválido");
      } else {
        setError(String(err));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl rounded-2xl bg-gray-900 border border-white/10 p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white">
              {product ? "Editar Produto" : "Novo Produto"}
            </h3>
            <p className="text-sm text-gray-500">{database}.{collection}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">JSON do Documento</label>
            <textarea
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              className="w-full h-80 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-violet-500/50 resize-none"
              spellCheck={false}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <RefreshCcw className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Salvar
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [database, setDatabase] = useState("fayapointProdutos");
  const [collection, setCollection] = useState("products");
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null | "new">(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { token } = useAdmin();

  const fetchProducts = useCallback(async () => {
    if (!token) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        database,
        collection,
        ...(search && { search }),
      });

      const res = await fetch(`/api/admin/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setProducts(data.products);
        setPagination(data.pagination);
      }
    } catch (e) {
      console.error("Error fetching products:", e);
    } finally {
      setLoading(false);
    }
  }, [token, pagination.page, pagination.limit, search, database, collection]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSaveProduct = async (data: Record<string, unknown>) => {
    if (!token) return;

    const isNew = editProduct === "new";
    const url = isNew 
      ? "/api/admin/products"
      : `/api/admin/products/${(editProduct as Product)?._id}`;
    
    const method = isNew ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ database, collection, data }),
    });

    const result = await res.json();
    if (!result.success) {
      throw new Error(result.error);
    }

    fetchProducts();
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!token) return;

    try {
      const params = new URLSearchParams({ database, collection });
      const res = await fetch(`/api/admin/products/${productId}?${params}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchProducts();
      }
    } catch (e) {
      console.error("Error deleting product:", e);
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Produtos
          </h1>
          <p className="text-gray-500 mt-1">
            Gerencie produtos de todos os bancos de dados
          </p>
        </div>
        
        <button
          onClick={() => setEditProduct("new")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-700 transition shadow-lg shadow-amber-500/20"
        >
          <Plus size={18} />
          Novo Produto
        </button>
      </div>

      {/* Database/Collection Selector */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Database size={18} className="text-violet-400" />
          <span className="text-sm font-medium text-white">Selecionar Origem</span>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Banco de Dados</label>
            <select
              value={database}
              onChange={(e) => { setDatabase(e.target.value); setPagination({ ...pagination, page: 1 }); }}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500/50"
            >
              <option value="fayapoint">fayapoint</option>
              <option value="fayapointProdutos">fayapointProdutos</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Coleção</label>
            <select
              value={collection}
              onChange={(e) => { setCollection(e.target.value); setPagination({ ...pagination, page: 1 }); }}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500/50"
            >
              <option value="products">products</option>
              <option value="prices">prices</option>
              <option value="users">users</option>
              <option value="orders">orders</option>
              <option value="courseprogresses">courseprogresses</option>
              <option value="imagecreations">imagecreations</option>
              <option value="adminlogs">adminlogs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nome, título ou slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
          />
        </div>

        <button
          onClick={fetchProducts}
          className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition"
        >
          <RefreshCcw size={18} />
        </button>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Package size={48} className="mb-4 opacity-50" />
            <p>Nenhum produto encontrado</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Produto</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Tipo</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Preço</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Status</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Criado</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <ProductRow
                      key={product._id}
                      product={product}
                      onView={() => setViewProduct(product)}
                      onEdit={() => setEditProduct(product)}
                      onDelete={() => setDeleteConfirm(product._id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-4 border-t border-white/10">
              <p className="text-sm text-gray-500">
                Mostrando {products.length} de {pagination.total} documentos
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

      {/* Modals */}
      <AnimatePresence>
        {viewProduct && (
          <ProductViewModal product={viewProduct} onClose={() => setViewProduct(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editProduct && (
          <ProductEditModal
            product={editProduct === "new" ? null : editProduct}
            database={database}
            collection={collection}
            onClose={() => setEditProduct(null)}
            onSave={handleSaveProduct}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setDeleteConfirm(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm rounded-2xl bg-gray-900 border border-white/10 p-6 text-center"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Excluir Documento?</h3>
              <p className="text-sm text-gray-400 mb-6">
                Esta ação não pode ser desfeita. O documento será permanentemente removido.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteProduct(deleteConfirm)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
