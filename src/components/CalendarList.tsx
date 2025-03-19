import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../css/CalendarList.css";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID!;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY!;
const DISCOVERY_DOC = import.meta.env.VITE_GOOGLE_DISCOVERY_DOC!;
const SCOPES = import.meta.env.VITE_GOOGLE_SCOPES!;

declare global {
    interface Window {
        google: any;
        gapi: any;
    }
}

const CalendarList: React.FC = () => {
    const [calendars, setCalendars] = useState<any[]>([]);
    const [gapiLoaded, setGapiLoaded] = useState(false);
    const [gisLoaded, setGisLoaded] = useState(false);
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [icalUrl, setIcalUrl] = useState("");

    // Charger les calendriers stockés au démarrage
    useEffect(() => {
        const storedCalendars = localStorage.getItem("calendars");
        if (storedCalendars) {
            setCalendars(JSON.parse(storedCalendars));
        }
    }, []);

    // Initialisation de l'API Google Calendar
    const initializeGapiClient = async () => {
        try {
            await window.gapi.client.init({
                apiKey: API_KEY,
                discoveryDocs: [DISCOVERY_DOC],
            });
            setGapiLoaded(true);
        } catch (error) {
            console.error("❌ Erreur GAPI:", error);
        }
    };

    // Initialisation de Google Identity Services (GIS)
    const initializeGIS = () => {
        window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: async (response: any) => {
                if (response.error) {
                    console.error("❌ Erreur OAuth :", response);
                    alert(`Erreur OAuth: ${JSON.stringify(response)}`);
                    return;
                }
                setIsSignedIn(true);
                await fetchCalendars();
            },
        });
        setGisLoaded(true);
    };

    // Charger les scripts Google API et GIS
    useEffect(() => {
        const loadGoogleAPI = () => {
            const script = document.createElement("script");
            script.src = "https://apis.google.com/js/api.js";
            script.onload = () => window.gapi.load("client", initializeGapiClient);
            document.body.appendChild(script);

            const gisScript = document.createElement("script");
            gisScript.src = "https://accounts.google.com/gsi/client";
            gisScript.onload = initializeGIS;
            document.body.appendChild(gisScript);
        };

        loadGoogleAPI();
    }, []);

    // Synchronisation des calendriers Google
    const handleSyncGoogle = () => {
        if (!gapiLoaded || !gisLoaded) {
            alert("Google API non chargée, réessayez.");
            return;
        }

        const tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: async (response: any) => {
                if (response.error) {
                    console.error("❌ Erreur OAuth :", response);
                    alert(`Erreur OAuth: ${JSON.stringify(response)}`);
                    return;
                }
                setIsSignedIn(true);
                await fetchCalendars();
            },
            access_type: "offline",
        });

        tokenClient.requestAccessToken();
    };

    // Récupération des calendriers Google
    const fetchCalendars = async () => {
        try {
            const response = await window.gapi.client.calendar.calendarList.list();
            const googleCalendars = response.result.items || [];

            const newCalendars = googleCalendars.map((cal: any) => ({
                id: cal.id,
                name: cal.summary,
                type: "google",
            }));

            const updatedCalendars = [...calendars, ...newCalendars];
            setCalendars(updatedCalendars);
            localStorage.setItem("calendars", JSON.stringify(updatedCalendars));
        } catch (error) {
            console.error("❌ Erreur lors de la récupération des calendriers :", error);
            alert(`Erreur API Google: ${JSON.stringify(error)}`);
        }
    };

    // Ajout d'un calendrier via une URL iCal
    const handleAddICal = async () => {
        if (icalUrl.trim() !== "") {
            try {
                const response = await fetch(`http://localhost:3000/api/events?url=${encodeURIComponent(icalUrl)}`);
                if (!response.ok) {
                    throw new Error("Erreur lors de la récupération du nom du calendrier");
                }
                const data = await response.json();

                const newCalendar = {
                    id: Date.now().toString(),
                    name: data.calendarName || "Calendrier sans nom",
                    url: icalUrl,
                    type: "ical",
                };

                const updatedCalendars = [...calendars, newCalendar];
                setCalendars(updatedCalendars);
                localStorage.setItem("calendars", JSON.stringify(updatedCalendars));
                setIcalUrl("");
            } catch (error) {
                console.error("❌ Erreur lors de l'ajout du calendrier :", error);
                alert("Impossible d'ajouter le calendrier. Vérifiez l'URL.");
            }
        }
    };

    // Suppression d'un calendrier
    const handleDeleteCalendar = (id: string) => {
        const updatedCalendars = calendars.filter((calendar) => calendar.id !== id);
        setCalendars(updatedCalendars);
        localStorage.setItem("calendars", JSON.stringify(updatedCalendars));
    };

    return (
        <div className="calendar-page">
            <div className="calendar-container">
                <h1 className="calendar-title">Calendriers Connectés</h1>

                {/* Bouton pour synchroniser Google Calendar */}
                <button className="add-calendar-button button-success" onClick={handleSyncGoogle}>
                    {isSignedIn ? "Recharger les agendas Google" : "Se connecter et synchroniser"}
                </button>

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

                {/* Liste des calendriers */}
                <h2>Mes Calendriers</h2>
                <div className="calendar-list">
                    {calendars.length > 0 ? (
                        calendars.map((calendar) => (
                            <div key={calendar.id} className="calendar-list-item d-flex justify-content-between align-items-center w-100">
                                <Link to={`/calendars/${calendar.id}?type=${calendar.type}`} className="calendar-name text-decoration-none text-light w-75 text-truncate">
                                    📅 {calendar.name} {calendar.type === "google" && " (Google)"}
                                </Link>
                                <button className="btn btn-danger btn-sm trash" onClick={() => handleDeleteCalendar(calendar.id)}>
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
    );
};

export default CalendarList;
