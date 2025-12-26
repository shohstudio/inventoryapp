import { useEffect, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { RiCloseLine } from "react-icons/ri";

const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
    const [error, setError] = useState(null);

    useEffect(() => {
        let html5QrCode;

        if (isOpen) {
            // Wait for the modal to be fully rendered
            const timeoutId = setTimeout(() => {
                html5QrCode = new Html5Qrcode("reader");

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                };

                html5QrCode.start(
                    { facingMode: "environment" }, // Prefer back camera
                    config,
                    (decodedText) => {
                        // Success callback
                        onScanSuccess(decodedText);
                        html5QrCode.stop().then(() => {
                            html5QrCode.clear();
                            onClose();
                        }).catch(err => console.error(err));
                    },
                    (errorMessage) => {
                        // Ignore frame parse errors
                    }
                ).catch(err => {
                    console.error("Error starting QR scanner", err);
                    setError("Kameraga ruxsat bering yoki https orqali kiring.");
                });
            }, 100);

            return () => {
                clearTimeout(timeoutId);
                if (html5QrCode && html5QrCode.isScanning) {
                    html5QrCode.stop().then(() => html5QrCode.clear()).catch(console.error);
                }
            };
        }
    }, [isOpen, onScanSuccess, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/20 text-white hover:bg-white/30 rounded-full transition-colors backdrop-blur-md"
                >
                    <RiCloseLine size={24} />
                </button>

                <div className="relative h-96 bg-black flex flex-col items-center justify-center">
                    {error ? (
                        <div className="text-white text-center p-6">
                            <p className="text-red-400 mb-2 font-bold">Xatolik</p>
                            <p>{error}</p>
                        </div>
                    ) : (
                        <>
                            <div id="reader" className="w-full h-full"></div>
                            <div className="absolute inset-0 border-2 border-indigo-500/50 pointer-events-none">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-indigo-400 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
                            </div>
                            <p className="absolute bottom-8 left-0 right-0 text-center text-white/80 text-sm font-medium">
                                QR kodni ramka ichiga to'g'rilang
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QRScannerModal;
