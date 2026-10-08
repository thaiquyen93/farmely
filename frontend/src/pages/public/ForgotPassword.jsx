import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Sprout, CheckCircle2, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ email của bạn.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Địa chỉ email không đúng định dạng.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-brand-cream flex">
      {/* LEFT: Cinematic Agriculture Photography */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-brand-dark">
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=85"
          alt="Khôi phục tài khoản Farmely"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/40 to-transparent" />

        <div className="absolute top-10 left-10 flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-brand-yellow flex items-center justify-center text-brand-dark shadow-sm">
            <Sprout className="w-5 h-5 text-brand-dark stroke-[2.5]" />
          </div>
          <span className="font-heading text-2xl font-black tracking-wider text-white">
            FARMELY
          </span>
        </div>

        <div className="absolute bottom-12 left-12 right-12 text-white">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-brand-yellow uppercase tracking-wider inline-block mb-4 border border-white/20">
            Bảo Mật & Khôi Phục Tài Khoản
          </span>
          <h2 className="text-3xl font-heading font-black text-white leading-tight mb-3">
            An tâm quản lý vườn rau của bạn.
          </h2>
          <p className="text-sm text-stone-300 leading-relaxed max-w-md">
            Mọi dữ liệu thửa đất thuê, cảm biến IoT và nhật ký canh tác của bạn được mã hóa an toàn trên hệ thống Farmely.
          </p>
        </div>
      </div>

      {/* RIGHT: Forgot Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          <div>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-cream text-brand-green border border-brand-border">
                Screen Flow: Forgot Password
              </span>
              <Link to="/login" className="text-xs font-bold text-brand-green hover:underline flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại Đăng nhập</span>
              </Link>
            </div>
            <h1 className="font-heading text-3xl font-black text-brand-dark mt-3">
              Quên Mật Khẩu?
            </h1>
            <p className="text-xs sm:text-sm text-brand-muted mt-1.5 leading-relaxed">
              Nhập email đã đăng ký tài khoản. Chúng tôi sẽ gửi mã xác thực khôi phục mật khẩu trong giây lát.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Địa chỉ Email của bạn"
                type="email"
                required
                placeholder="ten@farmely.vn"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full uppercase tracking-wider font-extrabold text-sm"
                loading={isLoading}
              >
                GỬI MÃ XÁC THỰC KHÔI PHỤC
              </Button>

              <div className="text-center pt-2 text-xs text-stone-600">
                Nhớ mật khẩu?{' '}
                <Link to="/login" className="font-bold text-brand-green hover:underline">
                  Đăng nhập tại đây
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-5 bg-white p-6 rounded-2xl border border-brand-border shadow-sm">
              <div className="flex items-center gap-3 text-emerald-700">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-brand-dark">
                    Đã Gửi Hướng Dẫn Khôi Phục!
                  </h3>
                  <p className="text-xs text-brand-muted">
                    Vui lòng kiểm tra hòm thư của bạn: <strong>{email}</strong>
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-700" />
                  Mã OTP Demo Mẫu: <span className="font-mono text-sm font-black bg-amber-200/70 px-2 py-0.5 rounded">FARM-8829</span>
                </p>
                <p className="text-[11px] text-amber-800">
                  Hệ thống thử nghiệm đã kích hoạt mã OTP tạm thời. Bạn có thể đặt lại mật khẩu mới hoặc quay lại đăng nhập.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link to="/login">
                  <Button variant="primary" size="md" className="w-full uppercase font-bold text-xs">
                    QUAY LẠI ĐĂNG NHẬP
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="text-xs text-brand-muted hover:text-brand-dark underline text-center pt-1"
                >
                  Nhập email khác
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
