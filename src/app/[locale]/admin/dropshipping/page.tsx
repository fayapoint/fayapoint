"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Globe,
  Package,
  TrendingUp,
  DollarSign,
  Clock,
  Star,
  RefreshCcw,
  Plus,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  ShoppingCart,
  Percent,
  Truck,
  BarChart3,
  Sparkles,
  Settings,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Save,
  Eye,
  Trash2,
  Import,
} from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";

interface SearchFilters {
  query: string;
  sources: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  minCommission?: number;
  maxDeliveryDays?: number;
  sortBy: "price" | "rating" | "trending" | "commission" | "delivery";
  sortOrder: "asc" | "desc";
  category?: string;
}

interface ProductResult {
  externalId: string;
  sourceSlug: string;
  sourceName: string;
  sourceUrl: string;
  name: string;
  description: string;
  shortDescription?: string;
  category: string;
  subcategory?: string;
  thumbnail: string;
  images: string[];
  originalPrice: number;
  currentPrice: number;
  originalCurrency: string;
  priceBRL: number;
  sellingPrice: number;
  profitMargin: number;
  profitAmount: number;
  shippingToBrazil: boolean;
  estimatedDeliveryDays: { min: number; max: number };
  bestShippingOption?: { method: string; cost: number };
  supplier: { name: string; rating: number; totalSales: number };
  affiliate: { hasProgram: boolean; commissionRate: number };
  rating: number;
  reviewCount: number;
  soldCount: number;
  trendingScore: number;
  demandScore: number;
  priceTrend?: "rising" | "stable" | "falling";
  extractedDetails?: { features: string[] };
  tags: string[];
  status?: string;
  _id?: string;
}

interface Source {
  _id: string;
  slug: string;
  displayName: string;
  logo: string;
  isActive: boolean;
  isPriority: boolean;
  affiliate: { available: boolean; commissionRate: number };
  shipping: { averageDeliveryDays: { min: number; max: number } };
  productCount?: number;
}

// Sample trend data
const TRENDING_PRODUCTS = [
  { keyword: "Fone Bluetooth TWS", volume: 145000, growth: 34, category: "electronics", source: "Google Trends", hot: true },
  { keyword: "Ring Light Profissional", volume: 89000, growth: 28, category: "photography", source: "Google Trends", hot: true },
  { keyword: "Smartwatch Fitness", volume: 234000, growth: 45, category: "wearables", source: "Google Trends", hot: true },
  { keyword: "Câmera de Segurança WiFi", volume: 67000, growth: 19, category: "security", source: "Google Trends", hot: false },
  { keyword: "Carregador Portátil 20000mAh", volume: 78000, growth: 23, category: "accessories", source: "Google Trends", hot: false },
  { keyword: "Mouse Gamer RGB", volume: 112000, growth: 31, category: "gaming", source: "Google Trends", hot: true },
  { keyword: "Teclado Mecânico", volume: 98000, growth: 27, category: "gaming", source: "Google Trends", hot: false },
  { keyword: "Drone com Câmera 4K", volume: 56000, growth: 42, category: "electronics", source: "Google Trends", hot: true },
  { keyword: "LED Strip RGB", volume: 134000, growth: 38, category: "home", source: "Pinterest", hot: true },
  { keyword: "Organizador de Maquiagem", volume: 89000, growth: 15, category: "beauty", source: "TikTok", hot: false },
  { keyword: "Garrafa Térmica Inteligente", volume: 45000, growth: 52, category: "lifestyle", source: "Amazon", hot: true },
  { keyword: "Mini Projetor Portátil", volume: 67000, growth: 61, category: "electronics", source: "AliExpress", hot: true },
];

const TREND_SOURCES = [
  { name: "Google Trends", icon: "🔍", color: "blue", active: true },
  { name: "Amazon Best Sellers", icon: "📦", color: "orange", active: true },
  { name: "AliExpress Hot", icon: "🔥", color: "red", active: true },
  { name: "TikTok Trending", icon: "🎵", color: "pink", active: true },
  { name: "Pinterest Trends", icon: "📌", color: "red", active: true },
  { name: "Polymarket", icon: "📊", color: "purple", active: false },
  { name: "Etsy Trending", icon: "🎨", color: "orange", active: false },
  { name: "eBay Trending", icon: "🛒", color: "blue", active: false },
];

