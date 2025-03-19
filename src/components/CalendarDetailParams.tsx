import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Button, Modal, Form } from 'react-bootstrap';
import '../css/CalendarDetail.css';
import CreateEvent from './CreateEvent';
import { useGoogleAuth } from "../context/GoogleAuthProvider";
import { Event } from '../types/event.types';

interface CalendarDetailRouteParams extends Record<string, string | undefined> {
    id: string;
}

export interface Calendar {
    id: string;
    summary: string;
    name: string;
    url?: string;
}

const CalendarDetail: React.FC = () => {
    const { id } = useParams<CalendarDetailRouteParams>();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const calendarType = queryParams.get("type") ?? "";
    const { fetchEvents, loading: googleLoading, error: googleError } = useGoogleAuth();


    const [calendarName, setCalendarName] = useState<string>('Calendrier');
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    const [sortKey, setSortKey] = useState<'date' | 'alphabetical'>('date');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showModal, setShowModal] = useState<boolean>(false);
    const [currentEvent, setCurrentEvent] = useState<Event | null>(null);

    useEffect(() => {
        console.log("ID:", id);
        console.log("calendarType:", calendarType);
        if (!id || calendarType === "") {
            setError('Détails du calendrier manquants');
            setLoading(false);
            return;
        }

        if (calendarType === "ical") {
            fetchICalEvents(id as string);
        } else if (calendarType === "google") {
            const storedEvents = localStorage.getItem(`google-events-${id}`);
            if (storedEvents) {
                setCalendarName(`Google Calendar: ${id}`);
                setEvents(JSON.parse(storedEvents));
                setLoading(false);
            } else {
                fetchGoogleEvents(id as string);
            }
        }
    }, [id, calendarType]);

    const fetchICalEvents = async (calendarId: string) => {
        const storedCalendars = localStorage.getItem('calendars');
        if (!storedCalendars) {
            setError("Aucun calendrier trouvé");
            setLoading(false);
            return;
        }

        const calendars = JSON.parse(storedCalendars);
        const calendar = calendars.find((cal: any) => cal.id === calendarId);
        if (!calendar || !calendar.url) {
            setError("Calendrier introuvable ou URL manquante");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`https://vite-calendar-app-seven.vercel.app/api/events?url=${encodeURIComponent(calendar.url)}`);
            const data = await response.json();
            setCalendarName(data.calendarName);
            setEvents(data.events || []);
            setLoading(false);
        } catch (err) {
            console.error("❌ Erreur iCal :", err);
            setError("Erreur lors de la récupération des événements iCal.");
            setLoading(false);
        }
    };

    const fetchGoogleEvents = async (calendarId: string) => {
        setLoading(true);
        try {
            const eventsFromGoogle = await fetchEvents(calendarId);
            setCalendarName(`Google Calendar: ${calendarId}`);
            setEvents(eventsFromGoogle);

            // 🔹 Sauvegarde les événements localement
            localStorage.setItem(`google-events-${calendarId}`, JSON.stringify(eventsFromGoogle));
        } catch (err) {
            setError("Erreur lors de la récupération des événements Google.");
        } finally {
            setLoading(false);
        }
    };

    const sortedEvents = (): Event[] => {
        let sorted = [...events];
        if (sortKey === 'date') {
            sorted.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        } else if (sortKey === 'alphabetical') {
            sorted.sort((a, b) => a.summary.localeCompare(b.summary));
        }
        return sorted;
    };

    const filteredEvents = sortedEvents().filter(ev => {
        if (!searchQuery.trim()) return true;
        const tokens = searchQuery.toLowerCase().split(' ').filter(token => token !== '');
        const text = ev.summary.toLowerCase();
        return tokens.every(token => text.includes(token));
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

    if (loading || googleLoading) return <div className="calendar-page">Chargement...</div>;
    if (error || googleError) return <div className="calendar-page text-danger">{error || googleError}</div>;
    if (loading || googleLoading) {
        return <div className="calendar-page">Chargement des événements...</div>;
    }

    const handleEventClick = (eventTitle: string) => {
        setSearchQuery(eventTitle);
    };


    return (
        <div className="calendar-page">
            <div className="calendar-container">
                <h2 className="calendar-title">{calendarName}</h2>
                <div className="mb-3 d-flex justify-content-between">
                    <CreateEvent onEventCreated={(event: Event) => setEvents([...events, event])} />
                    <div className="mt-4">
                        <Button className="button-secondary mb-3" onClick={() => window.history.back()}>
                            Retour aux calendriers
                        </Button>
                    </div>
                </div>

                {/* Filtres et tris */}
                <div className="row mb-3">
                    <div className="col-md-6 mb-2">
                        <Form.Select
                            className="select-custom"
                            value={sortKey}
                            onChange={(e) => setSortKey(e.target.value as 'date' | 'alphabetical')}
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
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-bar"
                            />
                        </Form.Group>
                    </div>
                    {calendarType === "google" && (
                        <Button className="button-secondary mb-3" onClick={() => fetchGoogleEvents(id)}>
                            🔄 Actualiser les événements
                        </Button>
                    )}
                </div>

                {/* Liste des événements */}
                {filteredEvents.length === 0 ? (
                    <p className="event-meta">Aucun événement trouvé.</p>
                ) : (
                    <ul className="event-list">
                        {filteredEvents.map(event => (
                            <li
                                key={event.uid || event.id}
                                className="event-item d-flex justify-content-between align-items-center"
                                onClick={() => handleEventClick(event.summary)} // 🔹 Ajout de l'événement `onClick`
                                style={{ cursor: "pointer" }} // 🔹 Indique que l'événement est cliquable
                            >
                                <div>
                                    <strong className="event-icon">📅 {event.summary}</strong>
                                    <br />
                                    <span className="event-meta">
                    Début : {new Date(event.startDate).toLocaleDateString()} à{" "}
                                        {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        <br />
                    Fin : {new Date(event.endDate).toLocaleDateString()} à{" "}
                                        {new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default CalendarDetail;
