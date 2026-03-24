import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Reservation from "./pages/Reservation";
import MyReservations from "./pages/MyReservations";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// 🔥 Import các Component Admin
import AdminLayout from "./layouts/AdminLayout";
import AdminReservations from "./pages/AdminReservations";
import AdminMenus from "./pages/AdminMenus";
import AdminInventory from "./pages/AdminInventory";
import AdminTables from "./pages/AdminTables"; // 🔥 Import trang Tables mới

function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      <Routes>

        {/* ================= PUBLIC ================= */}
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/login" element={<Login />} />

        {/* ================= PROTECTED (CUSTOMER) ================= */}
        <Route
          path="/reservation"
          element={
            <ProtectedRoute>
              <Reservation />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/my-reservations"
          element={
            <ProtectedRoute>
              <MyReservations />
            </ProtectedRoute>
          }
        />

        {/* ================= PROTECTED (ADMIN) ================= */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* Mặc định khi vào /admin sẽ hiển thị trang Dashboard này */}
          <Route index element={<div style={{ padding: "20px" }}><h2>Dashboard summary (Coming soon...)</h2></div>} />
          
          {/* Các trang quản lý chi tiết của Admin */}
          <Route path="reservations" element={<AdminReservations />} />
          <Route path="menus" element={<AdminMenus />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="tables" element={<AdminTables />} />
          
          {/* Các trang sẽ làm tiếp theo (Tạm thời để placeholder) */}
          <Route path="reviews" element={<div style={{ padding: "20px" }}><h2>Review Management</h2></div>} />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;