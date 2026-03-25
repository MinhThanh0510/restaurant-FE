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
import AdminReviews from "./pages/AdminReviews";
import AdminDashboard from "./pages/AdminDashboard";
import ResetPassword from "./pages/ResetPassword";

function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      <Routes>

        {/* ================= PUBLIC ================= */}
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/login" element={<Login />} />

        <Route path="/reset-password/:token" element={<ResetPassword />} />

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
          <Route index element={<AdminDashboard />} />
          <Route path="reservations" element={<AdminReservations />} />
          <Route path="menus" element={<AdminMenus />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="tables" element={<AdminTables />} />
          <Route path="reviews" element={<AdminReviews />} />
          

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;