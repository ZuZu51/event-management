import { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Paginator } from "primereact/paginator";
import { ProgressSpinner } from "primereact/progressspinner";
import { Tag } from "primereact/tag";
import { localStorageHelper } from "../common/helper/localStorageHelper";
import { getUserEvents } from "../services/EventService";
import { formatDateToDDMMYYYY } from "../common/helper/dateHelper";
import type { UserEventDTO } from "../types/Event";
import "../styles/history.css";


/**
 * Helpers to safely parse and format different date/time formats:
 * - "YYYY-MM-DD" (date only)
 * - "HH:mm" or "HH:mm:ss" (time only)
 * - "YYYY-MM-DD HH:mm:ss" (space between date/time)
 * - "YYYY-MM-DDTHH:mm:ss" (ISO)
 * - "DD/MM/YYYY HH:mm" (your checkIn/checkOut)
 */
const parseDMY_HM = (s: string): Date | null => {
  // "29/10/2025 20:23" -> day/month/year hour:minute
  const m = s.match(
    /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/
  );
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]) - 1;
  const year = Number(m[3]);
  const hour = Number(m[4]);
  const minute = Number(m[5]);
  const second = m[6] ? Number(m[6]) : 0;
  return new Date(year, month, day, hour, minute, second);
};

const parseISOish = (s: string): Date | null => {
  // Normalize "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm:ss"
  if (!s) return null;
  let normalized = s.trim();
  // If already contains 'T', try direct
  if (normalized.indexOf("T") === -1 && normalized.indexOf(" ") !== -1) {
    normalized = normalized.replace(" ", "T");
  }
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
};

const formatToLocale = (d: Date): string =>
  d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const formatDateOnly = (s?: string) => {
  if (!s) return "-";
  // "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return formatDateToDDMMYYYY(s);
  }
  // try parse ISO-ish
  const d = parseISOish(s);
  return d ? formatDateToDDMMYYYY(d) : "-";
};

const formatTimeOnly = (s?: string) => {
  if (!s) return "-";
  // HH:mm or HH:mm:ss
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(s)) return s.slice(0, 5);
  // maybe it's a datetime -> parse
  const d = parseISOish(s) || parseDMY_HM(s);
  return d
    ? d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : "-";
};

const formatAnyDateTime = (value?: string) => {
  if (!value) return "-";

  // If it's only time "08:30" or "08:30:00"
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
    return value.slice(0, 5);
  }

  // Try DD/MM/YYYY HH:mm (your checkIn/checkOut)
  const dmy = parseDMY_HM(value);
  if (dmy) return formatToLocale(dmy);

  // Try ISO-ish parse (including "YYYY-MM-DD HH:mm:ss" after normalization)
  const iso = parseISOish(value);
  if (iso) return formatToLocale(iso);

  // If value is date-only "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return formatDateOnly(value);
  }

  return "-";
};

function History() {
  const [events, setEvents] = useState<UserEventDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(5);

  // 👤 Lấy userId từ localStorage
  const userId = Number(localStorageHelper.getItem("idUser") || 1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getUserEvents(userId);
        setEvents(res || []);
      } catch (error) {
        console.error("❌ Lỗi tải lịch sử sự kiện:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const paginatedData = events.slice(first, first + rows);

  const statusTemplate = (rowData: UserEventDTO) => {
    const raw = String(rowData.status ?? "");
    let label = raw;
    let severity: "success" | "info" | "warning" | "danger" = "warning";
    
    switch (raw) {
      case "0":
        label = "Đã đăng ký";
        severity = "warning";
        break;
      case "1":
        label = "Đã check-in";
        severity = "success";
        break;
      case "2":
        label = "Đã check-out";
        severity = "info";
        break;
      case "CANCELLED":
      case "cancelled":
        label = "Đã huỷ";
        severity = "danger";
        break;
      default:
        label = raw.toUpperCase();
        break;
    }
    
    return <Tag value={label} severity={severity} />;
  };

  const invitationTemplate = (rowData: UserEventDTO) => {
    if (!rowData.invitationStatus) {
      return <span style={{ color: "#999" }}>-</span>;
    }

    const statusMap: Record<string, { label: string; severity: string }> = {
      PENDING: { label: "Chờ xác nhận", severity: "warning" },
      ACCEPTED: { label: "Đã chấp nhận", severity: "success" },
      REJECTED: { label: "Từ chối", severity: "danger" },
      EXPIRED: { label: "Hết hạn", severity: "info" },
    };

    const status =
      statusMap[rowData.invitationStatus] || {
        label: rowData.invitationStatus,
        severity: "info",
      };

    return <Tag value={status.label} severity={status.severity} />;
  };

  return (
    
    <div className="history-container">
      
      <h2 className="history-title">
              Lịch sử tham gia sự kiện
      </h2>
      {/* Card Header */}
      <div className="history-card">
        <div className="history-header">
          <div>
            
            <p className="history-subtitle">
              Xem danh sách tất cả sự kiện bạn đã tham gia
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="history-loading">
            <ProgressSpinner />
          </div>
        ) : (
          <>
            {/* DataTable */}
            <div className="history-table-wrapper">
              <DataTable
                value={paginatedData}
                paginator={false}
                stripedRows
                emptyMessage="Không có sự kiện nào."
                className="history-table"
              >
                <Column
                  field="eventName"
                  header="Tên sự kiện"
                  style={{ minWidth: "250px" }}
                />
                <Column
                  header="Ngày"
                  body={(rowData) => formatDateOnly(rowData.date)}
                  style={{ minWidth: "100px" }}
                />
                <Column
                  header="Giờ bắt đầu"
                  body={(rowData) => formatTimeOnly(rowData.startTime)}
                  style={{ minWidth: "100px" }}
                />
                <Column
                  field="location"
                  header="Địa điểm"
                  style={{ minWidth: "150px" }}
                />
                <Column
                  field="status"
                  header="Trạng thái"
                  body={statusTemplate}
                  style={{ minWidth: "120px" }}
                />
                <Column
                  header="Lời mời"
                  body={invitationTemplate}
                  style={{ minWidth: "120px" }}
                />
                <Column
                  header="Check-in"
                  body={(rowData) => formatAnyDateTime(rowData.checkInTime)}
                  style={{ minWidth: "140px" }}
                />
                <Column
                  header="Check-out"
                  body={(rowData) => formatAnyDateTime(rowData.checkOutTime)}
                  style={{ minWidth: "140px" }}
                />
              </DataTable>
            </div>

            {/* Paginator */}
            {events.length > 0 && (
              <div className="history-paginator-wrapper" style={{display: 'flex', justifyContent: 'center', marginTop: '16px'}}>
                <Paginator
                  first={first}
                  rows={rows}
                  totalRecords={events.length}
                  onPageChange={(e) => {
                    setFirst(e.first);
                    setRows(e.rows);
                  }}
                  rowsPerPageOptions={[5, 10, 20]}
                  template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                />
              </div>
            )}

            {/* Empty State */}
            {events.length === 0 && (
              <div className="history-empty">
                <p>Chưa có sự kiện nào</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default History;
