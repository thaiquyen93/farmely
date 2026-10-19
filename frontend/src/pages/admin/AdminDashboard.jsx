import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import { useAuthStore } from '../../stores/authStore';
import { siteVisitsService } from '../../api/siteVisitsService';
import { apiFetch, unwrapData } from '../../api/apiClient';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import DashboardRail from '../../components/dashboard/DashboardRail';
import {
  Building2,
  Grid3X3,
  Radio,
  Users,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  TrendingUp,
  UserCheck,
  Send,
  Eye,
  ShieldCheck,
  RotateCcw,
  Search,
  Filter,
  Check,
  X,
  PhoneCall,
  MapPin,
  Sprout,
  ArrowRight,
  Activity,
  Layers,
  Sparkles,
  BriefcaseBusiness
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'dispatch' | 'contracts' | 'visits' | 'users' | 'iot-alerts'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Dispatch Service Orders State (UC37: Care Task Dispatch)
  const [serviceDispatches, setServiceDispatches] = useState(false ? [
    {
      id: 'DISP-101',
      serviceName: 'Ủy thác trọn vụ (Self-grow chuyển sang Full-care)',
      plotCode: 'P-02',
      plotName: 'Thửa Mộc Châu B2',
      customerName: 'Nguyễn Văn Hùng',
      customerPhone: '0912 345 678',
      requestedDate: 'Hôm nay • 09:00',
      assignedWorker: 'Chưa chỉ định',
      status: 'PENDING',
      price: '1.500.000 đ',
      note: 'Khách hàng đi công tác 2 tuần, cần tưới và tỉa cành hàng ngày.'
    },
    {
      id: 'DISP-102',
      serviceName: 'Bón phân trùn quế hữu cơ VietGAP',
      plotCode: 'P-01',
      plotName: 'Thửa Sen Vàng A1',
      customerName: 'Lô Thái Quyền',
      customerPhone: '0901 234 567',
      requestedDate: 'Hôm nay • 14:30',
      assignedWorker: 'Trần Văn Lực (CVLĐ)',
      status: 'IN_PROGRESS',
      price: '80.000 đ',
      note: 'Bón quanh gốc, xới tơi đất nhẹ.'
    },
    {
      id: 'DISP-103',
      serviceName: 'Nhổ cỏ rãnh & xới đất tơi xốp',
      plotCode: 'P-03',
      plotName: 'Thửa Rừng Sác C3',
      customerName: 'Phạm Thu Hương',
      customerPhone: '0988 776 655',
      requestedDate: 'Ngày mai • 08:00',
      assignedWorker: 'Chưa chỉ định',
      status: 'PENDING',
      price: '50.000 đ',
      note: 'Dọn sạch cỏ rãnh thoát nước trước đợt tưới mới.'
    }
  ] : []);

  // Selected Dispatch for Assign Worker Modal
  const [selectedDispatchToAssign, setSelectedDispatchToAssign] = useState(null);
  const [assignedWorkerName, setAssignedWorkerName] = useState('Trần Văn Lực (CVLĐ)');

  // Refund / Cancellation Requests State (UC08 / BR10)
  const [refundRequests, setRefundRequests] = useState(false ? [
    {
      id: 'REF-8801',
      contractCode: 'CTR-2026-FARM-7721',
      customerName: 'Lê Hoàng Nam',
      customerPhone: '0933 221 144',
      plotCode: 'P-05',
      totalPaid: '3.600.000 đ',
      refundPercent: 80, // BR10: 80% refund if cancelled > 7 days before start
      refundAmount: '2.880.000 đ',
      deductionFee: '720.000 đ (20% phí quản lý)',
      requestDate: '08/10/2026',
      reason: 'Bận chuyển nơi công tác xa, không kịp lên vườn.',
      status: 'PENDING'
    }
  ] : []);

  // Selected Refund Modal
  const [selectedRefundToReview, setSelectedRefundToReview] = useState(null);

  // Site Visit Bookings (UC03 / SCR-PUB-05 / Table site_visits in SQL Server)
  const [siteVisits, setSiteVisits] = useState([]);
  const [isLoadingVisits, setIsLoadingVisits] = useState(false);

  // Đồng bộ thời gian thực từ Database SQL Server isp392_agritech
  const loadSiteVisitsFromDb = async () => {
    try {
      const data = await siteVisitsService.getAll();
      if (Array.isArray(data)) {
        const mapped = data.map((v) => ({
          id: v.visit_id || v.id,
          visit_id: v.visit_id || v.id,
          plot_id: v.plot_id,
          plotCode: v.plot_code || (v.plot_id ? `L01-P0${v.plot_id}` : null),
          area: v.area,
          fullName: v.visitor_name || v.fullName,
          phone: v.visitor_phone || v.phone,
          email: v.visitor_email || v.email,
          visitDate: v.visit_date || v.visitDate,
          session:
            v.visit_slot === 'MORNING'
              ? 'Ca sáng (08:30 - 10:30)'
              : v.visit_slot === 'AFTERNOON'
              ? 'Ca chiều (14:30 - 16:30)'
              : (v.session || 'Ca sáng'),
          groupSize: v.group_size ? `Đoàn ${v.group_size} người` : (v.groupSize || '1 người'),
          notes: v.notes || 'Khảo sát hiện trạng thực tế thửa đất.',
          status: v.status || 'PENDING',
          createdAt: v.created_at
        }));
        setSiteVisits(mapped);
      }
    } catch (err) {
      console.warn('Lỗi đồng bộ site_visits từ Database:', err);
    }
  };

  useEffect(() => {
    loadSiteVisitsFromDb();
    // Tự động làm mới mỗi 4 giây để Admin thấy ngay đơn mới khi khách vừa book
    const interval = setInterval(loadSiteVisitsFromDb, 4000);
    return () => clearInterval(interval);
  }, []);

  // System Users List (UC21: Users & RBAC)
  const [systemUsers, setSystemUsers] = useState(false ? [
    {
      id: 'USR-001',
      fullName: 'Lô Thái Quyền',
      email: 'customer@farmely.vn',
      role: 'CUSTOMER',
      roleLabel: 'Khách Hàng',
      plotsRented: 3,
      status: 'ACTIVE',
      lastActive: '10 phút trước'
    },
    {
      id: 'USR-002',
      fullName: 'ThS. Nguyễn Hoàng Nam',
      email: 'expert@farmely.vn',
      role: 'EXPERT',
      roleLabel: 'Chuyên Gia Nông Nghiệp',
      plotsRented: 'Giám sát 16 thửa',
      status: 'ACTIVE',
      lastActive: 'Đang trực tuyến'
    },
    {
      id: 'USR-003',
      fullName: 'Trần Văn Lực',
      email: 'worker@farmely.vn',
      role: 'STAFF',
      roleLabel: 'Chuyên Viên Lao Động',
      plotsRented: 'Phụ trách 8 thửa',
      status: 'ACTIVE',
      lastActive: '5 phút trước'
    },
    {
      id: 'USR-004',
      fullName: 'Ban Quản Trị Farmely',
      email: 'admin@farmely.vn',
      role: 'ADMIN',
      roleLabel: 'Quản Trị Viên (Admin)',
      plotsRented: 'Toàn hệ thống',
      status: 'ACTIVE',
      lastActive: 'Đang trực tuyến'
    }
  ] : []);
  const [dataError, setDataError] = useState('');
  const [landStats, setLandStats] = useState({ total: 0, rented: 0 });

  const loadAdminData = async () => {
    try {
      const [requestPayload, cancellationPayload, userPayload, plotPayload, rentalPayload] = await Promise.all([
        apiFetch('/api/services/requests'),
        apiFetch('/api/contracts/cancellations'),
        apiFetch('/api/users'),
        apiFetch('/api/plots'),
        apiFetch('/api/rentals')
      ]);
      const requests = unwrapData(requestPayload) || [];
      const cancellations = unwrapData(cancellationPayload) || [];
      const users = unwrapData(userPayload) || [];
      const plots = unwrapData(plotPayload) || [];
      const rentals = unwrapData(rentalPayload) || [];
      setServiceDispatches(requests.map((request) => ({
        id: request.requestId,
        serviceName: request.service?.name || request.service?.serviceName || 'Dịch vụ Farmely',
        plotCode: request.plotCode || '',
        plotName: request.plotName || 'Chưa xác định thửa',
        customerName: request.renterName || 'Khách hàng Farmely',
        customerPhone: '',
        requestedDate: request.scheduledDate || (request.createdAt ? new Date(request.createdAt).toLocaleString('vi-VN') : ''),
        assignedWorker: request.assignedWorkerName || 'Chưa chỉ định',
        status: request.status,
        price: Number(request.service?.price || 0).toLocaleString('vi-VN') + ' đ',
        note: request.notes || ''
      })));
      setRefundRequests(cancellations.map((request) => ({
        id: request.cancellationId,
        contractCode: request.contractNumber || `HĐ #${request.contractId}`,
        customerName: request.cancellerName || `Người dùng #${request.cancelledBy}`,
        customerPhone: '',
        plotCode: '',
        totalPaid: Number(request.totalPaidAmount || 0).toLocaleString('vi-VN') + ' đ',
        refundPercent: request.refundPercentage || 0,
        refundAmount: Number(request.refundAmount || 0).toLocaleString('vi-VN') + ' đ',
        deductionFee: request.refundPolicyNote || '',
        requestDate: request.createdAt ? new Date(request.createdAt).toLocaleDateString('vi-VN') : '',
        reason: request.reason,
        status: request.status
      })));
      setSystemUsers(users.map((account) => ({
        id: account.userId || account.id,
        fullName: account.fullName,
        email: account.email,
        role: account.role === 'FIELD_WORKER' ? 'STAFF' : account.role,
        roleLabel: account.role === 'CUSTOMER' ? 'Khách Hàng' : account.role === 'EXPERT' ? 'Chuyên Gia Nông Nghiệp' : account.role === 'ADMIN' ? 'Quản Trị Viên' : 'Nhân Viên Hiện Trường',
        plotsRented: 'Dữ liệu tài khoản',
        status: account.status,
        lastActive: account.updatedAt ? new Date(account.updatedAt).toLocaleString('vi-VN') : 'Chưa có dữ liệu'
      })));
      setLandStats({
        total: plots.length,
        rented: new Set(rentals.filter((rental) => !['CANCELLED', 'COMPLETED'].includes(rental.status)).map((rental) => rental.plotId)).size
      });
      setDataError('');
    } catch (error) {
      setServiceDispatches([]);
      setRefundRequests([]);
      setSystemUsers([]);
      setDataError(error.message || 'Không thể đồng bộ dữ liệu quản trị.');
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    const firstWorker = systemUsers.find((account) => account.role === 'STAFF' && account.status === 'ACTIVE');
    if (firstWorker) setAssignedWorkerName(firstWorker.fullName);
  }, [systemUsers]);

  // Handle Assign Worker
  const handleConfirmAssign = async (e) => {
    e.preventDefault();
    if (!selectedDispatchToAssign) return;
    const worker = systemUsers.find((account) => account.fullName === assignedWorkerName && account.role === 'STAFF');
    if (!worker) {
      setDataError('Không tìm thấy nhân viên này trong database.');
      return;
    }
    try {
      await apiFetch(`/api/services/requests/${selectedDispatchToAssign.id}/assign`, {
        method: 'PUT',
        body: JSON.stringify({ workerId: Number(worker.id), scheduledDate: null, notes: selectedDispatchToAssign.note || '' })
      });
      await loadAdminData();
      setSelectedDispatchToAssign(null);
    } catch (error) {
      setDataError(error.message || 'Không thể phân công nhân viên.');
    }
  };

  // Handle Approve Refund
  const handleApproveRefund = async (reqId) => {
    try {
      await apiFetch(`/api/contracts/cancellations/${reqId}/approve`, { method: 'POST' });
      await loadAdminData();
      setSelectedRefundToReview(null);
    } catch (error) {
      setDataError(error.message || 'Không thể phê duyệt hoàn tiền.');
    }
  };

  // Handle Confirm Visit -> Lưu trực tiếp vào Database SQL Server
  const handleConfirmVisit = async (visitId) => {
    try {
      await siteVisitsService.confirm(visitId);
      setSiteVisits((prev) =>
        prev.map((v) => (v.id === visitId || v.visit_id === visitId ? { ...v, status: 'CONFIRMED' } : v))
      );
    } catch (err) {
      console.error('Lỗi khi xác nhận lịch thăm:', err);
    }
  };

  return (
    <div className="dashboard-readable min-h-screen bg-[#F5F3E9] flex flex-col font-sans overflow-x-hidden">
      <PublicNavbar dashboardRailCollapsed={sidebarCollapsed} />

      <main className={`box-border flex-1 pt-24 sm:pt-28 pb-16 max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-10 w-full lg:w-auto space-y-6 transition-[margin] duration-200 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'}`}>
        {dataError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{dataError}</div>}
        
        {/* Operational KPI Metric Gauges */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3 rounded-xl border border-brand-border shadow-sm space-y-0.5 text-center">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Doanh Thu Tháng
            </span>
            <div className="text-xl sm:text-2xl font-heading font-black text-brand-green">
              —
            </div>
            <span className="text-[10px] text-brand-muted font-bold block">Chưa có API báo cáo doanh thu</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-brand-border shadow-sm space-y-0.5 text-center">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Tỷ Lệ Lấp Đầy Đất
            </span>
            <div className="text-xl sm:text-2xl font-heading font-black text-brand-dark">
              {landStats.total ? Math.round((landStats.rented / landStats.total) * 100) : 0}%
            </div>
            <span className="text-[10px] text-brand-muted font-medium block">{landStats.rented} / {landStats.total} thửa đang thuê</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-brand-border shadow-sm space-y-0.5 text-center">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Ca Trực Chờ Giao
            </span>
            <div className="text-xl sm:text-2xl font-heading font-black text-amber-600">
              {serviceDispatches.filter(d => d.status === 'PENDING').length} đơn
            </div>
            <span className="text-[10px] text-amber-700 font-bold block">Cần điều phối ngay</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-brand-border shadow-sm space-y-0.5 text-center">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Lịch Tham Quan Mới
            </span>
            <div className="text-xl sm:text-2xl font-heading font-black text-sky-600">
              {siteVisits.filter(v => v.status === 'PENDING').length} lịch
            </div>
            <span className="text-[10px] text-sky-700 font-bold block">Chờ gọi xác nhận</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-brand-border shadow-sm space-y-0.5 text-center">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Yêu Cầu Hoàn Cọc
            </span>
            <div className="text-xl sm:text-2xl font-heading font-black text-rose-600">
              {refundRequests.filter(r => r.status === 'PENDING').length} phiếu
            </div>
            <span className="text-[10px] text-rose-700 font-bold block">Chờ phê duyệt</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-brand-border shadow-sm space-y-0.5 text-center">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Trạm Cảm Biến IoT
            </span>
            <div className="text-xl sm:text-2xl font-heading font-black text-emerald-600">
              —
            </div>
            <span className="text-[10px] text-brand-muted font-bold block">Chưa có API tổng hợp trạng thái trạm</span>
          </div>
        </div>

        {/* Layout with Sidebar Navigation + Content */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Admin Left Menu */}
          <DashboardRail user={user} fallbackName="Ban Quản Trị" roleLabel="Quản trị hệ thống" collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed}>
            <div className={`px-2 pb-2 text-xs font-bold text-white/60 uppercase tracking-wider ${sidebarCollapsed ? 'lg:hidden' : ''}`}>Phân Hệ Vận Hành</div>

            {[
              { id: 'overview', label: 'Tổng Quan Hoạt Động', icon: Activity, count: null },
              { id: 'dispatch', label: 'Điều Phối Ca Trực', icon: UserCheck, count: serviceDispatches.filter(d => d.status === 'PENDING').length },
              { id: 'contracts', label: 'Hợp Đồng & Hoàn Cọc', icon: FileText, count: refundRequests.filter(r => r.status === 'PENDING').length },
              { id: 'visits', label: 'Lịch Hẹn Tham Quan', icon: Calendar, count: siteVisits.filter(v => v.status === 'PENDING').length },
              { id: 'users', label: 'Người Dùng & Phân Quyền', icon: Users, count: systemUsers.length },
              { id: 'iot-alerts', label: 'Trạm IoT & Cảnh Báo', icon: Radio, count: null }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  title={sidebarCollapsed ? tab.label : undefined}
                  aria-label={sidebarCollapsed ? tab.label : undefined}
                  className={`relative group min-h-11 w-full px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-between cursor-pointer ${sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''} ${
                    isActive
                      ? 'bg-[#294C38] text-white shadow-sm'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-brand-yellow' : 'text-white/65'}`} />
                    <span className={sidebarCollapsed ? 'lg:hidden' : ''}>{tab.label}</span>
                  </div>
                  {tab.count !== null && tab.count > 0 && (
                    <span className={`${sidebarCollapsed ? 'lg:hidden' : ''} px-2 py-0.5 rounded-full text-xs font-bold ${
                      isActive ? 'bg-brand-yellow text-brand-dark' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                  {sidebarCollapsed && <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-brand-dark px-3 py-2 text-xs text-white shadow-lg group-hover:lg:block">{tab.label}</span>}
                </button>
              );
            })}

            <div className="pt-3 border-t border-brand-border/60">
              <Link to="/admin/master-data" title={sidebarCollapsed ? 'Quản lý Master Data' : undefined} aria-label={sidebarCollapsed ? 'Quản lý Master Data' : undefined} className={`relative group min-h-11 w-full px-3.5 py-2.5 rounded-xl text-sm font-bold text-white/80 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2.5 ${sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''}`}>
                <Layers className="w-4 h-4 text-white/65" />
                <span className={sidebarCollapsed ? 'lg:hidden' : ''}>Quản Lý Master Data →</span>
                {sidebarCollapsed && <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-brand-dark px-3 py-2 text-xs text-white shadow-lg group-hover:lg:block">Quản lý Master Data</span>}
              </Link>
              <Link to="/admin/master-data/services" title={sidebarCollapsed ? 'Dịch vụ & CareTask' : undefined} aria-label={sidebarCollapsed ? 'Dịch vụ & CareTask' : undefined} className={`relative group mt-1 min-h-11 w-full px-3.5 py-2.5 rounded-xl text-sm font-bold text-brand-green hover:bg-emerald-50 transition-colors flex items-center gap-2.5 ${sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''}`}>
                <BriefcaseBusiness className="w-4 h-4 text-brand-green" />
                <span className={sidebarCollapsed ? 'lg:hidden' : ''}>Dịch Vụ & CareTask</span>
                {sidebarCollapsed && <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-brand-dark px-3 py-2 text-xs text-white shadow-lg group-hover:lg:block">Dịch vụ & CareTask</span>}
              </Link>
            </div>
          </DashboardRail>

          {/* Admin Main Display Area */}
          <section className="flex-1 min-w-0 w-full space-y-6">

            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-brand-border shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
                    <div>
                      <h3 className="font-heading font-black text-lg text-brand-dark">
                        Hoạt Động Nổi Bật Cần Xử Lý
                      </h3>
                      <p className="text-xs text-brand-muted mt-0.5">
                        Tổng hợp các tác vụ vận hành quan trọng từ khách hàng và công nhân nông trường.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      Hệ thống hoạt động bình thường
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div
                      onClick={() => setActiveTab('dispatch')}
                      className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 cursor-pointer hover:bg-amber-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-amber-700" />
                          <span>Điều Phối Ca Trực Dịch Vụ</span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold text-[10px]">
                          2 Đơn Chờ
                        </span>
                      </div>
                      <p className="text-stone-700 leading-relaxed">
                        Khách thuê đất Self-grow vừa đăng ký gói ủy thác trọn vụ và bón phân vi sinh. Cần phân công chuyên viên lao động phụ trách.
                      </p>
                    </div>

                    <div
                      onClick={() => setActiveTab('contracts')}
                      className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2 cursor-pointer hover:bg-rose-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-900 flex items-center gap-1.5">
                          <RotateCcw className="w-4 h-4 text-rose-700" />
                          <span>Yêu Cầu Hoàn Cọc Chờ Duyệt</span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-900 font-bold text-[10px]">
                          1 Phiếu Chờ Duyệt
                        </span>
                      </div>
                      <p className="text-stone-700 leading-relaxed">
                        Khách hàng yêu cầu hủy hợp đồng trước thời hạn canh tác. Hệ thống đã tính sẵn mức hoàn trả 80% theo quy định hủy hợp đồng.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Farm Occupancy Status */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-brand-border shadow-sm space-y-4">
                  <h3 className="font-heading font-black text-lg text-brand-dark">
                    Tình Trạng Phân Bổ Quỹ Đất & Khai Thác
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                      <p className="font-bold text-emerald-900">Trang trại Happy Valley (Quế Phong)</p>
                      <p className="text-2xl font-black text-emerald-700">16 / 16 Plots</p>
                      <p className="text-stone-600">Đang canh tác: 9 • Đã đặt: 5 • Sắp có: 1 • Nghỉ đất: 1</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 space-y-1">
                      <p className="font-bold text-sky-900">Nông Trại Củ Chi Eco Farm</p>
                      <p className="text-2xl font-black text-sky-700">15 / 18 Plots</p>
                      <p className="text-stone-600">Lấp đầy: 83.3% • Tỷ lệ gia hạn hợp đồng cao</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-1">
                      <p className="font-bold text-purple-900">Vườn Thực Nghiệm Long Phước</p>
                      <p className="text-2xl font-black text-purple-700">10 / 12 Plots</p>
                      <p className="text-stone-600">Chuyên canh rau ăn lá hữu cơ và củ quả</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: TASK DISPATCH (Điều Phối Ca Trực Cho Công Nhân) */}
            {activeTab === 'dispatch' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border/60 pb-4">
                  <div>
                    <h3 className="font-heading font-black text-xl text-brand-dark">
                      Điều Phối Ca Trực & Dịch Vụ Nông Trại (UC37)
                    </h3>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Phân bổ công nhân thực hiện các đơn dịch vụ chăm sóc do khách hàng đặt mua.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-brand-green bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                    {serviceDispatches.filter(d => d.status === 'PENDING').length} Đơn Cần Giao Việc
                  </span>
                </div>

                <div className="space-y-4">
                  {serviceDispatches.map((disp) => (
                    <div
                      key={disp.id}
                      className="p-5 rounded-2xl border border-brand-border bg-brand-cream/50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-brand-green text-sm">{disp.id}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            disp.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {disp.status === 'PENDING' ? 'Chưa chỉ định công nhân' : 'Đã phân công'}
                          </span>
                          <span className="text-stone-400">• {disp.requestedDate}</span>
                        </div>

                        <h4 className="font-bold text-brand-dark text-sm">{disp.serviceName}</h4>
                        <p className="text-stone-600">
                          Thửa đất: <strong className="text-brand-dark">{disp.plotName} ({disp.plotCode})</strong> • Khách hàng: <strong>{disp.customerName}</strong> ({disp.customerPhone})
                        </p>
                        <p className="text-stone-500 italic bg-white/70 p-2 rounded-lg border border-brand-border/40">
                          Ghi chú: "{disp.note}"
                        </p>
                      </div>

                      <div className="flex flex-col md:items-end justify-between gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-brand-border/60">
                        <div className="text-right">
                          <span className="font-heading font-black text-brand-green text-base block">{disp.price}</span>
                          <span className="text-[11px] text-stone-500">Phụ trách: <strong>{disp.assignedWorker}</strong></span>
                        </div>

                        <Button
                          variant={disp.status === 'PENDING' ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedDispatchToAssign(disp)}
                          className="font-bold text-xs"
                        >
                          {disp.status === 'PENDING' ? 'Chỉ định công nhân' : 'Đổi nhân sự'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: CONTRACTS & REFUND REQUESTS (UC08 / BR10) */}
            {activeTab === 'contracts' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-6">
                <div>
                  <h3 className="font-heading font-black text-xl text-brand-dark">
                    Phê Duyệt Hủy Hợp Đồng & Hoàn Tiền
                  </h3>
                  <p className="text-xs text-brand-muted mt-0.5">
                    Chính sách hoàn tiền tự động: Hoàn 80% trước 7 ngày, hoàn 50% trước 1-7 ngày.
                  </p>
                </div>

                <div className="space-y-4">
                  {refundRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-5 rounded-2xl border border-brand-border bg-white shadow-sm space-y-3 text-xs"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-brand-border/60">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-brand-green text-sm">{req.id}</span>
                          <span className="text-stone-400">| Hợp đồng: {req.contractCode}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          req.status === 'PENDING' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {req.status === 'PENDING' ? 'Chờ quản trị viên phê duyệt' : 'Đã duyệt hoàn tiền'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-600">
                        <p>Khách hàng: <strong className="text-brand-dark">{req.customerName}</strong> ({req.customerPhone})</p>
                        <p>Thửa đất hủy: <strong className="text-brand-dark">{req.plotCode}</strong></p>
                        <p>Đã thanh toán: <strong className="text-brand-dark">{req.totalPaid}</strong></p>
                        <p>Được hoàn: <strong className="text-emerald-700 font-bold">{req.refundAmount} ({req.refundPercent}%)</strong></p>
                        <p className="sm:col-span-2 text-stone-500">Khấu trừ: {req.deductionFee} • Lý do: "{req.reason}"</p>
                      </div>

                      {req.status === 'PENDING' && (
                        <div className="pt-2 flex justify-end gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApproveRefund(req.id)}
                            className="bg-emerald-700 hover:bg-emerald-800 font-bold"
                          >
                            ✓ Phê duyệt hoàn {req.refundAmount}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: SITE VISIT BOOKINGS (UC03 / SCR-PUB-05 / Table site_visits) */}
            {activeTab === 'visits' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border/60 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-brand-green" />
                      <h3 className="font-heading font-black text-xl text-brand-dark">
                        Lịch Hẹn Tham Quan Nông Trại Thực Tế (SCR-PUB-05)
                      </h3>
                    </div>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Dữ liệu kết nối trực tiếp bảng <strong>site_visits</strong> (Database SQL Server <code className="text-emerald-700 bg-emerald-50 px-1 rounded">isp392_agritech</code>).
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-xl">
                      Tổng: {siteVisits.length} lượt hẹn
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={loadSiteVisitsFromDb}
                      className="text-xs font-bold gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Đồng bộ DB</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {siteVisits.length === 0 ? (
                    <div className="text-center py-12 text-stone-500 space-y-2">
                      <Calendar className="w-10 h-10 mx-auto text-stone-300" />
                      <p className="font-bold text-sm">Chưa có lịch hẹn tham quan nào trong Database</p>
                      <p className="text-xs text-stone-400">Đơn đặt từ trang /site-visit/book sẽ xuất hiện ngay tại đây.</p>
                    </div>
                  ) : (
                    siteVisits.map((visit) => (
                      <div
                        key={visit.id}
                        className="p-5 rounded-2xl border border-brand-border bg-white space-y-3 text-xs hover:border-emerald-300 transition-colors shadow-2xs"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-brand-border/60">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-100 text-stone-700">
                              VST-{visit.visit_id || visit.id}
                            </span>
                            <span className="font-bold text-brand-dark text-sm">{visit.fullName}</span>
                            {visit.plotCode && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Ghim thửa: {visit.plotCode}
                              </span>
                            )}
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              visit.status === 'CONFIRMED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {visit.status === 'CONFIRMED' ? '✓ Đã xác nhận đón tiếp' : '⏳ Chưa liên hệ (PENDING)'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-600">
                          <p>
                            Số điện thoại: <strong className="text-brand-dark">{visit.phone}</strong>
                          </p>
                          <p>Email: {visit.email || 'Không cung cấp'}</p>
                          <p>
                            Ngày hẹn: <strong className="text-brand-dark">{visit.visitDate}</strong>
                          </p>
                          <p>
                            Khung giờ: <strong className="text-emerald-800">{visit.session}</strong>
                          </p>
                          <p className="sm:col-span-2">
                            Quy mô đoàn: <strong>{visit.groupSize}</strong> • Ghi chú: "{visit.notes}"
                          </p>
                        </div>

                        {visit.status === 'PENDING' && (
                          <div className="pt-2 flex justify-end gap-2 border-t border-brand-border/40">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleConfirmVisit(visit.id)}
                              className="font-bold shadow-xs"
                            >
                              <PhoneCall className="w-3.5 h-3.5 mr-1.5" />
                              <span>Đã gọi & Xác nhận lịch đón</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: USERS & RBAC (UC21) */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
                  <div>
                    <h3 className="font-heading font-black text-xl text-brand-dark">
                      Quản Trị Người Dùng & Phân Quyền (RBAC)
                    </h3>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Danh sách tài khoản nội bộ và khách hàng trên hệ sinh thái Farmely.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-stone-500">
                    {systemUsers.length} Tài khoản kích hoạt
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-brand-border bg-brand-cream/60 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3">Họ Tên & Email</th>
                        <th className="p-3">Vai Trò (Role)</th>
                        <th className="p-3">Quyền Hạn / Phạm Vi</th>
                        <th className="p-3">Trạng Thái</th>
                        <th className="p-3 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/60">
                      {systemUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-stone-50 transition-colors">
                          <td className="p-3">
                            <p className="font-bold text-brand-dark">{u.fullName}</p>
                            <p className="text-[11px] text-stone-500">{u.email}</p>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-brand-cream text-brand-green border border-brand-border">
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3 text-stone-600">{u.plotsRented}</td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              {u.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => alert(`Chỉnh sửa quyền tài khoản ${u.fullName}`)}
                              className="text-brand-green hover:underline font-bold"
                            >
                              Chỉnh sửa quyền
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 6: IOT ALERTS & HARDWARE HEALTH */}
            {activeTab === 'iot-alerts' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-6">
                <div>
                  <h3 className="font-heading font-black text-xl text-brand-dark">
                    Trạng Thái Trạm Quan Trắc IoT Không Dây
                  </h3>
                  <p className="text-xs text-brand-muted mt-0.5">
                    Hệ thống trạm cảm biến môi trường đo độ ẩm đất, nhiệt độ và ánh sáng tự động 24/7.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-brand-cream/60 border border-brand-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-brand-dark">Trạm IOT-CC-01</span>
                      <span className="text-emerald-700 font-bold">● Online</span>
                    </div>
                    <p className="text-stone-600">Thửa Sen Vàng A1 • Pin: 98% (Solar)</p>
                    <p className="text-stone-500">Độ ẩm đất: 68% • Nhiệt độ: 28.5°C</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-brand-cream/60 border border-brand-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-brand-dark">Trạm IOT-MC-02</span>
                      <span className="text-emerald-700 font-bold">● Online</span>
                    </div>
                    <p className="text-stone-600">Thửa Mộc Châu B2 • Pin: 95% (Solar)</p>
                    <p className="text-stone-500">Độ ẩm đất: 62% • Nhiệt độ: 22.0°C</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-brand-cream/60 border border-brand-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-brand-dark">Trạm IOT-LP-01</span>
                      <span className="text-emerald-700 font-bold">● Online</span>
                    </div>
                    <p className="text-stone-600">Thửa Long Phước B1 • Pin: 100%</p>
                    <p className="text-stone-500">Độ ẩm đất: 72% • Nhiệt độ: 27.8°C</p>
                  </div>
                </div>
              </div>
            )}

          </section>
        </div>

      </main>

      {/* Modal Assign Worker */}
      <Modal
        isOpen={Boolean(selectedDispatchToAssign)}
        onClose={() => setSelectedDispatchToAssign(null)}
        title="Chỉ Định Chuyên Viên Lao Động Phụ Trách"
        subtitle={selectedDispatchToAssign?.serviceName}
      >
        {selectedDispatchToAssign && (
          <form onSubmit={handleConfirmAssign} className="space-y-4 text-xs text-left">
            <div className="p-3.5 rounded-xl bg-brand-cream border border-brand-border space-y-1">
              <p><strong>Thửa đất:</strong> {selectedDispatchToAssign.plotName} ({selectedDispatchToAssign.plotCode})</p>
              <p><strong>Khách hàng:</strong> {selectedDispatchToAssign.customerName} ({selectedDispatchToAssign.customerPhone})</p>
              <p><strong>Dịch vụ:</strong> {selectedDispatchToAssign.serviceName}</p>
            </div>

            <div>
              <label className="block font-bold text-brand-dark mb-1">
                Chọn Chuyên Viên Lao Động (CVLĐ):
              </label>
              <select
                value={assignedWorkerName}
                onChange={(e) => setAssignedWorkerName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-brand-border bg-white text-xs font-bold"
              >
                {systemUsers
                  .filter((account) => account.role === 'STAFF' && account.status === 'ACTIVE')
                  .map((account) => (
                    <option key={account.id} value={account.fullName}>{account.fullName}</option>
                  ))}
                <option value="Lê Văn Hưng (CVLĐ)">Lê Văn Hưng (Chuyên viên bảo vệ thực vật)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedDispatchToAssign(null)}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" size="sm" className="font-bold">
                XÁC NHẬN GIAO VIỆC
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Footer />
    </div>
  );
}
