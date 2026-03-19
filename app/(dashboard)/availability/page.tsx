import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAvailabilities, closeAvailability } from "./actions";
import Link from "next/link";
import { formatCategoryName } from "@/lib/utils/truck-formatting";

// Helper function to format dates
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function AvailabilityPage() {
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

  const { error, availabilities } = await getAvailabilities();

  async function handleCloseAvailability(id: string) {
    "use server";
    await closeAvailability(id);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              My Availabilities
            </h1>
            <p className="text-muted-foreground">
              Manage your truck availability
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
              href="/availability/new"
              className="w-full sm:w-auto rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Add Availability
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 mb-6">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {availabilities.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground mb-4">
              You don&apos;t have any availabilities yet.
            </p>
            <Link
              href="/availability/new"
              className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Create Your First Availability
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availabilities.map((availability) => (
              <div
                key={availability.id}
                className="flex flex-col rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow h-full min-h-[400px]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-card-foreground mb-1">
                      {availability.truck ? formatCategoryName(availability.truck.category) : "Unknown"} Truck
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {availability.origin_location
                        ? `${availability.origin_location.city}, ${availability.origin_location.state}`
                        : "N/A"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      availability.status === "active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                    }`}
                  >
                    {availability.status === "active" ? "Active" : "Closed"}
                  </span>
                </div>

                <div className="flex-1 space-y-3 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Preferred Destination</p>
                    <p className="text-sm text-card-foreground font-medium">
                      {availability.destination_location
                        ? `${availability.destination_location.city}, ${availability.destination_location.state}`
                        : "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Available From</p>
                    <p className="text-sm text-card-foreground font-medium">
                      {formatDate(availability.available_from)}
                    </p>
                  </div>

                  {availability.available_till && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Available Till</p>
                      <p className="text-sm text-card-foreground font-medium">
                        {formatDate(availability.available_till)}
                    </p>
                    </div>
                  )}

                  {availability.expected_rate && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Expected Rate</p>
                      <p className="text-sm text-card-foreground font-medium">
                        ₹{availability.expected_rate.toLocaleString()}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Created On</p>
                    <p className="text-sm text-card-foreground font-medium">
                      {formatDate(availability.created_at)}
                    </p>
                  </div>
                </div>

                {availability.status === "active" && (
                  <form action={handleCloseAvailability.bind(null, availability.id)} className="mt-auto">
                    <button
                      type="submit"
                      className="w-full rounded-md border border-destructive bg-background px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      Close Availability
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
