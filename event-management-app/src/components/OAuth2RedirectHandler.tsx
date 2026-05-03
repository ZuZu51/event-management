import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { localStorageHelper } from "../common/helper/localStorageHelper";
import { AuthService } from "../services/AuthService";

export default function OAuth2RedirectHandler() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleOAuth2Callback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get("accessToken");
        const refreshToken = params.get("refreshToken");
        const email = params.get("email");
        const name = params.get("name");
        const avatar = params.get("avatar");
        const role = params.get("role");
        const faculty = params.get("faculty");
        const id = params.get("idUser");

        if (accessToken && email) {
          // Kiểm tra tài khoản tồn tại hay không
          try {
            const accountCheckResponse = await AuthService.checkAccount(email);

            if (accountCheckResponse.exists) {
              // Tài khoản đã tồn tại - lưu token và đăng nhập
              localStorageHelper.setItem("token", { token: accessToken || "" });
              localStorageHelper.setItem("refreshToken", refreshToken || "");
              localStorageHelper.setItem("email", email || "");
              localStorageHelper.setItem("name", name || "");
              localStorageHelper.setItem("avatar", avatar || "");
              localStorageHelper.setItem("role", role || "");
              localStorageHelper.setItem("faculty", faculty || "");
              localStorageHelper.setItem("idUser", id || "");

              // Redirect to home
              navigate("/home");
            } else {
              // Tài khoản chưa tồn tại - chuyển sang form hoàn thành signup
              navigate("/complete-signup", {
                state: { email: email, googleToken: accessToken },
              });
            }
          } catch (checkError) {
            console.error("Error checking account:", checkError);
            // Nếu lỗi khi check account, cũng cho phép signup
            navigate("/complete-signup", {
              state: { email: email, googleToken: accessToken },
            });
          }
        } else {
          // Không có accessToken hoặc email - redirect về login
          navigate("/login");
        }
      } catch (error) {
        console.error("OAuth2 redirect error:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    handleOAuth2Callback();
  }, [navigate]);

  return <p>Đang xử lý đăng nhập...</p>;
}
