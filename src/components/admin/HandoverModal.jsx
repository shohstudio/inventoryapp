import { useState, useEffect } from "react";
import { RiCloseLine, RiSave3Line, RiImageAddLine } from "react-icons/ri";
import { toast } from "react-hot-toast";
import { BASE_URL } from "../../api/axios";

const HandoverModal = ({ isOpen, onClose, onSave, item, readOnly = false }) => {
    const [formData, setFormData] = useState({
        handoverName: "",
        handoverPosition: "",
        handoverBuilding: "1-bino Asosiy", // Default
        handoverQuantity: "1",
        handoverDate: new Date().toISOString().split('T')[0],
        handoverImage: null, // File object or URL string
        handoverImagePreview: null
    });
    const [errors, setErrors] = useState({});

    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [userSearchResults, setUserSearchResults] = useState([]);
    const [showUserResults, setShowUserResults] = useState(false);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);

    useEffect(() => {
        if (item) {
            setFormData({
                handoverName: item.initialOwner || "",
                handoverPosition: item.initialRole || "",
                handoverBuilding: item.building || "1-bino Asosiy", // Use item's current building as default
                handoverQuantity: "1", // Default to 1
                handoverDate: item.assignedDate ? item.assignedDate.split('T')[0] : new Date().toISOString().split('T')[0],
                handoverImage: item.handoverImage || null,
                handoverImagePreview: item.handoverImage ? (item.handoverImage.startsWith('http') ? item.handoverImage : BASE_URL.replace('/api', '') + item.handoverImage) : null,
                assignedEmployeeId: item.initialEmployeeId || ""
            });
        } else {
            setFormData({
                handoverName: "",
                handoverPosition: "",
                handoverBuilding: "1-bino Asosiy",
                handoverQuantity: "1",
                handoverDate: new Date().toISOString().split('T')[0],
                handoverImage: null,
                handoverImagePreview: null,
                assignedEmployeeId: ""
            });
        }
        setUserSearchQuery("");
        setUserSearchResults([]);
        setShowUserResults(false);
        setErrors({});
    }, [item, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleUserSearch = async (val) => {
        setUserSearchQuery(val);
        if (val.length > 1) {
            setIsSearchingUsers(true);
            setShowUserResults(true);
            try {
                const { data } = await api.get(`/users?search=${val}`);
                const users = Array.isArray(data) ? data : (data.users || []);
                setUserSearchResults(users);
            } catch (error) {
                console.error("User search failed", error);
            } finally {
                setIsSearchingUsers(false);
            }
        } else {
            setUserSearchResults([]);
            setShowUserResults(false);
        }
    };

    const handleSelectUser = (u) => {
        setFormData(prev => ({
            ...prev,
            handoverName: u.name,
            handoverPosition: u.position || u.role,
            assignedEmployeeId: u.employeeId
        }));
        setUserSearchQuery("");
        setShowUserResults(false);
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

    const buildings = [
        "1-bino Asosiy",
        "2-bino IB va KT",
        "3-bino Avtomobilsozlik",
        "4-bino Mash tex",
        "5-bino Qurilish"
    ];

    const validateForm = () => {
        const newErrors = {};
        if (!formData.handoverName.trim()) newErrors.handoverName = "Ism/Familya kiritilishi shart";
        if (!formData.handoverPosition.trim()) newErrors.handoverPosition = "Lavozim kiritilishi shart";
        if (!formData.handoverBuilding.trim()) newErrors.handoverBuilding = "Bino tanlanishi shart";

        const qty = parseInt(formData.handoverQuantity);
        if (!formData.handoverQuantity || isNaN(qty) || qty < 1) {
            newErrors.handoverQuantity = "Soni noto'g'ri";
        } else if (item && qty > item.quantity) {
            newErrors.handoverQuantity = `Mavjud sonidan ko'p (Maks: ${item.quantity})`;
        }

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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-800">
                        {readOnly ? "Topshirish Ma'lumotlari" : "Topshirish"}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <RiCloseLine size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    {!readOnly && (
                        <div className="relative">
                            <label className="label">Xodimni qidirish (ID yoki Ism)</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="Ism yoki ID kiriting..."
                                value={userSearchQuery}
                                onChange={(e) => handleUserSearch(e.target.value)}
                                onFocus={() => userSearchQuery.length > 1 && setShowUserResults(true)}
                            />
                            {showUserResults && userSearchResults.length > 0 && (
                                <div className="absolute z-10 w-full bg-white shadow-xl max-h-60 overflow-y-auto rounded-b-lg border border-gray-200 mt-1">
                                    {userSearchResults.map(u => (
                                        <div
                                            key={u.id}
                                            className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-0"
                                            onClick={() => handleSelectUser(u)}
                                        >
                                            <div className="font-bold text-gray-800">{u.name}</div>
                                            <div className="text-xs text-gray-500 flex gap-2">
                                                <span>ID: {u.employeeId}</span>
                                                <span>•</span>
                                                <span>{u.department}</span>
                                                <span>•</span>
                                                <span>{u.position}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="label">Ism Familya <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="handoverName"
                            className={`input ${errors.handoverName ? 'border-red-500 ring-red-500' : ''} ${readOnly || (!readOnly && formData.assignedEmployeeId) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            value={formData.handoverName}
                            onChange={handleChange}
                            placeholder="F.I.SH"
                            disabled={readOnly || (!readOnly && formData.assignedEmployeeId)}
                        />
                        {errors.handoverName && <p className="text-red-500 text-xs mt-1">{errors.handoverName}</p>}
                    </div>

                    <div>
                        <label className="label">Lavozimi <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="handoverPosition"
                            className={`input ${errors.handoverPosition ? 'border-red-500 ring-red-500' : ''} ${readOnly || (!readOnly && formData.assignedEmployeeId) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            value={formData.handoverPosition}
                            onChange={handleChange}
                            placeholder="Masalan: Bog'bon"
                            disabled={readOnly || (!readOnly && formData.assignedEmployeeId)}
                        />
                        {errors.handoverPosition && <p className="text-red-500 text-xs mt-1">{errors.handoverPosition}</p>}
                    </div>

                    <div>
                        <label className="label">Bino <span className="text-red-500">*</span></label>
                        <select
                            name="handoverBuilding"
                            className={`input ${errors.handoverBuilding ? 'border-red-500 ring-red-500' : ''} ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            value={formData.handoverBuilding}
                            onChange={handleChange}
                            disabled={readOnly}
                        >
                            {buildings.map(b => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                        {errors.handoverBuilding && <p className="text-red-500 text-xs mt-1">{errors.handoverBuilding}</p>}
                    </div>

                    <div>
                        <label className="label">Topshirilayotgan soni (Mavjud: {item?.quantity || 0}) <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            name="handoverQuantity"
                            className={`input ${errors.handoverQuantity ? 'border-red-500 ring-red-500' : ''} ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            value={formData.handoverQuantity}
                            onChange={handleChange}
                            min="1"
                            max={item?.quantity || 1}
                            disabled={readOnly}
                        />
                        {errors.handoverQuantity && <p className="text-red-500 text-xs mt-1">{errors.handoverQuantity}</p>}
                    </div>

                    <div>
                        <label className="label">Topshirish sanasi <span className="text-red-500">*</span></label>
                        <input
                            type="date"
                            name="handoverDate"
                            className={`input ${errors.handoverDate ? 'border-red-500 ring-red-500' : ''} ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            value={formData.handoverDate}
                            onChange={handleChange}
                            disabled={readOnly}
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
                                    <div className={`absolute inset-0 bg-black/40 ${readOnly ? 'opacity-0' : 'opacity-0 hover:opacity-100 cursor-pointer'} transition-opacity flex items-center justify-center rounded-lg text-white font-medium`} onClick={() => !readOnly && document.getElementById('handoverInfoImage').click()}>
                                        {readOnly ? "" : "O'zgartirish"}
                                    </div>
                                </div>
                            ) : (
                                <label htmlFor="handoverInfoImage" className={`flex flex-col items-center gap-2 text-gray-400 w-full h-full justify-center ${readOnly ? 'cursor-not-allowed' : 'cursor-pointer hover:text-blue-500'}`}>
                                    <RiImageAddLine size={32} />
                                    <span className="text-sm">{readOnly ? "Rasm yo'q" : "Rasm yuklash"}</span>
                                </label>
                            )}

                            <input
                                type="file"
                                id="handoverInfoImage"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                                disabled={readOnly}
                            />
                        </div>
                        {errors.handoverImage && <p className="text-red-500 text-xs mt-1 text-center">{errors.handoverImage}</p>}
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6 flex-shrink-0">
                        <button type="button" onClick={onClose} className="btn btn-outline">{readOnly ? "Yopish" : "Bekor qilish"}</button>
                        {!readOnly && (
                            <button type="submit" className="btn btn-primary bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
                                <RiSave3Line size={18} /> Saqlash
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default HandoverModal;
