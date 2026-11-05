import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  RotateCcw, 
  Clock, 
  Database, 
  User, 
  FileText, 
  KeyRound, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Code, 
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  ArrowDownToLine
} from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [overview, setOverview] = useState({
    totalLogs: 0,
    loginsCount: 0,
    passwordResetsCount: 0,
    roleChangesCount: 0,
    activitiesToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogForDetail, setSelectedLogForDetail] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchAuditData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/audit-logs').then((r) => r.json()).catch(() => ({ success: false })),
      fetch('/api/audit-logs/overview').then((r) => r.json()).catch(() => ({ success: false }))
    ])
      .then(([logsRes, ovRes]) => {
        if (logsRes && logsRes.success && Array.isArray(logsRes.data)) {
          setLogs(logsRes.data);
        }
        if (ovRes && ovRes.success && ovRes.data) {
          setOverview(ovRes.data);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAuditData();
  }, []);

  // Bộ lọc Action
  const ACTION_CATEGORIES = [
    { id: 'ALL', label: 'Tất cả hoạt động' },
    { id: 'CANCELLATION', label: 'Hợp đồng & Hoàn cọc' },
    { id: 'AUTH', label: 'Xác thực & Đăng nhập' },
    { id: 'USER', label: 'Quản trị người dùng' },
    { id: 'TASK', label: 'Hiện trường & Canh tác' }
  ];

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Lọc category
      if (filterAction === 'CANCELLATION') {
        const isCancel = ['APPROVE_CANCELLATION', 'CANCEL_REQUEST', 'CONTRACT_CONFIRM'].includes(log.action) ||
          log.entityType === 'contracts';
        if (!isCancel) return false;
      } else if (filterAction === 'AUTH') {
        const isAuth = ['AUTH_LOGIN', 'LOGIN', 'REGISTER', 'PASSWORD_RESET'].includes(log.action);
        if (!isAuth) return false;
      } else if (filterAction === 'USER') {
        const isUser = ['CHANGE_USER_STATUS', 'UPDATE_ROLE', 'LOCK_USER'].includes(log.action) ||
          log.entityType === 'users';
        if (!isUser) return false;
      } else if (filterAction === 'TASK') {
        const isTask = ['TASK_FINISH', 'CARE_TASK', 'HARVEST'].includes(log.action) ||
          log.entityType === 'care_tasks';
        if (!isTask) return false;
      }

      // Lọc từ khóa tìm kiếm
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchUser = (log.userName && log.userName.toLowerCase().includes(q)) ||
          (log.userEmail && log.userEmail.toLowerCase().includes(q));
        const matchAction = log.action && log.action.toLowerCase().includes(q);
        const matchDesc = log.description && log.description.toLowerCase().includes(q);
        const matchEntity = (log.entityType && log.entityType.toLowerCase().includes(q)) ||
          (log.entityId && String(log.entityId).toLowerCase().includes(q));
        const matchIp = log.ipAddress && log.ipAddress.toLowerCase().includes(q);
        if (!matchUser && !matchAction && !matchDesc && !matchEntity && !matchIp) {
          return false;
        }
      }

      return true;
    });
  }, [logs, filterAction, searchQuery]);

  const getActionBadge = (action) => {
    switch (action) {
      case 'APPROVE_CANCELLATION':
        return <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-rose-100 text-rose-800 border border-rose-200">DUYỆT HOÀN CỌC</span>;
      case 'CANCEL_REQUEST':
        return <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-amber-100 text-amber-900 border border-amber-200">YÊU CẦU HỦY</span>;
      case 'AUTH_LOGIN':
      case 'LOGIN':
        return <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">ĐĂNG NHẬP</span>;
      case 'CHANGE_USER_STATUS':
        return <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-purple-100 text-purple-800 border border-purple-200">ĐỔI TRẠNG THÁI</span>;
      case 'PASSWORD_RESET':
        return <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-sky-100 text-sky-800 border border-sky-200">MẬT KHẨU</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-stone-100 text-stone-700 border border-stone-200">{action}</span>;
    }
  };

  const handleCopyJson = (obj) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Điều Hành */}
      <div className="rounded-3xl border border-brand-border bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/60 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                <ShieldCheck className="h-6 w-6 stroke-[2.5]" />
              </span>
              <div>
                <h2 className="font-heading text-2xl font-black text-brand-dark">
                  Nhật Ký Vận Hành &amp; Kiểm Toán (SCR-AD-10 Audit Log)
                </h2>
                <p className="text-xs text-brand-muted mt-0.5">
                  Truy vết 100% mọi thao tác nhạy cảm: phê duyệt hủy hợp đồng, hoàn cọc VNPay, đổi trạng thái người dùng và xác thực tài khoản.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              PostgreSQL Audit Trail
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchAuditData}
              disabled={loading}
              className="text-xs font-bold gap-1.5"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </Button>
          </div>
        </div>

        {/* 4 Thẻ KPI Kiểm Toán Hệ Thống (Luồng 4) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 text-xs">
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
            <div className="flex items-center justify-between text-emerald-900 font-bold">
              <span>Tổng Số Bản Ghi</span>
              <Database className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700">{overview.totalLogs || logs.length}</p>
            <p className="text-[11px] text-stone-500">Lưu trữ bất biến trong CSDL</p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1">
            <div className="flex items-center justify-between text-rose-900 font-bold">
              <span>Hợp Đồng &amp; Hoàn Cọc</span>
              <FileText className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-black text-rose-700">
              {logs.filter(l => l.action?.includes('CANCEL') || l.entityType === 'contracts').length}
            </p>
            <p className="text-[11px] text-stone-500">Khấu trừ &amp; giải trình tài chính</p>
          </div>

          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-1">
            <div className="flex items-center justify-between text-sky-900 font-bold">
              <span>Xác Thực &amp; Đăng Nhập</span>
              <KeyRound className="w-4 h-4 text-sky-600" />
            </div>
            <p className="text-2xl font-black text-sky-700">{overview.loginsCount || 0}</p>
            <p className="text-[11px] text-stone-500">Truy cập tài khoản người dùng</p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-1">
            <div className="flex items-center justify-between text-purple-900 font-bold">
              <span>Quản Trị Người Dùng</span>
              <User className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-black text-purple-700">{overview.roleChangesCount || 0}</p>
            <p className="text-[11px] text-stone-500">Thay đổi vai trò / khóa mở User</p>
          </div>
        </div>

        {/* Thanh Công Cụ Lọc & Tìm Kiếm */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-brand-border/60">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {ACTION_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilterAction(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filterAction === cat.id
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="Tìm theo người dùng, mã hợp đồng, thao tác..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-brand-border bg-stone-50 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>
        </div>

        {/* Bảng Dữ Liệu Kiểm Toán (Audit Logs Data Table) */}
        <div className="mt-5 overflow-x-auto rounded-2xl border border-brand-border/80">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-brand-border bg-brand-cream/60 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3">Thời Gian</th>
                <th className="p-3">Người Thực Hiện</th>
                <th className="p-3">Hành Động</th>
                <th className="p-3">Đối Tượng (Entity)</th>
                <th className="p-3">Mô Tả Chi Tiết Hoạt Động</th>
                <th className="p-3">Địa Chỉ IP</th>
                <th className="p-3 text-center">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-stone-400">
                    <div className="flex items-center justify-center gap-2">
                      <RotateCcw className="w-4 h-4 animate-spin text-emerald-700" />
                      <span>Đang nạp dữ liệu kiểm toán từ CSDL PostgreSQL...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-stone-400">
                    Không tìm thấy bản ghi kiểm toán phù hợp với tiêu chí lọc.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.logId} className="hover:bg-stone-50/80 transition-colors">
                    <td className="p-3 text-stone-500 whitespace-nowrap font-mono text-[11px]">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : '—'}
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-stone-900 block">{log.userName || log.userEmail}</span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {log.userEmail} {log.userId ? `(ID: ${log.userId})` : ''}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-stone-700 whitespace-nowrap">
                      {log.entityType ? (
                        <span className="bg-stone-100 px-2 py-0.5 rounded font-bold border border-stone-200">
                          {log.entityType}{log.entityId ? ` #${log.entityId}` : ''}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="p-3 text-stone-800 leading-relaxed max-w-md">
                      <p className="font-medium">{log.description || '—'}</p>
                      {log.details?.refundAmount !== undefined && (
                        <span className="inline-block mt-0.5 text-[10px] font-bold text-rose-700">
                          💰 Hoàn tiền: {Number(log.details.refundAmount).toLocaleString('vi-VN')} đ (tỷ lệ {Math.round((log.details.refundRate || log.details.refundPercentage || 0) * (log.details.refundRate <= 1 ? 100 : 1))}%)
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedLogForDetail(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 transition cursor-pointer"
                        title="Xem chi tiết dữ liệu JSON"
                      >
                        <Code className="w-3.5 h-3.5" />
                        <span>JSON</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Xem Chi Tiết JSON Bất Biến Của Log */}
      {selectedLogForDetail && (
        <Modal
          isOpen={Boolean(selectedLogForDetail)}
          onClose={() => setSelectedLogForDetail(null)}
          title={`Chi Tiết Bản Ghi Kiểm Toán #${selectedLogForDetail.logId}`}
          subtitle={`Hành động: ${selectedLogForDetail.action} • Thực hiện bởi: ${selectedLogForDetail.userName || selectedLogForDetail.userEmail}`}
          maxWidth="max-w-2xl"
          headerVariant="green"
        >
          <div className="space-y-4 text-left">
            <div className="grid grid-cols-2 gap-3 text-xs bg-stone-50 p-3.5 rounded-xl border border-stone-200">
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Mã bản ghi (Log ID)</span>
                <strong className="font-mono text-stone-800">#{selectedLogForDetail.logId}</strong>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Thời gian ghi nhận</span>
                <strong className="font-mono text-stone-800">
                  {selectedLogForDetail.createdAt ? new Date(selectedLogForDetail.createdAt).toLocaleString('vi-VN') : '—'}
                </strong>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Người thực hiện</span>
                <strong className="text-stone-800">{selectedLogForDetail.userName} ({selectedLogForDetail.userEmail})</strong>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Thực thể ảnh hưởng</span>
                <strong className="font-mono text-stone-800">{selectedLogForDetail.entityType} #{selectedLogForDetail.entityId}</strong>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Dữ liệu chi tiết (JSONB Payload)</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyJson(selectedLogForDetail)}
                  className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  {copied ? '✓ Đã sao chép!' : 'Sao chép JSON'}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-stone-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-60 leading-relaxed">
                {JSON.stringify(selectedLogForDetail, null, 2)}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSelectedLogForDetail(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
