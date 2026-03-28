import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  // Hàm kiểm tra route hiện tại để đổi màu link
  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  return (
    <header className="navbar">
      <div className="nav-container">
        {/* LOGO BẰNG SVG & TEXT */}
        <Link to="/" className="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
            <path d="M7 2v20"></path>
            <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
          </svg>
          <span>L'Aura</span>
        </Link>

        {/* MENU LINKS */}
        <nav className="nav-links">
          <Link to="/" className={isActive("/")}>Home</Link>
          <Link to="/menu" className={isActive("/menu")}>Menu</Link>
          <Link to="/reservation" className={isActive("/reservation")}>Reservation</Link>
          {/* Chỉ hiện My Reservations khi đã đăng nhập */}
          {user && (
            <Link to="/my-reservations" className={isActive("/my-reservations")}>My Reservations</Link>
          )}
        </nav>

        {/* AUTH AREA */}
        <div className="auth-area">
          {user ? (
            <div className="user-pill">
              <div className="user-avatar">{getInitials(user.fullName)}</div>
              {/* Cắt lấy tên đầu để không bị dài */}
              <span className="user-name">{user.fullName}</span>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-login-nav">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;