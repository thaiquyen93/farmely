/**
 * MAP LAYERS — Đăng ký toàn bộ source & layer của bản đồ trang trại.
 *
 * Tách khỏi component để: (1) component gọn lại, (2) idempotent nên HMR của Vite
 * không thể đăng ký trùng, (3) mọi màu sắc đi qua mapTheme thay vì hardcode hex.
 */

import {
  LAYER_IDS,
  RISE_SETTLE_HEIGHT,
  buildStatusColorExpression,
  getStatusConfig,
} from '../../../utils/mapTheme';
import { buildWorldMaskWithHole } from '../../../utils/geoUtils';

/** Màu khối 3D của các thửa bị làm tối khi spotlight đang bật (slate-950) */
export const DIM_EXTRUSION_COLOR = '#0B1120';

/** Độ mờ fill nền của thửa — đủ để thấy trạng thái, vẫn xuyên được ảnh vệ tinh */
export const PLOT_FILL_OPACITY = 0.16;

/** Độ mờ fill khi rê chuột vào thửa */
export const PLOT_HOVER_FILL_OPACITY = 0.55;

/** Thêm source nếu chưa tồn tại (chống đăng ký trùng khi HMR) */
function ensureSource(map, id, spec) {
  if (!map.getSource(id)) {
    map.addSource(id, spec);
  }
}

/** Thêm layer nếu chưa tồn tại */
function ensureLayer(map, spec, beforeId) {
  if (!map.getLayer(spec.id)) {
    const before = beforeId && map.getLayer(beforeId) ? beforeId : undefined;
    map.addLayer(spec, before);
  }
}

/**
 * Tạo BẢN SAO làm việc của FeatureCollection với riseHeight khởi tạo.
 * KHÔNG BAO GIỜ mutate FARMS_GEOJSON_DATA được import.
 */
export function createWorkingPlotsData(plotsData, initialHeight = RISE_SETTLE_HEIGHT) {
  return {
    type: 'FeatureCollection',
    features: (plotsData?.features || []).map((f) => ({
      ...f,
      properties: { ...f.properties, riseHeight: initialHeight },
    })),
  };
}

/**
 * Đăng ký ranh giới khu đất, khối 3D, vùng click/hover, viền và các layer highlight.
 * @returns {{ workingData: object }} bản sao dữ liệu dùng để animate chiều cao
 */
