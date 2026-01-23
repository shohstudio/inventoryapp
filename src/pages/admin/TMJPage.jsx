import { useState, useEffect } from "react";
import { RiAddLine, RiSearchLine, RiFilter3Line, RiMore2Fill, RiImage2Line, RiFilePaper2Line, RiDeleteBinLine, RiCloseLine, RiFilePdfLine, RiUserReceived2Line } from "react-icons/ri";
import TMJItemModal from "../../components/admin/TMJItemModal";
import HandoverModal from "../../components/admin/HandoverModal";
import Pagination from "../../components/common/Pagination";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import api from "../../api/axios";
import { toast } from "react-hot-toast";
import { BASE_URL } from "../../api/axios";

const TMJPage = () => {
    const { t } = useLanguage();
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

    // Bulk Actions
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: 20,
                search: searchQuery,
                inventoryType: 'tmj', // Always TMJ
            };

            // Mapping tabs to API filters
            if (activeTab === 'stock') params.isAssigned = 'unassigned';
            if (activeTab === 'assigned') params.isAssigned = 'assigned';
            // 'all' sends no 'isAssigned' param, hammasi fetch bo'ladi

            const { data } = await api.get('/items', { params });

            if (data.items) {
                setItems(data.items);
                setTotalPages(data.metadata.totalPages);
                setTotalItems(data.metadata.total);
            }
        } catch (error) {
            toast.error("Ma'lumotlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [currentPage, searchQuery, activeTab]);

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
            setIsHandoverModalOpen(false);
            setSelectedHandoverItem(null);
        } catch (error) {
            console.error("Handover error", error);
            toast.error("Xatolik: " + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <RiFilePaper2Line className="text-blue-600" /> TMJ
                </h1>
                <div className="flex gap-2">
                    {selectedItems.size > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            disabled={isDeleting}
                            className="btn bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                        >
                            <RiDeleteBinLine size={20} /> {selectedItems.size} ta tanlanganni o'chirish
                        </button>
                    )}
                    <button onClick={() => { setSelectedItem(null); setIsModalOpen(true); }} className="btn btn-primary bg-blue-600">
                        <RiAddLine size={20} /> Qo'shish
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`pb-2 px-4 font-medium transition-colors relative ${activeTab === 'all' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Barchasi
                    {activeTab === 'all' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('stock')}
                    className={`pb-2 px-4 font-medium transition-colors relative ${activeTab === 'stock' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Omborga kelgan maxsulotlar
                    {activeTab === 'stock' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('assigned')}
                    className={`pb-2 px-4 font-medium transition-colors relative ${activeTab === 'assigned' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Berilgan maxsulotlar
                    {activeTab === 'assigned' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4 w-10">
                                    <input
                                        type="checkbox"
                                        className="checkbox rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        checked={selectedItems.size === items.length && items.length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="p-4 font-semibold text-gray-600">Nomi / Tur</th>
                                <th className="p-4 font-semibold text-gray-600">Holat / Biriktirilgan</th>
                                <th className="p-4 font-semibold text-gray-600">Kelgan vaqti</th>
                                <th className="p-4 font-semibold text-gray-600">Narx</th>
                                <th className="p-4 font-semibold text-gray-600">Hujjat</th>
                                <th className="p-4 font-semibold text-gray-600">Rasm</th>
                                <th className="p-4 font-semibold text-gray-600 text-right">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="8" className="p-8 text-center text-gray-500">Yuklanmoqda...</td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan="8" className="p-8 text-center text-gray-500">Ma'lumot yo'q</td></tr>
                            ) : items.map(item => (
                                <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${selectedItems.has(item.id) ? 'bg-blue-50' : ''}`}>
                                    <td className="p-4">
                                        <input
                                            type="checkbox"
                                            className="checkbox rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={selectedItems.has(item.id)}
                                            onChange={() => toggleSelectItem(item.id)}
                                        />
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-gray-900">{item.name}</div>
                                        <div className="text-xs text-gray-500">{item.category}</div>
                                    </td>
                                    <td className="p-4">
                                        {item.assignedTo ? (
                                            <span className="text-blue-600 font-medium btn btn-xs bg-blue-50 border-0">{item.assignedTo.name}</span>
                                        ) : (
                                            <span className="text-gray-400 italic">Omborda</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        {item.arrivalDate || item.purchaseDate || "-"}
                                    </td>
                                    <td className="p-4 font-medium">
                                        {parseFloat(item.price).toLocaleString()} so'm
                                    </td>
                                    <td className="p-4">

                                        {item.contractPdf ? (
                                            <a
                                                href={(item.contractPdf.startsWith('http') ? "" : BASE_URL.replace('/api', '')) + item.contractPdf}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-1 text-red-600 hover:text-red-700 font-medium text-sm bg-red-50 px-2 py-1 rounded border border-red-100 hover:bg-red-100 transition-colors w-fit"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <RiFilePdfLine size={16} /> PDF
                                            </a>
                                        ) : (
                                            <span className="text-gray-300">-</span>
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
                                                const imgSrc = img.startsWith('http') ? img : (BASE_URL.replace('/api', '') + img);
                                                return (
                                                    <div
                                                        className="h-10 w-10 rounded-lg overflow-hidden border border-gray-100 bg-white cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all shadow-sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPreviewImage(imgSrc);
                                                        }}
                                                    >
                                                        <img src={imgSrc} alt="Item" className="w-full h-full object-cover" />
                                                    </div>
                                                );
                                            }
                                            return <span className="text-gray-300">-</span>;
                                        })()}
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <button
                                            onClick={() => { setSelectedHandoverItem(item); setIsHandoverModalOpen(true); }}
                                            className={`p-2 rounded-lg flex items-center gap-1 border transition-colors ${item.initialOwner
                                                ? 'text-green-600 hover:bg-green-50 border-green-100 bg-green-50/50'
                                                : 'text-blue-600 hover:bg-blue-50 border-blue-100'}`}
                                            title="Topshirish"
                                        >
                                            <RiUserReceived2Line size={18} />
                                            <span className="text-xs font-medium">{item.initialOwner ? "Topshirilgan" : "Topshirish"}</span>
                                        </button>
                                        <button onClick={() => { setSelectedItem(item); setIsModalOpen(true); }} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                                            <RiMore2Fill size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                <div className="p-4 border-t border-gray-100">
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <RiDeleteBinLine className="text-red-600 text-3xl" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Tasdiqlash</h3>
                            <p className="text-gray-500 mb-6">
                                Haqiqatan ham belgilangan {selectedItems.size} ta elementni o'chirib yubormoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-5 py-2.5 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 shadow-lg shadow-red-200 transition-all transform active:scale-95"
                                >
                                    {isDeleting ? "O'chirilmoqda..." : "Ha, o'chirish"}
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

        </div>
    );
};

export default TMJPage;
