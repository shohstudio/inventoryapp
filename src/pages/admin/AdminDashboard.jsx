import { useState, useEffect } from "react";
import api from "../../api/axios";
import { RiBox3Line, RiUserLine, RiAlertLine, RiMoneyDollarCircleLine, RiDeleteBinLine } from "react-icons/ri";
import clsx from "clsx";
import StatsCard from "../../components/admin/StatsCard";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useLanguage();
    const [userCount, setUserCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [inventoryStats, setInventoryStats] = useState({
        totalItems: 0,
        repairItems: 0,
        writtenOffItems: 0,
        totalValue: 0,
        recentItems: []
    });
    const [logs, setLogs] = useState([]);

    const [showPendingModal, setShowPendingModal] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, itemsRes] = await Promise.all([
                    api.get("/users"),
                    api.get("/items")
                ]);

                // Check for pending requests if user is accounter
                if (user?.role === 'accounter') {
                    try {
                        const { data: requests } = await api.get('/requests?status=pending_accountant');
                        const count = requests.length;
                        if (count > 0) {
                            setPendingCount(count);
                            setShowPendingModal(true);
                        }
                    } catch (err) {
                        console.error("Failed to fetch pending requests", err);
                    }
                }

                // Users
                setUserCount(usersRes.data.length);

                // Inventory
                const items = itemsRes.data;

                const totalItems = items.length;
                const repairItems = items.filter(item => item.status === 'repair').length;
                const writtenOffItems = items.filter(item => item.status === 'written-off').length;

                // Calculate total value
                const totalValue = items.reduce((acc, item) => {
                    // Exclude written-off items
                    if (item.status === 'written-off') return acc;

                    const price = parseFloat(item.price) || 0;
                    const quantity = parseInt(item.quantity) || 1;
                    return acc + (price * quantity);
                }, 0);

                setInventoryStats({
                    totalItems,
                    repairItems,
                    writtenOffItems,
                    totalValue,
                    recentItems: items.slice(0, 5) // Items are already ordered by desc in backend usually
                });

                // TODO: Connect to /api/logs when available
                setLogs([]);

            } catch (error) {
                console.error("Dashboard failed to load", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user?.role]); // Re-run if user role changes (login)

    // Format utility for large numbers
    const formatValue = (num) => {
        if (num >= 1000000000) return (num / 1000000000).toFixed(1) + " mlrd";
        if (num >= 1000000) return (num / 1000000).toFixed(1) + " mln";
        return num.toLocaleString();
    };

    const timeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return "Hozirgina";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} daqiqa oldin`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} soat oldin`;
        const days = Math.floor(hours / 24);
        return `${days} kun oldin`;
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('dashboard')}</h1>
                <p className="text-gray-500 dark:text-gray-400">Bugungi statistika va muhim o'zgarishlar</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <StatsCard
                    title={t('total_items')}
                    value={inventoryStats.totalItems}
                    icon={<RiBox3Line size={24} />}
                    trend={12}
                    trendLabel="o'tgan oyga nisbatan"
                    variant="featured"
                    onClick={() => navigate("/admin/inventory")}
                />

                <StatsCard
                    title={t('total_value')}
                    value={`${formatValue(inventoryStats.totalValue)} so'm`}
                    icon={<RiMoneyDollarCircleLine size={24} />}
                    trend={8.2}
                    trendLabel="o'sish"
                    variant="featured"
                    onClick={() => navigate("/admin/inventory")}
                />

                <StatsCard
                    title={t('users')}
                    value={userCount}
                    icon={<RiUserLine size={24} />}
                    trend={98}
                    trendLabel="Faol foydalanuvchilar"
                    variant="featured"
                    onClick={() => navigate("/admin/users")}
                />

                <StatsCard
                    title={t('repair_items')}
                    value={inventoryStats.repairItems}
                    icon={<RiAlertLine size={24} />}
                    trend={-2}
                    trendLabel="kamaydi"
                    variant="featured"
                    onClick={() => navigate("/admin/inventory", { state: { filter: "repair" } })}
                />

                <StatsCard
                    title={t('written_off_items')}
                    value={inventoryStats.writtenOffItems}
                    icon={<RiDeleteBinLine size={24} />}
                    trend={0}
                    trendLabel="o'zgarishsiz"
                    variant="featured"
                    onClick={() => navigate("/admin/inventory", { state: { filter: "written-off" } })}
                />
            </div>

            {/* Recent Activity Table (Redesigned) */}
            <div className="bg-white dark:bg-slate-800 rounded-[20px] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">So'nggi Harakatlar</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-600 text-white">
                                <th className="py-4 px-6 font-semibold text-sm rounded-tl-lg">Jihoz Nomi</th>
                                <th className="py-4 px-6 font-semibold text-sm">Seriya Raqami</th>
                                <th className="py-4 px-6 font-semibold text-sm">Javobgar Shaxs</th>
                                <th className="py-4 px-6 font-semibold text-sm rounded-tr-lg">Holati</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {inventoryStats.recentItems && inventoryStats.recentItems.length > 0 ? (
                                inventoryStats.recentItems.map((item, index) => (
                                    <tr key={item.id || index} className="hover:bg-gray-50/80 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="py-4 px-6 text-gray-800 dark:text-gray-200 font-medium">{item.name}</td>
                                        <td className="py-4 px-6 text-gray-500 dark:text-gray-400 font-mono text-sm">{item.model || "-"}</td>
                                        <td className="py-4 px-6 text-gray-700 dark:text-gray-300">{item.assignedTo?.name || "Omborda"}</td>
                                        <td className="py-4 px-6">
                                            <span className={clsx(
                                                "px-3 py-1 rounded-full text-xs font-semibold",
                                                item.status === 'working' ? "bg-green-100 text-green-700" :
                                                    item.status === 'repair' ? "bg-orange-100 text-orange-700" :
                                                        item.status === 'written-off' ? "bg-red-100 text-red-700" :
                                                            "bg-cyan-100 text-cyan-700"
                                            )}>
                                                {item.status === 'working' ? "Faol" :
                                                    item.status === 'repair' ? "Ta'mirda" :
                                                        item.status === 'written-off' ? "Hisobdan chiqarilgan" :
                                                            "Yangi"}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="py-6 text-center text-gray-500">
                                        Hozircha ma'lumot yo'q
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination Mock */}
                <div className="p-4 flex justify-end gap-2">
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50">‹</button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold border border-blue-100">1</button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50">›</button>
                </div>
            </div>
            {/* Notification Modal for Accountant */}
            {showPendingModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-in fade-in zoom-in duration-300 border border-indigo-100 dark:border-slate-700">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-orange-50">
                                <RiAlertLine size={40} />
                            </div>

                            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                                Diqqat! Yangi So'rovlar
                            </h2>

                            <p className="text-lg text-gray-500 dark:text-gray-300 mb-8 max-w-xs">
                                Sizda <span className="font-bold text-orange-600">{pendingCount} ta</span> tasdiqlanmagan chiqish so'rovi bor.
                            </p>

                            <div className="grid grid-cols-2 gap-4 w-full">
                                <button
                                    onClick={() => setShowPendingModal(false)}
                                    className="py-3 px-6 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold transition-colors dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                    Keyinroq
                                </button>
                                <button
                                    onClick={() => navigate('/admin/requests')}
                                    className="py-3 px-6 rounded-xl bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-200 font-semibold transition-transform active:scale-95"
                                >
                                    Ko'rish
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
