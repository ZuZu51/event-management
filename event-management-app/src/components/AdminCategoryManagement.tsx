import { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { InputSwitch } from 'primereact/inputswitch';
import { schoolService } from '../services/schoolService';
import type { EventCategory } from '../services/schoolService';
import '../styles/adminCategoryManagement.css';

export default function AdminCategoryManagement() {
  const toastRef = useRef<Toast>(null);

  // State
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<EventCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form Data
  const [categoryForm, setCategoryForm] = useState<EventCategory>({
    label: '',
    value: '',
    active: true,
  });

  // Load data on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      console.log('🔄 Bắt đầu tải danh sách danh mục sự kiện...');
      const response = await schoolService.getAllCategories();
      console.log('📦 Response từ API getAllCategories:', response);
      console.log('📊 Loại response:', typeof response);
      console.log('🔍 Là array:', Array.isArray(response));
      console.log('✅ response.success:', response.success);
      console.log('📋 response.data:', response.data);
      console.log('💬 response.message:', response.message);
      
      // Check if response is array (raw data) or wrapped object
      const categoryData = Array.isArray(response) ? response : response.data;
      
      if (categoryData && Array.isArray(categoryData)) {
        console.log('✔️ Đã tải thành công', categoryData.length, 'danh mục sự kiện');
        setCategories(categoryData);
      } else {
        console.error('❌ Tải danh mục thất bại:', response.message || 'Dữ liệu không hợp lệ');
        toastRef.current?.show({
          severity: 'error',
          summary: 'Lỗi',
          detail: (response as any).message || 'Không thể tải danh mục sự kiện',
        });
      }
    } catch (error) {
      console.error('❌ Lỗi khi tải danh mục sự kiện:', error);
      console.error('Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack,
      });
      console.error('Full error object:', error);
      toastRef.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải danh mục sự kiện',
      });
    } finally {
      setLoading(false);
    }
  };

  const openNewCategoryDialog = () => {
    setEditingCategory(null);
    setCategoryForm({
      label: '',
      value: '',
      active: true,
    });
    setDialogVisible(true);
  };

  const openEditCategoryDialog = (category: EventCategory) => {
    setEditingCategory(category);
    setCategoryForm({ ...category });
    setDialogVisible(true);
  };

  const saveCategory = async () => {
    if (!categoryForm.label || !categoryForm.value) {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng điền đầy đủ thông tin bắt buộc',
      });
      return;
    }

    // Validate value format (uppercase, no spaces)
    const valuePattern = /^[A-Z_]+$/;
    if (!valuePattern.test(categoryForm.value)) {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Mã danh mục chỉ được chứa chữ hoa và dấu gạch dưới',
      });
      return;
    }

    try {
      setLoading(true);
      if (editingCategory?.id) {
        console.log('📝 Cập nhật danh mục:', editingCategory.id, categoryForm);
        const response = await schoolService.updateCategory(editingCategory.id, categoryForm);
        console.log('📦 Update category response:', response);
        // Handle both wrapped and raw response formats
        const isSuccess = response.success !== undefined ? response.success : !!response;
        if (isSuccess) {
          console.log('✔️ Cập nhật danh mục thành công');
          toastRef.current?.show({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật danh mục thành công',
          });
          loadCategories();
        } else {
          console.error('❌ Cập nhật danh mục thất bại:', (response as any).message);
          toastRef.current?.show({
            severity: 'error',
            summary: 'Lỗi',
            detail: (response as any).message || 'Không thể cập nhật danh mục',
          });
        }
      } else {
        console.log('➕ Tạo danh mục mới:', categoryForm);
        const response = await schoolService.createCategory(categoryForm);
        console.log('📦 Create category response:', response);
        // Handle both wrapped and raw response formats
        const isSuccess = response.success !== undefined ? response.success : !!response;
        if (isSuccess) {
          console.log('✔️ Tạo danh mục thành công');
          toastRef.current?.show({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Thêm danh mục mới thành công',
          });
          loadCategories();
        } else {
          console.error('❌ Tạo danh mục thất bại:', (response as any).message);
          toastRef.current?.show({
            severity: 'error',
            summary: 'Lỗi',
            detail: (response as any).message || 'Không thể thêm danh mục',
          });
        }
      }
      setDialogVisible(false);
    } catch (error) {
      console.error('Error saving category:', error);
      toastRef.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể lưu danh mục',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = (category: EventCategory) => {
    confirmDialog({
      message: `Bạn có chắc chắn muốn xóa danh mục "${category.label}"?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          if (!category.id) {
            console.log('⚠️ Không có ID danh mục, bỏ qua xóa');
            return;
          }
          console.log('🗑️ Xóa danh mục:', category.id);
          const response = await schoolService.deleteCategory(category.id);
          console.log('📦 Delete category response:', response);
          // Handle both wrapped and raw response formats
          const isSuccess = response.success !== undefined ? response.success : !!response;
          if (isSuccess) {
            console.log('✔️ Xóa danh mục thành công');
            toastRef.current?.show({
              severity: 'success',
              summary: 'Thành công',
              detail: 'Xóa danh mục thành công',
            });
            loadCategories();
          } else {
            console.error('❌ Xóa danh mục thất bại:', (response as any).message);
            toastRef.current?.show({
              severity: 'error',
              summary: 'Lỗi',
              detail: (response as any).message || 'Không thể xóa danh mục',
            });
          }
        } catch (error) {
          console.error('❌ Lỗi khi xóa danh mục:', error);
          console.error('Error details:', {
            name: (error as Error).name,
            message: (error as Error).message,
          });
          toastRef.current?.show({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể xóa danh mục',
          });
        }
      },
    });
  };

  

  const actionBodyTemplate = (rowData: EventCategory) => (
    <div className="flex items-center gap-2">
      <Button
        icon="pi pi-pencil"
        className="p-button-rounded p-button-warning"
        onClick={() => openEditCategoryDialog(rowData)}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-danger"
        onClick={() => deleteCategory(rowData)}
      />
    </div>
  );

  const filteredCategories = categories.filter(c =>
    c.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-category-management">
      <Toast ref={toastRef} />
      <ConfirmDialog />

      <div>
        <div className="toolbar">
          <div className="toolbar-search">
            <InputText
              placeholder="Tìm kiếm danh mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <Button
            label="Thêm danh mục"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={openNewCategoryDialog}
          />
        </div>

        <DataTable
          value={filteredCategories}
          loading={loading}
          responsiveLayout="scroll"
          paginator
          rows={10}
          dataKey="id"
          emptyMessage="Không có danh mục nào"
          className="category-table"
        >
          <Column field="label" header="Tên danh mục" />
          <Column field="value" header="Mã danh mục" />
          
          <Column body={actionBodyTemplate} header="Hành động" style={{ textAlign: 'center', width: '120px' }} />
        </DataTable>
      </div>

      {/* Category Dialog */}
      <Dialog
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        header={editingCategory ? 'Sửa danh mục sự kiện' : 'Thêm danh mục sự kiện mới'}
        modal
        style={{ width: '50vw' }}
        breakpoints={{ '960px': '75vw', '640px': '90vw' }}
      >
        <div className="form-group-list">
          <div className="form-group">
            <label htmlFor="categoryLabel">Tên danh mục *</label>
            <InputText
              id="categoryLabel"
              value={categoryForm.label}
              onChange={(e) => setCategoryForm({ ...categoryForm, label: e.target.value })}
              placeholder="Ví dụ: Workshop (Hội thảo thực hành)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="categoryValue">Mã danh mục (chỉ chứa chữ hoa và _) *</label>
            <InputText
              id="categoryValue"
              value={categoryForm.value}
              onChange={(e) => setCategoryForm({ ...categoryForm, value: e.target.value.toUpperCase() })}
              placeholder="Ví dụ: WORKSHOP"
            />
          </div>

         
        </div>

        <div className="dialog-footer">
          <Button
            label="Hủy"
            icon="pi pi-times"
            onClick={() => setDialogVisible(false)}
            className="p-button-secondary"
          />
          <Button
            label="Lưu"
            icon="pi pi-check"
            onClick={saveCategory}
            loading={loading}
          />
        </div>
      </Dialog>
    </div>
  );
}
