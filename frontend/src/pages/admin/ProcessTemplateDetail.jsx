import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import {
  ArrowLeft,
  FileSpreadsheet,
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
  Thermometer,
  Droplets,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  FileText,
  Download
} from 'lucide-react';
import { parseProcessDocument } from '../../utils/processDocumentParser';

export default function ProcessTemplateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const bulkFileRef = useRef(null);

  // Template State
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiveDb, setIsLiveDb] = useState(false);

  // Modal Step State
  const [showStepModal, setShowStepModal] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Bulk Upload State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkSteps, setBulkSteps] = useState([]);
  const [bulkFileName, setBulkFileName] = useState('');
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  // Form Fields for Step
  const [stepName, setStepName] = useState('');
  const [dayOffset, setDayOffset] = useState('0');
  const [taskType, setTaskType] = useState('CARE');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [description, setDescription] = useState('');
  const [materialsNeeded, setMaterialsNeeded] = useState('');
  const [minTemp, setMinTemp] = useState('');
  const [maxTemp, setMaxTemp] = useState('');
  const [minHumidity, setMinHumidity] = useState('');
  const [maxHumidity, setMaxHumidity] = useState('');

  // Fetch Template Detail from Backend
  const fetchTemplateDetail = () => {
    fetch(`/api/process-templates/${id}`)
      .then((res) => res.json())
      .then((res) => {
        if (res && res.success && res.data) {
          setTemplate(res.data);
          setIsLiveDb(true);
        }
      })
      .catch((err) => {
        console.warn('Lỗi tải quy trình từ database:', err);
        setTemplate(null);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTemplateDetail();
  }, [id]);

  // Open Modal to Add New Step
  const handleOpenAddModal = () => {
    setEditingStep(null);
    setStepName('');
    // Auto suggest next day offset
    const currentSteps = template?.steps || [];
    const lastDay = currentSteps.length > 0 ? Math.max(...currentSteps.map(s => Number(s.dayOffset || s.day || 0))) : 0;
    setDayOffset(String(lastDay === 0 && currentSteps.length === 0 ? 0 : lastDay + 5));
    setTaskType('CARE');
    setDurationMinutes('60');
    setDescription('');
    setMaterialsNeeded('');
    setMinTemp('');
    setMaxTemp('');
    setMinHumidity('');
    setMaxHumidity('');
    setShowStepModal(true);
  };

  // Open Modal to Edit Step
  const handleOpenEditModal = (step) => {
    setEditingStep(step);
    setStepName(step.stepName || step.taskName || step.name || '');
    setDayOffset(String(step.dayOffset !== undefined ? step.dayOffset : (step.day || 0)));
    setTaskType(step.taskType || step.type || 'CARE');
    setDurationMinutes(String(step.durationMinutes || (step.durationDays || 1) * 60));
    setDescription(step.description || step.details || '');
    setMaterialsNeeded(step.materialsNeeded || step.materialsRequired || '');
    setMinTemp(step.minTemp ? String(step.minTemp) : '');
    setMaxTemp(step.maxTemp ? String(step.maxTemp) : '');
    setMinHumidity(step.minHumidity ? String(step.minHumidity) : '');
    setMaxHumidity(step.maxHumidity ? String(step.maxHumidity) : '');
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
    const durMin = parseInt(durationMinutes, 10) || 60;
    const durDays = Math.max(1, Math.ceil(durMin / 60));

    const payload = {
      stepName: stepName.trim(),
      dayOffset: day,
      taskType,
      durationDays: durDays,
      durationMinutes: durMin,
      description: description.trim(),
      materialsNeeded: materialsNeeded.trim(),
      minTemp: minTemp ? parseFloat(minTemp) : null,
      maxTemp: maxTemp ? parseFloat(maxTemp) : null,
      minHumidity: minHumidity ? parseFloat(minHumidity) : null,
      maxHumidity: maxHumidity ? parseFloat(maxHumidity) : null
    };

    try {
      if (editingStep && (editingStep.stepId || editingStep.id)) {
        // UPDATE STEP
        const sId = editingStep.stepId || editingStep.id;
        const res = await fetch(`/api/process-templates/${template.id}/steps/${sId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
          fetchTemplateDetail();
          setShowStepModal(false);
          return;
        }
      } else {
        // CREATE STEP
        const res = await fetch(`/api/process-templates/${template.id}/steps`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
          fetchTemplateDetail();
          setShowStepModal(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Lưu bước kỹ thuật qua API thất bại:', err);
    } finally {
      setIsSubmitting(false);
    }

    window.alert('Không thể lưu bước kỹ thuật. Vui lòng thử lại.');
  };

  // Delete Step
  const handleDeleteStep = async (step, e) => {
    e.stopPropagation();
    const sName = step.stepName || step.taskName || 'bước kỹ thuật này';
    if (!window.confirm(`Bạn có chắc chắn muốn xóa "${sName}" (Ngày ${step.dayOffset}) khỏi quy trình?`)) {
      return;
    }

    const sId = step.stepId || step.id;
    if (sId) {
      try {
        const res = await fetch(`/api/process-templates/${template.id}/steps/${sId}`, {
          method: 'DELETE'
        });
        const json = await res.json();
        if (json.success) {
          fetchTemplateDetail();
          return;
        }
      } catch (err) {
        console.warn('Xóa bước qua API thất bại:', err);
      }
    }

    window.alert('Không thể xóa bước kỹ thuật. Vui lòng thử lại.');
  };

  // Bulk File Handling
  const handleBulkFileChange = (file) => {
    if (!file) return;
    setBulkFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const parsed = parseProcessDocument(text);
        if (Array.isArray(parsed.steps) && parsed.steps.length > 0) {
          setBulkSteps(parsed.steps);
        } else {
          alert('Không tìm thấy bước kỹ thuật nào trong file tài liệu.');
        }
      } catch (err) {
        alert('Lỗi đọc tài liệu: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSampleBulk = async () => {
    try {
      const res = await fetch('/templates/quy-trinh-chuan-vietgap-dua-leo-baby.txt');
      const text = await res.text();
      const parsed = parseProcessDocument(text);
      if (Array.isArray(parsed.steps) && parsed.steps.length > 0) {
        setBulkSteps(parsed.steps);
        setBulkFileName('quy-trinh-chuan-vietgap-dua-leo-baby.txt');
      }
    } catch (err) {
      alert('Không thể tải file mẫu: ' + err.message);
    }
  };

  const handleSaveBulkSteps = async () => {
    if (!bulkSteps || bulkSteps.length === 0) return;
    setIsBulkSubmitting(true);
    try {
      const res = await fetch(`/api/process-templates/${template.id}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps: bulkSteps })
      });
      const json = await res.json();
      if (json.success) {
        fetchTemplateDetail();
        setShowBulkModal(false);
        setBulkSteps([]);
        setBulkFileName('');
        return;
      }
    } catch (err) {
      console.warn('Nạp hàng loạt bước kỹ thuật thất bại:', err);
    } finally {
      setIsBulkSubmitting(false);
    }
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
      case 'SAFETY_INTERVAL':
        return { label: 'Cách Ly An Toàn', bg: 'bg-orange-100 text-orange-900 border-orange-300' };
      case 'HARVEST':
        return { label: 'Thu Hoạch Sản Phẩm', bg: 'bg-emerald-700 text-white border-emerald-800' };
      default:
        return { label: 'Chăm Sóc Định Kỳ', bg: 'bg-stone-100 text-stone-800 border-stone-300' };
    }
  };

  if (!template) return <p className="p-6 text-stone-600">{loading ? 'Đang tải quy trình...' : 'Không tìm thấy quy trình hoặc không thể tải dữ liệu.'}</p>;

  return (
    <div className="space-y-8">
      {/* Back and Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/master-data/process-templates"
            className="p-2 text-stone-500 hover:text-brand-dark hover:bg-stone-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black bg-brand-dark text-brand-yellow px-2 py-0.5 rounded">
                {template.version || 'v1.0'}
              </span>
              <Badge variant={template.status || 'ACTIVE'} size="sm">{template.status || 'ACTIVE'}</Badge>
              {isLiveDb && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  PostgreSQL SSoT
                </span>
              )}
            </div>
            <h2 className="text-2xl font-heading font-black text-brand-dark mt-1">
              {template.name}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={UploadCloud}
            onClick={() => setShowBulkModal(true)}
          >
            Nạp Từ File (.txt / .json)
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleOpenAddModal}
          >
            Thêm Bước Kỹ Thuật (Day Offset)
          </Button>
        </div>
      </div>

      {/* Template Overview Card */}
      <div className="bg-white rounded-2xl p-6 border border-brand-border shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-border/60 pb-3">
          <div>
            <span className="text-xs font-bold text-brand-green uppercase tracking-wider block">
              Giống cây áp dụng: {template.varietyName} ({template.cropName || 'Rau màu'})
            </span>
            <p className="text-xs text-stone-500 mt-0.5">
              Ban hành bởi: <strong>{template.authorName || template.author || 'Chuyên Gia Nông Nghiệp'}</strong> • Ngày tạo: {template.createdDate || template.createdAt || 'Mới cập nhật'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-dark bg-brand-cream px-3 py-1.5 rounded-xl border border-brand-border">
              Tổng cộng {template.steps?.length || 0} mốc bước kỹ thuật
            </span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              Chu kỳ: {template.totalDays || 45} ngày
            </span>
          </div>
        </div>

        <p className="text-sm text-stone-600 leading-relaxed">
          {template.description || 'Quy trình kỹ thuật nông nghiệp chuẩn VietGAP được ban hành chính thức cho giống cây trồng.'}
        </p>

        {/* BR Notice Banner */}
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 leading-relaxed">
            <strong>Cơ chế tự động sinh việc (Auto-dispatch):</strong> Khi khách hàng kích hoạt hợp đồng thuê thửa với giống này theo hình thức <em>Assisted-growing</em>, hệ thống sẽ tự động quét toàn bộ danh sách các bước dưới đây và sinh <strong>Care Task</strong> giao cho Chuyên viên lao động (CVLĐ) đúng vào ngày thứ <em>Day Offset</em> kể từ ngày bắt đầu vụ.
          </p>
        </div>
      </div>

      {/* Vertical Agricultural Timeline Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-green/10 text-brand-green uppercase tracking-wider">
              Lộ Trình Sinh Trưởng Theo Mốc Thời Gian (Day Offset)
            </span>
            <h3 className="text-2xl font-heading font-black text-brand-dark mt-1">
              Dòng Thời Gian Canh Tác Chuẩn Hóa
            </h3>
            <p className="text-xs text-brand-muted mt-0.5">
              Tất cả các mốc chăm sóc, bón thúc, phòng dịch và thu hoạch được sắp xếp tuần tự theo số ngày tuổi của cây.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={UploadCloud}
              onClick={() => setShowBulkModal(true)}
            >
              Nạp File
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={handleOpenAddModal}
            >
              Thêm Mốc Mới
            </Button>
          </div>
        </div>

        {/* Empty State */}
        {(!template.steps || template.steps.length === 0) && (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-stone-300 space-y-3">
            <Sprout className="w-12 h-12 text-stone-300 mx-auto" />
            <h4 className="font-bold text-stone-700 text-sm">Chưa có bước kỹ thuật nào trong quy trình</h4>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Hãy bấm nút "Thêm Bước Kỹ Thuật" hoặc "Nạp Từ File" bên trên để đưa toàn bộ lộ trình VietGAP vào CSDL PostgreSQL.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="primary" size="sm" icon={UploadCloud} onClick={() => setShowBulkModal(true)}>
                Nạp Lộ Trình Từ File Chuẩn
              </Button>
              <Button variant="outline" size="sm" icon={Plus} onClick={handleOpenAddModal}>
                Thêm Thủ Công Bước Ngày 0
              </Button>
            </div>
          </div>
        )}

        {/* The Vertical Agricultural Timeline Container */}
        {template.steps && template.steps.length > 0 && (
          <div className="relative pl-6 sm:pl-10 space-y-8 before:absolute before:left-3.5 sm:before:left-5 before:top-3 before:bottom-3 before:w-1 before:bg-brand-green/20 before:rounded-full">
            {template.steps.map((step, idx) => {
              const badgeInfo = getTaskTypeBadge(step.taskType || step.type);
              const day = step.dayOffset !== undefined ? step.dayOffset : (step.day !== undefined ? step.day : idx * 5);
              const title = step.stepName || step.taskName || step.name || `Bước kỹ thuật #${idx + 1}`;
              const desc = step.description || step.details || 'Theo dõi và chăm sóc định kỳ theo quy trình chuẩn.';
              const materials = step.materialsNeeded || step.materialsRequired || 'Chuẩn phân bón hữu cơ & vi sinh theo VietGAP';
              const duration = step.durationMinutes || (step.durationDays || 1) * 60;

              return (
                <div key={step.id || step.stepId || idx} className="relative group">
                  {/* Timeline Marker Node */}
                  <div className="absolute -left-6 sm:-left-10 top-1.5 w-8 h-8 rounded-full bg-white border-4 border-brand-green flex items-center justify-center font-heading font-black text-[11px] text-brand-dark shadow-sm group-hover:border-brand-yellow group-hover:scale-110 transition-all">
                    {step.stepNumber || idx + 1}
                  </div>

                  {/* Step Card */}
                  <div className="bg-white rounded-2xl p-6 border border-brand-border shadow-sm hover:shadow-md transition-all space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-border/40 pb-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="px-3 py-1 rounded-xl bg-brand-yellow text-brand-dark font-heading font-black text-xs uppercase tracking-wider shadow-2xs">
                          NGÀY {day} (DAY {day})
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${badgeInfo.bg}`}>
                          {badgeInfo.label}
                        </span>
                        <h4 className="font-heading text-base font-bold text-brand-dark">
                          {title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-semibold text-xs text-stone-700">
                          <Clock className="w-3.5 h-3.5 text-brand-green" />
                          {duration} phút
                        </span>
                        <Badge variant={step.status || 'SCHEDULED'} size="sm">
                          {step.status === 'COMPLETED' ? 'Đã nghiệm thu' : step.status === 'ACTIVE' ? 'Đang thực hiện' : 'Theo lịch trình'}
                        </Badge>

                        {/* Actions: Edit & Delete */}
                        <div className="flex items-center gap-1 border-l border-stone-200 pl-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(step)}
                            className="p-1.5 text-stone-500 hover:text-brand-green hover:bg-stone-100 rounded-lg transition-colors"
                            title="Chỉnh sửa bước này"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteStep(step, e)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa bước này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                      {desc}
                    </p>

                    {/* Technical specifics & Materials */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                      <div className="p-3 rounded-xl bg-brand-cream/50 border border-brand-border/60 flex items-start gap-2.5">
                        <Wrench className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-brand-muted uppercase font-bold block">Phương pháp kỹ thuật:</span>
                          <span className="font-semibold text-brand-dark">
                            {step.method || (badgeInfo.label + ' chuẩn VietGAP')}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-brand-cream/50 border border-brand-border/60 flex items-start gap-2.5">
                        <Package className="w-4 h-4 text-brand-yellow shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-brand-muted uppercase font-bold block">Kỹ thuật & Chế phẩm sinh học:</span>
                          <span className="font-semibold text-brand-dark">{materials}</span>
                        </div>
                      </div>
                    </div>

                    {/* Vi khí hậu khuyến nghị (nếu có) */}
                    {(step.minTemp || step.maxTemp || step.minHumidity || step.maxHumidity) && (
                      <div className="flex items-center gap-4 pt-1 text-[11px] text-stone-500">
                        {(step.minTemp || step.maxTemp) && (
                          <span className="flex items-center gap-1 text-amber-800">
                            <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                            Nhiệt độ tối ưu: {step.minTemp || 20}°C - {step.maxTemp || 35}°C
                          </span>
                        )}
                        {(step.minHumidity || step.maxHumidity) && (
                          <span className="flex items-center gap-1 text-blue-800">
                            <Droplets className="w-3.5 h-3.5 text-blue-600" />
                            Độ ẩm không khí: {step.minHumidity || 60}% - {step.maxHumidity || 85}%
                          </span>
                        )}
                      </div>
                    )}

                    <div className="pt-1 flex items-center justify-between text-[11px] text-brand-muted border-t border-stone-100">
                      <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Nghiệm thu bắt buộc: Tải tối thiểu 1 ảnh minh chứng thực địa
                      </span>
                      <span className="text-stone-400">Tự động đồng bộ Farm Diary sau khi duyệt</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL THÊM / CHỈNH SỬA 1 BƯỚC KỸ THUẬT */}
      <Modal
        isOpen={showStepModal}
        onClose={() => setShowStepModal(false)}
        title={editingStep ? `Chỉnh Sửa Bước Kỹ Thuật (Ngày ${editingStep.dayOffset})` : 'Thêm Bước Kỹ Thuật Mới (Day Offset)'}
        subtitle="Thiết lập công việc và kỹ thuật chăm sóc tự động giao cho CVLĐ"
      >
        <form onSubmit={handleSaveStep} className="space-y-4">
          <Input
            label="Tên Bước Kỹ Thuật / Công Việc"
            required
            placeholder="Ví dụ: Bón thúc đợt 1 & Kiểm tra sinh trưởng rễ non"
            value={stepName}
            onChange={(e) => setStepName(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                Số ngày kể từ bắt đầu vụ (0: gieo/trồng)
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
                { value: 'SAFETY_INTERVAL', label: 'Cách ly an toàn' },
                { value: 'HARVEST', label: 'Thu hoạch & Đóng thùng' }
              ]}
            />

            <Input
              label="Thời Lượng Dự Kiến (Phút)"
              type="number"
              min="15"
              step="15"
              required
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="60"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-1.5">
              Hướng Dẫn Thao Tác Kỹ Thuật (VietGAP) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả các thao tác kỹ thuật, độ sâu xới đất, vị trí bón phân, lưu ý an toàn..."
              className="w-full rounded-xl border border-brand-border bg-white px-3.5 py-2 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            />
          </div>

          <Input
            label="Kỹ Thuật & Chế Phẩm Sinh Học / Vật Tư"
            placeholder="Ví dụ: Đạm cá hữu cơ 1:200, nấm đối kháng Trichoderma, vôi bột..."
            value={materialsNeeded}
            onChange={(e) => setMaterialsNeeded(e.target.value)}
          />

          {/* Vi khí hậu ngưỡng tham chiếu */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <Input
              label="Nhiệt Độ Min (°C)"
              type="number"
              placeholder="20"
              value={minTemp}
              onChange={(e) => setMinTemp(e.target.value)}
            />
            <Input
              label="Nhiệt Độ Max (°C)"
              type="number"
              placeholder="35"
              value={maxTemp}
              onChange={(e) => setMaxTemp(e.target.value)}
            />
            <Input
              label="Độ Ẩm Min (%)"
              type="number"
              placeholder="60"
              value={minHumidity}
              onChange={(e) => setMinHumidity(e.target.value)}
            />
            <Input
              label="Độ Ẩm Max (%)"
              type="number"
              placeholder="85"
              value={maxHumidity}
              onChange={(e) => setMaxHumidity(e.target.value)}
            />
          </div>

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

      {/* MODAL NẠP HÀNG LOẠT BƯỚC TỪ FILE TÀI LIỆU CHUẨN */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Nạp Lộ Trình Kỹ Thuật Từ File Tài Liệu Chuẩn"
        subtitle="Hỗ trợ đọc tự động danh sách các bước Day Offset từ file .txt hoặc .json"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {/* Dropzone */}
          <div
            onClick={() => bulkFileRef.current?.click()}
            className="p-6 border-2 border-dashed border-stone-300 rounded-2xl bg-stone-50/50 hover:bg-stone-50 hover:border-brand-green cursor-pointer text-center transition-all"
          >
            <input
              ref={bulkFileRef}
              type="file"
              accept=".txt,.json,.md"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleBulkFileChange(e.target.files[0]);
                }
              }}
            />
            <div className="w-12 h-12 rounded-2xl bg-white border border-brand-border flex items-center justify-center mx-auto text-brand-green shadow-xs mb-2">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h4 className="font-heading font-bold text-sm text-brand-dark">
              {bulkFileName ? `Đã chọn file: ${bulkFileName}` : 'Kéo thả hoặc bấm để chọn file tài liệu (.txt / .json)'}
            </h4>
            <p className="text-xs text-stone-500 mt-0.5">
              Hệ thống tự động trích xuất các mốc Ngày 0, Ngày 2, Ngày 7... và hướng dẫn kỹ thuật
            </p>
          </div>

          {/* Quick preset buttons */}
          <div className="p-3 bg-brand-cream/60 rounded-xl border border-brand-border flex items-center justify-between gap-3 text-xs">
            <span className="text-stone-700">Tài liệu kỹ thuật ban hành:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadSampleBulk}
                className="px-3 py-1.5 bg-brand-green text-white rounded-lg font-bold hover:bg-emerald-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nạp Tài Liệu Chuẩn VietGAP (Dưa Leo Baby F1)</span>
              </button>
            </div>
          </div>

          {/* Preview Parsed Steps */}
          {bulkSteps.length > 0 && (
            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <span className="font-bold text-xs text-emerald-900 uppercase">
                  Danh sách {bulkSteps.length} bước kỹ thuật nhận diện:
                </span>
                <span className="text-[11px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                  Chu kỳ {Math.max(...bulkSteps.map(s => s.dayOffset)) + 7} ngày
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {bulkSteps.map((s, idx) => (
                  <div key={idx} className="p-2 bg-white rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-brand-yellow font-black text-[10px] text-brand-dark">
                        D+{s.dayOffset}
                      </span>
                      <span className="font-bold text-brand-dark">{s.stepName}</span>
                    </div>
                    <span className="text-[10px] text-stone-500">{s.taskType} • {s.durationMinutes}p</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-brand-border">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setShowBulkModal(false)}
              disabled={isBulkSubmitting}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={handleSaveBulkSteps}
              disabled={isBulkSubmitting || bulkSteps.length === 0}
            >
              {isBulkSubmitting ? 'Đang Lưu...' : `Lưu ${bulkSteps.length} Bước Vào CSDL PostgreSQL`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
