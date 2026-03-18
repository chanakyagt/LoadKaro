"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AvailabilityFormData } from "@/app/(dashboard)/availability/actions";
import { getLocations, type Location } from "@/app/(dashboard)/availability/location-actions";
import { formatCategoryName } from "@/lib/utils/truck-formatting";
import { createClient } from "@/lib/supabase/client";

interface AvailabilityFormProps {
  trucks: Array<{ id: string; category: string; variant_id: string; variant_display_name: string | null }>;
  onSubmit: (data: AvailabilityFormData) => Promise<void>;
  submitLabel?: string;
}

export default function AvailabilityForm({ trucks, onSubmit, submitLabel = "Create Availability" }: AvailabilityFormProps) {
  const [formData, setFormData] = useState<AvailabilityFormData>({
    truck_id: "",
    origin_location_id: "",
    destination_location_id: "",
    available_from: "",
    available_till: "",
    expected_rate: undefined,
  });

  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);

  // State/city selection helpers
  const [originState, setOriginState] = useState("");
  const [destinationState, setDestinationState] = useState("");

  // Fetch locations on mount
  useEffect(() => {
    const fetchLocations = async () => {
      setLoadingLocations(true);
      try {
        const result = await getLocations();
        if (result.error) {
          console.error("[AvailabilityForm] Error fetching locations:", result.error);
          setLocations([]);
        } else {
          setLocations(result.locations);
        }
      } catch (err) {
        console.error("[AvailabilityForm] Exception fetching locations:", err);
        setLocations([]);
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchLocations();
  }, []);

  // Handle Escape key to close popup
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showErrorPopup) {
        setShowErrorPopup(false);
        setError("");
      }
    };

    if (showErrorPopup) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [showErrorPopup]);

  // Derive unique states from locations
  const states = useMemo(() => {
    return Array.from(new Set(locations.map((l) => l.state))).sort();
  }, [locations]);

  // Derive cities for origin state
  const originCities = useMemo(() => {
    if (!originState) return [];
    return locations.filter((l) => l.state === originState);
  }, [locations, originState]);

  // Derive cities for destination state
  const destinationCities = useMemo(() => {
    if (!destinationState) return [];
    return locations.filter((l) => l.state === destinationState);
  }, [locations, destinationState]);

  const handleOriginStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOriginState(e.target.value);
    setFormData((prev) => ({ ...prev, origin_location_id: "" }));
  };

  const handleDestinationStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDestinationState(e.target.value);
    setFormData((prev) => ({ ...prev, destination_location_id: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!formData.truck_id) {
      setError("Truck selection is required");
      setShowErrorPopup(true);
      setLoading(false);
      return;
    }

    if (!formData.origin_location_id) {
      setError("Current location is required");
      setShowErrorPopup(true);
      setLoading(false);
      return;
    }

    if (!formData.destination_location_id) {
      setError("Preferred destination is required");
      setShowErrorPopup(true);
      setLoading(false);
      return;
    }

    if (!formData.available_from) {
      setError("Available from date is required");
      setShowErrorPopup(true);
      setLoading(false);
      return;
    }

    // Validate date logic
    if (formData.available_till && formData.available_from) {
      const fromDate = new Date(formData.available_from);
      const tillDate = new Date(formData.available_till);
      if (tillDate < fromDate) {
        setError("Available till date must be after available from date");
        setShowErrorPopup(true);
        setLoading(false);
        return;
      }
    }

    // Frontend validation: prevent overlapping availabilities for the same truck
    try {
      const supabase = createClient();

      console.log("[AvailabilityForm] Checking for overlapping availabilities...", {
        truck_id: formData.truck_id,
        available_from: formData.available_from,
        available_till: formData.available_till,
      });

      const { data, error: overlapError } = await supabase
        .from("availabilities")
        .select("available_from, available_till")
        .eq("truck_id", formData.truck_id)
        .eq("status", "active");

      if (overlapError) {
        console.error("[AvailabilityForm] Error checking overlaps:", overlapError.message);
        // Don't block submission on a validation query error – backend trigger is still the final safety net
      } else if (data && data.length > 0) {
        const newStart = new Date(formData.available_from);
        const newEnd = new Date(formData.available_till || formData.available_from);

        const hasOverlap = data.some((row) => {
          const existingStart = new Date(row.available_from as string);
          const existingEnd = new Date(
            (row.available_till as string | null) || row.available_from
          );

          // Overlap if ranges intersect: [newStart, newEnd] intersects [existingStart, existingEnd]
          return newStart <= existingEnd && newEnd >= existingStart;
        });

        console.log("[AvailabilityForm] Overlap check result:", {
          existingCount: data.length,
          hasOverlap,
        });

        if (hasOverlap) {
          setError("This truck already has availability for the selected dates.");
          setShowErrorPopup(true);
          setLoading(false);
          return;
        }
      }

      // If no overlap (or validation query failed), proceed to submit.
      try {
        await onSubmit(formData);
      } catch (submitErr) {
        const errorMessage = submitErr instanceof Error
          ? submitErr.message
          : "Failed to create availability";
        setError(errorMessage);
        setShowErrorPopup(true);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("[AvailabilityForm] Unexpected error during overlap validation:", err);
      // As a fallback, still let the request go through – backend trigger will enforce the rule.
      try {
        await onSubmit(formData);
      } catch (submitErr) {
        const errorMessage = submitErr instanceof Error
          ? submitErr.message
          : "Failed to create availability";
        setError(errorMessage);
        setShowErrorPopup(true);
        setLoading(false);
        return;
      }
    }

    // If we reach here, submission succeeded
    setLoading(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">

      {/* Truck Selection */}
      <div>
        <label htmlFor="truck_id" className="block text-sm font-medium text-foreground mb-2">
          Select Truck <span className="text-destructive">*</span>
        </label>
        <select
          id="truck_id"
          value={formData.truck_id}
          onChange={(e) => setFormData(prev => ({ ...prev, truck_id: e.target.value }))}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          required
          disabled={loading || trucks.length === 0}
        >
          <option value="">
            {trucks.length === 0 ? "No trucks available" : "Select a truck"}
          </option>
          {trucks.map((truck) => (
            <option key={truck.id} value={truck.id}>
              {formatCategoryName(truck.category)} {truck.variant_display_name ? `- ${truck.variant_display_name}` : ""}
            </option>
          ))}
        </select>
        {trucks.length === 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            You need to add a truck first. <Link href="/trucks/new" className="text-primary hover:underline">Add truck</Link>
          </p>
        )}
      </div>

      {/* Current Location (Origin) */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Current Location <span className="text-destructive">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {/* Origin State */}
          <select
            value={originState}
            onChange={handleOriginStateChange}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
            required
            disabled={loading || loadingLocations}
          >
            <option value="">
              {loadingLocations ? "Loading states..." : "Select State"}
            </option>
            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>

          {/* Origin City — value is location UUID */}
          <select
            value={formData.origin_location_id}
            onChange={(e) => setFormData((prev) => ({ ...prev, origin_location_id: e.target.value }))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
            required
            disabled={loading || !originState}
          >
            <option value="">
              {!originState
                ? "Select state first"
                : originCities.length === 0
                ? "No cities available"
                : "Select City"}
            </option>
            {originCities.map((location) => (
              <option key={location.id} value={location.id}>
                {location.city}, {location.state}
              </option>
            ))}
          </select>
        </div>
        {!formData.origin_location_id && error.includes("location") && (
          <p className="mt-1 text-xs text-destructive">Current location is required</p>
        )}
      </div>

      {/* Preferred Destination */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Preferred Destination <span className="text-destructive">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {/* Destination State */}
          <select
            value={destinationState}
            onChange={handleDestinationStateChange}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
            required
            disabled={loading || loadingLocations}
          >
            <option value="">
              {loadingLocations ? "Loading states..." : "Select State"}
            </option>
            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>

          {/* Destination City — value is location UUID */}
          <select
            value={formData.destination_location_id}
            onChange={(e) => setFormData((prev) => ({ ...prev, destination_location_id: e.target.value }))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
            required
            disabled={loading || !destinationState}
          >
            <option value="">
              {!destinationState
                ? "Select state first"
                : destinationCities.length === 0
                ? "No cities available"
                : "Select City"}
            </option>
            {destinationCities.map((location) => (
              <option key={location.id} value={location.id}>
                {location.city}, {location.state}
              </option>
            ))}
          </select>
        </div>
        {!formData.destination_location_id && error.includes("destination") && (
          <p className="mt-1 text-xs text-destructive">Preferred destination is required</p>
        )}
      </div>

      {/* Available From */}
      <div>
        <label htmlFor="available_from" className="block text-sm font-medium text-foreground mb-2">
          Available From <span className="text-destructive">*</span>
        </label>
        <input
          id="available_from"
          type="date"
          value={formData.available_from}
          onChange={(e) => setFormData(prev => ({ ...prev, available_from: e.target.value }))}
          min={new Date().toISOString().split("T")[0]}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          required
          disabled={loading}
        />
      </div>

      {/* Available Till */}
      <div>
        <label htmlFor="available_till" className="block text-sm font-medium text-foreground mb-2">
          Available Till <span className="text-muted-foreground">(Optional)</span>
        </label>
        <input
          id="available_till"
          type="date"
          value={formData.available_till || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, available_till: e.target.value }))}
          min={formData.available_from || new Date().toISOString().split("T")[0]}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          disabled={loading}
        />
      </div>

      {/* Expected Rate */}
      <div>
        <label htmlFor="expected_rate" className="block text-sm font-medium text-foreground mb-2">
          Expected Rate <span className="text-muted-foreground">(Optional)</span>
        </label>
        <input
          id="expected_rate"
          type="number"
          step="0.01"
          min="0"
          value={formData.expected_rate || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, expected_rate: e.target.value ? parseFloat(e.target.value) : undefined }))}
          placeholder="Enter expected rate"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          disabled={loading}
        />
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading || trucks.length === 0 || loadingLocations}
          className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : submitLabel}
        </button>
        <Link
          href="/availability"
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Cancel
        </Link>
      </div>
    </form>

    {/* Error Popup Modal */}
    {showErrorPopup && error && (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={(e) => {
          // Close popup when clicking outside the modal content
          if (e.target === e.currentTarget) {
            setShowErrorPopup(false);
            setError("");
          }
        }}
      >
        <div className="rounded-lg border border-border bg-card p-6 shadow-lg max-w-md w-full mx-4">
          <h2 className="text-xl font-semibold text-card-foreground mb-2">
            Error
          </h2>
          <p className="text-sm text-destructive mb-6">
            {error}
          </p>
          <div className="flex justify-end">
            <button
              onClick={() => {
                setShowErrorPopup(false);
                setError("");
              }}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
