import { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Calendar } from "primereact/calendar";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import type { User } from "../types/User";
import {
  adminService,
  type RegistrationHistoryDTO,
  type PaymentHistoryDTO,
  type AttendanceHistoryDTO,
  type EventHistoryDTO,
} from "../services/adminService";
import AdminSchoolManagement from "./AdminSchoolManagement";
import AdminCategoryManagement from "./AdminCategoryManagement";
import { formatDateToDDMMYYYY, formatDateTimeToDDMMYYYYHHmm } from "../common/helper/dateHelper";
import "../styles/AdminUserManagement.css";

export default function AdminUserManagement() {
  const toastRef = useRef<Toast>(null);

  // User Management State
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [userDetailDialogVisible, setUserDetailDialogVisible] = useState(false);
  const [editData, setEditData] = useState<Partial<User>>({});
  const [searchTerm, setSearchTerm] = useState("");

  // History States
  const [registrations, setRegistrations] = useState<RegistrationHistoryDTO[]>(
    []
  );
  const [payments, setPayments] = useState<PaymentHistoryDTO[]>([]);
  const [attendances, setAttendances] = useState<AttendanceHistoryDTO[]>([]);
  const [eventHistories, setEventHistories] = useState<EventHistoryDTO[]>([]);

  // User-specific History States
  const [userRegistrations, setUserRegistrations] = useState<RegistrationHistoryDTO[]>([]);
  const [userPayments, setUserPayments] = useState<PaymentHistoryDTO[]>([]);
  const [userAttendances, setUserAttendances] = useState<AttendanceHistoryDTO[]>([]);
  const [userEvents, setUserEvents] = useState<EventHistoryDTO[]>([]);

  // Filter States
  const [dateRangeStart, setDateRangeStart] = useState<Date | null>(null);
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | null>(null);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string | null>(null);
  const [registrationStatusFilter, setRegistrationStatusFilter] = useState<string | null>(null);
  const [eventActionFilter, setEventActionFilter] = useState<string | null>(null);

  // Loading State
  const [loading, setLoading] = useState(true);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const authData = localStorage.getItem("token");
    if (!authData) {
      toastRef.current?.show({
        severity: "error",
        summary: "Unauthorized",
        detail: "Please login as admin",
      });
      return;
    }

    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [usersData, registrationsData, paymentsData, attendancesData, eventHistoriesData] =
        await Promise.all([
          adminService.getAllUsers(),
          adminService.getRegistrationHistory(),
          adminService.getPaymentHistory(),
          adminService.getAttendanceHistory(),
          adminService.getEventManagementHistory(),
        ]);

      setUsers(usersData);
      setRegistrations(registrationsData);
      setPayments(paymentsData);
      setAttendances(attendancesData);
      setEventHistories(eventHistoriesData);
    } catch (error) {
      console.error("Error loading data:", error);
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load data. Please refresh the page.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ===== USER MANAGEMENT HANDLERS =====
  const loadUserDetail = async (user: User) => {
    setLoadingUserDetail(true);
    try {
      const [regData, payData, attData, eventData] = await Promise.all([
        adminService.getUserRegistrationHistory(user.id),
        adminService.getUserPaymentHistory(user.id),
        adminService.getUserAttendanceHistory(user.id),
        adminService.getUserEventHistory(user.id),
      ]);

      setUserRegistrations(regData);
      setUserPayments(payData);
      setUserAttendances(attData);
      setUserEvents(eventData);
    } catch (error) {
      console.error("Error loading user detail:", error);
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load user details",
      });
    } finally {
      setLoadingUserDetail(false);
    }
  };

  const handleViewUserDetail = async (user: User) => {
    setSelectedUser(user);
    setUserDetailDialogVisible(true);
    await loadUserDetail(user);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditData({ ...user });
    setEditDialogVisible(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      const updated = (await adminService.updateUserRole(
        selectedUser.id,
        editData.role as "ADMIN" | "TEACHER" | "STUDENT"
      )) as User;

      setUsers(users.map((u) => (u.id === updated.id ? updated : u)));
      setEditDialogVisible(false);

      toastRef.current?.show({
        severity: "success",
        summary: "Success",
        detail: "User role updated successfully",
      });
    } catch (error) {
      console.error("Error updating user:", error);
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to update user",
      });
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const updated = (await adminService.toggleUserStatus(user.id)) as User;
      setUsers(users.map((u) => (u.id === updated.id ? updated : u)));

      toastRef.current?.show({
        severity: "success",
        summary: "Success",
        detail: `User ${updated.active ? "activated" : "deactivated"} successfully`,
      });
    } catch (error) {
      console.error("Error toggling status:", error);
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to update user status",
      });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    confirmDialog({
      message: "Are you sure you want to delete this user?",
      header: "Confirm",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        try {
          await adminService.deleteUser(userId);
          setUsers(users.filter((u) => u.id !== userId));

          toastRef.current?.show({
            severity: "success",
            summary: "Success",
            detail: "User deleted successfully",
          });
        } catch (error) {
          console.error("Error deleting user:", error);
          toastRef.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Failed to delete user",
          });
        }
      },
    });
  };

  // ===== TEMPLATE FUNCTIONS =====
  const statusTemplate = (rowData: User) => {
    return (
      <Tag
        value={rowData.active ? "Active" : "Inactive"}
        severity={rowData.active ? "success" : "warning"}
      />
    );
  };

  const actionTemplate = (rowData: User) => (
    <div className="action-buttons">
      <Button
        icon="pi pi-pencil"
        className="p-button-rounded p-button-info p-mr-2"
        onClick={() => handleEditUser(rowData)}
        title="Edit"
      />
      <Button
        icon={rowData.active ? "pi pi-lock" : "pi pi-lock-open"}
        className={`p-button-rounded p-mr-2 ${rowData.active ? "p-button-warning" : "p-button-success"}`}
        onClick={() => handleToggleStatus(rowData)}
        title={rowData.active ? "Lock" : "Unlock"}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-danger"
        onClick={() => handleDeleteUser(rowData.id)}
        title="Delete"
      />
    </div>
  );

  const registrationStatusTemplate = (rowData: RegistrationHistoryDTO) => {
    const statusColors: Record<
      string,
      "success" | "warning" | "info" | "danger"
    > = {
      VALID: "success",
      USED: "info",
      EXPIRED: "warning",
      CANCELLED: "danger",
    };
    return (
      <Tag
        value={rowData.status}
        severity={statusColors[rowData.status] || "secondary"}
      />
    );
  };

  const paymentStatusTemplate = (rowData: PaymentHistoryDTO) => {
    const statusColors: Record<
      string,
      "success" | "warning" | "info" | "danger"
    > = {
      COMPLETED: "success",
      PENDING: "warning",
      FAILED: "danger",
      REFUNDED: "info",
    };
    return (
      <Tag
        value={rowData.status}
        severity={statusColors[rowData.status] || "secondary"}
      />
    );
  };

  const amountTemplate = (rowData: PaymentHistoryDTO) => {
    return (
      <span>
        {new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(rowData.amount)}
      </span>
    );
  };

  const attendanceStatusTemplate = (rowData: AttendanceHistoryDTO) => {
    return (
      <Tag
        value={rowData.attendanceStatus}
        severity={
          rowData.attendanceStatus === "CHECKED_IN" ? "success" : "info"
        }
      />
    );
  };

  const eventActionTemplate = (rowData: EventHistoryDTO) => {
    const actionColors: Record<string, "success" | "warning" | "info"> = {
      CREATE: "success",
      UPDATE: "warning",
      DELETE: "info",
    };
    return (
      <Tag
        value={rowData.actionType}
        severity={
          (actionColors[rowData.actionType] as "success" | "warning" | "info") ||
          "info"
        }
      />
    );
  };

  const dateTemplate = (rowData: {
    registrationDate?: string;
    paymentDate?: string;
    checkInTime?: string;
    actionDate?: string;
  }) => {
    const dateStr =
      rowData.registrationDate ||
      rowData.paymentDate ||
      rowData.checkInTime ||
      rowData.actionDate;
    if (!dateStr) return "-";
    return formatDateTimeToDDMMYYYYHHmm(dateStr);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter functions for history
  const filterByDateRange = <T extends { registrationDate?: string; paymentDate?: string; checkInTime?: string; actionDate?: string }>(items: T[]): T[] => {
    if (!dateRangeStart || !dateRangeEnd) return items;
    return items.filter((item) => {
      const itemDate = new Date(
        item.registrationDate || item.paymentDate || item.checkInTime || item.actionDate || ""
      );
      return itemDate >= dateRangeStart && itemDate <= dateRangeEnd;
    });
  };

  const getFilteredPayments = (): PaymentHistoryDTO[] => {
    let filtered = filterByDateRange<PaymentHistoryDTO>(payments);
    if (paymentStatusFilter) {
      filtered = filtered.filter((p) => p.status === paymentStatusFilter);
    }
    return filtered;
  };

  const getFilteredRegistrations = (): RegistrationHistoryDTO[] => {
    let filtered = filterByDateRange<RegistrationHistoryDTO>(registrations);
    if (registrationStatusFilter) {
      filtered = filtered.filter((r) => r.status === registrationStatusFilter);
    }
    // Apply user search filter
    if (searchTerm) {
      filtered = filtered.filter((r) =>
        r.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  };

  const getFilteredAttendances = (): AttendanceHistoryDTO[] => {
    let filtered = filterByDateRange<AttendanceHistoryDTO>(attendances);
    // Apply user search filter
    if (searchTerm) {
      filtered = filtered.filter((a) =>
        a.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  };

  const getFilteredEventHistories = (): EventHistoryDTO[] => {
    let filtered = filterByDateRange<EventHistoryDTO>(eventHistories);
    if (eventActionFilter) {
      filtered = filtered.filter((e) => e.actionType === eventActionFilter);
    }
    return filtered;
  };

  // User detail calculated values
  const getUserStats = () => {
    if (!selectedUser) return { registrations: 0, payments: 0, totalAmount: 0, attendances: 0 };
    return {
      registrations: userRegistrations.length,
      payments: userPayments.filter((p) => p.status === "COMPLETED").length,
      totalAmount: userPayments
        .filter((p) => p.status === "COMPLETED")
        .reduce((sum, p) => sum + p.amount, 0),
      attendances: userAttendances.length,
      eventCreated: userEvents.filter((e) => e.actionType === "CREATE").length,
      eventUpdated: userEvents.filter((e) => e.actionType === "UPDATE").length,
    };
  };

  return (
    <div className="page-wrapper">
      <Toast ref={toastRef} />
      <ConfirmDialog />

      <div className="header-page">
        <h1>Quản lý tài khoản người dùng</h1>
        <div style={{ width: "40px" }} /> {/* Spacer for centering */}
      </div>

      <div className="page-content">
        <div className="search-section">
          <InputText
            placeholder="Tìm kiếm người dùng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <Button
            label="Tải lại"
            icon="pi pi-refresh"
            onClick={loadAllData}
            loading={loading}
          />
        </div>

        <TabView className="data-tabs">
          {/* ===== TAB 1: USERS =====  */}
          <TabPanel header="Người dùng" leftIcon="pi pi-users">


            <DataTable
              value={filteredUsers}
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 20]}
              loading={loading}
              className="data-table"
            >
              <Column field="id" header="ID" style={{ width: "80px" }} />
              <Column field="name" header="Tên" style={{ width: "150px" }} />
              <Column field="email" header="Email" style={{ width: "200px" }} />
              <Column
                field="role"
                header="Vai trò"
                style={{ width: "100px" }}
                body={(rowData: User) => (
                  <Tag
                    value={rowData.role}
                    severity={
                      rowData.role === "ADMIN"
                        ? "danger"
                        : rowData.role === "TEACHER"
                          ? "warning"
                          : "success"
                    }
                  />
                )}
              />
              <Column
                field="active"
                header="Trạng thái"
                style={{ width: "110px" }}
                body={statusTemplate}
              />
              <Column
                field="createdAt"
                header="Tạo ngày"
                style={{ width: "180px" }}
                body={(rowData: User) =>
                  formatDateTimeToDDMMYYYYHHmm(rowData.createdAt)
                }
              />
              <Column
                body={actionTemplate}
                header="Hành động"
                style={{ textAlign: "center", width: "200px" }}
              />
            </DataTable>
          </TabPanel>

          {/* ===== TAB 2: REGISTRATION HISTORY =====  */}
          <TabPanel
            header="Lịch sử đăng ký"
            leftIcon="pi pi-ticket"
          >

            <DataTable
              value={getFilteredRegistrations()}
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 20]}
              loading={loading}
              className="data-table"
            >
              <Column field="userName" header="Người dùng" />
              <Column field="userEmail" header="Email" />
              <Column field="eventName" header="Sự kiện" />
              <Column
                field="registrationDate"
                header="Ngày đăng ký"
                body={dateTemplate}
              />

            </DataTable>
          </TabPanel>


          {/* ===== TAB 4: ATTENDANCE HISTORY =====  */}
          <TabPanel header="Lịch sử Check-in/out" leftIcon="pi pi-check-circle">

            <DataTable
              value={getFilteredAttendances()}
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 20]}
              loading={loading}
              className="data-table"
            >
              <Column field="userName" header="Người dùng" />
              <Column field="userEmail" header="Email" />
              <Column field="eventName" header="Sự kiện" />
              <Column
                field="checkInTime"
                header="Thời gian check-in"
                body={dateTemplate}
              />
              <Column
                field="checkOutTime"
                header="Thời gian check-out"
                body={(rowData: AttendanceHistoryDTO) =>
                  rowData.checkOutTime
                    ? formatDateTimeToDDMMYYYYHHmm(rowData.checkOutTime)
                    : "-"
                }
              />

              <Column
                field="attendanceStatus"
                header="Trạng thái"
                body={attendanceStatusTemplate}
              />
            </DataTable>
          </TabPanel>

          {/* ===== TAB 5: EVENT MANAGEMENT HISTORY =====  */}
          <TabPanel
            header="Lịch sử sự kiện"
            leftIcon="pi pi-calendar"
          >

            <DataTable
              value={getFilteredEventHistories()}
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 20]}
              loading={loading}
              className="data-table"
            >
              <Column field="creatorName" header="Người tạo/chỉnh sửa" />
              <Column field="eventName" header="Sự kiện" />
              <Column
                field="actionType"
                header="Hành động"
                body={eventActionTemplate}
              />
              <Column
                field="actionDate"
                header="Ngày thực hiện"
                body={dateTemplate}
              />
              <Column
                field="eventStatus"
                header="Trạng thái sự kiện"
                body={(rowData: EventHistoryDTO) => (
                  <Tag
                    value={rowData.eventStatus}
                    severity={
                      rowData.eventStatus === "COMPLETED"
                        ? "success"
                        : rowData.eventStatus === "ONGOING"
                          ? "warning"
                          : "info"
                    }
                  />
                )}
              />
            </DataTable>
          </TabPanel>
        </TabView>



        {/* ===== EDIT USER DIALOG =====  */}
        <Dialog
          visible={editDialogVisible}
          onHide={() => setEditDialogVisible(false)}
          header="Chỉnh sửa thông tin người dùng"
          modal
          style={{ width: "50vw" }}
        >
          {selectedUser && (
            <div className="edit-dialog-content">
              <div className="form-group">
                <label>ID</label>
                <InputText
                  value={selectedUser.id.toString()}
                  disabled
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Tên</label>
                <InputText
                  value={selectedUser.name}
                  disabled
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <InputText
                  value={selectedUser.email}
                  disabled
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Vai trò</label>
                <Dropdown
                  value={editData.role}
                  onChange={(e) => setEditData({ ...editData, role: e.value })}
                  options={[
                    { label: "Admin", value: "ADMIN" },
                    { label: "Giáo viên", value: "TEACHER" },
                    { label: "Sinh viên", value: "STUDENT" },
                  ]}
                  className="form-input"
                  placeholder="Chọn vai trò"
                />
              </div>

              <div className="form-actions">
                <Button
                  label="Lưu"
                  icon="pi pi-check"
                  onClick={handleSaveUser}
                  className="p-button-success"
                />
                <Button
                  label="Hủy"
                  icon="pi pi-times"
                  onClick={() => setEditDialogVisible(false)}
                  className="p-button-secondary"
                />
              </div>
            </div>
          )}
        </Dialog>
      </div>


    </div>
  );
}
