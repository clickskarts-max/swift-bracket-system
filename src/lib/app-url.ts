/**
 * Single source of truth for building auth redirect URLs.
 *
 * Set VITE_APP_URL to your production domain (e.g. https://yourdomain.com)
 * so password-reset / confirmation emails always point at production instead
 * of whatever origin the email was requested from (preview, localhost, ...).
 */
export function appUrl(): string {
  const configured = import.meta.env["VITE_APP_URL"] as string | undefined;
  if (configured && /^https?:\/\//.test(configured)) return configured.replace(/\/+$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export const authRedirect = (path: string) => `${appUrl()}${path}`;
export const RESET_PASSWORD_PATH = "/reset-password";
