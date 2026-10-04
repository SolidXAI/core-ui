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
            <p>Store the key in SOLIDX_API_KEY. Your browser code receives an agent token; it never receives the API key.</p>
        </section>
        <section className="agent-editor__section"><h2>2. Create your token endpoint</h2>
            <p>Keep the API key on your server and apply your application's access policy and rate limits. externalUserId is optional: when supplied, derive it on the server to isolate each user's sessions; omit it for anonymous embeds. Return the AgentHub response unchanged with Cache-Control: no-store.</p>
            <SolidTabGroup tabs={[
                { value: "express", label: "Express", content: code(samples.express, "javascript") },
                { value: "java", label: "Java / Spring Boot", content: code(samples.java, "java") },
                { value: "dotnet", label: ".NET / ASP.NET Core", content: code(samples.dotnet, "csharp") },
            ]} value={backend} onValueChange={setBackend} extra={copyButton(backend, samples[backend as "express" | "java" | "dotnet"])} />
        </section>
        <section className="agent-editor__section"><h2>3. Embed the chat</h2>
            <p>The SDK adds a launcher to your container and opens the hosted chat in a popover. It handles authentication and token renewal automatically. No SolidX npm dependency is required.</p>
            <p>The hosted chat UI is selected by the SDK-serving API's <code>AGENT_EMBED_UI_URL</code> deployment setting.</p>
            <SolidTabGroup tabs={[
                { value: "javascript", label: "JavaScript", content: code(samples.javascript, "html") },
                { value: "react", label: "React", content: code(samples.react, "javascript") },
            ]} value={tab} onValueChange={setTab} extra={copyButton(tab, tab === "javascript" ? samples.javascript : samples.react)} />
        </section>
        <section className="agent-editor__section"><h2>Required inputs</h2>
            {fields.length ? <table style={{ width: "100%", textAlign: "left" }}><thead><tr><th>Variable</th><th>Data type</th><th>Description</th></tr></thead>
                <tbody>{fields.map((field) => <tr key={field.name}><td><code>{field.name}</code></td><td>{field.dataType}</td><td>{field.description}</td></tr>)}</tbody></table>
                : <p>This agent has no required inputs.</p>}
            <p>Replace sample values with your application's values. Inputs are fixed after the first message; start a new chat to change them. Input values describe the task and do not grant access to data.</p>
        </section>
        <section className="agent-editor__section"><h2>Hosting</h2><p>Serve the chat over HTTPS with this route available: <code>/embed/agent/{agentId}</code>. Configure the chat server's frame-ancestors policy for your integrating sites and AgentHub's AGENTHUB_CORS_ORIGINS for the hosted chat origin. Allow the SDK script and iframe in the third party's CSP.</p></section>
        {copyError && <p role="alert">{copyError}</p>}
    </div>;
}
