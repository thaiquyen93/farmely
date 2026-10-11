import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Plus,
  Sparkles,
  Trash2,
  Users
} from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useServiceStore } from '../../stores/serviceStore';

const emptyTask = () => ({ offset: 0, title: '', assignee: 'STAFF', evidence: true });

export default function Services() {
  const { services, addService } = useServiceStore();
  const [selectedId, setSelectedId] = useState(services[0]?.id);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: 'Dịch vụ một lần',
    price: '80000',
    duration: '1',
    tasks: [emptyTask()]
  });

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedId) || services[0],
    [services, selectedId]
  );

  const updateTask = (index, field, value) => {
    setForm((current) => ({
      ...current,
      tasks: current.tasks.map((task, taskIndex) =>
        taskIndex === index ? { ...task, [field]: value } : task
      )
    }));
  };

  const handleCreate = (event) => {
    event.preventDefault();
    const service = {
      id: `SVC-${String(services.length + 1).padStart(3, '0')}`,
      name: form.name.trim(),
      category: form.category,
      customerCategory: form.category === 'Trọn vụ' ? 'FULL' : form.category === 'Chăm sóc định kỳ' ? 'CYCLE' : 'SINGLE',
      price: Number(form.price),
      duration: Number(form.duration),
      unit: `/ ${form.duration} ngày`,
      tag: form.category,
      iconKey: 'sprout',
      active: true,
      description: 'Dịch vụ canh tác do Farmely thiết lập từ Master Data.',
      tasks: form.tasks.filter((task) => task.title.trim())
    };
    addService(service);
    setSelectedId(service.id);
    setShowCreate(false);
    setForm({ name: '', category: 'Dịch vụ một lần', price: '80000', duration: '1', tasks: [emptyTask()] });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-green">
              <BriefcaseBusiness className="h-4 w-4" /> Danh mục dịch vụ
            </div>
            <h2 className="font-heading text-2xl font-black text-brand-dark">Dịch vụ canh tác & mẫu CareTask</h2>
            <p className="mt-1 max-w-3xl text-sm text-brand-muted">
              Thiết lập dịch vụ khách có thể thuê và các đầu việc mẫu sẽ dùng khi vận hành đơn hàng.
            </p>
          </div>
          <Button icon={Plus} onClick={() => setShowCreate(true)}>Thêm dịch vụ</Button>
        </div>

        <div className="mt-5 grid gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
          <FlowItem icon={BriefcaseBusiness} label="1. Dịch vụ" detail="Admin cấu hình" />
          <ArrowRight className="hidden h-4 w-4 text-brand-green sm:block" />
          <FlowItem icon={CheckCircle2} label="2. Đơn đã thanh toán" detail="Backend xác nhận" />
          <ArrowRight className="hidden h-4 w-4 text-brand-green sm:block" />
          <FlowItem icon={ClipboardCheck} label="3. CareTask" detail="Sinh từ mẫu & giao việc" />
        </div>
        <p className="mt-2 text-xs text-brand-muted">
          Bản này thiết lập UI và dữ liệu mẫu. Tự sinh CareTask theo thanh toán, lịch và nhân sự là luồng backend ở bước tích hợp sau.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <section className="overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm">
          <div className="border-b border-brand-border px-5 py-4">
            <h3 className="font-heading text-lg font-black text-brand-dark">Danh sách dịch vụ</h3>
            <p className="text-xs text-brand-muted">{services.length} cấu hình • {services.filter((item) => item.active).length} đang hoạt động</p>
          </div>
          <div className="divide-y divide-brand-border">
            {services.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => setSelectedId(service.id)}
                className={`w-full p-4 text-left transition-colors hover:bg-brand-cream/60 ${selectedId === service.id ? 'bg-emerald-50/70' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-brand-muted">{service.id}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${service.active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'}`}>
                        {service.active ? 'Đang bán' : 'Tạm ẩn'}
                      </span>
                    </div>
                    <p className="mt-1 truncate font-heading text-base font-black text-brand-dark">{service.name}</p>
                    <p className="mt-1 text-xs text-brand-muted">{service.category} • {service.duration} ngày • {service.tasks.length} CareTask mẫu</p>
                  </div>
                  <p className="shrink-0 font-heading text-sm font-black text-brand-green">{service.price.toLocaleString('vi-VN')} đ</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">CareTask blueprint</p>
              <h3 className="mt-1 font-heading text-xl font-black text-brand-dark">{selectedService.name}</h3>
            </div>
            <span className="rounded-xl bg-brand-cream px-3 py-1 text-xs font-bold text-brand-green">{selectedService.duration} ngày</span>
          </div>
          <div className="mt-5 space-y-3">
            {selectedService.tasks.map((task, index) => (
              <div key={`${task.title}-${index}`} className="relative rounded-xl border border-brand-border bg-brand-cream/45 p-3 pl-11">
                <span className="absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand-green text-xs font-black text-white">{index + 1}</span>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-brand-dark">{task.title}</p>
                  <span className="rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-brand-green">Ngày +{task.offset}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-brand-muted">
                  <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {task.assignee === 'EXPERT' ? 'Chuyên gia' : 'Nhân viên hiện trường'}</span>
                  <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> {task.evidence ? 'Bắt buộc minh chứng' : 'Không bắt buộc ảnh'}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Thêm dịch vụ canh tác"
        subtitle="Cấu hình thông tin bán và mẫu CareTask vận hành"
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tên dịch vụ" className="sm:col-span-2">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ví dụ: Chăm sóc rau 7 ngày" className="field-control" />
            </Field>
            <Field label="Nhóm dịch vụ">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="field-control">
                <option>Dịch vụ một lần</option><option>Chăm sóc định kỳ</option><option>Trọn vụ</option>
              </select>
            </Field>
            <Field label="Giá niêm yết (VND)">
              <input required min="0" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="field-control" />
            </Field>
            <Field label="Thời lượng (ngày)">
              <input required min="1" type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="field-control" />
            </Field>
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-cream/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="font-heading font-black text-brand-dark">Mẫu CareTask</h4>
                <p className="text-xs text-brand-muted">Các bước sẽ được backend nhân bản khi đơn dịch vụ đủ điều kiện.</p>
              </div>
              <Button type="button" size="sm" variant="outline" icon={Plus} onClick={() => setForm((current) => ({ ...current, tasks: [...current.tasks, emptyTask()] }))}>Thêm bước</Button>
            </div>
            <div className="mt-4 space-y-3">
              {form.tasks.map((task, index) => (
                <div key={index} className="grid gap-3 rounded-xl border border-brand-border bg-white p-3 sm:grid-cols-[80px_minmax(0,1fr)_150px_auto] sm:items-end">
                  <Field label="Ngày +"><input type="number" min="0" value={task.offset} onChange={(e) => updateTask(index, 'offset', Number(e.target.value))} className="field-control" /></Field>
                  <Field label="Tên công việc"><input required value={task.title} onChange={(e) => updateTask(index, 'title', e.target.value)} className="field-control" /></Field>
                  <Field label="Người thực hiện"><select value={task.assignee} onChange={(e) => updateTask(index, 'assignee', e.target.value)} className="field-control"><option value="STAFF">Nhân viên</option><option value="EXPERT">Chuyên gia</option></select></Field>
                  <button type="button" onClick={() => setForm((current) => ({ ...current, tasks: current.tasks.filter((_, taskIndex) => taskIndex !== index) }))} disabled={form.tasks.length === 1} className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-stone-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30" aria-label={`Xóa bước ${index + 1}`}><Trash2 className="h-4 w-4" /></button>
                  <label className="flex items-center gap-2 text-xs font-semibold text-brand-muted sm:col-span-4"><input type="checkbox" checked={task.evidence} onChange={(e) => updateTask(index, 'evidence', e.target.checked)} className="h-4 w-4 accent-emerald-700" /> Bắt buộc ảnh minh chứng khi hoàn tất</label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Hủy</Button>
            <Button type="submit" icon={Sparkles}>Lưu dịch vụ & blueprint</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function FlowItem({ icon: Icon, label, detail }) {
  return <div className="flex items-center gap-3 rounded-xl bg-white/80 p-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-green text-white"><Icon className="h-4 w-4" /></span><span><b className="block text-sm text-brand-dark">{label}</b><small className="text-brand-muted">{detail}</small></span></div>;
}

function Field({ label, className = '', children }) {
  return <label className={`block ${className}`}><span className="mb-1.5 block text-xs font-bold text-brand-dark">{label}</span>{children}</label>;
}
