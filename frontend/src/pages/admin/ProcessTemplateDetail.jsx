import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { processTemplatesData } from '../../data/processTemplates';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import {
  ArrowLeft,
  FileSpreadsheet,
  Clock,
  Sprout,
  CheckCircle2,
  Calendar,
  Layers,
  Wrench,
  Package,
  Plus
} from 'lucide-react';

export default function ProcessTemplateDetail() {
  const { id } = useParams();
  const template = processTemplatesData.find((t) => t.id === id) || processTemplatesData[0];

  return (
    <div className="space-y-8">
      {/* Back and Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/master-data/process-templates"
            className="p-2 text-stone-500 hover:text-brand-dark hover:bg-stone-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black bg-brand-dark text-brand-yellow px-2 py-0.5 rounded">
                {template.version}
              </span>
              <Badge variant={template.status} size="sm">{template.status}</Badge>
            </div>
            <h2 className="text-2xl font-heading font-black text-brand-dark mt-1">
              {template.name}
            </h2>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => alert('Thêm bước kỹ thuật mới vào quy trình')}
        >
          Thêm Bước Kỹ Thuật (Day Offset)
        </Button>
      </div>

      {/* Template Overview Card */}
      <div className="bg-white rounded-2xl p-6 border border-brand-border shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-border/60 pb-3">
          <div>
            <span className="text-xs font-bold text-brand-green uppercase tracking-wider block">
              Giống cây áp dụng: {template.varietyName} ({template.cropName})
            </span>
            <p className="text-xs text-stone-500 mt-0.5">
              Ban hành bởi: <strong>{template.author}</strong> • Ngày: {template.createdDate}
            </p>
          </div>
          <span className="text-xs font-bold text-brand-dark bg-brand-cream px-3 py-1.5 rounded-xl border border-brand-border">
            Tổng cộng {template.steps?.length || 0} mốc bước kỹ thuật
          </span>
        </div>

        <p className="text-sm text-stone-600 leading-relaxed">
          {template.description}
        </p>
      </div>

      {/* Vertical Agricultural Timeline Section (Section 19) */}
      <div className="space-y-6">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-green/10 text-brand-green uppercase tracking-wider">
            Lộ Trình Sinh Trưởng Theo Mốc Thời Gian (Day Offset)
          </span>
          <h3 className="text-2xl font-heading font-black text-brand-dark mt-1">
            Dòng Thời Gian Canh Tác Chuẩn Hóa
          </h3>
          <p className="text-xs text-brand-muted mt-0.5">
            Khi khách hàng kích hoạt hợp đồng Assisted-growing, hệ thống tự động sinh Care Task cho công nhân dựa trên số ngày tuổi kể từ Start Date.
          </p>
        </div>

        {/* The Vertical Agricultural Timeline Container */}
        <div className="relative pl-6 sm:pl-10 space-y-8 before:absolute before:left-3.5 sm:before:left-5 before:top-3 before:bottom-3 before:w-1 before:bg-brand-green/20 before:rounded-full">
          {template.steps?.map((step, idx) => (
            <div key={idx} className="relative group">
              {/* Timeline Marker Node */}
              <div className="absolute -left-6 sm:-left-10 top-1.5 w-8 h-8 rounded-full bg-white border-4 border-brand-green flex items-center justify-center font-heading font-black text-[11px] text-brand-dark shadow-sm group-hover:border-brand-yellow group-hover:scale-110 transition-all">
                {step.stepNumber}
              </div>

              {/* Step Card */}
              <div className="bg-white rounded-2xl p-6 border border-brand-border shadow-sm hover:shadow-md transition-all space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-border/40 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-xl bg-brand-yellow text-brand-dark font-heading font-black text-xs uppercase tracking-wider shadow-2xs">
                      NGÀY {step.dayOffset} (DAY {step.dayOffset})
                    </span>
                    <h4 className="font-heading text-base font-bold text-brand-dark">
                      {step.taskName}
                    </h4>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-brand-muted">
                    <span className="flex items-center gap-1 font-semibold text-stone-700">
                      <Clock className="w-3.5 h-3.5 text-brand-green" />
                      {step.durationMinutes} phút
                    </span>
                    <Badge variant={step.status} size="sm">
                      {step.status === 'COMPLETED' ? 'Đã nghiệm thu' : step.status === 'ACTIVE' ? 'Đang thực hiện' : 'Theo lịch trình'}
                    </Badge>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {step.description}
                </p>

                {/* Technical specifics & Materials */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-brand-cream/50 border border-brand-border/60 flex items-start gap-2.5">
                    <Wrench className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-brand-muted uppercase font-bold block">Phương pháp kỹ thuật:</span>
                      <span className="font-semibold text-brand-dark">{step.method}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-brand-cream/50 border border-brand-border/60 flex items-start gap-2.5">
                    <Package className="w-4 h-4 text-brand-yellow shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-brand-muted uppercase font-bold block">Định mức vật tư tiêu hao:</span>
                      <span className="font-semibold text-brand-dark">{step.materialsRequired}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px] text-brand-muted">
                  <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Yêu cầu tải tối thiểu 1 ảnh minh chứng thực địa khi hoàn tất (BR16)
                  </span>
                  <span className="text-stone-400">Tự động đồng bộ Farm Diary</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
