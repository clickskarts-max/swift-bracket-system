import type { ErrorComponentProps } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useBranding } from "@/hooks/use-branding";

import appCss from "../styles.css?url";
import { Toaster } from "../components/ui/sonner";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error: rawError, reset }: ErrorComponentProps) {
  const error = rawError as Error;
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  // A stale/updated deployment can leave the browser pointing at a chunk that
  // no longer exists. Recover automatically (once) instead of showing a blank screen.
  useEffect(() => {
    const isStaleChunk =
      /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
        error?.message ?? "",
      );
    if (!isStaleChunk || typeof window === "undefined") return;
    const KEY = "app-chunk-reloaded";
    if (window.sessionStorage.getItem(KEY)) return;
    window.sessionStorage.setItem(KEY, "1");
    window.location.reload();
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Ecluid Basketball — Tournament Management" },
      {
        name: "description",
        content:
          "Run basketball leagues, group stages and knockouts with live schedules, standings and shareable public tournament pages.",
      },
      { name: "author", content: "Ecluid Basketball" },
      { property: "og:title", content: "Ecluid Basketball — Tournament Management" },
      {
        property: "og:description",
        content:
          "Fixtures, standings, brackets and public tournament pages for basketball organizers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          // Set theme early to avoid a flash of wrong colors.
          dangerouslySetInnerHTML={{
            __html: `
(() => {
  try {
    const KEY = "ecluid-theme";
    const stored = localStorage.getItem(KEY);
    const theme = stored === "dark" ? "dark" : "light";
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  } catch {}
})();`,
          }}
        />
        <script
          // Recovery links can land on the site root (Supabase Site URL fallback).
          // Forward them to the dedicated reset page with tokens intact.
          dangerouslySetInnerHTML={{
            __html: `
(() => {
  try {
    if (location.pathname === "/reset-password") return;
    const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(location.search);
    const isRecovery =
      hash.get("type") === "recovery" ||
      query.get("type") === "recovery" ||
      ((hash.get("access_token") || query.get("code")) && (hash.get("type") || query.get("type")) === "recovery");
    if (!isRecovery) return;
    location.replace("/reset-password" + location.search + location.hash);
  } catch {}
})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function BrandingEffects() {
  const { data: org } = useBranding();

  // Apply branding colors and favicon
  useEffect(() => {
    if (org) {
      const root = document.documentElement;

      if (org.primary_color) {
        root.style.setProperty("--primary", org.primary_color);
        root.style.setProperty("--ring", org.primary_color);
      }

      if (org.accent_color) {
        root.style.setProperty("--accent", org.accent_color);
      }

      if (org.favicon_url) {
        const links = document.querySelectorAll("link[rel*='icon']");
        links.forEach((link) => {
          (link as HTMLLinkElement).href = org.favicon_url!;
        });
      }
    }
  }, [org]);

  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <BrandingEffects />
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
