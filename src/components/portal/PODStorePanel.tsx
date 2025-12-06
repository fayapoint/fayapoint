"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  ExternalLink,
  Package,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Sparkles,
  Shirt,
  Home,
  Frame,
  Coffee,
  Smartphone,
  BookOpen,
  Gem,
  Dog,
  Watch,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Settings,
  Globe,
  Loader2,
  X,
  Info,
  Star,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

// Category icons mapping
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  apparel: Shirt,
  accessories: Watch,
  home: Home,
  wallArt: Frame,
  drinkware: Coffee,
  tech: Smartphone,
  stationery: BookOpen,
  jewelry: Gem,
  pet: Dog,
};

// Status configuration
const STATUS_CONFIG = {
  draft: { label: "Rascunho", color: "bg-gray-500", icon: Edit },
  pending_review: { label: "Em Revisão", color: "bg-yellow-500", icon: Clock },
  active: { label: "Ativo", color: "bg-green-500", icon: CheckCircle },
  paused: { label: "Pausado", color: "bg-orange-500", icon: Pause },
  rejected: { label: "Rejeitado", color: "bg-red-500", icon: AlertCircle },
  archived: { label: "Arquivado", color: "bg-gray-400", icon: Package },
};

interface PODProduct {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  subcategory?: string;
  tags: string[];
  primaryMockup?: string;
  mockupImages: string[];
  templateName: string;
  baseCost: number;
  suggestedPrice: number;
  variants: {
    id: string;
    name: string;
    sellingPrice: number;
    profit: number;
    isActive: boolean;
  }[];
  status: keyof typeof STATUS_CONFIG;
  isPublished: boolean;
  publishedAt?: string;
  views: number;
  sales: number;
  revenue: number;
  rating: number;
  providers: {
    providerSlug: string;
    syncStatus: string;
  }[];
  createdAt: string;
}

interface PODProvider {
  _id: string;
  slug: string;
  name: string;
  displayName: string;
  description: string;
  logo: string;
  specialization: string;
  productCount: number;
  integrationStatus: string;
  productCategories: string[];
  shipping: {
    shipsToBrazil: boolean;
    averageDeliveryDays: {
      brazil?: { min: number; max: number };
      international: { min: number; max: number };
    };
  };
  capabilities: {
    mockupGenerator: boolean;
    customBranding: boolean;
  };
  qualityScore: number;
  profitMarginSuggested: number;
  isPremium: boolean;
  documentationUrl?: string;
}

interface Stats {
  total: number;
  draft: number;
  active: number;
  paused: number;
  totalSales: number;
  totalRevenue: number;
}

interface PODStorePanelProps {
  isCompact?: boolean;
}

