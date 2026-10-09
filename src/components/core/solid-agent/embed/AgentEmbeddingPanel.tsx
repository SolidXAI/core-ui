import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { env } from "../../../../adapters/env";
import { SolidButton, SolidCodeEditor, SolidTabGroup } from "../../../shad-cn-ui";
import type { AgentInputDefinition } from "./agentEmbedProtocol";
import { embedSamples } from "./agentEmbedSamples";

export function AgentEmbeddingPanel({ agentId, fields, hubUrl, active }: { agentId: number; fields: AgentInputDefinition[]; hubUrl: string; active: boolean }) {
    const [tab, setTab] = useState("javascript");
    const [backend, setBackend] = useState("express");
    const [copied, setCopied] = useState("");
    const [copyError, setCopyError] = useState("");
    const sdkUrl = `${env("NEXT_PUBLIC_BACKEND_API_URL").replace(/\/$/, "")}/api/agent-embed/sdk.js?v=2`;
    const samples = embedSamples(agentId, fields, sdkUrl, hubUrl || "https://agenthub.example.com");
    async function copy(key: string, code: string) {
        try { await navigator.clipboard.writeText(code); setCopied(key); setCopyError(""); }
        catch { setCopyError("Clipboard access is unavailable. Select and copy the code below."); }
    }
    const code = (value: string, language: string) => <SolidCodeEditor readOnly value={value} language={language} fontSize={11} height="420px" />;
    const copyButton = (key: string, value: string) => <SolidButton variant="secondary" size="small" onClick={() => void copy(key, value)}>
        {copied === key ? <Check size={14} /> : <Copy size={14} />} {copied === key ? "Copied" : "Copy code"}
    </SolidButton>;
    return <div className="agent-editor__stack">
        {!active && <p role="status" className="agent-editor__hint">Activate this agent before embedding it. Samples use the saved agent definition.</p>}
        <section className="agent-editor__section"><h2>1. Keep your API key on your server</h2>
            <p>Configure <code>AGENTHUB_API_KEY</code>, <code>AGENTHUB_AGENT_ID</code>, and <code>AGENTHUB_BACKEND_URL</code> on the server that hosts your app API. Never expose the API key or AgentHub runtime URL in browser code. The browser receives only the short-lived embed response through the SDK handshake.</p>
        </section>
        <section className="agent-editor__section"><h2>2. Create your token endpoint</h2>
            <p>Your app API accepts the SDK's token request, ignores any client-selected backend or API key, and uses the configured agent ID to call <code>/api/agent/api-keys/embedded/me</code> on AgentHub Runtime. Return the successful JSON response unchanged with <code>Cache-Control: no-store</code>; never cache or log credentials or tokens.</p>
            <p>Anonymous embeds can expose this endpoint publicly, as in the demo. Add rate limiting at your API or gateway and use your app's authorization policy when chat access should require sign-in. <code>externalUserId</code> is optional: when the trusted auth layer supplies a stable user ID, send a namespaced value; omit it for anonymous visitors. The runtime manages chat sessions independently.</p>
            <SolidTabGroup tabs={[
                { value: "python", label: "Python / FastAPI", content: code(samples.python, "python") },
                { value: "nestjs", label: "NestJS", content: code(samples.nestjs, "typescript") },
                { value: "express", label: "Express", content: code(samples.express, "javascript") },
                { value: "java", label: "Java / Spring Boot", content: code(samples.java, "java") },
                { value: "dotnet", label: ".NET / ASP.NET Core", content: code(samples.dotnet, "csharp") },
            ]} value={backend} onValueChange={setBackend} extra={copyButton(backend, samples[backend as keyof typeof samples])} />
        </section>
        <section className="agent-editor__section"><h2>3. Embed the chat</h2>
            <p>Load the SDK from the public SDK URL shown below and mount it into a browser container. The SDK calls your app's <code>tokenEndpoint</code>, passes the response to the hosted chat in memory, and manages the iframe handshake and token renewal. No SolidX npm dependency is required.</p>
            <p>Use a same-origin path such as <code>/api/agent-chat/token</code> when possible. If your app API has another origin, give <code>tokenEndpoint</code> its absolute URL and configure that API's CORS policy for the browser app origin.</p>
            <p>The SDK-serving SolidX API selects the hosted chat UI from its server-side <code>AGENT_EMBED_UI_URL</code> setting. The consuming app does not supply an <code>embedUrl</code> or choose the iframe host. Keep the SDK script URL and the configured hosted UI origin aligned to the same SolidX deployment.</p>
            <p>Pass the current page's required input values in <code>inputs</code> using the names and types in this agent's schema. These values provide task context; they are not authorization to access records. Enforce access to protected data in your own API/tools. For a logged-in app, use <code>getTokenHeaders</code> to send the app's normal bearer or CSRF header to your app API; do not send the AgentHub API key from the browser.</p>
            <SolidTabGroup tabs={[
                { value: "javascript", label: "JavaScript", content: code(samples.javascript, "html") },
                { value: "react", label: "React", content: code(samples.react, "javascript") },
            ]} value={tab} onValueChange={setTab} extra={copyButton(tab, tab === "javascript" ? samples.javascript : samples.react)} />
        </section>
        <section className="agent-editor__section"><h2>Inputs</h2>
            {fields.length ? <table style={{ width: "100%", textAlign: "left" }}><thead><tr><th>Variable</th><th>Data type</th><th>Description</th><th>Default value</th><th>Optional</th></tr></thead>
                <tbody>{fields.map((field) => <tr key={field.name}><td><code>{field.name}</code></td><td>{field.dataType}</td><td>{field.description}</td><td>{field.defaultValue == null ? "—" : typeof field.defaultValue === "string" ? field.defaultValue : JSON.stringify(field.defaultValue)}</td><td>{field.optional ? "Yes" : "No"}</td></tr>)}</tbody></table>
                : <p>This agent has no inputs.</p>}
            <p>Replace sample values with the current page's values and preserve each declared type. Default values are used when an input is omitted; optional inputs may be omitted without a default. Inputs are fixed after the first message; start a new chat to change them. They describe the task and do not grant access to data.</p>
        </section>
        <section className="agent-editor__section"><h2>Hosting and deployment</h2><p>Make <code>/embed/agent/{agentId}</code> available on the hosted UI selected by <code>AGENT_EMBED_UI_URL</code>. Allow the consuming app origin in the hosted UI's frame-ancestors policy, the AgentHub Runtime origin in its CORS configuration, and the SDK/API/iframe origins in the consuming app's CSP. Use HTTPS for the consuming page, SDK, hosted UI, and runtime in production.</p></section>
        {copyError && <p role="alert">{copyError}</p>}
    </div>;
}
