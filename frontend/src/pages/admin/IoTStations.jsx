import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { iotStationsData as initialStations } from '../../data/iotStations';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { 
  Radio, 
  Activity, 
  Thermometer, 
  Droplets, 
  BatteryCharging, 
  Wifi, 
  Plus, 
  Eye, 
  Settings, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

export default function IoTStations() {
  const [stations, setStations] = useState(initialStations);
  const [selectedStation, setSelectedStation] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isLiveDb, setIsLiveDb] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeMode, setActiveMode] = useState('normal');
  const [lastSyncTime, setLastSyncTime] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchStations = async (silent = false) => {
    try {
      const res = await fetch('/api/iot-stations');
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
        setStations(json.data);
        setIsLiveDb(true);
        setLastSyncTime(new Date().toLocaleTimeString('vi-VN'));
        if (selectedStation) {
          const updated = json.data.find(s => s.id === selectedStation.id);
          if (updated) setSelectedStation(updated);
        }
      }
    } catch (err) {
      if (!silent) console.warn('Could not fetch live IoT stations:', err);
    }
  };

  useEffect(() => {
    fetchStations();

    // 1. Luồng SSE thời gian thực nhận biến động trực tiếp từ server mỗi khi có chu kỳ 10s mới ghi DB
    let es = null;
    try {
      if (typeof window !== 'undefined' && typeof EventSource !== 'undefined') {
        es = new EventSource('/api/sensors/plots/all/stream');
        
        const handleBulkUpdate = (event) => {
          try {
            const newReadings = JSON.parse(event.data);
            if (Array.isArray(newReadings) && newReadings.length > 0) {
              setStations((prev) => {
                return prev.map((station) => {
                  const match = newReadings.find((r) => 
                    String(r.plotId) === String(station.plotId) ||
                    String(r.plotCode).toUpperCase() === String(station.plotCode).toUpperCase() ||
                    station.id === `IOT-${r.plotCode}`
                  );
                  if (!match) return station;
                  const tNum = typeof match.temperature === 'number' ? match.temperature.toFixed(2) : match.temperature;
                  const sNum = typeof match.soilHumidity === 'number' ? match.soilHumidity.toFixed(2) : match.soilHumidity;
                  const aNum = typeof match.airHumidity === 'number' ? match.airHumidity.toFixed(2) : match.airHumidity;
                  return {
                    ...station,
                    lastSeen: 'Vừa xong',
                    readings: {
                      ...station.readings,
                      temperature: `${tNum}°C`,
                      soilMoisture: `${sNum}%`,
                      humidity: `${aNum}%`,
                      airHumidity: `${aNum}%`,
                      lastUpdate: new Date(match.recordedAt || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    }
                  };
                });
              });
              setIsLiveDb(true);
              setLastSyncTime(new Date().toLocaleTimeString('vi-VN'));
            }
          } catch (e) {
            console.warn('[Admin IoT SSE] Parse error:', e);
          }
        };

        es.addEventListener('SENSOR_ALL_UPDATE', handleBulkUpdate);
        es.addEventListener('CONNECTED', () => {
          setIsLiveDb(true);
        });
      }
    } catch (e) {
      console.warn('[Admin IoT SSE] Could not start EventSource:', e);
    }

    // 2. Định kỳ 10 giây refetch dữ liệu toàn diện (đồng bộ chính xác cùng nhịp với Dashboard)
    const interval = setInterval(() => {
      fetchStations(true);
    }, 10000);

    // 3. Lắng nghe BroadcastChannel & Storage Event từ các tab khác (Customer / Expert / Staff)
    let bc = null;
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        bc = new BroadcastChannel('farmely_iot_telemetry');
        bc.onmessage = () => {
          fetchStations(true);
        };
      }
    } catch {
      // ignore
    }

    const handleStorage = (e) => {
      if (e.key === 'farmely_iot_sync_ping') {
        fetchStations(true);
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (es) es.close();
      clearInterval(interval);
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleSimulate = async (mode = 'normal', plotId = null) => {
    setIsSimulating(true);
    setActiveMode(mode);
    try {
      const query = new URLSearchParams();
      if (mode) query.set('mode', mode);
      if (plotId) query.set('plotId', String(plotId));

      const res = await fetch(`/api/iot-stations/simulate?${query.toString()}`, {
        method: 'POST'
      });
      const result = await res.json();
      if (result && result.success) {
        await fetchStations(true);
        // Broadcast across tabs so Customer Dashboard updates immediately
        try {
          if (typeof window !== 'undefined') {
            if (window.BroadcastChannel) {
              const bc = new BroadcastChannel('farmely_iot_telemetry');
              bc.postMessage({ type: 'TELEMETRY_UPDATED', plotId, mode, count: result.count, timestamp: Date.now() });
              bc.close();
            }
            localStorage.setItem('farmely_iot_sync_ping', String(Date.now()));
          }
        } catch (e) {
          // ignore
        }
        let msg = `Đã ghi nhận ${result.count || 17} chu kỳ đo đạc mới vào PostgreSQL!`;
        if (mode === 'alert_flood') {
          msg = '💧 Đã kích hoạt mô phỏng Ngập Úng (Độ ẩm ≥ 80% — Tự động hoãn tưới theo BR18)';
        } else if (mode === 'alert_dry') {
          msg = '☀️ Đã kích hoạt mô phỏng Khô Hạn (Độ ẩm < 50% — Kích hoạt cảnh báo khẩn theo BR18)';
        }
        setFeedbackMsg(msg);
        setTimeout(() => setFeedbackMsg(''), 4500);
      }
    } catch (err) {
      console.error('Simulation error:', err);
      setFeedbackMsg('Không thể ghi nhận dữ liệu vào PostgreSQL.');
      setTimeout(() => setFeedbackMsg(''), 4000);
    } finally {
      setIsSimulating(false);
    }
  };



  const columns = [
    {
      header: 'Mã Trạm & Tên Trạm',
      key: 'name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-black bg-brand-cream text-brand-dark px-1.5 py-0.5 rounded border border-brand-border">
            {row.id}
          </span>
          <p className="font-bold text-brand-dark text-xs mt-1">{row.name}</p>
        </div>
      )
    },
    {
      header: 'Thửa Đất Gắn Liền',
      key: 'plotName',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-mono text-[11px] font-bold text-brand-green">{row.plotCode}</span>
          <p className="text-xs text-stone-600 truncate max-w-xs">{row.plotName}</p>
        </div>
      )
    },
    {
      header: 'Độ Ẩm Đất',
      key: 'soilMoisture',
      render: (row) => {
        const val = parseFloat(row.readings.soilMoisture);
        const isFlood = val >= 80;
        const isDry = val < 50;
        return (
          <div>
            <span className={`font-mono font-bold text-xs flex items-center gap-1 ${
              isFlood ? 'text-sky-700 font-extrabold' : isDry ? 'text-amber-700 font-extrabold' : 'text-brand-green'
            }`}>
              <Droplets className={`w-3.5 h-3.5 ${isFlood ? 'text-sky-600 animate-pulse' : isDry ? 'text-amber-600' : 'text-sky-500'}`} />
              {row.readings.soilMoisture}
            </span>
            {isFlood && (
              <span className="inline-block mt-0.5 text-[9px] font-bold text-sky-800 bg-sky-100/90 px-1.5 py-0.2 rounded border border-sky-300">
                BR18: Hoãn tưới
              </span>
            )}
            {isDry && (
              <span className="inline-block mt-0.5 text-[9px] font-bold text-amber-800 bg-amber-100/90 px-1.5 py-0.2 rounded border border-amber-300">
                BR18: Cảnh báo
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Nhiệt Độ',
      key: 'temperature',
      render: (row) => (
        <span className="font-mono font-semibold text-brand-dark text-xs flex items-center gap-1">
          <Thermometer className="w-3.5 h-3.5 text-rose-500" />
          {row.readings.temperature}
        </span>
      )
    },
    {
      header: 'Độ Ẩm Khí',
      key: 'humidity',
      render: (row) => (
        <span className="font-mono text-xs text-stone-600 flex items-center gap-1">
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          {row.readings.humidity || row.readings.airHumidity || '74%'}
        </span>
      )
    },
    {
      header: 'Lần Cuối Báo Cáo',
      key: 'lastSeen',
      render: (row) => (
        <span className="text-[11px] text-stone-500 font-medium">
          {row.lastSeen}
        </span>
      )
    },
    {
      header: 'Trạng Thái',
      key: 'status',
      sortable: true,
      render: (row) => <Badge variant={row.status} size="sm">{row.status}</Badge>
    },
    {
      header: 'Thao Tác',
      key: 'actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedStation(row)}
            className="p-1.5 text-stone-500 hover:text-brand-green hover:bg-stone-100 rounded-lg transition-colors"
            title="Xem chi tiết trạm"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedStation(row);
              setShowConfigModal(true);
            }}
            className="p-1.5 text-stone-500 hover:text-amber-600 hover:bg-stone-100 rounded-lg transition-colors"
            title="Cấu hình trạm"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Simulation Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-brand-border shadow-2xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-brand-green uppercase tracking-wider">
              Thực thể: IoT Station (Telemetry Master Configuration)
            </span>
            {isLiveDb && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live DB: {stations.length} Trạm cảm biến (Realtime 10s)</span>
              </span>
            )}
            {lastSyncTime && (
              <span className="text-[11px] text-emerald-700 font-mono bg-emerald-50/70 px-2 py-0.5 rounded border border-emerald-200/60 font-semibold">
                Đồng bộ: {lastSyncTime}
              </span>
            )}
          </div>
          <h2 className="text-2xl font-heading font-black text-brand-dark mt-1">
            Trạm Cảm Biến Môi Trường IoT
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Cấu hình thiết bị trạm vi khí hậu gắn trên từng thửa đất. Quản trị chu kỳ 3 giờ và kiểm soát ngưỡng an toàn sinh học.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => {
              alert('Mở form gắn trạm cảm biến mới');
            }}
          >
            Thêm Trạm
          </Button>
        </div>
      </div>

      {/* Real-time Feedback Banner */}
      {feedbackMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold shadow-2xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      <DataTable
        columns={columns}
        data={stations}
        searchPlaceholder="Tìm kiếm theo mã trạm, thửa đất..."
      />

      {/* Station Detail Modal */}
      {selectedStation && (
        <Modal
          isOpen={!!selectedStation}
          onClose={() => {
            setSelectedStation(null);
            setShowConfigModal(false);
          }}
          title={`Chi Tiết Trạm: ${selectedStation.id}`}
          subtitle={selectedStation.name}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-brand-cream/60 border border-brand-border">
              <div>
                <span className="text-[10px] text-brand-muted uppercase font-bold block">Gắn liền với</span>
                <span className="font-bold text-brand-dark text-sm">
                  {selectedStation.plotCode} – {selectedStation.plotName}
                </span>
                <span className="text-[11px] text-stone-500 block mt-0.5">
                  Lần cuối ghi nhận: {selectedStation.readings?.lastUpdate || selectedStation.lastSeen}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={RefreshCw}
                  disabled={isSimulating}
                  onClick={() => handleSimulate(activeMode, selectedStation.plotId)}
                >
                  {isSimulating ? 'Đang đo...' : 'Đo Lại Thửa Này'}
                </Button>
                <Badge variant={selectedStation.status} size="md">
                  {selectedStation.status}
                </Badge>
              </div>
            </div>

            {/* Quick telemetry readings */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-white border border-brand-border shadow-2xs">
                <span className="text-[10px] text-brand-muted uppercase font-bold block">Độ ẩm đất</span>
                <span className="text-lg font-mono font-bold text-brand-green mt-1 block">
                  {selectedStation.readings.soilMoisture}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-brand-border shadow-2xs">
                <span className="text-[10px] text-brand-muted uppercase font-bold block">Nhiệt độ</span>
                <span className="text-lg font-mono font-bold text-brand-dark mt-1 block">
                  {selectedStation.readings.temperature}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-brand-border shadow-2xs">
                <span className="text-[10px] text-brand-muted uppercase font-bold block">Độ ẩm khí</span>
                <span className="text-lg font-mono font-bold text-stone-700 mt-1 block">
                  {selectedStation.readings.humidity || selectedStation.readings.airHumidity || '74%'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-brand-border shadow-2xs">
                <span className="text-[10px] text-brand-muted uppercase font-bold block">Độ pH đất</span>
                <span className="text-lg font-mono font-bold text-emerald-800 mt-1 block">
                  {selectedStation.readings.soilPh || "6.5"}
                </span>
              </div>
            </div>

            {/* Hardware & Diagnostics */}
            <div className="space-y-3">
              <h4 className="font-heading text-xs font-bold text-brand-dark uppercase tracking-wider">
                Thông Số Phần Cứng & Kết Nối Mạng
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-brand-cream/40 border border-brand-border flex items-center justify-between">
                  <span className="text-stone-600 flex items-center gap-1.5">
                    <BatteryCharging className="w-4 h-4 text-emerald-600" />
                    Dung lượng Pin Solar:
                  </span>
                  <strong className="font-mono text-brand-dark">{selectedStation.batteryLevel || '96%'}</strong>
                </div>
                <div className="p-3 rounded-xl bg-brand-cream/40 border border-brand-border flex items-center justify-between">
                  <span className="text-stone-600 flex items-center gap-1.5">
                    <Wifi className="w-4 h-4 text-brand-green" />
                    Tín hiệu LoRaWAN:
                  </span>
                  <strong className="font-mono text-brand-dark">{selectedStation.signalStrength || 'Tốt (-62 dBm)'}</strong>
                </div>
              </div>
            </div>

            {/* Bound sensor probe types */}
            <div className="space-y-2">
              <h4 className="font-heading text-xs font-bold text-brand-dark uppercase tracking-wider">
                Danh Sách Đầu Dò Cảm Biến Tích Hợp (Sensor Probes)
              </h4>
              <div className="space-y-1.5 text-xs text-stone-700">
                {(selectedStation.sensorTypes || [
                  'Độ ẩm đất điện dung (Capacitive Soil Sensor)',
                  'Nhiệt độ & Độ ẩm không khí SHT35',
                  'Cảm biến đo độ pH đất chuyên dụng',
                  'Cảm biến bức xạ mặt trời Solar Lux'
                ]).map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 border border-stone-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-brand-border flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedStation(null);
                  setShowConfigModal(false);
                }}
              >
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
