import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { useEffect, useRef, useState } from "react";
import type { AxiosProgressEvent } from "axios";
import { createEvent } from "../services/EventService";
import { callApi } from "../common/helper/callApi";
import { Calendar } from "primereact/calendar";
import type { CreateEventInput } from "../types/Event";
import { CreateSpeakerModal } from "./CreateSpeakerModal";
import { attendanceService } from "../services/attendanceService";
import { schoolService } from "../services/schoolService";
import { fetchAutocompleteSuggestions, getPlaceDetails } from "../services/trackAsiaService";
import { useNavigate } from "react-router-dom";
import "../styles/CreateEvent.css";


interface CreateEventPageProps {
  onCreated?: () => void; // callback sau khi tạo xong
  fetchEvents?: () => void;
}

const modes = [
  { label: "Offline", value: "OFFLINE" },
  { label: "Online", value: "ONLINE" },
  { label: "Hybrid", value: "HYBRID" },
];

export const CreateNewEvent = ({
  onCreated,
  fetchEvents,
}: CreateEventPageProps) => {
  const navigate = useNavigate();
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + 2);

  const defaultForm: CreateEventInput = {
    name: "",
    description: "",
    date: `${futureDate.getFullYear()}-${pad(futureDate.getMonth() + 1)}-${pad(
      futureDate.getDate()
    )}`, // YYYY-MM-DD, mặc định sau 2 ngày
    startTime: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    durationMinutes: 60,
    location: "",
    categoryId: 0, // Changed from category enum to categoryId
    organizer: "",
    active: 1,
    mode: "OFFLINE",
    joinLink: "",
    qaLink: "",
    ticketed: false, // ⬅ mặc định không bán vé
    ticketPrice: 0, // ⬅ giá vé mặc định 0
    quantity: null, // ⬅ số lượng người (null = không giới hạn)
    isForSchool: false, // ⬅ mở rộng cho tất cả (false = không chỉ sinh viên trường)
    isOpen: false, // ⬅ mặc định không mở đăng ký
  };

  const [form, setForm] = useState<CreateEventInput>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showEventTypeSelection, setShowEventTypeSelection] = useState(true);
  const [categories, setCategories] = useState<Array<{ label: string; value: number; id: number }>>([]);
  const [schools, setSchools] = useState<Array<{ label: string; value: number; id: number }>>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);

  // Track-Asia Autocomplete states
  const [suggestions, setSuggestions] = useState<Array<{ description: string; place_id: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setSelectedFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Revoke preview object URL when it changes/unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        try {
          URL.revokeObjectURL(previewUrl);
        } catch {
          // ignore
        }
      }
    };
  }, [previewUrl]);

  // Track-Asia Autocomplete handler
  const handleLocationChange = async (value: string) => {
    handleChange("location", value);

    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setLoadingSuggestions(true);
      console.log("🔍 Fetching autocomplete suggestions for:", value);

      const results = await fetchAutocompleteSuggestions(value);
      console.log("✅ Autocomplete results:", results);

      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      console.error("❌ Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = async (suggestion: { description: string; place_id: string }) => {
    console.log("🎯 Selected suggestion:", suggestion);

    handleChange("location", suggestion.description);
    setShowSuggestions(false);

    // Get coordinates using Place Details API
    try {
      console.log("📍 Fetching place details with place_id:", suggestion.place_id);
      const result = await getPlaceDetails(suggestion.place_id);

      if (result) {
        console.log("✅ Got coordinates from Place Details:", result);
        setForm((prev) => ({
          ...prev,
          location: result.address,
          latitude: result.latitude,
          longitude: result.longitude,
          radiusMeters: 100,
        }));
      } else {
        console.warn("⚠️ No location data from Place Details");
      }
    } catch (error) {
      console.error("❌ Error fetching place details:", error);
    }
  };
  console.log("result loction:", form.latitude, form.longitude);
  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await schoolService.getAllCategories();
        const categoryData = Array.isArray(response) ? response : response.data;
        if (categoryData && Array.isArray(categoryData)) {
          const formattedCategories = categoryData
            .filter((cat: any) => cat.active) // Chỉ lấy danh mục hoạt động
            .map((cat: any) => ({
              label: cat.label,
              value: cat.id, // Changed from cat.value to cat.id
              id: cat.id,
            }));
          setCategories(formattedCategories);
          // Set default category to first active category
          if (formattedCategories.length > 0) {
            setForm((prev) => ({ ...prev, categoryId: formattedCategories[0].id }));
          }
        }
      } catch (error) {
        console.error("Error loading categories:", error);
        // Fallback to empty array if API fails
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  const addMinutes = (time: string, minutes: number): string => {
  const [h, m] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  date.setMinutes(date.getMinutes() + minutes);

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

  // Load schools from API
  useEffect(() => {
    const loadSchools = async () => {
      try {
        setLoadingSchools(true);
        console.log('📡 Bắt đầu load danh sách trường...');

        const response = await schoolService.getAllSchools();
        console.log('✅ API Response (raw):', response);

        // Xử lý response - có thể là array hoặc object có property data
        const schoolData = Array.isArray(response) ? response : response?.data || [];
        console.log('📋 School data sau xử lý:', schoolData);

        if (schoolData && Array.isArray(schoolData)) {
          const formattedSchools = schoolData
            .filter((school: any) => school.active !== false) // Lấy tất cả trừ những có active = false
            .map((school: any) => ({
              label: school.name || `Trường ID: ${school.id}`,
              value: school.id,
              id: school.id,
            }));

          console.log('✨ Formatted schools:', formattedSchools);
          setSchools(formattedSchools);
        } else {
          console.warn('⚠️ schoolData không phải array:', schoolData);
          setSchools([]);
        }
      } catch (error) {
        console.error("❌ Error loading schools:", error);
        setSchools([]);
      } finally {
        setLoadingSchools(false);
      }
    };

    loadSchools();
  }, []);
  
  const eventEnd = addMinutes(form.startTime, form.durationMinutes);
  const [showSpeakerModal, setShowSpeakerModal] = useState(false);
  const [attendanceEnabled, setAttendanceEnabled] = useState(false);
  const [checkInType, setCheckInType] = useState<"NONE" | "AUTO" | "QR_SCAN" | "BOTH">("NONE");
  const [checkInStart, setCheckInStart] = useState<string>(form.startTime);
  const [checkInEnd, setCheckInEnd] = useState<string>(addMinutes(form.startTime, 15));
  const [checkOutStart, setCheckOutStart] = useState<string>(addMinutes(eventEnd, -15));
  const [checkOutEnd, setCheckOutEnd] = useState<string>(eventEnd);

  // reset form về default
  const resetForm = () => {
    setForm(defaultForm);
    setAttendanceEnabled(false);
    setCheckInType("NONE");
    setCheckInStart(form.startTime);
    setCheckInEnd(addMinutes(form.startTime, 15));
    setCheckOutStart(addMinutes(eventEnd, -15));
    setCheckOutEnd(eventEnd);
  };
  console.log('Create Event form state:', form);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (field: keyof CreateEventInput, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (!form.name  || !form.categoryId || form.categoryId <= 0) {
        alert("Vui lòng điền đầy đủ thông tin: tên, mô tả, địa điểm, và danh mục sự kiện");
        setLoading(false);
        return;
      }

      // Validate school selection when isForSchool is enabled
      if (form.isForSchool && !form.allowedSchoolIds?.length) {
        alert("Vui lòng chọn ít nhất một trường được phép tham gia");
        setLoading(false);
        return;
      }

      // prepare payload and optionally upload image first
      const payload: Partial<CreateEventInput> & { imagePath?: string; imagePublicId?: string } = {
        ...form,
        ticketed: form.ticketed,
        ticketPrice: form.ticketPrice,
        checkInType: checkInType,
      };

      console.log("📤 Payload trước khi gửi:", JSON.stringify(payload, null, 2));
      console.log("📋 Form state:", form);
      console.log("✅ Attendance enabled:", attendanceEnabled);
      console.log("🔐 CheckInType:", checkInType);

      // If an image file is selected, upload it to backend first
      if (selectedFile) {
        try {
          const formData = new FormData();
          formData.append("file", selectedFile);

          setUploadProgress(1);

          const uploadRes = await callApi<{
            url?: string;
            public_id?: string;
          }>(
            "POST",
            "upload/file",
            formData,
            true,
            {
              onUploadProgress: (progressEvent?: AxiosProgressEvent) => {
                if (progressEvent && progressEvent.total) {
                  // loaded may be undefined in some typings, coerce to number
                  const loaded = (progressEvent.loaded ?? 0) as number;
                  const total = progressEvent.total as number;
                  const pct = Math.round((loaded * 100) / total);
                  setUploadProgress(pct);
                }
              },
            }
          );

          if (uploadRes) {
            if (uploadRes.url) payload.imagePath = uploadRes.url;
            if (uploadRes.public_id) payload.imagePublicId = uploadRes.public_id;
          }

          // finish progress
          setUploadProgress(100);
          setTimeout(() => setUploadProgress(0), 400);
        } catch (err) {
          console.error("Image upload failed", err);
          setUploadProgress(0);
          // proceed without image
        }
      }

      console.log("📤 Final payload sau upload:", JSON.stringify(payload, null, 2));
      const created = await createEvent(payload as CreateEventInput);

      console.log("✅ Event tạo thành công:", created);
      console.log("📍 Event ID:", (created as any)?.id ?? (created as any)?.eventId);
      console.log("checkInType", checkInType);
      // If attendance was enabled in the modal, create an attendance session for the event
      if(checkInType === "AUTO" || checkInType === "BOTH") {
      try {
        console.log('RUnning')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const createdAny: any = created;
        const eventId = createdAny?.id ?? createdAny?.eventId ?? createdAny?.event_id ?? null;
        if (eventId) {
          console.log("📅 Tạo attendance session cho event:", eventId);
          const fmt = (t: string) => (t && t.length === 5 ? `${t}:00` : t);
          const sessionDto = {
            eventId: Number(eventId),
            sessionDate: form.date,
            startTime: fmt(form.startTime),
            endTime: fmt(
              // derive endTime from startTime + duration if not set explicitly
              (() => {
                const parts = form.startTime.split(":");
                if (parts.length >= 2) {
                  const d = new Date();
                  d.setHours(Number(parts[0]));
                  d.setMinutes(Number(parts[1]) + (form.durationMinutes || 0));
                  const hh = String(d.getHours()).padStart(2, "0");
                  const mm = String(d.getMinutes()).padStart(2, "0");
                  return `${hh}:${mm}:00`;
                }
                return fmt(form.startTime);
              })()
            ),
            checkInStart: fmt(checkInStart),
            checkInEnd: fmt(checkInEnd),
            checkOutStart: fmt(checkOutStart),
            checkOutEnd: fmt(checkOutEnd),
          };

          console.log("📝 Session DTO:", JSON.stringify(sessionDto, null, 2));
          await attendanceService.createSession(sessionDto);
          console.log("✅ Attendance session tạo thành công");
        }
      } catch (e) {
        // session creation failure shouldn't block event creation flow
        console.warn("Failed to create attendance session:", e);
      }}

      setLoading(false);
      resetForm(); // reset sau khi tạo xong
      fetchEvents?.();
      onCreated?.();

      // Clean up preview and selected file
      if (previewUrl) {
        try { URL.revokeObjectURL(previewUrl); } catch { /* ignore */ }
      }
      setSelectedFile(null);
      setPreviewUrl(null);

      // Mở modal thêm Speaker ngay sau khi tạo event
      setShowSpeakerModal(true);
    } catch (error) {
      setLoading(false);
      console.error("Failed to create event", error);
    }
  };

  const handleClose = () => {
    resetForm(); // reset khi đóng
    setShowEventTypeSelection(true);
  };

  const handleSelectEventType = (isForSchool: boolean) => {
    handleChange("isForSchool", isForSchool);
  };

  return (
    <div className="page-wrapper">
      <div className="header-page">

        {
          !showEventTypeSelection && <Button
            icon="pi pi-arrow-left"
            className="p-button-rounded p-button-text"
            onClick={handleClose}
            tooltip="Quay lại"
          />
        }
        <h1>{showEventTypeSelection ? "Chọn loại sự kiện" : "Tạo sự kiện mới"}</h1>
        <div style={{ width: "40px" }} /> {/* Spacer for centering */}
      </div>

      <div className="page-content">
        {showEventTypeSelection ? (
          // Step 1: Event Type Selection
          <div className="p-fluid create-event-modal event-type-selection">
            <div className="p-field">
              <label style={{ marginBottom: '2rem', display: 'block', fontSize: '1.1rem', fontWeight: 500 }}>Vui lòng chọn loại sự kiện:</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1.5rem',
                    border: !form.isForSchool ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: !form.isForSchool ? '#eff6ff' : '#fff'
                  }}
                  onClick={() => handleSelectEventType(false)}
                >
                  <div style={{ fontSize: '2.5rem' }}>🌐</div>
                  <input
                    type="radio"
                    name="eventType"
                    checked={!form.isForSchool}
                    onChange={() => { }}
                    style={{ display: 'none' }}
                  />
                  <div style={{ textAlign: 'center' }}>
                    <strong style={{ fontSize: '1.1rem', display: 'block', marginBottom: '0.5rem' }}>Công khai</strong>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Ai cũng có thể xem và đăng ký sự kiện này</p>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1.5rem',
                    border: form.isForSchool ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: form.isForSchool ? '#eff6ff' : '#fff'
                  }}
                  onClick={() => handleSelectEventType(true)}
                >
                  <div style={{ fontSize: '2.5rem' }}>🏫</div>
                  <input
                    type="radio"
                    name="eventType"
                    checked={form.isForSchool}
                    onChange={() => { }}
                    style={{ display: 'none' }}
                  />
                  <div style={{ textAlign: 'center' }}>
                    <strong style={{ fontSize: '1.1rem', display: 'block', marginBottom: '0.5rem' }}>Sinh viên trường</strong>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Chỉ sinh viên của trường mới có thể xem</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-field modal-actions" style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <Button label="Tiếp theo" className="p-button-success" onClick={() => setShowEventTypeSelection(false)} />
            </div>
          </div>
        ) : (
          // Step 2: Event Form
          <div className="p-fluid create-event-modal event-form">
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' }}>
              {/* Display current event type */}
              <div className="p-field">
                <div style={{ display: 'flex', marginBottom: '0.75rem' }}>
                  <label style={{ marginRight: '0.5rem' }}>Loại sự kiện:</label>
                  {form.isForSchool && '🏫 Sinh viên trường'}
                  {!form.isForSchool && '🌐 Công khai'}
                </div>
              </div>

              {/* Show school selection when isForSchool is true */}
              {form.isForSchool && (
                <div className="p-field">
                  <label>Chọn trường được phép tham gia</label>
                  {loadingSchools ? (
                    <div style={{ padding: '0.75rem', color: '#666' }}>
                      ⏳ Đang tải danh sách trường...
                    </div>
                  ) : (
                    <>
                      <MultiSelect
                        value={form.allowedSchoolIds || []}
                        options={schools}
                        onChange={(e) => handleChange("allowedSchoolIds", e.value)}
                        placeholder={schools.length === 0 ? "Không có trường nào" : "Chọn một hoặc nhiều trường"}
                        display="chip"
                        optionLabel="label"
                        optionValue="id"
                        showSelectAll={true}
                        disabled={schools.length === 0}
                      />
                      <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
                        {schools.length === 0 ? (
                          '❌ Không tìm thấy trường nào'
                        ) : form.allowedSchoolIds && form.allowedSchoolIds.length > 0 ? (
                          `✅ Đã chọn ${form.allowedSchoolIds.length} / ${schools.length} trường`
                        ) : (
                          `📍 Có ${schools.length} trường có sẵn`
                        )}
                      </small>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="p-field">
              <label>Tên sự kiện</label>
              <InputText
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>

            <div
              className="event-time-row"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1rem",
              }}
            >
              <div className="p-field">
                <label>
                  Ngày tổ chức
                </label>
                <Calendar
                  value={form.date ? new Date(form.date) : null}
                  onChange={(e) => {
                    const date = e.value;
                    const localDateStr = date
                      ? `${date.getFullYear()}-${String(
                        date.getMonth() + 1
                      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
                      : "";
                    handleChange("date", localDateStr);
                  }}
                  dateFormat="dd-mm-yy"
                  placeholder="DD-MM-YYYY"
                  minDate={new Date(new Date().setDate(new Date().getDate() + 1))}
                  showIcon
                />
              </div>

              <div className="p-field">
                <label>Thời gian bắt đầu (HH:mm)</label>
                <Calendar
                  value={
                    form.startTime
                      ? new Date(`1970-01-01T${form.startTime}:00`)
                      : null
                  }
                  onChange={(e) => {
                    const date = e.value;
                    handleChange(
                      "startTime",
                      `${String(date.getHours()).padStart(2, "0")}:${String(
                        date.getMinutes()
                      ).padStart(2, "0")}`
                    );
                  }}
                  timeOnly
                  showIcon
                  hourFormat="24"
                
                />
              </div>

              <div className="p-field">
                <label>Thời lượng (phút)</label>
                <InputNumber
                  value={form.durationMinutes}
                  onValueChange={(e) =>
                    setForm({ ...form, durationMinutes: e.value ?? 0 })
                  }
                  min={0}
                />
              </div>
            </div>


            <div className="" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
              <div className="p-field">
                <label>Danh mục</label>
                <Dropdown
                  value={form.categoryId}
                  options={categories}
                  onChange={(e) => handleChange("categoryId", e.value)}
                  placeholder="Chọn danh mục"
                  filter // 🔍 bật ô tìm kiếm
                  filterBy="label" // tìm theo label
                  showClear // nút xoá lựa chọn
                  optionLabel="label"
                  optionValue="id"
                />
              </div>
              <div className="p-field">
                <label>Chế độ</label>
                <Dropdown
                  value={form.mode}
                  options={modes}
                  onChange={(e) => handleChange("mode", e.value)}
                  placeholder="Chọn chế độ"
                />
                {/* Số lượng người tối đa */}

              </div>
              <div className="p-field">
                <label>Số lượng người đăng ký</label>
                <InputNumber
                  value={form.quantity}
                  onValueChange={(e) => handleChange("quantity", e.value)}
                  placeholder="Để trống = không giới hạn"
                  min={1}
                />
              </div>
            </div>

            <div className="p-field">
              <label className="modal-field-label">Link hỏi đáp</label>
              <InputText
                value={form.qaLink}
                onChange={(e) => handleChange("qaLink", e.target.value)}
              />
            </div>

            {["ONLINE", "HYBRID"].includes(form.mode) && (
              <>
                <div className="p-field">
                  <label>Link tham gia</label>
                  <InputText
                    value={form.joinLink}
                    onChange={(e) => handleChange("joinLink", e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="p-field">
              <label>Địa điểm</label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  placeholder="Nhập địa chỉ sự kiện"

                  autoComplete="off"
                />

                {/* Track-Asia Autocomplete Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    backgroundColor: "#fff",
                    border: "1px solid #ddd",
                    borderTop: "none",
                    borderRadius: "0 0 4px 4px",
                    maxHeight: "200px",
                    overflowY: "auto",
                    zIndex: 1000,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                  }}>
                    {suggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        style={{
                          padding: "10px 12px",
                          cursor: "pointer",
                          borderBottom: idx < suggestions.length - 1 ? "1px solid #f0f0f0" : "none",
                          fontSize: "14px"
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = "#f5f5f5";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = "#fff";
                        }}
                      >
                        📍 {suggestion.description}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {loadingSuggestions && (
                <small style={{ color: "#999", marginTop: "4px", display: "block" }}>
                  ⏳ Đang tìm kiếm...
                </small>
              )}

              
            </div>

            <div className="p-field">
              <label>Mô tả</label>
              <InputTextarea
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
              />
            </div>
            <div className="p-field">
              <label>Ảnh sự kiện (tùy chọn)</label>
              <input type="file" accept="image/*" onChange={onFileChange} />
              {previewUrl && (
                <>
                  <img src={previewUrl} alt="preview" style={{ width: 160, height: 90, objectFit: 'cover', marginTop: 8, borderRadius: 6 }} />
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div style={{ width: 160, marginTop: 8 }}>
                      <div style={{ width: '100%', height: 8, background: '#eee', borderRadius: 6 }}>
                        <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#4caf50', borderRadius: 6 }} />
                      </div>
                      <small>{uploadProgress}%</small>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Check-in Type Selection */}
            {(
              <div className="p-field modal-section">
                <label className="modal-field-label">Lựa chọn phương thức điểm danh</label>
                <Dropdown
                  value={checkInType}
                  options={[
                    { label: "Không điểm danh", value: "NONE" },
                    { label: "Tự động (dựa trên thời gian hệ thống)", value: "AUTO" },
                    { label: "Quét mã QR", value: "QR_SCAN" },
                    { label: "Cả 2 (tự động + quét mã QR)", value: "BOTH" },
                  ]}
                  onChange={(e) => setCheckInType(e.value)}
                />
              </div>
            )}

            { /* System check-in time settings */}
            {(checkInType === "AUTO" || checkInType === "BOTH") && (
              <>
                <label className="modal-field-label">Cài đặt thời gian hệ thống điểm danh</label>
                <div
                  className="checkin-time-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "1rem",
                  }}
                >

                  <div className="p-field modal-section">
                    <label className="modal-field-label">Check-in bắt đầu</label>
                    <Calendar
                      value={checkInStart ? new Date(`1970-01-01T${checkInStart}:00`) : null}
                      onChange={(e) => {
                        const d = e.value;
                        setCheckInStart(
                          `${String(d.getHours()).padStart(2, "0")}:${String(
                            d.getMinutes()
                          ).padStart(2, "0")}`
                        );
                      }}
                      timeOnly
                      hourFormat="24"
                      showIcon
                    />
                  </div>

                  <div className="p-field modal-section">
                    <label className="modal-field-label">Check-in kết thúc</label>
                    <Calendar
                      value={checkInEnd ? new Date(`1970-01-01T${checkInEnd}:00`) : null}
                      onChange={(e) => {
                        const d = e.value;
                        setCheckInEnd(
                          `${String(d.getHours()).padStart(2, "0")}:${String(
                            d.getMinutes()
                          ).padStart(2, "0")}`
                        );
                      }}
                      timeOnly
                      hourFormat="24"
                      showIcon
                    />
                  </div>

                  <div className="p-field modal-section">
                    <label className="modal-field-label">Check-out bắt đầu</label>
                    <Calendar
                      value={checkOutStart ? new Date(`1970-01-01T${checkOutStart}:00`) : null}
                      onChange={(e) => {
                        const d = e.value;
                        setCheckOutStart(
                          `${String(d.getHours()).padStart(2, "0")}:${String(
                            d.getMinutes()
                          ).padStart(2, "0")}`
                        );
                      }}
                      timeOnly
                      hourFormat="24"
                      showIcon
                    />
                  </div>

                  <div className="p-field modal-section">
                    <label className="modal-field-label">Check-out kết thúc</label>
                    <Calendar
                      value={checkOutEnd ? new Date(`1970-01-01T${checkOutEnd}:00`) : null}
                      onChange={(e) => {
                        const d = e.value;
                        setCheckOutEnd(
                          `${String(d.getHours()).padStart(2, "0")}:${String(
                            d.getMinutes()
                          ).padStart(2, "0")}`
                        );
                      }}
                      timeOnly
                      hourFormat="24"
                      showIcon
                    />
                  </div>
                </div>
              </>
            )}

            <div className="p-field modal-actions">
              <Button
                label="Tạo"
                className="p-button-success"
                onClick={handleSubmit}
                loading={loading}
              />
              <Button label="Hủy" className="p-button-secondary" onClick={handleClose} />
            </div>
          </div>
        )}
      </div>

      <CreateSpeakerModal
        visible={showSpeakerModal}
        onHide={() => setShowSpeakerModal(false)}
        fetchEvents={fetchEvents}
        onCreated={() => {
          setShowSpeakerModal(false);
          console.log("Speaker created successfully!");
        }}
      />
    </div>
  );
};
