export type Event = {
    uid: string;
    summary: string;
    startDate: Date;
    endDate: Date;
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
