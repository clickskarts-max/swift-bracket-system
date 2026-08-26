/**
 * Client-safe integration catalogue.
 *
 * Adding a new third-party service = add an entry here + a handler in
 * `providers.server.ts`. Nothing else in the app needs to change.
 */

export type IntegrationFieldKind = "secret" | "text";

export type IntegrationField = {
  key: string;
  label: string;
  kind: IntegrationFieldKind;
  placeholder?: string;
  help?: string;
  required?: boolean;
};

export type IntegrationProviderMeta = {
  id: string;
  name: string;
  category: string;
  description: string;
  authType: "api_key" | "webhook" | "oauth";
  /** Credential fields — stored server-side only, never returned to the browser. */
  secretFields: IntegrationField[];
  /** Non-secret configuration, safe to read back in the UI. */
  configFields: IntegrationField[];
  supportsSync: boolean;
  /** Accepts inbound webhooks at /api/public/integrations/<id>?integration_id=... */
  supportsInboundWebhook: boolean;
  docsUrl?: string;
};

export const INTEGRATION_PROVIDERS: IntegrationProviderMeta[] = [
  {
    id: "slack",
    name: "Slack",
    category: "Notifications",
    description:
      "Post final scores and tournament updates to a Slack channel using an incoming webhook.",
    authType: "webhook",
    secretFields: [
      {
        key: "webhook_url",
        label: "Incoming webhook URL",
        kind: "secret",
        placeholder: "https://hooks.slack.com/services/T000/B000/XXXX",
        required: true,
        help: "Slack › Your apps › Incoming Webhooks › Add New Webhook to Workspace.",
      },
    ],
    configFields: [
      {
        key: "channel_label",
        label: "Channel label",
        kind: "text",
        placeholder: "#basketball-results",
        help: "Shown in the dashboard only.",
      },
    ],
    supportsSync: true,
    supportsInboundWebhook: false,
    docsUrl: "https://api.slack.com/messaging/webhooks",
  },
  {
    id: "webhook",
    name: "Outgoing webhook",
    category: "Automation",
    description:
      "Send signed JSON events (results, standings snapshots) to any HTTPS endpoint — Zapier, Make, n8n or your own API.",
    authType: "api_key",
    secretFields: [
      {
        key: "endpoint_url",
        label: "Endpoint URL",
        kind: "secret",
        placeholder: "https://example.com/hooks/ecluid",
        required: true,
      },
      {
        key: "signing_secret",
        label: "Signing secret",
        kind: "secret",
        placeholder: "optional — used for the X-Ecluid-Signature header",
      },
      {
        key: "inbound_secret",
        label: "Inbound signing secret",
        kind: "secret",
        placeholder: "optional — required to accept inbound webhooks",
      },
    ],
    configFields: [
      {
        key: "events",
        label: "Events",
        kind: "text",
        placeholder: "match.completed",
        help: "Comma separated list of event names to send.",
      },
    ],
    supportsSync: true,
    supportsInboundWebhook: true,
  },
];

export function getProviderMeta(id: string) {
  return INTEGRATION_PROVIDERS.find((p) => p.id === id);
}

export type IntegrationStatus = "connected" | "disconnected" | "error" | "syncing";

export type IntegrationRow = {
  id: string;
  provider: string;
  display_name: string | null;
  enabled: boolean;
  status: IntegrationStatus;
  config: Record<string, unknown>;
  last_synced_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  /** Names of the credential fields that are stored (never the values). */
  configured_secrets?: string[];
};

export type IntegrationRun = {
  id: string;
  integration_id: string;
  kind: string;
  status: string;
  items_processed: number;
  message: string | null;
  started_at: string;
  finished_at: string | null;
};
