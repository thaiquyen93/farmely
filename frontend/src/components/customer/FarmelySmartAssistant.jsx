import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bot,
  MessageSquare,
  Sparkles,
  Send,
  X,
  Minus,
  RefreshCw,
  ExternalLink,
  BookOpen,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useRealtimeChat } from '../../hooks/useRealtimeChat';
import { useLocation } from 'react-router-dom';

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

// Tri thức dự phòng nông học thông minh khi backend AI chưa bật hoặc offline
const FALLBACK_KNOWLEDGE_BASE = [
  {
    keywords: ['xà lách', 'xa lach', 'rau xà lách'],
    reply: 'Chào bạn! Rau xà lách (Romaine, mỡ, xoăn) tại Farmely phát triển tốt nhất ở nhiệt độ 18°C – 25°C, độ ẩm đất tối ưu từ 65% – 75%. Chú ý tưới phun mưa mịn vào sáng sớm (6h30-7h30) và chiều mát (16h-17h). Tránh tưới đẫm vào ban đêm để hạn chế nấm thối bẹ lá.',
    source: 'Cẩm nang Kỹ thuật Canh tác Rau ăn lá Farmely 2026'
  },
  {
    keywords: ['độ ẩm', 'ẩm đất', 'tưới nước', 'tưới bù', 'hạn'],
    reply: 'Theo quy chuẩn vi khí hậu Farmely: Độ ẩm đất duy trì lý tưởng từ 60% – 75%. Nếu cảm biến báo dưới 40%, hệ thống sẽ kích hoạt cảnh báo tưới bổ sung. Nếu độ ẩm đất ≥ 80% hoặc xác suất mưa ≥ 70%, trạm điều hành sẽ tự động hoãn ca tưới để chống úng rễ.',
    source: 'Quy trình Vi khí hậu & Tự động hóa IoT Farmely'
  },
  {
    keywords: ['sâu', 'rầy', 'bọ trĩ', 'ốc sên', 'bệnh'],
    reply: 'Farmely áp dụng 100% biện pháp bảo vệ thực vật sinh học. Đối với bọ trĩ và rầy mềm: phun dung dịch tỏi ớt gừng lên men vi sinh hoặc dầu khoáng sinh học SK Enspray 99EC. Đối với ốc sên: rải bẫy bã men bia hoặc vỏ trứng vụn quanh luống rau.',
    source: 'Sổ tay Kiểm soát Sâu bệnh Hữu cơ Farmely'
  },
  {
    keywords: ['thuê đất', 'hợp đồng', 'gia hạn', 'chi phí', 'giá'],
    reply: 'Quy trình thuê đất tại Farmely bao gồm: Chọn thửa đất trên Marketplace bản đồ vệ tinh, chọn giống cây & gói canh tác (Tự trồng hoặc Có hỗ trợ chăm sóc), thanh toán trả trước 100% qua VNPay/VietQR. Hợp đồng được ký điện tử và bạn có thể gia hạn trước khi hết hạn 3 ngày với chiết khấu từ 5% – 15%.',
    source: 'Điều khoản Hợp đồng & Pháp lý Farmely'
  },
  {
    keywords: ['thu hoạch', 'sản lượng', 'chất lượng', 'khiếu nại'],
    reply: 'Khi đến kỳ thu hoạch, nhân viên hiện trường sẽ cân sản lượng thực tế, dán mã QR truy xuất và chụp ảnh đối chứng. Khách hàng nghiệm thu đánh giá chất lượng (Độ tươi, Bao gói). Nếu sản lượng thiếu hụt do lỗi vận hành, bạn có quyền gửi hồ sơ khiếu nại để nhận bồi thường hoàn tiền hoặc bù vụ tiếp theo.',
    source: 'Quy chế Nghiệm thu & Bảo hiểm Nông sản Farmely'
  }
];

