"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getLocations } from "@/lib/location";
import type { Location, LoadFormData } from "@/lib/types";

interface LoadFormProps {
  onSubmit: (data: LoadFormData) => Promise<void>;
  submitLabel?: string;
}

export default function LoadForm({ onSubmit, submitLabel = "Post Load" }: LoadFormProps) {
  const [formData, setFormData] = useState<LoadFormData>({
    origin_location_id: "",
    destination_location_id: "",
    loading_date: "",
  });

  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);

  // Origin state/city selection helpers
  const [originState, setOriginState] = useState("");
  const [destinationState, setDestinationState] = useState("");

  // Fetch locations on mount
  useEffect(() => {
    const fetchLocations = async () => {
      setLoadingLocations(true);
      try {
        const result = await getLocations();
        if (result.error) {
          console.error("[LoadForm] Error fetching locations:", result.error);
          setLocations([]);
        } else {
          setLocations(result.locations);
        }
      } catch (err) {
        console.error("[LoadForm] Exception fetching locations:", err);
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
    const uniqueStates = Array.from(new Set(locations.map((l) => l.state))).sort();
    return uniqueStates;
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

    if (!formData.origin_location_id) {
      setError("Origin location is required");
      setShowErrorPopup(true);
      setLoading(false);
      return;
    }

    if (!formData.destination_location_id) {
      setError("Destination location is required");
      setShowErrorPopup(true);
      setLoading(false);
      return;
    }

    if (formData.origin_location_id === formData.destination_location_id) {
      setError("Origin and destination must be different");
      setShowErrorPopup(true);
      setLoading(false);
      return;
    }

    if (!formData.loading_date) {
      setError("Loading date is required");
      setShowErrorPopup(true);
      setLoading(false);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (submitErr) {
      const errorMessage =
        submitErr instanceof Error ? submitErr.message : "Failed to post load";
      setError(errorMessage);
      setShowErrorPopup(true);
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Origin Location */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Origin <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, origin_location_id: e.target.value }))
              }
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
        </div>

        {/* Destination Location */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Destination <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, destination_location_id: e.target.value }))
              }
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
        </div>

        {/* Loading Date */}
        <div>
          <label htmlFor="loading_date" className="block text-sm font-medium text-foreground mb-2">
            Loading Date <span className="text-destructive">*</span>
          </label>
          <input
            id="loading_date"
            type="date"
            value={formData.loading_date}
            onChange={(e) => setFormData((prev) => ({ ...prev, loading_date: e.target.value }))}
            min={new Date().toISOString().split("T")[0]}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            required
            disabled={loading}
          />
        </div>

        {/* Submit Button */}
        <div className="flex flex-col gap-3 pt-4 sm:flex-row">
          <button
            type="submit"
            disabled={loading || loadingLocations}
            className="w-full sm:flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Posting..." : submitLabel}
          </button>
          <Link
            href="/shipper/dashboard"
            className="w-full sm:w-auto text-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
            if (e.target === e.currentTarget) {
              setShowErrorPopup(false);
              setError("");
            }
          }}
        >
          <div className="rounded-lg border border-border bg-card p-6 shadow-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-card-foreground mb-2">Error</h2>
            <p className="text-sm text-destructive mb-6">{error}</p>
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
