import React from 'react';
import Scheduler from 'devextreme-react/scheduler';
import { Event } from '../types/event.types';

// Import des styles requis
import 'devextreme/dist/css/dx.light.css';
import '../css/EventCalendar.css';

interface EventCalendarProps {
  events: Event[];
}

const EventCalendar: React.FC<EventCalendarProps> = ({ events }) => {
  // Fonction pour adapter les événements au format attendu par DevExtreme
  const adaptEventsForDevExtreme = (events: Event[]) => {
    return events.filter(event => event !== null).map(event => ({
      id: event.uid,
      text: event.summary,
      startDate: new Date(event.startDate || event.start?.dateTime || ''),
      endDate: new Date(event.startDate || event.start?.dateTime || ''),
      allDay: false,
    }));
  };

  return (
    <div className="event-calendar-container">
      <Scheduler
        timeZone="Europe/Paris"
        dataSource={adaptEventsForDevExtreme(events)}
        views={['day', 'workWeek', 'week', 'month', 'agenda']}
        defaultCurrentView="month"
        defaultCurrentDate={new Date()}
        startDayHour={8}
        endDayHour={20}
        showAllDayPanel={true}
        height="600px"
        startDateExpr="startDate"
        endDateExpr="endDate"
        textExpr="text"
        allDayExpr="allDay"
      />
    </div>
  );
};

export default EventCalendar;
