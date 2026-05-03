import { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Avatar } from 'primereact/avatar';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';
import type { AxiosProgressEvent } from 'axios';
import { callApi } from '../common/helper/callApi';
import { localStorageHelper } from '../common/helper/localStorageHelper';
import UserService from '../services/UserService';
import SchoolDepartmentService from '../services/SchoolDepartmentService';
import { formatDateToDDMMYYYY } from '../common/helper/dateHelper';
import '../styles/profile.css';

interface School {
    id: number;
    name: string;
}

interface Department {
    id: number;
    name: string;
}

interface UserProfile {
    id: number;
    name?: string;
    fullname?: string;
    email: string;
    dateOfBirth?: string;
    gender?: string;
    studentId?: string;
    teacherId?: string;
    school?: { id: number; name: string };
    department?: { id: number; name: string };
    avatar?: string;
    role?: string;
}

interface EditableFieldProps {
    label: string;
    field: string;
    value: any;
    type?: 'text' | 'email' | 'date' | 'dropdown' | 'school-dropdown' | 'department-dropdown';
    options?: Array<{ label: string; value: string }>;
    editMode: boolean;
    formData: UserProfile;
    schools: School[];
    departments: Department[];
    onFieldChange: (field: string, value: any) => void;
    onLoadDepartments: (schoolId: number) => Promise<void>;
    disabled?: boolean;
}

// Tách EditableField ra thành component riêng để tránh re-mount
const EditableField: React.FC<EditableFieldProps> = ({
    label,
    field,
    value,
    type = 'text',
    options,
    editMode,
    formData,
    schools,
    departments,
    onFieldChange,
    onLoadDepartments,
    disabled = false,
}) => {
    if (!editMode || disabled) {
        // Helper function to safely render value
        const renderValue = () => {
            if (!value) return '-';
            
            if (type === 'date') {
                if (value instanceof Date) {
                    return formatDateToDDMMYYYY(value);
                } else if (typeof value === 'string') {
                    return formatDateToDDMMYYYY(value);
                }
                return '-';
            }
            
            if ((type === 'school-dropdown' || type === 'department-dropdown') && typeof value === 'object' && value !== null) {
                return value.name || '-';
            }
            
            return value;
        };

        return (
            <div className="editable-field view-mode">
                <label className="field-label">{label}:</label>
                <span className="field-text">
                    {renderValue()}
                </span>
            </div>
        );
    }

    return (
        <div className="editable-field edit-mode">
            <label className="field-label">{label}:</label>
            <div className="field-input">
                {type === 'date' ? (
                    <Calendar
                        value={formData[field as keyof UserProfile] ? new Date(formData[field as keyof UserProfile] as any) : null}
                        onChange={(e) => onFieldChange(field, e.value)}
                        dateFormat="dd/mm/yy"
                        showIcon
                        placeholder="Chọn ngày..."
                    />
                ) : type === 'school-dropdown' ? (
                    <Dropdown
                        value={formData.school}
                        onChange={(e) => {
                            console.log('🎯 School selected:', e.value);
                            onFieldChange('school', e.value);
                            if (e.value?.id) {
                                console.log('📞 Loading departments for schoolId:', e.value.id);
                                onLoadDepartments(e.value.id);
                            } else {
                                console.warn('⚠️ e.value.id không tồn tại:', e.value);
                            }
                        }}
                        options={schools}
                        optionLabel="name"
                        compareBy="id"
                        placeholder="Chọn trường..."
                        emptyMessage="Không có dữ liệu"
                    />
                ) : type === 'department-dropdown' ? (
                    <Dropdown
                        value={formData.department}
                        onChange={(e) => onFieldChange('department', e.value)}
                        options={departments}
                        optionLabel="name"
                        compareBy="id"
                        placeholder="Chọn khoa..."
                        emptyMessage="Không có dữ liệu"
                    />
                ) : type === 'dropdown' ? (
                    <Dropdown
                        value={formData[field as keyof UserProfile]}
                        onChange={(e) => onFieldChange(field, e.value)}
                        options={options || []}
                        placeholder="Chọn..."
                        emptyMessage="Không có dữ liệu"
                    />
                ) : (
                    <InputText
                        value={(formData[field as keyof UserProfile] || '') as string}
                        onChange={(e) => onFieldChange(field, e.target.value)}
                        type={type}
                        className="editable-input"
                        placeholder={type === 'email' ? 'example@email.com' : ''}
                        autoComplete="off"
                    />
                )}
            </div>
        </div>
    );
};

