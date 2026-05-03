import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import { callApi } from '../../common/helper/callApi';
import { formatDateTimeToDDMMYYYYHHmm } from '../../common/helper/dateHelper';

interface EventInviteTabProps {
  eventId: number;
  isHidden?: boolean;
}

interface Invitation {
  id: number;
  inviteeEmail: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  invitedAt: string;
  rejectionReason?: string;
}

export const EventInviteTab: React.FC<EventInviteTabProps> = ({ eventId, isHidden = false }) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const toastRef = useRef<Toast>(null);
    
  useEffect(() => {
    loadInvitations();
  }, [eventId]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const data = await callApi<Invitation[]>(
        'GET',
        `events/${eventId}/invitations`,
        undefined,
        true
      );
      setInvitations(data || []);
    } catch (error) {
      console.error('Failed to load invitations:', error);
      toastRef.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải danh sách mời',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!newEmail.trim()) {
      toastRef.current?.show({
        severity: 'warning',
        summary: 'Cảnh báo',
        detail: 'Vui lòng nhập email',
        life: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      await callApi<void>(
        'POST',
        `events/${eventId}/invitations`,
        { inviteeEmail: newEmail },
        true
      );
      toastRef.current?.show({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Đã gửi lời mời',
        life: 3000,
      });
      setNewEmail('');
      loadInvitations();
    } catch (error) {
      console.error('Failed to send invite:', error);
      toastRef.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể gửi lời mời',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvite = async (invitationId: number) => {
    if (!confirm('Bạn có chắc muốn xóa lời mời này?')) return;

    try {
      setLoading(true);
      await callApi<void>(
        'DELETE',
        `events/${eventId}/invitations/${invitationId}`,
        undefined,
        true
      );
      toastRef.current?.show({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Đã xóa lời mời',
        life: 3000,
      });
      loadInvitations();
    } catch (error) {
      console.error('Failed to delete invite:', error);
      toastRef.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể xóa lời mời',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const statusTemplate = (rowData: Invitation) => {
    const statusMap: Record<string, { label: string; severity: string }> = {
      PENDING: { label: 'Chờ xác nhận', severity: 'warning' },
      ACCEPTED: { label: 'Đã chấp nhận', severity: 'success' },
      REJECTED: { label: 'Từ chối', severity: 'danger' },
    };
    const status = statusMap[rowData.status] || { label: rowData.status, severity: 'info' };
    return (
      <span style={{
        padding: '4px 8px',
        backgroundColor: status.severity === 'success' ? '#d4edda' : status.severity === 'warning' ? '#fff3cd' : '#f8d7da',
        color: status.severity === 'success' ? '#155724' : status.severity === 'warning' ? '#856404' : '#721c24',
        borderRadius: '4px',
        fontSize: '0.9rem',
      }}>
        {status.label}
      </span>
    );
  };

  const dateTemplate = (rowData: Invitation) => {
    return formatDateTimeToDDMMYYYYHHmm(rowData.invitedAt);
  };

  const rejectionReasonTemplate = (rowData: Invitation) => {
    if (rowData.status !== 'REJECTED') {
      return <span style={{ color: '#999' }}>-</span>;
    }
    return rowData.rejectionReason ? (
      <span title={rowData.rejectionReason} style={{ cursor: 'help' }}>
        {rowData.rejectionReason.length > 30
          ? `${rowData.rejectionReason.substring(0, 30)}...`
          : rowData.rejectionReason}
      </span>
    ) : (
      <span style={{ color: '#999' }}>Không có lý do</span>
    );
  };

  const actionTemplate = (rowData: Invitation) => (
    <Button
      icon="pi pi-trash"
      className="p-button-rounded p-button-danger p-button-sm"
      onClick={() => handleDeleteInvite(rowData.id)}
      disabled={loading}
      title="Xóa lời mời"
    />
  );

  return (
    <div style={{ padding: '20px' }}>
      <Toast ref={toastRef} />

      {!isHidden && (
        <div style={{
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-end',
        }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Gửi lời mời tham gia (Email)
            </label>
            <InputText
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Nhập email người muốn mời"
              type="email"
              style={{ width: '100%' }}
              disabled={loading}
              onKeyPress={(e) => e.key === 'Enter' && handleSendInvite()}
            />
            
          </div>
          <Button
            label="Gửi mời"
            icon="pi pi-send"
            onClick={handleSendInvite}
            loading={loading}
            className="p-button-success"
          />
        </div>
      )}

      <h3 style={{ marginBottom: '16px' }}>📧 Danh sách lời mời ({invitations.length})</h3>
      <DataTable
        value={invitations}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 20]}
        className="p-datatable-striped"
      >
        <Column field="inviteeEmail" header="Email" style={{ width: '40%' }} />
        <Column field="invitedAt" header="Ngày mời" body={dateTemplate} style={{ width: '20%' }} />
        <Column field="status" header="Trạng thái" body={statusTemplate} style={{ width: '15%' }} />
        <Column field="rejectionReason" header="Lý do từ chối" body={rejectionReasonTemplate} style={{ width: '20%' }} />
        {!isHidden && <Column body={actionTemplate} header="Hành động" style={{ width: '10%', textAlign: 'center' }} />}
      </DataTable>

      {invitations.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          Chưa có lời mời nào
        </div>
      )}
    </div>
  );
};

export default EventInviteTab;
