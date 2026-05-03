import React, { useEffect, useState, useRef } from "react";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { createTicket, updateTicketStatus } from "../services/TicketService";
import {
  cancelEvent,
  createPayment,
  exportEventAttendees,
  getEventStats,
  updateEventSchedule,
} from "../services/EventService";
import { getSpeakerById } from "../services/SpeakerService";
import type { EventStats } from "../types/Event";
import type { TicketUpdateDTO } from "../types/Ticket";
import type { Speaker } from "../types/Speaker";
import { localStorageHelper } from "../common/helper/localStorageHelper";
import { showSuccessToast, showErrorToast, showWarningToast } from "../common/helper/toastHelper";
import AttendanceWidget from "./common/attendance/AttendanceWidget";
import { getEventStatusText, getModeActiveColor } from "../utils/eventUtils";



interface DetailEventProps {
  eventId: number;
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-CA"); // YYYY-MM-DD
const formatTime = (timeStr: string) => timeStr.slice(0, 5); // HH:mm

const DetailEvent: React.FC<DetailEventProps> = ({ eventId }) => {
  const [event, setEvent] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const toastRef = useRef<Toast | null>(null);
  
  // Modal cập nhật sự kiện
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updatingEvent, setUpdatingEvent] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    date: "",
    startTime: "",
    location: "",
  });

  // 🆕 Modal hiển thị thông tin Speaker/Guest
  const [showSpeakerModal, setShowSpeakerModal] = useState(false);
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);
  const [loadingSpeaker, setLoadingSpeaker] = useState(false);

  // Ticket update
  const [ticketCodeInput, setTicketCodeInput] = useState("");
  const [ticketInfo, setTicketInfo] = useState<TicketUpdateDTO | null>(null);
  const [updatingTicket, setUpdatingTicket] = useState(false);

  const role = localStorageHelper.getItem("role");
  const userId = localStorageHelper.getItem("idUser");

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const data = await getEventStats(eventId);
        setEvent(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  // 🆕 Xử lý click vào speaker/guest
  const handleSpeakerClick = async (id: number) => {
    try {
      setLoadingSpeaker(true);
      setShowSpeakerModal(true);
      const speakerData = await getSpeakerById(id);
      
      setSelectedSpeaker(speakerData);
    } catch (error) {
      console.error("Failed to fetch speaker:", error);
      showErrorToast(toastRef, "Không thể tải thông tin diễn giả/khách mời");
      setShowSpeakerModal(false);
    } finally {
      setLoadingSpeaker(false);
    }
  };

  const handleRegister = async () => {
    if (!userId) {
      showWarningToast(toastRef, "Bạn cần đăng nhập để đăng ký tham gia!");
      return;
    }
    try {
      setRegistering(true);
      await createTicket({ userId: Number(userId), eventId });
      setRegistering(false);
      setShowModal(false);
      showSuccessToast(toastRef, "Đăng ký tham gia thành công!");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setRegistering(false);
      if (error.response?.status === 409 || error.message.includes("409")) {
        showWarningToast(toastRef, "Bạn đã đăng ký tham gia sự kiện này rồi!");
      } else {
        showErrorToast(toastRef, "Đăng ký thất bại. Vui lòng thử lại.");
      }
      console.error(error);
    }
  };

  const handleBuyTicket = async () => {
    if (!userId) {
      showWarningToast(toastRef, "Bạn cần đăng nhập để mua vé!");
      return;
    }
    if (!event?.ticketPrice) {
      showErrorToast(toastRef, "Không tìm thấy thông tin giá vé!");
      return;
    }

    try {
      setProcessingPayment(true);
      const paymentUrl = await createPayment(
        Number(event.ticketPrice),
        String(eventId),
        Number(userId)
      );

      // Chuyển hướng đến trang thanh toán VNPay
      window.location.href = paymentUrl;
    } catch (error) {
      setProcessingPayment(false);
      console.error("Payment error:", error);
      showErrorToast(toastRef, "Không thể tạo link thanh toán. Vui lòng thử lại!");
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportEventAttendees(eventId);
      setExporting(false);
    } catch {
      setExporting(false);
      showErrorToast(toastRef, "Xuất báo cáo thất bại.");
    }
  };

  const handleUpdateTicketStatus = async () => {
    if (!ticketCodeInput) return showWarningToast(toastRef, "Vui lòng nhập ticket code!");
    try {
      setUpdatingTicket(true);
      const updatedTicket = await updateTicketStatus(ticketCodeInput, eventId);
      setTicketInfo(updatedTicket);
      setUpdatingTicket(false);
    } catch {
      setUpdatingTicket(false);
      showErrorToast(toastRef, "Cập nhật trạng thái ticket thất bại. Kiểm tra ticket code.");
    }
  };

  const handleCancelEvent = async () => {
    if (!event?.eventId) return showErrorToast(toastRef, "Không tìm thấy mã sự kiện để hủy!");
    if (window.confirm("Bạn có chắc chắn muốn hủy sự kiện này không?")) {
      try {
        await cancelEvent(event.eventId);
        showSuccessToast(toastRef, "Hủy sự kiện thành công!");
        const updated = await getEventStats(eventId);
        setEvent(updated);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        showErrorToast(toastRef, "Hủy sự kiện thất bại!");
      }
    }
  };

  const openUpdateModal = () => {
    if (!event) return;
    setUpdateForm({
      date: formatDate(event.date),
      startTime: formatTime(event.startTime),
      location: event.location,
    });
    setShowUpdateModal(true);
  };

  const handleSubmitUpdateEvent = async () => {
    if (!event?.eventId) {
      showErrorToast(toastRef, "Không tìm thấy mã sự kiện!");
      return;
    }
    try {
      setUpdatingEvent(true);
      await updateEventSchedule(event.eventId, {
        date: updateForm.date,
        startTime: updateForm.startTime,
        location: updateForm.location,
      });
      setUpdatingEvent(false);
      setShowUpdateModal(false);
      showSuccessToast(toastRef, "Cập nhật sự kiện thành công!");

      const updated = await getEventStats(eventId);
      setEvent(updated);
    } catch (error) {
      console.error(error);
      setUpdatingEvent(false);
      showErrorToast(toastRef, "Cập nhật sự kiện thất bại!");
    }
  };

  if (loading) return <div>Đang tải...</div>;
  if (!event) return <div>Không tìm thấy event</div>;

  return (
    <div style={{ padding: "1rem", width: "95rem" }}>
      <h2>Chi Tiết Sự Kiện</h2>
      <div
        style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        
        {/* Card chi tiết event */}
        <Card title={event.eventName} style={{ flex: 1, minWidth: "300px" }}>
          <div style={{ lineHeight: "1.6" }}>
            <p>
              <strong>Ngày diễn ra sự kiện:</strong> {formatDate(event.date)}
            </p>
            <p>
              <strong>Mô tả:</strong> {event.description}
            </p>
            <p>
              <strong>Thời gian bắt đầu:</strong> {formatTime(event.startTime)}{" "}
              - Thời lượng: {event.durationMinutes} phút
            </p>
            <p>
              <strong>Địa điểm:</strong> {event.location}
            </p>
            <p>
              <strong>Loại sự kiện:</strong> <Tag value={event.category} />
            </p>
            <p>
              <strong>Hình thức:</strong> {event.eventMode}
            </p>
            <p>
              <strong>Trạng thái:</strong>{" "}
              <span
                style={{
                  color: getModeActiveColor(event.active),
                  fontWeight: "bold",
                }}
              >
                {getEventStatusText(event.active)}
              </span>
            </p>
            <p>
              <strong></strong>{" "}
              {event.ticketed ? (
                <span style={{ color: "green", fontWeight: "bold" }}></span>
              ) : (
                <span style={{ color: "gray" }}></span>
              )}
              {event.ticketed && event.ticketPrice && (
                <>
                  {" "}
                  <strong>Giá vé:</strong> {event.ticketPrice.toLocaleString()}đ
                </>
              )}
            </p>
            {event.qalink && (
              <p>
                <strong>Link hỏi đáp:</strong>{" "}
                <a
                  href={event.qalink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {event.qalink}
                </a>
              </p>
            )}
          </div>
          <Divider />
          <div>
            <h4>Thành phần diễn giả và khách mời:</h4>
            <div>
              <p>
                <strong>Phía diễn giả:</strong>{" "}
                {(() => {
                  try {
                    const speakers = event.speakers
                      ? JSON.parse(event.speakers)
                      : [];
                    if (Array.isArray(speakers) && speakers.length > 0) {
                      return speakers.map(
                        (s: { id: number; name: string }, index: number) => (
                          <span
                            key={s.id}
                            onClick={() => handleSpeakerClick(s.id)}
                            style={{
                              cursor: "pointer",
                              color: "#1976d2",
                              textDecoration: "underline",
                            }}
                          >
                            {s.name}
                            {index < speakers.length - 1 ? ", " : ""}
                          </span>
                        )
                      );
                    }
                    return "Chưa có thông tin";
                  } catch {
                    return "Dữ liệu không hợp lệ";
                  }
                })()}
              </p>

              <p>
                <strong>Phía khách mời:</strong>{" "}
                {(() => {
                  try {
                    const guests = event.guests ? JSON.parse(event.guests) : [];
                    if (Array.isArray(guests) && guests.length > 0) {
                      return guests.map(
                        (g: { id: number; name: string }, index: number) => (
                          <span
                            key={g.id}
                            onClick={() => handleSpeakerClick(g.id)}
                            style={{
                              cursor: "pointer",
                              color: "#388e3c",
                              textDecoration: "underline",
                            }}
                          >
                            {g.name}
                            {index < guests.length - 1 ? ", " : ""}
                          </span>
                        )
                      );
                    }
                    return "Chưa có thông tin";
                  } catch {
                    return "Dữ liệu không hợp lệ";
                  }
                })()}
              </p>
            </div>
          </div>
          <Divider />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {role === "ADMIN" && (
              <>
                <Button
                  label="Xuất báo cáo"
                  icon="pi pi-file"
                  className="p-button-success"
                  onClick={handleExport}
                  loading={exporting}
                />
                <Button
                  label="Cập nhật sự kiện"
                  icon="pi pi-calendar-edit"
                  className="p-button-warning"
                  onClick={openUpdateModal}
                />
                <Button
                  label="Hủy sự kiện"
                  icon="pi pi-times"
                  className="p-button-danger"
                  onClick={handleCancelEvent}
                />
              </>
            )}

            {(role === "STUDENT" || role === "GUEST" || role === "TEACHER") && 
              event.active === 1 &&
              (!event.ticketed ? (
                <Button
                  label="Đăng ký tham gia"
                  icon="pi pi-user-plus"
                  className="p-button-success"
                  onClick={() => setShowModal(true)}
                />
              ) : (
                <Button
                  label="Mua vé"
                  icon="pi pi-ticket"
                  className="p-button-info"
                  onClick={handleBuyTicket}
                  loading={processingPayment}
                />
              ))}
          </div>
        </Card>

        {/* Card cập nhật ticket */}
        {(role === "ADMIN" || role === "TEACHER") && event.active === 2 && (
          <Card
            title="Cập nhật trạng thái Ticket"
            style={{ flex: 1, minWidth: "300px" }}
          >
            <div
              style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
            >
              <input
                type="text"
                placeholder="Nhập ticket code"
                value={ticketCodeInput}
                onChange={(e) => setTicketCodeInput(e.target.value)}
                onBlur={handleUpdateTicketStatus}
                style={{ flex: 1, padding: "0.5rem" }}
              />
              <Button
                label="Cập nhật"
                className="p-button-primary"
                onClick={handleUpdateTicketStatus}
                loading={updatingTicket}
              />
            </div>

            {ticketInfo && (
              <div style={{ marginTop: "1rem", lineHeight: "1.6" }}>
                <p>
                  <strong>Ticket Code:</strong> {ticketInfo.ticketCode}
                </p>
                <p>
                  <strong>Status:</strong> {ticketInfo.status}
                </p>
                <p>
                  <strong>Check-in Time:</strong>{" "}
                  {ticketInfo.checkInTime || "-"}
                </p>
                <p>
                  <strong>Check-out Time:</strong>{" "}
                  {ticketInfo.checkOutTime || "-"}
                </p>
                <p>
                  <strong>Sự kiện:</strong> {ticketInfo.eventName}
                </p>
                <p>
                  <strong>Người dùng:</strong> {ticketInfo.userName}
                </p>
              </div>
            )}
          </Card>
        )}

          {/* Attendance Widget: show for students/teachers/guests */}
          <div style={{ flex: 1, minWidth: "300px" }}>
            <AttendanceWidget eventId={event.eventId} />
          </div>
      </div>

      {/* Modal đăng ký */}
      <Dialog
        header="Đăng ký tham gia sự kiện"
        visible={showModal}
        modal
        onHide={() => setShowModal(false)}
      >
        <p>Bạn có chắc muốn đăng ký tham gia sự kiện này không?</p>
        <div style={{ textAlign: "right" }}>
          <Button
            label="Hủy"
            className="p-button-secondary"
            onClick={() => setShowModal(false)}
            style={{ marginRight: "0.5rem" }}
          />
          <Button
            label="Đăng ký"
            className="p-button-success"
            onClick={handleRegister}
            loading={registering}
          />
        </div>
      </Dialog>

      {/* Modal cập nhật sự kiện */}
      <Dialog
        header="Cập nhật lịch sự kiện"
        visible={showUpdateModal}
        modal
        onHide={() => setShowUpdateModal(false)}
        style={{ width: "30rem" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label>Ngày diễn ra</label>
            <input
              type="date"
              value={updateForm.date}
              onChange={(e) =>
                setUpdateForm({ ...updateForm, date: e.target.value })
              }
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>
          <div>
            <label>Thời gian bắt đầu</label>
            <input
              type="time"
              value={updateForm.startTime}
              onChange={(e) =>
                setUpdateForm({ ...updateForm, startTime: e.target.value })
              }
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>
          <div>
            <label>Địa điểm</label>
            <input
              type="text"
              value={updateForm.location}
              onChange={(e) =>
                setUpdateForm({ ...updateForm, location: e.target.value })
              }
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>
        </div>

        <div style={{ textAlign: "right", marginTop: "1.5rem" }}>
          <Button
            label="Hủy"
            className="p-button-secondary"
            onClick={() => setShowUpdateModal(false)}
            style={{ marginRight: "0.5rem" }}
          />
          <Button
            label="Cập nhật"
            className="p-button-warning"
            onClick={handleSubmitUpdateEvent}
            loading={updatingEvent}
          />
        </div>
      </Dialog>

      {/* 🆕 Modal hiển thị thông tin Speaker/Guest */}
      <Dialog
        header="Thông tin chi tiết"
        visible={showSpeakerModal}
        modal
        onHide={() => {
          setShowSpeakerModal(false);
          setSelectedSpeaker(null);
        }}
        style={{ width: "35rem" }}
      >
        {loadingSpeaker ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <i
              className="pi pi-spin pi-spinner"
              style={{ fontSize: "2rem" }}
            ></i>
            <p>Đang tải thông tin...</p>
          </div>
        ) : selectedSpeaker ? (
          <div style={{ lineHeight: "1.8" }}>
            <p>
              <strong>Họ và tên:</strong> {selectedSpeaker.name}
            </p>
            <p>
              <strong>Vai trò:</strong>{" "}
              <Tag
                value={
                  selectedSpeaker.role === "SPEAKER" ? "Diễn giả" : "Khách mời"
                }
                severity={
                  selectedSpeaker.role === "SPEAKER" ? "info" : "success"
                }
              />
            </p>
            <Divider />
            <div>
              <strong>Tiểu sử:</strong>
              <p style={{ marginTop: "0.5rem", whiteSpace: "pre-wrap" }}>
                {selectedSpeaker.bio || "Chưa có thông tin tiểu sử"}
              </p>
            </div>
          </div>
        ) : (
          <p>Không có thông tin</p>
        )}

        <div style={{ textAlign: "right", marginTop: "1.5rem" }}>
          <Button
            label="Đóng"
            className="p-button-secondary"
            onClick={() => {
              setShowSpeakerModal(false);
              setSelectedSpeaker(null);
            }}
          />
        </div>
      </Dialog>
      <Toast ref={toastRef} />
    </div>
  );
};

export default DetailEvent;
