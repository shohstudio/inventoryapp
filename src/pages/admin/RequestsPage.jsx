import { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { toast } from "react-hot-toast";
import { RiFileList3Line, RiCheckDoubleLine, RiTimeLine, RiCloseCircleLine, RiUserStarLine, RiShieldCheckLine } from "react-icons/ri";

const RequestsPage = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('assignment'); // 'assignment' or 'exit'
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/requests');
            setRequests(data);
        } catch (error) {
            console.error("Failed to fetch requests", error);
            const msg = error.response?.data?.message || "So'rovlarni yuklashda xatolik";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [selectedRequestId, setSelectedRequestId] = useState(null);

    const handleUpdateStatus = async (id, newStatus, signature = null, description = null) => {
        if (newStatus === 'rejected' && !description) {
            // Open modal for rejection reason
            setSelectedRequestId(id);
            setRejectionModalOpen(true);
            return;
        }

        if (newStatus !== 'rejected' && !window.confirm("Tasdiqlaysizmi?")) return;

        setIsProcessing(true);
        try {
            await api.put(`/requests/${id}`, { status: newStatus, signature, description });
            toast.success("Muvaffaqiyatli bajarildi");
            fetchRequests();
            if (rejectionModalOpen) {
                setRejectionModalOpen(false);
                setRejectionReason("");
                setSelectedRequestId(null);
            }
        } catch (error) {
            console.error("Update failed", error);
            const msg = error.response?.data?.message || "Xatolik yuz berdi";
            toast.error(msg);
        } finally {
            setIsProcessing(false);
        }
    };

    const submitRejection = () => {
        if (!rejectionReason.trim()) {
            toast.error("Rad etish sababini yozing");
            return;
        }
        handleUpdateStatus(selectedRequestId, 'rejected', null, rejectionReason);
    };

    // Filter based on tab
    const filteredRequests = requests.filter(req => {
        if (activeTab === 'assignment') return req.type === 'assignment';
        if (activeTab === 'exit') return req.type === 'exit';
        return true;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending_accountant':
                return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs border border-orange-200 flex items-center gap-1"><RiTimeLine /> Hisobchi kutilmoqda</span>;
            case 'pending_employee':
                return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs border border-blue-200 flex items-center gap-1"><RiUserStarLine /> Xodim kutilmoqda</span>;
            case 'completed':
                return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs border border-green-200 flex items-center gap-1"><RiCheckDoubleLine /> Yakunlangan</span>;
            case 'rejected':
                return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs border border-red-200 flex items-center gap-1"><RiCloseCircleLine /> Rad etilgan</span>;
            default:
                return <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{status}</span>;
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Yuklanmoqda...</div>;

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 flex items-center gap-2">
                    <RiFileList3Line className="text-indigo-600" />
                    So'rovlar (Requests)
                </h1>
                <p className="text-gray-500">Jihozlarni biriktirish bo'yicha so'rovlar holati</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-4 border-b border-gray-100">
                <button
                    onClick={() => setActiveTab('assignment')}
                    className={`pb-2 px-1 font-medium transition-colors relative ${activeTab === 'assignment' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Biriktirish {activeTab === 'assignment' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-full"></span>}
                </button>
                <button
                    onClick={() => setActiveTab('exit')}
                    className={`pb-2 px-1 font-medium transition-colors relative ${activeTab === 'exit' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Chiqish (Qoravul) {activeTab === 'exit' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-600 rounded-full"></span>}
                </button>
            </div>

            <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800 text-white">
                                <th className="py-4 px-6 font-semibold text-sm rounded-tl-lg">Sana</th>
                                <th className="py-4 px-6 font-semibold text-sm">Jihoz</th>
                                <th className="py-4 px-6 font-semibold text-sm">Kimdan</th>
                                <th className="py-4 px-6 font-semibold text-sm">Kimga</th>
                                <th className="py-4 px-6 font-semibold text-sm">Holati</th>
                                <th className="py-4 px-6 font-semibold text-sm text-right rounded-tr-lg">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-10 text-gray-500">So'rovlar mavjud emas</td>
                                </tr>
                            ) : (
                                filteredRequests.map(req => (
                                    <tr key={req.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="py-4 px-6 text-gray-600 text-sm">
                                            {new Date(req.createdAt).toLocaleString('uz-UZ')}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="font-medium text-gray-900">{req.item?.name}</div>
                                            <div className="text-xs text-gray-400 font-mono">{req.item?.serialNumber}</div>
                                        </td>
                                        <td className="py-4 px-6 text-gray-700 text-sm">{req.requester?.name}</td>
                                        <td className="py-4 px-6">
                                            <div className="font-medium text-gray-900">{req.targetUser?.name || "Bino"}</div>
                                            {req.targetUser?.pinfl && <div className="text-xs text-gray-500 font-mono">PINFL: {req.targetUser.pinfl}</div>}
                                        </td>
                                        <td className="py-4 px-6">
                                            {getStatusBadge(req.status)}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            {/* Logic for Accountant Approval */}
                                            {user.role === 'accounter' && req.status === 'pending_accountant' && (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleUpdateStatus(req.id, 'rejected')}
                                                        className="btn btn-sm bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                                                        disabled={isProcessing}
                                                    >
                                                        Rad etish
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(req.id, 'pending_employee', 'mock_signature_XYZ')}
                                                        className="btn btn-sm bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                                                        disabled={isProcessing}
                                                    >
                                                        {isProcessing ? "..." : <><RiShieldCheckLine className="mr-1" /> Tasdiqlash</>}
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
                </div >
            )}
        </div >
    );
};

export default RequestsPage;


