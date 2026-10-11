import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { User, Mail, Phone, Lock, CheckCircle2, AlertCircle, Sprout, Info } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const { register } = useAuthStore();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};

    // V1.1 Full Name
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      errs.fullName = 'Vui lòng nhập họ và tên.';
    } else if (trimmedName.length < 2 || trimmedName.length > 100) {
      errs.fullName = 'Họ tên phải từ 2 đến 100 ký tự.';
    }

    // V1.2 Email Address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errs.email = 'Vui lòng nhập địa chỉ email.';
    } else if (!emailRegex.test(email.trim())) {
      errs.email = 'This email address is invalid.';
    }

    // V1.3 Phone Number: ^0[0-9]{9}$
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phone.trim()) {
      errs.phone = 'Vui lòng nhập số điện thoại.';
    } else if (!phoneRegex.test(phone.trim())) {
      errs.phone = 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0.';
    }

    // V1.4 Password: min 8 chars, >= 1 uppercase, >= 1 lowercase, >= 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!password) {
      errs.password = 'Vui lòng nhập mật khẩu.';
    } else if (!passwordRegex.test(password)) {
      errs.password = 'Password must contain at least 8 characters with uppercase, lowercase, and numbers.';
    }

    // V1.5 Confirm Password
    if (!confirmPassword) {
      errs.confirmPassword = 'Vui lòng xác nhận lại mật khẩu.';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim()
      });
      setSuccessMsg('Account created successfully. Please sign in.');
      setTimeout(() => {
        navigate(redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login');
      }, 1200);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-brand-cream flex">
      {/* LEFT: Agriculture Photography */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-brand-dark">
        <img
          src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1600&q=85"
          alt="Canh tác Farmely"
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
            Cộng Đồng Khách Hàng Đô Thị
          </span>
          <h2 className="text-3xl font-heading font-black text-white leading-tight mb-3">
            Gieo mầm hy vọng, gặt hái nông sản sạch thực thụ.
          </h2>
          <p className="text-sm text-stone-300 leading-relaxed max-w-md">
            Mỗi lượt thuê là một hợp đồng khép kín. Minh bạch từ hạt giống F1 ban đầu, theo dõi vi khí hậu đến khi thu hoạch.
          </p>
        </div>
      </div>

      {/* RIGHT: Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-6">
          
          <div>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-cream text-brand-green border border-brand-border">
                Mã: SCR-PUB-02
              </span>
              <Link to="/" className="text-xs font-bold text-brand-green hover:underline">
                ← Về trang chủ
              </Link>
            </div>
            <h1 className="font-heading text-3xl font-black text-brand-dark mt-3">
              Tạo Tài Khoản Khách Hàng
            </h1>
            <p className="text-xs sm:text-sm text-brand-muted mt-1.5">
              Đăng ký để thuê thửa đất canh tác và theo dõi rau sạch của riêng bạn.
            </p>
          </div>

          {/* Success Toast / Notification */}
          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Họ và tên"
              required
              placeholder="Ví dụ: Nguyễn Thu Hà"
              icon={User}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={errors.fullName}
            />

            <Input
              label="Địa chỉ Email"
              type="email"
              required
              placeholder="thuha@example.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />

            <Input
              label="Số điện thoại (10 chữ số)"
              type="tel"
              required
              placeholder="0901234567"
              icon={Phone}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={errors.phone}
            />

            <Input
              label="Mật khẩu"
              type="password"
              required
              placeholder="Tối thiểu 8 ký tự (hoa, thường, số)"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />

            <Input
              label="Xác nhận mật khẩu"
              type="password"
              required
              placeholder="Nhập lại mật khẩu"
              icon={Lock}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full uppercase tracking-wider font-extrabold text-sm"
                loading={isLoading}
              >
                TẠO TÀI KHOẢN
              </Button>
            </div>

            <div className="text-center pt-2 text-xs text-stone-600">
              Đã có tài khoản?{' '}
              <Link
                to={redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'}
                className="font-bold text-brand-green hover:underline"
              >
                Đăng nhập ngay
              </Link>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
