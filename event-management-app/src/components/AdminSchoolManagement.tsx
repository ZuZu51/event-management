import { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';
import { Dropdown } from 'primereact/dropdown';
import { schoolService } from '../services/schoolService';
import type { School, Department } from '../services/schoolService';
import '../styles/adminSchoolManagement.css';

export default function AdminSchoolManagement() {
  const toastRef = useRef<Toast>(null);

  // Schools State
  const [schools, setSchools] = useState<School[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  // Dialog States
  const [schoolDialogVisible, setSchoolDialogVisible] = useState(false);
  const [departmentDialogVisible, setDepartmentDialogVisible] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  // Form Data
  const [schoolForm, setSchoolForm] = useState<School>({
    name: '',
  });

  const [departmentForm, setDepartmentForm] = useState<Department>({
    name: '',
    schoolId: 0,
  });

  const [loading, setLoading] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadSchools();
    loadDepartments();
  }, []);

  const loadSchools = async () => {
    try {
      setLoading(true);
      console.log('🔄 Bắt đầu tải danh sách trường...');
      const response = await schoolService.getAllSchools();
      console.log('📦 Response từ API:', response);
      console.log('📊 Loại response:', typeof response);
      console.log('🔍 Là array:', Array.isArray(response));
      console.log('✅ response.success:', response.success);
      console.log('📋 response.data:', response.data);
      console.log('💬 response.message:', response.message);
      
      // Check if response is array (raw data) or wrapped object
      const schoolData = Array.isArray(response) ? response : response.data;
      
      if (schoolData && Array.isArray(schoolData) && schoolData.length > 0) {
        console.log('✔️ Đã tải thành công', schoolData.length, 'trường');
        setSchools(schoolData);
      } else if (Array.isArray(schoolData)) {
        console.log('✔️ Không có dữ liệu trường');
        setSchools([]);
      } else {
        console.error('❌ Tải thất bại:', response.message);
        toastRef.current?.show({
          severity: 'error',
          summary: 'Lỗi',
          detail: response.message || 'Không thể tải danh sách trường',
        });
      }
    } catch (error) {
      console.error('❌ Lỗi khi tải danh sách trường:', error);
      console.error('Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack,
      });
      toastRef.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải danh sách trường',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async (schoolId?: number) => {
    try {
      const idToUse = schoolId || selectedSchool?.id;
      console.log('🔄 loadDepartments() được gọi');
      console.log('   schoolId parameter:', schoolId);
      console.log('   selectedSchool:', selectedSchool);
      console.log('   idToUse:', idToUse);
      
      if (!idToUse) {
        console.log('⚠️ Không có trường được chọn, bỏ qua tải khoa');
        setDepartments([]);
        return;
      }
      
      setLoading(true);
      console.log('🔄 Bắt đầu tải danh sách khoa cho trường ID:', idToUse);
      
      const response = await schoolService.getDepartmentsBySchool(idToUse);
      console.log('📦 Response khoa từ API:', response);
      console.log('📊 Loại response:', typeof response);
      console.log('🔍 Là array:', Array.isArray(response));
      console.log('✅ response.success:', response.success);
      console.log('📋 response.data:', response.data);
      console.log('📋 response.departments:', (response as any).departments);
      
      // Check if response is array (raw data) or wrapped object
      let departmentData = Array.isArray(response) ? response : response.data;
      
      // Also check for .departments property
      if (!departmentData && (response as any).departments) {
        departmentData = (response as any).departments;
        console.log('📋 Sử dụng response.departments');
      }
      
      console.log('📋 departmentData sau xử lý:', departmentData);
      console.log('📋 Loại departmentData:', typeof departmentData);
      console.log('📋 Array.isArray(departmentData):', Array.isArray(departmentData));
      
      if (departmentData && Array.isArray(departmentData)) {
        console.log('✔️ Đã tải thành công', departmentData.length, 'khoa');
        setDepartments(departmentData);
      } else if (departmentData === undefined || departmentData === null) {
        console.warn('⚠️ departmentData là null hoặc undefined');
        setDepartments([]);
      } else {
        console.error('❌ Tải khoa thất bại - departmentData không phải array');
        console.error('Response:', response);
        setDepartments([]);
      }
    } catch (error) {
      console.error('❌ Lỗi khi tải danh sách khoa:', error);
      console.error('Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack,
      });
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  // School handlers
  const openNewSchoolDialog = () => {
    setEditingSchool(null);
    setSchoolForm({
      name: '',
    });
    setSchoolDialogVisible(true);
  };

  const openEditSchoolDialog = (school: School) => {
    setEditingSchool(school);
    setSchoolForm(school);
    setSchoolDialogVisible(true);
  };

  const saveSchool = async () => {
    if (!schoolForm.name) {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng điền tên trường',
      });
      return;
    }

    try {
      setLoading(true);
      if (editingSchool?.id) {
        console.log('📝 Cập nhật trường:', editingSchool.id, schoolForm);
        const response = await schoolService.updateSchool(editingSchool.id, schoolForm);
        console.log('📦 Update response:', response);
        // Handle both wrapped and raw response formats
        const isSuccess = response.success !== undefined ? response.success : !!response;
        if (isSuccess) {
          console.log('✔️ Cập nhật trường thành công');
          toastRef.current?.show({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật trường thành công',
          });
          loadSchools();
        } else {
          console.error('❌ Cập nhật trường thất bại:', (response as any).message);
          toastRef.current?.show({
            severity: 'error',
            summary: 'Lỗi',
            detail: (response as any).message || 'Không thể cập nhật trường',
          });
        }
      } else {
        console.log('➕ Tạo trường mới:', schoolForm);
        const response = await schoolService.createSchool(schoolForm);
        console.log('📦 Create response:', response);
        // Handle both wrapped and raw response formats
        const isSuccess = response.success !== undefined ? response.success : !!response;
        if (isSuccess) {
          console.log('✔️ Tạo trường thành công');
          toastRef.current?.show({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Thêm trường mới thành công',
          });
          loadSchools();
        } else {
          console.error('❌ Tạo trường thất bại:', (response as any).message);
          toastRef.current?.show({
            severity: 'error',
            summary: 'Lỗi',
            detail: (response as any).message || 'Không thể thêm trường',
          });
        }
      }
      setSchoolDialogVisible(false);
    } catch (error) {
      console.error('❌ Lỗi khi lưu trường:', error);
      console.error('Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
      });
      toastRef.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể lưu trường',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteSchool = (school: School) => {
    confirmDialog({
      message: `Bạn có chắc chắn muốn xóa trường "${school.name}"?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          if (!school.id) return;
          console.log('🗑️ Xóa trường:', school.id);
          const response = await schoolService.deleteSchool(school.id);
          console.log('📦 Delete response:', response);
          // Handle both wrapped and raw response formats
          const isSuccess = response.success !== undefined ? response.success : !!response;
          if (isSuccess) {
            console.log('✔️ Xóa trường thành công');
            toastRef.current?.show({
              severity: 'success',
              summary: 'Thành công',
              detail: 'Xóa trường thành công',
            });
            loadSchools();
          } else {
            console.error('❌ Xóa trường thất bại:', (response as any).message);
            toastRef.current?.show({
              severity: 'error',
              summary: 'Lỗi',
              detail: (response as any).message || 'Không thể xóa trường',
            });
          }
        } catch (error) {
          console.error('❌ Lỗi khi xóa trường:', error);
          toastRef.current?.show({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể xóa trường',
          });
        }
      },
    });
  };

  // Department handlers
  const openNewDepartmentDialog = () => {
    console.log('🔄 openNewDepartmentDialog()');
    console.log('   selectedSchool:', selectedSchool);
    setEditingDepartment(null);
    setDepartmentForm({
      name: '',
      schoolId: selectedSchool?.id || 0,
    });
    setDepartmentDialogVisible(true);
  };

  const openEditDepartmentDialog = (dept: Department) => {
    console.log('🔄 openEditDepartmentDialog()');
    console.log('   department:', dept);
    setEditingDepartment(dept);
    setDepartmentForm(dept);
    setDepartmentDialogVisible(true);
  };

  const saveDepartment = async () => {
    console.log('💾 saveDepartment() bắt đầu');
    console.log('   departmentForm:', departmentForm);
    console.log('   editingDepartment:', editingDepartment);
    
    if (!departmentForm.name || !departmentForm.schoolId) {
      console.warn('⚠️ Validation failed');
      console.log('   departmentForm.name:', departmentForm.name);
      console.log('   departmentForm.schoolId:', departmentForm.schoolId);
      toastRef.current?.show({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng chọn trường và điền tên khoa',
      });
      return;
    }

    try {
      setLoading(true);
      if (editingDepartment?.id) {
        console.log('📝 Cập nhật khoa:', editingDepartment.id, { name: departmentForm.name });
        console.log('   API call params - schoolId:', departmentForm.schoolId, ', deptId:', editingDepartment.id);
        const response = await schoolService.updateDepartment(
          departmentForm.schoolId,
          editingDepartment.id,
          { name: departmentForm.name }
        );
        console.log('📦 Update department response:', response);
        console.log('📦 Response type:', typeof response);
        console.log('📦 Response.success:', response.success);
        
        // Handle both wrapped and raw response formats
        const isSuccess = response.success !== undefined ? response.success : !!response;
        console.log('📦 isSuccess (final):', isSuccess);
        
        if (isSuccess) {
          console.log('✔️ Cập nhật khoa thành công');
          toastRef.current?.show({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật khoa thành công',
          });
          setDepartmentDialogVisible(false);
          await loadDepartments();
        } else {
          console.error('❌ Cập nhật khoa thất bại:', (response as any).message);
          toastRef.current?.show({
            severity: 'error',
            summary: 'Lỗi',
            detail: (response as any).message || 'Không thể cập nhật khoa',
          });
        }
      } else {
        console.log('➕ Tạo khoa mới:', { schoolId: departmentForm.schoolId, name: departmentForm.name });
        console.log('   API call params - schoolId:', departmentForm.schoolId, ', name:', departmentForm.name);
        const response = await schoolService.createDepartment(
          departmentForm.schoolId,
          { name: departmentForm.name }
        );
        console.log('📦 Create department response:', response);
        console.log('📦 Response type:', typeof response);
        console.log('📦 Response.success:', response.success);
        console.log('📦 Response.code:', (response as any).code);
        console.log('📦 Response.id:', (response as any).id);
        
        // Handle both wrapped and raw response formats
        const isSuccess = response.success !== undefined ? response.success : !!response;
        console.log('📦 isSuccess (final):', isSuccess);
        
        if (isSuccess) {
          console.log('✔️ Tạo khoa thành công');
          toastRef.current?.show({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Thêm khoa mới thành công',
          });
          setDepartmentDialogVisible(false);
          await loadDepartments();
        } else {
          console.error('❌ Tạo khoa thất bại:', (response as any).message);
          toastRef.current?.show({
            severity: 'error',
            summary: 'Lỗi',
            detail: (response as any).message || 'Không thể thêm khoa',
          });
        }
      }
    } catch (error) {
      console.error('❌ Lỗi khi lưu khoa:', error);
      console.error('Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
      });
      toastRef.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể lưu khoa',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteDepartment = (dept: Department) => {
    confirmDialog({
      message: `Bạn có chắc chắn muốn xóa khoa "${dept.name}"?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          if (!dept.id || !dept.schoolId) return;
          console.log('🗑️ Xóa khoa:', dept.id, 'từ trường:', dept.schoolId);
          const response = await schoolService.deleteDepartment(dept.schoolId, dept.id);
          console.log('📦 Delete department response:', response);
          // Handle both wrapped and raw response formats
          const isSuccess = response.success !== undefined ? response.success : !!response;
          if (isSuccess) {
            console.log('✔️ Xóa khoa thành công');
            toastRef.current?.show({
              severity: 'success',
              summary: 'Thành công',
              detail: 'Xóa khoa thành công',
            });
            loadDepartments();
          } else {
            console.error('❌ Xóa khoa thất bại:', (response as any).message);
            toastRef.current?.show({
              severity: 'error',
              summary: 'Lỗi',
              detail: (response as any).message || 'Không thể xóa khoa',
            });
          }
        } catch (error) {
          console.error('❌ Lỗi khi xóa khoa:', error);
          toastRef.current?.show({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể xóa khoa',
          });
        }
      },
    });
  };

  const actionBodyTemplate = (rowData: School | Department) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-pencil"
        className="p-button-rounded p-button-warning"
        onClick={() => {
          if ('schoolId' in rowData) {
            openEditDepartmentDialog(rowData as Department);
          } else {
            openEditSchoolDialog(rowData as School);
          }
        }}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-danger"
        onClick={() => {
          if ('schoolId' in rowData) {
            deleteDepartment(rowData as Department);
          } else {
            deleteSchool(rowData as School);
          }
        }}
      />
    </div>
  );

  return (
    <div className="admin-school-management">
      <Toast ref={toastRef} />
      <ConfirmDialog />

      <div>
        <TabView>
          {/* Schools Tab */}
          <TabPanel header="Trường" leftIcon="pi pi-building">
            <div className="tab-toolbar">
              <Button
                label="Thêm trường"
                icon="pi pi-plus"
                className="p-button-success"
                onClick={openNewSchoolDialog}
              />
            </div>

            <DataTable
              value={schools}
              loading={loading}
              responsiveLayout="scroll"
              paginator
              rows={10}
              dataKey="id"
              emptyMessage="Không có trường nào"
            >
              <Column field="name" header="Tên trường" />
              <Column body={(rowData) => actionBodyTemplate(rowData)} header="Hành động" style={{ textAlign: 'center' }} />
            </DataTable>
          </TabPanel>

          {/* Departments Tab */}
          <TabPanel header="Khoa" leftIcon="pi pi-sitemap">
            <div className="tab-toolbar">
              <div className="form-group" style={{ marginBottom: '1rem', marginRight: '1rem', minWidth: '300px' }}>
                <label htmlFor="deptSchoolSelect" style={{ marginRight: '0.5rem' }}>Chọn trường:</label>
                <Dropdown
                  id="deptSchoolSelect"
                  value={selectedSchool?.id || null}
                  onChange={(e) => {
                    console.log('🔄 School selection changed');
                    console.log('   Giá trị mới:', e.value);
                    const selected = schools.find(s => s.id === e.value) || null;
                    console.log('   Selected school:', selected);
                    setSelectedSchool(selected);
                    if (selected?.id) {
                      console.log('🔄 Gọi loadDepartments với schoolId:', selected.id);
                      loadDepartments(selected.id);
                    } else {
                      console.log('⚠️ Không có school được chọn, xóa departments');
                      setDepartments([]);
                    }
                  }}
                  options={schools.map(s => ({ label: s.name, value: s.id }))}
                  placeholder="Chọn trường để xem khoa"
                  style={{ width: '100%' }}
                />
              </div>
              <Button
                label="Thêm khoa"
                icon="pi pi-plus"
                className="p-button-success"
                onClick={() => {
                  console.log('🔄 Mở dialog thêm khoa');
                  console.log('   selectedSchool:', selectedSchool);
                  if (!selectedSchool?.id) {
                    console.warn('⚠️ Không có trường được chọn');
                    toastRef.current?.show({
                      severity: 'warn',
                      summary: 'Cảnh báo',
                      detail: 'Vui lòng chọn trường trước',
                    });
                    return;
                  }
                  openNewDepartmentDialog();
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                {selectedSchool 
                  ? `📍 Trường: ${selectedSchool.name} - Tổng khoa: ${departments.length}` 
                  : '⚠️ Vui lòng chọn trường để xem danh sách khoa'}
              </p>
            </div>

            <DataTable
              value={departments}
              loading={loading}
              responsiveLayout="scroll"
              paginator
              rows={10}
              dataKey="id"
              emptyMessage={selectedSchool ? "Không có khoa nào" : "Vui lòng chọn trường"}
            >
              <Column field="name" header="Tên khoa" />
              <Column field="code" header="Mã khoa" />
              <Column body={(rowData) => actionBodyTemplate(rowData)} header="Hành động" style={{ textAlign: 'center' }} />
            </DataTable>
          </TabPanel>
        </TabView>
      </div>

      {/* School Dialog */}
      <Dialog
        visible={schoolDialogVisible}
        onHide={() => setSchoolDialogVisible(false)}
        header={editingSchool ? 'Sửa trường' : 'Thêm trường mới'}
        modal
        style={{ width: '50vw' }}
        breakpoints={{ '960px': '75vw', '640px': '90vw' }}
      >
        <div className="form-group-list">
          <div className="form-group">
            <label htmlFor="schoolName">Tên trường *</label>
            <InputText
              id="schoolName"
              value={schoolForm.name}
              onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
              placeholder="Nhập tên trường"
            />
          </div>
        </div>

        <div className="dialog-footer">
          <Button
            label="Hủy"
            icon="pi pi-times"
            onClick={() => setSchoolDialogVisible(false)}
            className="p-button-secondary"
          />
          <Button
            label="Lưu"
            icon="pi pi-check"
            onClick={saveSchool}
            loading={loading}
          />
        </div>
      </Dialog>

      {/* Department Dialog */}
      <Dialog
        visible={departmentDialogVisible}
        onHide={() => {
          console.log('🔄 Đóng Department Dialog');
          setDepartmentDialogVisible(false);
        }}
        header={editingDepartment ? 'Sửa khoa' : 'Thêm khoa mới'}
        modal
        style={{ width: '50vw' }}
        breakpoints={{ '960px': '75vw', '640px': '90vw' }}
      >
        <div className="form-group-list">
          <div className="form-group">
            <label htmlFor="deptSchool">Trường *</label>
            <Dropdown
              id="deptSchool"
              value={departmentForm.schoolId}
              onChange={(e) => {
                console.log('🔄 Thay đổi trường trong form');
                console.log('   Giá trị mới:', e.value);
                setDepartmentForm({ ...departmentForm, schoolId: e.value });
              }}
              options={schools.map(s => ({ label: s.name, value: s.id }))}
              placeholder="Chọn trường"
            />
          </div>

          <div className="form-group">
            <label htmlFor="deptName">Tên khoa *</label>
            <InputText
              id="deptName"
              value={departmentForm.name}
              onChange={(e) => {
                console.log('🔄 Thay đổi tên khoa:', e.target.value);
                setDepartmentForm({ ...departmentForm, name: e.target.value });
              }}
              placeholder="Nhập tên khoa"
            />
          </div>
        </div>

        <div className="dialog-footer">
          <Button
            label="Hủy"
            icon="pi pi-times"
            onClick={() => {
              console.log('🔄 Hủy Department Dialog');
              setDepartmentDialogVisible(false);
            }}
            className="p-button-secondary"
          />
          <Button
            label="Lưu"
            icon="pi pi-check"
            onClick={() => {
              console.log('💾 Lưu khoa');
              console.log('   Form data:', departmentForm);
              console.log('   Editing existing:', !!editingDepartment);
              saveDepartment();
            }}
            loading={loading}
          />
        </div>
      </Dialog>
    </div>
  );
}
