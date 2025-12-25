import { Link, useLocation } from "react-router-dom";
import { RiDashboardLine, RiBox3Line, RiUserLine, RiSettings4Line, RiLogoutBoxLine } from "react-icons/ri";
import { useAuth } from "../../context/AuthContext";
import clsx from "clsx";

const Sidebar = () => {
    const { pathname } = useLocation();
    const { logout } = useAuth();

    const links = [
        { name: "Dashboard", path: "/admin", icon: <RiDashboardLine size={20} /> },
        { name: "Invertar", path: "/admin/inventory", icon: <RiBox3Line size={20} /> },
        { name: "Foydalanuvchilar", path: "/admin/users", icon: <RiUserLine size={20} /> },
        { name: "Sozlamalar", path: "/admin/settings", icon: <RiSettings4Line size={20} /> },
    ];

    return (
        <div className="w-64 bg-white border-r border-gray-200 h-screen hidden md:flex flex-col fixed left-0 top-0 z-20 transition-all duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">I</div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                    Invertar
                </span>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {links.map((link) => {
                    const isActive = pathname === link.path || (link.path !== "/admin" && pathname.startsWith(link.path));
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                                isActive
                                    ? "bg-indigo-50 text-indigo-600 shadow-sm"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            {link.icon}
                            <span>{link.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium"
                >
                    <RiLogoutBoxLine size={20} />
                    <span>Chiqish</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
