import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAvailability, getDriverTrucks } from "../actions";
import AvailabilityForm from "@/components/availability-form";
import Link from "next/link";

export default async function NewAvailabilityPage() {
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

  // Get driver's trucks
  const { error: trucksError, trucks } = await getDriverTrucks();

  async function handleSubmit(formData: Parameters<typeof createAvailability>[0]): Promise<void> {
    "use server";
    const result = await createAvailability(formData);
    if (result.error) {
      throw new Error(result.error);
    }
    // Redirect happens in the action
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Create Availability
              </h1>
              <p className="text-muted-foreground">
                Add your truck availability for bookings
              </p>
            </div>
            <Link
              href="/driver/dashboard"
              className="w-full sm:w-auto text-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {trucksError && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 mb-6">
            <p className="text-sm text-destructive">{trucksError}</p>
          </div>
        )}

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <AvailabilityForm
            trucks={trucks}
            onSubmit={handleSubmit}
            submitLabel="Create Availability"
          />
        </div>
      </div>
    </div>
  );
}
