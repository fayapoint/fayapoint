"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";
import { ShoppingCart, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { useServiceCart } from "@/contexts/ServiceCartContext";

export interface FormFieldsCopy {
  fullName: string;
  email: string;
  company?: string;
  role?: string;
  details?: string;
  detailsPlaceholder?: string;
}

export interface ScheduleMeetingFormCopy {
  badge?: string;
  title: string;
  description?: string;
  submit: string;
  fields: FormFieldsCopy;
}

export interface ScheduleMeetingFormProps {
  copy: ScheduleMeetingFormCopy;
  showCompanyRole?: boolean;
  className?: string;
  source?: string;
  onSuccess?: () => void;
}

export function ScheduleMeetingForm({
  copy,
  showCompanyRole = true,
  className,
  source = "calendar",
  onSuccess,
}: ScheduleMeetingFormProps) {
  const t = useTranslations("ScheduleMeeting");
  const { user, isLoggedIn } = useUser();
  const { items: cartItems, cartTotal, itemCount } = useServiceCart();
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    company: "",
    role: "",
    details: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isPreFilled, setIsPreFilled] = useState(false);

  // Pre-fill form with user data when available
  useEffect(() => {
    if (isLoggedIn && user && !isPreFilled) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || prev.fullName,
        email: user.email || prev.email,
        company: user.profile?.company || prev.company,
        role: user.profile?.position || prev.role,
      }));
      setIsPreFilled(true);
    }
  }, [isLoggedIn, user, isPreFilled]);

  // Build cart summary for the details field
  const cartSummary = useMemo(() => {
    if (itemCount === 0) return "";
    
    const itemsList = Object.values(cartItems).map(item => {
      const priceFormatted = new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }).format(item.price * item.quantity);
      return `• ${item.name} (x${item.quantity}) - ${priceFormatted}`;
    }).join("\n");
    
    const totalFormatted = new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(cartTotal);
    
    return `🛒 Itens selecionados:\n${itemsList}\n💰 Total: ${totalFormatted}`;
  }, [cartItems, cartTotal, itemCount]);

  // Auto-populate details with cart summary if there are items and details is empty
  useEffect(() => {
    if (cartSummary && !formData.details) {
      setFormData(prev => ({
        ...prev,
        details: cartSummary,
      }));
    }
  }, [cartSummary, formData.details]);

  const handleChange = (field: keyof typeof formData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.fullName.trim() || !formData.email.trim()) {
      toast.error(t("messages.nameEmailRequired"));
      return;
    }

    setIsLoading(true);

    try {
      // Build cart items array for the API
      const cartItemsArray = Object.values(cartItems).map(item => ({
        id: item.id,
        type: item.type,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        serviceSlug: item.serviceSlug,
        unitLabel: item.unitLabel,
        track: item.track,
        slug: item.slug,
      }));

      // Use the new consultation request API
      const response = await fetch("/api/consultation/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          company: formData.company.trim() || undefined,
          role: formData.role.trim() || undefined,
          details: formData.details.trim() || undefined,
          source,
          referrerUrl: typeof window !== 'undefined' ? window.location.href : undefined,
          cartItems: cartItemsArray,
          cartTotal: cartTotal,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t("messages.saveError"));
      }

      const data = await response.json();

      if (!data?.bookingUrl) {
        throw new Error(t("messages.unexpectedResponse"));
      }

      toast.success(t("messages.success"));
      
      // Optionally clear cart after successful submission
      // clearCart();
      
      onSuccess?.();
      window.location.href = data.bookingUrl as string;
    } catch (error) {
      console.error("ScheduleMeetingForm error", error);
      toast.error(error instanceof Error ? error.message : t("messages.genericError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("grid gap-5", className)}>
      {copy.badge ? (
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground mb-1">{copy.badge}</p>
      ) : null}
      <div>
        <h2 className="text-3xl font-semibold mb-1">{copy.title}</h2>
        {copy.description ? (
          <p className="text-muted-foreground text-sm">{copy.description}</p>
        ) : null}
      </div>

      {/* Show logged-in indicator */}
      {isLoggedIn && user && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg text-sm">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="text-green-700 dark:text-green-300">
            Logado como <strong>{user.name}</strong>
          </span>
        </div>
      )}

      {/* Cart summary card */}
      {itemCount > 0 && (
        <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-purple-700 dark:text-purple-300">
              {itemCount} {itemCount === 1 ? 'item' : 'itens'} no carrinho
            </span>
          </div>
          <div className="space-y-2">
            {Object.values(cartItems).map(item => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  {item.name} <span className="text-xs">(x{item.quantity})</span>
                </span>
                <span className="font-medium">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                    .format(item.price * item.quantity)}
                </span>
              </div>
            ))}
            <div className="pt-2 border-t border-purple-200 dark:border-purple-700 flex justify-between items-center font-semibold">
              <span>Total</span>
              <span className="text-purple-700 dark:text-purple-300">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}
              </span>
            </div>
          </div>
        </div>
      )}

      <Input
        placeholder={copy.fields.fullName}
        value={formData.fullName}
        onChange={handleChange("fullName")}
        className="h-12"
        required
      />
      <Input
        type="email"
        placeholder={copy.fields.email}
        value={formData.email}
        onChange={handleChange("email")}
        className="h-12"
        required
      />

      {showCompanyRole ? (
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            placeholder={copy.fields.company}
            value={formData.company}
            onChange={handleChange("company")}
            className="h-12"
          />
          <Input
            placeholder={copy.fields.role}
            value={formData.role}
            onChange={handleChange("role")}
            className="h-12"
          />
        </div>
      ) : null}

      <Textarea
        placeholder={copy.fields.details ?? copy.fields.detailsPlaceholder}
        value={formData.details}
        onChange={handleChange("details")}
        rows={itemCount > 0 ? 6 : 4}
      />

      <Button
        type="submit"
        className="h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        disabled={isLoading}
      >
        {isLoading ? t("submitting") : copy.submit}
      </Button>
      <p className="text-xs text-muted-foreground">
        {t("footer")}
      </p>
    </form>
  );
}
