import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api, { BASE_URL } from '../../api/axios';
import { toast } from 'react-hot-toast';
import { RiLogoutBoxRLine, RiAddLine, RiTimeLine, RiCheckLine, RiTruckLine, RiFileList3Line, RiQrCodeLine, RiSearchLine, RiUser3Line } from 'react-icons/ri';

const UserAvatar = ({ user, size = "w-8 h-8" }) => {
    if (!user) return <div className={`${size} rounded-full bg-gray-50 flex items-center justify-center text-gray-300 border border-dashed border-gray-200`}><RiUser3Line size={14} /></div>;

    const imageUrl = user.image ? (user.image.startsWith('http') ? user.image : `${BASE_URL.replace('/api', '')}${user.image}`) : null;

    return (
        <div className={`${size} rounded-full overflow-hidden bg-white flex items-center justify-center border border-gray-100 flex-shrink-0 shadow-sm ring-2 ring-white`}>
            {imageUrl ? (
                <img src={imageUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-indigo-400">
                    <RiUser3Line size={14} />
                </div>
            )}
        </div>
    );
};

const GuardDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('exit_requests'); // 'exit_requests' or 'external_items'

    // State for Exit Requests Create
    const [showExitModal, setShowExitModal] = useState(false);
    const [scanQuery, setScanQuery] = useState('');
    const [scannedItem, setScannedItem] = useState(null);
    const [loadingScan, setLoadingScan] = useState(false);
    const [carrierName, setCarrierName] = useState('');

    // State for Exit Requests List
    const [exitRequests, setExitRequests] = useState([]);
    const [loadingExits, setLoadingExits] = useState(false);

    // State for External Items
    const [externalItems, setExternalItems] = useState([]);
    const [loadingExternal, setLoadingExternal] = useState(false);

    // Form for new External Item
    const [showExtModal, setShowExtModal] = useState(false);
    const [extFormData, setExtFormData] = useState({ itemName: '', ownerName: '', description: '', notes: '' });

    useEffect(() => {
        if (activeTab === 'exit_requests') fetchExitRequests();
        else fetchExternalItems();
    }, [activeTab]);

    const fetchExitRequests = async () => {
        setLoadingExits(true);
        try {
            const { data } = await api.get('/requests?type=exit');
            // Filter: Show only relevant exit requests (pending or approved, not rejected/completed?)
            // Or maybe show history too. Let's show all for now, filter in UI.
            setExitRequests(data.requests || data);
        } catch (error) {
            console.error(error);
            toast.error("So'rovlarni yuklashda xatolik");
        } finally {
            setLoadingExits(false);
        }
    };

    const fetchExternalItems = async () => {
        setLoadingExternal(true);
        try {
            const { data } = await api.get('/external-items?status=inside');
            setExternalItems(data);
        } catch (error) {
            console.error(error);
            toast.error("Tashqi buyumlarni yuklashda xatolik");
        } finally {
            setLoadingExternal(false);
        }
    };

    const handleReleaseItem = async (requestId) => {
        if (!window.confirm("Jihozni chiqarib yuborishga ruxsat berasizmi?")) return;
        try {
            await api.put(`/requests/${requestId}`, { status: 'completed' }); // Guard marks as done
            toast.success("Ruxsat berildi");
            fetchExitRequests();
        } catch (error) {
            toast.error("Xatolik");
        }
    };

    const handleRegisterExternal = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/external-items', extFormData);

            // Show ID clearly to the user
            toast.success(`Ro'yxatga olindi! ID: ${data.shortId}`, { duration: 5000, icon: '🎫' });
            // Also show an alert for emphasis if needed, but toast is good.
            // alert(`Buyum ID raqami: ${data.shortId}`); // Optional, stick to toast for now unless requested.

            setShowExtModal(false);
            setExtFormData({ itemName: '', ownerName: '', description: '', notes: '' });
            fetchExternalItems();
        } catch (error) {
            toast.error("Xatolik");
        }
    };

    const handleExitExternal = async (itemId) => {
        if (!window.confirm("Buyum hududdan chiqib ketdimi?")) return;
        try {
            await api.put(`/external-items/${itemId}/exit`);
            toast.success("Chiqib ketdi deb belgilandi");
            fetchExternalItems();
        } catch (error) {
            toast.error("Xatolik");
        }
    };

    // Debounced Search for Guard
    useEffect(() => {
        const timer = setTimeout(() => {
            if (scanQuery.trim()) {
                handleSearchItem();
            }
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [scanQuery]);

    // Search Item by Serial or QR
    const handleSearchItem = async (e) => {
        e?.preventDefault();
        if (!scanQuery.trim()) return;

        setLoadingScan(true);
        try {
            // First try finding by serial number
            const { data } = await api.get(`/items?search=${scanQuery}`);
            const results = data.items || data; // Handle paginated response

            if (results && results.length > 0) {
                // Find exact match if possible, otherwise first result
                const exactMatch = results.find(i => i.serialNumber?.toLowerCase() === scanQuery.toLowerCase());
                const item = exactMatch || results[0];
                setScannedItem(item);
                setCarrierName(item.assignedTo?.name || ''); // Default to owner
                toast.success("Buyum topildi");
            } else {
                // Only show error if scanning manually, not on every type (optional but better UX not to spam toast while typing)
                toast.error("Buyum topilmadi");
                setScannedItem(null);
                setCarrierName('');
            }
        } catch (error) {
            console.error("Search error", error);
            // toast.error("Qidirishda xatolik"); // Suppress global error spam while typing
        } finally {
            setLoadingScan(false);
        }
    };

    const handleCreateExitRequest = async () => {
        if (!scannedItem) return;
        try {
            await api.post('/requests', {
                itemId: scannedItem.id,
                type: 'exit',
                status: 'pending_accountant', // Guard initiates, waiting for accountant
                description: `Olib chiquvchi: ${carrierName}. Qoravul: ${user.name}`
            });
            toast.success("So'rov yuborildi");
            setShowExitModal(false);
            setScannedItem(null);
            setScanQuery('');
            setCarrierName('');
            fetchExitRequests();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "So'rov yaratishda xatolik");
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Qoravul Paneli (Guard Dashboard)</h1>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b pb-2">
                <button
                    onClick={() => setActiveTab('exit_requests')}
                    className={`pb-2 px-4 font-medium ${activeTab === 'exit_requests' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <RiLogoutBoxRLine className="inline mr-2" /> Chiqish So'rovlari
                </button>
                <button
                    onClick={() => setActiveTab('external_items')}
                    className={`pb-2 px-4 font-medium ${activeTab === 'external_items' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <RiTruckLine className="inline mr-2" /> Tashqi Buyumlar
                </button>
            </div>

            {/* EXIT REQUESTS TAB */}
            {activeTab === 'exit_requests' && (
                <div>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => setShowExitModal(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl shadow-sm flex items-center gap-2 transition-colors"
                        >
                            <RiQrCodeLine size={20} /> Chiqishga Ruxsat (Scan)
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                                <tr>
                                    <th className="p-4">Sana</th>
                                    <th className="p-4">Xodim</th>
                                    <th className="p-4">Jihoz</th>
                                    <th className="p-4">Holati</th>
                                    <th className="p-4">Amallar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {exitRequests.length === 0 ? (
                                    <tr><td colSpan="5" className="p-6 text-center text-gray-400">So'rovlar yo'q</td></tr>
                                ) : (
                                    exitRequests.map(req => (
                                        <tr key={req.id} className={`hover:bg-gray-50 border-l-4 ${req.status === 'rejected' ? 'border-red-500 bg-red-50/50' : 'border-transparent'}`}>
                                            <td className="p-4 text-sm text-gray-600">{new Date(req.createdAt).toLocaleString('uz-UZ')}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <UserAvatar user={req.requester} />
                                                    <span className="font-medium text-gray-800">{req.requester?.name || '---'}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-600">{req.item?.name || '---'} <span className="text-xs text-gray-400">({req.item?.serialNumber || 'SN yo\'q'})</span></td>
                                            <td className="p-4">
                                                {req.status === 'pending_accountant' && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs border border-orange-200">Hisobchi kutilmoqda</span>}
                                                {req.status === 'approved' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs border border-green-200">Ruxsat Berilgan</span>}
                                                {req.status === 'completed' && <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs border border-gray-200">Chiqib ketgan</span>}
                                                {req.status === 'rejected' && (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs border border-red-200 w-fit">Rad Etildi</span>
                                                        <span className="text-xs text-red-600 italic">"{req.description}"</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                {req.status === 'approved' && (
                                                    <button
                                                        onClick={() => handleReleaseItem(req.id)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm shadow-sm transition-colors flex items-center gap-2"
                                                    >
                                                        <RiLogoutBoxRLine /> Chiqarib yuborish
                                                    </button>
                                                )}
                                                {req.status === 'completed' && <span className="text-gray-400 text-sm"><RiCheckLine className="inline" /> Bajarildi</span>}
                                                {req.status === 'rejected' && <span className="text-red-400 text-sm">Rad etilgan</span>}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* EXTERNAL ITEMS TAB */}
            {activeTab === 'external_items' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="ID yoki Ism bo'yicha qidirish..."
                                className="pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64"
                                onChange={(e) => {
                                    const val = e.target.value.toLowerCase();
                                    // Simple client-side filter
                                    const rows = document.querySelectorAll('.ext-item-row');
                                    rows.forEach(row => {
                                        const text = row.innerText.toLowerCase();
                                        row.style.display = text.includes(val) ? '' : 'none';
                                    });
                                }}
                            />
                            <RiSearchLine className="absolute left-3 top-3 text-gray-400" />
                        </div>
                        <button
                            onClick={() => setShowExtModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-sm flex items-center gap-2"
                        >
                            <RiAddLine size={20} /> Yangi Buyum Kiritish
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                                <tr>
                                    <th className="p-4">ID</th>
                                    <th className="p-4">Kirgan Vaqti</th>
                                    <th className="p-4">Buyum Nomi</th>
                                    <th className="p-4">Egasining Ismi</th>
                                    <th className="p-4">Izoh</th>
                                    <th className="p-4">Qoravul</th>
                                    <th className="p-4">Amallar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {externalItems.length === 0 ? (
                                    <tr><td colSpan="7" className="p-6 text-center text-gray-400">Hozir ichkarida tashqi buyumlar yo'q</td></tr>
                                ) : (
                                    externalItems.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50 ext-item-row">
                                            <td className="p-4 font-mono font-bold text-blue-600 bg-blue-50/50 rounded-lg">{item.shortId || '---'}</td>
                                            <td className="p-4 text-sm text-gray-600">{new Date(item.enteredAt).toLocaleString('uz-UZ')}</td>
                                            <td className="p-4 font-medium text-gray-800">{item.itemName}</td>
                                            <td className="p-4 text-gray-600">{item.ownerName}</td>
                                            <td className="p-4 text-gray-500 text-sm">{item.description}</td>
                                            <td className="p-4 text-xs text-gray-400">{item.guard?.name || '---'}</td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => handleExitExternal(item.id)}
                                                    className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-sm transition-colors border border-red-100"
                                                >
                                                    Chiqib ketdi
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal for Creating Exit Request */}
            {showExitModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><RiQrCodeLine /> Buyumni Tekshirish</h2>

                        {!scannedItem ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Seriya Raqami / QR Kod</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                                            placeholder="Masalan: PC-001"
                                            value={scanQuery}
                                            onChange={e => setScanQuery(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSearchItem()}
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleSearchItem}
                                            disabled={loadingScan}
                                            className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700"
                                        >
                                            {loadingScan ? '...' : <RiSearchLine />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">QR kodni skaner qilsangiz, raqam shu yerga tushadi.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <p className="text-sm text-gray-500">Buyum:</p>
                                    <p className="font-bold text-gray-800 text-lg">{scannedItem.name}</p>
                                    <p className="text-sm text-gray-500 mt-2">Egasi:</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <UserAvatar user={scannedItem.assignedTo} size="w-9 h-9" />
                                        <p className="font-bold text-indigo-600">{scannedItem.assignedTo?.name || "Biriktirilmagan"}</p>
                                    </div>

                                    <div className="mt-2">
                                        <label className="text-sm text-gray-500">Olib chiqib ketayotgan xodim:</label>
                                        <input
                                            type="text"
                                            value={carrierName}
                                            onChange={(e) => setCarrierName(e.target.value)}
                                            className="w-full bg-white border border-gray-300 rounded px-2 py-1 mt-1 text-gray-800 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">S/N: {scannedItem.serialNumber}</p>
                                </div>

                                <div className="flex justify-end gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => { setScannedItem(null); setScanQuery(''); }}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                                    >
                                        Boshqa
                                    </button>
                                    <button
                                        onClick={handleCreateExitRequest}
                                        disabled={!scannedItem.assignedTo}
                                        className={`px-4 py-2 text-white rounded-lg shadow-md transition-colors font-medium ${!scannedItem.assignedTo ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                                    >
                                        So'rov Yuborish
                                    </button>
                                </div>
                                {!scannedItem.assignedTo && (
                                    <p className="text-xs text-red-500 text-center">Bu buyum hech kimga biriktirilmagan. So'rov yuborib bo'lmaydi.</p>
                                )}
                            </div>
                        )}

                        {!scannedItem && (
                            <button
                                onClick={() => setShowExitModal(false)}
                                className="w-full mt-4 text-gray-500 text-sm hover:text-gray-700"
                            >
                                Bekor qilish
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Modal for External Item */}
            {showExtModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold mb-4">Tashqi Buyumni Ro'yxatga Olish</h2>
                        <form onSubmit={handleRegisterExternal} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Buyum Nomi <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Masalan: Noutbuk HP"
                                    value={extFormData.itemName}
                                    onChange={e => setExtFormData({ ...extFormData, itemName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Egasining Ismi <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Ism Familiya"
                                    value={extFormData.ownerName}
                                    onChange={e => setExtFormData({ ...extFormData, ownerName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tavsif / Seriya raqami</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Rangi, holati, seriya raqami..."
                                    value={extFormData.description}
                                    onChange={e => setExtFormData({ ...extFormData, description: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowExtModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-colors font-medium"
                                >
                                    Saqlash
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );

};

export default GuardDashboard;
