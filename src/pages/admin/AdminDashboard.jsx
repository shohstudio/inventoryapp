import { RiBox3Line, RiUserLine, RiAlertLine, RiMoneyDollarCircleLine } from "react-icons/ri";
import StatsCard from "../../components/admin/StatsCard";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
    const navigate = useNavigate();

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
                    value="1,245"
                    icon={<RiBox3Line size={24} />}
                    trend={12}
                    trendLabel="o'tgan oyga nisbatan"
                    color="indigo"
                    onClick={() => navigate("/admin/inventory")}
                />
                <StatsCard
                    title="Foydalanuvchilar"
                    value="48"
                    icon={<RiUserLine size={24} />}
                    trend={5}
                    trendLabel="yangi xodimlar"
                    color="blue"
                    onClick={() => navigate("/admin/users")}
                />
                <StatsCard
                    title="Ta'mir talab jihozlar"
                    value="7"
                    icon={<RiAlertLine size={24} />}
                    trend={-2}
                    trendLabel="kamaydi"
                    color="orange"
                />
                <StatsCard
                    title="Umumiy Qiymat"
                    value="4.5 mlrd so'm"
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
                    <h3 className="font-bold text-gray-800 mb-4">Saytdagi yangiliklar</h3>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                    <RiUserLine size={14} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">Ali Valiyev <span className="font-normal text-gray-500">MacBook Pro oldi</span></p>
                                    <p className="text-xs text-gray-400">2 soat oldin</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
