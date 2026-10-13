import React from 'react';
import qs from 'qs';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { SolidButton } from '../../../../components/shad-cn-ui';
import { useGetArchivedChatterMessagesQuery, useLazyGetArchivedChatterMessageQuery } from '../../../../redux/api/solidChatterMessageApi';

const PAGE_SIZE = 25;
type Filters = { entityName: string; entityId: string; messageType: string; messageSubType: string; user: string; from: string; to: string };

export function ArchivedChatterMessagesPage() {
  const [filters, setFilters] = React.useState<Filters>({ entityName: '', entityId: '', messageType: '', messageSubType: '', user: '', from: '', to: '' });
  const [offset, setOffset] = React.useState(0);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);

  const queryString = React.useMemo(() => {
    const query: any = { limit: PAGE_SIZE, offset };
    const where: Record<string, any> = {};
    if (filters.entityName.trim()) where.coModelName = { $containsi: filters.entityName.trim() };
    if (filters.entityId.trim() && Number.isFinite(Number(filters.entityId))) where.coModelEntityId = { $eq: Number(filters.entityId) };
    if (filters.messageType) where.messageType = { $eq: filters.messageType };
    if (filters.messageSubType.trim()) where.messageSubType = { $containsi: filters.messageSubType.trim() };
    if (filters.user.trim()) where.user = { fullName: { $containsi: filters.user.trim() } };
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.$gte = new Date(filters.from).toISOString();
      if (filters.to) where.createdAt.$lte = new Date(filters.to).toISOString();
    }
    if (Object.keys(where).length) query.filters = where;
    query.sort = ['createdAt:DESC'];
    return qs.stringify(query, { encodeValuesOnly: true });
  }, [filters, offset]);

  const { data, isLoading, isFetching, error } = useGetArchivedChatterMessagesQuery(queryString);
  const [fetchOne, { data: detailData, isFetching: detailLoading }] = useLazyGetArchivedChatterMessageQuery();
  const records = data?.records ?? [];
  const meta = data?.meta ?? {};

  const openRecord = async (id: number) => {
    setSelectedId(id);
    await fetchOne(id);
  };
  const selected = detailData?.record;

  return <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-6">
    <header>
      <h1 className="m-0 text-2xl font-semibold">Archived Messages</h1>
      <p className="mt-1 text-sm text-muted-foreground">Search chatter messages moved to the configured archive store.</p>
    </header>

    {data?.available === false ? <section className="rounded-lg border p-6" role="status">
      <h2 className="m-0 text-lg font-semibold">Chatter archival is not enabled</h2>
      <p className="mb-0 mt-2 text-sm text-muted-foreground">Configure and register an IChatterMessageArchive provider in the consuming project to archive and browse messages.</p>
    </section> : <>
      <section className="grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-7" aria-label="Archive filters">
        <label className="flex flex-col gap-1 text-sm">Entity name<input className="rounded border px-3 py-2" value={filters.entityName} onChange={e => { setOffset(0); setFilters({ ...filters, entityName: e.target.value }); }} placeholder="e.g. customer" /></label>
        <label className="flex flex-col gap-1 text-sm">Entity ID<input className="rounded border px-3 py-2" inputMode="numeric" value={filters.entityId} onChange={e => { setOffset(0); setFilters({ ...filters, entityId: e.target.value }); }} placeholder="Record ID" /></label>
        <label className="flex flex-col gap-1 text-sm">Message type<select className="rounded border px-3 py-2" value={filters.messageType} onChange={e => { setOffset(0); setFilters({ ...filters, messageType: e.target.value }); }}><option value="">All types</option><option value="audit">Audit</option><option value="custom">Custom</option></select></label>
        <label className="flex flex-col gap-1 text-sm">Message subtype<input className="rounded border px-3 py-2" value={filters.messageSubType} onChange={e => { setOffset(0); setFilters({ ...filters, messageSubType: e.target.value }); }} placeholder="e.g. audit_update" /></label>
        <label className="flex flex-col gap-1 text-sm">Changed by<input className="rounded border px-3 py-2" value={filters.user} onChange={e => { setOffset(0); setFilters({ ...filters, user: e.target.value }); }} placeholder="User name" /></label>
        <label className="flex flex-col gap-1 text-sm">From<input className="rounded border px-3 py-2" type="datetime-local" value={filters.from} onChange={e => { setOffset(0); setFilters({ ...filters, from: e.target.value }); }} /></label>
        <label className="flex flex-col gap-1 text-sm">To<input className="rounded border px-3 py-2" type="datetime-local" value={filters.to} onChange={e => { setOffset(0); setFilters({ ...filters, to: e.target.value }); }} /></label>
      </section>

      {error && <p role="alert" className="text-sm text-red-600">Unable to load archived messages. Check provider availability and try again.</p>}
      <section className="overflow-hidden rounded-lg border">
        {isLoading ? <div className="flex items-center gap-2 p-8"><Loader2 className="animate-spin" size={18} />Loading archived messages…</div> : records.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No archived messages match these filters.</p> : <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-muted/50"><tr><th className="p-3">Date</th><th className="p-3">Entity</th><th className="p-3">Entity ID</th><th className="p-3">Type</th><th className="p-3">User</th><th className="p-3">Message</th></tr></thead>
            <tbody>{records.map((message: any) => <tr key={message.id} className="border-t hover:bg-muted/30">
              <td className="whitespace-nowrap p-3">{message.createdAt ? new Date(message.createdAt).toLocaleString() : '—'}</td>
              <td className="p-3">{message.modelDisplayName || message.coModelName}</td><td className="p-3">{message.coModelEntityId}</td>
              <td className="p-3">{message.messageSubType || message.messageType}</td><td className="p-3">{message.user?.fullName || 'System'}</td>
              <td className="max-w-md p-3"><button type="button" className="text-left text-primary underline" onClick={() => openRecord(message.id)}>{message.messageBody || 'View message'}</button></td>
            </tr>)}</tbody>
          </table>
        </div>}
      </section>

      <footer className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{meta.totalRecords ?? records.length} archived messages{isFetching ? ' · Updating…' : ''}</span>
        <div className="flex gap-2"><SolidButton variant="outline" disabled={offset === 0 || isFetching} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}><ChevronLeft size={16} />Previous</SolidButton><SolidButton variant="outline" disabled={records.length < PAGE_SIZE || isFetching} onClick={() => setOffset(offset + PAGE_SIZE)}>Next<ChevronRight size={16} /></SolidButton></div>
      </footer>
    </>}

    {selectedId !== null && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation" onClick={() => setSelectedId(null)}>
      <section role="dialog" aria-modal="true" aria-label="Archived chatter message" className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-lg bg-background p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between"><h2 className="m-0 text-xl font-semibold">Archived message #{selectedId}</h2><button type="button" className="rounded px-2 py-1 hover:bg-muted" onClick={() => setSelectedId(null)}>Close</button></div>
        {detailLoading ? <p>Loading message…</p> : selected ? <>
          <dl className="grid grid-cols-2 gap-3 text-sm"><dt>Entity</dt><dd>{selected.modelDisplayName || selected.coModelName}</dd><dt>Entity ID</dt><dd>{selected.coModelEntityId}</dd><dt>Date</dt><dd>{selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'}</dd><dt>User</dt><dd>{selected.user?.fullName || 'System'}</dd><dt>Subtype</dt><dd>{selected.messageSubType}</dd></dl>
          <h3 className="mt-5 text-base font-semibold">Message</h3><pre className="whitespace-pre-wrap break-words rounded bg-muted p-3 text-sm">{selected.messageBody || ''}</pre>
          {!!selected.chatterMessageDetails?.length && <><h3 className="mt-5 text-base font-semibold">Change details</h3><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Field</th><th className="p-2">Previous</th><th className="p-2">Current</th></tr></thead><tbody>{selected.chatterMessageDetails.map((detail: any, index: number) => <tr className="border-t" key={detail.id ?? index}><td className="p-2">{detail.fieldDisplayName || detail.fieldName}</td><td className="p-2">{detail.oldValueDisplay ?? detail.oldValue ?? '—'}</td><td className="p-2">{detail.newValueDisplay ?? detail.newValue ?? '—'}</td></tr>)}</tbody></table></div></>}
        </> : <p role="alert">Could not load this archived message.</p>}
      </section>
    </div>}
  </main>;
}
