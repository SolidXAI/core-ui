import { AgentEventTypes, type AgentChatItem } from "./types";

/** "browser_control": the agent handed the user its browser (browser_handoff), or the user took it. */
export type HumanReviewKind = "input" | "approval" | "browser_control";

export type HumanReview = {
    requestId: number;
    kind: HumanReviewKind;
    question: string;
    options?: string[] | null;
    context?: Record<string, unknown> | null;
    toolName?: string | null;
    toolArguments?: Record<string, unknown> | null;
};

const approvalOptions = [{ label: "Approve", value: "approve" }, { label: "Reject", value: "reject" }];

export const humanReviewId = (requestId: number) => `human-request-${requestId}`;

export const BROWSER_TAKEOVER_TOOL = "browser_takeover";

export function isHumanReviewKind(kind: unknown): kind is HumanReviewKind {
    return kind === "input" || kind === "approval" || kind === "browser_control";
}

export function humanReviewItem(request: HumanReview, at: number, final: boolean, submitting = false): AgentChatItem {
    const id = humanReviewId(request.requestId);
    if (request.kind === "browser_control") {
        // Answered from the browser panel (Give back / Continue without taking control), not from the thread.
        const takeover = request.toolName === BROWSER_TAKEOVER_TOOL;
        return {
            id, at, final,
            eventType: "HumanRequestCreated",
            eventData: {
                tone: "info",
                title: takeover ? "You have the browser" : "The agent handed you the browser",
                message: takeover ? "The agent waits until you give the browser back." : request.question,
                reviewKind: request.kind,
                toolName: request.toolName,
                context: request.context,
                serverManagedReply: true,
            },
            widget: "status",
            widgetId: id,
        };
    }
    return {
        id, at, final,
        eventType: "HumanRequestCreated",
        eventData: {
            question: request.kind === "approval" ? "Review this tool call before it runs." : request.question,
            options: request.kind === "approval" ? approvalOptions : request.options,
            hint: request.kind === "approval" && !final ? "Check the action and its arguments, then approve or reject." : undefined,
            reviewKind: request.kind,
            toolName: request.toolName,
            toolArguments: request.toolArguments,
            context: request.context,
            serverManagedReply: true,
            submitting,
        },
        widget: "question",
        widgetId: id,
    };
}

export function humanReviewAllowsChoice(request: HumanReview, choice: string) {
    if (request.kind === "browser_control") return false;
    return request.kind === "approval" ? approvalOptions.some((option) => option.value === choice)
        : request.options?.includes(choice) === true;
}

export function humanReviewText(request: HumanReview, text: string) {
    if (request.kind === "browser_control") throw new Error("Use the browser panel to give the browser back to the agent.");
    if (request.kind !== "approval") return { choice: "answer", text };
    const decision = /^(approve|reject)(?:[\s:]+([\s\S]*))?$/i.exec(text);
    if (!decision) throw new Error("Type Approve or Reject, followed by an optional note.");
    return { choice: decision[1].toLowerCase(), text: decision[2]?.trim() ?? "" };
}

export function humanReviewAnswerItem(requestId: number, kind: string, choice: string | null | undefined,
    text: string | null | undefined, at: number): AgentChatItem {
    const decision = choice === "approve" ? "Approved" : choice === "reject" ? "Rejected" : "";
    // A browser release may also come from the handoff timing out, so the wording names no actor.
    const content = kind === "browser_control"
        ? ["Browser returned to the agent.", text].filter(Boolean).join("\n")
        : [kind === "approval" && decision, text || (kind !== "approval" && choice !== "answer" && choice)]
            .filter(Boolean).join("\n");
    return {
        id: `${humanReviewId(requestId)}-answer`,
        at,
        eventType: AgentEventTypes.userMessage,
        eventData: { content },
        final: true,
    };
}
