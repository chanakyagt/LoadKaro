"use server";

import { createClient } from "@/lib/supabase/server";
import type { Location } from "@/lib/types";

export async function getLocations(): Promise<{ error: string | null; locations: Location[] }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("locations")
      .select("id, state, city")
      .order("state");

    if (error) return { error: error.message, locations: [] };

    return { error: null, locations: (data || []) as Location[] };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Failed to fetch locations";
    return { error: errorMessage, locations: [] };
  }
}

export async function getStates(): Promise<{ error: string | null; states: string[] }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("distinct_states").select("state");

    if (error) return { error: error.message, states: [] };

    const states = (data || []).map((x) => x.state).filter(Boolean) as string[];
    return { error: null, states };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Failed to fetch states";
    return { error: errorMessage, states: [] };
  }
}

export async function getCities(state: string): Promise<{ error: string | null; cities: string[] }> {
  if (!state) return { error: null, cities: [] };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("locations")
      .select("city")
      .eq("state", state)
      .order("city", { ascending: true });

    if (error) return { error: error.message, cities: [] };

    const distinctCities = Array.from(
      new Set((data || []).map((item) => item.city).filter(Boolean))
    ) as string[];

    return { error: null, cities: distinctCities };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Failed to fetch cities";
    return { error: errorMessage, cities: [] };
  }
}

