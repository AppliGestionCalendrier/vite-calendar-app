import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCalendars, Calendar } from '../services/fakeApi';
import '../css/CalendarList.css';

const CalendarList: React.FC = () => {
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [icalUrl, setIcalUrl] = useState('');
    const [googleCalendarUrl, setGoogleCalendarUrl] = useState('');

    useEffect(() => {
        getCalendars()
            .then(data => {
                setCalendars(data);
                setLoading(false);
            })
            .catch(err => {
                setError('Erreur lors du chargement des calendriers');
                setError(err);
                setLoading(false);
            });
    }, []);

    // Ajout d'un calendrier via une URL iCal
    const handleAddICal = async () => {
        if (icalUrl.trim() !== '') {
            try {
                const response = await fetch(`https://ton-projet.vercel.app/api/events?url=${encodeURIComponent(icalUrl)}`);
                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération du nom du calendrier');
                }
                const data = await response.json();

                const newCalendar: Calendar = {
                    id: Date.now().toString(),
                    name: data.calendarName || "Calendrier sans nom",
                    url: icalUrl,
                };

                const updatedCalendars = [...calendars, newCalendar];
                setCalendars(updatedCalendars);
                localStorage.setItem('calendars', JSON.stringify(updatedCalendars));
                setIcalUrl('');
            } catch (error) {
                console.error("Erreur lors de l'ajout du calendrier :", error);
                alert("Impossible d'ajouter le calendrier. Vérifiez l'URL.");
            }
        }
    };

    // Synchronisation d'un agenda Google via une URL ou un ID
    const handleSyncGoogle = () => {
        if (googleCalendarUrl.trim() !== '') {
            const newCalendar: Calendar = {
                id: Date.now().toString(),
                name: `Google Calendar: ${googleCalendarUrl}`,
            };
            const updatedCalendars = [...calendars, newCalendar];
            setCalendars(updatedCalendars);
            localStorage.setItem('calendars', JSON.stringify(updatedCalendars));
            setGoogleCalendarUrl('');
        }
    };

    const handleDeleteCalendar = (id: string) => {
        const updatedCalendars = calendars.filter(calendar => calendar.id !== id);
        setCalendars(updatedCalendars);
        localStorage.setItem('calendars', JSON.stringify(updatedCalendars));
    };

    if (loading) return <div className="calendar-page">Chargement...</div>;
    if (error) return <div className="calendar-page text-danger">{error}</div>;

    return (
        <div className="calendar-page">
            <div className="calendar-container">
                <h1 className="calendar-title">Calendriers Connectés</h1>

                {/* Formulaire d'ajout iCal */}
                <div className="add-calendar-form">
                    <input
                        type="text"
                        className="add-calendar-input"
                        placeholder="Entrez l'URL iCal"
                        value={icalUrl}
                        onChange={(e) => setIcalUrl(e.target.value)}
                    />
                    <button className="add-calendar-button button-primary" onClick={handleAddICal}>
                        Ajouter
                    </button>
                </div>

                {/* Formulaire d'ajout Google Calendar */}
                <div className="add-calendar-form">
                    <input
                        type="text"
                        className="add-calendar-input"
                        placeholder="Entrez l'URL ou l'ID du Google Calendar"
                        value={googleCalendarUrl}
                        onChange={(e) => setGoogleCalendarUrl(e.target.value)}
                    />
                    <button className="add-calendar-button button-success" onClick={handleSyncGoogle}>
                        Synchroniser
                    </button>
                </div>

                <div className={"calendar-list"}>
                    <h2>Mes Calendriers</h2>
                    <div className="calendar-list">
                        {calendars.length > 0 ? (
                            calendars.map(calendar => (
                                <div key={calendar.id} className="calendar-list-item d-flex justify-content-between align-items-center w-100">
                                    <Link to={`/calendars/${calendar.id}`} className="calendar-name text-decoration-none text-light w-75 text-truncate">
                                        📅 {calendar.name}
                                    </Link>
                                    <button
                                        className="btn btn-danger btn-sm trash"
                                        onClick={() => handleDeleteCalendar(calendar.id)}
                                    >
                                        <i className="bi bi-trash"></i>
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p>Aucun calendrier enregistré.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarList;
//hello