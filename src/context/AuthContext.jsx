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

    // Mock Login Logic
    // In a real app, this would be an API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Hashed "admin123" -> 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
        if (username === "admin" && hashedPassword === "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9") {
          const userData = { id: 1, name: "Admin User", role: "admin" };
          setUser(userData);
          localStorage.setItem("inventory_user", JSON.stringify(userData));
          resolve(userData);
          // Hashed "user123" -> e606e38b0d8c19b24cf0ee3808183162ea7cd63ff7912dbb22b5e803286b4446
        } else if (username === "user" && hashedPassword === "e606e38b0d8c19b24cf0ee3808183162ea7cd63ff7912dbb22b5e803286b4446") {
          const userData = { id: 2, name: "Regular Employee", role: "employee" };
          setUser(userData);
          localStorage.setItem("inventory_user", JSON.stringify(userData));
          resolve(userData);
        } else {
          reject(new Error("Invalid credentials"));
        }
      }, 500); // Simulate network delay
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
