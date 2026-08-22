import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/data-bits";
import { PasswordInput } from "@/components/password-input";
import { BrandWordmark } from "@/components/brand";
import { useBranding } from "@/hooks/use-branding";


export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a new password — Ecluid Basketball" },
      {
        name: "description",
        content: "Choose a new password for your Ecluid Basketball account.",
      },
      { property: "og:title", content: "Set a new password — Ecluid Basketball" },
      {
        property: "og:description",
        content: "Complete your password recovery and get back to your tournaments.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

type Status = "checking" | "ready" | "invalid" | "done";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { data: org } = useBranding();


  useEffect(() => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      setStatus(ok ? "ready" : "invalid");
    };

    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    if (hash.get("error") || query.get("error")) {
      finish(false);
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) finish(true);
    });

    // Give the client a moment to process the recovery tokens in the URL.
    const codeInUrl = hash.get("access_token") || query.get("code") || query.get("token_hash");
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) finish(true);
      else if (!codeInUrl) finish(false);
    };
    void check();
    const t = setTimeout(() => void check().then(() => finish(false)), 2500);

    return () => {
      clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async () => {
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    setPassword("");
    setConfirm("");
    if (err) {
      setError(
        /same/i.test(err.message)
          ? "Choose a password different from your previous one."
          : "We couldn't update your password. The reset link may have expired.",
      );
      return;
    }
    setStatus("done");
    toast.success("Your password has been reset successfully.");
    await supabase.auth.signOut();
  };

  return (
    <div className="hero-surface flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="mb-8">
        <BrandWordmark />
      </Link>
      <div className="surface-card w-full max-w-md space-y-4 p-6 relative overflow-hidden">
        {org && (
          <div 
            className="absolute top-0 left-0 w-full h-1" 
            style={{ backgroundColor: org.primary_color || "var(--primary)" }}
          />
        )}

        {status === "checking" && (
          <p className="text-sm text-muted-foreground">Verifying your reset link…</p>
        )}

        {status === "invalid" && (
          <div className="space-y-4">
            <h1 className="font-display text-xl font-bold">Link no longer valid</h1>
            <p className="text-sm text-muted-foreground">
              This password reset link is invalid or has expired.
            </p>
            <Button className="w-full" onClick={() => navigate({ to: "/auth" })}>
              Request a new password reset
            </Button>
          </div>
        )}

        {status === "ready" && (
          <div className="space-y-4">
            <div>
              <h1 className="font-display text-xl font-bold">Set New Password</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter a new password for your account.
              </p>
            </div>
            <Field label="New Password">
              <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" />
            </Field>
            <Field label="Confirm New Password">
              <PasswordInput value={confirm} onChange={setConfirm} autoComplete="new-password" />
            </Field>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" disabled={loading} onClick={submit}>
              Update Password
            </Button>
          </div>
        )}

        {status === "done" && (
          <div className="space-y-4">
            <h1 className="font-display text-xl font-bold">Password updated</h1>
            <p className="text-sm text-muted-foreground">
              Your password has been reset successfully.
            </p>
            <Button className="w-full" onClick={() => navigate({ to: "/auth" })}>
              Continue to Sign In
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
