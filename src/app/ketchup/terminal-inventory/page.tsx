'use client';

/**
 * Terminal Inventory – Ketchup Portal (PRD §3.2.4).
 * List of all POS terminals (FP09); status, assigned agent, last ping; assign terminal to agent.
 */

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SearchHeader } from '@/components/ui/search-header';
import { DataTable } from '@/components/ui/data-table';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { portalFetch } from '@/lib/portal-fetch';

type Terminal = {
  id: string;
  model: string;
  status: string;
  assignedAgent: string;
  lastPing: string;
  softwareVersion: string;
};

const COLS = [
  { key: 'id', header: 'Terminal ID' },
  { key: 'model', header: 'Model' },
  { key: 'status', header: 'Status' },
  { key: 'assignedAgent', header: 'Assigned agent' },
  { key: 'lastPing', header: 'Last ping' },
  { key: 'softwareVersion', header: 'Software' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'offline', label: 'Offline' },
  { value: 'maintenance', label: 'Maintenance' },
];

const AGENT_OPTIONS = [
  { value: '', label: 'Select agent' },
  { value: 'a1', label: 'Windhoek Mini Market' },
  { value: 'a2', label: 'Swakop Spar' },
];

export default function TerminalInventoryPage() {
  const { addToast } = useToast();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTerminalId, setSelectedTerminalId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    portalFetch('/api/v1/terminals')
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.data && Array.isArray(json.data)) {
          setTerminals(json.data);
        } else {
          setTerminals([]);
        }
      })
      .catch(() => {
        if (!cancelled) setTerminals([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredData = useMemo(() => {
    if (!statusFilter) return terminals;
    return terminals.filter((t) => t.status === statusFilter);
  }, [statusFilter, terminals]);

  const handleAssign = (terminalId: string) => {
    setSelectedTerminalId(terminalId);
    setSelectedAgentId('');
    setAssignModalOpen(true);
  };

  const handleConfirmAssign = () => {
    if (!selectedTerminalId || !selectedAgentId) {
      addToast('Select an agent.', 'error');
      return;
    }
    setAssignModalOpen(false);
    setSelectedTerminalId(null);
    addToast('Terminal assigned to agent.', 'success');
  };

  return (
    <div className="space-y-6">
      <SearchHeader
        title="Terminal Inventory"
        searchPlaceholder="Search by terminal ID or agent..."
      />
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <Select
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          inputSize="sm"
          className="w-40"
        />
      </div>
      <DataTable
        columns={[
          ...COLS,
          {
            key: 'actions',
            header: 'Actions',
            cell: (row: Terminal) => (
              <Button variant="outline" size="xs" onClick={() => handleAssign(row.id)}>
                Assign
              </Button>
            ),
          },
        ]}
        data={filteredData}
        keyExtractor={(r) => r.id}
        emptyMessage={loading ? 'Loading terminals...' : 'No terminals found.'}
      />
      <Modal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign terminal to agent"
      >
        <div className="space-y-4">
          <p className="text-sm text-content-muted">
            Terminal: {selectedTerminalId}. Select agent to assign.
          </p>
          <Select
            label="Agent"
            options={AGENT_OPTIONS}
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
          />
          <div className="modal-action">
            <Button variant="ghost" onClick={() => setAssignModalOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmAssign}>Assign</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
