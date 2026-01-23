import { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { read, utils, writeFile } from 'xlsx';
import { RiAddLine, RiSearchLine, RiFilter3Line, RiEditLine, RiMore2Fill, RiImage2Line, RiStackLine, RiFileExcel2Line, RiDeleteBinLine, RiQrCodeLine, RiCloseLine, RiArrowLeftLine, RiArrowRightLine } from "react-icons/ri";
import ItemModal from "../../components/admin/ItemModal";
import WarehouseSelectionModal from "../../components/admin/WarehouseSelectionModal";
import QRScannerModal from "../../components/admin/QRScannerModal";
import QRGeneratorModal from "../../components/admin/QRGeneratorModal";
import Pagination from "../../components/common/Pagination"; // Import Pagination
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios"; // Import API
import { toast } from "react-hot-toast";

const InventoryPage = () => {
    const location = useLocation();
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
        inventoryStatus: 'all' // all, passed, not_passed
    });

    // Inventory Dates
    const [inventoryStartDate, setInventoryStartDate] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/settings');
                if (data.inventoryStartDate) {
                    setInventoryStartDate(data.inventoryStartDate);
                }
            } catch (err) {
                console.error("Failed to fetch settings", err);
            }
        };
        fetchSettings();
    }, []);

    // Check for navigation state (filter)
    useEffect(() => {
        if (location.state?.filter) {
            setFilters(prev => ({ ...prev, status: location.state.filter }));
        }
    }, [location.state]);

    const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
    const [selectedWarehouseItem, setSelectedWarehouseItem] = useState(null);
    const [isQRGenOpen, setIsQRGenOpen] = useState(false);
    const [qrItem, setQrItem] = useState(null);
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [previewInfo, setPreviewInfo] = useState({ open: false, images: [], index: 0 });

    const openModal = (item = null) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const openQRModal = (item) => {
        setQrItem(item);
        setIsQRGenOpen(true);
    };

    const handleAddItem = async (itemData) => {
        try {
            const formData = new FormData();
            Object.keys(itemData).forEach(key => {
                if (key === 'newImages' && Array.isArray(itemData[key])) {
                    itemData[key].forEach(file => {
                        formData.append('images', file);
                    });
                } else if (key === 'existingImages') {
                    formData.append('existingImages', JSON.stringify(itemData[key]));
                } else if (key !== 'images' && key !== 'imageFile' && key !== 'image') {
                    formData.append(key, itemData[key]);
                }
            });

            if (selectedItem) {
                await api.put(`/items/${selectedItem.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success("Jihoz yangilandi");
            } else {
                await api.post('/items', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success("Jihoz qo'shildi");
            }
            fetchItems();
            setIsModalOpen(false);
            setSelectedItem(null);
            setSelectedWarehouseItem(null);
        } catch (error) {
            console.error("Error saving item:", error);
            toast.error("Xatolik: " + (error.response?.data?.message || error.message));
        }
    };

    const handleSelectFromWarehouse = (item) => {
        setSelectedItem(null); // Clear any selected item
        setSelectedWarehouseItem({
            ...item,
            name: item.name,
            model: item.model,
            category: item.category,
            building: item.building,
            location: item.location,
            price: item.price,
            image: item.image,
            warehouseItemId: item.id
        });
        setIsWarehouseModalOpen(false);
        setIsModalOpen(true); // Open ItemModal with pre-filled data
    };

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const fetchItems = async () => {
        setLoading(true);
        try {
            // Build Query Params
            const params = {
                page: currentPage,
                limit: 20, // Customize limit if needed
                search: searchQuery,
                status: filters.status !== 'all' ? filters.status : undefined,
                category: filters.category,
                building: filters.building,
                location: filters.location,
                inventoryStatus: filters.inventoryStatus !== 'all' ? filters.inventoryStatus : undefined,
                inventoryStartDate: filters.inventoryStatus !== 'all' ? inventoryStartDate : undefined // Only pass if filtering
            };

            const { data } = await api.get('/items', { params });

            // Check if response has metadata (new format) or just array (old format fallback safe)
            if (data.items && data.metadata) {
                setItems(data.items);
                setTotalPages(data.metadata.totalPages);
                setTotalItems(data.metadata.total);
            } else {
                setItems(data);
                // Fallback if backend not fully ready or old cache
            }
            setError(null);
            setSelectedIds([]);
        } catch (err) {
            console.error("Failed to fetch items", err);
            setError("Ma'lumotlarni yuklashda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(1); // Reset to page 1 on new search/filter
            fetchItems();
        }, 500); // 500ms delay for typing

        return () => clearTimeout(timer);
    }, [searchQuery, filters, inventoryStartDate]);

    // Fetch on Page Change
    useEffect(() => {
        fetchItems();
    }, [currentPage]);
    // Note: We separated search/filter effect to reset page to 1. 
    // But fetchItems depends on state. 
    // To avoid double fetch, we can combine or just accept 1 extra fetch on filter change.
    // Better: Remove fetchItems from dependency of search effect and call it explicitly there? 
    // Actually, `fetchItems` closes over state, so it needs to be called when state changes.
    // Let's optimize:
    // 1. Search/Filter changes -> Set Page 1.
    // 2. Page changes -> Fetch.
    // But setting Page 1 triggers Page Change effect. So that works!
    // We just need to make sure we don't fetch twice if Page was ALREADY 1.
    // We can leave it simple for now.

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const { user } = useAuth();

    const handleImportExcel = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setLoading(true);
            const { data } = await api.post('/items/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success(data.message);
            fetchItems(); // Refresh
        } catch (err) {
            console.error("Import failed", err);
            toast.error("Import xatoligi: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
            e.target.value = null; // Reset input
        }
    };

    const handleExportExcel = async () => {
        // Export CURRENT page items ? OR ALL items? 
        // Ideally all filtered items. Server side export is better. 
        // But for now, let's just export visible items or fetch all for export.
        // Let's implement a simple client side export of CURRENT page for safety, 
        // or ideally we need a backend endpoint for export.
        // Let's fallback to current items for now to avoid complexity or errors.

        const exportData = items.map((item, index) => {
            const isPassed = inventoryStartDate && item.lastCheckedAt && item.lastCheckedAt >= inventoryStartDate;
            return {
                [t('order_number')]: (currentPage - 1) * 20 + index + 1,
                [t('name')]: item.name,
                [t('model')]: item.model,
                [t('inn')]: item.inn,
                ["JSHShIR"]: item.assignedTo?.pinfl || item.requests?.[0]?.targetUser?.pinfl || item.initialPinfl || "",
                [t('category')]: item.category,
                [t('building')]: item.building,
                [t('location')]: item.location,
                ["Inventar Statusi"]: isPassed ? "O'tgan" : "O'tmagan",
                ["Tekshirilgan Sana"]: item.lastCheckedAt ? new Date(item.lastCheckedAt).toLocaleDateString("ru-RU") : "-",
                [t('status')]: item.status === 'working' ? t('status_working') :
                    item.status === 'repair' ? t('status_repair') :
                        item.status === 'written-off' ? t('status_written_off') :
                            t('status_broken'),
                [t('assigned_to')]: item.assignedTo?.name || item.requests?.[0]?.targetUser?.name || item.initialOwner || "",
                [t('purchase_year')]: item.purchaseDate,
                [t('price')]: item.price
            };
        });

        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Jihozlar");
        writeFile(wb, "jihozlar_ruyxati.xlsx");
    };

    // Filter logic REMOVED - Using Server Side now.
    // We use `items` directly as `filteredItems`.
    const filteredItems = items;
    // Note: We need to keep `filteredItems` variable name if used in render, or rename usage.
    // Let's simply alias it.

    // ... (rest of logic)

    // Extract categories from current items for dropdown (limited to current page, but better than nothing)
    const uniqueCategories = [...new Set(items.map(item => item.category))];
    const uniqueBuildings = [...new Set(items.map(item => item.building))];

    // Bulk Delete Logic
    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            // Select all currently filtered items
            const allIds = filteredItems.map(i => i.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const toggleSelectItem = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        if (!window.confirm(`${selectedIds.length} ta jihozni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi!`)) {
            return;
        }

        try {
            await api.post('/items/delete-many', { ids: selectedIds });
            toast.success(`${selectedIds.length} ta jihoz o'chirildi.`);
            fetchItems(); // Refresh
        } catch (err) {
            console.error("Bulk delete failed", err);
            toast.error("O'chirishda xatolik: " + (err.response?.data?.message || err.message));
        }
    };


    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                        {t('inventory_title')} <span className="text-xs text-gray-400 font-normal">v1.2</span>
                    </h1>
                    <p className="text-gray-500">
                        {filters.status === 'repair' ? t('repair_subtitle') : t('inventory_subtitle')}
                    </p>
                </div>
                <div className="flex gap-2">
                    {['admin', 'accounter', 'warehouseman'].includes(user?.role) && (
                        <>
                            {selectedIds.length > 0 && (
                                <button
                                    onClick={handleBulkDelete}
                                    className="btn bg-red-500 hover:bg-red-600 text-white shadow-sm border-0 animate-in fade-in"
                                >
                                    <RiDeleteBinLine size={20} className="mr-2" />
                                    Tanlanganlarni o'chirish ({selectedIds.length})
                                </button>
                            )}

                            <label className="btn bg-blue-500 hover:bg-blue-600 text-white shadow-sm border-0 cursor-pointer">
                                <RiFileExcel2Line size={20} className="mr-2" />
                                Import (.xlsx)
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    className="hidden"
                                    onChange={handleImportExcel}
                                />
                            </label>
                            <button
                                onClick={handleExportExcel}
                                className="btn bg-green-500 hover:bg-green-600 text-white shadow-sm border-0"
                            >
                                <RiFileExcel2Line size={20} className="mr-2" />
                                {t('export_excel')}
                            </button>
                        </>
                    )}

                    <button
                        onClick={() => setIsWarehouseModalOpen(true)}
                        className="btn bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm"
                    >
                        <RiStackLine size={20} className="mr-2" />
                        {t('attach_warehouse')}
                    </button>
                    {user?.role !== 'stat' && (
                        <button
                            onClick={() => openModal()}
                            className="btn btn-primary shadow-lg shadow-indigo-200"
                        >
                            <RiAddLine size={20} />
                            {t('add_new')}
                        </button>
                    )}
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
                                placeholder={t('search_placeholder')}
                                className="input pl-10 w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`btn gap-2 transition-colors ${showFilters ? 'btn-primary' : 'btn-outline text-gray-600'}`}
                    >
                        <RiFilter3Line />
                        Filter
                    </button>
                </div>

                {/* Collapsible Filter Panel */}
                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50/50 rounded-xl border border-gray-100 animate-in slide-in-from-top-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Kategoriya</label>
                            <select
                                className="input w-full"
                                value={filters.category}
                                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                            >
                                <option value="">Barchasi</option>
                                {uniqueCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Bino</label>
                            <select
                                className="input w-full"
                                value={filters.building}
                                onChange={(e) => setFilters(prev => ({ ...prev, building: e.target.value }))}
                            >
                                <option value="">Barchasi</option>
                                {uniqueBuildings.map(build => (
                                    <option key={build} value={build}>{build}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">{t('location')}</label>
                            <input
                                type="text"
                                className="input w-full"
                                placeholder={t('location') + "..."}
                                value={filters.location}
                                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                            />
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
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Inventarizatsiya</label>
                            <select
                                className="input w-full"
                                value={filters.inventoryStatus}
                                onChange={(e) => setFilters(prev => ({ ...prev, inventoryStatus: e.target.value }))}
                            >
                                <option value="all">Barchasi</option>
                                <option value="passed">O'tgan ✅</option>
                                <option value="not_passed">O'tmagan ❌</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-600 text-white">
                                <th className="py-3 px-3 w-10 text-center">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-sm border-white"
                                        checked={filteredItems.length > 0 && selectedIds.length === filteredItems.length}
                                        onChange={toggleSelectAll}
                                        disabled={filteredItems.length === 0}
                                    />
                                </th>
                                <th className="py-3 px-3 font-semibold text-sm rounded-tl-lg whitespace-nowrap">{t('order_number')}</th>
                                <th className="py-3 px-3 font-semibold text-sm min-w-[200px]">{t('name')}</th>
                                <th className="py-3 px-3 font-semibold text-sm whitespace-nowrap">{t('inn')}</th>
                                <th className="py-3 px-3 font-semibold text-sm whitespace-nowrap">{t('purchase_date')}</th>
                                <th className="py-3 px-3 font-semibold text-sm whitespace-nowrap">{t('current_value')}</th>
                                <th className="py-3 px-3 font-semibold text-sm whitespace-nowrap">{t('building')}</th>
                                <th className="py-3 px-3 font-semibold text-sm whitespace-nowrap">Inventarizatsiya</th>
                                <th className="py-3 px-3 font-semibold text-sm whitespace-nowrap">{t('status')}</th>
                                <th className="py-3 px-3 font-semibold text-sm text-center">{t('image')}</th>
                                <th className="py-3 px-3 font-semibold text-sm text-right rounded-tr-lg">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredItems.map((item, index) => (
                                <tr key={item.id} className={`hover:bg-gray-50/80 transition-colors group ${selectedIds.includes(item.id) ? "bg-blue-50/50" : ""}`}>
                                    <td className="py-3 px-3 text-center">
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-sm"
                                            checked={selectedIds.includes(item.id)}
                                            onChange={() => toggleSelectItem(item.id)}
                                        />
                                    </td>
                                    <td className="py-3 px-3 text-gray-800 font-medium text-center">{(currentPage - 1) * 20 + index + 1}</td>
                                    <td className="py-3 px-3">
                                        <div className="font-medium text-gray-900 line-clamp-2" title={item.name}>{item.name}</div>
                                        <div className="text-xs text-gray-400">{item.category} • {item.model}</div>
                                    </td>
                                    <td className="py-3 px-3 text-gray-600 font-mono text-xs whitespace-nowrap">{item.inn}</td>
                                    <td className="py-3 px-3 text-gray-600 whitespace-nowrap">{item.purchaseDate}</td>
                                    <td className="py-3 px-3 text-gray-900 font-medium whitespace-nowrap">
                                        {(() => {
                                            const priceStr = (item.price || "0").toString().replace(/\s/g, '').replace(',', '.');
                                            const price = parseFloat(priceStr) || 0;
                                            const quantity = parseInt(item.quantity) || 1;
                                            const total = price * quantity;
                                            return total.toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
                                        })()} so'm
                                    </td>
                                    <td className="py-3 px-3">
                                        <div className="text-gray-900 whitespace-nowrap">{item.building}</div>
                                        <div className="text-xs text-gray-400 whitespace-nowrap">{item.location}</div>
                                    </td>
                                    <td className="py-3 px-3">
                                        {(() => {
                                            // Dynamic check
                                            const isPassed = inventoryStartDate && item.lastCheckedAt && item.lastCheckedAt >= inventoryStartDate;
                                            return (
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold border whitespace-nowrap ${isPassed
                                                        ? 'bg-green-50 text-green-600 border-green-200'
                                                        : 'bg-gray-50 text-gray-500 border-gray-200'
                                                        }`}>
                                                        {isPassed ? 'O\'tgan ✅' : 'O\'tmagan ❌'}
                                                    </span>
                                                    {item.lastCheckedAt && (
                                                        <span className="text-[10px] text-gray-400 font-mono whitespace-nowrap">
                                                            {new Date(item.lastCheckedAt).toLocaleDateString("ru-RU")}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td className="py-3 px-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${item.status === 'working' ? 'bg-green-100 text-green-700' :
                                            item.status === 'repair' ? 'bg-orange-100 text-orange-700' :
                                                item.status === 'written-off' ? 'bg-gray-100 text-gray-500 line-through' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {item.status === 'working' ? 'Ishchi' :
                                                item.status === 'repair' ? 'Ta\'mir talab' :
                                                    item.status === 'written-off' ? 'Ro\'y. chiqdigan' :
                                                        'Buzilgan'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-3">
                                        <div className="flex items-center justify-center gap-2">
                                            {item.image ? (
                                                <div
                                                    className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:ring-2 hover:ring-indigo-300 transition-all shrink-0"
                                                    onClick={() => {
                                                        let imgs = [];
                                                        try {
                                                            imgs = item.images ? (typeof item.images === 'string' ? JSON.parse(item.images) : item.images) : [item.image];
                                                        } catch (e) { imgs = [item.image]; }
                                                        if (imgs.length === 0) imgs = [item.image];
                                                        setPreviewInfo({ open: true, images: imgs, index: 0 });
                                                    }}
                                                >
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                                    <RiImage2Line size={16} />
                                                </div>
                                            )}

                                            {/* QR Button next to image */}
                                            <button
                                                onClick={() => openQRModal(item)}
                                                className="w-7 h-7 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600 transition-colors border border-blue-200 shrink-0"
                                                title="QR Kodni ko'rish"
                                            >
                                                <RiQrCodeLine size={16} />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="py-3 px-3 text-right whitespace-nowrap">

                                        {user?.role !== 'stat' && (
                                            <button
                                                onClick={() => openModal(item)}
                                                className="p-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
                                                title={t('edit_item')}
                                            >
                                                <RiEditLine size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredItems.length === 0 && (
                                <tr>
                                    <td colSpan="11" className="text-center py-12 text-gray-500">
                                        Jihozlar topilmadi
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-sm text-gray-500">
                            Jami: <span className="font-bold text-gray-900">{totalItems}</span> ta jihoz
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </div>
            </div>

            {/* Image Gallery Modal */}
            {previewInfo.open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in"
                    onClick={() => setPreviewInfo({ ...previewInfo, open: false })}
                >
                    <div className="relative w-full max-w-5xl h-[90vh] flex flex-col items-center justify-center p-4" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setPreviewInfo({ ...previewInfo, open: false })}
                            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-50 bg-black/20 rounded-full p-2"
                        >
                            <RiCloseLine size={32} />
                        </button>

                        <div className="relative flex items-center justify-center w-full h-full">
                            {/* Prev Button */}
                            {previewInfo.images.length > 1 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewInfo(prev => ({
                                            ...prev,
                                            index: prev.index === 0 ? prev.images.length - 1 : prev.index - 1
                                        }));
                                    }}
                                    className="absolute left-0 p-3 text-white hover:bg-white/10 rounded-full transition-colors z-10"
                                >
                                    <RiArrowLeftLine size={40} />
                                </button>
                            )}

                            <img
                                src={previewInfo.images[previewInfo.index]}
                                alt={`Preview ${previewInfo.index + 1}`}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            />

                            {/* Next Button */}
                            {previewInfo.images.length > 1 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewInfo(prev => ({
                                            ...prev,
                                            index: prev.index === prev.images.length - 1 ? 0 : prev.index + 1
                                        }));
                                    }}
                                    className="absolute right-0 p-3 text-white hover:bg-white/10 rounded-full transition-colors z-10"
                                >
                                    <RiArrowRightLine size={40} />
                                </button>
                            )}
                        </div>

                        {/* Thumbnails / Counter */}
                        <div className="mt-4 flex gap-2 overflow-x-auto max-w-full p-2 bg-black/40 rounded-xl backdrop-blur-md">
                            {previewInfo.images.map((img, i) => (
                                <div
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); setPreviewInfo(prev => ({ ...prev, index: i })); }}
                                    className={`w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${i === previewInfo.index ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                >
                                    <img src={img} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {isModalOpen && (
                <ItemModal
                    isOpen={isModalOpen}
                    item={selectedItem}
                    initialData={selectedWarehouseItem}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedWarehouseItem(null);
                    }}
                    onSave={handleAddItem}
                />
            )}

            <WarehouseSelectionModal
                isOpen={isWarehouseModalOpen}
                onClose={() => setIsWarehouseModalOpen(false)}
                onSelect={handleSelectFromWarehouse}
            />

            <QRGeneratorModal
                isOpen={isQRGenOpen}
                onClose={() => setIsQRGenOpen(false)}
                item={qrItem}
            />

            <QRScannerModal
                isOpen={showQRScanner}
                onClose={() => setShowQRScanner(false)}
                onScanSuccess={(decodedText) => {
                    // Fallback if not verification mode
                    setSearchQuery(decodedText);
                    setShowQRScanner(false);
                }}
                verificationMode={true} // Enable inventory verification mode
            />


        </div>
    );

};

export default InventoryPage;
