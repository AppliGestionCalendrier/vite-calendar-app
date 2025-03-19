import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCalendars, Calendar } from '../services/fakeApi';
import { useGoogleAuth } from '../context/GoogleAuthProvider';
import '../css/CalendarList.css';

const CalendarList: React.FC = () => {
  const {
    isSignedIn,
    calendars: googleCalendars,
    loading: googleLoading,
    error: googleError,
    handleSignIn,
    handleSignOut,
    fetchCalendars,
  } = useGoogleAuth();

  const [localCalendars, setLocalCalendars] = useState<Calendar[]>([]);
  const [icalUrl, setIcalUrl] = useState<string>('');

  useEffect(() => {
    getCalendars()
        .then(setLocalCalendars)
        .catch(err => console.error("Erreur de chargement iCal", err));

    if (isSignedIn) fetchCalendars();
  }, [isSignedIn]);

  const handleAddICal = async () => {
    if (!icalUrl.trim()) return;

    try {
      const res = await fetch(
          `https://vite-calendar-app-seven.vercel.app/api/events?url=${encodeURIComponent(icalUrl)}`
      );
      const data = await res.json();

      const newCalendar: Calendar = {
        id: Date.now().toString(),
        name: data.calendarName || 'Calendrier sans nom',
        url: icalUrl,
        type: 'ical'
      };

      const updatedCalendars = [...localCalendars, newCalendar];
      setLocalCalendars(updatedCalendars);
      localStorage.setItem('calendars', JSON.stringify(updatedCalendars));
      setIcalUrl('');
    } catch (err) {
      alert("Impossible d'ajouter le calendrier. Vérifiez l'URL.");
    }
  };

  const handleDeleteCalendar = (id: string) => {
    const updatedCalendars = localCalendars.filter(cal => cal.id !== id);
    setLocalCalendars(updatedCalendars);
    localStorage.setItem('calendars', JSON.stringify(updatedCalendars));
  };

  return (
      <div className="calendar-page">
        <div className="calendar-container">
          <h1 className="calendar-title">Calendriers Connectés</h1>

          <div className="add-calendar-form">
            <input
                type="text"
                className="add-calendar-input"
                placeholder="Entrez l'URL iCal"
                value={icalUrl}
                onChange={e => setIcalUrl(e.target.value)}
            />
            <button className="add-calendar-button button-primary" onClick={handleAddICal}>
              <i className="bi bi-plus-lg"></i> Ajouter
            </button>
          </div>

          {/* Connexion Google intégrée harmonieusement avec style existant */}
          <div className="google-calendar-section add-calendar-form">
            {isSignedIn ? (
                <>
                  <button className="add-calendar-button button-danger" onClick={handleSignOut}>
                    <i className="bi bi-google"></i> Déconnexion Google
                  </button>
                  <button className="add-calendar-button button-primary ms-2" onClick={fetchCalendars} disabled={googleLoading}>
                    {googleLoading ? "Chargement..." : "Recharger agendas Google"}
                  </button>
                </>
            ) : (
                <button className="add-calendar-button button-success" onClick={handleSignIn}>
                  <i className="bi bi-google"></i> Connexion Google
                </button>
            )}
          </div>

          {googleError && <p className="text-danger">{googleError}</p>}

          {/* Liste des calendriers avec design staging */}
          <div className="calendar-list">
            <h2><i className="bi bi-calendar-week me-2"></i> Mes Calendriers</h2>

            {localCalendars.map(cal => (
                <div key={cal.id} className="calendar-list-item">
                  <Link
                      to={`/calendars/${cal.id}?type=ical`}
                      className="calendar-name"
                  >
                    <i className="bi bi-calendar-event"></i> {cal.name}
                  </Link>
                  <button className="btn btn-danger" onClick={() => handleDeleteCalendar(cal.id)}>
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
            ))}

            {isSignedIn && googleCalendars.map((cal: Calendar) => (
                <div key={cal.id} className="calendar-list-item">
                  <Link
                      to={`/calendars/${cal.id}?type=google`}
                      className="calendar-name"
                  >
                    📅 {cal.summary} (Google)
                  </Link>
                  <button className="btn btn-secondary" disabled>
                    <i className="bi bi-lock"></i>
                  </button>
                </div>
            ))}

            {!localCalendars.length && !googleCalendars.length && (
                <p>Aucun calendrier enregistré.</p>
            )}
          </div>
        </div>
      </div>
  );
};

export default CalendarList;