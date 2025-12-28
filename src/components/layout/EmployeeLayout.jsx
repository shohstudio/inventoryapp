import { Outlet, Link, useLocation } from "react-router-dom";
import { RiHomeLine, RiFileListLine, RiAlertLine, RiLogoutBoxRLine, RiUserLine } from "react-icons/ri";
import { useAuth } from "../../context/AuthContext";
import clsx from "clsx";

const EmployeeLayout = () => {
    const { pathname } = useLocation();
    const { logout } = useAuth();

    const links = [
        { name: "Asosiy", path: "/employee", icon: <RiHomeLine size={24} /> },
        { name: "Mening jihozlarim", path: "/employee/items", icon: <RiFileListLine size={24} /> },
        { name: "Muammo xabar berish", path: "/employee/report", icon: <RiAlertLine size={24} /> },
        { name: "Profil", path: "/employee/profile", icon: <RiUserLine size={24} /> },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
            {/* Desktop Sidebar (Simplified) */}
            <div className="hidden md:flex flex-col w-64 fixed left-0 top-0 h-screen bg-[#1e1b4b] border-r border-indigo-900/50 shadow-2xl z-40 transition-transform duration-300 ease-in-out">
                <div className="p-6 border-b border-indigo-900/50 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">I</div>
                    <span className="text-xl font-bold text-white tracking-tight">
                        Employee
                    </span>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto mt-2">
                    {links.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium",
                                pathname === link.path
                                    ? "bg-white/10 text-white shadow-inner backdrop-blur-sm border border-white/5"
                                    : "text-indigo-300/80 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <span className={clsx("transition-transform duration-200", pathname === link.path ? "scale-110" : "")}>
                                {link.icon}
                            </span>
                            <span>{link.name}</span>
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t border-indigo-900/50">
                    <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors font-medium">
                        <RiLogoutBoxRLine size={20} />
                        <span>Chiqish</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="md:ml-64 p-6">
                <Outlet />
            </main>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around p-3 z-50">
                {links.map((link) => (
                    <Link
                        key={link.path}
                        to={link.path}
                        className={clsx(
                            "flex flex-col items-center gap-1 text-xs font-medium",
                            pathname === link.path ? "text-indigo-600" : "text-gray-400"
                        )}
                    >
                        {link.icon}
                        <span>{link.name}</span>
                    </Link>
                ))}
                <button onClick={logout} className="flex flex-col items-center gap-1 text-xs font-medium text-red-400">
                    <RiLogoutBoxRLine size={24} />
                    <span>Chiqish</span>
                </button>
            </div>
        </div>
    );
};

export default EmployeeLayout;
