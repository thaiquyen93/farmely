import React, { useEffect, useState } from 'react';
import { cropsData as initialCrops } from '../../data/crops';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { Sprout, Plus, Edit, Eye, Power, Trash2, Loader2 } from 'lucide-react';

export default function Crops() {
  const [crops, setCrops] = useState(initialCrops);
  const [loading, setLoading] = useState(true);
  const [isLiveDb, setIsLiveDb] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form modal state
  const [showModal, setShowModal] = useState(false);
  const [cropName, setCropName] = useState('');
  const [cropCode, setCropCode] = useState('');
  const [cropDesc, setCropDesc] = useState('');
  const [cropCycle, setCropCycle] = useState('30 - 45 ngày');

  const loadCrops = () => {
    setLoading(true);
    fetch('/api/crops')
      .then((res) => res.json())
      .then((res) => {
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setCrops(res.data);
          setIsLiveDb(true);
        }
      })
      .catch((err) => {
        console.warn('Cannot fetch live crops, fallback to mock:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCrops();
  }, []);

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

  const handleSave = async (e) => {
    e.preventDefault();
    if (!cropName.trim()) return;
    setIsSaving(true);

    try {
      if (isEditing && selectedCrop) {
        await fetch(`/api/crops/${selectedCrop.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cropName.trim(), description: cropDesc, cycle: cropCycle })
        });
      } else {
        await fetch('/api/crops', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cropName.trim(), description: cropDesc, cycle: cropCycle })
        });
      }
      loadCrops();
      setShowModal(false);
    } catch (err) {
      console.error('Error saving crop:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Bạn có chắc muốn xóa danh mục cây #${id}?`)) return;
    try {
      await fetch(`/api/crops/${id}`, { method: 'DELETE' });
      loadCrops();
    } catch (err) {
      console.error('Error deleting crop:', err);
    }
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-green uppercase tracking-wider">
              Thực thể: Crop (Phân loại thực vật học)
            </span>
            {isLiveDb && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live DB: {crops.length} Loại cây</span>
              </span>
            )}
          </div>
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