export function registerFarmLayers(map, plotsData, options = {}) {
  const { initialHeight = RISE_SETTLE_HEIGHT, selectedId = '' } = options;
  const workingData = createWorkingPlotsData(plotsData, initialHeight);

  const available = getStatusConfig('AVAILABLE');

  const farmRing = options.farmBoundary && options.farmBoundary.length >= 3
    ? options.farmBoundary
    : null;

  // 1. Ranh giới toàn bộ khu đất
  const boundaryData = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: farmRing ? [farmRing] : [],
    },
  };

  const dimData = farmRing ? buildWorldMaskWithHole(farmRing) : { type: 'FeatureCollection', features: [] };

  if (map.getSource(LAYER_IDS.farmBoundarySource)) {
    map.getSource(LAYER_IDS.farmBoundarySource).setData(boundaryData);
  } else {
    ensureSource(map, LAYER_IDS.farmBoundarySource, {
      type: 'geojson',
      data: boundaryData,
    });
  }

  // 1b. Mặt nạ làm tối mọi thứ NGOÀI khu đất (spotlight — mặc định opacity 0)
  if (map.getSource(LAYER_IDS.farmDimSource)) {
    map.getSource(LAYER_IDS.farmDimSource).setData(dimData);
  } else {
    ensureSource(map, LAYER_IDS.farmDimSource, {
      type: 'geojson',
      data: dimData,
    });
  }

  ensureLayer(map, {
    id: LAYER_IDS.farmDimOutside,
    type: 'fill',
    source: LAYER_IDS.farmDimSource,
    paint: {
      'fill-color': 'rgba(2, 6, 23, 1)',
      'fill-opacity': 0,
    },
  });

  // 2. Nguồn dữ liệu GeoJSON các thửa đất (bản sao có riseHeight)
  ensureSource(map, LAYER_IDS.plotsSource, {
    type: 'geojson',
    data: workingData,
  });

  // 3. Khối 3D nhô lên khỏi mặt đất — đặt DƯỚI các layer line
  ensureLayer(map, {
    id: LAYER_IDS.plotsExtrusion,
    type: 'fill-extrusion',
    source: LAYER_IDS.plotsSource,
    paint: {
      'fill-extrusion-height': ['get', 'riseHeight'],
      'fill-extrusion-base': 0,
      'fill-extrusion-color': buildStatusColorExpression('color'),
      'fill-extrusion-opacity': 0.55,
      'fill-extrusion-vertical-gradient': true,
    },
  });

  // 4. Viền ranh giới tổng khu đất (nét đứt vàng/cam nổi bật)
  ensureLayer(map, {
    id: LAYER_IDS.farmBoundaryLine,
    type: 'line',
    source: LAYER_IDS.farmBoundarySource,
    paint: {
      'line-color': getStatusConfig('RENTED').color,
      'line-width': 2.5,
      'line-dasharray': [3, 2],
      'line-opacity': 0.95,
    },
  });

  // 5. Fill nền nhẹ theo trạng thái — vừa là vùng click/hover, vừa giúp phân biệt
  //    thửa trống / đã thuê ngay từ cái nhìn đầu tiên (đủ nhạt để còn thấy ảnh vệ tinh)
  ensureLayer(map, {
    id: LAYER_IDS.plotsFill,
    type: 'fill',
    source: LAYER_IDS.plotsSource,
    paint: {
      'fill-color': buildStatusColorExpression('color'),
      'fill-opacity': PLOT_FILL_OPACITY,
    },
  });

  // 5b. Fill hover — chỉ hiện khi rê chuột vào 1 thửa cụ thể, màu đậm theo trạng thái
  ensureLayer(map, {
    id: LAYER_IDS.plotsFillHover,
    type: 'fill',
    source: LAYER_IDS.plotsSource,
    paint: {
      'fill-color': buildStatusColorExpression('hoverFillColor'),
      'fill-opacity': PLOT_HOVER_FILL_OPACITY,
    },
    filter: ['==', ['get', 'id'], ''],
  });

  // 6a. Viền nền rộng, mờ — giúp cạnh thửa đọc được cả trên đất tối lẫn rau sáng
  ensureLayer(map, {
    id: LAYER_IDS.plotsOutlineSoft,
    type: 'line',
    source: LAYER_IDS.plotsSource,
    paint: {
      'line-color': buildStatusColorExpression('strokeColor'),
      'line-width': 4,
      'line-blur': 3,
      'line-opacity': 0.4,
    },
  });

  // 6. Viền nét đứt mỏng, sắc nét giữa các thửa (màu theo trạng thái)
  ensureLayer(map, {
    id: LAYER_IDS.plotsOutline,
    type: 'line',
    source: LAYER_IDS.plotsSource,
    paint: {
      'line-color': buildStatusColorExpression('strokeColor'),
      'line-width': 1.4,
      'line-dasharray': [4, 3],
      'line-opacity': 0.95,
    },
  });

  // 6b. Làm tối các thửa KHÔNG được chọn (spotlight — mặc định opacity 0)
  ensureLayer(map, {
    id: LAYER_IDS.plotsDim,
    type: 'fill',
    source: LAYER_IDS.plotsSource,
    paint: {
      'fill-color': 'rgba(2, 6, 23, 1)',
      'fill-opacity': 0,
    },
    filter: ['!=', ['get', 'id'], ''],
  });

  // 7a. Glow mờ bên ngoài thửa đang chọn
  ensureLayer(map, {
    id: LAYER_IDS.plotsSelectedGlow,
    type: 'line',
    source: LAYER_IDS.plotsSource,
    paint: {
      'line-color': available.strokeColor,
      'line-width': 8,
      'line-opacity': 0.4,
      'line-blur': 4,
    },
    filter: ['==', ['get', 'id'], selectedId],
  });

  // 7b. Viền sắc nét thửa đang chọn (marching ants chạy trên layer này)
  ensureLayer(map, {
    id: LAYER_IDS.plotsSelectedBorder,
    type: 'line',
    source: LAYER_IDS.plotsSource,
    paint: {
      'line-color': available.color,
      'line-width': 2.5,
      'line-opacity': 1,
    },
    filter: ['==', ['get', 'id'], selectedId],
  });

  // 7c. Fill highlight nhẹ cho thửa đang chọn
  ensureLayer(map, {
    id: LAYER_IDS.plotsSelectedFill,
    type: 'fill',
    source: LAYER_IDS.plotsSource,
    paint: {
      'fill-color': available.color,
      'fill-opacity': 0.15,
    },
    filter: ['==', ['get', 'id'], selectedId],
  });

  return { workingData };
}

