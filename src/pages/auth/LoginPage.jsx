import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { RiLockPasswordLine, RiUserLine } from "react-icons/ri";

const LoginPage = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            const user = await login(username, password);
            if (user.role === "admin") {
                navigate("/admin");
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-yellow-300 rounded-full mix-blend-overlay filter blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
            </div>

            <div className="glass p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 m-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Xush kelibsiz!</h1>
                    <p className="text-gray-600">Inventory System ga kirish</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="label">Foydalanuvchi nomi</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <RiUserLine size={20} />
                            </span>
                            <input
                                type="text"
                                className="input pl-10"
                                placeholder="admin"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label">Parol</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <RiLockPasswordLine size={20} />
                            </span>
                            <input
                                type="password"
                                className="input pl-10"
                                placeholder="******"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3 rounded-lg bg-indigo-600 text-white font-semibold shadow-lg hover:bg-indigo-700 transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${isLoading ? "opacity-70 cursor-not-allowed" : ""
                            }`}
                    >
                        {isLoading ? "Kirish..." : "Kirish"}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>Login ma'lumotlari:</p>
                    <div className="flex justify-center gap-4 mt-2">
                        <code className="bg-gray-100 px-2 py-1 rounded">admin / admin123</code>
                        <code className="bg-gray-100 px-2 py-1 rounded">user / user123</code>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
