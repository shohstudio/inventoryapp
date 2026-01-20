import { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { RiCloseLine, RiCheckLine, RiCameraLine, RiLoader4Line, RiSearchLine, RiInformationLine } from "react-icons/ri";
import api from "../../api/axios";
import { toast } from "react-hot-toast";

const QRScannerModal = ({ isOpen, onClose, onScanSuccess, verificationMode = false }) => {
    const [error, setError] = useState(null);
    const [step, setStep] = useState('scan'); // 'scan', 'verify', 'success'
    const [scannedItem, setScannedItem] = useState(null);
    const [imageFiles, setImageFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [scannerId] = useState("reader-" + Math.random().toString(36).substr(2, 9));
    const [manualInput, setManualInput] = useState("");
    const html5QrCodeRef = useRef(null);

    // Verification Form State
    const [verificationStatus, setVerificationStatus] = useState('working'); // 'working', 'broken', 'repair'
    const [verificationNotes, setVerificationNotes] = useState("");

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setStep('scan');
            setScannedItem(null);
            setImageFiles([]);
            setError(null);
            setManualInput("");
            setVerificationStatus('working');
            setVerificationNotes("");
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
        setError(null);
        try {
            // Assume code is ID or URL ending with ID
            let id = code;
            if (code.includes('/items/')) {
                id = code.split('/items/')[1];
            } else if (code.trim() === '') {
                setError("Iltimos, ID yoki INN kiriting");
                setLoading(false);
                return;
            }

            // Strategy: 
            // 1. Try to get by ID directly (fastest, most common for QRs)
            // 2. If 404/error, try to SEARCH by query (INN, Serial, etc.)

            try {
                // If it looks like a simple ID (small number), prioritize ID fetch
                // But INN is also numeric. Start with ID fetch.
                const { data } = await api.get(`/items/${id}`);
                setScannedItem(data);
                setVerificationStatus(data.status || 'working');
                setStep('verify');
            } catch (err) {
                // If 404 or other error, fallback to SEARCH
                console.log("ID fetch failed, trying search...");
                const { data } = await api.get('/items', { params: { search: code } });

                if (data.items && data.items.length > 0) {
                    setScannedItem(data.items[0]); // Pick first match
                    setVerificationStatus(data.items[0].status || 'working');
                    setStep('verify');
                } else {
                    throw new Error("Jihoz topilmadi");
                }
            }

        } catch (err) {
            console.error(err);
            setError("Jihoz topilmadi. ID yoki INN noto'g'ri.");
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (manualInput) {
            fetchItemDetails(manualInput);
        }
    };

    const handleVerifyFilter = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setImageFiles(prev => [...prev, ...files]);
        }
    };

    const handleRemoveImage = (index) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const [selectedDepartment, setSelectedDepartment] = useState('RTTM');
    const [customDepartment, setCustomDepartment] = useState('');

    const handleConfirm = async () => {
        if (!scannedItem) return;

        // Validation
        if (verificationStatus !== 'working' && !verificationNotes.trim()) {
            toast.error("Izoh yozish majburiy!");
            return;
        }

        if (selectedDepartment === 'Boshqa' && !customDepartment.trim()) {
            toast.error("Bo'lim nomini kiritish majburiy!");
            return;
        }

        if (imageFiles.length < 2) {
            toast.error("Kamida 2 ta rasm yuklash shart!");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        imageFiles.forEach(file => {
            formData.append('images', file);
        });
        formData.append('status', verificationStatus);
        formData.append('notes', verificationNotes);

        const outputDepartment = selectedDepartment === 'Boshqa' ? customDepartment : selectedDepartment;
        formData.append('department', outputDepartment);

        try {
            await api.post(`/items/${scannedItem.id}/verify-inventory`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Inventarizatsiyadan muvaffaqiyatli o'tdi!");
            setStep('success');
            setTimeout(() => {
                setStep('scan'); // Ready for next item
                setScannedItem(null);
                setImageFiles([]);
                setManualInput("");
                setVerificationStatus("working");
                setVerificationNotes("");
                // Keep selected department as convenience, check user preference? 
                // Maybe reset custom but keep selection if it's common.
                // Resetting for safety.
                setSelectedDepartment("RTTM");
                setCustomDepartment("");
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
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in relative min-h-[400px] flex flex-col max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/10 hover:bg-black/20 text-gray-800 rounded-full transition-colors"
                >
                    <RiCloseLine size={24} />
                </button>

                {step === 'scan' && (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        {/* Scanner Area - Flexible Height but constrained */}
                        <div className="relative flex-1 bg-black flex flex-col items-center justify-center overflow-hidden min-h-[250px]">
                            {error ? (
                                <div className="text-white text-center p-6">
                                    <p className="text-red-400 mb-2 font-bold">Xatolik</p>
                                    <p>{error}</p>
                                    <button onClick={() => { setError(null); setManualInput(""); }} className="mt-4 btn btn-sm bg-white text-black">Qayta urinish</button>
                                </div>
                            ) : (
                                <>
                                    <div id={scannerId} className="w-full h-full object-cover"></div>
                                    <div className="absolute inset-0 border-2 border-indigo-500/50 pointer-events-none z-10">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-indigo-400 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
                                    </div>
                                    <p className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-xs font-medium z-10 px-4">
                                        QR kodni skanerlang
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Manual Input Area - Fixed Height & On Top */}
                        <div className="relative z-20 bg-white p-5 shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
                            <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">
                                <div className="text-center">
                                    <p className="text-sm font-bold text-gray-800">QR kod ishlamayaptimi?</p>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={manualInput}
                                        onChange={(e) => setManualInput(e.target.value)}
                                        placeholder="ID yoki INN (masalan: 0130600029)"
                                        className="form-input flex-1 border-gray-300 focus:border-indigo-500 py-3"
                                    />
                                    <button type="submit" className="btn btn-primary px-5 py-3 rounded-lg shadow-md hover:shadow-lg transition-all" disabled={loading}>
                                        {loading ? <RiLoader4Line className="animate-spin" /> : <RiSearchLine size={22} />}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {step === 'verify' && scannedItem && (
                    <div className="p-6 flex flex-col gap-5">
                        <div className="text-center border-b pb-4">
                            <h3 className="text-xl font-bold text-gray-900">{scannedItem.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">{scannedItem.category} • {scannedItem.model}</p>
                            <div className="flex justify-center gap-4 mt-2 text-xs text-gray-500">
                                <span className="bg-gray-100 px-2 py-1 rounded">INN: {scannedItem.inn || 'Yo\'q'}</span>
                                <span className="bg-gray-100 px-2 py-1 rounded">ID: {scannedItem.id}</span>
                            </div>

                            {/* Assigned User Info */}
                            {scannedItem.assignedTo ? (
                                <div className="mt-3 p-2 bg-blue-50 rounded-lg text-sm text-blue-800">
                                    <p className="font-semibold">{scannedItem.assignedTo.name}</p>
                                    <p className="text-xs opacity-75">{scannedItem.assignedTo.position || 'Lavozim ko\'rsatilmagan'}</p>
                                </div>
                            ) : (
                                <div className="mt-3 p-2 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                                    <p>Javobgar biriktirilmagan</p>
                                </div>
                            )}

                            {/* Department Info */}
                            {(scannedItem.department || scannedItem.building) && (
                                <div className="mt-2 text-sm text-gray-600 border-t pt-2">
                                    <span className="font-medium text-gray-800">Inventar o'tkazgan bo'lim:</span> {scannedItem.department || scannedItem.building}
                                </div>
                            )}

                            {/* Last Inventory Date */}
                            {scannedItem.lastCheckedAt && (
                                <div className="mt-2 text-xs text-gray-500">
                                    Oxirgi inventarizatsiya: <span className="font-medium text-gray-700">{new Date(scannedItem.lastCheckedAt).toLocaleDateString("ru-RU")}</span>
                                </div>
                            )}
                        </div>


                        {/* Department Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Inventar o'tkazgan bo'lim</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {['RTTM', 'Bino komendanti', 'Boshqa'].map((dept) => (
                                    <button
                                        key={dept}
                                        type="button"
                                        onClick={() => setSelectedDepartment(dept)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${selectedDepartment === dept
                                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {dept}
                                    </button>
                                ))}
                            </div>
                            {selectedDepartment === 'Boshqa' && (
                                <input
                                    type="text"
                                    value={customDepartment}
                                    onChange={(e) => setCustomDepartment(e.target.value)}
                                    placeholder="Bo'lim nomini kiritng..."
                                    className="form-input w-full"
                                />
                            )}
                        </div>

                        {/* Status Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Holati</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setVerificationStatus('working')}
                                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${verificationStatus === 'working'
                                        ? 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    🟢 Yaxshi
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setVerificationStatus('repair')}
                                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${verificationStatus === 'repair'
                                        ? 'bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    🟠 Ta'mir
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setVerificationStatus('broken')}
                                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${verificationStatus === 'broken'
                                        ? 'bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    🔴 Yomon
                                </button>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Izoh {verificationStatus !== 'working' && <span className="text-red-500">*</span>}
                            </label>
                            <textarea
                                value={verificationNotes}
                                onChange={(e) => setVerificationNotes(e.target.value)}
                                placeholder={verificationStatus === 'working' ? "Ixtiyoriy izoh..." : "Nima nosozligi bor? Batafsil yozing..."}
                                className="form-input w-full min-h-[80px]"
                            />
                        </div>

                        {/* Image Upload - Compact & Multiple */}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rasmlar (kamida 2 ta) {imageFiles.length < 2 && <span className="text-red-500 text-xs font-normal ml-1">({2 - imageFiles.length} ta yetmayapti)</span>}
                            </label>

                            <div className="grid grid-cols-4 gap-2">
                                {/* Existing Previews */}
                                {imageFiles.map((file, index) => (
                                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={`Preview ${index}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            onClick={() => handleRemoveImage(index)}
                                            className="absolute top-0.5 right-0.5 bg-red-500/80 text-white p-0.5 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                        >
                                            <RiCloseLine size={14} />
                                        </button>
                                    </div>
                                ))}

                                {/* Add Button - Small Square */}
                                <label className="aspect-square cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-400 hover:text-indigo-500 hover:border-indigo-300">
                                    <RiCameraLine size={24} />
                                    <span className="text-[10px] font-medium mt-1">Qo'shish</span>
                                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleVerifyFilter} capture="environment" />
                                </label>
                            </div>
                        </div>

                        <button
                            onClick={handleConfirm}
                            disabled={loading || (verificationStatus !== 'working' && !verificationNotes.trim())}
                            className={`btn w-full py-3 text-lg mt-2 ${loading ? 'opacity-75' : ''} btn-primary shadow-lg shadow-indigo-200`}
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
                        <p className="text-gray-500">Jihoz {new Date().toLocaleDateString("ru-RU")} sanasida<br />inventarizatsiyadan o'tdi.</p>
                        <p className="mt-8 text-sm text-gray-400">Keyingi jihozga o'tilmoqda...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRScannerModal;
