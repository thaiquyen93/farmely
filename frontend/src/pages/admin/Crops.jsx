import React, { useState } from 'react';
import { cropsData as initialCrops } from '../../data/crops';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { Sprout, Plus, Edit, Eye, Power } from 'lucide-react';

export default function Crops() {
  const [crops, setCrops] = useState(initialCrops);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form modal state
  const [showModal, setShowModal] = useState(false);
  const [cropName, setCropName] = useState('');
  const [cropCode, setCropCode] = useState('');
  const [cropDesc, setCropDesc] = useState('');
  const [cropCycle, setCropCycle] = useState('30 - 45 ngày');

  const openCreateModal = () => {
    setIsEditing(false);
    setCropName('');
    setCropCode('');
    setCropDesc('');
    setCropCycle('30 - 45 ngày');
    setShowModal(true);
  };

  const openEditModal = (c) => {
    setIsEditing(true);
    setSelectedCrop(c);
    setCropName(c.name);
    setCropCode(c.code);
    setCropDesc(c.description);
    setCropCycle(c.standardGrowthCycle);
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!cropName.trim()) return;

    if (isEditing && selectedCrop) {
      setCrops((prev) =>
        prev.map((item) =>
          item.id === selectedCrop.id
            ? { ...item, name: cropName, code: cropCode, description: cropDesc, standardGrowthCycle: cropCycle }
            : item
        )
      );
    } else {
      const newCrop = {
        id: `CRP-0${crops.length + 1}`,
        name: cropName,
        code: cropCode || 'NEW_CROP',
        description: cropDesc,
        totalVarieties: 0,
        status: 'ACTIVE',
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
        standardGrowthCycle: cropCycle
      };
      setCrops((prev) => [...prev, newCrop]);
    }
    setShowModal(false);
  };

  const toggleStatus = (id) => {
    setCrops((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : c
      )
    );
  };

  const columns = [
    {
      header: 'Danh Mục Cây Trồng',
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
            <span className="font-mono text-[10px] text-brand-muted uppercase block">{row.id}</span>
            <span className="font-bold text-brand-dark text-xs block">{row.name}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Mô Tả Sinh Học',
      key: 'description',
      render: (row) => (
        <span className="text-xs text-stone-600 line-clamp-2 max-w-sm block">
          {row.description}
        </span>
      )
    },
    {
      header: 'Chu Kỳ Sinh Trưởng',
      key: 'standardGrowthCycle',
      render: (row) => <span className="text-xs font-semibold text-brand-dark">{row.standardGrowthCycle}</span>
    },
    {
      header: 'Số Lượng Giống F1',
      key: 'totalVarieties',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-brand-green text-xs">
          {row.totalVarieties} giống được duyệt
        </span>
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
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 text-stone-500 hover:text-amber-600 hover:bg-stone-100 rounded-lg transition-colors"
            title="Chỉnh sửa"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleStatus(row.id)}
            className="p-1.5 text-stone-500 hover:text-brand-green hover:bg-stone-100 rounded-lg transition-colors"
            title="Bật/Tắt hoạt động"
          >
            <Power className="w-4 h-4" />
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
            Thực thể: Crop (Phân loại thực vật học)
          </span>
          <h2 className="text-2xl font-heading font-black text-brand-dark mt-1">
            Danh Mục Cây Trồng
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Nhóm cây trồng cấp độ tổng quát (rau ăn lá, cây ăn quả, dưa leo...) quản lý tập hợp các giống F1.
          </p>
        </div>

        <Button variant="primary" size="md" icon={Plus} onClick={openCreateModal}>
          Thêm Danh Mục Cây
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={crops}
        searchPlaceholder="Tìm kiếm nhóm cây trồng..."
        searchField="name"
      />

      {/* Modal Create/Edit */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={isEditing ? 'Chỉnh Sửa Nhóm Cây Trồng' : 'Thêm Nhóm Cây Trồng Mới'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Tên Nhóm Cây Trồng"
            required
            placeholder="Ví dụ: Rau ăn lá, Cà chua & Quả mọng"
            value={cropName}
            onChange={(e) => setCropName(e.target.value)}
          />

          <Input
            label="Mã Phân Loại (Code)"
            required
            placeholder="LEAFY_GREENS"
            value={cropCode}
            onChange={(e) => setCropCode(e.target.value)}
          />

          <Input
            label="Chu Kỳ Sinh Trưởng Chuẩn"
            placeholder="Ví dụ: 30 - 45 ngày"
            value={cropCycle}
            onChange={(e) => setCropCycle(e.target.value)}
          />

          <div>
            <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-1.5">
              Mô Tả Đặc Điểm
            </label>
            <textarea
              rows={3}
              value={cropDesc}
              onChange={(e) => setCropDesc(e.target.value)}
              className="w-full rounded-xl border border-brand-border bg-white px-3.5 py-2 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-brand-border">
            <Button variant="outline" size="sm" type="button" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Lưu Danh Mục
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
