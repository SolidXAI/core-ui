import { useState } from "react";
import styles from "../SolidAgent.module.css";
import { SolidChatWidgetProps } from "../../../../types/solid-core";
import { asArray, getChatWidgetData } from "./chatWidgetUtils";
import { SolidAgentMarkdown } from "../SolidAgentMarkdown";

type QuestionOption = string | { label: string; value?: unknown };
type QuestionData = {
    question?: string; hint?: string; options?: QuestionOption[]; multiple?: boolean;
    reviewKind?: "input" | "approval"; toolName?: string | null;
    toolArguments?: Record<string, unknown> | null; context?: Record<string, unknown> | null;
};

/**
 * `event_data: { widget: "question", question, hint?, options: [...], multiple? }`.
 * A single-choice answer is sent on click; multiple choice waits for Submit.
 */
export const SolidQuestionChatWidget = ({ eventData, final, reply }: SolidChatWidgetProps) => {
    const data = getChatWidgetData<QuestionData>(eventData);
    const options = asArray<QuestionOption>(data.options).map((option) =>
        typeof option === "string" ? { label: option, value: option as unknown } : { label: option.label, value: option.value ?? option.label },
    );
    const [picked, setPicked] = useState<number[]>([]);
    const [answered, setAnswered] = useState(false);
    const serverManagedReply = eventData.serverManagedReply === true;
    const locked = final || answered || eventData.submitting === true;

    const choose = (index: number) => {
        if (locked) return;
        if (!data.multiple) {
            setPicked([index]);
            if (!serverManagedReply) setAnswered(true);
            reply(options[index].value);
            return;
        }
        setPicked((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
    };

    return (
        <div className={styles.card}>
            <div className={styles.cardBody}>
                {data.reviewKind === "approval" && (data.toolName || data.toolArguments) && (
                    <section aria-label="Tool call details" className={styles.reviewDetails}>
                        <div className={styles.reviewDetailsHeading}>
                            <span>Tool call</span>
                            {data.toolName && <code>{data.toolName}</code>}
                        </div>
                        {data.toolArguments && Object.keys(data.toolArguments).length > 0 && (
                            <dl className={styles.reviewArgumentList}>
                                {Object.entries(data.toolArguments).map(([key, value]) => (
                                    <div key={key} className={styles.reviewArgument}>
                                        <dt>{key}</dt>
                                        <dd>{typeof value === "string" ? value : JSON.stringify(value, null, 2)}</dd>
                                    </div>
                                ))}
                            </dl>
                        )}
                    </section>
                )}
                {data.question && <SolidAgentMarkdown text={data.question} />}
                {data.hint && <span style={{ color: "var(--agent-muted)", fontSize: 12.5 }}>{data.hint}</span>}
                {options.map((option, index) => (
                    <button
                        key={index}
                        type="button"
                        className={`${styles.btn} ${picked.includes(index) ? styles.optionOn : ""}`}
                        style={{ textAlign: "left" }}
                        disabled={locked && (serverManagedReply || !picked.includes(index))}
                        aria-pressed={picked.includes(index)}
                        onClick={() => choose(index)}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
            {data.multiple && !locked && (
                <div className={styles.cardFoot}>
                    <button
                        type="button"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        disabled={!picked.length}
                        onClick={() => {
                            if (!serverManagedReply) setAnswered(true);
                            reply(picked.map((i) => options[i].value));
                        }}
                    >
                        Submit
                    </button>
                </div>
            )}
        </div>
    );
};

Object.assign(SolidQuestionChatWidget, { getExtensionMetadata: () => ({
    agentWidget: { name: "question", description: "Ask the user a single or multiple choice question.", propsSchema: { type: "object", properties: { question: { type: "string", description: "The question as Markdown. Supports **bold**, *italic*, lists and [links](https://…)." }, hint: { type: "string" }, options: { type: "array", items: { anyOf: [{ type: "string" }, { type: "object", properties: { label: { type: "string" }, value: {} }, required: ["label"] }] } }, multiple: { type: "boolean" } } } },
}) });
