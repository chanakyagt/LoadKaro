"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { TruckFormData, TruckVariant } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

type TruckCategory = 
  | "open"
  | "container"
  | "lcv"
  | "mini_pickup"
  | "trailer"
  | "tipper"
  | "tanker"
  | "dumper"
  | "bulker";

type PermitType = 
  | "national_permit"
  | "state_permit"
  | "all_india_permit"
  | "goods_carriage"
  | "contract_carriage";

interface TruckFormProps {
  initialData?: Partial<TruckFormData>;
  onSubmit: (data: TruckFormData) => Promise<void>;
  submitLabel?: string;
}

const TRUCK_CATEGORIES: TruckCategory[] = [
  "open",
  "container",
  "lcv",
  "mini_pickup",
  "trailer",
  "tipper",
  "tanker",
  "dumper",
  "bulker",
];

const PERMIT_TYPES: PermitType[] = [
  "national_permit",
  "state_permit",
  "all_india_permit",
  "goods_carriage",
  "contract_carriage",
];

import { formatCategoryName, formatPermitType } from "@/lib/utils/truck-formatting";

export default function TruckForm({ initialData, onSubmit, submitLabel = "Save Truck" }: TruckFormProps) {
  const [formData, setFormData] = useState<TruckFormData>({
    category: (initialData?.category as TruckCategory) || "open",
    variant_id: initialData?.variant_id || "",
    capacity_tons: initialData?.capacity_tons || 0,
    permit_type: (initialData?.permit_type as PermitType) || "national_permit",
    axle_count: initialData?.axle_count || 0,
    wheel_count: initialData?.wheel_count || 0,
    internal_length: initialData?.internal_length || 0,
    internal_width: initialData?.internal_width || 0,
    internal_height: initialData?.internal_height || 0,
    gps_available: initialData?.gps_available ?? false,
  });

  const [variants, setVariants] = useState<TruckVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingVariants, setLoadingVariants] = useState(false);

  // Fetch variants when category changes
  useEffect(() => {
    const fetchVariants = async () => {
      if (!formData.category) return;
      
      setLoadingVariants(true);
      setFormData(prev => ({ ...prev, variant_id: "" })); // Reset variant when category changes
      
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("truck_variants")
          .select("*")
          .eq("category", formData.category)
          .eq("is_active", true)
          .order("display_name", { ascending: true });

        if (error) throw error;
        setVariants((data || []) as TruckVariant[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load variants");
      } finally {
        setLoadingVariants(false);
      }
    };

    fetchVariants();
  }, [formData.category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!formData.category) {
      setError("Category is required");
      setLoading(false);
      return;
    }

    if (!formData.variant_id) {
      setError("Variant is required");
      setLoading(false);
      return;
    }

    if (!formData.permit_type) {
      setError("Permit type is required");
      setLoading(false);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save truck");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
          Category <span className="text-destructive">*</span>
        </label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as TruckCategory, variant_id: "" }))}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          required
          disabled={loading}
        >
          <option value="">Select category</option>
          {TRUCK_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {formatCategoryName(cat)}
            </option>
          ))}
        </select>
      </div>

      {/* Variant */}
      <div>
        <label htmlFor="variant_id" className="block text-sm font-medium text-foreground mb-2">
          Variant <span className="text-destructive">*</span>
        </label>
        <select
          id="variant_id"
          value={formData.variant_id}
          onChange={(e) => setFormData(prev => ({ ...prev, variant_id: e.target.value }))}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
          required
          disabled={loading || loadingVariants || !formData.category || variants.length === 0}
        >
          <option value="">
            {loadingVariants ? "Loading variants..." : variants.length === 0 ? "No variants available" : "Select variant"}
          </option>
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.display_name}
            </option>
          ))}
        </select>
      </div>

      {/* Permit Type */}
      <div>
        <label htmlFor="permit_type" className="block text-sm font-medium text-foreground mb-2">
          Permit Type <span className="text-destructive">*</span>
        </label>
        <select
          id="permit_type"
          value={formData.permit_type}
          onChange={(e) => setFormData(prev => ({ ...prev, permit_type: e.target.value as PermitType }))}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          required
          disabled={loading}
        >
          {PERMIT_TYPES.map((type) => (
            <option key={type} value={type}>
              {formatPermitType(type)}
            </option>
          ))}
        </select>
      </div>

      {/* Capacity */}
      <div>
        <label htmlFor="capacity_tons" className="block text-sm font-medium text-foreground mb-2">
          Capacity (tons)
        </label>
        <input
          id="capacity_tons"
          type="number"
          step="0.01"
          min="0"
          value={formData.capacity_tons || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, capacity_tons: parseFloat(e.target.value) || 0 }))}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          disabled={loading}
        />
      </div>

      {/* Axle Count */}
      <div>
        <label htmlFor="axle_count" className="block text-sm font-medium text-foreground mb-2">
          Axle Count
        </label>
        <input
          id="axle_count"
          type="number"
          min="0"
          value={formData.axle_count || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, axle_count: parseInt(e.target.value) || 0 }))}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          disabled={loading}
        />
      </div>

      {/* Wheel Count */}
      <div>
        <label htmlFor="wheel_count" className="block text-sm font-medium text-foreground mb-2">
          Wheel Count
        </label>
        <input
          id="wheel_count"
          type="number"
          min="0"
          value={formData.wheel_count || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, wheel_count: parseInt(e.target.value) || 0 }))}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          disabled={loading}
        />
      </div>

      {/* Internal Dimensions */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="internal_length" className="block text-sm font-medium text-foreground mb-2">
            Length (m)
          </label>
          <input
            id="internal_length"
            type="number"
            step="0.01"
            min="0"
            value={formData.internal_length || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, internal_length: parseFloat(e.target.value) || 0 }))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="internal_width" className="block text-sm font-medium text-foreground mb-2">
            Width (m)
          </label>
          <input
            id="internal_width"
            type="number"
            step="0.01"
            min="0"
            value={formData.internal_width || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, internal_width: parseFloat(e.target.value) || 0 }))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="internal_height" className="block text-sm font-medium text-foreground mb-2">
            Height (m)
          </label>
          <input
            id="internal_height"
            type="number"
            step="0.01"
            min="0"
            value={formData.internal_height || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, internal_height: parseFloat(e.target.value) || 0 }))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            disabled={loading}
          />
        </div>
      </div>

      {/* GPS Available */}
      <div className="flex items-center gap-3">
        <input
          id="gps_available"
          type="checkbox"
          checked={formData.gps_available}
          onChange={(e) => setFormData(prev => ({ ...prev, gps_available: e.target.checked }))}
          className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
          disabled={loading}
        />
        <label htmlFor="gps_available" className="text-sm font-medium text-foreground">
          GPS Available
        </label>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : submitLabel}
        </button>
        <Link
          href="/trucks"
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
