"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store, Plus, Search, Filter, MoreVertical, Eye, Edit, Trash2, Play, Pause,
  Package, DollarSign, ShoppingBag, Sparkles, Shirt, Home, Frame, Coffee,
  Smartphone, Upload, Image as ImageIcon, CheckCircle, Clock, AlertCircle,
  ChevronRight, ChevronLeft, Globe, Loader2, X, Star, Lock, Trophy, ArrowRight, Save, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// Types
interface PrintifyBlueprint { id: number; title: string; description: string; brand: string; model: string; images: string[]; }
interface PrintifyProvider { id: number; title: string; location: { country: string; city?: string }; }
interface PrintifyVariant { id: number; title: string; options: Record<string, string>; placeholders: { position: string; height: number; width: number }[]; }
interface PODProduct {
  _id: string; title: string; slug: string; description: string; category: string; templateId: string; templateName: string;
  baseProductType: string; designFiles: { url: string; width: number; height: number }[]; mockupImages: string[];
  primaryMockup?: string; variants: { id: string; name: string; sellingPrice: number; basePrice: number }[];
  baseCost: number; suggestedPrice: number; status: "draft" | "pending_review" | "active" | "paused" | "rejected" | "archived";
  isPublished: boolean; views: number; sales: number; revenue: number; rating: number; createdAt: string;
}
interface UserData { progress?: { xp?: number; level?: number }; subscription?: { plan?: string }; }

const CATEGORY_ICONS: Record<string, typeof Package> = { apparel: Shirt, wallArt: Frame, drinkware: Coffee, accessories: ShoppingBag, tech: Smartphone, home: Home };
const STATUS_CONFIG = {
  draft: { label: "Rascunho", color: "bg-gray-500", icon: Edit },
  pending_review: { label: "Em Revisão", color: "bg-yellow-500", icon: Clock },
  active: { label: "Ativo", color: "bg-green-500", icon: CheckCircle },
  paused: { label: "Pausado", color: "bg-orange-500", icon: Pause },
  rejected: { label: "Rejeitado", color: "bg-red-500", icon: AlertCircle },
  archived: { label: "Arquivado", color: "bg-gray-600", icon: Package },
};
const MIN_XP_TO_PUBLISH = 500;
const BLUEPRINT_CATEGORIES = [
  { key: "t-shirt", label: "Camisetas", icon: Shirt }, { key: "hoodie", label: "Moletons", icon: Shirt },
  { key: "mug", label: "Canecas", icon: Coffee }, { key: "poster", label: "Posters", icon: Frame },
  { key: "canvas", label: "Canvas", icon: Frame }, { key: "phone case", label: "Capinhas", icon: Smartphone },
  { key: "tote bag", label: "Bolsas", icon: ShoppingBag }, { key: "pillow", label: "Almofadas", icon: Home },
];

