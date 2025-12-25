import { useAuth } from "../../context/AuthContext";
import { RiNotification3Line, RiSearchLine } from "react-icons/ri";

const Header = () => {
    const { user } = useAuth();

    return (
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 fixed top-0 right-0 left-0 md:left-64 z-10 flex items-center justify-between px-6 transition-all duration-300">
            <div className="flex items-center gap-4 flex-1">
                <div className="relative max-w-md w-full hidden md:block">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <RiSearchLine size={18} />
                    </span>
                    <input
                        type="text"
                        placeholder="Qidirish..."
                        className="w-full pl-10 pr-4 py-2 rounded-full border-none bg-gray-100 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-sm outline-none"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="relative p-2 text-gray-500 hover:text-indigo-600 transition-colors">
                    <RiNotification3Line size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                        {user?.name?.charAt(0)}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
