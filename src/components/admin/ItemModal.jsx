import { useState, useEffect } from "react";
import { RiCloseLine, RiSave3Line, RiFilePdfLine, RiUserLine } from "react-icons/ri";

const ItemModal = ({ isOpen, onClose, onSave, item, initialData }) => {
    const [formData, setFormData] = useState({
        name: "",
        model: "",
        serial: "",
        inn: "",
        orderNumber: "",
        category: "",
        building: "Bosh Ofis",
        department: "",
        location: "",
        quantity: 1, // NEW FIELD
        purchaseDate: "",
        price: "",
        price: "", // NEW FIELD
        status: "working",
        assignedTo: "",
        assignedRole: "",
        assignedPINFL: "",
        images: [],
        pdf: null
    });

    useEffect(() => {
        if (item) {
            setFormData({
                ...item,
                assignedPINFL: item.assignedPINFL || "",
                assignedRole: item.assignedRole || "",
                images: item.images || [],
                pdf: item.pdf || null
            });
        } else if (initialData) {
            // Pre-fill from warehouse data
            setFormData({
                name: initialData.name || "",
                model: initialData.model || "",
                serial: "", // Warehouse items might not have serials yet, or user needs to input it
                inn: "",
                orderNumber: "",
                category: initialData.category || "",
                building: "Bosh Ofis",
                location: "",
                status: "working",
                assignedTo: "",
                assignedRole: "",
                assignedPINFL: "",
                images: initialData.images || [], // Inherit images
                pdf: null,
                price: initialData.price || "" // Inherit price
            });
        } else {
            setFormData({
                name: "",
                model: "",
                serial: "",
                inn: "",
                orderNumber: "",
                category: "",
                building: "Bosh Ofis",
                location: "",
                status: "working",
                assignedTo: "",
                assignedRole: "",
                assignedPINFL: "",
                images: [],
                pdf: null
            });
        }
    }, [item, initialData, isOpen]);

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

    const handlePdfChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, pdf: e.target.files[0] }));
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
                        {item ? "Jihozni tahrirlash" : "Yangi jihoz qo'shish"}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <RiCloseLine size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-6">
                            <label className="label">Nomi</label>
                            <input
                                type="text"
                                name="name"
                                className="input"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="MacBook Pro"
                            />
                        </div>
                        <div className="md:col-span-4">
                            <label className="label">Model</label>
                            <input
                                type="text"
                                name="model"
                                className="input"
                                value={formData.model}
                                onChange={handleChange}
                                placeholder="A2338"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="label">Soni</label>
                            <input
                                type="number"
                                name="quantity"
                                className="input"
                                value={formData.quantity || 1}
                                onChange={handleChange}
                                min="1"
                                placeholder="1"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Seriya raqami</label>
                            <input
                                type="text"
                                name="serial"
                                className="input"
                                required
                                value={formData.serial}
                                onChange={handleChange}
                                placeholder="FVFD1234"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">INN Raqami</label>
                                <input
                                    type="text"
                                    name="inn"
                                    className="input"
                                    value={formData.inn}
                                    onChange={handleChange}
                                    placeholder="123456"
                                />
                            </div>
                            <div>
                                <label className="label">Xarid Sanasi</label>
                                <input
                                    type="date"
                                    name="purchaseDate"
                                    className="input"
                                    value={formData.purchaseDate || ""}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="label">Narxi</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="price"
                                        className="input pr-12"
                                        value={formData.price || ""}
                                        onChange={(e) => {
                                            // Allow numbers, spaces, and ONE comma
                                            let val = e.target.value.replace(/[^0-9\s,]/g, '');

                                            // Ensure only one comma
                                            const parts = val.split(',');
                                            if (parts.length > 2) {
                                                val = parts[0] + ',' + parts.slice(1).join('');
                                            }

                                            setFormData(prev => ({ ...prev, price: val }));
                                        }}
                                        placeholder="14 000 000,00"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                                        so'm
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Location & Category */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Kategoriya</label>
                            <input
                                type="text"
                                name="category"
                                className="input"
                                value={formData.category}
                                onChange={handleChange}
                                placeholder="Laptop, Mebel, Printer..."
                            />
                        </div>
                        <div>
                            <label className="label">Holati</label>
                            <select
                                name="status"
                                className="input"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="working">Ishchi</option>
                                <option value="repair">Ta'mir talab</option>
                                <option value="written-off">Ro'yxatdan chiqarilgan</option>
                                <option value="broken">Buzilgan</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Bino (Ofis)</label>
                            <input
                                type="text"
                                name="building"
                                className="input"
                                value={formData.building}
                                onChange={handleChange}
                                placeholder="Bosh Ofis"
                            />
                        </div>
                        <div>
                            <label className="label">Bo'lim</label>
                            <input
                                type="text"
                                name="department"
                                className="input"
                                value={formData.department || ""}
                                onChange={handleChange}
                                placeholder="IT Bo'limi"
                            />
                        </div>
                        <div>
                            <label className="label">Aniq Joylashuvi (Xona)</label>
                            <input
                                type="text"
                                name="location"
                                className="input"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="2-qavat, 203-xona"
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <RiUserLine /> Javobgar shaxs ma'lumotlari
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="label">F.I.SH</label>
                                <input
                                    type="text"
                                    name="assignedTo"
                                    className="input bg-white"
                                    value={formData.assignedTo}
                                    onChange={handleChange}
                                    placeholder="Ali Valiyev"
                                />
                            </div>
                            <div>
                                <label className="label">Lavozimi</label>
                                <input
                                    type="text"
                                    name="assignedRole"
                                    className="input bg-white"
                                    value={formData.assignedRole}
                                    onChange={handleChange}
                                    placeholder="Hisobchi"
                                />
                            </div>
                            <div>
                                <label className="label">JSHSHIR (PINFL)</label>
                                <input
                                    type="text"
                                    name="assignedPINFL"
                                    className="input bg-white"
                                    value={formData.assignedPINFL}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 14);
                                        setFormData(prev => ({ ...prev, assignedPINFL: val }));
                                    }}
                                    placeholder="14 xonali raqam"
                                    minLength={14}
                                    maxLength={14}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Image Upload Section */}
                    <div>
                        <label className="label flex justify-between">
                            Jihoz rasmlari
                            {formData.images.length < 4 && (
                                <span className="text-red-500 text-xs font-semibold">
                                    Kamida 4 ta rasm yuklang ({formData.images.length}/4)
                                </span>
                            )}
                        </label>
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-indigo-300 transition-colors">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                                id="image-upload"
                            />
                            <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center gap-2 text-gray-500">
                                <span className="p-3 bg-gray-50 rounded-full text-indigo-600">
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
                            className="btn btn-primary shadow-lg shadow-indigo-200"
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

export default ItemModal;
