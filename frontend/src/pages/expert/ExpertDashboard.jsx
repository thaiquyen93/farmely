import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import { useAuthStore } from '../../stores/authStore';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useRealtimeChat } from '../../hooks/useRealtimeChat';
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
  ExternalLink
} from 'lucide-react';

export default function ExpertDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'issues' | 'templates' | 'compatibility' | 'knowledge'

  const isExpertUser = user?.role === 'expert';
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
  const [chatFilter, setChatFilter] = useState('all'); // 'all' | 'customer' | 'worker' | 'pending'
  const [chatInputText, setChatInputText] = useState('');
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const chatContainerRef = useRef(null);

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

  // Auto scroll chat to bottom strictly INSIDE chat container
  useEffect(() => {
    if (activeTab === 'chat' && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [selectedThreadId, activeTab]);

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

  // Submit diagnosis for worker field issue
  const handleSendIssueDiagnosis = (e) => {
    e.preventDefault();
    if (!selectedIssueToDiagnose || !diagnosisAdvice.trim()) return;

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

  const [viewTemplateDetail, setViewTemplateDetail] = useState(null);
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [newTemplateData, setNewTemplateData] = useState({
    code: '',
    name: '',
    variety: '',
    durationDays: 45,
    description: ''
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

  const handleCreateTemplate = (e) => {
    e.preventDefault();
    if (!newTemplateData.name || !newTemplateData.variety) return;
    const newTmpl = {
      id: `TMPL-${Date.now()}`,
      code: newTemplateData.code || `TMPL-${Math.floor(1000 + Math.random() * 9000)}`,
      version: 'v1.0 (Chuẩn VietGAP)',
      name: newTemplateData.name,
      variety: newTemplateData.variety,
      durationDays: Number(newTemplateData.durationDays) || 45,
      stagesCount: 4,
      stepsCount: 4,
      status: 'ACTIVE',
      description: newTemplateData.description || 'Quy trình canh tác chuẩn VietGAP.',
      steps: [
        { day: 1, name: 'Làm đất & Gieo giống', type: 'GIEO GIỐNG', details: 'Chuẩn bị giá thể và gieo ươm theo chuẩn VietGAP.' },
        { day: 15, name: 'Xuống luống & Tưới ẩm vi sinh', type: 'TRỒNG CÂY', details: 'Bố trí mật độ chuẩn, kích rễ sinh học.' },
        { day: 35, name: 'Cách ly an toàn VietGAP', type: 'CÁCH LY', details: 'Ngưng dinh dưỡng trước thu hoạch 5 ngày.' },
        { day: Number(newTemplateData.durationDays) || 45, name: 'Thu hoạch thành phẩm', type: 'THU HOẠCH', details: 'Thu hái đạt độ chín tối ưu.' }
      ]
    };
    setProcessTemplates(prev => [newTmpl, ...prev]);
    setIsCreateTemplateOpen(false);
    setNewTemplateData({ code: '', name: '', variety: '', durationDays: 45, description: '' });
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
    <div className="min-h-screen bg-[#F5F3E9] flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-10 w-full space-y-6">
        
        {/* Top Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-brand-border shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200">
              <Sprout className="w-3.5 h-3.5 text-brand-green" />
              <span>Phân Hệ Nghiên Cứu & Hỗ Trợ Nông Học (Agricultural Expert Hub)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-brand-dark">
              Bàn Làm Việc Chuyên Gia • <span className="text-brand-green">{user?.fullName || 'ThS. Nguyễn Hoàng Nam'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-brand-muted max-w-3xl leading-relaxed">
              Tư vấn trực tiếp 1-on-1 cho khách thuê đất, chỉ đạo kỹ thuật công nhân hiện trường, chẩn đoán sự cố nông nghiệp, quản lý quy trình canh tác VietGAP và nạp kho tri thức AI RAG.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant={activeTab === 'templates' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveTab('templates')}
              className="gap-2 font-bold shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-brand-yellow" />
              <span>Quy Trình VietGAP</span>
            </Button>

            <Button
              variant={activeTab === 'compatibility' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('compatibility')}
              className="gap-2 font-bold bg-white shadow-sm cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Ma Trận Thổ Nhưỡng</span>
            </Button>

            <Button
              variant={activeTab === 'knowledge' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('knowledge')}
              className="gap-2 font-bold bg-white shadow-sm cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-brand-green" />
              <span>Kho Tri Thức AI</span>
            </Button>
          </div>
        </div>

        {/* Top Agronomy Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-sm text-center space-y-1">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Thửa Đất Giám Sát
            </span>
            <div className="text-2xl font-heading font-black text-brand-dark">
              16 Thửa
            </div>
            <span className="text-[10px] text-emerald-700 font-bold block">100% đạt chuẩn VietGAP</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-sm text-center space-y-1">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Hộp Thư Cần Phản Hồi
            </span>
            <div className="text-2xl font-heading font-black text-amber-600">
              {chatThreads.filter(c => c.status === 'PENDING').length} Tin nhắn
            </div>
            <span className="text-[10px] text-amber-700 font-bold block">Khách thuê & Công nhân</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-sm text-center space-y-1">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Sự Cố Hiện Trường
            </span>
            <div className="text-2xl font-heading font-black text-rose-600">
              {fieldIssues.filter(i => i.status === 'PENDING').length} Cần chỉ đạo
            </div>
            <span className="text-[10px] text-rose-700 font-bold block">Báo cáo từ công nhân</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-sm text-center space-y-1">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Quy Trình Chuẩn
            </span>
            <div className="text-2xl font-heading font-black text-emerald-600">
              0{processTemplates.length} Phác Đồ
            </div>
            <span className="text-[10px] text-emerald-700 font-bold block">Đang áp dụng thực địa</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-sm text-center space-y-1 col-span-2 lg:col-span-1">
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
          <aside className="w-full lg:w-72 shrink-0 bg-white rounded-2xl border border-brand-border p-4 shadow-sm space-y-1.5 lg:sticky lg:top-28">
            <div className="px-3 py-2 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              Bàn Làm Việc Kỹ Thuật
            </div>

            {[
              { id: 'chat', label: 'Hộp Thư Tư Vấn & Chỉ Đạo', icon: MessageSquare, count: chatThreads.filter(c => c.status === 'PENDING').length },
              { id: 'issues', label: 'Xử Lý Sự Cố Hiện Trường', icon: AlertTriangle, count: fieldIssues.filter(i => i.status === 'PENDING').length },
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
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-[#294C38] text-white shadow-sm'
                      : 'text-stone-700 hover:bg-stone-50 hover:text-brand-dark'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-brand-yellow' : 'text-stone-400'}`} />
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {tab.count !== null && tab.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      isActive ? 'bg-brand-yellow text-brand-dark' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </aside>

          {/* Expert Main Display Content */}
          <section className="flex-1 min-w-0 w-full space-y-6">

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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading font-black text-lg text-brand-dark">
                            Hộp Thư Tư Vấn & Chỉ Đạo
                          </h3>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
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
                      <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto no-scrollbar">
                        <button
                          onClick={() => setChatFilter('all')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                            chatFilter === 'all'
                              ? 'bg-[#294C38] text-white shadow-xs'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          Tất cả ({chatThreads.length})
                        </button>
                        <button
                          onClick={() => setChatFilter('customer')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                            chatFilter === 'customer'
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          Khách thuê ({chatThreads.filter(c => c.role === 'customer').length})
                        </button>
                        <button
                          onClick={() => setChatFilter('worker')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                            chatFilter === 'worker'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          Công nhân ({chatThreads.filter(c => c.role === 'worker').length})
                        </button>
                        <button
                          onClick={() => setChatFilter('pending')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
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
                          if (chatFilter === 'customer') return matchesQuery && thread.role === 'customer';
                          if (chatFilter === 'worker') return matchesQuery && thread.role === 'worker';
                          if (chatFilter === 'pending') return matchesQuery && thread.status === 'PENDING';
                          return matchesQuery;
                        })
                        .map((thread) => {
                          const isSelected = thread.id === selectedThreadId;
                          const lastMsg = thread.messages[thread.messages.length - 1];
                          const hasPhoto = thread.messages.some(m => m.photoUrl);

                          return (
                            <div
                              key={thread.id}
                              onClick={() => handleSelectThread(thread.id)}
                              className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all duration-200 relative ${
                                isSelected
                                  ? 'bg-white border-l-4 border-l-[#294C38] shadow-sm'
                                  : thread.unread
                                    ? 'bg-emerald-50/70 hover:bg-emerald-50 border-l-4 border-l-rose-500 shadow-2xs'
                                    : 'hover:bg-white/80'
                              }`}
                            >
                              {/* Avatar with Online Status */}
                              <div className="relative shrink-0">
                                <img
                                  src={thread.customerAvatar}
                                  alt={thread.customerName}
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

                                {/* Role Badge & Plot */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                    thread.role === 'worker'
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                      : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                                  }`}>
                                    {thread.roleLabel}
                                  </span>
                                  <span className="text-[10px] font-semibold text-brand-green bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 truncate max-w-[130px]">
                                    {thread.plotName} ({thread.plotCode})
                                  </span>
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
                            </div>
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
                        <div className="p-3.5 sm:p-4 border-b border-brand-border bg-white flex items-center justify-between gap-3 shrink-0 shadow-2xs">
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
                                src={activeThread.customerAvatar}
                                alt={activeThread.customerName}
                                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-brand-border"
                              />
                              {activeThread.isOnline && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-brand-dark text-sm sm:text-base truncate">
                                  {activeThread.customerName}
                                </h4>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  activeThread.role === 'worker'
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                }`}>
                                  {activeThread.roleLabel}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  activeThread.status === 'PENDING'
                                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                }`}>
                                  {activeThread.status === 'PENDING' ? 'Chưa phản hồi' : 'Đã phản hồi'}
                                </span>
                              </div>
                              <p className="text-[11px] text-stone-500 truncate flex items-center gap-1.5">
                                <span className="text-emerald-700 font-semibold">{activeThread.plotName} ({activeThread.plotCode})</span>
                                <span>• {activeThread.crop}</span>
                                <span className="text-stone-400">({activeThread.stage})</span>
                              </p>
                            </div>
                          </div>

                          {/* Right Badge Status */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Chỉ Đạo & Tư Vấn 1-on-1
                            </span>
                          </div>
                        </div>

                        {/* Messenger Chat History Viewport */}
                        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#F8F9FA]">
                          
                          {/* Date separator */}
                          <div className="flex items-center justify-center my-2">
                            <span className="text-[11px] font-semibold text-stone-400 bg-white px-3 py-1 rounded-full border border-stone-200/80 shadow-2xs">
                              Hôm nay • Kênh trao đổi nông học 1-on-1 ({activeThread.roleLabel})
                            </span>
                          </div>

                          {/* Message Bubbles */}
                          {activeThread.messages.map((msg) => {
                            const isExpert = msg.sender === 'expert';

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
                              <div key={msg.id} className="flex items-end gap-2.5 max-w-[88%] sm:max-w-[78%]">
                                <img
                                  src={activeThread.customerAvatar}
                                  alt={activeThread.customerName}
                                  className="w-8 h-8 rounded-full object-cover border border-stone-200 shrink-0 mb-1"
                                />

                                <div className="space-y-1.5 flex-1">
                                  <div className="text-[10px] text-stone-400 font-medium px-1">
                                    <span className="font-bold text-stone-700">{msg.senderName}</span>
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
                      <div className="flex items-center justify-between border-b border-brand-border/60 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-brand-green text-sm">{issue.id}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            issue.urgency === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-stone-100 text-stone-700'
                          }`}>
                            {issue.urgency === 'HIGH' ? 'Khẩn cấp' : 'Bình thường'}
                          </span>
                          <span className="text-stone-400">• {issue.reportedTime}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          issue.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {issue.status === 'PENDING' ? 'Chờ chẩn đoán' : 'Đã ban hành phác đồ'}
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
                        </div>
                      </div>

                      {issue.status === 'PENDING' && (
                        <div className="flex justify-end pt-2 border-t border-brand-border/60">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setSelectedIssueToDiagnose(issue)}
                            className="bg-emerald-700 font-bold"
                          >
                            Chẩn đoán & Ban hành chỉ đạo kỹ thuật
                          </Button>
                        </div>
                      )}
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
                          <span className="font-mono text-xs font-bold text-brand-green bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                            {tmpl.code}
                          </span>
                          <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                            {tmpl.version}
                          </span>
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
                            {tmpl.steps.map((st, i) => (
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
                          {comp.compatibleCrops.map((c, i) => (
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
                {viewTemplateDetail.steps.map((st, idx) => (
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
        title="Soạn Thảo Quy Trình Canh Tác Chuẩn VietGAP"
        subtitle="Ban hành quy trình kỹ thuật mới cho nông trại"
      >
        <form onSubmit={handleCreateTemplate} className="space-y-3 text-xs text-left">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-brand-dark mb-1">Mã Quy Trình (Code):</label>
              <input
                type="text"
                placeholder="TMPL-CABBAGE-05"
                value={newTemplateData.code}
                onChange={(e) => setNewTemplateData({ ...newTemplateData, code: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-green/20"
              />
            </div>
            <div>
              <label className="block font-bold text-brand-dark mb-1">Chu kỳ sinh trưởng (ngày):</label>
              <input
                type="number"
                required
                value={newTemplateData.durationDays}
                onChange={(e) => setNewTemplateData({ ...newTemplateData, durationDays: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-green/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">Tên Quy Trình:</label>
            <input
              type="text"
              required
              placeholder="Phác Đồ Canh Tác Bắp Cải Tí Hon Brussels F1"
              value={newTemplateData.name}
              onChange={(e) => setNewTemplateData({ ...newTemplateData, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-green/20"
            />
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">Giống Cây Trồng Áp Dụng:</label>
            <input
              type="text"
              required
              placeholder="Bắp cải Brussels hữu cơ"
              value={newTemplateData.variety}
              onChange={(e) => setNewTemplateData({ ...newTemplateData, variety: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-green/20"
            />
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">Mô tả tóm tắt kỹ thuật & cách ly:</label>
            <textarea
              rows={3}
              value={newTemplateData.description}
              onChange={(e) => setNewTemplateData({ ...newTemplateData, description: e.target.value })}
              placeholder="Quy trình chuẩn hóa cách ly dinh dưỡng trước thu hoạch 5 ngày, tưới nhỏ giọt kiểm soát ẩm độ..."
              className="w-full p-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-green/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateTemplateOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold">
              Lưu & Ban Hành Quy Trình
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

      <Footer />
    </div>
  );
}
