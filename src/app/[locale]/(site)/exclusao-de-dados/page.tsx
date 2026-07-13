"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Trash2, Mail, Clock, CheckCircle } from "lucide-react";

export default function DataDeletionPage() {
  const t = useTranslations("DataDeletion");

  return (
    <div className="min-h-screen bg-background text-foreground">

      <main className="pt-32 pb-20">
        {/* Hero */}
        <section className="container mx-auto px-4 text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
              <Trash2 size={16} className="text-red-400" />
              <span className="text-sm text-red-300">{t("badge")}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t("title")}
            </h1>
            <p className="text-muted-foreground">{t("lastUpdated")}</p>
          </motion.div>
        </section>

        {/* Content */}
        <section className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-secondary border border-border rounded-2xl p-8 md:p-12"
          >
            <div className="prose prose-invert prose-lg max-w-none">
              <p className="text-muted-foreground mb-8">{t("intro")}</p>

              {/* How to request */}
              <div className="mb-10">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-red-400">1.</span> {t("howToRequest.title")}
                </h2>
                <p className="text-muted-foreground mb-4">{t("howToRequest.description")}</p>
                <div className="bg-secondary border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Mail className="text-red-400" size={20} />
                    <span className="text-white font-semibold">
                      fayai.com.br@gmail.com
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {t("howToRequest.emailNote")}
                  </p>
                </div>
              </div>

              {/* What we delete */}
              <div className="mb-10">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-red-400">2.</span> {t("whatWeDelete.title")}
                </h2>
                <ul className="space-y-3">
                  {(t.raw("whatWeDelete.items") as string[]).map(
                    (item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle
                          size={18}
                          className="text-red-400 mt-1 shrink-0"
                        />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>

              {/* Timeline */}
              <div className="mb-10">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-red-400">3.</span> {t("timeline.title")}
                </h2>
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <Clock className="text-red-400" size={20} />
                  <span className="text-red-300">{t("timeline.description")}</span>
                </div>
              </div>

              {/* What we keep */}
              <div className="mb-10">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-red-400">4.</span> {t("whatWeKeep.title")}
                </h2>
                <p className="text-muted-foreground">{t("whatWeKeep.description")}</p>
              </div>

              {/* LGPD */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-red-400">5.</span> {t("lgpd.title")}
                </h2>
                <p className="text-muted-foreground">{t("lgpd.description")}</p>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

    </div>
  );
}
