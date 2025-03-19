export type Event = {
  uid: string;
  id?: string;
  summary: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  start?: {
    dateTime: string;
    timeZone?: string;
  };
  end?: {
    dateTime: string;
    timeZone?: string;
  };
  location?: string;
  url?: string;
};

export type TimeRange = {
  startHour: number;
  endHour: number;
};

export type CreateEventProps = {
  onEventCreated: (event: Event) => void;
};

export type InputState = string;
export type PreviewState = Event | null;

export type StopWord = string;
