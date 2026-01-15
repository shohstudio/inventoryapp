import clsx from "clsx";

const StatsCard = ({ title, value, icon, trend, trendLabel, color = "indigo", onClick, variant = "default", footer }) => {
    const isFeatured = variant === "featured";

    return (
        <div
            onClick={onClick}
            className={clsx(
                "relative overflow-hidden rounded-[20px] transition-all duration-300 group",
                onClick && "cursor-pointer hover:-translate-y-1 active:scale-[0.98]",
                isFeatured
                    ? "bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 border border-indigo-100 dark:border-slate-700 shadow-lg shadow-indigo-100/50 dark:shadow-none"
                    : "bg-white dark:bg-slate-800 border border-gray-100 dark:border-gray-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-none"
            )}
        >
            <div className="p-6 relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <p className={clsx(
                        "text-sm font-semibold tracking-wide",
                        isFeatured ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400"
                    )}>{title}</p>
                    {isFeatured && (
                        <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600">
                            {icon}
                        </div>
                    )}
                </div>

                <div className="flex items-end gap-3 mb-2">
                    <h3 className={clsx(
                        "text-4xl font-extrabold tracking-tight",
                        isFeatured ? "text-indigo-900 dark:text-white" : "text-gray-800 dark:text-white"
                    )}>{value}</h3>
                </div>

                {/* Footer Section: Custom Footer OR Trend */}
                <div className="flex items-center text-sm font-medium h-6">
                    {footer ? (
                        <span className={clsx(
                            "text-sm",
                            isFeatured ? "text-indigo-500" : "text-gray-500"
                        )}>{footer}</span>
                    ) : (
                        trend !== undefined && (
                            <>
                                <span className={clsx(
                                    "flex items-center gap-1 px-2 py-0.5 rounded-md",
                                    trend > 0
                                        ? (isFeatured ? "bg-indigo-100 text-indigo-700" : "bg-green-50 text-green-600")
                                        : "bg-red-50 text-red-600"
                                )}>
                                    {trend > 0 ? "+" : ""}{trend}%
                                </span>
                                <span className={clsx(
                                    "ml-2 text-xs",
                                    isFeatured ? "text-indigo-400" : "text-gray-400"
                                )}>{trendLabel}</span>
                            </>
                        )
                    )}
                </div>
            </div>

            {/* Decorative Elements for Featured Card */}
            {isFeatured && (
                <>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
                </>
            )}
        </div>
    );
};

export default StatsCard;
