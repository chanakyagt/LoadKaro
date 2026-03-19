"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sendOTP, verifyOTP, completeRegistration } from "./actions";

type Step = "phone" | "otp" | "register";
type Mode = "signin" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("signin");
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"driver" | "shipper">("driver");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const modeParam = searchParams.get("mode");
    if (modeParam === "signup") setMode("signup");
    if (modeParam === "signin") setMode("signin");

    const roleParam = searchParams.get("role");
    if (roleParam === "driver") setRole("driver");
    if (roleParam === "shipper") setRole("shipper");
  }, [searchParams]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!phone.trim()) {
      setError("Please enter a phone number");
      setLoading(false);
      return;
    }

    const result = await sendOTP(phone);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setStep("otp");
      setError("");
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!otp.trim()) {
      setError("Please enter the OTP code");
      setLoading(false);
      return;
    }

    const result = await verifyOTP(phone, otp);
    setLoading(false);

    if ("error" in result) {
      setError(result.error);
    } else if ("needsRegistration" in result && result.needsRegistration) {
      // New user needs to complete registration
      setUserId(result.userId);
      setStep("register");
      setError("");
      // Also send them to a dedicated registration page (works even if they refresh)
      router.push(mode === "signup" ? `/auth/register?role=${role}` : "/auth/register");
    }
    // On success for existing users, redirect happens in the action
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!name.trim()) {
      setError("Please enter your name");
      setLoading(false);
      return;
    }

    if (!userId) {
      setError("Session expired. Please start over.");
      setLoading(false);
      setStep("phone");
      return;
    }

    const result = await completeRegistration(userId, phone, name, role);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    }
    // On success, redirect happens in the action
  };

  const handleBack = () => {
    setStep("phone");
    setOtp("");
    setError("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-border bg-card p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">
            {step === "phone" && (mode === "signin" ? "Sign In" : "Sign Up")}
            {step === "otp" && "Verify OTP"}
            {step === "register" && "Complete Registration"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === "phone" &&
              (mode === "signin"
                ? "Enter your phone number to sign in"
                : "Enter your phone number to create an account")}
            {step === "otp" && "Enter the verification code sent to your phone"}
            {step === "register" && "Please provide your details to complete registration"}
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {step === "phone" && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1234567890"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                required
                disabled={loading}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Include country code (e.g., +1 for US)
              </p>
            </div>

            {mode === "signup" && (
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
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Verification Code"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-foreground mb-2">
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-center text-2xl tracking-widest"
                required
                disabled={loading}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="w-full sm:flex-1 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
            </div>
          </form>
        )}

        {step === "register" && (
          <form onSubmit={handleCompleteRegistration} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
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
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-foreground mb-2">
                I am a
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
        )}

        {step === "otp" && (
          <div className="text-center">
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Change phone number
            </button>
          </div>
        )}

        {step === "register" && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Phone: {phone}
            </p>
          </div>
        )}

        {step === "phone" && (
          <div className="text-center">
            {mode === "signin" ? (
              <p className="text-sm text-muted-foreground">
                Not yet registered?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError("");
                  }}
                  className="text-primary hover:underline"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError("");
                  }}
                  className="text-primary hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
