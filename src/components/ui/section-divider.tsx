"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface SectionDividerProps {
  icon: LucideIcon;
}

export function SectionDivider({ icon: Icon }: SectionDividerProps) {
  return (
    <div className="absolute top-0 left-0 right-0 h-24 -translate-y-12 overflow-hidden pointer-events-none">
      {/* Animated gradient waves */}
      <motion.div
        className="absolute inset-0"
        animate={{
          backgroundImage: [
            'radial-gradient(ellipse 800px 100px at 50% 50%, rgba(var(--primary-rgb, 66, 99, 235), 0.15), transparent)',
            'radial-gradient(ellipse 1000px 120px at 50% 50%, rgba(var(--primary-rgb, 66, 99, 235), 0.2), transparent)',
            'radial-gradient(ellipse 800px 100px at 50% 50%, rgba(var(--primary-rgb, 66, 99, 235), 0.15), transparent)',
          ]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Triple gradient lines with glow */}
      <div className="absolute top-1/2 left-0 right-0">
        <motion.div 
          className="h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent"
          animate={{ opacity: [0.4, 1, 0.4], scaleX: [0.8, 1, 0.8] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div 
          className="h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent mt-2"
          animate={{ opacity: [0.3, 0.8, 0.3], scaleX: [1, 0.9, 1] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
        />
        <motion.div 
          className="h-[1px] bg-gradient-to-r from-transparent via-accent/40 to-transparent mt-2"
          animate={{ opacity: [0.2, 0.7, 0.2], scaleX: [0.9, 1, 0.9] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
        />
      </div>
      
      {/* Central icon badge */}
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 180, 360]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative">
          {/* Outer glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                '0 0 20px 5px rgba(var(--primary-rgb, 66, 99, 235), 0.3)',
                '0 0 40px 10px rgba(var(--primary-rgb, 66, 99, 235), 0.5)',
                '0 0 20px 5px rgba(var(--primary-rgb, 66, 99, 235), 0.3)',
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          {/* Icon container */}
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl border-4 border-background">
            <Icon className="w-7 h-7 text-primary-foreground" />
          </div>
        </div>
      </motion.div>
      
      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-primary/60"
          style={{
            left: `${20 + i * 12}%`,
            top: '50%'
          }}
          animate={{
            y: [-20, 20, -20],
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}
