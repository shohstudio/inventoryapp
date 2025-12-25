import clsx from "clsx";

const StatsCard = ({ title, value, icon, trend, trendLabel, color = "indigo" }) => {
    return (
        <div className="card relative overflow-hidden group">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
                </div>
                <div className={clsx(
                    "p-3 rounded-xl bg-opacity-10 transition-colors",
                    `bg-${color}-500 text-${color}-600 group-hover:bg-${color}-100`
                )}>
                    {icon}
                </div>
            </div>

            <div className="mt-4 flex items-center text-sm">
                <span className={clsx(
                    "font-medium flex items-center gap-1",
                    trend > 0 ? "text-green-600" : "text-red-500"
                )}>
                    {trend > 0 ? "+" : ""}{trend}%
                </span>
                <span className="text-gray-400 ml-2">{trendLabel}</span>
            </div>

            {/* Decorative Background Blob */}
            <div className={clsx(
                "absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-5 blur-2xl transition-all group-hover:opacity-10",
                `bg-${color}-500`
            )}></div>
        </div>
    );
};

export default StatsCard;
