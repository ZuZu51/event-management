import { useState } from "react";

function GoogleLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔹 Hàm login bằng Google
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
          textAlign: "center",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
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
            Đăng nhập tài khoản của bạn
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


        {/* Google Login Button */}
        <button
          onClick={handleLoginWithGoogle}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px 20px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "15px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            opacity: loading ? 0.7 : 1,
            boxShadow: "0 8px 20px rgba(102, 126, 234, 0.3)",
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 12px 28px rgba(102, 126, 234, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(102, 126, 234, 0.3)";
            }
          }}
        >
          <span style={{ fontSize: "20px" }}>🔍</span>
          {loading ? "Đang đăng nhập..." : "Đăng nhập với Google"}
        </button>

      </div>
    </div>
  );
}

export default GoogleLogin;
