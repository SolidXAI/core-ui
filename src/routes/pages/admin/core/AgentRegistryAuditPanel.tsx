import React from "react";
import qs from "qs";
import { SolidChatter } from "../../../../components/core/chatter/SolidChatter";
import { SolidButton } from "../../../../components/shad-cn-ui";
import { permissionExpression } from "../../../../helpers/permissions";
import { useLazyCheckIfPermissionExistsQuery } from "../../../../redux/api/userApi";
import "./AgentRegistryAuditPanel.css";

type AgentRegistryAuditPanelProps = {
  children: React.ReactNode;
  modelSingularName: "agentRegistry" | "agentSkillRegistry" | "agentToolRegistry";
  recordId: number;
  refreshVersion: number;
  modelUserKey?: string;
};

const MIN_CHATTER_WIDTH = 320;
const MIN_EDITOR_WIDTH = 420;
const WIDTH_STORAGE_KEY = "chatter_locale_width";

export function AgentRegistryAuditPanel({ children, modelSingularName, recordId, refreshVersion, modelUserKey }: AgentRegistryAuditPanelProps) {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [width, setWidth] = React.useState(360);
  const [isResizing, setIsResizing] = React.useState(false);
  const [refreshChatterMessage, setRefreshChatterMessage] = React.useState(true);
  const [actionsAllowed, setActionsAllowed] = React.useState<string[]>([]);
  const [permissionsReady, setPermissionsReady] = React.useState(false);
  const [checkPermissions] = useLazyCheckIfPermissionExistsQuery();

  const clampWidth = React.useCallback((nextWidth: number) => {
    const availableWidth = wrapperRef.current?.getBoundingClientRect().width ?? window.innerWidth;
    const maxWidth = Math.max(MIN_CHATTER_WIDTH, availableWidth - MIN_EDITOR_WIDTH);
    return Math.max(MIN_CHATTER_WIDTH, Math.min(nextWidth, maxWidth));
  }, []);

  React.useEffect(() => {
    const stored = localStorage.getItem(WIDTH_STORAGE_KEY);
    if (stored) {
      const parsed = Number.parseInt(stored, 10);
      if (Number.isFinite(parsed)) setWidth(clampWidth(parsed));
    }
    const onResize = () => setWidth((current) => clampWidth(current));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clampWidth]);

  React.useEffect(() => {
    if (!isResizing) return;
    const onMouseMove = (event: MouseEvent) => {
      const rightEdge = wrapperRef.current?.getBoundingClientRect().right ?? window.innerWidth;
      const nextWidth = clampWidth(rightEdge - event.clientX);
      setWidth(nextWidth);
      localStorage.setItem(WIDTH_STORAGE_KEY, String(nextWidth));
    };
    const onMouseUp = () => setIsResizing(false);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isResizing, clampWidth]);

  React.useEffect(() => {
    let active = true;
    const query = qs.stringify({ permissionNames: [permissionExpression("chatterMessage", "findMany")] }, { encodeValuesOnly: true });
    checkPermissions(query).unwrap()
      .then((response: any) => {
        if (active) setActionsAllowed(Array.isArray(response?.data) ? response.data : []);
      })
      .catch(() => {
        if (active) setActionsAllowed([]);
      })
      .finally(() => {
        if (active) setPermissionsReady(true);
      });
    return () => { active = false; };
  }, [checkPermissions]);

  React.useEffect(() => {
    setRefreshChatterMessage(true);
  }, [recordId, refreshVersion]);

  return (
    <div className="agent-registry-audit-layout" ref={wrapperRef}>
      <div className="agent-registry-audit-layout__content">{children}</div>
      <aside className={`chatter-section agent-registry-audit-panel ${isOpen ? "open" : "collapsed"}`} style={{ width }}>
        {isOpen ? (
          <>
            <div className="agent-registry-audit-panel__resize" onMouseDown={() => setIsResizing(true)} />
            <SolidButton
              icon="si si-angle-double-right"
              size="sm"
              text
              className="chatter-collapse-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Collapse audit trail"
            />
            {permissionsReady && (
              <SolidChatter
                modelSingularName={modelSingularName}
                id={recordId}
                refreshChatterMessage={refreshChatterMessage}
                setRefreshChatterMessage={setRefreshChatterMessage}
                actionsAllowed={actionsAllowed}
                title="Audit Trail"
                modelUserKey={modelUserKey}
              />
            )}
          </>
        ) : (
          <div className="agent-registry-audit-panel__collapsed">
            <button type="button" className="chatter-collapsed-content" onClick={() => { setIsOpen(true); setRefreshChatterMessage(true); }}>
              Audit Trail
            </button>
            <SolidButton icon="si si-chevron-left" size="sm" className="px-0" onClick={() => { setIsOpen(true); setRefreshChatterMessage(true); }} aria-label="Expand audit trail" />
          </div>
        )}
      </aside>
    </div>
  );
}
