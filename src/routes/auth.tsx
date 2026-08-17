import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Field } from "@/components/data-bits";
import { BrandWordmark } from "@/components/brand";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Ecluid Basketball" },
      { name: "description", content: "Sign in to manage your basketball tournaments, teams, fixtures and standings." },
      { property: "og:title", content: "Sign in — Ecluid Basketball" },
      { property: "og:description", content: "Access your basketball tournament control room." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

const emailSchema = z.string().trim().email("Enter a valid email").max(255);

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const submit = async (mode: "signin" | "signup") => {
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    setLoading(true);
    const { error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword(parsed.data)
        : await supabase.auth.signUp({
            ...parsed.data,
            options: { emailRedirectTo: `${window.location.origin}/dashboard` },
          });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(mode === "signin" ? "Welcome back" : "Account created");
    navigate({ to: "/dashboard" });
  };

  const sendReset = async () => {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Enter a valid email");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setForgotSent(true);
    toast.success("Reset link sent — check your inbox");
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="hero-surface flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="mb-8">
        <BrandWordmark />
      </Link>
      <div className="surface-card w-full max-w-md p-6">
        {showForgot ? (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-xl font-semibold">Reset password</h2>
              <p className="text-sm text-muted-foreground">Enter your email and we’ll send you a link to choose a new password.</p>
            </div>
            {forgotSent ? (
              <div className="space-y-4">
                <p className="rounded-lg bg-secondary p-4 text-sm text-foreground">
                  If an account exists for <strong>{email}</strong>, you’ll receive a reset link shortly.
                </p>
                <Button variant="outline" className="w-full" onClick={() => { setShowForgot(false); setForgotSent(false); }}>
                  Back to sign in
                </Button>
              </div>
            ) : (
              <>
                <Field label="Email">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="coach@club.com"
                    autoComplete="email"
                  />
                </Field>
                <Button className="w-full" disabled={loading} onClick={sendReset}>
                  Send reset link
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setShowForgot(false)}>
                  Back to sign in
                </Button>
              </>
            )}
          </div>
        ) : (
          <>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>
              {(["signin", "signup"] as const).map((mode) => (
                <TabsContent key={mode} value={mode} className="mt-5 space-y-4">
                  <Field label="Email">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="coach@club.com"
                      autoComplete="email"
                    />
                  </Field>
                  <Field label="Password">
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    />
                  </Field>
                  {mode === "signin" && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setShowForgot(true)}
                        className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                  <Button className="w-full" disabled={loading} onClick={() => submit(mode)}>
                    {mode === "signin" ? "Sign in" : "Create account"}
                  </Button>
                </TabsContent>
              ))}
            </Tabs>
            <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>
            <Button variant="outline" className="w-full" onClick={google}>
              Continue with Google
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

