import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import { callApi } from '../../common/helper/callApi';

interface EventSchoolAccessTabProps {
  eventId: number;
  isHidden?: boolean;
}

interface School {
  id: number;
  name: string;
}

interface EventSchoolAccess {
  id: number;
  schoolId: number;
  schoolName: string;
}

export const EventSchoolAccessTab: React.FC<EventSchoolAccessTabProps> = ({ eventId, isHidden = false }) => {
  const [allowedSchools, setAllowedSchools] = useState<EventSchoolAccess[]>([]);
  const [availableSchools, setAvailableSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(false);
  const toastRef = useRef<Toast>(null);

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [schools, access] = await Promise.all([
        callApi<School[]>('GET', 'admin/schools', undefined, true),
        callApi<EventSchoolAccess[]>('GET', `events/${eventId}/school-access`, undefined, true),
      ]);
      setAvailableSchools(schools || []);
      setAllowedSchools(access || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toastRef.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải dữ liệu',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchool = async () => {
    if (!selectedSchool) {
      toastRef.current?.show({
        severity: 'warning',
        summary: 'Cảnh báo',
        detail: 'Vui lòng chọn trường',
        life: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      await callApi<void>(
        'POST',
        `events/${eventId}/school-access`,
        { schoolId: selectedSchool.id },
        true
      );
      toastRef.current?.show({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Đã thêm trường được phép',
        life: 3000,
      });
      setSelectedSchool(null);
      loadData();
    } catch (error) {
      console.error('Failed to add school:', error);
      toastRef.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể thêm trường',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSchool = async (accessId: number) => {
    if (!confirm('Bạn có chắc muốn xóa trường này?')) return;

    try {
      setLoading(true);
      await callApi<void>(
        'DELETE',
        `events/${eventId}/school-access/${accessId}`,
        undefined,
        true
      );
      toastRef.current?.show({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Đã xóa trường',
        life: 3000,
      });
      loadData();
    } catch (error) {
      console.error('Failed to remove school:', error);
      toastRef.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể xóa trường',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const actionTemplate = (rowData: EventSchoolAccess) => (
    <Button
      icon="pi pi-trash"
      className="p-button-rounded p-button-danger p-button-sm"
      onClick={() => handleRemoveSchool(rowData.id)}
      disabled={loading}
      title="Xóa trường"
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
              Chọn trường được phép tham gia
            </label>
            <Dropdown
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.value)}
              options={availableSchools}
              optionLabel="name"
              placeholder="Chọn trường"
              disabled={loading}
              style={{ width: '100%' }}
              filter
            />
          </div>
          <Button
            label="Thêm"
            icon="pi pi-plus"
            onClick={handleAddSchool}
            loading={loading}
            className="p-button-success"
          />
        </div>
      )}

      <h3 style={{ marginBottom: '16px' }}>🏫 Danh sách trường được phép tham gia ({allowedSchools.length})</h3>
      <DataTable
        value={allowedSchools}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 20]}
        className="p-datatable-striped"
      >
        <Column field="schoolName" header="Tên trường" style={{ width: '80%' }} />
        {!isHidden && <Column body={actionTemplate} header="Hành động" style={{ width: '20%', textAlign: 'center' }} />}
      </DataTable>

      {allowedSchools.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          Chưa có trường nào được thêm
        </div>
      )}
    </div>
  );
};

export default EventSchoolAccessTab;
