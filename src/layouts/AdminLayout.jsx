import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AdminLayout.css";

function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Mảng các menu cho Admin
  const adminMenus = [
    { name: "Dashboard", path: "/admin", icon: "📊" },
    { name: "Reservations", path: "/admin/reservations", icon: "🗓️" },
    { name: "Menus & Categories", path: "/admin/menus", icon: "🍔" },
    { name: "Inventory", path: "/admin/inventory", icon: "📦" },
    { name: "Tables", path: "/admin/tables", icon: "🪑" },
    { name: "Reviews", path: "/admin/reviews", icon: "⭐" },
  ];

  // Chặn không cho User thường vào (Bảo mật Front-end)
  if (user?.role !== "admin") {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h2>🚫 Access Denied</h2>
        <p>You do not have permission to view this page.</p>
        <button onClick={() => navigate("/")} style={{ padding: "10px", marginTop: "20px" }}>Return Home</button>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* SIDEBAR TRÁI */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          🍽️ Admin Panel
        </div>
        <nav className="admin-nav">
          {adminMenus.map((menu) => (
            <Link 
              key={menu.path} 
              to={menu.path} 
              className={`admin-nav-link ${location.pathname === menu.path ? "active" : ""}`}
            >
              <span>{menu.icon}</span> {menu.name}
            </Link>
          ))}
        </nav>
        <div className="admin-logout">
          <button onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      {/* NỘI DUNG PHẢI */}
      <main className="admin-main">
        <header className="admin-header">
          <h2>Admin Dashboard</h2>
          <div className="admin-user-info">
            <span>Hi, {user?.fullName}</span>
            <div className="admin-avatar">{user?.fullName?.charAt(0).toUpperCase()}</div>
          </div>
        </header>

        <section className="admin-content-area">
          {/* Outlet là nơi React Router sẽ render nội dung các trang con (như Reservations, Menu...) */}
          <Outlet /> 
        </section>
      </main>
    </div>
  );
}

export default AdminLayout;