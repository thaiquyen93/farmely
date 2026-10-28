import React, { useState, useEffect } from 'react';
import { compatibilityData as initialRules } from '../../data/compatibility';
import { farmApi } from '../../api/farm/farmApi';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Select from '../../components/common/Select';
import { clearCompatibilityCache } from '../../utils/leaseSelection';
import { SlidersHorizontal, Plus, CheckCircle2, XCircle, AlertTriangle, Layers, Trash2, Sprout, Filter } from 'lucide-react';

export default function Compatibility() {
  const [rules, setRules] = useState(initialRules);
  const [loading, setLoading] = useState(true);
  const [isLiveDb, setIsLiveDb] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [showModal, setShowModal] = useState(false);
  const [dbPlots, setDbPlots] = useState([]);
  const [allVarieties, setAllVarieties] = useState([]);

  // Form State
  const [plotId, setPlotId] = useState('1');
  const [selectedVarietyIds, setSelectedVarietyIds] = useState([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRules = () => {
    fetch('/api/compatibility')
      .then((res) => res.json())
      .then((res) => {
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const normalized = res.data.map((r, idx) => ({
            id: `COMP-${idx + 1}`,
            plotId: String(r.plotId),
            plotCode: r.plotCode,
            plotName: `Thửa ${r.plotCode} (${r.landName || 'Trang trại Happy Valley'})`,
            soilType: 'Đất phù sa / đất thịt nhẹ chuẩn VietGAP',
            varietyId: Number(r.varietyId),
            varietyName: r.varietyName,
            cropName: r.cropName,
            status: r.status || 'COMPATIBLE',
            notes: r.notes || 'Thổ nhưỡng và điều kiện vi khí hậu đạt chuẩn chứng nhận VietGAP.',
            updatedBy: 'Hội đồng Nông học Farmely',
            updatedDate: '2026-10-12'
          }));
          setRules(normalized);
          setIsLiveDb(true);
        }
      })
      .catch((err) => {
        console.warn('Cannot fetch live compatibility, fallback to mock:', err);
      });
  };

  const loadVarieties = () => {
    fetch('/api/varieties')
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.data || []);
        if (list.length > 0) {
          setAllVarieties(list);
          if (list[0]) {
            setSelectedVarietyIds([Number(list[0].id)]);
          }
        }
      })
      .catch((err) => console.warn('Không thể nạp danh sách giống cây:', err));
  };

  useEffect(() => {
    let active = true;
    farmApi.listPlots()
      .then((rows) => {
        if (!active) return;
        setDbPlots(rows || []);
        if (rows && rows.length > 0) {
          setPlotId(String(rows[0].plotId));
        }
      })
      .catch((err) => console.warn('Không thể nạp danh sách thửa đất:', err));

    loadRules();
    loadVarieties();
    setLoading(false);

    return () => { active = false; };
  }, []);

  // Các giống cây ĐÃ tương thích với thửa đất đang chọn
  const assignedVarietyIdsForSelectedPlot = React.useMemo(() => {
    return rules
      .filter((r) => String(r.plotId) === String(plotId))
      .map((r) => Number(r.varietyId));
  }, [rules, plotId]);

  const handleToggleVarietySelection = (vId) => {
    const numId = Number(vId);
    setSelectedVarietyIds((prev) =>
      prev.includes(numId) ? prev.filter((id) => id !== numId) : [...prev, numId]
    );
  };

  const handleSelectAllUnassigned = () => {
    const unassigned = allVarieties
      .map((v) => Number(v.id))
      .filter((id) => !assignedVarietyIdsForSelectedPlot.includes(id));
    setSelectedVarietyIds(unassigned);
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    if (!plotId || selectedVarietyIds.length === 0) {
      alert('Vui lòng chọn ít nhất một giống cây trồng!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plotId: parseInt(plotId, 10),
          varietyIds: selectedVarietyIds
        })
      });
      const data = await res.json();
      if (data.success) {
        clearCompatibilityCache();
        loadRules();
        setShowModal(false);
        setSelectedVarietyIds([]);
      } else {
        alert(data.error || 'Có lỗi xảy ra khi lưu quy tắc');
      }
    } catch (err) {
      console.error('Lỗi khi lưu quy tắc tương thích:', err);
      alert('Không thể kết nối đến máy chủ để lưu quy tắc.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (pId, vId, vName, pCode) => {
    if (!window.confirm(`Bạn có chắc chắn muốn gỡ giống "${vName}" khỏi thửa ${pCode}? Khách hàng sẽ không thể chọn giống này khi thuê thửa.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/compatibility/${pId}/${vId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        clearCompatibilityCache();
        loadRules();
      } else {
        alert(data.error || 'Có lỗi xảy ra khi xóa quy tắc');
      }
    } catch (err) {
      console.error('Lỗi khi xóa quy tắc:', err);
      alert('Không thể kết nối đến máy chủ để xóa quy tắc.');
    }
  };

  const columns = [
    {
      header: 'Thửa Đất',
      key: 'plotName',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-black bg-brand-dark text-brand-yellow px-1.5 py-0.5 rounded">
            {row.plotCode}
          </span>
          <p className="font-bold text-brand-dark text-xs mt-1">{row.plotName}</p>
          <p className="text-[11px] text-brand-muted truncate max-w-xs">{row.soilType}</p>
        </div>
      )
    },
    {
      header: 'Giống Cây Trồng',
      key: 'varietyName',
      sortable: true,
      render: (row) => (
        <div>
          <span className="text-[10px] text-brand-green font-bold uppercase">{row.cropName}</span>
          <p className="font-bold text-brand-dark text-xs">{row.varietyName}</p>
        </div>
      )
    },
    {
      header: 'Trạng Thái Tương Thích',
      key: 'status',
      sortable: true,
      render: (row) => (
        <Badge variant={row.status} size="sm">
          {row.status === 'COMPATIBLE'
            ? '✓ Phù hợp canh tác'
            : row.status === 'NOT_COMPATIBLE'
            ? '✕ Không phù hợp'
            : '⚠ Cần đánh giá thêm'}
        </Badge>
      )
    },
    {
      header: 'Giải Thích & Cơ Sở Kỹ Thuật',
      key: 'notes',
      render: (row) => (
        <span className="text-xs text-stone-600 line-clamp-2 max-w-md block">
          {row.notes}
        </span>
      )
    },
    {
      header: 'Người Duyệt & Ngày',
      key: 'updatedBy',
      render: (row) => (
        <span className="text-[11px] text-brand-muted block">
          {row.updatedBy} <br />
          {row.updatedDate}
        </span>
      )
    },
    {
      header: 'Thao Tác',
      key: 'actions',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleDeleteRule(row.plotId, row.varietyId, row.varietyName, row.plotCode)}
          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          title={`Gỡ giống ${row.varietyName} khỏi thửa ${row.plotCode}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  // Group rules by plot for the visual Cards View
  const plotsWithRules = dbPlots.map((plot) => {
    const plotRules = rules.filter((r) => String(r.plotId) === String(plot.plotId) || r.plotCode === plot.plotCode);
    return {
      plot: {
        id: String(plot.plotId),
        code: plot.plotCode,
        name: `Thửa đất ${plot.plotCode}`,
        soilType: 'Đất phù sa bồi lắng giàu mùn chuẩn VietGAP',
        landName: plot.landName || 'Happy Valley Củ Chi',
        status: plot.status
      },
      rules: plotRules
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-green uppercase tracking-wider">
              Thực thể: PlotVarietyCompatibility (Tương Thích Thổ Nhưỡng)
            </span>
            {isLiveDb && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live DB: {rules.length} Quy tắc ({allVarieties.length} Giống cây)</span>
              </span>
            )}
          </div>
          <h2 className="text-2xl font-heading font-black text-brand-dark mt-1">
            Tương Thích Thổ Nhưỡng – Giống Cây
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Xác lập quy tắc bắt buộc (BR03): Khách hàng chỉ được gieo trồng giống cây đã được kiểm định tương thích với đất của thửa.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex rounded-xl bg-white border border-brand-border p-1 text-xs">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'cards' ? 'bg-brand-green text-white shadow-sm' : 'text-stone-600 hover:text-brand-dark'
              }`}
            >
              Giao Diện Thẻ Lô Đất
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-brand-green text-white shadow-sm' : 'text-stone-600 hover:text-brand-dark'
              }`}
            >
              Bảng Dữ Liệu Chi Tiết
            </button>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => {
              setSelectedVarietyIds([]);
              setShowModal(true);
            }}
          >
            Thêm Quy Tắc Mới
          </Button>
        </div>
      </div>

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plotsWithRules.map(({ plot, rules: pRules }) => (
            <div key={plot.id} className="admin-card p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
                  <div>
                    <span className="font-mono text-xs font-black bg-brand-dark text-brand-yellow px-2 py-0.5 rounded">
                      {plot.code}
                    </span>
                    <h3 className="font-heading text-base font-bold text-brand-dark mt-1">
                      {plot.name}
                    </h3>
                  </div>
                  <Badge variant={plot.status} size="sm">{plot.status}</Badge>
                </div>

                <div className="py-2.5 text-xs text-stone-600">
                  <span className="text-[10px] font-bold text-brand-muted uppercase block">Đặc điểm thổ nhưỡng:</span>
                  <p className="font-semibold text-brand-dark truncate">{plot.soilType}</p>
                </div>

                {/* Compatibility Checklist */}
                <div className="space-y-2 pt-2 border-t border-brand-border/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block">
                      Giống Cây Đã Thẩm Định ({pRules.length}):
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {pRules.length}/{allVarieties.length} giống
                    </span>
                  </div>
                  {pRules.length === 0 ? (
                    <p className="text-xs text-stone-400 italic py-2">Chưa cấu hình quy tắc tương thích</p>
                  ) : (
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {pRules.map((rule) => (
                        <div
                          key={rule.id}
                          className="p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2.5 bg-emerald-50/60 border-emerald-200 text-emerald-950 group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div className="truncate">
                              <p className="font-bold truncate">{rule.varietyName}</p>
                              <span className="text-[10px] text-emerald-700 block">{rule.cropName}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteRule(rule.plotId, rule.varietyId, rule.varietyName, rule.plotCode)}
                            className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                            title="Gỡ giống cây này khỏi thửa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-brand-border/60 text-right">
                <button
                  type="button"
                  onClick={() => {
                    setPlotId(plot.id);
                    setSelectedVarietyIds([]);
                    setShowModal(true);
                  }}
                  className="text-xs font-bold text-brand-green hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Gán thêm giống cho thửa {plot.code}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <DataTable
          columns={columns}
          data={rules}
          searchPlaceholder="Tìm kiếm theo thửa đất, giống cây..."
        />
      )}

      {/* Modal Add Rule */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Thêm Quy Tắc Tương Thích Thổ Nhưỡng Mới"
        subtitle="Ràng buộc giống cây VietGAP phù hợp với điều kiện đất của thửa"
      >
        <form onSubmit={handleCreateRule} className="space-y-4">
          <Select
            label="Chọn Thửa Đất Cần Thiết Lập *"
            required
            value={plotId}
            onChange={(e) => {
              setPlotId(e.target.value);
              setSelectedVarietyIds([]);
            }}
            options={dbPlots.map((p) => ({
              value: String(p.plotId),
              label: `${p.plotCode} - Thửa đất ${p.plotCode} (${p.landName || 'Happy Valley Củ Chi'})`
            }))}
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">
                Chọn Giống Cây Trồng (Toàn bộ {allVarieties.length} giống trong hệ thống) *
              </label>
              <button
                type="button"
                onClick={handleSelectAllUnassigned}
                className="text-[11px] font-bold text-brand-green hover:underline cursor-pointer"
              >
                + Chọn tất cả giống chưa gán
              </button>
            </div>

            <p className="text-[11px] text-stone-500 mb-2">
              Bấm chọn một hoặc nhiều giống cây trồng phù hợp với loại đất của thửa này:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-brand-border rounded-xl bg-stone-50/50">
              {allVarieties.map((v) => {
                const numId = Number(v.id);
                const isAssigned = assignedVarietyIdsForSelectedPlot.includes(numId);
                const isSelected = selectedVarietyIds.includes(numId);

                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={isAssigned}
                    onClick={() => handleToggleVarietySelection(v.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-start justify-between gap-2 transition-all ${
                      isAssigned
                        ? 'bg-stone-100 border-stone-200 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'bg-emerald-50 border-brand-green ring-2 ring-brand-green/20 text-brand-dark cursor-pointer shadow-xs'
                        : 'bg-white border-brand-border hover:border-brand-green/50 text-stone-700 cursor-pointer'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate">{v.name}</p>
                      <span className="text-[10px] text-stone-500 block truncate">{v.cropName}</span>
                    </div>

                    <div className="shrink-0 mt-0.5">
                      {isAssigned ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-stone-200 text-stone-600">
                          Đã gán
                        </span>
                      ) : isSelected ? (
                        <span className="w-4 h-4 rounded bg-brand-green text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      ) : (
                        <span className="w-4 h-4 rounded border border-stone-300 bg-white block"></span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-500 mt-2 px-1">
              <span>Đang chọn: <strong>{selectedVarietyIds.length}</strong> giống</span>
              <span>Đã có trên thửa: <strong>{assignedVarietyIdsForSelectedPlot.length}</strong> giống</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-1.5">
              Cơ Sở Nông Học & Ghi Chú Phê Duyệt
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Thổ nhưỡng đất phù sa, pH 6.0 - 6.8, thoát nước tốt, phù hợp chuẩn canh tác VietGAP..."
              className="w-full rounded-xl border border-brand-border bg-white px-3.5 py-2 text-xs text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-brand-border">
            <Button variant="outline" size="sm" type="button" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={isSubmitting || selectedVarietyIds.length === 0}
            >
              {isSubmitting ? 'Đang lưu...' : `Lưu Quy Tắc (${selectedVarietyIds.length} giống)`}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
