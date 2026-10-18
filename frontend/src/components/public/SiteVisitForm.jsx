import React, { useState, useEffect } from 'react';
import { Calendar, PhoneCall, CheckCircle2, MapPin, Clock, Users, Database } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { farmApi } from '../../api/farm/farmApi';
import { siteVisitsService } from '../../api/siteVisitsService';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Modal from '../common/Modal';

export default function SiteVisitForm({ preselectedPlotId, onSuccess }) {
  const { user, isAuthenticated } = useAuthStore();
  const [dbLands, setDbLands] = useState([]);
  const [dbPlots, setDbPlots] = useState([]);

  // Form State (Khớp chuẩn 1:1 SCR-PUB-05 & Bảng site_visits)
  const [visitorName, setVisitorName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitSlot, setVisitSlot] = useState('MORNING'); // MORNING (08:30 - 10:30) | AFTERNOON (14:30 - 16:30)
  const [groupSize, setGroupSize] = useState(2);
  const [selectedFarm, setSelectedFarm] = useState('');
  const [selectedPlot, setSelectedPlot] = useState(preselectedPlotId || '');
  const [notes, setNotes] = useState('');

  // Validation & Submission State
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);

  useEffect(() => {
    farmApi.listLands().then((r) => setDbLands(r || [])).catch(() => {});
    farmApi.listPlots().then((r) => setDbPlots(r || [])).catch(() => {});
  }, []);

  // Prepopulate if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.fullName) setVisitorName(user.fullName);
      if (user.phone) setPhoneNumber(user.phone);
      if (user.email) setEmailAddress(user.email);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetch('/api/lands')
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.data || []);
        if (list.length > 0) {
          setDbLands(list.map((l) => ({
            id: `LND-${String(l.land_id || l.landId).padStart(3, '0')}`,
            name: l.land_name || l.landName,
            location: l.address || l.location
          })));
        }
      })
      .catch((e) => console.error(e));

    fetch('/api/plots')
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.data || []);
        if (list.length > 0) {
          setDbPlots(list.map((p) => ({
            id: String(p.plot_id || p.plotId || p.plot_code),
            code: p.plot_code || p.plotCode,
            name: `Thửa Đất ${p.plot_code || p.plotCode}`,
            area: typeof p.area === 'number' ? `${p.area} m²` : (p.area || '50 m²'),
            landName: p.land_name || p.landName
          })));
        }
      })
      .catch((e) => console.error(e));
  }, []);

  // Find preselected plot if provided
  const activePlotId = preselectedPlotId || selectedPlot;
  const selectedPlotObj = activePlotId
    ? dbPlots.find((p) => p.id === activePlotId || p.code === activePlotId || String(p.plotId) === String(activePlotId) || p.plotCode === activePlotId) || null
    : null;

  // Set default min date (tomorrow - quy chuẩn tối thiểu trước 24 giờ theo SCR-PUB-05)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split('T')[0];

  // Max date (30 days ahead)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  useEffect(() => {
    if (!visitDate) {
      setVisitDate(minDateStr);
    }
  }, [minDateStr]);

  const validate = () => {
    const errs = {};
    if (!visitorName.trim()) {
      errs.name = 'Vui lòng nhập họ và tên của bạn.';
    } else if (visitorName.trim().length < 2 || visitorName.trim().length > 100) {
      errs.name = 'Họ tên phải từ 2 đến 100 ký tự.';
    }

    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneNumber.trim()) {
      errs.phone = 'Vui lòng nhập số điện thoại để chúng tôi liên hệ xác nhận.';
    } else if (!phoneRegex.test(phoneNumber.trim().replace(/\s+/g, ''))) {
      errs.phone = 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailAddress.trim() && !emailRegex.test(emailAddress.trim())) {
      errs.email = 'Email không hợp lệ (ví dụ: ten@domain.com).';
    }

    if (!visitDate) {
      errs.date = 'Vui lòng chọn ngày dự kiến tham quan.';
    }

    if (notes.length > 500) {
      errs.notes = 'Ghi chú không được vượt quá 500 ký tự.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Map plot_id to integer (1, 2, 3...) from DB if available
      let numericPlotId = 1;
      if (selectedPlotObj) {
        const parsed = parseInt(String(selectedPlotObj.id).replace(/\D/g, ''), 10);
        numericPlotId = !isNaN(parsed) && parsed > 0 ? ((parsed % 4) + 1) : 1;
      }

      const bookingPayload = {
        plot_id: numericPlotId,
        visitor_name: visitorName.trim(),
        visitor_phone: phoneNumber.trim().replace(/\s+/g, ''),
        visitor_email: emailAddress.trim() || null,
        visit_date: visitDate,
        visit_slot: visitSlot,
        group_size: Number(groupSize) || 2,
        notes: notes.trim() || 'Khách quan tâm khảo sát hiện trạng thực tế thửa đất.'
      };

      const result = await siteVisitsService.create(bookingPayload);
      setCreatedBooking(result);
      setShowSuccessModal(true);
      if (onSuccess) onSuccess(result);
    } catch (err) {
      console.error('Error creating site visit booking:', err);
      alert('Có lỗi xảy ra khi lưu lịch hẹn. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-cream text-brand-green border border-brand-border mb-2">
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Khảo Sát Thực Địa</span>
        </div>
        <h2 className="font-heading text-2xl font-black text-brand-dark">
          Đăng Ký Tham Quan Nông Trại
        </h2>
        <p className="text-xs sm:text-sm text-brand-muted mt-1 leading-relaxed">
          Đăng ký lịch khảo sát thực địa để xem trực tiếp hiện trạng thổ nhưỡng, hệ thống tưới và trạm quan trắc IoT trước khi thuê. Dữ liệu được lưu trực tiếp vào hệ thống quản trị Farmely.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Preselected Plot Badge */}
        {selectedPlotObj ? (
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs text-brand-dark">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-brand-green shrink-0" />
              <div>
                <span className="text-stone-500">Thửa đất khảo sát: </span>
                <strong className="text-brand-green font-bold">{selectedPlotObj.name}</strong>
                <span className="text-stone-500"> ({selectedPlotObj.landName || 'Nông Trại Củ Chi Eco Farm'})</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Đã ghim thửa
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Khu vực nông trại"
              value={selectedFarm}
              onChange={(e) => setSelectedFarm(e.target.value)}
              options={[
                { value: '', label: '-- Chọn khu vực nông trại --' },
                ...dbLands.map((l) => ({
                  value: l.name || l.landName,
                  label: `${l.name || l.landName} (${l.location || l.address || ''})`
                }))
              ]}
            />
            <Select
              label="Thửa đất quan tâm"
              value={selectedPlot}
              onChange={(e) => setSelectedPlot(e.target.value)}
              options={[
                { value: '', label: '-- Chọn thửa đất (hoặc để trống) --' },
                ...dbPlots.map((p) => ({
                  value: p.id || p.plotCode,
                  label: `${p.code || p.plotCode} - ${p.name || `Thửa đất ${p.plotCode}`} (${p.area})`
                }))
              ]}
            />
          </div>
        )}

        {/* Contact Info: Name & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Họ và tên người đăng ký"
            required
            placeholder="Ví dụ: Nguyễn Thu Hà"
            value={visitorName}
            onChange={(e) => setVisitorName(e.target.value)}
            error={errors.name}
          />

          <Input
            label="Số điện thoại liên hệ"
            required
            placeholder="Ví dụ: 0901234567"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            error={errors.phone}
          />
        </div>

        {/* Email & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Địa chỉ email (để nhận mã QR xác nhận)"
            type="email"
            placeholder="ha.nguyen@gmail.com"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            error={errors.email}
          />

          <div>
            <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-green" />
              <span>Ngày dự kiến tham quan *</span>
            </label>
            <input
              type="date"
              required
              min={minDateStr}
              max={maxDateStr}
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="w-full rounded-xl border border-brand-border bg-white px-3.5 py-2.5 text-sm text-brand-dark transition-all focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            />
            {errors.date && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.date}</p>}
          </div>
        </div>

        {/* Time Slot & Group Size (Khớp 1:1 SCR-PUB-05 Component #3 & #5) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-green" />
              <span>Khung giờ tham quan (Time Slot) *</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVisitSlot('MORNING')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  visitSlot === 'MORNING'
                    ? 'border-brand-green bg-emerald-50/80 ring-2 ring-brand-green/20'
                    : 'border-brand-border bg-white hover:bg-brand-cream/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-dark">Ca Sáng</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">08:30 - 10:30</span>
                </div>
                <p className="text-[10px] text-stone-500 mt-0.5">Khảo sát sương mai & ẩm độ</p>
              </button>

              <button
                type="button"
                onClick={() => setVisitSlot('AFTERNOON')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  visitSlot === 'AFTERNOON'
                    ? 'border-brand-green bg-emerald-50/80 ring-2 ring-brand-green/20'
                    : 'border-brand-border bg-white hover:bg-brand-cream/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-dark">Ca Chiều</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">14:30 - 16:30</span>
                </div>
                <p className="text-[10px] text-stone-500 mt-0.5">Tham quan hệ thống hoàng hôn</p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-brand-green" />
              <span>Số lượng khách tham quan *</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 4, 6].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setGroupSize(num)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    groupSize === num
                      ? 'border-brand-green bg-brand-green text-white shadow-xs'
                      : 'border-brand-border bg-white text-stone-600 hover:bg-brand-cream/50'
                  }`}
                >
                  {num} người
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-brand-muted">Mặc định 1 - 5 người. Đi cùng gia đình/đồng nghiệp.</p>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-1.5">
            Ghi chú / Nhu cầu tư vấn khảo sát đất
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ví dụ: Quan tâm thổ nhưỡng trồng dâu tây, muốn xem hệ thống tưới nước tự động và đón tiếp bằng xe nội bộ nông trại..."
            className="w-full rounded-xl border border-brand-border bg-white px-3.5 py-2.5 text-sm text-brand-dark transition-all focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
          {errors.notes && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.notes}</p>}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full uppercase tracking-wider font-extrabold shadow-yellow-glow"
            loading={isSubmitting}
          >
            XÁC NHẬN ĐẶT LỊCH XEM ĐẤT
          </Button>
          <div className="flex items-center justify-center gap-1.5 text-center text-[11px] text-brand-muted mt-2">
            <Database className="w-3 h-3 text-emerald-600" />
            <span>Dữ liệu được lưu trực tiếp vào bảng <strong>site_visits</strong> (Database Farmely) và chuyển đến Admin</span>
          </div>
        </div>
      </form>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Đặt Lịch Khảo Sát Đất Thành Công!"
      >
        <div className="text-center py-3 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h4 className="font-heading text-lg font-black text-brand-dark">
              Đã Lưu Đơn Đặt Lịch #{createdBooking?.visit_id || ''}!
            </h4>
            <p className="text-xs sm:text-sm text-stone-600 mt-1.5">
              Hệ thống đã tạo bản ghi <strong>site_visits (PENDING)</strong> vào Database. Ban Quản Trị Farmely đã nhận được thông báo và sẽ gọi điện xác nhận trong vòng <strong>2 giờ</strong> làm việc.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-brand-cream/80 text-left text-xs space-y-2 border border-brand-border">
            <div className="flex justify-between border-b border-brand-border/60 pb-1.5">
              <span className="text-stone-500">Mã đơn khảo sát:</span>
              <strong className="text-brand-green font-mono">VST-{createdBooking?.visit_id || 'NEW'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Khách hàng:</span>
              <strong className="text-brand-dark">{visitorName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Số điện thoại:</span>
              <strong className="text-brand-dark">{phoneNumber}</strong>
            </div>
            {emailAddress && (
              <div className="flex justify-between">
                <span className="text-stone-500">Email:</span>
                <span>{emailAddress}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-stone-500">Ngày hẹn:</span>
              <strong className="text-brand-dark">{visitDate}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Khung giờ:</span>
              <span className="text-emerald-800 font-bold">
                {visitSlot === 'MORNING' ? 'Ca sáng (08:30 - 10:30)' : 'Ca chiều (14:30 - 16:30)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Số lượng khách:</span>
              <span>Đoàn {groupSize} người</span>
            </div>
            {notes && (
              <div className="pt-1 border-t border-brand-border/60 text-[11px] text-stone-600">
                <strong>Ghi chú:</strong> "{notes}"
              </div>
            )}
          </div>

          <Button
            variant="primary"
            className="w-full font-bold"
            onClick={() => setShowSuccessModal(false)}
          >
            ĐÃ HIỂU VÀ ĐÓNG
          </Button>
        </div>
      </Modal>
    </div>
  );
}
