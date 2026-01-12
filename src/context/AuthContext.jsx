import { createContext, useContext, useState, useEffect } from "react";
import { hashPassword } from "../utils/crypto";
import api from "../api/axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulating checking local storage for persisted session
    try {
      const storedUser = localStorage.getItem("inventory_user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed.id) {
          setUser(parsed);
        } else {
          localStorage.removeItem("inventory_user"); // Corrupt data
        }
      }
    } catch (e) {
      localStorage.removeItem("inventory_user");
      console.error("Auth init error:", e);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const { data } = await api.post('/auth/login', { username, password });
      setUser(data);
      localStorage.setItem("inventory_user", JSON.stringify(data));
      return data;
    } catch (error) {
      console.error("Login failed:", error);
      throw new Error(error.response?.data?.message || "Login xatoligi");
    }
  };

  const loginWithEImzo = async (signature, serial, pinfl) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const storedUsers = JSON.parse(localStorage.getItem("inventory_users_list") || "[]");
        // Find user by JSHShIR (PINFL) or allow any if in demo/mock mode
        // For now, let's look for a user with matching PINFL or fallback to a default Employee for demo

        // NOTE: In real app, we would send 'signature' and 'serial' to backend to verify PKCS7.
        // Backend would extract PINFL from the certificate in the signature.
        // Here we trust the passed 'pinfl' for the mock.

        const foundUser = storedUsers.find(u => u.pinfl === pinfl);

        if (foundUser) {
          if (foundUser.status === 'inactive') {
            reject(new Error("Foydalanuvchi bloklangan"));
            return;
          }
          const userData = { id: foundUser.id, name: foundUser.name, role: foundUser.role, email: foundUser.email, pinfl: foundUser.pinfl };
          setUser(userData);
          localStorage.setItem("inventory_user", JSON.stringify(userData));
          resolve(userData);
        } else {
          // Demo fallback: If I login with a valid key but user not found in DB, 
          // just log me in as a Guest/Employee or reject?
          // Let's create a temporary employee session for demo if not found
          const demoUser = {
            id: Date.now(),
            name: `ERI User ${pinfl.slice(-4)}`,
            role: "employee",
            email: `eri_${pinfl}@inv.uz`,
            pinfl: pinfl
          };
          // Don't save to DB, just session
          setUser(demoUser);
          localStorage.setItem("inventory_user", JSON.stringify(demoUser));
          resolve(demoUser);
        }
      }, 1000);
    });
  };

  const logout = () => {
    if (user) {
      const logs = JSON.parse(localStorage.getItem("inventory_logs") || "[]");
      logs.unshift({
        id: Date.now(),
        action: "Tizimdan chiqdi",
        userName: user.name,
        userRole: user.role,
        timestamp: new Date().toISOString(),
        itemId: null,
        itemName: "Logout"
      });
      localStorage.setItem("inventory_logs", JSON.stringify(logs));
    }
    setUser(null);
    localStorage.removeItem("inventory_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithEImzo, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
