'use client';

/**
 * IssueVoucherModal – Single and batch voucher issuance (PRD §3.2.3).
 * Location: src/components/ketchup/issue-voucher-modal.tsx
 */

import { useState, useMemo } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FileUpload } from '@/components/ui/file-upload';
import { DataTable } from '@/components/ui/data-table';
import { Tabs } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';

export interface IssueVoucherModalProps {
  open: boolean;
  onClose: () => void;
}

const AMOUNT_OPTIONS = [
  { value: '300', label: 'NAD 300' },
  { value: '500', label: 'NAD 500' },
  { value: '750', label: 'NAD 750' },
  { value: '1000', label: 'NAD 1,000' },
];

interface BatchRow {
  id: string;
  beneficiaryId: string;
  amount: string;
}

const BATCH_COLS = [
  { key: 'beneficiaryId', header: 'Beneficiary ID' },
  { key: 'amount', header: 'Amount (NAD)' },
];

export function IssueVoucherModal({ open, onClose }: IssueVoucherModalProps) {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [beneficiarySearch, setBeneficiarySearch] = useState('');
  const [amount, setAmount] = useState('');
  const [batchRows, setBatchRows] = useState<BatchRow[]>([]);
  const [batchFile, setBatchFile] = useState<File | null>(null);

  const tabs = [
    {
      key: 'single',
      label: 'Single',
      content: (
        <div className="space-y-4">
          <Input
            label="Beneficiary (search by name or ID)"
            value={beneficiarySearch}
            onChange={(e) => setBeneficiarySearch(e.target.value)}
            placeholder="e.g. John Doe or 1"
          />
          <Select
            label="Amount"
            options={AMOUNT_OPTIONS}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Select amount"
          />
          <div className="modal-action justify-end">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              onClick={() => {
                if (!beneficiarySearch.trim() || !amount) {
                  addToast('Enter beneficiary and amount.', 'error');
                  return;
                }
                addToast(`Voucher issued: ${amount} NAD for ${beneficiarySearch}.`, 'success');
                setBeneficiarySearch('');
                setAmount('');
                onClose();
              }}
            >
              Issue voucher
            </Button>
          </div>
        </div>
      ),
    },
    {
      key: 'batch',
      label: 'Batch',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-content-muted">
            CSV format: beneficiary_id, amount (one per line).
          </p>
          <FileUpload
            accept=".csv"
            onFiles={(files) => {
              const file = files[0];
              if (!file) return;
              setBatchFile(file);
              const reader = new FileReader();
              reader.onload = () => {
                const text = String(reader.result);
                const lines = text.trim().split(/\r?\n/).slice(1);
                const rows: BatchRow[] = lines.map((line, i) => {
                  const [beneficiaryId, amt] = line.split(',').map((s) => s.trim());
                  return { id: `batch-${i}`, beneficiaryId: beneficiaryId ?? '', amount: amt ?? '' };
                }).filter((r) => r.beneficiaryId && r.amount);
                setBatchRows(rows);
              };
              reader.readAsText(file);
            }}
            label="Upload CSV"
          />
          {batchRows.length > 0 && (
            <>
              <p className="text-sm font-medium">Preview ({batchRows.length} rows)</p>
              <DataTable
                columns={BATCH_COLS}
                data={batchRows.slice(0, 10)}
                keyExtractor={(r) => r.id}
                emptyMessage="No rows."
              />
              {batchRows.length > 10 && (
                <p className="text-sm text-content-muted">… and {batchRows.length - 10} more</p>
              )}
              <div className="modal-action justify-end">
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button
                  onClick={() => {
                    addToast(`Batch submitted: ${batchRows.length} vouchers.`, 'success');
                    setBatchRows([]);
                    setBatchFile(null);
                    onClose();
                  }}
                >
                  Confirm batch
                </Button>
              </div>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Issue voucher">
      <Tabs tabs={tabs} value={activeTab} onChange={(key) => setActiveTab(key as 'single' | 'batch')} variant="bordered" />
    </Modal>
  );
}
