import React, { useEffect, useRef } from "react";
import type { AgentBrowserChannel, AgentBrowserView } from "../client/agentBrowser";
import type { AgentBrowserInputEvent } from "../types";
import styles from "./AgentBrowser.module.css";

type Props = {
    channel: AgentBrowserChannel;
    view: AgentBrowserView;
    className?: string;
};

const BUTTONS = ["left", "middle", "right"] as const;

function modifiers(event: { altKey: boolean; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean }) {
    return (event.altKey ? 1 : 0) | (event.ctrlKey ? 2 : 0) | (event.metaKey ? 4 : 0) | (event.shiftKey ? 8 : 0);
}

/**
 * Viewport pixels for a pointer position. The canvas letterboxes the page (object-fit: contain), so
 * the scale and offsets come from the drawn area, not the element box.
 */
function viewportPoint(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
    const box = canvas.getBoundingClientRect();
    const scale = Math.min(box.width / canvas.width, box.height / canvas.height) || 1;
    const left = box.left + (box.width - canvas.width * scale) / 2;
    const top = box.top + (box.height - canvas.height * scale) / 2;
    const clamp = (value: number, max: number) => Math.max(0, Math.min(max, Math.round(value)));
    return { x: clamp((clientX - left) / scale, canvas.width), y: clamp((clientY - top) / scale, canvas.height) };
}

function keyEvent(type: "keyDown" | "keyUp" | "char", event: React.KeyboardEvent, text?: string): AgentBrowserInputEvent {
    return {
        kind: "key", type, key: event.key.slice(0, 32), code: event.code.slice(0, 32),
        keyCode: event.keyCode > 255 ? 0 : event.keyCode, modifiers: modifiers(event),
        ...(text ? { text } : {}),
    };
}

/**
 * The agent's browser, drawn from live-view frames. While the user has control, the canvas takes the
 * pointer and the keyboard and forwards them as viewport-pixel input events.
 */
export function AgentBrowserScreen({ channel, view, className }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawnSeq = useRef(0);
    const moveQueued = useRef<AgentBrowserInputEvent | null>(null);
    const interactive = view.control.mode === "human";
    const { width, height } = view.viewport;

    useEffect(() => channel.watch(), [channel]);

    useEffect(() => {
        drawnSeq.current = 0;
        const draw = (frame: { data: string; format: string; seq: number }) => {
            const picture = new Image();
            picture.onload = () => {
                const canvas = canvasRef.current;
                // A newer frame may have been drawn while this one decoded.
                if (!canvas || frame.seq < drawnSeq.current) return;
                drawnSeq.current = frame.seq;
                canvas.getContext("2d")?.drawImage(picture, 0, 0, canvas.width, canvas.height);
            };
            picture.src = `data:image/${frame.format};base64,${frame.data}`;
        };
        const latest = channel.latestFrame;
        if (latest) draw(latest);
        return channel.onFrame(draw);
        // Resizing the canvas clears it, so the latest frame is drawn again for a new viewport.
    }, [channel, width, height]);

    useEffect(() => {
        if (!view.hasFrame) {
            const canvas = canvasRef.current;
            canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
            drawnSeq.current = 0;
        }
    }, [view.hasFrame]);

    useEffect(() => {
        if (interactive) canvasRef.current?.focus({ preventScroll: true });
    }, [interactive]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !interactive) return;
        // React attaches wheel listeners as passive, so scrolling the page could not be prevented.
        const onWheel = (event: WheelEvent) => {
            event.preventDefault();
            const scale = event.deltaMode === 1 ? 40 : event.deltaMode === 2 ? canvas.height : 1;
            channel.sendInput({
                kind: "wheel", ...viewportPoint(canvas, event.clientX, event.clientY),
                deltaX: Math.round(event.deltaX * scale), deltaY: Math.round(event.deltaY * scale), modifiers: modifiers(event),
            });
        };
        canvas.addEventListener("wheel", onWheel, { passive: false });
        return () => canvas.removeEventListener("wheel", onWheel);
    }, [channel, interactive]);

    const mouseButton = (type: "mousePressed" | "mouseReleased") => (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!interactive) return;
        event.preventDefault();
        event.currentTarget.focus({ preventScroll: true });
        channel.sendInput({
            kind: "mouse", type, ...viewportPoint(event.currentTarget, event.clientX, event.clientY),
            button: BUTTONS[event.button] ?? "left", clickCount: Math.min(3, event.detail || 1), modifiers: modifiers(event),
        });
    };

    const onMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!interactive) return;
        const pressed = event.buttons & 1 ? "left" : event.buttons & 4 ? "middle" : event.buttons & 2 ? "right" : "none";
        const first = moveQueued.current === null;
        moveQueued.current = { kind: "mouse", type: "mouseMoved", ...viewportPoint(event.currentTarget, event.clientX, event.clientY), button: pressed, modifiers: modifiers(event) };
        // One move per animation frame is plenty and keeps the socket quiet.
        if (first) requestAnimationFrame(() => {
            if (moveQueued.current) channel.sendInput(moveQueued.current);
            moveQueued.current = null;
        });
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
        if (!interactive) return;
        event.preventDefault();
        event.stopPropagation();
        channel.sendInput(keyEvent("keyDown", event, event.key === "Enter" ? "\r" : undefined));
        // Printable keys also send the character, as a keyboard would; shortcuts with Ctrl or Meta do not.
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) channel.sendInput(keyEvent("char", event, event.key));
    };

    const onKeyUp = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
        if (!interactive) return;
        event.preventDefault();
        event.stopPropagation();
        channel.sendInput(keyEvent("keyUp", event));
    };

    const placeholder = !view.hasFrame
        ? view.state === "starting" ? "The browser is starting…" : "Connecting to the live view…"
        : null;

    return (
        <div className={`${styles.screen} ${interactive ? styles.screenDriving : ""} ${className ?? ""}`}
            style={{ "--browser-aspect": `${width} / ${height}` } as React.CSSProperties}>
            <canvas
                ref={canvasRef}
                className={styles.canvas}
                width={width}
                height={height}
                tabIndex={interactive ? 0 : -1}
                aria-label={interactive ? "Agent browser. You have control: mouse and keyboard go to the page." : "Agent browser live view"}
                role="img"
                onMouseDown={mouseButton("mousePressed")}
                onMouseUp={mouseButton("mouseReleased")}
                onMouseMove={onMouseMove}
                onContextMenu={(event) => { if (interactive) event.preventDefault(); }}
                onKeyDown={onKeyDown}
                onKeyUp={onKeyUp}
            />
            {placeholder && <div className={styles.screenPlaceholder} role="status">{placeholder}</div>}
        </div>
    );
}
