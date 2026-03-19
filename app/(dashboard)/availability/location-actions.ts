"use server";

import { createClient } from "@/lib/supabase/server";
import type { Location } from "@/lib/types";

// Fetch all locations with id, state, city (used by UUID-based location dropdowns)
export async function getLocations(): Promise<{ error: string | null; locations: Location[] }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("locations")
      .select("id, state, city")
      .order("state");

    if (error) {
      return { error: error.message, locations: [] };
    }

    return { error: null, locations: (data || []) as Location[] };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Failed to fetch locations";
    return { error: errorMessage, locations: [] };
  }
}

// Get distinct states from distinct_states view
export async function getStates(): Promise<{ error: string | null; states: string[] }> {
  console.log("[Server Action] getStates: Starting to fetch unique states from distinct_states view...");
  try {
    const supabase = await createClient();
    console.log("[Server Action] getStates: Querying distinct_states view...");
    
    const { data, error } = await supabase
      .from("distinct_states")
      .select("state");

    console.log("[Server Action] getStates: Query result:", { 
      hasError: !!error, 
      error: error?.message, 
      errorCode: error?.code,
      dataCount: data?.length || 0 
    });

    if (error) {
      console.error("[Server Action] getStates: Database error:", error.message);
      return { error: error.message, states: [] };
    }

    // Extract state values from the view (already distinct and ordered by the view)
    const states = (data || [])
      .map((item) => item.state)
      .filter(Boolean) as string[]; // Filter out any null/empty values just to be safe

    console.log("[Server Action] getStates: States extracted from view:", {
      count: states.length,
      states: states
    });

    console.log("[Server Action] getStates: Returning", states.length, "unique states");
    return { error: null, states: states };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Failed to fetch states";
    console.error("[Server Action] getStates: Exception:", errorMessage);
    return { error: errorMessage, states: [] };
  }
}

// Get cities for a specific state
export async function getCities(state: string): Promise<{ error: string | null; cities: string[] }> {
  console.log("[Server Action] getCities: Received request for state:", state);
  
  if (!state) {
    console.log("[Server Action] getCities: No state provided, returning empty array");
    return { error: null, cities: [] };
  }

  try {
    const supabase = await createClient();
    console.log("[Server Action] getCities: Querying locations table for cities in state:", state);
    
    const { data, error } = await supabase
      .from("locations")
      .select("city")
      .eq("state", state)
      .order("city", { ascending: true });

    console.log("[Server Action] getCities: Query result:", { 
      state,
      hasError: !!error, 
      error: error?.message, 
      dataCount: data?.length || 0 
    });

    if (error) {
      console.error("[Server Action] getCities: Database error for state", state, ":", error.message);
      return { error: error.message, cities: [] };
    }

    // Get distinct cities
    const distinctCities = Array.from(
      new Set((data || []).map((item) => item.city).filter(Boolean))
    ) as string[];

    console.log("[Server Action] getCities: Returning", distinctCities.length, "unique cities for state:", state);
    return { error: null, cities: distinctCities };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Failed to fetch cities";
    console.error("[Server Action] getCities: Exception for state", state, ":", errorMessage);
    return { error: errorMessage, cities: [] };
  }
}
