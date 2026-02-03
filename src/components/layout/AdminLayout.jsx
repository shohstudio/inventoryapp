import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileBottomNav from "./MobileBottomNav"; // Import
import QRScannerModal from "../admin/QRScannerModal";
import { RiQrCodeLine } from "react-icons/ri";
import GlobalAlert from "../common/GlobalAlert";

const location = useLocation();
const isFullWidth = location.pathname.includes('/tmj');

return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-24 md:pb-0">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="md:pl-64 pt-16 min-h-screen transition-all duration-300">
            <GlobalAlert />
            <div className={`container mx-auto px-4 md:px-6 animate-fade-in ${isFullWidth ? 'max-w-full' : 'max-w-7xl'}`}>
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

        {/* PWA Mobile Bottom Navigation */}
        <MobileBottomNav onScanClick={() => setShowQRScanner(true)} />
    </div>
);
};

export default AdminLayout;
