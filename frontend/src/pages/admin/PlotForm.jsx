import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { plotsData } from '../../data/plots';
import { landsData } from '../../data/lands';
import { iotStationsData } from '../../data/iotStations';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { ArrowLeft, Save, Map, Layers, Radio } from 'lucide-react';

export default function PlotForm() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId');
  const defaultLandId = searchParams.get('landId');
  const navigate = useNavigate();

  const existingPlot = plotsData.find((p) => p.id === editId);

  const [code, setCode] = useState(existingPlot?.code || 'P-107');
  const [name, setName] = useState(existingPlot?.name || '');
  const [landId, setLandId] = useState(existingPlot?.landId || defaultLandId || 'LND-001');
  const [area, setArea] = useState(existingPlot?.area || '50 m²');
  const [soilType, setSoilType] = useState(existingPlot?.soilType || 'Đất phù sa bồi lắng giàu mùn hữu cơ');
  const [rentalPrice, setRentalPrice] = useState(existingPlot?.rentalPrice || 1200000);
  const [carePrice, setCarePrice] = useState(existingPlot?.careServicePrice || 600000);
  const [iotStationId, setIotStationId] = useState(existingPlot?.iotStationId || 'IOT-CC-01');
  const [status, setStatus] = useState(existingPlot?.status || 'AVAILABLE');
  const [description, setDescription] = useState(existingPlot?.description || '');
  const [boundary, setBoundary] = useState(existingPlot?.boundaryCoordinates || 'Khu A - Lô 07');

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert(editId ? 'Cập nhật thửa đất thành công!' : 'Tạo mới thửa đất thành công!');
      navigate('/admin/master-data/plots');
    }, 500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          to="/admin/master-data/plots"
          className="p-2 text-stone-500 hover:text-brand-dark hover:bg-stone-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="text-[11px] font-bold text-brand-green uppercase tracking-wider">
            Quản trị Master Data
          </span>
          <h2 className="text-2xl font-heading font-black text-brand-dark">
            {editId ? `Chỉnh Sửa Thửa Đất: ${existingPlot?.code}` : 'Thêm Thửa Đất Canh Tác Mới'}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-6">
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Mã Thửa Đất"
            required
            placeholder="P-101"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <div className="sm:col-span-2">
            <Input
              label="Tên Thửa Đất"
              required
              placeholder="Thửa Đất Sen Vàng A1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Thuộc Nông Trại (Land)"
            required
            value={landId}
            onChange={(e) => setLandId(e.target.value)}
            options={landsData.map((l) => ({ value: l.id, label: l.name }))}
          />

          <Input
            label="Diện Tích Thửa Đất"
            required
            placeholder="50 m²"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Đơn Giá Thuê Đất / Tháng (VND)"
            type="number"
            required
            value={rentalPrice}
            onChange={(e) => setRentalPrice(Number(e.target.value))}
          />

          <Input
            label="Phí Chăm Sóc Assisted-growing / Tháng (VND)"
            type="number"
            required
            value={carePrice}
            onChange={(e) => setCarePrice(Number(e.target.value))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Trạm Cảm Biến IoT Gắn Liền"
            required
            value={iotStationId}
            onChange={(e) => setIotStationId(e.target.value)}
            options={iotStationsData.map((s) => ({
              value: s.id,
              label: `${s.id} - ${s.name} (${s.status})`
            }))}
          />

          <Select
            label="Trạng Thái Thửa Đất"
            required
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: 'AVAILABLE', label: 'AVAILABLE (Sẵn sàng cho thuê)' },
              { value: 'RESERVED', label: 'RESERVED (Đang giữ chỗ 15p)' },
              { value: 'RENTED', label: 'RENTED (Đang được thuê canh tác)' },
              { value: 'MAINTENANCE', label: 'MAINTENANCE (Nghỉ đất 4 ngày - BR23)' },
              { value: 'FALLOW', label: 'FALLOW (Đất trống dài hạn)' }
            ]}
          />
        </div>

        <div>
          <Input
            label="Đặc Tính Thổ Nhưỡng (Soil Type & pH)"
            required
            placeholder="Đất phù sa bồi lắng giàu mùn hữu cơ (pH 6.2 - 6.8)"
            value={soilType}
            onChange={(e) => setSoilType(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-1.5">
            Mô Tả Chi Tiết Về Thửa Đất
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả ánh sáng đón nắng, vị trí giáp rãnh thoát nước, giàn tre có sẵn..."
            className="w-full rounded-xl border border-brand-border bg-white px-3.5 py-2.5 text-sm text-brand-dark transition-all focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
        </div>

        {/* Boundary Map Section */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">
            Ranh Giới Định Vị Thửa Đất (Plot Boundary)
          </label>
          <Input
            placeholder="Khu A - Lô 01, Hàng rào tre tự nhiên hướng Đông"
            value={boundary}
            onChange={(e) => setBoundary(e.target.value)}
          />

          <div className="relative h-48 rounded-2xl overflow-hidden border border-brand-border bg-brand-cream/60 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=1000&q=80')`
              }}
            />
            <div className="relative z-10 text-center p-4 bg-white/90 backdrop-blur-sm rounded-xl border border-brand-border/60">
              <span className="font-mono text-xs font-bold text-brand-green block">
                Vị trí ranh giới thửa đất: {code} ({area})
              </span>
              <span className="text-[11px] text-stone-500">
                Đã kiểm tra kết nối trạm vi khí hậu {iotStationId}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-border/60">
          <Link to="/admin/master-data/plots">
            <Button variant="outline" size="md">
              Hủy bỏ
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={Save}
            loading={isSaving}
          >
            {editId ? 'LƯU THAY ĐỔI' : 'TẠO THỬA ĐẤT MỚI'}
          </Button>
        </div>
      </form>
    </div>
  );
}
