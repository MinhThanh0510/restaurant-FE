import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth(); // 🔥 Lấy thêm loading từ context

  // 🛡️ TRƯỜNG HỢP 1: Đang load dữ liệu từ localStorage
  // Trả về null để PageLoader hoặc giao diện hiện tại giữ nguyên, không chuyển hướng bậy
  if (loading) {
    return null;
  }

  // 🛡️ TRƯỜNG HỢP 2: Đã load xong mà không thấy user đâu
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 🛡️ TRƯỜNG HỢP 3: Kiểm tra quyền (Role) nếu có yêu cầu
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // ✅ OK: Cho phép vào trang
  return children;
}

export default ProtectedRoute;