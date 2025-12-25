import { Link } from "react-router-dom";
import { RiFileListLine, RiAlertLine, RiNotification3Line, RiCheckDoubleLine, RiTimeLine } from "react-icons/ri";
import { useAuth } from "../../context/AuthContext";

const EmployeeDashboard = () => {
    const { user } = useAuth();

    // Mock Data
    const stats = [
        { title: "Mening jihozlarim", value: "12", icon: <RiFileListLine size={24} />, color: "bg-indigo-50 text-indigo-600", link: "/employee/items" },
        { title: "Faol so'rovlar", value: "1", icon: <RiAlertLine size={24} />, color: "bg-orange-50 text-orange-600", link: "/employee/report" },
        { title: "Xabarnomalar", value: "3", icon: <RiNotification3Line size={24} />, color: "bg-blue-50 text-blue-600", link: "#" },
    ];

    const recentItems = [
        { id: 1, name: "MacBook Pro M1", assignedDate: "2023-10-15", status: "active" },
        { id: 2, name: "Monitor Dell 27\"", assignedDate: "2023-11-01", status: "active" },
        { id: 3, name: "Ofis stuli", assignedDate: "2023-09-20", status: "repair" },
    ];

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
                {stats.map((stat, index) => (
                    <Link
                        to={stat.link}
                        key={index}
                        className="card border-0 shadow-lg shadow-gray-100/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-2xl ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm font-medium">{stat.title}</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Recent Items List */}
                <div className="lg:col-span-2 card border-0 shadow-lg shadow-gray-100/50">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Oxirgi biriktirilgan jihozlar</h2>
                        <Link to="/employee/items" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                            Barchasini ko'rish
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {recentItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-gray-400 border border-gray-100">
                                        <RiFileListLine size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800">{item.name}</h4>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <RiTimeLine size={12} />
                                            <span>{item.assignedDate}</span>
                                        </div>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                    }`}>
                                    {item.status === 'active' ? 'Faol' : 'Ta\'mirda'}
                                </span>
                            </div>
                        ))}
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
