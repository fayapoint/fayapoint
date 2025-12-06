"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
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
  Upload,
  ImageIcon,
  DollarSign,
  Tag,
  Box,
  Star,
  ShoppingCart,
  Link as LinkIcon,
  FileText,
  Settings,
  Layers,
  BookOpen,
} from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";

// Store Product Interface (fayapoint.storeproducts)
interface StoreProduct {
  _id: string;
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  subcategory: string;
  brand: string;
  sku: string;
  thumbnail: string;
  images: string[];
  price: number;
  originalPrice: number;
  discount: number;
  currency: string;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  tags: string[];
  specifications: { key: string; value: string; _id?: string }[];
  rating: number;
  reviewCount: number;
  soldCount: number;
  warranty: string;
  externalUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Course Product Interface (fayapointProdutos.products)
interface CourseProduct {
  _id: string;
  name: string;
  shortName?: string;
  slug: string;
  type: string;
  status: string;
  level: string;
  tool?: string;
  categoryPrimary: string;
  categorySecondary?: string;
  copy?: {
    headline: string;
    subheadline: string;
    shortDescription: string;
    fullDescription: string;
    benefits: string[];
  };
  pricing?: {
    price: number;
    originalPrice: number;
    discount: number;
    currency: string;
  };
  metrics?: {
    students: number;
    rating: number;
    reviewCount: number;
    duration: string;
    lessons: number;
  };
  seo?: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    ogImage: string;
  };
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

type Product = StoreProduct | CourseProduct | Record<string, unknown>;

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Helper to safely get product properties
function getProductProp(product: Product, key: string): string | number | boolean | undefined {
  return (product as Record<string, unknown>)[key] as string | number | boolean | undefined;
}

function ProductRow({ 
  product, 
  collection,
  onEdit, 
  onDelete, 
  onView 
}: { 
  product: Product; 
  collection: string;
  onEdit: () => void; 
  onDelete: () => void;
  onView: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const name = String(getProductProp(product, "name") || getProductProp(product, "title") || "Sem nome");
  const slug = String(getProductProp(product, "slug") || (product as Record<string, unknown>)._id || "");
  const thumbnail = String(getProductProp(product, "thumbnail") || getProductProp(product, "seo.ogImage") || "");
  const isStoreProduct = collection === "storeproducts";
  const storeProduct = product as StoreProduct;
  const courseProduct = product as CourseProduct;
  
  // Get price based on product type
  const price = isStoreProduct 
    ? storeProduct.price 
    : courseProduct.pricing?.price;
  
  // Get status/active
  const isActive = isStoreProduct 
    ? storeProduct.isActive 
    : courseProduct.status === "active";
  
  const stock = isStoreProduct ? storeProduct.stock : undefined;

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          {thumbnail ? (
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-800 relative">
              <Image 
                src={thumbnail} 
                alt={name} 
                fill 
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
              {isStoreProduct ? <ShoppingCart size={18} className="text-amber-400" /> : <BookOpen size={18} className="text-violet-400" />}
            </div>
          )}
          <div>
            <p className="font-medium text-white truncate max-w-[200px]">{name}</p>
            <p className="text-xs text-gray-500 truncate max-w-[200px]">{slug}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4 text-gray-400 text-sm">
        {isStoreProduct ? storeProduct.category : courseProduct.type || "curso"}
      </td>
      <td className="py-4 px-4 text-gray-400 text-sm">
        {price !== undefined ? `R$ ${Number(price).toFixed(2)}` : "N/A"}
      </td>
      <td className="py-4 px-4">
        {isStoreProduct && stock !== undefined && (
          <span className={`inline-flex px-2 py-1 rounded-full text-xs mr-2 ${
            stock > 0 
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}>
            {stock} un
          </span>
        )}
        <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
          isActive 
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
        }`}>
          {isActive ? "Ativo" : "Inativo"}
        </span>
      </td>
      <td className="py-4 px-4 text-gray-400 text-sm">
        {isStoreProduct && storeProduct.isFeatured && (
          <Star size={14} className="inline text-amber-400 mr-1" />
        )}
        {String(getProductProp(product, "createdAt") || "").slice(0, 10) || "N/A"}
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

// Image Upload Component
function ImageUploader({ 
  value, 
  onChange, 
  label 
}: { 
  value: string; 
  onChange: (url: string) => void;
  label: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "fayapoint");

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dyog9n63w"}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (data.secure_url) {
        onChange(data.secure_url);
        setPreviewUrl(data.secure_url);
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-400 font-medium">{label}</label>
      <div className="flex gap-3">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-24 h-24 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition overflow-hidden relative"
        >
          {uploading ? (
            <RefreshCcw className="w-6 h-6 animate-spin text-gray-400" />
          ) : previewUrl ? (
            <Image src={previewUrl} alt="Preview" fill className="object-cover" unoptimized />
          ) : (
            <ImageIcon className="w-8 h-8 text-gray-500" />
          )}
        </div>
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => { onChange(e.target.value); setPreviewUrl(e.target.value); }}
            placeholder="URL da imagem ou clique para upload"
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50"
          />
          <p className="text-xs text-gray-500 mt-1">Clique na caixa ou cole uma URL</p>
        </div>
      </div>
    </div>
  );
}

// Store Product Edit Modal
function StoreProductEditModal({ 
  product, 
  onClose, 
  onSave 
}: { 
  product?: StoreProduct | null;
  onClose: () => void; 
  onSave: (data: Partial<StoreProduct>) => Promise<void>;
}) {
  const [formData, setFormData] = useState<Partial<StoreProduct>>({
    name: product?.name || "",
    slug: product?.slug || "",
    shortDescription: product?.shortDescription || "",
    fullDescription: product?.fullDescription || "",
    category: product?.category || "",
    subcategory: product?.subcategory || "",
    brand: product?.brand || "",
    sku: product?.sku || "",
    thumbnail: product?.thumbnail || "",
    images: product?.images || [],
    price: product?.price || 0,
    originalPrice: product?.originalPrice || 0,
    discount: product?.discount || 0,
    currency: product?.currency || "BRL",
    stock: product?.stock || 0,
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    isNewArrival: product?.isNewArrival ?? false,
    tags: product?.tags || [],
    specifications: product?.specifications || [],
    rating: product?.rating || 0,
    reviewCount: product?.reviewCount || 0,
    soldCount: product?.soldCount || 0,
    warranty: product?.warranty || "",
    externalUrl: product?.externalUrl || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"basic" | "pricing" | "media" | "specs">("basic");
  const [newTag, setNewTag] = useState("");
  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");

  const updateField = <K extends keyof StoreProduct>(key: K, value: StoreProduct[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      updateField("tags", [...(formData.tags || []), newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    updateField("tags", (formData.tags || []).filter(t => t !== tag));
  };

  const addSpec = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      updateField("specifications", [...(formData.specifications || []), { key: newSpecKey.trim(), value: newSpecValue.trim() }]);
      setNewSpecKey("");
      setNewSpecValue("");
    }
  };

  const removeSpec = (index: number) => {
    updateField("specifications", (formData.specifications || []).filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      // Auto-generate slug if empty
      if (!formData.slug && formData.name) {
        formData.slug = formData.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      }
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "basic", label: "Informações", icon: FileText },
    { id: "pricing", label: "Preços & Estoque", icon: DollarSign },
    { id: "media", label: "Imagens", icon: ImageIcon },
    { id: "specs", label: "Especificações", icon: Settings },
  ];

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
        className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl bg-gray-900 border border-white/10 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">
                {product ? "Editar Produto da Loja" : "Novo Produto da Loja"}
              </h3>
              <p className="text-sm text-gray-500">fayapoint.storeproducts</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 py-3 border-b border-white/10 bg-white/[0.02]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id 
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
                  : "text-gray-400 hover:bg-white/5"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {activeTab === "basic" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 font-medium mb-1 block">Nome do Produto *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 font-medium mb-1 block">Slug (URL)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => updateField("slug", e.target.value)}
                    placeholder="auto-gerado do nome"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 font-medium mb-1 block">Descrição Curta</label>
                <input
                  type="text"
                  value={formData.shortDescription}
                  onChange={(e) => updateField("shortDescription", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 font-medium mb-1 block">Descrição Completa</label>
                <textarea
                  value={formData.fullDescription}
                  onChange={(e) => updateField("fullDescription", e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-400 font-medium mb-1 block">Categoria</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => updateField("category", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 font-medium mb-1 block">Subcategoria</label>
                  <input
                    type="text"
                    value={formData.subcategory}
                    onChange={(e) => updateField("subcategory", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 font-medium mb-1 block">Marca</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => updateField("brand", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 font-medium mb-1 block">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => updateField("sku", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 font-medium mb-1 block">Garantia</label>
                  <input
                    type="text"
                    value={formData.warranty}
                    onChange={(e) => updateField("warranty", e.target.value)}
                    placeholder="Ex: 1 ano"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 font-medium mb-1 block">URL Externa (opcional)</label>
                <input
                  type="url"
                  value={formData.externalUrl}
                  onChange={(e) => updateField("externalUrl", e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm text-gray-400 font-medium mb-2 block">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags?.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="Adicionar tag..."
                    className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50"
                  />
                  <button type="button" onClick={addTag} className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition">
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "pricing" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-400 font-medium mb-1 block">Preço (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => updateField("price", parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 font-medium mb-1 block">Preço Original (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.originalPrice}
                    onChange={(e) => updateField("originalPrice", parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 font-medium mb-1 block">Desconto (%)</label>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => updateField("discount", parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 font-medium mb-1 block">Estoque *</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => updateField("stock", parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 font-medium mb-1 block">Moeda</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => updateField("currency", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="BRL">BRL (R$)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <h4 className="font-medium text-white flex items-center gap-2">
                  <Settings size={16} />
                  Status do Produto
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => updateField("isActive", e.target.checked)}
                      className="w-5 h-5 rounded bg-white/5 border border-white/20 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-300">Ativo</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => updateField("isFeatured", e.target.checked)}
                      className="w-5 h-5 rounded bg-white/5 border border-white/20 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-300">Destaque</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isNewArrival}
                      onChange={(e) => updateField("isNewArrival", e.target.checked)}
                      className="w-5 h-5 rounded bg-white/5 border border-white/20 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-300">Novidade</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-400 font-medium mb-1 block">Avaliação</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => updateField("rating", parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 font-medium mb-1 block">Nº Avaliações</label>
                  <input
                    type="number"
                    value={formData.reviewCount}
                    onChange={(e) => updateField("reviewCount", parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 font-medium mb-1 block">Vendidos</label>
                  <input
                    type="number"
                    value={formData.soldCount}
                    onChange={(e) => updateField("soldCount", parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "media" && (
            <div className="space-y-6">
              <ImageUploader
                value={formData.thumbnail || ""}
                onChange={(url) => updateField("thumbnail", url)}
                label="Thumbnail Principal"
              />

              <div>
                <label className="text-sm text-gray-400 font-medium mb-2 block">Galeria de Imagens</label>
                <div className="grid grid-cols-4 gap-3">
                  {formData.images?.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-800 relative">
                        <Image src={img} alt={`Image ${idx + 1}`} fill className="object-cover" unoptimized />
                      </div>
                      <button
                        type="button"
                        onClick={() => updateField("images", formData.images?.filter((_, i) => i !== idx) || [])}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <div 
                    onClick={() => {
                      const url = prompt("URL da imagem:");
                      if (url) updateField("images", [...(formData.images || []), url]);
                    }}
                    className="w-full aspect-square rounded-lg bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition"
                  >
                    <Plus size={24} className="text-gray-500 mb-1" />
                    <span className="text-xs text-gray-500">Adicionar</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "specs" && (
            <div className="space-y-4">
              <div className="space-y-2">
                {formData.specifications?.map((spec, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex-1">
                      <span className="text-sm text-gray-400">{spec.key}:</span>
                      <span className="text-sm text-white ml-2">{spec.value}</span>
                    </div>
                    <button type="button" onClick={() => removeSpec(idx)} className="text-red-400 hover:text-red-300">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <h4 className="text-sm font-medium text-white mb-3">Adicionar Especificação</h4>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newSpecKey}
                    onChange={(e) => setNewSpecKey(e.target.value)}
                    placeholder="Nome (ex: Processador)"
                    className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50"
                  />
                  <input
                    type="text"
                    value={newSpecValue}
                    onChange={(e) => setNewSpecValue(e.target.value)}
                    placeholder="Valor (ex: Intel i9)"
                    className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50"
                  />
                  <button type="button" onClick={addSpec} className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition">
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-white/10 bg-white/[0.02]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold hover:from-amber-600 hover:to-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            {saving ? (
              <>
                <RefreshCcw className="w-5 h-5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check size={18} />
                {product ? "Atualizar Produto" : "Criar Produto"}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// JSON Edit Modal (for courses and other collections)
function JsonEditModal({ 
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
        className="relative w-full max-w-3xl rounded-2xl bg-gray-900 border border-white/10 p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white">
              {product ? "Editar Documento" : "Novo Documento"}
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
              className="w-full h-96 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-violet-500/50 resize-none"
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
  const [database, setDatabase] = useState("fayapoint");
  const [collection, setCollection] = useState("storeproducts");
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null | "new">(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { token } = useAdmin();
  
  // Determine if we're editing store products
  const isStoreProducts = database === "fayapoint" && collection === "storeproducts";

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
              {database === "fayapoint" ? (
                <>
                  <option value="storeproducts">storeproducts (Loja)</option>
                  <option value="orders">orders</option>
                  <option value="users">users</option>
                  <option value="courseprogresses">courseprogresses</option>
                  <option value="imagecreations">imagecreations</option>
                  <option value="adminlogs">adminlogs</option>
                </>
              ) : (
                <>
                  <option value="products">products (Cursos)</option>
                  <option value="prices">prices</option>
                </>
              )}
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
                  {products.map((product) => {
                    const productId = String((product as Record<string, unknown>)._id || "");
                    return (
                      <ProductRow
                        key={productId}
                        product={product}
                        collection={collection}
                        onView={() => setViewProduct(product)}
                        onEdit={() => setEditProduct(product)}
                        onDelete={() => setDeleteConfirm(productId)}
                      />
                    );
                  })}
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
        {editProduct && isStoreProducts && (
          <StoreProductEditModal
            product={editProduct === "new" ? null : (editProduct as StoreProduct)}
            onClose={() => setEditProduct(null)}
            onSave={async (data) => {
              await handleSaveProduct(data as Record<string, unknown>);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editProduct && !isStoreProducts && (
          <JsonEditModal
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
