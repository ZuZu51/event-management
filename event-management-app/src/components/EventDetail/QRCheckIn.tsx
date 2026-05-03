import React, { useState, useRef, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useSearchParams } from 'react-router-dom';
import { authHelper } from '../../common/helper/authHelper';
import { getEventStats } from '../../services/EventService';
import { updateTicketStatus, getEventAttendanceFromTickets } from '../../services/TicketService';
import { attendanceService } from '../../services/attendanceService';
import { showWarningToast, showSuccessToast, showErrorToast } from '../../common/helper/toastHelper';
import QRCodeScanner from '../QRCodeScanner/QRCodeScanner';
import type { QRCodeScannerHandle } from '../QRCodeScanner/QRCodeScanner';
import type { EventStats } from '../../types/Event';
import './QRCheckIn.css';

interface AttendanceRecord {
  id: number;
  userId: number;
  user?: {
    name: string;
    email: string;
  };
  checkInTime?: string;
  checkOutTime?: string;
  status: 'NONE' | 'CHECKED_IN' | 'CHECKED_OUT';
  ticketCode?: string;
  studentId?: string;
}

const QRCheckIn: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [eventId, setEventId] = useState<string>(searchParams.get('eventId') || '');
  const [event, setEvent] = useState<EventStats | null>(null);
  const [noPermission, setNoPermission] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [lastScannedTicket, setLastScannedTicket] = useState<{ code: string; userName: string; status: string } | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const toastRef = useRef<Toast | null>(null);
  const qrScannerRef = useRef<QRCodeScannerHandle>(null);

  const role = authHelper.getRole();
  const userId = authHelper.getUserId();
  const isAdminOrTeacher =
    role && (role.toUpperCase().includes('ADMIN') || role.toUpperCase().includes('TEACHER'));

  // Auto-load event when eventId is provided via URL params
  useEffect(() => {
    const paramEventId = searchParams.get('eventId');
    if (paramEventId) {
      setEventId(paramEventId);
      handleSearch(paramEventId);
    }
  }, [searchParams]);

  const handleSearch = async (eventIdToSearch?: string) => {
    const idToUse = eventIdToSearch || eventId;
    if (!idToUse.trim()) {
      showWarningToast(toastRef, 'Vui lòng nhập ID sự kiện');
      return;
    }

    try {
      setSearchLoading(true);
      setNoPermission(false);
      setEvent(null);
      setAttendanceRecords([]);

      // Fetch event details
      const eventData = await getEventStats(Number(idToUse));
      setEvent(eventData);

      // Get owner ID from event
      const createdById = (eventData as EventStats & { createdById?: number; created_by_id?: number })?.createdById || 
                         (eventData as EventStats & { createdById?: number; created_by_id?: number })?.created_by_id;
      
      // Check permission
      const isOwner = createdById && userId && Number(createdById) === Number(userId);
      if (!isAdminOrTeacher && !isOwner) {
        setNoPermission(true);
        setEvent(null);
        return;
      }

      // Load attendance records
      loadAttendanceRecords(Number(idToUse));

      showSuccessToast(toastRef, 'Tìm thấy sự kiện');
    } catch (error) {
      console.error('Failed to fetch event:', error);
      showErrorToast(toastRef, 'Không tìm thấy sự kiện. Vui lòng kiểm tra ID lại.');
      setEvent(null);
      setAttendanceRecords([]);
    } finally {
      setSearchLoading(false);
    }
  };

interface TicketAttendanceRecord {
  id: number;
  userId: number;
  ticketCode: string;
  userName: string;
  userEmail: string;
  studentId: string;
  status: 'NONE' | 'CHECKED_IN' | 'CHECKED_OUT';
  checkInTime?: string;
  checkOutTime?: string;
}

