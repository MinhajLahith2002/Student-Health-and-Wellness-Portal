import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from './pages/admin/Dashboard';
import AppointmentDashboard from './pages/appointments/student/Dashboard';
import FindDoctor from './pages/appointments/student/FindDoctor';
import BookingFlow from './pages/appointments/student/BookingFlow';
import StudentConsultation from './pages/appointments/student/Consultation';
import StudentPrescriptions from './pages/appointments/student/Prescriptions';
import DoctorAppointmentDashboard from './pages/appointments/doctor/Dashboard';
import ConsultationRoom from './pages/appointments/doctor/ConsultationRoom';
import PatientRecords from './pages/appointments/doctor/PatientRecords';
import UserDirectory from './pages/admin/Users';
import NotificationsHub from './pages/admin/Notifications';
import HealthResources from './pages/admin/Resources';
import FAQManager from './pages/admin/FAQ';
import EventManager from './pages/admin/Events';
import FeedbackManager from './pages/admin/Feedback';
import ReportsGenerator from './pages/admin/Reports';
import AuditLogs from './pages/admin/Audit';
import SystemSettings from './pages/admin/Settings';
import MentalHealthHub from "./pages/MentalHealth";
import MentalHealthDiscussion from "./pages/MentalHealthDiscussion";
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
import AdminLayout from './components/admin/AdminLayout';
import { useEffect } from "react";

// ─── Staff roles allowed in the /admin shell ────────────────────────────────
const STAFF_ROLES = ['admin', 'doctor', 'pharmacist'];

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
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Wraps a page inside AdminLayout – used for pharmacist & doctor pages that
 * live under /admin/pharmacist/* and /admin/doctor/* so they all share
 * the same sidebar/topbar shell.
 */
function AdminWrapped({ children }) {
  return (
    <AdminLayout>
      <PageWrapper>
        {children}
      </PageWrapper>
    </AdminLayout>
  );
}

