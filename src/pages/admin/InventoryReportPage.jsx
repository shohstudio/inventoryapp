import { useState, useEffect } from "react";
import { RiFileExcel2Line, RiSearchLine, RiLoader4Line, RiImage2Line, RiCalendarCheckLine } from "react-icons/ri";
import api from "../../api/axios";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import { useLanguage } from "../../context/LanguageContext";

const InventoryReportPage = () => {
    const { t } = useLanguage();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [inventoryStartDate, setInventoryStartDate] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Get Inventory Start Date safely
            let startDate = null;
            try {
                const settingsRes = await api.get('/settings');
                if (Array.isArray(settingsRes.data)) {
                    const startDateSetting = settingsRes.data.find(s => s.key === 'inventory_start_date');
                    startDate = startDateSetting ? new Date(startDateSetting.value) : null;
                }
            } catch (err) {
                console.warn("Failed to fetch settings:", err);
                // Continue without start date
            }
            setInventoryStartDate(startDate);

            // 2. Get All Items with high limit
            // Using a large limit to ensure we get all records for the report
            const itemsRes = await api.get('/items', { params: { limit: 10000 } });

            const allItems = itemsRes.data?.items || [];

            // 3. Filter for Verified Items (lastCheckedAt exists)
            let verifiedItems = allItems.filter(item => item.lastCheckedAt);

            if (startDate) {
                // If start date exists, filter items checked on or after that date
                verifiedItems = verifiedItems.filter(item => new Date(item.lastCheckedAt) >= startDate);
            }

            // Sort by check date (newest first)
            verifiedItems.sort((a, b) => new Date(b.lastCheckedAt) - new Date(a.lastCheckedAt));

            setItems(verifiedItems);
        } catch (error) {
            console.error("Error fetching report data:", error);
            toast.error("Ma'lumotlarni yuklashda xatolik: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = () => {
        if (items.length === 0) {
            toast.error(t('no_data'));
            return;
        }

        const dataToExport = items.map((item, index) => ({
            [t('order_number')]: index + 1,
            [t('name')]: item.name,
            [t('model')]: item.model || "-",
            "ID": item.id,
            [t('inn')]: item.inn || "-",
            [t('status')]: item.status === 'working' ? t('status_working') :
                item.status === 'repair' ? t('status_repair') :
                    item.status === 'broken' ? t('status_broken') : item.status,
            [t('checked_time')]: new Date(item.lastCheckedAt).toLocaleDateString("ru-RU"),
            [t('department_checked')]: item.department || item.building || "-",
            [t('image')]: item.image ? (window.location.origin + item.image) : "Rasm yo'q"
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inventarizatsiya Hisoboti");

        // Auto-width columns
        worksheet["!cols"] = [
            { wch: 5 }, // No
            { wch: 30 }, // Name
            { wch: 20 }, // Model
            { wch: 10 }, // ID
            { wch: 15 }, // INN
            { wch: 15 }, // Status
            { wch: 15 }, // Date
            { wch: 25 }, // Department
            { wch: 50 }  // Image Link
        ];

        XLSX.writeFile(workbook, `Inventarizatsiya_Hisobot_${new Date().toLocaleDateString("ru-RU")}.xlsx`);
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.inn && item.inn.includes(searchTerm)) ||
        item.id.toString().includes(searchTerm)
    );

    return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <RiCalendarCheckLine className="text-indigo-600" />
                        {t('report_title')}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {t('total_checked')}: <span className="font-bold text-gray-900">{items.length}</span>
                    </p>
                    {inventoryStartDate && (
                        <p className="text-xs text-indigo-500 mt-1 font-medium bg-indigo-50 inline-block px-2 py-1 rounded">
                            {t('checked_after').replace('{date}', new Date(inventoryStartDate).toLocaleDateString("ru-RU"))}
                        </p>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleExportExcel}
                        className="btn bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 shadow-sm"
                        disabled={items.length === 0}
                    >
                        <RiFileExcel2Line size={20} />
                        {t('export_excel')}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder={t('search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input pl-10 w-full"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                <th className="p-4 w-16 text-center">#</th>
                                <th className="p-4">{t('name')}</th>
                                <th className="p-4">ID / {t('inn')}</th>
                                <th className="p-4">{t('status')}</th>
                                <th className="p-4">{t('checked_time')}</th>
                                <th className="p-4">{t('department_checked')}</th>
                                <th className="p-4 text-center">{t('image')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <RiLoader4Line className="animate-spin" size={24} />
                                            {t('loading')}
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-500">
                                        {inventoryStartDate ? t('no_matching_items') : t('no_data')}
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="p-4 text-center text-gray-400 font-mono text-xs">{index + 1}</td>
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900">{item.name}</div>
                                            <div className="text-xs text-gray-400">{item.model}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded w-fit">ID: {item.id}</span>
                                                {item.inn && <span className="font-mono text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded w-fit">INN: {item.inn}</span>}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${item.status === 'working' ? 'bg-green-50 text-green-700 border-green-200' :
                                                item.status === 'repair' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                    'bg-red-50 text-red-700 border-red-200'
                                                }`}>
                                                {item.status === 'working' ? t('status_working') :
                                                    item.status === 'repair' ? t('status_repair') : t('status_broken')}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-gray-900 font-medium">
                                                {new Date(item.lastCheckedAt).toLocaleDateString("ru-RU")}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {new Date(item.lastCheckedAt).toLocaleTimeString("ru-RU", { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm text-gray-700 font-medium bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                                {item.department || item.building || "-"}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            {item.image ? (
                                                <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 mx-auto relative group-hover:scale-105 transition-transform bg-white">
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-200 mx-auto flex items-center justify-center text-gray-300">
                                                    <RiImage2Line size={20} />
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InventoryReportPage;
