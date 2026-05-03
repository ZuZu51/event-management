import { useEffect, useState } from "react";
import { attendanceService } from "../../../services/attendanceService";
import { authHelper } from "../../../common/helper/authHelper";

export default function AttendanceHistory() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const idUser = authHelper.getUserId();
    const userId = idUser ?? null;
    if (!userId) return;

    const load = async () => {
      setLoading(true);
      try {
        const res = await attendanceService.getHistory(userId);
        setRecords(res || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div>
      <h5>Lịch sử điểm danh cá nhân</h5>
      {loading && <p>Đang tải...</p>}
      {!loading && records.length === 0 && <p>Chưa có bản ghi</p>}
      <ul className="list-group">
        {records.map((r) => (
          <li key={r.id} className="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <div><strong>Sự kiện:</strong> {r.session?.event?.name ?? r.session?.eventName ?? "-"}</div>
              <div><strong>Ngày:</strong> {r.session?.sessionDate ?? r.sessionDate ?? "-"}</div>
              <div><strong>Check-in:</strong> {r.checkInAt ?? "-"} &nbsp; <strong>Check-out:</strong> {r.checkOutAt ?? "-"}</div>
            </div>
            <span className={`badge ${r.status === 'CHECKED_IN' ? 'bg-success' : r.status === 'CHECKED_OUT' ? 'bg-primary' : 'bg-secondary'}`}>{r.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
