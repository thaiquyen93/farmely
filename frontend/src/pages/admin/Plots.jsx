import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { plotsData as initialPlots } from '../../data/plots';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Grid3X3, Plus, Eye, Edit, Trash2, Radio, Sprout } from 'lucide-react';

export default function Plots() {
  const [plots, setPlots] = useState(initialPlots);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleDelete = () => {
    if (confirmDeleteId) {
      setPlots((prev) => prev.filter((p) => p.id !== confirmDeleteId));
      setConfirmDeleteId(null);
    }
  };

  const columns = [
    {
      header: 'Mã & Tên Thửa Đất',
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
            <span className="text-[11px] font-black font-mono text-brand-yellow bg-brand-dark px-1.5 py-0.5 rounded">
              {row.code}
            </span>
            <Link
              to={`/admin/master-data/plots/${row.id}`}
              className="block font-bold text-brand-dark hover:text-brand-green transition-colors mt-0.5"
            >
              {row.name}
            </Link>
          </div>
        </div>
      )
    },
    {
      header: 'Khu Nông Trại (Land)',
      key: 'landName',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-stone-700 font-medium">
          {row.landName}
        </span>
      )
    },
    {
      header: 'Diện Tích',
      key: 'area',
      sortable: true,
      render: (row) => <span className="font-bold text-brand-dark text-xs">{row.area}</span>
    },
    {
      header: 'Loại Đất',
      key: 'soilType',
      render: (row) => (
        <span className="text-xs text-stone-600 max-w-xs block truncate" title={row.soilType}>
          {row.soilType}
        </span>
      )
    },
    {
      header: 'Giá Thuê / Tháng',
      key: 'rentalPrice',
      sortable: true,
      render: (row) => (
        <span className="font-heading font-bold text-brand-green text-xs">
          {row.formattedPrice}
        </span>
      )
    },
    {
      header: 'Trạm IoT',
      key: 'iotStationId',
      render: (row) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-brand-cream text-brand-dark border border-brand-border">
          <Radio className="w-3 h-3 text-brand-green" />
          {row.iotStationId}
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
          <Link
            to={`/admin/master-data/plots/${row.id}`}
            className="p-1.5 text-stone-500 hover:text-brand-green hover:bg-stone-100 rounded-lg transition-colors"
            title="Xem chi tiết"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <Link
            to={`/admin/master-data/plots/create?editId=${row.id}`}
            className="p-1.5 text-stone-500 hover:text-amber-600 hover:bg-stone-100 rounded-lg transition-colors"
            title="Chỉnh sửa"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setConfirmDeleteId(row.id)}
            className="p-1.5 text-stone-500 hover:text-rose-600 hover:bg-stone-100 rounded-lg transition-colors"
            title="Xóa thửa đất"
          >
            <Trash2 className="w-4 h-4" />
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
            Thực thể: Plot (Đơn vị cho thuê nhỏ nhất - BR02)
          </span>
          <h2 className="text-2xl font-heading font-black text-brand-dark mt-1">
            Quản Lý Thửa Đất Canh Tác
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Mỗi thửa đất quản lý độc lập về diện tích, trạm IoT, danh mục giống tương thích và trạng thái lịch khả dụng.
          </p>
        </div>

        <Link to="/admin/master-data/plots/create">
          <Button variant="primary" size="md" icon={Plus}>
            Thêm Thửa Đất Mới
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={plots}
        searchPlaceholder="Tìm kiếm theo mã thửa, tên thửa, loại đất..."
      />

      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title="Xác nhận xóa Thửa Đất"
        message="Hành động này sẽ gỡ bỏ thửa đất khỏi hệ thống. Chỉ cho phép nếu thửa đất chưa có hợp đồng Active."
      />
    </div>
  );
}
