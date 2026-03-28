import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // 🔥 Bước 1: Thêm trạng thái loading

  // ✅ 1. Load user khi app start
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user from storage", error);
      }
    }
    setLoading(false); // 🔥 Bước 2: Báo hiệu đã load xong (dù có user hay không)
  }, []);

  // ✅ 2. Login
  const login = (data) => {
    const { accessToken, refreshToken, user: userData } = data;
    if (accessToken) localStorage.setItem("accessToken", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  // ✅ 3. Update User
  const updateUser = (updatedUserData) => {
    localStorage.setItem("user", JSON.stringify(updatedUserData));
    setUser(updatedUserData);
  };

  // ✅ 4. Logout
  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    // 🔥 Bước 3: Truyền thêm loading vào Provider
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);