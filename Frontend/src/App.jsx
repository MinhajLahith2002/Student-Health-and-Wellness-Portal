import { BrowserRouter as Router, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/admin/Dashboard';
import AppointmentDashboard from './pages/appointments/student/Dashboard';
import FindDoctor from './pages/appointments/student/FindDoctor';
import BookingFlow from './pages/appointments/student/BookingFlow';
import StudentConsultation from './pages/appointments/student/Consultation';
import StudentPrescriptions from './pages/appointments/student/Prescriptions';
import DoctorProfile from './pages/appointments/student/DoctorProfile';
import QueueStatus from './pages/appointments/student/QueueStatus';
import AppointmentFeedback from './pages/appointments/student/Feedback';
import DoctorAppointmentDashboard from './pages/appointments/doctor/Dashboard';
import ConsultationRoom from './pages/appointments/doctor/ConsultationRoom';
import PatientRecords from './pages/appointments/doctor/PatientRecords';
import ManageAvailability from './pages/appointments/doctor/ManageAvailability';
import UserDirectory from './pages/admin/Users';
import NotificationsHub from './pages/admin/Notifications';
import HealthResources from './pages/admin/Resources';
import FAQManager from './pages/admin/FAQ';
import EventManager from './pages/admin/Events';
import FeedbackManager from './pages/admin/Feedback';
import ReportsGenerator from './pages/admin/Reports';
import AuditLogs from './pages/admin/Audit';
import SystemSettings from './pages/admin/Settings';
import MentalHealthHub from './pages/MentalHealth';
import MentalHealthDiscussion from './pages/MentalHealthDiscussion';
import AuthPage from './pages/AuthPage';
import PharmacyDashboard from './pages/pharmacy/student/Dashboard';
import MedicineSearch from './pages/pharmacy/student/Search';
import MedicineDetail from './pages/pharmacy/student/MedicineDetail';
import PrescriptionUpload from './pages/pharmacy/student/PrescriptionUpload';
import Checkout from './pages/pharmacy/student/Checkout';
import OrderTracking from './pages/pharmacy/student/OrderTracking';
import OrderHistory from './pages/pharmacy/student/OrderHistory';
import FirstAidGuide from './pages/pharmacy/student/FirstAid';
import PharmacyLocator from './pages/pharmacy/student/PharmacyLocator';
import HealthProducts from './pages/pharmacy/student/HealthProducts';
import PharmacistDashboard from './pages/pharmacy/pharmacist/Dashboard';
import InventoryManagement from './pages/pharmacy/pharmacist/Inventory';
import PrescriptionProcessing from './pages/pharmacy/pharmacist/Prescriptions';
import OrderManagement from './pages/pharmacy/pharmacist/Orders';
import MedicineEditor from './pages/pharmacy/pharmacist/MedicineEditor';
import MoodTracker from './pages/mental-health/MoodTracker';
import Suggestions from './pages/mental-health/Suggestions';
import ResourceLibrary from './pages/mental-health/ResourceLibrary';
import ResourceDetail from './pages/mental-health/ResourceDetail';
import CounselorDirectory from './pages/mental-health/CounselorDirectory';
import CounselorProfile from './pages/mental-health/CounselorProfile';
import BookSession from './pages/mental-health/BookSession';
import MySessions from './pages/mental-health/MySessions';
import CounselingSessionPage from './pages/mental-health/CounselingSessionPage';
import SessionFeedback from './pages/mental-health/SessionFeedback';
import CounselorDashboard from './pages/mental-health/CounselorDashboard';
import CounselorProfileSettings from './pages/mental-health/CounselorProfileSettings';
import CounselorSessionsWorkspace from './pages/mental-health/CounselorSessionsWorkspace';
import CounselorNotes from './pages/mental-health/CounselorNotes';
import CounselorResources from './pages/mental-health/CounselorResources';
import CounselorNotifications from './pages/mental-health/CounselorNotifications';
import CounselorHelpCenter from './pages/mental-health/CounselorHelpCenter';
import AdminLayout from './components/admin/AdminLayout';
import { useAuth } from './hooks/useAuth';
import ErrorBoundary from './components/ErrorBoundary';

function PageWrapper({ children }) {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function StaffLayout({ allowedRoles }) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <AdminLayout>
        <PageWrapper>
          <Outlet />
        </PageWrapper>
      </AdminLayout>
    </ProtectedRoute>
  );
}

