import { ChevronDown, ChevronRight, DatabaseZap, FileSearch, Save, Search, Settings, Wand2 } from "lucide-react";
import React, { useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import {
  useGetModuleMetadataExplorerDocumentQuery,
  useGetModuleMetadataExplorerManifestQuery,
  useSeedModuleMetadataMutation,
  useUpdateModuleMetadataExplorerSectionMutation,
  useValidateModuleMetadataExplorerSectionMutation,
} from "../../../redux/api/moduleApi";
import { showToast } from "../../../redux/features/toastSlice";
import {
  SolidButton,
  SolidDialog,
  SolidDialogBody,
  SolidDialogFooter,
  SolidDialogHeader,
  SolidDialogSeparator,
  SolidDialogTitle,
  SolidDropdownMenu,
  SolidDropdownMenuContent,
  SolidDropdownMenuItem,
  SolidDropdownMenuTrigger,
  SolidInput,
  SolidMessage,
  SolidTag,
} from "../../shad-cn-ui";
import "jsoneditor/dist/jsoneditor.css";
import "./ModuleMetadataExplorer.css";

type ModuleMetadataExplorerProps = {
  moduleName?: string;
  moduleId?: number;
  modelSingularName?: string;
  readOnly?: boolean;
  allowSeed?: boolean;
};

type MetadataIssue = {
  path: string;
  message: string;
  severity: "error" | "warning";
};

type ExplorerSectionDefinition = {
  key: string;
  title: string;
  jsonPath: string;
  type: "object" | "array";
  description: string;
};

type ExplorerTreeNode = {
  id: string;
  label: string;
  path: string;
  parentPath: string | null;
  sectionKey: string;
  sectionTitle: string;
  children: ExplorerTreeNode[];
};

type JsonEditorHandle = {
  format: () => void;
};

function extractApiErrorMessage(error: any) {
  const message = error?.data?.message ?? error?.message ?? "Something went wrong";
  return Array.isArray(message) ? message.join(", ") : String(message);
}

function serializeJson(value: any) {
  try {
    return JSON.stringify(value);
  } catch (_error) {
    return "";
  }
}

function deepCloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function humanizeKey(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function tokenizePath(path: string) {
  const tokens: Array<string | number> = [];
  const regex = /([^[.\]]+)|\[(\d+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(path)) !== null) {
    if (match[1] !== undefined) {
      tokens.push(match[1]);
    } else if (match[2] !== undefined) {
      tokens.push(Number(match[2]));
    }
  }
  return tokens;
}

function getValueAtJsonPath(source: any, path: string) {
  if (!path) return source;
  return tokenizePath(path).reduce((current, token) => {
    if (current === undefined || current === null) return undefined;
    return current[token as keyof typeof current];
  }, source);
}

function setValueAtJsonPath(target: any, path: string, value: any) {
  const tokens = tokenizePath(path);
  if (!tokens.length) return;

  let current = target;
  for (let index = 0; index < tokens.length - 1; index += 1) {
    current = current[tokens[index] as keyof typeof current];
  }

  current[tokens[tokens.length - 1] as keyof typeof current] = value;
}

function appendPath(basePath: string, key: string) {
  return basePath ? `${basePath}.${key}` : key;
}

function getArrayItemLabel(item: any, index: number, parentKey: string) {
  const labelCandidates = [
    "singularName",
    "name",
    "displayName",
    "pluralName",
    "label",
    "key",
    "title",
    "id",
  ];

  for (const candidate of labelCandidates) {
    const nextValue = item?.[candidate];
    if (nextValue !== undefined && nextValue !== null && `${nextValue}`.trim()) {
      return `${nextValue}`;
    }
  }

  return `${humanizeKey(parentKey || "Item")} ${index + 1}`;
}

function buildTreeNode(
  value: any,
  options: {
    label: string;
    path: string;
    parentPath: string | null;
    sectionKey: string;
    sectionTitle: string;
    hintKey: string;
  },
): ExplorerTreeNode {
  const { label, path, parentPath, sectionKey, sectionTitle, hintKey } = options;

  let children: ExplorerTreeNode[] = [];

  if (Array.isArray(value)) {
    children = value
      .filter((item) => item !== null && typeof item === "object")
      .map((item, index) => buildTreeNode(item, {
        label: getArrayItemLabel(item, index, hintKey),
        path: `${path}[${index}]`,
        parentPath: path,
        sectionKey,
        sectionTitle,
        hintKey,
      }));
  } else if (value && typeof value === "object") {
    children = Object.entries(value)
      .filter(([, nextValue]) => nextValue !== null && typeof nextValue === "object")
      .map(([key, nextValue]) => buildTreeNode(nextValue, {
        label: humanizeKey(key),
        path: appendPath(path, key),
        parentPath: path,
        sectionKey,
        sectionTitle,
        hintKey: key,
      }));
  }

  return {
    id: path,
    label,
    path,
    parentPath,
    sectionKey,
    sectionTitle,
    children,
  };
}

function buildTreeFromDocument(sections: ExplorerSectionDefinition[], documentValue: any) {
  const nodes = sections
    .map((section) => {
      const sectionValue = getValueAtJsonPath(documentValue, section.jsonPath);
      if (sectionValue === undefined) return null;
      return buildTreeNode(sectionValue, {
        label: section.title,
        path: section.jsonPath,
        parentPath: null,
        sectionKey: section.key,
        sectionTitle: section.title,
        hintKey: section.key,
      });
    })
    .filter(Boolean) as ExplorerTreeNode[];

  const nodeMap = new Map<string, ExplorerTreeNode>();
  const visit = (nextNodes: ExplorerTreeNode[]) => {
    nextNodes.forEach((node) => {
      nodeMap.set(node.path, node);
      if (node.children.length) visit(node.children);
    });
  };
  visit(nodes);

  return { nodes, nodeMap };
}

function filterTreeNodes(nodes: ExplorerTreeNode[], query: string): ExplorerTreeNode[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return nodes;

  const visit = (node: ExplorerTreeNode): ExplorerTreeNode | null => {
    const filteredChildren = node.children
      .map(visit)
      .filter(Boolean) as ExplorerTreeNode[];
    const matches = node.label.toLowerCase().includes(needle) || node.path.toLowerCase().includes(needle);

    if (matches || filteredChildren.length) {
      return { ...node, children: filteredChildren };
    }

    return null;
  };

  return nodes.map(visit).filter(Boolean) as ExplorerTreeNode[];
}

function getAncestorPaths(nodeMap: Map<string, ExplorerTreeNode>, path: string) {
  const paths: string[] = [];
  let current = nodeMap.get(path);

  while (current?.parentPath) {
    paths.push(current.parentPath);
    current = nodeMap.get(current.parentPath);
  }

  return paths;
}

function getSectionForPath(sections: ExplorerSectionDefinition[], path: string) {
  return sections
    .filter((section) => path === section.jsonPath || path.startsWith(`${section.jsonPath}.`) || path.startsWith(`${section.jsonPath}[`))
    .sort((left, right) => right.jsonPath.length - left.jsonPath.length)[0] ?? null;
}

function filterIssuesForPath(issues: MetadataIssue[], path: string) {
  return issues.filter((issue) => {
    if (!issue.path) return false;
    return issue.path === path || issue.path.startsWith(`${path}.`) || issue.path.startsWith(`${path}[`);
  });
}

const JsonEditorSurface = React.forwardRef<JsonEditorHandle, {
  value: any;
  resetToken: string;
  readOnly?: boolean;
  onValueChange: (value: any) => void;
  onErrorChange: (message: string | null) => void;
}>(function JsonEditorSurface({ value, resetToken, readOnly = false, onValueChange, onErrorChange }, ref) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<any>(null);

  const emitState = () => {
    const editor = editorRef.current;
    if (!editor) return;

    try {
      const nextValue = editor.get();
      onValueChange(nextValue);
      onErrorChange(null);
    } catch (error: any) {
      onErrorChange(error?.message ? String(error.message) : "The JSON is currently invalid.");
    }
  };

  useImperativeHandle(ref, () => ({
    format() {
      try {
        editorRef.current?.format?.();
      } catch (_error) {
        // jsoneditor already surfaces parse states through onErrorChange
      }
      emitState();
    },
  }), []);

  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;

    const JSONEditor = require("jsoneditor");
    editorRef.current = new JSONEditor(containerRef.current, {
      mode: "code",
      modes: ["code"],
      mainMenuBar: true,
      navigationBar: true,
      statusBar: true,
      search: true,
      enableSort: false,
      enableTransform: false,
      onChange: () => emitState(),
    });

    if (editorRef.current?.aceEditor?.setReadOnly) {
      editorRef.current.aceEditor.setReadOnly(readOnly);
    }

    return () => {
      editorRef.current?.destroy?.();
      editorRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.set(value);
    emitState();
  }, [resetToken, value]);

  useEffect(() => {
    if (!editorRef.current?.aceEditor?.setReadOnly) return;
    editorRef.current.aceEditor.setReadOnly(readOnly);
  }, [readOnly]);

  return <div ref={containerRef} className={`solid-module-explorer-editor-host solid-module-explorer-jsoneditor ${readOnly ? "is-readonly" : ""}`} />;
});

