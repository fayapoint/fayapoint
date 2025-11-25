"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    company: "",
    role: "",
    details: "",
  });
  const [isLoading, setIsLoading] = useState(false);

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
      const upsertResponse = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          role: formData.role.trim() || undefined,
          interest: [formData.company.trim(), formData.details.trim()].filter(Boolean).join(" — ") || undefined,
          source,
        }),
      });

      if (!upsertResponse.ok) {
        throw new Error(t("messages.saveError"));
      }

      const slotResponse = await fetch("/api/calendar/next-slot", { cache: "no-store" });

      if (!slotResponse.ok) {
        throw new Error(t("messages.slotError"));
      }

      const data = await slotResponse.json();

      if (!data?.bookingUrl) {
        throw new Error(t("messages.unexpectedResponse"));
      }

      toast.success(t("messages.success"));
      onSuccess?.();
      window.location.href = data.bookingUrl as string;
    } catch (error) {
      console.error("ScheduleMeetingForm error", error);
      toast.error(t("messages.genericError"));
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
