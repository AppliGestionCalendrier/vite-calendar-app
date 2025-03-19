import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGoogleAuth } from "../context/GoogleAuthProvider";
import { getCalendars, Calendar } from '../services/fakeApi';
import '../css/CalendarList.css';

const CalendarList: React.FC = () => {
    const {
        isSignedIn,
        calendars: googleCalendars,
        loading,
        error,
        handleSignIn,
        handleSignOut,
        fetchCalendars
    } = useGoogleAuth();

    const [localCalendars, setLocalCalendars] = useState<Calendar[]>([]);
    const [icalUrl, setIcalUrl] = useState<string>('');

    useEffect(() => {
        getCalendars()
            .then((data: Calendar[]) => {
                setLocalCalendars(data);
            })
            .catch((err: unknown) => {
                console.error("Erreur lors du chargement des calendriers iCal:", err);
            });

        if (isSignedIn) {
            fetchCalendars();
        }
    }, [isSignedIn]);

    const handleAddICal = async (): Promise<void> => {
        if (icalUrl.trim() !== '') {
            try {
                const response = await fetch(
                    `https://vite-calendar-app-seven.vercel.app/api/events?url=${encodeURIComponent(icalUrl)}`
                );

                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération du nom du calendrier');
                }

                const data: { calendarName?: string } = await response.json();
                const newCalendar: Calendar = {
                    id: Date.now().toString(),
                    name: data.calendarName || 'Calendrier sans nom',
                    url: icalUrl,
                    type: 'ical',
                };

                const updatedCalendars: Calendar[] = [...localCalendars, newCalendar];
                setLocalCalendars(updatedCalendars);
                localStorage.setItem('calendars', JSON.stringify(updatedCalendars));
                setIcalUrl('');
            } catch (error: unknown) {
                console.error("Erreur lors de l'ajout du calendrier iCal :", error);
                alert("Impossible d'ajouter le calendrier. Vérifiez l'URL.");
            }
        }
    };

    const handleDeleteCalendar = async (id: string, type?: string): Promise<void> => {
        if (type === "ical") {
            // Supprimer un calendrier iCal (localStorage)
            const updatedCalendars: Calendar[] = localCalendars.filter(
                (calendar: Calendar) => calendar.id !== id
            );
            setLocalCalendars(updatedCalendars);
            localStorage.setItem("calendars", JSON.stringify(updatedCalendars));
        }
    };

    return (
        <div className="calendar-page">
            <div className="calendar-container">
                <h1 className="calendar-title">Calendriers Connectés</h1>

                {error && <p className="text-danger">{error}</p>}

                <div className="add-calendar-form">
                    <input
                        type="text"
                        className="add-calendar-input"
                        placeholder="Entrez l'URL iCal"
                        value={icalUrl}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setIcalUrl(e.target.value)}
                    />
                    <button className="add-calendar-button button-primary" onClick={handleAddICal}>
                        Ajouter
                    </button>
                </div>

                <div className="google-calendar-section">
                    {isSignedIn ? (
                        <>
                            <button className="add-calendar-button button-danger mt-3 mb-3" onClick={handleSignOut}>
                                Se déconnecter
                            </button>
                            <button
                                className="add-calendar-button button-primary mt-3 mb-3 ms-5"
                                onClick={fetchCalendars}
                                disabled={loading}
                            >
                                {loading ? "Chargement..." : "Recharger les agendas Google"}
                            </button>
                        </>
                    ) : (
                        <button className="add-calendar-button button-success mt-3 mb-3" onClick={handleSignIn}>
                            Se connecter avec Google
                        </button>
                    )}
                </div>

                <h2>Mes Calendriers</h2>
                <div className="calendar-list">
                    {loading ? (
                        <p>Chargement des calendriers...</p>
                    ) : (
                        <>
                            {/* Affichage des calendriers iCal */}
                            {localCalendars.length > 0 ? (
                                localCalendars.map((calendar: Calendar) => (
                                    <div
                                        key={calendar.id}
                                        className="calendar-list-item d-flex justify-content-between align-items-center w-100"
                                    >
                                        <Link
                                            to={`/calendars/${calendar.id}`}
                                            className="calendar-name text-decoration-none text-light w-75 text-truncate"
                                        >
                                            📅 {calendar.name}
                                        </Link>
                                        <button
                                            className="btn btn-danger btn-sm trash"
                                            onClick={() => handleDeleteCalendar(calendar.id, "ical")}
                                        >
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p>Aucun calendrier iCal enregistré.</p>
                            )}

                            {/* Affichage des calendriers Google */}
                            {googleCalendars.length > 0 ? (
                                googleCalendars.map((calendar) => (
                                    <div
                                        key={calendar.id}
                                        className="calendar-list-item d-flex justify-content-between align-items-center w-100"
                                    >
                                        <Link
                                            to={`/calendars/${calendar.id}?type=google`}
                                            className="calendar-name text-decoration-none text-light w-75 text-truncate"
                                        >
                                            📅 {calendar.summary} (Google)
                                        </Link>
                                        {/* Désactiver ou masquer le bouton de suppression */}
                                        <button className="btn btn-secondary btn-sm trash" disabled>
                                            <i className="bi bi-lock"></i>
                                        </button>
                                    </div>
                                ))
                            ) : (
                                isSignedIn && <p>Aucun agenda Google trouvé.</p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalendarList;
