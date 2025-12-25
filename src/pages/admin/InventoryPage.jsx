import { useState, useEffect } from "react";
import { RiAddLine, RiSearchLine, RiFilter3Line, RiMore2Fill, RiCloseCircleLine } from "react-icons/ri";
import ItemModal from "../../components/admin/ItemModal";
import { useLocation } from "react-router-dom";

const InventoryPage = () => {
    const location = useLocation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [filterStatus, setFilterStatus] = useState("all");

    // Check for navigation state (filter)
    useEffect(() => {
        if (location.state?.filter) {
            setFilterStatus(location.state.filter);
        }
    }, [location.state]);

    const [items, setItems] = useState([
        { id: 1, name: "MacBook Pro M1", model: "A2338", serial: "FVFD1234", category: "Laptop", building: "Bosh Ofis", status: "working", assignedTo: "Ali Valiyev" },
        { id: 2, name: "Dell Monitor 27\"", model: "P2722H", serial: "CN-0F123", category: "Monitor", building: "IT Bo'limi", status: "working", assignedTo: "Ali Valiyev" },
        { id: 3, name: "HP LaserJet Pro", model: "M404dn", serial: "PHB12345", category: "Printer", building: "Omborxona", status: "repair", assignedTo: "Ofis" },
    ]);

    const handleAddItem = (newItem) => {
        if (selectedItem) {
            setItems(items.map(i => i.id === selectedItem.id ? { ...newItem, id: selectedItem.id } : i));
        } else {
            setItems([...items, { ...newItem, id: Date.now() }]);
        }
    };

    const openModal = (item = null) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    // Filter logic
    const filteredItems = items.filter(item => {
        if (filterStatus === "all") return true;
        return item.status === filterStatus;
    });

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                        Invertar
                    </h1>
                    <p className="text-gray-500">
                        {filterStatus === 'repair' ? "Ta'mir talab jihozlar" : "Barcha jihozlar ro'yxati"}
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="btn btn-primary shadow-lg shadow-indigo-200"
                >
                    <RiAddLine size={20} />
                    Yangi qo'shish
                </button>
            </div>

            <div className="card border-0 shadow-lg shadow-gray-100/50">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <RiSearchLine size={18} />
                        </span>
                        <input
                            type="text"
                            placeholder="Nomi, model yoki seriya raqami..."
                            className="input pl-10"
                        />
                    </div>

                    {/* Active Filter Indicator */}
                    {filterStatus !== 'all' && (
                        <button
                            onClick={() => setFilterStatus('all')}
                            className="btn bg-orange-50 text-orange-600 hover:bg-orange-100 border-none gap-2"
                        >
                            <RiFilter3Line />
                            Faqat ta'mir talab
                            <RiCloseCircleLine size={18} />
                        </button>
                    )}

                    <button className="btn btn-outline gap-2 text-gray-600">
                        <RiFilter3Line />
                        Filter
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 text-gray-500 text-sm">
                                <th className="py-4 px-4 font-medium">Nomi</th>
                                <th className="py-4 px-4 font-medium">Model</th>
                                <th className="py-4 px-4 font-medium">Kategoriya</th>
                                <th className="py-4 px-4 font-medium">Bino</th>
                                <th className="py-4 px-4 font-medium">Holati</th>
                                <th className="py-4 px-4 font-medium">Javobgar</th>
                                <th className="py-4 px-4 font-medium text-right">Amallar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item) => (
                                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                                    <td className="py-4 px-4">
                                        <div className="font-medium text-gray-900">{item.name}</div>
                                        <div className="text-xs text-gray-400">{item.serial}</div>
                                    </td>
                                    <td className="py-4 px-4 text-gray-600">{item.model}</td>
                                    <td className="py-4 px-4">
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                            {item.category}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-gray-600">{item.building}</td>
                                    <td className="py-4 px-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'working' ? 'bg-green-50 text-green-600' :
                                            item.status === 'repair' ? 'bg-orange-50 text-orange-600' :
                                                'bg-red-50 text-red-600'
                                            }`}>
                                            {item.status === 'working' ? 'Ishchi' : item.status === 'repair' ? 'Ta\'mirda' : 'Buzilgan'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-gray-600">{item.assignedTo}</td>
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
                        </tbody>
                    </table>
                </div>
            </div>

            <ItemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleAddItem}
                item={selectedItem}
            />
        </div>
    );
};

export default InventoryPage;
