import { useState, useEffect } from "react";
import { RiBox3Line, RiUserLine, RiAlertLine, RiMoneyDollarCircleLine, RiDeleteBinLine } from "react-icons/ri";
import StatsCard from "../../components/admin/StatsCard";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
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
                <h1 className="text-2xl font-bold text-gray-800">Boshqaruv Paneli</h1>
                <p className="text-gray-500">Bugungi statistika va muhim o'zgarishlar</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    title="Jami Jihozlar"
                    value={inventoryStats.totalItems}
                    icon={<RiBox3Line size={24} />}
                    trend={12}
                    trendLabel="o'tgan oyga nisbatan"
                    color="indigo"
                    onClick={() => navigate("/admin/inventory")}
                />

                {user?.role === 'admin' && (
                    <StatsCard
                        title="Foydalanuvchilar"
                        value={userCount}
                        icon={<RiUserLine size={24} />}
                        trend={5}
                        trendLabel="yangi xodimlar"
                        color="blue"
                        onClick={() => navigate("/admin/users")}
                    />
                )}

                <StatsCard
                    title="Ta'mir talab jihozlar"
                    value={inventoryStats.repairItems}
                    icon={<RiAlertLine size={24} />}
                    trend={-2}
                    trendLabel="kamaydi"
                    color="orange"
                    onClick={() => navigate("/admin/inventory", { state: { filter: "repair" } })}
                />
                <StatsCard
                    title="Ro'yxatdan chiqarilgan"
                    value={inventoryStats.writtenOffItems}
                    icon={<RiDeleteBinLine size={24} />}
                    trend={inventoryStats.writtenOffItems > 0 ? "+1" : "0"}
                    trendLabel="yangi"
                    color="red"
                    onClick={() => navigate("/admin/inventory", { state: { filter: "written-off" } })}
                />
                <StatsCard
                    title="Umumiy Qiymat"
                    value={`${formatValue(inventoryStats.totalValue)} so'm`}
                    icon={<RiMoneyDollarCircleLine size={24} />}
                    trend={8.2}
                    trendLabel="o'sish"
                    color="green"
                />
            </div>

            {/* Recent Activity & Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 card">
                    <h3 className="font-bold text-gray-800 mb-4">Jihozlar Holati Statistikasi</h3>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-400">
                        Chart Placeholder (Recharts integratsiyasi)
                    </div>
                </div>

                <div className="card">
                    <h3 className="font-bold text-gray-800 mb-4">Saytdagi yangiliklar (Logs)</h3>
                    <div className="space-y-4">
                        {logs.length > 0 ? (
                            logs.map((log) => (
                                <div key={log.id} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${log.userRole === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                        {log.userName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">
                                            {log.userName} <span className="font-normal text-gray-500">{log.itemName}ni {log.action}</span>
                                        </p>
                                        <p className="text-xs text-gray-400">{timeAgo(log.timestamp)}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-400 text-center py-4">Hozircha yangiliklar yo'q</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
