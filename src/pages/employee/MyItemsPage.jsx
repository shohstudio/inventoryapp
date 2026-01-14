import { useState, useEffect } from "react";
import { RiComputerLine, RiCheckDoubleLine, RiAlertLine } from "react-icons/ri";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { toast } from "react-hot-toast";

const MyItemsPage = () => {
    const { user } = useAuth();
    const [myItems, setMyItems] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // 1. Fetch Items Assigned to ME (Optimized Backend Filter)
            const itemsRes = await api.get(`/items?assignedUserId=${user.id}`);

            // 2. Fetch My Pending Requests (Targeting Me)
            // Backend should handle filtering for employee role, but we can be explicit if needed
            const requestsRes = await api.get('/requests?status=pending_employee');
            const myRequests = requestsRes.data.filter(r => r.targetUserId === user.id && r.status === 'pending_employee');

            // 3. Process Items with Dates (using assignedDate directly from item provided by backend)
            const processedItems = itemsRes.data.map(item => ({
                ...item,
                dateAssigned: item.assignedDate ? new Date(item.assignedDate).toLocaleDateString('uz-UZ') : "Noma'lum"
            }));

            setMyItems(processedItems);
            setRequests(myRequests);
        } catch (error) {
            console.error("Failed to fetch data", error);
            toast.error("Ma'lumotlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleAccept = async (requestId) => {
        if (!window.confirm("Jihozni qabul qilasizmi?")) return;

        try {
            await api.put(`/requests/${requestId}`, { status: 'completed' });
            toast.success("Jihoz qabul qilindi!");

            // Refresh data immediately
            fetchData();
        } catch (error) {
            console.error("Accept error", error);
            toast.error("Qabul qilishda xatolik");
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Yuklanmoqda...</div>;

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
        <div className="animate-in fade-in duration-500">
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
                                        <h3 className="font-bold text-gray-800">{req.item?.name}</h3>
                                        <p className="text-sm text-gray-500">Seriya: {req.item?.serialNumber || "Yo'q"}</p>
                                        <div className="text-xs text-gray-400 mt-1">
                                            Kimdan: <span className="font-medium text-gray-600">{req.requester?.name || "Admin"}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAccept(req.id)}
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
                            <span className="font-mono text-xs text-gray-400">{item.serialNumber}</span>
                        </div>

                        {item.assignedTo?.pinfl && (
                            <div className="mb-4 text-xs bg-gray-50 p-2 rounded-lg text-gray-600 font-mono border border-gray-100">
                                <span className="text-gray-400 mr-2">PINFL:</span>
                                {item.assignedTo.pinfl}
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
