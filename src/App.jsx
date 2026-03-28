import { BrowserRouter, Routes, Route } from "react-router-dom";

import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";

import Home from "./pages/user/Home";
import Menu from "./pages/user/Menu";
import Reservation from "./pages/user/Reservation";
import MyReservations from "./pages/user/MyReservations";

import Login from "./pages/auth/Login";
import ResetPassword from "./pages/auth/ResetPassword";

import ProtectedRoute from "./components/ProtectedRoute";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import AdminReservations from "./pages/admin/AdminReservations";
import AdminMenus from "./pages/admin/AdminMenus";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminTables from "./pages/admin/AdminTables";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminChat from "./pages/admin/AdminChat";

function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      <Routes>

        {/* ================= AUTHENTICATION (Không dùng Layout) ================= */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />


        {/* ================= GIAO DIỆN KHÁCH HÀNG (Có Navbar & Chatbox) ================= */}
        <Route element={<UserLayout />}>

          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />

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
        </Route>


        {/* ================= GIAO DIỆN ADMIN (Có Sidebar Quản trị) ================= */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
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
          <Route path="chat" element={<AdminChat />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;