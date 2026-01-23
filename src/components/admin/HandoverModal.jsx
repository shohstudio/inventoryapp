import { useState, useEffect } from "react";
import { RiCloseLine, RiSave3Line, RiImageAddLine } from "react-icons/ri";
import { toast } from "react-hot-toast";
import { BASE_URL } from "../../api/axios";

const HandoverModal = ({ isOpen, onClose, onSave, item }) => {
    const [formData, setFormData] = useState({
        handoverName: "",
        handoverPosition: "",
        handoverDate: new Date().toISOString().split('T')[0],
        handoverImage: null, // File object or URL string
        handoverImagePreview: null
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (item) {
            setFormData({
                handoverName: item.initialOwner || "",
                handoverPosition: item.initialRole || "",
                handoverDate: item.assignedDate ? item.assignedDate.split('T')[0] : new Date().toISOString().split('T')[0],
                handoverImage: item.handoverImage || null,
                handoverImagePreview: item.handoverImage ? (item.handoverImage.startsWith('http') ? item.handoverImage : BASE_URL.replace('/api', '') + item.handoverImage) : null
            });
        } else {
            setFormData({
                handoverName: "",
                handoverPosition: "",
                handoverDate: new Date().toISOString().split('T')[0],
                handoverImage: null,
                handoverImagePreview: null
            });
        }
        setErrors({});
    }, [item, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                handoverImage: file,
                handoverImagePreview: URL.createObjectURL(file)
            }));
            if (errors.handoverImage) setErrors(prev => ({ ...prev, handoverImage: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.handoverName.trim()) newErrors.handoverName = "Ism/Familya kiritilishi shart";
        if (!formData.handoverPosition.trim()) newErrors.handoverPosition = "Lavozim kiritilishi shart";
        if (!formData.handoverDate) newErrors.handoverDate = "Sana kiritilishi shart";
        // Image is mandatory
        if (!formData.handoverImage) newErrors.handoverImage = "Rasm yuklash majburiy";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Barcha maydonlarni to'ldiring!");
            return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">
                        Topshirish (Handover)
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <RiCloseLine size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="label">Ism Familya <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="handoverName"
                            className={`input ${errors.handoverName ? 'border-red-500 ring-red-500' : ''}`}
                            value={formData.handoverName}
                            onChange={handleChange}
                            placeholder="F.I.SH"
                        />
                        {errors.handoverName && <p className="text-red-500 text-xs mt-1">{errors.handoverName}</p>}
                    </div>

                    <div>
                        <label className="label">Lavozimi <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="handoverPosition"
                            className={`input ${errors.handoverPosition ? 'border-red-500 ring-red-500' : ''}`}
                            value={formData.handoverPosition}
                            onChange={handleChange}
                            placeholder="Masalan: Bosh hisobchi"
                        />
                        {errors.handoverPosition && <p className="text-red-500 text-xs mt-1">{errors.handoverPosition}</p>}
                    </div>

                    <div>
                        <label className="label">Topshirish sanasi <span className="text-red-500">*</span></label>
                        <input
                            type="date"
                            name="handoverDate"
                            className={`input ${errors.handoverDate ? 'border-red-500 ring-red-500' : ''}`}
                            value={formData.handoverDate}
                            onChange={handleChange}
                        />
                        {errors.handoverDate && <p className="text-red-500 text-xs mt-1">{errors.handoverDate}</p>}
                    </div>

                    <div>
                        <label className="label block mb-2">Tasdiqlovchi Rasm <span className="text-red-500">*</span></label>
                        <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors relative h-40 flex items-center justify-center bg-gray-50 ${errors.handoverImage ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-blue-400'}`}>

                            {formData.handoverImagePreview ? (
                                <div className="absolute inset-0 w-full h-full p-2">
                                    <img
                                        src={formData.handoverImagePreview}
                                        alt="Handover Preview"
                                        className="w-full h-full object-contain rounded-lg"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg cursor-pointer text-white font-medium" onClick={() => document.getElementById('handoverInfoImage').click()}>
                                        O'zgartirish
                                    </div>
                                </div>
                            ) : (
                                <label htmlFor="handoverInfoImage" className="cursor-pointer flex flex-col items-center gap-2 text-gray-400 hover:text-blue-500 w-full h-full justify-center">
                                    <RiImageAddLine size={32} />
                                    <span className="text-sm">Rasm yuklash</span>
                                </label>
                            )}

                            <input
                                type="file"
                                id="handoverInfoImage"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </div>
                        {errors.handoverImage && <p className="text-red-500 text-xs mt-1 text-center">{errors.handoverImage}</p>}
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                        <button type="button" onClick={onClose} className="btn btn-outline">Bekor qilish</button>
                        <button type="submit" className="btn btn-primary bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
                            <RiSave3Line size={18} /> Saqlash
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default HandoverModal;
