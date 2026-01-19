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
        status: "working",
        assignedTo: "",
        assignedRole: "",
        assignedPINFL: "",
        images: [],
        pdf: null
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        setErrors({}); // Reset errors on open
        if (item) {
            console.log("ItemModal received item:", item);
            setFormData({
                name: item.name || "",
                model: item.model || "",
                serial: item.serialNumber || "",
                inn: item.inn || "",
                orderNumber: item.orderNumber || "",
                category: item.category || "",
                building: item.building || "Bosh Ofis",
                department: item.department || "",
                location: item.location || "",
                quantity: item.quantity || 1,
                purchaseDate: item.purchaseDate || "",
                price: item.price || "",
                status: item.status || "working",
                assignedTo: item.assignedTo ? item.assignedTo.name : (item.initialOwner || ""),
                assignedRole: item.assignedTo ? item.assignedTo.position : (item.initialRole || ""),
                assignedPINFL: item.assignedTo ? item.assignedTo.pinfl : (item.initialPinfl || ""),
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

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Shu joyni to'ldirish majburiy";
        if (!formData.model.trim()) newErrors.model = "Shu joyni to'ldirish majburiy";
        // Serial is only mandatory when EDITING (if user wants to keep it strict there) 
        // OR simply make it optional generally? User said "Remove from Add".
        // Let's assume if it's hidden in Add, we skip validation.
        if (item && !formData.serial.trim()) newErrors.serial = "Shu joyni to'ldirish majburiy";
        if (!formData.category.trim()) newErrors.category = "Shu joyni to'ldirish majburiy";
        if (!formData.building.trim()) newErrors.building = "Shu joyni to'ldirish majburiy";
        if (!formData.location.trim()) newErrors.location = "Shu joyni to'ldirish majburiy";
        if (!formData.price) newErrors.price = "Shu joyni to'ldirish majburiy";
        if (!formData.quantity) newErrors.quantity = "Shu joyni to'ldirish majburiy";

        // New Mandatory Fields
        if (!formData.inn.trim()) newErrors.inn = "Shu joyni to'ldirish majburiy";
        if (!formData.purchaseDate) newErrors.purchaseDate = "Shu joyni to'ldirish majburiy";
        if (!formData.department.trim()) newErrors.department = "Shu joyni to'ldirish majburiy";

        // Assigned Person Mandatory
        if (!formData.assignedTo.trim()) newErrors.assignedTo = "Shu joyni to'ldirish majburiy";
        if (!formData.assignedRole.trim()) newErrors.assignedRole = "Shu joyni to'ldirish majburiy";
        if (!formData.assignedPINFL.trim()) newErrors.assignedPINFL = "Shu joyni to'ldirish majburiy";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
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
        if (!validate()) return;
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
                            <label className="label">Nomi <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="name"
                                className={`input ${errors.name ? 'border-red-500 ring-red-500' : ''}`}
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="MacBook Pro"
                            />
                            {errors.name && <span className="text-red-500 text-xs mt-1 block">{errors.name}</span>}
                        </div>
                        <div className="md:col-span-4">
                            <label className="label">Model <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="model"
                                className={`input ${errors.model ? 'border-red-500 ring-red-500' : ''}`}
                                value={formData.model}
                                onChange={handleChange}
                                placeholder="A2338"
                            />
                            {errors.model && <span className="text-red-500 text-xs mt-1 block">{errors.model}</span>}
                        </div>
                        <div className="md:col-span-2">
                            <label className="label">Soni <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                name="quantity"
                                className={`input ${errors.quantity ? 'border-red-500 ring-red-500' : ''}`}
                                value={formData.quantity || 1}
                                onChange={handleChange}
                                min="1"
                                placeholder="1"
                            />
                            {errors.quantity && <span className="text-red-500 text-xs mt-1 block">{errors.quantity}</span>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {item && (
                            <div>
                                <label className="label">Seriya raqami <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="serial"
                                    className={`input ${errors.serial ? 'border-red-500 ring-red-500' : ''}`}
                                    value={formData.serial}
                                    onChange={handleChange}
                                    placeholder="FVFD1234"
                                />
                                {errors.serial && <span className="text-red-500 text-xs mt-1 block">{errors.serial}</span>}
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">INN Raqami <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="inn"
                                    className={`input ${errors.inn ? 'border-red-500 ring-red-500' : ''}`}
                                    value={formData.inn}
                                    onChange={handleChange}
                                    placeholder="123456"
                                />
                                {errors.inn && <span className="text-red-500 text-xs mt-1 block">{errors.inn}</span>}
                            </div>
                            <div>
                                <label className="label">Xarid Sanasi <span className="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    name="purchaseDate"
                                    className={`input ${errors.purchaseDate ? 'border-red-500 ring-red-500' : ''}`}
                                    value={formData.purchaseDate || ""}
                                    onChange={handleChange}
                                />
                                {errors.purchaseDate && <span className="text-red-500 text-xs mt-1 block">{errors.purchaseDate}</span>}
                            </div>
                            <div className="col-span-2">
                                <label className="label">Narxi <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="price"
                                        className={`input pr-12 ${errors.price ? 'border-red-500 ring-red-500' : ''}`}
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
                                            // Clear error manually for this custom handler
                                            if (errors.price) setErrors(prev => ({ ...prev, price: "" }));
                                        }}
                                        placeholder="14 000 000,00"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                                        so'm
                                    </span>
                                </div>
                                {errors.price && <span className="text-red-500 text-xs mt-1 block">{errors.price}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Location & Category */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Kategoriya <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="category"
                                className={`input ${errors.category ? 'border-red-500 ring-red-500' : ''}`}
                                value={formData.category}
                                onChange={handleChange}
                                placeholder="Laptop, Mebel, Printer..."
                            />
                            {errors.category && <span className="text-red-500 text-xs mt-1 block">{errors.category}</span>}
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
                            <label className="label">Bino (Ofis) <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="building"
                                className={`input ${errors.building ? 'border-red-500 ring-red-500' : ''}`}
                                value={formData.building}
                                onChange={handleChange}
                                placeholder="Bosh Ofis"
                            />
                            {errors.building && <span className="text-red-500 text-xs mt-1 block">{errors.building}</span>}
                        </div>
                        <div>
                            <label className="label">Bo'lim <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="department"
                                className={`input ${errors.department ? 'border-red-500 ring-red-500' : ''}`}
                                value={formData.department || ""}
                                onChange={handleChange}
                                placeholder="IT Bo'limi"
                            />
                            {errors.department && <span className="text-red-500 text-xs mt-1 block">{errors.department}</span>}
                        </div>
                        <div>
                            <label className="label">Aniq Joylashuvi (Xona) <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="location"
                                className={`input ${errors.location ? 'border-red-500 ring-red-500' : ''}`}
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="2-qavat, 203-xona"
                            />
                            {errors.location && <span className="text-red-500 text-xs mt-1 block">{errors.location}</span>}
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <RiUserLine /> Javobgar shaxs ma'lumotlari
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="label">F.I.SH <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="assignedTo"
                                    className={`input bg-white ${errors.assignedTo ? 'border-red-500 ring-red-500' : ''}`}
                                    value={formData.assignedTo}
                                    onChange={handleChange}
                                    placeholder="Ali Valiyev"
                                />
                                {errors.assignedTo && <span className="text-red-500 text-xs mt-1 block">{errors.assignedTo}</span>}
                            </div>
                            <div>
                                <label className="label">Lavozimi <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="assignedRole"
                                    className={`input bg-white ${errors.assignedRole ? 'border-red-500 ring-red-500' : ''}`}
                                    value={formData.assignedRole}
                                    onChange={handleChange}
                                    placeholder="Hisobchi"
                                />
                                {errors.assignedRole && <span className="text-red-500 text-xs mt-1 block">{errors.assignedRole}</span>}
                            </div>
                            <div>
                                <label className="label">JSHSHIR (PINFL) <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="assignedPINFL"
                                    className={`input bg-white ${errors.assignedPINFL ? 'border-red-500 ring-red-500' : ''}`}
                                    value={formData.assignedPINFL}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 14);
                                        setFormData(prev => ({ ...prev, assignedPINFL: val }));
                                        // Clear error manually for custom handler
                                        if (errors.assignedPINFL) setErrors(prev => ({ ...prev, assignedPINFL: "" }));
                                    }}
                                    placeholder="14 xonali raqam"
                                    minLength={14}
                                    maxLength={14}
                                />
                                {errors.assignedPINFL && <span className="text-red-500 text-xs mt-1 block">{errors.assignedPINFL}</span>}
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
