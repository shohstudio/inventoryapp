import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import QRScannerModal from "../admin/QRScannerModal";
import { RiQrCodeLine } from "react-icons/ri";

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showQRScanner, setShowQRScanner] = useState(false);
    const navigate = useNavigate();

    const handleScanSuccess = (decodedText) => {
        setShowQRScanner(false);
        // Navigate to inventory page with the scanned code
        navigate("/admin/inventory", { state: { scanCode: decodedText } });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 md:pb-0">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <Header onMenuClick={() => setIsSidebarOpen(true)} />

            <main className="md:pl-64 pt-16 min-h-screen transition-all duration-300">
                <div className="container mx-auto p-6 max-w-7xl animate-fade-in">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            <QRScannerModal
                isOpen={showQRScanner}
                onClose={() => setShowQRScanner(false)}
                onScanSuccess={handleScanSuccess}
            />

            {/* Global Mobile Floating QR Scan Button */}
            <button
                onClick={() => setShowQRScanner(true)}
                className="fixed bottom-6 right-6 z-40 bg-indigo-600 text-white p-4 rounded-full shadow-lg shadow-indigo-300 hover:bg-indigo-700 active:scale-95 transition-all md:hidden"
                aria-label="Scan QR Code"
            >
                <RiQrCodeLine size={28} />
            </button>
        </div>
    );
};

export default AdminLayout;
