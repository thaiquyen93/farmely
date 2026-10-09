import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  return <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-brand-dark pt-20 text-white">
    <img src="/images/Mucangchai3.jpg" alt="Cảnh quan nông trại" className="absolute inset-0 h-full w-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/95 via-brand-dark/75 to-brand-dark/20" />
    <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="mb-4 text-sm font-bold uppercase tracking-[.18em] text-brand-yellow">Farmely · Thuê đất và trồng rau</p>
        <h1 className="font-heading text-4xl font-black leading-[1.08] text-white sm:text-6xl">THUÊ VÀ CANH TÁC TẠI FARMELY</h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-white/90">Chọn một thửa đất, tự chăm sóc hoặc để Farmely chăm vườn giúp bạn. Theo dõi tiến độ và nhận nông sản khi đến kỳ thu hoạch.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/marketplace" className="inline-flex items-center gap-2 rounded-xl bg-brand-yellow px-6 py-3 font-bold text-brand-dark hover:bg-yellow-300">Xem khu đất <ArrowRight size={18} /></Link>
          <a href="#book-visit" className="rounded-xl border border-white/60 px-6 py-3 font-bold text-white hover:bg-white/10">Đặt lịch tham quan</a>
        </div>
      </div>
    </div>
  </section>;
}
