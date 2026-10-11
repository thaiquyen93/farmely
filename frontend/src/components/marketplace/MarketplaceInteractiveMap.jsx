import React, { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { FARMS_GEOJSON_DATA, FARM_GPS_BOUNDS } from '../../data/marketplaceGisData';

// Helper format giá tiền ngắn gọn phong cách Airbnb (ví dụ: 1.2 tr, 1.45 tr)
function formatCompactPrice(props) {
  if (props.rentalPrice) {
    const millions = props.rentalPrice / 1000000;
    return `${millions % 1 === 0 ? millions : millions.toFixed(2).replace(/\.?0+$/, '')} tr`;
  }
  if (props.price) {
    const num = parseInt(String(props.price).replace(/\D/g, ''));
    if (!isNaN(num) && num > 0) {
      const millions = num / 1000000;
      return `${millions % 1 === 0 ? millions : millions.toFixed(2).replace(/\.?0+$/, '')} tr`;
    }
  }
  return '';
}

// Lấy class Tailwind cho Badge Marker theo chuẩn sàn Airbnb / BĐS cao cấp
function getBadgeClassName(props, isSelected) {
  const isVacant = props.status === 'Đang trống' || props.status === 'AVAILABLE';

  if (isSelected) {
    return 'w-max whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] inline-flex items-center gap-1.5 cursor-pointer select-none transition-all duration-300 pointer-events-auto bg-emerald-600 text-white shadow-xl shadow-emerald-950/40 border-2 border-white scale-110 ring-2 ring-emerald-400 z-30 font-black';
  }

  if (isVacant) {
    // Thửa CÒN TRỐNG: Badge giá siêu gọn (width ~42px), không tràn lấn thửa bên cạnh
    return 'w-max whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1 cursor-pointer select-none transition-all duration-200 pointer-events-auto bg-white/95 text-slate-900 border border-emerald-400/80 shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:scale-115 hover:border-emerald-500 hover:shadow-lg hover:z-20 font-extrabold';
  }

  // Thửa ĐÃ THUÊ: Tag cực kỳ khiêm tốn (width ~34px), tối mờ, chìm dưới nền
  return 'w-max whitespace-nowrap px-1.5 py-0.5 rounded-full text-[9px] inline-flex items-center gap-1 cursor-pointer select-none transition-all duration-200 pointer-events-auto bg-slate-900/70 text-slate-400 border border-slate-700/60 shadow-xs opacity-60 hover:opacity-100 hover:scale-105 font-medium';
}

// Render HTML nội dung của Pin Marker (chỉ hiển thị giá ngắn gọn để tránh chồng lấn thông tin)
function renderBadgeContent(props, isSelected) {
  const isVacant = props.status === 'Đang trống' || props.status === 'AVAILABLE';
  const priceStr = formatCompactPrice(props);

  if (isSelected) {
    return `
      <span class="w-1.5 h-1.5 rounded-full bg-white shrink-0 animate-ping"></span>
      <span class="tracking-tight">${props.id}</span>
      <span class="opacity-50">•</span>
      <span class="tracking-tight">${priceStr || 'Đã thuê'}</span>
    `;
  }

  if (isVacant) {
    // Chỉ hiển thị chấm xanh + Giá tiền ngắn gọn (ví dụ: 1.2 tr) -> Siêu gọn, không chạm nhau!
    return `
      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
      <span class="tracking-tight text-slate-900">${priceStr}</span>
    `;
  }

  // Thửa đã thuê: Chấm xám + Mã thửa siêu gọn
  return `
    <span class="w-1 h-1 rounded-full bg-slate-400/80 shrink-0"></span>
    <span class="tracking-tight">${props.id}</span>
  `;
}

export default function MarketplaceInteractiveMap({
  plotsData = FARMS_GEOJSON_DATA,
  selectedPlot = null,
  onSelectPlot,
  onResetView
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const markerNodesRef = useRef(new Map());
  const isFirstRenderRef = useRef(true);

  // Khởi tạo bản đồ vệ tinh ESRI với MapLibre GL JS tại toạ độ thực của trang trại
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'satellite-tiles': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256
          }
        },
        layers: [
          {
            id: 'satellite',
            type: 'raster',
            source: 'satellite-tiles',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: FARM_GPS_BOUNDS.center, // [106.350258, 10.687662]
      zoom: 15.1,
      pitch: 35,
      bearing: -8
    });

    mapRef.current = map;

    map.on('load', () => {
      // 1. Thêm nguồn & Layer ranh giới toàn bộ khu đất (Từ 4 mốc GPS)
      map.addSource('farm-boundary', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [FARM_GPS_BOUNDS.polygon]
          }
        }
      });

      // Viền ranh giới tổng khu đất (Đường viền màu vàng/cam nét đứt nổi bật)
      map.addLayer({
        id: 'farm-boundary-line',
        type: 'line',
        source: 'farm-boundary',
        paint: {
          'line-color': '#F59E0B',
          'line-width': 2.5,
          'line-dasharray': [3, 2],
          'line-opacity': 0.95
        }
      });

      // 2. Thêm nguồn dữ liệu GeoJSON các thửa đất đã được chia lưới chính xác
      map.addSource('plots', {
        type: 'geojson',
        data: plotsData
      });

      // 3. Layer fill trong suốt - Chỉ dùng làm vùng click/hover, KHÔNG hiển thị màu
      map.addLayer({
        id: 'plots-fill',
        type: 'fill',
        source: 'plots',
        paint: {
          'fill-color': 'rgba(0, 0, 0, 0)',
          'fill-opacity': 0
        }
      });

      // 3b. Layer fill hover - Chỉ hiện khi rê chuột vào 1 thửa cụ thể
      map.addLayer({
        id: 'plots-fill-hover',
        type: 'fill',
        source: 'plots',
        paint: {
          'fill-color': 'rgba(16, 185, 129, 0.20)',
          'fill-opacity': 1
        },
        filter: ['==', 'id', '']
      });

      // 4. Layer viền polygon nét đứt mỏng giữa các thửa - Không gây sọc
      map.addLayer({
        id: 'plots-outline',
        type: 'line',
        source: 'plots',
        paint: {
          'line-color': 'rgba(255, 255, 255, 0.55)',
          'line-width': 1,
          'line-dasharray': [4, 3],
          'line-opacity': 1
        }
      });

      // 5a. Layer glow mờ phía ngoài thửa được chọn (tạo hiệu ứng phát sáng)
      map.addLayer({
        id: 'plots-selected-glow',
        type: 'line',
        source: 'plots',
        paint: {
          'line-color': '#34D399',
          'line-width': 8,
          'line-opacity': 0.4,
          'line-blur': 4
        },
        filter: ['==', 'id', selectedPlot?.id || 'P-01']
      });

      // 5b. Layer viền sắc nét thửa được chọn
      map.addLayer({
        id: 'plots-selected-border',
        type: 'line',
        source: 'plots',
        paint: {
          'line-color': '#10B981',
          'line-width': 2.5,
          'line-opacity': 1
        },
        filter: ['==', 'id', selectedPlot?.id || 'P-01']
      });

      // 5c. Layer fill highlight nhẹ cho thửa đang chọn
      map.addLayer({
        id: 'plots-selected-fill',
        type: 'fill',
        source: 'plots',
        paint: {
          'fill-color': 'rgba(16, 185, 129, 0.15)',
          'fill-opacity': 1
        },
        filter: ['==', 'id', selectedPlot?.id || 'P-01']
      });

      // 6. Thêm HTML badge nhãn mã thửa nổi trên tâm mỗi thửa đất - Phong cách sàn TMĐT (Airbnb / BĐS)
      markerNodesRef.current.clear();
      plotsData.features.forEach((f) => {
        const coords = f.geometry.coordinates[0];
        const centerLng = (coords[0][0] + coords[1][0] + coords[2][0] + coords[3][0]) / 4;
        const centerLat = (coords[0][1] + coords[1][1] + coords[2][1] + coords[3][1]) / 4;

        const isCurrentSelected = (selectedPlot?.id || 'P-01') === f.properties.id;

        const wrapper = document.createElement('div');
        wrapper.className = 'select-none pointer-events-auto';

        const badge = document.createElement('div');
        badge.className = getBadgeClassName(f.properties, isCurrentSelected);
        badge.innerHTML = renderBadgeContent(f.properties, isCurrentSelected);

        badge.onclick = (e) => {
          e.stopPropagation();
          onSelectPlot?.(f.properties);
        };

        wrapper.appendChild(badge);

        const marker = new maplibregl.Marker({ element: wrapper })
          .setLngLat([centerLng, centerLat])
          .addTo(map);

        markersRef.current.push(marker);
        markerNodesRef.current.set(f.properties.id, { badge, properties: f.properties });
      });

      // 7. Thêm 4 Marker định vị 4 toạ độ GPS góc khu đất
      const corners = [
        FARM_GPS_BOUNDS.topLeft,
        FARM_GPS_BOUNDS.topRight,
        FARM_GPS_BOUNDS.bottomLeft,
        FARM_GPS_BOUNDS.bottomRight
      ];

      corners.forEach((c) => {
        const pinWrapper = document.createElement('div');
        pinWrapper.className = 'select-none pointer-events-none flex items-center justify-center';

        const pin = document.createElement('div');
        pin.className =
          'w-2 h-2 rounded-full bg-amber-400 border border-white shadow-xs';
        pinWrapper.appendChild(pin);

        const cornerMarker = new maplibregl.Marker({ element: pinWrapper, anchor: 'center' })
          .setLngLat([c.lng, c.lat])
          .addTo(map);

        markersRef.current.push(cornerMarker);
      });

      // 8. Click vào thửa đất trên bản đồ
      map.on('click', 'plots-fill', (e) => {
        if (e.features && e.features.length > 0) {
          const plotId = e.features[0].properties.id;
          const feat = plotsData.features.find((item) => item.properties.id === plotId);
          if (feat) {
            onSelectPlot?.(feat.properties);
          }
        }
      });

      // 9. Đổi icon con trỏ + hiệu ứng hover sáng khi rê chuột
      map.on('mousemove', 'plots-fill', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features.length > 0) {
          map.setFilter('plots-fill-hover', ['==', 'id', e.features[0].properties.id]);
        }
      });
      map.on('mouseleave', 'plots-fill', () => {
        map.getCanvas().style.cursor = '';
        map.setFilter('plots-fill-hover', ['==', 'id', '']);
      });

      // 10. Tự động căn khung hình bao quát toàn bộ 16 thửa đất và 4 mốc GPS
      map.fitBounds(
        [
          [106.343656, 10.680931],
          [106.356997, 10.694331]
        ],
        {
          padding: { top: 90, bottom: 60, left: 350, right: 400 },
          bearing: -8,
          pitch: 35,
          duration: 0
        }
      );
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
    };
  }, []);

  // Xử lý khi selectedPlot thay đổi -> Highlight & Camera flyTo mượt mà
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const plotId = selectedPlot?.id || selectedPlot?.label || '';
    // Cập nhật tất cả các layer liên quan đến thửa đang chọn
    if (map.getLayer('plots-selected-border')) {
      map.setFilter('plots-selected-border', ['==', 'id', plotId]);
    }
    if (map.getLayer('plots-selected-glow')) {
      map.setFilter('plots-selected-glow', ['==', 'id', plotId]);
    }
    if (map.getLayer('plots-selected-fill')) {
      map.setFilter('plots-selected-fill', ['==', 'id', plotId]);
    }

    // Cập nhật chuyển động mượt mà của badge marker (Airbnb style)
    markerNodesRef.current.forEach((node, id) => {
      const isSel = id === plotId;
      if (node.badge && node.properties) {
        node.badge.className = getBadgeClassName(node.properties, isSel);
        node.badge.innerHTML = renderBadgeContent(node.properties, isSel);
      }
    });

    if (!plotId) return;

    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    // Tìm toạ độ của feature
    const feat = plotsData.features.find(
      (f) => f.properties.id === plotId || f.properties.code === selectedPlot?.code
    );

    if (feat) {
      const coords = feat.geometry.coordinates[0];
      const centerLng = (coords[0][0] + coords[1][0] + coords[2][0] + coords[3][0]) / 4;
      const centerLat = (coords[0][1] + coords[1][1] + coords[2][1] + coords[3][1]) / 4;

      map.flyTo({
        center: [centerLng, centerLat],
        zoom: 16.3,
        pitch: 35, // Nghiêng 35 độ tạo góc nhìn thực địa 3D
        bearing: -8, // Xoay nhẹ góc nhìn
        duration: 1200, // Thời gian lướt mượt mà 1.2s không bị khựng
        easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), // Cubic In-Out easing
        padding: { right: 380, top: 40, bottom: 40, left: 40 }, // Chừa trống chỗ cho drawer chi tiết bên phải
        essential: true
      });
    }
  }, [selectedPlot, plotsData]);

  // Điều khiển phóng to / thu nhỏ với hiệu ứng mượt
  const handleZoomIn = () => mapRef.current?.zoomIn({ duration: 350 });
  const handleZoomOut = () => mapRef.current?.zoomOut({ duration: 350 });

  // Reset về góc nhìn tổng quan trang trại
  const handleReset = () => {
    const map = mapRef.current;
    if (!map) return;

    if (map.getLayer('plots-selected-border')) {
      map.setFilter('plots-selected-border', ['==', 'id', '']);
    }
    if (map.getLayer('plots-selected-glow')) {
      map.setFilter('plots-selected-glow', ['==', 'id', '']);
    }
    if (map.getLayer('plots-selected-fill')) {
      map.setFilter('plots-selected-fill', ['==', 'id', '']);
    }

    markerNodesRef.current.forEach((node) => {
      if (node.badge && node.properties) {
        node.badge.className = getBadgeClassName(node.properties, false);
        node.badge.innerHTML = renderBadgeContent(node.properties, false);
      }
    });

    map.fitBounds(
      [
        [106.343656, 10.680931],
        [106.356997, 10.694331]
      ],
      {
        padding: { top: 90, bottom: 60, left: 350, right: 400 },
        bearing: -8,
        pitch: 35,
        duration: 1000
      }
    );

    onResetView?.();
  };

  return (
    <div className="relative w-full h-full">
      {/* 1. Canvas Bản Đồ MapLibre GL JS */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0 w-full h-full" />

      {/* 2. Điều khiển bản đồ góc phải dưới (Map Controls) */}
      <div className="absolute bottom-6 right-8 z-20 flex flex-col gap-2 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-xl p-1 shadow-lg border border-slate-100 flex flex-col">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-9 h-9 flex items-center justify-center text-slate-700 font-bold hover:bg-slate-100 rounded-lg text-lg cursor-pointer transition"
            title="Phóng to"
          >
            +
          </button>
          <div className="h-[1px] bg-slate-100 mx-1" />
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-9 h-9 flex items-center justify-center text-slate-700 font-bold hover:bg-slate-100 rounded-lg text-lg cursor-pointer transition"
            title="Thu nhỏ"
          >
            -
          </button>
        </div>
        <button
          type="button"
          onClick={handleReset}
          title="Về góc nhìn tổng quan"
          className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-100 text-base cursor-pointer transition"
        >
          🧭
        </button>
      </div>

      {/* 3. Badge hiển thị toạ độ trung tâm GPS của khu đất */}
      <div className="absolute bottom-6 left-6 z-20 hidden lg:flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-100 text-[10px] text-slate-600 font-mono font-medium pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Tọa độ khu đất: 10°41′15″N 106°21′01″E</span>
        <span className="text-slate-300">|</span>
        <span>16 Thửa đất VietGAP</span>
      </div>
    </div>
  );
}