export function PODStorePanel({ isCompact = false }: PODStorePanelProps) {
  const [activeTab, setActiveTab] = useState<"products" | "providers" | "create">("products");
  const [products, setProducts] = useState<PODProduct[]>([]);
  const [providers, setProviders] = useState<PODProvider[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<PODProduct | null>(null);

  // Fetch products
  useEffect(() => {
    if (activeTab === "products") {
      fetchProducts();
    } else if (activeTab === "providers") {
      fetchProviders();
    }
  }, [activeTab, statusFilter, categoryFilter]);

  const fetchProducts = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("fayapoint_token");
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);

      const res = await fetch(`/api/pod/products?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Erro ao carregar produtos");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProviders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/pod/providers?shipsToBrazil=true");
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers);
      } else {
        // Initialize providers if empty
        await fetch("/api/pod/providers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "initialize" }),
        });
        // Fetch again
        const res2 = await fetch("/api/pod/providers?shipsToBrazil=true");
        if (res2.ok) {
          const data = await res2.json();
          setProviders(data.providers);
        }
      }
    } catch (error) {
      console.error("Error fetching providers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProductStatus = async (productId: string, status: string) => {
    const token = localStorage.getItem("fayapoint_token");
    try {
      const res = await fetch("/api/pod/products", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, status }),
      });
      if (res.ok) {
        toast.success("Status atualizado");
        fetchProducts();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    
    const token = localStorage.getItem("fayapoint_token");
    try {
      const res = await fetch(`/api/pod/products?productId=${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Produto excluído");
        fetchProducts();
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Erro ao excluir produto");
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  // Stats Cards
  const StatsCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/30 rounded-lg">
            <Package size={20} className="text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats?.total || 0}</p>
            <p className="text-xs text-gray-400">Produtos</p>
          </div>
        </div>
      </Card>
      <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/30 rounded-lg">
            <CheckCircle size={20} className="text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats?.active || 0}</p>
            <p className="text-xs text-gray-400">Ativos</p>
          </div>
        </div>
      </Card>
      <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/30 rounded-lg">
            <ShoppingBag size={20} className="text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats?.totalSales || 0}</p>
            <p className="text-xs text-gray-400">Vendas</p>
          </div>
        </div>
      </Card>
      <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500/30 rounded-lg">
            <DollarSign size={20} className="text-yellow-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</p>
            <p className="text-xs text-gray-400">Receita</p>
          </div>
        </div>
      </Card>
    </div>
  );

  // Product Card
  const ProductCard = ({ product }: { product: PODProduct }) => {
    const statusInfo = STATUS_CONFIG[product.status];
    const StatusIcon = statusInfo.icon;
    const CategoryIcon = CATEGORY_ICONS[product.category] || Package;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative"
      >
        <Card className="bg-white/5 border-white/10 overflow-hidden hover:border-purple-500/50 transition-all">
          {/* Image */}
          <div className="relative aspect-square bg-gradient-to-br from-gray-800 to-gray-900">
            {product.primaryMockup ? (
              <img
                src={product.primaryMockup}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <CategoryIcon size={48} className="text-gray-600" />
              </div>
            )}
            
            {/* Status Badge */}
            <Badge className={cn("absolute top-2 left-2", statusInfo.color, "text-white")}>
              <StatusIcon size={12} className="mr-1" />
              {statusInfo.label}
            </Badge>

            {/* Quick Actions */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="secondary" className="h-8 w-8">
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-900 border-gray-800 text-white">
                  <DropdownMenuItem onClick={() => setSelectedProduct(product)}>
                    <Eye size={14} className="mr-2" /> Ver Detalhes
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit size={14} className="mr-2" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-800" />
                  {product.status === "active" ? (
                    <DropdownMenuItem onClick={() => updateProductStatus(product._id, "paused")}>
                      <Pause size={14} className="mr-2" /> Pausar
                    </DropdownMenuItem>
                  ) : product.status === "paused" || product.status === "draft" ? (
                    <DropdownMenuItem onClick={() => updateProductStatus(product._id, "active")}>
                      <Play size={14} className="mr-2" /> Ativar
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator className="bg-gray-800" />
                  <DropdownMenuItem 
                    onClick={() => deleteProduct(product._id)}
                    className="text-red-400 focus:text-red-400"
                  >
                    <Trash2 size={14} className="mr-2" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Info */}
          <div className="p-4 space-y-3">
            <div>
              <h3 className="font-semibold truncate">{product.title}</h3>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <CategoryIcon size={12} />
                {product.templateName}
              </p>
            </div>

            {/* Price & Profit */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-green-400">
                  {formatCurrency(product.suggestedPrice)}
                </p>
                <p className="text-xs text-gray-500">
                  Custo: {formatCurrency(product.baseCost)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-purple-400">
                  +{formatCurrency(product.suggestedPrice - product.baseCost)}
                </p>
                <p className="text-xs text-gray-500">Lucro</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-800">
              <span className="flex items-center gap-1">
                <Eye size={12} /> {product.views}
              </span>
              <span className="flex items-center gap-1">
                <ShoppingBag size={12} /> {product.sales}
              </span>
              <span className="flex items-center gap-1">
                <Star size={12} /> {product.rating.toFixed(1)}
              </span>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  // Provider Card
  const ProviderCard = ({ provider }: { provider: PODProvider }) => {
    const isActive = provider.integrationStatus === "active";
    const isComingSoon = provider.integrationStatus === "coming_soon";

    return (
      <Card className={cn(
        "bg-white/5 border-white/10 p-5 hover:border-purple-500/50 transition-all relative overflow-hidden",
        isComingSoon && "opacity-70"
      )}>
        {provider.isPremium && (
          <Badge className="absolute top-3 right-3 bg-gradient-to-r from-yellow-500 to-orange-500">
            <Zap size={12} className="mr-1" /> Premium
          </Badge>
        )}

        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
            {provider.logo ? (
              <img src={provider.logo} alt={provider.name} className="w-12 h-12 object-contain" />
            ) : (
              <Store size={24} className="text-gray-400" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg">{provider.displayName}</h3>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  isActive ? "border-green-500/50 text-green-400" : 
                  isComingSoon ? "border-yellow-500/50 text-yellow-400" : 
                  "border-gray-500/50 text-gray-400"
                )}
              >
                {isActive ? "Ativo" : isComingSoon ? "Em Breve" : "Testando"}
              </Badge>
            </div>
            <p className="text-sm text-gray-400 line-clamp-2 mb-3">
              {provider.description}
            </p>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-gray-500">Produtos</p>
                <p className="font-semibold">{provider.productCount}+</p>
              </div>
              <div>
                <p className="text-gray-500">Qualidade</p>
                <p className="font-semibold text-green-400">{provider.qualityScore}%</p>
              </div>
              <div>
                <p className="text-gray-500">Margem</p>
                <p className="font-semibold text-purple-400">{provider.profitMarginSuggested}%</p>
              </div>
            </div>

            {/* Shipping to Brazil */}
            {provider.shipping?.shipsToBrazil && (
              <div className="flex items-center gap-2 mt-3 text-xs text-green-400">
                <Globe size={14} />
                <span>
                  Entrega Brasil: {provider.shipping.averageDeliveryDays.brazil?.min || 15}-
                  {provider.shipping.averageDeliveryDays.brazil?.max || 35} dias
                </span>
              </div>
            )}

            {/* Categories */}
            <div className="flex flex-wrap gap-1 mt-3">
              {provider.productCategories.slice(0, 4).map((cat) => (
                <Badge key={cat} variant="outline" className="text-xs border-gray-700">
                  {cat}
                </Badge>
              ))}
              {provider.productCategories.length > 4 && (
                <Badge variant="outline" className="text-xs border-gray-700">
                  +{provider.productCategories.length - 4}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-800">
          {isActive ? (
            <>
              <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700">
                <Plus size={14} className="mr-1" /> Criar Produto
              </Button>
              <Button size="sm" variant="outline" className="border-gray-700">
                <Settings size={14} />
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" className="flex-1 border-gray-700" disabled={isComingSoon}>
              {isComingSoon ? "Em Breve" : "Configurar"}
            </Button>
          )}
          {provider.documentationUrl && (
            <Button size="sm" variant="ghost" asChild>
              <a href={provider.documentationUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} />
              </a>
            </Button>
          )}
        </div>
      </Card>
    );
  };

  // Create Product Tab
  const CreateProductSection = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles size={40} className="text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Crie Seu Produto Personalizado</h2>
        <p className="text-gray-400">
          Escolha um fornecedor, faça upload do seu design e comece a vender em minutos
        </p>
      </div>

      {/* Steps */}
      <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <Card className="bg-white/5 border-white/10 p-6 text-center">
          <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-xl font-bold text-purple-400">1</span>
          </div>
          <h3 className="font-semibold mb-2">Escolha o Produto</h3>
          <p className="text-sm text-gray-400">
            Selecione entre centenas de produtos como camisetas, canecas, posters e muito mais
          </p>
        </Card>

        <Card className="bg-white/5 border-white/10 p-6 text-center">
          <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-xl font-bold text-pink-400">2</span>
          </div>
          <h3 className="font-semibold mb-2">Upload do Design</h3>
          <p className="text-sm text-gray-400">
            Envie sua arte e veja a prévia em tempo real com nosso gerador de mockups
          </p>
        </Card>

        <Card className="bg-white/5 border-white/10 p-6 text-center">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-xl font-bold text-green-400">3</span>
          </div>
          <h3 className="font-semibold mb-2">Comece a Vender</h3>
          <p className="text-sm text-gray-400">
            Defina seu preço e publique. Nós cuidamos da produção e entrega
          </p>
        </Card>
      </div>

      {/* Provider Selection */}
      <div className="max-w-4xl mx-auto">
        <h3 className="text-lg font-semibold mb-4">Escolha um Fornecedor para Começar</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {providers.filter(p => p.integrationStatus === "active").slice(0, 4).map((provider) => (
            <Card 
              key={provider._id}
              className="bg-white/5 border-white/10 p-4 hover:border-purple-500/50 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
                  {provider.logo ? (
                    <img src={provider.logo} alt={provider.name} className="w-8 h-8 object-contain" />
                  ) : (
                    <Store size={20} className="text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{provider.displayName}</h4>
                  <p className="text-xs text-gray-400">{provider.productCount}+ produtos</p>
                </div>
                <ChevronRight size={20} className="text-gray-500" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Upload Area */}
      <Card className="max-w-2xl mx-auto bg-white/5 border-white/10 border-dashed p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
            <Upload size={32} className="text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Arraste seu design aqui</h3>
            <p className="text-sm text-gray-400 mb-4">
              ou clique para fazer upload (PNG, JPG, SVG até 50MB)
            </p>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <ImageIcon size={16} className="mr-2" />
            Escolher Arquivo
          </Button>
        </div>
      </Card>
    </div>
  );

  // Product Detail Modal
  const ProductDetailModal = () => {
    if (!selectedProduct) return null;
    const statusInfo = STATUS_CONFIG[selectedProduct.status];

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={() => setSelectedProduct(null)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative max-w-4xl w-full max-h-[90vh] overflow-auto bg-gray-900 rounded-2xl border border-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setSelectedProduct(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center z-10"
          >
            <X size={20} />
          </button>

          <div className="grid md:grid-cols-2 gap-6 p-6">
            {/* Images */}
            <div>
              <div className="aspect-square bg-gray-800 rounded-xl overflow-hidden mb-4">
                {selectedProduct.primaryMockup ? (
                  <img
                    src={selectedProduct.primaryMockup}
                    alt={selectedProduct.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={64} className="text-gray-600" />
                  </div>
                )}
              </div>
              {selectedProduct.mockupImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {selectedProduct.mockupImages.map((img, idx) => (
                    <div key={idx} className="w-16 h-16 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="space-y-4">
              <div>
                <Badge className={cn(statusInfo.color, "text-white mb-2")}>
                  {statusInfo.label}
                </Badge>
                <h2 className="text-2xl font-bold">{selectedProduct.title}</h2>
                <p className="text-gray-400 text-sm mt-1">{selectedProduct.templateName}</p>
              </div>

              {/* Pricing */}
              <Card className="bg-green-500/10 border-green-500/30 p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Preço de Venda</span>
                  <span className="text-2xl font-bold text-green-400">
                    {formatCurrency(selectedProduct.suggestedPrice)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Custo Base</span>
                  <span>{formatCurrency(selectedProduct.baseCost)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Seu Lucro</span>
                  <span className="text-purple-400 font-semibold">
                    {formatCurrency(selectedProduct.suggestedPrice - selectedProduct.baseCost)}
                  </span>
                </div>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="bg-white/5 border-white/10 p-3 text-center">
                  <Eye size={20} className="mx-auto mb-1 text-blue-400" />
                  <p className="text-lg font-bold">{selectedProduct.views}</p>
                  <p className="text-xs text-gray-500">Visualizações</p>
                </Card>
                <Card className="bg-white/5 border-white/10 p-3 text-center">
                  <ShoppingBag size={20} className="mx-auto mb-1 text-green-400" />
                  <p className="text-lg font-bold">{selectedProduct.sales}</p>
                  <p className="text-xs text-gray-500">Vendas</p>
                </Card>
                <Card className="bg-white/5 border-white/10 p-3 text-center">
                  <DollarSign size={20} className="mx-auto mb-1 text-yellow-400" />
                  <p className="text-lg font-bold">{formatCurrency(selectedProduct.revenue)}</p>
                  <p className="text-xs text-gray-500">Receita</p>
                </Card>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-sm text-gray-400">{selectedProduct.description}</p>
              </div>

              {/* Variants */}
              {selectedProduct.variants.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Variantes ({selectedProduct.variants.length})</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedProduct.variants.map((variant) => (
                      <div 
                        key={variant.id}
                        className="flex items-center justify-between p-2 bg-white/5 rounded-lg text-sm"
                      >
                        <span>{variant.name}</span>
                        <span className="text-green-400">{formatCurrency(variant.sellingPrice)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-800">
                <Button className="flex-1 bg-purple-600 hover:bg-purple-700">
                  <Edit size={16} className="mr-2" /> Editar Produto
                </Button>
                {selectedProduct.status === "active" ? (
                  <Button 
                    variant="outline" 
                    className="border-orange-500/50 text-orange-400"
                    onClick={() => {
                      updateProductStatus(selectedProduct._id, "paused");
                      setSelectedProduct(null);
                    }}
                  >
                    <Pause size={16} className="mr-2" /> Pausar
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="border-green-500/50 text-green-400"
                    onClick={() => {
                      updateProductStatus(selectedProduct._id, "active");
                      setSelectedProduct(null);
                    }}
                  >
                    <Play size={16} className="mr-2" /> Ativar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Store className="text-purple-400" />
            Minha Loja POD
          </h1>
          <p className="text-gray-400 text-sm">
            Crie e venda produtos personalizados - nós cuidamos da produção e entrega
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            variant={activeTab === "create" ? "default" : "outline"}
            onClick={() => setActiveTab("create")}
            className={activeTab === "create" ? "bg-purple-600 hover:bg-purple-700" : "border-gray-700"}
          >
            <Plus size={16} className="mr-2" />
            Criar Produto
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-800 pb-2">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-none border-b-2 transition-all",
            activeTab === "products" 
              ? "border-purple-500 text-purple-400" 
              : "border-transparent text-gray-400 hover:text-white"
          )}
          onClick={() => setActiveTab("products")}
        >
          <Package size={16} className="mr-2" />
          Meus Produtos
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-none border-b-2 transition-all",
            activeTab === "providers" 
              ? "border-purple-500 text-purple-400" 
              : "border-transparent text-gray-400 hover:text-white"
          )}
          onClick={() => setActiveTab("providers")}
        >
          <Globe size={16} className="mr-2" />
          Fornecedores
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-none border-b-2 transition-all",
            activeTab === "create" 
              ? "border-purple-500 text-purple-400" 
              : "border-transparent text-gray-400 hover:text-white"
          )}
          onClick={() => setActiveTab("create")}
        >
          <Sparkles size={16} className="mr-2" />
          Criar Novo
        </Button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === "products" && (
          <motion.div
            key="products"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <StatsCards />

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Buscar produtos..."
                  className="pl-10 bg-white/5 border-gray-700"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-white/5 border-gray-700">
                  <Filter size={16} className="mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800 text-white">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="draft">Rascunhos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="paused">Pausados</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40 bg-white/5 border-gray-700">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800 text-white">
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="apparel">Vestuário</SelectItem>
                  <SelectItem value="wallArt">Arte de Parede</SelectItem>
                  <SelectItem value="drinkware">Drinkware</SelectItem>
                  <SelectItem value="accessories">Acessórios</SelectItem>
                  <SelectItem value="jewelry">Joias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-purple-500" size={40} />
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            ) : (
              <Card className="bg-white/5 border-white/10 p-12 text-center">
                <Package size={64} className="mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-semibold mb-2">Nenhum produto ainda</h3>
                <p className="text-gray-400 mb-6">
                  Crie seu primeiro produto e comece a vender hoje mesmo!
                </p>
                <Button 
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => setActiveTab("create")}
                >
                  <Plus size={16} className="mr-2" />
                  Criar Primeiro Produto
                </Button>
              </Card>
            )}
          </motion.div>
        )}

        {activeTab === "providers" && (
          <motion.div
            key="providers"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Info Banner */}
            <Card className="bg-blue-500/10 border-blue-500/30 p-4">
              <div className="flex items-start gap-3">
                <Info size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-400">Como funciona?</h3>
                  <p className="text-sm text-gray-300">
                    Nossos parceiros POD cuidam de toda a produção e entrega. Você só precisa criar o design, 
                    escolher os produtos e definir seu preço. O lucro é 100% seu!
                  </p>
                </div>
              </div>
            </Card>

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-purple-500" size={40} />
              </div>
            ) : providers.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {providers.map((provider) => (
                  <ProviderCard key={provider._id} provider={provider} />
                ))}
              </div>
            ) : (
              <Card className="bg-white/5 border-white/10 p-12 text-center">
                <Globe size={64} className="mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-semibold mb-2">Carregando fornecedores...</h3>
                <Button onClick={fetchProviders}>
                  Tentar Novamente
                </Button>
              </Card>
            )}
          </motion.div>
        )}

        {activeTab === "create" && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <CreateProductSection />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && <ProductDetailModal />}
      </AnimatePresence>
    </div>
  );
}
