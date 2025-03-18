export type Event = {
    uid: string;
    summary: string;
    startDate: string;
    endDate: string;
}

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
