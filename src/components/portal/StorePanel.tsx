"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Grid,
  LayoutGrid,
  Boxes,
  List,
  ChevronRight,
  Star,
  ShoppingCart,
  Plus,
  Minus,
  Heart,
  Percent,
  Package,
  ExternalLink,
  Shield,
  Truck,
  Tag,
  Info,
  Award,
  Clock,
  Sparkles,
  Loader2,
  X,
  Monitor,
  Cpu,
  Mouse,
  HardDrive,
  Wifi,
  Code,
  SlidersHorizontal,
  Check,
  ArrowUpDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useServiceCart } from "@/contexts/ServiceCartContext";
import { toast } from "react-hot-toast";

// Category icons mapping
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  computers: Monitor,
  components: Cpu,
  peripherals: Mouse,
  monitors: Monitor,
  accessories: Package,
  software: Code,
  networking: Wifi,
  storage: HardDrive,
};

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
  stock: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  tags: string[];
  rating: number;
  reviewCount: number;
  soldCount: number;
  warranty: string;
  externalUrl?: string;
  specifications: { key: string; value: string }[];
}

interface CategoryData {
  name: string;
  icon: string;
  subcategories: string[];
}

interface FiltersState {
  categories: Record<string, CategoryData>;
  categoryCounts: Record<string, number>;
  brands: string[];
}

interface StorePanelProps {
  isCompact?: boolean;
}

