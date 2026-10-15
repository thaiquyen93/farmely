/**
 * MARKETPLACE GIS & PLOTS MODULE
 * 
 * Hệ thống bản đồ vệ tinh động (Dynamic GIS) kết nối PostgreSQL Database.
 * Không chứa dữ liệu mock hardcode — ranh giới và thuộc tính thửa đất
 * được tải trực tiếp từ farm-service (/api/lands và /api/plots).
 */

export const GIS_STATUSES = {
  AVAILABLE: {
    key: 'AVAILABLE',
    label: 'Đang trống',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    color: '#10B981',
    fillColor: 'rgba(16, 185, 129, 0.45)',
    hoverFillColor: 'rgba(16, 185, 129, 0.70)',
    strokeColor: '#34D399',
    iconText: '🌱'
  },
  RENTED: {
    key: 'RENTED',
    label: 'Đã thuê',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    color: '#F59E0B',
    fillColor: 'rgba(245, 158, 11, 0.50)',
    hoverFillColor: 'rgba(245, 158, 11, 0.75)',
    strokeColor: '#FBBF24',
    iconText: '🌾'
  },
  MAINTENANCE: {
    key: 'MAINTENANCE',
    label: 'Bảo trì',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    color: '#64748B',
    fillColor: 'rgba(100, 116, 139, 0.50)',
    hoverFillColor: 'rgba(100, 116, 139, 0.75)',
    strokeColor: '#94A3B8',
    iconText: '🔧'
  },
  UPCOMING: {
    key: 'UPCOMING',
    label: 'Sắp có',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
    color: '#3B82F6',
    fillColor: 'rgba(59, 130, 246, 0.50)',
    hoverFillColor: 'rgba(59, 130, 246, 0.75)',
    strokeColor: '#60A5FA',
    iconText: '⏳'
  }
};

export const ALL_CROPS_FILTER_OPTIONS = [
  'Tất cả loại cây',
  'Rau xanh (Xà lách)',
  'Cà chua',
  'Rau cải',
  'Dâu tây',
  'Ớt chuông',
  'Rau dền',
  'Thảo mộc'
];

/** Tọa độ trung tâm mặc định (Việt Nam) khi chưa có nông trại nào được chọn */
export const FARM_GPS_BOUNDS = {
  center: [106.6602, 10.7626],
  polygon: []
};

/** Dữ liệu sạch ban đầu: 0 thửa đất mock */
export const FARMS_GIS_DATA = [];
export const MARKETPLACE_PLOTS_GIS = [];
export const FARMS_GEOJSON_DATA = {
  type: 'FeatureCollection',
  features: []
};

/**
 * Chuyển đổi mảng thửa đất từ PostgreSQL Database (qua API /api/plots)
 * thành GeoJSON FeatureCollection chuẩn để render 3D trên MapLibre GL JS.
 */
