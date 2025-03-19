import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Form, ButtonGroup } from 'react-bootstrap';
import 'react-datepicker/dist/react-datepicker.css';
import '../css/CalendarDetail.css';
import CreateEvent from './CreateEvent';
import { Event } from '../types/event.types';
import EventCalendar from './EventCalendar';
import { useLocation } from 'react-router-dom';
import { useGoogleAuth } from "../context/GoogleAuthProvider";

import 'devextreme/dist/css/dx.light.css';

interface CalendarDetailRouteParams extends Record<string, string | undefined> {
  id: string;
}

export interface Calendar {
  id: string;
  name: string;
  url?: string;
}

const CalendarDetail: React.FC = () => {
  const { id } = useParams<CalendarDetailRouteParams>();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const calendarType = queryParams.get("type") ?? "";
  const { fetchEvents, loading: googleLoading, error: googleError } = useGoogleAuth();

  const [calendarName, setCalendarName] = useState<string>('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [sortKey, setSortKey] = useState<'date' | 'alphabetical'>('date');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    if (searchQuery.trim() !== '') {
      setViewMode('list');
    }
  }, [searchQuery]);

  useEffect(() => {
    if (!id || calendarType === "") {
      setError('Détails du calendrier manquants');
      setLoading(false);
      return;
    }

    if (calendarType === "ical") {
      const storedCalendars = localStorage.getItem('calendars');
      if (!storedCalendars) {
        setError("Aucun calendrier trouvé");
        setLoading(false);
        return;
      }

      const calendars: Calendar[] = JSON.parse(storedCalendars);
      const calendar = calendars.find(cal => cal.id === id);
      if (!calendar || !calendar.url) {
        setError("Calendrier introuvable ou URL manquante");
        setLoading(false);
        return;
      }

      fetch(
          `https://vite-calendar-app-seven.vercel.app/api/events?url=${encodeURIComponent(calendar.url)}`
      )
          .then((response: Response) => response.json())
          .then((data: { calendarName: string; events: Event[] }) => {
            setCalendarName(data.calendarName);
            setEvents(data.events);
            setLoading(false);
          })
          .catch((err: unknown) => {
            console.error('Erreur de requête :', err);
            setError('Erreur lors de la récupération des événements');
            setLoading(false);
          });

    } else if (calendarType === "google") {
      setLoading(true);
      fetchEvents(id).then((eventsFromGoogle: Event[]) => {
        setCalendarName(`Google Calendar: ${id}`);
        setEvents(eventsFromGoogle);
        localStorage.setItem(`google-events-${id}`, JSON.stringify(eventsFromGoogle));
        console.log(eventsFromGoogle);
        setLoading(false);
      }).catch(() => {
        setError("Erreur lors de la récupération des événements Google.");
        setLoading(false);
      });
    }
  }, [id, calendarType]);

  const sortedEvents = (): Event[] => {
    const sorted: Event[] = [...events];
    if (sortKey === 'date') {
      sorted.sort(
          (a: Event, b: Event) => new Date(a.startDate || a.start?.dateTime || '').getTime() - new Date(b.startDate || b.start?.dateTime || '').getTime()
      );
    } else if (sortKey === 'alphabetical') {
      sorted.sort((a: Event, b: Event) => a.summary.localeCompare(b.summary));
    }
    return sorted;
  };

  const filteredEvents: Event[] = sortedEvents().filter((ev: Event) => {
    if (!searchQuery.trim()) return true;
    const tokens: string[] = searchQuery
        .toLowerCase()
        .split(' ')
        .filter((token: string) => token !== '');
    const text: string = ev.summary.toLowerCase();
    return tokens.every((token: string) => text.includes(token));
  });

  const aggregatedEvents = useMemo(() => {
    if (!searchQuery.trim()) return {};

    return filteredEvents.reduce((acc, event) => {
      const start = new Date(event.startDate || event.start?.dateTime || '').getTime();
      const end = new Date(event.endDate || event.end?.dateTime || '').getTime();

      if (isNaN(start) || isNaN(end)) return acc;

      const duration = (end - start) / (1000 * 60 * 60);

      if (acc[event.summary]) {
        acc[event.summary] += duration;
      } else {
        acc[event.summary] = duration;
      }
      return acc;
    }, {} as { [key: string]: number });
  }, [filteredEvents, searchQuery]);

  if (loading || googleLoading) return <div className="calendar-page">Chargement...</div>;
  if (error || googleError) return <div className="calendar-page text-danger">{error || googleError}</div>;

  return (
      <div className="calendar-page">
        <div className="calendar-container">
          <h2 className="calendar-title">{calendarName || 'Calendrier'}</h2>
          <div className="mb-3 d-flex justify-content-between">
            <CreateEvent onEventCreated={(event: Event) => setEvents([...events, event])} />
            <div className="mt-4">
              <Button
                  className="button-secondary mb-3"
                  onClick={() => {
                    window.location.href = '/';
                  }}
              >
                Retour aux calendriers
              </Button>
            </div>
          </div>
          <div className="row mb-3">
            <div className="col-md-6 mb-2">
              <Form.Select
                  className="select-custom"
                  value={sortKey}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>): void =>
                      setSortKey(e.target.value as 'date' | 'alphabetical')
                  }
              >
                <option value="date">Trier par date</option>
                <option value="alphabetical">Trier par ordre alphabétique</option>
              </Form.Select>
            </div>
            <div className="col-md-6 mb-2">
              <Form.Group>
                <Form.Control
                    type="text"
                    placeholder="Rechercher par mots-clés..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
                        setSearchQuery(e.target.value)
                    }
                    className="search-bar"
                />
              </Form.Group>
            </div>
          </div>
          {calendarType === "google" && (
              <Button
                  className="button-secondary mb-3"
                  onClick={() => fetchEvents(id).then((eventsFromGoogle: Event[]) => {
                    setEvents(eventsFromGoogle);
                    localStorage.setItem(`google-events-${id}`, JSON.stringify(eventsFromGoogle));
                  })}
              >
                🔄 Actualiser les événements
              </Button>
          )}
          <div className="view-selector mb-3 d-flex justify-content-end">
            <ButtonGroup>
              <Button
                  className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
              >
                <i className="bi bi-list"></i> Liste
              </Button>
              <Button
                  className={`view-button ${viewMode === 'calendar' ? 'active' : ''}`}
                  onClick={() => setViewMode('calendar')}
                  disabled={searchQuery.trim() !== ''}
                  title={searchQuery.trim() !== '' ? 'La vue calendrier est désactivée pendant la recherche' : 'Basculer en vue calendrier'}
              >
                <i className="bi bi-calendar3"></i> Calendrier
                {searchQuery.trim() !== '' && <span className="ms-2"><i className="bi bi-lock-fill"></i></span>}
              </Button>
            </ButtonGroup>
            {searchQuery.trim() !== '' &&
                <div className="filter-info ms-2">
                    <i className="bi bi-info-circle"></i> Vue liste activée pour le filtrage
                </div>
            }
          </div>

          {searchQuery.trim() && (
              <section className="event-summary mb-3">
                <table className="event-summary-table">
                  <thead>
                  <tr>
                    <th>Événement</th>
                    <th>Durée (heures)</th>
                  </tr>
                  </thead>
                  <tbody>
                  {Object.entries(aggregatedEvents).map(([summary, totalHours]) => (
                      <tr key={summary}>
                        <td>{summary}</td>
                        <td>{totalHours.toFixed(2)}</td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </section>
          )}

          {filteredEvents.length === 0 ? (
              <p className="event-meta">Aucun événement trouvé.</p>
          ) : viewMode === 'list' ? (
              <ul className="event-list">
                {filteredEvents.map((event: Event) => (
                    <li
                        key={event.uid}
                        className="event-item d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <strong className="event-icon">📅 {event.summary}</strong>
                        <br />
                        <span className="event-meta">
    Début : {new Date(event.startDate || event.start?.dateTime || '').toLocaleDateString()} à{' '}
                          {new Date(event.startDate || event.start?.dateTime || '').toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          <br />
    Fin : {new Date(event.endDate || event.end?.dateTime || '').toLocaleDateString()} à{' '}
                          {new Date(event.endDate || event.end?.dateTime || '').toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
  </span>
                      </div>
                    </li>
                ))}
              </ul>
          ) : (
              <EventCalendar events={filteredEvents} />
          )}
        </div>
      </div>
  );
};

export default CalendarDetail;