function AppLayout() {
  const location = useLocation();
  const isAdminOrStaffRoute =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/pharmacist') ||
    location.pathname.startsWith('/doctor');

  return (
    <>
      {!isAdminOrStaffRoute && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes>
          {/* ── Public / Student routes ───────────────────────────── */}
          <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
          <Route path="/login" element={<PageWrapper><AuthPage /></PageWrapper>} />
          <Route path="/register" element={<PageWrapper><AuthPage /></PageWrapper>} />
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><StudentDashboard /></PageWrapper></ProtectedRoute>} />
          <Route path="/mental-health" element={<ProtectedRoute allowedRoles={['student', 'counselor']}><PageWrapper><MentalHealthHub /></PageWrapper></ProtectedRoute>} />
          <Route path="/mental-health/discussion" element={<ProtectedRoute allowedRoles={['student', 'counselor']}><PageWrapper><MentalHealthDiscussion /></PageWrapper></ProtectedRoute>} />

          {/* ── Student Pharmacy routes ───────────────────────────── */}
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

          {/* ── Student Appointments ──────────────────────────────── */}
          <Route path="/student/appointments" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><AppointmentDashboard /></PageWrapper></ProtectedRoute>} />
          <Route path="/student/appointments/find" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><FindDoctor /></PageWrapper></ProtectedRoute>} />
          <Route path="/student/appointments/book" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><BookingFlow /></PageWrapper></ProtectedRoute>} />
          <Route path="/student/consultation/:id" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><StudentConsultation /></PageWrapper></ProtectedRoute>} />
          <Route path="/student/prescriptions" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><StudentPrescriptions /></PageWrapper></ProtectedRoute>} />

          {/* ── Admin Portal ────────────────────────────────────── */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminWrapped><AdminDashboard /></AdminWrapped></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminWrapped><UserDirectory /></AdminWrapped></ProtectedRoute>} />
          <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={['admin']}><AdminWrapped><NotificationsHub /></AdminWrapped></ProtectedRoute>} />
          <Route path="/admin/resources" element={<ProtectedRoute allowedRoles={['admin']}><AdminWrapped><HealthResources /></AdminWrapped></ProtectedRoute>} />
          <Route path="/admin/faq" element={<ProtectedRoute allowedRoles={['admin']}><AdminWrapped><FAQManager /></AdminWrapped></ProtectedRoute>} />
          <Route path="/admin/events" element={<ProtectedRoute allowedRoles={['admin']}><AdminWrapped><EventManager /></AdminWrapped></ProtectedRoute>} />
          <Route path="/admin/feedback" element={<ProtectedRoute allowedRoles={['admin']}><AdminWrapped><FeedbackManager /></AdminWrapped></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><AdminWrapped><ReportsGenerator /></AdminWrapped></ProtectedRoute>} />
          <Route path="/admin/audit" element={<ProtectedRoute allowedRoles={['admin']}><AdminWrapped><AuditLogs /></AdminWrapped></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminWrapped><SystemSettings /></AdminWrapped></ProtectedRoute>} />

          {/* ── Pharmacist Portal ────────────────────────────────── */}
          <Route path="/pharmacist" element={<Navigate to="/pharmacist/dashboard" replace />} />
          <Route path="/pharmacist/dashboard" element={<ProtectedRoute allowedRoles={['pharmacist']}><AdminWrapped><AdminDashboard /></AdminWrapped></ProtectedRoute>} />
          <Route path="/pharmacist/inventory" element={<ProtectedRoute allowedRoles={['pharmacist']}><AdminWrapped><InventoryManagement /></AdminWrapped></ProtectedRoute>} />
          <Route path="/pharmacist/medicines/new" element={<ProtectedRoute allowedRoles={['pharmacist']}><AdminWrapped><MedicineEditor /></AdminWrapped></ProtectedRoute>} />
          <Route path="/pharmacist/medicines/edit/:id" element={<ProtectedRoute allowedRoles={['pharmacist']}><AdminWrapped><MedicineEditor /></AdminWrapped></ProtectedRoute>} />
          <Route path="/pharmacist/prescriptions" element={<ProtectedRoute allowedRoles={['pharmacist']}><AdminWrapped><PrescriptionProcessing /></AdminWrapped></ProtectedRoute>} />
          <Route path="/pharmacist/orders" element={<ProtectedRoute allowedRoles={['pharmacist']}><AdminWrapped><OrderManagement /></AdminWrapped></ProtectedRoute>} />

          {/* ── Doctor Portal ────────────────────────────────────── */}
          <Route path="/doctor" element={<Navigate to="/doctor/dashboard" replace />} />
          <Route path="/doctor/dashboard" element={<ProtectedRoute allowedRoles={['doctor']}><AdminWrapped><AdminDashboard /></AdminWrapped></ProtectedRoute>} />
          <Route path="/doctor/appointments" element={<ProtectedRoute allowedRoles={['doctor']}><AdminWrapped><DoctorAppointmentDashboard /></AdminWrapped></ProtectedRoute>} />
          <Route path="/doctor/consultation/:id" element={<ProtectedRoute allowedRoles={['doctor']}><AdminWrapped><ConsultationRoom /></AdminWrapped></ProtectedRoute>} />
          <Route path="/doctor/patients" element={<ProtectedRoute allowedRoles={['doctor']}><AdminWrapped><PatientRecords /></AdminWrapped></ProtectedRoute>} />
          <Route path="/doctor/prescriptions" element={<ProtectedRoute allowedRoles={['doctor']}><AdminWrapped><StudentPrescriptions /></AdminWrapped></ProtectedRoute>} />

          {/* ── Backward Compatibility Redirects ────────────────── */}
          <Route path="/admin/pharmacist/*" element={<Navigate to="/pharmacist" replace />} />
          <Route path="/admin/doctor/*" element={<Navigate to="/doctor" replace />} />
          <Route path="/pharmacist/dashboard" element={<Navigate to="/pharmacist/dashboard" replace />} />
          <Route path="/doctor/dashboard" element={<Navigate to="/doctor/dashboard" replace />} />
        </Routes>
      </AnimatePresence>
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