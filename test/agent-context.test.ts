import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

// node --experimental-strip-types --test test/agent-context.test.ts
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

const { applyAgentEvent, createThreadState, historyToItems, normalizeAgentFrame } = await import("../src/components/core/solid-agent/agentEvents.ts");

const frame = (type: string, data: Record<string, any> = {}, extra: Record<string, any> = {}) =>
    normalizeAgentFrame({ type, data, session_id: "s1", ...extra });

const compacted = {
    strategy: "summarize", trigger: "threshold", tokens_before: 16_500, tokens_after: 9_000,
    archived_items: 4, context_window: 20_000, trigger_tokens: 15_000, step: 7,
};

describe("context window usage", () => {
    it("takes the window and compaction threshold from session_started", () => {
        const state = createThreadState();
        applyAgentEvent(state, frame("session_started", {}, {
            provider: "solidx", total_cost: 0.2, context_tokens: 3_000, context_limit: 20_000, compaction_threshold: 15_000,
        }));
        assert.equal(state.usage?.contextTokens, 3_000);
        assert.equal(state.usage?.contextLimit, 20_000);
        assert.equal(state.usage?.compactAt, 15_000);
        assert.equal(state.usage?.totalCost, 0.2);
    });

    it("follows every step of a long turn and keeps the threshold null when compaction is off", () => {
        const state = createThreadState();
        applyAgentEvent(state, frame("StepComplete", { step: 1, context_tokens: 5_000, context_limit: 20_000, compaction_threshold: null }));
        assert.equal(state.usage?.contextTokens, 5_000);
        assert.equal(state.usage?.compactAt, null);
        applyAgentEvent(state, frame("StepComplete", { step: 2, context_tokens: 7_500, context_limit: 20_000, compaction_threshold: null }));
        assert.equal(state.usage?.contextTokens, 7_500);
    });

    it("ignores steps without context figures", () => {
        const state = createThreadState();
        applyAgentEvent(state, frame("StepComplete", { step: 1 }));
        assert.equal(state.usage, null);
    });

    it("drops to the compacted size and shows a divider when the context is compacted", () => {
        const state = createThreadState();
        applyAgentEvent(state, frame("StepComplete", { step: 6, context_tokens: 16_500, context_limit: 20_000, compaction_threshold: 15_000 }));
        applyAgentEvent(state, frame("ContextCompacted", compacted));
        assert.equal(state.usage?.contextTokens, 9_000);
        assert.equal(state.usage?.contextLimit, 20_000);
        assert.equal(state.usage?.compactAt, 15_000);
        const item = state.items.at(-1);
        assert.equal(item?.eventType, "ContextCompacted");
        assert.deepEqual(item?.eventData, {
            strategy: "summarize", trigger: "threshold", tokens_before: 16_500, tokens_after: 9_000,
            archived_items: 4, context_window: 20_000,
        });
    });

    it("keeps the compaction divider in stored history", () => {
        const items = historyToItems([
            { id: "1", event_type: "UserMessage", event_data: { content: "Review every file" }, role: "user" },
            { id: "2", event_type: "ContextCompacted", event_data: compacted, role: "assistant" },
        ]);
        const divider = items.find((item: any) => item.eventType === "ContextCompacted");
        assert.ok(divider);
        assert.equal(divider.eventData.tokens_after, 9_000);
    });
});
