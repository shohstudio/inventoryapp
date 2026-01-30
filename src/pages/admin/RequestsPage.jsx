import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { toast } from "react-hot-toast";
import { RiFileList3Line, RiCheckDoubleLine, RiTimeLine, RiCloseCircleLine, RiUserStarLine, RiShieldCheckLine } from "react-icons/ri";
import RequestDetailModal from "../../components/admin/RequestDetailModal";
import ConfirmationModal from "../../components/common/ConfirmationModal";

const RequestsPage = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'assignment'); // 'assignment' or 'exit'
    const [isProcessing, setIsProcessing] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/requests', {
                params: { page, limit: 50 }
            });

            if (data.requests) {
                setRequests(data.requests);
                setTotalPages(data.metadata?.totalPages || 1);
            } else {
                // Fallback for old API just in case
                setRequests(data);
            }
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
    }, [page]); // Re-fetch on page change

    const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");

    const [selectedRequestId, setSelectedRequestId] = useState(null);

    // Detail Modal State
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedRequestForDetail, setSelectedRequestForDetail] = useState(null);

    const openDetailModal = (req) => {
        setSelectedRequestForDetail(req);
        setIsDetailModalOpen(true);
    };

    const closeDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedRequestForDetail(null);
    };

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: null, // Can be JSX
        onConfirm: () => { },
        confirmText: "Tasdiqlash",
        isDanger: false
    });

    const closeConfirmModal = () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    const handleApproveFromModal = (id, status, file = null) => {
        handleUpdateStatus(id, status, 'mock_signature_from_modal', null, file);
        closeDetailModal();
    };

    const handleRejectFromModal = (id) => {
        closeDetailModal();
        setSelectedRequestId(id);
        setRejectionModalOpen(true);
    };

    const handleUpdateStatus = async (id, newStatus, signature = null, description = null, file = null) => {
        if (newStatus === 'rejected' && !description) {
            // Open modal for rejection reason
            setSelectedRequestId(id);
            setRejectionModalOpen(true);
            return;
        }

        // Check if we need confirmation (only for approval/rejection actions if description is present or approval)
        // If coming from Modal with file, we might skip or show partial?
        // Let's implement the specific "Modern Confirmation" requested.

        // If it's a direct status change (like clicking Approve in table or modal), show confirmation
        // But we need to handle the params (id, status, file, signature)

        // Helper to run the actual API call
        const executeUpdate = async () => {
            setIsProcessing(true);
            try {
                let data;
                const config = {};

                if (file) {
                    const formData = new FormData();
                    formData.append('status', newStatus);
                    if (signature) formData.append('signature', signature);
                    if (description) formData.append('description', description);
                    formData.append('file', file);
                    data = formData;
                    config.headers = { 'Content-Type': 'multipart/form-data' };
                } else {
                    data = { status: newStatus, signature, description };
                }

                await api.put(`/requests/${id}`, data, config);
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

        if (newStatus !== 'rejected') {
            // Find request details for the modal
            const req = requests.find(r => r.id === id);

            setConfirmModal({
                isOpen: true,
                title: "Tasdiqlaysizmi?",
                message: (
                    <div className="space-y-3">
                        <p className="text-gray-600">Siz ushbu harakatni tasdiqlamoqchisiz:</p>
                        {req && (
                            <div className="bg-gray-50 p-3 rounded-lg text-sm border border-gray-100">
                                <div className="flex justify-between mb-1">
                                    <span className="text-gray-500">Jihoz:</span>
                                    <span className="font-medium text-gray-900">{req.item?.name}</span>
                                </div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-gray-500">Model:</span>
                                    <span className="font-medium text-gray-900">{req.item?.model || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Foydalanuvchi:</span>
                                    <span className="font-medium text-gray-900">
                                        {req.type === 'exit'
                                            ? (req.description?.match(/Olib chiquvchi: ([^.]+)/)?.[1] || "Aniqlanmadi")
                                            : (req.targetUser?.name || "Bino")}
                                    </span>
                                </div>
                            </div>
                        )}
                        <p className="text-xs text-gray-400">Tasdiqlaganingizdan so'ng, ushbu jihoz foydalanuvchiga biriktiriladi (yoki ruxsat beriladi).</p>
                    </div>
                ),
                onConfirm: executeUpdate,
                confirmText: "Ha, tasdiqlash",
                isDanger: false
            });
            return;
        }

        // If rejected (with reason), we proceed directly to executeUpdate as we already showed the rejection modal
        await executeUpdate();
    };

    // Cleaned up original execute logic (moved inside) so removing the rest 
    /* 
    setIsProcessing(true);
    try {
       ...
    } 
    */
    // Wait, I need to completely replace the function body to avoid duplication. 
    // The replace_file_content tool replaces a BLOCK. 
    // I will rewrite the entire handleUpdateStatus function to be safe.


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
                                        <td className="py-4 px-6 cursor-pointer group" onClick={() => openDetailModal(req)}>
                                            <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{req.item?.name}</div>
                                            <div className="text-xs text-gray-400 font-mono">{req.item?.serialNumber}</div>
                                        </td>
                                        <td className="py-4 px-6 text-gray-700 text-sm">
                                            {req.type === 'exit' ? (
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">{req.item?.assignedTo?.name || "Noma'lum"}</span>
                                                    <span className="text-xs text-gray-400">Egasi</span>
                                                </div>
                                            ) : (
                                                req.requester?.name
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            {req.type === 'exit' ? (
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">
                                                        {req.description?.match(/Olib chiquvchi: ([^.]+)/)?.[1] || "Aniqlanmadi"}
                                                    </span>
                                                    <span className="text-xs text-orange-500">Olib ketmoqda</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="font-medium text-gray-900">{req.targetUser?.name || "Bino"}</div>
                                                    {req.targetUser?.pinfl && <div className="text-xs text-gray-500 font-mono">PINFL: {req.targetUser.pinfl}</div>}
                                                </>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            {getStatusBadge(req.status)}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            {/* Logic for Accountant Approval */}
                                            {user.role === 'accounter' && req.status === 'pending_accountant' && user.role !== 'stat' && (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleUpdateStatus(req.id, 'rejected')}
                                                        className="btn btn-sm bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                                                        disabled={isProcessing}
                                                    >
                                                        Rad etish
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(req.id, req.type === 'exit' ? 'approved' : 'pending_employee', 'mock_signature_XYZ')}
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-gray-700"
                    >
                        Ortga
                    </button>
                    <span className="text-gray-600 font-medium">Sahifa {page} / {totalPages}</span>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-gray-700"
                    >
                        Oldinga
                    </button>
                </div>
            )}


            {/* Rejection Modal */}
            {
                rejectionModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
                        <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Rad etish sababi</h3>
                            <p className="text-sm text-gray-500 mb-2">Nega bu so'rovni rad etyapsiz? Izoh qoldirish majburiy.</p>
                            <textarea
                                className="w-full h-32 mb-4 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none bg-gray-50 text-gray-800"
                                placeholder="Masalan: Jihoz menga tegishli emas..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRejectionModalOpen(false)}
                                    className="btn btn-ghost text-gray-500 cursor-pointer"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    type="button"
                                    onClick={submitRejection}
                                    className={`btn bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200 cursor-pointer ${(!rejectionReason.trim() || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={!rejectionReason.trim() || isProcessing}
                                >
                                    {isProcessing ? "..." : "Rad etish"}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Detail Modal */}
            <RequestDetailModal
                isOpen={isDetailModalOpen}
                onClose={closeDetailModal}
                request={selectedRequestForDetail}
                onApprove={handleApproveFromModal}
                onReject={handleRejectFromModal}
                isProcessing={isProcessing}
                userRole={user?.role}
            />

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

export default RequestsPage;


