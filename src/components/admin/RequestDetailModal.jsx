import React from 'react';
import { RiCloseLine, RiTimeLine, RiUserLine, RiMapPinLine, RiFileList3Line, RiShieldCheckLine, RiBox3Line, RiUser3Line } from 'react-icons/ri';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from 'react-hot-toast';
import { BASE_URL } from '../../api/axios';

const UserAvatar = ({ user, size = "w-10 h-10" }) => {
    if (!user) return <div className={`${size} rounded-full bg-gray-100 flex items-center justify-center text-gray-300 border border-dashed border-gray-200`}><RiUser3Line size={size.includes('10') ? 20 : 16} /></div>;

    const imageUrl = user.image ? (user.image.startsWith('http') ? user.image : `${BASE_URL.replace('/api', '')}${user.image}`) : null;

    return (
        <div className={`${size} rounded-full overflow-hidden bg-white flex items-center justify-center border border-gray-100 flex-shrink-0 shadow-sm ring-2 ring-white`}>
            {imageUrl ? (
                <img src={imageUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-indigo-400">
                    <RiUser3Line size={size.includes('10') ? 20 : 16} />
                </div>
            )}
        </div>
    );
};

const RequestDetailModal = ({ isOpen, onClose, request, onApprove, onReject, isProcessing, userRole }) => {
    const { t } = useLanguage();
    const [file, setFile] = React.useState(null);

    // Reset file when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setFile(null);
        }
    }, [isOpen]);

    if (!isOpen || !request) return null;

    const { item, requester, targetUser, type, status, createdAt, description } = request;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <RiFileList3Line className="text-blue-600" />
                        So'rov ma'lumotlari
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                    >
                        <RiCloseLine size={24} />
                    </button>
                </div>

                {/* Content */}
                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Item Details */}
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 relative overflow-hidden">
                        <div className="flex gap-4">
                            {/* Item Image */}
                            {item?.image ? (
                                <div className="w-24 h-24 rounded-lg overflow-hidden border border-blue-200 bg-white flex-shrink-0 cursor-pointer" onClick={() => window.open(item.image.startsWith('http') ? item.image : `${BASE_URL.replace('/api', '')}${item.image}`, '_blank')}>
                                    <img
                                        src={item.image.startsWith('http') ? item.image : `${BASE_URL.replace('/api', '')}${item.image}`}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-24 h-24 rounded-lg overflow-hidden border border-blue-200 bg-white flex-shrink-0 flex items-center justify-center text-blue-300">
                                    <RiBox3Line size={32} />
                                </div>
                            )}

                            <div className="flex-1 space-y-2">
                                <h3 className="text-sm uppercase tracking-wider text-blue-800 font-bold mb-1 flex items-center gap-2">
                                    <RiBox3Line className="text-lg" /> Jihoz Ma'lumotlari
                                </h3>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 text-sm">Nomi:</span>
                                    <span className="font-medium text-gray-900">{item?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 text-sm">Kategoriya:</span>
                                    <span className="text-gray-900">{item?.category}</span>
                                </div>
                                {item?.model && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 text-sm">Model:</span>
                                        <span className="text-gray-900">{item.model}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-500 text-sm">Narxi:</span>
                                    <span className="text-gray-900">
                                        {item?.price ? parseInt(item.price).toLocaleString() : 0} so'm
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 text-sm">Soni:</span>
                                    <span className="text-gray-900">
                                        {item?.quantity || 1} ta
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Accountant Document (Nakladnoy) */}
                    {request.accountantDocument && (
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 border-l-4 border-l-orange-400">
                            <h4 className="text-sm font-bold text-orange-800 mb-2 flex items-center gap-2">
                                <RiFileList3Line /> Biriktirilgan Hujjat (Nakladnoy)
                            </h4>
                            <a
                                href={`${BASE_URL.replace('/api', '')}${request.accountantDocument}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-orange-200 hover:bg-orange-50 transition-colors group"
                            >
                                <div className="p-2 bg-red-100 text-red-600 rounded-lg group-hover:bg-red-200 transition-colors">
                                    {request.accountantDocument.endsWith('.pdf') ? <RiFileList3Line size={24} /> : <RiBox3Line size={24} />}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800 text-sm">Hujjatni ko'rish</p>
                                    <p className="text-xs text-gray-500">Hisobchi tomonidan yuklangan</p>
                                </div>
                            </a>
                        </div>
                    )}

                    {/* Users Involved */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start gap-3">
                            <UserAvatar user={type === 'exit' ? item?.assignedTo : requester} />
                            <div>
                                <h4 className="text-xs uppercase text-gray-500 font-semibold mb-1 flex items-center gap-1">
                                    <RiUserLine /> Kimdan
                                </h4>
                                <p className="font-medium text-sm text-gray-900">
                                    {type === 'exit' ? (item?.assignedTo?.name || "Noma'lum") : requester?.name}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {type === 'exit' ? "Egasi" : requester?.role}
                                </p>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start gap-3">
                            <UserAvatar user={type === 'exit' ? null : targetUser} />
                            <div>
                                <h4 className="text-xs uppercase text-gray-500 font-semibold mb-1 flex items-center gap-1">
                                    <RiMapPinLine /> Kimga
                                </h4>
                                <p className="font-medium text-sm text-gray-900">
                                    {type === 'exit' ?
                                        (description?.match(/Olib chiquvchi: ([^.]+)/)?.[1] || "Aniqlanmadi") :
                                        (targetUser?.name || "Bino")
                                    }
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {type === 'exit' ? "Olib chiquvchi" : "Qabul qiluvchi"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <RiTimeLine className="text-gray-400 text-lg" />
                            <span>Sana: <span className="font-medium text-gray-900">{new Date(createdAt).toLocaleString('uz-UZ')}</span></span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <RiShieldCheckLine className="text-gray-400 text-lg" />
                            <span>Holati:
                                <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium border ${status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                                    status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                        'bg-yellow-100 text-yellow-700 border-yellow-200'
                                    }`}>
                                    {status}
                                </span>
                            </span>
                        </div>
                        {description && (
                            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-yellow-800 mt-2">
                                <span className="font-semibold block mb-1">Izoh:</span>
                                {description}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-gray-100 bg-gray-50 flex flex-col gap-3">
                    {/* Accountant Actions */}
                    {userRole === 'accounter' && status === 'pending_accountant' && (
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tasdiqlash hujjati (PDF) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="file"
                                accept=".pdf, .jpg, .jpeg, .png"
                                onChange={(e) => setFile(e.target.files[0])}
                                className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100 transition-colors mb-3"
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => onReject(request.id)}
                                    disabled={isProcessing}
                                    className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-xl hover:bg-red-50 font-medium transition-colors shadow-sm"
                                >
                                    Rad etish
                                </button>
                                <button
                                    onClick={() => {
                                        if (!file) {
                                            toast.error("Iltimos, nakladnoy (PDF) hujjatni yuklang!");
                                            return;
                                        }
                                        onApprove(request.id, type === 'exit' ? 'approved' : 'pending_employee', file);
                                    }}
                                    disabled={isProcessing}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors shadow-lg shadow-blue-200 flex items-center gap-2"
                                >
                                    {isProcessing ? "..." : "Tasdiqlash"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Employee Actions */}
                    {(userRole === 'employee' || userRole === 'admin') && status === 'pending_employee' && (
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => onReject(request.id)}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-xl hover:bg-red-50 font-medium transition-colors shadow-sm"
                            >
                                Rad etish
                            </button>
                            <button
                                onClick={() => onApprove(request.id, 'completed', null)} // Employee completes it
                                disabled={isProcessing}
                                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition-colors shadow-lg shadow-green-200 flex items-center gap-2"
                            >
                                <RiShieldCheckLine /> Qabul qilish
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default RequestDetailModal;
