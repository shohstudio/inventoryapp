import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
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
import EmployeeRequestsPage from "./pages/employee/EmployeeRequestsPage";
import ReportIssuePage from "./pages/employee/ReportIssuePage";
import ProfilePage from "./pages/common/ProfilePage";
import RequestsPage from "./pages/admin/RequestsPage";
import LogsPage from "./pages/admin/LogsPage";
import GuardDashboard from "./pages/guard/GuardDashboard";

import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <LanguageProvider>
          <ThemeProvider>
            <Toaster position="top-right" />
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
                <Route path="requests" element={<RequestsPage />} />
                <Route path="logs" element={
                  <ProtectedRoute roles={["admin"]}>
                    <LogsPage />
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
                <Route path="requests" element={<EmployeeRequestsPage />} />
                <Route path="report" element={<ReportIssuePage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>

              <Route
                path="/guard/*"
                element={
                  <ProtectedRoute roles={["guard"]}>
                    <GuardDashboard />
                  </ProtectedRoute>
                }
              />

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
