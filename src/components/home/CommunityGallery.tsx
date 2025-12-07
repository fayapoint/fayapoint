"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, User, Sparkles, X, ChevronLeft, ChevronRight, Heart, ExternalLink } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface Creation {
  _id: string;
  userName: string;
  imageUrl: string;
  prompt: string;
  createdAt: string;
  likes?: number;
}

// Infinite scroll marquee row
function MarqueeRow({ 
  images, 
  direction = 'left', 
  speed = 30,
  onImageClick 
}: { 
  images: Creation[]; 
  direction?: 'left' | 'right';
  speed?: number;
  onImageClick: (img: Creation, idx: number) => void;
}) {
  const duplicatedImages = [...images, ...images]; // Duplicate for seamless loop
  
  return (
    <div className="relative overflow-hidden py-2 group/row">
      <motion.div
        className="flex gap-3"
        animate={{
          x: direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: speed,
            ease: "linear",
          },
        }}
        style={{ willChange: 'transform' }}
      >
        {duplicatedImages.map((img, idx) => (
          <motion.div
            key={`${img._id}-${idx}`}
            className="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-lg overflow-hidden cursor-pointer group"
            whileHover={{ scale: 1.05, zIndex: 10 }}
            onClick={() => onImageClick(img, idx % images.length)}
          >
            <img
              src={img.imageUrl}
              alt={img.prompt}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <Sparkles className="text-white/80" size={20} />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// Lightbox Modal for viewing images
function ImageLightbox({ 
  images, 
  currentIndex, 
  onClose, 
  onNavigate 
}: { 
  images: Creation[]; 
  currentIndex: number; 
  onClose: () => void;
  onNavigate: (idx: number) => void;
}) {
  const image = images[currentIndex];
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNavigate((currentIndex - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') onNavigate((currentIndex + 1) % images.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length, onClose, onNavigate]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative max-w-4xl w-full max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
        >
          <X size={28} />
        </button>
        
        {/* Main image */}
        <div className="relative flex-1 flex items-center justify-center">
          <img
            src={image.imageUrl}
            alt={image.prompt}
            className="max-w-full max-h-[70vh] object-contain rounded-xl"
          />
          
          {/* Navigation arrows */}
          <button
            onClick={() => onNavigate((currentIndex - 1 + images.length) % images.length)}
            className="absolute left-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={() => onNavigate((currentIndex + 1) % images.length)}
            className="absolute right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </div>
        
        {/* Image info */}
        <div className="mt-4 p-4 bg-white/5 rounded-xl backdrop-blur-sm">
          <p className="text-white font-medium line-clamp-2 mb-2">{image.prompt}</p>
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <User size={14} />
              <span>{image.userName}</span>
            </div>
            <div className="flex items-center gap-4">
              {image.likes !== undefined && (
                <div className="flex items-center gap-1">
                  <Heart size={14} className="text-pink-400" />
                  <span>{image.likes}</span>
                </div>
              )}
              <span className="text-gray-500">{currentIndex + 1} / {images.length}</span>
            </div>
          </div>
        </div>
        
        {/* Thumbnail strip */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {images.slice(0, 20).map((img, idx) => (
            <button
              key={img._id}
              onClick={() => onNavigate(idx)}
              className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentIndex ? 'border-purple-500 ring-2 ring-purple-500/30' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function CommunityGallery() {
  const t = useTranslations("CommunityGallery");
  const [creations, setCreations] = useState<Creation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch('/api/public/gallery?limit=50');
        if (res.ok) {
          const data = await res.json();
          setCreations(data.creations || data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGallery();
  }, []);

  // Split images into rows for marquee effect
  const row1 = creations.slice(0, Math.ceil(creations.length / 3));
  const row2 = creations.slice(Math.ceil(creations.length / 3), Math.ceil(creations.length * 2 / 3));
  const row3 = creations.slice(Math.ceil(creations.length * 2 / 3));

  const handleImageClick = (img: Creation, _idx: number) => {
    const fullIndex = creations.findIndex(c => c._id === img._id);
    setLightboxIndex(fullIndex >= 0 ? fullIndex : 0);
  };

  return (
    <section className="py-12 md:py-16 relative overflow-hidden bg-black" ref={ref}>
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/10 to-black pointer-events-none" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="container mx-auto px-4 text-center mb-8">
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
            className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-3"
          >
            {t("title")}
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-400 max-w-xl mx-auto text-sm md:text-base"
          >
            {t("description")}
          </motion.p>
        </div>

        {/* Gallery Content */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-purple-500" size={36} />
          </div>
        ) : creations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>{t("empty")}</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-1"
          >
            {/* Three rows of marquee - alternating directions */}
            {row1.length > 0 && (
              <MarqueeRow images={row1} direction="left" speed={40} onImageClick={handleImageClick} />
            )}
            {row2.length > 0 && (
              <MarqueeRow images={row2} direction="right" speed={35} onImageClick={handleImageClick} />
            )}
            {row3.length > 0 && (
              <MarqueeRow images={row3} direction="left" speed={45} onImageClick={handleImageClick} />
            )}
          </motion.div>
        )}

        {/* CTA */}
        {creations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="container mx-auto px-4 mt-8 text-center"
          >
            <Link 
              href="/portal"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-full transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
            >
              <Sparkles size={18} />
              {t("cta") || "Criar Minha Arte"}
              <ExternalLink size={16} />
            </Link>
            <p className="text-gray-500 text-xs mt-3">
              {creations.length}+ {t("imagesCreated") || "imagens criadas pela comunidade"}
            </p>
          </motion.div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <ImageLightbox
            images={creations}
            currentIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onNavigate={setLightboxIndex}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
