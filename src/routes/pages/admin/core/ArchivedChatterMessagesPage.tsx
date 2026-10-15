import React from 'react';
import qs from 'qs';
import { Loader2 } from 'lucide-react';
import { SolidAutocomplete } from '../../../../components/shad-cn-ui/SolidAutocomplete';
import { Column, SolidDataTable } from '../../../../components/core/list/SolidDataTable';
import { useLazyGetModelsQuery } from '../../../../redux/api/modelApi';
import { createSolidEntityApi } from '../../../../redux/api/solidEntityApi';
import { useGetArchivedChatterMessagesQuery, useLazyGetArchivedChatterMessageQuery } from '../../../../redux/api/solidChatterMessageApi';

const DEFAULT_PAGE_SIZE = 25;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const MESSAGE_TYPES = [
  { label: 'All types', value: '' },
  { label: 'Audit', value: 'audit' },
  { label: 'Custom', value: 'custom' },
];
const MESSAGE_SUBTYPES = [
  { label: 'All subtypes', value: '' },
  { label: 'Audit insert', value: 'audit_insert' },
  { label: 'Audit update', value: 'audit_update' },
  { label: 'Audit delete', value: 'audit_delete' },
  { label: 'Custom', value: 'custom' },
  { label: 'Note', value: 'note' },
  { label: 'Task', value: 'task' },
];

type AutocompleteOption = { label: string; value: string | number };
type ArchiveFilters = {
  entity: AutocompleteOption | null;
  entityId: string;
  messageType: string;
  messageSubType: string;
  user: AutocompleteOption | null;
  from: string;
  to: string;
};

const userApi = createSolidEntityApi('User');

const buildQueryString = (query: Record<string, unknown>) =>
  qs.stringify(query, { encodeValuesOnly: true });

function toLocalDateBoundary(value: string, endOfDay = false): string {
  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00'}`);
  return date.toISOString();
}

