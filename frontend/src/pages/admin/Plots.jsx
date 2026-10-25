import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { farmApi } from '../../api/farm/farmApi';
import { formatArea, cleanRing } from '../../utils/polygonGeometry';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import {
  Plus, Edit, Trash2, Loader2, PenLine, Map as MapIcon, MapPin,
  Layers, AlertTriangle, CheckCircle2, ChevronRight, X
} from 'lucide-react';

const STATUS_OPTIONS = {
  AVAIL: 'AVAILABLE (Đang trống)',
  RENT: 'RENTED (Đã thuê)',
  MAINT: 'MAINTENANCE (Bảo trì)'
};

export default function Plots() {
  const [plots, setPlots] = useState([]);
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Lọc & Gom nhóm theo khu nông trại
  const [selectedLandId, setSelectedLandId] = useState('ALL');
  const [isGroupedByLand, setIsGroupedByLand] = useState(false);

  // Pop-up xác nhận đổi trạng thái
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    plot: null,
    oldStatus: '',
    newStatus: ''
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Pop-up xác nhận xóa thửa đất
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    plot: null
  });
  const [deletingPlot, setDeletingPlot] = useState(false);

  // Thông báo toast thành công
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  const load = useCallback(() => {
    setLoading(true);
    setLoadError('');
    Promise.allSettled([farmApi.listLands(), farmApi.listPlots()])
      .then(([landsRes, plotsRes]) => {
        if (landsRes.status === 'fulfilled' && Array.isArray(landsRes.value)) {
          setLands(landsRes.value);
        }
        if (plotsRes.status === 'fulfilled' && Array.isArray(plotsRes.value)) {
          const rows = plotsRes.value;
          setPlots(
            rows.map((p) => {
              const ringLen = cleanRing(p.boundary).length;
              return {
                id: p.plotId,
                code: p.plotCode,
                name: p.plotCode,
                landId: p.landId,
                landName: p.landName || 'Trang trại Happy Valley Củ Chi',
                areaNum: Number(p.area) || 0,
                area: formatArea(Number(p.area)),
                rentalPrice: Number(p.pricePerPeriod) || 0,
                formattedPrice: `${Number(p.pricePerPeriod || 0).toLocaleString('vi-VN')} đ`,
                drawn: ringLen >= 3,
                corners: ringLen,
                status: p.status || 'AVAIL',
                isPublished: p.isPublished,
                imageUrl: p.imageUrl
              };
            })
          );
        }
      })
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    try {
      localStorage.removeItem('farmely_recently_booked_plots');
    } catch {}
    load();

    // Lắng nghe đồng bộ tự động từ Marketplace & Booking ở các tab khác
    const handleSync = () => load();
    window.addEventListener('farmely_plot_booked', handleSync);
    window.addEventListener('storage', handleSync);

    let bc = null;
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        bc = new BroadcastChannel('farmely_plot_updates');
        bc.onmessage = (msg) => {
          // Chỉ reload khi nhận broadcast từ tab khác
          load();
        };
      }
    } catch {}

    return () => {
      window.removeEventListener('farmely_plot_booked', handleSync);
      window.removeEventListener('storage', handleSync);
      if (bc) {
        try {
          bc.close();
        } catch {}
      }
    };
  }, [load]);

  // Khi click thay đổi trạng thái trên dropdown: Mở modal xác nhận
  const requestStatusChange = (row, newStatus) => {
    if (row.status === newStatus) return;
    setStatusModal({
      isOpen: true,
      plot: row,
      oldStatus: row.status,
      newStatus
    });
  };

  // Xác nhận đổi trạng thái
  const executeStatusChange = async () => {
    const { plot, newStatus } = statusModal;
    if (!plot) return;
    setUpdatingStatus(true);
    try {
      await farmApi.updatePlotStatus(plot.id, newStatus);

      // Cập nhật state nội bộ ngay lập tức
      setPlots((prev) =>
        prev.map((p) => (p.id === plot.id ? { ...p, status: newStatus } : p))
      );

      // Dọn sạch danh sách recently_booked nếu có
      try {
        localStorage.removeItem('farmely_recently_booked_plots');
      } catch {}

      // Đồng bộ ngay lập tức sang Marketplace
      window.dispatchEvent(
        new CustomEvent('farmely_plot_status_changed', {
          detail: { id: plot.id, code: plot.code, status: newStatus }
        })
      );
      window.dispatchEvent(new Event('farmely_plot_booked'));

      try {
        const bc = new BroadcastChannel('farmely_plot_updates');
        bc.postMessage({
          type: 'PLOT_STATUS_UPDATED',
          id: plot.id,
          code: plot.code,
          status: newStatus
        });
        bc.close();
      } catch {}

      showToast(
        `✓ Đã cập nhật trạng thái thửa ${plot.code} thành ${STATUS_OPTIONS[newStatus] || newStatus} và đồng bộ với Marketplace.`
      );
      setStatusModal({ isOpen: false, plot: null, oldStatus: '', newStatus: '' });
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Khi click icon xóa: Mở modal xác nhận xóa
  const requestDeletePlot = (row) => {
    setDeleteModal({
      isOpen: true,
      plot: row
    });
  };

  // Xác nhận xóa thửa đất
  const executeDeletePlot = async () => {
    const { plot } = deleteModal;
    if (!plot) return;
    setDeletingPlot(true);
    try {
      await farmApi.deletePlot(plot.id);
      setPlots((prev) => prev.filter((x) => x.id !== plot.id));

      // Đồng bộ ngay sang Marketplace
      window.dispatchEvent(
        new CustomEvent('farmely_plot_status_changed', {
          detail: { id: plot.id, code: plot.code, status: 'DELETED' }
        })
      );
      window.dispatchEvent(new Event('farmely_plot_booked'));

      try {
        const bc = new BroadcastChannel('farmely_plot_updates');
        bc.postMessage({
          type: 'PLOT_DELETED',
          id: plot.id,
          code: plot.code
        });
        bc.close();
      } catch {}

      showToast(`✓ Đã xóa thửa đất ${plot.code} khỏi hệ thống và Marketplace.`);
      setDeleteModal({ isOpen: false, plot: null });
    } catch (e) {
      setDeleteModal({ isOpen: false, plot: null });
      setLoadError(e.message);
    } finally {
      setDeletingPlot(false);
    }
  };

  // Danh sách thửa đã lọc theo Khu nông trại
  const filteredPlots = useMemo(() => {
    if (selectedLandId === 'ALL') return plots;
    return plots.filter((p) => String(p.landId) === String(selectedLandId));
  }, [plots, selectedLandId]);

  // Gom nhóm danh sách thửa đất theo từng Khu nông trại (Land)
  const groupedLands = useMemo(() => {
    const map = new Map();
    filteredPlots.forEach((p) => {
      const lid = p.landId || 1;
      if (!map.has(lid)) {
        const landMeta = lands.find((l) => String(l.landId || l.id) === String(lid));
        map.set(lid, {
          landId: lid,
          landName: p.landName || landMeta?.landName || `Khu nông trại #${lid}`,
          address: landMeta?.address || 'Củ Chi, TP. Hồ Chí Minh',
          plots: []
        });
      }
      map.get(lid).plots.push(p);
    });
    return Array.from(map.values());
  }, [filteredPlots, lands]);

  // Cấu hình cột hiển thị
  const columns = [
    {
      header: 'Mã & Tên Thửa Đất',
      key: 'name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.imageUrl ? (
            <img
              src={row.imageUrl}
              alt=""
              className="w-12 h-12 rounded-xl object-cover border border-brand-border"
            />
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand-border bg-brand-cream text-brand-green">
              <MapIcon className="h-5 w-5" />
            </span>
          )}
          <div>
            <span className="text-[11px] font-black font-mono text-brand-yellow bg-brand-dark px-1.5 py-0.5 rounded">
              {row.code}
            </span>
            <span className="block text-xs text-stone-500 mt-0.5">
              {row.isPublished ? 'Đang niêm yết Marketplace' : 'Chưa niêm yết'}
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
        <Link
          to={`/admin/master-data/lands/${row.landId}`}
          className="text-xs text-stone-700 font-medium hover:text-brand-green flex items-center gap-1"
        >
          <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span>{row.landName}</span>
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
      render: (row) =>
        row.drawn ? (
          <span className="text-xs font-semibold text-emerald-700">Đã vẽ · {row.corners} góc</span>
        ) : (
          <span className="text-xs text-stone-400">Chưa vẽ</span>
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
      header: 'Trạng Thái',
      key: 'status',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <select
            value={row.status || 'AVAIL'}
            onChange={(e) => requestStatusChange(row, e.target.value)}
            className={`rounded-lg border px-2.5 py-1 text-xs font-bold shadow-xs transition-colors cursor-pointer outline-none ${
              row.status === 'RENT'
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                : row.status === 'MAINT'
                ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
            }`}
            title="Nhấp để thay đổi trạng thái (sẽ hiển thị pop-up xác nhận)"
          >
            <option value="AVAIL">AVAILABLE (Đang trống)</option>
            <option value="RENT">RENTED (Đã thuê)</option>
            <option value="MAINT">MAINTENANCE (Bảo trì)</option>
          </select>
        </div>
      )
    },
    {
      header: 'Thao Tác',
      key: 'actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Link
            to={`/admin/master-data/plots/create?editId=${row.id}`}
            className="p-1.5 text-stone-500 hover:text-amber-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            title={row.drawn ? 'Chỉnh sửa' : 'Vẽ ranh giới'}
          >
            {row.drawn ? <Edit className="w-4 h-4" /> : <PenLine className="w-4 h-4" />}
          </Link>
          <button
            type="button"
            onClick={() => requestDeletePlot(row)}
            className="p-1.5 text-stone-500 hover:text-rose-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            title="Xóa thửa đất (hiển thị pop-up xác nhận)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Tiêu đề & Nút Thêm Mới */}
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

      {/* Thông báo Toast */}
      {toastMessage && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="text-stone-400 hover:text-stone-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Thông báo lỗi nếu có */}
      {loadError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          <span>{loadError}</span>
          <button type="button" onClick={load} className="shrink-0 font-semibold underline">
            Tải lại
          </button>
        </div>
      )}

      {/* BỘ LỌC & NÚT GOM / CHỌN KHU NÔNG TRẠI (YÊU CẦU HÌNH 3) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-brand-border/80 shadow-2xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* 1. Chọn khu nông trại */}
          <div className="inline-flex items-center gap-2 text-xs font-bold text-stone-700 bg-stone-50 px-3 py-2 rounded-xl border border-stone-200">
            <MapPin className="w-4 h-4 text-brand-green shrink-0" />
            <span className="text-stone-500 font-medium">Chọn khu:</span>
            <select
              value={selectedLandId}
              onChange={(e) => setSelectedLandId(e.target.value)}
              className="bg-transparent font-bold text-brand-dark cursor-pointer outline-none border-b border-dashed border-stone-300 pb-0.5 focus:border-brand-green"
            >
              <option value="ALL">Tất cả khu nông trại ({plots.length} thửa)</option>
              {lands.map((l) => {
                const lId = String(l.landId || l.id);
                const count = plots.filter((p) => String(p.landId) === lId).length;
                return (
                  <option key={lId} value={lId}>
                    {l.landName || l.name} ({count} thửa)
                  </option>
                );
              })}
            </select>
          </div>

          {/* 2. Nút gom nhóm theo khu nông trại */}
          <button
            type="button"
            onClick={() => setIsGroupedByLand((v) => !v)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs border ${
              isGroupedByLand
                ? 'bg-brand-green text-white border-brand-green shadow-xs ring-2 ring-brand-green/20'
                : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
            }`}
            title="Bật/Tắt gom nhóm bảng hiển thị theo từng khu nông trại"
          >
            <Layers className={`w-4 h-4 ${isGroupedByLand ? 'text-brand-yellow' : 'text-stone-500'}`} />
            <span>Gom nhóm theo nông trại</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                isGroupedByLand ? 'bg-white/20 text-white font-bold' : 'bg-stone-200 text-stone-600'
              }`}
            >
              {isGroupedByLand ? 'BẬT' : 'TẮT'}
            </span>
          </button>
        </div>

        {/* Số lượng đang hiển thị */}
        <div className="flex items-center gap-3 text-xs text-stone-500 self-end sm:self-auto">
          <span>
            Đang hiển thị <strong>{filteredPlots.length}</strong> / {plots.length} thửa đất
          </span>
          {selectedLandId !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedLandId('ALL')}
              className="text-brand-green font-bold hover:underline cursor-pointer"
            >
              Xem tất cả
            </button>
          )}
        </div>
      </div>

      {/* NỘI DUNG BẢNG THỬA ĐẤT */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-stone-500">
          <Loader2 className="h-5 w-5 animate-spin text-brand-green" />
          <span>Đang tải danh sách thửa đất từ database...</span>
        </div>
      ) : isGroupedByLand ? (
        /* CHẾ ĐỘ GOM NHÓM THEO TỪNG KHU NÔNG TRẠI */
        <div className="space-y-6 animate-fadeIn">
          {groupedLands.map((group) => {
            const totalArea = group.plots.reduce((acc, p) => acc + (p.areaNum || 0), 0);
            return (
              <div
                key={group.landId}
                className="bg-white rounded-3xl border border-brand-border/80 shadow-xs overflow-hidden"
              >
                {/* Header nhóm Nông trại */}
                <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xs text-brand-yellow border border-white/20">
                      <MapPin className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-heading font-bold text-lg text-white">
                        {group.landName}
                      </h3>
                      <p className="text-xs text-emerald-200/85 mt-0.5">{group.address}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-xs">
                      {group.plots.length} thửa đất
                    </span>
                    <span className="rounded-full bg-brand-yellow/90 px-3 py-1 text-xs font-black text-brand-dark">
                      {totalArea.toLocaleString('vi-VN')} m²
                    </span>
                  </div>
                </div>

                {/* Bảng các thửa đất trong nhóm */}
                <DataTable
                  columns={columns}
                  data={group.plots}
                  searchPlaceholder={`Tìm theo mã thửa trong ${group.landName}...`}
                  searchField="code"
                />
              </div>
            );
          })}
        </div>
      ) : (
        /* CHẾ ĐỘ DANH SÁCH CHUẨN ĐÃ LỌC */
        <DataTable
          columns={columns}
          data={filteredPlots}
          searchPlaceholder="Tìm theo mã thửa..."
          searchField="code"
        />
      )}

      {/* POP-UP 1: XÁC NHẬN ĐỔI TRẠNG THÁI THỬA ĐẤT (ĐỒNG BỘ MARKETPLACE) */}
      {statusModal.isOpen && statusModal.plot && (
        <Modal
          isOpen={statusModal.isOpen}
          onClose={() =>
            setStatusModal({ isOpen: false, plot: null, oldStatus: '', newStatus: '' })
          }
          title="Xác nhận thay đổi trạng thái thửa đất"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0 mt-0.5 border border-amber-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-2.5 text-sm text-brand-dark leading-relaxed">
                <p>
                  Bạn có chắc chắn muốn thay đổi trạng thái của thửa đất{' '}
                  <strong className="font-mono text-brand-green bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {statusModal.plot.code}
                  </strong>{' '}
                  thuộc khu <strong>{statusModal.plot.landName}</strong>?
                </p>

                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500 font-medium">Trạng thái hiện tại:</span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold ${
                        statusModal.oldStatus === 'RENT'
                          ? 'bg-amber-100 text-amber-800'
                          : statusModal.oldStatus === 'MAINT'
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {STATUS_OPTIONS[statusModal.oldStatus] || statusModal.oldStatus}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-stone-200/70 pt-2">
                    <span className="text-stone-500 font-medium">Trạng thái mới:</span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold ${
                        statusModal.newStatus === 'RENT'
                          ? 'bg-amber-100 text-amber-800'
                          : statusModal.newStatus === 'MAINT'
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {STATUS_OPTIONS[statusModal.newStatus] || statusModal.newStatus}
                    </span>
                  </div>
                </div>

                <div className="text-[12px] text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse mt-1 shrink-0" />
                  <span>
                    Trạng thái mới này sẽ được đồng bộ <strong>ngay lập tức sang Marketplace</strong>{' '}
                    cho khách hàng xem và thuê đất.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-brand-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setStatusModal({ isOpen: false, plot: null, oldStatus: '', newStatus: '' })
                }
                disabled={updatingStatus}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={executeStatusChange}
                loading={updatingStatus}
              >
                Xác nhận cập nhật
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* POP-UP 2: XÁC NHẬN XÓA THỬA ĐẤT */}
      {deleteModal.isOpen && deleteModal.plot && (
        <Modal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, plot: null })}
          title="Xác nhận xóa thửa đất"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 shrink-0 mt-0.5 border border-rose-200">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-2.5 text-sm text-brand-dark leading-relaxed">
                <p>
                  Bạn có chắc chắn muốn xóa thửa đất{' '}
                  <strong className="font-mono text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                    {deleteModal.plot.code}
                  </strong>{' '}
                  thuộc khu <strong>{deleteModal.plot.landName}</strong> khỏi hệ thống?
                </p>
                <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200 text-xs text-rose-800 font-medium leading-relaxed">
                  ⚠ <strong>Lưu ý quan trọng:</strong> Hành động này sẽ gỡ bỏ thửa đất hoàn toàn
                  khỏi Marketplace và cơ sở dữ liệu. Thao tác này không thể hoàn tác!
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-brand-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteModal({ isOpen: false, plot: null })}
                disabled={deletingPlot}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={executeDeletePlot}
                loading={deletingPlot}
              >
                Xác nhận xóa
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
