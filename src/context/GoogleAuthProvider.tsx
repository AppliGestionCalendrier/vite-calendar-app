import React, { createContext, useContext } from "react";
import { useGoogleAPI } from "../hooks/useGoogleAPI";

const GoogleAuthContext = createContext<any>(null);

export const GoogleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const googleAPI = useGoogleAPI();

    return <GoogleAuthContext.Provider value={googleAPI}>{children}</GoogleAuthContext.Provider>;
};

export const useGoogleAuth = () => {
    const context = useContext(GoogleAuthContext);
    if (!context) throw new Error("useGoogleAuth must be used within a GoogleAuthProvider");
    return context;
};