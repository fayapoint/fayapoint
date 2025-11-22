"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, X } from "lucide-react";
import { useServiceCart } from "@/contexts/ServiceCartContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function FloatingCart() {
  const { itemCount, items, clearCart } = useServiceCart();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const locale = useLocale();

  // Don't show if empty
  if (itemCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="rounded-full shadow-xl h-16 w-16 relative"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ShoppingCart className="w-8 h-8" />
          <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 rounded-full">
            {itemCount}
          </Badge>
        </Button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 flex items-end sm:items-center justify-center p-4 sm:p-0">
          <div className="fixed bottom-24 right-6 z-50 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <Card className="p-4 shadow-2xl border-primary/20 animate-in slide-in-from-bottom-5 fade-in duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Seu Carrinho</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Você tem {itemCount} item(s) selecionado(s).
                </p>
                
                <div className="grid grid-cols-2 gap-2">
                   <Button variant="outline" onClick={clearCart}>
                     Limpar
                   </Button>
                   <Button onClick={() => {
                     // Redirect to the most relevant builder or a checkout page
                     // For now, let's go to the website builder as a default checkout point
                     router.push(`/servicos/construcao-de-sites#builder`);
                     setIsOpen(false);
                   }}>
                     Ver Detalhes
                   </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
