import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { varietiesData as initialVarieties } from '../../data/varieties';
import { cropsData } from '../../data/crops';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { Wheat, Plus, Eye, Edit, Clock, Layers, BookOpen, CheckCircle2 } from 'lucide-react';

export default function Varieties() {
  const [varieties, setVarieties] = useState(initialVarieties);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [cropId, setCropId] = useState('CRP-01');
  const [duration, setDuration] = useState('45');
  const [yieldVal, setYieldVal] = useState('4.0 kg/m²');
  const [desc, setDesc] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  const openCreate = () => {
    setIsEditing(false);
    setName('');
    setCropId('CRP-01');
    setDuration('45');
    setYieldVal('4.0 kg/m²');
    setDesc('');
    setStatus('ACTIVE');
    setShowModal(true);
  };

  const openEdit = (v) => {
    setIsEditing(true);
    setCurrentId(v.id);
    setName(v.name);
    setCropId(v.cropId);
    setDuration(String(v.growthDuration));
    setYieldVal(v.expectedYield);
    setDesc(v.description);
    setStatus(v.status);
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const cropObj = cropsData.find((c) => c.id === cropId);

    if (isEditing && currentId) {
      setVarieties((prev) =>
        prev.map((v) =>
          v.id === currentId
            ? {
                ...v,
                name,
                cropId,
                cropName: cropObj ? cropObj.name : v.cropName,
                growthDuration: parseInt(duration, 10) || 45,
                expectedYield: yieldVal,
                description: desc,
                status
              }
            : v
        )
      );
    } else {
      const newVar = {
        id: `VAR-00${varieties.length + 1}`,
        name,
        cropId,
        cropName: cropObj ? cropObj.name : 'Rau màu',
        growthDuration: parseInt(duration, 10) || 45,
        bufferTime: 7,
        expectedYield: yieldVal,
        description: desc,
        compatiblePlotsCount: 3,
        processTemplateId: null,
        knowledgeDocsCount: 1,
        status,
        imageUrl: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80',
        growingCharacteristics: {
          lightRequirement: 'Nắng trực tiếp',
          soilMoistureTarget: '65% - 75%',
          temperatureRange: '22°C - 30°C',
          fertilizerNeeds: 'Hữu cơ vi sinh'
        }
      };
      setVarieties((prev) => [...prev, newVar]);
    }
    setShowModal(false);
  };

  const columns = [
    {
      header: 'Tên Giống & Thuộc Cây',
      key: 'name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.imageUrl}
            alt={row.name}
            className="w-12 h-12 rounded-xl object-cover border border-brand-border"
          />
          <div>
            <span className="text-[10px] font-bold text-brand-green uppercase block">{row.cropName}</span>
            <Link
              to={`/admin/master-data/varieties/${row.id}`}
              className="font-bold text-brand-dark hover:text-brand-green transition-colors text-xs"
            >
              {row.name}
            </Link>
          </div>
        </div>
      )
    },
    {
      header: 'Thời Gian Sinh Trưởng',
      key: 'growthDuration',
      sortable: true,
      render: (row) => (
        <div className="text-xs">
          <span className="font-bold text-brand-dark flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-brand-green" />
            {row.growthDuration} ngày
          </span>
          <span className="text-[10px] text-stone-500">Buffer: +{row.bufferTime} ngày (BR04)</span>
        </div>
      )
    },
    {
      header: 'Năng Suất Kỳ Vọng',
      key: 'expectedYield',
      render: (row) => <span className="font-semibold text-brand-green text-xs">{row.expectedYield}</span>
    },
    {
      header: 'Thửa Đất Tương Thích',
      key: 'compatiblePlotsCount',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-semibold text-brand-dark flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-stone-400" />
          {row.compatiblePlotsCount} thửa đất
        </span>
      )
    },
    {
      header: 'Quy Trình VietGAP',
      key: 'processTemplateName',
      render: (row) => (
        row.processTemplateId ? (
          <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            ✓ Đã có ({row.processTemplateId})
          </span>
        ) : (
          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            ⚠ Chưa có template
          </span>
        )
      )
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
            to={`/admin/master-data/varieties/${row.id}`}
            className="p-1.5 text-stone-500 hover:text-brand-green hover:bg-stone-100 rounded-lg transition-colors"
            title="Xem chi tiết"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button
            onClick={() => openEdit(row)}
            className="p-1.5 text-stone-500 hover:text-amber-600 hover:bg-stone-100 rounded-lg transition-colors"
            title="Chỉnh sửa"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-brand-green uppercase tracking-wider">
            Thực thể: Variety (Giống cây trồng được kiểm định - BR03)
          </span>
          <h2 className="text-2xl font-heading font-black text-brand-dark mt-1">
            Danh Mục Giống Cây Trồng
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Quản lý các giống rau sạch, thời gian sinh trưởng, năng suất dự kiến và quy trình VietGAP liên kết.
          </p>
        </div>

        <Button variant="primary" size="md" icon={Plus} onClick={openCreate}>
          Thêm Giống Cây Mới
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={varieties}
        searchPlaceholder="Tìm kiếm giống cây trồng..."
        searchField="name"
      />

      {/* Modal Add / Edit */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={isEditing ? 'Chỉnh Sửa Giống Cây Trồng' : 'Thêm Giống Cây Trồng Mới'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Tên Giống Cây"
            required
            placeholder="Ví dụ: Cà chua bi Cherry Ruby F1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Select
            label="Thuộc Nhóm Cây Trồng"
            required
            value={cropId}
            onChange={(e) => setCropId(e.target.value)}
            options={cropsData.map((c) => ({ value: c.id, label: c.name }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Thời Gian Sinh Trưởng (Ngày)"
              type="number"
              required
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />

            <Input
              label="Năng Suất Dự Kiến (kg/m²)"
              required
              value={yieldVal}
              onChange={(e) => setYieldVal(e.target.value)}
            />
          </div>

          <Select
            label="Trạng Thái Hoạt Động"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: 'ACTIVE', label: 'ACTIVE (Đang khả dụng)' },
              { value: 'INACTIVE', label: 'INACTIVE (Tạm ngưng cung cấp)' }
            ]}
          />

          <div>
            <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-1.5">
              Mô Tả & Khuyến Nghị
            </label>
            <textarea
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full rounded-xl border border-brand-border bg-white px-3.5 py-2 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-brand-border">
            <Button variant="outline" size="sm" type="button" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Lưu Giống Cây
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
