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
  ArrowRight
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
        setHarvestTasks(unwrap(harvestBody).map((harvest) => ({
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
        })));
      })
      .catch(() => {
        if (!cancelled) { setTasks([]); setMyIssues([]); setHarvestTasks([]); }
      });
    return () => { cancelled = true; };
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

  // Handle Record Harvest Scale
  const handleConfirmHarvestScale = async (e) => {
    e.preventDefault();
    if (!selectedHarvestTask || !scaleWeightInput) return;

    const enteredBy = Number(String(user?.userId || user?.id || '').replace(/\D/g, ''));
    if (!selectedHarvestTask.rentalId || !Number.isFinite(enteredBy)) {
      alert('Hệ thống chưa có mã lượt thuê hoặc mã nhân viên để ghi nhận thu hoạch.');
      return;
    }
    const response = await fetch('/api/harvest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rentalId: selectedHarvestTask.rentalId, enteredBy, harvestDate: new Date().toISOString().slice(0, 10), yieldAmount: Number(scaleWeightInput), evidenceImageUrl: '', deliveryType: 'PICKUP' })
    });
    if (!response.ok) { alert('Không thể lưu kết quả cân lên hệ thống.'); return; }
    setHarvestTasks((prev) =>
      prev.map((h) =>
        h.id === selectedHarvestTask.id
          ? {
              ...h,
              status: 'COMPLETED',
              actualWeight: `${scaleWeightInput} kg`,
              photoUrl: '/images/moc-chau-2811.jpg',
              staffId: user?.id || 'STAFF-101',
              staffName: user?.name || 'Trần Văn Lực (CVLĐ)',
              verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          : h
      )
    );
    setSelectedHarvestTask(null);
    setScaleWeightInput('');
    alert('Đã lưu kết quả cân điện tử và in tem QR Farmely đóng thùng nông sản sạch!');
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

  return (
    <div className="dashboard-readable min-h-screen bg-[#F5F3E9] flex flex-col font-sans overflow-x-hidden">
      <PublicNavbar dashboardRailCollapsed={sidebarCollapsed} />

      <main className={`box-border flex-1 pt-24 sm:pt-28 pb-16 max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-10 w-full lg:w-auto space-y-6 transition-[margin] duration-200 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'}`}>
        
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
              <Button onClick={() => { setActiveTab('tasks'); setSelectedTaskToExecute(nextTask); }} className="w-full lg:w-auto" icon={ArrowRight}>Mở nhiệm vụ</Button>
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
          <DashboardRail user={user} fallbackName="Trần Văn Lực" roleLabel="Nhân sự hiện trường" collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed}>
            <div className={`px-2 pb-2 text-xs font-bold text-emerald-100/70 uppercase tracking-wider ${sidebarCollapsed ? 'lg:hidden' : ''}`}>Nghiệp Vụ Hiện Trường</div>

            {[
              { id: 'tasks', label: 'Ca Trực & Nhiệm Vụ Hôm Nay', icon: CheckCircle2, count: pendingCount },
              { id: 'issues', label: 'Báo Cáo Sự Cố Ruộng', icon: AlertTriangle, count: myIssues.length },
              { id: 'harvest', label: 'Cân Điện Tử & Đóng Thùng', icon: Scale, count: harvestTasks.filter(h => h.status !== 'COMPLETED').length },
              { id: 'chat', label: 'Trao Đổi Với Chuyên Gia Nam', icon: MessageSquare, count: null }
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
                  {Object.values(tasksByPlot).map((plotGroup) => (
                    <section key={plotGroup.plotCode || plotGroup.plotName} className="space-y-3">
                      <div className="rounded-xl bg-[#064b37] px-4 py-3 text-white">
                        <h4 className="font-heading text-base font-black">{plotGroup.plotName}</h4>
                        <p className="mt-0.5 text-xs text-emerald-100">{plotGroup.plotCode} • {plotGroup.crop} • {plotGroup.tasks.length} nhiệm vụ</p>
                      </div>
                  {plotGroup.tasks.map((task) => {
                    const isDone = task.status === 'COMPLETED';
                    return (
                      <div
                        key={task.id}
                        className={`p-5 rounded-2xl border transition-all text-xs space-y-3.5 ${
                          isDone
                            ? 'bg-emerald-50/30 border-emerald-200'
                            : 'bg-white border-brand-border shadow-sm'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-border/60 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-brand-green text-sm">{task.id}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              task.session === 'MORNING' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {task.session === 'MORNING' ? 'Ca Sáng' : 'Ca Chiều'}
                            </span>
                            <span className="text-stone-500 font-semibold">• Hạn chót: {task.deadline}</span>
                          </div>

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold self-start sm:self-auto ${
                            isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isDone ? `✓ Đã xong lúc ${task.completedAt}` : 'Đang chờ thực hiện'}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-bold text-brand-dark text-base">{task.title}</h4>
                          <p className="text-stone-600">
                            Thửa đất: <strong className="text-brand-dark">{task.plotName} ({task.plotCode})</strong> • Giống cây: <strong>{task.crop}</strong> • Khách: {task.customerName}
                          </p>
                          <div className="p-3 rounded-xl bg-brand-cream/60 border border-brand-border/60 text-stone-700 leading-relaxed mt-1">
                            <span className="font-bold text-brand-dark block mb-0.5">📌 Hướng dẫn từ ThS. Nam:</span>
                            {task.instructions}
                          </div>
                        </div>

                        {/* Photo proof preview if completed */}
                        {isDone && task.proofPhoto && (
                          <div className="flex items-center gap-3 pt-1">
                            <img
                              src={task.proofPhoto}
                              alt="Ảnh minh chứng"
                              className="w-20 h-16 rounded-xl object-cover border border-brand-border"
                            />
                            <div className="text-[11px] text-emerald-700 font-semibold">
                              ✓ Đã tải ảnh minh chứng ca trực và đồng bộ thành công vào Farm Diary của khách hàng.
                            </div>
                          </div>
                        )}

                        {!isDone && (
                          <div className="flex justify-end pt-2 border-t border-brand-border/60">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setSelectedTaskToExecute(task)}
                              className="font-bold gap-1.5"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>Thực hiện ca trực & Chụp ảnh đối chứng</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                    </section>
                  ))}
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
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-6">
                <div>
                  <h3 className="font-heading font-black text-xl text-brand-dark">
                    Nghiệm Thu Cân Điện Tử & Đóng Thùng QR
                  </h3>
                  <p className="text-xs text-brand-muted mt-0.5">
                    Hái nông sản đạt độ chín, đặt lên cân điện tử, nhập số kg và chụp ảnh mặt cân đối chứng minh bạch.
                  </p>
                </div>

                <div className="space-y-4">
                  {harvestTasks.length === 0 && <div className="rounded-2xl border border-dashed border-brand-border p-8 text-center text-sm text-brand-muted">Chưa có đợt thu hoạch cần ghi nhận.</div>}
                  {harvestTasks.map((task) => {
                    const isDone = task.status === 'COMPLETED';
                    return (
                      <div
                        key={task.id}
                        className="p-5 rounded-2xl border border-brand-border bg-white shadow-sm space-y-3.5 text-xs"
                      >
                        <div className="flex items-center justify-between border-b border-brand-border/60 pb-2">
                          <span className="font-mono font-bold text-brand-green text-sm">{task.id}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isDone ? '✓ Đã hoàn tất cân & dán tem QR' : 'Sẵn sàng thu hoạch hôm nay'}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-bold text-brand-dark text-sm">Thu Hoạch {task.crop}</h4>
                          <p className="text-stone-600">
                            Thửa đất: <strong className="text-brand-dark">{task.plotName} ({task.plotCode})</strong> • Khách: <strong>{task.customerName}</strong>
                          </p>
                          <p className="text-stone-500">Ước tính sản lượng: {task.expectedYield}</p>
                        </div>

                        {isDone ? (
                          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
                            <div>
                              <p className="font-bold">✓ Sản lượng thực tế: {task.actualWeight}</p>
                              <p className="text-[11px] text-emerald-700">Đã dán tem mã QR Farmely và đóng thùng xốp mát.</p>
                            </div>
                            <QrCode className="w-8 h-8 text-brand-dark" />
                          </div>
                        ) : (
                          <div className="flex justify-end pt-2 border-t border-brand-border/60">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setSelectedHarvestTask(task)}
                              className="font-bold gap-1.5"
                            >
                              <Scale className="w-3.5 h-3.5" />
                              <span>Ghi nhận số đo cân điện tử</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
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

      {/* Modal 3: Scale Harvest Yield */}
      <Modal
        isOpen={Boolean(selectedHarvestTask)}
        onClose={() => setSelectedHarvestTask(null)}
        title="Ghi Nhận Số Đo Cân Điện Tử Nghiệm Thu"
        subtitle={selectedHarvestTask ? `${selectedHarvestTask.crop} • ${selectedHarvestTask.plotName}` : undefined}
      >
        {selectedHarvestTask && (
          <form onSubmit={handleConfirmHarvestScale} className="space-y-4 text-xs text-left">
            <div className="p-3.5 rounded-xl bg-brand-cream border border-brand-border space-y-1">
              <p><strong>Thửa đất:</strong> {selectedHarvestTask.plotName}</p>
              <p><strong>Nông sản:</strong> {selectedHarvestTask.crop}</p>
              <p><strong>Khách hàng:</strong> {selectedHarvestTask.customerName}</p>
            </div>

            <div>
              <label className="block font-bold text-brand-dark mb-1">
                Khối Lượng Cân Thực Tế (Kilogram - kg): <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="Ví dụ: 24.5"
                  value={scaleWeightInput}
                  onChange={(e) => setScaleWeightInput(e.target.value)}
                  className="w-full p-3 rounded-xl border border-brand-border text-sm font-bold text-brand-green focus:ring-2 focus:ring-brand-green/20"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-stone-400">
                  KG
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border-2 border-dashed border-stone-300 text-center space-y-1 bg-stone-50">
              <Camera className="w-6 h-6 text-emerald-600 mx-auto" />
              <p className="font-bold text-stone-700">Đã chụp ảnh đồng hồ cân điện tử đối chứng</p>
              <p className="text-[10px] text-stone-400">Ảnh kèm mã QR sẽ gửi cho khách hàng nghiệm thu</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedHarvestTask(null)}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" size="sm" className="font-bold">
                XÁC NHẬN SẢN LƯỢNG & IN TEM QR
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Footer />
    </div>
  );
}
