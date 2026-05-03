import React, { useState, useEffect, useCallback } from 'react';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';
import InvitationService, { type StudentInvitation } from '../services/InvitationService';
import { localStorageHelper } from '../common/helper/localStorageHelper';
import { formatDateToDDMMYYYY } from '../common/helper/dateHelper';
import './StudentInvitationsWidget.css';

export const StudentInvitationsWidget: React.FC = () => {
  const [invitations, setInvitations] = useState<StudentInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const userId = Number(localStorageHelper.getItem<string>('idUser') || 0);

  const loadInvitations = useCallback(async () => {
    if (!userId || userId === 0) return;
    try {
      setLoading(true);
      const data = await InvitationService.getStudentInvitations(userId);
      // Show only top 3 pending invitations
      const pending = data.filter((i) => i.status === 'PENDING').slice(0, 3);
      setInvitations(pending);
    } catch (err) {
      console.error('Error loading invitations:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const handleAccept = async (
    e: React.MouseEvent<HTMLButtonElement>,
    invitationId: number
  ) => {
    e.stopPropagation();
    try {
      setLoading(true);
      await InvitationService.acceptInvitation(invitationId);
      loadInvitations();
    } catch (error) {
      console.error('Error accepting invitation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (
    e: React.MouseEvent<HTMLButtonElement>,
    invitationId: number
  ) => {
    e.stopPropagation();
    try {
      setLoading(true);
      await InvitationService.rejectInvitation(invitationId);
      loadInvitations();
    } catch (error) {
      console.error('Error rejecting invitation:', error);
    } finally {
      setLoading(false);
    }
  };
  const formatDate = (dateString: string) => {
    return formatDateToDDMMYYYY(dateString);
  };

  const pendingCount = invitations.length;

  return (
    <div className="invitations-widget">
      <div className="widget-header">
        <h3>
          <span className="icon">📧</span> Lời Mời Sự Kiện
        </h3>
        {pendingCount > 0 && <span className="badge">{pendingCount}</span>}
      </div>

      <div className="widget-body">
        {loading && <p className="loading">Đang tải...</p>}

        {invitations.length === 0 && !loading && (
          <p className="empty-state">Không có lời mời mới</p>
        )}

        {invitations.length > 0 && (
          <div className="invitations-list">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="invitation-item">
                <div className="invitation-info">
                  <p className="event-name">{invitation.eventName}</p>
                  <p className="event-date">
                    📅 {invitation.eventDate ? formatDate(invitation.eventDate) : '-'}
                  </p>
                  <p className="expires">
                    (Hết hạn: {invitation.expiresAt ? formatDate(invitation.expiresAt) : '-'})
                  </p>
                </div>
                <div className="invitation-actions">
                  <Button
                    icon="pi pi-check"
                    severity="success"
                    text
                    rounded
                    size="small"
                    onClick={(e) => handleAccept(e, invitation.id)}
                    loading={loading}
                    title="Chấp nhận"
                  />
                  <Button
                    icon="pi pi-times"
                    severity="danger"
                    text
                    rounded
                    size="small"
                    onClick={(e) => handleReject(e, invitation.id)}
                    loading={loading}
                    title="Từ chối"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {invitations.length > 0 && (
        <div className="widget-footer">
          <Button
            label="Xem tất cả"
            text
            size="small"
            onClick={() => navigate('/invitations')}
            icon="pi pi-arrow-right"
            iconPos="right"
          />
        </div>
      )}
    </div>
  );
};
