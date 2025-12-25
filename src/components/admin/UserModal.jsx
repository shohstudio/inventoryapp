import { useState, useEffect } from "react";
import { RiCloseLine, RiSave3Line } from "react-icons/ri";
import { hashPassword } from "../../utils/crypto";

const UserModal = ({ isOpen, onClose, onSave, user }) => {
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        email: "",
        role: "employee",
        department: "",
        status: "active",
        password: ""
    });

    useEffect(() => {
        if (user) {
            setFormData({ ...user, password: "" });
        } else {
            setFormData({
                name: "",
                username: "", // New field
                email: "",
                role: "employee",
                department: "",
                status: "active",
                password: ""
            });
        }
    }, [user, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let dataToSave = { ...formData };
        if (formData.password) {
            const hashedPassword = await hashPassword(formData.password);
            dataToSave.password = hashedPassword;
        } else {
            // Remove empty password field if editing and not changing password
            if (user) delete dataToSave.password;
        }

        onSave(dataToSave);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
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
                        <input
                            type="text"
                            name="username"
                            className="input"
                            required
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="vali123"
                        />
                    </div>

                    <div>
                        <label className="label">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="input"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="vali@example.com"
                        />
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

export default UserModal;
