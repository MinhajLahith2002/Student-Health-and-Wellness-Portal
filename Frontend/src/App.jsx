import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import StudentDashboard from "./pages/StudentDashboard";
import DoctorPortal from "./pages/DoctorPortal";
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
import { useEffect } from "react";

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

export default function App() {
  return (
    <Router>
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
          <Route path="/dashboard" element={<PageWrapper><StudentDashboard /></PageWrapper>} />
          <Route path="/mental-health" element={<PageWrapper><MentalHealthHub /></PageWrapper>} />
          <Route path="/mental-health/discussion" element={<PageWrapper><MentalHealthDiscussion /></PageWrapper>} />
          
          {/* Student Pharmacy Routes */}
          <Route path="/pharmacy" element={<PageWrapper><PharmacyDashboard /></PageWrapper>} />
          <Route path="/student/pharmacy/search" element={<PageWrapper><MedicineSearch /></PageWrapper>} />
          <Route path="/student/pharmacy/medicine/:id" element={<PageWrapper><MedicineDetail /></PageWrapper>} />
          <Route path="/student/pharmacy/upload-prescription" element={<PageWrapper><PrescriptionUpload /></PageWrapper>} />
          <Route path="/student/pharmacy/checkout" element={<PageWrapper><Checkout /></PageWrapper>} />
          <Route path="/student/pharmacy/order/:orderId" element={<PageWrapper><OrderTracking /></PageWrapper>} />
          <Route path="/student/pharmacy/orders" element={<PageWrapper><OrderHistory /></PageWrapper>} />
          <Route path="/student/pharmacy/first-aid" element={<PageWrapper><FirstAidGuide /></PageWrapper>} />
          <Route path="/student/pharmacy/locator" element={<PageWrapper><PharmacyLocator /></PageWrapper>} />
          <Route path="/student/pharmacy/products" element={<PageWrapper><HealthProducts /></PageWrapper>} />

          {/* Pharmacist Routes */}
          <Route path="/pharmacist/dashboard" element={<PageWrapper><PharmacistDashboard /></PageWrapper>} />
          <Route path="/pharmacist/inventory" element={<PageWrapper><InventoryManagement /></PageWrapper>} />
          <Route path="/pharmacist/prescriptions" element={<PageWrapper><PrescriptionProcessing /></PageWrapper>} />
          <Route path="/pharmacist/orders" element={<PageWrapper><OrderManagement /></PageWrapper>} />
          <Route path="/pharmacist/medicines/new" element={<PageWrapper><MedicineEditor /></PageWrapper>} />
          <Route path="/pharmacist/medicines/edit/:id" element={<PageWrapper><MedicineEditor /></PageWrapper>} />

          <Route path="/doctor" element={<PageWrapper><DoctorPortal /></PageWrapper>} />
          {/* Appointment & Consultation Routes */}
          <Route path="/student/appointments" element={<PageWrapper><AppointmentDashboard /></PageWrapper>} />
          <Route path="/student/appointments/find" element={<PageWrapper><FindDoctor /></PageWrapper>} />
          <Route path="/student/appointments/book" element={<PageWrapper><BookingFlow /></PageWrapper>} />
          <Route path="/student/consultation/:id" element={<PageWrapper><StudentConsultation /></PageWrapper>} />
          <Route path="/student/prescriptions" element={<PageWrapper><StudentPrescriptions /></PageWrapper>} />
          
          <Route path="/doctor/appointments" element={<PageWrapper><DoctorAppointmentDashboard /></PageWrapper>} />
          <Route path="/doctor/consultation/:id" element={<PageWrapper><ConsultationRoom /></PageWrapper>} />
          <Route path="/doctor/patients" element={<PageWrapper><PatientRecords /></PageWrapper>} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<PageWrapper><AdminDashboard /></PageWrapper>} />
          <Route path="/admin/users" element={<PageWrapper><UserDirectory /></PageWrapper>} />
          <Route path="/admin/notifications" element={<PageWrapper><NotificationsHub /></PageWrapper>} />
          <Route path="/admin/resources" element={<PageWrapper><HealthResources /></PageWrapper>} />
          <Route path="/admin/faq" element={<PageWrapper><FAQManager /></PageWrapper>} />
          <Route path="/admin/events" element={<PageWrapper><EventManager /></PageWrapper>} />
          <Route path="/admin/feedback" element={<PageWrapper><FeedbackManager /></PageWrapper>} />
          <Route path="/admin/reports" element={<PageWrapper><ReportsGenerator /></PageWrapper>} />
          <Route path="/admin/audit" element={<PageWrapper><AuditLogs /></PageWrapper>} />
          <Route path="/admin/settings" element={<PageWrapper><SystemSettings /></PageWrapper>} />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}