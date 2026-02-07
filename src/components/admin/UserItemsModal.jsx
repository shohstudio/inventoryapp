import { useState, useEffect } from "react";
import { RiCloseLine, RiFileExcel2Line, RiComputerLine, RiCheckDoubleLine, RiFileList3Line, RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import { utils, writeFile } from 'xlsx';
import api, { getImageUrl } from "../../api/axios";

// Helper for price formatting
const formatPrice = (price) => {
    if (!price) return "0";
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

const UserItemsModal = ({ isOpen, onClose, user }) => {
    const [items, setItems] = useState([]);
    const [requests, setRequests] = useState([]);
    const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'tmj', or 'requests'
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState(null); // { images: [], index: 0 }


    useEffect(() => {
        if (isOpen && user) {
            fetchUserItems();
            setActiveTab('inventory');
        } else {
            setItems([]);
            setRequests([]);
        }
    }, [isOpen, user]);

    const fetchUserItems = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/users/${user.id}`);
            setItems(data.items || []);
            // Combine sent and received requests, sort by date desc
            const allRequests = [
                ...(data.sentRequests || []).map(r => ({ ...r, role: 'requester' })),
                ...(data.receivedRequests || []).map(r => ({ ...r, role: 'target' }))
            ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setRequests(allRequests);
        } catch (error) {
            console.error("Failed to fetch items", error);
        } finally {
            setLoading(false);
        }
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

    const handleExportExcel = () => {
        const exportData = items.map((item, index) => ({
            "№": index + 1,
            "Jihoz Nomi": item.name,
            "Model": item.model || "-",
            "INN": item.inn || "-",
            "Soni": item.quantity || 1,
            "Narxi": item.price ? formatPrice(item.price) : "0",
            "Kategoriya": item.category || "-",
            "Holat": item.status === 'working' ? "Faol" : "Ta'mirda",
            "Biriktirilgan Sana": item.assignedDate ? new Date(item.assignedDate).toLocaleDateString('uz-UZ') : "-",
            "ID": user?.employeeId || "-"
        }));

        const ws = utils.json_to_sheet(exportData);
        const wscols = [
            { wch: 5 },  // #
            { wch: 25 }, // Name
            { wch: 15 }, // Model
            { wch: 15 }, // INN
            { wch: 10 }, // Quantity
            { wch: 15 }, // Price
            { wch: 15 }, // Category
            { wch: 10 }, // Status
            { wch: 15 }, // Date
            { wch: 15 }  // ID
        ];
        ws['!cols'] = wscols;

        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Foydalanuvchi_Jihozlari");
        writeFile(wb, `${user.name.replace(/\s+/g, '_')}_Jihozlari.xlsx`);
    };

    if (!isOpen) return null;

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
            case 'approved':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Yakunlangan</span>;
            case 'rejected':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Rad etilgan</span>;
            case 'pending':
            case 'pending_accountant':
            case 'pending_employee':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">Kutilmoqda</span>;
            default:
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">{status}</span>;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden transform transition-all scale-100 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <span className="w-2 h-8 rounded-full bg-indigo-500"></span>
                            {user?.name}
                        </h2>
                        <p className="text-sm text-gray-500 ml-4">{user?.position || 'Xodim'} • {user?.department || 'Bo\'lim'}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <RiCloseLine size={24} />
                    </button>
                </div>

                {/* Tabs */}
                {(() => {
                    const inventoryItems = items.filter(i => i.inventoryType !== 'tmj');
                    const tmjItems = items.filter(i => i.inventoryType === 'tmj');

                    return (
                        <>
                            <div className="flex border-b border-gray-100 px-6 shrink-0">
                                <button
                                    className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'inventory' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setActiveTab('inventory')}
                                >
                                    Jihozlar ({inventoryItems.length})
                                </button>
                                <button
                                    className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'tmj' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setActiveTab('tmj')}
                                >
                                    TMJ ({tmjItems.length})
                                </button>
                                <button
                                    className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'requests' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setActiveTab('requests')}
                                >
                                    So'rovlar ({requests.length})
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto grow">
                                {loading ? (
                                    <div className="p-10 text-center text-gray-500">Yuklanmoqda...</div>
                                ) : activeTab === 'inventory' ? (
                                    <>
                                        <div className="flex justify-end mb-4">
                                            {inventoryItems.length > 0 && (
                                                <button
                                                    onClick={handleExportExcel}
                                                    className="btn btn-sm bg-green-600 hover:bg-green-700 text-white shadow-green-200 shadow-lg flex items-center gap-2"
                                                >
                                                    <RiFileExcel2Line size={18} />
                                                    Excelga yuklash (Inventar)
                                                </button>
                                            )}
                                        </div>

                                        <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                                            {inventoryItems.length > 0 ? (
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="bg-gray-100 sticky top-0 z-10">
                                                        <tr>
                                                            <th className="p-3 font-semibold text-[10px] text-gray-600 uppercase">#</th>
                                                            <th className="p-3 font-semibold text-[10px] text-gray-600 uppercase">Jihoz</th>
                                                            <th className="p-3 font-semibold text-[10px] text-gray-600 uppercase">INN</th>
                                                            <th className="p-3 font-semibold text-[10px] text-gray-600 uppercase">Narxi</th>
                                                            <th className="p-3 font-semibold text-[10px] text-gray-600 uppercase text-right">Hujjat</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200">
                                                        {inventoryItems.map((item, index) => (
                                                            <tr key={item.id} className="hover:bg-white transition-colors">
                                                                <td className="p-3 text-gray-400 text-sm font-mono">{index + 1}</td>
                                                                <td className="p-3">
                                                                    <div className="font-semibold text-gray-800 text-xs">{item.name}</div>
                                                                    <div className="text-[10px] text-gray-500">{item.model || '-'}</div>
                                                                </td>
                                                                <td className="p-3 text-[11px] font-mono text-gray-600">{item.inn || '-'}</td>
                                                                <td className="p-3 text-[11px] text-gray-600 font-mono">{item.price ? formatPrice(item.price) : '0'}</td>
                                                                <td className="p-3 text-right">
                                                                    {item.assignedDocument ? (
                                                                        <a href={getImageUrl(item.assignedDocument)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline text-[10px] font-medium">
                                                                            <RiFileList3Line size={14} /> Asos
                                                                        </a>
                                                                    ) : <span className="text-gray-300">-</span>}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div className="text-center py-10 flex flex-col items-center">
                                                    <RiComputerLine className="text-gray-300 mb-3" size={48} />
                                                    <h3 className="text-gray-800 font-medium">Inventar jihozlar yo'q</h3>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : activeTab === 'tmj' ? (
                                    <>
                                        <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                                            {tmjItems.length > 0 ? (
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="bg-gray-100 sticky top-0 z-10">
                                                        <tr>
                                                            <th className="p-3 font-semibold text-[10px] text-gray-600 uppercase">#</th>
                                                            <th className="p-3 font-semibold text-[10px] text-gray-600 uppercase">Jihoz Nomi</th>
                                                            <th className="p-3 font-semibold text-[10px] text-gray-600 uppercase">Soni / Narxi</th>
                                                            <th className="p-3 font-semibold text-[10px] text-gray-600 uppercase">Rasmlar</th>
                                                            <th className="p-3 font-semibold text-[10px] text-gray-600 uppercase text-right">Hujjatlar</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200">
                                                        {tmjItems.map((item, index) => (
                                                            <tr key={item.id} className="hover:bg-white transition-colors">
                                                                <td className="p-3 text-gray-400 text-sm font-mono">{index + 1}</td>
                                                                <td className="p-3">
                                                                    <div className="font-semibold text-gray-800 text-xs">{item.name}</div>
                                                                    <div className="text-[10px] text-gray-500">{item.model || '-'} • {item.category || '-'}</div>
                                                                </td>
                                                                <td className="p-3">
                                                                    <div className="text-xs font-bold text-gray-900">{item.quantity || 1} {item.unit || 'dona'}</div>
                                                                    <div className="text-[10px] text-gray-500 font-mono">{item.price ? formatPrice(item.price) : '0'} som</div>
                                                                </td>
                                                                <td className="p-3">
                                                                    <div className="flex items-center gap-1.5">
                                                                        {item.image && (
                                                                            <div onClick={() => handleImagePreview(item, getImageUrl(item.image))} className="w-7 h-7 rounded border border-gray-200 overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-300 bg-gray-100">
                                                                                <img src={getImageUrl(item.image)} className="w-full h-full object-cover" alt="img" />
                                                                            </div>
                                                                        )}
                                                                        {item.handoverImage && (
                                                                            <div onClick={() => handleImagePreview(item, getImageUrl(item.handoverImage))} className="w-7 h-7 rounded border border-green-200 overflow-hidden cursor-pointer hover:ring-2 hover:ring-green-300 bg-gray-100">
                                                                                <img src={getImageUrl(item.handoverImage)} className="w-full h-full object-cover" alt="handover" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="p-3 text-right">
                                                                    <div className="flex flex-col items-end gap-1">
                                                                        {console.log("Item Docs Debug:", item.id, item.contractPdf, item.employeeReport)}
                                                                        {item.assignedDocument && (
                                                                            <a href={getImageUrl(item.assignedDocument)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-[10px] flex items-center gap-0.5">
                                                                                <RiFileList3Line size={12} /> Asos
                                                                            </a>
                                                                        )}
                                                                        {item.contractPdf && (
                                                                            <a href={getImageUrl(item.contractPdf)} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline text-[10px] flex items-center gap-0.5">
                                                                                <RiFileList3Line size={12} /> Shartnoma
                                                                            </a>
                                                                        )}
                                                                        {item.employeeReport && (
                                                                            <a href={getImageUrl(item.employeeReport)} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline text-[10px] font-bold flex items-center gap-0.5">
                                                                                <RiFileList3Line size={12} /> Hisobot
                                                                            </a>
                                                                        )}
                                                                        {!item.assignedDocument && !item.contractPdf && !item.employeeReport && <span className="text-gray-300">-</span>}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div className="text-center py-10 flex flex-col items-center">
                                                    <RiComputerLine className="text-gray-300 mb-3" size={48} />
                                                    <h3 className="text-gray-800 font-medium">TMJ jihozlar yo'q</h3>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                                        {requests.length > 0 ? (
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-gray-100 sticky top-0 z-10">
                                                    <tr>
                                                        <th className="p-3 font-semibold text-[10px] text-gray-600 uppercase">Turi</th>
                                                        <th className="p-3 font-semibold text-[10px] text-gray-600 uppercase">Jihoz</th>
                                                        <th className="p-3 font-semibold text-[10px] text-gray-600 uppercase">Soni / Narxi</th>
                                                        <th className="p-3 font-semibold text-[10px] text-gray-600 uppercase">Holat</th>
                                                        <th className="p-3 font-semibold text-[10px] text-gray-600 uppercase">Sana</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {requests.map((req) => (
                                                        <tr key={req.id} className="hover:bg-white transition-colors">
                                                            <td className="p-3">
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${req.type === 'assignment' ? 'bg-blue-100 text-blue-700' :
                                                                    req.type === 'return' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                                                                    }`}>
                                                                    {req.type === 'assignment' ? 'Biriktirish' : req.type === 'return' ? 'Qaytarish' : req.type}
                                                                </span>
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="font-semibold text-gray-800 text-xs">{req.item?.name || 'Jihoz o\'chirilgan'}</div>
                                                                <div className="text-[10px] text-gray-500">{req.item?.model || '-'}</div>
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="text-xs font-bold text-gray-900">{req.item?.quantity || 1} {req.item?.unit || 'dona'}</div>
                                                                <div className="text-[10px] text-gray-500 font-mono">{req.item?.price ? formatPrice(req.item.price) : '0'} som</div>
                                                            </td>
                                                            <td className="p-3">
                                                                {getStatusBadge(req.status)}
                                                            </td>
                                                            <td className="p-3 text-[11px] text-gray-600 font-mono">
                                                                {new Date(req.createdAt).toLocaleDateString('uz-UZ')}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="text-center py-10 flex flex-col items-center">
                                                <RiCheckDoubleLine size={48} className="text-gray-300 mb-3" />
                                                <h3 className="text-gray-800 font-medium">So'rovlar yo'q</h3>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    );
                })()}

                {/* Image Preview Carousel Modal */}
                {previewData && (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in p-4"
                        onClick={() => setPreviewData(null)}
                    >
                        <div className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center group" onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => setPreviewData(null)}
                                className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors bg-white/10 p-2 rounded-full backdrop-blur-md z-10"
                            >
                                <RiCloseLine size={24} />
                            </button>

                            {previewData.images.length > 1 && (
                                <button
                                    onClick={() => setPreviewData(prev => ({ ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length }))}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-all bg-white/5 hover:bg-white/10 p-4 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 z-10"
                                >
                                    <RiArrowLeftSLine size={32} />
                                </button>
                            )}

                            <img
                                src={previewData.images[previewData.index]}
                                alt="Preview"
                                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl transition-all duration-300"
                            />

                            {previewData.images.length > 1 && (
                                <button
                                    onClick={() => setPreviewData(prev => ({ ...prev, index: (prev.index + 1) % prev.images.length }))}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-all bg-white/5 hover:bg-white/10 p-4 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 z-10"
                                >
                                    <RiArrowRightSLine size={32} />
                                </button>
                            )}

                            {previewData.images.length > 1 && (
                                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium tracking-wider bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                                    {previewData.index + 1} / {previewData.images.length}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserItemsModal;
