import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { processTemplatesData as initialTemplates } from '../../data/processTemplates';
import { varietiesData as initialVarieties } from '../../data/varieties';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { FileSpreadsheet, Plus, Eye, Edit, Trash2, Calendar, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export default function ProcessTemplates() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [templates, setTemplates] = useState(initialTemplates);
  const [varieties, setVarieties] = useState(initialVarieties);
  const [loading, setLoading] = useState(true);
  const [isLiveDb, setIsLiveDb] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const numericVarietyId = parseInt(String(varietyId).replace(/\D/g, ''), 10) || 1;
    const varObj = varieties.find((v) => String(v.id || v.varietyId) === String(varietyId));

    try {
      const res = await fetch('/api/process-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          varietyId: numericVarietyId,
          version: version.trim() || 'v1.0',
          name: name.trim(),
          description: desc.trim(),
          ptCreatedBy: user?.userId || 5
        })
      });
      const json = await res.json();
      if (json.success && json.data?.id) {
        setShowModal(false);
        // Chuyển thẳng tới trang chi tiết quy trình vừa tạo để chuyên gia thêm các bước Day Offset
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
      totalSteps: 0,
      createdDate: new Date().toISOString().split('T')[0],
      author: user?.fullName || 'Chuyên Gia Nông Nghiệp',
      description: desc,
      steps: []
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
          <span className="font-mono text-[10px] text-brand-muted uppercase block">{row.id}</span>
          <Link
            to={`/admin/master-data/process-templates/${row.id}`}
            className="font-bold text-brand-dark hover:text-brand-green text-xs block mt-0.5"
          >
            {row.name}
          </Link>
          <span className="text-[11px] text-stone-500">Người thiết lập: {row.author}</span>
        </div>
      )
    },
    {
      header: 'Áp Dụng Cho Giống',
      key: 'varietyName',
      sortable: true,
      render: (row) => (
        <div>
          <span className="text-[10px] font-bold text-brand-green uppercase">{row.cropName}</span>
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
      header: 'Số Bước Kỹ Thuật',
      key: 'totalSteps',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-brand-dark text-xs">
          {row.totalSteps} bước theo ngày
        </span>
      )
    },
    {
      header: 'Ngày Ban Hành',
      key: 'createdDate',
      sortable: true,
      render: (row) => <span className="text-xs text-stone-600">{row.createdDate}</span>
    },
    {
      header: 'Trạng Thái',
      key: 'status',
      sortable: true,
      render: (row) => <Badge variant={row.status} size="sm">{row.status}</Badge>
    },
    {
      header: 'Thao Tác',
      key: 'actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Link
            to={`/admin/master-data/process-templates/${row.id}`}
            className="p-1.5 text-stone-500 hover:text-brand-green hover:bg-stone-100 rounded-lg transition-colors"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-green uppercase tracking-wider">
              Thực thể: ProcessTemplate & TemplateSteps (Quy Trình Canh Tác)
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

        <Button variant="primary" size="md" icon={Plus} onClick={() => setShowModal(true)}>
          Tạo Quy Trình Chuẩn Mới
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={templates}
        searchPlaceholder="Tìm kiếm quy trình, giống cây..."
        searchField="name"
      />

      {/* Modal Create Template */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Tạo Mẫu Quy Trình Canh Tác Mới"
        subtitle="Quy trình chuẩn hóa do Chuyên Gia Nông Nghiệp thiết lập"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Tên Quy Trình Canh Tác"
            required
            placeholder="Ví dụ: Quy Trình VietGAP Cà Chua Bi Cherry Chuẩn Hóa"
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
              placeholder="v1.0"
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
              {isSubmitting ? 'Đang Khởi Tạo...' : 'Khởi Tạo Template & Nhập Lộ Trình'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
