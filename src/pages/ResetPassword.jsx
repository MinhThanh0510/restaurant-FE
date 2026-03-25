import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { toast } from "react-toastify";
import "./Login.css";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // State điều khiển ẩn hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Component Icon con mắt (Tái sử dụng từ trang Login)
  const EyeIcon = ({ isVisible, toggleFn }) => (
    <button type="button" className="toggle-password" onClick={toggleFn}>
      {isVisible ? (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ) : (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      )}
    </button>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error("Confirm password does not match!");
    }

    setLoading(true);
    try {
      const res = await api.put(`/auth/reset-password/${token}`, { password });
      toast.success(res.data.message);
      navigate("/login"); 
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>Reset Password</h2>
        <p className="subtitle">Please enter your new password below</p>

        <form className="auth-form" onSubmit={handleSubmit} autoComplete="off">
          
          <div className="input-group">
            <label>New Password</label>
            <div className="password-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                placeholder="Min 8 characters..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <EyeIcon isVisible={showPassword} toggleFn={() => setShowPassword(!showPassword)} />
            </div>
          </div>

          <div className="input-group">
            <label>Confirm New Password</label>
            <div className="password-wrapper">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                required 
                placeholder="Repeat your password..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <EyeIcon isVisible={showConfirmPassword} toggleFn={() => setShowConfirmPassword(!showConfirmPassword)} />
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;