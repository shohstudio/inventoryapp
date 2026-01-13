import { RiToolsLine } from "react-icons/ri";

const RequestsPage = () => {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-400">
                <RiToolsLine size={48} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Ta'mirlanmoqda</h1>
            <p className="text-gray-500 max-w-md">
                So'rovlar bo'limi hozirda backend tizimiga ulanmoqda. Tez orada ishga tushadi.
            </p>
        </div>
    );
};

export default RequestsPage;
