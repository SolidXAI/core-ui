import { LayoutAttribute, LayoutNode } from "@/types/solid-core";

export class SolidViewLayoutManager {
    private layout: LayoutNode;

    constructor(layout: LayoutNode) {
        // Create a deep copy to prevent modifying the original object
        this.layout = structuredClone ? structuredClone(layout) : JSON.parse(JSON.stringify(layout));
    }

    // Helper function to find a node by name
    private findNode(node: LayoutNode, name: string): LayoutNode | null {
        if (node.attrs.name === name) {
            return node;
        }

        if (node.children) {
            for (let child of node.children) {
                const found = this.findNode(child, name);
                if (found) return found;
            }
        }
        return null;
    }

    // Helper function to find and remove a node
    private removeNodeRecursive(parent: LayoutNode, name: string): boolean {
        if (!parent.children) return false;

        const index = parent.children.findIndex((child) => child.attrs.name === name);
        if (index !== -1) {
            parent.children.splice(index, 1); // Remove the node
            return true;
        }

        return parent.children.some((child) => this.removeNodeRecursive(child, name));
    }

    // Get a deep copy of the layout
    getLayout(): LayoutNode {
        // return structuredClone ? structuredClone(this.layout) : JSON.parse(JSON.stringify(this.layout));
        return this.layout;
    }

    // Update attributes of a node
    updateNodeAttributes(name: string, newAttributes: Partial<LayoutAttribute>): boolean {
        const node = this.findNode(this.layout, name);
        if (node) {
            node.attrs = { ...node.attrs, ...newAttributes };
            return true;
        }
        return false;
    }

    // Add a child node to a parent node
    addChildNode(parentName: string, newNode: LayoutNode): boolean {
        const parentNode = this.findNode(this.layout, parentName);
        if (parentNode) {
            if (!parentNode.children) {
                parentNode.children = [];
            }
            parentNode.children.push(newNode);
            return true;
        }
        return false;
    }

    // Remove a node and its children
    removeNode(name: string): boolean {
        if (this.layout.attrs.name === name) {
            console.warn("Cannot remove the root node.");
            return false;
        }

        return this.removeNodeRecursive(this.layout, name);
    }

    // Recursively traverse the layout and execute a callback function
    traverse(callback: (node: LayoutNode) => void, node: LayoutNode = this.layout) {
        callback(node);
        if (node.children) {
            node.children.forEach((child) => this.traverse(callback, child));
        }
    }
}