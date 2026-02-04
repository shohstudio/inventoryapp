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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('scan_title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('scan_subtitle')}</p>
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
                    <h2 className="text-3xl font-bold mb-2">{t('scan_card_title')}</h2>
                    <p className="text-indigo-200 text-center max-w-xs">
                        {t('scan_card_desc')}
                    </p>
                </div>

                {/* Updates/Stats Section (Placeholder for now) */}
                <div className="space-y-6">
                    <div className="card bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 p-6 shadow-sm">
                        <h3 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white mb-4">
                            <RiCheckDoubleLine className="text-green-500" size={24} />
                            {t('instructions_title')}
                        </h3>
                        <ul className="space-y-3 text-gray-600 dark:text-gray-300 text-sm">
                            <li className="flex gap-3">
                                <span className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs ring-1 ring-indigo-100 dark:ring-indigo-800">1</span>
                                {t('instruction_1')}
                            </li>
                            <li className="flex gap-3">
                                <span className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs ring-1 ring-indigo-100 dark:ring-indigo-800">2</span>
                                {t('instruction_2')}
                            </li>
                            <li className="flex gap-3">
                                <span className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs ring-1 ring-indigo-100 dark:ring-indigo-800">3</span>
                                {t('instruction_3')}
                            </li>
                            <li className="flex gap-3">
                                <span className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs ring-1 ring-indigo-100 dark:ring-indigo-800">4</span>
                                {t('instruction_4')}
                            </li>
                        </ul>
                    </div>

                    <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 p-6 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg">
                                <RiFileList3Line size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-blue-900 dark:text-blue-100">{t('note_title')}</h4>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                    {t('note_desc')}
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