/** Đổi filter của cả 3 layer highlight về cùng 1 thửa (an toàn nếu layer chưa có) */
export function setSelectedPlotFilters(map, plotId) {
  [
    LAYER_IDS.plotsSelectedGlow,
    LAYER_IDS.plotsSelectedBorder,
    LAYER_IDS.plotsSelectedFill,
  ].forEach((id) => {
    if (map?.getLayer(id)) {
      map.setFilter(id, ['==', ['get', 'id'], plotId || '']);
    }
  });
}

/**
 * Đồng bộ MÀU NHẤN của thửa đang chọn (glow / viền / fill) theo trạng thái thật
 * của thửa đó, để không còn trường hợp thửa "Đã thuê" có viền xanh emerald mà
 * 4 góc vuông lại màu hổ phách.
 * @returns {object} entry GIS_STATUSES đã dùng, để caller lấy cùng 1 màu cho brackets
 */
export function setSelectedPlotAccent(map, status) {
  const config = getStatusConfig(status);
  if (!map) return config;

  if (map.getLayer?.(LAYER_IDS.plotsSelectedGlow)) {
    map.setPaintProperty(LAYER_IDS.plotsSelectedGlow, 'line-color', config.strokeColor);
  }
  if (map.getLayer?.(LAYER_IDS.plotsSelectedBorder)) {
    map.setPaintProperty(LAYER_IDS.plotsSelectedBorder, 'line-color', config.color);
  }
  if (map.getLayer?.(LAYER_IDS.plotsSelectedFill)) {
    map.setPaintProperty(LAYER_IDS.plotsSelectedFill, 'fill-color', config.color);
  }
  return config;
}

/**
 * Làm tối KHỐI 3D của các thửa không được chọn.
 *
 * `plots-dim` là layer `fill` nên nó không chắc làm tối được khối `fill-extrusion`
 * (maplibre vẽ extrusion ở pass riêng). Vì `fill-extrusion-opacity` KHÔNG nhận
 * expression data-driven, ta làm tối qua `fill-extrusion-color`: thửa đang chọn
 * giữ màu trạng thái, các thửa còn lại nhận màu gần-đen.
 *
 * @param {object} map
 * @param {string} selectedId '' để trả mọi khối về màu trạng thái
 */
export function setExtrusionSpotlight(map, selectedId) {
  if (!map?.getLayer?.(LAYER_IDS.plotsExtrusion)) return;

  const statusColor = buildStatusColorExpression('color');

  if (!selectedId) {
    map.setPaintProperty(LAYER_IDS.plotsExtrusion, 'fill-extrusion-color', statusColor);
    return;
  }

  map.setPaintProperty(LAYER_IDS.plotsExtrusion, 'fill-extrusion-color', [
    'case',
    ['==', ['get', 'id'], selectedId],
    statusColor,
    DIM_EXTRUSION_COLOR,
  ]);
}
