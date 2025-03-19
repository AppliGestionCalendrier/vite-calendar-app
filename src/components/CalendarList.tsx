import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCalendars, Calendar } from '../services/fakeApi';
import '../css/CalendarList.css';

const CalendarList: React.FC = () => {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [icalUrl, setIcalUrl] = useState<string>('');
  const [googleCalendarUrl, setGoogleCalendarUrl] = useState<string>('');

  useEffect(() => {
    getCalendars()
      .then((data: Calendar[]) => {
        setCalendars(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(`Erreur lors du chargement des calendriers: ${errorMessage}`);
        setLoading(false);
      });
  }, []);

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
        };
        const updatedCalendars: Calendar[] = [...calendars, newCalendar];
        setCalendars(updatedCalendars);
        localStorage.setItem('calendars', JSON.stringify(updatedCalendars));
        setIcalUrl('');
      } catch (error: unknown) {
        console.error("Erreur lors de l'ajout du calendrier :", error);
        alert("Impossible d'ajouter le calendrier. Vérifiez l'URL.");
      }
    }
  };

  const handleSyncGoogle = (): void => {
    if (googleCalendarUrl.trim() !== '') {
      const newCalendar: Calendar = {
        id: Date.now().toString(),
        name: `Google Calendar: ${googleCalendarUrl}`,
      };
      const updatedCalendars: Calendar[] = [...calendars, newCalendar];
      setCalendars(updatedCalendars);
      localStorage.setItem('calendars', JSON.stringify(updatedCalendars));
      setGoogleCalendarUrl('');
    }
  };

  const handleDeleteCalendar = (id: string): void => {
    const updatedCalendars: Calendar[] = calendars.filter(
      (calendar: Calendar) => calendar.id !== id
    );
    setCalendars(updatedCalendars);
    localStorage.setItem('calendars', JSON.stringify(updatedCalendars));
  };

  if (loading) return <div className="calendar-page"><div className="loading">Chargement des calendriers</div></div>;
  if (error) return <div className="calendar-page"><div className="calendar-container"><div className="text-danger"><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</div></div></div>;

  return (
    <div className="calendar-page">
      <div className="calendar-container">
        <h1 className="calendar-title">Calendriers Connectés</h1>
        
        {/* Formulaire iCal avec icône */}
        <div className="add-calendar-form">
          <input
            type="text"
            className="add-calendar-input"
            placeholder="Entrez l'URL iCal"
            value={icalUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setIcalUrl(e.target.value)}
          />
          <button className="add-calendar-button button-primary" onClick={handleAddICal}>
            <i className="bi bi-plus-lg"></i> Ajouter
          </button>
        </div>
        
        {/* Formulaire Google Calendar avec icône */}
        <div className="add-calendar-form">
          <input
            type="text"
            className="add-calendar-input"
            placeholder="Entrez l'URL ou l'ID du Google Calendar"
            value={googleCalendarUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
              setGoogleCalendarUrl(e.target.value)
            }
          />
          <button className="add-calendar-button button-success" onClick={handleSyncGoogle}>
            <i className="bi bi-google"></i> Synchroniser
          </button>
        </div>
        
        {/* Liste des calendriers avec nouveau design */}
        <div className="calendar-list">
          <h2><i className="bi bi-calendar-week me-2"></i>Mes Calendriers</h2>
          
          {calendars.length > 0 ? (
            calendars.map((calendar: Calendar) => (
              <div
                key={calendar.id}
                className="calendar-list-item d-flex justify-content-between align-items-center w-100"
              >
                <Link
                  to={`/calendars/${calendar.id}`}
                  className="calendar-name text-decoration-none w-75 text-truncate"
                >
                  <i className="bi bi-calendar-event"></i> {calendar.name}
                </Link>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteCalendar(calendar.id)}
                  title="Supprimer le calendrier"
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            ))
          ) : (
            <p>
              <i className="bi bi-calendar-x me-2"></i>
              Aucun calendrier enregistré. Ajoutez votre premier calendrier en utilisant le formulaire ci-dessus.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarList;
