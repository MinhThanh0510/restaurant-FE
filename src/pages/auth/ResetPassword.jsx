import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import { toast } from "react-toastify";
import "./Login.css";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 🔥 Component Text SHOW/HIDE tái sử dụng
  const PasswordToggle = ({ isVisible, toggleFn }) => (
    <button type="button" className="toggle-password" onClick={toggleFn}>
      {isVisible ? "HIDE" : "SHOW"}
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
        <p className="subtitle">Secure your account</p>

        <form className="auth-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="input-group">
            <label>New Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <PasswordToggle isVisible={showPassword} toggleFn={() => setShowPassword(!showPassword)} />
            </div>
          </div>

          <div className="input-group">
            <label>Confirm New Password</label>
            <div className="password-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <PasswordToggle isVisible={showConfirmPassword} toggleFn={() => setShowConfirmPassword(!showConfirmPassword)} />
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