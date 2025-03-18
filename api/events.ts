import { VercelRequest, VercelResponse } from '@vercel/node';
import ICAL from 'ical.js';
import fetch from 'node-fetch';

// ✅ Fonction pour parser un fichier iCal
function parseICal(icalString: string) {
    try {
        const jcalData = ICAL.parse(icalString);
        const comp = new ICAL.Component(jcalData);
        const calendarName = String(comp.getFirstPropertyValue('x-wr-calname') || "Calendrier sans nom");

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
        return { calendarName: "Erreur lors du parsing", events: [] };
    }
}

// ✅ API Serverless pour Vercel avec gestion des CORS
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 🔹 Gérer les requêtes OPTIONS (Preflight CORS)
    if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        return res.status(200).end();
    }

    // 🔹 Définir les headers CORS pour toutes les réponses
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    let url = req.query.url as string;

    if (!url) {
        return res.status(400).json({ error: 'Paramètre "url" manquant' });
    }

    // 🔹 Convertir `webcal://` en `https://`
    url = decodeURIComponent(url);
    if (url.startsWith('webcal://')) {
        url = url.replace('webcal://', 'https://');
    }

    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Node.js fetch)' }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: `Erreur ${response.status} lors du téléchargement` });
        }

        const icalData = await response.text();
        const { calendarName, events } = parseICal(icalData);

        res.json({ calendarName, events });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération du fichier iCal" });
    }
}
