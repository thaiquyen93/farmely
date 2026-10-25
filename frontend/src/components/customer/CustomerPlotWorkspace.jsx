import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceArea } from 'recharts';
import { assessMetric, summarizePlot, explainAlert, describeSeries, computeHealthScore, METRIC_RULES } from '../../utils/iotInsights';
import { useSensorStream } from '../../api/monitoring/useSensorStream';
import { fetchLiveAgroIotData, resolveFarmLocation } from '../../services/weatherIotService';
import { resolveStandardCropProcess, getPersistedStaffActivities, recordStaffActivity } from '../../services/cropStandardProcess';
import {
  AlertTriangle, ArrowLeft, BookOpen, CalendarCheck, CalendarRange, Check, ChevronDown, ChevronRight,
  ChevronUp, CircleDot, ClipboardList, Clock, Clock3, Droplets, ExternalLink, Eye, Filter, Info, LayoutDashboard, Leaf,
  MapPin, Maximize2, PenLine, Radio, RefreshCw, Search, ShieldCheck, ShoppingBag, Sparkles, Sprout,
  Sun, Thermometer, Truck, UserRound, Wheat, Wind, X, Camera, CheckCircle2, FileText, Calendar,
  Plus, Trash2, Pencil, ArrowUpRight
} from 'lucide-react';

/* ──────────────────────────────────────────────────────────────────────────
   TINH GỌN 4 TAB CHUẨN:
   1. Tổng quan
   2. Công việc & nhật ký
   3. Dịch vụ
   4. Thu hoạch
   ────────────────────────────────────────────────────────────────────────── */

export const PLOT_TABS = [
  { id: 'overview', label: 'Tổng quan', short: 'Tổng quan', icon: LayoutDashboard },
  { id: 'tasks', label: 'Công việc & nhật ký', short: 'Công việc & nhật ký', icon: CalendarCheck },
  { id: 'services', label: 'Dịch vụ', short: 'Dịch vụ', icon: ShoppingBag },
  { id: 'harvest', label: 'Thu hoạch', short: 'Thu hoạch', icon: Wheat }
];

const METRICS = [
  { key: 'temp', series: 'temp', icon: Thermometer, color: '#f97316' },
  { key: 'soilMoisture', series: 'moisture', icon: Droplets, color: '#0ea5e9' },
  { key: 'airHumidity', series: 'airHumidity', icon: Wind, color: '#06b6d4' },
  { key: 'light', series: 'light', icon: Sun, color: '#eab308' }
].map((m) => ({ ...m, label: METRIC_RULES[m.key].label, unit: METRIC_RULES[m.key].unit }));

const LEVEL_STYLE = {
  OK: { chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', marker: 'bg-emerald-600', hex: '#059669', dot: 'bg-lime-400' },
  LOW: { chip: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200', marker: 'bg-sky-600', hex: '#0284c7', dot: 'bg-sky-400' },
  HIGH: { chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200', marker: 'bg-rose-600', hex: '#e11d48', dot: 'bg-rose-400' },
  UNKNOWN: { chip: 'bg-stone-100 text-stone-600', marker: 'bg-stone-400', hex: '#a8a29e', dot: 'bg-stone-400' }
};

const TIMEFRAMES = [
  { id: 'hourly', label: 'Hôm nay' },
  { id: 'daily', label: '7 ngày' },
  { id: 'weekly', label: '4 tuần' }
];

const CARD_SHADOW = 'shadow-[0_1px_2px_rgba(24,53,43,0.04),0_12px_32px_-16px_rgba(24,53,43,0.22)]';

function Card({ className = '', children, style, onClick }) {
  return (
    <div
      style={style}
      onClick={onClick}
      className={`rounded-3xl border border-white/80 bg-white ${CARD_SHADOW} ${className}`}
    >
      {children}
    </div>
  );
}

const polar = (cx, cy, r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};

const arcPath = (cx, cy, r, start, end) => {
  const [x1, y1] = polar(cx, cy, r, start);
  const [x2, y2] = polar(cx, cy, r, end);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${end - start > 180 ? 1 : 0} 1 ${x2} ${y2}`;
};

function ArcGauge({ position, color, levelColor, children }) {
  const START = 150;
  const SWEEP = 240;
  const at = (p) => START + SWEEP * p;
  const valueEnd = position === null ? START : at(position);
  const [mx, my] = polar(60, 60, 46, valueEnd);
  return (
    <div className="relative mx-auto h-[118px] w-[150px]" aria-hidden="true">
      <svg viewBox="0 0 120 104" className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id={`g-${color}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.55" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <path d={arcPath(60, 60, 46, START, START + SWEEP)} stroke="#eef1ec" strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d={arcPath(60, 60, 46, at(0.25), at(0.75))} stroke="#bbf7d0" strokeWidth="10" fill="none" />
        {position !== null && (
          <>
            <path d={arcPath(60, 60, 46, START, Math.max(START + 0.1, valueEnd))} stroke={`url(#g-${color})`} strokeWidth="10" fill="none" strokeLinecap="round" className="transition-all duration-700" />
            <circle cx={mx} cy={my} r="7.5" fill="#fff" stroke={levelColor} strokeWidth="3" />
          </>
        )}
      </svg>
      <div className="absolute inset-x-6 top-[44px] flex flex-col items-center text-center">{children}</div>
    </div>
  );
}

function SectionTitle({ eyebrow, title, action }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">{eyebrow}</p>}
        <h3 className="mt-0.5 font-heading text-lg font-bold text-[#18352b]">{title}</h3>
      </div>
      {action}
    </div>
  );
}

function LinkButton({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} className="flex shrink-0 items-center gap-0.5 rounded-lg px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
      {children}<ChevronRight className="h-4 w-4" />
    </button>
  );
}

function EmptyState({ icon: Icon = Leaf, title, note }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-200 bg-stone-50/60 px-4 py-10 text-center">
      <Icon className="h-8 w-8 text-stone-300" />
      <p className="mt-3 text-sm font-semibold text-stone-700">{title}</p>
      {note && <p className="mt-1 max-w-xs text-xs text-stone-500">{note}</p>}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   HÀM TIỆN ÍCH LẤY NGÀY & GIỜ THỜI GIAN THỰC (REAL-TIME)
   ────────────────────────────────────────────────────────────────────────── */
export const getNowFormattedDate = () => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  let s = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const dt = new Date(s);
    if (!isNaN(dt.getTime())) {
      const d = String(dt.getDate()).padStart(2, '0');
      const mon = String(dt.getMonth() + 1).padStart(2, '0');
      const y = dt.getFullYear();
      return `${d}/${mon}/${y}`;
    }
  }
  return s.replace(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g, (match, y, m, d) => {
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  });
};

export const convertViDateToIso = (dateStr) => {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  if (!str) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const matchVi = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (matchVi) {
    const d = matchVi[1].padStart(2, '0');
    const m = matchVi[2].padStart(2, '0');
    const y = matchVi[3];
    return `${y}-${m}-${d}`;
  }
  const dt = new Date(str);
  if (!isNaN(dt.getTime())) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return '';
};

export const getPlotStartDateIso = (plot) => {
  if (!plot) return '';
  const raw = String(plot.startDate || plot.start_date || '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const matchVi = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (matchVi) {
    return `${matchVi[3]}-${matchVi[2].padStart(2, '0')}-${matchVi[1].padStart(2, '0')}`;
  }
  const dt = new Date(raw);
  if (!isNaN(dt.getTime())) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return '';
};

export const getNowFormattedTime = () => {
  const d = new Date();
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const period = h < 12 ? 'sáng nay' : (h < 18 ? 'chiều nay' : 'tối nay');
  return `${String(h).padStart(2, '0')}:${m} ${period}`;
};

/* ──────────────────────────────────────────────────────────────────────────
   DỮ LIỆU MẶC ĐỊNH CHUẨN CỦA "CÔNG VIỆC & NHẬT KÝ" THEO ẢNH div.dashboard-readable.jpg
   Được kết hợp và đồng bộ với Database /api/tasks & /api/diary
   ────────────────────────────────────────────────────────────────────────── */

export const INITIAL_TODAY_TASK = {
  id: 'TASK-TODAY-08',
  stepNumber: 8,
  dateFormatted: '23/10/2026',
  timeFormatted: '08:30 sáng nay',
  title: 'Tưới nhỏ giọt & Bổ sung vi lượng Kali hữu cơ',
  description: 'Pha Kali trơ đũa 1.5% qua hệ thống béc nhỏ giọt tự động. Kiểm tra độ ẩm luống đất đạt chuẩn 68%.',
  workerName: 'Trần Văn Lực',
  statusText: 'Đã xong',
  isDone: true,
  photos: [
    'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=600&q=80'
  ],
  gpsLocation: 'luống P-01',
  soilTemp: '28.5 °C',
  soilMoisture: '68.0 %',
  light: '45.000 Lux'
};

export const INITIAL_UPCOMING_STEPS = [
  {
    id: 'UP-09',
    stepNumber: 9,
    scheduleText: 'Ngày 40 (25/10) • còn 2 ngày',
    title: 'Cắt tỉa lá già, lá úa sát gốc đón nắng',
    description: 'Tỉa sạch tầng lá già sát mặt luống tránh đọng sương nấm bệnh, rọi nắng đều chùm quả.',
    isFinish: false
  },
  {
    id: 'UP-10',
    stepNumber: 10,
    scheduleText: 'Ngày 42 (27/10) • còn 4 ngày',
    title: 'Treo bẫy Pheromone sinh học ngừa ruồi đục quả',
    description: 'Bẫy dính thảo mộc tự nhiên 100% không hóa chất, bảo vệ quả an toàn trước thu hái.',
    isFinish: false
  },
  {
    id: 'UP-11',
    stepNumber: 11,
    scheduleText: 'Ngày 43 (28/10) • còn 5 ngày',
    title: 'Ngừng tưới 24h & Đo độ ngọt Brix kiểm nghiệm',
    description: 'Đo độ ngọt bằng khúc xạ kế quang học (Brix ≥ 9.5%) nghiệm thu trước khi cắt cành.',
    isFinish: false
  },
  {
    id: 'UP-12',
    stepNumber: 12,
    scheduleText: 'Dự kiến: 30/10',
    title: 'Thu hoạch quả & Đóng khay giao tận nhà',
    description: 'Hái lúc 06:30 - 08:30 sáng giữ nguyên cuống xanh tươi, cân đối chứng và giao trong ngày.',
    isFinish: true
  }
];

export const INITIAL_COMPLETED_STEPS = [
  {
    id: 'COMP-01',
    stepNumber: 1,
    dateFormatted: '15/09/2026',
    workerName: 'Trần Văn Lực',
    title: 'Gieo ươm cây con, che lưới đen 50% thích nghi giá thể',
    description: 'Hạ bầu ươm 25 cây giống F1 vào 150m² luống đất chuẩn bị sẵn tại khu A Happy Valley Củ Chi.',
    completedTime: '07:15 • 15/09/2026'
  },
  {
    id: 'COMP-02',
    stepNumber: 2,
    dateFormatted: '20/09/2026',
    workerName: 'Trần Văn Lực',
    title: 'Bón lót phân trùn quế & Tưới kích rễ Humic loãng',
    description: 'Rễ non bén đất, cây hồi xanh cứng cáp, bắt đầu bung lá thật thứ 3.',
    completedTime: '08:30 • 20/09/2026'
  },
  {
    id: 'COMP-03',
    stepNumber: 3,
    dateFormatted: '25/09/2026',
    workerName: 'Trần Văn Lực',
    title: 'Vặt tỉa chồi nách phụ dưới lá số 5 nuôi thân chính',
    description: 'Loại bỏ chồi nách phụ mọc sớm để dồn dinh dưỡng nuôi thân mập khỏe.',
    completedTime: '09:00 • 25/09/2026'
  },
  {
    id: 'COMP-04',
    stepNumber: 4,
    dateFormatted: '01/10/2026',
    workerName: 'Trần Văn Lực',
    title: 'Cắm cọc tre & Buộc dây treo ngọn lên giàn thẳng đứng',
    description: 'Định hình cây cà chua thẳng đứng bằng móc treo, cây cao 60cm, tán lá đều.',
    completedTime: '15:30 • 01/10/2026',
    proofPhoto: 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'COMP-05',
    stepNumber: 5,
    dateFormatted: '07/10/2026',
    workerName: 'Trần Văn Lực',
    title: 'Rung hoa trợ phấn bằng quạt gió nhà màng & Bón thúc đợt 2',
    description: 'Tưới gốc phân hữu cơ dịch chuối ủ EM loãng bổ sung Canxi-Bo chống rụng hoa.',
    completedTime: '08:15 • 07/10/2026',
    proofPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    sensorSnapshot: { temp: '26.5°C', humidity: '68%' }
  },
  {
    id: 'COMP-06',
    stepNumber: 6,
    dateFormatted: '13/10/2026',
    workerName: 'Trần Văn Lực',
    title: 'Phun chế phẩm sinh học thảo mộc dầu Neem & tỏi ớt ngừa sâu',
    description: 'Phun phòng rầy mềm và bọ trĩ bằng chế phẩm sinh học 100% thảo mộc hữu cơ. Cách ly 0 ngày, an toàn thiên địch.',
    photoCount: 1,
    proofPhoto: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80',
    completedTime: '16:00',
    sensorSnapshot: { temp: '29.0°C', humidity: '70%' }
  },
  {
    id: 'COMP-07',
    stepNumber: 7,
    dateFormatted: '19/10/2026',
    workerName: 'Trần Văn Lực',
    title: 'Tỉa chồi nách, nhánh phụ & Cố định thân leo thẳng đứng',
    description: 'Vận hành quạt đối lưu nhẹ lúc 08:30 sáng trợ phân hoa chín, tỉa bỏ hoa dị hình giữ lại 8-10 quả đều đẹp trên chùm.',
    photoCount: 1,
    proofPhoto: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=600&q=80',
    completedTime: '09:15',
    sensorSnapshot: { temp: '27.8°C', humidity: '65%' }
  }
];

/* ──────────────────────────────────────────────────────────────────────────
   1. TAB TỔNG QUAN (CHÍNH XÁC THEO ẢNH VƯỜN CỦA TÔI.jpg)
   ────────────────────────────────────────────────────────────────────────── */

