import { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { RiHistoryLine, RiFileList3Line, RiTruckLine, RiLogoutBoxRLine, RiFileExcel2Line, RiSearchLine } from "react-icons/ri";
import api from "../../api/axios";
import * as XLSX from 'xlsx';
import { toast } from "react-hot-toast";

const LogsPage = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('inventory'); // inventory, warehouse, exit
    const [allLogs, setAllLogs] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let query = '/logs?';
            if (startDate) query += `startDate=${startDate}&`;
            if (endDate) query += `endDate=${endDate}`;

            const { data } = await api.get(query);
            setAllLogs(data);
        } catch (error) {
            console.error("Failed to fetch logs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [startDate, endDate]); // Refetch when dates change

    useEffect(() => {
        // Filter logs based on tab (rudimentary text search based filter since backend 'action' string is loose)
        let filtered = [];
        if (activeTab === 'inventory') {
            filtered = allLogs; // Show all for inventory as general logs
        } else if (activeTab === 'warehouse') {
            filtered = allLogs.filter(l => l.action.includes('create') || l.action.includes('import'));
        } else if (activeTab === 'exit') {
            filtered = allLogs.filter(l => l.action.includes('exit'));
        }
        setLogs(filtered);
    }, [activeTab, allLogs]);

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
                    <p className="text-gray-500">Barcha harakatlar tarixi</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                        <span className="text-xs text-gray-500 font-medium">Dan:</span>
                        <input
                            type="date"
                            className="text-sm outline-none text-gray-700"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                        <span className="text-xs text-gray-500 font-medium">Gacha:</span>
                        <input
                            type="date"
                            className="text-sm outline-none text-gray-700"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
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

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-100 overflow-x-auto pb-1">
                <button
                    onClick={() => setActiveTab('inventory')}
                    className={`pb-3 px-2 font-medium transition-colors relative flex items-center gap-2 whitespace-nowrap ${activeTab === 'inventory' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <RiFileList3Line /> Inventar
                    {activeTab === 'inventory' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-full"></span>}
                </button>
                <button
                    onClick={() => setActiveTab('warehouse')}
                    className={`pb-3 px-2 font-medium transition-colors relative flex items-center gap-2 whitespace-nowrap ${activeTab === 'warehouse' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <RiTruckLine /> Omborxona
                    {activeTab === 'warehouse' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full"></span>}
                </button>
                <button
                    onClick={() => setActiveTab('exit')}
                    className={`pb-3 px-2 font-medium transition-colors relative flex items-center gap-2 whitespace-nowrap ${activeTab === 'exit' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <RiLogoutBoxRLine /> Chiqishlar (Qoravul)
                    {activeTab === 'exit' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-600 rounded-full"></span>}
                </button>
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
                                            {log.user?.name || "Tizim"}
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
            </div>
        </div>
    );
};

export default LogsPage;
