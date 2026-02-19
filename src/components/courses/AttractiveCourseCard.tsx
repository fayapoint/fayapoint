"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Star, Clock, Users, TrendingUp, Zap, Award, 
  BookOpen, Code, Sparkles, Play, Check 
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/products";
import { useLocale } from "next-intl";

interface AttractiveCourseCardProps {
  product: Product;
  index: number;
}

// Course-specific gradients and icons
const courseStyles: Record<string, { gradient: string; icon: React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>; accentColor: string }> = {
  'prompt-engineering-fundamentos': {
    gradient: 'from-purple-500 via-purple-600 to-blue-600',
    icon: Sparkles,
    accentColor: 'purple'
  },
  'chatgpt-essentials': {
    gradient: 'from-teal-500 via-green-500 to-emerald-600',
    icon: BookOpen,
    accentColor: 'teal'
  },
  'chatgpt-advanced-apis': {
    gradient: 'from-purple-900 via-purple-700 to-pink-600',
    icon: Code,
    accentColor: 'pink'
  },
  'midjourney-arte-profissional': {
    gradient: 'from-pink-500 via-purple-500 to-indigo-600',
    icon: Sparkles,
    accentColor: 'pink'
  },
  'default': {
    gradient: 'from-purple-600 to-pink-600',
    icon: BookOpen,
    accentColor: 'purple'
  }
};

export function AttractiveCourseCard({ product, index }: AttractiveCourseCardProps) {
  const style = courseStyles[product.slug] || courseStyles['default'];
  const Icon = style.icon;
  const locale = useLocale();
  const isPtBr = locale === 'pt-BR';
  
  const discount = product.pricing.originalPrice > product.pricing.price 
    ? Math.round(((product.pricing.originalPrice - product.pricing.price) / product.pricing.originalPrice) * 100)
    : 0;

  const isNew = new Date(product.updatedAt).getTime() > Date.now() - 90 * 24 * 60 * 60 * 1000;
  const isAdvanced = product.level.toLowerCase().includes('avançado');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <Link href={`/curso/${product.slug}`}>
        <Card className="h-full overflow-hidden border-2 border-transparent hover:border-purple-500/50 transition-all duration-300 group hover:shadow-2xl hover:shadow-purple-500/20 bg-gray-900/50 backdrop-blur">
          {/* Gradient Header with Icon */}
          <div className={`relative bg-gradient-to-br ${style.gradient} p-8 overflow-hidden`}>
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }} />
            </div>
            
            {/* Icon */}
            <motion.div
              className="relative z-10 flex justify-center"
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <Icon size={64} className="text-white drop-shadow-lg" strokeWidth={1.5} />
            </motion.div>

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {isNew && (
                <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0 shadow-lg">
                  <Zap size={14} className="mr-1" />
                  <span className="font-bold">{isPtBr ? 'Novo' : 'New'}</span>
                </Badge>
              )}
              {isAdvanced && (
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg">
                  <Award size={14} className="mr-1" />
                  <span className="font-bold">{isPtBr ? 'Avançado' : 'Advanced'}</span>
                </Badge>
              )}
            </div>

            {/* Discount Badge */}
            {discount > 0 && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-red-500 text-white text-lg font-bold px-3 py-1 shadow-lg">
                  -{discount}%
                </Badge>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Category & Tool */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-purple-400 border-purple-400/50 bg-purple-400/10">
                {product.categoryPrimary}
              </Badge>
              <Badge variant="outline" className="text-gray-400">
                {product.tool}
              </Badge>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold leading-tight group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300">
              {product.name}
            </h3>

            {/* Description */}
            <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">
              {product.copy.shortDescription}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-400 py-3 border-y border-gray-800">
              {product.metrics.rating > 0 && (
                <div className="flex items-center gap-1.5">
                  <Star className="text-yellow-400 fill-yellow-400" size={16} />
                  <span className="font-bold text-white">{product.metrics.rating}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Play className="text-purple-400" size={16} />
                <span className="font-semibold text-white">
                  {product.metrics.lessons} {isPtBr ? 'aulas' : 'lessons'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="text-blue-400" size={16} />
                <span>{product.metrics.duration}</span>
              </div>
            </div>

            {/* What's Included */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {isPtBr ? 'Este curso inclui:' : 'This course includes:'}
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <Check size={16} className="text-green-400" />
                  <span>{product.metrics.lessons} {isPtBr ? 'aulas' : 'lessons'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Check size={16} className="text-green-400" />
                  <span>{isPtBr ? 'Certificado' : 'Certificate'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Check size={16} className="text-green-400" />
                  <span>{isPtBr ? 'Acesso vitalício' : 'Lifetime access'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Check size={16} className="text-green-400" />
                  <span>{isPtBr ? 'Suporte' : 'Support'}</span>
                </div>
              </div>
            </div>

            {/* Price & CTA */}
            <div className="pt-4 space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  {product.pricing.originalPrice > product.pricing.price && (
                    <p className="text-gray-500 line-through text-sm">
                      R$ {product.pricing.originalPrice}
                    </p>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      R$ {product.pricing.price}
                    </span>
                    {discount > 0 && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                        {isPtBr ? `Economize ${discount}%` : `Save ${discount}%`}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    ou 12x de R$ {(product.pricing.price / 12).toFixed(2)}
                  </p>
                </div>
              </div>

              <Button 
                className={`w-full bg-gradient-to-r ${style.gradient} hover:opacity-90 transition-opacity text-white font-bold py-6 text-base shadow-lg hover:shadow-xl group/btn`}
              >
                <span>{isPtBr ? 'Ver Curso Completo' : 'View Full Course'}</span>
                <Play size={18} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </Button>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500 pt-2">
                <div className="flex items-center gap-1">
                  <Check size={12} className="text-green-400" />
                  <span>{isPtBr ? '7 dias garantia' : '7-day guarantee'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check size={12} className="text-green-400" />
                  <span>{isPtBr ? 'Acesso imediato' : 'Instant access'}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
