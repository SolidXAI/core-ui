# Embed a SolidX admin screen

The admin embed reuses the routes registered by `getSolidRoutes()`, including registered `extraAdminRoutes` under `/admin`. It renders the screen with its normal data requests and permissions inside an iframe. The host page loads the SDK from the SolidX API and supplies a token endpoint on the host application's own origin.

## Configure the SolidX deployment

1. Deploy the updated core API and UI. Set `ADMIN_EMBED_UI_URL` on the API to the base URL of the hosted UI, for example `https://portal.solidx.example`. The SDK appends `/embed/admin` to that base.
2. On the UI response for `/embed/admin`, set `Content-Security-Policy: frame-ancestors https://your-app.example`. Check that other frame restrictions in the deployment allow that origin. Use separate HTTPS origins for the UI and the host application. Add the UI origin to `SECURITY_CORS_ORIGINS` on the SolidX API when the API uses a CORS allowlist. If the host sets CSP, allow the SDK's API origin in `script-src` and the SolidX UI origin in `frame-src`.
3. Keep the SolidX API key on the host server. Use an active SolidX account with no outstanding password change and permissions that match what the host is authorized to show. The Jobs inbox shows background runs owned by that account. Choose the API key for the authorized user's SolidX identity if the host needs per-user inboxes.

## Add the token endpoint

For each authorized host request to `POST /api/solidx-portal-token`, call the SolidX API server-to-server. Verify the host session and authorization for the SolidX identity before making this request, and apply the host application's CSRF protection. Resolve the API key and SolidX API URL from server configuration.

```js
// Call from the host's authenticated, CSRF-protected POST handler.
async function issueSolidXPortalToken() {
  const upstream = await fetch(
    `${process.env.SOLIDX_API_URL}/api/iam/api-keys/portal-session`,
    {
      method: "POST",
      headers: { "solidx-api-key": process.env.SOLIDX_PORTAL_API_KEY },
      redirect: "error",
    },
  );
  return new Response(
    upstream.ok ? await upstream.text() : JSON.stringify({ error: "SolidX session unavailable" }),
    {
      status: upstream.ok ? 200 : upstream.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    },
  );
}
```

The SDK relays the access token to the iframe using origin-checked messages. The iframe keeps its session in memory and requests a new token through the same endpoint as expiry approaches. Core API requests recheck the key and account and apply current permissions. The token lasts up to five minutes and carries the key owner's API permissions. Route, query, and context inputs control the UI and should be treated as caller-controlled values.

## Mount the Jobs inbox

```html
<div id="jobs-inbox" style="height: 720px"></div>
<script src="https://api.solidx.example/api/admin-embed/sdk.js"></script>
<script>
  const inbox = SolidXAdminEmbed.mount({
    container: "#jobs-inbox",
    tokenEndpoint: "/api/solidx-portal-token",
    type: "custom",
    route: "/admin/core/solid-core/agent-session/inbox",
    title: "Jobs inbox",
    context: { agent: "Purchase Request Reviewer" },
    query: { review: "true" },
    onError: (error) => console.error(error.message),
  });
  // Call inbox.destroy() when the host removes this screen.
</script>
```

The inbox accepts `review=true`, `agent`, `status`, `trigger`, `runtime`, `startedFrom`, `startedTo`, and `run`. Use `YYYY-MM-DD` for dates and a session ID for `run`. Users can edit or clear the initial filters from the inbox.

For a metadata-driven screen, use `type: "solid", moduleName: "solid-core", modelName: "agent-session", view: "list"`. The supported view values are `list`, `kanban`, `tree`, and `card`. Supply `actionId` and `menuItemId` in `query` when you want the screen to resolve the same metadata as a specific menu action. For forms, dashboards, and other registered routes, use `type: "custom"` with the route.

Screens receive the route query through React Router. Context keys provide query defaults, and the full context object is serialized in `actionContext`. Explicit `query` entries take precedence over the route query and context defaults. Keep secrets out of query and context. The iframe document stays at `/embed/admin` and tracks the mounted route in its hash. App-specific screens should use React Router's location and search parameters for navigation. Popup and new-tab flows need an integration that opens their target in the embed.
