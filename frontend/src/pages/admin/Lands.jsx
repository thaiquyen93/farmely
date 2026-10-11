import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { landsData as initialLands } from '../../data/lands';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Building2, Plus, Eye, Edit, Trash2, MapPin, Grid3X3 } from 'lucide-react';

export default function Lands() {
  const [lands, setLands] = useState(initialLands);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleDelete = () => {
    if (confirmDeleteId) {
      setLands((prev) => prev.filter((l) => l.id !== confirmDeleteId));
      setConfirmDeleteId(null);
    }
  };

  const columns = [
    {
      header: 'Mã & Tên Nông Trại',
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
            <span className="text-[10px] font-mono text-brand-muted uppercase block">
              {row.id}
            </span>
            <Link
              to={`/admin/master-data/lands/${row.id}`}
              className="font-bold text-brand-dark hover:text-brand-green transition-colors"
            >
              {row.name}
            </Link>
          </div>
        </div>
      )
    },
    {
      header: 'Địa Điểm / Vị Trí',
      key: 'location',
      sortable: true,
      render: (row) => (
        <div className="flex items-start gap-1.5 max-w-xs text-xs text-stone-600">
          <MapPin className="w-3.5 h-3.5 text-brand-green shrink-0 mt-0.5" />
          <span>{row.location}</span>
        </div>
      )
    },
    {
      header: 'Tổng Diện Tích',
      key: 'totalArea',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-brand-dark text-xs">
          {row.totalArea}
        </span>
      )
    },
    {
      header: 'Số Lượng Thửa Đất',
      key: 'totalPlots',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-dark">
          <Grid3X3 className="w-3.5 h-3.5 text-brand-green" />
          <span>{row.activePlots} / {row.totalPlots} thửa</span>
        </div>
      )
    },
    {
      header: 'Trạng Thái',
      key: 'status',
      sortable: true,
      render: (row) => <Badge variant={row.status} size="sm">{row.status}</Badge>
    },
    {
      header: 'Hành Động',
      key: 'actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Link
            to={`/admin/master-data/lands/${row.id}`}
            className="p-1.5 text-stone-500 hover:text-brand-green hover:bg-stone-100 rounded-lg transition-colors"
            title="Xem chi tiết"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <Link
            to={`/admin/master-data/lands/create?editId=${row.id}`}
            className="p-1.5 text-stone-500 hover:text-amber-600 hover:bg-stone-100 rounded-lg transition-colors"
            title="Chỉnh sửa"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setConfirmDeleteId(row.id)}
            className="p-1.5 text-stone-500 hover:text-rose-600 hover:bg-stone-100 rounded-lg transition-colors"
            title="Ngừng hoạt động"
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
            Thực thể: Land (Master Property)
          </span>
          <h2 className="text-2xl font-heading font-black text-brand-dark mt-1">
            Quản Lý Nông Trại
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Quản lý các khu đất mẹ do Farmely trực tiếp sở hữu và quy hoạch thành các thửa đất nhỏ.
          </p>
        </div>

        <Link to="/admin/master-data/lands/create">
          <Button variant="primary" size="md" icon={Plus}>
            Thêm Nông Trại Mới
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={lands}
        searchPlaceholder="Tìm kiếm theo tên nông trại, vị trí..."
        searchField="name"
      />

      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title="Xác nhận ngừng kích hoạt Nông Trại"
        message="Bạn có chắc muốn chuyển trạng thái nông trại này sang ngừng hoạt động không? Các thửa đất đang có hợp đồng hoạt động sẽ vẫn tiếp tục theo vòng đời."
      />
    </div>
  );
}
