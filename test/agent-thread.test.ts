import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyWidgetContent, isSameAssistantContent, parseWidgetContent } from "../src/components/core/solid-agent/thread/inlineWidget.ts";

// node --experimental-strip-types --test test/agent-thread.test.ts


describe("Agent Thread Helper Tests", () => {
    describe("isSameAssistantContent", () => {
        it("returns true for null/undefined or identical empty strings", () => {
            assert.equal(isSameAssistantContent(undefined, undefined), true);
            assert.equal(isSameAssistantContent("", ""), true);
            assert.equal(isSameAssistantContent("   ", ""), true);
        });

        it("returns false when only one string is provided", () => {
            assert.equal(isSameAssistantContent("hello", undefined), false);
            assert.equal(isSameAssistantContent(undefined, "hello"), false);
        });

        it("returns true for identical content regardless of whitespace padding", () => {
            assert.equal(isSameAssistantContent("Hello world", "Hello world"), true);
            assert.equal(isSameAssistantContent("  Hello world \n", "Hello world"), true);
        });

        it("returns true when comparing identical JSON widget envelopes", () => {
            const json1 = JSON.stringify({ widgetName: "table", data: { rows: [{ id: 1, name: "item" }] } });
            const json2 = JSON.stringify({ widgetName: "table", data: { rows: [{ id: 1, name: "item" }] } });
            assert.equal(isSameAssistantContent(json1, json2), true);
        });

        it("returns false when widget types differ", () => {
            const tableJson = JSON.stringify({ widgetName: "table", data: { rows: [] } });
            const statusJson = JSON.stringify({ widgetName: "status", data: { tone: "success" } });
            assert.equal(isSameAssistantContent(tableJson, statusJson), false);
        });

        it("returns true when comparing a markdown envelope to raw markdown text", () => {
            const markdownEnvelope = JSON.stringify({ widgetName: "markdown", data: "Analysis complete." });
            assert.equal(isSameAssistantContent(markdownEnvelope, "Analysis complete."), true);
            assert.equal(isSameAssistantContent("Analysis complete.", markdownEnvelope), true);
        });
    });

    describe("parseWidgetContent", () => {
        it("returns null for non-widget strings", () => {
            assert.equal(parseWidgetContent("Just plain text"), null);
            assert.equal(parseWidgetContent(""), null);
            assert.equal(parseWidgetContent(null), null);
            assert.equal(parseWidgetContent(123), null);
        });

        it("parses pure JSON widget envelope", () => {
            const raw = JSON.stringify({ widgetName: "status", data: { tone: "success", text: "Ready" } });
            const result = parseWidgetContent(raw);
            assert.deepEqual(result, {
                widget: "status",
                data: { tone: "success", text: "Ready" },
            });
        });

        it("strips markdown code fences wrapping widget JSON", () => {
            const raw = "```json\n" + JSON.stringify({ widgetName: "table", data: { rows: [{ a: 1 }] } }) + "\n```";
            const result = parseWidgetContent(raw);
            assert.notEqual(result, null);
            assert.equal(result?.widget, "table");
            assert.deepEqual(result?.data, { rows: [{ a: 1 }] });
        });

        it("extracts embedded widget envelope within conversational prose", () => {
            const widgetPayload = JSON.stringify({ widgetName: "table", data: { rows: [{ id: "A" }] } });
            const raw = `Here is the module summary:\n${widgetPayload}\nLet me know if you need changes.`;
            const result = parseWidgetContent(raw);
            assert.notEqual(result, null);
            assert.equal(result?.widget, "table");
        });

        it("normalizes array data for tables into { rows }", () => {
            const raw = JSON.stringify({ widgetName: "table", data: [{ id: 1 }, { id: 2 }] });
            const result = parseWidgetContent(raw);
            assert.deepEqual(result, {
                widget: "table",
                data: { rows: [{ id: 1 }, { id: 2 }] },
            });
        });

        it("normalizes stringified data", () => {
            const raw = JSON.stringify({ widgetName: "status", data: JSON.stringify({ tone: "error" }) });
            const result = parseWidgetContent(raw);
            assert.deepEqual(result, {
                widget: "status",
                data: { tone: "error" },
            });
        });
    });

    describe("classifyWidgetContent", () => {
        it("keeps partial widget envelopes pending while they stream", () => {
            for (const partial of [
                "{",
                '{"wid',
                '{ "widgetName"',
                '{"widgetName":"table","data":"{\\"rows\\":[',
                "```json\n{\"widgetName\":\"table\"",
            ]) {
                assert.deepEqual(classifyWidgetContent(partial), { state: "pending" });
            }
        });

        it("recognizes a complete widget envelope", () => {
            const raw = JSON.stringify({ widgetName: "table", data: { rows: [{ id: 1 }] } });
            assert.deepEqual(classifyWidgetContent(raw), {
                state: "widget",
                value: { widget: "table", data: { rows: [{ id: 1 }] } },
            });
        });

        it("does not hide normal prose or unrelated JSON", () => {
            assert.deepEqual(classifyWidgetContent("Working on it..."), { state: "text" });
            assert.deepEqual(classifyWidgetContent('{"status":"ok"}'), { state: "text" });
            assert.deepEqual(classifyWidgetContent('{"other'), { state: "text" });
        });

        it("leaves an invalid widget-like final reply available for text fallback", () => {
            const invalid = '{"widgetName":"table"} trailing text';
            assert.deepEqual(classifyWidgetContent(invalid), { state: "pending" });
        });
    });

    describe("Session Expiration & Recovery Detection", () => {
        const checkIsSessionExpired = (payload: any, frame: any) => {
            return (
                payload?.code === "SESSION_NOT_FOUND" ||
                payload?.code === "SESSION_EXPIRED" ||
                frame?.code === "SESSION_NOT_FOUND" ||
                frame?.code === "SESSION_EXPIRED" ||
                /session (?:not found|does not exist|expired)|unknown session/i.test(
                    String(payload?.error ?? frame?.error ?? "")
                )
            );
        };

        it("detects structured code SESSION_NOT_FOUND", () => {
            assert.equal(checkIsSessionExpired({ code: "SESSION_NOT_FOUND" }, null), true);
            assert.equal(checkIsSessionExpired(null, { code: "SESSION_NOT_FOUND" }), true);
            assert.equal(checkIsSessionExpired({ code: "SESSION_EXPIRED" }, null), true);
        });

        it("detects various session expiration error string variants", () => {
            assert.equal(checkIsSessionExpired({ error: "Session not found: abc-123" }, null), true);
            assert.equal(checkIsSessionExpired({ error: "Session not found or expired: abc-123" }, null), true);
            assert.equal(checkIsSessionExpired({ error: "Session does not exist" }, null), true);
            assert.equal(checkIsSessionExpired({ error: "Unknown session id" }, null), true);
        });

        it("does not false-positive on other errors", () => {
            assert.equal(checkIsSessionExpired({ error: "Rate limit exceeded" }, null), false);
            assert.equal(checkIsSessionExpired({ error: "Invalid API key" }, null), false);
            assert.equal(checkIsSessionExpired({ error: "Tool execution failed" }, null), false);
        });
    });
});
