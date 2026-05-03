import React, { useState, useEffect, useRef } from 'react';
import { Toast } from 'primereact/toast';
import { attendanceService } from '../../services/attendanceService';
import './checkinSettingsTab.css';

interface CheckinSettingsTabProps {
  eventId: number;
}

interface CheckinSettings {
  enabled: boolean;
  checkinStart: string;
  checkinEnd: string;
  checkoutStart: string;
  checkoutEnd: string;
}

export const CheckinSettingsTab: React.FC<CheckinSettingsTabProps> = ({ eventId }) => {
  const [settings, setSettings] = useState<CheckinSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const toastRef = useRef<Toast | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    // Prevent reload if already loaded for this eventId
    if (loadedRef.current) return;
    
    loadSettings();
  }, [eventId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await attendanceService.getEventCheckinSettings(eventId);
      if (data) setSettings(data);

      try {
        const flagResp = await attendanceService.getEventAttendance(eventId);
        if (flagResp && typeof flagResp.isAttendance === 'boolean') {
          setSettings(prev => ({ ...(prev || data), enabled: flagResp.isAttendance }));
        }
      } catch (e) {
        console.warn('Unable to fetch isAttendance flag', e);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      setSettings({
        enabled: true,
        checkinStart: '08:00',
        checkinEnd: '09:00',
        checkoutStart: '17:00',
        checkoutEnd: '18:00'
      });
    } finally {
      setLoading(false);
      loadedRef.current = true;
    }
  };

  // Show loading only if truly loading and no cached data
  const showLoading = loading && !settings;

  return (
    <div className='content-card'>
      <Toast ref={toastRef} />
      
      <div className="checkin-container">
        {/* Header Section - Always visible */}
        <div className="section-header">
          <h2>
            Thời gian điểm danh
          </h2>
        </div>

        {/* Loading State */}
        {showLoading ? (
          <div className="loading-state">
            <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
            <p>Đang tải cài đặt điểm danh...</p>
          </div>
        ) : settings?.enabled ? (
          /* Main Content */
          <div className="checkin-content">
            {/* Check-in Card */}
            <div className="time-card checkin-card">
              <div className="card-header">
                <div className="card-icon">📍</div>
                <div className="card-title">
                  <h3>Check-in</h3>
                  <span>Điểm danh vào</span>
                </div>
              </div>

              <div className="card-body">
                <div className="time-row">
                  <div className="time-block">
                    <div className="time-label">
                      <i className="pi pi-clock"></i>
                      <span>Bắt đầu</span>
                    </div>
                    <div className="time-value">{settings.checkinStart}</div>
                  </div>

                  <div className="time-arrow">
                    <i className="pi pi-arrow-right"></i>
                  </div>

                  <div className="time-block">
                    <div className="time-label">
                      <i className="pi pi-clock"></i>
                      <span>Kết thúc</span>
                    </div>
                    <div className="time-value">{settings.checkinEnd}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Check-out Card */}
            <div className="time-card checkout-card">
              <div className="card-header">
                <div className="card-icon">📤</div>
                <div className="card-title">
                  <h3>Check-out</h3>
                  <span>Điểm danh ra</span>
                </div>
              </div>

              <div className="card-body">
                <div className="time-row">
                  <div className="time-block">
                    <div className="time-label">
                      <i className="pi pi-clock"></i>
                      <span>Bắt đầu</span>
                    </div>
                    <div className="time-value">{settings.checkoutStart}</div>
                  </div>

                  <div className="time-arrow">
                    <i className="pi pi-arrow-right"></i>
                  </div>

                  <div className="time-block">
                    <div className="time-label">
                      <i className="pi pi-clock"></i>
                      <span>Kết thúc</span>
                    </div>
                    <div className="time-value">{settings.checkoutEnd}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Disabled State */
          <div className="disabled-state">
            <div className="disabled-icon">⚠️</div>
            <h3>Điểm danh chưa được kích hoạt</h3>
            <p>Vui lòng kích hoạt tính năng điểm danh trong cài đặt sự kiện</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckinSettingsTab;