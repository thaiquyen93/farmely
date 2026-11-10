import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { varietiesData as initialVarieties } from '../../data/varieties';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import {
  Plus,
  Eye,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Check,
  AlertCircle,
  BookOpen,
  Sprout,
  X,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { sendNotification } from '../../services/notificationService';
import { getProcessTemplateListState } from './processTemplateListState';

export default function ProcessTemplates({ detailBasePath = '/admin/master-data/process-templates' }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedVarietyId = searchParams.get('varietyId');
  const requestMode = searchParams.get('mode');
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const isExpert = user?.role === 'EXPERT';

  const [templates, setTemplates] = useState([]);
  const [varieties, setVarieties] = useState(initialVarieties);
  const [loading, setLoading] = useState(true);
  const [isLiveDb, setIsLiveDb] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  // Form State
  const [varietyId, setVarietyId] = useState(requestedVarietyId || '1');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const { isFiltered, visibleTemplates, matchingCount } = getProcessTemplateListState(templates, requestedVarietyId, requestMode);
  const selectedVariety = varieties.find((variety) => String(variety.id || variety.varietyId) === String(requestedVarietyId));
  const selectedVarietyName = selectedVariety?.name || selectedVariety?.varietyName || `Giống #${requestedVarietyId}`;
  const clearVarietyFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('varietyId');
    next.delete('mode');
    setSearchParams(next);
  };

  // Quick Steps State for new template
  const [steps, setSteps] = useState([
    {
      dayOffset: 0,
      stepName: 'Chuẩn bị luống đất & Bón lót vi sinh',
      taskType: 'SOIL_PREP',
      description: 'Cày xới đất tơi xốp độ sâu 25cm, bón lót phân ủ hoai mục và vôi bột khử chua, tưới ẩm 70%.',
      materialsNeeded: 'Phân hữu cơ vi sinh, chế phẩm Trichoderma, vôi bột'
    },
    {
      dayOffset: 2,
      stepName: 'Xuống giống / Cấy cây con F1',
      taskType: 'PLANTING',
      description: 'Cấy cây giống khỏe mạnh vào luống với khoảng cách tiêu chuẩn, tưới nhẹ quanh gốc cố định rễ.',
      materialsNeeded: 'Cây giống F1 tuyển chọn, nước kích rễ sinh học'
    },
    {
      dayOffset: 10,
      stepName: 'Bón thúc đợt 1 & Kiểm tra sinh trưởng',
      taskType: 'FERTILIZATION',
      description: 'Pha loãng phân đạm cá hữu cơ tưới quanh gốc, kiểm tra phòng trừ bọ trĩ và rệp non.',
      materialsNeeded: 'Đạm cá lên men vi sinh 1:200, tinh dầu Neem phòng sâu'
    },
    {
      dayOffset: 25,
      stepName: 'Bấm ngọn định hình & Buộc giàn leo',
      taskType: 'PRUNING',
      description: 'Tỉa bỏ chồi nách dưới mắt thứ 5, hướng thân chính leo giàn lưới, tỉa lá già sát đất.',
      materialsNeeded: 'Kẹp bấm thân, dây buộc sinh học'
    },
    {
      dayOffset: 45,
      stepName: 'Thu hoạch đợt đầu chuẩn VietGAP',
      taskType: 'HARVEST',
      description: 'Thu hái vào buổi sáng sớm khi quả đạt kích thước tiêu chuẩn, dùng kéo cắt cuống cách 1cm.',
      materialsNeeded: 'Kéo chuyên dụng khử trùng, thùng carton có tem QR VietGAP'
    }
  ]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const getTemplateStatus = (tId, fallbackStatus = 'ACTIVE') => {
    try {
      const stored = localStorage.getItem(`farmely_template_status_${tId}`);
      if (stored) return stored;
    } catch {}
    return fallbackStatus;
  };

  const setTemplateStatus = (tId, status) => {
    try {
      localStorage.setItem(`farmely_template_status_${tId}`, status);
    } catch {}
  };

  const loadTemplatesFromApi = async () => {
    setLoading(true);
    let loaded = [];
    try {
      // Ưu tiên /api/templates (Spring Boot knowledge-service)
      const res = await fetch('/api/templates');
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        loaded = json.data;
        setIsLiveDb(true);
      }
    } catch (e) {
      console.warn('Cannot fetch /api/templates, trying fallback:', e);
    }

    if (loaded.length === 0) {
      try {
        const res2 = await fetch('/api/process-templates');
        const json2 = await res2.json();
        if (json2 && json2.success && Array.isArray(json2.data)) {
          loaded = json2.data;
          setIsLiveDb(true);
        }
      } catch (_) {}
    }

    // Merge status from localStorage
    const merged = loaded.map((t) => {
      const id = t.templateId || t.id;
      const effectiveStatus = getTemplateStatus(id, t.status || 'ACTIVE');
      return {
        ...t,
        id,
        templateId: id,
        name: t.name || `Quy Trình Canh Tác ${t.varietyName || 'VietGAP'}`,
        status: effectiveStatus,
        totalSteps: t.steps?.length || t.totalSteps || 0,
        totalDays: t.steps && t.steps.length > 0 ? Math.max(...t.steps.map((s) => s.dayOffset || 0)) + 5 : (t.totalDays || 45)
      };
    });

    setTemplates(merged);
    setLoading(false);
  };

  useEffect(() => {
    loadTemplatesFromApi();

    // Fetch live varieties
    fetch('/api/varieties')
      .then((res) => res.json())
      .then((res) => {
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setVarieties(res.data);
          const first = res.data.find((variety) => String(variety.id || variety.varietyId) === String(requestedVarietyId)) || res.data[0];
          const fId = String(first.id || first.varietyId);
          setVarietyId(fId);
          setName(`Quy trình canh tác chuẩn VietGAP - ${first.name || first.varietyName}`);
        }
      })
      .catch(() => {});
  }, [requestedVarietyId]);

  // When variety selection changes, auto-suggest standard process name
  const handleVarietyChange = (vId) => {
    setVarietyId(vId);
    const selected = varieties.find((v) => String(v.id || v.varietyId) === String(vId));
    if (selected) {
      setName(`Quy trình canh tác chuẩn VietGAP - ${selected.name || selected.varietyName}`);
    }
  };

  // Add a new step row
  const handleAddStepRow = () => {
    const lastDay = steps.length > 0 ? Math.max(...steps.map((s) => Number(s.dayOffset || 0))) : 0;
    setSteps([
      ...steps,
      {
        dayOffset: lastDay + 7,
        stepName: 'Chăm sóc & Theo dõi sinh trưởng định kỳ',
        taskType: 'CARE',
        description: 'Kiểm tra độ ẩm đất, tưới nước bổ sung và tỉa lá gốc thông thoáng.',
        materialsNeeded: 'Chế phẩm sinh học hữu cơ'
      }
    ]);
  };

  // Remove a step row
  const handleRemoveStepRow = (index) => {
    if (steps.length <= 1) {
      alert('Quy trình canh tác cần có tối thiểu 1 bước kỹ thuật.');
      return;
    }
    setSteps(steps.filter((_, i) => i !== index));
  };

  // Update step field
  const handleStepFieldChange = (index, field, value) => {
    setSteps(
      steps.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  // Create Template Handler
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập tên quy trình canh tác');
      return;
    }

    setIsSubmitting(true);
    const numericVarietyId = Number(varietyId);
    if (!Number.isInteger(numericVarietyId) || numericVarietyId <= 0) {
      showToast('error', 'Vui lòng chọn giống cây trồng hợp lệ.');
      setIsSubmitting(false);
      return;
    }
    const selectedVariety = varieties.find((v) => String(v.id || v.varietyId) === String(varietyId));
    const varietyNameStr = selectedVariety?.name || selectedVariety?.varietyName || 'Giống cây trồng';

    // Role business logic: Expert creates -> PENDING_APPROVAL; Admin creates -> ACTIVE
    const initialStatus = isExpert ? 'PENDING_APPROVAL' : 'ACTIVE';

    const payload = {
      varietyId: numericVarietyId,
      version: 'v1.0',
      name: name.trim(),
      description: desc.trim() || `Quy trình kỹ thuật nông nghiệp chuẩn VietGAP dành cho ${varietyNameStr}.`,
      ptCreatedBy: user?.userId || 5,
      steps: steps.map((s, idx) => ({
        stepOrder: idx + 1,
        stepName: s.stepName.trim(),
        dayOffset: parseInt(s.dayOffset, 10) || 0,
        taskType: s.taskType || 'CARE',
        durationDays: 1,
        description: s.description.trim(),
        materialsNeeded: s.materialsNeeded?.trim() || 'Vật tư hữu cơ sinh học'
      }))
    };

    try {
      let createdId = null;
      let res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        res = await fetch('/api/process-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const json = await res.json().catch(() => null);
      if (res.ok && json?.success && (json.data?.templateId || json.data?.id)) {
        createdId = json.data.templateId || json.data.id;
      } else {
        throw new Error(json?.message || 'Không thể lưu quy trình vào hệ thống.');
      }

      setTemplateStatus(createdId, initialStatus);

      // GỬI THÔNG BÁO THEO NGHIỆP VỤ:
      if (isExpert) {
        // Thông báo 1: Expert tạo quy trình -> gửi cho ADMIN phê duyệt
        await sendNotification({
          targetRole: 'ADMIN',
          title: '📋 Quy trình canh tác mới cần phê duyệt',
          content: `Chuyên gia ${user?.fullName || 'Nông nghiệp'} vừa thiết lập quy trình "${name.trim()}" cho giống ${varietyNameStr}. Vui lòng kiểm tra và phê duyệt.`,
          type: 'PROCESS_TEMPLATE',
          link: `/admin/master-data/process-templates`
        });
        showToast('success', `Đã tạo quy trình và gửi thông báo tới Quản trị viên chờ phê duyệt!`);
      } else {
        showToast('success', `Đã ban hành quy trình canh tác "${name.trim()}" thành công!`);
      }

      setShowModal(false);
      await loadTemplatesFromApi();

      // Tùy chọn chuyển tới trang chi tiết
      if (createdId) {
        navigate(`${detailBasePath}/${createdId}`);
      }
    } catch (err) {
      alert(err.message || 'Không thể lưu quy trình. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin Phê Duyệt Quy Trình (Approve)
  const handleApproveTemplate = async (template) => {
    const tId = template.id || template.templateId;
    if (!window.confirm(`Xác nhận phê duyệt và ban hành quy trình "${template.name}"?`)) return;

    setTemplateStatus(tId, 'ACTIVE');

    // Gửi thông báo lại cho Expert thông báo quy trình đã được duyệt
    await sendNotification({
      targetRole: 'EXPERT',
      userId: template.ptCreatedBy || null,
      title: '✅ Quy trình canh tác đã được phê duyệt',
      content: `Quản trị viên đã phê duyệt và ban hành quy trình "${template.name}". Quy trình chính thức có hiệu lực áp dụng trên các thửa đất.`,
      type: 'PROCESS_TEMPLATE',
      link: `/expert/dashboard?tab=templates`
    });

    showToast('success', `Đã phê duyệt quy trình "${template.name}" thành công! Thông báo đã được gửi tới Chuyên gia.`);
    await loadTemplatesFromApi();
  };

  const handleDelete = async (row) => {
    const templateId = row.id || row.templateId;
    if (!templateId || !window.confirm(`Xóa quy trình “${row.name || 'này'}”? Thao tác này không thể hoàn tác.`)) return;
    setDeletingId(String(templateId));
    try {
      const response = await fetch(`/api/templates/${templateId}`, { method: 'DELETE' });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || 'Không thể xóa quy trình.');
      }
      showToast('success', `Đã xóa quy trình thành công.`);
      setTemplates((current) => current.filter((template) => String(template.id || template.templateId) !== String(templateId)));
    } catch (error) {
      window.alert(error.message || 'Không thể xóa quy trình.');
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    {
      header: 'Tên Quy Trình Chuẩn',
      key: 'name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-mono text-[10px] text-brand-muted uppercase block">#{row.id || row.templateId}</span>
          <Link
            to={`${detailBasePath}/${row.id || row.templateId}`}
            className="font-bold text-brand-dark hover:text-brand-green text-xs block mt-0.5"
          >
            {row.name}
          </Link>
          <span className="text-[11px] text-stone-500">
            Biên soạn: {row.author || row.authorName || (row.ptCreatedBy === user?.userId ? user?.fullName : 'Chuyên gia Nông nghiệp')}
          </span>
        </div>
      )
    },
    {
      header: 'Áp Dụng Cho Giống',
      key: 'varietyName',
      sortable: true,
      render: (row) => (
        <div>
          <span className="text-[10px] font-bold text-brand-green uppercase">{row.cropName || 'Rau củ VietGAP'}</span>
          <p className="font-bold text-brand-dark text-xs">{row.varietyName || 'Giống F1'}</p>
        </div>
      )
    },
    {
      header: 'Lộ Trình Canh Tác',
      key: 'totalSteps',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-black text-brand-dark text-xs">{row.totalSteps || row.steps?.length || 0} bước</span>
          <span className="text-[11px] text-brand-muted">({row.totalDays || 45} ngày)</span>
        </div>
      )
    },
    {
      header: 'Trạng Thái',
      key: 'status',
      render: (row) => {
        const isPending = row.status === 'PENDING_APPROVAL';
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
              isPending
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}
          >
            {isPending ? (
              <>
                <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span>Chờ Admin duyệt</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Đã ban hành</span>
              </>
            )}
          </span>
        );
      }
    },
    {
      header: 'Hành Động',
      key: 'actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {/* Nút Phê Duyệt nếu là Admin và quy trình đang chờ duyệt */}
          {isAdmin && row.status === 'PENDING_APPROVAL' && (
            <button
              type="button"
              onClick={() => handleApproveTemplate(row)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              title="Phê duyệt quy trình này để áp dụng cho khách hàng"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Phê Duyệt</span>
            </button>
          )}

          <Link
            to={`${detailBasePath}/${row.id || row.templateId}`}
            className="p-1.5 text-stone-500 hover:text-brand-green hover:bg-brand-cream/50 rounded-lg transition-colors"
            title="Xem chi tiết lộ trình"
          >
            <Eye className="w-4 h-4" />
          </Link>

          <button
            type="button"
            disabled={String(deletingId) === String(row.id || row.templateId)}
            onClick={() => handleDelete(row)}
            className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:cursor-wait disabled:opacity-50"
            title="Xóa quy trình canh tác"
            aria-label={`Xóa quy trình ${row.name || ''}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toast && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-medium border shadow-xs animate-in fade-in duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="p-1 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-green/10 text-brand-green uppercase tracking-wider">
              Tiêu Chuẩn Kỹ Thuật (VietGAP)
            </span>
            {isLiveDb && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{isFiltered ? `${visibleTemplates.length} kết quả cho giống ${selectedVarietyName}` : `${templates.length} Quy trình`}</span>
              </span>
            )}
          </div>
          <h2 className="text-2xl font-heading font-black text-brand-dark mt-1">
            Quy Trình Canh Tác Chuẩn VietGAP
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Mẫu quy trình kỹ thuật theo từng mốc ngày tuổi (Day Offset) để nhân viên chăm sóc và sinh nhật ký tự động.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => {
            const first = varieties.find((variety) => String(variety.id || variety.varietyId) === String(requestedVarietyId)) || varieties[0];
            if (first) {
              const fId = String(first.id || first.varietyId);
              setVarietyId(fId);
              setName(`Quy trình canh tác chuẩn VietGAP - ${first.name || first.varietyName}`);
            }
            setShowModal(true);
          }}
        >
          {isExpert ? 'Soạn Quy Trình Mới' : 'Tạo Quy Trình Chuẩn Mới'}
        </Button>
      </div>

      {isFiltered && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-border bg-white px-4 py-3 text-sm text-brand-dark">
          <span>Đang xem quy trình của giống <strong>{selectedVarietyName}</strong> ({visibleTemplates.length} kết quả)</span>
          <button type="button" onClick={clearVarietyFilter} className="font-bold text-brand-green hover:underline">
            Xem tất cả quy trình
          </button>
        </div>
      )}

      {requestedVarietyId && requestMode !== 'create' && matchingCount === 0 && !loading && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-border bg-white px-4 py-3 text-sm text-brand-dark">
          <span>Giống <strong>{selectedVarietyName}</strong> chưa có quy trình. Đang hiển thị tất cả {templates.length} quy trình hiện có.</span>
          <button type="button" onClick={clearVarietyFilter} className="font-bold text-brand-green hover:underline">
            Xem tất cả quy trình
          </button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={visibleTemplates}
        searchPlaceholder="Tìm kiếm quy trình, giống cây..."
        searchField="name"
      />

      {/* MODAL THÊM QUY TRÌNH TINH GỌN */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={isExpert ? 'Biên Soạn Quy Trình Canh Tác Mới' : 'Tạo Quy Trình Canh Tác Chuẩn'}
        subtitle={
          isExpert
            ? 'Quy trình sau khi lưu sẽ được gửi tới Quản trị viên (Admin) phê duyệt trước khi ban hành.'
            : 'Thiết lập các mốc ngày tuổi và hướng dẫn kỹ thuật chuẩn VietGAP.'
        }
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleCreate} className="space-y-5">
          {/* Thông tin cốt lõi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Áp Dụng Cho Giống Cây Trồng"
              required
              value={varietyId}
              onChange={(e) => handleVarietyChange(e.target.value)}
              options={varieties.map((v) => ({
                value: String(v.id || v.varietyId),
                label: `${v.name || v.varietyName} (${v.cropName || 'Rau màu'})`
              }))}
            />

            <Input
              label="Tên Quy Trình Canh Tác"
              required
              placeholder="Quy trình canh tác chuẩn VietGAP - ..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-1.5">
              Mô Tả & Ghi Chú Kỹ Thuật (Tùy Chọn)
            </label>
            <textarea
              rows={2}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Ghi chú tổng quát về mùa vụ thích hợp, đặc tính dinh dưỡng hoặc lưu ý chung..."
              className="w-full rounded-xl border border-brand-border bg-white px-3.5 py-2 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            />
          </div>

          {/* TRÌNH THÊM NHANH CÁC BƯỚC KỸ THUẬT (QUICK STEPS EDITOR) */}
          <div className="border border-brand-border rounded-2xl p-4 bg-brand-cream/30 space-y-3">
            <div className="flex items-center justify-between border-b border-brand-border pb-2.5">
              <div className="flex items-center gap-2">
                <Sprout className="w-4 h-4 text-brand-green" />
                <h4 className="font-heading font-black text-xs text-brand-dark uppercase tracking-wider">
                  Lộ Trình Các Bước Kỹ Thuật ({steps.length} bước)
                </h4>
              </div>
              <button
                type="button"
                onClick={handleAddStepRow}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-brand-cream border border-brand-border rounded-lg text-xs font-bold text-brand-green transition-all shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm Bước Công Việc</span>
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-xl border border-brand-border space-y-2.5 shadow-2xs relative"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      {/* Mốc ngày D+ */}
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-brand-dark">Ngày</span>
                        <input
                          type="number"
                          min="0"
                          value={step.dayOffset}
                          onChange={(e) => handleStepFieldChange(idx, 'dayOffset', e.target.value)}
                          className="w-16 px-2 py-1 text-xs font-mono font-bold bg-amber-50 text-amber-900 border border-amber-300 rounded-lg text-center focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      {/* Tên bước */}
                      <input
                        type="text"
                        required
                        placeholder="Tên công việc kỹ thuật..."
                        value={step.stepName}
                        onChange={(e) => handleStepFieldChange(idx, 'stepName', e.target.value)}
                        className="flex-1 px-3 py-1 text-xs font-bold text-brand-dark border border-brand-border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-green"
                      />

                      {/* Loại công việc */}
                      <select
                        value={step.taskType}
                        onChange={(e) => handleStepFieldChange(idx, 'taskType', e.target.value)}
                        className="px-2.5 py-1 text-xs font-semibold text-brand-dark border border-brand-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-brand-green"
                      >
                        <option value="SOIL_PREP">Làm đất & Khử chua</option>
                        <option value="PLANTING">Xuống giống / Cấy cây</option>
                        <option value="IRRIGATION">Tưới nước giữ ẩm</option>
                        <option value="FERTILIZATION">Bón phân hữu cơ</option>
                        <option value="PEST_CONTROL">Phòng trừ sâu bệnh</option>
                        <option value="PRUNING">Bấm ngọn & Tỉa cành</option>
                        <option value="CARE">Chăm sóc định kỳ</option>
                        <option value="HARVEST">Thu hoạch sản phẩm</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveStepRow(idx)}
                      className="p-1 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Xóa bước này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <input
                      type="text"
                      placeholder="Hướng dẫn kỹ thuật chi tiết cho nhân viên..."
                      value={step.description}
                      onChange={(e) => handleStepFieldChange(idx, 'description', e.target.value)}
                      className="px-3 py-1 text-xs text-stone-700 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-green"
                    />

                    <input
                      type="text"
                      placeholder="Vật tư, chế phẩm sinh học cần cấp (nếu có)..."
                      value={step.materialsNeeded}
                      onChange={(e) => handleStepFieldChange(idx, 'materialsNeeded', e.target.value)}
                      className="px-3 py-1 text-xs text-stone-700 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-green"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-brand-border">
            <span className="text-xs text-brand-muted">
              {isExpert ? '⏳ Quy trình sẽ gửi tới Admin để phê duyệt' : '✓ Quy trình sẽ được ban hành ngay'}
            </span>
            <div className="flex items-center gap-2.5">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowModal(false)} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Đang Lưu...'
                  : isExpert
                  ? `Lưu & Gửi Admin Duyệt (${steps.length} Bước)`
                  : `Ban Hành Quy Trình (${steps.length} Bước)`}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
