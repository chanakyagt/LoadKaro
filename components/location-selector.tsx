"use client";

import { useState, useEffect } from "react";
import { getStates, getCities } from "@/lib/location";

interface LocationSelectorProps {
  value?: string; // Selected city value
  onChange: (city: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

export default function LocationSelector({
  value = "",
  onChange,
  label = "Location",
  required = false,
  disabled = false,
  error,
}: LocationSelectorProps) {
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>(value || "");
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);

  // Step 1: Fetch distinct states on component mount
  useEffect(() => {
    const fetchStates = async () => {
      console.log("[LocationSelector] Step 1: Fetching unique states from backend...");
      setLoadingStates(true);
      try {
        const result = await getStates();
        console.log("[LocationSelector] Step 1 Response:", { 
          hasError: !!result.error, 
          error: result.error, 
          statesCount: result.states.length,
          states: result.states 
        });

        if (result.error) {
          console.error("[LocationSelector] Error fetching states:", result.error);
          setStates([]);
        } else {
          setStates(result.states);
          console.log("[LocationSelector] States populated in dropdown:", result.states.length, "states");
        }
      } catch (err: unknown) {
        console.error("[LocationSelector] Exception while fetching states:", err);
        setStates([]);
      } finally {
        setLoadingStates(false);
        console.log("[LocationSelector] Step 1: States loading complete");
      }
    };

    fetchStates();
  }, []);

  // Step 2: Fetch cities when state is selected
  useEffect(() => {
    const fetchCities = async () => {
      if (!selectedState) {
        console.log("[LocationSelector] Step 2: No state selected, clearing cities");
        setCities([]);
        setSelectedCity("");
        // Don't call onChange here - only call it when user actually selects a city
        return;
      }

      console.log("[LocationSelector] Step 2: State selected:", selectedState);
      console.log("[LocationSelector] Step 2: Sending state to backend to fetch associated cities...");
      setLoadingCities(true);
      try {
        const result = await getCities(selectedState);
        console.log("[LocationSelector] Step 2 Response:", { 
          selectedState,
          hasError: !!result.error, 
          error: result.error, 
          citiesCount: result.cities.length,
          cities: result.cities 
        });

        if (result.error) {
          console.error("[LocationSelector] Error fetching cities for state:", selectedState, result.error);
          setCities([]);
        } else {
          setCities(result.cities);
          console.log("[LocationSelector] Cities populated in dropdown:", result.cities.length, "cities for", selectedState);
        }
        
        // Reset city selection when state changes
        setSelectedCity("");
        console.log("[LocationSelector] City selection reset (state changed)");
        // Don't call onChange here - only call it when user actually selects a city
      } catch (err) {
        console.error("[LocationSelector] Exception while fetching cities for state:", selectedState, err);
        setCities([]);
      } finally {
        setLoadingCities(false);
        console.log("[LocationSelector] Step 2: Cities loading complete");
      }
    };

    fetchCities();
  }, [selectedState]);

  // Sync external value changes (only when value prop changes, not when selectedCity changes)
  useEffect(() => {
    if (value !== selectedCity) {
      setSelectedCity(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]); // selectedCity intentionally excluded to prevent infinite loop

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value;
    console.log("[LocationSelector] State dropdown changed:", { from: selectedState, to: newState });
    setSelectedState(newState);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value;
    console.log("[LocationSelector] City selected:", { state: selectedState, city });
    setSelectedCity(city);
    onChange(city);
    console.log("[LocationSelector] City value sent to parent via onChange:", city);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <div className="grid grid-cols-2 gap-3">
        {/* State Dropdown */}
        <div>
          <select
            value={selectedState}
            onChange={handleStateChange}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
            required={required}
            disabled={disabled || loadingStates}
          >
            <option value="">
              {loadingStates ? "Loading states..." : "Select State"}
            </option>
            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        {/* City Dropdown */}
        <div>
          <select
            value={selectedCity}
            onChange={handleCityChange}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
            required={required}
            disabled={disabled || loadingCities || !selectedState}
          >
            <option value="">
              {!selectedState
                ? "Select state first"
                : loadingCities
                ? "Loading cities..."
                : cities.length === 0
                ? "No cities available"
                : "Select City"}
            </option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
