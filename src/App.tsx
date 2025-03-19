import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { GoogleAuthProvider } from "./context/GoogleAuthProvider";
import CalendarList from "./components/CalendarList";
import CalendarDetail from "./components/CalendarDetailParams";

const App: React.FC = () => {
    return (
        <GoogleAuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<CalendarList />} />
                    <Route path="/calendars/:id" element={<CalendarDetail />} />
                </Routes>
            </Router>
        </GoogleAuthProvider>
    );
};

export default App;
