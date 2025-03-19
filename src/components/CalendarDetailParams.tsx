import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Modal, Form } from 'react-bootstrap';
import '../css/CalendarDetail.css';
import CreateEvent from './CreateEvent';
import { Event } from '../types/event.types';

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

    const [calendarName, setCalendarName] = useState<string>('');
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    const [sortKey, setSortKey] = useState<'date' | 'alphabetical'>('date');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showModal, setShowModal] = useState<boolean>(false);
    const [currentEvent, setCurrentEvent] = useState<Event | null>(null);

    useEffect(() => {
        if (!id) {
            setError('ID manquant');
            setLoading(false);
            return;
        }

        const storedCalendars: string | null = localStorage.getItem('calendars');
        if (!storedCalendars) {
            setError('Aucun calendrier trouvé');
            setLoading(false);
            return;
        }

        const calendars: Calendar[] = JSON.parse(storedCalendars);
        const calendar: Calendar | undefined = calendars.find((cal: Calendar) => cal.id === id);
        if (!calendar || !calendar.url) {
            setError('Calendrier introuvable ou URL manquante');
            setLoading(false);
            return;
        }

        fetch(
            `https://vite-calendar-app-seven.vercel.app/api/events?url=${encodeURIComponent(
                calendar.url
            )}`
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
    }, [id]);

    //     fetch(`http://localhost:3000/api/events?url=${encodeURIComponent(calendar.url)}`)
    //       .then((response: Response) => response.json())
    //       .then((data: { calendarName: string; events: Event[] }) => {
    //         setCalendarName(data.calendarName);
    //         setEvents(data.events);
    //         setLoading(false);
    //       })
    //       .catch((err: unknown) => {
    //         console.error('Erreur de requête :', err);
    //         setError('Erreur lors de la récupération des événements');
    //         setLoading(false);
    //       });
    //   }, [id]);

    const sortedEvents = (): Event[] => {
        const sorted: Event[] = [...events];
        if (sortKey === 'date') {
            sorted.sort(
                (a: Event, b: Event) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
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

    const handleEditEvent = (event: Event): void => {
        setCurrentEvent({
            ...event,
            startDate: new Date(event.startDate),
            endDate: new Date(event.endDate),
        });
        setShowModal(true);
    };

    const saveEventChanges = (): void => {
        if (currentEvent) {
            setEvents((prev: Event[]) =>
                prev.map((ev: Event) => (ev.uid === currentEvent.uid ? currentEvent : ev))
            );
            setShowModal(false);
            setCurrentEvent(null);
        }
    };

    if (loading) return <div className="calendar-page">Chargement...</div>;
    if (error) return <div className="calendar-page text-danger">{error}</div>;

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
                                window.location.href = 'http://localhost:3500';
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
                {filteredEvents.length === 0 ? (
                    <p className="event-meta">Aucun événement trouvé.</p>
                ) : (
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
                    Début : {new Date(event.startDate).toLocaleDateString()} à{' '}
                                        {new Date(event.startDate).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                        <br />
                    Fin : {new Date(event.endDate).toLocaleDateString()} à{' '}
                                        {new Date(event.endDate).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                  </span>
                                </div>
                                <Button className="button-primary" size="sm" onClick={() => handleEditEvent(event)}>
                                    Modifier
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
                <Modal show={showModal} onHide={() => setShowModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Modifier l'événement</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {currentEvent && (
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Label>Titre</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={currentEvent.summary}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
                                            setCurrentEvent({ ...currentEvent, summary: e.target.value })
                                        }
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Date de début</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={currentEvent.startDate.toISOString().split('T')[0]}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
                                            const datePart = e.target.value;
                                            const timePart =
                                                currentEvent.startDate.toISOString().split('T')[1] || '09:00';
                                            setCurrentEvent({
                                                ...currentEvent,
                                                startDate: new Date(`${datePart}T${timePart}`),
                                            });
                                        }}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Heure de début</Form.Label>
                                    <Form.Control
                                        type="time"
                                        value={(
                                            currentEvent.startDate.toISOString().split('T')[1] || '09:00'
                                        ).substring(0, 5)}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
                                            const timePart = e.target.value;
                                            const datePart = currentEvent.startDate.toISOString().split('T')[0];
                                            setCurrentEvent({
                                                ...currentEvent,
                                                startDate: new Date(`${datePart}T${timePart}`),
                                            });
                                        }}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Date de fin</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={currentEvent.endDate.toISOString().split('T')[0]}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
                                            const datePart = e.target.value;
                                            const timePart = currentEvent.endDate.toISOString().split('T')[1] || '10:00';
                                            setCurrentEvent({
                                                ...currentEvent,
                                                endDate: new Date(`${datePart}T${timePart}`),
                                            });
                                        }}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Heure de fin</Form.Label>
                                    <Form.Control
                                        type="time"
                                        value={(currentEvent.endDate.toISOString().split('T')[1] || '10:00').substring(
                                            0,
                                            5
                                        )}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
                                            const timePart = e.target.value;
                                            const datePart = currentEvent.endDate.toISOString().split('T')[0];
                                            setCurrentEvent({
                                                ...currentEvent,
                                                endDate: new Date(`${datePart}T${timePart}`),
                                            });
                                        }}
                                    />
                                </Form.Group>
                            </Form>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            className="button-primary"
                            variant="secondary"
                            onClick={() => setShowModal(false)}
                        >
                            Annuler
                        </Button>
                        <Button className="button-success" onClick={saveEventChanges}>
                            Sauvegarder
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </div>
    );
};

export default CalendarDetail;
