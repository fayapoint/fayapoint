"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Search,
  Plus,
  Edit2,
  Trash2,
  MoreVertical,
  Clock,
  Users,
  Star,
  DollarSign,
  RefreshCcw,
  X,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Play,
  FileText,
  Layers,
  Settings,
  Image as ImageIcon,
  Tag,
  BarChart3,
  TrendingUp,
  Calendar,
  GraduationCap,
  Video,
  Award,
} from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import { cn } from "@/lib/utils";

interface CourseModule {
  id: number;
  title: string;
  description: string;
  duration: string;
  lessons: number;
  topics: string[];
}

interface Course {
  _id?: string;
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  tool: string;
  category: string;
  level: string;
  duration: string;
  totalLessons: number;
  price: number;
  originalPrice: number;
  rating: number;
  students: number;
  lastUpdated: string;
  shortDescription: string;
  fullDescription: string;
  modules: CourseModule[];
  thumbnail?: string;
  status: "draft" | "published" | "archived";
  isFree?: boolean;
}

// Stats Card Component
function StatCard({ label, value, icon: Icon, color, trend }: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: { value: number; up: boolean };
}) {
  const colorClasses: Record<string, string> = {
    violet: "from-violet-500/20 to-purple-600/10 border-violet-500/20 text-violet-400",
    cyan: "from-cyan-500/20 to-blue-600/10 border-cyan-500/20 text-cyan-400",
    emerald: "from-emerald-500/20 to-green-600/10 border-emerald-500/20 text-emerald-400",
    amber: "from-amber-500/20 to-yellow-600/10 border-amber-500/20 text-amber-400",
  };

  return (
    <div className={cn("p-4 rounded-xl bg-gradient-to-br border", colorClasses[color])}>
      <div className="flex items-center justify-between mb-2">
        <Icon size={18} />
        {trend && (
          <span className={cn("text-xs flex items-center gap-0.5", trend.up ? "text-emerald-400" : "text-red-400")}>
            <TrendingUp size={12} className={!trend.up ? "rotate-180" : ""} />
            {trend.value}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

// Course Card for Mobile
function CourseCard({ course, onEdit, onDelete, onView }: {
  course: Course;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const statusColors = {
    published: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    draft: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    archived: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };

  const levelColors: Record<string, string> = {
    iniciante: "bg-green-500/20 text-green-400",
    intermediário: "bg-amber-500/20 text-amber-400",
    avançado: "bg-red-500/20 text-red-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center shrink-0 overflow-hidden">
          {course.thumbnail ? (
            <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            <BookOpen size={24} className="text-violet-400" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-medium text-white text-sm truncate">{course.title}</h3>
              <p className="text-xs text-gray-500 truncate">{course.tool}</p>
            </div>
            
            <div className="relative shrink-0">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400"
              >
                <MoreVertical size={16} />
              </button>
              
              <AnimatePresence>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 top-full mt-1 w-32 rounded-xl bg-gray-900 border border-white/10 shadow-xl z-50 overflow-hidden"
                    >
                      <button onClick={() => { onView(); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5">
                        <Eye size={12} /> Ver
                      </button>
                      <button onClick={() => { onEdit(); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5">
                        <Edit2 size={12} /> Editar
                      </button>
                      <button onClick={() => { onDelete(); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10">
                        <Trash2 size={12} /> Excluir
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className={cn("px-2 py-0.5 rounded text-[10px] border", statusColors[course.status])}>
              {course.status}
            </span>
            {course.isFree && (
              <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-400">
                GRÁTIS
              </span>
            )}
            <span className={cn("px-2 py-0.5 rounded text-[10px]", levelColors[course.level.toLowerCase()] || "bg-gray-500/20 text-gray-400")}>
              {course.level}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
            <span className="flex items-center gap-1">
              <Users size={10} /> {course.students}
            </span>
            <span className="flex items-center gap-1">
              <Star size={10} className="text-amber-400" /> {course.rating}
            </span>
            <span className="flex items-center gap-1">
              <Video size={10} /> {course.totalLessons} aulas
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
        <div>
          {course.isFree ? (
            <span className="text-emerald-400 font-bold">Grátis</span>
          ) : (
            <>
              <span className="text-white font-bold">R$ {course.price}</span>
              {course.originalPrice > course.price && (
                <span className="text-xs text-gray-500 line-through ml-2">R$ {course.originalPrice}</span>
              )}
            </>
          )}
        </div>
        <span className="text-[10px] text-gray-500">
          {course.modules?.length || 0} módulos
        </span>
      </div>
    </motion.div>
  );
}

// Course Edit Modal
function CourseModal({ course, onClose, onSave, mode }: {
  course?: Course | null;
  onClose: () => void;
  onSave: (data: Partial<Course>) => Promise<void>;
  mode: "create" | "edit";
}) {
  const [activeTab, setActiveTab] = useState<"basic" | "content" | "pricing" | "media">("basic");
  const [formData, setFormData] = useState<Partial<Course>>({
    title: course?.title || "",
    subtitle: course?.subtitle || "",
    slug: course?.slug || "",
    tool: course?.tool || "",
    category: course?.category || "AI & Automação",
    level: course?.level || "Iniciante",
    duration: course?.duration || "",
    totalLessons: course?.totalLessons || 0,
    price: course?.price || 0,
    originalPrice: course?.originalPrice || 0,
    shortDescription: course?.shortDescription || "",
    fullDescription: course?.fullDescription || "",
    status: course?.status || "draft",
    isFree: course?.isFree || false,
    modules: course?.modules || [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "basic", label: "Básico", icon: FileText },
    { id: "content", label: "Conteúdo", icon: Layers },
    { id: "pricing", label: "Preços", icon: DollarSign },
    { id: "media", label: "Mídia", icon: ImageIcon },
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
        className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl bg-gray-900 border border-white/10 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <BookOpen size={20} className="text-violet-400" />
            {mode === "create" ? "Novo Curso" : "Editar Curso"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 py-2 border-b border-white/10 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition",
                activeTab === tab.id
                  ? "bg-violet-500/20 text-violet-400"
                  : "text-gray-400 hover:bg-white/5"
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mx-4 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === "basic" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">Título</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">Subtítulo</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Ferramenta</label>
                  <input
                    type="text"
                    value={formData.tool}
                    onChange={(e) => setFormData({ ...formData, tool: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50"
                  >
                    <option value="AI & Automação">AI & Automação</option>
                    <option value="Marketing Digital">Marketing Digital</option>
                    <option value="Desenvolvimento">Desenvolvimento</option>
                    <option value="Design">Design</option>
                    <option value="Negócios">Negócios</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Nível</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50"
                  >
                    <option value="Iniciante">Iniciante</option>
                    <option value="Intermediário">Intermediário</option>
                    <option value="Avançado">Avançado</option>
                    <option value="Todos os níveis">Todos os níveis</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Duração</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="Ex: 12h"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Course["status"] })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50"
                  >
                    <option value="draft">Rascunho</option>
                    <option value="published">Publicado</option>
                    <option value="archived">Arquivado</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Descrição Curta</label>
                <textarea
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50 resize-none"
                />
              </div>
            </>
          )}

          {activeTab === "content" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-white">Módulos ({formData.modules?.length || 0})</h4>
                <button
                  type="button"
                  onClick={() => {
                    const newModule: CourseModule = {
                      id: (formData.modules?.length || 0) + 1,
                      title: "",
                      description: "",
                      duration: "",
                      lessons: 0,
                      topics: [],
                    };
                    setFormData({ ...formData, modules: [...(formData.modules || []), newModule] });
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-400 text-xs hover:bg-violet-500/30 transition"
                >
                  <Plus size={14} /> Adicionar Módulo
                </button>
              </div>

              {formData.modules?.map((module, index) => (
                <div key={index} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Módulo {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newModules = formData.modules?.filter((_, i) => i !== index);
                        setFormData({ ...formData, modules: newModules });
                      }}
                      className="p-1 rounded hover:bg-red-500/20 text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={module.title}
                    onChange={(e) => {
                      const newModules = [...(formData.modules || [])];
                      newModules[index] = { ...module, title: e.target.value };
                      setFormData({ ...formData, modules: newModules });
                    }}
                    placeholder="Título do módulo"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={module.duration}
                      onChange={(e) => {
                        const newModules = [...(formData.modules || [])];
                        newModules[index] = { ...module, duration: e.target.value };
                        setFormData({ ...formData, modules: newModules });
                      }}
                      placeholder="Duração"
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50"
                    />
                    <input
                      type="number"
                      value={module.lessons}
                      onChange={(e) => {
                        const newModules = [...(formData.modules || [])];
                        newModules[index] = { ...module, lessons: Number(e.target.value) };
                        setFormData({ ...formData, modules: newModules });
                      }}
                      placeholder="Aulas"
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                </div>
              ))}

              {(!formData.modules || formData.modules.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Layers size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum módulo adicionado</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "pricing" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                <input
                  type="checkbox"
                  id="isFree"
                  checked={formData.isFree}
                  onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-white/5"
                />
                <label htmlFor="isFree" className="text-sm text-white">Curso Gratuito</label>
              </div>

              {!formData.isFree && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Preço (R$)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Preço Original (R$)</label>
                    <input
                      type="number"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Total de Aulas</label>
                <input
                  type="number"
                  value={formData.totalLessons}
                  onChange={(e) => setFormData({ ...formData, totalLessons: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50"
                />
              </div>
            </div>
          )}

          {activeTab === "media" && (
            <div className="space-y-4">
              <div className="p-8 rounded-xl border-2 border-dashed border-white/10 text-center">
                <ImageIcon size={32} className="mx-auto mb-2 text-gray-500" />
                <p className="text-sm text-gray-400">Arraste uma imagem ou clique para upload</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG até 2MB</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">URL da Thumbnail</label>
                <input
                  type="text"
                  value={formData.thumbnail || ""}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50"
                />
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Check size={16} />}
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { token } = useAdmin();

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      // For now, import from static data - later can be from API
      const { allCourses } = await import("@/data/courses");
      const coursesWithStatus = allCourses.map(c => ({
        ...c,
        status: "published" as const,
        _id: String(c.id),
      }));
      setCourses(coursesWithStatus);
    } catch (e) {
      console.error("Error fetching courses:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const filteredCourses = courses.filter(c => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    if (categoryFilter && c.category !== categoryFilter) return false;
    return true;
  });

  const handleSaveCourse = async (data: Partial<Course>) => {
    // TODO: Implement API call
    console.log("Saving course:", data);
    await new Promise(r => setTimeout(r, 1000));
    fetchCourses();
  };

  const handleDeleteCourse = async (id: string) => {
    // TODO: Implement API call
    console.log("Deleting course:", id);
    setDeleteConfirm(null);
    fetchCourses();
  };

  const stats = {
    total: courses.length,
    published: courses.filter(c => c.status === "published").length,
    totalStudents: courses.reduce((acc, c) => acc + (c.students || 0), 0),
    avgRating: courses.length > 0 ? (courses.reduce((acc, c) => acc + (c.rating || 0), 0) / courses.length).toFixed(1) : "0",
  };

  const categories = [...new Set(courses.map(c => c.category))];

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-violet-400" />
            Cursos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie todos os cursos da plataforma
          </p>
        </div>
        
        <button
          onClick={() => { setSelectedCourse(null); setModalMode("create"); }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition shadow-lg shadow-violet-500/20"
        >
          <Plus size={18} />
          <span>Novo Curso</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} icon={BookOpen} color="violet" />
        <StatCard label="Publicados" value={stats.published} icon={Check} color="emerald" />
        <StatCard label="Alunos" value={stats.totalStudents.toLocaleString()} icon={Users} color="cyan" trend={{ value: 12, up: true }} />
        <StatCard label="Avaliação Média" value={stats.avgRating} icon={Star} color="amber" />
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar cursos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-violet-500/50 min-w-[100px]"
          >
            <option value="">Status</option>
            <option value="published">Publicado</option>
            <option value="draft">Rascunho</option>
            <option value="archived">Arquivado</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-violet-500/50 min-w-[120px]"
          >
            <option value="">Categoria</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <button
            onClick={fetchCourses}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition shrink-0"
          >
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Courses List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Nenhum curso encontrado</h3>
          <p className="text-sm text-gray-500">Tente ajustar os filtros de busca</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCourses.map((course, i) => (
            <motion.div
              key={course._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <CourseCard
                course={course}
                onEdit={() => { setSelectedCourse(course); setModalMode("edit"); }}
                onDelete={() => setDeleteConfirm(course._id!)}
                onView={() => window.open(`/pt-BR/cursos/${course.slug}`, "_blank")}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalMode && (
          <CourseModal
            course={selectedCourse}
            mode={modalMode}
            onClose={() => { setModalMode(null); setSelectedCourse(null); }}
            onSave={handleSaveCourse}
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
              <h3 className="text-lg font-semibold text-white mb-2">Excluir Curso?</h3>
              <p className="text-sm text-gray-400 mb-6">
                Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteCourse(deleteConfirm)}
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
