import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Crosshair, Maximize2, Minus, Plus } from 'lucide-react';

const colors = {
  AVAILABLE: { fill: 'rgba(24, 173, 109, .08)', stroke: 'rgba(221, 255, 235, .96)' },
  RENTED: { fill: 'rgba(174, 48, 36, .32)', stroke: '#ffc2b2' },
  RESERVED: { fill: 'rgba(207, 132, 18, .3)', stroke: '#ffe38a' },
  MAINTENANCE: { fill: 'rgba(99, 107, 112, .28)', stroke: '#e5e7eb' },
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const LandMap = forwardRef(function LandMap({
  land,
  plots,
  polygons,
  selectedId,
  onSelect,
  editable = false,
  drawing = false,
  draft = [],
  onMapPoint,
  heightClass = '',
}, ref) {
  const viewportRef = useRef(null);
  const panRef = useRef(null);
  const vertexRef = useRef(null);
  const pathsRef = useRef(polygons);
  const [paths, setPaths] = useState(polygons);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setPaths(polygons);
    pathsRef.current = polygons;
  }, [polygons]);

  const constrain = (next, nextZoom = zoom) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return next;
    return {
      x: clamp(next.x, rect.width * (1 - nextZoom), 0),
      y: clamp(next.y, rect.height * (1 - nextZoom), 0),
    };
  };

  const setZoomAt = (nextValue, clientX, clientY) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nextZoom = clamp(nextValue, 1, 7);
    const px = clientX ?? rect.left + rect.width / 2;
    const py = clientY ?? rect.top + rect.height / 2;
    const localX = px - rect.left;
    const localY = py - rect.top;
    const ratio = nextZoom / zoom;
    const nextOffset = constrain({
      x: localX - (localX - offset.x) * ratio,
      y: localY - (localY - offset.y) * ratio,
    }, nextZoom);
    setZoom(nextZoom);
    setOffset(nextOffset);
  };

  const resetView = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const eventToPoint = event => {
    const rect = viewportRef.current.getBoundingClientRect();
    return [
      Number(clamp(((event.clientX - rect.left - offset.x) / zoom / rect.width) * 100, 0, 100).toFixed(2)),
      Number(clamp(((event.clientY - rect.top - offset.y) / zoom / rect.height) * 100, 0, 100).toFixed(2)),
    ];
  };

  useImperativeHandle(ref, () => ({
    getSelectedPath: () => pathsRef.current[selectedId] || [],
    recenter: resetView,
    zoomIn: () => setZoomAt(zoom + 0.4),
    zoomOut: () => setZoomAt(zoom - 0.4),
    enterFullscreen: () => viewportRef.current?.requestFullscreen?.(),
  }), [selectedId, zoom, offset]);

  const handlePointerDown = event => {
    if (event.button !== 0) return;
    if (event.target.closest?.('button, a, input, select')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    panRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: offset,
      moved: false,
    };
  };

  const handlePointerMove = event => {
    if (vertexRef.current?.pointerId === event.pointerId) {
      const { plotId, index } = vertexRef.current;
      const point = eventToPoint(event);
      setPaths(current => {
        const nextPath = [...(current[plotId] || [])];
        nextPath[index] = point;
        const next = { ...current, [plotId]: nextPath };
        pathsRef.current = next;
        return next;
      });
      return;
    }
    if (!panRef.current || panRef.current.pointerId !== event.pointerId) return;
    const dx = event.clientX - panRef.current.startX;
    const dy = event.clientY - panRef.current.startY;
    if (Math.abs(dx) + Math.abs(dy) > 5) panRef.current.moved = true;
    setOffset(constrain({ x: panRef.current.origin.x + dx, y: panRef.current.origin.y + dy }));
  };

  const handlePointerUp = event => {
    if (vertexRef.current?.pointerId === event.pointerId) {
      vertexRef.current = null;
      return;
    }
    if (!panRef.current || panRef.current.pointerId !== event.pointerId) return;
    const moved = panRef.current.moved;
    panRef.current = null;
    if (drawing && !moved) onMapPoint?.(eventToPoint(event));
  };

  const selectedPath = paths[selectedId] || [];

  return <div
    ref={viewportRef}
    className={`relative touch-none overflow-hidden rounded-2xl bg-[#294c3b] shadow-lg ${heightClass}`}
    style={heightClass ? undefined : { aspectRatio: land.mapAspectRatio || '16 / 11' }}
    onWheel={event => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      setZoomAt(zoom + (event.deltaY < 0 ? 0.25 : -0.25), event.clientX, event.clientY);
    }}
    onDoubleClick={event => setZoomAt(zoom + 0.5, event.clientX, event.clientY)}
    onPointerDown={handlePointerDown}
    onPointerMove={handlePointerMove}
    onPointerUp={handlePointerUp}
    onPointerCancel={handlePointerUp}
  >
    <div
      className="absolute inset-0 select-none"
      style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, transformOrigin: '0 0', cursor: drawing ? 'crosshair' : zoom > 1 ? 'grab' : 'default' }}
    >
      <img src={land.mapImageUrl || land.imageUrl} alt={`Ảnh khu đất ${land.name}`} className="pointer-events-none absolute inset-0 h-full w-full object-fill" draggable="false" />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" role="img" aria-label="Sơ đồ các thửa đất trên ảnh vệ tinh">
        <defs><filter id="selected-plot-glow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="0" stdDeviation=".65" floodColor="#ffe071" floodOpacity="1" /></filter></defs>
        {plots.map(plot => {
          const points = paths[plot.id];
          if (!points?.length) return null;
          const color = colors[plot.status] || colors.MAINTENANCE;
          const centerX = points.reduce((sum, point) => sum + point[0], 0) / points.length;
          const centerY = points.reduce((sum, point) => sum + point[1], 0) / points.length;
          const selected = selectedId === plot.id;
          return <g key={plot.id} className={!drawing && onSelect ? 'cursor-pointer' : ''} filter={selected ? 'url(#selected-plot-glow)' : undefined} style={{ pointerEvents: drawing ? 'none' : 'auto' }} onPointerDown={event => event.stopPropagation()} onClick={() => onSelect?.(plot)}>
            <polygon points={points.map(point => point.join(',')).join(' ')} fill={selected && plot.status === 'AVAILABLE' ? 'rgba(255, 224, 113, .3)' : color.fill} stroke={selected ? '#ffe071' : color.stroke} strokeWidth={(selected ? 2.8 : 1.25) / zoom} vectorEffect="non-scaling-stroke" />
            {selected && <circle cx={centerX} cy={centerY} r={2.5 / zoom} fill="#ffe071" stroke="#173726" strokeWidth={1 / zoom} vectorEffect="non-scaling-stroke" />}
            <text x={centerX} y={centerY} textAnchor="middle" dominantBaseline="middle" fontSize={(selected ? 3 : 2.55) / Math.sqrt(zoom)} fontWeight="900" fill={selected ? '#173726' : '#fff'} stroke={selected ? 'none' : '#173726'} strokeWidth={0.18 / zoom} paintOrder="stroke">{plot.code.replace('P-', '')}</text>
          </g>;
        })}
        {draft.length > 0 && <><polygon points={draft.map(point => point.join(',')).join(' ')} fill={draft.length >= 3 ? 'rgba(255,224,113,.2)' : 'none'} stroke="#ffe071" strokeWidth={2.8 / zoom} vectorEffect="non-scaling-stroke" />{draft.map((point, index) => <circle key={index} cx={point[0]} cy={point[1]} r={0.75 / Math.sqrt(zoom)} fill="#ffe071" stroke="#173726" strokeWidth={0.4 / zoom} />)}</>}
        {editable && !drawing && selectedPath.map((point, index) => <circle
          key={`${selectedId}-${index}`}
          cx={point[0]}
          cy={point[1]}
          r={0.9 / Math.sqrt(zoom)}
          fill="#fff"
          stroke="#173726"
          strokeWidth={0.45 / zoom}
          className="cursor-move"
          onPointerDown={event => {
            event.stopPropagation();
            event.currentTarget.setPointerCapture(event.pointerId);
            vertexRef.current = { pointerId: event.pointerId, plotId: selectedId, index };
          }}
        />)}
      </svg>
    </div>

    <div className="absolute right-3 top-3 flex overflow-hidden rounded-xl bg-white shadow-lg">
      <button type="button" onClick={() => setZoomAt(zoom - .4)} disabled={zoom <= 1} className="grid h-9 w-9 place-items-center text-brand-dark disabled:opacity-35" title="Thu nhỏ"><Minus size={16} /></button>
      <button type="button" onClick={() => setZoomAt(zoom + .4)} disabled={zoom >= 7} className="grid h-9 w-9 place-items-center border-x border-brand-border text-brand-dark disabled:opacity-35" title="Phóng to"><Plus size={16} /></button>
      <button type="button" onClick={resetView} className="grid h-9 w-9 place-items-center text-brand-dark" title="Về toàn khu đất"><Crosshair size={16} /></button>
      <button type="button" onClick={() => viewportRef.current?.requestFullscreen?.()} className="grid h-9 w-9 place-items-center border-l border-brand-border text-brand-dark" title="Toàn màn hình"><Maximize2 size={16} /></button>
    </div>
    <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-[#173726]/88 px-3 py-2 text-[11px] font-semibold text-white shadow-lg">Kéo để di chuyển · Ctrl + cuộn hoặc nhấp đúp để zoom{drawing ? ' · Bấm để đặt đỉnh' : ''}</div>
    {drawing && <div className="pointer-events-none absolute left-3 top-3 rounded-xl bg-brand-yellow px-3 py-2 text-xs font-black text-brand-dark shadow-lg">Đang vẽ · {draft.length} điểm</div>}
  </div>;
});

export default LandMap;
