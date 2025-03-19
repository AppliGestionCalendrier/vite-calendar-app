import React, { useState } from 'react';
import { Button, Form, Card } from 'react-bootstrap';
import * as chrono from 'chrono-node';
import '../css/CreateEvent.css';
import {
  CreateEventProps,
  InputState,
  PreviewState,
  TimeRange,
  StopWord,
} from '../types/event.types';

// 🔹 Fonction pour supprimer les mots inutiles (stopwords)
const removeStopWords = (text: string) => {
  const stopWords: StopWord[] = [
    'de',
    'à',
    'le',
    'la',
    'les',
    'du',
    'des',
    'un',
    'une',
    'et',
    'en',
    'prochain',
  ];
  return text
    .split(' ')
    .filter((word: string) => !stopWords.includes(word.toLowerCase()))
    .join(' ')
    .trim();
};

const CreateEvent: React.FC<CreateEventProps> = ({ onEventCreated }) => {
  const [inputText, setInputText] = useState<InputState>('');
  const [previewEvent, setPreviewEvent] = useState<PreviewState>(null);

  const handleInputChange = (text: string): void => {
    setInputText(text);

    const parsedResults = chrono.fr.parse(text, new Date(), { forwardDate: true });
    if (parsedResults.length === 0) {
      setPreviewEvent(null);
      return;
    }

    const parsedDate: Date = parsedResults[0].start.date();
    const eventStart: Date = new Date(parsedDate);
    const eventEnd: Date = new Date(eventStart.getTime() + 60 * 60 * 1000); // +1h par défaut

    const timeRangeMatch = text.match(/(\d{1,2}h(\d{1,2})?)\s*(à|-)\s*(\d{1,2}h(\d{1,2})?)/i);
    if (timeRangeMatch) {
      const [, startTime, , , endTime] = timeRangeMatch;

      const timeRange: TimeRange = {
        startHour: parseInt(startTime.replace('h', '').trim()),
        endHour: parseInt(endTime.replace('h', '').trim()),
      };

      eventStart.setHours(timeRange.startHour, 0);
      eventEnd.setHours(timeRange.endHour, 0);
    }

    const words: string[] = text.split(' ');
    const filteredWords: string[] = words.filter(
      (word: string) => chrono.fr.parse(word).length === 0
    );
    const eventSummary: string = removeStopWords(filteredWords.join(' ')) || 'Nouvel événement';

    setPreviewEvent({
      uid: Date.now().toString(),
      summary: eventSummary,
      startDate: eventStart,
      endDate: eventEnd,
    });
  };

  const handleCreateEvent = (): void => {
    if (!previewEvent) {
      alert('Impossible de créer un événement, date invalide !');
      return;
    }
    onEventCreated(previewEvent);
    setInputText('');
    setPreviewEvent(null);
  };

  return (
    <div className="create-event-container">
      <Form.Control
        type="text"
        placeholder="Ex: Vendredi je travaille de 9h à 15h"
        value={inputText}
        onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
          handleInputChange(e.target.value)
        }
        className="event-input"
      />
      <Button className="button-primary" onClick={handleCreateEvent} disabled={!previewEvent}>
        ➕ Ajouter
      </Button>
      {inputText.trim() && (
        <Card className="event-preview">
          <Card.Body>
            <Card.Title>📅 Aperçu de l'événement</Card.Title>
            {previewEvent ? (
              <>
                <h4>{previewEvent.summary}</h4>
                <p>
                  <strong>Début :</strong> {previewEvent.startDate.toLocaleString()}
                </p>
                <p>
                  <strong>Fin :</strong> {previewEvent.endDate.toLocaleString()}
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
