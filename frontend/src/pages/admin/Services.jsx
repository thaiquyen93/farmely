import React, { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, CheckCircle2, Database, Plus, RefreshCw } from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useServiceStore } from '../../stores/serviceStore';

const initialForm = {
  name: '',
  serviceType: 'A_LA_CARTE',
  price: '80000',
  unit: 'lần/luống',
  description: ''
};

export default function Services() {
  const { services, loading, error, loadServices, addService, toggleService } = useServiceStore();
  const [selectedId, setSelectedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    loadServices().catch(() => {});
  }, [loadServices]);

  useEffect(() => {
    if (!selectedId && services.length) setSelectedId(services[0].serviceId);
  }, [selectedId, services]);

  const selectedService = useMemo(
    () => services.find((service) => service.serviceId === selectedId) || services[0],
    [services, selectedId]
  );

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setActionError('');
    try {
      const created = await addService({
        serviceName: form.name.trim(),
        serviceType: form.serviceType,
        price: Number(form.price),
        unit: form.unit.trim(),
        description: form.description.trim(),
        status: 'ACTIVE'
      });
      setSelectedId(created.serviceId);
      setShowCreate(false);
      setForm(initialForm);
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!selectedService) return;
    setSaving(true);
    setActionError('');
    try {
      await toggleService(selectedService.serviceId);
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-green">
              <Database className="h-4 w-4" /> Đồng bộ PostgreSQL
            </div>
            <h2 className="font-heading text-2xl font-black text-brand-dark">Danh mục dịch vụ canh tác</h2>
            <p className="mt-1 text-sm text-brand-muted">Dữ liệu hiển thị trực tiếp từ bảng services và được dùng chung với trang khách hàng.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" icon={RefreshCw} disabled={loading} onClick={() => loadServices(true).catch(() => {})}>Tải lại</Button>
            <Button icon={Plus} onClick={() => setShowCreate(true)}>Thêm dịch vụ</Button>
          </div>
        </div>
      </section>

      {(error || actionError) && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">
          Không thể đồng bộ dịch vụ: {actionError || error}
        </div>
      )}

      {loading && services.length === 0 ? (
        <div className="rounded-2xl border border-brand-border bg-white p-12 text-center text-sm font-bold text-brand-muted">Đang tải dịch vụ từ database…</div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <section className="overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm">
            <div className="border-b border-brand-border px-5 py-4">
              <h3 className="font-heading text-lg font-black text-brand-dark">Danh sách dịch vụ</h3>
              <p className="text-xs text-brand-muted">{services.length} dịch vụ • {services.filter((item) => item.active).length} đang hoạt động</p>
            </div>
            <div className="max-h-[650px] divide-y divide-brand-border overflow-y-auto">
              {services.map((service) => (
                <button key={service.serviceId} type="button" onClick={() => setSelectedId(service.serviceId)} className={`w-full p-4 text-left transition-colors hover:bg-brand-cream/60 ${selectedId === service.serviceId ? 'bg-emerald-50/70' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-brand-muted">{service.serviceCode}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${service.active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'}`}>{service.active ? 'Đang bán' : 'Tạm ẩn'}</span>
                      </div>
                      <p className="mt-1 truncate font-heading text-base font-black text-brand-dark">{service.name}</p>
                      <p className="mt-1 text-xs text-brand-muted">{service.serviceType} • {service.unit || 'Chưa có đơn vị'}</p>
                    </div>
                    <p className="shrink-0 font-heading text-sm font-black text-brand-green">{service.price.toLocaleString('vi-VN')} đ</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm">
            {selectedService ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">{selectedService.serviceCode}</p>
                    <h3 className="mt-1 font-heading text-xl font-black text-brand-dark">{selectedService.name}</h3>
                  </div>
                  <span className="rounded-xl bg-brand-cream px-3 py-1 text-xs font-bold text-brand-green">{selectedService.serviceType}</span>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <Info label="Giá" value={`${selectedService.price.toLocaleString('vi-VN')} đ`} />
                  <Info label="Đơn vị" value={selectedService.unit || '—'} />
                  <Info label="Trạng thái" value={selectedService.active ? 'ACTIVE' : 'INACTIVE'} />
                  <Info label="ID database" value={String(selectedService.serviceId)} />
                </dl>
                <div className="rounded-xl bg-brand-cream/60 p-4 text-sm leading-relaxed text-brand-muted">{selectedService.description || 'Chưa có mô tả.'}</div>
                <Button variant={selectedService.active ? 'outline' : 'primary'} icon={CheckCircle2} loading={saving} onClick={handleToggle}>
                  {selectedService.active ? 'Tạm ẩn dịch vụ' : 'Kích hoạt dịch vụ'}
                </Button>
              </div>
            ) : <p className="text-sm text-brand-muted">Chưa có dịch vụ trong database.</p>}
          </section>
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Thêm dịch vụ canh tác" subtitle="Dịch vụ mới sẽ được lưu trực tiếp vào PostgreSQL" maxWidth="max-w-2xl">
        <form onSubmit={handleCreate} className="space-y-5">
          <Field label="Tên dịch vụ"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="field-control" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Loại dịch vụ"><select value={form.serviceType} onChange={(event) => setForm({ ...form, serviceType: event.target.value })} className="field-control"><option value="A_LA_CARTE">Dịch vụ lẻ</option><option value="FULL">Gói chăm sóc</option></select></Field>
            <Field label="Giá niêm yết (VND)"><input required min="1" type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="field-control" /></Field>
            <Field label="Đơn vị"><input required value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} className="field-control" /></Field>
          </div>
          <Field label="Mô tả"><textarea required rows="4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="field-control" /></Field>
          {actionError && <p role="alert" className="text-sm font-bold text-rose-700">{actionError}</p>}
          <div className="flex justify-end gap-3"><Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Hủy</Button><Button type="submit" loading={saving}>Lưu vào database</Button></div>
        </form>
      </Modal>
    </div>
  );
}

function Info({ label, value }) {
  return <div className="rounded-xl border border-brand-border p-3"><dt className="text-[10px] font-bold uppercase text-brand-muted">{label}</dt><dd className="mt-1 font-black text-brand-dark">{value}</dd></div>;
}

function Field({ label, children }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-bold text-brand-dark">{label}</span>{children}</label>;
}
