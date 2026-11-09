import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import {
  ArrowLeft,
  Clock,
  Sprout,
  CheckCircle2,
  Calendar,
  Layers,
  Wrench,
  Package,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { sendNotification } from '../../services/notificationService';

export default function ProcessTemplateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  // Template State
  const [template, setTemplate] = useState({ id, steps: [] });
  const [loading, setLoading] = useState(true);
  const [isLiveDb, setIsLiveDb] = useState(false);
  const [toast, setToast] = useState(null);

  // Modal Step State
  const [showStepModal, setShowStepModal] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields for Step (Streamlined: Day, Name, Type, Description, Materials)
  const [stepName, setStepName] = useState('');
  const [dayOffset, setDayOffset] = useState('0');
  const [taskType, setTaskType] = useState('CARE');
  const [description, setDescription] = useState('');
  const [materialsNeeded, setMaterialsNeeded] = useState('');

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

  // Fetch Template Detail from Backend
  const fetchTemplateDetail = async () => {
    setLoading(true);
    let data = null;
    try {
      const res = await fetch(`/api/templates/${id}`);
      const json = await res.json();
      if (json && json.success && json.data) {
        data = json.data;
        setIsLiveDb(true);
      }
    } catch (e) {
      console.warn('Lỗi tải từ /api/templates:', e);
    }

    if (!data) {
      try {
        const res2 = await fetch(`/api/process-templates/${id}`);
        const json2 = await res2.json();
        if (json2 && json2.success && json2.data) {
          data = json2.data;
          setIsLiveDb(true);
        }
      } catch (_) {}
    }

    if (data) {
      const effectiveStatus = getTemplateStatus(data.templateId || data.id || id, data.status || 'ACTIVE');
      setTemplate({
        ...data,
        status: effectiveStatus
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplateDetail();
  }, [id]);

  // Admin Approve Process Template
  const handleApprove = async () => {
    const tId = template.id || template.templateId || id;
    if (!window.confirm(`Xác nhận phê duyệt và ban hành quy trình "${template.name}"?`)) return;

    setTemplateStatus(tId, 'ACTIVE');
    setTemplate((prev) => ({ ...prev, status: 'ACTIVE' }));

    // Send notification to Expert
    await sendNotification({
      targetRole: 'EXPERT',
      userId: template.ptCreatedBy || null,
      title: '✅ Quy trình canh tác đã được phê duyệt',
      content: `Quản trị viên đã phê duyệt và ban hành quy trình "${template.name}". Quy trình chính thức có hiệu lực áp dụng trên các thửa đất.`,
      type: 'PROCESS_TEMPLATE',
      link: `/expert/dashboard?tab=templates`
    });

    showToast('success', 'Đã phê duyệt và ban hành quy trình thành công!');
  };

  // Open Modal to Add New Step
  const handleOpenAddModal = () => {
    setEditingStep(null);
    setStepName('');
    const currentSteps = template.steps || [];
    const lastDay = currentSteps.length > 0 ? Math.max(...currentSteps.map((s) => Number(s.dayOffset || s.day || 0))) : 0;
    setDayOffset(String(lastDay === 0 && currentSteps.length === 0 ? 0 : lastDay + 5));
    setTaskType('CARE');
    setDescription('');
    setMaterialsNeeded('');
    setShowStepModal(true);
  };

  // Open Modal to Edit Step
  const handleOpenEditModal = (step) => {
    setEditingStep(step);
    setStepName(step.stepName || step.taskName || step.name || '');
    setDayOffset(String(step.dayOffset !== undefined ? step.dayOffset : (step.day || 0)));
    setTaskType(step.taskType || step.type || 'CARE');
    setDescription(step.description || step.details || '');
    setMaterialsNeeded(step.materialsNeeded || step.materialsRequired || '');
    setShowStepModal(true);
  };

  // Save Step (Create or Update)
  const handleSaveStep = async (e) => {
    e.preventDefault();
    if (!stepName.trim()) {
      alert('Vui lòng nhập tên bước kỹ thuật');
      return;
    }

    setIsSubmitting(true);
    const day = parseInt(dayOffset, 10) || 0;

    const payload = {
      stepName: stepName.trim(),
      dayOffset: day,
      taskType,
      durationDays: 1,
      durationMinutes: 60,
      description: description.trim(),
      materialsNeeded: materialsNeeded.trim()
    };

    try {
      const tId = template.id || template.templateId || id;
      if (editingStep && (editingStep.stepId || editingStep.id)) {
        // UPDATE STEP
        const sId = editingStep.stepId || editingStep.id;
        const res = await fetch(`/api/templates/${tId}/steps/${sId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json().catch(() => null);
        if (json?.success) {
          fetchTemplateDetail();
          setShowStepModal(false);
          showToast('success', 'Đã cập nhật bước kỹ thuật thành công!');
          return;
        }
      } else {
        // CREATE STEP
        const res = await fetch(`/api/templates/${tId}/steps`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json().catch(() => null);
        if (json?.success) {
          fetchTemplateDetail();
          setShowStepModal(false);
          showToast('success', 'Đã thêm bước kỹ thuật mới vào quy trình!');
          return;
        }
      }

      // Optimistic local update fallback
      const newStep = {
        id: editingStep?.id || Date.now(),
        stepId: editingStep?.stepId || Date.now(),
        ...payload
      };
      setTemplate((prev) => {
        const existing = prev.steps || [];
        const nextSteps = editingStep
          ? existing.map((s) => (s.id === editingStep.id || s.stepId === editingStep.stepId ? newStep : s))
          : [...existing, newStep];
        nextSteps.sort((a, b) => (a.dayOffset || 0) - (b.dayOffset || 0));
        return { ...prev, steps: nextSteps };
      });
      setShowStepModal(false);
      showToast('success', 'Đã lưu bước kỹ thuật thành công!');
    } catch (err) {
      alert(err.message || 'Không thể lưu bước kỹ thuật.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Step
  const handleDeleteStep = async (step, e) => {
    e.stopPropagation();
    const sName = step.stepName || step.taskName || 'bước kỹ thuật này';
    if (!window.confirm(`Bạn có chắc chắn muốn xóa "${sName}" (Ngày ${step.dayOffset}) khỏi quy trình?`)) {
      return;
    }

    const tId = template.id || template.templateId || id;
    const sId = step.stepId || step.id;
    if (sId) {
      try {
        await fetch(`/api/templates/${tId}/steps/${sId}`, {
          method: 'DELETE'
        });
      } catch (_) {}
    }

    setTemplate((prev) => ({
      ...prev,
      steps: (prev.steps || []).filter((s) => (s.stepId || s.id) !== sId)
    }));
    showToast('success', 'Đã xóa bước kỹ thuật khỏi quy trình.');
  };

  const getTaskTypeBadge = (type) => {
    switch (type) {
      case 'SOIL_PREP':
        return { label: 'Làm Đất & Khử Chua', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'PLANTING':
        return { label: 'Xuống Giống & Cấy Cây', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'IRRIGATION':
        return { label: 'Tưới Nước Giữ Ẩm', bg: 'bg-blue-100 text-blue-900 border-blue-300' };
      case 'FERTILIZATION':
        return { label: 'Bón Dinh Dưỡng Hữu Cơ', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'PEST_CONTROL':
        return { label: 'Phòng Trừ Sâu Bệnh', bg: 'bg-rose-100 text-rose-900 border-rose-300' };
      case 'PRUNING':
        return { label: 'Bấm Ngọn & Làm Giàn', bg: 'bg-purple-100 text-purple-900 border-purple-300' };
      case 'HARVEST':
        return { label: 'Thu Hoạch Sản Phẩm', bg: 'bg-emerald-700 text-white border-emerald-800' };
      default:
        return { label: 'Chăm Sóc Định Kỳ', bg: 'bg-stone-100 text-stone-800 border-stone-300' };
    }
  };

  const isPending = template.status === 'PENDING_APPROVAL';

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

      {/* Back and Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to={location.pathname.startsWith('/expert/') ? '/expert/dashboard?tab=templates' : '/admin/master-data/process-templates'}
            className="p-2 text-stone-500 hover:text-brand-dark hover:bg-stone-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black bg-brand-dark text-brand-yellow px-2 py-0.5 rounded">
                {template.version || 'v1.0'}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isPending
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                {isPending ? '⏳ Chờ Admin duyệt' : '✓ Đã ban hành'}
              </span>
            </div>
            <h2 className="text-2xl font-heading font-black text-brand-dark mt-1">
              {template.name}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {isAdmin && isPending && (
            <Button
              variant="primary"
              size="sm"
              icon={Check}
              onClick={handleApprove}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Phê Duyệt Ban Hành
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleOpenAddModal}
          >
            + Thêm Bước Kỹ Thuật
          </Button>
        </div>
      </div>

      {/* Banner Chờ Duyệt cho Admin */}
      {isAdmin && isPending && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-900">
                Quy trình đang chờ phê duyệt từ Quản trị viên
              </p>
              <p className="text-xs text-amber-700">
                Quy trình do Chuyên gia thiết lập. Vui lòng kiểm tra lộ trình các bước kỹ thuật bên dưới và phê duyệt để ban hành chính thức.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleApprove}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all whitespace-nowrap"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Phê Duyệt Ngay</span>
          </button>
        </div>
      )}

      {/* Template Overview Card */}
      <div className="bg-white rounded-2xl p-6 border border-brand-border shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-border/60 pb-3">
          <div>
            <span className="text-xs font-bold text-brand-green uppercase tracking-wider block">
              Giống cây áp dụng: {template.varietyName || 'Giống F1'} ({template.cropName || 'VietGAP'})
            </span>
            <p className="text-xs text-stone-500 mt-0.5">
              Tác giả: <strong>{template.authorName || template.author || 'Chuyên Gia Nông Nghiệp'}</strong>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-dark bg-brand-cream px-3 py-1.5 rounded-xl border border-brand-border">
              {template.steps?.length || 0} mốc bước kỹ thuật
            </span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              Chu kỳ: {template.steps && template.steps.length > 0 ? Math.max(...template.steps.map((s) => s.dayOffset || 0)) + 5 : 45} ngày
            </span>
          </div>
        </div>

        <p className="text-sm text-stone-600 leading-relaxed">
          {template.description || 'Quy trình kỹ thuật nông nghiệp chuẩn VietGAP được ban hành chính thức cho giống cây trồng.'}
        </p>
      </div>

      {/* Lộ Trình Canh Tác Theo Mốc Ngày Tuổi (Timeline) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-heading font-black text-brand-dark">
              Lộ Trình Các Bước Canh Tác Chuẩn VietGAP
            </h3>
            <p className="text-xs text-brand-muted">
              Mỗi bước kỹ thuật sẽ tự động sinh Care Task cho nhân viên vào ngày thứ Day Offset.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={Plus}
            onClick={handleOpenAddModal}
          >
            Thêm Bước Mới
          </Button>
        </div>

        {/* Empty State */}
        {(!template.steps || template.steps.length === 0) && (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-stone-300 space-y-3">
            <Sprout className="w-12 h-12 text-stone-300 mx-auto" />
            <h4 className="font-bold text-stone-700 text-sm">Chưa có bước kỹ thuật nào trong quy trình</h4>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Hãy bấm nút "+ Thêm Bước Kỹ Thuật" bên trên để thêm các mốc công việc canh tác.
            </p>
          </div>
        )}

        {/* Steps Timeline Cards */}
        {template.steps && template.steps.length > 0 && (
          <div className="space-y-3">
            {template.steps.map((step, index) => {
              const badgeInfo = getTaskTypeBadge(step.taskType);
              const materials = step.materialsNeeded || 'Vật tư hữu cơ chuẩn VietGAP';

              return (
                <div
                  key={step.stepId || step.id || index}
                  className="bg-white rounded-2xl p-5 border border-brand-border shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 flex-1">
                    {/* Day Offset Badge */}
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] uppercase font-bold text-amber-700">Mốc Ngày</span>
                      <span className="text-lg font-heading font-black text-amber-900 leading-tight">
                        D+{step.dayOffset}
                      </span>
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeInfo.bg}`}>
                          {badgeInfo.label}
                        </span>
                        <h4 className="font-bold text-brand-dark text-sm">
                          {step.stepName || step.taskName}
                        </h4>
                      </div>

                      <p className="text-xs text-stone-600 leading-relaxed">
                        {step.description || 'Thực hiện chăm sóc và theo dõi sinh trưởng theo tiêu chuẩn VietGAP.'}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-brand-muted">
                        <Package className="w-3.5 h-3.5 text-brand-yellow shrink-0" />
                        <span className="text-[11px] text-stone-600">
                          <strong>Vật tư:</strong> {materials}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center border-t md:border-t-0 pt-2 md:pt-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(step)}
                      className="p-2 text-stone-500 hover:text-brand-green hover:bg-stone-100 rounded-xl transition-colors"
                      title="Chỉnh sửa bước"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteStep(step, e)}
                      className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Xóa bước này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL THÊM / CHỈNH SỬA BƯỚC KỸ THUẬT TINH GỌN */}
      <Modal
        isOpen={showStepModal}
        onClose={() => setShowStepModal(false)}
        title={editingStep ? `Chỉnh Sửa Bước Kỹ Thuật (Ngày ${editingStep.dayOffset})` : 'Thêm Bước Kỹ Thuật Mới'}
        subtitle="Thiết lập công việc và hướng dẫn thao tác tự động sinh cho nhân viên chăm sóc."
      >
        <form onSubmit={handleSaveStep} className="space-y-4">
          <Input
            label="Tên Bước Kỹ Thuật / Công Việc"
            required
            placeholder="Ví dụ: Bón thúc đợt 1 & Tưới đạm cá hữu cơ"
            value={stepName}
            onChange={(e) => setStepName(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Input
                label="Mốc Ngày Tuổi (Day Offset)"
                type="number"
                min="0"
                required
                value={dayOffset}
                onChange={(e) => setDayOffset(e.target.value)}
                placeholder="0"
              />
              <span className="text-[10px] text-stone-500 block mt-1">
                Số ngày kể từ bắt đầu vụ (0: gieo hạt / làm đất)
              </span>
            </div>

            <Select
              label="Loại Hình Công Việc"
              required
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              options={[
                { value: 'SOIL_PREP', label: 'Làm đất & Khử chua luống' },
                { value: 'PLANTING', label: 'Xuống giống & Cấy cây con' },
                { value: 'IRRIGATION', label: 'Tưới nước giữ ẩm' },
                { value: 'FERTILIZATION', label: 'Bón phân hữu cơ vi sinh' },
                { value: 'PEST_CONTROL', label: 'Phòng trừ sâu bệnh sinh học' },
                { value: 'PRUNING', label: 'Bấm ngọn & Làm giàn leo' },
                { value: 'CARE', label: 'Chăm sóc & Theo dõi sinh trưởng' },
                { value: 'HARVEST', label: 'Thu hoạch & Đóng thùng' }
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-1.5">
              Hướng Dẫn Kỹ Thuật Thao Tác (VietGAP) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả cụ thể thao tác: độ sâu xới đất, tỉ lệ pha loãng phân, kiểm tra sâu bệnh..."
              className="w-full rounded-xl border border-brand-border bg-white px-3.5 py-2 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            />
          </div>

          <Input
            label="Vật Tư & Chế Phẩm Sinh Học / Dụng Cụ"
            placeholder="Ví dụ: Đạm cá vi sinh 1:200, vôi bột, kéo tỉa cành..."
            value={materialsNeeded}
            onChange={(e) => setMaterialsNeeded(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-brand-border">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setShowStepModal(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang Lưu...' : editingStep ? 'Cập Nhật Bước' : 'Lưu Vào Quy Trình'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
