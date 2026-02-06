import { useState, useEffect } from "react";
import { read, utils, writeFile } from 'xlsx';
import { RiComputerLine, RiCheckDoubleLine, RiAlertLine, RiFileList3Line, RiFileExcel2Line, RiCloseLine, RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
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
    const [previewData, setPreviewData] = useState(null); // { images: [], index: 0 }



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

    const handleReportUpload = async (itemId, file) => {
        if (!file) return;

        const formData = new FormData();
        formData.append('employeeReport', file);

        const loadingToast = toast.loading("Hisobot yuklanmoqda...");
        try {
            await api.put(`/items/${itemId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Hisobot muvaffaqiyatli yuklandi!");
            fetchData(); // Refresh to show the new file
        } catch (error) {
            console.error("Upload report error", error);
            toast.error("Yuklashda xatolik yuz berdi");
        } finally {
            toast.dismiss(loadingToast);
        }
    };

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredInventoryItems = myItems.filter(item =>
        !item.inventoryType || item.inventoryType.toLowerCase().trim() !== 'tmj'
    );
    const filteredTMJItems = myItems.filter(item =>
        item.inventoryType && item.inventoryType.toLowerCase().trim() === 'tmj'
    );

    const handleExportExcel = (type) => {
        const items = type === 'inventory' ? filteredInventoryItems : filteredTMJItems;
        const exportData = items.map((item, index) => ({
            "№": index + 1,
            "Jihoz Nomi": item.name,
            "Model": item.model || "-",
            "Kategoriya": item.category || "-",
            "Holat": item.status === 'working' ? "Faol" : "Ta'mirda",
            "Biriktirilgan Sana": item.dateAssigned,
            "PINFL": item.assignedTo?.pinfl || "-"
        }));

        const ws = utils.json_to_sheet(exportData);
        const wscols = [
            { wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 20 },
            { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }
        ];
        ws['!cols'] = wscols;

        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, type === 'inventory' ? "Asosiy Jihozlar" : "TMJ Jihozlari");
        writeFile(wb, type === 'inventory' ? "Mening_Jihozlarim.xlsx" : "Mening_TMJ_Jihozlarim.xlsx");
    };

    const handleImagePreview = (item, initialUrl) => {
        let allImages = [];
        if (item.image) allImages.push(getImageUrl(item.image));
        if (item.images) {
            try {
                const extra = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
                if (Array.isArray(extra)) {
                    extra.forEach(img => {
                        const url = getImageUrl(img);
                        if (!allImages.includes(url)) allImages.push(url);
                    });
                }
            } catch (e) { }
        }
        if (item.handoverImage) {
            const url = getImageUrl(item.handoverImage);
            if (!allImages.includes(url)) allImages.push(url);
        }
        const index = allImages.findIndex(url => url === initialUrl);
        setPreviewData({ images: allImages, index: index >= 0 ? index : 0 });
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!previewData) return;
            if (e.key === 'ArrowRight') setPreviewData(prev => ({ ...prev, index: (prev.index + 1) % prev.images.length }));
            if (e.key === 'ArrowLeft') setPreviewData(prev => ({ ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length }));
            if (e.key === 'Escape') setPreviewData(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [previewData]);

    if (loading) return <div className="p-10 text-center text-gray-500">Yuklanmoqda...</div>;

    return (
        <div className="animate-in fade-in duration-500 pb-20 space-y-12">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Mening Jihozlarim</h1>
            </div>

            {requests.length > 0 && (
                <div className="animate-in slide-in-from-top duration-500">
                    <h2 className="text-xl font-bold text-orange-600 dark:text-orange-400 mb-4 flex items-center gap-2">
                        <RiAlertLine /> Tasdiqlash kutilmoqda
                    </h2>
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-2xl p-6">
                        <div className="grid gap-4">
                            {requests.map(req => (
                                <div key={req.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 border border-transparent dark:border-slate-700">
                                    <div>
                                        <h3 className="font-bold text-gray-800 dark:text-white">{req.item?.name}</h3>
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

            {/* SECTION 1: INVENTAR JIHOZLAR */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                        Inventar jihozlar ({filteredInventoryItems.length})
                    </h2>
                    {filteredInventoryItems.length > 0 && (
                        <button onClick={() => handleExportExcel('inventory')} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                            <RiFileExcel2Line /> Excelga yuklash
                        </button>
                    )}
                </div>

                {filteredInventoryItems.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-10 text-center border border-dashed border-gray-200 dark:border-slate-700">
                        <RiComputerLine className="mx-auto text-gray-300 mb-2" size={32} />
                        <p className="text-gray-500 text-sm">Inventar jihozlar mavjud emas</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-[20px] shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100 dark:border-slate-700">
                                        <th className="p-4 font-semibold">#</th>
                                        <th className="p-4 font-semibold">Jihoz Nomi</th>
                                        <th className="p-4 font-semibold">Kategoriya</th>
                                        <th className="p-4 font-semibold">Holat</th>
                                        <th className="p-4 font-semibold text-right">Hujjat</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                                    {filteredInventoryItems.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors text-sm">
                                            <td className="p-4 text-gray-400 dark:text-gray-500 font-mono">{index + 1}</td>
                                            <td className="p-4 font-medium text-gray-900 dark:text-gray-100">{item.name}</td>
                                            <td className="p-4">
                                                <span className="bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-gray-400 px-2 py-1 rounded text-xs border border-transparent dark:border-slate-700">
                                                    {item.category || "-"}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.status === 'working' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'working' ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                                                    {item.status === 'working' ? 'Faol' : 'Ta\'mirda'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                {item.assignedDocument ? (
                                                    <a href={getImageUrl(item.assignedDocument)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-medium text-xs">
                                                        <RiFileList3Line size={16} /> Asos (PDF)
                                                    </a>
                                                ) : <span className="text-gray-300">-</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </section>

            {/* SECTION 2: TMJ JIHOZLAR */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
                        TMJ jihozlar ({filteredTMJItems.length})
                    </h2>
                    {filteredTMJItems.length > 0 && (
                        <button onClick={() => handleExportExcel('tmj')} className="text-xs text-orange-600 hover:underline flex items-center gap-1">
                            <RiFileExcel2Line /> Excelga yuklash
                        </button>
                    )}
                </div>

                {filteredTMJItems.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-10 text-center border border-dashed border-gray-200 dark:border-slate-700">
                        <RiComputerLine className="mx-auto text-gray-300 mb-2" size={32} />
                        <p className="text-gray-500 text-sm">TMJ jihozlar mavjud emas</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-[20px] shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100 dark:border-slate-700">
                                        <th className="p-4 font-semibold">#</th>
                                        <th className="p-4 font-semibold">Jihoz Nomi</th>
                                        <th className="p-4 font-semibold">Soni</th>
                                        <th className="p-4 font-semibold">Rasm</th>
                                        <th className="p-4 font-semibold">Holat</th>
                                        <th className="p-4 font-semibold text-right">Hujjat</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                                    {filteredTMJItems.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors text-sm">
                                            <td className="p-4 text-gray-400 dark:text-gray-500 font-mono">{index + 1}</td>
                                            <td className="p-4">
                                                <div className="font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
                                                <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{item.model} • {item.category}</div>
                                            </td>
                                            <td className="p-4 font-mono text-gray-900 dark:text-gray-100 font-bold">{item.quantity} {item.unit || 'dona'}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    {item.image && (
                                                        <div
                                                            onClick={() => handleImagePreview(item, getImageUrl(item.image))}
                                                            className="w-8 h-8 rounded border border-gray-100 overflow-hidden hover:ring-2 hover:ring-orange-200 transition-all cursor-pointer"
                                                        >
                                                            <img src={getImageUrl(item.image)} alt="item" className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                    {item.handoverImage && (
                                                        <div
                                                            onClick={() => handleImagePreview(item, getImageUrl(item.handoverImage))}
                                                            className="w-8 h-8 rounded border border-gray-100 overflow-hidden hover:ring-2 hover:ring-green-200 transition-all cursor-pointer"
                                                        >
                                                            <img src={getImageUrl(item.handoverImage)} alt="handover" className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.status === 'working' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'working' ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                                                    {item.status === 'working' ? 'Faol' : 'Ta\'mirda'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                    {item.assignedDocument && (
                                                        <a href={getImageUrl(item.assignedDocument)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-medium text-xs">
                                                            <RiFileList3Line size={16} /> Asos (PDF)
                                                        </a>
                                                    )}
                                                    {item.contractPdf && (
                                                        <a href={getImageUrl(item.contractPdf)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-800 hover:underline font-medium text-xs">
                                                            <RiFileList3Line size={16} /> Shartnoma (PDF)
                                                        </a>
                                                    )}
                                                    {item.employeeReport ? (
                                                        <a href={getImageUrl(item.employeeReport)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-green-600 hover:text-green-800 hover:underline font-medium text-xs">
                                                            <RiFileList3Line size={16} /> Mening Hisobotim
                                                        </a>
                                                    ) : (
                                                        <div className="mt-1">
                                                            <input
                                                                type="file"
                                                                id={`report-${item.id}`}
                                                                className="hidden"
                                                                onChange={(e) => handleReportUpload(item.id, e.target.files[0])}
                                                            />
                                                            <label
                                                                htmlFor={`report-${item.id}`}
                                                                className="cursor-pointer inline-flex items-center gap-1 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded transition-colors"
                                                            >
                                                                <RiFileList3Line size={12} /> Hisobot yuklash
                                                            </label>
                                                        </div>
                                                    )}
                                                    {!item.assignedDocument && !item.contractPdf && !item.employeeReport && <span className="text-gray-300">-</span>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </section>

            {/* Image Preview Carousel Modal */}
            {previewData && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in p-4"
                    onClick={() => setPreviewData(null)}
                >
                    {/* Navigation Container */}
                    <div className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center group">

                        {/* Close Button */}
                        <button
                            onClick={() => setPreviewData(null)}
                            className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors bg-white/10 p-2 rounded-full backdrop-blur-md z-10"
                        >
                            <RiCloseLine size={24} />
                        </button>

                        {/* Prev Button */}
                        {previewData.images.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewData(prev => ({ ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length }));
                                }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-all bg-white/5 hover:bg-white/10 p-4 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 z-10"
                            >
                                <RiArrowLeftSLine size={32} />
                            </button>
                        )}

                        {/* Image */}
                        <img
                            src={previewData.images[previewData.index]}
                            alt={`Preview ${previewData.index + 1}`}
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl transition-all duration-300 transform scale-100"
                            onClick={(e) => e.stopPropagation()}
                        />

                        {/* Next Button */}
                        {previewData.images.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewData(prev => ({ ...prev, index: (prev.index + 1) % prev.images.length }));
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-all bg-white/5 hover:bg-white/10 p-4 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 z-10"
                            >
                                <RiArrowRightSLine size={32} />
                            </button>
                        )}

                        {/* Counter */}
                        {previewData.images.length > 1 && (
                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium tracking-wider bg-black/20 px-3 py-1 rounded-full">
                                {previewData.index + 1} / {previewData.images.length}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyItemsPage;