export default function DropshippingPage() {
  const { token } = useAdmin();
  const [activeTab, setActiveTab] = useState<"search" | "trends" | "products" | "sources">("search");
  
  // Search state
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    sources: [],
    sortBy: "trending",
    sortOrder: "desc",
  });
  const [searchResults, setSearchResults] = useState<ProductResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  
  // Products state
  const [savedProducts, setSavedProducts] = useState<ProductResult[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productStats, setProductStats] = useState<{
    avgPrice: number;
    avgRating: number;
    avgCommission: number;
    totalWithAffiliate: number;
  } | null>(null);
  
  // Sources state
  const [sources, setSources] = useState<Source[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(true);
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductResult | null>(null);
  const [savingProduct, setSavingProduct] = useState<string | null>(null);

  // Fetch sources on mount
  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      setSourcesLoading(true);
      const res = await fetch("/api/admin/dropshipping/sources?withStats=true", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSources(data.sources);
      }
    } catch (error) {
      console.error("Error fetching sources:", error);
    } finally {
      setSourcesLoading(false);
    }
  };

  const fetchSavedProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      const res = await fetch("/api/admin/dropshipping/products?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSavedProducts(data.products);
        setProductStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setProductsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === "products") {
      fetchSavedProducts();
    }
  }, [activeTab, fetchSavedProducts]);

  const handleSearch = async () => {
    if (!filters.query.trim()) return;

    setIsSearching(true);
    setSearchError("");

    try {
      const res = await fetch("/api/admin/dropshipping/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...filters,
          sources: filters.sources.length > 0 ? filters.sources : undefined,
          limit: 20,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSearchResults(data.results);
        setSuggestions(data.suggestions || []);
      } else {
        setSearchError(data.error || "Search failed");
      }
    } catch (error) {
      setSearchError("Failed to perform search");
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveProduct = async (product: ProductResult) => {
    setSavingProduct(product.externalId);
    try {
      const res = await fetch("/api/admin/dropshipping/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(product),
      });

      const data = await res.json();
      if (data.success) {
        // Update the product in search results to show it's saved
        setSearchResults(prev =>
          prev.map(p =>
            p.externalId === product.externalId
              ? { ...p, _id: data.product._id, status: "pending" }
              : p
          )
        );
      }
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setSavingProduct(null);
    }
  };

  const handleImportProduct = async (productId: string) => {
    try {
      const res = await fetch("/api/admin/dropshipping/products", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: productId, action: "import" }),
      });

      const data = await res.json();
      if (data.success) {
        fetchSavedProducts();
        alert("Product imported to store successfully!");
      }
    } catch (error) {
      console.error("Error importing product:", error);
    }
  };

  const handleInitializeSources = async () => {
    try {
      const res = await fetch("/api/admin/dropshipping/sources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "initialize-defaults" }),
      });

      const data = await res.json();
      if (data.success) {
        fetchSources();
        alert(`Added ${data.added} new sources!`);
      }
    } catch (error) {
      console.error("Error initializing sources:", error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center gap-3">
            <Globe className="text-emerald-400" />
            Dropshipping AI
          </h1>
          <p className="text-gray-500 mt-1">
            Busca inteligente de produtos para dropshipping com análise de preços e afiliados
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSources}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition"
          >
            <RefreshCcw size={16} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4 overflow-x-auto scrollbar-hide">
        {[
          { id: "search", label: "Buscar", icon: Search },
          { id: "trends", label: "Tendências", icon: TrendingUp },
          { id: "products", label: "Salvos", icon: Package },
          { id: "sources", label: "Fontes", icon: Globe },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition whitespace-nowrap text-sm ${
              activeTab === tab.id
                ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <tab.icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Search Tab */}
      {activeTab === "search" && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input
                type="text"
                placeholder="Buscar produtos (ex: fone bluetooth, smartwatch, ring light)..."
                value={filters.query}
                onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-xl border transition ${
                showFilters
                  ? "bg-violet-500/20 border-violet-500/30 text-violet-400"
                  : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
              }`}
            >
              <Filter size={20} />
            </button>
            <button
              onClick={handleSearch}
              disabled={isSearching || !filters.query.trim()}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-violet-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSearching ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Sparkles size={20} />
              )}
              Buscar com AI
            </button>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                  <h3 className="font-medium text-white flex items-center gap-2">
                    <Filter size={16} />
                    Filtros Avançados
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Price Range */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Preço Mínimo (BRL)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={filters.minPrice || ""}
                        onChange={(e) => setFilters({ ...filters, minPrice: Number(e.target.value) || undefined })}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Preço Máximo (BRL)</label>
                      <input
                        type="number"
                        placeholder="1000"
                        value={filters.maxPrice || ""}
                        onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) || undefined })}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                      />
                    </div>

                    {/* Rating */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Avaliação Mínima</label>
                      <select
                        value={filters.minRating || ""}
                        onChange={(e) => setFilters({ ...filters, minRating: Number(e.target.value) || undefined })}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                      >
                        <option value="">Qualquer</option>
                        <option value="3">3+ estrelas</option>
                        <option value="4">4+ estrelas</option>
                        <option value="4.5">4.5+ estrelas</option>
                      </select>
                    </div>

                    {/* Delivery */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Entrega Máxima (dias)</label>
                      <select
                        value={filters.maxDeliveryDays || ""}
                        onChange={(e) => setFilters({ ...filters, maxDeliveryDays: Number(e.target.value) || undefined })}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                      >
                        <option value="">Qualquer</option>
                        <option value="15">Até 15 dias</option>
                        <option value="30">Até 30 dias</option>
                        <option value="45">Até 45 dias</option>
                      </select>
                    </div>

                    {/* Commission */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Comissão Mínima (%)</label>
                      <select
                        value={filters.minCommission || ""}
                        onChange={(e) => setFilters({ ...filters, minCommission: Number(e.target.value) || undefined })}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                      >
                        <option value="">Qualquer</option>
                        <option value="5">5%+</option>
                        <option value="10">10%+</option>
                        <option value="15">15%+</option>
                      </select>
                    </div>

                    {/* Sort By */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Ordenar Por</label>
                      <select
                        value={filters.sortBy}
                        onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as SearchFilters["sortBy"] })}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                      >
                        <option value="trending">Tendência</option>
                        <option value="price">Preço</option>
                        <option value="rating">Avaliação</option>
                        <option value="commission">Comissão</option>
                        <option value="delivery">Entrega</option>
                      </select>
                    </div>

                    {/* Sort Order */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Ordem</label>
                      <select
                        value={filters.sortOrder}
                        onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value as "asc" | "desc" })}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                      >
                        <option value="desc">Maior → Menor</option>
                        <option value="asc">Menor → Maior</option>
                      </select>
                    </div>
                  </div>

                  {/* Sources Filter */}
                  <div>
                    <label className="text-xs text-gray-500 mb-2 block">Fontes</label>
                    <div className="flex flex-wrap gap-2">
                      {sources.filter(s => s.isActive).map((source) => (
                        <button
                          key={source.slug}
                          onClick={() => {
                            const newSources = filters.sources.includes(source.slug)
                              ? filters.sources.filter(s => s !== source.slug)
                              : [...filters.sources, source.slug];
                            setFilters({ ...filters, sources: newSources });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition ${
                            filters.sources.includes(source.slug)
                              ? "bg-violet-500/20 border border-violet-500/30 text-violet-400"
                              : "bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10"
                          }`}
                        >
                          {source.logo && (
                            <img src={source.logo} alt="" className="w-4 h-4 rounded" />
                          )}
                          {source.displayName}
                          {filters.sources.includes(source.slug) && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">Sugestões:</span>
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setFilters({ ...filters, query: suggestion });
                    handleSearch();
                  }}
                  className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs hover:bg-violet-500/20 hover:text-violet-400 hover:border-violet-500/30 transition"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Search Error */}
          {searchError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
              <AlertCircle className="text-red-400" size={20} />
              <p className="text-red-300">{searchError}</p>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-white">
                  {searchResults.length} produtos encontrados
                </h3>
              </div>

              <div className="grid gap-4">
                {searchResults.map((product) => (
                  <ProductCard
                    key={`${product.sourceSlug}-${product.externalId}`}
                    product={product}
                    onSave={() => handleSaveProduct(product)}
                    onView={() => setSelectedProduct(product)}
                    isSaving={savingProduct === product.externalId}
                    isSaved={!!product._id}
                    formatPrice={formatPrice}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isSearching && searchResults.length === 0 && !searchError && (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 flex items-center justify-center mb-6">
                <Search size={32} className="text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Buscar Produtos para Dropshipping
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Use a busca com AI para encontrar os melhores produtos de AliExpress, Amazon, 
                Shopee e outras plataformas com envio para o Brasil.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === "trends" && (
        <div className="space-y-6">
          {/* Trend Sources */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Globe size={16} className="text-cyan-400" />
              Fontes de Tendências
            </h3>
            <div className="flex flex-wrap gap-2">
              {TREND_SOURCES.map((source) => (
                <span
                  key={source.name}
                  className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 ${
                    source.active 
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-gray-500/20 text-gray-500 border border-gray-500/30"
                  }`}
                >
                  <span>{source.icon}</span>
                  {source.name}
                  {source.active && <Check size={12} />}
                </span>
              ))}
            </div>
          </div>

          {/* Hot Trends */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles size={20} className="text-orange-400" />
                Produtos em Alta
              </h3>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-xs hover:bg-white/10 transition">
                <RefreshCcw size={14} />
                Atualizar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TRENDING_PRODUCTS.map((trend, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-violet-500/30 transition-all cursor-pointer group"
                  onClick={() => {
                    setFilters({ ...filters, query: trend.keyword });
                    setActiveTab("search");
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-white text-sm truncate group-hover:text-violet-400 transition">
                          {trend.keyword}
                        </h4>
                        {trend.hot && (
                          <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[10px] font-bold">
                            HOT
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">{trend.source}</p>
                    </div>
                    <span className={`flex items-center gap-0.5 px-2 py-1 rounded text-xs font-medium ${
                      trend.growth > 30 ? "bg-emerald-500/20 text-emerald-400" :
                      trend.growth > 15 ? "bg-amber-500/20 text-amber-400" :
                      "bg-gray-500/20 text-gray-400"
                    }`}>
                      <ArrowUpRight size={12} />
                      {trend.growth}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <BarChart3 size={12} />
                      {(trend.volume / 1000).toFixed(0)}K buscas/mês
                    </div>
                    <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-gray-400 capitalize">
                      {trend.category}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick Search Suggestions */}
          <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <h4 className="text-sm font-medium text-violet-400 mb-3 flex items-center gap-2">
              <Sparkles size={14} />
              Dicas para Encontrar Produtos Vencedores
            </h4>
            <ul className="text-xs text-gray-400 space-y-2">
              <li className="flex items-start gap-2">
                <Check size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                Busque produtos com crescimento acima de 20% - indicam demanda em alta
              </li>
              <li className="flex items-start gap-2">
                <Check size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                Prefira produtos com margem acima de 50% para cobrir custos de marketing
              </li>
              <li className="flex items-start gap-2">
                <Check size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                Combine tendências de múltiplas fontes para validar demanda real
              </li>
              <li className="flex items-start gap-2">
                <Check size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                Verifique se há programa de afiliados para renda extra por venda
              </li>
            </ul>
          </div>

          {/* Category Distribution */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-sm font-medium text-white mb-4">Categorias em Alta</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: "Eletrônicos", count: 45, color: "cyan" },
                { name: "Gaming", count: 32, color: "violet" },
                { name: "Casa", count: 28, color: "amber" },
                { name: "Lifestyle", count: 24, color: "emerald" },
              ].map((cat) => (
                <div
                  key={cat.name}
                  className={`p-3 rounded-lg border cursor-pointer hover:scale-105 transition-transform ${
                    cat.color === "cyan" ? "bg-cyan-500/10 border-cyan-500/30" :
                    cat.color === "violet" ? "bg-violet-500/10 border-violet-500/30" :
                    cat.color === "amber" ? "bg-amber-500/10 border-amber-500/30" :
                    "bg-emerald-500/10 border-emerald-500/30"
                  }`}
                  onClick={() => {
                    setFilters({ ...filters, category: cat.name.toLowerCase() });
                    setActiveTab("search");
                  }}
                >
                  <p className="font-medium text-white text-sm">{cat.name}</p>
                  <p className="text-xs text-gray-500">{cat.count} produtos</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === "products" && (
        <div className="space-y-6">
          {/* Stats */}
          {productStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                label="Preço Médio"
                value={formatPrice(productStats.avgPrice || 0)}
                icon={DollarSign}
                color="emerald"
              />
              <StatCard
                label="Avaliação Média"
                value={(productStats.avgRating || 0).toFixed(1)}
                icon={Star}
                color="amber"
              />
              <StatCard
                label="Comissão Média"
                value={`${(productStats.avgCommission || 0).toFixed(1)}%`}
                icon={Percent}
                color="violet"
              />
              <StatCard
                label="Com Afiliados"
                value={productStats.totalWithAffiliate}
                icon={TrendingUp}
                color="cyan"
              />
            </div>
          )}

          {/* Products List */}
          {productsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-violet-400" size={32} />
            </div>
          ) : savedProducts.length > 0 ? (
            <div className="space-y-4">
              {savedProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onImport={() => handleImportProduct(product._id!)}
                  onView={() => setSelectedProduct(product)}
                  showStatus
                  formatPrice={formatPrice}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Package size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                Nenhum produto salvo
              </h3>
              <p className="text-gray-500">
                Faça uma busca e salve produtos para revisão
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sources Tab */}
      {activeTab === "sources" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-white">Fontes de Produtos</h3>
            <button
              onClick={handleInitializeSources}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-400 hover:bg-violet-500/30 transition"
            >
              <Plus size={16} />
              Inicializar Padrão
            </button>
          </div>

          {sourcesLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-violet-400" size={32} />
            </div>
          ) : sources.length > 0 ? (
            <div className="grid gap-4">
              {sources.map((source) => (
                <div
                  key={source._id}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition"
                >
                  <div className="flex items-center gap-4">
                    {source.logo && (
                      <img src={source.logo} alt="" className="w-12 h-12 rounded-xl bg-white p-1" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-white">{source.displayName}</h4>
                        {source.isPriority && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            PRIORIDADE
                          </span>
                        )}
                        {!source.isActive && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-gray-500/20 text-gray-400 border border-gray-500/30">
                            INATIVO
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        {source.affiliate?.available && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Percent size={12} />
                            {source.affiliate.commissionRate}% comissão
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Truck size={12} />
                          {source.shipping?.averageDeliveryDays?.min}-{source.shipping?.averageDeliveryDays?.max} dias
                        </span>
                        <span className="flex items-center gap-1">
                          <Package size={12} />
                          {source.productCount || 0} produtos
                        </span>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${source.isActive ? "bg-emerald-500" : "bg-gray-500"}`} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Globe size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                Nenhuma fonte configurada
              </h3>
              <p className="text-gray-500 mb-4">
                Clique em &quot;Inicializar Padrão&quot; para adicionar as principais plataformas
              </p>
            </div>
          )}
        </div>
      )}

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetailModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            formatPrice={formatPrice}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Product Card Component
function ProductCard({
  product,
  onSave,
  onImport,
  onView,
  isSaving,
  isSaved,
  showStatus,
  formatPrice,
}: {
  product: ProductResult;
  onSave?: () => void;
  onImport?: () => void;
  onView: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
  showStatus?: boolean;
  formatPrice: (price: number) => string;
}) {
  const statusColors: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    imported: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition"
    >
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-800 shrink-0">
          <img
            src={product.thumbnail || "/placeholder.png"}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {product.trendingScore > 70 && (
            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-orange-500/90 text-white text-[10px] font-bold">
              HOT
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="font-medium text-white line-clamp-1">{product.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded text-xs bg-white/10 text-gray-400">
                  {product.sourceName}
                </span>
                {showStatus && product.status && (
                  <span className={`px-2 py-0.5 rounded text-xs border ${statusColors[product.status]}`}>
                    {product.status.toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={onView}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
                title="Ver detalhes"
              >
                <Eye size={18} />
              </button>
              {onSave && !isSaved && (
                <button
                  onClick={onSave}
                  disabled={isSaving}
                  className="p-2 rounded-lg hover:bg-violet-500/20 text-gray-400 hover:text-violet-400 transition disabled:opacity-50"
                  title="Salvar produto"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                </button>
              )}
              {isSaved && (
                <span className="p-2 text-emerald-400">
                  <Check size={18} />
                </span>
              )}
              {onImport && product.status !== "imported" && (
                <button
                  onClick={onImport}
                  className="p-2 rounded-lg hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-400 transition"
                  title="Importar para loja"
                >
                  <Import size={18} />
                </button>
              )}
              <a
                href={product.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
                title="Ver no site"
              >
                <ExternalLink size={18} />
              </a>
            </div>
          </div>

          {/* Metrics */}
          <div className="flex items-center gap-4 mt-3 text-sm">
            {/* Price */}
            <div>
              <span className="text-gray-500">Venda:</span>
              <span className="ml-1 font-semibold text-emerald-400">{formatPrice(product.sellingPrice)}</span>
            </div>

            {/* Profit */}
            <div>
              <span className="text-gray-500">Lucro:</span>
              <span className="ml-1 text-violet-400">{formatPrice(product.profitAmount)}</span>
              <span className="text-gray-600 text-xs ml-1">({product.profitMargin}%)</span>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1">
              <Star size={14} className="text-amber-400 fill-amber-400" />
              <span className="text-white">{product.rating.toFixed(1)}</span>
              <span className="text-gray-600 text-xs">({product.reviewCount})</span>
            </div>

            {/* Delivery */}
            <div className="flex items-center gap-1">
              <Truck size={14} className="text-gray-400" />
              <span className="text-gray-400">
                {product.estimatedDeliveryDays.min}-{product.estimatedDeliveryDays.max}d
              </span>
            </div>

            {/* Affiliate */}
            {product.affiliate?.hasProgram && (
              <div className="flex items-center gap-1">
                <Percent size={14} className="text-cyan-400" />
                <span className="text-cyan-400">{product.affiliate.commissionRate}%</span>
              </div>
            )}

            {/* Trending */}
            <div className="flex items-center gap-1">
              <TrendingUp size={14} className="text-orange-400" />
              <span className="text-orange-400">{product.trendingScore}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: "emerald" | "amber" | "violet" | "cyan";
}) {
  const colors = {
    emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400",
    amber: "from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400",
    violet: "from-violet-500/20 to-violet-500/5 border-violet-500/30 text-violet-400",
    cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400",
  };

  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br ${colors[color]} border`}>
      <div className="flex items-center gap-3">
        <Icon size={20} />
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-lg font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

// Product Detail Modal
function ProductDetailModal({
  product,
  onClose,
  formatPrice,
}: {
  product: ProductResult;
  onClose: () => void;
  formatPrice: (price: number) => string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-gray-900 border border-white/10"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 p-4 bg-gray-900 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Detalhes do Produto</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Images */}
          <div className="flex gap-4">
            <img
              src={product.thumbnail}
              alt={product.name}
              className="w-40 h-40 rounded-xl object-cover bg-gray-800"
            />
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2">{product.name}</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-1 rounded bg-white/10 text-gray-400 text-sm">
                  {product.sourceName}
                </span>
                <span className="px-2 py-1 rounded bg-white/10 text-gray-400 text-sm">
                  {product.category}
                </span>
              </div>
              <a
                href={product.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:underline text-sm flex items-center gap-1"
              >
                Ver produto original
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          {/* Pricing */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-sm font-medium text-gray-400 mb-3">Precificação</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Custo Original</p>
                <p className="text-lg font-bold text-white">
                  {product.originalCurrency} {product.currentPrice.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">{formatPrice(product.priceBRL)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Preço de Venda</p>
                <p className="text-lg font-bold text-emerald-400">{formatPrice(product.sellingPrice)}</p>
                <p className="text-sm text-gray-500">c/ {product.profitMargin}% margem</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Lucro por Unidade</p>
                <p className="text-lg font-bold text-violet-400">{formatPrice(product.profitAmount)}</p>
              </div>
            </div>
          </div>

          {/* Shipping & Delivery */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-sm font-medium text-gray-400 mb-3">Entrega</h4>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Truck size={20} className="text-cyan-400" />
                <div>
                  <p className="text-white font-medium">
                    {product.estimatedDeliveryDays.min}-{product.estimatedDeliveryDays.max} dias
                  </p>
                  <p className="text-xs text-gray-500">Prazo estimado para Brasil</p>
                </div>
              </div>
              {product.bestShippingOption && (
                <div>
                  <p className="text-white font-medium">{product.bestShippingOption.method}</p>
                  <p className="text-xs text-gray-500">
                    Frete: {formatPrice(product.bestShippingOption.cost)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Supplier */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-sm font-medium text-gray-400 mb-3">Fornecedor</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Nome</p>
                <p className="text-white">{product.supplier?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Avaliação</p>
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span className="text-white">{product.rating.toFixed(1)}</span>
                  <span className="text-gray-500">({product.reviewCount} avaliações)</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Vendas</p>
                <p className="text-white">{product.soldCount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Score de Tendência</p>
                <p className="text-orange-400 font-bold">{product.trendingScore}/100</p>
              </div>
            </div>
          </div>

          {/* Affiliate */}
          {product.affiliate?.hasProgram && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <h4 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
                <Percent size={16} />
                Programa de Afiliados Disponível
              </h4>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-gray-500">Comissão</p>
                  <p className="text-lg font-bold text-white">{product.affiliate.commissionRate}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ganho por Venda</p>
                  <p className="text-lg font-bold text-emerald-400">
                    {formatPrice((product.sellingPrice * product.affiliate.commissionRate) / 100)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Features */}
          {product.extractedDetails?.features && product.extractedDetails.features.length > 0 && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Características</h4>
              <ul className="space-y-1">
                {product.extractedDetails.features.map((feature, i) => (
                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                    <Check size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Description */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-sm font-medium text-gray-400 mb-3">Descrição</h4>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{product.description}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
