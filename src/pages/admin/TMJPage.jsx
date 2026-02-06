import { useState, useEffect } from "react";
import { RiAddLine, RiSearchLine, RiFilter3Line, RiMore2Fill, RiImage2Line, RiFilePaper2Line, RiDeleteBinLine, RiCloseLine, RiFilePdfLine, RiUserReceived2Line, RiFileExcel2Line, RiDownloadLine } from "react-icons/ri";
import * as XLSX from 'xlsx';
import TMJItemModal from "../../components/admin/TMJItemModal";
import HandoverModal from "../../components/admin/HandoverModal";
import Pagination from "../../components/common/Pagination";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import api, { BASE_URL, getImageUrl } from "../../api/axios";
import { toast } from "react-hot-toast";
import StatsCard from "../../components/admin/StatsCard";
import { RiBox3Line, RiMoneyDollarCircleLine, RiCheckboxCircleLine, RiStore2Line } from "react-icons/ri";

const TMJPage = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
    const [selectedHandoverItem, setSelectedHandoverItem] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [previewImage, setPreviewImage] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // 'all' (Barchasi), 'stock' (Omborga kelgan), 'assigned' (Berilgan)

    // Data State
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [tmjStats, setTmjStats] = useState({
        totalItems: 0,
        handedOverCount: 0,
        inStockValue: 0,
        handedOverValue: 0
    });

    // Bulk Actions
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const fetchStats = async () => {
        try {
            const { data } = await api.get('/stats/tmj');
            setTmjStats(data);
        } catch (error) {
            console.error("Failed to fetch TMJ stats", error);
        }
    };

    useEffect(() => {
        fetchItems();
        fetchStats();
    }, [currentPage, searchQuery, activeTab]);

    const formatValue = (num) => {
        if (num >= 1000000000) return (num / 1000000000).toFixed(1) + " mlrd";
        if (num >= 1000000) return (num / 1000000).toFixed(1) + " mln";
        return Number(num).toLocaleString();
    };

    // Bbirdan o'chirish
    const toggleSelectAll = () => {
        if (selectedItems.size === items.length) {
            setSelectedItems(new Set());
        } else {
            const allIds = new Set(items.map(i => i.id));
            setSelectedItems(allIds);
        }
    };

    const toggleSelectItem = (id) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedItems(newSelected);
    };

    const handleBulkDelete = () => {
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            await api.post('/items/delete-many', {
                ids: Array.from(selectedItems)
            });
            toast.success("Muvaffaqiyatli o'chirildi");
            setSelectedItems(new Set());
            fetchItems();
            setShowDeleteConfirm(false);
        } catch (error) {
            console.error("Bulk delete error", error);
            toast.error("O'chirishda xatolik");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleAddItem = async (itemData) => {
        try {
            const formData = new FormData();

            // 1. Manual Append of Standard Fields
            const fields = [
                'name', 'category', 'model', 'serialNumber', 'inn', 'orderNumber',
                'quantity', 'status', 'condition', 'building', 'department',
                'initialPinfl', 'initialOwner', 'initialRole'
            ];

            fields.forEach(field => {
                if (itemData[field] !== undefined && itemData[field] !== null) {
                    formData.append(field, itemData[field]);
                }
            });

            // 2. Specific Mapped Fields (Explicit handling)
            // Price: Strip spaces
            if (itemData.price) {
                formData.append('price', itemData.price.toString().replace(/\s/g, ''));
            }

            // Arrival Date -> Purchase Date
            const pDate = itemData.arrivalDate || itemData.purchaseDate;
            if (pDate) {
                formData.append('purchaseDate', pDate);
            }

            // Supplier -> Location
            const loc = itemData.supplier || itemData.location;
            if (loc) {
                formData.append('location', loc);
            }

            // Inventory Type
            formData.append('inventoryType', 'tmj');

            // 3. File Handling

            // New Image Files
            if (itemData.imageFiles && Array.isArray(itemData.imageFiles)) {
                itemData.imageFiles.forEach(file => {
                    formData.append('images', file);
                });
            }

            // Existing Images (JSON of URLs)
            if (itemData.images && Array.isArray(itemData.images)) {
                const existingUrls = itemData.images.filter(img => typeof img === 'string' && !img.startsWith('blob:'));
                formData.append('existingImages', JSON.stringify(existingUrls));
            }

            // PDF ko'rishga
            if (itemData.pdf instanceof File) {
                formData.append('images', itemData.pdf);
            }

            if (selectedItem) {
                await api.put(`/items/${selectedItem.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success("Yangilandi");
            } else {
                await api.post('/items', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success("Qo'shildi");
            }
            fetchItems();
            setIsModalOpen(false);
            fetchItems();
            fetchStats();
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Xatolik: " + (error.response?.data?.message || error.message));
        }
    };

    const handleHandoverSave = async (data) => {
        try {
            const formData = new FormData();
            formData.append('initialOwner', data.handoverName);
            formData.append('initialRole', data.handoverPosition);
            formData.append('building', data.handoverBuilding); // Update building location
            formData.append('assignedDate', data.handoverDate);
            formData.append('handoverQuantity', data.handoverQuantity);

            if (data.handoverImage instanceof File) {
                formData.append('handoverImage', data.handoverImage);
            }

            // We use updateItem endpoint as we are just updating fields
            await api.put(`/items/${selectedHandoverItem.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success("Topshirish muvaffaqiyatli saqlandi");
            fetchItems();
            fetchStats();
            setIsHandoverModalOpen(false);
            setSelectedHandoverItem(null);
        } catch (error) {
            console.error("Handover error", error);
            toast.error("Xatolik: " + (error.response?.data?.message || error.message));
        }
    };

    const handleExport = async (type) => {
        setIsExporting(true);
        try {
            const params = {
                limit: 10000, // Fetch all reasonable amount
                inventoryType: 'tmj'
            };

            if (type === 'stock') params.isAssigned = 'unassigned';
            else if (type === 'assigned') params.isAssigned = 'assigned';
            // 'all' -> no extra filter

            const { data } = await api.get('/items', { params });

            if (!data.items || data.items.length === 0) {
                toast.error("Export qilish uchun ma'lumot topilmadi");
                return;
            }

            // Format data for Excel
            const exportData = data.items.map((item, index) => {
                const qty = item.quantity || 1;
                const initQty = item.initialQuantity || qty;
                let quantityStr = qty.toString();

                if (item.initialOwner || item.assignedTo) {
                    // Handed over: Current / Initial (e.g. 2/10)
                    if (initQty > qty) quantityStr = `${qty} / ${initQty}`;
                } else {
                    // Stock: Initial / Current (e.g. 10/8)
                    if (initQty > qty) quantityStr = `${initQty} / ${qty}`;
                }

                return {
                    "№": index + 1,
                    "Nomi": item.name,
                    "Kategoriya": item.category,
                    // "Model": item.model || "", // User requested to remove
                    // "Seriya Raqami": item.serialNumber || "", // User requested to remove
                    // "INN": item.inn || "", // User requested to remove
                    // "Order Raqam": item.orderNumber || "", // User requested to remove
                    "Holati": item.assignedTo ? item.assignedTo.name : (item.initialOwner || "Omborda"),
                    "Kelgan Sanasi": item.arrivalDate || item.purchaseDate || "",
                    "Narxi": item.price,
                    "Soni": quantityStr, // Formatted string
                    "Bino": item.building || "",
                    // "Bo'lim": item.department || "", // User requested to remove
                    "Joylashuv": item.location || ""
                };
            });

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "TMJ Maxsulotlari");

            const fileName = `TMJ_Export_${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);

            toast.success("Excel fayl yuklandi");
            setIsExportModalOpen(false);
        } catch (error) {
            console.error("Export error", error);
            toast.error("Export qilishda xatolik");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <RiFilePaper2Line className="text-blue-600 dark:text-blue-400" /> TMJ
                </h1>
                <div className="flex gap-2">
                    {selectedItems.size > 0 && user?.role !== 'stat' && (
                        <button
                            onClick={handleBulkDelete}
                            disabled={isDeleting}
                            className="btn bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800/50 border-red-200 dark:border-red-800"
                        >
                            <RiDeleteBinLine size={20} /> {selectedItems.size} {t('warehouse_delete_selected')}
                        </button>
                    )}
                    {user?.role !== 'stat' && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="btn bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white border-none shadow-lg shadow-blue-200 dark:shadow-none"
                        >
                            <RiAddLine size={20} /> {t('add_new')}
                        </button>
                    )}
                    <button
                        onClick={() => setIsExportModalOpen(true)}
                        className="btn bg-green-500 hover:bg-green-600 text-white border-none ml-2 shadow-lg shadow-green-200"
                        title="Excelga yuklash"
                    >
                        <RiFileExcel2Line size={20} /> Excelga yuklash
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-4">
                <StatsCard
                    title="Jami maxsullotlar"
                    value={tmjStats.totalItems}
                    icon={<RiBox3Line size={24} />}
                    color="blue"
                    trendLabel="Jami"
                    trend={0}
                />
                <StatsCard
                    title="Topshiriilgan maxsulotlar"
                    value={tmjStats.handedOverCount}
                    icon={<RiUserReceived2Line size={24} />}
                    color="green"
                    trendLabel="Topshirilgan"
                    trend={0}
                />
                <StatsCard
                    title="Umumiy qiymat"
                    value={formatValue(tmjStats.inStockValue) + " so'm"}
                    icon={<RiMoneyDollarCircleLine size={24} />}
                    color="purple"
                    trendLabel="Omborda"
                    trend={0}
                />
                <StatsCard
                    title="Topshirish qiymati"
                    value={formatValue(tmjStats.handedOverValue) + " so'm"}
                    icon={<RiCheckboxCircleLine size={24} />}
                    color="orange"
                    trendLabel="Chiqib ketgan"
                    trend={0}
                />
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-slate-700">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`pb-2 px-4 font-medium transition-colors relative ${activeTab === 'all' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    {t('all')}
                    {activeTab === 'all' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('stock')}
                    className={`pb-2 px-4 font-medium transition-colors relative ${activeTab === 'stock' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    {t('tmj_stock')}
                    {activeTab === 'stock' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('assigned')}
                    className={`pb-2 px-4 font-medium transition-colors relative ${activeTab === 'assigned' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    {t('tmj_assigned')}
                    {activeTab === 'assigned' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"></div>}
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700">
                            <tr>
                                <th className="p-4 w-10">
                                    <input
                                        type="checkbox"
                                        className="checkbox rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                                        checked={selectedItems.size === items.length && items.length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-400">№</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-400">{t('name')} / {t('category')}</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-400">{t('status')} / {t('assigned_to')}</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-400">{t('arrival_date')}</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-400">{t('price')}</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-400">{t('quantity')}</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-400">Hujjat</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-400">{t('image')}</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {loading ? (
                                <tr><td colSpan="8" className="p-8 text-center text-gray-500 dark:text-gray-400">Yuklanmoqda...</td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan="8" className="p-8 text-center text-gray-500 dark:text-gray-400">Ma'lumot yo'q</td></tr>
                            ) : items.map((item, index) => (
                                <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${selectedItems.has(item.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                    <td className="p-4">
                                        <input
                                            type="checkbox"
                                            className="checkbox rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                                            checked={selectedItems.has(item.id)}
                                            onChange={() => toggleSelectItem(item.id)}
                                        />
                                    </td>
                                    <td className="p-4 text-gray-500 dark:text-gray-400 font-medium">
                                        {(currentPage - 1) * 10 + index + 1}
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{item.category}</div>
                                    </td>
                                    <td className="p-4">
                                        {item.assignedTo ? (
                                            <span className="text-blue-600 dark:text-blue-400 font-medium btn btn-xs bg-blue-50 dark:bg-blue-900/30 border-0">{item.assignedTo.name}</span>
                                        ) : (
                                            <span className="text-gray-400 dark:text-slate-500 italic">Omborda</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-400">
                                        {item.arrivalDate || item.purchaseDate || "-"}
                                    </td>
                                    <td className="p-4 font-medium text-gray-900 dark:text-gray-100">
                                        {parseFloat(item.price).toLocaleString()} so'm
                                    </td>
                                    <td className="p-4 text-gray-900 dark:text-gray-100 font-medium whitespace-nowrap text-center">
                                        {(() => {
                                            const qty = item.quantity || 1;
                                            const initQty = item.initialQuantity || qty;

                                            if (item.initialOwner || item.assignedTo) {
                                                // Handed over item: Show "Current / Initial" (e.g., 2/10)
                                                // Logic: User holds 2 out of original 10
                                                return <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">{qty} / {initQty}</span>;
                                            } else {
                                                // Stock item: Show "Initial / Current" (e.g., 10/8) or just "Current" if full
                                                // Or requested: "8 barchasi ... sonida 10/8"
                                                // User requested: "10/8" for stock (Initial / Current)
                                                if (initQty > qty) {
                                                    return <span className="text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded font-bold">{initQty} / {qty}</span>;
                                                }
                                                return qty;
                                            }
                                        })()}
                                    </td>
                                    <td className="p-4">

                                        {item.contractPdf ? (
                                            <a
                                                href={(item.contractPdf.startsWith('http') ? "" : BASE_URL.replace('/api', '')) + item.contractPdf}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium text-sm bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded border border-red-100 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors w-fit"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <RiFilePdfLine size={16} /> PDF
                                            </a>
                                        ) : (
                                            <span className="text-gray-300 dark:text-gray-600">-</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {(() => {
                                            let img = item.image;
                                            if (!img && item.images) {
                                                try {
                                                    const imgs = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
                                                    if (Array.isArray(imgs) && imgs.length > 0) img = imgs[0];
                                                } catch (e) {
                                                    console.error("Image parse error", e);
                                                }
                                            }

                                            if (img) {
                                                const imgSrc = getImageUrl(img);
                                                return (
                                                    <div
                                                        className="h-10 w-10 rounded-lg overflow-hidden border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all shadow-sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPreviewImage(imgSrc);
                                                        }}
                                                    >
                                                        <img src={imgSrc} alt="Item" className="w-full h-full object-cover" />
                                                    </div>
                                                );
                                            }
                                            return <span className="text-gray-300 dark:text-gray-600">-</span>;
                                        })()}
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        {user?.role !== 'stat' && (
                                            <>
                                                <button
                                                    onClick={() => { setSelectedHandoverItem(item); setIsHandoverModalOpen(true); }}
                                                    className={`p-2 rounded-lg flex items-center gap-1 border transition-colors ${item.initialOwner
                                                        ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 border-green-100 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20'
                                                        : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 border-blue-100 dark:border-blue-800'}`}
                                                    title="Topshirish"
                                                >
                                                    <RiUserReceived2Line size={18} />
                                                    <span className="text-xs font-medium">{item.initialOwner ? t('tmj_handed_over') : t('tmj_handover')}</span>
                                                </button>
                                                <button onClick={() => { setSelectedItem(item); setIsModalOpen(true); }} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                                                    <RiMore2Fill size={18} />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>

            {isModalOpen && (
                <TMJItemModal
                    isOpen={isModalOpen}
                    item={selectedItem}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleAddItem}
                />
            )}

            {isHandoverModalOpen && (
                <HandoverModal
                    isOpen={isHandoverModalOpen}
                    item={selectedHandoverItem}
                    readOnly={!!selectedHandoverItem?.initialOwner}
                    onClose={() => setIsHandoverModalOpen(false)}
                    onSave={handleHandoverSave}
                />
            )}

            {/* Custom Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <RiDeleteBinLine className="text-red-600 dark:text-red-400 text-3xl" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('confirm_delete_title_many')}</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                {t('confirm_delete_message_many').replace('{count}', selectedItems.size)}
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-5 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 shadow-lg shadow-red-200 transition-all transform active:scale-95"
                                >
                                    {isDeleting ? t('loading') : t('yes_delete')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center">
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors bg-white/10 p-2 rounded-full backdrop-blur-md"
                        >
                            <RiCloseLine size={24} />
                        </button>
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}

            {/* Export Modal */}
            {isExportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-sm w-full p-6 transform transition-all scale-100">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
                                    <RiFileExcel2Line size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Excelga yuklash</h3>
                            </div>
                            <button
                                onClick={() => setIsExportModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                                <RiCloseLine size={24} />
                            </button>
                        </div>

                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                            Qaysi turdagi ma'lumotlarni yuklab olmoqchisiz?
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => handleExport('all')}
                                disabled={isExporting}
                                className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-200 dark:hover:border-blue-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all group"
                            >
                                <span className="font-medium dark:text-gray-200">Barchasi</span>
                                <RiDownloadLine className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>

                            <button
                                onClick={() => handleExport('stock')}
                                disabled={isExporting}
                                className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:border-orange-200 dark:hover:border-orange-800 hover:text-orange-600 dark:hover:text-orange-400 transition-all group"
                            >
                                <span className="font-medium dark:text-gray-200">Ombordagi maxsulotlar</span>
                                <RiDownloadLine className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>

                            <button
                                onClick={() => handleExport('assigned')}
                                disabled={isExporting}
                                className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:border-purple-200 dark:hover:border-purple-800 hover:text-purple-600 dark:hover:text-purple-400 transition-all group"
                            >
                                <span className="font-medium dark:text-gray-200">Berilgan maxsulotlar</span>
                                <RiDownloadLine className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>

                        {isExporting && (
                            <div className="mt-4 text-center text-sm text-gray-500 animate-pulse">
                                Yuklanmoqda...
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default TMJPage;