function OverviewTab({
  plot,
  cropProcess,
  goTab,
  onOpenStageDetail,
  onOpenIotChart,
  liveProviderInfo,
  isSelf
}) {
  const isSelfGrowing = isSelf ?? (plot.mode === 'Self-Growing' || plot.mode === 'SELF' || String(plot.mode || '').toLowerCase().includes('self') || String(plot.farmingPackage || '').toLowerCase().includes('tự'));

  // 5 mốc quy trình chuẩn VietGAP theo đúng Hình 2 (vietgap_vertical_timeline.html)
  const VIETGAP_STAGES = [
    {
      id: 5,
      name: 'Thu hoạch đạt chuẩn VietGAP & Đóng gói',
      label: 'Ngày 43 – 45',
      desc: 'Vặt sạch toàn bộ chồi phụ ở nách lá, chỉ giữ 1 thân chính duy nhất. Bón thúc NPK hữu cơ 20–20–15 quanh tán cây. Minh chứng: Ảnh nách lá sau khi vặt sạch chồi',
      specs: [
        { label: 'Thời gian cách ly:', value: 'Đảm bảo ngưng mọi loại phân bón lá tối thiểu 7 ngày trước khi thu hái.' },
        { label: 'Tiêu chuẩn thu hoạch:', value: 'Cắt nguyên chùm hoặc quả rời còn đài xanh tươi, độ Brix đạt ≥ 7.5%.' },
        { label: 'Truy xuất nguồn gốc:', value: 'Dán tem QR lô thu hoạch trực tiếp lên khay đóng gói thoáng khí.' }
      ],
      isCurrent: false,
      isDone: false
    },
    {
      id: 4,
      name: 'Nuôi quả lớn & Chuyển màu chín',
      label: 'Ngày 36 – 42',
      desc: 'Cắm cọc tre cao 1.8m hoặc buộc dây treo trần nhà lưới. Quấn thân cà chua theo dây. Vặt bỏ các lá già sát đất. Minh chứng: Ảnh giàn cọc & thân cây quấn dây',
      specs: [
        { label: 'Tỉa lá chân:', value: 'Loại bỏ toàn bộ lá già dưới chùm quả đầu tiên để thông thoáng gió, giảm nấm bệnh.' },
        { label: 'Tăng độ ngọt (Brix):', value: 'Bổ sung Kali hữu cơ từ dịch chuối ủ vi sinh, giảm lượng nước tưới 15% khi quả bắt đầu ửng đỏ.' }
      ],
      isCurrent: true,
      isDone: false
    },
    {
      id: 3,
      name: 'Phân hóa mầm hoa & Thụ phấn đậu quả',
      label: 'Ngày 23 – 35',
      desc: 'Tưới phân kích rễ Humic + đạm cá loãng. Kiểm tra độ ẩm đất duy trì 65–75%. Minh chứng: Ảnh rễ phát triển đọt non vươn cao',
      specs: [
        { label: 'Dinh dưỡng:', value: 'Bổ sung Bo-Canxi hữu cơ giúp cuống hoa dai, tăng tỷ lệ đậu quả chùm trên 90%.' },
        { label: 'Hỗ trợ thụ phấn:', value: 'Rung dây cáp nhẹ vào khung giờ 8h30 – 10h00 sáng khi phấn hoa khô ráo.' },
        { label: 'Yêu cầu nhật ký:', value: 'Chụp ảnh chùm hoa thứ 1 và thứ 2 cập nhật lên hệ thống Farmely.' }
      ],
      isCurrent: false,
      isDone: true
    },
    {
      id: 2,
      name: 'Phát triển thân lá & Định hình khung tán',
      label: 'Ngày 8 – 22',
      desc: 'Cấy cây con 4 lá thật mật độ 50×70cm. Cắm que tre nhỏ định vị thân mềm tránh gió lay đổ ngã. Tưới đẫm nước. Minh chứng: Ảnh hàng cây con cắm que định vị',
      specs: [
        { label: 'Khoảng cách trồng:', value: 'Hàng cách hàng 70cm, cây cách cây 50cm (khoảng 2.500 cây/1.000m²).' },
        { label: 'Cố định thân:', value: 'Dùng dây nilon mềm buộc lỏng hình số 8 vào que định vị cao 40cm.' },
        { label: 'Phòng bệnh sinh học:', value: 'Phun ngừa dịch tỏi ớt gừng định kỳ 7 ngày/lần.' }
      ],
      isCurrent: false,
      isDone: true
    },
    {
      id: 1,
      name: 'Gieo ươm & Hồi xanh rễ non',
      label: 'Ngày 1 – 7',
      desc: 'Đào hố sâu 25cm bón lót phân chuồng hoai 2kg/gốc + vôi bột khử chua + lân super + Trichoderma ngừa héo rũ gốc. Minh chứng: Ảnh hố bón lót & rãnh luống sâu',
      specs: [
        { label: 'Độ pH đất yêu cầu:', value: '6.0 – 6.8 (xử lý vôi bột trước 7-10 ngày).' },
        { label: 'Nhiệt độ bầu ươm:', value: 'Duy trì 22°C – 26°C, che lưới đen cắt nắng 50% trong 3 ngày đầu.' },
        { label: 'Tưới nước:', value: 'Tưới phun sương mịn 2 lần/ngày vào sáng sớm và chiều mát.' }
      ],
      isCurrent: false,
      isDone: true
    }
  ];

  const timelineStages = cropProcess?.stages?.length ? cropProcess.stages : VIETGAP_STAGES;

  const [openGuideIds, setOpenGuideIds] = useState(new Set());
  const toggleGuide = (id) => {
    setOpenGuideIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const allExpanded = openGuideIds.size === timelineStages.length;
  const toggleAllGuides = () => {
    if (allExpanded) {
      setOpenGuideIds(new Set());
    } else {
      setOpenGuideIds(new Set(timelineStages.map((s) => s.id)));
    }
  };

  return (
    <div className="space-y-6">
      {/* QUY TRÌNH CANH TÁC CHUẨN VIETGAP (vietgap_vertical_timeline.html - Không đóng khung, nằm trực tiếp trên nền) */}
      <section id="vietgap-timeline-component" aria-label="Quy trình canh tác chuẩn" className="w-full">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 gap-3 border-b border-stone-200/80">
          <div>
            {isSelfGrowing && (
              <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Quy trình này khách hàng có thể tham khảo trải nghiệm</span>
              </div>
            )}
            <p className="text-xs sm:text-[13px] font-semibold uppercase tracking-[0.12em] text-[#168052] mb-1.5">
              TIẾN TRÌNH CHUẨN THEO NGÀY TUỔI • {cropProcess?.cropName?.toUpperCase() || plot.crop?.toUpperCase() || 'CÀ CHUA BI CHERRY F1'}
            </p>
            <h2 className="font-heading text-2xl sm:text-[27px] font-bold text-[#0D3B26] tracking-tight leading-tight">
              Quy trình canh tác chuẩn
            </h2>
          </div>

          <button
            type="button"
            onClick={toggleAllGuides}
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[#168052] hover:text-emerald-800 transition-colors self-start sm:self-end shrink-0 cursor-pointer"
          >
            <span>{allExpanded ? 'Thu gọn toàn bộ quy trình' : 'Xem toàn bộ quy trình'}</span>
            <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${allExpanded ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
          </button>
        </div>

        {/* Danh sách Timeline Dọc (Không viền, không hộp) */}
        <div className="relative pl-8 sm:pl-12 mt-6">
          {/* Đường kẻ dọc gradient */}
          <div className="absolute left-[7px] sm:left-[9px] top-2.5 bottom-2 w-[1.5px] bg-gradient-to-b from-[#B8E6D0] via-[#10B981] to-[#B8E6D0]" />

          {timelineStages.map((st, idx) => {
            const isOpen = openGuideIds.has(st.id);
            const isLast = idx === timelineStages.length - 1;
            return (
              <article key={st.id} className={`relative group ${isLast ? 'pb-2' : 'pb-10'}`}>
                {/* Chấm tròn (Node) */}
                <span
                  className={`absolute -left-8 sm:-left-12 top-1.5 w-4 h-4 sm:w-[19px] sm:h-[19px] rounded-full bg-[#10B981] border-[3.5px] border-[#F6F9F5] shadow-xs transition-all duration-300 z-10 group-hover:scale-125 ${
                    st.isCurrent ? 'ring-4 ring-emerald-200/80 animate-pulse' : ''
                  }`}
                />

                <div className="flex flex-col">
                  {/* Hàng Tiêu đề & Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <h3
                      onClick={() => toggleGuide(st.id)}
                      className="font-heading text-lg sm:text-[19px] font-bold text-[#0D3B26] group-hover:text-[#168052] transition-colors cursor-pointer"
                    >
                      {st.name}
                    </h3>
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#15803D] tracking-wide">
                      {st.label}
                    </span>
                  </div>

                  {/* Mô tả */}
                  <p className="text-[14.5px] text-[#4A5D52] leading-relaxed max-w-4xl mb-2.5">
                    {st.desc || st.guide}
                  </p>

                  {/* Link Hành động Accordion */}
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleGuide(st.id)}
                      className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#168052] hover:text-emerald-700 transition-colors group/link cursor-pointer"
                    >
                      <span>{isOpen ? 'Thu gọn cẩm nang' : 'Xem cẩm nang kỹ thuật'}</span>
                      <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : 'group-hover/link:translate-x-0.5'}`} />
                    </button>
                  </div>

                  {/* Phần mở rộng kỹ thuật chuẩn VietGAP */}
                  <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100 pt-3 mt-1' : 'max-h-0 opacity-0'}`}>
                    <div className="pl-4 border-l-2 border-emerald-400 text-sm text-[#4A5D52] space-y-1.5 bg-white/70 backdrop-blur-xs rounded-r-2xl py-3 pr-3 max-w-4xl">
                      <p className="font-semibold text-[#0D3B26]">Thông số kỹ thuật chuẩn VietGAP:</p>
                      {(st.specs || []).map((sp, sIdx) => (
                        <p key={sIdx}>
                          • <span className="font-medium text-[#0D3B26]">{sp.label}</span> {sp.value}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* KHỐI 2: MÔI TRƯỜNG VI KHÍ HẬU QUANH CÂY (4 ĐỒNG HỒ ARC GAUGE) */}
      <section aria-label="Môi trường vi khí hậu quanh cây" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="font-heading text-lg font-bold text-[#18352b]">
              Môi trường vi khí hậu quanh cây
            </h3>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 shadow-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              Trực tiếp từ Open-Meteo Agro API (Củ Chi Station: {liveProviderInfo?.coordinates || '10.6877°N, 106.3503°E'})
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenIotChart}
            className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition cursor-pointer"
          >
            Xem biểu đồ <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* 4 Card Gauge chuẩn thiết kế như trong ảnh */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* 1. Nhiệt độ */}
          <div className={`rounded-3xl border border-white/80 bg-white p-4 ${CARD_SHADOW}`}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold text-stone-700">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500 text-white">
                  <Thermometer className="h-4 w-4" />
                </span>
                Nhiệt độ
              </span>
              <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11px] font-bold ring-1 ring-emerald-200">
                Trong ngưỡng
              </span>
            </div>
            <div className="mt-2 text-center">
              <ArcGauge position={0.45} color="#f97316" levelColor="#059669">
                <span className="text-xl font-extrabold text-[#18352b] block">{plot.temp || '25.4°C'}</span>
                <span className="text-[10px] text-emerald-700 font-semibold block mt-1">An toàn 18–32</span>
              </ArcGauge>
            </div>
            <p className="text-xs text-center text-stone-600 mt-1">
              Nhiệt độ dễ chịu, cây phát triển bình thường.
            </p>
          </div>

          {/* 2. Độ ẩm đất */}
          <div className={`rounded-3xl border border-white/80 bg-white p-4 ${CARD_SHADOW}`}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold text-stone-700">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500 text-white">
                  <Droplets className="h-4 w-4" />
                </span>
                Độ ẩm đất
              </span>
              <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11px] font-bold ring-1 ring-emerald-200">
                Trong ngưỡng
              </span>
            </div>
            <div className="mt-2 text-center">
              <ArcGauge position={0.52} color="#0ea5e9" levelColor="#059669">
                <span className="text-xl font-extrabold text-[#18352b] block">{plot.soilMoisture || '67%'}</span>
                <span className="text-[10px] text-emerald-700 font-semibold block mt-1">An toàn 60–75</span>
              </ArcGauge>
            </div>
            <p className="text-xs text-center text-stone-600 mt-1">
              Đất đủ ẩm, cây không cần tưới thêm lúc này.
            </p>
          </div>

          {/* 3. Độ ẩm không khí */}
          <div className={`rounded-3xl border border-white/80 bg-white p-4 ${CARD_SHADOW} flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-stone-700">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-600 text-white">
                    <Wind className="h-4 w-4" />
                  </span>
                  Độ ẩm không khí
                </span>
                <span className="rounded-full bg-rose-50 text-rose-700 px-2 py-0.5 text-[11px] font-bold ring-1 ring-rose-200">
                  Vượt ngưỡng
                </span>
              </div>
              <div className="mt-2 text-center">
                <ArcGauge position={0.92} color="#06b6d4" levelColor="#e11d48">
                  <span className="text-xl font-extrabold text-[#18352b] block">{plot.airHumidity || '97%'}</span>
                  <span className="text-[10px] text-emerald-700 font-semibold block mt-1">An toàn 55–85</span>
                </ArcGauge>
              </div>
              <p className="text-xs text-center text-stone-600 mt-1">
                Không khí rất ẩm, dễ phát sinh nấm bệnh trên lá.
              </p>
            </div>
            <div className="mt-3 rounded-xl bg-stone-50 p-2 border border-stone-200/70 text-[11px] text-stone-700 flex items-start gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Farmely sẽ tỉa bớt lá cho thông thoáng và theo dõi nấm bệnh.</span>
            </div>
          </div>

          {/* 4. Ánh sáng */}
          <div className={`rounded-3xl border border-white/80 bg-white p-4 ${CARD_SHADOW} flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-stone-700">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white">
                    <Sun className="h-4 w-4" />
                  </span>
                  Ánh sáng
                </span>
                <span className="rounded-full bg-sky-50 text-sky-700 px-2 py-0.5 text-[11px] font-bold ring-1 ring-sky-200">
                  Dưới ngưỡng
                </span>
              </div>
              <div className="mt-2 text-center">
                <ArcGauge position={0.05} color="#eab308" levelColor="#0284c7">
                  <span className="text-xl font-extrabold text-[#18352b] block">{plot.light || '0 Lux'}</span>
                  <span className="text-[10px] text-emerald-700 font-semibold block mt-1">An toàn 20–60</span>
                </ArcGauge>
              </div>
              <p className="text-xs text-center text-stone-600 mt-1">
                Cây đang thiếu nắng, có thể vươn cao và lá nhạt màu.
              </p>
            </div>
            <div className="mt-3 rounded-xl bg-stone-50 p-2 border border-stone-200/70 text-[11px] text-stone-700 flex items-start gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Farmely sẽ tỉa cây che bóng xung quanh thửa nếu cần.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   2. TAB CÔNG VIỆC & NHẬT KÝ (CHÍNH XÁC THEO ẢNH div.dashboard-readable.jpg)
   ────────────────────────────────────────────────────────────────────────── */

function TasksAndDiaryTab({
  plot,
  cropProcess,
  todayTask,
  upcomingSteps,
  completedSteps,
  onOpenAllProofs,
  onOpenSinglePhoto,
  isSelf = false,
  onOpenAddTask,
  onOpenEditTask,
  onDeleteTask,
  onToggleTaskDone,
  onToggleTodayDone,
  onDeleteTodayTask,
  onPromoteNextTask,
  onOpenAddDiary,
  onOpenEditDiary,
  onDeleteDiary
}) {
  const [diaryCollapsed, setDiaryCollapsed] = useState(false);
  const [upcomingCollapsed, setUpcomingCollapsed] = useState(false);
  const [expandedStepProof, setExpandedStepProof] = useState('COMP-07');

  return (
    <div className="space-y-6">
      {/* THANH THAO TÁC TRÊN CÙNG (CHỈ HIỆN NÚT TẠO KHI TỰ CANH TÁC) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {isSelf ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenAddTask}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Thêm công việc mới
            </button>
            <button
              type="button"
              onClick={onOpenAddDiary}
              className="flex items-center gap-1.5 rounded-xl bg-white border border-emerald-300 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-xs hover:bg-emerald-50 transition cursor-pointer"
            >
              <PenLine className="h-4 w-4 text-emerald-700" />
              Viết nhật ký trải nghiệm
            </button>
          </div>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={onOpenAllProofs}
          className="flex items-center gap-2 rounded-xl bg-white border border-stone-200 px-4 py-2 text-xs font-bold text-stone-700 shadow-xs hover:bg-stone-50 hover:border-emerald-300 hover:text-emerald-800 transition cursor-pointer"
        >
          <Camera className="h-4 w-4 text-emerald-700" />
          Mở xem tất cả ảnh minh chứng
        </button>
      </div>

      {/* HAI CỘT TRÊN: HÔM NAY (TRÁI) & KẾ HOẠCH TIẾP THEO (PHẢI) */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* CỘT TRÁI: KẾ HOẠCH MỚI NHẤT • 23/10/2026 • BƯỚC 8 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`flex items-center gap-1.5 text-xs font-extrabold uppercase ${
              isSelf && (!todayTask || todayTask.id === 'EMPTY-TODAY' || todayTask.title === 'Chưa có công việc hôm nay' || todayTask.title === 'Chưa có kế hoạch mới nhất')
                ? 'text-stone-500'
                : 'text-amber-700'
            }`}>
              <span className={`h-2 w-2 rounded-full ${
                isSelf && (!todayTask || todayTask.id === 'EMPTY-TODAY' || todayTask.title === 'Chưa có công việc hôm nay' || todayTask.title === 'Chưa có kế hoạch mới nhất')
                  ? 'bg-stone-400'
                  : 'bg-amber-500'
              }`} />
              KẾ HOẠCH MỚI NHẤT{
                todayTask && todayTask.id !== 'EMPTY-TODAY' && todayTask.title !== 'Chưa có công việc hôm nay' && todayTask.title !== 'Chưa có kế hoạch mới nhất' && (todayTask.dueDate || todayTask.dateFormatted)
                  ? ` • ${formatDisplayDate(todayTask.dueDate || todayTask.dateFormatted)}`
                  : (!isSelf ? ' • 23/10/2026' : '')
              }
            </span>
            {isSelf && (!todayTask || todayTask.id === 'EMPTY-TODAY' || todayTask.title === 'Chưa có công việc hôm nay' || todayTask.title === 'Chưa có kế hoạch mới nhất') ? (
              <span className="rounded-full bg-stone-100 text-stone-500 border border-stone-200 px-2.5 py-0.5 text-xs font-semibold">
                CHƯA CÓ VIỆC
              </span>
            ) : (
              <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-0.5 text-xs font-bold">
                BƯỚC {todayTask.stepNumber}
              </span>
            )}
          </div>

          {isSelf && (!todayTask || todayTask.id === 'EMPTY-TODAY' || todayTask.title === 'Chưa có công việc hôm nay' || todayTask.title === 'Chưa có kế hoạch mới nhất') ? (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50/80 p-6 text-center space-y-3.5 shadow-xs">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-base text-stone-800">
                  Chưa có kế hoạch mới nhất
                </h4>
                <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                  Hiện chưa có lịch canh tác đang chờ thực hiện. Bạn có thể nhấn "+ Thêm công việc mới" để tự tạo bước canh tác.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onOpenAddTask}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Thêm công việc mới
                </button>
                {upcomingSteps.length > 0 && (
                  <button
                    type="button"
                    onClick={onPromoteNextTask}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-stone-300 px-3.5 py-2 text-xs font-bold text-stone-700 shadow-xs hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition cursor-pointer"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" /> Đưa Bước {upcomingSteps[0].stepNumber} lên thực hiện
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-stone-200/90 bg-white p-5 shadow-sm space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200/50">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-heading font-bold text-base text-[#18352b] leading-snug">
                      {todayTask.title}
                    </h4>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSelf ? (
                        <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200 whitespace-nowrap">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" /> {todayTask.statusText || 'Đang thực hiện'}
                        </span>
                      ) : (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200 whitespace-nowrap">
                          <Check className="h-3.5 w-3.5 stroke-[2.5] text-emerald-600" /> {todayTask.statusText}
                        </span>
                      )}
                      {isSelf && (
                        <div className="flex items-center gap-1">
                          {todayTask.title !== 'Chưa có công việc hôm nay' && (
                            <button
                              type="button"
                              title="Đánh dấu hoàn thành (chuyển xuống nhật ký)"
                              onClick={() => onToggleTodayDone?.()}
                              className="p-1 rounded-md text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                            </button>
                          )}
                          <button
                            type="button"
                            title="Chỉnh sửa công việc hôm nay"
                            onClick={() => onOpenEditTask?.({ ...todayTask, isToday: true })}
                            className="p-1 rounded-md text-stone-400 hover:text-emerald-700 hover:bg-stone-100 transition cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {todayTask.title !== 'Chưa có công việc hôm nay' && (
                            <button
                              type="button"
                              title="Xóa công việc hôm nay"
                              onClick={() => onDeleteTodayTask ? onDeleteTodayTask() : onDeleteTask?.(todayTask.id || 'today')}
                              className="p-1 rounded-md text-stone-400 hover:text-rose-600 hover:bg-stone-100 transition cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-stone-600 leading-relaxed">
                    {todayTask.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-500 border-t border-stone-100 pt-3">
                <span className="flex items-center gap-1.5">
                  {isSelf ? (
                    <>
                      <Calendar className="h-3.5 w-3.5 text-stone-400" />
                      Ngày {formatDisplayDate(todayTask?.dueDate || todayTask?.dateFormatted)} • Chủ vườn <strong className="text-stone-700">Tự thực hiện</strong>
                    </>
                  ) : (
                    <>
                      <Clock className="h-3.5 w-3.5 text-stone-400" />
                      {todayTask.timeFormatted} • KTV <strong className="text-stone-700">{todayTask.workerName}</strong>
                    </>
                  )}
                </span>
                {isSelf ? (
                  <button
                    type="button"
                    onClick={() => onToggleTodayDone?.()}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" /> Hoàn thành bước này
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-stone-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    KTV đang thực hiện
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CỘT PHẢI: KẾ HOẠCH TIẾP THEO (4 BƯỚC) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase text-[#18352b]">
              <CalendarCheck className="h-4 w-4 text-emerald-700" />
              KẾ HOẠCH TIẾP THEO ({upcomingSteps.length} BƯỚC)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUpcomingCollapsed(!upcomingCollapsed)}
                className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-emerald-800 rounded-lg bg-white border border-stone-200/80 px-2.5 py-1.5 shadow-2xs transition cursor-pointer select-none"
              >
                {upcomingCollapsed ? (
                  <>Mở rộng kế hoạch <ChevronDown className="h-3.5 w-3.5" /></>
                ) : (
                  <>Thu gọn kế hoạch <ChevronUp className="h-3.5 w-3.5" /></>
                )}
              </button>
            </div>
          </div>

          {!upcomingCollapsed && (
            upcomingSteps.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-stone-200 bg-stone-50/60 p-6 text-center space-y-2">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <h5 className="font-bold text-sm text-stone-700">Chưa có kế hoạch tiếp theo</h5>
                <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
                  {isSelf
                    ? 'Bạn chưa tạo bước kế hoạch nào. Nhấn "+ Thêm công việc mới" để lên kế hoạch các ngày tới.'
                    : 'KTV chưa lên lịch cho các bước tiếp theo.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingSteps.map((step, idx) => {
                const isFinish = step.isFinish;
                return (
                  <div
                    key={step.id || idx}
                    className={`rounded-2xl p-4 border transition ${
                      isFinish
                        ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-200'
                        : 'bg-white border-stone-200/80 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-0.5 text-[11px] font-bold">
                        {isFinish ? `BƯỚC ${step.stepNumber} • VỀ ĐÍCH` : `BƯỚC ${step.stepNumber}`}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-semibold ${isFinish ? 'text-emerald-800' : 'text-stone-500'}`}>
                          {formatDisplayDate(step.scheduleText)}
                        </span>
                        {isSelf && (
                          <div className="flex items-center gap-1 border-l border-stone-200 pl-2">
                            <button
                              type="button"
                              title="Đánh dấu hoàn thành"
                              onClick={() => onToggleTaskDone?.(step)}
                              className="p-1 rounded-md text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                            </button>
                            <button
                              type="button"
                              title="Chỉnh sửa công việc"
                              onClick={() => onOpenEditTask?.(step)}
                              className="p-1 rounded-md text-stone-400 hover:text-emerald-700 hover:bg-stone-100 transition cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Xóa công việc"
                              onClick={() => onDeleteTask?.(step.id)}
                              className="p-1 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <h5 className={`mt-1.5 font-bold text-sm leading-snug ${
                      isFinish ? 'text-emerald-950 flex items-center gap-1.5' : 'text-[#18352b]'
                    }`}>
                      {isFinish && <Sprout className="h-4 w-4 text-emerald-700 shrink-0" />}
                      {step.title}
                    </h5>

                    <p className="mt-1 text-xs text-stone-600 leading-relaxed line-clamp-2">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
            )
          )}
        </div>
      </div>

      {/* KHỐI DƯỚI: NHẬT KÝ CÁC BƯỚC ĐÃ HOÀN THÀNH - BỎ KHUNG TRẮNG */}
      <div className="pt-3 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-700" />
            <h4 className="font-heading font-bold text-base text-[#18352b]">
              NHẬT KÝ CÁC BƯỚC ĐÃ HOÀN THÀNH ({completedSteps.length} BƯỚC TRƯỚC)
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setDiaryCollapsed(!diaryCollapsed)}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-emerald-800 rounded-lg bg-white border border-stone-200/80 px-3 py-1.5 shadow-2xs transition cursor-pointer select-none"
          >
            {diaryCollapsed ? (
              <>Mở rộng nhật ký <ChevronDown className="h-3.5 w-3.5" /></>
            ) : (
              <>Thu gọn nhật ký <ChevronUp className="h-3.5 w-3.5" /></>
            )}
          </button>
        </div>

        {!diaryCollapsed && (
          completedSteps.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-200 bg-stone-50/60 p-6 text-center space-y-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                <BookOpen className="h-5 w-5" />
              </div>
              <h5 className="font-bold text-sm text-stone-700">Chưa có bước canh tác nào hoàn thành</h5>
              <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                {isSelf
                  ? 'Khi bạn hoàn thành các công việc hoặc viết nhật ký trải nghiệm, lịch sử canh tác và ảnh minh chứng sẽ được lưu giữ tại đây.'
                  : 'Chưa có nhật ký ghi nhận từ Kỹ thuật viên hiện trường.'}
              </p>
            </div>
          ) : (
            <div className="relative pl-8 space-y-6 before:absolute before:left-[13px] before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-300">
              {[...completedSteps].sort((a, b) => (Number(b.stepNumber) || 0) - (Number(a.stepNumber) || 0)).map((step, idx) => (
              <div key={step.id || idx} className="relative group">
                <div className="absolute -left-6 top-1 h-4.5 w-4.5 rounded-full bg-emerald-600 ring-4 ring-[#F8FAF7] flex items-center justify-center text-white shadow-xs">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>

                <div className="flex items-start justify-between gap-2">
                  <h5 className="font-bold text-sm text-[#18352b] leading-snug">
                    {step.title}
                  </h5>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-0.5 text-xs font-bold">
                      BƯỚC {step.stepNumber}
                    </span>
                    {isSelf && (
                      <div className="flex items-center gap-1 border-l border-stone-200 pl-2">
                        <button
                          type="button"
                          title="Chỉnh sửa nhật ký"
                          onClick={() => onOpenEditDiary?.(step)}
                          className="p-1 rounded-md text-stone-400 hover:text-emerald-700 hover:bg-stone-100 transition cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Xóa nhật ký"
                          onClick={() => onDeleteDiary?.(step)}
                          className="p-1 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-stone-500 mt-0.5">
                  {formatDisplayDate(step.dateFormatted)} • {isSelf ? 'Chủ vườn ' : 'KTV '}<strong className="text-stone-700">{isSelf ? 'Tự thực hiện' : (step.workerName || 'Trần Văn Lực')}</strong>
                </p>

                <p className="mt-1 text-xs text-stone-600 leading-relaxed">
                  {step.description}
                </p>

                {/* Hàng liên kết minh chứng & số liệu môi trường */}
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-2 text-xs">
                  {step.proofPhoto ? (
                    <button
                      type="button"
                      onClick={() => setExpandedStepProof(expandedStepProof === step.id ? null : step.id)}
                      className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      Có {step.photoCount || 1} ảnh minh chứng {expandedStepProof === step.id ? <ChevronUp className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </button>
                  ) : (
                    <span className="text-[11px] text-stone-400">
                      {step.completedTime?.includes('Hoàn thành')
                        ? step.completedTime
                        : (step.completedTime?.includes('/')
                            ? `Hoàn thành ngày ${step.completedTime}`
                            : `Hoàn thành lúc ${step.completedTime || step.dateFormatted}`)}
                    </span>
                  )}

                  {step.sensorSnapshot && (
                    <span className="text-[11px] font-semibold text-stone-500">
                      Nhiệt độ: <strong className="text-stone-700">{step.sensorSnapshot.temp}</strong> • Ẩm: <strong className="text-stone-700">{step.sensorSnapshot.humidity}</strong>
                    </span>
                  )}
                </div>

                {/* Khối hiển thị ảnh minh chứng mở rộng */}
                {expandedStepProof === step.id && step.proofPhoto && (
                  <div className="mt-3 rounded-2xl bg-stone-50 p-3 border border-stone-200 space-y-2 animate-fadeIn">
                    <div className="flex items-center gap-3">
                      <img
                        src={step.proofPhoto}
                        alt="Bằng chứng hiện trường"
                        onClick={() => onOpenSinglePhoto(step.proofPhoto)}
                        className="h-20 w-24 rounded-xl object-cover border border-stone-200 cursor-pointer shadow-xs hover:opacity-90 transition"
                      />
                      <div className="text-xs space-y-1">
                        <p className="font-bold text-emerald-900 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-emerald-700" />
                          Nhật ký đã xác thực GPS tại luống {plot.plotCode || 'P-01'}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          Ghi nhận lúc: {step.completedTime || '09:15 • ' + step.dateFormatted} bởi KTV {step.workerName || 'Trần Văn Lực'}
                        </p>
                        <p className="text-[11px] text-emerald-700 font-semibold">
                          ✓ Đã đối chứng mã hóa chuẩn VietGAP
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   3. TAB DỊCH VỤ & THU HOẠCH
   ────────────────────────────────────────────────────────────────────────── */

function ServicesTab({ plot, services, orders, onSelectService, onDeleteOrder }) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'IN_PROGRESS') {
      return orders.filter((o) => o.status === 'IN_PROGRESS' || o.status === 'ASSIGNED' || o.status === 'PENDING');
    }
    if (statusFilter === 'COMPLETED') {
      return orders.filter((o) => o.status === 'COMPLETED' || o.status === 'DONE');
    }
    return orders;
  }, [orders, statusFilter]);

  const inProgressCount = orders.filter((o) => o.status === 'IN_PROGRESS' || o.status === 'ASSIGNED' || o.status === 'PENDING').length;
  const completedCount = orders.filter((o) => o.status === 'COMPLETED' || o.status === 'DONE').length;

  return (
    <div className="space-y-12 pb-8">
      {/* 1. Đặt dịch vụ chăm sóc & vật tư */}
      <section>
        <SectionTitle eyebrow={`Cho ${plot.name}`} title="Đặt dịch vụ chăm sóc & vật tư" />
        <div className="mt-4 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectService?.(s)}
              className="group flex flex-col rounded-2xl border-2 border-stone-300 bg-white p-4 text-left shadow-xs transition hover:-translate-y-0.5 hover:border-emerald-600 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 cursor-pointer"
            >
              <span className="text-sm font-semibold text-[#18352b]">{s.name}</span>
              {s.description && <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-500">{s.description}</span>}
              <span className="mt-3 flex items-center justify-between">
                <span className="text-base font-bold text-emerald-700">{s.formattedPrice || `${Number(s.price || 0).toLocaleString('vi-VN')} đ`}</span>
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 group-hover:underline">Đặt ngay<ChevronRight className="h-4 w-4" /></span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 2. Lịch sử mua & sử dụng dịch vụ của thửa đất */}
      <section className="space-y-4 pt-8 border-t-2 border-stone-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-stone-300 pb-4">
          <div>
            <SectionTitle eyebrow={`${orders.length} đơn dịch vụ`} title="Lịch sử mua & sử dụng dịch vụ" />
            <p className="text-xs text-stone-500 mt-0.5">Theo dõi chi tiết tiến độ thực hiện, nhân viên phụ trách và ảnh nghiệm thu thực địa.</p>
          </div>
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-stone-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'ALL' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900'}`}
            >
              Tất cả ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'IN_PROGRESS' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900'}`}
            >
              Đang làm ({inProgressCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'COMPLETED' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900'}`}
            >
              Hoàn thành ({completedCount})
            </button>
          </div>
        </div>

        <div className="divide-y-2 divide-stone-300">
          {filteredOrders.length ? (
            filteredOrders.map((o) => {
              const isCompleted = o.status === 'COMPLETED' || o.status === 'DONE';
              return (
                <div key={o.id} className="py-6 sm:py-7 space-y-3 first:pt-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                          {o.id}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${isCompleted ? 'bg-emerald-600' : 'bg-amber-500 animate-pulse'}`} />
                          {o.statusLabel}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {o.paymentMethod || 'Đã thanh toán'}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-[#18352b] pt-0.5">{o.serviceName}</h4>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-stone-600">
                        <span className="flex items-center gap-1">
                          <Clock3 className="w-3.5 h-3.5 text-stone-400" />
                          {formatDisplayDate(o.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <UserRound className="w-3.5 h-3.5 text-stone-400" />
                          {o.worker || 'Trần Văn Lực (CVLĐ)'}
                        </span>
                        {o.transactionId && (
                          <span className="text-stone-400 font-mono text-[11px]">
                            GD: #{o.transactionId}
                          </span>
                        )}
                      </div>

                      {o.proofPhoto ? (
                        <div className="pt-2 flex items-center gap-3">
                          <div 
                            className="relative h-14 w-20 rounded-xl overflow-hidden border border-emerald-200 cursor-pointer shadow-xs group"
                            onClick={() => setSelectedOrderForDetail(o)}
                          >
                            <img src={o.proofPhoto} alt="Minh chứng" className="h-full w-full object-cover transition group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </div>
                          <div className="text-xs">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <Camera className="w-3 h-3" />
                              Minh chứng hiện trường
                            </span>
                            <p className="text-stone-500 text-[11px] mt-0.5 line-clamp-1">{o.proofNotes || 'Đã nghiệm thu đạt chuẩn'}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-stone-400 italic pt-1 flex items-center gap-1">
                          <Info className="w-3 h-3 text-stone-400" />
                          {isCompleted ? 'Dịch vụ đã hoàn tất theo định mức' : 'Nhân viên sẽ chụp ảnh hiện trường gửi vào đây khi thực hiện'}
                        </p>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 shrink-0">
                      <span className="text-base font-extrabold text-emerald-800">{o.price}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForDetail(o)}
                          className="px-3.5 py-1.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:border-stone-400 transition cursor-pointer flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5 text-stone-500" />
                          Chi tiết đơn
                        </button>
                        {onDeleteOrder && (
                          <button
                            type="button"
                            title="Xóa đơn dịch vụ này"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Xóa lịch sử đơn dịch vụ #${o.id} (${o.serviceName})?`)) {
                                onDeleteOrder(o.id);
                              }
                            }}
                            className="p-1.5 rounded-xl border border-stone-200 text-stone-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState 
              icon={ShoppingBag} 
              title="Chưa có dịch vụ nào trong mục này" 
              note="Các dịch vụ phát sinh hoặc gói ủy thác chăm sóc bạn đặt cho thửa này sẽ được lưu trữ và hiển thị đầy đủ tại đây." 
            />
          )}
        </div>
      </section>

      {/* Modal chi tiết đơn dịch vụ */}
      {selectedOrderForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className="relative max-w-lg w-full rounded-3xl bg-white p-6 shadow-2xl overflow-hidden border border-stone-200 space-y-4">
            <button
              type="button"
              onClick={() => setSelectedOrderForDetail(null)}
              className="absolute right-4 top-4 rounded-full bg-stone-100 p-2 text-stone-600 hover:bg-stone-200 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading font-black text-base text-[#18352b]">Chi Tiết Đơn Dịch Vụ</h3>
                <p className="text-xs text-stone-500 font-mono">#{selectedOrderForDetail.id} • {selectedOrderForDetail.transactionId || 'TXN-SUCCESS'}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-stone-50 p-4 space-y-2 text-xs border border-stone-200/80">
              <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Dịch vụ:</span>
                <strong className="text-[#18352b] text-sm text-right">{selectedOrderForDetail.serviceName}</strong>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Thửa đất áp dụng:</span>
                <span className="font-semibold text-stone-800">{plot.name} ({plot.plotCode || plot.mapPlotId || plot.id})</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Chi phí thanh toán:</span>
                <strong className="text-emerald-700 text-sm font-bold">{selectedOrderForDetail.price}</strong>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Phương thức:</span>
                <span className="font-semibold text-stone-800">{selectedOrderForDetail.paymentMethod || 'Chuyển khoản VietQR'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Trạng thái:</span>
                <span className="font-bold text-emerald-700">{selectedOrderForDetail.statusLabel}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-stone-500">Nhân viên phụ trách:</span>
                <span className="font-semibold text-stone-800">{selectedOrderForDetail.worker || 'Trần Văn Lực (CVLĐ)'}</span>
              </div>
            </div>

            {selectedOrderForDetail.proofPhoto && (
              <div className="space-y-1.5">
                <h5 className="font-bold text-xs text-[#18352b] flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-700" />
                  Ảnh minh chứng hiện trường:
                </h5>
                <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-stone-900 flex items-center justify-center max-h-56">
                  <img 
                    src={selectedOrderForDetail.proofPhoto} 
                    alt="Minh chứng hiện trường" 
                    className="max-h-56 w-full object-cover"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedOrderForDetail(null)}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition cursor-pointer"
              >
                Đóng
              </button>
              {onDeleteOrder && (
                <button
                  type="button"
                  onClick={() => {
                    const targetId = selectedOrderForDetail.id;
                    if (window.confirm(`Bạn có chắc muốn xóa vĩnh viễn đơn #${targetId} (${selectedOrderForDetail.serviceName})?`)) {
                      setSelectedOrderForDetail(null);
                      onDeleteOrder(targetId);
                    }
                  }}
                  className="py-2.5 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition cursor-pointer border border-rose-200 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xóa đơn này
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HarvestTab({ plot, harvestPlan, onOpenHarvest, cropProcess }) {
  const daysLeft = cropProcess?.daysLeft || Math.max(plot.totalDays - plot.currentDay, 0);
  const planDate = harvestPlan?.date ? harvestPlan.date.split('-').reverse().join('/') : '';
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="p-5">
        <SectionTitle eyebrow="Dự kiến thu hoạch" title={daysLeft > 0 ? `Còn ${daysLeft} ngày nữa` : 'Đã đến mùa thu hoạch'} />
        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-stone-50 p-3"><dt className="text-xs text-stone-500">Ngày thu hoạch</dt><dd className="font-semibold text-[#18352b]">{plot.expectedHarvestDate || 'Sau 19 ngày'}</dd></div>
          <div className="rounded-xl bg-stone-50 p-3"><dt className="text-xs text-stone-500">Sản lượng tiêu chuẩn</dt><dd className="font-semibold text-[#18352b]">{cropProcess?.expectedYield || plot.expectedYield}</dd></div>
          <div className="rounded-xl bg-stone-50 p-3"><dt className="text-xs text-stone-500">Cây trồng</dt><dd className="font-semibold text-[#18352b]">{cropProcess?.cropName || plot.crop}</dd></div>
          <div className="rounded-xl bg-stone-50 p-3"><dt className="text-xs text-stone-500">Hợp đồng thuê</dt><dd className="truncate font-semibold text-[#18352b]">{plot.contractCode || 'HD-2026'}</dd></div>
        </dl>
      </Card>
      <Card className="flex flex-col p-5">
        <SectionTitle eyebrow="Kế hoạch của bạn" title={harvestPlan ? 'Đã đăng ký thu hoạch' : 'Chưa đăng ký'} />
        {harvestPlan ? (
          <div className="mt-4 space-y-2 text-sm">
            <p className="flex items-center gap-2 text-[#18352b]"><CalendarCheck className="h-4 w-4 text-emerald-700" />Ngày hái: <strong>{planDate}</strong></p>
            <p className="flex items-center gap-2 text-[#18352b]"><Truck className="h-4 w-4 text-emerald-700" />{harvestPlan.methodLabel}</p>
            {harvestPlan.address && <p className="flex items-start gap-2 text-stone-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />{harvestPlan.address}</p>}
            {harvestPlan.status === 'APPROVED' ? (
              <p className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">✓ Đã duyệt lịch hái · Đang điều phối thu hoạch</p>
            ) : (
              <p className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Chờ kỹ sư xác nhận</p>
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-stone-600">Chọn ngày và phương thức nhận nông sản. Farmely sẽ nhắc bạn trước 3 ngày.</p>
        )}
        <button type="button" onClick={() => onOpenHarvest?.(plot)} className="mt-auto pt-5 cursor-pointer">
          <span className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 transition">
            <Wheat className="h-4 w-4" />{harvestPlan ? 'Sửa kế hoạch thu hoạch' : 'Đăng ký thu hoạch'}
          </span>
        </button>
      </Card>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   MODAL XEM BIỂU ĐỒ IOT VI KHÍ HẬU 24 GIỜ
   ────────────────────────────────────────────────────────────────────────── */

function IotChartModal({ plot, iotData, onClose }) {
  const [metricKey, setMetricKey] = useState('temp');
  const metric = METRICS.find((m) => m.key === metricKey) || METRICS[0];
  const rule = METRIC_RULES[metricKey];
  const data = iotData?.hourly || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative max-w-4xl w-full rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="font-heading font-bold text-lg text-[#18352b]">
              Biểu đồ quan trắc vi khí hậu 24 giờ qua
            </h3>
            <p className="text-xs text-stone-500">
              Trực tiếp từ trạm {plot.stationId || 'AGRO-CUCHI-01'} • Tiêu chuẩn VietGAP
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-stone-100 p-2 text-stone-500 hover:bg-stone-200 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nút chọn metric */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {METRICS.map((m) => {
            const Icon = m.icon;
            const active = m.key === metricKey;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setMetricKey(m.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  active ? 'border-transparent text-white' : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                }`}
                style={active ? { backgroundColor: m.color } : undefined}
              >
                <Icon className="h-3.5 w-3.5" />{m.label}
              </button>
            );
          })}
        </div>

        <div className="h-72 w-full pt-2">
          {data.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="modal-iot-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={metric.color} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={metric.color} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f1f5f0" vertical={false} />
                <ReferenceArea
                  y1={rule.min}
                  y2={rule.max}
                  fill="#10b981"
                  fillOpacity={0.08}
                  stroke="#10b981"
                  strokeOpacity={0.25}
                  strokeDasharray="4 4"
                  ifOverflow="extendDomain"
                  label={{ value: 'Vùng an toàn', position: 'insideTopRight', fontSize: 11, fill: '#047857' }}
                />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#78716c' }} tickLine={false} axisLine={false} />
                <YAxis
                  width={36}
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(v) => [`${v} ${metric.unit}`, metric.label]}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e7e5e4', fontSize: 12 }}
                />
                <Area type="monotone" dataKey={metric.series} stroke={metric.color} strokeWidth={2.5} fill="url(#modal-iot-area)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={Radio} title="Đang tải dữ liệu cảm biến Open-Meteo" />
          )}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   MODAL TẤT CẢ ẢNH MINH CHỨNG HIỆN TRƯỜNG
   ────────────────────────────────────────────────────────────────────────── */

function AllProofsGalleryModal({ completedSteps, todayTask, backendDiaries = [], onClose, onSelectPhoto }) {
  const allProofs = useMemo(() => {
    const list = [];
    if (todayTask?.photos?.length) {
      todayTask.photos.forEach((img, i) => {
        list.push({
          url: img,
          title: todayTask.title,
          stepText: `BƯỚC ${todayTask.stepNumber} (Hôm nay)`,
          time: todayTask.timeFormatted,
          worker: todayTask.workerName,
          date: todayTask.dateFormatted
        });
      });
    }
    // Bổ sung các ảnh chụp thực địa từ Nhật ký nông hộ (PostgreSQL)
    if (backendDiaries?.length) {
      backendDiaries.forEach((d) => {
        if (d.imageUrl && !list.some((item) => item.url === d.imageUrl)) {
          list.push({
            url: d.imageUrl,
            title: d.content || d.taskTitle || 'Nhật ký thực địa',
            stepText: d.taskId ? `BƯỚC ${d.taskId}` : 'Nhật ký VietGAP',
            time: d.createdAt ? new Date(d.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '09:15',
            worker: d.authorName || 'Trần Văn Lực',
            date: d.createdAt ? new Date(d.createdAt).toLocaleDateString('vi-VN') : '23/10/2026'
          });
        }
      });
    }
    completedSteps.forEach((s) => {
      if (s.proofPhoto && !list.some((item) => item.url === s.proofPhoto)) {
        list.push({
          url: s.proofPhoto,
          title: s.title,
          stepText: `BƯỚC ${s.stepNumber}`,
          time: s.completedTime || '09:15',
          worker: s.workerName,
          date: s.dateFormatted
        });
      }
    });
    return list;
  }, [completedSteps, todayTask, backendDiaries]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="relative max-w-4xl w-full rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="font-heading font-bold text-lg text-[#18352b] flex items-center gap-2">
              <Camera className="h-5 w-5 text-emerald-700" />
              Tất cả ảnh minh chứng hiện trường ({allProofs.length} ảnh)
            </h3>
            <p className="text-xs text-stone-500">
              Toàn bộ ảnh chụp thực địa bởi Kỹ thuật viên chăm sóc luống theo từng bước VietGAP
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-stone-100 p-2 text-stone-500 hover:bg-stone-200 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
          {allProofs.map((item, idx) => (
            <div
              key={idx}
              onClick={() => onSelectPhoto(item.url)}
              className="group relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 cursor-pointer shadow-xs hover:shadow-md transition"
            >
              <img src={item.url} alt={item.title} className="h-36 w-full object-cover group-hover:scale-105 transition duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 p-2.5 flex flex-col justify-end text-white">
                <span className="text-[10px] font-bold text-lime-300">{item.stepText}</span>
                <span className="text-xs font-semibold line-clamp-1">{item.title}</span>
                <span className="text-[10px] text-white/70 mt-0.5">{item.date} • {item.worker}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   MODAL CẨM NANG KỸ THUẬT MỐC NGÀY
   ────────────────────────────────────────────────────────────────────────── */

function StageDetailModal({ stage, cropProcess, onClose }) {
  if (!stage) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-stone-900/10 max-h-[90vh] overflow-y-auto space-y-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            {stage.label}
          </span>
          <span className="text-xs text-stone-500 font-medium">Quy trình chuẩn VietGAP</span>
        </div>

        <h3 className="mt-1 text-xl font-bold font-heading text-[#18352b]">{stage.name}</h3>

        <div className="rounded-2xl bg-emerald-50/80 p-4 border border-emerald-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
            <Sprout className="h-4 w-4" /> Chỉ dẫn kỹ thuật canh tác trọng tâm
          </h4>
          <p className="mt-1.5 text-sm text-emerald-950 leading-relaxed">{stage.guide}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-stone-200 p-3.5 bg-stone-50/50">
            <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <Droplets className="h-4 w-4 text-sky-500" /> Chế độ tưới nước đề xuất
            </span>
            <p className="mt-1.5 text-xs text-stone-600 leading-relaxed">{stage.waterRegime || 'Tưới nhỏ giọt bổ sung ẩm 65–75%'}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 p-3.5 bg-stone-50/50">
            <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <Leaf className="h-4 w-4 text-emerald-600" /> Dinh dưỡng & Phân bón vi sinh
            </span>
            <p className="mt-1.5 text-xs text-stone-600 leading-relaxed">{stage.nutrition || stage.materials || 'Bón phân hữu cơ vi sinh'}</p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#18352b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0f2a20] transition cursor-pointer"
          >
            Đã hiểu quy trình
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   MODAL TẠO & CHỈNH SỬA CÔNG VIỆC (DÀNH CHO KHÁCH TỰ CANH TÁC)
   Hỗ trợ 2 tùy chọn:
   1. "Việc hôm nay" - Cập nhật trực tiếp công việc hôm nay theo thời gian thực
   2. "Kế hoạch tiếp theo" - Tự động đẩy lùi số thứ tự các bước nếu chèn vào giữa
   ────────────────────────────────────────────────────────────────────────── */

function SelfTaskModal({
  isOpen,
  onClose,
  editingTask,
  onSave,
  defaultStepNumber = 1,
  todayStepNumber = 1,
  hasActiveTodayTask = false,
  plotStartDate = ''
}) {
  const [taskScope, setTaskScope] = useState('today'); // 'today' | 'upcoming'
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduleText, setScheduleText] = useState('');
  const [dateIso, setDateIso] = useState('');
  const [stepNumber, setStepNumber] = useState(todayStepNumber);
  const [isDone, setIsDone] = useState(false);
  const [isFinish, setIsFinish] = useState(false);
  const [dateError, setDateError] = useState('');

  const todayDateInputRef = useRef(null);
  const upcomingDateInputRef = useRef(null);

  // Tính toán ngày bắt đầu canh tác chuẩn ISO (YYYY-MM-DD) và dạng hiển thị (DD/MM/YYYY)
  const minDateIso = useMemo(() => {
    return getPlotStartDateIso({ startDate: plotStartDate });
  }, [plotStartDate]);

  const minDateDisplay = useMemo(() => {
    return minDateIso ? formatDisplayDate(minDateIso) : '';
  }, [minDateIso]);

  // Lấy ngày gợi ý mặc định hợp lệ: nếu hôm nay < ngày bắt đầu canh tác thì lấy đúng ngày bắt đầu canh tác
  const getInitialValidDateIso = useCallback(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayIso = `${y}-${m}-${d}`;

    if (minDateIso && todayIso < minDateIso) {
      return minDateIso;
    }
    return todayIso;
  }, [minDateIso]);

  useEffect(() => {
    if (editingTask) {
      const isTodayScope = Boolean(editingTask.isToday || editingTask.id === 'today');
      setTaskScope(isTodayScope ? 'today' : 'upcoming');
      setTitle(editingTask.title || '');
      setDescription(editingTask.description || '');

      let existingIso = convertViDateToIso(editingTask.dueDate || editingTask.dateFormatted || editingTask.scheduleText);
      if (minDateIso && existingIso && existingIso < minDateIso) {
        existingIso = minDateIso;
      }
      const initialDate = existingIso || getInitialValidDateIso();
      setDateIso(initialDate);
      setScheduleText(editingTask.scheduleText || (initialDate ? formatDisplayDate(initialDate) : ''));
      setStepNumber(editingTask.stepNumber || (isTodayScope ? todayStepNumber : defaultStepNumber));
      setIsDone(Boolean(editingTask.isDone || editingTask.statusText === 'Đã xong'));
      setIsFinish(Boolean(editingTask.isFinish));
      setDateError('');
    } else {
      const initialScope = hasActiveTodayTask ? 'upcoming' : 'today';
      setTaskScope(initialScope);
      setTitle('');
      setDescription('');
      const validDate = getInitialValidDateIso();
      setDateIso(validDate);
      setScheduleText(validDate ? formatDisplayDate(validDate) : '');
      setStepNumber(initialScope === 'today' ? todayStepNumber : defaultStepNumber);
      setIsDone(false);
      setIsFinish(false);
      setDateError('');
    }
  }, [editingTask, isOpen, defaultStepNumber, todayStepNumber, hasActiveTodayTask, minDateIso, getInitialValidDateIso]);

  if (!isOpen) return null;

  const handleScopeChange = (newScope) => {
    setTaskScope(newScope);
    setDateError('');
    const validDate = getInitialValidDateIso();
    setDateIso(validDate);
    setScheduleText(validDate ? formatDisplayDate(validDate) : '');
    if (newScope === 'today') {
      setStepNumber(todayStepNumber);
    } else {
      setStepNumber(defaultStepNumber);
    }
  };

  const handleDateChange = (val) => {
    if (!val) {
      setDateIso('');
      setDateError('Vui lòng chọn ngày thực hiện');
      return;
    }
    if (minDateIso && val < minDateIso) {
      setDateError(`Chỉ được chọn từ ngày bắt đầu canh tác (${minDateDisplay}) trở đi`);
      setDateIso(minDateIso);
      setScheduleText(formatDisplayDate(minDateIso));
      return;
    }
    setDateError('');
    setDateIso(val);
    setScheduleText(formatDisplayDate(val));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (!dateIso) {
      setDateError('Vui lòng chọn ngày thực hiện');
      return;
    }

    if (minDateIso && dateIso < minDateIso) {
      setDateError(`Chỉ được chọn từ ngày bắt đầu canh tác (${minDateDisplay}) trở đi`);
      return;
    }

    const formattedViDate = formatDisplayDate(dateIso);

    onSave({
      id: editingTask?.id,
      taskScope,
      isToday: taskScope === 'today',
      title: title.trim(),
      description: description.trim(),
      scheduleText: formattedViDate,
      stepNumber: Number(stepNumber) || (taskScope === 'today' ? todayStepNumber : defaultStepNumber),
      dateFormatted: formattedViDate,
      dueDate: dateIso,
      isDone: taskScope === 'today' ? Boolean(isDone) : false,
      statusText: taskScope === 'today' ? (isDone ? 'Đã xong' : 'Đang thực hiện') : undefined,
      isFinish: taskScope === 'upcoming' ? Boolean(isFinish) : false
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-stone-900/10 space-y-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            {editingTask ? 'Chỉnh sửa công việc' : 'Tạo công việc canh tác mới'}
          </span>
          <h3 className="mt-2 text-lg font-bold font-heading text-[#18352b]">
            {editingTask ? 'Cập nhật công việc thửa tự trồng' : 'Lên kế hoạch công việc mới'}
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Lên việc làm cho ngày hôm nay hoặc lập lịch các bước tiếp theo.
          </p>
        </div>

        {/* CHỌN PHÂN LOẠI CÔNG VIỆC: KẾ HOẠCH MỚI NHẤT HOẶC KẾ HOẠCH TIẾP THEO */}
        {!editingTask && (
          <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => handleScopeChange('today')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                taskScope === 'today'
                  ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-stone-900/5'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sun className="h-4 w-4 text-amber-500" />
              <span>Kế hoạch mới nhất</span>
            </button>
            <button
              type="button"
              onClick={() => handleScopeChange('upcoming')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                taskScope === 'upcoming'
                  ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-stone-900/5'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <CalendarCheck className="h-4 w-4 text-emerald-600" />
              <span>Kế hoạch tiếp theo</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {taskScope === 'today' ? (
            <>
              {/* Tên công việc */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Tên công việc mới nhất *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tưới giữ ẩm & kiểm tra mầm non, bón phân đợt 1..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-800 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* Hàng: Thứ tự bước & Ngày thực hiện */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-700">
                      Thứ tự bước
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                      Tiếp nối tự động
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    readOnly
                    value={todayStepNumber}
                    className="w-full rounded-xl border border-stone-200 bg-stone-100/90 px-3.5 py-2 text-sm font-bold text-stone-700 cursor-not-allowed select-none focus:outline-none"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">
                    Bước {todayStepNumber} tự động đồng bộ theo thứ tự mùa vụ.
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-700">
                      Ngày thực hiện *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (todayDateInputRef.current) {
                          if (typeof todayDateInputRef.current.showPicker === 'function') {
                            todayDateInputRef.current.showPicker();
                          } else {
                            todayDateInputRef.current.focus();
                          }
                        }
                      }}
                      className="text-[10px] text-emerald-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Calendar className="h-3 w-3" />
                      <span>Chọn từ lịch</span>
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      ref={todayDateInputRef}
                      type="date"
                      required
                      min={minDateIso || undefined}
                      value={dateIso}
                      onChange={(e) => handleDateChange(e.target.value)}
                      onClick={(e) => {
                        if (typeof e.target.showPicker === 'function') {
                          try { e.target.showPicker(); } catch {}
                        }
                      }}
                      className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-800 font-medium focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer bg-white"
                    />
                  </div>
                  {dateError ? (
                    <p className="text-[11px] text-rose-600 font-medium mt-1">{dateError}</p>
                  ) : (
                    minDateDisplay && (
                      <p className="text-[10px] text-stone-500 mt-1">
                        Từ ngày bắt đầu canh tác: <strong>{minDateDisplay}</strong> trở đi.
                      </p>
                    )
                  )}
                </div>
              </div>

              {/* Mô tả chi tiết */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Mô tả / Hướng dẫn thực hiện
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú thao tác tưới, hiện trạng mầm cây, độ ẩm..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-800 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* Đánh dấu hoàn thành */}
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={(e) => setIsDone(e.target.checked)}
                    className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Đánh dấu là <strong>Đã hoàn thành</strong> (đồng thời lưu vào lịch sử nhật ký)</span>
                </label>
              </div>
            </>
          ) : (
            <>
              {/* Tên công việc kế hoạch */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Tên công việc / Tác vụ kế hoạch *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bón phân hữu cơ vi sinh đợt 2, Tưới nhỏ giọt..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-800 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Thứ tự bước</label>
                  <input
                    type="number"
                    min="1"
                    value={stepNumber}
                    onChange={(e) => setStepNumber(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-800 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Tự động sắp xếp theo thứ tự số bước.
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-700">
                      Ngày thực hiện dự kiến *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (upcomingDateInputRef.current) {
                          if (typeof upcomingDateInputRef.current.showPicker === 'function') {
                            upcomingDateInputRef.current.showPicker();
                          } else {
                            upcomingDateInputRef.current.focus();
                          }
                        }
                      }}
                      className="text-[10px] text-emerald-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Calendar className="h-3 w-3" />
                      <span>Chọn từ lịch</span>
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      ref={upcomingDateInputRef}
                      type="date"
                      required
                      min={minDateIso || undefined}
                      value={dateIso}
                      onChange={(e) => handleDateChange(e.target.value)}
                      onClick={(e) => {
                        if (typeof e.target.showPicker === 'function') {
                          try { e.target.showPicker(); } catch {}
                        }
                      }}
                      className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-800 font-medium focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer bg-white"
                    />
                  </div>
                  {dateError ? (
                    <p className="text-[11px] text-rose-600 font-medium mt-1">{dateError}</p>
                  ) : (
                    minDateDisplay && (
                      <p className="text-[10px] text-stone-500 mt-1">
                        Từ ngày bắt đầu canh tác: <strong>{minDateDisplay}</strong> trở đi.
                      </p>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Mô tả / Hướng dẫn thực hiện</label>
                <textarea
                  rows={3}
                  placeholder="Ghi chú chi tiết lượng nước, phân bón hoặc thao tác cần làm..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-800 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isFinish}
                    onChange={(e) => setIsFinish(e.target.checked)}
                    className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Đánh dấu là bước Thu hoạch cuối vụ</span>
                </label>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-xl bg-emerald-700 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition cursor-pointer shadow-xs"
            >
              {editingTask
                ? 'Lưu thay đổi'
                : (taskScope === 'today' ? 'Lưu kế hoạch' : 'Tạo vào kế hoạch')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   MODAL TẠO & CHỈNH SỬA NHẬT KÝ (DÀNH CHO KHÁCH TỰ CANH TÁC)
   ────────────────────────────────────────────────────────────────────────── */

function SelfDiaryModal({ isOpen, onClose, editingDiary, onSave, plotStartDate = '' }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateIso, setDateIso] = useState('');
  const [stepNumber, setStepNumber] = useState(1);
  const [proofPhoto, setProofPhoto] = useState('');
  const [dateError, setDateError] = useState('');
  const diaryDateRef = useRef(null);

  const minDateIso = useMemo(() => {
    return getPlotStartDateIso({ startDate: plotStartDate });
  }, [plotStartDate]);

  const minDateDisplay = useMemo(() => {
    return minDateIso ? formatDisplayDate(minDateIso) : '';
  }, [minDateIso]);

  const getInitialValidDateIso = useCallback(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayIso = `${y}-${m}-${d}`;
    if (minDateIso && todayIso < minDateIso) return minDateIso;
    return todayIso;
  }, [minDateIso]);

  useEffect(() => {
    if (editingDiary) {
      setTitle(editingDiary.title || '');
      setDescription(editingDiary.description || '');
      const existingIso = convertViDateToIso(editingDiary.dateFormatted);
      const finalIso = (minDateIso && existingIso && existingIso < minDateIso) ? minDateIso : (existingIso || getInitialValidDateIso());
      setDateIso(finalIso);
      setStepNumber(editingDiary.stepNumber || 1);
      setProofPhoto(editingDiary.proofPhoto || '');
      setDateError('');
    } else {
      setTitle('');
      setDescription('');
      setDateIso(getInitialValidDateIso());
      setStepNumber(1);
      setProofPhoto('');
      setDateError('');
    }
  }, [editingDiary, isOpen, getInitialValidDateIso, minDateIso]);

  if (!isOpen) return null;

  const handleDateChange = (val) => {
    if (!val) {
      setDateIso('');
      setDateError('Vui lòng chọn ngày thực hiện');
      return;
    }
    if (minDateIso && val < minDateIso) {
      setDateError(`Chỉ được chọn từ ngày bắt đầu canh tác (${minDateDisplay}) trở đi`);
      setDateIso(minDateIso);
      return;
    }
    setDateError('');
    setDateIso(val);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (!dateIso) {
      setDateError('Vui lòng chọn ngày thực hiện');
      return;
    }
    if (minDateIso && dateIso < minDateIso) {
      setDateError(`Chỉ được chọn từ ngày bắt đầu canh tác (${minDateDisplay}) trở đi`);
      return;
    }

    onSave({
      id: editingDiary?.id,
      title: title.trim(),
      description: description.trim(),
      dateFormatted: formatDisplayDate(dateIso),
      dueDate: dateIso,
      stepNumber: Number(stepNumber) || 1,
      proofPhoto: proofPhoto.trim() || null
    });
    onClose();
  };

  const SAMPLE_PHOTOS = [
    'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-stone-900/10 space-y-4 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            {editingDiary ? 'Chỉnh sửa nhật ký' : 'Viết nhật ký trải nghiệm'}
          </span>
          <h3 className="mt-2 text-lg font-bold font-heading text-[#18352b]">
            {editingDiary ? 'Cập nhật nhật ký canh tác' : 'Ghi lại nhật ký'}
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Lưu lại quá trình cây lớn lên, cảm nhận làm nông nghiệp sạch và hình ảnh kỷ niệm.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Tiêu đề nhật ký *</label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Tỉa cành phụ, Cây ra hoa chùm đầu tiên..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-800 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Ghi nhận cho Bước số</label>
              <input
                type="number"
                min="1"
                value={stepNumber}
                onChange={(e) => setStepNumber(e.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-800 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-stone-700">Ngày thực hiện *</label>
                <button
                  type="button"
                  onClick={() => {
                    if (diaryDateRef.current) {
                      if (typeof diaryDateRef.current.showPicker === 'function') {
                        diaryDateRef.current.showPicker();
                      } else {
                        diaryDateRef.current.focus();
                      }
                    }
                  }}
                  className="text-[10px] text-emerald-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Calendar className="h-3 w-3" />
                  <span>Chọn từ lịch</span>
                </button>
              </div>
              <input
                ref={diaryDateRef}
                type="date"
                required
                min={minDateIso || undefined}
                value={dateIso}
                onChange={(e) => handleDateChange(e.target.value)}
                onClick={(e) => {
                  if (typeof e.target.showPicker === 'function') {
                    try { e.target.showPicker(); } catch {}
                  }
                }}
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-800 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer bg-white"
              />
              {dateError ? (
                <p className="text-[11px] text-rose-600 font-medium mt-1">{dateError}</p>
              ) : (
                minDateDisplay && (
                  <p className="text-[10px] text-stone-500 mt-1">
                    Từ {minDateDisplay} trở đi
                  </p>
                )
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Nội dung / Cảm nhận / Ghi chú</label>
            <textarea
              rows={3}
              placeholder="Cây phát triển rất tốt, lá xanh mướt, đất tơi xốp..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-800 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Ảnh minh chứng / Ảnh kỷ niệm</label>
            <input
              type="text"
              placeholder="Dán URL ảnh hoặc chọn ảnh mẫu bên dưới..."
              value={proofPhoto}
              onChange={(e) => setProofPhoto(e.target.value)}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-800 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px] text-stone-500 font-medium">Chọn nhanh:</span>
              {SAMPLE_PHOTOS.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Mẫu ${idx + 1}`}
                  onClick={() => setProofPhoto(url)}
                  className={`h-9 w-12 rounded-lg object-cover border-2 cursor-pointer transition ${proofPhoto === url ? 'border-emerald-600 scale-105' : 'border-stone-200 opacity-70 hover:opacity-100'}`}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-xl bg-emerald-700 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition cursor-pointer shadow-xs"
            >
              {editingDiary ? 'Lưu thay đổi' : 'Lưu nhật ký'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT: CustomerPlotWorkspace
   ────────────────────────────────────────────────────────────────────────── */

export default function CustomerPlotWorkspace({
  plot,
  plots = [],
  operations = { tasks: [], diary: [] },
  iotData,
  alerts = [],
  stages = [],
  services = [],
  serviceOrders = [],
  harvestPlan = null,
  activeTab = 'overview',
  onTabChange,
  onSelectPlot,
  onBack,
  onOpenAiChat,
  onOpenTask,
  onSelectService,
  onOpenHarvest,
  onAddDiary,
  onDeleteServiceOrder
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);

  // Chuẩn hóa activeTab: nếu truyền 'diary' hoặc 'tasks' đều map vào tab 'tasks'
  const normalizedActiveTab = activeTab === 'diary' ? 'tasks' : activeTab;
  const tab = PLOT_TABS.some((t) => t.id === normalizedActiveTab) ? normalizedActiveTab : 'overview';
  const isSelf = plot.mode === 'Self-Growing' || plot.mode === 'SELF' || String(plot.mode || '').toLowerCase().includes('self') || String(plot.farmingPackage || '').toLowerCase().includes('tự') || String(plot.modeLabel || '').toLowerCase().includes('tự');

  // 1. Phân tích và sinh quy trình canh tác chuẩn VietGAP tính theo ngày tuổi
  const cropProcess = useMemo(() => {
    return resolveStandardCropProcess(plot, stages);
  }, [plot, stages]);

  // Modal states
  const [selectedStageDetail, setSelectedStageDetail] = useState(null);
  const [showIotChartModal, setShowIotChartModal] = useState(false);
  const [showAllProofsModal, setShowAllProofsModal] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState(null);

  // CRUD states cho thửa tự canh tác
  const [showSelfTaskModal, setShowSelfTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showSelfDiaryModal, setShowSelfDiaryModal] = useState(false);
  const [editingDiary, setEditingDiary] = useState(null);

  // 2. DỮ LIỆU CÔNG VIỆC & NHẬT KÝ ĐỒNG BỘ TỪ BACKEND DATABASE
  // Với thửa tự canh tác (isSelf): tự động khởi tạo ngày giờ theo thời gian thực (real-time)
  const selfStorageKey = `farmely_self_plot_tasks_${plot.plotCode || plot.id || 'P-04'}`;

  const [todayTask, setTodayTask] = useState(() => {
    if (isSelf) {
      try { localStorage.removeItem(selfStorageKey); } catch {}
      return {
        id: 'EMPTY-TODAY',
        stepNumber: 1,
        dateFormatted: '',
        dueDate: '',
        timeFormatted: getNowFormattedTime(),
        title: 'Chưa có kế hoạch mới nhất',
        description: 'Hiện chưa có lịch canh tác đang chờ thực hiện. Bạn có thể nhấn "+ Thêm công việc mới" để tự tạo bước canh tác.',
        workerName: 'Tôi (Chủ vườn)',
        statusText: 'Chưa có việc',
        isDone: false,
        photos: [],
        gpsLocation: `luống ${plot.plotCode || 'P-04'}`
      };
    }
    return INITIAL_TODAY_TASK;
  });

  const [upcomingSteps, setUpcomingSteps] = useState(() => {
    if (isSelf) {
      return []; // Mặc định để trống hoàn toàn cho thửa tự canh tác
    }
    return INITIAL_UPCOMING_STEPS;
  });

  const [completedSteps, setCompletedSteps] = useState(() => {
    if (isSelf) {
      return []; // Mặc định để trống hoàn toàn cho thửa tự canh tác
    }
    return INITIAL_COMPLETED_STEPS;
  });

  const [backendDiaries, setBackendDiaries] = useState([]);

  // Thiết lập metadata cho thửa tự canh tác (isSelf) khi mở web
  useEffect(() => {
    if (isSelf) {
      setTodayTask((prev) => ({
        ...prev,
        workerName: 'Tôi (Chủ vườn)',
        gpsLocation: `luống ${plot.plotCode || 'P-04'}`
      }));
    }
  }, [isSelf, plot.plotCode]);

  // Tự động đồng bộ và chuẩn hóa thứ tự bước liên tục (luôn đảm bảo chuỗi 1, 2, 3... không bị nhảy số hay khuyết bước)
  useEffect(() => {
    if (!isSelf) return;
    const maxDone = completedSteps.length
      ? Math.max(...completedSteps.map((s) => Number(s.stepNumber) || 0))
      : 0;
    const expectedTodayNum = maxDone + 1;

    // Chuẩn hóa số bước todayTask
    if (todayTask && Number(todayTask.stepNumber) !== expectedTodayNum) {
      setTodayTask((prev) => ({
        ...prev,
        stepNumber: expectedTodayNum
      }));
    }

    // Chuẩn hóa số bước upcomingSteps
    const isTodayActive = Boolean(todayTask && todayTask.title !== 'Chưa có công việc hôm nay');
    const startUpcomingNum = isTodayActive ? (expectedTodayNum + 1) : expectedTodayNum;

    if (upcomingSteps && upcomingSteps.length > 0) {
      const needsFix = upcomingSteps.some((s, idx) => Number(s.stepNumber) !== (startUpcomingNum + idx));
      if (needsFix) {
        setUpcomingSteps((prev) => {
          const sorted = [...prev].sort((a, b) => (Number(a.stepNumber) || 0) - (Number(b.stepNumber) || 0));
          return sorted.map((s, idx) => ({
            ...s,
            stepNumber: startUpcomingNum + idx
          }));
        });
      }
    }
  }, [isSelf, completedSteps, todayTask?.title, todayTask?.stepNumber, upcomingSteps]);

  // Handlers CRUD cho khách hàng thửa tự canh tác (isSelf)
  // Helper chuyển đổi ngày Việt Nam DD/MM/YYYY sang ISO YYYY-MM-DD cho Database
  const convertViDateToIso = (dateStr) => {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    const str = String(dateStr).trim();
    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3) {
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        const y = parts[2];
        return `${y}-${m}-${d}`;
      }
    }
    return str;
  };

  // Helper bóc tách title, description, stepNumber từ care_tasks
  const parseSelfTask = (t, defaultIdx = 1) => {
    let stepNum = Number(t.stepOrder ?? t.step_order);
    let title = t.taskTitle || t.title || t.notes || '';
    let description = t.description || t.instructions || '';

    // Làm sạch mọi ký tự tiền tố [Bước X] hoặc dấu ngăn ::: nếu còn sót từ bản ghi cũ
    const cleanStepPrefix = (str) => {
      if (!str) return '';
      const m = String(str).match(/^\[Bước\s*(\d+)\]\s*(.*)$/i);
      if (m) {
        if (!stepNum) stepNum = Number(m[1]);
        return m[2];
      }
      return String(str);
    };

    let rawTitle = cleanStepPrefix(title);
    if (rawTitle.includes(':::')) {
      const parts = rawTitle.split(':::');
      title = parts[0].trim();
      if (!description || description === t.title || description.includes(':::')) {
        description = parts.slice(1).join(':::').trim();
      }
    } else {
      title = rawTitle.trim();
    }

    let rawDesc = cleanStepPrefix(description);
    if (rawDesc.includes(':::')) {
      const parts = rawDesc.split(':::');
      description = parts.slice(1).join(':::').trim();
    } else {
      description = rawDesc.trim();
    }

    if (description === title) {
      description = '';
    }

    if (!title) title = 'Công việc canh tác';

    return {
      taskId: t.taskId || t.id,
      stepNum: stepNum || defaultIdx,
      title,
      description,
      dueDate: formatDisplayDate(t.dueDate),
      status: t.status,
      proofPhoto: t.evidenceImageUrl || t.proofPhoto || null
    };
  };

  // Helper bóc tách title, description, stepNumber từ farm_diaries
  const parseSelfDiary = (d, defaultIdx = 1) => {
    let stepNum = Number(d.stepOrder ?? d.step_order) || defaultIdx;
    let title = d.title || 'Nhật ký trải nghiệm';
    let description = d.description || d.content || '';

    const cleanStepPrefix = (str) => {
      if (!str) return '';
      const m = String(str).match(/^\[Bước\s*(\d+)\]\s*(.*)$/i);
      if (m) {
        stepNum = Number(m[1]);
        return m[2];
      }
      return String(str);
    };

    let rawTitle = cleanStepPrefix(title);
    if (rawTitle.includes(':::')) {
      const parts = rawTitle.split(':::');
      title = parts[0].trim();
      if (!description || description === d.title || description.includes(':::')) {
        description = parts.slice(1).join(':::').trim();
      }
    } else {
      title = rawTitle.trim();
    }

    let rawDesc = cleanStepPrefix(description);
    if (rawDesc.includes(':::')) {
      const parts = rawDesc.split(':::');
      description = parts.slice(1).join(':::').trim();
    } else {
      description = rawDesc.trim();
    }

    if (description === title) {
      description = '';
    }

    let dateFormatted = new Date().toLocaleDateString('vi-VN');
    if (d.createdAt) {
      const dt = new Date(d.createdAt);
      if (!isNaN(dt)) dateFormatted = dt.toLocaleDateString('vi-VN');
    }
    return {
      diaryId: d.diaryId || d.id,
      taskId: d.taskId,
      stepNum,
      title: title || 'Nhật ký trải nghiệm',
      description,
      dateFormatted,
      proofPhoto: d.imageUrl || null
    };
  };

  // Handlers CRUD cho khách hàng thửa tự canh tác (isSelf) - LƯU TRỰC TIẾP VÀO POSTGRES DATABASE
  const handleOpenAddTask = () => {
    setEditingTask(null);
    setShowSelfTaskModal(true);
  };

  const handleOpenEditTask = (task) => {
    setEditingTask(task);
    setShowSelfTaskModal(true);
  };

  const notifyTaskSync = () => {
    try {
      localStorage.setItem('farmely_task_sync', String(Date.now()));
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        const bc = new BroadcastChannel('farmely_staff_activity_channel');
        bc.postMessage({ type: 'TASK_SYNC', timestamp: Date.now() });
        bc.close();
      }
    } catch {}
  };

  const handleSaveTask = async (taskData) => {
    const rentalParam = Number(plot.rentalId || plot.rental_id || (isSelf ? 4 : 1));
    const stepNum = Number(taskData.stepNumber) || 1;
    const cleanTitle = (taskData.title || '').trim();
    const cleanDescription = (taskData.description || '').trim();
    const targetDueDate = taskData.dueDate || (taskData.dateFormatted ? convertViDateToIso(taskData.dateFormatted) : new Date().toISOString().split('T')[0]);
    const isDone = Boolean(taskData.isDone);

    let existingTaskId = editingTask?.taskId || (typeof editingTask?.id === 'number' ? editingTask.id : null);
    if (!existingTaskId && editingTask?.id && !String(editingTask.id).startsWith('EMPTY')) {
      const match = String(editingTask.id).match(/\d+/);
      if (match) existingTaskId = Number(match[0]);
    }
    // Nếu chọn tab Kế hoạch mới nhất mà đã có todayTask trong DB thì cập nhật trực tiếp todayTask
    if (!existingTaskId && taskData.taskScope === 'today' && todayTask?.taskId && !String(todayTask.id).startsWith('EMPTY')) {
      existingTaskId = todayTask.taskId;
    }

    try {
      if (existingTaskId) {
        await fetch(`/api/tasks/${existingTaskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: cleanTitle,
            description: cleanDescription,
            notes: cleanTitle,
            stepOrder: stepNum,
            stepNumber: stepNum,
            dueDate: targetDueDate,
            status: isDone ? 'DONE' : 'PENDING'
          })
        });
      } else {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rentalId: rentalParam,
            title: cleanTitle,
            description: cleanDescription,
            notes: cleanTitle,
            stepOrder: stepNum,
            stepNumber: stepNum,
            dueDate: targetDueDate,
            status: isDone ? 'DONE' : 'PENDING'
          })
        });
        const created = await res.json();
        existingTaskId = created?.data?.taskId;
      }

      // Nếu khách chọn "Đã hoàn thành", đồng thời tạo bản ghi nhật ký trong farm_diaries nếu chưa có
      if (isDone) {
        const alreadyHasDiary = existingTaskId && backendDiaries.some((d) => Number(d.taskId) === Number(existingTaskId));
        if (!alreadyHasDiary) {
          await fetch('/api/diary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rentalId: rentalParam,
              taskId: existingTaskId || undefined,
              title: cleanTitle,
              content: cleanDescription || 'Đã hoàn thành đúng lịch.',
              stepOrder: stepNum,
              stepNumber: stepNum,
              imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=600&q=80'
            })
          });
        }
      }

      loadBackendTasksAndDiaries();
      notifyTaskSync();
    } catch (err) {
      console.error('Lỗi khi lưu công việc vào database:', err);
    }
  };

  const handleToggleTodayDone = async () => {
    if (!todayTask || todayTask.title === 'Chưa có công việc hôm nay') return;
    let targetTaskId = todayTask.taskId || (typeof todayTask.id === 'number' ? todayTask.id : null);
    if (!targetTaskId && todayTask.id && !String(todayTask.id).startsWith('EMPTY')) {
      const match = String(todayTask.id).match(/\d+/);
      if (match) targetTaskId = Number(match[0]);
    }
    const rentalParam = Number(plot.rentalId || plot.rental_id || (isSelf ? 4 : 1));

    try {
      if (targetTaskId) {
        await fetch(`/api/tasks/${targetTaskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'DONE' })
        });
      }
      const alreadyHasDiary = targetTaskId && backendDiaries.some((d) => Number(d.taskId) === Number(targetTaskId));
      if (!alreadyHasDiary) {
        await fetch('/api/diary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rentalId: rentalParam,
            taskId: targetTaskId || undefined,
            title: todayTask.title,
            content: todayTask.description || 'Đã hoàn thành đúng lịch.',
            stepOrder: Number(todayTask.stepNumber) || 1,
            stepNumber: Number(todayTask.stepNumber) || 1,
            imageUrl: todayTask.photos?.[0] || 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=600&q=80'
          })
        });
      }
      loadBackendTasksAndDiaries();
      notifyTaskSync();
    } catch (err) {
      console.error('Lỗi khi hoàn thành công việc hôm nay:', err);
    }
  };

  const handleDeleteTodayTask = async () => {
    let targetTaskId = todayTask.taskId || (typeof todayTask.id === 'number' ? todayTask.id : null);
    if (!targetTaskId && todayTask.id && !String(todayTask.id).startsWith('EMPTY')) {
      const match = String(todayTask.id).match(/\d+/);
      if (match) targetTaskId = Number(match[0]);
    }

    try {
      if (targetTaskId) {
        await fetch(`/api/tasks/${targetTaskId}`, { method: 'DELETE' });
      }
      loadBackendTasksAndDiaries();
      notifyTaskSync();
    } catch (err) {
      console.error('Lỗi khi xóa công việc hôm nay:', err);
    }
  };

  const handlePromoteNextTask = async () => {
    if (upcomingSteps.length === 0) return;
    const next = upcomingSteps[0];
    let targetTaskId = next.taskId || (typeof next.id === 'number' ? next.id : null);
    if (!targetTaskId && next.id) {
      const match = String(next.id).match(/\d+/);
      if (match) targetTaskId = Number(match[0]);
    }

    try {
      if (targetTaskId) {
        await fetch(`/api/tasks/${targetTaskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dueDate: new Date().toISOString().split('T')[0]
          })
        });
      }
      loadBackendTasksAndDiaries();
      notifyTaskSync();
    } catch (err) {
      console.error('Lỗi đưa bước kế tiếp lên hôm nay:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    let numericId = null;
    if (typeof taskId === 'number') numericId = taskId;
    else if (!isNaN(taskId)) numericId = Number(taskId);
    else {
      const match = String(taskId).match(/\d+/);
      if (match) numericId = Number(match[0]);
    }

    try {
      if (numericId) {
        await fetch(`/api/tasks/${numericId}`, { method: 'DELETE' });
      }
      loadBackendTasksAndDiaries();
      notifyTaskSync();
    } catch (err) {
      console.error('Lỗi khi xóa công việc:', err);
    }
  };

  const handleToggleTaskDone = async (task) => {
    let targetTaskId = task.taskId || (typeof task.id === 'number' ? task.id : null);
    if (!targetTaskId && task.id) {
      const match = String(task.id).match(/\d+/);
      if (match) targetTaskId = Number(match[0]);
    }
    const rentalParam = Number(plot.rentalId || plot.rental_id || (isSelf ? 4 : 1));

    try {
      if (targetTaskId) {
        await fetch(`/api/tasks/${targetTaskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'DONE' })
        });
      }
      const alreadyHasDiary = targetTaskId && backendDiaries.some((d) => Number(d.taskId) === Number(targetTaskId));
      if (!alreadyHasDiary) {
        await fetch('/api/diary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rentalId: rentalParam,
            taskId: targetTaskId || undefined,
            title: task.title,
            content: task.description || 'Đã hoàn thành đúng lịch.',
            stepOrder: Number(task.stepNumber) || 1,
            stepNumber: Number(task.stepNumber) || 1,
            imageUrl: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80'
          })
        });
      }
      loadBackendTasksAndDiaries();
    } catch (err) {
      console.error('Lỗi khi hoàn thành công việc kế hoạch:', err);
    }
  };

  const handleOpenAddDiary = () => {
    setEditingDiary(null);
    setShowSelfDiaryModal(true);
  };

  const handleOpenEditDiary = (diary) => {
    setEditingDiary(diary);
    setShowSelfDiaryModal(true);
  };

  const handleSaveDiary = async (diaryData) => {
    const rentalParam = Number(plot.rentalId || plot.rental_id || (isSelf ? 4 : 1));
    const stepNum = Number(diaryData.stepNumber) || 1;
    const cleanTitle = (diaryData.title || '').trim();
    const cleanDescription = (diaryData.description || '').trim();

    let targetDiaryId = editingDiary?.diaryId || (typeof editingDiary?.id === 'number' ? editingDiary.id : null);
    if (!targetDiaryId && editingDiary?.id) {
      const match = String(editingDiary.id).match(/\d+/);
      if (match) targetDiaryId = Number(match[0]);
    }

    try {
      if (targetDiaryId) {
        await fetch(`/api/diary/${targetDiaryId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: cleanTitle,
            content: cleanDescription,
            stepOrder: stepNum,
            stepNumber: stepNum,
            imageUrl: diaryData.proofPhoto || ''
          })
        });
      } else {
        await fetch('/api/diary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rentalId: rentalParam,
            title: cleanTitle,
            content: cleanDescription,
            stepOrder: stepNum,
            stepNumber: stepNum,
            imageUrl: diaryData.proofPhoto || ''
          })
        });
      }
      loadBackendTasksAndDiaries();
    } catch (err) {
      console.error('Lỗi khi lưu nhật ký vào database:', err);
    }
  };

  const handleDeleteDiary = async (target) => {
    let diaryId = null;
    let taskId = null;

    if (target && typeof target === 'object') {
      diaryId = target.diaryId || null;
      taskId = target.taskId || null;
      if (!diaryId && target.id) {
        const str = String(target.id);
        const match = str.match(/\d+/);
        if (match) {
          if (str.includes('TASK')) taskId = Number(match[0]);
          else diaryId = Number(match[0]);
        }
      }
    } else if (target) {
      const str = String(target);
      const match = str.match(/\d+/);
      if (match) {
        if (str.includes('TASK')) taskId = Number(match[0]);
        else diaryId = Number(match[0]);
      }
    }

    try {
      if (diaryId) {
        await fetch(`/api/diary/${diaryId}`, { method: 'DELETE' });
      }
      if (taskId) {
        await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      }
      loadBackendTasksAndDiaries();
    } catch (err) {
      console.error('Lỗi khi xóa nhật ký:', err);
    }
  };

  // Fetch từ Backend API (/api/tasks và /api/diary) để đồng bộ số liệu thực tế từ Database
  const loadBackendTasksAndDiaries = useCallback(() => {
    const rentalParam = Number(plot.rentalId || plot.rental_id || (isSelf ? 4 : 1));
    Promise.allSettled([
      fetch(`/api/tasks?rentalId=${rentalParam}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/diary?rentalId=${rentalParam}`).then((r) => r.ok ? r.json() : null)
    ]).then(([resTasks, resDiaries]) => {
      const rawTasks = resTasks.status === 'fulfilled' && resTasks.value?.data ? resTasks.value.data : [];
      const rawDiaries = resDiaries.status === 'fulfilled' && resDiaries.value?.data ? resDiaries.value.data : [];

      if (rawDiaries && rawDiaries.length > 0) {
        setBackendDiaries(rawDiaries);
      } else {
        setBackendDiaries([]);
      }

      // ──────────────────────────────────────────────────────────────────────────
      // CHẾ ĐỘ 1: TỰ CANH TÁC (isSelf)
      // Khách hàng cá nhân hóa 100%. Nếu DB rỗng -> để trống hoàn toàn!
      // Không nạp mock data, không fallback sang quy trình mẫu VietGAP.
      // ──────────────────────────────────────────────────────────────────────────
      if (isSelf) {
        try { localStorage.removeItem(selfStorageKey); } catch {}

        const isDoneStatus = (s) => s === 'COMPLETED' || s === 'DONE';
        const dbCompletedTasks = rawTasks.filter((t) => isDoneStatus(t.status));
        const dbPendingTasks = rawTasks.filter((t) => !isDoneStatus(t.status));

        // 1. Danh sách đã hoàn thành (từ farm_diaries và care_tasks status=DONE)
        const mappedCompleted = [];
        const handledTaskIds = new Set();
        const handledDiaryIds = new Set();

        // Ưu tiên nạp từ farm_diaries trước vì chứa ảnh và mô tả trải nghiệm thực tế
        for (let i = 0; i < rawDiaries.length; i++) {
          const pd = parseSelfDiary(rawDiaries[i], i + 1);
          if (handledDiaryIds.has(Number(pd.diaryId))) continue;
          if (pd.taskId && handledTaskIds.has(Number(pd.taskId))) continue;

          handledDiaryIds.add(Number(pd.diaryId));
          if (pd.taskId) handledTaskIds.add(Number(pd.taskId));

          mappedCompleted.push({
            id: `COMP-DIARY-${pd.diaryId}`,
            diaryId: pd.diaryId,
            taskId: pd.taskId,
            stepNumber: pd.stepNum,
            dateFormatted: pd.dateFormatted,
            workerName: 'Tôi (Chủ vườn)',
            title: pd.title,
            description: pd.description,
            completedTime: pd.dateFormatted,
            photoCount: pd.proofPhoto ? 1 : 0,
            proofPhoto: pd.proofPhoto,
            sensorSnapshot: { temp: plot.temp || '28°C', humidity: plot.airHumidity || '70%' }
          });
        }

        // Bổ sung các care_tasks đã hoàn thành nhưng chưa có trong farm_diaries
        for (let i = 0; i < dbCompletedTasks.length; i++) {
          const pt = parseSelfTask(dbCompletedTasks[i], i + 1);
          if (handledTaskIds.has(Number(pt.taskId))) continue;
          handledTaskIds.add(Number(pt.taskId));

          mappedCompleted.push({
            id: `COMP-TASK-${pt.taskId}`,
            taskId: pt.taskId,
            stepNumber: pt.stepNum,
            dateFormatted: pt.dueDate || getNowFormattedDate(),
            workerName: 'Tôi (Chủ vườn)',
            title: pt.title,
            description: pt.description || 'Đã hoàn thành đúng lịch.',
            completedTime: pt.dueDate || 'Hôm nay',
            photoCount: pt.proofPhoto ? 1 : 0,
            proofPhoto: pt.proofPhoto,
            sensorSnapshot: { temp: plot.temp || '28°C', humidity: plot.airHumidity || '70%' }
          });
        }

        mappedCompleted.sort((a, b) => (Number(a.stepNumber) || 0) - (Number(b.stepNumber) || 0));
        setCompletedSteps(mappedCompleted);

        const lastDoneNum = mappedCompleted.length > 0
          ? Math.max(...mappedCompleted.map((s) => Number(s.stepNumber) || 0))
          : 0;

        // 2. Việc hôm nay & Kế hoạch tiếp theo (từ care_tasks status=PENDING trong DB)
        if (dbPendingTasks.length > 0) {
          dbPendingTasks.sort((a, b) => {
            const sA = Number(a.stepOrder ?? a.step_order ?? 1);
            const sB = Number(b.stepOrder ?? b.step_order ?? 1);
            if (sA !== sB) return sA - sB;
            return (a.taskId || a.id || 0) - (b.taskId || b.id || 0);
          });

          const [todayRaw, ...upcomingRaw] = dbPendingTasks;
          const parsedToday = parseSelfTask(todayRaw, lastDoneNum + 1);

          setTodayTask({
            id: `TASK-${parsedToday.taskId}`,
            taskId: parsedToday.taskId,
            stepNumber: parsedToday.stepNum || (lastDoneNum + 1),
            dueDate: parsedToday.rawDueDate || parsedToday.dueDate,
            dateFormatted: parsedToday.dueDate || '',
            timeFormatted: getNowFormattedTime(),
            title: parsedToday.title,
            description: parsedToday.description || 'Chủ vườn tự thực hiện.',
            workerName: 'Tôi (Chủ vườn)',
            statusText: 'Đang thực hiện',
            isDone: false,
            photos: parsedToday.proofPhoto ? [parsedToday.proofPhoto] : [],
            gpsLocation: `luống ${plot.plotCode || 'P-04'}`
          });

          const startUpcomingNum = parsedToday.stepNum + 1;
          setUpcomingSteps(upcomingRaw.map((ut, idx) => {
            const pUt = parseSelfTask(ut, startUpcomingNum + idx);
            let dueText = 'Theo kế hoạch tự canh tác';
            if (pUt.dueDate) {
              dueText = `${formatDisplayDate(pUt.dueDate)} • Tự lên lịch`;
            }
            return {
              id: `UP-${pUt.taskId}`,
              taskId: pUt.taskId,
              stepNumber: pUt.stepNum || (startUpcomingNum + idx),
              title: pUt.title,
              description: pUt.description || 'Chủ vườn tự thực hiện.',
              scheduleText: dueText,
              dueDate: pUt.rawDueDate || pUt.dueDate,
              isFinish: (pUt.title || '').toLowerCase().includes('thu hoạch')
            };
          }));
        } else {
          // Không có pending task nào -> Để trống hoàn toàn!
          setTodayTask({
            id: 'EMPTY-TODAY',
            stepNumber: lastDoneNum + 1,
            dateFormatted: '',
            dueDate: '',
            timeFormatted: getNowFormattedTime(),
            title: 'Chưa có kế hoạch mới nhất',
            description: 'Hiện chưa có lịch canh tác đang chờ thực hiện. Bạn có thể nhấn "+ Thêm công việc mới" để tự tạo bước canh tác.',
            workerName: 'Tôi (Chủ vườn)',
            statusText: 'Chưa có việc',
            isDone: false,
            photos: [],
            gpsLocation: `luống ${plot.plotCode || 'P-04'}`
          });
          setUpcomingSteps([]);
        }

        // TUYỆT ĐỐI DỪNG Ở ĐÂY CHO THỬA TỰ CANH TÁC, KHÔNG BAO GIỜ FALLBACK VÀO STAGES!
        return;
      }

      // ──────────────────────────────────────────────────────────────────────────
      // CHẾ ĐỘ 2: NÔNG TRẠI FARMELY ỦY THÁC (!isSelf)
      // Toàn bộ quy trình và nhật ký do Hệ thống & Staff (KTV) thực hiện.
      // Khách hàng không có quyền chỉnh sửa, chỉ theo dõi tiến độ thực tế từ Database.
      // ──────────────────────────────────────────────────────────────────────────
      if (rawTasks && rawTasks.length > 0) {
        const isDone = (s) => s === 'COMPLETED' || s === 'DONE';
        const isInProgress = (s) => s === 'IN_PROGRESS' || s === 'IN_PROG';

        const isServiceTask = (t) => Boolean(
          t.serviceRequestId ||
          t.service_request_id ||
          (!t.stepId && !t.step_id && !t.stepOrder && !t.step_order && t.serviceName) ||
          (t.title && (t.title.toLowerCase().includes('dịch vụ') || t.title.toLowerCase().includes('xử lý sâu bệnh đã duyệt') || t.title.toLowerCase().includes('bón phân theo giai đoạn')))
        );
        const processTasks = rawTasks.filter((t) => !isServiceTask(t));
        const targetTasks = processTasks.length > 0 ? processTasks : rawTasks;

        const rawCompleted = targetTasks.filter((t) => isDone(t.status));
        const completedStepMap = new Map();
        for (const t of rawCompleted) {
          const sOrder = Number(t.stepOrder ?? t.step_order ?? 0);
          if (!completedStepMap.has(sOrder) || Number(t.taskId || t.id || 0) > Number(completedStepMap.get(sOrder).taskId || completedStepMap.get(sOrder).id || 0)) {
            completedStepMap.set(sOrder, t);
          }
        }
        const dbCompleted = Array.from(completedStepMap.values()).sort((a, b) => {
          const sA = Number(a.stepOrder ?? a.step_order ?? 0);
          const sB = Number(b.stepOrder ?? b.step_order ?? 0);
          return sA - sB;
        });

        const maxCompletedStep = dbCompleted.length > 0
          ? Math.max(...dbCompleted.map((t) => Number(t.stepOrder ?? t.step_order ?? 0)))
          : 0;

        const rawPending = targetTasks.filter((t) => !isDone(t.status));
        const pendingStepMap = new Map();
        for (const t of rawPending) {
          const sOrder = Number(t.stepOrder ?? t.step_order ?? 0);
          if (sOrder > maxCompletedStep) {
            if (!pendingStepMap.has(sOrder) || Number(t.taskId || t.id || 0) > Number(pendingStepMap.get(sOrder).taskId || pendingStepMap.get(sOrder).id || 0)) {
              pendingStepMap.set(sOrder, t);
            }
          }
        }
        const dbPending = Array.from(pendingStepMap.values()).sort((a, b) => {
          const sA = Number(a.stepOrder ?? a.step_order ?? 0);
          const sB = Number(b.stepOrder ?? b.step_order ?? 0);
          return sA - sB;
        });

        const currentActive = dbPending[0] ||
                              targetTasks.find((t) => isInProgress(t.status)) ||
                              targetTasks.find((t) => t.dueDate === '2026-10-23') ||
                              dbCompleted[dbCompleted.length - 1];

        const remainingUpcoming = dbPending.filter((t) => (t.taskId || t.id) !== (currentActive?.taskId || currentActive?.id));

        let lastCompletedStepNum = 0;
        if (dbCompleted.length > 0) {
          const mappedCompleted = dbCompleted.map((dt, idx) => {
            const matchDiary = rawDiaries.find((d) => Number(d.taskId) === Number(dt.taskId || dt.id));
            let proof = dt.proofPhoto && dt.proofPhoto !== '/images/Mucangchai3.jpg' ? dt.proofPhoto : null;
            if (matchDiary?.imageUrl) proof = matchDiary.imageUrl;

            let timeText = 'Hoàn thành';
            let dateText = dt.dueDate || 'Theo lịch vụ';
            if (dt.completedAt) {
              const parts = dt.completedAt.split(' - ');
              if (parts[0]) timeText = parts[0];
              if (parts[1]) dateText = parts[1];
            } else if (dt.dueDate) {
              const dObj = new Date(dt.dueDate);
              if (!isNaN(dObj)) dateText = dObj.toLocaleDateString('vi-VN');
            }

            const stepNum = Number(dt.stepOrder ?? dt.step_order) || (idx + 1);
            if (stepNum > lastCompletedStepNum) lastCompletedStepNum = stepNum;

            return {
              id: `COMP-${dt.taskId || idx + 1}`,
              stepNumber: stepNum,
              dateFormatted: dateText,
              workerName: dt.workerName || dt.assignedTo || 'Trần Văn Lực',
              title: dt.title || 'Chăm sóc định kỳ',
              description: dt.instructions || 'Thực hiện đúng quy chuẩn VietGAP tại hiện trường.',
              completedTime: timeText,
              photoCount: proof ? 1 : 0,
              proofPhoto: proof,
              sensorSnapshot: { temp: '27.5°C', humidity: '68%' }
            };
          });
          setCompletedSteps(mappedCompleted);
        } else if (stages && stages.length > 0) {
          const compStages = stages.filter((s) => s.status === 'COMPLETED').sort((a, b) => (Number(a.stepOrder || 0) - Number(b.stepOrder || 0)));
          if (compStages.length > 0) {
            setCompletedSteps(
              compStages.map((cs, idx) => {
                const sNum = Number(cs.stepOrder) || (idx + 1);
                if (sNum > lastCompletedStepNum) lastCompletedStepNum = sNum;
                return {
                  id: `STAGE-COMP-${cs.stepId || idx}`,
                  stepNumber: sNum,
                  dateFormatted: cs.date || 'Đã hoàn thành',
                  workerName: 'Trần Văn Lực',
                  title: cs.stage || cs.stepName,
                  description: cs.guide || cs.description,
                  completedTime: '08:30',
                  photoCount: 0,
                  proofPhoto: null,
                  sensorSnapshot: { temp: `${cs.minTemp || 28}°C`, humidity: `${cs.minHumidity || 70}%` }
                };
              })
            );
          } else {
            setCompletedSteps([]);
          }
        }

        const todayStepNum = Number(currentActive?.stepOrder ?? currentActive?.step_order) || (lastCompletedStepNum + 1);
        if (currentActive) {
          const matchTodayDiary = rawDiaries.find((d) => Number(d.taskId) === Number(currentActive.taskId || currentActive.id));
          setTodayTask((prev) => {
            const photos = [...prev.photos];
            if (matchTodayDiary?.imageUrl) {
              photos[0] = matchTodayDiary.imageUrl;
            } else if (currentActive.proofPhoto && currentActive.proofPhoto !== '/images/Mucangchai3.jpg') {
              photos[0] = currentActive.proofPhoto;
            }
            return {
              ...prev,
              stepNumber: todayStepNum,
              title: currentActive.title || prev.title,
              description: currentActive.instructions || prev.description,
              workerName: currentActive.workerName || currentActive.assignedTo || 'Trần Văn Lực',
              dateFormatted: prev.dateFormatted || '23/10/2026',
              timeFormatted: prev.timeFormatted || '08:30 sáng nay',
              isDone: isDone(currentActive.status),
              statusText: isDone(currentActive.status) ? 'Đã xong' : 'Đang thực hiện',
              photos,
              gpsLocation: currentActive.plotCode ? `luống ${currentActive.plotCode}` : prev.gpsLocation
            };
          });
        }

        if (remainingUpcoming.length > 0) {
          const mappedPending = remainingUpcoming.slice(0, 4).map((pt, idx) => {
            let dueText = 'Theo lịch vụ';
            if (pt.dueDate) {
              const dueObj = new Date(pt.dueDate);
              dueText = !isNaN(dueObj) ? `${dueObj.toLocaleDateString('vi-VN')} • Theo lịch vụ` : pt.dueDate;
            }
            const isFinish = idx === remainingUpcoming.length - 1 || (pt.title && pt.title.toLowerCase().includes('thu hoạch'));
            const sNum = Number(pt.stepOrder ?? pt.step_order) || (todayStepNum + 1 + idx);
            return {
              id: `UP-${pt.taskId || idx + 1}`,
              stepNumber: sNum,
              title: pt.title,
              description: pt.instructions || 'Tiến hành theo quy trình chuẩn VietGAP.',
              scheduleText: dueText,
              isFinish
            };
          });
          setUpcomingSteps(mappedPending);
        } else if (stages && stages.length > 0) {
          const pendStages = stages.filter((s) => s.status === 'PENDING').sort((a, b) => (Number(a.stepOrder || 0) - Number(b.stepOrder || 0)));
          if (pendStages.length > 0) {
            setUpcomingSteps(
              pendStages.slice(0, 4).map((ps, idx) => ({
                id: `STAGE-UP-${ps.stepId || idx}`,
                stepNumber: Number(ps.stepOrder) || (todayStepNum + 1 + idx),
                title: ps.stage || ps.stepName,
                description: ps.guide || ps.description,
                scheduleText: ps.date ? `${ps.date} • Theo lịch vụ` : 'Sắp tới',
                isFinish: (ps.stage || '').toLowerCase().includes('thu hoạch')
              }))
            );
          } else {
            setUpcomingSteps([]);
          }
        }
      } else if (stages && stages.length > 0) {
        // Fallback cho nông trại Farmely khi chưa có task trong DB
        let lastStep = 0;
        const compStages = stages.filter((s) => s.status === 'COMPLETED').sort((a, b) => (Number(a.stepOrder || 0) - Number(b.stepOrder || 0)));
        const inProgStage = stages.find((s) => s.status === 'IN_PROGRESS');
        const pendStages = stages.filter((s) => s.status === 'PENDING').sort((a, b) => (Number(a.stepOrder || 0) - Number(b.stepOrder || 0)));

        if (compStages.length > 0) {
          setCompletedSteps(
            compStages.map((cs, idx) => {
              const sNum = Number(cs.stepOrder) || (idx + 1);
              if (sNum > lastStep) lastStep = sNum;
              return {
                id: `STAGE-COMP-${cs.stepId || idx}`,
                stepNumber: sNum,
                dateFormatted: cs.date || 'Đã hoàn thành',
                workerName: 'Trần Văn Lực',
                title: cs.stage || cs.stepName,
                description: cs.guide || cs.description,
                completedTime: '08:30',
                photoCount: 0,
                proofPhoto: null,
                sensorSnapshot: { temp: `${cs.minTemp || 28}°C`, humidity: `${cs.minHumidity || 70}%` }
              };
            })
          );
        } else {
          setCompletedSteps([]);
        }

        const fallbackTodayNum = inProgStage ? (Number(inProgStage.stepOrder) || (lastStep + 1)) : (lastStep + 1);
        if (inProgStage) {
          setTodayTask((prev) => ({
            ...prev,
            stepNumber: fallbackTodayNum,
            title: inProgStage.stage || inProgStage.stepName,
            description: inProgStage.guide || inProgStage.description,
            workerName: 'Trần Văn Lực',
            dateFormatted: prev.dateFormatted || '23/10/2026',
            timeFormatted: prev.timeFormatted || '08:30 sáng nay',
            isDone: false,
            statusText: 'Đang thực hiện',
            gpsLocation: `luống ${plot.plotCode || 'P-01'}`
          }));
        }

        if (pendStages.length > 0) {
          setUpcomingSteps(
            pendStages.slice(0, 4).map((ps, idx) => ({
              id: `STAGE-UP-${ps.stepId || idx}`,
              stepNumber: Number(ps.stepOrder) || (fallbackTodayNum + 1 + idx),
              title: ps.stage || ps.stepName,
              description: ps.guide || ps.description,
              scheduleText: ps.date ? `${ps.date} • Theo lịch vụ` : 'Sắp tới',
              isFinish: (ps.stage || '').toLowerCase().includes('thu hoạch')
            }))
          );
        } else {
          setUpcomingSteps([]);
        }
      }
    }).catch((e) => {
      console.warn('Lỗi đồng bộ Backend Tasks/Diary:', e);
    });
  }, [plot.rentalId, plot.rental_id, stages, isSelf, plot.plotCode]);

  useEffect(() => {
    loadBackendTasksAndDiaries();

    // Lắng nghe realtime qua BroadcastChannel khi Worker hoàn thành tác vụ
    let bc = null;
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        bc = new BroadcastChannel('farmely_staff_activity_channel');
        bc.onmessage = () => loadBackendTasksAndDiaries();
      }
    } catch {}

    const onStorage = (e) => {
      if (e.key === 'farmely_persisted_staff_activities_v2' || e.key === 'farmely_task_sync') {
        loadBackendTasksAndDiaries();
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
      if (bc) bc.close();
    };
  }, [loadBackendTasksAndDiaries]);

  // 3. Tích hợp Open-Meteo Global Agrometeorology Live 3rd-Party API
  const [liveIotResult, setLiveIotResult] = useState(null);
  const [isRefreshingIot, setIsRefreshingIot] = useState(false);
  const plotIdentifier = plot?.plotCode || plot?.mapPlotId || plot?.id || '';

  const loadLiveAgroData = useCallback(async (force = false) => {
    if (force) setIsRefreshingIot(true);
    try {
      const data = await fetchLiveAgroIotData(plot, force);
      if (data) {
        setLiveIotResult(data);
      }
    } catch (e) {
      console.warn('Lỗi tải Open-Meteo:', e);
    } finally {
      if (force) setIsRefreshingIot(false);
    }
  }, [plotIdentifier]);

  useEffect(() => {
    loadLiveAgroData(false);
  }, [loadLiveAgroData]);

  // Ghi đè số liệu cảm biến thực tế từ Open-Meteo lên plot
  const activePlot = useMemo(() => {
    if (!liveIotResult?.metrics) return plot;
    const m = liveIotResult.metrics;
    return {
      ...plot,
      temp: m.temp || plot.temp || '25.4°C',
      soilMoisture: m.soilMoisture || plot.soilMoisture || '67%',
      airHumidity: m.airHumidity || plot.airHumidity || '97%',
      light: m.light || plot.light || '0 Lux',
      soilTemp: m.soilTemp || '28.5°C',
      lastUpdated: liveIotResult.lastUpdated || plot.lastUpdated
    };
  }, [plot, liveIotResult]);

  // Biểu đồ thời gian thực: Ưu tiên chuỗi hourly từ Open-Meteo API
  const activeIotData = useMemo(() => {
    if (liveIotResult?.hourly?.length) {
      return {
        ...(iotData || {}),
        hourly: liveIotResult.hourly
      };
    }
    return iotData;
  }, [liveIotResult, iotData]);

  useEffect(() => {
    if (!pickerOpen) return undefined;
    const close = (e) => { if (!pickerRef.current?.contains(e.target)) setPickerOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setPickerOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [pickerOpen]);

  const goTab = (id) => {
    onTabChange?.(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const current = PLOT_TABS.find((t) => t.id === tab);

  return (
    <section className="min-h-[calc(100dvh-5rem)] bg-[radial-gradient(1200px_500px_at_80%_-10%,#e7f3dc_0%,transparent_60%),linear-gradient(#f5f7f2,#f5f7f2)] pb-28 lg:pb-12">
      {/* HEADER THỬA ĐẤT: KHÔNG GIAN SANG TRỌNG THEO ẢNH VƯỜN CỦA TÔI.jpg */}
      <header className="relative overflow-hidden bg-[#0f2a20]">
        <img
          src={plot.image || '/images/Mucangchai3.jpg'}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-80 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b2219] via-[#0f2a20]/75 to-[#0f2a20]/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b2219]/80 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-[1400px] px-4 pb-10 pt-4 sm:px-6 lg:px-10 lg:pb-12">
          {/* Thanh trên cùng: Nút trở về & Đổi thửa & Hỏi Farmely AI */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/25 transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" /> Vườn của tôi
            </button>

            <div className="flex items-center gap-2">
              <div className="relative" ref={pickerRef}>
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={pickerOpen}
                  onClick={() => setPickerOpen((v) => !v)}
                  className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/25 transition cursor-pointer"
                >
                  Đổi thửa <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {pickerOpen && (
                  <ul role="listbox" className="absolute right-0 top-10 z-30 w-72 rounded-2xl bg-white p-1.5 shadow-2xl">
                    {plots.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={p.id === plot.id}
                          onClick={() => { setPickerOpen(false); onSelectPlot?.(p.id); }}
                          className={`flex w-full items-center gap-3 rounded-xl p-2 text-left cursor-pointer ${p.id === plot.id ? 'bg-emerald-50' : 'hover:bg-stone-50'}`}
                        >
                          <img src={p.image} alt="" className="h-10 w-12 shrink-0 rounded-lg object-cover" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-[#18352b]">{p.name}</span>
                            <span className="block truncate text-xs text-stone-500">{p.crop}</span>
                          </span>
                          {p.id === plot.id && <Check className="ml-auto h-4 w-4 shrink-0 text-emerald-700" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                type="button"
                onClick={onOpenAiChat}
                className="flex items-center gap-1.5 rounded-full bg-lime-300 px-3.5 py-1.5 text-xs font-bold text-[#17372c] hover:bg-lime-200 transition cursor-pointer shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Hỏi Farmely AI</span>
              </button>
            </div>
          </div>

          {/* Tiêu đề & Thông tin tiến độ theo thiết kế ảnh */}
          <div className="mt-6 flex flex-col gap-6 lg:mt-9 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 animate-fadeInUp text-white">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                <span className="flex items-center gap-1.5 rounded-full bg-lime-400 px-2.5 py-1 text-[#17372c] font-bold">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inset-0 animate-ping rounded-full bg-emerald-800/60" />
                    <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-800" />
                  </span>
                  {isSelf ? 'Tự canh tác' : 'Farmely chăm sóc'}
                </span>
                <span className="rounded-full border border-white/25 bg-black/40 px-2.5 py-1 backdrop-blur font-mono text-white/90">
                  {plot.plotCode || plot.mapPlotId || 'PLOT-P-01'}
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-white/25 bg-black/40 px-2.5 py-1 backdrop-blur text-lime-200">
                  <Radio className="h-3 w-3 text-lime-400 animate-pulse" />
                  Trạm {plot.stationId || 'AGRO-CUCHI-01'} • 21:16
                </span>
              </div>

              {/* Title */}
              <h1 className="mt-3 font-heading text-3xl font-bold leading-tight tracking-tight !text-white drop-shadow sm:text-4xl lg:text-5xl">
                {plot.name || `Thửa ${plot.plotCode || 'P-01'} – Trang trại Happy Valley Củ Chi`}
              </h1>

              {/* Sub-meta */}
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/85">
                <span className="flex items-center gap-1.5">
                  <Sprout className="h-4 w-4 text-lime-300" />
                  {cropProcess?.cropName || 'Cà chua bi Cherry F1'}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-lime-300" />
                  {plot.location || 'Trang trại Happy Valley Củ Chi'} · {plot.area || '150.00m²'}
                </span>
              </p>
            </div>

            {/* Thẻ Thu Hoạch - Mẫu 3 (1 dòng ngang hoàn toàn) chính xác theo hình 1 */}
            <div className="harvest-glass-card rounded-full border border-white/20 bg-black/60 px-5 py-3 text-white backdrop-blur-md inline-flex items-center gap-4 whitespace-nowrap self-start lg:self-end shadow-lg shadow-black/20">
              {/* 39 ngày */}
              <div className="flex items-baseline gap-1.5">
                <span className="num-highlight text-[26px] font-bold leading-none text-white tracking-tight">
                  {cropProcess?.daysLeft ?? 39}
                </span>
                <span className="unit-text text-[14px] font-normal leading-none text-white/90">
                  ngày
                </span>
              </div>

              <div className="glass-divider h-5 w-[1px] bg-white/20 shrink-0" />

              {/* Tới thu hoạch + Icon */}
              <div className="flex items-center gap-2">
                <span className="label-text text-[14px] font-normal leading-none text-white/90">
                  Tới thu hoạch
                </span>
                <svg className="wheat-icon w-4 h-4 shrink-0 text-lime-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 22 16 8"></path>
                  <path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"></path>
                  <path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"></path>
                  <path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"></path>
                  <path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z"></path>
                  <path d="M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"></path>
                  <path d="M15.47 13.47 17 15l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"></path>
                  <path d="M19.47 9.47 21 11l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L13 11l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"></path>
                </svg>
              </div>

              <div className="glass-divider h-5 w-[1px] bg-white/20 shrink-0" />

              {/* Ngày tháng */}
              <div className="date-text text-[13px] font-mono font-semibold leading-none text-lime-400">
                {formatDisplayDate(plot.expectedHarvestDate || cropProcess?.endDateFormatted || '2027-01-25')}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* THANH 4 TAB TINH GỌN (DESKTOP) */}
      <nav aria-label={`Chức năng của ${plot.name}`} className="sticky top-[5.25rem] z-20 -mt-7 hidden lg:block">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className={`flex gap-1.5 overflow-x-auto rounded-2xl border border-white/80 bg-white/95 p-1.5 backdrop-blur-xl no-scrollbar ${CARD_SHADOW}`} role="tablist">
            {PLOT_TABS.map((t) => {
              const Icon = t.icon;
              const active = t.id === tab;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => goTab(t.id)}
                  className={`relative flex flex-1 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 cursor-pointer ${
                    active
                      ? 'bg-gradient-to-br from-[#1d4a39] to-[#0f2a20] text-white shadow-md shadow-[#18352b]/25'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-lime-300' : ''}`} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* NỘI DUNG TỪNG TAB */}
      <div key={tab} className="mx-auto max-w-[1400px] animate-fadeIn px-4 pt-5 sm:px-6 lg:px-10 lg:pt-7">
        <h2 className="mb-4 font-heading text-lg font-bold text-[#18352b] lg:hidden">{current.label}</h2>

        {/* TAB 1: TỔNG QUAN */}
        {tab === 'overview' && (
          <OverviewTab
            plot={activePlot}
            cropProcess={cropProcess}
            goTab={goTab}
            onOpenStageDetail={setSelectedStageDetail}
            onOpenIotChart={() => setShowIotChartModal(true)}
            liveProviderInfo={liveIotResult}
            isSelf={isSelf}
          />
        )}

        {/* TAB 2: CÔNG VIỆC & NHẬT KÝ */}
        {tab === 'tasks' && (
          <TasksAndDiaryTab
            plot={activePlot}
            cropProcess={cropProcess}
            todayTask={todayTask}
            upcomingSteps={upcomingSteps}
            completedSteps={completedSteps}
            onOpenAllProofs={() => setShowAllProofsModal(true)}
            onOpenSinglePhoto={setSelectedPhotoUrl}
            isSelf={isSelf}
            onOpenAddTask={handleOpenAddTask}
            onOpenEditTask={handleOpenEditTask}
            onDeleteTask={handleDeleteTask}
            onToggleTaskDone={handleToggleTaskDone}
            onToggleTodayDone={handleToggleTodayDone}
            onDeleteTodayTask={handleDeleteTodayTask}
            onPromoteNextTask={handlePromoteNextTask}
            onOpenAddDiary={handleOpenAddDiary}
            onOpenEditDiary={handleOpenEditDiary}
            onDeleteDiary={handleDeleteDiary}
          />
        )}

        {/* TAB 3: DỊCH VỤ */}
        {tab === 'services' && (
          <ServicesTab
            plot={activePlot}
            services={services}
            orders={serviceOrders}
            onSelectService={onSelectService}
            onDeleteOrder={onDeleteServiceOrder}
          />
        )}

        {/* TAB 4: THU HOẠCH */}
        {tab === 'harvest' && (
          <HarvestTab
            plot={activePlot}
            harvestPlan={harvestPlan}
            onOpenHarvest={onOpenHarvest}
            cropProcess={cropProcess}
          />
        )}
      </div>

      {/* MODAL XEM BIỂU ĐỒ IOT VI KHÍ HẬU */}
      {showIotChartModal && (
        <IotChartModal
          plot={activePlot}
          iotData={activeIotData}
          onClose={() => setShowIotChartModal(false)}
        />
      )}

      {/* MODAL TẤT CẢ ẢNH MINH CHỨNG */}
      {showAllProofsModal && (
        <AllProofsGalleryModal
          todayTask={todayTask}
          completedSteps={completedSteps}
          backendDiaries={backendDiaries}
          onClose={() => setShowAllProofsModal(false)}
          onSelectPhoto={setSelectedPhotoUrl}
        />
      )}

      {/* MODAL PHÓNG TO 1 ẢNH MINH CHỨNG */}
      {selectedPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-3xl w-full rounded-3xl bg-[#0f2a20] p-4 text-white shadow-2xl overflow-hidden ring-1 ring-white/10">
            <button
              type="button"
              onClick={() => setSelectedPhotoUrl(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/60 p-2 text-white/90 hover:bg-black/80 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="overflow-hidden rounded-2xl bg-black max-h-[75vh] flex items-center justify-center">
              <img src={selectedPhotoUrl} alt="Ảnh thực địa" className="max-h-[75vh] w-auto object-contain" />
            </div>
            <p className="mt-3 text-center text-xs text-lime-300 font-semibold">
              Ảnh thực địa KTV tải lên • Đã mã hóa đối chứng GPS tại luống {plot.plotCode || 'P-01'}
            </p>
          </div>
        </div>
      )}

      {/* MODAL CẨM NANG KỸ THUẬT */}
      {selectedStageDetail && (
        <StageDetailModal
          stage={selectedStageDetail}
          cropProcess={cropProcess}
          onClose={() => setSelectedStageDetail(null)}
        />
      )}

      {/* MODAL THAO TÁC CÔNG VIỆC & NHẬT KÝ CHO KHÁCH TỰ CANH TÁC */}
      {isSelf && (
        <>
          <SelfTaskModal
            isOpen={showSelfTaskModal}
            plotStartDate={activePlot?.startDate || activePlot?.start_date || plot?.startDate || plot?.start_date}
            editingTask={editingTask}
            defaultStepNumber={
              upcomingSteps.length
                ? Math.max(...upcomingSteps.map((s) => Number(s.stepNumber) || 0)) + 1
                : ((todayTask && todayTask.id !== 'EMPTY-TODAY' && todayTask.title !== 'Chưa có công việc hôm nay' && todayTask.title !== 'Chưa có kế hoạch mới nhất'
                    ? Number(todayTask.stepNumber)
                    : (completedSteps.length ? Math.max(...completedSteps.map((s) => Number(s.stepNumber) || 0)) : 0)) + 1)
            }
            todayStepNumber={
              todayTask && todayTask.id !== 'EMPTY-TODAY' && todayTask.title !== 'Chưa có công việc hôm nay' && todayTask.title !== 'Chưa có kế hoạch mới nhất'
                ? (Number(todayTask.stepNumber) || 1)
                : (completedSteps.length ? Math.max(...completedSteps.map((s) => Number(s.stepNumber) || 0)) + 1 : 1)
            }
            hasActiveTodayTask={Boolean(todayTask && todayTask.id !== 'EMPTY-TODAY' && todayTask.title !== 'Chưa có công việc hôm nay' && todayTask.title !== 'Chưa có kế hoạch mới nhất')}
            onClose={() => setShowSelfTaskModal(false)}
            onSave={handleSaveTask}
          />
          <SelfDiaryModal
            isOpen={showSelfDiaryModal}
            plotStartDate={activePlot?.startDate || activePlot?.start_date || plot?.startDate || plot?.start_date}
            editingDiary={editingDiary}
            onClose={() => setShowSelfDiaryModal(false)}
            onSave={handleSaveDiary}
          />
        </>
      )}

      {/* THANH ĐIỀU HƯỚNG MOBILE (4 TAB) */}
      <nav aria-label={`Chức năng của ${plot.name}`} className="fixed inset-x-3 bottom-3 z-40 lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="grid grid-cols-4 rounded-[22px] border border-white/10 bg-[#0f2a20]/95 p-1.5 shadow-[0_18px_40px_-12px_rgba(15,42,32,0.6)] backdrop-blur-xl" role="tablist">
          {PLOT_TABS.map((t) => {
            const Icon = t.icon;
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={t.label}
                onClick={() => goTab(t.id)}
                className={`relative flex min-h-[50px] flex-col items-center justify-center gap-0.5 rounded-2xl px-0.5 text-[10px] font-semibold transition-all duration-300 cursor-pointer ${
                  active ? 'bg-lime-300 text-[#17372c] shadow-sm font-bold' : 'text-white/65'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate max-w-[65px]">{t.short}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </section>
  );
}
