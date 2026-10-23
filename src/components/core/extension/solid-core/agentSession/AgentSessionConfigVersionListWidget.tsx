import React from "react";
import qs from "qs";
import { Info } from "lucide-react";
import type { SolidListFieldWidgetProps } from "../../../../../types/solid-core";
import { createSolidEntityApi } from "../../../../../redux/api/solidEntityApi";
import { SolidPopover, SolidPopoverContent, SolidPopoverTrigger } from "../../../../shad-cn-ui";
import styles from "./AgentSessionConfigVersionListWidget.module.css";

type ConfigVersion = { name?: string; description?: string };
const configVersionApi = createSolidEntityApi("agentConfigVersion");

function queryFor(agentId: string | number, versionNumber: number) {
  return qs.stringify({
    offset: 0,
    limit: 1,
    fields: ["id", "name", "description", "versionNumber"],
    filters: {
      $and: [
        { agentRegistry: { id: { $eq: agentId } } },
        { versionNumber: { $eq: versionNumber } },
      ],
    },
  });
}

export function AgentSessionConfigVersionListWidget({ rowData, fieldMetadata }: SolidListFieldWidgetProps) {
  const [fetchVersions] = configVersionApi.useLazyGetSolidEntitiesQuery();
  const [open, setOpen] = React.useState(false);
  const [version, setVersion] = React.useState<ConfigVersion | null>(null);
  const [loading, setLoading] = React.useState(false);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const value = fieldMetadata?.name ? rowData?.[fieldMetadata.name] : undefined;
  const versionNumber = Number(value);
  const agent = rowData?.agent;
  const agentId = agent && typeof agent === "object" ? agent.id : agent;

  React.useEffect(() => {
    let active = true;
    if (!open || agentId == null || !Number.isFinite(versionNumber) || versionNumber <= 0) return () => { active = false; };

    setLoading(true);
    void fetchVersions(queryFor(agentId, versionNumber), true).unwrap()
      .then((result: any) => {
        if (active) setVersion(Array.isArray(result?.records) ? result.records[0] ?? null : null);
      })
      .catch(() => { if (active) setVersion(null); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [open, agentId, versionNumber, fetchVersions]);

  React.useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const openOnHover = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const closeAfterHover = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  };

  return (
    <div className={styles.valueWrap}>
      <span className={styles.value}>{value ?? "—"}</span>
      {value != null && (
        <SolidPopover open={open} onOpenChange={setOpen}>
          <SolidPopoverTrigger asChild>
            <button
              type="button"
              aria-label={`Show details for config version ${String(value)}`}
              aria-haspopup="dialog"
              className={styles.infoButton}
              onMouseEnter={openOnHover}
              onMouseLeave={closeAfterHover}
              onFocus={openOnHover}
              onBlur={closeAfterHover}
              onClick={(event) => {
                event.preventDefault();
                openOnHover();
              }}
            >
              <Info size={14} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </SolidPopoverTrigger>
          <SolidPopoverContent
            side="bottom"
            align="start"
            sideOffset={7}
            className={styles.popover}
            onMouseEnter={openOnHover}
            onMouseLeave={closeAfterHover}
          >
            <div className={styles.popoverEyebrow}>CONFIG VERSION {String(value)}</div>
            <div className={styles.popoverTitle}>
              {loading ? "Loading version details…" : version?.name || `Version ${String(value)}`}
            </div>
            <p className={styles.popoverDescription}>
              {loading ? "" : version?.description || "No description was added for this version."}
            </p>
          </SolidPopoverContent>
        </SolidPopover>
      )}
    </div>
  );
}
