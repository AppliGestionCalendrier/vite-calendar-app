import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Modal, Form } from 'react-bootstrap';
import '../css/CalendarDetail.css';

interface CalendarDetailParams {
    id: string;
    [key: string]: string | undefined;
}

interface Event {
    uid: string;
    summary: string;
    startDate: string;
    endDate: string;
    group?: string;
}

const CalendarDetail: React.FC = () => {
    const { id } = useParams<CalendarDetailParams>();
    const [calendarName, setCalendarName] = useState<string>('');
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // États pour le tri et la recherche
    const [sortKey, setSortKey] = useState<'date' | 'alphabetical'>('date');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // États pour la gestion du modal (création / édition)
    const [showModal, setShowModal] = useState(false);
    const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
    const [isCreating, setIsCreating] = useState<boolean>(false);
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [newGroupName, setNewGroupName] = useState<string>('');

    // Fonction pour extraire le nom du module depuis le titre de l’événement
    const extractModule = (title: string): string => {
        // On suppose que le module se trouve avant un ':' ou un '-'
        const regex = /^([^:-]+)[ :-]/;
        const match = title.match(regex);
        return match ? match[1].trim() : '';
    };

    useEffect(() => {
        console.log("ID récupéré :", id);

        const storedCalendars = localStorage.getItem('calendars');
        if (!storedCalendars) {
            setError("Aucun calendrier trouvé");
            setLoading(false);
            return;
        }

        const calendars = JSON.parse(storedCalendars);
        const calendar = calendars.find((cal: any) => cal.id === id);
        if (!calendar || !calendar.url) {
            setError("Calendrier introuvable ou URL manquante");
            setLoading(false);
            return;
        }

        // Récupération des événements depuis le backend et ajout du groupe extrait si absent
        fetch(`http://localhost:3000/api/events?url=${encodeURIComponent(calendar.url)}`)
            .then(response => response.json())
            .then(data => {
                setCalendarName(data.calendarName);
                const eventsWithGroup = data.events.map((ev: Event) => ({
                    ...ev,
                    group: ev.group || extractModule(ev.summary)
                }));
                setEvents(eventsWithGroup);
                setLoading(false);
            })
            .catch(err => {
                console.error("Erreur de requête :", err);
                setError("Erreur lors de la récupération des événements");
                setLoading(false);
            });
    }, [id]);

    // Tri des événements
    const sortedEvents = () => {
        let sorted = [...events];
        if (sortKey === 'date') {
            sorted.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        } else if (sortKey === 'alphabetical') {
            sorted.sort((a, b) => a.summary.localeCompare(b.summary));
        }
        return sorted;
    };

    // Filtrage des événements selon la recherche.
    // Chaque mot (séparé par un espace) doit être présent dans le résumé ou le groupe (logique AND).
    const filteredEvents = sortedEvents().filter(ev => {
        if (!searchQuery.trim()) return true;
        const tokens = searchQuery.toLowerCase().split(' ').filter(token => token !== '');
        const text = (ev.summary + ' ' + (ev.group || '')).toLowerCase();
        return tokens.every(token => text.includes(token));
    });

    const handleEditEvent = (event: Event) => {
        setCurrentEvent(event);
        setSelectedGroup(event.group || '');
        setNewGroupName('');
        setIsCreating(false);
        setShowModal(true);
    };

    const handleCreateEvent = () => {
        const today = new Date().toISOString().split('T')[0];
        const newEvent: Event = {
            uid: Date.now().toString(),
            summary: '',
            startDate: `${today}T09:00`,
            endDate: `${today}T10:00`,
            group: ''
        };
        setCurrentEvent(newEvent);
        setSelectedGroup('');
        setNewGroupName('');
        setIsCreating(true);
        setShowModal(true);
    };

    const saveEventChanges = () => {
        if (currentEvent) {
            let updatedGroup = currentEvent.group;
            if (selectedGroup === 'new') {
                if (newGroupName.trim() !== '') {
                    updatedGroup = newGroupName;
                }
            } else {
                updatedGroup = selectedGroup;
            }
            const updatedEvent = { ...currentEvent, group: updatedGroup };

            if (isCreating) {
                setEvents(prev => [...prev, updatedEvent]);
            } else {
                setEvents(prev => prev.map(ev => ev.uid === updatedEvent.uid ? updatedEvent : ev));
            }
            setShowModal(false);
            setCurrentEvent(null);
        }
    };

    if (loading)
        return <div className="calendar-page">Chargement...</div>;
    if (error)
        return <div className="calendar-page text-danger">{error}</div>;

    return (
        <div className="calendar-page">
            <div className="calendar-container">
                <h2 className="calendar-title">{calendarName || "Calendrier"}</h2>

                {/* Bouton pour créer un nouvel événement */}
                <div className="mb-3 d-flex justify-content-between">
                    <Button className="button-success mb-3" onClick={handleCreateEvent}>
                        Créer un événement
                    </Button>
                    <Button className="button-secondary mb-3" onClick={() => window.location.href = "http://localhost:3001"}>
                        Retour aux calendriers
                    </Button>
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
                </div>

                {/* Liste des événements */}
                {filteredEvents.length === 0 ? (
                    <p className="event-meta">Aucun événement trouvé.</p>
                ) : (
                    <ul className="event-list">
                        {filteredEvents.map(event => (
                            <li key={event.uid} className="event-item d-flex justify-content-between align-items-center">
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
                                    <br />
                                    <span className="event-meta">Groupe : {event.group || '-'}</span>
                                </div>
                                <Button className="button-primary" size="sm" onClick={() => handleEditEvent(event)}>
                                    Modifier
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}

                {/* Modal pour création/édition d'événement */}
                <Modal show={showModal} onHide={() => setShowModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>{isCreating ? 'Créer un événement' : "Modifier l'événement"}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {currentEvent && (
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Label>Titre</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={currentEvent.summary}
                                        onChange={(e) =>
                                            setCurrentEvent({ ...currentEvent, summary: e.target.value })
                                        }
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Date de début</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={currentEvent.startDate.split('T')[0]}
                                        onChange={(e) => {
                                            const datePart = e.target.value;
                                            const timePart = currentEvent.startDate.split('T')[1] || '09:00';
                                            setCurrentEvent({ ...currentEvent, startDate: `${datePart}T${timePart}` });
                                        }}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Heure de début</Form.Label>
                                    <Form.Control
                                        type="time"
                                        value={(currentEvent.startDate.split('T')[1] || '09:00').substring(0, 5)}
                                        onChange={(e) => {
                                            const timePart = e.target.value;
                                            const datePart = currentEvent.startDate.split('T')[0];
                                            setCurrentEvent({ ...currentEvent, startDate: `${datePart}T${timePart}` });
                                        }}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Date de fin</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={currentEvent.endDate.split('T')[0]}
                                        onChange={(e) => {
                                            const datePart = e.target.value;
                                            const timePart = currentEvent.endDate.split('T')[1] || '10:00';
                                            setCurrentEvent({ ...currentEvent, endDate: `${datePart}T${timePart}` });
                                        }}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Heure de fin</Form.Label>
                                    <Form.Control
                                        type="time"
                                        value={(currentEvent.endDate.split('T')[1] || '10:00').substring(0, 5)}
                                        onChange={(e) => {
                                            const timePart = e.target.value;
                                            const datePart = currentEvent.endDate.split('T')[0];
                                            setCurrentEvent({ ...currentEvent, endDate: `${datePart}T${timePart}` });
                                        }}
                                    />
                                </Form.Group>
                            </Form>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button className="button-primary" variant="secondary" onClick={() => setShowModal(false)}>
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