import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, FileText, CheckCircle2, MapPin } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { plotsData } from '../../data/plots';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Modal from '../common/Modal';

export default function SiteVisitForm({ preselectedPlotId, onSuccess }) {
  const { user, isAuthenticated } = useAuthStore();

  // Form State
  const [visitorName, setVisitorName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [selectedPlot, setSelectedPlot] = useState(preselectedPlotId || 'PLT-101');
  const [visitDate, setVisitDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('MORNING');
  const [groupSize, setGroupSize] = useState('2');
  const [notes, setNotes] = useState('');

  // Validation State
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Prepopulate if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.fullName) setVisitorName(user.fullName);
      if (user.phone) setPhoneNumber(user.phone);
      if (user.email) setEmailAddress(user.email);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (preselectedPlotId) {
      setSelectedPlot(preselectedPlotId);
    }
  }, [preselectedPlotId]);

  // Set default min date (24 hours from today)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split('T')[0];

  // Max date (30 days ahead)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  const validate = () => {
    const errs = {};
    if (!visitorName.trim()) {
      errs.name = 'Vui lòng nhập họ và tên của bạn.';
    } else if (visitorName.trim().length < 2 || visitorName.trim().length > 100) {
      errs.name = 'Họ tên phải từ 2 đến 100 ký tự.';
    }

    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneNumber.trim()) {
      errs.phone = 'Vui lòng nhập số điện thoại.';
    } else if (!phoneRegex.test(phoneNumber.trim())) {
      errs.phone = 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailAddress.trim()) {
      errs.email = 'Vui lòng nhập địa chỉ email.';
    } else if (!emailRegex.test(emailAddress.trim())) {
      errs.email = 'Email không hợp lệ (ví dụ: ten@domain.com).';
    }

    if (!visitDate) {
      errs.date = 'Vui lòng chọn ngày tham quan nông trại.';
    }

    const grp = parseInt(groupSize, 10);
    if (isNaN(grp) || grp < 1 || grp > 5) {
      errs.groupSize = 'Quy mô đoàn tham quan từ 1 đến 5 người.';
    }

    if (notes.length > 500) {
      errs.notes = 'Ghi chú không được vượt quá 500 ký tự.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    // Simulate API request
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccessModal(true);
      if (onSuccess) onSuccess();
    }, 600);
  };

  const selectedPlotObj = plotsData.find((p) => p.id === selectedPlot);

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-brand-border shadow-sm">
      <div className="mb-6">
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-cream text-brand-green border border-brand-border">
          Mã màn hình: SCR-PUB-05
        </span>
        <h2 className="font-heading text-2xl font-bold text-brand-dark mt-2">
          Đặt Lịch Tham Quan Vườn Thực Tế
        </h2>
        <p className="text-xs sm:text-sm text-brand-muted mt-1 leading-relaxed">
          Tham quan trang trại là <strong>tùy chọn tự do</strong> và <strong>không bắt buộc</strong> trước khi thuê. Đội ngũ kỹ thuật viên sẽ dẫn bạn khảo sát thực địa đất, nguồn nước và trạm IoT.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Họ và tên người đại diện"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Địa chỉ email nhận xác nhận"
            type="email"
            required
            placeholder="email@example.com"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            error={errors.email}
          />

          <Select
            label="Thửa đất dự định khảo sát"
            required
            value={selectedPlot}
            onChange={(e) => setSelectedPlot(e.target.value)}
            options={plotsData.map((p) => ({
              value: p.id,
              label: `${p.code} - ${p.name} (${p.area} tại ${p.landName})`
            }))}
          />
        </div>

        {selectedPlotObj && (
          <div className="p-3 rounded-xl bg-brand-cream/60 border border-brand-border/80 flex items-center gap-3 text-xs">
            <MapPin className="w-4 h-4 text-brand-green shrink-0" />
            <div className="truncate">
              <span className="font-bold text-brand-dark">{selectedPlotObj.name}: </span>
              <span className="text-stone-600">{selectedPlotObj.soilType} | {selectedPlotObj.formattedPrice}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-1.5">
              Ngày tham quan <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              min={minDateStr}
              max={maxDateStr}
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-brand-dark transition-all focus:outline-none focus:ring-2 focus:ring-brand-green/20 ${
                errors.date ? 'border-rose-400' : 'border-brand-border'
              }`}
            />
            {errors.date && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.date}</p>}
            <p className="mt-1 text-[11px] text-brand-muted">Từ 24h đến 30 ngày tới</p>
          </div>

          <Select
            label="Khung giờ ca trực"
            required
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value)}
            options={[
              { value: 'MORNING', label: 'Ca sáng (08:30 – 10:30)' },
              { value: 'AFTERNOON', label: 'Ca chiều (14:30 – 16:30)' }
            ]}
          />

          <Select
            label="Quy mô đoàn (người)"
            required
            value={groupSize}
            onChange={(e) => setGroupSize(e.target.value)}
            options={[
              { value: '1', label: '1 người' },
              { value: '2', label: '2 người' },
              { value: '3', label: '3 người' },
              { value: '4', label: '4 người' },
              { value: '5', label: '5 người (Tối đa)' }
            ]}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-1.5">
            Ghi chú / Yêu cầu đặc biệt (tối đa 500 ký tự)
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ví dụ: Đi cùng gia đình có trẻ nhỏ, muốn xem hệ thống cảm biến độ ẩm đất..."
            className="w-full rounded-xl border border-brand-border bg-white px-3.5 py-2.5 text-sm text-brand-dark transition-all focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
          {errors.notes && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.notes}</p>}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full uppercase tracking-wider font-extrabold"
            loading={isSubmitting}
          >
            XÁC NHẬN ĐẶT LỊCH THAM QUAN
          </Button>
        </div>
      </form>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Lên Lịch Tham Quan Thành Công!"
      >
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h4 className="font-heading text-lg font-bold text-brand-dark">
              Inspection scheduled.
            </h4>
            <p className="text-xs text-brand-muted mt-1">
              Trạng thái đơn: <strong className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">PENDING_CONFIRMATION</strong>
            </p>
            <p className="text-sm text-stone-600 mt-2">
              Nhân viên trang trại Farmely sẽ gọi điện xác nhận lịch hẹn với bạn trong vòng <strong>2 giờ</strong> làm việc.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-brand-cream text-left text-xs space-y-1.5 border border-brand-border">
            <p><strong>Khách tham quan:</strong> {visitorName} ({phoneNumber})</p>
            <p><strong>Ngày hẹn:</strong> {visitDate} ({timeSlot === 'MORNING' ? '08:30 - 10:30' : '14:30 - 16:30'})</p>
            <p><strong>Thửa đất:</strong> {selectedPlotObj?.code} - {selectedPlotObj?.name}</p>
          </div>
          <Button
            variant="primary"
            className="w-full"
            onClick={() => setShowSuccessModal(false)}
          >
            ĐÃ HIỂU VÀ ĐÓNG
          </Button>
        </div>
      </Modal>
    </div>
  );
}
