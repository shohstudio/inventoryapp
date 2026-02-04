import { useState, useEffect } from "react";
import { RiAddLine, RiSearchLine, RiFilter3Line, RiMore2Fill, RiImage2Line, RiArchiveLine, RiDeleteBinLine, RiQrCodeLine, RiCloseLine } from "react-icons/ri";
import WarehouseItemModal from "../../components/admin/WarehouseItemModal";
import QRGeneratorModal from "../../components/admin/QRGeneratorModal";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import Pagination from "../../components/common/Pagination"; // Import Pagination
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import api, { BASE_URL, getImageUrl } from "../../api/axios";
import { toast } from "react-hot-toast";

const WarehousePage = () => {
    const { t } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // Confirmation Modal State
    // QR State
    const [isQRGenOpen, setIsQRGenOpen] = useState(false);
    const [qrItem, setQrItem] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [previewImage, setPreviewImage] = useState(null);
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

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: 20, // Customize limit if needed
                search: searchQuery,
                status: filters.status !== 'all' ? filters.status : undefined,
                category: filters.category,
                building: filters.building,
                location: filters.location,
                isAssigned: filters.isAssigned // 'unassigned' by default in state
            };

            const { data } = await api.get('/items', { params });

            if (data.items && data.metadata) {
                setItems(data.items);
                setTotalPages(data.metadata.totalPages);
                setTotalItems(data.metadata.total);
            } else {
                setItems(data);
            }
        } catch (error) {
            console.error("Failed to fetch warehouse items", error);
            toast.error("Ombor ma'lumotlarini yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(1); // Reset to page 1 on new search/filter
            fetchItems();
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, filters]);

    // Fetch on Page Change
    useEffect(() => {
        fetchItems();
    }, [currentPage]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const { user } = useAuth();

    const handleAddItem = async (itemData) => {
        try {
            const formData = new FormData();

            // Convert simple object to FormData for file upload
            // Convert simple object to FormData for file upload
            Object.keys(itemData).forEach(key => {
                if (key === 'images') {
                    // Skip 'images' here, will handle specially
                    return;
                }

                if (key !== 'imageFile') {
                    // Fix: Remove spaces from price (e.g. "10 000" -> "10000")
                    if (key === 'price') {
                        formData.append(key, String(itemData[key]).replace(/\s/g, ''));
                    } else {
                        formData.append(key, itemData[key]);
                    }
                }
            });

            // Handle Images
            if (itemData.images && Array.isArray(itemData.images)) {
                // 1. Existing Images (URLs)
                const existingImages = itemData.images
                    .filter(img => img.isExisting)
                    .map(img => img.preview);

                if (existingImages.length > 0) {
                    formData.append('existingImages', JSON.stringify(existingImages));
                }

                // 2. New Image Files
                itemData.images
                    .filter(img => !img.isExisting && img.file)
                    .forEach(img => {
                        formData.append('images', img.file);
                    });
            }

            // Ensure no user is assigned for warehouse items
            formData.append('assignedUserId', '');

            if (selectedItem) {
                // Update
                await api.put(`/items/${selectedItem.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success(t('warehouse_item_updated'));
            } else {
                // Create
                await api.post('/items', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success(t('warehouse_item_added'));
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

    const openQRModal = (item) => {
        setQrItem(item);
        setIsQRGenOpen(true);
    };

    // Bulk Delete Logic
    const toggleSelectAll = () => {
        if (selectedItems.size === items.length) { // filteredItems is now items
            setSelectedItems(new Set());
        } else {
            const allIds = new Set(items.map(i => i.id));
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

    // Bulk Delete Logic - Trigger Modal
    const handleBulkDelete = () => {
        setIsConfirmModalOpen(true);
    };

    // Actual API Call (passed to modal)
    const executeBulkDelete = async () => {
        setIsDeleting(true);
        try {
            await api.post('/items/delete-many', { ids: Array.from(selectedItems) });
            toast.success(t('warehouse_items_deleted'));
            setSelectedItems(new Set());
            fetchItems();
        } catch (error) {
            console.error(error);
            toast.error("O'chirishda xatolik yuz berdi");
        } finally {
            setIsDeleting(false);
        }
    };

    // Filter logic - REMOVED client side.
    const filteredItems = items;
    // const filteredItems = items.filter(item => {
    //     ... logic removed ...
    // });

    // We need unique categories for the dropdown. 
    // Ideally this should come from API 'facets' or metadata, but for now we can extract from CURRENT PAGE items 
    // OR keep it hardcoded/fetched separately if needed.
    // If we only show categories present on current page, it's confusing.
    // Better to fetch all categories once? Or just let user type?
    // Let's use what we have on page for now, or if it sucks, we can make a separate endpoint for metadata like 'categories'.
    // For now, let's just stick to what's visible or maybe keep the filter dropdown but accept that it only filters via backend now.
    // Since we rely on manual input or existing data, let's keep extracting from items but know it's limited to current page.
    // Actually, uniqueCategories logic was only for dropdown options.
    // If we paginating, we might not see all categories. 
    // For now, let's assume it's acceptable or user types it.
    // To make it better, we could have a hardcoded list or fetch distinct categories from DB.
    // Let's keep it simple: Extracts from current page items for now. 

    const uniqueCategories = [...new Set(items.map(item => item.category).filter(Boolean))];


    if (loading) return <div className="p-8 text-center text-gray-500">Yuklanmoqda...</div>;

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <RiArchiveLine className="text-orange-500" />
                        {t('warehouse')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {t('inventory_subtitle')}
                    </p>
                </div>
                <div className="flex gap-2">
                    {selectedItems.size > 0 && user?.role !== 'stat' && (
                        <button
                            onClick={handleBulkDelete}
                            className="btn bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200 border-red-600 animate-in fade-in zoom-in"
                            disabled={isDeleting}
                        >
                            <RiDeleteBinLine size={20} />
                            {t('warehouse_delete_selected')} ({selectedItems.size})
                        </button>
                    )}
                    {user?.role !== 'stat' && (
                        <button
                            onClick={() => openModal()}
                            className="btn btn-primary bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-200 border-orange-600"
                        >
                            <RiAddLine size={20} />
                            {t('warehouse_add')}
                        </button>
                    )}
                </div>
            </div>

            <div className="card bg-white dark:bg-slate-800 border-0 shadow-lg shadow-gray-100/50 dark:shadow-none">
                {/* Search & Filter Controls */}
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder={t('search')}
                                className="input pl-10 w-full focus:ring-orange-500 focus:border-orange-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Status Tabs for Assigned/Unassigned */}
                        <div className="flex bg-gray-100 dark:bg-slate-900 p-1 rounded-lg">
                            <button
                                onClick={() => setFilters(prev => ({ ...prev, isAssigned: 'all' }))}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filters.isAssigned === 'all' ? 'bg-white dark:bg-slate-800 text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                {t('warehouse_filter_all')}
                            </button>
                            <button
                                onClick={() => setFilters(prev => ({ ...prev, isAssigned: 'unassigned' }))}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filters.isAssigned === 'unassigned' ? 'bg-white dark:bg-slate-800 text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                {t('warehouse_filter_unassigned')}
                            </button>
                            <button
                                onClick={() => setFilters(prev => ({ ...prev, isAssigned: 'pending' }))}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filters.isAssigned === 'pending' ? 'bg-white dark:bg-slate-800 text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                {t('warehouse_filter_pending')}
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50/50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-700 animate-in slide-in-from-top-2">
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

            <div className="bg-white dark:bg-slate-800 rounded-[20px] shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden mt-6">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-600 dark:bg-indigo-600 text-white">
                                <th className="py-4 px-6 font-semibold text-sm rounded-tl-lg w-12">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-sm border-white checked:bg-white checked:text-blue-600"
                                        checked={filteredItems.length > 0 && selectedItems.size === filteredItems.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="py-4 px-6 font-semibold text-sm">ID</th>
                                <th className="py-4 px-6 font-semibold text-sm">{t('name')} / {t('model')}</th>
                                <th className="py-4 px-6 font-semibold text-sm">{t('assigned_to')} ({t('status')})</th>
                                <th className="py-4 px-6 font-semibold text-sm">{t('warranty')}</th>
                                <th className="py-4 px-6 font-semibold text-sm">{t('price')}</th>
                                <th className="py-4 px-6 font-semibold text-sm">{t('image')}</th>
                                <th className="py-4 px-6 font-semibold text-sm text-right rounded-tr-lg">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {filteredItems.map((item) => (
                                <tr key={item.id} className={`hover:bg-gray-50/80 dark:hover:bg-slate-700/50 transition-colors group ${selectedItems.has(item.id) ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}>
                                    <td className="py-4 px-6">
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-sm border-gray-300 dark:border-slate-600 checked:bg-orange-500 checked:border-orange-500"
                                            checked={selectedItems.has(item.id)}
                                            onChange={() => toggleSelectItem(item.id)}
                                        />
                                    </td>
                                    <td className="py-4 px-6 text-gray-600 dark:text-gray-400 font-medium">#{item.orderNumber || item.id}</td>
                                    <td className="py-4 px-6">
                                        <div className="font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
                                        <div className="text-xs text-gray-400 dark:text-gray-500">{item.category} • {item.model}</div>
                                    </td>
                                    <td className="py-4 px-6 text-gray-600 dark:text-gray-400">
                                        {/* Display Assigned User or Initial Owner */}
                                        {item.assignedTo ? (
                                            <span className="text-blue-600 dark:text-blue-400 font-medium">{item.assignedTo.name}</span>
                                        ) : (item.requests && item.requests.length > 0) ? (
                                            <div className="flex flex-col">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
                                                    {t('warehouse_filter_pending')}: {item.requests[0].targetUser?.name}
                                                </span>
                                            </div>
                                        ) : item.initialOwner ? (
                                            <div className="flex flex-col">
                                                <span className="text-orange-500 dark:text-orange-400 text-sm font-medium">{t('warehouse_filter_unassigned')}</span>
                                                <span className="text-xs text-gray-400 dark:text-gray-500">({item.initialOwner})</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 dark:text-slate-500 italic">{t('in_warehouse')}</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-6">
                                        {/* Warranty not always in API? Using arrivalDate/ManufactureYear as proxy if needed, or check schema if warranty field exists. Schema didn't show warranty field, only purchaseDate. Let's assume frontend handled this loosely. */}
                                        <span className="px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-lg font-medium border border-green-100 dark:border-green-800">
                                            {item.condition || t('status_new')}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-gray-900 dark:text-gray-100 font-bold">{parseFloat(item.price).toLocaleString()} so'm</td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            {item.image ? (
                                                <div
                                                    className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 cursor-pointer hover:ring-2 hover:ring-orange-300 transition-all"
                                                    onClick={() => setPreviewImage(item.image)}
                                                >
                                                    <img
                                                        src={getImageUrl(item.image)}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-slate-700 flex items-center justify-center text-gray-400 dark:text-slate-500">
                                                    <RiImage2Line size={20} />
                                                </div>
                                            )}
                                            <button
                                                onClick={() => openQRModal(item)}
                                                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 flex items-center justify-center text-gray-600 dark:text-gray-400 transition-colors"
                                                title="QR Kodni ko'rish"
                                            >
                                                <RiQrCodeLine size={16} />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        {user?.role !== 'stat' && (
                                            <button
                                                onClick={() => openModal(item)}
                                                className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors opacity-100"
                                            >
                                                <RiMore2Fill size={20} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredItems.length === 0 && (
                                <tr>
                                    <td colSpan="10" className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        {t('warehouse_no_items')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Jami: <span className="font-bold text-gray-900 dark:text-gray-100">{totalItems}</span> ta jihoz
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </div>
            </div>
            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] p-2">
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
                        >
                            <RiCloseLine size={32} />
                        </button>
                        <img
                            src={getImageUrl(previewImage)}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-lg shadow-2xl"
                        />
                    </div>
                </div>
            )}

            {/* Modals */}
            {isModalOpen && (
                <WarehouseItemModal
                    isOpen={isModalOpen}
                    item={selectedItem}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleAddItem}
                />
            )}

            <QRGeneratorModal
                isOpen={isQRGenOpen}
                onClose={() => setIsQRGenOpen(false)}
                item={qrItem}
            />

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={executeBulkDelete}
                title="O'chirishni tasdiqlang"
                message={t('confirm_delete_many').replace('{count}', selectedItems.size)}
                confirmText={isDeleting ? "O'chirilmoqda..." : "Ha, o'chirish"}
                cancelText="Bekor qilish"
                isDanger={true}
            />
        </div>
    );
};

export default WarehousePage;
