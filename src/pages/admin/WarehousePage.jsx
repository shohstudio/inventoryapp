import { useState, useEffect } from "react";
import { RiAddLine, RiSearchLine, RiFilter3Line, RiMore2Fill, RiImage2Line, RiArchiveLine, RiDeleteBinLine } from "react-icons/ri";
import WarehouseItemModal from "../../components/admin/WarehouseItemModal";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import api from "../../api/axios";
import { toast } from "react-hot-toast";

const WarehousePage = () => {
    const { t } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
        category: '',
        building: '',
        location: '',
        isAssigned: 'unassigned' // default: unassigned (only stock)
    });

    // Bulk Delete State
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [isDeleting, setIsDeleting] = useState(false);

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/items');
            // Filter only unassigned items (those in warehouse)
            // Fetch all items to allow flexible client-side filtering
            setItems(data);
        } catch (error) {
            console.error("Failed to fetch warehouse items", error);
            toast.error("Ombor ma'lumotlarini yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const { user } = useAuth();

    const handleAddItem = async (itemData) => {
        try {
            const formData = new FormData();

            // Convert simple object to FormData for file upload
            Object.keys(itemData).forEach(key => {
                if (key === 'imageFile' && itemData[key]) {
                    formData.append('image', itemData[key]);
                } else if (key !== 'images' && key !== 'imageFile') {
                    // If ID is present (update), don't append it to body, it's in URL usually. 
                    // But create needs fields.
                    formData.append(key, itemData[key]);
                }
            });

            // Ensure no user is assigned for warehouse items
            formData.append('assignedUserId', '');

            if (selectedItem) {
                // Update
                await api.put(`/items/${selectedItem.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success("Jihoz yangilandi");
            } else {
                // Create
                await api.post('/items', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success("Jihoz omborga qo'shildi");
            }
            fetchItems();
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving item:", error);
            const msg = error.response?.data?.message || error.message;
            toast.error("Xatolik: " + msg);
        }
    };

    const openModal = (item = null) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    // Bulk Delete Logic
    const toggleSelectAll = () => {
        if (selectedItems.size === filteredItems.length) {
            setSelectedItems(new Set());
        } else {
            const allIds = new Set(filteredItems.map(i => i.id));
            setSelectedItems(allIds);
        }
    };

    const toggleSelectItem = (id) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedItems(newSet);
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Tanlangan ${selectedItems.size} ta jihozni o'chirib yuborishni tasdiqlaysizmi?`)) return;

        setIsDeleting(true);
        try {
            await api.post('/items/delete-many', { ids: Array.from(selectedItems) });
            toast.success("Jihozlar muvaffaqiyatli o'chirildi");
            setSelectedItems(new Set());
            fetchItems();
        } catch (error) {
            console.error(error);
            toast.error("O'chirishda xatolik yuz berdi");
        } finally {
            setIsDeleting(false);
        }
    };

    // Filter logic
    const filteredItems = items.filter(item => {
        // Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                item.name.toLowerCase().includes(query) ||
                (item.model && item.model.toLowerCase().includes(query)) ||
                (item.serialNumber && item.serialNumber.toLowerCase().includes(query)) || // Backend uses serialNumber
                (item.inn && item.inn.includes(query)) ||
                (item.orderNumber && String(item.orderNumber).includes(query));

            if (!matchesSearch) return false;
        }

        if (filters.status !== "all" && item.status !== filters.status) return false;
        if (filters.category && item.category !== filters.category) return false;
        if (filters.building && item.building !== filters.building) return false;
        if (filters.location && item.location && !item.location.toLowerCase().includes(filters.location.toLowerCase())) return false;

        // Unassigned Filter logic
        if (filters.isAssigned === 'unassigned') {
            // Only show items that have NO assigned user AND NO active requests
            const hasActiveRequest = item.requests && item.requests.length > 0;
            if (item.assignedTo || item.assignedUserId || hasActiveRequest) return false;
        }

        // Pending Filter Logic
        if (filters.isAssigned === 'pending') {
            const hasActiveRequest = item.requests && item.requests.length > 0;
            if (!hasActiveRequest) return false; // Must have active request
        }

        return true;
    });

    const uniqueCategories = [...new Set(items.map(item => item.category).filter(Boolean))];

    if (loading) return <div className="p-8 text-center text-gray-500">Yuklanmoqda...</div>;

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <RiArchiveLine className="text-orange-500" />
                        {t('warehouse')}
                    </h1>
                    <p className="text-gray-500">
                        {t('inventory_subtitle')}
                    </p>
                </div>
                <div className="flex gap-2">
                    {selectedItems.size > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="btn bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200 border-red-600 animate-in fade-in zoom-in"
                            disabled={isDeleting}
                        >
                            <RiDeleteBinLine size={20} />
                            Tanlanganlarni o'chirish ({selectedItems.size})
                        </button>
                    )}
                    <button
                        onClick={() => openModal()}
                        className="btn btn-primary bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-200 border-orange-600"
                    >
                        <RiAddLine size={20} />
                        {t('warehouse_add')}
                    </button>
                </div>
            </div>

            <div className="card border-0 shadow-lg shadow-gray-100/50">
                {/* Search & Filter Controls */}
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder={t('search')}
                                className="input pl-10 w-full focus:ring-orange-500 focus:border-orange-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Status Tabs for Assigned/Unassigned */}
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setFilters(prev => ({ ...prev, isAssigned: 'all' }))}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filters.isAssigned === 'all' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Barchasi
                            </button>
                            <button
                                onClick={() => setFilters(prev => ({ ...prev, isAssigned: 'unassigned' }))}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filters.isAssigned === 'unassigned' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Birikmaganlar
                            </button>
                            <button
                                onClick={() => setFilters(prev => ({ ...prev, isAssigned: 'pending' }))}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filters.isAssigned === 'pending' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Kutilayotganlar
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`btn gap-2 transition-colors ${showFilters ? 'bg-orange-50 text-orange-600 border-orange-200' : 'btn-outline text-gray-600'}`}
                    >
                        <RiFilter3Line />
                        {t('filter')}
                    </button>
                </div>

                {/* Collapsible Filter Panel */}
                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50/50 rounded-xl border border-gray-100 animate-in slide-in-from-top-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">{t('category')}</label>
                            <select
                                className="input w-full"
                                value={filters.category}
                                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                            >
                                <option value="">{t('all')}</option>
                                {uniqueCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">{t('status')}</label>
                            <select
                                className="input w-full"
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            >
                                <option value="all">{t('all')}</option>
                                <option value="working">{t('status_working')}</option>
                                <option value="repair">{t('status_repair')}</option>
                                <option value="written-off">{t('status_written_off')}</option>
                                <option value="broken">{t('status_broken')}</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden mt-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-600 text-white">
                                <th className="py-4 px-6 font-semibold text-sm rounded-tl-lg w-12">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-sm border-white checked:bg-white checked:text-blue-600"
                                        checked={filteredItems.length > 0 && selectedItems.size === filteredItems.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="py-4 px-6 font-semibold text-sm">ID</th>
                                <th className="py-4 px-6 font-semibold text-sm">Nomi / Model</th>
                                <th className="py-4 px-6 font-semibold text-sm">Mas'ul (Holat)</th>
                                <th className="py-4 px-6 font-semibold text-sm">Kafolat</th>
                                <th className="py-4 px-6 font-semibold text-sm">Narxi</th>
                                <th className="py-4 px-6 font-semibold text-sm">Rasm</th>
                                <th className="py-4 px-6 font-semibold text-sm text-right rounded-tr-lg">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredItems.map((item) => (
                                <tr key={item.id} className={`hover:bg-gray-50/80 transition-colors group ${selectedItems.has(item.id) ? 'bg-orange-50' : ''}`}>
                                    <td className="py-4 px-6">
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-sm border-gray-300 checked:bg-orange-500 checked:border-orange-500"
                                            checked={selectedItems.has(item.id)}
                                            onChange={() => toggleSelectItem(item.id)}
                                        />
                                    </td>
                                    <td className="py-4 px-6 text-gray-600 font-medium">#{item.orderNumber || item.id}</td>
                                    <td className="py-4 px-6">
                                        <div className="font-medium text-gray-900">{item.name}</div>
                                        <div className="text-xs text-gray-400">{item.category} • {item.model}</div>
                                    </td>
                                    <td className="py-4 px-6 text-gray-600">
                                        {/* Display Assigned User or Initial Owner */}
                                        {item.assignedTo ? (
                                            <span className="text-blue-600 font-medium">{item.assignedTo.name}</span>
                                        ) : (item.requests && item.requests.length > 0) ? (
                                            <div className="flex flex-col">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    Jaroyonda: {item.requests[0].targetUser?.name}
                                                </span>
                                            </div>
                                        ) : item.initialOwner ? (
                                            <div className="flex flex-col">
                                                <span className="text-orange-500 text-sm font-medium">Biriktirilmagan</span>
                                                <span className="text-xs text-gray-400">({item.initialOwner})</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic">Omborda</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-6">
                                        {/* Warranty not always in API? Using arrivalDate/ManufactureYear as proxy if needed, or check schema if warranty field exists. Schema didn't show warranty field, only purchaseDate. Let's assume frontend handled this loosely. */}
                                        <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-lg font-medium border border-green-100">
                                            {item.condition || 'Yangi'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-gray-900 font-bold">{parseFloat(item.price).toLocaleString()} so'm</td>
                                    <td className="py-4 px-6">
                                        {item.image ? (
                                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                                <RiImage2Line size={20} />
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <button
                                            onClick={() => openModal(item)}
                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-100"
                                        >
                                            <RiMore2Fill size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredItems.length === 0 && (
                                <tr>
                                    <td colSpan="10" className="text-center py-8 text-gray-500">
                                        Omborda jihozlar yo'q
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Modals */}
            {isModalOpen && (
                <WarehouseItemModal
                    isOpen={isModalOpen}
                    item={selectedItem}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleAddItem}
                />
            )}
        </div>
    );
};

export default WarehousePage;
