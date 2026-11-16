import { AgentEventTypes, type AgentChatItem } from "./types";

export type HumanReview = {
    requestId: number;
    kind: "input" | "approval";
    question: string;
    options?: string[] | null;
    context?: Record<string, unknown> | null;
    toolName?: string | null;
    toolArguments?: Record<string, unknown> | null;
};

const approvalOptions = [{ label: "Approve", value: "approve" }, { label: "Reject", value: "reject" }];

export const humanReviewId = (requestId: number) => `human-request-${requestId}`;

export function humanReviewItem(request: HumanReview, at: number, final: boolean, submitting = false): AgentChatItem {
    const id = humanReviewId(request.requestId);
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
    return request.kind === "approval" ? approvalOptions.some((option) => option.value === choice)
        : request.options?.includes(choice) === true;
}

export function humanReviewText(request: HumanReview, text: string) {
    if (request.kind !== "approval") return { choice: "answer", text };
    const decision = /^(approve|reject)(?:[\s:]+([\s\S]*))?$/i.exec(text);
    if (!decision) throw new Error("Type Approve or Reject, followed by an optional note.");
    return { choice: decision[1].toLowerCase(), text: decision[2]?.trim() ?? "" };
}

export function humanReviewAnswerItem(requestId: number, kind: string, choice: string | null | undefined,
    text: string | null | undefined, at: number): AgentChatItem {
    const decision = choice === "approve" ? "Approved" : choice === "reject" ? "Rejected" : "";
    return {
        id: `${humanReviewId(requestId)}-answer`,
        at,
        eventType: AgentEventTypes.userMessage,
        eventData: {
            content: [kind === "approval" && decision, text || (kind !== "approval" && choice !== "answer" && choice)]
                .filter(Boolean).join("\n"),
        },
        final: true,
    };
}
