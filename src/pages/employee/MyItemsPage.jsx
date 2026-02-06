import { useState, useEffect } from "react";
import { read, utils, writeFile } from 'xlsx';
import { RiComputerLine, RiCheckDoubleLine, RiAlertLine, RiFileList3Line, RiFileExcel2Line } from "react-icons/ri";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { toast } from "react-hot-toast";
import { getImageUrl } from "../../api/axios";
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
            const itemsRes = await api.get(`/items?assignedUserId=${user.id}&limit=1000`);
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
    const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' or 'tmj'

    const filteredInventoryItems = myItems.filter(item =>
        !item.inventoryType || item.inventoryType.toLowerCase().trim() !== 'tmj'
    );
    const filteredTMJItems = myItems.filter(item =>
        item.inventoryType && item.inventoryType.toLowerCase().trim() === 'tmj'
    );

    // Auto-switch to TMJ tab if inventory is empty but TMJ has items
    useEffect(() => {
        if (filteredInventoryItems.length === 0 && filteredTMJItems.length > 0 && activeTab === 'inventory') {
            setActiveTab('tmj');
        }
    }, [filteredInventoryItems.length, filteredTMJItems.length]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    const displayItems = activeTab === 'inventory' ? filteredInventoryItems : filteredTMJItems;
    const currentItems = displayItems.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(displayItems.length / itemsPerPage);

    const handleExportExcel = () => {
        const exportData = displayItems.map((item, index) => ({
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
        utils.book_append_sheet(wb, ws, activeTab === 'inventory' ? "Asosiy Jihozlar" : "TMJ Jihozlari");
        writeFile(wb, activeTab === 'inventory' ? "Mening_Jihozlarim.xlsx" : "Mening_TMJ_Jihozlarim.xlsx");
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Yuklanmoqda...</div>;

    if (myItems.length === 0 && requests.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <RiComputerLine size={40} />
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Sizga biriktirilgan jihozlar yo'q</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Hozircha sizning nomingizga hech qanday inventar rasmiylashtirilmagan.</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Mening Jihozlarim</h1>

                {displayItems.length > 0 && (
                    <button
                        onClick={handleExportExcel}
                        className="btn bg-green-600 hover:bg-green-700 text-white shadow-green-200 shadow-lg flex items-center gap-2"
                    >
                        <RiFileExcel2Line size={20} />
                        Excelga yuklash ({activeTab === 'inventory' ? 'Inventory' : 'TMJ'})
                    </button>
                )}
            </div>

            {requests.length > 0 && (
                <div className="mb-8 animate-in slide-in-from-top duration-500">
                    <h2 className="text-xl font-bold text-orange-600 dark:text-orange-400 mb-4 flex items-center gap-2">
                        <RiAlertLine /> Tasdiqlash kutilmoqda
                    </h2>
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-2xl p-6">
                        <div className="grid gap-4">
                            {requests.map(req => (
                                <div key={req.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 border border-transparent dark:border-slate-700">
                                    <div>
                                        <h3 className="font-bold text-gray-800 dark:text-white">{req.item?.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Seriya: {req.item?.serialNumber || "Yo'q"}</p>
                                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                            Kimdan: <span className="font-medium text-gray-600 dark:text-gray-300">{req.requester?.name || "Admin"}</span>
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

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-100 dark:border-slate-700">
                <button
                    onClick={() => { setActiveTab('inventory'); setCurrentPage(1); }}
                    className={`pb-4 px-2 text-sm font-semibold transition-all relative ${activeTab === 'inventory' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Asosiy jihozlar ({filteredInventoryItems.length})
                    {activeTab === 'inventory' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full animate-in fade-in slide-in-from-bottom-1"></div>}
                </button>
                <button
                    onClick={() => { setActiveTab('tmj'); setCurrentPage(1); }}
                    className={`pb-4 px-2 text-sm font-semibold transition-all relative ${activeTab === 'tmj' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    TMJ jihozlari ({filteredTMJItems.length})
                    {activeTab === 'tmj' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-600 rounded-full animate-in fade-in slide-in-from-bottom-1"></div>}
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-[20px] shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100 dark:border-slate-700">
                                <th className="p-4 font-semibold">#</th>
                                <th className="p-4 font-semibold">Jihoz Nomi</th>
                                {activeTab === 'inventory' ? (
                                    <>
                                        <th className="p-4 font-semibold">Seriya Raqami</th>
                                        <th className="p-4 font-semibold">Kategoriya</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="p-4 font-semibold">Soni</th>
                                        <th className="p-4 font-semibold">Rasm</th>
                                    </>
                                )}
                                <th className="p-4 font-semibold">Holat</th>
                                <th className="p-4 font-semibold">Biriktirilgan Sana</th>
                                <th className="p-4 font-semibold text-right">Hujjat</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                            {currentItems.map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors text-sm">
                                    <td className="p-4 text-gray-400 dark:text-gray-500 font-mono">{indexOfFirstItem + index + 1}</td>
                                    <td className="p-4">
                                        <div className="font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
                                        {activeTab === 'tmj' && <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{item.model} • {item.category}</div>}
                                    </td>

                                    {activeTab === 'inventory' ? (
                                        <>
                                            <td className="p-4 font-mono text-gray-600 dark:text-gray-400">{item.serialNumber || "-"}</td>
                                            <td className="p-4">
                                                <span className="bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-gray-400 px-2 py-1 rounded text-xs border border-transparent dark:border-slate-700">
                                                    {item.category || "-"}
                                                </span>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="p-4 font-mono text-gray-900 dark:text-gray-100 font-bold">{item.quantity} ta</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    {item.image && (
                                                        <a href={getImageUrl(item.image)} target="_blank" rel="noreferrer" className="w-8 h-8 rounded border border-gray-100 overflow-hidden hover:ring-2 hover:ring-orange-200 transition-all">
                                                            <img src={getImageUrl(item.image)} alt="item" className="w-full h-full object-cover" />
                                                        </a>
                                                    )}
                                                    {item.handoverImage && (
                                                        <a href={getImageUrl(item.handoverImage)} target="_blank" rel="noreferrer" className="w-8 h-8 rounded border border-gray-100 overflow-hidden hover:ring-2 hover:ring-green-200 transition-all">
                                                            <img src={getImageUrl(item.handoverImage)} alt="handover" className="w-full h-full object-cover" />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </>
                                    )}

                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.status === 'working' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'working' ? 'bg-green-500' : 'bg-orange-500'
                                                }`}></span>
                                            {item.status === 'working' ? 'Faol' : 'Ta\'mirda'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-400">{item.dateAssigned}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex flex-col items-end gap-1">
                                            {item.assignedDocument && (
                                                <a
                                                    href={getImageUrl(item.assignedDocument)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-medium text-xs transition-colors"
                                                >
                                                    <RiFileList3Line size={16} /> Asos (PDF)
                                                </a>
                                            )}
                                            {item.contractPdf && (
                                                <a
                                                    href={getImageUrl(item.contractPdf)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-800 hover:underline font-medium text-xs transition-colors"
                                                >
                                                    <RiFileList3Line size={16} /> Shartnoma (PDF)
                                                </a>
                                            )}
                                            {!item.assignedDocument && !item.contractPdf && <span className="text-gray-300">-</span>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-6 flex justify-center">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    );
};

export default MyItemsPage;
