"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AvailabilityFormData, AvailabilityWithDetails } from "@/lib/types";

// Helper function to verify user is authenticated and is a driver
async function verifyDriver() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required", user: null, userId: null };
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!userProfile) {
    return { error: "User profile not found", user: null, userId: null };
  }

  if (userProfile.role !== "driver") {
    return { error: "Only drivers can manage availabilities", user: null, userId: null };
  }

  return { error: null, user, userId: user.id };
}

// Get all availabilities for the current driver
export async function getAvailabilities(): Promise<{ error: string | null; availabilities: AvailabilityWithDetails[] }> {
  const verification = await verifyDriver();
  if (verification.error || !verification.userId) {
    return { error: verification.error || "Unauthorized", availabilities: [] };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("availabilities")
    .select(`
      *,
      truck:trucks!truck_id (
        id,
        category,
        variant_id
      ),
      origin_location:locations!origin_location_id (
        city,
        state
      ),
      destination_location:locations!destination_location_id (
        city,
        state
      )
    `)
    .eq("driver_id", verification.userId)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message, availabilities: [] };
  }

  // Transform the data to match our interface
  const availabilities = (data || []).map((item: any) => ({
    ...item,
    truck: Array.isArray(item.truck) ? item.truck[0] : item.truck,
    origin_location: Array.isArray(item.origin_location) ? item.origin_location[0] : item.origin_location,
    destination_location: Array.isArray(item.destination_location) ? item.destination_location[0] : item.destination_location,
  })) as AvailabilityWithDetails[];

  return { error: null, availabilities };
}

// Get a single availability by ID (only if owned by current driver)
export async function getAvailability(id: string): Promise<{ error: string | null; availability: AvailabilityWithDetails | null }> {
  const verification = await verifyDriver();
  if (verification.error || !verification.userId) {
    return { error: verification.error || "Unauthorized", availability: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("availabilities")
    .select(`
      *,
      truck:trucks!truck_id (
        id,
        category,
        variant_id
      ),
      origin_location:locations!origin_location_id (
        city,
        state
      ),
      destination_location:locations!destination_location_id (
        city,
        state
      )
    `)
    .eq("id", id)
    .eq("driver_id", verification.userId)
    .maybeSingle();

  if (error) {
    return { error: error.message, availability: null };
  }

  if (!data) {
    return { error: "Availability not found or access denied", availability: null };
  }

  // Transform the data
  const availability = {
    ...data,
    truck: Array.isArray(data.truck) ? data.truck[0] : data.truck,
    origin_location: Array.isArray(data.origin_location) ? data.origin_location[0] : data.origin_location,
    destination_location: Array.isArray(data.destination_location) ? data.destination_location[0] : data.destination_location,
  } as AvailabilityWithDetails;

  return { error: null, availability };
}

// Get trucks owned by the current driver with variant display names
export async function getDriverTrucks(): Promise<{ error: string | null; trucks: Array<{ id: string; category: string; variant_id: string; variant_display_name: string | null }> }> {
  const verification = await verifyDriver();
  if (verification.error || !verification.userId) {
    return { error: verification.error || "Unauthorized", trucks: [] };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trucks")
    .select(`
      id,
      category,
      variant_id,
      variant:truck_variants!variant_id (
        display_name
      )
    `)
    .eq("owner_id", verification.userId)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message, trucks: [] };
  }

  // Transform the data to include variant display name
  const trucks = (data || []).map((truck: any) => ({
    id: truck.id,
    category: truck.category,
    variant_id: truck.variant_id,
    variant_display_name: Array.isArray(truck.variant) 
      ? truck.variant[0]?.display_name || null
      : truck.variant?.display_name || null,
  }));

  return { error: null, trucks };
}

// Create a new availability
export async function createAvailability(formData: AvailabilityFormData): Promise<{ error: string | null }> {
  const verification = await verifyDriver();
  if (verification.error || !verification.userId) {
    return { error: verification.error || "Unauthorized" };
  }

  const supabase = await createClient();

  // Validate required fields
  if (!formData.truck_id || !formData.origin_location_id || !formData.destination_location_id || !formData.available_from) {
    return { error: "Truck, origin location, destination location, and available from date are required" };
  }

  // Verify the truck belongs to the driver
  const { data: truck } = await supabase
    .from("trucks")
    .select("id")
    .eq("id", formData.truck_id)
    .eq("owner_id", verification.userId)
    .maybeSingle();

  if (!truck) {
    return { error: "Truck not found or access denied" };
  }

  // Insert availability with driver_id set from auth.uid() - NEVER trust client
  const { error } = await supabase.from("availabilities").insert({
    driver_id: verification.userId, // Always set from server
    truck_id: formData.truck_id,
    origin_location_id: formData.origin_location_id,
    destination_location_id: formData.destination_location_id,
    available_from: formData.available_from,
    available_till: formData.available_till || null,
    expected_rate: formData.expected_rate || null,
    status: "active", // Always start as active
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/availability");
  redirect("/availability");
}

// Close an availability (update status to 'closed')
export async function closeAvailability(id: string): Promise<{ error: string | null }> {
  const verification = await verifyDriver();
  if (verification.error || !verification.userId) {
    return { error: verification.error || "Unauthorized" };
  }

  const supabase = await createClient();

  // Verify the availability exists and belongs to the driver
  const { data: existingAvailability } = await supabase
    .from("availabilities")
    .select("id, driver_id, status")
    .eq("id", id)
    .eq("driver_id", verification.userId)
    .maybeSingle();

  if (!existingAvailability) {
    return { error: "Availability not found or access denied" };
  }

  if (existingAvailability.status === "closed") {
    return { error: "Availability is already closed" };
  }

  // Update status to closed
  const { error } = await supabase
    .from("availabilities")
    .update({ status: "closed" })
    .eq("id", id)
    .eq("driver_id", verification.userId); // Double-check ownership

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/availability");
  return { error: null };
}
