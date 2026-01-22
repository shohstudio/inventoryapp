import { Link, useLocation } from "react-router-dom";
import { RiDashboardLine, RiBox3Line, RiUserLine, RiSettings4Line, RiLogoutBoxLine, RiCloseLine, RiUserSettingsLine, RiArchiveLine, RiFileList3Line, RiHistoryLine, RiShieldLine, RiCalendarLine, RiQrScan2Line, RiFileChartLine, RiFilePaper2Line } from "react-icons/ri";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import clsx from "clsx";

const Sidebar = ({ isOpen, onClose }) => {
    const { pathname } = useLocation();
    const { user, logout } = useAuth(); // Need user to check role
    const { t } = useLanguage();

    const links = [
        { name: t('dashboard'), path: "/admin", icon: <RiDashboardLine size={20} /> },
        { name: t('inventory'), path: "/admin/inventory", icon: <RiBox3Line size={20} /> },
        { name: t('warehouse'), path: "/admin/warehouse", icon: <RiArchiveLine size={20} /> },
        { name: "TMJ", path: "/admin/tmj", icon: <RiFilePaper2Line size={20} /> },
        { name: t('inventory_dates'), path: "/admin/inventory-dates", icon: <RiCalendarLine size={20} /> },
        { name: t('inventory_check'), path: "/admin/inventory-check", icon: <RiQrScan2Line size={20} /> },
        { name: t('report'), path: "/admin/reports", icon: <RiFileChartLine size={20} /> },
        // Only show Users link to admin
        ...(user?.role === 'admin' ? [{ name: t('users'), path: "/admin/users", icon: <RiUserLine size={20} /> }] : []),
        ...(['admin', 'accounter', 'warehouseman'].includes(user?.role) ? [{ name: t('requests'), path: "/admin/requests", icon: <RiFileList3Line size={20} /> }] : []),
        ...(user?.role === 'admin' ? [{ name: t('logs'), path: "/admin/logs", icon: <RiHistoryLine size={20} /> }] : []),
        ...(user?.role === 'guard' ? [{ name: t('guard_panel'), path: "/guard", icon: <RiShieldLine size={20} /> }] : []),
        { name: t('profile'), path: user?.role === 'employee' ? "/employee/profile" : (user?.role === 'guard' ? "/guard/profile" : "/admin/profile"), icon: <RiUserSettingsLine size={20} /> },
    ];

    return (
        <div className={`
            fixed top-0 left-0 h-full bg-[#1e1b4b] border-r border-indigo-900/50 shadow-2xl z-40 transition-transform duration-300 ease-in-out flex flex-col
            md:translate-x-0 w-64
            ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}>
            <div className="p-6 border-b border-indigo-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white" />
                    <span className="text-xl font-bold text-white tracking-tight">
                        Invertar
                    </span>
                </div>
                {/* Mobile Close Button */}
                <button onClick={onClose} className="md:hidden text-indigo-300 hover:text-white transition-colors">
                    <RiCloseLine size={24} />
                </button>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto mt-2">
                {links.map((link) => {
                    const isActive = pathname === link.path || (link.path !== "/admin" && pathname.startsWith(link.path + '/'));
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium",
                                isActive
                                    ? "bg-white/10 text-white shadow-inner backdrop-blur-sm border border-white/5"
                                    : "text-indigo-300/80 hover:bg-white/5 hover:text-white border border-transparent"
                            )}
                        >
                            <span className={clsx("transition-transform duration-200", isActive ? "scale-110" : "")}>
                                {link.icon}
                            </span>
                            <span>{link.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-indigo-900/50">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors font-medium"
                >
                    <RiLogoutBoxLine size={20} />
                    <span>{t('logout')}</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