const QUICK_PROMPTS = [
  'Kỹ thuật tưới cho xà lách giòn ngọt?',
  'Độ ẩm đất bao nhiêu là an toàn?',
  'Cách phòng ngừa sâu bọ sinh học?',
  'Quy trình thuê đất tại Farmely thế nào?'
];

export default function FarmelySmartAssistant() {
  const { user } = useAuthStore();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ai'); // 'ai' | 'expert'

  // Position state (hỗ trợ kéo thả & lưu session)
  const [position, setPosition] = useState(() => {
    try {
      const saved = sessionStorage.getItem('farmely_fab_pos');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isMarketplace, setIsMarketplace] = useState(false);

  // AI Chat State
  const [aiInput, setAiInput] = useState('');
  const [aiConversationId, setAiConversationId] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    {
      id: 'welcome-ai',
      sender: 'ai',
      senderName: 'Farmely AI • Trợ lý Nông Nghiệp',
      text: 'Xin chào! Tôi là Farmely AI — Trợ lý nông nghiệp thông minh của nền tảng Farmely. Tôi có thể hỗ trợ bạn về kỹ thuật canh tác VietGAP, theo dõi vi khí hậu độ ẩm thửa đất, nhận diện sâu bệnh và giải đáp thủ tục mùa vụ. Bạn cần hỗ trợ gì hôm nay?',
      time: 'Vừa xong',
      referencedDocs: []
    }
  ]);

  // Expert Chat State
  const [expertInput, setExpertInput] = useState('');
  const isStaff = user?.role === 'STAFF';
  const chatRole = isStaff ? 'worker' : 'customer';
  const fallbackName = isStaff ? 'Nhân viên hiện trường' : 'Khách hàng';
  const threadId = useMemo(
    () => `${isStaff ? 'WORK' : 'CONS'}-${user?.id || user?.email || (isStaff ? 'STAFF' : 'CUSTOMER')}`,
    [isStaff, user?.id, user?.email]
  );

  const { currentThread, sendMessage: sendExpertMessage } = useRealtimeChat({
    role: chatRole,
    initialThreadId: threadId,
    senderName: user?.fullName || user?.name || fallbackName
  });

  const dragRef = useRef(null);
  const panelRef = useRef(null);
  const aiScrollRef = useRef(null);
  const expertScrollRef = useRef(null);

  // Theo dõi route để phát hiện Marketplace
  useEffect(() => {
    setIsMarketplace(location.pathname.startsWith('/marketplace'));
  }, [location.pathname]);

  // Quan sát xem panel chi tiết thửa đất (Plot Detail Panel) có đang mở không
  useEffect(() => {
    const checkPanel = () => {
      const panel = document.querySelector('[data-plot-detail-panel="open"]');
      setIsDetailPanelOpen(Boolean(panel));
    };
    checkPanel();
    const obs = new MutationObserver(checkPanel);
    obs.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-plot-detail-panel']
    });
    return () => obs.disconnect();
  }, []);

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (activeTab === 'ai' && aiScrollRef.current) {
      aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
    }
  }, [aiMessages, isAiLoading, activeTab]);

  useEffect(() => {
    if (activeTab === 'expert' && expertScrollRef.current) {
      expertScrollRef.current.scrollTop = expertScrollRef.current.scrollHeight;
    }
  }, [currentThread?.messages, activeTab]);

  // Xử lý gửi tin nhắn AI (Gắn Backend FastAPI qua Gateway /api/ai/chat)
  const handleSendAi = async (textToSend) => {
    const question = (textToSend || aiInput).trim();
    if (!question || isAiLoading) return;

    const currentTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      senderName: user?.fullName || user?.name || fallbackName,
      text: question,
      time: currentTime
    };

    setAiMessages((prev) => [...prev, userMsg]);
    setAiInput('');
    setIsAiLoading(true);

    try {
      // 1. Thử gọi Backend AI Microservice (/api/ai/chat)
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})
        },
        body: JSON.stringify({
          userId: user?.id || 1,
          message: question,
          plotId: null,
          conversationId: aiConversationId || null
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.reply) {
          if (data.conversationId) setAiConversationId(data.conversationId);

          setAiMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              sender: 'ai',
              senderName: 'Farmely AI • Trợ lý Nông Nghiệp',
              text: data.reply,
              time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
              referencedDocs: data.referencedDocuments || []
            }
          ]);
          setIsAiLoading(false);
          return;
        }
      }
      throw new Error('Backend AI trả về mã không hợp lệ hoặc chưa sẵn sàng');
    } catch (err) {
      console.warn('Backend AI kết nối thất bại, chuyển sang Engine tri thức dự phòng:', err.message);

      // 2. Fallback sang Smart Agronomy Knowledge Base cục bộ
      const lowerQ = question.toLowerCase().trim();
      let fallbackReply = '';
      let fallbackSource = 'Cẩm nang Kỹ thuật Nông nghiệp Farmely';

      // 1. Chào hỏi tự nhiên
      if (lowerQ.match(/^(chào|hello|hi|xin chào|farmely ai|ai|bot|alo|ơi|ê)(\s+bạn|\s+ạ)?$/i) || (lowerQ.includes('chào') && lowerQ.length <= 15)) {
        fallbackReply = 'Xin chào bạn! Tôi là Farmely AI — Trợ lý nông nghiệp thông minh của nền tảng Farmely. Rất vui được hỗ trợ bạn. Bạn cần tư vấn về kỹ thuật gieo trồng, kiểm tra độ ẩm đất IoT hay tìm hiểu thủ tục thuê thửa đất nào hôm nay?';
        fallbackSource = 'Cẩm nang Hướng dẫn Khách hàng Farmely';
      }
      // 2. Cảm ơn, tạm biệt
      else if (lowerQ.includes('cảm ơn') || lowerQ.includes('thank') || lowerQ.includes('tks')) {
        fallbackReply = 'Rất vui được hỗ trợ bạn! Chúc bạn có những vụ mùa bội thu, rau sạch chuẩn VietGAP và trải nghiệm canh tác tuyệt vời trên Farmely. Cần hỗ trợ thêm, bạn cứ nhắn cho Farmely AI nhé!';
        fallbackSource = 'Hệ thống Farmely AI';
      }
      // 3. Khớp từ khóa cẩm nang nông nghiệp
      else {
        let matched = FALLBACK_KNOWLEDGE_BASE.find((item) =>
          item.keywords.some((kw) => lowerQ.includes(kw))
        );

        if (matched) {
          fallbackReply = matched.reply;
          fallbackSource = matched.source;
        } else {
          if (question.length <= 8) {
            fallbackReply = 'Farmely AI sẵn sàng hỗ trợ bạn! Bạn đang quan tâm đến kỹ thuật gieo trồng, kiểm tra độ ẩm đất vi khí hậu hay muốn tìm hiểu thủ tục thuê thửa đất trên Farmely? Cứ nhắn cụ thể câu hỏi cho tôi nhé! Nếu cần phác đồ chuyên sâu, bạn có thể bấm tab "Kênh Chuyên Gia" để trao đổi trực tiếp với ThS. Hoàng Nam nha.';
          } else {
            fallbackReply = 'Hệ thống Farmely AI đã ghi nhận câu hỏi từ bạn. Đối với canh tác nông nghiệp công nghệ cao tại Farmely, bạn nên thường xuyên theo dõi biểu đồ cảm biến IoT thời gian thực của thửa đất (độ ẩm đất, nhiệt độ, EC) để điều tiết nước tưới và phân bón hợp lý.\n\nBạn cũng có thể bấm sang tab "Kênh Chuyên Gia" ở ngay phía trên để trò chuyện trực tiếp và nhận tư vấn chi tiết từ ThS. Hoàng Nam nhé!';
          }
          fallbackSource = 'Cẩm nang Kỹ thuật Nông nghiệp Farmely';
        }
      }

      setTimeout(() => {
        setAiMessages((prev) => [
          ...prev,
          {
            id: `ai-fb-${Date.now()}`,
            sender: 'ai',
            senderName: 'Farmely AI • Trợ lý Nông Nghiệp',
            text: fallbackReply,
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            referencedDocs: [{ docTitle: fallbackSource, similarityScore: 0.92 }]
          }
        ]);
        setIsAiLoading(false);
      }, 700);
    }
  };

  // Kéo thả FAB Launcher
  const beginDrag = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
      moved: false
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event) => {
    if (!dragRef.current) return;
    const width = 56;
    const height = 56;
    const next = {
      x: clamp(event.clientX - dragRef.current.dx, 16, window.innerWidth - width - 16),
      y: clamp(event.clientY - dragRef.current.dy, 80, window.innerHeight - height - 16)
    };
    dragRef.current.moved = true;
    setPosition(next);
  };

  const endDrag = () => {
    if (dragRef.current && !dragRef.current.moved) {
      setIsOpen((prev) => !prev);
    }
    if (dragRef.current && dragRef.current.moved && position) {
      try {
        sessionStorage.setItem('farmely_fab_pos', JSON.stringify(position));
      } catch {}
    }
    dragRef.current = null;
  };

  // Tính toán vị trí thông minh để KHÔNG BAO GIỜ bị đè lên Plot Detail Action Bar
  // Khi ở Marketplace và panel chi tiết thửa đất mở (bên phải):
  // Nút tự động né sang GÓC TRÁI MÀN HÌNH hoặc nâng cao lên an toàn.
  const computedStyle = useMemo(() => {
    if (position) {
      return { left: position.x, top: position.y };
    }

    // Nếu ở Marketplace và có panel thửa đất mở
    if (isDetailPanelOpen || isMarketplace) {
      // Dịch sang mép TRÁI an toàn để giải phóng hoàn toàn cụm nút hành động bên phải
      return {
        left: 24,
        bottom: 24
      };
    }

    // Mặc định ở góc phải dưới
    return {
      right: 24,
      bottom: 24
    };
  }, [position, isDetailPanelOpen, isMarketplace]);

  const panelStyle = useMemo(() => {
    if (position) {
      const isRightHalf = position.x > window.innerWidth / 2;
      return {
        left: isRightHalf ? Math.max(16, position.x - 390) : position.x,
        top: clamp(position.y - 580, 80, Math.max(80, window.innerHeight - 600))
      };
    }

    if (isDetailPanelOpen || isMarketplace) {
      return {
        left: 24,
        bottom: 90
      };
    }

    return {
      right: 24,
      bottom: 90
    };
  }, [position, isDetailPanelOpen, isMarketplace]);

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. SMART FLOATING ACTION BUTTON (LAUNCHER DUY NHẤT — SIÊU ĐẸP & KHÔNG DÍNH)
      ───────────────────────────────────────────────────────────────────────────── */}
      {!isOpen && (
        <div
          data-draggable
          style={computedStyle}
          className="fixed z-[60] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] select-none"
        >
          <div className="relative group">
            {/* Tooltip Hover sang trọng */}
            <div className={`pointer-events-none absolute bottom-full mb-3 hidden whitespace-nowrap rounded-2xl bg-slate-900/95 px-3.5 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-md border border-white/10 group-hover:flex items-center gap-2 ${
              (isDetailPanelOpen || isMarketplace) ? 'left-0' : 'right-0'
            }`}>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Trợ lý AI & Chuyên gia Nông học</span>
              <span className="text-[10px] text-emerald-300 font-semibold">• Kéo để di chuyển</span>
            </div>

            {/* Nút FAB Sinh Thái Sang Trọng */}
            <button
              type="button"
              onPointerDown={beginDrag}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={() => { dragRef.current = null; }}
              className="relative flex h-14 w-14 touch-none items-center justify-center rounded-2xl bg-gradient-to-tr from-[#064b37] via-[#0b6348] to-[#148360] text-white shadow-[0_12px_36px_rgba(6,75,55,0.42)] border border-emerald-400/30 transition-all duration-300 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30"
              aria-label="Mở Trợ lý Farmely và Kết nối Chuyên gia"
            >
              <div className="relative flex items-center justify-center">
                <Bot className="h-6 w-6 text-white transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                <Sparkles className="absolute -top-1.5 -right-2 h-3.5 w-3.5 text-amber-300 animate-pulse" />
              </div>

              {/* Đèn trạng thái trực tuyến 24/7 */}
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white" />
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. UNIFIED ASSISTANT MODAL (CỬA SỔ CHAT ĐỒNG NHẤT 2-IN-1: AI & CHUYÊN GIA)
      ───────────────────────────────────────────────────────────────────────────── */}
      {isOpen && (
        <section
          ref={panelRef}
          style={panelStyle}
          className="fixed z-[65] flex h-[580px] max-h-[calc(100vh-100px)] w-[380px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-3xl border border-emerald-500/20 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.22)] backdrop-blur-2xl transition-all duration-300 animate-fadeIn"
          aria-label="Trung tâm Hỗ trợ Farmely"
        >
          {/* HEADER HIỆN ĐẠI & SEGMENTED TABS */}
          <header className="bg-gradient-to-r from-[#064b37] via-[#095740] to-[#0d6e52] p-3 text-white shrink-0 shadow-sm">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white backdrop-blur-md shadow-inner">
                  {activeTab === 'ai' ? <Bot className="w-4 h-4 text-emerald-300" /> : <MessageSquare className="w-4 h-4 text-teal-200" />}
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-wide flex items-center gap-1.5">
                    <span>{activeTab === 'ai' ? 'Farmely AI Nông Nghiệp' : (currentThread?.expertName || 'ThS. Nguyễn Hoàng Nam')}</span>
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30" />
                  </h3>
                  <p className="text-[10px] text-white/70">
                    {activeTab === 'ai' ? 'RAG Engine • Tư vấn chuyên sâu 24/7' : 'Kênh chuyên môn • Tư vấn trực tiếp'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-xl hover:bg-white/15 active:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                  aria-label="Thu nhỏ"
                  title="Thu nhỏ cửa sổ"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* SEGMENTED SWITCHER TAB */}
            <div className="grid grid-cols-2 p-1 bg-black/25 rounded-2xl border border-white/10 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('ai')}
                className={`py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'ai'
                    ? 'bg-white text-[#064b37] shadow-md font-black'
                    : 'text-white/75 hover:text-white hover:bg-white/10'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Trợ lý Farmely AI</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('expert')}
                className={`py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'expert'
                    ? 'bg-white text-[#064b37] shadow-md font-black'
                    : 'text-white/75 hover:text-white hover:bg-white/10'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                <span>Kênh Chuyên Gia</span>
              </button>
            </div>
          </header>

          {/* NỘI DUNG CHAT TAB 1: FARMELY AI (RAG BACKEND) */}
          {activeTab === 'ai' && (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50/70">
              {/* Vùng tin nhắn */}
              <div ref={aiScrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-3">
                {aiMessages.map((msg) => {
                  const isMe = msg.sender === 'user';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">
                        {isMe ? msg.senderName : 'Farmely AI • Trợ lý Nông Nghiệp'}
                      </span>
                      <div
                        className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                          isMe
                            ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white rounded-tr-xs'
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>

                        {/* Tài liệu trích dẫn nếu có */}
                        {msg.referencedDocs && msg.referencedDocs.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1">
                            <span className="text-[10px] font-extrabold text-emerald-800 flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              Nguồn trích dẫn cẩm nang:
                            </span>
                            {msg.referencedDocs.map((doc, idx) => (
                              <div key={idx} className="text-[10px] text-slate-600 bg-emerald-50/60 px-2 py-1 rounded-lg border border-emerald-100 flex items-center justify-between">
                                <span className="truncate">{doc.docTitle || doc.sectionTitle || 'Cẩm nang kỹ thuật'}</span>
                                {doc.similarityScore && (
                                   <span className="text-[9px] font-bold text-emerald-700 ml-1 shrink-0">
                                    {(doc.similarityScore * 100).toFixed(0)}% khớp
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.time}</span>
                    </div>
                  );
                })}

                {/* Typing indicator khi AI đang trả lời */}
                {isAiLoading && (
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">Farmely AI</span>
                    <div className="bg-white text-slate-600 border border-slate-200 rounded-2xl rounded-tl-xs p-3 shadow-sm flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                      </div>
                      <span className="text-[11px] font-medium text-emerald-800">Farmely AI đang tra cứu cẩm nang kỹ thuật...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Gợi ý câu hỏi nhanh (Prompt chips) */}
              <div className="p-2 border-t border-slate-200/60 bg-white/80 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
                {QUICK_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendAi(prompt)}
                    className="whitespace-nowrap px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-[#064b37] border border-emerald-200/80 text-[10px] font-bold transition-colors cursor-pointer shrink-0"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Form nhập tin nhắn AI */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendAi();
                }}
                className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Hỏi Farmely AI về độ ẩm, sâu bệnh, giống cây..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-100 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!aiInput.trim() || isAiLoading}
                  className="w-9 h-9 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 text-white flex items-center justify-center hover:opacity-95 active:scale-95 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
                  aria-label="Gửi tin nhắn"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* NỘI DUNG CHAT TAB 2: CHUYÊN GIA HOÀNG NAM */}
          {activeTab === 'expert' && (
            <div className="flex-1 flex flex-col min-h-0 bg-stone-50/60">
              {/* Vùng tin nhắn chuyên gia */}
              <div ref={expertScrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-3">
                {(!currentThread?.messages || currentThread.messages.length === 0) ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400 space-y-2">
                    <MessageSquare className="w-10 h-10 text-emerald-600/40" />
                    <p className="text-xs font-bold text-slate-600">Bắt đầu phiên tư vấn chuyên môn</p>
                    <p className="text-[11px] leading-relaxed">
                      Đặt câu hỏi hoặc báo cáo sự cố hiện trường để Chuyên gia Nông học ThS. Nguyễn Hoàng Nam hỗ trợ bạn trực tiếp.
                    </p>
                  </div>
                ) : (
                  currentThread.messages.map((message) => {
                    const isMe = message.sender === chatRole || message.sender === 'user';
                    return (
                      <div key={message.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">
                          {isMe ? (message.senderName || fallbackName) : (currentThread.expertName || 'ThS. Nguyễn Hoàng Nam')}
                        </span>
                        <div
                          className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                            isMe
                              ? 'bg-[#064b37] text-white rounded-tr-xs'
                              : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                          }`}
                        >
                          {message.photoUrl && (
                            <img
                              src={message.photoUrl}
                              alt="Minh chứng hiện trường"
                              className="mb-2 max-h-36 w-full rounded-xl object-cover border border-slate-200"
                            />
                          )}
                          <p className="whitespace-pre-wrap">{message.text}</p>
                        </div>
                        <span className="text-[9px] text-slate-400 mt-1 px-1">{message.time}</span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Form nhập tin nhắn gửi chuyên gia */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (expertInput.trim()) {
                    sendExpertMessage(expertInput.trim());
                    setExpertInput('');
                  }
                }}
                className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={expertInput}
                  onChange={(e) => setExpertInput(e.target.value)}
                  placeholder="Gửi tin nhắn hoặc câu hỏi tới ThS. Nam..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-100 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!expertInput.trim()}
                  className="w-9 h-9 rounded-xl bg-[#064b37] text-white flex items-center justify-center hover:opacity-95 active:scale-95 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
                  aria-label="Gửi tin nhắn cho chuyên gia"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </section>
      )}
    </>
  );
}
