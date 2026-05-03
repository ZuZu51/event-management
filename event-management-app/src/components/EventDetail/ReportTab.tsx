import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { authHelper } from '../../common/helper/authHelper';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { exportEventAttendees } from '../../services/EventService';
import { attendanceService } from '../../services/attendanceService';
import { localStorageHelper } from '../../common/helper/localStorageHelper';
import { showSuccessToast, showErrorToast } from '../../common/helper/toastHelper';

interface ReportTabProps {
  eventId: number;
  isHidden?: boolean;
}

interface AttendanceRecord {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  checkInAt: string | null;
  checkOutAt: string | null;

  status: 'CHECKED_IN' | 'CHECKED_OUT' | 'ABSENT';
}

interface Stats {
  totalRegistered: number;
  checkedIn: number;
  checkedOut: number;
  absent: number;
  attendanceRate: number;
}

export const ReportTab: React.FC<ReportTabProps> = ({ eventId, isHidden = false }) => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRegistered: 0,
    checkedIn: 0,
    checkedOut: 0,
    absent: 0,
    attendanceRate: 0,
  });
  const toastRef = useRef<Toast | null>(null);

  useEffect(() => {
    loadData();
  }, [eventId, isHidden]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await attendanceService.getEventRecords(eventId);
      console.log('📊 ReportTab - Raw data from API:', data);
      
      // Log detailed structure of first record
      if (data && data.length > 0) {
        console.log('📊 ReportTab - First record details:', JSON.stringify(data[0], null, 2));
      }

      // Transform data
      let transformedRecords: AttendanceRecord[] = (data || []).map((record: any) => {
        console.log('📊 ReportTab - Processing record:', record);
        return {
          id: record.id,
          userId: record.userId || 0,
          userName: record.userName || 'N/A',
          userEmail: record.userEmail || 'N/A',
          checkInAt: record.checkInAt,
          checkOutAt: record.checkOutAt,
          status: record.status,
        };
      });

      console.log('📊 ReportTab - Transformed records:', transformedRecords);
      console.log('📊 ReportTab - isHidden:', isHidden);

      // If isHidden = true, filter to show only current user's data
      if (isHidden) {
        const currentUserId = Number(localStorageHelper.getItem('idUser'));
        console.log('📊 ReportTab - Current user ID:', currentUserId);
        console.log('📊 ReportTab - User IDs in records:', transformedRecords.map(r => r.userId));
        transformedRecords = transformedRecords.filter(r => r.userId === currentUserId);
        console.log('📊 ReportTab - Filtered records for user:', transformedRecords);
      }

      setRecords(transformedRecords);

      // Calculate stats
      const totalRegistered = transformedRecords.length;
      const checkedIn = transformedRecords.filter(r => r.checkInAt).length;
      const checkedOut = transformedRecords.filter(r => r.checkOutAt).length;
      const absent = totalRegistered - checkedIn;
      const attendanceRate = totalRegistered > 0 ? Math.round((checkedIn / totalRegistered) * 100) : 0;

      setStats({
        totalRegistered,
        checkedIn,
        checkedOut,
        absent,
        attendanceRate,
      });
    } catch (error) {
      console.error('Failed to load attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      await exportEventAttendees(eventId);
      showSuccessToast(toastRef, 'Đã xuất file Excel thành công!');
    } catch (error) {
      console.error('Export failed:', error);
      showErrorToast(toastRef, 'Xuất file thất bại!');
    }
  };

  const statusBodyTemplate = (rowData: AttendanceRecord) => {
    let className = 'attendance-status ';
    let icon = '';
    let label = '';

    switch (rowData.status) {
      case 'CHECKED_OUT':
        className += 'checked-out';
        icon = '✓';
        label = 'Hoàn thành';
        break;
      case 'CHECKED_IN':
        className += 'checked-in';
        icon = '⏳';
        label = 'Chưa check-out';
        break;
      default:
        className += 'absent';
        icon = '✗';
        label = 'Vắng mặt';
    }

    return (
      <span className={className}>
        {icon} {label}
      </span>
    );
  };

  const timeBodyTemplate = (time: string | null) => {
    if (!time) return '-';
    try {
      const date = new Date(time);
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return time;
    }
  };

  return (
    <>
      <div className="content-card">
      <div className="section-header">
        {isHidden ?
          <h2>
            
            Lịch sử điểm danh
          </h2>
          :
          <h2>
            
            Báo cáo
          </h2>
        }

        {(() => {
          if (isHidden) return null;
          return (
            <Button
              label="Xuất báo cáo"
              icon="pi pi-download"
              className="p-button-success"
              onClick={handleExportExcel}
            />
          );
        })()}
      </div>




      {/* Attendance Detail Table */}
      <div className="section-title" style={{ marginTop: '32px', marginBottom: '16px' }}>
        <span>👥</span>
        Chi tiết điểm danh
      </div>

      <DataTable
        value={records}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        emptyMessage="Chưa có dữ liệu điểm danh"
        className="attendance-table"
      >
        <Column
          field="id"
          header="STT"
          style={{ width: '80px' }}
          body={(data, options) => options.rowIndex + 1}
        />
        <Column field="userName" header="Họ tên" sortable />
        <Column field="userEmail" header="Email" sortable />
        <Column
          field="checkInAt"
          header="Check-in"
          body={(rowData) => timeBodyTemplate(rowData.checkInAt)}
          sortable
        />
        <Column
          field="checkOutAt"
          header="Check-out"
          body={(rowData) => timeBodyTemplate(rowData.checkOutAt)}
          sortable
        />
        <Column
          field="status"
          header="Trạng thái"
          body={statusBodyTemplate}
          sortable
        />
      </DataTable>

    </div>
    <Toast ref={toastRef} />
    </>
  );
};

export default ReportTab;