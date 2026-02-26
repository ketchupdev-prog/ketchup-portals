'use client';

import { useState, useCallback, type ChangeEvent, type DragEvent } from 'react';
import { cn } from '@/lib/utils';

export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSizeBytes?: number;
  onFiles?: (files: File[]) => void;
  label?: string;
  error?: string;
  className?: string;
}

export function FileUpload({
  accept = '.csv,.pdf',
  multiple = false,
  maxSizeBytes,
  onFiles,
  label,
  error,
  className = '',
}: FileUploadProps) {
  const [drag, setDrag] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const validate = useCallback(
    (files: FileList | null): File[] => {
      if (!files || files.length === 0) return [];
      const list = Array.from(files);
      if (!multiple && list.length > 1) {
        setFileError('Only one file allowed');
        return [];
      }
      if (maxSizeBytes != null) {
        const over = list.find((f) => f.size > maxSizeBytes);
        if (over) {
          setFileError('File exceeds max size');
          return [];
        }
      }
      setFileError(null);
      return list;
    },
    [multiple, maxSizeBytes]
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const list = validate(e.target.files);
    if (list.length > 0) onFiles?.(list);
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDrag(false);
    const list = validate(e.dataTransfer.files);
    if (list.length > 0) onFiles?.(list);
  };

  const err = error ?? fileError;

  return (
    <div className={cn('form-control w-full', className)}>
      {label != null && <label className="label"><span className="label-text">{label}</span></label>}
      <div
        role="button"
        tabIndex={0}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onClick={() => document.getElementById('file-upload-input')?.click()}
        onKeyDown={(e) => e.key === 'Enter' && document.getElementById('file-upload-input')?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer',
          drag ? 'border-primary bg-primary/5' : 'border-base-300',
          err && 'border-error'
        )}
        aria-label="Upload file"
      >
        <input id="file-upload-input" type="file" accept={accept} multiple={multiple} onChange={handleChange} className="hidden" />
        <p className="text-sm text-content-muted">Drag and drop or click. Accepted: {accept}</p>
      </div>
      {err != null && <p className="label text-error text-sm mt-0.5">{err}</p>}
    </div>
  );
}
