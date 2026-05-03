import React from "react";

type Props = {
  session: any; // session object from backend
  onAction?: () => void;
};

export default function AttendanceSessionItem({ session, onAction }: Props) {
  if (!session) return null;

  const formatTime = (t?: string | null) => {
    if (!t) return "-";
    // expect ISO or HH:mm:ss
    return t.toString();
  };

  return (
    <div className="card mb-2">
      <div className="card-body">
        <h5 className="card-title">Phiên: {session.id}</h5>
        <p className="card-text">Ngày: {session.sessionDate}</p>
        <p className="card-text">Thời gian: {formatTime(session.startTime)} - {formatTime(session.endTime)}</p>
        <p className="card-text">Trạng thái: <strong>{session.status}</strong></p>
        {onAction && (
          <div>
            <button className="btn btn-outline-primary" onClick={onAction}>Chi tiết / Hành động</button>
          </div>
        )}
      </div>
    </div>
  );
}
