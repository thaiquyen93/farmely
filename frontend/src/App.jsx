import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Public Pages
import Home from './pages/public/Home';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import SiteVisitBooking from './pages/public/SiteVisitBooking';
import Marketplace from './pages/public/Marketplace';
import PlotDetail from './pages/public/PlotDetail';
import BookPlot from './pages/public/BookPlot';
import ForgotPassword from './pages/public/ForgotPassword';
import About from './pages/public/About';
import Terms from './pages/public/Terms';
import RentalTerms from './pages/public/RentalTerms';
import VnPayReturn from './pages/payment/VnPayReturn';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerProfile from './pages/customer/CustomerProfile';
import CustomerSettings from './pages/customer/CustomerSettings';
import AdminDashboard from './pages/admin/AdminDashboard';
import ExpertDashboard from './pages/expert/ExpertDashboard';
import FieldWorkerDashboard from './pages/staff/FieldWorkerDashboard';

// Admin Master Data Pages
import MasterDataLayout from './components/master-data/MasterDataLayout';
import MasterDataDashboard from './pages/admin/MasterDataDashboard';
import Lands from './pages/admin/Lands';
import LandForm from './pages/admin/LandForm';
import LandDetail from './pages/admin/LandDetail';
import Plots from './pages/admin/Plots';
import PlotForm from './pages/admin/PlotForm';
import PlotDetailAdmin from './pages/admin/PlotDetail';
import IoTStations from './pages/admin/IoTStations';
import Crops from './pages/admin/Crops';
import Varieties from './pages/admin/Varieties';
import VarietyDetail from './pages/admin/VarietyDetail';
import Compatibility from './pages/admin/Compatibility';
import KnowledgeDocuments from './pages/admin/KnowledgeDocuments';
import ProcessTemplates from './pages/admin/ProcessTemplates';
import ProcessTemplateDetail from './pages/admin/ProcessTemplateDetail';
import Services from './pages/admin/Services';
import GlobalExpertChat from './components/customer/GlobalExpertChat';

const dashboardByRole = {
  CUSTOMER: '/customer/dashboard',
  ADMIN: '/admin/dashboard',
  EXPERT: '/expert/dashboard',
  STAFF: '/staff/dashboard'
};

function RoleRoute({ role, children }) {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user.role !== role) {
    return <Navigate to={dashboardByRole[user.role] || '/'} replace />;
  }

  return children;
}

function CustomerCommerceRoute({ children }) {
  const { user, isAuthenticated } = useAuthStore();

  if (isAuthenticated && (user?.role === 'STAFF' || user?.role === 'EXPERT')) {
    return <Navigate to={dashboardByRole[user.role]} replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/terms/rental" element={<RentalTerms />} />
        <Route path="/site-visit/book" element={<CustomerCommerceRoute><SiteVisitBooking /></CustomerCommerceRoute>} />
        <Route path="/marketplace" element={<CustomerCommerceRoute><Marketplace /></CustomerCommerceRoute>} />
        <Route path="/marketplace/plot/:id" element={<CustomerCommerceRoute><PlotDetail /></CustomerCommerceRoute>} />
        <Route path="/marketplace/plot/:id/book" element={<CustomerCommerceRoute><BookPlot /></CustomerCommerceRoute>} />
        <Route path="/payment/vnpay-return" element={<VnPayReturn />} />

        {/* Role-Specific Dashboards */}
        <Route path="/customer/dashboard" element={<RoleRoute role="CUSTOMER"><CustomerDashboard /></RoleRoute>} />
        <Route path="/customer/profile" element={<RoleRoute role="CUSTOMER"><CustomerProfile /></RoleRoute>} />
        <Route path="/customer/settings" element={<RoleRoute role="CUSTOMER"><CustomerSettings /></RoleRoute>} />
        <Route path="/admin/dashboard" element={<RoleRoute role="ADMIN"><AdminDashboard /></RoleRoute>} />
        <Route path="/expert/dashboard" element={<RoleRoute role="EXPERT"><ExpertDashboard /></RoleRoute>} />
        <Route path="/staff/dashboard" element={<RoleRoute role="STAFF"><FieldWorkerDashboard /></RoleRoute>} />
        <Route path="/worker/dashboard" element={<Navigate to="/staff/dashboard" replace />} />

        {/* Admin Master Data Nested Routes */}
        <Route path="/admin/master-data" element={<RoleRoute role="ADMIN"><MasterDataLayout /></RoleRoute>}>
          <Route index element={<MasterDataDashboard />} />
          
          {/* Land Management */}
          <Route path="lands" element={<Lands />} />
          <Route path="lands/create" element={<LandForm />} />
          <Route path="lands/:id" element={<LandDetail />} />

          {/* Plot Management */}
          <Route path="plots" element={<Plots />} />
          <Route path="plots/create" element={<PlotForm />} />
          <Route path="plots/:id" element={<PlotDetailAdmin />} />

          {/* IoT Stations */}
          <Route path="iot-stations" element={<IoTStations />} />
          <Route path="iot-stations/:id" element={<IoTStations />} />

          {/* Biology Master Data */}
          <Route path="crops" element={<Crops />} />
          <Route path="varieties" element={<Varieties />} />
          <Route path="varieties/:id" element={<VarietyDetail />} />
          <Route path="compatibility" element={<Compatibility />} />

          {/* Knowledge & Templates */}
          <Route path="knowledge-documents" element={<KnowledgeDocuments />} />
          <Route path="services" element={<Services />} />
          <Route path="process-templates" element={<ProcessTemplates />} />
          <Route path="process-templates/:id" element={<ProcessTemplateDetail />} />
        </Route>

        {/* Fallback to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <GlobalExpertChat />
    </BrowserRouter>
  );
}
