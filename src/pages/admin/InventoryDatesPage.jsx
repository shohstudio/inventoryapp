import { useLanguage } from "../../context/LanguageContext";

const InventoryDatesPage = () => {
    const { t } = useLanguage();

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    {t('inventory_dates')}
                </h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <p className="text-gray-500">
                    Invertardan o'tkazish sanasi ma'lumotlari shu yerda bo'ladi.
                </p>
            </div>
        </div>
    );
};

export default InventoryDatesPage;
