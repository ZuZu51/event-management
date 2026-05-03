import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Steps } from 'primereact/steps';
import { Message } from 'primereact/message';
import { AuthService } from '../services/AuthService';
import type {
  School,
  Department,
  SignupFormData,
} from '../types/Verification';
import '../styles/completeSignup.css';
import { useRef } from 'react';

const CompleteSignupForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useRef<Toast>(null);
  
  //const email = location.state?.email || '';
  const searchParams = new URLSearchParams(location.search);
const email = searchParams.get('email') || '';

  const [step, setStep] = useState<'info' | 'verification'>('info');
  const [userRole, setUserRole] = useState<'STUDENT' | 'TEACHER' | ''>('');
  const [formData, setFormData] = useState<SignupFormData>({
  email,
  fullName: searchParams.get('name') || '',
  dateOfBirth: '',
  gender: '',
  schoolId: null,
  departmentId: null,
  studentId: '',
  teacherId: '',
});

  const [schools, setSchools] = useState<School[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [studentIdError, setStudentIdError] = useState('');
  const [teacherIdError, setTeacherIdError] = useState('');

  // Load schools on mount
  useEffect(() => {
    const loadSchools = async () => {
      try {
        const schoolsList = await AuthService.getSchools();
        setSchools(schoolsList);
      } catch (error) {
        console.error('Error loading schools:', error);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load schools',
        });
      }
    };
    loadSchools();
  }, []);

  // Load departments when school changes
  useEffect(() => {
    if (formData.schoolId) {
      const loadDepartments = async () => {
        try {
          const deptList = await AuthService.getDepartments(formData.schoolId!);
          setDepartments(deptList);
          // Reset department selection
          setFormData((prev) => ({ ...prev, departmentId: null }));
        } catch (error) {
          console.error('Error loading departments:', error);
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load departments',
          });
        }
      };
      loadDepartments();
    }
  }, [formData.schoolId]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Validate studentId when it changes (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (userRole === 'STUDENT' && formData.studentId.trim()) {
        try {
          const exists = await AuthService.checkStudentIdExists(formData.studentId);
          if (exists) {
            setStudentIdError('MSSV đã tồn tại');
          } else {
            setStudentIdError('');
          }
        } catch (error) {
          setStudentIdError('');
        }
      } else {
        setStudentIdError('');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.studentId, userRole]);

  // Validate teacherId when it changes (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (userRole === 'TEACHER' && formData.teacherId.trim()) {
        try {
          const exists = await AuthService.checkTeacherIdExists(formData.teacherId);
          if (exists) {
            setTeacherIdError('MSGV đã tồn tại');
          } else {
            setTeacherIdError('');
          }
        } catch (error) {
          setTeacherIdError('');
        }
      } else {
        setTeacherIdError('');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.teacherId, userRole]);

  const validateInfoStep = (): boolean => {
    if (!userRole) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please select your role',
      });
      return false;
    }
    if (!formData.fullName.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Full name is required',
      });
      return false;
    }
    if (!formData.dateOfBirth) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Date of birth is required',
      });
      return false;
    }
    if (!formData.gender) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Gender is required',
      });
      return false;
    }
    if (!formData.schoolId) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validation',
        detail: 'School is required',
      });
      return false;
    }
    if (!formData.departmentId) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Department is required',
      });
      return false;
    }
    // Only require studentId for students
    if (userRole === 'STUDENT' && !formData.studentId.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Student ID is required',
      });
      return false;
    }
    if (userRole === 'STUDENT' && studentIdError) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validation',
        detail: studentIdError,
      });
      return false;
    }
    // Only require teacherId for teachers
    if (userRole === 'TEACHER' && !formData.teacherId.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Teacher ID is required',
      });
      return false;
    }
    if (userRole === 'TEACHER' && teacherIdError) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validation',
        detail: teacherIdError,
      });
      return false;
    }
    return true;
  };

  const handleSubmitInfo = async () => {
    if (!validateInfoStep()) return;

    setLoading(true);
    try {
      const submitData = {
        email: formData.email,
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        schoolId: formData.schoolId!,
        departmentId: formData.departmentId!,
        studentId: formData.studentId,
        teacherId: formData.teacherId,
        role: userRole,
      };
      
      console.log('Submitting signup data with role:', submitData);
      
      await AuthService.completeSignup(submitData);

      setStep('verification');
      setResendCountdown(30);
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Verification code sent to your email',
      });
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to complete signup',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationCode.trim()) {
      setVerificationError('Bắt buộc nhập mã xác minh');
      return;
    }

    if (verificationCode.length !== 6) {
      setVerificationError('Mã xác minh phải gồm 6 chữ số');
      return;
    }

    setLoading(true);
    setVerificationError('');

    try {
      const response = await AuthService.verifyEmail({
        email: formData.email,
        token: verificationCode,
      });

      if (response.success) {
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Đăng ký hoàn tất! Chuyển hướng đến trang chính...',
        });

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error: any) {
      setAttempts(attempts + 1);
      const errorMsg = error.message || 'Invalid verification code';
      setVerificationError(errorMsg);

      if (attempts >= 4) {
        setVerificationError(
          'Too many attempts. Please request a new verification code.'
        );
      }
    } finally {
      setLoading(false);
    }
  };
  console.log('Form Data:', formData);
  const handleResendCode = async () => {
    setLoading(true);
    try {
      await AuthService.resendVerification({
        email: formData.email,
      });
      setVerificationCode('');
      setVerificationError('');
      setAttempts(0);
      setResendCountdown(30);
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'New verification code sent to your email',
      });
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to resend verification code',
      });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { label: 'Thông tin cá nhân', icon: 'pi pi-user' },
    { label: 'Xác minh tài khoản', icon: 'pi pi-check' },
  ];

  return (
    <div className="complete-signup-container">
      <Toast ref={toast} />

      <Card className="signup-card">
        <div className="signup-header">
          <h1>Hoàn tất đăng ký</h1>
          <p className="email-display">Email: {formData.email}</p>
        </div>

        <Steps
          model={steps}
          activeIndex={step === 'info' ? 0 : 1}
          readOnly={true}
          className="signup-steps"
        />

        {step === 'info' && (
          <div className="signup-form">
            <div className="form-section">
              <h3>Chọn vai trò</h3>

              <div className="form-group">
                <label htmlFor="userRole">Vai trò *</label>
                <Dropdown
                  id="userRole"
                  value={userRole}
                  onChange={(e) => {
                    setUserRole(e.value);
                    // Reset studentId when role changes
                    setFormData({ ...formData, studentId: '' });
                  }}
                  options={[
                    { label: 'Sinh viên', value: 'STUDENT' },
                    { label: 'Giáo viên', value: 'TEACHER' },
                  ]}
                  placeholder="Chọn vai trò"
                  disabled={loading}
                />
              </div>
            </div>

            {userRole && (
              <>
                <div className="form-section">
                  <h3>Thông tin cá nhân</h3>

                  <div className="form-group">
                    <label htmlFor="fullName">Họ và tên *</label>
                    <InputText
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      placeholder="Enter your full name"
                      disabled={loading}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="dateOfBirth">Ngày sinh *</label>
                      <Calendar
                        id="dateOfBirth"
                        value={
                          formData.dateOfBirth
                            ? new Date(formData.dateOfBirth + 'T00:00:00')
                            : null
                        }
                        onChange={(e) => {
                          const date = e.value as Date;
                          if (date) {
                            // Format as YYYY-MM-DD using local date (not UTC)
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            const isoDate = `${year}-${month}-${day}`;
                            setFormData({ ...formData, dateOfBirth: isoDate });
                          }
                        }}
                        dateFormat="dd/mm/yy"
                        disabled={loading}
                        showButtonBar
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="gender">Giới tính *</label>
                      <Dropdown
                        id="gender"
                        value={formData.gender}
                        onChange={(e) =>
                          setFormData({ ...formData, gender: e.value })
                        }
                        options={[
                          { label: 'Nam', value: 'Nam' },
                          { label: 'Nữ', value: 'Nữ' },
                          { label: 'Khác', value: 'Khác' },
                        ]}
                        placeholder="Chọn giới tính"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>{userRole === 'STUDENT' ? 'Thông tin học tập' : 'Thông tin công tác'}</h3>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="school">Trường *</label>
                      <Dropdown
                        id="school"
                        value={formData.schoolId}
                        onChange={(e) =>
                          setFormData({ ...formData, schoolId: e.value })
                        }
                        options={schools.map((s) => ({ label: s.name, value: s.id }))}
                        placeholder="Chọn trường"
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="department">
                        {userRole === 'STUDENT' ? 'Khoa' : 'Khoa'} *
                      </label>
                      <Dropdown
                        id="department"
                        value={formData.departmentId}
                        onChange={(e) =>
                          setFormData({ ...formData, departmentId: e.value })
                        }
                        options={departments.map((d) => ({
                          label: d.name,
                          value: d.id,
                        }))}
                        placeholder={userRole === 'STUDENT' ? 'Chọn khoa' : 'Chọn khoa'}
                        disabled={loading || departments.length === 0}
                      />
                    </div>
                  </div>

                  {userRole === 'STUDENT' && (
                    <div className="form-group">
                      <label htmlFor="studentId">MSSV *</label>
                      <InputText
                        id="studentId"
                        value={formData.studentId}
                        onChange={(e) =>
                          setFormData({ ...formData, studentId: e.target.value })
                        }
                        placeholder="Nhập mã số sinh viên"
                        disabled={loading}
                        className={studentIdError ? 'ng-invalid ng-touched' : ''}
                      />
                      {studentIdError && (
                        <small className="p-error" style={{ color: '#f87171', display: 'block', marginTop: '0.25rem' }}>
                          {studentIdError}
                        </small>
                      )}
                    </div>
                  )}

                  {userRole === 'TEACHER' && (
                    <div className="form-group">
                      <label htmlFor="teacherId">MSGV *</label>
                      <InputText
                        id="teacherId"
                        value={formData.teacherId}
                        onChange={(e) =>
                          setFormData({ ...formData, teacherId: e.target.value })
                        }
                        placeholder="Nhập mã số giáo viên"
                        disabled={loading}
                        className={teacherIdError ? 'ng-invalid ng-touched' : ''}
                      />
                      {teacherIdError && (
                        <small className="p-error" style={{ color: '#f87171', display: 'block', marginTop: '0.25rem' }}>
                          {teacherIdError}
                        </small>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="form-actions">
              <Button
                label="Tiếp tục xác minh"
                onClick={handleSubmitInfo}
                loading={loading}
                icon="pi pi-arrow-right"
                iconPos="right"
              />
            </div>
          </div>
        )}

        {step === 'verification' && (
          <div className="verification-section">
            <h3>Xác minh tài khoản</h3>
            <p className="verify-description">
              Mã xác minh 6 chữ số đã được gửi đến địa chỉ email {' '} <strong>{formData.email}</strong>. Vui lòng nhập mã này bên dưới.
             
            </p>

            <div className="verification-input-group">
              <label htmlFor="verificationCode">Mã xác minh</label>
              <InputText
                id="verificationCode"
                value={verificationCode}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase().slice(0, 6);
                  setVerificationCode(val);
                  setVerificationError('');
                }}
                placeholder="Enter 6-digit code"
                maxLength={6}
                disabled={loading}
                className="verification-input"
              />
            </div>



            {attempts > 0 && (
              <Message
                severity="info"
                text={`Số lần nhập còn lại: ${attempts}/5`}
                className="verification-attempts"
              />
            )}

            <div className="verification-actions">
              <Button
                label="Xác nhận"
                onClick={handleVerifyEmail}
                loading={loading}
                icon="pi pi-check"
              />
            </div>

            <div className="resend-section">
              <p>Không nhận được code</p>
              <Button
                label={
                  resendCountdown > 0
                    ? `Gửi lại trong ${resendCountdown}s`
                    : 'Gửi lại'
                }
                onClick={handleResendCode}
                link
                disabled={resendCountdown > 0 || loading}
              />
            </div>

            <div className="verification-info" style={{display: 'flex', justifyContent: 'center', marginTop: '1rem'}}>
              <Message
                severity="info"
                text="Mã xác minh có hiệu lực trong 5 phút."
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CompleteSignupForm;
