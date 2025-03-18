const express = require('express');
const ICAL = require('ical.js');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const port = 3000;

app.use(cors({
    origin: 'http://localhost:3500'
}));

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

// ✅ Fonction pour parser un fichier iCal
function parseICal(icalString: string): CalendarResponse {
    try {
        const jcalData = ICAL.parse(icalString);
        const comp = new ICAL.Component(jcalData);

        // ✅ Correction du type calendarName
        const calendarName = String(comp.getFirstPropertyValue('x-wr-calname') || "Calendrier sans nom");

        // Récupérer les événements
        const vevents = comp.getAllSubcomponents('vevent');

        const events = vevents.map((vevent: any) => {
            const event = new ICAL.Event(vevent);
            return {
                uid: event.uid,
                summary: event.summary,
                startDate: event.startDate.toJSDate(),
                endDate: event.endDate.toJSDate(),
            };
        });

        return { calendarName, events };
    } catch (error) {
        console.error("Erreur de parsing iCal :", error);
        return { calendarName: "Erreur lors du parsing", events: [] };
    }
}

// ✅ Route pour récupérer un fichier iCal et le parser
app.get('/api/events', async (req:any, res:any) => {
    let url = req.query.url as string;

    if (!url) {
        return res.status(400).json({ error: 'Paramètre "url" manquant' });
    }

    // ✅ Conversion de webcal:// en https://
    url = decodeURIComponent(url);
    if (url.startsWith('webcal://')) {
        url = url.replace('webcal://', 'https://');
    }

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Node.js fetch)'
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: `Erreur lors du téléchargement du fichier iCal (${response.status})` });
        }

        const icalData = await response.text();
        const { calendarName, events } = parseICal(icalData);

        res.json({ calendarName, events });
    } catch (error) {
        console.error("Erreur fetch :", error);
        res.status(500).json({ error: "Erreur lors de la récupération du fichier iCal" });
    }
});


// ✅ Démarrage du serveur
app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`);
});
