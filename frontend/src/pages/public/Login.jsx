import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Shield, Sprout, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useAuthStore, DEMO_ACCOUNTS } from '../../stores/authStore';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const res = login(email, password);
      if (res.success) {
        setSuccessMessage(`Welcome back, ${res.user.fullName}.`);
        setTimeout(() => {
          if (redirectParam) {
            navigate(redirectParam);
          } else if (res.user.role === 'ADMIN') {
            navigate('/admin/dashboard');
          } else if (res.user.role === 'EXPERT') {
            navigate('/expert/dashboard');
          } else if (res.user.role === 'STAFF') {
            navigate('/staff/dashboard');
          } else {
            navigate('/');
          }
        }, 600);
      } else {
        setErrorMessage('Incorrect email or password.');
      }
    }, 500);
  };

  const handleQuickDemoLogin = (acc) => {
    setEmail(acc.email);
    setPassword('Farmely@2026');
    setErrorMessage('');
    const res = login(acc.email, 'Farmely@2026');
    setSuccessMessage(`Welcome back, ${res.user.fullName}.`);
    setTimeout(() => {
      if (redirectParam) {
        navigate(redirectParam);
      } else if (res.user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (res.user.role === 'EXPERT') {
        navigate('/expert/dashboard');
      } else if (res.user.role === 'STAFF') {
        navigate('/staff/dashboard');
      } else {
        navigate('/');
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-brand-cream flex">
      {/* LEFT: Cinematic Agriculture Photography */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-brand-dark">
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=85"
          alt="Cánh đồng Farmely"
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
            Nông Nghiệp Số Hóa 4.0
          </span>
          <h2 className="text-3xl font-heading font-black text-white leading-tight mb-3">
            Đồng hành cùng bạn trên từng luống rau sạch.
          </h2>
          <p className="text-sm text-stone-300 leading-relaxed max-w-md">
            Hệ thống IoT quan trắc vi khí hậu liên tục, quy trình VietGAP khép kín và minh bạch tối đa dữ liệu canh tác.
          </p>
        </div>
      </div>

      {/* RIGHT: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          
          <div>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-cream text-brand-green border border-brand-border">
                Mã: SCR-PUB-03
              </span>
              <Link to="/" className="text-xs font-bold text-brand-green hover:underline">
                ← Về trang chủ
              </Link>
            </div>
            <h1 className="font-heading text-3xl font-black text-brand-dark mt-3">
              Đăng Nhập Tài Khoản
            </h1>
            <p className="text-xs sm:text-sm text-brand-muted mt-1.5">
              Chào mừng bạn trở lại với nền tảng canh tác thông minh Farmely.
            </p>

            {redirectParam && (
              <div className="mt-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Yêu cầu đăng nhập (Sign In Required)</span>
                  <span className="text-[11px] text-amber-800">
                    Vui lòng đăng nhập để tiếp tục bước hoàn tất thủ tục thuê thửa đất (Book Plot).
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Demo Switcher Banner */}
          <div className="p-3.5 rounded-2xl bg-white border border-brand-border shadow-sm space-y-2">
            <p className="text-[11px] font-bold text-brand-muted uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-brand-yellow" />
              Đăng nhập nhanh các Role Demo (1-Click):
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleQuickDemoLogin(acc)}
                  className="px-2.5 py-1.5 rounded-xl bg-brand-cream hover:bg-brand-yellow/20 border border-brand-border text-left transition-colors flex items-center justify-between"
                >
                  <span className="font-bold text-brand-dark truncate">{acc.role}</span>
                  <span className="text-[10px] text-brand-green">Vào ngay →</span>
                </button>
              ))}
            </div>
          </div>

          {/* Alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Địa chỉ Email"
              type="email"
              required
              placeholder="ten@farmely.vn"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Mật khẩu"
              type="password"
              required
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-stone-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-brand-border text-brand-green focus:ring-brand-green/20"
                />
                <span>Remember me (Ghi nhớ tôi)</span>
              </label>

              <Link to="/forgot-password" className="font-semibold text-brand-green hover:underline">
                Quên mật khẩu?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full uppercase tracking-wider font-extrabold text-sm"
              loading={isLoading}
            >
              ĐĂNG NHẬP
            </Button>

            <div className="text-center pt-2 text-xs text-stone-600">
              Chưa có tài khoản?{' '}
              <Link
                to={redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register'}
                className="font-bold text-brand-green hover:underline"
              >
                Đăng ký tài khoản mới
              </Link>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
