'use client';

/**
 * Terminal Inventory – Ketchup Portal (PRD §3.2.4).
 * List of all POS terminals (FP09); status, assigned agent, last ping; assign terminal to agent.
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { SearchHeader } from '@/components/ui/search-header';
import { DataTable } from '@/components/ui/data-table';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';

const SAMPLE_TERMINALS = [
  { id: 't1', model: 'FP09', status: 'active', assignedAgent: 'Windhoek Mini Market', lastPing: '2025-02-22 14:30', softwareVersion: '2.1.0' },
  { id: 't2', model: 'FP09', status: 'active', assignedAgent: 'Swakop Spar', lastPing: '2025-02-22 14:28', softwareVersion: '2.1.0' },
  { id: 't3', model: 'FP09', status: 'offline', assignedAgent: '—', lastPing: '2025-02-20 10:00', softwareVersion: '2.0.9' },
  { id: 't4', model: 'FP09', status: 'maintenance', assignedAgent: '—', lastPing: '2025-02-21 09:00', softwareVersion: '2.1.0' },
];

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

  const filteredData = useMemo(() => {
    if (!statusFilter) return SAMPLE_TERMINALS;
    return SAMPLE_TERMINALS.filter((t) => t.status === statusFilter);
  }, [statusFilter]);

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
            cell: (row: (typeof SAMPLE_TERMINALS)[0]) => (
              <Button variant="outline" size="xs" onClick={() => handleAssign(row.id)}>
                Assign
              </Button>
            ),
          },
        ]}
        data={filteredData}
        keyExtractor={(r) => r.id}
        emptyMessage="No terminals."
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
