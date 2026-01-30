import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { RiUserSmileLine, RiShieldKeyholeLine, RiSave3Line, RiSmartphoneLine, RiMailLine, RiUserStarLine, RiCameraSwitchLine } from "react-icons/ri";
import api, { BASE_URL } from "../../api/axios";
import { toast } from "react-hot-toast";

const ProfilePage = () => {
    const { user, updateUser } = useAuth();

    // Normalize image path: prepend base URL only if it's not already a data URL or absolute URL
    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('data:') || path.startsWith('http')) return path;

        // Remove /api if BASE_URL already contains it and path starts with it
        const baseUrl = BASE_URL.endsWith('/api') ? BASE_URL.slice(0, -4) : BASE_URL;
        return `${baseUrl}${path}`;
    };

    // States for forms
    const [profile, setProfile] = useState({
        name: user?.name || "Foydalanuvchi",
        phone: user?.phone || "+998 90 123 45 67",
        email: user?.email || "user@inv.uz",
        role: user?.role === 'admin' ? "Administrator" : "Xodim",
        pinfl: user?.pinfl || "",
        department: user?.department || ""
    });

    const [passwords, setPasswords] = useState({
        current: "",
        new: "",
        confirm: ""
    });

    const [isEditing, setIsEditing] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(getImageUrl(user?.image));

    const handleEditToggle = () => {
        const nextState = !isEditing;
        setIsEditing(nextState);
        if (nextState) {
            toast("Endi rasmingizni ham o'zgartirishingiz mumkin", {
                icon: '📸',
                duration: 4000
            });
        }
    };

    const handleProfileChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const saveProfile = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', profile.name);
            formData.append('department', profile.department);
            formData.append('phone', profile.phone);
            if (imageFile) {
                formData.append('image', imageFile);
            }

            const { data } = await api.put(`/users/profile`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Sync with global state
            updateUser(data);

            setIsEditing(false);
            toast.success("Profil ma'lumotlari muvaffaqiyatli yangilandi!");
        } catch (error) {
            console.error(error);
            toast.error("Xatolik yuz berdi");
        }
    };

    const savePassword = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            toast.error("Parollar mos kelmadi!");
            return;
        }
        try {
            await api.put(`/users/profile`, {
                password: passwords.new
            });
            toast.success("Parol muvaffaqiyatli o'zgartirildi!");
            setPasswords({ current: "", new: "", confirm: "" });
        } catch (error) {
            console.error(error);
            toast.error("Parolni o'zgartirishda xatolik");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                Foydalanuvchi Profili
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Profile Card */}
                <div className="md:col-span-2 card border-0 shadow-lg shadow-gray-100/50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                    <div className="relative pt-12 px-6 pb-6">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-6">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-md overflow-hidden relative">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                                    ) : (
                                        <div className="w-full h-full bg-indigo-50 rounded-xl flex items-center justify-center text-4xl text-indigo-500 font-bold">
                                            {profile.name.charAt(0)}
                                        </div>
                                    )}

                                    {isEditing && (
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                                            <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-indigo-600 shadow-sm">
                                                <RiCameraSwitchLine size={20} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {isEditing && (
                                    <label className="absolute inset-0 z-10 cursor-pointer">
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                    </label>
                                )}
                            </div>
                            <div className="text-center sm:text-left flex-1">
                                <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                                <p className="text-gray-500 flex items-center justify-center sm:justify-start gap-2">
                                    <RiUserStarLine className="text-indigo-500" />
                                    {profile.role}
                                </p>
                            </div>
                            <button
                                onClick={handleEditToggle}
                                className={`btn ${isEditing ? 'btn-primary shadow-indigo-200 shadow-lg' : 'btn-outline border-indigo-200 text-indigo-600 hover:bg-indigo-50'}`}
                            >
                                <span className="flex items-center gap-2">
                                    {isEditing ? 'Bekor qilish' : "Tahrirlash"}
                                </span>
                            </button>
                        </div>

                        <form onSubmit={saveProfile} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">F.I.SH</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <RiUserSmileLine size={18} />
                                        </span>
                                        <input
                                            type="text"
                                            name="name"
                                            value={profile.name}
                                            onChange={handleProfileChange}
                                            disabled={!isEditing}
                                            className="input pl-10"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Telefon r.</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <RiSmartphoneLine size={18} />
                                        </span>
                                        <input
                                            type="text"
                                            name="phone"
                                            value={profile.phone}
                                            onChange={handleProfileChange}
                                            disabled={!isEditing}
                                            className="input pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <RiMailLine size={18} />
                                    </span>
                                    <input
                                        type="email"
                                        name="email"
                                        value={profile.email}
                                        disabled={true}
                                        className="input pl-10 bg-gray-50 cursor-not-allowed text-gray-500"
                                    />
                                </div>

                                <div>
                                    <label className="label">JSHSHIR (PINFL)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <RiShieldKeyholeLine size={18} />
                                        </span>
                                        <input
                                            type="text"
                                            name="pinfl"
                                            value={profile.pinfl}
                                            disabled={true}
                                            className="input pl-10 bg-gray-50 cursor-not-allowed text-gray-500 font-mono"
                                            placeholder="Kiritilmagan"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Bo'lim / Lavozimi</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <RiUserStarLine size={18} />
                                        </span>
                                        <input
                                            type="text"
                                            name="department"
                                            value={profile.department}
                                            onChange={handleProfileChange}
                                            disabled={!isEditing}
                                            className="input pl-10"
                                        />
                                    </div>
                                </div>
                            </div>

                            {isEditing && (
                                <div className="flex justify-end pt-2">
                                    <button type="submit" className="btn btn-primary shadow-lg shadow-indigo-200">
                                        <RiSave3Line size={18} />
                                        Saqlash
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>

                {/* Security Card */}
                <div className="card border-0 shadow-lg shadow-gray-100/50">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                            <RiShieldKeyholeLine size={24} />
                        </div>
                        <h3 className="font-bold text-gray-900">Xavfsizlik</h3>
                    </div>

                    <form onSubmit={savePassword} className="space-y-4">
                        <div>
                            <label className="label">Joriy parol</label>
                            <input
                                type="password"
                                name="current"
                                value={passwords.current}
                                onChange={handlePasswordChange}
                                className="input"
                                placeholder="******"
                            />
                        </div>
                        <div>
                            <label className="label">Yangi parol</label>
                            <input
                                type="password"
                                name="new"
                                value={passwords.new}
                                onChange={handlePasswordChange}
                                className="input"
                                placeholder="******"
                            />
                        </div>
                        <div>
                            <label className="label">Parolni tasdiqlang</label>
                            <input
                                type="password"
                                name="confirm"
                                value={passwords.confirm}
                                onChange={handlePasswordChange}
                                className="input"
                                placeholder="******"
                            />
                        </div>
                        <button type="submit" className="btn w-full bg-red-50 text-red-600 hover:bg-red-100 border-none mt-2">
                            Parolni yangilash
                        </button>
                    </form>
                </div>

            </div >
        </div >
    );
};

export default ProfilePage;