export function buildGeoJsonFromDbPlots(plots = []) {
  if (!Array.isArray(plots) || plots.length === 0) {
    return {
      type: 'FeatureCollection',
      features: []
    };
  }

  const features = [];

  plots.forEach((p) => {
    let ring = [];

    // 1. Array of points: [[lng, lat], ...] or nested [[[lng, lat], ...]]
    if (Array.isArray(p.boundary) && p.boundary.length > 0) {
      if (Array.isArray(p.boundary[0]) && Array.isArray(p.boundary[0][0])) {
        ring = p.boundary[0]
          .map((pt) => [Number(pt[0]), Number(pt[1])])
          .filter((pt) => !isNaN(pt[0]) && !isNaN(pt[1]));
      } else if (p.boundary.length >= 3) {
        ring = p.boundary
          .map((pt) => {
            if (Array.isArray(pt)) return [Number(pt[0]), Number(pt[1])];
            if (typeof pt === 'string') {
              const parts = pt.trim().split(/[\s,]+/);
              return parts.length >= 2 ? [Number(parts[0]), Number(parts[1])] : null;
            }
            return null;
          })
          .filter((pt) => pt && !isNaN(pt[0]) && !isNaN(pt[1]));
      }
    }

    // 2. GeoJSON object or string (from boundary, boundaryGeojson, or boundary_geojson)
    if (ring.length < 3) {
      const geoRaw = p.boundary || p.boundaryGeojson || p.boundary_geojson;
      if (geoRaw) {
        try {
          const parsed = typeof geoRaw === 'string' ? JSON.parse(geoRaw) : geoRaw;
          if (parsed && Array.isArray(parsed.coordinates) && parsed.coordinates[0]) {
            const rawRing = Array.isArray(parsed.coordinates[0][0]) ? parsed.coordinates[0] : parsed.coordinates;
            ring = rawRing
              .map((pt) => [Number(pt[0]), Number(pt[1])])
              .filter((pt) => !isNaN(pt[0]) && !isNaN(pt[1]));
          }
        } catch {
          // ignore
        }
      }
    }

    // 3. Fallback: polygon_coords / polygonCoords
    if (ring.length < 3 && (p.polygon_coords || p.polygonCoords)) {
      try {
        const polyRaw = p.polygon_coords || p.polygonCoords;
        const parsed = typeof polyRaw === 'string' ? JSON.parse(polyRaw) : polyRaw;
        const rawCoords = Array.isArray(parsed[0]) && Array.isArray(parsed[0][0]) ? parsed[0] : parsed;
        ring = rawCoords
          .map((pt) => [Number(pt[0]), Number(pt[1])])
          .filter((pt) => !isNaN(pt[0]) && !isNaN(pt[1]));
      } catch {
        // ignore
      }
    }

    // 4. Fallback: center_point / centerPoint
    if (ring.length < 3 && (p.center_point || p.centerPoint)) {
      try {
        const centerRaw = p.center_point || p.centerPoint;
        const parsed = typeof centerRaw === 'string' ? JSON.parse(centerRaw) : centerRaw;
        if (Array.isArray(parsed) && parsed.length >= 2 && !isNaN(parsed[0]) && !isNaN(parsed[1])) {
          const cLng = Number(parsed[0]);
          const cLat = Number(parsed[1]);
          const d = 0.00015;
          ring = [
            [cLng - d, cLat - d],
            [cLng + d, cLat - d],
            [cLng + d, cLat + d],
            [cLng - d, cLat + d],
            [cLng - d, cLat - d]
          ];
        }
      } catch {
        // ignore
      }
    }

    if (ring.length >= 3) {
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        ring.push([first[0], first[1]]);
      }
    }

    const rawStatus = (p.status || '').toUpperCase();
    const statusLabel = rawStatus === 'AVAIL' || rawStatus === 'AVAILABLE'
      ? 'Đang trống'
      : (rawStatus === 'RENT' || rawStatus === 'RENTED'
          ? 'Đã thuê'
          : (rawStatus === 'MAINT' || rawStatus === 'MAINTENANCE' ? 'Bảo trì' : (p.status || 'Đang trống')));

    const plotCode = p.plotCode || p.plot_code || p.code || `P-${p.plotId || p.plot_id || p.id}`;
    const plotId = String(plotCode).replace(/^Plot\s+/i, '');
    const areaNum = Number(p.area) || 0;
    const priceNum = Number(p.pricePerPeriod ?? p.price_per_period) || 0;

    const cropList = Array.isArray(p.compatibleVarieties) && p.compatibleVarieties.length > 0
      ? p.compatibleVarieties.map((v) => v.varietyName || v.name)
      : (Array.isArray(p.compatible_crops) ? p.compatible_crops : (Array.isArray(p.crops) ? p.crops : []));

    features.push({
      type: 'Feature',
      properties: {
        id: plotId,
        plot_id: p.plotId || p.id,
        code: plotCode,
        label: plotId,
        name: p.name || `Thửa ${plotCode}`,
        landId: p.landId,
        landName: p.landName || '',
        farmName: p.landName || 'Nông trại',
        area: `${areaNum} m²`,
        sizeNumber: areaNum,
        areaFormatted: `${areaNum} m²`,
        rentalPrice: priceNum,
        price: `${priceNum.toLocaleString('vi-VN')} đ`,
        rentalPriceFormatted: `${priceNum.toLocaleString('vi-VN')} đ/tháng`,
        status: statusLabel,
        statusCode: rawStatus,
        crops: cropList,
        compatibleCrops: cropList,
        img: p.imageUrl || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
        imageUrl: p.imageUrl,
        facilities: {
          irrigation: true,
          iot: true,
          organicSoil: true,
          waterSource: true
        },
        hasBoundary: ring.length >= 3,
        dbSynced: true
      },
      geometry: {
        type: 'Polygon',
        coordinates: ring.length >= 3 ? [ring] : []
      }
    });
  });

  return {
    type: 'FeatureCollection',
    features
  };
}
