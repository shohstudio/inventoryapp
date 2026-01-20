import { useState } from "react";
import { RiQrCodeLine, RiCheckDoubleLine, RiFileList3Line } from "react-icons/ri";
import QRScannerModal from "../../components/admin/QRScannerModal";
import { useLanguage } from "../../context/LanguageContext";

const InventoryCheckPage = () => {
    const { t } = useLanguage();
    const [isScannerOpen, setIsScannerOpen] = useState(true); // Open by default? Maybe better to click start. Let's default to false but huge button.
    const [scannedItems, setScannedItems] = useState([]);

    const handleScanSuccess = (code) => {
        // This is callback for normal scan, but we use verificationMode so logic is inside modal.
        // But we might want to know when it finishes to update our local list.
        // Actually QRScannerModal handles the API call. 
        // We can pass a callback onVerifySuccess to update local list.
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Inventarizatsiyadan o'tkazish</h1>
                    <p className="text-gray-500 mt-1">Jihozlarni skaner qiling va tasdiqlang</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Scanner Section */}
                <div className="card bg-gradient-to-br from-indigo-900 to-indigo-800 text-white p-8 flex flex-col items-center justify-center min-h-[400px] shadow-xl hover:shadow-2xl transition-all cursor-pointer group"
                    onClick={() => setIsScannerOpen(true)}
                >
                    <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <RiQrCodeLine size={64} />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Skanerlash</h2>
                    <p className="text-indigo-200 text-center max-w-xs">
                        Kamerani ishga tushirish uchun bosing
                    </p>
                </div>

                {/* Updates/Stats Section (Placeholder for now) */}
                <div className="space-y-6">
                    <div className="card bg-white border border-indigo-100 p-6">
                        <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-4">
                            <RiCheckDoubleLine className="text-green-500" size={24} />
                            Ko'rsatmalar
                        </h3>
                        <ul className="space-y-3 text-gray-600 text-sm">
                            <li className="flex gap-3">
                                <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">1</span>
                                Jihozning QR kodini kameraga to'g'rilang
                            </li>
                            <li className="flex gap-3">
                                <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">2</span>
                                Jihoz ma'lumotlari chiqqach, uning holatini tekshiring
                            </li>
                            <li className="flex gap-3">
                                <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">3</span>
                                "Yangi rasm yuklash" orqali jihozning hozirgi holatini rasmga oling
                            </li>
                            <li className="flex gap-3">
                                <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">4</span>
                                "Tasdiqlash" tugmasini bosing
                            </li>
                        </ul>
                    </div>

                    <div className="card bg-blue-50 border border-blue-100 p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                                <RiFileList3Line size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-blue-900">Eslatma</h4>
                                <p className="text-sm text-blue-700 mt-1">
                                    Inventarizatsiyadan o'tgan jihozlar avtomatik tarzda "O'tdi" statusini oladi va sanasi yangilanadi.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <QRScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScanSuccess={handleScanSuccess}
                verificationMode={true}
            />
        </div>
    );
};

export default InventoryCheckPage;
