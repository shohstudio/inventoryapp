import { useState, useEffect } from "react";
import { RiCloseLine, RiFileExcel2Line, RiComputerLine, RiCheckDoubleLine } from "react-icons/ri";
import { utils, writeFile } from 'xlsx';
import api from "../../api/axios";

const UserItemsModal = ({ isOpen, onClose, user }) => {
    const [items, setItems] = useState([]);
    const [requests, setRequests] = useState([]);
    const [activeTab, setActiveTab] = useState('items'); // 'items' or 'requests'
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            fetchUserItems();
            setActiveTab('items');
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

    const handleExportExcel = () => {
        const exportData = items.map((item, index) => ({
            "№": index + 1,
            "Jihoz Nomi": item.name,
            "Model": item.model || "-",
            "Seriya Raqami": item.serialNumber || "-",
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
            { wch: 20 }, // Serial
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden transform transition-all scale-100 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <span className="w-2 h-8 rounded-full bg-indigo-500"></span>
                            {user?.name}
                        </h2>
                        <p className="text-sm text-gray-500 ml-4">Xodim ma'lumotlari</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <RiCloseLine size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 px-6 shrink-0">
                    <button
                        className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'items' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('items')}
                    >
                        Jihozlar ({items.length})
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
                    ) : activeTab === 'items' ? (
                        <>
                            <div className="flex justify-end mb-4">
                                {items.length > 0 && (
                                    <button
                                        onClick={handleExportExcel}
                                        className="btn btn-sm bg-green-600 hover:bg-green-700 text-white shadow-green-200 shadow-lg flex items-center gap-2"
                                    >
                                        <RiFileExcel2Line size={18} />
                                        Excelga yuklash
                                    </button>
                                )}
                            </div>

                            <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                                {items.length > 0 ? (
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-gray-100 sticky top-0 z-10">
                                            <tr>
                                                <th className="p-3 font-semibold text-xs text-gray-600 uppercase">#</th>
                                                <th className="p-3 font-semibold text-xs text-gray-600 uppercase">Jihoz</th>
                                                <th className="p-3 font-semibold text-xs text-gray-600 uppercase">Seriya</th>
                                                <th className="p-3 font-semibold text-xs text-gray-600 uppercase">Holat</th>
                                                <th className="p-3 font-semibold text-xs text-gray-600 uppercase">Sana</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {items.map((item, index) => (
                                                <tr key={item.id} className="hover:bg-white transition-colors">
                                                    <td className="p-3 text-gray-400 text-sm">{index + 1}</td>
                                                    <td className="p-3">
                                                        <div className="font-medium text-gray-800 text-sm">{item.name}</div>
                                                        <div className="text-xs text-gray-500">{item.model || '-'}</div>
                                                    </td>
                                                    <td className="p-3 text-sm font-mono text-gray-600">{item.serialNumber || '-'}</td>
                                                    <td className="p-3">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.status === 'working' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                            {item.status === 'working' ? 'Faol' : "Ta'mirda"}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-sm text-gray-600">
                                                        {item.assignedDate ? new Date(item.assignedDate).toLocaleDateString('uz-UZ') : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="text-center py-10 flex flex-col items-center">
                                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 mb-3">
                                            <RiComputerLine size={32} />
                                        </div>
                                        <h3 className="text-gray-800 font-medium">Jihozlar yo'q</h3>
                                        <p className="text-gray-500 text-sm">Ushbu foydalanuvchiga hech qanday jihoz biriktirilmagan.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                            {requests.length > 0 ? (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-100 sticky top-0 z-10">
                                        <tr>
                                            <th className="p-3 font-semibold text-xs text-gray-600 uppercase">Turi</th>
                                            <th className="p-3 font-semibold text-xs text-gray-600 uppercase">Jihoz</th>
                                            <th className="p-3 font-semibold text-xs text-gray-600 uppercase">Holat</th>
                                            <th className="p-3 font-semibold text-xs text-gray-600 uppercase">Sana</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {requests.map((req) => (
                                            <tr key={req.id} className="hover:bg-white transition-colors">
                                                <td className="p-3">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${req.type === 'assignment' ? 'bg-blue-100 text-blue-700' :
                                                            req.type === 'return' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {req.type === 'assignment' ? 'Biriktirish' : req.type === 'return' ? 'Qaytarish' : req.type}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <div className="font-medium text-gray-800 text-sm">{req.item?.name || 'Jihoz o\'chirilgan'}</div>
                                                    <div className="text-xs text-gray-500">{req.item?.model || '-'}</div>
                                                </td>
                                                <td className="p-3">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${req.status === 'completed' || req.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                            req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                                'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {req.status}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-sm text-gray-600">
                                                    {new Date(req.createdAt).toLocaleDateString('uz-UZ')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-10 flex flex-col items-center">
                                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 mb-3">
                                        <RiCheckDoubleLine size={32} />
                                    </div>
                                    <h3 className="text-gray-800 font-medium">So'rovlar yo'q</h3>
                                    <p className="text-gray-500 text-sm">Ushbu foydalanuvchi bilan bog'liq so'rovlar mavjud emas.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserItemsModal;
