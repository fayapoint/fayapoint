"use client";

import { useState } from "react";
import { ShoppingCart, X, Trash2 } from "lucide-react";
import { useServiceCart } from "@/contexts/ServiceCartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function NavCart() {
  const { itemCount, items, clearCart, removeItem, cartTotal } = useServiceCart();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const cartItems = Object.values(items);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-foreground/80 hover:text-primary">
          <ShoppingCart className="w-5 h-5" />
          {itemCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 rounded-full text-[10px]">
              {itemCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-4" align="end">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm">Seu Carrinho</h3>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
            <X className="w-3 h-3" />
          </Button>
        </div>
        
        {itemCount === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Seu carrinho está vazio.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-[300px] pr-4 overflow-y-auto">
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-2 border-b border-border/50 pb-3 last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-none mb-1.5">{item.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                          {item.type === 'course' ? 'Curso' : 'Serviço'}
                        </Badge>
                        <span>{item.quantity}x {currencyFormatter.format(item.price)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-sm font-semibold">
                        {currencyFormatter.format(item.price * item.quantity)}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between font-bold">
                <span>Total</span>
                <span>{currencyFormatter.format(cartTotal)}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                 <Button variant="outline" size="sm" onClick={clearCart}>
                   Limpar
                 </Button>
                 <Button size="sm" onClick={() => {
                   router.push(`/checkout/cart`); // We might need a cart page or checkout
                   setIsOpen(false);
                 }}>
                   Finalizar Compra
                 </Button>
              </div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
