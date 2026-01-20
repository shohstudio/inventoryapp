import { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { RiCloseLine, RiCheckLine, RiCameraLine, RiLoader4Line } from "react-icons/ri";
import api from "../../api/axios";
import { toast } from "react-hot-toast";

const QRScannerModal = ({ isOpen, onClose, onScanSuccess, verificationMode = false }) => {
    const [error, setError] = useState(null);
    const [step, setStep] = useState('scan'); // 'scan', 'verify', 'success'
    const [scannedItem, setScannedItem] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scannerId] = useState("reader-" + Math.random().toString(36).substr(2, 9));
    const html5QrCodeRef = useRef(null);

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setStep('scan');
            setScannedItem(null);
            setImageFile(null);
            setError(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && step === 'scan') {
            const startScanner = async () => {
                await new Promise(r => setTimeout(r, 100)); // Wait for DOM

                if (html5QrCodeRef.current) {
                    await html5QrCodeRef.current.stop().catch(console.error);
                }

                const html5QrCode = new Html5Qrcode(scannerId);
                html5QrCodeRef.current = html5QrCode;

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                };

                html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    async (decodedText) => {
                        // Success
                        await html5QrCode.stop();
                        html5QrCode.clear();

                        if (verificationMode) {
                            fetchItemDetails(decodedText);
                        } else {
                            onScanSuccess(decodedText);
                            onClose();
                        }
                    },
                    (errorMessage) => { }
                ).catch(err => {
                    console.error("Error starting QR scanner", err);
                    setError("Kameraga ruxsat bering yoki https orqali kiring.");
                });
            };

            startScanner();

            return () => {
                if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                    html5QrCodeRef.current.stop().then(() => html5QrCodeRef.current.clear()).catch(console.error);
                }
            };
        }
    }, [isOpen, step, verificationMode, scannerId]);

    const fetchItemDetails = async (code) => {
        setLoading(true);
        try {
            // Assume code is ID or URL ending with ID
            // If URL like https://domain.com/items/123 -> extract 123
            let id = code;
            if (code.includes('/items/')) {
                id = code.split('/items/')[1];
            }
            // Or if just number

            const { data } = await api.get(`/items/${id}`);
            setScannedItem(data);
            setStep('verify');
        } catch (err) {
            setError("Jihoz topilmadi. QR kod noto'g'ri yoki bazada mavjud emas.");
            setTimeout(() => {
                setStep('scan'); // Auto retry
                setError(null);
            }, 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyFilter = (e) => {
        const file = e.target.files[0];
        if (file) setImageFile(file);
    };

    const handleConfirm = async () => {
        if (!scannedItem) return;

        setLoading(true);
        const formData = new FormData();
        if (imageFile) {
            formData.append('images', imageFile);
        }

        try {
            await api.post(`/items/${scannedItem.id}/verify-inventory`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Inventarizatsiyadan muvaffaqiyatli o'tdi!");
            setStep('success');
            setTimeout(() => {
                setStep('scan'); // Ready for next item
                setScannedItem(null);
                setImageFile(null);
            }, 2000);
        } catch (err) {
            toast.error("Xatolik: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in relative min-h-[400px] flex flex-col">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/10 hover:bg-black/20 text-gray-800 rounded-full transition-colors"
                >
                    <RiCloseLine size={24} />
                </button>

                {step === 'scan' && (
                    <div className="relative h-96 bg-black flex flex-col items-center justify-center">
                        {error ? (
                            <div className="text-white text-center p-6">
                                <p className="text-red-400 mb-2 font-bold">Xatolik</p>
                                <p>{error}</p>
                                <button onClick={() => setStep('scan')} className="mt-4 btn btn-sm bg-white text-black">Qayta urinish</button>
                            </div>
                        ) : (
                            <>
                                <div id={scannerId} className="w-full h-full"></div>
                                <div className="absolute inset-0 border-2 border-indigo-500/50 pointer-events-none">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-indigo-400 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
                                </div>
                                <p className="absolute bottom-8 left-0 right-0 text-center text-white/80 text-sm font-medium">
                                    Jihozning QR kodini skanerlang
                                </p>
                            </>
                        )}
                    </div>
                )}

                {step === 'verify' && scannedItem && (
                    <div className="p-6 flex flex-col items-center text-center">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{scannedItem.name}</h3>
                        <p className="text-sm text-gray-500 mb-6">{scannedItem.category} • {scannedItem.model}</p>

                        <div className="w-full bg-gray-50 rounded-xl p-4 mb-6 border border-dashed border-gray-300">
                            {imageFile ? (
                                <div className="relative h-48 w-full rounded-lg overflow-hidden">
                                    <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
                                    <button onClick={() => setImageFile(null)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><RiCloseLine /></button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center h-48 cursor-pointer hover:bg-gray-100 transition-colors rounded-lg">
                                    <RiCameraLine size={48} className="text-gray-400 mb-2" />
                                    <span className="text-sm text-gray-600 font-medium">Yangi rasm yuklash</span>
                                    <span className="text-xs text-gray-400 mt-1">Skaner qilinganidan keyin holati</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleVerifyFilter} capture="environment" />
                                </label>
                            )}
                        </div>

                        <button
                            onClick={handleConfirm}
                            disabled={loading || !imageFile} // Require image? Maybe optional. User said "skaner qilgandean keyin jihoz haqida yangi rasm joylaydi". Let's verify instructions. "joylaydi" implies imperative. Let's make it optional but recommended? Or mandatory. User said "yangi rasm joylaydi va hammasi joyida ekanligini tasdiqlaydi". I'll make it mandatory to ensure verification quality.
                            className={`btn w-full py-3 text-lg ${imageFile ? 'btn-primary shadow-lg shadow-indigo-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                        >
                            {loading ? <RiLoader4Line className="animate-spin mx-auto" /> : "Tasdiqlash va O'tkazish"}
                        </button>
                    </div>
                )}

                {step === 'success' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                            <RiCheckLine size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Muvaffaqiyatli!</h3>
                        <p className="text-gray-500">Jihoz inventarizatsiyadan o'tdi.</p>
                        <p className="mt-8 text-sm text-gray-400">Keyingi jihozga o'tilmoqda...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRScannerModal;