function MetadataTree({
  nodes,
  activePath,
  expandedPaths,
  onToggle,
  onSelect,
  depth = 0,
}: {
  nodes: ExplorerTreeNode[];
  activePath: string;
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
  depth?: number;
}) {
  return (
    <>
      {nodes.map((node) => {
        const isExpanded = expandedPaths.has(node.path);
        const hasChildren = node.children.length > 0;
        const isActive = activePath === node.path;

        return (
          <div key={node.id} className="solid-module-explorer-tree-node">
            <div
              className={`solid-module-explorer-tree-row ${isActive ? "is-active" : ""}`}
              style={{ paddingLeft: `${depth * 0.9}rem` }}
            >
              <button
                type="button"
                className="solid-module-explorer-tree-toggle"
                onClick={() => hasChildren && onToggle(node.path)}
                aria-label={hasChildren ? (isExpanded ? "Collapse node" : "Expand node") : "Leaf node"}
                disabled={!hasChildren}
              >
                {hasChildren ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="solid-module-explorer-tree-dot" />}
              </button>
              <button
                type="button"
                className="solid-module-explorer-tree-label"
                onClick={() => onSelect(node.path)}
                title={node.path}
              >
                {node.label}
              </button>
            </div>

            {hasChildren && isExpanded && (
              <MetadataTree
                nodes={node.children}
                activePath={activePath}
                expandedPaths={expandedPaths}
                onToggle={onToggle}
                onSelect={onSelect}
                depth={depth + 1}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

export function ModuleMetadataExplorer({
  moduleName,
  moduleId,
  modelSingularName,
  readOnly = false,
  allowSeed = true,
}: ModuleMetadataExplorerProps) {
  const dispatch = useDispatch();
  const editorRef = useRef<JsonEditorHandle | null>(null);
  const explorerRef = useRef<HTMLDivElement | null>(null);
  const isResizingRef = useRef(false);
  const [activePath, setActivePath] = useState("");
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [treeFilter, setTreeFilter] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [editorValue, setEditorValue] = useState<any>({});
  const [savedValue, setSavedValue] = useState<any>({});
  const [editorError, setEditorError] = useState<string | null>(null);
  const [editorResetToken, setEditorResetToken] = useState("initial");
  const [validationIssues, setValidationIssues] = useState<MetadataIssue[] | null>(null);
  const [localActionSummary, setLocalActionSummary] = useState("");
  const [isContextDialogOpen, setIsContextDialogOpen] = useState(false);
  const [isSeedDialogOpen, setIsSeedDialogOpen] = useState(false);

  const {
    data: manifestData,
    error: manifestError,
    refetch: refetchManifest,
  } = useGetModuleMetadataExplorerManifestQuery(moduleName as string, {
    skip: !moduleName,
  });

  const {
    data: documentData,
    isLoading: isDocumentLoading,
    error: documentError,
    refetch: refetchDocument,
  } = useGetModuleMetadataExplorerDocumentQuery(moduleName as string, {
    skip: !moduleName,
  });

  const [updateSection, { isLoading: isSavingSection }] = useUpdateModuleMetadataExplorerSectionMutation();
  const [validateSection, { isLoading: isValidatingSection }] = useValidateModuleMetadataExplorerSectionMutation();
  const [seedModuleMetadata, { isLoading: isSeedingModule }] = useSeedModuleMetadataMutation();
  const isReadOnlyExplorer = readOnly || moduleName?.toLowerCase() === "solid-core";

  const sections = (manifestData?.sections ?? []) as ExplorerSectionDefinition[];
  const fullDocument = documentData?.value ?? {};
  const loadError = !manifestData || !documentData ? (manifestError ?? documentError) : null;

  const { nodes: treeNodes, nodeMap } = useMemo(
    () => buildTreeFromDocument(sections, fullDocument),
    [sections, fullDocument],
  );

  const scopedRootPath = useMemo(() => {
    if (!modelSingularName) return "";
    const models = getValueAtJsonPath(fullDocument, "moduleMetadata.models");
    if (!Array.isArray(models)) return "";
    const modelIndex = models.findIndex((model) => model?.singularName === modelSingularName);
    return modelIndex >= 0 ? `moduleMetadata.models[${modelIndex}]` : "";
  }, [fullDocument, modelSingularName]);

  const scopedTreeNodes = useMemo(() => {
    if (!scopedRootPath) return treeNodes;
    const scopedNode = nodeMap.get(scopedRootPath);
    return scopedNode ? [scopedNode] : [];
  }, [nodeMap, scopedRootPath, treeNodes]);

  const filteredTreeNodes = useMemo(
    () => filterTreeNodes(scopedTreeNodes, treeFilter),
    [scopedTreeNodes, treeFilter],
  );

  const visibleExpandedPaths = useMemo(() => {
    if (!treeFilter.trim()) return expandedPaths;
    const nextExpanded = new Set<string>();
    const visit = (nodesToVisit: ExplorerTreeNode[]) => {
      nodesToVisit.forEach((node) => {
        if (node.children.length) {
          nextExpanded.add(node.path);
          visit(node.children);
        }
      });
    };
    visit(filteredTreeNodes);
    return nextExpanded;
  }, [expandedPaths, filteredTreeNodes, treeFilter]);

  const activeNode = activePath ? nodeMap.get(activePath) ?? null : null;
  const activeSection = activePath ? getSectionForPath(sections, activePath) : null;
  const activeValidationIssues = filterIssuesForPath(validationIssues ?? [], activePath);
  const savedSerialized = serializeJson(savedValue);
  const editorSerialized = serializeJson(editorValue);
  const isDirty = editorError ? true : savedSerialized !== editorSerialized;
  const hasMutableChanges = !isReadOnlyExplorer && isDirty;
  const canSave = !isReadOnlyExplorer && isDirty && !editorError;
  const hasValidationFailure = Boolean(editorError) || activeValidationIssues.length > 0;
  const validationSummary = editorError
    ? editorError
    : activeValidationIssues.length
      ? `${activeValidationIssues.length} validation issue${activeValidationIssues.length === 1 ? "" : "s"}: ${activeValidationIssues[0]?.message ?? "Review this JSON before saving."}`
      : "";

  useEffect(() => {
    setValidationIssues(documentData?.validation?.issues ?? []);
  }, [documentData?.lastModifiedAt]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!isResizingRef.current || !explorerRef.current) return;
      const bounds = explorerRef.current.getBoundingClientRect();
      const nextWidth = Math.min(Math.max(event.clientX - bounds.left, 220), 520);
      setSidebarWidth(nextWidth);
    };

    const handlePointerUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  useEffect(() => {
    if (!scopedTreeNodes.length) return;

    const isPathInsideScope =
      !scopedRootPath ||
      activePath === scopedRootPath ||
      activePath.startsWith(`${scopedRootPath}.`) ||
      activePath.startsWith(`${scopedRootPath}[`);

    if (!activePath || !nodeMap.has(activePath) || !isPathInsideScope) {
      const defaultPath = scopedTreeNodes[0].path;
      setActivePath(defaultPath);
      setExpandedPaths(new Set([defaultPath]));
    }
  }, [activePath, nodeMap, scopedRootPath, scopedTreeNodes]);

  useEffect(() => {
    if (!activePath) return;
    const nextValue = getValueAtJsonPath(fullDocument, activePath);
    if (nextValue === undefined) return;
    setSavedValue(nextValue);
    setEditorValue(nextValue);
    setEditorError(null);
    setEditorResetToken(`${activePath}:${documentData?.lastModifiedAt ?? ""}`);
  }, [activePath, documentData?.lastModifiedAt, fullDocument]);

  const showErrorToast = (error: any) => {
    dispatch(showToast({
      severity: "error",
      summary: "Metadata Explorer",
      detail: extractApiErrorMessage(error),
      life: 4000,
    }));
  };

  const toggleExpandedPath = (path: string) => {
    setExpandedPaths((current) => {
      const next = new Set(current);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const selectPath = (path: string) => {
    if (path === activePath) return;
    if (!isReadOnlyExplorer && isDirty) {
      const shouldProceed = window.confirm("You have unsaved metadata changes. Switch nodes and discard them?");
      if (!shouldProceed) return;
    }

    const ancestorPaths = getAncestorPaths(nodeMap, path);
    setExpandedPaths((current) => {
      const next = new Set(current);
      ancestorPaths.forEach((ancestorPath) => next.add(ancestorPath));
      return next;
    });
    setActivePath(path);
  };

  const handleSidebarResizeStart = () => {
    isResizingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleCollapseAll = () => {
    setExpandedPaths(new Set());
  };

  const handleFormat = () => {
    editorRef.current?.format();
  };

  const buildPatchedDocument = () => {
    const nextDocument = deepCloneJson(fullDocument);
    setValueAtJsonPath(nextDocument, activePath, editorValue);
    return nextDocument;
  };

  const buildPatchedSectionValue = () => {
    if (!activeSection) return undefined;
    return getValueAtJsonPath(buildPatchedDocument(), activeSection.jsonPath);
  };

  const handleValidate = async () => {
    if (!moduleName || !activePath || !activeSection) return;

    if (editorError) {
      setLocalActionSummary("Validation blocked because the JSON is currently invalid.");
      dispatch(showToast({
        severity: "error",
        summary: "Metadata Explorer",
        detail: "Fix the invalid JSON before validating.",
        life: 3500,
      }));
      return;
    }

    try {
      const response: any = await validateSection({
        moduleName,
        sectionKey: activeSection.key,
        value: buildPatchedSectionValue(),
      }).unwrap();

      setValidationIssues(response?.issues ?? []);
      setLocalActionSummary(response?.valid ? "Validation passed for the current JSON fragment." : "Validation reported issues for the current JSON fragment.");
      dispatch(showToast({
        severity: response?.valid ? "success" : "warn",
        summary: "Metadata Explorer",
        detail: response?.valid ? "Validation passed." : "Validation reported issues.",
        life: 3000,
      }));
    } catch (error) {
      showErrorToast(error);
    }
  };

  const handleSave = async () => {
    if (!moduleName || !activePath || !activeSection) return;

    if (editorError) {
      dispatch(showToast({
        severity: "error",
        summary: "Metadata Explorer",
        detail: "Fix the invalid JSON before saving.",
        life: 3500,
      }));
      return;
    }

    try {
      const response: any = await updateSection({
        moduleName,
        sectionKey: activeSection.key,
        value: buildPatchedSectionValue(),
      }).unwrap();

      setValidationIssues(response?.validation?.issues ?? []);
      setLocalActionSummary("JSON fragment saved to the metadata file.");
      dispatch(showToast({
        severity: "success",
        summary: "Metadata Explorer",
        detail: "Metadata saved successfully.",
        life: 3000,
      }));
      refetchManifest();
      refetchDocument();
    } catch (error) {
      showErrorToast(error);
    }
  };

  const handleSeedModule = async () => {
    if (!moduleId) return;

    try {
      const response: any = await seedModuleMetadata({ id: moduleId }).unwrap();
      setIsSeedDialogOpen(false);
      setLocalActionSummary(response?.message ?? `Seeded metadata for module ${moduleName}.`);
      dispatch(showToast({
        severity: "success",
        summary: "Metadata Explorer",
        detail: response?.message ?? "Module metadata seeded successfully.",
        life: 3000,
      }));
      refetchManifest();
      refetchDocument();
    } catch (error) {
      showErrorToast(error);
    }
  };

  if (!moduleName) {
    return null;
  }

  return (
    <div className="solid-module-explorer">
      <div className="solid-module-explorer-panel">
        {loadError && (
          <div className="solid-module-explorer-alert">
            <SolidMessage
              severity="error"
              text={`Unable to load metadata explorer: ${extractApiErrorMessage(loadError)}`}
              className="justify-content-start"
            />
          </div>
        )}

        <div
          ref={explorerRef}
          className="solid-module-explorer-workspace"
          style={{ gridTemplateColumns: `${sidebarWidth}px 8px minmax(0, 1fr)` }}
        >
          <aside className="solid-module-explorer-sidebar">
            <div className="solid-module-explorer-sidebar-section solid-module-explorer-sidebar-sections">
              <div className="solid-module-explorer-sidebar-heading">
                <div className="solid-module-explorer-sidebar-heading-main">
                  <div className="solid-module-explorer-sidebar-title">{modelSingularName ? "Explorer" : "Sections"}</div>
                  <SolidTag tone="info">{modelSingularName ? scopedTreeNodes.length : sections.length}</SolidTag>
                </div>
                <button
                  type="button"
                  className="solid-module-explorer-sidebar-action"
                  onClick={handleCollapseAll}
                >
                  Collapse all
                </button>
              </div>

              <div className="solid-module-explorer-sidebar-search">
                <SolidInput
                  value={treeFilter}
                  onChange={(event) => setTreeFilter(event.target.value)}
                  placeholder="Search metadata tree"
                />
                <div className="solid-module-explorer-sidebar-search-icon">
                  <Search size={14} />
                </div>
              </div>

              <div className="solid-module-explorer-section-list solid-module-explorer-tree-list">
                <MetadataTree
                  nodes={filteredTreeNodes}
                  activePath={activePath}
                  expandedPaths={visibleExpandedPaths}
                  onToggle={toggleExpandedPath}
                  onSelect={selectPath}
                />
              </div>
            </div>
          </aside>

          <div
            className="solid-module-explorer-resizer"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize metadata navigation panel"
            onPointerDown={handleSidebarResizeStart}
          />

          <section className="solid-module-explorer-main">
            <div className="solid-module-explorer-main-header">
              <div className="solid-module-explorer-main-title">
                <div className="solid-module-explorer-main-heading-row">
                  <h4>{activeNode?.label ?? activeSection?.title ?? "Metadata"}</h4>
                  <p>{activePath || "Choose a metadata node from the tree."}</p>
                </div>
                {hasValidationFailure && (
                  <div className="solid-module-explorer-inline-validation" title={validationSummary}>
                    {validationSummary}
                  </div>
                )}
                {isReadOnlyExplorer && (
                  <div className="solid-module-explorer-readonly-note">
                    This metadata is browse-only in the explorer.
                  </div>
                )}
              </div>
              <div className="solid-module-explorer-main-actions">
                <div className="solid-module-explorer-main-meta">
                  {hasMutableChanges && <SolidTag tone="warn">Unsaved changes</SolidTag>}
                  {editorError && <SolidTag tone="danger">Invalid JSON</SolidTag>}
                  {isReadOnlyExplorer && <SolidTag tone="info">Read only</SolidTag>}
                </div>
                {!isReadOnlyExplorer && (
                  <SolidButton
                    size="sm"
                    leftIcon={<Save size={14} />}
                    onClick={handleSave}
                    loading={isSavingSection}
                    disabled={!canSave}
                  >
                    Save Section
                  </SolidButton>
                )}
                <SolidDropdownMenu>
                  <SolidDropdownMenuTrigger asChild>
                    <SolidButton
                      variant="ghost"
                      size="sm"
                      className="solid-icon-button"
                      aria-label="Explorer actions"
                    >
                      <Settings size={16} />
                    </SolidButton>
                  </SolidDropdownMenuTrigger>
                  <SolidDropdownMenuContent className="solid-module-explorer-actions-menu">
                    {!isReadOnlyExplorer && (
                      <SolidDropdownMenuItem onSelect={handleFormat}>
                        <div className="solid-module-explorer-actions-item">
                          <Wand2 size={14} />
                          <span>Format</span>
                        </div>
                      </SolidDropdownMenuItem>
                    )}
                    <SolidDropdownMenuItem onSelect={handleValidate} disabled={isValidatingSection}>
                      <div className="solid-module-explorer-actions-item">
                        <FileSearch size={14} />
                        <span>{isValidatingSection ? "Validating..." : "Validate"}</span>
                      </div>
                    </SolidDropdownMenuItem>
                    <SolidDropdownMenuItem onSelect={() => setIsContextDialogOpen(true)}>
                      <div className="solid-module-explorer-actions-item">
                        <Settings size={14} />
                        <span>Context</span>
                      </div>
                    </SolidDropdownMenuItem>
                    {allowSeed && (
                      <SolidDropdownMenuItem onSelect={() => setIsSeedDialogOpen(true)} disabled={!moduleId || isSeedingModule}>
                        <div className="solid-module-explorer-actions-item">
                          <DatabaseZap size={14} />
                          <span>{isSeedingModule ? "Seeding..." : "Seed"}</span>
                        </div>
                      </SolidDropdownMenuItem>
                    )}
                  </SolidDropdownMenuContent>
                </SolidDropdownMenu>
              </div>
            </div>

            <div className="solid-module-explorer-editor-wrap">
              <div className="solid-module-explorer-editor-shell">
                {isDocumentLoading ? (
                  <div style={{ padding: "1rem" }} className="solid-module-explorer-empty">
                    Loading metadata JSON...
                  </div>
                ) : (
                  <JsonEditorSurface
                    ref={editorRef}
                    value={savedValue}
                    resetToken={editorResetToken}
                    readOnly={isReadOnlyExplorer}
                    onValueChange={setEditorValue}
                    onErrorChange={setEditorError}
                  />
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      <SolidDialog
        open={isContextDialogOpen}
        onOpenChange={setIsContextDialogOpen}
        header="Context"
        contentClassName="solid-module-explorer-context-dialog"
      >
        <SolidDialogBody>
          <div className="solid-module-explorer-context-dialog-body">
            <div className="solid-module-explorer-context-dialog-header">
              <div className="solid-module-explorer-context-dialog-title">
                {activeNode?.label ?? "Metadata node"}
              </div>
              <div className="solid-module-explorer-context-dialog-meta">
                {activeNode?.sectionTitle && <SolidTag tone="info">{activeNode.sectionTitle}</SolidTag>}
              </div>
            </div>

            <div className="solid-module-explorer-context-grid">
              <div className="solid-module-explorer-context-row">
                <div className="solid-module-explorer-context-label">JSON Path</div>
                <div className="solid-module-explorer-context-value">{activePath || "-"}</div>
              </div>
              <div className="solid-module-explorer-context-row">
                <div className="solid-module-explorer-context-label">File</div>
                <div className="solid-module-explorer-context-value">{manifestData?.filePath ?? "-"}</div>
              </div>
              {localActionSummary && (
                <div className="solid-module-explorer-context-row">
                  <div className="solid-module-explorer-context-label">Last Action</div>
                  <div className="solid-module-explorer-context-value">{localActionSummary}</div>
                </div>
              )}
            </div>

            <div className="solid-module-explorer-context-note">
              Clicking any branch or leaf in the tree opens that exact JSON fragment on the right.
            </div>
          </div>
        </SolidDialogBody>
      </SolidDialog>

      <SolidDialog
        open={isSeedDialogOpen}
        onOpenChange={setIsSeedDialogOpen}
        contentClassName="solid-module-explorer-seed-dialog"
      >
        <SolidDialogHeader>
          <SolidDialogTitle>Seed Module Metadata</SolidDialogTitle>
        </SolidDialogHeader>
        <SolidDialogSeparator />
        <SolidDialogBody>
          <div className="solid-module-explorer-seed-dialog-body">
            <p>
              Re-seed metadata for <strong>{moduleName}</strong> from its JSON file?
            </p>
            <p className="solid-module-explorer-seed-dialog-note">
              This only re-runs metadata seeding for the current module and refreshes database metadata from the module JSON.
            </p>
          </div>
        </SolidDialogBody>
        <SolidDialogFooter>
          <SolidButton variant="outline" size="sm" onClick={() => setIsSeedDialogOpen(false)} disabled={isSeedingModule}>
            Cancel
          </SolidButton>
          <SolidButton size="sm" onClick={handleSeedModule} loading={isSeedingModule} disabled={!moduleId}>
            Seed
          </SolidButton>
        </SolidDialogFooter>
      </SolidDialog>
    </div>
  );
}
