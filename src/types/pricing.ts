export type PriceUnitType =
  | "per_project"
  | "per_screen"
  | "per_page"
  | "per_hour"
  | "per_day"
  | "per_month"
  | "per_workflow"
  | "per_collection"
  | "per_minute"
  | "per_release"
  | "per_language"
  | "per_format";

export interface ServicePrice {
  _id?: string;
  category: string;
  serviceSlug: string;
  track: string;
  unitLabel: string;
  description: string;
  unitType: PriceUnitType;
  minQuantity: number;
  defaultQuantity: number;
  priceRange: {
    currency: string;
    min: number;
    recommended: number;
    max: number;
  };
  dependencies?: string[];
  upsellSuggestions?: string[];
  tags?: string[];
  lastValidatedAt: string;
  createdAt?: string;
  updatedAt?: string;
}
