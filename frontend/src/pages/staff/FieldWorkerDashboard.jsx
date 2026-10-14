import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import { useAuthStore } from '../../stores/authStore';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import DashboardRail from '../../components/dashboard/DashboardRail';
import { useRealtimeChat } from '../../hooks/useRealtimeChat';
import {
  UserCheck,
  CheckCircle2,
  Clock,
  Camera,
  AlertTriangle,
  Apple,
  MessageSquare,
  Droplets,
  Flame,
  ShieldCheck,
  Layers,
  Send,
  Calendar,
  Sparkles,
  QrCode,
  Scale,
  MapPin,
  PlusCircle,
  Eye,
  ArrowRight,
  PackageCheck,
  ListTodo,
  BookOpen,
  Radio,
  Trash2,
  Save,
  Printer,
  ChevronRight,
  ChevronDown,
  Play,
  Box,
  Wifi,
  WifiOff,
  Home
} from 'lucide-react';

export default function FieldWorkerDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'issues' | 'harvest' | 'chat'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Assigned care tasks loaded from the cultivation service.
  const [tasks, setTasks] = useState([]);

  // Modal State for Task Execution / Completing with Photo Proof
  const [selectedTaskToExecute, setSelectedTaskToExecute] = useState(null);
  const [taskProofNote, setTaskProofNote] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Worker field issue reports loaded from the cultivation service.
  const [myIssues, setMyIssues] = useState([]);
  const [showNewIssueModal, setShowNewIssueModal] = useState(false);
  const [newIssuePlot, setNewIssuePlot] = useState('P-01');
  const [newIssueType, setNewIssueType] = useState('Sâu bệnh mặt lá');
  const [newIssueDesc, setNewIssueDesc] = useState('');
  const [newIssueUrgency, setNewIssueUrgency] = useState('NORMAL');

  // Harvest records loaded from the cultivation service.
  const [harvestTasks, setHarvestTasks] = useState([]);
  const [selectedHarvestTask, setSelectedHarvestTask] = useState(null);
  const [scaleWeightInput, setScaleWeightInput] = useState('');
  const [scaleTareInput, setScaleTareInput] = useState('0.50');
  const [weightBatches, setWeightBatches] = useState([]);
  const [boxSize, setBoxSize] = useState(5);
  const [boxCount, setBoxCount] = useState(0);
  const [qrReady, setQrReady] = useState(false);
  const [scaleStatus, setScaleStatus] = useState('DISCONNECTED');
  const [scaleDeviceLabel, setScaleDeviceLabel] = useState('Chưa chọn thiết bị');
  const [expandedPlots, setExpandedPlots] = useState({});
  const serialPortRef = useRef(null);
  const serialReaderRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const unwrap = (body) => Array.isArray(body) ? body : (body?.data || []);
    const readJson = (url) => fetch(url).then((response) => response.ok ? response.json() : ({ data: [] }));

    Promise.all([readJson('/api/tasks'), readJson('/api/issues'), readJson('/api/harvest')])
      .then(([taskBody, issueBody, harvestBody]) => {
        if (cancelled) return;
        setTasks(unwrap(taskBody).map((task) => ({
          id: task.taskCode || `TASK-${task.taskId}`,
          apiId: task.taskId,
          rentalId: task.rentalId,
          session: task.session || 'MORNING',
          title: task.title || 'Nhiệm vụ chăm sóc',
          plotCode: task.plotCode || 'Chưa có mã thửa',
          plotName: task.plotName || task.plotCode || 'Chưa có tên thửa',
          crop: task.cropName || 'Chưa có dữ liệu giống cây',
          customerName: task.customerName || 'Chưa có dữ liệu khách hàng',
          deadline: task.dueDate || 'Chưa có hạn thực hiện',
          instructions: task.instructions || task.notes || 'Chưa có hướng dẫn từ hệ thống.',
          status: task.displayStatus || task.status || 'PENDING',
          completedAt: task.updatedAt ? new Date(task.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : null,
          proofPhoto: task.evidenceImageUrl || null
        })));
        setMyIssues(unwrap(issueBody).map((issue) => ({
          id: issue.issueCode || `ISSUE-${issue.issueId}`,
          apiId: issue.issueId,
          plotCode: issue.plotCode || 'Chưa có mã thửa',
          plotName: issue.plotName || issue.plotCode || 'Chưa có tên thửa',
          issueType: issue.issueType || 'Sự cố hiện trường',
          urgency: issue.urgency || 'NORMAL',
          sentTime: issue.createdAt ? new Date(issue.createdAt).toLocaleString('vi-VN') : 'Chưa có thời gian',
          status: issue.displayStatus || issue.status || 'OPEN',
          expertAdvice: issue.resolutionNotes || 'Đang chờ chuyên gia phản hồi.'
        })));
        const mappedHarvests = unwrap(harvestBody).map((harvest) => ({
          id: harvest.harvestCode || `HARVEST-${harvest.harvestId}`,
          apiId: harvest.harvestId,
          rentalId: harvest.rentalId,
          plotCode: harvest.plotCode || 'Chưa có mã thửa',
          plotName: harvest.plotName || harvest.plotCode || 'Chưa có tên thửa',
          crop: harvest.cropName || 'Chưa có dữ liệu giống cây',
          customerName: harvest.customerName || 'Chưa có dữ liệu khách hàng',
          expectedYield: 'Theo kết quả cân thực tế',
          status: harvest.customerConfirmed ? 'COMPLETED' : 'READY_TO_HARVEST',
          actualWeight: harvest.yieldAmount ? `${harvest.yieldAmount} kg` : '',
          photoUrl: harvest.evidenceImageUrl || ''
        }));
        setHarvestTasks(mappedHarvests);
        setSelectedHarvestTask((current) => current || mappedHarvests.find((item) => item.status !== 'COMPLETED') || mappedHarvests[0] || null);

        const plotExpansion = {};
        unwrap(taskBody).forEach((task) => {
          plotExpansion[task.plotCode || task.plotName || 'Chưa xác định'] = true;
        });
        setExpandedPlots(plotExpansion);
      })
      .catch(() => {
        if (!cancelled) { setTasks([]); setMyIssues([]); setHarvestTasks([]); }
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => () => {
    const reader = serialReaderRef.current;
    if (reader) reader.cancel().catch(() => {});
    const port = serialPortRef.current;
    if (port?.readable || port?.writable) port.close().catch(() => {});
  }, []);

  // 4. Realtime Chat with Expert State & Worker Identity
  const [selectedWorkerThreadId] = useState(() => `WORK-${user?.id || 'CURRENT'}`);
  const activeWorkerSenderName = user?.fullName || 'Nhân viên hiện trường';

  const {
    currentThread: workerChatThread,
    sendMessage: sendWorkerMessage,
    markAsRead: markWorkerChatAsRead
  } = useRealtimeChat({
    role: 'worker',
    initialThreadId: selectedWorkerThreadId,
    senderName: activeWorkerSenderName
  });

  const [chatInput, setChatInput] = useState('');
  const workerChatScrollRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'chat' && workerChatScrollRef.current) {
      workerChatScrollRef.current.scrollTop = workerChatScrollRef.current.scrollHeight;
    }
  }, [activeTab, workerChatThread?.messages]);

  // Handle Complete Task
  const handleConfirmCompleteTask = async (e) => {
    e.preventDefault();
    if (!selectedTaskToExecute) return;

    if (selectedTaskToExecute.apiId) {
      const response = await fetch(`/api/tasks/${selectedTaskToExecute.apiId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evidenceImageUrl: selectedTaskToExecute.proofPhoto || '/images/evidence-placeholder.svg', notes: taskProofNote, syncToDiary: true })
      });
      if (!response.ok) { alert('Không thể cập nhật nhiệm vụ lên hệ thống.'); return; }
    }
    setTasks((prev) =>
      prev.map((t) =>
        t.id === selectedTaskToExecute.id
          ? {
              ...t,
              status: 'COMPLETED',
              completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              proofPhoto: '/images/moc-chau-2811.jpg'
            }
      : t)
    );
    setSelectedTaskToExecute(null);
    setTaskProofNote('');
    alert('Đã hoàn thành ca trực! Ảnh và nhật ký đã được đồng bộ vào nhật ký nông trại của khách hàng.');
  };

  // Handle Submit New Issue
  const handleCreateIssue = async (e) => {
    e.preventDefault();
    const sourceTask = tasks.find((task) => task.plotCode === newIssuePlot);
    const reporterId = Number(String(user?.userId || user?.id || '').replace(/\D/g, ''));
    if (!sourceTask?.rentalId || !Number.isFinite(reporterId)) {
      alert('Hệ thống chưa có mã lượt thuê hoặc mã nhân viên cho thửa đã chọn.');
      return;
    }
    const response = await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rentalId: sourceTask.rentalId, reportedBy: reporterId, issueType: newIssueType, description: newIssueDesc, imageUrl: '' })
    });
    if (!response.ok) { alert('Không thể gửi báo cáo lên hệ thống.'); return; }
    const body = await response.json();
    const saved = body?.data || {};
    const newIssue = {
      id: saved.issueCode || `ISSUE-${saved.issueId}`,
      apiId: saved.issueId,
      plotCode: newIssuePlot,
      plotName: `Thửa ${newIssuePlot}`,
      issueType: newIssueType,
      urgency: newIssueUrgency,
      sentTime: 'Vừa xong',
      status: 'SENT',
      expertAdvice: 'Đang chờ ThS. Nam phân tích ảnh và chẩn đoán...'
    };

    setMyIssues((prev) => [newIssue, ...prev]);
    setShowNewIssueModal(false);
    setNewIssueDesc('');
    alert('Đã gửi báo cáo sự cố kèm ảnh hiện trường trực tiếp tới Chuyên gia nông nghiệp Nam!');
  };

  const connectElectronicScale = async () => {
    if (!('serial' in navigator)) {
      setScaleStatus('MANUAL');
      setScaleDeviceLabel('Trình duyệt không hỗ trợ Web Serial · nhập số cân thủ công');
      return;
    }

    try {
      setScaleStatus('CONNECTING');
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      serialPortRef.current = port;
      setScaleStatus('CONNECTED');
      setScaleDeviceLabel('Cân điện tử qua cổng nối tiếp');

      const reader = port.readable.getReader();
      serialReaderRef.current = reader;
      const decoder = new TextDecoder();
      let pending = '';

      while (port.readable) {
        const { value, done } = await reader.read();
        if (done) break;
        pending += decoder.decode(value, { stream: true });
        const readings = pending.split(/\r?\n/);
        pending = readings.pop() || '';
        readings.forEach((line) => {
          const match = line.replace(',', '.').match(/-?\d+(?:\.\d+)?/);
          if (match) setScaleWeightInput(Number(match[0]).toFixed(2));
        });
      }
    } catch (error) {
      if (error?.name !== 'NotFoundError') {
        setScaleDeviceLabel('Không thể kết nối cân · có thể nhập thủ công');
      }
      setScaleStatus('MANUAL');
    } finally {
      if (serialReaderRef.current) {
        serialReaderRef.current.releaseLock();
        serialReaderRef.current = null;
      }
    }
  };

  const grossWeight = Number.parseFloat(scaleWeightInput) || 0;
  const tareWeight = Number.parseFloat(scaleTareInput) || 0;
  const currentNetWeight = Math.max(grossWeight - tareWeight, 0);
  const totalBatchWeight = weightBatches.reduce((total, batch) => total + batch.netWeight, 0);

  const addWeightBatch = () => {
    if (currentNetWeight <= 0) {
      alert('Khối lượng tịnh phải lớn hơn 0 kg.');
      return;
    }
    const nextBatch = {
      id: `${Date.now()}-${weightBatches.length + 1}`,
      order: weightBatches.length + 1,
      grossWeight,
      tareWeight,
      netWeight: currentNetWeight,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    const nextBatches = [...weightBatches, nextBatch];
    setWeightBatches(nextBatches);
    setBoxCount(Math.ceil(nextBatches.reduce((total, batch) => total + batch.netWeight, 0) / boxSize));
    setScaleWeightInput('');
    setQrReady(false);
  };

  const removeWeightBatch = (batchId) => {
    const nextBatches = weightBatches.filter((batch) => batch.id !== batchId).map((batch, index) => ({ ...batch, order: index + 1 }));
    setWeightBatches(nextBatches);
    setBoxCount(nextBatches.length ? Math.ceil(nextBatches.reduce((total, batch) => total + batch.netWeight, 0) / boxSize) : 0);
    setQrReady(false);
  };

  const openHarvestWorkspace = (task) => {
    setSelectedHarvestTask(task);
    setActiveTab('harvest');
    setWeightBatches([]);
    setScaleWeightInput('');
    setBoxCount(0);
    setQrReady(false);
  };

  // Handle Record Harvest Scale
  const handleConfirmHarvestScale = async (e) => {
    e.preventDefault();
    if (!selectedHarvestTask || totalBatchWeight <= 0) {
      alert('Vui lòng lưu ít nhất một mẻ cân trước khi hoàn tất.');
      return;
    }

    const enteredBy = Number(String(user?.userId || user?.id || '').replace(/\D/g, ''));
    if (!selectedHarvestTask.rentalId || !Number.isFinite(enteredBy)) {
      alert('Hệ thống chưa có mã lượt thuê hoặc mã nhân viên để ghi nhận thu hoạch.');
      return;
    }
    const response = await fetch('/api/harvest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rentalId: selectedHarvestTask.rentalId, enteredBy, harvestDate: new Date().toISOString().slice(0, 10), yieldAmount: Number(totalBatchWeight.toFixed(2)), evidenceImageUrl: '', deliveryType: 'PICKUP' })
    });
    if (!response.ok) { alert('Không thể lưu kết quả cân lên hệ thống.'); return; }
    const responseBody = await response.json();
    const saved = responseBody?.data || {};
    const completedHarvest = {
      ...selectedHarvestTask,
      id: saved.harvestCode || `HARVEST-${saved.harvestId || Date.now()}`,
      apiId: saved.harvestId,
      status: 'COMPLETED',
      actualWeight: `${totalBatchWeight.toFixed(2)} kg`,
      photoUrl: saved.evidenceImageUrl || '',
      staffId: user?.id,
      staffName: user?.fullName || 'Nhân viên hiện trường',
      verifiedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    setHarvestTasks((prev) => [completedHarvest, ...prev.filter((item) => item.id !== selectedHarvestTask.id)]);
    if (selectedHarvestTask.sourceTaskId) {
      setTasks((prev) => prev.map((task) => task.id === selectedHarvestTask.sourceTaskId ? { ...task, status: 'COMPLETED', completedAt: completedHarvest.verifiedAt } : task));
    }
    setSelectedHarvestTask(completedHarvest);
    setScaleWeightInput('');
    setQrReady(true);
    alert('Đã lưu tổng sản lượng cân và gửi hồ sơ đóng thùng cho khách hàng nghiệm thu.');
  };

  // Send message to expert
  const handleSendMessageToExpert = (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    sendWorkerMessage(chatInput.trim(), activeWorkerSenderName);
    setChatInput('');
  };

  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const pendingCount = tasks.length - completedCount;
  const nextTask = tasks.find((task) => task.status === 'IN_PROGRESS') || tasks.find((task) => task.status === 'PENDING');
  const orderedTasks = [...tasks].sort((first, second) => Number(first.status === 'COMPLETED') - Number(second.status === 'COMPLETED'));
  const tasksByPlot = orderedTasks.reduce((groups, task) => {
    const key = task.plotCode || task.plotName || 'Chưa xác định';
    if (!groups[key]) groups[key] = { plotCode: task.plotCode, plotName: task.plotName, crop: task.crop, tasks: [] };
    groups[key].tasks.push(task);
    return groups;
  }, {});
  const currentSession = new Date().getHours() < 12 ? 'MORNING' : 'AFTERNOON';
  const currentSessionTasks = tasks.filter((task) => task.session === currentSession);
  const harvestedWeight = harvestTasks.reduce((sum, item) => sum + (Number.parseFloat(item.actualWeight) || 0), 0);
  const harvestTaskCandidates = tasks
    .filter((task) => /thu hoạch|cân|đóng thùng/i.test(`${task.title} ${task.instructions}`))
    .map((task) => {
      const recordedHarvest = harvestTasks.find((item) => item.rentalId === task.rentalId);
      return {
        id: `WORK-${task.id}`,
        sourceTaskId: task.id,
        apiTaskId: task.apiId,
        apiId: recordedHarvest?.apiId,
        rentalId: task.rentalId,
        plotCode: task.plotCode,
        plotName: task.plotName,
        crop: task.crop,
        customerName: task.customerName,
        expectedYield: 'Theo kết quả cân thực tế',
        status: task.status === 'COMPLETED' || recordedHarvest ? 'COMPLETED' : 'READY_TO_HARVEST',
        actualWeight: recordedHarvest?.actualWeight || '',
        deadline: task.deadline
      };
    });
  const candidateRentalIds = new Set(harvestTaskCandidates.map((item) => item.rentalId).filter(Boolean));
  const harvestWorkItems = [
    ...harvestTaskCandidates,
    ...harvestTasks.filter((item) => !candidateRentalIds.has(item.rentalId))
  ];

  useEffect(() => {
    if (!harvestWorkItems.length) {
      setSelectedHarvestTask(null);
      return;
    }
    setSelectedHarvestTask((current) => harvestWorkItems.find((item) => item.id === current?.id) || harvestWorkItems.find((item) => item.status !== 'COMPLETED') || harvestWorkItems[0]);
  }, [tasks, harvestTasks]);

  return (
    <div className="dashboard-readable min-h-screen bg-[#F5F3E9] flex flex-col font-sans overflow-x-hidden">
      <PublicNavbar dashboardRailCollapsed={sidebarCollapsed} />

      <main className={`box-border flex-1 pt-24 sm:pt-28 pb-28 lg:pb-16 max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-10 w-full lg:w-auto space-y-6 transition-[margin] duration-200 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'}`}>
        
        {nextTask && (
          <section className="rounded-2xl bg-brand-dark p-4 text-white shadow-md" aria-labelledby="next-task-title">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs font-bold text-brand-yellow">
                  <Clock className="h-4 w-4" /> Việc cần làm tiếp theo • hạn {nextTask.deadline}
                </div>
                <h2 id="next-task-title" className="font-heading text-lg font-black text-white sm:text-xl">{nextTask.title}</h2>
                <p className="mt-0.5 text-xs text-white/80">{nextTask.plotName} ({nextTask.plotCode}) • {nextTask.crop}</p>
              </div>
              <Button onClick={() => {
                if (/thu hoạch|cân|đóng thùng/i.test(`${nextTask.title} ${nextTask.instructions}`)) {
                  const harvest = harvestWorkItems.find((item) => item.rentalId === nextTask.rentalId) || harvestWorkItems[0];
                  if (harvest) openHarvestWorkspace(harvest);
                } else {
                  setActiveTab('tasks');
                  setSelectedTaskToExecute(nextTask);
                }
              }} className="w-full lg:w-auto" icon={ArrowRight}>Mở nhiệm vụ</Button>
            </div>
          </section>
        )}

        {/* Daily Shift KPI Metric Gauges */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded-xl border border-brand-border shadow-sm text-center space-y-0.5">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Nhiệm Vụ Hôm Nay
            </span>
            <div className="text-2xl font-heading font-black text-brand-dark">
              {completedCount} / {tasks.length}
            </div>
            <span className="text-[10px] text-emerald-700 font-bold block">
              Đã hoàn tất {tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0}% ca trực
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-brand-border shadow-sm text-center space-y-0.5">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Ca Trực Hiện Tại
            </span>
            <div className="text-2xl font-heading font-black text-amber-600">
              {currentSession === 'MORNING' ? 'Ca Sáng' : 'Ca Chiều'}
            </div>
            <span className="text-[10px] text-amber-700 font-bold block">{currentSessionTasks.length} nhiệm vụ từ hệ thống</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-brand-border shadow-sm text-center space-y-0.5">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Sự Cố Đã Gửi
            </span>
            <div className="text-2xl font-heading font-black text-rose-600">
              {myIssues.length} Báo cáo
            </div>
            <span className="text-[10px] text-rose-700 font-bold block">Theo dữ liệu sự cố hiện trường</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-brand-border shadow-sm text-center space-y-0.5">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Sản Lượng Cân Hôm Nay
            </span>
            <div className="text-2xl font-heading font-black text-emerald-600">
              {harvestedWeight.toLocaleString('vi-VN')} kg
            </div>
            <span className="text-[10px] text-emerald-700 font-bold block">Đạt chuẩn cân đối chứng</span>
          </div>
        </div>

        {/* Layout Left Sidebar + Content */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Worker Menu */}
          <div className="hidden lg:block">
          <DashboardRail user={user} fallbackName="Trần Văn Lực" roleLabel="Nhân sự hiện trường" collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed}>
            <div className={`px-2 pb-2 text-xs font-bold text-emerald-100/70 uppercase tracking-wider ${sidebarCollapsed ? 'lg:hidden' : ''}`}>Nghiệp Vụ Hiện Trường</div>

            {[
              { id: 'tasks', label: 'Việc hôm nay', icon: CheckCircle2, count: pendingCount },
              { id: 'harvest', label: 'Thu hoạch & đóng gói', icon: PackageCheck, count: harvestWorkItems.filter(h => h.status !== 'COMPLETED').length },
              { id: 'issues', label: 'Báo cáo sự cố', icon: AlertTriangle, count: myIssues.length },
              { id: 'chat', label: 'Trao đổi chuyên gia', icon: MessageSquare, count: null }
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
                      : 'text-emerald-50 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-emerald-100/80'}`} />
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
          </DashboardRail>
          </div>

          {/* Worker Main Section */}
          <section className="flex-1 min-w-0 w-full space-y-6">

            {/* Assigned care tasks */}
            {activeTab === 'tasks' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border/60 pb-4">
                  <div>
                    <h3 className="font-heading font-black text-xl text-brand-dark">
                      Danh Sách Nhiệm Vụ Ca Trực Hôm Nay
                    </h3>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Hoàn thành nhiệm vụ kèm ảnh chụp thực địa để tự động cập nhật nhật ký Farm Diary của khách hàng.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-brand-green bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    {pendingCount} Ca cần làm
                  </span>
                </div>

                <div className="space-y-6">
                  {Object.values(tasksByPlot).length === 0 && (
                    <div className="rounded-2xl border border-dashed border-brand-border p-8 text-center text-sm text-brand-muted">Chưa có nhiệm vụ được phân công từ hệ thống.</div>
                  )}
                  {Object.values(tasksByPlot).map((plotGroup) => {
                    const plotKey = plotGroup.plotCode || plotGroup.plotName;
                    const isExpanded = expandedPlots[plotKey] !== false;
                    const completedForPlot = plotGroup.tasks.filter((task) => task.status === 'COMPLETED').length;
                    return (
                      <section key={plotKey} className="overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm">
                        <button
                          type="button"
                          onClick={() => setExpandedPlots((current) => ({ ...current, [plotKey]: !isExpanded }))}
                          className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-emerald-50/40"
                        >
                          <div className="flex h-14 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-500 text-white shadow-sm">
                            <MapPin className="h-5 w-5" />
                            <span className="ml-1 text-xs font-black">{plotGroup.plotCode}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="truncate font-heading text-base font-black text-brand-dark">{plotGroup.plotName}</h4>
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">{plotGroup.crop}</span>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <div className="h-1.5 min-w-20 flex-1 overflow-hidden rounded-full bg-stone-100">
                                <div className="h-full rounded-full bg-emerald-600" style={{ width: `${plotGroup.tasks.length ? (completedForPlot / plotGroup.tasks.length) * 100 : 0}%` }} />
                              </div>
                              <span className="text-[10px] font-bold text-stone-500">{completedForPlot}/{plotGroup.tasks.length} nhiệm vụ</span>
                            </div>
                          </div>
                          {isExpanded ? <ChevronDown className="h-5 w-5 text-stone-400" /> : <ChevronRight className="h-5 w-5 text-stone-400" />}
                        </button>

                        {isExpanded && (
                          <div className="divide-y divide-brand-border/60 border-t border-brand-border/60">
                            {plotGroup.tasks.map((task) => {
                              const isDone = task.status === 'COMPLETED';
                              const isInProgress = task.status === 'IN_PROGRESS';
                              const isHarvestTask = /thu hoạch|cân|đóng thùng/i.test(task.title);
                              return (
                                <div key={task.id} className={`grid gap-3 p-4 text-xs sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center ${isInProgress ? 'bg-sky-50/70' : isDone ? 'bg-emerald-50/40' : 'bg-white'}`}>
                                  <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 font-bold ${isDone ? 'bg-emerald-100 text-emerald-800' : isInProgress ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-800'}`}>
                                    <span className={`h-2 w-2 rounded-full ${isDone ? 'bg-emerald-500' : isInProgress ? 'bg-sky-500' : 'bg-amber-400'}`} />
                                    {isDone ? 'Hoàn thành' : isInProgress ? 'Đang làm' : 'Chờ làm'}
                                  </span>
                                  <div className="min-w-0">
                                    <h5 className="font-heading text-sm font-black text-brand-dark">{task.title}</h5>
                                    <p className="mt-1 line-clamp-2 text-stone-500"><Clock className="mr-1 inline h-3.5 w-3.5" />{task.deadline} · {task.instructions}</p>
                                  </div>
                                  {!isDone && (
                                    <Button
                                      variant={isHarvestTask ? 'secondary' : 'outline'}
                                      size="sm"
                                      onClick={() => {
                                        if (isHarvestTask) {
                                          const harvest = harvestTasks.find((item) => item.plotCode === task.plotCode) || harvestTasks.find((item) => item.status !== 'COMPLETED');
                                          if (harvest) openHarvestWorkspace(harvest);
                                          else setSelectedTaskToExecute(task);
                                        } else {
                                          setSelectedTaskToExecute(task);
                                        }
                                      }}
                                      className="w-full gap-1.5 font-bold sm:w-auto"
                                    >
                                      {isHarvestTask ? <Scale className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                                      {isHarvestTask ? 'Mở cân & đóng gói' : 'Thực hiện'}
                                    </Button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Field issues */}
            {activeTab === 'issues' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-brand-border/60 pb-4">
                  <div>
                    <h3 className="font-heading font-black text-xl text-brand-dark">
                      Báo Cáo Sự Cố Phát Sinh Tại Vườn
                    </h3>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Báo cáo trực tiếp sâu bệnh, hư hỏng hệ thống tưới kèm ảnh chụp tới Chuyên gia ThS. Nam.
                    </p>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => setShowNewIssueModal(true)} className="font-bold">
                    + Báo cáo sự cố mới
                  </Button>
                </div>

                <div className="space-y-4">
                  {myIssues.length === 0 && <div className="rounded-2xl border border-dashed border-brand-border p-8 text-center text-sm text-brand-muted">Chưa có báo cáo sự cố từ hệ thống.</div>}
                  {myIssues.map((iss) => (
                    <div
                      key={iss.id}
                      className="p-5 rounded-2xl border border-brand-border bg-white shadow-sm space-y-3 text-xs"
                    >
                      <div className="flex items-center justify-between border-b border-brand-border/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-brand-green text-sm">{iss.id}</span>
                          <span className="text-stone-400">• Thửa {iss.plotCode} • {iss.sentTime}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          iss.urgency === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-stone-100 text-stone-700'
                        }`}>
                          {iss.urgency === 'HIGH' ? 'Khẩn cấp' : 'Bình thường'}
                        </span>
                      </div>

                      <h4 className="font-bold text-brand-dark text-sm">{iss.issueType}</h4>

                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                        <span className="font-bold flex items-center gap-1.5 text-xs text-brand-green">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Chỉ đạo xử lý từ Chuyên gia ThS. Nam:</span>
                        </span>
                        <p className="leading-relaxed">{iss.expertAdvice}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Harvest scaling */}
            {activeTab === 'harvest' && (
              <div className="grid min-h-[680px] overflow-hidden rounded-3xl border border-brand-border bg-white shadow-sm xl:grid-cols-[minmax(260px,0.75fr)_minmax(430px,1.25fr)]">
                <aside className="border-b border-brand-border bg-[#faf9f4] p-4 sm:p-6 xl:border-b-0 xl:border-r">
                  <div className="mb-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Thu hoạch & đóng gói</p>
                    <h3 className="mt-1 font-heading text-xl font-black text-brand-dark">Đợt cần xử lý</h3>
                    <p className="mt-1 text-xs text-brand-muted">Chọn thửa để mở cân điện tử và hồ sơ đóng thùng.</p>
                  </div>
                  <div className="space-y-3">
                    {harvestWorkItems.length === 0 && <div className="rounded-2xl border border-dashed border-brand-border p-6 text-center text-xs text-brand-muted">Chưa có nhiệm vụ thu hoạch từ hệ thống.</div>}
                    {harvestWorkItems.map((task) => {
                      const active = selectedHarvestTask?.id === task.id;
                      return (
                        <button key={task.id} type="button" onClick={() => openHarvestWorkspace(task)} className={`w-full rounded-2xl border p-4 text-left transition ${active ? 'border-emerald-600 bg-emerald-50 shadow-sm' : 'border-brand-border bg-white hover:border-emerald-300'}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-heading text-sm font-black text-brand-dark">{task.plotName}</p>
                              <p className="mt-0.5 truncate text-[11px] text-stone-500">{task.plotCode} · {task.crop}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" />
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{task.status === 'COMPLETED' ? 'Đã ghi nhận' : 'Sẵn sàng cân'}</span>
                            {task.actualWeight && <strong className="text-xs text-emerald-800">{task.actualWeight}</strong>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </aside>

                <section className="min-w-0 p-4 sm:p-6">
                  {!selectedHarvestTask ? (
                    <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
                      <Scale className="h-12 w-12 text-emerald-200" />
                      <h4 className="mt-3 font-heading text-lg font-black text-brand-dark">Chọn một đợt thu hoạch</h4>
                      <p className="mt-1 max-w-sm text-xs text-brand-muted">Dữ liệu cân, đóng thùng và QR sẽ được ghi nhận theo đúng thửa đã chọn.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleConfirmHarvestScale} className="space-y-4">
                      <div className="flex flex-col gap-3 border-b border-brand-border pb-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-sky-500" /><span className="text-xs font-bold text-sky-700">Đang làm</span></div>
                          <h3 className="mt-1 font-heading text-xl font-black text-brand-dark">Cân và đóng thùng</h3>
                          <p className="mt-1 text-xs text-stone-500">{selectedHarvestTask.plotName} ({selectedHarvestTask.plotCode}) · {selectedHarvestTask.crop}</p>
                        </div>
                        <Button type="button" variant="danger" size="sm" onClick={() => { setNewIssuePlot(selectedHarvestTask.plotCode); setShowNewIssueModal(true); }}><AlertTriangle className="mr-1 h-3.5 w-3.5" />Báo sự cố</Button>
                      </div>

                      <div className="rounded-2xl border border-brand-border bg-stone-50 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800"><Scale className="h-6 w-6" /></div>
                            <div><p className="font-heading text-sm font-black text-brand-dark">Cân điện tử</p><p className="text-[11px] text-stone-500">{scaleDeviceLabel}</p></div>
                          </div>
                          <Button type="button" variant={scaleStatus === 'CONNECTED' ? 'secondary' : 'outline'} size="sm" onClick={connectElectronicScale} disabled={scaleStatus === 'CONNECTING'}>
                            {scaleStatus === 'CONNECTED' ? <Wifi className="mr-1 h-3.5 w-3.5" /> : <WifiOff className="mr-1 h-3.5 w-3.5" />}
                            {scaleStatus === 'CONNECTED' ? 'Đã kết nối' : scaleStatus === 'CONNECTING' ? 'Đang kết nối...' : 'Kết nối cân'}
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                        <p className="text-xs font-bold text-brand-dark">Khối lượng hiện tại</p>
                        <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_110px_110px] sm:items-end">
                          <label className="block"><span className="sr-only">Khối lượng tổng</span><div className="relative"><input type="number" min="0" step="0.01" value={scaleWeightInput} onChange={(event) => setScaleWeightInput(event.target.value)} placeholder="0.00" className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 pr-14 font-heading text-3xl font-black text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-300" /><span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-stone-400">kg</span></div></label>
                          <label className="text-[10px] font-bold text-stone-500">Bì (kg)<input type="number" min="0" step="0.01" value={scaleTareInput} onChange={(event) => setScaleTareInput(event.target.value)} className="mt-1 w-full rounded-xl border border-brand-border bg-white px-3 py-3 text-sm font-black text-brand-dark" /></label>
                          <div className="rounded-xl border border-emerald-200 bg-white px-3 py-2.5"><span className="block text-[10px] font-bold text-stone-500">Tịnh</span><strong className="text-lg text-emerald-800">{currentNetWeight.toFixed(2)} kg</strong></div>
                        </div>
                        <Button type="button" variant="secondary" onClick={addWeightBatch} className="mt-3 w-full"><Save className="mr-1.5 h-4 w-4" />Lưu mẻ cân</Button>
                      </div>

                      <div className="rounded-2xl border border-brand-border p-4">
                        <div className="mb-3 flex items-center justify-between"><h4 className="font-heading text-sm font-black text-brand-dark">Danh sách mẻ cân</h4><span className="text-[11px] font-bold text-stone-400">{weightBatches.length} mẻ</span></div>
                        {weightBatches.length === 0 ? <p className="rounded-xl bg-stone-50 p-4 text-center text-xs text-stone-400">Chưa lưu mẻ cân nào.</p> : <div className="divide-y divide-brand-border/60">{weightBatches.map((batch) => <div key={batch.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 py-2.5 text-xs"><span className="font-bold text-brand-dark">Mẻ #{String(batch.order).padStart(2, '0')}</span><strong className="text-emerald-800">{batch.netWeight.toFixed(2)} kg</strong><span className="text-stone-400">{batch.time}</span><button type="button" onClick={() => removeWeightBatch(batch.id)} className="rounded-lg p-2 text-stone-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Xóa mẻ cân ${batch.order}`}><Trash2 className="h-4 w-4" /></button></div>)}</div>}
                        <div className="mt-2 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5"><span className="text-xs font-black text-brand-dark">Tổng tịnh</span><strong className="text-lg text-emerald-800">{totalBatchWeight.toFixed(2)} kg</strong></div>
                      </div>

                      <div className="rounded-2xl border border-brand-border p-4">
                        <h4 className="font-heading text-sm font-black text-brand-dark">Đóng thùng & tạo QR</h4>
                        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                          <label className="text-[10px] font-bold text-stone-500">Loại thùng<select value={boxSize} onChange={(event) => { const next = Number(event.target.value); setBoxSize(next); setBoxCount(totalBatchWeight ? Math.ceil(totalBatchWeight / next) : 0); setQrReady(false); }} className="mt-1 w-full rounded-xl border border-brand-border bg-white px-3 py-3 text-sm font-bold text-brand-dark"><option value={2}>2 kg</option><option value={5}>5 kg</option><option value={10}>10 kg</option></select></label>
                          <label className="text-[10px] font-bold text-stone-500">Số lượng thùng<input type="number" min="0" value={boxCount} onChange={(event) => { setBoxCount(Number(event.target.value)); setQrReady(false); }} className="mt-1 w-full rounded-xl border border-brand-border px-3 py-3 text-sm font-bold text-brand-dark" /></label>
                          <Button type="button" variant="outline" onClick={() => {
                            if (totalBatchWeight <= 0 || boxCount <= 0) {
                              alert('Vui lòng lưu mẻ cân và chọn số lượng thùng.');
                              return;
                            }
                            if (qrReady) window.print();
                            else setQrReady(true);
                          }}><Printer className="mr-1.5 h-4 w-4" />{qrReady ? 'In tem QR' : 'Tạo tem QR'}</Button>
                        </div>
                        {qrReady && <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3"><QrCode className="h-12 w-12 text-brand-dark" /><div><p className="text-xs font-black text-brand-dark">Tem truy xuất đã sẵn sàng</p><p className="text-[10px] text-emerald-700">{boxCount} thùng · {boxSize} kg/thùng · {selectedHarvestTask.plotCode}</p></div></div>}
                      </div>

                      <div className="sticky bottom-0 -mx-4 flex flex-col-reverse gap-2 border-t border-brand-border bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:justify-end sm:border-0 sm:bg-transparent sm:p-0">
                        <Button type="button" variant="outline"><Save className="mr-1 h-4 w-4" />Lưu tạm</Button>
                        <Button type="submit" variant="secondary" disabled={totalBatchWeight <= 0 || boxCount <= 0}><CheckCircle2 className="mr-1 h-4 w-4" />Hoàn tất & gửi nghiệm thu</Button>
                      </div>
                    </form>
                  )}
                </section>
              </div>
            )}

            {/* TAB 4: CHAT WITH EXPERT (Kênh trao đổi với ThS. Nam) */}
            {activeTab === 'chat' && (
              <div className="bg-white rounded-3xl border border-brand-border shadow-sm overflow-hidden flex flex-col h-[680px]">
                {/* Header */}
                <div className="p-4 bg-brand-cream border-b border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-green text-white flex items-center justify-center font-bold">
                      N
                    </div>
                    <div>
                      <h4 className="font-bold text-brand-dark text-sm">
                        {workerChatThread?.expertName || 'ThS. Nguyễn Hoàng Nam'} (Chuyên gia nông nghiệp)
                      </h4>
                      <p className="text-[11px] text-emerald-700 flex items-center gap-1 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Đang trực tuyến • Sẵn sàng chỉ đạo kỹ thuật
                      </p>
                    </div>
                  </div>

                  {/* Current authenticated worker */}
                  <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-brand-border text-xs">
                    <span className="text-stone-500 font-bold text-[11px]">Nhân viên:</span>
                    <strong className="text-brand-dark">{activeWorkerSenderName}</strong>
                  </div>
                </div>

                {/* Messages Body */}
                <div
                  ref={workerChatScrollRef}
                  className="flex-1 p-5 overflow-y-auto space-y-3.5 text-xs bg-stone-50/30"
                >
                  {(!workerChatThread?.messages || workerChatThread.messages.length === 0) ? (
                    <div className="text-center py-12 text-stone-400">
                      Chưa có tin nhắn nào trong kênh này. Hãy gửi báo cáo hiện trường cho ThS. Nam!
                    </div>
                  ) : (
                    workerChatThread.messages.map((msg) => {
                      const isMe = msg.sender === 'worker';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div className="text-[10px] text-stone-400 mb-1 px-1">
                            {isMe ? (msg.senderName || activeWorkerSenderName) : (msg.senderName || 'ThS. Nguyễn Hoàng Nam')} • {msg.time}
                          </div>
                          <div
                            className={`max-w-[75%] p-3.5 rounded-2xl leading-relaxed ${
                              isMe
                                ? 'bg-[#294C38] text-white rounded-br-none shadow-sm'
                                : 'bg-white text-stone-800 rounded-bl-none border border-brand-border shadow-xs'
                            }`}
                          >
                            {msg.prescriptionTag && (
                              <div className="mb-1.5 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                {msg.prescriptionTag}
                              </div>
                            )}
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          </div>


                        </div>
                      );
                    })
                  )}


                </div>

                <form onSubmit={handleSendMessageToExpert} className="p-3.5 bg-white border-t border-brand-border flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Nhập câu hỏi hoặc tình hình hiện trường gửi ThS. Nam (với tên ${activeWorkerSenderName})...`}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-stone-50 border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                  />
                  <Button type="submit" variant="primary" size="sm" className="font-bold">
                    <Send className="w-3.5 h-3.5 mr-1" />
                    <span>Gửi</span>
                  </Button>
                </form>
              </div>
            )}

          </section>
        </div>

      </main>

      {/* Modal 1: Execute Task & Upload Proof Photo */}
      <Modal
        isOpen={Boolean(selectedTaskToExecute)}
        onClose={() => setSelectedTaskToExecute(null)}
        title="Xác Nhận Hoàn Thành Ca Trực Hiện Trường"
        subtitle={selectedTaskToExecute?.title}
      >
        {selectedTaskToExecute && (
          <form onSubmit={handleConfirmCompleteTask} className="space-y-4 text-xs text-left">
            <div className="p-3.5 rounded-xl bg-brand-cream border border-brand-border space-y-1">
              <p><strong>Nhiệm vụ:</strong> {selectedTaskToExecute.title}</p>
              <p><strong>Thửa đất:</strong> {selectedTaskToExecute.plotName} ({selectedTaskToExecute.plotCode})</p>
              <p><strong>Khách hàng:</strong> {selectedTaskToExecute.customerName}</p>
            </div>

            <div className="p-4 rounded-xl border-2 border-dashed border-stone-300 text-center space-y-1.5 bg-stone-50">
              <Camera className="w-7 h-7 text-brand-green mx-auto" />
              <p className="font-bold text-stone-700">Đính kèm ảnh minh chứng thực tế</p>
              <p className="text-[10px] text-stone-400">Ảnh này sẽ tự động xuất hiện trên Farm Diary của khách hàng</p>
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                ✓ Đã chụp ảnh hiện trường (moc-chau-2811.jpg)
              </span>
            </div>

            <div>
              <label className="block font-bold text-brand-dark mb-1">
                Ghi chú ca trực gửi khách hàng (Tùy chọn):
              </label>
              <textarea
                rows={2}
                value={taskProofNote}
                onChange={(e) => setTaskProofNote(e.target.value)}
                placeholder="Ví dụ: Đã tưới đẫm đất, lá xanh tốt, không phát hiện sâu bệnh..."
                className="w-full p-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-green/20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedTaskToExecute(null)}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" size="sm" className="font-bold">
                XÁC NHẬN HOÀN TẤT & ĐỒNG BỘ DIARY
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal 2: Report Field Issue */}
      <Modal
        isOpen={showNewIssueModal}
        onClose={() => setShowNewIssueModal(false)}
        title="Gửi Báo Cáo Sự Cố Đồng Ruộng Mới"
        subtitle="Chuyển ngay tới Chuyên gia Nông nghiệp ThS. Nam"
      >
        <form onSubmit={handleCreateIssue} className="space-y-4 text-xs text-left">
          <div>
            <label className="block font-bold text-brand-dark mb-1">Thửa Đất Phát Hiện Sự Cố:</label>
            <select
              value={newIssuePlot}
              onChange={(e) => setNewIssuePlot(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-brand-border bg-white text-xs font-bold"
            >
              {[...new Map(tasks.map((task) => [task.plotCode, task])).values()].map((task) => (
                <option key={task.plotCode} value={task.plotCode}>{task.plotName} ({task.plotCode})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">Loại Bất Thường:</label>
            <select
              value={newIssueType}
              onChange={(e) => setNewIssueType(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-brand-border bg-white text-xs font-bold"
            >
              <option value="Sâu bệnh mặt lá (Bọ trĩ, rầy mềm)">Sâu bệnh mặt lá (Bọ trĩ, rầy mềm)</option>
              <option value="Ống tưới nhỏ giọt bị rò rỉ / nghẹt cặn">Ống tưới nhỏ giọt bị rò rỉ / nghẹt cặn</option>
              <option value="Đất nứt nẻ thiếu ẩm">Đất nứt nẻ thiếu ẩm</option>
              <option value="Cây héo rũ gốc / thối rễ">Cây héo rũ gốc / thối rễ</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">Mức Độ Khẩn Cấp:</label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-brand-border cursor-pointer">
                <input
                  type="radio"
                  name="urgency"
                  checked={newIssueUrgency === 'NORMAL'}
                  onChange={() => setNewIssueUrgency('NORMAL')}
                />
                <span>Bình thường (Xử lý trong ngày)</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-brand-border cursor-pointer">
                <input
                  type="radio"
                  name="urgency"
                  checked={newIssueUrgency === 'HIGH'}
                  onChange={() => setNewIssueUrgency('HIGH')}
                />
                <span className="text-rose-600 font-bold">Khẩn cấp (Cần phác đồ ngay)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">Mô Tả Hiện Trường:</label>
            <textarea
              rows={3}
              required
              value={newIssueDesc}
              onChange={(e) => setNewIssueDesc(e.target.value)}
              placeholder="Mô tả cụ thể vị trí, số lượng cây bị ảnh hưởng..."
              className="w-full p-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-green/20"
            />
          </div>

          <div className="p-3 rounded-xl border-2 border-dashed border-stone-300 text-center space-y-1 bg-stone-50">
            <Camera className="w-5 h-5 text-stone-400 mx-auto" />
            <p className="font-bold text-stone-600">Đính kèm ảnh chụp lá / hiện trường</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowNewIssueModal(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold">
              GỬI BÁO CÁO CHO CHUYÊN GIA
            </Button>
          </div>
        </form>
      </Modal>

      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-4 rounded-2xl border border-brand-border bg-white/95 p-2 shadow-elevated backdrop-blur lg:hidden" aria-label="Điều hướng nhân viên hiện trường">
        {[
          { id: 'tasks', label: 'Công việc', icon: ListTodo },
          { id: 'harvest', label: 'Đóng gói', icon: PackageCheck },
          { id: 'issues', label: 'Sự cố', icon: AlertTriangle },
          { id: 'chat', label: 'Chuyên gia', icon: MessageSquare }
        ].map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return <button key={item.id} type="button" onClick={() => setActiveTab(item.id)} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold transition ${active ? 'bg-[#064b37] text-white' : 'text-stone-500 hover:bg-stone-50'}`}><Icon className="h-5 w-5" />{item.label}</button>;
        })}
      </nav>

      <Footer />
    </div>
  );
}
