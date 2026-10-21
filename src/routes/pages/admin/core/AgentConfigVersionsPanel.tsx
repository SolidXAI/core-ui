import React from "react";
import { ArrowLeftRight, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import qs from "qs";
import { createSolidEntityApi } from "../../../../redux/api/solidEntityApi";
import { SolidButton } from "../../../../components/shad-cn-ui";
import { CONFIG_COMPARE_PATH, formatConfigDate, type ConfigVersion } from "./agentConfigComparison";
import "./AgentConfigComparisonPage.css";

const versionApi = createSolidEntityApi("agentConfigVersion");
const PAGE_SIZE = 25;

export function AgentConfigVersionsPanel({ agentId, active }: { agentId: number; active: boolean }) {
  const navigate = useNavigate();
  const [offset, setOffset] = React.useState(0);
  const [selected, setSelected] = React.useState<ConfigVersion[]>([]);
  const result = versionApi.useGetSolidEntitiesQuery(qs.stringify({
    offset, limit: PAGE_SIZE, sort: ["versionNumber:DESC", "id:DESC"],
    filters: { agentRegistry: { id: { $eq: agentId } } },
    fields: ["id", "versionNumber", "name", "description", "createdAt"],
  }), { skip: !active, refetchOnMountOrArgChange: true });
  React.useEffect(() => { setSelected([]); setOffset(0); }, [agentId]);
  const versions: ConfigVersion[] = [...(result.currentData?.records ?? [])].sort((a, b) => b.versionNumber - a.versionNumber || b.id - a.id);
  const total = Number(result.currentData?.meta?.totalRecords ?? versions.length);
  const toggle = (version: ConfigVersion) => setSelected((current) => current.some((row) => row.id === version.id)
    ? current.filter((row) => row.id !== version.id) : current.length < 2 ? [...current, version] : current);
  const compare = () => {
    const [left, right] = [...selected].sort((a, b) => a.versionNumber - b.versionNumber || a.id - b.id);
    if (!left || !right) return;
    navigate(`${CONFIG_COMPARE_PATH}?${new URLSearchParams({ agentId: String(agentId), leftVersionId: String(left.id), rightVersionId: String(right.id) })}`);
  };
  return <section className="config-versions">
    <div className="config-versions__toolbar"><div><h2>Config versions</h2><p>Select two versions to compare. Latest versions appear first.</p></div>
      <div className="config-versions__actions">
        {selected.length === 2 && <SolidButton size="small" onClick={compare}><ArrowLeftRight size={15} /> Compare</SolidButton>}
        <SolidButton variant="secondary" size="small" aria-label="Refresh config versions" disabled={result.isFetching} onClick={() => void result.refetch()}><RefreshCw size={15} /></SolidButton>
      </div>
    </div>
    {result.isFetching ? <div className="config-compare__empty" role="status">Loading config versions…</div>
      : result.isError ? <div className="config-compare__empty" role="alert">Config versions could not be loaded. <button type="button" onClick={() => void result.refetch()}>Retry</button></div>
      : !versions.length ? <div className="config-compare__empty">No config versions yet. Activate this agent to create its first version.</div>
      : <div className="config-versions__table-wrap"><table className="config-versions__table"><thead><tr><th><span className="config-compare__sr-only">Select</span></th><th>Version</th><th>Name</th><th>Description</th><th>Created</th></tr></thead>
        <tbody>{versions.map((version) => {
          const checked = selected.some((row) => row.id === version.id);
          return <tr key={version.id} className={checked ? "is-selected" : ""}><td><input type="checkbox" aria-label={`Select config version ${version.versionNumber}`} checked={checked} disabled={!checked && selected.length === 2} onChange={() => toggle(version)} /></td>
            <td><span className="config-versions__number">v{version.versionNumber}</span></td><td><strong>{version.name || `Version ${version.versionNumber}`}</strong></td><td>{version.description || "—"}</td><td><time dateTime={version.createdAt}>{formatConfigDate(version.createdAt)}</time></td></tr>;
        })}</tbody></table></div>}
    {total > PAGE_SIZE && <div className="config-versions__pagination"><span>{offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}</span><div className="config-versions__actions">
      <SolidButton variant="secondary" size="small" disabled={!offset || result.isFetching} onClick={() => setOffset((value) => Math.max(0, value - PAGE_SIZE))}>Previous</SolidButton>
      <SolidButton variant="secondary" size="small" disabled={offset + PAGE_SIZE >= total || result.isFetching} onClick={() => setOffset((value) => value + PAGE_SIZE)}>Next</SolidButton>
    </div></div>}
  </section>;
}
