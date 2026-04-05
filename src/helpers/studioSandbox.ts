/**
 * Studio Sandbox Mode API
 * 
 * This module isolates the application layout from the Solid Studio UI. 
 * It dynamically creates a container to wrap the application root, converting
 * it into a relative containing block. This prevents \`position: fixed\` elements 
 * within the application from inadvertently overlapping with the global Studio UI.
 */

let originalRootParent: ParentNode | null = null;
let originalRootNextSibling: Node | null = null;
let isSandboxActive = false;

function getAppRoot() {
    // Determine the root depending on the framework (Vite uses #root, Next uses #__next)
    return document.getElementById("root") || document.getElementById("__next") || document.body.firstElementChild;
}

/**
 * Wraps the app root into the sandbox container.
 */
export function enableStudioMode() {
    if (typeof window === "undefined" || isSandboxActive) return;

    const appRoot = getAppRoot();
    if (!appRoot || appRoot.id === "solid-studio-root" || appRoot.id === "solid-studio-app-container") {
        return;
    }

    const parent = appRoot.parentNode;
    if (!parent) return;

    isSandboxActive = true;
    originalRootParent = parent;
    originalRootNextSibling = appRoot.nextSibling;

    // Create the outer wrapper
    const studioRoot = document.createElement("div");
    studioRoot.id = "solid-studio-root";

    // Create the isolation container
    const appContainer = document.createElement("div");
    appContainer.id = "solid-studio-app-container";

    // Re-parent the app node
    appContainer.appendChild(appRoot);
    studioRoot.appendChild(appContainer);

    // Insert the wrapper into the DOM where the root used to be
    parent.insertBefore(studioRoot, originalRootNextSibling);

    // Set a class on the body to indicate Studio Mode
    document.body.classList.add("solid-studio-active");
}

/**
 * Restores the application to its original state.
 */
export function disableStudioMode() {
    if (typeof window === "undefined" || !isSandboxActive) return;

    const studioRoot = document.getElementById("solid-studio-root");
    const appContainer = document.getElementById("solid-studio-app-container");

    // Find our wrapped app root
    const appRoot = appContainer?.firstElementChild;

    if (studioRoot && appRoot && originalRootParent) {
        originalRootParent.insertBefore(appRoot, originalRootNextSibling);
        studioRoot.remove();
    }

    isSandboxActive = false;
    originalRootParent = null;
    originalRootNextSibling = null;

    // Remove body class
    document.body.classList.remove("solid-studio-active");
}

/**
 * Returns the active scroll element based on sandbox state.
 * When Studio Mode is enabled, the scroll element becomes the container.
 * Otherwise, it uses the default Window object.
 */
export function getScrollElement(): HTMLElement | Window {
    if (typeof window === "undefined") return window;
    if (isSandboxActive) {
        const container = document.getElementById("solid-studio-app-container");
        return container || window;
    }
    return window;
}

/**
 * Returns the current vertical scroll position.
 */
export function getScrollY(): number {
    if (typeof window === "undefined") return 0;
    if (isSandboxActive) {
        const container = document.getElementById("solid-studio-app-container");
        return container ? container.scrollTop : 0;
    }
    return window.scrollY;
}

/**
 * Returns the effective viewport height.
 */
export function getViewportHeight(): number {
    if (typeof window === "undefined") return 0;
    if (isSandboxActive) {
        const container = document.getElementById("solid-studio-app-container");
        return container ? container.clientHeight : window.innerHeight;
    }
    return window.innerHeight;
}
