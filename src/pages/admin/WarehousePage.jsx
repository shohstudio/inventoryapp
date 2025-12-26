import { useState, useEffect } from "react";
import { RiAddLine, RiSearchLine, RiFilter3Line, RiMore2Fill, RiImage2Line, RiArchiveLine } from "react-icons/ri";
import ItemModal from "../../components/admin/ItemModal";
import { useAuth } from "../../context/AuthContext";

const WarehousePage = () => {
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

    const [items, setItems] = useState(() => {
        const storedItems = localStorage.getItem("warehouse_items");
        return storedItems ? JSON.parse(storedItems) : [];
    });

    useEffect(() => {
        localStorage.setItem("warehouse_items", JSON.stringify(items));
    }, [items]);

    const { user } = useAuth();

    const handleAddItem = (newItem) => {
        const storedLogs = JSON.parse(localStorage.getItem("warehouse_logs") || "[]"); // Separate logs
        const timestamp = new Date().toISOString();
        let logAction = "";

        if (selectedItem) {
            setItems(items.map(i => i.id === selectedItem.id ? { ...newItem, id: selectedItem.id } : i));
            logAction = "tahrirladi";
        } else {
            const nextOrderNum = (items.length + 1).toString().padStart(3, '0');
            setItems([...items, { ...newItem, id: Date.now(), orderNumber: nextOrderNum }]);
            logAction = "qo'shdi";
        }

        // Add Log (Optional: if we want to track warehouse history separately)
        const newLog = {
            id: Date.now(),
            userName: user?.name || "Noma'lum",
            userRole: user?.role,
            action: logAction,
            itemName: newItem.name,
            timestamp: timestamp
        };

        const updatedLogs = [newLog, ...storedLogs].slice(0, 50);
        localStorage.setItem("warehouse_logs", JSON.stringify(updatedLogs));
    };

    const openModal = (item = null) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

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
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <RiArchiveLine className="text-orange-500" />
                        Omborxona <span className="text-xs text-gray-400 font-normal">v1.2</span>
                    </h1>
                    <p className="text-gray-500">
                        Zaxiradagi va hisobga olinmagan jihozlar
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="btn btn-primary bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-200 border-orange-600"
                >
                    <RiAddLine size={20} />
                    Omborga qo'shish
                </button>
            </div>

            <div className="card border-0 shadow-lg shadow-gray-100/50">
                {/* Search & Filter Controls */}
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Ombordan qidirish..."
                                className="input pl-10 w-full focus:ring-orange-500 focus:border-orange-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`btn gap-2 transition-colors ${showFilters ? 'bg-orange-50 text-orange-600 border-orange-200' : 'btn-outline text-gray-600'}`}
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
                            <label className="block text-xs font-medium text-gray-500 mb-1">Joylashgan joyi</label>
                            <input
                                type="text"
                                className="input w-full"
                                placeholder="Xona yoki bo'lim..."
                                value={filters.location}
                                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-100 text-gray-500 text-sm">
                            <th className="py-4 px-4 font-medium">Tartib raqami</th>
                            <th className="py-4 px-4 font-medium">Nomi</th>
                            <th className="py-4 px-4 font-medium">INN</th>
                            <th className="py-4 px-4 font-medium">Sotib olingan yili</th>
                            <th className="py-4 px-4 font-medium">Xozirgi qiymati</th>
                            <th className="py-4 px-4 font-medium">Bino</th>
                            <th className="py-4 px-4 font-medium">Holati</th>
                            <th className="py-4 px-4 font-medium">Rasm</th>
                            <th className="py-4 px-4 font-medium text-right">Amallar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map((item) => (
                            <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                                <td className="py-4 px-4 text-gray-600 font-medium">#{item.orderNumber}</td>
                                <td className="py-4 px-4">
                                    <div className="font-medium text-gray-900">{item.name}</div>
                                    <div className="text-xs text-gray-400">{item.category} • {item.model}</div>
                                </td>
                                <td className="py-4 px-4 text-gray-600 font-mono text-xs">{item.inn}</td>
                                <td className="py-4 px-4 text-gray-600">{item.purchaseYear}</td>
                                <td className="py-4 px-4 text-gray-900 font-medium">{item.price} so'm</td>
                                <td className="py-4 px-4">
                                    <div className="text-gray-900">{item.building}</div>
                                    <div className="text-xs text-gray-400">{item.location}</div>
                                </td>
                                <td className="py-4 px-4">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'working' ? 'bg-green-50 text-green-600' :
                                        item.status === 'repair' ? 'bg-orange-50 text-orange-600' :
                                            item.status === 'written-off' ? 'bg-gray-100 text-gray-500 line-through' :
                                                'bg-red-50 text-red-600'
                                        }`}>
                                        {item.status === 'working' ? 'Ishchi' :
                                            item.status === 'repair' ? 'Ta\'mir talab' :
                                                item.status === 'written-off' ? 'Spisat qilingan' :
                                                    'Buzilgan'}
                                    </span>
                                </td>
                                <td className="py-4 px-4">
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
                                <td className="py-4 px-4 text-right">
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
                                <td colSpan="9" className="text-center py-8 text-gray-500">
                                    Omborda jihozlar yo'q
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {/* Modals */}
            {isModalOpen && (
                <ItemModal
                    item={selectedItem}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleAddItem}
                />
            )}
        </div>
    );
};

export default WarehousePage;
