import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { iotStationsData as initialStations } from '../../data/iotStations';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { Radio, Activity, Thermometer, Droplets, BatteryCharging, Wifi, Plus, Eye, Settings } from 'lucide-react';

export default function IoTStations() {
  const [stations, setStations] = useState(initialStations);
  const [selectedStation, setSelectedStation] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

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
      render: (row) => (
        <span className="font-mono font-bold text-brand-green text-xs flex items-center gap-1">
          <Droplets className="w-3.5 h-3.5 text-sky-500" />
          {row.readings.soilMoisture}
        </span>
      )
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
          {row.readings.humidity}
        </span>
      )
    },
    {
      header: 'Lần Cuối Báo Cáo',
      key: 'lastSeen',
      render: (row) => (
        <span className="text-[11px] text-stone-500">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-brand-green uppercase tracking-wider">
            Thực thể: IoT Station (Telemetry Master Configuration)
          </span>
          <h2 className="text-2xl font-heading font-black text-brand-dark mt-1">
            Trạm Cảm Biến Môi Trường IoT
          </h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Cấu hình thiết bị trạm vi khí hậu gắn trên từng thửa đất. Quản trị chu kỳ 3 giờ và kiểm soát ngưỡng an toàn sinh học.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => {
            alert('Mở form gắn trạm cảm biến mới');
          }}
        >
          Thêm Trạm Cảm Biến Mới
        </Button>
      </div>

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
              </div>
              <Badge variant={selectedStation.status} size="md">
                {selectedStation.status}
              </Badge>
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
                  {selectedStation.readings.humidity}
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
                  <strong className="font-mono text-brand-dark">{selectedStation.batteryLevel}</strong>
                </div>
                <div className="p-3 rounded-xl bg-brand-cream/40 border border-brand-border flex items-center justify-between">
                  <span className="text-stone-600 flex items-center gap-1.5">
                    <Wifi className="w-4 h-4 text-brand-green" />
                    Tín hiệu LoRaWAN:
                  </span>
                  <strong className="font-mono text-brand-dark">{selectedStation.signalStrength}</strong>
                </div>
              </div>
            </div>

            {/* Bound sensor probe types */}
            <div className="space-y-2">
              <h4 className="font-heading text-xs font-bold text-brand-dark uppercase tracking-wider">
                Danh Sách Đầu Dò Cảm Biến Tích Hợp (Sensor Probes)
              </h4>
              <div className="space-y-1.5 text-xs text-stone-700">
                {selectedStation.sensorTypes?.map((s, idx) => (
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
