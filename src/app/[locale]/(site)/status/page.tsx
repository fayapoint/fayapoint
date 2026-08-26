import { obterT } from "@/i18n/dicionario-servidor";

import { getTranslations } from "next-intl/server";
import { Activity, CheckCircle, AlertCircle, Clock } from "lucide-react";

type Service = {
  name: string;
  status: "operational" | "degraded" | "outage";
  uptime: string;
};

export default async function StatusPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const T = await obterT(locale);
  const t = await getTranslations({ locale, namespace: "Status" });
  const services = t.raw("services") as Service[];

  const statusConfig = {
    operational: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", label: t("statusLabels.operational") },
    degraded: { icon: AlertCircle, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", label: t("statusLabels.degraded") },
    outage: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", label: t("statusLabels.outage") },
  };

  const allOperational = services.every(s => s.status === "operational");

  return (
    <div className="min-h-screen bg-background text-foreground">
      
      <main className="pt-32 pb-20">
        {/* Hero */}
        <section className="container mx-auto px-4 text-center mb-16">
          <div className="entra"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
              <Activity size={16} className="text-amber-400" />
              <span className="text-sm text-amber-300">{t("badge")}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("title")}</h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>
        </section>

        {/* Overall Status */}
        <section className="container mx-auto px-4 max-w-3xl mb-12">
          <div
            className={"entra-2 " + `p-6 rounded-2xl border ${allOperational ? 'bg-green-500/10 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}
          >
            <div className="flex items-center justify-center gap-3">
              <CheckCircle className={allOperational ? 'text-green-400' : 'text-yellow-400'} size={28} />
              <span className="text-xl font-semibold">
                {allOperational ? t("allOperational") : t("someIssues")}
              </span>
            </div>
          </div>
        </section>

        {/* Services List */}
        <section className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold mb-6">{t("servicesTitle")}</h2>
          <div className="space-y-4">
            {services.map((service, idx) => {
              const config = statusConfig[service.status];
              const Icon = config.icon;
              return (
                <div
                  key={service.name}
                  className={"entra-3 " + `flex items-center justify-between p-5 rounded-xl border ${config.bg} ${config.border}`}
                >
                  <div className="flex items-center gap-4">
                    <Icon className={config.color} size={24} />
                    <div>
                      <h3 className="font-semibold">{T(service.name)}</h3>
                      <p className="text-sm text-muted-foreground">{T(config.label)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock size={14} />
                      {t("uptime")}: {T(service.uptime)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Last Updated */}
        <section className="container mx-auto px-4 max-w-3xl mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            {t("lastUpdated")}: {new Date().toLocaleString()}
          </p>
        </section>
      </main>
      
    </div>
  );
}
