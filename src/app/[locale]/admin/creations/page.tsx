"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Image as ImageIcon,
  Search,
  Filter,
  Plus,
  Eye,
  Trash2,
  Download,
  Share2,
  Heart,
  Globe,
  Lock,
  RefreshCcw,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  TrendingUp,
  Zap,
  Wand2,
  Layers,
  Grid3X3,
  LayoutGrid,
  Tag,
  Clock,
  User,
  ExternalLink,
  BarChart3,
  Target,
  Lightbulb,
  Flame,
  ArrowUpRight,
  Package,
  Shirt,
  Palette,
  Camera,
  PenTool,
} from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import { cn } from "@/lib/utils";

interface ImageCreation {
  _id: string;
  userId: string;
  userName: string;
  prompt: string;
  imageUrl: string;
  provider: string;
  isPublic: boolean;
  category: string;
  tags: string[];
  likes: number;
  usedInProducts: number;
  createdAt: string;
}

interface TrendItem {
  keyword: string;
  volume: number;
  growth: number;
  category: string;
  source: string;
}

const CATEGORIES = [
  { id: "all", label: "Todos", icon: Grid3X3 },
  { id: "apparel", label: "Vestuário", icon: Shirt },
  { id: "art", label: "Arte", icon: Palette },
  { id: "logo", label: "Logos", icon: PenTool },
  { id: "photo", label: "Fotos", icon: Camera },
  { id: "pattern", label: "Padrões", icon: Layers },
  { id: "illustration", label: "Ilustrações", icon: Wand2 },
];

const SAMPLE_TRENDS: TrendItem[] = [
  { keyword: "Y2K aesthetic", volume: 89000, growth: 45, category: "fashion", source: "Google Trends" },
  { keyword: "Minimalist logo", volume: 67000, growth: 23, category: "design", source: "Google Trends" },
  { keyword: "Neon cyberpunk", volume: 54000, growth: 67, category: "art", source: "Pinterest" },
  { keyword: "Cottagecore pattern", volume: 43000, growth: 12, category: "pattern", source: "Etsy" },
  { keyword: "Abstract geometric", volume: 38000, growth: 34, category: "art", source: "Dribbble" },
  { keyword: "Anime portrait", volume: 92000, growth: 56, category: "illustration", source: "Twitter" },
  { keyword: "Vintage retro", volume: 71000, growth: 18, category: "apparel", source: "Google Trends" },
  { keyword: "Gradient mesh", volume: 29000, growth: 89, category: "design", source: "Behance" },
];

