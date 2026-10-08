import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CustomerNavbar from '../../components/layout/CustomerNavbar';
import Footer from '../../components/layout/Footer';
import { useAuthStore } from '../../stores/authStore';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import {
  Sprout,
  Camera,
  PlusCircle,
  BookOpen,
  Star,
  Flame,
  Wheat,
  Apple,
  Users,
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
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Activity,
  Maximize2,
  FileText,
  CreditCard,
  MapPin,
  RefreshCw
} from 'lucide-react';

export default function CustomerDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('yards');

  // Modals for Screen Flow
  const [showNewDiaryModal, setShowNewDiaryModal] = useState(false);
  const [showServiceRequestModal, setShowServiceRequestModal] = useState(false);
  const [showRapidCareModal, setShowRapidCareModal] = useState(false);
  const [showHarvestAcceptModal, setShowHarvestAcceptModal] = useState(false);
  const [showRenewContractModal, setShowRenewContractModal] = useState(false);

  // Form states
  const [diaryNote, setDiaryNote] = useState('');
  const [serviceType, setServiceType] = useState('WEEDING');
  const [serviceNotes, setServiceNotes] = useState('');
  const [serviceSuccessMsg, setServiceSuccessMsg] = useState('');

  // AI Chatbot state
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'user',
      text: 'What should I plant this time of year?',
      time: '08:15 AM'
    },
    {
      id: 2,
      sender: 'ai',
      text: 'Chào bạn Quyền! Vào thời điểm này tại vùng phụ cận Củ Chi và Mộc Châu, khí hậu rất mát mẻ (28°C). Các loại rau ăn lá như Xà lách Romaine, Rau dền đỏ hoặc Cà chua bi F1 sẽ phát triển cực nhanh, chỉ sau 25-35 ngày là bạn có thể nghiệm thu giỏ rau sạch đầu tiên!',
      time: '08:16 AM'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

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
        reply = 'Hiện tại trạm IoT-CC-01 ghi nhận độ ẩm đất tại Thửa Sen Vàng A1 là 68% (ngưỡng tối ưu 60-75%). Theo quy chuẩn tưới thông minh BR18, luống đất hiện tại đủ ẩm và hệ thống đã tự động hoãn lịch tưới sáng nay để tránh ngập úng rễ cà chua bi!';
      } else if (lower.includes('thu hoạch') || lower.includes('khi nào')) {
        reply = 'Luống Xà lách Romaine tại Thửa Mộc Châu B2 hiện đã đạt 24 ngày tuổi, dự kiến vào ngày 12 tới đây sẽ đạt chuẩn thu hoạch 300g/cây. Bạn có thể chọn tự đến hái vào cuối tuần hoặc yêu cầu Farmely cắt đóng thùng giao tươi tận nhà!';
      } else if (lower.includes('sâu') || lower.includes('bệnh') || lower.includes('vietgap')) {
        reply = 'Theo quy trình VietGAP khép kín, tuyệt đối không dùng thuốc hóa học. Nếu phát hiện sâu vẽ bùa hoặc rầy, công nhân sẽ phun dung dịch thảo mộc tỏi ớt lên men vi sinh và bắt sâu thủ công, đồng thời gửi ảnh đối chứng qua Farm Diary!';
      } else {
        reply = `Cảm ơn bạn Quyền! Hệ thống ghi nhận thửa đất của bạn đang ở trạng thái sinh trưởng rất tốt. Trợ lý AI và Chuyên gia Nông nghiệp Farmely luôn đồng hành 24/7 để hỗ trợ bạn tối đa!`;
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
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F5F2E9] flex flex-col font-sans">
      {/* Logged-in Customer Navbar */}
      <CustomerNavbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="flex-1 pt-24 pb-16 max-w-[1720px] mx-auto px-4 sm:px-8 w-full space-y-6">
        
        {/* TOP GREETING & WEATHER BANNER (Matching reference screenshot) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-600">
            <span>⛅ Overcast, 28°C / 82°F</span>
            <span>•</span>
            <span className="text-[#426B4F] font-bold">💧 Great day for gardening! (Thời tiết lý tưởng cho canh tác rau sạch)</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-heading text-3xl sm:text-5xl font-black text-[#294C3B] tracking-tight">
                Good morning, <span className="text-[#658B38]">{user?.fullName || 'Lô Thái Quyền'}</span>
              </h1>
              <p className="text-sm text-stone-600 mt-1">
                You have <strong className="text-[#294C3B]">2 active plantings</strong> across your yards. (Bạn có 2 thửa đất đang sinh trưởng xanh tốt).
              </p>
            </div>

            {/* Quick Action Buttons (matching screenshot) */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setShowNewDiaryModal(true)}
                className="px-4 py-2 rounded-xl bg-[#658B38] text-white hover:bg-[#52742c] font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
              >
                <Camera className="w-4 h-4" />
                <span>Photo Entry</span>
              </button>

              <Link to="/marketplace">
                <button className="px-4 py-2 rounded-xl bg-white border border-[#294C3B]/20 text-[#294C3B] hover:bg-stone-50 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm">
                  <PlusCircle className="w-4 h-4 text-[#658B38]" />
                  <span>+ Add Yard</span>
                </button>
              </Link>

              <button
                onClick={() => setActiveTab('diary')}
                className="px-4 py-2 rounded-xl bg-white/70 border border-[#294C3B]/10 text-stone-700 hover:bg-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
              >
                <BookOpen className="w-4 h-4 text-[#426B4F]" />
                <span>Journal</span>
              </button>
            </div>
          </div>
        </div>

        {/* STAT PILLS ROW (Matching reference screenshot exactly) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          {/* Pill 1: Seedling XP */}
          <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F5CF62] text-brand-dark flex items-center justify-center font-black text-sm shrink-0">
              <Star className="w-5 h-5 fill-brand-dark text-brand-dark" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-brand-dark truncate">Seedling</p>
              <p className="text-[10px] text-stone-500">85 / 100 XP</p>
            </div>
          </div>

          {/* Pill 2: Streak */}
          <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <p className="font-heading font-black text-lg text-brand-dark leading-tight">14</p>
              <p className="text-[10px] text-stone-500 font-medium">Day Streak</p>
            </div>
          </div>

          {/* Pill 3: Total Plantings */}
          <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <p className="font-heading font-black text-lg text-brand-dark leading-tight">4</p>
              <p className="text-[10px] text-stone-500 font-medium">Total Plantings</p>
            </div>
          </div>

          {/* Pill 4: Ready to Harvest */}
          <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-50 text-amber-600 flex items-center justify-center shrink-0">
              <Wheat className="w-5 h-5" />
            </div>
            <div>
              <p className="font-heading font-black text-lg text-brand-dark leading-tight">1</p>
              <p className="text-[10px] text-stone-500 font-medium">Ready to Harvest</p>
            </div>
          </div>

          {/* Pill 5: Harvests This Season */}
          <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Apple className="w-5 h-5" />
            </div>
            <div>
              <p className="font-heading font-black text-lg text-brand-dark leading-tight">24.5 kg</p>
              <p className="text-[10px] text-stone-500 font-medium">Season Harvest</p>
            </div>
          </div>

          {/* Pill 6: My Yards */}
          <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="font-heading font-black text-lg text-brand-dark leading-tight">2</p>
              <p className="text-[10px] text-stone-500 font-medium">Rented Yards</p>
            </div>
          </div>

        </div>

        {/* MAIN 2-COLUMN SECTION: Yards/Screen Flow on Left, Chatbot on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: My Yards & Screen Flow Views (7-8 cols) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            
            {/* Tab navigation pills for the Screen Flow */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
              <button
                onClick={() => setActiveTab('yards')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === 'yards'
                    ? 'bg-[#294C3B] text-white shadow-sm'
                    : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
                }`}
              >
                🌱 Thửa Đất Của Tôi (My Yards)
              </button>

              <button
                onClick={() => setActiveTab('diary')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === 'diary'
                    ? 'bg-[#294C3B] text-white shadow-sm'
                    : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
                }`}
              >
                📖 Nhật Ký (Farm Diary)
              </button>

              <button
                onClick={() => setActiveTab('services')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === 'services'
                    ? 'bg-[#294C3B] text-white shadow-sm'
                    : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
                }`}
              >
                📋 Yêu Cầu Dịch Vụ (Service Requests)
              </button>

              <button
                onClick={() => setActiveTab('alerts')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === 'alerts'
                    ? 'bg-[#294C3B] text-white shadow-sm'
                    : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
                }`}
              >
                ⚡ Cảnh Báo IoT (Rapid Care)
              </button>

              <button
                onClick={() => setActiveTab('harvest')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === 'harvest'
                    ? 'bg-[#294C3B] text-white shadow-sm'
                    : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
                }`}
              >
                🧺 Thu Hoạch (Harvest Results)
              </button>

              <button
                onClick={() => setActiveTab('contracts')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === 'contracts'
                    ? 'bg-[#294C3B] text-white shadow-sm'
                    : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
                }`}
              >
                📜 Hợp Đồng (Contract History)
              </button>
            </div>

            {/* TAB 1: MY YARDS */}
            {activeTab === 'yards' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-xl font-black text-[#294C3B]">
                    My Yards (Thửa Đất Đang Canh Tác)
                  </h2>
                  <Link
                    to="/marketplace"
                    className="text-xs font-bold text-[#658B38] hover:underline flex items-center gap-1"
                  >
                    <span>Thuê thêm thửa mới</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* Yard 1: Thửa Sen Vàng A1 */}
                  <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                    <div className="relative h-44 rounded-2xl overflow-hidden bg-black/10">
                      <img
                        src="https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=800&q=80"
                        alt="Thửa Sen Vàng A1"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-brand-yellow text-brand-dark">
                        PLOT-CC-01
                      </span>
                      <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#294C3B] text-white">
                        Assisted-Growing
                      </span>
                    </div>

                    <div>
                      <h3 className="font-heading font-black text-lg text-brand-dark">
                        Thửa Sen Vàng A1
                      </h3>
                      <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[#658B38]" /> Nông trại Củ Chi Sinh Thái • 100m²
                      </p>
                    </div>

                    {/* Progress & Current Planting */}
                    <div className="p-3 rounded-2xl bg-brand-cream/60 border border-stone-200/60 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-brand-dark flex items-center gap-1.5">
                          <Sprout className="w-4 h-4 text-emerald-600" /> Cà chua bi Cherry F1
                        </span>
                        <span className="text-[11px] font-semibold text-[#658B38]">Ngày 28 / 65</span>
                      </div>
                      <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                        <div className="bg-[#658B38] h-2 rounded-full w-[45%]" />
                      </div>
                    </div>

                    {/* IoT Sensors Telemetry */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-stone-50 border border-stone-100">
                        <span className="text-[10px] text-stone-400 block">Nhiệt độ</span>
                        <span className="font-bold text-brand-dark">28.5°C</span>
                      </div>
                      <div className="p-2 rounded-xl bg-stone-50 border border-stone-100">
                        <span className="text-[10px] text-stone-400 block">Độ ẩm đất</span>
                        <span className="font-bold text-emerald-600">68%</span>
                      </div>
                      <div className="p-2 rounded-xl bg-stone-50 border border-stone-100">
                        <span className="text-[10px] text-stone-400 block">Trạm IoT</span>
                        <span className="font-bold text-brand-dark">IOT-CC-01</span>
                      </div>
                    </div>

                    <div className="pt-1 flex gap-2">
                      <button
                        onClick={() => setShowServiceRequestModal(true)}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors"
                      >
                        Yêu cầu dịch vụ
                      </button>
                      <Link to="/marketplace/plot/PLOT-CC-01" className="flex-1">
                        <button className="w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors">
                          Chi tiết thửa đất
                        </button>
                      </Link>
                    </div>
                  </div>

                  {/* Yard 2: Thửa Mộc Châu B2 */}
                  <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                    <div className="relative h-44 rounded-2xl overflow-hidden bg-black/10">
                      <img
                        src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80"
                        alt="Thửa Mộc Châu B2"
                        className="w-full h-full object-cover"
                      />
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-brand-yellow text-brand-dark absolute top-3 left-3">
                        PLOT-MC-02
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#658B38] text-white absolute top-3 right-3">
                        Self-Growing
                      </span>
                    </div>

                    <div>
                      <h3 className="font-heading font-black text-lg text-brand-dark">
                        Thửa Mộc Châu B2
                      </h3>
                      <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[#658B38]" /> Cao nguyên Mộc Châu • 80m²
                      </p>
                    </div>

                    {/* Progress & Current Planting */}
                    <div className="p-3 rounded-2xl bg-brand-cream/60 border border-stone-200/60 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-brand-dark flex items-center gap-1.5">
                          <Wheat className="w-4 h-4 text-amber-600" /> Xà lách Romaine VietGAP
                        </span>
                        <span className="text-[11px] font-bold text-amber-600">Sắp thu hoạch! (24/35)</span>
                      </div>
                      <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                        <div className="bg-amber-500 h-2 rounded-full w-[75%]" />
                      </div>
                    </div>

                    {/* IoT Sensors Telemetry */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-stone-50 border border-stone-100">
                        <span className="text-[10px] text-stone-400 block">Nhiệt độ</span>
                        <span className="font-bold text-brand-dark">22.0°C</span>
                      </div>
                      <div className="p-2 rounded-xl bg-stone-50 border border-stone-100">
                        <span className="text-[10px] text-stone-400 block">Độ ẩm đất</span>
                        <span className="font-bold text-emerald-600">62%</span>
                      </div>
                      <div className="p-2 rounded-xl bg-stone-50 border border-stone-100">
                        <span className="text-[10px] text-stone-400 block">Trạm IoT</span>
                        <span className="font-bold text-brand-dark">IOT-MC-02</span>
                      </div>
                    </div>

                    <div className="pt-1 flex gap-2">
                      <button
                        onClick={() => setShowRapidCareModal(true)}
                        className="flex-1 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors"
                      >
                        Cứu hộ khẩn cấp
                      </button>
                      <button
                        onClick={() => setShowNewDiaryModal(true)}
                        className="flex-1 py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors"
                      >
                        Ghi nhật ký
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 2: FARM DIARY TIMELINE */}
            {activeTab === 'diary' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-black text-xl text-[#294C3B]">
                      Farm Diary Timeline (Nhật Ký Canh Tác)
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Minh chứng ca trực thực tế của công nhân và nhật ký cá nhân của bạn.
                    </p>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => setShowNewDiaryModal(true)}>
                    + Viết nhật ký mới
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Entry 1 */}
                  <div className="p-4 rounded-2xl bg-[#F5F2E9]/60 border border-stone-200/80 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#294C3B]">Hôm nay • 08:30 AM (Ca sáng)</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Công nhân: Trần Văn Lực (CVLĐ)
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed">
                      Đã hoàn thành kiểm tra độ ẩm đất tại Thửa Sen Vàng A1. Tiến hành nhổ cỏ rãnh và bổ sung nước tưới vi sinh đợt 3 theo đúng lịch trình của Chuyên gia Nam.
                    </p>
                    <div className="flex gap-2">
                      <img
                        src="https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=300&q=80"
                        alt="Ảnh minh chứng"
                        className="w-20 h-16 rounded-xl object-cover border border-stone-300"
                      />
                      <div className="text-[11px] text-stone-500 self-center">
                        <p>📍 Thửa Sen Vàng A1 (PLOT-CC-01)</p>
                        <p>✓ Đạt kiểm duyệt ảnh hiện trường VietGAP</p>
                      </div>
                    </div>
                  </div>

                  {/* Entry 2 */}
                  <div className="p-4 rounded-2xl bg-[#F5F2E9]/60 border border-stone-200/80 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#294C3B]">Hôm qua • 16:15 PM</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        Khách hàng: {user?.fullName || 'Lô Thái Quyền'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed">
                      Lên thăm vườn Mộc Châu cuối tuần. Xà lách Romaine phát triển xanh mướt, lá cuộn tròn dày và không có sâu bệnh. Đã tỉa bớt lá già phía dưới.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SERVICE REQUESTS */}
            {activeTab === 'services' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-black text-xl text-[#294C3B]">
                      Yêu Cầu Dịch Vụ Lao Động (Service Requests)
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Dành cho thửa đất Self-growing khi bạn bận đột xuất hoặc cần bổ sung công chăm sóc.
                    </p>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => setShowServiceRequestModal(true)}>
                    + Tạo yêu cầu mới
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-800">
                        Đang thực hiện
                      </span>
                      <h4 className="font-bold text-emerald-950 mt-1">Dịch vụ nhổ cỏ & bắt sâu thảo mộc</h4>
                      <p className="text-stone-600">Thửa Mộc Châu B2 • Phí: 50.000 đ • Đã thanh toán</p>
                    </div>
                    <span className="font-mono text-emerald-700 font-bold">REQ-8829</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: IOT ALERTS */}
            {activeTab === 'alerts' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
                <div>
                  <h3 className="font-heading font-black text-xl text-[#294C3B]">
                    Cảnh Báo Vi Khí Hậu & Trạm Cảm Biến IoT
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Hệ thống tự động phát hiện dị thường nhiệt độ và độ ẩm theo thời gian thực (BR18).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Cảnh báo mẫu: Độ ẩm đất Thửa B2 tiệm cận ngưỡng dưới (62%)</span>
                  </div>
                  <p className="text-xs text-stone-600">
                    Dự báo hôm nay trời nhiều nắng tại Mộc Châu. Bạn có thể kích hoạt bơm tưới khẩn cấp ngay bây giờ.
                  </p>
                  <Button variant="danger" size="sm" onClick={() => setShowRapidCareModal(true)}>
                    YÊU CẦU CỨU HỘ KHẨN CẤP (RAPID CARE)
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 5: HARVEST RESULTS */}
            {activeTab === 'harvest' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-black text-xl text-[#294C3B]">
                      Kết Quả Thu Hoạch & Nghiệm Thu Nông Sản
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Minh bạch cân điện tử, đối chứng sản lượng và đặt lịch giao rau sạch tận nhà.
                    </p>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => setShowHarvestAcceptModal(true)}>
                    Xác nhận nghiệm thu vụ mùa
                  </Button>
                </div>

                <div className="p-4 rounded-2xl bg-brand-cream border border-brand-border space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-brand-dark">Đợt thu hoạch gần nhất: Cà chua bi Cherry</span>
                    <span className="text-emerald-700 font-black">12.5 kg</span>
                  </div>
                  <p className="text-stone-600">
                    Thu hoạch ngày 02/10. Sản lượng đã được đóng thùng có mã QR truy xuất nguồn gốc và giao tới địa chỉ nhà bạn.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 6: CONTRACT HISTORY */}
            {activeTab === 'contracts' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
                <div>
                  <h3 className="font-heading font-black text-xl text-[#294C3B]">
                    Lịch Sử Hợp Đồng Thuê Thửa Đất
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Quản lý thời hạn thuê, gia hạn hợp đồng hoặc yêu cầu hoàn cọc theo chính sách BR10.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-stone-200 space-y-3 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                    <span className="font-mono font-bold text-[#294C3B] text-sm">CTR-2026-FARM-9912</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Đang hiệu lực
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-stone-600">
                    <p>Thửa đất: <strong>Sen Vàng A1 (PLOT-CC-01)</strong></p>
                    <p>Thời hạn: <strong>03 Tháng (Còn 42 ngày)</strong></p>
                    <p>Chế độ: <strong>Assisted-growing</strong></p>
                    <p>Tổng phí: <strong>3.600.000 đ</strong></p>
                  </div>
                  <div className="pt-2 flex gap-3">
                    <Button variant="outline" size="sm" onClick={() => setShowRenewContractModal(true)}>
                      Gia hạn hợp đồng (Renew)
                    </Button>
                    <button
                      onClick={() => alert('Yêu cầu hủy hợp đồng và hoàn tiền theo BR10 đã được gửi đến ban quản trị Farmely.')}
                      className="text-xs text-rose-600 hover:underline font-bold self-center"
                    >
                      Yêu cầu hủy & hoàn tiền
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: CHATBOT AI WIDGET (Matching reference screenshot exactly) */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-24 space-y-4">
            
            <div className="bg-white rounded-3xl border border-stone-200/90 shadow-elevated overflow-hidden flex flex-col h-[680px]">
              
              {/* Chatbot Header */}
              <div className="p-4 bg-brand-cream/80 border-b border-brand-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#658B38] text-white flex items-center justify-center shadow-sm">
                    <Sprout className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-sm text-[#294C3B]">
                      Ask Farmely AI
                    </h3>
                    <p className="text-[10px] text-stone-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Trực tuyến • Trợ lý nông học thông minh
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-stone-400">
                  <button
                    onClick={() => setChatMessages([chatMessages[0]])}
                    className="p-1.5 hover:text-rose-600 hover:bg-stone-100 rounded-lg transition-colors"
                    title="Xóa đoạn chat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Messages Log */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#658B38] text-white rounded-br-none shadow-sm'
                          : 'bg-[#F5F2E9] text-stone-800 rounded-bl-none border border-stone-200'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-stone-400 mt-1 px-1">{msg.time}</span>
                  </div>
                ))}

                {isAiTyping && (
                  <div className="flex items-center gap-1.5 text-stone-400 text-xs italic p-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#658B38] animate-spin" />
                    <span>Farmely AI đang phân tích dữ liệu cảm biến...</span>
                  </div>
                )}
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="p-3 bg-stone-50 border-t border-stone-200/60 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                  Gợi ý câu hỏi nhanh:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleSendMessage('Độ ẩm thửa A1 hôm nay có cần tưới thêm không?')}
                    className="px-2.5 py-1 rounded-full bg-white border border-stone-200 text-[11px] text-stone-600 hover:bg-[#658B38] hover:text-white transition-all text-left"
                  >
                    Độ ẩm thửa A1 hôm nay?
                  </button>
                  <button
                    onClick={() => handleSendMessage('Khi nào xà lách Romaine có thể thu hoạch?')}
                    className="px-2.5 py-1 rounded-full bg-white border border-stone-200 text-[11px] text-stone-600 hover:bg-[#658B38] hover:text-white transition-all text-left"
                  >
                    Khi nào thu hoạch Xà lách?
                  </button>
                  <button
                    onClick={() => handleSendMessage('Quy trình phòng trừ sâu bệnh VietGAP?')}
                    className="px-2.5 py-1 rounded-full bg-white border border-stone-200 text-[11px] text-stone-600 hover:bg-[#658B38] hover:text-white transition-all text-left"
                  >
                    Quy trình trừ sâu VietGAP?
                  </button>
                </div>
              </div>

              {/* Chat Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 bg-white border-t border-stone-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Hỏi AI về thửa đất, độ ẩm, mùa vụ..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#658B38]"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-[#658B38] text-white hover:bg-[#52742c] transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>

          </div>

        </div>

      </main>

      {/* MODAL: New Diary Entry (Photo Entry) */}
      <Modal
        isOpen={showNewDiaryModal}
        onClose={() => setShowNewDiaryModal(false)}
        title="Thêm Nhật Ký Canh Tác Mới (New Diary Entry)"
        subtitle="Dành cho chế độ Self-Growing hoặc cập nhật ảnh tham quan vườn"
      >
        <div className="space-y-4 text-left text-xs">
          <div>
            <label className="block font-bold text-brand-dark mb-1">Chọn Thửa Đất:</label>
            <select className="w-full p-2.5 rounded-xl border border-brand-border bg-white text-xs">
              <option>Thửa Mộc Châu B2 (PLOT-MC-02) • Self-Growing</option>
              <option>Thửa Sen Vàng A1 (PLOT-CC-01) • Assisted-Growing</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">Ghi Chú Nhật Ký:</label>
            <textarea
              rows={3}
              value={diaryNote}
              onChange={(e) => setDiaryNote(e.target.value)}
              placeholder="Ví dụ: Hôm nay cây phát triển rất đều, đất tơi xốp, đã tỉa bớt lá héo..."
              className="w-full p-2.5 rounded-xl border border-brand-border text-xs focus:ring-1 focus:ring-brand-green"
            />
          </div>

          <div className="p-4 rounded-xl border-2 border-dashed border-stone-300 text-center space-y-1">
            <Camera className="w-6 h-6 text-stone-400 mx-auto" />
            <p className="font-bold text-stone-600">Đính kèm ảnh hiện trường (Bắt buộc theo BR15)</p>
            <p className="text-[10px] text-stone-400">PNG, JPG tối đa 5MB</p>
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

      {/* MODAL: Service Request */}
      <Modal
        isOpen={showServiceRequestModal}
        onClose={() => setShowServiceRequestModal(false)}
        title="Gửi Yêu Cầu Dịch Vụ Lao Động (Service Request)"
        subtitle="Đội ngũ CVLĐ sẽ tiếp nhận và hoàn tất trong ngày"
      >
        <div className="space-y-4 text-left text-xs">
          <div>
            <label className="block font-bold text-brand-dark mb-1">Loại Dịch Vụ:</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-brand-border bg-white text-xs"
            >
              <option value="WEEDING">Nhổ cỏ & làm tơi đất (50.000 đ)</option>
              <option value="FERTILIZING">Bón phân hữu cơ vi sinh (80.000 đ)</option>
              <option value="PEST_CONTROL">Phun thảo mộc diệt sâu sinh học (70.000 đ)</option>
              <option value="EXTRA_WATER">Tưới bổ sung ngoài giờ (30.000 đ)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">Ghi Chú Chi Tiết Cho Công Nhân:</label>
            <textarea
              rows={2}
              value={serviceNotes}
              onChange={(e) => setServiceNotes(e.target.value)}
              placeholder="Ghi chú cụ thể vị trí cần làm..."
              className="w-full p-2.5 rounded-xl border border-brand-border text-xs"
            />
          </div>

          <div className="p-3 rounded-xl bg-brand-cream border border-brand-border flex justify-between items-center font-bold">
            <span>Phí dịch vụ:</span>
            <span className="text-brand-green font-black">50.000 đ</span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowServiceRequestModal(false)}>
              HỦY
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                alert('Yêu cầu dịch vụ đã được tạo và chuyển tiếp tới điều phối hiện trường!');
                setShowServiceRequestModal(false);
              }}
            >
              THANH TOÁN & GỬI YÊU CẦU
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Rapid Care */}
      <Modal
        isOpen={showRapidCareModal}
        onClose={() => setShowRapidCareModal(false)}
        title="Yêu Cầu Cứu Hộ Khẩn Cấp (Request Rapid Care)"
        subtitle="Xử lý nhanh sự cố vi khí hậu IoT hoặc sâu bệnh đột xuất"
      >
        <div className="space-y-4 text-left text-xs">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
            <p className="font-bold">⏱ Thời gian phản hồi: Dưới 30 phút</p>
            <p>Đội ngũ trực ban tại nông trại sẽ kiểm tra trực tiếp trạm cảm biến và luống đất để xử lý sự cố.</p>
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">Mô tả sự cố:</label>
            <textarea
              rows={3}
              defaultValue="Độ ẩm đất giảm nhanh, nghi ngờ ống tưới nhỏ giọt bị nghẹt rác."
              className="w-full p-2.5 rounded-xl border border-brand-border text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowRapidCareModal(false)}>
              HỦY
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                alert('Đã phát tín hiệu cứu hộ khẩn cấp đến đội ngũ quản lý vườn!');
                setShowRapidCareModal(false);
              }}
            >
              KÍCH HOẠT CỨU HỘ NGAY
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Accept Harvest */}
      <Modal
        isOpen={showHarvestAcceptModal}
        onClose={() => setShowHarvestAcceptModal(false)}
        title="Nghiệm Thu Sản Lượng Vụ Mùa (Accept Harvest)"
        subtitle="Đối chứng cân điện tử và xác nhận giao hàng"
      >
        <div className="space-y-4 text-left text-xs">
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
            <p className="font-bold">✓ Sản lượng thực tế: 12.5 kg Cà chua bi Cherry F1</p>
            <p>Đã chụp ảnh cân đối chứng lúc 06:45 sáng nay tại trạm đóng gói Củ Chi.</p>
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
                <span>Tôi sẽ tự đến nông trại nhận vào sáng Thứ 7 này</span>
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
                alert('Xác nhận nghiệm thu thành công! Đơn vị vận chuyển sẽ liên hệ giao hàng cho bạn.');
                setShowHarvestAcceptModal(false);
              }}
            >
              XÁC NHẬN NGHIỆM THU
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Renew Contract */}
      <Modal
        isOpen={showRenewContractModal}
        onClose={() => setShowRenewContractModal(false)}
        title="Gia Hạn Hợp Đồng Thuê Đất (Renew Contract)"
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

      <Footer />
    </div>
  );
}
