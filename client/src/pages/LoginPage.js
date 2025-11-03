import { useState } from "react";
import config from "../config";
import HybridGoogleLogin from "../components/HybridGoogleLogin";
import "../App.css";
import "../components/GoogleLogin.css";

export default function LoginPage({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await fetch(`${config.API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (data.token) {
        localStorage.setItem("token", data.token);
        // Use user object from response or decode JWT token
        if (data.user) {
          setUser(data.user);
        } else {
          try {
            const payload = JSON.parse(atob(data.token.split('.')[1]));
            setUser(payload);
          } catch (error) {
            console.error('Error decoding token:', error);
          }
        }
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Server Error ❌");
    }
  };

  const handleGoogleSuccess = async (userData) => {
    try {
      console.log('🔍 Processing Google login:', userData.email);
      
      // Send Google user data to our backend
      const res = await fetch(`${config.API_BASE_URL}/auth/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userData.email,
          name: userData.name,
          picture: userData.picture,
          googleId: userData.googleId,
          role: userData.role || 'customer'
        }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Google login HTTP error:', res.status, errorText);
        throw new Error(`Login failed: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.token) {
        localStorage.setItem("token", data.token);
        // Use user object from response or decode JWT token
        if (data.user) {
          setUser(data.user);
        } else {
          try {
            const payload = JSON.parse(atob(data.token.split('.')[1]));
            setUser(payload);
          } catch (error) {
            console.error('Error decoding token:', error);
          }
        }
        console.log('✅ Google login successful!');
      } else {
        alert(data.message || 'Google login failed');
      }
    } catch (err) {
      console.error("Google login error:", err);
      alert("Google Login Error ❌");
    }
  };

  const handleGoogleError = (error) => {
    console.error('Google login error:', error);
    alert('Google login failed. Please try again.');
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

            <div className="login-divider">
              <span>or</span>
            </div>

            <div className="social-login-section">
              <div className="social-login-title">Continue with Google</div>
              <HybridGoogleLogin 
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
              />
            </div>
            
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
