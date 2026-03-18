import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTruck, updateTruck } from "../../actions";
import TruckForm from "@/components/truck-form";
import Link from "next/link";

interface EditTruckPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTruckPage({ params }: EditTruckPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Verify user is a driver
  const { data: userProfile } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!userProfile || userProfile.role !== "driver") {
    redirect("/driver/dashboard");
  }

  // Get the truck
  const { error, truck } = await getTruck(id);

  if (error || !truck) {
    redirect("/trucks");
  }

  async function handleSubmit(formData: Parameters<typeof updateTruck>[1]): Promise<void> {
    "use server";
    const result = await updateTruck(id, formData);
    if (result.error) {
      throw new Error(result.error);
    }
    // Redirect happens in the action, but we need to satisfy the return type
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Edit Truck
              </h1>
              <p className="text-muted-foreground">
                Update truck information
              </p>
            </div>
            <Link
              href="/driver/dashboard"
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Dashboard
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <TruckForm
            initialData={truck}
            onSubmit={handleSubmit}
            submitLabel="Update Truck"
          />
        </div>
      </div>
    </div>
  );
}
