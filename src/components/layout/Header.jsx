import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getImageUrl } from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { RiSearchLine, RiMenuLine, RiLogoutBoxLine, RiUserLine, RiArrowDownSLine, RiSunLine, RiMoonLine } from "react-icons/ri";

const Header = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md fixed top-0 right-0 left-0 md:left-64 z-30 transition-all duration-300 border-b border-indigo-50/50 dark:border-slate-700 shadow-sm px-6 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
                <button onClick={onMenuClick} className="md:hidden text-gray-500 hover:text-indigo-600 transition-colors">
                    <RiMenuLine size={24} />
                </button>
                <div className="relative max-w-md w-full hidden md:block">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <RiSearchLine size={18} />
                    </span>
                    <input
                        type="text"
                        placeholder={t('search')}
                        className="w-full pl-10 pr-4 py-2 rounded-full border-none bg-gray-100 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-100 transition-all text-sm outline-none dark:text-gray-100 placeholder-gray-400"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 mr-2">
                    <button
                        onClick={toggleTheme}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:text-indigo-400 dark:hover:bg-slate-800 transition-all"
                        title={theme === 'dark' ? "Light Mode" : "Dark Mode"}
                    >
                        {theme === 'dark' ? <RiSunLine size={20} /> : <RiMoonLine size={20} />}
                    </button>
                    <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-1"></div>
                    <button
                        onClick={() => setLanguage('uz')}
                        className={`p-1.5 rounded-lg transition-all ${language === 'uz' ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'hover:bg-gray-100 dark:hover:bg-slate-800 grayscale hover:grayscale-0'}`}
                        title="O'zbekcha (Lotin)"
                    >
                        <span className="text-xl">🇺🇿</span>
                    </button>
                    <button
                        onClick={() => setLanguage('oz')}
                        className={`p-1.5 rounded-lg transition-all ${language === 'oz' ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'hover:bg-gray-100 grayscale hover:grayscale-0'}`}
                        title="O'zbekcha (Kirill)"
                    >
                        <span className="text-xl font-serif">Ўз</span>
                    </button>
                    <button
                        onClick={() => setLanguage('ru')}
                        className={`p-1.5 rounded-lg transition-all ${language === 'ru' ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'hover:bg-gray-100 grayscale hover:grayscale-0'}`}
                        title="Русский"
                    >
                        <span className="text-xl">🇷🇺</span>
                    </button>
                </div>



                <div className="relative pl-4 border-l border-gray-200">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-3 hover:bg-gray-50 rounded-xl p-1 pr-2 transition-colors focus:outline-none"
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{user?.position || user?.department || (user?.role === 'accounter' ? 'Hisobchi' : user?.role)}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md overflow-hidden border-2 border-white dark:border-slate-800">
                            {user?.image ? (
                                <img
                                    src={getImageUrl(user.image)}
                                    alt="User"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                user?.name?.charAt(0)
                            )}
                        </div>
                        <RiArrowDownSLine className={`text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setIsDropdownOpen(false)}
                            ></div>
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-2 animate-fade-in origin-top-right">
                                <div className="px-4 py-2 border-b border-gray-50 sm:hidden">
                                    <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                                </div>

                                <Link
                                    to={user?.role === 'employee' ? "/employee/profile" : (user?.role === 'guard' ? "/guard/profile" : "/admin/profile")}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 transition-colors"
                                    onClick={() => setIsDropdownOpen(false)}
                                >
                                    <RiUserLine size={18} />
                                    Mening Profilim
                                </Link>

                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 transition-colors"
                                >
                                    <RiLogoutBoxLine size={18} />
                                    Chiqish
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
