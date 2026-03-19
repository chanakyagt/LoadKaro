"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { LoadFormData } from "@/lib/types";

// Helper function to verify user is authenticated and is a shipper
async function verifyShipper() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required", userId: null };
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!userProfile) {
    return { error: "User profile not found", userId: null };
  }

  if (userProfile.role !== "shipper") {
    return { error: "Only shippers can post loads", userId: null };
  }

  return { error: null, userId: user.id };
}

// Create a new load
export async function createLoad(data: LoadFormData): Promise<{ error: string | null }> {
  const verification = await verifyShipper();
  if (verification.error || !verification.userId) {
    return { error: verification.error || "Unauthorized" };
  }

  const supabase = await createClient();

  // Validate required fields
  if (!data.origin_location_id || !data.destination_location_id || !data.loading_date) {
    return { error: "Origin, destination, and loading date are required" };
  }

  if (data.origin_location_id === data.destination_location_id) {
    return { error: "Origin and destination must be different" };
  }

  // Insert load with posted_by set from auth - NEVER trust client
  const { error } = await supabase.from("loads").insert({
    origin_location_id: data.origin_location_id,
    destination_location_id: data.destination_location_id,
    loading_date: data.loading_date,
    posted_by: verification.userId,
    status: "open",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/shipper/loads");
  return { error: null };
}
