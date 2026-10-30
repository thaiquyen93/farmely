import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { farmApi, plotStatusBadge } from '../../api/farm/farmApi';
import { formatArea } from '../../utils/polygonGeometry';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Plus, Edit, Trash2, Loader2, PenLine, Map, Sparkles, CheckCircle2, Clock, EyeOff } from 'lucide-react';

export default function Plots() {
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [flashMessage, setFlashMessage] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError('');
    farmApi.listPlots()
      .then((rows) => setPlots((rows || []).map((p) => {
        const compatCount = Number(p.compatibleVarietiesCount) || (Array.isArray(p.compatibleVarieties) ? p.compatibleVarieties.length : (Array.isArray(p.crops) ? p.crops.length : 0));
        return {
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
          compatibleVarietiesCount: compatCount,
          crops: Array.isArray(p.crops) ? p.crops : [],
          imageUrl: p.imageUrl
        };
      })))
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const handleTogglePublish = async (row) => {
    setTogglingId(row.id);
    setLoadError('');
    setFlashMessage('');
    try {
      const nextPublished = !row.isPublished;
      await farmApi.publishPlot(row.id, nextPublished);
      setFlashMessage(
        nextPublished
          ? `Đã duyệt & chuyển trạng thái thửa đất ${row.code} hiển thị công khai lên Marketplace!`
          : `Đã gỡ niêm yết thửa đất ${row.code} khỏi Marketplace.`
      );
      load();
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setTogglingId(null);
    }
  };

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
            <img src={row.imageUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-brand-border" />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-border bg-brand-cream text-brand-green"><Map className="h-5 w-5" /></span>
          )}
          <div>
            <span className="text-[11px] font-black font-mono text-brand-yellow bg-brand-dark px-1.5 py-0.5 rounded">
              {row.code}
            </span>
            <span className="text-[11px] text-stone-500 block mt-0.5">
              {row.soilType || 'Đất phù sa'}
            </span>
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
      header: 'Giống & Quy Trình (Expert)',
      key: 'compatibleVarietiesCount',
      sortable: true,
      render: (row) => row.compatibleVarietiesCount > 0 ? (
        <div className="space-y-0.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã gán {row.compatibleVarietiesCount} giống
          </span>
          {row.crops.length > 0 && (
            <p className="text-[11px] text-stone-500 truncate max-w-[180px]">{row.crops.join(', ')}</p>
          )}
        </div>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" /> Chưa gán giống (BR03)
        </span>
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
      render: (row) => {
        if (row.isPublished) {
          return (
            <Badge variant="ACTIVE" size="sm" className="font-bold">
              ACTIVE
            </Badge>
          );
        }
        if (row.compatibleVarietiesCount > 0) {
          return (
            <Badge variant="REVIEW_REQUIRED" size="sm" className="font-bold">
              PENDING
            </Badge>
          );
        }
        return (
          <Badge variant="ARCHIVED" size="sm" className="font-bold text-stone-600">
            UNACTIVE
          </Badge>
        );
      }
    },
    {
      header: 'Hành Động',
      key: 'actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          {/* Nút bấm chuyển trạng thái Active / Unactive */}
          <button
            type="button"
            disabled={togglingId === row.id}
            onClick={() => handleTogglePublish(row)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer ${
              row.isPublished
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
            title={
              row.isPublished
                ? 'Bấm để chuyển sang Unactive (Tạm ẩn khỏi Marketplace)'
                : 'Bấm để chuyển sang Active (Kích hoạt hiển thị lên Marketplace)'
            }
          >
            {togglingId === row.id ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : row.isPublished ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{row.isPublished ? 'Chuyển Unactive' : 'Chuyển Active'}</span>
          </button>

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
            Thực thể: Thửa Đất (Plot)
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

      {flashMessage && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0" />{flashMessage}</span>
          <button type="button" onClick={() => setFlashMessage('')} className="shrink-0 text-xs font-semibold underline">Đóng</button>
        </div>
      )}
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
