import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { farmApi, plotStatusBadge } from '../../api/farm/farmApi';
import { formatRecordedArea } from '../../utils/polygonGeometry';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Plus, Edit, Trash2, Loader2, Map, Sparkles, CheckCircle2, Clock, EyeOff, Building2, FastForward, X, SlidersHorizontal } from 'lucide-react';

export default function Plots() {
  const [plots, setPlots] = useState([]);
  const [lands, setLands] = useState([]);
  const [selectedLandId, setSelectedLandId] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [flashMessage, setFlashMessage] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [simulatingPlot, setSimulatingPlot] = useState(null);
  const [simulatingLoading, setSimulatingLoading] = useState(false);
  const [simFeedback, setSimFeedback] = useState('');
  const [customDayInput, setCustomDayInput] = useState(1);

  // Phím tắt bí mật Alt + T để mở nhanh bộ mô phỏng chu kỳ vụ mùa khi demo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        const activePlots = plots.filter((p) => p.activeRental);
        if (activePlots.length > 0) {
          const target = simulatingPlot || activePlots[0];
          setSimulatingPlot(target);
          setSimFeedback('');
          setCustomDayInput(target.activeRental?.currentDay || 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [plots, simulatingPlot]);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError('');
    Promise.all([
      farmApi.listPlots(),
      farmApi.listLands().catch(() => [])
    ])
      .then(([rows, landsData]) => {
        const rawLands = Array.isArray(landsData) ? landsData : (landsData?.data || []);
        setLands(rawLands);
        setPlots((rows || []).map((p) => {
          const compatCount = Number(p.compatibleVarietiesCount) || (Array.isArray(p.compatibleVarieties) ? p.compatibleVarieties.length : (Array.isArray(p.crops) ? p.crops.length : 0));
          return {
            id: p.plotId,
            code: p.plotCode,
            name: p.plotCode,
            landId: p.landId,
            landName: p.landName,
            areaNum: Number(p.area) || 0,
            area: formatRecordedArea(Number(p.area)),
            rentalPrice: Number(p.pricePerPeriod) || 0,
            formattedPrice: `${Number(p.pricePerPeriod || 0).toLocaleString('vi-VN')} đ`,
            status: plotStatusBadge(p.status),
            isPublished: p.isPublished,
            compatibleVarietiesCount: compatCount,
            crops: Array.isArray(p.crops) ? p.crops : [],
            imageUrl: p.imageUrl,
            activeRental: p.activeRental
          };
        }));
      })
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

  const handleSimulateTime = async (action, value) => {
    if (!simulatingPlot) return;
    setSimulatingLoading(true);
    setSimFeedback('');
    try {
      const payload = { action };
      if (action === 'SET_DAY') {
        payload.day = Number(value !== undefined ? value : customDayInput);
      } else if (action === 'ADD_DAYS') {
        payload.days = Number(value || 7);
      }
      const res = await fetch(`/api/plots/${simulatingPlot.id}/simulate-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setSimFeedback(data.message);
        if (data.data?.currentDay) {
          setCustomDayInput(data.data.currentDay);
        }
        setSimulatingPlot((prev) => ({
          ...prev,
          activeRental: {
            ...prev.activeRental,
            currentDay: data.data.currentDay,
            totalDays: data.data.totalDays,
            progressPercent: data.data.progressPercent,
            startDate: data.data.startDate
          }
        }));
        setPlots((prev) => prev.map((p) => p.id === simulatingPlot.id ? {
          ...p,
          activeRental: {
            ...p.activeRental,
            currentDay: data.data.currentDay,
            totalDays: data.data.totalDays,
            progressPercent: data.data.progressPercent,
            startDate: data.data.startDate
          }
        } : p));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('farmely_time_simulated'));
          try {
            localStorage.setItem('farmely_time_simulated_at', String(Date.now()));
            localStorage.setItem('farmely_task_sync', String(Date.now()));
          } catch {}
        }
      } else {
        setSimFeedback(`Lỗi: ${data.message}`);
      }
    } catch (err) {
      setSimFeedback(`Lỗi kết nối: ${err.message}`);
    } finally {
      setSimulatingLoading(false);
    }
  };

  const columns = [
    {
      header: 'Mã & Tên Thửa Đất',
      key: 'name',
      width: '190px',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.imageUrl ? (
            <img src={row.imageUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-brand-border" />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-border bg-brand-cream text-brand-green"><Map className="h-5 w-5" /></span>
          )}
          <div>
            <span className="inline-block whitespace-nowrap text-[11px] font-black font-mono text-brand-yellow bg-brand-dark px-1.5 py-0.5 rounded">
              {row.code}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Khu Nông Trại (Land)',
      key: 'landName',
      width: '175px',
      sortable: true,
      render: (row) => (
        <Link to={`/admin/master-data/lands/${row.landId}`} title={row.landName} className="block whitespace-normal break-words text-xs text-stone-700 font-medium hover:text-brand-green">
          {row.landName}
        </Link>
      )
    },
    {
      header: 'Giống & Quy Trình (Expert)',
      key: 'compatibleVarietiesCount',
      width: '240px',
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
          <Clock className="w-3 h-3 text-amber-600" /> Chưa gán giống
        </span>
      )
    },
    {
      header: 'Diện Tích',
      key: 'areaNum',
      width: '105px',
      sortable: true,
      render: (row) => <span className="font-bold text-brand-dark text-xs">{row.area}</span>
    },
    {
      header: 'Giá Thuê / Tháng',
      key: 'rentalPrice',
      width: '130px',
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
      width: '165px',
      sortable: true,
      render: (row) => {
        const opStatus = row.status;
        return (
          <div className="flex flex-col items-start gap-1">
            {opStatus === 'MAINTENANCE' ? (
              <Badge variant="MAINTENANCE" size="sm" className="font-bold">
                MAINT · Bảo trì
              </Badge>
            ) : opStatus === 'RENTED' ? (
              <Badge variant="RENTED" size="sm" className="font-bold">
                RENT · Đang thuê
              </Badge>
            ) : (
              <Badge variant="AVAILABLE" size="sm" className="font-bold">
                AVAIL · Sẵn sàng
              </Badge>
            )}
            <span className="text-[10px] font-semibold text-stone-500">
              {row.isPublished ? '• Đang niêm yết' : row.compatibleVarietiesCount > 0 ? '• Đang ẩn / Nghỉ đất' : '• Chưa niêm yết'}
            </span>
          </div>
        );
      }
    },
    {
      header: 'Tiến Trình Canh Tác',
      key: 'cultivation',
      width: '215px',
      render: (row) => row.activeRental ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setSimulatingPlot(row);
            setSimFeedback('');
            setCustomDayInput(row.activeRental?.currentDay || 1);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setSimulatingPlot(row);
              setSimFeedback('');
              setCustomDayInput(row.activeRental?.currentDay || 1);
            }
          }}
          className="group space-y-1.5 min-w-[155px] p-2 -m-1 rounded-xl hover:bg-stone-50 cursor-pointer transition select-none"
          title="Nhấp để xem và tinh chỉnh tiến độ chu kỳ vụ mùa (Alt + T)"
        >
          <div className="flex items-center justify-between gap-1 text-[11px]">
            <span className="font-semibold text-stone-800 truncate max-w-[105px]" title={row.activeRental.varietyName}>
              🌱 {row.activeRental.varietyName}
            </span>
            <span className="font-bold text-amber-700 group-hover:text-amber-800 transition">
              {row.activeRental.currentDay}/{row.activeRental.totalDays} ngày
            </span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden ring-1 ring-stone-200/50">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                row.activeRental.progressPercent >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, row.activeRental.progressPercent))}%` }}
            />
          </div>
        </div>
      ) : (
        <span className="text-xs text-stone-400 italic">Đất trống</span>
      )
    },
    {
      header: 'Hành Động',
      key: 'actions',
      width: '210px',
      render: (row) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
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

          {/* Nút icon nhỏ kín đáo: Mô phỏng chu kỳ vụ mùa */}
          {row.activeRental && (
            <button
              type="button"
              onClick={() => {
                setSimulatingPlot(row);
                setSimFeedback('');
                setCustomDayInput(row.activeRental?.currentDay || 1);
              }}
              className="p-1.5 text-stone-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
              title="Mô phỏng chu kỳ vụ mùa"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          )}

          <Link
            to={`/admin/master-data/plots/create?editId=${row.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-white px-2.5 py-1 text-xs font-semibold text-brand-dark transition-colors hover:border-brand-green hover:bg-emerald-50 hover:text-brand-green"
            title={`Chỉnh sửa thửa ${row.code} và diện tích canh tác thực tế`}
          >
            <Edit className="h-3.5 w-3.5" /> Chỉnh sửa thửa
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

  const filteredPlots = useMemo(() => {
    if (selectedLandId === 'ALL') return plots;
    return plots.filter((p) => String(p.landId) === String(selectedLandId));
  }, [plots, selectedLandId]);

  const filterComponent = (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <div className="relative flex-1 sm:w-72">
        <select
          value={selectedLandId}
          onChange={(e) => setSelectedLandId(e.target.value)}
          className="w-full appearance-none pl-9 pr-8 py-2 text-xs font-bold rounded-xl border border-brand-border/80 bg-brand-cream/40 hover:bg-brand-cream/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green text-brand-dark cursor-pointer transition-all truncate"
          aria-label="Lọc theo khu nông trại (Land)"
        >
          <option value="ALL">
            Tất cả khu nông trại ({plots.length} thửa / {lands.length} khu)
          </option>
          {lands.map((land) => {
            const lId = land.landId || land.id;
            const count = plots.filter((p) => String(p.landId) === String(lId)).length;
            return (
              <option key={lId} value={lId}>
                {land.landName || land.name} ({count} thửa)
              </option>
            );
          })}
        </select>
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-green">
          <Building2 className="w-3.5 h-3.5" />
        </span>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-[10px]">
          ▼
        </span>
      </div>
      {selectedLandId !== 'ALL' && (
        <button
          type="button"
          onClick={() => setSelectedLandId('ALL')}
          className="px-2 py-1 text-[11px] font-bold text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition shrink-0"
          title="Xóa bộ lọc khu"
        >
          Bỏ lọc
        </button>
      )}
      {plots.some((p) => p.activeRental) && (
        <button
          type="button"
          onClick={() => {
            const firstActive = plots.find((p) => p.activeRental);
            if (firstActive) {
              setSimulatingPlot(firstActive);
              setSimFeedback('');
              setCustomDayInput(firstActive.activeRental?.currentDay || 1);
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-brand-border/80 bg-white hover:bg-stone-50 text-stone-700 transition shadow-2xs cursor-pointer shrink-0"
          title="Mở bảng điều phối & mô phỏng chu kỳ vụ mùa (Alt + T)"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
          <span className="hidden sm:inline">Mô phỏng chu kỳ</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-black text-brand-dark">
            Quản Lý Thửa Đất Canh Tác
          </h2>
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
        data={filteredPlots}
        tableClassName="min-w-[1505px] table-fixed"
        searchPlaceholder="Tìm theo mã thửa..."
        searchField="code"
        filterComponent={filterComponent}
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

      {/* MODAL MÔ PHỎNG CHU KỲ CANH TÁC (SANDBOX SIMULATION) */}
      {simulatingPlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-start justify-between border-b border-stone-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <SlidersHorizontal className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-stone-900">
                      Mô Phỏng Chu Kỳ Canh Tác
                    </h3>
                    <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-extrabold text-stone-700 border border-stone-200">
                      SANDBOX SIMULATION
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Thửa {simulatingPlot.name} · {simulatingPlot.landName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setSimulatingPlot(null); setSimFeedback(''); }}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chuyển nhanh giữa các thửa đất đang canh tác nếu có nhiều thửa */}
            {plots.filter((p) => p.activeRental).length > 1 && (
              <div className="flex items-center gap-2 rounded-xl bg-stone-50 p-2 border border-stone-200 text-xs">
                <span className="font-bold text-stone-600 shrink-0">Chọn thửa:</span>
                <select
                  value={simulatingPlot.id}
                  onChange={(e) => {
                    const next = plots.find((p) => String(p.id) === String(e.target.value));
                    if (next) {
                      setSimulatingPlot(next);
                      setSimFeedback('');
                      setCustomDayInput(next.activeRental?.currentDay || 1);
                    }
                  }}
                  className="flex-1 py-1 px-2 rounded-lg border border-stone-300 bg-white text-stone-800 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {plots.filter((p) => p.activeRental).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.activeRental?.varietyName} (Ngày {p.activeRental?.currentDay}/{p.activeRental?.totalDays})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Thông tin tiến độ hiện tại */}
            <div className="rounded-xl bg-stone-50 p-4 border border-stone-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Giống cây trồng:</span>
                <span className="font-bold text-stone-900">{simulatingPlot.activeRental?.varietyName || 'Chưa rõ'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Khách thuê:</span>
                <span className="font-bold text-stone-900">{simulatingPlot.activeRental?.renterName || 'Khách hàng'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Chu kỳ chuẩn VietGAP:</span>
                <span className="font-bold text-stone-900">{simulatingPlot.activeRental?.totalDays || 45} ngày</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                <span className="text-stone-500 font-medium">Tiến độ mô phỏng:</span>
                <span className="text-sm font-extrabold text-amber-700">
                  Ngày {simulatingPlot.activeRental?.currentDay || 0} / {simulatingPlot.activeRental?.totalDays || 45} ({simulatingPlot.activeRental?.progressPercent || 0}%)
                </span>
              </div>
              <div className="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-brand-green h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(3, simulatingPlot.activeRental?.progressPercent || 0))}%` }}
                />
              </div>
            </div>

            {simFeedback && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{simFeedback}</span>
              </div>
            )}

            {/* KHU VỰC TỰ TAY ĐẶT SỐ NGÀY BẤT KỲ THEO TỪNG GIỐNG CÂY */}
            <div className="space-y-3 p-4 rounded-xl bg-amber-50/70 border border-amber-200">
              <div className="flex items-center justify-between">
                <label htmlFor="custom-day-input" className="text-xs font-bold text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Tự tay đặt ngày canh tác:</span>
                </label>
                <span className="text-xs text-amber-900 font-semibold">
                  Chu kỳ giống này: <strong>{simulatingPlot.activeRental?.totalDays || 45} ngày</strong>
                </span>
              </div>

              {/* Ô gõ ngày + nút +/- + Nút Áp dụng */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={simulatingLoading}
                  onClick={() => setCustomDayInput((prev) => Math.max(1, Number(prev || 1) - 1))}
                  className="h-10 w-10 shrink-0 rounded-lg border border-amber-300 bg-white font-bold text-sm text-stone-700 hover:bg-amber-100 flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Giảm 1 ngày"
                >
                  -1
                </button>

                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 select-none">
                    Ngày
                  </span>
                  <input
                    id="custom-day-input"
                    type="number"
                    min="1"
                    max={Number(simulatingPlot.activeRental?.totalDays || 45) + 30}
                    value={customDayInput}
                    onChange={(e) => setCustomDayInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSimulateTime('SET_DAY', Number(customDayInput));
                      }
                    }}
                    className="w-full h-10 pl-14 pr-16 rounded-lg border border-amber-300 bg-white text-base font-black text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                    placeholder="Gõ số ngày..."
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-bold select-none">
                    / {simulatingPlot.activeRental?.totalDays || 45}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={simulatingLoading}
                  onClick={() => setCustomDayInput((prev) => Math.min(Number(simulatingPlot.activeRental?.totalDays || 45) + 30, Number(prev || 0) + 1))}
                  className="h-10 w-10 shrink-0 rounded-lg border border-amber-300 bg-white font-bold text-sm text-stone-700 hover:bg-amber-100 flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Tăng 1 ngày"
                >
                  +1
                </button>

                <button
                  type="button"
                  disabled={simulatingLoading}
                  onClick={() => handleSimulateTime('SET_DAY', Number(customDayInput))}
                  className="h-10 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                >
                  {simulatingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Áp Dụng</span>
                </button>
              </div>

              {/* Slider kéo thả nhanh theo đúng chu kỳ cây */}
              <div className="pt-1 space-y-1">
                <input
                  type="range"
                  min="1"
                  max={simulatingPlot.activeRental?.totalDays || 45}
                  value={Math.min(Number(simulatingPlot.activeRental?.totalDays || 45), Math.max(1, Number(customDayInput || 1)))}
                  onChange={(e) => setCustomDayInput(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-stone-500 font-medium px-0.5">
                  <span>Ngày 1 (Gieo mầm)</span>
                  <span>Ngày {Math.round((simulatingPlot.activeRental?.totalDays || 45) / 2)} (Phát triển)</span>
                  <span>Ngày {simulatingPlot.activeRental?.totalDays || 45} (Thu hoạch)</span>
                </div>
              </div>
            </div>

            {/* Các mốc nhảy nhanh thích ứng động theo đúng chu kỳ giống cây đó */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                Mốc gợi ý nhanh theo chu kỳ giống cây này:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  disabled={simulatingLoading}
                  onClick={() => handleSimulateTime('SET_DAY', 1)}
                  className="py-2 px-2.5 rounded-lg border border-stone-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 transition text-center cursor-pointer text-xs font-bold text-stone-800 shadow-2xs"
                >
                  🌱 Ngày 1 (Bắt đầu)
                </button>

                <button
                  type="button"
                  disabled={simulatingLoading}
                  onClick={() => handleSimulateTime('SET_DAY', Math.round((simulatingPlot.activeRental?.totalDays || 45) / 2))}
                  className="py-2 px-2.5 rounded-lg border border-stone-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition text-center cursor-pointer text-xs font-bold text-stone-800 shadow-2xs"
                >
                  🌿 Ngày {Math.round((simulatingPlot.activeRental?.totalDays || 45) / 2)} (Giữa vụ)
                </button>

                <button
                  type="button"
                  disabled={simulatingLoading}
                  onClick={() => handleSimulateTime('SET_DAY', simulatingPlot.activeRental?.totalDays || 45)}
                  className="py-2 px-2.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 transition text-center cursor-pointer text-xs font-bold text-amber-900 shadow-2xs"
                >
                  🌾 Ngày {simulatingPlot.activeRental?.totalDays || 45} (Thu hoạch)
                </button>

                <button
                  type="button"
                  disabled={simulatingLoading}
                  onClick={() => handleSimulateTime('ADD_DAYS', 7)}
                  className="py-2 px-2.5 rounded-lg border border-stone-200 bg-white hover:bg-purple-50 hover:border-purple-300 transition text-center cursor-pointer text-xs font-bold text-stone-800 shadow-2xs"
                >
                  ⏩ +7 Ngày
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-stone-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSimulatingPlot(null); setSimFeedback(''); }}
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
