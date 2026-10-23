import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import { useAuthStore } from '../../stores/authStore';
import { useServiceStore } from '../../stores/serviceStore';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import VietQrModal from '../../components/payment/VietQrModal';
import VnPayModal from '../../components/payment/VnPayModal';
import SelfGrowingDashboard from '../../components/customer/SelfGrowingDashboard';
import AssistedGrowingDashboard from '../../components/customer/AssistedGrowingDashboard';
import CardPaymentModal from '../../components/payment/CardPaymentModal';
import FloatingExpertChat from '../../components/customer/FloatingExpertChat';
import CustomerPlotWorkspace from '../../components/customer/CustomerPlotWorkspace';
import PlotHarvestModal from '../../components/customer/PlotHarvestModal';
import ContractCancellationModal from '../../components/customer/ContractCancellationModal';
import CustomerContractCenter from '../../components/customer/CustomerContractCenter';
import CustomerMobileNav from '../../components/customer/CustomerMobileNav';
import CustomerWelcomeLounge from '../../components/customer/CustomerWelcomeLounge';
import { useRealtimeChat } from '../../hooks/useRealtimeChat';
import { DEMO_CUSTOMERS } from '../../api/communication/chatStorage';
import { useSensorStream } from '../../api/monitoring/useSensorStream';
import { apiFetch, unwrapData } from '../../api/apiClient';
import { resolveStandardCropProcess } from '../../services/cropStandardProcess';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import {
  Sprout,
  Camera,
  PlusCircle,
  BookOpen,
  Apple,
  Radio,
  Thermometer,
  Droplets,
  Calendar,
  Clock,
  Send,
  Sparkles,
  Info,
  Trash2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Activity,
  FileText,
  Printer,
  CreditCard,
  MapPin,
  RefreshCw,
  ClipboardList,
  Bot,
  Sun,
  Layers,
  ChevronRight,
  ChevronDown,
  ShoppingBag,
  Check,
  MessageSquare,
  UserCheck,
  QrCode,
  Flame,
  Tag,
  Zap,
  Wallet,
  LayoutDashboard,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Star,
  ShieldAlert,
  Eye,
  Wheat,
  Truck,
  CalendarCheck
} from 'lucide-react';

