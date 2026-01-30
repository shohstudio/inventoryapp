import { useState, useEffect } from "react";
import { read, utils, writeFile } from 'xlsx';
import { RiComputerLine, RiCheckDoubleLine, RiAlertLine, RiFileList3Line, RiFileExcel2Line } from "react-icons/ri";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { toast } from "react-hot-toast";

import Pagination from "../../components/common/Pagination";

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
            const itemsData = itemsRes.data.items || itemsRes.data;
            const itemsList = Array.isArray(itemsData) ? itemsData : [];

            // 2. Fetch My Pending Requests (Targeting Me)
            // Backend should handle filtering for employee role, but we can be explicit if needed
            const requestsRes = await api.get('/requests?status=pending_employee');
            const requestsData = requestsRes.data.requests || requestsRes.data; // Handle both structures
            const requestsList = Array.isArray(requestsData) ? requestsData : [];

            const myRequests = requestsList.filter(r => r.targetUserId === user.id && r.status === 'pending_employee');

            // 3. Process Items with Dates (using assignedDate directly from item provided by backend)
            const processedItems = itemsList.map(item => ({
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

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = myItems.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(myItems.length / itemsPerPage);

    const handleExportExcel = () => {
        const exportData = myItems.map((item, index) => ({
            "№": index + 1,
            "Jihoz Nomi": item.name,
            "Model": item.model || "-",
            "Seriya Raqami": item.serialNumber || "-",
            "Kategoriya": item.category || "-",
            "Holat": item.status === 'working' ? "Faol" : "Ta'mirda",
            "Biriktirilgan Sana": item.dateAssigned,
            "PINFL": item.assignedTo?.pinfl || "-"
        }));

        const ws = utils.json_to_sheet(exportData);
        // Auto-width for columns
        const wscols = [
            { wch: 5 },  // #
            { wch: 25 }, // Name
            { wch: 15 }, // Model
            { wch: 20 }, // Serial
            { wch: 15 }, // Category
            { wch: 10 }, // Status
            { wch: 15 }, // Date
            { wch: 15 }  // PINFL
        ];
        ws['!cols'] = wscols;

        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Mening Jihozlarim");
        writeFile(wb, "Mening_Jihozlarim.xlsx");
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
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Mening Jihozlarim</h1>

                {myItems.length > 0 && (
                    <button
                        onClick={handleExportExcel}
                        className="btn bg-green-600 hover:bg-green-700 text-white shadow-green-200 shadow-lg flex items-center gap-2"
                    >
                        <RiFileExcel2Line size={20} />
                        Excelga yuklash
                    </button>
                )}
            </div>

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

            <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-100">
                                <th className="p-4 font-semibold">#</th>
                                <th className="p-4 font-semibold">Jihoz Nomi</th>
                                <th className="p-4 font-semibold">Seriya Raqami</th>
                                <th className="p-4 font-semibold">Kategoriya</th>
                                <th className="p-4 font-semibold">Holat</th>
                                <th className="p-4 font-semibold">Biriktirilgan Sana</th>
                                <th className="p-4 font-semibold text-right">Hujjat</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {currentItems.map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors text-sm">
                                    <td className="p-4 text-gray-400">{indexOfFirstItem + index + 1}</td>
                                    <td className="p-4 font-medium text-gray-900">{item.name}</td>
                                    <td className="p-4 font-mono text-gray-600">{item.serialNumber || "-"}</td>
                                    <td className="p-4">
                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                            {item.category || "-"}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'working' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'working' ? 'bg-green-500' : 'bg-orange-500'
                                                }`}></span>
                                            {item.status === 'working' ? 'Faol' : 'Ta\'mirda'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-600">{item.dateAssigned}</td>
                                    <td className="p-4 text-right">
                                        {item.assignedDocument ? (
                                            <a
                                                href={`https://invertar.astiedu.uz/api${item.assignedDocument}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-medium text-xs transition-colors"
                                            >
                                                <RiFileList3Line size={16} /> Asos (PDF)
                                            </a>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
        </div>
    );
};

export default MyItemsPage;
