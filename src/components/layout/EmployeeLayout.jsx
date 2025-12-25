import { Outlet, Link, useLocation } from "react-router-dom";
import { RiHomeLine, RiFileListLine, RiAlertLine, RiLogoutBoxRLine } from "react-icons/ri";
import { useAuth } from "../../context/AuthContext";
import clsx from "clsx";

const EmployeeLayout = () => {
    const { pathname } = useLocation();
    const { logout } = useAuth();

    const links = [
        { name: "Asosiy", path: "/employee", icon: <RiHomeLine size={24} /> },
        { name: "Mening jihozlarim", path: "/employee/items", icon: <RiFileListLine size={24} /> },
        { name: "Muammo xabar berish", path: "/employee/report", icon: <RiAlertLine size={24} /> },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
            {/* Desktop Sidebar (Simplified) */}
            <div className="hidden md:flex flex-col w-64 fixed left-0 top-0 h-screen bg-white border-r border-gray-200">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-xl font-bold text-indigo-600">Employee Portal</h1>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {links.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium",
                                pathname === link.path ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50"
                            )}
                        >
                            {link.icon}
                            <span>{link.name}</span>
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-100">
                    <button onClick={logout} className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl w-full">
                        <RiLogoutBoxRLine size={24} />
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
