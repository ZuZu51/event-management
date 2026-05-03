import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { getSpeakersByEventId } from '../../services/SpeakerService';
import type { EventStats } from '../../types/Event';
import type { Speaker } from '../../types/Speaker';
import { localStorageHelper } from '../../common/helper/localStorageHelper';
import EditSpeaker from './EditSpeaker';
import './speakersTab.css';

interface SpeakersTabProps {
  eventId: number;
  eventData: EventStats;
  isHidden?: boolean;
}

export const SpeakersTab: React.FC<SpeakersTabProps> = ({ eventId, eventData, isHidden = false }) => {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const toast = useRef<Toast | null>(null);
  const role = localStorageHelper.getItem<string>('role') ?? '';
  const currentUser = localStorageHelper.getItem<string>('idUser');
  const createdUser = eventData.createdById ? String(eventData.createdById) : null;
  const isAdmin = Boolean(role && role.includes('ADMIN'));
  const isOwner = currentUser === createdUser;
  const canManage = isAdmin || isOwner;

  const loadSpeakers = React.useCallback(async () => {
    try {
      setLoading(true);
      const speakersData = await getSpeakersByEventId(eventId);
      setSpeakers(speakersData);
    } catch (error) {
      console.error('Failed to load speakers:', error);
      setSpeakers([]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadSpeakers();
  }, [loadSpeakers]);

  const handleOpenEditModal = () => {
    setEditModalVisible(true);
  };

  const handleEditSuccess = () => {
    loadSpeakers();
    toast.current?.show({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Cập nhật danh sách diễn giả thành công!',
      life: 3000,
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SPEAKER':
        return '🎯';
      case 'GUEST':
        return '👥';
      default:
        return '👤';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SPEAKER':
        return 'Diễn giả';
      case 'GUEST':
        return 'Khách mời';
      default:
        return role;
    }
  };

  const getInitials = (name: string) => {
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="content-card">
      <div className="speakers-tab-container">
      <Toast ref={toast} />

      {/* Header */}
      <div className="speakers-header">
        <div className="section-header">
          <h2>Danh sách diễn giả</h2>
        </div>
        {canManage && (
          <Button
            label="Quản lý diễn giả"
            icon="pi pi-pencil"
            severity="info"
            onClick={handleOpenEditModal}
          />
        )}
      </div>

      {/* Speakers Grid */}
      {speakers.length === 0 ? (
        <div className="speakers-empty-state">
          <div className="empty-icon">🎤</div>
          <h3>Chưa có diễn giả</h3>
          <p>Sự kiện này chưa có danh sách diễn giả</p>
        </div>
      ) : (
        <div className="speakers-grid">
          {speakers.map((speaker, index) => (
            <div className="checkin-content">
          {/* Check-in Card */}
          <div key={index} className="time-card checkin-card">
            <div className="card-header">
              <div className="card-title">
                <h3>{speaker.role} : {speaker.name}</h3>
              </div>
            </div>
            
            <div className="card-body">
              
                <div className="speaker-section">
                  <div>Thông tin:</div>
                  <div className="speaker-bio">{speaker.bio}</div>
                </div>
            </div>
          </div>
        </div>
          ))}
        </div>
      )}

      {/* Edit Speaker Modal - For admin and owner */}
      {!isHidden && canManage && (
        <EditSpeaker
          visible={editModalVisible}
          eventId={eventId}
          onHide={() => setEditModalVisible(false)}
          onUpdated={handleEditSuccess}
          fetchEvents={loadSpeakers}
        />
      )}
    </div>
    </div>
  );
};

export default SpeakersTab;