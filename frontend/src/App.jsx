import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

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
import CustomerDashboard from './pages/customer/CustomerDashboard';
import StaffDashboard from './pages/staff/StaffDashboard';
import ExpertDashboard from './pages/expert/ExpertDashboard';
import LandMapEditor from './pages/admin/LandMapEditor';
import { useAuthStore } from './stores/authStore';

function RoleGuard({ role, children }) {
  const user = useAuthStore(state => state.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) {
    const home = { CUSTOMER: '/customer/dashboard', STAFF: '/staff/dashboard', EXPERT: '/expert/dashboard', ADMIN: '/admin/master-data' };
    return <Navigate to={home[user.role] || '/'} replace />;
  }
  return children;
}

function MarketplaceEntry() {
  const isCustomer = useAuthStore(state => state.user?.role === 'CUSTOMER');
  const location = useLocation();
  const landId = new URLSearchParams(location.search).get('landId');
  const query = new URLSearchParams({ tab: 'marketplace', ...(landId ? { landId } : {}) });
  return isCustomer ? <Navigate to={`/customer/dashboard?${query}`} replace /> : <Marketplace />;
}

function HomeEntry() {
  const role = useAuthStore(state => state.user?.role);
  const route = { CUSTOMER: '/customer/dashboard', STAFF: '/staff/dashboard', EXPERT: '/expert/dashboard', ADMIN: '/admin/master-data' };
  return role ? <Navigate to={route[role] || '/'} replace /> : <Home />;
}

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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomeEntry />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/site-visit/book" element={<SiteVisitBooking />} />
        <Route path="/marketplace" element={<MarketplaceEntry />} />
        <Route path="/marketplace/plot/:id" element={<PlotDetail />} />
        <Route path="/marketplace/plot/:id/book" element={<BookPlot />} />

        {/* Customer Dashboard Route */}
        <Route path="/customer/dashboard" element={<RoleGuard role="CUSTOMER"><CustomerDashboard /></RoleGuard>} />

        {/* Role Dashboard Fallback Redirects */}
        <Route path="/expert/dashboard" element={<RoleGuard role="EXPERT"><ExpertDashboard /></RoleGuard>} />
        <Route path="/staff/dashboard" element={<RoleGuard role="STAFF"><StaffDashboard /></RoleGuard>} />
        <Route path="/admin/dashboard" element={<Navigate to="/admin/master-data" replace />} />

        {/* Admin Master Data Nested Routes */}
        <Route path="/admin/master-data" element={<RoleGuard role="ADMIN"><MasterDataLayout /></RoleGuard>}>
          <Route index element={<MasterDataDashboard />} />
          
          {/* Land Management */}
          <Route path="lands" element={<Lands />} />
          <Route path="lands/create" element={<LandForm />} />
          <Route path="lands/:id" element={<LandDetail />} />
          <Route path="lands/:id/map" element={<LandMapEditor />} />

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
          <Route path="process-templates" element={<ProcessTemplates />} />
          <Route path="process-templates/:id" element={<ProcessTemplateDetail />} />
        </Route>

        {/* Fallback to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
