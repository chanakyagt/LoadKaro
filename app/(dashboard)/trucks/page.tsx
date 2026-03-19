import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTrucks } from "./actions";
import Link from "next/link";
import { formatCategoryName, formatPermitType } from "@/lib/utils/truck-formatting";

export default async function TrucksPage() {
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

  const { error, trucks } = await getTrucks();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              My Trucks
            </h1>
            <p className="text-muted-foreground">
              Manage your truck fleet
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            <Link
              href="/driver/dashboard"
              className="w-full sm:w-auto rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Dashboard
            </Link>
            <Link
              href="/trucks/new"
              className="w-full sm:w-auto rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Add New Truck
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 mb-6">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {trucks.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground mb-4">
              You don't have any trucks yet.
            </p>
            <Link
              href="/trucks/new"
              className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Add Your First Truck
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {trucks.map((truck) => (
              <div
                key={truck.id}
                className="flex flex-col rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow h-full min-h-[320px]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-card-foreground mb-1">
                      {formatCategoryName(truck.category)} Truck
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {formatPermitType(truck.permit_type)} Permit
                    </p>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    {truck.gps_available ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                        GPS
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground opacity-50">
                        No GPS
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-2.5 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Capacity:</span>
                    <span className="text-card-foreground font-medium">
                      {truck.capacity_tons ? `${truck.capacity_tons} tons` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Axles:</span>
                    <span className="text-card-foreground font-medium">
                      {truck.axle_count ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Wheels:</span>
                    <span className="text-card-foreground font-medium">
                      {truck.wheel_count ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Dimensions:</span>
                    <span className="text-card-foreground font-medium text-right">
                      {truck.internal_length && truck.internal_width && truck.internal_height
                        ? `${truck.internal_length}m × ${truck.internal_width}m × ${truck.internal_height}m`
                        : "—"}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/trucks/${truck.id}/edit`}
                  className="mt-auto block w-full text-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  Edit Truck
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
