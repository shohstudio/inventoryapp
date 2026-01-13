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
            {/* ... */}
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
            </div >
        </div >
    );
};

export default UserModal;
