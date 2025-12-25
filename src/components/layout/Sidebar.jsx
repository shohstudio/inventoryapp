import { Link, useLocation } from "react-router-dom";
import { RiDashboardLine, RiBox3Line, RiUserLine, RiSettings4Line, RiLogoutBoxLine, RiCloseLine } from "react-icons/ri";
import { useAuth } from "../../context/AuthContext";
import clsx from "clsx";

const Sidebar = ({ isOpen, onClose }) => {
    const { pathname } = useLocation();
    const { logout } = useAuth();
    // ... links array

    return (
        <div className={`
            fixed top-0 left-0 h-full bg-white/70 backdrop-blur-xl border-r border-indigo-100/50 shadow-2xl z-40 transition-transform duration-300 ease-in-out
            md:translate-x-0 w-64
            ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">I</div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                        Invertar
                    </span>
                </div>
                {/* Mobile Close Button */}
                <button onClick={onClose} className="md:hidden text-gray-500 hover:text-gray-700">
                    <RiCloseLine size={24} />
                </button>
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
