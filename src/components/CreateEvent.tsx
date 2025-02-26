import { useState } from "react";
import { Button, Form, Card } from "react-bootstrap";
import * as chrono from "chrono-node";
import "../css/CreateEvent.css";

interface Event {
    uid: string;
    summary: string;
    startDate: string;
    endDate: string;
}

// 🔹 Fonction pour supprimer les mots inutiles (stopwords)
const removeStopWords = (text: string) => {
    const stopWords = ["de", "à", "le", "la", "les", "du", "des", "un", "une", "et", "en","prochain"];
    return text
        .split(" ")
        .filter((word) => !stopWords.includes(word.toLowerCase()))
        .join(" ")
        .trim();
};

const CreateEvent: React.FC<{ onEventCreated: (event: Event) => void }> = ({ onEventCreated }) => {
    const [inputText, setInputText] = useState("");
    const [previewEvent, setPreviewEvent] = useState<Event | null>(null);

    const handleInputChange = (text: string) => {
        setInputText(text);

        // ✅ Utilisation de chrono.fr pour une analyse en français
        const parsedResults = chrono.fr.parse(text, new Date(), { forwardDate: true });

        if (parsedResults.length === 0) {
            setPreviewEvent(null);
            return;
        }

        // 🔹 Prendre la première date détectée
        const parsedDate = parsedResults[0].start.date();
        let eventStart = new Date(parsedDate);
        let eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000); // Par défaut : +1h

        // 🔹 Détection de la plage horaire (ex: "9h à 15h")
        const timeRangeMatch = text.match(/(\d{1,2}h(\d{1,2})?)\s*(à|-)\s*(\d{1,2}h(\d{1,2})?)/i);
        if (timeRangeMatch) {
            const [, startTime, , , endTime] = timeRangeMatch;
            const startHour = parseInt(startTime.replace("h", "").trim());
            const endHour = parseInt(endTime.replace("h", "").trim());

            eventStart.setHours(startHour, 0);
            eventEnd.setHours(endHour, 0);
        }

        // 🔹 Extraction du résumé sans la date et suppression des mots inutiles
        const words = text.split(" ");
        const filteredWords = words.filter((word) => chrono.fr.parse(word).length === 0);
        const eventSummary = removeStopWords(filteredWords.join(" ")) || "Nouvel événement";

        setPreviewEvent({
            uid: Date.now().toString(),
            summary: eventSummary,
            startDate: eventStart.toISOString(),
            endDate: eventEnd.toISOString(),
        });
    };

    const handleCreateEvent = () => {
        if (!previewEvent) {
            alert("Impossible de créer un événement, date invalide !");
            return;
        }
        onEventCreated(previewEvent);
        setInputText("");
        setPreviewEvent(null);
    };

    return (
        <div className="create-event-container">
            {/* 🔹 Champ de texte pour saisir l'événement */}
            <Form.Control
                type="text"
                placeholder="Ex: Vendredi je travaille de 9h à 15h"
                value={inputText}
                onChange={(e) => handleInputChange(e.target.value)}
                className="event-input"
            />
            <Button className="button-primary" onClick={handleCreateEvent} disabled={!previewEvent}>
                ➕ Ajouter
            </Button>

            {/* 🔹 Aperçu dynamique de l'événement */}
            {inputText.trim() && (
                <Card className="event-preview">
                    <Card.Body>
                        <Card.Title>📅 Aperçu de l'événement</Card.Title>
                        {previewEvent ? (
                            <>
                                <h4>{previewEvent.summary}</h4>
                                <p>
                                    <strong>Début :</strong> {new Date(previewEvent.startDate).toLocaleString()}
                                </p>
                                <p>
                                    <strong>Fin :</strong> {new Date(previewEvent.endDate).toLocaleString()}
                                </p>
                            </>
                        ) : (
                            <p className="text-danger">⚠️ Aucune date détectée</p>
                        )}
                    </Card.Body>
                </Card>
            )}
        </div>
    );
};

export default CreateEvent;
