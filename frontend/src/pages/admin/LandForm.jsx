import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { landsData } from '../../data/lands';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { ArrowLeft, MapPin, Building2, Save, Map, Layers } from 'lucide-react';

export default function LandForm() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId');
  const navigate = useNavigate();

  const existingLand = landsData.find((l) => l.id === editId);

  const [name, setName] = useState(existingLand?.name || '');
  const [location, setLocation] = useState(existingLand?.location || '');
  const [description, setDescription] = useState(existingLand?.description || '');
  const [totalArea, setTotalArea] = useState(existingLand?.totalArea || '');
  const [boundary, setBoundary] = useState(existingLand?.geographicalBoundary || '');
  const [status, setStatus] = useState(existingLand?.status || 'ACTIVE');
  const [imageUrl, setImageUrl] = useState(existingLand?.imageUrl || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80');

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Vui lòng nhập tên khu nông trại.';
    if (!location.trim()) errs.location = 'Vui lòng nhập địa chỉ vị trí.';
    if (!totalArea.trim()) errs.totalArea = 'Vui lòng nhập tổng diện tích quy hoạch.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert(editId ? 'Đã cập nhật thông tin Nông Trại thành công!' : 'Đã tạo mới Nông Trại thành công!');
      navigate('/admin/master-data/lands');
    }, 500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          to="/admin/master-data/lands"
          className="p-2 text-stone-500 hover:text-brand-dark hover:bg-stone-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="text-[11px] font-bold text-brand-green uppercase tracking-wider">
            Quản trị Master Data
          </span>
          <h2 className="text-2xl font-heading font-black text-brand-dark">
            {editId ? `Chỉnh Sửa Nông Trại: ${existingLand?.name}` : 'Thêm Khu Nông Trại Mới'}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-6">
        
        {/* Basic Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Tên Khu Nông Trại (Land Name)"
            required
            placeholder="Ví dụ: Nông Trại Củ Chi Eco Farm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />

          <Input
            label="Tổng Diện Tích Quy Hoạch"
            required
            placeholder="Ví dụ: 25,000 m² (2.5 ha)"
            value={totalArea}
            onChange={(e) => setTotalArea(e.target.value)}
            error={errors.totalArea}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Địa Chỉ Thực Địa"
            required
            placeholder="Ví dụ: Xã An Phú, Huyện Củ Chi, TP.HCM"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            error={errors.location}
          />

          <Select
            label="Trạng Thái Vận Hành"
            required
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: 'ACTIVE', label: 'ACTIVE (Đang hoạt động)' },
              { value: 'MAINTENANCE', label: 'MAINTENANCE (Đang quy hoạch lại)' },
              { value: 'INACTIVE', label: 'INACTIVE (Tạm ngưng)' }
            ]}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-1.5">
            Mô Tả Tổng Quan & Thổ Nhưỡng Đặc Trưng
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Giới thiệu về vị trí địa lý, tầng đất phù sa, nguồn nước ngầm và hệ thống tưới tiêu đã được xây dựng..."
            className="w-full rounded-xl border border-brand-border bg-white px-3.5 py-2.5 text-sm text-brand-dark transition-all focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
        </div>

        {/* Visual Map / Geographical Boundary Section */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">
            Ranh Giới Địa Lý & Bản Đồ Quy Hoạch (Geographical Boundary)
          </label>
          <Input
            placeholder="Ví dụ: 11.0842° N, 106.5298° E (Vùng quy hoạch nông nghiệp công nghệ cao)"
            value={boundary}
            onChange={(e) => setBoundary(e.target.value)}
          />

          {/* Premium Map Placeholder */}
          <div className="relative h-64 rounded-2xl overflow-hidden border border-brand-border bg-brand-cream/80 flex items-center justify-center group">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-50 transition-opacity"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80')`
              }}
            />
            <div className="absolute inset-0 bg-brand-dark/20 backdrop-blur-[2px]" />
            <div className="relative z-10 text-center p-6 bg-white/90 backdrop-blur-md rounded-2xl border border-brand-border/60 shadow-lg max-w-sm">
              <div className="w-10 h-10 rounded-full bg-brand-yellow flex items-center justify-center text-brand-dark mx-auto mb-2 shadow-sm">
                <Map className="w-5 h-5" />
              </div>
              <h4 className="font-heading text-sm font-bold text-brand-dark">
                Bản Đồ Phân Lô Thực Địa (GIS Boundary Map)
              </h4>
              <p className="text-[11px] text-stone-500 mt-1">
                Tọa độ: {boundary || "11.0842° N, 106.5298° E"}
              </p>
              <div className="mt-3 flex items-center justify-center gap-2 text-[11px] font-bold text-brand-green">
                <Layers className="w-3.5 h-3.5" />
                <span>18 Thửa đất đã được định vị GPS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-border/60">
          <Link to="/admin/master-data/lands">
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
            {editId ? 'LƯU THAY ĐỔI' : 'TẠO NÔNG TRẠI MỚI'}
          </Button>
        </div>
      </form>
    </div>
  );
}
