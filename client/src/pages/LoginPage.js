import { useState } from "react";
import "../App.css";

export default function LoginPage({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("token", data.token);
        setUser(data);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Server Error ❌");
    }
  };

  return (
    <div className="login-page">
      {/* Left Side - Branding */}
      <div className="login-branding">
        <div className="branding-content">
          <div className="brand-logo">
            <span className="logo-icon">🍽️</span>
          </div>
          <h1 className="brand-title">DineConnect</h1>
          <p className="brand-subtitle">Connecting Diners with Great Food</p>
          <div className="brand-description">
            <p>Experience the future of dining with our innovative QR-based restaurant management system.</p>
          </div>
          <div className="brand-features">
            <div className="feature-item">
              <span className="feature-icon">📱</span>
              <span className="feature-text">Scan QR Menu</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⭐</span>
              <span className="feature-text">Rate & Review</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">❤️</span>
              <span className="feature-text">Save Favorites</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🍽️</span>
              <span className="feature-text">Digital Ordering</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-form-section">
        <div className="login-container">
          <div className="login-header">
            <h2>Welcome Back!</h2>
            <p>Sign in to your DineConnect account</p>
          </div>
          
          <div className="login-form">
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
              />
            </div>
            
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
              />
            </div>
            
            <button onClick={handleLogin} className="login-btn">
              Sign In
            </button>
            
            <div className="login-footer">
              <p>Don't have an account?</p>
              <a href="/register" className="register-link">
                Create Account
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
