import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { varietiesData } from '../../data/varieties';
import { processTemplatesData } from '../../data/processTemplates';
import { knowledgeDocumentsData } from '../../data/knowledgeDocuments';
import { plotsData } from '../../data/plots';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import {
  ArrowLeft,
  Wheat,
  Clock,
  Sprout,
  Sun,
  Droplets,
  Thermometer,
  BookOpen,
  FileSpreadsheet,
  Grid3X3,
  Layers,
  CheckCircle2
} from 'lucide-react';

export default function VarietyDetail() {
  const { id } = useParams();
  const variety = varietiesData.find((v) => v.id === id) || varietiesData[0];

  const template = processTemplatesData.find((t) => t.varietyId === variety.id);
  const docs = knowledgeDocumentsData.filter((d) => d.varietyId === variety.id);
  const compatiblePlots = plotsData.filter((p) =>
    p.compatibleCrops.some((c) => variety.name.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(variety.name.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Back and Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/master-data/varieties"
            className="p-2 text-stone-500 hover:text-brand-dark hover:bg-stone-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-brand-green uppercase tracking-wider bg-brand-cream px-2 py-0.5 rounded border border-brand-border">
                {variety.cropName}
              </span>
              <Badge variant={variety.status} size="sm">{variety.status}</Badge>
            </div>
            <h2 className="text-2xl font-heading font-black text-brand-dark mt-0.5">
              {variety.name}
            </h2>
          </div>
        </div>
      </div>

      {/* Grid: Overview & Growing Characteristics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Overview - 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-brand-border shadow-sm space-y-4">
          <div className="flex items-start gap-4">
            <img
              src={variety.imageUrl}
              alt={variety.name}
              className="w-24 h-24 rounded-2xl object-cover border border-brand-border shrink-0"
            />
            <div>
              <h3 className="font-heading text-lg font-bold text-brand-dark">
                Mô Tả Sinh Học & Đặc Điểm Giống
              </h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                {variety.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-brand-border/60 text-xs">
            <div>
              <span className="text-brand-muted uppercase text-[10px] font-bold block">Thời gian sinh trưởng</span>
              <span className="font-bold text-brand-dark text-sm mt-0.5 block flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-brand-green" />
                {variety.growthDuration} ngày
              </span>
            </div>
            <div>
              <span className="text-brand-muted uppercase text-[10px] font-bold block">Thời gian đệm (Buffer)</span>
              <span className="font-bold text-brand-dark text-sm mt-0.5 block">+{variety.bufferTime} ngày (BR04)</span>
            </div>
            <div>
              <span className="text-brand-muted uppercase text-[10px] font-bold block">Năng suất kỳ vọng</span>
              <span className="font-bold text-brand-green text-sm mt-0.5 block">{variety.expectedYield}</span>
            </div>
          </div>
        </div>

        {/* Characteristics - 1 col */}
        <div className="bg-white rounded-2xl p-6 border border-brand-border shadow-sm space-y-3">
          <h3 className="font-heading text-base font-bold text-brand-dark">
            Điều Kiện Sinh Trưởng Tối Ưu
          </h3>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-brand-cream/50 flex items-center gap-2.5">
              <Sun className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{variety.growingCharacteristics?.lightRequirement}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-brand-cream/50 flex items-center gap-2.5">
              <Droplets className="w-4 h-4 text-sky-500 shrink-0" />
              <span>Ẩm độ đất mục tiêu: {variety.growingCharacteristics?.soilMoistureTarget}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-brand-cream/50 flex items-center gap-2.5">
              <Thermometer className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Nhiệt độ an toàn: {variety.growingCharacteristics?.temperatureRange}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Linked Process Template and Linked Knowledge Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Linked Process Template */}
        <div className="bg-white rounded-2xl p-6 border border-brand-border shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
            <h3 className="font-heading text-base font-bold text-brand-dark flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-brand-green" />
              Quy Trình Canh Tác Chuẩn VietGAP
            </h3>
            {template && <Badge variant={template.status} size="sm">{template.status}</Badge>}
          </div>

          {template ? (
            <div className="space-y-3">
              <p className="font-bold text-sm text-brand-dark">{template.name}</p>
              <p className="text-xs text-stone-600">{template.description}</p>
              <div className="flex items-center justify-between text-xs text-brand-muted pt-2 border-t border-brand-border/60">
                <span>Số bước kỹ thuật: <strong>{template.totalSteps} bước</strong></span>
                <Link
                  to={`/admin/master-data/process-templates/${template.id}`}
                  className="font-bold text-brand-green hover:underline"
                >
                  Xem quy trình chi tiết (Timeline) →
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50 text-amber-900 text-xs space-y-2 border border-amber-200">
              <p className="font-bold">Chưa có Quy Trình Chuẩn được gán!</p>
              <p>Cần bổ sung Standard Process Template cho giống cây này để phục vụ khách hàng thuê hình thức Assisted-growing.</p>
              <Link to="/admin/master-data/process-templates">
                <Button variant="primary" size="sm" className="mt-2 text-xs">
                  Thiết lập Template ngay
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Knowledge Documents */}
        <div className="bg-white rounded-2xl p-6 border border-brand-border shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
            <h3 className="font-heading text-base font-bold text-brand-dark flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-green" />
              Sổ Tay Kỹ Thuật (RAG AI Indexed)
            </h3>
            <span className="text-xs text-brand-muted">{docs.length} tài liệu</span>
          </div>

          <div className="space-y-2">
            {docs.map((d) => (
              <div key={d.id} className="p-3 rounded-xl bg-brand-cream/50 border border-brand-border text-xs flex items-center justify-between">
                <div>
                  <p className="font-bold text-brand-dark">{d.title}</p>
                  <p className="text-[11px] text-brand-muted">{d.author} • {d.fileSize}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-brand-green border border-brand-border">
                  {d.version}
                </span>
              </div>
            ))}
            {docs.length === 0 && (
              <p className="text-xs text-brand-muted italic">Chưa có tài liệu đính kèm cho giống cây này.</p>
            )}
          </div>
        </div>

      </div>

      {/* Compatible Plots List */}
      <div className="bg-white rounded-2xl p-6 border border-brand-border shadow-sm space-y-4">
        <h3 className="font-heading text-base font-bold text-brand-dark flex items-center gap-2">
          <Grid3X3 className="w-5 h-5 text-brand-green" />
          Các Thửa Đất Phù Hợp Canh Tác Giống Cây Này
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {compatiblePlots.map((p) => (
            <Link
              key={p.id}
              to={`/admin/master-data/plots/${p.id}`}
              className="p-3.5 rounded-xl bg-brand-cream/40 border border-brand-border hover:bg-brand-cream transition-colors flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-mono font-bold text-brand-green">{p.code}</span>
                <p className="font-bold text-brand-dark">{p.name}</p>
                <p className="text-[11px] text-stone-500">{p.landName}</p>
              </div>
              <Badge variant={p.status} size="sm">{p.status}</Badge>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
