import React, { useState, useEffect, useMemo } from 'react';
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
  BriefcaseBusiness,
  PlusCircle,
  Wrench,
  Leaf,
  Thermometer,
  Droplets,
  ExternalLink
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

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('dispatch'); // Default to 'dispatch' as requested
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
    try {
      const [
        requestPayload,
        cancellationPayload,
        userPayload,
        plotPayload,
        rentalPayload,
        careTaskPayload,
        issuePayload
      ] = await Promise.all([
        apiFetch('/api/services/requests').catch(() => ({ data: [] })),
        apiFetch('/api/contracts/cancellations').catch(() => ({ data: [] })),
        apiFetch('/api/users').catch(() => ({ data: [] })),
        apiFetch('/api/plots').catch(() => ({ data: [] })),
        apiFetch('/api/rentals').catch(() => ({ data: [] })),
        apiFetch('/api/care-tasks').catch(() => ({ data: [] })),
        apiFetch('/api/issue-reports').catch(() => ({ data: [] }))
      ]);

      const requests = unwrapData(requestPayload) || [];
      const cancellations = unwrapData(cancellationPayload) || [];
      const users = unwrapData(userPayload) || [];
      const plots = unwrapData(plotPayload) || [];
      const rentalsData = unwrapData(rentalPayload) || [];
      const tasksData = unwrapData(careTaskPayload) || [];
      const issuesData = unwrapData(issuePayload) || [];

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
          customerPhone: '',
          plotCode: '',
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

      setDataError('');
    } catch (error) {
      console.warn('Lỗi nạp dữ liệu Admin:', error);
      setDataError('Không thể đồng bộ toàn bộ dữ liệu quản trị.');
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
      await apiFetch(`/api/services/requests/${selectedDispatchToAssign.id}/assign`, {
        method: 'PUT',
        body: JSON.stringify({
          workerId: targetWorkerId,
          scheduledDate: selectedDispatchToAssign.requestedDate || null,
          notes: serviceAssignNotes || selectedDispatchToAssign.note || 'Thực hiện dịch vụ theo chỉ định của Quản trị viên'
        })
      });
      triggerSuccessToast(`Đã phân công thành công dịch vụ #${selectedDispatchToAssign.id} cho chuyên viên lao động!`);
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
      const taskId = selectedCareTaskToAssign.taskId || selectedCareTaskToAssign.id;
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
      const rentalId = selectedRentalToAssignPersonnel.rentalId || selectedRentalToAssignPersonnel.id;
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
      const issueId = selectedIssueToAssignExpert.issueId || selectedIssueToAssignExpert.id;
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
              { id: 'dispatch', label: 'Điều Phối Nhân Sự', icon: UserCheck, count: totalDispatchPendingCount },
              { id: 'overview', label: 'Tổng Quan Hoạt Động', icon: Activity, count: null },
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
                    <span>👷 Care Tasks Thực Địa (CVLĐ)</span>
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
                    <span>📋 Yêu Cầu Dịch Vụ Khách (CVLĐ)</span>
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
                    <span>🏡 Phân Công Thửa Đất (CVLĐ & CGNN)</span>
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
                    <span>🚨 Sự Cố Nông Học Cần Thẩm Định (CGNN)</span>
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
                        <span className="text-stone-500 font-bold mr-1">Lọc trạng thái:</span>
                        {[
                          { id: 'ALL', label: 'Tất cả' },
                          { id: 'PENDING', label: 'Chờ giao việc' },
                          { id: 'IN_PROGRESS', label: 'Đang thực hiện' },
                          { id: 'COMPLETED', label: 'Đã hoàn thành' }
                        ].map((flt) => (
                          <button
                            key={flt.id}
                            type="button"
                            onClick={() => setCareTaskFilter(flt.id)}
                            className={`px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                              careTaskFilter === flt.id
                                ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                            }`}
                          >
                            {flt.label}
                          </button>
                        ))}
                      </div>

                      <span className="text-stone-500 font-medium">
                        Hiển thị <strong>{displayedCareTasks.length}</strong> / {careTasks.length} nhiệm vụ
                      </span>
                    </div>

                    {/* Task Cards List */}
                    <div className="space-y-3">
                      {displayedCareTasks.length === 0 ? (
                        <div className="text-center py-12 text-stone-500 space-y-2">
                          <CheckCircle2 className="w-10 h-10 mx-auto text-stone-300" />
                          <p className="font-bold text-sm">Không có nhiệm vụ nào trong trạng thái này</p>
                        </div>
                      ) : (
                        displayedCareTasks.map((task) => (
                          <div
                            key={task.id}
                            className="p-4 sm:p-5 rounded-2xl border border-brand-border bg-white hover:border-emerald-300 transition-all shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                          >
                            <div className="space-y-2 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono font-bold text-brand-green text-sm">{task.id}</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-stone-100 text-stone-700">
                                  {task.plotCode}
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  task.status === 'COMPLETED'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : task.status === 'IN_PROGRESS'
                                    ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}>
                                  {task.status === 'COMPLETED' ? '✓ Đã hoàn thành' : task.status === 'IN_PROGRESS' ? '⏳ Đang làm' : '● Chờ giao'}
                                </span>
                                {task.dueDate && (
                                  <span className="text-stone-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-stone-400" />
                                    <span>Hạn chót: {task.dueDate}</span>
                                  </span>
                                )}
                              </div>

                              <div>
                                <h4 className="font-bold text-brand-dark text-sm sm:text-base">{task.title}</h4>
                                <p className="text-stone-600 mt-0.5">
                                  {task.plotName} • Cây trồng: <strong className="text-emerald-800">{task.crop}</strong> • Khách thuê: <strong>{task.customerName}</strong>
                                </p>
                              </div>

                              {task.instructions && (
                                <p className="text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 leading-relaxed">
                                  <strong>Chỉ đạo:</strong> {task.instructions}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col md:items-end justify-between gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-brand-border/60">
                              <div className="text-left md:text-right">
                                <span className="text-[11px] text-stone-500 block">CVLĐ Phụ Trách:</span>
                                <span className={`font-bold text-sm block ${
                                  String(task.assignedTo).includes('Chưa') ? 'text-amber-700' : 'text-emerald-800'
                                }`}>
                                  {task.assignedTo}
                                </span>
                              </div>

                              <Button
                                variant={task.status === 'PENDING' || String(task.assignedTo).includes('Chưa') ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => {
                                  setSelectedCareTaskToAssign(task);
                                  setTaskAssignWorkerId(task.workerId || (staffUsers[0] ? staffUsers[0].id : 8));
                                  setTaskAssignDueDate(task.dueDate || '');
                                  setTaskAssignNotes(task.instructions || '');
                                }}
                                className="font-bold text-xs"
                              >
                                {String(task.assignedTo).includes('Chưa') ? 'Giao nhân viên' : 'Đổi nhân sự'}
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* SUB-TAB 2: YÊU CẦU DỊCH VỤ PHÁT SINH (CVLĐ - SCR-AD-08)                   */}
                {/* ========================================================================= */}
                {dispatchSubTab === 'staff_services' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-stone-500">
                      <span>Các yêu cầu dịch vụ chăm sóc do khách thuê đất đặt mua thêm (cắt tỉa, bón phân, tưới nước bổ sung).</span>
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        {serviceDispatches.filter(d => d.status === 'PENDING').length} Đơn Cần Giao Việc
                      </span>
                    </div>

                    <div className="space-y-3">
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
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                {disp.status === 'PENDING' ? 'Chưa chỉ định công nhân' : 'Đã phân công'}
                              </span>
                              {disp.requestedDate && <span className="text-stone-400">• Ngày thực hiện: {disp.requestedDate}</span>}
                            </div>

                            <h4 className="font-bold text-brand-dark text-sm sm:text-base">{disp.serviceName}</h4>
                            <p className="text-stone-600">
                              Thửa đất: <strong className="text-brand-dark">{disp.plotName} ({disp.plotCode})</strong> • Khách hàng: <strong>{disp.customerName}</strong> {disp.customerPhone && `(${disp.customerPhone})`}
                            </p>
                            {disp.note && (
                              <p className="text-stone-500 italic bg-white/70 p-2 rounded-lg border border-brand-border/40">
                                Ghi chú: "{disp.note}"
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col md:items-end justify-between gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-brand-border/60">
                            <div className="text-left md:text-right">
                              <span className="font-heading font-black text-brand-green text-base block">{disp.price}</span>
                              <span className="text-[11px] text-stone-500">Phụ trách: <strong>{disp.assignedWorker}</strong></span>
                            </div>

                            <Button
                              variant={disp.status === 'PENDING' ? 'primary' : 'outline'}
                              size="sm"
                              onClick={() => {
                                setSelectedDispatchToAssign(disp);
                                setAssignedWorkerId(disp.assignedWorkerId || (staffUsers[0] ? staffUsers[0].id : 8));
                                setServiceAssignNotes(disp.note || '');
                              }}
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

                {/* ========================================================================= */}
                {/* SUB-TAB 3: PHÂN CÔNG THỬA ĐẤT CANH TÁC (CVLĐ & CGNN - BR14 & BR24)        */}
                {/* ========================================================================= */}
                {dispatchSubTab === 'expert_plots' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-stone-700 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      <div className="flex items-start sm:items-center gap-2.5">
                        <Users className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
                        <div>
                          <span className="font-bold text-amber-950 block sm:inline">Quy trình phân công theo đơn thuê của khách: </span>
                          <span className="text-stone-700">Khi khách hàng thuê thửa đất, Admin cần chỉ định cả <strong>CVLĐ</strong> (chăm sóc thực địa) và <strong>CGNN</strong> (giám sát kỹ thuật & trạm IoT) cho khách hàng đó.</span>
                        </div>
                      </div>

                      {/* Filter Chips */}
                      <div className="flex items-center gap-1.5 shrink-0 self-start md:self-auto bg-white/80 p-1 rounded-xl border border-amber-200/80">
                        <button
                          type="button"
                          onClick={() => setPlotAssignFilter('ALL')}
                          className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
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
                          className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                            plotAssignFilter === 'UNASSIGNED'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-amber-800 hover:text-amber-950'
                          }`}
                        >
                          ⚠️ Chưa phân công ({unassignedRentals.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setPlotAssignFilter('ASSIGNED')}
                          className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                            plotAssignFilter === 'ASSIGNED'
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'text-emerald-800 hover:text-emerald-950'
                          }`}
                        >
                          ✅ Đã đủ ({fullyAssignedRentals.length})
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-stone-500">
                      <span>Hiển thị danh sách {displayedRentals.length} thửa đất đang canh tác theo hợp đồng khách thuê:</span>
                      <span className="font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
                        {unassignedRentals.length > 0 ? `Cần giao: ${unassignedRentals.length} thửa` : 'Đã phân công toàn bộ'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {displayedRentals.length === 0 ? (
                        <div className="text-center py-10 text-stone-500 bg-stone-50 rounded-2xl border border-dashed border-stone-300">
                          <p className="font-bold text-sm">Không có thửa đất nào trong bộ lọc này.</p>
                        </div>
                      ) : (
                        displayedRentals.map((rental) => (
                        <div
                          key={rental.id}
                          className="p-5 rounded-2xl border border-brand-border bg-white hover:border-sky-300 transition-all shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                        >
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-bold text-sky-800 text-sm">{rental.plotCode}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700">
                                {rental.name}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {rental.contractCode}
                              </span>
                              <span className="text-stone-400">• {rental.location} ({rental.area})</span>
                            </div>

                            <div>
                              <h4 className="font-bold text-brand-dark text-sm sm:text-base">
                                Cây trồng: <span className="text-emerald-800">{rental.crop}</span>
                              </h4>
                              <p className="text-stone-600 mt-0.5">
                                Khách thuê: <strong>{rental.renterName}</strong> ({rental.renterEmail || 'Khách hàng'}) • Giai đoạn: <strong>{rental.stage}</strong>
                              </p>
                            </div>

                            {/* Telemetry info */}
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-600 pt-1">
                              <span className="flex items-center gap-1 font-semibold text-stone-700">
                                <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                                <span>{rental.temp}</span>
                              </span>
                              <span className="flex items-center gap-1 font-semibold text-stone-700">
                                <Droplets className="w-3.5 h-3.5 text-sky-600" />
                                <span>Ẩm độ đất: {rental.soilMoisture}</span>
                              </span>
                              <span className="text-emerald-700 font-bold">
                                ● {rental.healthStatus === 'HEALTHY' ? 'Cây phát triển tốt' : 'Cần chú ý'}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col md:items-end justify-between gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-brand-border/60">
                            <div className="text-left md:text-right space-y-1">
                              <div>
                                <span className="text-[10px] text-stone-400 uppercase font-bold block">👷 CVLĐ Hiện Trường:</span>
                                <span className={`font-bold text-xs block ${
                                  String(rental.staffName).includes('Chưa') ? 'text-amber-700' : 'text-emerald-800'
                                }`}>
                                  {rental.staffName}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-stone-400 uppercase font-bold block">🔬 CGNN Giám Sát:</span>
                                <span className={`font-bold text-xs block ${
                                  String(rental.expertName).includes('Chưa') ? 'text-amber-700' : 'text-sky-800'
                                }`}>
                                  {rental.expertName}
                                </span>
                              </div>
                            </div>

                            <Button
                              variant={String(rental.expertName).includes('Chưa') || String(rental.staffName).includes('Chưa') ? 'primary' : 'outline'}
                              size="sm"
                              onClick={() => {
                                setSelectedRentalToAssignPersonnel(rental);
                                setRentalAssignExpertId(rental.expertId || (expertUsers[0] ? expertUsers[0].id : 5));
                                setRentalAssignStaffId(rental.staffId || (staffUsers[0] ? staffUsers[0].id : 8));
                              }}
                              className="font-bold text-xs"
                            >
                              {String(rental.expertName).includes('Chưa') || String(rental.staffName).includes('Chưa') ? 'Phân Công Nhân Sự' : 'Đổi Nhân Sự'}
                            </Button>
                          </div>
                        </div>
                      )))}
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* SUB-TAB 4: SỰ CỐ NÔNG HỌC CẦN THẨM ĐỊNH (CGNN - UC12)                     */}
                {/* ========================================================================= */}
                {dispatchSubTab === 'expert_issues' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-stone-500">
                      <span>Báo cáo sâu bệnh, vi khí hậu hoặc sự cố thực địa do CVLĐ gửi về cần Chuyên Gia Nông Nghiệp chẩn đoán.</span>
                      <span className="font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                        {pendingExpertIssuesCount} Sự Cố Chờ Thẩm Định
                      </span>
                    </div>

                    <div className="space-y-3">
                      {fieldIssues.length === 0 ? (
                        <div className="text-center py-12 text-stone-500 space-y-2">
                          <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
                          <p className="font-bold text-sm">Hiện trường an toàn, không có sự cố nào</p>
                        </div>
                      ) : (
                        fieldIssues.map((issue) => (
                          <div
                            key={issue.id}
                            className="p-5 rounded-2xl border border-brand-border bg-white hover:border-rose-300 transition-all shadow-2xs flex flex-col md:flex-row md:items-start justify-between gap-4 text-xs"
                          >
                            <div className="space-y-2 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono font-bold text-rose-700 text-sm">{issue.id}</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-100 text-stone-700">
                                  {issue.plotCode}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  issue.urgency === 'HIGH' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}>
                                  {issue.urgency === 'HIGH' ? '🚨 KHẨN CẤP' : '⚠️ Bình thường'}
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  issue.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {issue.status === 'RESOLVED' ? '✓ Đã chẩn đoán' : 'Chờ xử lý'}
                                </span>
                              </div>

                              <div>
                                <h4 className="font-bold text-brand-dark text-sm sm:text-base">{issue.issueType}</h4>
                                <p className="text-stone-600 mt-0.5">
                                  Thửa đất: <strong className="text-brand-dark">{issue.plotName}</strong> • Người báo: <strong>{issue.workerName}</strong> {issue.reportedTime && `(${issue.reportedTime})`}
                                </p>
                              </div>

                              <p className="text-stone-600 bg-rose-50/60 p-3 rounded-xl border border-rose-200/80 leading-relaxed">
                                <strong>Mô tả hiện trường:</strong> {issue.description}
                              </p>

                              {issue.diagnosis && (
                                <p className="text-emerald-900 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 leading-relaxed">
                                  <strong>Chỉ đạo của Chuyên gia:</strong> {issue.diagnosis}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col md:items-end justify-between gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-brand-border/60">
                              <div className="text-left md:text-right">
                                <span className="text-[11px] text-stone-500 block">Chuyên Gia Phụ Trách:</span>
                                <span className={`font-bold text-sm block ${
                                  String(issue.expertName).includes('Chưa') ? 'text-amber-700' : 'text-emerald-800'
                                }`}>
                                  {issue.expertName}
                                </span>
                              </div>

                              <Button
                                variant={String(issue.expertName).includes('Chưa') ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => {
                                  setSelectedIssueToAssignExpert(issue);
                                  setIssueAssignExpertId(issue.expertId || (expertUsers[0] ? expertUsers[0].id : 5));
                                  setIssueAssignNotes('');
                                }}
                                className="font-bold text-xs"
                              >
                                {String(issue.expertName).includes('Chưa') ? 'Giao Chuyên gia' : 'Đổi Chuyên gia'}
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 1: OVERVIEW                                                           */}
            {/* ========================================================================= */}
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
                          {refundRequests.filter(r => r.status === 'PENDING').length} Phiếu
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
                      <p className="text-2xl font-black text-emerald-700">{landStats.rented} / {landStats.total || 16} Thửa Đang Thuê</p>
                      <p className="text-stone-600">Đất phù sa bồi lắng giàu mùn, đã lắp trạm quan trắc IoT vi khí hậu tự động.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 space-y-1">
                      <p className="font-bold text-sky-900">Nông Trại Củ Chi Eco Farm (Vùng Mở Rộng)</p>
                      <p className="text-2xl font-black text-sky-700">12 / 16 Thửa Đang Thuê</p>
                      <p className="text-stone-600">Quy hoạch canh tác dưa leo baby, ớt chuông và xà lách thủy canh VietGAP.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                        <p>Thửa đất hủy: <strong className="text-brand-dark">{req.plotCode || 'P-01'}</strong></p>
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

            {/* ========================================================================= */}
            {/* TAB 6: IOT ALERTS & HARDWARE HEALTH                                       */}
            {/* ========================================================================= */}
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
                      <span className="font-bold text-brand-dark">Trạm IOT-P-01</span>
                      <span className="text-emerald-700 font-bold">● Online</span>
                    </div>
                    <p className="text-stone-600">Thửa Sen Vàng A1 • Pin: 98% (Solar)</p>
                    <p className="text-stone-500">Độ ẩm đất: 68% • Nhiệt độ: 28.5°C</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-brand-cream/60 border border-brand-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-brand-dark">Trạm IOT-P-02</span>
                      <span className="text-emerald-700 font-bold">● Online</span>
                    </div>
                    <p className="text-stone-600">Thửa Mộc Châu B2 • Pin: 95% (Solar)</p>
                    <p className="text-stone-500">Độ ẩm đất: 62% • Nhiệt độ: 22.0°C</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-brand-cream/60 border border-brand-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-brand-dark">Trạm IOT-P-03</span>
                      <span className="text-emerald-700 font-bold">● Online</span>
                    </div>
                    <p className="text-stone-600">Thửa Rừng Sác C3 • Pin: 100%</p>
                    <p className="text-stone-500">Độ ẩm đất: 72% • Nhiệt độ: 27.8°C</p>
                  </div>
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

      <div className={`transition-[margin] duration-200 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'}`}>
        <Footer />
      </div>
    </div>
  );
}
