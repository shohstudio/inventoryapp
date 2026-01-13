import { useState, useEffect } from "react";
import { RiCloseLine, RiSave3Line, RiErrorWarningLine } from "react-icons/ri";
import api from "../../api/axios";

const UserModal = ({ isOpen, onClose, onSave, user }) => {
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        email: "",
        role: "employee",
        department: "",
        status: "active",
        pinfl: "",
        password: ""
    });
    const [errors, setErrors] = useState({});
    const [checking, setChecking] = useState({});

    useEffect(() => {
        if (user) {
            setFormData({ ...user, password: "" });
        } else {
            setFormData({
                name: "",
                username: "",
                email: "",
                role: "employee",
                department: "",
                status: "active",
                pinfl: "",
                password: ""
            });
        }
        setErrors({});
    }, [user, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user starts typing again
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateField = async (field, value) => {
        if (!value) return;
        // Skip check if value hasn't changed from original user (editing mode)
        if (user && user[field] === value) return;

        setChecking(prev => ({ ...prev, [field]: true }));
        try {
            const { data } = await api.post('/users/check-availability', {
                [field]: value,
                excludeId: user?.id
            });

            if (!data.available) {
                setErrors(prev => ({ ...prev, [field]: data.message }));
            }
        } catch (error) {
            console.error("Validation failed", error);
        } finally {
            setChecking(prev => ({ ...prev, [field]: false }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Block if there are actual errors
        const hasErrors = Object.values(errors).some(e => e);
        if (hasErrors) {
            alert("Iltimos, xatoliklarni to'g'rilang");
            return;
        }

        // Block if still checking (network slow)
        const isChecking = Object.values(checking).some(c => c);
        if (isChecking) {
            // Optional: wait or warn
            return;
        }

        let dataToSave = { ...formData };
        if (formData.password) {
            dataToSave.password = formData.password;
        } else {
            if (user) delete dataToSave.password;
        }

        onSave(dataToSave);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-800">
                        {user ? "Foydalanuvchini tahrirlash" : "Yangi xodim qo'shish"}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <RiCloseLine size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="label">F.I.SH</label>
                        <input
                            type="text"
                            name="name"
                            className="input"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Vali Aliyev"
                        />
                    </div>

                    <div>
                        <label className="label">Login</label>
                        <div className="relative">
                            <input
                                type="text"
                                name="username"
                                className={`input ${errors.username ? 'border-red-500 focus:ring-red-200' : ''}`}
                                required
                                value={formData.username}
                                onChange={handleChange}
                                onBlur={(e) => validateField('username', e.target.value)}
                                placeholder="vali123"
                            />
                            {checking.username && <span className="absolute right-3 top-3 text-xs text-gray-400">Tekshirilmoqda...</span>}
                        </div>
                        {errors.username && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><RiErrorWarningLine /> {errors.username}</p>}
                    </div>

                    <div>
                        <label className="label">Email</label>
                        <input
                            type="email"
                            name="email"
                            className={`input ${errors.email ? 'border-red-500 focus:ring-red-200' : ''}`}
                            required
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={(e) => validateField('email', e.target.value)}
                            placeholder="vali@example.com"
                        />
                        {errors.email && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><RiErrorWarningLine /> {errors.email}</p>}
                    </div>

                    <div>
                        <label className="label">Parol {user && <span className="text-xs text-gray-400 font-normal">(o'zgartirish uchun kiriting)</span>}</label>
                        <input
                            type="password"
                            name="password"
                            className="input"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder={user ? "O'zgartilmasin" : "Yangi parol"}
                            minLength={user ? 0 : 6}
                            required={!user}
                        />
                    </div>

                    <div>
                        <label className="label">Bo'lim</label>
                        <input
                            type="text"
                            name="department"
                            className="input"
                            value={formData.department}
                            onChange={handleChange}
                            placeholder="IT Department"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Rol</label>
                            <select
                                name="role"
                                className="input"
                                value={formData.role}
                                onChange={handleChange}
                            >
                                <option value="employee">Xodim</option>
                                <option value="admin">Admin</option>
                                <option value="accounter">Hisobchi</option>
                                <option value="warehouseman">Omborchi</option>
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
                                <option value="active">Faol</option>
                                <option value="inactive">Nofaol</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="label">JSHSHIR (PINFL)</label>
                        <input
                            type="text"
                            name="pinfl"
                            className={`input ${errors.pinfl ? 'border-red-500 focus:ring-red-200' : ''}`}
                            value={formData.pinfl}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 14);
                                setFormData(prev => ({ ...prev, pinfl: val }));
                                if (errors.pinfl) setErrors(prev => ({ ...prev, pinfl: null }));
                            }}
                            onBlur={(e) => validateField('pinfl', e.target.value)}
                            placeholder="14 xonali raqam"
                            minLength={14}
                            maxLength={14}
                            required
                        />
                        {errors.pinfl && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><RiErrorWarningLine /> {errors.pinfl}</p>}
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
                            className="btn btn-primary shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={Object.values(errors).some(e => e)} // Only disable on known errors, not while checking
                        >
                            {Object.values(checking).some(c => c) ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Tekshirilmoqda...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <RiSave3Line size={18} />
                                    Saqlash
                                </span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;
