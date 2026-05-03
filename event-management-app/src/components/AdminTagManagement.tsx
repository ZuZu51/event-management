import { useRef } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import AdminSchoolManagement from "./AdminSchoolManagement";
import AdminCategoryManagement from "./AdminCategoryManagement";
import "../styles/AdminUserManagement.css";
import "../styles/AdminUserManagement.css";
export default function AdminTagManagement() {
  const toastRef = useRef<Toast>(null);

  return (
    <div className="page-wrapper">
      <Toast ref={toastRef} />
      <ConfirmDialog />

      <div className="header-page">
        <h1>Quản lý danh mục</h1>
        <div style={{ width: "40px" }} /> {/* Spacer for centering */}
      </div>

      <div className="page-content">
        <TabView className="data-tabs">

          {/* ===== TAB 6: SCHOOL & DEPARTMENT MANAGEMENT =====  */}
          <TabPanel
            header="Quản lý danh mục trường"
            leftIcon="pi pi-building"
          >
            <AdminSchoolManagement />
          </TabPanel>

          {/* ===== TAB 7: EVENT CATEGORY MANAGEMENT =====  */}
          <TabPanel
            header="Quản lý danh mục sự kiện"
            leftIcon="pi pi-list"
          >
            <AdminCategoryManagement />
          </TabPanel>
        </TabView>
      </div>



    </div>
  );
}
