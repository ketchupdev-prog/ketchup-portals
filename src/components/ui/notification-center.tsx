'use client';

/**
 * NotificationCenter – Dropdown list of in-app notifications with unread count.
 * Fetches from GET /api/v1/notifications?user_id=…; marks read via PATCH on click.
 * Location: src/components/ui/notification-center.tsx
 * PRD §7.4: In-app notification center in header.
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationBell } from '@/components/ui/notification-bell';

const DEMO_USER_ID = process.env.NEXT_PUBLIC_DEMO_PORTAL_USER_ID ?? '';

export interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!DEMO_USER_ID) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/notifications?user_id=${encodeURIComponent(DEMO_USER_ID)}&limit=20`);
      const json = await res.json();
      if (res.ok) {
        setItems(json.data ?? []);
        setUnreadCount(json.meta?.unread_count ?? 0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && DEMO_USER_ID) fetchNotifications();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const router = useRouter();
  const markRead = async (id: string) => {
    try {
      await fetch(`/api/v1/notifications/${id}`, { method: 'PATCH' });
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  const handleItemClick = (n: NotificationItem) => {
    if (!n.read) markRead(n.id);
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <NotificationBell
        count={unreadCount}
        onClick={() => setOpen(!open)}
        ariaLabel="Notifications"
      />
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-base-300 bg-base-100 shadow-xl">
          <div className="border-b border-base-300 px-3 py-2 font-medium text-base-content">
            Notifications
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-content-muted text-sm">Loading…</p>
            ) : !DEMO_USER_ID ? (
              <p className="p-4 text-content-muted text-sm">Set NEXT_PUBLIC_DEMO_PORTAL_USER_ID to see notifications.</p>
            ) : items.length === 0 ? (
              <p className="p-4 text-content-muted text-sm">No notifications.</p>
            ) : (
              <ul className="divide-y divide-base-200">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleItemClick(n)}
                      className={`w-full px-3 py-2 text-left hover:bg-base-200 ${n.read ? '' : 'bg-primary/5'}`}
                    >
                      <p className="font-medium text-sm text-base-content">{n.title}</p>
                      {n.body && <p className="text-content-muted text-xs mt-0.5">{n.body}</p>}
                      <p className="text-content-muted text-xs mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