export default function Profile() {
    const toastRef = useRef<Toast>(null);
    const [profile, setProfile] = useState<UserProfile>({
        id: 0,
        name: '',
        fullname: '',
        email: '',
        dateOfBirth: '',
        gender: '',
        studentId: '',
        teacherId: '',
        school: undefined,
        department: undefined,
        avatar: '',
        role: '',
    });

    const [loading, setLoading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [schools, setSchools] = useState<School[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState<UserProfile>(profile);

    useEffect(() => {
        loadProfile();
        loadSchools();
    }, []);

    // Load departments when profile has a school selected
    useEffect(() => {
        if (profile.school?.id) {
            loadDepartments(profile.school.id);
        }
    }, [profile.school?.id]);

    useEffect(() => {
        setFormData(profile);
    }, [profile]);

    const loadProfile = async () => {
        try {
            const userId = Number(localStorageHelper.getItem('idUser'));
            if (!userId) {
                toastRef.current?.show({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: 'Không tìm thấy ID người dùng',
                    life: 3000,
                });
                return;
            }

            const userData = await UserService.getUserById(userId);
            console.log('👤 User Profile loaded:', userData);
            console.log('🏫 School in profile:', userData.school);
            console.log('🎓 Department in profile:', userData.department);
            setProfile(userData);
        } catch (error) {
            console.error('Error loading profile:', error);
            // Fallback to localStorage if API fails
            const userData: UserProfile = {
                id: Number(localStorageHelper.getItem('idUser')) || 0,
                name: localStorageHelper.getItem('fullname') || '',
                fullname: localStorageHelper.getItem('fullname') || '',
                email: localStorageHelper.getItem('email') || '',
                dateOfBirth: '',
                gender: '',
                studentId: '',
                teacherId: '',
                school: undefined,
                department: undefined,
                avatar: '',
            };
            setProfile(userData);
        }
    };

    const loadSchools = async () => {
        try {
            const schoolList = await SchoolDepartmentService.getSchools();
            setSchools(schoolList);
        } catch (error) {
            console.error('Error loading schools:', error);
        }
    };

    const loadDepartments = async (schoolId: number) => {
        try {
            const deptList = await SchoolDepartmentService.getDepartmentsBySchool(schoolId);
            setDepartments(deptList);
        } catch (error) {
            console.error('Error loading departments:', error);
        }
    };

    const handleEditStart = async (field: string) => {
        if (field === 'school' && formData.school?.id) {
            await loadDepartments(formData.school.id);
        }
    };

    const handleEditCancel = () => {
        setEditMode(false);
        setFormData(profile);
    };

    const handleFieldChange = (field: string, value: any) => {
        setFormData({ ...formData, [field]: value });
    };
    console.log('👤 Current formData:', formData);
    const handleSave = async () => {
        setLoading(true);
        try {
            const userId = Number(localStorageHelper.getItem('idUser'));
            if (!userId) {
                throw new Error('Không tìm thấy ID người dùng');
            }

            // Save only changed fields
            const fieldsToUpdate: any = {};

            if (formData.fullname !== profile.fullname) fieldsToUpdate.fullname = formData.fullname;
            // Email is disabled, don't allow updates
            if (formData.dateOfBirth !== profile.dateOfBirth) {
                // Convert Date object to YYYY-MM-DD string format to avoid timezone issues
                let dateValue = formData.dateOfBirth;
                if (formData.dateOfBirth instanceof Date) {
                    const year = formData.dateOfBirth.getFullYear();
                    const month = String(formData.dateOfBirth.getMonth() + 1).padStart(2, '0');
                    const day = String(formData.dateOfBirth.getDate()).padStart(2, '0');
                    dateValue = `${year}-${month}-${day}`;
                }
                fieldsToUpdate.dateOfBirth = dateValue;
            }
            if (formData.gender !== profile.gender) fieldsToUpdate.gender = formData.gender;
            if (formData.studentId !== profile.studentId) fieldsToUpdate.studentId = formData.studentId;
            if (formData.teacherId !== profile.teacherId) fieldsToUpdate.teacherId = formData.teacherId;
            if (formData.school?.id !== profile.school?.id) fieldsToUpdate.schoolId = formData.school?.id;
            if (formData.department?.id !== profile.department?.id) fieldsToUpdate.departmentId = formData.department?.id;
            if (avatarPreview && avatarPreview !== profile.avatar) fieldsToUpdate.avatar = avatarPreview;

            // Update all changed fields
            for (const [key, value] of Object.entries(fieldsToUpdate)) {
                await UserService.updateUserField(userId, key, value);
            }

            // Update profile state
            const newProfile = { ...formData };
            if (avatarPreview) {
                newProfile.avatar = avatarPreview;
            }
            setProfile(newProfile);
            setEditMode(false);
            setAvatarPreview(null);

            // Update localStorage to reflect changes in Header
            if (formData.fullname !== profile.fullname) {
                localStorageHelper.setItem('name', formData.fullname || '');
            }
            if (avatarPreview) {
                localStorageHelper.setItem('avatar', avatarPreview);
            }

            // Dispatch custom event to notify Header component of changes
            window.dispatchEvent(new Event('userProfileUpdated'));

            toastRef.current?.show({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Cập nhật thông tin thành công!',
                life: 3000,
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            toastRef.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: (error as any).message || 'Cập nhật thất bại!',
                life: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                setLoading(true);
                setUploadProgress(1);

                // Upload to Cloudinary via /upload/file endpoint
                const formData = new FormData();
                formData.append('file', file);

                const uploadRes = await callApi<{
                    url?: string;
                    public_id?: string;
                }>(
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

                if (uploadRes?.url) {
                    // Save avatar URL to database via API
                    const userId = Number(localStorageHelper.getItem('idUser'));
                    if (!userId) {
                        throw new Error('User ID not found');
                    }

                    await UserService.updateUser(userId, { avatar: uploadRes.url });

                    // Update profile state with Cloudinary URL
                    const updatedProfile = { ...profile, avatar: uploadRes.url };
                    setProfile(updatedProfile);
                    setAvatarPreview(uploadRes.url);
                    localStorageHelper.setItem('avatar', uploadRes.url);

                    toastRef.current?.show({
                        severity: 'success',
                        summary: 'Thành công',
                        detail: 'Cập nhật avatar thành công',
                        life: 3000,
                    });
                } else {
                    throw new Error('No URL returned from upload');
                }
            } catch (error) {
                console.error('Avatar upload error:', error);
                toastRef.current?.show({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: 'Không thể tải lên avatar',
                    life: 3000,
                });
            } finally {
                setLoading(false);
                setUploadProgress(0);
            }
        }
    };
    console.log('👤 Rendering profile for user:', profile);
    return (
        <div className="profile-page">
            <Toast ref={toastRef} />

            {/* Header with Avatar */}
            <div className="profile-header">
                <Card className="profile-avatar-card">
                    <div className="avatar-container">
                        <Avatar
                            image={avatarPreview || profile.avatar}
                            size="xlarge"
                            shape="circle"
                            style={{ backgroundColor: '#667eea', color: '#fff' }}
                            icon={!profile.avatar ? 'pi pi-user' : undefined}
                        />
                        <div className="avatar-actions">
                            <input
                                type="file"
                                id="avatar-input"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                style={{ display: 'none' }}
                                disabled={loading}
                            />
                            <Button
                                icon="pi pi-camera"
                                className="p-button-rounded p-button-info p-button-sm"
                                onClick={() => document.getElementById('avatar-input')?.click()}
                                loading={loading}
                                disabled={loading}
                            />
                            {uploadProgress > 0 && uploadProgress < 100 && (
                                <div style={{ marginTop: '8px', fontSize: '12px', textAlign: 'center' }}>
                                    {uploadProgress}%
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Profile Information */}
            <div className="profile-content">
                <Card className="profile-card">
                    <h2 className="profile-title">
                        <i className="pi pi-user"></i> Thông tin cá nhân
                    </h2>
                    <Divider />

                    {/* Section 1: Basic Info */}
                    <div className="profile-section">
                        <h3 className="section-title">Thông tin cơ bản</h3>

                        <EditableField
                            key="fullname"
                            label="Họ và tên"
                            field="fullname"
                            value={editMode ? formData.fullname : profile.fullname}
                            type="text"
                            editMode={editMode}
                            formData={formData}
                            schools={schools}
                            departments={departments}
                            onFieldChange={handleFieldChange}
                            onLoadDepartments={loadDepartments}
                        />

                        <EditableField
                            key="email"
                            label="Email"
                            field="email"
                            value={editMode ? formData.email : profile.email}
                            type="email"
                            editMode={editMode}
                            formData={formData}
                            schools={schools}
                            departments={departments}
                            onFieldChange={handleFieldChange}
                            onLoadDepartments={loadDepartments}
                            disabled={true}
                        />

                        <EditableField
                            key="dateOfBirth"
                            label="Ngày sinh"
                            field="dateOfBirth"
                            value={editMode ? formData.dateOfBirth : profile.dateOfBirth}
                            type="date"
                            editMode={editMode}
                            formData={formData}
                            schools={schools}
                            departments={departments}
                            onFieldChange={handleFieldChange}
                            onLoadDepartments={loadDepartments}
                        />

                        <EditableField
                            key="gender"
                            label="Giới tính"
                            field="gender"
                            value={editMode ? formData.gender : profile.gender}
                            type="dropdown"
                            options={[
                                { label: 'Nam', value: 'Nam' },
                                { label: 'Nữ', value: 'Nữ' },
                                { label: 'Khác', value: 'Khác' },
                            ]}
                            editMode={editMode}
                            formData={formData}
                            schools={schools}
                            departments={departments}
                            onFieldChange={handleFieldChange}
                            onLoadDepartments={loadDepartments}
                        />
                    </div>

                    <Divider />

                    {/* Section 2: Academic Info for Students / Work Info for Teachers */}
                    {profile.role !== 'ADMIN' && (
                        profile.role === 'TEACHER' ? (
                            <div className="profile-section">
                                <h3 className="section-title">Nơi công tác</h3>

                                <EditableField
                                    key="school"
                                    label="Trường"
                                    field="school"
                                    value={editMode ? formData.school : profile.school}
                                    type="school-dropdown"
                                    editMode={editMode}
                                    formData={formData}
                                    schools={schools}
                                    departments={departments}
                                    onFieldChange={handleFieldChange}
                                    onLoadDepartments={loadDepartments}
                                />

                                <EditableField
                                    key="department"
                                    label="Khoa"
                                    field="department"
                                    value={editMode ? formData.department : profile.department}
                                    type="department-dropdown"
                                    editMode={editMode}
                                    formData={formData}
                                    schools={schools}
                                    departments={departments}
                                    onFieldChange={handleFieldChange}
                                    onLoadDepartments={loadDepartments}
                                />

                                <EditableField
                                    key="teacherId"
                                    label="Mã giảng viên"
                                    field="teacherId"
                                    value={editMode ? formData.teacherId : profile.teacherId}
                                    type="text"
                                    editMode={editMode}
                                    formData={formData}
                                    schools={schools}
                                    departments={departments}
                                    onFieldChange={handleFieldChange}
                                    onLoadDepartments={loadDepartments}
                                />
                            </div>
                        ) : (
                            <div className="profile-section">
                                <h3 className="section-title">Thông tin học tập</h3>

                                <EditableField
                                    key="studentId"
                                    label="Mã sinh viên"
                                    field="studentId"
                                    value={editMode ? formData.studentId : profile.studentId}
                                    type="text"
                                    editMode={editMode}
                                    formData={formData}
                                    schools={schools}
                                    departments={departments}
                                    onFieldChange={handleFieldChange}
                                    onLoadDepartments={loadDepartments}
                                />

                                <EditableField
                                    key="school"
                                    label="Trường"
                                    field="school"
                                    value={editMode ? formData.school : profile.school}
                                    type="school-dropdown"
                                    editMode={editMode}
                                    formData={formData}
                                    schools={schools}
                                    departments={departments}
                                    onFieldChange={handleFieldChange}
                                    onLoadDepartments={loadDepartments}
                                />

                                <EditableField
                                    key="department"
                                    label="Khoa"
                                    field="department"
                                    value={editMode ? formData.department : profile.department}
                                    type="department-dropdown"
                                    editMode={editMode}
                                    formData={formData}
                                    schools={schools}
                                    departments={departments}
                                    onFieldChange={handleFieldChange}
                                    onLoadDepartments={loadDepartments}
                                />
                            </div>
                        )
                    )}

                    <Divider />

                    {/* Action Buttons */}
                    <div className="profile-actions">
                        {!editMode && (
                            <Button
                                label="Chỉnh sửa"
                                icon="pi pi-pencil"
                                className="p-button-primary"
                                onClick={() => setEditMode(true)}
                            />
                        )}

                        {editMode && (
                            <>
                                <Button
                                    label="Lưu thay đổi"
                                    icon="pi pi-check"
                                    className="p-button-success"
                                    onClick={handleSave}
                                    loading={loading}
                                />
                                <Button
                                    label="Hủy"
                                    icon="pi pi-times"
                                    className="p-button-secondary"
                                    onClick={handleEditCancel}
                                    disabled={loading}
                                />
                            </>
                        )}
                    </div>


                </Card>
            </div>
        </div>
    );
}
