import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CalendarList from './components/CalendarList';
import CalendarDetail from './components/CalendarDetailParams';
import React from 'react';

const App: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<CalendarList />} />
                <Route path="/calendars/:id" element={<CalendarDetail />} />
            </Routes>
        </Router>
    );
};

export default App;