export default function PODStorePanel() {
  const [activeTab, setActiveTab] = useState<"products" | "create">("products");
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<PODProduct[]>([]);
  const [stats, setStats] = useState<{ total: number; active: number; draft: number; totalSales: number; totalRevenue: number } | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<PODProduct | null>(null);
  const [editingProduct, setEditingProduct] = useState<PODProduct | null>(null);
  const [createStep, setCreateStep] = useState(1);
  const [blueprintSearch, setBlueprintSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [blueprints, setBlueprints] = useState<PrintifyBlueprint[]>([]);
  const [selectedBlueprint, setSelectedBlueprint] = useState<PrintifyBlueprint | null>(null);
  const [providers, setProviders] = useState<PrintifyProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<PrintifyProvider | null>(null);
  const [variants, setVariants] = useState<PrintifyVariant[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<number[]>([]);
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [designPreview, setDesignPreview] = useState<string | null>(null);
  const [uploadedDesignUrl, setUploadedDesignUrl] = useState<string | null>(null);
  const [productTitle, setProductTitle] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [sellingPrice, setSellingPrice] = useState(0);
  const [baseCost, setBaseCost] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isFetchingBlueprints, setIsFetchingBlueprints] = useState(false);
  const [isFetchingProviders, setIsFetchingProviders] = useState(false);
  const [isFetchingVariants, setIsFetchingVariants] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUserData = useCallback(async () => {
    const token = localStorage.getItem("fayapoint_token");
    if (!token) return;
    try {
      const res = await fetch("/api/user/dashboard", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setUserData(data.user); }
    } catch (e) { console.error("Error:", e); }
  }, []);

  const fetchProducts = useCallback(async () => {
    const token = localStorage.getItem("fayapoint_token");
    if (!token) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/pod/products?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setProducts(data.products || []); setStats(data.stats); }
    } catch (e) { console.error("Error:", e); toast.error("Erro ao carregar produtos"); }
    finally { setIsLoading(false); }
  }, [statusFilter]);

  const fetchBlueprints = useCallback(async (category?: string, search?: string) => {
    const token = localStorage.getItem("fayapoint_token");
    if (!token) return;
    setIsFetchingBlueprints(true);
    try {
      const params = new URLSearchParams({ action: "catalog" });
      if (category) params.set("category", category);
      if (search) params.set("search", search);
      const res = await fetch(`/api/pod/blueprints?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (data.results) setBlueprints(data.results);
        else if (data.featured) setBlueprints(data.featured);
        else {
          const allBps: PrintifyBlueprint[] = [];
          Object.values(data.blueprintsByCategory || {}).forEach((bps) => allBps.push(...(bps as PrintifyBlueprint[]).slice(0, 5)));
          setBlueprints(allBps.slice(0, 24));
        }
      }
    } catch (e) { console.error("Error:", e); toast.error("Erro ao carregar catálogo"); }
    finally { setIsFetchingBlueprints(false); }
  }, []);

  const fetchProviders = useCallback(async (blueprintId: number) => {
    const token = localStorage.getItem("fayapoint_token");
    if (!token) return;
    setIsFetchingProviders(true);
    try {
      const res = await fetch(`/api/pod/blueprints?action=blueprint&blueprintId=${blueprintId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setProviders(data.providers || []); }
    } catch (e) { console.error("Error:", e); }
    finally { setIsFetchingProviders(false); }
  }, []);

  const fetchVariants = useCallback(async (blueprintId: number, providerId: number) => {
    const token = localStorage.getItem("fayapoint_token");
    if (!token) return;
    setIsFetchingVariants(true);
    try {
      const res = await fetch(`/api/pod/blueprints?action=variants&blueprintId=${blueprintId}&providerId=${providerId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setVariants(data.variants || []);
        if (data.variants?.length > 0) setSelectedVariants(data.variants.slice(0, 5).map((v: PrintifyVariant) => v.id));
      }
    } catch (e) { console.error("Error:", e); }
    finally { setIsFetchingVariants(false); }
  }, []);

  useEffect(() => { fetchUserData(); fetchProducts(); }, [fetchUserData, fetchProducts]);
  useEffect(() => { if (activeTab === "create" && blueprints.length === 0) fetchBlueprints(); }, [activeTab, blueprints.length, fetchBlueprints]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/svg+xml"].includes(file.type)) { toast.error("Use PNG, JPG ou SVG"); return; }
    if (file.size > 50 * 1024 * 1024) { toast.error("Max 50MB"); return; }
    setDesignFile(file);
    setDesignPreview(URL.createObjectURL(file));
  };

  const uploadDesign = async (): Promise<string | null> => {
    if (!designFile) return null;
    const token = localStorage.getItem("fayapoint_token");
    if (!token) return null;
    const formData = new FormData();
    formData.append("file", designFile);
    formData.append("folder", "pod-designs");
    try {
      const res = await fetch("/api/upload", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
      if (res.ok) { const data = await res.json(); return data.url; }
    } catch (e) { console.error("Upload error:", e); }
    return null;
  };

  const inferCategory = (title: string): string => {
    const l = title.toLowerCase();
    if (l.includes("shirt") || l.includes("hoodie")) return "apparel";
    if (l.includes("mug") || l.includes("cup")) return "drinkware";
    if (l.includes("poster") || l.includes("canvas")) return "wallArt";
    if (l.includes("phone") || l.includes("case")) return "tech";
    if (l.includes("pillow") || l.includes("blanket")) return "home";
    return "accessories";
  };

  const createProduct = async (publish: boolean = false) => {
    if (!selectedBlueprint || !selectedProvider || !designPreview) { toast.error("Preencha todos os campos"); return; }
    const userXP = userData?.progress?.xp || 0;
    if (publish && userXP < MIN_XP_TO_PUBLISH) { toast.error(`Precisa ${MIN_XP_TO_PUBLISH} XP para publicar. Atual: ${userXP}`); return; }
    setIsCreating(true);
    const token = localStorage.getItem("fayapoint_token");
    try {
      let designUrl = uploadedDesignUrl;
      if (!designUrl && designFile) { designUrl = await uploadDesign(); if (!designUrl) { toast.error("Erro no upload"); setIsCreating(false); return; } setUploadedDesignUrl(designUrl); }
      const productData = {
        title: productTitle || selectedBlueprint.title, description: productDescription || selectedBlueprint.description,
        category: inferCategory(selectedBlueprint.title), templateId: String(selectedBlueprint.id),
        templateName: selectedBlueprint.title, baseProductType: selectedBlueprint.model,
        designFiles: [{ url: designUrl, width: 4000, height: 4000, format: designFile?.type.split("/")[1] || "png", sizeBytes: designFile?.size || 0 }],
        mockupImages: selectedBlueprint.images, primaryMockup: selectedBlueprint.images[0],
        variants: selectedVariants.map(vId => {
          const v = variants.find(x => x.id === vId);
          return { id: String(vId), providerVariantId: String(vId), name: v?.title || "Variant", options: v?.options || {}, sku: `POD-${selectedBlueprint.id}-${vId}`, basePrice: baseCost, sellingPrice, profit: sellingPrice - baseCost, isActive: true };
        }),
        baseCost, suggestedPrice: sellingPrice, minimumPrice: baseCost * 1.2,
        providers: [{ providerId: String(selectedProvider.id), providerSlug: "printify", syncStatus: "pending" as const }],
        primaryProvider: "printify",
      };
      const res = await fetch("/api/pod/products", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(productData) });
      if (res.ok) {
        const data = await res.json();
        if (publish && data.product?._id) {
          await fetch("/api/pod/products", { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ productId: data.product._id, status: "active" }) });
        }
        toast.success(publish ? "Publicado!" : "Salvo!");
        resetCreateWizard(); setActiveTab("products"); fetchProducts();
      } else { const err = await res.json(); toast.error(err.error || "Erro"); }
    } catch (e) { console.error(e); toast.error("Erro ao criar"); }
    finally { setIsCreating(false); }
  };

  const updateProduct = async (productId: string, updates: Partial<PODProduct>) => {
    const token = localStorage.getItem("fayapoint_token");
    try {
      const res = await fetch("/api/pod/products", { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ productId, ...updates }) });
      if (res.ok) { toast.success("Atualizado"); fetchProducts(); setEditingProduct(null); setSelectedProduct(null); }
    } catch (e) { console.error(e); toast.error("Erro"); }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm("Excluir?")) return;
    const token = localStorage.getItem("fayapoint_token");
    try {
      const res = await fetch(`/api/pod/products?productId=${productId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { toast.success("Excluído"); fetchProducts(); }
    } catch (e) { console.error(e); toast.error("Erro"); }
  };

  const publishProduct = async (productId: string) => {
    const userXP = userData?.progress?.xp || 0;
    if (userXP < MIN_XP_TO_PUBLISH) { toast.error(`Precisa ${MIN_XP_TO_PUBLISH} XP. Atual: ${userXP}`); return; }
    await updateProduct(productId, { status: "active" });
  };

  const resetCreateWizard = () => {
    setCreateStep(1); setSelectedBlueprint(null); setSelectedProvider(null); setProviders([]); setVariants([]);
    setSelectedVariants([]); setDesignFile(null); setDesignPreview(null); setUploadedDesignUrl(null);
    setProductTitle(""); setProductDescription(""); setSellingPrice(0); setBaseCost(0);
  };

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const userXP = userData?.progress?.xp || 0;
  const canPublish = userXP >= MIN_XP_TO_PUBLISH;

  // CONTINUED IN NEXT EDIT - Component render functions
  return (
    <div className="min-h-full">
      {/* Main content will be rendered here */}
      <PODPanelContent
        activeTab={activeTab} setActiveTab={setActiveTab} isLoading={isLoading} products={products}
        stats={stats} searchQuery={searchQuery} setSearchQuery={setSearchQuery} statusFilter={statusFilter}
        setStatusFilter={setStatusFilter} selectedProduct={selectedProduct} setSelectedProduct={setSelectedProduct}
        editingProduct={editingProduct} setEditingProduct={setEditingProduct} createStep={createStep} setCreateStep={setCreateStep}
        blueprintSearch={blueprintSearch} setBlueprintSearch={setBlueprintSearch} selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory} blueprints={blueprints} selectedBlueprint={selectedBlueprint}
        setSelectedBlueprint={setSelectedBlueprint} providers={providers} selectedProvider={selectedProvider}
        setSelectedProvider={setSelectedProvider} variants={variants} selectedVariants={selectedVariants}
        setSelectedVariants={setSelectedVariants} designPreview={designPreview} productTitle={productTitle}
        setProductTitle={setProductTitle} productDescription={productDescription} setProductDescription={setProductDescription}
        sellingPrice={sellingPrice} setSellingPrice={setSellingPrice} baseCost={baseCost} setBaseCost={setBaseCost}
        isCreating={isCreating} isFetchingBlueprints={isFetchingBlueprints} isFetchingProviders={isFetchingProviders}
        isFetchingVariants={isFetchingVariants} fileInputRef={fileInputRef} handleFileSelect={handleFileSelect}
        fetchBlueprints={fetchBlueprints} fetchProviders={fetchProviders} fetchVariants={fetchVariants}
        createProduct={createProduct} updateProduct={updateProduct} deleteProduct={deleteProduct} publishProduct={publishProduct}
        resetCreateWizard={resetCreateWizard} formatCurrency={formatCurrency} userXP={userXP} canPublish={canPublish}
      />
    </div>
  );
}

// Separate content component for cleaner organization
function PODPanelContent(props: {
  activeTab: string; setActiveTab: (t: "products" | "create") => void; isLoading: boolean; products: PODProduct[];
  stats: { total: number; active: number; draft: number; totalSales: number; totalRevenue: number } | null;
  searchQuery: string; setSearchQuery: (s: string) => void; statusFilter: string; setStatusFilter: (s: string) => void;
  selectedProduct: PODProduct | null; setSelectedProduct: (p: PODProduct | null) => void;
  editingProduct: PODProduct | null; setEditingProduct: (p: PODProduct | null) => void;
  createStep: number; setCreateStep: (n: number) => void; blueprintSearch: string; setBlueprintSearch: (s: string) => void;
  selectedCategory: string | null; setSelectedCategory: (c: string | null) => void; blueprints: PrintifyBlueprint[];
  selectedBlueprint: PrintifyBlueprint | null; setSelectedBlueprint: (b: PrintifyBlueprint | null) => void;
  providers: PrintifyProvider[]; selectedProvider: PrintifyProvider | null; setSelectedProvider: (p: PrintifyProvider | null) => void;
  variants: PrintifyVariant[]; selectedVariants: number[]; setSelectedVariants: (v: number[]) => void;
  designPreview: string | null; productTitle: string; setProductTitle: (s: string) => void;
  productDescription: string; setProductDescription: (s: string) => void; sellingPrice: number; setSellingPrice: (n: number) => void;
  baseCost: number; setBaseCost: (n: number) => void; isCreating: boolean; isFetchingBlueprints: boolean;
  isFetchingProviders: boolean; isFetchingVariants: boolean; fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fetchBlueprints: (c?: string, s?: string) => void; fetchProviders: (id: number) => void;
  fetchVariants: (bId: number, pId: number) => void; createProduct: (p: boolean) => void;
  updateProduct: (id: string, u: Partial<PODProduct>) => void; deleteProduct: (id: string) => void;
  publishProduct: (id: string) => void; resetCreateWizard: () => void; formatCurrency: (v: number) => string;
  userXP: number; canPublish: boolean;
}) {
  const { activeTab, setActiveTab, isLoading, products, stats, searchQuery, setSearchQuery, statusFilter, setStatusFilter,
    selectedProduct, setSelectedProduct, editingProduct, setEditingProduct, createStep, setCreateStep,
    blueprintSearch, setBlueprintSearch, selectedCategory, setSelectedCategory, blueprints, selectedBlueprint,
    setSelectedBlueprint, providers, selectedProvider, setSelectedProvider, variants, selectedVariants, setSelectedVariants,
    designPreview, productTitle, setProductTitle, productDescription, setProductDescription, sellingPrice, setSellingPrice,
    baseCost, setBaseCost, isCreating, isFetchingBlueprints, isFetchingProviders, isFetchingVariants, fileInputRef,
    handleFileSelect, fetchBlueprints, fetchProviders, fetchVariants, createProduct, updateProduct, deleteProduct,
    publishProduct, resetCreateWizard, formatCurrency, userXP, canPublish } = props;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Store className="text-purple-400" />Minha Loja POD</h1>
          <p className="text-gray-400 text-sm">Crie produtos personalizados com Printify</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={cn("border-gray-700", canPublish ? "text-green-400" : "text-yellow-400")}>
            <Trophy size={14} className="mr-1" />{userXP} XP {!canPublish && `/ ${MIN_XP_TO_PUBLISH}`}
          </Badge>
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => { setActiveTab("create"); resetCreateWizard(); }}>
            <Plus size={16} className="mr-2" />Criar Produto
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-800 pb-2">
        <Button variant="ghost" size="sm" className={cn("rounded-none border-b-2", activeTab === "products" ? "border-purple-500 text-purple-400" : "border-transparent text-gray-400")} onClick={() => setActiveTab("products")}>
          <Package size={16} className="mr-2" />Meus Produtos
        </Button>
        <Button variant="ghost" size="sm" className={cn("rounded-none border-b-2", activeTab === "create" ? "border-purple-500 text-purple-400" : "border-transparent text-gray-400")} onClick={() => { setActiveTab("create"); if (blueprints.length === 0) fetchBlueprints(); }}>
          <Sparkles size={16} className="mr-2" />Criar Novo
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "products" && (
          <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30 p-4">
                <div className="flex items-center gap-3"><Package className="text-purple-400" size={24} /><div><p className="text-2xl font-bold">{stats?.total || 0}</p><p className="text-xs text-gray-400">Produtos</p></div></div>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30 p-4">
                <div className="flex items-center gap-3"><CheckCircle className="text-green-400" size={24} /><div><p className="text-2xl font-bold">{stats?.active || 0}</p><p className="text-xs text-gray-400">Ativos</p></div></div>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30 p-4">
                <div className="flex items-center gap-3"><ShoppingBag className="text-blue-400" size={24} /><div><p className="text-2xl font-bold">{stats?.totalSales || 0}</p><p className="text-xs text-gray-400">Vendas</p></div></div>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30 p-4">
                <div className="flex items-center gap-3"><DollarSign className="text-yellow-400" size={24} /><div><p className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</p><p className="text-xs text-gray-400">Receita</p></div></div>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><Input placeholder="Buscar..." className="pl-10 bg-white/5 border-gray-700" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-white/5 border-gray-700"><Filter size={16} className="mr-2" /><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800 text-white">
                  <SelectItem value="all">Todos</SelectItem><SelectItem value="draft">Rascunhos</SelectItem><SelectItem value="active">Ativos</SelectItem><SelectItem value="paused">Pausados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Products */}
            {isLoading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-purple-500" size={40} /></div>
            : products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.filter(p => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase())).map((product) => (
                  <ProductCard key={product._id} product={product} setSelectedProduct={setSelectedProduct} setEditingProduct={setEditingProduct} updateProduct={updateProduct} deleteProduct={deleteProduct} publishProduct={publishProduct} canPublish={canPublish} formatCurrency={formatCurrency} />
                ))}
              </div>
            ) : (
              <Card className="bg-white/5 border-white/10 p-12 text-center">
                <Package size={64} className="mx-auto mb-4 text-gray-600" /><h3 className="text-xl font-semibold mb-2">Nenhum produto</h3><p className="text-gray-400 mb-6">Crie seu primeiro produto!</p>
                <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => { setActiveTab("create"); fetchBlueprints(); }}><Plus size={16} className="mr-2" />Criar Produto</Button>
              </Card>
            )}
          </motion.div>
        )}

        {activeTab === "create" && (
          <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CreateWizard
              step={createStep} setStep={setCreateStep} blueprintSearch={blueprintSearch} setBlueprintSearch={setBlueprintSearch}
              selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} blueprints={blueprints}
              selectedBlueprint={selectedBlueprint} setSelectedBlueprint={setSelectedBlueprint} providers={providers}
              selectedProvider={selectedProvider} setSelectedProvider={setSelectedProvider} variants={variants}
              selectedVariants={selectedVariants} setSelectedVariants={setSelectedVariants} designPreview={designPreview}
              productTitle={productTitle} setProductTitle={setProductTitle} productDescription={productDescription}
              setProductDescription={setProductDescription} sellingPrice={sellingPrice} setSellingPrice={setSellingPrice}
              baseCost={baseCost} setBaseCost={setBaseCost} isCreating={isCreating} isFetchingBlueprints={isFetchingBlueprints}
              isFetchingProviders={isFetchingProviders} isFetchingVariants={isFetchingVariants} fileInputRef={fileInputRef}
              handleFileSelect={handleFileSelect} fetchBlueprints={fetchBlueprints} fetchProviders={fetchProviders}
              fetchVariants={fetchVariants} createProduct={createProduct} userXP={userXP} canPublish={canPublish} formatCurrency={formatCurrency}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {selectedProduct && <DetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} setEditingProduct={setEditingProduct} publishProduct={publishProduct} canPublish={canPublish} formatCurrency={formatCurrency} />}
        {editingProduct && <EditModal product={editingProduct} onClose={() => setEditingProduct(null)} updateProduct={updateProduct} />}
      </AnimatePresence>
    </>
  );
}

