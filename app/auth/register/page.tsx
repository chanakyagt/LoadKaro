import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RegisterForm } from "./register-form";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: { role?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (userProfile?.role === "driver") redirect("/driver/dashboard");
  if (userProfile?.role === "shipper") redirect("/shipper/dashboard");

  const phone = user.phone ?? "";
  if (!phone) redirect("/auth");

  const roleParam = searchParams?.role;
  const initialRole =
    roleParam === "driver" ? "driver" : roleParam === "shipper" ? "shipper" : undefined;

  return <RegisterForm userId={user.id} phone={phone} initialRole={initialRole} />;
}

