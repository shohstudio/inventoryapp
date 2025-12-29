import { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { read, utils, writeFile } from 'xlsx';
import { RiAddLine, RiSearchLine, RiFilter3Line, RiMore2Fill, RiImage2Line, RiStackLine, RiFileExcel2Line } from "react-icons/ri";
import ItemModal from "../../components/admin/ItemModal";
import WarehouseSelectionModal from "../../components/admin/WarehouseSelectionModal";
import QRScannerModal from "../../components/admin/QRScannerModal";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

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

    const [items, setItems] = useState(() => {
        const storedItems = localStorage.getItem("inventory_items");
        return storedItems ? JSON.parse(storedItems) : [
            {
                id: 1,
                name: "MacBook Pro M1",
                model: "A2338",
                serial: "FVFD1234",
                inn: "123456789",
                orderNumber: "001",
                category: "Laptop",
                building: "Bosh Ofis",
                location: "2-qavat, 203-xona",
                status: "working",
                assignedTo: "Ali Valiyev",
                purchaseYear: "2021",
                price: "14 000 000",
                images: [],
                pdf: null
            },
            {
                id: 2,
                name: "Dell Monitor 27\"",
                model: "P2722H",
                serial: "CN-0F123",
                inn: "987654321",
                orderNumber: "002",
                category: "Monitor",
                building: "IT Bo'limi",
                location: "1-qavat, Server xonasi",
                status: "working",
                assignedTo: "Ali Valiyev",
                purchaseYear: "2022",
                price: "3 500 000",
                images: [],
                pdf: "warranty_dell_p2722h.pdf"
            },
            {
                id: 3,
                name: "HP LaserJet Pro",
                model: "M404dn",
                serial: "PHB12345",
                inn: "456123789",
                orderNumber: "003",
                category: "Printer",
                building: "Omborxona",
                location: "Zaxira ombori",
                status: "repair",
                assignedTo: "Ofis",
                purchaseYear: "2020",
                price: "4 200 000",
                images: [],
                pdf: null
            }
        ];
    });

    // Handle Global QR Scan Navigation
    useEffect(() => {
        if (location.state?.scanCode) {
            handleScanSuccess(location.state.scanCode);
            // Clear state to prevent reopening on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    useEffect(() => {
        localStorage.setItem("inventory_items", JSON.stringify(items));
    }, [items]);

    const handleScanSuccess = (decodedText) => {
        // Search by ID, OrderNumber or Serial
        const foundItem = items.find(item =>
            String(item.id) === decodedText ||
            item.orderNumber === decodedText ||
            item.inn === decodedText ||
            item.serial?.toLowerCase() === decodedText.toLowerCase()
        );

        if (foundItem) {
            openModal(foundItem);
        } else {
            alert(`Jihoz topilmadi. QR Kod: ${decodedText}`);
        }
    };

    const { user } = useAuth();

    const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
    const [selectedWarehouseItem, setSelectedWarehouseItem] = useState(null);

    const handleAddItem = (newItem) => {
        const storedLogs = JSON.parse(localStorage.getItem("inventory_logs") || "[]");
        const timestamp = new Date().toISOString();
        let logAction = "";

        // NEW: Handle Warehouse Update if item came from warehouse
        if (selectedWarehouseItem) {
            const warehouseItems = JSON.parse(localStorage.getItem("warehouse_items") || "[]");
            const updatedWarehouseItems = warehouseItems.map(wItem => {
                if (wItem.id === selectedWarehouseItem.id) {
                    return { ...wItem, quantity: Math.max(0, parseInt(wItem.quantity) - 1) };
                }
                return wItem;
            });
            localStorage.setItem("warehouse_items", JSON.stringify(updatedWarehouseItems));

            // Add Log for Warehouse
            const warehouseLogs = JSON.parse(localStorage.getItem("warehouse_logs") || "[]");
            warehouseLogs.unshift({
                id: Date.now() + 1, // Slight offset
                userName: user?.name,
                userRole: user?.role,
                action: "inventarga o'tkazdi",
                itemName: newItem.name,
                timestamp: timestamp
            });
            localStorage.setItem("warehouse_logs", JSON.stringify(warehouseLogs.slice(0, 50)));
        }

        if (selectedItem) {
            setItems(items.map(i => i.id === selectedItem.id ? { ...newItem, id: selectedItem.id } : i));
            logAction = "tahrirladi";
        } else {
            const nextOrderNum = (items.length + 1).toString().padStart(3, '0');
            // Inherit price from warehouse item if available and not overridden
            const finalItem = {
                ...newItem,
                id: Date.now(),
                orderNumber: nextOrderNum,
                // If it was from warehouse, we might want to store that link? For now, not strict.
            };
            setItems([...items, finalItem]);
            logAction = selectedWarehouseItem ? "ombordan biriktirdi" : "qo'shdi";
        }

        // Add Log
        const newLog = {
            id: Date.now(),
            userName: user?.name || "Noma'lum",
            userRole: user?.role,
            action: logAction,
            itemName: newItem.name,
            timestamp: timestamp
        };

        const updatedLogs = [newLog, ...storedLogs].slice(0, 50); // Keep last 50 logs
        localStorage.setItem("inventory_logs", JSON.stringify(updatedLogs));

        // Reset
        setSelectedWarehouseItem(null);
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

    const handleExportExcel = () => {
        const exportData = items.map(item => ({
            [t('order_number')]: item.orderNumber,
            [t('name')]: item.name,
            [t('model')]: item.model,
            [t('inn')]: item.inn,
            [t('category')]: item.category,
            [t('building')]: item.building,
            [t('location')]: item.location,
            [t('status')]: item.status === 'working' ? t('status_working') :
                item.status === 'repair' ? t('status_repair') :
                    item.status === 'written-off' ? t('status_written_off') :
                        t('status_broken'),
            [t('assigned_to')]: item.assignedTo,
            [t('purchase_year')]: item.purchaseYear,
            [t('price')]: item.price
        }));

        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Jihozlar");
        writeFile(wb, "jihozlar_ruyxati.xlsx");
    };

    // Correct `openModal` is already defined above at line 185.
    // Duplicate removed.

    // Filter logic
    const filteredItems = items.filter(item => {
        // Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                item.name.toLowerCase().includes(query) ||
                item.model.toLowerCase().includes(query) ||
                item.serial?.toLowerCase().includes(query) ||
                item.inn?.includes(query) ||
                item.orderNumber.includes(query);

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
                    <button
                        onClick={handleExportExcel}
                        className="btn bg-green-500 hover:bg-green-600 text-white shadow-sm border-0"
                    >
                        <RiFileExcel2Line size={20} className="mr-2" />
                        {t('export_excel')}
                    </button>
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
                                placeholder="Qidirish (Nomi, Model, Seriya, INN)..."
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
                                <th className="py-4 px-6 font-semibold text-sm rounded-tl-lg">{t('order_number')}</th>
                                <th className="py-4 px-6 font-semibold text-sm">{t('name')}</th>
                                <th className="py-4 px-6 font-semibold text-sm">{t('inn')}</th>
                                <th className="py-4 px-6 font-semibold text-sm">{t('purchase_year')}</th>
                                <th className="py-4 px-6 font-semibold text-sm">{t('current_value')}</th>
                                <th className="py-4 px-6 font-semibold text-sm">{t('building')}</th>
                                <th className="py-4 px-6 font-semibold text-sm">{t('status')}</th>
                                <th className="py-4 px-6 font-semibold text-sm">{t('image')}</th>
                                <th className="py-4 px-6 font-semibold text-sm text-right rounded-tr-lg">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors group">
                                    <td className="py-4 px-6 text-gray-800 font-medium">#{item.orderNumber}</td>
                                    <td className="py-4 px-6">
                                        <div className="font-medium text-gray-900">{item.name}</div>
                                        <div className="text-xs text-gray-400">{item.category} • {item.model}</div>
                                    </td>
                                    <td className="py-4 px-6 text-gray-600 font-mono text-xs">{item.inn}</td>
                                    <td className="py-4 px-6 text-gray-600">{item.purchaseYear}</td>
                                    <td className="py-4 px-6 text-gray-900 font-medium">{item.price} so'm</td>
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
                                        {item.images && item.images.length > 0 ? (
                                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200">
                                                <img
                                                    src={item.images[0]}
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
                                    <td colSpan="9" className="text-center py-12 text-gray-500">
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


        </div>
    );

};

export default InventoryPage;
