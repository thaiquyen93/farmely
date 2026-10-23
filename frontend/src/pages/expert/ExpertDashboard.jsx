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
  Phone
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

  // Quick advice recommendations pills
  const quickPrescriptions = [
    {
      label: '💧 Giảm 30% tưới ẩm',
      text: 'Độ ẩm đất 72% đang hơi cao. Nên giảm 30% thời lượng tưới béc phun sương mỗi sáng để bộ rễ thông thoáng, tránh ngập úng gây vàng lá sinh lý.'
    },
    {
      label: '🍅 Tỉa lá già sát gốc',
      text: 'Hiện tượng vàng lá ở tầng chân là sinh lý tự nhiên khi cây tập trung dinh dưỡng nuôi chùm hoa. Bấm tỉa các lá già cách gốc 15-20cm để tạo độ thông thoáng.'
    },
    {
      label: '🌿 Cách ly VietGAP 5 ngày',
      text: 'Đúng chuẩn quy trình VietGAP, ngưng bón phân dinh dưỡng từ hôm nay (cách ngày hái 5 ngày). Chỉ duy trì tưới nước sạch buổi sáng để rau giòn ngọt tự nhiên.'
    },
    {
      label: '🌶️ Phun gừng ớt tỉ lệ 1:200',
      text: 'Pha chế phẩm sinh học thảo mộc gừng ớt tỉ lệ 1:200, phun sương đều 2 mặt lá sau 16:30 lúc trời dịu nắng để phòng ngừa bọ trĩ và rầy mềm.'
    },
    {
      label: '🪱 Bổ sung phân trùn quế',
      text: 'Bón rải 400g phân trùn quế vi sinh quanh gốc (cách gốc 10cm), tưới ẩm nhẹ để kích thích vi sinh vật cố định đạm tự nhiên.'
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
      workerName: 'Trần Văn Lực (CVLĐ)',
      plotCode: 'P-03',
      plotName: 'Thửa Rừng Sác C3',
      urgency: 'HIGH', // 'NORMAL' | 'HIGH' | 'CRITICAL'
      issueType: 'Phát hiện bọ trĩ mặt dưới lá non',
      description: 'Lá dưa leo baby có hiện tượng quăn mép và chấm bạc li ti. Nghi ngờ bị bọ trĩ tấn công do 2 ngày nay trời hanh khô.',
      reportedTime: 'Sáng nay • 08:45',
      photoUrl: '/images/moc-chau-2811.jpg',
      diagnosis: '',
      status: 'PENDING'
    },
    {
      id: 'ISS-889',
      workerName: 'Nguyễn Văn Đạt (CVLĐ)',
      plotCode: 'P-01',
      plotName: 'Thửa Sen Vàng A1',
      urgency: 'NORMAL',
      issueType: 'Đầu béc tưới số 3 bị nghẹt cặn',
      description: 'Đã súc rửa màng lọc và thay béc phun sương mới. Độ ẩm đất đã cân bằng 68%.',
      reportedTime: 'Hôm qua • 16:00',
      photoUrl: '/images/Mucangchai3.jpg',
      diagnosis: 'Chuyên gia Nam duyệt: Đạt yêu cầu kỹ thuật.',
      status: 'RESOLVED'
    }
  ]);

  const [selectedIssueToDiagnose, setSelectedIssueToDiagnose] = useState(null);
  const [diagnosisAdvice, setDiagnosisAdvice] = useState('');
  const [selectedIssueToAssign, setSelectedIssueToAssign] = useState(null);
  const [taskAssignment, setTaskAssignment] = useState({ title: '', dueDate: '', instructions: '', templateId: '' });
  const [isAssigningTask, setIsAssigningTask] = useState(false);

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
        if (Array.isArray(list) && list.length > 0) {
          setAssignedPlots(list.map((p) => ({
            ...p,
            crop: p.varietyName || p.crop || DEFAULT_PLOT_CROPS[p.plotCode] || 'Rau củ chuẩn VietGAP'
          })));
        }
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
      instructions: issue.description || '',
      templateId: ''
    });
  };

  const handleAssignIssueTask = async (event) => {
    event.preventDefault();
    if (!selectedIssueToAssign || !taskAssignment.title.trim() || !taskAssignment.dueDate) return;
    if (!selectedIssueToAssign.rentalId || !selectedIssueToAssign.reportedBy) {
      setDataError('Báo cáo chưa có lượt thuê hoặc người báo cáo để giao nhiệm vụ.');
      return;
    }

    const selectedTemplate = processTemplates.find((template) => String(template.id) === String(taskAssignment.templateId));
    const notes = [
      `[KHẨN CẤP] [${selectedIssueToAssign.issueCode || selectedIssueToAssign.id}] ${taskAssignment.title.trim()}`,
      taskAssignment.instructions.trim(),
      selectedTemplate ? `Quy trình tham chiếu: ${selectedTemplate.name} (${selectedTemplate.version})` : ''
    ].filter(Boolean).join('\n');

    setIsAssigningTask(true);
    try {
      const task = unwrapData(await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          rentalId: selectedIssueToAssign.rentalId,
          taskAssignedTo: selectedIssueToAssign.reportedBy,
          dueDate: taskAssignment.dueDate,
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
            resolutionNotes: `Đã giao nhiệm vụ ${task?.taskCode || ''} cho ${selectedIssueToAssign.workerName}.`,
            markResolved: false
          })
        });
      }
      setFieldIssues((current) => current.map((issue) => issue.id === selectedIssueToAssign.id
        ? { ...issue, assignedTaskCode: task?.taskCode || `TSK-${task?.taskId}`, assignedDueDate: taskAssignment.dueDate, diagnosis: `Đã giao nhiệm vụ cho ${issue.workerName}.` }
        : issue));
      setSelectedIssueToAssign(null);
      setDataError('');
    } catch (error) {
      setDataError(error.message || 'Không thể giao nhiệm vụ cho nhân viên.');
    } finally {
      setIsAssigningTask(false);
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
          id: issue.issueId,
          issueCode: issue.issueCode,
          apiId: issue.issueId,
          rentalId: issue.rentalId,
          reportedBy: issue.reportedBy,
          isStaffReporter: ['STAFF', 'FIELD_WORKER'].includes(String(userById.get(Number(issue.reportedBy))?.role || '').toUpperCase()),
          workerName: issue.reporterName || `Người báo #${issue.reportedBy}`,
          plotCode: issue.plotCode || '',
          plotName: issue.plotName || 'Chưa xác định thửa',
          urgency: String(issue.description || '').includes('[KHẨN CẤP]') ? 'HIGH' : 'NORMAL',
          issueType: issue.issueType,
          description: issue.description,
          reportedTime: issue.createdAt ? new Date(issue.createdAt).toLocaleString('vi-VN') : '',
          photoUrl: issue.imageUrl,
          diagnosis: issue.resolutionNotes || '',
          status: issue.status || issue.displayStatus
        })).sort((first, second) => Number(second.isStaffReporter) - Number(first.isStaffReporter)));
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
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white p-3 rounded-xl border border-brand-border shadow-sm text-center space-y-0.5">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Thửa Đất Giám Sát
            </span>
            <div className="text-2xl font-heading font-black text-brand-dark">
              16 Thửa
            </div>
            <span className="text-[10px] text-emerald-700 font-bold block">100% đạt chuẩn VietGAP</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-brand-border shadow-sm text-center space-y-0.5">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Hộp Thư Cần Phản Hồi
            </span>
            <div className="text-2xl font-heading font-black text-amber-600">
              {chatThreads.filter(c => c.status === 'PENDING').length} Tin nhắn
            </div>
            <span className="text-xs text-amber-700 font-bold block">
              {preRentalCount} khách chưa thuê
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-brand-border shadow-sm text-center space-y-0.5">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Sự Cố Hiện Trường
            </span>
            <div className="text-2xl font-heading font-black text-rose-600">
              {fieldIssues.filter(i => i.status === 'PENDING').length} Cần chỉ đạo
            </div>
            <span className="text-[10px] text-rose-700 font-bold block">Báo cáo từ công nhân</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-brand-border shadow-sm text-center space-y-0.5">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Quy Trình Chuẩn
            </span>
            <div className="text-2xl font-heading font-black text-emerald-600">
              0{processTemplates.length} Phác Đồ
            </div>
            <span className="text-[10px] text-emerald-700 font-bold block">Đang áp dụng thực địa</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-brand-border shadow-sm text-center space-y-0.5 col-span-2 lg:col-span-1">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Kho Tri Thức & AI
            </span>
            <div className="text-2xl font-heading font-black text-sky-600">
              0{knowledgeDocs.length} Tài Liệu
            </div>
            <span className="text-[10px] text-sky-700 font-bold block">Đã nạp RAG AI</span>
          </div>
        </div>

        {/* Layout Left Sidebar + Content */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Expert Menu (5 core functions per SRS) */}
          <DashboardRail user={user} fallbackName="ThS. Nguyễn Hoàng Nam" roleLabel="Chuyên gia nông nghiệp" collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed}>
            <div className={`px-2 pb-2 text-xs font-bold text-emerald-100/70 uppercase tracking-wider ${sidebarCollapsed ? 'lg:hidden' : ''}`}>Bàn Làm Việc Kỹ Thuật</div>

            {[
              { id: 'chat', label: 'Hộp Thư Tư Vấn & Chỉ Đạo', icon: MessageSquare, count: chatThreads.filter(c => c.status === 'PENDING').length },
              { id: 'plots', label: 'Thửa Đất Giám Sát (BR24)', icon: Layers, count: assignedPlots.length },
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
                          Đã thuê ({chatThreads.filter(c => c.role === 'customer' && !isPreRentalThread(c)).length})
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
                          Công nhân ({chatThreads.filter(c => c.role === 'worker').length})
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
                    <div className="flex-1 overflow-y-auto divide-y divide-brand-border/40">
                      {chatThreads
                        .filter((thread) => {
                          const q = chatSearchQuery.toLowerCase();
                          const matchesQuery =
                            thread.customerName.toLowerCase().includes(q) ||
                            thread.plotName.toLowerCase().includes(q) ||
                            thread.crop.toLowerCase().includes(q) ||
                            thread.roleLabel.toLowerCase().includes(q);
                          if (chatFilter === 'customer') return matchesQuery && thread.role === 'customer' && !isPreRentalThread(thread);
                          if (chatFilter === 'pre_rental') return matchesQuery && isPreRentalThread(thread);
                          if (chatFilter === 'worker') return matchesQuery && thread.role === 'worker';
                          if (chatFilter === 'pending') return matchesQuery && thread.status === 'PENDING';
                          return matchesQuery;
                        })
                        .map((thread) => {
                          const isSelected = thread.id === selectedThreadId;
                          const lastMsg = thread.messages[thread.messages.length - 1];
                          const hasPhoto = thread.messages.some(m => m.photoUrl);

                          return (
                            <button
                              type="button"
                              key={thread.id}
                              onClick={() => handleSelectThread(thread.id)}
                              aria-pressed={isSelected}
                              className={`relative flex h-[116px] w-full items-start gap-3 overflow-hidden border-l-4 p-3.5 text-left cursor-pointer transition-all duration-200 ${
                                isSelected
                                  ? 'bg-white border-l-[#294C38] shadow-sm'
                                  : thread.unread
                                    ? 'bg-emerald-50/70 hover:bg-emerald-50 border-l-rose-500 shadow-2xs'
                                    : 'border-l-transparent hover:bg-white/80'
                              }`}
                            >
                              {/* Avatar with Online Status */}
                              <div className="relative shrink-0">
                                <img
                                  src={getSafeAvatar(thread.customerAvatar, thread.role)}
                                  alt={thread.customerName}
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = getSafeAvatar(null, thread.role);
                                  }}
                                  className="w-12 h-12 rounded-full object-cover border border-brand-border"
                                />
                                {thread.isOnline ? (
                                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                                ) : (
                                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-stone-300 border-2 border-white" />
                                )}
                              </div>

                              {/* Thread Summary Info */}
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className={`text-xs truncate ${
                                      thread.unread ? 'font-black text-brand-dark' : 'font-bold text-stone-800'
                                    }`}>
                                      {thread.customerName}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-stone-400 shrink-0 ml-1">
                                    {thread.lastTime}
                                  </span>
                                </div>

                                {/* Rental status & current plot */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`dashboard-compact px-2 py-1 rounded-full text-xs font-bold border ${
                                    thread.role === 'worker'
                                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                                      : isPreRentalThread(thread)
                                        ? 'bg-sky-50 text-sky-800 border-sky-200'
                                        : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                  }`}>
                                    {thread.role === 'worker' ? 'Nhân viên' : isPreRentalThread(thread) ? 'Chưa thuê' : 'Đã thuê'}
                                  </span>
                                  {!isPreRentalThread(thread) && (
                                    <span className="dashboard-compact max-w-[170px] truncate rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-brand-green">
                                      {thread.plotName || `Thửa ${thread.plotCode}`} ({thread.plotCode})
                                    </span>
                                  )}
                                </div>

                                {/* Last message snippet */}
                                <div className="flex items-center justify-between gap-2 pt-0.5">
                                  <p className={`text-[11px] truncate leading-tight ${
                                    thread.unread ? 'font-bold text-stone-900' : 'text-stone-500'
                                  }`}>
                                    {lastMsg?.sender === 'expert' ? 'Bạn: ' : ''}
                                    {lastMsg?.text || (hasPhoto ? '[Đã gửi ảnh hiện trường]' : '')}
                                  </p>

                                  {thread.unread ? (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500 text-white shrink-0 animate-pulse">
                                      MỚI
                                    </span>
                                  ) : thread.status === 'PENDING' ? (
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" title="Chờ phản hồi" />
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

                    return (
                      <div className={`flex-1 flex flex-col bg-white min-w-0 ${
                        !mobileShowChat ? 'hidden md:flex' : 'flex'
                      }`}>
                        
                        {/* Messenger Top Header */}
                        <div className="p-3.5 sm:p-4 border-b border-brand-border bg-white flex flex-col xl:flex-row xl:items-center justify-between gap-3 shrink-0 shadow-2xs">
                          <div className="flex items-center gap-3 min-w-0 w-full">
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
                                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-brand-border"
                              />
                              {activeThread.isOnline && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <h4 className="font-bold text-brand-dark text-sm sm:text-base truncate">
                                  {activeThread.customerName}
                                </h4>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full border ${
                                  activeThread.status === 'PENDING'
                                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                }`}>
                                  {activeThread.status === 'PENDING' ? 'Chưa phản hồi' : 'Đã phản hồi'}
                                </span>
                              </div>
                              <p className="text-xs text-stone-500 truncate flex items-center gap-1.5 mt-1">
                                <span className="text-emerald-700 font-semibold">
                                  {activeThread.role === 'worker'
                                    ? `Nhân viên hiện trường • ${activeThread.plotName || 'Thửa Củ Chi'} (${activeThread.plotCode || 'P-01'})`
                                    : isPreRentalThread(activeThread)
                                      ? `Khách quan tâm • ${activeThread.crop || 'Tư vấn trước khi thuê'}`
                                      : `Khách thuê đất • ${activeThread.crop || 'VietGAP'} • ${activeThread.plotName || 'Thửa canh tác'} (${activeThread.plotCode || 'P-01'})`}
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Right Badge Status */}
                          <div className="flex flex-wrap items-center gap-2 xl:justify-end shrink-0 w-full xl:w-auto pl-12 xl:pl-0">
                            {activeThread.role === 'customer' && (
                              <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black border ${
                                isPreRentalThread(activeThread)
                                  ? 'bg-sky-50 text-sky-900 border-sky-200'
                                  : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                              }`}>
                                <span className={`w-2 h-2 rounded-full ${isPreRentalThread(activeThread) ? 'bg-sky-500' : 'bg-emerald-500'}`} />
                                {isPreRentalThread(activeThread) ? 'Chưa thuê đất' : `Đang thuê ${activeThread.plotCode}`}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Messenger Chat History Viewport */}
                        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#F8F9FA]">
                          
                          {/* Date separator */}
                          <div className="flex items-center justify-center my-2">
                            <span className="text-[11px] font-semibold text-stone-400 bg-white px-3 py-1 rounded-full border border-stone-200/80 shadow-2xs">
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
                                <div key={msg.id} className="flex flex-col items-end space-y-1 max-w-[85%] sm:max-w-[75%] ml-auto">
                                  <div className="text-[10px] text-stone-400 font-medium px-1 flex items-center gap-1.5">
                                    <span className="font-bold text-emerald-800">ThS. Nguyễn Hoàng Nam</span>
                                    <span>• {msg.time}</span>
                                  </div>

                                  {msg.prescriptionTag && (
                                    <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200 self-end shadow-2xs">
                                      <ShieldCheck className="w-3 h-3 text-brand-green" />
                                      <span>{msg.prescriptionTag}</span>
                                    </div>
                                  )}

                                  <div className="p-3.5 sm:p-4 rounded-2xl rounded-tr-xs bg-[#294C38] text-white text-xs sm:text-sm leading-relaxed shadow-sm">
                                    {msg.text}
                                  </div>

                                  <div className="text-[10px] flex items-center justify-end px-1 text-stone-400">
                                    <span>{msg.time}</span>
                                  </div>
                                </div>
                              );
                            }

                            // Customer or Worker message
                            return (
                              <div key={msg.id} className="flex items-start gap-2.5 max-w-[88%] sm:max-w-[78%]">
                                <img
                                  src={getSafeAvatar(msg.senderAvatar || activeThread.customerAvatar, activeThread.role)}
                                  alt={msg.senderName || activeThread.customerName}
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = getSafeAvatar(null, activeThread.role);
                                  }}
                                  className="mt-5 h-8 w-8 shrink-0 rounded-full border border-stone-200 object-cover"
                                />

                                <div className="space-y-1.5 flex-1">
                                  <div className="text-[10px] text-stone-400 font-medium px-1">
                                    <span className="font-bold text-stone-700">
                                      {msg.senderName && msg.senderName !== 'Người dùng Farmely' ? msg.senderName : activeThread.customerName}
                                    </span>
                                    <span> • {msg.time}</span>
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
                                      className="relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-stone-200/90 shadow-sm max-w-xs sm:max-w-sm bg-black/5 hover:border-brand-green transition-all"
                                    >
                                      <img
                                        src={msg.photoUrl}
                                        alt={msg.photoCaption || 'Ảnh hiện trường'}
                                        onError={(e) => {
                                          e.currentTarget.onerror = null;
                                          e.currentTarget.src = 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&w=800&q=80';
                                        }}
                                        className="w-full h-44 sm:h-52 object-cover transition-transform duration-300 group-hover:scale-105"
                                      />
                                      <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                                        <ZoomIn className="w-4 h-4" />
                                        <span>Xem Kính Lúp Phân Tích Hiện Trường</span>
                                      </div>
                                      {msg.photoCaption && (
                                        <div className="p-2 bg-white/95 backdrop-blur-xs text-[11px] font-medium text-stone-700 border-t border-stone-100 flex items-center justify-between">
                                          <span className="truncate">{msg.photoCaption}</span>
                                          <span className="text-[10px] text-brand-green font-bold shrink-0 ml-1">Phóng to</span>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Text Bubble */}
                                  {msg.text && (
                                    <div className="p-3.5 sm:p-4 rounded-2xl rounded-tl-xs bg-white text-stone-800 text-xs sm:text-sm leading-relaxed border border-stone-200 shadow-2xs">
                                      {msg.text}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}


                        </div>

                        {/* Quick Prescriptions Suggestion Bar */}
                        <div className="px-3.5 sm:px-4 py-2 bg-stone-50 border-t border-brand-border/70 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
                          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            Gợi ý chỉ đạo:
                          </span>
                          {quickPrescriptions.map((item, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setChatInputText(item.text);
                              }}
                              className="px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 hover:text-emerald-900 border border-brand-border text-[11px] font-medium text-stone-700 transition-colors shrink-0 shadow-2xs cursor-pointer"
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>

                        {/* Messenger Chat Input Footer */}
                        <form
                          onSubmit={handleSendCustomerMessage}
                          className="p-3 sm:p-4 bg-white border-t border-brand-border flex items-end gap-2.5 shrink-0"
                        >
                          <div className="flex-1 bg-stone-50 rounded-2xl border border-brand-border focus-within:border-brand-green/40 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-green/10 transition-all p-2 flex flex-col gap-1.5">
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
                              placeholder={`Soạn tư vấn kỹ thuật hoặc chỉ đạo cho ${activeThread.customerName}... (Enter để gửi, Shift+Enter để xuống dòng)`}
                              className="w-full bg-transparent border-0 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none resize-none px-1"
                            />
                            
                            <div className="flex items-center justify-between pt-1 border-t border-stone-200/50 px-1 text-stone-400">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setChatInputText(prev => prev + ' 🌿 [Kèm tài liệu hướng dẫn kỹ thuật chuẩn VietGAP]');
                                  }}
                                  className="text-stone-400 hover:text-brand-green transition-colors cursor-pointer"
                                  title="Đính kèm tài liệu quy trình"
                                >
                                  <Paperclip className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setChatInputText(prev => prev + ' 🌱 [Chứng nhận VietGAP số 2026-VGAP-01]');
                                  }}
                                  className="text-stone-400 hover:text-brand-green transition-colors cursor-pointer"
                                  title="Chứng nhận VietGAP"
                                >
                                  <ShieldCheck className="w-4 h-4" />
                                </button>
                              </div>
                              <span className="text-[10px] hidden sm:inline">
                                Nhấn <strong>Enter</strong> để gửi nhanh
                              </span>
                            </div>
                          </div>

                          <Button
                            type="submit"
                            variant="primary"
                            size="md"
                            disabled={!chatInputText.trim()}
                            className="font-bold h-[72px] px-5 rounded-2xl shadow-sm shrink-0"
                          >
                            <Send className="w-4 h-4 mr-1.5" />
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
                      <span>Thửa Đất Giám Sát Kỹ Thuật (BR24)</span>
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
                      className="p-5 rounded-2xl border border-brand-border bg-white shadow-sm space-y-4 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border/60 pb-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-brand-green text-sm">{issue.id}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            issue.urgency === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-stone-100 text-stone-700'
                          }`}>
                            {issue.urgency === 'HIGH' ? 'Khẩn cấp' : 'Bình thường'}
                          </span>
                          <span className="text-stone-400">• {issue.reportedTime}</span>
                          {issue.expertName && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                              🔬 Phụ trách: {issue.expertName}
                            </span>
                          )}
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          issue.status === 'PENDING' || issue.status === 'OPEN' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {issue.status === 'PENDING' || issue.status === 'OPEN' ? 'Chờ chẩn đoán' : 'Đã ban hành phác đồ'}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        <img
                          src={issue.photoUrl}
                          alt="Ảnh hiện trường"
                          className="w-32 h-24 rounded-xl object-cover border border-brand-border shrink-0"
                        />
                        <div className="space-y-1.5 flex-1">
                          <h4 className="font-bold text-brand-dark text-sm">{issue.issueType}</h4>
                          <p className="text-stone-600">
                            Thửa đất: <strong>{issue.plotName} ({issue.plotCode})</strong> • Báo cáo bởi: <strong>{issue.workerName}</strong>
                          </p>
                          <p className="text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-brand-border/60">
                            "{issue.description}"
                          </p>
                          {issue.diagnosis && (
                            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                              <strong>Chỉ đạo của chuyên gia:</strong> {issue.diagnosis}
                            </div>
                          )}
                          {issue.assignedTaskCode && (
                            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-900">
                              <CheckCircle2 className="h-4 w-4" />
                              <strong>Đã giao {issue.assignedTaskCode}</strong>
                              <span>cho {issue.workerName}</span>
                              {issue.assignedDueDate ? <span className="ml-auto">Hạn {new Date(`${issue.assignedDueDate}T00:00:00`).toLocaleDateString('vi-VN')}</span> : null}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-brand-border/60">
                          {issue.isStaffReporter ? <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openTaskAssignment(issue)}
                            disabled={Boolean(issue.assignedTaskCode)}
                            className="font-bold"
                          >
                            <UserCheck className="mr-1.5 h-4 w-4" />
                            {issue.assignedTaskCode ? 'Đã giao nhiệm vụ' : 'Giao nhiệm vụ'}
                          </Button> : null}
                          {issue.status === 'PENDING' ? <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setSelectedIssueToDiagnose(issue)}
                            className="bg-emerald-700 font-bold"
                          >
                            Chẩn đoán & Ban hành chỉ đạo kỹ thuật
                          </Button> : null}
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
              <div><span className="text-stone-500">Thửa đất</span><strong className="mt-1 block text-sm text-brand-dark">{selectedIssueToAssign.plotName} ({selectedIssueToAssign.plotCode})</strong><span className="mt-1 inline-flex rounded-full bg-rose-100 px-2 py-1 text-[10px] font-black text-rose-700">Khẩn cấp</span></div>
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

      {/* Modal Diagnose Field Issue */}
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
