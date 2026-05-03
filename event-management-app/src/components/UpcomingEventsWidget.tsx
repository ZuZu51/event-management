import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { getUserEvents, getEventStats } from "../services/EventService";
import { localStorageHelper } from "../common/helper/localStorageHelper";
import type { UserEventDTO, EventStats } from "../types/Event";
import "../styles/upcomingEvents.css";
import { attendanceService } from '../services/attendanceService';
import { getEventStatusText, getModeActiveColor } from "../utils/eventUtils";
import { formatDateToDDMMYYYY } from "../common/helper/dateHelper";

interface CheckinSettings {
  checkinStart: string;
  checkinEnd: string;
  checkoutStart: string;
  checkoutEnd: string;

}

export const UpcomingEventsWidget = () => {
  const [events, setEvents] = useState<UserEventDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkinSettings, setCheckinSettings] = useState<Map<number, CheckinSettings>>(new Map());
  const navigate = useNavigate();
  const userId = Number(localStorageHelper.getItem("idUser") || 0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allEvents = await getUserEvents(userId);

        // Enrich events with server-side stats (contain durationMinutes and active)
        const promises: Promise<{ ev: UserEventDTO; stats: EventStats }>[] = allEvents.map((ev) =>
          getEventStats(ev.eventId).then((stats) => ({ ev, stats }))
        );

        const settled = await Promise.allSettled(promises);
        const enriched = settled
          .filter((s): s is PromiseFulfilledResult<{ ev: UserEventDTO; stats: EventStats }> => s.status === "fulfilled")
          .map((s) => s.value);

        // Keep only events that have not ended yet (active !== 3) and whose end time is in the future
        const now = new Date();
        const getDaysUntilHelper = (dateStr: string) => {
          const eventDate = new Date(dateStr);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          eventDate.setHours(0, 0, 0, 0);
          const diffTime = eventDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays;
        };

        const upcoming = enriched
          .filter(({ ev, stats }) => {
            try {
              if (stats?.active === 3) return false; // already ended

              const dateStr = ev.date;
              const timeStr = ev.startTime || stats.startTime || "00:00";
              const duration = stats?.durationMinutes ?? 0;

              const start = new Date(`${dateStr}T${timeStr}`);
              const end = new Date(start.getTime() + duration * 60000);
              return end.getTime() > now.getTime();
            } catch {
              return false;
            }
          })
          .map(({ ev }) => ev)
          .sort((a, b) => {
            const daysA = getDaysUntilHelper(a.date);
            const daysB = getDaysUntilHelper(b.date);
            return daysA - daysB; // Sắp xếp tăng dần: sự kiện gần nhất lên trước
          });

        setEvents(upcoming.slice(0, 4)); // Lấy 4 sự kiện

        // Load checkin settings cho mỗi event
        const settingsMap = new Map<number, CheckinSettings>();
        for (const event of upcoming.slice(0, 4)) {
          try {
            const settings = await attendanceService.getEventCheckinSettings(event.eventId);
            if (settings) {
              settingsMap.set(event.eventId, settings);
            }
          } catch (err) {
            console.warn(`Failed to load checkin settings for event ${event.eventId}:`, err);
          }
        }
        setCheckinSettings(settingsMap);
      } catch (err) {
        console.error("Failed to fetch upcoming events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const getDaysUntil = (dateStr: string) => {
    const eventDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDateTime = (dateStr: string, timeStr: string) => {
    try {
      const date = new Date(`${dateStr}T${timeStr}`);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = String(date.getFullYear()); // Chỉ lấy 2 chữ số cuối của năm
      const hours = String(date.getHours()).padStart(2, "0");
      const mins = String(date.getMinutes()).padStart(2, "0");
      return `${day}/${month}/${year} ${hours}:${mins}`;
    } catch {
      return "--";
    }
  };

  const formatTime = (timeStr: string | null | undefined) => {
    if (!timeStr) return "--";
    try {
      const [hours, minutes] = timeStr.split(":").slice(0, 2);
      return `${hours}:${minutes}`;
    } catch {
      return "--";
    }
  };

  // Template cho cột STT
  const sttTemplate = (_: any, options: any) => {
    return options.rowIndex + 1;
  };

  // Template cho cột Tên sự kiện (in đậm, có thể click)
  const eventNameTemplate = (rowData: UserEventDTO) => {
    return (
      <strong
        onClick={() => navigate(`/events/${rowData.eventId}`, { state: { isHidden: true } })}
        style={{ cursor: "pointer", color: "var(--primary)" }}
        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
      >
        {rowData.eventName}
      </strong>
    );
  };

  // Template cho cột Thời gian diễn ra
  const eventTimeTemplate = (rowData: UserEventDTO) => {
    return formatDateTime(rowData.date, rowData.startTime);
  };

  // Template cho cột Check-in
  const checkInTemplate = (rowData: UserEventDTO) => {
    const settings = checkinSettings.get(rowData.eventId);
    if (!settings) return "--";
    return `${settings.checkinStart}-${settings.checkinEnd}`;
  };

  // Template cho cột Check-out
  const checkOutTemplate = (rowData: UserEventDTO) => {
    const settings = checkinSettings.get(rowData.eventId);
    if (!settings) return "--";
    return `${settings.checkoutStart}-${settings.checkoutEnd}`;
  };

  // Template cho cột Trạng thái
  const statusTemplate = (rowData: UserEventDTO) => {
    const eventStats = checkinSettings.get(rowData.eventId) as any;
    const active = eventStats?.active ?? 1;
    return (
      <span
        style={{
          color: getModeActiveColor(active),
          fontWeight: "bold",
          padding: "4px 8px",
          borderRadius: "4px",
          backgroundColor: getModeActiveColor(active) + "20",
        }}
      >
        {getEventStatusText(active)}
      </span>
    );
  };

  // Hàm xác định lớp CSS cho dòng (highlight nếu sắp diễn ra trong 3 ngày)
  const rowClassName = (rowData: UserEventDTO) => {
    const daysLeft = getDaysUntil(rowData.date);
    return daysLeft <= 3 && daysLeft >= 0 ? "urgent-row" : "";
  };

  if (loading) {
    return (
      <div className="stats-widget">
        <div className="stats-widget-header">
          <h3 className="stats-widget-title">🚀 Sự kiện sắp diễn ra</h3>
        </div>
        <div style={{ textAlign: "center", padding: "20px", color: "#6b7a82" }}>
          Đang tải...
        </div>
      </div>
    );
  }

  return (
    <div className="stats-widget">
      <div className="stats-widget-header">
        <h3 className="stats-widget-title">🚀 Sự kiện sắp diễn ra</h3>
      </div>

      {events.length > 0 ? (
        <>
          <DataTable
            value={events}
            rowClassName={rowClassName}
            responsiveLayout="scroll"
            stripedRows
            className="events-data-table"
          >
            <Column field="stt" header="STT" body={sttTemplate} style={{ width: "60px" }} />
            <Column field="eventName" header="Tên sự kiện" body={eventNameTemplate} />
            <Column field="date" header="Thời gian diễn ra" body={eventTimeTemplate} style={{ width: "180px" }} />
            <Column field="checkInTime" header="Check-in" body={checkInTemplate} style={{ width: "100px" }} />
            <Column field="checkOutTime" header="Check-out" body={checkOutTemplate} style={{ width: "100px" }} />
            <Column field="status" header="Trạng thái" body={statusTemplate} style={{ width: "120px" }} />
          </DataTable>

          <a
            href="/events"
            className="stats-widget-link"
            style={{ textDecoration: "none", cursor: "pointer", display: "inline-block", marginTop: "16px" }}
            onClick={(e) => {
              e.preventDefault();
              navigate("/events");
            }}
          >
            Tìm sự kiện khác →
          </a>
        </>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "24px 16px",
            color: "#6b7a82",
          }}
        >
          <p style={{ margin: "0 0 6px 0", fontWeight: 500 }}>
            Không có sự kiện sắp diễn ra
          </p>
          <small style={{ margin: 0 }}>
            Hãy đăng ký để không bỏ lỡ những sự kiện thú vị
          </small>
        </div>
      )}
    </div>
  );
};

