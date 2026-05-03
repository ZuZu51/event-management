import React, { useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { updateSpeaker, deleteSpeaker } from '../../services/SpeakerService';
import { localStorageHelper } from '../../common/helper/localStorageHelper';

interface SpeakerData {
  id: number;
  name: string;
  bio: string;
  role: 'SPEAKER' | 'GUEST';
}

interface SpeakerCardProps {
  speaker: SpeakerData;
  onUpdate: (data: Partial<SpeakerData>) => void;
  onDelete: () => void;
  isHidden?: boolean;
}

const roleOptions = [
  { label: '🎯 Diễn giả', value: 'SPEAKER' },
  { label: '👥 Khách mời', value: 'GUEST' },
];

const roleLabels: Record<string, string> = {
  'SPEAKER': '🎯 Diễn giả',
  'GUEST': '👥 Khách mời',
};

export const SpeakerCard: React.FC<SpeakerCardProps> = ({ speaker, onUpdate, onDelete, isHidden = false }) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(speaker);
  const [loading, setLoading] = useState(false);
  const toast = useRef<Toast | null>(null);

  const getInitials = (name: string) => {
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleSave = async () => {
    if (!formData.name || !formData.bio) {
      toast.current?.show({ severity: 'warn', summary: 'Thiếu dữ liệu', detail: 'Vui lòng điền đầy đủ thông tin', life: 3000 });
      return;
    }

    try {
      setLoading(true);
      await updateSpeaker(speaker.id, {
        name: formData.name,
        bio: formData.bio,
        role: formData.role,
      });
      
      onUpdate({
        name: formData.name,
        bio: formData.bio,
        role: formData.role,
      });

      setEditMode(false);
      toast.current?.show({ severity: 'success', summary: 'Thành công', detail: 'Đã cập nhật thông tin diễn giả', life: 3000 });
    } catch (error) {
      console.error('Failed to update speaker:', error);
      toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Cập nhật thất bại', life: 4000 });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(speaker);
    setEditMode(false);
  };

  const handleDelete = async () => {
    
    try {
      setLoading(true);
      await deleteSpeaker(speaker.id);
      onDelete();
      toast.current?.show({ severity: 'info', summary: 'Đã xóa', detail: 'Diễn giả đã được xóa', life: 3000 });
    } catch (error) {
      console.error('Failed to delete speaker:', error);
      toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Xóa thất bại', life: 4000 });
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <div className={`speaker-card ${editMode ? 'edit-mode' : ''}`}>
      <Toast ref={toast} />
      <div className="speaker-avatar">{getInitials(speaker.name)}</div>

      <div className="speaker-info">
        {/* Name */}
        {editMode ? (
          <InputText
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="speaker-input"
            placeholder="Họ tên diễn giả"
            disabled={loading}
          />
        ) : (
          <div className="speaker-name">{speaker.name}</div>
        )}

        {/* Role */}
        {editMode ? (
          <Dropdown
            value={formData.role}
            options={roleOptions}
            onChange={(e) => setFormData({ ...formData, role: e.value })}
            className="speaker-input"
            disabled={loading}
          />
        ) : (
          <div className="speaker-role">{roleLabels[speaker.role]}</div>
        )}

        {/* Bio */}
        {editMode ? (
          <InputTextarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={3}
            className="speaker-input speaker-textarea"
            placeholder="Tiểu sử diễn giả"
            disabled={loading}
          />
        ) : (
          <div className="speaker-bio">{speaker.bio}</div>
        )}
      </div>

      {/* Hide action buttons when isHidden */}
      {!isHidden && (
        <div className="speaker-actions">
          {editMode ? (
            <Button
              icon="pi pi-check"
              className="p-button-success p-button-sm"
              onClick={handleSave}
              tooltip="Lưu"
              loading={loading}
              disabled={loading}
            />
          ) : (
            <Button
              icon="pi pi-pencil"
              className="p-button-primary p-button-sm"
              onClick={() => setEditMode(true)}
              tooltip="Chỉnh sửa"
            />
          )}

          {editMode ? (
            <Button
              icon="pi pi-times"
              className="p-button-secondary p-button-sm"
              onClick={handleCancel}
              tooltip="Hủy"
              disabled={loading}
            />
          ) : (
            <Button
              icon="pi pi-trash"
              className="p-button-danger p-button-sm"
              onClick={handleDelete}
              tooltip="Xóa"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default SpeakerCard;