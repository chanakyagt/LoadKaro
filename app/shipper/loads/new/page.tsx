import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LoadForm from "@/components/load-form";
import { createLoad, type LoadFormData } from "@/app/shipper/loads/actions";

export default async function NewLoadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Verify the user is a shipper
  const { data: userProfile } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!userProfile || userProfile.role !== "shipper") {
    redirect("/auth");
  }

  async function handleSubmit(data: LoadFormData) {
    "use server";
    const result = await createLoad(data);
    if (result.error) {
      throw new Error(result.error);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Post a Load</h1>
          <p className="text-muted-foreground">
            Select origin and destination to post a new load for transport.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <LoadForm onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
