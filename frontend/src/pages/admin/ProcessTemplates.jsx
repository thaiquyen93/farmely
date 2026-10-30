import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { processTemplatesData as initialTemplates } from '../../data/processTemplates';
import { varietiesData as initialVarieties } from '../../data/varieties';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import {
  FileSpreadsheet,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  UploadCloud,
  FileText,
  Download,
  Check,
  AlertCircle,
  ArrowRight,
  Layers
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { parseProcessDocument } from '../../utils/processDocumentParser';

export default function ProcessTemplates() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { user } = useAuthStore();
  const [templates, setTemplates] = useState(initialTemplates);
  const [varieties, setVarieties] = useState(initialVarieties);
  const [loading, setLoading] = useState(true);
  const [isLiveDb, setIsLiveDb] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State
  const [uploadFileName, setUploadFileName] = useState('');
  const [parsedSteps, setParsedSteps] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [varietyId, setVarietyId] = useState('1');
  const [version, setVersion] = useState('v1.0');
  const [status, setStatus] = useState('ACTIVE');
  const [desc, setDesc] = useState('');

  const loadTemplatesFromApi = () => {
    fetch('/api/process-templates')
      .then((res) => res.json())
      .then((res) => {
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setTemplates(res.data);
          setIsLiveDb(true);
        }
      })
      .catch((err) => {
        console.warn('Cannot fetch live process templates, fallback to mock:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadTemplatesFromApi();

    // Fetch live varieties
    fetch('/api/varieties')
      .then((res) => res.json())
      .then((res) => {
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setVarieties(res.data);
          if (res.data[0]?.id || res.data[0]?.varietyId) {
            setVarietyId(String(res.data[0].id || res.data[0].varietyId));
          }
        }
      })
      .catch(() => {});
  }, []);

  // Process Document File Upload
  const handleFileChange = (file) => {
    if (!file) return;
    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const parsed = parseProcessDocument(text, varieties);
        setName(parsed.name);
        if (parsed.varietyId) setVarietyId(String(parsed.varietyId));
        setVersion(parsed.version);
        setStatus(parsed.status);
        setDesc(parsed.description);
        setParsedSteps(parsed.steps || []);
      } catch (err) {
        alert('Lỗi đọc tài liệu: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Quick Load Sample Document
  const handleLoadSampleDocument = async () => {
    try {
      const res = await fetch('/templates/quy-trinh-chuan-vietgap-dua-leo-baby.txt');
      const text = await res.text();
      const parsed = parseProcessDocument(text, varieties);
      setName(parsed.name);
      if (parsed.varietyId) setVarietyId(String(parsed.varietyId));
      setVersion(parsed.version);
      setStatus(parsed.status);
      setDesc(parsed.description);
      setParsedSteps(parsed.steps || []);
      setUploadFileName('quy-trinh-chuan-vietgap-dua-leo-baby.txt');
    } catch (err) {
      alert('Không thể nạp file mẫu: ' + err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const numericVarietyId = parseInt(String(varietyId).replace(/\D/g, ''), 10) || 1;
    const varObj = varieties.find((v) => String(v.id || v.varietyId) === String(varietyId));

    try {
      const payload = {
        varietyId: numericVarietyId,
        version: version.trim() || 'v1.0',
        name: name.trim(),
        description: desc.trim(),
        ptCreatedBy: user?.userId || 5,
        steps: parsedSteps && parsedSteps.length > 0 ? parsedSteps : []
      };

      const res = await fetch('/api/process-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success && json.data?.id) {
        setShowModal(false);
        // Chuyển thẳng tới trang chi tiết quy trình vừa tạo
        navigate(`/admin/master-data/process-templates/${json.data.id}`);
        return;
      }
    } catch (err) {
      console.warn('Tạo quy trình qua API lỗi, fallback lưu tạm:', err);
    } finally {
      setIsSubmitting(false);
    }

    const newTemplate = {
      id: `TMPL-00${templates.length + 1}`,
      name: name || `Quy trình VietGAP - ${varObj?.name || 'Cây trồng'}`,
      varietyId,
      varietyName: varObj ? (varObj.name || varObj.varietyName) : 'Giống cây',
      cropName: varObj ? (varObj.cropName || 'Rau màu') : 'Rau màu',
      version,
      status,
      totalSteps: parsedSteps.length,
      createdDate: new Date().toISOString().split('T')[0],
      author: user?.fullName || 'Chuyên Gia Nông Nghiệp',
      description: desc,
      steps: parsedSteps
    };

    setTemplates((prev) => [...prev, newTemplate]);
    setShowModal(false);
  };

  const columns = [
    {
      header: 'Tên Quy Trình Chuẩn',
      key: 'name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-mono text-[10px] text-brand-muted uppercase block">{row.id || row.code}</span>
          <Link
            to={`/admin/master-data/process-templates/${row.id}`}
            className="font-bold text-brand-dark hover:text-brand-green text-xs block mt-0.5"
          >
            {row.name}
          </Link>
          <span className="text-[11px] text-stone-500">Người thiết lập: {row.author || row.authorName || 'Chuyên gia Nông nghiệp'}</span>
        </div>
      )
    },
    {
      header: 'Áp Dụng Cho Giống',
      key: 'varietyName',
      sortable: true,
      render: (row) => (
        <div>
          <span className="text-[10px] font-bold text-brand-green uppercase">{row.cropName || 'Rau củ'}</span>
          <p className="font-bold text-brand-dark text-xs">{row.varietyName}</p>
        </div>
      )
    },
    {
      header: 'Phiên Bản',
      key: 'version',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-brand-green bg-brand-cream px-2 py-0.5 rounded border border-brand-border">
          {row.version}
        </span>
      )
    },
    {
      header: 'Lộ Trình Sinh Trưởng',
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
      render: (row) => <Badge variant={row.status || 'ACTIVE'} size="sm">{row.status || 'ACTIVE'}</Badge>
    },
    {
      header: 'Hành Động',
      key: 'actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Link
            to={`/admin/master-data/process-templates/${row.id}`}
            className="p-1.5 text-stone-400 hover:text-brand-green hover:bg-brand-cream/50 rounded-lg transition-colors"
            title="Xem chi tiết lộ trình"
          >
            <Eye className="w-4 h-4" />
          </Link>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
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
                <span>Live DB: {templates.length} Quy trình</span>
              </span>
            )}
          </div>
          <h2 className="text-2xl font-heading font-black text-brand-dark mt-1">
            Quy Trình Canh Tác Chuẩn VietGAP
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Các mẫu quy trình kỹ thuật theo từng mốc ngày tuổi (Day Offset), hướng dẫn chăm sóc và tự động sinh Care Task cho gói Assisted-growing.
          </p>
        </div>

        <Button variant="primary" size="md" icon={Plus} onClick={() => {
          setShowModal(true);
        }}>
          Tạo Quy Trình Chuẩn Mới
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={templates}
        searchPlaceholder="Tìm kiếm quy trình, giống cây..."
        searchField="name"
      />

      {/* MODAL CREATE TEMPLATE WITH SMART UPLOAD */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Tạo Mẫu Quy Trình Canh Tác Mới"
        subtitle="Nạp và phân tích tự động từ tài liệu kỹ thuật chuẩn VietGAP (.txt / .json)"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-5">
          <div className="space-y-4">
            {/* Dropzone Container */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileChange(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-brand-green bg-emerald-50/70 scale-[1.01]'
                  : uploadFileName
                  ? 'border-emerald-400 bg-emerald-50/40'
                  : 'border-stone-300 bg-stone-50/50 hover:bg-stone-50 hover:border-brand-green/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.json,.md"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              <div className="max-w-md mx-auto space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-white border border-brand-border flex items-center justify-center mx-auto text-brand-green shadow-xs">
                  {uploadFileName ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : <UploadCloud className="w-6 h-6 text-brand-green" />}
                </div>

                <div>
                  <h4 className="font-heading font-bold text-sm text-brand-dark">
                    {uploadFileName ? (
                      <span className="text-emerald-700 flex items-center justify-center gap-1.5">
                        <span>Đã nạp file:</span> <strong>{uploadFileName}</strong>
                      </span>
                    ) : (
                      'Kéo thả file tài liệu quy trình chuẩn vào đây'
                    )}
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Định dạng hỗ trợ: <strong className="text-stone-700">.txt</strong> (Văn bản VietGAP có cấu trúc) hoặc <strong className="text-stone-700">.json</strong>
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                  <span className="px-3 py-1 bg-white border border-stone-200 text-stone-700 rounded-xl text-xs font-semibold hover:border-brand-green">
                    Duyệt file từ máy tính
                  </span>
                </div>
              </div>
            </div>

            {/* Technical Document Quick Preset */}
            <div className="p-3 bg-brand-cream/60 rounded-xl border border-brand-border flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-green shrink-0" />
                <span className="text-stone-700 font-medium">Tài liệu kỹ thuật chuẩn:</span>
                <strong className="text-brand-dark font-mono text-[11px]">Dưa leo baby F1 (8 bước)</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSampleDocument}
                  className="px-3 py-1.5 bg-brand-green text-white rounded-lg font-bold hover:bg-emerald-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Nạp Tài Liệu Chuẩn VietGAP</span>
                </button>

                <a
                  href="/templates/quy-trinh-chuan-vietgap-dua-leo-baby.txt"
                  download="quy-trinh-chuan-vietgap-dua-leo-baby.txt"
                  className="px-3 py-1.5 bg-white border border-brand-border text-brand-dark rounded-lg font-semibold hover:bg-stone-50 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-stone-500" />
                  <span>Tải File Mẫu (.txt)</span>
                </a>
              </div>
            </div>

            {/* Parsed Results Preview Card */}
            {parsedSteps.length > 0 && (
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-heading font-black text-xs text-emerald-900 uppercase tracking-wider">
                      Đã Phân Tích Thành Công: {parsedSteps.length} Bước Kỹ Thuật (Day Offset)
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Chu kỳ: {Math.max(...parsedSteps.map(s => s.dayOffset)) + 7} ngày
                  </span>
                </div>

                {/* Quick Timeline Preview Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {parsedSteps.map((s, idx) => (
                    <div key={idx} className="p-2 bg-white rounded-xl border border-emerald-100 flex items-start gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded bg-brand-yellow font-black text-[10px] text-brand-dark shrink-0">
                        D+{s.dayOffset}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-brand-dark truncate">{s.stepName}</p>
                        <span className="text-[10px] text-stone-500 block truncate">
                          {s.taskType} • {s.durationMinutes}p • {s.materialsNeeded || 'Vật tư hữu cơ'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form fields (Always editable and in sync) */}
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <Input
              label="Tên Quy Trình Canh Tác"
              required
              placeholder="Ví dụ: Quy Trình VietGAP Dưa Leo Baby F1 Chuẩn Hóa"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Áp Dụng Cho Giống Cây"
                required
                value={varietyId}
                onChange={(e) => setVarietyId(e.target.value)}
                options={varieties.map((v) => ({
                  value: String(v.id || v.varietyId),
                  label: `${v.name || v.varietyName} (${v.cropName || 'Rau màu'})`
                }))}
              />

              <Input
                label="Mã Phiên Bản (Version)"
                required
                placeholder="v2.5 (Chuẩn VietGAP)"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
              />
            </div>

            <Select
              label="Trạng Thái Quy Trình"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'ACTIVE', label: 'ACTIVE (Đang ban hành áp dụng)' },
                { value: 'DRAFT', label: 'DRAFT (Bản thảo khảo nghiệm)' },
                { value: 'ARCHIVED', label: 'ARCHIVED (Đã lưu trữ / Hết hiệu lực)' }
              ]}
            />

            <div>
              <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-1.5">
                Mô Tả Quy Trình
              </label>
              <textarea
                rows={3}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Mô tả tóm tắt mục tiêu, điều kiện thời tiết thích hợp và chu kỳ thu hoạch..."
                className="w-full rounded-xl border border-brand-border bg-white px-3.5 py-2 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-brand-border">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowModal(false)} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Đang Lưu Vào PostgreSQL...'
                  : parsedSteps.length > 0
                  ? `Khởi Tạo & Lưu Vào PostgreSQL (${parsedSteps.length} Bước)`
                  : 'Khởi Tạo Template & Nhập Lộ Trình'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
