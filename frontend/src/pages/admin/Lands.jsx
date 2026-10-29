import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { farmApi } from '../../api/farm/farmApi';
import { formatArea } from '../../utils/polygonGeometry';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Plus, Eye, Edit, Trash2, MapPin, Grid3X3, Loader2, Sparkles, CheckCircle2, Clock } from 'lucide-react';

export default function Lands() {
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [flashMessage, setFlashMessage] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError('');
    farmApi.listLands()
      .then((rows) => setLands((rows || []).map((l) => {
        const totalPlots = Number(l.totalPlots) || 0;
        const publishedPlots = Number(l.publishedPlots) || 0;
        const configuredPlots = Number(l.configuredPlots) || 0;
        const isPublished = Boolean(l.isPublished) && publishedPlots > 0;
        return {
          id: l.landId,
          code: `LAND-${l.landId}`,
          name: l.landName,
          location: l.address,
          areaM2: l.boundaryAreaM2 || 0,
          totalArea: l.boundaryAreaM2 ? formatArea(l.boundaryAreaM2) : 'Chưa nhập GPS',
          totalPlots,
          activePlots: l.availablePlots || 0,
          publishedPlots,
          configuredPlots,
          isPublished,
          hasBoundary: Boolean(l.boundary && l.boundary.length >= 3),
          status: isPublished ? 'ACTIVE' : 'DRAFT'
        };
      })))
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const handleToggleLandPublish = async (landRow) => {
    setTogglingId(landRow.id);
    setLoadError('');
    setFlashMessage('');
    try {
      const nextPublished = !landRow.isPublished;
      await farmApi.publishLand(landRow.id, nextPublished);
      setFlashMessage(
        nextPublished
          ? `Đã chuyển trạng thái kích hoạt nông trại "${landRow.name}" hiển thị lên Marketplace!`
          : `Đã gỡ niêm yết nông trại "${landRow.name}" khỏi Marketplace.`
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
      await farmApi.deleteLand(confirmDeleteId);
      setLands((prev) => prev.filter((x) => x.id !== confirmDeleteId));
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
      header: 'Mã & Tên Nông Trại',
      key: 'name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand-border bg-brand-cream text-brand-green"><MapPin className="h-5 w-5" /></span>
          <div>
            <span className="text-[10px] font-mono text-brand-muted uppercase block">
              {row.code}
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
      key: 'areaM2',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-brand-dark text-xs">
          {row.totalArea}
        </span>
      )
    },
    {
      header: 'Thửa Đất & Tiến Độ Expert',
      key: 'totalPlots',
      sortable: true,
      render: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-dark">
            <Grid3X3 className="w-3.5 h-3.5 text-brand-green" />
            <span>{row.publishedPlots} đã publish / {row.totalPlots} thửa</span>
          </div>
          {row.totalPlots === 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
              <Clock className="w-3 h-3" /> Chưa vẽ thửa đất
            </span>
          ) : row.configuredPlots > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
              <CheckCircle2 className="w-3 h-3" /> Expert đã gán giống ({row.configuredPlots}/{row.totalPlots} thửa)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
              <Clock className="w-3 h-3" /> Chờ Expert gán giống & quy trình
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Trạng Thái & Marketplace',
      key: 'status',
      sortable: true,
      render: (row) => (
        <div className="space-y-1.5">
          {row.isPublished ? (
            <>
              <Badge variant="ACTIVE" size="sm">ACTIVE · Đang hiện trên sàn</Badge>
              <div>
                <button
                  type="button"
                  disabled={togglingId === row.id}
                  onClick={() => handleToggleLandPublish(row)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition cursor-pointer"
                >
                  <span>Tạm ẩn khỏi Marketplace</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <Badge variant="DRAFT" size="sm">
                {row.configuredPlots > 0 ? 'CHỜ ADMIN DUYỆT' : 'CHƯA KÍCH HOẠT'}
              </Badge>
              <div>
                <button
                  type="button"
                  disabled={togglingId === row.id}
                  onClick={() => handleToggleLandPublish(row)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black shadow-xs transition cursor-pointer ${
                    row.configuredPlots > 0
                      ? 'bg-[#294C3B] hover:bg-[#1f3a2d] text-white'
                      : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                  }`}
                  title={
                    row.configuredPlots > 0
                      ? 'Expert đã gán giống & quy trình. Bấm để chuyển trạng thái hiện lên Marketplace'
                      : 'Cần Expert gán giống cây & quy trình trước khi hiện lên Marketplace'
                  }
                >
                  <Sparkles className="w-3 h-3" />
                  <span>
                    {row.configuredPlots > 0 ? 'KÍCH HOẠT LÊN MARKETPLACE' : 'CHUYỂN TRẠNG THÁI (CẦN EXPERT)'}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      )
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
            title="Xoá nông trại"
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
        data={lands}
        searchPlaceholder="Tìm kiếm theo tên nông trại, vị trí..."
        searchField="name"
      />
      )}

      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Xoá nông trại"
        message="Chỉ xoá được nông trại không còn thửa đất nào. Hành động này không thể hoàn tác."
      />
    </div>
  );
}
