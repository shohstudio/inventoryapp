import { useNavigate, Link } from "react-router-dom";
import { RiFileListLine, RiAlertLine, RiNotification3Line, RiCheckDoubleLine, RiTimeLine } from "react-icons/ri";
import { useAuth } from "../../context/AuthContext";
import StatsCard from "../../components/admin/StatsCard";
import { useState, useEffect } from "react";
import api from "../../api/axios";

const EmployeeDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate(); // Hook for navigation
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [myItemsCount, setMyItemsCount] = useState(0);
    const [totalValue, setTotalValue] = useState(0);
    const [recentItems, setRecentItems] = useState([]);

    // Fetch Real Items & Pending Requests
    useEffect(() => {
        if (user) {
            const fetchData = async () => {
                try {
                    const [itemsRes, requestsRes] = await Promise.all([
                        // Fetch ONLY items assigned to this user, with a high limit to get all for stats
                        api.get("/items", {
                            params: {
                                assignedUserId: user.id,
                                limit: 1000
                            }
                        }),
                        api.get("/requests?status=pending_employee")
                    ]);

                    // Check for pending requests
                    const pendingRequests = requestsRes.data.requests || requestsRes.data; // Handle pagination structure
                    if (pendingRequests && pendingRequests.length > 0) {
                        setPendingCount(pendingRequests.length);
                        setShowConfirmModal(true);
                    }

                    // Handle paginated response structure ({ items, metadata } or array)
                    const myItems = itemsRes.data.items || itemsRes.data;

                    setMyItemsCount(myItems.length);

                    // Calculate Total Value
                    const total = myItems.reduce((sum, item) => {
                        let price = parseFloat(item.price) || 0;
                        const quantity = parseInt(item.quantity) || 1;
                        return sum + (price * quantity);
                    }, 0);
                    setTotalValue(total);

                    // Get recent 3 items
                    setRecentItems(myItems.slice(-3).reverse().map(item => ({
                        id: item.id,
                        name: item.name,
                        assignedDate: item.assignedDate ? new Date(item.assignedDate).toLocaleDateString('uz-UZ') : "Noma'lum",
                        status: item.status === 'working' ? 'active' : 'repair'
                    })));

                } catch (error) {
                    console.error("Failed to fetch dashboard data", error);
                }
            };
            fetchData();
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
            {/* Notification Modal for Employee */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-in fade-in zoom-in duration-300 border border-blue-100">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-blue-50">
                                <RiCheckDoubleLine size={40} />
                            </div>

                            <h2 className="text-3xl font-bold text-gray-800 mb-2">
                                Tasdiqlash Kerak!
                            </h2>

                            <p className="text-lg text-gray-500 mb-8 max-w-xs">
                                Sizning nomingizga <span className="font-bold text-blue-600">{pendingCount} ta</span> yangi jihoz biriktirilmoqda. Iltimos, qabul qilib oling.
                            </p>

                            <div className="grid grid-cols-2 gap-4 w-full">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="py-3 px-6 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold transition-colors"
                                >
                                    Keyinroq
                                </button>
                                <button
                                    onClick={() => navigate('/employee/requests')}
                                    className="py-3 px-6 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 font-semibold transition-transform active:scale-95"
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

export default EmployeeDashboard;
