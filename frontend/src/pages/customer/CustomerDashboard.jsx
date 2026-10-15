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
import CustomerPlotWorkspace from '../../components/customer/CustomerPlotWorkspace';
import PlotHarvestModal from '../../components/customer/PlotHarvestModal';
import { useRealtimeChat } from '../../hooks/useRealtimeChat';
import { apiFetch, unwrapData } from '../../api/apiClient';
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
  CreditCard,
  MapPin,
  RefreshCw,
  ClipboardList,
  Bot,
  Sun,
  Layers,
  ChevronRight,
  ShoppingBag,
  Check,
  MessageSquare,
  UserCheck,
  QrCode,
  Flame,
  Tag,
  LayoutDashboard,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

export default function CustomerDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { services: localServices, loadServices: loadMasterServices } = useServiceStore();
  const [apiServices, setApiServices] = useState([]);
  const [apiCustomerPlots, setApiCustomerPlots] = useState([]);
  const [dashboardDataError] = useState('');
  const masterServices = apiServices;

  const loadServices = useCallback(async (force = false) => {
    const services = await loadMasterServices(force);
    setApiServices(services || []);
    return services;
  }, [loadMasterServices]);
  const [activeTab, setActiveTab] = useState('yards');
  const [selectedPlotId, setSelectedPlotId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState(null);
  const [taskPhotoPreview, setTaskPhotoPreview] = useState('');
  const [chatOpenMode, setChatOpenMode] = useState('expert');
  const [iotReturnPlotId, setIotReturnPlotId] = useState(null);
  const [showExpertChatModal, setShowExpertChatModal] = useState(false);

  useEffect(() => {
    loadServices().catch(() => {});
  }, [loadServices]);

  const activeCustomerSenderName = user?.fullName || user?.email || 'Khách hàng';

  const {
    currentThread: customerChatThread,
    sendMessage: sendCustomerMessage
  } = useRealtimeChat({
    role: 'customer',
    initialThreadId: null,
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
  const [checkoutPlotId, setCheckoutPlotId] = useState(null);
  const [checkoutDate, setCheckoutDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState('VNPAY');
  const [showCheckoutSuccessModal, setShowCheckoutSuccessModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showServiceVnPayModal, setShowServiceVnPayModal] = useState(false);
  const [showServiceCardModal, setShowServiceCardModal] = useState(false);
  const [serviceQrData, setServiceQrData] = useState(null);
  const [livePlotOperations, setLivePlotOperations] = useState({});

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
  const [harvestAcceptance, setHarvestAcceptance] = useState({ status: 'PENDING', confirmedAt: null, deliveryMethod: null });

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
    try {
      localStorage.setItem(harvestStorageKey, JSON.stringify(harvestPlans));
    } catch {
      /* hết dung lượng / chế độ ẩn danh: bỏ qua, kế hoạch vẫn còn trong phiên */
    }
  }, [harvestPlans, harvestStorageKey]);
  const [showRenewContractModal, setShowRenewContractModal] = useState(false);
  const [emergencyRequests, setEmergencyRequests] = useState({});

  // Form states
  const [diaryNote, setDiaryNote] = useState('');

  // AI Chatbot state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Sample Customer Rented Plots Data
  const fallbackCustomerPlots = [
    {
      id: 'PLOT-CC-01',
      mapPlotId: 'P-01',
      name: 'Thửa Sen Vàng A1',
      location: 'Nông trại Củ Chi Sinh Thái',
      area: '100m²',
      mode: 'Assisted-Growing',
      crop: 'Cà chua bi Cherry F1',
      stage: 'Ra hoa & đậu trái non',
      currentDay: 28,
      totalDays: 65,
      progressPercent: 43,
      image: '/images/Mucangchai3.jpg',
      temp: '28.5°C',
      soilMoisture: '68%',
      airHumidity: '74%',
      light: '45.000 Lux',
      ph: '6.5',
      stationId: 'IOT-CC-01',
      status: 'HEALTHY',
      worker: 'Trần Văn Lực (CVLĐ)',
      contractCode: 'CTR-2026-FARM-9912',
      expectedHarvestDate: '18/11/2026',
      expectedYield: '35 - 45 kg',
      soilType: 'Đất phù sa bồi lắng giàu mùn (pH 6.5)',
      waterSource: 'Hệ thống nước tưới ngầm lọc cát + UV'
    },
    {
      id: 'PLOT-MC-02',
      mapPlotId: 'P-02',
      name: 'Thửa Mộc Châu B2',
      location: 'Cao nguyên Mộc Châu',
      area: '80m²',
      mode: 'Self-Growing',
      crop: 'Xà lách Romaine VietGAP',
      stage: 'Cuộn bắp tròn & Sắp thu hoạch',
      currentDay: 24,
      totalDays: 35,
      progressPercent: 68,
      image: '/images/moc-chau-2811.jpg',
      temp: '22.0°C',
      soilMoisture: '62%',
      airHumidity: '78%',
      light: '38.000 Lux',
      ph: '6.2',
      stationId: 'IOT-MC-02',
      status: 'NEARING_HARVEST',
      worker: 'Khách hàng tự chăm sóc (Self)',
      contractCode: 'CTR-2026-FARM-8831',
      expectedHarvestDate: '12/10/2026',
      expectedYield: '20 - 25 kg',
      soilType: 'Đất đỏ bazan tơi xốp giàu khoáng',
      waterSource: 'Nước suối nguồn tinh khiết'
    },
    {
      id: 'PLOT-CG-03',
      mapPlotId: 'P-03',
      name: 'Thửa Rừng Sác C3',
      location: 'Nông trại Sinh Thái Cần Giờ',
      area: '120m²',
      mode: 'Assisted-Growing',
      crop: 'Dưa leo Baby VietGAP',
      stage: 'Leo giàn & Bắt đầu đơm hoa',
      currentDay: 16,
      totalDays: 45,
      progressPercent: 35,
      image: '/images/mu-cang-chai-thang-8-2-1006.webp',
      temp: '29.0°C',
      soilMoisture: '70%',
      airHumidity: '72%',
      light: '50.000 Lux',
      ph: '6.7',
      stationId: 'IOT-CG-03',
      status: 'HEALTHY',
      worker: 'Nguyễn Văn Đạt (CVLĐ)',
      contractCode: 'CTR-2026-FARM-7740',
      expectedHarvestDate: '28/10/2026',
      expectedYield: '50 - 60 kg',
      soilType: 'Đất phù sa pha cát hữu cơ',
      waterSource: 'Hệ thống tưới nhỏ giọt bán tự động'
    }
  ];
  const customerPlots = apiCustomerPlots;
  const selectedCheckoutPlot = customerPlots.find((plot) => plot.id === checkoutPlotId) || customerPlots[0];

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
        id: s.serviceId,
        name: s.serviceName,
        price: Number(s.price || 0),
        unit: s.unit || '/ lần thực hiện',
        description: s.description || 'Dịch vụ chăm sóc theo tiêu chuẩn Farmely.',
        active: String(s.status || 'ACTIVE') === 'ACTIVE',
        customerCategory: String(s.serviceType || '').includes('FULL') ? 'FULL' : 'SINGLE',
        tag: String(s.serviceType || '').includes('FULL') ? 'Gói chăm sóc' : 'Dịch vụ lẻ',
        iconKey: 'sprout',
        tasks: []
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
        statusLabel: request.status === 'DONE' ? 'Đã hoàn thành' : request.status === 'IN_PROG' ? 'Đang thực hiện' : 'Đang chờ xử lý',
        worker: 'Farmely điều phối',
        paymentMethod: 'Theo giao dịch hệ thống'
      })));
    }).catch(() => {
      if (!cancelled) { setApiServices([]); setApiCustomerPlots([]); setActiveServiceOrders([]); }
    });
    return () => { cancelled = true; };
  }, []);

  // IoT Data for Different Timeframes (Hourly, Daily, Weekly)
  const [iotDatasets, setIotDatasets] = useState(false ? {
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
  } : {});

  const currentIotData = [];
  const currentIotPlot = customerPlots.find(p => p.id === selectedIotPlotId) || customerPlots[0] || { id: '', name: 'Chưa có dữ liệu' };

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

  // Active / Purchased Service Orders
  const [activeServiceOrders, setActiveServiceOrders] = useState([]);

  const serviceIconMap = { calendar: Calendar, layers: Layers, droplets: Droplets, sprout: Sprout };
  const customerServiceCatalog = masterServices.map((service) => ({
      ...service,
      category: service.customerCategory,
      formattedPrice: `${service.price.toLocaleString('vi-VN')} đ`,
      icon: serviceIconMap[service.iconKey] || Sprout,
      color: service.customerCategory === 'SINGLE'
        ? 'bg-purple-50 text-purple-800 border-purple-200'
        : 'bg-emerald-50 text-emerald-800 border-emerald-200',
      features: service.tasks.map((task) => task.title)
    }));
  const filteredServices = (serviceCategoryFilter === 'ALL'
    ? customerServiceCatalog
    : customerServiceCatalog.filter(s => s.category === serviceCategoryFilter)).sort((a, b) => serviceSort === 'price' ? a.price - b.price : a.name.localeCompare(b.name, 'vi'));

  // Handle buy service
  const handleOpenBuyServiceModal = (svc) => {
    if (!svc || !svc.serviceId) return;
    const targetPlot = customerPlots.find((plot) => plot.id === selectedPlotId) || selectedCheckoutPlot || customerPlots[0];
    if (targetPlot) setCheckoutPlotId(targetPlot.id);
    if (!checkoutDate) setCheckoutDate(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
    setSelectedServiceToBuy(svc);
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
      const data = unwrapData(await apiFetch('/api/services/requests', {
        method: 'POST',
        body: JSON.stringify({
          rentalId: plot.id === 'PLOT-CC-01' ? 1 : plot.id === 'PLOT-MC-02' ? 2 : 3,
          serviceId: 1,
          scheduledDate: new Date().toISOString().slice(0, 10),
          notes: `Yêu cầu chăm sóc khẩn cấp từ cảnh báo IoT cho ${plot.name}`
        })
      }));
      if (data?.requestId) {
        setEmergencyRequests((current) => ({ ...current, [plot.id]: { ...current[plot.id], id: `REQ-${data.requestId}` } }));
      }
    } catch (error) {
      setEmergencyRequests((current) => ({ ...current, [plot.id]: { ...current[plot.id], status: 'ERROR' } }));
    }
  };

  // Fetch existing cultivation service requests from backend to populate active orders
  useEffect(() => {
    apiFetch('/api/services/requests')
      .then(unwrapData)
      .then(requests => {
        if (Array.isArray(requests)) {
          const backendOrders = requests.map(req => ({
            id: `REQ-${req.requestId}`,
            serviceName: req.service?.serviceName || 'Dịch vụ canh tác',
            plotName: req.plotName || (req.rentalId === 1 ? 'Thửa Sen Vàng A1' : req.rentalId === 2 ? 'Thửa Mộc Châu B2' : `Rental #${req.rentalId}`),
            price: `${(Number(req.service?.price) || 0).toLocaleString('vi-VN')} đ`,
            date: req.scheduledDate || 'Hôm nay',
            status: req.status === 'DONE' ? 'COMPLETED' : 'IN_PROGRESS',
            statusLabel: req.status === 'DONE' ? 'Đã hoàn tất' : (req.status === 'ASSIGNED' ? 'Đang thực hiện' : 'Chờ phân công'),
            worker: req.status === 'ASSIGNED' || req.status === 'DONE' ? 'Đã được điều phối' : 'Chưa phân công',
            paymentMethod: 'Đã ghi nhận trên hệ thống'
          }));
          setActiveServiceOrders(backendOrders);
        }
      })
      .catch(() => setActiveServiceOrders([]));
  }, []);

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!selectedServiceToBuy) return;

    // Flow 1: VNPay Payment
    if (checkoutPaymentMethod === 'VNPAY') {
      setShowServiceVnPayModal(true);
      return;
    }

    // Flow 2: Card Payment (Visa, Mastercard, Napas)
    if (checkoutPaymentMethod === 'CARD') {
      setShowServiceCardModal(true);
      return;
    }

    // Flow 3: Farmely Wallet Payment
    if (checkoutPaymentMethod === 'WALLET') {
      setIsProcessingPayment(true);
      try {
        await apiFetch('/api/v1/payments/service/wallet/charge', {
          method: 'POST',
          body: JSON.stringify({
            serviceName: selectedServiceToBuy.name,
            amount: selectedServiceToBuy.price,
            rentalId: selectedCheckoutPlot?.rentalId,
            plotCode: checkoutPlotId,
            scheduledDate: checkoutDate,
            notes: checkoutNotes
          })
        });
      } catch (err) {
        console.warn('Wallet charge backend error:', err);
      } finally {
        setIsProcessingPayment(false);
      }

      handleServicePaymentSuccess({ paymentMethod: 'Ví Farmely', amount: selectedServiceToBuy.price });
    }
  };

  const handleServicePaymentSuccess = async (paidResult) => {
    setShowServiceQrModal(false);
    setShowServiceCardModal(false);
    const selectedPlotObj = customerPlots.find(p => p.id === checkoutPlotId);
    const rentalId = selectedPlotObj?.rentalId;
    if (!rentalId) {
      alert('Không tìm thấy lượt thuê tương ứng trong database.');
      return;
    }
    try {
      const request = unwrapData(await apiFetch('/api/services/requests', {
        method: 'POST',
        body: JSON.stringify({
          rentalId,
          serviceId: selectedServiceToBuy.serviceId,
          scheduledDate: checkoutDate,
          notes: checkoutNotes
        })
      }));
      setActiveServiceOrders((orders) => [{
        id: `REQ-${request.requestId}`,
        serviceName: request.service?.serviceName || selectedServiceToBuy.name,
        plotName: request.plotName || selectedPlotObj?.name || 'Thửa đất đã chọn',
        price: `${Number(request.service?.price || selectedServiceToBuy.price).toLocaleString('vi-VN')} đ`,
        date: request.scheduledDate || checkoutDate,
        status: 'IN_PROGRESS',
        statusLabel: 'Chờ phân công',
        worker: 'Chưa phân công',
        paymentMethod: paidResult?.paymentMethod || checkoutPaymentMethod
      }, ...orders]);
      setSelectedServiceToBuy(null);
    } catch (requestError) {
      alert(`Thanh toán đã hoàn tất nhưng không thể tạo yêu cầu dịch vụ: ${requestError.message}`);
    }
  };

  const currentSelectedPlot = customerPlots.find((p) => p.id === selectedPlotId);
  const diaryFocusPlot = customerPlots.find((p) => p.id === diaryFocusPlotId) || customerPlots[0] || { id: '', name: 'Chưa có dữ liệu', image: '', crop: '—', stationId: '—', temp: '—', soilMoisture: '—', airHumidity: '—', light: '—', mode: 'Self-Growing' };
  const scopedPlot = customerPlots.find((p) => p.id === plotScopeId) || null;
  const scopedPlots = scopedPlot ? [scopedPlot] : customerPlots;
  const scopedServiceOrders = scopedPlot
    ? activeServiceOrders.filter((ord) => ord.plotName === scopedPlot.name)
    : activeServiceOrders;
  const harvestModalPlot = customerPlots.find((p) => p.id === harvestModalPlotId) || null;

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
    setHarvestPlans((prev) => ({ ...prev, [plan.plotId]: plan }));
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
    const requestedView = query.get('view');
    const fromPlotId = query.get('fromPlot');
    const requestedPlot = requestedPlotId && customerPlots.find((plot) => plot.id === requestedPlotId || plot.mapPlotId === requestedPlotId || String(plot.plotId) === requestedPlotId);
    if (requestedPlot) {
      setActiveTab('yards');
      setSelectedPlotId(requestedPlot.id);
      setCheckoutPlotId(requestedPlot.id);
    } else if (['contracts', 'harvest', 'process', 'iot', 'diary', 'tasks', 'services'].includes(requestedView)) {
      setSelectedPlotId(null);
      setActiveTab(requestedView);
      if (requestedView === 'iot') setIotReturnPlotId(fromPlotId || null);
    } else if (!requestedPlotId && !requestedView) {
      setSelectedPlotId(null);
      setActiveTab('yards');
      setIotReturnPlotId(null);
    }
  }, [location.search, customerPlots]);

  const fallbackPlotOperations = {
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
  const fallbackCultivationProcesses = {
    'PLOT-CC-01': [
      { stage: 'Gieo trồng & bén rễ', date: '12/08/2026', guide: 'Giữ ẩm đất 60–70%, kiểm tra cây con mỗi sáng.', status: 'COMPLETED' },
      { stage: 'Sinh trưởng thân lá', date: '25/08/2026', guide: 'Bổ sung dinh dưỡng hữu cơ và tỉa lá già định kỳ.', status: 'COMPLETED' },
      { stage: 'Ra hoa & đậu trái non', date: '10/09/2026', guide: 'Theo dõi sâu bệnh, giữ thông thoáng và tưới vi sinh.', status: 'IN_PROGRESS' },
      { stage: 'Thu hoạch & nghiệm thu', date: '18/11/2026', guide: 'Cân đối chứng, chụp ảnh và đóng thùng QR truy xuất.', status: 'PENDING' }
    ],
    'PLOT-MC-02': [
      { stage: 'Làm đất & gieo hạt', date: '08/09/2026', guide: 'Gieo theo hàng, phủ ẩm nhẹ và tránh úng mặt luống.', status: 'COMPLETED' },
      { stage: 'Cuộn bắp & chăm sóc', date: '20/09/2026', guide: 'Tưới nhẹ buổi sáng, kiểm tra sâu ăn lá bằng mắt thường.', status: 'IN_PROGRESS' },
      { stage: 'Sắp thu hoạch', date: '12/10/2026', guide: 'Ngưng tưới trước thu hoạch theo chỉ số ẩm đất an toàn.', status: 'PENDING' }
    ],
    'PLOT-CG-03': [
      { stage: 'Gieo trồng', date: '18/09/2026', guide: 'Cố định cây con và giữ ẩm đều trong 7 ngày đầu.', status: 'COMPLETED' },
      { stage: 'Leo giàn & đơm hoa', date: '02/10/2026', guide: 'Buộc ngọn định kỳ, kiểm tra bọ trĩ mặt dưới lá.', status: 'IN_PROGRESS' },
      { stage: 'Thu hoạch lứa đầu', date: '28/10/2026', guide: 'Thu hái quả đạt kích thước, tránh làm trầy thân dây.', status: 'PENDING' }
    ]
  };
  const cultivationProcesses = {};
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
  const plotOperations = livePlotOperations;
  const iotAlerts = {};
  const currentPlotOperations = plotOperations[selectedPlotId] || { tasks: [], diary: [] };
  const plotTabFromUrl = new URLSearchParams(location.search).get('tab') || 'overview';

  // Đồng bộ công việc thật từ cultivation-service; dữ liệu tĩnh chỉ là fallback khi API chưa có dữ liệu.
  useEffect(() => {
    let cancelled = false;
    const loadLiveTasks = async () => {
      try {
        const entries = await Promise.all(customerPlots.map(async (plot, index) => {
          const rentalId = index + 1;
          const response = await fetch(`/api/tasks?rentalId=${rentalId}`);
          if (!response.ok) return [plot.id, null];
          const body = await response.json();
          const rows = Array.isArray(body) ? body : (body?.data || []);
          if (!rows.length) return [plot.id, null];
          return [plot.id, {
            tasks: rows.map((task) => ({
              id: task.taskCode || task.id,
              title: task.title || task.name || 'Công việc chăm sóc',
              time: task.dueDate || task.scheduledDate || 'Theo lịch',
              status: task.status || task.displayStatus || 'PENDING',
              owner: task.workerName || 'Farmely điều phối'
            })),
            diary: []
          }];
        }));
        if (!cancelled) setLivePlotOperations(Object.fromEntries(entries.filter(([, value]) => value)));
      } catch {
        // Giữ fallback hiện tại nếu cultivation-service chưa sẵn sàng.
      }
    };
    loadLiveTasks();
    return () => { cancelled = true; };
  }, []);

  const handleSendMessage = (textToSend) => {
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
    setIsAiTyping(false);
    setChatMessages((prev) => [...prev, {
      id: Date.now() + 1,
      sender: 'ai',
      text: 'Trợ lý AI chưa được backend cấu hình. Bạn có thể dùng kênh chuyên gia để nhận tư vấn từ dữ liệu thật.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
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
            ['Lịch canh tác', Calendar, 'tasks'],
            ['Dịch vụ canh tác', ShoppingBag, 'services'],
            ['Nhật ký nông trại', BookOpen, 'diary'],
            ['Quy trình canh tác chuẩn', ClipboardList, 'process'],
            ['Kết quả thu hoạch & nghiệm thu', Apple, 'harvest']
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
            {dashboardDataError && (
              <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {dashboardDataError}
              </div>
            )}
            
            {/* ============================================================== */}
            {/* VIEW A: CHI TIẾT DASHBOARD QUẢN LÝ 1 THỬA ĐẤT CỤ THỂ         */}
            {/* ============================================================== */}
            {selectedPlotId && !currentSelectedPlot && (
              <div className="rounded-2xl border border-brand-border bg-white p-8 text-center text-sm font-bold text-brand-muted">
                Đang tải thông tin thửa đất…
              </div>
            )}
            {selectedPlotId && currentSelectedPlot && (
              <CustomerPlotWorkspace
                plot={currentSelectedPlot}
                plots={customerPlots}
                operations={currentPlotOperations}
                iotData={iotDatasets[currentSelectedPlot.id]}
                alerts={iotAlerts[currentSelectedPlot.id] || []}
                stages={cultivationProcesses[currentSelectedPlot.id] || []}
                services={customerServiceCatalog}
                serviceOrders={activeServiceOrders.filter((o) => o.plotName === currentSelectedPlot.name)}
                harvestPlan={harvestPlans[currentSelectedPlot.id] || null}
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
            {!selectedPlotId && scopedPlot && ['tasks', 'diary', 'services'].includes(activeTab) && (
              <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <button type="button" onClick={backToScopedPlot} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
                    <ArrowLeft className="h-4 w-4" />Quay lại thửa
                  </button>
                  <img src={scopedPlot.image} alt="" className="hidden h-10 w-14 shrink-0 rounded-lg object-cover sm:block" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-brand-dark">
                      {scopedPlot.name}
                      <span className="font-normal text-brand-muted"> / {activeTab === 'diary' ? 'Nhật ký' : activeTab === 'tasks' ? 'Lịch canh tác' : 'Dịch vụ'}</span>
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
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="text-2xl font-black text-slate-900">✅ Việc cần làm</h2><div className="mt-2 divide-y divide-slate-100">{(livePlotOperations[customerPlots[0]?.id]?.tasks || []).map((task) => <button key={task.id} type="button" onClick={() => setSelectedPlotId(customerPlots[0]?.id)} className="flex w-full items-center gap-3 py-3 text-left"><span className="text-xl">{task.status === 'COMPLETED' ? '✅' : '🌱'}</span><span className="min-w-0 flex-1"><span className="block truncate font-bold text-slate-800">{task.title}</span><span className="block text-xs text-slate-500">{customerPlots[0]?.name}</span></span><span className="whitespace-nowrap rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-500">{task.time}</span></button>)}</div></div>
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
              const openTasksAll = customerPlots.reduce((n, p) => n + (plotOperations[p.id]?.tasks || []).filter((t) => t.status !== 'COMPLETED').length, 0);
              const highAlertsAll = customerPlots.reduce((n, p) => n + (iotAlerts[p.id] || []).filter((a) => a.level === 'HIGH').length, 0);
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
                    ['Thửa đang canh tác', customerPlots.length, 'text-[#18352b]'],
                    ['Việc chưa xong', openTasksAll, 'text-amber-700'],
                    ['Cảnh báo cao', highAlertsAll, highAlertsAll ? 'text-rose-700' : 'text-[#18352b]']
                  ].map(([label, value, tone]) => (
                    <div key={label} className="rounded-2xl border border-stone-200/80 bg-white p-3 shadow-sm sm:p-4">
                      <dt className="text-xs text-stone-500">{label}</dt>
                      <dd className={`mt-1 text-2xl font-bold ${tone}`}>{value}</dd>
                    </div>
                  ))}
                </dl>

                {/* Mobile không có sidebar: lối vào các trang xem chung tất cả thửa */}
                <nav aria-label="Xem theo tất cả thửa" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar lg:hidden">
                  {[['tasks', 'Lịch canh tác', Calendar], ['services', 'Dịch vụ', ShoppingBag], ['diary', 'Nhật ký', BookOpen], ['process', 'Quy trình', ClipboardList], ['harvest', 'Nghiệm thu', Apple]].map(([id, label, Icon]) => (
                    <button key={id} type="button" onClick={() => navigate(`/customer/dashboard?view=${id}`)} className="flex shrink-0 items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm">
                      <Icon className="h-4 w-4 text-emerald-700" />{label}
                    </button>
                  ))}
                </nav>

                <section aria-labelledby="my-plots-heading">
                  <h2 id="my-plots-heading" className="mb-3 font-heading text-lg font-bold text-[#18352b]">Thửa đất của bạn</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {customerPlots.map((plot) => {
                      const tasks = plotOperations[plot.id]?.tasks || [];
                      const nextTask = tasks.find((t) => t.status === 'IN_PROGRESS') || tasks.find((t) => t.status === 'PENDING');
                      const openCount = tasks.filter((t) => t.status !== 'COMPLETED').length;
                      const topAlert = (iotAlerts[plot.id] || []).find((a) => a.level === 'HIGH');
                      const daysLeft = Math.max(plot.totalDays - plot.currentDay, 0);
                      return (
                        <article key={plot.id} className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                          <button type="button" onClick={() => openPlot(plot.id)} className="relative block h-40 w-full overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-400" aria-label={`Mở ${plot.name}`}>
                            <img src={plot.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                            <span className="absolute inset-0 bg-gradient-to-t from-[#0f2a20]/90 via-[#0f2a20]/30 to-transparent" />
                            <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-[#18352b]">{plot.mode === 'Self-Growing' ? 'Tự canh tác' : 'Farmely chăm sóc'}</span>
                            {topAlert && <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-0.5 text-[11px] font-semibold text-white"><Flame className="h-3 w-3" />Cảnh báo</span>}
                            <span className="absolute inset-x-3 bottom-3 text-white">
                              <span className="block font-heading text-lg font-bold leading-tight">{plot.name}</span>
                              <span className="mt-0.5 flex items-center gap-1 text-xs text-white/80"><MapPin className="h-3.5 w-3.5" />{plot.location} · {plot.area}</span>
                            </span>
                          </button>

                          <div className="flex flex-1 flex-col gap-3 p-4">
                            <div>
                              <div className="flex items-center justify-between gap-2 text-sm">
                                <span className="flex min-w-0 items-center gap-1.5 font-semibold text-[#18352b]"><Sprout className="h-4 w-4 shrink-0 text-emerald-600" /><span className="truncate">{plot.crop}</span></span>
                                <span className="shrink-0 text-xs text-stone-500">{daysLeft > 0 ? `Còn ${daysLeft} ngày` : 'Đến vụ'}</span>
                              </div>
                              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${plot.progressPercent}%` }} /></div>
                              <p className="mt-1 text-xs text-stone-500">{plot.stage}</p>
                            </div>

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
                              <button type="button" onClick={() => openPlot(plot.id, 'tasks')} className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-left text-xs text-amber-900 hover:bg-amber-100">
                                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span className="min-w-0"><span className="block truncate font-semibold">{nextTask.title}</span><span className="opacity-80">{nextTask.time}</span></span>
                              </button>
                            ) : null}

                            <div className="mt-auto flex items-center gap-2 pt-1">
                              <button type="button" onClick={() => openPlot(plot.id)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#18352b] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f2a20]">
                                Mở thửa<ChevronRight className="h-4 w-4" />
                              </button>
                              {[['tasks', Calendar, 'Công việc'], ['iot', Radio, 'IoT'], ['diary', BookOpen, 'Nhật ký']].map(([tab, Icon, label]) => (
                                <button key={tab} type="button" onClick={() => openPlot(plot.id, tab)} aria-label={`${label} của ${plot.name}`} title={label} className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 text-stone-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800">
                                  <Icon className="h-4 w-4" />
                                  {tab === 'tasks' && openCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">{openCount}</span>}
                                </button>
                              ))}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              </div>
              );
            })()}

            {activeTab === 'tasks' && !selectedPlotId && (
              <div className="mx-auto max-w-5xl space-y-5 rounded-3xl border border-brand-border bg-white p-5 shadow-sm sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><p className="text-xs font-bold uppercase tracking-widest text-brand-green">Lịch canh tác</p><h2 className="mt-1 font-heading text-2xl font-black text-brand-dark">Việc cần làm hôm nay</h2><p className="mt-1 text-sm text-brand-muted">Theo dõi lịch chăm sóc và người phụ trách từng thửa.</p></div>
                  <button type="button" onClick={() => setActiveTab('services')} className="rounded-xl bg-brand-yellow px-4 py-2 text-xs font-black text-brand-dark hover:brightness-95"><ShoppingBag className="mr-1 inline h-4 w-4" />Đặt dịch vụ</button>
                </div>
                <div className="space-y-4">
                  {scopedPlots.map((plot) => {
                    const tasks = livePlotOperations[plot.id]?.tasks || [];
                    return (
                      <section key={plot.id} className="overflow-hidden rounded-2xl border border-brand-border bg-brand-cream/25">
                        <div className="flex flex-wrap items-center gap-3 border-b border-brand-border bg-white px-4 py-3">
                          <img src={plot.image} alt="" className="h-11 w-14 rounded-xl object-cover" />
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-heading text-base font-black text-brand-dark">{plot.name}</h3>
                            <p className="truncate text-xs text-brand-muted">{plot.crop} · {plot.id}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${plot.mode === 'Self-Growing' ? 'bg-emerald-100 text-emerald-800' : 'bg-lime-100 text-lime-800'}`}>
                            {plot.mode === 'Self-Growing' ? 'Tự trồng' : 'Farmely chăm sóc'}
                          </span>
                        </div>
                        <div className="grid gap-2 p-3 md:grid-cols-2">
                          {tasks.map((task) => (
                            <button key={task.id} type="button" onClick={() => { setTaskPhotoPreview(''); setSelectedTaskDetail({ ...task, plot }); }} className="flex items-center gap-3 rounded-xl border border-brand-border bg-white p-3 text-left transition hover:border-brand-green hover:shadow-sm">
                              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{task.status === 'COMPLETED' ? <Check className="h-4 w-4" /> : <Clock className="h-4 w-4" />}</span>
                              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-brand-dark">{task.title}</span><span className="mt-0.5 block truncate text-xs text-brand-muted">{task.owner}</span></span>
                              <span className="whitespace-nowrap text-[11px] font-bold text-brand-green">{task.time}</span>
                            </button>
                          ))}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </div>
            )}

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

                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-2">
                    <select value={serviceSort} onChange={(e) => setServiceSort(e.target.value)} className="rounded-xl border border-brand-border bg-white px-3.5 py-2 text-xs font-bold text-brand-dark">
                      <option value="name">Sắp xếp: Tên A–Z</option>
                      <option value="price">Sắp xếp: Giá thấp đến cao</option>
                    </select>
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
                {servicesLoading && masterServices.length === 0 && (
                  <div className="rounded-2xl border border-brand-border bg-white p-8 text-center text-sm font-bold text-brand-muted">
                    Đang tải danh mục dịch vụ từ database…
                  </div>
                )}
                {servicesError && (
                  <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
                    <span>Không thể tải dịch vụ: {servicesError}</span>
                    <button type="button" onClick={() => loadServices(true).catch(() => {})} className="underline">Thử lại</button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredServices.length === 0 && (
                    <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-dashed border-brand-border bg-white p-8 text-center text-sm font-semibold text-brand-muted">
                      Chưa có dữ liệu dịch vụ từ hệ thống.
                    </div>
                  )}
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
                              <span className="text-xs text-brand-muted">/ {svc.unit}</span>
                            </div>
                          </div>

                          <p className="text-xs text-stone-600 leading-relaxed">
                            {svc.description}
                          </p>

                          {svc.features.length > 0 && (
                            <div className="pt-2 border-t border-brand-border/60 space-y-1.5">
                              {svc.features.map((feat, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-[11px] text-stone-600">
                                  <Check className="w-3.5 h-3.5 text-brand-green shrink-0 mt-0.5" />
                                  <span>{feat}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-brand-border/60">
                          <button
                            type="button"
                            onClick={() => svc.active && handleOpenBuyServiceModal(svc)}
                            disabled={!svc.active}
                            className="w-full py-2.5 px-4 rounded-xl bg-brand-yellow hover:bg-[#ffc83b] text-brand-dark font-heading font-black text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>{svc.active ? 'MUA DỊCH VỤ NGAY' : 'TẠM NGƯNG ĐẶT'}</span>
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
                              ord.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
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
              <div className="space-y-6">
                
                {/* Top Control Bar: Select Plot + Timeframe Switcher */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-brand-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <button type="button" onClick={() => { if (iotReturnPlotId) { navigate(`/customer/dashboard?plot=${iotReturnPlotId}`); } else { navigate('/customer/dashboard'); } }} className="mb-3 flex items-center gap-1.5 text-xs font-black text-brand-green hover:underline"><ArrowLeft className="h-4 w-4" />Quay lại {iotReturnPlotId ? 'chi tiết thửa' : 'tổng quan'}</button>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-brand-cream text-brand-green border border-brand-border mb-2">
                      <Radio className="w-3.5 h-3.5 text-brand-green" />
                      <span>Trạm Quan Trắc IoT Không Dây</span>
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
            )}

            {/* TAB 4: QUY TRÌNH CANH TÁC CHUẨN */}
            {activeTab === 'process' && !selectedPlotId && (
              <div className="space-y-5 rounded-3xl border border-brand-border bg-white p-5 shadow-sm sm:p-7">
                <div><p className="text-xs font-bold uppercase tracking-widest text-brand-green">Quy trình VietGAP</p><h2 className="mt-1 font-heading text-2xl font-black text-brand-dark">Quy trình canh tác chuẩn</h2><p className="mt-1 text-sm text-brand-muted">Hướng dẫn và tiến độ được Farmely thiết lập cho từng thửa. Khách hàng chỉ có quyền xem.</p></div>
                <div className="space-y-4">
                  {customerPlots.length === 0 && <div className="rounded-2xl border border-dashed border-brand-border bg-brand-cream/30 p-8 text-center text-sm font-semibold text-brand-muted">Chưa có dữ liệu quy trình từ hệ thống.</div>}
                  {customerPlots.map((plot) => <section key={plot.id} className="overflow-hidden rounded-2xl border border-brand-border bg-brand-cream/25"><div className="flex items-center gap-3 border-b border-brand-border bg-white p-4"><img src={plot.image} alt="" className="h-12 w-16 rounded-xl object-cover" /><div className="min-w-0 flex-1"><h3 className="truncate font-heading font-black text-brand-dark">{plot.name}</h3><p className="truncate text-xs text-brand-muted">{plot.crop} · {plot.mode === 'Self-Growing' ? 'Tự trồng' : 'Farmely chăm sóc'}</p></div><span className="rounded-full bg-stone-100 px-3 py-1 text-[10px] font-bold text-stone-600">Chỉ xem</span></div><div className="grid gap-3 p-4 lg:grid-cols-2">{(cultivationProcesses[plot.id] || []).map((step, index) => <article key={`${plot.id}-${step.stage}`} className="relative rounded-xl border border-brand-border bg-white p-4"><div className="flex items-start gap-3"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${step.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : step.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500'}`}>{step.status === 'COMPLETED' ? '✓' : index + 1}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-bold text-brand-dark">{step.stage}</h4><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${step.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : step.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700' : 'bg-stone-100 text-stone-600'}`}>{step.status === 'COMPLETED' ? 'Đã hoàn tất' : step.status === 'IN_PROGRESS' ? 'Đang thực hiện' : 'Sắp tới'}</span></div><p className="mt-1 text-xs font-semibold text-brand-green">Ngày thực hiện: {step.date}</p><p className="mt-2 text-xs leading-relaxed text-stone-600">{step.guide}</p></div></div></article>)}</div></section>)}
                </div>
              </div>
            )}

            {/* TAB 5: NHẬT KÝ CANH TÁC */}
            {activeTab === 'diary' && !selectedPlotId && (
              <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
                <div className="space-y-3">
                  {scopedPlots.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-brand-border bg-white p-8 text-center text-sm font-semibold text-brand-muted">
                      Chưa có dữ liệu nhật ký từ hệ thống.
                    </div>
                  ) : scopedPlots.map((plot) => (
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
                        {(livePlotOperations[plot.id]?.diary || []).map((entry, index) => (
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

                {customerPlots.length > 0 && <aside className="sticky top-24 rounded-3xl border border-brand-border bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <img src={diaryFocusPlot.image} alt="" className="h-14 w-20 rounded-xl object-cover" />
                    <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">IoT theo thửa</p><h3 className="truncate font-heading text-lg font-black text-brand-dark">{diaryFocusPlot.name}</h3><p className="truncate text-xs text-brand-muted">{diaryFocusPlot.stationId}</p></div>
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
                </aside>}
              </div>
            )}

            {/* TAB 5: THU HOẠCH & NGHIỆM THU */}
            {activeTab === 'harvest' && !selectedPlotId && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-heading font-black text-xl text-brand-dark">
                      Kết Quả Thu Hoạch & Nghiệm Thu Nông Sản
                    </h3>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Minh bạch cân điện tử, đối chứng sản lượng và đặt lịch giao rau sạch tận nhà.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-brand-border bg-brand-cream p-5">
                  <p className="text-sm font-semibold text-brand-muted">Chưa có dữ liệu thu hoạch từ hệ thống.</p>
                </div>
                {false && <div className="grid gap-4 rounded-2xl border border-brand-border bg-brand-cream p-4 sm:grid-cols-[160px_minmax(0,1fr)] sm:p-5">
                  <img src="/images/Mucangchai3.jpg" alt="Ảnh cân đối chứng" className="h-32 w-full rounded-xl object-cover sm:h-full" />
                  <div className="space-y-3 text-xs">
                    <div className="flex flex-wrap justify-between gap-2"><span className="font-bold text-brand-dark text-sm">Đợt thu hoạch gần nhất: Cà chua bi Cherry</span><span className="text-emerald-700 font-black text-base">12.5 kg</span></div>
                    <p className="text-stone-600">Thu hoạch ngày 02/10. Ảnh cân đối chứng và thông tin đóng thùng QR đã được lưu trong hồ sơ nghiệm thu.</p>
                    <div className="flex flex-wrap gap-2"><span className="rounded-full bg-white px-3 py-1 font-bold text-stone-600">Ảnh minh chứng đã lưu</span><span className={`rounded-full px-3 py-1 font-bold ${harvestAcceptance.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{harvestAcceptance.status === 'CONFIRMED' ? `Đã xác nhận · ${harvestAcceptance.deliveryMethod === 'FARM' ? 'Nhận tại nông trại' : 'Giao tận nhà'}` : 'Chờ khách xác nhận'}</span></div>
                  </div>
                </div>}
              </div>
            )}

            {/* TAB 6: HỢP ĐỒNG THUÊ ĐẤT */}
            {activeTab === 'contracts' && !selectedPlotId && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-6">
                <div>
                  <h3 className="font-heading font-black text-xl text-brand-dark">
                    Lịch Sử Hợp Đồng Thuê Thửa Đất
                  </h3>
                  <p className="text-xs text-brand-muted mt-0.5">
                    Quản lý thời hạn thuê, gia hạn hợp đồng hoặc gửi yêu cầu hoàn hủy theo quy định.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-brand-border space-y-3 text-xs bg-white">
                  <div className="flex justify-between items-center pb-3 border-b border-brand-border/60">
                    <span className="font-mono font-bold text-brand-green text-sm">CTR-2026-FARM-9912</span>
                    <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Đang hiệu lực
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-stone-600">
                    <p>Thửa đất: <strong className="text-brand-dark">Sen Vàng A1 (PLOT-CC-01)</strong></p>
                    <p>Thời hạn: <strong className="text-brand-dark">03 Tháng (Còn 42 ngày)</strong></p>
                    <p>Chế độ: <strong className="text-brand-dark">Assisted-growing</strong></p>
                    <p>Tổng phí: <strong className="text-brand-dark">3.600.000 đ</strong></p>
                    <p>Chuyên gia phụ trách: <strong className="text-emerald-800">ThS. Nguyễn Hoàng Nam</strong></p>
                    <p>Công nhân trực tiếp: <strong className="text-amber-800">Trần Văn Lực (Tổ trưởng CVLĐ)</strong></p>
                  </div>
                  <div className="pt-3 flex gap-3">
                    <Button variant="outline" size="sm" onClick={() => setShowRenewContractModal(true)}>
                      Gia hạn hợp đồng (Renew)
                    </Button>
                    <button
                      onClick={() => alert('Yêu cầu hủy hợp đồng và hoàn tiền đã được gửi đến ban quản trị Farmely.')}
                      className="text-xs text-rose-600 hover:underline font-bold self-center cursor-pointer"
                    >
                      Yêu cầu hủy & hoàn tiền
                    </button>
                  </div>
                </div>
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
                    onClick={() => setChatMessages([])}
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
                        {msg.text}
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
        isOpen={Boolean(selectedServiceToBuy) && !showServiceQrModal && !showServiceCardModal}
        onClose={() => setSelectedServiceToBuy(null)}
        title="Thanh Toán Dịch Vụ Canh Tác"
        subtitle={selectedServiceToBuy?.name}
        maxWidth="max-w-xl"
      >
        {selectedServiceToBuy && (
          <form onSubmit={handleConfirmPayment} className="space-y-4 text-left text-xs">
            {/* Price Banner */}
            <div className="p-4 rounded-2xl bg-brand-cream border border-brand-border flex items-center justify-between">
              <div>
                <span className="text-[11px] text-brand-muted block font-medium">Gói dịch vụ:</span>
                <span className="font-heading font-black text-sm sm:text-base text-brand-dark">
                  {selectedServiceToBuy.name}
                </span>
                <span className="text-[11px] text-stone-500 block mt-0.5">{selectedServiceToBuy.unit}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-brand-muted block font-medium">Tổng thanh toán:</span>
                <span className="font-heading font-black text-xl text-brand-green">
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
                onChange={(e) => setCheckoutPlotId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-brand-border bg-white text-xs font-medium focus:ring-2 focus:ring-brand-green/20"
              >
                {customerPlots.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id}) • {p.crop}
                  </option>
                ))}
              </select>
              {selectedCheckoutPlot && (
                <div className="mt-2.5 flex items-center gap-3 rounded-xl border border-brand-border bg-brand-cream/60 p-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-brand-green" aria-hidden="true">
                    <Sprout className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-brand-dark">{selectedCheckoutPlot.location}</p>
                    <p className="mt-0.5 text-brand-muted">
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
                className="w-full p-2.5 rounded-xl border border-brand-border bg-white text-xs font-medium focus:ring-2 focus:ring-brand-green/20"
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
                className="w-full p-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-green/20"
              />
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 pt-1">
              <label className="block font-bold text-brand-dark">
                Phương thức thanh toán: <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                  checkoutPaymentMethod === 'VNPAY'
                    ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                    : 'border-brand-border bg-white hover:bg-stone-50'
                }`}>
                  <input
                    type="radio"
                    name="paymethod"
                    checked={checkoutPaymentMethod === 'VNPAY'}
                    onChange={() => setCheckoutPaymentMethod('VNPAY')}
                    className="text-blue-600 focus:ring-blue-600"
                  />
                  <div className="min-w-0">
                    <span className="font-bold text-brand-dark block text-xs">Cổng Thanh Toán VNPAY</span>
                    <span className="text-[10px] text-blue-700 block font-semibold">VNPAY-QR & Thẻ ATM</span>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                  checkoutPaymentMethod === 'CARD'
                    ? 'border-brand-green bg-emerald-50/60 ring-1 ring-brand-green'
                    : 'border-brand-border bg-white hover:bg-stone-50'
                }`}>
                  <input
                    type="radio"
                    name="paymethod"
                    checked={checkoutPaymentMethod === 'CARD'}
                    onChange={() => setCheckoutPaymentMethod('CARD')}
                    className="text-brand-green focus:ring-brand-green"
                  />
                  <div className="min-w-0">
                    <span className="font-bold text-brand-dark block text-xs">Thẻ Quốc Tế / Nội Địa</span>
                    <span className="text-[10px] text-stone-500 block">Visa, Mastercard, Napas</span>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                  checkoutPaymentMethod === 'WALLET'
                    ? 'border-brand-green bg-emerald-50/60 ring-1 ring-brand-green'
                    : 'border-brand-border bg-white hover:bg-stone-50'
                }`}>
                  <input
                    type="radio"
                    name="paymethod"
                    checked={checkoutPaymentMethod === 'WALLET'}
                    onChange={() => setCheckoutPaymentMethod('WALLET')}
                    className="text-brand-green focus:ring-brand-green"
                  />
                  <div className="min-w-0">
                    <span className="font-bold text-brand-dark block text-xs">Ví Nông Trại Farmely</span>
                    <span className="text-[10px] text-emerald-700 block font-bold">Số dư: 2.450.000 đ</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Preview Prompt */}
            {checkoutPaymentMethod === 'VNPAY' && (
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center gap-3 text-xs">
                <div className="w-12 h-12 bg-white rounded-lg border border-blue-300 flex items-center justify-center shrink-0 text-blue-700">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-bold text-brand-dark">Cổng thanh toán VNPAY</p>
                  <p className="text-[11px] text-stone-500">Hỗ trợ quét mã VNPAY-QR, Thẻ ATM NCB test mode và thẻ quốc tế Visa/Mastercard với xác thực SHA-512.</p>
                </div>
              </div>
            )}

            {checkoutPaymentMethod === 'CARD' && (
              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 flex items-center gap-3 text-xs">
                <div className="w-12 h-12 bg-white rounded-lg border border-emerald-300 flex items-center justify-center shrink-0 text-emerald-700">
                  <CreditCard className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-bold text-brand-dark">Thanh toán thẻ bảo mật PCI-DSS</p>
                  <p className="text-[11px] text-stone-500">Pop-up giao diện thẻ ảo 3D trực quan, hỗ trợ Visa, Mastercard và ATM Napas nội địa.</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-brand-border/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedServiceToBuy(null)}
              >
                HỦY
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={isProcessingPayment}
                className="font-bold tracking-wider uppercase text-xs"
              >
                XÁC NHẬN THANH TOÁN ({selectedServiceToBuy.formattedPrice})
              </Button>
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
        }}
        title="Đăng Ký Dịch Vụ Thành Công!"
      >
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h4 className="font-heading text-lg font-bold text-brand-dark">
              Đăng Ký Dịch Vụ Thành Công!
            </h4>
            <p className="text-sm font-medium text-stone-600 mt-1">
              Dịch vụ canh tác đã được kích hoạt thành công
            </p>
            <span className="text-[11px] text-emerald-600 mt-1 block font-medium">
              (Tự động đóng sau 3 giây...)
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-brand-cream text-left text-xs space-y-1 border border-brand-border">
            <p><strong>Gói dịch vụ:</strong> {selectedServiceToBuy?.name}</p>
            <p><strong>Thửa đất:</strong> {customerPlots.find(p => p.id === checkoutPlotId)?.name}</p>
            <p><strong>Ngày thực hiện:</strong> {checkoutDate}</p>
            <p><strong>Phương thức:</strong> {checkoutPaymentMethod === 'VIETQR' ? 'Chuyển khoản VietQR' : 'Ví Farmely'}</p>
          </div>
          <Button
            variant="primary"
            className="w-full font-bold"
            onClick={() => {
              setShowCheckoutSuccessModal(false);
              setSelectedServiceToBuy(null);
            }}
          >
            ĐÃ HIỂU VÀ ĐÓNG
          </Button>
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
              {customerPlots.filter((p) => p.mode === 'Self-Growing').map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id}) • {p.mode}
                </option>
              ))}
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
              onClick={() => {
                alert('Đã lưu nhật ký Farm Diary thành công!');
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

      {/* Modal: Accept Harvest */}
      <Modal
        isOpen={showHarvestAcceptModal}
        onClose={() => setShowHarvestAcceptModal(false)}
        title="Nghiệm Thu Sản Lượng Vụ Mùa"
        subtitle="Đối chứng cân điện tử và xác nhận nhận rau sạch"
      >
        <div className="space-y-4 text-left text-xs">
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
            <p className="font-bold">✓ Sản lượng thực tế: 12.5 kg Cà chua bi Cherry F1</p>
            <p>Đã chụp ảnh cân đối chứng tại trạm đóng gói Củ Chi.</p>
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">Phương thức nhận nông sản:</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-brand-border bg-white cursor-pointer">
                <input type="radio" name="deliver" checked={harvestDeliveryMethod === 'DELIVERY'} onChange={() => setHarvestDeliveryMethod('DELIVERY')} />
                <span>Đóng thùng bảo quản và giao tận nhà</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-brand-border bg-white cursor-pointer">
                <input type="radio" name="deliver" checked={harvestDeliveryMethod === 'FARM'} onChange={() => setHarvestDeliveryMethod('FARM')} />
                <span>Tôi sẽ tự đến nông trại nhận vào cuối tuần này</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowHarvestAcceptModal(false)}>
              HỦY
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setHarvestAcceptance({ status: 'CONFIRMED', confirmedAt: new Date().toISOString(), deliveryMethod: harvestDeliveryMethod });
                setShowHarvestAcceptModal(false);
              }}
            >
              XÁC NHẬN NGHIỆM THU
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Renew Contract */}
      <Modal
        isOpen={showRenewContractModal}
        onClose={() => setShowRenewContractModal(false)}
        title="Gia Hạn Hợp Đồng Thuê Thửa Đất"
        subtitle="Thửa Sen Vàng A1 (PLOT-CC-01)"
      >
        <div className="space-y-4 text-left text-xs">
          <div>
            <label className="block font-bold text-brand-dark mb-1">Thời Gian Gia Hạn Tiếp Theo:</label>
            <select className="w-full p-2.5 rounded-xl border border-brand-border bg-white text-xs">
              <option>Gia hạn thêm 03 Tháng (Ưu đãi giảm 5%)</option>
              <option>Gia hạn thêm 06 Tháng (Ưu đãi giảm 10%)</option>
              <option>Gia hạn thêm 12 Tháng (Ưu đãi giảm 15%)</option>
            </select>
          </div>

          <div className="p-3 rounded-xl bg-brand-cream border border-brand-border text-stone-600 space-y-1">
            <p>• Tiếp tục duy trì quyền ưu tiên canh tác trên thửa đất hiện tại.</p>
            <p>• Tặng thêm 01 bộ phân bón vi sinh VietGAP cho chu kỳ mới.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowRenewContractModal(false)}>
              HỦY
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                alert('Đã gửi yêu cầu gia hạn hợp đồng thành công!');
                setShowRenewContractModal(false);
              }}
            >
              XÁC NHẬN GIA HẠN
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cultivation Service VNPay Pop-up Modal */}
      <VnPayModal
        isOpen={showServiceVnPayModal}
        onClose={() => setShowServiceVnPayModal(false)}
        plotInfo={customerPlots.find(p => p.id === checkoutPlotId)}
        serviceInfo={selectedServiceToBuy}
        totalAmount={selectedServiceToBuy?.price}
        additionalPayload={{
          rentalId: Math.max(1, customerPlots.findIndex(p => p.id === checkoutPlotId) + 1),
          serviceId: selectedServiceToBuy?.id,
          serviceName: selectedServiceToBuy?.name,
          plotCode: checkoutPlotId,
          scheduledDate: checkoutDate,
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
        chargeEndpoint="/api/v1/payments/service/card/charge"
        additionalPayload={{
          serviceName: selectedServiceToBuy?.name,
          serviceId: selectedServiceToBuy?.id,
          rentalId: Math.max(1, customerPlots.findIndex(p => p.id === checkoutPlotId) + 1),
          plotCode: checkoutPlotId,
          scheduledDate: checkoutDate,
          notes: checkoutNotes
        }}
        onPaymentSuccess={handleServicePaymentSuccess}
      />

    </div>
  );
}
