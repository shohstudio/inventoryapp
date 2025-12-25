import { RiComputerLine, RiCheckDoubleLine } from "react-icons/ri";

const MyItemsPage = () => {
    // Mock data - in real app would come from API/Context
    const myItems = [
        { id: 1, name: "MacBook Pro M1", serial: "FVFD1234", category: "Laptop", dateAssigned: "2024-01-15" },
        { id: 2, name: "Dell Monitor 27\"", serial: "CN-0F123", category: "Monitor", dateAssigned: "2024-01-15" },
    ];

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Mening Jihozlarim</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myItems.map((item) => (
                    <div key={item.id} className="card group hover:border-indigo-200 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <RiComputerLine size={24} />
                            </div>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                <RiCheckDoubleLine />
                                Faol
                            </span>
                        </div>

                        <h3 className="font-bold text-lg text-gray-800 mb-1">{item.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">{item.category} • {item.serial}</p>

                        <div className="pt-4 border-t border-gray-100 text-xs text-gray-400">
                            Biriktirilgan sana: {item.dateAssigned}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyItemsPage;