export default function CustomerDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { services: masterServices, loadServices } = useServiceStore();
  const [apiServices, setApiServices] = useState([]);
  const [apiCustomerPlots, setApiCustomerPlots] = useState([]);

  useEffect(() => {
    if (typeof loadServices === 'function') {
      loadServices().catch(() => {});
    }
  }, [loadServices]);
  const [activeTab, setActiveTab] = useState('yards');
  const [contractSubTab, setContractSubTab] = useState('list'); // 'list' | 'document'
  const [selectedPlotId, setSelectedPlotId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState(null);
  const [taskPhotoPreview, setTaskPhotoPreview] = useState('');
  const [chatOpenMode, setChatOpenMode] = useState('expert');
  const [iotReturnPlotId, setIotReturnPlotId] = useState(null);
  const [showExpertChatModal, setShowExpertChatModal] = useState(false);

  // Chat Communication & Identity Resolution:
  // Detect if current logged-in user is a custom registered user (not the default demo USR-001)
  const isCustomUser = Boolean(
    user &&
    user.id !== 'USR-001' &&
    user.email !== 'customer@farmely.vn' &&
    !DEMO_CUSTOMERS.some((c) => c.email && user.email && c.email.toLowerCase() === user.email.toLowerCase())
  );

  const customAccount = useMemo(() => {
    if (!isCustomUser || !user) return null;
    const safeKey = user.email
      ? user.email.replace(/[^a-zA-Z0-9]/g, '_')
      : (user.id ? String(user.id).replace(/[^a-zA-Z0-9]/g, '_') : 'custom_user');
    return {
      id: `CUST-${safeKey}`,
      threadId: `CONS-${safeKey}`,
      name: user.fullName || user.email?.split('@')[0] || 'Khách Hàng',
      email: user.email,
      phone: user.phone || '0901 888 999',
      avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      plotCode: 'P-01',
      plotName: 'Thửa Canh Tác Của ' + (user.fullName || user.email?.split('@')[0] || 'Khách Hàng'),
      crop: 'Rau củ VietGAP',
      expertName: 'ThS. Nguyễn Hoàng Nam'
    };
  }, [user, isCustomUser]);

  // Default thread for the active user account
  const defaultUserThreadId = useMemo(() => {
    if (customAccount) return customAccount.threadId;
    if (user?.email) {
      const match = DEMO_CUSTOMERS.find((c) => c.email && c.email.toLowerCase() === user.email.toLowerCase());
      if (match) return match.threadId;
    }
    return DEMO_CUSTOMERS[0].threadId; // 'CONS-401' for Lô Thái Quyền (demo)
  }, [customAccount, user?.email]);

  const availableCustomerOptions = useMemo(() => {
    if (customAccount) {
      return [customAccount, ...DEMO_CUSTOMERS];
    }
    return DEMO_CUSTOMERS;
  }, [customAccount]);

  const [selectedCustomerThreadId, setSelectedCustomerThreadId] = useState(defaultUserThreadId);

  // CRITICAL: Whenever user changes in auth store (login, logout, switch demo role in navbar):
  // ALWAYS reset the chat thread to the current logged-in user's own thread!
  useEffect(() => {
    setSelectedCustomerThreadId(defaultUserThreadId);
  }, [defaultUserThreadId]);

  const currentCustomerProfile = useMemo(() => {
    return (
      availableCustomerOptions.find((c) => c.threadId === selectedCustomerThreadId) ||
      availableCustomerOptions[0]
    );
  }, [availableCustomerOptions, selectedCustomerThreadId]);

  // Sender name is strictly tied to the selected profile
  const activeCustomerSenderName = currentCustomerProfile?.name || user?.fullName || 'Khách Hàng';

  const {
    currentThread: customerChatThread,
    sendMessage: sendCustomerMessage
  } = useRealtimeChat({
    role: 'customer',
    initialThreadId: selectedCustomerThreadId,
    senderName: activeCustomerSenderName
  });

  const [customerChatInput, setCustomerChatInput] = useState('');
  const customerChatScrollRef = useRef(null);

  useEffect(() => {
    if (showExpertChatModal && customerChatScrollRef.current) {
      customerChatScrollRef.current.scrollTop = customerChatScrollRef.current.scrollHeight;
    }
  }, [showExpertChatModal, customerChatThread?.messages]);

  const handleSendCustomerChat = (e) => {
    if (e) e.preventDefault();
    if (!customerChatInput.trim()) return;

    sendCustomerMessage(customerChatInput.trim(), activeCustomerSenderName);
    setCustomerChatInput('');
  };

  // IoT Section States
  const [selectedIotPlotId, setSelectedIotPlotId] = useState('PLOT-CC-01');
  const [iotTimeframe, setIotTimeframe] = useState('hourly'); // 'hourly' | 'daily' | 'weekly'

  // Service Shop States
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState('ALL'); // 'ALL' | 'FULL' | 'CYCLE' | 'SINGLE' | 'ORDERS'
  const [serviceSort, setServiceSort] = useState('name');
  const [selectedServiceToBuy, setSelectedServiceToBuy] = useState(null);
  const [checkoutPlotId, setCheckoutPlotId] = useState('PLOT-CC-01');
  const [checkoutDate, setCheckoutDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState('VNPAY');
  const [lastPaymentResult, setLastPaymentResult] = useState(null);
  const [showCheckoutSuccessModal, setShowCheckoutSuccessModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showServiceVnPayModal, setShowServiceVnPayModal] = useState(false);
  const [showServiceCardModal, setShowServiceCardModal] = useState(false);
  const [showServiceQrModal, setShowServiceQrModal] = useState(false);
  const [serviceQrData, setServiceQrData] = useState(null);
  const [livePlotOperations, setLivePlotOperations] = useState({});
  const [tasksPlotFilter, setTasksPlotFilter] = useState(() => {
    try {
      return localStorage.getItem('farmely_selected_task_plot') || 'ALL';
    } catch {
      return 'ALL';
    }
  });

  // Tự động đóng modal thông báo thành công sau 3 giây
  useEffect(() => {
    if (showCheckoutSuccessModal) {
      const timer = setTimeout(() => {
        setShowCheckoutSuccessModal(false);
        setSelectedServiceToBuy(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showCheckoutSuccessModal]);

  // Modals for Other Screen Flows
  const [showNewDiaryModal, setShowNewDiaryModal] = useState(false);
  const [diaryPlotId, setDiaryPlotId] = useState('PLOT-MC-02');
  const [diaryFocusPlotId, setDiaryFocusPlotId] = useState('PLOT-CC-01');
  const [showHarvestAcceptModal, setShowHarvestAcceptModal] = useState(false);
  const [harvestDeliveryMethod, setHarvestDeliveryMethod] = useState('DELIVERY');
  const [harvestAcceptance, setHarvestAcceptance] = useState({ status: 'PENDING', confirmedAt: null, deliveryMethod: null, rating: null, feedback: '' });
  const [harvestRating, setHarvestRating] = useState(5);
  const [harvestFreshness, setHarvestFreshness] = useState(5);
  const [harvestPackaging, setHarvestPackaging] = useState(5);
  const [harvestFeedback, setHarvestFeedback] = useState('');
  const [isSubmittingHarvestRating, setIsSubmittingHarvestRating] = useState(false);

  const handleConfirmHarvestAcceptance = async (e) => {
    e?.preventDefault();
    setIsSubmittingHarvestRating(true);
    const targetHarvest = selectedHarvestForAccept || dbHarvestResults[0];
    try {
      if (targetHarvest?.harvestId || targetHarvest?.id) {
        await fetch('/api/customer/harvest-results/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            harvestId: targetHarvest?.harvestId || targetHarvest?.id,
            rentalId: targetHarvest?.rentalId,
            deliveryMethod: harvestDeliveryMethod,
            rating: harvestRating,
            freshnessRating: harvestFreshness,
            packagingRating: harvestPackaging,
            customerFeedback: harvestFeedback
          })
        }).catch(() => null);
        fetchHarvestResults?.();
      }

      setHarvestAcceptance({
        status: 'CONFIRMED',
        confirmedAt: new Date().toISOString(),
        deliveryMethod: harvestDeliveryMethod,
        rating: harvestRating,
        feedback: harvestFeedback
      });
      setShowHarvestAcceptModal(false);
      alert('Cảm ơn bạn đã nghiệm thu và đánh giá chất lượng nông sản vụ mùa!');
    } catch (err) {
      console.warn('Lỗi xác nhận thu hoạch:', err);
      setHarvestAcceptance({
        status: 'CONFIRMED',
        confirmedAt: new Date().toISOString(),
        deliveryMethod: harvestDeliveryMethod,
        rating: harvestRating,
        feedback: harvestFeedback
      });
      setShowHarvestAcceptModal(false);
    } finally {
      setIsSubmittingHarvestRating(false);
    }
  };

  // Custom Service Request (UC10 / BR13)
  const [showCustomServiceModal, setShowCustomServiceModal] = useState(false);
  const [customServiceData, setCustomServiceData] = useState({
    plotId: '',
    title: '',
    scheduledDate: '',
    budget: '',
    notes: ''
  });
  const [isSubmittingCustomService, setIsSubmittingCustomService] = useState(false);

  const handleCreateCustomServiceRequest = async (e) => {
    e.preventDefault();
    if (!customServiceData.title.trim()) return;
    setIsSubmittingCustomService(true);
    try {
      const selectedPlot = customerPlots.find(p => p.id === customServiceData.plotId) || customerPlots[0];
      const rentalId = selectedPlot?.rentalId || 1;

      await fetch('/api/services/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentalId: rentalId,
          serviceId: 1,
          scheduledDate: customServiceData.scheduledDate || new Date().toISOString().split('T')[0],
          notes: `[YÊU CẦU ĐẶC BIỆT] ${customServiceData.title}: ${customServiceData.notes}. Ngân sách dự kiến: ${customServiceData.budget ? Number(customServiceData.budget).toLocaleString('vi-VN') + ' đ' : 'Thỏa thuận'}`
        })
      }).catch(() => null);

      const newOrder = {
        id: `SR-CUSTOM-${Date.now().toString().slice(-4)}`,
        plotName: selectedPlot ? selectedPlot.name : 'Thửa đã chọn',
        serviceName: `[Yêu cầu riêng] ${customServiceData.title}`,
        price: customServiceData.budget ? `${Number(customServiceData.budget).toLocaleString('vi-VN')} đ` : 'Chờ thẩm định & báo giá',
        date: `${customServiceData.scheduledDate || 'Theo lịch hẹn'} • Vừa gửi`,
        status: 'PENDING',
        statusLabel: 'Chờ ban quản trị báo giá',
        worker: 'Chờ điều phối CVLĐ',
        paymentMethod: 'Thanh toán sau khi duyệt báo giá'
      };

      setActiveServiceOrders(orders => [newOrder, ...orders]);
      setShowCustomServiceModal(false);
      setCustomServiceData({ plotId: '', title: '', scheduledDate: '', budget: '', notes: '' });
      alert('Đã gửi yêu cầu dịch vụ đặc biệt thành công! Ban Quản Trị Farmely sẽ liên hệ phản hồi báo giá trong vòng 2 giờ.');
    } catch (err) {
      console.warn('Lỗi gửi yêu cầu đặc biệt:', err);
    } finally {
      setIsSubmittingCustomService(false);
    }
  };

  // Customer Disputes & Complaints (UC20 / BR17 / SCR-KH-15)
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeList, setDisputeList] = useState([]);
  const [disputeData, setDisputeData] = useState({
    plotId: '',
    disputeType: 'YIELD_SHORTAGE',
    reason: 'Thiếu hụt sản lượng so với cam kết tối thiểu (BR16)',
    requestedSolution: 'COMPENSATE_NEXT',
    evidenceUrl: '',
    notes: ''
  });
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  const handleCreateDispute = async (e) => {
    e.preventDefault();
    if (!disputeData.notes.trim()) return;
    setIsSubmittingDispute(true);
    try {
      const selectedPlot = customerPlots.find(p => p.id === disputeData.plotId) || customerPlots[0];
      const rentalId = selectedPlot?.rentalId || 1;

      await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentalId: rentalId,
          reportedBy: user?.id || 1,
          issueType: `[KHIẾU NẠI] ${disputeData.reason}`,
          description: `Yêu cầu xử lý: ${disputeData.requestedSolution}. Ghi chú: ${disputeData.notes}`,
          imageUrl: disputeData.evidenceUrl || null
        })
      }).catch(() => null);

      const newDispute = {
        id: `DISPUTE-${Date.now().toString().slice(-4)}`,
        plotName: selectedPlot ? selectedPlot.name : 'Thửa đã chọn',
        disputeType: disputeData.disputeType,
        reason: disputeData.reason,
        requestedSolution: disputeData.requestedSolution,
        evidenceUrl: disputeData.evidenceUrl,
        notes: disputeData.notes,
        createdAt: new Date().toLocaleString('vi-VN'),
        status: 'OPEN',
        statusLabel: 'Chờ Ban Quản Trị & Chuyên Gia thẩm tra (BR17)'
      };

      setDisputeList(prev => [newDispute, ...prev]);
      setShowDisputeModal(false);
      setDisputeData({
        plotId: '',
        disputeType: 'YIELD_SHORTAGE',
        reason: 'Thiếu hụt sản lượng so với cam kết tối thiểu (BR16)',
        requestedSolution: 'COMPENSATE_NEXT',
        evidenceUrl: '',
        notes: ''
      });
      alert('Đã gửi hồ sơ khiếu nại thành công! Ban Quản Trị Farmely cam kết thẩm tra và phản hồi kết quả trong vòng 24 giờ làm việc.');
    } catch (err) {
      console.warn('Lỗi gửi khiếu nại:', err);
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  // Ngữ cảnh thửa: khi đi từ trang 1 thửa sang Nhật ký / Lịch / Dịch vụ thì chỉ hiện
  // dữ liệu của ĐÚNG thửa đó (null = xem tất cả thửa, khi vào từ sidebar)
  const [plotScopeId, setPlotScopeId] = useState(null);

  // Kế hoạch thu hoạch theo từng thửa: { [plotId]: plan }
  const [harvestModalPlotId, setHarvestModalPlotId] = useState(null);
  const harvestStorageKey = `farmely_harvest_plans_${user?.id || 'guest'}`;
  const [harvestPlans, setHarvestPlans] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(harvestStorageKey) || '{}');
      return saved && typeof saved === 'object' ? saved : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const handleSync = () => {
      try {
        const shared = JSON.parse(localStorage.getItem('farmely_shared_harvest_plans') || '[]');
        if (Array.isArray(shared) && shared.length > 0) {
          setHarvestPlans((prev) => {
            const next = { ...prev };
            let changed = false;
            shared.forEach((item) => {
              const code = item.plotCode || item.plotId;
              if (code && next[code]) {
                if (next[code].status !== item.status) {
                  next[code] = { ...next[code], status: item.status, approvedAt: item.approvedAt, approvedBy: item.approvedBy };
                  changed = true;
                }
              }
            });
            return changed ? next : prev;
          });
        }
      } catch {}
    };

    let bc = null;
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        bc = new BroadcastChannel('farmely_harvest_sync');
        bc.onmessage = handleSync;
      }
    } catch {}

    window.addEventListener('storage', handleSync);
    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(harvestStorageKey, JSON.stringify(harvestPlans));
    } catch {
      /* hết dung lượng / chế độ ẩn danh: bỏ qua, kế hoạch vẫn còn trong phiên */
    }
  }, [harvestPlans, harvestStorageKey]);
  const [showRenewContractModal, setShowRenewContractModal] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [selectedContractForCancel, setSelectedContractForCancel] = useState(null);
  const [cancelledContracts, setCancelledContracts] = useState({});
  const [emergencyRequests, setEmergencyRequests] = useState({});

  // Subsystem 3: Contracts & Renewal Management (UC07 / BR11)
  const [contractSubView, setContractSubView] = useState('list'); // 'list' | 'document'
  const [selectedPlotForRenew, setSelectedPlotForRenew] = useState(null);
  const [renewMonths, setRenewMonths] = useState(3);
  const [isRenewingContract, setIsRenewingContract] = useState(false);
  const [renewSuccessToast, setRenewSuccessToast] = useState('');

  const handleConfirmRenewContract = async (e) => {
    e?.preventDefault();
    if (!selectedPlotForRenew) return;
    setIsRenewingContract(true);
    try {
      const rentalId = selectedPlotForRenew.rentalId || (selectedPlotForRenew.id === 'PLOT-CC-01' ? 1 : 2);
      const baseDate = new Date();
      baseDate.setMonth(baseDate.getMonth() + Number(renewMonths));
      const newEndDate = baseDate.toISOString().split('T')[0];

      await fetch(`/api/rentals/${rentalId}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newEndDate: newEndDate
        })
      }).catch(() => null);

      setRenewSuccessToast(`Gia hạn thành công hợp đồng thửa ${selectedPlotForRenew.name || selectedPlotForRenew.mapPlotId} thêm ${renewMonths} tháng!`);
      setShowRenewContractModal(false);
      setTimeout(() => setRenewSuccessToast(''), 4500);
      if (typeof fetchPlots === 'function') fetchPlots();
    } catch (err) {
      console.error('Lỗi gia hạn:', err);
      alert('Không thể thực hiện gia hạn vào lúc này.');
    } finally {
      setIsRenewingContract(false);
    }
  };

  // Bộ lọc trạng thái thửa đất (Ưu tiên: Đang canh tác ACTIVE)
  const [plotStatusFilter, setPlotStatusFilter] = useState('ACTIVE'); // 'ACTIVE' | 'CANCELLED' | 'ALL'
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const statusDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenCancelModal = (item) => {
    const isNew = item.isPendingHandover || item.contractCode === 'CTR-2026-FARM-NEW';
    const contractData = {
      contractId: item.contractId || (item.id === 'PLOT-CC-01' ? 1 : item.id === 'PLOT-MC-02' ? 2 : 3),
      contractCode: item.contractCode || item.contractNumber || 'CTR-2026-FARM-9912',
      plotName: item.plotName || item.name || 'Thửa Sen Vàng A1',
      plotCode: item.mapPlotId || item.plotCode || 'P-01',
      totalAmount: item.totalAmount || (item.area === '160m²' ? 3900000 : 3600000),
      startDate: item.startDate || (isNew ? '20/10/2026' : '12/08/2026'),
      endDate: item.endDate || '18/11/2026',
      status: cancelledContracts[item.contractCode] ? 'CANCELLED' : (isNew ? 'CONFIRMED' : 'ACTIVE')
    };
    setSelectedContractForCancel(contractData);
    setShowCancellationModal(true);
  };

  // Form states
  const [diaryNote, setDiaryNote] = useState('');

  // AI Chatbot state
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'user',
      text: 'Mùa này tôi nên gieo thêm loại rau nào tại khu vực Củ Chi?',
      time: '08:15 AM'
    },
    {
      id: 2,
      sender: 'ai',
      text: 'Chào bạn! Tôi là Farmely AI Assistant — trợ lý thông minh của nền tảng Farmely. Tôi có thể hỗ trợ bạn tìm hiểu quy trình thuê vườn, chọn giống cây phù hợp, hướng dẫn kỹ thuật canh tác VietGAP hoặc giải đáp thắc mắc về các dịch vụ chăm sóc nông trại. Bạn cần tôi hỗ trợ thông tin gì hôm nay?',
      time: '08:16 AM'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [aiConversationId, setAiConversationId] = useState(null);

  // Live Customer Rented Plots loaded from PostgreSQL database
  const [dbPlots, setDbPlots] = useState(null);
  const [isLoadingPlots, setIsLoadingPlots] = useState(true);

  const fetchCustomerPlots = useCallback(async () => {
    try {
      setIsLoadingPlots(true);
      const userId = user?.userId || user?.id;
      const email = user?.email;
      if (!userId && !email) {
        setDbPlots([]);
        setIsLoadingPlots(false);
        return;
      }

      const query = userId
        ? `userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(email || '')}`
        : `email=${encodeURIComponent(email || '')}`;

      const res = await fetch(`/api/customer/rented-plots?${query}`);
      if (res.ok) {
        const data = await res.json();
        setDbPlots(Array.isArray(data) ? data : []);
      } else {
        setDbPlots([]);
      }
    } catch (err) {
      console.error('Failed to load customer plots from DB:', err);
      setDbPlots([]);
    } finally {
      setIsLoadingPlots(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCustomerPlots();

    // Lắng nghe đồng bộ tức thì từ Admin qua BroadcastChannel & Storage Event
    let bc = null;
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        bc = new BroadcastChannel('farmely_iot_telemetry');
        bc.onmessage = (msg) => {
          if (msg.data?.type === 'TELEMETRY_UPDATED') {
            fetchCustomerPlots();
          }
        };
      }
    } catch {}

    const handleStorage = (e) => {
      if (e.key === 'farmely_iot_sync_ping') {
        fetchCustomerPlots();
      }
    };
    window.addEventListener('storage', handleStorage);

    // Chu kỳ đồng bộ 10 giây tự động cập nhật số liệu mới nhất từ PostgreSQL
    const pollTimer = setInterval(fetchCustomerPlots, 10000);

    return () => { 
      clearInterval(pollTimer);
      if (bc) { try { bc.close(); } catch {} }
      window.removeEventListener('storage', handleStorage);
    };
  }, [user?.id, user?.userId, user?.email]);

  const customerPlots = useMemo(() => {
    const list = Array.isArray(dbPlots) ? [...dbPlots] : [];

    // Fallback: Nếu vừa thanh toán thuê thửa xong, đảm bảo hiển thị ngay trên Dashboard
    try {
      const pendingBooking = JSON.parse(localStorage.getItem('farmely_pending_vnpay_booking') || 'null');
      if (pendingBooking && Array.isArray(pendingBooking.plots)) {
        pendingBooking.plots.forEach((p) => {
          const plotCode = p.code || p.id;
          const plotIdStr = `PLOT-${plotCode}`;
          const alreadyExists = list.some(
            (cp) =>
              cp.id === plotIdStr ||
              cp.mapPlotId === plotCode ||
              (cp.mapPlotId && plotCode && cp.mapPlotId.toLowerCase() === plotCode.toLowerCase())
          );
          if (!alreadyExists) {
            list.unshift({
              id: plotIdStr,
              mapPlotId: plotCode,
              name: p.name || `Thửa ${plotCode} - Trang trại Happy Valley Củ Chi`,
              location: 'Trang trại Happy Valley Củ Chi',
              area: p.area || '160m²',
              mode: (p.cultivationMode || (pendingBooking.cultivationMode === 'SELF_GROWING' ? 'SELF' : 'ASSISTED')) === 'SELF' ? 'Self-Growing' : 'Assisted-Growing',
              crop: p.varietyName || p.cropName || 'Dưa leo baby F1',
              stage: 'Bước 1: Làm đất & gieo giống',
              currentDay: 1,
              totalDays: 60,
              progressPercent: 5,
              image: p.imageUrl || 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=1000&q=80',
              temp: '28.5°C',
              soilMoisture: '68%',
              airHumidity: '74%',
              light: '45.000 Lux',
              stationId: `IOT-${plotCode}`,
              status: 'HEALTHY',
              worker: 'Trần Văn Lực (CVLĐ)',
              contractCode: pendingBooking.contractCode || `HD-${Date.now()}`,
              startDate: pendingBooking.startDate || new Date().toISOString().split('T')[0],
              expectedHarvestDate: '2026-12-16'
            });
          }
        });
      }
    } catch (e) {
      console.warn('Fallback sync notice:', e);
    }

    return list;
  }, [dbPlots]);

  // Sync selected IDs once plots are loaded
  useEffect(() => {
    if (customerPlots.length > 0) {
      if (!customerPlots.some(p => p.id === checkoutPlotId)) {
        setCheckoutPlotId(customerPlots[0].id);
      }
      if (!customerPlots.some(p => p.id === selectedIotPlotId)) {
        setSelectedIotPlotId(customerPlots[0].id);
      }
      if (!customerPlots.some(p => p.id === diaryPlotId)) {
        setDiaryPlotId(customerPlots[0].id);
      }
      if (!customerPlots.some(p => p.id === diaryFocusPlotId)) {
        setDiaryFocusPlotId(customerPlots[0].id);
      }
    }
  }, [customerPlots]);

  const selectedCheckoutPlot = customerPlots.find((plot) =>
    plot.id === checkoutPlotId ||
    String(plot.rentalId) === String(checkoutPlotId) ||
    `RENTAL-${plot.rentalId}` === checkoutPlotId ||
    plot.plotCode === checkoutPlotId ||
    plot.mapPlotId === checkoutPlotId
  ) || customerPlots[0] || null;

  useEffect(() => {
    let cancelled = false;
    const unwrap = (body) => Array.isArray(body) ? body : (body?.data || []);
    Promise.all([
      fetch('/api/services?status=ACTIVE').then((r) => r.ok ? r.json() : { data: [] }),
      fetch('/api/rentals').then((r) => r.ok ? r.json() : { data: [] }),
      fetch('/api/services/requests').then((r) => r.ok ? r.json() : { data: [] })
    ]).then(([servicesBody, rentalsBody, requestsBody]) => {
      if (cancelled) return;
      const services = unwrap(servicesBody).map((s) => ({
        id: s.serviceId || s.id,
        name: s.serviceName || s.name || 'Dịch vụ nông nghiệp',
        price: Number(s.price || 0),
        unit: s.unit || '/ lần thực hiện',
        description: s.description || 'Dịch vụ chăm sóc theo tiêu chuẩn Farmely.',
        active: String(s.status || 'ACTIVE') === 'ACTIVE',
        customerCategory: String(s.serviceType || '').includes('FULL') ? 'FULL' : 'SINGLE',
        tag: String(s.serviceType || '').includes('FULL') ? 'Gói chăm sóc' : 'Dịch vụ lẻ',
        iconKey: 'sprout',
        tasks: Array.isArray(s.tasks) ? s.tasks : []
      }));
      setApiServices(services);
      const rentals = unwrap(rentalsBody);
      setApiCustomerPlots(rentals.map((r, index) => ({
        id: `PLOT-${r.plotCode || r.plotId || r.rentalId}`,
        rentalId: r.rentalId,
        mapPlotId: r.plotCode,
        name: r.plotCode ? `Thửa ${r.plotCode}` : `Thửa đất ${index + 1}`,
        location: 'Khu canh tác Farmely',
        area: `${r.plotArea || 0}m²`,
        mode: r.cultivationMode === 'SELF_GROWING' ? 'Self-Growing' : 'Assisted-Growing',
        crop: r.varietyName || 'Chưa có giống cây',
        stage: r.displayStatus || 'Đang canh tác',
        currentDay: 0,
        totalDays: r.durationDays || 0,
        progressPercent: 0,
        image: r.plotImageUrl || '/images/Mucangchai3.jpg',
        temp: '—', soilMoisture: '—', airHumidity: '—', light: '—', ph: '—',
        stationId: '—', status: r.status || 'ACTIVE', worker: 'Farmely điều phối',
        contractCode: r.contractId ? `CTR-${r.contractId}` : '—',
        expectedHarvestDate: r.endDate || '—', expectedYield: 'Chưa có dữ liệu'
      })));
      setActiveServiceOrders(unwrap(requestsBody).map((request) => ({
        id: `REQ-${request.requestId}`,
        serviceName: request.service?.serviceName || 'Dịch vụ canh tác',
        plotName: request.plotName || request.plotCode || 'Chưa có dữ liệu thửa',
        price: `${Number(request.service?.price || 0).toLocaleString('vi-VN')} đ`,
        date: request.scheduledDate || (request.createdAt ? new Date(request.createdAt).toLocaleDateString('vi-VN') : 'Chưa có ngày'),
        status: request.status || 'PENDING',
        statusLabel: request.status === 'DONE' ? 'Đã hoàn thành' : request.status === 'ASSIGNED' ? 'Đã tiếp nhận & phân công' : request.status === 'IN_PROG' ? 'Đang thực hiện' : 'Đang chờ xử lý',
        worker: request.status === 'ASSIGNED' || request.status === 'DONE' ? 'Farmely điều phối' : 'Chưa phân công',
        paymentMethod: 'Theo giao dịch hệ thống'
      })));
    }).catch(() => {
      if (!cancelled) { setApiServices([]); setApiCustomerPlots([]); setActiveServiceOrders([]); }
    });
    return () => { cancelled = true; };
  }, []);

  // IoT Data for Different Timeframes (Hourly, Daily, Weekly)
  const [iotDatasets, setIotDatasets] = useState({
    'PLOT-CC-01': {
      hourly: [
        { time: '00:00', temp: 24.2, moisture: 65, airHumidity: 82, light: 0 },
        { time: '04:00', temp: 23.5, moisture: 67, airHumidity: 85, light: 0 },
        { time: '08:00', temp: 27.8, moisture: 70, airHumidity: 74, light: 32 },
        { time: '12:00', temp: 31.2, moisture: 64, airHumidity: 68, light: 55 },
        { time: '16:00', temp: 29.5, moisture: 66, airHumidity: 71, light: 42 },
        { time: '20:00', temp: 26.1, moisture: 68, airHumidity: 78, light: 0 }
      ],
      daily: [
        { time: 'Thứ 2', temp: 27.5, moisture: 66, airHumidity: 75, light: 45 },
        { time: 'Thứ 3', temp: 28.0, moisture: 68, airHumidity: 72, light: 48 },
        { time: 'Thứ 4', temp: 26.8, moisture: 71, airHumidity: 80, light: 39 },
        { time: 'Thứ 5', temp: 29.2, moisture: 65, airHumidity: 70, light: 52 },
        { time: 'Thứ 6', temp: 28.5, moisture: 68, airHumidity: 74, light: 46 },
        { time: 'Thứ 7', temp: 27.9, moisture: 69, airHumidity: 76, light: 44 },
        { time: 'Chủ Nhật', temp: 28.3, moisture: 67, airHumidity: 73, light: 47 }
      ],
      weekly: [
        { time: 'Tuần 1', temp: 27.2, moisture: 67, airHumidity: 75, light: 44 },
        { time: 'Tuần 2', temp: 28.1, moisture: 68, airHumidity: 73, light: 48 },
        { time: 'Tuần 3', temp: 27.8, moisture: 70, airHumidity: 76, light: 45 },
        { time: 'Tuần 4', temp: 28.6, moisture: 66, airHumidity: 72, light: 50 }
      ]
    },
    'PLOT-MC-02': {
      hourly: [
        { time: '00:00', temp: 18.0, moisture: 60, airHumidity: 86, light: 0 },
        { time: '04:00', temp: 17.2, moisture: 63, airHumidity: 88, light: 0 },
        { time: '08:00', temp: 21.5, moisture: 64, airHumidity: 80, light: 28 },
        { time: '12:00', temp: 24.8, moisture: 61, airHumidity: 74, light: 48 },
        { time: '16:00', temp: 23.0, moisture: 62, airHumidity: 77, light: 35 },
        { time: '20:00', temp: 19.5, moisture: 63, airHumidity: 82, light: 0 }
      ],
      daily: [
        { time: 'Thứ 2', temp: 21.0, moisture: 61, airHumidity: 79, light: 40 },
        { time: 'Thứ 3', temp: 22.4, moisture: 63, airHumidity: 76, light: 42 },
        { time: 'Thứ 4', temp: 20.8, moisture: 65, airHumidity: 82, light: 35 },
        { time: 'Thứ 5', temp: 23.1, moisture: 60, airHumidity: 75, light: 44 },
        { time: 'Thứ 6', temp: 22.0, moisture: 62, airHumidity: 78, light: 38 },
        { time: 'Thứ 7', temp: 21.5, moisture: 64, airHumidity: 80, light: 39 },
        { time: 'Chủ Nhật', temp: 22.8, moisture: 62, airHumidity: 77, light: 41 }
      ],
      weekly: [
        { time: 'Tuần 1', temp: 21.2, moisture: 62, airHumidity: 80, light: 38 },
        { time: 'Tuần 2', temp: 22.0, moisture: 63, airHumidity: 78, light: 40 },
        { time: 'Tuần 3', temp: 21.6, moisture: 64, airHumidity: 81, light: 37 },
        { time: 'Tuần 4', temp: 22.5, moisture: 61, airHumidity: 76, light: 42 }
      ]
    },
    'PLOT-CG-03': {
      hourly: [
        { time: '00:00', temp: 26.0, moisture: 68, airHumidity: 80, light: 0 },
        { time: '04:00', temp: 25.0, moisture: 72, airHumidity: 84, light: 0 },
        { time: '08:00', temp: 28.5, moisture: 71, airHumidity: 75, light: 36 },
        { time: '12:00', temp: 32.0, moisture: 67, airHumidity: 69, light: 58 },
        { time: '16:00', temp: 30.5, moisture: 69, airHumidity: 73, light: 44 },
        { time: '20:00', temp: 27.5, moisture: 70, airHumidity: 77, light: 0 }
      ],
      daily: [
        { time: 'Thứ 2', temp: 28.5, moisture: 69, airHumidity: 74, light: 49 },
        { time: 'Thứ 3', temp: 29.2, moisture: 70, airHumidity: 71, light: 52 },
        { time: 'Thứ 4', temp: 28.0, moisture: 72, airHumidity: 78, light: 43 },
        { time: 'Thứ 5', temp: 30.1, moisture: 68, airHumidity: 70, light: 54 },
        { time: 'Thứ 6', temp: 29.0, moisture: 70, airHumidity: 72, light: 50 },
        { time: 'Thứ 7', temp: 28.7, moisture: 71, airHumidity: 75, light: 48 },
        { time: 'Chủ Nhật', temp: 29.5, moisture: 69, airHumidity: 73, light: 51 }
      ],
      weekly: [
        { time: 'Tuần 1', temp: 28.4, moisture: 70, airHumidity: 74, light: 48 },
        { time: 'Tuần 2', temp: 29.0, moisture: 71, airHumidity: 72, light: 51 },
        { time: 'Tuần 3', temp: 28.8, moisture: 69, airHumidity: 75, light: 49 },
        { time: 'Tuần 4', temp: 29.4, moisture: 70, airHumidity: 71, light: 53 }
      ]
    }
  });

  const numericIotPlotId = useMemo(() => {
    const match = String(selectedIotPlotId || '').match(/\d+/);
    return match ? Number(match[0]) : 1;
  }, [selectedIotPlotId]);

  const { latest: iotLatest, history: iotHistory, isConnected: isIotConnected } = useSensorStream(numericIotPlotId, 24);

  const baseIotPlot = customerPlots.find(p => p.id === selectedIotPlotId) || customerPlots[0] || {
    id: 'NONE',
    name: 'Chưa có thửa',
    crop: '',
    temp: '28°C',
    soilMoisture: '65%',
    airHumidity: '70%',
    light: '40.000 Lux',
    ph: '6.5',
    stationId: 'IOT-NONE'
  };
  const currentIotPlot = useMemo(() => {
    if (!iotLatest) return baseIotPlot;
    const tempNum = typeof iotLatest.temperature === 'number' ? iotLatest.temperature.toFixed(1) : null;
    const soilNum = typeof iotLatest.soilHumidity === 'number' ? Math.round(iotLatest.soilHumidity) : null;
    const airNum = typeof iotLatest.airHumidity === 'number' ? Math.round(iotLatest.airHumidity) : null;

    const recDate = iotLatest.recordedAt ? new Date(iotLatest.recordedAt) : new Date();
    const hour = !isNaN(recDate.getTime()) ? recDate.getHours() + recDate.getMinutes() / 60 : 12;
    const diff = Math.abs(hour - 12);
    const lightVal = hour >= 6 && hour <= 18 ? Math.round(Math.max(0, 1 - (diff / 6) ** 2) * 50) : 0;
    const lastUpdated = !isNaN(recDate.getTime())
      ? recDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : null;

    return {
      ...baseIotPlot,
      temp: tempNum !== null ? `${tempNum}°C` : (baseIotPlot?.temp || '28°C'),
      soilMoisture: soilNum !== null ? `${soilNum}%` : (baseIotPlot?.soilMoisture || '65%'),
      airHumidity: airNum !== null ? `${airNum}%` : (baseIotPlot?.airHumidity || '70%'),
      light: lightVal > 0 ? `${lightVal}.000 Lux` : (baseIotPlot?.light || '40.000 Lux'),
      lastUpdated
    };
  }, [baseIotPlot, iotLatest]);

  const currentIotData = useMemo(() => {
    const fallbackDataset = (iotDatasets[selectedIotPlotId] || iotDatasets['PLOT-CC-01'] || {})[iotTimeframe] || [];
    if (iotTimeframe !== 'hourly' || !Array.isArray(iotHistory) || iotHistory.length === 0) {
      return fallbackDataset;
    }

    const targetPoints = 16;
    let sampled = [];
    if (iotHistory.length <= targetPoints) {
      sampled = iotHistory;
    } else {
      const step = (iotHistory.length - 1) / (targetPoints - 1);
      for (let i = 0; i < targetPoints; i++) {
        sampled.push(iotHistory[Math.round(i * step)]);
      }
    }

    return sampled.map((item) => {
      const d = new Date(item.recordedAt);
      const timeStr = !isNaN(d.getTime())
        ? d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        : '';
      return {
        time: timeStr,
        temp: Number(Number(item.temperature).toFixed(1)),
        moisture: Math.round(Number(item.soilHumidity)),
        airHumidity: Math.round(Number(item.airHumidity)),
      };
    });
  }, [selectedIotPlotId, iotTimeframe, iotHistory]);

  // Service Catalog (Shop Dịch Vụ Nông Nghiệp)
  const serviceCatalog = [
    {
      id: 'SVC-FULL-CYCLE',
      name: 'Gói Ủy Thác Trọn Vụ (Từ Đầu Đến Thu Hoạch)',
      category: 'FULL',
      tag: 'Phổ biến nhất • Tiết kiệm 20%',
      price: 1500000,
      formattedPrice: '1.500.000 đ',
      unit: '/ trọn vụ (65 ngày)',
      icon: Sprout,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      description: 'Chuyển đổi hoàn hảo khi bạn chọn Self-growing nhưng bận rộn. Đội ngũ Farmely chăm sóc 100% từ gieo giống, tưới tiêu, bón phân đến nghiệm thu thu hoạch.',
      features: [
        'Công nhân trực tiếp chăm sóc theo phác đồ Chuyên gia',
        'Cập nhật Farm Diary hằng ngày có ảnh chụp đối chứng',
        'Bao gồm toàn bộ phân hữu cơ vi sinh VietGAP',
        'Đóng thùng bảo quản & giao rau tận nhà miễn phí'
      ]
    },
    {
      id: 'SVC-WEEKLY-CARE',
      name: 'Gói Chăm Sóc Định Kỳ Theo Tuần (7 Ngày)',
      category: 'CYCLE',
      tag: 'Tiện lợi khi đi công tác',
      price: 150000,
      formattedPrice: '150.000 đ',
      unit: '/ tuần (7 ngày)',
      icon: Calendar,
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      description: 'Phù hợp khi bạn đi công tác hoặc du lịch trong tuần. Kỹ thuật viên sẽ thay bạn kiểm tra luống, tưới ẩm và nhổ cỏ mỗi ngày liên tục.',
      features: [
        'Tưới nước và đo độ ẩm đất 2 ca sáng/chiều mỗi ngày',
        'Nhổ cỏ dại rãnh luống và bấm tỉa cành già',
        'Cập nhật 2 ảnh minh chứng hiện trường mỗi ngày'
      ]
    },
    {
      id: 'SVC-DAILY-CARE',
      name: 'Gói Tưới Nước & Chăm Sóc Theo Ngày',
      category: 'CYCLE',
      tag: 'Theo ngày yêu cầu',
      price: 30000,
      formattedPrice: '30.000 đ',
      unit: '/ ngày',
      icon: Droplets,
      color: 'bg-sky-50 text-sky-800 border-sky-200',
      description: 'Đặt lịch chăm sóc linh hoạt cho những ngày bạn bận đột xuất. Công nhân sẽ tưới ẩm đủ định mức và chụp ảnh đối chứng sau ca trực.',
      features: [
        'Tưới ẩm vi sinh theo đúng chỉ số trạm IoT',
        'Kiểm tra sâu bệnh mặt lá',
        'Gửi 01 ảnh ca trực vào Farm Diary của bạn'
      ]
    },
    {
      id: 'SVC-FERTILIZING',
      name: 'Dịch Vụ Bón Phân Hữu Cơ Vi Sinh VietGAP',
      category: 'SINGLE',
      tag: 'Dịch vụ lẻ',
      price: 80000,
      formattedPrice: '80.000 đ',
      unit: '/ lần thực hiện',
      icon: Layers,
      color: 'bg-purple-50 text-purple-800 border-purple-200',
      description: 'Bổ sung 5kg phân trùn quế hữu cơ cao cấp đã ủ hoai và tưới đạm cá lên men vi sinh, giúp cây đâm chồi mập mạp và rễ bám sâu.',
      features: [
        'Bao gồm 5kg phân trùn quế & chế phẩm vi sinh',
        'Xới đất nhẹ quanh gốc để phân ngấm đều',
        'Chụp ảnh bao bì và hiện trường sau khi bón'
      ]
    },
    {
      id: 'SVC-WEEDING',
      name: 'Dịch Vụ Nhổ Cỏ Tận Gốc & Làm Tơi Xốp Đất',
      category: 'SINGLE',
      tag: 'Dịch vụ lẻ',
      price: 50000,
      formattedPrice: '50.000 đ',
      unit: '/ lần thực hiện',
      icon: Flame,
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      description: 'Nhổ sạch cỏ dại cạnh tranh dinh dưỡng, xới tơi bề mặt đất luống giúp đất thoáng khí và giữ ẩm tốt hơn.',
      features: [
        'Làm sạch 100% cỏ dại trên toàn bộ diện tích thửa',
        'Xới tơi rãnh thoát nước chống ngập úng',
        'Thời gian hoàn tất: Trong vòng 3 giờ'
      ]
    },
    {
      id: 'SVC-PEST-CONTROL',
      name: 'Dịch Vụ Phun Thảo Mộc Trừ Sâu Sinh Học',
      category: 'SINGLE',
      tag: 'Chuẩn VietGAP 100%',
      price: 70000,
      formattedPrice: '70.000 đ',
      unit: '/ lần thực hiện',
      icon: ShieldCheck,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      description: 'Sử dụng dung dịch gừng - tỏi - ớt lên men vi sinh xua đuổi rầy, bọ trĩ, sâu tơ. Tuyệt đối không dùng thuốc hóa học, an toàn 100%.',
      features: [
        'Chế phẩm sinh học thảo mộc đạt chứng nhận VietGAP',
        'Bắt sâu thủ công kết hợp phun sương phòng ngừa',
        'Có thể thu hoạch ăn ngay sau 24 giờ'
      ]
    },
    {
      id: 'SVC-HARVEST-PACK',
      name: 'Dịch Vụ Hỗ Trợ Thu Hoạch & Đóng Thùng QR',
      category: 'SINGLE',
      tag: 'Nghiệm thu nông sản',
      price: 90000,
      formattedPrice: '90.000 đ',
      unit: '/ đợt thu hoạch',
      icon: Apple,
      color: 'bg-rose-50 text-rose-800 border-rose-200',
      description: 'Hái rau quả vào khung giờ sáng sớm (05:30 - 07:00), cân điện tử chụp ảnh đối chứng, đóng thùng xốp mát và dán tem QR truy xuất.',
      features: [
        'Cắt hái chuẩn kỹ thuật không làm dập nát',
        'Cân đo bằng cân điện tử có ảnh chụp đối chứng',
        'Đóng thùng bảo quản có tem QR nguồn gốc Farmely'
      ]
    }
  ];

  // Active / Purchased Service Orders (với đồng bộ localStorage để không mất khi tải lại trang)
  const getInitialServiceOrders = () => {
    try {
      const stored = localStorage.getItem('farmely_customer_service_orders');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  };

  const [activeServiceOrders, setActiveServiceOrders] = useState(getInitialServiceOrders);

  const serviceIconMap = { calendar: Calendar, layers: Layers, droplets: Droplets, sprout: Sprout };
  const effectiveServices = (apiServices && apiServices.length > 0)
    ? apiServices
    : ((masterServices && masterServices.length > 0) ? masterServices : serviceCatalog);
  const customerServiceCatalog = effectiveServices.map((service, index) => {
    const rawId = service.serviceId || service.id;
    const numId = typeof rawId === 'number' ? rawId : (Number(String(rawId).replace(/\D/g, '')) || (index + 1));
    return {
      ...service,
      serviceId: numId,
      id: service.id || `SVC-${numId}`,
      name: service.name || service.serviceName || 'Dịch vụ nông nghiệp',
      category: service.customerCategory || service.category || 'SINGLE',
      formattedPrice: service.formattedPrice || `${Number(service.price || 0).toLocaleString('vi-VN')} đ`,
      icon: service.icon || serviceIconMap[service.iconKey] || Sprout,
      color: service.color || (service.customerCategory === 'SINGLE'
        ? 'bg-purple-50 text-purple-800 border-purple-200'
        : 'bg-emerald-50 text-emerald-800 border-emerald-200'),
      active: service.active !== false && service.status !== 'INACTIVE',
      features: Array.isArray(service.features)
        ? service.features
        : Array.isArray(service.tasks)
          ? service.tasks.map((task) => (typeof task === 'string' ? task : task?.title || ''))
          : []
    };
  });
  const filteredServices = (serviceCategoryFilter === 'ALL'
    ? customerServiceCatalog
    : customerServiceCatalog.filter(s => s.category === serviceCategoryFilter)).sort((a, b) => {
      if (serviceSort === 'price') return (Number(a.price) || 0) - (Number(b.price) || 0);
      return String(a.name || '').localeCompare(String(b.name || ''), 'vi');
    });

  // Handle buy service
  const handleOpenBuyServiceModal = (svc) => {
    if (!svc) return;
    const rawId = svc.serviceId || svc.id;
    const numId = typeof rawId === 'number' ? rawId : (Number(String(rawId).replace(/\D/g, '')) || 1);
    const resolvedSvc = {
      ...svc,
      serviceId: numId
    };
    const targetPlot = customerPlots.find((plot) => plot.id === selectedPlotId) || selectedCheckoutPlot || customerPlots[0];
    if (targetPlot) setCheckoutPlotId(targetPlot.id);
    if (!checkoutDate) setCheckoutDate(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
    setSelectedServiceToBuy(resolvedSvc);
  };

  const handleEmergencyCareRequest = async (plot) => {
    if (emergencyRequests[plot.id]?.status === 'PROCESSING') return;
    const request = {
      id: `REQ-EMERGENCY-${Date.now()}`,
      serviceName: 'Chăm sóc khẩn cấp theo cảnh báo IoT',
      plotName: plot.name,
      price: 'Liên hệ xác nhận',
      date: 'Vừa gửi',
      status: 'IN_PROGRESS',
      statusLabel: 'Đang tiếp nhận',
      worker: 'Farmely đang điều phối CVLĐ',
      paymentMethod: 'Chưa thanh toán'
    };
    setEmergencyRequests((current) => ({ ...current, [plot.id]: { ...request, status: 'PROCESSING' } }));
    setActiveServiceOrders((orders) => [request, ...orders]);
    try {
      const response = await fetch('http://localhost:8085/api/services/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentalId: plot.id === 'PLOT-CC-01' ? 1 : plot.id === 'PLOT-MC-02' ? 2 : 3,
          serviceId: 1,
          scheduledDate: new Date().toISOString().slice(0, 10),
          notes: `Yêu cầu chăm sóc khẩn cấp từ cảnh báo IoT cho ${plot.name}`
        })
      });
      const data = await response.json().catch(() => null);
      if (data?.data?.requestId) {
        setEmergencyRequests((current) => ({ ...current, [plot.id]: { ...current[plot.id], id: `REQ-${data.data.requestId}` } }));
      }
    } catch (error) {
      console.debug('Emergency service request fallback active:', error);
    }
  };

  // Fetch existing cultivation service requests from backend to populate active orders
  const fetchServiceOrders = useCallback(() => {
    apiFetch('/api/services/requests')
      .then(unwrapData)
      .then(requests => {
        if (Array.isArray(requests)) {
          const backendOrders = requests.map(req => {
            const isCompleted = req.status === 'DONE' || req.taskStatus === 'COMPLETED' || req.taskStatus === 'DONE';
            return {
              id: `REQ-${req.requestId}`,
              requestId: req.requestId,
              rentalId: req.rentalId,
              plotCode: req.plotCode,
              plotId: req.plotCode ? `PLOT-${String(req.plotCode).replace(/^PLOT-/i, '')}` : undefined,
              serviceName: req.service?.serviceName || req.serviceName || 'Dịch vụ canh tác',
              plotName: req.plotName || (req.rentalId === 1 ? 'Thửa P-01' : `Rental #${req.rentalId}`),
              price: `${(Number(req.paidAmount || req.amount || req.service?.price || req.price) || 0).toLocaleString('vi-VN')} đ`,
              amount: Number(req.paidAmount || req.amount || req.service?.price || req.price) || 0,
              date: req.scheduledDate ? `${req.scheduledDate} • Lịch làm việc` : 'Hôm nay',
              scheduledDate: req.scheduledDate || '',
              status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
              statusLabel: isCompleted ? 'Đã hoàn tất' : (req.status === 'ASSIGNED' || req.assignedWorkerId ? 'Đang thực hiện (Đã phân công CVLĐ)' : 'Chờ xử lý'),
              worker: req.assignedWorker || req.assignedWorkerName || req.worker || (req.status === 'ASSIGNED' || isCompleted ? 'Trần Văn Lực (CVLĐ)' : 'Chưa phân công'),
              transactionId: req.transactionId ? `TXN-${req.transactionId}` : (req.gatewayRef || 'TXN-SUCCESS'),
              paymentMethod: req.paymentMethod || 'Chuyển khoản VietQR',
              paymentStatus: req.paymentStatus || 'SUCCESS',
              gatewayRef: req.gatewayRef,
              proofPhoto: req.proofPhoto || null,
              proofNotes: req.proofNotes || req.note || req.notes || '',
              completedAt: req.completedAt || null
            };
          });
          setActiveServiceOrders(() => {
            try {
              localStorage.setItem('farmely_customer_service_orders', JSON.stringify(backendOrders));
            } catch {}
            return backendOrders;
          });
        }
      })
      .catch(err => console.debug('Backend service requests initial sync skipped:', err));
  }, []);

  useEffect(() => {
    fetchServiceOrders();
    const handleServicePaid = () => {
      fetchServiceOrders();
      if (typeof loadOperationsFromDb === 'function') {
        loadOperationsFromDb();
      }
    };
    window.addEventListener('farmely_service_paid', handleServicePaid);
    return () => window.removeEventListener('farmely_service_paid', handleServicePaid);
  }, [fetchServiceOrders]);

  const handleDirectServicePayment = async () => {
    if (!selectedServiceToBuy) return;
    setIsProcessingPayment(true);
    try {
      const targetPlot = customerPlots.find((p) => p.id === checkoutPlotId) || selectedCheckoutPlot || customerPlots[0];
      const targetRentalId = targetPlot?.rentalId || targetPlot?.rental_id || 1;
      const targetPlotCode = targetPlot?.mapPlotId || targetPlot?.plotCode || (targetPlot?.id ? targetPlot.id.replace(/^PLOT-/i, '') : 'P-01');
      const targetServiceId = typeof selectedServiceToBuy.serviceId === 'number'
        ? selectedServiceToBuy.serviceId
        : (parseInt(String(selectedServiceToBuy.serviceId || selectedServiceToBuy.id || 1).replace(/\D/g, ''), 10) || 1);

      const scheduledDate = checkoutDate || new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      const gatewayRef = `TXN_SVC_${Date.now().toString().slice(-8)}`;

      const payload = {
        rentalId: targetRentalId,
        serviceId: targetServiceId,
        serviceName: selectedServiceToBuy.name,
        plotCode: targetPlotCode,
        scheduledDate: scheduledDate,
        amount: Number(selectedServiceToBuy.price) || 0,
        notes: checkoutNotes || '',
        paymentMethod: checkoutPaymentMethod || 'DIRECT',
        gatewayRef: gatewayRef
      };

      const res = await fetch('/api/v1/payments/service/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      const detail = resData?.data || resData;

      const resultInfo = {
        transactionId: detail.transactionId || `TXN-${Date.now().toString().slice(-6)}`,
        requestId: detail.requestId || `REQ-${Date.now().toString().slice(-4)}`,
        taskId: detail.taskId || `TSK-${Date.now().toString().slice(-4)}`,
        serviceName: selectedServiceToBuy.name,
        plotName: targetPlot?.name || `Thửa ${targetPlotCode}`,
        plotCode: targetPlotCode,
        plotId: targetPlot?.id,
        amount: selectedServiceToBuy.price,
        formattedAmount: selectedServiceToBuy.formattedPrice,
        scheduledDate: scheduledDate,
        paymentMethod: checkoutPaymentMethod === 'DIRECT'
          ? 'Thanh toán trực tiếp'
          : checkoutPaymentMethod === 'WALLET'
            ? 'Ví Farmely Pay'
            : checkoutPaymentMethod === 'VIETQR'
              ? 'Chuyển khoản VietQR'
              : 'Cổng VNPAY',
        gatewayRef: detail.gatewayRef || gatewayRef
      };

      setLastPaymentResult(resultInfo);

      // Thêm ngay đơn hàng mới vào state và localStorage để hiển thị tức thì
      const newOrder = {
        id: detail.requestId ? `REQ-${detail.requestId}` : (resultInfo.requestId ? `REQ-${resultInfo.requestId}` : `REQ-${Date.now().toString().slice(-4)}`),
        requestId: detail.requestId,
        transactionId: resultInfo.transactionId,
        serviceName: selectedServiceToBuy.name,
        plotName: targetPlot?.name || `Thửa ${targetPlotCode}`,
        plotCode: targetPlotCode,
        plotId: targetPlot?.id,
        rentalId: targetRentalId,
        price: selectedServiceToBuy.formattedPrice,
        amount: Number(selectedServiceToBuy.price) || 0,
        date: `${scheduledDate} • Hôm nay`,
        scheduledDate: scheduledDate,
        status: 'IN_PROGRESS',
        statusLabel: 'Đang thực hiện (Đã phân công CVLĐ)',
        worker: 'Trần Văn Lực (CVLĐ)',
        paymentMethod: resultInfo.paymentMethod,
        paymentStatus: 'SUCCESS',
        gatewayRef: resultInfo.gatewayRef,
        proofPhoto: null,
        proofNotes: checkoutNotes || '',
        notes: checkoutNotes || ''
      };

      setActiveServiceOrders((prev) => {
        const next = [newOrder, ...prev.filter((p) => p.id !== newOrder.id)];
        try {
          localStorage.setItem('farmely_customer_service_orders', JSON.stringify(next));
        } catch {}
        return next;
      });

      // Đồng bộ ngay đơn hàng dịch vụ và lịch canh tác từ cơ sở dữ liệu
      fetchServiceOrders();
      if (typeof loadOperationsFromDb === 'function') {
        loadOperationsFromDb();
      }

      window.dispatchEvent(new CustomEvent('farmely_service_paid', { detail: resultInfo }));
      setSelectedServiceToBuy(null);
      setShowCheckoutSuccessModal(true);
    } catch (err) {
      console.error('Lỗi thanh toán dịch vụ:', err);
      alert('Không thể hoàn tất thanh toán dịch vụ: ' + (err.message || 'Lỗi kết nối'));
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!selectedServiceToBuy) return;

    if (checkoutPaymentMethod === 'VNPAY') {
      setShowServiceVnPayModal(true);
      return;
    }
    if (checkoutPaymentMethod === 'CARD') {
      setShowServiceCardModal(true);
      return;
    }
    await handleDirectServicePayment();
  };

  const handleServicePaymentSuccess = (paidResult) => {
    setShowServiceQrModal(false);
    setShowServiceCardModal(false);
    setShowServiceVnPayModal(false);
    fetchServiceOrders();
    if (typeof loadOperationsFromDb === 'function') {
      loadOperationsFromDb();
    }
    const targetPlot = customerPlots.find(p => p.id === checkoutPlotId) || selectedCheckoutPlot || customerPlots[0];
    const targetPlotCode = targetPlot?.mapPlotId || targetPlot?.plotCode || (targetPlot?.id ? targetPlot.id.replace(/^PLOT-/i, '') : 'P-01');
    const newOrder = {
      id: paidResult?.requestId ? `REQ-${paidResult.requestId}` : `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      requestId: paidResult?.requestId,
      transactionId: paidResult?.transactionId || `TXN-SVC-${Date.now().toString().slice(-6)}`,
      serviceName: selectedServiceToBuy?.name || 'Dịch vụ canh tác',
      plotName: targetPlot ? targetPlot.name : 'Thửa đất đã chọn',
      plotCode: targetPlotCode,
      plotId: targetPlot?.id,
      rentalId: targetPlot?.rentalId || targetPlot?.rental_id || 1,
      price: selectedServiceToBuy ? selectedServiceToBuy.formattedPrice : `${(paidResult?.amount || 0).toLocaleString('vi-VN')} đ`,
      amount: Number(paidResult?.amount || selectedServiceToBuy?.price || 0),
      date: `${checkoutDate || new Date().toISOString().slice(0, 10)} • Mới kích hoạt`,
      scheduledDate: checkoutDate || new Date().toISOString().slice(0, 10),
      status: 'IN_PROGRESS',
      statusLabel: 'Đang thực hiện (Đã phân công CVLĐ)',
      worker: 'Trần Văn Lực (CVLĐ)',
      paymentMethod: paidResult?.paymentMethod || (checkoutPaymentMethod === 'VNPAY' ? 'Cổng VNPAY Sandbox' : checkoutPaymentMethod === 'CARD' ? 'Thẻ Quốc tế / Nội địa' : 'Ví Farmely'),
      paymentStatus: 'SUCCESS',
      gatewayRef: paidResult?.gatewayRef || `TXN_SVC_${Date.now().toString().slice(-8)}`,
      proofPhoto: null,
      proofNotes: checkoutNotes || ''
    };

    setActiveServiceOrders(prev => {
      const next = [newOrder, ...prev.filter(p => p.id !== newOrder.id)];
      try {
        localStorage.setItem('farmely_customer_service_orders', JSON.stringify(next));
      } catch {}
      return next;
    });
    if (paidResult) {
      setLastPaymentResult(paidResult);
    }
    setSelectedServiceToBuy(null);
    setShowCheckoutSuccessModal(true);
  };

  const currentSelectedPlot = customerPlots.find((p) => p.id === selectedPlotId);
  const diaryFocusPlot = customerPlots.find((p) => p.id === diaryFocusPlotId) || customerPlots[0];
  const scopedPlot = customerPlots.find((p) => p.id === plotScopeId) || null;
  const scopedPlots = scopedPlot ? [scopedPlot] : customerPlots;
  const scopedServiceOrders = scopedPlot
    ? activeServiceOrders.filter((ord) =>
        ord.plotName === scopedPlot.name ||
        (scopedPlot.name && scopedPlot.name.includes(ord.plotName)) ||
        (ord.plotName && ord.plotName.includes(scopedPlot.name)) ||
        ord.plotCode === scopedPlot.mapPlotId ||
        ord.plotCode === scopedPlot.plotCode ||
        ord.rentalId === scopedPlot.rentalId
      )
    : activeServiceOrders;
  const harvestModalPlot = customerPlots.find((p) => p.id === harvestModalPlotId || p.plotCode === harvestModalPlotId) || null;

  /** Từ trang 1 thửa sang trang chức năng: giữ nguyên ngữ cảnh thửa đó */
  const openPlotScopedTab = (tab, plotId) => {
    setPlotScopeId(plotId);
    if (tab === 'diary') setDiaryFocusPlotId(plotId);
    if (tab === 'services') setCheckoutPlotId(plotId);
    setActiveTab(tab);
    setSelectedPlotId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const backToScopedPlot = () => {
    const id = plotScopeId;
    setPlotScopeId(null);
    setSelectedPlotId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmHarvestPlan = (plan) => {
    const targetKey = plan.plotCode || plan.plotId;
    setHarvestPlans((prev) => ({ ...prev, [targetKey]: plan, [plan.plotId]: plan }));
    try {
      const shared = JSON.parse(localStorage.getItem('farmely_shared_harvest_plans') || '[]');
      const existingIdx = shared.findIndex(item => item.plotCode === (plan.plotCode || plan.plotId) || item.plotId === plan.plotId);
      const newReq = {
        id: existingIdx >= 0 ? shared[existingIdx].id : `HARV-REQ-${Date.now().toString().slice(-4)}`,
        plotId: plan.plotId,
        plotCode: plan.plotCode || plan.plotId,
        plotName: plan.plotName || `Thửa ${plan.plotCode || plan.plotId}`,
        crop: plan.crop || 'Cà chua bi đỏ F1',
        renterName: user?.fullName || 'Lô Thái Quyền',
        renterEmail: user?.email || 'customer@farmely.vn',
        phone: plan.phone || user?.phone || '0901234567',
        address: plan.address || '',
        requestedDate: plan.date,
        method: plan.method,
        methodLabel: plan.methodLabel,
        expectedYield: plan.expectedYield || 'Theo mùa vụ',
        phiDays: 6,
        phiStandardDays: 5,
        status: 'PENDING',
        notes: plan.notes || '',
        createdAt: new Date().toISOString(),
        workerName: 'Trần Văn Lực (CVLĐ)'
      };
      if (existingIdx >= 0) {
        shared[existingIdx] = { ...shared[existingIdx], ...newReq };
      } else {
        shared.unshift(newReq);
      }
      localStorage.setItem('farmely_shared_harvest_plans', JSON.stringify(shared));
      try {
        const bc = new BroadcastChannel('farmely_harvest_sync');
        bc.postMessage({ type: 'HARVEST_PLAN_UPDATED' });
        bc.close();
      } catch {}
    } catch (err) {
      console.warn('Sync harvest plans error:', err);
    }
    setHarvestModalPlotId(null);
  };

  const handleCancelHarvestPlan = (plotId) => {
    setHarvestPlans((prev) => {
      const next = { ...prev };
      delete next[plotId];
      return next;
    });
    setHarvestModalPlotId(null);
  };

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const requestedPlotId = query.get('plot');
    const requestedPlotCode = query.get('plotCode');
    const requestedView = query.get('view') || query.get('tab');
    const fromPlotId = query.get('fromPlot');
    const requestedPlot = (requestedPlotId || requestedPlotCode) && customerPlots.find((plot) =>
      plot.id === requestedPlotId ||
      plot.mapPlotId === requestedPlotId ||
      String(plot.plotId) === requestedPlotId ||
      plot.plotCode === requestedPlotCode ||
      plot.mapPlotId === requestedPlotCode ||
      plot.id === `PLOT-${requestedPlotCode}` ||
      (requestedPlotId && (plot.id === `PLOT-${requestedPlotId}` || plot.plotCode === requestedPlotId))
    );

    if (requestedView === 'tasks') {
      setActiveTab('yards');
      if (requestedPlot) {
        setSelectedPlotId(requestedPlot.id);
        setCheckoutPlotId(requestedPlot.id);
      } else {
        setSelectedPlotId(null);
      }
    } else if (requestedPlot) {
      setActiveTab('yards');
      setSelectedPlotId(requestedPlot.id);
      setCheckoutPlotId(requestedPlot.id);
    } else if (['contracts', 'harvest', 'process', 'iot', 'diary', 'services'].includes(requestedView)) {
      setSelectedPlotId(null);
      setActiveTab(requestedView);
      if (requestedView === 'iot') setIotReturnPlotId(fromPlotId || null);
    } else if (!requestedPlotId && !requestedPlotCode && !requestedView) {
      setSelectedPlotId(null);
      setActiveTab('yards');
      setIotReturnPlotId(null);
    }
  }, [location.search]);

  const defaultPlotOperations = {
    'PLOT-CC-01': {
      tasks: [
        { id: 'TSK-103', title: 'Bón bổ sung 5kg phân trùn quế', time: '15:00 hôm nay', status: 'IN_PROGRESS', owner: 'Trần Văn Lực' },
        { id: 'TSK-104', title: 'Kiểm tra độ ẩm & tưới vi sinh', time: '07:30 ngày mai', status: 'PENDING', owner: 'Trần Văn Lực' },
        { id: 'TSK-099', title: 'Tỉa lá già tầng gốc', time: '09:10 hôm qua', status: 'COMPLETED', owner: 'Trần Văn Lực' }
      ],
      diary: [
        { time: '08:25 • Hôm nay', title: 'Đã tưới 15L nước vi sinh', note: 'Độ ẩm sau tưới đạt 68%, đã có ảnh minh chứng.', author: 'Trần Văn Lực' },
        { time: '16:40 • Hôm qua', title: 'Chuyên gia cập nhật phác đồ dinh dưỡng', note: 'Giảm 20% đạm cá, bổ sung phân trùn quế quanh gốc.', author: 'ThS. Nguyễn Hoàng Nam' }
      ]
    },
    'PLOT-MC-02': {
      tasks: [
        { id: 'TSK-207', title: 'Kiểm tra độ cuộn bắp trước thu hoạch', time: '09:00 hôm nay', status: 'PENDING', owner: 'Khách hàng' },
        { id: 'TSK-205', title: 'Tưới ẩm nhẹ buổi sáng', time: '07:00 hôm nay', status: 'COMPLETED', owner: 'Khách hàng' }
      ],
      diary: [{ time: '07:20 • Hôm nay', title: 'Tưới ẩm trước thu hoạch', note: 'Độ ẩm giữ ở mức 62%, lá không đọng nước.', author: 'Lô Thái Quyền' }]
    },
    'PLOT-CG-03': {
      tasks: [
        { id: 'TSK-308', title: 'Buộc ngọn dưa leo lên giàn', time: '14:30 hôm nay', status: 'IN_PROGRESS', owner: 'Nguyễn Văn Đạt' },
        { id: 'TSK-309', title: 'Kiểm tra bọ trĩ mặt dưới lá', time: '16:00 hôm nay', status: 'PENDING', owner: 'Nguyễn Văn Đạt' }
      ],
      diary: [{ time: '10:15 • Hôm nay', title: 'Kiểm tra sinh trưởng dây leo', note: 'Cây cao trung bình 82cm, chưa ghi nhận sâu bệnh.', author: 'Nguyễn Văn Đạt' }]
    }
  };
  const [plotOperations, setPlotOperations] = useState(defaultPlotOperations);

  const loadOperationsFromDb = () => {
    Promise.allSettled([
      fetch('/api/care-tasks').then((r) => r.json()),
      fetch('/api/farm-diaries').then((r) => r.json())
    ]).then(([resTasks, resDiaries]) => {
      const liveTasks = resTasks.status === 'fulfilled' && resTasks.value?.data ? resTasks.value.data : [];
      const liveDiaries = resDiaries.status === 'fulfilled' && resDiaries.value?.data ? resDiaries.value.data : [];

      if (liveTasks.length > 0 || liveDiaries.length > 0) {
        setPlotOperations((prev) => {
          const next = { ...prev };

          liveTasks.forEach((t) => {
            const rawPlotCode = t.plotCode || 'P-01';
            const cleanCode = String(rawPlotCode).replace(/^PLOT-/i, '').trim();
            const matchingPlot = (customerPlots || []).find((p) =>
              (t.rentalId && (p.rentalId === t.rentalId || p.rental_id === t.rentalId)) ||
              p.id === `PLOT-${cleanCode}` ||
              p.id === cleanCode ||
              p.mapPlotId === cleanCode ||
              p.plot_code === cleanCode ||
              p.plotCode === cleanCode
            );

            const targetKeys = new Set();
            targetKeys.add(`PLOT-${cleanCode}`);
            targetKeys.add(cleanCode);
            if (t.rentalId) {
              targetKeys.add(`RENTAL-${t.rentalId}`);
              targetKeys.add(String(t.rentalId));
            }
            if (matchingPlot) {
              targetKeys.add(matchingPlot.id);
              if (matchingPlot.mapPlotId) targetKeys.add(matchingPlot.mapPlotId);
              if (matchingPlot.plotCode) targetKeys.add(matchingPlot.plotCode);
              if (matchingPlot.rentalId) {
                targetKeys.add(`RENTAL-${matchingPlot.rentalId}`);
                targetKeys.add(String(matchingPlot.rentalId));
              }
            }

            const formattedTask = {
              id: t.id || `TSK-${t.taskId}`,
              taskId: t.taskId,
              title: t.title,
              time: t.dueDate ? `${t.dueDate} (08:30)` : 'Hôm nay',
              status: t.status,
              owner: t.workerName || t.assignedTo || 'Trần Văn Lực (CVLĐ)',
              crop: t.crop,
              instructions: t.instructions,
              proofPhoto: t.proofPhoto,
              completedAt: t.completedAt
            };

            targetKeys.forEach((key) => {
              if (!next[key]) {
                next[key] = { tasks: [], diary: [] };
              }
              const existingIdx = next[key].tasks.findIndex((existing) => existing.id === t.id || (t.taskId && existing.taskId === t.taskId));
              if (existingIdx >= 0) {
                next[key].tasks[existingIdx] = { ...next[key].tasks[existingIdx], ...formattedTask };
              } else {
                next[key].tasks.push(formattedTask);
              }
            });
          });

          liveDiaries.forEach((d) => {
            const rawPlotCode = d.plotCode || 'P-01';
            const matchingPlot = (customerPlots || []).find((p) =>
              p.id === `PLOT-${rawPlotCode}` ||
              p.id === rawPlotCode ||
              p.mapPlotId === rawPlotCode ||
              (d.rentalId && (p.rentalId === d.rentalId || p.rental_id === d.rentalId))
            );

            const targetKeys = new Set();
            targetKeys.add(`PLOT-${rawPlotCode}`);
            targetKeys.add(rawPlotCode);
            if (d.rentalId) {
              targetKeys.add(`RENTAL-${d.rentalId}`);
              targetKeys.add(String(d.rentalId));
            }
            if (matchingPlot) {
              targetKeys.add(matchingPlot.id);
              if (matchingPlot.rentalId) {
                targetKeys.add(`RENTAL-${matchingPlot.rentalId}`);
                targetKeys.add(String(matchingPlot.rentalId));
              }
            }

            const formattedDiary = {
              id: d.id,
              time: d.dateFormatted || 'Hôm nay',
              title: d.content ? d.content.slice(0, 40) : 'Cập nhật hiện trường',
              note: d.content,
              author: d.authorName || 'Trần Văn Lực (CVLĐ)'
            };

            targetKeys.forEach((key) => {
              if (!next[key]) {
                next[key] = { tasks: [], diary: [] };
              }
              if (!next[key].diary.some((existing) => existing.id === d.id)) {
                next[key].diary.unshift(formattedDiary);
              }
            });
          });

          return next;
        });
      }
    });
  };

  useEffect(() => {
    loadOperationsFromDb();
  }, [user]);
  useEffect(() => {
    if (customerPlots.length > 0) {
      loadOperationsFromDb();
    }
  }, [customerPlots.length]);

  // Load Cultivation Processes and Harvest Acceptance from PostgreSQL
  const [dbCultivationProcesses, setDbCultivationProcesses] = useState({});
  const [dbHarvestResults, setDbHarvestResults] = useState([]);
  const [selectedHarvestForAccept, setSelectedHarvestForAccept] = useState(null);

  const fetchCultivationProcesses = useCallback(() => {
    const userId = user?.userId || user?.id || 1;
    fetch(`/api/customer/cultivation-processes?userId=${userId}`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((res) => {
        const items = res?.data || (Array.isArray(res) ? res : []);
        const grouped = {};
        items.forEach((item) => {
          const keys = [
            item.plotId,
            item.plotCode,
            `RENTAL-${item.rentalId}`,
            String(item.rentalId)
          ];
          keys.forEach((k) => {
            if (k) {
              if (!grouped[k]) grouped[k] = [];
              grouped[k].push({
                stage: item.stage,
                date: item.date,
                guide: item.guide,
                status: item.status,
                stepOrder: item.stepOrder,
                materials: item.materialsNeeded
              });
            }
          });
        });
        setDbCultivationProcesses(grouped);
      })
      .catch(() => {});
  }, [user]);

  const fetchHarvestResults = useCallback(() => {
    const userId = user?.userId || user?.id || 1;
    fetch(`/api/customer/harvest-results?userId=${userId}`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((res) => {
        const items = res?.data || (Array.isArray(res) ? res : []);
        setDbHarvestResults(items);
        if (items.length > 0) {
          const confirmedOne = items.find((h) => h.customerConfirmed || h.status === 'CONFIRMED');
          if (confirmedOne) {
            setHarvestAcceptance({
              status: 'CONFIRMED',
              confirmedAt: confirmedOne.createdAt,
              deliveryMethod: confirmedOne.deliveryType
            });
          }
        }
      })
      .catch(() => setDbHarvestResults([]));
  }, [user]);

  useEffect(() => {
    fetchCultivationProcesses();
    fetchHarvestResults();
  }, [fetchCultivationProcesses, fetchHarvestResults, customerPlots.length]);

  const cultivationProcesses = dbCultivationProcesses;
  const fallbackIotAlerts = {
    'PLOT-CC-01': [
      { level: 'HIGH', title: 'Mưa có thể đến sau 45 phút', metric: 'Dự báo mưa 8.2 mm', time: '5 phút trước' },
      { level: 'MEDIUM', title: 'Độ ẩm đất tăng nhanh', metric: '68% → 72% trong 30 phút', time: '12 phút trước' }
    ],
    'PLOT-MC-02': [
      { level: 'MEDIUM', title: 'Cường độ nắng cao lúc 12:00', metric: '38.000 Lux', time: '18 phút trước' },
      { level: 'LOW', title: 'Độ ẩm đất gần ngưỡng thấp', metric: '62% · ngưỡng khuyến nghị 60–75%', time: '32 phút trước' }
    ],
    'PLOT-CG-03': [
      { level: 'HIGH', title: 'Gió tăng cao tại khu vực giàn', metric: '28 km/h', time: '8 phút trước' },
      { level: 'MEDIUM', title: 'Nhiệt độ tăng', metric: '29°C · cao hơn 2°C so với hôm qua', time: '25 phút trước' }
    ]
  };
  const iotAlerts = fallbackIotAlerts;

  function defaultOperationsForPlot(plot) {
    return {
      tasks: [
        { id: `TSK-${plot?.id || '1'}-01`, title: `Kiểm tra độ ẩm & tưới vi sinh cho ${plot?.crop || 'cây trồng'}`, time: '07:30 hôm nay', status: 'IN_PROGRESS', owner: plot?.mode === 'Self-Growing' ? 'Khách hàng' : (plot?.worker || 'Trần Văn Lực (CVLĐ)') },
        { id: `TSK-${plot?.id || '1'}-02`, title: 'Kiểm tra sinh trưởng và chỉ số vi khí hậu IoT', time: '14:00 hôm nay', status: 'PENDING', owner: 'Farmely Smart Monitor' },
        { id: `TSK-${plot?.id || '1'}-03`, title: 'Cắt tỉa lá gốc và vệ sinh luống canh tác', time: '09:00 hôm qua', status: 'COMPLETED', owner: plot?.mode === 'Self-Growing' ? 'Khách hàng' : (plot?.worker || 'Trần Văn Lực (CVLĐ)') }
      ],
      diary: [
        { time: '08:15 • Hôm nay', title: 'Tưới nước vi sinh & kiểm tra đất', note: `Độ ẩm duy trì ở mức ${plot?.soilMoisture || '68%'}, vi sinh phát triển tốt.`, author: plot?.worker || 'Trần Văn Lực' },
        { time: '16:00 • Hôm qua', title: 'Kiểm tra sinh trưởng định kỳ', note: `Cây đang trong giai đoạn ${plot?.stage || 'phát triển tốt'}, không phát hiện sâu bệnh.`, author: 'ThS. Nguyễn Hoàng Nam' }
      ]
    };
  }

  const defaultProcessForPlot = (plot) => {
    const resolved = resolveStandardCropProcess(plot);
    if (resolved?.stages?.length) {
      return resolved.stages.map((st) => ({
        stage: st.name,
        date: st.label,
        guide: st.guide,
        status: st.status
      }));
    }
    return [
      { stage: 'Gieo giống & bén rễ', date: 'Ngày 1 - 7', guide: 'Giữ ẩm đất 60–70%, che lưới mát, kiểm tra độ nảy mầm.', status: 'COMPLETED' },
      { stage: 'Sinh trưởng thân lá', date: 'Ngày 8 - 22', guide: 'Bổ sung dinh dưỡng hữu cơ VietGAP và tỉa chồi nách định kỳ.', status: 'IN_PROGRESS' },
      { stage: 'Ra hoa & đậu quả non', date: 'Ngày 23 - 35', guide: 'Theo dõi vi khí hậu và bón bổ sung Kali hữu cơ, chống rụng hoa.', status: 'PENDING' },
      { stage: 'Nuôi trái & thu hoạch', date: 'Ngày 36 - 45', guide: 'Đạt chuẩn VietGAP, kiểm tra dư lượng an toàn và thu hoạch.', status: 'PENDING' }
    ];
  };

  const defaultAlertsForPlot = (plot) => [
    { level: 'LOW', title: 'Nhiệt độ & ẩm độ tối ưu', metric: `${plot?.temp || '28°C'} · Ẩm đất ${plot?.soilMoisture || '68%'}`, time: '10 phút trước' }
  ];

  const currentPlotOperations = plotOperations[selectedPlotId] || (currentSelectedPlot ? defaultOperationsForPlot(currentSelectedPlot) : { tasks: [], diary: [] });
  const plotTabFromUrl = new URLSearchParams(location.search).get('tab') || 'overview';

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || chatInput;
    if (!query.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput('');
    setIsAiTyping(true);

    try {
      // 1. Thử gọi qua API Gateway / Vite Proxy: /api/ai/chat
      let response;
      const requestBody = JSON.stringify({
        userId: 1,
        conversationId: aiConversationId,
        plotId: 1,
        message: query
      });

      try {
        response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody
        });
      } catch (err) {
        // Fallback gọi trực tiếp port 8089 nếu chưa bật Gateway
        response = await fetch('http://localhost:8089/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody
        });
      }

      if (response && response.ok) {
        const data = await response.json();
        if (data.conversationId) {
          setAiConversationId(data.conversationId);
        }

        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: data.reply,
            sources: data.referencedDocuments || [],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setIsAiTyping(false);
        return;
      }
      throw new Error('API response not ok');
    } catch (err) {
      console.warn('AI Service chưa khởi chạy hoặc lỗi mạng, sử dụng fallback thông minh:', err);
      // Fallback mô phỏng khi chưa bật backend
      setTimeout(() => {
        let reply = 'Hệ thống Farmely AI đã ghi nhận câu hỏi từ bạn. ';
        const lower = query.toLowerCase();

        if (lower.includes('độ ẩm') || lower.includes('tưới')) {
          reply = 'Farmely AI nhận thấy: Độ ẩm đất chuẩn VietGAP lý tưởng duy trì từ 65% – 75%. Nếu độ ẩm vượt 80% thì hệ thống khuyến nghị tạm hoãn cữ tưới chiều nay để tránh úng rễ và xới nhẹ luống đất cho thoáng khí.';
        } else if (lower.includes('sâu') || lower.includes('bệnh') || lower.includes('rệp') || lower.includes('vietgap')) {
          reply = 'Farmely áp dụng 100% biện pháp sinh học hữu cơ: Dùng dung dịch tỏi ớt gừng lên men hoặc dầu khoáng sinh học SK Enspray pha loãng phun đều hai mặt lá vào chiều mát để xử lý rầy mềm và bọ trĩ.';
        } else if (lower.includes('thu hoạch') || lower.includes('khi nào')) {
          reply = 'Rau cải ngọt, cải thìa thì 25-30 ngày là thu hoạch được; còn xà lách Romaine chu kỳ từ 35-45 ngày. Nên thu hoạch sáng sớm hoặc chiều mát, dùng dụng cụ sạch cắt cách gốc 2cm.';
        } else if (lower.includes('dịch vụ') || lower.includes('thuê') || lower.includes('bón phân')) {
          reply = 'Bạn có thể vào tab "Dịch vụ canh tác" để đặt các gói chăm sóc trọn vụ, gói theo tuần hoặc các dịch vụ lẻ như bón phân, nhổ cỏ. Hệ thống hỗ trợ thanh toán trực tuyến cực kỳ nhanh chóng.';
        } else {
          reply = `Xin chào bạn! Farmely AI luôn sẵn sàng hỗ trợ bạn kỹ thuật canh tác rau sạch chuẩn VietGAP, theo dõi độ ẩm vi khí hậu và thủ tục dịch vụ nông trại.`;
        }

        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: reply,
            sources: [
              { docTitle: 'Quy trình VietGAP', sectionTitle: 'Hướng dẫn tham khảo' }
            ],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setIsAiTyping(false);
      }, 700);
    }
  };

  const navMenuItems = [
    {
      id: 'yards',
      label: 'Thửa đất của tôi',
      desc: 'Quản lý các thửa đang canh tác',
      icon: Sprout,
      badge: `${customerPlots.length} Thửa`
    },
    {
      id: 'services',
      label: 'Dịch vụ canh tác',
      desc: 'Ủy thác trọn vụ, ngày/tuần & dịch vụ lẻ',
      icon: ShoppingBag,
      badge: 'Trọn vụ & Lẻ'
    },
    {
      id: 'iot',
      label: 'Dữ liệu vi khí hậu IoT',
      desc: 'Biểu đồ trạm đo theo giờ, ngày, tuần',
      icon: Radio
    },
    {
      id: 'diary',
      label: 'Nhật ký canh tác',
      desc: 'Farm Diary & minh chứng ca trực',
      icon: BookOpen,
      badge: 'Mới'
    },
    {
      id: 'ai',
      label: 'Trợ lý nông nghiệp AI',
      desc: 'Hỏi đáp kỹ thuật trồng VietGAP',
      icon: Bot,
      isAi: true
    }
  ];

  return (
    <div className="dashboard-readable min-h-screen bg-brand-cream flex flex-col font-sans overflow-x-hidden">
      <aside className={`fixed inset-y-0 left-0 z-[60] hidden flex-col bg-[#063d2b] text-white shadow-2xl transition-[width] duration-200 lg:flex ${sidebarCollapsed ? 'w-16' : 'w-72'}`}>
        <div className={`flex items-center border-b border-white/10 ${sidebarCollapsed ? 'flex-col justify-center gap-3 p-3' : 'gap-3 px-5 py-5'}`}>
          <Link to="/" className="flex shrink-0 items-center gap-2 text-xl font-black tracking-wide"><Sprout className="h-8 w-8 text-lime-400" />{!sidebarCollapsed && 'FARMELY'}</Link>
          <button type="button" onClick={() => setSidebarCollapsed((value) => !value)} className={`${sidebarCollapsed ? '' : 'ml-auto'} flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white`} aria-label={sidebarCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'} title={sidebarCollapsed ? 'Mở rộng' : 'Thu gọn'}>
            {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        </div>
        <div className="flex-1 space-y-2 px-3 py-6">
          {!sidebarCollapsed && <p className="px-3 pb-2 text-xs font-bold uppercase tracking-widest text-white/55">Quản lý nông trại</p>}
          {[
            ['Tổng quan', LayoutDashboard, 'overview'],
            ['Kế hoạch thu hoạch & nghiệm thu', Apple, 'harvest']
          ].map(([label, Icon, id]) => {
            const isActive = id === 'overview' ? (activeTab === 'yards' || Boolean(selectedPlotId)) : (!selectedPlotId && activeTab === id);
            return (
              <button key={id} type="button" onClick={() => {
                setSelectedPlotId(null);
                setPlotScopeId(null);
                const nextTab = id === 'overview' ? 'yards' : id;
                setActiveTab(nextTab);
                navigate(nextTab === 'yards' ? '/customer/dashboard' : `/customer/dashboard?view=${nextTab}`);
              }} className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${sidebarCollapsed ? 'justify-center px-0' : ''} ${isActive ? 'bg-white text-[#063d2b] shadow-md' : 'text-white hover:bg-white/10'}`} title={sidebarCollapsed ? label : undefined}>
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-emerald-700' : 'text-white/85'}`} />
                {!sidebarCollapsed && <span className="truncate">{label}</span>}
                {sidebarCollapsed && <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg bg-[#063d2b] px-3 py-2 text-xs font-bold text-white shadow-lg group-hover:block">{label}</span>}
              </button>
            );
          })}
        </div>
      </aside>
      {/* 1. Top Navbar giữ nguyên theo toàn bộ website */}
      <PublicNavbar dashboardRailCollapsed={sidebarCollapsed} hideBrand />

      {/* 2. Main Page Container luôn co giãn theo phần màn hình còn lại */}
      <div className={`box-border min-w-0 flex-1 w-full ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'} ${selectedPlotId ? 'px-3 pb-16 pt-20 sm:px-5 lg:px-8' : activeTab === 'yards' ? 'pt-20' : 'space-y-6 px-4 pb-16 pt-24 sm:px-8 sm:pt-28 lg:px-10'}`}>
        
        {/* 3. Layout with Left Sidebar + Right Content */}
        <div className={`flex min-w-0 flex-col items-start ${selectedPlotId ? '' : 'gap-6'}`}>
          
          {/* ================= RIGHT MAIN CONTENT ================= */}
          <main className={`min-w-0 w-full flex-1 ${selectedPlotId ? '' : 'space-y-6'}`}>
            
            {/* ============================================================== */}
            {/* VIEW A: CHI TIẾT DASHBOARD QUẢN LÝ 1 THỬA ĐẤT CỤ THỂ         */}
            {/* ============================================================== */}
            {selectedPlotId && currentSelectedPlot && (
              <CustomerPlotWorkspace
                plot={currentSelectedPlot}
                plots={customerPlots}
                operations={currentPlotOperations}
                iotData={iotDatasets[currentSelectedPlot.id] || iotDatasets['PLOT-CC-01']}
                alerts={iotAlerts[currentSelectedPlot.id] || iotAlerts['PLOT-CC-01'] || []}
                stages={cultivationProcesses[currentSelectedPlot.id] || cultivationProcesses[currentSelectedPlot.mapPlotId] || cultivationProcesses[`RENTAL-${currentSelectedPlot.rentalId}`] || []}
                services={customerServiceCatalog}
                serviceOrders={activeServiceOrders.filter((o) => {
                  if (!currentSelectedPlot) return false;
                  const pCode = (currentSelectedPlot.plotCode || currentSelectedPlot.mapPlotId || currentSelectedPlot.id || '').replace(/^PLOT-/i, '').trim().toUpperCase();
                  const oCode = (o.plotCode || o.plotId || '').replace(/^PLOT-/i, '').trim().toUpperCase();
                  if (o.plotId && o.plotId === currentSelectedPlot.id) return true;
                  if (oCode && pCode && oCode === pCode) return true;
                  if (o.rentalId && (o.rentalId === currentSelectedPlot.rentalId || o.rentalId === currentSelectedPlot.rental_id)) return true;
                  if (o.plotName && currentSelectedPlot.name) {
                    if (o.plotName === currentSelectedPlot.name) return true;
                    if (pCode && o.plotName.toUpperCase().includes(pCode)) return true;
                    if (oCode && currentSelectedPlot.name.toUpperCase().includes(oCode)) return true;
                  }
                  return false;
                })}
                harvestPlan={harvestPlans[currentSelectedPlot.id] || dbHarvestResults.find(h => h.plotScopeId === currentSelectedPlot.id || h.plotCode === currentSelectedPlot.plotCode || h.rentalId === currentSelectedPlot.rentalId) || null}
                activeTab={plotTabFromUrl}
                onTabChange={(tab) => navigate(`/customer/dashboard?plot=${currentSelectedPlot.id}${tab === 'overview' ? '' : `&tab=${tab}`}`, { replace: true })}
                onBack={() => navigate('/customer/dashboard')}
                onOpenHarvest={(plot) => setHarvestModalPlotId(plot.id)}
                onSelectPlot={(plotId) => navigate(`/customer/dashboard?plot=${plotId}${plotTabFromUrl !== 'overview' ? `&tab=${plotTabFromUrl}` : ''}`)}
                onOpenAiChat={() => { setChatOpenMode('ai'); setShowExpertChatModal(true); }}
                onOpenTask={(task) => { setTaskPhotoPreview(''); setSelectedTaskDetail({ ...task, plot: currentSelectedPlot }); }}
                onSelectService={(service) => { setCheckoutPlotId(currentSelectedPlot.id); handleOpenBuyServiceModal(service); }}
                onAddDiary={(plot) => { setDiaryPlotId(plot.id); setShowNewDiaryModal(true); }}
              />
            )}

            {/* Thanh ngữ cảnh: đang xem chức năng của riêng 1 thửa */}
            {!selectedPlotId && scopedPlot && ['diary', 'services'].includes(activeTab) && (
              <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <button type="button" onClick={backToScopedPlot} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
                    <ArrowLeft className="h-4 w-4" />Quay lại thửa
                  </button>
                  <img src={scopedPlot.image} alt="" className="hidden h-10 w-14 shrink-0 rounded-lg object-cover sm:block" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-brand-dark">
                      {scopedPlot.name}
                      <span className="font-normal text-brand-muted"> / {activeTab === 'diary' ? 'Nhật ký' : 'Dịch vụ'}</span>
                    </p>
                    <p className="truncate text-xs text-brand-muted">{scopedPlot.crop} · {scopedPlot.id}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setPlotScopeId(null)} className="shrink-0 rounded-xl border border-brand-border px-3 py-2 text-xs font-semibold text-brand-dark hover:bg-stone-50">
                  Xem tất cả thửa
                </button>
              </div>
            )}

            {false && !selectedPlotId && activeTab === 'yards' && (
              <div className="bg-[#f8f9f4] lg:min-h-[calc(100vh-5rem)]">
                <aside className="hidden">
                  <Link to="/" className="mb-10 flex items-center gap-2 px-2 text-2xl font-black tracking-wide">
                    <Sprout className="h-8 w-8 text-lime-400" /> FARMELY
                  </Link>
                  <p className="mb-4 px-2 text-xs font-bold uppercase tracking-widest text-white/60">Quản lý nông trại</p>
                  <div className="space-y-1.5">
                    {[
                      ['Tổng quan', LayoutDashboard, 'overview'],
                      ['Lịch canh tác', Calendar, 'tasks'],
                      ['Nhật ký nông trại', BookOpen, 'diary'],
                      ['Tin nhắn chuyên gia', MessageCircle, 'chat']
                    ].map(([label, Icon, id]) => (
                      <button key={id} type="button" onClick={() => {
                        if (id === 'overview') { setSelectedPlotId(null); setActiveTab('yards'); }
                        else if (id === 'yards' || id === 'tasks') { setSelectedPlotId(customerPlots[0]?.id || null); }
                        else if (id === 'chat') { setShowExpertChatModal(true); }
                        else { setActiveTab(id); }
                      }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-white/85 transition hover:bg-white/10">
                        <Icon className="h-5 w-5 text-white/80" /> <span>{label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/75">
                    <p className="font-bold text-white">Thửa đang chọn</p>
                    <button type="button" onClick={() => setSelectedPlotId('PLOT-MC-02')} className="mt-3 flex w-full items-center gap-2 text-left">
                      <img src={customerPlots[1]?.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      <span className="min-w-0 truncate">Thửa Mộc Châu B2<br /><span className="text-[10px] text-lime-300">Xà lách Romaine</span></span>
                      <ChevronRight className="ml-auto h-4 w-4" />
                    </button>
                  </div>
                </aside>
                <section className="min-w-0 flex-1">
                  <div className="space-y-3 p-4 sm:p-5 lg:p-6">
                    <div className="rounded-2xl bg-gradient-to-r from-white via-white to-[#eef5e8] px-5 py-5 sm:px-7">
                      <p className="text-sm font-semibold text-slate-500">Hôm nay là một ngày tốt để chăm sóc cây trồng!</p>
                      <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">☀️ Chào buổi sáng, {user?.name?.split(' ').pop() || 'Quyền'}</h1>
                    </div>
                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                        <div className="flex items-center justify-between"><div><h2 className="text-2xl font-black text-slate-900">📡 Cập nhật từ IoT</h2><p className="text-sm text-slate-500">Thửa Mộc Châu B2 · Cập nhật theo thời gian thực</p></div><Link to="#iot" className="text-sm font-bold text-emerald-700">Xem tất cả →</Link></div>
                        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="font-bold text-orange-700">🌧️ Sắp có mưa trong 45 phút</p><p className="text-sm text-slate-600">Đã tự động hoãn lịch tưới để tránh ngập úng.</p></div>
                        <div className="mt-3 divide-y divide-slate-100">{[['💧','Độ ẩm đất đang ở mức tốt','68% · Trong ngưỡng tối ưu 60–75%','5 phút trước'],['🌿','Cây sinh trưởng ổn định','Không phát hiện dấu hiệu bất thường','20 phút trước'],['☀️','Cường độ sáng đang tăng','28.500 lux · Phù hợp giai đoạn phát triển','1 giờ trước']].map(([icon,title,note,time]) => <div key={title} className="flex items-center gap-3 py-3"><span className="text-2xl">{icon}</span><div className="min-w-0 flex-1"><p className="font-bold text-slate-800">{title}</p><p className="truncate text-sm text-slate-500">{note}</p></div><span className="whitespace-nowrap text-xs text-slate-400">{time}</span></div>)}</div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="text-2xl font-black text-slate-900">✅ Việc cần làm</h2><div className="mt-2 divide-y divide-slate-100">{(plotOperations['PLOT-MC-02']?.tasks || []).map((task) => <button key={task.id} type="button" onClick={() => setSelectedPlotId('PLOT-MC-02')} className="flex w-full items-center gap-3 py-3 text-left"><span className="text-xl">{task.status === 'COMPLETED' ? '✅' : '🌱'}</span><span className="min-w-0 flex-1"><span className="block truncate font-bold text-slate-800">{task.title}</span><span className="block text-xs text-slate-500">Thửa Mộc Châu B2</span></span><span className="whitespace-nowrap rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-500">{task.time}</span></button>)}</div></div>
                    </div>
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex justify-between"><h2 className="text-xl font-black text-slate-900">🌱 Tiến độ mùa vụ</h2><strong className="text-emerald-700">{customerPlots[1]?.progressPercent || 68}%</strong></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-lime-400" style={{width:`${customerPlots[1]?.progressPercent || 68}%`}} /></div><div className="mt-3 flex justify-between text-xs text-slate-500"><span>Gieo trồng</span><span>Sinh trưởng</span><span>Phát triển</span><span>Thu hoạch</span></div></div><div className="rounded-2xl bg-lime-100 p-5"><p className="font-bold text-emerald-800">Còn khoảng</p><p className="mt-1 text-4xl font-black text-slate-900">11 ngày nữa</p><p className="font-semibold text-slate-700">đến kỳ thu hoạch</p><p className="mt-2 text-sm text-slate-500">Xà lách Romaine</p></div></div>
                    <div><h2 className="mb-3 text-2xl font-black text-slate-900">📊 Chỉ số nông trại hôm nay</h2><div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[['🌡️','Nhiệt độ','22.4°C'],['💧','Độ ẩm đất','68%'],['☀️','Ánh sáng','28.500 lux'],['🌿','Độ pH đất','6.2']].map(([icon,label,value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className="text-2xl">{icon}</span><p className="mt-2 text-xs text-slate-500">{label}</p><p className="text-xl font-black text-slate-900">{value}</p><p className="text-xs font-semibold text-emerald-600">✓ Ổn định</p></div>)}</div></div>
                  </div>
                </section>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW B: DANH SÁCH TẤT CẢ THỬA ĐẤT (COMPACT GRID)              */}
            {/* ============================================================== */}
            {activeTab === 'yards' && !selectedPlotId && (() => {
              const hour = new Date().getHours();
              const greeting = hour < 11 ? 'Chào buổi sáng' : hour < 14 ? 'Chào buổi trưa' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
              const firstName = (user?.fullName || user?.name || '').trim().split(/\s+/).pop() || 'bạn';

              // Kiểm tra thửa đất đã hủy / hết hạn
              const isPlotCancelled = (plot) => {
                if (!plot) return false;
                if (plot.contractCode && cancelledContracts[plot.contractCode]) return true;
                const rs = String(
                  plot.rental_status ||
                  plot.rentalStatus ||
                  plot.contract_status ||
                  plot.contractStatus ||
                  plot.displayStatus ||
                  plot.status ||
                  ''
                ).toUpperCase();
                return (
                  rs === 'CANCELLED' ||
                  rs === 'CANCELED' ||
                  rs.includes('HỦY') ||
                  rs === 'ĐÃ HỦY'
                );
              };

              // 1. Lọc sơ bộ các hợp đồng không bị hủy
              const rawActiveList = customerPlots.filter((p) => !isPlotCancelled(p));

              // 2. Nguyên tắc BR: Mỗi thửa đất chỉ có 1 vụ canh tác ACTIVE duy nhất
              // Nếu DB có nhiều hợp đồng ACTIVE cho cùng 1 thửa, chỉ giữ lại 1 hợp đồng (ưu tiên có gói chăm sóc / đủ dữ liệu)
              const activePlotMap = new Map();
              const supersededList = [];

              rawActiveList.forEach((plot) => {
                const code = String(plot.plotCode || plot.mapPlotId || plot.id).toUpperCase().replace(/^PLOT-/i, '');
                if (!activePlotMap.has(code)) {
                  activePlotMap.set(code, plot);
                } else {
                  const existing = activePlotMap.get(code);
                  if (plot.mode === 'Assisted-Growing' && existing.mode !== 'Assisted-Growing') {
                    supersededList.push(existing);
                    activePlotMap.set(code, plot);
                  } else {
                    supersededList.push(plot);
                  }
                }
              });

              const activeCustomerPlots = Array.from(activePlotMap.values());
              const cancelledCustomerPlots = [
                ...customerPlots.filter((p) => isPlotCancelled(p)),
                ...supersededList
              ];

              const displayedPlots =
                plotStatusFilter === 'ACTIVE'
                  ? activeCustomerPlots
                  : plotStatusFilter === 'CANCELLED'
                  ? cancelledCustomerPlots
                  : customerPlots;

              const openTasksAll = activeCustomerPlots.reduce(
                (n, p) => n + (plotOperations[p.id]?.tasks || defaultOperationsForPlot(p).tasks || []).filter((t) => t.status !== 'COMPLETED').length,
                0
              );
              const highAlertsAll = activeCustomerPlots.reduce(
                (n, p) => n + (iotAlerts[p.id] || defaultAlertsForPlot(p) || []).filter((a) => a.level === 'HIGH').length,
                0
              );
              const openPlot = (plotId, tab) => navigate(`/customer/dashboard?plot=${plotId}${tab ? `&tab=${tab}` : ''}`);

              return (
              <div className="mx-auto max-w-[1400px] space-y-6 px-4 pb-16 pt-5 sm:px-6 lg:px-10 lg:pt-8">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm text-stone-500">{greeting}, {firstName}</p>
                    <h1 className="mt-1 font-heading text-2xl font-bold text-[#18352b] sm:text-3xl">Vườn của tôi</h1>
                  </div>
                  <Link to="/marketplace" className="flex items-center justify-center gap-1.5 self-start rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 sm:self-auto">
                    Thuê thêm thửa đất<ArrowRight className="h-4 w-4" />
                  </Link>
                </header>

                <dl className="grid grid-cols-3 gap-3">
                  {[
                    ['Thửa đang canh tác', activeCustomerPlots.length, 'text-[#18352b]'],
                    ['Việc chưa xong', openTasksAll, 'text-amber-700'],
                    ['Cảnh báo cao', highAlertsAll, highAlertsAll ? 'text-rose-700' : 'text-[#18352b]']
                  ].map(([label, value, tone]) => (
                    <div key={label} className="rounded-2xl border border-stone-200/80 bg-white p-3 shadow-sm sm:p-4">
                      <dt className="text-xs text-stone-500">{label}</dt>
                      <dd className={`mt-1 text-2xl font-bold ${tone}`}>{value}</dd>
                    </div>
                  ))}
                </dl>

                {/* Mobile không có sidebar: lối vào Kế hoạch thu hoạch & nghiệm thu */}
                <nav aria-label="Kế hoạch thu hoạch & nghiệm thu" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar lg:hidden">
                  <button type="button" onClick={() => navigate('/customer/dashboard?view=harvest')} className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-2xs">
                    <Apple className="h-4 w-4 text-emerald-700" /> Kế hoạch thu hoạch & nghiệm thu
                  </button>
                </nav>

                <section aria-labelledby="my-plots-heading">
                  {/* TIÊU ĐỀ + DROPDOWN LỌC TRẠNG THÁI (KIỂU 2) */}
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 id="my-plots-heading" className="font-heading text-lg font-bold text-[#18352b]">
                        Thửa đất của bạn
                      </h2>

                      {/* Dropdown Menu Option 2 */}
                      <div className="relative inline-block text-left" ref={statusDropdownRef}>
                        <button
                          type="button"
                          id="plot-status-dropdown-button"
                          onClick={() => setShowStatusDropdown((prev) => !prev)}
                          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-bold text-stone-700 shadow-2xs transition hover:bg-stone-50 hover:border-stone-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                          aria-expanded={showStatusDropdown}
                          aria-haspopup="true"
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              plotStatusFilter === 'ACTIVE'
                                ? 'bg-emerald-500 ring-2 ring-emerald-200'
                                : plotStatusFilter === 'CANCELLED'
                                ? 'bg-rose-500 ring-2 ring-rose-200'
                                : 'bg-stone-400 ring-2 ring-stone-200'
                            }`}
                          />
                          <span>
                            {plotStatusFilter === 'ACTIVE'
                              ? `Đang canh tác (${activeCustomerPlots.length})`
                              : plotStatusFilter === 'CANCELLED'
                              ? `Đã hủy / Lịch sử (${cancelledCustomerPlots.length})`
                              : `Tất cả trạng thái (${customerPlots.length})`}
                          </span>
                          <ChevronDown
                            className={`h-3.5 w-3.5 text-stone-400 transition-transform duration-200 ${
                              showStatusDropdown ? 'rotate-180 text-emerald-600' : ''
                            }`}
                          />
                        </button>

                        {showStatusDropdown && (
                          <div className="absolute left-0 z-30 mt-1.5 w-60 rounded-2xl border border-stone-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150">
                            <button
                              type="button"
                              onClick={() => {
                                setPlotStatusFilter('ACTIVE');
                                setShowStatusDropdown(false);
                              }}
                              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                                plotStatusFilter === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                                  : 'text-stone-700 hover:bg-stone-50'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                🌱 Đang canh tác (Ưu tiên)
                              </span>
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                {activeCustomerPlots.length}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setPlotStatusFilter('CANCELLED');
                                setShowStatusDropdown(false);
                              }}
                              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                                plotStatusFilter === 'CANCELLED'
                                  ? 'bg-rose-50 text-rose-800 font-bold'
                                  : 'text-stone-700 hover:bg-stone-50'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-rose-500" />
                                🛑 Đã hủy / Hết hạn
                              </span>
                              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                                {cancelledCustomerPlots.length}
                              </span>
                            </button>

                            <div className="my-1 border-t border-stone-100" />

                            <button
                              type="button"
                              onClick={() => {
                                setPlotStatusFilter('ALL');
                                setShowStatusDropdown(false);
                              }}
                              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                                plotStatusFilter === 'ALL'
                                  ? 'bg-stone-100 text-stone-900 font-bold'
                                  : 'text-stone-700 hover:bg-stone-50'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-stone-400" />
                                📑 Tất cả hợp đồng
                              </span>
                              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-600">
                                {customerPlots.length}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tag tóm tắt nhỏ phía bên phải */}
                    <span className="text-xs text-stone-400">
                      Hiển thị {displayedPlots.length} / {customerPlots.length} hợp đồng
                    </span>
                  </div>

                  {isLoadingPlots ? (
                    <div className="flex h-48 items-center justify-center rounded-2xl border border-stone-200 bg-white shadow-sm">
                      <div className="flex items-center gap-2 text-sm font-semibold text-stone-500">
                        <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
                        Đang đồng bộ danh sách thửa đất từ cơ sở dữ liệu...
                      </div>
                    </div>
                  ) : displayedPlots.length === 0 ? (
                    plotStatusFilter === 'CANCELLED' ? (
                      <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-8 sm:p-12 text-center shadow-sm">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                          <Sprout className="h-8 w-8" />
                        </div>
                        <h3 className="mt-4 font-heading text-xl font-bold text-[#18352b]">
                          Không có thửa đất nào đã hủy
                        </h3>
                        <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
                          Bạn chưa có hợp đồng thuê nào ở trạng thái đã hủy hoặc hết hạn.
                        </p>
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => setPlotStatusFilter('ACTIVE')}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition cursor-pointer"
                          >
                            Quay lại Thửa đang canh tác
                          </button>
                        </div>
                      </div>
                    ) : (
                      <CustomerWelcomeLounge
                        user={user}
                        onRefreshPlots={fetchCustomerPlots}
                      />
                    )
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {displayedPlots.map((plot) => {
                        const isCancelled = isPlotCancelled(plot);
                        const tasks = plotOperations[plot.id]?.tasks || defaultOperationsForPlot(plot).tasks || [];
                        const nextTask = tasks.find((t) => t.status === 'IN_PROGRESS') || tasks.find((t) => t.status === 'PENDING');
                        const openCount = tasks.filter((t) => t.status !== 'COMPLETED').length;
                        const topAlert = (iotAlerts[plot.id] || defaultAlertsForPlot(plot) || []).find((a) => a.level === 'HIGH');
                        const daysLeft = Math.max(plot.totalDays - plot.currentDay, 0);

                        return (
                          <article
                            key={`${plot.id}-${plot.rentalId || plot.contractCode || ''}`}
                            className={`group flex flex-col overflow-hidden rounded-2xl border transition hover:-translate-y-0.5 hover:shadow-lg ${
                              isCancelled
                                ? 'border-rose-200/90 bg-stone-50/50 shadow-2xs'
                                : 'border-stone-200/80 bg-white shadow-sm'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => (isCancelled ? handleOpenCancelModal(plot) : openPlot(plot.id))}
                              className="relative block h-40 w-full overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-400 cursor-pointer"
                              aria-label={`Mở ${plot.name}`}
                            >
                              <img
                                src={plot.image}
                                alt=""
                                className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
                                  isCancelled ? 'grayscale-[35%] opacity-80' : ''
                                }`}
                              />
                              <span className="absolute inset-0 bg-gradient-to-t from-[#0f2a20]/90 via-[#0f2a20]/30 to-transparent" />
                              
                              {/* Tag trạng thái góc trên bên trái */}
                              {isCancelled ? (
                                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
                                  🛑 Đã hủy
                                </span>
                              ) : (
                                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-[#18352b]">
                                  {plot.mode === 'Self-Growing' ? 'Tự canh tác' : 'Farmely chăm sóc'}
                                </span>
                              )}

                              {!isCancelled && topAlert && (
                                <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                                  <Flame className="h-3 w-3" />Cảnh báo
                                </span>
                              )}

                              <span className="absolute inset-x-3 bottom-3 text-white">
                                <span className="block font-heading text-lg font-bold leading-tight">{plot.name}</span>
                                <span className="mt-0.5 flex items-center gap-1 text-xs text-white/80">
                                  <MapPin className="h-3.5 w-3.5" />{plot.location} · {plot.area}
                                </span>
                              </span>
                            </button>

                            <div className="flex flex-1 flex-col gap-3 p-4">
                              {/* Thông tin mùa vụ */}
                              <div>
                                <div className="flex items-center justify-between gap-2 text-sm">
                                  <span className="flex min-w-0 items-center gap-1.5 font-semibold text-[#18352b]">
                                    <Sprout className={`h-4 w-4 shrink-0 ${isCancelled ? 'text-stone-400' : 'text-emerald-600'}`} />
                                    <span className="truncate">{plot.crop}</span>
                                  </span>
                                  <span className="shrink-0 text-xs text-stone-500">
                                    {isCancelled ? 'Hợp đồng kết thúc' : daysLeft > 0 ? `Còn ${daysLeft} ngày` : 'Đến vụ'}
                                  </span>
                                </div>
                                {!isCancelled && (
                                  <>
                                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
                                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${plot.progressPercent}%` }} />
                                    </div>
                                    <p className="mt-1 text-xs text-stone-500">{plot.stage}</p>
                                  </>
                                )}
                              </div>

                              {/* Hiển thị chi tiết: Thửa đang chạy vs Thửa đã hủy */}
                              {isCancelled ? (
                                <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-3 text-xs text-rose-900 space-y-1.5">
                                  <div className="flex items-center justify-between font-bold">
                                    <span className="text-[11px] text-stone-700">Mã HĐ: {plot.contractCode || 'HD-CANCELLED'}</span>
                                    <span className="rounded-full bg-rose-100 border border-rose-200 px-2 py-0.5 text-[10px] font-extrabold text-rose-700">
                                      NGỪNG CANH TÁC
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-stone-600">
                                    Thời gian thuê: {plot.startDate || plot.start_date || '---'} đến {plot.expectedHarvestDate || plot.endDate || plot.end_date || '---'}
                                  </p>
                                </div>
                              ) : (
                                <>
                                  <div className="grid grid-cols-3 gap-2 text-center">
                                    {[['Nhiệt độ', plot.temp], ['Ẩm đất', plot.soilMoisture], ['Ánh sáng', plot.light]].map(([label, value]) => (
                                      <div key={label} className="rounded-xl bg-stone-50 px-2 py-2">
                                        <p className="text-[11px] text-stone-500">{label}</p>
                                        <p className="truncate text-sm font-semibold text-[#18352b]">{value}</p>
                                      </div>
                                    ))}
                                  </div>

                                  {topAlert ? (
                                    <button type="button" onClick={() => openPlot(plot.id, 'iot')} className="flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-left text-xs text-rose-800 hover:bg-rose-100">
                                      <Flame className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span className="min-w-0"><span className="block font-semibold">{topAlert.title}</span><span className="opacity-80">{topAlert.time}</span></span>
                                    </button>
                                  ) : nextTask ? (
                                    <button type="button" onClick={() => openPlot(plot.id)} className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-left text-xs text-amber-900 hover:bg-amber-100">
                                      <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span className="min-w-0"><span className="block truncate font-semibold">{nextTask.title}</span><span className="opacity-80">{nextTask.time}</span></span>
                                    </button>
                                  ) : null}
                                </>
                              )}

                              {/* Hàng nút bấm hành động */}
                              <div className="mt-auto flex items-center gap-2 pt-1">
                                {isCancelled ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenCancelModal(plot)}
                                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-800 transition hover:bg-rose-100 cursor-pointer"
                                  >
                                    <FileText className="h-4 w-4" />
                                    Xem chi tiết hợp đồng đã hủy
                                  </button>
                                ) : (
                                  <>
                                    <button type="button" onClick={() => openPlot(plot.id)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#18352b] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f2a20]">
                                      Mở thửa<ChevronRight className="h-4 w-4" />
                                    </button>
                                    {[['iot', Radio, 'IoT'], ['diary', BookOpen, 'Nhật ký']].map(([tab, Icon, label]) => (
                                      <button key={tab} type="button" onClick={() => openPlot(plot.id, tab)} aria-label={`${label} của ${plot.name}`} title={label} className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 text-stone-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800">
                                        <Icon className="h-4 w-4" />
                                      </button>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenCancelModal(plot)}
                                      aria-label={`Hợp đồng & hủy ${plot.name}`}
                                      title="Quản lý hợp đồng & hủy hợp đồng"
                                      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 text-stone-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                                    >
                                      <FileText className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
              );
            })()}



            {/* ============================================================== */}
            {/* VIEW C: DỊCH VỤ CANH TÁC & THANH TOÁN                         */}
            {/* ============================================================== */}
            {activeTab === 'services' && !selectedPlotId && (
              <div className="space-y-6">
                
                {/* Header Banner for Farming Services */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-brand-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 mb-2">
                      <ShoppingBag className="w-3.5 h-3.5 text-amber-700" />
                      <span>Hỗ Trợ & Chăm Sóc Nông Trại</span>
                    </div>
                    <h2 className="font-heading font-black text-2xl text-brand-dark">
                      Dịch Vụ Canh Tác
                    </h2>
                    <p className="text-xs sm:text-sm text-brand-muted mt-1 max-w-2xl">
                      Ủy thác chăm sóc trọn vụ khi bạn bận rộn, hoặc đặt các dịch vụ lẻ linh hoạt theo ngày/tuần. Hỗ trợ thanh toán nhanh chóng ngay tại đây.
                    </p>
                  </div>

                  {/* Filter Pills & Custom Request Button */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCustomServiceData(prev => ({ ...prev, plotId: customerPlots[0]?.id || '' }));
                        setShowCustomServiceModal(true);
                      }}
                      className="font-bold text-xs gap-1 border-emerald-600 text-emerald-800 hover:bg-emerald-50 whitespace-nowrap cursor-pointer"
                    >
                      + Yêu cầu dịch vụ riêng (UC10)
                    </Button>
                    <button
                      onClick={() => setServiceCategoryFilter('ALL')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        serviceCategoryFilter === 'ALL'
                          ? 'bg-brand-green text-white shadow-sm'
                          : 'bg-brand-cream/80 text-stone-700 hover:bg-stone-100 border border-brand-border'
                      }`}
                    >
                      Tất cả ({customerServiceCatalog.length})
                    </button>
                    <button
                      onClick={() => setServiceCategoryFilter('FULL')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        serviceCategoryFilter === 'FULL'
                          ? 'bg-brand-green text-white shadow-sm'
                          : 'bg-brand-cream/80 text-stone-700 hover:bg-stone-100 border border-brand-border'
                      }`}
                    >
                      Trọn vụ
                    </button>
                    <button
                      onClick={() => setServiceCategoryFilter('CYCLE')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        serviceCategoryFilter === 'CYCLE'
                          ? 'bg-brand-green text-white shadow-sm'
                          : 'bg-brand-cream/80 text-stone-700 hover:bg-stone-100 border border-brand-border'
                      }`}
                    >
                      Ngày & Tuần
                    </button>
                    <button
                      onClick={() => setServiceCategoryFilter('SINGLE')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        serviceCategoryFilter === 'SINGLE'
                          ? 'bg-brand-green text-white shadow-sm'
                          : 'bg-brand-cream/80 text-stone-700 hover:bg-stone-100 border border-brand-border'
                      }`}
                    >
                      Dịch vụ lẻ
                    </button>
                  </div>
                </div>

                {/* Service Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredServices.map((svc) => {
                    const Icon = svc.icon;
                    return (
                      <div
                        key={svc.id}
                        className="bg-white rounded-2xl p-5 border border-brand-border shadow-sm flex flex-col justify-between hover:shadow-md transition-all space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="w-10 h-10 rounded-xl bg-brand-cream text-brand-green flex items-center justify-center shrink-0 border border-brand-border/60">
                              <Icon className="w-5 h-5 stroke-[2.2]" />
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              {svc.tag}
                            </span>
                          </div>

                          <div>
                            <h3 className="font-heading font-black text-base text-brand-dark leading-snug">
                              {svc.name}
                            </h3>
                            <div className="flex items-baseline gap-1 mt-1.5">
                              <span className="font-heading font-black text-xl text-brand-green">
                                {svc.formattedPrice}
                              </span>
                              <span className="text-xs text-brand-muted">{svc.unit}</span>
                            </div>
                          </div>

                          <p className="text-xs text-stone-600 leading-relaxed">
                            {svc.description}
                          </p>

                          <div className="pt-2 border-t border-brand-border/60 space-y-1.5">
                            {svc.features.map((feat, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-[11px] text-stone-600">
                                <Check className="w-3.5 h-3.5 text-brand-green shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-brand-border/60">
                          <button
                            type="button"
                            onClick={() => handleOpenBuyServiceModal(svc)}
                            className="w-full py-2.5 px-4 rounded-xl bg-brand-yellow hover:bg-[#ffc83b] text-brand-dark font-heading font-black text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>MUA DỊCH VỤ NGAY</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Purchased Services Order Management */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-brand-border shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
                    <div>
                      <h3 className="font-heading font-black text-lg text-brand-dark">
                        Lịch Sử Dịch Vụ Đã Đăng Ký ({scopedServiceOrders.length})
                      </h3>
                      <p className="text-xs text-brand-muted mt-0.5">
                        Theo dõi tiến độ thực hiện của công nhân nông trại cho từng đơn dịch vụ.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-brand-green bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      Đang xử lý
                    </span>
                  </div>

                  <div className="space-y-3">
                    {scopedServiceOrders.length === 0 && (
                      <p className="rounded-xl bg-brand-cream/50 p-4 text-center text-xs text-brand-muted">
                        {scopedPlot ? `Chưa có dịch vụ nào cho ${scopedPlot.name}.` : 'Bạn chưa đăng ký dịch vụ nào.'}
                      </p>
                    )}
                    {scopedServiceOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-4 rounded-2xl bg-brand-cream/60 border border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-brand-green text-sm">{ord.id}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ord.status === 'COMPLETED' || ord.status === 'DONE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : (ord.status === 'ASSIGNED' || ord.statusLabel?.includes('phân công') || ord.statusLabel?.includes('thực hiện'))
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-amber-100 text-amber-800'
                            }`}>
                              {ord.statusLabel}
                            </span>
                          </div>
                          <h4 className="font-bold text-brand-dark text-sm">{ord.serviceName}</h4>
                          <p className="text-stone-600">
                            Áp dụng: <strong className="text-brand-dark">{ord.plotName}</strong> • {ord.date}
                          </p>
                        </div>

                        <div className="flex sm:flex-col sm:items-end justify-between items-center gap-1 shrink-0">
                          <span className="font-heading font-black text-brand-green text-base">{ord.price}</span>
                          <span className="text-[11px] text-stone-500">Phụ trách: {ord.worker}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW D: DỮ LIỆU VI KHÍ HẬU IOT (CHỈ THÔNG TIN, KHÔNG CẢNH BÁO) */}
            {/* ============================================================== */}
            {activeTab === 'iot' && !selectedPlotId && (
              customerPlots.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-8 sm:p-12 text-center shadow-sm">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <Radio className="h-8 w-8" />
                  </div>
                  <h3 className="mt-4 font-heading text-xl font-bold text-[#18352b]">
                    Chưa có trạm đo IoT
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
                    Bạn chưa có thửa đất canh tác nào được kết nối cảm biến IoT. Hãy thuê thửa đất tại Marketplace để theo dõi chỉ số nhiệt độ, độ ẩm đất vi khí hậu theo thời gian thực.
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/marketplace"
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-700/20 transition hover:bg-emerald-800"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Khám phá Marketplace
                    </Link>
                  </div>
                </div>
              ) : (
              <div className="space-y-6">
                
                {/* Top Control Bar: Select Plot + Timeframe Switcher */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-brand-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <button type="button" onClick={() => { if (iotReturnPlotId) { navigate(`/customer/dashboard?plot=${iotReturnPlotId}`); } else { navigate('/customer/dashboard'); } }} className="mb-3 flex items-center gap-1.5 text-xs font-black text-brand-green hover:underline"><ArrowLeft className="h-4 w-4" />Quay lại {iotReturnPlotId ? 'chi tiết thửa' : 'tổng quan'}</button>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-brand-cream text-brand-green border border-brand-border mb-2">
                      <Radio className="w-3.5 h-3.5 text-brand-green" />
                      <span>Trạm Quan Trắc IoT Không Dây</span>
                      {isIotConnected ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full ml-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                          Trực tiếp (SSE) {currentIotPlot.lastUpdated ? `· ${currentIotPlot.lastUpdated}` : ''}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-stone-600 bg-stone-200/60 px-2 py-0.5 rounded-full ml-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
                          Đồng bộ tự động {currentIotPlot.lastUpdated ? `· ${currentIotPlot.lastUpdated}` : ''}
                        </span>
                      )}
                    </div>
                    <h2 className="font-heading font-black text-2xl text-brand-dark">
                      Dữ Liệu Vi Khí Hậu IoT
                    </h2>
                    <p className="text-xs text-brand-muted mt-1">
                      Thông tin thổ nhưỡng, độ ẩm đất và nhiệt độ môi trường theo thời gian thực từ trạm cảm biến.
                    </p>
                  </div>

                  {/* Controls: Select Plot & Timeframe */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Plot Selector */}
                    <select
                      value={selectedIotPlotId}
                      onChange={(e) => setSelectedIotPlotId(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-brand-border bg-white text-xs font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                    >
                      {customerPlots.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.stationId})
                        </option>
                      ))}
                    </select>

                    {/* Timeframe Toggle: Hourly, Daily, Weekly */}
                    <div className="inline-flex rounded-xl p-1 bg-brand-cream border border-brand-border text-xs font-bold">
                      <button
                        onClick={() => setIotTimeframe('hourly')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          iotTimeframe === 'hourly'
                            ? 'bg-brand-green text-white shadow-sm'
                            : 'text-stone-600 hover:text-brand-dark'
                        }`}
                      >
                        Theo Giờ (24h)
                      </button>
                      <button
                        onClick={() => setIotTimeframe('daily')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          iotTimeframe === 'daily'
                            ? 'bg-brand-green text-white shadow-sm'
                            : 'text-stone-600 hover:text-brand-dark'
                        }`}
                      >
                        Theo Ngày (7 ngày)
                      </button>
                      <button
                        onClick={() => setIotTimeframe('weekly')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          iotTimeframe === 'weekly'
                            ? 'bg-brand-green text-white shadow-sm'
                            : 'text-stone-600 hover:text-brand-dark'
                        }`}
                      >
                        Theo Tuần (4 tuần)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Real-time Telemetry Metric Gauges */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="p-4 rounded-2xl bg-white border border-brand-border shadow-sm text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-brand-muted">
                      <Thermometer className="w-4 h-4 text-rose-500" />
                      <span>Nhiệt độ khí</span>
                    </div>
                    <div className="text-2xl font-black font-heading text-brand-dark">
                      {currentIotPlot.temp}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold block">Bình thường (20-32°C)</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-brand-border shadow-sm text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-brand-muted">
                      <Droplets className="w-4 h-4 text-emerald-600" />
                      <span>Độ ẩm đất</span>
                    </div>
                    <div className="text-2xl font-black font-heading text-emerald-600">
                      {currentIotPlot.soilMoisture}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold block">Tối ưu (60-75%)</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-brand-border shadow-sm text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-brand-muted">
                      <Activity className="w-4 h-4 text-sky-500" />
                      <span>Độ ẩm không khí</span>
                    </div>
                    <div className="text-2xl font-black font-heading text-brand-dark">
                      {currentIotPlot.airHumidity}
                    </div>
                    <span className="text-[10px] text-stone-500 font-bold block">Ổn định</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-brand-border shadow-sm text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-brand-muted">
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span>Cường độ sáng</span>
                    </div>
                    <div className="text-2xl font-black font-heading text-brand-dark">
                      {currentIotPlot.light}
                    </div>
                    <span className="text-[10px] text-amber-600 font-bold block">Đạt chuẩn quang hợp</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-brand-border shadow-sm text-center space-y-1 col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-brand-muted">
                      <Layers className="w-4 h-4 text-purple-500" />
                      <span>Độ pH đất</span>
                    </div>
                    <div className="text-2xl font-black font-heading text-brand-dark">
                      {currentIotPlot.ph}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold block">Thích hợp trồng rau sạch</span>
                  </div>
                </div>

                <section className="rounded-3xl border border-brand-border bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-orange-600">Theo dõi bất thường</p><h3 className="mt-1 font-heading text-xl font-black text-brand-dark">Cảnh báo IoT · {currentIotPlot.name}</h3></div><span className="rounded-full bg-orange-50 px-3 py-1 text-[10px] font-black text-orange-700">{(iotAlerts[currentIotPlot.id] || []).length} cảnh báo</span></div>
                  <div className="mt-4 space-y-2">{(iotAlerts[currentIotPlot.id] || []).map((alert) => <div key={`${currentIotPlot.id}-${alert.title}`} className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-border bg-brand-cream/35 p-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${alert.level === 'HIGH' ? 'bg-rose-100 text-rose-700' : alert.level === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600'}`}>{alert.level === 'HIGH' ? 'Cao' : alert.level === 'MEDIUM' ? 'Trung bình' : 'Thấp'}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-brand-dark">{alert.title}</p><p className="mt-0.5 text-xs text-brand-muted">{alert.metric} · {alert.time}</p></div></div>)}</div>
                  {currentIotPlot.mode === 'Self-Growing' && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4"><div><p className="text-sm font-black text-rose-900">Cần Farmely hỗ trợ ngay?</p><p className="mt-1 text-xs text-rose-800/80">Gửi yêu cầu chăm sóc khẩn cấp cho thửa tự trồng này.</p></div><button type="button" onClick={() => handleEmergencyCareRequest(currentIotPlot)} disabled={emergencyRequests[currentIotPlot.id]?.status === 'PROCESSING'} className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-rose-300">{emergencyRequests[currentIotPlot.id]?.status === 'PROCESSING' ? 'Đã gửi · Đang xử lý' : 'Yêu cầu chăm sóc khẩn cấp'}</button></div>}
                  {emergencyRequests[currentIotPlot.id] && <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800">Service Request {emergencyRequests[currentIotPlot.id].id} · Đang tiếp nhận và điều phối nhân sự Farmely.</div>}
                </section>

                {/* Interactive Chart Container */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-brand-border shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-border/60 pb-3">
                    <div>
                      <h3 className="font-heading font-black text-lg text-brand-dark">
                        Biểu Đồ Quan Trắc IoT • {currentIotPlot.name}
                      </h3>
                      <p className="text-xs text-brand-muted mt-0.5">
                        Hiển thị theo: <strong>{iotTimeframe === 'hourly' ? 'Từng giờ trong ngày' : iotTimeframe === 'daily' ? 'Các ngày trong tuần' : 'Từng tuần trong tháng'}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-medium">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                        <span>Độ ẩm đất (%)</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
                        <span>Nhiệt độ (°C)</span>
                      </span>
                    </div>
                  </div>

                  <div className="h-72 w-full bg-stone-50/60 p-4 rounded-2xl border border-stone-200">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={currentIotData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="iotColorMoisture" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                          </linearGradient>
                          <linearGradient id="iotColorTemp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis dataKey="time" stroke="#9ca3af" fontSize={11} tickLine={false} />
                        <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', borderColor: '#e5e7eb', fontSize: '12px' }}
                        />
                        <Area type="monotone" dataKey="moisture" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#iotColorMoisture)" name="Độ ẩm đất (%)" />
                        <Area type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#iotColorTemp)" name="Nhiệt độ (°C)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Summary Footer of IoT Sensor Station */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 border-t border-brand-border/60">
                    <span>Mã trạm: <strong className="text-brand-dark">{currentIotPlot.stationId}</strong> • Vị trí: {currentIotPlot.location}</span>
                    <span className="text-emerald-700 font-semibold">✓ Tần suất cập nhật: 3 giờ/lần theo thời gian thực</span>
                  </div>
                </div>

              </div>
              )
            )}

            {/* TAB 4: QUY TRÌNH CANH TÁC CHUẨN */}
            {activeTab === 'process' && !selectedPlotId && (
              <div className="space-y-5 rounded-3xl border border-brand-border bg-white p-5 shadow-sm sm:p-7">
                <div><p className="text-xs font-bold uppercase tracking-widest text-brand-green">Quy trình VietGAP</p><h2 className="mt-1 font-heading text-2xl font-black text-brand-dark">Quy trình canh tác chuẩn</h2><p className="mt-1 text-sm text-brand-muted">Hướng dẫn và tiến độ được Farmely thiết lập cho từng thửa. Khách hàng chỉ có quyền xem.</p></div>
                {customerPlots.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/50 p-8 text-center">
                    <ClipboardList className="mx-auto h-10 w-10 text-stone-400" />
                    <p className="mt-2 font-bold text-stone-700">Chưa có quy trình canh tác</p>
                    <p className="mt-1 text-xs text-stone-500">Bạn chưa có thửa đất nào đang canh tác để theo dõi quy trình VietGAP.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customerPlots.map((plot) => (
                      <section key={plot.id} className="overflow-hidden rounded-2xl border border-brand-border bg-brand-cream/25">
                        <div className="flex items-center gap-3 border-b border-brand-border bg-white p-4">
                          <img src={plot.image} alt="" className="h-12 w-16 rounded-xl object-cover" />
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-heading font-black text-brand-dark">{plot.name}</h3>
                            <p className="truncate text-xs text-brand-muted">{plot.crop} · {plot.mode === 'Self-Growing' ? 'Tự trồng' : 'Farmely chăm sóc'}</p>
                          </div>
                          <span className="rounded-full bg-stone-100 px-3 py-1 text-[10px] font-bold text-stone-600">Chỉ xem</span>
                        </div>
                        <div className="grid gap-3 p-4 lg:grid-cols-2">
                          {(cultivationProcesses[plot.id] || defaultProcessForPlot(plot)).map((step, index) => (
                            <article key={`${plot.id}-${step.stage}`} className="relative rounded-xl border border-brand-border bg-white p-4">
                              <div className="flex items-start gap-3">
                                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${step.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : step.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500'}`}>{step.status === 'COMPLETED' ? '✓' : index + 1}</span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h4 className="font-bold text-brand-dark">{step.stage}</h4>
                                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${step.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : step.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700' : 'bg-stone-100 text-stone-600'}`}>{step.status === 'COMPLETED' ? 'Đã hoàn tất' : step.status === 'IN_PROGRESS' ? 'Đang thực hiện' : 'Sắp tới'}</span>
                                  </div>
                                  <p className="mt-1 text-xs font-semibold text-brand-green">Ngày thực hiện: {step.date}</p>
                                  <p className="mt-2 text-xs leading-relaxed text-stone-600">{step.guide}</p>
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: NHẬT KÝ CANH TÁC */}
            {activeTab === 'diary' && !selectedPlotId && (
              scopedPlots.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-8 sm:p-12 text-center shadow-sm">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <h3 className="mt-4 font-heading text-xl font-bold text-[#18352b]">
                    Chưa có nhật ký nông trại
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
                    Bạn chưa có thửa đất canh tác nào. Hãy thuê thửa đất để bắt đầu cập nhật nhật ký và xem tiến độ chăm sóc từ chuyên viên nông nghiệp.
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/marketplace"
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-700/20 transition hover:bg-emerald-800"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Khám phá Marketplace
                    </Link>
                  </div>
                </div>
              ) : (
              <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
                <div className="space-y-3">
                  {scopedPlots.map((plot) => (
                    <section key={plot.id} className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${diaryFocusPlotId === plot.id ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-brand-border'}`}>
                      <div role="button" tabIndex={0} onClick={() => setDiaryFocusPlotId(plot.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setDiaryFocusPlotId(plot.id); }} className="flex w-full flex-wrap items-center gap-3 border-b border-brand-border p-3 text-left hover:bg-emerald-50/40">
                        <img src={plot.image} alt="" className="h-11 w-14 rounded-xl object-cover" />
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate font-heading font-black text-brand-dark">{plot.name}</h4>
                          <p className="truncate text-xs text-brand-muted">{plot.crop} · {plot.id}</p>
                        </div>
                        {plot.mode === 'Self-Growing' ? (
                          <span onClick={(event) => event.stopPropagation()}><Button variant="primary" size="sm" onClick={() => { setDiaryPlotId(plot.id); setShowNewDiaryModal(true); }}>+ Thêm nhật ký</Button></span>
                        ) : (
                          <span className="rounded-full bg-stone-100 px-3 py-1 text-[10px] font-bold text-stone-600">Chỉ xem · Farmely cập nhật</span>
                        )}
                      </div>
                      <div className="grid gap-2 p-3 md:grid-cols-2">
                        {((plotOperations[plot.id]?.diary) || defaultOperationsForPlot(plot).diary || []).map((entry, index) => (
                          <article key={`${plot.id}-${index}`} className="rounded-xl bg-brand-cream/45 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="font-bold text-brand-dark">{entry.time}</span>
                              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800">{entry.author}</span>
                            </div>
                            <h5 className="mt-2 text-xs font-black text-brand-dark">{entry.title}</h5>
                            <p className="mt-1 text-xs leading-relaxed text-stone-600">{entry.note}</p>
                          </article>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>

                {diaryFocusPlot && (
                  <aside className="sticky top-24 rounded-3xl border border-brand-border bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <img src={diaryFocusPlot.image} alt="" className="h-14 w-20 rounded-xl object-cover" />
                      <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">IoT theo thửa</p><h3 className="truncate font-heading text-lg font-black text-brand-dark">{diaryFocusPlot.name}</h3><p className="truncate text-xs text-brand-muted">{diaryFocusPlot.stationId || 'IOT'}</p></div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {[
                        ['Nhiệt độ', diaryFocusPlot.temp, Thermometer, 'text-orange-600 bg-orange-50'],
                        ['Ẩm đất', diaryFocusPlot.soilMoisture, Droplets, 'text-sky-600 bg-sky-50'],
                        ['Ẩm không khí', diaryFocusPlot.airHumidity, Activity, 'text-cyan-600 bg-cyan-50'],
                        ['Ánh sáng', diaryFocusPlot.light, Sun, 'text-amber-600 bg-amber-50']
                      ].map(([label, value, Icon, tone]) => <div key={label} className="rounded-xl border border-brand-border p-3"><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}><Icon className="h-4 w-4" /></span><p className="mt-2 text-[10px] text-brand-muted">{label}</p><p className="text-sm font-black text-brand-dark">{value}</p></div>)}
                    </div>
                    <div className="mt-3 rounded-xl bg-amber-50 p-3"><p className="text-xs font-black text-amber-900">Cảnh báo thời tiết đang được theo dõi</p><p className="mt-1 text-[11px] text-amber-800">Dữ liệu mới nhất được đồng bộ từ trạm của {diaryFocusPlot.name}.</p></div>
                    <button type="button" onClick={() => { setSelectedIotPlotId(diaryFocusPlot.id); setIotReturnPlotId(scopedPlot ? scopedPlot.id : null); setPlotScopeId(null); setActiveTab('iot'); }} className="mt-4 w-full rounded-xl bg-brand-green px-4 py-3 text-xs font-black text-white transition hover:bg-brand-dark">Xem dashboard IoT chi tiết</button>
                  </aside>
                )}
              </div>
              )
            )}

            {/* TAB 5: THU HOẠCH & NGHIỆM THU */}
            {activeTab === 'harvest' && !selectedPlotId && (() => {
              const displayedHarvests = scopedPlot
                ? dbHarvestResults.filter(
                    (h) =>
                      h.plotScopeId === scopedPlot.id ||
                      h.plotCode === scopedPlot.plotCode ||
                      h.rentalId === scopedPlot.rentalId
                  )
                : dbHarvestResults;

              const harvestTargetPlots = scopedPlot ? [scopedPlot] : customerPlots;

              return (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-8">
                {/* Tiêu đề chính */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/60 pb-5">
                  <div>
                    <h3 className="font-heading font-black text-xl text-brand-dark flex items-center gap-2">
                      <Apple className="w-6 h-6 text-emerald-700" />
                      <span>Kế Hoạch Thu Hoạch & Nghiệm Thu Nông Sản</span>
                    </h3>
                    <p className="text-xs text-brand-muted mt-1">
                      Đăng ký lịch hái theo dõi phê duyệt từ Kỹ sư nông nghiệp và nghiệm thu khối lượng thực tế đối chứng cân điện tử.
                    </p>
                  </div>
                  {customerPlots.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDisputeData(prev => ({ ...prev, plotId: customerPlots[0]?.id || '' }));
                          setShowDisputeModal(true);
                        }}
                        className="text-rose-700 border-rose-300 hover:bg-rose-50 font-bold text-xs cursor-pointer"
                      >
                        Khiếu nại sản lượng / sự cố
                      </Button>
                    </div>
                  )}
                </div>

                {/* PHẦN 1: KẾ HOẠCH THU HOẠCH THEO TỪNG THỬA ĐẤT */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-heading font-black text-base text-brand-dark flex items-center gap-2">
                        <CalendarCheck className="w-4 h-4 text-emerald-700" />
                        <span>1. Kế Hoạch Thu Hoạch Của Bạn</span>
                      </h4>
                      <p className="text-xs text-stone-500">
                        Chọn ngày thu hái và phương thức nhận hàng (Farmely giao tận nhà hoặc tự đến nông trại).
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      {harvestTargetPlots.length} Thửa Đất Canh Tác
                    </span>
                  </div>

                  {harvestTargetPlots.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/50 p-6 text-center text-xs text-stone-500">
                      Bạn chưa có thửa đất canh tác nào.
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {harvestTargetPlots.map((plot) => {
                        const plan = harvestPlans[plot.id] || harvestPlans[plot.plotCode] || null;
                        const isApproved = plan?.status === 'APPROVED';

                        return (
                          <div
                            key={plot.id}
                            className="p-5 rounded-2xl border border-brand-border bg-stone-50/60 hover:bg-white hover:border-emerald-300 hover:shadow-2xs transition-all flex flex-col justify-between space-y-4 text-xs"
                          >
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/60 pb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-emerald-800 text-sm">{plot.plotCode || plot.id}</span>
                                  <span className="font-bold text-brand-dark text-sm">{plot.name}</span>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    {plot.crop}
                                  </span>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isApproved
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : plan
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : 'bg-stone-200 text-stone-600 border-stone-300'
                                }`}>
                                  {isApproved
                                    ? '✓ Đã duyệt lịch · Sẵn sàng hái'
                                    : plan
                                    ? '⏳ Chờ kỹ sư xác nhận'
                                    : 'Chưa đăng ký ngày hái'}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-stone-200/60 text-stone-600">
                                <div>
                                  <span className="text-[10px] text-stone-400 block font-bold">Ngày dự kiến theo vụ:</span>
                                  <strong className="text-brand-dark">{plot.expectedHarvestDate || 'Đang cập nhật'}</strong>
                                </div>
                                <div>
                                  <span className="text-[10px] text-stone-400 block font-bold">Sản lượng ước tính:</span>
                                  <strong className="text-emerald-800">{plot.expectedYield || 'Theo quy chuẩn'}</strong>
                                </div>
                                {plan && (
                                  <>
                                    <div>
                                      <span className="text-[10px] text-stone-400 block font-bold">Ngày đề xuất thu hoạch:</span>
                                      <strong className="text-emerald-700 flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" /> {plan.date}
                                      </strong>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-stone-400 block font-bold">Phương thức nhận:</span>
                                      <strong className="text-brand-dark flex items-center gap-1">
                                        <Truck className="w-3.5 h-3.5" /> {plan.methodLabel || plan.method}
                                      </strong>
                                    </div>
                                    {plan.address && (
                                      <div className="col-span-2 pt-1 border-t border-stone-100">
                                        <span className="text-[10px] text-stone-400 block font-bold">Địa chỉ giao:</span>
                                        <span className="text-stone-600 truncate block">{plan.address}</span>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex justify-end pt-1">
                              <Button
                                size="sm"
                                onClick={() => setHarvestModalPlotId(plot.id)}
                                className={`text-xs font-bold gap-1.5 cursor-pointer ${
                                  plan
                                    ? 'bg-stone-100 hover:bg-stone-200 text-brand-dark border border-stone-300'
                                    : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                                }`}
                              >
                                <Wheat className="w-4 h-4" />
                                <span>{plan ? 'Xem / Sửa kế hoạch thu hoạch' : 'Đăng ký thu hoạch ngay'}</span>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* PHẦN 2: KẾT QUẢ THU HOẠCH & NGHIỆM THU THỰC ĐỊA */}
                <div className="space-y-4 pt-4 border-t border-brand-border/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-heading font-black text-base text-brand-dark flex items-center gap-2">
                        <Apple className="w-4 h-4 text-emerald-700" />
                        <span>2. Biên Bản Nghiệm Thu & Cân Đối Chứng Nông Sản (Thực tế sau khi thu hoạch)</span>
                      </h4>
                      <p className="text-xs text-stone-500">
                        Đối chứng ảnh số cân điện tử do Chuyên viên lao động gửi về và xác nhận bàn giao nông sản.
                      </p>
                    </div>
                  </div>

                {customerPlots.length === 0 || displayedHarvests.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/50 p-8 text-center">
                    <Apple className="mx-auto h-10 w-10 text-stone-400" />
                    <p className="mt-2 font-bold text-stone-700">Chưa có kết quả cân thu hoạch nào</p>
                    <p className="mt-1 text-xs text-stone-500">Sau khi hoàn tất đăng ký và chuyên viên lao động cắt cân nông sản tại vườn, biên bản nghiệm thu sẽ xuất hiện ở đây.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayedHarvests.map((hr) => {
                      const isConfirmed = hr.customerConfirmed || hr.status === 'CONFIRMED';
                      return (
                      <div key={hr.id || hr.harvestId} className="grid gap-4 rounded-2xl border border-brand-border bg-brand-cream/40 p-4 sm:grid-cols-[160px_minmax(0,1fr)] sm:p-5">
                        <img src={hr.evidenceImageUrl || '/images/Mucangchai3.jpg'} alt="Ảnh cân đối chứng" className="h-32 w-full rounded-xl object-cover sm:h-full" />
                        <div className="space-y-3 text-xs">
                          <div className="flex flex-wrap justify-between items-center gap-2">
                            <span className="font-bold text-brand-dark text-sm">{hr.plotName} · {hr.crop}</span>
                            <span className="text-emerald-700 font-black text-base">{hr.formattedYield || '35.0 kg'}</span>
                          </div>
                          <p className="text-stone-600">Ngày thu hoạch: <strong>{hr.harvestDateFormatted || hr.harvestDate}</strong>. Chuyên viên phụ trách nghiệm thu: <strong>{hr.enteredByWorker || 'Trần Văn Lực'}</strong>.</p>
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-brand-border/60">
                            <div className="flex flex-wrap gap-2">
                              <span className="rounded-full bg-white px-3 py-1 font-bold text-stone-600 border border-brand-border">Mã nghiệm thu: {hr.id}</span>
                              <span className={`rounded-full px-3 py-1 font-bold ${isConfirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                {isConfirmed ? `✓ Đã xác nhận · ${hr.deliveryType === 'FARM' || hr.deliveryType === 'PICKUP' ? 'Nhận tại nông trại' : 'Giao tận nhà'}` : 'Chờ khách xác nhận'}
                              </span>
                            </div>
                            {!isConfirmed && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  setSelectedHarvestForAccept(hr);
                                  setShowHarvestAcceptModal(true);
                                }}
                              >
                                Xác nhận nghiệm thu vụ mùa
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Danh sách khiếu nại đã gửi (nếu có) */}
                  {disputeList.length > 0 && (
                    <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-950 flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-rose-700" />
                          Hồ Sơ Khiếu Nại & Tranh Chấp Đang Thẩm Tra:
                        </span>
                        <span className="text-[10px] text-rose-700 font-bold bg-white px-2 py-0.5 rounded border border-rose-200">
                          {disputeList.length} hồ sơ
                        </span>
                      </div>
                      <div className="space-y-2">
                        {disputeList.map((dsp) => (
                          <div key={dsp.id} className="p-3 rounded-xl bg-white border border-rose-200 space-y-1">
                            <div className="flex flex-wrap justify-between items-center gap-1 text-[11px]">
                              <span className="font-mono font-bold text-rose-800">{dsp.id} • {dsp.plotName}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">{dsp.statusLabel}</span>
                            </div>
                            <p className="font-semibold text-stone-800">{dsp.reason}</p>
                            <p className="text-stone-600 text-[11px]">{dsp.notes}</p>
                            <p className="text-[10px] text-stone-400">Gửi lúc: {dsp.createdAt}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                )}
                </div>
              </div>
              );
            })()}

            {/* TAB 6: HỢP ĐỒNG THUÊ ĐẤT & QUY TRÌNH HỦY (BR10) / HỒ SƠ ĐIỆN TỬ */}
            {activeTab === 'contracts' && !selectedPlotId && (
              <div className="space-y-6">
                {renewSuccessToast && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center justify-between shadow-sm animate-fade-in">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      {renewSuccessToast}
                    </span>
                    <button onClick={() => setRenewSuccessToast('')} className="text-emerald-700 hover:text-emerald-900 text-xs">✕</button>
                  </div>
                )}

                {/* Sub-view switcher: Thẻ danh sách vs Hồ sơ điện tử in ấn */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-brand-border shadow-sm">
                  <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl w-fit">
                    <button
                      type="button"
                      onClick={() => setContractSubView('list')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        contractSubView === 'list'
                          ? 'bg-white text-brand-dark shadow-sm'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 inline mr-1.5 text-brand-green" />
                      Danh Sách Thẻ Hợp Đồng
                    </button>
                    <button
                      type="button"
                      onClick={() => setContractSubView('document')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        contractSubView === 'document'
                          ? 'bg-white text-brand-dark shadow-sm'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Printer className="w-3.5 h-3.5 inline mr-1.5 text-brand-green" />
                      Văn Bản Pháp Lý & In Hợp Đồng
                    </button>
                  </div>

                  <Link to="/marketplace">
                    <Button variant="primary" size="sm" className="whitespace-nowrap text-xs">
                      + Thuê thêm thửa đất
                    </Button>
                  </Link>
                </div>

                {contractSubView === 'document' ? (
                  <CustomerContractCenter
                    renterId={user?.id || 1}
                    onRenew={() => {
                      if (customerPlots.length > 0) setSelectedPlotForRenew(customerPlots[0]);
                      setShowRenewContractModal(true);
                    }}
                  />
                ) : (
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border/60 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 border border-emerald-200">
                            SSoT: Master Lease Agreement
                          </span>
                          <span className="text-xs text-stone-500">Mã màn hình: SCR-KH-08 / SCR-AD-10</span>
                        </div>
                        <h3 className="font-heading font-black text-xl text-brand-dark mt-1 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-brand-green" />
                          Hợp Đồng Thuê Thửa Đất & Chính Sách Hoàn Hủy (BR10)
                        </h3>
                        <p className="text-xs text-brand-muted mt-0.5">
                          Quản lý các kỳ thuê đất, theo dõi ngày bàn giao thực tế và gửi yêu cầu hủy hợp đồng theo đúng tỷ lệ khấu trừ.
                        </p>
                      </div>
                    </div>

                    {/* Banner giải thích quy chuẩn BR10 & BR23 */}
                    <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 space-y-1.5">
                      <div className="font-bold flex items-center gap-1.5 text-blue-950">
                        <ShieldAlert className="w-4 h-4 text-blue-700" />
                        Chính Sách Hoàn Tiền Khi Hủy Hợp Đồng (Quy định SSoT BR10):
                      </div>
                      <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-blue-900/90 leading-relaxed">
                        <li><strong>Trước ngày bắt đầu ≥ 3 ngày:</strong> Khấu trừ 20% phí quản trị & giữ chỗ, <strong>hoàn trả 80%</strong> số tiền đã đóng.</li>
                        <li><strong>Trước ngày bắt đầu &lt; 3 ngày:</strong> Khấu trừ 50% chi phí giống & chuẩn bị đất, <strong>hoàn trả 50%</strong> số tiền đã đóng.</li>
                        <li><strong>Khi đã đến hoặc sau ngày bắt đầu canh tác:</strong> Khấu trừ 100%, <strong>không hoàn tiền</strong> vì cây giống đã trồng và công nhân đã triển khai.</li>
                        <li><strong>Bảo trì thửa đất (BR23):</strong> Mọi thửa đất sau khi hủy đều chuyển sang trạng thái <strong>Bảo dưỡng phơi ải 4 ngày (MAINT)</strong> trước khi mở lại trên sàn.</li>
                      </ul>
                    </div>

                    {customerPlots.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/50 p-8 text-center">
                        <FileText className="mx-auto h-10 w-10 text-stone-400" />
                        <p className="mt-2 font-bold text-stone-700">Chưa có hợp đồng nào</p>
                        <p className="mt-1 text-xs text-stone-500">Bạn chưa ký kết hợp đồng thuê thửa đất nào trên hệ thống Farmely.</p>
                        <Link
                          to="/marketplace"
                          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800"
                        >
                          Khám phá đất thuê ngay
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {customerPlots.map((plot) => (
                          <div key={plot.id} className="p-5 sm:p-6 rounded-2xl border border-brand-border bg-white shadow-sm space-y-3.5 text-xs">
                            <div className="flex flex-wrap justify-between items-center gap-2 pb-3 border-b border-brand-border/60">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-brand-green text-sm">{plot.contractCode || `CTR-${plot.id}`}</span>
                                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  Đang hiệu lực ({plot.mode === 'Assisted-Growing' ? 'Farmely chăm sóc' : 'Tự canh tác'})
                                </span>
                              </div>
                              <span className="text-[11px] text-stone-500">
                                Thời hạn: {plot.totalDays || 90} Ngày · Còn {Math.max((plot.totalDays || 90) - (plot.currentDay || 0), 0)} ngày
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-stone-600">
                              <div>
                                <span className="text-stone-400 block text-[10px]">THỬA ĐẤT THUÊ</span>
                                <p><strong className="text-brand-dark">{plot.name} ({plot.mapPlotId || plot.id})</strong></p>
                              </div>
                              <div>
                                <span className="text-stone-400 block text-[10px]">GIỐNG CÂY TRỒNG</span>
                                <p><strong className="text-brand-dark">{plot.crop}</strong></p>
                              </div>
                              <div>
                                <span className="text-stone-400 block text-[10px]">CHUYÊN GIA PHỤ TRÁCH</span>
                                <p><strong className="text-emerald-800">ThS. Nguyễn Hoàng Nam</strong></p>
                              </div>
                              <div>
                                <span className="text-stone-400 block text-[10px]">CÔNG NHÂN TRỰC TIẾP</span>
                                <p><strong className="text-amber-800">{plot.worker || 'Trần Văn Lực (Tổ trưởng CVLĐ)'}</strong></p>
                              </div>
                            </div>

                            {cancelledContracts[plot.contractCode || `CTR-${plot.id}`] ? (
                              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold flex items-center justify-between">
                                <span>✓ Đã gửi yêu cầu chấm dứt hợp đồng sớm (Thửa đất chuyển bảo dưỡng 4 ngày BR23)</span>
                                <span className="text-[11px] bg-rose-200 px-2 py-0.5 rounded">ĐÃ HỦY NGANG</span>
                              </div>
                            ) : (
                              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-brand-border/40">
                                <span className="text-[11px] text-stone-400">
                                  Gia hạn trước tối thiểu 3 ngày theo quy định BR11b.
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedPlotForRenew(plot);
                                      setShowRenewContractModal(true);
                                    }}
                                  >
                                    Gia hạn hợp đồng (Renew)
                                  </Button>
                                  <button
                                    type="button"
                                    onClick={() => setContractSubView('document')}
                                    className="px-3 py-1.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-bold inline-flex items-center gap-1.5"
                                  >
                                    <Printer className="w-3.5 h-3.5 text-stone-600" />
                                    Xem văn bản hợp đồng số
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenCancelModal({
                                      contractCode: plot.contractCode || `CTR-${plot.id}`,
                                      name: plot.name,
                                      area: plot.area,
                                      crop: plot.crop,
                                      totalAmount: 3600000,
                                      startDate: '12/08/2026',
                                      stage: plot.stage
                                    })}
                                    className="text-xs text-rose-600 hover:text-rose-800 hover:underline font-bold self-center cursor-pointer px-2"
                                  >
                                    Chấm dứt hợp đồng sớm (BR10)
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 7: TRỢ LÝ AI NÔNG NGHIỆP */}
            {activeTab === 'ai' && !selectedPlotId && (
              <div className="bg-white rounded-3xl border border-brand-border shadow-sm overflow-hidden flex flex-col h-[680px]">
                {/* Header */}
                <div className="p-4 bg-brand-cream border-b border-brand-border flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-brand-green text-white flex items-center justify-center shadow-sm">
                      <Bot className="w-5 h-5 text-brand-yellow" />
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-sm sm:text-base text-brand-dark">
                        Hỏi Đáp Chuyên Gia Nông Nghiệp AI
                      </h3>
                      <p className="text-[11px] text-stone-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Trợ lý nông học thông minh • Trực tuyến 24/7
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setChatMessages([chatMessages[0]])}
                    className="p-2 text-stone-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                    title="Xóa đoạn chat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 p-5 overflow-y-auto space-y-3.5 text-xs sm:text-sm">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-4 rounded-2xl leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-brand-green text-white rounded-br-none shadow-sm'
                            : 'bg-brand-cream text-brand-dark rounded-bl-none border border-brand-border'
                        }`}
                      >
                        <div className="whitespace-pre-line">{msg.text}</div>
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-brand-border/60 text-[10px] text-stone-600">
                            <span className="font-bold text-brand-green">📖 Trích xuất từ tài liệu (RAG):</span>
                            <div className="mt-0.5 space-y-0.5">
                              {msg.sources.map((s, sIdx) => (
                                <div key={sIdx} className="italic text-stone-500">
                                  • {s.docTitle || s.source} {s.sectionTitle ? `- ${s.sectionTitle}` : ''}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400 mt-1 px-1">{msg.time}</span>
                    </div>
                  ))}

                  {isAiTyping && (
                    <div className="flex items-center gap-2 text-stone-400 text-xs italic p-2">
                      <Sparkles className="w-4 h-4 text-brand-green animate-spin" />
                      <span>Farmely AI đang phân tích dữ liệu cảm biến và nông học...</span>
                    </div>
                  )}
                </div>

                {/* Prompt suggestions */}
                <div className="p-3.5 bg-stone-50 border-t border-brand-border/60 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                    Gợi ý câu hỏi nhanh:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleSendMessage('Độ ẩm thửa A1 hôm nay có cần tưới thêm không?')}
                      className="px-3 py-1.5 rounded-full bg-white border border-brand-border text-xs text-stone-600 hover:bg-brand-green hover:text-white transition-all text-left cursor-pointer"
                    >
                      Độ ẩm thửa A1 hôm nay?
                    </button>
                    <button
                      onClick={() => handleSendMessage('Tôi muốn đặt dịch vụ nhổ cỏ và bón phân thì làm sao?')}
                      className="px-3 py-1.5 rounded-full bg-white border border-brand-border text-xs text-stone-600 hover:bg-brand-green hover:text-white transition-all text-left cursor-pointer"
                    >
                      Cách đặt dịch vụ chăm sóc?
                    </button>
                    <button
                      onClick={() => handleSendMessage('Quy trình phòng trừ sâu bệnh VietGAP?')}
                      className="px-3 py-1.5 rounded-full bg-white border border-brand-border text-xs text-stone-600 hover:bg-brand-green hover:text-white transition-all text-left cursor-pointer"
                    >
                      Quy trình trừ sâu VietGAP?
                    </button>
                  </div>
                </div>

                {/* Input form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="p-3.5 bg-white border-t border-brand-border flex items-center gap-2.5"
                >
                  <input
                    type="text"
                    placeholder="Hỏi AI về thửa đất, kỹ thuật trồng, mùa vụ..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-stone-50 border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                  />
                  <button
                    type="submit"
                    className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-brand-green text-white hover:bg-brand-dark transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs font-bold">Gửi</span>
                  </button>
                </form>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW CHAT: TRỰC TIẾP CHUYÊN GIA NÔNG NGHIỆP & CÔNG NHÂN HIỆN TRƯỜNG */}
            {/* ============================================================== */}
            <Modal
              isOpen={false}
              onClose={() => setShowExpertChatModal(false)}
              title="Nhắn tin với chuyên gia"
              subtitle="Trao đổi nhanh mà không rời màn hình quản lý vườn"
              maxWidth="max-w-5xl"
            >
              <div className="-m-5 sm:-m-5 bg-white overflow-hidden flex flex-col h-[min(68vh,680px)]">
                {/* Header */}
                <div className="p-4 sm:p-5 bg-stone-50 border-b border-brand-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
                        alt="Chuyên gia"
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-brand-green/30"
                      />
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-black text-base text-brand-dark">
                          {customerChatThread?.expertName || 'ThS. Nguyễn Hoàng Nam'}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Chuyên gia VietGAP trưởng
                        </span>
                      </div>
                      <p className="text-xs text-brand-muted">
                        Đang phụ trách & tư vấn kỹ thuật canh tác cho bạn • Phản hồi trung bình &lt; 5 phút
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages Body */}
                <div
                  ref={customerChatScrollRef}
                  className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-brand-cream/20"
                >
                  <div className="text-center my-2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-stone-100 text-stone-500 border border-stone-200 uppercase tracking-wider">
                      Hội thoại tư vấn riêng tư • Cập nhật theo thời gian thực
                    </span>
                  </div>

                  {(!customerChatThread?.messages || customerChatThread.messages.length === 0) ? (
                    <div className="text-center py-16 space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-brand-green flex items-center justify-center mx-auto">
                        <MessageSquare className="w-7 h-7" />
                      </div>
                      <h4 className="font-heading font-black text-base text-brand-dark">
                        Bắt đầu cuộc trò chuyện với {customerChatThread?.expertName || 'ThS. Nguyễn Hoàng Nam'}
                      </h4>
                      <p className="text-xs text-stone-500 max-w-md mx-auto">
                        Gửi câu hỏi về tình trạng thửa đất, quy trình dinh dưỡng hoặc đặt ca trực kiểm tra sâu bệnh.
                      </p>
                    </div>
                  ) : (
                    customerChatThread.messages.map((msg) => {
                      const isMe = msg.sender === 'customer';
                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-3 max-w-xl ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
                        >
                          {!isMe && (
                            <img
                              src={
                                msg.sender === 'worker'
                                  ? 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80'
                                  : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
                              }
                              alt="Avatar"
                              className="w-8 h-8 rounded-full object-cover shrink-0 mt-1 border border-brand-border"
                            />
                          )}
                          <div className={`space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-2 px-1">
                              <span className="text-[11px] font-bold text-stone-600">
                                {isMe
                                  ? (msg.senderName || activeCustomerSenderName)
                                  : (msg.sender === 'worker'
                                      ? (msg.senderName || 'Công nhân hiện trường')
                                      : (customerChatThread?.expertName || 'ThS. Nguyễn Hoàng Nam'))
                                }
                              </span>
                              {!isMe && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                                  {msg.sender === 'worker' ? 'Công nhân CVLĐ' : 'Chuyên gia'}
                                </span>
                              )}
                            </div>

                            <div
                              className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                                isMe
                                  ? 'bg-brand-green text-white rounded-br-none shadow-sm'
                                  : 'bg-white text-stone-800 rounded-bl-none border border-brand-border shadow-xs'
                              }`}
                            >
                              {msg.prescriptionTag && (
                                <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                  <span>{msg.prescriptionTag}</span>
                                </div>
                              )}

                              {msg.photoUrl && (
                                <div className="mb-2 rounded-xl overflow-hidden border border-brand-border/40">
                                  <img
                                    src={msg.photoUrl}
                                    alt="Minh chứng"
                                    className="max-h-56 w-full object-cover"
                                  />
                                  {msg.photoCaption && (
                                    <p className="p-2 text-[11px] bg-black/60 text-white font-medium">
                                      {msg.photoCaption}
                                    </p>
                                  )}
                                </div>
                              )}

                              <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>

                            {/* Timestamp */}
                            <div className={`flex items-center gap-1 text-[10px] px-1 ${isMe ? 'justify-end text-emerald-100' : 'justify-start text-stone-400'}`}>
                              <span>{msg.time}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Quick prompt suggestions */}
                <div className="p-3 bg-stone-50 border-t border-brand-border/60 flex flex-wrap gap-2 text-xs">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider self-center mr-1">
                    Hỏi nhanh:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      sendCustomerMessage('Chào ThS. Nam! Độ ẩm đất hiện tại ở thửa của tôi đang 68% thì có cần tưới thêm không?', activeCustomerSenderName);
                    }}
                    className="px-3 py-1 rounded-full bg-white border border-brand-border text-stone-600 hover:bg-brand-green hover:text-white transition-all text-xs"
                  >
                    💧 Độ ẩm đất hiện tại có cần tưới thêm?
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sendCustomerMessage('Chuyên gia ơi, lá cây ở tầng dưới hơi ngả vàng thì có phải bị thiếu đạm không?', activeCustomerSenderName);
                    }}
                    className="px-3 py-1 rounded-full bg-white border border-brand-border text-stone-600 hover:bg-brand-green hover:text-white transition-all text-xs"
                  >
                    🍅 Tầng lá chân bị vàng có cần xử lý?
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sendCustomerMessage('Tôi muốn nhờ chuyên gia lên phác đồ bón phân trùn quế đợt mới cho rau.', activeCustomerSenderName);
                    }}
                    className="px-3 py-1 rounded-full bg-white border border-brand-border text-stone-600 hover:bg-brand-green hover:text-white transition-all text-xs"
                  >
                    🪱 Nhờ phác đồ bón phân trùn quế
                  </button>
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={handleSendCustomerChat}
                  className="p-3.5 bg-white border-t border-brand-border flex items-center gap-2.5"
                >
                  <input
                    type="text"
                    value={customerChatInput}
                    onChange={(e) => setCustomerChatInput(e.target.value)}
                    placeholder={`Nhập câu hỏi gửi ${customerChatThread?.expertName || 'ThS. Nguyễn Hoàng Nam'}...`}
                    className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-stone-50 border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                  />
                  <button
                    type="submit"
                    disabled={!customerChatInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-brand-green text-white hover:bg-brand-dark disabled:opacity-50 transition-all font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi tin nhắn</span>
                  </button>
                </form>
              </div>
            </Modal>

            

            <FloatingExpertChat
              isOpen={showExpertChatModal}
              onOpen={() => { setChatOpenMode('expert'); setShowExpertChatModal(true); }}
              onClose={() => setShowExpertChatModal(false)}
              thread={customerChatThread}
              senderName={activeCustomerSenderName}
              input={customerChatInput}
              setInput={setCustomerChatInput}
              onSubmit={handleSendCustomerChat}
              onAiSubmit={(text) => { setCustomerChatInput(''); handleSendMessage(text); }}
              aiMessages={chatMessages}
              openMode={chatOpenMode}
              scrollRef={customerChatScrollRef}
            />

          </main>

        </div>

      </div>

      {/* ================= MODALS ================= */}

      <Modal
        isOpen={Boolean(selectedTaskDetail)}
        onClose={() => { setSelectedTaskDetail(null); setTaskPhotoPreview(''); }}
        title="Chi tiết công việc"
        subtitle={selectedTaskDetail?.plot?.name}
        maxWidth="max-w-xl"
      >
        {selectedTaskDetail && (
          <div className="space-y-4 text-left">
            <div className="rounded-2xl border border-brand-border bg-brand-cream/50 p-4">
              <div className="flex items-start justify-between gap-3"><div><p className="font-heading text-lg font-black text-brand-dark">{selectedTaskDetail.title}</p><p className="mt-1 text-xs text-brand-muted">{selectedTaskDetail.time} · {selectedTaskDetail.plot.crop}</p></div><span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-black ${selectedTaskDetail.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>{selectedTaskDetail.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Chờ thực hiện'}</span></div>
            </div>

            {selectedTaskDetail.plot.mode === 'Self-Growing' ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="font-bold text-emerald-900">Bạn tự thực hiện công việc này</p><p className="mt-1 text-xs leading-relaxed text-emerald-800/75">Làm theo hướng dẫn chăm sóc, sau đó chụp ảnh hiện trường để lưu làm minh chứng trong nhật ký thửa.</p></div>
                <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-brand-border bg-white p-4 text-center transition hover:border-brand-green">
                  {taskPhotoPreview ? <img src={taskPhotoPreview} alt="Minh chứng công việc" className="mx-auto h-44 w-full rounded-xl object-cover" /> : <><Camera className="mx-auto h-8 w-8 text-brand-green" /><span className="mt-2 block text-sm font-bold text-brand-dark">Chụp hoặc tải ảnh minh chứng</span><span className="mt-1 block text-xs text-brand-muted">JPG, PNG hoặc ảnh trực tiếp từ camera</span></>}
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) setTaskPhotoPreview(URL.createObjectURL(file)); }} />
                </label>
                <button type="button" disabled={!taskPhotoPreview} onClick={() => { setSelectedTaskDetail(null); setTaskPhotoPreview(''); }} className="w-full rounded-xl bg-brand-green px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40">Hoàn thành và lưu nhật ký</button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-brand-border p-3"><p className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">Người thực hiện</p><p className="mt-1 font-bold text-brand-dark">{selectedTaskDetail.owner || selectedTaskDetail.plot.worker}</p></div><div className="rounded-xl border border-brand-border p-3"><p className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">Thời gian dự kiến</p><p className="mt-1 font-bold text-brand-dark">{selectedTaskDetail.time}</p></div></div>
                <div className="rounded-xl border border-brand-border p-4"><p className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">Cách thực hiện</p><p className="mt-2 text-sm leading-relaxed text-stone-700">Nhân sự Farmely thực hiện theo quy trình VietGAP, cập nhật trạng thái và ảnh minh chứng sau khi hoàn tất. Khách hàng có thể theo dõi nhưng không cần tự đăng nhật ký.</p></div>
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800"><CheckCircle2 className="h-5 w-5" />Trạng thái được đồng bộ bởi đội ngũ hiện trường Farmely</div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* MODAL 1: CHECKOUT / BUY SERVICE (Thanh Toán Dịch Vụ Canh Tác) */}
      <Modal
        isOpen={Boolean(selectedServiceToBuy) && !showServiceQrModal && !showServiceCardModal && !showServiceVnPayModal}
        onClose={() => setSelectedServiceToBuy(null)}
        title="Thanh Toán Dịch Vụ Canh Tác"
        subtitle={selectedServiceToBuy?.name}
        maxWidth="max-w-xl"
        headerVariant="green"
      >
        {selectedServiceToBuy && (
          <form onSubmit={handleConfirmPayment} className="space-y-4 text-left text-xs">
            {/* Price Banner */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-emerald-800 uppercase tracking-wider block font-bold">Gói dịch vụ:</span>
                <span className="font-heading font-black text-sm sm:text-base text-[#1b3b2b]">
                  {selectedServiceToBuy.name}
                </span>
                <span className="text-[11px] text-stone-500 block mt-0.5">{selectedServiceToBuy.unit}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-emerald-800 uppercase tracking-wider block font-bold">Tổng thanh toán:</span>
                <span className="font-heading font-black text-2xl text-[#294C3B]">
                  {selectedServiceToBuy.formattedPrice}
                </span>
              </div>
            </div>

            {/* Select Plot to Apply */}
            <div>
              <label className="block font-bold text-brand-dark mb-1">
                Áp dụng cho thửa đất của bạn: <span className="text-rose-500">*</span>
              </label>
              <select
                value={checkoutPlotId}
                onChange={(e) => {
                  const val = e.target.value;
                  setCheckoutPlotId(val);
                  setTasksPlotFilter(val);
                  setPlotScopeId(val);
                  try { localStorage.setItem('farmely_selected_task_plot', val); } catch {}
                }}
                className="w-full p-2.5 rounded-xl border border-stone-300 bg-white text-xs font-medium focus:ring-2 focus:ring-[#294C3B]/20 focus:border-[#294C3B]"
              >
                {customerPlots.length === 0 ? (
                  <option value="">Chưa có thửa đất nào</option>
                ) : (
                  customerPlots.map((p, idx) => (
                    <option key={`${p.id}-${p.rentalId || p.rental_id || idx}`} value={p.id}>
                      {p.name} ({p.plotCode || p.mapPlotId || p.id}) • {p.crop}
                    </option>
                  ))
                )}
              </select>
              {selectedCheckoutPlot && (
                <div className="mt-2.5 flex items-center gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-[#294C3B]" aria-hidden="true">
                    <Sprout className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-[#1b3b2b]">{selectedCheckoutPlot.location}</p>
                    <p className="mt-0.5 text-stone-500">
                      {selectedCheckoutPlot.area} • {selectedCheckoutPlot.mode === 'Assisted-Growing' ? 'Chăm sóc trọn gói' : 'Tự chăm sóc'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Date to start */}
            <div>
              <label className="block font-bold text-brand-dark mb-1">
                Ngày bắt đầu thực hiện: <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={checkoutDate}
                onChange={(e) => setCheckoutDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 bg-white text-xs font-medium focus:ring-2 focus:ring-[#294C3B]/20 focus:border-[#294C3B]"
              />
            </div>

            {/* Worker Notes */}
            <div>
              <label className="block font-bold text-brand-dark mb-1">
                Ghi chú thêm cho công nhân hiện trường (Tùy chọn):
              </label>
              <textarea
                rows={2}
                value={checkoutNotes}
                onChange={(e) => setCheckoutNotes(e.target.value)}
                placeholder="Ví dụ: Tập trung tỉa nhánh phía bên trái luống, tưới kỹ sau 16:00 chiều..."
                className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#294C3B]/20 focus:border-[#294C3B]"
              />
            </div>

            {/* Phương thức thanh toán duy nhất: Cổng VNPay */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-brand-dark text-xs sm:text-sm">
                  Phương thức thanh toán: <span className="text-rose-500">*</span>
                </label>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Cổng VNPay Sandbox
                </span>
              </div>

              <div className="relative p-3.5 sm:p-4 rounded-2xl border-2 border-[#294C3B] bg-gradient-to-r from-emerald-50/40 via-white to-emerald-50/20 shadow-xs ring-2 ring-[#294C3B]/10 transition-all">
                <div className="flex items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white border border-emerald-200/90 flex items-center justify-center p-2 shadow-2xs shrink-0">
                      <img
                        src="https://sandbox.vnpayment.vn/paymentv2/Images/brands/logo.svg"
                        alt="VNPAY"
                        className="w-full h-auto max-h-6 sm:max-h-7 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'block';
                        }}
                      />
                      <span style={{ display: 'none' }} className="font-black text-[#294C3B] text-xs">VNPAY</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-semibold text-[#1b3b2b] tracking-tight whitespace-nowrap">
                          Cổng Thanh Toán Trực Tuyến VNPAY (Sandbox)
                        </h4>
                        <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-medium bg-[#d1fae5] text-[#065f46] border border-[#a7f3d0] whitespace-nowrap">
                          Chính thức
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5 leading-normal">
                        Thanh toán an toàn, bảo mật tiêu chuẩn quốc tế PCI-DSS & mã hóa SHA-512
                      </p>
                    </div>
                  </div>

                  <div className="w-7 h-7 rounded-full bg-[#294C3B] text-white flex items-center justify-center shrink-0 shadow-xs ring-4 ring-emerald-50">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>


            {/* Actions */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-brand-border/60">
              <button
                type="button"
                onClick={() => setSelectedServiceToBuy(null)}
                className="px-5 py-2.5 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-100 font-bold text-xs transition-colors cursor-pointer"
              >
                HỦY
              </button>
              <button
                type="submit"
                disabled={isProcessingPayment}
                className="px-6 py-2.5 rounded-xl bg-[#294C3B] hover:bg-[#1f3a2d] text-white font-heading font-black text-xs tracking-wider uppercase shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>TIẾP TỤC THANH TOÁN VNPAY ({selectedServiceToBuy.formattedPrice})</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL: Checkout Success */}
      <Modal
        isOpen={showCheckoutSuccessModal}
        onClose={() => {
          setShowCheckoutSuccessModal(false);
          setSelectedServiceToBuy(null);
          setLastPaymentResult(null);
        }}
        title="Thanh Toán Dịch Vụ Thành Công!"
        maxWidth="max-w-lg"
        headerVariant="green"
      >
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h4 className="font-heading text-lg font-black text-brand-dark">
              Đăng Ký & Kích Hoạt Dịch Vụ Thành Công!
            </h4>
            <p className="text-xs font-medium text-stone-600 mt-1 max-w-sm mx-auto">
              Yêu cầu dịch vụ của bạn đã được tiếp nhận và đưa vào lịch chăm sóc của thửa đất.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 text-left text-xs space-y-2 border border-emerald-200">
            <div className="flex justify-between items-center pb-1.5 border-b border-emerald-200/60">
              <span className="text-stone-500 font-medium">Mã giao dịch:</span>
              <span className="font-mono font-bold text-brand-green">
                #{lastPaymentResult?.transactionId || 'TXN-SUCCESS'}
              </span>
            </div>
            <div className="flex justify-between items-center pb-1.5 border-b border-emerald-200/60">
              <span className="text-stone-500 font-medium">Mã yêu cầu:</span>
              <span className="font-mono font-bold text-brand-dark">
                REQ-{lastPaymentResult?.requestId || '01'}
              </span>
            </div>
            <div className="flex justify-between items-center pb-1.5 border-b border-emerald-200/60">
              <span className="text-stone-500 font-medium">Gói dịch vụ:</span>
              <span className="font-bold text-brand-dark text-right">
                {lastPaymentResult?.serviceName || selectedServiceToBuy?.name}
              </span>
            </div>
            <div className="flex justify-between items-center pb-1.5 border-b border-emerald-200/60">
              <span className="text-stone-500 font-medium">Thửa đất áp dụng:</span>
              <span className="font-bold text-brand-dark">
                {lastPaymentResult?.plotName || customerPlots.find(p => p.id === checkoutPlotId)?.name || 'Thửa đất đã chọn'}
              </span>
            </div>
            <div className="flex justify-between items-center pb-1.5 border-b border-emerald-200/60">
              <span className="text-stone-500 font-medium">Ngày thực hiện:</span>
              <span className="font-bold text-emerald-800">
                {lastPaymentResult?.scheduledDate || checkoutDate}
              </span>
            </div>
            <div className="flex justify-between items-center pb-1.5 border-b border-emerald-200/60">
              <span className="text-stone-500 font-medium">Số tiền thanh toán:</span>
              <span className="font-black text-brand-green font-heading text-sm">
                {lastPaymentResult?.formattedAmount || selectedServiceToBuy?.formattedPrice || 'Đã thanh toán'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500 font-medium">Trạng thái công việc:</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                PENDING (Đã vào Lịch canh tác)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              className="w-full py-2.5 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-100 font-bold text-xs transition-colors cursor-pointer"
              onClick={() => {
                setShowCheckoutSuccessModal(false);
                setSelectedServiceToBuy(null);
                setLastPaymentResult(null);
              }}
            >
              Ở LẠI DỊCH VỤ
            </button>
            <button
              type="button"
              className="w-full py-2.5 rounded-xl font-heading font-black text-xs tracking-wider uppercase bg-[#294C3B] hover:bg-[#1f3a2d] text-white shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              onClick={() => {
                const targetPlot = selectedCheckoutPlot || customerPlots.find(p => p.id === checkoutPlotId) || customerPlots[0];
                setShowCheckoutSuccessModal(false);
                setSelectedServiceToBuy(null);
                setLastPaymentResult(null);
                setActiveTab('yards');
                if (targetPlot) {
                  setSelectedPlotId(targetPlot.id);
                  setCheckoutPlotId(targetPlot.id);
                  navigate(`/customer/dashboard?plot=${targetPlot.id}`);
                } else {
                  setSelectedPlotId(null);
                  navigate('/customer/dashboard');
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <Eye className="w-4 h-4 text-emerald-300" />
              <span>XEM CHI TIẾT THỬA ĐẤT</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: New Diary Entry */}
      <Modal
        isOpen={showNewDiaryModal}
        onClose={() => setShowNewDiaryModal(false)}
        title="Thêm Nhật Ký Canh Tác Mới"
        subtitle="Cập nhật tiến độ hoặc ảnh tham quan vườn của bạn"
      >
        <div className="space-y-4 text-left text-xs">
          <div>
            <label className="block font-bold text-brand-dark mb-1">Chọn Thửa Đất:</label>
            <select
              value={diaryPlotId}
              onChange={(e) => setDiaryPlotId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-brand-border bg-white text-xs"
            >
              {customerPlots.length === 0 ? (
                <option value="">Chưa có thửa đất nào</option>
              ) : (
                customerPlots.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id}) • {p.crop}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">Ghi Chú Nhật Ký:</label>
            <textarea
              rows={3}
              value={diaryNote}
              onChange={(e) => setDiaryNote(e.target.value)}
              placeholder="Ví dụ: Cây phát triển rất đều, đất tơi xốp, lá xanh mướt..."
              className="w-full p-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-green/20"
            />
          </div>

          <div className="p-4 rounded-xl border-2 border-dashed border-stone-300 text-center space-y-1">
            <Camera className="w-6 h-6 text-stone-400 mx-auto" />
            <p className="font-bold text-stone-600">Đính kèm ảnh hiện trường thực tế</p>
            <p className="text-[10px] text-stone-400">Hỗ trợ PNG, JPG tối đa 5MB</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowNewDiaryModal(false)}>
              HỦY
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={async () => {
                if (!diaryNote.trim()) return;
                try {
                  const targetPlot = customerPlots.find((p) => p.id === diaryPlotId) || customerPlots[0];
                  const targetRental = targetPlot?.rentalId || 1;
                  await fetch('/api/farm-diaries', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      rentalId: targetRental,
                      content: diaryNote.trim(),
                      imageUrl: targetPlot?.image || 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80'
                    })
                  });
                  loadOperationsFromDb();
                } catch (err) {
                  console.warn('Could not post diary to DB:', err);
                }
                alert('Đã lưu nhật ký Farm Diary thành công vào cơ sở dữ liệu!');
                setShowNewDiaryModal(false);
                setDiaryNote('');
              }}
            >
              LƯU NHẬT KÝ
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Chuẩn bị thu hoạch cho RIÊNG 1 thửa */}
      <PlotHarvestModal
        plot={harvestModalPlot}
        isOpen={Boolean(harvestModalPlot)}
        existingPlan={harvestModalPlot ? harvestPlans[harvestModalPlot.id] || null : null}
        onClose={() => setHarvestModalPlotId(null)}
        onConfirm={handleConfirmHarvestPlan}
        onCancelPlan={handleCancelHarvestPlan}
      />

      {/* Modal: Accept Harvest & Quality Rating (UC19 / BR16) */}
      <Modal
        isOpen={showHarvestAcceptModal}
        onClose={() => setShowHarvestAcceptModal(false)}
        title="Nghiệm Thu Sản Lượng & Đánh Giá Chất Lượng Vụ Mùa (UC19)"
        subtitle="Đối chứng cân điện tử, chọn phương thức giao nhận và đánh giá chất lượng nông sản từ CSDL PostgreSQL"
      >
        <form onSubmit={handleConfirmHarvestAcceptance} className="space-y-4 text-left text-xs max-h-[75vh] overflow-y-auto pr-1">
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
            <p className="font-bold text-sm">✓ Sản lượng dự kiến/thực tế: {selectedHarvestForAccept?.formattedYield || '35.0 kg'} {selectedHarvestForAccept?.crop || 'Nông sản VietGAP'}</p>
            <p className="text-[11px] text-emerald-800">Áp dụng cho: <strong>{selectedHarvestForAccept?.plotName || customerPlots[0]?.name || 'Thửa đất của bạn'}</strong>. Ảnh cân đối chứng và tem truy xuất QR đã được xác thực tại trạm đóng gói Farmely.</p>
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1.5">1. Phương thức nhận nông sản:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${harvestDeliveryMethod === 'DELIVERY' ? 'border-brand-green bg-emerald-50/50 shadow-xs' : 'border-brand-border bg-white'}`}>
                <input type="radio" name="deliver" checked={harvestDeliveryMethod === 'DELIVERY'} onChange={() => setHarvestDeliveryMethod('DELIVERY')} className="mt-0.5" />
                <div>
                  <span className="font-bold text-brand-dark block">Giao tận nhà (24h)</span>
                  <span className="text-[10px] text-stone-500">Đóng thùng bảo quản lạnh, giữ trọn độ tươi giòn</span>
                </div>
              </label>
              <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${harvestDeliveryMethod === 'FARM' ? 'border-brand-green bg-emerald-50/50 shadow-xs' : 'border-brand-border bg-white'}`}>
                <input type="radio" name="deliver" checked={harvestDeliveryMethod === 'FARM'} onChange={() => setHarvestDeliveryMethod('FARM')} className="mt-0.5" />
                <div>
                  <span className="font-bold text-brand-dark block">Tự đến nông trại nhận</span>
                  <span className="text-[10px] text-stone-500">Nhận tại trạm đóng gói, kết hợp dã ngoại tham quan</span>
                </div>
              </label>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
            <label className="block font-bold text-brand-dark text-xs uppercase tracking-wider">
              2. Đánh giá chất lượng nông sản thu hoạch:
            </label>

            {/* Overall Rating */}
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-700">Mức độ hài lòng chung:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setHarvestRating(s)}
                    className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star className={`w-4 h-4 ${s <= harvestRating ? 'fill-amber-400 text-amber-500' : 'text-stone-300'}`} />
                  </button>
                ))}
                <span className="ml-1 font-bold text-amber-600 text-xs">{harvestRating}/5 sao</span>
              </div>
            </div>

            {/* Freshness Rating */}
            <div className="flex items-center justify-between">
              <span className="text-stone-600">Độ tươi ngon, giòn ngọt:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setHarvestFreshness(s)}
                    className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star className={`w-4 h-4 ${s <= harvestFreshness ? 'fill-amber-400 text-amber-500' : 'text-stone-300'}`} />
                  </button>
                ))}
                <span className="ml-1 font-bold text-amber-600 text-xs">{harvestFreshness}/5</span>
              </div>
            </div>

            {/* Packaging Rating */}
            <div className="flex items-center justify-between">
              <span className="text-stone-600">Quy cách sơ chế & đóng gói:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setHarvestPackaging(s)}
                    className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star className={`w-4 h-4 ${s <= harvestPackaging ? 'fill-amber-400 text-amber-500' : 'text-stone-300'}`} />
                  </button>
                ))}
                <span className="ml-1 font-bold text-amber-600 text-xs">{harvestPackaging}/5</span>
              </div>
            </div>

            <div>
              <label className="block text-stone-600 mb-1">Ý kiến đóng góp cho Nông dân & Chuyên gia:</label>
              <textarea
                rows={2}
                value={harvestFeedback}
                onChange={(e) => setHarvestFeedback(e.target.value)}
                placeholder="Ví dụ: Rau rất tươi, vị ngọt tự nhiên, khâu đóng thùng cẩn thận..."
                className="w-full p-2.5 rounded-xl border border-stone-300 text-xs bg-white focus:ring-2 focus:ring-brand-green/20"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowHarvestAcceptModal(false)}>
              HỦY
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmittingHarvestRating}
              className="bg-brand-green hover:bg-[#203c2c] text-white font-bold"
            >
              {isSubmittingHarvestRating ? 'Đang gửi...' : 'GỬI ĐÁNH GIÁ & XÁC NHẬN'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Renew Contract (UC07 / BR11 / BR12) */}
      <Modal
        isOpen={showRenewContractModal}
        onClose={() => setShowRenewContractModal(false)}
        title="Gia Hạn Hợp Đồng Thuê Thửa Đất (Renewal)"
        subtitle={selectedPlotForRenew ? `${selectedPlotForRenew.name || selectedPlotForRenew.mapPlotId} (${selectedPlotForRenew.mapPlotId || selectedPlotForRenew.id})` : "Gia hạn quyền canh tác"}
      >
        <form onSubmit={handleConfirmRenewContract} className="space-y-4 text-left text-xs">
          {selectedPlotForRenew && (
            <div className="p-3.5 rounded-xl bg-brand-cream/70 border border-brand-border space-y-1">
              <p><strong>Thửa đất:</strong> {selectedPlotForRenew.name || selectedPlotForRenew.mapPlotId} ({selectedPlotForRenew.mapPlotId || selectedPlotForRenew.id})</p>
              <p><strong>Cây trồng:</strong> {selectedPlotForRenew.crop || 'Rau hữu cơ VietGAP'}</p>
              <p><strong>Hình thức:</strong> {selectedPlotForRenew.mode === 'Assisted-Growing' ? 'Farmely hỗ trợ toàn diện' : 'Tự canh tác'}</p>
            </div>
          )}

          {customerPlots.length > 1 && (
            <div>
              <label className="block font-bold text-brand-dark mb-1">Chọn Thửa Đất Cần Gia Hạn:</label>
              <select
                value={selectedPlotForRenew?.id || ''}
                onChange={(e) => {
                  const target = customerPlots.find(p => p.id === e.target.value);
                  if (target) setSelectedPlotForRenew(target);
                }}
                className="w-full p-2.5 rounded-xl border border-brand-border bg-white text-xs font-bold"
              >
                {customerPlots.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.mapPlotId || p.id})</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-bold text-brand-dark mb-1">Gói Thời Gian Gia Hạn Kế Tiếp:</label>
            <select
              value={renewMonths}
              onChange={(e) => setRenewMonths(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl border border-brand-border bg-white text-xs font-bold"
            >
              <option value={1}>Gia hạn thêm 01 Tháng (Đơn giá tiêu chuẩn)</option>
              <option value={3}>Gia hạn thêm 03 Tháng (Ưu đãi giảm 5%)</option>
              <option value={6}>Gia hạn thêm 06 Tháng (Ưu đãi giảm 10%)</option>
              <option value={12}>Gia hạn thêm 12 Tháng (Ưu đãi giảm 15%)</option>
            </select>
          </div>

          {/* Pricing summary */}
          {(() => {
            const monthlyPrice = 1200000;
            const discountPct = renewMonths === 12 ? 0.15 : renewMonths === 6 ? 0.10 : renewMonths === 3 ? 0.05 : 0;
            const subtotal = monthlyPrice * renewMonths;
            const discountAmount = subtotal * discountPct;
            const total = subtotal - discountAmount;

            const futureDate = new Date();
            futureDate.setMonth(futureDate.getMonth() + renewMonths);
            const formattedDate = `${String(futureDate.getDate()).padStart(2, '0')}/${String(futureDate.getMonth() + 1).padStart(2, '0')}/${futureDate.getFullYear()}`;

            return (
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                <div className="flex justify-between text-stone-600">
                  <span>Thời hạn hiệu lực mới đến:</span>
                  <span className="font-bold text-brand-dark">{formattedDate}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Đơn giá định mức:</span>
                  <span>{monthlyPrice.toLocaleString('vi-VN')} đ/tháng × {renewMonths} tháng</span>
                </div>
                {discountPct > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Ưu đãi gia hạn ({discountPct * 100}%):</span>
                    <span>-{discountAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-stone-200 pt-1.5 font-bold text-sm text-brand-green">
                  <span>Tổng tiền thanh toán:</span>
                  <span>{total.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
            );
          })()}

          <div className="p-3 rounded-xl bg-brand-cream/60 border border-brand-border text-stone-600 space-y-1 text-[11px]">
            <p>• <strong>BR12:</strong> Thửa đất được kế thừa toàn bộ lịch sử dinh dưỡng, camera IoT và nhật ký vụ trước.</p>
            <p>• <strong>Tặng kèm:</strong> 01 chu kỳ phân bón vi sinh VietGAP và kiểm tra mẫu đất miễn phí.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowRenewContractModal(false)}>
              HỦY
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isRenewingContract}
              className="bg-brand-green hover:bg-[#203c2c] text-white font-bold"
            >
              {isRenewingContract ? 'Đang kích hoạt...' : 'XÁC NHẬN GIA HẠN'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Cultivation Service VNPay Pop-up Modal */}
      <VnPayModal
        isOpen={showServiceVnPayModal}
        onClose={() => setShowServiceVnPayModal(false)}
        plotInfo={customerPlots.find(p => p.id === checkoutPlotId)}
        serviceInfo={selectedServiceToBuy}
        totalAmount={selectedServiceToBuy?.price}
        additionalPayload={{
          rentalId: customerPlots.find(p => p.id === checkoutPlotId)?.rentalId || customerPlots.find(p => p.id === checkoutPlotId)?.rental_id || 1,
          serviceId: typeof selectedServiceToBuy?.serviceId === 'number'
            ? selectedServiceToBuy.serviceId
            : (parseInt(String(selectedServiceToBuy?.serviceId || selectedServiceToBuy?.id || 1).replace(/\D/g, ''), 10) || 1),
          serviceName: selectedServiceToBuy?.name,
          plotCode: customerPlots.find(p => p.id === checkoutPlotId)?.mapPlotId || customerPlots.find(p => p.id === checkoutPlotId)?.plotCode || (checkoutPlotId ? checkoutPlotId.replace(/^PLOT-/i, '') : 'P-01'),
          scheduledDate: checkoutDate || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
          notes: checkoutNotes
        }}
        onPaymentSuccess={handleServicePaymentSuccess}
      />

      {/* Cultivation Service Card Payment Pop-up Modal */}
      <CardPaymentModal
        isOpen={showServiceCardModal}
        onClose={() => setShowServiceCardModal(false)}
        totalAmount={selectedServiceToBuy?.price}
        plotInfo={customerPlots.find(p => p.id === checkoutPlotId)}
        serviceInfo={selectedServiceToBuy}
        chargeEndpoint="http://localhost:8085/api/v1/payments/service/card/charge"
        additionalPayload={{
          serviceName: selectedServiceToBuy?.name,
          rentalId: 1,
          plotCode: checkoutPlotId,
          scheduledDate: checkoutDate,
          notes: checkoutNotes
        }}
        onPaymentSuccess={handleServicePaymentSuccess}
      />

      {/* SSoT BR10: Modal Yêu cầu Hủy Hợp Đồng & Quy trình Hoàn Tiền */}
      <ContractCancellationModal
        isOpen={showCancellationModal}
        contract={selectedContractForCancel}
        onClose={() => setShowCancellationModal(false)}
        onSuccess={(result) => {
          if (selectedContractForCancel?.contractCode) {
            setCancelledContracts((prev) => ({
              ...prev,
              [selectedContractForCancel.contractCode]: result
            }));
          }
        }}
      />

      {/* Modal: Gửi Yêu Cầu Dịch Vụ Riêng & Chăm Sóc Đặc Biệt (UC10 / BR13) */}
      <Modal
        isOpen={showCustomServiceModal}
        onClose={() => setShowCustomServiceModal(false)}
        title="Gửi Yêu Cầu Dịch Vụ Theo Nhu Cầu Riêng (UC10)"
        subtitle="Ban Quản Trị & Chuyên Gia sẽ khảo sát, tư vấn giải pháp và báo giá chi tiết"
      >
        <form onSubmit={handleCreateCustomServiceRequest} className="space-y-3.5 text-xs text-left max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="block font-bold text-brand-dark mb-1">Áp dụng cho thửa đất:</label>
            <select
              value={customServiceData.plotId}
              onChange={(e) => setCustomServiceData({ ...customServiceData, plotId: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-brand-border bg-white text-xs font-bold"
            >
              {customerPlots.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.mapPlotId || p.id}) — {p.crop}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">Tên dịch vụ / Công việc bạn mong muốn:</label>
            <input
              type="text"
              required
              value={customServiceData.title}
              onChange={(e) => setCustomServiceData({ ...customServiceData, title: e.target.value })}
              placeholder="VD: Cắt tỉa tạo tán nghệ thuật, Phun chế phẩm nano bạc, Rải mùn hữu cơ..."
              className="w-full p-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-green/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-brand-dark mb-1">Ngày mong muốn thực hiện:</label>
              <input
                type="date"
                value={customServiceData.scheduledDate}
                onChange={(e) => setCustomServiceData({ ...customServiceData, scheduledDate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-brand-border text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-brand-dark mb-1">Ngân sách dự kiến (VND, tùy chọn):</label>
              <input
                type="number"
                value={customServiceData.budget}
                onChange={(e) => setCustomServiceData({ ...customServiceData, budget: e.target.value })}
                placeholder="VD: 300000"
                className="w-full p-2.5 rounded-xl border border-brand-border text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">Mô tả chi tiết yêu cầu & chỉ dẫn cho công nhân:</label>
            <textarea
              rows={3}
              required
              value={customServiceData.notes}
              onChange={(e) => setCustomServiceData({ ...customServiceData, notes: e.target.value })}
              placeholder="Mô tả cụ thể vị trí trên luống, tình trạng hiện tại, lưu ý giống cây hoặc mong muốn đặc biệt..."
              className="w-full p-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-green/20"
            />
          </div>

          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 space-y-1 text-[11px]">
            <p className="font-bold">Quy trình xử lý theo quy định BR13:</p>
            <p>1. Ban Quản Trị tiếp nhận và phân công Chuyên Gia khảo sát tính khả thi nông học.</p>
            <p>2. Chuyên gia gửi báo giá và phương án kỹ thuật qua tin nhắn / thông báo trong 2 giờ.</p>
            <p>3. Bạn duyệt báo giá để công nhân tiến hành thực hiện ngoài ruộng.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowCustomServiceModal(false)}>
              HỦY
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmittingCustomService}
              className="bg-brand-green hover:bg-[#203c2c] text-white font-bold"
            >
              {isSubmittingCustomService ? 'Đang gửi...' : 'GỬI YÊU CẦU DỊCH VỤ'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Gửi Khiếu Nại & Tranh Chấp Sản Lượng / Chất Lượng (SCR-KH-15 / UC20 / BR17) */}
      <Modal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        title="Gửi Khiếu Nại & Tranh Chấp Vụ Mùa (UC20 / BR17)"
        subtitle="Hệ thống cam kết tiếp nhận và phản hồi phán quyết trong vòng 24 giờ"
      >
        <form onSubmit={handleCreateDispute} className="space-y-3.5 text-xs text-left max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="block font-bold text-brand-dark mb-1">Thửa đất khiếu nại:</label>
            <select
              value={disputeData.plotId}
              onChange={(e) => setDisputeData({ ...disputeData, plotId: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-brand-border bg-white text-xs font-bold"
            >
              {customerPlots.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.mapPlotId || p.id}) — {p.crop}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">Loại khiếu nại:</label>
            <select
              value={disputeData.reason}
              onChange={(e) => setDisputeData({ ...disputeData, reason: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-brand-border bg-white text-xs"
            >
              <option value="Thiếu hụt sản lượng so với cam kết tối thiểu (BR16)">Thiếu hụt sản lượng so với cam kết tối thiểu (BR16)</option>
              <option value="Nông sản bị dập nát, hư hỏng trong quá trình vận chuyển">Nông sản bị dập nát, hư hỏng trong quá trình vận chuyển</option>
              <option value="Chăm sóc không đúng quy trình kỹ thuật VietGAP đã cam kết">Chăm sóc không đúng quy trình kỹ thuật VietGAP đã cam kết</option>
              <option value="Phát hiện dấu hiệu sâu bệnh bất thường không được cảnh báo">Phát hiện dấu hiệu sâu bệnh bất thường không được cảnh báo</option>
              <option value="Khác (Ý kiến về vệ sinh, đóng gói)">Khác (Ý kiến về vệ sinh, đóng gói)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">Phương án bồi thường mong muốn:</label>
            <select
              value={disputeData.requestedSolution}
              onChange={(e) => setDisputeData({ ...disputeData, requestedSolution: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-brand-border bg-white text-xs"
            >
              <option value="Bồi thường nông sản tương đương trong đợt thu hoạch kế tiếp">Bồi thường nông sản tương đương trong đợt thu hoạch kế tiếp</option>
              <option value="Hoàn tiền tương ứng phần sản lượng thiếu hụt vào ví Farmely">Hoàn tiền tương ứng phần sản lượng thiếu hụt vào ví Farmely</option>
              <option value="Cử chuyên gia nông nghiệp trực tiếp thẩm định hiện trường">Cử chuyên gia nông nghiệp trực tiếp thẩm định hiện trường</option>
              <option value="Gia hạn thêm ngày chăm sóc bù đắp chi phí">Gia hạn thêm ngày chăm sóc bù đắp chi phí</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">Link ảnh chụp minh chứng (URL):</label>
            <input
              type="text"
              value={disputeData.evidenceUrl}
              onChange={(e) => setDisputeData({ ...disputeData, evidenceUrl: e.target.value })}
              placeholder="https://example.com/anh-can-thieu.jpg"
              className="w-full p-2.5 rounded-xl border border-brand-border text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">Mô tả chi tiết nội dung khiếu nại:</label>
            <textarea
              rows={3}
              required
              value={disputeData.notes}
              onChange={(e) => setDisputeData({ ...disputeData, notes: e.target.value })}
              placeholder="Ghi rõ thời điểm nhận hàng, tình trạng thực tế đối chiếu với thông số cân trên hệ thống..."
              className="w-full p-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-green/20"
            />
          </div>

          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1 text-[11px]">
            <p className="font-bold">Chính sách bảo vệ khách hàng Farmely (BR17):</p>
            <p>• Dữ liệu cân điện tử và camera tại trạm đóng gói được trích xuất để đối chứng minh bạch.</p>
            <p>• Trường hợp lỗi do quy trình nông trại, Farmely cam kết bồi thường 100% thiệt hại.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowDisputeModal(false)}>
              HỦY
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmittingDispute}
              className="bg-rose-700 hover:bg-rose-800 text-white font-bold"
            >
              {isSubmittingDispute ? 'Đang gửi...' : 'GỬI HỒ SƠ KHIẾU NẠI'}
            </Button>
          </div>
        </form>
      </Modal>

      <CustomerMobileNav activeView={activeTab} />
    </div>
  );
}
