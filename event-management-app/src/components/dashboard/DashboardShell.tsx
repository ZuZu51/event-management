
import { Outlet, Link, useLocation } from "react-router-dom";
import Header from "../Header";

import { localStorageHelper } from "../../common/helper/localStorageHelper";

import "./dashboard.css";

const DashboardShell: React.FC = () => {
  const location = useLocation();
  const hideHeader = location.pathname === "/login" || location.pathname.startsWith("/oauth2");
  const role = localStorageHelper.getItem("role");
  



  return (
    <div className="dashboard-shell">
      {!hideHeader && <Header />}

      <div className="app-container">
   

        <div className="main" style={{ marginTop: 8 }}>
          <aside className="sidebar card">
            <nav>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                { role !== "ADMIN" &&
                <>
                <li style={{ padding: 8, fontWeight: 600 }}>
                  <Link to="/home">Trang chủ</Link>
                </li>
                
                <li style={{ padding: 8 }}>
                  <Link to="/events">Sự kiện</Link>
                </li>
                <li style={{ padding: 8 }}>
                  <Link to="/invitations">Lời mời tham gia</Link>
                </li>
                <li style={{ padding: 8 }}>
                  <Link to="/account">Hồ sơ</Link>
                </li>
                <li style={{ padding: 8 }}>
                  <Link to="/history">Lịch sử</Link>
                </li>
                </>
}
                {role === "ADMIN" && (
                  <>
                    <li style={{ padding: 8, fontWeight: 600, marginTop: 12, borderTop: "1px solid #ddd", paddingTop: 12 }}>
                      Management
                    </li>
                    <li style={{ padding: 8 }}>
                      <Link to="/admin/users">Quản lý người dùng</Link>
                    </li>
                    
                    <li style={{ padding: 8 }}>
                      <Link to="/admin/tag">Quản lý danh mục</Link>
                    </li>

                    <li style={{ padding: 8 }}>
                      <Link to="/admin/events">Quản lý sự kiện</Link>
                    </li>
                 
                    <li style={{ padding: 8, fontWeight: 600, marginTop: 12, borderTop: "1px solid #ddd", paddingTop: 12 }}>
                      Event
                    </li>
                    <li style={{ padding: 8 }}>
                      <Link to="/create-new-event">Tạo sự kiện mới</Link>
                    </li>
                    
                  </>
                )}

                {role === "TEACHER" && (
                  <>
                    <li style={{ padding: 8, fontWeight: 600, marginTop: 12, borderTop: "1px solid #ddd", paddingTop: 12 }}>
                      Management
                    </li>
                    <li style={{ padding: 8 }}>
                      <Link to="/teacher/events?filter=mine">Quản lý sự kiện của tôi</Link>
                    </li>
                    <li style={{ padding: 8, fontWeight: 600, marginTop: 12, borderTop: "1px solid #ddd", paddingTop: 12 }}>
                      Event
                    </li>
                    <li style={{ padding: 8 }}>
                      <Link to="/create-new-event">Tạo sự kiện mới</Link>
                    </li>
                    
                    
                    
                  </>
                )}
              </ul>
            </nav>
          </aside>

          <main className="content">
            <div className="card">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardShell;
