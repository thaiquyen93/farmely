import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import { useAuthStore } from '../../stores/authStore';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import DashboardRail from '../../components/dashboard/DashboardRail';
import { useRealtimeChat } from '../../hooks/useRealtimeChat';
import { getSafeAvatar } from '../../api/communication/chatStorage';
import { apiFetch, unwrapData } from '../../api/apiClient';
import {
  Sprout,
  Wheat,
  SlidersHorizontal,
  FileSpreadsheet,
  MessageSquare,
  AlertTriangle,
  Radio,
  BookOpen,
  Send,
  Eye,
  CheckCircle2,
  Calendar,
  Layers,
  Thermometer,
  Droplets,
  Activity,
  ShieldCheck,
  UserCheck,
  Zap,
  Bot,
  Camera,
  Flame,
  Clock,
  Search,
  Image as ImageIcon,
  Paperclip,
  Sparkles,
  X,
  ChevronRight,
  ZoomIn,
  Info,
  Maximize2,
  Filter,
  ArrowLeft,
  Smile,
  Leaf,
  ExternalLink,
  Trash2,
  Plus,
  MapPin,
  Phone,
  FileText
} from 'lucide-react';

// SSoT danh mục giống canh tác chuẩn theo từng thửa đất tại Happy Valley
const DEFAULT_PLOT_CROPS = {
  'P-01': 'Cà chua bi đỏ F1',
  'P-02': 'Xà lách Romaine VietGAP',
  'P-03': 'Dưa leo baby F1',
  'P-04': 'Cà chua bi đỏ F1',
  'P-05': 'Cải ngọt bông F1',
  'P-06': 'Xà lách xoăn Lollo Bionda',
  'P-07': 'Dưa leo baby F1',
  'P-08': 'Cải ngọt bông F1',
  'P-09': 'Xà lách Romaine VietGAP',
  'P-10': 'Cà chua bi đỏ F1',
  'P-11': 'Dưa leo baby F1',
  'P-12': 'Cà chua bi đỏ F1',
  'P-13': 'Cải ngọt bông F1',
  'P-14': 'Cà chua bi đỏ F1',
  'P-15': 'Cải ngọt bông F1',
  'P-16': 'Xà lách Romaine VietGAP'
};

const DEFAULT_HARVEST_REQUESTS = [
  {
    id: 'HARV-REQ-001',
    plotCode: 'P-01',
    plotName: 'Thửa P-01',
    crop: 'Cà chua bi đỏ F1',
    renterName: 'Lô Thái Quyền',
    renterEmail: 'customer@farmely.vn',
    phone: '0901234567',
    address: '123 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP.HCM',
    requestedDate: '2026-10-23',
    method: 'DELIVERY',
    methodLabel: 'Farmely thu hoạch & giao tận nhà (trong 24h)',
    expectedYield: '12.0 kg',
    phiDays: 6,
    phiStandardDays: 5,
    status: 'PENDING',
    notes: 'Nhờ kỹ sư kiểm tra độ chín đồng đều của các chùm quả trước khi cho cắt.',
    createdAt: '2026-10-22T08:30:00Z',
    workerName: 'Trần Văn Lực (CVLĐ)'
  },
  {
    id: 'HARV-REQ-002',
    plotCode: 'P-02',
    plotName: 'Thửa P-02',
    crop: 'Xà lách Romaine VietGAP',
    renterName: 'Đào Duy Anh',
    renterEmail: 'duyanh@farmely.vn',
    phone: '0912345678',
    address: '',
    requestedDate: '2026-10-25',
    method: 'FARM_PICKUP',
    methodLabel: 'Khách đến nông trại tự thu hoạch & trải nghiệm',
    expectedYield: '8.5 kg',
    phiDays: 5,
    phiStandardDays: 5,
    status: 'APPROVED',
    notes: 'Khách đăng ký xuống nông trại Happy Valley vào sáng thứ Bảy.',
    createdAt: '2026-10-21T14:15:00Z',
    workerName: 'Trần Văn Lực (CVLĐ)',
    approvedAt: '2026-10-22T09:00:00Z'
  },
  {
    id: 'HARV-REQ-003',
    plotCode: 'P-03',
    plotName: 'Thửa P-03',
    crop: 'Dưa leo baby F1',
    renterName: 'Tạ Nguyễn Khôi Nguyên',
    renterEmail: 'tanguyen@farmely.vn',
    phone: '0934567890',
    address: '456 Lê Duẩn, Quận 1, TP.HCM',
    requestedDate: '2026-10-10',
    method: 'DELIVERY',
    methodLabel: 'Farmely thu hoạch & giao tận nhà',
    expectedYield: '30.0 kg',
    actualYield: '32.5 kg',
    phiDays: 7,
    phiStandardDays: 5,
    status: 'COMPLETED',
    notes: 'Đã hoàn tất nghiệm thu và giao hàng tươi trong ngày.',
    createdAt: '2026-10-09T10:00:00Z',
    workerName: 'TS. Lê Hoàng Đức',
    approvedAt: '2026-10-09T11:00:00Z',
    completedAt: '2026-10-10T07:44:00Z'
  }
];

