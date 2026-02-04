import React from 'react';
import { RiErrorWarningLine, RiCloseLine } from 'react-icons/ri';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Ha, o'chirish",
    cancelText = "Bekor qilish",
    isDanger = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md transform transition-all scale-100 animate-in fade-in zoom-in-95 duration-200 border border-transparent dark:border-slate-700">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                    <RiCloseLine size={24} />
                </button>

                <div className="p-6">
                    <div className="flex flex-col items-center text-center sm:items-start sm:text-left sm:flex-row gap-4">
                        {/* Icon */}
                        <div className={`p-3 rounded-full shrink-0 ${isDanger ? 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400'}`}>
                            <RiErrorWarningLine size={32} />
                        </div>

                        {/* Text */}
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {title}
                            </h3>
                            <div className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">
                                {message}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="btn bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-600 shadow-sm w-full sm:w-auto justify-center"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`btn text-white shadow-md w-full sm:w-auto justify-center ${isDanger
                                ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                                }`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
