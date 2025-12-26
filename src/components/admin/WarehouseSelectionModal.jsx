import { useState, useEffect } from "react";
import { RiCloseLine, RiSearchLine, RiCheckLine } from "react-icons/ri";

const WarehouseSelectionModal = ({ isOpen, onClose, onSelect }) => {
    const [items, setItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (isOpen) {
            const storedItems = JSON.parse(localStorage.getItem("warehouse_items") || "[]");
            // Only show items with quantity > 0
            const availableItems = storedItems.filter(item => parseInt(item.quantity) > 0);
            setItems(availableItems);
        }
    }, [isOpen]);

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.model.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-100 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-800">
                        Ombordan jihoz tanlash
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <RiCloseLine size={24} />
                    </button>
                </div>

                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <div className="relative">
                        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Nomi yoki Model bo'yicha qidirish..."
                            className="input pl-10 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="overflow-y-auto flex-1 p-4 space-y-2">
                    {filteredItems.length > 0 ? (
                        filteredItems.map(item => (
                            <div
                                key={item.id}
                                onClick={() => onSelect(item)}
                                className="flex justify-between items-center p-4 rounded-xl border border-gray-100 hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer transition-all group"
                            >
                                <div>
                                    <h3 className="font-bold text-gray-800 group-hover:text-indigo-700">{item.name}</h3>
                                    <div className="text-sm text-gray-500 flex gap-2">
                                        <span>{item.model}</span>
                                        <span>•</span>
                                        <span>{item.quantity} dona mavjud</span>
                                    </div>
                                </div>
                                <button className="btn btn-sm btn-outline group-hover:btn-primary">
                                    <RiCheckLine size={16} className="mr-1" />
                                    Tanlash
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            {searchQuery ? "Hech narsa topilmadi" : "Omborda bo'sh jihozlar yo'q"}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WarehouseSelectionModal;
