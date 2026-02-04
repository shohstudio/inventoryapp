import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api, { BASE_URL, getImageUrl } from "../../api/axios";
import { toast } from "react-hot-toast";
import { RiFileList3Line, RiCheckDoubleLine, RiCloseCircleLine, RiTimeLine, RiUser3Line } from "react-icons/ri";

import ConfirmationModal from "../../components/common/ConfirmationModal";

const UserAvatar = ({ user, size = "w-8 h-8" }) => {
    if (!user) return <div className={`${size} rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-300 dark:text-gray-600 border border-dashed border-gray-200 dark:border-slate-700`}><RiUser3Line size={14} /></div>;

    const imageUrl = user.image ? (user.image.startsWith('http') ? user.image : `${BASE_URL.replace('/api', '')}${user.image}`) : null;

    return (
        <div className={`${size} rounded-full overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center border border-gray-100 dark:border-slate-700 flex-shrink-0 shadow-sm ring-2 ring-white dark:ring-slate-900`}>
            {imageUrl ? (
                <img src={imageUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-400 dark:text-indigo-300">
                    <RiUser3Line size={14} />
                </div>
            )}
        </div>
    );
};

const EmployeeRequestsPage = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: null,
        onConfirm: () => { },
        confirmText: "Tasdiqlash",
        isDanger: false
    });

    const closeConfirmModal = () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            // Fetch ALL requests for this employee (handled by backend role check)
            const { data } = await api.get('/requests');

            const requestsList = Array.isArray(data) ? data : (data.requests || []);

            // Filter to show relevant assignment requests
            // We want to see:
            // 1. pending_employee (Action required)
            // 2. pending_accountant (Waiting for approval)
            // 3. rejected (For history/info - optional, maybe just active flows?)
            // Let's show active flows: pending_accountant AND pending_employee

            const activeRequests = requestsList.filter(r => {
                // Requests targeted to me (Assignment to me)
                if (r.targetUserId === user.id && (r.status === 'pending_employee' || r.status === 'pending_accountant')) {
                    return true;
                }
                // Requests sent by me (My Issue Reports or Returns)
                if (r.requesterId === user.id) {
                    return true;
                }
                return false;
            });

            setRequests(activeRequests);
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

    const handleAction = async (id, action) => {
        if (action === 'rejected') {
            setSelectedRequestId(id);
            setRejectionModalOpen(true);
            return;
        }

        // Find request
        const req = requests.find(r => r.id === id);

        setConfirmModal({
            isOpen: true,
            title: "Qabul qilasizmi?",
            message: (
                <div className="space-y-3 text-gray-600 dark:text-gray-300">
                    <p>Siz ushbu jihozni o'z nomingizga qabul qilmoqchisiz:</p>
                    {req && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm border border-blue-100 dark:border-blue-800/50">
                            <div className="flex justify-between mb-1">
                                <span className="text-gray-500 dark:text-gray-400">Jihoz:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{req.item?.name}</span>
                            </div>
                            <div className="flex justify-between mb-1">
                                <span className="text-gray-500 dark:text-gray-400">Model:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{req.item?.model || '-'}</span>
                            </div>
                            <div className="flex justify-between mb-1">
                                <span className="text-gray-500 dark:text-gray-400">Seriya:</span>
                                <span className="font-mono text-gray-900 dark:text-white">{req.item?.serialNumber || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Kimdan:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{req.requester?.name || "Admin"}</span>
                            </div>
                            {req.accountantDocument && (
                                <div className="mt-3 pt-2 border-t border-blue-200 dark:border-blue-800 flex justify-between items-center">
                                    <span className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1">
                                        <RiFileList3Line /> Asos hujjat:
                                    </span>
                                    <a
                                        href={getImageUrl(req.accountantDocument)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-medium underline"
                                    >
                                        Ko'rish (PDF)
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">Tasdiqlash orqali siz jihoz uchun javobgarlikni o'z zimmangizga olasiz.</p>
                </div>
            ),
            onConfirm: () => processAction(id, 'completed'),
            confirmText: "Ha, qabul qilaman",
            isDanger: false
        });
    };

    const processAction = async (id, status, description = null) => {
        setIsProcessing(true);
        try {
            await api.put(`/requests/${id}`, { status, description });
            toast.success(status === 'completed' ? "Jihoz qabul qilindi" : "Rad etildi");
            fetchRequests();
            if (rejectionModalOpen) {
                setRejectionModalOpen(false);
                setRejectionReason("");
                setSelectedRequestId(null);
            }
        } catch (error) {
            console.error("Action failed", error);
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
        processAction(selectedRequestId, 'rejected', rejectionReason);
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Yuklanmoqda...</div>;

    return (
        <div className="animate-in fade-in zoom-in duration-300 relative">
            <div className="mb-6">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 flex items-center gap-2">
                    <RiFileList3Line className="text-indigo-600 dark:text-indigo-400" />
                    Menga kelgan so'rovlar
                </h1>
                <p className="text-gray-500 dark:text-gray-400">Jihozlarni qabul qilish yoki rad etish</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-[20px] shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800 dark:bg-indigo-600 text-white">
                                <th className="py-4 px-6 font-semibold text-sm rounded-tl-lg">Sana</th>
                                <th className="py-4 px-6 font-semibold text-sm">Jihoz</th>
                                <th className="py-4 px-6 font-semibold text-sm">Kimdan</th>
                                <th className="py-4 px-6 font-semibold text-sm">Holat</th>
                                <th className="py-4 px-6 font-semibold text-sm text-right rounded-tr-lg">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-10 text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <RiCheckDoubleLine size={40} className="text-green-100" />
                                            <span>Hozircha yangi so'rovlar yo'q</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                requests.map(req => (
                                    <tr key={req.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="py-4 px-6 text-gray-600 dark:text-gray-400 text-sm">
                                            {new Date(req.createdAt).toLocaleString('uz-UZ')}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="font-medium text-gray-900 dark:text-gray-100">{req.item?.name}</div>
                                            <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">{req.item?.serialNumber}</div>
                                        </td>
                                        <td className="py-4 px-6 text-gray-700 text-sm">
                                            <div className="flex items-center gap-2">
                                                <UserAvatar user={req.requester} />
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-gray-100">{req.requester?.name || "Admin"}</div>
                                                    <div className="text-xs text-gray-400 dark:text-gray-500">({req.requester?.role})</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm">
                                            {req.status === 'pending_accountant' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                                    <RiTimeLine className="mr-1" /> Hisobchi tasdiqlashi kutilmoqda
                                                </span>
                                            ) : req.status === 'pending_employee' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                                    <RiCheckDoubleLine className="mr-1" /> Qabul qilishingiz kutilmoqda
                                                </span>
                                            ) : (
                                                <span className="text-gray-500">{req.status}</span>
                                            )}
                                            {req.description && <div className="text-xs text-gray-400 mt-1 italic">"{req.description}"</div>}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            {req.status === 'pending_employee' ? (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleAction(req.id, 'rejected')}
                                                        className="btn btn-sm bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 border-red-200 dark:border-red-800"
                                                        disabled={isProcessing}
                                                    >
                                                        <RiCloseCircleLine /> Rad etish
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(req.id, 'completed')}
                                                        className="btn btn-sm bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200"
                                                        disabled={isProcessing}
                                                    >
                                                        <RiCheckDoubleLine /> Qabul qilish
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Amal talab etilmaydi</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Rejection Modal */}
            {rejectionModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-md mx-4 border border-transparent dark:border-slate-700">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Rad etish sababi</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Nega bu so'rovni rad etyapsiz? Izoh qoldirish majburiy.</p>
                        <textarea
                            className="w-full h-32 p-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none text-sm dark:bg-slate-900 dark:text-white"
                            placeholder="Masalan: Jihoz menga tegishli emas..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            autoFocus
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => setRejectionModalOpen(false)}
                                className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium text-sm"
                            >
                                Bekor qilish
                            </button>
                            <button
                                onClick={submitRejection}
                                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg shadow-lg shadow-red-200 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!rejectionReason.trim() || isProcessing}
                            >
                                {isProcessing ? "..." : "Rad etish"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirmModal}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                isDanger={confirmModal.isDanger}
            />
        </div>
    );
};

export default EmployeeRequestsPage;
