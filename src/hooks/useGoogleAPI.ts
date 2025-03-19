import { useEffect, useState } from "react";
import { loadGapiInsideDOM } from "gapi-script";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID!;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY!;
const DISCOVERY_DOC = import.meta.env.VITE_GOOGLE_DISCOVERY_DOC!;
const SCOPES = import.meta.env.VITE_GOOGLE_SCOPES!;

declare global {
    interface Window {
        gapi: any;
    }
}

export const useGoogleAPI = () => {
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [calendars, setCalendars] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadGoogleAPI = async () => {
            await loadGapiInsideDOM();
            window.gapi.load("client:auth2", async () => {
                await window.gapi.client.init({
                    apiKey: API_KEY,
                    clientId: CLIENT_ID,
                    discoveryDocs: [DISCOVERY_DOC],
                    scope: SCOPES,
                });

                const authInstance = window.gapi.auth2.getAuthInstance();
                setIsSignedIn(authInstance.isSignedIn.get());
                authInstance.isSignedIn.listen(setIsSignedIn);
                if (authInstance.isSignedIn.get()) {
                    fetchCalendars(); // Charge les calendriers si l'utilisateur est déjà connecté
                }
            });
        };

        loadGoogleAPI();
    }, []);

    const handleSignIn = async () => {
        const authInstance = window.gapi.auth2.getAuthInstance();
        await authInstance.signIn();
        setIsSignedIn(authInstance.isSignedIn.get());
        fetchCalendars();
    };

    const handleSignOut = async () => {
        const authInstance = window.gapi.auth2.getAuthInstance();
        await authInstance.signOut();
        setIsSignedIn(false);
        setCalendars([]);
    };

    const fetchCalendars = async () => {
        try {
            setLoading(true);
            setError(null);
            if (!window.gapi.client) return;
            const response = await window.gapi.client.calendar.calendarList.list();
            setCalendars(response.result.items || []);
        } catch (err) {
            console.error("❌ Erreur lors de la récupération des calendriers :", err);
            setError("Impossible de récupérer les calendriers.");
        } finally {
            setLoading(false);
        }
    };

    return { isSignedIn, calendars, loading, error, handleSignIn, handleSignOut, fetchCalendars };
};
