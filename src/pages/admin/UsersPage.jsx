import { useState, useEffect } from "react";
import { RiAddLine, RiSearchLine, RiMore2Fill, RiUserLine, RiShieldKeyholeLine, RiDeleteBinLine, RiCalculatorLine } from "react-icons/ri";
import UserModal from "../../components/admin/UserModal";
import { useLanguage } from "../../context/LanguageContext";
import api from "../../api/axios";
import { toast } from "react-hot-toast";

const UsersPage = () => {
    const { t } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Foydalanuvchilarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSaveUser = async (userData) => {
        try {
            if (selectedUser) {
                // Update existing
                const res = await api.put(`/users/${selectedUser.id}`, userData);
                setUsers(users.map(u => u.id === selectedUser.id ? res.data : u));
                toast.success("Foydalanuvchi yangilandi");
            } else {
                // Create new
                const res = await api.post('/users', userData);
                setUsers([...users, res.data]);
                toast.success("Yangi foydalanuvchi qo'shildi");
            }
        } catch (error) {
            console.error("Save user error:", error);
            // Handle specific backend error messages if available
            const message = error.response?.data?.message || "Saqlashda xatolik yuz berdi";
            toast.error(message);
        }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm("Rostdan ham bu foydalanuvchini o'chirmoqchimisiz?")) {
            try {
                await api.delete(`/users/${id}`);
                setUsers(users.filter(u => u.id !== id));
                toast.success("Foydalanuvchi o'chirildi");
            } catch (error) {
                console.error("Delete user error:", error);
                toast.error("O'chirishda xatolik");
            }
        }
    };

    const openModal = (user = null) => {
        setSelectedUser(user);
        setIsModalOpen(true);
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
                    />
                </div>

                <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden mt-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-blue-600 text-white">
                                    <th className="py-4 px-6 font-semibold text-sm rounded-tl-lg">{t('name')}</th>
                                    <th className="py-4 px-6 font-semibold text-sm">PINFL</th>
                                    <th className="py-4 px-6 font-semibold text-sm">Bo'lim</th>
                                    <th className="py-4 px-6 font-semibold text-sm">Role</th>
                                    <th className="py-4 px-6 font-semibold text-sm">Holati</th>
                                    <th className="py-4 px-6 font-semibold text-sm text-right rounded-tr-lg">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{user.name}</div>
                                                    <div className="text-xs text-indigo-500 font-mono">@{user.username}</div>
                                                    <div className="text-xs text-gray-400">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-mono text-xs text-gray-500">{user.pinfl}</td>
                                        <td className="py-4 px-6 text-gray-600">{user.department}</td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
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
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {user.status === 'active' ? 'Faol' : 'Nofaol'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right flex justify-end gap-2">
                                            <button
                                                onClick={() => openModal(user)}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-100"
                                                title="Tahrirlash"
                                            >
                                                <RiMore2Fill size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
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
                </div>
            </div>

            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveUser}
                user={selectedUser}
            />
        </div>
    );
};

export default UsersPage;
