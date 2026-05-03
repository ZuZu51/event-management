/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import "../styles/createSpeaker.css";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { useState, useRef } from "react";
import { createSpeakers } from "../services/SpeakerService"; // <-- lưu ý: gửi mảng
import { showSuccessToast, showErrorToast } from "../common/helper/toastHelper";
import type { CreateSpeakerInput } from "../types/Speaker";

interface CreateSpeakerModalProps {
  visible: boolean;
  onHide: () => void;
  onCreated?: () => void;
  fetchEvents?: () => void;
  eventId?: number; // Add eventId to know which event to add speakers to
}

const roles = [
  { label: "Diễn giả", value: "SPEAKER" },
  { label: "Khách mời", value: "GUEST" },
];

export const CreateSpeakerModal = ({
  visible,
  onHide,
  onCreated,
  fetchEvents,
  eventId,
}: CreateSpeakerModalProps) => {
  const emptySpeaker: CreateSpeakerInput = { name: "", bio: "", role: "GUEST" };
  const [speakers, setSpeakers] = useState<CreateSpeakerInput[]>([
    emptySpeaker,
  ]);
  const [loading, setLoading] = useState(false);
  const toastRef = useRef<Toast | null>(null);

  // Cập nhật input
  const handleChange = (
    index: number,
    field: keyof CreateSpeakerInput,
    value: any
  ) => {
    const updated = [...speakers];
    updated[index][field] = value;
    setSpeakers(updated);
  };

  // Thêm speaker mới
  const handleAddSpeakerForm = () => {
    setSpeakers((prev) => [...prev, { ...emptySpeaker }]);
  };

  // Xóa speaker
  const handleRemoveSpeakerForm = (index: number) => {
    setSpeakers((prev) => prev.filter((_, i) => i !== index));
  };

  // Gửi tất cả speaker lên backend
  const handleSubmit = async () => {
    try {
      setLoading(true);
      // Lọc bỏ speaker chưa nhập tên
      const payload = speakers.filter((s) => s.name.trim() !== "");
      if (payload.length === 0) {
        showErrorToast(toastRef, "Vui lòng nhập tên ít nhất một người");
        setLoading(false);
        return;
      }

      await createSpeakers(payload, eventId); // gửi với eventId
      setLoading(false);
      showSuccessToast(toastRef, "Thêm diễn giả thành công!");
      onCreated?.();
      onHide();
      fetchEvents?.();
      setSpeakers([emptySpeaker]); // reset form
    } catch (error) {
      setLoading(false);
      console.error("Failed to create speakers", error);
      showErrorToast(toastRef, "Thêm diễn giả thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <>
      <Dialog
        header="Thêm Speaker cho sự kiện "
        visible={visible}
        style={{ width: "700px" }}
        modal
        onHide={onHide}
      >
         <div className="tab-footer-info">
        <div className="info-box">
          💡 <strong>Ghi chú:</strong> Bạn có bỏ qua và thêm lại sau trong phần quản lý sự kiện.
        </div>
      </div>
        <div className="p-fluid create-speaker-modal-wrapper">
        {speakers.map((speaker, index) => (
          <div key={index} className="speaker-card-unique" style={{ position: "relative" }}>
            <h4 className="speaker-title-unique">Người {index + 1}</h4>

            <div className="p-field">
              <label>Tên Speaker</label>
              <InputText
                value={speaker.name}
                onChange={(e) => handleChange(index, "name", e.target.value)}
              />
            </div>

            <div className="p-field">
              <label>Tiểu sử</label>
              <InputTextarea
                value={speaker.bio}
                onChange={(e) => handleChange(index, "bio", e.target.value)}
                rows={3}
              />
            </div>

            <div className="p-field" style={{ marginBottom: "8px" }}>
              <label>Vai trò</label>
              <Dropdown
                value={speaker.role}
                options={roles}
                onChange={(e) => handleChange(index, "role", e.value)}
                placeholder="Chọn vai trò"
              />
            </div>

            {speakers.length > 1 && (
              <Button
                icon="pi pi-trash"
                className="p-button-danger p-button-sm remove-btn-unique"
                onClick={() => handleRemoveSpeakerForm(index)}
              />
            )}
          </div>
        ))}

        <div className="p-d-flex p-jc-end" style={{ marginBottom: "1rem" }}>
          <Button
            label="Thêm người"
            icon="pi pi-plus"
            className="p-button-outlined p-button-success"
            style={{ marginTop: "8px 0" }}
            onClick={handleAddSpeakerForm}
          />
        </div>

        <div style={{ textAlign: "right" }}>
          <Button
            label="Tạo tất cả"
            icon="pi pi-check"
            className="p-button-success"
            onClick={handleSubmit}
            loading={loading}
            style={{ marginTop: "8px 0" }}
          />
          <Button
            label="Bỏ qua"
            icon="pi pi-times"
            className="p-button-secondary"
            onClick={onHide}
            style={{ margin: "8px 0" }}
          />
        </div>
      </div>
    </Dialog>
    <Toast ref={toastRef} />
    </>
  );
};
