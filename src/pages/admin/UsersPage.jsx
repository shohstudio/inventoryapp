import { useState, useEffect } from "react";
import { RiAddLine, RiSearchLine, RiMore2Fill, RiUserLine, RiShieldKeyholeLine, RiDeleteBinLine, RiCalculatorLine } from "react-icons/ri";
import Pagination from "../../components/common/Pagination";
import UserModal from "../../components/admin/UserModal";
import UserItemsModal from "../../components/admin/UserItemsModal";
import { useLanguage } from "../../context/LanguageContext";
import api, { BASE_URL, getImageUrl } from "../../api/axios";
import { toast } from "react-hot-toast";
import ConfirmationModal from "../../components/common/ConfirmationModal";

const UsersPage = () => {
    const { t } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);
    const [selectedUserForItems, setSelectedUserForItems] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null, isDanger: false });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Search
    const [searchQuery, setSearchQuery] = useState("");

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users', {
                params: {
                    page: currentPage,
                    limit: 20,
                    search: searchQuery
                }
            });

            if (res.data.users) {
                setUsers(res.data.users);
                setTotalPages(res.data.metadata.totalPages);
                setTotalItems(res.data.metadata.total);
            } else {
                setUsers(res.data); // Fallback
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Foydalanuvchilarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Debounce search
        const timeout = setTimeout(() => {
            fetchUsers();
        }, 500);
        return () => clearTimeout(timeout);
    }, [currentPage, searchQuery]);

    const handleSaveUser = async (userData) => {
        try {
            const formData = new FormData();

            // Append all fields except imageFile
            Object.keys(userData).forEach(key => {
                if (key !== 'imageFile' && userData[key] !== null && userData[key] !== undefined) {
                    formData.append(key, userData[key]);
                }
            });

            // Append image if exists
            if (userData.imageFile) {
                formData.append('image', userData.imageFile);
            }

            if (selectedUser) {
                // Update existing
                const res = await api.put(`/users/${selectedUser.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setUsers(users.map(u => u.id === selectedUser.id ? res.data : u));
                toast.success("Foydalanuvchi yangilandi");
            } else {
                // Create new
                const res = await api.post('/users', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setUsers([...users, res.data]);
                toast.success("Yangi foydalanuvchi qo'shildi");
            }
        } catch (error) {
            console.error("Save user error:", error);
            const message = error.response?.data?.message || "Saqlashda xatolik yuz berdi";
            toast.error(message);
        }
    };

    const handleDeleteUser = async (id) => {
        setConfirmModal({
            isOpen: true,
            title: t('confirm_delete_title_single'),
            message: t('confirm_delete_message_single'),
            confirmText: t('yes_delete'),
            cancelText: t('cancel'),
            isDanger: true,
            onConfirm: () => confirmDeleteUser(id)
        });
    };

    const confirmDeleteUser = async (id) => {
        try {
            await api.delete(`/users/${id}`);
            setUsers(users.filter(u => u.id !== id));
            toast.success("Foydalanuvchi o'chirildi");
        } catch (error) {
            console.error("Delete user error:", error);
            toast.error("O'chirishda xatolik");
        }
    };

    const openModal = (user = null) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const openItemsModal = (user) => {
        setSelectedUserForItems(user);
        setIsItemsModalOpen(true);
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Yuklanmoqda...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                        {t('users')}
                    </h1>
                    <p className="text-gray-500">Tizim foydalanuvchilarini boshqarish</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="btn btn-primary shadow-lg shadow-indigo-200"
                >
                    <RiAddLine size={20} />
                    {t('add_new')}
                </button>
            </div>

            <div className="card border-0 shadow-lg shadow-gray-100/50">
                <div className="mb-6 relative max-w-md">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <RiSearchLine size={18} />
                    </span>
                    <input
                        type="text"
                        placeholder={t('search')}
                        className="input pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-[20px] shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden mt-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-blue-600 dark:bg-indigo-600 text-white">
                                    <th className="py-4 px-6 font-semibold text-sm rounded-tl-lg">{t('name')}</th>
                                    <th className="py-4 px-6 font-semibold text-sm">ID Raqami</th>
                                    <th className="py-4 px-6 font-semibold text-sm">Bo'lim</th>
                                    <th className="py-4 px-6 font-semibold text-sm">Role</th>
                                    <th className="py-4 px-6 font-semibold text-sm">Holati</th>
                                    <th className="py-4 px-6 font-semibold text-sm text-right rounded-tr-lg">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-700/50 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold overflow-hidden border border-gray-100 dark:border-slate-700">
                                                    {user.image ? (
                                                        <img
                                                            src={getImageUrl(user.image)}
                                                            alt={user.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        user.name.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <div
                                                        className="font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-colors"
                                                        onClick={() => openItemsModal(user)}
                                                    >
                                                        {user.name}
                                                    </div>
                                                    <div className="text-xs text-indigo-500 font-mono">@{user.username}</div>
                                                    <div className="text-xs text-gray-400">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-mono text-xs text-gray-500 dark:text-gray-400 font-bold">{user.employeeId || "-"}</td>
                                        <td className="py-4 px-6 text-gray-600 dark:text-gray-300">{user.department}</td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                                                {user.role === 'admin' ? (
                                                    <RiShieldKeyholeLine className="text-indigo-500" />
                                                ) : user.role === 'accounter' ? (
                                                    <RiCalculatorLine className="text-blue-500" />
                                                ) : (
                                                    <RiUserLine />
                                                )}
                                                <span className="capitalize">
                                                    {t(`role_${user.role}`)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${user.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
                                                }`}>
                                                {user.status === 'active' ? 'Faol' : 'Nofaol'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right flex justify-end gap-2">
                                            <button
                                                onClick={() => openModal(user)}
                                                className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors opacity-100"
                                                title="Tahrirlash"
                                            >
                                                <RiMore2Fill size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="O'chirish"
                                            >
                                                <RiDeleteBinLine size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    {users.length > 0 && (
                        <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex justify-end">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={(page) => setCurrentPage(page)}
                            />
                        </div>
                    )}
                </div>
            </div>

            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveUser}
                user={selectedUser}
            />

            <UserItemsModal
                isOpen={isItemsModalOpen}
                onClose={() => setIsItemsModalOpen(false)}
                user={selectedUserForItems}
            />

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                isDanger={confirmModal.isDanger}
            />
        </div>
    );
};

export default UsersPage;
