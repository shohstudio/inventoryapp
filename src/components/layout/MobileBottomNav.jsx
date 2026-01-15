import { Link, useLocation } from "react-router-dom";
import { RiDashboardLine, RiBox3Line, RiQrCodeLine, RiArchiveLine, RiUserLine, RiShieldLine } from "react-icons/ri";
import clsx from "clsx";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";

const MobileBottomNav = ({ onScanClick }) => {
    const { pathname } = useLocation();
    const { t } = useLanguage();
    const { user } = useAuth();

    let navItems = [];

    if (user?.role === 'guard') {
        navItems = [
            { name: "Asosiy", path: "/guard", icon: <RiShieldLine size={24} />, exact: true },
            { name: "Profil", path: "/guard/profile", icon: <RiUserLine size={24} /> },
        ];
    } else {
        navItems = [
            { name: t('dashboard'), path: "/admin", icon: <RiDashboardLine size={24} />, exact: true },
            { name: t('inventory'), path: "/admin/inventory", icon: <RiBox3Line size={24} /> },
            { name: "QR Scan", type: "button", icon: <RiQrCodeLine size={32} /> }, // Central Button
            { name: t('warehouse'), path: "/admin/warehouse", icon: <RiArchiveLine size={24} /> },
            { name: t('profile'), path: "/admin/profile", icon: <RiUserLine size={24} /> },
        ];
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-indigo-100 dark:border-slate-800 flex items-center justify-around px-2 z-40 md:hidden shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pb-safe">
            {navItems.map((item, index) => {
                if (item.type === "button") {
                    return (
                        <div key={index} className="relative -top-8 group">
                            <button
                                onClick={onScanClick}
                                className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-300 dark:shadow-indigo-900/50 transform transition-all active:scale-90 hover:scale-105 relative z-10"
                            >
                                {item.icon}
                            </button>
                            {/* Glowing Animation Effect */}
                            <div className="absolute inset-0 bg-indigo-400 rounded-full blur-xl opacity-60 animate-pulse-slow -z-10 group-hover:opacity-80 transition-opacity"></div>
                            <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20 -z-10"></div>
                        </div>
                    );
                }

                const isActive = item.exact
                    ? pathname === item.path
                    : pathname.startsWith(item.path);

                return (
                    <Link
                        key={index}
                        to={item.path}
                        className={clsx(
                            "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300",
                            isActive
                                ? "text-indigo-600 dark:text-indigo-400"
                                : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                        )}
                    >
                        <div className={clsx("transition-transform duration-300", isActive ? "-translate-y-1" : "")}>
                            {item.icon}
                        </div>
                        {isActive && (
                            <span className="text-[10px] font-medium animate-fade-in absolute bottom-2">
                                {item.name}
                            </span>
                        )}
                    </Link>
                );
            })}
        </div>
    );
};

export default MobileBottomNav;
