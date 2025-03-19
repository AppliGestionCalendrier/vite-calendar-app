// src/services/fakeApi.ts

export interface Calendar {
  id: string;
  summary: string;
  name: string;
  url?: string;
  type: 'google' | 'ical';
}

export interface Event {
  id: string;
  title: string;
  date: string; // Format ISO
  group?: string;
}

export const getCalendars = (): Promise<Calendar[]> => {
  return new Promise((resolve, reject) => {
    try {
      const stored = localStorage.getItem('calendars');
      if (stored) {
        resolve(JSON.parse(stored));
      } else {
        resolve([]);
      }
    } catch (error) {
      reject(error);
    }
  });
};

export const getEvents = (calendarId: string): Promise<Event[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (calendarId === '1') {
        resolve([
          { id: 'e1', title: 'Réunion', date: '2025-03-01T10:00:00', group: 'Groupe A' },
          { id: 'e2', title: 'Présentation', date: '2025-03-02T11:00:00' },
        ]);
      } else {
        resolve([
          { id: 'e3', title: 'Gym', date: '2025-03-01T18:00:00' },
          { id: 'e4', title: 'Dîner', date: '2025-03-02T20:00:00' },
        ]);
      }
    }, 500);
  });
};