export default function ExpertDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('tab');
      if (['chat', 'plots', 'harvest', 'issues', 'templates', 'compatibility', 'knowledge'].includes(p)) return p;
    }
    return 'chat';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isExpertUser = user?.role === 'EXPERT';
  const expertSenderName = isExpertUser && user?.fullName ? user.fullName : 'ThS. Nguyễn Hoàng Nam';

  const {
    threads: chatThreads,
    selectedThreadId,
    setSelectedThreadId,
    currentThread: activeRealtimeThread,
    sendMessage: sendExpertMessage,
    markAsRead: markExpertThreadAsRead,
    refreshThreads
  } = useRealtimeChat({
    role: 'expert',
    initialThreadId: 'CONS-401',
    senderName: expertSenderName
  });
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [chatFilter, setChatFilter] = useState('all'); // 'all' | 'customer' | 'pre_rental' | 'worker' | 'pending'
  const [chatInputText, setChatInputText] = useState('');
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const chatContainerRef = useRef(null);
  const chatInputRef = useRef(null);
  const isPreRentalThread = (thread) => thread?.rentalStatus === 'NOT_RENTED';
  const preRentalCount = chatThreads.filter(isPreRentalThread).length;

  const formatPlotCode = (raw) => {
    if (!raw) return '';
    return String(raw)
      .replace(/\bPlot\s+Plot\b/gi, 'Plot')
      .replace(/\bThửa\s+Thửa\b/gi, 'Thửa')
      .split(',')
      .map((s) => s.trim().replace(/^(plot|thửa)\s+/i, ''))
      .filter(Boolean)
      .join(', ');
  };

  // Quick advice recommendations pills with actionable task mappings
  const quickPrescriptions = [
    {
      label: '💧 Giảm 30% tưới ẩm',
      taskTitle: 'Điều chỉnh giảm 30% thời lượng tưới béc phun sương',
      text: 'Độ ẩm đất 72% đang hơi cao. Nên giảm 30% thời lượng tưới béc phun sương mỗi sáng để bộ rễ thông thoáng, tránh ngập úng gây vàng lá sinh lý.',
      priority: 'HIGH'
    },
    {
      label: '🍅 Tỉa lá già sát gốc',
      taskTitle: 'Bấm tỉa lá già, lá vàng cách gốc 15-20cm tạo thông thoáng',
      text: 'Hiện tượng vàng lá ở tầng chân là sinh lý tự nhiên khi cây tập trung dinh dưỡng nuôi chùm hoa. Bấm tỉa các lá già cách gốc 15-20cm để tạo độ thông thoáng.',
      priority: 'NORMAL'
    },
    {
      label: '🌾 Cách ly VietGAP 5 ngày',
      taskTitle: 'Thiết lập cách ly VietGAP 5 ngày trước thu hoạch (ngưng bón phân)',
      text: 'Đúng chuẩn quy trình VietGAP, ngưng bón phân dinh dưỡng từ hôm nay (cách ngày hái 5 ngày). Chỉ duy trì tưới nước sạch buổi sáng để rau giòn ngọt tự nhiên.',
      priority: 'HIGH'
    },
    {
      label: '🌶️ Phun gừng ớt tỉ lệ 1:200',
      taskTitle: 'Phun chế phẩm thảo mộc gừng ớt 1:200 phòng bọ trĩ rầy mềm sau 16:30',
      text: 'Pha chế phẩm sinh học thảo mộc gừng ớt tỉ lệ 1:200, phun sương đều 2 mặt lá sau 16:30 lúc trời dịu nắng để phòng ngừa bọ trĩ và rầy mềm.',
      priority: 'EMERGENCY'
    },
    {
      label: '🪱 Bổ sung phân trùn quế',
      taskTitle: 'Rải 400g phân trùn quế vi sinh quanh gốc cách 10cm và tưới ẩm nhẹ',
      text: 'Bón rải 400g phân trùn quế vi sinh quanh gốc (cách gốc 10cm), tưới ẩm nhẹ để kích thích vi sinh vật cố định đạm tự nhiên.',
      priority: 'NORMAL'
    }
  ];

  // Automatically scroll to bottom to view latest messages
  useEffect(() => {
    if (activeTab === 'chat' && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [selectedThreadId, activeTab, activeRealtimeThread?.messages?.length]);

  useEffect(() => {
    if (activeTab === 'chat' && mobileShowChat && chatInputRef.current) {
      chatInputRef.current.focus({ preventScroll: true });
    }
  }, [selectedThreadId, mobileShowChat, activeTab]);

  // Handle select conversation
  const handleSelectThread = (threadId) => {
    setSelectedThreadId(threadId);
    setMobileShowChat(true);
    markExpertThreadAsRead(threadId);
  };

  // Handle send message in Messenger chat
  const handleSendCustomerMessage = (e) => {
    if (e) e.preventDefault();
    if (!chatInputText.trim()) return;

    const currentExpert = (isExpertUser && user?.fullName)
      ? user.fullName
      : (activeRealtimeThread?.expertName || expertSenderName);

    sendExpertMessage(chatInputText.trim(), currentExpert);
    setChatInputText('');
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 50);
  };

  // 2. Field Issue Reports from Workers (UC12 / UC48)
  const [fieldIssues, setFieldIssues] = useState([
    {
      id: 'ISS-901',
      issueCode: 'ISS-901',
      apiId: 1,
      rentalId: 2,
      reportedBy: 8,
      isStaffReporter: true,
      workerName: 'Trần Văn Lực (CVLĐ)',
      plotCode: 'P-03',
      plotName: 'Thửa Rừng Sác C3',
      cropName: 'Dưa leo baby F1',
      urgency: 'HIGH', // 'NORMAL' | 'HIGH' | 'CRITICAL'
      issueType: 'Phát hiện bọ trĩ mặt dưới lá non',
      description: 'Lá dưa leo baby có hiện tượng quăn mép và chấm bạc li ti. Nghi ngờ bị bọ trĩ tấn công do 2 ngày nay trời hanh khô.',
      reportedTime: 'Sáng nay • 08:45',
      photoUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d69109853?auto=format&fit=crop&w=800&q=80',
      diagnosis: '',
      status: 'OPEN'
    },
    {
      id: 'ISS-889',
      issueCode: 'ISS-889',
      apiId: 2,
      rentalId: 1,
      reportedBy: 9,
      isStaffReporter: true,
      workerName: 'Nguyễn Văn Đạt (CVLĐ)',
      plotCode: 'P-01',
      plotName: 'Thửa Sen Vàng A1',
      cropName: 'Cà chua bi đỏ F1',
      urgency: 'NORMAL',
      issueType: 'Đầu béc tưới số 3 bị nghẹt cặn',
      description: 'Đã súc rửa màng lọc và thay béc phun sương mới. Độ ẩm đất đã cân bằng 68%.',
      reportedTime: 'Hôm qua • 16:00',
      photoUrl: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80',
      diagnosis: 'Chuyên gia Nam duyệt: Đạt yêu cầu kỹ thuật.',
      status: 'RESOLVED'
    }
  ]);

  const [selectedIssueDetail, setSelectedIssueDetail] = useState(null);
  const [detailDiagnosisText, setDetailDiagnosisText] = useState('');
  const [detailAssignWorkerId, setDetailAssignWorkerId] = useState(8);
  const [detailDueDate, setDetailDueDate] = useState('');
  const [detailPriority, setDetailPriority] = useState('EMERGENCY');
  const [isDispatchingFromDetail, setIsDispatchingFromDetail] = useState(false);
  const [isSavingDiagnosis, setIsSavingDiagnosis] = useState(false);

  const [selectedIssueToDiagnose, setSelectedIssueToDiagnose] = useState(null);
  const [diagnosisAdvice, setDiagnosisAdvice] = useState('');
  const [selectedIssueToAssign, setSelectedIssueToAssign] = useState(null);
  const [taskAssignment, setTaskAssignment] = useState({ title: '', dueDate: '', priority: 'EMERGENCY', instructions: '', templateId: '', workerId: 8 });
  const [isAssigningTask, setIsAssigningTask] = useState(false);

  // Direct task dispatching from chat/directives workspace
  const [directTaskModal, setDirectTaskModal] = useState(null);
  const [isSubmittingDirectTask, setIsSubmittingDirectTask] = useState(false);
  const availableFieldWorkers = [
    { id: 8, name: 'Trần Văn Lực', role: 'Tổ trưởng CVLĐ (Khu A & B)', email: 'worker@farmely.vn' },
    { id: 9, name: 'Nguyễn Văn Đạt', role: 'Kỹ thuật viên tưới & thổ nhưỡng', email: 'dat.nguyen@farmely.vn' },
    { id: 10, name: 'Hoàng Thanh Hải', role: 'CVLĐ phụ trách thu hoạch', email: 'hai.hoang@farmely.vn' }
  ];

  const loadFieldIssues = () => {
    fetch('/api/issue-reports')
      .then((res) => res.json())
      .then((res) => {
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setFieldIssues(res.data);
        }
      })
      .catch((err) => console.warn('Could not fetch live issues:', err));
  };

  const loadTemplates = () => {
    fetch('/api/process-templates')
      .then((res) => res.json())
      .then((res) => {
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((template) => ({
            id: template.id || template.templateId,
            code: template.code || `TMPL-${String(template.templateId || template.id).padStart(3, '0')}`,
            version: template.version || 'v1.0',
            name: template.name || `Quy trình ${template.varietyName || 'canh tác VietGAP'}`,
            variety: template.variety || template.varietyName || `Giống #${template.varietyId}`,
            durationDays: template.durationDays || template.totalDays || Math.max(0, ...(template.steps || []).map((s) => Number(s.dayOffset || s.day) || 0), 45),
            stagesCount: (template.steps || []).length || template.totalSteps || 0,
            stepsCount: (template.steps || []).length || template.totalSteps || 0,
            status: 'ACTIVE',
            description: template.description || `Quy trình chuẩn VietGAP lưu trong hệ thống, phiên bản ${template.version || 'v1.0'}.`,
            steps: Array.isArray(template.steps) ? template.steps.map((st, i) => ({
              day: st.day ?? st.dayOffset ?? (i * 5),
              name: st.name ?? st.stepName ?? `Bước ${i + 1}`,
              type: st.type ?? `BƯỚC ${st.stepOrder ?? (i + 1)}`,
              details: st.details ?? st.description ?? st.materialsNeeded ?? ''
            })) : []
          }));
          setProcessTemplates(mapped);
        }
      })
      .catch((err) => console.warn('Could not fetch live templates:', err));
  };

  const [assignedPlots, setAssignedPlots] = useState([]);

  // Quản lý Yêu cầu Thu hoạch & Thẩm định VietGAP (PHI Check)
  const [harvestRequests, setHarvestRequests] = useState(() => {
    try {
      const shared = JSON.parse(localStorage.getItem('farmely_shared_harvest_plans') || 'null');
      if (Array.isArray(shared) && shared.length > 0) return shared;
    } catch {}
    return DEFAULT_HARVEST_REQUESTS;
  });
  const [harvestFilter, setHarvestFilter] = useState('ALL');
  const [harvestSuccessToast, setHarvestSuccessToast] = useState('');
  const [postponeModalReq, setPostponeModalReq] = useState(null);
  const [postponeReason, setPostponeReason] = useState('Cần ngưng bón dinh dưỡng thêm 2 ngày để đảm bảo độ ngọt và chỉ số an toàn PHI.');

  const loadAssignedPlots = () => {
    apiFetch('/api/rentals')
      .then((res) => {
        const list = unwrapData(res) || [];
        if (!Array.isArray(list)) return;
        const email = user?.email?.trim().toLowerCase();
        const expertId = Number(user?.userId);
        const plotsById = new Map();

        for (const rental of list) {
          if (rental.status !== 'ACTIVE') continue;
          const assignedToCurrentExpert = email && rental.expertEmail
            ? rental.expertEmail.trim().toLowerCase() === email
            : expertId > 0 && Number(rental.expertId) === expertId;
          if (!assignedToCurrentExpert) continue;

          const plotKey = rental.plotId || rental.plotCode;
          if (!plotKey || plotsById.has(plotKey)) continue;
          plotsById.set(plotKey, {
            ...rental,
            crop: rental.varietyName || rental.crop || DEFAULT_PLOT_CROPS[rental.plotCode] || 'Rau củ chuẩn VietGAP'
          });
        }

        setAssignedPlots([...plotsById.values()]);
      })
      .catch((err) => console.warn('Could not fetch live rentals:', err));
  };

  useEffect(() => {
    const handleHarvestSync = () => {
      try {
        const shared = JSON.parse(localStorage.getItem('farmely_shared_harvest_plans') || 'null');
        if (Array.isArray(shared) && shared.length > 0) {
          setHarvestRequests(shared);
        }
      } catch {}
    };

    let harvestBc = null;
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        harvestBc = new BroadcastChannel('farmely_harvest_sync');
        harvestBc.onmessage = handleHarvestSync;
      }
    } catch {}

    window.addEventListener('storage', handleHarvestSync);
    return () => {
      if (harvestBc) try { harvestBc.close(); } catch {}
      window.removeEventListener('storage', handleHarvestSync);
    };
  }, []);

  const pendingHarvestCount = harvestRequests.filter(r => r.status === 'PENDING' || r.status === 'PENDING_CONFIRM').length;

  const handleApproveHarvest = (reqId) => {
    setHarvestRequests((prev) => {
      const next = prev.map((item) => {
        if (item.id === reqId) {
          return {
            ...item,
            status: 'APPROVED',
            approvedAt: new Date().toISOString(),
            approvedBy: expertSenderName,
            workerName: item.workerName || 'Trần Văn Lực (CVLĐ)'
          };
        }
        return item;
      });
      try {
        localStorage.setItem('farmely_shared_harvest_plans', JSON.stringify(next));
        const bc = new BroadcastChannel('farmely_harvest_sync');
        bc.postMessage({ type: 'HARVEST_PLAN_UPDATED' });
        bc.close();
      } catch {}
      return next;
    });
    setHarvestSuccessToast('Đã phê duyệt lệnh thu hoạch đạt chuẩn VietGAP! Lệnh điều phối đã chuyển sang ca trực của CVLĐ.');
    setTimeout(() => setHarvestSuccessToast(''), 4500);
  };

  const handleConfirmPostpone = () => {
    if (!postponeModalReq) return;
    setHarvestRequests((prev) => {
      const next = prev.map((item) => {
        if (item.id === postponeModalReq.id) {
          return {
            ...item,
            status: 'POSTPONED',
            postponeReason: postponeReason.trim(),
            postponedAt: new Date().toISOString(),
            postponedBy: expertSenderName
          };
        }
        return item;
      });
      try {
        localStorage.setItem('farmely_shared_harvest_plans', JSON.stringify(next));
        const bc = new BroadcastChannel('farmely_harvest_sync');
        bc.postMessage({ type: 'HARVEST_PLAN_UPDATED' });
        bc.close();
      } catch {}
      return next;
    });
    setPostponeModalReq(null);
    setHarvestSuccessToast('Đã ban hành yêu cầu hoãn hái và hướng dẫn cách ly cho khách hàng.');
    setTimeout(() => setHarvestSuccessToast(''), 4500);
  };

  const filteredHarvestRequests = harvestRequests.filter((r) => {
    if (harvestFilter === 'PENDING') return r.status === 'PENDING' || r.status === 'PENDING_CONFIRM';
    if (harvestFilter === 'APPROVED') return r.status === 'APPROVED';
    if (harvestFilter === 'COMPLETED') return r.status === 'COMPLETED';
    return true;
  });

  useEffect(() => {
    loadFieldIssues();
    loadTemplates();
    loadAssignedPlots();

    let bc = null;
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        bc = new BroadcastChannel('farmely_iot_telemetry');
        bc.onmessage = (msg) => {
          if (msg.data?.type === 'TELEMETRY_UPDATED') {
            loadAssignedPlots();
          }
        };
      }
    } catch {}

    const handleStorage = (e) => {
      if (e.key === 'farmely_iot_sync_ping') {
        loadAssignedPlots();
      }
    };
    window.addEventListener('storage', handleStorage);

    const pollInterval = setInterval(loadAssignedPlots, 5000);

    return () => {
      clearInterval(pollInterval);
      if (bc) try { bc.close(); } catch {}
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Open detailed issue view (UC12 / UC48)
  const handleOpenIssueDetail = (issue) => {
    setSelectedIssueDetail(issue);
    setDetailDiagnosisText(issue.diagnosis || '');
    setDetailAssignWorkerId(Number(issue.reportedBy) || (issue.plotCode === 'P-02' ? 8 : (issue.plotCode === 'P-03' ? 10 : 8)));
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDetailDueDate(issue.assignedDueDate || tomorrow.toISOString().slice(0, 10));
    setDetailPriority(issue.urgency === 'HIGH' || issue.urgency === 'CRITICAL' ? 'EMERGENCY' : 'HIGH');
  };

  // Save technical diagnosis from detail view
  const handleSaveDetailDiagnosis = async () => {
    if (!selectedIssueDetail || !detailDiagnosisText.trim()) return;
    const issueId = selectedIssueDetail.issueId || selectedIssueDetail.apiId || parseInt(String(selectedIssueDetail.id).replace(/\D/g, ''), 10) || 1;
    const expertId = Number(String(user?.userId || user?.id || '5').replace(/\D/g, '')) || 5;

    setIsSavingDiagnosis(true);
    try {
      await fetch(`/api/issues/${issueId}/diagnose`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handledBy: expertId,
          diagnosis: detailDiagnosisText.trim(),
          markResolved: false
        })
      }).catch(() => {});

      setFieldIssues((current) => current.map((i) => i.id === selectedIssueDetail.id
        ? { ...i, diagnosis: detailDiagnosisText.trim(), status: i.status === 'RESOLVED' ? 'RESOLVED' : 'IN_PROGRESS' }
        : i
      ));

      setSelectedIssueDetail((current) => current ? {
        ...current,
        diagnosis: detailDiagnosisText.trim(),
        status: current.status === 'RESOLVED' ? 'RESOLVED' : 'IN_PROGRESS'
      } : null);

      triggerSuccessToast('Đã lưu chỉ đạo kỹ thuật cho sự cố!');
    } catch (err) {
      console.warn('Lỗi lưu chỉ đạo:', err);
    } finally {
      setIsSavingDiagnosis(false);
    }
  };

  // Dispatch corrective task directly from detailed issue view
  const handleDispatchTaskFromDetail = async () => {
    if (!selectedIssueDetail) return;
    const issueId = selectedIssueDetail.issueId || selectedIssueDetail.apiId || parseInt(String(selectedIssueDetail.id).replace(/\D/g, ''), 10) || 1;
    const rentalId = selectedIssueDetail.rentalId || (assignedPlots.find((p) => p.plotCode === selectedIssueDetail.plotCode)?.rentalId) || 2;
    const targetWorkerId = Number(detailAssignWorkerId) || 8;
    const targetWorker = availableFieldWorkers.find((w) => w.id === targetWorkerId) || availableFieldWorkers[0];
    const dueDate = detailDueDate || new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const priorityTag = detailPriority === 'EMERGENCY' ? '[LÀM NGAY]' : detailPriority === 'HIGH' ? '[ƯU TIÊN CAO]' : '[BÌNH THƯỜNG]';
    const taskTitle = `${priorityTag} Xử lý ${String(selectedIssueDetail.issueType || 'sự cố hiện trường').toLowerCase()}`;
    const instructions = detailDiagnosisText.trim() || selectedIssueDetail.diagnosis || selectedIssueDetail.description || 'Tiến hành xử lý khắc phục theo quy chuẩn VietGAP.';
    const notes = [
      `${priorityTag} [${selectedIssueDetail.issueCode || selectedIssueDetail.id}] ${taskTitle}`,
      `Hướng dẫn kỹ thuật từ CGNN: ${instructions}`,
      `Hiện trường: Thửa ${selectedIssueDetail.plotCode} - ${selectedIssueDetail.plotName}`
    ].join('\n');

    setIsDispatchingFromDetail(true);
    try {
      const taskRes = unwrapData(await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          rentalId,
          taskAssignedTo: targetWorkerId,
          workerId: targetWorkerId,
          dueDate,
          priority: detailPriority,
          title: taskTitle,
          status: 'PENDING',
          notes
        })
      }));

      const assignedTaskCode = taskRes?.taskCode || `TSK-${taskRes?.taskId || Date.now().toString().slice(-3)}`;
      const expertId = Number(String(user?.userId || user?.id || '5').replace(/\D/g, '')) || 5;

      // Update issue with diagnosis & link task
      await fetch(`/api/issues/${issueId}/diagnose`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handledBy: expertId,
          diagnosis: instructions,
          resolutionNotes: `${priorityTag} Đã giao nhiệm vụ ${assignedTaskCode} cho ${targetWorker.name}.`,
          markResolved: false
        })
      }).catch(() => {});

      // Broadcast channel sync
      try {
        if (typeof window !== 'undefined' && window.BroadcastChannel) {
          const bc = new BroadcastChannel('farmely_staff_dispatch');
          bc.postMessage({
            type: 'NEW_TASK_DISPATCHED',
            workerId: targetWorkerId,
            taskCode: assignedTaskCode,
            plotCode: selectedIssueDetail.plotCode
          });
          bc.close();
        }
      } catch {}

      // Update state
      setFieldIssues((current) => current.map((i) => i.id === selectedIssueDetail.id
        ? {
            ...i,
            assignedTaskCode,
            assignedDueDate: dueDate,
            workerName: targetWorker.name,
            status: 'IN_PROGRESS',
            diagnosis: instructions
          }
        : i
      ));

      setSelectedIssueDetail((current) => current ? {
        ...current,
        assignedTaskCode,
        assignedDueDate: dueDate,
        workerName: targetWorker.name,
        status: 'IN_PROGRESS',
        diagnosis: instructions
      } : null);

      triggerSuccessToast(`Đã phát lệnh và giao ${assignedTaskCode} cho ${targetWorker.name} thành công!`);
    } catch (err) {
      console.error('Lỗi giao task:', err);
      setDataError(err.message || 'Không thể giao task cho nhân viên.');
    } finally {
      setIsDispatchingFromDetail(false);
    }
  };

  // Submit diagnosis for worker field issue
  const handleSendIssueDiagnosis = async (e) => {
    e.preventDefault();
    if (!selectedIssueToDiagnose || !diagnosisAdvice.trim()) return;

    const issueId = selectedIssueToDiagnose.issueId || selectedIssueToDiagnose.apiId || parseInt(String(selectedIssueToDiagnose.id).replace(/\D/g, ''), 10) || 1;
    try {
      await fetch(`/api/issue-reports/${issueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnosis: diagnosisAdvice })
      });
      if (selectedIssueToDiagnose.apiId) {
        const expertId = Number(String(user?.userId || user?.id || '').replace(/\D/g, ''));
        await fetch(`/api/issues/${selectedIssueToDiagnose.apiId}/diagnose`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ handledBy: expertId, resolutionNotes: diagnosisAdvice, markResolved: true })
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('Could not update diagnosis to DB:', err);
    }
    setFieldIssues((prev) =>
      prev.map((i) =>
        i.id === selectedIssueToDiagnose.id
          ? { ...i, diagnosis: diagnosisAdvice, status: 'RESOLVED' }
          : i
      )
    );
    setSelectedIssueToDiagnose(null);
    setDiagnosisAdvice('');
  };

  // 3. VietGAP Process Templates State (UC09 / Screen 43)
  const [processTemplates, setProcessTemplates] = useState([
    {
      id: 'TMPL-TOMATO-01',
      code: 'TMPL-TOMATO-01',
      version: 'v2.3 (Chuẩn VietGAP)',
      name: 'Phác Đồ Canh Tác Cà Chua Bi Cherry F1',
      variety: 'Cà chua bi Cherry F1',
      durationDays: 65,
      stagesCount: 5,
      stepsCount: 6,
      status: 'ACTIVE',
      description: 'Quy trình chuẩn hóa kiểm soát dưỡng chất vi sinh và tỉa chồi nách, tối ưu độ ngọt brix >= 9.0.',
      steps: [
        { day: 1, name: 'Gieo ươm bầu & Kích rễ sinh học', type: 'Ủ GIỐNG & GIEO', details: 'Ngâm hạt nước ấm 54°C (3 sôi 2 lạnh) trong 4 giờ. Tra hạt vào khay 84 lỗ.' },
        { day: 15, name: 'Xuống giống ra luống & Tưới đẫm Trichoderma', type: 'TRỒNG CÂY', details: 'Mật độ 2.500 cây/1000m2. Tưới đẫm dung dịch Trichoderma ngừa nấm rễ.' },
        { day: 25, name: 'Bấm tỉa chồi nách & Lên giàn chữ A', type: 'CẮT TỈA', details: 'Cố định thân chính vào dây leo giàn, bấm sạch chồi nách dưới 20cm.' },
        { day: 40, name: 'Bón thúc đợt 2: Dịch đạm cá & Trùn quế', type: 'BÓN PHÂN', details: 'Pha dịch cá vi sinh 1:500 tưới gốc. Rải 300g trùn quế quanh tán.' },
        { day: 60, name: 'Cách ly an toàn VietGAP 5 ngày', type: 'CÁCH LY', details: 'Ngưng hoàn toàn phân bón, chỉ duy trì tưới ẩm nước sạch mỗi sáng.' },
        { day: 65, name: 'Thu hoạch quả chín bói đợt 1', type: 'THU HOẠCH', details: 'Hái quả lúc sáng sớm khi vỏ đỏ đều 85%, xếp khay xốp có lót giấy mềm.' }
      ]
    },
    {
      id: 'TMPL-LETTUCE-02',
      code: 'TMPL-LETTUCE-02',
      version: 'v1.8 (Chuẩn VietGAP)',
      name: 'Phác Đồ Xà Lách Romaine Hữu Cơ',
      variety: 'Xà lách Romaine VietGAP',
      durationDays: 35,
      stagesCount: 3,
      stepsCount: 5,
      status: 'ACTIVE',
      description: 'Quy trình rau ăn lá ngắn ngày, bổ sung đạm hữu cơ và cách ly vi sinh nghiêm ngặt 5 ngày.',
      steps: [
        { day: 1, name: 'Làm đất & Bón lót phân trùn quế', type: 'LÀM ĐẤT', details: 'Cày tơi xốp, bón lót 1.5kg phân trùn quế/m2, lên luống cao 25cm.' },
        { day: 7, name: 'Trồng cây con 3 lá thật', type: 'TRỒNG CÂY', details: 'Khoảng cách cây cách cây 20cm, hàng cách hàng 25cm.' },
        { day: 18, name: 'Bón thúc đạm đậu nành lên men', type: 'BÓN PHÂN', details: 'Tưới dung dịch đạm đậu tương ngâm ủ EM tỉ lệ 1:300.' },
        { day: 30, name: 'Ngưng dinh dưỡng & Cách ly an toàn', type: 'CÁCH LY', details: 'Cách ly hoàn toàn trước thu hoạch, chỉ tưới nước sạch.' },
        { day: 35, name: 'Thu hoạch nhổ tỉa sáng sớm', type: 'THU HOẠCH', details: 'Thu hoạch trước 8:00 sáng để giữ độ giòn và ngọt tự nhiên.' }
      ]
    },
    {
      id: 'TMPL-CUCUMBER-03',
      code: 'TMPL-CUCUMBER-03',
      version: 'v2.0 (Chuẩn VietGAP)',
      name: 'Phác Đồ Dưa Leo Baby Đà Lạt F1',
      variety: 'Dưa leo Baby F1',
      durationDays: 45,
      stagesCount: 4,
      stepsCount: 5,
      status: 'ACTIVE',
      description: 'Trồng giàn lưới nhà màng sinh thái, kết hợp thả ong mật tự nhiên thụ phấn.',
      steps: [
        { day: 1, name: 'Gieo hạt trực tiếp vào luống', type: 'GIEO HẠT', details: 'Tra hạt sâu 1.5cm, tưới ẩm 70% kích mầm.' },
        { day: 14, name: 'Cột dây leo giàn & Tỉa nhánh phụ', type: 'CHĂM SÓC', details: 'Tỉa bỏ hoa đực và nhánh phụ từ mắt thứ 5 trở xuống.' },
        { day: 25, name: 'Thả đàn ong mật thụ phấn hoa', type: 'SINH THÁI', details: 'Thả thùng ong mật trong nhà lưới để thụ phấn tự nhiên.' },
        { day: 40, name: 'Cách ly trước thu hái 5 ngày', type: 'CÁCH LY', details: 'Ngưng tưới chế phẩm sinh học.' },
        { day: 45, name: 'Thu hoạch quả non baby 10-12cm', type: 'THU HOẠCH', details: 'Cắt cuống bằng kéo sạch, thu hái hàng ngày.' }
      ]
    },
    {
      id: 'TMPL-STRAW-04',
      code: 'TMPL-STRAW-04',
      version: 'v1.5 (Chuẩn VietGAP)',
      name: 'Phác Đồ Dâu Tây Hana Chịu Nhiệt',
      variety: 'Dâu tây Hana Nhật Bản',
      durationDays: 90,
      stagesCount: 5,
      stepsCount: 5,
      status: 'ACTIVE',
      description: 'Trồng trên giá thể xơ dừa phối trùn quế, bổ sung vi lượng Kali hữu cơ.',
      steps: [
        { day: 1, name: 'Vào bầu giá thể & Kích rễ ngó', type: 'XUỐNG GIỐNG', details: 'Giá thể xơ dừa xử lý chát kết hợp trùn quế 3:1.' },
        { day: 30, name: 'Ngắt hoa bói đợt 1 dưỡng cây', type: 'TỈA HOA', details: 'Ngắt bỏ lứa hoa đầu để bộ rễ phát triển sung mãn.' },
        { day: 55, name: 'Bổ sung dịch chuối trứng lên men', type: 'BÓN PHÂN', details: 'Bổ sung Kali hữu cơ giúp hoa đậu sai và quả mọng đỏ.' },
        { day: 85, name: 'Cách ly VietGAP 5 ngày', type: 'CÁCH LY', details: 'Duy trì tưới nhỏ giọt nước tinh khiết.' },
        { day: 90, name: 'Thu hoạch quả chín bói đợt 1', type: 'THU HOẠCH', details: 'Hái quả chín 90%, lót rơm hoặc mút xốp.' }
      ]
    }
  ]);

  const openTaskAssignment = (issue) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);
    setSelectedIssueToAssign(issue);
    setTaskAssignment({
      title: `Xử lý ${String(issue.issueType || 'sự cố hiện trường').toLowerCase()}`,
      dueDate: dueDate.toISOString().slice(0, 10),
      priority: issue.urgency === 'HIGH' || issue.urgency === 'CRITICAL' ? 'EMERGENCY' : 'HIGH',
      instructions: issue.description || '',
      templateId: ''
    });
  };

  const handleAssignIssueTask = async (event) => {
    event.preventDefault();
    if (!selectedIssueToAssign || !taskAssignment.title.trim() || !taskAssignment.dueDate) return;
    const rentalId = selectedIssueToAssign.rentalId || (assignedPlots.find((p) => p.plotCode === selectedIssueToAssign.plotCode)?.rentalId) || 2;
    const workerId = Number(taskAssignment.workerId || selectedIssueToAssign.reportedBy || 8);

    const selectedTemplate = processTemplates.find((template) => String(template.id) === String(taskAssignment.templateId));
    const priorityTag = taskAssignment.priority === 'EMERGENCY' ? '[LÀM NGAY]' : taskAssignment.priority === 'HIGH' ? '[ƯU TIÊN CAO]' : '[BÌNH THƯỜNG]';
    const notes = [
      `${priorityTag} [${selectedIssueToAssign.issueCode || selectedIssueToAssign.id}] ${taskAssignment.title.trim()}`,
      taskAssignment.instructions.trim(),
      selectedTemplate ? `Quy trình tham chiếu: ${selectedTemplate.name} (${selectedTemplate.version})` : ''
    ].filter(Boolean).join('\n');

    setIsAssigningTask(true);
    try {
      const task = unwrapData(await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          rentalId,
          taskAssignedTo: workerId,
          workerId,
          dueDate: taskAssignment.dueDate,
          priority: taskAssignment.priority || 'EMERGENCY',
          title: `${priorityTag} ${taskAssignment.title.trim()}`,
          status: 'PENDING',
          notes
        })
      }));
      const expertId = Number(String(user?.userId || user?.id || '').replace(/\D/g, ''));
      if (selectedIssueToAssign.apiId && Number.isFinite(expertId)) {
        await apiFetch(`/api/issues/${selectedIssueToAssign.apiId}/diagnose`, {
          method: 'PUT',
          body: JSON.stringify({
            handledBy: expertId,
            resolutionNotes: `${priorityTag} Đã giao nhiệm vụ ${task?.taskCode || ''} cho ${selectedIssueToAssign.workerName}.`,
            markResolved: false
          })
        });
      }
      setFieldIssues((current) => current.map((issue) => issue.id === selectedIssueToAssign.id
        ? { ...issue, assignedTaskCode: task?.taskCode || `TSK-${task?.taskId}`, assignedDueDate: taskAssignment.dueDate, diagnosis: `${priorityTag} Đã giao nhiệm vụ cho ${issue.workerName}.` }
        : issue));
      setSelectedIssueToAssign(null);
      setDataError('');
      triggerSuccessToast(`Đã giao nhiệm vụ ${priorityTag} cho chuyên viên hiện trường!`);
    } catch (error) {
      setDataError(error.message || 'Không thể giao nhiệm vụ cho nhân viên.');
    } finally {
      setIsAssigningTask(false);
    }
  };

  // Mở modal sinh task chỉ đạo trực tiếp từ hội thoại chat
  const handleOpenDirectTaskModal = (thread, prefilled = null) => {
    if (!thread) return;

    // Phân định rõ vai trò
    const isWorker = thread.role === 'worker' || thread.category === 'worker';
    const isAdmin = thread.role === 'admin' || /Ban Quản Trị|Admin/i.test(thread.customerName || '');
    if (isAdmin) return; // Không phát lệnh từ kênh trao đổi với Ban Quản Trị

    // Nếu là nhân sự hiện trường (CVLĐ), tự động chọn chính nhân sự đó là người tiếp nhận lệnh
    let targetWorker = null;
    if (isWorker) {
      targetWorker = availableFieldWorkers.find(
        (w) => (thread.workerId && w.id === thread.workerId) ||
               (thread.customerName && w.name.toLowerCase().includes(thread.customerName.replace(/\s*\(.*\)/, '').trim().toLowerCase()))
      ) || (thread.customerName?.includes('Đạt') ? availableFieldWorkers.find((w) => w.id === 9) : null)
        || (thread.customerName?.includes('Hải') ? availableFieldWorkers.find((w) => w.id === 10) : null)
        || availableFieldWorkers[0];
    }

    const matchedPlot = assignedPlots.find((p) =>
      (thread?.plotCode && (p.plotCode === thread.plotCode || String(thread.plotCode).includes(p.plotCode))) ||
      (thread?.rentalId && p.rentalId === thread.rentalId) ||
      (!isWorker && thread?.customerName && p.renterName && String(thread.customerName).toLowerCase().includes(String(p.renterName).toLowerCase()))
    ) || assignedPlots[0] || {
      rentalId: 2,
      plotCode: thread?.plotCode || 'P-01',
      name: thread?.plotName || 'Thửa P-01',
      crop: thread?.crop || 'Cải ngọt chuẩn VietGAP',
      staffId: 8,
      staffName: 'Trần Văn Lực'
    };

    const targetWorkerId = isWorker && targetWorker ? targetWorker.id : (matchedPlot.staffId || 8);
    const resolvedWorkerName = isWorker && targetWorker
      ? targetWorker.name
      : (availableFieldWorkers.find((w) => w.id === targetWorkerId)?.name || matchedPlot.staffName || 'Trần Văn Lực');

    const todayStr = new Date().toISOString().slice(0, 10);

    let title = '';
    let instructions = '';
    let priority = 'HIGH';

    if (prefilled) {
      if (typeof prefilled === 'object') {
        title = prefilled.taskTitle || prefilled.label || '';
        instructions = prefilled.text || '';
        priority = prefilled.priority || 'HIGH';
      } else if (typeof prefilled === 'string' && prefilled.trim()) {
        instructions = prefilled.trim();
        title = prefilled.trim().length > 45 ? prefilled.trim().slice(0, 42) + '...' : prefilled.trim();
      }
    }

    const cleanPlotCode = (matchedPlot.plotCode || thread?.plotCode || 'P-01').replace(/^(plot|thửa)\s+/i, '');

    setDirectTaskModal({
      rentalId: matchedPlot.rentalId || 2,
      plotCode: cleanPlotCode,
      plotName: `Thửa ${cleanPlotCode}`,
      crop: matchedPlot.crop || thread?.crop || 'Chuẩn VietGAP',
      isWorkerThread: isWorker,
      partnerName: thread.customerName,
      customerName: isWorker ? (matchedPlot.renterName || 'Khách thuê thửa đất') : thread.customerName,
      workerId: targetWorkerId,
      workerName: resolvedWorkerName,
      title: title || (isWorker ? `[Chỉ đạo] Nhiệm vụ hiện trường Thửa ${cleanPlotCode}` : 'Kiểm tra hiện trường & xử lý theo tư vấn chuyên gia'),
      instructions: instructions || 'Tiến hành kiểm tra thực địa theo hướng dẫn chuyên gia nông nghiệp, xử lý và chụp ảnh kết quả tải lên hệ thống.',
      dueDate: todayStr,
      priority,
      templateId: '',
      notifyCustomerInChat: true
    });
  };

  // Xác nhận phát lệnh tạo task chuyển xuống CSDL PostgreSQL cho CVLĐ
  const handleConfirmDirectTask = async (e) => {
    if (e) e.preventDefault();
    if (!directTaskModal || !directTaskModal.title.trim() || !directTaskModal.dueDate) return;

    setIsSubmittingDirectTask(true);
    const priorityTag = directTaskModal.priority === 'EMERGENCY'
      ? '[LÀM NGAY]'
      : directTaskModal.priority === 'HIGH'
        ? '[ƯU TIÊN CAO]'
        : '[BÌNH THƯỜNG]';

    const selectedTemplate = processTemplates.find((t) => String(t.id) === String(directTaskModal.templateId));
    const targetWorker = availableFieldWorkers.find((w) => w.id === Number(directTaskModal.workerId)) || { name: directTaskModal.workerName };

    const notes = [
      `${priorityTag} [CHỈ ĐẠO CHUYÊN GIA] ${directTaskModal.title.trim()}`,
      directTaskModal.instructions.trim(),
      selectedTemplate ? `Quy trình tham chiếu: ${selectedTemplate.name} (${selectedTemplate.version})` : '',
      `Chuyên gia phát lệnh: ${expertSenderName} • Thửa đất: ${directTaskModal.plotCode}`
    ].filter(Boolean).join('\n');

    try {
      // 1. Gửi request tạo task vào bảng care_tasks
      const taskRes = unwrapData(await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          rentalId: directTaskModal.rentalId,
          taskAssignedTo: Number(directTaskModal.workerId),
          dueDate: directTaskModal.dueDate,
          priority: directTaskModal.priority,
          title: `${priorityTag} ${directTaskModal.title.trim()}`,
          status: 'PENDING',
          notes
        })
      }));

      // 2. Gửi tin nhắn thông báo vào cuộc trò chuyện
      if (directTaskModal.notifyCustomerInChat && selectedThreadId) {
        const sysNotice = directTaskModal.isWorkerThread
          ? `📋 [LỆNH NHIỆM VỤ HIỆN TRƯỜNG]\nChuyên gia ${expertSenderName} đã giao nhiệm vụ ${priorityTag}:\n👉 "${directTaskModal.title.trim()}"\n⏳ Hạn xử lý: ${directTaskModal.dueDate}. Đề nghị đồng chí ${targetWorker.name} thực hiện và chụp ảnh báo cáo nghiệm thu qua hệ thống.`
          : `📋 [LỆNH ĐIỀU PHỐI HIỆN TRƯỜNG]\nChuyên gia ${expertSenderName} đã phát lệnh công việc ${priorityTag} tới CVLĐ ${targetWorker.name}:\n👉 "${directTaskModal.title.trim()}"\n⏳ Hạn xử lý: ${directTaskModal.dueDate}. Nhân viên sẽ kiểm tra thực địa và chụp ảnh báo cáo sau khi xử lý.`;
        sendExpertMessage(sysNotice, expertSenderName, { prescriptionTag: 'LỆNH GIAO VIỆC CVLĐ' });
      }

      // 3. Đồng bộ BroadcastChannel & localStorage cho màn hình Staff
      try {
        localStorage.setItem('farmely_staff_sync_ping', String(Date.now()));
        if (typeof window !== 'undefined' && window.BroadcastChannel) {
          const staffBc = new BroadcastChannel('farmely_staff_tasks');
          staffBc.postMessage({ type: 'TASK_ASSIGNED', taskId: taskRes?.taskId, priority: directTaskModal.priority });
          staffBc.close();
        }
      } catch {}

      triggerSuccessToast(`Đã phát lệnh thành công! Nhiệm vụ ${priorityTag} đã chuyển tới CVLĐ ${targetWorker.name}.`);
      setDirectTaskModal(null);
    } catch (err) {
      console.error('Lỗi khi phát lệnh giao task cho staff:', err);
      setDataError('Không thể tạo nhiệm vụ cho nhân viên hiện trường. Vui lòng thử lại.');
    } finally {
      setIsSubmittingDirectTask(false);
    }
  };

  const [viewTemplateDetail, setViewTemplateDetail] = useState(null);
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [varietiesList, setVarietiesList] = useState([]);
  const [isSubmittingTemplate, setIsSubmittingTemplate] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const triggerSuccessToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4000);
  };
  const [newTemplateData, setNewTemplateData] = useState({
    code: '',
    varietyId: 1,
    version: '1.0',
    description: '',
    steps: [
      { stepOrder: 1, stepName: 'Làm đất & Xử lý giá thể vi sinh', dayOffset: 1, description: 'Làm đất tơi xốp, bón lót phân trùn quế và phun Trichoderma.', materialsNeeded: 'Phân trùn quế, Trichoderma' },
      { stepOrder: 2, stepName: 'Xuống giống & Tưới ẩm định kỳ', dayOffset: 10, description: 'Cấy cây con mật độ 20x25cm, duy trì tưới ẩm nhỏ giọt.', materialsNeeded: 'Cây giống F1, Nước tưới' },
      { stepOrder: 3, stepName: 'Bón thúc & Phòng trừ sinh học', dayOffset: 25, description: 'Bón thúc đạm cá thủy phân, phun phòng trừ chiết xuất thảo mộc.', materialsNeeded: 'Dịch đạm cá, Thảo mộc tỏi ớt' },
      { stepOrder: 4, stepName: 'Cách ly VietGAP & Thu hoạch', dayOffset: 45, description: 'Ngưng hoàn toàn dinh dưỡng trước thu hoạch 5 ngày, thu hái đạt chuẩn.', materialsNeeded: 'Kéo chuyên dụng, Thùng đựng' }
    ]
  });

  // 4. Plot-Crop Compatibility Matrix State (Screen 42)
  const [compatibilityList, setCompatibilityList] = useState([
    {
      id: 'COMP-01',
      soilType: 'Đất phù sa bồi lắng ven sông (Củ Chi)',
      phRange: 'pH 6.0 – 6.8',
      moistureProfile: 'Thoát nước tốt, giàu mùn hữu cơ',
      compatibleCrops: [
        { crop: 'Cà chua bi Cherry F1', rating: '98%', status: 'RẤT THÍCH HỢP' },
        { crop: 'Xà lách Romaine VietGAP', rating: '100%', status: 'HOÀN HẢO' },
        { crop: 'Dưa leo Baby Đà Lạt', rating: '95%', status: 'RẤT THÍCH HỢP' },
        { crop: 'Rau mồng tơi hữu cơ', rating: '96%', status: 'RẤT THÍCH HỢP' }
      ],
      plotsApplied: 'P-01 (Sen Vàng A1), P-02 (Mộc Châu B2)'
    },
    {
      id: 'COMP-02',
      soilType: 'Đất đỏ Bazan cao nguyên (Mộc Châu)',
      phRange: 'pH 5.5 – 6.5',
      moistureProfile: 'Giữ ẩm trung bình, giàu khoáng vi lượng',
      compatibleCrops: [
        { crop: 'Dâu tây Hana chịu nhiệt', rating: '96%', status: 'RẤT THÍCH HỢP' },
        { crop: 'Cải xoăn Kale xoăn', rating: '95%', status: 'RẤT THÍCH HỢP' },
        { crop: 'Cà rốt baby giòn ngọt', rating: '92%', status: 'THÍCH HỢP' },
        { crop: 'Xà lách búp Mỹ', rating: '90%', status: 'THÍCH HỢP' }
      ],
      plotsApplied: 'P-03 (Rừng Sác C3), P-04 (Đất Đỏ D4)'
    },
    {
      id: 'COMP-03',
      soilType: 'Đất cát pha phối giá thể hữu cơ (Đà Lạt)',
      phRange: 'pH 6.2 – 7.0',
      moistureProfile: 'Thoát nước cực nhanh, tơi xốp tối ưu',
      compatibleCrops: [
        { crop: 'Ớt chuông Sweet Pepper', rating: '97%', status: 'RẤT THÍCH HỢP' },
        { crop: 'Cần tây lá giòn', rating: '94%', status: 'THÍCH HỢP' },
        { crop: 'Bông cải xanh Baby Broccolini', rating: '92%', status: 'THÍCH HỢP' }
      ],
      plotsApplied: 'P-05 (Happy Valley E5), P-06 (An Nhiên F6)'
    }
  ]);

  const [isAddCompatibilityOpen, setIsAddCompatibilityOpen] = useState(false);
  const [newCompData, setNewCompData] = useState({
    soilType: '',
    phRange: 'pH 6.0 – 6.5',
    moistureProfile: '',
    cropsInput: ''
  });

  // 5. Knowledge Library & AI RAG State (Screen 45)
  const [knowledgeDocs, setKnowledgeDocs] = useState([
    {
      id: 'DOC-AGRI-01',
      title: 'Cẩm Nang Phòng Trừ Bọ Trĩ & Rầy Mềm Bằng Thảo Mộc Gừng Ớt Tỏi',
      category: 'Bảo Vệ Thực Vật Sinh Học',
      author: 'ThS. Nguyễn Hoàng Nam',
      updatedAt: '05/10/2026',
      pages: 12,
      aiRagStatus: 'ĐÃ NẠP RAG AI',
      summary: 'Quy trình chiết xuất và tỉ lệ pha loãng 1:200 chế phẩm gừng ớt tỏi sinh học, cơ chế phá vỡ màng chitin của côn trùng chích hút mà không để lại dư lượng độc hại.'
    },
    {
      id: 'DOC-AGRI-02',
      title: 'Quy Chuẩn Cách Ly An Toàn VietGAP Trước Ngày Thu Hoạch Rau Ăn Lá',
      category: 'Tiêu Chuẩn VietGAP',
      author: 'ThS. Nguyễn Hoàng Nam',
      updatedAt: '01/10/2026',
      pages: 8,
      aiRagStatus: 'ĐÃ NẠP RAG AI',
      summary: 'Quy định mốc cách ly 5-7 ngày đối với phân bón hữu cơ và chế phẩm sinh học, kỹ thuật tưới rửa lá bằng nước lọc sạch để giữ độ ngọt giòn trước khi thu hái.'
    },
    {
      id: 'DOC-AGRI-03',
      title: 'Kỹ Thuật Điều Tiết Ẩm Độ Giá Thể Và Dinh Dưỡng Cho Cà Chua Bi Cherry',
      category: 'Kỹ Thuật Trồng Nhà Màng',
      author: 'ThS. Nguyễn Hoàng Nam',
      updatedAt: '28/09/2026',
      pages: 16,
      aiRagStatus: 'ĐÃ NẠP RAG AI',
      summary: 'Biện pháp khắc phục hiện tượng vàng lá sinh lý tầng chân, điều chỉnh chu kỳ tưới béc phun sương khi độ ẩm vượt 70% và phác đồ bổ sung đạm cá vi sinh.'
    },
    {
      id: 'DOC-AGRI-04',
      title: 'Sổ Tay Thụ Phấn Tự Nhiên Bằng Ong Mật Sinh Thái Trong Nhà Màng',
      category: 'Hệ Sinh Thái Nông Trại',
      author: 'ThS. Nguyễn Hoàng Nam',
      updatedAt: '15/09/2026',
      pages: 10,
      aiRagStatus: 'ĐÃ NẠP RAG AI',
      summary: 'Hướng dẫn đặt tổ ong mật Ý tại góc nhà lưới, kiểm soát nhiệt độ 22-30°C để ong hoạt động tối ưu, tăng tỉ lệ đậu quả dưa leo baby lên 95%.'
    }
  ]);

  const [isAddDocOpen, setIsAddDocOpen] = useState(false);
  const [selectedDocToView, setSelectedDocToView] = useState(null);
  const [newDocData, setNewDocData] = useState({
    title: '',
    category: 'Tiêu Chuẩn VietGAP',
    summary: '',
    pages: 10
  });
  const [dataError, setDataError] = useState('');

  const loadExpertData = async () => {
    try {
      const [issuePayload, templatePayload, plotPayload, documentPayload, userPayload, varietyPayload] = await Promise.all([
        apiFetch('/api/issues').catch(() => ({ data: [] })),
        apiFetch('/api/templates').catch(() => ({ data: [] })),
        apiFetch('/api/plots').catch(() => ({ data: [] })),
        apiFetch('/api/v1/knowledge-documents').catch(() => ({ data: [] })),
        apiFetch('/api/users').catch(() => ({ data: [] })),
        apiFetch('/api/varieties').catch(() => ({ data: [] }))
      ]);
      const issues = unwrapData(issuePayload) || [];
      const templates = unwrapData(templatePayload) || [];
      const plots = unwrapData(plotPayload) || [];
      const documents = unwrapData(documentPayload) || [];
      const users = unwrapData(userPayload) || [];
      const varieties = unwrapData(varietyPayload) || [];
      if (varieties.length > 0) {
        setVarietiesList(varieties);
      }
      const userById = new Map(users.map((account) => [Number(account.userId || account.id), account]));

      if (issues.length > 0) {
        setFieldIssues(issues.map((issue) => ({
          ...issue,
          id: issue.id || `ISS-${issue.issueId || issue.id}`,
          issueCode: issue.issueCode || `ISS-${issue.issueId || issue.id}`,
          apiId: issue.apiId || issue.issueId,
          rentalId: issue.rentalId,
          reportedBy: issue.reportedBy || 8,
          isStaffReporter: true,
          workerName: issue.workerName || issue.reporterName || `Người báo #${issue.reportedBy || 8}`,
          plotCode: issue.plotCode || '',
          plotName: issue.plotName || `Thửa ${issue.plotCode || ''}`,
          cropName: issue.cropName || issue.crop || 'Cà chua bi đỏ F1',
          urgency: issue.urgency || (String(issue.description || '').includes('[KHẨN CẤP]') ? 'HIGH' : 'NORMAL'),
          issueType: issue.issueType,
          description: issue.description,
          reportedTime: issue.reportedTime || (issue.createdAt ? new Date(issue.createdAt).toLocaleString('vi-VN') : ''),
          photoUrl: issue.photoUrl || issue.imageUrl || '/images/moc-chau-2811.jpg',
          diagnosis: issue.diagnosis || issue.resolutionNotes || '',
          status: issue.status || issue.displayStatus || 'OPEN',
          assignedTaskCode: issue.assignedTaskCode || null,
          assignedDueDate: issue.assignedDueDate || null
        })));
      }
      if (templates.length > 0) {
        setProcessTemplates(templates.map((template) => ({
          id: template.templateId,
          code: `TMPL-${String(template.templateId).padStart(3, '0')}`,
          version: template.version || 'v1.0',
          name: `Quy trình ${template.varietyName || 'canh tác VietGAP'}`,
          variety: template.varietyName || `Giống #${template.varietyId}`,
          durationDays: Math.max(0, ...(template.steps || []).map((step) => Number(step.dayOffset) || 0)),
          stagesCount: template.steps?.length || 0,
          stepsCount: template.steps?.length || 0,
          status: 'ACTIVE',
          description: `Quy trình được lưu trong cơ sở dữ liệu, phiên bản ${template.version || 'v1.0'}.`,
          steps: (template.steps || []).map((step) => ({
            day: step.dayOffset,
            name: step.stepName,
            type: `BƯỚC ${step.stepOrder}`,
            details: step.description || step.materialsNeeded || ''
          }))
        })));
      }
      if (plots.length > 0) {
        setCompatibilityList(plots.map((plot) => ({
          id: plot.plotId,
          soilType: plot.landName || 'Thửa đất Farmely',
          phRange: plot.landAddress || 'Chưa cập nhật địa chỉ',
          moistureProfile: `${plot.area || 0} m² • trạng thái ${plot.status || 'chưa cập nhật'}`,
          compatibleCrops: (plot.compatibleVarieties || []).map((variety) => ({
            crop: variety.varietyName || variety.name,
            rating: 'Đạt',
            status: 'PHÙ HỢP'
          })),
          plotsApplied: `${plot.plotCode}${plot.landName ? ` (${plot.landName})` : ''}`
        })));
      }
      if (documents.length > 0) {
        setKnowledgeDocs(documents.map((document) => ({
          id: document.documentId || document.id,
          title: document.title,
          category: document.documentType || 'Tài liệu canh tác',
          author: document.author || 'Chuyên gia Farmely',
          updatedAt: document.uploadedDate || (document.createdAt ? new Date(document.createdAt).toLocaleDateString('vi-VN') : ''),
          pages: document.sectionsCount || 1,
          aiRagStatus: document.isIndexedForRAG ? 'ĐÃ NẠP RAG AI' : 'CHƯA NẠP RAG AI',
          summary: document.description || document.content || ''
        })));
      }
      setDataError('');
    } catch (error) {
      console.warn('Could not sync live expert data:', error);
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplateData.varietyId) return;
    setIsSubmittingTemplate(true);
    try {
      await apiFetch('/api/templates', {
        method: 'POST',
        body: JSON.stringify({
          varietyId: Number(newTemplateData.varietyId),
          ptCreatedBy: user?.id || 5,
          version: newTemplateData.version || '1.0',
          steps: newTemplateData.steps
        })
      });
      triggerSuccessToast('Đã ban hành quy trình canh tác VietGAP mới thành công!');
      setIsCreateTemplateOpen(false);
      await loadExpertData();
    } catch (err) {
      console.warn('Lỗi gọi API templates, fallback lưu local:', err);
      const chosenVar = varietiesList.find(v => v.varietyId === Number(newTemplateData.varietyId));
      const newTmpl = {
        id: `TMPL-${Date.now()}`,
        code: newTemplateData.code || `TMPL-${Math.floor(1000 + Math.random() * 9000)}`,
        version: newTemplateData.version || 'v1.0',
        name: `Quy trình ${chosenVar?.varietyName || 'canh tác VietGAP'}`,
        variety: chosenVar?.varietyName || 'Rau hữu cơ',
        durationDays: Math.max(...newTemplateData.steps.map(s => Number(s.dayOffset) || 0)),
        stagesCount: newTemplateData.steps.length,
        stepsCount: newTemplateData.steps.length,
        status: 'ACTIVE',
        description: newTemplateData.description || 'Quy trình canh tác chuẩn VietGAP.',
        steps: newTemplateData.steps.map(s => ({
          day: s.dayOffset,
          name: s.stepName,
          type: `BƯỚC ${s.stepOrder}`,
          details: `${s.description} • Vật tư: ${s.materialsNeeded}`
        }))
      };
      setProcessTemplates(prev => [newTmpl, ...prev]);
      setIsCreateTemplateOpen(false);
      triggerSuccessToast('Đã lưu quy trình canh tác mới vào hệ thống!');
    } finally {
      setIsSubmittingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa quy trình canh tác này?')) return;
    try {
      await apiFetch(`/api/templates/${templateId}`, { method: 'DELETE' });
      triggerSuccessToast('Đã xóa quy trình canh tác thành công!');
    } catch (err) {
      console.warn('Lỗi khi xóa template:', err);
    }
    setProcessTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  const handleAddCompatibility = (e) => {
    e.preventDefault();
    if (!newCompData.soilType) return;
    const crops = newCompData.cropsInput
      ? newCompData.cropsInput.split(',').map(c => ({ crop: c.trim(), rating: '95%', status: 'RẤT THÍCH HỢP' }))
      : [{ crop: 'Rau ăn lá VietGAP', rating: '95%', status: 'RẤT THÍCH HỢP' }];

    const newComp = {
      id: `COMP-0${compatibilityList.length + 1}`,
      soilType: newCompData.soilType,
      phRange: newCompData.phRange || 'pH 6.0 – 6.8',
      moistureProfile: newCompData.moistureProfile || 'Thoát nước tốt, giàu mùn hữu cơ',
      compatibleCrops: crops,
      plotsApplied: 'Các thửa đất đang áp dụng tại trang trại'
    };
    setCompatibilityList(prev => [...prev, newComp]);
    setIsAddCompatibilityOpen(false);
    setNewCompData({ soilType: '', phRange: 'pH 6.0 – 6.5', moistureProfile: '', cropsInput: '' });
  };

  const handleAddDoc = (e) => {
    e.preventDefault();
    if (!newDocData.title) return;
    const newDoc = {
      id: `DOC-AGRI-0${knowledgeDocs.length + 1}`,
      title: newDocData.title,
      category: newDocData.category,
      author: user?.fullName || 'ThS. Nguyễn Hoàng Nam',
      updatedAt: 'Hôm nay',
      pages: Number(newDocData.pages) || 10,
      aiRagStatus: 'ĐÃ NẠP RAG AI',
      summary: newDocData.summary || 'Tài liệu hướng dẫn kỹ thuật nông nghiệp chuẩn VietGAP được chuyên gia số hóa.'
    };
    setKnowledgeDocs(prev => [newDoc, ...prev]);
    setIsAddDocOpen(false);
    setNewDocData({ title: '', category: 'Tiêu Chuẩn VietGAP', summary: '', pages: 10 });
  };

  return (
    <div className="dashboard-readable min-h-screen bg-[#F5F3E9] flex flex-col font-sans overflow-x-hidden">
      <PublicNavbar dashboardRailCollapsed={sidebarCollapsed} />

      <main className={`box-border flex-1 pt-24 sm:pt-28 pb-16 max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-10 w-full lg:w-auto space-y-6 transition-[margin] duration-200 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'}`}>
        
        {/* Top Agronomy Metrics */}
        {(() => {
          const pendingIssuesCount = fieldIssues.filter(i => i.status === 'PENDING').length;
          const pendingChatCount = chatThreads.filter(c => c.status === 'PENDING').length;
          return (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-brand-border shadow-xs text-center space-y-0.5">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  Thửa Đất Giám Sát
                </span>
                <div className="text-2xl font-heading font-black text-brand-dark">
                  {assignedPlots.length} Thửa
                </div>
                <span className="text-[10px] text-emerald-700 font-bold block">Đang hoạt động và được phân công</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-brand-border shadow-xs text-center space-y-0.5">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  Hộp Thư Chờ Xử Lý
                </span>
                <div className={`text-2xl font-heading font-black ${pendingChatCount > 0 ? 'text-amber-700' : 'text-brand-dark'}`}>
                  {pendingChatCount} Tin nhắn
                </div>
                <span className="text-[10px] text-stone-500 font-semibold block">
                  {preRentalCount > 0 ? `${preRentalCount} khách chưa thuê` : 'Cần phản hồi'}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-brand-border shadow-xs text-center space-y-0.5">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  Sự Cố Hiện Trường
                </span>
                <div className={`text-2xl font-heading font-black ${pendingIssuesCount > 0 ? 'text-rose-600' : 'text-brand-dark'}`}>
                  {pendingIssuesCount} Cần chỉ đạo
                </div>
                <span className={`text-[10px] font-bold block ${pendingIssuesCount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {pendingIssuesCount > 0 ? 'Cần phát lệnh xử lý' : '● Hiện trường ổn định'}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-brand-border shadow-xs text-center space-y-0.5">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  Quy Trình Chuẩn
                </span>
                <div className="text-2xl font-heading font-black text-brand-dark">
                  0{processTemplates.length} Phác Đồ
                </div>
                <span className="text-[10px] text-stone-500 font-semibold block">Đang áp dụng thực địa</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-brand-border shadow-xs text-center space-y-0.5 col-span-2 lg:col-span-1">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  Kho Tri Thức & AI
                </span>
                <div className="text-2xl font-heading font-black text-brand-dark">
                  0{knowledgeDocs.length} Tài Liệu
                </div>
                <span className="text-[10px] text-stone-500 font-semibold block">Đã nạp RAG AI</span>
              </div>
            </div>
          );
        })()}

        {/* Layout Left Sidebar + Content */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Expert Menu (5 core functions per SRS) */}
          <DashboardRail user={user} fallbackName="ThS. Nguyễn Hoàng Nam" roleLabel="Chuyên gia nông nghiệp" collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed}>
            <div className={`px-2 pb-2 text-xs font-bold text-emerald-100/70 uppercase tracking-wider ${sidebarCollapsed ? 'lg:hidden' : ''}`}>Bàn Làm Việc Kỹ Thuật</div>

            {[
              { id: 'chat', label: 'Hộp Thư Tư Vấn & Chỉ Đạo', icon: MessageSquare, count: chatThreads.filter(c => c.status === 'PENDING').length },
              { id: 'plots', label: 'Thửa Đất Giám Sát', icon: Layers, count: assignedPlots.length },
              { id: 'harvest', label: 'Duyệt Kế Hoạch Thu Hoạch', icon: Wheat, count: pendingHarvestCount },
              { id: 'issues', label: 'Xử Lý Sự Cố Hiện Trường', icon: AlertTriangle, count: fieldIssues.filter(i => i.status === 'PENDING' || i.status === 'OPEN').length },
              { id: 'templates', label: 'Quy Trình Canh Tác VietGAP', icon: FileSpreadsheet, count: null },
              { id: 'compatibility', label: 'Ma Trận Thổ Nhưỡng – Giống', icon: SlidersHorizontal, count: null },
              { id: 'knowledge', label: 'Kho Tri Thức Nông Nghiệp & AI', icon: BookOpen, count: null }
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
                    <span className={`${sidebarCollapsed ? 'lg:hidden' : ''} px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                      isActive ? 'bg-brand-yellow text-brand-dark' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                  {sidebarCollapsed && <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-brand-dark px-3 py-2 text-xs text-white shadow-lg group-hover:lg:block">{tab.label}</span>}
                </button>
              );
            })}
          </DashboardRail>

          {/* Expert Main Display Content */}
          <section className="flex-1 min-w-0 w-full space-y-6">

            {successToast && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center justify-between shadow-sm animate-fade-in">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  {successToast}
                </span>
                <button onClick={() => setSuccessToast('')} className="text-emerald-700 hover:text-emerald-900 text-xs">✕</button>
              </div>
            )}

            {/* TAB 1: UNIFIED CHAT - MESSENGER FOR CUSTOMERS & FIELD WORKERS */}
            {activeTab === 'chat' && (
              <div className="bg-white rounded-3xl border border-brand-border shadow-sm overflow-hidden flex flex-col h-[740px]">
                
                {/* Messenger Layout: Left (Thread List) + Right (Active Chat) */}
                <div className="flex-1 flex flex-col md:flex-row min-h-0">
                  
                  {/* Left Column: Conversation Threads */}
                  <div className={`w-full md:w-80 lg:w-96 border-r border-brand-border flex flex-col bg-stone-50/50 shrink-0 ${
                    mobileShowChat ? 'hidden md:flex' : 'flex'
                  }`}>
                    {/* Sidebar Header */}
                    <div className="p-4 border-b border-brand-border/70 bg-white space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading font-black text-lg text-brand-dark">
                            Hộp Thư Tư Vấn & Chỉ Đạo
                          </h3>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <span className="text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 whitespace-nowrap">
                          {chatThreads.filter(c => c.status === 'PENDING').length} Chờ trả lời
                        </span>
                      </div>

                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={chatSearchQuery}
                          onChange={(e) => setChatSearchQuery(e.target.value)}
                          placeholder="Tìm người trò chuyện, thửa đất..."
                          className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-stone-100/80 border border-transparent focus:border-brand-green/30 focus:bg-white focus:outline-none transition-all"
                        />
                        {chatSearchQuery && (
                          <button
                            onClick={() => setChatSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Filter Chips */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5" aria-label="Lọc hội thoại">
                        <button
                          onClick={() => setChatFilter('all')}
                          className={`min-h-9 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                            chatFilter === 'all'
                              ? 'bg-[#294C38] text-white shadow-xs'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          Tất cả ({chatThreads.length})
                        </button>
                        <button
                          onClick={() => setChatFilter('customer')}
                          className={`min-h-9 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                            chatFilter === 'customer'
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          Đã thuê ({chatThreads.filter(c => c.role === 'customer' && !isPreRentalThread(c) && !/Ban Quản Trị|Admin/i.test(c.customerName || '')).length})
                        </button>
                        <button
                          onClick={() => setChatFilter('pre_rental')}
                          className={`min-h-9 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                            chatFilter === 'pre_rental'
                              ? 'bg-sky-700 text-white shadow-xs'
                              : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
                          }`}
                        >
                          Chưa thuê ({preRentalCount})
                        </button>
                        <button
                          onClick={() => setChatFilter('worker')}
                          className={`min-h-9 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                            chatFilter === 'worker'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          CVLĐ ({chatThreads.filter(c => c.role === 'worker').length})
                        </button>
                        <button
                          onClick={() => setChatFilter('pending')}
                          className={`min-h-9 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                            chatFilter === 'pending'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          Chờ xử lý ({chatThreads.filter(c => c.status === 'PENDING').length})
                        </button>
                      </div>
                    </div>

                    {/* Thread List (Scrollable) */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {chatThreads
                        .filter((thread) => {
                          const q = chatSearchQuery.toLowerCase();
                          const matchesQuery =
                            (thread.customerName || '').toLowerCase().includes(q) ||
                            (thread.plotName || '').toLowerCase().includes(q) ||
                            (thread.crop || '').toLowerCase().includes(q) ||
                            (thread.roleLabel || '').toLowerCase().includes(q);
                          if (chatFilter === 'customer') return matchesQuery && thread.role === 'customer' && !isPreRentalThread(thread) && !/Ban Quản Trị|Admin/i.test(thread.customerName || '');
                          if (chatFilter === 'pre_rental') return matchesQuery && isPreRentalThread(thread);
                          if (chatFilter === 'worker') return matchesQuery && thread.role === 'worker';
                          if (chatFilter === 'pending') return matchesQuery && thread.status === 'PENDING';
                          return matchesQuery;
                        })
                        .map((thread) => {
                          const isSelected = thread.id === selectedThreadId;
                          const lastMsg = thread.messages[thread.messages.length - 1];
                          const hasPhoto = thread.messages.some(m => m.photoUrl);
                          const isAdmin = thread.role === 'admin' || /Ban Quản Trị|Admin/i.test(thread.customerName || '');
                          const isWorker = thread.role === 'worker';

                          return (
                            <button
                              type="button"
                              key={thread.id}
                              onClick={() => handleSelectThread(thread.id)}
                              aria-pressed={isSelected}
                              className={`relative flex w-full items-start gap-3 p-3 rounded-xl text-left cursor-pointer transition-all duration-150 ${
                                isSelected
                                  ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-stone-900/5'
                                  : thread.unread
                                    ? 'bg-emerald-50/50 hover:bg-emerald-50/80 ring-1 ring-emerald-600/10'
                                    : 'hover:bg-white/70 text-stone-700'
                              }`}
                            >
                              {/* Avatar with Online Status */}
                              <div className="relative shrink-0 mt-0.5">
                                <img
                                  src={getSafeAvatar(thread.customerAvatar, thread.role)}
                                  alt={thread.customerName}
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = getSafeAvatar(null, thread.role);
                                  }}
                                  className="w-10 h-10 rounded-full object-cover ring-1 ring-stone-900/10"
                                />
                                {thread.isOnline && (
                                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                                )}
                              </div>

                              {/* Thread Summary Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`text-xs truncate font-semibold ${
                                    isSelected ? 'text-stone-900 font-bold' : thread.unread ? 'text-stone-900 font-bold' : 'text-stone-800'
                                  }`}>
                                    {thread.customerName}
                                  </span>
                                  <span className="text-[11px] text-stone-400 shrink-0 font-normal">
                                    {thread.lastTime}
                                  </span>
                                </div>

                                {/* Clean metadata line (Role & Plot) */}
                                <div className="flex items-center gap-1.5 text-[11px] text-stone-500 truncate mt-0.5">
                                  <span className={`font-medium shrink-0 ${
                                    isAdmin
                                      ? 'text-purple-700'
                                      : isWorker
                                        ? 'text-amber-800'
                                        : 'text-emerald-700'
                                  }`}>
                                    {isAdmin
                                      ? 'Ban Quản Trị'
                                      : isWorker
                                        ? 'CVLĐ Hiện Trường'
                                        : (thread.plotCode ? `Thửa ${formatPlotCode(thread.plotCode)}` : 'Chưa thuê')}
                                  </span>
                                  {thread.crop && !isAdmin && (
                                    <span className="truncate text-stone-400">
                                      • {thread.crop}
                                    </span>
                                  )}
                                </div>

                                {/* Last message snippet */}
                                <div className="flex items-center justify-between gap-2 mt-1">
                                  <p className={`text-[11px] truncate leading-tight ${
                                    thread.unread ? 'font-semibold text-stone-900' : 'text-stone-500'
                                  }`}>
                                    {lastMsg?.sender === 'expert' ? 'Bạn: ' : ''}
                                    {lastMsg?.text || (hasPhoto ? '[Đã gửi ảnh hiện trường]' : '')}
                                  </p>

                                  {thread.unread ? (
                                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="Tin mới" />
                                  ) : thread.status === 'PENDING' ? (
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80 shrink-0" title="Chờ phản hồi" />
                                  ) : null}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Right Column: Active Messenger Conversation View */}
                  {(() => {
                    const activeThread =
                      chatThreads.find((t) => t.id === selectedThreadId) ||
                      chatThreads[0];

                    if (!activeThread) return null;

                    const isAdminThread = activeThread.role === 'admin' || activeThread.category === 'admin' || /Ban Quản Trị|Admin/i.test(activeThread.customerName || '');
                    const isWorkerThread = activeThread.role === 'worker' || activeThread.category === 'worker';
                    const isPreRental = isPreRentalThread(activeThread);

                    return (
                      <div className={`flex-1 flex flex-col bg-white min-w-0 ${
                        !mobileShowChat ? 'hidden md:flex' : 'flex'
                      }`}>
                        
                        {/* Messenger Top Header */}
                        <div className="px-5 py-3.5 border-b border-stone-200/80 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Back button for mobile */}
                            <button
                              onClick={() => setMobileShowChat(false)}
                              className="md:hidden p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 cursor-pointer"
                            >
                              <ArrowLeft className="w-5 h-5" />
                            </button>

                            <div className="relative shrink-0">
                              <img
                                src={getSafeAvatar(activeThread.customerAvatar, activeThread.role)}
                                alt={activeThread.customerName}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = getSafeAvatar(null, activeThread.role);
                                }}
                                className="w-10 h-10 rounded-full object-cover ring-1 ring-stone-900/10"
                              />
                              {activeThread.isOnline && (
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-stone-900 text-sm tracking-tight truncate">
                                  {activeThread.customerName}
                                </h4>
                                {isAdminThread ? (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 ring-1 ring-purple-600/20">
                                    Ban Quản Trị
                                  </span>
                                ) : isWorkerThread ? (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 ring-1 ring-amber-600/20">
                                    CVLĐ Hiện Trường
                                  </span>
                                ) : (
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ${
                                    activeThread.status === 'PENDING'
                                      ? 'bg-rose-50 text-rose-700 ring-rose-600/20'
                                      : 'bg-emerald-50 text-emerald-800 ring-emerald-600/20'
                                  }`}>
                                    {activeThread.status === 'PENDING' ? 'Chưa phản hồi' : 'Đã phản hồi'}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-stone-500 truncate mt-0.5 font-normal">
                                {isAdminThread
                                  ? 'Ban Quản Trị Hệ Thống • Trao đổi nghiệp vụ & Điều phối nội bộ'
                                  : isWorkerThread
                                    ? `Nhân viên hiện trường • Thửa ${formatPlotCode(activeThread.plotCode || 'P-01')}`
                                    : isPreRental
                                      ? `Khách quan tâm • ${activeThread.crop || 'Tư vấn nông học'}`
                                      : `Khách thuê • Giống: ${activeThread.crop || 'Chuẩn VietGAP'} • Thửa ${formatPlotCode(activeThread.plotCode || 'P-01')}`}
                              </p>
                            </div>
                          </div>

                          {/* Right Action: Single SSOT Button (Không hiển thị khi chat với Ban Quản Trị) */}
                          {!isAdminThread && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenDirectTaskModal(activeThread, chatInputText)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                                title={isWorkerThread ? `Giao nhiệm vụ trực tiếp cho ${activeThread.customerName}` : "Tạo lệnh giao nhiệm vụ hiện trường cho CVLĐ phụ trách thửa đất này"}
                              >
                                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                                <span>{isWorkerThread ? `Giao việc cho ${activeThread.customerName.replace(/\s*\(.*\)/, '').trim().split(' ').slice(-1)[0] || 'CVLĐ'}` : 'Giao việc cho CVLĐ'}</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Messenger Chat History Viewport */}
                        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-[#FAF9F6]">
                          
                          {/* Date separator */}
                          <div className="flex items-center justify-center my-1">
                            <span className="text-[10px] font-medium text-stone-400 bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-stone-200/60 shadow-2xs">
                              Hôm nay • Trao đổi với {activeThread.customerName}
                            </span>
                          </div>

                          {/* Message Bubbles */}
                          {(activeThread?.messages || []).map((msg) => {
                            const isExpert = msg.sender === 'expert' ||
                              msg.senderRole === 'EXPERT' ||
                              Number(msg.senderId) === 2 ||
                              Number(msg.senderId) === 5 ||
                              String(msg.senderName || '').includes('Nguyễn Hoàng Nam') ||
                              String(msg.senderName || '').includes('Chuyên gia');

                            if (isExpert) {
                              return (
                                <div key={msg.id} className="flex flex-col items-end space-y-1 max-w-[85%] sm:max-w-[72%] ml-auto">
                                  {msg.prescriptionTag && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                                      <ShieldCheck className="w-3 h-3 text-emerald-700" />
                                      {msg.prescriptionTag}
                                    </span>
                                  )}

                                  <div className="px-4 py-2.5 rounded-2xl rounded-tr-xs bg-emerald-800 text-white text-xs sm:text-sm leading-relaxed shadow-xs">
                                    {msg.text}
                                  </div>

                                  <span className="text-[10px] text-stone-400 px-1 font-mono">
                                    {msg.time}
                                  </span>
                                </div>
                              );
                            }

                            // Customer or Worker message
                            return (
                              <div key={msg.id} className="flex items-start gap-2.5 max-w-[88%] sm:max-w-[75%]">
                                <img
                                  src={getSafeAvatar(msg.senderAvatar || activeThread.customerAvatar, activeThread.role)}
                                  alt={msg.senderName || activeThread.customerName}
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = getSafeAvatar(null, activeThread.role);
                                  }}
                                  className="mt-0.5 h-7 w-7 shrink-0 rounded-full ring-1 ring-stone-900/10 object-cover"
                                />

                                <div className="space-y-1 flex-1">
                                  <div className="text-[11px] text-stone-500 font-medium px-0.5 flex items-center gap-1.5">
                                    <span className="text-stone-800 font-semibold">
                                      {msg.senderName && msg.senderName !== 'Người dùng Farmely' ? msg.senderName : activeThread.customerName}
                                    </span>
                                    <span className="text-stone-400 font-mono text-[10px]">({msg.time})</span>
                                  </div>

                                  {/* Attached Plant Photo (Clickable Lightbox) */}
                                  {msg.photoUrl && (
                                    <div
                                      onClick={() =>
                                        setLightboxPhoto({
                                          url: msg.photoUrl,
                                          caption: msg.photoCaption,
                                          customerName: activeThread.customerName,
                                          plotName: activeThread.plotName
                                        })
                                      }
                                      className="relative group cursor-pointer overflow-hidden rounded-xl border border-stone-200 shadow-xs max-w-xs sm:max-w-sm bg-black/5 hover:border-emerald-600 transition-all"
                                    >
                                      <img
                                        src={msg.photoUrl}
                                        alt={msg.photoCaption || 'Ảnh hiện trường'}
                                        onError={(e) => {
                                          e.currentTarget.onerror = null;
                                          e.currentTarget.src = 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&w=800&q=80';
                                        }}
                                        className="w-full h-40 sm:h-48 object-cover transition-transform duration-300 group-hover:scale-102"
                                      />
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1.5">
                                        <ZoomIn className="w-4 h-4" />
                                        <span>Phóng to phân tích</span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Text Bubble */}
                                  {msg.text && (
                                    <div className="px-4 py-2.5 rounded-2xl rounded-tl-xs bg-white text-stone-800 text-xs sm:text-sm leading-relaxed border border-stone-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                                      {msg.text}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Quick Prescriptions Suggestion Bar (Chỉ hiển thị cho Khách thuê hoặc CVLĐ, ẩn khi chat với Admin) */}
                        {!isAdminThread && !isPreRental && (
                          <div className="px-4 py-2 bg-stone-50/70 border-t border-stone-200/70 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
                            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              {isWorkerThread ? 'Chỉ đạo:' : 'Gợi ý:'}
                            </span>
                            {quickPrescriptions.map((item, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setChatInputText(item.text)}
                                className="px-2.5 py-1 rounded-md bg-white hover:bg-emerald-50/80 hover:text-emerald-900 border border-stone-200 text-[11px] font-medium text-stone-700 transition-colors shrink-0 shadow-2xs cursor-pointer"
                                title="Chèn nội dung hướng dẫn vào khung chat"
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Messenger Chat Input Footer */}
                        <form
                          onSubmit={handleSendCustomerMessage}
                          className="p-3 sm:p-4 bg-white border-t border-stone-200/70 flex items-end gap-2 shrink-0"
                        >
                          <div className="flex-1 bg-stone-50/80 rounded-xl border border-stone-200 focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-600/10 transition-all p-2 flex flex-col gap-1">
                            <textarea
                              ref={chatInputRef}
                              rows={2}
                              value={chatInputText}
                              onChange={(e) => setChatInputText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendCustomerMessage();
                                }
                              }}
                              placeholder={
                                isAdminThread
                                  ? `Soạn trao đổi công việc với Ban Quản Trị Farmely... (Enter để gửi)`
                                  : isWorkerThread
                                    ? `Soạn chỉ đạo kỹ thuật cho ${activeThread.customerName}... (Enter để gửi)`
                                    : `Soạn tư vấn kỹ thuật hoặc chỉ đạo cho ${activeThread.customerName}... (Enter để gửi)`
                              }
                              className="w-full bg-transparent border-0 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none resize-none px-1"
                            />
                            
                            <div className="flex items-center justify-between pt-1 border-t border-stone-200/40 px-1 text-stone-400">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setChatInputText(prev => prev + ' 🌿 [Kèm tài liệu hướng dẫn kỹ thuật chuẩn VietGAP]');
                                  }}
                                  className="text-stone-400 hover:text-emerald-700 transition-colors cursor-pointer p-1 rounded hover:bg-stone-100"
                                  title="Đính kèm tài liệu quy trình"
                                >
                                  <Paperclip className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setChatInputText(prev => prev + ' 🌱 [Chứng nhận VietGAP số 2026-VGAP-01]');
                                  }}
                                  className="text-stone-400 hover:text-emerald-700 transition-colors cursor-pointer p-1 rounded hover:bg-stone-100"
                                  title="Chứng nhận VietGAP"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <span className="text-[10px] text-stone-400 hidden sm:inline">
                                Nhấn <strong>Enter</strong> để gửi
                              </span>
                            </div>
                          </div>

                          <Button
                            type="submit"
                            variant="primary"
                            size="md"
                            disabled={!chatInputText.trim()}
                            className="font-semibold h-[64px] px-4 rounded-xl shadow-xs shrink-0 bg-emerald-700 hover:bg-emerald-800"
                          >
                            <Send className="w-4 h-4 mr-1" />
                            <span>Gửi</span>
                          </Button>
                        </form>

                      </div>
                    );
                  })()}

                </div>

              </div>
            )}

            {/* TAB: THỬA ĐẤT GIÁM SÁT KỸ THUẬT (BR24) */}
            {activeTab === 'plots' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border/60 pb-4">
                  <div>
                    <h3 className="font-heading font-black text-xl text-brand-dark flex items-center gap-2">
                      <Layers className="w-5 h-5 text-sky-700" />
                      <span>Thửa Đất Giám Sát Kỹ Thuật</span>
                    </h3>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Danh sách các thửa đất canh tác do Ban Quản Trị chỉ định cho Chuyên Gia Nông Nghiệp phụ trách chuyên môn.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-sky-800 bg-sky-50 px-3 py-1 rounded-full border border-sky-200 self-start sm:self-auto">
                    {assignedPlots.length} Thửa Được Phân Công
                  </span>
                </div>

                <div className="space-y-4">
                  {assignedPlots.length === 0 ? (
                    <div className="text-center py-12 text-stone-500 space-y-2">
                      <Layers className="w-10 h-10 mx-auto text-stone-300" />
                      <p className="font-bold text-sm">Chưa có thửa đất nào được phân công</p>
                    </div>
                  ) : (
                    assignedPlots.map((plot) => (
                      <div
                        key={plot.id || plot.rentalId}
                        className="p-5 rounded-2xl border border-brand-border bg-white hover:border-sky-300 transition-all shadow-2xs space-y-3 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border/60 pb-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-sky-800 text-sm">{plot.plotCode}</span>
                            <span className="font-bold text-brand-dark text-sm">{plot.name}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-100 text-stone-700">
                              {plot.contractCode}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                              🔬 CGNN Phụ trách: {plot.expertName || 'ThS. Nguyễn Hoàng Nam'}
                            </span>
                            {plot.staffName && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                👷 CVLĐ Phụ trách: {plot.staffName}
                              </span>
                            )}
                          </div>

                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ● Đang canh tác
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-stone-600 bg-stone-50/70 p-3.5 rounded-xl border border-stone-200/60">
                          <div>
                            <span className="text-[10px] text-stone-400 uppercase font-bold block">Khách Hàng Thuê:</span>
                            <span className="font-bold text-brand-dark text-xs block">{plot.renterName}</span>
                            <span className="text-[11px] text-stone-500">{plot.renterEmail || 'Khách thuê'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-400 uppercase font-bold block">Giống Canh Tác:</span>
                            <span className="font-bold text-emerald-800 text-xs block">{plot.crop}</span>
                            <span className="text-[11px] text-stone-500">{plot.stage}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-400 uppercase font-bold block">Tiến Độ Mùa Vụ:</span>
                            <span className="font-bold text-brand-dark text-xs block">Ngày {plot.currentDay} / {plot.totalDays} ({plot.progressPercent}%)</span>
                            <div className="w-full bg-stone-200 rounded-full h-1.5 mt-1">
                              <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${plot.progressPercent}%` }}></div>
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-400 uppercase font-bold block">Trạm Quan Trắc IoT:</span>
                            <span className="font-bold text-sky-800 text-xs block">{plot.temp} • Ẩm: {plot.soilMoisture}</span>
                            <span className="text-[10px] text-emerald-700 font-semibold">Tự động hoãn tưới nếu ẩm &gt;= 80% (BR18)</span>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setActiveTab('chat');
                            }}
                            className="font-bold text-xs gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Mở Kênh Tư Vấn 1-1 Với Khách</span>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: DUYỆT KẾ HOẠCH THU HOẠCH & NGHIỆM THU */}
            {activeTab === 'harvest' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border/60 pb-4">
                  <div>
                    <h3 className="font-heading font-black text-xl text-brand-dark flex items-center gap-2">
                      <Wheat className="w-5 h-5 text-emerald-700" />
                      <span>Thẩm Định & Duyệt Kế Hoạch Thu Hoạch (Chuẩn VietGAP)</span>
                    </h3>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Tiếp nhận yêu cầu thu hoạch từ khách hàng, kiểm tra thời gian cách ly sinh học (PHI) và ban hành lệnh điều phối thu hái cho Chuyên viên lao động.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      {pendingHarvestCount} Yêu Cầu Chờ Duyệt
                    </span>
                  </div>
                </div>

                {/* Toast Notification */}
                {harvestSuccessToast && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{harvestSuccessToast}</span>
                  </div>
                )}

                {/* Filter Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-50 p-2 rounded-2xl border border-stone-200/60">
                  <div className="flex flex-wrap gap-1">
                    {[
                      { id: 'ALL', label: 'Tất cả yêu cầu', count: harvestRequests.length },
                      { id: 'PENDING', label: 'Chờ thẩm định', count: pendingHarvestCount },
                      { id: 'APPROVED', label: 'Đã duyệt lệnh', count: harvestRequests.filter(r => r.status === 'APPROVED').length },
                      { id: 'COMPLETED', label: 'Đã hoàn tất', count: harvestRequests.filter(r => r.status === 'COMPLETED').length }
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setHarvestFilter(f.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          harvestFilter === f.id
                            ? 'bg-white text-emerald-800 shadow-2xs border border-emerald-200'
                            : 'text-stone-500 hover:text-brand-dark'
                        }`}
                      >
                        {f.label} ({f.count})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Request List */}
                <div className="space-y-4">
                  {filteredHarvestRequests.length === 0 ? (
                    <div className="text-center py-12 text-stone-500 space-y-2">
                      <Wheat className="w-10 h-10 mx-auto text-stone-300" />
                      <p className="font-bold text-sm">Không có yêu cầu thu hoạch nào trong danh mục này</p>
                    </div>
                  ) : (
                    filteredHarvestRequests.map((req) => {
                      const isPending = req.status === 'PENDING' || req.status === 'PENDING_CONFIRM';
                      const isApproved = req.status === 'APPROVED';
                      const isCompleted = req.status === 'COMPLETED';
                      const isPostponed = req.status === 'POSTPONED';
                      const isPhiSafe = (req.phiDays || 6) >= (req.phiStandardDays || 5);

                      return (
                        <div
                          key={req.id}
                          className="p-5 sm:p-6 rounded-2xl border border-brand-border bg-white hover:border-emerald-300 transition-all shadow-2xs space-y-4 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border/60 pb-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-bold text-emerald-800 text-sm">{req.plotCode}</span>
                              <span className="font-bold text-brand-dark text-sm">{req.plotName}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-100 text-stone-700">
                                {req.id}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                🌱 Giống: {req.crop}
                              </span>
                            </div>

                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                              isApproved
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : isCompleted
                                ? 'bg-sky-100 text-sky-800 border-sky-300'
                                : isPostponed
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {isApproved ? '● Đã duyệt lịch · Đang điều phối CVLĐ'
                                : isCompleted ? '✓ Đã hoàn tất thu hoạch & nghiệm thu'
                                : isPostponed ? '⚠ Đã yêu cầu hoãn cách ly'
                                : '⏳ Chờ Kỹ sư thẩm định VietGAP'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-stone-50/70 p-4 rounded-xl border border-stone-200/60">
                            {/* Cột 1: Khách hàng & Ngày hẹn */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] text-stone-400 uppercase font-bold block">Khách Hàng & Lịch Hẹn:</span>
                              <p className="font-bold text-brand-dark text-xs">{req.renterName}</p>
                              <p className="text-stone-500 text-[11px] flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                                Ngày thu hoạch đề xuất: <strong>{req.requestedDate}</strong>
                              </p>
                              <p className="text-stone-500 text-[11px] flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-stone-400" />
                                Hình thức: <strong>{req.methodLabel || req.method}</strong>
                              </p>
                              {req.address && (
                                <p className="text-stone-500 text-[11px] truncate flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                  <span>{req.address}</span>
                                </p>
                              )}
                            </div>

                            {/* Cột 2: Tiêu chuẩn an toàn VietGAP (PHI) */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] text-stone-400 uppercase font-bold block">Thẩm Định VietGAP (PHI):</span>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                                  isPhiSafe ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  Cách ly PHI: {req.phiDays || 6} / {req.phiStandardDays || 5} ngày
                                </span>
                                {isPhiSafe ? (
                                  <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-0.5">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Đạt chuẩn an toàn
                                  </span>
                                ) : (
                                  <span className="text-rose-700 font-bold text-[11px] flex items-center gap-0.5">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Chưa đủ thời gian cách ly
                                  </span>
                                )}
                              </div>
                              <p className="text-stone-500 text-[11px]">
                                Độ ẩm đất hiện tại: <strong className="text-sky-800">68%</strong> (Đất ráo, đủ điều kiện hái)
                              </p>
                              {req.notes && (
                                <p className="text-stone-600 italic text-[11px] bg-white p-2 rounded-lg border border-stone-200">
                                  "{req.notes}"
                                </p>
                              )}
                              {isPostponed && req.postponeReason && (
                                <p className="text-amber-800 font-semibold text-[11px] bg-amber-50 p-2 rounded-lg border border-amber-200">
                                  Lý do hoãn: {req.postponeReason}
                                </p>
                              )}
                            </div>

                            {/* Cột 3: Trạng thái & Điều phối CVLĐ */}
                            <div className="space-y-1.5 md:border-l md:border-stone-200/80 md:pl-4">
                              <span className="text-[10px] text-stone-400 uppercase font-bold block">Điều Phối Thực Địa:</span>
                              <p className="text-stone-600 text-[11px]">
                                CVLĐ đảm nhiệm: <strong>{req.workerName || 'Trần Văn Lực (CVLĐ)'}</strong>
                              </p>
                              <p className="text-stone-600 text-[11px]">
                                Sản lượng ước tính: <strong>{req.expectedYield || 'Theo mùa vụ'}</strong>
                              </p>
                              {isCompleted && req.actualYield && (
                                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-[11px]">
                                  Thực thu: {req.actualYield} (Đã cân & chụp ảnh hiện trường)
                                </div>
                              )}
                              {isApproved && (
                                <div className="text-[11px] text-emerald-800 font-semibold">
                                  ✓ Đã duyệt ngày {req.approvedAt ? new Date(req.approvedAt).toLocaleDateString('vi-VN') : 'hôm nay'}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Hành động của Kỹ Sư */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-brand-border/40">
                            <span className="text-[11px] text-stone-400">
                              Người thẩm định chuyên môn: <strong>{expertSenderName}</strong>
                            </span>

                            <div className="flex flex-wrap items-center gap-2">
                              {isPending && (
                                <>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                      setPostponeModalReq(req);
                                      setPostponeReason('Cần ngưng bón dinh dưỡng thêm 2 ngày để đảm bảo độ ngọt và chỉ số an toàn PHI.');
                                    }}
                                    className="text-xs font-bold text-amber-800 hover:bg-amber-50 gap-1.5"
                                  >
                                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                                    <span>Yêu Cầu Hoãn Hái</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApproveHarvest(req.id)}
                                    className="text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Phê Duyệt Lịch Thu Hoạch</span>
                                  </Button>
                                </>
                              )}

                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setActiveTab('chat');
                                }}
                                className="text-xs font-bold gap-1.5 text-stone-700"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Trao Đổi 1-1 Với Khách</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: FIELD ISSUES (Chẩn đoán sự cố hiện trường do công nhân gửi - UC12 / UC48) */}
            {activeTab === 'issues' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-6">
                <div>
                  <h3 className="font-heading font-black text-xl text-brand-dark">
                    Xử Lý Báo Cáo Sự Cố Hiện Trường (UC12 / UC48)
                  </h3>
                  <p className="text-xs text-brand-muted mt-0.5">
                    Tiếp nhận ảnh chụp và phản ánh từ Chuyên viên lao động hiện trường để chẩn đoán sâu và ban hành chỉ đạo can thiệp kỹ thuật.
                  </p>
                </div>

                <div className="space-y-4">
                  {fieldIssues.map((issue) => (
                    <div
                      key={issue.id}
                      onClick={() => handleOpenIssueDetail(issue)}
                      className="p-5 rounded-2xl border border-brand-border bg-white hover:border-emerald-500 hover:shadow-md transition-all space-y-4 text-xs cursor-pointer group"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border/60 pb-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-brand-green text-sm group-hover:text-emerald-700 transition">
                            {issue.issueCode || issue.id}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            issue.urgency === 'HIGH' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-stone-100 text-stone-700'
                          }`}>
                            {issue.urgency === 'HIGH' ? '⚡ Khẩn cấp' : '🌱 Bình thường'}
                          </span>
                          <span className="text-stone-400">• {issue.reportedTime}</span>
                          {issue.expertName && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                              🔬 Phụ trách: {issue.expertName}
                            </span>
                          )}
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          issue.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : issue.assignedTaskCode
                            ? 'bg-sky-100 text-sky-800 border border-sky-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {issue.status === 'RESOLVED'
                            ? '✓ Đã ban hành phác đồ'
                            : issue.assignedTaskCode
                            ? '⚡ Đã giao nhiệm vụ'
                            : '⏳ Chờ chẩn đoán'}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        <div className="relative shrink-0 overflow-hidden rounded-xl border border-brand-border group-hover:border-emerald-400 transition">
                          <img
                            src={issue.photoUrl}
                            alt="Ảnh hiện trường"
                            className="w-32 h-24 object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 flex items-center justify-center transition">
                            <span className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-white bg-black/75 px-2 py-0.5 rounded-full transition">
                              👁️ Xem chi tiết
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5 flex-1">
                          <h4 className="font-bold text-brand-dark text-sm group-hover:text-emerald-900 transition flex items-center gap-1.5">
                            <span>{issue.issueType}</span>
                          </h4>
                          <p className="text-stone-600">
                            Thửa đất: <strong className="text-brand-dark">{issue.plotName} ({issue.plotCode})</strong> • Báo cáo bởi: <strong>{issue.workerName}</strong>
                          </p>
                          <p className="text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-brand-border/60 italic">
                            "{issue.description}"
                          </p>
                          {issue.diagnosis && (
                            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                              <strong>Chỉ đạo của chuyên gia:</strong> {issue.diagnosis}
                            </div>
                          )}
                          {issue.assignedTaskCode && (
                            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-rose-900 text-xs">
                              <CheckCircle2 className="h-4 w-4 text-rose-600" />
                              <strong>Đã giao {issue.assignedTaskCode}</strong>
                              <span>cho {issue.workerName}</span>
                              {issue.assignedDueDate ? <span className="ml-auto font-bold">Hạn {issue.assignedDueDate}</span> : null}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-brand-border/60">
                        <span className="text-[11px] text-stone-400 group-hover:text-emerald-700 font-medium flex items-center gap-1 transition">
                          <Eye className="w-3.5 h-3.5" />
                          Bấm vào thẻ để xem chi tiết ảnh, trạm IoT & giao nhiệm vụ
                        </span>

                        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenIssueDetail(issue)}
                            className="font-bold text-xs gap-1.5 border-brand-border hover:bg-stone-50"
                          >
                            <Eye className="w-3.5 h-3.5 text-stone-600" />
                            Xem Chi Tiết Lỗi
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenIssueDetail(issue)}
                            className="font-bold text-xs gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                            {issue.assignedTaskCode ? 'Giao Thêm Task' : 'Giao Việc CVLĐ'}
                          </Button>
                          {issue.status !== 'RESOLVED' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setSelectedIssueToDiagnose(issue);
                                setDiagnosisAdvice(issue.diagnosis || '');
                              }}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-1"
                            >
                              Chẩn Đoán Nhanh
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: VIETGAP PROCESS TEMPLATES (Quản lý Phác đồ canh tác chuẩn VietGAP - UC09) */}
            {activeTab === 'templates' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/60 pb-4">
                  <div>
                    <h3 className="font-heading font-black text-xl text-brand-dark">
                      Quy Trình Canh Tác Chuẩn VietGAP (UC09)
                    </h3>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Danh mục phác đồ tiêu chuẩn cho từng giống cây, phân định ngày tuổi, mốc bón phân vi sinh và cách ly an toàn.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsCreateTemplateOpen(true)}
                    className="font-bold gap-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <span>+ Soạn Thảo Quy Trình Mới</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  {processTemplates.map((tmpl) => (
                    <div
                      key={tmpl.id}
                      className="p-5 rounded-2xl border border-brand-border bg-stone-50/60 hover:bg-white transition-all space-y-3.5 shadow-xs flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-brand-green bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                              {tmpl.code}
                            </span>
                            <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                              {tmpl.version}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteTemplate(tmpl.id)}
                            title="Xóa quy trình chuẩn"
                            className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div>
                          <h4 className="font-bold text-brand-dark text-base">{tmpl.name}</h4>
                          <p className="text-stone-500 text-[11px] mt-0.5">
                            Giống cây: <strong className="text-stone-800">{tmpl.variety}</strong> • Chu kỳ: <strong className="text-brand-green">{tmpl.durationDays} ngày</strong>
                          </p>
                        </div>

                        <p className="text-stone-600 text-xs leading-relaxed">
                          {tmpl.description}
                        </p>

                        {/* Step roadmap summary pills */}
                        <div className="pt-2 border-t border-brand-border/60">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                            Lộ trình các mốc kỹ thuật:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {(tmpl.steps || []).map((st, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded text-[10px] font-medium bg-white text-stone-700 border border-brand-border"
                              >
                                Ngày {st.day}: {st.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-brand-border/60 flex items-center justify-between">
                        <span className="text-[11px] text-emerald-800 font-bold">
                          ✓ Đang áp dụng tại hệ thống Farmely
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setViewTemplateDetail(tmpl)}
                          className="font-bold text-xs cursor-pointer"
                        >
                          Xem Chi Tiết Quy Trình →
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: SOIL-CROP COMPATIBILITY MATRIX (Ma trận tương thích thổ nhưỡng - cây trồng) */}
            {activeTab === 'compatibility' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/60 pb-4">
                  <div>
                    <h3 className="font-heading font-black text-xl text-brand-dark">
                      Ma Trận Tương Thích Thổ Nhưỡng – Giống Cây Trồng
                    </h3>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Căn cứ khoa học nông học để hệ thống tự động gợi ý giống cây phù hợp nhất khi khách hàng chọn thuê thửa đất.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsAddCompatibilityOpen(true)}
                    className="font-bold gap-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <span>+ Thêm Cấu Hình Thổ Nhưỡng</span>
                  </Button>
                </div>

                <div className="space-y-4">
                  {compatibilityList.map((comp) => (
                    <div
                      key={comp.id}
                      className="p-5 sm:p-6 rounded-2xl border border-brand-border bg-white shadow-xs space-y-4 text-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-border/60 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-brand-green text-sm">{comp.id}</span>
                            <h4 className="font-bold text-brand-dark text-base">{comp.soilType}</h4>
                          </div>
                          <p className="text-stone-500 text-[11px] mt-0.5">
                            Áp dụng tại: <strong>{comp.plotsApplied}</strong>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                            {comp.phRange}
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200">
                            {comp.moistureProfile}
                          </span>
                        </div>
                      </div>

                      {/* Compatible Crops Grid */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                          Giống Cây Trồng Tương Thích Tối Ưu:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {(comp.compatibleCrops || []).map((c, i) => (
                            <div
                              key={i}
                              className="p-3 rounded-xl bg-stone-50/80 border border-brand-border/70 flex items-center justify-between"
                            >
                              <div className="min-w-0 pr-2">
                                <span className="font-bold text-brand-dark block truncate">{c.crop}</span>
                                <span className="text-[10px] text-emerald-700 font-bold">{c.status}</span>
                              </div>
                              <span className="text-xs font-black text-brand-green px-2 py-0.5 rounded-lg bg-white border border-emerald-100 shadow-2xs">
                                {c.rating}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: KNOWLEDGE LIBRARY & AI RAG (Kho Tri Thức Nông Nghiệp & AI RAG) */}
            {activeTab === 'knowledge' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/60 pb-4">
                  <div>
                    <h3 className="font-heading font-black text-xl text-brand-dark">
                      Kho Tri Thức Nông Nghiệp & AI RAG
                    </h3>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Tài liệu kỹ thuật do chuyên gia biên soạn, được số hóa và nạp vào cơ sở dữ liệu Vector để mô hình AI tự động trả lời tư vấn chính xác.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsAddDocOpen(true)}
                    className="font-bold gap-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <span>+ Nạp Tài Liệu Kỹ Thuật Mới</span>
                  </Button>
                </div>

                {/* AI RAG Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-brand-cream border border-emerald-200 flex items-start gap-3">
                  <Bot className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <span className="font-bold text-brand-dark block">
                      Cơ chế hoạt động của Trí Tuệ Nhân Tạo Nông Nghiệp (Farmely AI Agent):
                    </span>
                    <p className="text-stone-600 leading-relaxed">
                      Mỗi khi chuyên gia tải lên hoặc cập nhật tài liệu chuẩn VietGAP, hệ thống tự động sinh vector embeddings nạp vào kho RAG. Khi khách hàng hỏi đáp trên nền tảng, AI sẽ ưu tiên trích xuất câu trả lời chuẩn xác từ tài liệu của bạn.
                    </p>
                  </div>
                </div>

                {/* Document List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {knowledgeDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-5 rounded-2xl border border-brand-border bg-white shadow-xs space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700">
                            {doc.category}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {doc.aiRagStatus}
                          </span>
                        </div>

                        <h4 className="font-bold text-brand-dark text-sm leading-snug">
                          {doc.title}
                        </h4>

                        <p className="text-stone-500 text-[11px]">
                          Tác giả: <strong>{doc.author}</strong> • Cập nhật: {doc.updatedAt} • {doc.pages} trang
                        </p>

                        <p className="text-stone-600 text-xs bg-stone-50 p-2.5 rounded-xl border border-brand-border/60 leading-relaxed">
                          "{doc.summary}"
                        </p>
                      </div>

                      <div className="pt-2 border-t border-brand-border/60 flex items-center justify-between">
                        <span className="text-stone-400 font-mono text-[11px]">{doc.id}</span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedDocToView(doc)}
                          className="font-bold text-xs cursor-pointer"
                        >
                          Đọc Trích Yếu Kỹ Thuật →
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </section>
        </div>

      </main>

      {/* Lightbox / Plant Photo Inspection Modal */}
      <Modal
        isOpen={Boolean(lightboxPhoto)}
        onClose={() => setLightboxPhoto(null)}
        title="Kính Lúp Nông Học • Phân Tích Hình Ảnh Hiện Trường"
        subtitle={lightboxPhoto ? `${lightboxPhoto.customerName} • ${lightboxPhoto.plotName}` : undefined}
      >
        {lightboxPhoto && (
          <div className="space-y-4 text-xs text-left">
            <div className="relative rounded-2xl overflow-hidden border border-brand-border bg-stone-900 flex items-center justify-center max-h-[380px]">
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.caption || 'Ảnh hiện trường'}
                className="max-h-[380px] w-auto object-contain rounded-xl"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-md text-white p-2.5 rounded-xl text-xs flex items-center justify-between">
                <span>{lightboxPhoto.caption}</span>
                <span className="text-[10px] text-stone-300 font-mono">Độ phân giải 1080p • VietGAP Inspection</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-brand-cream rounded-xl border border-brand-border space-y-1">
                <span className="font-bold text-brand-dark block text-xs flex items-center gap-1.5">
                  <Sprout className="w-3.5 h-3.5 text-brand-green" />
                  Chẩn Đoán Hình Thái Cây:
                </span>
                <p className="text-stone-700 leading-relaxed text-[11px]">
                  Mép lá tầng chân ngả vàng, gân lá còn xanh tươi, không có đốm nấm hay rệp. Phản ánh sinh lý dồn dưỡng chất nuôi hoa non kết hợp độ ẩm đất hơi cao làm chậm thoát hơi nước.
                </p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                <span className="font-bold text-emerald-900 block text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-green" />
                  Khuyến Nghị Kỹ Thuật (VietGAP):
                </span>
                <p className="text-emerald-800 leading-relaxed text-[11px]">
                  Tỉa thoáng lá già tầng gốc dưới 20cm, giảm 30% thời lượng tưới ẩm sáng sớm, bổ sung 400g phân trùn quế quanh gốc kích thích vi sinh.
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-brand-border">
              <span className="text-stone-500 text-[11px]">
                Đưa nội dung chẩn đoán này vào ô chat phản hồi.
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLightboxPhoto(null)}
                >
                  Đóng
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="font-bold"
                  onClick={() => {
                    setChatInputText(
                      'Chào anh/chị! Dựa trên phân tích ảnh lá gửi về, mép lá vàng ở tầng dưới là do cây dồn dưỡng chất cho đợt hoa non và ẩm độ đất hơi cao. Anh/chị nên bấm tỉa bớt lá già sát gốc dưới 20cm cho thông thoáng và giảm 30% thời lượng tưới béc phun nhé!'
                    );
                    setLightboxPhoto(null);
                  }}
                >
                  <Send className="w-3.5 h-3.5 mr-1" />
                  Áp dụng vào khung chat
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Assign issue task to the staff member who reported it */}
      <Modal
        isOpen={Boolean(selectedIssueToAssign)}
        onClose={() => !isAssigningTask && setSelectedIssueToAssign(null)}
        title="Giao nhiệm vụ xử lý"
        subtitle={selectedIssueToAssign ? `${selectedIssueToAssign.issueCode || selectedIssueToAssign.id} · ${selectedIssueToAssign.plotName}` : ''}
      >
        {selectedIssueToAssign && (
          <form onSubmit={handleAssignIssueTask} className="space-y-4 text-left text-xs">
            <div className="grid gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 sm:grid-cols-2">
              <div><span className="text-stone-500">Người thực hiện</span><strong className="mt-1 block text-sm text-brand-dark">{selectedIssueToAssign.workerName}</strong><span className="text-[11px] text-stone-500">Người gửi báo cáo</span></div>
              <div><span className="text-stone-500">Thửa đất</span><strong className="mt-1 block text-sm text-brand-dark">{selectedIssueToAssign.plotName} ({selectedIssueToAssign.plotCode})</strong><span className="mt-1 inline-flex rounded-full bg-rose-100 px-2 py-1 text-[10px] font-black text-rose-700">Sự cố hiện trường</span></div>
            </div>

            {/* Mức độ ưu tiên xử lý */}
            <div>
              <label className="mb-1.5 block font-bold text-brand-dark">Mức độ ưu tiên giao việc *</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTaskAssignment((c) => ({ ...c, priority: 'EMERGENCY' }))}
                  className={`p-2.5 rounded-xl border text-center font-bold transition flex flex-col items-center gap-1 ${
                    taskAssignment.priority === 'EMERGENCY'
                      ? 'border-rose-600 bg-rose-50 text-rose-800 ring-2 ring-rose-500/30'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span className="text-xs font-black text-rose-700">⚡ LÀM NGAY</span>
                  <span className="text-[10px] text-rose-600 font-semibold">Khẩn cấp trong 2h</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTaskAssignment((c) => ({ ...c, priority: 'HIGH' }))}
                  className={`p-2.5 rounded-xl border text-center font-bold transition flex flex-col items-center gap-1 ${
                    taskAssignment.priority === 'HIGH'
                      ? 'border-amber-600 bg-amber-50 text-amber-800 ring-2 ring-amber-500/30'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span className="text-xs font-black text-amber-800">🔥 ƯU TIÊN CAO</span>
                  <span className="text-[10px] text-amber-700 font-semibold">Xử lý trong ngày</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTaskAssignment((c) => ({ ...c, priority: 'NORMAL' }))}
                  className={`p-2.5 rounded-xl border text-center font-bold transition flex flex-col items-center gap-1 ${
                    taskAssignment.priority === 'NORMAL'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/30'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span className="text-xs font-black text-emerald-800">🌱 BÌNH THƯỜNG</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">Theo ca tới</span>
                </button>
              </div>
            </div>

            <label className="block"><span className="mb-1.5 block font-bold text-brand-dark">Tên nhiệm vụ *</span><input required value={taskAssignment.title} onChange={(event) => setTaskAssignment((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-xl border border-brand-border px-3 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
            <label className="block"><span className="mb-1.5 block font-bold text-brand-dark">Hạn hoàn thành *</span><input type="date" required min={new Date().toISOString().slice(0, 10)} value={taskAssignment.dueDate} onChange={(event) => setTaskAssignment((current) => ({ ...current, dueDate: event.target.value }))} className="w-full rounded-xl border border-brand-border px-3 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
            <label className="block"><span className="mb-1.5 block font-bold text-brand-dark">Hướng dẫn thực hiện</span><textarea rows={4} value={taskAssignment.instructions} onChange={(event) => setTaskAssignment((current) => ({ ...current, instructions: event.target.value }))} placeholder="Ghi rõ cách kiểm tra, xử lý và ảnh minh chứng cần chụp..." className="w-full rounded-xl border border-brand-border px-3 py-3 leading-5 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
            <label className="block"><span className="mb-1.5 block font-bold text-brand-dark">Quy trình tham chiếu <span className="font-normal text-stone-400">(không bắt buộc)</span></span><select value={taskAssignment.templateId} onChange={(event) => setTaskAssignment((current) => ({ ...current, templateId: event.target.value }))} className="w-full rounded-xl border border-brand-border bg-white px-3 py-3 outline-none focus:border-emerald-600"><option value="">Không gắn quy trình</option>{processTemplates.map((template) => <option key={template.id} value={template.id}>{template.name} · {template.version}</option>)}</select></label>

            <div className="flex flex-col-reverse gap-2 border-t border-brand-border/60 pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setSelectedIssueToAssign(null)} disabled={isAssigningTask}>Hủy</Button>
              <Button type="submit" variant="primary" disabled={isAssigningTask || !taskAssignment.title.trim() || !taskAssignment.dueDate} className="font-bold"><UserCheck className="mr-1.5 h-4 w-4" />{isAssigningTask ? 'Đang giao...' : 'Giao nhiệm vụ'}</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Chuyên gia sinh task riêng trực tiếp cho Staff từ Hộp thư tư vấn */}
      <Modal
        isOpen={Boolean(directTaskModal)}
        onClose={() => !isSubmittingDirectTask && setDirectTaskModal(null)}
        title={directTaskModal?.isWorkerThread ? `⚡ Chỉ Đạo & Giao Nhiệm Vụ Cho CVLĐ` : `⚡ Phát Lệnh Chỉ Đạo & Giao Task Hiện Trường`}
        subtitle={directTaskModal ? `Chỉ đạo kỹ thuật từ ${expertSenderName} • ${directTaskModal.plotName}` : ''}
      >
        {directTaskModal && (
          <form onSubmit={handleConfirmDirectTask} className="space-y-4 text-left text-xs">
            {/* Box thông tin Thửa đất & Đối tượng trao đổi */}
            <div className="grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3.5 sm:grid-cols-2">
              <div>
                <span className="text-stone-500 font-semibold block text-[11px]">Thửa đất & Cây trồng:</span>
                <strong className="mt-0.5 block text-sm text-emerald-950 font-bold">
                  {directTaskModal.plotName} (Plot {formatPlotCode(directTaskModal.plotCode)})
                </strong>
                <span className="text-[11px] text-emerald-700 font-medium">🌱 Giống: {directTaskModal.crop}</span>
              </div>
              <div>
                <span className="text-stone-500 font-semibold block text-[11px]">
                  {directTaskModal.isWorkerThread ? 'Chuyên viên trao đổi trực tiếp:' : 'Khách hàng trao đổi:'}
                </span>
                <strong className="mt-0.5 block text-sm text-brand-dark font-bold">
                  {directTaskModal.partnerName || directTaskModal.customerName}
                </strong>
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  <ShieldCheck className="w-3 h-3 text-emerald-700" /> {directTaskModal.isWorkerThread ? 'CVLĐ Hiện Trường' : 'Khách Thuê Đất'}
                </span>
              </div>
            </div>

            {/* Chọn Chuyên viên lao động (CVLĐ) phụ trách */}
            <div>
              <label className="mb-1.5 block font-semibold text-stone-900 text-xs">
                {directTaskModal.isWorkerThread ? 'Chuyên viên lao động (CVLĐ) tiếp nhận lệnh này *' : 'Chuyên viên lao động (CVLĐ) tiếp nhận lệnh *'}
              </label>
              <select
                value={directTaskModal.workerId}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const found = availableFieldWorkers.find((w) => w.id === val);
                  setDirectTaskModal((c) => ({
                    ...c,
                    workerId: val,
                    workerName: found ? found.name : c.workerName
                  }));
                }}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
              >
                {availableFieldWorkers.map((w) => (
                  <option key={w.id} value={w.id}>
                    👷 {w.name} - {w.role}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-stone-400 mt-1">
                {directTaskModal.isWorkerThread
                  ? `Đang giao nhiệm vụ trực tiếp cho đồng chí ${directTaskModal.workerName}.`
                  : 'Tự động ưu tiên nhân viên hiện trường được phân công phụ trách thửa đất của khách hàng này.'}
              </p>
            </div>

            {/* Mức độ ưu tiên giao việc */}
            <div>
              <label className="mb-1.5 block font-semibold text-stone-900 text-xs">
                Mức độ ưu tiên giao việc *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDirectTaskModal((c) => ({ ...c, priority: 'EMERGENCY' }))}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                    directTaskModal.priority === 'EMERGENCY'
                      ? 'border-rose-500 bg-rose-50/80 text-rose-800 shadow-xs ring-1 ring-rose-500/20'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span className="text-xs font-bold text-rose-700">⚡ LÀM NGAY</span>
                  <span className="text-[10px] text-rose-600 font-medium">Khẩn cấp trong 2h</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDirectTaskModal((c) => ({ ...c, priority: 'HIGH' }))}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                    directTaskModal.priority === 'HIGH'
                      ? 'border-amber-500 bg-amber-50/80 text-amber-900 shadow-xs ring-1 ring-amber-500/20'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span className="text-xs font-bold text-amber-800">🔥 ƯU TIÊN CAO</span>
                  <span className="text-[10px] text-amber-700 font-medium">Xử lý trong ngày</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDirectTaskModal((c) => ({ ...c, priority: 'NORMAL' }))}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                    directTaskModal.priority === 'NORMAL'
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 shadow-xs ring-1 ring-emerald-600/20'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span className="text-xs font-bold text-emerald-800">🌱 BÌNH THƯỜNG</span>
                  <span className="text-[10px] text-emerald-700 font-medium">Theo ca tới</span>
                </button>
              </div>
            </div>

            {/* Tiêu đề nhiệm vụ */}
            <label className="block">
              <span className="mb-1.5 block font-semibold text-stone-900 text-xs">Tiêu đề nhiệm vụ thực địa *</span>
              <input
                required
                value={directTaskModal.title}
                onChange={(e) => setDirectTaskModal((c) => ({ ...c, title: e.target.value }))}
                placeholder="VD: Phun thảo mộc gừng ớt 1:200 phòng bọ trĩ"
                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-stone-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
              />
            </label>

            {/* Hạn hoàn thành */}
            <label className="block">
              <span className="mb-1.5 block font-semibold text-stone-900 text-xs">Hạn hoàn thành *</span>
              <input
                type="date"
                required
                min={new Date().toISOString().slice(0, 10)}
                value={directTaskModal.dueDate}
                onChange={(e) => setDirectTaskModal((c) => ({ ...c, dueDate: e.target.value }))}
                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-stone-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
              />
            </label>

            {/* Hướng dẫn kỹ thuật */}
            <label className="block">
              <span className="mb-1.5 block font-semibold text-stone-900 text-xs">Hướng dẫn kỹ thuật & Chỉ đạo thao tác *</span>
              <textarea
                rows={3}
                required
                value={directTaskModal.instructions}
                onChange={(e) => setDirectTaskModal((c) => ({ ...c, instructions: e.target.value }))}
                placeholder="Ghi rõ liều lượng, vị trí xử lý, yêu cầu chụp ảnh nghiệm thu hiện trường..."
                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs text-stone-800 leading-relaxed outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
              />
            </label>

            {/* Quy trình VietGAP tham chiếu */}
            <label className="block">
              <span className="mb-1.5 block font-semibold text-stone-900 text-xs">
                Quy trình tham chiếu <span className="font-normal text-stone-400">(không bắt buộc)</span>
              </span>
              <select
                value={directTaskModal.templateId}
                onChange={(e) => setDirectTaskModal((c) => ({ ...c, templateId: e.target.value }))}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
              >
                <option value="">Không gắn quy trình</option>
                {processTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} · {template.version}
                  </option>
                ))}
              </select>
            </label>

            {/* Checkbox gửi tin nhắn vào hội thoại */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200/80 cursor-pointer">
              <input
                type="checkbox"
                checked={directTaskModal.notifyCustomerInChat}
                onChange={(e) => setDirectTaskModal((c) => ({ ...c, notifyCustomerInChat: e.target.checked }))}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-stone-700 leading-snug">
                <strong className="text-xs">
                  {directTaskModal.isWorkerThread
                    ? 'Gửi thông báo xác nhận nhiệm vụ vào cuộc trò chuyện này'
                    : 'Đồng thời thông báo lệnh giao việc này vào khung chat với khách hàng'}
                </strong>
                <span className="block text-[11px] text-stone-500 mt-0.5">
                  {directTaskModal.isWorkerThread
                    ? `Nhân viên ${directTaskModal.workerName} sẽ nhận được tin nhắn tóm tắt lệnh nhiệm vụ và hạn hoàn thành.`
                    : `Khách hàng (${directTaskModal.customerName}) sẽ thấy thông báo nhiệm vụ đã được giao cho CVLĐ phụ trách thửa đất.`}
                </span>
              </span>
            </label>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-2 border-t border-stone-200/80 pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDirectTaskModal(null)}
                disabled={isSubmittingDirectTask}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmittingDirectTask || !directTaskModal.title.trim() || !directTaskModal.dueDate}
                className="font-semibold px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800"
              >
                <Zap className="mr-1.5 h-4 w-4" />
                {isSubmittingDirectTask ? 'Đang phát lệnh...' : directTaskModal.isWorkerThread ? `Giao nhiệm vụ cho ${directTaskModal.workerName}` : 'Phát lệnh công việc'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL: CHI TIẾT SỰ CỐ HIỆN TRƯỜNG & CHỈ ĐẠO KỸ THUẬT (UC12 / UC48) */}
      <Modal
        isOpen={Boolean(selectedIssueDetail)}
        onClose={() => setSelectedIssueDetail(null)}
        title={`Chi Tiết Báo Cáo Sự Cố Hiện Trường • ${selectedIssueDetail?.issueCode || selectedIssueDetail?.id}`}
        subtitle={`${selectedIssueDetail?.issueType || 'Sự cố'} · ${selectedIssueDetail?.plotName} (${selectedIssueDetail?.plotCode})`}
      >
        {selectedIssueDetail && (
          <div className="space-y-4 text-xs text-left max-h-[78vh] overflow-y-auto pr-1">
            {/* Header info bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-stone-50 rounded-2xl border border-brand-border/70">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-black text-brand-green text-sm">{selectedIssueDetail.issueCode || selectedIssueDetail.id}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedIssueDetail.urgency === 'HIGH' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-stone-200 text-stone-700'
                }`}>
                  {selectedIssueDetail.urgency === 'HIGH' ? '⚡ Mức độ: Khẩn cấp' : '🌱 Mức độ: Bình thường'}
                </span>
                <span className="text-stone-500 text-[11px]">• Gửi lúc: {selectedIssueDetail.reportedTime || 'Hôm nay'}</span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                selectedIssueDetail.status === 'RESOLVED'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : selectedIssueDetail.assignedTaskCode
                  ? 'bg-sky-100 text-sky-800 border border-sky-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                {selectedIssueDetail.status === 'RESOLVED'
                  ? '✓ Đã ban hành phác đồ'
                  : selectedIssueDetail.assignedTaskCode
                  ? '⚡ Đã phát lệnh giao việc'
                  : '⏳ Chờ chuyên gia chẩn đoán'}
              </span>
            </div>

            {/* Bố cục 2 cột */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {/* Cột trái: Ảnh hiện trường & Bối cảnh thửa đất */}
              <div className="space-y-3">
                <div className="rounded-2xl border border-brand-border overflow-hidden bg-stone-900 shadow-inner group relative">
                  <img
                    src={selectedIssueDetail.photoUrl}
                    alt="Ảnh hiện trường"
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-[11px] flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Camera className="w-3.5 h-3.5 text-emerald-400" />
                      Minh chứng thực địa từ hiện trường
                    </span>
                    <span className="text-[10px] text-stone-300">BR16</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border border-brand-border bg-white shadow-2xs space-y-2">
                  <h5 className="font-bold text-brand-dark uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-700" />
                    Bối Cảnh Thửa Đất Canh Tác
                  </h5>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-stone-400 block text-[10px]">Thửa đất:</span>
                      <strong className="text-brand-dark">{selectedIssueDetail.plotName} ({selectedIssueDetail.plotCode})</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px]">Giống cây:</span>
                      <strong className="text-emerald-800">{selectedIssueDetail.cropName || selectedIssueDetail.crop || 'Cà chua bi đỏ F1'}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px]">Người phát hiện:</span>
                      <strong className="text-stone-700">{selectedIssueDetail.workerName || 'Trần Văn Lực (CVLĐ)'}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px]">Chuyên gia phụ trách:</span>
                      <strong className="text-sky-800">{selectedIssueDetail.expertName || 'ThS. Nguyễn Hoàng Nam'}</strong>
                    </div>
                  </div>
                </div>

                {/* IoT Sensor Context */}
                <div className="p-3 rounded-2xl border border-sky-200 bg-sky-50/60 text-sky-950 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-sky-600" />
                    Trạm Vi Khí Hậu IoT Tại Thửa
                  </span>
                  <div className="flex items-center justify-between text-xs font-mono font-bold">
                    <span>🌡️ Nhiệt độ: 28.5°C</span>
                    <span>💧 Độ ẩm đất: 68%</span>
                    <span>💨 Ẩm khí: 74%</span>
                  </div>
                  <p className="text-[10px] text-sky-700">Độ ẩm đất ổn định trong ngưỡng an toàn VietGAP (60-70%).</p>
                </div>
              </div>

              {/* Cột phải: Mô tả hiện trường, Chỉ đạo kỹ thuật và Giao việc */}
              <div className="space-y-3">
                {/* 1. Lời báo cáo của công nhân */}
                <div className="p-3 rounded-2xl border border-amber-200 bg-amber-50/70 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Phản ánh từ hiện trường:
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      {selectedIssueDetail.issueType}
                    </span>
                  </div>
                  <p className="text-xs text-stone-800 italic leading-relaxed bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
                    "{selectedIssueDetail.description}"
                  </p>
                </div>

                {/* 2. Chỉ đạo kỹ thuật của chuyên gia */}
                <div className="p-3 rounded-2xl border border-brand-border bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-brand-dark text-xs flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-700" />
                      Chỉ Đạo Kỹ Thuật Can Thiệp:
                    </label>
                    {selectedIssueDetail.diagnosis && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ Đã có phác đồ
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    value={detailDiagnosisText}
                    onChange={(e) => setDetailDiagnosisText(e.target.value)}
                    placeholder="Nhập phác đồ xử lý (ví dụ: Pha dung dịch thảo mộc tỏi ớt 1:200, phun sương đều 2 mặt lá sau 16:30, ngưng tưới gốc 1 ngày...)"
                    className="w-full p-2.5 rounded-xl border border-brand-border text-xs leading-relaxed focus:ring-2 focus:ring-brand-green/20 outline-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSaveDetailDiagnosis}
                      disabled={!detailDiagnosisText.trim() || isSavingDiagnosis}
                      className="font-bold text-xs gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {isSavingDiagnosis ? 'Đang lưu...' : 'Lưu Chỉ Đạo Kỹ Thuật'}
                    </Button>
                  </div>
                </div>

                {/* 3. Giao nhiệm vụ khắc phục cho CVLĐ (Xong mới giao task) */}
                <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 space-y-2.5">
                  <h5 className="font-bold text-brand-dark text-xs flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-700" />
                    Phân Công Nhiệm Vụ Khắc Phục Hiện Trường Cho CVLĐ
                  </h5>

                  {selectedIssueDetail.assignedTaskCode && (
                    <div className="p-2.5 rounded-xl bg-white border border-emerald-300 text-emerald-900 space-y-1">
                      <div className="flex items-center gap-2 font-bold text-xs text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Đã phát lệnh: {selectedIssueDetail.assignedTaskCode}</span>
                      </div>
                      <p className="text-[11px] text-stone-600">
                        Giao cho: <strong>{selectedIssueDetail.workerName || 'Chuyên viên hiện trường'}</strong> • Hạn: <strong>{selectedIssueDetail.assignedDueDate || 'Trong ca trực'}</strong>
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 bg-white p-3 rounded-xl border border-brand-border/80">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-stone-600 block mb-1">CVLĐ Nhận Lệnh:</label>
                        <select
                          value={detailAssignWorkerId}
                          onChange={(e) => setDetailAssignWorkerId(Number(e.target.value))}
                          className="w-full p-2 rounded-lg border border-brand-border text-xs bg-white font-bold"
                        >
                          {availableFieldWorkers.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name} ({w.role})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-stone-600 block mb-1">Hạn hoàn thành:</label>
                        <input
                          type="date"
                          value={detailDueDate}
                          onChange={(e) => setDetailDueDate(e.target.value)}
                          className="w-full p-2 rounded-lg border border-brand-border text-xs bg-white font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-stone-600 block mb-1">Mức độ ưu tiên giao việc:</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: 'EMERGENCY', label: '⚡ LÀM NGAY', sub: 'Khẩn cấp 2h' },
                          { id: 'HIGH', label: '🔥 ƯU TIÊN CAO', sub: 'Trong ngày' },
                          { id: 'NORMAL', label: '🌱 BÌNH THƯỜNG', sub: 'Ca tới' }
                        ].map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setDetailPriority(p.id)}
                            className={`p-1.5 rounded-lg border text-center transition ${
                              detailPriority === p.id
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-1 ring-emerald-500'
                                : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                            }`}
                          >
                            <div className="text-[10px] leading-tight font-extrabold">{p.label}</div>
                            <div className="text-[9px] text-stone-500">{p.sub}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleDispatchTaskFromDetail}
                      disabled={isDispatchingFromDetail}
                      className="w-full bg-[#064b37] hover:bg-[#085a43] text-white font-bold text-xs py-2.5 gap-1.5 cursor-pointer mt-1"
                    >
                      <UserCheck className="w-4 h-4" />
                      {isDispatchingFromDetail ? 'Đang phát lệnh...' : 'PHÁT LỆNH & GIAO TASK CHO CVLĐ'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-brand-border">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedIssueDetail(null)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(selectedIssueToDiagnose)}
        onClose={() => setSelectedIssueToDiagnose(null)}
        title="Chẩn Đoán & Ban Hành Chỉ Đạo Kỹ Thuật"
        subtitle={selectedIssueToDiagnose?.issueType}
      >
        {selectedIssueToDiagnose && (
          <form onSubmit={handleSendIssueDiagnosis} className="space-y-4 text-xs text-left">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
              <p><strong>Thửa đất:</strong> {selectedIssueToDiagnose.plotName} ({selectedIssueToDiagnose.plotCode})</p>
              <p><strong>Công nhân báo cáo:</strong> {selectedIssueToDiagnose.workerName}</p>
              <p><strong>Mô tả hiện trường:</strong> "{selectedIssueToDiagnose.description}"</p>
            </div>

            <div>
              <label className="block font-bold text-brand-dark mb-1">
                Chỉ Đạo Kỹ Thuật Can Thiệp:
              </label>
              <textarea
                rows={4}
                required
                value={diagnosisAdvice}
                onChange={(e) => setDiagnosisAdvice(e.target.value)}
                placeholder="Ví dụ: Pha dung dịch thảo mộc gừng ớt tỉ lệ 1:200, phun sương đều 2 mặt lá sau 16:30. Ngưng tưới nước lên tán lá 1 ngày..."
                className="w-full p-3 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-green/20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedIssueToDiagnose(null)}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" size="sm" className="font-bold">
                BAN HÀNH CHỈ ĐẠO
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal View Template Detail */}
      <Modal
        isOpen={Boolean(viewTemplateDetail)}
        onClose={() => setViewTemplateDetail(null)}
        title={`Chi Tiết Phác Đồ Canh Tác • ${viewTemplateDetail?.name}`}
        subtitle={`${viewTemplateDetail?.code} • ${viewTemplateDetail?.version}`}
      >
        {viewTemplateDetail && (
          <div className="space-y-4 text-xs text-left">
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900 text-sm">{viewTemplateDetail.variety}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-emerald-800 border border-emerald-300">
                  Chu kỳ: {viewTemplateDetail.durationDays} ngày
                </span>
              </div>
              <p className="text-emerald-800 text-[11px] leading-relaxed">
                {viewTemplateDetail.description}
              </p>
            </div>

            <div>
              <h5 className="font-bold text-brand-dark uppercase tracking-wider text-[11px] mb-2.5">
                Lộ Trình Các Bước Kỹ Thuật Theo Ngày Tuổi:
              </h5>
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                {(viewTemplateDetail?.steps || []).map((st, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-stone-50 border border-brand-border flex items-start gap-3"
                  >
                    <div className="px-2.5 py-1 rounded-lg bg-white border border-brand-border text-center shrink-0">
                      <span className="text-[10px] text-stone-400 block font-bold">MỐC</span>
                      <span className="text-xs font-black text-brand-green">Ngày {st.day}</span>
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-brand-dark">{st.name}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-stone-200/80 text-stone-700">
                          {st.type}
                        </span>
                      </div>
                      <p className="text-stone-600 text-[11px] leading-relaxed">
                        {st.details}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-brand-border">
              <Button variant="primary" size="sm" onClick={() => setViewTemplateDetail(null)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Create New Process Template */}
      <Modal
        isOpen={isCreateTemplateOpen}
        onClose={() => setIsCreateTemplateOpen(false)}
        title="Soạn Thảo Quy Trình Canh Tác Chuẩn VietGAP (UC23)"
        subtitle="Ban hành quy trình kỹ thuật mới cho nông trại Farmely"
      >
        <form onSubmit={handleCreateTemplate} className="space-y-3.5 text-xs text-left max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-brand-dark mb-1">Giống Cây Trồng Áp Dụng:</label>
              <select
                value={newTemplateData.varietyId}
                onChange={(e) => setNewTemplateData({ ...newTemplateData, varietyId: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-brand-border text-xs font-bold bg-white"
              >
                {varietiesList.length > 0 ? (
                  varietiesList.map((v) => (
                    <option key={v.varietyId} value={v.varietyId}>
                      {v.varietyName}
                    </option>
                  ))
                ) : (
                  <>
                    <option value={1}>Cà chua bi Cherry F1</option>
                    <option value={2}>Xà lách Romaine VietGAP</option>
                    <option value={3}>Dưa leo Baby Đà Lạt</option>
                    <option value={4}>Rau mồng tơi hữu cơ</option>
                    <option value={5}>Bắp cải Brussels tí hon</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block font-bold text-brand-dark mb-1">Phiên Bản (Version):</label>
              <input
                type="text"
                value={newTemplateData.version}
                onChange={(e) => setNewTemplateData({ ...newTemplateData, version: e.target.value })}
                placeholder="1.0"
                className="w-full p-2.5 rounded-xl border border-brand-border text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">Mô tả tóm tắt kỹ thuật & cách ly:</label>
            <textarea
              rows={2}
              value={newTemplateData.description}
              onChange={(e) => setNewTemplateData({ ...newTemplateData, description: e.target.value })}
              placeholder="Quy trình chuẩn hóa cách ly dinh dưỡng trước thu hoạch 5 ngày, tưới nhỏ giọt kiểm soát ẩm độ..."
              className="w-full p-2.5 rounded-xl border border-brand-border text-xs"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-brand-dark">Các Bước Quy Trình Kỹ Thuật:</label>
              <button
                type="button"
                onClick={() => {
                  const nextOrder = newTemplateData.steps.length + 1;
                  const lastDay = newTemplateData.steps.length > 0
                    ? Number(newTemplateData.steps[newTemplateData.steps.length - 1].dayOffset) + 10
                    : 10;
                  setNewTemplateData({
                    ...newTemplateData,
                    steps: [
                      ...newTemplateData.steps,
                      {
                        stepOrder: nextOrder,
                        stepName: `Bước ${nextOrder}: Kỹ thuật chăm sóc`,
                        dayOffset: lastDay,
                        description: 'Thực hiện chăm sóc chuẩn VietGAP',
                        materialsNeeded: 'Phân bón sinh học'
                      }
                    ]
                  });
                }}
                className="text-[11px] font-bold text-brand-green hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm Bước Mới
              </button>
            </div>

            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {newTemplateData.steps.map((st, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-stone-50 border border-brand-border space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-brand-dark">Bước #{st.stepOrder}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-stone-500">Mốc Ngày:</span>
                        <input
                          type="number"
                          value={st.dayOffset}
                          onChange={(e) => {
                            const updated = [...newTemplateData.steps];
                            updated[idx].dayOffset = Number(e.target.value);
                            setNewTemplateData({ ...newTemplateData, steps: updated });
                          }}
                          className="w-16 p-1 rounded-lg border border-stone-300 text-center font-bold text-brand-green text-xs"
                        />
                      </div>
                      {newTemplateData.steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = newTemplateData.steps.filter((_, i) => i !== idx).map((step, newIdx) => ({
                              ...step,
                              stepOrder: newIdx + 1
                            }));
                            setNewTemplateData({ ...newTemplateData, steps: updated });
                          }}
                          className="text-stone-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    type="text"
                    required
                    value={st.stepName}
                    onChange={(e) => {
                      const updated = [...newTemplateData.steps];
                      updated[idx].stepName = e.target.value;
                      setNewTemplateData({ ...newTemplateData, steps: updated });
                    }}
                    placeholder="Tên bước (VD: Làm đất, Xuống giống...)"
                    className="w-full p-2 rounded-lg border border-stone-300 text-xs font-semibold"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={st.description}
                      onChange={(e) => {
                        const updated = [...newTemplateData.steps];
                        updated[idx].description = e.target.value;
                        setNewTemplateData({ ...newTemplateData, steps: updated });
                      }}
                      placeholder="Mô tả kỹ thuật..."
                      className="p-1.5 rounded-lg border border-stone-300 text-[11px]"
                    />
                    <input
                      type="text"
                      value={st.materialsNeeded}
                      onChange={(e) => {
                        const updated = [...newTemplateData.steps];
                        updated[idx].materialsNeeded = e.target.value;
                        setNewTemplateData({ ...newTemplateData, steps: updated });
                      }}
                      placeholder="Vật tư vi sinh cần dùng..."
                      className="p-1.5 rounded-lg border border-stone-300 text-[11px]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateTemplateOpen(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmittingTemplate}
              className="font-bold bg-brand-green hover:bg-[#203c2c] text-white"
            >
              {isSubmittingTemplate ? 'Đang lưu...' : 'Lưu & Ban Hành Quy Trình'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Add Soil Compatibility Rule */}
      <Modal
        isOpen={isAddCompatibilityOpen}
        onClose={() => setIsAddCompatibilityOpen(false)}
        title="Thêm Cấu Hình Thổ Nhưỡng – Giống Cây Trồng"
        subtitle="Mở rộng ma trận gợi ý giống cây cho hệ thống"
      >
        <form onSubmit={handleAddCompatibility} className="space-y-3 text-xs text-left">
          <div>
            <label className="block font-bold text-brand-dark mb-1">Loại Đất & Khu Vực Thổ Nhưỡng:</label>
            <input
              type="text"
              required
              placeholder="Đất phù sa sét nhẹ ven sông (Củ Chi Zone B)"
              value={newCompData.soilType}
              onChange={(e) => setNewCompData({ ...newCompData, soilType: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-green/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-brand-dark mb-1">Dải pH Khuyến Nghị:</label>
              <input
                type="text"
                placeholder="pH 6.0 – 6.8"
                value={newCompData.phRange}
                onChange={(e) => setNewCompData({ ...newCompData, phRange: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-green/20"
              />
            </div>
            <div>
              <label className="block font-bold text-brand-dark mb-1">Đặc tính giữ ẩm & thoát nước:</label>
              <input
                type="text"
                placeholder="Thoát nước nhanh, giàu mùn hữu cơ"
                value={newCompData.moistureProfile}
                onChange={(e) => setNewCompData({ ...newCompData, moistureProfile: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-green/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">Các giống cây thích hợp (cách nhau bởi dấu phẩy):</label>
            <textarea
              rows={2}
              placeholder="Cà chua bi Cherry, Xà lách Romaine, Dưa leo Baby, Bạc hà Âu"
              value={newCompData.cropsInput}
              onChange={(e) => setNewCompData({ ...newCompData, cropsInput: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-green/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddCompatibilityOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold">
              Lưu Cấu Hình
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal View Knowledge Document Detail */}
      <Modal
        isOpen={Boolean(selectedDocToView)}
        onClose={() => setSelectedDocToView(null)}
        title={selectedDocToView?.title}
        subtitle={`${selectedDocToView?.id} • ${selectedDocToView?.category}`}
      >
        {selectedDocToView && (
          <div className="space-y-4 text-xs text-left">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
              <div>
                <p><strong>Tác giả:</strong> {selectedDocToView.author}</p>
                <p><strong>Ngày cập nhật:</strong> {selectedDocToView.updatedAt}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                {selectedDocToView.aiRagStatus}
              </span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-brand-border space-y-2">
              <span className="font-bold text-brand-dark block text-xs uppercase tracking-wider text-stone-500">
                Tóm Tắt Kỹ Thuật Số Hóa:
              </span>
              <p className="text-stone-700 leading-relaxed text-xs">
                {selectedDocToView.summary}
              </p>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 leading-relaxed text-[11px]">
              <strong>Trạng thái Vector AI:</strong> Tài liệu đã được cắt thành 42 chunk văn bản và nạp vào pgvector với mô hình embeddings nông nghiệp. Chatbot AI tự động viện dẫn tài liệu này khi người dùng đặt câu hỏi liên quan.
            </div>

            <div className="flex justify-end pt-2 border-t border-brand-border">
              <Button variant="primary" size="sm" onClick={() => setSelectedDocToView(null)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Add Knowledge Document */}
      <Modal
        isOpen={isAddDocOpen}
        onClose={() => setIsAddDocOpen(false)}
        title="Nạp Tài Liệu Kỹ Thuật Nông Nghiệp Vào AI RAG"
        subtitle="Số hóa kiến thức chuẩn VietGAP cho nền tảng"
      >
        <form onSubmit={handleAddDoc} className="space-y-3 text-xs text-left">
          <div>
            <label className="block font-bold text-brand-dark mb-1">Tiêu Đề Tài Liệu:</label>
            <input
              type="text"
              required
              placeholder="Quy Trình Xử Lý Đất Và Khử Trùng Giá Thể Bằng Chế Phẩm Vi Sinh Trichoderma"
              value={newDocData.title}
              onChange={(e) => setNewDocData({ ...newDocData, title: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-green/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-brand-dark mb-1">Danh Mục:</label>
              <select
                value={newDocData.category}
                onChange={(e) => setNewDocData({ ...newDocData, category: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-green/20 bg-white"
              >
                <option value="Tiêu Chuẩn VietGAP">Tiêu Chuẩn VietGAP</option>
                <option value="Bảo Vệ Thực Vật Sinh Học">Bảo Vệ Thực Vật Sinh Học</option>
                <option value="Kỹ Thuật Trồng Nhà Màng">Kỹ Thuật Trồng Nhà Màng</option>
                <option value="Hệ Sinh Thái Nông Trại">Hệ Sinh Thái Nông Trại</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-brand-dark mb-1">Số trang tài liệu:</label>
              <input
                type="number"
                value={newDocData.pages}
                onChange={(e) => setNewDocData({ ...newDocData, pages: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-green/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">Tóm tắt nội dung cốt lõi:</label>
            <textarea
              rows={3}
              required
              placeholder="Tóm tắt phác đồ, liều lượng pha chế, thời điểm tưới và các lưu ý an toàn kỹ thuật..."
              value={newDocData.summary}
              onChange={(e) => setNewDocData({ ...newDocData, summary: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-green/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddDocOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold">
              Tải Lên & Nạp Vector AI
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Hoãn Thu Hoạch & Cách Ly Thêm */}
      <Modal
        isOpen={Boolean(postponeModalReq)}
        onClose={() => setPostponeModalReq(null)}
        title="Yêu Cầu Hoãn Hái & Bổ Sung Cách Ly VietGAP"
        subtitle={postponeModalReq ? `${postponeModalReq.plotCode} · ${postponeModalReq.plotName} (${postponeModalReq.renterName})` : ''}
      >
        <div className="space-y-4 text-xs text-left">
          <p className="text-stone-600">
            Nếu kiểm tra thấy thời gian cách ly phân bón/chế phẩm sinh học (PHI) chưa đủ hoặc thời tiết ẩm ướt gây ảnh hưởng chất lượng bảo quản, chuyên gia có thể chỉ đạo hoãn hái:
          </p>
          <label className="block space-y-1">
            <span className="font-bold text-brand-dark">Lý do chuyên môn và khuyến nghị can thiệp:</span>
            <textarea
              rows={3}
              value={postponeReason}
              onChange={(e) => setPostponeReason(e.target.value)}
              className="w-full p-3 rounded-xl border border-brand-border bg-white text-xs outline-none focus:border-emerald-600"
              placeholder="Nhập lý do hoãn hái và hướng dẫn cách ly..."
            />
          </label>
          <div className="flex justify-end gap-2 pt-2 border-t border-brand-border/60">
            <Button variant="secondary" size="sm" onClick={() => setPostponeModalReq(null)}>
              Hủy
            </Button>
            <Button size="sm" onClick={handleConfirmPostpone} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              Gửi Yêu Cầu Hoãn
            </Button>
          </div>
        </div>
      </Modal>

      <div className={`transition-[margin] duration-200 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'}`}>
        <Footer />
      </div>
    </div>
  );
}
