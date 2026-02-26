'use client';

/**
 * Government – Programme list and configuration (PRD §4.2.5).
 * Data from GET /api/v1/programmes; create via POST /api/v1/programmes.
 */

import { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { SearchHeader } from '@/components/ui/search-header';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

type ProgrammeRow = { id: string; name: string; budget: string; start: string; end: string; verificationDays: number };

const COLS = [
  { key: 'name', header: 'Name' },
  { key: 'budget', header: 'Budget' },
  { key: 'start', header: 'Start' },
  { key: 'end', header: 'End' },
  { key: 'verificationDays', header: 'Verification (days)' },
];

function mapApiToRow(r: { id: string; name: string; allocated_budget: string | null; start_date: string; end_date: string; verification_frequency_days: number }): ProgrammeRow {
  return {
    id: r.id,
    name: r.name,
    budget: r.allocated_budget != null ? `NAD ${Number(r.allocated_budget).toLocaleString()}` : '—',
    start: r.start_date.slice(0, 10),
    end: r.end_date.slice(0, 10),
    verificationDays: r.verification_frequency_days ?? 90,
  };
}

export default function GovernmentProgrammesPage() {
  const { addToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [verificationDays, setVerificationDays] = useState('90');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProgrammeRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/v1/programmes?page=1&limit=100')
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.data && Array.isArray(json.data)) setData(json.data.map(mapApiToRow));
        else setData([]);
      })
      .catch(() => { if (!cancelled) { setData([]); addToast('Failed to load programmes.', 'error'); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [addToast]);

  const handleCreate = async () => {
    if (!name.trim()) { addToast('Enter programme name.', 'error'); return; }
    try {
      const res = await fetch('/api/v1/programmes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          allocated_budget: budget ? String(Number(budget)) : null,
          start_date: start || undefined,
          end_date: end || undefined,
          verification_frequency_days: verificationDays ? Number(verificationDays) : 90,
        }),
      });
      const json = await res.json();
      if (!res.ok) { addToast(json.error ?? 'Failed to create programme.', 'error'); return; }
      setModalOpen(false);
      setName(''); setBudget(''); setStart(''); setEnd(''); setVerificationDays('90');
      addToast('Programme created.', 'success');
      const listRes = await fetch('/api/v1/programmes?page=1&limit=100');
      const listJson = await listRes.json();
      if (listJson.data && Array.isArray(listJson.data)) setData(listJson.data.map(mapApiToRow));
    } catch { addToast('Failed to create programme.', 'error'); }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Programmes" description="Programme list and configuration (admin)." />
      <SearchHeader
        title="Programmes"
        action={<Button size="sm" onClick={() => setModalOpen(true)}>Add programme</Button>}
      />
      <DataTable columns={COLS} data={data} keyExtractor={(r) => r.id} emptyMessage={loading ? 'Loading…' : 'No programmes.'} />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add programme">
        <div className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Programme name" />
          <Input label="Budget (NAD)" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 20000000" />
          <Input type="date" label="Start date" value={start} onChange={(e) => setStart(e.target.value)} />
          <Input type="date" label="End date" value={end} onChange={(e) => setEnd(e.target.value)} />
          <Input label="Verification frequency (days)" value={verificationDays} onChange={(e) => setVerificationDays(e.target.value)} />
          <div className="modal-action">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
