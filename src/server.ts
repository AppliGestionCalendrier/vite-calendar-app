const express = require('express');
const ICAL = require('ical.js');
const cors = require('cors');
// Si votre version de Node ne supporte pas fetch globalement, décommentez la ligne suivante :
// const fetch = require('node-fetch');

// Import des types Express
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

type ICalComponent = any; // Type pour ICAL.Component
type ICalEvent = any; // Type pour ICAL.Event

interface CalendarEvent {
    uid: string;
    summary: string;
    startDate: Date;
    endDate: Date;
}

interface CalendarResponse {
    calendarName: string;
    events: CalendarEvent[];
}

const app = express();
const port = 3000;

app.use(cors({
    origin: 'http://localhost:3001'
}));

function parseICal(icalString: string): CalendarResponse {
    try {
        console.log("Début du parsing iCal...");
        const jcalData = ICAL.parse(icalString);
        const comp = new ICAL.Component(jcalData);

        // Récupérer le nom du calendrier s'il existe
        const calendarName = comp.getFirstPropertyValue('x-wr-calname') || "Calendrier sans nom";
        console.log("Nom du calendrier :", calendarName);

        // Récupérer les événements
        const vevents = comp.getAllSubcomponents('vevent');
        console.log("Nombre d'événements trouvés :", vevents.length);

        const events = vevents.map((vevent: ICalComponent) => {
            const event = new ICAL.Event(vevent);
            return {
                uid: event.uid,
                summary: event.summary,
                startDate: event.startDate.toJSDate(),
                endDate: event.endDate.toJSDate(),
            };
        });

        console.log("Événements parsés :", events);
        return { calendarName, events };  // On retourne aussi le nom du calendrier
    } catch (error) {
        console.error("Erreur de parsing iCal :", error);
        return { calendarName: "Erreur lors du parsing", events: [] };
    }
}


app.get('/api/events', async (req: ExpressRequest, res: ExpressResponse) => {
    let url = req.query.url as string;

    if (!url) {
        return res.status(400).json({ error: 'Paramètre "url" manquant' });
    }

    // Conversion webcal:// -> https://
    url = decodeURIComponent(url);
    if (url.startsWith('webcal://')) {
        url = url.replace('webcal://', 'https://');
    }

    console.log("URL après conversion :", url);

    try {
        const response = await require('node-fetch')(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Node.js fetch)'
            }
        });

        console.log("Statut de la réponse :", response.status, response.statusText);

        if (!response.ok) {
            return res.status(response.status).json({ error: `Erreur lors du téléchargement du fichier iCal (${response.status})` });
        }

        const icalData = await response.text();
        console.log("Données iCal récupérées (premiers 500 caractères) :", icalData.substring(0, 500));

        const { calendarName, events } = parseICal(icalData);
        console.log("Nom du calendrier :", calendarName);
        console.log("Événements extraits :", events);

        res.json({ calendarName, events }); // Maintenant l’API renvoie aussi le nom du calendrier
    } catch (error) {
        console.error("Erreur fetch :", error);
        res.status(500).json({ error: "Erreur lors de la récupération du fichier iCal" });
    }
});




app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
