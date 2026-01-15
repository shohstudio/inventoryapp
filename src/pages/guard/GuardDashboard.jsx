import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { RiLogoutBoxRLine, RiAddLine, RiTimeLine, RiCheckLine, RiTruckLine, RiFileList3Line } from 'react-icons/ri';

const GuardDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('exit_requests'); // 'exit_requests' or 'external_items'

    // State for Exit Requests
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
            setExitRequests(data);
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
            await api.post('/external-items', extFormData);
            toast.success("Ro'yxatga olindi");
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
                                {exitRequests.filter(r => r.status !== 'rejected').length === 0 ? (
                                    <tr><td colSpan="5" className="p-6 text-center text-gray-400">So'rovlar yo'q</td></tr>
                                ) : (
                                    exitRequests.filter(r => r.status !== 'rejected').map(req => (
                                        <tr key={req.id} className="hover:bg-gray-50">
                                            <td className="p-4 text-sm text-gray-600">{new Date(req.createdAt).toLocaleString('uz-UZ')}</td>
                                            <td className="p-4 font-medium text-gray-800">{req.requester?.name || '---'}</td>
                                            <td className="p-4 text-gray-600">{req.item?.name || '---'} <span className="text-xs text-gray-400">({req.item?.serialNumber || 'SN yo\'q'})</span></td>
                                            <td className="p-4">
                                                {req.status === 'pending_accountant' && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs border border-orange-200">Hisobchi kutilmoqda</span>}
                                                {req.status === 'approved' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs border border-green-200">Ruxsat Berilgan</span>}
                                                {req.status === 'completed' && <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs border border-gray-200">Chiqib ketgan</span>}
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
                    <div className="flex justify-end mb-4">
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
                                    <tr><td colSpan="6" className="p-6 text-center text-gray-400">Hozir ichkarida tashqi buyumlar yo'q</td></tr>
                                ) : (
                                    externalItems.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50">
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
