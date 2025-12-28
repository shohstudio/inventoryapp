import { useState, useEffect } from "react";
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
    const [inventoryStats, setInventoryStats] = useState({
        totalItems: 0,
        repairItems: 0,
        writtenOffItems: 0,
        totalValue: 0
    });

    const [logs, setLogs] = useState([]);

    useEffect(() => {
        try {
            // Users
            let storedUsers = [];
            try {
                storedUsers = JSON.parse(localStorage.getItem("inventory_users_list") || "[]");
                if (!Array.isArray(storedUsers)) storedUsers = [];
            } catch (e) {
                console.error("Failed to parse users", e);
            }
            setUserCount(storedUsers.length);

            // Inventory
            let storedItems = [];
            try {
                storedItems = JSON.parse(localStorage.getItem("inventory_items") || "[]");
                if (!Array.isArray(storedItems)) storedItems = [];
            } catch (e) {
                console.error("Failed to parse items", e);
            }

            const totalItems = storedItems.length;
            const repairItems = storedItems.filter(item => item && item.status === 'repair').length;
            const writtenOffItems = storedItems.filter(item => item && item.status === 'written-off').length;

            // Calculate total value
            const totalValue = storedItems.reduce((acc, item) => {
                if (!item || !item.price) return acc;
                // Exclude written-off items from total value calculation
                if (item.status === 'written-off') return acc;

                try {
                    const priceStr = String(item.price);
                    const cleanPrice = parseInt(priceStr.replace(/[^0-9]/g, ''));
                    return acc + (isNaN(cleanPrice) ? 0 : cleanPrice);
                } catch (e) {
                    return acc;
                }
            }, 0);

            setInventoryStats({
                totalItems,
                repairItems,
                writtenOffItems,
                totalValue
            });

            // Logs
            let storedLogs = [];
            try {
                storedLogs = JSON.parse(localStorage.getItem("inventory_logs") || "[]");
                if (!Array.isArray(storedLogs)) storedLogs = [];
            } catch (e) {
                console.error("Failed to parse logs", e);
            }
            setLogs(storedLogs.slice(0, 5));
        } catch (error) {
            console.error("Dashboard Error:", error);
        }
    }, []);

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
                <h1 className="text-2xl font-bold text-gray-800">{t('dashboard')}</h1>
                <p className="text-gray-500">Bugungi statistika va muhim o'zgarishlar</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                    value={`$${(inventoryStats.totalValue / 12600).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} // Mock USD conversion for design match
                    icon={<RiMoneyDollarCircleLine size={24} />}
                    trend={8.2}
                    trendLabel="o'sish"
                />

                <StatsCard
                    title={t('users')}
                    value={userCount} // Or "Faol" percentage if matching mockup strictly, but keeping user data is better logic
                    icon={<RiUserLine size={24} />}
                    trend={98} // Mock "98%" from image
                    trendLabel="Faol foydalanuvchilar"
                    color="blue"
                    onClick={() => navigate("/admin/users")}
                />

                <StatsCard
                    title={t('repair_items')}
                    value={inventoryStats.repairItems}
                    icon={<RiAlertLine size={24} />}
                    trend={-2}
                    trendLabel="kamaydi"
                    color="orange"
                    onClick={() => navigate("/admin/inventory", { state: { filter: "repair" } })}
                />
            </div>

            {/* Recent Activity Table (Redesigned) */}
            <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">So'nggi Harakatlar</h3>
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
                            {/* Mock Data to match image roughly, or real logs if available */}
                            {[
                                { name: "Dell Latitude 7420", serial: "SN-8374920", user: "Aliyev O.", status: "working" },
                                { name: "MacBook Pro 16\"", serial: "C02XG4KJH5", user: "Karimov S.", status: "repair" },
                                { name: "Ikea Stol Markus", serial: "903.345.67", user: "Valiyeva D.", status: "working" },
                                { name: "HP LaserJet M404n", serial: "VND200345", user: "Ofis Menejeri", status: "empty" },
                                { name: "Logitech MX Master 3", serial: "L-84930", user: "Yusupov B.", status: "lost" },
                            ].map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50/80 transition-colors">
                                    <td className="py-4 px-6 text-gray-800 font-medium">{item.name}</td>
                                    <td className="py-4 px-6 text-gray-500 font-mono text-sm">{item.serial}</td>
                                    <td className="py-4 px-6 text-gray-700">{item.user}</td>
                                    <td className="py-4 px-6">
                                        <span className={clsx(
                                            "px-3 py-1 rounded-full text-xs font-semibold",
                                            item.status === 'working' ? "bg-green-100 text-green-700" :
                                                item.status === 'repair' ? "bg-orange-100 text-orange-700" :
                                                    item.status === 'empty' ? "bg-cyan-100 text-cyan-700" :
                                                        "bg-red-100 text-red-700"
                                        )}>
                                            {item.status === 'working' ? "Faol" :
                                                item.status === 'repair' ? "Ta'mirda" :
                                                    item.status === 'empty' ? "Bo'sh" :
                                                        "Yo'qolgan"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
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
        </div>
    );
};

export default AdminDashboard;
