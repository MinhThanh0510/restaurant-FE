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

  // Mảng các menu cho Admin (Đã thay thế Emoji bằng SVG Icon)
  const adminMenus = [
    { 
      name: "Dashboard", 
      path: "/admin", 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg> 
    },
    { 
      name: "Reservations", 
      path: "/admin/reservations", 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> 
    },
    { 
      name: "Menus & Categories", 
      path: "/admin/menus", 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> 
    },
    { 
      name: "Inventory", 
      path: "/admin/inventory", 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> 
    },
    { 
      name: "Tables", 
      path: "/admin/tables", 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 16h16M12 16v6M8 22h8M6 16l-2-6h16l-2 6M7 10V4h10v6"/></svg> 
    },
    { 
      name: "Reviews", 
      path: "/admin/reviews", 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> 
    },
  ];

  if (user?.role !== "admin") {
    return (
      <div style={{ textAlign: "center", marginTop: "100px", fontFamily: "Inter, sans-serif" }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
        <button onClick={() => navigate("/")} style={{ padding: "10px 20px", marginTop: "20px", cursor: "pointer" }}>Return Home</button>
      </div>
    );
  }

  return (
    <div className="admin-container">
      
      {/* SIDEBAR TRÁI */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5"/><path d="M9 22V12M15 22V12"/></svg>
          Admin Panel
        </div>
        <nav className="admin-nav">
          {adminMenus.map((menu) => (
            <Link 
              key={menu.path} 
              to={menu.path} 
              className={`admin-nav-link ${location.pathname === menu.path ? "active" : ""}`}
            >
              <span className="nav-icon">{menu.icon}</span> {menu.name}
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
          <Outlet /> 
        </section>
      </main>
      
    </div>
  );
}

export default AdminLayout;