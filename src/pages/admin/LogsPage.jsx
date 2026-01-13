import { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { RiHistoryLine, RiFileList3Line, RiTruckLine, RiLogoutBoxRLine } from "react-icons/ri";
import api from "../../api/axios";

const LogsPage = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('inventory'); // inventory, warehouse, exit
    const [allLogs, setAllLogs] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                // Currently backend has one unified 'Log' table. 
                // We might filter client-side or backend-side ideally.
                // For now, let's fetch all and filter client side based on 'action' text or type context?
                const { data } = await api.get('/logs');
                setAllLogs(data);
            } catch (error) {
                console.error("Failed to fetch logs", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    useEffect(() => {
        if (loading) return;

        // Filter logs based on tab (rudimentary text search based filter since backend 'action' string is loose)
        let filtered = [];
        if (activeTab === 'inventory') {
            filtered = allLogs.filter(l => !l.action.includes('import') && !l.action.includes('create')); // broad assumption
            // Actually, let's show ALL logic for Inventory tab for now as 'General Logs'
            filtered = allLogs;
        } else if (activeTab === 'warehouse') {
            // Show only Create/Import actions?
            filtered = allLogs.filter(l => l.action.includes('create') || l.action.includes('import'));
        } else if (activeTab === 'exit') {
            // Exit logic not fully in backend yet?
            filtered = allLogs.filter(l => l.action.includes('exit'));
        }

        // Use allLogs directly without complex filtering for now if type is ambiguous
        setLogs(allLogs);
    }, [activeTab, allLogs, loading]);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 flex items-center gap-2">
                    <RiHistoryLine className="text-indigo-600" />
                    Tizim Loglari
                </h1>
                <p className="text-gray-500">Barcha harakatlar tarixi</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-100">
                <button
                    onClick={() => setActiveTab('inventory')}
                    className={`pb-3 px-2 font-medium transition-colors relative flex items-center gap-2 ${activeTab === 'inventory' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <RiFileList3Line /> Inventar
                    {activeTab === 'inventory' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-full"></span>}
                </button>
                <button
                    onClick={() => setActiveTab('warehouse')}
                    className={`pb-3 px-2 font-medium transition-colors relative flex items-center gap-2 ${activeTab === 'warehouse' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <RiTruckLine /> Omborxona
                    {activeTab === 'warehouse' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full"></span>}
                </button>
                <button
                    onClick={() => setActiveTab('exit')}
                    className={`pb-3 px-2 font-medium transition-colors relative flex items-center gap-2 ${activeTab === 'exit' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
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
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-10 text-gray-400 italic">Loglar mavjud emas</td>
                                </tr>
                            ) : (
                                logs.map((log, idx) => (
                                    <tr key={log.id || idx} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3 px-6 text-gray-500">
                                            {new Date(log.timestamp || log.date).toLocaleString('uz-UZ')}
                                        </td>
                                        <td className="py-3 px-6 font-medium text-gray-800">
                                            {log.userName || log.approvedBy || "Noma'lum"}
                                        </td>
                                        <td className="py-3 px-6 text-gray-500">
                                            {log.userRole || (activeTab === 'exit' ? 'Accountant' : '-')}
                                        </td>
                                        <td className="py-3 px-6">
                                            <span className={`px-2 py-1 rounded text-xs ${log.action?.includes('qo\'shdi') ? 'bg-green-100 text-green-700' :
                                                log.type === 'exit_approval' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                {log.action || (log.type === 'exit_approval' ? 'Chiqishga ruxsat berdi' : 'Amal')}
                                            </span>
                                        </td>
                                        <td className="py-3 px-6 text-gray-600 font-mono text-xs">
                                            {log.itemName || "---"}
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
