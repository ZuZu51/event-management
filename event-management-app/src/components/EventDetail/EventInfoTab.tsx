import React, { useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { createTicket, getTicketsByUser, getTicketsByEvent } from '../../services/TicketService';
import { cancelTicketRegistration } from '../../services/TicketCancelService';
import { localStorageHelper } from '../../common/helper/localStorageHelper';
import { formatDateToDDMMYYYY } from '../../common/helper/dateHelper';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import type { EventStats, UserEventDTO } from '../../types/Event';
import EditEventModal from './EditEvent';
import './EventInfoTab.css';


interface EventInfoTabProps {
  eventData: EventStats;
  onUpdate: () => void;
  isHidden?: boolean;
  getEventStats?: () => Promise<void>;
}

// Hàm kiểm tra xung đột thời gian giữa hai sự kiện
const hasTimeConflict = (event1: EventStats | UserEventDTO, event2: EventStats | UserEventDTO): boolean => {
  try {
    
    // Lấy thời gian bắt đầu và kết thúc cho event1
    const date1Str = event1.date;
    let time1Str = 'startTime' in event1 ? event1.startTime : "00:00";
    // Cắt bỏ milliseconds nếu có (e.g. "02:28:00.000000" -> "02:28:00")
    time1Str = time1Str.split('.')[0];
    const duration1 = 'durationMinutes' in event1 ? event1.durationMinutes : 0;
    
    const start1 = new Date(`${date1Str}T${time1Str}`);
    const end1 = new Date(start1.getTime() + duration1 * 60000);

    // Lấy thời gian bắt đầu và kết thúc cho event2
    const date2Str = event2.date;
    let time2Str = 'startTime' in event2 ? event2.startTime : "00:00";
    // Cắt bỏ milliseconds nếu có
    time2Str = time2Str.split('.')[0];
    const duration2 = 'durationMinutes' in event2 ? event2.durationMinutes : 0;
    
    const start2 = new Date(`${date2Str}T${time2Str}`);
    const end2 = new Date(start2.getTime() + duration2 * 60000);

    // Kiểm tra xung đột: (start2 < end1) AND (end2 > start1)
    return start2.getTime() < end1.getTime() && end2.getTime() > start1.getTime();
  } catch (error) {
    console.error("Error checking time conflict:", error);
    return false;
  }
};

interface EventWithDuration extends UserEventDTO {
  durationMinutes: number;
}

export const EventInfoTab: React.FC<EventInfoTabProps> = ({ eventData, onUpdate, isHidden = false, getEventStats }) => {
  const [showModal, setShowModal] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelingTicket, setCancelingTicket] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editEventId, setEditEventId] = useState<number | null>(null);
  const toast = useRef<Toast | null>(null);
  const [hasTicket, setHasTicket] = useState(false);
  const [registeredCount, setRegisteredCount] = useState(0);

  // check existing tickets / purchase flag when eventData changes
  React.useEffect(() => {
    const checkRegistration = async () => {
      try {
        const userIdStr = localStorageHelper.getItem('idUser');
        if (!userIdStr) {
          setHasTicket(false);
          return;
        }

        // if we have a purchase flag (returned from payment redirect), treat as registered
        const purchaseFlag = localStorageHelper.getItem(`purchased_event_${eventData.eventId}`);
        if (purchaseFlag) {
          setHasTicket(true);
          localStorageHelper.removeItem(`purchased_event_${eventData.eventId}`);
          return;
        }

        const tickets = await getTicketsByUser(Number(userIdStr));
        const found = Array.isArray(tickets) && tickets.some((t: { event?: { id?: number } }) => t.event && Number(t.event.id) === Number(eventData.eventId));
        setHasTicket(Boolean(found));
      } catch (err) {
        console.error('Error checking registration:', err);
        setHasTicket(false);
      }
    };

    const fetchRegisteredCount = async () => {
      try {
        const tickets = await getTicketsByEvent(eventData.eventId);
        setRegisteredCount(Array.isArray(tickets) ? tickets.length : 0);
      } catch (err) {
        console.error('Error fetching registered count:', err);
        setRegisteredCount(0);
      }
    };

    checkRegistration();
    fetchRegisteredCount();
  }, [eventData.eventId]);

  const handleRegister = async () => {
    try {
      setRegistering(true);
      const userIdStr = localStorageHelper.getItem('idUser');
      if (!userIdStr) {
        toast.current?.show({ severity: 'error', summary: 'Đăng ký', detail: 'Vui lòng đăng nhập trước!', life: 4000 });
        return;
      }

      // Check time conflict
      const userEvents = [] as EventWithDuration[]; // Get from somewhere if needed
      const conflictExists = userEvents.some((e) => hasTimeConflict(e, eventData));
      if (conflictExists) {
        setShowConflictModal(true);
        setShowModal(false);
        return;
      }

      // Create ticket
      const response = await createTicket({
        eventId: eventData.eventId,
        userId: Number(userIdStr),
      });

      const responseObj = response as unknown as { data?: { checkoutUrl?: string } } | undefined;
      if (responseObj?.data?.checkoutUrl) {
        window.location.href = responseObj.data.checkoutUrl;
        return;
      }

      setHasTicket(true);
      setShowModal(false);
      toast.current?.show({ severity: 'success', summary: 'Đăng ký', detail: 'Đăng ký tham gia thành công!', life: 3000 });
      onUpdate();
    } catch (error: unknown) {
      const errMsg = getErrorMessage(error);
      if (errMsg.includes('conflict')) {
        setShowConflictModal(true);
      } else if (errMsg.includes('already registered')) {
        setHasTicket(true);
        toast.current?.show({ severity: 'warn', summary: 'Đăng ký', detail: 'Bạn đã đăng ký sự kiện này rồi!', life: 4000 });
      } else {
        toast.current?.show({ severity: 'error', summary: 'Đăng ký', detail: errMsg || 'Đăng ký thất bại!', life: 5000 });
      }
    } finally {
      setRegistering(false);
    }
  };

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    const errorObj = error as unknown as { response?: { data?: { message?: string } } } | null;
    return errorObj?.response?.data?.message || String(error);
  };

  const handleCancelTicket = async () => {
    try {
      setCancelingTicket(true);
      const userIdStr = localStorageHelper.getItem('idUser');
      if (!userIdStr) {
        toast.current?.show({ severity: 'error', summary: 'Hủy vé', detail: 'Vui lòng đăng nhập trước!', life: 4000 });
        return;
      }

      await cancelTicketRegistration(Number(userIdStr), eventData.eventId);
      setHasTicket(false);
      setShowCancelModal(false);
      toast.current?.show({ severity: 'success', summary: 'Hủy vé', detail: 'Đã hủy vé thành công!', life: 3000 });
      onUpdate();
    } catch (error: unknown) {
      const errMsg = getErrorMessage(error);
      if (errMsg.includes('not found')) {
        toast.current?.show({ 
          severity: 'error', 
          summary: 'Hủy vé', 
          detail: 'Không tìm thấy vé của bạn', 
          life: 4000 
        });
      } else {
        toast.current?.show({ 
          severity: 'error', 
          summary: 'Hủy vé', 
          detail: errMsg || 'Hủy vé thất bại. Vui lòng thử lại.', 
          life: 5000 
        });
      }
    } finally {
      setCancelingTicket(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return formatDateToDDMMYYYY(dateStr);
  };

  const handleEditEvent = () => {
    setEditEventId(eventData.eventId);
    setEditModalVisible(true);
  };

  const handleEditSuccess = async () => {
    setEditModalVisible(false);
    if (getEventStats) {
      await getEventStats();
    }
    onUpdate();
    toast.current?.show({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Cập nhật sự kiện thành công!',
      life: 3000,
    });
  };

  const renderCheckInType = (type) => {
  switch (type) {
    case "AUTO":
      return <span className="badge-auto">Điểm danh tự động</span>;
    case "QR_SCAN":
      return <span className="badge-qr-scan">Quét QR</span>;
    case "BOTH":
      return <span className="badge-both">Điểm danh tự động và Quét mã QR</span>;
    case "NONE":
      return <span className="badge-none">Không điểm danh</span>;
    default:
      return <span className="badge-secondary">{type || "-"}</span>;
  }
};
  return (
    <div className="event-info-tab-container">
      <Toast ref={toast} />

      {/* Header with ticket buttons and edit button */}
      <div className="event-header">
        <h1 className="event-title">{eventData.eventName}</h1>
        <div className="header-actions">
          {(() => {
            const role = localStorageHelper.getItem('role');
            const isAdmin = role && String(role).toUpperCase().includes('ADMIN');
            const currentUser = localStorageHelper.getItem<string>('idUser');
            const createdUser = eventData.createdById ? String(eventData.createdById) : null;
            const isOwner = currentUser === createdUser;

            // Show edit button for admin or owner
            if (isAdmin || isOwner) {
              return (
                <Button
                  label="Chỉnh sửa sự kiện"
                  icon="pi pi-pencil"
                  severity="info"
                  onClick={handleEditEvent}
                />
              );
            }

            if (!(role === 'STUDENT' || role === 'ADMIN' || role === 'TEACHER') || eventData.active !== 1) return null;

            if (hasTicket) {
              return (
                <>
                  <div className="registered-badge">✅ Đã đăng ký</div>
                  <Button
                    label="Hủy đăng ký"
                    icon="pi pi-trash"
                    className="p-button-danger p-button-outlined"
                    onClick={() => setShowCancelModal(true)}
                  />
                </>
              );
            }

            return (
              isHidden && (
                <Button
                  label="Đăng ký tham gia"
                  icon="pi pi-user-plus"
                  className="p-button-success"
                  onClick={() => setShowModal(true)}
                />
              )
            );
          })()}
        </div>
      </div>

      {/* Image Section */}
      <div className="event-image-section">
        {eventData.imagePath ? (
          <img src={eventData.imagePath} alt={eventData.eventName} className="event-image" />
        ) : (
          <div className="event-image-placeholder">
            <i className="pi pi-image"></i>
            <span>Không có hình ảnh</span>
          </div>
        )}
      </div>

      {/* Key Info Grid */}
      <div className="key-info-grid">
        {/* Event Mode */}
        <div className="key-info-item">
          <label>Hình thức</label>
          <div className="key-info-value">
            <span className={`mode-badge mode-${eventData.eventMode?.toLowerCase()}`}>
              {eventData.eventMode || '-'}
            </span>
          </div>
        </div>

        {/* Attendance Type */}
        <div className="key-info-item">
          <label>Hình thức điểm danh</label>
          <div className="key-info-value">
            {renderCheckInType(eventData.checkInType)}
          </div>
        </div>

        {/* Location */}
        <div className="key-info-item">
          <label>Địa điểm</label>
          <div className="key-info-value">
            {eventData.location && eventData.latitude && eventData.longitude ? (
              <a
                href={`https://maps.google.com/?q=${eventData.latitude},${eventData.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#007bff',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
              >
                📍 {eventData.location}
              </a>
            ) : (
              eventData.location || '-'
            )}
          </div>
        </div>

        {/* Date */}
        <div className="key-info-item">
          <label>Ngày diễn ra</label>
          <div className="key-info-value">{formatDate(eventData.date)}</div>
        </div>

        {/* Time & Duration */}
        <div className="key-info-item">
          <label>Thời gian bắt đầu - Thời lượng</label>
          <div className="key-info-value">
            {eventData.startTime?.substring(0, 5)} - {eventData.durationMinutes || 0} phút
          </div>
        </div>

        {/* Attendees Count */}
        <div className="key-info-item">
          <label>Số người tham gia</label>
          <div className="key-info-value attendee-count">
            <i className="pi pi-users"></i>
            <span>
              {eventData.quantity ? (
                `${registeredCount}/${eventData.quantity} người đã đăng ký`
              ) : (
                `${registeredCount} người đã đăng ký / không giới hạn số lượng`
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Links Section */}
      <div className="links-section">
        <h3>Liên kết</h3>
        <div className="links-grid">
          {/* QA Link */}
          <div className="link-item">
            <label>Link đặt câu hỏi</label>
            <div className="link-value">
              {eventData.qalink ? (
                <a href={eventData.qalink} target="_blank" rel="noopener noreferrer" className="link-button">
                  <i className="pi pi-external-link"></i> Đặt câu hỏi
                </a>
              ) : (
                <span className="text-muted">-</span>
              )}
            </div>
          </div>

          {/* Join Link */}
          <div className="link-item">
            <label>Link tham gia</label>
            <div className="link-value">
              {eventData.joinLink ? (
                <a href={eventData.joinLink} target="_blank" rel="noopener noreferrer" className="link-button">
                  <i className="pi pi-external-link"></i> Tham gia sự kiện
                </a>
              ) : (
                <span className="text-muted">-</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="description-section">
        <h3>Mô tả sự kiện</h3>
        <div className="description-content">{eventData.description || '-'}</div>
      </div>

      {/* Registration Dialogs */}
      <Dialog header="Đăng ký tham gia sự kiện" visible={showModal} modal onHide={() => setShowModal(false)}>
        <p>Bạn có chắc muốn đăng ký tham gia sự kiện này không?</p>
        <div style={{ textAlign: 'right', marginTop: '20px' }}>
          <Button label="Hủy" className="p-button-secondary" onClick={() => setShowModal(false)} style={{ marginRight: '0.5rem' }} />
          <Button label="Đăng ký" className="p-button-success" onClick={handleRegister} loading={registering} />
        </div>
      </Dialog>

      <Dialog header="Cảnh báo xung đột thời gian" visible={showConflictModal} modal onHide={() => setShowConflictModal(false)}>
        <p>Không thể đăng ký, có sự kiện diễn ra trong thời gian này!</p>
        <div style={{ textAlign: 'right', marginTop: '20px' }}>
          <Button label="Đóng" className="p-button-primary" onClick={() => setShowConflictModal(false)} />
        </div>
      </Dialog>

      <Dialog header="Xác nhận hủy vé" visible={showCancelModal} modal onHide={() => setShowCancelModal(false)}>
        <p>Bạn có chắc muốn hủy đăng ký tham gia sự kiện này không?</p>
        <p style={{ color: '#ff6b6b', fontWeight: 'bold', marginTop: '12px' }}>
          <i className="pi pi-exclamation-triangle"></i> Lưu ý: Bạn chỉ có thể hủy vé trước 2 ngày sự kiện diễn ra.
        </p>
        <div style={{ textAlign: 'right', marginTop: '20px' }}>
          <Button label="Giữ vé" className="p-button-secondary" onClick={() => setShowCancelModal(false)} style={{ marginRight: '0.5rem' }} />
          <Button label="Hủy vé" className="p-button-danger" onClick={handleCancelTicket} loading={cancelingTicket} />
        </div>
      </Dialog>

      {/* Edit Event Modal */}
      {editEventId && (
        <EditEventModal
          eventId={editEventId}
          visible={editModalVisible}
          onHide={() => setEditModalVisible(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default EventInfoTab;
