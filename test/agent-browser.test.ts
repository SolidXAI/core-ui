import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

// node --experimental-strip-types --test test/agent-browser.test.ts
// The sources import siblings without extensions, as the bundler resolves them; try ".ts" here.
registerHooks({
    resolve(specifier, context, nextResolve) {
        try {
            return nextResolve(specifier, context);
        } catch (error) {
            if (!specifier.startsWith(".") || /\.[cm]?[jt]sx?$/.test(specifier)) throw error;
            return nextResolve(`${specifier}.ts`, context);
        }
    },
});

const { AgentBrowserChannel, isBrowserActive } = await import("../src/components/core/solid-agent/client/agentBrowser.ts");
const { applyAgentEvent, createThreadState, historyToItems, normalizeAgentFrame } = await import("../src/components/core/solid-agent/agentEvents.ts");
const { mergeToolFileMedia, normalizeToolFiles } = await import("../src/components/core/solid-agent/toolFiles.ts");
const { humanReviewId } = await import("../src/components/core/solid-agent/humanReview.ts");

type Sent = Record<string, any>;

function setup({ ready = true } = {}) {
    const sent: Sent[] = [];
    const socket = {
        currentSessionId: "s1" as string | null,
        ready,
        sendNow(action: Sent) {
            if (!this.ready || !this.currentSessionId) return false;
            sent.push(action);
            return true;
        },
    };
    const timers: Array<{ callback: () => void; ms: number; cancelled: boolean }> = [];
    let now = 1_000;
    const channel = new AgentBrowserChannel(socket as any, {
        setTimeout: (callback, ms) => { const timer = { callback, ms, cancelled: false }; timers.push(timer); return timer; },
        clearTimeout: (timer) => { if (timer) timer.cancelled = true; },
        now: () => now,
    });
    channel.sessionStarted("s1");
    const runTimers = () => timers.splice(0).forEach((timer) => { if (!timer.cancelled) timer.callback(); });
    return { channel, socket, sent, runTimers, advance: (ms: number) => { now += ms; } };
}

const live = { state: "live", control_mode: "agent", viewport: { width: 1024, height: 640 }, active_tab: "t1", url: "https://example.com/" };
const actions = (sent: Sent[]) => sent.map((action) => action.action);

