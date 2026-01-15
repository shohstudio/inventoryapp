import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { RiCloseLine, RiPrinterLine, RiDownloadLine } from "react-icons/ri";

const QRGeneratorModal = ({ isOpen, onClose, item }) => {
    if (!isOpen || !item) return null;

    const qrRef = useRef();

    // Using INN if available, otherwise OrderNumber, or ID
    // Priority: INN -> OrderNumber -> ID
    const qrValue = item.inn ? String(item.inn) : (item.orderNumber ? String(item.orderNumber) : String(item.id));

    // Display Text logic
    let displayText = `ID: ${item.id}`;
    if (item.inn) displayText = `INN: ${item.inn}`;
    else if (item.orderNumber) displayText = `#${item.orderNumber}`;

    const handlePrint = () => {
        const canvas = qrRef.current.querySelector('canvas');
        if (!canvas) return;

        const imgUrl = canvas.toDataURL("image/png");
        const windowContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print QR</title>
                <style>
                    body { 
                        display: flex; 
                        justify-content: center; 
                        align-items: center; 
                        height: 100vh; 
                        margin: 0; 
                        flex-direction: column;
                        font-family: sans-serif;
                    }
                    .qr-container {
                        text-align: center;
                        padding: 20px;
                        border: 1px dashed #ccc;
                    }
                    img { width: 250px; height: 250px; }
                    .title { margin-top: 10px; font-weight: bold; font-size: 24px; }
                    .subtitle { font-size: 14px; color: #555; margin-top: 5px; }
                </style>
            </head>
            <body>
                <div class="qr-container">
                    <img src="${imgUrl}" />
                    <div class="title">${displayText}</div>
                    <div class="subtitle">${item.name}</div>
                </div>
                <script>
                    window.onload = function() { window.print(); window.close(); }
                </script>
            </body>
            </html>
        `;

        const printWin = window.open('', '', 'width=600,height=600');
        printWin.document.open();
        printWin.document.write(windowContent);
        printWin.document.close();
    };

    const handleDownload = () => {
        const canvas = qrRef.current.querySelector('canvas');
        if (!canvas) return;

        const url = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = `QR_${item.orderNumber || item.id}_${item.name}.png`;
        a.click();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">QR Kod</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <RiCloseLine size={24} />
                    </button>
                </div>

                <div className="p-8 flex flex-col items-center justify-center space-y-4" ref={qrRef}>
                    <div className="p-4 bg-white border-2 border-gray-900 rounded-xl">
                        <QRCodeCanvas
                            value={qrValue}
                            size={200}
                            level={"H"}
                            includeMargin={true}
                        />
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                            {displayText}
                        </div>
                        <p className="text-gray-500 font-medium mt-1">{item.name}</p>
                        {item.orderNumber && <p className="text-xs text-gray-400 font-mono mt-1">Inv: {item.orderNumber}</p>}
                        {item.serialNumber && <p className="text-xs text-gray-400 font-mono">S/N: {item.serialNumber}</p>}
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-3">
                    <button onClick={handleDownload} className="btn bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 shadow-sm flex justify-center items-center gap-2">
                        <RiDownloadLine size={18} />
                        Yuklab olish
                    </button>
                    <button onClick={handlePrint} className="btn btn-primary shadow-lg shadow-indigo-200 flex justify-center items-center gap-2">
                        <RiPrinterLine size={18} />
                        Chop etish
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QRGeneratorModal;
