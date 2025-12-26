import { createContext, useContext, useState, useEffect } from "react";
import { translations } from "../utils/translations";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    // Default to 'uz' (Latin) if not saved
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem("app_language") || "uz";
    });

    useEffect(() => {
        localStorage.setItem("app_language", language);
    }, [language]);

    // Translation function
    const t = (key) => {
        const langData = translations[language];
        return langData[key] || key; // Return key if translation missing
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
