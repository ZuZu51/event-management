import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import {
  getEventResources,
  deleteResource,
  downloadFile,
  type EventResource,
} from '../services/resourceService';

interface EventResourceTableProps {
  eventId: number;
  triggerRefresh?: number;
  isPrivileged?: boolean;
}

const EventResourceTable: React.FC<EventResourceTableProps> = ({
  eventId,
  triggerRefresh = 0,
  isPrivileged = false,
}) => {
  const [resources, setResources] = useState<EventResource[]>([]);
  const [loading, setLoading] = useState(false);
  const toastRef = React.useRef<Toast>(null);

  const loadResources = async () => {
    try {
      setLoading(true);
      const data = await getEventResources(eventId);
      setResources(data);
    } catch (error: any) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Lỗi khi tải danh sách tài nguyên',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, [eventId, triggerRefresh]);

  const handleDownload = async (resource: EventResource) => {
    try {
      await downloadFile(eventId, resource.id, resource.fileName);
      toastRef.current?.show({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Tải file thành công',
        life: 3000,
      });
    } catch (error: any) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Lỗi khi tải file',
        life: 3000,
      });
    }
  };

  const handleDeleteConfirm = (resource: EventResource) => {
    confirmDialog({
      message: `Xóa file "${resource.fileName}"?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleDelete(resource),
    });
  };

  const handleDelete = async (resource: EventResource) => {
    try {
      await deleteResource(eventId, resource.id);
      setResources(resources.filter(r => r.id !== resource.id));
      toastRef.current?.show({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Xóa file thành công',
        life: 3000,
      });
    } catch (error: any) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Lỗi khi xóa file',
        life: 3000,
      });
    }
  };

  const actionTemplate = (rowData: EventResource) => {
    return (
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button
          icon="pi pi-download"
          rounded
          text
          severity="info"
          onClick={() => handleDownload(rowData)}
          tooltip="Tải về"
        />
        {isPrivileged && (
          <Button
            icon="pi pi-trash"
            rounded
            text
            severity="danger"
            onClick={() => handleDeleteConfirm(rowData)}
            tooltip="Xóa"
          />
        )}
      </div>
    );
  };

  const sizeTemplate = (rowData: EventResource) => {
    const mb = (rowData.fileSize / 1024 / 1024).toFixed(2);
    return `${mb} MB`;
  };

  const dateTemplate = (rowData: EventResource) => {
    return new Date(rowData.createdAt).toLocaleDateString('vi-VN');
  };

  return (
    <>
      <Toast ref={toastRef} />
      <ConfirmDialog />
      <DataTable
        value={resources}
        loading={loading}
        emptyMessage="Không có tài nguyên"
        stripedRows
        responsiveLayout="scroll"
      >
        <Column field="fileName" header="Tên file" />
        <Column field="fileSize" header="Kích thước" body={sizeTemplate} />
        <Column field="fileType" header="Loại" />
        <Column field="createdAt" header="Ngày upload" body={dateTemplate} />
        <Column body={actionTemplate} header="Hành động" style={{ width: '150px' }} />
      </DataTable>
    </>
  );
};

export default EventResourceTable;
