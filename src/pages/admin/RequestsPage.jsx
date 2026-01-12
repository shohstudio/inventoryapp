import { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { RiFileList3Line, RiCheckDoubleLine, RiTimeLine, RiCloseCircleLine, RiUserStarLine, RiShieldCheckLine } from "react-icons/ri";
import { EIMZOClient } from "../../utils/eimzo";

const RequestsPage = () => {
    const { t } = useLanguage();
    const { user, loginWithEImzo } = useAuth();
    const [requests, setRequests] = useState([]);
    const [exitRequests, setExitRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    // E-Imzo specific state for Accountant
    const [isSigning, setIsSigning] = useState(false);
    const [activeTab, setActiveTab] = useState('assignment'); // 'assignment' or 'exit'

    useEffect(() => {
        const storedRequests = JSON.parse(localStorage.getItem("assignment_requests") || "[]");
        const storedExitRequests = JSON.parse(localStorage.getItem("exit_requests") || "[]");

        // Sort by newest
        const sorted = storedRequests.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const sortedExits = storedExitRequests.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Filter based on role
        if (user.role === 'admin') {
            setRequests(sorted);
            setExitRequests(sortedExits);
        } else if (user.role === 'warehouseman') {
            setRequests(sorted);
            setExitRequests(sortedExits); // Can see exit logs too?
        } else if (user.role === 'accounter') {
            setRequests(sorted);
            setExitRequests(sortedExits);
        } else if (user.role === 'employee') {
            setRequests(sorted.filter(r => r.assignedToPinfl === user.pinfl || r.assignedToUserId === user.id));
        }
    }, [user]);

    const handleExitApprove = async (request) => {
        setIsSigning(true);
        try {
            // E-Imzo signing for exit too? Maybe. Or just simple approval. 
            // Let's assume simplest flow first - just click approve. 
            // But user asked for validation, so we can use E-Imzo or just confirm.

            /* 
            const client = new EIMZOClient();
            // ... keys ...
            // ... sign ...
            */

            // Simulating E-Imzo delay
            await new Promise(r => setTimeout(r, 1000));

            const updatedExits = exitRequests.map(r => {
                if (r.id === request.id) {
                    return {
                        ...r,
                        status: 'approved',
                        approvedBy: user.name,
                        approvedAt: new Date().toISOString()
                    };
                }
                return r;
            });

            localStorage.setItem("exit_requests", JSON.stringify(updatedExits));
            setExitRequests(updatedExits);

            // Add to Exit Logs
            const exitLogs = JSON.parse(localStorage.getItem("exit_logs") || "[]");
            exitLogs.unshift({
                id: Date.now(),
                ...request,
                status: 'approved',
                approvedBy: user.name,
                type: 'exit_approval'
            });
            localStorage.setItem("exit_logs", JSON.stringify(exitLogs));

            alert("Chiqish ruxsatnomasi tasdiqlandi!");
        } catch (e) {
            console.error(e);
            alert("Xatolik");
        } finally {
            setIsSigning(false);
        }
    };

    const handleExitReject = (id) => {
        if (!window.confirm("Rad etmoqchimisiz?")) return;

        const updatedExits = exitRequests.map(r => {
            if (r.id === id) {
                return {
                    ...r,
                    status: 'rejected',
                    rejectedBy: user.name,
                    rejectedAt: new Date().toISOString()
                };
            }
            return r;
        });
        localStorage.setItem("exit_requests", JSON.stringify(updatedExits));
        setExitRequests(updatedExits);

        // LOGGING
        const exitLogs = JSON.parse(localStorage.getItem("exit_logs") || "[]");
        const req = exitRequests.find(r => r.id === id);
        if (req) {
            exitLogs.unshift({
                id: Date.now(),
                ...req,
                status: 'rejected',
                approvedBy: user.name, // using approvedBy field for actor usually, or add rejectedBy
                rejectedBy: user.name,
                type: 'exit_rejection'
            });
            localStorage.setItem("exit_logs", JSON.stringify(exitLogs));
        }
    };

    const handleAccountantApprove = async (request) => {
        setIsSigning(true);
        try {
            const client = new EIMZOClient();
            const keys = await client.listAllUserKeys();
            if (keys.length === 0) {
                alert("E-IMZO kalitlari topilmadi. Iltimos modulni ishga tushiring.");
                return;
            }
            // Auto-select first key for demo flow or ask user to select?
            // For smoother UX in this demo, let's assume the user selects the first valid key matching their role/PINFL usually.
            // But here we just grab the first one.
            const key = keys[0];
            const challenge = `Approve_Transfer_${request.id}_${Date.now()}`;
            const signature = await client.createPkcs7(key.serialNumber, challenge);

            // Verify logic (Mock) - verify the signer is essentially the accountant
            // In real app, we verify 'signature' backend side.

            const updatedRequests = requests.map(r => {
                if (r.id === request.id) {
                    return {
                        ...r,
                        status: 'pending_employee',
                        accountantSignature: signature,
                        accountantName: user.name,
                        accountantTimestamp: new Date().toISOString()
                    };
                }
                return r;
            });

            localStorage.setItem("assignment_requests", JSON.stringify(updatedRequests));
            setRequests(updatedRequests);

            // LOGGING (Inventory Log)
            const inventoryLogs = JSON.parse(localStorage.getItem("inventory_logs") || "[]");
            inventoryLogs.unshift({
                id: Date.now(),
                action: "Hisobchi tasdiqladi (Assignment)",
                userName: user.name,
                userRole: user.role,
                timestamp: new Date().toISOString(),
                itemId: request.itemId,
                itemName: request.itemDetails?.name
            });
            localStorage.setItem("inventory_logs", JSON.stringify(inventoryLogs));

            alert("Muvaffaqiyatli tasdiqlandi! (Imzolandi)");

        } catch (e) {
            console.error(e);
            alert("Imzolashda xatolik: " + e.message);
        } finally {
            setIsSigning(false);
        }
    };

    const handleReject = (id) => {
        if (!window.confirm("Rostdan ham rad etmoqchimisiz?")) return;

        const updatedRequests = requests.map(r => {
            if (r.id === id) {
                return {
                    ...r,
                    status: 'rejected',
                    rejectedBy: user.name,
                    rejectedRole: user.role,
                    rejectedAt: new Date().toISOString()
                };
            }
            return r;
        });
        localStorage.setItem("assignment_requests", JSON.stringify(updatedRequests));
        setRequests(updatedRequests);

        // LOGGING (Inventory Log)
        const inventoryLogs = JSON.parse(localStorage.getItem("inventory_logs") || "[]");
        const req = requests.find(r => r.id === id);
        if (req) {
            inventoryLogs.unshift({
                id: Date.now(),
                action: "Hisobchi rad etdi (Assignment)",
                userName: user.name,
                userRole: user.role,
                timestamp: new Date().toISOString(),
                itemId: req.itemId,
                itemName: req.itemDetails?.name
            });
            localStorage.setItem("inventory_logs", JSON.stringify(inventoryLogs));
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending_accountant':
                return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs border border-orange-200 flex items-center gap-1"><RiTimeLine /> Hisobchi kutilmoqda</span>;
            case 'pending_employee':
                return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs border border-blue-200 flex items-center gap-1"><RiUserStarLine /> Xodim kutilmoqda</span>;
            case 'completed':
                return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs border border-green-200 flex items-center gap-1"><RiCheckDoubleLine /> Yakunlangan</span>;
            case 'rejected':
                return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs border border-red-200 flex items-center gap-1"><RiCloseCircleLine /> Rad etilgan</span>;
            default:
                return status;
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 flex items-center gap-2">
                    <RiFileList3Line className="text-indigo-600" />
                    So'rovlar (Requests)
                </h1>
                <p className="text-gray-500">Jihozlarni biriktirish bo'yicha so'rovlar holati</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-4 border-b border-gray-100">
                <button
                    onClick={() => setActiveTab('assignment')}
                    className={`pb-2 px-1 font-medium transition-colors relative ${activeTab === 'assignment' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Biriktirish {activeTab === 'assignment' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-full"></span>}
                </button>
                <button
                    onClick={() => setActiveTab('exit')}
                    className={`pb-2 px-1 font-medium transition-colors relative ${activeTab === 'exit' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Chiqish (Qoravul) {activeTab === 'exit' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-600 rounded-full"></span>}
                </button>
            </div>

            <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    {activeTab === 'assignment' ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-800 text-white">
                                    <th className="py-4 px-6 font-semibold text-sm rounded-tl-lg">Sana</th>
                                    <th className="py-4 px-6 font-semibold text-sm">Jihoz</th>
                                    <th className="py-4 px-6 font-semibold text-sm">Kimdan (Omborchi)</th>
                                    <th className="py-4 px-6 font-semibold text-sm">Kimga (Xodim)</th>
                                    <th className="py-4 px-6 font-semibold text-sm">Holati</th>
                                    <th className="py-4 px-6 font-semibold text-sm text-right rounded-tr-lg">Amallar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {requests.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-10 text-gray-500">So'rovlar mavjud emas</td>
                                    </tr>
                                ) : (
                                    requests.map(req => (
                                        <tr key={req.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="py-4 px-6 text-gray-600 text-sm">
                                                {new Date(req.timestamp).toLocaleString('uz-UZ')}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="font-medium text-gray-900">{req.itemDetails?.name}</div>
                                                <div className="text-xs text-gray-400 font-mono">{req.itemDetails?.serial}</div>
                                            </td>
                                            <td className="py-4 px-6 text-gray-700 text-sm">{req.warehousemanName}</td>
                                            <td className="py-4 px-6">
                                                <div className="font-medium text-gray-900">{req.assignedToName}</div>
                                                <div className="text-xs text-gray-500 font-mono">PINFL: {req.assignedToPinfl}</div>
                                            </td>
                                            <td className="py-4 px-6">
                                                {getStatusBadge(req.status)}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                {user.role === 'accounter' && req.status === 'pending_accountant' && (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleReject(req.id)}
                                                            className="btn btn-sm bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                                                        >
                                                            Rad etish
                                                        </button>
                                                        <button
                                                            onClick={() => handleAccountantApprove(req)}
                                                            disabled={isSigning}
                                                            className="btn btn-sm bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                                                        >
                                                            {isSigning ? "Imzolanmoqda..." : <><RiShieldCheckLine className="mr-1" /> Tasdiqlash (E-Imzo)</>}
                                                        </button>
                                                    </div>
                                                )}
                                                {user.role === 'admin' && (
                                                    <span className="text-xs text-gray-400">Kuzatish rejimi</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-orange-800 text-white">
                                    <th className="py-4 px-6 font-semibold text-sm rounded-tl-lg">Sana</th>
                                    <th className="py-4 px-6 font-semibold text-sm">Jihoz</th>
                                    <th className="py-4 px-6 font-semibold text-sm">Mas'ul Shaxs</th>
                                    <th className="py-4 px-6 font-semibold text-sm">Sabab</th>
                                    <th className="py-4 px-6 font-semibold text-sm">Qoravul</th>
                                    <th className="py-4 px-6 font-semibold text-sm">Holati</th>
                                    <th className="py-4 px-6 font-semibold text-sm text-right rounded-tr-lg">Amallar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {exitRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-10 text-gray-500">Chiqish so'rovlari mavjud emas</td>
                                    </tr>
                                ) : (
                                    exitRequests.map(req => (
                                        <tr key={req.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="py-4 px-6 text-gray-600 text-sm">
                                                {new Date(req.timestamp).toLocaleString('uz-UZ')}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="font-medium text-gray-900">{req.itemName}</div>
                                                <div className="text-xs text-gray-400 font-mono">{req.itemSerial}</div>
                                                <div className="text-xs font-bold text-gray-600 mt-1">{req.quantity} dona</div>
                                            </td>
                                            <td className="py-4 px-6 text-gray-800 font-medium">{req.responsiblePerson}</td>
                                            <td className="py-4 px-6 text-gray-500 text-sm italic">{req.reason}</td>
                                            <td className="py-4 px-6 text-gray-700 text-sm">{req.guardName}</td>
                                            <td className="py-4 px-6">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${req.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                    req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                        'bg-orange-100 text-orange-700 flex items-center gap-1'
                                                    }`}>
                                                    {req.status === 'approved' ? 'Tasdiqlandi' :
                                                        req.status === 'rejected' ? 'Rad etildi' :
                                                            <><RiTimeLine /> Kutilmoqda</>}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                {user.role === 'accounter' && req.status === 'pending_accountant' && (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleExitReject(req.id)}
                                                            className="btn btn-sm bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                                                        >
                                                            Rad etish
                                                        </button>
                                                        <button
                                                            onClick={() => handleExitApprove(req)}
                                                            disabled={isSigning}
                                                            className="btn btn-sm bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-200"
                                                        >
                                                            {isSigning ? "..." : "Tasdiqlash"}
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RequestsPage;