export function StorePanel({ isCompact = false }: StorePanelProps) {
  const { addItem, items } = useServiceCart();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [featuredData, setFeaturedData] = useState<{
    featured: StoreProduct[];
    newArrivals: StoreProduct[];
    bestSellers: StoreProduct[];
    deals: StoreProduct[];
  } | null>(null);
  const [filters, setFilters] = useState<FiltersState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("createdAt");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [currentSection, setCurrentSection] = useState<"home" | "products">("home");

  // Fetch featured data on mount
  useEffect(() => {
    fetchFeatured();
    fetchProducts();
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    if (currentSection === "products") {
      fetchProducts();
    }
  }, [selectedCategory, selectedSubcategory, selectedBrand, sortBy, searchQuery, currentSection]);

  const fetchFeatured = async () => {
    try {
      const res = await fetch("/api/store/featured");
      if (res.ok) {
        const data = await res.json();
        setFeaturedData(data);
      }
    } catch (error) {
      console.error("Error fetching featured:", error);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedSubcategory) params.set("subcategory", selectedSubcategory);
      if (selectedBrand) params.set("brand", selectedBrand);
      if (searchQuery) params.set("search", searchQuery);
      params.set("sort", sortBy);
      params.set("limit", "50");

      const res = await fetch(`/api/store/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setFilters(data.filters);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (product: StoreProduct) => {
    addItem({
      id: `store-${product._id}`,
      type: "service" as const,
      name: product.name,
      quantity: 1,
      price: product.price,
      image: product.thumbnail,
    });
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  const isInCart = (productId: string) => {
    return !!items[`store-${productId}`];
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  // Product Card Component with Glassmorphism
  const ProductCard = ({ product, compact = false }: { product: StoreProduct; compact?: boolean }) => (
    <div
      className={cn(
        "group relative cursor-pointer",
        compact ? "flex flex-row" : ""
      )}
      onClick={() => setSelectedProduct(product)}
    >
      {/* Glass Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl border border-border rounded-2xl transition-all duration-300 group-hover:border-amber-500/50 group-hover:shadow-xl group-hover:shadow-amber-500/10" />
      
      <div className={cn("relative p-3", compact ? "flex flex-row gap-3" : "")}>
        <div className={cn(
          "relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/50 to-card/50",
          compact ? "w-24 h-24 flex-shrink-0" : "aspect-square mb-3"
        )}>
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package size={compact ? 24 : 48} className="text-gray-600" />
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.discount > 0 && (
              <Badge className="bg-red-500/90 backdrop-blur text-white text-xs">
                -{product.discount}%
              </Badge>
            )}
            {product.isNewArrival && (
              <Badge className="bg-green-500/90 backdrop-blur text-white text-xs">
                Novo
              </Badge>
            )}
            {product.isFeatured && (
              <Badge className="bg-amber-500/90 backdrop-blur text-white text-xs">
                Destaque
              </Badge>
            )}
          </div>

          {/* Quick add button */}
          {!compact && (
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                className={cn(
                  "rounded-full",
                  isInCart(product._id) 
                    ? "bg-green-500 hover:bg-green-600" 
                    : "bg-amber-600 hover:bg-amber-700"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(product);
                }}
              >
                {isInCart(product._id) ? (
                  <Check size={16} />
                ) : (
                  <ShoppingCart size={16} />
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className={cn(compact ? "flex-1" : "")}>
          <p className="text-xs text-amber-400 font-medium mb-1">
            {product.brand}
          </p>
          <h3 className={cn(
            "font-semibold group-hover:text-amber-400 transition line-clamp-2",
            compact ? "text-sm" : ""
          )}>
            {product.name}
          </h3>
          
          {!compact && (
            <>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {product.shortDescription}
              </p>
              
              {/* Rating */}
              {product.rating > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className={cn(
                        i < Math.round(product.rating)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-600"
                      )}
                    />
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({product.reviewCount})
                  </span>
                </div>
              )}
            </>
          )}

          {/* Price */}
          <div className="mt-3 flex items-center gap-2">
            <span className={cn(
              "font-bold text-green-400",
              compact ? "text-sm" : "text-lg"
            )}>
              {formatPrice(product.price)}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Stock */}
          {!compact && product.stock <= 5 && product.stock > 0 && (
            <p className="text-xs text-orange-400 mt-1">
              Apenas {product.stock} em estoque!
            </p>
          )}
          {!compact && product.stock === 0 && (
            <p className="text-xs text-red-400 mt-1">Esgotado</p>
          )}
        </div>
      </div>
    </div>
  );

  // Product Section Component
  const ProductSection = ({ 
    title, 
    icon: Icon, 
    products, 
    color = "purple",
    showViewAll = true,
    onViewAll
  }: { 
    title: string; 
    icon: LucideIcon; 
    products: StoreProduct[];
    color?: string;
    showViewAll?: boolean;
    onViewAll?: () => void;
  }) => (
    <div className="mb-6 md:mb-8">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 min-w-0 truncate">
          <Icon className={`text-${color}-400 shrink-0`} size={20} />
          {title}
        </h2>
        {showViewAll && onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            Ver todos <ChevronRight size={16} />
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );

  // Category Cards
  const CategoryCard = ({ 
    id, 
    name, 
    count 
  }: { 
    id: string; 
    name: string; 
    count: number;
  }) => {
    const Icon = CATEGORY_ICONS[id] || Package;
    return (
      <Card
        className="bg-secondary border-border p-3 md:p-4 hover:border-amber-500/50 transition cursor-pointer group overflow-hidden"
        onClick={() => {
          setSelectedCategory(id);
          setCurrentSection("products");
        }}
      >
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="p-2 md:p-3 bg-amber-500/20 rounded-xl group-hover:bg-amber-500/30 transition shrink-0">
            <Icon size={20} className="text-amber-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm md:text-base group-hover:text-amber-400 transition truncate">
              {name}
            </h3>
            <p className="text-xs text-muted-foreground">{count} produtos</p>
          </div>
        </div>
      </Card>
    );
  };

  // Product Detail Modal
  const ProductDetailModal = () => {
    if (!selectedProduct) return null;

    return (
      <AnimatePresence>
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
            className="relative max-w-5xl w-full max-h-[90vh] overflow-hidden rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glass Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-900/90 to-amber-900/30 backdrop-blur-2xl border border-border" />
            
            <div className="relative p-4 md:p-8 overflow-y-auto max-h-[90vh]">
              {/* Close Button */}
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition z-10"
              >
                <X size={20} />
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                {/* Image Section */}
                <div>
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-card mb-4">
                    {selectedProduct.thumbnail ? (
                      <img
                        src={selectedProduct.thumbnail}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={80} className="text-gray-600" />
                      </div>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {selectedProduct.discount > 0 && (
                        <Badge className="bg-red-500/90 backdrop-blur text-white text-sm px-3 py-1">
                          -{selectedProduct.discount}% OFF
                        </Badge>
                      )}
                      {selectedProduct.isNewArrival && (
                        <Badge className="bg-green-500/90 backdrop-blur text-white text-sm">
                          Novo
                        </Badge>
                      )}
                      {selectedProduct.isFeatured && (
                        <Badge className="bg-amber-500/90 backdrop-blur text-white text-sm">
                          Destaque
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details Section */}
                <div className="space-y-6">
                  {/* Header */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="border-amber-500/50 text-amber-400">
                        {selectedProduct.brand}
                      </Badge>
                      {selectedProduct.sku && (
                        <Badge variant="outline" className="border-border text-muted-foreground text-xs">
                          SKU: {selectedProduct.sku}
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-xl md:text-3xl font-bold text-white mb-2 line-clamp-2">{selectedProduct.name}</h2>
                    
                    {/* Rating */}
                    <div className="flex flex-wrap items-center gap-2 md:gap-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={cn(
                              i < Math.round(selectedProduct.rating)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-600"
                            )}
                          />
                        ))}
                        <span className="ml-1 text-sm text-muted-foreground">({selectedProduct.reviewCount})</span>
                      </div>
                      <span className="text-muted-foreground hidden sm:inline">|</span>
                      <span className="text-sm text-muted-foreground">{selectedProduct.soldCount} vendidos</span>
                    </div>
                  </div>

                  {/* Price Card */}
                  <div className="p-4 md:p-6 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                    {selectedProduct.originalPrice > selectedProduct.price && (
                      <p className="text-base md:text-lg text-muted-foreground line-through">
                        De: {formatPrice(selectedProduct.originalPrice)}
                      </p>
                    )}
                    <p className="text-2xl md:text-4xl font-bold text-green-400">
                      {formatPrice(selectedProduct.price)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Em até 12x de {formatPrice(selectedProduct.price / 12)} sem juros
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Descrição</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedProduct.fullDescription || selectedProduct.shortDescription}
                    </p>
                  </div>

                  {/* Specifications */}
                  {selectedProduct.specifications?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Info size={18} className="text-amber-400" />
                        Especificações Técnicas
                      </h3>
                      <div className="grid gap-2">
                        {selectedProduct.specifications.map((spec, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between gap-2 p-3 rounded-xl bg-secondary border border-border min-w-0"
                          >
                            <span className="text-muted-foreground text-sm shrink-0">{spec.key}</span>
                            <span className="text-white font-medium text-sm truncate text-right">{spec.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {selectedProduct.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="border-border text-muted-foreground">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Trust Badges */}
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <div className="flex items-center gap-2 p-2 md:p-3 rounded-xl bg-secondary border border-border overflow-hidden">
                      <Truck size={18} className="text-green-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm font-medium truncate">Frete Grátis</p>
                        <p className="text-[10px] md:text-xs text-muted-foreground truncate">Para todo Brasil</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 md:p-3 rounded-xl bg-secondary border border-border overflow-hidden">
                      <Shield size={18} className="text-blue-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm font-medium truncate">Garantia</p>
                        <p className="text-[10px] md:text-xs text-muted-foreground truncate">{selectedProduct.warranty || 'Consulte'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 md:p-3 rounded-xl bg-secondary border border-border overflow-hidden">
                      <Award size={18} className="text-yellow-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm font-medium truncate">Qualidade</p>
                        <p className="text-[10px] md:text-xs text-muted-foreground truncate">Produto original</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 md:p-3 rounded-xl bg-secondary border border-border overflow-hidden">
                      <Clock size={18} className="text-amber-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm font-medium truncate">Envio Rápido</p>
                        <p className="text-[10px] md:text-xs text-muted-foreground truncate">Em até 24h</p>
                      </div>
                    </div>
                  </div>

                  {/* Stock */}
                  <div className="flex items-center gap-4 text-sm">
                    {selectedProduct.stock > 0 ? (
                      <span className="text-green-400 flex items-center gap-1">
                        <Check size={16} />
                        Em estoque ({selectedProduct.stock} unidades)
                      </span>
                    ) : (
                      <span className="text-red-400">Produto esgotado</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 md:gap-3 pt-4">
                    <Button
                      size="lg"
                      className="flex-1 h-12 md:h-14 bg-gradient-to-r from-amber-600 to-yellow-700 hover:from-amber-700 hover:to-yellow-800 text-sm md:text-lg font-bold rounded-xl"
                      onClick={() => {
                        handleAddToCart(selectedProduct);
                        setSelectedProduct(null);
                      }}
                      disabled={selectedProduct.stock === 0}
                    >
                      <ShoppingCart size={20} className="mr-2" />
                      {isInCart(selectedProduct._id) ? "Adicionar Mais" : "Adicionar ao Carrinho"}
                    </Button>
                    {selectedProduct.externalUrl && (
                      <Button
                        size="lg"
                        variant="outline"
                        className="h-14 border-border rounded-xl"
                        asChild
                      >
                        <a href={selectedProduct.externalUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink size={20} />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Home Section (Featured, Categories, etc.)
  const HomeSection = () => (
    <div className="space-y-6 md:space-y-8">
      {/* Hero Banner */}
      <Card className="bg-gradient-to-r from-amber-900/50 to-yellow-900/50 border-amber-500/30 p-4 md:p-8 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-xl md:text-4xl font-bold mb-2">
            Loja FayAi
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg mb-4 md:mb-6 max-w-xl line-clamp-2">
            Equipamentos premium para criadores de conteúdo, desenvolvedores e entusiastas de IA
          </p>
          <div className="flex gap-3 md:gap-4">
            <Button 
              size="lg"
              className="bg-white text-black hover:bg-gray-200"
              onClick={() => setCurrentSection("products")}
            >
              Explorar Produtos
            </Button>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-20">
          <Monitor size={200} />
        </div>
      </Card>

      {/* Categories Grid */}
      <div>
        <h2 className="text-xl font-bold mb-4">Categorias</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
          {filters && Object.entries(filters.categories).map(([id, cat]) => (
            <CategoryCard 
              key={id}
              id={id} 
              name={cat.name} 
              count={filters.categoryCounts[id] || 0} 
            />
          ))}
        </div>
      </div>

      {/* Featured Products */}
      {featuredData?.featured && featuredData.featured.length > 0 && (
        <ProductSection
          title="Destaques"
          icon={Sparkles}
          products={featuredData.featured}
          color="yellow"
          onViewAll={() => setCurrentSection("products")}
        />
      )}

      {/* Deals */}
      {featuredData?.deals && featuredData.deals.length > 0 && (
        <ProductSection
          title="Ofertas"
          icon={Percent}
          products={featuredData.deals}
          color="red"
          onViewAll={() => setCurrentSection("products")}
        />
      )}

      {/* New Arrivals */}
      {featuredData?.newArrivals && featuredData.newArrivals.length > 0 && (
        <ProductSection
          title="Novidades"
          icon={Package}
          products={featuredData.newArrivals}
          color="green"
          onViewAll={() => setCurrentSection("products")}
        />
      )}

      {/* Best Sellers */}
      {featuredData?.bestSellers && featuredData.bestSellers.length > 0 && (
        <ProductSection
          title="Mais Vendidos"
          icon={Star}
          products={featuredData.bestSellers}
          color="purple"
          onViewAll={() => setCurrentSection("products")}
        />
      )}
    </div>
  );

  // Compact Icon Filter Bar Component
  const CompactFilterBar = () => (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="mb-6"
    >
      {/* Glass Container */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-xl" />
        <div className="relative p-4">
          {/* Search and Controls Row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar..."
                className="pl-10 h-10 bg-secondary border-border rounded-xl text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Sort Dropdown - Compact */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-10 h-10 p-0 bg-secondary border-border rounded-xl [&>span]:hidden">
                <ArrowUpDown size={16} />
              </SelectTrigger>
              <SelectContent className="bg-card/95 backdrop-blur-xl border-border text-white">
                <SelectItem value="createdAt">Mais Recentes</SelectItem>
                <SelectItem value="price-asc">Menor Preço</SelectItem>
                <SelectItem value="price-desc">Maior Preço</SelectItem>
                <SelectItem value="rating">Melhor Avaliados</SelectItem>
                <SelectItem value="sold">Mais Vendidos</SelectItem>
              </SelectContent>
            </Select>
            
            {/* View Mode */}
            <div className="flex bg-secondary rounded-xl overflow-hidden border border-border">
              <button
                className={cn(
                  "w-10 h-10 flex items-center justify-center transition-all",
                  viewMode === "grid" ? "bg-amber-500/30 text-amber-400" : "text-muted-foreground hover:text-white"
                )}
                onClick={() => setViewMode("grid")}
              >
                <Grid size={16} />
              </button>
              <button
                className={cn(
                  "w-10 h-10 flex items-center justify-center transition-all",
                  viewMode === "list" ? "bg-amber-500/30 text-amber-400" : "text-muted-foreground hover:text-white"
                )}
                onClick={() => setViewMode("list")}
              >
                <List size={16} />
              </button>
            </div>
          </div>
          
          {/* Category Icons Row */}
          <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-1">
            {/* All Categories */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-xl transition-all min-w-[60px]",
                !selectedCategory 
                  ? "bg-amber-500/30 text-amber-400 border border-amber-500/50" 
                  : "bg-black/20 text-muted-foreground hover:bg-white/10 hover:text-white border border-transparent"
              )}
              onClick={() => {
                setSelectedCategory(null);
                setSelectedSubcategory(null);
              }}
            >
              <LayoutGrid size={20} />
              <span className="text-[10px] font-medium">Todos</span>
            </motion.button>
            
            {/* Category Icons */}
            {filters && Object.entries(filters.categories).map(([id, cat]) => {
              const IconComponent = CATEGORY_ICONS[id] || Package;
              return (
                <motion.button
                  key={id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl transition-all min-w-[60px] relative",
                    selectedCategory === id 
                      ? "bg-amber-500/30 text-amber-400 border border-amber-500/50" 
                      : "bg-black/20 text-muted-foreground hover:bg-white/10 hover:text-white border border-transparent"
                  )}
                  onClick={() => {
                    setSelectedCategory(id);
                    setSelectedSubcategory(null);
                  }}
                >
                  <IconComponent size={20} />
                  <span className="text-[10px] font-medium truncate max-w-[50px]">
                    {cat.name.split(' ')[0]}
                  </span>
                  {/* Count Badge */}
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[9px] rounded-full flex items-center justify-center">
                    {filters.categoryCounts[id] || 0}
                  </span>
                </motion.button>
              );
            })}
            
            {/* Clear Filter */}
            {(selectedCategory || selectedBrand) && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-1 p-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 min-w-[60px]"
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedSubcategory(null);
                  setSelectedBrand(null);
                }}
              >
                <X size={20} />
                <span className="text-[10px] font-medium">Limpar</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Products List Section
  const ProductsSection = () => (
    <div className={cn("flex gap-4 md:gap-6", isCompact && "flex-col")}>
      {/* Compact Mode: Icon Filter Bar */}
      {isCompact && <CompactFilterBar />}
      
      {/* Full Mode: Sidebar Filters */}
      <AnimatePresence>
        {!isCompact && (
          <motion.div 
            initial={{ opacity: 0, x: -20, width: 0 }}
            animate={{ opacity: 1, x: 0, width: 256 }}
            exit={{ opacity: 0, x: -20, width: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex-shrink-0 space-y-6 hidden lg:block overflow-hidden"
          >
            <Card className="bg-secondary border-border p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Filter size={18} />
                Filtros
              </h3>

              {/* Categories */}
              <div className="mb-6">
                <p className="text-sm font-medium text-muted-foreground mb-2">Categoria</p>
                <div className="space-y-1">
                  <button
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition",
                      !selectedCategory
                        ? "bg-amber-500/20 text-amber-400"
                        : "hover:bg-secondary text-muted-foreground"
                    )}
                    onClick={() => {
                      setSelectedCategory(null);
                      setSelectedSubcategory(null);
                    }}
                  >
                    Todas
                  </button>
                  {filters && Object.entries(filters.categories).map(([id, cat]) => (
                    <button
                      key={id}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition flex justify-between",
                        selectedCategory === id
                          ? "bg-amber-500/20 text-amber-400"
                          : "hover:bg-secondary text-muted-foreground"
                      )}
                      onClick={() => {
                        setSelectedCategory(id);
                        setSelectedSubcategory(null);
                      }}
                    >
                      <span>{cat.name}</span>
                      <span className="text-muted-foreground">{filters.categoryCounts[id] || 0}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subcategories */}
              {selectedCategory && filters?.categories[selectedCategory] && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Subcategoria</p>
                  <div className="space-y-1">
                    <button
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition",
                        !selectedSubcategory
                          ? "bg-amber-500/20 text-amber-400"
                          : "hover:bg-secondary text-muted-foreground"
                      )}
                      onClick={() => setSelectedSubcategory(null)}
                    >
                      Todas
                    </button>
                    {filters.categories[selectedCategory].subcategories.map((sub) => (
                      <button
                        key={sub}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-sm transition",
                          selectedSubcategory === sub
                            ? "bg-amber-500/20 text-amber-400"
                            : "hover:bg-secondary text-muted-foreground"
                        )}
                        onClick={() => setSelectedSubcategory(sub)}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Brands */}
              {filters?.brands && filters.brands.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Marca</p>
                  <Select value={selectedBrand || "__all__"} onValueChange={(v) => setSelectedBrand(v === "__all__" ? null : v)}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Todas as marcas" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border text-white">
                      <SelectItem value="__all__">Todas</SelectItem>
                      {filters.brands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Clear Filters */}
              {(selectedCategory || selectedBrand || selectedSubcategory) && (
                <Button
                  variant="outline"
                  className="w-full border-border"
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedSubcategory(null);
                    setSelectedBrand(null);
                  }}
                >
                  <X size={16} className="mr-2" />
                  Limpar Filtros
                </Button>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products Grid */}
      <div className="flex-1">
        {/* Toolbar - Only show in full mode */}
        {!isCompact && (
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder="Buscar produtos..."
                className="pl-10 bg-secondary border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36 md:w-48 bg-secondary border-border">
                  <ArrowUpDown size={16} className="mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-white">
                  <SelectItem value="createdAt">Mais Recentes</SelectItem>
                  <SelectItem value="price-asc">Menor Preço</SelectItem>
                  <SelectItem value="price-desc">Maior Preço</SelectItem>
                  <SelectItem value="rating">Melhor Avaliados</SelectItem>
                  <SelectItem value="sold">Mais Vendidos</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className="flex border border-border rounded-md overflow-hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "rounded-none",
                    viewMode === "grid" && "bg-amber-500/20 text-amber-400"
                  )}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid size={18} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "rounded-none",
                    viewMode === "list" && "bg-amber-500/20 text-amber-400"
                  )}
                  onClick={() => setViewMode("list")}
                >
                  <List size={18} />
                </Button>
              </div>

              {/* Mobile Filters */}
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden border-border"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal size={18} />
              </Button>
            </div>
          </div>
        )}

        {/* Back Button & Breadcrumb */}
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCurrentSection("home");
              setSelectedCategory(null);
              setSelectedSubcategory(null);
              setSelectedBrand(null);
              setSearchQuery("");
            }}
          >
            ← Voltar à Loja
          </Button>
          {selectedCategory && filters?.categories[selectedCategory] && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{filters.categories[selectedCategory].name}</span>
              {selectedSubcategory && (
                <>
                  <ChevronRight size={14} />
                  <span>{selectedSubcategory}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <p className="text-sm text-muted-foreground mb-4">
          {products.length} produto{products.length !== 1 ? "s" : ""} encontrado{products.length !== 1 ? "s" : ""}
        </p>

        {/* Products */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-amber-500" size={40} />
          </div>
        ) : products.length > 0 ? (
          <div className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4"
              : "space-y-3"
          )}>
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                compact={viewMode === "list"}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Package size={64} className="mx-auto mb-4 text-gray-600" />
            <h3 className="text-lg md:text-xl font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Tente ajustar os filtros ou buscar por outros termos
            </p>
            <Button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedSubcategory(null);
                setSelectedBrand(null);
                setSearchQuery("");
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-full">
      {currentSection === "home" ? <HomeSection /> : <ProductsSection />}
      
      {/* Product Detail Modal */}
      {selectedProduct && <ProductDetailModal />}
    </div>
  );
}
