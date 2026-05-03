import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { TabView, TabPanel } from 'primereact/tabview';
import { ProgressSpinner } from 'primereact/progressspinner';
import { getEventStats } from '../../services/EventService';
import { getTicketsByUser } from '../../services/TicketService';
import { localStorageHelper } from '../../common/helper/localStorageHelper';
import EventInfoTab from './EventInfoTab';
import SpeakersTab from './SpeakersTab';
import CheckinSettingsTab from './CheckinSettingsTab';
import ReportTab from './ReportTab';
import EventInviteTab from './EventInviteTab';
import EventSchoolAccessTab from './EventSchoolAccessTab';
import EventResourceUpload from '../EventResourceUpload';
import EventResourceTable from '../EventResourceTable';
import type { EventStats } from '../../types/Event';
import './eventDetail.css';
import CommentSection from '../CommentSection';

const EventDetailTabs: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<EventStats | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [checkingRegistration, setCheckingRegistration] = useState(true);
  const [isPrivileged, setIsPrivileged] = useState(false);
  const [hasTicket, setHasTicket] = useState(false);
  const [resourceRefresh, setResourceRefresh] = useState(0);
  const isHidden = (location.state as any)?.isHidden || false;
  
  const loadEventData = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await getEventStats(Number(eventId));
      setEventData(data);
    } catch (error) {
      console.error('Failed to load event:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!eventId) {
      navigate('/events');
      return;
    }
    loadEventData();
  }, [eventId, navigate]);

  useEffect(() => {
    const evaluate = async () => {
      try {
        setCheckingRegistration(true);
        
        const role = localStorageHelper.getItem<string>('role');
        console.log('User role:', role);
        const privileged = Boolean(!isHidden && role && (role.includes('ADMIN') || role.includes('TEACHER')));
        setIsPrivileged(privileged);
        console.log('Is privileged:', privileged);
        if (privileged) {
          setHasTicket(false);
          return;
        }

        const userIdStr = localStorageHelper.getItem<string>('idUser');
        if (!userIdStr) {
          setHasTicket(false);
          return;
        }

        const tickets = await getTicketsByUser(Number(userIdStr));
        const found = Array.isArray(tickets) && tickets.some((t: { event?: { id?: number } }) => t.event && Number(t.event.id) === Number(eventId));
        setHasTicket(Boolean(found));
      } catch (err) {
        console.error('Failed to determine registration status', err);
        setHasTicket(false);
      } finally {
        setCheckingRegistration(false);
      }
    };

    if (eventId) evaluate();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <ProgressSpinner />
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="card">
        <p className="text-center text-muted">Không tìm thấy sự kiện</p>
      </div>
    );
  }
  console.log("hasTicket", hasTicket)
  
  // Determine if checkin auto settings should be visible
  const showCheckInSettings = eventData?.checkInType === 'AUTO' || eventData?.checkInType === 'BOTH';

  return (
    <div className="event-detail-container">
      <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
        {/* Public tabs - Always visible */}
        <TabPanel header="📋 Thông tin" >
          <EventInfoTab eventData={eventData} onUpdate={loadEventData} isHidden={isHidden} getEventStats={loadEventData} />
        </TabPanel>

        <TabPanel header="🎤 Diễn giả" >
          <SpeakersTab eventId={Number(eventId)} eventData={eventData} isHidden={isHidden} />
        </TabPanel>

        {/* Show auto checkin settings only if check_in_type is AUTO or BOTH */}
        {showCheckInSettings && (
          <TabPanel header="⏰ Thời gian điểm danh tự động" >
            <CheckinSettingsTab eventId={Number(eventId)} isHidden={isHidden} />
          </TabPanel>
        )}

        {/* Tabs for registered users (hasTicket) and privileged users (admin/owner) */}
        {/* Check-in history - only for registered users, NOT for admin/owner */}
        {(hasTicket && !isPrivileged) && (
          <TabPanel header="📊 Lịch sử điểm danh" >
            <ReportTab eventId={Number(eventId)}  isHidden={isHidden}/>
          </TabPanel>
        )}

        {/* Report tab - for admin/owner only */}
        {isPrivileged && (
          <TabPanel header="📊 Báo cáo">
            <ReportTab eventId={Number(eventId)}  isHidden={isHidden}/>
          </TabPanel>
        )}

        {/* Resources - for registered users and admin/owner */}
        {(hasTicket || isPrivileged) && (
          <TabPanel header="📁 Tài nguyên">
            <EventResourceUpload 
              eventId={Number(eventId)} 
              onUploadSuccess={() => setResourceRefresh(prev => prev + 1)}
              isPrivileged={isPrivileged}
            />
            <EventResourceTable 
              eventId={Number(eventId)} 
              triggerRefresh={resourceRefresh}
              isPrivileged={isPrivileged}
            />
          </TabPanel>
        )}

        {/* Comments - for registered users and admin/owner */}
        {(hasTicket || isPrivileged) && (
          <TabPanel header="💬 Bình luận">
            <CommentSection eventId={Number(eventId)} eventData={eventData || undefined}/>
          </TabPanel>
        )}

        {/* Invitations - for admin/owner only */}
        {isPrivileged && (
          <TabPanel header="📧 Lời mời">
            <EventInviteTab eventId={Number(eventId)} isHidden={isHidden} />
          </TabPanel>
        )}

        {/** 
        <TabPanel header="🏫 Phạm vi trường">
          <EventSchoolAccessTab eventId={Number(eventId)} isHidden={isHidden} />
        </TabPanel>
        */}
      </TabView>
    </div>
  );
};

export default EventDetailTabs;