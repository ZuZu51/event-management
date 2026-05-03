import React, { useState, useEffect, useCallback } from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { useRef } from 'react';
import InvitationService, { type StudentInvitation } from '../services/InvitationService';
import { localStorageHelper } from '../common/helper/localStorageHelper';
import { formatDateToDDMMYYYY } from '../common/helper/dateHelper';
import './StudentInvitations.css';

export const StudentInvitations: React.FC = () => {
  const [invitations, setInvitations] = useState<StudentInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [rejectDialogVisible, setRejectDialogVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedInvitationId, setSelectedInvitationId] = useState<number | null>(null);
  const toastRef = useRef<Toast>(null);
  const userId = Number(localStorageHelper.getItem<string>('idUser') || 0);

  const loadInvitations = useCallback(async () => {
    if (!userId || userId === 0) return;
    try {
      setLoading(true);
      const data = await InvitationService.getStudentInvitations(userId);
      setInvitations(data);
    } catch (err) {
      console.error('Error loading invitations:', err);
      toastRef.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải danh sách lời mời',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const handleAccept = async (invitationId: number) => {
    try {
      setLoading(true);
      const response = await InvitationService.acceptInvitation(invitationId);
      if (response.success) {
        toastRef.current?.show({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Đã chấp nhận lời mời. Bạn đã được đăng ký sự kiện!',
          life: 3000,
        });
        loadInvitations();
      }
    } catch (err) {
      console.error('Error accepting invitation:', err);
      toastRef.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể chấp nhận lời mời',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectClick = (invitationId: number) => {
    setSelectedInvitationId(invitationId);
    setRejectReason('');
    setRejectDialogVisible(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedInvitationId) return;

    try {
      setLoading(true);
      const response = await InvitationService.rejectInvitation(
        selectedInvitationId,
        rejectReason
      );
      if (response.success) {
        toastRef.current?.show({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Đã từ chối lời mời',
          life: 3000,
        });
        setRejectDialogVisible(false);
        loadInvitations();
      }
    } catch (err) {
      console.error('Error rejecting invitation:', err);
      toastRef.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể từ chối lời mời',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '⚠️';
      case 'ACCEPTED':
        return '✅';
      case 'REJECTED':
        return '❌';
      case 'EXPIRED':
        return '⏱️';
      default:
        return '📋';
    }
  };
  console.log('invitations', invitations);
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Chờ xử lý';
      case 'ACCEPTED':
        return 'Đã chấp nhận';
      case 'REJECTED':
        return 'Từ chối';
      case 'EXPIRED':
        return 'Hết hạn';
      default:
        return 'Không xác định';
    }
  };

  const formatDate = (dateString: string) => {
    return formatDateToDDMMYYYY(dateString);
  };

  // Filter invitations by status
  const pendingInvitations = invitations.filter((i) => i.status === 'PENDING');

  const renderInvitationCard = (invitation: StudentInvitation) => {
    const isPending = invitation.status === 'PENDING';

    return (
      <div key={invitation.id} className="invitation-card">
        <div className="card-header">
          <h3 className="card-title">{invitation.eventName || 'Sự kiện'}</h3>
          <div className="card-status">
            <span>{getStatusIcon(invitation.status)}</span>
            <span className="status-text">{getStatusLabel(invitation.status)}</span>
          </div>
        </div>

        <div className="card-divider"></div>

        <div className="card-content">
          <div className="info-row">
            <span className="label">Từ:</span>
            <span className="value">{invitation.invitedByEmail || '-'}</span>
          </div>

          <div className="info-row">
            <span className="label">Ngày diễn ra:</span>
            <span className="value">
              {invitation.eventDate ? formatDate(invitation.eventDate) : '-'}
            </span>
          </div>

          <div className="info-row">
            <span className="label">Trạng thái:</span>
            <span className="value status-info">
              {invitation.status === 'ACCEPTED' && invitation.acceptedAt ? (
                <>
                  Đã chấp nhận {formatDate(invitation.acceptedAt)}
                </>
              ) : invitation.status === 'PENDING' && invitation.expiresAt ? (
                <>
                  (Hết hạn: {formatDate(invitation.expiresAt)})
                </>
              ) : invitation.status === 'REJECTED' ? (
                <>Từ chối</>
              ) : invitation.status === 'EXPIRED' ? (
                <>Hết hạn</>
              ) : null}
            </span>
          </div>
        </div>

        {isPending && (
          <div className="card-actions">
            <Button
              label="✓ Chấp nhận"
              severity="success"
              size="small"
              onClick={() => handleAccept(invitation.id)}
              loading={loading}
              className="action-btn"
            />
            <Button
              label="✗ Từ chối"
              severity="danger"
              size="small"
              onClick={() => handleRejectClick(invitation.id)}
              loading={loading}
              className="action-btn"
            />
          </div>
        )}

        {invitation.status === 'ACCEPTED' && (
          <div className="card-actions">
            <Button
              label="Xem sự kiện"
              text
              size="small"
              icon="pi pi-arrow-right"
              onClick={() => window.location.href = `/events/${invitation.eventId}`}
              className="action-btn"
            />
          </div>
        )}
      </div>
    );
  };

  const renderSection = (title: string, data: StudentInvitation[], count: number) => {
    return (
      <div className="invitation-section">
        <h2 className="section-title">{title} ({count})</h2>
        {data.length === 0 ? (
          <p className="empty-state">Không có lời mời</p>
        ) : (
          <div className="cards-grid">{data.map(renderInvitationCard)}</div>
        )}
      </div>
    );
  };

  return (
    <div className="student-invitations-container">
      <Toast ref={toastRef} />

      <div className="page-header">
        <h1>Lời Mời Sự Kiện</h1>
      </div>

      {loading && <p className="loading-text">Đang tải...</p>}

      {invitations.length === 0 && !loading ? (
        <div className="empty-state-large">
          <p>📭 Bạn không có lời mời nào</p>
        </div>
      ) : (
        <>
          {renderSection(
            'Lời mời',
            pendingInvitations,
            pendingInvitations.length
          )}
        </>
      )}

      {/* Reject Dialog */}
      <Dialog
        visible={rejectDialogVisible}
        onHide={() => setRejectDialogVisible(false)}
        header="Từ chối lời mời"
        modal
        style={{ width: '90%', maxWidth: '400px' }}
      >
        <div className="dialog-content">
          <label className="dialog-label">Lý do từ chối (tùy chọn):</label>
          <InputTextarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Nhập lý do từ chối..."
            rows={3}
            className="dialog-input"
          />
        </div>
        <div className="dialog-actions">
          <Button
            label="Hủy"
            severity="secondary"
            onClick={() => setRejectDialogVisible(false)}
          />
          <Button
            label="Từ chối"
            severity="danger"
            onClick={handleRejectConfirm}
            loading={loading}
          />
        </div>
      </Dialog>
    </div>
  );
};
