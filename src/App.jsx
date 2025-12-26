import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";

// Pages
import LoginPage from "./pages/auth/LoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import AdminLayout from "./components/layout/AdminLayout";
import InventoryPage from "./pages/admin/InventoryPage";
import WarehousePage from "./pages/admin/WarehousePage";
import UsersPage from "./pages/admin/UsersPage";
import EmployeeLayout from "./components/layout/EmployeeLayout";
import MyItemsPage from "./pages/employee/MyItemsPage";
import ReportIssuePage from "./pages/employee/ReportIssuePage";
import ProfilePage from "./pages/common/ProfilePage";

import { ThemeProvider } from "./context/ThemeContext";

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <LanguageProvider>
          <ThemeProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route path="/admin/*" element={<ProtectedRoute roles={["admin", "accounter", "warehouseman"]}><AdminLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="warehouse" element={<WarehousePage />} />
                <Route path="users" element={
                  <ProtectedRoute roles={["admin"]}>
                    <UsersPage />
                  </ProtectedRoute>
                } />
                <Route path="profile" element={<ProfilePage />} />
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
          </ThemeProvider>
        </LanguageProvider>
      </AuthProvider>
    </HashRouter>
  );
}

export default App;
