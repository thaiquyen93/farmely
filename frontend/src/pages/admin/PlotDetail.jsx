import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { farmApi, plotStatusBadge } from '../../api/farm/farmApi';
import { formatArea } from '../../utils/polygonGeometry';
import { iotStationsData } from '../../data/iotStations';
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
  Thermometer,
  Droplets,
  CheckCircle2,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function PlotDetail() {
  const { id } = useParams();
  const [plot, setPlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    // Ưu tiên getPlot(id), fallback sang listPlots tìm theo id hoặc plotCode
    farmApi.getPlot(id)
      .then((d) => {
        if (!active) return;
        if (d) {
          setPlot({
            id: d.id || d.plotId,
            code: d.code || d.plotCode,
            name: d.name || `Thửa Đất ${d.plotCode || d.code}`,
            landId: d.landId,
            landName: d.landName || 'Trang trại Happy Valley Củ Chi',
            landAddress: d.landAddress || d.address || 'Đường Nhuận Đức, Xã Nhuận Đức, Huyện Củ Chi, TP. Hồ Chí Minh',
            area: typeof d.area === 'number' ? formatArea(d.area) : (d.area || '150 m²'),
            status: plotStatusBadge(d.status),
            price: Number(d.pricePerPeriod || d.price_per_period || 0),
            formattedPrice: `${Number(d.pricePerPeriod || d.price_per_period || 0).toLocaleString('vi-VN')} đ/tháng`,
            soilType: d.soilType || 'Đất phù sa bồi lắng giàu mùn hữu cơ (pH 6.2 - 6.8)',
            description: d.description || `Thửa đất canh tác tiêu chuẩn VietGAP thuộc ${d.landName || 'Happy Valley Củ Chi'}.`,
            iotStationId: d.iotStationId || `IOT-${d.plotCode || 'CC-01'}`,
            recentSensorReadings: d.recentSensorReadings || {
              temperature: '28.5 °C',
              humidity: '74 %',
              soilMoisture: '68 %'
            },
            compatibleCrops: Array.isArray(d.compatibleCrops) && d.compatibleCrops.length > 0
              ? d.compatibleCrops
              : ['Cà chua bi Cherry', 'Xà lách Lollo Bionda', 'Dưa leo Baby']
          });
        }
      })
      .catch(() => {
        // Fallback sang listPlots
        return farmApi.listPlots().then((rows) => {
          if (!active) return;
          const found = (rows || []).find((p) =>
            String(p.plotId) === String(id) ||
            (p.plotCode && p.plotCode.toLowerCase() === String(id).toLowerCase())
          );
          if (found) {
            setPlot({
              id: found.plotId,
              code: found.plotCode,
              name: `Thửa Đất ${found.plotCode}`,
              landId: found.landId,
              landName: found.landName || 'Trang trại Happy Valley Củ Chi',
              area: formatArea(Number(found.area)),
              status: plotStatusBadge(found.status),
              price: Number(found.pricePerPeriod),
              formattedPrice: `${Number(found.pricePerPeriod || 0).toLocaleString('vi-VN')} đ/tháng`,
              soilType: 'Đất phù sa bồi lắng giàu mùn hữu cơ (pH 6.2 - 6.8)',
              description: found.description || 'Thửa đất sinh thái đạt chuẩn VietGAP với hệ thống tưới nhỏ giọt tự động và giám sát IoT 24/7.',
              iotStationId: `IOT-${found.plotCode}`,
              compatibleCrops: ['Cà chua bi Cherry', 'Xà lách Lollo Bionda', 'Dưa leo Baby'],
              recentSensorReadings: {
                temperature: '28.5 °C',
                humidity: '74 %',
                soilMoisture: '68 %'
              }
            });
          } else {
            setError('Không tìm thấy thửa đất trong Database.');
          }
        });
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Lỗi nạp dữ liệu từ Database.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
        <p className="text-sm text-stone-600 font-semibold">Đang tải thông tin thửa đất...</p>
      </div>
    );
  }

  if (error || !plot) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <p className="text-base font-bold text-brand-dark">{error || 'Không tìm thấy thửa đất.'}</p>
        <Link to="/admin/master-data/plots">
          <Button variant="outline" size="sm">Quay lại danh sách thửa đất</Button>
        </Link>
      </div>
    );
  }

  const station = iotStationsData.find((s) => s.id === plot?.iotStationId);

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
          <Link to={`/marketplace/plot/${plot.code || plot.id}`} target="_blank">
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

      {/* Compatible Crops */}
      <div className="bg-white rounded-2xl p-6 border border-brand-border shadow-sm space-y-4">
        <h3 className="font-heading text-base font-bold text-brand-dark flex items-center gap-2">
          <Sprout className="w-5 h-5 text-brand-green" />
          Danh Mục Giống Cây Trồng Phù Hợp Thổ Nhưỡng (Plot-Crop Compatibility)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(plot.compatibleCrops || []).map((c, idx) => (
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
