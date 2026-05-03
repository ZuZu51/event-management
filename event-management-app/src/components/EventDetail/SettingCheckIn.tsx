import React, { useState, useRef, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { attendanceService } from '../../services/attendanceService';
import { showWarningToast, showSuccessToast, showErrorToast } from '../../common/helper/toastHelper';
import '../../styles/CreateEvent.css';

interface ReopenAttendanceModalProps {
  visible: boolean;
  eventId: number | null;
  eventName: string;
  onHide: () => void;
  onSuccess?: () => void;
}

interface CheckinSettings {
  enabled: boolean;
  checkinStart: string;
  checkinEnd: string;
  checkoutStart: string;
  checkoutEnd: string;
  reopenedCheckInUntil?: string;
  reopenedCheckOutUntil?: string;
}

interface ReopenModalState {
  isOpen: boolean;
  type: 'checkin' | 'checkout' | null;
  selectedTime: Date | null;
}

const ReopenAttendanceModal: React.FC<ReopenAttendanceModalProps> = ({
  visible,
  eventId,
  eventName,
  onHide,
  onSuccess,
}) => {
  const [settings, setSettings] = useState<CheckinSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [reopenModal, setReopenModal] = useState<ReopenModalState>({
    isOpen: false,
    type: null,
    selectedTime: null,
  });
  const toastRef = useRef<Toast | null>(null);

  useEffect(() => {
    if (visible && eventId) {
      loadSettings();
    } else {
      resetModal();
    }
  }, [visible, eventId]);

  const resetModal = () => {
    setSettings(null);
    setReopenModal({
      isOpen: false,
      type: null,
      selectedTime: null,
    });
  };

  const loadSettings = async () => {
    if (!eventId) return;

    try {
      setLoadingSettings(true);
      const settingsData = await attendanceService.
      getEventCheckinSettings(eventId);
      console.log('Loaded settings in component:', settingsData);
      if (settingsData) {
        setSettings(settingsData);
      }

      try {
        const flagResp = await attendanceService.getEventAttendance(eventId);
        if (flagResp && typeof flagResp.isAttendance === 'boolean') {
          setSettings(prev => ({ ...(prev || settingsData), enabled: flagResp.isAttendance }));
        }
      } catch (e) {
        console.warn('Unable to fetch isAttendance flag', e);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      showErrorToast(toastRef, 'Không thể tải cài đặt điểm danh');
    } finally {
      setLoadingSettings(false);
    }
  };

  // Check if attendance is not configured
  const isAttendanceNotConfigured = settings && (
    !settings.checkinStart || 
    !settings.checkinEnd || 
    !settings.checkoutStart || 
    !settings.checkoutEnd
  );

  const timeToDate = (timeStr?: string): Date => {
    if (!timeStr) return new Date();
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h || 0, m || 0, 0, 0);
    return d;
  };

  const dateToTime = (date: Date): string => {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const handleReopenClick = (type: 'checkin' | 'checkout') => {
    setReopenModal({
      isOpen: true,
      type,
      selectedTime: type === 'checkin' 
        ? (settings?.reopenedCheckInUntil ? timeToDate(settings.reopenedCheckInUntil) : null)
        : (settings?.reopenedCheckOutUntil ? timeToDate(settings.reopenedCheckOutUntil) : null),
    });
  };

  const handleSaveReopen = async () => {
    if (!reopenModal.selectedTime) {
      showWarningToast(toastRef, 'Vui lòng chọn thời gian deadline');
      return;
    }

    try {
      setLoading(true);
      const newTime = dateToTime(reopenModal.selectedTime);
      
      if (reopenModal.type === 'checkin') {
        if (newTime <= settings!.checkinEnd) {
          showWarningToast(toastRef, `Thời gian reopen phải sau thời gian kết thúc check-in (${settings!.checkinEnd})`);
          setLoading(false);
          return;
        }
      } else if (reopenModal.type === 'checkout') {
        if (newTime <= settings!.checkoutEnd) {
          showWarningToast(toastRef, `Thời gian reopen phải sau thời gian kết thúc check-out (${settings!.checkoutEnd})`);
          setLoading(false);
          return;
        }
      }
      
      const updatedSettings = { ...settings! };
      if (reopenModal.type === 'checkin') {
        updatedSettings.reopenedCheckInUntil = newTime;
      } else if (reopenModal.type === 'checkout') {
        updatedSettings.reopenedCheckOutUntil = newTime;
      }
      
      await attendanceService.updateEventCheckinSettings(eventId!, updatedSettings);
      
      setSettings(updatedSettings);
      showSuccessToast(toastRef, 'Đã cập nhật deadline mở lại!');
      setReopenModal({ isOpen: false, type: null, selectedTime: null });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch {
      showErrorToast(toastRef, 'Lỗi cập nhật deadline!');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseReopen = () => {
    setReopenModal({ isOpen: false, type: null, selectedTime: null });
  };

  const mainDialogFooter = (
    <Button
      label="Đóng"
      icon="pi pi-times"
      severity="secondary"
      onClick={onHide}
      disabled={reopenModal.isOpen}
    />
  );

  const reopenDialogFooter = (
    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
      <Button
        label="Hủy"
        icon="pi pi-times"
        severity="secondary"
        outlined
        onClick={handleCloseReopen}
        disabled={loading}
      />
      <Button
        label="Lưu deadline"
        icon="pi pi-check"
        severity={reopenModal.type === 'checkin' ? 'success' : 'info'}
        onClick={handleSaveReopen}
        loading={loading}
        disabled={!reopenModal.selectedTime}
      />
    </div>
  );

  return (
    <>
      <Dialog
        visible={visible}
        onHide={reopenModal.isOpen ? undefined : onHide}
        header={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <i className="pi pi-clock" style={{ fontSize: '1.5rem', color: '#667eea' }}></i>
            <span>⏰ Mở lại điểm danh</span>
          </div>
        }
        modal
        style={{ width: '800px' }}
        footer={mainDialogFooter}
        closable={!reopenModal.isOpen}
      >
        <Toast ref={toastRef} />
        
        {loadingSettings ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
            <p style={{ color: '#6b7280', marginTop: '1rem' }}>Đang tải cài đặt...</p>
          </div>
        ) : !settings ? (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            color: '#6b7280',
          }}>
            <i className="pi pi-exclamation-circle" style={{ fontSize: '3rem', marginBottom: '1rem', color: '#ef4444' }}></i>
            <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Không tìm thấy cài đặt điểm danh</p>
            <p style={{ fontSize: '0.9rem' }}>Vui lòng kiểm tra lại sự kiện này</p>
          </div>
        ) : isAttendanceNotConfigured ? (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
          }}>
            <div style={{
              padding: '2rem',
              background: '#fef3c7',
              border: '2px solid #fbbf24',
              borderRadius: '0.75rem',
              marginBottom: '1.5rem',
            }}>
              <i className="pi pi-info-circle" style={{ 
                fontSize: '4rem', 
                color: '#f59e0b',
                marginBottom: '1rem',
                display: 'block',
              }}></i>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 600, 
                color: '#92400e',
                marginBottom: '0.75rem',
              }}>
                Sự kiện chưa cấu hình điểm danh tự động
              </h3>
              <p style={{ 
                fontSize: '1rem', 
                color: '#78350f',
                marginBottom: '1rem',
                lineHeight: '1.6',
              }}>
                Sự kiện <strong>"{eventName}"</strong> không có cài đặt thời gian check-in/check-out tự động.
              </p>
              <div style={{
                padding: '1rem',
                background: 'white',
                borderRadius: '0.5rem',
                border: '1px solid #fcd34d',
                marginTop: '1rem',
              }}>
                <p style={{ 
                  fontSize: '0.9rem', 
                  color: '#92400e',
                  margin: 0,
                  lineHeight: '1.5',
                }}>
                  💡 <strong>Gợi ý:</strong> Để sử dụng chức năng mở lại điểm danh, vui lòng cấu hình thời gian điểm danh tự động cho sự kiện này trong phần "Tạo sự kiện" hoặc "Chỉnh sửa sự kiện".
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="create-event-modal event-form">
            {/* Event Info */}
            <div style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '0.75rem',
              marginBottom: '1.5rem',
              color: 'white',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}>
              <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                Sự kiện
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {eventName}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }}>
                📋 Cài đặt thời gian
              </h3>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
                Cấu hình khung giờ check-in và check-out cho sự kiện
              </p>
            </div>

            {/* Check-in Section */}
            <div className="modal-section" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '0.5rem',
                  background: '#22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.25rem',
                }}>
                  📍
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#166534' }}>
                    Check-in
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#15803d' }}>
                    Thời gian sinh viên điểm danh vào
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
                padding: '1rem',
                background: 'white',
                borderRadius: '0.5rem',
                border: '1px solid #bbf7d0',
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#166534', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Bắt đầu
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#15803d' }}>
                    {settings.checkinStart}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#166534', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Kết thúc
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#15803d' }}>
                    {settings.checkinEnd}
                  </div>
                </div>
              </div>

              {settings.reopenedCheckInUntil && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem 1rem',
                  background: '#dcfce7',
                  borderRadius: '0.5rem',
                  border: '1px solid #bbf7d0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <i className="pi pi-check-circle" style={{ color: '#16a34a' }}></i>
                  <span style={{ color: '#166534', fontSize: '0.9rem', fontWeight: 500 }}>
                    Đã mở lại đến: <strong>{settings.reopenedCheckInUntil}</strong>
                  </span>
                </div>
              )}

              <Button
                label={settings.reopenedCheckInUntil ? 'Điều chỉnh thời gian mở lại' : 'Mở lại Check-in'}
                icon="pi pi-refresh"
                severity="success"
                outlined
                onClick={() => handleReopenClick('checkin')}
                style={{ width: '100%', marginTop: '0.75rem' }}
              />
            </div>

            {/* Check-out Section */}
            <div className="modal-section" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '0.5rem',
                  background: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.25rem',
                }}>
                  📤
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#1e40af' }}>
                    Check-out
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#1d4ed8' }}>
                    Thời gian sinh viên điểm danh ra
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
                padding: '1rem',
                background: 'white',
                borderRadius: '0.5rem',
                border: '1px solid #bfdbfe',
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#1e40af', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Bắt đầu
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1d4ed8' }}>
                    {settings.checkoutStart}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#1e40af', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Kết thúc
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1d4ed8' }}>
                    {settings.checkoutEnd}
                  </div>
                </div>
              </div>

              {settings.reopenedCheckOutUntil && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem 1rem',
                  background: '#dbeafe',
                  borderRadius: '0.5rem',
                  border: '1px solid #bfdbfe',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <i className="pi pi-check-circle" style={{ color: '#2563eb' }}></i>
                  <span style={{ color: '#1e40af', fontSize: '0.9rem', fontWeight: 500 }}>
                    Đã mở lại đến: <strong>{settings.reopenedCheckOutUntil}</strong>
                  </span>
                </div>
              )}

              <Button
                label={settings.reopenedCheckOutUntil ? 'Điều chỉnh thời gian mở lại' : 'Mở lại Check-out'}
                icon="pi pi-refresh"
                severity="info"
                outlined
                onClick={() => handleReopenClick('checkout')}
                style={{ width: '100%', marginTop: '0.75rem' }}
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* Nested Reopen Time Selection Dialog */}
      <Dialog
        visible={reopenModal.isOpen}
        onHide={handleCloseReopen}
        header={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <i className={`pi ${reopenModal.type === 'checkin' ? 'pi-sign-in' : 'pi-sign-out'}`} 
               style={{ fontSize: '1.5rem', color: reopenModal.type === 'checkin' ? '#22c55e' : '#3b82f6' }}></i>
            <span>{reopenModal.type === 'checkin' ? 'Mở lại Check-in' : 'Mở lại Check-out'}</span>
          </div>
        }
        modal
        style={{ width: '500px' }}
        footer={reopenDialogFooter}
      >
        <div style={{ padding: '1rem 0' }}>
          <div style={{
            padding: '1rem',
            background: reopenModal.type === 'checkin' ? '#f0fdf4' : '#eff6ff',
            border: `1px solid ${reopenModal.type === 'checkin' ? '#bbf7d0' : '#bfdbfe'}`,
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
          }}>
            <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              Thời gian {reopenModal.type === 'checkin' ? 'check-in' : 'check-out'} hiện tại:
            </div>
            <div style={{ 
              fontSize: '1.25rem', 
              fontWeight: 700, 
              color: reopenModal.type === 'checkin' ? '#15803d' : '#1d4ed8' 
            }}>
              {reopenModal.type === 'checkin' 
                ? `${settings?.checkinStart} - ${settings?.checkinEnd}`
                : `${settings?.checkoutStart} - ${settings?.checkoutEnd}`
              }
            </div>
          </div>

          <div className="p-field">
            <label className="modal-field-label">
              Chọn deadline mở lại *
            </label>
            <Calendar
              value={reopenModal.selectedTime}
              onChange={(e) => setReopenModal(prev => ({ ...prev, selectedTime: e.value as Date }))}
              timeOnly
              hourFormat="24"
              showIcon
              style={{ width: '100%' }}
              placeholder="Chọn giờ deadline"
            />
            <small style={{ color: '#6b7280', display: 'block', marginTop: '0.5rem' }}>
              Sinh viên có thể {reopenModal.type === 'checkin' ? 'check-in' : 'check-out'} đến thời gian này
            </small>
          </div>

          {reopenModal.selectedTime && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#fef9e7',
              borderRadius: '0.5rem',
              border: '1px solid #fcd34d',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="pi pi-clock" style={{ color: '#92400e', fontSize: '1.25rem' }}></i>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#78350f', marginBottom: '0.25rem' }}>
                    Deadline đã chọn:
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#92400e' }}>
                    {dateToTime(reopenModal.selectedTime)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
};

export default ReopenAttendanceModal;