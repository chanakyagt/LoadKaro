import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

// Helper function to format dates
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { 
    year: "numeric", 
    month: "short", 
    day: "numeric" 
  });
}

// Helper function to format phone number for display (mask middle digits)
function formatPhone(phone: string): string {
  if (!phone) return "N/A";
  // If phone starts with +91, show first 2 and last 4 digits
  if (phone.startsWith("+91") && phone.length > 6) {
    return `+91${phone.slice(3, -4).replace(/\d/g, "x")}${phone.slice(-4)}`;
  }
  // Otherwise show first 2 and last 4 digits
  if (phone.length > 6) {
    return `${phone.slice(0, 2)}${phone.slice(2, -4).replace(/\d/g, "x")}${phone.slice(-4)}`;
  }
  return phone;
}

interface Load {
  id: string;
  loading_date: string;
  origin_location: {
    state: string;
    city: string;
  };
  destination_location: {
    state: string;
    city: string;
  };
  posted_by: {
    name: string | null;
    phone: string;
  };
}

async function LoadsData() {
  const supabase = await createClient();

  // Fetch all open loads with joined data
  const { data, error } = await supabase
    .from("loads")
    .select(`
      id,
      loading_date,
      origin_location:locations!origin_location_id (
        state,
        city
      ),
      destination_location:locations!destination_location_id (
        state,
        city
      ),
      posted_by:users!posted_by (
        name,
        phone
      )
    `)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
        <p className="text-sm text-destructive">
          Error loading loads: {error.message}
        </p>
      </div>
    );
  }

  // Transform the data to handle array responses from Supabase joins
  const loads: Load[] = (data || []).map((item: any) => ({
    id: item.id,
    loading_date: item.loading_date,
    origin_location: Array.isArray(item.origin_location)
      ? item.origin_location[0]
      : item.origin_location,
    destination_location: Array.isArray(item.destination_location)
      ? item.destination_location[0]
      : item.destination_location,
    posted_by: Array.isArray(item.posted_by)
      ? item.posted_by[0]
      : item.posted_by,
  }));

  if (loads.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground mb-4">
          No loads available at the moment.
        </p>
        <p className="text-sm text-muted-foreground">
          Check back later for new load opportunities.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {loads.map((load) => (
        <div
          key={load.id}
          className="flex flex-col rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex-1 space-y-4">
            {/* Origin */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Origin</p>
              <p className="text-sm font-medium text-card-foreground">
                {load.origin_location?.city || "N/A"}, {load.origin_location?.state || "N/A"}
              </p>
            </div>

            {/* Destination */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Destination</p>
              <p className="text-sm font-medium text-card-foreground">
                {load.destination_location?.city || "N/A"}, {load.destination_location?.state || "N/A"}
              </p>
            </div>

            {/* Loading Date */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Loading Date</p>
              <p className="text-sm font-medium text-card-foreground">
                {formatDate(load.loading_date)}
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-border my-4" />

            {/* Posted By */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Posted By</p>
              <p className="text-sm font-medium text-card-foreground">
                {load.posted_by?.name || "Unknown"}
              </p>
            </div>

            {/* Phone */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Phone</p>
              <p className="text-sm font-medium text-card-foreground">
                {formatPhone(load.posted_by?.phone || "")}
              </p>
            </div>
          </div>

          {/* Contact Button */}
          {load.posted_by?.phone && (
            <div className="mt-6 pt-4 border-t border-border">
              <a
                href={`tel:${load.posted_by.phone}`}
                className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Contact Shipper
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function LoadsLoading() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="flex flex-col rounded-lg border border-border bg-card p-6 shadow-sm animate-pulse"
        >
          <div className="flex-1 space-y-4">
            <div>
              <div className="h-3 w-16 bg-muted rounded mb-2" />
              <div className="h-4 w-32 bg-muted rounded" />
            </div>
            <div>
              <div className="h-3 w-16 bg-muted rounded mb-2" />
              <div className="h-4 w-32 bg-muted rounded" />
            </div>
            <div>
              <div className="h-3 w-20 bg-muted rounded mb-2" />
              <div className="h-4 w-24 bg-muted rounded" />
            </div>
            <div className="border-t border-border my-4" />
            <div>
              <div className="h-3 w-16 bg-muted rounded mb-2" />
              <div className="h-4 w-28 bg-muted rounded" />
            </div>
            <div>
              <div className="h-3 w-12 bg-muted rounded mb-2" />
              <div className="h-4 w-24 bg-muted rounded" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-border">
            <div className="h-10 w-full bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MarketplaceLoadsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Marketplace - Available Loads
          </h1>
          <p className="text-muted-foreground">
            Browse and contact shippers for available loads
          </p>
        </div>

        <Suspense fallback={<LoadsLoading />}>
          <LoadsData />
        </Suspense>
      </div>
    </div>
  );
}
