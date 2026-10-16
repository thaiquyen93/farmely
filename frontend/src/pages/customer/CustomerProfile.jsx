import React, { useEffect, useMemo, useState } from 'react';
import { Camera, CheckCircle2, FileText, MapPin, Phone, Save, Settings, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import CustomerAccountLayout from '../../components/customer/CustomerAccountLayout';
import { apiFetch, unwrapData } from '../../api/apiClient';
import { useAuthStore } from '../../stores/authStore';

const emptyExtra = { birthDate: '', gender: '', province: 'Thành phố Hồ Chí Minh', district: 'Quận Bình Thạnh', ward: 'Phường 22', emergencyName: '', emergencyPhone: '' };

export default function CustomerProfile() {
  const { user, updateUser, refreshUser } = useAuthStore();
  const storageKey = `farmely_profile_${user?.userId || user?.id || user?.email}`;
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', address: '', ...emptyExtra });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    setForm({ ...emptyExtra, ...saved, fullName: user?.fullName || '', email: user?.email || '', phone: user?.phoneNumber || user?.phone || saved.phone || '', address: user?.address || saved.address || '' });
    refreshUser().catch(() => {});
  }, [storageKey, user?.fullName, user?.email, user?.phoneNumber, user?.phone, user?.address, refreshUser]);

  const initials = useMemo(() => (form.fullName || 'F').trim().split(/\s+/).at(-1)?.[0]?.toUpperCase() || 'F', [form.fullName]);
  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setMessage('');
    try {
      const id = user?.userId || user?.id;
      const updated = unwrapData(await apiFetch(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify({ fullName: form.fullName, phoneNumber: form.phone, address: form.address }) }));
      localStorage.setItem(storageKey, JSON.stringify(form));
      updateUser({ ...updated, phone: updated.phoneNumber });
      setMessage('Đã lưu hồ sơ cá nhân.');
    } catch (err) { setError(err.message || 'Không thể lưu hồ sơ.'); }
    finally { setSaving(false); }
  };

  const fieldClass = 'mt-1.5 w-full rounded-xl border border-[#cfd9d2] bg-white px-3.5 py-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100';
  return <CustomerAccountLayout>
    <div className="mb-7"><p className="text-sm text-stone-500">Tài khoản / Hồ sơ cá nhân</p><div className="mt-2 flex items-center justify-between gap-3"><h1 className="font-heading text-3xl font-black">Hồ sơ cá nhân</h1><Link to="/customer/settings" className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-[#cfd9d2] bg-white px-3 text-sm font-bold text-emerald-800 shadow-sm"><Settings className="h-4 w-4" /><span className="hidden sm:inline">Cài đặt</span></Link></div><p className="mt-1 text-sm text-stone-500">Quản lý thông tin liên hệ và địa chỉ nhận nông sản.</p></div>
    <form onSubmit={save} className="grid gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-[#d8dfd9] bg-white p-6 text-center shadow-sm">
        <div className="relative mx-auto flex h-32 w-32 items-center justify-center rounded-full border-4 border-[#e4ece6] bg-[#dfece3] text-5xl font-black text-emerald-900">{initials}<button type="button" aria-label="Đổi ảnh đại diện" className="absolute bottom-1 right-0 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-emerald-700 text-white"><Camera className="h-5 w-5" /></button></div>
        <h2 className="mt-5 text-xl font-black">{form.fullName || 'Khách hàng Farmely'}</h2><p className="mt-1 text-sm text-stone-500">{form.email}</p><span className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Khách hàng thuê đất</span>
        <dl className="mt-6 space-y-4 border-t border-stone-200 pt-5 text-left text-sm"><div className="flex justify-between gap-3"><dt className="text-stone-500">Mã khách hàng</dt><dd className="font-bold">KH-{String(user?.userId || user?.id || 1).padStart(6, '0')}</dd></div><div className="flex justify-between gap-3"><dt className="text-stone-500">Trạng thái</dt><dd className="flex items-center gap-1 font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" />Đã xác thực</dd></div></dl>
      </aside>
      <section className="rounded-2xl border border-[#d8dfd9] bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-3 border-b border-stone-200 pb-4"><UserRound className="h-6 w-6 text-emerald-700" /><div><h2 className="text-xl font-black">Thông tin cá nhân</h2><p className="text-sm text-stone-500">Các trường có dấu * là thông tin chính của tài khoản.</p></div></div>
        {message && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{message}</p>}{error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}
        <div className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-sm font-bold">Họ và tên *<input value={form.fullName} onChange={(e) => setField('fullName', e.target.value)} className={fieldClass} required /></label><label className="text-sm font-bold">Email<input value={form.email} className={`${fieldClass} bg-stone-100 text-stone-500`} disabled /></label><label className="text-sm font-bold">Số điện thoại *<input value={form.phone} onChange={(e) => setField('phone', e.target.value)} className={fieldClass} required /></label><label className="text-sm font-bold">Ngày sinh<input type="date" value={form.birthDate} onChange={(e) => setField('birthDate', e.target.value)} className={fieldClass} /></label></div>
        <div className="mt-6"><h3 className="flex items-center gap-2 font-black"><MapPin className="h-5 w-5 text-emerald-700" />Địa chỉ giao nhận nông sản</h3><div className="mt-3 grid gap-4 md:grid-cols-3"><label className="text-sm font-bold">Tỉnh/Thành phố<input value={form.province} onChange={(e) => setField('province', e.target.value)} className={fieldClass} /></label><label className="text-sm font-bold">Quận/Huyện<input value={form.district} onChange={(e) => setField('district', e.target.value)} className={fieldClass} /></label><label className="text-sm font-bold">Phường/Xã<input value={form.ward} onChange={(e) => setField('ward', e.target.value)} className={fieldClass} /></label></div><label className="mt-4 block text-sm font-bold">Địa chỉ chi tiết<textarea value={form.address} onChange={(e) => setField('address', e.target.value)} className={`${fieldClass} min-h-20 resize-y`} /></label></div>
        <div className="mt-6"><h3 className="flex items-center gap-2 font-black"><Phone className="h-5 w-5 text-emerald-700" />Liên hệ khẩn cấp</h3><div className="mt-3 grid gap-4 md:grid-cols-2"><label className="text-sm font-bold">Họ tên người liên hệ<input value={form.emergencyName} onChange={(e) => setField('emergencyName', e.target.value)} className={fieldClass} /></label><label className="text-sm font-bold">Số điện thoại<input value={form.emergencyPhone} onChange={(e) => setField('emergencyPhone', e.target.value)} className={fieldClass} /></label></div></div>
        <div className="mt-7 grid gap-3 border-t border-stone-200 pt-5 sm:flex sm:flex-wrap sm:items-center sm:justify-between"><div className="flex flex-wrap gap-4"><Link to="/customer/dashboard?view=contracts" className="flex min-h-11 items-center gap-2 text-sm font-bold text-emerald-800"><FileText className="h-4 w-4" />Xem hợp đồng thuê đất</Link><Link to="/customer/settings" className="flex min-h-11 items-center gap-2 text-sm font-bold text-emerald-800 sm:hidden"><Settings className="h-4 w-4" />Cài đặt tài khoản</Link></div><button disabled={saving} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Đang lưu...' : 'Lưu hồ sơ'}</button></div>
      </section>
    </form>
  </CustomerAccountLayout>;
}