const mapTicketStatusToAttendance = (status: string): 'NONE' | 'CHECKED_IN' | 'CHECKED_OUT' => {
  if (status === 'CHECKED_IN') return 'CHECKED_IN';
  if (status === 'CHECKED_OUT') return 'CHECKED_OUT';
  return 'NONE';
};

  const loadAttendanceRecords = async (eventIdNum: number) => {
    try {
      setRecordsLoading(true);
      
      // Try to get from tickets first (preferred for QR scanning)
      try {
        const ticketRecords = await getEventAttendanceFromTickets(eventIdNum);
        if (ticketRecords && Array.isArray(ticketRecords) && ticketRecords.length > 0) {
          // Map ticket records to attendance format
          const mappedRecords = ticketRecords.map((ticket: TicketAttendanceRecord) => ({
            id: ticket.id,
            userId: ticket.userId,
            user: {
              name: ticket.userName,
              email: ticket.userEmail,
            },
            checkInTime: ticket.checkInTime,
            checkOutTime: ticket.checkOutTime,
            status: mapTicketStatusToAttendance(ticket.status as string),
            ticketCode: ticket.ticketCode,
            studentId: ticket.studentId,
          }));
          setAttendanceRecords(mappedRecords);
          return;
        }
      } catch (ticketError) {
        console.warn('Failed to load from tickets, falling back to attendance records:', ticketError);
      }

      // Fallback to attendance records
      const records = await attendanceService.getEventRecords(eventIdNum);
      if (records && Array.isArray(records)) {
        setAttendanceRecords(records);
      }
    } catch (error) {
      console.error('Failed to load attendance records:', error);
      showErrorToast(toastRef, 'Không thể tải danh sách điểm danh');
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleQRScanned = async (ticketCode: string) => {
    if (!event) return;

    try {
      // Update ticket status with check-in/check-out
      const result = await updateTicketStatus(ticketCode, event.eventId);
      
      const statusText = result.status === 'CHECKED_IN' ? 'Check-in' : 'Check-out';
      showSuccessToast(toastRef, `✅ ${statusText} thành công`);
      
      // Store last scanned ticket info
      setLastScannedTicket({
        code: ticketCode,
        userName: result.userName || 'N/A',
        status: statusText
      });
      
      // Reload attendance records
      loadAttendanceRecords(event.eventId);
    } catch (error) {
      console.error('Failed to process QR:', error);
      showErrorToast(toastRef, 'Mã QR không hợp lệ hoặc đã được sử dụng');
      setLastScannedTicket(null);
    }
  };

  const rowNumberTemplate = (rowData: AttendanceRecord, { rowIndex }: { rowIndex: number }) => (
    <span>{rowIndex + 1}</span>
  );

  const checkInTimeTemplate = (rowData: AttendanceRecord) => (
    <span>{rowData.checkInTime ? new Date(rowData.checkInTime).toLocaleTimeString('vi-VN') : '-'}</span>
  );

  const checkOutTimeTemplate = (rowData: AttendanceRecord) => (
    <span>{rowData.checkOutTime ? new Date(rowData.checkOutTime).toLocaleTimeString('vi-VN') : '-'}</span>
  );

  const statusTemplate = (rowData: AttendanceRecord) => {
    let badge = '';
    if (rowData.status === 'CHECKED_IN') badge = '✅ Checked In';
    else if (rowData.status === 'CHECKED_OUT') badge = '✔️ Checked Out';
    else badge = '⭕ Chưa điểm danh';
    return <span>{badge}</span>;
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>📱 Quét mã điểm danh</h2>
          
          {/* Search Section - Only show if no event is loaded */}
          {!event && !searchLoading && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
              <InputText
                placeholder="Vui lòng nhập ID của sự kiện"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                disabled={searchLoading}
                style={{ flex: 1 }}
              />
              <Button
                label="Tìm kiếm"
                icon="pi pi-search"
                onClick={() => handleSearch()}
                loading={searchLoading}
              />
            </div>
          )}

          {/* No Permission Message */}
          {noPermission && (
            <div
              style={{
                padding: '1rem',
                background: '#fee',
                border: '1px solid #fcc',
                borderRadius: '0.5rem',
                color: '#c33',
                marginBottom: '2rem',
                textAlign: 'center',
                fontWeight: 500,
              }}
            >
              ❌ Bạn không có quyền truy cập
            </div>
          )}

          {/* Event Found */}
          {event && !noPermission && (
            <>
              <div
                style={{
                  padding: '1rem',
                  background: '#f0f9ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '0.5rem',
                  marginBottom: '2rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                      ✅ Sự kiện
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e40af' }}>
                      {event.eventName}
                    </div>
                  </div>
                  
                </div>
              </div>

              {/* QR Scanner */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>📱 Quét mã QR</h3>
                  <Button
                    icon={cameraOpen ? 'pi pi-video' : 'pi pi-video-off'}
                    label={cameraOpen ? 'Đóng camera' : 'Mở camera'}
                    onClick={() => {
                      if (cameraOpen) {
                        qrScannerRef.current?.stopCamera();
                      }
                      setCameraOpen(!cameraOpen);
                    }}
                    severity={cameraOpen ? 'success' : 'secondary'}
                    size="small"
                  />
                </div>
                {cameraOpen && (
                  <QRCodeScanner
                    ref={qrScannerRef}
                    onScan={handleQRScanned}
                    onError={(error) => {
                      showErrorToast(toastRef, `Lỗi camera: ${error}`);
                    }}
                  />
                )}
              </div>

              {/* Last Scanned Ticket Info */}
              {lastScannedTicket && (
                <div
                  style={{
                    padding: '1rem',
                    background: '#ecfdf5',
                    border: '2px solid #10b981',
                    borderRadius: '0.5rem',
                    marginBottom: '2rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: '#666', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                        ✅ Quét mã thành công
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Mã Ticket:</strong>{' '}
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '1rem',
                            color: '#1e40af',
                            fontWeight: 'bold',
                          }}
                        >
                          {lastScannedTicket.code}
                        </span>
                      </div>
                      <div style={{ marginBottom: '0.25rem' }}>
                        <strong>Tên người dùng:</strong> {lastScannedTicket.userName}
                      </div>
                      <div>
                        <strong>Trạng thái:</strong>{' '}
                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                          {lastScannedTicket.status}
                        </span>
                      </div>
                    </div>
                    <Button
                      icon="pi pi-times"
                      rounded
                      severity="secondary"
                      text
                      onClick={() => setLastScannedTicket(null)}
                      style={{ marginLeft: '1rem' }}
                    />
                  </div>
                </div>
              )}

              {/* Attendance Records Table */}
              <div>
                <h3 style={{ marginBottom: '1rem' }}>📊 Danh sách điểm danh</h3>
                <DataTable
                  value={attendanceRecords.filter(record => record.status !== 'NONE')}
                  paginator
                  rows={10}
                  rowsPerPageOptions={[5, 10, 20]}
                  loading={recordsLoading}
                  emptyMessage="Chưa có bản ghi điểm danh"
                  style={{ fontSize: '0.9rem' }}
                >
                  <Column
                    field="stt"
                    header="STT"
                    body={rowNumberTemplate}
                    style={{ width: '60px', textAlign: 'center' }}
                  />
                  <Column
                    field="user.email"
                    header="Email"
                    style={{ width: '200px' }}
                    filter
                    filterPlaceholder="Tìm email"
                  />
                  <Column
                    field="user.name"
                    header="Tên"
                    style={{ width: '150px' }}
                    filter
                    filterPlaceholder="Tìm tên"
                  />
                  <Column
                    field="studentId"
                    header="MSSV"
                    style={{ width: '120px' }}
                  />
                  <Column
                    field="checkInTime"
                    header="Check-in Time"
                    body={checkInTimeTemplate}
                    style={{ width: '140px' }}
                  />
                  <Column
                    field="checkOutTime"
                    header="Check-out Time"
                    body={checkOutTimeTemplate}
                    style={{ width: '140px' }}
                  />
                  <Column
                    field="status"
                    header="Trạng thái"
                    body={statusTemplate}
                    style={{ width: '150px' }}
                  />
                </DataTable>
              </div>
            </>
          )}
        </div>
      </Card>

      <Toast ref={toastRef} />
    </div>
  );
};

export default QRCheckIn;
