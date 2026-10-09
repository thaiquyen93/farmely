import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, BellRing, BookOpen, Camera, Leaf, Sprout } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import Hero from '../../components/public/Hero';
import SiteVisitForm from '../../components/public/SiteVisitForm';
import { landsData } from '../../data/lands';

const benefits = [
  { icon: Leaf, title: 'Biết vườn đang ra sao', text: 'Xem tình trạng độ ẩm, nhiệt độ và tiến độ cây trồng bằng lời giải thích dễ hiểu.' },
  { icon: BellRing, title: 'Được nhắc khi cần chăm', text: 'Khi vườn thiếu nước hoặc có điều kiện bất thường, bạn nhận cảnh báo và biết bước tiếp theo.' },
  { icon: Camera, title: 'Thấy việc đã làm', text: 'Ảnh hiện trường và nhật ký cho biết hôm nay vườn đã được chăm sóc như thế nào.' },
  { icon: BookOpen, title: 'Theo dõi tới ngày thu hoạch', text: 'Xem mốc phát triển và kết quả thu hoạch để chủ động nhận nông sản.' },
];

export default function Home() {
  const location = useLocation();
  useEffect(() => {
    if (location.hash) setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [location.hash]);
  return <div className="min-h-screen bg-brand-cream">
    <PublicNavbar />
    <Hero />
    <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-9 max-w-2xl"><p className="text-xs font-bold uppercase tracking-widest text-brand-green">Cách bắt đầu</p><h2 className="mt-2 font-heading text-3xl font-black text-brand-dark">Một mảnh vườn của riêng bạn</h2></div>
      <div className="grid gap-5 md:grid-cols-3">
        {[
          ['01', 'Chọn đất', 'Xem khu đất trên bản đồ và chọn plot phù hợp với diện tích, giá thuê, cây muốn trồng.'],
          ['02', 'Chọn cách chăm', 'Tự canh tác hoặc chọn dịch vụ để đội ngũ Farmely chăm vườn giúp bạn.'],
          ['03', 'Theo dõi và thu hoạch', 'Xem nhật ký, nhận cảnh báo và chọn cách nhận nông sản khi đến kỳ.'],
        ].map(([number, title, text]) => <div key={number} className="rounded-2xl border border-brand-border bg-white p-6"><span className="text-sm font-black text-brand-green">{number}</span><h3 className="mt-3 font-heading text-xl font-bold text-brand-dark">{title}</h3><p className="mt-2 text-sm leading-relaxed text-brand-muted">{text}</p></div>)}
      </div>
    </section>
    <section id="iot-benefits" className="bg-brand-dark py-20 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl"><p className="text-xs font-bold uppercase tracking-widest text-brand-yellow">Theo dõi vườn từ xa</p><h2 className="mt-2 font-heading text-3xl font-black text-white">Bạn nhận được gì khi vườn được theo dõi?</h2><p className="mt-3 text-sm leading-relaxed text-white/75">Dữ liệu tại vườn được đổi thành thông tin hữu ích để bạn yên tâm và quyết định đúng lúc.</p></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{benefits.map(item => <div key={item.title} className="rounded-2xl border border-white/15 bg-white/10 p-5"><item.icon className="mb-4 text-brand-yellow" size={27} /><h3 className="font-heading text-lg font-bold text-white">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-white/75">{item.text}</p></div>)}</div>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-green">Các khu đất</p><h2 className="mt-2 font-heading text-3xl font-black text-brand-dark">Khám phá nơi bạn có thể trồng</h2></div><Link to="/marketplace" className="inline-flex items-center gap-2 font-bold text-brand-green">Xem bản đồ plot <ArrowRight size={18} /></Link></div>
      <div className="grid gap-5 md:grid-cols-3">{landsData.map(land => <Link key={land.id} to={`/marketplace?landId=${land.id}`} className="group overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm"><img src={land.imageUrl} alt="Ảnh cảnh quan minh họa" className="h-44 w-full object-cover transition-transform group-hover:scale-105" /><div className="p-5"><h3 className="font-heading text-lg font-bold text-brand-dark">{land.name}</h3><p className="mt-1 text-sm text-brand-muted">{land.location}</p></div></Link>)}</div>
    </section>
    <section id="book-visit" className="scroll-mt-24 border-t border-brand-border bg-white py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:px-8"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-green">Tham quan miễn phí</p><h2 className="mt-2 font-heading text-3xl font-black text-brand-dark">Đến xem vườn trước khi chọn</h2><p className="mt-4 text-sm leading-relaxed text-brand-muted">Điền lịch ngay bên cạnh. Bạn có thể xem khu đất, hỏi về cách chăm và quyết định sau buổi tham quan.</p><div className="mt-6 flex items-center gap-3 rounded-2xl bg-brand-cream p-4 text-sm text-brand-dark"><Sprout className="text-brand-green" /> Tham quan là tùy chọn, không bắt buộc trước khi thuê.</div></div><SiteVisitForm /></div>
    </section>
    <Footer />
  </div>;
}
