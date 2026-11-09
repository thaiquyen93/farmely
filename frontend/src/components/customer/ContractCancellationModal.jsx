import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, AlertTriangle, ArrowRight, Ban, CheckCircle2, DollarSign, FileText, HelpCircle, Landmark, ShieldAlert, Sparkles, X } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { rentalApi } from '../../api/rental/rentalApi';

const BANK_OPTIONS = [
  'Vietcombank (VCB)',
  'MB Bank (Ngân hàng Quân đội)',
  'Techcombank (TCB)',
  'ACB (Á Châu)',
  'VPBank (Việt Nam Thịnh Vượng)',
  'BIDV (Đầu tư & Phát triển)',
  'VietinBank (Công thương)',
  'Agribank (Nông nghiệp & PTNT)',
  'TPBank (Tiên Phong)',
  'Khác (Chuyển khoản liên ngân hàng 24/7)'
];

/** Parse 'YYYY-MM-DD' hoặc 'DD/MM/YYYY' thành Date object */
function parseDateFlexible(dateStr) {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  const s = String(dateStr).trim();
  if (s.includes('/')) {
    const parts = s.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
  }
  return new Date(s);
}

export default function ContractCancellationModal({
  isOpen,
  onClose,
  contract,
  onSuccess
}) {
  const [reason, setReason] = useState('');
  const [bankName, setBankName] = useState(BANK_OPTIONS[0]);
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  // Tính toán thời gian và mốc khấu trừ hoàn tiền theo BR10
  const calculation = useMemo(() => {
    if (!contract) return null;

    const totalAmount = Number(contract.totalAmount);
    if (!contract.startDate || !Number.isFinite(totalAmount) || totalAmount <= 0) return null;
    const startDateObj = parseDateFlexible(contract.startDate || contract.start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startMidnight = new Date(startDateObj);
    startMidnight.setHours(0, 0, 0, 0);

    const diffMs = startMidnight.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Mốc 1: Trước >= 3 ngày (Khấu trừ 20%, hoàn 80%)
    if (diffDays >= 3) {
      return {
        tier: 'EARLY',
        diffDays,
        deductionRate: 0.20,
        refundRate: 0.80,
        deductionAmount: totalAmount * 0.20,
        refundAmount: totalAmount * 0.80,
        badgeLabel: `Hủy trước ngày bắt đầu ${diffDays} ngày (Hoàn 80%)`,
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        note: 'Theo chính sách hoàn hủy: Thông báo trước ngày bắt đầu ≥ 3 ngày, hệ thống khấu trừ 20% phí giữ chỗ và quản trị, hoàn trả 80% số tiền đã thanh toán.',
        canRefund: true
      };
    }

    // Mốc 2: Sát ngày (< 3 ngày nhưng chưa đến ngày bắt đầu) (Khấu trừ 50%, hoàn 50%)
    if (diffDays > 0 && diffDays < 3) {
      return {
        tier: 'LATE',
        diffDays,
        deductionRate: 0.50,
        refundRate: 0.50,
        deductionAmount: totalAmount * 0.50,
        refundAmount: totalAmount * 0.50,
        badgeLabel: `Hủy sát ngày bắt đầu (${diffDays} ngày trước) (Hoàn 50%)`,
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        note: 'Theo chính sách hoàn hủy: Thông báo sát ngày (< 3 ngày), nông trại đã chuẩn bị giống và phân bón ban đầu; khấu trừ 50% chi phí chuẩn bị, hoàn trả 50% số tiền.',
        canRefund: true
      };
    }

    // Mốc 3: Đã đến hoặc quá ngày bắt đầu (Đã canh tác - Không hoàn tiền)
    return {
      tier: 'ACTIVE',
      diffDays,
      deductionRate: 1.00,
      refundRate: 0.00,
      deductionAmount: totalAmount,
      refundAmount: 0,
      badgeLabel: 'Đã bước vào giai đoạn canh tác (Khấu trừ 100% - Không hoàn tiền)',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      note: 'Theo chính sách: Thửa đất đã bước vào vụ canh tác thực địa (cây giống đã gieo trồng, nhân sự đã thi công làm đất và chăm sóc). Chấm dứt hợp đồng sớm sẽ không được hoàn tiền thuê. Thửa đất sẽ chuyển sang quy trình bảo dưỡng phơi ải 4 ngày.',
      canRefund: false
    };
  }, [contract]);

  if (!isOpen || !contract) return null;

  if (!calculation) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Thông Báo Hợp Đồng" maxWidth="max-w-md">
        <div className="p-4 text-sm text-rose-700">
          Chưa có đủ ngày bắt đầu hoặc số tiền hợp đồng để tính hoàn tiền. Vui lòng tải lại trang và thử lại.
        </div>
      </Modal>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (reason.trim().length < 10) {
      setErrorMsg('Vui lòng nhập lý do hủy hợp đồng tối thiểu 10 ký tự (Quy định SRS V8.1).');
      return;
    }

    if (calculation.canRefund) {
      if (!bankAccountNumber.trim() || !bankAccountName.trim()) {
        setErrorMsg('Vui lòng cung cấp đầy đủ Số tài khoản và Tên chủ tài khoản nhận hoàn tiền.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const contractId = Number(contract.contractId);
      const cancelledBy = Number(contract.cancelledBy);
      if (!Number.isInteger(contractId) || contractId <= 0 || !Number.isInteger(cancelledBy) || cancelledBy <= 0) {
        throw new Error('Thiếu mã hợp đồng hoặc thông tin người yêu cầu. Vui lòng tải lại trang.');
      }
      const payload = {
        contractId,
        cancelledBy,
        reason: reason.trim(),
        bankName: calculation.canRefund ? bankName : null,
        bankAccountNumber: calculation.canRefund ? bankAccountNumber.trim() : null,
        bankAccountName: calculation.canRefund ? bankAccountName.trim() : null
      };
      const data = await rentalApi.requestCancellation(payload);
      setSuccessData({
        ...data,
        ticketId: `CNC-${String(data.cancellationId).padStart(3, '0')}`,
        refundAmount: Number(data.refundAmount ?? calculation.refundAmount),
        deductionRate: 1 - Number(data.refundPercentage ?? calculation.refundRate * 100) / 100
      });

      // Phát tín hiệu đồng bộ real-time sang trang Admin Dashboard ngay lập tức (không cần F5)
      try {
        const syncPayload = {
          type: 'CANCELLATION_REQUEST_CREATED',
          cancellationId: data.cancellationId,
          contractId: payload.contractId,
          plotCode: contract.plotCode || 'P-01',
          timestamp: Date.now()
        };
        const bc = new BroadcastChannel('farmely_contracts_sync');
        bc.postMessage(syncPayload);
        localStorage.setItem('farmely_cancellation_event', JSON.stringify(syncPayload));
        window.dispatchEvent(new CustomEvent('farmely_cancellation_created', { detail: syncPayload }));
      } catch (_) {}

      if (onSuccess) onSuccess(data);
    } catch (err) {
      setErrorMsg(err.message || 'Không thể gửi yêu cầu hủy hợp đồng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setReason('');
    setBankAccountNumber('');
    setBankAccountName('');
    setErrorMsg('');
    setSuccessData(null);
    setShowPolicyModal(false);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleResetAndClose} hideHeader maxWidth="max-w-2xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-brand-border/70 pb-4">
          <div className="space-y-1">
            <h2 className="font-heading text-xl font-black text-brand-dark flex items-center gap-2">
              <Ban className="h-5 w-5 text-rose-600" />
              Yêu Cầu Hủy Hợp Đồng & Quy Trình Hoàn Tiền
            </h2>
            <p className="text-xs text-stone-600">
              Chính sách hoàn tiền tự động căn cứ vào thời điểm gửi thông báo trước ngày bắt đầu canh tác.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            aria-label="Đóng hộp thoại"
            className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* View khi đã gửi thành công */}
        {successData ? (
          <div className="space-y-6 py-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-stone-900">
                Đã Tiếp Nhận Yêu Cầu Hủy Hợp Đồng!
              </h3>
              <p className="mx-auto max-w-md text-xs text-stone-600">
                Mã phiếu yêu cầu: <strong className="font-mono text-brand-green">{successData.ticketId}</strong>. 
                Ban quản trị Farmely đã nhận thông tin và sẽ xử lý hoàn tất theo đúng chính sách hoàn tiền.
              </p>
            </div>

            {/* Chi tiết kết quả hoàn hủy */}
            <div className="mx-auto max-w-md rounded-2xl border border-stone-200 bg-stone-50 p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-stone-500">Hợp đồng:</span>
                <strong className="font-mono text-stone-800">{contract.contractCode || `CTR-2026-FARM-${contract.contractId || contract.id}`}</strong>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-stone-500">Tỷ lệ khấu trừ phạt:</span>
                <span className="font-bold text-rose-600">{Math.round((successData.deductionRate || 0) * 100)}%</span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-stone-500">Số tiền hoàn trả dự kiến:</span>
                <strong className="text-sm font-black text-emerald-700">
                  {Number(successData.refundAmount || 0).toLocaleString('vi-VN')} đ
                </strong>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-stone-500">Trạng thái giải phóng thửa:</span>
                <span className="font-semibold text-amber-700">Chờ quản trị viên duyệt</span>
              </div>
            </div>

            <div className="pt-2">
              <Button variant="primary" size="md" onClick={handleResetAndClose} className="w-full sm:w-auto px-8">
                Đã hiểu & Đóng màn hình
              </Button>
            </div>
          </div>
        ) : (
          /* Form yêu cầu hủy */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Tóm tắt thông tin hợp đồng */}
            <div className="rounded-2xl border border-brand-border bg-brand-cream/30 p-4 text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border/60 pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-brand-green" />
                  <span className="font-bold text-stone-700">Mã hợp đồng:</span>
                  <span className="font-mono font-bold text-brand-dark">
                    {contract.contractCode || `CTR-2026-FARM-${contract.contractId || contract.id}`}
                  </span>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${calculation.badgeColor}`}>
                  {calculation.badgeLabel}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-stone-600 pt-1">
                <div>
                  <span className="text-stone-400 block text-[10px]">THỬA ĐẤT THUÊ</span>
                  <strong className="text-stone-800">{contract.plotName || contract.name || 'Thửa Sen Vàng A1'}</strong>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">TỔNG GIÁ TRỊ HỢP ĐỒNG</span>
                  <strong className="text-stone-800 font-mono">
                    {Number(contract.totalAmount).toLocaleString('vi-VN')} đ
                  </strong>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">NGÀY BẮT ĐẦU CANH TÁC</span>
                  <strong className="text-stone-800">
                    {contract.startDate}
                  </strong>
                </div>
              </div>
            </div>

            {/* 2. Bảng tính toán hoàn tiền */}
            <div className="rounded-2xl border border-stone-200 bg-white p-4 text-xs space-y-3">
              <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-brand-green" />
                Dự Toán Khấu Trừ & Tiền Hoàn Trả
              </h4>

              <div className="divide-y divide-stone-100 rounded-xl border border-stone-100 bg-stone-50/60 p-3 space-y-2">
                <div className="flex justify-between items-center text-stone-600 pb-1">
                  <span>Tổng tiền đã thanh toán trước (Lump-sum 100%):</span>
                  <span className="font-mono font-bold text-stone-900">
                    {Number(contract.totalAmount).toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <div className="flex justify-between items-center text-stone-600 py-1.5">
                  <span className="flex items-center gap-1 text-rose-600">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Khấu trừ phạt theo mốc thời gian ({Math.round(calculation.deductionRate * 100)}%):
                  </span>
                  <span className="font-mono font-bold text-rose-600">
                    - {calculation.deductionAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm font-black pt-2 text-stone-900">
                  <span className="text-emerald-800">Số tiền hoàn trả lại cho bạn:</span>
                  <span className="font-mono text-base text-emerald-700">
                    {calculation.refundAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              {/* Giải thích điều khoản */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-[11px] text-amber-900 flex gap-2.5">
                <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{calculation.note}</p>
              </div>
            </div>

            {/* Placeholder Chính sách hoàn tiền nằm ở trên lý do hủy hợp đồng */}
            <div
              onClick={() => setShowPolicyModal(true)}
              className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/80 hover:bg-rose-100/90 border border-rose-200/90 transition-all cursor-pointer group shadow-2xs hover:shadow-xs"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowPolicyModal(true); } }}
              title="Bấm để xem Bảng Chính Sách Hủy Đặt Chỗ & Hoàn Tiền Canh Tác"
            >
              <div className="flex items-center gap-2.5">
                <span className="rounded-full bg-rose-200/90 group-hover:bg-rose-300 px-2.5 py-1 text-[11px] font-bold text-rose-900 border border-rose-300 flex items-center gap-1.5 shrink-0 transition-colors">
                  <HelpCircle className="w-3.5 h-3.5 text-rose-700" />
                  Chính sách hoàn tiền
                </span>
                <span className="text-xs text-rose-800 font-medium">
                  Xem bảng quy định khấu trừ & hoàn cọc hợp đồng
                </span>
              </div>
              <span className="text-xs font-bold text-rose-700 group-hover:text-rose-900 underline flex items-center gap-1 shrink-0 ml-2">
                Xem chi tiết
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>

            {/* 3. Lý do hủy hợp đồng (Bắt buộc >= 10 ký tự SRS V8.1) */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <label className="font-bold text-stone-800">
                  LÝ DO HỦY HỢP ĐỒNG <span className="text-rose-500">*</span>
                </label>
                <span className={`text-[11px] font-mono ${reason.trim().length >= 10 ? 'text-emerald-600 font-bold' : 'text-stone-400'}`}>
                  {reason.trim().length}/10 ký tự tối thiểu
                </span>
              </div>
              <textarea
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Vui lòng cung cấp chi tiết lý do hủy hợp đồng (ví dụ: Chuyển công tác đột xuất, thay đổi kế hoạch gia đình...)"
                className="w-full rounded-xl border border-stone-200 p-3 text-xs text-stone-900 placeholder:text-stone-400 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
              />
            </div>

            {/* 4. Thông tin tài khoản nhận hoàn tiền (chỉ khi có tiền hoàn) */}
            {calculation.canRefund && (
              <div className="rounded-2xl border border-stone-200 bg-stone-50/60 p-4 text-xs space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-stone-800">
                  <Landmark className="h-4 w-4 text-brand-green" />
                  THÔNG TIN TÀI KHOẢN NHẬN TIỀN HOÀN TRẢ
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Ngân hàng thụ hưởng <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 bg-white p-2.5 text-xs text-stone-900 focus:border-brand-green focus:outline-none"
                    >
                      {BANK_OPTIONS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Số tài khoản <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="VD: 1029384756"
                      className="w-full rounded-xl border border-stone-200 bg-white p-2.5 text-xs text-stone-900 focus:border-brand-green focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Tên chủ tài khoản <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                      placeholder="VD: NGUYEN VAN A"
                      className="w-full rounded-xl border border-stone-200 bg-white p-2.5 text-xs text-stone-900 focus:border-brand-green focus:outline-none uppercase"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {errorMsg && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 border-t border-brand-border/70 pt-4">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleResetAndClose}
                disabled={isSubmitting}
              >
                Suy nghĩ lại / Đóng
              </Button>
              <button
                type="submit"
                disabled={isSubmitting || reason.trim().length < 10}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer ${
                  reason.trim().length >= 10 && !isSubmitting
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-sm'
                    : 'bg-stone-300 text-stone-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <span>Đang xử lý yêu cầu...</span>
                ) : (
                  <>
                    <Ban className="h-4 w-4" />
                    <span>Xác Nhận Gửi Yêu Cầu Hủy</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>

    {/* MODAL BẢNG CHÍNH SÁCH HỦY ĐẶT CHỖ & HOÀN TIỀN CANH TÁC (BR10) - NẰM TRÊN CÙNG QUA PORTAL */}
    {showPolicyModal && typeof document !== 'undefined' && createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
        <div
          className="fixed inset-0"
          onClick={() => setShowPolicyModal(false)}
          aria-hidden="true"
        />
        <div
          className="relative z-10 bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5 text-left max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between border-b border-stone-200 pb-3">
            <div className="space-y-1">
              <h3 className="text-lg font-heading font-black text-stone-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-brand-green" />
                Chính Sách Hủy Đặt Chỗ & Hoàn Tiền Canh Tác
              </h3>
              <p className="text-xs text-stone-500">
                Quy tắc khấu trừ và hoàn tiền tự động theo tiêu chuẩn hợp đồng BR10 của Farmely
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPolicyModal(false)}
              className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-stone-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-700 font-bold">
                  <th className="py-3.5 px-4 w-1/4">Mốc thời gian gửi yêu cầu</th>
                  <th className="py-3.5 px-3 text-center w-1/8">Tỷ lệ khấu trừ</th>
                  <th className="py-3.5 px-3 text-center w-1/8">Tỷ lệ hoàn tiền</th>
                  <th className="py-3.5 px-4 w-1/2">Giải trình chi phí</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-600">
                <tr className="hover:bg-emerald-50/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <strong className="text-stone-900 font-black text-sm">≥ 3 ngày</strong>
                    <div className="text-[11px] text-stone-500 font-normal">(≥ 72 giờ trước ngày bắt đầu)</div>
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-stone-700 text-sm">20%</td>
                  <td className="py-3.5 px-3 text-center font-black text-emerald-600 text-sm bg-emerald-50/50">80%</td>
                  <td className="py-3.5 px-4 text-stone-600 text-xs leading-relaxed">
                    Khấu trừ phí giữ chỗ đất và chi phí quản trị vận hành hệ thống.
                  </td>
                </tr>
                <tr className="hover:bg-amber-50/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <strong className="text-stone-900 font-black text-sm">1 – 2 ngày</strong>
                    <div className="text-[11px] text-stone-500 font-normal">(Trước ngày bắt đầu sát ngày, &lt; 3 ngày)</div>
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-amber-700 text-sm">50%</td>
                  <td className="py-3.5 px-3 text-center font-black text-amber-700 text-sm bg-amber-50/50">50%</td>
                  <td className="py-3.5 px-4 text-stone-600 text-xs leading-relaxed">
                    Khấu trừ chi phí nông trại đã nhập hạt giống, phân bón lót và công làm đất ban đầu.
                  </td>
                </tr>
                <tr className="hover:bg-rose-50/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <strong className="text-stone-900 font-black text-sm">≤ 0 ngày</strong>
                    <div className="text-[11px] text-stone-500 font-normal">(Vào hoặc sau ngày bắt đầu canh tác)</div>
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-rose-700 text-sm">100%</td>
                  <td className="py-3.5 px-3 text-center font-black text-rose-600 text-sm bg-rose-50/50">0%</td>
                  <td className="py-3.5 px-4 text-stone-600 text-xs leading-relaxed">
                    Cây giống đã xuống bầu/đất, công nhân đã vào việc thực tế nên không áp dụng hoàn tiền.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowPolicyModal(false)}
              className="px-5 py-2.5 rounded-xl bg-brand-green text-white text-xs font-bold hover:bg-[#203c2c] transition cursor-pointer shadow-sm"
            >
              Đã hiểu & Đóng
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
  </>
  );
}
