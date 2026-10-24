import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, CalendarDays, Camera, CheckCheck, ChevronDown,
  ClipboardList, ImagePlus, Leaf, MapPin, MessageCircle, MoreHorizontal, Paperclip,
  Send, Sprout, Users, X
} from 'lucide-react';

const ROLES = [
  { id: 'customer', label: 'Khách hàng', name: 'Lô Thái Quyền', initials: 'Q', color: 'bg-[#e8f2ec] text-[#176244]' },
  { id: 'expert', label: 'Chuyên gia', name: 'ThS. Nguyễn Hoàng Nam', initials: 'N', color: 'bg-[#fff2ce] text-[#775919]' },
  { id: 'staff', label: 'Nhân viên', name: 'Trần Văn Lực', initials: 'L', color: 'bg-[#e7eef8] text-[#3a5f90]' }
];

const INITIAL_MESSAGES = [
  { id: 'm1', type: 'system', time: '08:41', text: 'Phòng trao đổi được tạo cho Thửa P-01 · Vụ cà chua Cherry F1.' },
  { id: 'm2', type: 'message', role: 'customer', time: '08:42', text: 'Anh Lực ơi, mấy lá non gần ngọn có chấm bạc. Có cần xử lý ngay không?' },
  { id: 'm3', type: 'report', role: 'staff', time: '08:45', text: 'Em vừa kiểm tra luống 2, thấy rầy mềm ở mặt dưới lá non. Em đã khoanh vùng, chưa phun thuốc và gửi ảnh để chuyên gia xem giúp.' },
  { id: 'm4', type: 'message', role: 'expert', time: '08:53', text: 'Ảnh cho thấy rầy mềm mới xuất hiện, phạm vi còn hẹp. Tạm thời không phun cả luống; xử lý khu vực đã đánh dấu theo hướng dẫn bên dưới.' },
  { id: 'm5', type: 'task', role: 'expert', time: '08:55', title: 'Xử lý rầy mềm khu vực luống 2', assignee: 'Trần Văn Lực', due: 'Hôm nay · trước 16:00', status: 'Đang thực hiện', detail: 'Tỉa lá bị nặng, phun chế phẩm sinh học khu trú sau 16:00. Chụp ảnh trước và sau xử lý.' },
  { id: 'm6', type: 'message', role: 'customer', time: '08:57', text: 'Mình đã nắm được. Cảm ơn anh Nam, cứ cập nhật kết quả vào đây giúp mình nhé.' }
];

function Avatar({ role, size = 'h-9 w-9' }) {
  const config = ROLES.find((item) => item.id === role) || ROLES[0];
  return <span className={`${size} ${config.color} inline-flex shrink-0 items-center justify-center rounded-full text-sm font-black`}>{config.initials}</span>;
}

function LeafEvidence() {
  return (
    <div className="relative mt-3 flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border border-[#d6e2d8] bg-[#edf4ee] sm:w-64">
      <svg viewBox="0 0 220 120" className="h-full w-full" role="img" aria-label="Ảnh minh họa lá có dấu hiệu rầy mềm">
        <rect width="220" height="120" fill="#e8f1e9" />
        <path d="M20 94C42 73 56 55 76 20M77 21c31-13 73-5 93 16-8 39-49 62-88 47-16-7-25-27-5-63Z" fill="#4e996e" />
        <path d="M77 21c-4 23 0 44 5 63m-3-26 48-28m-44 48 59-30m-40-14 40 20" fill="none" stroke="#c7e0c9" strokeWidth="2" />
        <g fill="#243f2d"><circle cx="105" cy="40" r="2.4"/><circle cx="121" cy="52" r="2.2"/><circle cx="137" cy="37" r="2.4"/><circle cx="147" cy="61" r="2.1"/><circle cx="112" cy="68" r="2"/><circle cx="159" cy="49" r="2.1"/></g>
        <g fill="#d1c881"><circle cx="92" cy="46" r="4"/><circle cx="129" cy="71" r="3"/><circle cx="153" cy="34" r="3.5"/></g>
      </svg>
      <span className="absolute bottom-2 left-2 rounded-md bg-white/90 px-2 py-1 text-[10px] font-semibold text-[#526a59]">Ảnh minh họa · bản xem thử</span>
    </div>
  );
}

