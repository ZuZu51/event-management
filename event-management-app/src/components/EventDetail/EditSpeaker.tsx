/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import "../../styles/createSpeaker.css";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { useState, useRef, useEffect } from "react";
import {
  createSpeakers,
  updateSpeaker,
  updateSpeakersBatch,
  getSpeakersByEventId,
  deleteSpeaker,
} from "../../services/SpeakerService";
import {
  showSuccessToast,
  showErrorToast,
} from "../../common/helper/toastHelper";
import type { CreateSpeakerInput, Speaker } from "../../types/Speaker";

interface EditSpeakerProps {
  visible: boolean;
  onHide: () => void;
  speakers?: Speaker[];
  onUpdated?: () => void;
  fetchEvents?: () => void;
  eventId?: number;
}

const roles = [
  { label: "Diễn giả", value: "SPEAKER" },
  { label: "Khách mời", value: "GUEST" },
];

export const EditSpeaker = ({
  visible,
  onHide,
  speakers = [],
  onUpdated,
  fetchEvents,
  eventId,
}: EditSpeakerProps) => {
  const emptySpeaker: CreateSpeakerInput = { name: "", bio: "", role: "GUEST" };
  const [editSpeakers, setEditSpeakers] = useState<
    (CreateSpeakerInput & { id?: number })[]
  >([]);
  const [originalSpeakers, setOriginalSpeakers] = useState<
    (CreateSpeakerInput & { id?: number })[]
  >([]);
  const [loading, setLoading] = useState(false);
  const toastRef = useRef<Toast | null>(null);

  // Fetch speakers khi eventId thay đổi
  useEffect(() => {
    if (visible && eventId) {
      const fetchSpeakers = async () => {
        try {
          const data = await getSpeakersByEventId(eventId);
          const speakersData = data.map((speaker) => ({
            id: speaker.id,
            name: speaker.name,
            bio: speaker.bio,
            role: speaker.role,
          }));
          setEditSpeakers(speakersData);
          setOriginalSpeakers(speakersData); // Lưu bản gốc
        } catch (error) {
          console.error('Error loading speakers:', error);
          setEditSpeakers([{ ...emptySpeaker }]);
          setOriginalSpeakers([]);
        }
      };
      fetchSpeakers();
    }
  }, [visible, eventId]);

  // Khởi tạo form khi không có speaker
  useEffect(() => {
    if (visible && !eventId && editSpeakers.length === 0) {
      setEditSpeakers([{ ...emptySpeaker }]);
    }
  }, [visible]);

  // Cập nhật input
  const handleChange = (
    index: number,
    field: keyof CreateSpeakerInput,
    value: any
  ) => {
    const updated = [...editSpeakers];
    updated[index][field] = value;
    setEditSpeakers(updated);
  };

  // Thêm speaker mới
  const handleAddSpeakerForm = () => {
    setEditSpeakers((prev) => [...prev, { ...emptySpeaker }]);
  };

  // Xóa speaker
  const handleRemoveSpeakerForm = (index: number) => {
    setEditSpeakers((prev) => prev.filter((_, i) => i !== index));
  };

  // Gửi tất cả speaker lên backend
  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Phân tách speaker mới và speaker cũ
      const newSpeakers = editSpeakers.filter((s) => !s.id && s.name.trim() !== "");
      const updatedSpeakers = editSpeakers.filter(
        (s) => s.id && s.name.trim() !== ""
      );

      // Detect speaker bị xóa - có trong original nhưng không có trong current
      const deletedSpeakers = originalSpeakers.filter(
        (original) =>
          original.id && !editSpeakers.find((current) => current.id === original.id)
      );

      // Xóa speaker đã bị xóa khỏi form
      for (const speaker of deletedSpeakers) {
        if (speaker.id) {
          await deleteSpeaker(speaker.id);
        }
      }

      // Tạo speaker mới nếu có
      if (newSpeakers.length > 0) {
        const newSpeakersPayload = newSpeakers.map(({ id, ...rest }) => rest);
        await createSpeakers(newSpeakersPayload, eventId);
      }

      // Cập nhật nhiều speaker cùng lúc
      if (updatedSpeakers.length > 0) {
        const updatePayload = updatedSpeakers.map((s) => ({
          id: s.id!,
          name: s.name,
          bio: s.bio,
          role: s.role,
        }));
        await updateSpeakersBatch(updatePayload);
      }

      setLoading(false);
      showSuccessToast(
        toastRef,
        "Lưu thông tin diễn giả thành công!"
      );
      onUpdated?.();
      onHide();
      fetchEvents?.();
      setEditSpeakers([emptySpeaker]);
      setOriginalSpeakers([]);
    } catch (error) {
      setLoading(false);
      console.error("Failed to save speakers", error);
      showErrorToast(toastRef, "Lưu thông tin diễn giả thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <>
      <Dialog
        header="Chỉnh sửa Speaker"
        visible={visible}
        style={{ width: "700px" }}
        modal
        onHide={onHide}
      >
        <div className="tab-footer-info">
          <div className="info-box">
            💡 <strong>Ghi chú:</strong> Thêm mới hoặc chỉnh sửa thông tin diễn giả.
          </div>
        </div>
        <div className="p-fluid create-speaker-modal-wrapper">
          {editSpeakers.map((speaker, index) => (
            <div
              key={index}
              className="speaker-card-unique"
              style={{ position: "relative" }}
            >
              <h4 className="speaker-title-unique">
                Người {index + 1}
                {speaker.id && " (Chỉnh sửa)"}
              </h4>

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

              {editSpeakers.length > 1 && (
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
              label="Lưu"
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

export default EditSpeaker;
