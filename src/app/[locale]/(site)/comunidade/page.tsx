"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  Image as ImageIcon, 
  Users, 
  TrendingUp,
  User,
  Loader2,
  UserPlus,
  Wand2,
  Share2,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

interface Creation {
  _id: string;
  userName: string;
  imageUrl: string;
  prompt: string;
  createdAt: string;
}

interface TopCreator {
  _id: string;
  userName: string;
  count: number;
  latestImage: string;
}

interface Stats {
  totalCreations: number;
  uniqueCreators: number;
  todayCreations: number;
  topCreators: TopCreator[];
}

export default function CommunityPage() {
  const t = useTranslations("Community");
  const [creations, setCreations] = useState<Creation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedImage, setSelectedImage] = useState<Creation | null>(null);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/public/community-stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, []);

  // Fetch gallery
  const fetchGallery = useCallback(async (pageNum: number, append = false) => {
    try {
      if (pageNum === 1) setIsLoading(true);
      else setIsLoadingMore(true);

      const res = await fetch(`/api/public/gallery?page=${pageNum}&limit=16`);
      if (res.ok) {
        const data = await res.json();
        if (append) {
          setCreations(prev => [...prev, ...data.creations]);
        } else {
          setCreations(data.creations);
        }
        setHasMore(data.pagination?.hasMore ?? false);
      }
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchGallery(1);
  }, [fetchGallery]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchGallery(nextPage, true);
  };

  const steps = [
    { key: 'create', icon: UserPlus },
    { key: 'generate', icon: Wand2 },
    { key: 'share', icon: Share2 },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/20 via-black to-black" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
              <Sparkles size={16} className="text-purple-400" />
              <span className="text-sm text-purple-200">{t("hero.badge")}</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
              {t("hero.title")}
            </h1>
            
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              {t("hero.subtitle")}
            </p>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
              >
                <ImageIcon className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {stats?.totalCreations?.toLocaleString() || '—'}
                </div>
                <div className="text-xs text-gray-500">{t("stats.creations")}</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
              >
                <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {stats?.uniqueCreators?.toLocaleString() || '—'}
                </div>
                <div className="text-xs text-gray-500">{t("stats.creators")}</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
              >
                <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {stats?.todayCreations?.toLocaleString() || '—'}
                </div>
                <div className="text-xs text-gray-500">{t("stats.todayCreations")}</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("gallery.title")}</h2>
            <p className="text-gray-400">{t("gallery.description")}</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-purple-500" size={48} />
            </div>
          ) : creations.length === 0 ? (
            <div className="text-center py-20">
              <ImageIcon className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">{t("gallery.empty")}</p>
              <Link 
                href="/portal" 
                className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                <Wand2 size={18} />
                {t("cta.button")}
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {creations.map((creation, idx) => (
                  <motion.div
                    key={creation._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.5) }}
                    className="group relative aspect-square rounded-xl overflow-hidden bg-gray-900 border border-white/10 cursor-pointer"
                    onClick={() => setSelectedImage(creation)}
                  >
                    <img 
                      src={creation.imageUrl} 
                      alt={creation.prompt}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <p className="text-white text-sm font-medium line-clamp-2 mb-2">{creation.prompt}</p>
                      <div className="flex items-center gap-2 text-gray-300 text-xs">
                        <User size={12} />
                        <span>{creation.userName}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {hasMore && (
                <div className="text-center mt-10">
                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors disabled:opacity-50"
                  >
                    {isLoadingMore ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : null}
                    {isLoadingMore ? t("gallery.loading") : t("gallery.loadMore")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* How to Participate */}
      <section className="py-20 bg-gradient-to-b from-black via-purple-950/10 to-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("howTo.title")}</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, idx) => (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm text-purple-400 mb-2">0{idx + 1}</div>
                <h3 className="text-xl font-semibold mb-2">{t(`howTo.steps.${step.key}.title`)}</h3>
                <p className="text-gray-400 text-sm">{t(`howTo.steps.${step.key}.description`)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Creators */}
      {stats?.topCreators && stats.topCreators.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("featured.title")}</h2>
              <p className="text-gray-400">{t("featured.description")}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {stats.topCreators.map((creator, idx) => (
                <motion.div
                  key={creator._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="relative group"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-gray-900 border border-white/10">
                    {creator.latestImage ? (
                      <img 
                        src={creator.latestImage} 
                        alt={creator.userName}
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-12 h-12 text-gray-700" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex flex-col items-center justify-end p-4">
                      <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center mb-2 text-white font-bold">
                        {creator.userName?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <p className="text-white text-sm font-medium truncate w-full text-center">{creator.userName}</p>
                      <p className="text-purple-400 text-xs">{creator.count} {t("stats.creations").toLowerCase()}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-black to-blue-900/20" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">{t("cta.title")}</h2>
            <p className="text-xl text-gray-400 mb-10">{t("cta.description")}</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/portal"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-full font-semibold transition-all shadow-lg shadow-purple-500/25"
              >
                <Wand2 size={20} />
                {t("cta.button")}
                <ArrowRight size={18} />
              </Link>
              
              <Link
                href="/cursos"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/20 rounded-full font-semibold transition-colors"
              >
                {t("cta.secondaryButton")}
                <ExternalLink size={18} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={selectedImage.imageUrl}
              alt={selectedImage.prompt}
              className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent rounded-b-xl">
              <p className="text-white text-lg mb-2">{selectedImage.prompt}</p>
              <div className="flex items-center gap-2 text-gray-400">
                <User size={14} />
                <span>{selectedImage.userName}</span>
                <span className="text-gray-600">•</span>
                <span>{new Date(selectedImage.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              ✕
            </button>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
}
