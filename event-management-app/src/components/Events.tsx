import _ from "lodash";
import { Button } from "primereact/button";
import { Paginator } from "primereact/paginator";
import { ProgressSpinner } from "primereact/progressspinner";
import { TabPanel, TabView } from "primereact/tabview";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { localStorageHelper } from "../common/helper/localStorageHelper";
import { schoolService } from "../services/schoolService";
import { CreateEventModal } from "./CreateEventModal";
import { EventManagementTable } from "./EventManagementTable";
import { getEvents, updateEventStatus } from "../services/EventService";
import { getTicketsByUser } from "../services/TicketService";
import type { EventType } from "../types/Event";
import "../styles/events.css";
import UserService from "../services/UserService";
import "../styles/CreateEvent.css";


// Vite environment variable for API base (fallback to localhost)
const API_BASE = ((import.meta as unknown as Record<string, unknown>).env as Record<string, unknown>)?.VITE_API_BASE || "http://localhost:8080";

const Events = ({ isAdminView = false, isTeacherView = false, isHidden = false }: { isAdminView?: boolean; isTeacherView?: boolean; isHidden?: boolean }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [firstByCat, setFirstByCat] = useState<Record<string, number>>({});
  const [categories, setCategories] = useState<Array<{ label: string; value: string }>>([]);
  
  const [userSchoolId, setUserSchoolId] = useState<number | null>(null);
  const [userRegistrations, setUserRegistrations] = useState<Set<number>>(new Set());
  const rows = 4;
  const [modalVisible, setModalVisible] = useState(false);

  const role = localStorageHelper.getItem("role");
  const token = localStorageHelper.getItem("token");
  const userId = Number(localStorageHelper.getItem("idUser") || 0);

  const filterMine = isTeacherView || searchParams.get("filter") === "mine";
  
  const isAuthorized = (() => {
    if (!token) return false;
    if (!role) return false;
    try {
      const r = String(role).toUpperCase();
      return r.includes("ADMIN") || r.includes("TEACHER");
    } catch {
      return false;
    }
  })();

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  // Load user school info
  useEffect(() => {
    const loadUserSchool = async () => {
      if (!userId) return;
      try {
        const userProfile = await UserService.getUserById(userId);
        if (userProfile?.school?.id) {
          setUserSchoolId(userProfile.school.id);
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      }
    };
    
    loadUserSchool();
  }, [userId]);

  // Load user registrations
  useEffect(() => {
    const loadUserRegistrations = async () => {
      if (!userId) return;
      try {
        const tickets = await getTicketsByUser(userId);
        const eventIds = new Set<number>();
        if (Array.isArray(tickets)) {
          tickets.forEach((ticket: unknown) => {
            const eventId = (ticket as Record<string, unknown>)?.event?.id;
            if (eventId) {
              eventIds.add(Number(eventId));
            }
          });
        }
        setUserRegistrations(eventIds);
      } catch (error) {
        console.error("Error loading user registrations:", error);
      }
    };
    
    loadUserRegistrations();
  }, [userId]);

  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await schoolService.getAllCategories();
        const categoryData = Array.isArray(response) ? response : (response as unknown as Record<string, unknown>).data;
        if (categoryData && Array.isArray(categoryData)) {
          const formattedCategories = categoryData
            .filter((cat: unknown) => (cat as Record<string, unknown>).active)
            .map((cat: unknown) => ({
              id: Number((cat as Record<number, unknown>).id),
              label: String((cat as Record<string, unknown>).label),
              value: String((cat as Record<string, unknown>).value),
            }));
          setCategories(formattedCategories);
        }
        console.log("Categories loaded:", categories);
      } catch (error) {
        console.error("Error loading categories:", error);
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  /**
   * Kiểm tra xem user có quyền xem event không
   */
  const canUserSeeEvent = (event: EventType): boolean => {
    if (role?.toString().toUpperCase().includes("ADMIN") || role?.toString().toUpperCase().includes("TEACHER")) {
      return true;
    }

    if (!event.isForSchool) {
      return true;
    }

    if (event.isForSchool && userSchoolId) {
      return true;
    }

    return false;
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const initialData = await getEvents();

      let filtered = initialData;
      if (filterMine && userId) {
        filtered = initialData.filter((e: unknown) => (e as Record<string, unknown>).createdById === userId);
      } else if (isHidden && !isAdminView) {
        filtered = filtered
          .filter((e: unknown) => (e as Record<string, unknown>).isOpen === true)
          .filter((e) => canUserSeeEvent(e));
      }
      
      setEvents(_.orderBy(filtered, ["createdAt"], ["desc"]));
    } catch (error) {
      console.error("Lỗi khi tải sự kiện:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMine, userId, isAuthorized, isHidden, userSchoolId]);

  const onPageChange = (category: EventType["category"]) => (event: { first: number; rows: number }) => {
    setFirstByCat((prev) => ({ ...prev, [String(category)]: event.first }));
  };
  
  const renderEventGrid = (category: EventType["category"]) => {

    const filtered = events.filter((e) => e.category == category);
    
    if (filtered.length === 0)
      return <p style={{ textAlign: "center" }}>Không có sự kiện nào.</p>;

    const first = firstByCat[category] || 0;
    const pageItems = filtered.slice(first, first + rows);

    return (
      <>
        <div className="event-grid">
          {pageItems.map((event) => {
            const imgSrc = event.imagePath
              ? event.imagePath.startsWith("http")
                ? event.imagePath
                : `${API_BASE}${event.imagePath}`
              : undefined;

            const isUserRegistered = userRegistrations.has(event.eventId);

            return (
              <div key={event.eventId} className="event-card">
                {imgSrc ? (
                  <img src={imgSrc} alt={event.eventName} className="event-card-image" />
                ) : (
                  <div className="event-card-placeholder" />
                )}

                <div className="event-card-content">
                  <h3 className="event-card-title">{event.eventName}</h3>
                  
                  

                  <div className="event-card-footer">
                    <Button
                      label="Xem chi tiết"
                      onClick={() => navigate(`/events/${event.eventId}`, { state: { isHidden } })}
                      className="event-card-button"
                    />
                    {isUserRegistered && <span className="event-card-badge">Đã đăng ký</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length > rows && (
          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            <Paginator
              first={first}
              rows={rows}
              totalRecords={filtered.length}
              onPageChange={onPageChange(category)}
              rowsPerPageOptions={[4]}
            />
          </div>
        )}
      </>
    );
  };

  return (
    <div className="page-wrapper">
      <div className="header-page"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        {isHidden ? <h1>Danh sách sự kiện</h1> : <h1>Quản lý sự kiện</h1>}
        
        
      </div>

      <CreateEventModal
        visible={modalVisible}
        onHide={() => setModalVisible(false)}
        fetchEvents={fetchEvents}
        onCreated={fetchEvents}
      />

      {loading ? (
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <ProgressSpinner />
        </div>
      ) : isAuthorized && !isHidden ? (
        // Table view for Admin/Teacher
        <EventManagementTable
          events={events}
          loading={loading}
          userRole={String(role)}
          onStatusChange={(eventId: number, newStatus: number) => {
            // Call API to update status
            updateEventStatus(String(eventId), newStatus)
              .then(() => {
                fetchEvents();
              })
              .catch((err) => {
                console.error("Failed to update event status:", err);
              });
          }}
          onRefresh={() => {
            fetchEvents();
          }}
        />
      ) : (
        // Grid view for Student/Public
        <TabView>
          {categories.map((cat) => (
            <TabPanel key={cat.value} header={cat.label}>
              {renderEventGrid(cat.id as EventType["category_id"])}
            </TabPanel>
          ))}
        </TabView>
      )}
    </div>
  );
};

export default Events;
