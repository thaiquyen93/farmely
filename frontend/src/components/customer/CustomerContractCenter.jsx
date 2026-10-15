import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  LoaderCircle,
  MapPin,
  Printer,
  RefreshCw,
  ShieldCheck,
  Sprout
} from 'lucide-react';
import { getContractById, getCustomerContracts } from '../../api/contracts/contractsApi';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const dateFormatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
};

const statusMeta = {
  ACTIVE: { label: 'Đang hiệu lực', className: 'bg-emerald-100 text-emerald-800' },
  CONFIRMED: { label: 'Đã xác nhận', className: 'bg-sky-100 text-sky-800' },
  PENDING_PAYMENT: { label: 'Chờ thanh toán', className: 'bg-amber-100 text-amber-800' },
  COMPLETED: { label: 'Đã hoàn tất', className: 'bg-stone-200 text-stone-700' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-rose-100 text-rose-700' }
};

const getStatus = (contract) => statusMeta[contract?.status] || {
  label: contract?.displayStatus || contract?.status || 'Chưa xác định',
  className: 'bg-stone-100 text-stone-700'
};

function ContractDocument({ contract }) {
  const rentals = contract?.rentals || [];
  const createdDate = formatDate(contract?.createdAt);

  return (
    <article className="contract-print-document mx-auto min-h-[1120px] w-full max-w-[794px] bg-[#fffef8] px-8 py-10 text-[#20332a] shadow-[0_22px_70px_rgba(31,53,43,0.18)] sm:px-14 sm:py-14">
      <header className="border-b-2 border-[#315f4d] pb-7 text-center">
        <div className="mb-4 flex items-center justify-center gap-2 text-[#1f6b4f]">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1f6b4f] text-white"><Sprout className="h-5 w-5" /></span>
          <span className="font-heading text-2xl font-black tracking-[0.08em]">FARMELY</span>
        </div>
        <p className="text-xs font-bold tracking-wide">NỀN TẢNG THUÊ THỬA ĐẤT VÀ THEO DÕI CANH TÁC</p>
        <h1 className="mt-7 font-heading text-2xl font-black sm:text-3xl">HỢP ĐỒNG THUÊ THỬA ĐẤT</h1>
        <p className="mt-2 font-mono text-sm font-bold text-[#1f6b4f]">Số: {contract?.contractNumber || `HD-${contract?.contractId}`}</p>
      </header>

      <section className="mt-7 grid gap-5 border-b border-[#cfD8cf] pb-7 text-sm sm:grid-cols-2">
        <div>
          <p className="mb-2 font-bold">Bên cung cấp dịch vụ (Bên A)</p>
          <p className="font-semibold">Nền tảng Farmely</p>
          <p className="mt-1 text-[#52655d]">Đơn vị quản lý và vận hành khu canh tác</p>
          <p className="mt-1 text-[#52655d]">Đại diện: Ban quản lý Farmely</p>
        </div>
        <div>
          <p className="mb-2 font-bold">Khách hàng thuê đất (Bên B)</p>
          <p className="font-semibold">{contract?.renterName || 'Khách hàng Farmely'}</p>
          <p className="mt-1 text-[#52655d]">Email: {contract?.renterEmail || '—'}</p>
          <p className="mt-1 text-[#52655d]">Điện thoại: {contract?.renterPhone || '—'}</p>
        </div>
      </section>

      <section className="mt-7">
        <h2 className="font-heading text-base font-black">Điều 1. Nội dung thuê và canh tác</h2>
        <p className="mt-2 text-sm leading-7 text-[#3f5149]">
          Bên A bàn giao quyền sử dụng các thửa đất dưới đây cho Bên B trong thời hạn đã đăng ký. Mỗi thửa được canh tác theo giống cây và hình thức chăm sóc đã xác nhận trên Farmely.
        </p>
        <div className="mt-4 overflow-hidden border border-[#b9c7be]">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-[#e8eee8] text-[#294c3b]">
              <tr><th className="p-3">Thửa đất</th><th className="p-3">Giống cây</th><th className="p-3">Hình thức</th><th className="p-3">Thời hạn</th><th className="p-3 text-right">Thành tiền</th></tr>
            </thead>
            <tbody>
              {rentals.map((rental) => (
                <tr key={rental.rentalId || rental.plotId} className="border-t border-[#d7ded8] align-top">
                  <td className="p-3 font-bold">{rental.plotCode || `Plot ${rental.plotId}`}<span className="mt-1 block font-normal text-[#687870]">{rental.plotArea ? `${rental.plotArea} m²` : ''}</span></td>
                  <td className="p-3">{rental.varietyName || '—'}</td>
                  <td className="p-3">{rental.cultivationMode === 'SELF_GROWING' ? 'Tự canh tác' : 'Farmely hỗ trợ'}</td>
                  <td className="p-3">{formatDate(rental.startDate)}<span className="block text-[#687870]">đến {formatDate(rental.endDate)}</span></td>
                  <td className="p-3 text-right font-bold">{currency.format(Number(rental.totalPrice || 0))}</td>
                </tr>
              ))}
              {!rentals.length && <tr><td colSpan="5" className="p-6 text-center text-[#687870]">Chưa có dữ liệu thửa đất trong hợp đồng.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-7 grid gap-6 text-sm sm:grid-cols-[1fr_230px]">
        <div className="space-y-5">
          <div><h2 className="font-heading font-black">Điều 2. Quyền và nghĩa vụ</h2><p className="mt-2 leading-7 text-[#3f5149]">Bên B sử dụng đúng thửa đất, giống cây và quy trình kỹ thuật đã đăng ký; theo dõi nhật ký canh tác và phản hồi kịp thời các cảnh báo trên hệ thống.</p></div>
          <div><h2 className="font-heading font-black">Điều 3. Thanh toán và hiệu lực</h2><p className="mt-2 leading-7 text-[#3f5149]">Hợp đồng có hiệu lực sau khi Farmely xác nhận thanh toán. Việc xác nhận điện tử có giá trị đối với toàn bộ nội dung hợp đồng tại thời điểm giao kết.</p></div>
          <div><h2 className="font-heading font-black">Điều 4. Thay đổi và chấm dứt</h2><p className="mt-2 leading-7 text-[#3f5149]">Gia hạn, hủy hợp đồng và hoàn tiền được xử lý theo trạng thái thuê cùng chính sách hiển thị trên nền tảng Farmely.</p></div>
        </div>
        <aside className="h-fit border border-[#9eb3a6] bg-[#f1f5ef] p-5">
          <p className="text-xs font-bold text-[#52655d]">TỔNG GIÁ TRỊ HỢP ĐỒNG</p>
          <p className="mt-2 text-2xl font-black text-[#1f6b4f]">{currency.format(Number(contract?.totalAmount || 0))}</p>
          <div className="mt-5 border-t border-[#bdcabf] pt-4 text-xs leading-6 text-[#52655d]">
            <p>Ngày lập: <strong className="text-[#20332a]">{createdDate}</strong></p>
            <p>Trạng thái: <strong className="text-[#20332a]">{getStatus(contract).label}</strong></p>
          </div>
        </aside>
      </section>

      <footer className="mt-10 grid gap-8 border-t border-[#9eb3a6] pt-7 text-center text-sm sm:grid-cols-2">
        <div><p className="font-bold">ĐẠI DIỆN BÊN A</p><p className="mt-1 text-xs text-[#687870]">Farmely xác nhận điện tử</p><div className="mx-auto mt-5 flex w-36 -rotate-3 items-center justify-center gap-2 rounded-full border-2 border-[#1f6b4f] px-3 py-2 text-xs font-black text-[#1f6b4f]"><ShieldCheck className="h-4 w-4" /> ĐÃ XÁC NHẬN</div></div>
        <div><p className="font-bold">BÊN B</p><p className="mt-1 text-xs text-[#687870]">{contract?.renterName || 'Khách hàng Farmely'}</p><p className="mt-8 font-semibold text-[#1f6b4f]"><CheckCircle2 className="mr-1 inline h-4 w-4" />Đã đồng ý điều khoản điện tử</p></div>
      </footer>
      <p className="mt-12 text-center text-[10px] text-[#7b8981]">Tài liệu được tạo từ dữ liệu hợp đồng trên hệ thống Farmely · Mã hồ sơ {contract?.contractId || '—'}</p>
    </article>
  );
}

export default function CustomerContractCenter({ renterId, onRenew }) {
  const [contracts, setContracts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');

  const loadContracts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCustomerContracts(renterId);
      setContracts(data);
      const firstId = data[0]?.contractId ?? null;
      setSelectedId((current) => data.some((item) => item.contractId === current) ? current : firstId);
      setSelectedContract(data.find((item) => item.contractId === firstId) || null);
    } catch (err) {
      setContracts([]);
      setSelectedContract(null);
      setError(err.message || 'Không thể tải danh sách hợp đồng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadContracts(); }, [renterId]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setDetailLoading(true);
    getContractById(selectedId)
      .then((data) => { if (!cancelled) setSelectedContract(data); })
      .catch((err) => { if (!cancelled) setError(err.message || 'Không thể tải chi tiết hợp đồng.'); })
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [selectedId]);

  const counts = useMemo(() => ({
    active: contracts.filter((item) => ['ACTIVE', 'CONFIRMED'].includes(item.status)).length,
    completed: contracts.filter((item) => item.status === 'COMPLETED').length
  }), [contracts]);

  const printContract = () => window.print();

  if (loading) return <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-brand-border bg-white"><LoaderCircle className="h-7 w-7 animate-spin text-brand-green" /><span className="ml-3 text-sm font-semibold text-stone-600">Đang tải hợp đồng...</span></div>;

  if (error && !contracts.length) return <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-rose-200 bg-white p-8 text-center"><AlertCircle className="h-9 w-9 text-rose-500" /><h3 className="mt-4 font-heading text-lg font-black text-brand-dark">Chưa tải được hợp đồng</h3><p className="mt-2 max-w-md text-sm text-stone-500">{error}</p><button onClick={loadContracts} className="mt-5 flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2 text-xs font-bold text-white"><RefreshCw className="h-4 w-4" />Thử lại</button></div>;

  if (!contracts.length) return <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-brand-border bg-white p-8 text-center"><FileText className="h-10 w-10 text-stone-300" /><h3 className="mt-4 font-heading text-lg font-black text-brand-dark">Chưa có hợp đồng</h3><p className="mt-2 text-sm text-stone-500">Hợp đồng sẽ xuất hiện tại đây sau khi bạn hoàn tất đặt thuê.</p></div>;

  return (
    <section className="contract-center overflow-hidden rounded-3xl border border-[#d6ded5] bg-[#eef1ea] shadow-sm">
      <header className="flex flex-col gap-4 border-b border-[#d6ded5] bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div><h2 className="font-heading text-xl font-black text-[#20332a]">Hồ sơ hợp đồng</h2><p className="mt-1 text-xs text-[#687870]">{contracts.length} hợp đồng · {counts.active} đang hiệu lực · {counts.completed} đã hoàn tất</p></div>
        <div className="flex flex-wrap gap-2">
          <button onClick={printContract} disabled={!selectedContract} className="flex items-center gap-2 rounded-xl border border-[#b9c7be] bg-white px-4 py-2 text-xs font-bold text-[#294c3b] hover:bg-[#f3f6f1] disabled:opacity-50"><Printer className="h-4 w-4" />In hợp đồng</button>
          <button onClick={printContract} disabled={!selectedContract} className="flex items-center gap-2 rounded-xl bg-[#1f6b4f] px-4 py-2 text-xs font-bold text-white hover:bg-[#18553f] disabled:opacity-50"><Download className="h-4 w-4" />Lưu PDF</button>
        </div>
      </header>

      <div className="grid min-h-[760px] lg:grid-cols-[310px_minmax(0,1fr)]">
        <aside className="border-b border-[#d6ded5] bg-white p-4 lg:border-b-0 lg:border-r">
          <p className="px-2 pb-3 text-xs font-bold text-[#687870]">Chọn hợp đồng để xem</p>
          <div className="space-y-2">
            {contracts.map((contract) => {
              const status = getStatus(contract);
              const selected = contract.contractId === selectedId;
              const firstRental = contract.rentals?.[0];
              return <button key={contract.contractId} onClick={() => setSelectedId(contract.contractId)} className={`w-full rounded-2xl border p-4 text-left transition ${selected ? 'border-[#1f6b4f] bg-[#eef6f0] shadow-sm' : 'border-[#e0e5df] bg-white hover:border-[#9eb3a6]'}`}>
                <div className="flex items-start justify-between gap-2"><span className="font-mono text-xs font-black text-[#1f6b4f]">{contract.contractNumber || `HD-${contract.contractId}`}</span><ChevronRight className={`h-4 w-4 ${selected ? 'text-[#1f6b4f]' : 'text-stone-300'}`} /></div>
                <div className="mt-3 flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${status.className}`}>{status.label}</span><span className="text-[10px] text-stone-400">{formatDate(contract.createdAt)}</span></div>
                <div className="mt-3 space-y-1.5 text-xs text-stone-600"><p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-[#1f6b4f]" />{firstRental?.plotCode || `${contract.rentals?.length || 0} thửa đất`}</p><p className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 text-[#1f6b4f]" />{firstRental ? `${formatDate(firstRental.startDate)} – ${formatDate(firstRental.endDate)}` : 'Chưa có thời hạn'}</p></div>
                <p className="mt-3 border-t border-[#dce4dc] pt-3 text-sm font-black text-[#20332a]">{currency.format(Number(contract.totalAmount || 0))}</p>
              </button>;
            })}
          </div>
          {selectedContract && ['ACTIVE', 'CONFIRMED'].includes(selectedContract.status) && <button onClick={onRenew} className="mt-4 w-full rounded-xl border border-[#1f6b4f] px-4 py-2.5 text-xs font-bold text-[#1f6b4f] hover:bg-[#eef6f0]">Yêu cầu gia hạn</button>}
        </aside>

        <main className="relative overflow-auto bg-[#e3e7e1] p-3 sm:p-7">
          {detailLoading && <div className="absolute inset-0 z-10 flex items-start justify-center bg-[#e3e7e1]/70 pt-28 backdrop-blur-[1px]"><span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-stone-600 shadow"><LoaderCircle className="h-4 w-4 animate-spin" />Đang mở tài liệu</span></div>}
          {selectedContract?.contractDocumentUrl ? (
            <iframe title={`Hợp đồng ${selectedContract.contractNumber}`} src={selectedContract.contractDocumentUrl} className="mx-auto min-h-[1120px] w-full max-w-[794px] border-0 bg-white shadow-xl" />
          ) : selectedContract ? <ContractDocument contract={selectedContract} /> : null}
        </main>
      </div>
    </section>
  );
}
