import { useState } from "react";
import { RiAlertLine, RiSendPlaneFill, RiImageAddLine } from "react-icons/ri";
import { toast } from "react-hot-toast";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";

const ReportIssuePage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        category: "Broken",
        priority: "Medium",
        description: "",
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/requests', {
                type: 'issue',
                status: 'pending_admin',
                title: formData.title,
                category: formData.category,
                priority: formData.priority,
                description: formData.description
            });

            toast.success("Xabar yuborildi!");
            // Reset form
            setFormData({ title: "", category: "Broken", priority: "Medium", description: "" });
            navigate('/employee/requests'); // Redirect to requests to see status
        } catch (error) {
            console.error("Report error:", error);
            const msg = error.response?.data?.message || "Xatolik yuz berdi";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <RiAlertLine size={32} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Muammo haqida xabar berish</h1>
                <p className="text-gray-500">Jihozlardagi nosozliklar haqida ma'lumot qoldiring</p>
            </div>

            <div className="card shadow-xl shadow-gray-200/50">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="label">Muammo sarlavhasi</label>
                        <input
                            type="text"
                            className="input bg-gray-50"
                            placeholder="Masalan: Monitor ekranida chiziq paydo bo'ldi"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="label">Kategoriya</label>
                            <select
                                className="input bg-gray-50"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="Broken">Siniq/Buzilgan</option>
                                <option value="Software">Dasturiy xatolik</option>
                                <option value="Missing">Yo'qolgan</option>
                                <option value="Other">Boshqa</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Muhimlik darajasi</label>
                            <select
                                className="input bg-gray-50"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            >
                                <option value="Low">Past</option>
                                <option value="Medium">O'rta</option>
                                <option value="High">Yuqori</option>
                                <option value="Critical">O'ta muhim</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="label">Batafsil ma'lumot</label>
                        <textarea
                            className="input bg-gray-50 h-32 resize-none"
                            placeholder="Muammo haqida to'liqroq yozing..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        ></textarea>
                    </div>

                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                        <RiImageAddLine size={32} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Rasm yuklash (ixtiyoriy)</p>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full py-3 shadow-lg shadow-red-100 bg-red-600 hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? "Yuborilmoqda..." : (
                            <>
                                <RiSendPlaneFill size={20} />
                                Yuborish
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ReportIssuePage;
