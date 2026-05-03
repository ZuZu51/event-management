import { useEffect, useState, useRef } from "react";
import { Toast } from "primereact/toast";
import { localStorageHelper } from "../common/helper/localStorageHelper";
import { attendanceService } from "../services/attendanceService";
import { showSuccessToast, showErrorToast, showWarningToast } from "../common/helper/toastHelper";
import { getCurrentLocation, calculateDistance } from "../common/helper/geoHelper";
import "../styles/todayAttendance.css";

// import type { UserEventDTO } from "../types/Event";

interface AttendanceItemData {
  eventId: number;
  eventName: string;
  date: string;
  startTime: string;
  location: string;
  status: "checked-in" | "checked-out" | "pending" | "closed" | "open";
  checkInTime?: string;
  checkOutTime?: string;
  windowStart?: string;
  windowEnd?: string;
  checkOutStart?: string;
  checkOutEnd?: string;
  reopenedCheckInUntil?: string;
  reopenedCheckOutUntil?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
}

export const TodayAttendanceWidget = () => {
  const [attendanceItems, setAttendanceItems] = useState<AttendanceItemData[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const userId = Number(localStorageHelper.getItem("idUser") || 0);
  const toastRef = useRef<Toast | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Call backend API to get today's attendance items for the authenticated user
        const items = await attendanceService.getTodayAttendance();
        if (Array.isArray(items)) {
          type ServerAttendanceItem = {
            eventId: number;
            eventName: string;
            date: string;
            startTime: string;
            location: string;
            status?: string;
            checkInTime?: string | null;
            checkOutTime?: string | null;
            windowStart?: string | null;
            windowEnd?: string | null;
            checkOutStart?: string | null;
            checkOutEnd?: string | null;
            reopenedCheckInUntil?: string | null;
            reopenedCheckOutUntil?: string | null;
            latitude?: number;
            longitude?: number;
            radiusMeters?: number;
          };

          const formatTime = (t?: string | null) => {
            if (!t) return undefined;
            // if format contains 'T' parse ISO datetime
            if (t.includes("T")) {
              try {
                const d = new Date(t);
                return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
              } catch {
                return t;
              }
            }
            // if contains seconds like HH:mm:ss -> take HH:mm
            if (t.length >= 5) return t.slice(0, 5);
            return t;
          };

          const mapped: AttendanceItemData[] = (items as ServerAttendanceItem[]).map((it) => {
            const rawStatus = (it.status || "pending").toString().toLowerCase();
            const status = (rawStatus as AttendanceItemData["status"]) || "pending";
            const ws = it.windowStart || it.startTime;
            const we = it.windowEnd || it.startTime;
            return {
              eventId: it.eventId,
              eventName: it.eventName,
              date: it.date,
              startTime: formatTime(it.startTime) || "",
              location: it.location,
              status,
              checkInTime: formatTime(it.checkInTime) || undefined,
              checkOutTime: formatTime(it.checkOutTime) || undefined,
              windowStart: formatTime(ws) || undefined,
              windowEnd: formatTime(we) || undefined,
              checkOutStart: it.checkOutStart ? (it.checkOutStart.length >= 5 ? it.checkOutStart.slice(0,5) : it.checkOutStart) : undefined,
              checkOutEnd: it.checkOutEnd ? (it.checkOutEnd.length >= 5 ? it.checkOutEnd.slice(0,5) : it.checkOutEnd) : undefined,
              reopenedCheckInUntil: formatTime(it.reopenedCheckInUntil) || undefined,
              reopenedCheckOutUntil: formatTime(it.reopenedCheckOutUntil) || undefined,
              latitude: it.latitude,
              longitude: it.longitude,
              radiusMeters: it.radiusMeters,
            };
          });
          setAttendanceItems(mapped);
        } else {
          setAttendanceItems([]);
        }
      } catch (err) {
        console.error("Failed to fetch attendance data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);
  
  const handleCheckIn = async (eventId: number) => {
    if (!userId || userId <= 0) {
      showWarningToast(toastRef, "Vui lòng đăng nhập trước khi điểm danh.");
      return;
    }
    
    try {
      // Tìm event item để lấy location data
      const eventItem = attendanceItems.find((item) => item.eventId === eventId);
      
      if (!eventItem) {
        showErrorToast(toastRef, "✗ Không tìm thấy sự kiện");
        return;
      }

      // Kiểm tra nếu event có location data thì validate vị trí
      if (
        eventItem.latitude !== undefined &&
        eventItem.longitude !== undefined &&
        eventItem.radiusMeters !== undefined
      ) {
        showWarningToast(toastRef, "📍 Đang lấy vị trí của bạn...");
        
        const userLocation = await getCurrentLocation();
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          eventItem.latitude,
          eventItem.longitude
        );
        console.log("distance check:", distance);
        console.log(
          `Event: ${eventItem.location} (${eventItem.latitude}, ${eventItem.longitude})`
        );
        console.log(
          `User: (${userLocation.latitude}, ${userLocation.longitude})`
        );
        console.log(
          `Distance: ${distance.toFixed(2)}m, Radius: ${eventItem.radiusMeters}m`
        );

        if (distance > eventItem.radiusMeters) {
          const diff = (distance - eventItem.radiusMeters).toFixed(0);
          showErrorToast(
            toastRef,
            `✗ Bạn ở quá xa! Cách sự kiện ${diff}m (yêu cầu ≤ ${eventItem.radiusMeters}m)`
          );
          return;
        }
      }

      // Call API check-in
      const req = { eventId };
      const res = await attendanceService.checkIn(userId, req);
      
      // res should contain attendance record; use returned check-in time if present
      const resObj = res as { checkInAt?: string } | null;
      const checkInAt = (resObj && resObj.checkInAt) || new Date().toISOString();

      showSuccessToast(toastRef, "✓ Check-in thành công!");

      setAttendanceItems((prev) =>
        prev.map((item) =>
          item.eventId === eventId
            ? {
                ...item,
                status: "checked-in" as const,
                checkInTime: new Date(checkInAt).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }
            : item
        )
      );
    } catch (error) {
      console.error("Check-in failed:", error);
      const err = error as { message?: string } | string | null | undefined;
      const msg = typeof err === "string" ? err : err?.message ?? JSON.stringify(err);
      showErrorToast(toastRef, `✗ Bạn đã điểm danh rồi`);
    }
  };

  const handleCheckOut = async (eventId: number) => {
    if (!userId || userId <= 0) {
      showWarningToast(toastRef, "Vui lòng đăng nhập trước khi điểm danh.");
      return;
    }

    try {
      // Call API check-out
      const req = { eventId };
      const res = await attendanceService.checkOut(userId, req);

      showSuccessToast(toastRef, "✓ Check-out thành công!");

      const resObj = res as { checkOutAt?: string } | null;

      setAttendanceItems((prev) =>
        prev.map((item) =>
          item.eventId === eventId
            ? { ...item, status: "checked-out" as const, checkOutTime: resObj?.checkOutAt ? new Date(resObj.checkOutAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : item.checkOutTime }
            : item
        )
      );
    } catch (error) {
      console.error("Check-out failed:", error);
      const err = error as { message?: string } | string | null | undefined;
      const msg = typeof err === "string" ? err : err?.message ?? JSON.stringify(err);
      showErrorToast(toastRef, `✗ Check-out thất bại: ${msg}`);
    }
  };

  const getStatusBadge = (
    status: AttendanceItemData["status"]
  ): { text: string; icon: string; className: string } => {
    const badges: Record<string, { text: string; icon: string; className: string }> = {
      "checked-in": { text: "Checked-in", icon: "fas fa-check", className: "checked-in" },
      "checked-out": { text: "Checked-out", icon: "fas fa-check", className: "checked-out" },
      pending: { text: "Chưa mở", icon: "fas fa-hourglass-end", className: "pending" },
      closed: { text: "Đã đóng", icon: "fas fa-lock", className: "closed" },
      open: { text: "Mở", icon: "fas fa-door-open", className: "open" },
    };
    return badges[status] || badges.pending;
  };

  const getTimeDisplay = (item: AttendanceItemData): string => {
    const computeRemainingMinutes = (it: AttendanceItemData): number | null => {
      const endStr = it.windowEnd || it.startTime;
      const dateStr = it.date; // expected yyyy-MM-dd
      if (!endStr || !dateStr) return null;
      // normalize to HH:mm
      const hhmm = endStr.length >= 5 ? endStr.slice(0, 5) : endStr;
      // build ISO-like string YYYY-MM-DDTHH:mm:00
      const iso = `${dateStr}T${hhmm}:00`;
      const endDate = new Date(iso);
      const now = new Date();
      const diffMin = Math.round((endDate.getTime() - now.getTime()) / 60000);
      return diffMin > 0 ? diffMin : 0;
    };

    
    if (item.status === "closed") {
      return `Check-in: ${item.windowStart} - ${item.windowEnd} (Đã hết giờ)`;
    } else {
      // show check-out window if available
      const co = item.checkOutStart ? ` | Mở Check-out: ${item.checkOutStart}${item.checkOutEnd ? ` - ${item.checkOutEnd}` : ""}` : "";
      return `Mở check-in: ${item.windowStart} - ${item.windowEnd}${co}`;
    }
  };

  const parseDateTime = (dateStr?: string, timeStr?: string): Date | null => {
    if (!dateStr || !timeStr) return null;
    const hhmm = timeStr.length >= 5 ? timeStr.slice(0, 5) : timeStr;
    const iso = `${dateStr}T${hhmm}:00`;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d;
  };

  const now = new Date();

  const canCheckIn = (item: AttendanceItemData): boolean => {
    if (item.status !== "open" && item.status !== "checked-in") return false;
    if (item.status === "checked-in" && !item.reopenedCheckInUntil) return false;
    
    // Nếu có reopened, kiểm tra reopened time; nếu không thì kiểm tra window time
    const endTime = item.reopenedCheckInUntil || item.windowEnd || item.startTime;
    const start = parseDateTime(item.date, item.windowStart || item.startTime);
    const end = parseDateTime(item.date, endTime);
    
    console.log("canCheckIn debug:", {
      eventId: item.eventId,
      status: item.status,
      windowStart: item.windowStart,
      windowEnd: item.windowEnd,
      reopenedCheckInUntil: item.reopenedCheckInUntil,
      endTime,
      startDate: item.date,
      start,
      end,
      now,
      canCheck: start && end && now >= start && now <= end
    });
    
    if (!start || !end) return false;
    return now >= start && now <= end;
  };

  const canCheckOut = (item: AttendanceItemData): boolean => {
    if (item.status !== "checked-in") return false;
    
    // Nếu có reopened check-out, kiểm tra reopened time; nếu không thì kiểm tra check-out window
    const checkOutEndTime = item.reopenedCheckOutUntil || item.checkOutEnd || item.windowEnd || item.startTime;
    const checkOutStartTime = item.checkOutStart ? item.checkOutStart : (item.windowEnd || item.startTime);
    
    const start = parseDateTime(item.date, checkOutStartTime);
    const end = parseDateTime(item.date, checkOutEndTime);
    if (!start) return false;
    if (end) return now >= start && now <= end;
    return now >= start;
  };

  if (loading) {
    return (
      <div className="stats-widget">
        <div className="stats-widget-header">
          <h3 className="stats-widget-title">✅ Điểm danh hôm nay</h3>
          <span className="stats-count">...</span>
        </div>
        <div style={{ textAlign: "center", padding: "20px", color: "#6b7a82" }}>
          Đang tải...
        </div>
      </div>
    );
  }

  return (
    <div className="stats-widget">
      {/* Widget Header */}
      <div className="stats-widget-header">
        <h3 className="stats-widget-title">✅ Điểm danh hôm nay</h3>
        <span className="stats-count">{attendanceItems.length}</span>
      </div>

      {/* Attendance Items List */}
      {attendanceItems.length > 0 ? (
        <>
          <div className="attendance-list">
            {attendanceItems.map((item) => {
              const badge = getStatusBadge(item.status);
             
              const isCheckedIn = item.status === "checked-in" || item.status === "checked-out";
              const allowCheckIn = canCheckIn(item);
              const allowCheckOut = canCheckOut(item);

              return (
                <div
                  key={item.eventId}
                  className={`attendance-item ${item.status}`}
                >
                  {/* Item Header */}
                  <div className="attendance-item-header">
                    <div className="attendance-item-title">
                      Điểm danh sự kiện: {item.eventName}
                    </div>
                    <span className={`attendance-status-badge ${badge.className}`}>
                      <i className={badge.icon}></i> {badge.text}
                    </span>
                  </div>

                  {/* Item Time Display */}
                  <div
                    className={`attendance-item-time ${
                      item.status === "checked-in" || item.status === "checked-out"
                        ? "success"
                        : item.status === "pending"
                        ? "warning"
                        : "closed"
                    }`}
                  >
                    <i
                      className={
                        item.status === "closed"
                          ? "fas fa-times-circle"
                          : "fas fa-clock"
                      }
                    ></i>
                    {getTimeDisplay(item)}
                  </div>

                  {/* Item Actions render Check-in vào lúc: và Check-out vào lúc:*/}
                  {(item.checkInTime || item.checkOutTime) && (
                    <div className="attendance-item-times" style={{ marginBottom: "12px", padding: "8px 12px", backgroundColor: "#f5f5f5", borderRadius: "4px", fontSize: "13px" }}>
                      {item.checkInTime && (
                        <div style={{ color: "#28a745", marginBottom: item.checkOutTime ? "4px" : "0" }}>
                          <i className="fas fa-sign-in-alt"></i> Check-in vào lúc: <strong>{item.checkInTime}</strong>
                        </div>
                      )}
                      {item.checkOutTime && (
                        <div style={{ color: "#dc3545" }}>
                          <i className="fas fa-sign-out-alt"></i> Check-out vào lúc: <strong>{item.checkOutTime}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Item Actions */}
                  <div className="attendance-item-actions">
                    {item.checkInTime ? (
                      <button className="btn-action btn-checkin" disabled>
                        <i className="fas fa-check"></i> Đã check-in
                      </button>
                    ) : (
                      <button
                        className="btn-action "
                        disabled={!allowCheckIn}
                        onClick={() => handleCheckIn(item.eventId)}
                        title={!allowCheckIn ? "Check-in không khả dụng" : "Check-in"}
                      >
                        <i className="fas fa-arrow-right"></i> Check-in
                      </button>
                    )}
                    
                    {item.checkOutTime ? (
                      <button className="btn-action btn-checkout" disabled>
                        <i className="fas fa-check"></i> Đã check-out
                      </button>
                    ) : (
                      <button
                        className="btn-action btn-checkout"
                        disabled={!allowCheckOut}
                        onClick={() => handleCheckOut(item.eventId)}
                        title={!allowCheckOut ? "Chưa đến thời gian check-out" : "Check-out"}
                      >
                        <i className="fas fa-arrow-left"></i> Check-out
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>


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
            Không có sự kiện nào hôm nay
          </p>
          <small style={{ margin: 0 }}>
            Tận hưởng ngày thứ của bạn 😊
          </small>
        </div>
      )}
      <Toast ref={toastRef} />
    </div>
  );
};

export default TodayAttendanceWidget;