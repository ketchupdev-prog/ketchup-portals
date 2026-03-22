'use client';

import { useEffect, useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addDays, subDays, addMonths, isWithinInterval, isBefore } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { AlertBanner } from '@/components/admin/alert-banner';
import { getComplianceCalendar } from '@/lib/api/compliance';
import type { ComplianceEvent } from '@/lib/types/compliance';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

function getEventStyle(event: ComplianceEvent) {
  let backgroundColor = '#3b82f6';
  
  switch (event.type) {
    case 'KRI_REPORT':
      backgroundColor = '#8b5cf6';
      break;
    case 'INCIDENT_REPORT':
      backgroundColor = '#ef4444';
      break;
    case 'TRUST_RECONCILIATION':
      backgroundColor = '#10b981';
      break;
    case 'AUDIT_SUBMISSION':
      backgroundColor = '#f59e0b';
      break;
  }

  if (event.status === 'OVERDUE') {
    backgroundColor = '#dc2626';
  }

  return { style: { backgroundColor } };
}

export default function ComplianceCalendarPage() {
  const [events, setEvents] = useState<ComplianceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ComplianceEvent | null>(null);
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());

  const fetchEvents = async () => {
    const startDate = subDays(startOfMonth(date), 7).toISOString();
    const endDate = addDays(endOfMonth(date), 7).toISOString();

    const response = await getComplianceCalendar(startDate, endDate);
    if (response.success && response.data) {
      const formattedEvents = response.data.map((event) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
      setEvents(formattedEvents);
      setError(null);
    } else {
      setError(response.error || 'Failed to fetch calendar events');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [date]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const thirtyDaysLater = addDays(now, 30);
    
    return events
      .filter((event) => isWithinInterval(event.start, { start: now, end: thirtyDaysLater }))
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 10);
  }, [events]);

  const overdueEvents = events.filter((event) => event.status === 'OVERDUE');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-base-content">Compliance Calendar</h1>
        <p className="text-sm text-content-muted mt-1">Upcoming deadlines and compliance events</p>
      </div>

      {error && (
        <AlertBanner type="error" message={error} dismissible onDismiss={() => setError(null)} />
      )}

      {overdueEvents.length > 0 && (
        <AlertBanner
          type="error"
          title="Overdue Events"
          message={`${overdueEvents.length} event${overdueEvents.length > 1 ? 's are' : ' is'} overdue. Take immediate action.`}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card bg-base-200">
            <div className="card-body">
              <div className="h-[600px]">
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  view={view}
                  onView={setView}
                  date={date}
                  onNavigate={setDate}
                  eventPropGetter={getEventStyle}
                  onSelectEvent={(event) => setSelectedEvent(event)}
                  style={{ height: '100%' }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title text-lg">Event Types</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-purple-600"></div>
                  <span className="text-sm">KRI Report (Quarterly)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-600"></div>
                  <span className="text-sm">Incident Report (24h)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-600"></div>
                  <span className="text-sm">Trust Reconciliation (Daily)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-600"></div>
                  <span className="text-sm">Audit Submission (Annual)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title text-lg">Upcoming Events (30 Days)</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {upcomingEvents.length === 0 ? (
                  <p className="text-sm text-content-muted">No upcoming events</p>
                ) : (
                  upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 rounded bg-base-300 hover:bg-base-100 cursor-pointer transition-colors"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-content-muted">
                        {format(event.start, 'MMM d, yyyy HH:mm')}
                      </p>
                      {event.status && (
                        <span
                          className={`badge badge-xs mt-1 ${
                            event.status === 'OVERDUE'
                              ? 'badge-error'
                              : event.status === 'COMPLETED'
                                ? 'badge-success'
                                : 'badge-warning'
                          }`}
                        >
                          {event.status}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedEvent && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">{selectedEvent.title}</h3>
            <div className="py-4 space-y-3">
              <div>
                <p className="text-sm font-medium">Type</p>
                <p className="text-sm text-content-muted">
                  {selectedEvent.type.replace(/_/g, ' ')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Date & Time</p>
                <p className="text-sm text-content-muted">
                  {format(selectedEvent.start, 'MMMM d, yyyy HH:mm')}
                  {!selectedEvent.allDay &&
                    ` - ${format(selectedEvent.end, 'HH:mm')}`}
                </p>
              </div>
              {selectedEvent.description && (
                <div>
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-sm text-content-muted">{selectedEvent.description}</p>
                </div>
              )}
              {selectedEvent.status && (
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <span
                    className={`badge ${
                      selectedEvent.status === 'OVERDUE'
                        ? 'badge-error'
                        : selectedEvent.status === 'COMPLETED'
                          ? 'badge-success'
                          : 'badge-warning'
                    }`}
                  >
                    {selectedEvent.status}
                  </span>
                </div>
              )}
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setSelectedEvent(null)}>
                Close
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={() => setSelectedEvent(null)}>
            <button>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
}
