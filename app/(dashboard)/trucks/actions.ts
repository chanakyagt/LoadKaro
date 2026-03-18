"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
    return { error: "Only drivers can manage trucks", user: null, userId: null };
  }

  return { error: null, user, userId: user.id };
}

// Type definitions (adjust based on your actual enum values)
export type TruckCategory = 
  | "open"
  | "container"
  | "lcv"
  | "mini_pickup"
  | "trailer"
  | "tipper"
  | "tanker"
  | "dumper"
  | "bulker";

export type PermitType = 
  | "national_permit"
  | "state_permit"
  | "all_india_permit"
  | "goods_carriage"
  | "contract_carriage";

export interface TruckFormData {
  category: TruckCategory;
  variant_id: string;
  capacity_tons: number;
  permit_type: PermitType;
  axle_count: number;
  wheel_count: number;
  internal_length: number;
  internal_width: number;
  internal_height: number;
  gps_available: boolean;
}

export interface Truck extends TruckFormData {
  id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface TruckVariant {
  id: string;
  category: string;
  display_name: string;
  is_active: boolean;
}

// Get all trucks for the current user
export async function getTrucks(): Promise<{ error: string | null; trucks: Truck[] }> {
  const verification = await verifyDriver();
  if (verification.error || !verification.userId) {
    return { error: verification.error || "Unauthorized", trucks: [] };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trucks")
    .select("*")
    .eq("owner_id", verification.userId)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message, trucks: [] };
  }

  return { error: null, trucks: (data || []) as Truck[] };
}

// Get a single truck by ID (only if owned by current user)
export async function getTruck(id: string): Promise<{ error: string | null; truck: Truck | null }> {
  const verification = await verifyDriver();
  if (verification.error || !verification.userId) {
    return { error: verification.error || "Unauthorized", truck: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trucks")
    .select("*")
    .eq("id", id)
    .eq("owner_id", verification.userId)
    .maybeSingle();

  if (error) {
    return { error: error.message, truck: null };
  }

  if (!data) {
    return { error: "Truck not found or access denied", truck: null };
  }

  return { error: null, truck: data as Truck };
}

// Get truck variants filtered by category
export async function getTruckVariants(category: string): Promise<{ error: string | null; variants: TruckVariant[] }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("truck_variants")
    .select("*")
    .eq("category", category)
    .eq("is_active", true)
    .order("display_name", { ascending: true });

  if (error) {
    return { error: error.message, variants: [] };
  }

  return { error: null, variants: (data || []) as TruckVariant[] };
}

// Create a new truck
export async function createTruck(formData: TruckFormData): Promise<{ error: string | null }> {
  const verification = await verifyDriver();
  if (verification.error || !verification.userId) {
    return { error: verification.error || "Unauthorized" };
  }

  const supabase = await createClient();

  // Validate required fields
  if (!formData.category || !formData.variant_id || !formData.permit_type) {
    return { error: "Category, variant, and permit type are required" };
  }

  // Insert truck with owner_id set from auth.uid() - NEVER trust client
  const { error } = await supabase.from("trucks").insert({
    owner_id: verification.userId, // Always set from server
    category: formData.category,
    variant_id: formData.variant_id,
    capacity_tons: formData.capacity_tons || null,
    permit_type: formData.permit_type,
    axle_count: formData.axle_count || null,
    wheel_count: formData.wheel_count || null,
    internal_length: formData.internal_length || null,
    internal_width: formData.internal_width || null,
    internal_height: formData.internal_height || null,
    gps_available: formData.gps_available ?? false,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/trucks");
  redirect("/trucks");
}

// Update an existing truck (only if owned by current user)
export async function updateTruck(id: string, formData: TruckFormData): Promise<{ error: string | null }> {
  const verification = await verifyDriver();
  if (verification.error || !verification.userId) {
    return { error: verification.error || "Unauthorized" };
  }

  const supabase = await createClient();

  // First verify the truck exists and belongs to the user
  const { data: existingTruck } = await supabase
    .from("trucks")
    .select("id, owner_id")
    .eq("id", id)
    .eq("owner_id", verification.userId)
    .maybeSingle();

  if (!existingTruck) {
    return { error: "Truck not found or access denied" };
  }

  // Validate required fields
  if (!formData.category || !formData.variant_id || !formData.permit_type) {
    return { error: "Category, variant, and permit type are required" };
  }

  // Update truck - owner_id is NEVER updated, only set on create
  const { error } = await supabase
    .from("trucks")
    .update({
      category: formData.category,
      variant_id: formData.variant_id,
      capacity_tons: formData.capacity_tons || null,
      permit_type: formData.permit_type,
      axle_count: formData.axle_count || null,
      wheel_count: formData.wheel_count || null,
      internal_length: formData.internal_length || null,
      internal_width: formData.internal_width || null,
      internal_height: formData.internal_height || null,
      gps_available: formData.gps_available ?? false,
    })
    .eq("id", id)
    .eq("owner_id", verification.userId); // Double-check ownership

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/trucks");
  redirect("/trucks");
}
