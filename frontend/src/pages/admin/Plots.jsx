import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { farmApi, plotStatusBadge } from '../../api/farm/farmApi';
import { formatArea } from '../../utils/polygonGeometry';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Plus, Edit, Trash2, Loader2, PenLine, Map } from 'lucide-react';

export default function Plots() {
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError('');
    farmApi.listPlots()
      .then((rows) => setPlots((rows || []).map((p) => ({
        id: p.plotId,
        code: p.plotCode,
        name: p.plotCode,
        landId: p.landId,
        landName: p.landName,
        areaNum: Number(p.area) || 0,
        area: formatArea(Number(p.area)),
        rentalPrice: Number(p.pricePerPeriod) || 0,
        formattedPrice: `${Number(p.pricePerPeriod || 0).toLocaleString('vi-VN')} đ`,
        drawn: p.boundary?.length >= 3,
        corners: p.boundary?.length || 0,
        status: plotStatusBadge(p.status),
        isPublished: p.isPublished,
        imageUrl: p.imageUrl
      }))))
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      await farmApi.deletePlot(confirmDeleteId);
      setPlots((prev) => prev.filter((x) => x.id !== confirmDeleteId));
      setConfirmDeleteId(null);
    } catch (e) {
      setConfirmDeleteId(null);
      setLoadError(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      header: 'Mã & Tên Thửa Đất',
      key: 'name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.imageUrl ? (
            <img src={row.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-brand-border" />
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand-border bg-brand-cream text-brand-green"><Map className="h-5 w-5" /></span>
          )}
          <div>
            <span className="text-[11px] font-black font-mono text-brand-yellow bg-brand-dark px-1.5 py-0.5 rounded">
              {row.code}
            </span>
            <span className="block text-xs text-stone-500 mt-0.5">{row.isPublished ? 'Đang niêm yết Marketplace' : 'Chưa niêm yết'}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Khu Nông Trại (Land)',
      key: 'landName',
      sortable: true,
      render: (row) => (
        <Link to={`/admin/master-data/lands/${row.landId}`} className="text-xs text-stone-700 font-medium hover:text-brand-green">
          {row.landName}
        </Link>
      )
    },
    {
      header: 'Diện Tích',
      key: 'areaNum',
      sortable: true,
      render: (row) => <span className="font-bold text-brand-dark text-xs">{row.area}</span>
    },
    {
      header: 'Ranh Giới',
      key: 'drawn',
      render: (row) => row.drawn
        ? <span className="text-xs font-semibold text-emerald-700">Đã vẽ · {row.corners} góc</span>
        : <span className="text-xs text-stone-400">Chưa vẽ</span>
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
            to={`/admin/master-data/plots/create?editId=${row.id}`}
            className="p-1.5 text-stone-500 hover:text-amber-600 hover:bg-stone-100 rounded-lg transition-colors"
            title={row.drawn ? 'Chỉnh sửa' : 'Vẽ ranh giới'}
          >
            {row.drawn ? <Edit className="w-4 h-4" /> : <PenLine className="w-4 h-4" />}
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

      {loadError && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <span>{loadError}</span>
          <button type="button" onClick={load} className="shrink-0 font-semibold underline">Tải lại</button>
        </div>
      )}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-stone-500"><Loader2 className="h-5 w-5 animate-spin" />Đang tải dữ liệu…</div>
      ) : (
      <DataTable
        columns={columns}
        data={plots}
        searchPlaceholder="Tìm theo mã thửa..."
        searchField="code"
      />
      )}

      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Xác nhận xóa Thửa Đất"
        message="Hành động này sẽ gỡ bỏ thửa đất khỏi hệ thống. Chỉ cho phép nếu thửa đất chưa có hợp đồng Active."
      />
    </div>
  );
}
