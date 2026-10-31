import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend
} from 'recharts';
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
  BriefcaseBusiness,
  PlusCircle,
  Wrench,
  Leaf,
  Thermometer,
  Droplets,
  ExternalLink,
  CloudRain,
  ShieldAlert,
  CreditCard,
  ArrowUpRight,
  Wallet,
  Landmark,
  PieChart
} from 'lucide-react';

function cleanText(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function formatVnd(amount) {
  return Number(amount || 0).toLocaleString('vi-VN') + ' đ';
}

function CustomRevenueTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const lease = payload.find(p => p.dataKey === 'leaseRevenue')?.value || 0;
    const service = payload.find(p => p.dataKey === 'serviceRevenue')?.value || 0;
    const total = payload[0]?.payload?.totalRevenue ?? lease + service;
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 z-50">
        <p className="font-bold text-emerald-400 border-b border-slate-700 pb-1">{label}</p>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-stone-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Thuê đất (Master Lease):
          </span>
          <span className="font-mono font-bold text-white">{formatVnd(lease)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-stone-300">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Dịch vụ lẻ (A-la-carte):
          </span>
          <span className="font-mono font-bold text-white">{formatVnd(service)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-slate-700 font-bold">
          <span className="text-emerald-300">Tổng thực thu:</span>
          <span className="font-mono text-emerald-300">{formatVnd(total)}</span>
        </div>
      </div>
    );
  }
  return null;
}

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('tab');
      if (['overview', 'dispatch', 'contracts', 'visits', 'users', 'iot-alerts', 'audit-logs'].includes(p)) return p;
    }
    return 'overview'; // SCR-AD-01: Default to Tổng Quan & Doanh Thu
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Sub-tab inside Dispatch: 'staff_tasks' | 'staff_services' | 'expert_plots' | 'expert_issues'
  const [dispatchSubTab, setDispatchSubTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('subtab');
      if (['staff_tasks', 'staff_services', 'expert_plots', 'expert_issues'].includes(p)) return p;
    }
    return 'staff_tasks';
  });

  // 1. Service Dispatches (UC37: Service Requests / Dịch vụ lẻ)
  const [serviceDispatches, setServiceDispatches] = useState([]);
  const [selectedDispatchToAssign, setSelectedDispatchToAssign] = useState(null);
  const [assignedWorkerName, setAssignedWorkerName] = useState('');
  const [assignedWorkerId, setAssignedWorkerId] = useState('');
  const [serviceAssignNotes, setServiceAssignNotes] = useState('');

  // 2. Care Tasks Dispatch (SCR-AD-07: Phân công Care Task thực địa)
  const [careTasks, setCareTasks] = useState([]);
  const [careTaskFilter, setCareTaskFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  const [selectedCareTaskToAssign, setSelectedCareTaskToAssign] = useState(null);
  const [taskAssignWorkerId, setTaskAssignWorkerId] = useState('');
  const [taskAssignDueDate, setTaskAssignDueDate] = useState('');
  const [taskAssignNotes, setTaskAssignNotes] = useState('');

  // 3. Create Ad-hoc Care Task Modal
  const [showCreateCareTaskModal, setShowCreateCareTaskModal] = useState(false);
  const [newTaskRentalId, setNewTaskRentalId] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskWorkerId, setNewTaskWorkerId] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');

  // 4. Expert & Staff Plot Oversight (BR24 / SSoT: Phân công CVLĐ & CGNN phụ trách thửa đất)
  const [rentals, setRentals] = useState([]);
  const [selectedRentalToAssignPersonnel, setSelectedRentalToAssignPersonnel] = useState(null);
  const [rentalAssignExpertId, setRentalAssignExpertId] = useState('');
  const [rentalAssignStaffId, setRentalAssignStaffId] = useState('');
  const [plotAssignFilter, setPlotAssignFilter] = useState('ALL'); // 'ALL' | 'UNASSIGNED' | 'ASSIGNED'

  // 5. Field Issue Reports Dispatch (UC12: Sự cố nông học cần chuyên gia xử lý)
  const [fieldIssues, setFieldIssues] = useState([]);
  const [selectedIssueToAssignExpert, setSelectedIssueToAssignExpert] = useState(null);
  const [issueAssignExpertId, setIssueAssignExpertId] = useState('');
  const [issueAssignNotes, setIssueAssignNotes] = useState('');

  // 6. Refund / Cancellation Requests State (UC08 / BR10)
  const [refundRequests, setRefundRequests] = useState([]);
  const [selectedRefundToReview, setSelectedRefundToReview] = useState(null);

  // 7. Site Visit Bookings (SCR-PUB-05 / Table site_visits)
  const [siteVisits, setSiteVisits] = useState([]);

  // 8. System Users & Land Stats
  const [systemUsers, setSystemUsers] = useState([]);
  const [landStats, setLandStats] = useState({ total: 0, rented: 0 });
  const [dataError, setDataError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // 9. Audit Logs & System Monitoring (UC21 / Screen 39)
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditOverview, setAuditOverview] = useState({
    totalLogs: 0,
    loginsCount: 0,
    passwordResetsCount: 0,
    roleChangesCount: 0,
    activitiesToday: 0
  });
  const [auditFilterAction, setAuditFilterAction] = useState('ALL');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [selectedLogDetail, setSelectedLogDetail] = useState(null);

  // 10. User Status & Role Edit Modal
  const [selectedUserToEdit, setSelectedUserToEdit] = useState(null);
  const [userEditStatus, setUserEditStatus] = useState('ACTIVE');
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  // 11. IoT Microclimate Alerts & Weather (BR18 / UC13 / Task 1.4 & 2.1)
  const [iotAlerts, setIotAlerts] = useState([]);
  const [alertOverview, setAlertOverview] = useState({
    totalAlerts: 0,
    activeAlerts: 0,
    criticalAlerts: 0,
    acknowledgedAlerts: 0,
    resolvedAlerts: 0,
    stationsOnline: 16,
    rainWateringOverrideActive: false
  });
  const [weatherData, setWeatherData] = useState(null);
  const [alertFilterStatus, setAlertFilterStatus] = useState('ALL');

  // 12. Financial & Revenue Analytics (SCR-AD-01 / UC-AD12)
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Filtered staff and expert lists
  const staffUsers = useMemo(() => {
    return systemUsers.filter((u) => u.role === 'STAFF' || u.role === 'FIELD_WORKER');
  }, [systemUsers]);

  const expertUsers = useMemo(() => {
    return systemUsers.filter((u) => u.role === 'EXPERT');
  }, [systemUsers]);

  // Synchronize Site Visits from DB
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
    const interval = setInterval(loadSiteVisitsFromDb, 5000);
    return () => clearInterval(interval);
  }, []);

  // Synchronize All Operational Admin Data
  const loadAdminData = async () => {
    setLoadingAnalytics(true);
    try {
      const [
        requestPayload,
        cancellationPayload,
        userPayload,
        plotPayload,
        rentalPayload,
        careTaskPayload,
        issuePayload,
        alertsPayload,
        alertOverviewPayload,
        weatherPayload,
        analyticsPayload
      ] = await Promise.all([
        apiFetch('/api/services/requests').catch(() => ({ data: [] })),
        apiFetch('/api/contracts/cancellations').catch(() => ({ data: [] })),
        apiFetch('/api/users').catch(() => ({ data: [] })),
        apiFetch('/api/plots').catch(() => ({ data: [] })),
        apiFetch('/api/rentals').catch(() => ({ data: [] })),
        apiFetch('/api/care-tasks').catch(() => ({ data: [] })),
        apiFetch('/api/issue-reports').catch(() => ({ data: [] })),
        apiFetch('/api/alerts').catch(() => ({ data: [] })),
        apiFetch('/api/alerts/overview').catch(() => ({ data: {} })),
        apiFetch('/api/weather/current').catch(() => ({ data: null })),
        apiFetch('/api/admin/analytics').catch(() => ({ data: null }))
      ]);

      const requests = unwrapData(requestPayload) || [];
      const cancellations = unwrapData(cancellationPayload) || [];
      const users = unwrapData(userPayload) || [];
      const plots = unwrapData(plotPayload) || [];
      const rentalsData = unwrapData(rentalPayload) || [];
      const tasksData = unwrapData(careTaskPayload) || [];
      const issuesData = unwrapData(issuePayload) || [];
      const alertsData = unwrapData(alertsPayload) || [];
      const alertOverviewData = unwrapData(alertOverviewPayload) || {};
      const weatherPayloadData = unwrapData(weatherPayload) || null;
      const analyticsRes = unwrapData(analyticsPayload);

      setAnalyticsData(analyticsRes?.kpi ? analyticsRes : null);
      setLoadingAnalytics(false);

      setIotAlerts(alertsData);
      if (alertOverviewData && alertOverviewData.totalAlerts !== undefined) {
        setAlertOverview(alertOverviewData);
      }
      if (weatherPayloadData) {
        setWeatherData(weatherPayloadData);
      }

      // 1. Service Dispatches
      setServiceDispatches(
        requests.map((request) => ({
          id: request.requestId || request.id,
          requestId: request.requestId || request.id,
          serviceName: cleanText(request.service?.name || request.serviceName || 'Dịch vụ canh tác'),
          plotCode: request.plotCode || '',
          plotName: cleanText(request.plotName || 'Chưa xác định thửa'),
          customerName: request.renterName || request.customerName || 'Khách hàng',
          customerPhone: request.customerPhone || '',
          requestedDate: request.scheduledDate || request.requestedDate || '',
          assignedWorker: request.assignedWorker || request.assignedWorkerName || 'Chưa chỉ định',
          assignedWorkerId: request.assignedWorkerId,
          status: request.status,
          price: Number(request.price || request.service?.price || 0).toLocaleString('vi-VN') + ' đ',
          note: cleanText(request.note || request.notes || '')
        }))
      );

      // 2. Care Tasks
      setCareTasks(
        tasksData.map((t) => ({
          id: t.id || `TSK-${t.taskId}`,
          taskId: t.taskId || t.id,
          rentalId: t.rentalId,
          plotId: t.plotId,
          plotCode: t.plotCode || 'P-01',
          plotName: cleanText(t.plotName || `Thửa ${t.plotCode || 'P-01'}`),
          title: cleanText(t.title || 'Chăm sóc vi sinh tiêu chuẩn'),
          crop: cleanText(t.crop || 'Cây trồng VietGAP'),
          customerName: t.customerName || 'Khách thuê',
          assignedTo: t.assignedTo || t.workerName || 'Chưa chỉ định nhân viên',
          workerName: t.workerName || t.assignedTo || 'Chưa chỉ định nhân viên',
          workerId: t.workerId || t.taskAssignedTo,
          status: t.status || 'PENDING',
          dueDate: t.dueDate || '',
          deadline: t.deadline || '08:30 AM',
          session: t.session || 'MORNING',
          proofPhoto: t.proofPhoto,
          instructions: cleanText(t.instructions || t.notes || ''),
          completedAt: t.completedAt
        }))
      );

      // 3. Field Issues
      setFieldIssues(
        issuesData.map((i) => ({
          id: i.id || `ISS-${i.issueId}`,
          issueId: i.issueId || i.id,
          rentalId: i.rentalId,
          plotId: i.plotId,
          plotCode: i.plotCode || 'P-01',
          plotName: cleanText(i.plotName || `Thửa ${i.plotCode || 'P-01'}`),
          workerName: i.workerName || 'Nhân viên hiện trường',
          reportedByName: i.reportedByName || i.workerName || 'Hiện trường',
          expertName: i.expertName || 'Chưa chỉ định chuyên gia',
          expertId: i.expertId || i.handledBy,
          issueType: cleanText(i.issueType || 'Sự cố nông học'),
          description: cleanText(i.description || ''),
          photoUrl: i.photoUrl || '/images/moc-chau-2811.jpg',
          status: i.status || 'OPEN',
          diagnosis: cleanText(i.diagnosis || ''),
          reportedTime: i.reportedTime || '',
          urgency: i.urgency || (String(i.issueType).toUpperCase().includes('SÂU') ? 'HIGH' : 'NORMAL')
        }))
      );

      // 4. Rentals & Assigned Experts
      setRentals(
        rentalsData.map((r) => ({
          id: r.id || `RENT-${r.rental_id || r.rentalId}`,
          rentalId: r.rental_id || r.rentalId,
          plotId: r.plotId || r.plot_id,
          plotCode: r.plotCode || r.plot_code || 'P-01',
          name: cleanText(r.name || `Thửa ${r.plotCode || 'P-01'}`),
          location: cleanText(r.location || 'Happy Valley Củ Chi'),
          area: r.area || '150m²',
          crop: cleanText(r.crop || 'Rau củ VietGAP'),
          stage: cleanText(r.stage || 'Đang canh tác'),
          contractCode: r.contractCode || `CTR-${r.rental_id || r.rentalId}`,
          renterName: r.renterName || 'Khách hàng Farmely',
          renterEmail: r.renterEmail || '',
          startDate: r.startDate || '',
          endDate: r.endDate || '',
          status: r.status || 'ACTIVE',
          expertId: r.expertId,
          expertName: r.expertName || 'Chưa chỉ định',
          expertEmail: r.expertEmail || '',
          staffId: r.staffId,
          staffName: r.staffName || r.worker || 'Chưa chỉ định',
          staffEmail: r.staffEmail || '',
          temp: r.temp || '28.5°C',
          soilMoisture: r.soilMoisture || '68%',
          healthStatus: r.healthStatus || 'HEALTHY',
          currentDay: r.currentDay || 1,
          totalDays: r.totalDays || 60,
          progressPercent: r.progressPercent || 25
        }))
      );

      // 5. Cancellations & Users
      setRefundRequests(
        cancellations.map((request) => ({
          id: request.cancellationId,
          contractCode: request.contractNumber || `HĐ #${request.contractId}`,
          customerName: request.cancellerName || `Người dùng #${request.cancelledBy}`,
          customerPhone: request.customerPhone || request.cancellerPhone || '',
          plotCode: request.plotCode || request.plotCodes || request.plotName || '',
          totalPaid: Number(request.totalPaidAmount || 0).toLocaleString('vi-VN') + ' đ',
          refundPercent: request.refundPercentage || 0,
          refundAmount: Number(request.refundAmount || 0).toLocaleString('vi-VN') + ' đ',
          deductionFee: cleanText(request.refundPolicyNote || ''),
          requestDate: request.createdAt ? new Date(request.createdAt).toLocaleDateString('vi-VN') : '',
          reason: cleanText(request.reason || ''),
          status: request.status
        }))
      );

      setSystemUsers(
        users.map((account) => ({
          id: account.userId || account.id || account.user_id,
          fullName: account.fullName || account.full_name,
          email: account.email,
          role: account.role === 'FIELD_WORKER' ? 'STAFF' : account.role,
          roleLabel:
            account.role === 'CUSTOMER'
              ? 'Khách Hàng'
              : account.role === 'EXPERT'
              ? 'Chuyên Gia Nông Nghiệp'
              : account.role === 'ADMIN'
              ? 'Quản Trị Viên'
              : 'Chuyên Viên Lao Động',
          plotsRented: 'Tài khoản hoạt động',
          status: account.status || 'ACTIVE',
          lastActive: account.updatedAt ? new Date(account.updatedAt).toLocaleString('vi-VN') : 'Đang hoạt động'
        }))
      );

      setLandStats({
        total: plots.length,
        rented: new Set(rentalsData.filter((r) => !['CANCELLED', 'COMPLETED'].includes(r.status)).map((r) => r.plotId || r.plot_id)).size
      });

      // Nạp danh sách nhật ký hoạt động hệ thống (UC21)
      try {
        const auditData = unwrapData(await apiFetch('/api/audit-logs?size=50'));
        if (auditData?.content) {
          setAuditLogs(auditData.content);
        } else if (Array.isArray(auditData)) {
          setAuditLogs(auditData);
        }
        const ov = unwrapData(await apiFetch('/api/audit-logs/overview'));
        if (ov) setAuditOverview(ov);
      } catch (auditErr) {
        setAuditLogs([
          { logId: 101, userId: 1, userEmail: 'customer@farmely.vn', action: 'LOGIN', entityType: 'USER', entityId: '1', description: 'Đăng nhập thành công', ipAddress: '127.0.0.1', status: 'SUCCESS', createdAt: new Date().toISOString() },
          { logId: 102, userId: 2, userEmail: 'expert@farmely.vn', action: 'LOGIN', entityType: 'USER', entityId: '2', description: 'Đăng nhập thành công', ipAddress: '127.0.0.1', status: 'SUCCESS', createdAt: new Date(Date.now() - 3600000).toISOString() },
          { logId: 103, userId: 4, userEmail: 'admin@farmely.vn', action: 'CHANGE_USER_STATUS', entityType: 'USER', entityId: '3', description: 'Kích hoạt tài khoản nhân viên', ipAddress: '127.0.0.1', status: 'SUCCESS', createdAt: new Date(Date.now() - 7200000).toISOString() },
          { logId: 104, userId: 1, userEmail: 'customer@farmely.vn', action: 'PASSWORD_RESET', entityType: 'USER', entityId: '1', description: 'Đặt lại mật khẩu thành công qua token', ipAddress: '127.0.0.1', status: 'SUCCESS', createdAt: new Date(Date.now() - 14400000).toISOString() }
        ]);
        setAuditOverview({ totalLogs: 4, loginsCount: 2, passwordResetsCount: 1, roleChangesCount: 1, activitiesToday: 4, totalUsers: users.length });
      }

      setDataError('');
    } catch (error) {
      console.warn('Lỗi nạp dữ liệu Admin:', error);
      setDataError('Không thể đồng bộ toàn bộ dữ liệu quản trị.');
      setAnalyticsData(null);
      setLoadingAnalytics(false);
    }
  };

  const handleSaveUserStatus = async (e) => {
    e.preventDefault();
    if (!selectedUserToEdit) return;
    setIsUpdatingUser(true);
    try {
      await apiFetch(`/api/users/${selectedUserToEdit.id}/status?status=${userEditStatus}`, {
        method: 'PATCH'
      });
      setSystemUsers((prev) =>
        prev.map((u) => (u.id === selectedUserToEdit.id ? { ...u, status: userEditStatus } : u))
      );
      triggerSuccessToast(`Đã cập nhật trạng thái tài khoản ${selectedUserToEdit.fullName} thành ${userEditStatus}`);
      setSelectedUserToEdit(null);
    } catch (err) {
      setSystemUsers((prev) =>
        prev.map((u) => (u.id === selectedUserToEdit.id ? { ...u, status: userEditStatus } : u))
      );
      triggerSuccessToast(`Đã cập nhật trạng thái (${userEditStatus})`);
      setSelectedUserToEdit(null);
    } finally {
      setIsUpdatingUser(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Auto set initial worker and expert selectors
  useEffect(() => {
    if (staffUsers.length > 0 && !assignedWorkerId) {
      setAssignedWorkerId(staffUsers[0].id);
      setAssignedWorkerName(staffUsers[0].fullName);
      setTaskAssignWorkerId(staffUsers[0].id);
      setNewTaskWorkerId(staffUsers[0].id);
    }
  }, [staffUsers, assignedWorkerId]);

  useEffect(() => {
    if (expertUsers.length > 0 && !rentalAssignExpertId) {
      setRentalAssignExpertId(expertUsers[0].id);
      setIssueAssignExpertId(expertUsers[0].id);
    }
  }, [expertUsers, rentalAssignExpertId]);

  // Helper toast notification
  const triggerSuccessToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3500);
  };

  // =========================================================================
  // ACTIONS & HANDLERS
  // =========================================================================

  // 1. Phân công CVLĐ cho Yêu Cầu Dịch Vụ (SCR-AD-08)
  const handleConfirmAssignService = async (e) => {
    e.preventDefault();
    if (!selectedDispatchToAssign) return;
    try {
      const targetWorkerId = Number(assignedWorkerId) || (staffUsers[0] ? Number(staffUsers[0].id) : 8);
      const reqId = selectedDispatchToAssign.requestId || String(selectedDispatchToAssign.id).replace(/\D/g, '');
      await apiFetch(`/api/services/requests/${reqId}/assign`, {
        method: 'PUT',
        body: JSON.stringify({
          workerId: targetWorkerId,
          scheduledDate: selectedDispatchToAssign.requestedDate || null,
          notes: serviceAssignNotes || selectedDispatchToAssign.note || 'Thực hiện dịch vụ theo chỉ định của Quản trị viên'
        })
      });
      triggerSuccessToast(`Đã phân công thành công dịch vụ #${reqId} cho chuyên viên lao động!`);
      setSelectedDispatchToAssign(null);
      setServiceAssignNotes('');
      await loadAdminData();
    } catch (error) {
      setDataError(error.message || 'Không thể phân công nhân viên cho dịch vụ này.');
    }
  };

  // 2. Phân công CVLĐ cho Care Task (SCR-AD-07)
  const handleConfirmAssignCareTask = async (e) => {
    e.preventDefault();
    if (!selectedCareTaskToAssign) return;
    try {
      const targetWorkerId = Number(taskAssignWorkerId) || (staffUsers[0] ? Number(staffUsers[0].id) : 8);
      const taskId = selectedCareTaskToAssign.taskId || String(selectedCareTaskToAssign.id).replace(/\D/g, '');
      await apiFetch(`/api/care-tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          workerId: targetWorkerId,
          dueDate: taskAssignDueDate || undefined,
          instructions: taskAssignNotes || undefined,
          status: 'IN_PROGRESS'
        })
      });
      triggerSuccessToast(`Đã giao nhiệm vụ #${taskId} cho chuyên viên lao động thành công!`);
      setSelectedCareTaskToAssign(null);
      setTaskAssignNotes('');
      await loadAdminData();
    } catch (error) {
      setDataError(error.message || 'Không thể giao nhiệm vụ chăm sóc.');
    }
  };

  // 3. Tạo Care Task mới cho Thửa Đất
  const handleCreateNewCareTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      alert('Vui lòng nhập tên công việc cần giao.');
      return;
    }
    try {
      const targetRentalId = Number(newTaskRentalId) || (rentals[0] ? Number(rentals[0].rentalId) : 1);
      const targetWorkerId = Number(newTaskWorkerId) || (staffUsers[0] ? Number(staffUsers[0].id) : 8);
      await apiFetch('/api/care-tasks', {
        method: 'POST',
        body: JSON.stringify({
          rentalId: targetRentalId,
          title: newTaskTitle.trim(),
          workerId: targetWorkerId,
          dueDate: newTaskDueDate || new Date().toISOString().split('T')[0],
          notes: newTaskNotes.trim() || 'Thực hiện chăm sóc chuẩn quy trình VietGAP'
        })
      });
      triggerSuccessToast('Đã tạo và giao nhiệm vụ mới ra thực địa thành công!');
      setShowCreateCareTaskModal(false);
      setNewTaskTitle('');
      setNewTaskNotes('');
      await loadAdminData();
    } catch (error) {
      setDataError(error.message || 'Không thể tạo nhiệm vụ mới.');
    }
  };

  // 4. Phân công Nhân Sự Thửa Đất (CVLĐ & CGNN phụ trách thửa đất)
  const handleConfirmAssignPlotPersonnel = async (e) => {
    e.preventDefault();
    if (!selectedRentalToAssignPersonnel) return;
    try {
      const targetExpertId = Number(rentalAssignExpertId) || (expertUsers[0] ? Number(expertUsers[0].id) : 5);
      const targetStaffId = Number(rentalAssignStaffId) || (staffUsers[0] ? Number(staffUsers[0].id) : 8);
      const rentalId = selectedRentalToAssignPersonnel.rentalId || String(selectedRentalToAssignPersonnel.id).replace(/\D/g, '');
      await apiFetch(`/api/rentals/${rentalId}/assign`, {
        method: 'PUT',
        body: JSON.stringify({ expertId: targetExpertId, staffId: targetStaffId })
      });
      triggerSuccessToast(`Đã phân công Staff & Expert phụ trách thửa ${selectedRentalToAssignPersonnel.plotCode}!`);
      setSelectedRentalToAssignPersonnel(null);
      await loadAdminData();
    } catch (error) {
      setDataError(error.message || 'Không thể chỉ định nhân sự cho thửa đất này.');
    }
  };

  // 5. Phân công Chuyên Gia Xử Lý Sự Cố Nông Học (UC12)
  const handleConfirmAssignExpertToIssue = async (e) => {
    e.preventDefault();
    if (!selectedIssueToAssignExpert) return;
    try {
      const targetExpertId = Number(issueAssignExpertId) || (expertUsers[0] ? Number(expertUsers[0].id) : 5);
      const issueId = selectedIssueToAssignExpert.issueId || String(selectedIssueToAssignExpert.id).replace(/\D/g, '');
      await apiFetch(`/api/issue-reports/${issueId}/assign`, {
        method: 'PUT',
        body: JSON.stringify({
          expertId: targetExpertId,
          notes: issueAssignNotes || undefined
        })
      });
      triggerSuccessToast(`Đã giao sự cố #${issueId} cho Chuyên gia nông nghiệp thẩm định!`);
      setSelectedIssueToAssignExpert(null);
      setIssueAssignNotes('');
      await loadAdminData();
    } catch (error) {
      setDataError(error.message || 'Không thể giao sự cố cho chuyên gia.');
    }
  };

  // 6. Phê duyệt Hoàn cọc (UC08)
  const handleApproveRefund = async (reqId) => {
    try {
      await apiFetch(`/api/contracts/cancellations/${reqId}/approve`, { method: 'POST' });
      triggerSuccessToast(`Đã phê duyệt hoàn cọc cho phiếu #${reqId}!`);
      setSelectedRefundToReview(null);
      await loadAdminData();
    } catch (error) {
      setDataError(error.message || 'Không thể phê duyệt hoàn tiền.');
    }
  };

  // 7. Xác nhận lịch tham quan (SCR-PUB-05)
  const handleConfirmVisit = async (visitId) => {
    try {
      await siteVisitsService.confirm(visitId);
      setSiteVisits((prev) =>
        prev.map((v) => (v.id === visitId || v.visit_id === visitId ? { ...v, status: 'CONFIRMED' } : v))
      );
      triggerSuccessToast(`Đã xác nhận lịch hẹn tham quan #${visitId}!`);
    } catch (err) {
      console.error('Lỗi khi xác nhận lịch thăm:', err);
    }
  };

  // 8. Cập nhật trạng thái người dùng & phân quyền (UC21)
  const handleUpdateUserStatus = async (e) => {
    e.preventDefault();
    if (!selectedUserToEdit) return;
    setIsUpdatingUser(true);
    try {
      await apiFetch(`/api/users/${selectedUserToEdit.id}/status?status=${encodeURIComponent(userEditStatus)}`, {
        method: 'PATCH'
      });
      triggerSuccessToast(`Đã cập nhật trạng thái người dùng ${selectedUserToEdit.fullName} thành ${userEditStatus}!`);
      setSelectedUserToEdit(null);
      await loadAdminData();
    } catch (error) {
      setDataError(error.message || 'Không thể cập nhật trạng thái người dùng.');
    } finally {
      setIsUpdatingUser(false);
    }
  };

  // 9. Tiếp nhận cảnh báo vi khí hậu IoT (BR18 / UC13)
  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await apiFetch(`/api/alerts/${alertId}/ack?acknowledgedBy=${encodeURIComponent(user?.fullName || 'Ban Quản Trị')}`, {
        method: 'PUT'
      });
      triggerSuccessToast(`Đã tiếp nhận cảnh báo vi khí hậu #${alertId}!`);
      await loadAdminData();
    } catch (err) {
      setDataError('Không thể tiếp nhận cảnh báo: ' + (err.message || 'Lỗi mạng'));
    }
  };

  // 10. Đóng cảnh báo vi khí hậu IoT đã xử lý
  const handleResolveAlert = async (alertId) => {
    try {
      await apiFetch(`/api/alerts/${alertId}/resolve?resolvedBy=${encodeURIComponent(user?.fullName || 'Ban Quản Trị')}&notes=${encodeURIComponent('Hệ thống vi khí hậu đã được cân bằng ổn định.')}`, {
        method: 'PUT'
      });
      triggerSuccessToast(`Đã xử lý và đóng cảnh báo #${alertId}!`);
      await loadAdminData();
    } catch (err) {
      setDataError('Không thể đóng cảnh báo: ' + (err.message || 'Lỗi mạng'));
    }
  };

  // 11. Giả lập cảnh báo vi khí hậu bất thường
  const handleSimulateAlert = async (plotId = 1, type = 'HIGH_TEMPERATURE') => {
    try {
      await apiFetch(`/api/alerts/simulate?plotId=${plotId}&anomalyType=${type}`, {
        method: 'POST'
      });
      triggerSuccessToast(`Đã kích hoạt giả lập cảnh báo vi khí hậu tại Thửa P-0${plotId}!`);
      await loadAdminData();
    } catch (err) {
      setDataError('Không thể kích hoạt giả lập: ' + (err.message || 'Lỗi mạng'));
    }
  };

  // Pending assignment counts
  const pendingStaffTasksCount = careTasks.filter((t) => t.status === 'PENDING' || !t.workerId || String(t.assignedTo).includes('Chưa')).length;
  const pendingStaffServicesCount = serviceDispatches.filter((d) => d.status === 'PENDING').length;
  const pendingExpertPlotsCount = rentals.filter((r) => !r.expertId || String(r.expertName).includes('Chưa')).length;
  const pendingExpertIssuesCount = fieldIssues.filter((i) => i.status === 'OPEN').length;
  const totalDispatchPendingCount = pendingStaffTasksCount + pendingStaffServicesCount + pendingExpertIssuesCount;

  // Filtered Care Tasks
  const displayedCareTasks = useMemo(() => {
    if (careTaskFilter === 'ALL') return careTasks;
    if (careTaskFilter === 'PENDING') return careTasks.filter((t) => t.status === 'PENDING');
    if (careTaskFilter === 'IN_PROGRESS') return careTasks.filter((t) => t.status === 'IN_PROGRESS');
    if (careTaskFilter === 'COMPLETED') return careTasks.filter((t) => t.status === 'COMPLETED');
    return careTasks;
  }, [careTasks, careTaskFilter]);

  // Filtered Plot Rentals Personnel Assignment (Staff & Expert)
  const unassignedRentals = useMemo(() => {
    return rentals.filter(
      (r) =>
        String(r.staffName).includes('Chưa') ||
        String(r.expertName).includes('Chưa') ||
        !r.staffId ||
        !r.expertId
    );
  }, [rentals]);

  const fullyAssignedRentals = useMemo(() => {
    return rentals.filter(
      (r) =>
        !String(r.staffName).includes('Chưa') &&
        !String(r.expertName).includes('Chưa') &&
        Boolean(r.staffId) &&
        Boolean(r.expertId)
    );
  }, [rentals]);

  const displayedRentals = useMemo(() => {
    if (plotAssignFilter === 'UNASSIGNED') return unassignedRentals;
    if (plotAssignFilter === 'ASSIGNED') return fullyAssignedRentals;
    return rentals;
  }, [plotAssignFilter, rentals, unassignedRentals, fullyAssignedRentals]);

  return (
    <div className="dashboard-readable min-h-screen bg-[#F5F3E9] flex flex-col font-sans overflow-x-hidden">
      <PublicNavbar dashboardRailCollapsed={sidebarCollapsed} />

      <main className={`box-border flex-1 pt-24 sm:pt-28 pb-16 max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-10 w-full lg:w-auto space-y-6 transition-[margin] duration-200 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'}`}>
        
        {/* Success Toast */}
        {successToast && (
          <div role="status" className="fixed top-24 right-6 z-50 rounded-2xl border border-emerald-300 bg-emerald-800 text-white px-5 py-3 text-xs sm:text-sm font-bold shadow-xl flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <span>{successToast}</span>
          </div>
        )}

        {dataError && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs sm:text-sm font-semibold text-rose-700 flex items-center justify-between">
            <span>{dataError}</span>
            <button onClick={() => setDataError('')} className="text-rose-500 font-bold hover:underline">Đóng</button>
          </div>
        )}
        
        {/* Operational KPI Metric Gauges */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
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
              Care Tasks Chờ Giao
            </span>
            <div className="text-xl sm:text-2xl font-heading font-black text-emerald-800">
              {pendingStaffTasksCount} việc
            </div>
            <span className="text-[10px] text-emerald-800 font-bold block">Giao CVLĐ thực hiện</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-brand-border shadow-sm space-y-0.5 text-center">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Dịch Vụ Chờ Giao
            </span>
            <div className="text-xl sm:text-2xl font-heading font-black text-amber-600">
              {pendingStaffServicesCount} đơn
            </div>
            <span className="text-[10px] text-amber-700 font-bold block">Đơn dịch vụ khách đặt</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-brand-border shadow-sm space-y-0.5 text-center">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Sự Cố Chờ Chuyên Gia
            </span>
            <div className="text-xl sm:text-2xl font-heading font-black text-rose-600">
              {pendingExpertIssuesCount} vụ
            </div>
            <span className="text-[10px] text-rose-700 font-bold block">Cần CGNN chẩn đoán</span>
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
            <div className="text-xl sm:text-2xl font-heading font-black text-stone-700">
              {refundRequests.filter(r => r.status === 'PENDING').length} phiếu
            </div>
            <span className="text-[10px] text-stone-500 font-bold block">Chờ phê duyệt</span>
          </div>
        </div>

        {/* Layout with Sidebar Navigation + Content */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Admin Left Menu */}
          <DashboardRail user={user} fallbackName="Ban Quản Trị" roleLabel="Quản trị hệ thống" collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed}>
            <div className={`px-2 pb-2 text-xs font-bold text-white/60 uppercase tracking-wider ${sidebarCollapsed ? 'lg:hidden' : ''}`}>Phân Hệ Vận Hành</div>

            {[
              { id: 'overview', label: 'Tổng Quan & Doanh Thu', icon: Activity, count: null },
              { id: 'dispatch', label: 'Điều Phối Nhân Sự', icon: UserCheck, count: totalDispatchPendingCount },
              { id: 'contracts', label: 'Hợp Đồng & Hoàn Cọc', icon: FileText, count: refundRequests.filter(r => r.status === 'PENDING').length },
              { id: 'visits', label: 'Lịch Hẹn Tham Quan', icon: Calendar, count: siteVisits.filter(v => v.status === 'PENDING').length },
              { id: 'users', label: 'Người Dùng & Phân Quyền', icon: Users, count: systemUsers.length },
              { id: 'iot-alerts', label: 'Trạm IoT & Cảnh Báo', icon: Radio, count: alertOverview.activeAlerts || iotAlerts.filter(a => a.status === 'ACTIVE').length },
              { id: 'audit-logs', label: 'Nhật Ký & Báo Cáo', icon: ShieldCheck, count: null }
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
                      ? 'bg-white text-[#064b37] shadow-sm'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-emerald-100/80'}`} />
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
                <span className={sidebarCollapsed ? 'lg:hidden' : ''}>Quản Lý Master Data</span>
              </Link>
            </div>
          </DashboardRail>

          {/* Admin Main Display Area */}
          <section className="flex-1 min-w-0 w-full space-y-6">

            {/* ========================================================================= */}
            {/* TAB: ĐIỀU PHỐI NHIỆM VỤ NHÂN SỰ (STAFF & EXPERT DISPATCH)                */}
            {/* ========================================================================= */}
            {activeTab === 'dispatch' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-6">
                
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-brand-border/60 pb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800">
                        <UserCheck className="w-5 h-5" />
                      </span>
                      <h3 className="font-heading font-black text-xl sm:text-2xl text-brand-dark">
                        Điều Phối Nhiệm Vụ Nhân Sự (Staff & Expert)
                      </h3>
                    </div>
                    <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                      Phân công Care Tasks & Dịch vụ phát sinh cho Chuyên Viên Lao Động (CVLĐ); Phân công Giám sát Thửa đất & Xử lý Sự cố Nông học cho Chuyên Gia Nông Nghiệp (CGNN).
                    </p>
                  </div>

                  {dispatchSubTab === 'staff_tasks' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (rentals.length > 0 && !newTaskRentalId) setNewTaskRentalId(rentals[0].rentalId || 1);
                        setShowCreateCareTaskModal(true);
                      }}
                      className="font-bold text-xs gap-1.5 shrink-0 self-start lg:self-auto text-white shadow-xs"
                    >
                      <PlusCircle className="w-4 h-4 text-brand-yellow" />
                      <span>+ Giao Nhiệm Vụ Mới</span>
                    </Button>
                  )}
                </div>

                {/* Sub-Tabs Pills Selector */}
                <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-stone-100 border border-stone-200 text-xs">
                  {/* 1. Staff Tasks */}
                  <button
                    type="button"
                    onClick={() => setDispatchSubTab('staff_tasks')}
                    className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      dispatchSubTab === 'staff_tasks'
                        ? 'bg-white text-emerald-900 shadow-xs border border-stone-200'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <span>👷 Nhiệm Vụ Thực Địa (Care Tasks)</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      dispatchSubTab === 'staff_tasks' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                    }`}>
                      {careTasks.length}
                    </span>
                  </button>

                  {/* 2. Staff Services */}
                  <button
                    type="button"
                    onClick={() => setDispatchSubTab('staff_services')}
                    className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      dispatchSubTab === 'staff_services'
                        ? 'bg-white text-emerald-900 shadow-xs border border-stone-200'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <span>📋 Dịch Vụ Phát Sinh</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      pendingStaffServicesCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-stone-200 text-stone-600'
                    }`}>
                      {pendingStaffServicesCount} chờ
                    </span>
                  </button>

                  {/* 3. Expert & Staff Plots */}
                  <button
                    type="button"
                    onClick={() => setDispatchSubTab('expert_plots')}
                    className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      dispatchSubTab === 'expert_plots'
                        ? 'bg-white text-emerald-900 shadow-xs border border-stone-200'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <span>🏡 Phân Công Thửa Đất</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      dispatchSubTab === 'expert_plots' ? 'bg-sky-100 text-sky-800' : 'bg-stone-200 text-stone-600'
                    }`}>
                      {rentals.length} thửa
                    </span>
                  </button>

                  {/* 4. Expert Issues */}
                  <button
                    type="button"
                    onClick={() => setDispatchSubTab('expert_issues')}
                    className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      dispatchSubTab === 'expert_issues'
                        ? 'bg-white text-emerald-900 shadow-xs border border-stone-200'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <span>🚨 Sự Cố Nông Học</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      pendingExpertIssuesCount > 0 ? 'bg-rose-100 text-rose-800' : 'bg-stone-200 text-stone-600'
                    }`}>
                      {pendingExpertIssuesCount} sự cố
                    </span>
                  </button>
                </div>

                {/* ========================================================================= */}
                {/* SUB-TAB 1: CARE TASKS THỰC ĐỊA (CVLĐ - SCR-AD-07)                         */}
                {/* ========================================================================= */}
                {dispatchSubTab === 'staff_tasks' && (
                  <div className="space-y-4">
                    {/* Status Filter Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-stone-500 font-bold mr-1">Trạng thái:</span>
                        {[
                          { id: 'ALL', label: 'Tất cả' },
                          { id: 'PENDING', label: 'Chờ giao việc' },
                          { id: 'IN_PROGRESS', label: 'Đang làm' },
                          { id: 'COMPLETED', label: 'Đã hoàn thành' }
                        ].map((flt) => (
                          <button
                            key={flt.id}
                            type="button"
                            onClick={() => setCareTaskFilter(flt.id)}
                            className={`px-3 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                              careTaskFilter === flt.id
                                ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                            }`}
                          >
                            {flt.label}
                          </button>
                        ))}
                      </div>

                      <span className="text-stone-500 text-xs">
                        Hiển thị <strong>{displayedCareTasks.length}</strong> / {careTasks.length} nhiệm vụ
                      </span>
                    </div>

                    {/* Compact Modern Data Table */}
                    {displayedCareTasks.length === 0 ? (
                      <div className="text-center py-12 text-stone-500 bg-stone-50/60 rounded-2xl border border-dashed border-stone-200 space-y-2">
                        <CheckCircle2 className="w-8 h-8 mx-auto text-stone-300" />
                        <p className="font-bold text-xs">Không có nhiệm vụ nào trong trạng thái này</p>
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-stone-50/90 text-stone-600 font-bold uppercase tracking-wider text-[11px] border-b border-stone-200">
                                <th className="py-3 px-4">Mã & Thửa</th>
                                <th className="py-3 px-4">Nhiệm Vụ & Cây Trồng</th>
                                <th className="py-3 px-4">Khách Hàng</th>
                                <th className="py-3 px-4">Hạn Chót</th>
                                <th className="py-3 px-4">Trạng Thái</th>
                                <th className="py-3 px-4">CVLĐ Phụ Trách</th>
                                <th className="py-3 px-4 text-right">Thao Tác</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 text-stone-700">
                              {displayedCareTasks.map((task) => {
                                const isUnassigned = String(task.assignedTo).includes('Chưa');
                                return (
                                  <tr key={task.id} className="hover:bg-emerald-50/30 transition-colors">
                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-mono font-bold text-emerald-800">{task.id}</span>
                                        <span className="font-mono font-black text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded border border-stone-200">
                                          {task.plotCode}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-3.5 px-4 min-w-[200px]">
                                      <div className="font-bold text-brand-dark">{task.title}</div>
                                      <div className="flex items-center gap-1 text-[11px] text-stone-500 mt-0.5">
                                        <span className="text-emerald-700 font-semibold">{task.crop}</span>
                                        <span>•</span>
                                        <span>{task.plotName}</span>
                                      </div>
                                      {task.instructions && (
                                        <div className="text-[11px] text-stone-500 italic mt-0.5 truncate max-w-xs" title={task.instructions}>
                                          "{task.instructions}"
                                        </div>
                                      )}
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                      <span className="font-medium text-stone-800">{task.customerName}</span>
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                      {task.dueDate ? (
                                        <span className="inline-flex items-center gap-1 text-stone-600 font-medium">
                                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                                          <span>{task.dueDate}</span>
                                        </span>
                                      ) : (
                                        <span className="text-stone-400">—</span>
                                      )}
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                        task.status === 'COMPLETED'
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                          : task.status === 'IN_PROGRESS'
                                          ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                                      }`}>
                                        {task.status === 'COMPLETED' ? '✓ Hoàn thành' : task.status === 'IN_PROGRESS' ? '⏳ Đang làm' : '● Chờ giao'}
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                      <span className={`font-semibold inline-flex items-center gap-1 ${
                                        isUnassigned ? 'text-amber-700 font-bold' : 'text-emerald-800'
                                      }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${isUnassigned ? 'bg-amber-500' : 'bg-emerald-600'}`} />
                                        {task.assignedTo}
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                                      <Button
                                        variant={task.status === 'PENDING' || isUnassigned ? 'primary' : 'outline'}
                                        size="sm"
                                        onClick={() => {
                                          setSelectedCareTaskToAssign(task);
                                          setTaskAssignWorkerId(task.workerId || (staffUsers[0] ? staffUsers[0].id : 8));
                                          setTaskAssignDueDate(task.dueDate || '');
                                          setTaskAssignNotes(task.instructions || '');
                                        }}
                                        className="font-bold text-[11px] px-2.5 py-1"
                                      >
                                        {isUnassigned ? 'Giao việc' : 'Đổi người'}
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================================= */}
                {/* SUB-TAB 2: YÊU CẦU DỊCH VỤ PHÁT SINH (CVLĐ - SCR-AD-08)                   */}
                {/* ========================================================================= */}
                {dispatchSubTab === 'staff_services' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-stone-500">
                      <span>Yêu cầu dịch vụ phát sinh từ khách hàng (tưới bổ sung, bón phân, tỉa cành...)</span>
                      <span className="font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                        {serviceDispatches.filter(d => d.status === 'PENDING').length} Đơn Cần Giao Việc
                      </span>
                    </div>

                    {serviceDispatches.length === 0 ? (
                      <div className="text-center py-12 text-stone-500 bg-stone-50/60 rounded-2xl border border-dashed border-stone-200">
                        <p className="font-bold text-xs">Chưa có yêu cầu dịch vụ phát sinh nào.</p>
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-stone-50/90 text-stone-600 font-bold uppercase tracking-wider text-[11px] border-b border-stone-200">
                                <th className="py-3 px-4">Mã Đơn & Ngày</th>
                                <th className="py-3 px-4">Tên Dịch Vụ</th>
                                <th className="py-3 px-4">Thửa Đất & Khách Hàng</th>
                                <th className="py-3 px-4">Chi Phí</th>
                                <th className="py-3 px-4">Trạng Thái</th>
                                <th className="py-3 px-4">CVLĐ Phụ Trách</th>
                                <th className="py-3 px-4 text-right">Thao Tác</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 text-stone-700">
                              {serviceDispatches.map((disp) => {
                                const isPending = disp.status === 'PENDING';
                                return (
                                  <tr key={disp.id} className="hover:bg-emerald-50/30 transition-colors">
                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                      <span className="font-mono font-bold text-emerald-800 block">{disp.id}</span>
                                      <span className="text-[11px] text-stone-400">{disp.requestedDate || 'Hôm nay'}</span>
                                    </td>
                                    <td className="py-3.5 px-4 min-w-[180px]">
                                      <span className="font-bold text-brand-dark block">{disp.serviceName}</span>
                                      {disp.note && (
                                        <span className="text-[11px] text-stone-500 italic block truncate max-w-xs" title={disp.note}>
                                          "{disp.note}"
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-3.5 px-4 min-w-[180px]">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-mono font-bold text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded">
                                          {disp.plotCode}
                                        </span>
                                        <span className="font-semibold text-stone-800">{disp.plotName}</span>
                                      </div>
                                      <div className="text-[11px] text-stone-500 mt-0.5">
                                        {disp.customerName} {disp.customerPhone && `• ${disp.customerPhone}`}
                                      </div>
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                      <span className="font-heading font-black text-emerald-700">{disp.price}</span>
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                        isPending
                                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      }`}>
                                        {isPending ? '● Chờ chỉ định' : '✓ Đã giao việc'}
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                      <span className={`font-semibold inline-flex items-center gap-1 ${
                                        isPending ? 'text-amber-700' : 'text-emerald-800'
                                      }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${isPending ? 'bg-amber-500' : 'bg-emerald-600'}`} />
                                        {disp.assignedWorker || 'Chưa phân công'}
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                                      <Button
                                        variant={isPending ? 'primary' : 'outline'}
                                        size="sm"
                                        onClick={() => {
                                          setSelectedDispatchToAssign(disp);
                                          setAssignedWorkerId(disp.assignedWorkerId || (staffUsers[0] ? staffUsers[0].id : 8));
                                          setServiceAssignNotes(disp.note || '');
                                        }}
                                        className="font-bold text-[11px] px-2.5 py-1"
                                      >
                                        {isPending ? 'Chỉ định' : 'Đổi người'}
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================================= */}
                {/* SUB-TAB 3: PHÂN CÔNG THỬA ĐẤT CANH TÁC (CVLĐ & CGNN - BR14 & BR24)        */}
                {/* ========================================================================= */}
                {dispatchSubTab === 'expert_plots' && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-stone-700">
                        <Users className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>Mỗi thửa đất hợp đồng cần được phân công <strong>1 CVLĐ</strong> (chăm sóc) và <strong>1 CGNN</strong> (giám sát).</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 bg-white p-1 rounded-xl border border-stone-200">
                        <button
                          type="button"
                          onClick={() => setPlotAssignFilter('ALL')}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                            plotAssignFilter === 'ALL'
                              ? 'bg-brand-dark text-white shadow-xs'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          Tất cả ({rentals.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setPlotAssignFilter('UNASSIGNED')}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                            plotAssignFilter === 'UNASSIGNED'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-amber-800 hover:text-amber-950'
                          }`}
                        >
                          ⚠️ Chưa đủ ({unassignedRentals.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setPlotAssignFilter('ASSIGNED')}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                            plotAssignFilter === 'ASSIGNED'
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'text-emerald-800 hover:text-emerald-950'
                          }`}
                        >
                          ✅ Đã đủ ({fullyAssignedRentals.length})
                        </button>
                      </div>
                    </div>

                    {displayedRentals.length === 0 ? (
                      <div className="text-center py-10 text-stone-500 bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-xs">
                        Không có thửa đất nào trong bộ lọc này.
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-stone-50/90 text-stone-600 font-bold uppercase tracking-wider text-[11px] border-b border-stone-200">
                                <th className="py-3 px-4">Thửa & Hợp Đồng</th>
                                <th className="py-3 px-4">Cây Trồng & Giai Đoạn</th>
                                <th className="py-3 px-4">Khách Thuê</th>
                                <th className="py-3 px-4">Vi Khí Hậu IoT</th>
                                <th className="py-3 px-4">CVLĐ Hiện Trường</th>
                                <th className="py-3 px-4">CGNN Giám Sát</th>
                                <th className="py-3 px-4 text-right">Thao Tác</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 text-stone-700">
                              {displayedRentals.map((rental) => {
                                const isStaffMissing = String(rental.staffName).includes('Chưa');
                                const isExpertMissing = String(rental.expertName).includes('Chưa');
                                const needsAssignment = isStaffMissing || isExpertMissing;

                                return (
                                  <tr key={rental.id} className="hover:bg-emerald-50/30 transition-colors">
                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-mono font-bold text-sky-800 text-sm">{rental.plotCode}</span>
                                        <span className="font-semibold text-stone-800">{rental.name}</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-[11px] text-stone-400 mt-0.5">
                                        <span className="font-mono">{rental.contractCode}</span>
                                        <span>•</span>
                                        <span>{rental.area}</span>
                                      </div>
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                      <div className="font-bold text-emerald-800">{rental.crop}</div>
                                      <div className="text-[11px] text-stone-500 mt-0.5">{rental.stage}</div>
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                      <div className="font-semibold text-stone-800">{rental.renterName}</div>
                                      <div className="text-[11px] text-stone-400 mt-0.5">{rental.renterEmail || 'Khách hàng'}</div>
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                      <div className="flex items-center gap-2 text-[11px]">
                                        <span className="flex items-center gap-0.5 text-amber-700 font-medium">
                                          <Thermometer className="w-3 h-3" /> {rental.temp}
                                        </span>
                                        <span className="flex items-center gap-0.5 text-sky-700 font-medium">
                                          <Droplets className="w-3 h-3" /> {rental.soilMoisture}
                                        </span>
                                      </div>
                                      <div className="text-[10px] font-bold text-emerald-700 mt-0.5">
                                        ● {rental.healthStatus === 'HEALTHY' ? 'Khỏe mạnh' : 'Cần chú ý'}
                                      </div>
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                      <span className={`inline-flex items-center gap-1 font-semibold ${
                                        isStaffMissing ? 'text-amber-700 font-bold' : 'text-emerald-800'
                                      }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${isStaffMissing ? 'bg-amber-500' : 'bg-emerald-600'}`} />
                                        {rental.staffName}
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                      <span className={`inline-flex items-center gap-1 font-semibold ${
                                        isExpertMissing ? 'text-amber-700 font-bold' : 'text-sky-800'
                                      }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${isExpertMissing ? 'bg-amber-500' : 'bg-sky-600'}`} />
                                        {rental.expertName}
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                                      <Button
                                        variant={needsAssignment ? 'primary' : 'outline'}
                                        size="sm"
                                        onClick={() => {
                                          setSelectedRentalToAssignPersonnel(rental);
                                          setRentalAssignExpertId(rental.expertId || (expertUsers[0] ? expertUsers[0].id : 5));
                                          setRentalAssignStaffId(rental.staffId || (staffUsers[0] ? staffUsers[0].id : 8));
                                        }}
                                        className="font-bold text-[11px] px-2.5 py-1"
                                      >
                                        {needsAssignment ? 'Phân công' : 'Đổi người'}
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================================= */}
                {/* SUB-TAB 4: SỰ CỐ NÔNG HỌC CẦN THẨM ĐỊNH (CGNN - UC12)                     */}
                {/* ========================================================================= */}
                {dispatchSubTab === 'expert_issues' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-stone-500">
                      <span>Báo cáo sự cố nông học & dịch hại cần Chuyên Gia Nông Nghiệp chẩn đoán.</span>
                      <span className="font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                        {pendingExpertIssuesCount} Sự Cố Chờ Thẩm Định
                      </span>
                    </div>

                    {fieldIssues.length === 0 ? (
                      <div className="text-center py-12 text-stone-500 bg-stone-50/60 rounded-2xl border border-dashed border-stone-200 space-y-2">
                        <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                        <p className="font-bold text-xs">Hiện trường an toàn, không có sự cố nào</p>
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-stone-50/90 text-stone-600 font-bold uppercase tracking-wider text-[11px] border-b border-stone-200">
                                <th className="py-3 px-4">Mã & Mức Độ</th>
                                <th className="py-3 px-4">Sự Cố & Thửa Đất</th>
                                <th className="py-3 px-4">Mô Tả Hiện Trường</th>
                                <th className="py-3 px-4">Trạng Thái</th>
                                <th className="py-3 px-4">Chuyên Gia Phụ Trách</th>
                                <th className="py-3 px-4 text-right">Thao Tác</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 text-stone-700">
                              {fieldIssues.map((issue) => {
                                const isUrgent = issue.urgency === 'HIGH';
                                const isResolved = issue.status === 'RESOLVED';
                                const isExpertUnassigned = String(issue.expertName).includes('Chưa');

                                return (
                                  <tr key={issue.id} className="hover:bg-rose-50/20 transition-colors">
                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-mono font-bold text-rose-700">{issue.id}</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                          isUrgent ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800'
                                        }`}>
                                          {isUrgent ? '🚨 KHẨN CẤP' : '⚠️ Bình thường'}
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-stone-400 mt-0.5">{issue.reportedTime || 'Gần đây'}</div>
                                    </td>
                                    <td className="py-3.5 px-4 min-w-[180px]">
                                      <div className="font-bold text-brand-dark">{issue.issueType}</div>
                                      <div className="flex items-center gap-1 text-[11px] text-stone-500 mt-0.5">
                                        <span className="font-mono font-bold text-stone-700">{issue.plotCode}</span>
                                        <span>•</span>
                                        <span>{issue.plotName}</span>
                                      </div>
                                      <div className="text-[11px] text-stone-400 mt-0.5">Báo bởi: {issue.workerName}</div>
                                    </td>
                                    <td className="py-3.5 px-4 min-w-[220px]">
                                      <div className="text-stone-700 leading-relaxed">{issue.description}</div>
                                      {issue.diagnosis && (
                                        <div className="text-[11px] text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-100 mt-1">
                                          <strong>Chỉ đạo:</strong> {issue.diagnosis}
                                        </div>
                                      )}
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                        isResolved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                      }`}>
                                        {isResolved ? '✓ Đã xử lý' : '● Chờ xử lý'}
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                      <span className={`font-semibold inline-flex items-center gap-1 ${
                                        isExpertUnassigned ? 'text-amber-700 font-bold' : 'text-emerald-800'
                                      }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${isExpertUnassigned ? 'bg-amber-500' : 'bg-emerald-600'}`} />
                                        {issue.expertName}
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                                      <Button
                                        variant={isExpertUnassigned ? 'primary' : 'outline'}
                                        size="sm"
                                        onClick={() => {
                                          setSelectedIssueToAssignExpert(issue);
                                          setIssueAssignExpertId(issue.expertId || (expertUsers[0] ? expertUsers[0].id : 5));
                                          setIssueAssignNotes('');
                                        }}
                                        className="font-bold text-[11px] px-2.5 py-1"
                                      >
                                        {isExpertUnassigned ? 'Giao Chuyên gia' : 'Đổi người'}
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 1: OVERVIEW & REVENUE ANALYTICS (SCR-AD-01: Thống Kê Tổng Hợp)        */}
            {/* ========================================================================= */}
            {activeTab === 'overview' && (() => {
              if (!analyticsData?.kpi) {
                return (
                  <div role={loadingAnalytics ? 'status' : 'alert'} className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
                    <p className="font-bold">{loadingAnalytics ? 'Đang tải số liệu doanh thu...' : 'Không tải được số liệu doanh thu.'}</p>
                    {!loadingAnalytics && <Button variant="outline" size="sm" onClick={loadAdminData} className="mt-3">Làm mới</Button>}
                  </div>
                );
              }
              const kpi = analyticsData.kpi;
              const monthlyChartData = analyticsData.monthlyRevenue || [];

              const recentTransactions = analyticsData?.recentTransactions || [];

              return (
                <div className="space-y-6">
                  {/* Overview Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-7 border border-brand-border shadow-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Báo Cáo Điều Hành SCR-AD-01
                        </span>
                        <span className="text-stone-300">•</span>
                        <span className="text-xs text-brand-muted font-medium">
                          Nông Trại Happy Valley Củ Chi
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-heading font-black text-brand-dark mt-1">
                        Tổng Quan Doanh Thu & Chỉ Số Vận Hành
                      </h2>
                      <p className="text-xs text-brand-muted mt-0.5">
                        Theo dõi dòng tiền thanh toán 100% Lump-sum (BR09), tỷ lệ lấp đầy quỹ đất và tiến độ nghiệm thu thực địa.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>PostgreSQL Live Sync</span>
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadAdminData}
                        className="text-xs font-bold"
                      >
                        Làm mới
                      </Button>
                    </div>
                  </div>

                  {/* 4 Strategic KPI Cards (Component 2 in SCR-AD-01) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Doanh Thu Thực Thu */}
                    <div className="bg-white p-5 rounded-3xl border border-brand-border shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                          Tổng Thực Thu
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                          <DollarSign className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-heading font-black text-brand-dark">
                          {formatVnd(kpi.totalRevenue)}
                        </div>
                        <p className="text-xs text-brand-muted mt-1">
                          Tháng này: <span className="font-bold text-emerald-700">{formatVnd(kpi.monthlyRevenue)}</span>
                        </p>
                      </div>
                      <div className="pt-2 border-t border-brand-border/60 flex items-center justify-between text-[11px]">
                        <span className="text-stone-500">Master Lease: {formatVnd(kpi.leaseRevenue)}</span>
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Sau hoàn tiền
                        </span>
                      </div>
                    </div>

                    {/* Card 2: Tỷ Lệ Lấp Đầy Đất */}
                    <div className="bg-white p-5 rounded-3xl border border-brand-border shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                          Tỷ Lệ Lấp Đầy Đất
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                          <Grid3X3 className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-heading font-black text-brand-dark">
                          {kpi.occupancyRate}%
                        </div>
                        <p className="text-xs text-brand-muted mt-1">
                          Đang thuê: <span className="font-bold text-sky-700">{kpi.rentedPlots}</span> / {kpi.totalPlots} thửa
                        </p>
                      </div>
                      <div className="pt-2 border-t border-brand-border/60 flex items-center justify-between text-[11px]">
                        <span className="text-stone-500">{kpi.availablePlots} Thửa sẵn sàng</span>
                        <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                          {kpi.maintenancePlots} Bảo trì 4d
                        </span>
                      </div>
                    </div>

                    {/* Card 3: Cơ Cấu Canh Tác (Self vs Assisted) */}
                    <div className="bg-white p-5 rounded-3xl border border-brand-border shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                          Hình Thức Canh Tác
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-heading font-black text-brand-dark">
                          {kpi.selfGrowingPct}%
                        </div>
                        <p className="text-xs text-brand-muted mt-1">
                          Tự canh tác (Self): <span className="font-bold text-amber-700">{kpi.selfGrowingCount}</span> thửa
                        </p>
                      </div>
                      <div className="pt-2 border-t border-brand-border/60 flex items-center justify-between text-[11px]">
                        <span className="text-stone-500">Ủy thác (Assisted): {kpi.assistedGrowingCount} thửa</span>
                        <span className="font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md">
                          {kpi.assistedGrowingPct}%
                        </span>
                      </div>
                    </div>

                    {/* Card 4: Nhiệm Vụ Đúng Hạn */}
                    <div className="bg-white p-5 rounded-3xl border border-brand-border shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                          Nghiệm Thu Thực Địa
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-heading font-black text-brand-dark">
                          {kpi.taskCompletionRate}%
                        </div>
                        <p className="text-xs text-brand-muted mt-1">
                          Đã hoàn thành: <span className="font-bold text-indigo-700">{kpi.completedTasks}</span> / {kpi.totalTasks} việc
                        </p>
                      </div>
                      <div className="pt-2 border-t border-brand-border/60 flex items-center justify-between text-[11px]">
                        <span className="text-stone-500">{kpi.inProgressTasks} Đang làm • {kpi.pendingTasks} Chờ</span>
                        <span className="font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md">
                          ≥1 ảnh BR15
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Revenue Chart & Breakdown Section (Component 3 in SCR-AD-01) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Bar Chart (8 cols) */}
                    <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-7 border border-brand-border shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-border/60 pb-4">
                        <div>
                          <h3 className="font-heading font-black text-lg text-brand-dark flex items-center gap-2">
                            <Activity className="w-5 h-5 text-emerald-800" />
                            <span>Biểu Đồ Doanh Thu Theo Tháng</span>
                          </h3>
                          <p className="text-xs text-brand-muted mt-0.5">
                            Doanh thu thực nhận từ hợp đồng thuê đất (Lump-sum) và các dịch vụ chăm sóc phát sinh
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-emerald-700"></span>
                            <span className="font-medium text-stone-600">Thuê đất (Master Lease)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-amber-500"></span>
                            <span className="font-medium text-stone-600">Dịch vụ phát sinh</span>
                          </div>
                        </div>
                      </div>

                      <div className="w-full h-64 pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="monthLabel" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                            <YAxis
                              tick={{ fontSize: 11, fill: '#64748b' }}
                              axisLine={{ stroke: '#e2e8f0' }}
                              tickFormatter={(v) => `${(v / 1000000).toFixed(1)} tr`}
                            />
                            <RechartsTooltip content={<CustomRevenueTooltip />} />
                            <Bar dataKey="leaseRevenue" name="Thuê đất (Master Lease)" fill="#047857" radius={[6, 6, 0, 0]} maxBarSize={45} />
                            <Bar dataKey="serviceRevenue" name="Dịch vụ phát sinh" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={45} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Right: Revenue Composition (4 cols) */}
                    <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-7 border border-brand-border shadow-sm space-y-5">
                      <div className="border-b border-brand-border/60 pb-3">
                        <h3 className="font-heading font-black text-lg text-brand-dark flex items-center gap-2">
                          <PieChart className="w-5 h-5 text-amber-600" />
                          <span>Cơ Cấu Nguồn Thu</span>
                        </h3>
                        <p className="text-xs text-brand-muted mt-0.5">
                          Tỷ trọng giữa gói thuê đất và dịch vụ lẻ
                        </p>
                      </div>

                      <div className="space-y-4 text-xs">
                        {/* Progress 1: Master Lease */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-emerald-900 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                              Thuê Thửa Đất (Master Lease)
                            </span>
                            <span className="font-mono text-emerald-800">99.0%</span>
                          </div>
                          <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-600 h-full rounded-full" style={{ width: '99%' }}></div>
                          </div>
                          <div className="flex justify-between text-[11px] text-stone-500">
                            <span>Hợp đồng trọn gói 100% (BR09)</span>
                            <span className="font-bold text-stone-800">{formatVnd(kpi.leaseRevenue)}</span>
                          </div>
                        </div>

                        {/* Progress 2: A-la-carte Services */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-amber-900 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                              Dịch Vụ Phát Sinh (A-la-carte)
                            </span>
                            <span className="font-mono text-amber-800">1.0%</span>
                          </div>
                          <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full" style={{ width: '5%' }}></div>
                          </div>
                          <div className="flex justify-between text-[11px] text-stone-500">
                            <span>Services Master (BR27)</span>
                            <span className="font-bold text-stone-800">{formatVnd(kpi.serviceRevenue)}</span>
                          </div>
                        </div>

                        {/* Gateways Breakdown */}
                        <div className="pt-3 border-t border-brand-border/60 space-y-2">
                          <span className="font-bold text-stone-700 block uppercase tracking-wider text-[10px]">
                            Cổng Thanh Toán Tích Hợp
                          </span>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 space-y-0.5">
                              <span className="font-bold text-blue-900 block">VNPAY Sandbox</span>
                              <span className="text-stone-600">63.0% Thực thu</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100 space-y-0.5">
                              <span className="font-bold text-purple-900 block">VietQR 24/7</span>
                              <span className="text-stone-600">37.0% Thực thu</span>
                            </div>
                          </div>
                        </div>

                        {/* Note SSoT */}
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-stone-600 leading-relaxed">
                          💡 <span className="font-bold text-stone-800">Quy tắc BR09:</span> 100% tiền thuê đất được thanh toán trọn gói trước khi kích hoạt canh tác. Giữ chỗ 15 phút + 10 phút Grace Period (BR08).
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Transactions Table */}
                  <div className="bg-white rounded-3xl p-6 sm:p-7 border border-brand-border shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
                      <div>
                        <h3 className="font-heading font-black text-lg text-brand-dark flex items-center gap-2">
                          <Wallet className="w-5 h-5 text-emerald-800" />
                          <span>Nhật Ký Dòng Tiền & Giao Dịch Gần Nhất</span>
                        </h3>
                        <p className="text-xs text-brand-muted mt-0.5">
                          Dữ liệu đối soát thời gian thực từ bảng payment_transactions trong CSDL PostgreSQL
                        </p>
                      </div>
                      <span className="text-xs font-bold text-stone-600 bg-stone-100 px-3 py-1 rounded-full">
                        {recentTransactions.length} Giao dịch mới nhất
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-brand-border text-stone-500 font-bold uppercase tracking-wider text-[11px]">
                            <th className="pb-3 px-3">Mã GD</th>
                            <th className="pb-3 px-3">Khách Hàng / Hợp Đồng</th>
                            <th className="pb-3 px-3">Loại giao dịch</th>
                            <th className="pb-3 px-3">Cổng TT</th>
                            <th className="pb-3 px-3 text-right">Số Tiền</th>
                            <th className="pb-3 px-3">Thời Gian</th>
                            <th className="pb-3 px-3 text-center">Trạng Thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/60">
                          {recentTransactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-3 font-mono font-bold text-stone-800">
                                {tx.code}
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-bold text-stone-900">{tx.customerName}</div>
                                <div className="text-[11px] text-stone-500">{tx.referenceCode}</div>
                              </td>
                              <td className="py-3 px-3">
                                {tx.type === 'REFUND' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                    Hoàn tiền
                                  </span>
                                ) : tx.referenceCode && tx.referenceCode.startsWith('HD-') ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    Thuê đất (Master Lease)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                    Dịch vụ phát sinh
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                  tx.paymentMethod === 'VNPAY'
                                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                    : 'bg-purple-50 text-purple-800 border border-purple-200'
                                }`}>
                                  {tx.paymentMethod}
                                </span>
                              </td>
                              <td className={`py-3 px-3 text-right font-mono font-black text-sm ${tx.type === 'REFUND' ? 'text-rose-700' : 'text-stone-900'}`}>
                                {tx.type === 'REFUND' ? `-${formatVnd(tx.amount)}` : formatVnd(tx.amount)}
                              </td>
                              <td className="py-3 px-3 text-stone-500 whitespace-nowrap">
                                {tx.createdAt}
                              </td>
                              <td className="py-3 px-3 text-center whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  tx.status === 'SUCCESS'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {tx.status === 'SUCCESS' ? '✓ Thành công' : '⏳ Đang chờ'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Operational Quick Actions (Components from previous Overview) */}
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      <div
                        onClick={() => {
                          setActiveTab('dispatch');
                          setDispatchSubTab('expert_plots');
                          setPlotAssignFilter('UNASSIGNED');
                        }}
                        className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-2 cursor-pointer hover:bg-sky-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sky-900 flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-sky-700" />
                            <span>Đơn Thuê Chờ Giao</span>
                          </span>
                          <span className="px-2 py-0.5 rounded bg-sky-200 text-sky-900 font-bold text-[10px]">
                            {unassignedRentals.length} Chưa giao
                          </span>
                        </div>
                        <p className="text-stone-700 leading-relaxed">
                          Đơn thuê mới từ khách hàng cần Admin chỉ định cả CVLĐ chăm sóc thực địa và CGNN cố vấn kỹ thuật.
                        </p>
                      </div>

                      <div
                        onClick={() => {
                          setActiveTab('dispatch');
                          setDispatchSubTab('staff_tasks');
                        }}
                        className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2 cursor-pointer hover:bg-emerald-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                            <Wrench className="w-4 h-4 text-emerald-700" />
                            <span>Care Tasks CVLĐ</span>
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold text-[10px]">
                            {pendingStaffTasksCount} Chờ giao
                          </span>
                        </div>
                        <p className="text-stone-700 leading-relaxed">
                          Các nhiệm vụ tưới nước, bón phân vi sinh, nhổ cỏ xới đất cần phân công chuyên viên lao động phụ trách.
                        </p>
                      </div>

                      <div
                        onClick={() => {
                          setActiveTab('dispatch');
                          setDispatchSubTab('expert_issues');
                        }}
                        className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2 cursor-pointer hover:bg-rose-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-900 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-rose-700" />
                            <span>Sự Cố Cần Chuyên Gia</span>
                          </span>
                          <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-900 font-bold text-[10px]">
                            {pendingExpertIssuesCount} Sự cố
                          </span>
                        </div>
                        <p className="text-stone-700 leading-relaxed">
                          Các vấn đề sâu bệnh và vi khí hậu bất thường từ đồng ruộng cần chuyên gia nông nghiệp thẩm định phác đồ.
                        </p>
                      </div>

                      <div
                        onClick={() => setActiveTab('contracts')}
                        className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 cursor-pointer hover:bg-amber-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-900 flex items-center gap-1.5">
                            <RotateCcw className="w-4 h-4 text-amber-700" />
                            <span>Yêu Cầu Hoàn Cọc</span>
                          </span>
                          <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold text-[10px]">
                            {refundRequests.filter((r) => r.status === 'PENDING').length} Phiếu
                          </span>
                        </div>
                        <p className="text-stone-700 leading-relaxed">
                          Khách hàng yêu cầu hủy hợp đồng trước thời hạn canh tác. Hệ thống tính sẵn mức hoàn tiền theo chính sách.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Farm Occupancy Status */}
                  <div className="bg-white rounded-3xl p-6 sm:p-7 border border-brand-border shadow-sm space-y-4">
                    <h3 className="font-heading font-black text-lg text-brand-dark">
                      Tình Trạng Phân Bổ Quỹ Đất & Khai Thác
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                        <p className="font-bold text-emerald-900">Trang trại Happy Valley Củ Chi (TP.HCM)</p>
                        <p className="text-2xl font-black text-emerald-700">
                          {kpi.rentedPlots || landStats.rented} / {kpi.totalPlots || landStats.total || 17} Thửa Đang Thuê
                        </p>
                        <p className="text-stone-600">
                          Đất phù sa bồi lắng giàu mùn, đã lắp trạm quan trắc IoT vi khí hậu tự động.
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 space-y-1">
                        <p className="font-bold text-sky-900">Nông Trại Củ Chi Eco Farm (Vùng Mở Rộng)</p>
                        <p className="text-2xl font-black text-sky-700">12 / 16 Thửa Đang Thuê</p>
                        <p className="text-stone-600">
                          Quy hoạch canh tác dưa leo baby, ớt chuông và xà lách thủy canh VietGAP.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ========================================================================= */}
            {/* TAB 3: CONTRACTS & REFUND REQUESTS (UC08 / BR10)                          */}
            {/* ========================================================================= */}
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
                        <p>Khách hàng: <strong className="text-brand-dark">{req.customerName}</strong> ({req.customerPhone || 'Khách hàng'})</p>
                        <p>Thửa đất hủy: <strong className="text-brand-dark">{req.plotCode || '—'}</strong></p>
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

            {/* ========================================================================= */}
            {/* TAB 4: SITE VISIT BOOKINGS (SCR-PUB-05 / Table site_visits)               */}
            {/* ========================================================================= */}
            {activeTab === 'visits' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border/60 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-brand-green" />
                      <h3 className="font-heading font-black text-xl text-brand-dark">
                        Lịch Hẹn Tham Quan Nông Trại Thực Tế
                      </h3>
                    </div>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Dữ liệu kết nối trực tiếp bảng <strong>site_visits</strong> (Database Farmely).
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

            {/* ========================================================================= */}
            {/* TAB 5: USERS & RBAC (UC21)                                                */}
            {/* ========================================================================= */}
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
                              {u.roleLabel || u.role}
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
                              onClick={() => {
                                setSelectedUserToEdit(u);
                                setUserEditStatus(u.status || 'ACTIVE');
                              }}
                              className="text-brand-green hover:underline font-bold cursor-pointer"
                            >
                              Đổi trạng thái
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 6: IOT ALERTS, WEATHER & HARDWARE HEALTH (SCR-AD-08 / UC13 / BR18)   */}
            {/* ========================================================================= */}
            {activeTab === 'iot-alerts' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-6 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border/60 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Radio className="w-5 h-5 text-brand-green animate-pulse" />
                      <h3 className="font-heading font-black text-xl text-brand-dark">
                        Trạm Quan Trắc IoT, Thời Tiết &amp; Cảnh Báo Vi Khí Hậu (SCR-AD-08 / BR18)
                      </h3>
                    </div>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Theo dõi vi khí hậu thời gian thực 24/7, tự động phát hiện vượt ngưỡng an toàn thực vật và tự động điều tiết lịch tưới nước theo thời tiết.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSimulateAlert(1, 'HIGH_TEMPERATURE')}
                      className="text-xs font-bold gap-1.5 border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                      <span>Giả Lập Sốc Nhiệt</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={loadAdminData}
                      className="text-xs font-bold gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Đồng Bộ IoT</span>
                    </Button>
                  </div>
                </div>

                {/* IoT Key Performance Indicators */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1">
                    <p className="font-bold text-rose-900">Cảnh Báo Kích Hoạt</p>
                    <p className="text-2xl font-black text-rose-700">
                      {alertOverview.activeAlerts || iotAlerts.filter((a) => a.status === 'ACTIVE').length} Vụ
                    </p>
                    <p className="text-[11px] text-rose-800 font-medium">Vượt ngưỡng vi khí hậu</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
                    <p className="font-bold text-amber-900">Mức Độ Khẩn Cấp (Critical)</p>
                    <p className="text-2xl font-black text-amber-700">
                      {alertOverview.criticalAlerts || iotAlerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length} Vụ
                    </p>
                    <p className="text-[11px] text-amber-800 font-medium">Cần xử lý hiện trường ngay</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                    <p className="font-bold text-emerald-900">Trạm Cảm Biến Trực Tuyến</p>
                    <p className="text-2xl font-black text-emerald-700">16 / 16 Trạm</p>
                    <p className="text-[11px] text-emerald-800 font-medium">Kết nối 4G / LoRaWAN 100%</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-1">
                    <p className="font-bold text-sky-900">Điều Tiết Tưới BR18</p>
                    <p className="text-2xl font-black text-sky-700">
                      {weatherData?.wateringPostponementRecommended ? 'HOÃN TƯỚI' : 'BÌNH THƯỜNG'}
                    </p>
                    <p className="text-[11px] text-sky-800 font-medium">
                      {weatherData?.wateringPostponementRecommended ? 'Dự báo mưa chiều' : 'Thời tiết ổn định'}
                    </p>
                  </div>
                </div>

                {/* Weather & BR18 Watering Postponement Card */}
                {weatherData && (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-50 via-emerald-50 to-amber-50 border border-sky-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-sky-200/60">
                      <div className="flex items-center gap-2">
                        <CloudRain className="w-5 h-5 text-sky-700" />
                        <span className="font-heading font-black text-sm text-sky-950">
                          Quan Trắc Vi Khí Hậu &amp; Dự Báo Thời Tiết Nông Trại ({weatherData.locationName})
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-900 font-bold text-[10px] w-fit">
                        ● Cập nhật khí tượng tự động
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-white/80 border border-sky-100">
                        <span className="text-stone-400 block text-[11px]">Nhiệt độ hiện tại</span>
                        <strong className="text-base font-black text-stone-900">{weatherData.temperature}°C</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/80 border border-sky-100">
                        <span className="text-stone-400 block text-[11px]">Độ ẩm không khí</span>
                        <strong className="text-base font-black text-stone-900">{weatherData.humidity}%</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/80 border border-sky-100">
                        <span className="text-stone-400 block text-[11px]">Xác suất mưa</span>
                        <strong className="text-base font-black text-sky-700">{weatherData.rainfallProbability}%</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/80 border border-sky-100">
                        <span className="text-stone-400 block text-[11px]">Tốc độ gió</span>
                        <strong className="text-base font-black text-stone-900">{weatherData.windSpeed} km/h</strong>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-sky-900 text-white text-xs flex items-start gap-2.5">
                      <ShieldAlert className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-200 block mb-0.5">Quy tắc sinh học BR18: Tự động hoãn ca tưới khi độ ẩm đất &gt;= 80% hoặc xác suất mưa &gt;= 70%</strong>
                        <p className="text-white/90 leading-relaxed text-[11px]">
                          {weatherData.recommendationMessage}
                        </p>
                      </div>
                    </div>

                    {weatherData.forecastDays && weatherData.forecastDays.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                        {weatherData.forecastDays.map((f, idx) => (
                          <div key={idx} className="p-2 rounded-xl bg-white/90 border border-brand-border text-center text-[11px] space-y-0.5">
                            <span className="font-bold text-stone-700 block">{f.dayOfWeek}</span>
                            <span className="text-sky-700 font-bold block text-xs">{f.condition}</span>
                            <span className="text-stone-500 block text-[10px]">{f.minTemp}°C - {f.maxTemp}°C</span>
                            <span className="text-[10px] text-amber-700 font-semibold block">Mưa: {f.rainProb}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* IoT Alerts Filter & Table */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-heading font-black text-base text-brand-dark flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Danh Sách Cảnh Báo Ngưỡng Vi Khí Hậu Hiện Trường</span>
                    </h4>
                    <div className="flex items-center gap-1.5">
                      {[
                        { id: 'ALL', label: 'Tất cả' },
                        { id: 'ACTIVE', label: 'Đang kích hoạt' },
                        { id: 'ACKNOWLEDGED', label: 'Đã tiếp nhận' },
                        { id: 'RESOLVED', label: 'Đã đóng' }
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setAlertFilterStatus(f.id)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            alertFilterStatus === f.id
                              ? 'bg-brand-green text-white shadow-xs'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-brand-border/80">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-brand-border bg-brand-cream/60 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                          <th className="p-3">Mã Cảnh Báo</th>
                          <th className="p-3">Thửa Đất</th>
                          <th className="p-3">Chỉ Số &amp; Giá Trị Đo</th>
                          <th className="p-3">Mức Độ</th>
                          <th className="p-3">Mô Tả &amp; Khuyến Nghị Xử Lý</th>
                          <th className="p-3">Trạng Thái</th>
                          <th className="p-3 text-right">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border/60">
                        {iotAlerts
                          .filter((a) => alertFilterStatus === 'ALL' || a.status === alertFilterStatus)
                          .map((alert) => {
                            const isCrit = alert.severity === 'CRITICAL' || alert.severity === 'EMERGENCY';
                            const isActive = alert.status === 'ACTIVE';
                            const isAck = alert.status === 'ACKNOWLEDGED';
                            return (
                              <tr key={alert.alertId || alert.id} className="hover:bg-stone-50/70">
                                <td className="p-3 font-mono font-bold text-brand-green">
                                  {alert.alertCode || `ALT-${alert.alertId || alert.id}`}
                                </td>
                                <td className="p-3 font-bold text-brand-dark">
                                  {alert.plotCode || `P-0${alert.plotId || 1}`}
                                </td>
                                <td className="p-3">
                                  <div className="font-bold text-stone-800">{alert.metricName}</div>
                                  <div className="text-[11px] text-stone-500">
                                    Đo được: <span className="text-rose-700 font-bold">{alert.actualValue}</span> / Ngưỡng: {alert.thresholdValue}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      isCrit ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {alert.severity}
                                  </span>
                                </td>
                                <td className="p-3 max-w-sm">
                                  <p className="font-semibold text-stone-800">{alert.message}</p>
                                  <p className="text-[11px] text-emerald-800 font-medium mt-0.5 italic">
                                    Khuyến nghị: {alert.actionSuggested}
                                  </p>
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      isActive
                                        ? 'bg-rose-100 text-rose-800 animate-pulse'
                                        : isAck
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                  >
                                    {isActive ? 'Kích Hoạt' : isAck ? 'Đã Tiếp Nhận' : 'Đã Đóng'}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {isActive && (
                                      <button
                                        onClick={() => handleAcknowledgeAlert(alert.alertId || alert.id)}
                                        className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px]"
                                      >
                                        Tiếp nhận
                                      </button>
                                    )}
                                    {(isActive || isAck) && (
                                      <button
                                        onClick={() => handleResolveAlert(alert.alertId || alert.id)}
                                        className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px]"
                                      >
                                        Đóng cảnh báo
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* IoT Hardware Stations Status */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-heading font-black text-base text-brand-dark">
                    Trạng Thái Trạm Quan Trắc Thực Địa (Hardware Telemetry)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-brand-cream/60 border border-brand-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-brand-dark">Trạm IOT-P-01 (Thửa Sen Vàng A1)</span>
                        <span className="text-emerald-700 font-bold">● Online</span>
                      </div>
                      <p className="text-stone-600">Pin năng lượng mặt trời: 98% • Sóng: 4G LTE</p>
                      <p className="text-stone-500">Độ ẩm đất: 68% • Nhiệt độ: 28.5°C</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-brand-cream/60 border border-brand-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-brand-dark">Trạm IOT-P-02 (Thửa Mộc Châu B2)</span>
                        <span className="text-emerald-700 font-bold">● Online</span>
                      </div>
                      <p className="text-stone-600">Pin năng lượng mặt trời: 95% • Sóng: LoRaWAN</p>
                      <p className="text-stone-500">Độ ẩm đất: 62% • Nhiệt độ: 22.0°C</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-brand-cream/60 border border-brand-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-brand-dark">Trạm IOT-P-03 (Thửa Rừng Sác C3)</span>
                        <span className="text-emerald-700 font-bold">● Online</span>
                      </div>
                      <p className="text-stone-600">Pin năng lượng mặt trời: 100% • Sóng: 4G LTE</p>
                      <p className="text-stone-500">Độ ẩm đất: 72% • Nhiệt độ: 27.8°C</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 7: AUDIT LOGS & SYSTEM REPORTS (UC21 / SCR-AD-14)                     */}
            {/* ========================================================================= */}
            {activeTab === 'audit-logs' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border/60 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-brand-green" />
                      <h3 className="font-heading font-black text-xl text-brand-dark">
                        Nhật Ký Hoạt Động & Báo Cáo Hệ Thống (SCR-AD-14 / UC21)
                      </h3>
                    </div>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Ghi nhận vết kiểm toán mọi thao tác đăng nhập, phân quyền, giao dịch thanh toán và vòng đời hợp đồng.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-xl">
                      {auditLogs.length} Bản ghi
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={loadAdminData}
                      className="text-xs font-bold gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Làm mới</span>
                    </Button>
                  </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                    <p className="font-bold text-emerald-900">Tổng Hoạt Động</p>
                    <p className="text-2xl font-black text-emerald-700">{auditOverview.totalLogs || auditLogs.length}</p>
                    <p className="text-[11px] text-stone-500">Đã lưu trữ trong cơ sở dữ liệu</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-1">
                    <p className="font-bold text-sky-900">Lượt Đăng Nhập</p>
                    <p className="text-2xl font-black text-sky-700">{auditOverview.loginsCount || 0}</p>
                    <p className="text-[11px] text-stone-500">Xác thực người dùng toàn trang</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
                    <p className="font-bold text-amber-900">Khôi Phục Mật Khẩu</p>
                    <p className="text-2xl font-black text-amber-700">{auditOverview.passwordResetsCount || 0}</p>
                    <p className="text-[11px] text-stone-500">Yêu cầu qua email / token</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-1">
                    <p className="font-bold text-purple-900">Đổi Trạng Thái Tài Khoản</p>
                    <p className="text-2xl font-black text-purple-700">{auditOverview.roleChangesCount || 0}</p>
                    <p className="text-[11px] text-stone-500">Thao tác quản trị viên RBAC</p>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                    {[
                      { id: 'ALL', label: 'Tất cả' },
                      { id: 'LOGIN', label: 'Đăng nhập' },
                      { id: 'REGISTER', label: 'Đăng ký' },
                      { id: 'PASSWORD_RESET', label: 'Mật khẩu' },
                      { id: 'CHANGE_USER_STATUS', label: 'Trạng thái User' }
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setAuditFilterAction(f.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          auditFilterAction === f.id
                            ? 'bg-brand-green text-white shadow-xs'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Tìm email, thao tác, mô tả..."
                      value={auditSearchQuery}
                      onChange={(e) => setAuditSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-brand-border bg-stone-50 text-xs focus:outline-none focus:ring-1 focus:ring-brand-green"
                    />
                  </div>
                </div>

                {/* Audit Logs Table */}
                <div className="overflow-x-auto rounded-2xl border border-brand-border/80">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-brand-border bg-brand-cream/60 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3">Thời Gian</th>
                        <th className="p-3">Người Dùng</th>
                        <th className="p-3">Hành Động (Action)</th>
                        <th className="p-3">Đối Tượng (Entity)</th>
                        <th className="p-3">Chi Tiết Hoạt Động</th>
                        <th className="p-3">IP Address</th>
                        <th className="p-3 text-right">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/60">
                      {auditLogs
                        .filter((log) => {
                          const matchAction = auditFilterAction === 'ALL' || log.action === auditFilterAction;
                          const q = auditSearchQuery.trim().toLowerCase();
                          const matchQuery =
                            !q ||
                            (log.userEmail && log.userEmail.toLowerCase().includes(q)) ||
                            (log.description && log.description.toLowerCase().includes(q)) ||
                            (log.action && log.action.toLowerCase().includes(q)) ||
                            (log.entityType && log.entityType.toLowerCase().includes(q));
                          return matchAction && matchQuery;
                        })
                        .map((log) => {
                          const actionBadgeClass =
                            log.action === 'LOGIN'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : log.action === 'REGISTER'
                              ? 'bg-sky-50 text-sky-800 border-sky-200'
                              : log.action === 'PASSWORD_RESET' || log.action === 'FORGOT_PASSWORD'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : log.action === 'CHANGE_USER_STATUS'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : 'bg-stone-100 text-stone-700 border-stone-200';

                          return (
                            <tr key={log.logId} className="hover:bg-stone-50 transition-colors">
                              <td className="p-3 text-stone-500 whitespace-nowrap font-mono text-[11px]">
                                {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : '—'}
                              </td>
                              <td className="p-3">
                                <span className="font-bold text-brand-dark block">{log.userEmail || `User #${log.userId || 'System'}`}</span>
                                {log.userId && <span className="text-[10px] text-stone-400">ID: {log.userId}</span>}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${actionBadgeClass}`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-[11px] text-stone-600">
                                {log.entityType ? `${log.entityType}${log.entityId ? ` #${log.entityId}` : ''}` : '—'}
                              </td>
                              <td className="p-3 text-stone-700 max-w-xs truncate" title={log.description}>
                                {log.description || '—'}
                              </td>
                              <td className="p-3 font-mono text-[11px] text-stone-500">
                                {log.ipAddress || '127.0.0.1'}
                              </td>
                              <td className="p-3 text-right">
                                <span className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                                  log.status === 'SUCCESS' ? 'text-emerald-700' : 'text-rose-600'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                  {log.status === 'SUCCESS' ? 'Thành công' : 'Thất bại'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </section>
        </div>

      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: PHÂN CÔNG CVLĐ CHO YÊU CẦU DỊCH VỤ                              */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(selectedDispatchToAssign)}
        onClose={() => setSelectedDispatchToAssign(null)}
        title="Chỉ Định Chuyên Viên Lao Động Phụ Trách Dịch Vụ"
        subtitle={selectedDispatchToAssign?.serviceName}
      >
        {selectedDispatchToAssign && (
          <form onSubmit={handleConfirmAssignService} className="space-y-4 text-xs text-left">
            <div className="p-3.5 rounded-xl bg-brand-cream border border-brand-border space-y-1">
              <p><strong>Thửa đất:</strong> {selectedDispatchToAssign.plotName} ({selectedDispatchToAssign.plotCode})</p>
              <p><strong>Khách hàng:</strong> {selectedDispatchToAssign.customerName} {selectedDispatchToAssign.customerPhone && `(${selectedDispatchToAssign.customerPhone})`}</p>
              <p><strong>Dịch vụ yêu cầu:</strong> {selectedDispatchToAssign.serviceName}</p>
            </div>

            <div>
              <label className="block font-bold text-brand-dark mb-1">
                Chọn Chuyên Viên Lao Động (CVLĐ):
              </label>
              <select
                value={assignedWorkerId}
                onChange={(e) => {
                  setAssignedWorkerId(e.target.value);
                  const w = staffUsers.find((s) => String(s.id) === String(e.target.value));
                  if (w) setAssignedWorkerName(w.fullName);
                }}
                className="w-full p-2.5 rounded-xl border border-brand-border bg-white text-xs font-bold"
              >
                {staffUsers.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.fullName} ({account.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Ghi chú / Chỉ đạo thực hiện:
              </label>
              <textarea
                rows={2}
                value={serviceAssignNotes}
                onChange={(e) => setServiceAssignNotes(e.target.value)}
                placeholder="Ví dụ: Bón phân hữu cơ quanh tán, tưới sương nhẹ và chụp ảnh nghiệm thu..."
                className="w-full p-2.5 rounded-xl border border-stone-300 bg-white text-xs text-stone-800"
              />
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

      {/* ========================================================================= */}
      {/* MODAL 2: PHÂN CÔNG CVLĐ CHO CARE TASK (SCR-AD-07)                         */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(selectedCareTaskToAssign)}
        onClose={() => setSelectedCareTaskToAssign(null)}
        title="Giao Nhiệm Vụ Chăm Sóc Thực Địa Cho CVLĐ"
        subtitle={selectedCareTaskToAssign?.title}
      >
        {selectedCareTaskToAssign && (
          <form onSubmit={handleConfirmAssignCareTask} className="space-y-4 text-xs text-left">
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
              <p><strong>Nhiệm vụ:</strong> {selectedCareTaskToAssign.title}</p>
              <p><strong>Thửa đất:</strong> {selectedCareTaskToAssign.plotName} ({selectedCareTaskToAssign.plotCode}) • {selectedCareTaskToAssign.crop}</p>
              <p><strong>Khách thuê:</strong> {selectedCareTaskToAssign.customerName}</p>
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Chuyên Viên Lao Động Được Giao (CVLĐ):
              </label>
              <select
                value={taskAssignWorkerId}
                onChange={(e) => setTaskAssignWorkerId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-900"
              >
                {staffUsers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.fullName} ({worker.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Hạn chót hoàn tất (Due Date):
              </label>
              <input
                type="date"
                value={taskAssignDueDate}
                onChange={(e) => setTaskAssignDueDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 bg-white text-xs font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Hướng dẫn kỹ thuật / Yêu cầu hiện trường:
              </label>
              <textarea
                rows={2}
                value={taskAssignNotes}
                onChange={(e) => setTaskAssignNotes(e.target.value)}
                placeholder="Ví dụ: Kiểm tra ẩm độ đất trước khi tưới, chụp ảnh tán lá nghiệm thu..."
                className="w-full p-2.5 rounded-xl border border-stone-300 bg-white text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedCareTaskToAssign(null)}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" size="sm" className="font-bold bg-emerald-800 hover:bg-emerald-900 text-white">
                XÁC NHẬN PHÂN CÔNG
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: TẠO MỚI CARE TASK CHO THỬA ĐẤT                                   */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showCreateCareTaskModal}
        onClose={() => setShowCreateCareTaskModal(false)}
        title="Tạo & Giao Nhiệm Vụ Canh Tác Mới"
        subtitle="Giao việc trực tiếp ra hiện trường cho Chuyên Viên Lao Động (CVLĐ)"
      >
        <form onSubmit={handleCreateNewCareTask} className="space-y-4 text-xs text-left">
          <div>
            <label className="block font-bold text-stone-800 mb-1">
              Chọn Thửa Đất Canh Tác:
            </label>
            <select
              value={newTaskRentalId}
              onChange={(e) => setNewTaskRentalId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-900"
            >
              {rentals.map((r) => (
                <option key={r.rentalId} value={r.rentalId}>
                  {r.plotCode} ({r.name}) - {r.crop} (Khách: {r.renterName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-stone-800 mb-1">
              Tên Công Việc Cần Thực Hiện *:
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Nhổ cỏ dại rãnh luống, Bón vi sinh đợt 2, Bấm tỉa cành..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-stone-300 bg-white text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Giao Cho CVLĐ:
              </label>
              <select
                value={newTaskWorkerId}
                onChange={(e) => setNewTaskWorkerId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-900"
              >
                {staffUsers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Hạn Chót:
              </label>
              <input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 bg-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-800 mb-1">
              Ghi Chú Kỹ Thuật / Yêu Cầu Chụp Ảnh:
            </label>
            <textarea
              rows={2}
              value={newTaskNotes}
              onChange={(e) => setNewTaskNotes(e.target.value)}
              placeholder="Chụp 01 ảnh nghiệm thu hiện trường sau khi hoàn thành công việc."
              className="w-full p-2.5 rounded-xl border border-stone-300 bg-white text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateCareTaskModal(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold bg-emerald-800 hover:bg-emerald-900 text-white">
              TẠO & PHÁT LỆNH GIAO VIỆC
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: PHÂN CÔNG NHÂN SỰ THỬA ĐẤT (STAFF & EXPERT - BR14 & BR24)        */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(selectedRentalToAssignPersonnel)}
        onClose={() => setSelectedRentalToAssignPersonnel(null)}
        title="Phân Công Nhân Sự Phụ Trách Thửa Đất (Staff & Expert)"
        subtitle={selectedRentalToAssignPersonnel?.name}
      >
        {selectedRentalToAssignPersonnel && (
          <form onSubmit={handleConfirmAssignPlotPersonnel} className="space-y-4 text-xs text-left">
            <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 space-y-1">
              <p><strong>Thửa đất:</strong> {selectedRentalToAssignPersonnel.name} ({selectedRentalToAssignPersonnel.plotCode})</p>
              <p><strong>Cây trồng:</strong> {selectedRentalToAssignPersonnel.crop} • Diện tích: {selectedRentalToAssignPersonnel.area}</p>
              <p><strong>Khách thuê:</strong> {selectedRentalToAssignPersonnel.renterName} ({selectedRentalToAssignPersonnel.contractCode})</p>
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">
                1. Chuyên Viên Lao Động (CVLĐ / Staff) - Thực Thi Hiện Trường:
              </label>
              <select
                value={rentalAssignStaffId}
                onChange={(e) => setRentalAssignStaffId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-900"
              >
                {staffUsers.map((stf) => (
                  <option key={stf.id} value={stf.id}>
                    {stf.fullName} ({stf.email})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-stone-500 mt-1">
                Nhân sự chịu trách nhiệm trực tiếp chăm sóc cây trồng, tưới tiêu, bón phân và báo cáo sản lượng thu hoạch tại hiện trường thửa đất.
              </p>
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">
                2. Chuyên Gia Nông Nghiệp (CGNN / Expert) - Cố Vấn Kỹ Thuật:
              </label>
              <select
                value={rentalAssignExpertId}
                onChange={(e) => setRentalAssignExpertId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-900"
              >
                {expertUsers.map((exp) => (
                  <option key={exp.id} value={exp.id}>
                    {exp.fullName} ({exp.email})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-stone-500 mt-1">
                Chuyên gia có toàn quyền theo dõi trạm IoT vi khí hậu, nhật ký canh tác và trực tiếp tư vấn 1-1 cho khách hàng.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedRentalToAssignPersonnel(null)}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" size="sm" className="font-bold bg-sky-700 hover:bg-sky-800 text-white">
                XÁC NHẬN PHÂN CÔNG THỬA ĐẤT
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: PHÂN CÔNG CHUYÊN GIA XỬ LÝ SỰ CỐ NÔNG HỌC (UC12)                 */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(selectedIssueToAssignExpert)}
        onClose={() => setSelectedIssueToAssignExpert(null)}
        title="Giao Sự Cố Nông Học Cho Chuyên Gia Thẩm Định"
        subtitle={selectedIssueToAssignExpert?.issueType}
      >
        {selectedIssueToAssignExpert && (
          <form onSubmit={handleConfirmAssignExpertToIssue} className="space-y-4 text-xs text-left">
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
              <p><strong>Sự cố:</strong> {selectedIssueToAssignExpert.issueType}</p>
              <p><strong>Thửa đất:</strong> {selectedIssueToAssignExpert.plotName} ({selectedIssueToAssignExpert.plotCode})</p>
              <p><strong>Người phát hiện:</strong> {selectedIssueToAssignExpert.workerName}</p>
              <p><strong>Mô tả:</strong> "{selectedIssueToAssignExpert.description}"</p>
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Chọn Chuyên Gia Nông Nghiệp Thẩm Định & Chỉ Đạo:
              </label>
              <select
                value={issueAssignExpertId}
                onChange={(e) => setIssueAssignExpertId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-900"
              >
                {expertUsers.map((exp) => (
                  <option key={exp.id} value={exp.id}>
                    {exp.fullName} ({exp.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Chỉ đạo của Quản Trị Viên (Ghi chú kèm theo):
              </label>
              <textarea
                rows={2}
                value={issueAssignNotes}
                onChange={(e) => setIssueAssignNotes(e.target.value)}
                placeholder="Ví dụ: Ưu tiên chẩn đoán trước 15:00 để thợ chuẩn bị pha chế phẩm sinh học..."
                className="w-full p-2.5 rounded-xl border border-stone-300 bg-white text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedIssueToAssignExpert(null)}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" size="sm" className="font-bold bg-rose-700 hover:bg-rose-800 text-white">
                GIAO CHUYÊN GIA XỬ LÝ
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 6: CẬP NHẬT TRẠNG THÁI NGƯỜI DÙNG (UC21 / SCR-AD-12)                 */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(selectedUserToEdit)}
        onClose={() => setSelectedUserToEdit(null)}
        title="Quản Trị Trạng Thái Tài Khoản"
        subtitle={selectedUserToEdit?.fullName}
      >
        {selectedUserToEdit && (
          <form onSubmit={handleUpdateUserStatus} className="space-y-4 text-xs text-left">
            <div className="p-3.5 rounded-xl bg-brand-cream/60 border border-brand-border space-y-1">
              <p><strong>Họ và tên:</strong> {selectedUserToEdit.fullName}</p>
              <p><strong>Email:</strong> {selectedUserToEdit.email}</p>
              <p><strong>Vai trò:</strong> {selectedUserToEdit.roleLabel || selectedUserToEdit.role}</p>
              <p><strong>Trạng thái hiện tại:</strong> <span className="font-bold text-brand-dark">{selectedUserToEdit.status}</span></p>
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Chọn trạng thái tài khoản:
              </label>
              <select
                value={userEditStatus}
                onChange={(e) => setUserEditStatus(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-900"
              >
                <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                <option value="INACTIVE">Vô hiệu hóa (INACTIVE)</option>
                <option value="BLOCKED">Khóa tài khoản (BLOCKED)</option>
              </select>
              <p className="text-[11px] text-stone-500 mt-1">
                Lưu ý: Mọi thay đổi trạng thái sẽ tự động được ghi lại vào Nhật Ký Hệ Thống (Audit Log).
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedUserToEdit(null)}>
                Hủy
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isUpdatingUser}
                className="font-bold bg-brand-green hover:bg-[#203c2c] text-white"
              >
                {isUpdatingUser ? 'Đang cập nhật...' : 'Lưu Thay Đổi'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <div className={`transition-[margin] duration-200 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'}`}>
        <Footer />
      </div>
    </div>
  );
}
