import { createContext, useContext, useState, useEffect } from "react";
import { hashPassword } from "../utils/crypto";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulating checking local storage for persisted session
    const storedUser = localStorage.getItem("inventory_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const hashedPassword = await hashPassword(password);

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const storedUsers = JSON.parse(localStorage.getItem("inventory_users_list") || "[]");

        // Find user
        const foundUser = storedUsers.find(u => (u.username === username || u.email === username) && u.password === hashedPassword);

        if (foundUser) {
          if (foundUser.status === 'inactive') {
            reject(new Error("Foydalanuvchi bloklangan"));
            return;
          }
          const userData = { id: foundUser.id, name: foundUser.name, role: foundUser.role, email: foundUser.email };
          setUser(userData);
          localStorage.setItem("inventory_user", JSON.stringify(userData));
          resolve(userData);
        } else {
          // Fallback for initial admin if list is empty or messed up
          if (username === "admin" && hashedPassword === "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918") {
            const adminData = { id: 1, name: "Admin User", username: "admin", role: "admin", email: "admin@inv.uz" };
            setUser(adminData);
            localStorage.setItem("inventory_user", JSON.stringify(adminData));
            resolve(adminData);
          } else if (username === "user" && hashedPassword === "04f8996da763b7a969b1028ee3007569eaf3a635486ddab211d512c85b9df8fb") {
            const userData = { id: 2, name: "Ali Valiyev", username: "user", role: "employee", email: "ali@inv.uz" };
            setUser(userData);
            localStorage.setItem("inventory_user", JSON.stringify(userData));
            resolve(userData);
          } else {
            reject(new Error("Login yoki parol noto'g'ri"));
          }
        }
      }, 500);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("inventory_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
