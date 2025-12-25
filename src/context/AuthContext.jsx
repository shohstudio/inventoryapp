import { createContext, useContext, useState, useEffect } from "react";

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
    // Mock Login Logic
    // In a real app, this would be an API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (username === "admin" && password === "admin123") {
          const userData = { id: 1, name: "Admin User", role: "admin" };
          setUser(userData);
          localStorage.setItem("inventory_user", JSON.stringify(userData));
          resolve(userData);
        } else if (username === "user" && password === "user123") {
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
