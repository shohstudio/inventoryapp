import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";

// Pages
import LoginPage from "./pages/auth/LoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import AdminLayout from "./components/layout/AdminLayout";
import InventoryPage from "./pages/admin/InventoryPage";
import UsersPage from "./pages/admin/UsersPage";
import EmployeeLayout from "./components/layout/EmployeeLayout";
import MyItemsPage from "./pages/employee/MyItemsPage";
import ReportIssuePage from "./pages/employee/ReportIssuePage";
import ProfilePage from "./pages/common/ProfilePage";

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<div className="p-4">Settings Page (Coming Soon)</div>} />
          </Route>

          <Route
            path="/employee/*"
            element={
              <ProtectedRoute roles={["employee"]}>
                <EmployeeLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<EmployeeDashboard />} />
            <Route path="items" element={<MyItemsPage />} />
            <Route path="report" element={<ReportIssuePage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}

export default App;
