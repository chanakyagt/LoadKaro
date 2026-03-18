"use client";

import { useState } from "react";
import LocationSelector from "@/components/location-selector";

/**
 * Example: How to use LocationSelector in an order form
 * 
 * Replace your existing location text input with the LocationSelector component.
 * The selected city value will be sent as the 'location' field when the form is submitted.
 */

interface OrderFormData {
  // ... other fields
  location: string; // This will receive the selected city value
}

export default function OrderFormExample() {
  const [formData, setFormData] = useState<OrderFormData>({
    location: "", // This will store the selected city
    // ... other fields
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!formData.location) {
      setError("Location is required");
      setLoading(false);
      return;
    }

    try {
      // Submit form data
      // formData.location will contain the selected city value
      console.log("Submitting order with location:", formData.location);
      
      // Your submission logic here
      // await submitOrder(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit order");
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

      {/* Replace your existing location text input with this: */}
      <LocationSelector
        value={formData.location}
        onChange={(city) => setFormData(prev => ({ ...prev, location: city }))}
        label="Location"
        required
        disabled={loading}
        error={!formData.location && error ? "Location is required" : undefined}
      />

      {/* Other form fields... */}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Order"}
      </button>
    </form>
  );
}
