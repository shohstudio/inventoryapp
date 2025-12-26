import { useState, useEffect } from "react";
import { RiComputerLine, RiCheckDoubleLine, RiAlertLine } from "react-icons/ri";
import { useAuth } from "../../context/AuthContext";

const MyItemsPage = () => {
    const { user } = useAuth();
    const [myItems, setMyItems] = useState([]);

    useEffect(() => {
        if (!user) return;

        const storedItems = JSON.parse(localStorage.getItem("inventory_items") || "[]");
        const storedLogs = JSON.parse(localStorage.getItem("inventory_logs") || "[]");

        // Filter items assigned to the current user (by Name or PINFL if available)
        // We match by Name primarily as it is the legacy way ItemModal saves it
        const userItems = storedItems.filter(item => {
            // Check matches
            const nameMatch = item.assignedTo?.toLowerCase() === user.name?.toLowerCase();
            const pinflMatch = user.pinfl && item.assignedPINFL === user.pinfl;
            return nameMatch || pinflMatch;
        });

        const itemsWithLogs = userItems.map(item => {
            // Find latest log for this item
            const itemLogs = storedLogs.filter(log => log.itemName === item.name);
            // Sort by latest
            itemLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            const latestLog = itemLogs.length > 0 ? itemLogs[0] : null;
            const dateAssigned = latestLog
                ? new Date(latestLog.timestamp).toLocaleDateString('uz-UZ')
                : "Noma'lum"; // Fallback

            return {
                ...item,
                dateAssigned
            };
        });

        setMyItems(itemsWithLogs);
    }, [user]);

    if (myItems.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <RiComputerLine size={40} />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Sizga biriktirilgan jihozlar yo'q</h2>
                <p className="text-gray-500 mt-2">Hozircha sizning nomingizga hech qanday inventar rasmiylashtirilmagan.</p>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Mening Jihozlarim</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myItems.map((item) => (
                    <div key={item.id} className="card group hover:border-indigo-200 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <RiComputerLine size={24} />
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${item.status === 'working' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                <RiCheckDoubleLine />
                                {item.status === 'working' ? 'Faol' : 'Ta\'mirda'}
                            </span>
                        </div>

                        <h3 className="font-bold text-lg text-gray-800 mb-1">{item.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">{item.category} • {item.serial}</p>

                        {item.assignedPINFL && (
                            <div className="mb-4 text-xs bg-gray-50 p-2 rounded text-gray-600 font-mono">
                                PINFL: {item.assignedPINFL}
                            </div>
                        )}

                        <div className="pt-4 border-t border-gray-100 text-xs text-gray-400 flex justify-between items-center">
                            <span>Biriktirilgan sana:</span>
                            <span className="font-medium text-gray-600">{item.dateAssigned}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyItemsPage;
