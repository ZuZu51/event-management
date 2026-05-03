import React, { useState } from 'react';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import { uploadResource } from '../services/resourceService';

interface EventResourceUploadProps {
  eventId: number;
  onUploadSuccess?: () => void;
  isPrivileged?: boolean;
}

const EventResourceUpload: React.FC<EventResourceUploadProps> = ({
  eventId,
  onUploadSuccess,
  isPrivileged = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const toastRef = React.useRef<Toast>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setSelectedFiles(fileArray);

    toastRef.current?.show({
      severity: 'info',
      summary: 'Đã chọn',
      detail: `${fileArray.length} file được chọn. Nhấn "Tải lên" để upload.`,
      life: 3000,
    });
  };

  const handleRemoveFile = (index: number) => {
    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearAll = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng chọn file trước',
        life: 3000,
      });
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      toastRef.current?.show({
        severity: 'info',
        summary: 'Đang upload',
        detail: `Uploading ${selectedFiles.length} file...`,
        sticky: true,
      });

      setProgress(30);
      await uploadResource(eventId, selectedFiles);

      setProgress(100);

      toastRef.current?.replace({
        severity: 'success',
        summary: 'Thành công',
        detail: `Upload ${selectedFiles.length} file thành công`,
        life: 3000,
      });

      if (onUploadSuccess) {
        onUploadSuccess();
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSelectedFiles([]);
      setProgress(0);
    } catch (error: any) {
      toastRef.current?.replace({
        severity: 'error',
        summary: 'Lỗi',
        detail: error.message || 'Upload file thất bại',
        life: 3000,
      });
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <Toast ref={toastRef} />
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        disabled={uploading}
        style={{ display: 'none' }}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
        multiple
      />
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        {isPrivileged && (
          <>
            <Button
              icon="pi pi-folder-open"
              label="Chọn file"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              severity="secondary"
            />
            
            <Button
              icon={uploading ? 'pi pi-spinner pi-spin' : 'pi pi-upload'}
              label={uploading ? 'Đang upload...' : 'Tải lên'}
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              severity="success"
            />
          </>
        )}

        {uploading && <ProgressBar value={progress} style={{ width: '200px' }} />}
      </div>

      {selectedFiles.length > 0 && (
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>
              Đã chọn {selectedFiles.length} file:
            </p>
            {isPrivileged && (
              <Button
                icon="pi pi-times"
                rounded
                text
                severity="danger"
                onClick={handleClearAll}
                tooltip="Xóa tất cả"
                tooltipPosition="left"
                style={{ width: '32px', height: '32px' }}
              />
            )}
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#666' }}>
            {selectedFiles.map((file, index) => (
              <li 
                key={index} 
                style={{ 
                  marginBottom: '5px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingRight: '5px'
                }}
              >
                <span>
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </span>
                {isPrivileged && (
                  <Button
                    icon="pi pi-times"
                    rounded
                    text
                    severity="danger"
                    onClick={() => handleRemoveFile(index)}
                    style={{ width: '24px', height: '24px', minWidth: '24px', marginLeft: '10px' }}
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default EventResourceUpload;
