import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import { useAuthStore } from '../../stores/authStore';
import { useServiceStore } from '../../stores/serviceStore';
import DashboardRail from '../../components/dashboard/DashboardRail';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import FloatingExpertChat from '../../components/customer/FloatingExpertChat';
import { useRealtimeChat } from '../../hooks/useRealtimeChat';
import { DEMO_CUSTOMERS } from '../../api/communication/chatStorage';
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
  Wheat,
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
  Tag
} from 'lucide-react';

export default function CustomerDashboard() {
  const { user } = useAuthStore();
  const { services: masterServices } = useServiceStore();
  const [activeTab, setActiveTab] = useState('yards');
  const [selectedPlotId, setSelectedPlotId] = useState(null);
  const [showExpertChatModal, setShowExpertChatModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
  const [selectedServiceToBuy, setSelectedServiceToBuy] = useState(null);
  const [checkoutPlotId, setCheckoutPlotId] = useState('PLOT-CC-01');
  const [checkoutDate, setCheckoutDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState('VIETQR');
  const [showCheckoutSuccessModal, setShowCheckoutSuccessModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Modals for Other Screen Flows
  const [showNewDiaryModal, setShowNewDiaryModal] = useState(false);
  const [showHarvestAcceptModal, setShowHarvestAcceptModal] = useState(false);
  const [showRenewContractModal, setShowRenewContractModal] = useState(false);

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
      text: 'Chào bạn! Vào thời điểm này tại vùng phụ cận Củ Chi, khí hậu rất mát mẻ (28°C). Các loại rau ăn lá như Xà lách Romaine, Rau dền đỏ hoặc Cà chua bi F1 sẽ phát triển cực nhanh, chỉ sau 25-35 ngày là bạn có thể nghiệm thu giỏ rau sạch đầu tiên!',
      time: '08:16 AM'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Sample Customer Rented Plots Data
  const customerPlots = [
    {
      id: 'PLOT-CC-01',
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

  // IoT Data for Different Timeframes (Hourly, Daily, Weekly)
  const iotDatasets = {
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
  };

  const currentIotData = (iotDatasets[selectedIotPlotId] || iotDatasets['PLOT-CC-01'])[iotTimeframe];
  const currentIotPlot = customerPlots.find(p => p.id === selectedIotPlotId) || customerPlots[0];

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
  const [activeServiceOrders, setActiveServiceOrders] = useState([
    {
      id: 'REQ-8829',
      serviceName: 'Dịch vụ nhổ cỏ & làm tơi đất',
      plotName: 'Thửa Mộc Châu B2',
      price: '50.000 đ',
      date: 'Hôm nay • 09:00 AM',
      status: 'IN_PROGRESS',
      statusLabel: 'Đang thực hiện',
      worker: 'Nguyễn Văn Hưng (CVLĐ)',
      paymentMethod: 'Chuyển khoản VietQR'
    },
    {
      id: 'REQ-8815',
      serviceName: 'Gói chăm sóc định kỳ tuần (7 ngày)',
      plotName: 'Thửa Sen Vàng A1',
      price: '150.000 đ',
      date: '02/10/2026',
      status: 'COMPLETED',
      statusLabel: 'Đã hoàn tất',
      worker: 'Trần Văn Lực (CVLĐ)',
      paymentMethod: 'Ví Farmely'
    }
  ]);

  const serviceIconMap = { calendar: Calendar, layers: Layers, sprout: Sprout };
  const customerServiceCatalog = masterServices
    .filter((service) => service.active)
    .map((service) => ({
      ...service,
      category: service.customerCategory,
      formattedPrice: `${service.price.toLocaleString('vi-VN')} đ`,
      icon: serviceIconMap[service.iconKey] || Sprout,
      color: service.customerCategory === 'SINGLE'
        ? 'bg-purple-50 text-purple-800 border-purple-200'
        : 'bg-emerald-50 text-emerald-800 border-emerald-200',
      features: service.tasks.map((task) => task.title)
    }));
  const filteredServices = serviceCategoryFilter === 'ALL'
    ? customerServiceCatalog
    : customerServiceCatalog.filter(s => s.category === serviceCategoryFilter);

  // Handle buy service
  const handleOpenBuyServiceModal = (svc) => {
    setSelectedServiceToBuy(svc);
  };

  const handleConfirmPayment = (e) => {
    e.preventDefault();
    if (!selectedServiceToBuy) return;

    setIsProcessingPayment(true);
    setTimeout(() => {
      const selectedPlotObj = customerPlots.find(p => p.id === checkoutPlotId);
      const newOrder = {
        id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
        serviceName: selectedServiceToBuy.name,
        plotName: selectedPlotObj ? selectedPlotObj.name : 'Thửa đất đã chọn',
        price: selectedServiceToBuy.formattedPrice,
        date: `${checkoutDate} • Mới tạo`,
        status: 'IN_PROGRESS',
        statusLabel: 'Đang thực hiện',
        worker: 'Đang điều phối CVLĐ',
        paymentMethod: checkoutPaymentMethod === 'VIETQR' ? 'Chuyển khoản VietQR' : 'Ví Farmely'
      };

      setActiveServiceOrders(prev => [newOrder, ...prev]);
      setIsProcessingPayment(false);
      setShowCheckoutSuccessModal(true);
    }, 700);
  };

  const currentSelectedPlot = customerPlots.find((p) => p.id === selectedPlotId);
  const plotOperations = {
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
  const currentPlotOperations = plotOperations[selectedPlotId] || { tasks: [], diary: [] };

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
    setIsAiTyping(true);

    setTimeout(() => {
      let reply = 'Farmely AI đã ghi nhận câu hỏi của bạn. ';
      const lower = query.toLowerCase();

      if (lower.includes('độ ẩm') || lower.includes('tưới')) {
        reply = 'Hiện tại trạm IoT ghi nhận độ ẩm đất tại các thửa đất của bạn đang ở ngưỡng tối ưu (60-75%). Theo quy chuẩn tưới thông minh BR18, luống đất hiện tại đủ ẩm và hệ thống đã tự động hoãn lịch tưới sáng nay để tránh ngập úng rễ!';
      } else if (lower.includes('thu hoạch') || lower.includes('khi nào')) {
        reply = 'Luống Xà lách Romaine tại Thửa Mộc Châu B2 hiện đã đạt 24 ngày tuổi, dự kiến vào ngày 12 tới đây sẽ đạt chuẩn thu hoạch 300g/cây. Bạn có thể chọn tự đến hái vào cuối tuần hoặc yêu cầu Farmely cắt đóng thùng giao tươi tận nhà!';
      } else if (lower.includes('dịch vụ') || lower.includes('thuê') || lower.includes('bón phân')) {
        reply = 'Bạn có thể vào tab "Dịch vụ canh tác" để đặt các gói chăm sóc trọn vụ, gói theo tuần hoặc các dịch vụ lẻ như bón phân, nhổ cỏ. Hệ thống hỗ trợ thanh toán trực tiếp cực kỳ nhanh chóng!';
      } else {
        reply = `Hệ thống ghi nhận thửa đất của bạn đang ở trạng thái sinh trưởng rất tốt. Trợ lý AI và Chuyên gia Nông nghiệp Farmely luôn đồng hành 24/7 để hỗ trợ bạn tối đa!`;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsAiTyping(false);
    }, 700);
  };

  const navMenuItems = [
    {
      id: 'yards',
      label: 'Thửa Đất Của Tôi',
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
      label: 'Dữ Liệu Vi Khí Hậu IoT',
      desc: 'Biểu đồ trạm đo theo giờ, ngày, tuần',
      icon: Radio
    },
    {
      id: 'diary',
      label: 'Nhật Ký Canh Tác',
      desc: 'Farm Diary & minh chứng ca trực',
      icon: BookOpen,
      badge: 'Mới'
    },
    {
      id: 'harvest',
      label: 'Sản Lượng Thu Hoạch',
      desc: 'Nghiệm thu rau & giao tận nhà',
      icon: Apple
    },
    {
      id: 'contracts',
      label: 'Hợp Đồng Thuê Đất',
      desc: 'Thời hạn, quyền lợi & gia hạn',
      icon: FileText
    },
    {
      id: 'ai',
      label: 'Trợ Lý Nông Nghiệp AI',
      desc: 'Hỏi đáp kỹ thuật trồng VietGAP',
      icon: Bot,
      isAi: true
    }
  ];

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col font-sans overflow-x-hidden">
      {/* 1. Top Navbar giữ nguyên theo toàn bộ website */}
      <PublicNavbar />

      {/* 2. Main Page Container mở rộng tối đa (max-w-[1720px]) ăn khớp với Navbar */}
      <div className="box-border flex-1 pt-24 sm:pt-28 pb-16 max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-10 w-full space-y-6">
        
        {/* 3. Layout with Left Sidebar + Right Content */}
        <div className="flex flex-col lg:flex-row gap-6 items-start min-w-0">
          
          {/* ================= LEFT SIDEBAR ================= */}
          <DashboardRail
            user={user}
            fallbackName="Lô Thái Quyền"
            roleLabel="Khách hàng"
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            footer={<div className="text-xs"><p className="font-bold text-brand-dark">Hỗ trợ kỹ thuật 24/7</p><p className="mt-1 font-heading font-black text-brand-green">1900 688 889</p></div>}
          >
            <div className="space-y-1">
              <p className={`px-3 py-2 text-[11px] font-bold text-brand-muted uppercase tracking-wider ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
                Chức Năng Quản Lý
              </p>

              {navMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id && !selectedPlotId;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSelectedPlotId(null);
                    }}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`relative group w-full text-left px-3.5 py-3 rounded-xl transition-all flex items-center justify-between text-xs cursor-pointer ${sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''} ${
                      isActive
                        ? 'bg-brand-green text-white shadow-md font-bold'
                        : 'text-stone-700 hover:bg-brand-cream/80 hover:text-brand-dark font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive
                            ? 'text-brand-yellow'
                            : item.isAi
                            ? 'text-purple-600'
                            : 'text-brand-green'
                        }`}
                      />
                      <span className={sidebarCollapsed ? 'lg:hidden' : ''}>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`${sidebarCollapsed ? 'lg:hidden' : ''} px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-brand-cream text-brand-green border border-brand-border'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {sidebarCollapsed && <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-brand-dark px-3 py-2 text-xs font-bold text-white shadow-lg group-hover:lg:block">{item.label}</span>}
                  </button>
                );
              })}
            </div>

          </DashboardRail>

          {/* ================= RIGHT MAIN CONTENT ================= */}
          <main className="flex-1 min-w-0 w-full space-y-6">
            
            {/* Quick Stat Summary Cards */}
            {false && !selectedPlotId && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-brand-border shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between text-xs text-brand-muted mb-1">
                    <span className="font-semibold">Thửa đang canh tác</span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-brand-green">
                      <Sprout className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black font-heading text-brand-dark">{customerPlots.length} Thửa</div>
                  <div className="text-[11px] text-brand-green font-medium mt-0.5">✓ Sinh trưởng đều đặn</div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-brand-border shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between text-xs text-brand-muted mb-1">
                    <span className="font-semibold">Chuỗi ngày mùa vụ</span>
                    <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                      <Flame className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black font-heading text-brand-dark">14 Ngày</div>
                  <div className="text-[11px] text-stone-500 font-medium mt-0.5">Cập nhật sáng nay</div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-brand-border shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between text-xs text-brand-muted mb-1">
                    <span className="font-semibold">Sắp đến ngày hái</span>
                    <div className="w-7 h-7 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600">
                      <Wheat className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black font-heading text-brand-dark">01 Luống</div>
                  <div className="text-[11px] text-amber-600 font-medium mt-0.5">Xà lách Romaine (3 ngày)</div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-brand-border shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between text-xs text-brand-muted mb-1">
                    <span className="font-semibold">Sản lượng đã nhận</span>
                    <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500">
                      <Apple className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black font-heading text-brand-dark">24.5 kg</div>
                  <div className="text-[11px] text-stone-500 font-medium mt-0.5">VietGAP đã kiểm định</div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW A: CHI TIẾT DASHBOARD QUẢN LÝ 1 THỬA ĐẤT CỤ THỂ         */}
            {/* ============================================================== */}
            {selectedPlotId && currentSelectedPlot ? (
              <div className="space-y-6 animate-fadeIn">
                
                {/* Back button & Breadcrumb Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border/60">
                  <button
                    onClick={() => setSelectedPlotId(null)}
                    className="inline-flex items-center gap-2 text-xs font-bold text-brand-green hover:underline cursor-pointer group"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span>Quay lại danh sách tất cả thửa đất</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-brand-yellow text-brand-dark">
                      {currentSelectedPlot.id}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-green text-white">
                      {currentSelectedPlot.mode}
                    </span>
                  </div>
                </div>

                {/* Plot Header Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-brand-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <img
                      src={currentSelectedPlot.image}
                      alt={currentSelectedPlot.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-brand-border shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h2 className="font-heading font-black text-xl sm:text-2xl text-brand-dark">
                          {currentSelectedPlot.name}
                        </h2>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Đang sinh trưởng
                        </span>
                      </div>
                      <p className="text-xs text-brand-muted flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-brand-green" />
                        <span>{currentSelectedPlot.location} • Diện tích: {currentSelectedPlot.area}</span>
                      </p>
                      <p className="text-xs text-stone-600 pt-1">
                        Cây trồng: <strong className="text-brand-dark font-bold">{currentSelectedPlot.crop}</strong> • Giai đoạn: <span className="text-emerald-700 font-semibold">{currentSelectedPlot.stage}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowNewDiaryModal(true)}
                      className="gap-1.5 text-xs font-bold"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Thêm nhật ký</span>
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setCheckoutPlotId(currentSelectedPlot.id);
                        setActiveTab('services');
                        setSelectedPlotId(null);
                      }}
                      className="gap-1.5 text-xs font-bold"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Đặt dịch vụ chăm sóc</span>
                    </Button>
                  </div>
                </div>

                {/* 4 Overview Mini Cards for This Plot */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-white border border-brand-border shadow-sm space-y-1">
                    <span className="text-[11px] text-brand-muted block font-medium">Tiến độ mùa vụ</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl sm:text-2xl font-black font-heading text-brand-green">
                        Ngày {currentSelectedPlot.currentDay}
                      </span>
                      <span className="text-xs text-stone-500 font-semibold">/ {currentSelectedPlot.totalDays} ngày</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden mt-2">
                      <div
                        className="bg-brand-green h-2 rounded-full transition-all duration-500"
                        style={{ width: `${currentSelectedPlot.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-brand-border shadow-sm space-y-1">
                    <span className="text-[11px] text-brand-muted block font-medium">Dự kiến thu hoạch</span>
                    <div className="text-xl sm:text-2xl font-black font-heading text-brand-dark">
                      {currentSelectedPlot.expectedHarvestDate}
                    </div>
                    <p className="text-[11px] text-amber-700 font-medium">
                      Ước lượng: {currentSelectedPlot.expectedYield}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-brand-border shadow-sm space-y-1">
                    <span className="text-[11px] text-brand-muted block font-medium">Trực ban chăm sóc</span>
                    <div className="text-sm sm:text-base font-black font-heading text-brand-dark truncate">
                      {currentSelectedPlot.worker}
                    </div>
                    <p className="text-[11px] text-brand-green font-medium">
                      ✓ Đạt chuẩn VietGAP
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-brand-border shadow-sm space-y-1">
                    <span className="text-[11px] text-brand-muted block font-medium">Hợp đồng điện tử</span>
                    <div className="text-sm sm:text-base font-black font-mono text-brand-green">
                      {currentSelectedPlot.contractCode}
                    </div>
                    <p className="text-[11px] text-stone-500 font-medium">
                      Thời hạn: Còn 42 ngày
                    </p>
                  </div>
                </div>

                {/* Tasks and diary belong to the selected plot */}
                <div className="grid gap-4 xl:grid-cols-2">
                  <section className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3 border-b border-brand-border/60 pb-3">
                      <div>
                        <h3 className="font-heading text-lg font-black text-brand-dark">Công việc của thửa</h3>
                        <p className="text-xs text-brand-muted">Đang làm gì, ai thực hiện và hạn hoàn thành.</p>
                      </div>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">{currentPlotOperations.tasks.filter((task) => task.status !== 'COMPLETED').length} việc mở</span>
                    </div>
                    <div className="space-y-2">
                      {currentPlotOperations.tasks.map((task) => (
                        <div key={task.id} className="flex items-start gap-3 rounded-xl border border-brand-border bg-brand-cream/35 p-3">
                          <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : task.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500'}`}>
                            {task.status === 'COMPLETED' ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-bold text-brand-dark">{task.title}</p>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : task.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-600'}`}>{task.status === 'COMPLETED' ? 'Đã xong' : task.status === 'IN_PROGRESS' ? 'Đang làm' : 'Chờ làm'}</span>
                            </div>
                            <p className="mt-1 text-[11px] text-brand-muted">{task.id} • {task.owner} • {task.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3 border-b border-brand-border/60 pb-3">
                      <div>
                        <h3 className="font-heading text-lg font-black text-brand-dark">Nhật ký riêng của thửa</h3>
                        <p className="text-xs text-brand-muted">Minh chứng chăm sóc và cập nhật kỹ thuật gần nhất.</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setShowNewDiaryModal(true)}>Thêm nhật ký</Button>
                    </div>
                    <div className="space-y-4">
                      {currentPlotOperations.diary.map((entry, index) => (
                        <div key={`${entry.time}-${index}`} className="relative border-l-2 border-emerald-200 pl-4">
                          <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-emerald-500" />
                          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">{entry.time}</p>
                          <p className="mt-1 font-bold text-brand-dark">{entry.title}</p>
                          <p className="mt-1 text-xs leading-relaxed text-stone-600">{entry.note}</p>
                          <p className="mt-1 text-[10px] font-semibold text-brand-green">Cập nhật bởi {entry.author}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Section 1: IoT Telemetry & 24h Real-time Sensor Charts (No Warnings) */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-brand-border shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-border/60 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Radio className="w-5 h-5 text-brand-green animate-pulse" />
                        <h3 className="font-heading font-black text-lg text-brand-dark">
                          Giám Sát Vi Khí Hậu IoT • Trạm {currentSelectedPlot.stationId}
                        </h3>
                      </div>
                      <p className="text-xs text-brand-muted mt-0.5">
                        Dữ liệu cảm biến vi khí hậu thời gian thực, đồng bộ liên tục từ nông trại.
                      </p>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>TRỰC TIẾP ONLINE</span>
                    </span>
                  </div>

                  {/* 4 Sensor Metric Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-brand-cream/60 border border-brand-border text-center space-y-1">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-brand-muted">
                        <Thermometer className="w-4 h-4 text-rose-500" />
                        <span>Nhiệt độ khí</span>
                      </div>
                      <div className="text-2xl font-black font-heading text-brand-dark">
                        {currentSelectedPlot.temp}
                      </div>
                      <span className="text-[10px] text-emerald-600 font-bold block">Ổn định</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-brand-cream/60 border border-brand-border text-center space-y-1">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-brand-muted">
                        <Droplets className="w-4 h-4 text-emerald-600" />
                        <span>Độ ẩm đất</span>
                      </div>
                      <div className="text-2xl font-black font-heading text-emerald-600">
                        {currentSelectedPlot.soilMoisture}
                      </div>
                      <span className="text-[10px] text-emerald-600 font-bold block">Tối ưu (60-75%)</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-brand-cream/60 border border-brand-border text-center space-y-1">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-brand-muted">
                        <Activity className="w-4 h-4 text-sky-500" />
                        <span>Độ ẩm không khí</span>
                      </div>
                      <div className="text-2xl font-black font-heading text-brand-dark">
                        {currentSelectedPlot.airHumidity}
                      </div>
                      <span className="text-[10px] text-stone-500 font-bold block">Ổn định</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-brand-cream/60 border border-brand-border text-center space-y-1">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-brand-muted">
                        <Sun className="w-4 h-4 text-amber-500" />
                        <span>Cường độ sáng</span>
                      </div>
                      <div className="text-2xl font-black font-heading text-brand-dark">
                        {currentSelectedPlot.light}
                      </div>
                      <span className="text-[10px] text-amber-600 font-bold block">Đầy đủ quang hợp</span>
                    </div>
                  </div>

                  {/* Realtime 24h Sensor Chart (Recharts) */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-brand-dark">Biểu Đồ Diễn Biến Nhiệt Độ & Độ Ẩm Đất (24 Giờ Qua)</span>
                      <div className="flex items-center gap-4 text-[11px]">
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

                    <div className="h-64 w-full bg-stone-50/70 p-3 rounded-2xl border border-stone-200">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={iotDatasets[currentSelectedPlot.id]?.hourly || iotDatasets['PLOT-CC-01'].hourly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                            </linearGradient>
                            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
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
                          <Area type="monotone" dataKey="moisture" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMoisture)" name="Độ ẩm đất (%)" />
                          <Area type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTemp)" name="Nhiệt độ (°C)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Section 2: Đội Ngũ Nhân Sự Phụ Trách Thửa Đất */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-brand-border shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border/60 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-brand-green" />
                        <h3 className="font-heading font-black text-lg text-brand-dark">
                          Đội Ngũ Nhân Sự Phụ Trách Thửa Đất
                        </h3>
                      </div>
                      <p className="text-xs text-brand-muted mt-0.5">
                        Nhân sự được phân công đồng hành cố định xuyên suốt mùa vụ canh tác của bạn.
                      </p>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setShowExpertChatModal(true);
                      }}
                      className="gap-2 text-xs font-bold shadow-sm"
                    >
                      <MessageSquare className="w-4 h-4 text-brand-yellow" />
                      <span>Nhắn tin tư vấn với Chuyên gia</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Agricultural Expert */}
                    <div className="p-4 rounded-2xl bg-brand-cream/60 border border-brand-border flex items-start gap-3.5">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                        alt="Chuyên gia"
                        className="w-12 h-12 rounded-xl object-cover border border-brand-border shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-black text-sm text-brand-dark">
                            ThS. Nguyễn Hoàng Nam
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Chuyên gia trưởng
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 mt-0.5">
                          Viện Nông nghiệp Công nghệ cao • Giám sát VietGAP, kiểm soát độ ẩm và phác đồ dinh dưỡng thửa đất.
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] text-emerald-700 font-bold">Đang online trực tuyến</span>
                        </div>
                      </div>
                    </div>

                    {/* Field Worker */}
                    <div className="p-4 rounded-2xl bg-brand-cream/60 border border-brand-border flex items-start gap-3.5">
                      <img
                        src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"
                        alt="Công nhân"
                        className="w-12 h-12 rounded-xl object-cover border border-brand-border shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-black text-sm text-brand-dark">
                            {currentSelectedPlot.worker}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Tổ trưởng CVLĐ
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 mt-0.5">
                          Trực tiếp thực hiện tưới ẩm 2 ca/ngày, nhổ cỏ tỉa cành và cập nhật ảnh chụp thực tế vào Farm Diary.
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="text-[10px] text-amber-700 font-bold">Ca trực hôm nay: Hoàn tất 100%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : null}

            {/* ============================================================== */}
            {/* VIEW B: DANH SÁCH TẤT CẢ THỬA ĐẤT (COMPACT GRID)              */}
            {/* ============================================================== */}
            {activeTab === 'yards' && !selectedPlotId && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="font-heading text-xl sm:text-2xl font-black text-brand-dark">
                      Danh Sách Thửa Đất Đang Canh Tác ({customerPlots.length})
                    </h2>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Bấm vào bất kỳ thửa đất nào để mở <strong>Bảng điều khiển quản lý chi tiết (IoT, quy trình, nhật ký)</strong>.
                    </p>
                  </div>
                  <Link
                    to="/marketplace"
                    className="text-xs sm:text-sm font-bold text-brand-green hover:underline flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <span>Khám phá thêm thửa đất</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Compact 3-Column Responsive Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {customerPlots.map((plot) => (
                    <div
                      key={plot.id}
                      onClick={() => setSelectedPlotId(plot.id)}
                      className="bg-white rounded-2xl p-4 sm:p-5 border border-brand-border shadow-sm space-y-3 hover:shadow-md hover:border-brand-green/40 transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        {/* Compact Image */}
                        <div className="relative h-40 rounded-xl overflow-hidden bg-black/10">
                          <img
                            src={plot.image}
                            alt={plot.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-brand-yellow text-brand-dark shadow-sm">
                            {plot.id}
                          </span>
                          <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-green text-white shadow-sm">
                            {plot.mode}
                          </span>
                        </div>

                        {/* Title & Location */}
                        <div>
                          <h3 className="font-heading font-black text-base text-brand-dark group-hover:text-brand-green transition-colors flex items-center justify-between">
                            <span>{plot.name}</span>
                            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-brand-green group-hover:translate-x-1 transition-all" />
                          </h3>
                          <p className="text-xs text-brand-muted flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-brand-green shrink-0" />
                            <span className="truncate">{plot.location} • {plot.area}</span>
                          </p>
                        </div>

                        {/* Progress */}
                        <div className="p-3 rounded-xl bg-brand-cream/60 border border-brand-border/70 space-y-1.5 text-xs">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-bold text-brand-dark truncate flex items-center gap-1">
                              <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="truncate">{plot.crop}</span>
                            </span>
                            <span className="font-bold text-brand-green shrink-0">
                              Ngày {plot.currentDay}/{plot.totalDays}
                            </span>
                          </div>
                          <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-brand-green h-1.5 rounded-full"
                              style={{ width: `${plot.progressPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Assigned Personnel */}
                        <div className="flex items-center justify-between text-[11px] px-2 py-1.5 rounded-xl bg-stone-50 border border-stone-100">
                          <span className="text-stone-600 font-medium flex items-center gap-1 truncate">
                            <UserCheck className="w-3.5 h-3.5 text-brand-green shrink-0" />
                            <span>ThS. Nam</span>
                          </span>
                          <span className="text-amber-800 font-bold text-[10px] truncate max-w-[130px] shrink-0">
                            {plot.worker}
                          </span>
                        </div>

                        {/* Compact IoT Telemetry */}
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-1.5 rounded-lg bg-stone-50 border border-stone-100">
                            <span className="text-[10px] text-stone-400 block font-medium">Nhiệt độ</span>
                            <span className="font-bold text-brand-dark text-xs">{plot.temp}</span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-stone-50 border border-stone-100">
                            <span className="text-[10px] text-stone-400 block font-medium">Độ ẩm đất</span>
                            <span className="font-bold text-emerald-600 text-xs">{plot.soilMoisture}</span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-stone-50 border border-stone-100">
                            <span className="text-[10px] text-stone-400 block font-medium">Trạm IoT</span>
                            <span className="font-bold text-brand-dark text-[11px] truncate block">{plot.stationId}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button: Opens Plot Management Dashboard */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlotId(plot.id);
                          }}
                          className="w-full py-2.5 px-3 rounded-xl bg-brand-green hover:bg-brand-dark text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Activity className="w-3.5 h-3.5 text-brand-yellow" />
                          <span>QUẢN LÝ & GIÁM SÁT IOT</span>
                        </button>
                      </div>
                    </div>
                  ))}
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
                        Lịch Sử Dịch Vụ Đã Đăng Ký ({activeServiceOrders.length})
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
                    {activeServiceOrders.map((ord) => (
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

            {/* TAB 4: NHẬT KÝ CANH TÁC */}
            {activeTab === 'diary' && !selectedPlotId && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-heading font-black text-xl text-brand-dark">
                      Nhật Ký Canh Tác Toàn Vườn (Farm Diary)
                    </h3>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Minh chứng ca trực thực tế của công nhân và hình ảnh nhật ký từ bạn trên tất cả các thửa đất.
                    </p>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => setShowNewDiaryModal(true)}>
                    + Viết nhật ký mới
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-brand-cream/60 border border-brand-border space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-brand-dark">Hôm nay • 08:30 AM (Ca sáng)</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Công nhân: Trần Văn Lực (CVLĐ)
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed">
                      Đã hoàn thành kiểm tra độ ẩm đất tại Thửa Sen Vàng A1. Tiến hành nhổ cỏ rãnh và bổ sung nước tưới vi sinh đợt 3 theo đúng lịch trình của Chuyên gia Nam.
                    </p>
                    <div className="flex gap-4 items-center pt-1">
                      <img
                        src="/images/Mucangchai3.jpg"
                        alt="Ảnh minh chứng"
                        className="w-24 h-20 rounded-xl object-cover border border-brand-border shadow-sm"
                      />
                      <div className="text-xs text-stone-500">
                        <p className="font-bold text-brand-dark">📍 Thửa Sen Vàng A1 (PLOT-CC-01)</p>
                        <p className="text-emerald-700 font-medium">✓ Đạt kiểm duyệt ảnh hiện trường VietGAP</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-brand-cream/60 border border-brand-border space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-brand-dark">Hôm qua • 16:15 PM</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        Khách hàng: {user?.fullName || 'Lô Thái Quyền'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed">
                      Lên thăm vườn Mộc Châu cuối tuần. Xà lách Romaine phát triển xanh mướt, lá cuộn tròn dày và không có sâu bệnh. Đã tỉa bớt lá già phía dưới.
                    </p>
                    <div className="flex gap-4 items-center pt-1">
                      <img
                        src="/images/moc-chau-2811.jpg"
                        alt="Ảnh minh chứng vườn"
                        className="w-24 h-20 rounded-xl object-cover border border-brand-border shadow-sm"
                      />
                      <div className="text-xs text-stone-500">
                        <p className="font-bold text-brand-dark">📍 Thửa Mộc Châu B2 (PLOT-MC-02)</p>
                        <p className="text-brand-green font-medium">✓ Tự chăm sóc (Self-growing)</p>
                      </div>
                    </div>
                  </div>
                </div>
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
                  <Button variant="primary" size="sm" onClick={() => setShowHarvestAcceptModal(true)}>
                    Xác nhận nghiệm thu vụ mùa
                  </Button>
                </div>

                <div className="p-5 rounded-2xl bg-brand-cream border border-brand-border space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-brand-dark text-sm">Đợt thu hoạch gần nhất: Cà chua bi Cherry</span>
                    <span className="text-emerald-700 font-black text-base">12.5 kg</span>
                  </div>
                  <p className="text-stone-600">
                    Thu hoạch ngày 02/10. Sản lượng đã được đóng thùng có mã QR truy xuất nguồn gốc và giao tới địa chỉ nhà bạn.
                  </p>
                </div>
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
                    Quản lý thời hạn thuê, gia hạn hợp đồng hoặc yêu cầu hoàn cọc theo chính sách BR10.
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
                      onClick={() => alert('Yêu cầu hủy hợp đồng và hoàn tiền theo BR10 đã được gửi đến ban quản trị Farmely.')}
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

            <FloatingExpertChat
              isOpen={showExpertChatModal}
              onOpen={() => setShowExpertChatModal(true)}
              onClose={() => setShowExpertChatModal(false)}
              thread={customerChatThread}
              senderName={activeCustomerSenderName}
              input={customerChatInput}
              setInput={setCustomerChatInput}
              onSubmit={handleSendCustomerChat}
              scrollRef={customerChatScrollRef}
            />

          </main>

        </div>

      </div>

      {/* ================= MODALS ================= */}

      {/* MODAL 1: CHECKOUT / BUY SERVICE (Thanh Toán Dịch Vụ Canh Tác) */}
      <Modal
        isOpen={Boolean(selectedServiceToBuy)}
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
                    {p.name} ({p.id}) • {p.crop} ({p.location})
                  </option>
                ))}
              </select>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                  checkoutPaymentMethod === 'VIETQR'
                    ? 'border-brand-green bg-emerald-50/60 ring-1 ring-brand-green'
                    : 'border-brand-border bg-white hover:bg-stone-50'
                }`}>
                  <input
                    type="radio"
                    name="paymethod"
                    checked={checkoutPaymentMethod === 'VIETQR'}
                    onChange={() => setCheckoutPaymentMethod('VIETQR')}
                    className="text-brand-green focus:ring-brand-green"
                  />
                  <div className="min-w-0">
                    <span className="font-bold text-brand-dark block text-xs">Chuyển khoản VietQR</span>
                    <span className="text-[10px] text-stone-500 block">Quét mã QR tự động 24/7</span>
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

            {/* QR Mockup Preview if VIETQR */}
            {checkoutPaymentMethod === 'VIETQR' && (
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center gap-3 text-xs">
                <div className="w-12 h-12 bg-white rounded-lg border border-stone-300 flex items-center justify-center shrink-0">
                  <QrCode className="w-8 h-8 text-brand-dark" />
                </div>
                <div>
                  <p className="font-bold text-brand-dark">Mã VietQR động tự động xác nhận</p>
                  <p className="text-[11px] text-stone-500">Hệ thống tự động kích hoạt dịch vụ ngay khi ngân hàng báo có.</p>
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
              Đã Nhận Yêu Cầu Dịch Vụ!
            </h4>
            <p className="text-sm text-stone-600 mt-1">
              Thanh toán thành công. Đội ngũ chuyên viên lao động tại nông trại đã nhận việc và sẽ thực hiện đúng hẹn theo quy trình chuẩn VietGAP.
            </p>
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
              value={selectedPlotId || 'PLOT-CC-01'}
              onChange={(e) => setSelectedPlotId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-brand-border bg-white text-xs"
            >
              {customerPlots.map(p => (
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
                <input type="radio" name="deliver" defaultChecked />
                <span>Đóng thùng bảo quản và giao hỏa tốc đến địa chỉ nhà tôi</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-brand-border bg-white cursor-pointer">
                <input type="radio" name="deliver" />
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
                alert('Xác nhận nghiệm thu thành công! Đơn vị vận chuyển sẽ sớm giao rau tươi cho bạn.');
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
        title="Gia Hạn Hợp Đồng Thuê Đất"
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
            <p>• Tiếp tục duy trì quyền ưu tiên canh tác trên luống đất hiện tại.</p>
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

      {/* Footer */}
      <Footer />
    </div>
  );
}
