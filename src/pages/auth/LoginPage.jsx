import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { RiLockPasswordLine, RiUserLine, RiEyeLine, RiEyeOffLine, RiKey2Line, RiRefreshLine } from "react-icons/ri";
import { EIMZOClient } from "../../utils/eimzo";

const LoginPage = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login, loginWithEImzo } = useAuth();
    const navigate = useNavigate();

    // E-Imzo State
    const [loginMethod, setLoginMethod] = useState("password"); // 'password' | 'eri'
    const [keys, setKeys] = useState([]);
    const [selectedKey, setSelectedKey] = useState("");
    const [loadingKeys, setLoadingKeys] = useState(false);

    const handleLoadKeys = async () => {
        setLoadingKeys(true);
        setError("");
        try {
            const client = new EIMZOClient();
            const certificates = await client.listAllUserKeys();
            setKeys(certificates);
            if (certificates.length > 0) {
                setSelectedKey(certificates[0].serialNumber);
            }
        } catch (e) {
            console.error(e);
            setError("E-Imzo moduli bilan ulanishda xatolik. Iltimos E-IMZO dasturi ishlayotganini tekshiring.");
        } finally {
            setLoadingKeys(false);
        }
    };

    const handleEImzoLogin = async () => {
        if (!selectedKey) {
            setError("Iltimos, kalitni tanlang");
            return;
        }
        setIsLoading(true);
        setError("");
        try {
            const client = new EIMZOClient();
            const challenge = "Challenge_" + Date.now(); // In real app, get from backend
            const signature = await client.createPkcs7(selectedKey, challenge);

            // Extract info from key object for mock login
            const keyInfo = keys.find(k => k.serialNumber === selectedKey);
            const pinfl = keyInfo?.tin || keyInfo?.uid || keyInfo?.serialNumber; // Fallback

            const user = await loginWithEImzo(signature, selectedKey, pinfl);
            if (["admin", "warehouseman", "accounter"].includes(user.role)) {
                navigate("/admin");
            } else {
                navigate("/employee");
            }
        } catch (e) {
            console.error(e);
            setError(e.message || "E-Imzo bilan kirishda xatolik yuz berdi");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            const user = await login(username, password);
            if (["admin", "warehouseman", "accounter"].includes(user.role)) {
                navigate("/admin");
            } else if (user.role === "guard") {
                navigate("/guard");
            } else {
                navigate("/employee");
            }
        } catch (err) {
            setError("Foydalanuvchi nomi yoki parol noto'g'ri");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900">
            {/* Dynamic Animated Background */}
            <div className="absolute inset-0 w-full h-full">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 animate-blob"></div>
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-32 left-20 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 animate-blob animation-delay-4000"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 animate-blob"></div>
            </div>

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>

            <div className="container relative z-10 mx-auto px-4 flex justify-center perspective-1000">
                <div className="w-full max-w-md bg-white/10 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl shadow-2xl p-8 md:p-12 transform transition-all duration-500 hover:scale-[1.01] hover:shadow-cyan-500/20">

                    {/* Floating Icons Decoration */}
                    <div className="absolute -top-12 -left-12 w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl rotate-12 flex items-center justify-center shadow-lg animate-float">
                        <RiUserLine className="text-white text-4xl" />
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl -rotate-12 flex items-center justify-center shadow-lg animate-float animation-delay-2000">
                        <RiLockPasswordLine className="text-white text-3xl" />
                    </div>

                    <div className="text-center mb-10 relative">
                        <div className="inline-block p-4 rounded-full bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 mb-4 animate-pulse">
                            <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-200 drop-shadow-sm">
                                INVENTAR
                            </h1>
                        </div>
                        <p className="text-gray-300 text-lg font-light tracking-wide">Tizimga kirish</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 bg-slate-800/50 rounded-xl mb-8">
                        <button
                            onClick={() => setLoginMethod("password")}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${loginMethod === "password"
                                ? "bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-lg"
                                : "text-gray-400 hover:text-white"
                                }`}
                        >
                            <RiLockPasswordLine size={18} />
                            Login/Parol
                        </button>
                        <button
                            onClick={() => {
                                setLoginMethod("eri");
                                if (keys.length === 0) handleLoadKeys();
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${loginMethod === "eri"
                                ? "bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-lg"
                                : "text-gray-400 hover:text-white"
                                }`}
                        >
                            <RiKey2Line size={18} />
                            E-Imzo (ERI)
                        </button>
                    </div>

                    {loginMethod === "password" ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl text-sm font-medium flex items-center gap-2 animate-[slideUp_0.3s_ease-out]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2 group">
                                <label className="text-sm font-medium text-gray-300 ml-1 group-focus-within:text-cyan-400 transition-colors">Login</label>
                                <div className="relative group focus-within:transform focus-within:scale-[1.02] transition-all duration-300">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-cyan-400 transition-colors">
                                        <RiUserLine size={22} />
                                    </span>
                                    <input
                                        type="text"
                                        className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-600 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium tracking-wide shadow-inner"
                                        placeholder="Foydalanuvchi nomi"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <label className="text-sm font-medium text-gray-300 ml-1 group-focus-within:text-cyan-400 transition-colors">Parol</label>
                                <div className="relative group focus-within:transform focus-within:scale-[1.02] transition-all duration-300">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-cyan-400 transition-colors">
                                        <RiLockPasswordLine size={22} />
                                    </span>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="w-full pl-12 pr-12 py-4 bg-slate-800/50 border border-slate-600 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium tracking-wide shadow-inner"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-colors focus:outline-none"
                                    >
                                        {showPassword ? <RiEyeOffLine size={22} /> : <RiEyeLine size={22} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-4 mt-4 rounded-xl font-bold text-lg text-white shadow-xl shadow-indigo-500/30 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 relative overflow-hidden group ${isLoading ? "bg-gray-600 cursor-not-allowed" : "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right"
                                    }`}
                            >
                                <div className="absolute inset-0 w-full h-full bg-white/20 group-hover:translate-x-full transition-transform duration-700 -skew-x-12 -translate-x-full"></div>
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Tekshirilmoqda...
                                    </span>
                                ) : (
                                    "Tizimga Kirish"
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-right duration-300">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 ml-1">Kalitni tanlang</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleLoadKeys}
                                        disabled={loadingKeys}
                                        className="btn bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                                        title="Yangilash"
                                    >
                                        <RiRefreshLine className={loadingKeys ? "animate-spin" : ""} size={20} />
                                    </button>
                                    <select
                                        className="flex-1 input bg-slate-800/50 border-slate-600 text-gray-100"
                                        value={selectedKey}
                                        onChange={(e) => setSelectedKey(e.target.value)}
                                    >
                                        {keys.length === 0 ? (
                                            <option>Kalitlar topilmadi</option>
                                        ) : (
                                            keys.map(k => (
                                                <option key={k.serialNumber} value={k.serialNumber}>
                                                    {k.cn} ({k.tin || k.uid})
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleEImzoLogin}
                                disabled={isLoading || keys.length === 0}
                                className={`w-full py-4 mt-4 rounded-xl font-bold text-lg text-white shadow-xl shadow-indigo-500/30 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 relative overflow-hidden group ${isLoading || keys.length === 0 ? "bg-gray-600 cursor-not-allowed" : "bg-gradient-to-r from-green-500 to-emerald-600 hover:bg-emerald-500"
                                    }`}
                            >
                                {isLoading ? "Tekshirilmoqda..." : "E-Imzo bilan Kirish"}
                            </button>

                            <div className="text-center text-xs text-gray-500 mt-4">
                                <p>E-IMZO moduli kompyuteringizda yonib turgan bo'lishi shart.</p>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 text-center">
                        <p className="text-xs text-gray-500">
                            Muammo bormi? <span className="text-cyan-400 hover:underline cursor-pointer">Admin bilan bog'laning</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
