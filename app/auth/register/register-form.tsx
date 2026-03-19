"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeRegistration } from "@/app/auth/actions";

export function RegisterForm(props: {
  userId: string;
  phone: string;
  initialRole?: "driver" | "shipper";
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [role, setRole] = useState<"driver" | "shipper">(
    props.initialRole ?? "driver"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!name.trim()) {
      setError("Please enter your name");
      setLoading(false);
      return;
    }

    const result = await completeRegistration(
      props.userId,
      props.phone,
      name,
      role
    );
    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-border bg-card p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">
            Complete Registration
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Register as a driver or a shipper to continue.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleCompleteRegistration} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              required
              disabled={loading}
              autoComplete="name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Register as
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setRole("driver")}
                disabled={loading}
                className={`rounded-md border px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                  role === "driver"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background text-foreground hover:bg-accent"
                }`}
              >
                Driver
              </button>
              <button
                type="button"
                onClick={() => setRole("shipper")}
                disabled={loading}
                className={`rounded-md border px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                  role === "shipper"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background text-foreground hover:bg-accent"
                }`}
              >
                Shipper
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Account..." : "Complete Registration"}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">Phone: {props.phone}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Already registered?{" "}
            <a href="/auth" className="text-primary hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
