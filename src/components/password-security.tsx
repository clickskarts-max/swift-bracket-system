import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/data-bits";
import { PasswordInput } from "@/components/password-input";
import { authRedirect, RESET_PASSWORD_PATH } from "@/lib/app-url";
import type { User } from "@supabase/supabase-js";

export function PasswordSecurity({ user }: { user: User | null }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const providers = (user?.identities ?? []).map((i) => i.provider);
  const hasPassword = providers.length === 0 || providers.includes("email");
  const email = user?.email ?? "";

  const clear = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
  };

  const sendReset = async () => {
    if (!email) return;
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirect(RESET_PASSWORD_PATH),
    });
    if (err) toast.error("We couldn't send the reset email. Try again shortly.");
    else toast.success("Password reset email sent.");
  };

  const submit = async () => {
    setError(null);
    if (!current) {
      setError("Enter your current password.");
      return;
    }
    if (next.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (next !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (next === current) {
      setError("Choose a password different from your current one.");
      return;
    }
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });
    if (signInError) {
      setLoading(false);
      setCurrent("");
      setError("Your current password is incorrect.");
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: next });
    setLoading(false);
    if (updateError) {
      setCurrent("");
      setError("We couldn't update your password. Please try again.");
      return;
    }
    clear();
    toast.success("Password updated successfully.");
  };

  return (
    <div className="surface-card mt-6 space-y-4 p-5">
      <div>
        <p className="text-sm font-semibold">Password &amp; Security</p>
        <p className="text-sm text-muted-foreground">
          Update the password used to sign in to your account.
        </p>
      </div>

      {!hasPassword ? (
        <div className="space-y-3">
          <p className="text-sm">
            Your account currently uses {providers.includes("google") ? "Google" : "social"}{" "}
            sign-in.
          </p>
          <Button variant="outline" onClick={sendReset}>
            Set a password by email
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Current Password">
              <PasswordInput
                value={current}
                onChange={setCurrent}
                autoComplete="current-password"
              />
            </Field>
            <div className="hidden sm:block" />
            <Field label="New Password">
              <PasswordInput value={next} onChange={setNext} autoComplete="new-password" />
            </Field>
            <Field label="Confirm New Password">
              <PasswordInput value={confirm} onChange={setConfirm} autoComplete="new-password" />
            </Field>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={submit} disabled={loading}>
              Change Password
            </Button>
            <button
              type="button"
              onClick={sendReset}
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Forgot your current password? Send password reset email
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