export function ArchivedChatterMessagesPage() {
  const [filters, setFilters] = React.useState<ArchiveFilters>({
    entity: null,
    entityId: '',
    messageType: '',
    messageSubType: '',
    user: null,
    from: '',
    to: '',
  });
  const [first, setFirst] = React.useState(0);
  const [rows, setRows] = React.useState(DEFAULT_PAGE_SIZE);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [modelOptions, setModelOptions] = React.useState<AutocompleteOption[]>([]);
  const [userOptions, setUserOptions] = React.useState<AutocompleteOption[]>([]);

  const [getModels, { data: modelsData }] = useLazyGetModelsQuery();
  const [getUsers] = userApi.useLazyGetSolidEntitiesQuery();
  const {
    data,
    isLoading,
    isError,
  } = useGetArchivedChatterMessagesQuery(React.useMemo(() => {
    const query: Record<string, unknown> = {
      limit: rows,
      offset: first,
      sort: ['createdAt:DESC'],
    };
    const where: Record<string, any> = {};
    if (filters.entity?.value) where.coModelName = { $eq: filters.entity.value };
    if (filters.entityId.trim() && Number.isFinite(Number(filters.entityId))) {
      where.coModelEntityId = { $eq: Number(filters.entityId) };
    }
    if (filters.messageType) where.messageType = { $eq: filters.messageType };
    if (filters.messageSubType) where.messageSubType = { $eq: filters.messageSubType };
    if (filters.user?.value) where.user = { id: { $eq: filters.user.value } };
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.$gte = toLocalDateBoundary(filters.from);
      if (filters.to) where.createdAt.$lte = toLocalDateBoundary(filters.to, true);
    }
    if (Object.keys(where).length) query.filters = where;
    return buildQueryString(query);
  }, [filters, first, rows]));

  const [fetchOne, { currentData: detailData, isFetching: detailLoading }] = useLazyGetArchivedChatterMessageQuery();
  const records = data?.records ?? [];
  const meta = data?.meta ?? {};
  React.useEffect(() => {
    getModels('offset=0&limit=1000&sort[0]=displayName%3AASC');
  }, [getModels]);

  React.useEffect(() => {
    const options = (modelsData?.records ?? [])
      .filter((model: any) => model?.singularName)
      .map((model: any) => ({
        label: model.displayName && model.displayName !== model.singularName
          ? `${model.displayName} (${model.singularName})`
          : model.singularName,
        value: model.singularName,
      }));
    setModelOptions(options);
  }, [modelsData]);

  const updateFilter = <K extends keyof ArchiveFilters>(key: K, value: ArchiveFilters[K]) => {
    setFirst(0);
    setFilters(current => ({ ...current, [key]: value }));
  };

  const completeModels = ({ query }: { query: string }) => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    setModelOptions((modelsData?.records ?? [])
      .filter((model: any) => model?.singularName)
      .filter((model: any) => !normalizedQuery ||
        `${model.displayName ?? ''} ${model.singularName}`.toLocaleLowerCase().includes(normalizedQuery))
      .slice(0, 25)
      .map((model: any) => ({
        label: model.displayName && model.displayName !== model.singularName
          ? `${model.displayName} (${model.singularName})`
          : model.singularName,
        value: model.singularName,
      })));
  };

  const completeUsers = async ({ query }: { query: string }) => {
    const queryString = buildQueryString({
      offset: 0,
      limit: 10,
      sort: ['fullName:ASC'],
      filters: query.trim() ? { fullName: { $containsi: query.trim() } } : {},
    });
    const response = await getUsers(queryString);
    const users = response.data?.records ?? [];
    setUserOptions(users.map((user: any) => ({
      label: user.fullName || user.username || `User ${user.id}`,
      value: user.id,
    })));
  };

  const openRecord = (id: number) => {
    setSelectedId(id);
    void fetchOne(id);
  };

  const selected = detailData?.record;
  const emptyMessage = isLoading
    ? <span className="inline-flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={16} />Loading archived messages…</span>
    : isError
      ? <span role="alert" className="text-red-600">Unable to load archived messages. Check the archive store connection and try again.</span>
      : 'No archived messages found';

  return (
    <div className="page-parent-wrapper solid-list-page-wrapper flex h-full min-h-0 overflow-hidden">
      <div className="solid-list-content flex min-w-0 flex-grow-1 flex-col">
        <div className="solid-list-surface flex min-h-0 flex-1 flex-col">
          <div className="page-header solid-list-toolbar flex-col">
            <section className="solid-list-toolbar-left grid w-full grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-7" aria-label="Archived message filters">
              <label className="flex min-w-0 flex-col gap-1 text-sm">
                Entity
                <SolidAutocomplete
                  dropdown
                  forceSelection
                  field="label"
                  value={filters.entity}
                  suggestions={modelOptions}
                  completeMethod={completeModels}
                  onChange={(event) => updateFilter('entity', event.value)}
                  placeholder="All entities"
                  className="w-full solid-standard-autocomplete"
                  inputClassName="w-full solid-filter-compact-control"
                  emptyMessage="No models found"
                />
              </label>
              <label className="flex min-w-0 flex-col gap-1 text-sm">
                Entity ID
                <input
                  className="solid-input w-full solid-filter-compact-control"
                  type="text"
                  value={filters.entityId}
                  onChange={(event) => updateFilter('entityId', event.target.value)}
                  placeholder="Any entity ID"
                />
              </label>
              <label className="flex min-w-0 flex-col gap-1 text-sm">
                Message type
                <select className="solid-input w-full solid-filter-compact-control" value={filters.messageType} onChange={(event) => updateFilter('messageType', event.target.value)}>
                  {MESSAGE_TYPES.map(option => <option key={option.value || 'all'} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="flex min-w-0 flex-col gap-1 text-sm">
                Message subtype
                <select className="solid-input w-full solid-filter-compact-control" value={filters.messageSubType} onChange={(event) => updateFilter('messageSubType', event.target.value)}>
                  {MESSAGE_SUBTYPES.map(option => <option key={option.value || 'all'} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="flex min-w-0 flex-col gap-1 text-sm">
                Changed by
                <SolidAutocomplete
                  dropdown
                  forceSelection
                  field="label"
                  value={filters.user}
                  suggestions={userOptions}
                  completeMethod={completeUsers}
                  onChange={(event) => updateFilter('user', event.value)}
                  placeholder="Any user"
                  className="w-full solid-standard-autocomplete"
                  inputClassName="w-full solid-filter-compact-control"
                  emptyMessage="No users found"
                />
              </label>
              <label className="flex min-w-0 flex-col gap-1 text-sm">
                From
                <input className="solid-input w-full solid-filter-compact-control" type="date" value={filters.from} onChange={(event) => updateFilter('from', event.target.value)} />
              </label>
              <label className="flex min-w-0 flex-col gap-1 text-sm">
                To
                <input className="solid-input w-full solid-filter-compact-control" type="date" value={filters.to} onChange={(event) => updateFilter('to', event.target.value)} />
              </label>
            </section>
          </div>

          {data?.available === false ? (
            <section className="m-4 rounded-md border border-border/60 bg-background p-6 text-center" role="status">
              <h2 className="m-0 text-base font-semibold">Chatter archival is not enabled</h2>
              <p className="mb-0 mt-2 text-sm text-muted-foreground">Configure and register an IChatterMessageArchive provider in the consuming project to archive and browse messages.</p>
            </section>
          ) : (
            <>
              <div className="solid-datatable-wrapper solid-list-table-area min-h-0 flex-1 overflow-hidden">
                <SolidDataTable
                  value={records}
                  dataKey="id"
                  rows={rows}
                  first={first}
                  totalRecords={meta.totalRecords ?? records.length}
                  rowsPerPageOptions={PAGE_SIZE_OPTIONS}
                  onPage={(event) => {
                    setFirst(event.first);
                    setRows(event.rows);
                  }}
                  emptyMessage={emptyMessage}
                  viewportHeight="100%"
                  rowClassName={() => 'cursor-pointer'}
                  onRowClick={(event) => openRecord(event.data.id)}
                  currentPageReportTemplate="{first} - {last} of {totalRecords}"
                >
                  <Column header="Date" body={(message: any) => message.createdAt ? new Date(message.createdAt).toLocaleString() : '—'} />
                  <Column header="Entity" body={(message: any) => message.modelDisplayName || message.coModelName || '—'} />
                  <Column header="Entity ID" body={(message: any) => message.coModelEntityId ?? '—'} />
                  <Column header="Type" body={(message: any) => message.messageType || '—'} />
                  <Column header="Subtype" body={(message: any) => message.messageSubType || '—'} />
                  <Column header="Changed by" body={(message: any) => message.user?.fullName || 'System'} />
                  <Column header="Message" body={(message: any) => <span className="line-clamp-2 min-w-48">{message.messageBody || 'View message details'}</span>} />
                </SolidDataTable>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation" onClick={() => setSelectedId(null)}>
          <section role="dialog" aria-modal="true" aria-label="Archived chatter message" className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-lg bg-background p-6 shadow-xl" onClick={event => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <h2 className="m-0 text-xl font-semibold">Archived message #{selectedId}</h2>
              <button type="button" className="rounded px-2 py-1 hover:bg-muted" onClick={() => setSelectedId(null)}>Close</button>
            </div>
            {detailLoading ? <p>Loading message…</p> : selected ? <>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <dt>Entity</dt><dd>{selected.modelDisplayName || selected.coModelName}</dd>
                <dt>Entity ID</dt><dd>{selected.coModelEntityId}</dd>
                <dt>Date</dt><dd>{selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'}</dd>
                <dt>Changed by</dt><dd>{selected.user?.fullName || 'System'}</dd>
                <dt>Type</dt><dd>{selected.messageType}</dd>
                <dt>Subtype</dt><dd>{selected.messageSubType}</dd>
              </dl>
              <h3 className="mt-5 text-base font-semibold">Message</h3>
              <pre className="whitespace-pre-wrap break-words rounded bg-muted p-3 text-sm">{selected.messageBody || ''}</pre>
              {!!selected.chatterMessageDetails?.length && <>
                <h3 className="mt-5 text-base font-semibold">Change details</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead><tr><th className="p-2">Field</th><th className="p-2">Previous</th><th className="p-2">Current</th></tr></thead>
                    <tbody>{selected.chatterMessageDetails.map((detail: any, index: number) => <tr className="border-t" key={detail.id ?? index}>
                      <td className="p-2">{detail.fieldDisplayName || detail.fieldName}</td>
                      <td className="p-2">{detail.oldValueDisplay ?? detail.oldValue ?? '—'}</td>
                      <td className="p-2">{detail.newValueDisplay ?? detail.newValue ?? '—'}</td>
                    </tr>)}</tbody>
                  </table>
                </div>
              </>}
            </> : <p role="alert">Could not load this archived message.</p>}
          </section>
        </div>
      )}
    </div>
  );
}
