import React, { useState, useRef, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { Calendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import type { AxiosProgressEvent } from 'axios';
import { getEventStats, updateEvent } from '../../services/EventService';
import { callApi } from '../../common/helper/callApi';
import type { EventStats, CreateEventInput } from '../../types/Event';
import { authHelper } from '../../common/helper/authHelper';
import { schoolService } from '../../services/schoolService';
import { fetchAutocompleteSuggestions, getPlaceDetails } from '../../services/trackAsiaService';
import { showWarningToast, showSuccessToast, showErrorToast } from '../../common/helper/toastHelper';
import "../../styles/CreateEvent.css";

const modes = [
  { label: 'Offline', value: 'OFFLINE' },
  { label: 'Online', value: 'ONLINE' },
  { label: 'Hybrid', value: 'HYBRID' },
];

interface School {
  label: string;
  value: number;
  id: number;
}

interface EditEventModalProps {
  visible: boolean;
  eventId: number | null;
  onHide: () => void;
  onSuccess?: () => void;
}

const EditEventModal: React.FC<EditEventModalProps> = ({ visible, eventId, onHide, onSuccess }) => {
  const toastRef = useRef<Toast | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [foundEvent, setFoundEvent] = useState<EventStats | null>(null);

  // Form fields
  const [form, setForm] = useState<Partial<CreateEventInput & { eventId?: number }>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ label: string; value: number; id: number }>>([]);
  const [schools, setSchools] = useState<Array<School>>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Check-in/Check-out settings
  const [checkInSettings, setCheckInSettings] = useState<any>(null);
  const [checkinType, setCheckInType] = useState<"NONE" | "AUTO" | "QR_SCAN" | "BOTH">("AUTO");
  const [checkinStart, setCheckInStart] = useState<string>("09:45");
  const [checkinEnd, setCheckInEnd] = useState<string>("10:15");
  const [checkoutStart, setCheckOutStart] = useState<string>("10:45");
  const [checkoutEnd, setCheckOutEnd] = useState<string>("11:15");

  // Track-Asia Autocomplete
  const [suggestions, setSuggestions] = useState<Array<{ description: string; place_id: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const pad = (n: number) => String(n).padStart(2, '0');
  
  // Helper: Parse startTime string (HH:mm or HH:mm:ss) to Date object
  const parseStartTime = (timeStr: string | null | undefined): Date | null => {
    if (!timeStr) return null;
    
    try {
      // Handle both HH:mm and HH:mm:ss formats
      const timeParts = timeStr.split(':');
      if (timeParts.length < 2) return null;
      
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return null;
      }
      
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    } catch (error) {
      console.warn('Failed to parse startTime:', timeStr, error);
      return null;
    }
  };

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await schoolService.getAllCategories();
        const categoryData = Array.isArray(response) ? response : response.data;
        if (categoryData && Array.isArray(categoryData)) {
          const formattedCategories = categoryData
            .filter((cat: any) => cat.active)
            .map((cat: any) => ({
              label: cat.label,
              value: cat.id,
              id: cat.id,
            }));
          setCategories(formattedCategories);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  // Load schools
  useEffect(() => {
    const loadSchools = async () => {
      try {
        setLoadingSchools(true);
        const response = await schoolService.getAllSchools();
        const schoolData = Array.isArray(response) ? response : response?.data || [];
        
        if (schoolData && Array.isArray(schoolData)) {
          const formattedSchools = schoolData
            .filter((school: any) => school.active !== false)
            .map((school: any) => ({
              label: school.name || `Trường ID: ${school.id}`,
              value: school.id,
              id: school.id,
            }));
          
          setSchools(formattedSchools);
        } else {
          setSchools([]);
        }
      } catch (error) {
        console.error('❌ Error loading schools:', error);
        setSchools([]);
      } finally {
        setLoadingSchools(false);
      }
    };

    loadSchools();
  }, []);

  // Load event data when modal opens with eventId
  useEffect(() => {
    if (visible && eventId) {
      loadEventData(eventId);
    } else {
      // Reset form when modal closes
      setFoundEvent(null);
      setForm({});
      setSelectedFile(null);
      setPreviewUrl(null);
      setCheckInSettings(null);
    }
  }, [visible, eventId]);

  const loadEventData = async (id: number) => {
    try {
      setLoading(true);
      const eventData = await getEventStats(id);
      setFoundEvent(eventData);

      // Populate form with event data
      setForm({
        eventId: id,
        name: eventData.eventName,
        description: eventData.description,
        date: eventData.date,
        startTime: eventData.startTime,
        durationMinutes: eventData.durationMinutes,
        location: eventData.location,
        categoryId: Number(eventData.category),
        mode: eventData.eventMode,
        joinLink: eventData.joinLink,
        qaLink: eventData.qalink,
        ticketed: eventData.ticketed,
        ticketPrice: eventData.ticketPrice || 0,
        quantity: eventData.quantity,
        isForSchool: (eventData as any).isForSchool || false,
        isOpen: (eventData as any).isOpen || false,
        latitude: eventData.latitude,
        longitude: eventData.longitude,
        radiusMeters: eventData.radiusMeters,
      });

      if (eventData.imagePath) {
        setPreviewUrl(eventData.imagePath);
      }

      // Load allowed schools if isForSchool = true
      if ((eventData as any).isForSchool) {
        try {
          const response = await callApi<any[]>(
            'GET',
            `events/${id}/allowed-schools`,
            undefined,
            true
          );
          const allowedSchoolIds = Array.isArray(response) ? response : response?.data || [];
          
          setForm((prev) => ({
            ...prev,
            allowedSchoolIds: allowedSchoolIds,
          }));
        } catch (error) {
          console.warn('Could not load allowed schools:', error);
        }
      }

      // Load check-in/check-out settings
      try {
        const settingsResponse = await callApi<any>(
          'GET',
          `attendance/admin/event/${id}/checkin-settings`,
          undefined,
          true
        );
        if (settingsResponse) {
          setCheckInSettings(settingsResponse);
          setCheckInType(settingsResponse.checkInType || "NONE");
          setCheckInStart(settingsResponse.checkinStart || "09:45");
          setCheckInEnd(settingsResponse.checkinEnd || "10:15");
          setCheckOutStart(settingsResponse.checkoutStart || "10:45");
          setCheckOutEnd(settingsResponse.checkoutEnd || "11:15");
        } else {
          setCheckInSettings(null);
        }
      } catch (error) {
        console.warn('Could not load check-in settings:', error);
        setCheckInSettings(null);
      }
    } catch (error) {
      console.error('Failed to fetch event:', error);
      showErrorToast(toastRef, 'Không tải được thông tin sự kiện');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateEventInput, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setSelectedFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    }
  };

  const handleLocationChange = async (value: string) => {
    handleChange('location', value);

    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setLoadingSuggestions(true);
      const results = await fetchAutocompleteSuggestions(value);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSelectSuggestion = async (suggestion: { description: string; place_id: string }) => {
    handleChange('location', suggestion.description);
    setShowSuggestions(false);

    try {
      const result = await getPlaceDetails(suggestion.place_id);
      if (result) {
        setForm((prev) => ({
          ...prev,
          location: result.address,
          latitude: result.latitude,
          longitude: result.longitude,
          radiusMeters: 100,
        }));
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  };

  const handleSaveEvent = async () => {
    if (!form.name || !form.description || !form.location || !form.categoryId || form.categoryId <= 0) {
      showWarningToast(toastRef, 'Vui lòng điền đầy đủ thông tin: tên, mô tả, địa điểm, và danh mục');
      return;
    }

    if (form.isForSchool && !form.allowedSchoolIds?.length) {
      showWarningToast(toastRef, 'Vui lòng chọn ít nhất một trường được phép tham gia');
      return;
    }

    try {
      setSaveLoading(true);

      const payload: any = { ...form };
      payload.checkInType = checkinType;
      delete payload.eventId;
        
      // Handle image upload if new file selected
      if (selectedFile) {
        try {
          const formData = new FormData();
          formData.append('file', selectedFile);
          setUploadProgress(1);

          const uploadRes = await callApi<{ url?: string; public_id?: string }>(
            'POST',
            'upload/file',
            formData,
            true,
            {
              onUploadProgress: (progressEvent?: AxiosProgressEvent) => {
                if (progressEvent && progressEvent.total) {
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

          setUploadProgress(100);
          setTimeout(() => setUploadProgress(0), 400);
        } catch (err) {
          console.error('Image upload failed', err);
          setUploadProgress(0);
        }
      }

      const fmt = (timeStr: string): string => {
        const parts = timeStr.split(':');
        if (parts.length === 2) {
          return `${parts[0]}:${parts[1]}:00`;
        }
        return timeStr;
      };
      
      payload.checkinStart = fmt(checkinStart);
      payload.checkinEnd = fmt(checkinEnd);
      payload.checkoutStart = fmt(checkoutStart);
      payload.checkoutEnd = fmt(checkoutEnd);

      await updateEvent(form.eventId as number, payload);

      showSuccessToast(toastRef, 'Cập nhật sự kiện thành công!');
      
      setTimeout(() => {
        onHide();
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);
    } catch (error) {
      console.error('Failed to update event:', error);
      showErrorToast(toastRef, 'Cập nhật sự kiện thất bại!');
    } finally {
      setSaveLoading(false);
    }
  };

  const dialogFooter = (
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
      <Button
        label="Hủy"
        icon="pi pi-times"
        severity="secondary"
        onClick={onHide}
        disabled={saveLoading}
      />
      <Button
        label="Lưu sự kiện"
        icon="pi pi-check"
        severity="success"
        onClick={handleSaveEvent}
        loading={saveLoading}
      />
    </div>
  );

  return (
    <>
      <Dialog
        visible={visible}
        onHide={onHide}
        header={`✏️ Chỉnh sửa sự kiện${foundEvent ? `: ${foundEvent.eventName}` : ''}`}
        style={{ width: '90vw', maxWidth: '1000px' }}
        modal
        footer={dialogFooter}
        closable={!saveLoading}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
            <p>Đang tải thông tin sự kiện...</p>
          </div>
        ) : foundEvent ? (
          <div className="p-fluid create-event-modal event-form" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {/* Event Type Info */}
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong>Loại sự kiện:</strong>
                {form.isForSchool && <span>🏫 Sinh viên trường</span>}
                {!form.isForSchool && <span>🌐 Công khai</span>}
              </div>
            </div>

            {/* School Selection */}
            {form.isForSchool && (
              <div className="p-field" style={{ marginBottom: '1.5rem' }}>
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
                      onChange={(e) => handleChange('allowedSchoolIds', e.value)}
                      placeholder={schools.length === 0 ? 'Không có trường nào' : 'Chọn một hoặc nhiều trường'}
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

            {/* Check-in/Check-out Settings */}
            {checkInSettings && (
              <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #eee' }}>
                <label style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', display: 'block' }}>
                  ⏰ Cài đặt điểm danh
                </label>

                <div className="p-field" style={{ marginBottom: '1rem' }}>
                  <label>Phương thức điểm danh</label>
                  <Dropdown
                    value={checkinType}
                    options={[
                      { label: 'Không điểm danh', value: 'NONE' },
                      { label: 'Tự động (dựa trên thời gian hệ thống)', value: 'AUTO' },
                      { label: 'Quét mã QR', value: 'QR_SCAN' },
                      { label: 'Cả 2 (tự động + quét mã QR)', value: 'BOTH' },
                    ]}
                    onChange={(e) => setCheckInType(e.value)}
                  />
                </div>

                {(checkinType === 'AUTO' || checkinType === 'BOTH') && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '1rem',
                    }}
                  >
                    <div className="p-field">
                      <label>Check-in bắt đầu</label>
                      <Calendar
                        value={checkinStart ? new Date(`1970-01-01T${checkinStart}:00`) : null}
                        onChange={(e) => {
                          const d = e.value;
                          if (d && d instanceof Date && !isNaN(d.getTime())) {
                            setCheckInStart(
                              `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
                            );
                          }
                        }}
                        timeOnly
                        hourFormat="24"
                        showIcon
                      />
                    </div>

                    <div className="p-field">
                      <label>Check-in kết thúc</label>
                      <Calendar
                        value={checkinEnd ? new Date(`1970-01-01T${checkinEnd}:00`) : null}
                        onChange={(e) => {
                          const d = e.value;
                          if (d && d instanceof Date && !isNaN(d.getTime())) {
                            setCheckInEnd(
                              `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
                            );
                          }
                        }}
                        timeOnly
                        hourFormat="24"
                        showIcon
                      />
                    </div>

                    <div className="p-field">
                      <label>Check-out bắt đầu</label>
                      <Calendar
                        value={checkoutStart ? new Date(`1970-01-01T${checkoutStart}:00`) : null}
                        onChange={(e) => {
                          const d = e.value;
                          if (d && d instanceof Date && !isNaN(d.getTime())) {
                            setCheckOutStart(
                              `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
                            );
                          }
                        }}
                        timeOnly
                        hourFormat="24"
                        showIcon
                      />
                    </div>

                    <div className="p-field">
                      <label>Check-out kết thúc</label>
                      <Calendar
                        value={checkoutEnd ? new Date(`1970-01-01T${checkoutEnd}:00`) : null}
                        onChange={(e) => {
                          const d = e.value;
                          if (d && d instanceof Date && !isNaN(d.getTime())) {
                            setCheckOutEnd(
                              `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
                            );
                          }
                        }}
                        timeOnly
                        hourFormat="24"
                        showIcon
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Basic Info */}
            <div className="p-field">
              <label>Tên sự kiện</label>
              <InputText
                value={form.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div className="p-field">
                <label>Ngày tổ chức</label>
                <Calendar
                  value={form.date ? new Date(form.date) : null}
                  onChange={(e) => {
                    const date = e.value;
                    const localDateStr = date
                      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                      : '';
                    handleChange('date', localDateStr);
                  }}
                  dateFormat="dd-mm-yy"
                  placeholder="DD-MM-YYYY"
                  showIcon
                />
              </div>

              <div className="p-field">
                <label>Thời gian bắt đầu (HH:mm)</label>
                <Calendar
                  value={parseStartTime(form.startTime)}
                  onChange={(e) => {
                    const date = e.value;
                    if (date && date instanceof Date && !isNaN(date.getTime())) {
                      const hours = date.getHours();
                      const minutes = date.getMinutes();
                      handleChange('startTime', `${pad(hours)}:${pad(minutes)}`);
                    }
                  }}
                  timeOnly
                  showIcon
                  hourFormat="24"
                />
              </div>

              <div className="p-field">
                <label>Thời lượng (phút)</label>
                <InputNumber
                  value={form.durationMinutes || 0}
                  onValueChange={(e) => handleChange('durationMinutes', e.value || 0)}
                  min={0}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div className="p-field">
                <label>Danh mục</label>
                <Dropdown
                  value={form.categoryId || 0}
                  options={categories}
                  onChange={(e) => handleChange('categoryId', e.value)}
                  placeholder="Chọn danh mục"
                  filter
                  filterBy="label"
                  showClear
                  optionLabel="label"
                  optionValue="id"
                />
              </div>

              <div className="p-field">
                <label>Chế độ</label>
                <Dropdown
                  value={form.mode || 'OFFLINE'}
                  options={modes}
                  onChange={(e) => handleChange('mode', e.value)}
                  placeholder="Chọn chế độ"
                />
              </div>

              <div className="p-field">
                <label>Số lượng người đăng ký</label>
                <InputNumber
                  value={form.quantity || null}
                  onValueChange={(e) => handleChange('quantity', e.value)}
                  placeholder="Để trống = không giới hạn"
                  min={1}
                />
              </div>
            </div>

            <div className="p-field">
              <label>Link hỏi đáp</label>
              <InputText
                value={form.qaLink || ''}
                onChange={(e) => handleChange('qaLink', e.target.value)}
              />
            </div>

            {['ONLINE', 'HYBRID'].includes(form.mode || '') && (
              <div className="p-field">
                <label>Link tham gia</label>
                <InputText
                  value={form.joinLink || ''}
                  onChange={(e) => handleChange('joinLink', e.target.value)}
                />
              </div>
            )}

            <div className="p-field">
              <label>Địa điểm</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={form.location || ''}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  placeholder="Nhập địa chỉ sự kiện"
                  autoComplete="off"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />

                {showSuggestions && suggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: '#fff',
                    border: '1px solid #ddd',
                    borderTop: 'none',
                    borderRadius: '0 0 4px 4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    {suggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          borderBottom: idx < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                          fontSize: '14px'
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = '#f5f5f5';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = '#fff';
                        }}
                      >
                        📍 {suggestion.description}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {loadingSuggestions && (
                <small style={{ color: '#999', marginTop: '4px', display: 'block' }}>
                  ⏳ Đang tìm kiếm...
                </small>
              )}

              {form.latitude && form.longitude && (
                <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                  📍 Tọa độ: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
                </small>
              )}
            </div>

            <div className="p-field">
              <label>Mô tả</label>
              <InputTextarea
                value={form.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
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
          </div>
        ) : null}
      </Dialog>

      <Toast ref={toastRef} />
    </>
  );
};

export default EditEventModal;