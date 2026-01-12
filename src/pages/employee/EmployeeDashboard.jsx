import { useNavigate, Link } from "react-router-dom";
import { RiFileListLine, RiAlertLine, RiNotification3Line, RiCheckDoubleLine, RiTimeLine } from "react-icons/ri";
import { useAuth } from "../../context/AuthContext";
import StatsCard from "../../components/admin/StatsCard";
import { useState, useEffect } from "react"; // Added imports

const EmployeeDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate(); // Hook for navigation
    const [myItemsCount, setMyItemsCount] = useState(0); // State for real count
    const [totalValue, setTotalValue] = useState(0); // State for total value
    const [recentItems, setRecentItems] = useState([]);

    // Fetch Real Items
    useEffect(() => {
        if (user) {
            const allItems = JSON.parse(localStorage.getItem("inventory_items") || "[]");

            // Filter logic: Match by assignedTo (name) OR assignedPINFL
            // Note: In real app, we should use User ID. Here we use Name/PINFL as per existing logic.
            const myItems = allItems.filter(item =>
                (item.assignedTo === user.name) ||
                (user.pinfl && item.assignedPINFL === user.pinfl)
            );

            setMyItemsCount(myItems.length);

            // Calculate Total Value
            const total = myItems.reduce((sum, item) => {
                let priceStr = (item.price || "0").toString().replace(/\s/g, '').replace(',', '.');
                const price = parseFloat(priceStr) || 0;
                const quantity = parseInt(item.quantity) || 1;
                return sum + (price * quantity);
            }, 0);
            setTotalValue(total);

            // Get recent 3 items for the table
            // Assuming higher ID means newer, or we could sort by assignedDate if it existed.
            // For now, reverse the array to show latest additions first.
            setRecentItems(myItems.slice(-3).reverse().map(item => ({
                id: item.id,
                name: item.name,
                assignedDate: item.purchaseDate || "Noma'lum", // Fallback to purchaseDate or placeholder
                status: item.status === 'working' ? 'active' : 'repair'
            })));
        }
    }, [user]);

    // Format utility
    const formatPrice = (price) => {
        return price.toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                    Xush kelibsiz, {user?.name || "Xodim"}!
                </h1>
                <p className="text-gray-500 mt-1">
                    Bugun {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                    title="Mening jihozlarim"
                    value={myItemsCount} // REAL VALUE
                    icon={<RiFileListLine size={24} />}
                    variant="featured"
                    onClick={() => navigate("/employee/items")} // ADDED NAVIGATION
                    // Footer shows Total Value
                    footer={<span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-1 rounded">Jami: {formatPrice(totalValue)} so'm</span>}
                />
                <StatsCard
                    title="Faol so'rovlar"
                    value="0" // Keep mock or implement real if needed
                    icon={<RiAlertLine size={24} />}
                    variant="featured"
                    onClick={() => navigate("/employee/report")}
                    trend={0}
                    trendLabel="faol"
                />
                <StatsCard
                    title="Xabarnomalar"
                    value="3"
                    icon={<RiNotification3Line size={24} />}
                    variant="featured"
                    onClick={() => { }}
                    trend={3}
                    trendLabel="yangilik"
                />
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Recent Items List (Table Style) */}
                <div className="lg:col-span-2 bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-900">Oxirgi biriktirilgan jihozlar</h2>
                        <Link to="/employee/items" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                            Barchasini ko'rish
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-blue-600 text-white">
                                    <th className="py-4 px-6 font-semibold text-sm rounded-tl-lg">Jihoz Nomi</th>
                                    <th className="py-4 px-6 font-semibold text-sm">Sana</th>
                                    <th className="py-4 px-6 font-semibold text-sm rounded-tr-lg">Holati</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentItems.length > 0 ? (
                                    recentItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="py-4 px-6 font-medium text-gray-800">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-200">
                                                        <RiFileListLine size={16} />
                                                    </div>
                                                    {item.name}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-gray-600">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <RiTimeLine size={14} className="text-gray-400" />
                                                    {item.assignedDate}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {item.status === 'active' ? 'Faol' : 'Ta\'mirda'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="py-6 text-center text-gray-500">
                                            Sizga hali jihoz biriktirilmagan
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Actions / Announcements */}
                <div className="card border-0 shadow-lg shadow-gray-100/50 flex flex-col justify-between overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full translate-x-10 -translate-y-10 opacity-50"></div>

                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Eslatma</h2>
                        <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 mb-4">
                            <h3 className="font-bold text-blue-800 flex items-center gap-2 mb-2">
                                <RiCheckDoubleLine /> Inventarizatsiya
                            </h3>
                            <p className="text-sm text-blue-600 leading-relaxed">
                                Hurmatli xodim, keyingi oy boshida yillik inventarizatsiya o'tkaziladi.
                                Iltimos, o'z jihozlaringizni to'liqligini tekshirib chiqing.
                            </p>
                        </div>
                    </div>

                    <Link to="/employee/report" className="btn btn-primary w-full justify-center shadow-lg shadow-indigo-200 mt-4">
                        <RiAlertLine size={18} />
                        Muammo xabar berish
                    </Link>
                </div>

            </div>
        </div>
    );
};

export default EmployeeDashboard;
