"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ScheduleMeetingForm,
  type ScheduleMeetingFormCopy,
  type FormFieldsCopy,
} from "@/components/consultation/ScheduleMeetingForm";

export type ScheduleConsultationButtonProps = React.ComponentProps<typeof Button> & {
  source?: string;
  showCompanyRole?: boolean;
  copyOverride?: Partial<ScheduleMeetingFormCopy>;
  dialogTitle?: ReactNode;
  dialogDescription?: ReactNode;
};

export function ScheduleConsultationButton({
  children,
  source = "global-cta",
  showCompanyRole = false,
  copyOverride,
  dialogTitle,
  dialogDescription,
  ...buttonProps
}: ScheduleConsultationButtonProps) {
  const t = useTranslations("Consultation");
  const [open, setOpen] = useState(false);

  const baseFields: FormFieldsCopy = useMemo(
    () => ({
      fullName: t("fields.name"),
      email: t("fields.email"),
      company: "Empresa",
      role: "Cargo",
      details: t("fields.details"),
      detailsPlaceholder: t("fields.detailsPlaceholder"),
    }),
    [t],
  );

  const baseCopy: ScheduleMeetingFormCopy = useMemo(
    () => ({
      badge: undefined,
      title: t("title"),
      description: t("description"),
      submit: t("submit"),
      fields: baseFields,
    }),
    [baseFields, t],
  );

  const mergedCopy: ScheduleMeetingFormCopy = useMemo(() => {
    if (!copyOverride) {
      return baseCopy;
    }

    return {
      ...baseCopy,
      ...copyOverride,
      fields: {
        ...baseCopy.fields,
        ...copyOverride.fields,
      },
    };
  }, [baseCopy, copyOverride]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button {...buttonProps}>{children ?? t("ctaLabel")}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl" showCloseButton>
        <DialogHeader className="space-y-1">
          <DialogTitle>{dialogTitle ?? mergedCopy.title}</DialogTitle>
          <DialogDescription>{dialogDescription ?? mergedCopy.description}</DialogDescription>
        </DialogHeader>
        <ScheduleMeetingForm
          copy={mergedCopy}
          showCompanyRole={showCompanyRole}
          source={source}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
