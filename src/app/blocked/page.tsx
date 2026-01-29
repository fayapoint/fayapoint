"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ShieldX, Globe2, MapPin, AlertTriangle } from "lucide-react";

function BlockedContent() {
  const searchParams = useSearchParams();
  const fromCountry = searchParams.get("from") || "Unknown";
  const attemptedPath = searchParams.get("path") || "/";

  // Country code to name mapping for common attacking countries
  const countryNames: Record<string, string> = {
    US: "United States",
    CN: "China",
    HK: "Hong Kong",
    RU: "Russia",
    KR: "South Korea",
    JP: "Japan",
    DE: "Germany",
    FR: "France",
    GB: "United Kingdom",
    IN: "India",
    SG: "Singapore",
    NL: "Netherlands",
    VN: "Vietnam",
    TW: "Taiwan",
    UA: "Ukraine",
    Unknown: "Unknown Location",
  };

  const countryName = countryNames[fromCountry] || fromCountry;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-red-500/30 shadow-2xl shadow-red-900/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border-b border-red-500/30 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <ShieldX className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Acesso Restrito / Access Restricted
                </h1>
                <p className="text-red-300/80 text-sm mt-1">
                  Geoblocking Active
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Portuguese Message */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-2xl">🇧🇷</span> Português
              </h2>
              <p className="text-gray-300 leading-relaxed">
                Este site está disponível <strong className="text-green-400">apenas para usuários no Brasil</strong>. 
                Detectamos que você está acessando de <strong className="text-red-400">{countryName}</strong>.
              </p>
              <p className="text-gray-400 text-sm">
                Se você é brasileiro e está usando VPN, por favor desative-a e tente novamente.
                Se você acredita que isso é um erro, entre em contato conosco.
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-700/50" />

            {/* English Message */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-2xl">🌎</span> English
              </h2>
              <p className="text-gray-300 leading-relaxed">
                This website is <strong className="text-green-400">only available for users in Brazil</strong>. 
                We detected that you are accessing from <strong className="text-red-400">{countryName}</strong>.
              </p>
              <p className="text-gray-400 text-sm">
                If you are Brazilian and using a VPN, please disable it and try again.
                If you believe this is an error, please contact us.
              </p>
            </div>

            {/* Detection Info */}
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Detection Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-500">Country:</span>
                  <span className="text-red-400 font-mono">{fromCountry}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-500">Path:</span>
                  <span className="text-gray-400 font-mono truncate">{attemptedPath}</span>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="text-center pt-4">
              <p className="text-gray-500 text-sm">
                Contato / Contact:{" "}
                <a 
                  href="mailto:contato@fayapoint.com" 
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  contato@fayapoint.com
                </a>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-900/50 border-t border-gray-700/50 px-6 py-4">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>© {new Date().getFullYear()} Fayapoint</span>
              <span className="flex items-center gap-1">
                <ShieldX className="w-3 h-3" />
                Protected by Geoblocking
              </span>
            </div>
          </div>
        </div>

        {/* Additional Warning */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs">
            Repeated attempts to bypass this restriction may result in permanent IP blocking.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BlockedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    }>
      <BlockedContent />
    </Suspense>
  );
}
