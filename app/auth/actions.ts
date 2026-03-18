"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function sendOTP(phone: string) {
  const supabase = await createClient();

  // Format phone number (ensure it starts with +)
  const formattedPhone = phone.startsWith("+91") ? phone : `+${phone}`;

  console.log("[sendOTP] Original phone:", phone);
  console.log("[sendOTP] Formatted phone:", formattedPhone);

  const { error } = await supabase.auth.signInWithOtp({
    phone: formattedPhone,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function verifyOTP(
  phone: string,
  token: string
): Promise<
  | { error: string }
  | { needsRegistration: true; userId: string }
  | never
> {
  const supabase = await createClient();

  // Format phone number
  const formattedPhone = phone.startsWith("+91") ? phone : `+${phone}`;

  console.log("[verifyOTP] Original phone:", phone);
  console.log("[verifyOTP] Formatted phone:", formattedPhone);

  // Verify OTP
  const { data, error } = await supabase.auth.verifyOtp({
    phone: formattedPhone,
    token,
    type: "sms",
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Authentication failed" };
  }

  // Check if user profile already exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", data.user.id)
    .maybeSingle();

  // If user doesn't exist, they need to register
  if (!existingUser) {
    return { needsRegistration: true, userId: data.user.id };
  }

  // Existing user - redirect to role-based dashboard
  revalidatePath("/", "layout");
  if (existingUser.role === "driver") {
    redirect("/driver/dashboard");
  } else if (existingUser.role === "shipper") {
    redirect("/shipper/dashboard");
  } else {
    redirect("/");
  }
}

export async function completeRegistration(
  userId: string,
  phone: string,
  name: string,
  role: "driver" | "shipper"
) {
  const supabase = await createClient();

  // Format phone number
  const formattedPhone = phone.startsWith("+91") ? phone : `+${phone}`;

  console.log("[completeRegistration] Original phone:", phone);
  console.log("[completeRegistration] Formatted phone:", formattedPhone);

  // Verify the user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || user.id !== userId) {
    return { error: "Authentication required" };
  }

  // Validate role - only driver and shipper allowed for public registration
  if (role !== "driver" && role !== "shipper") {
    return { error: "Invalid role. Only drivers and shippers can register." };
  }

  // Create user profile in public.users table
  const { error: profileError } = await supabase.from("users").insert({
    id: userId,
    name: name.trim() || null,
    phone: formattedPhone,
    role: role,
    subscription_type: "free",
  });

  if (profileError) {
    return { error: `Failed to create profile: ${profileError.message}` };
  }

  // Redirect to role-based dashboard
  revalidatePath("/", "layout");
  if (role === "driver") {
    redirect("/driver/dashboard");
  } else if (role === "shipper") {
    redirect("/shipper/dashboard");
  } else {
    redirect("/");
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  // Don't redirect here - let client handle it to avoid popup issues
  return { success: true };
}
