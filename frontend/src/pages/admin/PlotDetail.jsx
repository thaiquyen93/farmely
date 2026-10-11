import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { plotsData } from '../../data/plots';
import { iotStationsData } from '../../data/iotStations';
import { varietiesData } from '../../data/varieties';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import {
  ArrowLeft,
  MapPin,
  Radio,
  Sprout,
  Activity,
  Edit,
  ExternalLink,
  Calendar,
  Layers,
  Thermometer,
  Droplets,
  CheckCircle2
} from 'lucide-react';

export default function PlotDetail() {
  const { id } = useParams();
  const plot = plotsData.find((p) => p.id === id) || plotsData[0];
  const station = iotStationsData.find((s) => s.id === plot.iotStationId);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/master-data/plots"
            className="p-2 text-stone-500 hover:text-brand-dark hover:bg-stone-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black bg-brand-dark text-brand-yellow px-2 py-0.5 rounded">
                {plot.code}
              </span>
              <Badge variant={plot.status} size="sm">{plot.status}</Badge>
            </div>
            <h2 className="text-2xl font-heading font-black text-brand-dark mt-1">
              {plot.name}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to={`/marketplace/plot/${plot.id}`} target="_blank">
            <Button variant="outline" size="sm" icon={ExternalLink}>
              Xem trên Marketplace
            </Button>
          </Link>
          <Link to={`/admin/master-data/plots/create?editId=${plot.id}`}>
            <Button variant="primary" size="sm" icon={Edit}>
              Chỉnh sửa thông số
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Info Card - 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-brand-border shadow-sm space-y-4">
          <h3 className="font-heading text-base font-bold text-brand-dark">
            Thông Số Kỹ Thuật & Thổ Nhưỡng
          </h3>
          <p className="text-sm text-stone-600 leading-relaxed">
            {plot.description}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-brand-border/60 text-xs">
            <div>
              <span className="text-brand-muted uppercase text-[10px] font-bold block">Thuộc Nông Trại</span>
              <span className="font-bold text-brand-dark text-sm mt-0.5 block">{plot.landName}</span>
            </div>
            <div>
              <span className="text-brand-muted uppercase text-[10px] font-bold block">Diện Tích Thửa</span>
              <span className="font-bold text-brand-dark text-sm mt-0.5 block">{plot.area}</span>
            </div>
            <div>
              <span className="text-brand-muted uppercase text-[10px] font-bold block">Giá Thuê Đất</span>
              <span className="font-bold text-brand-green text-sm mt-0.5 block">{plot.formattedPrice}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-brand-cream/60 border border-brand-border/80 text-xs space-y-1">
            <span className="text-brand-dark font-bold block">Đặc điểm thổ nhưỡng:</span>
            <span className="text-stone-700">{plot.soilType}</span>
          </div>
        </div>

        {/* Bound IoT Station Card - 1 col */}
        <div className="bg-white rounded-2xl p-6 border border-brand-border shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-brand-green uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-4 h-4" />
                Trạm Quan Trắc IoT
              </span>
              {station && <Badge variant={station.status} size="sm">{station.status}</Badge>}
            </div>
            <h4 className="font-heading text-lg font-bold text-brand-dark">
              {station ? station.name : plot.iotStationId}
            </h4>
            <p className="text-xs text-brand-muted mt-1">
              Mã kết nối: <span className="font-mono font-bold text-brand-dark">{plot.iotStationId}</span>
            </p>
          </div>

          {plot.recentSensorReadings && (
            <div className="p-4 rounded-xl bg-brand-cream text-xs space-y-2 border border-brand-border">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-rose-500" /> Nhiệt độ:</span>
                <strong className="text-brand-dark font-mono">{plot.recentSensorReadings.temperature}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-sky-500" /> Độ ẩm đất:</span>
                <strong className="text-brand-green font-mono">{plot.recentSensorReadings.soilMoisture}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-emerald-500" /> Độ ẩm khí:</span>
                <strong className="text-brand-dark font-mono">{plot.recentSensorReadings.humidity}</strong>
              </div>
            </div>
          )}

          <Link
            to={`/admin/master-data/iot-stations/${plot.iotStationId}`}
            className="text-xs font-bold text-brand-green hover:underline flex items-center justify-between"
          >
            <span>Cấu hình thông số trạm</span>
            <span>→</span>
          </Link>
        </div>

      </div>

      {/* Compatible Crops and Operational Notes */}
      <div className="bg-white rounded-2xl p-6 border border-brand-border shadow-sm space-y-4">
        <h3 className="font-heading text-base font-bold text-brand-dark flex items-center gap-2">
          <Sprout className="w-5 h-5 text-brand-green" />
          Danh Mục Giống Cây Trồng Phù Hợp Thổ Nhưỡng (Plot-Crop Compatibility)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {plot.compatibleCrops.map((c, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-brand-cream/50 border border-brand-border flex items-center gap-3 text-xs"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-brand-dark">{c}</span>
            </div>
          ))}
        </div>

        <div className="pt-2 text-xs text-brand-muted">
          Để bổ sung hoặc điều chỉnh quy tắc tương thích cho thửa đất này, vui lòng truy cập mục{' '}
          <Link to="/admin/master-data/compatibility" className="font-bold text-brand-green hover:underline">
            Tương Thích Thổ Nhưỡng
          </Link>.
        </div>
      </div>
    </div>
  );
}