function HomeEntry() {
  const { user, isAuthenticated, booting, redirectPathForRole } = useAuth();

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  if (isAuthenticated && user?.role) {
    if (user.role === 'student') {
      return <LandingPage />;
    }

    return <Navigate to={redirectPathForRole(user.role)} replace />;
  }

  return <LandingPage />;
}

function AppLayout() {
  const location = useLocation();
  const isAdminOrStaffRoute =
    location.pathname.startsWith('/admin')
    || location.pathname.startsWith('/pharmacist')
    || location.pathname.startsWith('/doctor')
    || location.pathname.startsWith('/counselor');

  return (
    <>
      {!isAdminOrStaffRoute && <Navbar />}
      <ErrorBoundary resetKey={location.pathname}>
        <Routes>
          <Route path="/" element={<PageWrapper><HomeEntry /></PageWrapper>} />
          <Route path="/login" element={<PageWrapper><AuthPage /></PageWrapper>} />
          <Route path="/register" element={<PageWrapper><AuthPage /></PageWrapper>} />

          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><StudentDashboard /></PageWrapper></ProtectedRoute>} />

          <Route path="/mental-health" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><MentalHealthHub /></PageWrapper></ProtectedRoute>} />
          <Route path="/mental-health/forum" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><MentalHealthDiscussion /></PageWrapper></ProtectedRoute>} />
          <Route path="/mental-health/mood" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><MoodTracker /></PageWrapper></ProtectedRoute>} />
          <Route path="/mental-health/suggestions" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><Suggestions /></PageWrapper></ProtectedRoute>} />
          <Route path="/mental-health/resources" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><ResourceLibrary /></PageWrapper></ProtectedRoute>} />
          <Route path="/mental-health/resources/:resourceId" element={<ProtectedRoute allowedRoles={['student', 'counselor']}><PageWrapper><ResourceDetail /></PageWrapper></ProtectedRoute>} />
          <Route path="/mental-health/counselors" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><CounselorDirectory /></PageWrapper></ProtectedRoute>} />
          <Route path="/mental-health/counselors/:counselorId" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><CounselorProfile /></PageWrapper></ProtectedRoute>} />
          <Route path="/mental-health/book/:counselorId" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><BookSession /></PageWrapper></ProtectedRoute>} />
          <Route path="/mental-health/sessions" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><MySessions /></PageWrapper></ProtectedRoute>} />
          <Route path="/mental-health/sessions/:sessionId" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><CounselingSessionPage /></PageWrapper></ProtectedRoute>} />
          <Route path="/mental-health/sessions/:sessionId/feedback" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><SessionFeedback /></PageWrapper></ProtectedRoute>} />

          <Route path="/pharmacy" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><PharmacyDashboard /></PageWrapper></ProtectedRoute>} />
          <Route path="/student/pharmacy/search" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><MedicineSearch /></PageWrapper></ProtectedRoute>} />
          <Route path="/student/pharmacy/medicine/:id" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><MedicineDetail /></PageWrapper></ProtectedRoute>} />
          <Route path="/student/pharmacy/upload-prescription" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><PrescriptionUpload /></PageWrapper></ProtectedRoute>} />
          <Route path="/student/pharmacy/checkout" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><Checkout /></PageWrapper></ProtectedRoute>} />
          <Route path="/student/pharmacy/order/:orderId" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><OrderTracking /></PageWrapper></ProtectedRoute>} />
          <Route path="/student/pharmacy/orders" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><OrderHistory /></PageWrapper></ProtectedRoute>} />
          <Route path="/student/pharmacy/first-aid" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><FirstAidGuide /></PageWrapper></ProtectedRoute>} />
          <Route path="/student/pharmacy/locator" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><PharmacyLocator /></PageWrapper></ProtectedRoute>} />
          <Route path="/student/pharmacy/products" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><HealthProducts /></PageWrapper></ProtectedRoute>} />

          <Route path="/student/appointments" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><AppointmentDashboard /></PageWrapper></ProtectedRoute>} />
          <Route path="/student/appointments/find" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><FindDoctor /></PageWrapper></ProtectedRoute>} />
          <Route path="/student/appointments/doctors/:doctorId" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><DoctorProfile /></PageWrapper></ProtectedRoute>} />
          <Route path="/student/appointments/book" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><BookingFlow /></PageWrapper></ProtectedRoute>} />
          <Route path="/student/appointments/book/:doctorId" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><BookingFlow /></PageWrapper></ProtectedRoute>} />
          <Route path="/student/appointments/:appointmentId/queue" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><QueueStatus /></PageWrapper></ProtectedRoute>} />
          <Route path="/student/appointments/:appointmentId/feedback" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><AppointmentFeedback /></PageWrapper></ProtectedRoute>} />
          <Route path="/student/consultation/:id" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><StudentConsultation /></PageWrapper></ProtectedRoute>} />
          <Route path="/student/prescriptions" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><StudentPrescriptions /></PageWrapper></ProtectedRoute>} />

          <Route path="/admin" element={<StaffLayout allowedRoles={['admin']} />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UserDirectory />} />
            <Route path="notifications" element={<NotificationsHub />} />
            <Route path="resources" element={<HealthResources />} />
            <Route path="faq" element={<FAQManager />} />
            <Route path="events" element={<EventManager />} />
            <Route path="feedback" element={<FeedbackManager />} />
            <Route path="reports" element={<ReportsGenerator />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="settings" element={<SystemSettings />} />
          </Route>

          <Route path="/pharmacist" element={<StaffLayout allowedRoles={['pharmacist']} />}>
            <Route index element={<Navigate to="/pharmacist/dashboard" replace />} />
            <Route path="dashboard" element={<PharmacistDashboard />} />
            <Route path="inventory" element={<InventoryManagement />} />
            <Route path="medicines/new" element={<MedicineEditor />} />
            <Route path="medicines/edit/:id" element={<MedicineEditor />} />
            <Route path="prescriptions" element={<PrescriptionProcessing />} />
            <Route path="orders" element={<OrderManagement />} />
          </Route>

          <Route path="/doctor" element={<StaffLayout allowedRoles={['doctor']} />}>
            <Route index element={<Navigate to="/doctor/dashboard" replace />} />
            <Route path="dashboard" element={<DoctorAppointmentDashboard />} />
            <Route path="appointments" element={<DoctorAppointmentDashboard />} />
            <Route path="availability" element={<ManageAvailability />} />
            <Route path="consultation/:id" element={<ConsultationRoom />} />
            <Route path="patients" element={<PatientRecords />} />
            <Route path="prescriptions" element={<StudentPrescriptions />} />
          </Route>

          <Route path="/counselor" element={<StaffLayout allowedRoles={['counselor']} />}>
            <Route index element={<Navigate to="/counselor/dashboard" replace />} />
            <Route path="dashboard" element={<CounselorDashboard />} />
            <Route path="sessions" element={<CounselorSessionsWorkspace />} />
            <Route path="sessions/:sessionId" element={<CounselingSessionPage />} />
            <Route path="profile" element={<CounselorProfileSettings />} />
            <Route path="profile-settings" element={<CounselorProfileSettings />} />
            <Route path="help-center" element={<CounselorHelpCenter />} />
            <Route path="notes" element={<CounselorNotes />} />
            <Route path="resources" element={<CounselorResources />} />
            <Route path="resources/saved" element={<ResourceLibrary />} />
            <Route path="resources/:resourceId" element={<ResourceDetail />} />
            <Route path="notifications" element={<CounselorNotifications />} />
          </Route>

          <Route path="/admin/pharmacist/*" element={<Navigate to="/pharmacist" replace />} />
          <Route path="/admin/doctor/*" element={<Navigate to="/doctor" replace />} />
          <Route path="/admin/counselor/*" element={<Navigate to="/counselor" replace />} />
        </Routes>
      </ErrorBoundary>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}
