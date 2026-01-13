import { useState, useEffect } from "react";
import { RiComputerLine, RiCheckDoubleLine, RiAlertLine } from "react-icons/ri";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const MyItemsPage = () => {
    const { user } = useAuth();
    const [myItems, setMyItems] = useState([]);

    const [requests, setRequests] = useState([]);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                const [itemsRes, logsRes] = await Promise.all([
                    api.get("/items"),
                    api.get("/logs")
                ]);

                const allItems = itemsRes.data;
                const allLogs = logsRes.data;

                // 1. Filter items assigned to the current user
                // Backend stores assignedUserId.
                // We also check legacy name/pinfl match just in case
                const userItems = allItems.filter(item => {
                    const idMatch = item.assignedUserId === user.id;
                    // Fallback for older data or different assignment logic
                    const nameMatch = item.assignedTo?.name === user.name; // assignedTo is relation object now
                    const pinflMatch = user.pinfl && item.assignedTo?.pinfl === user.pinfl;

                    return idMatch || nameMatch || pinflMatch;
                });

                const itemsWithLogs = userItems.map(item => {
                    // Find latest log for this item (Assign action)
                    // Logs from API have item object or itemId
                    const itemLogs = allLogs.filter(log =>
                        (log.item?.id === item.id) ||
                        (log.itemName === item.name) // Fallback
                    );

                    // Sort by newest
                    itemLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                    const latestLog = itemLogs.length > 0 ? itemLogs[0] : null;
                    const dateAssigned = latestLog
                        ? new Date(latestLog.createdAt).toLocaleDateString('uz-UZ')
                        : item.assignedDate ? new Date(item.assignedDate).toLocaleDateString('uz-UZ') : "Noma'lum";

                    return {
                        ...item,
                        dateAssigned
                    };
                });

                setMyItems(itemsWithLogs);

                // 2. Pending Requests Logic - MOCK for now as API requests not fully implemented
                // But we can clear it or leave empty
                setRequests([]);

            } catch (error) {
                console.error("Failed to fetch employee items", error);
            }
        };

        fetchData();
    }, [user]);

    const handleAccept = (request) => {
        // 1. Move Item from Warehouse to Inventory
        const warehouseItems = JSON.parse(localStorage.getItem("warehouse_items") || "[]");
        const inventoryItems = JSON.parse(localStorage.getItem("inventory_items") || "[]");
        const allRequests = JSON.parse(localStorage.getItem("assignment_requests") || "[]");

        // Update Warehouse (decrement or remove)
        const updatedWarehouseItems = warehouseItems.map(wItem => {
            if (wItem.id === request.itemDetails.originalWarehouseId) {
                // Decrement quantity
                return { ...wItem, quantity: Math.max(0, parseInt(wItem.quantity) - 1) };
            }
            return wItem;
        });
        localStorage.setItem("warehouse_items", JSON.stringify(updatedWarehouseItems));

        // Add to Inventory
        const newItem = {
            ...request.itemDetails,
            id: Date.now(), // New ID for Inventory
            assignedTo: user.name,
            assignedPINFL: user.pinfl,
            status: 'working'
        };
        localStorage.setItem("inventory_items", JSON.stringify([...inventoryItems, newItem]));

        // Update Request Status
        const updatedRequests = allRequests.map(r => {
            if (r.id === request.id) {
                return {
                    ...r,
                    status: 'completed',
                    acceptedAt: new Date().toISOString()
                };
            }
            return r;
        });
        localStorage.setItem("assignment_requests", JSON.stringify(updatedRequests));

        // Add Logic Log
        const logs = JSON.parse(localStorage.getItem("inventory_logs") || "[]");
        logs.unshift({
            id: Date.now(),
            userName: user.name,
            userRole: user.role,
            action: "qabul qildi (imzoladi)",
            itemName: newItem.name,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem("inventory_logs", JSON.stringify(logs));

        // Refresh State
        setRequests(updatedRequests.filter(req =>
            req.status === 'pending_employee' &&
            (req.assignedToPinfl === user.pinfl || req.assignedToName?.toLowerCase() === user.name?.toLowerCase())
        ));
        // Force reload items (simple way: re-run effect or just append locally)
        // For simplicity, let's just reload the page or better yet, depend on setMyItems updating next render? 
        // We need to update myItems manually here or trigger re-fetch.
        // Let's just manually append to myItems for instant feedback
        setMyItems(prev => [...prev, { ...newItem, dateAssigned: new Date().toLocaleDateString('uz-UZ') }]);

        alert("Jihoz muvaffaqiyatli qabul qilindi!");
    };

    if (myItems.length === 0 && requests.length === 0) {
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

            {requests.length > 0 && (
                <div className="mb-8 animate-in slide-in-from-top duration-500">
                    <h2 className="text-xl font-bold text-orange-600 mb-4 flex items-center gap-2">
                        <RiAlertLine /> Tasdiqlash kutilmoqda
                    </h2>
                    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
                        <div className="grid gap-4">
                            {requests.map(req => (
                                <div key={req.id} className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div>
                                        <h3 className="font-bold text-gray-800">{req.itemDetails.name}</h3>
                                        <p className="text-sm text-gray-500">Seriya: {req.itemDetails.serial || "Yo'q"}</p>
                                        <div className="text-xs text-gray-400 mt-1">
                                            Hisobchi tomonidan tasdiqlangan:
                                            <span className="font-medium text-gray-600 ml-1">{new Date(req.accountantTimestamp).toLocaleString('uz-UZ')}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAccept(req)}
                                        className="btn bg-orange-600 text-white hover:bg-orange-700 shadow-orange-200"
                                    >
                                        <RiCheckDoubleLine className="mr-2" /> Qabul qilish
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myItems.map((item) => (
                    <div key={item.id} className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
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
                        <div className="flex items-center text-sm text-gray-500 mb-4 gap-2">
                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{item.category}</span>
                            <span>•</span>
                            <span className="font-mono text-xs text-gray-400">{item.serial}</span>
                        </div>

                        {item.assignedPINFL && (
                            <div className="mb-4 text-xs bg-gray-50 p-2 rounded-lg text-gray-600 font-mono border border-gray-100">
                                <span className="text-gray-400 mr-2">PINFL:</span>
                                {item.assignedPINFL}
                            </div>
                        )}

                        <div className="pt-4 border-t border-gray-100 text-xs text-gray-400 flex justify-between items-center mt-auto">
                            <span>Biriktirilgan sana:</span>
                            <span className="font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded">{item.dateAssigned}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyItemsPage;