// Gallery Image Card
function ImageCard({ image, onView, onDelete, onTogglePublic }: {
  image: ImageCreation;
  onView: () => void;
  onDelete: () => void;
  onTogglePublic: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const categoryIcons: Record<string, React.ElementType> = {
    apparel: Shirt,
    art: Palette,
    logo: PenTool,
    photo: Camera,
    pattern: Layers,
    illustration: Wand2,
    general: ImageIcon,
  };

  const CategoryIcon = categoryIcons[image.category] || ImageIcon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative rounded-xl overflow-hidden bg-gray-900 border border-white/10"
    >
      {/* Image */}
      <div className="aspect-square relative">
        <img
          src={image.imageUrl}
          alt={image.prompt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="text-white text-xs line-clamp-2">{image.prompt}</p>
          </div>
        </div>

        {/* Status badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1">
          {image.isPublic ? (
            <span className="p-1.5 rounded-lg bg-emerald-500/80 text-white">
              <Globe size={12} />
            </span>
          ) : (
            <span className="p-1.5 rounded-lg bg-gray-800/80 text-gray-400">
              <Lock size={12} />
            </span>
          )}
          <span className="px-2 py-1 rounded-lg bg-black/60 text-white text-[10px] flex items-center gap-1">
            <CategoryIcon size={10} />
            {image.category}
          </span>
        </div>

        {/* Menu */}
        <div className="absolute top-2 right-2">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical size={14} />
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-gray-900 border border-white/10 shadow-xl z-50 overflow-hidden"
                >
                  <button onClick={() => { onView(); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5">
                    <Eye size={12} /> Ver detalhes
                  </button>
                  <button onClick={() => { onTogglePublic(); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5">
                    {image.isPublic ? <Lock size={12} /> : <Globe size={12} />}
                    {image.isPublic ? "Tornar privado" : "Tornar público"}
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5">
                    <Download size={12} /> Download
                  </button>
                  <button onClick={() => { onDelete(); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10">
                    <Trash2 size={12} /> Excluir
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Stats */}
        <div className="absolute bottom-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 text-white text-[10px]">
            <Heart size={10} /> {image.likes}
          </span>
          {image.usedInProducts > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-500/60 text-white text-[10px]">
              <Package size={10} /> {image.usedInProducts}
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <User size={10} />
          <span className="truncate">{image.userName}</span>
          <span>•</span>
          <Clock size={10} />
          <span>{new Date(image.createdAt).toLocaleDateString("pt-BR")}</span>
        </div>
      </div>
    </motion.div>
  );
}

// Trend Card
function TrendCard({ trend, onUse }: { trend: TrendItem; onUse: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-violet-500/30 transition-all cursor-pointer group"
      onClick={onUse}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white text-sm truncate group-hover:text-violet-400 transition">
            {trend.keyword}
          </h4>
          <p className="text-[10px] text-gray-500">{trend.source}</p>
        </div>
        <span className={cn(
          "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium",
          trend.growth > 30 ? "bg-emerald-500/20 text-emerald-400" :
          trend.growth > 10 ? "bg-amber-500/20 text-amber-400" :
          "bg-gray-500/20 text-gray-400"
        )}>
          <ArrowUpRight size={10} />
          {trend.growth}%
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-500">
          {(trend.volume / 1000).toFixed(0)}K buscas/mês
        </span>
        <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-gray-400">
          {trend.category}
        </span>
      </div>
    </motion.div>
  );
}

// AI Product Creator Modal
function AICreatorModal({ onClose, trends }: { onClose: () => void; trends: TrendItem[] }) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("realistic");
  const [category, setCategory] = useState("general");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    // TODO: Call AI generation API
    await new Promise(r => setTimeout(r, 2000));
    setGenerating(false);
    onClose();
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
        className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl bg-gray-900 border border-white/10 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Wand2 size={20} className="text-violet-400" />
            Criar com IA
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Prompt */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Descreva sua criação</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Ex: Logo minimalista para marca de café premium, tons terrosos, estilo moderno..."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500/50 resize-none"
            />
          </div>

          {/* Quick prompts from trends */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block flex items-center gap-2">
              <Flame size={12} className="text-orange-400" />
              Tendências em Alta
            </label>
            <div className="flex flex-wrap gap-2">
              {trends.slice(0, 6).map((trend, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(prev => prev ? `${prev}, ${trend.keyword}` : trend.keyword)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-violet-500/20 hover:border-violet-500/30 hover:text-violet-400 transition"
                >
                  {trend.keyword}
                </button>
              ))}
            </div>
          </div>

          {/* Style & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Estilo</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50"
              >
                <option value="realistic">Realista</option>
                <option value="artistic">Artístico</option>
                <option value="cartoon">Cartoon</option>
                <option value="3d">3D Render</option>
                <option value="minimalist">Minimalista</option>
                <option value="vintage">Vintage</option>
                <option value="neon">Neon/Cyberpunk</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50"
              >
                <option value="general">Geral</option>
                <option value="apparel">Vestuário/POD</option>
                <option value="art">Arte</option>
                <option value="logo">Logo</option>
                <option value="pattern">Padrão</option>
                <option value="illustration">Ilustração</option>
              </select>
            </div>
          </div>

          {/* Tips */}
          <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <h4 className="text-sm font-medium text-violet-400 mb-2 flex items-center gap-2">
              <Lightbulb size={14} />
              Dicas para melhores resultados
            </h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Seja específico sobre cores, estilo e composição</li>
              <li>• Use referências de tendências para produtos que vendem</li>
              <li>• Para POD, especifique &quot;fundo transparente&quot; ou &quot;isolado&quot;</li>
              <li>• Combine múltiplas tendências para designs únicos</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-violet-500/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <RefreshCcw className="w-4 h-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Gerar Imagem
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminCreationsPage() {
  const [images, setImages] = useState<ImageCreation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [visibility, setVisibility] = useState<"all" | "public" | "private">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCreator, setShowCreator] = useState(false);
  const [trends, setTrends] = useState<TrendItem[]>(SAMPLE_TRENDS);
  const [activeTab, setActiveTab] = useState<"gallery" | "trends" | "create">("gallery");
  const { token } = useAdmin();

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (category !== "all") params.append("category", category);
      if (visibility !== "all") params.append("isPublic", visibility === "public" ? "true" : "false");

      const res = await fetch(`/api/admin/creations?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setImages(data.images || []);
      }
    } catch (e) {
      console.error("Error fetching images:", e);
      // Use sample data for now
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [token, category, visibility]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const filteredImages = images.filter(img => {
    if (search && !img.prompt.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleTogglePublic = async (id: string) => {
    // TODO: Implement API call
    setImages(prev => prev.map(img => 
      img._id === id ? { ...img, isPublic: !img.isPublic } : img
    ));
  };

  const handleDelete = async (id: string) => {
    // TODO: Implement API call
    setImages(prev => prev.filter(img => img._id !== id));
  };

  const stats = {
    total: images.length,
    public: images.filter(i => i.isPublic).length,
    totalLikes: images.reduce((acc, i) => acc + i.likes, 0),
    usedInProducts: images.filter(i => i.usedInProducts > 0).length,
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-400" />
            Criações IA
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Galeria de imagens e criador de produtos com IA
          </p>
        </div>
        
        <button
          onClick={() => setShowCreator(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-violet-500/30 transition"
        >
          <Wand2 size={18} />
          <span>Criar com IA</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon size={16} className="text-violet-400" />
            <span className="text-xs text-gray-400">Total</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-600/10 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Globe size={16} className="text-emerald-400" />
            <span className="text-xs text-gray-400">Públicas</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.public}</p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-600/10 border border-pink-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Heart size={16} className="text-pink-400" />
            <span className="text-xs text-gray-400">Likes</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalLikes}</p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-amber-400" />
            <span className="text-xs text-gray-400">Em Produtos</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.usedInProducts}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: "gallery", label: "Galeria", icon: LayoutGrid },
          { id: "trends", label: "Tendências", icon: TrendingUp },
          { id: "create", label: "Criar Produto", icon: Wand2 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition",
              activeTab === tab.id
                ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Gallery Tab */}
      {activeTab === "gallery" && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar por prompt..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as typeof visibility)}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-violet-500/50"
              >
                <option value="all">Todas</option>
                <option value="public">Públicas</option>
                <option value="private">Privadas</option>
              </select>

              <button
                onClick={fetchImages}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition"
              >
                <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition",
                  category === cat.id
                    ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                    : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                )}
              >
                <cat.icon size={14} />
                {cat.label}
              </button>
            ))}
          </div>

          {/* Images Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Nenhuma criação encontrada</h3>
              <p className="text-sm text-gray-500 mb-4">Comece criando imagens com IA</p>
              <button
                onClick={() => setShowCreator(true)}
                className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition"
              >
                Criar Imagem
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredImages.map((image) => (
                <ImageCard
                  key={image._id}
                  image={image}
                  onView={() => console.log("View", image._id)}
                  onDelete={() => handleDelete(image._id)}
                  onTogglePublic={() => handleTogglePublic(image._id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Trends Tab */}
      {activeTab === "trends" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <Flame size={16} className="text-orange-400" />
              Tendências para Produtos
            </h3>
            <button className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              <RefreshCcw size={12} />
              Atualizar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {trends.map((trend, i) => (
              <TrendCard
                key={i}
                trend={trend}
                onUse={() => setShowCreator(true)}
              />
            ))}
          </div>

          {/* Trend Sources */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <h4 className="text-xs font-medium text-gray-400 mb-3">Fontes de Tendências</h4>
            <div className="flex flex-wrap gap-2">
              {["Google Trends", "Pinterest", "Etsy", "Dribbble", "Behance", "Twitter", "TikTok", "Polymarket"].map((source) => (
                <span key={source} className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-gray-400">
                  {source}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Tab */}
      {activeTab === "create" && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-600/5 border border-violet-500/20 text-center">
            <Wand2 className="w-12 h-12 text-violet-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Criador de Produtos com IA</h3>
            <p className="text-sm text-gray-400 mb-4 max-w-md mx-auto">
              Use tendências de mercado e IA para criar designs únicos para seus produtos POD
            </p>
            <button
              onClick={() => setShowCreator(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-violet-500/30 transition"
            >
              Começar a Criar
            </button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "T-Shirt Design", icon: Shirt, color: "cyan" },
              { label: "Logo", icon: PenTool, color: "violet" },
              { label: "Ilustração", icon: Palette, color: "pink" },
              { label: "Padrão", icon: Layers, color: "amber" },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => setShowCreator(true)}
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition text-left group"
              >
                <action.icon size={24} className={cn(
                  "mb-2 transition-transform group-hover:scale-110",
                  action.color === "cyan" ? "text-cyan-400" :
                  action.color === "violet" ? "text-violet-400" :
                  action.color === "pink" ? "text-pink-400" :
                  "text-amber-400"
                )} />
                <p className="text-sm font-medium text-white">{action.label}</p>
                <p className="text-xs text-gray-500">Criar novo</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Creator Modal */}
      <AnimatePresence>
        {showCreator && (
          <AICreatorModal
            onClose={() => setShowCreator(false)}
            trends={trends}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
