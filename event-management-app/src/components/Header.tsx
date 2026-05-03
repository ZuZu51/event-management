import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { localStorageHelper } from "../common/helper/localStorageHelper";

function Header() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [name, setName] = useState<string>(localStorageHelper.getItem("name") || "Người dùng");
  const [avatar, setAvatar] = useState<string | null>(localStorageHelper.getItem("avatar"));
  const [role, setRole] = useState<string | null>(localStorageHelper.getItem("role"));

  // Listen for changes in localStorage (from Profile component)
  useEffect(() => {
    const handleStorageChange = () => {
      const newName = localStorageHelper.getItem("name");
      const newAvatar = localStorageHelper.getItem("avatar");
      const newRole = localStorageHelper.getItem("role");
      
      if (newName) setName(newName);
      if (newAvatar) setAvatar(newAvatar);
      if (newRole) setRole(newRole);
    };

    // Listen for custom event from Profile component (same tab)
    window.addEventListener("userProfileUpdated", handleStorageChange);
    
    // Listen for storage changes from other tabs/windows
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("userProfileUpdated", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    localStorageHelper.removeItem("token");
    localStorageHelper.removeItem("refreshToken");
    localStorageHelper.removeItem("email");
    localStorageHelper.removeItem("name");
    localStorageHelper.removeItem("avatar");
    localStorageHelper.removeItem("role");
    localStorageHelper.removeItem("faculty");
    localStorageHelper.removeItem("idUser");
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header-left" onClick={() => navigate("/home")}>
        <h2 className="logo">Event Management</h2>
      </div>

      

      <div className="header-right">
        <div className="user-menu" onClick={() => setMenuOpen((prev) => !prev)}>
          <img
            src={
              avatar ||
              "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
            }
            alt="avatar"
            className="avatar"
          />
          <span className="user-name">{name}</span>

          {menuOpen && (
            <div className="dropdown">
              {/* Chỉ hiển thị "Hồ sơ" nếu KHÔNG phải ADMIN hoặc TEACHER */}
              

              <div className="dropdown-divider"></div>
              <button className="dropdown-item logout" onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
