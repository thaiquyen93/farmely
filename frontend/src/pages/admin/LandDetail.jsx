import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { landsData } from '../../data/lands';
import { plotsData } from '../../data/plots';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { ArrowLeft, MapPin, Grid3X3, Layers, Edit, Plus, Eye } from 'lucide-react';

export default function LandDetail() {
  const { id } = useParams();
  const land = landsData.find((l) => l.id === id) || landsData[0];
  const landPlots = plotsData.filter((p) => p.landId === land.id);

  return (
    <div className="space-y-6">
      {/* Back and Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/master-data/lands"
            className="p-2 text-stone-500 hover:text-brand-dark hover:bg-stone-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-brand-muted uppercase block">
                {land.id}
              </span>
              <Badge variant={land.status} size="sm">{land.status}</Badge>
            </div>
            <h2 className="text-2xl font-heading font-black text-brand-dark">
              {land.name}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to={`/admin/master-data/lands/create?editId=${land.id}`}>
            <Button variant="outline" size="sm" icon={Edit}>
              Chỉnh sửa thông tin
            </Button>
          </Link>
          <Link to={`/admin/master-data/plots/create?landId=${land.id}`}>
            <Button variant="primary" size="sm" icon={Plus}>
              Thêm Thửa Đất Mới
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-brand-border shadow-sm space-y-4">
          <h3 className="font-heading text-base font-bold text-brand-dark">
            Mô Tả & Thông Số Kỹ Thuật Đất
          </h3>
          <p className="text-sm text-stone-600 leading-relaxed">
            {land.description}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-brand-border/60 text-xs">
            <div>
              <span className="text-brand-muted uppercase text-[10px] font-bold block">Tổng diện tích</span>
              <span className="font-bold text-brand-dark text-sm mt-0.5 block">{land.totalArea}</span>
            </div>
            <div>
              <span className="text-brand-muted uppercase text-[10px] font-bold block">Địa chỉ</span>
              <span className="font-semibold text-brand-dark mt-0.5 block">{land.location}</span>
            </div>
            <div>
              <span className="text-brand-muted uppercase text-[10px] font-bold block">Nguồn nước cấp</span>
              <span className="font-semibold text-brand-dark mt-0.5 block">{land.waterSource}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-brand-border shadow-sm flex flex-col justify-between">
          <h3 className="font-heading text-base font-bold text-brand-dark mb-3">
            Tọa Độ GIS Ranh Giới
          </h3>
          <div className="p-3.5 rounded-xl bg-brand-cream/60 border border-brand-border text-xs text-stone-700 font-mono">
            {land.geographicalBoundary}
          </div>
          <div className="pt-4 text-xs text-brand-muted flex items-center justify-between">
            <span>Ngày đăng ký: {land.createdDate}</span>
            <span className="font-bold text-brand-green">{land.activePlots} Thửa đất sẵn sàng</span>
          </div>
        </div>
      </div>

      {/* Plots in this Land */}
      <div className="bg-white rounded-2xl p-6 border border-brand-border shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
          <h3 className="font-heading text-base font-bold text-brand-dark flex items-center gap-2">
            <Grid3X3 className="w-5 h-5 text-brand-green" />
            Danh Sách Các Thửa Đất Thuộc {land.name}
          </h3>
          <span className="text-xs text-brand-muted">
            Tổng cộng: <strong>{landPlots.length}</strong> thửa
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã Thửa</th>
                <th>Tên Thửa Đất</th>
                <th>Diện Tích</th>
                <th>Thổ Nhưỡng</th>
                <th>Giá Thuê</th>
                <th>Trạm IoT</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {landPlots.map((p) => (
                <tr key={p.id}>
                  <td className="font-mono font-bold text-brand-dark">{p.code}</td>
                  <td className="font-semibold text-brand-dark">{p.name}</td>
                  <td>{p.area}</td>
                  <td className="text-xs text-stone-600 max-w-xs truncate">{p.soilType}</td>
                  <td className="font-bold text-brand-green">{p.formattedPrice}</td>
                  <td>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-stone-100 text-stone-700">
                      {p.iotStationId}
                    </span>
                  </td>
                  <td><Badge variant={p.status} size="sm">{p.status}</Badge></td>
                  <td>
                    <Link
                      to={`/admin/master-data/plots/${p.id}`}
                      className="p-1.5 text-brand-green hover:bg-stone-100 rounded-lg inline-flex"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
