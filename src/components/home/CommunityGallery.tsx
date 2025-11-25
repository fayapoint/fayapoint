"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, User, Sparkles } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { useTranslations } from 'next-intl';

interface Creation {
  _id: string;
  userName: string;
  imageUrl: string;
  prompt: string;
  createdAt: string;
}

export function CommunityGallery() {
  const t = useTranslations("CommunityGallery");
  const [creations, setCreations] = useState<Creation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch('/api/public/gallery');
        if (res.ok) {
          const data = await res.json();
          setCreations(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGallery();
  }, []);

  return (
    <section className="py-20 relative overflow-hidden bg-black" ref={ref}>
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/10 to-black pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-4"
            >
                <Sparkles size={16} className="text-purple-400" />
                <span className="text-sm text-purple-200">{t("badge")}</span>
            </motion.div>
            
            <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-6"
            >
                {t("title")}
            </motion.h2>
            
            <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-gray-400 max-w-2xl mx-auto"
            >
                {t("description")}
            </motion.p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-purple-500" size={40} />
          </div>
        ) : creations.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p>{t("empty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {creations.map((creation, idx) => (
              <motion.div
                key={creation._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                className="group relative aspect-square rounded-xl overflow-hidden bg-gray-900 border border-white/10 shadow-lg hover:shadow-purple-500/20 transition-all"
              >
                <img 
                    src={creation.imageUrl} 
                    alt={creation.prompt}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <p className="text-white text-sm font-medium line-clamp-2 mb-2">{creation.prompt}</p>
                    <div className="flex items-center gap-2 text-gray-300 text-xs">
                        <User size={12} />
                        <span>{creation.userName}</span>
                    </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
