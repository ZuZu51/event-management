import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import OAuth2RedirectHandler from "./components/OAuth2RedirectHandler";
import CompleteSignupForm from "./components/CompleteSignupForm";

import GoogleLogin from "./components/GoogleLogin";
import AdminLogin from "./components/AdminLogin";
import { LockedAccount } from "./components/LockedAccount";
import ProtectedRoute from "./components/ProtectedRoute";

import History from "./components/History";
import Payment from "./components/Payment";
import Events from "./components/Events";
import Home from "./components/Home";
import DashboardShell from "./components/dashboard/DashboardShell";


import TodayAttendanceWidget from "./components/TodayAttendanceWidget";
import { EventDetailTabs } from "./components/EventDetail";
import { UpcomingEventsWidget } from "./components/UpcomingEventsWidget";
import AdminUserManagement from "./components/AdminUserManagement";
import Profile from "./components/Profile";
import { StudentInvitations } from "./components/StudentInvitations";
import AdminTagManagement from "./components/AdminTagManagement";
import QRCheckIn from "./components/EventDetail/QRCheckIn";
import { CreateNewEvent } from "./components/CreateNewEvent";


function Layout() {
  return (
    <>
      <Routes>
        <Route index element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<GoogleLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/locked" element={<LockedAccount />} />
        <Route path="/oauth2/success" element={<OAuth2RedirectHandler />} />
        <Route path="/complete-signup" element={<CompleteSignupForm />} />

        <Route path="/" element={<ProtectedRoute><DashboardShell /></ProtectedRoute>}>
          
          <Route path="home" element={<Home />} />
          <Route path="events" element={<Events isHidden={true} />} />
          <Route path="admin/events" element={<Events isAdminView={true}/>} />
          <Route path="teacher/events" element={<Events isTeacherView={true} />} />

          
          <Route path="upcoming-events" element={<UpcomingEventsWidget />} />
          <Route path="attendance" element={<TodayAttendanceWidget />} />
          <Route path="invitations" element={<StudentInvitations />} />
          <Route path="/history" element={<History />} />
          <Route path="events/:eventId" element={<EventDetailTabs/>} />
          <Route path="create-new-event" element={<CreateNewEvent />} />
          <Route path="scan-qr" element={<QRCheckIn />} />
          <Route path="admin/users" element={<AdminUserManagement />} />
          
        <Route path="admin/tag" element={<AdminTagManagement />} />
          <Route path="account" element={<Profile />} />
        </Route>
        
        
  
        
        <Route path="/payment/vnpay-return" element={<Payment />} />
        

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;
