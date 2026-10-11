import React, { useState } from 'react';
import { compatibilityData as initialRules } from '../../data/compatibility';
import { plotsData } from '../../data/plots';
import { varietiesData } from '../../data/varieties';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { SlidersHorizontal, Plus, CheckCircle2, XCircle, AlertTriangle, Layers, Edit } from 'lucide-react';

export default function Compatibility() {
  const [rules, setRules] = useState(initialRules);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [plotId, setPlotId] = useState('PLT-101');
  const [varietyId, setVarietyId] = useState('VAR-001');
  const [status, setStatus] = useState('COMPATIBLE');
  const [notes, setNotes] = useState('');

  const handleCreateRule = (e) => {
    e.preventDefault();
    const plotObj = plotsData.find((p) => p.id === plotId);
    const varObj = varietiesData.find((v) => v.id === varietyId);

    const newRule = {
      id: `COMP-00${rules.length + 1}`,
      plotId,
      plotCode: plotObj ? plotObj.code : 'P-101',
      plotName: plotObj ? plotObj.name : 'Thửa đất',
      soilType: plotObj ? plotObj.soilType : 'Đất phù sa',
      varietyId,
      varietyName: varObj ? varObj.name : 'Giống cây',
      cropName: varObj ? varObj.cropName : 'Rau ăn lá',
      status,
      notes: notes || 'Được chuyên gia phê duyệt tương thích kỹ thuật.',
      updatedBy: 'Admin / Chuyên Gia Nông Nghiệp',
      updatedDate: new Date().toISOString().split('T')[0]
    };

    setRules((prev) => [newRule, ...prev]);
    setShowModal(false);
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
      header: 'Giải Thích & Cơ Sở Kỹ Thuật (BR03)',
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
    }
  ];

  // Group rules by plot for the visual Cards View
  const plotsWithRules = plotsData.map((plot) => {
    const plotRules = rules.filter((r) => r.plotId === plot.id);
    return { plot, rules: plotRules };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-brand-green uppercase tracking-wider">
            Thực thể: PlotVarietyCompatibility (Ma Trận Sinh Học BR03)
          </span>
          <h2 className="text-2xl font-heading font-black text-brand-dark mt-1">
            Tương Thích Thổ Nhưỡng – Giống Cây
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Xác lập quy tắc bắt buộc: Khách hàng chỉ được gieo trồng giống cây đã được kiểm định tương thích với đất của thửa.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex rounded-xl bg-white border border-brand-border p-1 text-xs">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'cards' ? 'bg-brand-green text-white shadow-sm' : 'text-stone-600 hover:text-brand-dark'
              }`}
            >
              Giao Diện Thẻ Lô Đất
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'table' ? 'bg-brand-green text-white shadow-sm' : 'text-stone-600 hover:text-brand-dark'
              }`}
            >
              Bảng Dữ Liệu Chi Tiết
            </button>
          </div>

          <Button variant="primary" size="md" icon={Plus} onClick={() => setShowModal(true)}>
            Thêm Quy Tắc Mới
          </Button>
        </div>
      </div>

      {/* Cards View Inspired by Prompt */}
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
                  <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block">
                    Giống Cây Đã Thẩm Định:
                  </span>
                  {pRules.length === 0 ? (
                    <p className="text-xs text-stone-400 italic">Chưa cấu hình quy tắc</p>
                  ) : (
                    pRules.map((rule) => (
                      <div
                        key={rule.id}
                        className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                          rule.status === 'COMPATIBLE'
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                            : rule.status === 'NOT_COMPATIBLE'
                            ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                            : 'bg-amber-50/60 border-amber-200 text-amber-950'
                        }`}
                      >
                        {rule.status === 'COMPATIBLE' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        ) : rule.status === 'NOT_COMPATIBLE' ? (
                          <XCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{rule.varietyName}</p>
                          <p className="text-[11px] text-stone-600 line-clamp-1">{rule.notes}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-brand-border/60 text-right">
                <button
                  onClick={() => {
                    setPlotId(plot.id);
                    setShowModal(true);
                  }}
                  className="text-xs font-bold text-brand-green hover:underline"
                >
                  + Gán thêm giống cho thửa này
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
        subtitle="Ràng buộc giống cây và điều kiện đất canh tác (BR03)"
      >
        <form onSubmit={handleCreateRule} className="space-y-4">
          <Select
            label="Chọn Thửa Đất (Plot)"
            required
            value={plotId}
            onChange={(e) => setPlotId(e.target.value)}
            options={plotsData.map((p) => ({
              value: p.id,
              label: `${p.code} - ${p.name} (${p.soilType.split('(')[0]})`
            }))}
          />

          <Select
            label="Chọn Giống Cây Trồng (Variety)"
            required
            value={varietyId}
            onChange={(e) => setVarietyId(e.target.value)}
            options={varietiesData.map((v) => ({
              value: v.id,
              label: `${v.name} (${v.cropName})`
            }))}
          />

          <Select
            label="Trạng Thái Tương Thích Kỹ Thuật"
            required
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: 'COMPATIBLE', label: 'COMPATIBLE (Phù hợp canh tác tối ưu)' },
              { value: 'NOT_COMPATIBLE', label: 'NOT_COMPATIBLE (Không phù hợp - Nguy cơ sâu bệnh)' },
              { value: 'REVIEW_REQUIRED', label: 'REVIEW_REQUIRED (Cần chuyên gia kiểm tra pH)' }
            ]}
          />

          <div>
            <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-1.5">
              Giải Thích Cơ Sở Nông Học & Ghi Chú
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nêu rõ lý do nông học: pH đất, nhiệt độ vi khí hậu, khả năng thoát nước rãnh..."
              className="w-full rounded-xl border border-brand-border bg-white px-3.5 py-2 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-brand-border">
            <Button variant="outline" size="sm" type="button" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Lưu Quy Tắc
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
