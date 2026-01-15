import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { RiQrCodeLine, RiLogoutBoxRLine, RiCheckDoubleLine, RiSave3Line, RiArchiveLine } from "react-icons/ri";
import QRScannerModal from "../../components/admin/QRScannerModal";
import { toast } from "react-hot-toast";

const GuardDashboard = () => {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    // Form State
    const [scannedCode, setScannedCode] = useState("");
    const [foundItem, setFoundItem] = useState(null);
    const [responsiblePerson, setResponsiblePerson] = useState("");
    const [reason, setReason] = useState("");
    const [quantity, setQuantity] = useState(1);

    const [todayExits, setTodayExits] = useState([]);

    useEffect(() => {
        // Load today's exits for history
        const allRequests = JSON.parse(localStorage.getItem("exit_requests") || "[]");
        // Filter by today and guard
        const today = new Date().toISOString().split('T')[0];
        const guardsExits = allRequests.filter(r =>
            r.guardId === user.id &&
            r.timestamp.startsWith(today)
        );
        setTodayExits(guardsExits);
    }, [user.id]);

    const handleScan = (code) => {
        setScannedCode(code);
        setIsScannerOpen(false);
        // Auto-search item
        findItem(code);
    };

    const findItem = (code) => {
        const inventory = JSON.parse(localStorage.getItem("inventory_items") || "[]");
        const warehouse = JSON.parse(localStorage.getItem("warehouse_items") || "[]");

        let item = inventory.find(i =>
            String(i.id) === code ||
            i.orderNumber === code ||
            i.serial === code ||
            i.inn === code ||
            i.assignedPINFL === code
        );

        if (!item) {
            // Fallback to warehouse items? Usually exiting items should be in inventory.
            // But maybe valid to take from warehouse too.
            item = warehouse.find(i => String(i.id) === code || i.orderNumber === code);
        }

        if (item) {
            setFoundItem(item);
            // Auto fill responsible if assigned
            if (item.assignedTo) setResponsiblePerson(item.assignedTo.name || item.assignedTo);
        } else {
            toast.error("Jihoz topilmadi. Kod: " + code);
            setFoundItem(null);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!foundItem) {
            toast.error("Iltimos, avval jihozni skaner qiling yoki kodini kiriting.");
            return;
        }

        const newRequest = {
            id: "exit_" + Date.now(),
            itemId: foundItem.id,
            itemName: foundItem.name,
            itemSerial: foundItem.serial,
            quantity: quantity,
            responsiblePerson: responsiblePerson,
            reason: reason,
            guardId: user.id,
            guardName: user.name,
            status: 'pending_accountant', // Needs approval
            timestamp: new Date().toISOString()
        };

        const existingRequests = JSON.parse(localStorage.getItem("exit_requests") || "[]");
        const updatedRequests = [newRequest, ...existingRequests];
        localStorage.setItem("exit_requests", JSON.stringify(updatedRequests));

        // LOGGING
        const exitLogs = JSON.parse(localStorage.getItem("exit_logs") || "[]");
        exitLogs.unshift({
            id: Date.now(),
            ...newRequest,
            status: 'pending_accountant',
            type: 'exit_request_created',
            action: "Chiqish so'rovi yuborildi"
        });
        localStorage.setItem("exit_logs", JSON.stringify(exitLogs));

        setTodayExits(prev => [newRequest, ...prev]);

        // Reset form
        setFoundItem(null);
        setScannedCode("");
        setReason("");
        setResponsiblePerson("");
        setQuantity(1);

        toast.success("Chiqish so'rovi yuborildi!");
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header for Guard */}
            <header className="bg-slate-900 text-white p-4 shadow-lg flex justify-between items-center sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <div className="bg-orange-500 p-2 rounded-lg">
                        <RiShieldCheckLine size={24} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg">Qoravul Posti</h1>
                        <p className="text-xs text-gray-400">{user.name}</p>
                    </div>
                </div>
                <button onClick={logout} className="text-gray-400 hover:text-white transition-colors">
                    <RiLogoutBoxRLine size={24} />
                </button>
            </header>

            <main className="flex-1 p-4 max-w-lg mx-auto w-full space-y-6">

                {/* Scanner Section */}
                <div className="card bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Jihozni Skanerlash</h2>
                    <button
                        onClick={() => setIsScannerOpen(true)}
                        className="w-full btn py-4 text-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 flex flex-col items-center justify-center gap-2 h-32 rounded-2xl transition-transform active:scale-95"
                    >
                        <RiQrCodeLine size={40} />
                        <span>Kamerani ochish</span>
                    </button>

                    <div className="mt-4 flex gap-2">
                        <input
                            type="text"
                            className="input w-full text-center font-mono"
                            placeholder="Yoki kodni kiriting..."
                            value={scannedCode}
                            onChange={(e) => setScannedCode(e.target.value)}
                            onBlur={(e) => findItem(e.target.value)}
                        />
                    </div>
                </div>

                {/* Form Section */}
                {foundItem && (
                    <div className="card bg-white p-6 rounded-2xl shadow-sm border border-orange-100 animate-in slide-in-from-bottom duration-300">
                        <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-100">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                {foundItem.images && foundItem.images[0] ? <img src={foundItem.images[0]} className="w-full h-full object-cover rounded-lg" /> : <RiArchiveLine size={32} />}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{foundItem.name}</h3>
                                <p className="text-sm text-gray-500">{foundItem.category}</p>
                                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded mt-1 inline-block">{foundItem.serial || "No Serial"}</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="label">Olib chiquvchi shaxs</label>
                                <input
                                    type="text"
                                    required
                                    className="input w-full"
                                    placeholder="Ism Familiya"
                                    value={responsiblePerson}
                                    onChange={(e) => setResponsiblePerson(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Miqdor</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="input w-full"
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="flex items-end">
                                    <span className="text-sm text-gray-500 mb-3 ml-2">ta</span>
                                </div>
                            </div>

                            <div>
                                <label className="label">Chiqish sababi / Qayerga</label>
                                <textarea
                                    className="input w-full h-24 resize-none"
                                    placeholder="Ta'mirlashga, Bosh ofisga..."
                                    required
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                ></textarea>
                            </div>

                            <button type="submit" className="btn btn-primary w-full py-3 text-base shadow-lg shadow-orange-200">
                                <RiSave3Line size={20} />
                                Tasdiqlashga yuborish
                            </button>
                        </form>
                    </div>
                )}

                {/* Recent History */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider pl-2">Bugungi chiqishlar</h3>
                    {todayExits.length === 0 ? (
                        <p className="text-center text-gray-400 py-4 italic">Hozircha hech narsa yo'q</p>
                    ) : (
                        todayExits.map(exit => (
                            <div key={exit.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-gray-800">{exit.itemName}</div>
                                    <div className="text-xs text-gray-500">{exit.responsiblePerson} • {exit.quantity} ta</div>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${exit.status === 'approved' ? 'bg-green-100 text-green-700' :
                                    exit.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                        'bg-orange-100 text-orange-700'
                                    }`}>
                                    {exit.status === 'approved' ? 'Tasdiqlandi' :
                                        exit.status === 'rejected' ? 'Rad etildi' :
                                            'Kutilmoqda'}
                                </span>
                            </div>
                        ))
                    )}
                </div>

            </main>

            <QRScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScanSuccess={handleScan}
            />
        </div>
    );
};
import { RiShieldCheckLine } from "react-icons/ri"; // Import icon separately to avoid reference error if missing

export default GuardDashboard;
