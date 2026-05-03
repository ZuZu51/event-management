import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputSwitch } from 'primereact/inputswitch';
import { Badge } from 'primereact/badge';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { OverlayPanel } from 'primereact/overlaypanel';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { EventType } from '../types/Event';
import '../styles/eventManagementTable.css';
import { callApi } from '../common/helper/callApi';
import { cancelEvent, deleteEvent, updateApprovalStatus } from '../services/EventService';
import { formatDateToDDMMYYYY } from '../common/helper/dateHelper';
import ReopenAttendanceModal from './EventDetail/SettingCheckIn';
import "../styles/CreateEvent.css";
interface EventManagementTableProps {
    events: EventType[];
    loading: boolean;
    onStatusChange?: (eventId: number, newStatus: number) => void;
    onRefresh?: () => void;
    userRole?: string;
}

export const EventManagementTable: React.FC<EventManagementTableProps> = ({
    events,
    loading,
    onStatusChange,
    onRefresh,
    userRole,
}) => {
    const navigate = useNavigate();
    const toast = useRef<Toast>(null);
    const overlayRefs = useRef<{ [key: number]: OverlayPanel | null }>({});
    const [expandedRows, setExpandedRows] = useState<any[]>([]);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
    const [dialogAction, setDialogAction] = useState<'cancel' | 'delete' | 'accept' | 'reject' | 'submit' | null>(null);
    const [reopenAttendanceModalVisible, setReopenAttendanceModalVisible] = useState(false);
    const [reopenAttendanceEventId, setReopenAttendanceEventId] = useState<number | null>(null);
    const [reopenAttendanceEventName, setReopenAttendanceEventName] = useState<string>('');

    const isAdmin = userRole ? String(userRole).toUpperCase().includes('ADMIN') : false;
    const isTeacher = userRole ? String(userRole).toUpperCase().includes('TEACHER') : false;
   
    const loadAllData = () => {
        if (onRefresh) {
            onRefresh();
        }
        toast.current?.show({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Đã tải lại dữ liệu!',
            life: 2000,
        });
    };

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 0:
                return <Badge value="Đã hủy" severity="danger" />;
            case 1:
                return <Badge value="Sắp diễn ra" severity="info" />;
            case 2:
                return <Badge value="Đang diễn ra" severity="success" />;
            case 3:
                return <Badge value="Đã kết thúc" severity="warning" />;
            default:
                return <Badge value="Không xác định" severity="secondary" />;
        }
    };

    const getApprovalStatusBadge = (status: number) => {
        switch (status) {
            case 0:
                return <Badge value="Hủy" severity="danger" />;
            case 1:
                return <Badge value="Chưa gửi" severity="secondary" />;
            case 2:
                return <Badge value="Gửi duyệt" severity="info" />;
            case 3:
                return <Badge value="Chấp thuận" severity="success" />;
            case 4:
                return <Badge value="Từ chối" severity="danger" />;
            default:
                return <Badge value="Không xác định" severity="secondary" />;
        }
    };

    const getModeTag = (mode: string) => {
        const modeMap: Record<string, { color: string }> = {
            'ONLINE': { color: '#3498db' },
            'OFFLINE': {color: '#2ecc71' },
            'HYBRID': { color: '#f39c12' },
        };
        const modeInfo = modeMap[mode] || { color: '#95a5a6' };
        return (
            <span style={{ fontSize: '0.9rem', fontWeight: '500', color: modeInfo.color }}>
                {mode}
            </span>
        );
    };

    const getCategoryTag = (category: string) => {
        return (
            <span style={{ fontSize: '0.9rem' }}>
               {category}
            </span>
        );
    };

    const handleStatusToggle = (event: EventType) => {
        const newStatus = event.active === 1 ? 0 : 1;
        if (onStatusChange) {
            onStatusChange(event.eventId, newStatus);
            toast.current?.show({
                severity: 'success',
                summary: 'Thành công',
                detail: `Cập nhật trạng thái sự kiện thành công!`,
                life: 3000,
            });
        }
    };

    const handleRegistrationToggle = async (event: EventType) => {
        try {
            const newOpenStatus = !event.isOpen;
            await callApi<EventType>(
                'PATCH',
                `events/${event.eventId}/registration`,
                { isOpen: newOpenStatus },
                true
            );

            if (onRefresh) {
                onRefresh();
            }
            
            toast.current?.show({
                severity: 'success',
                summary: 'Thành công',
                detail: `${newOpenStatus ? 'Mở' : 'Đóng'} đăng ký thành công!`,
                life: 3000,
            });
        } catch (error) {
            console.error('Error updating registration status:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Cập nhật đăng ký thất bại!',
                life: 3000,
            });
        }
    };

    const sttTemplate = (rowData: EventType, { rowIndex }: any) => {
        return <span>{rowIndex + 1}</span>;
    };

    const nameTemplate = (rowData: EventType) => {
        return (
            <div
                style={{ cursor: 'pointer', color: '#3498db', fontWeight: '500' }}
                onClick={() => navigate(`/events/${rowData.eventId}`)}
            >
                {rowData.eventName}
            </div>
        );
    };

    const dateTemplate = (rowData: EventType) => {
        return <span>{formatDateToDDMMYYYY(rowData.date)}</span>;
    };

    const modeTemplate = (rowData: EventType) => {
        return getModeTag(rowData.eventMode);
    };

    const categoryTemplate = (rowData: EventType) => {
        return getCategoryTag(rowData.category);
    };

    const statusTemplate = (rowData: EventType) => {
        return getStatusBadge(rowData.active);
    };

    const approvalStatusTemplate = (rowData: EventType) => {
        const status = (rowData as any).approvalStatus || 1;
        return getApprovalStatusBadge(status);
    };

    const registrationTemplate = (rowData: EventType) => {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <InputSwitch
                    checked={rowData.isOpen === true}
                    onChange={() => handleRegistrationToggle(rowData)}
                    disabled={rowData.approvalStatus !== 3}
                />
                <small style={{ color: '#666' }}>
                    {rowData.isOpen ? 'Mở' : 'Đóng'}
                </small>
            </div>
        );
    };

    const handleCancelEvent = async (event: EventType) => {
        setSelectedEvent(event);
        setDialogAction('cancel');
        setDialogVisible(true);
    };

    const handleDeleteEvent = async (event: EventType) => {
        setSelectedEvent(event);
        setDialogAction('delete');
        setDialogVisible(true);
    };

    const handleAcceptEvent = (event: EventType) => {
        setSelectedEvent(event);
        setDialogAction('accept');
        setDialogVisible(true);
    };

    const handleRejectEvent = (event: EventType) => {
        setSelectedEvent(event);
        setDialogAction('reject');
        setDialogVisible(true);
    };

    const handleSubmitApproval = (event: EventType) => {
        setSelectedEvent(event);
        setDialogAction('submit');
        setDialogVisible(true);
    };

    const handleReopenAttendance = (event: EventType) => {
        setReopenAttendanceEventId(event.eventId);
        setReopenAttendanceEventName(event.eventName);
        setReopenAttendanceModalVisible(true);
    };

    const confirmAction = async () => {
        if (!selectedEvent) return;

        try {
            if (dialogAction === 'submit') {
                await updateApprovalStatus(selectedEvent.eventId, 2);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Gửi sự kiện duyệt thành công!',
                    life: 3000,
                });
            } else if (dialogAction === 'accept') {
                await updateApprovalStatus(selectedEvent.eventId, 3);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Chấp nhận sự kiện thành công!',
                    life: 3000,
                });
            } else if (dialogAction === 'reject') {
                await updateApprovalStatus(selectedEvent.eventId, 4);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Từ chối sự kiện thành công!',
                    life: 3000,
                });
            } else if (dialogAction === 'cancel') {
                await cancelEvent(selectedEvent.eventId);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Hủy sự kiện và gửi thông báo email đến người đăng ký thành công!',
                    life: 3000,
                });
            } else if (dialogAction === 'delete') {
                await deleteEvent(selectedEvent.eventId);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Xóa sự kiện thành công!',
                    life: 3000,
                });
            }
            
            setDialogVisible(false);
            if (onRefresh) {
                onRefresh();
            }
        } catch (error) {
            console.error('Error:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: `Thao tác thất bại!`,
                life: 3000,
            });
        }
    };

    const getActionButtons = (rowData: EventType) => {
        if (isTeacher && !isAdmin) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '150px' }}>
                    <Button
                        label="Mở lại điểm danh"
                        icon="pi pi-clock"
                        severity="info"
                        size="small"
                        text
                        onClick={() => {
                            overlayRefs.current[rowData.eventId]?.hide();
                            handleReopenAttendance(rowData);
                        }}
                        style={{ justifyContent: 'flex-start' }}
                    />
                    <Button
                        label="Quét mã điểm danh"
                        icon="pi pi-qrcode"
                        severity="info"
                        size="small"
                        text
                        onClick={() => {
                            overlayRefs.current[rowData.eventId]?.hide();
                            navigate(`/scan-qr?eventId=${rowData.eventId}`);
                        }}
                        style={{ justifyContent: 'flex-start' }}
                    />
                    <hr style={{ margin: '0.25rem 0', border: 'none', borderTop: '1px solid #dee2e6' }} />
                    <Button
                        label="Gửi duyệt"
                        icon="pi pi-send"
                        severity="info"
                        size="small"
                        text
                        disabled={rowData.approvalStatus !== 1}
                        onClick={() => {
                            overlayRefs.current[rowData.eventId]?.hide();
                            handleSubmitApproval(rowData);
                        }}
                        style={{ justifyContent: 'flex-start' }}
                    />
                    <Button
                        label="Hủy sự kiện"
                        icon="pi pi-ban"
                        severity="warning"
                        size="small"
                        text
                        disabled={rowData.approvalStatus === 0}
                        onClick={() => {
                            overlayRefs.current[rowData.eventId]?.hide();
                            handleCancelEvent(rowData);
                        }}
                        style={{ justifyContent: 'flex-start' }}
                    />
                    <hr style={{ margin: '0.25rem 0', border: 'none', borderTop: '1px solid #dee2e6' }} />
                    <Button
                        label="Xóa sự kiện"
                        icon="pi pi-trash"
                        severity="danger"
                        size="small"
                        text
                        onClick={() => {
                            overlayRefs.current[rowData.eventId]?.hide();
                            handleDeleteEvent(rowData);
                        }}
                        style={{ justifyContent: 'flex-start' }}
                    />
                </div>
            );
        }

        if (isAdmin) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '180px' }}>
                    <Button
                        label="Chấp nhận"
                        icon="pi pi-check"
                        severity="success"
                        size="small"
                        text
                        disabled={rowData.approvalStatus === 3 || rowData.approvalStatus === 0}
                        onClick={() => {
                            overlayRefs.current[rowData.eventId]?.hide();
                            handleAcceptEvent(rowData);
                        }}
                        style={{ justifyContent: 'flex-start' }}
                    />
                    <Button
                        label="Từ chối"
                        icon="pi pi-times"
                        severity="danger"
                        size="small"
                        text
                        disabled={rowData.approvalStatus === 4 || rowData.approvalStatus === 0}
                        onClick={() => {
                            overlayRefs.current[rowData.eventId]?.hide();
                            handleRejectEvent(rowData);
                        }}
                        style={{ justifyContent: 'flex-start' }}
                    />
                    <hr style={{ margin: '0.25rem 0', border: 'none', borderTop: '1px solid #dee2e6' }} />
                    <Button
                        label="Hủy sự kiện"
                        icon="pi pi-ban"
                        severity="warning"
                        size="small"
                        text
                        disabled={rowData.approvalStatus === 0}
                        onClick={() => {
                            overlayRefs.current[rowData.eventId]?.hide();
                            handleCancelEvent(rowData);
                        }}
                        style={{ justifyContent: 'flex-start' }}
                    />
                    <Button
                        label="Xóa sự kiện"
                        icon="pi pi-trash"
                        severity="danger"
                        size="small"
                        text
                        onClick={() => {
                            overlayRefs.current[rowData.eventId]?.hide();
                            handleDeleteEvent(rowData);
                        }}
                        style={{ justifyContent: 'flex-start' }}
                    />
                </div>
            );
        }

        return null;
    };

    const actionsTemplate = (rowData: EventType) => {
        if (!isAdmin && !isTeacher) return null;

        return (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <OverlayPanel
                    ref={(el) => (overlayRefs.current[rowData.eventId] = el)}
                    id={`overlay-${rowData.eventId}`}
                >
                    {getActionButtons(rowData)}
                </OverlayPanel>
                <Button
                    icon="pi pi-ellipsis-h"
                    rounded
                    text
                    severity="secondary"
                    size="small"
                    tooltip="Hành động"
                    tooltipOptions={{ position: 'top' }}
                    onClick={(e) => overlayRefs.current[rowData.eventId]?.toggle(e)}
                />
            </div>
        );
    };

    return (
        <>
            <Toast ref={toast} />

            <Dialog
                visible={dialogVisible}
                onHide={() => setDialogVisible(false)}
                header={
                    dialogAction === 'submit' ? 'Gửi Duyệt Sự Kiện' :
                    dialogAction === 'cancel' ? 'Hủy Sự Kiện' :
                    dialogAction === 'delete' ? 'Xóa Sự Kiện' :
                    dialogAction === 'accept' ? 'Chấp Nhận Sự Kiện' :
                    'Từ Chối Sự Kiện'
                }
                modal
                footer={
                    <>
                        <Button label="Hủy" icon="pi pi-times" onClick={() => setDialogVisible(false)} />
                        <Button
                            label={
                                dialogAction === 'submit' ? 'Gửi Duyệt' :
                                dialogAction === 'cancel' ? 'Hủy Sự Kiện' :
                                dialogAction === 'delete' ? 'Xóa' :
                                dialogAction === 'accept' ? 'Chấp Nhận' :
                                'Từ Chối'
                            }
                            icon={
                                dialogAction === 'submit' ? 'pi pi-send' :
                                dialogAction === 'cancel' ? 'pi pi-times' :
                                dialogAction === 'delete' ? 'pi pi-trash' :
                                dialogAction === 'accept' ? 'pi pi-check' :
                                'pi pi-times'
                            }
                            severity={
                                dialogAction === 'submit' ? 'info' :
                                dialogAction === 'cancel' ? 'warning' :
                                dialogAction === 'delete' ? 'danger' :
                                dialogAction === 'accept' ? 'success' :
                                'danger'
                            }
                            onClick={confirmAction}
                        />
                    </>
                }
            >
                {dialogAction === 'submit' ? (
                    <div>
                        <p>Bạn có chắc chắn muốn gửi sự kiện <strong>{selectedEvent?.eventName}</strong> để duyệt?</p>
                    </div>
                ) : dialogAction === 'accept' ? (
                    <div>
                        <p>Bạn có chắc chắn muốn chấp nhận sự kiện <strong>{selectedEvent?.eventName}</strong>?</p>
                    </div>
                ) : dialogAction === 'reject' ? (
                    <div>
                        <p>Bạn có chắc chắn muốn từ chối sự kiện <strong>{selectedEvent?.eventName}</strong>?</p>
                    </div>
                ) : dialogAction === 'cancel' ? (
                    <div>
                        <p>Bạn có chắc chắn muốn hủy sự kiện <strong>{selectedEvent?.eventName}</strong>?</p>
                        <p style={{ color: '#d32f2f', fontWeight: '500' }}>
                            ⚠️ Hệ thống sẽ gửi email thông báo hủy sự kiện đến tất cả những người đã đăng ký.
                        </p>
                    </div>
                ) : (
                    <div>
                        <p>Bạn có chắc chắn muốn xóa sự kiện <strong>{selectedEvent?.eventName}</strong>?</p>
                        <p style={{ color: '#d32f2f' }}>❌ Hành động này không thể hoàn tác.</p>
                    </div>
                )}
            </Dialog>

            <div className="event-management-table-wrapper">
                <div className="search-section">
                    
                    <Button
                        label="Tải lại"
                        icon="pi pi-refresh"
                        loading={loading}
                        onClick={loadAllData}
                        className="reload-button"
                    />
                </div>
                <DataTable
                    value={events}
                    loading={loading}
                    responsiveLayout="scroll"
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 20, 50]}
                    tableStyle={{ minWidth: '100%' }}
                    stripedRows
                    showGridlines
                    emptyMessage="Không có sự kiện nào"
                    className="event-management-datatable"
                >
                    <Column
                        field="eventId"
                        header="Mã"
                        body={sttTemplate}
                        style={{ width: '5%', minWidth: '50px' }}
                        align="center"
                    />
                    <Column
                        field="eventName"
                        header="Tên Sự Kiện"
                        body={nameTemplate}
                        style={{ width: '25%', minWidth: '200px' }}
                        sortable
                    />
                    <Column
                        field="date"
                        header="Ngày diễn ra"
                        body={dateTemplate}
                        style={{ width: '12%', minWidth: '120px' }}
                        sortable
                    />
    
                    <Column
                        field="eventMode"
                        header="Hình Thức"
                        body={modeTemplate}
                        style={{ width: '13%', minWidth: '120px' }}
                        sortable
                    />
                    <Column
                        field="active"
                        header="Trạng Thái"
                        body={statusTemplate}
                        style={{ width: '12%', minWidth: '130px' }}
                        sortable
                    />
                    <Column
                        field="approvalStatus"
                        header="Trạng Thái Duyệt"
                        body={approvalStatusTemplate}
                        style={{ width: '12%', minWidth: '130px' }}
                        sortable
                    />
                    
                    <Column
                        field="registration"
                        header="Mở Đăng Ký"
                        body={registrationTemplate}
                        style={{ width: '10%', minWidth: '110px', textAlign: 'center' }}
                    />

                    {(isAdmin || isTeacher) && (
                        <Column
                            header="Hành Động"
                            body={actionsTemplate}
                            style={{ width: '8%', minWidth: '80px', textAlign: 'center' }}
                        />
                    )}
                </DataTable>
            </div>


            {/* Reopen Attendance Modal */}
            <ReopenAttendanceModal
                visible={reopenAttendanceModalVisible}
                eventId={reopenAttendanceEventId}
                eventName={reopenAttendanceEventName}
                onHide={() => {
                    setReopenAttendanceModalVisible(false);
                    setReopenAttendanceEventId(null);
                    setReopenAttendanceEventName('');
                }}
                onSuccess={() => {
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Thành công',
                        detail: 'Đã cập nhật thời gian điểm danh!',
                        life: 3000,
                    });
                }}
            />
        </>
    );
};

export default EventManagementTable;