export default function ChatRoomPreview() {
  const [roleId, setRoleId] = useState('customer');
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [draft, setDraft] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('Xử lý rầy mềm khu vực luống 2');
  const role = ROLES.find((item) => item.id === roleId) || ROLES[0];
  const visibleMessages = useMemo(() => messages, [messages]);

  const sendMessage = (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((current) => [...current, { id: `m-${Date.now()}`, type: 'message', role: roleId, time: 'Bây giờ', text }]);
    setDraft('');
  };

  const addFieldReport = () => {
    setMessages((current) => [...current, {
      id: `report-${Date.now()}`, type: 'report', role: 'staff', time: 'Bây giờ',
      text: 'Báo cáo mới tại luống 2: em phát hiện thêm dấu hiệu trên lá non, đã khoanh vùng và gửi ảnh để chuyên gia kiểm tra.'
    }]);
  };

  const assignTask = (event) => {
    event.preventDefault();
    if (!taskTitle.trim()) return;
    setMessages((current) => [...current, {
      id: `task-${Date.now()}`, type: 'task', role: 'expert', time: 'Bây giờ',
      title: taskTitle.trim(), assignee: 'Trần Văn Lực', due: 'Hôm nay · trước 16:00',
      status: 'Chờ xác nhận', detail: 'Vui lòng chụp ảnh trước và sau khi xử lý.'
    }]);
    setShowTaskModal(false);
  };

  return (
    <div className="min-h-screen bg-[#f2f5f0] text-[#17392b]">
      <header className="sticky top-0 z-30 border-b border-[#dce5dd] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/" aria-label="Về trang chủ" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e7f1e9] text-[#08724c] hover:bg-[#dcebe0]"><ArrowLeft className="h-4 w-4" /></Link>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d4f36e] text-[#154a31]"><Sprout className="h-5 w-5" /></div>
            <div className="min-w-0"><p className="font-heading text-sm font-black tracking-wide">FARMELY</p><p className="hidden text-[11px] text-[#77887d] sm:block">Phòng chat mẫu · không kết nối dữ liệu thật</p></div>
          </div>
          <div className="flex w-full shrink-0 items-center gap-1 rounded-xl border border-[#dce5dd] bg-[#f7f9f6] p-1 sm:w-auto" aria-label="Chọn vai trò xem trước">
            {ROLES.map((item) => <button key={item.id} type="button" onClick={() => setRoleId(item.id)} className={`flex-1 rounded-lg px-2.5 py-2 text-[11px] font-bold transition sm:flex-none sm:px-3 sm:text-xs ${roleId === item.id ? 'bg-[#174e39] text-white shadow-sm' : 'text-[#5e7165] hover:bg-white'}`}>{item.label}</button>)}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-3 py-4 sm:px-7 sm:py-7">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-6">
          <div><p className="text-xs font-semibold text-[#698072]">Cùng một phòng · góc nhìn {role.label.toLowerCase()}</p><h1 className="mt-1 font-heading text-2xl font-black tracking-tight sm:text-3xl">Trao đổi về thửa đất</h1></div>
          <span className="rounded-full border border-[#cfdfd2] bg-white px-3 py-1.5 text-[11px] font-bold text-[#597563]">BẢN MOCK GIAO DIỆN</span>
        </div>

        <section className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#dce5dd] bg-white px-4 py-4 shadow-[0_2px_12px_rgba(22,61,40,0.04)] sm:mb-5 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e9f3e9] text-[#247347]"><Leaf className="h-5 w-5" /></div>
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-heading text-base font-black sm:text-lg">Thửa P-01</h2><span className="rounded-full bg-[#e7f3e9] px-2.5 py-1 text-[10px] font-bold text-[#286344]">Đang canh tác</span></div><p className="mt-0.5 truncate text-xs text-[#6d7e73]">Cà chua bi Cherry F1 · Vụ 13/09–02/12/2026</p></div>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#64796b]"><Users className="h-4 w-4 text-[#41815a]" /><span>3 người trong nhóm</span><div className="ml-1 flex -space-x-2"><Avatar role="customer" size="h-7 w-7" /><Avatar role="expert" size="h-7 w-7" /><Avatar role="staff" size="h-7 w-7" /></div></div>
        </section>

        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-5">
          <section className="flex min-h-[620px] min-w-0 flex-col overflow-hidden rounded-2xl border border-[#dce5dd] bg-white shadow-[0_5px_24px_rgba(22,61,40,0.05)] sm:min-h-[700px]">
            <header className="flex items-center justify-between gap-3 border-b border-[#e7ece7] px-4 py-3.5 sm:px-5">
              <div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#164c37] text-white"><MessageCircle className="h-5 w-5" /></div><div className="min-w-0"><h2 className="truncate text-sm font-extrabold">Nhóm chăm sóc · P-01</h2><p className="mt-0.5 text-[11px] text-[#74857a]">Khách hàng, chuyên gia và nhân viên phụ trách</p></div></div>
              <button type="button" aria-label="Tùy chọn phòng chat" className="rounded-lg p-2 text-[#718277] hover:bg-[#f2f6f2]"><MoreHorizontal className="h-5 w-5" /></button>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto bg-[#fbfcfa] px-3 py-5 sm:px-6 sm:py-6">
              <div className="flex justify-center"><span className="rounded-full bg-[#edf2ed] px-3 py-1 text-[10px] font-semibold text-[#748278]">Hôm nay · 08:41</span></div>
              {visibleMessages.map((message) => {
                if (message.type === 'system') return <div key={message.id} className="mx-auto flex max-w-md items-center justify-center gap-2 rounded-xl border border-[#e2e9e2] bg-white px-3 py-2 text-center text-[11px] text-[#748278]"><Sprout className="h-3.5 w-3.5 shrink-0 text-[#5b9669]" />{message.text}</div>;
                const author = ROLES.find((item) => item.id === message.role) || ROLES[0];
                const mine = message.role === roleId;
                if (message.type === 'task') return <div key={message.id} className="mx-auto w-full max-w-lg rounded-2xl border border-[#ecdcae] bg-[#fffaf0] p-4 sm:p-5"><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f4e8be] text-[#80611e]"><ClipboardList className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-bold uppercase tracking-wide text-[#8a6a28]">Nhiệm vụ được giao</span><span className="rounded-full bg-[#f5e7bd] px-2 py-0.5 text-[10px] font-bold text-[#765918]">Ưu tiên cao</span></div><h3 className="mt-1.5 text-sm font-extrabold leading-5 text-[#3f3b2d]">{message.title}</h3><p className="mt-2 text-xs leading-5 text-[#6f6956]">{message.detail}</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-[#756a4c]"><span>Người làm: {message.assignee}</span><span>Hạn: {message.due}</span></div><div className="mt-3 flex items-center justify-between border-t border-[#eee3c7] pt-3"><span className="text-[11px] font-bold text-[#80611e]">{message.status}</span>{roleId === 'staff' && <button type="button" onClick={() => setMessages((current) => current.map((item) => item.id === message.id ? { ...item, status: 'Đã hoàn thành' } : item))} className="rounded-lg bg-[#174e39] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#103e2d]">Cập nhật task</button>}</div></div></div></div>;
                const isReport = message.type === 'report';
                return <div key={message.id} className={`flex items-end gap-2.5 ${mine ? 'flex-row-reverse' : ''}`}>
                  {!mine && <Avatar role={message.role} size="h-8 w-8" />}
                  <div className={`max-w-[88%] sm:max-w-[76%] ${mine ? 'items-end' : 'items-start'} flex min-w-0 flex-col`}>
                    <div className={`mb-1 flex items-center gap-2 px-1 text-[10px] text-[#79887e] ${mine ? 'flex-row-reverse' : ''}`}><span className="font-bold">{mine ? 'Bạn' : author.name}</span><span>{author.label}</span></div>
                    <div className={`rounded-2xl px-3.5 py-3 text-[13px] leading-5 sm:px-4 ${mine ? 'rounded-br-md bg-[#174e39] text-white' : 'rounded-bl-md border border-[#e0e8e1] bg-white text-[#334a3b]'}`}>
                      {isReport && <div className={`mb-2 flex items-center gap-1.5 text-[10px] font-bold ${mine ? 'text-[#d8efbd]' : 'text-[#8b6222]'}`}><Camera className="h-3.5 w-3.5" />Báo cáo hiện trường</div>}
                      <p>{message.text}</p>
                      {isReport && <LeafEvidence />}
                      <div className={`mt-2 flex items-center justify-end gap-1 text-[10px] ${mine ? 'text-white/65' : 'text-[#99a59b]'}`}>{message.time}{mine && <CheckCheck className="h-3.5 w-3.5" />}</div>
                    </div>
                    {isReport && roleId === 'expert' && <button type="button" onClick={() => setShowTaskModal(true)} className="mt-2 rounded-lg border border-[#d8e4d9] bg-white px-3 py-2 text-[11px] font-bold text-[#245b3c] hover:bg-[#f1f7f1]">Giao task cho Trần Văn Lực</button>}
                  </div>
                </div>;
              })}
            </div>

            <form onSubmit={sendMessage} className="border-t border-[#e4ebe4] bg-white p-3 sm:p-4">
              {roleId === 'staff' && <div className="mb-2 flex items-center justify-between gap-2 px-1"><span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#63786a]"><Camera className="h-3.5 w-3.5" />Gửi kèm ảnh cho nhóm phụ trách</span><button type="button" onClick={addFieldReport} className="rounded-lg border border-[#d9e5da] bg-white px-2.5 py-1.5 text-[10px] font-bold text-[#37654a] hover:bg-[#f1f7f1]">Báo sự cố</button></div>}
              <div className="flex items-center gap-2 rounded-xl border border-[#dbe5dc] bg-[#f9fbf8] p-1.5 focus-within:border-[#8cae91]">
                <button type="button" aria-label={roleId === 'staff' ? 'Đính kèm ảnh hiện trường' : 'Đính kèm tệp'} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#718579] hover:bg-white"><Paperclip className="h-4 w-4" /></button>
                {roleId === 'staff' && <button type="button" aria-label="Chụp ảnh hiện trường" className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#718579] hover:bg-white sm:flex"><ImagePlus className="h-4 w-4" /></button>}
                <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={roleId === 'staff' ? 'Cập nhật cho nhóm...' : 'Viết tin nhắn...'} className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-[#9aa79d]" aria-label="Nội dung tin nhắn" />
                {roleId === 'expert' && <button type="button" onClick={() => setShowTaskModal(true)} className="hidden items-center gap-1.5 rounded-lg border border-[#d9e5da] px-3 py-2 text-[11px] font-bold text-[#37654a] hover:bg-white sm:flex"><ClipboardList className="h-4 w-4" />Giao task</button>}
                <button type="submit" aria-label="Gửi tin nhắn" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#174e39] text-white transition hover:bg-[#103e2d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#80aa86]"><Send className="h-4 w-4" /></button>
              </div>
            </form>
          </section>

          <aside className="space-y-4 xl:sticky xl:top-[92px] xl:self-start">
            <section className="rounded-2xl border border-[#dce5dd] bg-white p-4 sm:p-5">
              <div className="flex items-center justify-between"><h2 className="text-sm font-extrabold">Đội phụ trách</h2><span className="text-[10px] font-semibold text-[#819087]">Được admin phân công</span></div>
              <div className="mt-4 space-y-3">{ROLES.map((member) => <div key={member.id} className="flex items-center gap-3"><Avatar role={member.id} /><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{member.name}</p><p className="mt-0.5 text-[10px] text-[#78877d]">{member.label}{member.id === 'staff' ? ' · hiện trường' : member.id === 'expert' ? ' · kỹ thuật' : ' · chủ thửa'}</p></div>{member.id === roleId && <span className="rounded-full bg-[#eaf3ec] px-2 py-1 text-[9px] font-bold text-[#386348]">Bạn</span>}</div>)}</div>
            </section>

            <section className="rounded-2xl border border-[#dce5dd] bg-white p-4 sm:p-5">
              <div className="flex items-center justify-between"><h2 className="text-sm font-extrabold">Đang theo dõi</h2><button type="button" aria-label="Thu gọn thông tin thửa" className="rounded-lg p-1 text-[#87958b] hover:bg-[#f3f6f3]"><ChevronDown className="h-4 w-4" /></button></div>
              <div className="mt-3 rounded-xl bg-[#f5f8f4] p-3.5"><div className="flex items-start gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#4c805b]" /><div><p className="text-xs font-bold">Thửa P-01</p><p className="mt-1 text-[11px] leading-4 text-[#77877b]">Happy Valley · 150 m²</p></div></div><div className="mt-3 flex items-start gap-2.5 border-t border-[#e4ebe3] pt-3"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#4c805b]" /><div><p className="text-xs font-bold">Cà chua bi Cherry F1</p><p className="mt-1 text-[11px] text-[#77877b]">Ngày 41/80 · dự kiến thu 02/12</p></div></div></div>
            </section>

            <section className="rounded-2xl border border-[#e8dfc2] bg-[#fffdf7] p-4 sm:p-5">
              <div className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-[#96722c]" /><h2 className="text-sm font-extrabold">Task đang mở</h2></div>
              <p className="mt-3 text-xs font-bold leading-5">Xử lý rầy mềm khu vực luống 2</p><div className="mt-2 flex items-center justify-between gap-2"><span className="text-[10px] text-[#788278]">Trần Văn Lực · hôm nay</span><span className="rounded-full bg-[#f4e8bd] px-2 py-1 text-[9px] font-bold text-[#775a1b]">Ưu tiên cao</span></div>
              {roleId === 'customer' ? <p className="mt-3 border-t border-[#eee7d1] pt-3 text-[11px] leading-4 text-[#776b49]">Bạn có thể theo dõi tiến độ tại đây; Farmely sẽ cập nhật khi hoàn thành.</p> : roleId === 'expert' ? <button type="button" onClick={() => setShowTaskModal(true)} className="mt-3 w-full rounded-lg border border-[#e4d7b0] bg-white px-3 py-2 text-[11px] font-bold text-[#755a22] hover:bg-[#fff9e7]">Giao / cập nhật task</button> : <button type="button" onClick={() => setMessages((current) => current.map((item) => item.type === 'task' ? { ...item, status: 'Đã hoàn thành' } : item))} className="mt-3 w-full rounded-lg bg-[#174e39] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#103e2d]">Cập nhật tiến độ</button>}
            </section>
            <p className="px-1 text-[10px] leading-4 text-[#88958b]">Lịch sử phòng chat gắn với thửa đất và mùa vụ này. Thành viên phụ trách do admin phân công.</p>
          </aside>
        </div>
      </main>

      {showTaskModal && <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#10261b]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowTaskModal(false); }}><form onSubmit={assignTask} className="w-full max-w-md rounded-t-3xl border border-[#dbe5dc] bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-black">Giao task từ báo cáo</h2><p className="mt-1 text-xs text-[#718176]">Task sẽ gửi cho đúng staff đã báo cáo sự cố.</p></div><button type="button" onClick={() => setShowTaskModal(false)} aria-label="Đóng" className="rounded-lg p-1.5 text-[#748378] hover:bg-[#f1f5f1]"><X className="h-5 w-5" /></button></div><label className="mt-5 block text-xs font-bold text-[#40574a]">Tên nhiệm vụ<input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#d7e2d8] px-3 py-3 text-sm font-medium outline-none focus:border-[#6e9a78]" /></label><div className="mt-3 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#f4f7f3] p-3"><p className="text-[10px] font-semibold text-[#79887d]">NGƯỜI THỰC HIỆN</p><p className="mt-1 text-xs font-bold">Trần Văn Lực</p></div><div className="rounded-xl bg-[#f4f7f3] p-3"><p className="text-[10px] font-semibold text-[#79887d]">MỨC ƯU TIÊN</p><p className="mt-1 text-xs font-bold text-[#95671e]">Cao · từ sự cố</p></div></div><label className="mt-3 block text-xs font-bold text-[#40574a]">Hạn hoàn thành<input type="datetime-local" defaultValue="2026-10-24T16:00" className="mt-1.5 w-full rounded-xl border border-[#d7e2d8] px-3 py-3 text-sm font-medium outline-none focus:border-[#6e9a78]" /></label><div className="mt-5 flex gap-2"><button type="button" onClick={() => setShowTaskModal(false)} className="flex-1 rounded-xl border border-[#d7e2d8] px-4 py-3 text-sm font-bold text-[#5e7165]">Hủy</button><button type="submit" className="flex-1 rounded-xl bg-[#174e39] px-4 py-3 text-sm font-bold text-white hover:bg-[#103e2d]">Giao task</button></div><p className="mt-3 text-center text-[10px] text-[#8a968d]">Mock tương tác · không tạo nhiệm vụ thật</p></form></div>}
      <footer className="pb-6 text-center text-[10px] text-[#849188]">Farmely · Mockup phòng chat nhóm</footer>
    </div>
  );
}
