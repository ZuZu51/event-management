import React, { useEffect, useState, useRef } from "react";
import { Toast } from "primereact/toast";
import { attendanceService } from "../../../services/attendanceService";
import { authHelper } from "../../../common/helper/authHelper";
import { offlineAttendance } from "../../../common/helper/offlineAttendance";
import { showWarningToast, showInfoToast } from "../../../common/helper/toastHelper";

type Props = {
  session?: any | null; // full session object
  sessionId?: number | null;
  eventId?: number | null;
  initialStatus?: string | null; // NOT_CHECKED_IN | CHECKED_IN | CHECKED_OUT | LATE | ABSENT
  onChange?: (record: any) => void;
};

export default function CheckInButton({ sessionId, eventId, initialStatus, onChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(initialStatus || null);
  const [enabled, setEnabled] = useState<boolean>(true);
  const toastRef = useRef<Toast | null>(null);

  const idFromToken = authHelper.getUserId();
  const userId = idFromToken ?? null;

  // determine availability based on session windows
  useEffect(() => {
    const s = sessionId || eventId ? null : null; // placeholder if future
    // If component receives `session` prop, check its windows
  }, [sessionId, eventId]);

  const handleCheckIn = async () => {
    if (!userId) return showWarningToast(toastRef, "Vui lòng đăng nhập");
    setLoading(true);
    try {
      const req = { sessionId: sessionId ?? null, eventId: eventId ?? null };
      const res = await attendanceService.checkIn(userId, req);
      setStatus((res as any).status ?? "CHECKED_IN");
      onChange && onChange(res);
      // after successful checkin attempt, try to sync offline queue
      const queue = offlineAttendance.getAll();
      if (queue.length > 0) {
        await attendanceService.syncOfflineQueue(queue);
        offlineAttendance.clear();
      }
    } catch (err: any) {
      const message = err?.message || JSON.stringify(err);
      // network or offline detection
      if (!navigator.onLine || message.toLowerCase().includes("network")) {
        offlineAttendance.enqueue({ type: "checkin", userId, payload: { sessionId: sessionId ?? null, eventId: eventId ?? null } });
        showInfoToast(toastRef, "Mạng lỗi — bản ghi điểm danh đã lưu offline và sẽ được gửi lại khi có mạng.");
      } else {
        showWarningToast(toastRef, message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!userId) return showWarningToast(toastRef, "Vui lòng đăng nhập");
    setLoading(true);
    try {
      const req = { sessionId: sessionId ?? null, eventId: eventId ?? null };
      const res = await attendanceService.checkOut(userId, req);
      setStatus((res as any).status ?? "CHECKED_OUT");
      onChange && onChange(res);
      const queue = offlineAttendance.getAll();
      if (queue.length > 0) {
        await attendanceService.syncOfflineQueue(queue);
        offlineAttendance.clear();
      }
    } catch (err: any) {
      const message = err?.message || JSON.stringify(err);
      if (!navigator.onLine || message.toLowerCase().includes("network")) {
        offlineAttendance.enqueue({ type: "checkout", userId, payload: { sessionId: sessionId ?? null, eventId: eventId ?? null } });
        showInfoToast(toastRef, "Mạng lỗi — bản ghi check-out đã lưu offline và sẽ được gửi lại khi có mạng.");
      } else {
        showWarningToast(toastRef, message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Render based on status
  if (status === "CHECKED_IN") {
    return (
      <>
        <button className="btn btn-warning" disabled={loading} onClick={handleCheckOut}>
          {loading ? "Đang xử lý..." : "Check-out"}
        </button>
        <Toast ref={toastRef} />
      </>
    );
  }

  if (status === "CHECKED_OUT" || status === "ABSENT") {
    return (
      <>
        <span className="badge bg-secondary">{status}</span>
        <Toast ref={toastRef} />
      </>
    );
  }

  // default show Check-in
  return (
    <>
      <button className="btn btn-success" disabled={loading} onClick={handleCheckIn}>
        {loading ? "Đang xử lý..." : "Check-in"}
      </button>
      <Toast ref={toastRef} />
    </>
  );
}
