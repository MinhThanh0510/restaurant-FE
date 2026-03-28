import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import "./Login.css";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify"; // 🔥 Dùng Toastify thay cho Alert

function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
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

  const isValidPassword = (pwd) => {
    const regex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pwd);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await api.post("/auth/login", { email, password });
        toast.success("Welcome back!"); // 🔥 Thay alert
        login(res.data);

      } else if (mode === "register") {
        if (!isValidPassword(password)) {
          toast.warning("Password must be ≥8 chars, include 1 UPPERCASE & 1 Number."); // 🔥 Thay alert
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          toast.error("Passwords do not match!"); // 🔥 Thay alert
          setLoading(false);
          return;
        }

        await api.post("/auth/register", { fullName, email, password, phone });
        toast.success("Registration successful! Please login."); // 🔥 Thay alert
        switchMode("login");

      } else if (mode === "forgot") {
        try {
          const res = await api.post("/auth/forgot-password", { email });
          toast.success(res.data.message); // 🔥 Thay alert
          switchMode("login");
        } catch (err) {
          toast.error(err.response?.data?.message || "Email could not be sent.");
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "An error occurred. Please try again."); // 🔥 Thay alert
    } finally {
      setLoading(false);
    }
  };

  // 🔥 THAY ICON BẰNG TEXT "SHOW / HIDE" ĐẲNG CẤP
  const PasswordToggle = ({ isVisible, toggleFn }) => (
    <button type="button" className="toggle-password" onClick={toggleFn}>
      {isVisible ? "HIDE" : "SHOW"}
    </button>
  );

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>L'Aura</h2>
        <p className="subtitle">
          {mode === "login" && "Login to continue"}
          {mode === "register" && "Become a member"}
          {mode === "forgot" && "Recover password"}
        </p>

        <form className="auth-form" onSubmit={handleSubmit} autoComplete="off">
          {mode === "register" && (
            <>
              <div className="input-group">
                <label>Full Name</label>
                <input type="text" placeholder="Enter your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Phone Number</label>
                <input type="tel" placeholder="Enter your phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
            </>
          )}

          <div className="input-group">
            <label>Email Address</label>
            <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="off" />
          </div>

          {mode !== "forgot" && (
            <div className="input-group">
              <label>Password {mode === "register" && "(≥8 chars, 1 Upper, 1 Num)"}</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="off"
                />
                <PasswordToggle isVisible={showPassword} toggleFn={() => setShowPassword(!showPassword)} />
              </div>
            </div>
          )}

          {mode === "register" && (
            <div className="input-group">
              <label>Confirm Password</label>
              <div className="password-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <PasswordToggle isVisible={showConfirmPassword} toggleFn={() => setShowConfirmPassword(!showConfirmPassword)} />
              </div>
            </div>
          )}

          {mode === "login" && (
            <div className="forgot-link">
              <span onClick={() => switchMode("forgot")}>Forgot password?</span>
            </div>
          )}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "Processing..." : mode === "login" ? "Sign In" : mode === "register" ? "Register" : "Send Link"}
          </button>
        </form>

        <div className="auth-links">
          {mode === "login" && (
            <div>New to our restaurant? <span onClick={() => switchMode("register")}>Create an account</span></div>
          )}
          {mode === "register" && (
            <div>Already a member? <span onClick={() => switchMode("login")}>Sign in</span></div>
          )}
          {mode === "forgot" && (
            <div><span onClick={() => switchMode("login")}>Return to Sign In</span></div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;