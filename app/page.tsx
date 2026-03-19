import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: userProfile } = user
    ? await supabase.from("users").select("role, name").eq("id", user.id).maybeSingle()
    : { data: null };

  const dashboardHref =
    userProfile?.role === "driver"
      ? "/driver/dashboard"
      : userProfile?.role === "shipper"
        ? "/shipper/dashboard"
        : null;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-6xl px-4">
        <header className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold">
              LK
            </div>
            <div>
              <div className="text-lg font-semibold text-foreground">Load Karo</div>
              <div className="text-xs text-muted-foreground">Trucking & Logistics</div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Link
              href="/auth?mode=signin"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Sign in
            </Link>
            <Link
              href="/auth?mode=signup"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Sign up
            </Link>
          </div>
        </header>

        <section className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-transparent" />
          <div className="relative grid gap-10 px-6 py-12 md:grid-cols-2 md:px-10 md:py-16">
            <div>
              <div className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
                Built for India • Fast matching • Trusted lanes
              </div>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                Load Karo
              </h1>
              <p className="mt-3 text-lg text-muted-foreground">
                Don’t return to your home empty handed.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Find loads faster, manage trucks, and keep wheels moving — for drivers and
                shippers across India.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/auth?mode=signup"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  Get started
                </Link>
                {dashboardHref && (
                  <Link
                    href={dashboardHref}
                    className="inline-flex items-center justify-center rounded-md border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    Go to dashboard
                  </Link>
                )}
              </div>

              {user && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Signed in as {userProfile?.name || user.phone || "user"}.
                </p>
              )}
            </div>

            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="overflow-hidden rounded-xl border border-border bg-background sm:col-span-2">
                  <img
                    alt="Load Karo trucks"
                    className="h-56 w-full object-cover sm:h-60"
                    loading="lazy"
                    src="/01.png"
                  />
                </div>
                <div className="overflow-hidden rounded-xl border border-border bg-background">
                  <img
                    alt="Indian trucking"
                    className="h-44 w-full object-cover"
                    loading="lazy"
                    src="/02.png"
                  />
                </div>
                <div className="overflow-hidden rounded-xl border border-border bg-background">
                  <img
                    alt="Fleet and logistics"
                    className="h-44 w-full object-cover"
                    loading="lazy"
                    src="/03.png"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="text-sm font-semibold text-foreground">For Drivers</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Post availability, browse loads, and keep your trips profitable.
            </p>
            <div className="mt-4">
              <Link
                href="/auth?mode=signup&role=driver"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Register as Driver
              </Link>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="text-sm font-semibold text-foreground">For Shippers</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Create loads and find reliable trucks quickly.
            </p>
            <div className="mt-4">
              <Link
                href="/auth?mode=signup&role=shipper"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Register as Shipper
              </Link>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="text-sm font-semibold text-foreground">Simple & Fast</div>
            <p className="mt-2 text-sm text-muted-foreground">
              OTP login, role-based dashboards, and clean workflows.
            </p>
          </div>
        </section>

        <footer className="py-10 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Load Karo. All rights reserved.
        </footer>
      </div>
    </main>
  );
}
