import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import './LockedAccount.css';

export const LockedAccount: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="locked-account-container">
      <div className="locked-account-card">
        <div className="locked-icon">🔒</div>
        
        <h1 className="locked-title">Tài khoản của bạn đã bị khóa</h1>
        
        <p className="locked-description">
          Tài khoản của bạn hiện không thể sử dụng. 
          Vui lòng liên hệ với quản trị viên để được hỗ trợ.
        </p>

        <div className="locked-info">
          <p>
            <strong>Liên hệ Admin:</strong>
            <br />
            Email: <a href="mailto:admin@event-management.com">admin@event-management.com</a>
          </p>
        </div>

        <Button 
          label="Đăng xuất" 
          icon="pi pi-sign-out" 
          onClick={handleLogout}
          className="locked-logout-btn"
          severity="secondary"
        />
      </div>
    </div>
  );
};

export default LockedAccount;