describe("AgentBrowserChannel", () => {
    it("asks for the preview only while watched and the browser runs", () => {
        const { channel, sent } = setup();
        const release = channel.watch();
        assert.deepEqual(sent, [], "no browser yet");
        channel.handle("browser_status", live);
        assert.deepEqual(sent, [{ action: "browser_preview_start", session_id: "s1" }]);
        assert.equal(channel.getView().watching, true);
        assert.deepEqual(channel.getView().viewport, { width: 1024, height: 640 });
        channel.handle("browser_status", live);
        assert.equal(sent.length, 1, "one subscription per socket");
        release();
    });

    it("keeps the preview across a quick viewer swap and stops it after the last viewer leaves", () => {
        const { channel, sent, runTimers } = setup();
        channel.handle("browser_status", live);
        const pane = channel.watch();
        pane();
        const dialog = channel.watch();
        runTimers();
        assert.deepEqual(actions(sent), ["browser_preview_start"]);
        dialog();
        runTimers();
        assert.deepEqual(actions(sent), ["browser_preview_start", "browser_preview_stop"]);
        assert.equal(channel.getView().watching, false);
    });

    it("subscribes again after a reconnect and starts empty for another session", () => {
        const { channel, socket, sent } = setup();
        channel.handle("browser_status", live);
        channel.handle("browser_frame", { tab: "t1", url: "https://example.com/a", title: "A", format: "jpeg", data: "AAA", seq: 3 });
        channel.watch();
        channel.sessionStarted("s1");
        assert.deepEqual(actions(sent), ["browser_preview_start", "browser_preview_start"]);
        assert.equal(channel.getView().hasFrame, true, "the same session keeps its last picture");
        socket.currentSessionId = "s2";
        channel.sessionStarted("s2");
        assert.equal(channel.getView().state, "none");
        assert.equal(channel.latestFrame, null);
        assert.equal(sent.length, 2, "the new session has no running browser yet");
    });

    it("stops the old preview when the chat is reset", () => {
        const { channel, sent } = setup();
        channel.handle("browser_status", live);
        channel.watch();
        channel.reset();
        assert.deepEqual(sent.at(-1), { action: "browser_preview_stop", session_id: "s1" });
        assert.equal(channel.getView().sessionId, null);
    });

    it("draws frames in order and takes the page address from them", () => {
        const { channel } = setup();
        const drawn: number[] = [];
        channel.onFrame((frame) => drawn.push(frame.seq));
        channel.handle("browser_status", live);
        channel.handle("browser_frame", { url: "https://example.com/2", title: "Two", data: "B", seq: 2 });
        channel.handle("browser_frame", { url: "https://example.com/1", data: "A", seq: 1 });
        channel.handle("browser_frame", { data: "", seq: 3 });
        assert.deepEqual(drawn, [2]);
        assert.equal(channel.getView().url, "https://example.com/2");
        assert.equal(channel.getView().title, "Two");
        channel.handle("browser_status", { ...live, state: "released" });
        assert.equal(channel.latestFrame, null);
        assert.equal(isBrowserActive(channel.getView()), false);
    });

    it("forwards input only while the user has control", () => {
        const { channel, sent } = setup();
        channel.handle("browser_status", live);
        const click = { kind: "mouse", type: "mousePressed", x: 1, y: 2, button: "left", clickCount: 1, modifiers: 0 } as const;
        assert.equal(channel.sendInput(click), false);
        channel.handle("browser_control_state", { control_mode: "human", pending: false, reason: "Sign in", expires_at: "2030-01-01T00:00:00+00:00" });
        assert.equal(channel.sendInput(click), true);
        assert.equal(channel.navigate("example.org/path"), true);
        assert.equal(channel.navigation("back"), true);
        assert.deepEqual(sent.filter((action) => action.action === "browser_input").map((action) => action.event), [
            click, { kind: "navigation", url: "https://example.org/path" }, { kind: "navigation", action: "back" },
        ]);
        assert.deepEqual(channel.getView().control, { mode: "human", pending: false, reason: "Sign in", expiresAt: "2030-01-01T00:00:00+00:00" });
    });

    it("sends control requests and releases with a trimmed note", () => {
        const { channel, sent } = setup();
        assert.equal(channel.requestControl(), true);
        assert.equal(channel.release("  done, signed in "), true);
        assert.equal(channel.release("   "), true);
        assert.deepEqual(sent, [
            { action: "browser_control_request", session_id: "s1" },
            { action: "browser_control_release", session_id: "s1", note: "done, signed in" },
            { action: "browser_control_release", session_id: "s1", note: null },
        ]);
    });

    it("reports an offline error instead of queueing control actions", () => {
        const { channel, socket, sent } = setup();
        socket.ready = false;
        assert.equal(channel.release(), false);
        assert.equal(sent.length, 0);
        assert.equal(channel.getView().error?.code, "offline");
        channel.clearError();
        assert.equal(channel.getView().error, null);
    });

    it("marks the browser unavailable when the agent has no browser tools, and notes a restored session", () => {
        const { channel, advance } = setup();
        advance(500);
        channel.handle("browser_status", { ...live, restored: true });
        assert.equal(channel.getView().restoredAt, 1_500);
        channel.handle("browser_error", { code: "no_browser", message: "Browser tools are not enabled for this agent" });
        assert.equal(channel.getView().available, false);
        assert.equal(isBrowserActive(channel.getView()), false);
        assert.equal(channel.handle("ToolCalling", {}), false);
    });
});

const frame = (type: string, data: Record<string, any> = {}, extra: Record<string, any> = {}) =>
    normalizeAgentFrame({ type, data, session_id: "s1", ...extra });

