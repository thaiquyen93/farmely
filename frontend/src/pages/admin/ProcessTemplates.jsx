import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { processTemplatesData as initialTemplates } from '../../data/processTemplates';
import { varietiesData } from '../../data/varieties';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { FileSpreadsheet, Plus, Eye, Edit, Calendar, CheckCircle2, Clock } from 'lucide-react';

export default function ProcessTemplates() {
  const [templates, setTemplates] = useState(initialTemplates);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [varietyId, setVarietyId] = useState('VAR-001');
  const [version, setVersion] = useState('v1.0');
  const [status, setStatus] = useState('ACTIVE');
  const [desc, setDesc] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    const varObj = varietiesData.find((v) => v.id === varietyId);

    const newTemplate = {
      id: `TMPL-00${templates.length + 1}`,
      name,
      varietyId,
      varietyName: varObj ? varObj.name : 'Giống cây',
      cropName: varObj ? varObj.cropName : 'Rau màu',
      version,
      status,
      totalSteps: 4,
      createdDate: new Date().toISOString().split('T')[0],
      author: 'Chuyên Gia Nông Nghiệp',
      description: desc,
      steps: [
        {
          stepNumber: 1,
          dayOffset: 0,
          taskName: 'Làm đất & Bón lót ban đầu',
          description: 'Chuẩn bị giá thể hữu cơ theo quy chuẩn VietGAP.',
          method: 'Thủ công',
          durationMinutes: 60,
          status: 'PENDING',
          materialsRequired: 'Phân trùn quế, nấm Trichoderma'
        }
      ]
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
          <span className="text-xs font-bold text-brand-green uppercase tracking-wider">
            Thực thể: ProcessTemplate & TemplateSteps (Quy Chuẩn BR13)
          </span>
          <h2 className="text-2xl font-heading font-black text-brand-dark mt-1">
            Quy Trình Canh Tác Chuẩn VietGAP
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Các mẫu quy trình kỹ thuật theo từng mốc ngày tuổi (Day Offset), định mức vật tư và tự động sinh Care Task cho gói Assisted-growing.
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
              options={varietiesData.map((v) => ({
                value: v.id,
                label: `${v.name} (${v.cropName})`
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
            <Button variant="outline" size="sm" type="button" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Khởi Tạo Template
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
