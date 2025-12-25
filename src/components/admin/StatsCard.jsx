import clsx from "clsx";

const StatsCard = ({ title, value, icon, trend, trendLabel, color = "indigo", onClick }) => {
    // Static color definitions for Tailwind JIT to detect
    const colorVariants = {
        indigo: {
            iconBg: "bg-indigo-500 text-indigo-600 group-hover:bg-indigo-100",
            blob: "bg-indigo-500",
            text: "text-indigo-600"
        },
        blue: {
            iconBg: "bg-blue-500 text-blue-600 group-hover:bg-blue-100",
            blob: "bg-blue-500",
            text: "text-blue-600"
        },
        orange: {
            iconBg: "bg-orange-500 text-orange-600 group-hover:bg-orange-100",
            blob: "bg-orange-500",
            text: "text-orange-600"
        },
        green: {
            iconBg: "bg-emerald-500 text-emerald-600 group-hover:bg-emerald-100",
            blob: "bg-emerald-500",
            text: "text-emerald-600"
        }
    };

    const currentTheme = colorVariants[color] || colorVariants.indigo;

    return (
        <div
            onClick={onClick}
            className={clsx(
                "card relative overflow-hidden group",
                onClick && "cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            )}
        >
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
                </div>
                <div className={clsx(
                    "p-3 rounded-xl bg-opacity-10 transition-colors",
                    currentTheme.iconBg
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
                currentTheme.blob
            )}></div>
        </div>
    );
};

export default StatsCard;
