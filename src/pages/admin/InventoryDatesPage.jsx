import { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { RiCalendarLine, RiSave3Line } from "react-icons/ri";
import api from "../../api/axios";
import { toast } from "react-hot-toast";

const InventoryDatesPage = () => {
    const { t } = useLanguage();
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchDates = async () => {
            try {
                const { data } = await api.get('/settings');
                if (data.inventoryStartDate) setStartDate(data.inventoryStartDate);
                if (data.inventoryEndDate) setEndDate(data.inventoryEndDate);
            } catch (error) {
                console.error("Error fetching dates", error);
            }
        };
        fetchDates();
    }, []);

    const handleSave = async () => {
        if (!startDate || !endDate) {
            toast.error("Boshlash va tugash sanasini kiriting");
            return;
        }

        setLoading(true);
        try {
            await api.post('/settings/inventory-dates', { startDate, endDate });
            toast.success("Sanalar saqlandi va barchaga yuborildi");
        } catch (error) {
            console.error("Error saving dates", error);
            toast.error("Saqlashda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                    {t('inventory_dates')}
                </h1>
            </div>

            <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-8 max-w-2xl">
                <div className="flex items-start gap-6">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                        <RiCalendarLine size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Invertarizatsiya davri</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Belgilangan sanalar oralig'ida tizimda invertarizatsiya o'tkazilayotgani haqida barcha foydalanuvchilarga ogohlantirish ko'rsatiladi.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Boshlash sanasi</label>
                                <input
                                    type="date"
                                    className="input w-full"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tugash sanasi</label>
                                <input
                                    type="date"
                                    className="input w-full"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="btn btn-primary gap-2"
                            >
                                <RiSave3Line size={20} />
                                {loading ? "Saqlanmoqda..." : "Saqlash va E'lon qilish"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryDatesPage;
