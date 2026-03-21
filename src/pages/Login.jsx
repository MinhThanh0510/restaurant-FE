import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./Login.css";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  // Trạng thái ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setPhone("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // Hàm kiểm tra độ mạnh của mật khẩu
  const isValidPassword = (pwd) => {
    // Ít nhất 8 ký tự, 1 chữ hoa, 1 chữ số
    const regex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pwd);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await api.post("/auth/login", { email, password });
        login(res.data);
        alert("🎉 Login successful!");
        navigate("/");

      } else if (mode === "register") {
        
        // --- 1. KIỂM TRA MẬT KHẨU ---
        if (!isValidPassword(password)) {
          alert("Password must be at least 8 characters long, contain at least one uppercase letter and one number.");
          setLoading(false);
          return;
        }

        // --- 2. KIỂM TRA MẬT KHẨU KHỚP ---
        if (password !== confirmPassword) {
          alert("Confirm password does not match!");
          setLoading(false);
          return;
        }

        // --- 3. GỌI API ---
        await api.post("/auth/register", { fullName, email, password, phone });
        alert("🎉 Registration successful! Please login.");
        switchMode("login");

      } else if (mode === "forgot") {
        alert(`System has recorded the password recovery request for email: ${email}\n(Email sending feature is currently being developed by the Backend team)`);
        switchMode("login");
      }
    } catch (err) {
      alert(err.response?.data?.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Biểu tượng Con Mắt Mở/Đóng (Dùng chung cho sạch code)
  const EyeIcon = ({ isVisible, toggleFn }) => (
    <button type="button" className="toggle-password" onClick={toggleFn}>
      {isVisible ? (
        // Icon mắt mở
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ) : (
        // Icon mắt đóng
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      )}
    </button>
  );

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>Restaurant System 🍽</h2>
        <p className="subtitle">
          {mode === "login" && "Login to continue"}
          {mode === "register" && "Register for a new account"}
          {mode === "forgot" && "Recover your password"}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          
          {mode === "register" && (
            <>
              <div className="input-group">
                <label>Full Name</label>
                <input type="text" placeholder="Enter your full name..." value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Phone Number</label>
                <input type="tel" placeholder="Enter your phone number..." value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
            </>
          )}

          <div className="input-group">
            <label>Email</label>
            <input type="email" placeholder="Enter your email..." value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          {mode !== "forgot" && (
            <div className="input-group">
              <label>Password {mode === "register" && "(≥8 characters, 1 UPPERCASE, 1 Number)"}</label>
              <div className="password-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter password..." 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
                <EyeIcon isVisible={showPassword} toggleFn={() => setShowPassword(!showPassword)} />
              </div>
            </div>
          )}

          {mode === "register" && (
            <div className="input-group">
              <label>Confirm Password</label>
              <div className="password-wrapper">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Confirm password..." 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                />
                <EyeIcon isVisible={showConfirmPassword} toggleFn={() => setShowConfirmPassword(!showConfirmPassword)} />
              </div>
            </div>
          )}

          {mode === "login" && (
            <div className="forgot-link">
              <span onClick={() => switchMode("forgot")}>Forgot password?</span>
            </div>
          )}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "Processing..." : mode === "login" ? "Login" : mode === "register" ? "Register" : "Submit Request"}
          </button>
        </form>

        <div className="auth-links">
          {mode === "login" && (
            <div>Don't have an account? <span onClick={() => switchMode("register")}>Register now</span></div>
          )}
          {mode === "register" && (
            <div>Already have an account? <span onClick={() => switchMode("login")}>Login</span></div>
          )}
          {mode === "forgot" && (
            <div><span onClick={() => switchMode("login")}>Back to login</span></div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;