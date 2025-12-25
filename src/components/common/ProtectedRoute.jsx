import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children, roles = [] }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="h-screen flex items-center justify-center">Yuklanmoqda...</div>;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (roles.length > 0 && !roles.includes(user.role)) {
        // Redirect based on role if unauthorized
        if (user.role === "admin" || user.role === "accounter") return <Navigate to="/admin" replace />;
        return <Navigate to="/employee" replace />;
    }

    return children;
};

export default ProtectedRoute;
