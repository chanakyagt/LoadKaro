import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is logged in, redirect to their dashboard (if they have a profile).
  // If they don't have a profile yet, let them see auth screens to complete registration.
  if (user) {
    const { data: userProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (userProfile) {
      if (userProfile.role === "driver") {
        redirect("/driver/dashboard");
      } else if (userProfile.role === "shipper") {
        redirect("/shipper/dashboard");
      }
      redirect("/");
    }
  }

  return <>{children}</>;
}
