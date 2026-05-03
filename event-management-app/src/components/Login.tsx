import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../services/AuthService";
import { localStorageHelper } from "../common/helper/localStorageHelper";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu!");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await AuthService.login(email, password);
      setToken(res.token);
      localStorageHelper.setItem("token", { token: res.token });
      localStorageHelper.setItem("role", "ADMIN");
      
      // Store userId from response
      if (res.userId) {
        localStorage.setItem("idUser", String(res.userId));
        console.log('✅ Stored userId:', res.userId);
      }
      
      localStorage.removeItem("avatar");
      localStorage.removeItem("name");
      localStorage.removeItem("email");
      localStorage.removeItem("faculty");
      localStorage.removeItem("refreshToken");
      navigate("/home");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Login failed:", error);
      setError("Đăng nhập thất bại! Vui lòng kiểm tra email và mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Hàm login bằng Google - Check account tồn tại hay không
  const handleLoginWithGoogle = async () => {
    try {
      setLoading(true);
      setError("");

      // Redirect tới OAuth2 server với callback
      // Backend sẽ xử lý và redirect lại
      window.location.href = "http://localhost:8080/api/oauth2/authorization/google";
    } catch (err: any) {
      console.error("Google login error:", err);
      setError("Lỗi khi đăng nhập với Google");
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleLogin();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto",
      }}
    >
      {/* Background animated elements */}
      <div
        style={{
          position: "fixed",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-50%",
            right: "-10%",
            width: "500px",
            height: "500px",
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "50%",
            animation: "float 6s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            left: "-5%",
            width: "400px",
            height: "400px",
            background: "rgba(255, 255, 255, 0.08)",
            borderRadius: "50%",
            animation: "float 8s ease-in-out infinite reverse",
          }}
        />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(30px); }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>

      {/* Login Card */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          background: "white",
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(102, 126, 234, 0.4)",
          width: "100%",
          maxWidth: "420px",
          padding: "40px 32px",
          animation: "slideUp 0.6s ease-out",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "32px", textAlign: "center" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 700,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              margin: "0 0 8px 0",
            }}
          >
            Quản lý Sự kiện
          </h1>
          <p
            style={{
              color: "#6b7a82",
              fontSize: "14px",
              margin: "0",
            }}
          >
            Vui lòng đăng nhập để tiếp tục
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              background: "#fee",
              border: "1px solid #fcc",
              color: "#c33",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "14px",
              animation: "slideUp 0.3s ease-out",
            }}
          >
            {error}
          </div>
        )}

        {/* Email Input */}
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 500,
              color: "#12323b",
              marginBottom: "8px",
            }}
          >
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập email của bạn"
            style={{
              width: "100%",
              padding: "12px 14px",
              border: "2px solid #e6eefc",
              borderRadius: "8px",
              fontSize: "14px",
              fontFamily: "inherit",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxSizing: "border-box",
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#667eea";
              e.currentTarget.style.boxShadow =
                "0 0 0 3px rgba(102, 126, 234, 0.1), 0 0 12px rgba(102, 126, 234, 0.3)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#e6eefc";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Password Input */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 500,
              color: "#12323b",
              marginBottom: "8px",
            }}
          >
            Mật khẩu
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập mật khẩu"
            style={{
              width: "100%",
              padding: "12px 14px",
              border: "2px solid #e6eefc",
              borderRadius: "8px",
              fontSize: "14px",
              fontFamily: "inherit",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxSizing: "border-box",
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#667eea";
              e.currentTarget.style.boxShadow =
                "0 0 0 3px rgba(102, 126, 234, 0.1), 0 0 12px rgba(102, 126, 234, 0.3)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#e6eefc";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>



        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 16px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "15px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            marginBottom: "12px",
            opacity: loading ? 0.7 : 1,
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 8px 20px rgba(102, 126, 234, 0.3)",
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 12px 24px rgba(102, 126, 234, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(102, 126, 234, 0.3)";
            }
          }}
        >
          {loading ? (
            <span style={{ opacity: 0.7 }}>Đang đăng nhập...</span>
          ) : (
            "Đăng nhập"
          )}
        </button>

        {/* Google Login Button */}
        <button
          onClick={handleLoginWithGoogle}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 16px",
            background: "white",
            color: "#12323b",
            border: "2px solid #e6eefc",
            borderRadius: "8px",
            fontSize: "15px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            opacity: loading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.borderColor = "#667eea";
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05))";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.borderColor = "#e6eefc";
              e.currentTarget.style.background = "white";
            }
          }}
        >
          <span style={{ fontSize: "18px" }}>🔍</span>
          Đăng nhập với Google
        </button>

        {/* Token Display (optional) */}
        {token && (
          <div
            style={{
              marginTop: "20px",
              padding: "12px",
              background: "#f0f6ff",
              borderRadius: "8px",
              borderLeft: "3px solid #667eea",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                color: "#6b7a82",
                margin: "0 0 6px 0",
                fontWeight: 500,
              }}
            >
              ✅ Token:
            </p>
            <code
              style={{
                fontSize: "11px",
                color: "#667eea",
                wordBreak: "break-all",
                display: "block",
              }}
            >
              {token.substring(0, 50)}...
            </code>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
