import { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { read, utils, writeFile } from 'xlsx';
import { RiAddLine, RiSearchLine, RiFilter3Line, RiMore2Fill, RiImage2Line, RiStackLine, RiFileExcel2Line, RiDeleteBinLine, RiQrCodeLine } from "react-icons/ri";
import ItemModal from "../../components/admin/ItemModal";
import WarehouseSelectionModal from "../../components/admin/WarehouseSelectionModal";
import QRScannerModal from "../../components/admin/QRScannerModal";
import QRGeneratorModal from "../../components/admin/QRGeneratorModal";
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
        location: ''
    });

    // Check for navigation state (filter)
    useEffect(() => {
        if (location.state?.filter) {
            setFilters(prev => ({ ...prev, status: location.state.filter }));
        }
    }, [location.state]);


    const [showQRScanner, setShowQRScanner] = useState(false);

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]); // Track selected items for bulk delete

    const fetchItems = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/items');
            setItems(data);
            setError(null);
            setSelectedIds([]); // Clear selection on refresh
        } catch (err) {
            console.error("Failed to fetch items", err);
            setError("Ma'lumotlarni yuklashda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    // Handle Global QR Scan Navigation
    useEffect(() => {
        if (location.state?.scanCode && items.length > 0) {
            handleScanSuccess(location.state.scanCode);
            // Clear state to prevent reopening on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location.state, items]);

    const handleScanSuccess = (decodedText) => {
        // Search by ID, OrderNumber or Serial
        const foundItem = items.find(item =>
            String(item.id) === decodedText ||
            String(item.orderNumber) === decodedText || // API might return number
            item.inn === decodedText ||
            item.assignedPINFL === decodedText ||
            item.serialNumber?.toLowerCase() === decodedText.toLowerCase() // Backend uses serialNumber
        );

        if (foundItem) {
            openModal(foundItem);
        } else {
            toast.error(`Jihoz topilmadi. QR Kod: ${decodedText}`);
        }
    };

    const { user } = useAuth();

    const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
    const [selectedWarehouseItem, setSelectedWarehouseItem] = useState(null);

    // QR Generator State
    const [isQRGenOpen, setIsQRGenOpen] = useState(false);
    const [qrItem, setQrItem] = useState(null);

    const openQRModal = (item) => {
        setQrItem(item);
        setIsQRGenOpen(true);
    };

    const handleAddItem = async (newItemData) => {
        // Prepare FormData for file upload
        const formData = new FormData();
        Object.keys(newItemData).forEach(key => {
            if (key === 'imageFile' && newItemData[key]) {
                formData.append('image', newItemData[key]);
            } else if (key === 'serial') {
                formData.append('serialNumber', newItemData[key]);
            } else if (key !== 'images' && key !== 'imageFile') {
                formData.append(key, newItemData[key]);
            }
        });

        // Special handling if image is NOT changed but existing? API handles that if we don't send 'image' field

        try {
            if (selectedItem) {
                // Update
                await api.put(`/items/${selectedItem.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success("Jihoz yangilandi!");
            } else {
                // Create
                await api.post('/items', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success("Jihoz qo'shildi!");
            }
            fetchItems(); // Refresh list
            setSelectedWarehouseItem(null);
        } catch (err) {
            console.error("Save failed", err);
            toast.error("Saqlashda xatolik: " + (err.response?.data?.message || err.message));
        }
    };

    const openModal = (item = null) => {
        setSelectedItem(item);
        setSelectedWarehouseItem(null); // Clear warehouse selection if regular open
        setIsModalOpen(true);
    };

    const handleSelectFromWarehouse = (wItem) => {
        setSelectedWarehouseItem(wItem);
        setIsWarehouseModalOpen(false);
        setIsModalOpen(true); // Open the regular ItemModal, it will use selectedWarehouseItem as initialData
    };

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

    const handleExportExcel = () => {
        const exportData = items.map(item => ({
            [t('order_number')]: item.orderNumber || item.id,
            [t('name')]: item.name,
            [t('model')]: item.model,
            [t('inn')]: item.inn,
            ["JSHShIR"]: item.assignedPINFL || "",
            [t('category')]: item.category,
            [t('building')]: item.building,
            [t('location')]: item.location,
            [t('status')]: item.status === 'working' ? t('status_working') :
                item.status === 'repair' ? t('status_repair') :
                    item.status === 'written-off' ? t('status_written_off') :
                        t('status_broken'),
            [t('assigned_to')]: item.assignedTo?.name || "", // Fix for object access if populated
            [t('purchase_year')]: item.purchaseDate,
            [t('price')]: item.price
        }));

        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Jihozlar");
        writeFile(wb, "jihozlar_ruyxati.xlsx");
    };

    // Filter logic
    const filteredItems = items.filter(item => {
        // Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                item.name.toLowerCase().includes(query) ||
                item.model?.toLowerCase().includes(query) ||
                item.serialNumber?.toLowerCase().includes(query) ||
                item.inn?.includes(query) ||
                item.assignedPINFL?.includes(query) ||
                String(item.id).includes(query);

            if (!matchesSearch) return false;
        }

        if (filters.status !== "all" && item.status !== filters.status) return false;
        if (filters.category && item.category !== filters.category) return false;
        if (filters.building && item.building !== filters.building) return false;
        if (filters.location && !item.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
        return true;
    });

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
                    <button
                        onClick={() => openModal()}
                        className="btn btn-primary shadow-lg shadow-indigo-200"
                    >
                        <RiAddLine size={20} />
                        {t('add_new')}
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
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-600 text-white">
                                <th className="py-4 px-6 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-sm border-white"
                                        checked={filteredItems.length > 0 && selectedIds.length === filteredItems.length}
                                        onChange={toggleSelectAll}
                                        disabled={filteredItems.length === 0}
                                    />
                                </th>
                                <th className="py-4 px-6 font-semibold text-sm rounded-tl-lg">{t('order_number')}</th>
                                <th className="py-4 px-6 font-semibold text-sm">{t('name')}</th>
                                <th className="py-4 px-6 font-semibold text-sm">{t('inn')}</th>
                                <th className="py-4 px-6 font-semibold text-sm">{t('purchase_date')}</th>
                                <th className="py-4 px-6 font-semibold text-sm whitespace-nowrap">{t('current_value')}</th>
                                <th className="py-4 px-6 font-semibold text-sm">{t('building')}</th>
                                <th className="py-4 px-6 font-semibold text-sm">{t('status')}</th>
                                <th className="py-4 px-6 font-semibold text-sm">{t('image')}</th>
                                <th className="py-4 px-6 font-semibold text-sm text-right rounded-tr-lg">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredItems.map((item) => (
                                <tr key={item.id} className={`hover:bg-gray-50/80 transition-colors group ${selectedIds.includes(item.id) ? "bg-blue-50/50" : ""}`}>
                                    <td className="py-4 px-6 text-center">
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-sm"
                                            checked={selectedIds.includes(item.id)}
                                            onChange={() => toggleSelectItem(item.id)}
                                        />
                                    </td>
                                    <td className="py-4 px-6 text-gray-800 font-medium">#{item.orderNumber}</td>
                                    <td className="py-4 px-6">
                                        <div className="font-medium text-gray-900">{item.name}</div>
                                        <div className="text-xs text-gray-400">{item.category} • {item.model}</div>
                                    </td>
                                    <td className="py-4 px-6 text-gray-600 font-mono text-xs">{item.inn}</td>
                                    <td className="py-4 px-6 text-gray-600">{item.purchaseDate}</td>
                                    <td className="py-4 px-6 text-gray-900 font-medium whitespace-nowrap">
                                        {(() => {
                                            const priceStr = (item.price || "0").toString().replace(/\s/g, '').replace(',', '.');
                                            const price = parseFloat(priceStr) || 0;
                                            const quantity = parseInt(item.quantity) || 1;
                                            const total = price * quantity;
                                            return total.toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
                                        })()} so'm
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="text-gray-900">{item.building}</div>
                                        <div className="text-xs text-gray-400">{item.location}</div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.status === 'working' ? 'bg-green-100 text-green-700' :
                                            item.status === 'repair' ? 'bg-orange-100 text-orange-700' :
                                                item.status === 'written-off' ? 'bg-gray-100 text-gray-500 line-through' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {item.status === 'working' ? 'Ishchi' :
                                                item.status === 'repair' ? 'Ta\'mir talab' :
                                                    item.status === 'written-off' ? 'Ro\'yxatdan chiqarilgan' :
                                                        'Buzilgan'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
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

                                            {/* QR Button next to image */}
                                            <button
                                                onClick={() => openQRModal(item)}
                                                className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600 transition-colors border border-blue-200"
                                                title="QR Kodni ko'rish"
                                            >
                                                <RiQrCodeLine size={18} />
                                            </button>
                                        </div>
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
                                    <td colSpan="10" className="text-center py-12 text-gray-500">
                                        Jihozlar topilmadi
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
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


        </div>
    );

};

export default InventoryPage;
