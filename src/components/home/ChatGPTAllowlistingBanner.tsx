"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export const ChatGPTAllowlistingBanner = () => {
  const t = useTranslations("Home.AllowlistingBanner");
  
  return (
    <section className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-y border-green-500/20 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex w-12 h-12 rounded-full bg-green-500/10 items-center justify-center shrink-0">
              <ShieldCheck className="text-green-500" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/30 rounded text-xs font-bold text-green-400 uppercase tracking-wider">
                  {t("badge")}
                </span>
                <span className="text-sm text-gray-400 flex items-center gap-1">
                  <Search size={12} /> {t("category")}
                </span>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white">
                {t("title")}
              </h3>
              <p className="text-sm text-gray-400 max-w-xl">
                {t("description")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <Link href="/chatgpt-allowlisting">
              <Button 
                variant="outline" 
                className="border-green-500/50 text-green-400 hover:bg-green-500/10 hover:text-green-300 group"
              >
                {t("cta")}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
};
