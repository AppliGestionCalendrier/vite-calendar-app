import { VercelRequest, VercelResponse } from '@vercel/node';
import ICAL from 'ical.js';
import fetch from 'node-fetch';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    console.log("📡 Requête API reçue :", req.method, req.query.url);

    // 🔹 Gérer la requête préflight OPTIONS (nécessaire pour CORS)
    if (req.method === "OPTIONS") {
        console.log("🛠 Réponse OPTIONS envoyée");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        return res.status(200).end();
    }

    // 🔹 Ajouter les headers CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    console.log("✅ Headers CORS appliqués");

    let url = req.query.url as string;
    if (!url) {
        console.log("❌ Erreur : URL manquante");
        return res.status(400).json({ error: 'Paramètre "url" manquant' });
    }

    // 🔹 Convertir webcal:// en https://
    url = decodeURIComponent(url);
    if (url.startsWith('webcal://')) {
        url = url.replace('webcal://', 'https://');
    }
    console.log("🔗 URL après conversion :", url);

    try {
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Node.js fetch)' } });

        if (!response.ok) {
            console.log("❌ Erreur de téléchargement :", response.status);
            return res.status(response.status).json({ error: `Erreur ${response.status} lors du téléchargement` });
        }

        const icalData = await response.text();
        const jcalData = ICAL.parse(icalData);
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

        console.log("✅ API terminée avec succès !");
        res.json({ calendarName, events });

    } catch (error) {
        console.error("❌ Erreur lors de la récupération du fichier iCal :", error);
        res.status(500).json({ error: "Erreur lors de la récupération du fichier iCal" });
    }
}
