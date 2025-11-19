"use client";

import { toast as hotToast } from "react-hot-toast";

export type ToastFunction = typeof hotToast;

/**
 * Thin wrapper so legacy components can import `useToast` from the design system
 * while we centralize on `react-hot-toast` under the hood.
 */
export function useToast(): ToastFunction {
  return hotToast;
}

export const toast = hotToast;
