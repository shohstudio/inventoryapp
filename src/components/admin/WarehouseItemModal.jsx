import { useState, useEffect } from "react";
import { RiCloseLine, RiSave3Line } from "react-icons/ri";

const WarehouseItemModal = ({ isOpen, onClose, onSave, item }) => {
    const [formData, setFormData] = useState({
        name: "",
        category: "",
        model: "",
        manufactureYear: "",
        arrivalDate: new Date().toISOString().split('T')[0],
        supplier: "", // Olingan magazin
        warranty: "", // Kafolat muddati
        price: "",
        quantity: "1",
        images: []
    });

    useEffect(() => {
        if (item) {
            setFormData({
                ...item,
                images: item.images || []
            });
        } else {
            setFormData({
                name: "",
                category: "",
                model: "",
                manufactureYear: "",
                arrivalDate: new Date().toISOString().split('T')[0],
                supplier: "",
                warranty: "",
                price: "",
                quantity: "1",
                images: []
            });
        }
    }, [item, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files).map(file => URL.createObjectURL(file));
            setFormData(prev => ({ ...prev, images: [...prev.images, ...filesArray] }));
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
                            <label className="label">Nomi</label>
                            <input
                                type="text"
                                name="name"
                                className="input"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Masalan: Monitor Dell"
                            />
                        </div>
                        <div>
                            <label className="label">Kategoriya</label>
                            <input
                                type="text"
                                name="category"
                                className="input"
                                value={formData.category}
                                onChange={handleChange}
                                placeholder="Masalan: Elektronika"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Model</label>
                            <input
                                type="text"
                                name="model"
                                className="input"
                                value={formData.model}
                                onChange={handleChange}
                                placeholder="P2419H"
                            />
                        </div>
                        <div>
                            <label className="label">Ishlab chiqarilgan yili</label>
                            <input
                                type="text"
                                name="manufactureYear"
                                className="input"
                                value={formData.manufactureYear}
                                onChange={handleChange}
                                placeholder="2023"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Omborga kelgan kuni</label>
                            <input
                                type="date"
                                name="arrivalDate"
                                className="input"
                                value={formData.arrivalDate}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="label">Olingan magazin (Yetkazib beruvchi)</label>
                            <input
                                type="text"
                                name="supplier"
                                className="input"
                                value={formData.supplier}
                                onChange={handleChange}
                                placeholder="MediaPark, Texnomart..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Kafolat muddati</label>
                            <input
                                type="text"
                                name="warranty"
                                className="input"
                                value={formData.warranty}
                                onChange={handleChange}
                                placeholder="1 yil"
                            />
                        </div>
                        <div>
                            <label className="label">Narxi (dona)</label>
                            <input
                                type="text"
                                name="price"
                                className="input"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="So'm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Soni</label>
                            <input
                                type="number"
                                name="quantity"
                                className="input"
                                value={formData.quantity}
                                onChange={handleChange}
                                min="1"
                                placeholder="1"
                            />
                        </div>
                    </div>

                    {/* Image Upload Section */}
                    <div>
                        <label className="label flex justify-between">
                            Jihoz rasmlari
                        </label>
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-orange-300 transition-colors">
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
                                {formData.images.map((img, index) => (
                                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-100">
                                        <img src={img} alt={`Preview ${index}`} className="w-full h-full object-cover" />
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
