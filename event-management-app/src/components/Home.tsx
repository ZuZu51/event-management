import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
import { Skeleton } from "primereact/skeleton";
import { useNavigate } from "react-router-dom";
import { getEvents, getUserEvents } from "../services/EventService";
import UserService from "../services/UserService";
import { attendanceService } from "../services/attendanceService";
import InvitationService from "../services/InvitationService";
import { localStorageHelper } from "../common/helper/localStorageHelper";
import type { StudentInvitation } from "../services/InvitationService";
import type { UserEventDTO } from "../types/Event";

interface UserProfile {
    id: number;
    fullname: string;
    email: string;
    role: string;
    avatar?: string;
}

interface AttendanceStats {
    todayAttendance: number;
    totalAttended: number;
}

const Home: React.FC = () => {
    const navigate = useNavigate();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [upcomingEvents, setUpcomingEvents] = useState<UserEventDTO[]>([]);
    const [invitations, setInvitations] = useState<StudentInvitation[]>([]);
    const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
        todayAttendance: 0,
        totalAttended: 0,
    });
    const [loading, setLoading] = useState(true);
    const pendingInvitations = invitations.filter((i) => i.status === 'PENDING');
    console.log("Pending Invitations:", pendingInvitations);
    useEffect(() => {
        loadDashboardData();
    }, []);
    console.log('upcomming event:',upcomingEvents)
    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const userId = Number(localStorageHelper.getItem<string>('idUser') || 0);
            const token = localStorageHelper.getItem<string>('token');

            if (!userId || userId === 0 || !token) {
                navigate("/login");
                return;
            }

            // Fetch user profile
            const userRes = await UserService.getUserById(userId);
            if (userRes) {
                setUserProfile(userRes);
            }

            // Fetch upcoming events for user
            const eventsRes = await getUserEvents(userId);
            if (eventsRes) {
                const upcoming = Array.isArray(eventsRes) ? eventsRes : [];
                setUpcomingEvents(upcoming);
            }

            // Fetch invitations
            const invitationsRes = await InvitationService.getStudentInvitations(userId);
            if (invitationsRes) {
                setInvitations(invitationsRes);
            }

            // Fetch attendance stats
            const attendanceRes = await attendanceService.getTodayAttendance();
            if (attendanceRes) {
                setAttendanceStats({
                    todayAttendance: attendanceRes.length || 0,
                    totalAttended: attendanceRes.length || 0,
                });
            }
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigateToProfile = () => navigate("/profile");
    const handleCreateEvent = () => navigate("/create-event");


    if (loading) {
        return (
            <div className="app-container">
                <div className="main">
                    <main className="content">
                        <section className="card" style={{ padding: 20 }}>
                            <Skeleton height="100px" className="mb-3" />
                            <Skeleton height="80px" className="mb-3" />
                            <Skeleton height="300px" className="mb-3" />
                        </section>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
            <div className="main">
                <main className="content">
                    {/* User Info Header */}
                    {userProfile && (
                        <section className="card" style={{ padding: 24, marginBottom: 24 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                                <Avatar
                                    image={userProfile.avatar}
                                    shape="circle"
                                    size="xlarge"
                                    icon="pi pi-user"
                                />
                                <div>
                                    <h2 style={{ margin: 0 }}>Xin chào, {userProfile.fullname}</h2>
                                    
                                </div>
                            </div>
                         
                        </section>
                    )}

                    {/* Statistics Section */}
                    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16, marginBottom: 24 }}>
                        <div 
                            className="card" 
                            style={{ padding: 20, textAlign: "center", cursor: "pointer" }}
                            onClick={() => navigate("/upcoming-events")}
                        >
                            <div style={{ fontSize: 32, fontWeight: "bold", color: "#3b82f6" }}>
                                {upcomingEvents.length}
                            </div>
                            <p style={{ margin: "8px 0 0 0", color: "#666" }}>Sự kiện sắp tới</p>
                        </div>
                        <div 
                            className="card" 
                            style={{ padding: 20, textAlign: "center", cursor: "pointer" }}
                            onClick={() => navigate("/invitations")}
                        >
                            <div style={{ fontSize: 32, fontWeight: "bold", color: "#10b981" }}>
                                {pendingInvitations.length}
                            </div>
                            <p style={{ margin: "8px 0 0 0", color: "#666" }}>Lời mời</p>
                        </div>
                        <div 
                            className="card" 
                            style={{ padding: 20, textAlign: "center", cursor: "pointer" }}
                            onClick={() => navigate("/attendance")}
                        >
                            <div style={{ fontSize: 32, fontWeight: "bold", color: "#f59e0b" }}>
                                {attendanceStats.todayAttendance}
                            </div>
                            <p style={{ margin: "8px 0 0 0", color: "#666" }}>Điểm danh hôm nay</p>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default Home;