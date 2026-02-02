import { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { RiHistoryLine, RiFileList3Line, RiTruckLine, RiLogoutBoxRLine, RiFileExcel2Line, RiSearchLine } from "react-icons/ri";
import api, { BASE_URL, getImageUrl } from "../../api/axios";
import * as XLSX from 'xlsx';
import { toast } from "react-hot-toast";
import Pagination from "../../components/common/Pagination";

const LogsPage = () => {
    const { t } = useLanguage();
    // const [activeTab, setActiveTab] = useState('inventory'); // inventory, warehouse, exit
    // Removed tabs state for now as server pagination trumps client filtering

    // We can keep activeTab for visual purpose if needed, but filtering by tabs requires backend support.
    // Let's hide tabs for now or implement backend filter for 'inventory' vs 'warehouse'.
    // Given user urgency, let's keep it simple: ALL LOGS.

    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let query = `/logs?page=${currentPage}&limit=20&`;
            if (startDate) query += `startDate=${startDate}&`;
            if (endDate) query += `endDate=${endDate}`;

            const { data } = await api.get(query);

            if (data.logs) {
                setLogs(data.logs);
                setTotalPages(data.metadata.totalPages);
                setTotalItems(data.metadata.total);
            } else {
                setLogs(data); // Fallback
            }
        } catch (error) {
            console.error("Failed to fetch logs", error);
            toast.error("Loglarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [startDate, endDate, currentPage]);

    const exportToExcel = () => {
        if (logs.length === 0) {
            toast.error("Export qilish uchun ma'lumot yo'q");
            return;
        }

        const dataToExport = logs.map(log => ({
            "Sana": new Date(log.createdAt).toLocaleString('uz-UZ'),
            "Foydalanuvchi": log.user?.name || "Tizim",
            "Rol": log.user?.role || "-",
            "Harakat": log.action,
            "Tafsilotlar": log.item?.name ? `${log.item.name} (${log.item.serialNumber || ''})` : log.details
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Logs");

        let filename = `Logs_${new Date().toISOString().slice(0, 10)}.xlsx`;
        if (startDate && endDate) filename = `Logs_${startDate}_${endDate}.xlsx`;

        XLSX.writeFile(wb, filename);
    };

    return (
        <div>
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 flex items-center gap-2">
                        <RiHistoryLine className="text-indigo-600" />
                        Tizim Loglari
                    </h1>
                    <p className="text-gray-500">Barcha harakatlar tarixi ({totalItems})</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                        <span className="text-xs text-gray-500 font-medium">Dan:</span>
                        <input
                            type="date"
                            className="text-sm outline-none text-gray-700"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                        <span className="text-xs text-gray-500 font-medium">Gacha:</span>
                        <input
                            type="date"
                            className="text-sm outline-none text-gray-700"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                    <button
                        onClick={exportToExcel}
                        className="btn bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 shadow-sm"
                    >
                        <RiFileExcel2Line size={18} />
                        Excel
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="py-4 px-6 font-semibold">Sana</th>
                                <th className="py-4 px-6 font-semibold">Foydalanuvchi</th>
                                <th className="py-4 px-6 font-semibold">Rol</th>
                                <th className="py-4 px-6 font-semibold">Harakat</th>
                                <th className="py-4 px-6 font-semibold">Obyekt/Jihoz</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-10">
                                        <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-10 text-gray-400 italic">Loglar mavjud emas</td>
                                </tr>
                            ) : (
                                logs.map((log, idx) => (
                                    <tr key={log.id || idx} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3 px-6 text-gray-500 whitespace-nowrap">
                                            {new Date(log.createdAt).toLocaleString('uz-UZ')}
                                        </td>
                                        <td className="py-3 px-6 font-medium text-gray-800">
                                            <div className="flex items-center gap-2">
                                                {log.user?.image ? (
                                                    <img
                                                        src={getImageUrl(log.user.image)}
                                                        alt={log.user.name}
                                                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-200">
                                                        {log.user?.name?.charAt(0) || "T"}
                                                    </div>
                                                )}
                                                <span>{log.user?.name || "Tizim"}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-6 text-gray-500">
                                            {log.user?.role || "-"}
                                        </td>
                                        <td className="py-3 px-6">
                                            <span className={`px-2 py-1 rounded text-xs ${log.action?.includes('create') ? 'bg-green-100 text-green-700' :
                                                log.action?.includes('delete') ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="py-3 px-6 text-gray-600 font-mono text-xs">
                                            {log.item?.name || log.details || "---"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                {logs.length > 0 && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(page) => setCurrentPage(page)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default LogsPage;
