import { useState, useEffect } from "react";
import api from "../../api/axios";

const GlobalAlert = () => {
    const [dates, setDates] = useState({ start: null, end: null });
    const [closed, setClosed] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/settings');
                if (data.inventoryStartDate && data.inventoryEndDate) {
                    setDates({
                        start: data.inventoryStartDate,
                        end: data.inventoryEndDate
                    });
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
            }
        };
        fetchSettings();
    }, []);

    if (closed || !dates.start || !dates.end) return null;

    return (
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-3 shadow-md relative animate-in slide-in-from-top-2">
            <div className="container mx-auto flex justify-between items-center px-4">
                <div className="flex items-center gap-2">
                    <span className="font-bold bg-white/20 px-2 py-0.5 rounded text-sm">DIQQAT!</span>
                    <span>
                        {dates.start} dan {dates.end} gacha invertarizatsiya o'tkaziladi.
                    </span>
                </div>
                <button
                    onClick={() => setClosed(true)}
                    className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default GlobalAlert;
