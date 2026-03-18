import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTrucks } from "@/app/(dashboard)/trucks/actions";
import { LogoutButton } from "@/app/driver/dashboard/logout-button";

export default async function DriverDashboard() {
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

  if (!userProfile || userProfile.role !== "driver") {
    redirect("/auth");
  }

  // Get truck count
  const { trucks } = await getTrucks();
  const truckCount = trucks.length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Driver Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {userProfile.name || "Driver"}!
            </p>
          </div>
          <LogoutButton />
        </div>

        {/* Quick Actions */}
        <div className="mb-8 rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/trucks"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Manage Trucks
              {truckCount > 0 && (
                <span className="ml-2 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs">
                  {truckCount}
                </span>
              )}
            </Link>
            <Link
              href="/trucks/new"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Add New Truck
            </Link>
            <Link
              href="/availability"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              My Availabilities
            </Link>
            <Link
              href="/availability/new"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Create Availability
            </Link>
            <Link
              href="/marketplace/loads"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Browse Loads
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-card-foreground mb-2">
              My Trucks
            </h2>
            <p className="text-3xl font-bold text-primary">{truckCount}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Registered trucks
            </p>
            <Link
              href="/trucks"
              className="mt-3 inline-block text-sm text-primary hover:underline"
            >
              View all →
            </Link>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-card-foreground mb-2">
              Active Deliveries
            </h2>
            <p className="text-3xl font-bold text-primary">0</p>
            <p className="text-sm text-muted-foreground mt-1">
              Currently assigned
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-card-foreground mb-2">
              Completed Today
            </h2>
            <p className="text-3xl font-bold text-primary">0</p>
            <p className="text-sm text-muted-foreground mt-1">
              Deliveries completed
            </p>
          </div>

          <Link
            href="/marketplace/loads"
            className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-semibold text-card-foreground mb-2">
              Marketplace
            </h2>
            <p className="text-sm text-muted-foreground mb-3">
              Browse available loads
            </p>
            <p className="text-sm text-primary font-medium">
              View loads →
            </p>
          </Link>
        </div>

        <div className="mt-8 rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">
            Recent Activity
          </h2>
          <p className="text-muted-foreground">
            No recent activity. Start accepting deliveries to see them here.
          </p>
        </div>
      </div>
    </div>
  );
}
