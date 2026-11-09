import React, { useEffect } from 'react';
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
import ResetPassword from './pages/public/ResetPassword';
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
import Crops from './pages/admin/Crops';
import Varieties from './pages/admin/Varieties';
import VarietyDetail from './pages/admin/VarietyDetail';
import Compatibility from './pages/admin/Compatibility';
import KnowledgeDocuments from './pages/admin/KnowledgeDocuments';
import ProcessTemplates from './pages/admin/ProcessTemplates';
import ProcessTemplateDetail from './pages/admin/ProcessTemplateDetail';
import Services from './pages/admin/Services';
import AuditLogs from './pages/admin/AuditLogs';
import GlobalExpertChat from './components/customer/GlobalExpertChat';

const dashboardByRole = {
  CUSTOMER: '/customer/dashboard',
  ADMIN: '/admin/dashboard',
  EXPERT: '/expert/dashboard',
  STAFF: '/staff/dashboard',
  FIELD_WORKER: '/staff/dashboard'
};

function RoleRoute({ role, children }) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Chặn ngay lập tức nếu tài khoản bị khóa (BLOCKED) hoặc vô hiệu hóa (INACTIVE) bởi Quản trị viên
  if (user.status === 'BLOCKED' || user.status === 'INACTIVE') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-stone-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-3xl font-black">
            ✕
          </div>
          <h2 className="text-xl font-heading font-black text-stone-900">
            Tài Khoản {user.status === 'BLOCKED' ? 'Đã Bị Khóa' : 'Đang Bị Vô Hiệu Hóa'}
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            Tài khoản <strong>{user.email}</strong> ({user.fullName}) hiện đang ở trạng thái <span className="font-bold text-rose-600">[{user.status}]</span> theo quyết định của Ban Quản Trị Farmely. Quyền truy cập và thao tác tại phân hệ này tạm thời bị khóa.
          </p>
          <div className="pt-4 border-t border-stone-100 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (logout) logout();
                window.location.href = '/login';
              }}
              className="px-5 py-2.5 rounded-xl bg-brand-dark text-white text-xs font-bold hover:bg-stone-800 transition-all cursor-pointer shadow-sm"
            >
              Đăng Xuất / Đổi Tài Khoản
            </button>
          </div>
        </div>
      </div>
    );
  }

  const rawUserRole = String(user.role || '').toUpperCase();
  const rawTargetRole = String(role || '').toUpperCase();
  const normalizedUserRole = (rawUserRole === 'FIELD_WORKER' || rawUserRole === 'WORKER') ? 'STAFF' : rawUserRole;
  const normalizedTargetRole = (rawTargetRole === 'FIELD_WORKER' || rawTargetRole === 'WORKER') ? 'STAFF' : rawTargetRole;

  if (normalizedUserRole !== normalizedTargetRole) {
    return <Navigate to={dashboardByRole[normalizedUserRole] || dashboardByRole[user.role] || '/'} replace />;
  }

  return children;
}

function CustomerCommerceRoute({ children }) {
  const { user, isAuthenticated } = useAuthStore();
  const normalizedRole = (user?.role === 'FIELD_WORKER' || user?.role === 'worker') ? 'STAFF' : user?.role;

  if (isAuthenticated && (normalizedRole === 'STAFF' || normalizedRole === 'EXPERT')) {
    return <Navigate to={dashboardByRole[normalizedRole] || '/staff/dashboard'} replace />;
  }

  return children;
}

export default function App() {
  // Lắng nghe tín hiệu đồng bộ trạng thái tài khoản từ Ban Quản Trị (Real-time sync across tabs/roles)
  useEffect(() => {
    const handleStatusSync = (payload) => {
      if (!payload || !payload.userId) return;
      const currentUser = useAuthStore.getState().user;
      if (currentUser && (Number(currentUser.userId || currentUser.id) === Number(payload.userId) || currentUser.email === payload.email)) {
        const newStatus = payload.status;
        const updated = { ...currentUser, status: newStatus };
        useAuthStore.setState({ user: updated });
        try {
          const auth = JSON.parse(sessionStorage.getItem('farmely_auth') || localStorage.getItem('farmely_auth') || '{}');
          auth.user = updated;
          sessionStorage.setItem('farmely_auth', JSON.stringify(auth));
          localStorage.setItem('farmely_auth', JSON.stringify(auth));
        } catch (_) {}
      }
    };

    let bc = null;
    try {
      bc = new BroadcastChannel('farmely_system_sync');
      bc.onmessage = (e) => {
        if (e.data?.type === 'USER_STATUS_CHANGED') {
          handleStatusSync(e.data);
        }
      };
    } catch (_) {}

    const onStorage = (e) => {
      if (e.key === 'farmely_user_status_sync' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          handleStatusSync(data);
        } catch (_) {}
      }
    };
    const onCustomEvent = (e) => {
      handleStatusSync(e.detail);
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('farmely_user_status_changed', onCustomEvent);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('farmely_user_status_changed', onCustomEvent);
    };
  }, []);
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
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/terms/rental" element={<RentalTerms />} />
        <Route path="/site-visit/book" element={<CustomerCommerceRoute><SiteVisitBooking /></CustomerCommerceRoute>} />
        <Route path="/site-visit" element={<Navigate to="/site-visit/book" replace />} />
        <Route path="/visit" element={<Navigate to="/site-visit/book" replace />} />
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
        <Route path="/expert/crops" element={<RoleRoute role="EXPERT"><Navigate to="/expert/dashboard?tab=crops" replace /></RoleRoute>} />
        <Route path="/expert/varieties" element={<RoleRoute role="EXPERT"><Navigate to="/expert/dashboard?tab=varieties" replace /></RoleRoute>} />
        <Route path="/expert/process-templates/:id" element={<RoleRoute role="EXPERT"><div className="min-h-screen bg-brand-cream p-6"><div className="mx-auto max-w-7xl"><ProcessTemplateDetail /></div></div></RoleRoute>} />
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

          {/* Audit Logs & Operation Trail (SCR-AD-10) */}
          <Route path="audit-logs" element={<AuditLogs />} />
        </Route>

        {/* SSoT SCR-AD-10 Direct Route */}
        <Route path="/admin/audit-log" element={<RoleRoute role="ADMIN"><Navigate to="/admin/master-data/audit-logs" replace /></RoleRoute>} />
        <Route path="/admin/audit-logs" element={<RoleRoute role="ADMIN"><Navigate to="/admin/master-data/audit-logs" replace /></RoleRoute>} />

        {/* Fallback to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <GlobalExpertChat />
    </BrowserRouter>
  );
}
