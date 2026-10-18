import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  ChevronRight,
  Download,
  FileText,
  LoaderCircle,
  MapPin,
  Printer,
  RefreshCw,
} from 'lucide-react';
import { getContractById, getCustomerContracts } from '../../api/contracts/contractsApi';
import { RENTAL_TERMS, RENTAL_TERMS_VERSION } from '../../data/rentalTerms';

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
  const contractNumber = contract?.contractNumber || `HD-${contract?.contractId}`;

  return (
    <article className="contract-print-document contract-mobile-fit mx-auto min-h-[1123px] w-[794px] max-w-none bg-white px-[72px] py-[64px] font-['Times_New_Roman',serif] text-[15px] leading-[1.55] text-black grayscale shadow-[0_22px_70px_rgba(0,0,0,0.18)]">
      <header>
        <div className="grid grid-cols-2 gap-8 text-center text-[13px] leading-snug">
          <div>
            <p className="font-bold uppercase">CÔNG TY TNHH FARMELY</p>
            <p className="mx-auto mt-1 w-32 border-t border-black pt-1">Số: {contractNumber}</p>
          </div>
          <div>
            <p className="font-bold uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p className="mt-1 font-bold">Độc lập - Tự do - Hạnh phúc</p>
            <div className="mx-auto mt-1.5 h-px w-40 bg-black" />
          </div>
        </div>
        <div className="mt-12 text-center">
          <h1 className="text-[22px] font-bold uppercase leading-tight">HỢP ĐỒNG THUÊ THỬA ĐẤT<br />VÀ DỊCH VỤ CANH TÁC</h1>
          <p className="mt-2 italic">Số: {contractNumber}</p>
        </div>
        <div className="mt-8 space-y-1 text-justify italic">
          <p>- Căn cứ Bộ luật Dân sự và các quy định pháp luật Việt Nam hiện hành;</p>
          <p>- Căn cứ nhu cầu thuê thửa đất canh tác của Bên B và khả năng cung cấp dịch vụ của Bên A;</p>
          <p>- Căn cứ sự tự nguyện và thỏa thuận của các bên.</p>
        </div>
        <p className="mt-5 text-justify">Hôm nay, ngày {createdDate}, chúng tôi gồm có:</p>
      </header>

      <section className="mt-4 space-y-1 text-justify">
        <p className="font-bold uppercase">BÊN CHO THUÊ VÀ CUNG CẤP DỊCH VỤ (BÊN A): CÔNG TY TNHH FARMELY</p>
        <p>Địa chỉ trụ sở: ....................................................................................................................</p>
        <p>Mã số thuế: ............................................. Điện thoại: ...........................................................</p>
        <p>Đại diện: ................................................ Chức vụ: .............................................................</p>
        <p className="pt-3 font-bold uppercase">BÊN THUÊ (BÊN B): {contract?.renterName || 'KHÁCH HÀNG FARMELY'}</p>
        <p>CCCD/Hộ chiếu số: .................................... Ngày cấp: .................... Nơi cấp: ....................</p>
        <p>Địa chỉ thường trú: ..............................................................................................................</p>
        <p>Điện thoại: {contract?.renterPhone || '................................'} &nbsp;&nbsp;&nbsp; Email: {contract?.renterEmail || '................................'}</p>
        <p className="pt-4">Sau khi bàn bạc trên tinh thần tự nguyện, bình đẳng, hai bên thống nhất ký kết Hợp đồng với các điều khoản sau:</p>
      </section>

      <section className="mt-7 break-inside-avoid">
        <h2 className="text-center font-bold uppercase">ĐIỀU 1. ĐỐI TƯỢNG VÀ NỘI DUNG HỢP ĐỒNG</h2>
        <p className="mt-2 text-justify indent-8">1.1. Bên A đồng ý cho Bên B thuê quyền sử dụng các thửa đất và cung cấp dịch vụ canh tác theo thông tin đã xác nhận trên hệ thống Farmely:</p>
        <div className="mt-3 overflow-hidden border border-black">
          <table className="w-full border-collapse text-[12px] leading-snug">
            <thead>
              <tr><th className="border-r border-black p-2">Thửa đất</th><th className="border-r border-black p-2">Diện tích/<br />Giống cây</th><th className="border-r border-black p-2">Hình thức</th><th className="border-r border-black p-2">Thời hạn canh tác</th><th className="p-2 text-right">Thành tiền</th></tr>
            </thead>
            <tbody>
              {rentals.map((rental) => (
                <tr key={rental.rentalId || rental.plotId} className="border-t border-black align-top">
                  <td className="border-r border-black p-2 font-bold">{rental.plotCode || `Plot ${rental.plotId}`}</td>
                  <td className="border-r border-black p-2">{rental.plotArea ? `${rental.plotArea} m²` : '—'}<br />{rental.varietyName || '—'}</td>
                  <td className="border-r border-black p-2">{rental.cultivationMode === 'SELF_GROWING' ? 'Tự canh tác' : 'Farmely hỗ trợ'}</td>
                  <td className="border-r border-black p-2">Từ {formatDate(rental.startDate)}<br />đến {formatDate(rental.endDate)}</td>
                  <td className="p-2 text-right">{currency.format(Number(rental.totalPrice || 0))}</td>
                </tr>
              ))}
              {!rentals.length && <tr><td colSpan="5" className="border-t border-black p-4 text-center">Chưa có dữ liệu thửa đất trong hợp đồng.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-justify indent-8">1.2. Bên B chỉ sử dụng thửa đất đúng mục đích, giống cây và phương thức canh tác đã đăng ký; không được chuyển giao cho bên thứ ba khi chưa có chấp thuận bằng văn bản của Bên A.</p>
      </section>

      <section className="mt-6 space-y-5 text-justify">
        {RENTAL_TERMS.slice(1).map(({ title, content }, index) => (
          <div key={title} className="break-inside-avoid">
            <h2 className="text-center font-bold uppercase">{title}</h2>
            <p className="mt-1 indent-8">{index + 2}.1. {content}</p>
          </div>
        ))}
        <div className="break-inside-avoid">
          <h2 className="text-center font-bold uppercase">ĐIỀU 10. GIÁ TRỊ VÀ HIỆU LỰC HỢP ĐỒNG</h2>
          <p className="mt-1 indent-8">10.1. Tổng giá trị Hợp đồng: <strong>{currency.format(Number(contract?.totalAmount || 0))}</strong> (đã bao gồm các khoản thể hiện trên đơn đặt thuê).</p>
          <p className="indent-8">10.2. Hợp đồng có hiệu lực kể từ khi giao dịch được xác nhận thành công trên Farmely và chấm dứt khi các bên hoàn thành toàn bộ nghĩa vụ.</p>
          <p className="indent-8">10.3. Hợp đồng được lập thành 02 (hai) bản có giá trị pháp lý như nhau; mỗi bên giữ 01 (một) bản. Bản điện tử được lưu tại tài khoản khách hàng.</p>
        </div>
      </section>

      <footer className="mt-10 grid grid-cols-2 gap-14 break-inside-avoid text-center">
        <div><p className="font-bold uppercase">ĐẠI DIỆN BÊN A</p><p className="italic">(Ký, ghi rõ họ tên và đóng dấu)</p><div className="h-28" /><p className="font-bold">ĐẠI DIỆN FARMELY</p></div>
        <div><p className="font-bold uppercase">BÊN B</p><p className="italic">(Ký và ghi rõ họ tên)</p><div className="h-28" /><p className="font-bold">{contract?.renterName || 'KHÁCH HÀNG FARMELY'}</p></div>
      </footer>
      <p className="mt-12 border-t border-black pt-2 text-center text-[10px] italic">Hợp đồng điện tử được tạo từ dữ liệu trên hệ thống Farmely · Mã hồ sơ {contract?.contractId || '—'} · Phiên bản {RENTAL_TERMS_VERSION} · Trạng thái: {getStatus(contract).label}</p>
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
              const rentals = Array.isArray(contract.rentals) ? contract.rentals : [];
              const plotCodes = rentals.map((rental) => rental.plotCode).filter(Boolean);
              const startDates = rentals.map((rental) => rental.startDate).filter(Boolean).sort();
              const endDates = rentals.map((rental) => rental.endDate).filter(Boolean).sort();
              const contractStartDate = startDates[0];
              const contractEndDate = endDates[endDates.length - 1];
              return <button key={contract.contractId} onClick={() => setSelectedId(contract.contractId)} className={`w-full rounded-2xl border p-4 text-left transition ${selected ? 'border-[#1f6b4f] bg-[#eef6f0] shadow-sm' : 'border-[#e0e5df] bg-white hover:border-[#9eb3a6]'}`}>
                <div className="flex items-start justify-between gap-2"><span className="font-mono text-xs font-black text-[#1f6b4f]">{contract.contractNumber || `HD-${contract.contractId}`}</span><ChevronRight className={`h-4 w-4 ${selected ? 'text-[#1f6b4f]' : 'text-stone-300'}`} /></div>
                <div className="mt-3 flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${status.className}`}>{status.label}</span><span className="text-[10px] text-stone-400">{formatDate(contract.createdAt)}</span></div>
                <div className="mt-3 space-y-1.5 text-xs text-stone-600"><p className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1f6b4f]" /><span className="min-w-0 font-semibold">{plotCodes.length ? plotCodes.join(', ') : `${rentals.length} thửa đất`}</span>{rentals.length > 1 && <span className="shrink-0 rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] font-bold text-[#1f6b4f]">{rentals.length} thửa</span>}</p><p className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#1f6b4f]" />{contractStartDate && contractEndDate ? `${formatDate(contractStartDate)} – ${formatDate(contractEndDate)}` : 'Chưa có thời hạn'}</p></div>
                <p className="mt-3 border-t border-[#dce4dc] pt-3 text-sm font-black text-[#20332a]">{currency.format(Number(contract.totalAmount || 0))}</p>
              </button>;
            })}
          </div>
          {selectedContract && ['ACTIVE', 'CONFIRMED'].includes(selectedContract.status) && <button onClick={onRenew} className="mt-4 w-full rounded-xl border border-[#1f6b4f] px-4 py-2.5 text-xs font-bold text-[#1f6b4f] hover:bg-[#eef6f0]">Yêu cầu gia hạn</button>}
        </aside>

        <main className="relative overflow-auto bg-[#e3e7e1] p-3 sm:p-7">
          {detailLoading && <div className="absolute inset-0 z-10 flex items-start justify-center bg-[#e3e7e1]/70 pt-28 backdrop-blur-[1px]"><span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-stone-600 shadow"><LoaderCircle className="h-4 w-4 animate-spin" />Đang mở tài liệu</span></div>}
          {selectedContract?.contractDocumentUrl ? (
            <iframe title={`Hợp đồng ${selectedContract.contractNumber}`} src={selectedContract.contractDocumentUrl} className="mx-auto min-h-[1120px] w-full max-w-[794px] border-0 bg-white grayscale shadow-xl" />
          ) : selectedContract ? <ContractDocument contract={selectedContract} /> : null}
        </main>
      </div>
    </section>
  );
}