describe("browser handoff in the thread", () => {
    it("ends the working turn and waits for the browser panel", () => {
        const state = createThreadState();
        state.working = true;
        state.thinking = true;
        applyAgentEvent(state, frame("ToolCalling", { tool_name: "browser_handoff", arguments: { reason: "Sign in" } }));
        applyAgentEvent(state, frame("human_request", {
            kind: "browser_control", question: "Please sign in to the portal", options: null, request_id: 41,
            tool_name: "browser_handoff", tool_arguments: { reason: "Sign in" }, context: { expires_at: "2030-01-01T00:00:00+00:00" },
        }));
        assert.equal(state.working, false);
        assert.equal(state.thinking, false);
        assert.equal(state.pendingReview?.kind, "browser_control");
        assert.equal(state.pendingReview?.requestId, 41);
        const item = state.items.find((entry) => entry.id === humanReviewId(41));
        assert.equal(item?.widget, "status");
        assert.equal(item?.eventData.title, "The agent handed you the browser");
        assert.equal(item?.eventData.message, "Please sign in to the portal");

        applyAgentEvent(state, frame("human_response_accepted", { request_id: 41, kind: "browser_control", choice: "release", text: "Signed in" }));
        assert.equal(state.pendingReview, null);
        assert.equal(state.reviewResuming, true);
        assert.equal(state.working, true);
        assert.equal(item?.final, true);
        assert.equal(state.items.at(-1)?.eventData.content, "Browser returned to the agent.\nSigned in");

        applyAgentEvent(state, frame("human_response_accepted", { request_id: 41, kind: "browser_control", choice: "release", text: "Signed in" }));
        assert.equal(state.items.filter((entry) => entry.id.endsWith("-answer")).length, 1, "the resume job repeats the acceptance");
        applyAgentEvent(state, frame("human_resume_finished", { status: "succeeded" }));
        assert.equal(state.working, false);
        assert.equal(state.reviewResuming, false);
    });

    it("restores a parked handoff from session_started after a reload", () => {
        const state = createThreadState();
        applyAgentEvent(state, normalizeAgentFrame({
            type: "session_started", session_id: "s1", status: "awaiting_input",
            pendingRequest: { requestId: 7, kind: "browser_control", question: "You have control of the browser. Give it back when you are done.",
                options: null, context: { takeover: true }, toolName: "browser_takeover", toolArguments: {} },
        }));
        assert.equal(state.working, false);
        assert.equal(state.pendingReview?.kind, "browser_control");
        assert.equal(state.items.find((entry) => entry.id === humanReviewId(7))?.eventData.title, "You have the browser");
    });
});

describe("tool files", () => {
    it("keeps a tool's stored files and their event id", () => {
        const state = createThreadState();
        applyAgentEvent(state, frame("ToolCalling", { tool_name: "browser_screenshot", arguments: {} }));
        applyAgentEvent(state, frame("ToolResult", {
            tool_name: "browser_screenshot", output: "{\"ok\":true}", returncode: 0, agentEventId: 901,
            files: [{ mediaId: 55, name: "page.png", mimeType: "image/png", size: 2048, url: "solidx-media:55" }],
        }));
        const tool = state.items.find((entry) => entry.eventType === "ToolCalling");
        assert.equal(tool?.eventData.agentEventId, 901);
        assert.deepEqual(tool?.eventData.files, [{ mediaId: 55, name: "page.png", mimeType: "image/png", size: 2048 }]);
    });

    it("replays files from history", () => {
        const items = historyToItems([
            { id: "10", event_type: "ToolCalling", event_data: { tool_name: "browser_download", arguments: {} } },
            { id: "11", event_type: "ToolResult", event_data: { tool_name: "browser_download", output: "ok", agentEventId: 11,
                files: [{ mediaId: 3, name: "report.pdf", mimeType: "application/pdf" }] } },
        ]);
        assert.equal(items.length, 1);
        assert.equal(items[0].eventData.agentEventId, 11);
        assert.equal(items[0].eventData.files[0].name, "report.pdf");
    });

    it("matches stored media by id, then name, then position", () => {
        const files = normalizeToolFiles([
            { mediaId: 1, name: "a.png", mimeType: "image/png" },
            { mediaId: 2, name: "b.pdf", mimeType: "application/pdf" },
        ]);
        assert.deepEqual(mergeToolFileMedia(files, [{ id: 2, url: "/b" }, { id: 1, url: "/a" }]).map((file) => file.url), ["/a", "/b"]);
        assert.deepEqual(mergeToolFileMedia(files, [{ name: "b.pdf", url: "/b" }]).map((file) => file.url), [undefined, "/b"]);
        assert.deepEqual(mergeToolFileMedia(files, [{ url: "/x" }, { url: "/y" }]).map((file) => file.url), ["/x", "/y"]);
        assert.deepEqual(normalizeToolFiles([null, { name: "" }, "x"]), [{ name: "file", mimeType: "" }]);
    });
});
