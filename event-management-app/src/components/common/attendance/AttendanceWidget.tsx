import React, { useEffect, useState } from "react";
import AttendanceSessionItem from "./AttendanceSessionItem";
import CheckInButton from "./CheckInButton";
import { attendanceService } from "../../../services/attendanceService";
import { authHelper } from "../../../common/helper/authHelper";
import { Client } from "@stomp/stompjs";
import type { IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

type Props = {
  eventId: number;
};

/**
 * AttendanceWidget
 * - Hiển thị session hiện tại (nếu có)
 * - Cho phép student check-in / check-out
 * - Link xem lịch sử
 */
export default function AttendanceWidget({ eventId }: Props) {
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  // subscribe to backend topic for attendance notifications
  useEffect(() => {
    try {
      const base = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/").replace(/\/api\/?$/, "");
      const socketUrl = `${base}/ws`;
      const socket = new SockJS(socketUrl);
      const client = new Client({
        webSocketFactory: () => socket as any,
        debug: () => {},
      });
      client.onConnect = () => {
        client.subscribe("/topic/attendance", (msg: IMessage) => {
          setNotifications((n) => [msg.body, ...n].slice(0, 10));
        });
      };
      client.activate();
      return () => {
        try { client.deactivate(); } catch {}
      };
    } catch (e) {
      // ignore websocket errors
    }
  }, []);

  useEffect(() => {
    // Try to fetch event sessions (derived from records) to find today's session and status
    const load = async () => {
      setLoading(true);
      try {
        const sessions = await attendanceService.getEventSessions(eventId);
        if (sessions && sessions.length > 0) {
          // prefer ACTIVE session
          const now = new Date();
          let active = sessions.find((s: any) => s.status === "ACTIVE");
          if (!active) {
            // find session whose start/end window covers now
            active = sessions.find((s: any) => {
              try {
                const start = s.sessionDate && s.startTime ? new Date(`${s.sessionDate}T${s.startTime}`) : null;
                const end = s.sessionDate && s.endTime ? new Date(`${s.sessionDate}T${s.endTime}`) : null;
                if (!start || !end) return false;
                return now >= start && now <= end;
              } catch {
                return false;
              }
            });
          }
          setSession(active || sessions[0]);
        } else {
          setSession(null);
        }
      } catch (err) {
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [eventId]);

  const idUser = authHelper.getUserId();
  const userId = idUser ?? null;

  return (
    <div>
      <h4>Điểm danh</h4>
      {loading && <p>Đang tải...</p>}
      {!loading && !session && (
        <div className="alert alert-light">Hiện chưa có phiên điểm danh cho sự kiện này.</div>
      )}
      {!loading && session && (
        <div>
          <AttendanceSessionItem session={session} />
          <div className="mt-2">
            <CheckInButton session={session} sessionId={session.id} eventId={eventId} onChange={(r) => console.log('attendance changed', r)} />
          </div>
          <div className="mt-2">
            <a href="#/attendance-history">Xem lịch sử điểm danh</a>
          </div>
          <div className="mt-2">
            <strong>Notifications:</strong>
            <ul>
              {notifications.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
