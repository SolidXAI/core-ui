import type { AgentInputDefinition } from "./agentEmbedProtocol";

const js = (value: unknown) => JSON.stringify(value, null, 2).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
const examples: Record<string, unknown> = { string: "Replace with your value", number: 0, integer: 0, boolean: false,
    date: "2026-01-01", datetime: "2026-01-01T09:00:00Z", object: {}, array: [] };

export function embedSamples(agentId: number, fields: AgentInputDefinition[], sdkUrl: string, hubBase: string) {
    const values = Object.fromEntries(fields.map((field) => [field.name, examples[field.dataType] ?? "Replace with your value"]));
    const valuesJson = js(values).replace(/\n/g, "\n    ");
    const backendUrl = hubBase.replace(/\/$/, "");
    const environmentNote = `# AGENTHUB_BACKEND_URL=${backendUrl}`;
    const environmentNoteSlash = `// AGENTHUB_BACKEND_URL=${backendUrl}`;
    const config = `agentId: ${agentId},\n    tokenEndpoint: "/api/agent-chat/token",\n    inputs: ${valuesJson}`;
    return {
        javascript: `<div id="agent-chat"></div>
<script src=${JSON.stringify(sdkUrl).replace(/</g, "&lt;")}></script>
<script>
  // Values should come from the current page or trusted app state.
  // The API key and AgentHub URL stay on your server.
  const chat = SolidAgentEmbed.mount({
    container: "#agent-chat",
    ${config}
  });
  // For app auth/CSRF, add getTokenHeaders: () => yourAppAuthHeaders().
  // Optional lifecycle methods: chat.open(), chat.close(), chat.destroy().
  // Update context before the first message or after starting a new chat:
  // await chat.setInputs({ ... });
</script>`,
        react: `"use client";
import { useEffect, useRef } from "react";

type AgentEmbed = { destroy: () => void };
type AgentEmbedSdk = { mount: (options: {
  container: HTMLElement; agentId: number; tokenEndpoint: string;
  inputs: Record<string, unknown>; label?: string; title?: string;
  getTokenHeaders?: () => Record<string, string>;
}) => AgentEmbed };
declare global { interface Window { SolidAgentEmbed?: AgentEmbedSdk } }

const SDK_URL = ${js(sdkUrl)};
let sdkPromise: Promise<AgentEmbedSdk> | undefined;
function loadSdk() {
  if (window.SolidAgentEmbed) return Promise.resolve(window.SolidAgentEmbed);
  if (!sdkPromise) sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => window.SolidAgentEmbed
      ? resolve(window.SolidAgentEmbed)
      : reject(new Error("Agent embed SDK did not initialize"));
    script.onerror = () => { script.remove(); sdkPromise = undefined; reject(new Error("Could not load Agent embed SDK")); };
    document.head.appendChild(script);
  });
  return sdkPromise;
}

export function AgentChat() {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false;
    let chat: AgentEmbed | undefined;
    void loadSdk().then((sdk) => {
      if (disposed || !containerRef.current) return;
      chat = sdk.mount({
        container: containerRef.current,
        ${config.replace(/\n/g, "\n        ")}
      });
    }).catch((error: unknown) => {
      if (!disposed) console.error("Could not initialize agent chat", error);
    });
    return () => { disposed = true; chat?.destroy(); };
  }, []);
  return <div ref={containerRef} />;
}`,
        python: `# FastAPI. Install httpx; mount this router in your application.
# Keep these server-only environment variables out of the browser bundle:
# AGENTHUB_API_KEY, AGENTHUB_AGENT_ID, AGENTHUB_BACKEND_URL
${environmentNote}
import os
import httpx
from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel

router = APIRouter()
AGENTHUB_URL = (os.getenv("AGENTHUB_BACKEND_URL") or "").rstrip("/")

class TokenRequest(BaseModel):
    agentId: int

@router.post("/api/agent-chat/token")
async def create_agent_token(body: TokenRequest, request: Request, response: Response):
    response.headers["Cache-Control"] = "no-store"
    try:
        agent_id = int(os.environ.get("AGENTHUB_AGENT_ID", "0"))
    except ValueError:
        agent_id = 0
    api_key = os.getenv("AGENTHUB_API_KEY")
    if not api_key or not AGENTHUB_URL or agent_id <= 0:
        raise HTTPException(status_code=503, detail="Chat is temporarily unavailable")
    if body.agentId != agent_id:
        raise HTTPException(status_code=400, detail="Agent is not configured for this application")
    # If trusted optional-auth middleware populated request.state.user, pass its stable ID.
    user = getattr(request.state, "user", None)
    external_id = user.get("id") if isinstance(user, dict) else getattr(user, "id", None)
    payload = {"apiKey": api_key, "agentId": agent_id}
    if external_id is not None:
        payload["externalUserId"] = f"my-app:{external_id}"
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            upstream = await client.post(f"{AGENTHUB_URL}/api/agent/api-keys/embedded/me", json=payload)
        if not upstream.is_success:
            raise HTTPException(status_code=502, detail="Chat is temporarily unavailable")
        return upstream.json()  # forward the token response; never cache or log it
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="Chat is temporarily unavailable") from exc
`,
        nestjs: `// NestJS. Uses the app's existing ConfigService and optional auth middleware.
// Add a distributed rate limit at the gateway or with your Nest throttler.
import { Body, Controller, HttpException, HttpStatus, Post, Req, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Public } from "@solidxai/core";
import { Request, Response } from "express";

// Server environment: AGENTHUB_API_KEY=...; AGENTHUB_AGENT_ID=${agentId}
${environmentNoteSlash}
type EmbedRequest = Request & { user?: { id?: string | number; sub?: string | number } };
@Controller("agent-chat")
export class AgentChatController {
  constructor(private readonly config: ConfigService) {}

  @Post("token")
  @Public() // allow anonymous use; remove/replace with your app policy for login-only chat
  async createToken(@Body() body: { agentId: number }, @Req() req: EmbedRequest, @Res() res: Response) {
    res.setHeader("Cache-Control", "no-store");
    const agentId = Number(this.config.get("AGENTHUB_AGENT_ID")); // fixed; never trust browser selection
    const apiKey = this.config.get<string>("AGENTHUB_API_KEY");
    const baseUrl = this.config.get<string>("AGENTHUB_BACKEND_URL")?.replace(/\\/$/, "");
    if (!apiKey || !baseUrl || !Number.isSafeInteger(agentId) || agentId <= 0)
      throw new HttpException("Chat is temporarily unavailable", HttpStatus.SERVICE_UNAVAILABLE);
    if (body.agentId !== agentId) throw new HttpException("Agent is not configured", HttpStatus.BAD_REQUEST);
    const userId = req.user?.id ?? req.user?.sub; // set only by trusted auth middleware
    const payload = { apiKey, agentId, ...(userId != null ? { externalUserId: "my-app:" + userId } : {}) };
    try {
      const upstream = await fetch(baseUrl + "/api/agent/api-keys/embedded/me", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), signal: AbortSignal.timeout(15_000),
      });
      if (!upstream.ok) throw new HttpException("Chat is temporarily unavailable", HttpStatus.BAD_GATEWAY);
      res.status(200).type("application/json").send(await upstream.text());
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException("Chat is temporarily unavailable", HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}
// Mount behind trusted proxy configuration and rate limiting. Apply the app's
// authentication/authorization guard instead of @Public() when access is restricted.`,
        express: `// Express (Node.js 20+). Mount after any optional authentication middleware.
// Protect this public endpoint with a distributed/IP-aware rate limiter in production.
// Server environment: AGENTHUB_API_KEY=...; AGENTHUB_AGENT_ID=${agentId}
${environmentNoteSlash}
import express from "express";

const router = express.Router();
router.post("/api/agent-chat/token", async (req, res) => {
  res.set("Cache-Control", "no-store");
  const agentId = Number(process.env.AGENTHUB_AGENT_ID); // fixed server-side allowlist
  const apiKey = process.env.AGENTHUB_API_KEY;
  const baseUrl = process.env.AGENTHUB_BACKEND_URL?.replace(/\\/$/, "");
  if (!apiKey || !baseUrl || !Number.isSafeInteger(agentId) || agentId <= 0)
    return res.status(503).json({ error: "Chat is temporarily unavailable" });
  if (Number(req.body?.agentId) !== agentId)
    return res.status(400).json({ error: "Agent is not configured for this application" });
  const userId = req.user?.id ?? req.user?.sub; // optional identity from trusted middleware
  try {
    const upstream = await fetch(baseUrl + "/api/agent/api-keys/embedded/me", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, agentId, ...(userId != null ? { externalUserId: "my-app:" + userId } : {}) }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!upstream.ok) return res.status(502).json({ error: "Chat is temporarily unavailable" });
    return res.status(200).type("application/json").send(await upstream.text());
  } catch {
    return res.status(503).json({ error: "Chat is temporarily unavailable" });
  }
});
export default router;
// Ensure express.json() is installed. Never accept API key/backend URL from req.body.`,
        java: `// Spring Boot 3 / Java 17+. Keep this route public for anonymous embeds,
// or apply your application's authorization policy. Add a distributed rate limiter.
// Server environment: AGENTHUB_API_KEY=...; AGENTHUB_AGENT_ID=${agentId}
${environmentNoteSlash}
@RestController
public class AgentEmbedController {
  private final java.net.http.HttpClient client = java.net.http.HttpClient.newBuilder()
      .connectTimeout(java.time.Duration.ofSeconds(5)).build();
  private final com.fasterxml.jackson.databind.ObjectMapper json = new com.fasterxml.jackson.databind.ObjectMapper();

  @Value("\${AGENTHUB_API_KEY}") private String apiKey;
  @Value("\${AGENTHUB_AGENT_ID}") private int agentId;
  @Value("\${AGENTHUB_BACKEND_URL}") private String agentHubUrl;

  @PostMapping("/api/agent-chat/token")
  public ResponseEntity<String> token(@RequestBody Map<String, Object> request,
                                      org.springframework.security.core.Authentication authentication) throws Exception {
    if (!Integer.valueOf(agentId).equals(request.get("agentId")))
      return ResponseEntity.badRequest().cacheControl(CacheControl.noStore()).build();
    Map<String, Object> payload = new java.util.HashMap<>();
    payload.put("apiKey", apiKey); payload.put("agentId", agentId);
    // Omit externalUserId for anonymous access; ignore anonymous security principals.
    if (authentication != null && authentication.isAuthenticated() &&
        !(authentication instanceof org.springframework.security.authentication.AnonymousAuthenticationToken))
      payload.put("externalUserId", "my-app:" + authentication.getName());
    var upstreamRequest = java.net.http.HttpRequest.newBuilder()
        .uri(java.net.URI.create(agentHubUrl.replaceAll("/+$", "") + "/api/agent/api-keys/embedded/me"))
        .timeout(java.time.Duration.ofSeconds(15)).header("Content-Type", "application/json")
        .POST(java.net.http.HttpRequest.BodyPublishers.ofString(json.writeValueAsString(payload))).build();
    try {
      var upstream = client.send(upstreamRequest, java.net.http.HttpResponse.BodyHandlers.ofString());
      if (upstream.statusCode() != 200)
        return ResponseEntity.status(502).cacheControl(CacheControl.noStore()).build();
      return ResponseEntity.ok().cacheControl(CacheControl.noStore())
          .contentType(MediaType.APPLICATION_JSON).body(upstream.body());
    } catch (java.io.IOException | InterruptedException error) {
      if (error instanceof InterruptedException) Thread.currentThread().interrupt();
      return ResponseEntity.status(503).cacheControl(CacheControl.noStore()).build();
    }
  }
}
// Imports: org.springframework.beans.factory.annotation.Value, web.bind.annotation.*,
// org.springframework.http.*, java.util.Map. Do not log the key or token response.`,
        dotnet: `// ASP.NET Core Minimal API. Configure an IP/user rate-limit policy in production.
// Authentication can be optional (anonymous demo) or required by your app's policy.
// Server environment: AGENTHUB_API_KEY=...; AGENTHUB_AGENT_ID=${agentId}
${environmentNoteSlash}
using System.Security.Claims;
using System.Collections.Generic;
using System.Net.Http.Json;

builder.Services.AddHttpClient("AgentHub", client => client.Timeout = TimeSpan.FromSeconds(15));
app.MapPost("/api/agent-chat/token", async (AgentTokenRequest body, HttpContext context, IHttpClientFactory clients, IConfiguration config) => {
    context.Response.Headers.CacheControl = "no-store";
    if (!int.TryParse(config["AGENTHUB_AGENT_ID"], out var agentId) || agentId <= 0)
        return Results.StatusCode(503);
    var apiKey = config["AGENTHUB_API_KEY"];
    var baseUrl = config["AGENTHUB_BACKEND_URL"]?.TrimEnd('/');
    if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(baseUrl))
        return Results.StatusCode(503);
    if (body.AgentId != agentId)
        return Results.BadRequest(new { error = "Agent is not configured for this application" });
    var subject = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    var payload = new Dictionary<string, object?> { ["apiKey"] = apiKey, ["agentId"] = agentId };
    if (context.User.Identity?.IsAuthenticated == true && !string.IsNullOrEmpty(subject))
        payload["externalUserId"] = "my-app:" + subject;
    try {
        var upstream = await clients.CreateClient("AgentHub").PostAsJsonAsync(
            baseUrl + "/api/agent/api-keys/embedded/me", payload, context.RequestAborted);
        if (!upstream.IsSuccessStatusCode) return Results.StatusCode(502);
        return Results.Text(await upstream.Content.ReadAsStringAsync(context.RequestAborted), "application/json");
    } catch (HttpRequestException) { return Results.StatusCode(503); }
}).AllowAnonymous(); // Replace with .RequireAuthorization() for login-only chat.
public sealed record AgentTokenRequest(int AgentId);
// Imports: Microsoft.AspNetCore.Http, System.Net.Http.Json, System.Collections.Generic.
// Add a distributed rate limiter and trusted-proxy configuration for public deployments.`,
    };
}
