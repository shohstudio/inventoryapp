import { useState, useEffect } from "react";
import { RiCloseLine, RiSave3Line, RiFilePdfLine } from "react-icons/ri";
import { toast } from "react-hot-toast";
import { BASE_URL, getImageUrl } from "../../api/axios";

const WarehouseItemModal = ({ isOpen, onClose, onSave, item }) => {
    // Categories matching ItemModal
    const categories = ["Kompyuter", "Printer", "TV", "Konditsioner", "Interaktiv panel", "Mebel jihozlar"];

    const [formData, setFormData] = useState({
        name: "",
        category: categories[0],
        model: "",
        manufactureYear: "",
        arrivalDate: new Date().toISOString().split('T')[0],
        supplier: "", // Olingan magazin
        warranty: "", // Kafolat muddati
        price: "",
        quantity: "1",
        images: []
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (item) {
            setFormData({
                ...item,
                category: item.category || categories[0],
                // Parse images if it's a JSON string to avoid .map error
                images: (typeof item.images === 'string'
                    ? JSON.parse(item.images || "[]")
                    : (item.images || [])).map(url => ({
                        preview: url,
                        file: null,
                        isExisting: true
                    })),
                pdf: item.contractPdf || null
            });
        } else {
            setFormData({
                name: "",
                category: categories[0],
                model: "",
                manufactureYear: "",
                arrivalDate: new Date().toISOString().split('T')[0],
                supplier: "",
                warranty: "",
                price: "",
                quantity: "1",
                images: [], // Array of { preview, file, isExisting }
                pdf: null
            });
        }
        setErrors({});
    }, [item, isOpen]);

    if (!isOpen) return null;

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Nomi kiritilishi shart";
        if (!formData.model.trim()) newErrors.model = "Model kiritilishi shart";
        if (!formData.manufactureYear.trim()) newErrors.manufactureYear = "Yil kiritilishi shart";
        if (!formData.supplier.trim()) newErrors.supplier = "Yetkazib beruvchi kiritilishi shart";
        if (!formData.warranty.trim()) newErrors.warranty = "Kafolat muddati kiritilishi shart";
        if (!formData.price.toString().trim()) newErrors.price = "Narx kiritilishi shart";
        if (!formData.quantity) newErrors.quantity = "Soni kiritilishi shart";

        // Strict image validation
        if (formData.images.length === 0) {
            newErrors.images = "Kamida 1 ta rasm yuklash shart";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        let newValue = value;
        if (name === 'price') {
            // Removes all non-digits
            const raw = value.replace(/\D/g, '');
            // Format with spaces
            newValue = raw.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        }

        setFormData(prev => ({ ...prev, [name]: newValue }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleImageChange = (e) => {
        if (e.target.files) {
            const newImages = Array.from(e.target.files).map(file => ({
                preview: URL.createObjectURL(file),
                file: file,
                isExisting: false
            }));

            setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));

            if (errors.images) {
                setErrors(prev => ({ ...prev, images: null }));
            }
        }
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Barcha maydonlarni to'ldiring!");
            return;
        }
        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-800">
                        {item ? "Ombor jihozini tahrirlash" : "Omborga yangi jihoz qo'shish"}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <RiCloseLine size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Nomi <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="name"
                                className={`input ${errors.name ? 'border-red-500 ring-red-500' : ''}`}
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Masalan: Monitor Dell"
                            />
                        </div>
                        <div>
                            <label className="label">Kategoriya <span className="text-red-500">*</span></label>
                            <select
                                name="category"
                                className={`input ${errors.category ? 'border-red-500 ring-red-500' : ''}`}
                                value={formData.category}
                                onChange={handleChange}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Model <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="model"
                                className={`input ${errors.model ? 'border-red-500 ring-red-500' : ''}`}
                                value={formData.model}
                                onChange={handleChange}
                                placeholder="P2419H"
                            />
                        </div>
                        <div>
                            <label className="label">Ishlab chiqarilgan yili <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="manufactureYear"
                                className={`input ${errors.manufactureYear ? 'border-red-500 ring-red-500' : ''}`}
                                value={formData.manufactureYear}
                                onChange={handleChange}
                                placeholder="2023"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Omborga kelgan kuni <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                name="arrivalDate"
                                className="input"
                                value={formData.arrivalDate}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="label">Olingan magazin (Yetkazib beruvchi) <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="supplier"
                                className={`input ${errors.supplier ? 'border-red-500 ring-red-500' : ''}`}
                                value={formData.supplier}
                                onChange={handleChange}
                                placeholder="MediaPark, Texnomart..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Kafolat muddati <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="warranty"
                                className={`input ${errors.warranty ? 'border-red-500 ring-red-500' : ''}`}
                                value={formData.warranty}
                                onChange={handleChange}
                                placeholder="1 yil"
                            />
                        </div>
                        <div>
                            <label className="label">Narxi (dona) <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="price"
                                className={`input ${errors.price ? 'border-red-500 ring-red-500' : ''}`}
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="So'm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Soni <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                name="quantity"
                                className={`input ${errors.quantity ? 'border-red-500 ring-red-500' : ''}`}
                                value={formData.quantity}
                                onChange={handleChange}
                                min="1"
                                placeholder="1"
                            />
                        </div>
                    </div>

                    {/* PDF Upload Section */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <label className="label flex items-center gap-2">
                            <RiFilePdfLine className="text-blue-600" />
                            Shartnoma (PDF)
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={(e) => {
                                    if (e.target.files[0]) {
                                        setFormData(prev => ({ ...prev, pdf: e.target.files[0] }));
                                    }
                                }}
                                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 text-sm text-gray-500"
                            />
                            {formData.pdf && (typeof formData.pdf === 'string' ? (
                                <a href={formData.pdf} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">
                                    Joriy fayl
                                </a>
                            ) : (
                                <span className="text-xs text-green-600 font-medium">Tanlandi</span>
                            ))}
                        </div>
                    </div>

                    {/* Image Upload Section */}
                    <div>
                        <label className="label flex justify-between">
                            Jihoz rasmlari <span className="text-red-500">*</span>
                            {errors.images && <span className="text-red-500 text-xs font-bold">{errors.images}</span>}
                        </label>
                        <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${errors.images ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-orange-300'}`}>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                                id="warehouse-image-upload"
                            />
                            <label htmlFor="warehouse-image-upload" className="cursor-pointer flex flex-col items-center gap-2 text-gray-500">
                                <span className="p-3 bg-orange-50 rounded-full text-orange-600">
                                    <RiSave3Line size={24} />
                                </span>
                                <span>Rasmlarni tanlash uchun bosing</span>
                            </label>
                        </div>

                        {/* Image Previews */}
                        {formData.images.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 mt-4">
                                {formData.images.map((imgObj, index) => (
                                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-100">
                                        <img src={getImageUrl(imgObj.preview)} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <RiCloseLine size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-outline"
                        >
                            Bekor qilish
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-200 border-orange-600"
                        >
                            <RiSave3Line size={18} />
                            Saqlash
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WarehouseItemModal;
