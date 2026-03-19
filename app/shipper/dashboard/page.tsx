import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LogoutButton } from "./logout-button";

export default async function ShipperDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Get user profile with role
  const { data: userProfile } = await supabase
    .from("users")
    .select("id, name, role, phone")
    .eq("id", user.id)
    .maybeSingle();

  if (!userProfile || userProfile.role !== "shipper") {
    redirect("/auth");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Shipper Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {userProfile.name || "Shipper"}!
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-card-foreground mb-2">
              Active Shipments
            </h2>
            <p className="text-3xl font-bold text-primary">0</p>
            <p className="text-sm text-muted-foreground mt-1">
              In transit
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-card-foreground mb-2">
              Pending Orders
            </h2>
            <p className="text-3xl font-bold text-primary">0</p>
            <p className="text-sm text-muted-foreground mt-1">
              Awaiting pickup
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-card-foreground mb-2">
              Total Shipments
            </h2>
            <p className="text-3xl font-bold text-primary">0</p>
            <p className="text-sm text-muted-foreground mt-1">
              All time
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">
            Recent Shipments
          </h2>
          <p className="text-muted-foreground">
            No recent shipments. Create a new shipment to get started.
          </p>
        </div>
      </div>
    </div>
  );
}
