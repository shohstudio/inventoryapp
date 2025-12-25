import { useState, useEffect } from "react";
import { RiCloseLine, RiSave3Line } from "react-icons/ri";

const ItemModal = ({ isOpen, onClose, onSave, item }) => {
    const [formData, setFormData] = useState({
        name: "",
        model: "",
        serial: "",
        category: "Laptop",
        status: "working",
        assignedTo: ""
    });

    useEffect(() => {
        if (item) {
            setFormData(item);
        } else {
            setFormData({
                name: "",
                model: "",
                serial: "",
                category: "Laptop",
                status: "working",
                assignedTo: ""
            });
        }
    }, [item, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">
                        {item ? "Jihozni tahrirlash" : "Yangi jihoz qo'shish"}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <RiCloseLine size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
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
                        <div>
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
                    </div>

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
                            <label className="label">Kategoriya</label>
                            <select
                                name="category"
                                className="input"
                                value={formData.category}
                                onChange={handleChange}
                            >
                                <option value="Laptop">Laptop</option>
                                <option value="Monitor">Monitor</option>
                                <option value="Printer">Printer</option>
                                <option value="Phone">Phone</option>
                                <option value="Furniture">Mebel</option>
                                <option value="Other">Boshqa</option>
                            </select>
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
                                <option value="repair">Ta'mirda</option>
                                <option value="broken">Buzilgan</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="label">Javobgar shaxs</label>
                        <input
                            type="text"
                            name="assignedTo"
                            className="input"
                            value={formData.assignedTo}
                            onChange={handleChange}
                            placeholder="F.I.SH"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
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
