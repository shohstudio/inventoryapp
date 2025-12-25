import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { RiCloseLine } from "react-icons/ri";

const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
    useEffect(() => {
        let scanner = null;

        if (isOpen) {
            scanner = new Html5QrcodeScanner(
                "reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                /* verbose= */ false
            );

            scanner.render(
                (decodedText) => {
                    onScanSuccess(decodedText);
                    scanner.clear();
                    onClose();
                },
                (errorMessage) => {
                    // Ignore frame scan errors
                }
            );
        }

        return () => {
            if (scanner) {
                scanner.clear().catch(error => {
                    console.error("Failed to clear html5-qrcode scanner. ", error);
                });
            }
        };
    }, [isOpen, onScanSuccess, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">QR Kodni Skanerlash</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <RiCloseLine size={24} />
                    </button>
                </div>

                <div className="p-6">
                    <div id="reader" className="overflow-hidden rounded-lg"></div>
                    <p className="text-center text-sm text-gray-500 mt-4">
                        Kamerani QR kodga qarating
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QRScannerModal;