// Product Card Component
function ProductCard({ product, setSelectedProduct, setEditingProduct, updateProduct, deleteProduct, publishProduct, canPublish, formatCurrency }: {
  product: PODProduct; setSelectedProduct: (p: PODProduct) => void; setEditingProduct: (p: PODProduct) => void;
  updateProduct: (id: string, u: Partial<PODProduct>) => void; deleteProduct: (id: string) => void;
  publishProduct: (id: string) => void; canPublish: boolean; formatCurrency: (v: number) => string;
}) {
  const statusInfo = STATUS_CONFIG[product.status];
  const StatusIcon = statusInfo.icon;
  const CategoryIcon = CATEGORY_ICONS[product.category] || Package;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group relative">
      <Card className="bg-white/5 border-white/10 overflow-hidden hover:border-purple-500/50 transition-all">
        <div className="relative aspect-square bg-gradient-to-br from-gray-800 to-gray-900">
          {product.primaryMockup ? <img src={product.primaryMockup} alt={product.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><CategoryIcon size={48} className="text-gray-600" /></div>}
          <Badge className={cn("absolute top-2 left-2", statusInfo.color, "text-white")}><StatusIcon size={12} className="mr-1" />{statusInfo.label}</Badge>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button size="icon" variant="secondary" className="h-8 w-8"><MoreVertical size={16} /></Button></DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900 border-gray-800 text-white">
                <DropdownMenuItem onClick={() => setSelectedProduct(product)}><Eye size={14} className="mr-2" />Ver</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditingProduct(product)}><Edit size={14} className="mr-2" />Editar</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-800" />
                {product.status === "draft" && <DropdownMenuItem onClick={() => publishProduct(product._id)} className={!canPublish ? "opacity-50" : ""}><Send size={14} className="mr-2" />{canPublish ? "Publicar" : `${MIN_XP_TO_PUBLISH} XP`}</DropdownMenuItem>}
                {product.status === "active" && <DropdownMenuItem onClick={() => updateProduct(product._id, { status: "paused" })}><Pause size={14} className="mr-2" />Pausar</DropdownMenuItem>}
                {product.status === "paused" && <DropdownMenuItem onClick={() => updateProduct(product._id, { status: "active" })}><Play size={14} className="mr-2" />Reativar</DropdownMenuItem>}
                <DropdownMenuSeparator className="bg-gray-800" />
                <DropdownMenuItem onClick={() => deleteProduct(product._id)} className="text-red-400"><Trash2 size={14} className="mr-2" />Excluir</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="p-4 space-y-2">
          <h3 className="font-semibold truncate">{product.title}</h3>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-green-400">{formatCurrency(product.suggestedPrice)}</span>
            <span className="text-xs text-gray-500">Custo: {formatCurrency(product.baseCost)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-800">
            <span><Eye size={12} className="inline mr-1" />{product.views}</span>
            <span><ShoppingBag size={12} className="inline mr-1" />{product.sales}</span>
            <span><Star size={12} className="inline mr-1" />{product.rating.toFixed(1)}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// Create Wizard Component
function CreateWizard(props: {
  step: number; setStep: (n: number) => void; blueprintSearch: string; setBlueprintSearch: (s: string) => void;
  selectedCategory: string | null; setSelectedCategory: (c: string | null) => void; blueprints: PrintifyBlueprint[];
  selectedBlueprint: PrintifyBlueprint | null; setSelectedBlueprint: (b: PrintifyBlueprint | null) => void;
  providers: PrintifyProvider[]; selectedProvider: PrintifyProvider | null; setSelectedProvider: (p: PrintifyProvider | null) => void;
  variants: PrintifyVariant[]; selectedVariants: number[]; setSelectedVariants: (v: number[]) => void;
  designPreview: string | null; productTitle: string; setProductTitle: (s: string) => void;
  productDescription: string; setProductDescription: (s: string) => void; sellingPrice: number; setSellingPrice: (n: number) => void;
  baseCost: number; setBaseCost: (n: number) => void; isCreating: boolean; isFetchingBlueprints: boolean;
  isFetchingProviders: boolean; isFetchingVariants: boolean; fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void; fetchBlueprints: (c?: string, s?: string) => void;
  fetchProviders: (id: number) => void; fetchVariants: (bId: number, pId: number) => void;
  createProduct: (p: boolean) => void; userXP: number; canPublish: boolean; formatCurrency: (v: number) => string;
}) {
  const { step, setStep, blueprintSearch, setBlueprintSearch, selectedCategory, setSelectedCategory, blueprints,
    selectedBlueprint, setSelectedBlueprint, providers, selectedProvider, setSelectedProvider, variants,
    selectedVariants, setSelectedVariants, designPreview, productTitle, setProductTitle, productDescription,
    setProductDescription, sellingPrice, setSellingPrice, baseCost, setBaseCost, isCreating, isFetchingBlueprints,
    isFetchingProviders, isFetchingVariants, fileInputRef, handleFileSelect, fetchBlueprints, fetchProviders,
    fetchVariants, createProduct, userXP, canPublish, formatCurrency } = props;

  if (step === 1) {
    return (
      <div className="space-y-6">
        <div className="text-center"><h2 className="text-2xl font-bold mb-2">Escolha o Produto Base</h2><p className="text-gray-400">Selecione o tipo de produto</p></div>
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="relative w-full max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><Input placeholder="Buscar..." className="pl-10 bg-white/5 border-gray-700" value={blueprintSearch} onChange={(e) => setBlueprintSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && fetchBlueprints(selectedCategory || undefined, blueprintSearch)} /></div>
          <Button variant="outline" className="border-gray-700" onClick={() => fetchBlueprints(selectedCategory || undefined, blueprintSearch)}><Search size={16} className="mr-2" />Buscar</Button>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {BLUEPRINT_CATEGORIES.map((cat) => (<Button key={cat.key} variant={selectedCategory === cat.key ? "default" : "outline"} size="sm" className={selectedCategory === cat.key ? "bg-purple-600" : "border-gray-700"} onClick={() => { setSelectedCategory(selectedCategory === cat.key ? null : cat.key); fetchBlueprints(selectedCategory === cat.key ? undefined : cat.key); }}><cat.icon size={14} className="mr-1" />{cat.label}</Button>))}
        </div>
        {isFetchingBlueprints ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-purple-500" size={40} /></div>
        : blueprints.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {blueprints.map((bp) => (
              <Card key={bp.id} className={cn("bg-white/5 border-white/10 overflow-hidden cursor-pointer transition-all hover:scale-105", selectedBlueprint?.id === bp.id && "ring-2 ring-purple-500")} onClick={() => { setSelectedBlueprint(bp); setProductTitle(bp.title); setProductDescription(bp.description); }}>
                <div className="aspect-square bg-gray-800">{bp.images?.[0] ? <img src={bp.images[0]} alt={bp.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package size={32} className="text-gray-600" /></div>}</div>
                <div className="p-3"><h4 className="font-medium text-sm truncate">{bp.title}</h4><p className="text-xs text-gray-400">{bp.brand}</p></div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white/5 border-white/10 p-12 text-center"><Package size={48} className="mx-auto mb-4 text-gray-600" /><h3 className="text-lg font-semibold mb-2">Nenhum produto</h3><Button onClick={() => fetchBlueprints()}>Carregar Catálogo</Button></Card>
        )}
        {selectedBlueprint && <div className="flex justify-center"><Button className="bg-purple-600 hover:bg-purple-700" onClick={() => { setStep(2); fetchProviders(selectedBlueprint.id); }}>Próximo: Fornecedor<ArrowRight size={16} className="ml-2" /></Button></div>}
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setStep(1)}><ChevronLeft size={16} className="mr-2" />Voltar</Button>
        <div className="text-center"><h2 className="text-2xl font-bold mb-2">Escolha o Fornecedor</h2><p className="text-gray-400">Quem produzirá seu {selectedBlueprint?.title}</p></div>
        {isFetchingProviders ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-purple-500" size={40} /></div>
        : providers.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {providers.map((p) => (<Card key={p.id} className={cn("bg-white/5 border-white/10 p-4 cursor-pointer transition-all hover:border-purple-500/50", selectedProvider?.id === p.id && "ring-2 ring-purple-500")} onClick={() => setSelectedProvider(p)}><h4 className="font-semibold mb-2">{p.title}</h4><p className="text-sm text-gray-400 flex items-center gap-1"><Globe size={14} />{p.location?.country || "Global"}</p></Card>))}
          </div>
        ) : <Card className="bg-white/5 border-white/10 p-12 text-center"><AlertCircle size={48} className="mx-auto mb-4 text-yellow-500" /><h3 className="text-lg font-semibold">Nenhum fornecedor</h3></Card>}
        {selectedProvider && <div className="flex justify-center"><Button className="bg-purple-600 hover:bg-purple-700" onClick={() => { setStep(3); fetchVariants(selectedBlueprint!.id, selectedProvider.id); }}>Próximo: Upload<ArrowRight size={16} className="ml-2" /></Button></div>}
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setStep(2)}><ChevronLeft size={16} className="mr-2" />Voltar</Button>
        <div className="text-center"><h2 className="text-2xl font-bold mb-2">Upload do Design</h2><p className="text-gray-400">Envie sua arte</p></div>
        <div className="max-w-2xl mx-auto">
          <Card className={cn("bg-white/5 border-white/10 border-dashed p-8 text-center cursor-pointer transition-all hover:border-purple-500/50", designPreview && "border-green-500/50")} onClick={() => fileInputRef.current?.click()}>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={handleFileSelect} />
            {designPreview ? (<div className="space-y-4"><img src={designPreview} alt="Preview" className="max-h-64 mx-auto rounded-lg" /><p className="text-green-400 flex items-center justify-center gap-2"><CheckCircle size={16} />Carregado!</p></div>)
            : (<><Upload size={48} className="mx-auto mb-4 text-purple-400" /><h3 className="font-semibold mb-2">Arraste seu design</h3><p className="text-sm text-gray-400 mb-4">PNG, JPG, SVG até 50MB</p><Button className="bg-purple-600"><ImageIcon size={16} className="mr-2" />Escolher</Button></>)}
          </Card>
          {selectedBlueprint && (
            <div className="mt-6 grid md:grid-cols-2 gap-6">
              <div><h4 className="font-semibold mb-2">Preview</h4><Card className="bg-gray-800 aspect-square overflow-hidden"><img src={selectedBlueprint.images[0]} alt="Product" className="w-full h-full object-cover" /></Card></div>
              <div><h4 className="font-semibold mb-2">Variantes ({variants.length})</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {isFetchingVariants ? <Loader2 className="animate-spin mx-auto" /> : variants.slice(0, 10).map((v) => (
                    <label key={v.id} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg cursor-pointer">
                      <input type="checkbox" checked={selectedVariants.includes(v.id)} onChange={(e) => e.target.checked ? setSelectedVariants([...selectedVariants, v.id]) : setSelectedVariants(selectedVariants.filter(id => id !== v.id))} className="rounded" />
                      <span className="text-sm">{v.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        {designPreview && selectedVariants.length > 0 && <div className="flex justify-center"><Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setStep(4)}>Próximo: Preço<ArrowRight size={16} className="ml-2" /></Button></div>}
      </div>
    );
  }

  // Step 4: Pricing
  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => setStep(3)}><ChevronLeft size={16} className="mr-2" />Voltar</Button>
      <div className="text-center"><h2 className="text-2xl font-bold mb-2">Configure Seu Produto</h2><p className="text-gray-400">Título, descrição e preço</p></div>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-4">
          <div><Label>Título</Label><Input value={productTitle} onChange={(e) => setProductTitle(e.target.value)} className="bg-white/5 border-gray-700" placeholder="Ex: Camiseta Design Exclusivo" /></div>
          <div><Label>Descrição</Label><Textarea value={productDescription} onChange={(e) => setProductDescription(e.target.value)} className="bg-white/5 border-gray-700" rows={4} /></div>
        </div>
        <Card className="bg-white/5 border-white/10 p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><DollarSign size={18} className="text-green-400" />Preços</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label>Custo Base (R$)</Label><Input type="number" value={baseCost} onChange={(e) => setBaseCost(parseFloat(e.target.value) || 0)} className="bg-white/5 border-gray-700" /></div>
            <div><Label>Preço Venda (R$)</Label><Input type="number" value={sellingPrice} onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)} className="bg-white/5 border-gray-700" /></div>
          </div>
          {sellingPrice > baseCost && <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4"><p className="text-green-400 font-semibold">Lucro: {formatCurrency(sellingPrice - baseCost)}</p><p className="text-xs text-gray-400">Margem: {((sellingPrice - baseCost) / sellingPrice * 100).toFixed(1)}%</p></div>}
        </Card>
        <Card className={cn("border p-4", canPublish ? "bg-green-500/10 border-green-500/30" : "bg-yellow-500/10 border-yellow-500/30")}>
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-full", canPublish ? "bg-green-500/20" : "bg-yellow-500/20")}>{canPublish ? <Trophy className="text-green-400" size={20} /> : <Lock className="text-yellow-400" size={20} />}</div>
            <div><h4 className="font-semibold">{canPublish ? "Pode publicar!" : "XP Necessário"}</h4><p className="text-sm text-gray-400">{canPublish ? `${userXP} XP (min: ${MIN_XP_TO_PUBLISH})` : `${userXP}/${MIN_XP_TO_PUBLISH} XP`}</p></div>
          </div>
        </Card>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" className="border-gray-700" onClick={() => createProduct(false)} disabled={isCreating}>{isCreating ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}Salvar Rascunho</Button>
          <Button className={cn("bg-purple-600 hover:bg-purple-700", !canPublish && "opacity-50")} onClick={() => createProduct(true)} disabled={isCreating || !canPublish || !productTitle || sellingPrice <= baseCost}>{isCreating ? <Loader2 className="animate-spin mr-2" size={16} /> : <Send size={16} className="mr-2" />}{canPublish ? "Publicar" : `${MIN_XP_TO_PUBLISH} XP`}</Button>
        </div>
      </div>
    </div>
  );
}

// Detail Modal
function DetailModal({ product, onClose, setEditingProduct, publishProduct, canPublish, formatCurrency }: {
  product: PODProduct; onClose: () => void; setEditingProduct: (p: PODProduct) => void;
  publishProduct: (id: string) => void; canPublish: boolean; formatCurrency: (v: number) => string;
}) {
  const statusInfo = STATUS_CONFIG[product.status];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-3xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="grid md:grid-cols-2 gap-6 p-6">
          <div className="aspect-square bg-gray-800 rounded-xl overflow-hidden">{product.primaryMockup ? <img src={product.primaryMockup} alt="" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full"><Package size={64} className="text-gray-600" /></div>}</div>
          <div className="space-y-4">
            <div className="flex items-center justify-between"><Badge className={cn(statusInfo.color, "text-white")}>{statusInfo.label}</Badge><Button variant="ghost" size="icon" onClick={onClose}><X size={20} /></Button></div>
            <h2 className="text-2xl font-bold">{product.title}</h2>
            <p className="text-gray-400">{product.description}</p>
            <div className="bg-white/5 rounded-lg p-4 space-y-2">
              <div className="flex justify-between"><span className="text-gray-400">Venda</span><span className="text-xl font-bold text-green-400">{formatCurrency(product.suggestedPrice)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Custo</span><span>{formatCurrency(product.baseCost)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Lucro</span><span className="text-purple-400">{formatCurrency(product.suggestedPrice - product.baseCost)}</span></div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <Card className="bg-white/5 p-3"><Eye size={20} className="mx-auto mb-1 text-blue-400" /><p className="font-bold">{product.views}</p><p className="text-xs text-gray-500">Views</p></Card>
              <Card className="bg-white/5 p-3"><ShoppingBag size={20} className="mx-auto mb-1 text-green-400" /><p className="font-bold">{product.sales}</p><p className="text-xs text-gray-500">Vendas</p></Card>
              <Card className="bg-white/5 p-3"><DollarSign size={20} className="mx-auto mb-1 text-yellow-400" /><p className="font-bold">{formatCurrency(product.revenue)}</p><p className="text-xs text-gray-500">Receita</p></Card>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={() => { setEditingProduct(product); onClose(); }}><Edit size={16} className="mr-2" />Editar</Button>
              {product.status === "draft" && canPublish && <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => { publishProduct(product._id); onClose(); }}><Send size={16} className="mr-2" />Publicar</Button>}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Edit Modal
function EditModal({ product, onClose, updateProduct }: { product: PODProduct; onClose: () => void; updateProduct: (id: string, u: Partial<PODProduct>) => void }) {
  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState(product.suggestedPrice);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold">Editar Produto</h2><Button variant="ghost" size="icon" onClick={onClose}><X size={20} /></Button></div>
        <div className="space-y-4">
          <div><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-white/5 border-gray-700" /></div>
          <div><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-white/5 border-gray-700" rows={3} /></div>
          <div><Label>Preço (R$)</Label><Input type="number" value={price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} className="bg-white/5 border-gray-700" /></div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1 border-gray-700" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={() => updateProduct(product._id, { title, description, suggestedPrice: price })}>Salvar</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
